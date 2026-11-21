"""The shape of a Samri verse as CultureLens sings it, and a checker for it.

Every half of a verse (a sadr or an ajz) is twelve sung syllables in the pattern of the verse already
in the app (يا جر قلبي جر لدن الغصوني / وغصون سدر جرها السيل جرا):

    L L S L   L L S L   L S L L        (L: a long syllable, S: a short one)

so any verse in that pattern fits the same rhythm (twelve pulses, two cycles of the drums) and the
same tune. All the first halves of a poem end on one rhyme, and all the second halves on another.

Syllables are written in a plain Latin spelling of Najdi speech, one string per syllable:
    consonants  b t th j H kh d dh r z s sh S D T Z 3 gh f q g k ch l m n h w y '
                (S D T Z are the emphatic ص ض ط ظ, H is ح, 3 is ع, ' is the glottal stop ء;
                 ق is said g in Najdi, so write g, and ض is said like ظ, so write Z)
    vowels      a i u e o (short), aa ii uu ee oo (long)
A syllable is short when it ends in a short vowel (ra, li), long when its vowel is long (yaa) or a
consonant closes it (jar, nakh).
"""
import re

TEMPLATE = 'LLSLLLSLLSLL'
# where each syllable falls, in pulses (a cycle of the drums is six pulses), and how long it is held
RHYTHM = [(0, 1.5), (1.5, 1), (2.5, 0.5), (3, 1), (4, 1.5), (5.5, 1), (6.5, 0.5), (7, 1), (8, 1), (9, 0.5), (9.5, 1.25), (10.75, 1.25)]
PULSES = 12
# the tune (midi notes; 51.5 is the half-flat E of the Bayati on D): the first half rises, the second comes home
TUNE = {
    'sadr': [50, 50, 51.5, 53, 55, 55, 53, 55, 57, 55, [53, 55], 55],
    'ajz': [57, 55, 53, 55, 53, 53, 51.5, 53, 55, 53, [53, 51.5], 50],
}

CONS = {
    'th': 'θ', 'kh': 'x', 'dh': 'ð', 'sh': 'ʃ', 'gh': 'ɣ', 'ch': 'tʃ',
    's.': 'sˤ', 'd.': 'ðˤ', 't.': 'tˤ', 'z.': 'ðˤ', 'h.': 'ħ',
    'b': 'b', 't': 't', 'j': 'dʒ', 'H': 'ħ', 'd': 'd', 'r': 'r', 'z': 'z', 's': 's', 'S': 'sˤ',
    'D': 'ðˤ', 'T': 'tˤ', 'Z': 'ðˤ', '3': 'ʕ', 'f': 'f', 'q': 'q', 'g': 'ɡ', 'k': 'k', 'l': 'l',
    'm': 'm', 'n': 'n', 'h': 'h', 'w': 'w', 'y': 'j', "'": 'ʔ', '’': 'ʔ', 'ʔ': 'ʔ', 'ʕ': 'ʕ', 'ħ': 'ħ',
}
VOW = {'aa': 'aː', 'ii': 'iː', 'uu': 'uː', 'ee': 'eː', 'oo': 'oː', 'a': 'a', 'i': 'i', 'u': 'u', 'e': 'e', 'o': 'o',
       'ā': 'aː', 'ī': 'iː', 'ū': 'uː'}
TOKENS = sorted(list(CONS) + list(VOW), key=len, reverse=True)
OPEN = {'a': 1.0, 'e': 0.72, 'o': 0.62, 'u': 0.5, 'i': 0.45}


def tokens(s):
    """'jar' -> ['j', 'a', 'r'] (the spelling's own pieces), or raises ValueError"""
    out, i = [], 0
    s = s.strip()
    while i < len(s):
        for t in TOKENS:
            if s.startswith(t, i):
                out.append(t); i += len(t); break
        else:
            raise ValueError('cannot read %r in syllable %r' % (s[i], s))
    return out


def phones(s):
    """a syllable as the voice's sounds: 'jar' -> ['dʒ', 'a', 'r']"""
    return [VOW[t] if t in VOW else CONS[t] for t in tokens(s)]


def shape(s):
    """onset, vowel, coda of a syllable; raises ValueError unless it has exactly one vowel"""
    ts = tokens(s)
    vs = [k for k, t in enumerate(ts) if t in VOW]
    if len(vs) != 1:
        raise ValueError('syllable %r must have exactly one vowel' % s)
    k = vs[0]
    return ts[:k], ts[k], ts[k + 1:]


def weight(s):
    on, v, co = shape(s)
    return 'L' if (len(v) > 1 or VOW[v].endswith('ː') or co) else 'S'


def rhyme_key(syls):
    """what has to match for two halves to rhyme: the vowel of the next-to-last syllable and the whole last one"""
    _, v, _ = shape(syls[-2])
    last = ''.join(VOW.get(t, CONS.get(t)) for t in tokens(syls[-1]))
    return (VOW[v] + '|' + last).replace('ː', ':')


def check_half(h, where):
    """h: {'text': Arabic, 'syl': [{'t': 'yaa', 'w': 0}, ...]}; returns a list of problems"""
    errs = []
    syl = h.get('syl') or []
    if len(syl) != 12:
        errs.append('%s has %d syllables, it must have 12' % (where, len(syl)))
        return errs
    pat = ''
    for k, s in enumerate(syl):
        try:
            pat += weight(s['t'])
        except ValueError as e:
            errs.append('%s, syllable %d: %s' % (where, k + 1, e)); pat += '?'
    if '?' not in pat and pat != TEMPLATE:
        bad = [str(k + 1) for k in range(12) if pat[k] != TEMPLATE[k] and not (k == 11 and pat[k] == 'S')]
        if bad:
            errs.append('%s scans %s but must scan %s (wrong at syllable %s)' % (where, ' '.join([pat[0:4], pat[4:8], pat[8:12]]),
                                                                               ' '.join([TEMPLATE[0:4], TEMPLATE[4:8], TEMPLATE[8:12]]), ', '.join(bad)))
    words = (h.get('text') or '').split()
    starts = [k for k, s in enumerate(syl) if s.get('w', -1) is not None and s.get('w', -1) >= 0]
    ws = [syl[k]['w'] for k in starts]
    if not words:
        errs.append('%s has no text' % where)
    elif ws != list(range(len(words))):
        errs.append('%s: the word marks (w) must number the %d words 0..%d in order, one each; got %s' % (where, len(words), len(words) - 1, ws))
    elif starts and starts[0] != 0:
        errs.append('%s: the first syllable must start the first word (w = 0)' % where)
    return errs


def check_poem(p):
    """p: {'abyat': [{'sadr': half, 'ajz': half}, ...]}; returns a list of problems (empty: it is good)"""
    errs = []
    ab = p.get('abyat') or []
    if len(ab) < 1:
        return ['the poem has no abyat']
    for i, b in enumerate(ab):
        for part in ('sadr', 'ajz'):
            if part not in b:
                errs.append('bayt %d has no %s' % (i + 1, part)); continue
            errs += check_half(b[part], 'bayt %d %s' % (i + 1, part))
    if errs:
        return errs
    for part in ('sadr', 'ajz'):
        keys = [rhyme_key([s['t'] for s in b[part]['syl']]) for b in ab]
        if len(set(keys)) > 1:
            errs.append('the %s halves must all rhyme (same last syllable and the same vowel before it); they end %s' % (part, ', '.join(keys)))
    return errs


def sung(h, part):
    """a checked half as the singer needs it: syllables with their sounds, beat, length, note and word start"""
    out = []
    for k, s in enumerate(h['syl']):
        at, ln = RHYTHM[k]
        out.append(dict(ph=phones(s['t']), at=at, len=ln, note=TUNE[part][k], w=s.get('w', -1) if s.get('w', -1) is not None else -1,
                        gap=bool(k and s.get('w', -1) is not None and s.get('w', -1) >= 0)))
    return out


def timing(h):
    """[pulse it starts on, pulses it lasts, the word it begins (or -1), how open the mouth is] per syllable,
    the shape samri.js reads to light the words and move the mouths"""
    out = []
    for k, s in enumerate(h['syl']):
        _, v, _ = shape(s['t'])
        at, ln = RHYTHM[k]
        w = s.get('w', -1)
        out.append([at, ln, -1 if w is None else w, OPEN[VOW[v][0]]])
    return out
