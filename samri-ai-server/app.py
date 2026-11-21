"""The AI Samri server for CultureLens.

    POST /compose  {"topic": "النخلة"}
        Claude writes two abyat of Samri on the topic, checked for the meter and the rhyme the rows sing.
        -> {"ok": true, "poem": {"topic", "mean", "abyat": [{"sadr": half, "ajz": half}, ...]}}
    POST /sing     {"half": {"text", "syl"}, "part": "sadr" | "ajz", "row": 0 | 1}
        One row sings one half. -> {"ok": true, "mp3": base64, "lead": seconds before the first pulse, "dur": seconds}
    GET  /health

Settings (environment): ANTHROPIC_API_KEY (without it, or with SAMRI_MOCK=1, /compose answers from the
poems that ship with the app), SAMRI_MODEL, ALLOWED_ORIGINS (comma separated), SAMRI_PER_HOUR (compose
requests per visitor per hour), SAMRI_PER_DAY (compose requests for everyone per day, a cap on the API
bill), SAMRI_SING_PER_HOUR (sung halves per visitor per hour), SAMRI_TAKES (takes per row, 3; fewer is
faster on a small server), PORT.
See README.md.
"""
import os, time, base64, hashlib, threading, collections
import numpy as np
from concurrent.futures import ThreadPoolExecutor
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
import compose as C
import samri_verse as V
import samri_sing as S

ORIGINS = [o.strip() for o in os.environ.get('ALLOWED_ORIGINS', 'https://fredicilla.github.io,http://localhost:5500,http://127.0.0.1:5500,http://localhost:8000,http://127.0.0.1:8000').split(',') if o.strip()]
PER_HOUR = int(os.environ.get('SAMRI_PER_HOUR', '20'))
PER_DAY = int(os.environ.get('SAMRI_PER_DAY', '150'))
SING_PER_HOUR = int(os.environ.get('SAMRI_SING_PER_HOUR', '200'))
WORKERS = max(1, int(os.environ.get('SAMRI_WORKERS', str(os.cpu_count() or 2))))
TAKES = min(3, max(1, int(os.environ.get('SAMRI_TAKES', '3'))))

app = FastAPI(title='CultureLens AI Samri')
app.add_middleware(CORSMiddleware, allow_origins=ORIGINS, allow_methods=['GET', 'POST'], allow_headers=['content-type'], max_age=86400)
pool = ThreadPoolExecutor(max_workers=WORKERS)
hits = collections.defaultdict(collections.deque); sings = collections.defaultdict(collections.deque); hits_lock = threading.Lock()
day = {'d': None, 'n': 0}
cache = collections.OrderedDict(); cache_lock = threading.Lock(); CACHE_MAX = 300
CLICK = 0.03


def visitor(req):
    return (req.headers.get('cf-connecting-ip') or req.headers.get('x-forwarded-for') or (req.client.host if req.client else '?')).split(',')[0].strip()


def allowed(req, book=None, per_hour=None, count_day=True):
    """per visitor per hour, and (for poems) a cap for everyone per day, so the API bill can't run away"""
    book = hits if book is None else book; per_hour = PER_HOUR if per_hour is None else per_hour
    ip = visitor(req); now = time.time()
    with hits_lock:
        if len(book) > 5000:
            for k in [k for k, q in book.items() if not q or now - q[-1] > 3600]: del book[k]
        today = time.strftime('%Y-%m-%d', time.gmtime(now))
        if day['d'] != today: day['d'] = today; day['n'] = 0
        if count_day and day['n'] >= PER_DAY: return False
        q = book[ip]
        while q and now - q[0] > 3600: q.popleft()
        if len(q) >= per_hour: return False
        q.append(now)
        if count_day: day['n'] += 1
    return True


class ComposeIn(BaseModel):
    topic: str
    lang: str = 'ar'


class SingIn(BaseModel):
    half: dict
    part: str = 'sadr'
    row: int = 0
    seed: int = 0


@app.get('/health')
def health():
    return {'ok': True, 'model': C.MODEL, 'mock': bool(os.environ.get('SAMRI_MOCK') or not os.environ.get('ANTHROPIC_API_KEY')), 'takes': TAKES, 'workers': WORKERS}


@app.post('/compose')
async def compose(body: ComposeIn, req: Request):
    if not allowed(req):
        return JSONResponse({'ok': False, 'error': 'busy', 'reason': 'too many poems from here for now; try again later'}, status_code=429)
    t0 = time.time()
    import asyncio
    out = await asyncio.get_running_loop().run_in_executor(pool, C.compose, body.topic)
    out['ms'] = int((time.time() - t0) * 1000)
    # one line per poem for the host's logs (not the topic: that's what the visitor typed)
    print('compose', 'ok' if out.get('ok') else out.get('error'), 'tries=%s' % out.get('tries', '-'), 'ms=%d' % out['ms'], 'today=%d' % day['n'], flush=True)
    return out


def render(half, part, row, seed):
    h = {'text': half.get('text', ''), 'syl': half.get('syl', [])}
    try: errs = V.check_half(h, part)
    except Exception: errs = ['the half is not in the right shape']
    if errs: return {'ok': False, 'error': 'meter', 'reason': errs}
    key = hashlib.sha1(('|'.join(s['t'] for s in h['syl']) + part + str(row) + str(seed)).encode()).hexdigest()
    with cache_lock:
        if key in cache:
            cache.move_to_end(key); return cache[key]
    y, lead = S.render_row(V.sung(h, part), row=row, seed=seed, takes=TAKES)
    # a click 30 ms in, then the singing from 120 ms: decoders don't all start an mp3 at the same place,
    # so the app finds the click and lines the singing up from it
    pad = int(0.12 * S.SR); c = int(CLICK * S.SR)
    z = np.zeros(pad + len(y), dtype=np.float32); z[pad:] = y; z[c:c + 4] = [0.95, -0.95, 0.95, -0.95]
    out = {'ok': True, 'mp3': base64.b64encode(S.mp3(z)).decode(), 'click': CLICK, 'lead': round(lead + pad / S.SR, 4), 'dur': round(len(z) / S.SR, 4)}
    with cache_lock:
        cache[key] = out
        while len(cache) > CACHE_MAX: cache.popitem(last=False)
    return out


@app.post('/sing')
async def sing(body: SingIn, req: Request):
    if body.part not in ('sadr', 'ajz') or body.row not in (0, 1):
        return JSONResponse({'ok': False, 'error': 'bad request'}, status_code=400)
    if not allowed(req, sings, SING_PER_HOUR, count_day=False):
        return JSONResponse({'ok': False, 'error': 'busy'}, status_code=429)
    import asyncio
    return await asyncio.get_running_loop().run_in_executor(pool, render, body.half, body.part, body.row, body.seed)


@app.on_event('startup')
def warm():
    # load the voice once at start, so the first visitor doesn't wait for it
    pool.submit(S.Voice.get)
