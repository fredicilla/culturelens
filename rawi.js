/**
 * rawi.js: Rawi, the CultureLens heritage agent, on the phone.
 *
 * Rawi is one agent with one memory of each learner (it runs on Supabase, see supabase/functions/rawi),
 * and it takes a role in each experience. This file is the agent's client, with no face of its own on the page:
 *   - it sends the agent what happened (events, measured attempts, what the learner said or sang)
 *   - it runs the actions the agent chose (each page registers handlers for its own)
 *   - it speaks the agent's line out loud, in Arabic or English
 * A page creates its agent with pageRawi(experience) where it has a screen for it: the Samri teacher
 * (samri-perform.js) opens at the end of the Samri experience and from its experience page.
 * Scripts that are not modules talk to it with   (window.rawiQ = window.rawiQ || []).push(['event', 'shot', {...}])
 */
// read as a namespace, so a phone holding an older cached rawi-config.js still loads (a missing named import would not)
import * as CFG from './rawi-config.js';

const isAr = () => window.currentLang === 'ar';
const L = (o) => (o == null ? '' : typeof o === 'string' ? o : isAr() ? (o.ar ?? o.en) : o.en);
const JUDGE = /[?&]judge=1/.test(location.search);

// ── where the agent is ──
function store(k, v) { try { if (v === undefined) return localStorage.getItem(k); if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) { return null; } }
export function endpoint() {
  const q = (n) => { const m = location.search.match(new RegExp('[?&]' + n + '=([^&]+)')); return m ? decodeURIComponent(m[1]) : null; };
  if (q('rawi')) { store('cl_rawi_url', q('rawi') === 'off' ? null : q('rawi')); }
  if (q('rawikey')) store('cl_rawi_key', q('rawikey'));
  const own = store('cl_rawi_url');
  const url = (own || CFG.RAWI_SUPABASE_URL || '').replace(/\/+$/, '');
  const key = store('cl_rawi_key') || CFG.RAWI_ANON_KEY || '';
  // run next to the database (a query parameter, so no extra CORS header is needed)
  const region = !own && CFG.RAWI_REGION ? '?forceFunctionRegion=' + CFG.RAWI_REGION : '';
  // our own agent checks no token (it limits each device itself), so a turn can be a plain request with no
  // preflight; another project may want its key sent
  return url ? { url: url + '/functions/v1/rawi' + region, key, plain: !own } : null;
}
export function deviceKey() {
  let k = store('cl_rawi_device');
  if (!k || !/^[A-Za-z0-9_-]{8,64}$/.test(k)) {
    const a = new Uint8Array(12); (crypto || window.msCrypto).getRandomValues(a);
    k = 'd' + Array.from(a, (b) => b.toString(36).padStart(2, '0')).join('').slice(0, 22);
    store('cl_rawi_device', k);
  }
  return k;
}

// ── who Rawi is on each page ──
const FACE = {
  samri: '<svg viewBox="0 0 64 64"><circle cx="32" cy="32" r="32" fill="#1B2140"/><path d="M8 64 C9 38 18 16 32 16 C46 16 55 38 56 64 Z" fill="#B4232B"/><ellipse cx="32" cy="36" rx="10.5" ry="12.5" fill="#B07C59"/><path d="M21.6 37 C22 50 27 55 32 55 C37 55 42 50 42.4 37 C39 45 36 46.5 32 46.5 C28 46.5 25 45 21.6 37 Z" fill="#D9D3C9"/><path d="M26.2 34.6 q2.4 1.8 4.8 0 M33 34.6 q2.4 1.8 4.8 0" stroke="#3A2418" stroke-width="1.5" fill="none" stroke-linecap="round"/><ellipse cx="32" cy="20.5" rx="13.5" ry="3.4" fill="none" stroke="#141212" stroke-width="2.6"/><ellipse cx="32" cy="17.6" rx="12.6" ry="3" fill="none" stroke="#141212" stroke-width="2.2"/></svg>',
  qahwa: '<svg viewBox="0 0 64 64"><circle cx="32" cy="32" r="32" fill="#2B1C14"/><path d="M6 64 C8 46 18 42 32 42 C46 42 56 46 58 64 Z" fill="#6B4426"/><path d="M12 64 C12 36 19 16 32 16 C45 16 52 36 52 64 Z" fill="#C8302F"/><ellipse cx="32" cy="35" rx="10" ry="12" fill="#9C6B48"/><path d="M22 37 C23 49 27 52 32 52 C37 52 41 49 42 37 C39 44 36 45 32 45 C28 45 25 44 22 37 Z" fill="#1E1714"/><path d="M26.4 33.6 q2.3 1.7 4.6 0 M33 33.6 q2.3 1.7 4.6 0" stroke="#2A1810" stroke-width="1.5" fill="none" stroke-linecap="round"/><ellipse cx="32" cy="19.8" rx="12.6" ry="3.2" fill="none" stroke="#141212" stroke-width="2.4"/></svg>',
  masaqil: '<svg viewBox="0 0 64 64"><circle cx="32" cy="32" r="31" fill="#2A1A10"/><circle cx="32" cy="36" r="17" fill="#B9865E"/><path d="M15 31c0-11 8-17 17-17s17 6 17 17c-5-3-11-4-17-4s-12 1-17 4z" fill="#F4F0E8"/><circle cx="26" cy="37" r="1.9" fill="#2A1A10"/><circle cx="38" cy="37" r="1.9" fill="#2A1A10"/><path d="M26 44c3.5 3 8.5 3 12 0" stroke="#5A3420" stroke-width="2" fill="none" stroke-linecap="round"/><path d="M14 64c2-9 9-13 18-13s16 4 18 13z" fill="#F4F0E8"/></svg>',
  sadu: '<svg viewBox="0 0 64 64"><circle cx="32" cy="32" r="32" fill="#3B1F1D"/><path d="M10 64 C10 34 18 13 32 13 C46 13 54 34 54 64 Z" fill="#151011"/><ellipse cx="32" cy="35" rx="11" ry="13" fill="#B4805B"/><path d="M20.5 32 C21 20 43 20 43.5 32 C40 25.5 24 25.5 20.5 32 Z" fill="#151011"/><path d="M25.6 34.2 q2.6 2.1 5.2 0 M33.2 34.2 q2.6 2.1 5.2 0" stroke="#3A2418" stroke-width="1.5" fill="none" stroke-linecap="round"/><path d="M28.4 41.4 q3.6 2.8 7.2 0" stroke="#7A3A2A" stroke-width="1.6" fill="none" stroke-linecap="round"/><path d="M12 60 C15 48 22 46 32 49 C42 46 49 48 52 60" fill="none" stroke="#C9574A" stroke-width="2.2"/></svg>',
};
FACE.general = FACE.samri;
export const PERSONA = {
  samri: { name: { en: "The mu'allim", ar: 'المعلّم' }, face: FACE.samri },
  qahwa: { name: { en: 'Abu Fahad', ar: 'أبو فهد' }, face: FACE.qahwa },
  masaqil: { name: { en: 'Fahad', ar: 'فهد' }, face: FACE.masaqil },
  sadu: { name: { en: 'Grandma Haya', ar: 'الجدة هيا' }, face: FACE.sadu },
  guide: { name: { en: 'Fahad', ar: 'فهد' }, face: FACE.general },   // the Najd guide (najd-guide.js) has his own face
  general: { name: { en: 'Rawi', ar: 'راوي' }, face: FACE.general },
};
const PAGES = { 'samri.html': 'samri', 'qahwa.html': 'qahwa', 'masaqeel.html': 'masaqil', 'sadu.html': 'sadu' };
const T = {
  hold: { en: 'Hold to talk', ar: 'اضغط وتكلّم' }, listening: { en: 'Listening... let go to send', ar: 'أسمعك... فك عشان ترسل' },
  thinking: { en: 'Thinking', ar: 'يفكّر' }, off: { en: "Rawi isn't connected yet.", ar: 'راوي مو متصل للحين.' },
  busy: { en: 'Too many people are talking to Rawi right now. Try again in a moment.', ar: 'راوي مشغول الحين، جرّب بعد شوي.' },
  failed: { en: "Couldn't reach Rawi. Check the connection and try again.", ar: 'ما قدرت أوصل لراوي. تأكد من الاتصال وجرّب مرة ثانية.' },
  mic: { en: 'The microphone is off. Allow it to talk to Rawi.', ar: 'المايك مقفل. اسمح له عشان تكلّم راوي.' },
  agent: { en: 'Rawi · AI agent', ar: 'راوي · وكيل ذكاء اصطناعي' },
};

// ── speaking ──
// Each character has a real Saudi voice from the agent (Groq's Orpheus, through our function, see tts.ts), and the
// phone's own voice takes over when that one is resting or out of reach. The words are always on the screen too.
//   speak(text, lang, { voice, onLevel(0..1), onStart })  ->  resolves when the line has been said (or cut off)
export const VOICE = { samri: 'sultan', qahwa: 'abdullah', masaqil: 'fahad', sadu: 'aisha', guide: 'fahad', general: 'abdullah' };
let voices = [];
function loadVoices() { try { voices = speechSynthesis.getVoices() || []; } catch (e) { voices = []; } }
if ('speechSynthesis' in window) { loadVoices(); try { speechSynthesis.addEventListener('voiceschanged', loadVoices); } catch (e) {} }
function pickVoice(lang) {
  const want = lang === 'ar' ? ['ar-SA', 'ar'] : ['en-US', 'en-GB', 'en'];
  for (const w of want) { const v = voices.find((x) => (x.lang || '').replace('_', '-').toLowerCase().startsWith(w.toLowerCase())); if (v) return v; }
  return null;
}
const sound = () => window.clSound || null;
// a tap anywhere lets the phone's voice speak later (iPhones need it); cl-sound.js does this on every page that loads it
document.addEventListener('touchend', () => { const s = sound(); if (s) s.prime(); }, { capture: true, passive: true, once: true });
document.addEventListener('click', () => { const s = sound(); if (s) s.prime(); }, { capture: true, passive: true, once: true });

// the line in pieces the voice can take (at most 190 characters), joined into as few requests as possible
export function voicePieces(text) {
  const out = [];
  let rest = String(text || '').replace(/\s+/g, ' ').trim();
  while (rest.length > 190) {
    const head = rest.slice(0, 191);
    let cut = -1;
    for (const re of [/[.!?؟]\s/g, /[،,;؛:]\s/g, /\s/g]) {
      let m, last = -1;
      while ((m = re.exec(head))) last = m.index + 1;
      if (last > 57) { cut = last; break; }
    }
    if (cut < 0) cut = 190;
    out.push(rest.slice(0, cut).trim()); rest = rest.slice(cut).trim();
  }
  if (rest) out.push(rest);
  return out;
}
// the agent's voice for a language is resting (its daily share is spent, or not open on this account): the phone
// speaks that language until then
let restingTill = {};
try { restingTill = JSON.parse(sessionStorage.getItem('cl_voice_rest') || '{}') || {}; } catch (e) {}
function restVoice(lang, ms) { restingTill[lang] = Date.now() + ms; try { sessionStorage.setItem('cl_voice_rest', JSON.stringify(restingTill)); } catch (e) {} }
async function fetchVoice(text, lang, voice, signal) {
  const ep = endpoint(); if (!ep) throw new Error('off');
  const headers = ep.plain ? { 'content-type': 'text/plain;charset=UTF-8' } : { 'content-type': 'application/json', ...(ep.key ? { authorization: 'Bearer ' + ep.key, apikey: ep.key } : {}) };
  const res = await fetch(ep.url, { method: 'POST', headers, body: JSON.stringify({ action: 'tts', text, lang, voice, device: deviceKey() }), signal });
  if (!res.ok || !/audio/.test(res.headers.get('content-type') || '')) {
    const j = await res.json().catch(() => ({}));
    const e = new Error(j.error || 'voice ' + res.status); e.retry = j.retry_ms || (res.status === 429 ? 10 * 60e3 : 0); e.hard = res.status === 400; throw e;
  }
  return res.arrayBuffer();
}
function decode(ctx, buf) {
  return new Promise((ok, bad) => { try { const p = ctx.decodeAudioData(buf, ok, bad); if (p && p.then) p.then(ok, bad); } catch (e) { bad(e); } });
}
const later = (ms) => new Promise((r) => setTimeout(r, ms));
function timeout(p, ms) { return Promise.race([p, later(ms).then(() => { throw new Error('slow'); })]); }

let talk = 0, current = null;
function playBuffer(ctx, ab, onLevel, my) {
  return new Promise((res) => {
    if (my !== talk) return res();
    const src = ctx.createBufferSource(); src.buffer = ab;
    const an = ctx.createAnalyser(); an.fftSize = 512;
    src.connect(an); an.connect(ctx.destination);
    const data = new Uint8Array(an.fftSize); let raf = 0, done = false;
    const end = () => { if (done) return; done = true; cancelAnimationFrame(raf); clearTimeout(guard); if (onLevel) onLevel(0); try { src.disconnect(); an.disconnect(); } catch (e) {} res(); };
    const tick = () => {
      an.getByteTimeDomainData(data); let s = 0;
      for (let i = 0; i < data.length; i++) { const v = (data[i] - 128) / 128; s += v * v; }
      onLevel(Math.min(1, Math.sqrt(s / data.length) * 3.4)); raf = requestAnimationFrame(tick);
    };
    if (onLevel) raf = requestAnimationFrame(tick);
    src.onended = end;
    const guard = setTimeout(end, ab.duration * 1000 + 1500);      // a phone that never says "ended"
    if (current) current.stop = () => { try { src.stop(); } catch (e) {} end(); };
    try { src.start(); } catch (e) { end(); }
  });
}
function deviceSpeak(text, lang, opts, my) {
  return new Promise((res) => {
    if (!text || !('speechSynthesis' in window) || my !== talk) return res();
    let flap = 0;
    const done = () => { clearTimeout(tm); clearInterval(flap); if (opts.onLevel) opts.onLevel(0); res(); };
    const tm = setTimeout(done, 1500 + text.length * 95);
    try {
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text), v = pickVoice(lang);
      u.lang = v ? v.lang : lang === 'ar' ? 'ar-SA' : 'en-US'; if (v) u.voice = v;
      u.rate = lang === 'ar' ? 0.98 : 1.02;
      u.onstart = () => { if (opts.onStart) opts.onStart(); if (opts.onLevel) flap = setInterval(() => opts.onLevel(Math.random() * 0.8), 110); };
      u.onend = done; u.onerror = done;
      if (current) current.stop = () => { try { speechSynthesis.cancel(); } catch (e) {} done(); };
      speechSynthesis.speak(u);
    } catch (e) { done(); }
  });
}
export function speak(text, lang, opts) {
  opts = opts || {};
  hush();
  const my = ++talk;
  current = { my, stop: null, ctrl: typeof AbortController !== 'undefined' ? new AbortController() : null };
  const finish = () => { if (current && current.my === my) current = null; };
  return (async () => {
    if (!text || store('cl_sound') === 'off') return finish();
    lang = lang === 'en' ? 'en' : 'ar';
    let left = String(text);
    const s = sound(), ctx = s ? s.ctx() : null;
    if (ctx && ctx.state !== 'running') { try { await timeout(ctx.resume(), 400); } catch (e) {} }
    if (opts.voice !== false && ctx && ctx.state === 'running' && endpoint() && Date.now() > (restingTill[lang] || 0) && store('cl_voice') !== 'device') {
      const parts = voicePieces(text), got = [];
      const get = (i) => (got[i] = got[i] || fetchVoice(parts[i], lang, opts.voice || 'fahad', current && current.ctrl ? current.ctrl.signal : undefined).then((b) => decode(ctx, b)));
      let i = 0;
      try {
        for (; i < parts.length; i++) {
          const p = get(i); if (i + 1 < parts.length) get(i + 1).catch(() => {});
          const ab = await timeout(p, i === 0 ? 9000 : 15000);
          if (my !== talk) return finish();
          if (i === 0 && opts.onStart) opts.onStart();
          await playBuffer(ctx, ab, opts.onLevel, my);
          if (my !== talk) return finish();
        }
        return finish();
      } catch (e) {
        if (my !== talk) return finish();
        if (e && e.retry) restVoice(lang, Math.min(e.retry, 6 * 3600e3)); else if (e && e.hard) restVoice(lang, 30 * 60e3);
        left = parts.slice(i).join(' ');     // the rest of the line, in the phone's own voice
      }
    }
    await deviceSpeak(left, lang, opts, my);
    finish();
  })();
}
export function hush() {
  talk++;
  const c = current; current = null;
  if (c) { try { c.ctrl && c.ctrl.abort(); } catch (e) {} try { c.stop && c.stop(); } catch (e) {} }
  try { speechSynthesis.cancel(); } catch (e) {}
}
// does this device have a voice for the language (otherwise the line is only shown, not spoken)
export function hasVoice(lang) { loadVoices(); return !!pickVoice(lang) || !!(sound() && endpoint()); }

// ── listening: the mic as 16 kHz WAV, for the ear (Whisper) ──
export function wav16(chunks, rate) {
  let n = 0; chunks.forEach((c) => (n += c.length));
  const ratio = rate / 16000, m = Math.floor(n / ratio), pcm = new Int16Array(m);
  let k = 0, acc = 0, cnt = 0, next = ratio, idx = 0;
  for (const c of chunks) for (let i = 0; i < c.length; i++) {
    acc += c[i]; cnt++; idx++;
    if (idx >= next && k < m) { const s = Math.max(-1, Math.min(1, acc / cnt)); pcm[k++] = s < 0 ? s * 0x8000 : s * 0x7fff; acc = 0; cnt = 0; next += ratio; }
  }
  const buf = new ArrayBuffer(44 + pcm.length * 2), dv = new DataView(buf);
  const w = (o, s) => { for (let i = 0; i < s.length; i++) dv.setUint8(o + i, s.charCodeAt(i)); };
  w(0, 'RIFF'); dv.setUint32(4, 36 + pcm.length * 2, true); w(8, 'WAVE'); w(12, 'fmt '); dv.setUint32(16, 16, true);
  dv.setUint16(20, 1, true); dv.setUint16(22, 1, true); dv.setUint32(24, 16000, true); dv.setUint32(28, 32000, true);
  dv.setUint16(32, 2, true); dv.setUint16(34, 16, true); w(36, 'data'); dv.setUint32(40, pcm.length * 2, true);
  new Int16Array(buf, 44).set(pcm);
  let bin = ''; const u8 = new Uint8Array(buf);
  for (let i = 0; i < u8.length; i += 0x8000) bin += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000));
  return { b64: btoa(bin), mime: 'audio/wav', secs: m / 16000 };
}
export async function recorder(onLevel) {
  hush();
  const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } });
  // the shared audio engine (cl-sound.js) is already awake from a tap; a new one made now might stay asleep on iPhones
  const s = sound(), shared = s ? s.ctx() : null;
  const C = window.AudioContext || window.webkitAudioContext, ctx = shared || new C();
  if (ctx.state !== 'running') { try { await timeout(ctx.resume(), 600); } catch (e) {} }
  const src = ctx.createMediaStreamSource(stream), proc = ctx.createScriptProcessor(4096, 1, 1), sink = ctx.createGain(), chunks = [];
  sink.gain.value = 0;
  proc.onaudioprocess = (e) => {
    const d = e.inputBuffer.getChannelData(0); chunks.push(new Float32Array(d));
    if (onLevel) { let q = 0; for (let i = 0; i < d.length; i += 16) q += d[i] * d[i]; onLevel(Math.min(1, Math.sqrt(q / (d.length / 16)) * 4)); }
  };
  src.connect(proc); proc.connect(sink); sink.connect(ctx.destination);
  return {
    running: () => ctx.state === 'running',
    stop() {
      try { proc.onaudioprocess = null; proc.disconnect(); src.disconnect(); sink.disconnect(); } catch (e) {}
      stream.getTracks().forEach((t) => t.stop());
      const rate = ctx.sampleRate; if (!shared) { try { ctx.close(); } catch (e) {} }
      return wav16(chunks, rate);
    },
  };
}

// ── the face on the page ──
const CSS = `
#rawi { position: fixed; z-index: 70; top: calc(env(safe-area-inset-top, 0px) + 118px); inset-inline-end: max(12px, calc((100vw - 430px) / 2 + 12px)); display: flex; flex-direction: column; align-items: flex-end;
  font-family: var(--font-ui, 'IBM Plex Sans Arabic', system-ui, sans-serif); color: #F3EEE6; pointer-events: none; }
html[dir="rtl"] #rawi { align-items: flex-start; }
#rawi[hidden] { display: none; }
#rawi * { box-sizing: border-box; }
.rawi-face { pointer-events: auto; position: relative; width: 52px; height: 52px; border-radius: 50%; border: 2px solid #E3C47A; padding: 0; background: #121830; cursor: pointer;
  box-shadow: 0 8px 22px rgba(0,0,0,.35); }
.rawi-face svg { width: 100%; height: 100%; border-radius: 50%; display: block; }
.rawi-face i { position: absolute; bottom: -2px; inset-inline-end: -2px; width: 16px; height: 16px; border-radius: 50%; background: #7EE08A; border: 2px solid #121830; }
.rawi-face.off i { background: #8A8F9E; }
.rawi-face.thinking { animation: rawiPulse 1.1s ease-in-out infinite; }
.rawi-face.news::after { content: ''; position: absolute; top: -3px; inset-inline-start: -3px; width: 12px; height: 12px; border-radius: 50%; background: #FF8A7A; }
@keyframes rawiPulse { 50% { box-shadow: 0 0 0 9px rgba(227,196,122,.18), 0 8px 22px rgba(0,0,0,.35); } }
.rawi-card { pointer-events: auto; margin-top: 10px; width: min(330px, calc(100vw - 24px)); background: rgba(14,18,36,.94); border: 1px solid rgba(227,196,122,.45);
  border-radius: 18px; padding: 12px 14px; backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px); box-shadow: 0 14px 40px rgba(0,0,0,.45); display: none; }
#rawi.open .rawi-card { display: block; animation: rawiIn .22s ease-out; }
@keyframes rawiIn { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: none; } }
.rawi-who { display: flex; align-items: center; gap: 8px; font-size: 13px; }
.rawi-who b { color: #E3C47A; font-size: 14px; }
.rawi-who span { color: rgba(243,238,230,.55); font-size: 11.5px; }
.rawi-x { margin-inline-start: auto; background: none; border: 0; color: rgba(243,238,230,.7); font-size: 20px; line-height: 1; cursor: pointer; padding: 2px 4px; }
.rawi-say { font-size: 16.5px; line-height: 1.65; margin-top: 6px; min-height: 1.6em; white-space: pre-wrap; }
.rawi-say .dots i { display: inline-block; width: 6px; height: 6px; margin: 0 2px; border-radius: 50%; background: #E3C47A; animation: rawiDot 1s infinite; }
.rawi-say .dots i:nth-child(2) { animation-delay: .15s; } .rawi-say .dots i:nth-child(3) { animation-delay: .3s; }
@keyframes rawiDot { 50% { opacity: .2; transform: translateY(-3px); } }
.rawi-heard { margin-top: 6px; font-size: 13px; color: rgba(243,238,230,.6); }
.rawi-row { display: flex; gap: 8px; margin-top: 10px; align-items: center; }
.rawi-mic { flex: 1; display: flex; align-items: center; justify-content: center; gap: 8px; background: #E3C47A; color: #16121D; border: 0; border-radius: 999px; padding: 10px 14px;
  font: inherit; font-weight: 700; font-size: 14.5px; cursor: pointer; touch-action: none; user-select: none; -webkit-user-select: none; position: relative; overflow: hidden; }
.rawi-mic svg { width: 18px; height: 18px; }
.rawi-mic.on { background: #FF8A7A; }
.rawi-mic b { position: absolute; inset: 0; background: rgba(255,255,255,.35); transform-origin: left; transform: scaleX(0); transition: transform .08s; }
.rawi-trace { margin-top: 8px; border-top: 1px dashed rgba(243,238,230,.2); padding-top: 6px; font: 11.5px/1.5 ui-monospace, Menlo, monospace; color: rgba(243,238,230,.7); direction: ltr; text-align: left; max-height: 160px; overflow: auto; }
.rawi-trace div { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.rawi-trace .k { color: #E3C47A; }
.rawi-card-x { margin-top: 8px; }
`;
const MIC = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/></svg>';

function mountUI(exp, api) {
  if (!document.getElementById('rawi-css')) { const st = document.createElement('style'); st.id = 'rawi-css'; st.textContent = CSS; document.head.appendChild(st); }
  const el = document.createElement('div'); el.id = 'rawi';
  el.innerHTML = '<button class="rawi-face" type="button" aria-label="Rawi">' + PERSONA[exp].face + '<i></i></button>' +
    '<div class="rawi-card" role="dialog"><div class="rawi-who"><b class="rawi-name"></b><span class="rawi-tag"></span><button class="rawi-x" type="button" aria-label="Close">×</button></div>' +
    '<div class="rawi-say" aria-live="polite"></div><div class="rawi-heard" hidden></div><div class="rawi-extra"></div>' +
    '<div class="rawi-row"><button class="rawi-mic" type="button"><b></b>' + MIC + '<span></span></button></div>' +
    (JUDGE ? '<div class="rawi-trace"></div>' : '') + '</div>';
  document.body.appendChild(el);
  const $ = (s) => el.querySelector(s);
  const face = $('.rawi-face'), say = $('.rawi-say'), mic = $('.rawi-mic'), heard = $('.rawi-heard');
  let lastSay = '', closeTimer = 0, touched = false;
  function labels() { $('.rawi-name').textContent = L(PERSONA[exp].name); $('.rawi-tag').textContent = L(T.agent); mic.querySelector('span').textContent = L(T.hold); }
  function open(on, auto) {
    el.classList.toggle('open', on); face.classList.remove('news'); clearTimeout(closeTimer);
    if (on && auto && !touched) closeTimer = setTimeout(() => { if (!touched) el.classList.remove('open'); }, 9000);
    if (on && !api.started()) api.start();
  }
  face.addEventListener('click', () => { touched = true; open(!el.classList.contains('open')); });
  $('.rawi-x').addEventListener('click', () => { touched = false; open(false); hush(); });
  el.addEventListener('pointerdown', () => { touched = true; clearTimeout(closeTimer); });
  // hold the mic to talk
  let rec = null, down = false;
  const bar = mic.querySelector('b');
  mic.addEventListener('pointerdown', async (e) => {
    e.preventDefault(); down = true; hush();
    try { mic.setPointerCapture(e.pointerId); } catch (x) {}
    try {
      rec = await recorder((lv) => { bar.style.transform = 'scaleX(' + lv + ')'; });
      if (!down) { rec.stop(); rec = null; return; }
      mic.classList.add('on'); mic.querySelector('span').textContent = L(T.listening);
    } catch (err) { show(L(T.mic)); rec = null; }
  });
  const release = () => {
    down = false;
    if (!rec) return;
    const r = rec; rec = null; mic.classList.remove('on'); bar.style.transform = 'scaleX(0)'; labels();
    const audio = r.stop();
    if (audio.secs > 0.5) api.turn({ type: 'say', audio });
  };
  mic.addEventListener('pointerup', release); mic.addEventListener('pointercancel', release);
  function show(text, extraHtml) { lastSay = text; say.textContent = text; $('.rawi-extra').innerHTML = extraHtml || ''; }
  labels();
  document.addEventListener('languageChanged', labels);
  return {
    el, open, show,
    thinking(on) { face.classList.toggle('thinking', on); if (on) say.innerHTML = '<span class="dots"><i></i><i></i><i></i></span>'; else if (say.querySelector('.dots')) say.textContent = lastSay; },
    reply(text, h) {
      show(text);
      heard.hidden = !h || !h.text; if (h && h.text) heard.textContent = '« ' + h.text + ' »';
      if (!el.classList.contains('open')) { if (text) { open(true, true); } else face.classList.add('news'); }
    },
    trace(tr) {
      const box = $('.rawi-trace'); if (!box || !tr) return;
      box.innerHTML = tr.map((t) => '<div><span class="k">' + t.kind + '</span> ' + (t.name || '') + (t.ms != null ? ' · ' + t.ms + 'ms' : '') + (t.brief ? ' · ' + String(t.brief).replace(/[<>&]/g, '') : '') + '</div>').join('');
    },
    off(on) { face.classList.toggle('off', on); },
    hide(on) { el.hidden = !!on; if (on) hush(); },
  };
}

// ── the agent ──
export function createRawi(opts) {
  const exp = opts.experience in PERSONA ? opts.experience : 'general';
  const handlers = {};
  Object.entries(opts.actions || {}).forEach(([k, f]) => (handlers[k] = f));
  let session = null; try { session = sessionStorage.getItem('cl_rawi_s_' + exp); } catch (e) {}
  let started = !!session, inflight = null, pendingEvent = null;
  const listeners = { reply: [] };
  const api = {
    experience: exp,
    started: () => started,
    on(name, fn) { if (name === 'reply') listeners.reply.push(fn); else handlers[name] = fn; },
    start(context) { started = true; return api.turn({ type: 'start', context: context || { page: exp, time: new Date().getHours() + 'h' } }); },
    // events while a turn is running wait, and only the newest one is sent: the agent always reasons on the latest state
    event(name, data) {
      if (!endpoint()) return Promise.resolve(null);
      if (inflight) { pendingEvent = { type: 'event', name, data }; return inflight; }
      return api.turn({ type: 'event', name, data });
    },
    say(text) { return api.turn({ type: 'say', text }); },
    finish() { return api.turn({ type: 'finish' }); },
    turn(input) { const p = (inflight || Promise.resolve()).then(() => run(input)); inflight = p; p.finally(() => { if (inflight === p) inflight = null; }); return p; },
    speak, hush,
    get session() { return session; },
  };
  const ui = opts.ui === true ? mountUI(exp, api) : null;
  api.ui = ui;
  if (ui && !endpoint()) { ui.off(true); ui.show(L(T.off)); }
  // wake the agent while the page is still loading, so the first real turn does not pay for a cold start
  { const ep = endpoint(); if (ep) fetch(ep.url, { method: 'GET' }).catch(() => {}); }

  async function post(input) {
    const ep = endpoint(); if (!ep) return { ok: false, error: 'off' };
    const body = JSON.stringify({ action: 'turn', device: deviceKey(), lang: isAr() ? 'ar' : 'en', experience: exp, session_id: session, input });
    for (let k = 0; k < 3; k++) {
      const headers = ep.plain ? { 'content-type': 'text/plain;charset=UTF-8' } : { 'content-type': 'application/json', ...(ep.key ? { authorization: 'Bearer ' + ep.key, apikey: ep.key } : {}) };
      const res = await fetch(ep.url, { method: 'POST', headers, body });
      const j = await res.json().catch(() => ({ ok: false, error: 'bad reply' }));
      if (j.error === 'slow down' && j.retry_ms) { await new Promise((r) => setTimeout(r, j.retry_ms + 50)); continue; }
      return j;
    }
    return { ok: false, error: 'busy' };
  }
  async function run(input) {
    if (ui) ui.thinking(true);
    let r;
    try { r = await post(input); } catch (e) { r = { ok: false, error: 'failed' }; }
    if (ui) ui.thinking(false);
    if (!r.ok) {
      if (ui) ui.reply(L(r.error === 'off' ? T.off : r.error === 'busy' || r.error === 'daily limit' ? T.busy : T.failed));
      listeners.reply.forEach((f) => { try { f(r); } catch (e) {} });
      return r;
    }
    session = r.session_id; try { sessionStorage.setItem('cl_rawi_s_' + exp, session); } catch (e) {}
    if (ui) { ui.reply(r.say, input.type === 'say' ? r.heard : null); ui.trace(r.trace); }
    listeners.reply.forEach((f) => { try { f(r); } catch (e) {} });
    const spoken = opts.speak === false ? Promise.resolve() : speak(r.say, isAr() ? 'ar' : 'en', { voice: VOICE[exp] });
    (r.actions || []).forEach((a) => { const f = handlers[a.name]; if (f) { try { f(a.args, spoken); } catch (e) { console.warn('rawi action', a.name, e); } } });
    if (pendingEvent) { const ev = pendingEvent; pendingEvent = null; setTimeout(() => api.turn(ev), 0); }
    return r;
  }
  return api;
}

// ── one agent per page, reachable from any script ──
let page = null;
export function pageRawi(exp, opts) {
  if (page) return page;
  page = createRawi({ experience: exp, ...(opts || {}) });
  window.rawi = page;
  const q = window.rawiQ || [];
  const run = (item) => { const [verb, ...args] = item; if (typeof page[verb] === 'function') page[verb](...args); };
  q.forEach(run);
  window.rawiQ = { push: run };
  return page;
}
// nothing starts by itself: a page creates its agent (pageRawi) where it has a screen for it, like the Samri teacher
