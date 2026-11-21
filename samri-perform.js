/**
 * samri-perform.js: perform the Samri for real, in front of your phone, taught by the mu'allim (Rawi, the CultureLens
 * agent). What the Samri experience has you do on the screen, you do with your body: kneel in the answering row with
 * something as your tar (a plate, a pot lid, a hardcover book), strike it on the strokes and sing the line back
 * (يشيل ويرد), sway right and left with your row, lift and lower your tar on the leader's calls, and slap it down
 * with everyone at the end (the khallu).
 *
 * The phone sees and hears, the agent teaches:
 *   - the front camera and a pose model on the phone (samri-body.js) follow your head, shoulders and hands, so every
 *     lean, lift, lowering, strike and slap is timed against the drums (no video leaves the phone)
 *   - an AudioWorklet on the microphone hears each strike on your tar and times it against the drum clock of
 *     samri-music.js to the millisecond, and records your sung answer; during your turn the drums rest
 *   - each attempt (moves, strikes, voice, the recording) goes to Rawi, whose ear (Whisper) checks the words you sang;
 *     the agent reads it all with what it remembers of you, says what to fix, and picks the next drill (start_drill)
 * Drills (move): answer (strike and sing the line back), sway, lift (lift, lower, khallu), row (the whole Samri).
 * Levels: 1 the second row answers first and the cues are shown; 2 you answer right after the call; 3 from memory;
 * 4 you lead the call and the row answers you.
 * It opens at the end of the Samri experience (the results) and from the Samri experience page
 * (samri.html?perform=1); nothing of it floats on the page itself.
 * Add ?sim=1 to the address to run it with a simulated learner (body, strikes and voice), for testing.
 */
import { Music, STYLES, SUNG } from './samri-music.js';
import { BANK, loadTopic } from './samri-ai.js';
import { pageRawi, PERSONA, endpoint, wav16, hush } from './rawi.js';
import { createBody, prepare as preparePose } from './samri-body.js';

const SIM = /[?&]sim=1/.test(location.search);
const JUDGE = /[?&]judge=1/.test(location.search);
const isAr = () => window.currentLang === 'ar';
const L = (o) => (o == null ? '' : typeof o === 'string' ? o : isAr() ? (o.ar ?? o.en) : o.en);
const num = (n) => (isAr() ? String(n).replace(/\d/g, (d) => '٠١٢٣٤٥٦٧٨٩'[d]) : String(n));
const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const $ = (s) => document.querySelector(s);

const T = {
  title: { en: 'In the row', ar: 'في الصف' },
  intro: { en: 'Do the Samri for real. Kneel facing your phone, about a metre away, so your head, shoulders and hands are in view, and pick up something to be your tar: a plate, a pot lid or a hardcover book. The mu\'allim watches you through the camera and listens: strike your tar and sing the line back, sway with your row, lift and lower your tar, and slap it down at the end.', ar: 'سوّ السامري صدق. اجلس على ركبك مقابل جوالك على بُعد متر تقريبًا، بحيث يبان راسك وكتوفك ويدينك، وخذ شي يكون طارك: صحن، غطا قدر، أو كتاب جلد. المعلّم يشوفك من الكاميرا ويسمعك: اضرب طارك ورد البيت، وتمايل مع صفّك، وارفع طارك ونزّله، واضربه بالأرض بالنهاية.' },
  privacy: { en: 'The camera and your strikes are read on this phone, and no video leaves it. Only your sung answers go to the agent\'s ear, to check the words.', ar: 'الكاميرا وضرباتك تنقرأ على جوالك، وما يطلع منه أي فيديو. بس ردّك بصوتك يروح لأذن الوكيل عشان يتأكد من الكلمات.' },
  start: { en: 'Open the camera', ar: 'افتح الكاميرا' },
  loading: { en: 'Opening the camera and waking the AI...', ar: 'نفتح الكاميرا ونجهّز الذكاء الاصطناعي...' },
  cam: { en: 'The mu\'allim needs to see you. Allow the camera, then try again.', ar: 'المعلّم لازم يشوفك. اسمح للكاميرا وجرّب مرة ثانية.' },
  model: { en: 'The camera\'s AI did not load. Check the connection and try again.', ar: 'ذكاء الكاميرا ما تحمّل. تأكد من الاتصال وجرّب مرة ثانية.' },
  noCam: { en: 'Continue without the camera', ar: 'كمّل بدون كاميرا' },
  mic: { en: 'The mu\'allim needs to hear your tar and your voice. Allow the microphone, then try again.', ar: 'المعلّم لازم يسمع طارك وصوتك. اسمح للمايك وجرّب مرة ثانية.' },
  retry: { en: 'Try again', ar: 'جرّب مرة ثانية' },
  off: { en: 'The agent isn\'t connected yet, so there is no one to teach you. (It runs on the team\'s Supabase project.)', ar: 'الوكيل مو متصل للحين، فما فيه أحد يعلّمك. (يشتغل على مشروع الفريق في Supabase).' },
  notSeen: { en: 'I can\'t see your shoulders. Move the phone back a little, or tilt it.', ar: 'ما أشوف كتوفك. بعّد الجوال شوي أو عدّل زاويته.' },
  standing: { en: 'Kneel down: the Samri is performed seated.', ar: 'اجلس على ركبك: السامري يُؤدّى جلوس.' },
  noHands: { en: 'Hold your tar in front of your chest, so I can see your hands.', ar: 'امسك طارك قدّام صدرك عشان أشوف يدينك.' },
  calib: { en: 'Good. Sit upright and hold still a moment...', ar: 'زين. اعتدل واثبت لحظة...' },
  ready: { en: 'I can see you.', ar: 'شايفك زين.' },
  chkSit: { en: 'Kneeling', ar: 'جالس' }, chkSh: { en: 'Shoulders', ar: 'الكتوف' }, chkHands: { en: 'Hands', ar: 'اليدين' },
  count: { en: 'The drums start', ar: 'بدت الطبول' },
  callA: { en: 'The first row raises the line', ar: 'الصف الأول يشيل' },
  callB: { en: 'The second row answers', ar: 'الصف الثاني يرد' },
  you: { en: 'Your turn: strike and answer', ar: 'دورك: اضرب ورد' },
  youLead: { en: 'Your turn: lead the line', ar: 'دورك: شيل البيت' },
  answersYou: { en: 'The row answers you', ar: 'الصف يرد عليك' },
  swayNow: { en: 'Sway with your row', ar: 'تمايل مع صفّك' },
  liftNow: { en: 'Lift and lower with the row', ar: 'ارفع ونزّل مع الصف' },
  slapNow: { en: 'Slap it down, all together', ar: 'اضربه بالأرض، كلنا مع بعض' },
  cue: { R: { en: 'Lean right', ar: 'مِل يمين' }, L: { en: 'Lean left', ar: 'مِل يسار' }, up: { en: 'Lift', ar: 'ارفع' }, down: { en: 'Lower', ar: 'نزّل' }, khallu: { en: 'Slap down', ar: 'اضرب الأرض' } },
  judge: { ok: { en: 'Right!', ar: 'صح!' }, early: { en: 'Early', ar: 'بدري' }, late: { en: 'Late', ar: 'متأخر' }, wrong: { en: 'Other side', ar: 'الجهة الثانية' },
    small: { en: 'Bigger', ar: 'أكبر شوي' }, missed: { en: 'Missed', ar: 'ما شفتها' }, unseen: { en: 'I can\'t see you', ar: 'ما أشوفك' } },
  thinking: { en: 'The mu\'allim is going over it', ar: 'المعلّم يراجع' },
  again: { en: 'Again', ar: 'مرة ثانية' },
  finish: { en: 'Finish', ar: 'خلصت' },
  close: { en: 'Close', ar: 'إغلاق' },
  ask: { en: 'Hold to ask', ar: 'اضغط واسأل' },
  asking: { en: 'Listening...', ar: 'أسمعك...' },
  level: { en: 'Level', ar: 'المستوى' },
  heavy: { en: 'heavy', ar: 'ثقيل' }, light: { en: 'light', ar: 'خفيف' },
  mv: { answer: { en: 'answer', ar: 'الرد' }, sway: { en: 'sway', ar: 'التمايل' }, lift: { en: 'lift', ar: 'الرفع' }, row: { en: 'the whole row', ar: 'الصف كامل' } },
  strikes: { en: 'Strikes', ar: 'الضربات' }, words: { en: 'Words', ar: 'الكلمات' }, sway: { en: 'Sway', ar: 'التمايل' }, lift: { en: 'Lift', ar: 'الرفع' },
  slap: { en: 'Slap', ar: 'الضربة' }, standingChip: { en: 'you stood up', ar: 'وقفت' }, unseenChip: { en: 'out of view', ar: 'طلعت من الكاميرا' },
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

// ── what each drill asks of you: the slots of four beats (who sings), and the moves at their beats ──
const MOVES = ['answer', 'sway', 'lift', 'row'];
function script(d) {
  const move = MOVES.includes(d.move) ? d.move : 'answer';
  if (move === 'answer') return { move, slots: d.level === 1 ? ['count', 'A', 'B', 'A', 'you'] : d.level === 4 ? ['count', 'you', 'B'] : ['count', 'A', 'you'], ev: [] };
  // the sway: right as a cycle of the beat starts, left as the next one starts, while the rows sing and clap
  if (move === 'sway') return { move, slots: ['count', 'A', 'B'], ev: [[4, 'sway', 'R'], [6, 'sway', 'L'], [8, 'sway', 'R'], [10, 'sway', 'L']], claps: true };
  // the drums go up and down with the leader's calls, one cycle each, then everyone slaps them down
  if (move === 'lift') return { move, slots: ['count', 'A', 'B', 'end'], ev: [[4, 'up'], [6, 'down'], [8, 'up'], [10, 'down'], [12, 'khallu']] };
  // the whole Samri: sway while the first row sings, answer it, lift and lower, and the khallu
  return { move, slots: ['count', 'A', 'you', 'B', 'end'], ev: [[4, 'sway', 'R'], [6, 'sway', 'L'], [12, 'up'], [14, 'down'], [16, 'khallu']] };
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
.sp-cam { position: absolute; inset: 0; display: none; background: #070A16; }
#sp-ov.cam .sp-cam { display: block; }
.sp-cam video, .sp-cam canvas { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; transform: scaleX(-1); }
.sp-shade { position: absolute; inset: 0; pointer-events: none; background: linear-gradient(rgba(7,10,22,.82), rgba(7,10,22,.15) 26%, rgba(7,10,22,0) 45%, rgba(7,10,22,.2) 62%, rgba(7,10,22,.9) 84%); }
.sp-top { position: absolute; top: 0; left: 0; right: 0; z-index: 5; display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: calc(10px + env(safe-area-inset-top, 0px)) 14px 10px; }
.sp-top button { color: #F3EEE6; background: rgba(14,18,36,.55); border: 1px solid rgba(243,238,230,.22); border-radius: 999px; padding: 8px 14px; font: inherit; font-size: 14px; cursor: pointer; }
.sp-title { font-weight: 700; font-size: 16px; display: flex; align-items: center; gap: 8px; text-shadow: 0 1px 8px rgba(0,0,0,.6); }
.sp-title i { font-style: normal; font-size: 11px; color: #070A16; background: #E3C47A; border-radius: 999px; padding: 2px 8px; text-shadow: none; }
.sp-stage { position: absolute; left: 0; right: 0; top: calc(env(safe-area-inset-top, 0px) + 58px); bottom: 300px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 14px; padding: 0 16px; z-index: 3; }
#sp-ov.cam .sp-stage { bottom: auto; justify-content: flex-start; gap: 6px; padding-top: 4px; }
.sp-who { font-size: 15px; font-weight: 700; color: #E3C47A; min-height: 1.5em; text-align: center; letter-spacing: .2px; text-shadow: 0 1px 10px rgba(0,0,0,.7); }
.sp-who.you { color: #7EE08A; font-size: 18px; }
.sp-ring { position: relative; width: min(56vw, 230px); aspect-ratio: 1; border-radius: 50%; }
#sp-ov.cam .sp-ring { position: absolute; top: calc(env(safe-area-inset-top, 0px) + 112px); inset-inline-end: 14px; width: 78px; z-index: 4; }
#sp-ov.cam:not(.drill) .sp-ring { display: none; }
.sp-skin { position: absolute; inset: 9%; border-radius: 50%; background: radial-gradient(circle at 45% 40%, #F1E2C4, #D8C098 62%, #B89A6E); box-shadow: 0 0 0 9px #6B4426, 0 0 0 11px #3A2414, 0 16px 40px rgba(0,0,0,.5); }
#sp-ov.cam .sp-skin { box-shadow: 0 0 0 4px #6B4426, 0 0 0 5px #3A2414, 0 6px 16px rgba(0,0,0,.5); }
.sp-flash { position: absolute; inset: 9%; border-radius: 50%; background: radial-gradient(circle, rgba(255,255,255,.75), rgba(255,255,255,0) 70%); opacity: 0; pointer-events: none; }
.sp-flash.go { animation: spFlash .28s ease-out; }
.sp-flash.cue { background: radial-gradient(circle, rgba(227,196,122,.55), rgba(227,196,122,0) 70%); }
@keyframes spFlash { from { opacity: 1; } to { opacity: 0; } }
.sp-dots { position: absolute; inset: 0; }
.sp-dots i { position: absolute; width: 14px; height: 14px; margin: -7px 0 0 -7px; border-radius: 50%; background: rgba(243,238,230,.18); border: 2px solid rgba(243,238,230,.25); transition: background .15s, transform .15s; }
#sp-ov.cam .sp-dots i { width: 9px; height: 9px; margin: -4.5px 0 0 -4.5px; border-width: 1.5px; }
.sp-dots i.now { border-color: #E3C47A; transform: scale(1.35); }
.sp-dots i.ok { background: #7EE08A; border-color: #7EE08A; } .sp-dots i.near { background: #E3C47A; border-color: #E3C47A; } .sp-dots i.miss { background: transparent; border-color: #FF8A7A; }
.sp-line { font-family: var(--font-arabic, 'CL Saudi', 'IBM Plex Sans Arabic', sans-serif); direction: rtl; font-size: clamp(22px, 6.4vw, 30px); line-height: 1.6; text-align: center; min-height: 1.6em; text-shadow: 0 1px 10px rgba(0,0,0,.75); }
#sp-ov.cam .sp-line { font-size: clamp(20px, 5.6vw, 27px); max-width: calc(100% - 96px); }
.sp-line i { font-style: normal; color: rgba(243,238,230,.5); transition: color .12s; }
.sp-line i.on { color: #F3EEE6; } .sp-line i.now { color: #E3C47A; }
.sp-line.hide i { color: transparent; text-shadow: 0 0 12px rgba(243,238,230,.45); }
.sp-result { display: flex; gap: 8px; flex-wrap: wrap; justify-content: center; min-height: 34px; }
.sp-chip { border-radius: 999px; padding: 6px 12px; font-size: 13.5px; background: rgba(14,18,36,.7); border: 1px solid rgba(243,238,230,.2); }
.sp-chip b { color: #E3C47A; } .sp-chip.bad { border-color: rgba(255,138,122,.6); color: #FFB3A8; }
.sp-cue { position: absolute; z-index: 4; left: 50%; top: 46%; transform: translate(-50%, -50%); display: flex; flex-direction: column; align-items: center; gap: 4px; pointer-events: none; }
.sp-cue b { width: 104px; height: 104px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 58px; line-height: 1; color: #16121D; background: rgba(227,196,122,.92);
  box-shadow: 0 0 0 6px rgba(227,196,122,.25), 0 10px 30px rgba(0,0,0,.45); transition: background .12s, transform .1s; }
.sp-cue span { font-size: 18px; font-weight: 800; text-shadow: 0 1px 10px rgba(0,0,0,.8); }
.sp-cue.R { left: auto; right: 7%; transform: translate(0, -50%); } .sp-cue.L { left: 7%; transform: translate(0, -50%); }
.sp-cue.ok b { background: #7EE08A; } .sp-cue.near b { background: #F1C25A; } .sp-cue.miss b { background: #FF8A7A; }
.sp-cue.beat b { transform: scale(1.12); }
.sp-judge { position: absolute; z-index: 4; left: 0; right: 0; top: 32%; text-align: center; font-size: 32px; font-weight: 800; opacity: 0; transition: opacity .15s; pointer-events: none; text-shadow: 0 2px 14px rgba(0,0,0,.7); }
.sp-judge.show { opacity: 1; } .sp-judge.ok { color: #7EE08A; } .sp-judge.near { color: #F1C25A; } .sp-judge.miss { color: #FF8A7A; }
.sp-checks { position: absolute; z-index: 4; left: 0; right: 0; top: calc(env(safe-area-inset-top, 0px) + 64px); display: flex; gap: 6px; justify-content: center; flex-wrap: wrap; }
.sp-chk { font-size: 13px; border-radius: 999px; padding: 5px 11px; border: 1px solid rgba(243,238,230,.3); color: rgba(243,238,230,.75); background: rgba(14,18,36,.6); }
.sp-chk.ok { border-color: #7EE08A; color: #7EE08A; } .sp-chk.bad { border-color: #FF8A7A; color: #FF8A7A; }
.sp-card { position: absolute; z-index: 5; left: 12px; right: 12px; bottom: calc(12px + env(safe-area-inset-bottom, 0px)); max-width: 620px; margin: 0 auto; background: rgba(14,18,36,.92); border: 1px solid rgba(227,196,122,.45);
  border-radius: 20px; padding: 14px 16px; backdrop-filter: blur(6px); -webkit-backdrop-filter: blur(6px); max-height: 290px; overflow: auto; }
#sp-ov.cam.drill .sp-card { padding: 10px 14px; }
#sp-ov.cam.drill .sp-say, #sp-ov.cam.drill .sp-heard { display: none; }
#sp-ov.cam.drill .sp-btns { margin-top: 8px; }
.sp-agent { display: flex; align-items: center; gap: 10px; }
.sp-face { width: 44px; height: 44px; border-radius: 50%; border: 2px solid #E3C47A; overflow: hidden; flex: none; }
.sp-face svg { width: 100%; height: 100%; display: block; }
.sp-agent b { display: block; color: #E3C47A; font-size: 15px; } .sp-agent small { color: rgba(243,238,230,.55); font-size: 11.5px; }
.sp-lvl { margin-inline-start: auto; font-size: 12px; color: rgba(243,238,230,.75); border: 1px solid rgba(243,238,230,.2); border-radius: 999px; padding: 3px 9px; white-space: nowrap; }
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
`;

// ── state ──
const S = { open: false, phase: 'intro', drill: null, run: null, hits: [], levels: [], last: null, sm: null, music: null, own: false, mic: null, node: null, rec: null, raf: 0, cam: false, body: null, setupT: 0 };
let rawi = null;

function build() {
  const st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
  const ov = document.createElement('div'); ov.id = 'sp-ov'; ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-modal', 'true');
  ov.innerHTML = '<div class="sp-cam"><video id="sp-video" playsinline muted></video><canvas id="sp-canvas"></canvas><div class="sp-shade"></div></div>' +
    '<header class="sp-top"><button type="button" id="sp-close" aria-label="Close">✕</button><div class="sp-title"><span id="sp-title"></span><i>AI</i></div><button type="button" id="sp-lang"></button></header>' +
    '<div class="sp-checks" id="sp-checks" hidden></div>' +
    '<div class="sp-stage"><div class="sp-who" id="sp-who"></div><div class="sp-ring"><div class="sp-skin"></div><b class="sp-flash" id="sp-flash"></b><div class="sp-dots" id="sp-dots"></div></div>' +
    '<div class="sp-line" id="sp-line"></div><div class="sp-result" id="sp-result"></div></div>' +
    '<div class="sp-cue" id="sp-cue" hidden><b></b><span></span></div><div class="sp-judge" id="sp-judge"></div>' +
    '<section class="sp-card"><div class="sp-agent"><span class="sp-face">' + PERSONA.samri.face + '</span><div><b id="sp-name"></b><small id="sp-tag"></small></div><span class="sp-lvl" id="sp-lvl" hidden></span></div>' +
    '<div class="sp-say" id="sp-say" aria-live="polite"></div><div class="sp-heard" id="sp-heard"></div><div class="sp-btns" id="sp-btns"></div>' + (JUDGE ? '<div class="sp-trace" id="sp-trace"></div>' : '') + '</section>';
  document.body.appendChild(ov);
  $('#sp-close').addEventListener('click', close);
  $('#sp-lang').addEventListener('click', () => { if (typeof window.toggleLanguage === 'function') window.toggleLanguage(); });
  document.addEventListener('languageChanged', labels);
  labels();
}
function labels() {
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
function lvl(d) {
  const e = $('#sp-lvl'); if (!d) { e.hidden = true; return; }
  e.hidden = false; e.textContent = L(T.level) + ' ' + num(d.level) + ' · ' + L(T.mv[d.move] || T.mv.answer) + ' · ' + L(T[d.style] || T.heavy);
}
function finishButton() { return { label: T.finish, ghost: true, onClick: () => { stopDrill(); S.pending = null; rawi.finish(); buttons([{ label: T.close, onClick: close }]); } }; }
function idleButtons() {
  buttons([
    { label: T.ask, mic: true },
    ...(S.last ? [{ label: T.again, ghost: true, onClick: () => { if (S.last) queueDrill(S.last, Promise.resolve()); } }] : []),
    finishButton(),
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
  if (!SIM) preparePose().catch(() => {});      // the camera's model loads while the learner reads
  intro();
}
function close() {
  stopDrill(); hush(); stopSetup();
  S.open = false; S.phase = 'intro';
  $('#sp-ov').classList.remove('open', 'cam', 'drill');
  stopMic();
  if (S.body) S.body.stop();
  S.cam = false;
  if (S.music) { S.music.rests = []; S.music.stop(); S.music.plan = null; S.music.drumVol = 1; S.music.claps = false; S.music.drums = true; }
  if (S.sm) {
    S.sm.S.coach = false; if (S.sm.world) S.sm.world.asleep = false;
    // the page gets its own music back: the soft drums behind the story and the results, or the part it was on
    if (S.sm.S.ambient && S.sm.ambient) S.sm.ambient(S.sm.S.part === 'story' ? 0.5 : 0.35);
    else if (S.sm.resume) S.sm.resume();
  }
}
function intro() {
  who(null); lvl(null); $('#sp-line').innerHTML = ''; $('#sp-result').innerHTML = ''; dots(0); cueShow(null);
  if (!endpoint()) { say(esc(L(T.off))); buttons([{ label: T.close, onClick: close }]); return; }
  say(esc(L(T.intro)) + '<small>' + esc(L(T.privacy)) + '</small>');
  buttons([{ label: T.start, onClick: begin }]);
}

// ── the camera: open it, check the learner is in view and kneeling, take their resting pose ──
async function begin() {
  S.music.unlock(); S.music.ensure();
  say('<span class="dots"><i></i><i></i><i></i></span> <small>' + esc(L(T.loading)) + '</small>');
  buttons([]);
  if (!S.body) S.body = createBody({ video: $('#sp-video'), canvas: $('#sp-canvas'), clock: () => S.music.time(), sim: SIM });
  const ok = await S.body.start();
  if (ok !== true) {
    say(esc(L(ok === 'model' ? T.model : T.cam)));
    buttons([{ label: T.retry, onClick: begin }, { label: T.noCam, ghost: true, onClick: () => go(false) }]);
    return;
  }
  S.cam = true; $('#sp-ov').classList.add('cam');
  setup();
}
function chips(b) {
  const c = $('#sp-checks'); c.hidden = false;
  const one = (o, ok) => '<span class="sp-chk ' + (ok ? 'ok' : 'bad') + '">' + esc(L(o)) + '</span>';
  c.innerHTML = one(T.chkSit, b.seen && !b.standing) + one(T.chkSh, b.seen) + one(T.chkHands, b.seen && b.hands > 0);
}
function stopSetup() { clearInterval(S.setupT); S.setupT = 0; const c = $('#sp-checks'); if (c) c.hidden = true; }
function setup() {
  S.phase = 'setup';
  let okSince = 0, msg = null, msgAt = 0, calibAt = 0, seenSince = 0;
  const tell = (o) => { const n = performance.now(); if (msg === o || n - msgAt < 3500) return; msg = o; msgAt = n; say(esc(L(o))); };
  say(esc(L(T.noHands))); msgAt = performance.now(); msg = T.noHands;
  buttons([{ label: T.close, ghost: true, onClick: close }]);
  clearInterval(S.setupT);
  S.setupT = setInterval(() => {
    if (!S.open || S.phase !== 'setup') return stopSetup();
    const b = S.body.now(); chips(b);
    const n = performance.now();
    seenSince = b.seen ? seenSince || n : 0;
    // in view for a while but the hands hidden behind the tar, or still standing: go on, the teacher will say what it saw
    const ok = b.seen && ((b.hands > 0 && !b.standing) || n - seenSince > 8000);
    if (!ok) { okSince = 0; calibAt = 0; tell(!b.seen ? T.notSeen : b.standing ? T.standing : T.noHands); return; }
    if (!okSince) okSince = n;
    if (!calibAt && n - okSince > 900) { calibAt = n; msg = T.calib; msgAt = n; say(esc(L(T.calib))); }
    if (calibAt && n - calibAt > 1500 && S.body.calibrate(1.3)) { stopSetup(); say(esc(L(T.ready))); go(true); }
  }, 100);
}
// then the microphone, and the mu'allim starts
async function go(cam) {
  if (!cam) { S.cam = false; $('#sp-ov').classList.remove('cam'); if (S.body) S.body.stop(); }
  say('<span class="dots"><i></i><i></i><i></i></span>');
  buttons([]);
  const ok = await startMic();
  if (!ok) { say(esc(L(T.mic))); buttons([{ label: T.retry, onClick: () => go(cam) }, { label: T.close, ghost: true, onClick: close }]); return; }
  S.phase = 'lesson';
  rawi.start({ page: 'samri', mode: 'perform', camera: !!cam, time: new Date().getHours() + 'h' });
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

// ── what the learner sees during a drill ──
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
const GLYPH = { R: '⟶', L: '⟵', up: '↑', down: '↓', khallu: '⤓' };
function cueShow(e, cls) {
  const c = $('#sp-cue');
  if (!e) { c.hidden = true; c.dataset.k = ''; return; }
  const key = e.k === 'sway' ? e.side : e.k, id = e.b + key + (cls || '');
  c.hidden = false;
  if (c.dataset.k === id) return;
  c.dataset.k = id;
  c.className = 'sp-cue ' + (e.k === 'sway' ? e.side : '') + (cls ? ' ' + cls : '');
  c.firstChild.textContent = GLYPH[key]; c.lastChild.textContent = L(T.cue[key]);
}
let judgeT = 0;
function judgeShow(r) {
  const el = $('#sp-judge'), kind = r.r === 'ok' ? 'ok' : r.r === 'early' || r.r === 'late' || r.r === 'small' ? 'near' : 'miss';
  el.textContent = L(T.judge[r.r] || T.judge.missed); el.className = 'sp-judge show ' + kind;
  clearTimeout(judgeT); judgeT = setTimeout(() => el.classList.remove('show'), 1100);
  return kind;
}

// ── judging a move from the camera's readings ──
const LEAN_OK = 0.12, LEAN_SMALL = 0.06, OK_WIN = 0.35, PRE = 0.8, POST = 1.0;
function upT() { return 0.1; }                                       // the hands at least at the shoulders
function downT() { return Math.min(-0.3, S.body.h0 + 0.3); }         // back down near where they rest
function slapT() { return Math.min(-1.25, S.body.h0 - 0.6); }        // down by the knees, on the floor
// returns null while the move can still come, then { r: ok / early / late / wrong / small / missed / unseen, off }
function judgeEvent(e, from, nowT) {
  const w0 = Math.max(e.due - e.pre, from), w1 = e.due + e.post;
  const done = nowT > w1;
  const xs = S.body.samples(w0, Math.min(w1, nowT)).filter((s) => s.seen);
  const timed = (t) => { const off = t - e.due; return { r: Math.abs(off) <= OK_WIN ? 'ok' : off < 0 ? 'early' : 'late', off }; };
  if (e.k === 'khallu') {
    const hs = xs.filter((s) => s.h != null);
    let seenAt = null;
    for (let i = 0; i < xs.length; i++) {
      const s = xs[i];
      if (s.h != null && s.h <= slapT()) { seenAt = s.t; break; }
      if (s.h == null && i > 0 && xs[i - 1].h != null && xs[i - 1].h < downT()) { seenAt = s.t; break; }   // the hands left the frame on the way down
    }
    const heard = S.hits.map((h) => h - IN_LAT).filter((h) => h >= e.due - 0.3 && h <= w1);
    const at = heard.length ? heard[0] : seenAt;
    if (at != null && (done || seenAt != null)) return { ...timed(at), seen: seenAt != null, heard: heard.length > 0 };
    if (!done) return null;
    if (hs.length < 4 && !heard.length) return { r: 'unseen' };
    return { r: 'missed', seen: false, heard: false };
  }
  if (e.k === 'sway') {
    const sg = e.side === 'R' ? 1 : -1;
    let maxv = -9, opp = 0, n = 0;
    for (const s of xs) {
      if (s.lean == null) continue;
      const v = s.lean * sg; n++;
      if (v >= LEAN_OK) return timed(s.t);
      maxv = Math.max(maxv, v); if (v <= -LEAN_OK) opp++;
    }
    if (!done) return null;
    if (n < 5) return { r: 'unseen' };
    if (opp > n * 0.5) return { r: 'wrong' };
    return { r: maxv >= LEAN_SMALL ? 'small' : 'missed' };
  }
  // lift and lower
  const hs = xs.filter((s) => s.h != null);
  const want = (h) => (e.k === 'up' ? h >= upT() : h <= downT());
  for (const s of hs) if (want(s.h)) return timed(s.t);
  if (!done) return null;
  if (hs.length < 4) return { r: 'unseen' };
  const best = e.k === 'up' ? Math.max(...hs.map((s) => s.h)) : Math.min(...hs.map((s) => s.h));
  return { r: (e.k === 'up' ? best >= upT() - 0.45 : best <= downT() + 0.45) ? 'small' : 'missed' };
}
function sumMoves(evs) {
  const of = (list) => {
    const got = list.filter((e) => e.res && e.res.off != null).map((e) => e.res.off);
    const c = (r) => list.filter((e) => e.res && e.res.r === r).length;
    return { expected: list.length, on_time: c('ok'), early: c('early'), late: c('late'), ...(list[0] && list[0].k === 'sway' ? { wrong_side: c('wrong') } : {}),
      small: c('small'), missed: c('missed'), unseen: c('unseen'), mean_offset_ms: got.length ? Math.round(got.reduce((a, b) => a + b, 0) / got.length * 1000) : null };
  };
  const out = {};
  const sway = evs.filter((e) => e.k === 'sway'), lift = evs.filter((e) => e.k === 'up' || e.k === 'down'), kh = evs.find((e) => e.k === 'khallu');
  if (sway.length) out.sway = of(sway);
  if (lift.length) out.lift = of(lift);
  if (kh) out.khallu = { seen: !!(kh.res && kh.res.seen), heard: !!(kh.res && kh.res.heard), on_time: !!(kh.res && kh.res.r === 'ok'), offset_ms: kh.res && kh.res.off != null ? Math.round(kh.res.off * 1000) : null, result: kh.res ? kh.res.r : 'missed' };
  return out;
}
// the strikes the camera saw: the hands dropping fast onto the tar
function strikeMotions(t0, t1) {
  const xs = S.body.samples(t0, t1).filter((s) => s.h != null);
  let n = 0, last = -9;
  for (let i = 2; i < xs.length; i++) {
    const dt = xs[i].t - xs[i - 2].t; if (dt <= 0) continue;
    if ((xs[i].h - xs[i - 2].h) / dt < -2.2 && xs[i].t - last > 0.22) { n++; last = xs[i].t; }
  }
  return n;
}
function bodyOf(t0, t1) {
  const xs = S.body.samples(t0, t1);
  const seen = xs.length ? xs.filter((s) => s.seen).length / xs.length : 0;
  const st = xs.filter((s) => s.stand != null);
  return { seen: Math.round(seen * 100) / 100, posture: st.length < 5 ? 'unknown' : st.filter((s) => s.stand).length > st.length * 0.5 ? 'standing' : 'seated' };
}

// ── a drill: the drums, the call, your answer and your moves, measured ──
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
function queueDrill(args, spoken) {
  if (!S.open) open();
  S.pending = args;
  Promise.resolve(spoken).then(() => sleep(700)).then(() => { if (S.pending === args && S.open) { S.pending = null; runDrill(args); } });
}
function stopDrill() {
  if (S.run) { S.run.cancel = true; S.run = null; }
  cancelAnimationFrame(S.raf);
  if (S.music) { S.music.rests = []; S.music.plan = null; S.music.stop(); S.music.claps = false; S.music.drums = true; }
  record(false); S.rec = null;
  cueShow(null);
  const ov = $('#sp-ov'); if (ov) ov.classList.remove('drill');
}

async function runDrill(d) {
  stopDrill();
  const H = halfOf(d.poem, d.half);
  if (!H) return;
  if (!(await startMic())) { say(esc(L(T.mic))); buttons([{ label: T.retry, onClick: () => runDrill(d) }, { label: T.close, ghost: true, onClick: close }]); return; }
  const sc = script(d);
  // the learner may have shifted since: if they sit upright now, that is the new zero for the lean
  if (S.cam && S.body) { const b = S.body.now(); if (b.seen && b.lean != null && Math.abs(b.lean) < 0.15) S.body.calibrate(1.0, true); }
  // a drill of moves needs the camera: without it the answer is drilled instead
  if (sc.move !== 'answer' && !S.cam) { const a = { ...d, move: 'answer', level: Math.min(d.level, 3) }; return runDrill(a); }
  const music = S.music, style = d.poem === 'classic' && d.style === 'light' ? 'light' : 'heavy';
  const lead = sc.move === 'answer' && d.level === 4;
  let seg = null;
  if (H.topic) { try { seg = (await loadTopic(H.topic, music.ensure())).seg; } catch (e) { seg = null; } }
  const voiceFor = (row) => (H.voice ? H.voice(row) : seg && seg[H.clip(row)] ? { row, what: H.what, seg: seg[H.clip(row)], vol: 1 } : null);
  const slots = sc.slots, youAt = slots.indexOf('you');
  const run = { d, H, cancel: false };
  S.run = run; S.last = { ...d, move: sc.move }; S.phase = 'drill';
  lvl({ level: d.level, style, move: sc.move }); $('#sp-result').innerHTML = ''; $('#sp-heard').textContent = '';
  line(H, d.level >= 3 && youAt >= 0);
  $('#sp-ov').classList.add('drill');
  buttons([finishButton()]);

  music.unlock(); music.stop(); music.voicesOff = false; music.claps = !!sc.claps; music.drums = true; music.drumVol = 0.9; music.rests = [];
  music.plan = (slot) => { const r = slots[slot]; return r === 'A' ? voiceFor(0) : r === 'B' ? voiceFor(1) : null; };
  music.start(style, 0.4);
  const tOf = (k) => music.timeOf(k * 4);
  const out = music.ctx ? (music.ctx.outputLatency || music.ctx.baseLatency || 0) : 0;
  const hasYou = youAt >= 0, ys = hasYou ? tOf(youAt) : 0, ye = hasYou ? tOf(youAt + 1) : 0;
  // the moves, at the moment the learner hears their beat
  const evs = sc.ev.map(([b, k, side]) => ({ b, k, side, due: music.timeOf(b) + out, res: null, kind: null }));
  // each move is looked for from a little before its beat to a little after, never reaching into the next one's
  evs.forEach((e, i) => {
    const gp = i ? e.due - evs[i - 1].due : 9, gn = i < evs.length - 1 ? evs[i + 1].due - e.due : 9;
    e.pre = Math.min(PRE, 0.45 * gp); e.post = Math.min(e.k === 'khallu' ? 0.8 : POST, 0.55 * gn);
  });
  const kh = evs.find((e) => e.k === 'khallu');
  const rests = [];
  if (hasYou) rests.push([ys, ye]);
  if (kh) rests.push([music.timeOf(kh.b) - 0.03, music.timeOf(kh.b) + 60]);   // the drums stop for the slap, so the microphone hears yours
  music.rests = rests;
  const end = kh ? kh.due + 1.3 : tOf(slots.length);
  const strokes = hasYou ? music.strokes(youAt * 4, youAt * 4 + 4 - 1e-3).map((b) => music.timeOf(b)) : [];
  dots(strokes.length);
  const pulse = 60 / STYLES[style].bpm / 3;
  const cues = music.strokes(0, (kh ? kh.b : slots.length * 4) - 1e-3).map((b) => music.timeOf(b));
  const t0 = music.timeOf(0);
  let recOn = false, recOff = false, cueI = 0, pcmP = null, judged = 0, from = t0;
  S.hits = []; S.levels = [];
  if (SIM && S.body && S.body.sim) {
    const plan = evs.map((e) => ({ due: e.due, k: e.k, side: e.side, lag: e.k === 'khallu' ? 0.05 : undefined }));
    strokes.forEach((s) => plan.push({ due: s + out, k: 'strike' }));
    S.body.simPlan(plan);
    if (kh) setTimeout(() => S.hits.push(kh.due + 0.04 + IN_LAT), Math.max(0, (kh.due + 0.04 - music.time()) * 1000));
  }

  await new Promise((resolve) => {
    const frame = () => {
      if (run.cancel) return resolve();
      const now = music.time(), t = now - (music.ctx ? out : 0);
      const k = Math.max(0, Math.floor((t - tOf(0)) / (tOf(1) - tOf(0))));
      const role = slots[Math.min(k, slots.length - 1)];
      const moveIn = evs.find((e) => !e.res && e.b >= k * 4 - 0.01 && e.b < k * 4 + 4) || evs.find((e) => e.b >= k * 4 - 0.01 && e.b < k * 4 + 4);
      const label = role === 'count' ? T.count : role === 'you' ? (lead ? T.youLead : T.you) : role === 'end' ? T.slapNow
        : moveIn ? (moveIn.k === 'sway' ? T.swayNow : moveIn.k === 'khallu' ? T.slapNow : T.liftNow)
        : role === 'A' ? T.callA : lead ? T.answersYou : T.callB;
      who(label, role === 'you' || !!moveIn);
      // the words light up as they are sung (yours only up to level 2)
      const p = (t - tOf(Math.min(k, slots.length - 1))) / pulse;
      lightWords(H, role === 'count' || role === 'end' || (role === 'you' && d.level >= 3) ? -1 : p);
      // the tar glows on each stroke, except in your turn from level 3
      while (cueI < cues.length && cues[cueI] <= t) { const inYou = hasYou && cues[cueI] >= ys - 0.01 && cues[cueI] < ye - 0.01; if (!(inYou && d.level >= 3)) flash(true); cueI++; }
      if (hasYou && t >= ys - 0.3 && t <= ye + 0.3) markDots(strokes, out, t);
      // your answer is recorded during your turn only
      if (hasYou && !recOn && now >= ys - 0.25) { recOn = true; S.levels = []; S.hits = S.hits.filter((h) => h >= ys - 0.25); record(true); if (SIM) simulate(strokes, out, d); }
      if (hasYou && recOn && !recOff && now >= ye + 0.35) { recOff = true; pcmP = recorded(); }
      // the moves: the cue just before each one (the leader's call; the sway arrows up to level 2), then the camera's verdict
      for (let i = judged; i < evs.length; i++) {
        const e = evs[i];
        if (now < e.due - e.pre) break;
        if (e.res) continue;
        const r = judgeEvent(e, from, now);
        if (r) { e.res = r; e.kind = judgeShow(r); from = r.off != null ? e.due + r.off + 0.1 : e.due + 0.2; if (i === judged) judged++; }
        break;
      }
      while (judged < evs.length && evs[judged].res) judged++;
      const nextE = evs.find((e) => !e.res && now >= e.due - 1.1 && now <= e.due + e.post);
      const lastE = evs.slice().reverse().find((e) => e.res && now <= e.due + 0.9);
      const shown = nextE || lastE;
      const visible = shown && (shown.k !== 'sway' || d.level <= 2 || shown.res);
      if (visible) {
        cueShow(shown, shown.res ? shown.kind : null);
        $('#sp-cue').classList.toggle('beat', !shown.res && Math.abs(now - shown.due) < 0.12);
      } else cueShow(null);
      if (now >= Math.max(end, (hasYou ? ye + 0.4 : 0))) return resolve();
      S.raf = requestAnimationFrame(frame);
    };
    S.raf = requestAnimationFrame(frame);
  });
  if (run.cancel || S.run !== run) return;
  const pcm = hasYou ? await (pcmP || recorded()) : null;
  // anything still open is judged now
  evs.forEach((e) => { if (!e.res) { e.res = judgeEvent(e, e.due - e.pre, Infinity) || { r: 'missed' }; } });
  music.rests = []; music.plan = null; music.stop(); music.claps = false; music.drums = true;
  who(null); lightWords(H, -1); cueShow(null); $('#sp-ov').classList.remove('drill');
  const m = hasYou ? measure(strokes, out, ys, ye) : {};
  if (S.cam) {
    const bt0 = hasYou && !evs.length ? ys - 0.2 : t0 + 0.5, bt1 = Math.max(end, hasYou ? ye + 0.2 : 0);
    m.moves = sumMoves(evs);
    if (hasYou) m.moves.strike_motions = strikeMotions(ys - 0.1, ye + 0.2);
    m.body = bodyOf(bt0, bt1);
  }
  if (hasYou) markDots(strokes, out, Infinity);
  showResult(m);
  S.run = null; S.phase = 'lesson';
  say('<span class="dots"><i></i><i></i><i></i></span> <small>' + esc(L(T.thinking)) + '</small>');
  buttons([]);
  const starts = []; H.timing.forEach((s) => { if (s[2] >= 0) starts[s[2]] = s[0] * pulse; });
  const audio = hasYou && pcm && pcm.length > 4000 && !SIM ? { ...wav16([pcm], 16000), offset: 0.25 } : null;
  rawi.turn({
    type: 'attempt', skill: sc.move === 'answer' ? (lead ? 'samri.lead' : 'samri.answer') : 'samri.' + sc.move,
    drill: { poem: d.poem, half: d.half, level: d.level, style, move: sc.move },
    metrics: m, audio, ...(hasYou ? { expected: { text: H.text, starts: starts.filter((x) => x != null) } } : {}),
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
  const chips = [];
  const chip = (label, val, bad) => chips.push('<span class="sp-chip' + (bad ? ' bad' : '') + '">' + esc(L(label)) + (val ? ' <b>' + esc(val) + '</b>' : '') + '</span>');
  const s = m.strikes;
  if (s) {
    const tm = s.mean_offset_ms == null ? '' : Math.abs(s.mean_offset_ms) <= 60 ? L(T.ontime) : num(Math.abs(s.mean_offset_ms)) + ' ' + L(T.ms) + ' ' + L(s.mean_offset_ms < 0 ? T.early : T.late);
    chip(T.strikes, num(s.hit) + '/' + num(s.expected) + (tm ? ' · ' + tm : ''));
    if (m.voice && !m.voice.present) chip(T.noVoice, '', true);
  }
  const mv = m.moves || {};
  if (mv.sway) chip(T.sway, num(mv.sway.on_time) + '/' + num(mv.sway.expected));
  if (mv.lift) chip(T.lift, num(mv.lift.on_time) + '/' + num(mv.lift.expected));
  if (mv.khallu) chip(T.slap, mv.khallu.on_time ? '✓' : '✗', !mv.khallu.on_time);
  if (m.body && m.body.posture === 'standing') chip(T.standingChip, '', true);
  if (m.body && m.body.seen < 0.6) chip(T.unseenChip, '', true);
  $('#sp-result').innerHTML = chips.join('');
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
  else buttons([finishButton()]);
}

function boot() {
  rawi = pageRawi('samri');
  build();
  rawi.on('start_drill', (args, spoken) => queueDrill(args, spoken));
  rawi.on('reply', onReply);
  if (/[?&]perform=1/.test(location.search)) setTimeout(open, 600);
  window.__perform = { S, open, close, runDrill, measure, halfOf, script };
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
