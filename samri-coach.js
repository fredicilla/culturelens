/**
 * samri-coach.js — «مدرّبك في السامري», an AI coach for the Samri.
 *
 * The phone's camera watches the player's upper body with a pose-estimation model (MediaPipe Pose
 * Landmarker, running in the browser; no video leaves the phone). While the real Samri drums play
 * (samri-music.js), the coach gives the instructions, judges every move as it happens and adapts:
 *   1. Clap   — clap with the lone stroke that opens each cycle of the heavy Samri of Unaizah
 *   2. Sway   — lean toward your right neighbour for one cycle, then your left
 *   3. Samri  — the two together, the way the rows take turns: clap, clap, sway right, sway left
 * It decides when a lesson is learned (enough good moves in a row), gives a targeted tip when the
 * same mistake repeats (early, late, too small a lean, the wrong side) and, if the player keeps
 * struggling, widens its own tolerance and says so.
 * It opens from a button in part 3 of the Samri page («جرّب السامري بنفسك»). Add ?sim=1 to the address to run it
 * with a simulated player instead of the camera (for testing).
 */
import { Music } from './samri-music.js';

// ── the coach lives in an overlay on top of the Samri page; this builds it ──
const CSS = `
  #sc-ov [hidden] { display: none !important; }
  #sc-ov { position: fixed; inset: 0; z-index: 2147483000; background: #070A16; color: #F3EEE6; overflow: hidden; display: none; font-family: var(--font-ui, 'IBM Plex Sans Arabic', system-ui, sans-serif); }
  #sc-ov.open { display: block; }
  #sc-ov * { box-sizing: border-box; }
  .sc-top { position: absolute; top: 0; left: 0; right: 0; z-index: 20; display: flex; align-items: center; justify-content: space-between; gap: 10px;
    padding: calc(10px + env(safe-area-inset-top, 0px)) 14px 10px; background: linear-gradient(#070A16, rgba(7,10,22,0)); }
  .sc-top a, .sc-top button { color: #F3EEE6; background: rgba(243,238,230,.08); border: 1px solid rgba(243,238,230,.18); border-radius: 999px;
    padding: 8px 14px; font: inherit; font-size: 14px; text-decoration: none; cursor: pointer; }
  .sc-title { font-weight: 700; font-size: 16px; display: flex; align-items: center; gap: 8px; }
  .sc-title i { font-style: normal; font-size: 11px; color: #070A16; background: #E3C47A; border-radius: 999px; padding: 2px 8px; font-weight: 700; }
  .sc-stage { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; background: #070A16; }
  .sc-stage video, .sc-stage canvas { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; transform: scaleX(-1); }
  .sc-stage video { opacity: .55; filter: saturate(.7); }
  .sc-ring { position: absolute; z-index: 10; left: 50%; top: 46%; width: 150px; height: 150px; margin: -75px 0 0 -75px; border-radius: 50%;
    border: 3px solid rgba(227,196,122,.35); display: flex; align-items: center; justify-content: center; pointer-events: none; }
  .sc-ring b { width: 100%; height: 100%; border-radius: 50%; background: radial-gradient(circle, rgba(227,196,122,.55), rgba(227,196,122,0) 70%); opacity: 0; }
  .sc-ring.hit b { animation: scHit .45s ease-out; }
  .sc-ring.lean { border-color: #7EE08A; box-shadow: 0 0 0 6px rgba(126,224,138,.15); }
  .sc-ring { transition: border-color .15s, box-shadow .15s; }
  @keyframes scHit { from { opacity: 1; transform: scale(.7); } to { opacity: 0; transform: scale(1.25); } }
  .sc-ring span { position: absolute; font-size: 28px; font-weight: 700; color: #E3C47A; }
  .sc-side { position: absolute; z-index: 10; top: 46%; transform: translateY(-50%); font-size: 64px; color: #E3C47A; opacity: 0; transition: opacity .2s; pointer-events: none; }
  .sc-side.r { right: 6%; } .sc-side.l { left: 6%; } .sc-side.on { opacity: 1; }
  .sc-judge { position: absolute; z-index: 12; left: 0; right: 0; top: 16%; text-align: center; font-size: 34px; font-weight: 800; opacity: 0;
    transition: opacity .15s; pointer-events: none; text-shadow: 0 2px 12px rgba(0,0,0,.6); }
  .sc-judge.show { opacity: 1; } .sc-judge.ok { color: #7EE08A; } .sc-judge.near { color: #E3C47A; } .sc-judge.bad { color: #FF8A7A; }
  .sc-coach { position: absolute; z-index: 15; left: 12px; right: 12px; bottom: calc(14px + env(safe-area-inset-bottom, 0px)); max-width: 620px; margin: 0 auto;
    background: rgba(14,11,26,.9); border: 1px solid rgba(227,196,122,.45); border-radius: 18px; padding: 14px 16px; backdrop-filter: blur(6px); }
  .sc-who { display: flex; align-items: center; gap: 8px; font-size: 13px; color: #E3C47A; font-weight: 700; margin-bottom: 6px; }
  .sc-who .dot { width: 8px; height: 8px; border-radius: 50%; background: #7EE08A; box-shadow: 0 0 0 0 rgba(126,224,138,.6); animation: scPulse 1.6s infinite; }
  @keyframes scPulse { 70% { box-shadow: 0 0 0 8px rgba(126,224,138,0); } 100% { box-shadow: 0 0 0 0 rgba(126,224,138,0); } }
  .sc-msg { font-size: 19px; line-height: 1.7; min-height: 1.7em; font-weight: 600; }
  .sc-row { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-top: 12px; flex-wrap: wrap; }
  .sc-steps { display: flex; gap: 6px; } .sc-steps i { width: 26px; height: 6px; border-radius: 3px; background: rgba(243,238,230,.18); }
  .sc-steps i.on { background: #E3C47A; } .sc-steps i.done { background: #7EE08A; }
  .sc-score { font-size: 14px; color: rgba(243,238,230,.7); }
  .sc-btn { background: #E3C47A; color: #16121D; border: 0; border-radius: 999px; padding: 11px 22px; font: inherit; font-weight: 700; font-size: 16px; cursor: pointer; }
  .sc-btn.ghost { background: transparent; color: #F3EEE6; border: 1px solid rgba(243,238,230,.3); }
  .sc-stars { font-size: 34px; letter-spacing: 4px; color: #E3C47A; text-align: center; margin: 4px 0 2px; }
  .sc-stars .off { color: rgba(243,238,230,.2); }
  .sc-intro { position: absolute; inset: 0; z-index: 14; display: flex; align-items: center; justify-content: center; padding: 90px 20px 210px; text-align: center; }
  .sc-intro h1 { font-size: 30px; margin: 0 0 10px; } .sc-intro p { color: rgba(243,238,230,.75); line-height: 1.7; max-width: 520px; margin: 0 auto; font-size: 16px; }
  .sc-intro ul { list-style: none; padding: 0; margin: 16px auto 0; max-width: 460px; text-align: start; font-size: 15px; line-height: 1.9; color: rgba(243,238,230,.85); }
  html[dir="rtl"] #sc-ov .sc-intro ul { text-align: right; }
  .sc-loading { position: absolute; z-index: 16; left: 50%; top: 46%; transform: translate(-50%,-50%); font-size: 15px; color: rgba(243,238,230,.8); display: none; }
  .sc-loading.on { display: block; }
  .sc-chks { display: flex; gap: 6px; flex-wrap: wrap; }
  .sc-chk { font-size: 13px; border-radius: 999px; padding: 5px 11px; border: 1px solid rgba(243,238,230,.25); color: rgba(243,238,230,.65); }
  .sc-chk.ok { border-color: #7EE08A; color: #7EE08A; background: rgba(126,224,138,.1); }
  .sc-chk.bad { border-color: #FF8A7A; color: #FF8A7A; background: rgba(255,138,122,.1); }

  #sc-entry { position: fixed; z-index: 60; left: 50%; transform: translateX(-50%); bottom: calc(var(--qx-bar, 64px) + env(safe-area-inset-bottom, 0px) + 18px);
    display: none; align-items: center; gap: 8px; background: #E3C47A; color: #16121D; border: 0; border-radius: 999px; padding: 11px 20px;
    font: inherit; font-weight: 700; font-size: 15px; cursor: pointer; box-shadow: 0 8px 24px rgba(0,0,0,.35); white-space: nowrap; }
  #sc-entry.show { display: inline-flex; }
  #sc-entry i { font-style: normal; font-size: 11px; background: #16121D; color: #E3C47A; border-radius: 999px; padding: 2px 7px; }
`;
const MARKUP = `<div class="sc-stage" id="sc-stage"><video id="sc-video" playsinline muted></video><canvas id="sc-canvas"></canvas></div>
  <header class="sc-top">
    <button type="button" id="sc-close" aria-label="Close">✕</button>
    <div class="sc-title"><span class="translatable" data-en="Samri Coach" data-ar="مدرّب السامري">Samri Coach</span><i>AI</i></div>
    <button id="sc-lang" type="button"></button>
  </header>
  <div class="sc-intro" id="sc-intro"></div>
  <div class="sc-ring" id="sc-ring" hidden><b></b><span id="sc-count"></span></div>
  <div class="sc-side r" id="sc-side-r">⟶</div><div class="sc-side l" id="sc-side-l">⟵</div>
  <div class="sc-judge" id="sc-judge"></div>
  <div class="sc-loading" id="sc-loading"></div>

  <section class="sc-coach" id="sc-coach">
    <div class="sc-who"><span class="dot"></span><span id="sc-who"></span></div>
    <div class="sc-msg" id="sc-msg" aria-live="polite"></div>
    <div class="sc-row" id="sc-row"></div>
  </section>`;
const st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
const ov = document.createElement('div'); ov.id = 'sc-ov'; ov.setAttribute('role', 'dialog'); ov.innerHTML = MARKUP; document.body.appendChild(ov);
const entry = document.createElement('button'); entry.id = 'sc-entry'; entry.type = 'button'; document.body.appendChild(entry);


const MP = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14';
const MODEL = 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task';
const SIM = /[?&]sim=1/.test(location.search);
const CAM_LAG = 0.09;                     // seconds between a move and the frame that shows it

const $ = (s) => document.querySelector(s);
const isAr = () => window.currentLang === 'ar';
const L = (o) => (o == null ? '' : typeof o === 'string' ? o : isAr() ? o.ar : o.en);
const num = (n) => (isAr() ? String(n).replace(/\d/g, (d) => '٠١٢٣٤٥٦٧٨٩'[d]) : String(n));

const T = {
  who: { en: 'I am your Samri coach', ar: 'أنا مدرّبك في السامري' },
  introH: { en: 'Try the Samri yourself', ar: 'جرّب السامري بنفسك' },
  introP: { en: 'The Samri is performed seated, in two facing rows. I am your Samri coach: I watch you through the front camera, tell you each move, wait for you, and tell you right away whether you did it right.', ar: 'السامري يُؤدّى جلوس في صفّين متقابلين. أنا مدرّبك في السامري: أشوفك من الكاميرا الأمامية، أقولك الحركة، وأنتظرك لين تسويها، وأقولك على طول صح أو غلط.' },
  introL: [
    { en: '1 · Sit on your knees facing the camera', ar: '١ · اجلس على ركبك مقابل الكاميرا' },
    { en: '2 · Lean to your right and clap', ar: '٢ · مِل على يمينك وصفّق' },
    { en: '3 · Lean to your left and clap', ar: '٣ · مِل على يسارك وصفّق' },
    { en: '4 · Again, right and left, at your own pace', ar: '٤ · وكرّرها يمين ويسار على راحتك' }
  ],
  privacy: { en: 'Before you start: sit on the floor (or on a chair) facing the camera, place the phone at chest height about one metre away, and make sure your head, shoulders and hands are in view. The video never leaves your device.', ar: 'قبل ما تبدأ: اجلس على الأرض (أو على كرسي) مقابل الكاميرا، وخلّ الجوال على مستوى صدرك وعلى بُعد متر تقريبًا، بحيث يبان راسك وكتوفك ويدينك. الفيديو ما يطلع من جهازك.' },
  start: { en: 'Start with the camera', ar: 'ابدأ بالكاميرا' },
  hello: { en: 'Hello! Tap start and allow the camera.', ar: 'هلا والله! اضغط «ابدأ» واسمح للكاميرا.' },
  loading: { en: 'Waking up the AI…', ar: 'نجهّز الذكاء الاصطناعي…' },
  noCam: { en: 'I could not open the camera. Allow camera access in your browser, then try again.', ar: 'ما قدرت أفتح الكاميرا. اسمح للمتصفح يستخدم الكاميرا وجرّب مرة ثانية.' },
  noModel: { en: 'The AI model did not load. Check your internet connection and try again.', ar: 'نموذج الذكاء الاصطناعي ما تحمّل. تأكد من الإنترنت وجرّب مرة ثانية.' },
  retry: { en: 'Try again', ar: 'جرّب مرة ثانية' },
  calib: { en: 'Perfect. Hold still and sit upright for a moment while I calibrate…', ar: 'ممتاز. اثبت جالس ومعتدل لحظة… أضبط مكانك.' },
  notSeen: { en: 'I cannot see your shoulders clearly. Move the phone back a little or adjust its angle.', ar: 'ما أشوف كتوفك بوضوح. بعّد الجوال شوي أو عدّل زاويته.' },
  sit: { en: 'Sit on your knees on the floor, facing the camera, with your hands in front of your chest.', ar: 'اجلس على ركبك على الأرض مقابل الكاميرا، ويدينك قدّام صدرك.' },
  standing: { en: 'You seem to be standing. Please sit down: the Samri is performed seated.', ar: 'شكلك واقف. اجلس لو سمحت، السامري يُؤدّى جلوسًا.' },
  standPause: { en: 'You stood up. Sit back down so we can carry on.', ar: 'وقفت! ارجع اجلس عشان نكمّل.' },
  noHands: { en: 'Raise your hands in front of your chest so I can see them.', ar: 'ارفع يدينك قدّام صدرك عشان أشوفها.' },
  slow: { en: 'Loading is taking longer than usual. Check your connection and try again.', ar: 'التحميل أخذ وقت أطول من المعتاد. تأكد من الإنترنت وجرّب مرة ثانية.' },
  chkSit: { en: 'Seated', ar: 'جالس' }, chkSh: { en: 'Shoulders', ar: 'الكتوف' }, chkHands: { en: 'Hands', ar: 'اليدين' },
  ready: { en: 'I can see you. Let us begin!', ar: 'شايفك زين. يلا نبدأ!' },
  play: {
    say: { en: 'Easy: when I say «right», lean to your right and clap. When I say «left», lean to your left and clap. Take your time, I will wait for you.', ar: 'بسيطة: لما أقول «يمين» مِل على يمينك وصفّق، ولما أقول «يسار» مِل على يسارك وصفّق. خذ راحتك، أنا أنتظرك.' },
    done: { en: 'That is the Samri! Well done.', ar: 'هذا هو السامري! كفو عليك.' }
  },
  step: {
    R: { en: 'Lean to your right… and clap.', ar: 'مِل على يمينك… وصفّق.' },
    L: { en: 'Lean to your left… and clap.', ar: 'مِل على يسارك… وصفّق.' }
  },
  good: [{ en: 'Correct! Well done', ar: 'صح! كفو' }, { en: 'Correct!', ar: 'صح!' }, { en: 'Correct, beautiful!', ar: 'صح، جميل!' }],
  nowClap: { en: 'Good lean. Now clap!', ar: 'زين! الحين صفّق' },
  wrongSide: { en: { R: 'Wrong: that is your left. Lean to your right', L: 'Wrong: that is your right. Lean to your left' }, ar: { R: 'غلط: هذا يسارك. مِل على يمينك', L: 'غلط: هذا يمينك. مِل على يسارك' } },
  noLean: { en: 'Wrong: lean first, then clap', ar: 'غلط: مِل أول، وبعدين صفّق' },
  smallLean: { en: 'Almost! Lean a little more, then clap', ar: 'قريب! مِل أكثر شوي وبعدين صفّق' },

  listen: { en: 'Listen to the first round…', ar: 'اسمع أول دورة…' },
  go: { en: 'Now you!', ar: 'دورك الحين!' },
  lessons: {
    clap: {
      name: { en: 'Clap with the drum', ar: 'صفّق مع الطار' },
      say: { en: 'Lesson one, the clap. Sit on your knees with your open hands in front of your chest. Each time I say «Now», clap once with the drum stroke, then open your hands again. After every move I tell you right or wrong.', ar: 'الدرس الأول: التصفيق. اجلس على ركبك، ويدينك مفتوحة قدّام صدرك. كل ما قلت «الحين» صفّق مرة وحدة مع ضربة الطار، وبعدها افتح يدينك. بعد كل حركة أقولك صح أو غلط.' },
      done: { en: 'Your clap is on the beat. Now the sway.', ar: 'تصفيقك مضبوط على الإيقاع. الحين التمايل.' }
    },
    sway: {
      name: { en: 'Sway right and left', ar: 'تمايل يمين ويسار' },
      say: { en: 'Lesson two, the sway. When I say «Right», lean your shoulders and head to your right and hold it until I speak again. When I say «Left», lean to your left. The arrow on the screen shows the side.', ar: 'الدرس الثاني: التمايل. لما أقول «يمين» مِل بكتوفك وراسك على يمينك واثبت لين أتكلم. ولما أقول «يسار» مِل على يسارك. السهم على الشاشة يوريك الجهة.' },
      done: { en: 'Beautiful sway. Now the whole Samri!', ar: 'تمايلك جميل. الحين السامري كامل!' }
    },
    full: {
      name: { en: 'A full Samri round', ar: 'جولة سامري كاملة' },
      say: { en: 'Last lesson, the full Samri: clap, clap, right, left, then once more. I tell you each move before it comes.', ar: 'الدرس الأخير: السامري كامل. تصفيق، تصفيق، يمين، يسار، ومرة ثانية. أقولك كل حركة قبل لا تجي.' },
      done: { en: 'That is the Samri! Well done.', ar: 'هذا هو السامري! كفو عليك.' }
    }
  },
  ok: { en: 'Correct!', ar: 'صح!' },
  early: { en: 'Wrong: too early. Clap with the stroke', ar: 'غلط: بدري. صفّق مع الضربة' },
  late: { en: 'Wrong: too late. Clap with the stroke', ar: 'غلط: متأخر. صفّق مع الضربة' },
  miss: { en: 'Wrong: you missed it', ar: 'غلط: ما سوّيت الحركة' },
  extra: { en: 'Wrong: wait for the stroke', ar: 'غلط: استنّ الضربة' },
  right: { en: 'Right', ar: 'يمين' }, left: { en: 'Left', ar: 'يسار' },
  clapNow: { en: 'Clap', ar: 'صفّق' },
  now: { en: 'Now!', ar: 'الحين!' },
  cue: {
    clap: { en: 'Get your hands ready… clap on the next stroke.', ar: 'جهّز يدينك… صفّق مع الضربة الجاية.' },
    R: { en: 'Get ready… lean to your right on the next stroke.', ar: 'استعد… مِل على يمينك مع الضربة الجاية.' },
    L: { en: 'Get ready… lean to your left on the next stroke.', ar: 'استعد… مِل على يسارك مع الضربة الجاية.' }
  },
  next: { en: 'Next move: ', ar: 'الحركة الجاية: ' },
  swayOk: { en: 'Correct! Right technique', ar: 'صح! طريقتك صحيحة' },
  swayWrong: { en: 'Wrong: the other side', ar: 'غلط: الجهة الثانية' },
  swaySmall: { en: 'Wrong: lean more', ar: 'غلط: مِل أكثر' },
  tips: {
    early: { en: 'You are clapping before the stroke. Listen for it, and clap with it, not ahead of it.', ar: 'تصفّق قبل الضربة. اسمعها أول، وصفّق معها مو قبلها.' },
    late: { en: 'You are a little behind. Get your hands ready just before the stroke.', ar: 'متأخر شوي. جهّز يدينك قبل الضربة بلحظة.' },
    miss: { en: 'I did not see a clap. Bring your hands together in front of your chest, then open them between strokes.', ar: 'ما شفت تصفيق. قرّب يدينك قدّام صدرك، وافتحها بين الضربات.' },
    small: { en: 'Lean your whole upper body, so your head goes over your neighbour\'s shoulder.', ar: 'مِل بكتوفك وراسك كلها، كأن راسك يروح فوق كتف جارك.' },
    wrong: { en: 'Your right is the arrow\'s side. The screen works like a mirror.', ar: 'يمينك هي جهة السهم. الشاشة مثل المراية.' },
    easier: { en: 'I am making it a little easier for you: I will accept a bit more off the beat.', ar: 'بسهّلها عليك شوي: بقبل لو كنت بعيد عن الضربة شوي.' }
  },
  progress: { en: 'Good moves', ar: 'حركات صحيحة' },
  score: { en: 'Your Samri', ar: 'نتيجتك' },
  again: { en: 'Play again', ar: 'العب مرة ثانية' },
  back: { en: 'Back to the Samri', ar: 'رجوع للسامري' },
  skip: { en: 'Skip', ar: 'تخطّي' },
  entry: { en: 'Try the Samri yourself', ar: 'جرّب السامري بنفسك' }
};

// ── state ──
const S = {
  phase: 'intro', lesson: -1, tol: 0.2, voice: null,
  base: null, calibN: 0, calibSum: 0, seenAt: 0,
  wrist: 'open', claps: [], judged: {}, startBeat: 0,
  good: 0, need: 0, streakBad: 0, lastBad: null, badCount: {}, tries: 0,
  cyc: -1, leanSamples: [], score: 0, maxScore: 0, ended: false,
  standN: 0, sitN: 0, standing: false, okN: 0, lastWarn: 0,
  step: 0, stepAt: 0, holdN: 0, oppN: 0, leanS: 0, lastClap: 0, lastJudge: 0, mistakes: 0, stepMiss: false, hinted: false, repeated: false
};
const LESSONS = ['play'];
const PLAN = ['R', 'L', 'R', 'L', 'R', 'L'];   // lean right and clap, lean left and clap, three times
const music = new Music();
let landmarker = null, video = $('#sc-video'), canvas = $('#sc-canvas'), ctx = canvas.getContext('2d');
let lastLm = null, lastVideoTime = -1, raf = 0;

// ── the coach's voice and words ──
function pickVoice() {
  if (!('speechSynthesis' in window)) return null;
  const vs = speechSynthesis.getVoices(), want = isAr() ? 'ar' : 'en';
  return vs.find((v) => v.lang && v.lang.toLowerCase().startsWith(want + '-sa')) || vs.find((v) => v.lang && v.lang.toLowerCase().startsWith(want)) || null;
}
function say(o, speak) {
  $('#sc-msg').textContent = L(o);
  if (speak === false || !('speechSynthesis' in window)) return;
  try {
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(L(o)), v = pickVoice();
    if (v) u.voice = v; u.lang = v ? v.lang : (isAr() ? 'ar-SA' : 'en-US'); u.rate = 1; u.volume = 1;
    speechSynthesis.speak(u);
  } catch (e) {}
}
let judgeTimer = 0;
function judge(o, kind, quiet) {
  const el = $('#sc-judge'); el.textContent = L(o); el.className = 'sc-judge show ' + kind;
  if (!quiet) say(o);
  clearTimeout(judgeTimer); judgeTimer = setTimeout(() => el.classList.remove('show'), 3500);
}
function ringHit() { const r = $('#sc-ring'); r.classList.remove('hit'); void r.offsetWidth; r.classList.add('hit'); }
function side(s) { $('#sc-side-r').classList.toggle('on', s === 'R'); $('#sc-side-l').classList.toggle('on', s === 'L'); }
function row(html) { $('#sc-row').innerHTML = html; }
function steps() {
  return '<div class="sc-steps">' + PLAN.map((k, i) => '<i class="' + (i < S.step ? 'done' : i === S.step ? 'on' : '') + '"></i>').join('') + '</div>';
}
function progressRow() {
  row(steps() + '<span class="sc-score">' + L(T.progress) + ': ' + num(Math.min(S.step, PLAN.length)) + ' / ' + num(PLAN.length) + '</span>');
}

// ── screens ──
function showIntro() {
  S.phase = 'intro';
  $('#sc-intro').hidden = false;
  $('#sc-intro').innerHTML = '<div><h1>' + L(T.introH) + '</h1><p>' + L(T.introP) + '</p><ul>' +
    T.introL.map((x) => '<li>' + L(x) + '</li>').join('') + '</ul><p style="margin-top:14px;font-size:13px">' + L(T.privacy) + '</p></div>';
  $('#sc-who').textContent = L(T.who);
  say(T.hello, false);
  row('<span></span><button class="sc-btn" id="sc-start">' + L(T.start) + '</button>');
  $('#sc-start').onclick = begin;
}

async function begin() {
  S._slow = false;
  bgPlay();
  music.unlock(); music.preload();
  try { speechSynthesis && speechSynthesis.getVoices(); } catch (e) {}
  $('#sc-intro').hidden = true;
  const ld = $('#sc-loading'); ld.textContent = L(T.loading); ld.classList.add('on');
  say(T.loading, false); row('');
  try { await startCamera(); } catch (e) { bgStop(); ld.classList.remove('on'); return fail(T.noCam); }
  try { await loadModel(); } catch (e) { console.warn(e); ld.classList.remove('on'); return fail(S._slow ? T.slow : T.noModel); }
  ld.classList.remove('on');
  S._lastMsg = null; S.lastWarn = performance.now();
  S.phase = 'setup'; S.calibN = 0; S.calibSum = 0; S.okN = 0; S.standN = 0; S.sitN = 0; S.standing = false;
  guide(true, false);
  say(T.sit);
  loop();
}
function guide() {}   // no on-screen figure: the coach guides with words only
function checks() { if (S._chk !== '') { S._chk = ''; row(''); } }
function fail(o) {
  bgStop(); say(o);
  row('<span></span><button class="sc-btn" id="sc-retry">' + L(T.retry) + '</button>');
  $('#sc-retry').onclick = () => { stopCamera(); showIntro(); };
}

async function startCamera() {
  if (SIM) { fitCanvas(640, 480); return; }
  const st = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 }, frameRate: { ideal: 30, max: 30 } }, audio: false });
  video.srcObject = st; await video.play();
  fitCanvas(video.videoWidth || 640, video.videoHeight || 480);
}
function stopCamera() { try { video.srcObject && video.srcObject.getTracks().forEach((t) => t.stop()); } catch (e) {} video.srcObject = null; }
// ── background Samri: an audio file played very quietly, only while the camera is on ──
// put the recording next to this file as samri-bg.mp3; if the file is not there, nothing plays
const BG_FILE = 'samri-bg.mp3', BG_VOL = 0.12;   // volume 0–1
let bg = null;
function loadBG() {
  if (SIM || bg) return;
  bg = new Audio(); bg.src = BG_FILE; bg.loop = true; bg.preload = 'auto'; bg.volume = BG_VOL;
  bg.setAttribute('playsinline', ''); bg.onerror = () => { bg.dataset.missing = '1'; };
}
function bgPlay() {
  loadBG(); if (!bg || bg.dataset.missing) return;
  bg.volume = BG_VOL; const p = bg.play(); if (p && p.catch) p.catch(() => {});
}
function bgStop() { if (!bg) return; try { bg.pause(); bg.currentTime = 0; } catch (e) {} }

// the model is fetched once, in the background, as soon as the coach opens, so «start» is quick
let modelP = null, mpFiles = null, mpVision = null, delegate = 'GPU';
const mpOpts = (d) => ({ baseOptions: { modelAssetPath: MODEL, delegate: d }, runningMode: 'VIDEO', numPoses: 1 });
function prepareModel() {
  if (SIM || landmarker) return Promise.resolve();
  if (modelP) return modelP;
  modelP = (async () => {
    mpVision = await import(MP + '/vision_bundle.mjs');
    mpFiles = await mpVision.FilesetResolver.forVisionTasks(MP + '/wasm');
    try { landmarker = await mpVision.PoseLandmarker.createFromOptions(mpFiles, mpOpts('GPU')); delegate = 'GPU'; }
    catch (e) { landmarker = await mpVision.PoseLandmarker.createFromOptions(mpFiles, mpOpts('CPU')); delegate = 'CPU'; }
  })();
  modelP.catch(() => { modelP = null; });
  return modelP;
}
async function loadModel() {
  if (SIM) return;
  let to;
  const timeout = new Promise((_, rej) => { to = setTimeout(() => rej(new Error('timeout')), 30000); });
  try { await Promise.race([prepareModel(), timeout]); } catch (e) { if (e && e.message === 'timeout') { S._slow = true; } throw e; } finally { clearTimeout(to); }
  // one detection now, while the loading note is up, so the first frames of the lesson do not stall
  try { if (video.readyState >= 2) landmarker.detectForVideo(video, performance.now()); } catch (e) {}
}
// if the graphics delegate fails mid-way, switch to the processor once instead of freezing
async function fallbackCPU() {
  if (delegate === 'CPU' || !mpVision || S._switching) return;
  S._switching = true;
  try { const old = landmarker; landmarker = null; try { old && old.close(); } catch (e) {} landmarker = await mpVision.PoseLandmarker.createFromOptions(mpFiles, mpOpts('CPU')); delegate = 'CPU'; }
  catch (e) { console.warn('Samri coach: CPU fallback failed', e); }
  S._switching = false;
}
function fitCanvas(w, h) { canvas.width = w; canvas.height = h; canvas.style.objectFit = 'cover'; }

// ── reading the body ──
let lastDetect = 0, lastStamp = 0, detectErrs = 0;
const DETECT_EVERY = 33;                  // ms: about 30 readings a second is plenty, and keeps the phone cool
function detect() {
  if (SIM) return simPose();
  const now = performance.now();
  if (!landmarker || video.readyState < 2 || video.currentTime === lastVideoTime || now - lastDetect < DETECT_EVERY) return lastLm;
  lastVideoTime = video.currentTime; lastDetect = now;
  try {
    const stamp = Math.max(now, lastStamp + 1); lastStamp = stamp;   // the model needs rising timestamps
    const r = landmarker.detectForVideo(video, stamp);
    lastLm = r && r.landmarks && r.landmarks[0] ? r.landmarks[0] : null; detectErrs = 0;
  } catch (e) {
    if (++detectErrs > 3) { detectErrs = 0; fallbackCPU(); }
  }
  return lastLm;
}
const vis = (p) => p && (p.visibility == null || p.visibility > 0.5);
function body(lm) {
  if (!lm) return null;
  const n = lm[0], ls = lm[11], rs = lm[12], lw = lm[15], rw = lm[16];
  if (!vis(ls) || !vis(rs)) return null;
  const w = Math.hypot(rs.x - ls.x, rs.y - ls.y); if (w < 0.04) return null;
  const ux = (rs.x - ls.x) / w, uy = (rs.y - ls.y) / w, mx = (ls.x + rs.x) / 2, my = (ls.y + rs.y) / 2;
  // + when the player leans toward their own right: the head moves to the right shoulder's side,
  // and the right shoulder drops
  const head = vis(n) ? ((n.x - mx) * ux + (n.y - my) * uy) / w : 0;
  const tilt = (rs.y - ls.y) / w;
  const wv = (p) => p && (p.visibility == null || p.visibility > 0.3);
  const hands = wv(lw) && wv(rw) ? Math.hypot(lw.x - rw.x, lw.y - rw.y) / w : null;
  let stand = null;
  const lh = lm[23], rh = lm[24], lk = lm[25], rk = lm[26], on = (p) => p && p.visibility > 0.65 && p.y < 0.98;
  if (on(lh) && on(rh) && on(lk) && on(rk)) {
    const AR = (canvas.width || 4) / (canvas.height || 3), wpx = w * Math.max(1, AR);
    stand = ((lk.y - lh.y) + (rk.y - rh.y)) / 2 / wpx > 0.85;
  }
  return { lean: 0.6 * head + 0.9 * tilt, hands, stand };
}
// standing or seated, smoothed so one bad frame does not flip it
function posture(bd) {
  if (!bd || bd.stand == null) { S.standN = Math.max(0, S.standN - 1); }
  else if (bd.stand) { S.standN = Math.min(30, S.standN + 1); S.sitN = 0; }
  else { S.sitN++; S.standN = Math.max(0, S.standN - 2); }
  if (!S.standing && S.standN >= 15) S.standing = true;
  else if (S.standing && S.standN === 0) S.standing = false;
  return S.standing;
}

// ── the lesson: the coach waits for each move, then says right or wrong ──
const LEAN_OK = 0.12, LEAN_SMALL = 0.05;   // how far the lean must go (shoulder widths, after calibration)
function startLesson() {
  S.lesson = 0; S.step = 0; S.mistakes = 0; S.phase = 'intro-say'; side(null);
  $('#sc-ring').hidden = false; $('#sc-count').textContent = '';
  progressRow();
  say(T.play.say);
  const wait = Math.min(14, 2.5 + L(T.play.say).length * 0.085);   // time to hear it and read it
  setTimeout(() => { if (S.phase === 'intro-say') nextStep(); }, wait * 1000);
}
function nextStep() {
  if (S.step >= PLAN.length) return finish();
  const t = PLAN[S.step];
  S.phase = 'lesson'; S.stepAt = performance.now(); S.crossing = S.step > 0; S.clapAt = 0; S.leanOkAt = 0; S.holdN = 0; S.oppN = 0; S.stepMiss = false; S.hinted = false; S.repeated = false;
  side(t); $('#sc-count').textContent = t === 'R' ? L(T.right) : L(T.left);
  progressRow(); say(T.step[t]);
}
function lessonDone() { finish(); }
function nextLesson() { finish(); }
function finish() {
  S.phase = 'done'; side(null); $('#sc-ring').hidden = true; $('#sc-ring').classList.remove('lean');
  const stars = S.mistakes <= 1 ? 3 : S.mistakes <= 4 ? 2 : 1;
  try {
    const all = JSON.parse(localStorage.getItem('cl_progress') || '{}'), prev = all.samriCoach || {};
    all.samriCoach = { stars: Math.max(stars, prev.stars || 0), last: stars, at: new Date().toISOString() };
    localStorage.setItem('cl_progress', JSON.stringify(all));
  } catch (e) {}
  say(T.play.done);
  row('<div style="width:100%"><div class="sc-stars">' + [0, 1, 2].map((i) => '<span class="' + (i < stars ? '' : 'off') + '">★</span>').join('') +
    '</div><div class="sc-row" style="justify-content:center"><button class="sc-btn" id="sc-again">' + L(T.again) +
    '</button><button class="sc-btn ghost" id="sc-back">' + L(T.back) + '</button></div></div>');
  $('#sc-back').onclick = close;
  $('#sc-again').onclick = () => startLesson();
}
function miss(o) {
  const now = performance.now();
  if (now - S.lastJudge < 3000) return;       // one correction at a time
  S.lastJudge = now; if (!S.stepMiss) { S.stepMiss = true; S.mistakes++; }
  judge(o, 'bad');
}
// every frame: follow the lean and wait for the clap
function follow(clapped) {
  if (S.phase !== 'lesson') return;
  const t = PLAN[S.step], sign = t === 'R' ? 1 : -1, v = S.leanS * sign, now = performance.now();
  // moving across from the last side takes a moment: until the player has passed the middle (or 3 s have gone by),
  // still leaning the old way is not a mistake
  if (S.crossing && (Math.abs(S.leanS) < LEAN_OK * 0.6 || now - S.stepAt > 3000)) S.crossing = false;
  if (v >= LEAN_OK) { S.holdN++; S.oppN = 0; } else if (v <= -LEAN_OK) { if (!S.crossing) S.oppN++; S.holdN = 0; } else { S.holdN = 0; S.oppN = 0; }
  const leaning = S.holdN >= 5;                // held for a moment, not a passing wobble
  if (leaning && S.stepMiss && S.holdN === 5) $('#sc-msg').textContent = L(T.nowClap);   // corrected: show the next thing to do
  if (leaning) S.leanOkAt = now;
  $('#sc-ring').classList.toggle('lean', leaning);
  // a clap is judged with a little give: right if the lean was there just before it, or arrives just after it
  if (clapped) S.clapAt = now;
  if (S.clapAt && (leaning || now - S.clapAt > 450 || now - (S.leanOkAt || 0) < 400)) {
    const okLean = leaning || now - (S.leanOkAt || 0) < 400 + (now - S.clapAt);
    S.clapAt = 0;
    if (okLean) {
      S.phase = 'pause'; S.lastJudge = now; $('#sc-ring').classList.remove('lean'); ringHit();
      judge(T.good[S.step % T.good.length], 'ok');
      S.step++; progressRow();
      setTimeout(() => { if (S.phase === 'pause') nextStep(); }, 3000);
    } else if (S.crossing || now - S.stepAt < 1200) { /* still on the way over: not judged */ }
    else if (v <= -LEAN_OK * 0.8) miss({ en: T.wrongSide.en[t], ar: T.wrongSide.ar[t] });
    else if (v >= LEAN_SMALL) miss(T.smallLean);
    else miss(T.noLean);
    return;
  }
  if (S.clapAt) return;                         // waiting a moment to judge the clap
  if (S.oppN === 30) miss({ en: T.wrongSide.en[t], ar: T.wrongSide.ar[t] });   // half a second on the wrong side
  if (leaning && !S.hinted && S.holdN > 90) { S.hinted = true; say(T.nowClap); }   // leaning well for 2.5 s, no clap yet
  if (!S.repeated && now - S.stepAt > 12000 && now - S.lastJudge > 5000) { S.repeated = true; say(T.step[t]); }
}

// ── the frame loop ──
function loop() {
  cancelAnimationFrame(raf);
  const step = () => {
    raf = requestAnimationFrame(step);
    const lm = detect(), bd = body(lm);
    draw(lm, bd);
    const standing = posture(bd);
    if (S.phase === 'setup' || S.phase === 'calib') {
      checks(bd);
      const okNow = !!bd && bd.hands != null && !standing;
      guide(true, okNow);
      const now = performance.now();
      if (!okNow) {
        S.okN = 0; S.calibN = 0; S.calibSum = 0;
        const msg = !bd ? T.notSeen : standing ? T.standing : T.noHands;
        if (S.phase === 'calib') { S.phase = 'setup'; }
        if (S._lastMsg !== msg && now - S.lastWarn > 4000) { say(msg); S._lastMsg = msg; S.lastWarn = now; }
        return;
      }
      if (S.phase === 'setup') { if (++S.okN > 20 && now - S.lastWarn > 4500) { S.phase = 'calib'; S._lastMsg = T.calib; S.calibAt = now; say(T.calib); } return; }
      S.calibSum += bd.lean; S.calibN++;
      if (S.calibN > 45 && now - (S.calibAt || 0) > 3500) {
        S.base = S.calibSum / S.calibN; S.phase = 'ready'; guide(false); say(T.ready);
        setTimeout(() => { if (S.phase === 'ready') startLesson(); }, 3000);
      }
      return;
    }
    // standing up in the middle of a lesson: nothing is judged until the player sits again
    if (S.phase === 'lesson' && standing) {
      if (performance.now() - S.lastWarn > 4000) { say(T.standPause); S.lastWarn = performance.now(); }
      S.wrist = 'open'; S.holdN = 0; S.oppN = 0; $('#sc-ring').classList.remove('lean'); return;
    }
    const raw = bd ? bd.lean - (S.base || 0) : null;
    if (raw != null) S.leanS += (raw - S.leanS) * 0.4;            // smoothed, so one shaky frame does not count
    S.lean = raw;
    let clapped = false;
    if (bd && bd.hands != null) {
      // a clap: the hands come together after being apart (not twice within 0.3 s)
      if (S.wrist === 'open' && bd.hands < 0.42) { S.wrist = 'closed'; const n = performance.now(); if (n - S.lastClap > 300) { S.lastClap = n; clapped = true; } }
      else if (S.wrist === 'closed' && bd.hands > 0.75) S.wrist = 'open';
    }
    follow(clapped);
  };
  step();
}
function draw() { ctx.clearRect(0, 0, canvas.width, canvas.height); }   // only the camera is shown, no drawn figure

// ── a simulated player, for testing without a camera (?sim=1): mostly right, sometimes off ──
function simPose() {
  // leans the asked way after a second (a quarter of the time the wrong way first), then claps
  const now = performance.now(), t = S.phase === 'lesson' ? PLAN[S.step] : null, dt = (now - S.stepAt) / 1000;
  S._simWrong = S._simWrong || {};
  if (t && S._simWrong[S.step] == null) S._simWrong[S.step] = !window.__simClean && Math.random() < 0.25;
  let lean = 0, hands = 1.2;
  if (t) {
    const sgn = t === 'R' ? 1 : -1, wrongFirst = S._simWrong[S.step];
    if (wrongFirst && dt > 0.8 && dt < 1.9) lean = -sgn * 0.3;
    if (S.step > 0 && dt < 1.6) lean = -sgn * 0.3 * Math.min(1, (1.6 - dt) / 0.8);   // still leaning from the last move
    const go = wrongFirst ? 2.4 : 1.0;
    if (dt > go) lean = sgn * Math.min(0.3, (dt - go) * 0.8);
    const clapAt = go + 1.0;
    if ((dt > clapAt && dt < clapAt + 0.15) || (wrongFirst && dt > 1.4 && dt < 1.55)) hands = 0.2;
  }
  const lm = []; for (let i = 0; i < 33; i++) lm.push({ x: 0.5, y: 0.5, visibility: 0 });
  const cx = 0.5, cy = 0.5, hw = 0.12, tilt = lean * 0.9;
  lm[12] = { x: cx - hw, y: cy + tilt * hw, visibility: 1 }; lm[11] = { x: cx + hw, y: cy - tilt * hw, visibility: 1 };
  lm[0] = { x: cx - lean * 0.12, y: cy - 0.18, visibility: 1 };
  lm[24] = { x: cx - 0.09, y: cy + 0.35, visibility: 1 }; lm[23] = { x: cx + 0.09, y: cy + 0.35, visibility: 1 };
  const sp = hands * hw;
  lm[16] = { x: cx - sp, y: cy + 0.12, visibility: 1 }; lm[15] = { x: cx + sp, y: cy + 0.12, visibility: 1 };
  lm[14] = { x: cx - hw * 1.3, y: cy + 0.15, visibility: 1 }; lm[13] = { x: cx + hw * 1.3, y: cy + 0.15, visibility: 1 };
  // knees: just in front of the hips when seated, far below them when standing (?sim=1 with window.__simStand = true)
  if (window.__simStand) { lm[24].y = lm[23].y = cy + 0.05; }
  const ky = window.__simStand ? cy + 0.45 : cy + 0.4;
  lm[26] = { x: cx - 0.1, y: ky, visibility: 0.9 }; lm[25] = { x: cx + 0.1, y: ky, visibility: 0.9 };
  return lm;
}

// ── start ──
// open and close the coach over the Samri page; the page's own sound pauses while the coach runs
function mainCtx() { const m = window.__sm && window.__sm.music; return m && m.ctx ? m.ctx : null; }
function labels() {
  entry.innerHTML = '<span>' + L(T.entry) + '</span><i>AI</i>';
  $('#sc-lang').textContent = isAr() ? 'English' : 'العربية';
}
function open() {
  ov.classList.add('open'); entry.classList.remove('show');
  const c = mainCtx(); S._mainWasRunning = !!(c && c.state === 'running'); if (c) { try { c.suspend(); } catch (e) {} }
  labels(); showIntro();
  prepareModel().catch(() => {});
  loadBG();
}
function close() {
  cancelAnimationFrame(raf); music.stop(); stopCamera(); bgStop(); side(null);
  try { speechSynthesis.cancel(); } catch (e) {}
  S.phase = 'intro'; S.lesson = -1; $('#sc-ring').hidden = true; $('#sc-loading').classList.remove('on'); guide(false); S._chk = null;
  ov.classList.remove('open');
  const c = mainCtx(); if (c && S._mainWasRunning) { try { c.resume(); } catch (e) {} }
}
entry.addEventListener('click', open);
$('#sc-close').addEventListener('click', close);
$('#sc-lang').addEventListener('click', () => { if (typeof toggleLanguage === 'function') toggleLanguage(); });
// the button shows in part 3 (the game), when no round is being played
setInterval(() => {
  const inGame = (location.hash || '') === '#play' && !document.body.classList.contains('sm-playing') && document.body.classList.contains('mq-ready');
  entry.classList.toggle('show', inGame && !ov.classList.contains('open'));
}, 400);
document.addEventListener('languageChanged', () => {
  labels();
  if (!ov.classList.contains('open')) return;
  if (S.phase === 'intro') showIntro(); else if (S.phase === 'lesson') progressRow();
});
if ('speechSynthesis' in window) speechSynthesis.onvoiceschanged = () => {};
labels();
if (SIM && /[?&]coach=1/.test(location.search)) open();
window.__coach = { S, music, open, close };
