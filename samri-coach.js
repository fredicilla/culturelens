/**
 * samri-coach.js — «الراوي», an AI coach for the Samri.
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
 * Add ?sim=1 to the address to run it with a simulated player (for testing without a camera).
 */
import { Music } from './samri-music.js';

const MP = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14';
const MODEL = 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task';
const SIM = /[?&]sim=1/.test(location.search);
const CAM_LAG = 0.09;                     // seconds between a move and the frame that shows it

const $ = (s) => document.querySelector(s);
const isAr = () => window.currentLang === 'ar';
const L = (o) => (o == null ? '' : typeof o === 'string' ? o : isAr() ? o.ar : o.en);
const num = (n) => (isAr() ? String(n).replace(/\d/g, (d) => '٠١٢٣٤٥٦٧٨٩'[d]) : String(n));

const T = {
  who: { en: 'Al-Rawi · your Samri coach', ar: 'الراوي · مدرّبك في السامري' },
  introH: { en: 'Try the Samri with your body', ar: 'جرّب السامري بجسمك' },
  introP: { en: 'Al-Rawi watches you through the front camera and coaches you live: he tells you each move and whether you got it right.', ar: 'الراوي يشوفك من الكاميرا الأمامية ويدرّبك مباشرة: يقولك الحركة، ويقولك إذا طريقتك صحيحة أو لا.' },
  introL: [
    { en: '1 · Clap with the drum', ar: '١ · صفّق مع الطار' },
    { en: '2 · Sway right and left', ar: '٢ · تمايل يمين ويسار' },
    { en: '3 · A full Samri round', ar: '٣ · جولة سامري كاملة' }
  ],
  privacy: { en: 'The video stays on your phone. Sit or stand so your head, shoulders and hands are in view.', ar: 'الفيديو ما يطلع من جوالك. اجلس أو اوقف بحيث يبان راسك وكتوفك ويدينك.' },
  start: { en: 'Start with the camera', ar: 'ابدأ بالكاميرا' },
  hello: { en: 'Hello! Tap start and allow the camera.', ar: 'هلا والله! اضغط «ابدأ» واسمح للكاميرا.' },
  loading: { en: 'Waking up the AI…', ar: 'نجهّز الذكاء الاصطناعي…' },
  noCam: { en: 'I could not open the camera. Allow camera access in your browser, then try again.', ar: 'ما قدرت أفتح الكاميرا. اسمح للمتصفح يستخدم الكاميرا وجرّب مرة ثانية.' },
  noModel: { en: 'The AI model did not load. Check your internet connection and try again.', ar: 'نموذج الذكاء الاصطناعي ما تحمّل. تأكد من الإنترنت وجرّب مرة ثانية.' },
  retry: { en: 'Try again', ar: 'جرّب مرة ثانية' },
  calib: { en: 'Sit straight and look at the camera… I am learning where you are.', ar: 'اجلس معتدل وطالع الكاميرا… أتعرّف على مكانك.' },
  notSeen: { en: 'I cannot see your shoulders and hands. Step back a little.', ar: 'ما أشوف كتوفك ويدينك. ارجع لورا شوي.' },
  ready: { en: 'I can see you. Let us begin!', ar: 'شايفك زين. يلا نبدأ!' },
  listen: { en: 'Listen to the first round…', ar: 'اسمع أول دورة…' },
  go: { en: 'Now you!', ar: 'دورك الحين!' },
  lessons: {
    clap: {
      name: { en: 'Clap with the drum', ar: 'صفّق مع الطار' },
      say: { en: 'In the heavy Samri of Unaizah, each round opens with one stroke on its own. Clap exactly on that stroke, in front of your chest.', ar: 'في سامري عنيزة الثقيل، كل دورة تبدأ بضربة لحالها. صفّق مع هالضربة بالضبط، قدّام صدرك.' },
      done: { en: 'Your clap is on the beat. Now the sway.', ar: 'تصفيقك مضبوط على الإيقاع. الحين التمايل.' }
    },
    sway: {
      name: { en: 'Sway right and left', ar: 'تمايل يمين ويسار' },
      say: { en: 'The other row sways: lean toward your right neighbour for one round, then your left. Follow the arrow.', ar: 'الصف الثاني يتمايل: مِل على جارك اللي يمينك دورة كاملة، وبعدين اللي يسارك. تابع السهم.' },
      done: { en: 'Beautiful sway. Now the whole Samri!', ar: 'تمايلك جميل. الحين السامري كامل!' }
    },
    full: {
      name: { en: 'A full Samri round', ar: 'جولة سامري كاملة' },
      say: { en: 'Now like the rows: two rounds of clapping, then sway right and left. I will tell you each move.', ar: 'الحين مثل الصفوف: دورتين تصفيق، وبعدها تمايل يمين ويسار. أنا أقولك كل حركة.' },
      done: { en: 'That is the Samri! Well done.', ar: 'هذا هو السامري! كفو عليك.' }
    }
  },
  ok: { en: 'On the beat!', ar: 'مضبوط!' },
  early: { en: 'A bit early', ar: 'بدري شوي' },
  late: { en: 'A bit late', ar: 'متأخر شوي' },
  miss: { en: 'Missed it', ar: 'فاتتك' },
  extra: { en: 'Wait for the stroke', ar: 'استنّ الضربة' },
  right: { en: 'Right', ar: 'يمين' }, left: { en: 'Left', ar: 'يسار' },
  clapNow: { en: 'Clap', ar: 'صفّق' },
  swayOk: { en: 'Right way!', ar: 'طريقتك صحيحة!' },
  swayWrong: { en: 'Wrong side', ar: 'عكس الجهة' },
  swaySmall: { en: 'Lean more', ar: 'مِل أكثر' },
  tips: {
    early: { en: 'You are clapping before the stroke. Listen for it, and clap with it, not ahead of it.', ar: 'تصفّق قبل الضربة. اسمعها أول، وصفّق معها مو قبلها.' },
    late: { en: 'You are a little behind. Get your hands ready just before the stroke.', ar: 'متأخر شوي. جهّز يدينك قبل الضربة بلحظة.' },
    miss: { en: 'I did not see a clap. Bring your hands together in front of your chest, then open them between strokes.', ar: 'ما شفت تصفيق. قرّب يدينك قدّام صدرك، وافتحها بين الضربات.' },
    small: { en: 'Lean your whole upper body, so your head goes over your neighbour\'s shoulder.', ar: 'مِل بجسمك كله، كأن راسك يروح فوق كتف جارك.' },
    wrong: { en: 'Your right is the arrow\'s side. The screen works like a mirror.', ar: 'يمينك هي جهة السهم. الشاشة مثل المراية.' },
    easier: { en: 'I am making it a little easier for you: I will accept a bit more off the beat.', ar: 'بسهّلها عليك شوي: بقبل لو كنت بعيد عن الضربة شوي.' }
  },
  progress: { en: 'Good moves', ar: 'حركات صحيحة' },
  score: { en: 'Your Samri', ar: 'نتيجتك' },
  again: { en: 'Play again', ar: 'العب مرة ثانية' },
  back: { en: 'Back to the Samri', ar: 'رجوع للسامري' },
  skip: { en: 'Skip', ar: 'تخطّي' }
};

// ── state ──
const S = {
  phase: 'intro', lesson: -1, tol: 0.2, voice: null,
  base: null, calibN: 0, calibSum: 0, seenAt: 0,
  wrist: 'open', claps: [], judged: {}, startBeat: 0,
  good: 0, need: 0, streakBad: 0, lastBad: null, badCount: {}, tries: 0,
  cyc: -1, leanSamples: [], score: 0, maxScore: 0, ended: false
};
const LESSONS = ['clap', 'sway', 'full'];
const NEED = { clap: 5, sway: 4 };
const FULL_PLAN = ['clap', 'clap', 'R', 'L', 'clap', 'clap', 'R', 'L'];
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
function judge(o, kind) {
  const el = $('#sc-judge'); el.textContent = L(o); el.className = 'sc-judge show ' + kind;
  clearTimeout(judgeTimer); judgeTimer = setTimeout(() => el.classList.remove('show'), 900);
}
function ringHit() { const r = $('#sc-ring'); r.classList.remove('hit'); void r.offsetWidth; r.classList.add('hit'); }
function side(s) { $('#sc-side-r').classList.toggle('on', s === 'R'); $('#sc-side-l').classList.toggle('on', s === 'L'); }
function row(html) { $('#sc-row').innerHTML = html; }
function steps() {
  return '<div class="sc-steps">' + LESSONS.map((k, i) => '<i class="' + (i < S.lesson ? 'done' : i === S.lesson ? 'on' : '') + '"></i>').join('') + '</div>';
}
function progressRow() {
  const k = LESSONS[S.lesson];
  const txt = k === 'full' ? L(T.score) + ': ' + num(Math.round(S.score * 10) / 10) + ' / ' + num(S.maxScore)
    : L(T.progress) + ': ' + num(S.good) + ' / ' + num(S.need);
  row(steps() + '<span class="sc-score">' + txt + '</span><button class="sc-btn ghost" id="sc-skip">' + L(T.skip) + '</button>');
  $('#sc-skip').onclick = () => nextLesson();
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
  music.unlock(); music.preload();
  try { speechSynthesis && speechSynthesis.getVoices(); } catch (e) {}
  $('#sc-intro').hidden = true;
  const ld = $('#sc-loading'); ld.textContent = L(T.loading); ld.classList.add('on');
  say(T.loading, false); row('');
  try { await startCamera(); } catch (e) { ld.classList.remove('on'); return fail(T.noCam); }
  try { await loadModel(); } catch (e) { console.warn(e); ld.classList.remove('on'); return fail(T.noModel); }
  ld.classList.remove('on');
  S.phase = 'calib'; S.calibN = 0; S.calibSum = 0;
  say(T.calib);
  loop();
}
function fail(o) {
  say(o);
  row('<span></span><button class="sc-btn" id="sc-retry">' + L(T.retry) + '</button>');
  $('#sc-retry').onclick = () => { stopCamera(); showIntro(); };
}

async function startCamera() {
  if (SIM) { fitCanvas(640, 480); return; }
  const st = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } }, audio: false });
  video.srcObject = st; await video.play();
  fitCanvas(video.videoWidth || 640, video.videoHeight || 480);
}
function stopCamera() { try { video.srcObject && video.srcObject.getTracks().forEach((t) => t.stop()); } catch (e) {} video.srcObject = null; }
async function loadModel() {
  if (SIM) return;
  const v = await import(MP + '/vision_bundle.mjs');
  const files = await v.FilesetResolver.forVisionTasks(MP + '/wasm');
  const opts = (d) => ({ baseOptions: { modelAssetPath: MODEL, delegate: d }, runningMode: 'VIDEO', numPoses: 1 });
  try { landmarker = await v.PoseLandmarker.createFromOptions(files, opts('GPU')); }
  catch (e) { landmarker = await v.PoseLandmarker.createFromOptions(files, opts('CPU')); }
}
function fitCanvas(w, h) { canvas.width = w; canvas.height = h; canvas.style.objectFit = 'cover'; }

// ── reading the body ──
function detect() {
  if (SIM) return simPose();
  if (!landmarker || video.readyState < 2 || video.currentTime === lastVideoTime) return lastLm;
  lastVideoTime = video.currentTime;
  const r = landmarker.detectForVideo(video, performance.now());
  lastLm = r && r.landmarks && r.landmarks[0] ? r.landmarks[0] : null;
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
  const hands = vis(lw) && vis(rw) ? Math.hypot(lw.x - rw.x, lw.y - rw.y) / w : null;
  return { lean: 0.6 * head + 0.9 * tilt, hands };
}

// ── the lessons ──
function startLesson(i) {
  S.lesson = i; const k = LESSONS[i];
  S.good = 0; S.need = NEED[k] || 0; S.streakBad = 0; S.lastBad = null; S.badCount = {}; S.tries = 0;
  S.judged = {}; S.claps = []; S.cyc = -1; S.leanSamples = []; S.score = 0; S.maxScore = k === 'full' ? FULL_PLAN.length : 0;
  S.phase = 'lesson'; side(null);
  say(T.lessons[k].say);
  progressRow();
  // one listening round, then the player's turn
  const delay = Math.min(6, 1.2 + L(T.lessons[k].say).length * 0.055);
  music.drums = true; music.claps = false; music.drumVol = 1;
  music.start('heavy', delay);
  S.startBeat = 2;
  $('#sc-ring').hidden = false;
  setTimeout(() => { if (S.phase === 'lesson' && LESSONS[S.lesson] === k) $('#sc-msg').textContent = L(T.listen); }, delay * 1000);
}
function nextLesson() {
  music.stop(); side(null);
  if (S.lesson + 1 < LESSONS.length) startLesson(S.lesson + 1); else finish();
}
function lessonDone() {
  const k = LESSONS[S.lesson];
  music.stop(); side(null); $('#sc-count').textContent = '';
  S.phase = 'between'; say(T.lessons[k].done);
  setTimeout(() => { if (S.phase === 'between') nextLesson(); }, 3800);
}
function finish() {
  S.phase = 'done'; music.stop(); side(null); $('#sc-ring').hidden = true;
  const pct = S.maxScore ? S.score / S.maxScore : 0, stars = pct >= 0.85 ? 3 : pct >= 0.6 ? 2 : 1;
  try {
    const all = JSON.parse(localStorage.getItem('cl_progress') || '{}'), prev = all.samriCoach || {};
    all.samriCoach = { stars: Math.max(stars, prev.stars || 0), last: stars, at: new Date().toISOString() };
    localStorage.setItem('cl_progress', JSON.stringify(all));
  } catch (e) {}
  say(T.lessons.full.done);
  row('<div style="width:100%"><div class="sc-stars">' + [0, 1, 2].map((i) => '<span class="' + (i < stars ? '' : 'off') + '">★</span>').join('') +
    '</div><div class="sc-row" style="justify-content:center"><button class="sc-btn" id="sc-again">' + L(T.again) +
    '</button><a class="sc-btn ghost" href="samri.html#play" style="text-decoration:none">' + L(T.back) + '</a></div></div>');
  $('#sc-again').onclick = () => startLesson(0);
}

// what the current round asks for
function want(cycle) {
  const k = LESSONS[S.lesson];
  if (k === 'clap') return 'clap';
  if (k === 'sway') return cycle % 2 === 0 ? 'R' : 'L';
  return FULL_PLAN[cycle] || null;
}

// a mistake: the coach counts it, and when the same one repeats it gives a tip or eases the judging
function bad(kind) {
  S.streakBad++; S.badCount[kind] = (S.badCount[kind] || 0) + 1; S.lastBad = kind;
  if (S.streakBad === 3 || S.badCount[kind] === 4) {
    const tip = { early: 'early', late: 'late', miss: 'miss', small: 'small', wrong: 'wrong' }[kind];
    if (tip) say(T.tips[tip]);
  }
  if (S.streakBad === 6 && S.tol < 0.3) { S.tol = 0.3; say(T.tips.easier); }
}
function good() { S.streakBad = 0; S.good++; }

function onClap(t) {
  if (S.phase !== 'lesson') return;
  const b = music.beatAt(t - CAM_LAG), spb = 60 / 48;
  if (b < S.startBeat - 0.3) return;
  const cycle = Math.round(b / 2) - 1, target = (cycle + 1) * 2;
  const d = (b - target) * spb;
  if (want(cycle) !== 'clap' || Math.abs(d) > 0.5 || S.judged[target]) { judge(T.extra, 'near'); return; }
  S.judged[target] = true;
  const k = LESSONS[S.lesson];
  if (Math.abs(d) <= S.tol) { judge(T.ok, 'ok'); good(); if (k === 'full') S.score += 1; }
  else { judge(d < 0 ? T.early : T.late, 'near'); if (k === 'full') S.score += 0.5; bad(d < 0 ? 'early' : 'late'); }
  afterMove();
}
function afterMove() {
  progressRow();
  const k = LESSONS[S.lesson];
  if (k !== 'full' && S.good >= S.need) lessonDone();
}

// each frame: the beat, the misses, the sway rounds
function tick() {
  if (S.phase !== 'lesson' || !music.playing) return;
  const b = music.beat(), spb = 60 / 48;
  const cyc = Math.floor(b / 2) - 1;                    // round 0 starts at beat 2
  const w = cyc >= 0 ? want(cyc) : null;
  // the countdown before the player's first round
  $('#sc-count').textContent = b < S.startBeat ? num(Math.max(1, Math.ceil(S.startBeat - b))) : (w === 'clap' ? L(T.clapNow) : w === 'R' ? L(T.right) : w === 'L' ? L(T.left) : '');
  // the ring flashes on each round's first stroke
  const frac = b / 2 - Math.floor(b / 2);
  if (frac < 0.06 && S._lastFlash !== Math.floor(b / 2)) { S._lastFlash = Math.floor(b / 2); ringHit(); if (Math.floor(b / 2) === 1) $('#sc-msg').textContent = L(T.go); }
  side(w === 'R' || w === 'L' ? w : null);
  // a clap round whose stroke passed with no clap
  for (let c = Math.max(0, cyc - 1); c <= cyc; c++) {
    const target = (c + 1) * 2;
    if (want(c) === 'clap' && !S.judged[target] && (b - target) * spb > 0.55) {
      S.judged[target] = true; judge(T.miss, 'bad'); bad('miss'); afterMove();
    }
  }
  // the sway: gather the lean through the middle of the round, judge it at the end
  if (cyc !== S.cyc) {
    if (S.cyc >= 0) judgeSway(S.cyc);
    S.cyc = cyc; S.leanSamples = [];
  }
  if (w === 'R' || w === 'L') {
    const f = b / 2 - Math.floor(b / 2);
    if (f > 0.2 && f < 0.9 && S.lean != null) S.leanSamples.push(S.lean);
  }
  if (LESSONS[S.lesson] === 'full' && cyc >= FULL_PLAN.length) { judgeSway(S.cyc); S.cyc = 999; lessonDone(); }
}
function judgeSway(c) {
  const w = want(c); if ((w !== 'R' && w !== 'L') || S.judged['s' + c]) return;
  S.judged['s' + c] = true;
  const xs = S.leanSamples; if (!xs.length) { judge(T.miss, 'bad'); bad('miss'); afterMove(); return; }
  const avg = xs.reduce((a, x) => a + x, 0) / xs.length, sign = w === 'R' ? 1 : -1, k = LESSONS[S.lesson];
  const need = S.tol >= 0.3 ? 0.08 : 0.12;
  if (avg * sign >= need) { judge(T.swayOk, 'ok'); good(); if (k === 'full') S.score += 1; }
  else if (avg * sign <= -need) { judge(T.swayWrong, 'bad'); bad('wrong'); }
  else { judge(T.swaySmall, 'near'); if (k === 'full') S.score += 0.3; bad('small'); }
  afterMove();
}

// ── the frame loop ──
function loop() {
  cancelAnimationFrame(raf);
  const step = () => {
    raf = requestAnimationFrame(step);
    const lm = detect(), bd = body(lm);
    draw(lm, bd);
    if (S.phase === 'calib') {
      if (!bd || bd.hands == null) { if (performance.now() - S.seenAt > 2500) { $('#sc-msg').textContent = L(T.notSeen); S.seenAt = performance.now(); } S.calibN = 0; S.calibSum = 0; return; }
      S.calibSum += bd.lean; S.calibN++;
      if (S.calibN > 45) { S.base = S.calibSum / S.calibN; S.phase = 'ready'; say(T.ready); setTimeout(() => startLesson(0), 1800); }
      return;
    }
    S.lean = bd ? bd.lean - (S.base || 0) : null;
    if (bd && bd.hands != null) {
      // a clap: the hands come together after being apart
      if (S.wrist === 'open' && bd.hands < 0.42) { S.wrist = 'closed'; onClap(music.time() - music.latency()); }
      else if (S.wrist === 'closed' && bd.hands > 0.75) S.wrist = 'open';
    }
    tick();
  };
  step();
}
function draw(lm, bd) {
  const W = canvas.width, H = canvas.height; ctx.clearRect(0, 0, W, H);
  if (!lm) return;
  const P = (i) => [lm[i].x * W, lm[i].y * H];
  ctx.lineWidth = Math.max(3, W / 160); ctx.lineCap = 'round'; ctx.strokeStyle = 'rgba(227,196,122,.9)';
  [[11, 12], [11, 13], [13, 15], [12, 14], [14, 16], [11, 23], [12, 24], [23, 24]].forEach(([a, b]) => {
    if (!vis(lm[a]) || !vis(lm[b])) return;
    const p = P(a), q = P(b); ctx.beginPath(); ctx.moveTo(p[0], p[1]); ctx.lineTo(q[0], q[1]); ctx.stroke();
  });
  const closed = S.wrist === 'closed';
  [15, 16].forEach((i) => { if (!vis(lm[i])) return; const p = P(i); ctx.fillStyle = closed ? '#7EE08A' : '#E3C47A'; ctx.beginPath(); ctx.arc(p[0], p[1], W / 45, 0, 7); ctx.fill(); });
  if (vis(lm[0])) { const p = P(0); ctx.strokeStyle = 'rgba(243,238,230,.8)'; ctx.beginPath(); ctx.arc(p[0], p[1], W / 22, 0, 7); ctx.stroke(); }
}

// ── a simulated player, for testing without a camera (?sim=1): mostly right, sometimes off ──
function simPose() {
  const t = music.playing ? music.time() - music.latency() : performance.now() / 1000;
  const b = music.playing ? music.beatAt(t) : 0, cyc = Math.floor(b / 2) - 1;
  const w = S.phase === 'lesson' && cyc >= 0 ? want(cyc) : null;
  S._simErr = S._simErr || {};
  if (S._simErr[cyc] == null) S._simErr[cyc] = (Math.random() - 0.5) * 0.5;
  // the player claps around each round's first stroke, a little off by a random amount
  let hands = 1.2;
  const e = Math.round(b / 2) * 2, c = e / 2 - 1;
  if (S.phase === 'lesson' && c >= 0 && want(c) === 'clap') {
    if (S._simErr[c] == null) S._simErr[c] = (Math.random() - 0.5) * 0.5;
    const tb = e + S._simErr[c] / 1.25;
    if (Math.abs(b - tb) * 1.25 < 0.08) hands = 0.2;
  }
  let lean = 0;
  if (w === 'R' || w === 'L') { const f = b / 2 - Math.floor(b / 2); lean = (w === 'R' ? 1 : -1) * Math.sin(Math.PI * f) * (S._simErr[cyc] > 0.2 ? -0.25 : 0.3); }
  // build landmarks: shoulders tilted by the lean, head shifted, wrists apart or together
  const lm = []; for (let i = 0; i < 33; i++) lm.push({ x: 0.5, y: 0.5, visibility: 0 });
  const cx = 0.5, cy = 0.5, hw = 0.12, tilt = lean * 0.9;
  // person's right shoulder (12) on the image's left
  lm[12] = { x: cx - hw, y: cy + tilt * hw, visibility: 1 }; lm[11] = { x: cx + hw, y: cy - tilt * hw, visibility: 1 };
  lm[0] = { x: cx - lean * 0.12, y: cy - 0.18, visibility: 1 };
  lm[24] = { x: cx - 0.09, y: cy + 0.35, visibility: 1 }; lm[23] = { x: cx + 0.09, y: cy + 0.35, visibility: 1 };
  const sp = hands * hw;
  lm[16] = { x: cx - sp, y: cy + 0.12, visibility: 1 }; lm[15] = { x: cx + sp, y: cy + 0.12, visibility: 1 };
  lm[14] = { x: cx - hw * 1.3, y: cy + 0.15, visibility: 1 }; lm[13] = { x: cx + hw * 1.3, y: cy + 0.15, visibility: 1 };
  return lm;
}

// ── start ──
document.addEventListener('languageChanged', () => {
  if (S.phase === 'intro') showIntro(); else if (S.phase === 'lesson') progressRow();
});
if ('speechSynthesis' in window) speechSynthesis.onvoiceschanged = () => {};
showIntro();
window.__coach = { S, music };
