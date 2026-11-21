/**
 * samri-perform.js: perform the Samri in the row, taught by the mu'allim (Rawi, the CultureLens agent).
 *
 * This is the Samri as it is really done, not a dance tutorial. You kneel in the answering row holding
 * something as your tar (a plate, a pot lid, a hardcover book). The first row raises a half-verse over the
 * real drum pattern; then it is your turn: strike your tar on the strokes and sing the line back, the way the
 * second row answers (يشيل ويرد).
 *
 * The phone measures, the agent teaches:
 *   - an AudioWorklet on the microphone hears each strike on your tar (a sharp jump of high-frequency
 *     energy) and times it against the drum clock of samri-music.js, so every strike is early, on time, late
 *     or missing, to the millisecond. It also records your sung answer.
 *   - during your turn the drums and the rows rest (music.rests), so the microphone only hears you
 *   - the attempt (strikes, voice, the recording) goes to Rawi, whose ear (Whisper) checks which words you
 *     sang. The agent reads all of it with what it remembers of you, says one thing to fix, and decides the
 *     next drill (start_drill): the same line again, a level up, a level down, another half or poem.
 * Levels: 1 the second row answers first, then you; 2 you answer right after the call; 3 from memory;
 * 4 you lead the call and the row answers you.
 * Add ?sim=1 to the address to run it with a simulated player (strikes and voice), for testing.
 */
import { Music, STYLES, SUNG } from './samri-music.js';
import { BANK, loadTopic } from './samri-ai.js';
import { pageRawi, PERSONA, endpoint, wav16, hush } from './rawi.js';

const SIM = /[?&]sim=1/.test(location.search);
const JUDGE = /[?&]judge=1/.test(location.search);
const isAr = () => window.currentLang === 'ar';
const L = (o) => (o == null ? '' : typeof o === 'string' ? o : isAr() ? (o.ar ?? o.en) : o.en);
const num = (n) => (isAr() ? String(n).replace(/\d/g, (d) => '٠١٢٣٤٥٦٧٨٩'[d]) : String(n));
const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const $ = (s) => document.querySelector(s);

const T = {
  entry: { en: 'Perform with the mu\'allim', ar: 'أدِّ السامري مع المعلّم' },
  title: { en: 'In the row', ar: 'في الصف' },
  intro: { en: 'Kneel in the answering row and pick up something to be your tar: a plate, a pot lid or a hardcover book. When the first row has sung its line, strike your tar with the strokes and sing the line back. The mu\'allim listens and teaches you.', ar: 'اجلس بالصف اللي يرد، وخذ شي يكون طارك: صحن، غطا قدر، أو كتاب جلد. لما يشيل الصف الأول بيته، اضرب طارك مع الضربات ورد البيت بصوتك. والمعلّم يسمعك ويعلّمك.' },
  privacy: { en: 'Your strikes are timed on this phone. Only your sung answers are sent to the agent\'s ear, to check the words.', ar: 'ضرباتك تنحسب على جوالك. بس ردّك بصوتك يروح لأذن الوكيل عشان يتأكد من الكلمات.' },
  start: { en: 'I have my tar, start', ar: 'معي طاري، يلا' },
  mic: { en: 'The mu\'allim needs to hear your tar and your voice. Allow the microphone, then try again.', ar: 'المعلّم لازم يسمع طارك وصوتك. اسمح للمايك وجرّب مرة ثانية.' },
  retry: { en: 'Try again', ar: 'جرّب مرة ثانية' },
  off: { en: 'The agent isn\'t connected yet, so there is no one to teach you. (It runs on the team\'s Supabase project.)', ar: 'الوكيل مو متصل للحين، فما فيه أحد يعلّمك. (يشتغل على مشروع الفريق في Supabase).' },
  count: { en: 'The drums start', ar: 'بدت الطبول' },
  callA: { en: 'The first row raises the line', ar: 'الصف الأول يشيل' },
  callB: { en: 'The second row answers', ar: 'الصف الثاني يرد' },
  you: { en: 'Your turn: strike and answer', ar: 'دورك: اضرب ورد' },
  youLead: { en: 'Your turn: lead the line', ar: 'دورك: شيل البيت' },
  answersYou: { en: 'The row answers you', ar: 'الصف يرد عليك' },
  thinking: { en: 'The mu\'allim is listening back', ar: 'المعلّم يراجع' },
  again: { en: 'Again', ar: 'مرة ثانية' },
  finish: { en: 'Finish', ar: 'خلصت' },
  close: { en: 'Close', ar: 'إغلاق' },
  ask: { en: 'Hold to ask', ar: 'اضغط واسأل' },
  asking: { en: 'Listening...', ar: 'أسمعك...' },
  level: { en: 'Level', ar: 'المستوى' },
  heavy: { en: 'heavy', ar: 'ثقيل' }, light: { en: 'light', ar: 'خفيف' },
  strikes: { en: 'Strikes', ar: 'الضربات' }, words: { en: 'Words', ar: 'الكلمات' },
  early: { en: 'early', ar: 'مستعجل' }, late: { en: 'late', ar: 'متأخر' }, ontime: { en: 'on time', ar: 'بوقتها' },
  ms: { en: 'ms', ar: 'جزء من الثانية' },
  agent: { en: 'Rawi · AI agent', ar: 'راوي · وكيل ذكاء اصطناعي' },
  noVoice: { en: 'no voice heard', ar: 'ما سمعت صوتك' },
  busy: { en: 'Too many people are with the mu\'allim right now. Try again in a moment.', ar: 'المعلّم مشغول الحين، جرّب بعد شوي.' },
  failed: { en: 'Couldn\'t reach the mu\'allim. Check the connection and try again.', ar: 'ما قدرت أوصل للمعلّم. تأكد من الاتصال وجرّب مرة ثانية.' },
};

// ── the lines you can be drilled on: the verse the app teaches, and the six poems sung ahead of time ──
function halfOf(poem, i) {
  if (poem === 'classic') {
    const s = SUNG[i ? 'h2' : 'h1'];
    return { text: s.words.join(' '), words: s.words, timing: s.syl, voice: (row) => ({ row, what: i ? 'h2' : 'h1', vol: 1 }) };
  }
  const p = BANK[poem]; if (!p) return null;
  const bi = i >> 1, part = i & 1 ? 'ajz' : 'sadr', h = p.abyat[bi] && p.abyat[bi][part];
  if (!h) return null;
  const words = h.text.split(' '), what = 'sp:' + poem + ':' + i;
  SUNG[what] = { words, syl: h.timing };   // so the rows on the page move their mouths to it too
  return { text: h.text, words, timing: h.timing, clip: (row) => 'b' + bi + part[0] + row, topic: poem, what };
}

// ── the ear on the phone: strikes and voice level, and the recording of your answer ──
const WORKLET = `
class ClEar extends AudioWorkletProcessor {
  constructor() {
    super();
    this.hp = 0; this.px = 0; this.prev = [0, 0, 0]; this.floor = 1e-5; this.last = -1;
    this.acc = 0; this.n = 0; this.out = null; this.ds = 0; this.dn = 0; this.ratio = sampleRate / 16000;
    this.port.onmessage = (e) => {
      if (e.data.rec === true) { this.out = []; this.ds = 0; this.dn = 0; }
      if (e.data.rec === false && this.out) { const pcm = new Float32Array(this.out); this.out = null; this.port.postMessage({ pcm }, [pcm.buffer]); }
    };
  }
  process(inputs) {
    const ch = inputs[0] && inputs[0][0];
    if (!ch) return true;
    let e = 0, v = 0;
    for (let i = 0; i < ch.length; i++) {
      const x = ch[i], y = 0.86 * (this.hp + x - this.px); this.hp = y; this.px = x;   // high-pass, about 1 kHz
      e += y * y; v += x * x;
      if (this.out) { this.ds += x; this.dn++; if (this.dn >= this.ratio) { this.out.push(this.ds / this.dn); this.ds = 0; this.dn = 0; } }
    }
    e /= ch.length; v /= ch.length;
    // a strike: high-frequency energy jumps within one block (a few ms) far above the last few blocks and the room
    const before = Math.max(this.prev[0], this.prev[1], this.prev[2], 1e-9);
    if (e > 10 * this.floor && e > 7 * before && e > 4e-6 && currentTime - this.last > 0.12) { this.last = currentTime; this.port.postMessage({ hit: currentTime, e }); }
    this.prev.shift(); this.prev.push(e);
    this.floor = e < this.floor ? 0.95 * this.floor + 0.05 * e : 0.9997 * this.floor + 0.0003 * e;
    this.acc += v; this.n++;
    if (this.n >= 8) { this.port.postMessage({ lvl: Math.sqrt(this.acc / this.n), t: currentTime }); this.acc = 0; this.n = 0; }
    return true;
  }
}
registerProcessor('cl-ear', ClEar);`;

const CSS = `
#sp-ov [hidden] { display: none !important; }
#sp-ov { position: fixed; inset: 0; z-index: 2147483000; background: radial-gradient(120% 80% at 50% 30%, #18204A 0%, #070A16 70%); color: #F3EEE6; display: none; overflow: hidden;
  font-family: var(--font-ui, 'IBM Plex Sans Arabic', system-ui, sans-serif); }
#sp-ov.open { display: block; }
#sp-ov * { box-sizing: border-box; }
.sp-top { position: absolute; top: 0; left: 0; right: 0; z-index: 5; display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: calc(10px + env(safe-area-inset-top, 0px)) 14px 10px; }
.sp-top button { color: #F3EEE6; background: rgba(243,238,230,.08); border: 1px solid rgba(243,238,230,.18); border-radius: 999px; padding: 8px 14px; font: inherit; font-size: 14px; cursor: pointer; }
.sp-title { font-weight: 700; font-size: 16px; display: flex; align-items: center; gap: 8px; }
.sp-title i { font-style: normal; font-size: 11px; color: #070A16; background: #E3C47A; border-radius: 999px; padding: 2px 8px; }
.sp-stage { position: absolute; left: 0; right: 0; top: calc(env(safe-area-inset-top, 0px) + 58px); bottom: 300px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 14px; padding: 0 16px; }
.sp-who { font-size: 15px; font-weight: 700; color: #E3C47A; min-height: 1.5em; text-align: center; letter-spacing: .2px; }
.sp-who.you { color: #7EE08A; font-size: 18px; }
.sp-ring { position: relative; width: min(56vw, 230px); aspect-ratio: 1; border-radius: 50%; }
.sp-skin { position: absolute; inset: 9%; border-radius: 50%; background: radial-gradient(circle at 45% 40%, #F1E2C4, #D8C098 62%, #B89A6E); box-shadow: 0 0 0 9px #6B4426, 0 0 0 11px #3A2414, 0 16px 40px rgba(0,0,0,.5); }
.sp-flash { position: absolute; inset: 9%; border-radius: 50%; background: radial-gradient(circle, rgba(255,255,255,.75), rgba(255,255,255,0) 70%); opacity: 0; pointer-events: none; }
.sp-flash.go { animation: spFlash .28s ease-out; }
.sp-flash.cue { background: radial-gradient(circle, rgba(227,196,122,.55), rgba(227,196,122,0) 70%); }
@keyframes spFlash { from { opacity: 1; } to { opacity: 0; } }
.sp-dots { position: absolute; inset: 0; }
.sp-dots i { position: absolute; width: 14px; height: 14px; margin: -7px 0 0 -7px; border-radius: 50%; background: rgba(243,238,230,.18); border: 2px solid rgba(243,238,230,.25); transition: background .15s, transform .15s; }
.sp-dots i.now { border-color: #E3C47A; transform: scale(1.35); }
.sp-dots i.ok { background: #7EE08A; border-color: #7EE08A; } .sp-dots i.near { background: #E3C47A; border-color: #E3C47A; } .sp-dots i.miss { background: transparent; border-color: #FF8A7A; }
.sp-line { font-family: var(--font-arabic, 'CL Saudi', 'IBM Plex Sans Arabic', sans-serif); direction: rtl; font-size: clamp(22px, 6.4vw, 30px); line-height: 1.6; text-align: center; min-height: 1.6em; }
.sp-line i { font-style: normal; color: rgba(243,238,230,.45); transition: color .12s; }
.sp-line i.on { color: #F3EEE6; } .sp-line i.now { color: #E3C47A; }
.sp-line.hide i { color: transparent; text-shadow: 0 0 12px rgba(243,238,230,.35); }
.sp-result { display: flex; gap: 8px; flex-wrap: wrap; justify-content: center; min-height: 34px; }
.sp-chip { border-radius: 999px; padding: 6px 12px; font-size: 13.5px; background: rgba(243,238,230,.08); border: 1px solid rgba(243,238,230,.16); }
.sp-chip b { color: #E3C47A; }
.sp-card { position: absolute; left: 12px; right: 12px; bottom: calc(12px + env(safe-area-inset-bottom, 0px)); max-width: 620px; margin: 0 auto; background: rgba(14,18,36,.94); border: 1px solid rgba(227,196,122,.45);
  border-radius: 20px; padding: 14px 16px; backdrop-filter: blur(6px); -webkit-backdrop-filter: blur(6px); max-height: 290px; overflow: auto; }
.sp-agent { display: flex; align-items: center; gap: 10px; }
.sp-face { width: 44px; height: 44px; border-radius: 50%; border: 2px solid #E3C47A; overflow: hidden; flex: none; }
.sp-face svg { width: 100%; height: 100%; display: block; }
.sp-agent b { display: block; color: #E3C47A; font-size: 15px; } .sp-agent small { color: rgba(243,238,230,.55); font-size: 11.5px; }
.sp-lvl { margin-inline-start: auto; font-size: 12px; color: rgba(243,238,230,.7); border: 1px solid rgba(243,238,230,.2); border-radius: 999px; padding: 3px 9px; white-space: nowrap; }
.sp-say { font-size: 17px; line-height: 1.7; margin-top: 8px; min-height: 1.7em; }
.sp-say small { display: block; font-size: 12.5px; color: rgba(243,238,230,.55); margin-top: 6px; line-height: 1.5; }
.sp-say .dots i { display: inline-block; width: 6px; height: 6px; margin: 0 2px; border-radius: 50%; background: #E3C47A; animation: spDot 1s infinite; }
.sp-say .dots i:nth-child(2) { animation-delay: .15s; } .sp-say .dots i:nth-child(3) { animation-delay: .3s; }
@keyframes spDot { 50% { opacity: .2; transform: translateY(-3px); } }
.sp-heard { font-size: 13px; color: rgba(243,238,230,.6); margin-top: 4px; font-family: var(--font-arabic, 'CL Saudi', sans-serif); }
.sp-btns { display: flex; gap: 8px; margin-top: 12px; flex-wrap: wrap; }
.sp-btn { background: #E3C47A; color: #16121D; border: 0; border-radius: 999px; padding: 11px 20px; font: inherit; font-weight: 700; font-size: 15px; cursor: pointer; }
.sp-btn.ghost { background: transparent; color: #F3EEE6; border: 1px solid rgba(243,238,230,.3); }
.sp-btn.mic { touch-action: none; user-select: none; -webkit-user-select: none; }
.sp-btn.mic.on { background: #FF8A7A; }
.sp-trace { margin-top: 10px; border-top: 1px dashed rgba(243,238,230,.2); padding-top: 6px; font: 11.5px/1.5 ui-monospace, Menlo, monospace; color: rgba(243,238,230,.7); direction: ltr; text-align: left; }
.sp-trace div { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; } .sp-trace .k { color: #E3C47A; }
#sp-entry { position: fixed; z-index: 60; top: calc(env(safe-area-inset-top, 0px) + 118px); inset-inline-start: max(16px, calc((100vw - 430px) / 2 + 16px)); display: none; align-items: center; gap: 8px; background: #E3C47A; color: #16121D;
  border: 0; border-radius: 999px; padding: 11px 18px; font: inherit; font-weight: 700; font-size: 15px; cursor: pointer; box-shadow: 0 8px 24px rgba(0,0,0,.35); white-space: nowrap; }
#sp-entry.show { display: inline-flex; animation: spIn .4s ease-out; }
#sp-entry svg { width: 18px; height: 18px; } #sp-entry i { font-style: normal; font-size: 11px; background: #16121D; color: #E3C47A; border-radius: 999px; padding: 2px 7px; }
@keyframes spIn { from { transform: scale(.85); opacity: 0; } to { transform: none; opacity: 1; } }
`;
const TAR = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="5" stroke-dasharray="2 2"/></svg>';

// ── state ──
const S = { open: false, phase: 'intro', drill: null, run: null, hits: [], levels: [], last: null, sm: null, music: null, own: false, mic: null, node: null, rec: null, askRec: false, raf: 0 };
let rawi = null;

function build() {
  const st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
  const ov = document.createElement('div'); ov.id = 'sp-ov'; ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-modal', 'true');
  ov.innerHTML = '<header class="sp-top"><button type="button" id="sp-close" aria-label="Close">✕</button><div class="sp-title"><span id="sp-title"></span><i>AI</i></div><button type="button" id="sp-lang"></button></header>' +
    '<div class="sp-stage"><div class="sp-who" id="sp-who"></div><div class="sp-ring"><div class="sp-skin"></div><b class="sp-flash" id="sp-flash"></b><div class="sp-dots" id="sp-dots"></div></div>' +
    '<div class="sp-line" id="sp-line"></div><div class="sp-result" id="sp-result"></div></div>' +
    '<section class="sp-card"><div class="sp-agent"><span class="sp-face">' + PERSONA.samri.face + '</span><div><b id="sp-name"></b><small id="sp-tag"></small></div><span class="sp-lvl" id="sp-lvl" hidden></span></div>' +
    '<div class="sp-say" id="sp-say" aria-live="polite"></div><div class="sp-heard" id="sp-heard"></div><div class="sp-btns" id="sp-btns"></div>' + (JUDGE ? '<div class="sp-trace" id="sp-trace"></div>' : '') + '</section>';
  document.body.appendChild(ov);
  const en = document.createElement('button'); en.id = 'sp-entry'; en.type = 'button'; document.body.appendChild(en);
  en.addEventListener('click', () => open());
  $('#sp-close').addEventListener('click', close);
  $('#sp-lang').addEventListener('click', () => { if (typeof window.toggleLanguage === 'function') window.toggleLanguage(); });
  document.addEventListener('languageChanged', labels);
  labels();
  // the button shows once the page is ready, when no round of the page's own game is being played
  setInterval(() => { en.classList.toggle('show', document.body.classList.contains('mq-ready') && !document.body.classList.contains('sm-playing') && !S.open); }, 400);
}
function labels() {
  $('#sp-entry').innerHTML = TAR + '<span>' + L(T.entry) + '</span><i>AI</i>';
  $('#sp-title').textContent = L(T.title); $('#sp-lang').textContent = isAr() ? 'English' : 'العربية';
  $('#sp-name').textContent = L(PERSONA.samri.name); $('#sp-tag').textContent = L(T.agent);
  if (S.open && S.phase === 'intro') intro();
}
function say(html) { $('#sp-say').innerHTML = html; }
function buttons(list) {
  const box = $('#sp-btns'); box.innerHTML = '';
  list.forEach((b) => {
    const el = document.createElement('button'); el.type = 'button'; el.className = 'sp-btn' + (b.ghost ? ' ghost' : '') + (b.mic ? ' mic' : ''); el.textContent = L(b.label);
    if (b.mic) wireAsk(el); else el.addEventListener('click', b.onClick);
    box.appendChild(el);
  });
}
function who(o, you) { const w = $('#sp-who'); w.textContent = o ? L(o) : ''; w.classList.toggle('you', !!you); }
function lvl(d) { const e = $('#sp-lvl'); if (!d) { e.hidden = true; return; } e.hidden = false; e.textContent = L(T.level) + ' ' + num(d.level) + ' · ' + L(T[d.style] || T.heavy); }
function idleButtons() {
  buttons([
    { label: T.ask, mic: true },
    ...(S.last ? [{ label: T.again, ghost: true, onClick: () => { if (S.last) queueDrill(S.last, Promise.resolve()); } }] : []),
    { label: T.finish, ghost: true, onClick: () => { stopDrill(); if (rawi) rawi.finish(); buttons([{ label: T.close, onClick: close }]); } },
  ]);
}

// ── open, close ──
function sharedMusic() { const sm = window.__sm; return sm && sm.music ? sm : null; }
function open() {
  if (S.open) return;
  S.open = true; S.phase = 'intro';
  $('#sp-ov').classList.add('open');
  S.sm = sharedMusic();
  if (S.sm) { S.music = S.sm.music; S.own = false; S.sm.S.coach = true; S.music.stop(); S.music.plan = null; if (S.sm.world) S.sm.world.asleep = true; }
  else if (!S.music) { S.music = new Music(); S.music.preload(); S.own = true; }
  S.music.unlock();
  if (rawi && rawi.ui) rawi.ui.hide(true);
  intro();
}
function close() {
  stopDrill(); hush();
  S.open = false; S.phase = 'intro';
  $('#sp-ov').classList.remove('open');
  stopMic();
  if (S.music) { S.music.rests = []; S.music.stop(); S.music.plan = null; S.music.drumVol = 1; }
  if (S.sm) { S.sm.S.coach = false; if (S.sm.world) S.sm.world.asleep = false; }
  if (rawi && rawi.ui) rawi.ui.hide(false);
}
function intro() {
  who(null); lvl(null); $('#sp-line').innerHTML = ''; $('#sp-result').innerHTML = ''; dots(0);
  if (!endpoint()) { say(esc(L(T.off))); buttons([{ label: T.close, onClick: close }]); return; }
  say(esc(L(T.intro)) + '<small>' + esc(L(T.privacy)) + '</small>');
  buttons([{ label: T.start, onClick: begin }]);
}
async function begin() {
  S.music.unlock();
  say('<span class="dots"><i></i><i></i><i></i></span>');
  buttons([]);
  const ok = await startMic();
  if (!ok) { say(esc(L(T.mic))); buttons([{ label: T.retry, onClick: begin }, { label: T.close, ghost: true, onClick: close }]); return; }
  S.phase = 'lesson';
  rawi.start({ page: 'samri', mode: 'perform', time: new Date().getHours() + 'h' });
}

// ── the microphone ──
async function startMic() {
  if (S.node || SIM) return true;
  const ctx = S.music.ensure();
  try { if (navigator.audioSession) navigator.audioSession.type = 'play-and-record'; } catch (e) {}
  try {
    S.mic = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } });
    const url = URL.createObjectURL(new Blob([WORKLET], { type: 'application/javascript' }));
    await ctx.audioWorklet.addModule(url);
    const src = ctx.createMediaStreamSource(S.mic);
    S.node = new AudioWorkletNode(ctx, 'cl-ear', { numberOfInputs: 1, numberOfOutputs: 0 });
    src.connect(S.node);
    S.node.port.onmessage = (e) => onEar(e.data);
    return true;
  } catch (e) { console.warn('samri-perform mic', e); stopMic(); return false; }
}
function stopMic() {
  try { if (S.node) S.node.port.onmessage = null; } catch (e) {}
  S.node = null;
  if (S.mic) { S.mic.getTracks().forEach((t) => t.stop()); S.mic = null; }
  try { if (navigator.audioSession) navigator.audioSession.type = 'playback'; } catch (e) {}
}
function onEar(d) {
  if (d.hit != null) { S.hits.push(d.hit); flash(false); }
  else if (d.lvl != null) S.levels.push([d.t, d.lvl]);
  else if (d.pcm && S.rec) { const r = S.rec; S.rec = null; r(d.pcm); }
}
function record(on) {
  if (SIM) { if (!on && S.rec) { const r = S.rec; S.rec = null; r(new Float32Array(16000)); } return; }
  if (S.node) S.node.port.postMessage({ rec: on });
}
function recorded() { return new Promise((res) => { S.rec = res; record(false); setTimeout(() => { if (S.rec === res) { S.rec = null; res(null); } }, 1500); }); }
function wireAsk(el) {
  let down = false;
  el.addEventListener('pointerdown', (e) => {
    e.preventDefault(); if (S.run || !S.node && !SIM) return;
    down = true; hush(); try { el.setPointerCapture(e.pointerId); } catch (x) {}
    record(true); el.classList.add('on'); el.textContent = L(T.asking);
  });
  const up = async () => {
    if (!down) return; down = false; el.classList.remove('on'); el.textContent = L(T.ask);
    const pcm = await recorded();
    if (pcm && pcm.length > 8000) rawi.turn({ type: 'say', audio: wav16([pcm], 16000) });
  };
  el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up);
}

// ── a drill: the drums, the call, your answer, measured ──
function dots(n) {
  const box = $('#sp-dots'); box.innerHTML = '';
  for (let k = 0; k < n; k++) {
    const a = -Math.PI / 2 + (k / n) * Math.PI * 2, i = document.createElement('i');
    i.style.left = (50 + 47 * Math.cos(a)) + '%'; i.style.top = (50 + 47 * Math.sin(a)) + '%'; box.appendChild(i);
  }
}
function flash(cue) { const f = $('#sp-flash'); f.classList.remove('go', 'cue'); void f.offsetWidth; f.classList.add('go'); if (cue) f.classList.add('cue'); }
function line(h, hide) {
  $('#sp-line').className = 'sp-line' + (hide ? ' hide' : '');
  $('#sp-line').innerHTML = h.words.map((w, k) => '<i data-w="' + k + '">' + esc(w) + '</i>').join(' ');
}
function lightWords(h, p) {   // p: the pulse inside the half being sung now (or -1)
  let cur = -1;
  h.timing.forEach((s) => { if (s[2] >= 0 && p >= s[0] - 0.05) cur = s[2]; });
  document.querySelectorAll('#sp-line i').forEach((el, k) => { el.classList.toggle('on', p >= 0 && k <= cur); el.classList.toggle('now', p >= 0 && k === cur); });
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
function queueDrill(args, spoken) {
  if (!S.open) open();
  S.pending = args;
  Promise.resolve(spoken).then(() => sleep(700)).then(() => { if (S.pending === args && S.open) { S.pending = null; runDrill(args); } });
}
function stopDrill() {
  if (S.run) { S.run.cancel = true; S.run = null; }
  cancelAnimationFrame(S.raf);
  if (S.music) { S.music.rests = []; S.music.plan = null; S.music.stop(); }
  record(false); S.rec = null;
}

async function runDrill(d) {
  stopDrill();
  const H = halfOf(d.poem, d.half);
  if (!H) return;
  if (!(await startMic())) { say(esc(L(T.mic))); buttons([{ label: T.retry, onClick: () => runDrill(d) }, { label: T.close, ghost: true, onClick: close }]); return; }
  const music = S.music, style = d.poem === 'classic' && d.style === 'light' ? 'light' : 'heavy';
  let seg = null;
  if (H.topic) { try { seg = (await loadTopic(H.topic, music.ensure())).seg; } catch (e) { seg = null; } }
  const voiceFor = (row) => (H.voice ? H.voice(row) : seg && seg[H.clip(row)] ? { row, what: H.what, seg: seg[H.clip(row)], vol: 1 } : null);
  const slots = d.level === 1 ? ['count', 'A', 'B', 'A', 'you'] : d.level === 4 ? ['count', 'you', 'B'] : ['count', 'A', 'you'];
  const youAt = slots.indexOf('you');
  const run = { d, H, cancel: false };
  S.run = run; S.last = d; S.phase = 'drill';
  lvl({ level: d.level, style }); $('#sp-result').innerHTML = ''; $('#sp-heard').textContent = '';
  line(H, d.level === 3);
  buttons([{ label: T.finish, ghost: true, onClick: () => { stopDrill(); rawi.finish(); buttons([{ label: T.close, onClick: close }]); } }]);

  music.unlock(); music.stop(); music.voicesOff = false; music.claps = false; music.drums = true; music.drumVol = 0.9; music.rests = [];
  music.plan = (slot) => { const r = slots[slot]; return r === 'A' ? voiceFor(0) : r === 'B' ? voiceFor(1) : null; };
  music.start(style, 0.4);
  const tOf = (k) => music.timeOf(k * 4);
  const ys = tOf(youAt), ye = tOf(youAt + 1), end = tOf(slots.length);
  music.rests = [[ys, ye]];
  const out = music.ctx ? (music.ctx.outputLatency || music.ctx.baseLatency || 0) : 0;
  const strokes = music.strokes(youAt * 4, youAt * 4 + 4 - 1e-3).map((b) => music.timeOf(b));
  dots(strokes.length);
  const pulse = 60 / STYLES[style].bpm / 3;
  let recOn = false, cueI = 0;
  const cues = music.strokes(0, slots.length * 4).map((b) => music.timeOf(b));
  S.hits = []; S.levels = [];

  await new Promise((resolve) => {
    const frame = () => {
      if (run.cancel) return resolve();
      const t = music.time() - (music.ctx ? out : 0);
      const k = Math.max(0, Math.floor((t - tOf(0)) / (tOf(1) - tOf(0))));
      const role = slots[Math.min(k, slots.length - 1)];
      who(role === 'count' ? T.count : role === 'A' ? T.callA : role === 'B' ? (d.level === 4 ? T.answersYou : T.callB) : d.level === 4 ? T.youLead : T.you, role === 'you');
      // the words light up as they are sung (yours only up to level 2)
      const p = (t - tOf(Math.min(k, slots.length - 1))) / pulse;
      lightWords(H, role === 'count' || (role === 'you' && d.level >= 3) ? -1 : p);
      // the skin glows on each stroke you should strike, except in your turn from level 3
      while (cueI < cues.length && cues[cueI] <= t) { const inYou = cues[cueI] >= ys - 0.01 && cues[cueI] < ye - 0.01; if (!(inYou && d.level >= 3)) flash(true); cueI++; }
      // the dots of your turn: the one due now, then how each went
      if (t >= ys - 0.3 && t <= ye + 0.3) markDots(strokes, out, t);
      if (!recOn && music.time() >= ys - 0.25) { recOn = true; S.hits = []; S.levels = []; record(true); if (SIM) simulate(strokes, out, d); }
      if (music.time() >= Math.max(ye + 0.35, end - 0.05)) return resolve();
      S.raf = requestAnimationFrame(frame);
    };
    S.raf = requestAnimationFrame(frame);
  });
  if (run.cancel || S.run !== run) return;
  const pcm = await recorded();
  music.rests = []; music.plan = null; music.stop();
  who(null); lightWords(H, -1);
  const m = measure(strokes, out, ys, ye, style);
  markDots(strokes, out, Infinity);
  showResult(m);
  S.run = null; S.phase = 'lesson';
  say('<span class="dots"><i></i><i></i><i></i></span> <small>' + esc(L(T.thinking)) + '</small>');
  buttons([]);
  const starts = []; H.timing.forEach((s) => { if (s[2] >= 0) starts[s[2]] = s[0] * pulse; });
  const audio = pcm && pcm.length > 4000 && !SIM ? { ...wav16([pcm], 16000), offset: 0.25 } : null;
  rawi.turn({
    type: 'attempt', skill: d.level === 4 ? 'samri.lead' : 'samri.answer',
    drill: { poem: d.poem, half: d.half, level: d.level, style },
    metrics: m, audio, expected: { text: H.text, starts: starts.filter((x) => x != null) },
  });
}

// how your strikes went: each stroke you should have struck, matched with the nearest strike you made
const IN_LAT = 0.015;
function matchHits(strokes, out) {
  const win = Math.min(0.2, 0.45 * Math.min(...strokes.slice(1).map((s, i) => s - strokes[i]), 1));
  const hits = S.hits.map((h) => h - IN_LAT), used = new Set();
  return strokes.map((s) => {
    const due = s + out;
    let best = -1, bd = win;
    hits.forEach((h, j) => { if (!used.has(j) && Math.abs(h - due) <= bd) { bd = Math.abs(h - due); best = j; } });
    if (best < 0) return null;
    used.add(best); return hits[best] - due;
  });
}
function markDots(strokes, out, t) {
  const offs = matchHits(strokes, out), els = document.querySelectorAll('#sp-dots i');
  strokes.forEach((s, k) => {
    const el = els[k]; if (!el) return;
    const past = t > s + out + 0.22;
    el.className = offs[k] != null ? (Math.abs(offs[k]) <= 0.08 ? 'ok' : 'near') : past ? 'miss' : (t >= s + out - 0.15 && t <= s + out + 0.15 ? 'now' : '');
  });
}
function measure(strokes, out, ys, ye) {
  const offs = matchHits(strokes, out), got = offs.filter((o) => o != null);
  const mean = got.length ? got.reduce((a, b) => a + b, 0) / got.length : null;
  const spread = got.length > 1 ? Math.sqrt(got.reduce((a, b) => a + (b - mean) * (b - mean), 0) / (got.length - 1)) : null;
  const inside = S.hits.filter((h) => h >= ys - 0.15 && h <= ye + 0.15).length;
  const lv = S.levels.filter((x) => x[0] >= ys && x[0] <= ye).map((x) => x[1]).sort((a, b) => a - b);
  const room = S.levels.filter((x) => x[0] < ys - 0.3).map((x) => x[1]).sort((a, b) => a - b);
  const med = (a) => (a.length ? a[Math.floor(a.length / 2)] : 0);
  const voiceLevel = med(lv), roomLevel = med(room) || 0.002;
  return {
    strikes: {
      expected: strokes.length, hit: got.length,
      on_time: got.filter((o) => Math.abs(o) <= 0.08).length, early: got.filter((o) => o < -0.08).length, late: got.filter((o) => o > 0.08).length,
      extra: Math.max(0, inside - got.length),
      mean_offset_ms: mean == null ? null : Math.round(mean * 1000), spread_ms: spread == null ? null : Math.round(spread * 1000),
    },
    voice: { present: SIM ? true : voiceLevel > Math.max(0.01, roomLevel * 2.5), level: Math.round(Math.min(1, voiceLevel * 6) * 100) / 100 },
  };
}
function showResult(m) {
  const s = m.strikes;
  const tm = s.mean_offset_ms == null ? '' : Math.abs(s.mean_offset_ms) <= 60 ? L(T.ontime) : num(Math.abs(s.mean_offset_ms)) + ' ' + L(T.ms) + ' ' + L(s.mean_offset_ms < 0 ? T.early : T.late);
  $('#sp-result').innerHTML = '<span class="sp-chip">' + esc(L(T.strikes)) + ' <b>' + num(s.hit) + '/' + num(s.expected) + '</b>' + (tm ? ' · ' + esc(tm) : '') + '</span>' +
    (m.voice.present ? '' : '<span class="sp-chip">' + esc(L(T.noVoice)) + '</span>');
}
function simulate(strokes, out, d) {
  // a player who is a little early and misses one stroke, getting better with the level
  const jitter = () => (Math.random() - 0.5) * 0.06;
  strokes.forEach((s, k) => { if (k === 3 && d.level < 2) return; const at = s + out + IN_LAT - 0.07 + jitter(); setTimeout(() => { S.hits.push(at); flash(false); }, Math.max(0, (at - S.music.time()) * 1000)); });
  const t0 = S.music.time();
  for (let i = 0; i < 300; i++) S.levels.push([t0 + i * 0.02, 0.05]);
}

// ── the agent's side ──
function onReply(r) {
  if (!S.open) return;
  if (!r.ok) { say(esc(L(r.error === 'off' ? T.off : r.error === 'busy' || r.error === 'daily limit' ? T.busy : T.failed))); idleButtons(); return; }
  say(esc(r.say));
  const h = r.heard;
  $('#sp-heard').textContent = h && h.text ? '« ' + h.text + ' »' + (h.accuracy != null ? '  ·  ' + L(T.words) + ' ' + num(Math.round(h.accuracy * 100)) + '%' : '') : '';
  if (h && h.accuracy != null) {
    const chip = document.createElement('span'); chip.className = 'sp-chip';
    chip.innerHTML = esc(L(T.words)) + ' <b>' + num(Math.round(h.accuracy * 100)) + '%</b>';
    $('#sp-result').appendChild(chip);
  }
  const tr = $('#sp-trace');
  if (tr && r.trace) tr.innerHTML = r.trace.map((t) => '<div><span class="k">' + esc(t.kind) + '</span> ' + esc(t.name || '') + (t.ms != null ? ' · ' + t.ms + 'ms' : '') + (t.brief ? ' · ' + esc(t.brief) : '') + '</div>').join('');
  if (!(r.actions || []).some((a) => a.name === 'start_drill')) idleButtons();
  else buttons([{ label: T.finish, ghost: true, onClick: () => { stopDrill(); S.pending = null; rawi.finish(); buttons([{ label: T.close, onClick: close }]); } }]);
}

function boot() {
  rawi = pageRawi('samri');
  build();
  rawi.on('start_drill', (args, spoken) => queueDrill(args, spoken));
  rawi.on('reply', onReply);
  if (SIM && /[?&]perform=1/.test(location.search)) setTimeout(open, 600);
  window.__perform = { S, open, close, runDrill, measure, halfOf };
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
