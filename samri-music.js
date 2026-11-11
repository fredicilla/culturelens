/**
 * samri-music.js — the sound of the Samri: frame drums and the big marjaf, hand claps, the slap of
 * the drums thrown down together, and the two rows singing the verse.
 *
 * The sounds are recordings, kept in one file (samri-sounds.mp3) and played from here on the beat:
 *   - The drums and claps are real frame drums, a bass drum and hand claps from the Versilian
 *     Community Sample Library (VCSL, Versilian Studios, CC0 / public domain), layered so that each
 *     stroke is a row of men striking together, every drum a little different, not quite at once.
 *   - The singing is a machine voice, not a recording of a Samri group: an Arabic text-to-speech
 *     voice (Piper "ar_JO-kareem") says the verse in the Najdi way, and each syllable is then moved
 *     onto the rhythm, held for its note and given the pitch of the tune (WORLD vocoder), seven
 *     times over with different mouths and tunings to make a row. A real group should replace it.
 * If the file cannot be loaded, simple sounds made in code stand in, so there is never silence.
 *
 * A small scheduler plays the beat on the audio clock. Everything that moves or is judged
 * (the dancers, the cues, the notes of the game) reads its time from here, so what you see,
 * what you hear and what you are scored against stay together.
 *
 * The drum patterns are the real ones, as they are written down:
 *   heavy  The Samri of Unaizah, slow and heavy: "a single stroke followed by three slow strokes
 *          in a row" (ضربة منفردة تليها ثلاث ضربات متتالية بطيئة). Abdulaziz bin Hamad Al-Qadi,
 *          "Samri Unaizah", Al-Jazirah, 2 November 2025. The strokes sound tak, then dum tak dum,
 *          after the notation in Al-Jazirah's "Samri" page, 17 October 2016:
 *          (تك.. دوم تك دوم.. تك.. دوم تك دوم).
 *   light  The light Samri of the rest of Najd, which Unaizah calls al-Hawti, fast: "two strokes in a
 *          row on the tar or the drum, then one on its own" (ضربتين متتابعتين على الطار أو الطبل تليهما
 *          ضربة واحدة منفردة). The same article by Al-Qadi.
 * Both are counted in cycles of six pulses, felt as two beats of three (the way the Samri rhythm is
 * counted in Gulf practice: six, grouped three and three, accents on 1 and 4). A beat here is three
 * pulses, so one cycle is two beats. In Unaizah a big frame drum, the marjaf, makes the beat stronger
 * (the Samri booklet of the Royal Institute of Traditional Arts, Wrth).
 * The tempos are our reading of "slow" and "fast". The tune is not a transcription of a recording:
 * it is ours, on the Bayati scale, rising through the first half of the verse and coming home in the
 * second, with the long and short syllables of the poem's meter kept long and short.
 */
export const PULSES = 6;
export const STYLES = {
  // [pulse in the cycle, stroke, strength]
  heavy: { bpm: 48, strokes: [[0, 'tak', 1], [2, 'dum', 0.85], [3, 'tak', 0.95], [4, 'dum', 0.8]] },
  light: { bpm: 72, strokes: [[0, 'dum', 1], [1, 'dum', 0.6], [3, 'tak', 0.9]] }
};
// the tune as plain notes (midi): [beat, note, beats]. Only hummed when the recordings are missing.
export const LINES = {
  wan: [[0, 50, 1.4], [1.4, 51.5, 0.5], [1.9, 53, 0.9], [2.8, 51.5, 0.5], [3.3, 50, 0.7]],
  h1: [[0, 50, 0.67], [0.67, 53, 0.33], [1, 55, 0.67], [1.67, 57, 0.33], [2, 55, 0.67], [2.67, 53, 0.33], [3, 55, 1]],
  h2: [[0, 57, 0.67], [0.67, 55, 0.33], [1, 53, 0.67], [1.67, 55, 0.33], [2, 53, 0.67], [2.67, 51.5, 0.33], [3, 50, 1]]
};
// where each recorded sound sits in samri-sounds.mp3: [start, length, lead-in before its beat], in seconds
export const SOUND_FILE = 'samri-sounds.mp3';
const CLICK_AT = 0.25;
const CLIPS = {
  clap0: [0.5, 0.45, 0.05], clap1: [1.03, 0.45, 0.05], clap2: [1.56, 0.45, 0.05],
  clap3: [2.09, 0.45, 0.05], dum0: [2.62, 1.0, 0.05], dum1: [3.7, 1.0, 0.05],
  dum2: [4.78, 1.0, 0.05], dum3: [5.86, 1.0, 0.05], marjaf0: [6.94, 1.3, 0.05],
  marjaf1: [8.32, 1.3, 0.05], slap0: [9.7, 1.2, 0.05], solo_dum: [10.98, 1.0, 0.05],
  solo_tak: [12.06, 0.45, 0.05], tak0: [12.59, 0.42, 0.05], tak1: [13.09, 0.42, 0.05],
  tak2: [13.59, 0.42, 0.05], tak3: [14.09, 0.42, 0.05], v_a_h1_48: [14.59, 5.0623, 0.1576],
  v_a_h1_72: [19.7323, 3.5068, 0.1717], v_a_h2_48: [23.3191, 5.0681, 0.1657], v_a_h2_72: [28.4672, 3.5166, 0.1714],
  v_b_h1_48: [32.0637, 5.0981, 0.175], v_b_h1_72: [37.2418, 3.4945, 0.1459], v_b_h2_48: [40.8163, 5.0848, 0.1662],
  v_b_h2_72: [45.9811, 3.5199, 0.1691], v_wan: [49.581, 4.8467, 0.0552]
};
// the verse as it is sung. Each half takes twelve pulses (two cycles of the beat); a syllable is
// [pulse it starts on, pulses it lasts, the word it begins (or -1), how open the mouth is on its vowel]
export const SUNG = {
  h1: { words: ['يا', 'جر', 'قلبي', 'جر', 'لدن', 'الغصوني'],
    syl: [[0, 1.5, 0, 1.0], [1.5, 1, 1, 1.0], [2.5, 0.5, -1, 0.45], [3, 1, 2, 1.0], [4, 1.5, -1, 0.45], [5.5, 1, 3, 1.0], [6.5, 0.5, -1, 0.45], [7, 1, 4, 1.0], [8, 1, 5, 0.45], [9, 0.5, -1, 0.5], [9.5, 1.25, -1, 0.5], [10.75, 1.25, -1, 0.45]] },
  h2: { words: ['وغصون', 'سدر', 'جرها', 'السيل', 'جرا'],
    syl: [[0, 1.5, 0, 0.45], [1.5, 1, -1, 0.5], [2.5, 0.5, -1, 0.45], [3, 1, 1, 0.45], [4, 1.5, -1, 0.45], [5.5, 1, 2, 1.0], [6.5, 0.5, -1, 1.0], [7, 1, -1, 1.0], [8, 1, 3, 0.72], [9, 0.5, -1, 0.45], [9.5, 1.25, 4, 1.0], [10.75, 1.25, -1, 1.0]] },
  wan: { words: [], syl: [[0, 5.6, -1, 0.8], [5.7, 6.0, -1, 0.8]] }
};
// a breath of silence in a file: playing it on an iPhone lets the sound through with the silent switch on
const SILENCE = 'data:audio/wav;base64,UklGRkQDAABXQVZFZm10IBAAAAABAAEAQB8AAE' +
  'AfAAABAAgAZGF0YSADAACAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI' +
  'CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI' +
  'CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI' +
  'CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI' +
  'CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI' +
  'CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI' +
  'CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgI' +
  'CAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgA==';

function mtof(m) { return 440 * Math.pow(2, (m - 69) / 12); }

export class Music {
  constructor() {
    this.ctx = null; this.muted = false;
    this.segs = [{ t0: 0, b0: 0, bpm: STYLES.heavy.bpm, style: 'heavy' }];
    this.playing = false; this.drums = true; this.claps = false; this.drumVol = 1; this.voiceVol = 1;
    this.step = 0; this.slot = 0; this.timer = 0;
    this.t0perf = performance.now() / 1000;
    this.buf = null; this.off = 0; this.bytes = null; this.loading = null;   // the recorded sounds
    this.rr = {};                 // the last variant played of each sound, so no two in a row are the same
    this.voices = [];             // phrases being sung now: { row, what, t0, pulse, end, stop }
    this.plan = null;             // who sings each half-line slot: function (slot, beat) -> { row, what } or null
    this.rowPan = [-0.3, 0.3];    // where each row is heard, left to right (set from the camera)
    this.singer = null;           // the row that sings and claps now (the other one holds the drums)
    this.onRunning = null;        // called when the audio clock starts running
  }

  // ── loading the recordings ──
  // fetch the sounds as early as possible; they are decoded as soon as they arrive
  preload() {
    if (this.loading) return this.loading;
    var self = this;
    this.loading = fetch(SOUND_FILE).then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.arrayBuffer(); })
      .then(function (bytes) { self.bytes = bytes; return self.decode(); })
      .catch(function (e) { console.warn('Samri: the recorded sounds did not load, using the built-in ones.', e); });
    return this.loading;
  }
  decode() {
    var self = this;
    if (this.buf || !this.bytes || this.decoding) return Promise.resolve();
    var dec = this.ctx;
    if (!dec) {
      var C = window.OfflineAudioContext || window.webkitOfflineAudioContext;
      try { dec = C ? new C(1, 2, 44100) : null; } catch (e) { dec = null; }
    }
    if (!dec) return Promise.resolve();      // decoded later, once the audio clock exists
    this.decoding = true;
    var bytes = this.bytes.slice(0);
    return new Promise(function (res, rej) { var p = dec.decodeAudioData(bytes, res, rej); if (p && p.then) p.then(res, rej); })
      .then(function (buf) { self.decoding = false; self.setBuffer(buf); })
      .catch(function (e) {
        self.decoding = false;
        if (self.ctx && dec !== self.ctx) return self.decode();
        if (!self.ctx) { self.retry = true; return; }
        console.warn('Samri: could not decode the recorded sounds, using the built-in ones.', e);
      });
  }
  setBuffer(buf) {
    // decoders do not all put the start in the same place: find the click that sits a quarter second in
    var d = buf.getChannelData(0), n = Math.min(d.length, Math.floor(buf.sampleRate * 0.6)), k = -1;
    for (var i = 0; i < n; i++) if (Math.abs(d[i]) > 0.25) { k = i; break; }
    this.off = k < 0 ? 0 : k / buf.sampleRate - CLICK_AT;
    this.buf = buf;
  }
  loaded() { return !!this.buf; }

  // ── the audio clock ──
  // it only runs after a tap on the page; call this from a tap
  ensure() {
    if (this.ctx) { if (this.ctx.state !== 'running') this.wake(); return this.ctx; }
    var C = window.AudioContext || window.webkitAudioContext; if (!C) return null;
    var ctx = this.ctx = new C(), self = this;
    this.master = ctx.createGain(); this.master.gain.value = this.muted ? 0 : 0.85;
    var comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -15; comp.knee.value = 9; comp.ratio.value = 4; comp.attack.value = 0.002; comp.release.value = 0.16;
    // a soft ceiling after the compressor, so many hands landing together round off and do not crackle
    var lim = ctx.createWaveShaper(), curve = new Float32Array(1025);
    for (var i = 0; i < 1025; i++) { var x = (i - 512) / 512 * 2; curve[i] = Math.tanh(x * 1.1) / Math.tanh(2.2) * 0.98; }
    lim.curve = curve; try { lim.oversample = '2x'; } catch (e) {}
    var pre = ctx.createGain(); pre.gain.value = 0.62;     // a little louder going in: phone speakers are small
    this.master.connect(comp); comp.connect(pre); pre.connect(lim); lim.connect(ctx.destination);
    // the open night air: a short, soft tail
    this.verb = ctx.createConvolver(); this.verb.buffer = this.impulse(1.3, 2.4);
    var wet = ctx.createGain(); wet.gain.value = 0.16; this.verb.connect(wet); wet.connect(this.master);
    this.noiseB = this.makeNoise(1.5);
    ctx.onstatechange = function () { if (ctx.state === 'running' && self.onRunning) self.onRunning(); };
    this.wake();
    if (this.bytes && !this.buf) this.decode();
    return ctx;
  }
  // call inside a tap, a key press or a click: wakes the audio clock on every kind of phone
  unlock() {
    var ctx = this.ensure(); if (!ctx) return;
    this.wake();
    if (ctx.state !== 'running' || !this.kicked) {
      // some phones only start the clock when a sound is started inside the tap itself
      try { var b = ctx.createBuffer(1, 1, 22050), s = ctx.createBufferSource(); s.buffer = b; s.connect(ctx.destination); s.start(0); this.kicked = true; } catch (e) {}
    }
    // iPhones mute this kind of sound when the silent switch is on, unless the page says it is playing media
    try { if (navigator.audioSession && navigator.audioSession.type !== 'playback') navigator.audioSession.type = 'playback'; } catch (e2) {}
    if (!navigator.audioSession && /iPhone|iPad|iPod/.test(navigator.userAgent || '') && (!this.keep || this.keep.paused)) {
      try {
        var a = this.keep;
        if (!a) { a = this.keep = document.createElement('audio'); a.setAttribute('playsinline', ''); a.setAttribute('x-webkit-airplay', 'deny'); a.loop = true; a.preload = 'auto'; a.src = SILENCE; }
        var pr = a.play(); if (pr && pr.catch) pr.catch(function () {});
      } catch (e3) {}
    }
  }
  wake() { var c = this.ctx; if (c && c.state !== 'running' && c.resume) { try { var p = c.resume(); if (p && p.catch) p.catch(function () {}); } catch (e) {} } }
  setMuted(m) {
    this.muted = m;
    if (this.master) this.master.gain.setTargetAtTime(m ? 0 : 0.85, this.ctx.currentTime, 0.05);
  }
  ready() { return !!(this.ctx && this.ctx.state === 'running'); }
  time() { return this.ctx ? this.ctx.currentTime : performance.now() / 1000 - this.t0perf; }
  // how late sound reaches the ear, plus a little for the finger
  latency() { var c = this.ctx; return (c ? (c.outputLatency || c.baseLatency || 0) : 0) + 0.02; }
  impulse(secs, decay) {
    var c = this.ctx, n = Math.floor(c.sampleRate * secs), b = c.createBuffer(2, n, c.sampleRate);
    for (var ch = 0; ch < 2; ch++) {
      var d = b.getChannelData(ch), lp = 0;
      for (var i = 0; i < n; i++) {
        var k = i / n, a = 0.35 + 0.6 * k;          // the tail gets darker as it dies away
        lp = lp * a + (Math.random() * 2 - 1) * (1 - a);
        d[i] = lp * Math.pow(1 - k, decay) * (i < 400 ? i / 400 : 1);
      }
    }
    return b;
  }
  makeNoise(secs) {
    var c = this.ctx, b = c.createBuffer(1, Math.floor(c.sampleRate * secs), c.sampleRate), d = b.getChannelData(0);
    for (var i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    return b;
  }
  out(node, wet) { node.connect(this.master); if (wet !== false) node.connect(this.verb); }
  env(t, peak, attack, decay) {
    var g = this.ctx.createGain();
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), t + attack); g.gain.exponentialRampToValueAtTime(0.0001, t + attack + decay);
    return g;
  }
  burst(t, dur, vol, type, freq, q, wet) {
    var c = this.ctx, s = c.createBufferSource(); s.buffer = this.noiseB;
    var f = c.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q || 1;
    var g = this.env(t, vol, 0.002, dur);
    s.connect(f); f.connect(g); this.out(g, wet);
    s.start(t, Math.random() * 0.5); s.stop(t + dur + 0.05);
  }
  tone(t, f0, f1, dur, vol, type, wet) {
    var c = this.ctx, o = c.createOscillator(); o.type = type || 'sine';
    o.frequency.setValueAtTime(f0, t); if (f1) o.frequency.exponentialRampToValueAtTime(f1, t + dur * 0.6);
    var g = this.env(t, vol, 0.003, dur);
    o.connect(g); this.out(g, wet); o.start(t); o.stop(t + dur + 0.05);
  }
  // play one of the recorded sounds so that its beat falls at time t
  clip(name, t, vol, o) {
    var c = CLIPS[name], ctx = this.ctx; if (!this.buf || !c || !ctx) return null;
    o = o || {};
    var rate = o.rate || 1, now = ctx.currentTime;
    var when = t - c[2] / rate, at = c[0] + this.off, len = c[1];
    if (when < now) { var skip = (now - when) * rate; if (skip > len - 0.03) return null; at += skip; len -= skip; when = now; }
    var src = ctx.createBufferSource(); src.buffer = this.buf; src.playbackRate.value = rate;
    var g = ctx.createGain(); g.gain.value = vol; src.connect(g);
    var last = g;
    if (o.pan && ctx.createStereoPanner) { var p = ctx.createStereoPanner(); p.pan.value = Math.max(-1, Math.min(1, o.pan)); g.connect(p); last = p; }
    last.connect(this.master);
    if (o.wet !== 0) { var w = ctx.createGain(); w.gain.value = o.wet == null ? 0.5 : o.wet; last.connect(w); w.connect(this.verb); }
    src.start(when, Math.max(0, at), len);
    return { src: src, gain: g, start: when, end: when + len / rate };
  }
  pick(base, n) { var k = Math.floor(Math.random() * n); if (k === this.rr[base]) k = (k + 1) % n; this.rr[base] = k; return base + k; }
  // where the drums and the clapping are heard: the singing row claps, the other row holds the drums
  drumPan() { return this.singer == null ? 0 : this.rowPan[1 - this.singer]; }
  clapPan() { return this.singer == null ? 0 : this.rowPan[this.singer]; }

  // ── the instruments ──
  // the deep stroke in the middle of the skin. With `tension` (0..1) it is one tar on its own, yours,
  // higher and shorter the tighter the skin
  dum(t, v, tension) {
    if (!this.ctx) return;
    v = v == null ? 1 : v;
    if (this.buf) {
      if (tension != null) this.clip('solo_dum', t, 1.0 * v, { rate: 1 + tension * 0.85, wet: 0.4 });
      else this.clip(this.pick('dum', 4), t, 0.82 * v, { rate: 1 + (Math.random() - 0.5) * 0.03, pan: this.drumPan(), wet: 0.4 });
      return;
    }
    var k = 1 + (tension || 0) * 1.1;
    this.tone(t, 112 * k, 64 * k, 0.5 / (1 + (tension || 0) * 1.4), 0.8 * v);
    this.tone(t, 228 * k, 150 * k, 0.16, 0.2 * v, 'triangle');
    this.burst(t, 0.045, 0.25 * v, 'lowpass', 900, 0.7);
  }
  // the sharp stroke near the rim (solo: one tar on its own, yours)
  tak(t, v, solo) {
    if (!this.ctx) return;
    v = v == null ? 1 : v;
    if (this.buf) {
      if (solo) this.clip('solo_tak', t, 0.95 * v, { wet: 0.4 });
      else this.clip(this.pick('tak', 4), t, 0.72 * v, { rate: 1 + (Math.random() - 0.5) * 0.03, pan: this.drumPan(), wet: 0.4 });
      return;
    }
    this.burst(t, 0.07, 0.5 * v, 'bandpass', 2700, 1.3);
    this.tone(t, 540, 400, 0.09, 0.2 * v, 'sine');
  }
  // the marjaf: the big frame drum one man carries to make the beat stronger
  marjaf(t, v) {
    if (!this.ctx) return;
    v = v == null ? 1 : v;
    if (this.buf) { this.clip(this.pick('marjaf', 2), t, 0.78 * v, { pan: this.drumPan() * 0.5, wet: 0.3 }); return; }
    this.tone(t, 76, 44, 0.75, 0.85 * v);
    this.tone(t, 152, 98, 0.22, 0.16 * v, 'triangle');
    this.burst(t, 0.06, 0.16 * v, 'lowpass', 520, 0.7);
  }
  // a row clapping: a few hands, not quite together
  clap(t, v) {
    if (!this.ctx) return;
    v = v == null ? 1 : v;
    if (this.buf) { this.clip(this.pick('clap', 4), t, 0.5 * v, { rate: 1 + (Math.random() - 0.5) * 0.04, pan: this.clapPan(), wet: 0.4 }); return; }
    for (var i = 0; i < 4; i++) this.burst(t + Math.random() * 0.022, 0.05, 0.3 * v, 'bandpass', 1300 + Math.random() * 500, 0.9);
  }
  // eighteen drums thrown down on the rug at once
  slap(t, v) {
    if (!this.ctx) return;
    v = v == null ? 1 : v;
    if (this.buf) { this.clip('slap0', t, 1.0 * v, { wet: 0.6 }); return; }
    for (var i = 0; i < 6; i++) this.burst(t + Math.random() * 0.03, 0.2, 0.42 * v, 'bandpass', 900 + Math.random() * 1600, 0.7);
    this.tone(t, 95, 40, 0.35, 0.9 * v);
    this.burst(t, 0.06, 0.6 * v, 'highpass', 3000, 0.7);
  }

  // ── the singing ──
  // a row sings: `what` is 'h1' or 'h2' (the two halves of the verse) or 'wan' (the waneen), and its
  // first beat falls at time t. o.row: 0 or 1, o.style: 'heavy' or 'light', o.vol
  voice(t, what, o) {
    o = o || {};
    if (!this.ctx) return { end: t, stop: function () {} };
    var self = this, style = what === 'wan' ? 'heavy' : (o.style || 'heavy'), row = o.row ? 1 : 0, bpm = STYLES[style].bpm;
    var name = what === 'wan' ? 'v_wan' : 'v_' + (row ? 'b' : 'a') + '_' + what + '_' + bpm;
    var vol = (o.vol == null ? 1 : o.vol) * this.voiceVol, h = null;
    var c = this.clip(name, t, 0.95 * vol, { pan: what === 'wan' ? 0 : this.rowPan[row], wet: 0.8 });
    if (c) {
      h = { end: c.end, stop: function (at) {
        var ctx = self.ctx; at = Math.max(at || ctx.currentTime, ctx.currentTime);
        try { c.gain.gain.cancelScheduledValues(at); c.gain.gain.setValueAtTime(c.gain.gain.value, at); c.gain.gain.linearRampToValueAtTime(0.0001, at + 0.14); c.src.stop(at + 0.18); } catch (e) {}
        h.end = Math.min(h.end, at + 0.14);
      } };
    } else if (!this.buf) {
      h = this.hum(t, LINES[what], 60 / bpm, { voices: what === 'wan' ? 1 : 3, vol: 0.09 * vol });
    } else return { end: t, stop: function () {} };
    h.row = what === 'wan' ? -1 : row; h.what = what; h.t0 = t; h.pulse = 60 / bpm / 3;
    this.voices = this.voices.filter(function (x) { return x.end > self.time() - 0.5; });
    this.voices.push(h);
    return h;
  }
  // what a row is singing at the moment you hear: { what, p } with p the pulse inside the phrase, or null
  singing(row) {
    var t = this.time() - this.latency(), best = null;
    for (var i = 0; i < this.voices.length; i++) {
      var v = this.voices[i];
      if ((v.row !== row && v.row !== -1) || t < v.t0 - 0.2 || t > v.end) continue;
      best = { what: v.what, p: (t - v.t0) / v.pulse, all: v.row === -1 };
    }
    return best;
  }
  // every voice stops (with a short fade)
  hush(at) { this.voices.forEach(function (v) { try { v.stop(at); } catch (e) {} }); }
  // a row humming a line, made in code: only used when the recordings could not be loaded
  hum(t, line, secPerBeat, o) {
    o = o || {};
    var c = this.ctx, nodes = [], voices = o.voices || 3, vol = (o.vol || 0.07) / Math.sqrt(voices), shift = o.shift || 0;
    var end = 0; line.forEach(function (n) { end = Math.max(end, n[0] + n[2]); });
    var T = end * secPerBeat;
    var bus = c.createGain(); bus.gain.setValueAtTime(0.0001, t); bus.gain.exponentialRampToValueAtTime(1, t + 0.12); bus.gain.setValueAtTime(1, t + T - 0.2); bus.gain.exponentialRampToValueAtTime(0.0001, t + T + 0.15);
    // formants of a man's "aa"
    var mix = c.createGain(); mix.gain.value = 1;
    [[730, 7, 1], [1090, 8, 0.6], [2440, 10, 0.25]].forEach(function (fm) {
      var bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = fm[0]; bp.Q.value = fm[1];
      var gg = c.createGain(); gg.gain.value = fm[2] * 3; bp.connect(gg); gg.connect(bus); mix.connect(bp);
    });
    var lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 600; var lpg = c.createGain(); lpg.gain.value = 0.5; mix.connect(lp); lp.connect(lpg); lpg.connect(bus);
    this.out(bus);
    for (var v = 0; v < voices; v++) {
      var osc = c.createOscillator(); osc.type = 'sawtooth';
      var det = (v - (voices - 1) / 2) * 7 + (Math.random() - 0.5) * 4;
      osc.detune.value = det;
      var lag = v * 0.025, pf = 0;
      line.forEach(function (n, k) {
        var at = t + n[0] * secPerBeat + lag, f = mtof(n[1] + shift);
        if (k === 0) osc.frequency.setValueAtTime(f, at);
        else { osc.frequency.setValueAtTime(pf, at - 0.001); osc.frequency.linearRampToValueAtTime(f, at + 0.07); }
        pf = f;
      });
      var lfo = c.createOscillator(), lg = c.createGain(); lfo.frequency.value = 5 + Math.random(); lg.gain.value = 3.5;
      lfo.connect(lg); lg.connect(osc.frequency);
      var g = c.createGain(); g.gain.value = vol; osc.connect(g); g.connect(mix);
      osc.start(t); lfo.start(t); osc.stop(t + T + 0.3); lfo.stop(t + T + 0.3);
      nodes.push(osc, lfo);
    }
    return {
      end: t + T,
      stop: function (at) {
        at = Math.max(at || c.currentTime, c.currentTime);
        try { bus.gain.cancelScheduledValues(at); bus.gain.setValueAtTime(bus.gain.value || 0.5, at); bus.gain.exponentialRampToValueAtTime(0.0001, at + 0.12); } catch (e) {}
        nodes.forEach(function (n) { try { n.stop(at + 0.2); } catch (e) {} });
      }
    };
  }

  // ── the beat ──
  segAtTime(t) { var s = this.segs[0]; for (var i = 1; i < this.segs.length; i++) if (this.segs[i].t0 <= t) s = this.segs[i]; return s; }
  segAtBeat(b) { var s = this.segs[0]; for (var i = 1; i < this.segs.length; i++) if (this.segs[i].b0 <= b) s = this.segs[i]; return s; }
  beatAt(t) { var s = this.segAtTime(t); return s.b0 + (t - s.t0) * s.bpm / 60; }
  timeOf(b) { var s = this.segAtBeat(b); return s.t0 + (b - s.b0) * 60 / s.bpm; }
  // the beat you hear right now
  beat() { return this.beatAt(this.time() - this.latency()); }
  bpm() { return this.segAtTime(this.time()).bpm; }
  secPerBeat() { return 60 / this.bpm(); }
  // the drum strokes, in beats, from b0 to b1: each cycle (two beats) in the style playing then
  strokes(b0, b1) {
    var out = [];
    for (var c = Math.floor(b0 / 2) * 2; c <= b1; c += 2) {
      STYLES[this.segAtBeat(c).style].strokes.forEach(function (e) {
        var b = c + e[0] / 3;
        if (b >= b0 - 1e-6 && b <= b1 + 1e-6) out.push(b);
      });
    }
    return out;
  }
  nearestStroke(b) {
    var best = null;
    this.strokes(b - 1.5, b + 1.5).forEach(function (x) { if (best === null || Math.abs(x - b) < Math.abs(best - b)) best = x; });
    return best;
  }
  // the first stroke at or after beat b
  nextStroke(b) { var s = this.strokes(b, b + 3); return s.length ? s[0] : null; }
  // where the strokes fall inside the cycle playing at beat b (for the dancers' hands)
  offsets(b) {
    var st = this.playing ? this.segAtBeat(Math.floor(b / 2) * 2).style : 'heavy';
    return STYLES[st].strokes.map(function (e) { return e[0] / 3; });
  }
  // start the drums: beat 0 falls `delay` seconds from now
  start(style, delay) {
    this.ensure();
    this.stop();
    var t0 = this.time() + (delay == null ? 0.25 : delay);
    this.segs = [{ t0: t0, b0: 0, bpm: STYLES[style].bpm, style: style }];
    this.step = 0; this.slot = 0; this.playing = true;
    var self = this;
    this.timer = setInterval(function () { self.pump(); }, 25);
    this.pump();
    return t0;
  }
  // switch to another style from a given beat (the start of a cycle: an even beat)
  change(style, atBeat) {
    var t = this.timeOf(atBeat);
    this.segs = this.segs.filter(function (s) { return s.b0 < atBeat; });
    this.segs.push({ t0: t, b0: atBeat, bpm: STYLES[style].bpm, style: style });
  }
  stop() { this.playing = false; clearInterval(this.timer); this.timer = 0; this.hush(); }
  // walks the pulses: the strokes of the style fall on their pulses, the marjaf on the first stroke
  // of each cycle, and the singing row claps with the strokes. Every four beats a half of the verse
  // can begin: the plan says which row sings it
  pump() {
    if (!this.playing) return;
    var now = this.time(), horizon = now + 0.15;
    while (true) {
      var b = this.step / 3, t = this.timeOf(b);
      if (t > horizon) break;
      var st = STYLES[this.segAtBeat(b).style], inC = this.step % PULSES;
      if (t >= now - 0.05) {
        st.strokes.forEach(function (e) {
          if (e[0] !== inC) return;
          if (this.drums) { this[e[1]](t, e[2] * this.drumVol); if (inC === 0) this.marjaf(t, 0.8 * this.drumVol); }
          if (this.claps) this.clap(t, inC === 0 || inC === 3 ? 0.9 : 0.65);
        }, this);
      }
      this.step++;
    }
    // the voices are called a little earlier than the drums: a sung line starts before its beat
    while (true) {
      var sb = this.slot * 4, ts = this.timeOf(sb);
      if (ts > now + 0.5) break;
      if (this.plan && ts > now - 0.3) {
        var who = this.plan(this.slot, sb);
        if (who) this.voice(ts, who.what, { row: who.row, style: this.segAtBeat(sb).style, vol: who.vol });
      }
      this.slot++;
    }
  }
}
