/**
 * rawi-session.js: a session with one of Rawi's characters, as the last step of an experience and as an option on
 * its experience page (?ai=1). The same screen as the Samri teacher: the character, his or her line spoken out loud,
 * hold to talk (the agent's ear, Whisper, hears you) or type, and Finish. Nothing of it is on the page until a page
 * opens it, and the agent hears nothing of the experience itself:
 *   import('./rawi-session.js').then((m) => m.openSession({ experience: 'sadu', title, intro, start, context, actions }))
 */
import { createRawi, PERSONA, recorder, hush, hasVoice } from './rawi.js';

const isAr = () => window.currentLang === 'ar';
const L = (o) => (o == null ? '' : typeof o === 'string' ? o : isAr() ? (o.ar ?? o.en) : o.en);
const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const $ = (s) => document.querySelector(s);
const JUDGE = /[?&]judge=1/.test(location.search);

const T = {
  ai: { en: 'AI', ar: 'ذكاء اصطناعي' },
  tag: { en: 'Rawi · AI agent', ar: 'راوي · وكيل ذكاء اصطناعي' },
  close: { en: 'Close', ar: 'إغلاق' },
  ask: { en: 'Hold to talk', ar: 'اضغط وتكلّم' },
  asking: { en: 'Listening... let go to send', ar: 'أسمعك... فك عشان ترسل' },
  ph: { en: 'Or type here', ar: 'أو اكتب هنا' },
  send: { en: 'Send', ar: 'إرسال' },
  finish: { en: 'Finish', ar: 'خلصت' },
  you: { en: 'You said: ', ar: 'قلت: ' },
  mic: { en: 'Allow the microphone to talk, or type below.', ar: 'اسمح للمايك عشان تتكلّم، أو اكتب تحت.' },
  short: { en: "I didn't catch that. Hold the button while you talk.", ar: 'ما سمعتك زين. اضغط الزر وأنت تتكلّم.' },
  busy: { en: 'Too many people are here right now. Try again in a moment.', ar: 'فيه ناس كثير الحين، جرّب بعد شوي.' },
  failed: { en: "Couldn't connect. Check the connection and try again.", ar: 'ما قدرت أتصل. تأكد من الاتصال وجرّب مرة ثانية.' },
  retry: { en: 'Try again', ar: 'جرّب مرة ثانية' },
  noVoice: { en: 'This device has no voice for this language, so the answers are written.', ar: 'جهازك ما فيه صوت عربي للقراءة، فالرد مكتوب.' },
};

const CSS = `
#rs-ov [hidden] { display: none !important; }
#rs-ov { position: fixed; inset: 0; z-index: 2147481000; background: radial-gradient(120% 80% at 50% 30%, #18204A 0%, #070A16 70%); color: #F3EEE6; display: none; overflow: hidden;
  font-family: var(--font-ui, 'IBM Plex Sans Arabic', system-ui, sans-serif); }
#rs-ov.open { display: block; }
#rs-ov * { box-sizing: border-box; }
.rs-top { position: absolute; top: 0; left: 0; right: 0; z-index: 5; display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: calc(10px + env(safe-area-inset-top, 0px)) 14px 10px; }
.rs-top button { color: #F3EEE6; background: rgba(243,238,230,.08); border: 1px solid rgba(243,238,230,.18); border-radius: 999px; padding: 8px 14px; font: inherit; font-size: 14px; cursor: pointer; }
.rs-title { font-weight: 700; font-size: 16px; display: flex; align-items: center; gap: 8px; text-align: center; }
.rs-title i { font-style: normal; font-size: 11px; color: #070A16; background: #E3C47A; border-radius: 999px; padding: 2px 8px; white-space: nowrap; }
.rs-stage { position: absolute; left: 0; right: 0; top: calc(env(safe-area-inset-top, 0px) + 58px); bottom: 330px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; padding: 0 16px; }
.rs-big { width: min(46vw, 190px); aspect-ratio: 1; border-radius: 50%; border: 3px solid #E3C47A; overflow: hidden; box-shadow: 0 16px 44px rgba(0,0,0,.5); transition: transform .2s; }
.rs-big svg { width: 100%; height: 100%; display: block; }
.rs-big.talk { animation: rsTalk .9s ease-in-out infinite; }
@keyframes rsTalk { 50% { transform: scale(1.04); } }
.rs-name { font-size: 20px; font-weight: 700; color: #E3C47A; }
.rs-tag { font-size: 12px; color: rgba(243,238,230,.55); margin-top: -8px; }
.rs-card { position: absolute; left: 12px; right: 12px; bottom: calc(12px + env(safe-area-inset-bottom, 0px)); max-width: 620px; margin: 0 auto; background: rgba(14,18,36,.94); border: 1px solid rgba(227,196,122,.45);
  border-radius: 20px; padding: 14px 16px; backdrop-filter: blur(6px); -webkit-backdrop-filter: blur(6px); max-height: 320px; overflow: auto; }
.rs-say { font-size: 17px; line-height: 1.7; min-height: 1.7em; }
.rs-say small { display: block; font-size: 12.5px; color: rgba(243,238,230,.55); margin-top: 6px; line-height: 1.5; }
.rs-say .dots i { display: inline-block; width: 6px; height: 6px; margin: 0 2px; border-radius: 50%; background: #E3C47A; animation: rsDot 1s infinite; }
.rs-say .dots i:nth-child(2) { animation-delay: .15s; } .rs-say .dots i:nth-child(3) { animation-delay: .3s; }
@keyframes rsDot { 50% { opacity: .2; transform: translateY(-3px); } }
.rs-heard { font-size: 13px; color: rgba(243,238,230,.6); margin-top: 4px; }
.rs-form { display: flex; gap: 8px; margin-top: 12px; }
.rs-form input { flex: 1; min-width: 0; background: rgba(243,238,230,.07); color: #F3EEE6; border: 1px solid rgba(243,238,230,.22); border-radius: 999px; padding: 10px 14px; font: inherit; font-size: 15px; }
.rs-form input:focus { outline: 2px solid #E3C47A; outline-offset: -1px; }
.rs-btns { display: flex; gap: 8px; margin-top: 10px; flex-wrap: wrap; }
.rs-btn { background: #E3C47A; color: #16121D; border: 0; border-radius: 999px; padding: 11px 20px; font: inherit; font-weight: 700; font-size: 15px; cursor: pointer; }
.rs-btn.ghost { background: transparent; color: #F3EEE6; border: 1px solid rgba(243,238,230,.3); }
.rs-btn.mic { touch-action: none; user-select: none; -webkit-user-select: none; flex: 1; }
.rs-btn.mic.on { background: #FF8A7A; }
.rs-btn:disabled { opacity: .45; cursor: default; }
.rs-trace { margin-top: 10px; border-top: 1px dashed rgba(243,238,230,.2); padding-top: 6px; font: 11.5px/1.5 ui-monospace, Menlo, monospace; color: rgba(243,238,230,.7); direction: ltr; text-align: left; }
.rs-trace div { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; } .rs-trace .k { color: #E3C47A; }
`;

const S = { cfg: null, agent: null, exp: null, busy: false, last: null, rec: null, talking: false, warned: false };

function build() {
  if ($('#rs-ov')) return;
  const st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
  const ov = document.createElement('div'); ov.id = 'rs-ov'; ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-modal', 'true');
  ov.innerHTML = '<header class="rs-top"><button type="button" id="rs-close" aria-label="Close">✕</button><div class="rs-title"><span id="rs-title"></span><i id="rs-ai"></i></div><button type="button" id="rs-lang"></button></header>' +
    '<div class="rs-stage"><div class="rs-big" id="rs-big"></div><div class="rs-name" id="rs-name"></div><div class="rs-tag" id="rs-tag"></div></div>' +
    '<section class="rs-card"><div class="rs-say" id="rs-say" aria-live="polite"></div><div class="rs-heard" id="rs-heard"></div>' +
    '<form class="rs-form" id="rs-form" hidden autocomplete="off"><input id="rs-in" dir="auto" maxlength="300"><button type="submit" class="rs-btn" id="rs-send"></button></form>' +
    '<div class="rs-btns" id="rs-btns"></div>' + (JUDGE ? '<div class="rs-trace" id="rs-trace"></div>' : '') + '</section>';
  document.body.appendChild(ov);
  $('#rs-close').addEventListener('click', close);
  $('#rs-lang').addEventListener('click', () => { if (typeof window.toggleLanguage === 'function') window.toggleLanguage(); });
  $('#rs-form').addEventListener('submit', (e) => { e.preventDefault(); const t = $('#rs-in').value.trim(); if (!t || S.busy) return; $('#rs-in').value = ''; send({ type: 'say', text: t }); });
  document.addEventListener('languageChanged', labels);
}
function labels() {
  if (!S.cfg) return;
  const p = PERSONA[S.cfg.experience] || PERSONA.general;
  $('#rs-title').textContent = L(S.cfg.title); $('#rs-ai').textContent = L(T.ai);
  $('#rs-lang').textContent = isAr() ? 'English' : 'العربية';
  $('#rs-name').textContent = L(p.name); $('#rs-tag').textContent = L(T.tag);
  $('#rs-in').placeholder = L(T.ph); $('#rs-send').textContent = L(T.send);
  if (!S.agent) intro();
}
function say(html) { $('#rs-say').innerHTML = html; }
function buttons(list) {
  const box = $('#rs-btns'); box.innerHTML = '';
  list.forEach((b) => {
    const el = document.createElement('button'); el.type = 'button'; el.className = 'rs-btn' + (b.ghost ? ' ghost' : '') + (b.mic ? ' mic' : ''); el.textContent = L(b.label);
    if (b.mic) wireMic(el); else el.addEventListener('click', b.onClick);
    box.appendChild(el);
  });
}
function intro() {
  say(esc(L(S.cfg.intro)));
  $('#rs-heard').textContent = ''; $('#rs-form').hidden = true;
  buttons([{ label: S.cfg.start, onClick: begin }, { label: T.close, ghost: true, onClick: close }]);
}
function talkUI() {
  $('#rs-form').hidden = false;
  buttons([{ label: T.ask, mic: true }, { label: T.finish, ghost: true, onClick: finish }]);
}

export function openSession(cfg) {
  build();
  if (S.exp !== cfg.experience) { S.agent = null; S.exp = cfg.experience; }
  S.cfg = cfg;
  const p = PERSONA[cfg.experience] || PERSONA.general;
  $('#rs-big').innerHTML = p.face;
  labels();
  if (S.agent) { talkUI(); say(esc(S.last && S.last.say || '')); } else intro();
  $('#rs-ov').classList.add('open');
}
function close() {
  hush(); stopRec(); $('#rs-big').classList.remove('talk');
  $('#rs-ov').classList.remove('open');
  if (S.cfg && S.cfg.onClose) try { S.cfg.onClose(); } catch (e) {}
}

function begin() {
  S.agent = createRawi({ experience: S.cfg.experience, actions: S.cfg.actions || {} });
  talkUI();
  send({ type: 'start', context: S.cfg.context || { page: S.cfg.experience } });
}
function finish() { send({ type: 'finish' }, true); }

async function send(input, ending) {
  if (S.busy || !S.agent) return;
  S.busy = true; S.lastInput = input;
  hush(); say('<span class="dots"><i></i><i></i><i></i></span>'); lock(true);
  let r;
  try { r = input.type === 'start' ? await S.agent.start(input.context) : input.type === 'finish' ? await S.agent.finish() : await S.agent.turn(input); } catch (e) { r = { ok: false, error: 'failed' }; }
  S.busy = false; lock(false);
  if (!r || !r.ok) {
    say(esc(L(r && r.error === 'nothing heard' ? T.short : r && (r.error === 'busy' || r.error === 'daily limit') ? T.busy : T.failed)));
    if (r && r.error !== 'nothing heard') buttons([{ label: T.retry, onClick: () => { talkUI(); send(S.lastInput, ending); } }, { label: T.close, ghost: true, onClick: close }]);
    return;
  }
  S.last = r;
  const lang = isAr() ? 'ar' : 'en';
  say(esc(r.say) + (!S.warned && !hasVoice(lang) ? '<small>' + esc(L(T.noVoice)) + '</small>' : ''));
  if (!hasVoice(lang)) S.warned = true;
  $('#rs-heard').textContent = input.audio && r.heard && r.heard.text ? L(T.you) + r.heard.text : '';
  const tr = $('#rs-trace');
  if (tr && r.trace) tr.innerHTML = r.trace.map((t) => '<div><span class="k">' + esc(t.kind) + '</span> ' + esc(t.name || '') + (t.ms != null ? ' · ' + t.ms + 'ms' : '') + (t.brief ? ' · ' + esc(t.brief) : '') + '</div>').join('');
  const big = $('#rs-big'); big.classList.add('talk'); clearTimeout(S.talkT); S.talkT = setTimeout(() => big.classList.remove('talk'), 1500 + String(r.say || '').length * 70);
  if (ending) { $('#rs-form').hidden = true; buttons([{ label: T.close, onClick: close }]); }
}
function lock(on) { $('#rs-btns').querySelectorAll('button').forEach((b) => (b.disabled = on)); $('#rs-in').disabled = on; $('#rs-send').disabled = on; }

// hold to talk: the recording goes to the agent, whose ear (Whisper) writes down what was said
function wireMic(el) {
  let down = false;
  el.addEventListener('pointerdown', async (e) => {
    e.preventDefault(); if (S.busy || down) return;
    down = true; hush(); try { el.setPointerCapture(e.pointerId); } catch (x) {}
    el.classList.add('on'); el.textContent = L(T.asking);
    try { S.rec = await recorder(); } catch (x) { S.rec = null; down = false; el.classList.remove('on'); el.textContent = L(T.ask); say(esc(L(T.mic))); return; }
    if (!down) stopRec();   // let go before the microphone opened
  });
  const up = () => {
    if (!down) return; down = false; el.classList.remove('on'); el.textContent = L(T.ask);
    const wav = stopRec();
    if (!wav) return;
    if (wav.secs < 0.5) { say(esc(L(T.short))); return; }
    send({ type: 'say', audio: { b64: wav.b64, mime: wav.mime } });
  };
  el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up);
}
function stopRec() { const r = S.rec; S.rec = null; if (!r) return null; try { return r.stop(); } catch (e) { return null; } }
