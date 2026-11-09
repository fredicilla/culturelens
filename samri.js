/**
 * samri.js — Al-Samri, the night art of Najd.
 *
 * One live 3D scene (samri-world.js) carries the whole experience, with its sound made in code
 * (samri-music.js):
 *   1. History (#story)           a Samri night in the dunes outside Unaizah while the story is told
 *   2. How it's performed (#how)  done with your fingers: take your seat at the end of the row,
 *                                 tune your drum, answer the first row, keep the beat, sway,
 *                                 lift the drums and slap them down together
 *   3. The game (#play)           four questions for the mu'allim, then a whole Samri: keep up and
 *                                 he moves you up the row, seat by seat, toward him
 *
 * AR: on Android (Chrome) the gathering sits on your real floor or table (WebXR). On iPhone,
 * "View in your room" opens it in AR Quick Look.
 *
 * Sources:
 *   Saudipedia, "Samri" (Arabic and English): began in Al-Qassim and spread to Hail, Wadi
 *     Al-Dawasir, Bisha, Al-Aarid and southern Riyadh; two rows of men kneel, sway together and
 *     clap to the beat; Unaizah holds Samri evenings every week; in Al-Jawf the poet sings the poem
 *     out and the facing rows repeat it, taking turns on the drums; National Day, Souq Okaz,
 *     Janadriyah; the Ministry of Culture's 2019 competition. Saudipedia, "Al-Hasawi art": the
 *     Hasawi Samri of the Eastern Region.
 *   The Royal Institute of Traditional Arts (Wrth), Samri booklet: the name from samar (staying up
 *     late talking), the leader's call and the two facing rows, the opening called the waneen, the
 *     first row "yisheel" and the answering row "marrad", the leader or mulaqqin feeding the verses,
 *     al-la'ib (swaying forward and back, right and left, together), eight to ten in a row at first,
 *     the tar of wood and goat or sheep skin tightened to the sound and moistened with water when
 *     too tight, heavy Samri for elders and light, fast Samri for the young (Wadi Al-Dawasir), the
 *     themes of the poems.
 *   Aramco World, "Saudi Folk Music: Alive and Well" (2007): Unaizah's Thursday nights, in summer in
 *     the dunes outside town; the two lines kneel facing each other; one line claps and sings while
 *     the other sways and lifts and lowers the drums, leaning toward the neighbors right and left;
 *     the khallu, when the drums are thrown on the ground with a loud slap; each line's mu'allim at
 *     its center, beginners at the ends moving toward the center as they learn; sequences that take
 *     years; the songs take the meter of the poetry.
 */
import { World, ROW } from './samri-world.js';
import { Music, LINES } from './samri-music.js';

// ════════════════════════════════════════════════════════════
// helpers
// ════════════════════════════════════════════════════════════
function $(s, r) { return (r || document).querySelector(s); }
function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
function isAr() { return window.currentLang === 'ar'; }
function L(o) { if (o == null) return ''; if (typeof o === 'string') return o; return isAr() ? (o.ar != null ? o.ar : o.en) : o.en; }
function num(n) { return isAr() ? String(n).replace(/\d/g, function (d) { return '٠١٢٣٤٥٦٧٨٩'[d]; }).replace('.', '٫') : String(n); }
function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
function now() { return performance.now(); }

var ICON = {
  close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>',
  back: '<svg class="qx-flip" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 6l-6 6 6 6"/></svg>',
  next: '<svg class="qx-flip" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6"/></svg>',
  cube: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M12 3l8 4.5v9L12 21l-8-4.5v-9z"/><path d="M12 12l8-4.5M12 12v9M12 12L4 7.5"/></svg>',
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
  x: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M9 9l6 6M15 9l-6 6"/></svg>',
  info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/></svg>',
  star: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.8l2.8 5.9 6.4.8-4.7 4.4 1.2 6.3L12 17.1l-5.7 3.1 1.2-6.3L2.8 9.5l6.4-.8z"/></svg>',
  replay: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12a8 8 0 1 0 2.4-5.7"/><path d="M4 4v4h4"/></svg>',
  hand: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 11V5.5a1.5 1.5 0 0 1 3 0V10m0-1.5a1.5 1.5 0 0 1 3 0V11m0-1a1.5 1.5 0 0 1 3 0v4.5a6 6 0 0 1-6 6h-.6a6 6 0 0 1-4.6-2.2L4.6 15.4a1.5 1.5 0 0 1 2.2-2L9 15"/></svg>',
  play: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5.5v13l10.5-6.5z"/></svg>',
  drum: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="5.5" stroke-dasharray="2 2"/></svg>',
  person: '<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="7" r="3.6"/><path d="M4.5 21c.6-5 3.6-8 7.5-8s6.9 3 7.5 8z"/></svg>',
  soundOn: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9h4l5-4v14l-5-4H4z"/><path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12"/></svg>',
  soundOff: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9h4l5-4v14l-5-4H4z"/><path d="M17 9l5 6M22 9l-5 6"/></svg>'
};
// gesture icons: drawn pointing up and turned for the other directions (real directions on the
// screen, never mirrored for Arabic)
var ARROW = '<svg viewBox="0 0 96 96" aria-hidden="true"><circle class="bg" cx="48" cy="48" r="44"/><path class="ar" d="M48 72V26M29 44l19-19 19 19"/></svg>';
var ARROW_LR = '<svg viewBox="0 0 96 96" aria-hidden="true"><circle class="bg" cx="48" cy="48" r="44"/><path class="ar" d="M22 48h52M36 33L21 48l15 15M60 33l15 15-15 15"/></svg>';
var SLAP = '<svg viewBox="0 0 96 96" aria-hidden="true"><circle class="bg" cx="48" cy="48" r="44"/><path class="ar" d="M48 22v36M31 42l17 17 17-17M26 72h44"/></svg>';
var TAPPER = '<svg viewBox="0 0 96 96" aria-hidden="true"><circle class="bg" cx="48" cy="48" r="44"/><circle class="ring" cx="48" cy="44" r="14"/><path class="ar" d="M44 66V44a4 4 0 0 1 8 0v10m0-3a4 4 0 0 1 8 0v6a12 12 0 0 1-12 12h-2a12 12 0 0 1-9-4l-6-7a3.5 3.5 0 0 1 5-5l4 4"/></svg>';

// the mu'allim, drawn in code: an elder in a red shemagh and black igal
var MUALLIM = '<svg class="sm-face" viewBox="0 0 64 64" aria-hidden="true">' +
  '<circle cx="32" cy="32" r="32" fill="#1B2140"/>' +
  '<path d="M8 64 C9 38 18 16 32 16 C46 16 55 38 56 64 Z" fill="#B4232B"/>' +
  '<path d="M8 64 C9 38 18 16 32 16 C46 16 55 38 56 64 Z" fill="none" stroke="#F2EDE5" stroke-width="1" stroke-dasharray="1.5 3" opacity="0.7"/>' +
  '<ellipse cx="32" cy="36" rx="10.5" ry="12.5" fill="#B07C59"/>' +
  '<path d="M21.6 37 C22 50 27 55 32 55 C37 55 42 50 42.4 37 C39 45 36 46.5 32 46.5 C28 46.5 25 45 21.6 37 Z" fill="#D9D3C9"/>' +
  '<path d="M26.5 43.2 q5.5 -2.4 11 0" stroke="#C9C2B7" stroke-width="2.2" fill="none" stroke-linecap="round"/>' +
  '<path d="M26.2 34.6 q2.4 1.8 4.8 0 M33 34.6 q2.4 1.8 4.8 0" stroke="#3A2418" stroke-width="1.5" fill="none" stroke-linecap="round"/>' +
  '<path d="M25.4 31.2 q2.8 -1.4 5.4 0 M33.2 31.2 q2.8 -1.4 5.4 0" stroke="#E8E2D8" stroke-width="1.3" fill="none" stroke-linecap="round"/>' +
  '<ellipse cx="32" cy="20.5" rx="13.5" ry="3.4" fill="none" stroke="#141212" stroke-width="2.6"/>' +
  '<ellipse cx="32" cy="17.6" rx="12.6" ry="3" fill="none" stroke="#141212" stroke-width="2.2"/>' +
  '</svg>';

// ════════════════════════════════════════════════════════════
// words
// ════════════════════════════════════════════════════════════
var T = {
  title: { en: 'Al-Samri', ar: 'السامري' },
  chapter: { en: 'Chapter', ar: 'الفصل' }, of: { en: 'of', ar: 'من' },
  step: { en: 'Step', ar: 'الخطوة' },
  begin: { en: 'Begin the story', ar: 'ابدأ القصة' },
  next: { en: 'Next', ar: 'التالي' }, back: { en: 'Back', ar: 'رجوع' },
  toHow: { en: 'Now, join the row', ar: 'يلا نجلس بالصف' },
  nextStep: { en: 'Next step', ar: 'الخطوة الجاية' },
  skip: { en: 'Skip', ar: 'تخطّ' },
  toGame: { en: 'Join the Samri', ar: 'ادخل السامري' },
  loading: { en: 'Gathering for the night...', ar: 'نجتمع للسمرة...' },
  noGL: { en: 'This phone could not draw the 3D scene.', ar: 'هالجهاز ما قدر يرسم المشهد ثلاثي الأبعاد.' },
  ar: { en: 'AR', ar: 'بغرفتك' },
  arQL: { en: 'View in your room', ar: 'شوفه بغرفتك' },
  arExit: { en: 'Exit AR', ar: 'اطلع' },
  arNone: { en: 'Open this page on your phone to put the gathering on your floor.', ar: 'افتح الصفحة من جوالك عشان تحط الجلسة على أرضك.' },
  arOpening: { en: 'Opening AR...', ar: 'نفتح الواقع المعزز...' },
  arFail: { en: 'AR could not start on this phone.', ar: 'الواقع المعزز ما اشتغل على هالجوال.' },
  arScanT: { en: 'Find a spot on the floor', ar: 'دوّر مكان بالأرض' },
  arScanP: { en: 'Point your phone at the floor or a table. When the ring sits flat on it, tap Place. The lines show how much room the gathering needs.', ar: 'وجّه جوالك على الأرض أو على طاولة. لما تشوف الدائرة نايمة عليها، اضغط «حطه هنا». الخطوط توضح المساحة اللي تحتاجها الجلسة.' },
  arWait: { en: 'Move your phone slowly so it can see the floor...', ar: 'حرّك جوالك على مهل عشان يشوف الأرض...' },
  arGood: { en: 'Good. Tap Place.', ar: 'تمام. اضغط «حطه هنا».' },
  arPlace: { en: 'Place it here', ar: 'حطه هنا' },
  arFloor: { en: 'Floor', ar: 'أرض' }, arTable: { en: 'Table', ar: 'طاولة' },
  dragHint: { en: 'Drag to look around', ar: 'اسحب عشان تلف' }
};

var STORY = [
  {
    scene: 'cover', kicker: { en: 'Music & Performances · Eastern Region', ar: 'الفنون والعروض · المنطقة الشرقية' },
    title: { en: 'Al-Samri', ar: 'السامري' },
    body: { en: 'A night art from Najd: two rows that answer each other in song, the beat of the drums, and bodies swaying as one. Its name comes from samar, staying up late talking at night.', ar: 'فن ليلي من نجد: صفّان يرد واحدهم على الثاني بالغناء، مع قرع الطبول، وأجساد تتمايل كأنها وحدة. واسمه من «السَّمَر»، وهو السهر والحديث بالليل.' },
    hint: T.dragHint
  },
  {
    scene: 'where', title: { en: 'From Al-Qassim across the Kingdom', ar: 'من القصيم لأنحاء المملكة' },
    body: { en: 'It began in Al-Qassim and grew in Najd, then spread to Hail, Wadi Al-Dawasir, Al-Jawf, Riyadh and beyond, each place with its own melody.', ar: 'بدأ من القصيم وازدهر في نجد، وانتشر لحائل ووادي الدواسر والجوف والرياض وغيرها، ولكل مكان لحنه.' },
    hint: { en: 'Tap a place', ar: 'اضغط على مكان' },
    places: [
      { key: 'unaizah', name: { en: 'Unaizah', ar: 'عنيزة' }, text: { en: 'Its Samri is the best known. Its men gathered every Thursday night, and in summer they met out in the sand dunes beyond the town.', ar: 'سامريها الأشهر. رجالها يجتمعون كل ليلة جمعة، وبالصيف يلتقون في النفود برّا البلد.' } },
      { key: 'dawasir', name: { en: 'Wadi Al-Dawasir', ar: 'وادي الدواسر' }, text: { en: 'Known for the light Samri: fast, and suited to the young.', ar: 'يُعرف بالسامري الخفيف: سريع ويناسب الشباب.' } },
      { key: 'jawf', name: { en: 'Al-Jawf', ar: 'الجوف' }, text: { en: 'The poet sings the poem out loud, and the two facing rows repeat it, taking turns on the drums.', ar: 'الشاعر ينشد القصيدة بصوت عالي، والصفّان المتقابلان يرددونها ويتناوبون ضرب الدفوف.' } },
      { key: 'ahsa', name: { en: 'Al-Ahsa', ar: 'الأحساء' }, text: { en: 'The Eastern Region has a Samri of its own: the Hasawi Samri.', ar: 'وللمنطقة الشرقية سامريها الخاص: السامري الحساوي.' } }
    ]
  },
  {
    scene: 'rows', title: { en: 'Two rows, face to face', ar: 'صفّين متقابلين' },
    body: { en: 'Two rows of men kneel facing each other, eight to ten in a row at first and many more today. Each row has an expert leader, the mu\'allim, at its center. Beginners start at the ends and move toward the center as they learn.', ar: 'يجثو صفّان من الرجال متقابلين، كان الصف من ثمانية لعشرة، واليوم أكثر بكثير. ولكل صف معلّم خبير بنصّه. والمبتدئ يبدأ من طرف الصف، ويقرب للنص كل ما تعلّم.' },
    hint: { en: 'Find them in the row', ar: 'دوّرهم بالصف' },
    who: [
      { key: 'lead', name: { en: 'The mu\'allim', ar: 'المعلّم' } },
      { key: 'end', name: { en: 'A beginner', ar: 'المبتدئ' } }
    ]
  },
  {
    scene: 'drum', title: { en: 'The drum', ar: 'الطار' },
    body: { en: 'The tar is a wooden frame with goat or sheep skin stretched over it. The skin is tightened until it gives the sound they want, and if it gets too tight, it is moistened with water.', ar: 'الطار إطار من الخشب مشدود عليه جلد ماعز أو غنم. يُشد الجلد لين يعطي الصوت المطلوب، وإذا صار مشدود زيادة يُرطّب بالماء.' },
    drum: true
  },
  {
    scene: 'poetry', title: { en: 'Poetry that answers itself', ar: 'قصيدة ترد على نفسها' },
    body: { en: 'The leader calls and the rows line up, and the waneen opens. Then the first row sings the line (they call it yisheel) and the second answers it, which is why it is called the marrad. The leader keeps feeding them the verses.', ar: 'ينادي قائد الفرقة فيتراص الصفّان، ويبدأ «الونين» وهو الافتتاحية. وبعدين الصف الأول «يشيل» البيت والثاني يرد عليه، وعشان كذا اسمه «المرد». والقائد أو «الملقّن» يلقّنهم أبيات القصيدة.' },
    more: { en: 'The poems speak of love, longing, praise, lament and parting, and the songs take the meter of the poetry.', ar: 'وقصايده عن الحب والشوق والمدح والرثاء والفراق، والألحان تمشي على وزن القصيدة.' },
    listen: true
  },
  {
    scene: 'today', title: { en: 'Still sung today', ar: 'ما زال يُغنّى' },
    timeline: [
      { year: { en: 'Every week', ar: 'كل أسبوع' }, text: { en: 'Unaizah still holds Samri evenings every week, kept up by its young men and its elders.', ar: 'ما زالت عنيزة تقيم حفلات السامري كل أسبوع، يحييها شبابها وكبارها.' } },
      { year: { en: '2019', ar: '٢٠١٩' }, text: { en: 'The Ministry of Culture listed Samri among the folk arts of its national cultural competitions.', ar: 'أدرجت وزارة الثقافة السامري ضمن الفنون الشعبية في مسابقاتها الثقافية الوطنية.' } },
      { year: { en: 'Today', ar: 'اليوم' }, text: { en: 'It is a fixture of National Day, Souq Okaz and the Janadriyah festival.', ar: 'وصار حاضر في اليوم الوطني وسوق عكاظ ومهرجان الجنادرية.' } }
    ],
    sources: { en: 'Sources: Saudipedia; the Samri booklet of the Royal Institute of Traditional Arts (Wrth); Aramco World (2007).', ar: 'المصادر: سعوديبيديا؛ كتيّب السامري من المعهد الملكي للفنون التقليدية (ورث)؛ مجلة أرامكو وورلد (٢٠٠٧).' }
  }
];
var LISTEN = { en: 'Listen to a call and answer', ar: 'اسمع الشيلة والرد' };
var LISTENING = { en: 'Listening...', ar: 'نسمع...' };
var PLAYDRUM = { en: 'Hear the drums', ar: 'اسمع الإيقاع' };

var HOW = [
  { key: 'seat', view: 'seat',
    title: { en: 'Take your place', ar: 'خذ مكانك' },
    text: { en: 'The leader has called and the rows are filling. Where does a beginner sit? Drag yourself to a seat.', ar: 'نادى القائد والصفوف تتعبّى. وين يجلس المبتدئ؟ اسحب نفسك لمكان.' },
    hint: { en: 'Drag the gold circle to a seat', ar: 'اسحب الدائرة الذهبية لمكان' },
    done: { en: 'The end of the row. As you learn, you move toward the center.', ar: 'طرف الصف. وكل ما تعلّمت تقرب للنص.' } },
  { key: 'tune', view: 'mydrum',
    title: { en: 'Tune your drum', ar: 'اضبط طارك' },
    text: { en: 'Tap the drum to hear it. When the skin is too tight it sounds sharp, so wet it with water until it sounds right.', ar: 'اضرب الطار وتسمّع صوته. إذا كان الجلد مشدود زيادة يطلع صوته حاد، فرطّبه بالماء لين يضبط.' },
    hint: { en: 'Tap the drum, rub on water', ar: 'اضرب الطار، ورطّب جلده' },
    done: { en: 'That is the sound.', ar: 'هذا هو الصوت.' } },
  { key: 'answer', view: 'answer',
    title: { en: 'Call and answer', ar: 'يشيل ويرد' },
    text: { en: 'The first row sings the line: it yisheel. Your row is the marrad, the one that answers. Listen to the line, then hold to sing your answer until it ends.', ar: 'الصف الأول يشيل البيت، وصفّك هو المرد: يرد عليه. اسمع البيت، وبعدين اضغط مطوّل وغنّ ردّك لين يخلص.' },
    hint: { en: 'Listen, then hold', ar: 'اسمع، وبعدين اضغط مطوّل' },
    done: { en: 'Two good answers. The line goes back and forth like that all night.', ar: 'ردّين زينين. وكذا يروح البيت ويجي طول الليل.' } },
  { key: 'beat', view: 'mydrum',
    title: { en: 'Keep the beat', ar: 'اضبط الإيقاع' },
    text: { en: 'The drums give the beat. Strike yours together with the others: tap on every beat.', ar: 'الطبول تعطي الإيقاع. اضرب طارك مع الباقين: اضغط مع كل ضربة.' },
    hint: { en: 'Tap on the beat', ar: 'اضغط مع الإيقاع' },
    done: { en: 'Right with the row.', ar: 'ماشي مع الصف.' } },
  { key: 'sway', view: 'sway',
    title: { en: 'The sway', ar: 'التمايل' },
    text: { en: 'One row sings and claps while the other sways from side to side, leaning toward the neighbor on the right, then the left. Then they swap.', ar: 'صف يغني ويصفق، والثاني يتمايل يمين ويسار، يميل على جاره اللي يمينه وبعدين اللي يساره. وبعدين يتبادلون.' },
    hint: { en: 'Swipe right, then left, on the beat', ar: 'اسحب يمين ثم يسار مع الإيقاع' },
    done: { en: 'Swaying as one with your row.', ar: 'تتمايل مع صفّك كأنكم واحد.' } },
  { key: 'khallu', view: 'game',
    title: { en: 'Lift, then slap them down', ar: 'ارفع، وبعدين اضرب الأرض' },
    text: { en: 'The drums go up and come down with the song. At the end, everyone throws the drums down on the ground together with one loud slap, a movement called the khallu.', ar: 'الطبول ترتفع وتنزل مع الغنا. وبالنهاية يرمونها كلهم على الأرض مع بعض بضربة وحدة قوية.' },
    hint: { en: 'Up, down, then slap down', ar: 'فوق، تحت، وبعدين اضرب الأرض' },
    done: { en: 'One slap, all together.', ar: 'ضربة وحدة، كلهم مع بعض.' } }
];
var HOW_DONE = {
  title: { en: 'You are in the row', ar: 'صرت بالصف' },
  text: { en: 'Some Samri sequences are so complex they take years to learn. Now join a whole Samri, and see how far up the row you can get.', ar: 'بعض حركات السامري معقدة لدرجة إنها تاخذ سنين عشان تنتعلم. والحين ادخل سامري كامل، وشوف لوين توصل بالصف.' },
  sources: { en: 'Sources: Aramco World (2007); the Samri booklet of Wrth; Saudipedia.', ar: 'المصادر: مجلة أرامكو وورلد (٢٠٠٧)؛ كتيّب السامري من «ورث»؛ سعوديبيديا.' }
};
var SEAT = {
  wrong: { en: 'That seat is close to the mu\'allim, for those who know the Samri well. Beginners start at the end.', ar: 'هالمكان قريب من المعلّم، لأهل الخبرة. المبتدئ يبدأ من الطرف.' },
  you: { en: 'You', ar: 'أنت' }
};
var TUNE = {
  first: { en: 'Too sharp: the skin is too tight. Rub water on it.', ar: 'حاد مرة: الجلد مشدود زيادة. رطّبه بالماء.' },
  still: { en: 'Still a little tight. Wet it some more.', ar: 'لسه مشدود شوي. رطّبه بعد.' },
  wet: { en: 'Wetting the skin...', ar: 'نرطّب الجلد...' },
  ready: { en: 'That should do. Tap it to hear.', ar: 'كذا يكفي. اضربه وتسمّع.' },
  lSlack: { en: 'Slack', ar: 'رخو' }, lRight: { en: 'Right', ar: 'مضبوط' }, lTight: { en: 'Tight', ar: 'مشدود' },
  lTap: { en: 'Tap', ar: 'اضرب' }, lRub: { en: 'Rub', ar: 'رطّب' }
};
var ANS = {
  row1: { en: 'First row', ar: 'الصف الأول' }, row2: { en: 'Your row', ar: 'صفّك' },
  yisheel: { en: 'yisheel', ar: 'يشيل' }, marrad: { en: 'the marrad', ar: 'المرد' },
  listen: { en: 'The first row is singing the line...', ar: 'الصف الأول يشيل البيت...' },
  turn: { en: 'Your turn: hold to answer.', ar: 'دورك: اضغط مطوّل ورد.' },
  wait: { en: 'Wait for the first row to finish its line.', ar: 'انتظر الصف الأول يخلص بيته.' },
  late: { en: 'Come in with your row, right when your line starts.', ar: 'ادخل مع صفّك، أول ما يبدأ ردّك.' },
  early: { en: 'Keep holding until the line ends.', ar: 'خلّك ضاغط لين يخلص البيت.' },
  missed: { en: 'Your turn went by. Hold when your line comes.', ar: 'راح دورك. اضغط لما يجي ردّك.' },
  good: { en: 'A good answer.', ar: 'رد زين.' },
  lHold: { en: 'Hold', ar: 'اضغط مطوّل' }
};
var JUDGE = {
  perfect: { en: 'On the beat!', ar: 'مضبوط!' }, good: { en: 'Good', ar: 'زين' }, miss: { en: 'Missed', ar: 'فاتتك' },
  early: { en: 'A little early', ar: 'بدري شوي' }, late: { en: 'A little late', ar: 'متأخر شوي' },
  wrongR: { en: 'This time it leans right', ar: 'هالمرة الميل يمين' }, wrongL: { en: 'This time it leans left', ar: 'هالمرة الميل يسار' },
  lRight: { en: 'Right', ar: 'يمين' }, lLeft: { en: 'Left', ar: 'يسار' }, lUp: { en: 'Lift', ar: 'ارفع' }, lDown: { en: 'Lower', ar: 'نزّل' }, lSlap: { en: 'Slap down!', ar: 'اضرب الأرض!' },
  again: { en: 'Again, with the row.', ar: 'مرة ثانية، مع الصف.' }
};

var G = {
  name: { en: 'The mu\'allim', ar: 'المعلّم' },
  role: { en: 'Leader of the row', ar: 'قائد الصف' },
  introT: { en: 'Join the Samri', ar: 'ادخل السامري' },
  introP: { en: 'First, show the mu\'allim what you know. Then sit at the end of his row and keep up with a whole Samri. For every passage you get right, he calls you one seat closer.', ar: 'أول شي، وري المعلّم وش تعرف. وبعدين اجلس بطرف صفّه وجاري سامري كامل. وكل طلعة تضبطها، يقرّبك مكان منه.' },
  start: { en: 'Start', ar: 'يلا نبدأ' },
  r1: { en: 'Round 1 · What do you know?', ar: 'الجولة ١ · وش تعرف؟' },
  r2: { en: 'Round 2 · Move up the row', ar: 'الجولة ٢ · تقدّم بالصف' },
  again: { en: 'Play again', ar: 'العب مرة ثانية' }, finish: { en: 'Finish', ar: 'إنهاء' },
  learned: { en: 'What you learned', ar: 'وش تعلمت' },
  score: { en: 'Score', ar: 'النقاط' },
  quizPart: { en: 'Questions', ar: 'الأسئلة' }, rowPart: { en: 'Seats moved up', ar: 'الأماكن اللي تقدمتها' }
};
var RW = {
  intro: { en: 'Sit at the end and follow the row. Keep up with a passage and I will call you one seat closer.', ar: 'اجلس بالطرف وامشِ مع الصف. وإذا ضبطت الطلعة، قرّبتك مكان.' },
  intro2: { en: 'Back again? Good. That is how the young ones learn.', ar: 'رجعت؟ زين. كذا يتعلمون الشباب.' },
  tap: { en: 'Clap and strike on the beat', ar: 'صفّق واضرب مع الإيقاع' },
  lean: { en: 'Lean right and left', ar: 'ميل يمين ويسار' },
  lift: { en: 'Lift and lower the drum', ar: 'ارفع الطار ونزّله' },
  slap: { en: 'Slap it down at the end', ar: 'اضرب الأرض بالنهاية' },
  tip: { en: 'Watch the circles coming toward the ring and move as each one reaches it. Taps when your row sings, swipes when your row sways.', ar: 'تابع الدوائر الجاية للحلقة وتحرك لما توصلها. ضغطات لما صفّك يغني، وسحبات لما صفّك يتمايل.' },
  ready: { en: 'I am ready', ar: 'جاهز' },
  sec: [
    { en: 'Heavy Samri · your row sways', ar: 'السامري الثقيل · صفّك يتمايل' },
    { en: 'Heavy Samri · your row sings', ar: 'السامري الثقيل · صفّك يغني' },
    { en: 'Light Samri · faster now', ar: 'السامري الخفيف · أسرع' },
    { en: 'Light Samri · your row sings', ar: 'السامري الخفيف · صفّك يغني' }
  ],
  finale: { en: 'All on the drums, then slap them down', ar: 'كلنا على الطبول، وبعدين اضرب الأرض' },
  up: { en: 'One seat closer', ar: 'تقدّمت مكان' },
  stay: { en: 'Same seat. Next passage!', ar: 'نفس مكانك. الطلعة الجاية!' },
  seats: { en: 'Your seat', ar: 'مكانك' }, combo: { en: 'Streak', ar: 'متتالية' },
  end4: { en: 'Sit here, beside me. You have earned your place.', ar: 'اجلس هنا جنبي. هذا مكانك وتستاهله.' },
  end2: { en: 'Good. Keep coming and you will reach the middle.', ar: 'زين. استمر وبتوصل للنص.' },
  end0: { en: 'Stay at the end a while. Watch and listen; this takes years.', ar: 'خلك بالطرف شوي. شوف واسمع؛ هالشي ياخذ سنين.' },
  acc: { en: 'Accuracy', ar: 'الدقة' }, best: { en: 'Best streak', ar: 'أطول متتالية' }, moved: { en: 'Seats moved', ar: 'تقدّمت' },
  againRow: { en: 'Play again', ar: 'العب مرة ثانية' }
};
var QUESTIONS = [
  { key: 'sit', options: ['rows', 'circle', 'stand'], answer: 'rows',
    labels: { rows: { en: 'Kneeling in two rows, face to face', ar: 'جاثين بصفّين متقابلين' }, circle: { en: 'In one circle around a fire', ar: 'بدائرة وحدة حول النار' }, stand: { en: 'Standing in one long line', ar: 'واقفين بصف واحد طويل' } },
    prompt: { en: 'How do the performers sit?', ar: 'كيف يجلس المؤدون؟' },
    good: { en: 'Right. Two rows kneel facing each other.', ar: 'صح. صفّين جاثين متقابلين.' },
    bad: { en: 'Samri is two rows kneeling face to face.', ar: 'السامري صفّين جاثين متقابلين.' } },
  { key: 'answer', options: ['answers', 'solo', 'quiet'], answer: 'answers',
    labels: { answers: { en: 'It answers the line', ar: 'يرد على البيت' }, solo: { en: 'It plays a drum solo', ar: 'يضرب الطبل لحاله' }, quiet: { en: 'It stays silent', ar: 'يسكت' } },
    prompt: { en: 'The first row sings the line. What does the second row do?', ar: 'الصف الأول يشيل البيت. وش يسوي الصف الثاني؟' },
    good: { en: 'Right. That is why the second row is called the marrad.', ar: 'صح. وعشان كذا الصف الثاني اسمه «المرد».' },
    bad: { en: 'It answers. That is why the second row is called the marrad.', ar: 'يرد عليه. وعشان كذا الصف الثاني اسمه «المرد».' } },
  { key: 'beginner', options: ['end', 'center', 'behind'], answer: 'end',
    labels: { end: { en: 'At the end of the row', ar: 'بطرف الصف' }, center: { en: 'In the center of the row', ar: 'بنص الصف' }, behind: { en: 'Behind the rows', ar: 'ورا الصفوف' } },
    prompt: { en: 'Where does a beginner sit?', ar: 'وين يجلس المبتدئ؟' },
    good: { en: 'Right. The center belongs to the mu\'allim, and beginners move toward it as they learn.', ar: 'صح. النص للمعلّم، والمبتدئ يقرب له كل ما تعلّم.' },
    bad: { en: 'At the end. The center belongs to the mu\'allim, and beginners move toward it as they learn.', ar: 'بالطرف. النص للمعلّم، والمبتدئ يقرب له كل ما تعلّم.' } },
  { key: 'name', options: ['night', 'moon', 'wind'], answer: 'night',
    labels: { night: { en: 'Staying up talking at night', ar: 'السهر والحديث بالليل' }, moon: { en: 'The full moon', ar: 'البدر' }, wind: { en: 'A desert wind', ar: 'ريح الصحراء' } },
    prompt: { en: 'Samri comes from samar. What is samar?', ar: 'السامري من «السَّمَر». وش هو السمر؟' },
    good: { en: 'Right. Samri is an art of the night.', ar: 'صح. السامري فن ليلي.' },
    bad: { en: 'Samar is staying up late talking at night.', ar: 'السمر هو السهر والحديث بالليل.' } }
];
var LEARN = [
  { en: 'Samri began in Al-Qassim and grew in Najd, and the Eastern Region has its Hasawi Samri.', ar: 'السامري بدأ من القصيم وازدهر في نجد، وللمنطقة الشرقية سامريها الحساوي.' },
  { en: 'Two rows kneel face to face, with the mu\'allim at the center of each.', ar: 'صفّين جاثين متقابلين، وبنص كل صف معلّم.' },
  { en: 'The first row sings the line (yisheel) and the second answers (the marrad).', ar: 'الصف الأول يشيل البيت، والثاني يرد (المرد).' },
  { en: 'One row sings and claps while the other sways, then they swap.', ar: 'صف يغني ويصفق والثاني يتمايل، وبعدين يتبادلون.' }
];
var MAX_SCORE = QUESTIONS.length + 4;
var RESULT_TITLES = [
  { min: MAX_SCORE, t: { en: 'A seat beside the mu\'allim', ar: 'مكانك جنب المعلّم' } },
  { min: MAX_SCORE - 2, t: { en: 'You have the beat', ar: 'ضابط الإيقاع' } },
  { min: 0, t: { en: 'Keep coming to the Samri', ar: 'استمر تحضر السامري' } }
];

// you are the end seat of row B; seat 5 of row B is the one close to the mu'allim
var YOU = ROW.N + 8, NEAR = ROW.N + 5;
var IDLE_BPM = 66;

// ════════════════════════════════════════════════════════════
// state
// ════════════════════════════════════════════════════════════
var S = { part: 'story', ch: 0, place: null, who: null, how: 0, hs: {}, howDone: false, game: null, sound: true, arMode: null, inAR: false, arPlaced: false, gest: null, touching: false, ambient: false, idle0: now() / 1000 };
try { S.sound = localStorage.getItem('cl_sound') !== 'off'; } catch (e) {}
var world, music, panel, bar, parts, toastEl, touch, callout, arBtn, root;
var guideEl, markEl, cueEl, judgeEl, tokenEl, hudEl, trackEl;
var token = 0;

// ════════════════════════════════════════════════════════════
// sound for the buttons (the drums and voices live in samri-music.js)
// ════════════════════════════════════════════════════════════
var SFX = {
  tap: function (t) { music.tone(t, 880, 0, 0.05, 0.035, 'triangle', false); },
  ok: function (t) { music.tone(t, 659, 0, 0.22, 0.07, 'sine', false); music.tone(t + 0.1, 988, 0, 0.32, 0.06, 'sine', false); },
  bad: function (t) { music.tone(t, 196, 150, 0.28, 0.07, 'triangle', false); },
  splash: function (t) { music.burst(t, 0.22, 0.14, 'lowpass', 1600, 0.6); music.burst(t + 0.05, 0.12, 0.06, 'bandpass', 3200, 2); },
  star: function (t) { music.tone(t, 784, 0, 0.2, 0.06); music.tone(t + 0.12, 1175, 0, 0.4, 0.05); music.tone(t + 0.24, 1568, 0, 0.5, 0.04); },
  win: function (t) { [293.7, 311.1, 370, 392, 440].forEach(function (f, i) { music.tone(t + i * 0.11, f, 0, 0.5, 0.06, 'triangle'); }); music.tone(t + 0.6, 587.3, 0, 0.9, 0.06, 'triangle'); }
};
function sfx(n) { if (!S.sound || !music.ctx) return; try { SFX[n](music.time() + 0.005); } catch (e) {} }
function buzz(ms) { try { if (navigator.vibrate) navigator.vibrate(ms); } catch (e) {} }
// when a tap or swipe happened, on the clock of the sound you hear
function inTime() { return music.time() - music.latency(); }

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
function judgeShow(o, kind, y) {
  judgeEl.className = 'sm-judge ' + (kind || '');
  judgeEl.textContent = L(o);
  judgeEl.style.top = (y || window.innerHeight * 0.44) + 'px';
  void judgeEl.offsetWidth; judgeEl.classList.add('show');
}
function setBar(cfg) {
  var html = '';
  if (cfg.back) html += '<button class="qx-btn qx-btn-line qx-btn-round" data-i="back" aria-label="' + L(T.back) + '">' + ICON.back + '</button>';
  (cfg.buttons || []).forEach(function (b, i) {
    html += '<button class="qx-btn ' + (b.kind === 'line' ? 'qx-btn-line' : 'qx-btn-solid') + (b.cls ? ' ' + b.cls : '') + '" data-i="' + i + '"' +
      (b.id ? ' id="' + b.id + '"' : '') + (b.disabled ? ' disabled' : '') + '>' +
      (b.iconFirst ? ICON[b.iconFirst] : '') + (b.label ? '<span>' + L(b.label) + '</span>' : '') + (b.icon ? ICON[b.icon] : '') + '</button>';
  });
  bar.innerHTML = html;
  if (cfg.back) $('[data-i="back"]', bar).addEventListener('click', cfg.back);
  (cfg.buttons || []).forEach(function (b, i) {
    var el = $('[data-i="' + i + '"]', bar);
    if (b.onClick) el.addEventListener('click', function () { if (!el.disabled) b.onClick(el); });
  });
  $$('button', bar).forEach(function (el) { el.addEventListener('beforexrselect', function (e) { e.preventDefault(); }); });
}
function status(kind, o) {
  var el = $('#mq-status'); if (!el) return;
  el.className = 'mq-status show ' + (kind || '');
  el.innerHTML = (kind === 'good' ? ICON.check : kind === 'bad' ? ICON.info : '') + '<span>' + L(o) + '</span>';
}
function renderParts() {
  var g = S.game, nq = QUESTIONS.length + 1, play = 0;
  if (g) {
    if (g.over || g.phase === 'rowDone') play = 1;
    else if (g.phase === 'q') play = g.qi / nq;
    else if (g.phase === 'rowIntro' || g.phase === 'row') play = QUESTIONS.length / nq;
  }
  var prog = { story: S.ch / (STORY.length - 1), how: S.howDone ? 1 : S.how / HOW.length, play: play };
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
function stepsDots(n, i) { var s = ''; for (var k = 0; k < n; k++) s += '<i class="' + (k === i ? 'is-on' : k < i ? 'is-done' : '') + '"></i>'; return s; }
function iconFor(kind) { return kind === 'tap' ? TAPPER : kind === 'khallu' ? SLAP : kind === 'lr' ? ARROW_LR : ARROW; }

// ════════════════════════════════════════════════════════════
// gestures on the scene
// ════════════════════════════════════════════════════════════
function setGesture(h) { S.gest = h || null; }
function pt(e) { return { x: e.clientX, y: e.clientY }; }
// fires as soon as the finger has moved far enough, and again whenever it turns a corner;
// a long stroke in one direction fires once. A tap is judged from the moment the finger came
// down: onTap gets that time, on the clock of the sound you hear
function swiper(o) {
  var st = null, MIN = o.min || 30;
  return {
    down: function (p) { st = { x: p.x, y: p.y, x0: p.x, y0: p.y, n: 0, last: null, at: inTime() }; if (o.onDown) o.onDown(p); },
    move: function (p) {
      if (!st) return;
      var dx = p.x - st.x, dy = p.y - st.y;
      var dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up');
      if (dir === st.last) { if (Math.hypot(dx, dy) > 8) { st.x = p.x; st.y = p.y; } return; }
      if (Math.hypot(dx, dy) < MIN) return;
      st.n++; st.last = dir; st.x = p.x; st.y = p.y;
      if (o.onSwipe) o.onSwipe(dir, p, { x: st.x0, y: st.y0 });
    },
    up: function (p) {
      var tapped = st && !st.n && Math.hypot(p.x - st.x0, p.y - st.y0) < 16, at = st ? st.at : inTime();
      st = null;
      if (o.onUp) o.onUp(p);
      if (tapped && o.onTap) o.onTap(p, at);
    }
  };
}
// the hand that shows what to do: it fades in when you're not touching the screen
var GD = { kind: null, at: null, to: null, from: 0 };
function guide(kind, at, to, label) {
  GD.kind = kind; GD.at = at; GD.to = to || null; GD.from = now() + 250;
  var icon = kind === 'drag' ? '' : (kind === 'hold' ? TAPPER : iconFor(kind));
  guideEl.className = 'sm-guide g-' + kind;
  guideEl.innerHTML = '<div class="sm-g-icon">' + icon + '</div><i class="sm-g-dot"></i>' + (label ? '<span class="sm-g-label">' + L(label) + '</span>' : '');
}
function clearGuide() { GD.kind = null; if (guideEl) guideEl.hidden = true; }
function frameGuide(t) {
  if (!GD.kind) { guideEl.hidden = true; return; }
  var a = GD.at && GD.at();
  var show = !!a && !S.touching && t > GD.from;
  guideEl.hidden = !show;
  if (!show) return;
  guideEl.style.left = a.x + 'px'; guideEl.style.top = a.y + 'px';
  if (GD.to) { var b = GD.to(); if (b) { guideEl.style.setProperty('--gx', (b.x - a.x).toFixed(1) + 'px'); guideEl.style.setProperty('--gy', (b.y - a.y).toFixed(1) + 'px'); } }
}
// glowing rings on things
var MK = [];
function setMarks(list) {
  if (!markEl) return;
  markEl.innerHTML = '';
  MK = (list || []).map(function (f) { var i = document.createElement('i'); markEl.appendChild(i); return { el: i, at: f }; });
}
function frameMarks() {
  var pt = MK.length ? panel.getBoundingClientRect().top || window.innerHeight : 0;
  for (var k = 0; k < MK.length; k++) {
    var m = MK[k], p = m.at();
    // never over the words
    if (!p || p.ok === false || p.y > pt - 12) { m.el.style.display = 'none'; continue; }
    m.el.style.display = ''; m.el.style.left = p.x + 'px'; m.el.style.top = p.y + 'px';
  }
}
// the timing cue: the next move, with a ring that closes on its beat
var CU = { on: false };
function cue(kind, beat, at, label) { CU = { on: true, kind: kind, beat: beat, at: at, label: label }; cueEl.className = 'sm-cue c-' + kind; cueEl.innerHTML = '<div class="sm-cue-r"></div><div class="sm-cue-i">' + iconFor(kind) + '</div>' + (label ? '<span class="sm-cue-l">' + L(label) + '</span>' : ''); }
function cueOff() { CU.on = false; if (cueEl) cueEl.hidden = true; }
function frameCue() {
  if (!CU.on) { cueEl.hidden = true; return; }
  var p = CU.at(); if (!p) { cueEl.hidden = true; return; }
  cueEl.hidden = false; cueEl.style.left = p.x + 'px'; cueEl.style.top = p.y + 'px';
  var left = CU.beat - world.beat;                 // beats until the move
  var s = left > 1.5 ? 2.2 : left > 0 ? 1 + left * 0.8 : 1;
  var r = $('.sm-cue-r', cueEl);
  r.style.setProperty('--s', s.toFixed(3));
  r.style.setProperty('--o', left > 1.6 ? '0' : left < -0.25 ? '0' : '0.95');
}
function screenOf(p) { return function () { var q = typeof p === 'function' ? p() : p; return q ? world.toScreen(q) : null; }; }
function youHeadScreen(dy) { return function () { var h = world.youHead(); return h ? world.toScreen({ x: h.x, y: h.y + (dy || 0), z: h.z }) : null; }; }
// where the timing cues sit: the middle of the scene, clear of the header and the panel
function cueSpot() {
  var w = Math.min(window.innerWidth, 430), top = parts.getBoundingClientRect().bottom, pt = panel.getBoundingClientRect().top || window.innerHeight * 0.6;
  return { x: (window.innerWidth - w) / 2 + w / 2, y: Math.max(top + 92, Math.min(window.innerHeight * 0.3, pt - 130)) };
}
function youDrumScreen() { return function () { var d = world.youDrum(); return d ? world.toScreen(d) : null; }; }
function clearStepUI() {
  setGesture(null); clearGuide(); setMarks(null); cueOff();
  if (tokenEl) tokenEl.hidden = true;
  if (hudEl) { hudEl.hidden = true; hudEl.innerHTML = ''; }
  if (trackEl) { trackEl.hidden = true; trackEl.innerHTML = ''; }
  if (world) { world.showSeatRings(null); world.khalluAt = null; world.rows[0].lift = null; world.rows[1].lift = null; }
  document.body.classList.remove('sm-playing');
}

// ════════════════════════════════════════════════════════════
// the beat everyone moves to
// ════════════════════════════════════════════════════════════
// soft drums and claps behind the story; the rows take turns singing and swaying
function ambient(vol) {
  S.ambient = true;
  if (!music.ready()) { S.wantAmbient = vol || 0.5; return; }
  music.drumVol = vol || 0.5; music.claps = true;
  if (!music.playing) music.start('heavy', 0.3);
}
function quiet() { S.ambient = false; S.wantAmbient = 0; S.listen = null; S.solo = null; music.stop(); music.claps = false; music.drums = true; music.drumVol = 1; }
function resetSeats() {
  world.figs.forEach(function (f, i) { world.setSeat(f, i % ROW.N, true); world.setShow(f, 1, true); world.setDrumTint(i, 1); });
  world.setYou(-1); world.youManual = false;
}

// ════════════════════════════════════════════════════════════
// parts
// ════════════════════════════════════════════════════════════
function setPart(p) {
  token++;
  clearStepUI();
  S.part = p;
  try { history.replaceState(null, '', '#' + p); } catch (e) {}
  document.body.setAttribute('data-part', p);
  if (p === 'story') { quiet(); resetSeats(); world.rows[0].mode = 'sing'; world.rows[1].mode = 'sway'; ambient(0.5); goCh(S.ch, true); }
  else if (p === 'how') { quiet(); startHow(); }
  else { quiet(); startPlay(); }
  renderParts();
  if (S.inAR && !S.arPlaced) renderScan();
}

// ════════════════════════════════════════════════════════════
// 1. STORY
// ════════════════════════════════════════════════════════════
function goCh(i, fresh) {
  var changed = i !== S.ch || fresh;
  S.ch = clamp(i, 0, STORY.length - 1);
  var c = STORY[S.ch];
  if (changed) {
    S.place = null; S.who = null; setMarks(null);
    if (!S.inAR) world.view(c.scene, { k: 1.4 });
  }
  var html = '<div class="mq-dots">' + stepsDots(STORY.length, S.ch) + '</div>' +
    (c.kicker ? '<div class="qx-kicker">' + L(c.kicker) + '</div>' : '<div class="qx-chapter-num">' + L(T.chapter) + ' ' + num(S.ch) + ' ' + L(T.of) + ' ' + num(STORY.length - 1) + '</div>') +
    '<h1 class="mq-title">' + L(c.title) + '</h1>' +
    (c.body ? '<p class="mq-p">' + L(c.body) + '</p>' : '');
  if (c.places) {
    html += '<div class="sm-chips">' + c.places.map(function (pl) { return '<button class="sm-chip' + (S.place === pl.key ? ' is-on' : '') + '" data-place="' + pl.key + '">' + L(pl.name) + '</button>'; }).join('') + '</div><div class="sm-info" id="sm-info"></div>';
  }
  if (c.who) {
    html += '<div class="sm-chips">' + c.who.map(function (w) { return '<button class="sm-chip' + (S.who === w.key ? ' is-on' : '') + '" data-who="' + w.key + '">' + ICON.person + L(w.name) + '</button>'; }).join('') + '</div>';
  }
  if (c.drum) html += '<div class="sm-chips"><button class="sm-chip' + (S.solo ? ' is-on' : '') + '" data-drum="1"' + (S.solo ? ' disabled' : '') + '>' + ICON.drum + L(PLAYDRUM) + '</button></div>';
  if (c.more) html += '<p class="sm-note">' + L(c.more) + '</p>';
  if (c.listen) html += '<div class="sm-chips"><button class="sm-chip' + (S.listen ? ' is-on' : '') + '" data-listen="1"' + (S.listen ? ' disabled' : '') + '>' + ICON.play + L(S.listen ? LISTENING : LISTEN) + '</button></div>';
  if (c.timeline) {
    html += '<div class="qx-timeline sm-timeline">' + c.timeline.map(function (t) {
      return '<div class="qx-tl"><div class="qx-tl-year">' + L(t.year) + '</div><div class="qx-tl-text">' + L(t.text) + '</div></div>';
    }).join('') + '</div><p class="qx-sources">' + L(c.sources) + '</p>';
  }
  if (c.hint && !S.inAR && !(c.places && S.place) && !(c.who && S.who)) html += '<div class="qx-hint"><i></i><span>' + L(c.hint) + '</span></div>';
  panel.className = 'mq-panel qx-enter' + (c.kicker ? ' is-cover' : '') + (c.timeline ? ' is-long' : '');
  panel.innerHTML = html;
  if (c.places) {
    $$('[data-place]', panel).forEach(function (b) { b.addEventListener('click', function () { sfx('tap'); S.place = b.getAttribute('data-place'); goCh(S.ch); }); });
    if (S.place) { var pl = c.places.filter(function (x) { return x.key === S.place; })[0]; $('#sm-info').innerHTML = '<b>' + L(pl.name) + '</b><span>' + L(pl.text) + '</span>'; }
  }
  if (c.who) {
    $$('[data-who]', panel).forEach(function (b) {
      b.addEventListener('click', function () {
        sfx('tap'); S.who = b.getAttribute('data-who');
        var f = S.who === 'lead' ? world.figs[ROW.N + ROW.LEAD] : world.figs[YOU];
        setMarks([function () { return world.toScreen({ x: f.x, y: 1.12, z: f.z }); }]);
        if (!S.inAR) world.view(S.who === 'lead' ? 'leader' : 'end', { k: 1.4 });
        goCh(S.ch);
      });
    });
  }
  if (c.drum) $('[data-drum]', panel).addEventListener('click', playDrumPattern);
  if (c.listen) { var lb = $('[data-listen]', panel); if (lb) lb.addEventListener('click', listenCallAnswer); }
  var last = S.ch === STORY.length - 1;
  setBar({
    back: S.ch > 0 ? function () { goCh(S.ch - 1); renderParts(); } : null,
    buttons: [{ label: S.ch === 0 ? T.begin : last ? T.toHow : T.next, icon: 'next', onClick: function () { sfx('tap'); if (last) setPart('how'); else { goCh(S.ch + 1); renderParts(); } } }]
  });
}
// the next beat that is at least `ahead` seconds away, and when it sounds
function nextBeat(ahead) {
  if (music.playing) { var b = Math.ceil(music.beatAt(music.time() + ahead)); return { b: b, t: music.timeOf(b), spb: music.secPerBeat() }; }
  var spb = 60 / IDLE_BPM;
  return { b: world.beat + ahead / spb, t: music.time() + ahead, spb: spb };
}
// the drum chapter: for two bars the drums come forward and both rows strike together
function playDrumPattern() {
  if (S.solo) return;
  music.ensure();
  if (!music.playing && music.ready()) ambient(0.5);
  var my = token, nb = nextBeat(0.18), dv = music.drumVol;
  S.solo = { b0: nb.b, b1: nb.b + 8 };
  if (music.playing) { music.drumVol = 1.15; music.claps = false; }
  else if (S.sound) [[0, 'dum', 1], [1, 'tak', 0.8], [2, 'dum', 0.9], [2.5, 'dum', 0.5], [3, 'tak', 0.8], [4, 'dum', 1], [5, 'tak', 0.8], [6, 'dum', 0.9], [6.5, 'dum', 0.5], [7, 'tak', 0.8]].forEach(function (e) { music[e[1]](nb.t + e[0] * nb.spb, e[2]); });
  goCh(S.ch);
  setTimeout(function () {
    S.solo = null;
    if (my !== token) return;
    if (music.playing) { music.drumVol = dv; music.claps = true; }
    if (S.part === 'story') goCh(S.ch);
  }, (nb.t + 8 * nb.spb - music.time()) * 1000);
}
// the poetry chapter: the leader's opening, the first row's line, then the answer
function listenCallAnswer() {
  if (S.listen) return;
  music.ensure();
  if (!music.playing && music.ready()) ambient(0.5);
  var my = token, nb = nextBeat(0.2), dv = music.drumVol, spb = nb.spb, t = nb.t;
  S.listen = { b0: nb.b };
  music.drumVol = Math.min(dv, 0.22); music.claps = false;
  if (S.sound) {
    music.sing(t, LINES.waneen, spb, { voices: 1, vol: 0.1 });
    music.sing(t + 4 * spb, LINES.call, spb, { voices: 3, vol: 0.09 });
    music.sing(t + 8 * spb, LINES.answer, spb, { voices: 3, vol: 0.09, shift: -2 });
  }
  goCh(S.ch);
  setTimeout(function () {
    S.listen = null;
    if (my !== token) return;
    if (music.playing) { music.drumVol = dv; music.claps = true; }
    if (S.part === 'story') goCh(S.ch);
  }, (t + 12.5 * spb - music.time()) * 1000);
}
// behind the story, the rows take turns singing and swaying; the two chips above take over for a moment
function ambientRows(b) {
  var A = world.rows[0], B = world.rows[1], Ls = S.listen;
  A.lift = null; B.lift = null;
  if (Ls && b >= Ls.b0 - 0.4) {
    if (b < Ls.b0 + 4) { A.mode = 'hold'; B.mode = 'hold'; }        // the leader's opening, the waneen
    else if (b < Ls.b0 + 8) { A.mode = 'voice'; B.mode = 'hold'; }  // the first row sings the line
    else { A.mode = 'hold'; B.mode = 'voice'; }                     // and the second answers it
    return;
  }
  if (S.solo && b >= S.solo.b0 - 0.4 && b < S.solo.b1) { A.mode = 'beat'; B.mode = 'beat'; return; }
  var phase = Math.floor(Math.max(0, b) / 16) % 2;
  A.mode = phase ? 'sway' : 'sing'; B.mode = phase ? 'sing' : 'sway';
}

// ════════════════════════════════════════════════════════════
// 2. HOW IT'S PERFORMED
// ════════════════════════════════════════════════════════════
function startHow() { S.how = 0; S.howDone = false; startStep(); }
// the gathering as it is when step i begins
function stage(i) {
  quiet();
  resetSeats();
  world.rows[0].mode = 'hold'; world.rows[1].mode = 'hold';
  if (i > 0) { world.setYou(YOU); world.youManual = true; var f = world.youFig(); f.man.hold = 1; f.man.lift = 0; f.man.lean = 0; }
}
function startStep() {
  token++;
  clearStepUI();
  var st = HOW[S.how];
  stage(S.how);
  S.hs = { ok: false, n: 0, t0: now(), msg: null, msgKind: '' };
  if (!S.inAR) world.view(st.view, { k: 1.6 });
  var c = CTRL[st.key];
  if (c.start) c.start(S.hs);
  setGesture(c.gesture ? c.gesture(S.hs) : null);
  renderHow(true);
  if (c.guide) c.guide(S.hs);
}
function stepDone() {
  var hs = S.hs; if (hs.ok) return;
  hs.ok = true;
  setGesture(null); clearGuide(); setMarks(null); cueOff();
  sfx('star'); buzz(20);
  renderHow(false); renderParts();
}
function skipStep() {
  var hs = S.hs; var c = CTRL[HOW[S.how].key];
  hs.ok = true; setGesture(null); clearGuide(); setMarks(null); cueOff();
  if (c.skip) c.skip(hs);
  renderHow(false); renderParts();
}
function renderHow(fresh) {
  if (S.howDone) { renderHowDone(); return; }
  var st = HOW[S.how], hs = S.hs, c = CTRL[st.key];
  var html = '<div class="mq-steps">' + stepsDots(HOW.length, S.how) + '</div>' +
    '<div class="qx-chapter-num">' + L(T.step) + ' ' + num(S.how + 1) + ' ' + L(T.of) + ' ' + num(HOW.length) + '</div>' +
    '<h2 class="mq-title">' + L(st.title) + '</h2>' +
    '<p class="mq-p">' + L(st.text) + '</p>';
  if (c.extra) html += c.extra(hs);
  html += '<div class="mq-status" id="mq-status"></div>';
  panel.className = 'mq-panel sm-how' + (fresh ? ' qx-enter' : '');
  panel.innerHTML = html;
  stepStatus();
  howBar();
}
function stepStatus() {
  var el = $('#mq-status'); if (!el) return;
  var st = HOW[S.how], hs = S.hs, c = CTRL[st.key];
  if (hs.ok) status('good', st.done);
  else if (hs.msg) status(hs.msgKind, hs.msg);
  else if (c.status) status('', c.status(hs));
  else el.className = 'mq-status';
}
function howNext() {
  sfx('tap');
  if (S.how < HOW.length - 1) { S.how++; startStep(); renderParts(); }
  else { token++; clearStepUI(); quiet(); S.howDone = true; resetSeats(); world.setYou(YOU); world.rows[0].mode = 'sing'; world.rows[1].mode = 'sway'; ambient(0.45); renderHowDone(); renderParts(); }
}
function howBack() { if (S.how > 0) { S.how--; startStep(); renderParts(); } }
function howBar() {
  var st = HOW[S.how], hs = S.hs, back = S.how > 0 ? howBack : null;
  if (hs.ok) { setBar({ back: back, buttons: [{ label: S.how === HOW.length - 1 ? T.next : T.nextStep, icon: 'next', onClick: howNext }] }); return; }
  var btns = [{ label: st.hint, kind: 'line', disabled: true, iconFirst: 'hand', cls: 'sm-hintpill' }];
  if (hs.canSkip) btns.push({ label: T.skip, kind: 'line', cls: 'sm-skip', onClick: function () { sfx('tap'); skipStep(); } });
  setBar({ back: back, buttons: btns });
}
function renderHowDone() {
  if (!S.inAR) world.view('rows', { k: 1.3 });
  panel.className = 'mq-panel qx-enter';
  panel.innerHTML = '<div class="mq-steps">' + stepsDots(HOW.length, HOW.length) + '</div>' +
    '<h2 class="mq-title">' + L(HOW_DONE.title) + '</h2><p class="mq-p">' + L(HOW_DONE.text) + '</p>' +
    '<p class="qx-sources">' + L(HOW_DONE.sources) + '</p>';
  setBar({ back: function () { quiet(); S.howDone = false; S.how = HOW.length - 1; startStep(); renderParts(); }, buttons: [{ label: T.toGame, icon: 'next', onClick: function () { sfx('tap'); setPart('play'); } }] });
}

var CTRL = {};

// 1. take your place: drag the gold circle to a seat (a beginner sits at the end)
function seatScreen(row, seat) { var p = world.seatPos(row, seat); return world.toScreen({ x: p.x, y: 0.35, z: p.z }); }
function tokenHome() { var r = panel.getBoundingClientRect(), w = window.innerWidth; return { x: Math.min(w, 430) / 2 + Math.max(0, (w - 430) / 2), y: Math.max(160, r.top - 46) }; }
function placeToken(p, animate) {
  tokenEl.classList.toggle('back', !!animate);
  tokenEl.style.left = p.x + 'px'; tokenEl.style.top = p.y + 'px';
}
CTRL.seat = {
  start: function (hs) {
    world.setShow(world.figs[YOU], 0, true); world.setShow(world.figs[NEAR], 0, true);
    world.rows[0].mode = 'rest'; world.rows[1].mode = 'rest';
    world.showSeatRings([{ row: 1, seat: 8 }, { row: 1, seat: 5 }]);
    tokenEl.hidden = false; tokenEl.innerHTML = ICON.person;
    setTimeout(function () { placeToken(tokenHome()); }, 30);
    var drag = null;
    tokenEl.onpointerdown = function (e) {
      if (hs.ok) return;
      music.ensure();
      drag = { id: e.pointerId }; S.touching = true;
      try { tokenEl.setPointerCapture(e.pointerId); } catch (x) {}
      tokenEl.classList.add('is-drag'); placeToken({ x: e.clientX, y: e.clientY });
    };
    tokenEl.onpointermove = function (e) { if (drag) placeToken({ x: e.clientX, y: e.clientY }); };
    tokenEl.onpointerup = tokenEl.onpointercancel = function (e) {
      if (!drag) return;
      drag = null; S.touching = false; GD.from = now() + 1500;
      tokenEl.classList.remove('is-drag');
      var best = null, bd = 70;
      [8, 5].forEach(function (s) { var q = seatScreen(1, s), d = Math.hypot(q.x - e.clientX, q.y - e.clientY); if (d < bd) { bd = d; best = s; } });
      if (best === 8) {
        tokenEl.hidden = true; world.showSeatRings(null);
        world.setShow(world.figs[YOU], 1); world.setYou(YOU);
        sfx('ok'); buzz(15);
        setTimeout(function () { world.setShow(world.figs[NEAR], 1); }, 700);
        stepDone();
      } else {
        if (best === 5) { hs.msg = SEAT.wrong; hs.msgKind = 'bad'; sfx('bad'); stepStatus(); }
        placeToken(tokenHome(), true);
      }
    };
  },
  skip: function () { tokenEl.hidden = true; world.showSeatRings(null); world.setShow(world.figs[YOU], 1); world.setShow(world.figs[NEAR], 1); world.setYou(YOU); },
  guide: function () { guide('drag', function () { return tokenHome(); }, function () { return seatScreen(1, 8); }); }
};

// 2. tune your drum: tap to hear it; rub water on the skin until the sound is right
function meterHtml(hs) {
  return '<div class="sm-meter"><div class="sm-meter-bar"><i class="z"></i><i class="m" id="sm-mk" style="left:' + (hs.tension * 100).toFixed(1) + '%"></i></div>' +
    '<div class="sm-meter-k"><span>' + L(TUNE.lSlack) + '</span><span>' + L(TUNE.lRight) + '</span><span>' + L(TUNE.lTight) + '</span></div></div>';
}
function inZone(v) { return v >= 0.32 && v <= 0.54; }
CTRL.tune = {
  start: function (hs) { hs.tension = 1; hs.heard = false; hs.wet = 0; world.setDrumTint(YOU, 1); },
  extra: meterHtml,
  gesture: function (hs) {
    var last = null, dir = 0, travel = 0, moved = 0;
    function rub() {
      if (hs.ok) return;
      if (hs.tension <= 0.45) { hs.msg = TUNE.ready; hs.msgKind = ''; stepStatus(); return; }
      hs.tension = Math.max(0.44, hs.tension - 0.11); hs.wet = Math.min(1, hs.wet + 0.18);
      world.setDrumTint(YOU, 1 - hs.wet * 0.35);
      sfx('splash'); buzz(5);
      var mk = $('#sm-mk', panel); if (mk) mk.style.left = (hs.tension * 100).toFixed(1) + '%';
      hs.msg = inZone(hs.tension) ? TUNE.ready : TUNE.wet; hs.msgKind = ''; stepStatus();
      if (inZone(hs.tension)) CTRL.tune.guide(hs);
    }
    function tap() {
      if (hs.ok) return;
      music.ensure();
      if (S.sound) music.dum(music.time() + 0.01, 1, hs.tension);
      world.youDo('strike'); buzz(8);
      if (inZone(hs.tension)) { setTimeout(stepDone, 450); return; }
      hs.msg = hs.heard ? TUNE.still : TUNE.first; hs.msgKind = 'bad'; hs.heard = true; stepStatus();
      CTRL.tune.guide(hs);
    }
    return {
      down: function (p) { last = p.x; dir = 0; travel = 0; moved = 0; },
      move: function (p) {
        if (last == null) return;
        var dx = p.x - last; last = p.x; moved += Math.abs(dx);
        if (!dx) return;
        var d = dx > 0 ? 1 : -1;
        if (d !== dir) { if (travel > 26) rub(); dir = d; travel = 0; }
        travel += Math.abs(dx);
      },
      up: function () { if (moved < 12) tap(); else if (travel > 26) rub(); last = null; }
    };
  },
  guide: function (hs) {
    var at = youDrumScreen();
    if (!hs.heard || inZone(hs.tension)) guide('tap', at, null, TUNE.lTap); else guide('lr', at, null, TUNE.lRub);
  }
};

// 3. call and answer: the first row sings, you hold to sing your row's answer
function phraseHtml(hs) {
  return '<div class="sm-phrase"><div class="a" id="sm-ph-a"><i></i><small>' + L(ANS.row1) + '</small><b>' + L(ANS.yisheel) + '</b></div>' +
    '<div class="me" id="sm-ph-b"><i></i><small>' + L(ANS.row2) + '</small><b>' + L(ANS.marrad) + '</b></div></div>';
}
CTRL.answer = {
  start: function (hs) {
    music.ensure(); music.drumVol = 0.4; music.claps = false;
    music.start('heavy', 0.3);
    hs.b0 = 4; hs.good = 0; hs.sched = {}; hs.holding = false; hs.cycDone = -1;
    CTRL.answer.schedule(hs, 0);
  },
  // the first row's line for cycle k
  schedule: function (hs, k) {
    if (hs.sched[k]) return; hs.sched[k] = true;
    if (S.sound) music.sing(music.timeOf(hs.b0 + k * 8), LINES.call, music.secPerBeat(), { voices: 3, vol: 0.09 });
  },
  extra: phraseHtml,
  frame: function (hs) {
    var b = world.beat, pos = b - hs.b0;
    var a = $('#sm-ph-a i', panel), me = $('#sm-ph-b i', panel);
    if (pos < 0) { world.rows[0].mode = 'hold'; return; }
    var k = Math.floor(pos / 8), inC = pos - k * 8;
    if (inC > 6.5) CTRL.answer.schedule(hs, k + 1);
    world.rows[0].mode = inC < 4 ? 'voice' : 'hold';
    if (a) a.style.width = (inC < 4 ? inC / 4 * 100 : 0).toFixed(1) + '%';
    $('#sm-ph-a', panel) && $('#sm-ph-a', panel).classList.toggle('on', inC < 4);
    $('#sm-ph-b', panel) && $('#sm-ph-b', panel).classList.toggle('on', inC >= 4);
    if (me) me.style.width = (hs.holding && hs.holdK === k ? clamp((inC - 4) / 4, 0, 1) * 100 : 0).toFixed(1) + '%';
    if (inC < 4 && hs.lastPhase !== 'call' + k) { hs.lastPhase = 'call' + k; if (!hs.ok) { hs.msg = ANS.listen; hs.msgKind = ''; stepStatus(); guide('hold', cueSpot, null, ANS.lHold); GD.from = now() + 1e9; } }
    if (inC >= 4 && hs.lastPhase !== 'ans' + k) { hs.lastPhase = 'ans' + k; if (!hs.ok && !hs.holding) { hs.msg = ANS.turn; hs.msgKind = ''; stepStatus(); GD.from = now(); } }
    // held right through to the end of the line
    if (hs.holding && (k > hs.holdK || inC >= 7.85)) CTRL.answer.finish(hs, true);
    if (!hs.holding && inC > 6 && inC < 6.2 && hs.pressK !== k && !hs.ok && hs.missK !== k) { hs.missK = k; hs.msg = ANS.missed; hs.msgKind = 'bad'; stepStatus(); }
  },
  finish: function (hs, ok) {
    hs.holding = false; world.youSing(false); world.rows[1].mode = 'hold';
    if (ok) {
      hs.good++; sfx('ok'); buzz(12); hs.msg = ANS.good; hs.msgKind = 'good'; stepStatus();
      if (hs.good >= 2) { setTimeout(function () { music.stop(); }, 1200); stepDone(); }
    } else {
      if (hs.voice) hs.voice.stop(); hs.msg = ANS.early; hs.msgKind = 'bad'; sfx('bad'); stepStatus();
    }
    hs.voice = null;
  },
  gesture: function (hs) {
    return {
      down: function () {
        if (hs.ok) return;
        var pos = music.beatAt(inTime()) - hs.b0; if (pos < 0) return;
        var k = Math.floor(pos / 8), inC = pos - k * 8;
        if (inC < 3.6) { hs.msg = ANS.wait; hs.msgKind = 'bad'; stepStatus(); return; }
        if (inC > 5.2) { hs.msg = ANS.late; hs.msgKind = 'bad'; stepStatus(); return; }
        hs.holding = true; hs.holdK = k; hs.pressK = k;
        var start = Math.max(music.time() + 0.02, music.timeOf(hs.b0 + k * 8 + 4));
        if (S.sound) hs.voice = music.sing(start, LINES.answer, music.secPerBeat(), { voices: 3, vol: 0.1, shift: -2 });
        world.youSing(true); world.rows[1].mode = 'voice';
        hs.msg = null; stepStatus();
      },
      up: function () {
        if (!hs.holding) return;
        var pos = music.beatAt(inTime()) - hs.b0, k = Math.floor(pos / 8), inC = pos - k * 8;
        CTRL.answer.finish(hs, k > hs.holdK || inC >= 7.55);
      }
    };
  },
  skip: function () { music.stop(); }
};

// 4. keep the beat: tap on every beat with the drums
function judgeOffset(err, ok, perfect) {
  if (Math.abs(err) <= perfect) return 'perfect';
  if (Math.abs(err) <= ok) return 'good';
  return err < 0 ? 'early' : 'late';
}
CTRL.beat = {
  start: function (hs) {
    hs.good = 0;
    world.rows[0].mode = 'beat'; world.rows[1].mode = 'beat';
    music.ensure(); music.drumVol = 1; music.claps = false; music.start('heavy', 0.4);
  },
  gesture: function (hs) {
    return swiper({ onTap: function (p, at) {
      if (hs.ok) return;
      var t = at, b = music.beatAt(t), nb = Math.round(b), err = (b - nb) * music.secPerBeat();
      world.youDo('strike'); if (S.sound) music.tak(music.time(), 0.45);
      var j = judgeOffset(err, 0.13, 0.065);
      var y = youDrumScreen()(); y = y ? y.y - 70 : null;
      if (j === 'perfect' || j === 'good') { hs.good++; judgeShow(JUDGE[j], j, y); buzz(6); hs.msg = null; }
      else { judgeShow(JUDGE[j], 'miss', y); hs.msg = JUDGE[j]; hs.msgKind = 'bad'; }
      if (hs.good >= 8) { setTimeout(function () { music.stop(); }, 600); stepDone(); } else stepStatus();
    } });
  },
  frame: function (hs) {
    // a ring around your drum that pulses on every beat
    if (!CU.on && !hs.ok) cue('tap', Math.ceil(world.beat), youDrumScreen());
    if (CU.on && world.beat > CU.beat + 0.25) CU.beat = Math.ceil(world.beat);
  },
  status: function (hs) { return { en: hs.good + ' of 8 on the beat', ar: num(hs.good) + ' من ' + num(8) + ' مع الإيقاع' }; },
  guide: function () { guide('tap', youDrumScreen(), null, null); },
  skip: function () { music.stop(); }
};

// 5. the sway: swipe right on the first beat of the bar and left on the third
function swayWant(nb) { return ((nb % 4) + 4) % 4 === 0 ? 'right' : 'left'; }
CTRL.sway = {
  start: function (hs) {
    hs.good = 0;
    world.rows[0].mode = 'sing'; world.rows[1].mode = 'sway';
    music.ensure(); music.drumVol = 0.9; music.claps = true; music.start('heavy', 0.4);
  },
  gesture: function (hs) {
    return swiper({ min: 28, onSwipe: function (dir) {
      if (hs.ok) return;
      if (dir !== 'left' && dir !== 'right') return;
      world.youDo(dir);
      var t = inTime(), b = music.beatAt(t), nb = Math.round(b / 2) * 2, err = (b - nb) * music.secPerBeat();
      var want = swayWant(nb), y = cueSpot().y - 80;
      if (dir !== want) { judgeShow(want === 'right' ? JUDGE.wrongR : JUDGE.wrongL, 'miss', y); hs.msg = want === 'right' ? JUDGE.wrongR : JUDGE.wrongL; hs.msgKind = 'bad'; stepStatus(); return; }
      var j = judgeOffset(err, 0.16, 0.075);
      if (j === 'perfect' || j === 'good') { hs.good++; judgeShow(JUDGE[j], j, y); buzz(6); hs.msg = null; }
      else { judgeShow(JUDGE[j], 'miss', y); hs.msg = JUDGE[j]; hs.msgKind = 'bad'; }
      if (hs.good >= 8) { setTimeout(function () { music.stop(); }, 600); stepDone(); } else stepStatus();
    } });
  },
  frame: function (hs) {
    if (hs.ok) return;
    var nb = Math.ceil((world.beat - 0.3) / 2) * 2;
    if (!CU.on || CU.beat !== nb) { var w = swayWant(nb); cue(w, nb, cueSpot, w === 'right' ? JUDGE.lRight : JUDGE.lLeft); }
  },
  status: function (hs) { return { en: hs.good + ' of 8 in time', ar: num(hs.good) + ' من ' + num(8) + ' مع الإيقاع' }; },
  skip: function () { music.stop(); }
};

// 6. lift and lower the drum with your row, then slap it down with everyone
// the rows go round a 20-beat cycle from beat 4: up, down, up, down, the slap, and a bar to pick
// the drums back up. If you miss a move, you join again on the row's next cycle
var KH_CYC = 20;
function khCycle(n) { var c = 4 + n * KH_CYC; return [{ b: c, k: 'up' }, { b: c + 4, k: 'down' }, { b: c + 8, k: 'up' }, { b: c + 12, k: 'down' }, { b: c + 16, k: 'khallu' }]; }
// the moment everyone slaps the drums down: the slap replaces the next stroke, then the drums stop
function khalluAt(b) {
  world.khalluAt = b; music.drums = false;
  if (S.sound) music.slap(music.timeOf(b), 1);
  setTimeout(function () { world.bump(1.1); buzz([30, 30, 60]); }, Math.max(0, (music.timeOf(b) + music.latency() - music.time()) * 1000));
}
CTRL.khallu = {
  start: function (hs) {
    // both rows sway and strike; the drums go up and down together on the cues
    world.rows[0].mode = 'sway'; world.rows[1].mode = 'sway';
    music.ensure(); music.drumVol = 0.9; music.claps = false; music.drums = true; music.start('heavy', 0.4);
    hs.cyc = 0; hs.script = khCycle(0); hs.i = 0; hs.slapN = -1; hs.tried = false;
  },
  frame: function (hs) {
    var b = world.beat;
    var c0 = 4 + Math.max(0, Math.floor((b - 3.9) / KH_CYC)) * KH_CYC, inC = b - c0;
    var up = (inC >= -0.1 && inC < 3.9) || (inC >= 7.9 && inC < 11.9) ? 1 : 0;
    world.rows[0].lift = up; world.rows[1].lift = up;
    // everyone slaps the drums down together (scheduled a moment ahead), and the drums come back for the next cycle
    var sb = music.beatAt(music.time()), sn = Math.max(0, Math.ceil((sb - 20) / KH_CYC)), sbeat = 20 + sn * KH_CYC;
    if (hs.slapN < sn && sbeat - sb < 0.4) { hs.slapN = sn; khalluAt(sbeat); }
    if (!music.drums && hs.slapN >= 0 && sb > 20 + hs.slapN * KH_CYC + 3.5) music.drums = true;
    if (hs.ok) return;
    var c = hs.script[hs.i];
    if (c && b > c.b + 0.6) {
      // missed a move: the row goes on, and you join again on its next cycle
      if (hs.tried) { judgeShow(JUDGE.miss, 'miss', cueSpot().y - 80); hs.msg = JUDGE.again; hs.msgKind = 'bad'; stepStatus(); }
      hs.cyc++; hs.script = khCycle(hs.cyc); hs.i = 0;
      return;
    }
    if (c && (!CU.on || CU.beat !== c.b)) cue(c.k === 'khallu' ? 'khallu' : c.k, c.b, cueSpot, c.k === 'up' ? JUDGE.lUp : c.k === 'down' ? JUDGE.lDown : JUDGE.lSlap);
  },
  gesture: function (hs) {
    return swiper({ min: 28, onSwipe: function (dir) {
      if (hs.ok) return;
      var c = hs.script[hs.i]; if (!c) return;
      hs.tried = true;
      var t = inTime(), b = music.beatAt(t), err = (b - c.b) * music.secPerBeat();
      var want = c.k === 'khallu' ? 'down' : c.k;
      if (dir === 'up' || dir === 'down') world.youDo(c.k === 'khallu' && dir === 'down' ? 'khallu' : dir);
      if (Math.abs(err) > 0.4) return;
      var jy = cueSpot().y - 80;
      if (dir !== want) { judgeShow(JUDGE.miss, 'miss', jy); return; }
      var j = judgeOffset(err, 0.24, 0.1);
      if (j === 'perfect' || j === 'good') {
        judgeShow(JUDGE[j], j, jy); buzz(8);
        hs.i++;
        if (c.k === 'khallu') { cueOff(); setTimeout(function () { music.stop(); }, 1500); setTimeout(stepDone, 700); }
      } else judgeShow(JUDGE[j], 'miss', jy);
    } });
  },
  status: function (hs) { return { en: 'Watch the circle and move when it closes.', ar: 'تابع الدائرة وتحرك لما تنقفل.' }; },
  skip: function () { music.stop(); }
};

// ════════════════════════════════════════════════════════════
// 3. THE GAME: questions for the mu'allim, then move up the row
// ════════════════════════════════════════════════════════════
function newGame() {
  return { phase: 'intro', qi: 0, score: 0, answered: null, order: QUESTIONS.map(function (q) { return shuffle(q.options); }), seatsBest: 0, plays: 0, row: null, over: false };
}
function startPlay() {
  S.game = newGame();
  resetSeats(); world.setYou(YOU);
  world.rows[0].mode = 'sing'; world.rows[1].mode = 'sway';
  ambient(0.35);
  if (!S.inAR) world.view('rows', { k: 1.3 });
  renderGame();
}
function renderGame() {
  var g = S.game;
  if (g.over) return renderResults();
  if (g.phase === 'intro') return renderIntro();
  if (g.phase === 'q') return renderQuestion();
  if (g.phase === 'rowIntro') return renderRowIntro();
  if (g.phase === 'row') { panel.innerHTML = ''; panel.className = 'mq-panel'; setBar({ buttons: [] }); return; }
  if (g.phase === 'rowDone') return renderRowDone();
}
function leadHead(sub) {
  return '<div class="sm-lead">' + MUALLIM + '<div><div class="sm-lead-name">' + L(G.name) + '</div><div class="sm-lead-role">' + L(sub || G.role) + '</div></div></div>';
}
function renderIntro() {
  panel.className = 'mq-panel qx-enter';
  panel.innerHTML = leadHead() + '<h2 class="mq-title">' + L(G.introT) + '</h2><p class="mq-p">' + L(G.introP) + '</p>';
  setBar({ buttons: [{ label: G.start, icon: 'next', onClick: function () { sfx('tap'); S.game.phase = 'q'; S.game.qi = 0; renderGame(); renderParts(); } }] });
}
function renderQuestion() {
  var g = S.game, q = QUESTIONS[g.qi], opts = g.order[g.qi], ans = g.answered;
  var html = '<div class="qx-kicker">' + L(G.r1) + ' · ' + num(g.qi + 1) + '/' + num(QUESTIONS.length) + '</div>' +
    '<h2 class="mq-title sm-q">' + L(q.prompt) + '</h2>';
  html += '<div class="sm-opts">' + opts.map(function (k) {
    var cls = 'sm-opt';
    if (ans) { if (k === q.answer) cls += ' is-right'; else if (k === ans) cls += ' is-wrong'; else cls += ' is-dim'; }
    return '<button class="' + cls + '" data-opt="' + k + '"' + (ans ? ' disabled' : '') + '>' + L(q.labels[k]) + '</button>';
  }).join('') + '</div>';
  if (ans) html += '<div class="qx-feedback ' + (ans === q.answer ? 'good' : 'bad') + '">' + (ans === q.answer ? ICON.check : ICON.info) + '<span>' + L(ans === q.answer ? q.good : q.bad) + '</span></div>';
  panel.className = 'mq-panel is-game' + (ans ? '' : ' qx-enter');
  panel.innerHTML = html;
  $$('[data-opt]', panel).forEach(function (b) { b.addEventListener('click', function () { answer(b.getAttribute('data-opt')); }); });
  if (ans) {
    var last = g.qi === QUESTIONS.length - 1;
    setBar({ buttons: [{ label: T.next, icon: 'next', onClick: function () {
      sfx('tap'); g.answered = null;
      if (last) g.phase = 'rowIntro'; else g.qi++;
      renderGame(); renderParts();
    } }] });
  } else setBar({ buttons: [] });
}
function answer(k) {
  var g = S.game, q = QUESTIONS[g.qi];
  if (g.answered) return;
  g.answered = k;
  if (k === q.answer) { g.score++; sfx('ok'); buzz(15); }
  else { sfx('bad'); buzz([20, 40, 20]); }
  renderQuestion();
}

// ── round 2: a whole Samri, and moving up the row ──
// beats: a bar to count in, then four passages: heavy (sway, then sing), light (sway, then sing).
// In the last bar both rows take up the drums and strike together, then slap them down
var SECS = [
  { from: 4, mine: 'sway', style: 'heavy', lift: [20, 24] },
  { from: 32, mine: 'sing', style: 'heavy' },
  { from: 52, mine: 'sway', style: 'light', lift: [68, 72] },
  { from: 80, mine: 'sing', style: 'light' }
];
var FINALE_B = 92, KHALLU_B = 96, ROW_END = 99;
function buildChart() {
  var notes = [];
  SECS.forEach(function (s, i) {
    if (s.mine === 'sway') {
      for (var k = 0; k < 4; k++) { notes.push({ b: s.from + 4 * k, k: 'right', s: i }); notes.push({ b: s.from + 4 * k + 2, k: 'left', s: i }); }
      notes.push({ b: s.from + 16, k: 'up', s: i }); notes.push({ b: s.from + 20, k: 'down', s: i });
    } else for (var j = 0; j < 16; j++) notes.push({ b: s.from + j, k: 'tap', s: i });
  });
  notes.push({ b: KHALLU_B, k: 'khallu', s: 3 });
  return notes;
}
function moveChip(kind, label) { return '<div class="sm-move"><span class="sm-move-i">' + iconFor(kind) + '</span><b>' + L(label) + '</b></div>'; }
function renderRowIntro() {
  var g = S.game;
  resetSeats(); world.setYou(YOU);
  if (!S.inAR) world.view('game', { k: 1.3 });
  panel.className = 'mq-panel is-game qx-enter';
  panel.innerHTML = '<div class="qx-kicker">' + L(G.r2) + '</div>' +
    '<div class="sm-bubble">' + MUALLIM + '<p>' + L(g.plays ? RW.intro2 : RW.intro) + '</p></div>' +
    '<div class="sm-moves">' + moveChip('tap', RW.tap) + moveChip('lr', RW.lean) + moveChip('up', RW.lift) + moveChip('khallu', RW.slap) + '</div>' +
    '<p class="sm-tip">' + L(RW.tip) + '</p>';
  setBar({ buttons: [{ label: RW.ready, icon: 'next', onClick: function () { sfx('tap'); startRow(); } }] });
}
function startRow() {
  var g = S.game, my = ++token;
  quiet();
  g.phase = 'row'; g.plays++;
  var notes = buildChart();
  g.row = { notes: notes, seat: 8, moved: 0, combo: 0, best: 0, perfect: 0, good: 0, miss: 0, secDone: {}, secShown: {}, ended: false };
  resetSeats(); world.setYou(YOU); world.youManual = true;
  renderGame();
  document.body.classList.add('sm-playing');
  music.ensure(); music.drumVol = 1; music.claps = false; music.drums = true;
  music.start('heavy', 0.6);
  music.change('light', SECS[2].from - 4);
  setGesture(swiper({ min: 26, onSwipe: function (dir) { rowInput(dir); }, onTap: function (p, at) { rowInput('tap', at); } }));
  buildTrack(); showRowHUD();
  if (!S.inAR) world.view('game', { k: 1.2 });
}
// what the rows do at each moment of the Samri
function rowModes(b) {
  var A = world.rows[0], B = world.rows[1];
  A.lift = null; B.lift = null;
  if (b < 3.5) { A.mode = 'hold'; B.mode = 'hold'; music.claps = false; return -1; }
  if (b >= KHALLU_B + 1.4) { A.mode = 'rest'; B.mode = 'rest'; return 4; }
  // the last bar: everyone on the drums, ready to slap them down
  if (b >= FINALE_B - 0.5) { A.mode = 'beat'; B.mode = 'beat'; music.claps = false; return 3; }
  var s = 0; for (var i = 0; i < SECS.length; i++) if (b >= SECS[i].from - 2) s = i;
  var sec = SECS[s];
  music.claps = true;
  if (sec.mine === 'sway') {
    A.mode = 'sing'; B.mode = 'sway';
    B.lift = b >= sec.lift[0] && b < sec.lift[1] ? 1 : 0;
  } else { A.mode = 'sway'; B.mode = 'sing'; }
  return s;
}
function rowInput(kind, at) {
  var g = S.game, r = g && g.row; if (!r || r.ended) return;
  var t = at != null ? at : inTime(), b = music.beatAt(t), spb = music.secPerBeat();
  // your performer moves either way: a clap when your row sings, a stroke on the drum otherwise
  if (kind === 'tap') world.youDo(world.rows[1].mode === 'sing' ? 'clap' : 'strike');
  else if (kind === 'left' || kind === 'right') world.youDo(kind);
  else if (kind === 'up') world.youDo('up');
  else if (kind === 'down') world.youDo(b > KHALLU_B - 1 ? 'khallu' : 'down');
  // find the closest note still waiting
  var best = null, bd = 0.26;
  for (var i = 0; i < r.notes.length; i++) {
    var n = r.notes[i]; if (n.res) continue;
    var d = Math.abs((b - n.b) * spb); if (d < bd) { bd = d; best = n; }
    if (n.b > b + 2) break;
  }
  if (!best) return;
  var want = best.k === 'khallu' ? 'down' : best.k;
  var err = (b - best.b) * spb;
  var j = kind !== want ? 'miss' : Math.abs(err) <= 0.08 ? 'perfect' : Math.abs(err) <= 0.16 ? 'good' : 'miss';
  judgeNote(best, j);
}
function judgeNote(n, j) {
  var r = S.game.row;
  n.res = j;
  if (j === 'miss') { r.miss++; r.combo = 0; }
  else { r[j]++; r.combo++; r.best = Math.max(r.best, r.combo); }
  var hit = $('.sm-hit', trackEl);
  if (j !== 'miss' && hit) { hit.classList.remove('flash'); void hit.offsetWidth; hit.classList.add('flash'); }
  if (n.el) n.el.classList.add(j === 'miss' ? 'miss' : 'done');
  var tr = trackEl.getBoundingClientRect();
  judgeShow(JUDGE[j], j, tr.top - 34);
  if (j !== 'miss') buzz(5);
  renderRowHUD();
}
function buildTrack() {
  var r = S.game.row;
  trackEl.hidden = false;
  var html = '<div class="sm-hit"></div>';
  for (var b = 4; b <= KHALLU_B; b += 4) html += '<i class="sm-bar-line" data-b="' + b + '"></i>';
  trackEl.innerHTML = html;
  r.notes.forEach(function (n) {
    var el = document.createElement('div'); el.className = 'sm-n k-' + n.k; el.innerHTML = iconFor(n.k); el.style.display = 'none';
    trackEl.appendChild(el); n.el = el;
  });
  r.lines = $$('.sm-bar-line', trackEl).map(function (el) { return { el: el, b: +el.getAttribute('data-b') }; });
}
var PX_PER_S = 150, HIT_X = 37;
function frameTrack() {
  var r = S.game.row, tNow = music.time() - music.latency(), w = trackEl.clientWidth || 380;
  var horizon = (w - HIT_X + 30) / PX_PER_S;
  r.notes.forEach(function (n) {
    var dt = music.timeOf(n.b) - tNow;
    if (dt > horizon || dt < -0.4) { if (n.el.style.display !== 'none') n.el.style.display = 'none'; return; }
    n.el.style.display = '';
    n.el.style.transform = 'translateX(' + (HIT_X + dt * PX_PER_S).toFixed(1) + 'px)';
  });
  r.lines.forEach(function (l) {
    var dt = music.timeOf(l.b) - tNow;
    if (dt > horizon || dt < -0.3) { l.el.style.display = 'none'; return; }
    l.el.style.display = ''; l.el.style.left = (HIT_X + dt * PX_PER_S).toFixed(1) + 'px';
  });
}
function showRowHUD() {
  hudEl.hidden = false;
  hudEl.innerHTML = '<div><small>' + L(RW.seats) + '</small><span class="sm-seats" id="sm-seats"></span></div><div class="sm-combo"><small>' + L(RW.combo) + '</small><b id="sm-combo">0</b></div>';
  renderRowHUD();
}
function renderRowHUD() {
  var r = S.game && S.game.row; if (!r || hudEl.hidden) return;
  var el = $('#sm-seats', hudEl); if (!el) return;
  var h = '';
  for (var s = 0; s < ROW.N; s++) h += '<i class="' + (s === ROW.LEAD ? 'lead' : s === r.seat ? 'me' : '') + '"></i>';
  el.innerHTML = h;
  $('#sm-combo', hudEl).textContent = num(r.combo);
}
function rowFrame() {
  var g = S.game; if (!g || g.phase !== 'row') return;
  var r = g.row; if (!r || r.ended) return;
  var b = world.beat, tNow = music.time() - music.latency();
  var s = rowModes(b);
  // passage banners
  SECS.forEach(function (sec, i) { if (!r.secShown[i] && b >= sec.from - 3) { r.secShown[i] = true; shout(RW.sec[i], 'round'); } });
  if (!r.finShown && b >= FINALE_B - 1.5) { r.finShown = true; shout(RW.finale, 'round'); }
  // the drums slapped down together
  if (!r.slapped && music.beatAt(music.time()) > KHALLU_B - 0.4) { r.slapped = true; khalluAt(KHALLU_B); }
  // notes that went by without a move
  r.notes.forEach(function (n) { if (!n.res && music.timeOf(n.b) < tNow - 0.26) judgeNote(n, 'miss'); });
  // at the end of each passage, the mu'allim may call you closer
  SECS.forEach(function (sec, i) {
    if (r.secDone[i]) return;
    var mine = r.notes.filter(function (n) { return n.s === i; });
    if (!mine.every(function (n) { return n.res; })) return;
    r.secDone[i] = true;
    var acc = mine.reduce(function (a, n) { return a + (n.res === 'perfect' ? 1 : n.res === 'good' ? 0.6 : 0); }, 0) / mine.length;
    if (acc >= 0.7) {
      r.moved++; r.seat = Math.max(ROW.LEAD + 1, r.seat - 1);
      world.moveYou(r.seat); sfx('ok');
      setTimeout(function () { shout(RW.up, 'good'); }, 200);
    } else setTimeout(function () { shout(RW.stay, ''); }, 200);
    renderRowHUD();
  });
  frameTrack();
  if (b > ROW_END) endRow();
}
function endRow() {
  var g = S.game, r = g.row;
  r.ended = true; setGesture(null);
  music.stop();
  g.seatsBest = Math.max(g.seatsBest, r.moved);
  g.phase = 'rowDone';
  setTimeout(function () {
    if (S.part !== 'play' || g.phase !== 'rowDone') return;
    trackEl.hidden = true; hudEl.hidden = true; document.body.classList.remove('sm-playing');
    if (r.moved >= 4) sfx('win'); else sfx('star');
    if (!S.inAR) world.view('game', { k: 1 });
    renderRowDone(); renderParts();
  }, 600);
}
function renderRowDone() {
  var g = S.game, r = g.row;
  var total = r.notes.length, acc = Math.round((r.perfect + r.good * 0.6) / total * 100);
  var line = r.moved >= 4 ? RW.end4 : r.moved >= 2 ? RW.end2 : RW.end0;
  var stat = function (label, v) { return '<div><small>' + L(label) + '</small><b>' + v + '</b></div>'; };
  panel.className = 'mq-panel is-game qx-enter';
  panel.innerHTML = '<div class="sm-bubble">' + MUALLIM + '<p>' + L(line) + '</p></div>' +
    '<div class="sm-stats">' + stat(RW.moved, num(r.moved) + '/' + num(4)) + stat(RW.acc, num(acc) + '%') + stat(RW.best, num(r.best)) + '</div>';
  setBar({ buttons: [
    { label: RW.againRow, kind: 'line', iconFirst: 'replay', onClick: function () { sfx('tap'); g.phase = 'rowIntro'; renderGame(); renderParts(); } },
    { label: T.next, icon: 'next', onClick: function () { sfx('tap'); endGame(); } }
  ] });
}
function starsFor(score) { return score >= MAX_SCORE ? 3 : score >= MAX_SCORE - 2 ? 2 : 1; }
function endGame() {
  var g = S.game, total = g.score + g.seatsBest;
  g.over = true; g.phase = 'over';
  var stars = starsFor(total);
  try {
    var all = JSON.parse(localStorage.getItem('cl_progress') || '{}');
    var prev = all.samri || {};
    all.samri = { score: Math.max(total, prev.score || 0), last: total, max: MAX_SCORE, stars: Math.max(stars, prev.stars || 0), at: new Date().toISOString() };
    localStorage.setItem('cl_progress', JSON.stringify(all));
  } catch (e) {}
  sfx('star');
  ambient(0.35);
  renderResults();
  renderParts();
}
function renderResults() {
  var g = S.game, total = g.score + g.seatsBest, stars = starsFor(total);
  var title = RESULT_TITLES.filter(function (r) { return total >= r.min; })[0].t;
  panel.className = 'mq-panel mq-results qx-enter';
  panel.innerHTML = '<div class="mq-stars">' + [0, 1, 2].map(function (i) { return '<i class="' + (i < stars ? 'on' : '') + '">' + ICON.star + '</i>'; }).join('') + '</div>' +
    '<h2 class="mq-title">' + L(title) + '</h2>' +
    '<p class="mq-p">' + L(G.score) + ': ' + num(total) + ' / ' + num(MAX_SCORE) + '</p>' +
    '<div class="sm-split"><span>' + L(G.quizPart) + ' <b>' + num(g.score) + '/' + num(QUESTIONS.length) + '</b></span><span>' + L(G.rowPart) + ' <b>' + num(g.seatsBest) + '/' + num(4) + '</b></span></div>' +
    '<div class="mq-learn"><div class="qx-kicker">' + L(G.learned) + '</div>' + LEARN.map(function (l) { return '<div class="mq-learn-row">' + ICON.check + '<span>' + L(l) + '</span></div>'; }).join('') + '</div>';
  setBar({ buttons: [
    { label: G.again, kind: 'line', iconFirst: 'replay', onClick: function () { sfx('tap'); setPart('play'); } },
    { label: G.finish, onClick: function () { location.href = 'experience.html?x=samri'; } }
  ] });
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
  try { await world.enterAR(root); } catch (e) { console.error(e); toast(T.arFail); }
}
function renderScan() {
  panel.className = 'mq-panel qx-enter';
  panel.innerHTML = '<div class="qx-kicker">' + L(T.ar) + '</div><h2 class="mq-title">' + L(T.arScanT) + '</h2><p class="mq-p">' + L(T.arScanP) + '</p><div class="mq-status show" id="sm-scan">' + L(world.canPlace() ? T.arGood : T.arWait) + '</div>';
  setBar({ buttons: [
    { label: T.arFloor, kind: world.arScale === 1 ? 'solid' : 'line', id: 'sm-floor', onClick: function () { world.setARScale(1); renderScan(); } },
    { label: T.arTable, kind: world.arScale < 1 ? 'solid' : 'line', id: 'sm-table', onClick: function () { world.setARScale(0.16); renderScan(); } },
    { label: T.arPlace, id: 'sm-place', disabled: !world.canPlace(), onClick: function () { if (world.placeField()) { sfx('ok'); buzz(20); } } }
  ] });
  $$('#sm-floor, #sm-table', bar).forEach(function (b) { b.classList.add('mq-chip'); });
}
function onARState(st) {
  if (st === 'scanning') {
    S.inAR = true; S.arPlaced = false;
    document.documentElement.classList.add('mq-in-ar');
    renderAR(); renderScan();
  } else if (st === 'placed') {
    S.arPlaced = true; renderAR(); resume();
  } else if (st === 'ended') {
    S.inAR = false; S.arPlaced = false;
    document.documentElement.classList.remove('mq-in-ar');
    renderAR(); resume();
    var g = S.game;
    var v = S.part === 'story' ? STORY[S.ch].scene : S.part === 'how' ? (S.howDone ? 'rows' : HOW[S.how].view) : (g && (g.phase === 'row' || g.phase === 'rowIntro') ? 'game' : 'rows');
    world.view(v, { snap: true });
  }
}
function resume() {
  if (S.part === 'story') goCh(S.ch);
  else if (S.part === 'how') renderHow(false);
  else renderGame();
}

// ════════════════════════════════════════════════════════════
// touch: gestures for the steps and the game, or drag to look around
// ════════════════════════════════════════════════════════════
function wireTouch() {
  var orbit = null, pid = null;
  touch.addEventListener('pointerdown', function (e) {
    if (pid !== null) return;
    if (S.inAR && !S.arPlaced) return;
    pid = e.pointerId; S.touching = true;
    try { touch.setPointerCapture(e.pointerId); } catch (x) {}
    if (S.gest) { if (S.gest.down) S.gest.down(pt(e), e); return; }
    if (S.inAR) return;
    orbit = { x: e.clientX, y: e.clientY, yaw: world.orbit.yaw, pitch: world.orbit.pitch }; world.orbit.on = true;
  });
  touch.addEventListener('pointermove', function (e) {
    if (e.pointerId !== pid) return;
    if (S.gest) { if (S.gest.move) S.gest.move(pt(e), e); return; }
    if (!orbit) return;
    world.orbit.yaw = orbit.yaw - (e.clientX - orbit.x) * 0.006;
    world.orbit.pitch = clamp(orbit.pitch - (e.clientY - orbit.y) * 0.004, -0.5, 0.5);
  });
  function up(e) {
    if (e.pointerId !== pid) return;
    pid = null; S.touching = false; GD.from = now() + 1800;
    if (S.gest && S.gest.up) S.gest.up(pt(e), e);
    orbit = null; world.orbit.on = false;
  }
  touch.addEventListener('pointerup', up);
  touch.addEventListener('pointercancel', up);
  touch.addEventListener('beforexrselect', function (e) { e.preventDefault(); });
}
function makeOverlays() {
  root.insertAdjacentHTML('beforeend',
    '<div class="sm-markl" id="sm-markl" aria-hidden="true"></div>' +
    '<div class="sm-guide" id="sm-guide" hidden aria-hidden="true"></div>' +
    '<div class="sm-cue" id="sm-cue" hidden aria-hidden="true"></div>' +
    '<div class="sm-judge" id="sm-judge" aria-live="polite"></div>' +
    '<div class="sm-token" id="sm-token" hidden></div>' +
    '<div class="sm-hud" id="sm-hud" hidden></div>' +
    '<div class="sm-track" id="sm-track" hidden aria-hidden="true"></div>');
  markEl = $('#sm-markl'); guideEl = $('#sm-guide'); cueEl = $('#sm-cue'); judgeEl = $('#sm-judge');
  tokenEl = $('#sm-token'); hudEl = $('#sm-hud'); trackEl = $('#sm-track');
  tokenEl.addEventListener('beforexrselect', function (e) { e.preventDefault(); });
}
function onFrame(dt) {
  var t = now();
  // the beat: from the music when it plays, otherwise a quiet clock at the heavy tempo that carries
  // on from where the music stopped
  if (music.playing) { world.beat = music.beat(); world.bpm = music.bpm(); S.wasPlaying = true; }
  else {
    if (S.wasPlaying) { S.wasPlaying = false; S.idle0 = t / 1000 - Math.max(0, world.beat) * 60 / IDLE_BPM; }
    world.beat = (t / 1000 - S.idle0) * IDLE_BPM / 60; world.bpm = IDLE_BPM;
  }
  // behind the story and between the parts, the rows take turns singing and swaying
  if (S.ambient && (S.part !== 'how' || S.howDone)) ambientRows(world.beat);
  if (S.part === 'how' && !S.howDone && S.hs && !S.hs.ok) {
    var c = CTRL[HOW[S.how].key];
    if (c.frame) c.frame(S.hs, dt);
    if (!S.hs.ok && !S.hs.canSkip && t - S.hs.t0 > 35000) { S.hs.canSkip = true; howBar(); }
  }
  if (S.part === 'play') rowFrame();
  frameGuide(t); frameMarks(); frameCue();
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
  resume();
  if (S.part === 'how' && !S.howDone && GD.kind) { var c = CTRL[HOW[S.how].key]; if (c.guide && !S.hs.ok) c.guide(S.hs); }
  if (S.part === 'play' && S.game && S.game.phase === 'row') showRowHUD();
}
async function boot() {
  panel = $('#mq-panel'); bar = $('#qx-bar'); parts = $('#qx-parts'); toastEl = $('#qx-toast');
  touch = $('#mq-touch'); callout = $('#mq-callout'); arBtn = $('#mq-ar'); root = $('#mq-root');
  $('#qx-close').innerHTML = ICON.close;
  music = new Music(); music.setMuted(!S.sound);
  makeOverlays();
  renderSound();
  $('#qx-sound').addEventListener('click', function () {
    S.sound = !S.sound;
    try { localStorage.setItem('cl_sound', S.sound ? 'on' : 'off'); } catch (e) {}
    music.ensure(); music.setMuted(!S.sound);
    if (S.sound) sfx('tap');
    renderSound();
  });
  // the audio clock can only start after a tap; the first one anywhere wakes it up
  document.addEventListener('pointerdown', function () {
    music.ensure();
    if (S.wantAmbient && music.ready()) { var v = S.wantAmbient; S.wantAmbient = 0; if (S.ambient) ambient(v); }
    else if (S.wantAmbient) setTimeout(function () { if (S.wantAmbient && music.ready() && S.ambient) { var v2 = S.wantAmbient; S.wantAmbient = 0; ambient(v2); } }, 120);
  }, true);
  if (window.ThemeManager && !window.ThemeManager.current()) window.ThemeManager.applyRegionTheme('eastern');
  document.title = L(T.title) + ' — CultureLens';
  $('#mq-loading span').textContent = L(T.loading);

  world = new World($('#mq-canvas'));
  try { await world.init(); }
  catch (e) { console.error(e); $('#mq-loading').innerHTML = '<span>' + L(T.noGL) + '</span>'; return; }
  document.body.classList.add('mq-ready');

  world.on('ar', onARState);
  world.on('frame', onFrame);
  world.on('reticle', function (ok) {
    var b = $('#sm-place'); if (b) b.disabled = !ok;
    var s = $('#sm-scan'); if (s) s.textContent = L(ok ? T.arGood : T.arWait);
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
  setTimeout(function () { $('#mq-loading').classList.add('gone'); }, 250);

  window.__sm = { world: world, music: music, S: S, setPart: setPart, goCh: goCh, HOW: HOW, CTRL: CTRL, stepDone: stepDone, startStep: startStep, howNext: howNext, rowInput: rowInput, SECS: SECS };
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
else boot();
