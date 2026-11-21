"""Sings the poems that ship with the app and writes them into it: one audio file per topic in
../samri-ai/<topic>.mp3, and the poems with the map of their phrases in ../samri-ai.js.

    python make_bank.py          after changing a poem in make_bank.py: checks them all, saves poems.json
    python sing_bank.py palm     sings that topic again (with no topic, all of them), then rewrites samri-ai.js
    python sing_bank.py --js     only rewrites samri-ai.js from poems.json and clips.json, no singing

Where each phrase sits in a topic's audio file is kept in clips.json, with a fingerprint of the poem it
was sung from, so a poem changed after it was sung gets a warning instead of words that don't match.
A new topic also needs its key added to ORDER below.
"""
import os, re, sys, json, hashlib
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
APP = os.environ.get('SAMRI_APP', os.path.join(HERE, '..'))
ORDER = ['palm', 'coffee', 'rain', 'falcon', 'night', 'homeland']   # the order of the topic chips
GAP = 0.12; START = 0.5; CLICK = 0.25                               # CLICK must match CLICK in samri-ai.js
sys.path.insert(0, HERE)
import samri_verse as V


def sig(p):
    return hashlib.sha1(json.dumps([[b[x]['text'], [s['t'] for s in b[x]['syl']]] for b in p['abyat'] for x in ('sadr', 'ajz')], ensure_ascii=False).encode()).hexdigest()[:12]


def sing(key, p):
    import samri_sing as S
    SR = S.SR; parts = []; pos = START
    for bi, b in enumerate(p['abyat']):
        for part in ('sadr', 'ajz'):
            h = V.sung(b[part], part)
            for row in (0, 1):
                y, lead = S.render_row(h, row=row, seed=bi * 10 + (part == 'ajz') * 3)
                parts.append(('b%d%s%d' % (bi, part[0], row), pos, y, lead)); pos += len(y) / SR + GAP
    mix = np.zeros(int((pos + 0.3) * SR), dtype=np.float32)
    c = int(CLICK * SR); mix[c:c + 4] = [0.95, -0.95, 0.95, -0.95]   # the app finds this click to line the phrases up
    clips = {}
    for name, at, y, lead in parts:
        i = int(round(at * SR)); mix[i:i + len(y)] += y
        clips[name] = [round(at, 4), round(len(y) / SR, 4), round(lead, 4)]
    os.makedirs(os.path.join(APP, 'samri-ai'), exist_ok=True)
    out = os.path.join(APP, 'samri-ai', key + '.mp3')
    open(out, 'wb').write(S.mp3(np.clip(mix, -0.99, 0.99), kbps=56))
    print(key, '%.1f s,' % pos, os.path.getsize(out), 'bytes', flush=True)
    return clips


def bank_js(P, C):
    lines = ['{']
    for i, k in enumerate(ORDER):
        p = P[k]; ab = []
        if k not in C:
            sys.exit('%s has not been sung yet: python sing_bank.py %s' % (k, k))
        if C[k]['sig'] != sig(p):
            print('WARNING: %s changed after it was sung; sing it again: python sing_bank.py %s' % (k, k))
        for b in p['abyat']:
            hb = []
            for part in ('sadr', 'ajz'):
                h = b[part]
                hb.append('%s: { text: %s, syl: %s, timing: %s }' % (part, json.dumps(h['text'], ensure_ascii=False), json.dumps([[s['t'], s['w']] for s in h['syl']]), json.dumps(V.timing(h))))
            ab.append('{ ' + ',\n        '.join(hb) + ' }')
        clips = ', '.join('%s: %s' % (n, json.dumps(v)) for n, v in C[k]['clips'].items())
        lines.append('  %s: {\n    topic: %s,\n    mean: %s,\n    abyat: [\n      %s\n    ],\n    clips: { %s }\n  }%s' % (
            k, json.dumps(p['topic'], ensure_ascii=False), json.dumps(p['mean'], ensure_ascii=False), ',\n      '.join(ab), clips, ',' if i < len(ORDER) - 1 else ''))
    lines.append('}')
    return re.sub(r'"(topic|mean|en|ar)":', r'\1:', '\n'.join(lines))


def main(args):
    P = json.load(open(os.path.join(HERE, 'poems.json'), encoding='utf-8'))
    cpath = os.path.join(HERE, 'clips.json')
    C = json.load(open(cpath, encoding='utf-8')) if os.path.exists(cpath) else {}
    for k, p in P.items():
        errs = V.check_poem(p)
        if errs: sys.exit('%s does not fit the meter yet: %s' % (k, errs))
    if '--js' not in args:
        for k in [a for a in args if not a.startswith('-')] or ORDER:
            if k not in P: sys.exit('no poem called %r in poems.json' % k)
            C[k] = {'sig': sig(P[k]), 'clips': sing(k, P[k])}
        json.dump(C, open(cpath, 'w', encoding='utf-8'), indent=1)
    js = os.path.join(APP, 'samri-ai.js')
    src = open(js, encoding='utf-8').read()
    m = re.search(r'(export var BANK = )([\s\S]*?)(;\nexport var TOPICS = )([^;]*)(;)', src)
    if not m: sys.exit('could not find BANK and TOPICS in samri-ai.js')
    new = src[:m.start()] + m.group(1) + bank_js(P, C) + m.group(3) + json.dumps(ORDER) + m.group(5) + src[m.end():]
    if new != src:
        open(js, 'w', encoding='utf-8').write(new); print('samri-ai.js updated')
    else:
        print('samri-ai.js already up to date')


if __name__ == '__main__':
    main(sys.argv[1:])
