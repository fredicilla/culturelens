/**
 * masaqeel.js — Al-Masaqil, the marble game of the old Najdi neighborhoods.
 *
 * One live 3D scene carries the whole experience:
 *   1. History (#story)      the camera moves through the alley while the story is told
 *   2. How to play (#how)    draw the square, dig the hole, draw the line, put your marble in, practice
 *   3. Play (#play)          a match against Fahad, the neighbor's son
 *
 * AR: on Android (Chrome) every part runs on your real floor (WebXR). On iPhone,
 * "View in your room" opens the field in AR Quick Look. The rules come from the
 * team's heritage sheet; where the game needs more than the sheet says, the page
 * says so ("in our game").
 */
import { World, K, PALETTE } from './masaqeel-world.js';

// ════════════════════════════════════════════════════════════
// helpers
// ════════════════════════════════════════════════════════════
function $(s, r) { return (r || document).querySelector(s); }
function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
function isAr() { return window.currentLang === 'ar'; }
function L(o) { if (o == null) return ''; if (typeof o === 'string') return o; return isAr() ? (o.ar != null ? o.ar : o.en) : o.en; }
function num(n) { return isAr() ? String(n).replace(/\d/g, function (d) { return '٠١٢٣٤٥٦٧٨٩'[d]; }) : String(n); }
function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
function wait(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

var ICON = {
  close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>',
  back: '<svg class="qx-flip" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 6l-6 6 6 6"/></svg>',
  next: '<svg class="qx-flip" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6"/></svg>',
  cube: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M12 3l8 4.5v9L12 21l-8-4.5v-9z"/><path d="M12 12l8-4.5M12 12v9M12 12L4 7.5"/></svg>',
  eye: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12s3.5-6 9-6 9 6 9 6-3.5 6-9 6-9-6-9-6z"/><circle cx="12" cy="12" r="2.6"/></svg>',
  top: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><rect x="4" y="4" width="16" height="16" rx="2"/><circle cx="12" cy="12" r="2"/><path d="M12 4v3M12 17v3"/></svg>',
  star: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.8l2.8 5.9 6.4.8-4.7 4.4 1.2 6.3L12 17.1l-5.7 3.1 1.2-6.3L2.8 9.5l6.4-.8z"/></svg>',
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
  replay: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12a8 8 0 1 0 2.4-5.7"/><path d="M4 4v4h4"/></svg>',
  soundOn: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9h4l5-4v14l-5-4H4z"/><path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12"/></svg>',
  soundOff: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9h4l5-4v14l-5-4H4z"/><path d="M17 9l5 6M22 9l-5 6"/></svg>'
};

// ════════════════════════════════════════════════════════════
// words
// ════════════════════════════════════════════════════════════
var T = {
  title: { en: 'Al-Masaqil', ar: 'المصاقيل' },
  chapter: { en: 'Chapter', ar: 'الفصل' }, of: { en: 'of', ar: 'من' },
  step: { en: 'Step', ar: 'الخطوة' },
  next: { en: 'Next', ar: 'التالي' }, back: { en: 'Back', ar: 'رجوع' },
  toHow: { en: 'Learn to play', ar: 'تعلّم اللعب' },
  toPlay: { en: 'Start the match', ar: 'ابدأ المباراة' },
  loading: { en: 'Drawing the alley...', ar: 'نجهّز الحارة...' },
  noGL: { en: 'This phone could not draw the 3D scene.', ar: 'هالجهاز ما قدر يرسم المشهد ثلاثي الأبعاد.' },
  ar: { en: 'AR', ar: 'بغرفتك' },
  arQL: { en: 'View in your room', ar: 'شوفها بغرفتك' },
  arExit: { en: 'Exit AR', ar: 'اطلع' },
  arNone: { en: 'Open this page on your phone to play it on your floor.', ar: 'افتح الصفحة من جوالك عشان تلعبها على أرضك.' },
  arOpening: { en: 'Opening AR...', ar: 'نفتح الواقع المعزز...' },
  arFail: { en: 'AR could not start on this phone.', ar: 'الواقع المعزز ما اشتغل على هالجوال.' },
  arScanT: { en: 'Find a spot on the floor', ar: 'دوّر مكان بالأرض' },
  arScanP: { en: 'Point your phone at the floor about two steps away. When the ring sits flat on it, tap Place. The lines show how much room the game needs.', ar: 'وجّه جوالك على الأرض، على بعد خطوتين تقريبًا. لما تشوف الدائرة نايمة على الأرض، اضغط «حطها هنا». الخطوط توضح المساحة اللي تحتاجها اللعبة.' },
  arWait: { en: 'Move your phone slowly so it can see the floor...', ar: 'حرّك جوالك على مهل عشان يشوف الأرض...' },
  arPlace: { en: 'Place it here', ar: 'حطها هنا' },
  arFloor: { en: 'Floor', ar: 'أرض' }, arTable: { en: 'Table', ar: 'طاولة' },
  arMove: { en: 'Move the field', ar: 'انقل الملعب' },
  dragHint: { en: 'Drag to look around', ar: 'اسحب عشان تلف' }
};

var STORY = [
  {
    scene: 'cover', kicker: { en: 'Traditional Games · Najd', ar: 'الألعاب القديمة · نجد' },
    title: { en: 'Al-Masaqil', ar: 'المصاقيل' },
    body: { en: 'A game of the old neighborhoods of Najd. Children played it in the alleys: a square drawn in the sand, a hole, and pockets full of glass marbles.', ar: 'لعبة من حواري نجد القديمة. يلعبونها الصغار بالحواري: مربع مرسوم بالرمل، وحفرة، وجيوب مليانة مصاقيل.' }
  },
  {
    scene: 'macro', title: { en: 'The marbles', ar: 'المصاقيل' },
    body: { en: 'Masaqil are small round marbles made of hard glass. Other places know them by other names, like al-burjun, al-teel and al-ballour.', ar: 'المصاقيل حبيبات كروية صغيرة من الزجاج الصلد. ولها بأماكن ثانية أسماء ثانية، مثل البرجون والتيل والبلور.' },
    hint: T.dragHint
  },
  {
    scene: 'field', title: { en: 'The square and the hole', ar: 'المربع والحفرة' },
    body: { en: 'The players draw a square in the sand with a line and stand about five meters away. Then each one aims his marble at the hole.', ar: 'يرسمون اللاعبين مربع بخط على الرمل، ويوقفون على بعد خمسة أمتار تقريبًا. وبعدين كل واحد يصوّب مصقاله على الحفرة.' }
  },
  {
    scene: 'winner', title: { en: 'The winner takes the hole', ar: 'الفايز ياخذ الحفرة' },
    body: { en: 'The winner takes all the marbles in the hole. It was a game for the neighborhood kids, played in the alleys after school and on long afternoons.', ar: 'الفايز ياخذ كل المصاقيل اللي بالحفرة. وكانت لعبة صغار الحارة، يلعبونها بالحواري.' },
    sources: { en: 'Sources: the CultureLens heritage sheet; Ithra, "The games we played".', ar: 'المصادر: ملف تراث المناطق لفريق عدسة ثقافية؛ ومقال إثراء عن ألعاب الطفولة.' }
  }
];
// the sheet doesn't say "after school and on long afternoons"; keep the English as close to the Arabic as possible
STORY[3].body.en = 'The winner takes all the marbles in the hole. It was a game for the neighborhood kids, played in the alleys.';

var HOW = [
  { key: 'square', view: 'square', act: 'hold',
    title: { en: 'Draw the square', ar: 'ارسم المربع' },
    text: { en: 'The players start by drawing a square in the sand. Hold the button and the stick draws it.', ar: 'أول شي يرسمون اللاعبين مربع بالرمل. اضغط مطوّل والعود يرسمه.' },
    cta: { en: 'Hold to draw', ar: 'اضغط مطوّل وارسم' }, done: { en: 'A square in the sand.', ar: 'مربع بالرمل.' } },
  { key: 'hole', view: 'dig', act: 'taps', taps: 3,
    title: { en: 'Dig the hole', ar: 'احفر الحفرة' },
    text: { en: 'In the middle of the square, a small hole. Tap three times to dig it.', ar: 'بنص المربع حفرة صغيرة. اضغط ثلاث مرات عشان تحفرها.' },
    cta: { en: 'Dig', ar: 'احفر' }, done: { en: 'That is where the marbles go.', ar: 'هنا تروح المصاقيل.' } },
  { key: 'line', view: 'line', act: 'hold',
    title: { en: 'Step back to the line', ar: 'ارجع للخط' },
    text: { en: 'The players stand about five meters away. Here the line is closer, so the game fits in your room. Hold to draw it.', ar: 'اللاعبين يوقفون على بعد خمسة أمتار تقريبًا. وهنا الخط أقرب عشان تكفي اللعبة بغرفتك. اضغط مطوّل وارسمه.' },
    cta: { en: 'Hold to draw the line', ar: 'اضغط مطوّل وارسم الخط' }, done: { en: 'You throw from here.', ar: 'من هنا ترمي.' } },
  { key: 'stake', view: 'hole', act: 'tap',
    title: { en: 'Put a marble in the hole', ar: 'حط مصقال بالحفرة' },
    text: { en: 'In our game, each player starts by putting one marble in the hole. Whoever gets his marble in first takes everything in the hole.', ar: 'بلعبتنا، كل لاعب يبدأ ويحط مصقال بالحفرة. واللي يدخّل مصقاله أول، ياخذ كل اللي بالحفرة.' },
    cta: { en: 'Drop it in', ar: 'حطّه' }, done: { en: 'Fahad put his in too. Two marbles in the hole.', ar: 'وفهد حط مصقاله بعد. مصقالين بالحفرة.' } },
  { key: 'shot', view: 'aim', act: 'aim',
    title: { en: 'Your first shot', ar: 'أول رمية' },
    text: { en: 'Pull back anywhere on the screen to set the strength, move sideways to aim, and let go. The ring shows where it would stop on flat sand.', ar: 'اسحب لورا من أي مكان بالشاشة عشان تحدد القوة، ويمين ويسار عشان توجّه، وفك. الدائرة توريك وين بيوقف لو الرمل مستوي.' },
    done: { en: 'You are ready for Fahad.', ar: 'جاهز لفهد.' } }
];

var G_TEXT = {
  round: { en: 'Round', ar: 'الشوط' },
  you: { en: 'You', ar: 'أنت' }, fahad: { en: 'Fahad', ar: 'فهد' },
  inHole: { en: 'In the hole', ar: 'بالحفرة' },
  yourTurn: { en: 'Your shot', ar: 'دورك' }, hisTurn: { en: "Fahad's shot", ar: 'دور فهد' },
  aimHint: { en: 'Pull back anywhere, aim, and let go.', ar: 'اسحب لورا من أي مكان، وجّه، وفك.' },
  fromLine: { en: 'From the line', ar: 'من الخط' }, fromLie: { en: 'From where your marble stopped', ar: 'من مكان مصقالك' },
  hisAim: { en: 'Fahad is aiming...', ar: 'فهد يصوّب...' },
  shots: { en: 'shots left', ar: 'رميات باقية' },
  intro: { en: 'A match against Fahad', ar: 'مباراة ضد فهد' },
  introP: { en: 'Three rounds. Each of you starts with five marbles. Every round, both put one in the hole, and the first to get his own marble in takes everything in it. If your marble stops inside the square, your next shot is from there. Outside it, back to the line.', ar: 'ثلاث أشواط. كل واحد معه خمس مصاقيل. كل شوط تحطون مصقال مصقال بالحفرة، واللي يدخّل مصقاله أول ياخذ كل اللي فيها. إذا وقف مصقالك داخل المربع، رميتك الجاية من مكانه. وإذا طلع برا، ترجع للخط.' },
  fahadIs: { en: 'Fahad, the neighbor’s son', ar: 'فهد، ولد الجيران' },
  start: { en: 'Start', ar: 'يلا نبدأ' },
  topView: { en: 'Top view', ar: 'من فوق' }, behind: { en: 'Behind', ar: 'من ورا' },
  again: { en: 'Play again', ar: 'العب مرة ثانية' }, finish: { en: 'Finish', ar: 'إنهاء' },
  learned: { en: 'What you learned', ar: 'وش تعلمت' }
};
var SAY = {
  start: { en: 'Go on, you start.', ar: 'يلا، ابدأ أنت.' },
  myTurn: { en: 'My turn!', ar: 'دوري!' },
  iWin: { en: 'The hole is mine!', ar: 'الحفرة لي!' },
  youWin: { en: 'Lucky shot!', ar: 'يا حظّك!' },
  iMiss: { en: 'Oh no...', ar: 'أفا...' },
  hit: { en: 'Hey, my marble!', ar: 'لا تطق مصقالي!' },
  draw: { en: 'Nobody? Then the hole waits.', ar: 'ولا أحد؟ خلها للشوط الجاي.' }
};
var FB = {
  in: { en: 'In!', ar: 'دخلت!' },
  hisIn: { en: 'Fahad got it in', ar: 'فهد دخّلها' },
  lip: { en: 'It hopped over the hole', ar: 'نطّت فوق الحفرة' },
  strong: { en: 'Too strong', ar: 'قوية زيادة' },
  soft: { en: 'Too soft', ar: 'ضعيفة' },
  left: { en: 'A little to the left', ar: 'راحت يسار شوي' },
  right: { en: 'A little to the right', ar: 'راحت يمين شوي' },
  inSq: { en: 'Inside the square: next shot from there', ar: 'داخل المربع: رميتك الجاية من مكانها' },
  outSq: { en: 'Outside the square: back to the line', ar: 'برا المربع: ترجع للخط' },
  hitHim: { en: 'You knocked his marble', ar: 'طقّيت مصقاله' },
  knockedIn: { en: 'You knocked his marble in. It counts for him!', ar: 'دخّلت مصقاله بالغلط، تنحسب له!' },
  heKnockedIn: { en: 'He knocked your marble in. It counts for you!', ar: 'دخّل مصقالك بالغلط، تنحسب لك!' },
  practiceIn: { en: 'In on your first try!', ar: 'دخلت من أول مرة!' },
  tryAgain: { en: 'Try again', ar: 'جرّب مرة ثانية' }
};
var LEARN = [
  { en: 'Masaqil are glass marbles, a game of Najd’s alleys.', ar: 'المصاقيل حبيبات زجاج، لعبة حواري نجد.' },
  { en: 'A square drawn in the sand, with the hole in it.', ar: 'مربع مرسوم بالرمل، والحفرة فيه.' },
  { en: 'The players throw from about five meters.', ar: 'اللاعبين يرمون من بعد خمسة أمتار تقريبًا.' },
  { en: 'The winner takes all the marbles in the hole.', ar: 'الفايز ياخذ كل المصاقيل اللي بالحفرة.' }
];
var MAX_SHOTS = 4, ROUNDS = 3, START_MARBLES = 5;

// ════════════════════════════════════════════════════════════
// state
// ════════════════════════════════════════════════════════════
var S = {
  part: 'story', ch: 0, how: 0, howState: {}, practice: { tries: 0, made: false },
  game: null, sound: true, arMode: null, inAR: false, arPlaced: false, view: 'behind',
  aim: null, canAim: false
};
try { S.sound = localStorage.getItem('cl_sound') !== 'off'; } catch (e) {}
var world, panel, bar, parts, toastEl, hud, touch, callout, arBtn, aimRing, root;
var token = 0;   // bumps whenever the scene is rebuilt, so old timers stop

// ════════════════════════════════════════════════════════════
// sound (made in code — no files)
// ════════════════════════════════════════════════════════════
var AC = null, rollNode = null, scrapeNode = null;
function ac() {
  if (!AC) { var C = window.AudioContext || window.webkitAudioContext; if (!C) return null; AC = new C(); }
  if (AC.state === 'suspended') AC.resume();
  return AC;
}
function tone(f, dur, type, vol, delay, f2) {
  var c = ac(); if (!c) return;
  var t = c.currentTime + (delay || 0), o = c.createOscillator(), g = c.createGain();
  o.type = type || 'sine'; o.frequency.setValueAtTime(f, t);
  if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + dur);
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol || 0.1, t + 0.004); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g); g.connect(c.destination); o.start(t); o.stop(t + dur + 0.05);
}
function noiseBuf(c, secs) {
  var b = c.createBuffer(1, Math.floor(c.sampleRate * secs), c.sampleRate), d = b.getChannelData(0);
  for (var i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  return b;
}
function noise(dur, vol, freq, q, type, delay) {
  var c = ac(); if (!c) return;
  var t = c.currentTime + (delay || 0), s = c.createBufferSource(); s.buffer = noiseBuf(c, dur + 0.05);
  var f = c.createBiquadFilter(); f.type = type || 'bandpass'; f.frequency.value = freq || 1200; f.Q.value = q || 1;
  var g = c.createGain(); g.gain.setValueAtTime(vol || 0.05, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  s.connect(f); f.connect(g); g.connect(c.destination); s.start(t); s.stop(t + dur + 0.05);
}
function loop(freq, q) {
  var c = ac(); if (!c) return null;
  var s = c.createBufferSource(); s.buffer = noiseBuf(c, 2); s.loop = true;
  var f = c.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = freq; f.Q.value = q;
  var g = c.createGain(); g.gain.value = 0.0001;
  s.connect(f); f.connect(g); g.connect(c.destination); s.start();
  return { s: s, g: g, f: f };
}
// a plucked string, for the little Hijaz phrases
function pluck(f, delay, vol) {
  var c = ac(); if (!c) return;
  var t = c.currentTime + (delay || 0), o = c.createOscillator(), o2 = c.createOscillator(), g = c.createGain(), lp = c.createBiquadFilter();
  o.type = 'sawtooth'; o2.type = 'triangle'; o.frequency.value = f; o2.frequency.value = f * 2.002;
  lp.type = 'lowpass'; lp.frequency.setValueAtTime(f * 7, t); lp.frequency.exponentialRampToValueAtTime(f * 1.2, t + 0.35);
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol || 0.07, t + 0.006); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.9);
  o.connect(lp); o2.connect(lp); lp.connect(g); g.connect(c.destination);
  o.start(t); o2.start(t); o.stop(t + 1); o2.stop(t + 1);
}
var SFX = {
  tap: function () { tone(880, 0.05, 'triangle', 0.035); },
  click: function (v) { var k = clamp(v || 0.5, 0.15, 1.6); tone(2650, 0.07, 'sine', 0.05 * k); tone(3980, 0.05, 'sine', 0.03 * k); noise(0.03, 0.03 * k, 6000, 1.2, 'highpass'); },
  drop: function () { tone(150, 0.12, 'sine', 0.12, 0, 90); tone(1900, 0.06, 'sine', 0.04, 0.035); tone(2900, 0.05, 'sine', 0.025, 0.07); },
  dig: function () { noise(0.22, 0.09, 700, 0.7, 'lowpass'); },
  win: function () { [293.7, 311.1, 370, 392, 440].forEach(function (f, i) { pluck(f, i * 0.11, 0.07); }); pluck(587.3, 0.6, 0.06); },
  lose: function () { pluck(392, 0, 0.06); pluck(370, 0.18, 0.06); pluck(293.7, 0.42, 0.06); },
  star: function () { tone(784, 0.2, 'sine', 0.06); tone(1175, 0.4, 'sine', 0.05, 0.12); tone(1568, 0.5, 'sine', 0.04, 0.24); },
  swoosh: function () { noise(0.25, 0.05, 1800, 0.6); }
};
function sfx(n, a) { if (!S.sound) return; try { SFX[n](a); } catch (e) {} }
function setLoop(which, level) {
  if (!S.sound) level = 0;
  var c = AC; if (!c && level <= 0) return;
  if (which === 'roll') {
    if (!rollNode && level > 0) rollNode = loop(650, 0.7);
    if (rollNode) rollNode.g.gain.setTargetAtTime(level > 0 ? Math.min(0.07, 0.012 + level * 0.035) : 0.0001, ac().currentTime, 0.05);
  } else {
    if (!scrapeNode && level > 0) scrapeNode = loop(2400, 0.9);
    if (scrapeNode) scrapeNode.g.gain.setTargetAtTime(level > 0 ? 0.035 : 0.0001, ac().currentTime, 0.04);
  }
}
function buzz(ms) { try { if (navigator.vibrate) navigator.vibrate(ms); } catch (e) {} }

// ════════════════════════════════════════════════════════════
// UI pieces
// ════════════════════════════════════════════════════════════
var toastTimer = 0;
function toast(o) {
  toastEl.textContent = L(o); toastEl.classList.add('show');
  clearTimeout(toastTimer); toastTimer = setTimeout(function () { toastEl.classList.remove('show'); }, 2800);
}
var calloutTimer = 0;
function shout(o, kind) {
  callout.className = 'mq-callout ' + (kind || '');
  callout.textContent = L(o);
  void callout.offsetWidth;
  callout.classList.add('show');
  clearTimeout(calloutTimer); calloutTimer = setTimeout(function () { callout.classList.remove('show'); }, 1500);
}

function setBar(cfg) {
  var html = '';
  if (cfg.back) html += '<button class="qx-btn qx-btn-line qx-btn-round" data-i="back" aria-label="' + L(T.back) + '">' + ICON.back + '</button>';
  (cfg.buttons || []).forEach(function (b, i) {
    html += '<button class="qx-btn ' + (b.kind === 'line' ? 'qx-btn-line' : b.kind === 'icon' ? 'qx-btn-line qx-btn-round' : 'qx-btn-solid') + (b.hold ? ' qx-btn-hold' : '') + '" data-i="' + i + '"' +
      (b.id ? ' id="' + b.id + '"' : '') + (b.disabled ? ' disabled' : '') + (b.aria ? ' aria-label="' + L(b.aria) + '"' : '') + '>' +
      (b.iconFirst ? ICON[b.iconFirst] : '') + (b.label ? '<span>' + L(b.label) + '</span>' : '') + (b.icon ? ICON[b.icon] : '') + '</button>';
  });
  bar.innerHTML = html;
  if (cfg.back) $('[data-i="back"]', bar).addEventListener('click', cfg.back);
  (cfg.buttons || []).forEach(function (b, i) {
    var el = $('[data-i="' + i + '"]', bar);
    if (b.hold) wireHold(el, b.hold);
    else if (b.onClick) el.addEventListener('click', function () { if (!el.disabled) b.onClick(el); });
  });
  // a tap on the overlay must not also count as an AR "select"
  $$('button', bar).forEach(function (el) { el.addEventListener('beforexrselect', function (e) { e.preventDefault(); }); });
}
function wireHold(btn, h) {
  var down = false, raf = 0, last = 0;
  function frame(t) {
    if (!down) return;
    var dt = Math.min(window.CL_MQ_DTMAX || 0.05, (t - last) / 1000); last = t;
    if (h.onTick(dt) === false) { stop(); return; }
    raf = requestAnimationFrame(frame);
  }
  function start(e) {
    if (btn.disabled || down) return;
    if (e) { e.preventDefault(); try { btn.setPointerCapture(e.pointerId); } catch (x) {} }
    down = true; last = performance.now(); btn.classList.add('is-holding');
    if (h.onStart) h.onStart();
    raf = requestAnimationFrame(frame);
  }
  function stop() {
    if (!down) return;
    down = false; cancelAnimationFrame(raf); btn.classList.remove('is-holding');
    if (h.onEnd) h.onEnd();
  }
  btn.addEventListener('pointerdown', start);
  btn.addEventListener('pointerup', stop);
  btn.addEventListener('pointercancel', stop);
  btn.addEventListener('lostpointercapture', stop);
  btn.addEventListener('contextmenu', function (e) { e.preventDefault(); });
}
function holdFill(btn, p) { if (btn) btn.style.setProperty('--p', (clamp(p, 0, 1) * 100).toFixed(1) + '%'); }

function renderParts() {
  var prog = {
    story: S.ch / (STORY.length - 1),
    how: (S.howState.done ? 1 : S.how / HOW.length),
    play: S.game ? (S.game.over ? 1 : (S.game.round - 1) / ROUNDS) : 0
  };
  $$('.qx-part', parts).forEach(function (b) {
    var p = b.getAttribute('data-part');
    b.classList.toggle('is-active', p === S.part);
    b.classList.toggle('is-done', prog[p] >= 1 && p !== S.part);
    $('.bar b', b).style.width = Math.round(clamp(prog[p], 0, 1) * 100) + '%';
  });
}

function renderSound() { $('#qx-sound').innerHTML = S.sound ? ICON.soundOn : ICON.soundOff; }

function renderAR() {
  if (!arBtn) return;
  arBtn.hidden = false;
  arBtn.classList.toggle('is-off', !S.arMode);
  arBtn.classList.toggle('is-in', S.inAR);
  arBtn.innerHTML = ICON.cube + '<span>' + L(S.inAR ? T.arExit : S.arMode === 'quicklook' ? T.arQL : T.ar) + '</span>';
}

// ════════════════════════════════════════════════════════════
// parts
// ════════════════════════════════════════════════════════════
function setPart(p) {
  token++;
  S.part = p;
  try { history.replaceState(null, '', '#' + p); } catch (e) {}
  document.body.setAttribute('data-part', p);
  S.canAim = false; endAim(true);
  setLoop('scrape', 0); setLoop('roll', 0);
  hud.hidden = true;
  world.drama = false;
  if (p === 'story') goCh(S.ch, true);
  else if (p === 'how') startHow();
  else startPlay();
  renderParts();
  if (S.inAR && !S.arPlaced) renderScan();
}

// ════════════════════════════════════════════════════════════
// 1. STORY
// ════════════════════════════════════════════════════════════
function fieldComplete() { world.setSquare(1); world.setLine(1); world.setDig(1); }

function storyScene(i) {
  var my = ++token;
  world.clearMarbles();
  world.slopeOn = false;
  var c = STORY[i];
  if (c.scene === 'cover') {
    fieldComplete();
    var a = world.addMarble('me'), b = world.addMarble('fahad');
    world.dropStake(a, 0.2); world.dropStake(b, 0.5);
    [[0.24, 0.16, 'show'], [0.14, 0.24, 'me'], [0.3, 0.29, 'fahad'], [-0.16, 0.12, 'show'], [0.12, -0.16, 'me']].forEach(function (p) {
      var m = world.addMarble(p[2] === 'show' ? 'me' : p[2], p[2]); world.placeMarble(m, p[0], p[1]);
    });
    world.view('cover', { k: 1.1 });
  } else if (c.scene === 'macro') {
    fieldComplete();
    [[-0.034, 0.25, 'show'], [0.031, 0.236, 'me'], [0.004, 0.292, 'fahad']].forEach(function (p) {
      var m = world.addMarble('me', p[2]); world.placeMarble(m, p[0], p[1]);
    });
    // one of them rolls in slowly, to show the glass turning
    var roller = world.addMarble('me', 'show'); world.placeMarble(roller, 0.32, 0.12);
    setTimeout(function () { if (my === token) world.shoot(roller, -0.62, 0.21); }, 900);
    world.view('macro', { k: 1.4 });
  } else if (c.scene === 'field') {
    world.setSquare(0); world.setLine(0); world.setDig(0);
    world.view('top', { k: 1.4 });
    var t0 = performance.now();
    world.animate(1.8, function (t) { world.setSquare(t); }, null, 0.4);
    world.animate(0.6, function (t) { world.setDig(t); }, function () { sfx('dig'); }, 2.3);
    world.animate(0.9, function (t) { world.setLine(t); }, null, 3.0);
    var s1 = world.addMarble('me'), s2 = world.addMarble('fahad');
    world.dropStake(s1, 4.0); world.dropStake(s2, 4.3);
    setTimeout(function () {
      if (my !== token) return;
      var m = world.addMarble('me'); world.placeMarble(m, -0.05, K.LINE_Z);
      var d = Math.hypot(0.05, K.LINE_Z), v = Math.sqrt(2 * K.DECEL * (d + 0.02));
      world.shoot(m, 0.05 / d * v, -K.LINE_Z / d * v);
      world.drama = true;
    }, 5600);
  } else if (c.scene === 'winner') {
    fieldComplete();
    world.view('hole', { k: 1.4 });
    var list = [];
    for (var k = 0; k < 4; k++) { var st = world.addMarble(k % 2 ? 'fahad' : 'me'); world.dropStake(st, 0.3 + k * 0.35); list.push(st); }
    var w = world.addMarble('me'); world.placeMarble(w, 0.3, 0.22);
    setTimeout(function () { if (my === token) { world.drama = true; world.shoot(w, -0.766, -0.561); } }, 2200);
    setTimeout(function () { if (my === token) { world.drama = false; world.collectHole(0.5, 0.35); sfx('win'); world.view('dig', { k: 1.2 }); } }, 4300);
  }
  return my;
}

function goCh(i, fresh) {
  var changed = i !== S.ch || fresh;
  S.ch = clamp(i, 0, STORY.length - 1);
  if (changed) storyScene(S.ch);
  var c = STORY[S.ch];
  panel.className = 'mq-panel qx-enter' + (c.kicker ? ' is-cover' : '');
  panel.innerHTML =
    '<div class="mq-dots">' + STORY.map(function (s, k) { return '<i class="' + (k === S.ch ? 'is-on' : k < S.ch ? 'is-done' : '') + '"></i>'; }).join('') + '</div>' +
    (c.kicker ? '<div class="qx-kicker">' + L(c.kicker) + '</div>' : '<div class="qx-chapter-num">' + L(T.chapter) + ' ' + num(S.ch) + ' ' + L(T.of) + ' ' + num(STORY.length - 1) + '</div>') +
    '<h1 class="mq-title">' + L(c.title) + '</h1>' +
    '<p class="mq-p">' + L(c.body) + '</p>' +
    (c.hint && !S.inAR ? '<div class="qx-hint"><i></i><span>' + L(c.hint) + '</span></div>' : '') +
    (c.sources ? '<p class="qx-sources">' + L(c.sources) + '</p>' : '');
  var last = S.ch === STORY.length - 1;
  setBar({
    back: S.ch > 0 ? function () { goCh(S.ch - 1); renderParts(); } : null,
    buttons: [{ label: last ? T.toHow : T.next, icon: 'next', onClick: function () { sfx('tap'); if (last) setPart('how'); else { goCh(S.ch + 1); renderParts(); } } }]
  });
}

// ════════════════════════════════════════════════════════════
// 2. HOW TO PLAY
// ════════════════════════════════════════════════════════════
function startHow() {
  var my = ++token;
  world.clearMarbles();
  world.slopeOn = true;
  S.how = 0; S.howState = {}; S.practice = { tries: 0, made: false };
  world.setSquare(0); world.setLine(0); world.setDig(0);
  renderHow(true);
}
function howView(st) {
  if (st.view === 'aim' && S.practice.m) world.view(S.view === 'top' ? 'top' : 'aim', { from: S.practice.m.pos, k: 2 });
  else world.view(st.view, { k: 1.6 });
}
function renderHow(fresh) {
  var st = HOW[S.how], hs = S.howState;
  if (fresh) {
    hs.p = 0; hs.taps = 0; hs.ok = false;
    if (st.key === 'stake' && world.inHole().length) hs.ok = true;
    if (st.key === 'shot') setupPractice();
    howView(st);
  }
  var head = '<div class="mq-steps">' + HOW.map(function (s, k) { return '<i class="' + (k === S.how ? 'is-on' : k < S.how ? 'is-done' : '') + '"></i>'; }).join('') + '</div>' +
    '<div class="qx-chapter-num">' + L(T.step) + ' ' + num(S.how + 1) + ' ' + L(T.of) + ' ' + num(HOW.length) + '</div>' +
    '<h2 class="mq-title">' + L(st.title) + '</h2>' +
    '<p class="mq-p">' + L(st.text) + '</p>' +
    '<div class="mq-status" id="mq-status"></div>';
  panel.className = 'mq-panel' + (fresh ? ' qx-enter' : '');
  panel.innerHTML = head;
  if (hs.ok) status('good', st.key === 'shot' && S.practice.made ? (S.practice.tries === 1 ? FB.practiceIn : FB.in) : st.done);
  howBar();
}
function status(kind, o) {
  var el = $('#mq-status'); if (!el) return;
  el.className = 'mq-status show ' + kind;
  el.innerHTML = (kind === 'good' ? ICON.check : '') + '<span>' + L(o) + '</span>';
}
function howNext() {
  sfx('tap');
  if (S.how < HOW.length - 1) { S.how++; renderHow(true); renderParts(); }
  else { S.howState.done = true; setPart('play'); }
}
function howBar() {
  var st = HOW[S.how], hs = S.howState, back = S.how > 0 ? function () { S.how--; renderHow(true); renderParts(); } : null;
  if (hs.ok) {
    var lastStep = S.how === HOW.length - 1;
    setBar({ back: back, buttons: [{ label: lastStep ? T.toPlay : T.next, icon: 'next', onClick: howNext }] });
    return;
  }
  if (st.act === 'hold') {
    setBar({ back: back, buttons: [{ label: st.cta, id: 'mq-cta', hold: {
      onStart: function () { setLoop('scrape', 1); },
      onTick: function (dt) {
        hs.p = Math.min(1, hs.p + dt / (st.key === 'square' ? 2.6 : 1.3));
        if (st.key === 'square') world.setSquare(hs.p); else world.setLine(hs.p);
        holdFill($('#mq-cta'), hs.p);
        if (hs.p >= 1) { setLoop('scrape', 0); hs.ok = true; sfx('star'); buzz(20); status('good', st.done); howBar(); renderParts(); return false; }
      },
      onEnd: function () { setLoop('scrape', 0); }
    } }] });
    holdFill($('#mq-cta'), hs.p);
  } else if (st.act === 'taps') {
    setBar({ back: back, buttons: [{ label: st.cta, id: 'mq-cta', onClick: function () {
      hs.taps++;
      sfx('dig'); buzz(15);
      var from = world.dig, to = hs.taps / st.taps;
      world.animate(0.35, function (t) { world.setDig(from + (to - from) * t); });
      var el = $('#mq-cta span'); if (el) el.textContent = L(st.cta) + ' ' + num(hs.taps) + '/' + num(st.taps);
      if (hs.taps >= st.taps) { hs.ok = true; setTimeout(function () { sfx('star'); status('good', st.done); howBar(); renderParts(); }, 380); }
    } }] });
  } else if (st.act === 'tap') {
    setBar({ back: back, buttons: [{ label: st.cta, id: 'mq-cta', onClick: function () {
      var a = world.addMarble('me'); world.dropStake(a, 0);
      var b = world.addMarble('fahad'); world.dropStake(b, 0.55);
      hs.ok = true;
      setTimeout(function () { status('good', st.done); howBar(); renderParts(); }, 900);
      $('#mq-cta').disabled = true;
    } }] });
  } else if (st.act === 'aim') {
    setBar({ back: back, buttons: [
      { kind: 'icon', iconFirst: 'top', aria: G_TEXT.topView, onClick: toggleView },
      { label: { en: 'Pull back on the screen', ar: 'اسحب لورا على الشاشة' }, kind: 'line', disabled: true }
    ] });
  }
}

function setupPractice() {
  world.clearMarbles();
  fieldComplete();
  var a = world.addMarble('me'), b = world.addMarble('fahad');
  world.dropStake(a, 0); world.dropStake(b, 0.15);
  var m = world.addMarble('me');
  world.placeMarble(m, -0.06, K.LINE_Z);
  S.practice.m = m;
  world.markShooter(m, 0xFFC46B);
  S.canAim = true;
  S.aimCtx = { who: 'me', m: m, practice: true, onShot: practiceShot };
}
function practiceShot(m, start, dir) {
  S.practice.tries++;
  S.canAim = false;
  world.markShooter(null);
  waitSettle(function () {
    var hs = S.howState;
    if (m.state === 'hole') {
      S.practice.made = true; hs.ok = true;
      shout(FB.in, 'good'); sfx('win'); buzz([30, 40, 60]);
      status('good', S.practice.tries === 1 ? FB.practiceIn : FB.in);
      howBar(); renderParts();
      return;
    }
    var fb = missFeedback(m, start, dir);
    shout(fb, 'bad');
    if (S.practice.tries >= 3) { hs.ok = true; status('good', HOW[S.how].done); howBar(); renderParts(); }
    else status('bad', { en: fb.en + '. ' + FB.tryAgain.en, ar: fb.ar + '. ' + FB.tryAgain.ar });
    // back to the line for another go
    setTimeout(function () {
      if (S.part !== 'how' || S.how !== HOW.length - 1) return;
      world.removeMarble(m, true);
      var n = world.addMarble('me'); world.placeMarble(n, -0.06, K.LINE_Z);
      S.practice.m = n; world.markShooter(n, 0xFFC46B);
      S.aimCtx = { who: 'me', m: n, practice: true, onShot: practiceShot };
      S.canAim = true;
      if (S.view !== 'top') world.view('aim', { from: n.pos, k: 2 });
    }, 1300);
  });
}
function missFeedback(m, start, dir) {
  var px = m.pos.x - start.x, pz = m.pos.y - start.y;
  var t = px * dir.x + pz * dir.y, hx = -start.x, hz = -start.y, d = hx * dir.x + hz * dir.y;
  if (m.lipped) return FB.lip;
  if (t > d + 0.07) return FB.strong;
  if (t < d - 0.07) return FB.soft;
  var side = px * (-dir.y) + pz * dir.x;
  return side > 0 ? FB.right : FB.left;
}

function waitSettle(cb) {
  var my = token, t0 = performance.now();
  (function check() {
    if (my !== token) return;
    if (world.settled() || performance.now() - t0 > 12000) { setLoop('roll', 0); cb(); return; }
    setTimeout(check, 120);
  })();
}

// ════════════════════════════════════════════════════════════
// 3. THE MATCH
// ════════════════════════════════════════════════════════════
function newGame() {
  return { round: 1, pocket: { me: START_MARBLES, fahad: START_MARBLES }, turn: 'me', shots: { me: 0, fahad: 0 },
    shooter: { me: null, fahad: null }, lie: { me: null, fahad: null }, carry: [], phase: 'intro', over: false, won: 0, sinks: 0, log: [] };
}
function startPlay() {
  world.clearMarbles();
  world.slopeOn = true;
  fieldComplete();
  S.game = newGame();
  world.view('line', { k: 1.4 });
  renderIntro();
}
function fahadFace() {
  return '<svg class="mq-face" viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="32" r="31" fill="#2A1A10"/><circle cx="32" cy="36" r="17" fill="#B9865E"/><path d="M15 31c0-11 8-17 17-17s17 6 17 17c-5-3-11-4-17-4s-12 1-17 4z" fill="#F4F0E8"/><circle cx="26" cy="37" r="1.9" fill="#2A1A10"/><circle cx="38" cy="37" r="1.9" fill="#2A1A10"/><path d="M26 44c3.5 3 8.5 3 12 0" stroke="#5A3420" stroke-width="2" fill="none" stroke-linecap="round"/><path d="M14 64c2-9 9-13 18-13s16 4 18 13z" fill="#F4F0E8"/></svg>';
}
function renderIntro() {
  hud.hidden = true;
  panel.className = 'mq-panel qx-enter';
  panel.innerHTML =
    '<div class="mq-vs">' + fahadFace() + '<div><div class="qx-kicker">' + L(G_TEXT.intro) + '</div><div class="mq-vs-name">' + L(G_TEXT.fahadIs) + '</div></div></div>' +
    '<p class="mq-p">' + L(G_TEXT.introP) + '</p>';
  setBar({ buttons: [{ label: G_TEXT.start, icon: 'next', onClick: function () { sfx('tap'); startRound(); } }] });
}
function renderHUD() {
  var g = S.game; if (!g) return;
  var pot = world.inHole().length;
  function dots(n) { var s = ''; for (var i = 0; i < Math.min(n, 10); i++) s += '<i></i>'; return s; }
  hud.hidden = false;
  hud.innerHTML =
    '<div class="mq-pl me' + (g.turn === 'me' && !g.over ? ' is-turn' : '') + '"><span class="mq-name">' + L(G_TEXT.you) + '</span><b>' + num(g.pocket.me) + '</b><span class="mq-dots-row">' + dots(g.pocket.me) + '</span></div>' +
    '<div class="mq-pot"><small>' + L(G_TEXT.inHole) + '</small><b>' + num(pot) + '</b><small>' + L(G_TEXT.round) + ' ' + num(g.round) + '/' + num(ROUNDS) + '</small></div>' +
    '<div class="mq-pl fahad' + (g.turn === 'fahad' && !g.over ? ' is-turn' : '') + '"><span class="mq-name">' + L(G_TEXT.fahad) + '</span><b>' + num(g.pocket.fahad) + '</b><span class="mq-dots-row">' + dots(g.pocket.fahad) + '</span></div>';
}
function bubble(o) {
  var b = $('#mq-bubble');
  if (!b) { b = document.createElement('div'); b.id = 'mq-bubble'; b.className = 'mq-bubble'; root.appendChild(b); }
  b.innerHTML = fahadFace() + '<span>' + L(o) + '</span>';
  b.classList.remove('show'); void b.offsetWidth; b.classList.add('show');
  clearTimeout(b._t); b._t = setTimeout(function () { b.classList.remove('show'); }, 2200);
}

function startRound() {
  var g = S.game, my = token;
  g.shots = { me: 0, fahad: 0 }; g.lie = { me: null, fahad: null };
  world.marbles.slice().forEach(function (x) { if (x.state === 'hand') world.removeMarble(x, false); });
  // both put a marble in the hole
  g.pocket.me--; g.pocket.fahad--;
  var a = world.addMarble('me'), b = world.addMarble('fahad');
  world.dropStake(a, 0.3); world.dropStake(b, 0.75);
  g.shooter.me = world.addMarble('me'); g.shooter.fahad = world.addMarble('fahad');
  shout({ en: 'Round ' + g.round, ar: 'الشوط ' + num(g.round) }, 'round');
  sfx('swoosh');
  world.view('hole', { k: 1.6 });
  renderHUD();
  setTimeout(function () {
    if (my !== token) return;
    renderHUD();
    nextTurn(g.round % 2 === 1 ? 'me' : 'fahad', true);
    if (g.round === 1) bubble(SAY.start);
  }, 1500);
}

function lineSpot(who) { return { x: who === 'me' ? -0.06 : 0.06, z: K.LINE_Z }; }

function nextTurn(who) {
  var g = S.game; if (!g || g.over) return;
  if (S.paused) { S.pendingTurn = who; return; }   // AR is still looking for the floor
  g.turn = who; g.phase = 'aim';
  var m = g.shooter[who];
  if (g.lie[who]) world.placeMarble(m, g.lie[who].x, g.lie[who].y);
  else { var p = lineSpot(who); world.placeMarble(m, p.x, p.z); }
  world.markShooter(m, who === 'me' ? 0xFFC46B : 0x7FC4FF);
  renderHUD();
  renderTurnPanel();
  if (who === 'me') {
    if (!S.inAR) world.view(S.view === 'top' ? 'top' : 'aim', { from: m.pos, k: 2.2 });
    S.aimCtx = { who: 'me', m: m, onShot: playShot };
    S.canAim = true;
  } else {
    if (!S.inAR) world.view('side', { from: m.pos, k: 1.8 });
    S.canAim = false;
    if (g.shots.fahad === 0 && g.round > 1) bubble(SAY.myTurn);
    var my = token;
    setTimeout(function () { if (my === token) fahadShoot(); }, 1400);
  }
  playBar();
}
function renderTurnPanel() {
  var g = S.game, who = g.turn, left = MAX_SHOTS - g.shots[who];
  panel.className = 'mq-panel mq-panel-play';
  if (who === 'me') {
    panel.innerHTML = '<div class="mq-turn me">' + L(G_TEXT.yourTurn) + '<small>' + L(g.lie.me ? G_TEXT.fromLie : G_TEXT.fromLine) + ' · ' + num(left) + ' ' + L(G_TEXT.shots) + '</small></div>' +
      '<p class="mq-p small">' + L(G_TEXT.aimHint) + '</p>';
  } else {
    panel.innerHTML = '<div class="mq-turn fahad">' + L(G_TEXT.hisTurn) + '<small>' + L(G_TEXT.hisAim) + '</small></div>';
  }
}
function playBar() {
  var g = S.game;
  var btns = [{ kind: 'icon', iconFirst: S.view === 'top' ? 'eye' : 'top', aria: S.view === 'top' ? G_TEXT.behind : G_TEXT.topView, onClick: toggleView }];
  setBar({ buttons: btns });
}
function toggleView() {
  S.view = S.view === 'top' ? 'behind' : 'top';
  sfx('tap');
  var m = S.aimCtx && S.aimCtx.m;
  if (!S.inAR) { if (S.view === 'top') world.view('top', { k: 2.2 }); else if (m) world.view('aim', { from: m.pos, k: 2.2 }); }
  if (S.part === 'play') playBar();
  else howBar();
}

// Fahad: aims at the hole, sometimes at your marble, never perfectly
function fahadShoot() {
  if (S.paused) { S.pendingTurn = 'fahad'; return; }
  var g = S.game, m = g.shooter.fahad, me = g.shooter.me;
  g._hit = false;
  var P = m.pos.clone(), target = { x: 0, y: 0 }, extra = 0.05;
  // if your marble sits close to the hole inside the square, sometimes he tries to knock it away
  if (g.lie.me && me.state === 'rest' && me.pos.length() < 0.25 && Math.random() < 0.35) { target = { x: me.pos.x, y: me.pos.y }; extra = 0.45; }
  var dx = target.x - P.x, dz = target.y - P.y, d = Math.hypot(dx, dz);
  var lead = g.pocket.fahad - g.pocket.me;           // ahead: a bit sloppier; behind: sharper
  var sigA = (0.046 + 0.016 * d) * (1 + 0.22 * clamp(lead, -2, 3));
  var ang = Math.atan2(dz, dx) + gauss() * sigA;
  var v = Math.sqrt(2 * K.DECEL * (d + extra)) * (1 + gauss() * 0.085);
  v = Math.min(v, K.V_MAX);
  world.markShooter(null);
  g.phase = 'roll'; g.shots.fahad++;
  var dir = { x: Math.cos(ang), y: Math.sin(ang) };
  m.lipped = false;
  world.shoot(m, dir.x * v, dir.y * v);
  world.drama = true;
  if (!S.inAR) world.view('follow', { marble: m });
  waitSettle(function () { afterShot('fahad', P, dir); });
}
function gauss() { var u = 1 - Math.random(), v = Math.random(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); }

function playShot(m, start, dir) {
  var g = S.game;
  g.phase = 'roll'; g.shots.me++;
  S.canAim = false;
  world.markShooter(null);
  world.drama = true;
  if (!S.inAR) world.view('follow', { marble: m });
  waitSettle(function () { afterShot('me', start, dir); });
}

function inSquare(m) { return Math.abs(m.pos.x) <= K.SQ && Math.abs(m.pos.y) <= K.SQ; }

function afterShot(who, start, dir) {
  var g = S.game, my = token, other = who === 'me' ? 'fahad' : 'me';
  world.drama = false;
  var mine = g.shooter[who], his = g.shooter[other];
  var winner = null, msg = null;
  if (mine.state === 'hole') { winner = who; }
  else if (his.state === 'hole') { winner = other; msg = who === 'me' ? FB.knockedIn : FB.heKnockedIn; }
  if (winner) {
    g.sinks += winner === 'me' ? 1 : 0;
    // the shooter itself goes back to its owner; everything else in the hole goes to the winner
    var stakes = world.inHole().filter(function (x) { return x !== g.shooter.me && x !== g.shooter.fahad; }).length;
    g.pocket[winner] += stakes;
    g.carry = [];
    if (winner === 'me') { shout(FB.in, 'good'); sfx('win'); buzz([30, 40, 70]); setTimeout(function () { bubble(SAY.youWin); }, 600); }
    else { shout(FB.hisIn, 'bad'); sfx('lose'); setTimeout(function () { bubble(SAY.iWin); }, 400); }
    if (msg) setTimeout(function () { toast(msg); }, 900);
    g.log.push({ round: g.round, winner: winner, stakes: stakes });
    setTimeout(function () {
      if (my !== token) return;
      world.collectHole(K.LINE_Z, winner === 'me' ? -0.3 : 0.3);
      // the shooters still on the sand go back to their pockets too
      [g.shooter.me, g.shooter.fahad].forEach(function (s) { if (s.state === 'rest') world.removeMarble(s, true); });
      renderHUD();
      setTimeout(function () { if (my === token) endRound(); }, 1300);
    }, 1400);
    return;
  }
  // nobody in: feedback, then where each shooter shoots from next
  var fb = null;
  if (who === 'me') {
    if (his.state === 'rest' && hitHim(g)) fb = FB.hitHim;
    else fb = missFeedback(mine, start, dir);
    shout(fb, 'bad');
  } else if (Math.random() < 0.5) bubble(SAY.iMiss);
  [who, other].forEach(function (k) {
    var s = g.shooter[k];
    if (s.state !== 'rest') return;
    if (inSquare(s)) g.lie[k] = { x: s.pos.x, y: s.pos.y };
    else if (g.lie[k] || k === who) { g.lie[k] = null; world.removeMarble(s, true); }
  });
  if (who === 'me' && !inSquare(mine)) setTimeout(function () { toast(FB.outSq); }, 700);
  else if (who === 'me') setTimeout(function () { toast(FB.inSq); }, 700);
  // a round lasts until someone sinks, or both used all their shots
  if (g.shots.me >= MAX_SHOTS && g.shots.fahad >= MAX_SHOTS) {
    setTimeout(function () { if (my === token) { bubble(SAY.draw); drawRound(); } }, 1400);
    return;
  }
  var nxt = g.shots[other] < MAX_SHOTS ? other : who;
  setTimeout(function () { if (my === token) { g.shooter[who] = respawn(who); g.shooter[other] = respawn(other); nextTurn(nxt); } }, 1500);
}
function hitHim(g) { return g._hit === true; }
// a shooter picked up from the sand comes back as a fresh marble in the hand
function respawn(k) {
  var g = S.game, s = g.shooter[k];
  if (s && world.marbles.indexOf(s) > -1 && s.state !== 'gone') return s;
  return world.addMarble(k);
}
function drawRound() {
  var g = S.game, my = token;
  // the stakes stay in the hole for the next round
  [g.shooter.me, g.shooter.fahad].forEach(function (s) { if (s.state === 'rest') world.removeMarble(s, true); });
  g.log.push({ round: g.round, winner: null });
  setTimeout(function () { if (my === token) endRound(); }, 900);
}
function endRound() {
  var g = S.game;
  renderHUD();
  if (g.round >= ROUNDS || g.pocket.me <= 0 || g.pocket.fahad <= 0) { endMatch(); return; }
  g.round++;
  renderParts();
  startRound();
}
function endMatch() {
  var g = S.game, my = token;
  // a hole nobody won goes back to its owners
  world.inHole().forEach(function (m) { g.pocket[m.owner === 'fahad' ? 'fahad' : 'me']++; });
  if (world.inHole().length) world.collectHole(K.LINE_Z, 0);
  g.over = true; g.turn = null;
  renderHUD(); renderParts();
  var net = g.pocket.me - START_MARBLES;
  var stars = net >= 2 ? 3 : net >= 1 ? 2 : 1;
  try {
    var all = JSON.parse(localStorage.getItem('cl_progress') || '{}');
    all.masaqil = { won: net, stars: Math.max(stars, (all.masaqil && all.masaqil.stars) || 0), last: stars, at: new Date().toISOString() };
    localStorage.setItem('cl_progress', JSON.stringify(all));
  } catch (e) {}
  g.result = { net: net, stars: stars };
  setTimeout(function () {
    if (my !== token) return;
    sfx(net > 0 ? 'win' : 'star');
    if (!S.inAR) world.view('cover', { k: 1 });
    renderResults();
  }, 1200);
}
function renderResults() {
  var g = S.game, net = g.result.net, stars = g.result.stars;
  var title = net > 0 ? { en: 'You emptied Fahad’s pockets', ar: 'فضّيت جيوب فهد' } : net === 0 ? { en: 'A draw', ar: 'تعادل' } : { en: 'Fahad got you this time', ar: 'غلبك فهد هالمرة' };
  var line = net > 0 ? { en: 'You won ' + net + ' of his marbles.', ar: 'كسبت ' + num(net) + ' من مصاقيله.' } : net === 0 ? { en: 'You both go home with five.', ar: 'كل واحد رجع بخمس.' } : { en: 'He won ' + (-net) + ' of yours. Ask for a rematch.', ar: 'كسب ' + num(-net) + ' من مصاقيلك. اطلب إعادة.' };
  {
    hud.hidden = false;
    renderHUD();
    panel.className = 'mq-panel qx-enter mq-results';
    panel.innerHTML =
      '<div class="mq-stars">' + [0, 1, 2].map(function (i) { return '<i class="' + (i < stars ? 'on' : '') + '">' + ICON.star + '</i>'; }).join('') + '</div>' +
      '<h2 class="mq-title">' + L(title) + '</h2>' +
      '<p class="mq-p">' + L(line) + '</p>' +
      '<div class="mq-learn"><div class="qx-kicker">' + L(G_TEXT.learned) + '</div>' + LEARN.map(function (l) { return '<div class="mq-learn-row">' + ICON.check + '<span>' + L(l) + '</span></div>'; }).join('') + '</div>';
    setBar({ buttons: [
      { label: G_TEXT.again, kind: 'line', iconFirst: 'replay', onClick: function () { sfx('tap'); setPart('play'); } },
      { label: G_TEXT.finish, onClick: function () { location.href = 'experience.html?x=masaqil'; } }
    ] });
  }
}

// ════════════════════════════════════════════════════════════
// aiming with a finger (works the same in 3D and in AR)
// ════════════════════════════════════════════════════════════
function wireTouch() {
  var orbit = null;
  touch.addEventListener('pointerdown', function (e) {
    if (S.canAim && S.aimCtx) { startAim(e); return; }
    if (S.part === 'story' && !S.inAR) { orbit = { x: e.clientX, y: e.clientY, yaw: world.orbit.yaw, pitch: world.orbit.pitch }; world.orbit.on = true; try { touch.setPointerCapture(e.pointerId); } catch (x) {} }
  });
  touch.addEventListener('pointermove', function (e) {
    if (S.aim) { moveAim(e); return; }
    if (orbit) { world.orbit.yaw = orbit.yaw - (e.clientX - orbit.x) * 0.006; world.orbit.pitch = clamp(orbit.pitch - (e.clientY - orbit.y) * 0.004, -0.5, 0.5); }
  });
  function up(e) {
    if (S.aim) { releaseAim(e); return; }
    if (orbit) { orbit = null; world.orbit.on = false; }
  }
  touch.addEventListener('pointerup', up);
  touch.addEventListener('pointercancel', function () { if (S.aim) endAim(true); orbit = null; world.orbit.on = false; });
  touch.addEventListener('beforexrselect', function (e) { e.preventDefault(); });
}
function startAim(e) {
  var m = S.aimCtx.m; if (!m || m.state !== 'rest') return;
  try { touch.setPointerCapture(e.pointerId); } catch (x) {}
  S.aim = { sx: e.clientX, sy: e.clientY, power: 0, dir: null };
  aimRing.hidden = false;
  aimRing.style.left = e.clientX + 'px'; aimRing.style.top = e.clientY + 'px';
  var pw = $('.pow', aimRing); if (pw) pw.style.strokeDasharray = '0 100';
  var kn = $('.mq-knob', aimRing); if (kn) kn.style.transform = '';
  ac();
}
function aimDirection(m, dx, dy) {
  // pulling straight back aims at the hole; sideways turns the aim (gently, so you can be precise)
  var ps = world.fieldToScreen(m.pos.x, m.pos.y), hs = world.fieldToScreen(0, 0);
  var base = Math.atan2(hs.y - ps.y, hs.x - ps.x);
  var turn = Math.atan2(-dx, Math.max(8, dy)) * 0.42;
  var a = base + turn, sx = ps.x + Math.cos(a) * 80, sy = ps.y + Math.sin(a) * 80;
  var f0 = world.screenToField(ps.x, ps.y), f1 = world.screenToField(sx, sy);
  if (!f0 || !f1) { var d = Math.hypot(m.pos.x, m.pos.y) || 1; return { x: -m.pos.x / d, y: -m.pos.y / d }; }
  var vx = f1.x - f0.x, vz = f1.y - f0.y, l = Math.hypot(vx, vz) || 1;
  return { x: vx / l, y: vz / l };
}
function moveAim(e) {
  var a = S.aim, m = S.aimCtx.m, dx = e.clientX - a.sx, dy = e.clientY - a.sy, len = Math.hypot(dx, dy);
  a.power = clamp((len - 10) / 150, 0, 1);
  if (len < 10) { world.hideAim(); var pz = $('.pow', aimRing); if (pz) pz.style.strokeDasharray = '0 100'; return; }
  a.dir = aimDirection(m, dx, dy);
  world.showAim(m, a.dir, a.power, !!S.aimCtx.practice);
  var pw = $('.pow', aimRing); if (pw) pw.style.strokeDasharray = (a.power * 100).toFixed(1) + ' 100';
  var knob = $('.mq-knob', aimRing);
  if (knob) knob.style.transform = 'translate(' + clamp(dx, -170, 170) + 'px,' + clamp(dy, -170, 170) + 'px)';
}
function releaseAim() {
  var a = S.aim, ctx = S.aimCtx;
  endAim(false);
  if (!a || !a.dir || a.power < 0.05) return;
  var m = ctx.m, v = Math.pow(a.power, 1.15) * K.V_MAX;
  var start = m.pos.clone();
  m.lipped = false;
  S.game && (S.game._hit = false);
  world.shoot(m, a.dir.x * v, a.dir.y * v);
  sfx('click', 0.6); buzz(12);
  ctx.onShot(m, start, a.dir);
}
function endAim(cancel) {
  S.aim = null;
  if (aimRing) aimRing.hidden = true;
  if (world) world.hideAim();
}

// ════════════════════════════════════════════════════════════
// AR
// ════════════════════════════════════════════════════════════
async function onAR() {
  sfx('tap');
  if (S.inAR) { world.exitAR(); return; }
  if (!S.arMode) { toast(T.arNone); return; }
  if (S.arMode === 'quicklook') {
    toast(T.arOpening);
    try { await world.quickLook(); } catch (e) { console.error(e); toast(T.arFail); }
    return;
  }
  try {
    await world.enterAR(root);
  } catch (e) { console.error(e); toast(T.arFail); }
}
function renderScan() {
  panel.className = 'mq-panel qx-enter';
  panel.innerHTML = '<div class="qx-kicker">' + L(T.ar) + '</div><h2 class="mq-title">' + L(T.arScanT) + '</h2><p class="mq-p">' + L(T.arScanP) + '</p><div class="mq-status show" id="mq-scan">' + L(T.arWait) + '</div>';
  setBar({ buttons: [
    { label: T.arFloor, kind: world.arScale === 1 ? 'solid' : 'line', id: 'mq-floor', onClick: function () { world.setARScale(1); renderScan(); } },
    { label: T.arTable, kind: world.arScale < 1 ? 'solid' : 'line', id: 'mq-table', onClick: function () { world.setARScale(0.4); renderScan(); } },
    { label: T.arPlace, id: 'mq-place', disabled: !world.canPlace(), onClick: function () { if (world.placeField()) { sfx('drop'); buzz(20); } } }
  ] });
  $$('#mq-floor, #mq-table', bar).forEach(function (b) { b.classList.add('mq-chip'); });
}
function onARState(st) {
  if (st === 'scanning') {
    S.inAR = true; S.arPlaced = false; S.paused = true;
    S.canAim = false; endAim(true);
    document.documentElement.classList.add('mq-in-ar');
    renderAR(); renderScan();
  } else if (st === 'placed') {
    S.arPlaced = true;
    renderAR();
    resume();
  } else if (st === 'ended') {
    S.inAR = false; S.arPlaced = false;
    document.documentElement.classList.remove('mq-in-ar');
    renderAR();
    resume();
  }
}
// carry on with the part we were in, wherever it is now drawn
function resume() {
  S.paused = false;
  hud.hidden = !(S.part === 'play' && S.game && S.game.phase !== 'intro');
  if (S.part === 'story') { goCh(S.ch, true); return; }
  if (S.part === 'how') {
    renderHow(false); howView(HOW[S.how]);
    var pm = S.practice.m;
    if (HOW[S.how].key === 'shot' && !S.howState.ok && pm && pm.state === 'rest') { S.canAim = true; world.markShooter(pm, 0xFFC46B); }
    return;
  }
  var g = S.game; if (!g) return;
  if (g.phase === 'intro') { renderIntro(); return; }
  if (g.over) { if (g.result) renderResults(); return; }
  renderHUD();
  if (S.pendingTurn) { var w = S.pendingTurn; S.pendingTurn = null; nextTurn(w); }
  else if (g.phase === 'aim') { token++; nextTurn(g.turn); }
}

// ════════════════════════════════════════════════════════════
// boot
// ════════════════════════════════════════════════════════════
function refresh() {
  if (S.lastLang === window.currentLang) return;
  S.lastLang = window.currentLang;
  document.title = L(T.title) + ' — CultureLens';
  renderAR();
  if (S.inAR && !S.arPlaced) { renderScan(); return; }
  if (S.part === 'story') goCh(S.ch);
  else if (S.part === 'how') renderHow(false);
  else if (S.game) {
    if (S.game.phase === 'intro') renderIntro();
    else if (S.game.over) { if (S.game.result) renderResults(); }
    else { renderHUD(); renderTurnPanel(); playBar(); }
  }
}

async function boot() {
  panel = $('#mq-panel'); bar = $('#qx-bar'); parts = $('#qx-parts'); toastEl = $('#qx-toast');
  hud = $('#mq-hud'); touch = $('#mq-touch'); callout = $('#mq-callout'); arBtn = $('#mq-ar'); aimRing = $('#mq-aimring'); root = $('#mq-root');
  $('#qx-close').innerHTML = ICON.close;
  renderSound();
  $('#qx-sound').addEventListener('click', function () {
    S.sound = !S.sound;
    try { localStorage.setItem('cl_sound', S.sound ? 'on' : 'off'); } catch (e) {}
    if (!S.sound) { setLoop('roll', 0); setLoop('scrape', 0); } else sfx('tap');
    renderSound();
  });
  if (window.ThemeManager && !window.ThemeManager.current()) window.ThemeManager.applyRegionTheme('najd');
  document.title = L(T.title) + ' — CultureLens';
  $('#mq-loading span').textContent = L(T.loading);

  world = new World($('#mq-canvas'), { sky: window.CL_MASAQEEL_SKY || 'masaqeel-sky.hdr' });
  try { await world.init(); }
  catch (e) { console.error(e); $('#mq-loading').innerHTML = '<span>' + L(T.noGL) + '</span>'; return; }
  document.body.classList.add('mq-ready');

  // sounds and haptics from the world
  world.on('hit', function (a, b, v) {
    sfx('click', v); if (v > 0.25) buzz(8);
    var g = S.game;
    if (g && g.phase === 'roll') {
      var me = g.shooter.me, him = g.shooter.fahad;
      if ((a === me && b === him) || (a === him && b === me)) { g._hit = true; if (g.turn === 'me') setTimeout(function () { bubble(SAY.hit); }, 300); }
    }
  });
  world.on('lip', function (m) { m.lipped = true; sfx('click', 0.3); });
  world.on('sink', function () { setTimeout(function () { sfx('drop'); }, 120); });
  world.on('stake', function () { sfx('drop'); });
  world.on('frame', function () { setLoop('roll', world.rollSpeed()); });
  world.on('ar', onARState);
  world.on('reticle', function (ok) {
    var b = $('#mq-place'); if (b) b.disabled = !ok;
    var s = $('#mq-scan'); if (s) s.textContent = ok ? L({ en: 'Good. Tap Place.', ar: 'تمام. اضغط «حطها هنا».' }) : L(T.arWait);
  });

  $$('.qx-part', parts).forEach(function (b) { b.addEventListener('click', function () { sfx('tap'); setPart(b.getAttribute('data-part')); }); });
  arBtn.addEventListener('click', onAR);
  arBtn.addEventListener('beforexrselect', function (e) { e.preventDefault(); });
  wireTouch();
  document.addEventListener('languageChanged', refresh);
  S.lastLang = window.currentLang;

  S.arMode = await world.arSupport();
  renderAR();

  var h = (location.hash || '').replace('#', '');
  S.part = ['story', 'how', 'play'].indexOf(h) > -1 ? h : 'story';
  setPart(S.part);
  world.view(world.rig.mode || 'cover', { snap: true });
  // first frame drawn: lift the curtain
  setTimeout(function () { $('#mq-loading').classList.add('gone'); }, 250);

  // handy for testing and for the team
  window.__mq = { world: world, S: S, setPart: setPart };
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
else boot();
