"""A row of men singing one half of a Samri verse.

An Arabic text-to-speech voice (Piper "ar_JO-kareem", run with onnxruntime) says the half once, and we
read from the model exactly where every sound starts and ends. WORLD then takes the voice apart (the
pitch, the shape of the mouth, the breath) and puts it back together with each syllable moved onto its
pulse in the rhythm, its vowel held for as long as the note lasts, and the pitch of the tune. A few takes,
each sung by two men with different mouths, tunings and timings, make the row.

render_row(half, part, row) -> (audio at 22050 Hz, lead): `lead` is how many seconds of the audio come
before the first pulse, so the caller can start it that much early and land the first syllable on the beat.
"""
import os, json, threading
import numpy as np, onnx, onnxruntime as ort, pyworld as pw, scipy.signal as sg

SR = 22050; HOP = 256; FP = 5.0; DT = FP / 1000
HERE = os.path.dirname(os.path.abspath(__file__))
MODEL = os.environ.get('SAMRI_TTS_MODEL', os.path.join(HERE, 'models', 'ar_JO-kareem-medium.onnx'))
VOWELS = set('aiueo')
UNVOICED = {'s', 'sˤ', 'h', 'ʃ', 't', 'k', 'q', 'f', 'x', 'ħ', 'ʔ', 'θ', 'tˤ', 'tʃ'}
SONORANT = {'l', 'r', 'n', 'm', 'w', 'j', 'ɣ'}
# the two rows: different men (their mouths: formant scales), and the first row a little brighter
ROWS = [
    dict(formants=[0.935, 0.96, 0.985, 1.0, 1.02, 1.045], effort=0.75, seed=101),
    dict(formants=[0.92, 0.95, 0.975, 0.995, 1.015, 1.04], effort=0.6, seed=202),
]


def is_vowel(p): return p[0] in VOWELS
def hz(m): return 440.0 * 2 ** ((np.asarray(m, dtype=float) - 69) / 12)


class Voice:
    """The text-to-speech model, with its per-sound durations brought out as a second output."""
    _one = None; _lock = threading.Lock()

    @classmethod
    def get(cls):
        with cls._lock:
            if cls._one is None: cls._one = Voice(MODEL)
            return cls._one

    def __init__(self, path):
        cache = os.environ.get('SAMRI_CACHE', os.path.dirname(path))
        dur = os.path.join(cache, os.path.basename(path).replace('.onnx', '.dur.onnx'))
        if not os.path.exists(dur):
            m = onnx.load(path)
            m.graph.output.append(onnx.helper.make_tensor_value_info('/Ceil_output_0', onnx.TensorProto.FLOAT, None))
            onnx.save(m, dur)
        so = ort.SessionOptions(); so.intra_op_num_threads = 1; so.log_severity_level = 3
        self.sess = ort.InferenceSession(dur, so, providers=['CPUExecutionProvider'])
        j = json.load(open(path + '.json', encoding='utf-8'))
        self.map = {k: (v if isinstance(v, list) else [v]) for k, v in j['phoneme_id_map'].items()}

    def say(self, phones, length=1.35, noise=0.667, noise_w=0.8):
        """phones: list of sounds (e.g. 'dʒ', 'aː') or ' ' between words. Returns audio and each sound's (start, end) in seconds."""
        mp = self.map
        ids = [mp['^'][0], mp['_'][0]]; owner = [-1, -1]
        for k, ph in enumerate(phones):
            for ch in ph:
                if ch not in mp: raise KeyError('the voice has no sound %r' % ch)
                ids += [mp[ch][0], mp['_'][0]]; owner += [k, k]
        ids.append(mp['$'][0]); owner.append(-1)
        out, dur = self.sess.run(None, {'input': np.array([ids], dtype=np.int64), 'input_lengths': np.array([len(ids)], dtype=np.int64),
                                        'scales': np.array([noise, length, noise_w], dtype=np.float32)})
        audio = out.reshape(-1).astype(np.float64); dur = dur.reshape(-1)
        edges = np.concatenate([[0], np.cumsum(dur)]) * HOP / SR
        owner = np.array(owner); seg = []
        for k in range(len(phones)):
            idx = np.where(owner == k)[0]
            seg.append((float(edges[idx[0]]), float(edges[idx[-1] + 1])))
        return audio, seg


class Take:
    """One spoken take of the half, taken apart by WORLD."""
    def __init__(self, syl, length):
        phones = []; self.map = []
        for s in syl:
            if s.get('gap') and phones: phones.append(' ')
            idx = []
            for p in s['ph']: idx.append(len(phones)); phones.append(p)
            self.map.append(idx)
        self.phones = phones
        x, seg = Voice.get().say(phones, length=length)
        self.x = x; self.seg = seg
        f0, t = pw.dio(x, SR, f0_floor=65, f0_ceil=420, frame_period=FP)
        f0 = pw.stonemask(x, f0, t, SR)
        n = len(f0); med = np.median(f0[f0 > 0]) if (f0 > 0).any() else 110.0
        # voiced or not by what the sound is: vowels and l r n m w y are voiced all through, s and h are not
        forced = np.zeros(n, dtype=int)
        for p, (a, b) in zip(phones, seg):
            i0, i1 = int(round(a / DT)), int(round(b / DT))
            if p == ' ': continue
            if p in UNVOICED: forced[i0 + 1:max(i0 + 1, i1 - 1)] = -1
            elif is_vowel(p) or p in SONORANT: forced[i0:i1] = 1
        f0[forced == -1] = 0
        need = (forced == 1) & (f0 <= 0)
        if need.any():
            good = np.where(f0 > 0)[0]
            f0[need] = np.interp(np.where(need)[0], good, f0[good]) if len(good) else med
        v = f0 > 0; f0[v & (f0 > med * 1.8)] /= 2; f0[v & (f0 < med / 1.8)] *= 2
        self.f0 = f0; self.t = t
        sp = pw.cheaptrick(x, f0, t, SR)
        self.ap = pw.d4c(x, f0, t, SR, threshold=0.0)
        self.lsp = np.log(sp + 1e-16)


def layout(take, syl, T, end, cons_max=0.11, cons_min=0.028):
    """Where every sound goes: T[k] is when syllable k's vowel starts, `end` when the last vowel is let go.
    Consonants keep about their spoken length; vowels fill the rest."""
    ph = take.phones; seg = take.seg; out = [None] * len(ph); info = []
    for k in range(len(syl)):
        idx = take.map[k]; v = [i for i in idx if is_vowel(ph[i])][0]
        info.append(([i for i in idx if i < v], v, [i for i in idx if i > v]))
    def clen(i): return float(np.clip(seg[i][1] - seg[i][0], cons_min, cons_max))
    K = len(syl)
    for k in range(K):
        on, v, co = info[k]
        t = T[k] - sum(clen(i) for i in on)
        for i in on: out[i] = (t, t + clen(i)); t += clen(i)
        nxt = (T[k + 1] - sum(clen(i) for i in info[k + 1][0])) if k + 1 < K else end
        ce = sum(clen(i) for i in co); vend = nxt - ce
        if vend - T[k] < 0.05: sc = max(0.3, (nxt - T[k] - 0.05) / max(ce, 1e-6)); vend = T[k] + 0.05
        else: sc = 1.0
        out[v] = (T[k], vend); t = vend
        for i in co: out[i] = (t, t + clen(i) * sc); t += clen(i) * sc
    return out


def warp(take, tgt, n_out, t0):
    """For each output frame, the time in the spoken take it is drawn from (-1: silence)."""
    src = np.full(n_out, -1.0); tau = t0 + np.arange(n_out) * DT
    for p, s_, tg in zip(take.phones, take.seg, tgt):
        if tg is None or p == ' ': continue
        a, b = s_; c, d = tg; m = (tau >= c) & (tau < d)
        if not m.any(): continue
        x = tau[m] - c; L = d - c; S = b - a
        if is_vowel(p) and L > S:
            e = min(0.04, S * 0.3)        # the way into and out of a vowel stays as spoken; the middle is held
            s = np.where(x < e, a + x, np.where(x > L - e, b - (L - x), a + e + (x - e) * (S - 2 * e) / max(1e-6, L - 2 * e)))
        else: s = a + x * S / L
        src[m] = s
    return src, tau


def tune(tau, T, notes, end, rng, o):
    """The pitch over time (midi): steps at the syllables, slid into, a slow vibrato on held notes, a little wander."""
    first = notes[0][0] if isinstance(notes[0], (list, tuple)) else notes[0]
    m = np.full(len(tau), float(first)); ev = []
    for k, nt in enumerate(notes):
        seq = nt if isinstance(nt, (list, tuple)) else [nt]
        t1 = T[k + 1] if k + 1 < len(T) else end
        for q, mm in enumerate(seq): ev.append((T[k] + (t1 - T[k]) * q / len(seq), mm))
    for (t, mm) in ev: m[tau >= t - 0.035] = mm
    w = int(round(o.get('glide', 0.075) / DT)) | 1; k = np.hanning(w + 2)[1:-1]; k /= k.sum()
    m = np.convolve(np.pad(m, (w // 2, w // 2), mode='edge'), k, 'valid')
    sc = np.clip((tau - (T[0] - 0.05)) / 0.16, 0, 1); m -= o.get('scoop', 0.6) * (1 - sc) ** 2
    depth = np.zeros(len(tau))
    for i, (t, mm) in enumerate(ev):
        t1 = ev[i + 1][0] if i + 1 < len(ev) else end
        if t1 - t > 0.32:
            x = np.clip((tau - t - 0.16) / 0.22, 0, 1) * np.clip((t1 - tau) / 0.08, 0, 1); depth = np.maximum(depth, x * (tau >= t) * (tau < t1))
    rate = o.get('vib_rate', 5.4) * (1 + 0.04 * np.sin(2 * np.pi * 0.31 * tau + rng.uniform(0, 6.28)))
    m += o.get('vib', 0.22) * depth * np.sin(2 * np.pi * np.cumsum(rate) * DT + rng.uniform(0, 6.28))
    b, a = sg.butter(2, 3.0 / (0.5 / DT)); m += o.get('wander', 0.07) * sg.lfilter(b, a, rng.standard_normal(len(tau))) * 8
    return m + o.get('detune', 0.0)


def sing(take, syl, T, end, rng, o):
    """One man singing the half from one take. Returns audio and how much of it comes before T[0]."""
    late = o.get('late', 0.0)
    T = np.asarray(T, dtype=float) + late; end = end + late
    tgt = layout(take, syl, T, end)
    t0 = min(t[0] for t in tgt if t) - 0.03; t1 = max(t[1] for t in tgt if t) + 0.12
    n = int(np.ceil((t1 - t0) / DT))
    src, tau = warp(take, tgt, n, t0)
    live = src >= 0; pos = np.clip(src / DT, 0, len(take.f0) - 1.001); i0 = np.floor(pos).astype(int); fr = (pos - i0)[:, None]
    lsp = take.lsp[i0] * (1 - fr) + take.lsp[i0 + 1] * fr
    ap = take.ap[i0] * (1 - fr) + take.ap[i0 + 1] * fr
    voiced = (take.f0[np.round(pos).astype(int)] > 0) & live
    lsp[~live] = np.log(1e-12); ap[~live] = 1.0
    al = o.get('formant', 1.0)                 # another man's mouth: slide the formants a little
    if abs(al - 1) > 1e-3:
        nb = lsp.shape[1]; kk = np.arange(nb) / al; k0 = np.clip(np.floor(kk).astype(int), 0, nb - 2); kf = np.clip(kk - k0, 0, 1)
        lsp = lsp[:, k0] * (1 - kf) + lsp[:, k0 + 1] * kf; ap = ap[:, k0] * (1 - kf) + ap[:, k0 + 1] * kf
    fbin = np.linspace(0, SR / 2, lsp.shape[1])
    lsp = lsp + o.get('tilt', 0.0) * np.log2(np.maximum(fbin, 200) / 1000.0)[None, :] * 0.69
    ap = np.clip(ap * o.get('breath', 1.0), 0.001, 1.0)
    midi = tune(tau, T, [s['note'] for s in syl], end, rng, o)
    f0 = np.where(voiced, hz(midi), 0.0)
    y = pw.synthesize(np.ascontiguousarray(f0), np.ascontiguousarray(np.exp(lsp)), np.ascontiguousarray(ap), SR, FP)
    return y.astype(np.float32), float(T[0] - late - t0)


def render_row(syl, row=0, bpm=48, takes=3, per_take=2, seed=0, breath=None):
    """syl: the half as samri_verse.sung() gives it. Returns (audio float32 at 22050 Hz, lead in seconds)."""
    R = ROWS[row % 2]
    rng = np.random.default_rng(R['seed'] + seed)
    pulse = 60.0 / bpm / 3
    T = [s['at'] * pulse for s in syl]
    last = syl[-1]; end = (last['at'] + last['len']) * pulse - (breath if breath is not None else (0.24 if bpm < 60 else 0.15))
    parts = []; lead_max = 0.0; k = 0
    for i in range(takes):
        tk = Take(syl, float(rng.uniform(1.25, 1.5)))
        for j in range(per_take):
            o = dict(formant=R['formants'][k % len(R['formants'])] * float(rng.uniform(0.992, 1.008)),
                     detune=float(np.clip(rng.normal(0, 0.11), -0.25, 0.25)),
                     late=float(np.clip(rng.normal(0.004, 0.02), -0.035, 0.05)),
                     vib=float(rng.uniform(0.1, 0.3)), vib_rate=float(rng.uniform(4.9, 5.9)),
                     wander=float(rng.uniform(0.05, 0.1)), glide=float(rng.uniform(0.06, 0.1)), scoop=float(rng.uniform(0.3, 0.9)),
                     tilt=R['effort'] + float(rng.uniform(-0.2, 0.2)), breath=float(rng.uniform(0.9, 1.25)))
            y, lead = sing(tk, syl, T, end, rng, o); k += 1
            y = y / (np.sqrt(np.mean(y ** 2)) + 1e-9)
            parts.append((y * float(rng.uniform(0.75, 1.0)), lead)); lead_max = max(lead_max, lead)
    L = max(int(round((lead_max - ld) * SR)) + len(y) for y, ld in parts)
    mix = np.zeros(L)
    for y, ld in parts:
        o0 = int(round((lead_max - ld) * SR)); mix[o0:o0 + len(y)] += y
    b, a = sg.butter(2, 90 / (SR / 2), 'high'); mix = sg.lfilter(b, a, mix)
    mix = mix / (np.sqrt(np.mean(mix ** 2)) + 1e-9) * 0.17          # the same loudness as the app's own sung verse
    mix = np.tanh(mix * 1.6) / 1.6 * 1.05
    return mix.astype(np.float32), float(lead_max)


def mp3(y, kbps=48):
    """mono float audio at 22050 Hz -> mp3 bytes"""
    import lameenc
    e = lameenc.Encoder(); e.set_bit_rate(kbps); e.set_in_sample_rate(SR); e.set_channels(1); e.set_quality(2)
    pcm = (np.clip(y, -1, 1) * 32767).astype(np.int16).tobytes()
    return e.encode(pcm) + e.flush()
