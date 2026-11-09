/**
 * sadu.js — Al-Sadu, the weaving of Bedouin women.
 *
 * One live 3D scene (sadu-world.js) carries the whole experience:
 *   1. History (#story)       the camera moves around the house of hair while the story is told
 *   2. How it's made (#how)   done with your fingers on the scene: pick the thorns out of the wool,
 *                             comb it, spin it, dye it, drive the stakes, lay the warp, weave,
 *                             and pick up the pattern thread by thread
 *   3. The game (#play)       read a Sadu (four questions), then race Grandma Haya to the end of a band
 *
 * AR: on Android (Chrome) the loom stands on your real floor (WebXR). On iPhone,
 * "View in your room" opens the loom in AR Quick Look.
 *
 * Sources: UNESCO, "Traditional weaving of Al Sadu" (2020, Saudi Arabia and Kuwait;
 * extended to Qatar in 2025); Saudipedia, "Al-Sadu"; Abu Dhabi Culture, Al Sadu records
 * (colors, dyes, pattern names: the tree, horse teeth, the grains, the chain of rings) and the
 * Sadu activity guide (sorting out thorns and plants, the spindle, the horn);
 * Al-Madina (the kirdash and the spindle in Tabuk); SPA / Arab News (2025, the Year of Handicrafts).
 * The weaving itself: Aramco World, "Warps, Wefts and Wadis" (1981): wool picked clean by hand,
 * the spindle rolled up the thigh with the palm, the old plant dyes (henna, madder...), the warp
 * wound back and forth between two beams pegged to the ground, the heddle, the weaver pulling up
 * threads to open the way for the weft, the sword beater, picking the pattern threads while the
 * unused colors wait underneath, strips sewn together; Ajel (2019): the four stakes in a rectangle,
 * the minshaza, the mishaʿ (sticks wound with the weft), the horn that separates the threads;
 * Al-Ittihad (2022): the minshaza packs the threads, the motifs; Al Sadu Society: woven tight
 * against wind, rain and sand.
 */
import { World, LOOM } from './sadu-world.js';
import { bandCanvas, drawBand, YARN, YARN_KEYS, NAMES, DEMO, COLS, ZONES } from './sadu-weave.js';

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
  soundOn: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9h4l5-4v14l-5-4H4z"/><path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12"/></svg>',
  soundOff: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9h4l5-4v14l-5-4H4z"/><path d="M17 9l5 6M22 9l-5 6"/></svg>'
};
// gesture arrows: drawn pointing up, turned for the other directions (never mirrored for Arabic:
// these are real directions on the screen)
var ARROW = '<svg viewBox="0 0 96 96" aria-hidden="true"><circle class="bg" cx="48" cy="48" r="44"/><path class="ar" d="M48 72V26M29 44l19-19 19 19"/></svg>';
var ARROW_LR = '<svg viewBox="0 0 96 96" aria-hidden="true"><circle class="bg" cx="48" cy="48" r="44"/><path class="ar" d="M22 48h52M36 33L21 48l15 15M60 33l15 15-15 15"/></svg>';
var TAPPER = '<svg viewBox="0 0 96 96" aria-hidden="true"><circle class="bg" cx="48" cy="48" r="44"/><circle class="ring" cx="48" cy="44" r="14"/><path class="ar" d="M44 66V44a4 4 0 0 1 8 0v10m0-3a4 4 0 0 1 8 0v6a12 12 0 0 1-12 12h-2a12 12 0 0 1-9-4l-6-7a3.5 3.5 0 0 1 5-5l4 4"/></svg>';

// Grandma Haya, drawn in code
var HAYA = '<svg class="sd-face" viewBox="0 0 64 64" aria-hidden="true">' +
  '<circle cx="32" cy="32" r="32" fill="#3B1F1D"/>' +
  '<path d="M10 64 C10 34 18 13 32 13 C46 13 54 34 54 64 Z" fill="#151011"/>' +
  '<ellipse cx="32" cy="35" rx="11" ry="13" fill="#B4805B"/>' +
  '<path d="M20.5 32 C21 20 43 20 43.5 32 C40 25.5 24 25.5 20.5 32 Z" fill="#151011"/>' +
  '<path d="M25.6 34.2 q2.6 2.1 5.2 0 M33.2 34.2 q2.6 2.1 5.2 0" stroke="#3A2418" stroke-width="1.5" fill="none" stroke-linecap="round"/>' +
  '<path d="M24.5 38.5 q1.2 0.8 2.4 0 M37.1 38.5 q1.2 0.8 2.4 0" stroke="#9A6646" stroke-width="1" fill="none" stroke-linecap="round"/>' +
  '<path d="M28.4 41.4 q3.6 2.8 7.2 0" stroke="#7A3A2A" stroke-width="1.6" fill="none" stroke-linecap="round"/>' +
  '<path d="M12 60 C15 48 22 46 32 49 C42 46 49 48 52 60" fill="none" stroke="#C9574A" stroke-width="2.2"/>' +
  '<path d="M14 61 C17 51 23 49.5 32 52 C41 49.5 47 51 50 61" fill="none" stroke="#E8C891" stroke-width="1" stroke-dasharray="2 2"/>' +
  '</svg>';

// ════════════════════════════════════════════════════════════
// words
// ════════════════════════════════════════════════════════════
var T = {
  title: { en: 'Al-Sadu', ar: 'السدو' },
  chapter: { en: 'Chapter', ar: 'الفصل' }, of: { en: 'of', ar: 'من' },
  step: { en: 'Step', ar: 'الخطوة' },
  begin: { en: 'Begin the story', ar: 'ابدأ القصة' },
  next: { en: 'Next', ar: 'التالي' }, back: { en: 'Back', ar: 'رجوع' },
  toHow: { en: 'Now, weave it', ar: 'يالله ننسج' },
  nextStep: { en: 'Next step', ar: 'الخطوة الجاية' },
  skip: { en: 'Skip', ar: 'تخطّ' },
  toGame: { en: 'Weave for Grandma Haya', ar: 'انسج للجدة هيا' },
  loading: { en: 'Setting up the tent...', ar: 'ننصب بيت الشعر...' },
  noGL: { en: 'This phone could not draw the 3D scene.', ar: 'هالجهاز ما قدر يرسم المشهد ثلاثي الأبعاد.' },
  ar: { en: 'AR', ar: 'بغرفتك' },
  arQL: { en: 'View in your room', ar: 'شوفه بغرفتك' },
  arExit: { en: 'Exit AR', ar: 'اطلع' },
  arNone: { en: 'Open this page on your phone to put the loom on your floor.', ar: 'افتح الصفحة من جوالك عشان تحط النول على أرضك.' },
  arOpening: { en: 'Opening AR...', ar: 'نفتح الواقع المعزز...' },
  arFail: { en: 'AR could not start on this phone.', ar: 'الواقع المعزز ما اشتغل على هالجوال.' },
  arScanT: { en: 'Find a spot on the floor', ar: 'دوّر مكان بالأرض' },
  arScanP: { en: 'Point your phone at the floor about two steps away. When the ring sits flat on it, tap Place. The lines show how much room the loom needs.', ar: 'وجّه جوالك على الأرض، على بعد خطوتين تقريبًا. لما تشوف الدائرة نايمة على الأرض، اضغط «حطه هنا». الخطوط توضح المساحة اللي يحتاجها النول.' },
  arWait: { en: 'Move your phone slowly so it can see the floor...', ar: 'حرّك جوالك على مهل عشان يشوف الأرض...' },
  arGood: { en: 'Good. Tap Place.', ar: 'تمام. اضغط «حطه هنا».' },
  arPlace: { en: 'Place it here', ar: 'حطه هنا' },
  arFloor: { en: 'Floor', ar: 'أرض' }, arTable: { en: 'Table', ar: 'طاولة' },
  dragHint: { en: 'Drag to look around', ar: 'اسحب عشان تلف' },
  dyed: { en: 'dyed', ar: 'مصبوغ' }, natural: { en: 'natural', ar: 'طبيعي' }
};

var STORY = [
  {
    scene: 'cover', kicker: { en: 'Fabrics & Clothing · Northern Region', ar: 'الأزياء والثياب · المنطقة الشمالية' },
    title: { en: 'Al-Sadu', ar: 'السدو' },
    body: { en: 'The weaving of Bedouin women. Wool from their sheep and hair from their goats and camels, spun and woven into the tent they lived in and everything that made it home.', ar: 'نسيج نساء البادية. صوف الغنم وشعر الماعز ووبر الإبل، ينغزل وينسج لين يصير بيت الشعر وكل شي يخليه بيت.' },
    hint: T.dragHint
  },
  {
    scene: 'house', title: { en: 'The house of hair', ar: 'بيت الشعر' },
    body: { en: 'The Bedouin tent is called the house of hair because it is woven from black goat hair. Inside, Sadu covers the floor and the cushions, and outside it dresses the camels. In Saudi Arabia, Al-Jouf is especially known for it.', ar: 'خيمة البادية اسمها بيت الشعر، لأنها تنسج من شعر الماعز الأسود. وداخله السدو على الأرض وعلى المساند، وبرّا يزيّن الإبل. وتشتهر بالسدو في المملكة منطقة الجوف.' }
  },
  {
    scene: 'fibers', title: { en: 'From the flock to the thread', ar: 'من الحلال للخيط' },
    body: { en: 'Three animals give three fibers. They are cleaned and washed, combed with the kirdash, two boards full of fine teeth, then spun into thread on a spindle.', ar: 'ثلاث حلال تعطي ثلاث أنواع. ينظفونها ويغسلونها، ويمشطونها بالكرداش، وهو لوحين فيها أسنان دقيقة، وبعدين يغزلونها بالمغزل خيوط.' },
    hint: { en: 'Tap a fiber', ar: 'اضغط على نوع' },
    fibers: [
      { key: 'white', name: { en: "Sheep's wool", ar: 'صوف الغنم' }, text: { en: 'From white Naimi sheep. It gives the white of the Sadu.', ar: 'من الغنم النعيمي الأبيض، ومنه الأبيض في السدو.' } },
      { key: 'black', name: { en: 'Goat hair', ar: 'شعر الماعز' }, text: { en: 'Black and strong. The house of hair itself is woven from it.', ar: 'أسود وقوي، ومنه ينسج بيت الشعر نفسه.' } },
      { key: 'brown', name: { en: 'Camel hair', ar: 'وبر الإبل' }, text: { en: 'Soft, in shades from beige to brown.', ar: 'ناعم، ولونه من البيج للبني.' } }
    ]
  },
  {
    scene: 'colors', title: { en: 'The colors', ar: 'الألوان' },
    body: { en: 'The traditional colors are black, white, brown, beige and red. The first four come straight from the animals. Bright reds and oranges come from dyes made from local plants, and liven up the desert.', ar: 'ألوان السدو المعروفة: الأسود والأبيض والبني والبيج والأحمر. الأربعة الأولى من الحلال نفسه بدون صبغ، والأحمر والبرتقالي الزاهي من أصباغ تنسوى من نباتات المنطقة، تفرّح المكان.' },
    colors: ['black', 'white', 'brown', 'beige', 'red', 'orange']
  },
  {
    scene: 'patterns', title: { en: 'Patterns that speak', ar: 'نقوش لها معنى' },
    body: { en: 'Sadu patterns are geometric, repeated in rhythm and symmetry. Each one has a name, and some carry a meaning.', ar: 'نقوش السدو هندسية، تتكرر بإيقاع وتناظر. ولكل نقش اسم، وبعضها له معنى.' },
    hint: { en: 'Tap a pattern', ar: 'اضغط على نقش' },
    motifs: [
      { key: 'tree', text: { en: 'A tree drawn in straight lines, one of the best-known Sadu patterns.', ar: 'شجرة مرسومة بخطوط مستقيمة، من أشهر نقوش السدو.' } },
      { key: 'teeth', text: { en: 'Small squares, shaped like the square teeth of a horse.', ar: 'مربعات صغيرة على شكل أسنان الخيل المربعة.' } },
      { key: 'grains', text: { en: 'Long strips, often white, with points like the grains of a crop.', ar: 'خطوط طويلة، غالباً بيضاء، فيها نقاط مثل حبوب الزرع.' } },
      { key: 'chain', text: { en: 'Rings linked into one chain. It stands for the unity of the tribe and how its people hold together.', ar: 'حلقات متداخلة في سلسلة وحدة، ترمز لوحدة القبيلة وتماسك أهلها.' } },
      { key: 'camels', text: { en: 'Weavers also wove the animals of their life, like camels.', ar: 'وتنسج النساء حيوانات حياتهم بعد، مثل الإبل.' } }
    ]
  },
  {
    scene: 'heritage', title: { en: 'A heritage the world recognizes', ar: 'تراث يعرفه العالم' },
    timeline: [
      { year: { en: '2020', ar: '٢٠٢٠' }, text: { en: 'UNESCO inscribed the traditional weaving of Al-Sadu on its list of the intangible cultural heritage of humanity, nominated by Saudi Arabia and Kuwait.', ar: 'سجّلت اليونسكو نسج السدو التقليدي في قائمة التراث الثقافي غير المادي للبشرية، بترشيح من السعودية والكويت.' } },
      { year: { en: '2020', ar: '٢٠٢٠' }, text: { en: 'The logo of the G20 summit hosted by Saudi Arabia carried the colored strands of Sadu.', ar: 'شعار قمة مجموعة العشرين اللي استضافتها المملكة حمل خيوط السدو الملوّنة.' } },
      { year: { en: '2025', ar: '٢٠٢٥' }, text: { en: 'Saudi Arabia named 2025 the Year of Handicrafts, and Qatar joined the UNESCO inscription.', ar: 'أعلنت المملكة ٢٠٢٥ «عام الحرف اليدوية»، وانضمت قطر لتسجيل السدو في اليونسكو.' } },
      { year: { en: 'Today', ar: 'اليوم' }, text: { en: 'Older Bedouin women, the master weavers, still teach it at home, and associations teach it in classes.', ar: 'وما زالت الجدات من نساء البادية، أمهر الناسجات، يعلّمنه في البيوت، والجمعيات تعلّمه في الدورات.' } }
    ],
    sources: { en: 'Sources: UNESCO; Saudipedia; SPA; the Al Sadu records of Abu Dhabi Culture.', ar: 'المصادر: اليونسكو؛ موسوعة سعوديبيديا؛ واس؛ سجلات السدو في دائرة الثقافة والسياحة بأبوظبي.' }
  }
];

// How it's made: every step is done with a gesture on the scene
var HOW = [
  { key: 'clean', view: 'clean',
    title: { en: 'Clean the wool', ar: 'نظّف الصوف' },
    text: { en: 'Wool comes off the animal full of thorns and bits of plants. The women pick them out with their fingers, then wash it.', ar: 'الصوف يجي من الحلال مليان شوك وعيدان. النساء يطلّعونها بأصابعهم، وبعدين يغسلونه.' },
    hint: { en: 'Tap the thorns', ar: 'اضغط على الشوك' },
    done: { en: 'Clean. Now it gets washed and dried in the sun.', ar: 'نظيف. الحين ينغسل وينشف بالشمس.' } },
  { key: 'comb', view: 'card',
    title: { en: 'Comb it', ar: 'مشّطه' },
    text: { en: 'Pull the kirdash, two boards of fine teeth, across the wool again and again until it is soft and even.', ar: 'اسحب الكرداش، لوحين فيها أسنان دقيقة، على الصوف مرة ورا مرة لين يصير ناعم ومتساوي.' },
    hint: { en: 'Swipe left and right', ar: 'اسحب يمين ويسار' },
    done: { en: 'Soft and ready to spin.', ar: 'صار ناعم وجاهز للغزل.' } },
  { key: 'spin', view: 'spin',
    title: { en: 'Spin the thread', ar: 'اغزل الخيط' },
    text: { en: 'Roll the spindle up your thigh with your palm to set it spinning, then let it drop slowly. The spin twists the wool into thread.', ar: 'دحرج المغزل بكفك على فخذك لفوق عشان يدور، وخلّه ينزل على مهل. الدوران يبرم الصوف ويخليه خيط.' },
    hint: { en: 'Swipe up, then drag down', ar: 'اسحب لفوق، وبعدين لتحت' },
    done: { en: 'A full spindle of thread.', ar: 'مغزل مليان خيط.' } },
  { key: 'dye', view: 'dye',
    title: { en: 'Dye the yarn', ar: 'اصبغ الخيوط' },
    text: { en: 'Black, white, brown and beige come straight from the animals. Red and orange are dyed: soak white yarn and lift it out when the color is right.', ar: 'الأسود والأبيض والبني والبيج من الحلال على طبيعتها. أما الأحمر والبرتقالي فينصبغون: غطّس الخيط الأبيض وطلّعه لما يضبط لونه.' },
    hint: { en: 'Drag a white skein into a pot', ar: 'اسحب الخيط الأبيض للقدر' },
    done: { en: 'Drying in the sun. The old dyes came from plants like henna and madder.', ar: 'ينشفون بالشمس. والأصباغ القديمة من نباتات مثل الحناء والفوّة.' } },
  { key: 'stakes', view: 'stakes',
    title: { en: 'Set up the loom', ar: 'ركّب النول' },
    text: { en: 'The loom lies on the ground: two beams tied to four stakes in a rectangle. How far apart they are decides how long the strip will be.', ar: 'النول ينصب على الأرض: خشبتين مربوطة بأربعة أوتاد على شكل مستطيل. والمسافة بينها تحدد طول القطعة.' },
    hint: { en: 'Tap a stake to drive it in', ar: 'اضغط على الوتد عشان تدقه' },
    done: { en: 'The loom is set.', ar: 'النول جاهز.' } },
  { key: 'warp', view: 'warp',
    title: { en: 'Lay the warp', ar: 'مدّ السدى' },
    text: { en: 'Carry the yarn from beam to beam in one long thread. In Sadu the pattern lives in these lengthwise threads, so the colors go on in order.', ar: 'ودّ الخيط من خشبة للثانية، خيط واحد طويل. في السدو النقش يطلع من هالخيوط الطولية، عشان كذا الألوان تنحط بالترتيب.' },
    hint: { en: 'Drag the ball to the other beam', ar: 'اسحب الكبّة للخشبة الثانية' },
    done: { en: 'The warp is ready.', ar: 'السدى جاهز.' } },
  { key: 'weave', view: 'weave',
    title: { en: 'Weave', ar: 'انسج' },
    text: { en: 'Pull up half the threads, pass the weft through on the mishaʿ, then pull the minshaza toward you to pack it tight. Next row, the other half.', ar: 'ارفع نص الخيوط، ومرّر اللحمة بينها على الميشع، وبعدين اسحب المنشزة لك عشان ترصّها. والصف اللي بعده، النص الثاني.' },
    hint: { en: 'Up, across, down', ar: 'فوق، بالعرض، تحت' },
    done: { en: 'Tight and even. Sadu is woven so tight it keeps out wind, rain and sand.', ar: 'مرصوص ومتساوي. السدو ينسج مشدود لدرجة إنه يصد الهوا والمطر والرمل.' } },
  { key: 'pick', view: 'pick',
    title: { en: 'Pick up the pattern', ar: 'ارفع النقش' },
    text: { en: 'For the tree, the weaver lifts the white threads with a horn and leaves the red ones under, row by row.', ar: 'عشان الشجرة، الناسجة ترفع الخيوط البيضاء بالقرن وتخلي الحمراء تحت، صف ورا صف.' },
    hint: { en: 'Tap the threads, then swipe down', ar: 'اضغط الخيوط، وبعدين اسحب لتحت' },
    done: { en: 'The tree grows. The color not in use waits underneath until the pattern needs it.', ar: 'الشجرة تطلع. واللون اللي ما تحتاجه يبقى تحت لين يجي دوره.' } }
];
var HOW_DONE = {
  title: { en: 'Your first strip', ar: 'أول قطعة لك' },
  text: { en: 'A strip is narrow, so bigger pieces like rugs and the walls of the house of hair are strips sewn side by side. Now Grandma Haya wants to see your hands at work.', ar: 'القطعة ضيقة، عشان كذا القطع الكبيرة مثل البسط وجدران بيت الشعر قطع تنخاط جنب بعض. والحين الجدة هيا تبي تشوف شغل يدينك.' },
  sources: { en: 'Sources: Aramco World (1981); Ajel (2019); Al-Ittihad (2022); Abu Dhabi Culture; Al Sadu Society.', ar: 'المصادر: مجلة أرامكو وورلد (١٩٨١)؛ صحيفة عاجل (٢٠١٩)؛ صحيفة الاتحاد (٢٠٢٢)؛ دائرة الثقافة والسياحة بأبوظبي؛ جمعية السدو.' }
};
var SPIN = {
  roll: { en: 'Swipe up to roll the spindle and set it spinning.', ar: 'اسحب لفوق عشان تدحرج المغزل ويدور.' },
  draw: { en: 'It is spinning. Drag down slowly to let it drop.', ar: 'يدور. اسحب لتحت على مهل وخلّه ينزل.' },
  stopped: { en: 'It stopped spinning. Roll it again.', ar: 'وقف المغزل. دحرجه مرة ثانية.' },
  wound: { en: 'Wound onto the spindle. Again.', ar: 'انلف الخيط على المغزل. مرة ثانية.' },
  lRoll: { en: 'Roll', ar: 'دحرج' }, lDrop: { en: 'Drop', ar: 'نزّل' }
};
var DYE = {
  pale: { en: 'Too pale. Dip it again.', ar: 'فاتح. غطّسه مرة ثانية.' },
  dark: { en: 'Too dark. Start again with fresh white yarn.', ar: 'غمق زيادة. خذ خيط أبيض جديد وابدأ من أول.' },
  right: { en: 'Just right.', ar: 'مضبوط.' },
  potDone: { en: 'That pot is done. Use the other one.', ar: 'هالقدر خلص. استخدم الثاني.' },
  samePot: { en: 'Finish this one in the same pot.', ar: 'كمّل هذا بنفس القدر.' },
  soak: { en: 'Soaking... lift your finger when the color is right.', ar: 'ينصبغ... شيل إصبعك لما يضبط اللون.' },
  lPale: { en: 'Pale', ar: 'فاتح' }, lRight: { en: 'Right', ar: 'مضبوط' }, lDark: { en: 'Dark', ar: 'غامق' }
};
var WARP = {
  plan: { en: 'The order of the colors', ar: 'ترتيب الألوان' },
  pairs: { en: 'The middle: red and white side by side, ready for the pattern.', ar: 'الوسط: أحمر وأبيض جنب بعض، جاهزة للنقش.' },
  now: function (k) { return { en: 'Now the ' + YARN[k].en.toLowerCase() + '.', ar: 'الحين ' + YARN[k].arDef + '.' }; }
};
var WEAVE = {
  up: { en: 'Half the threads are up. Now pass the mishaʿ, the stick wound with the weft.', ar: 'نص الخيوط ارتفعت. الحين مرّر الميشع، العصا الملفوف عليها اللحمة.' },
  pass: { en: 'The weft is through. Now beat it.', ar: 'اللحمة عدّت. الحين دقّها.' },
  beat: { en: 'Packed tight.', ar: 'انرصّت زين.' },
  other: { en: 'This row, the other half goes up and the weft comes back.', ar: 'هالصف يرتفع النص الثاني، واللحمة ترجع.' },
  wUp: { en: 'First open the gap: swipe up.', ar: 'افتح الفتحة أول: اسحب لفوق.' },
  wRight: { en: 'Now pass the mishaʿ: swipe right.', ar: 'الحين مرّر الميشع: اسحب يمين.' },
  wLeft: { en: 'Now pass the mishaʿ back: swipe left.', ar: 'الحين رجّع الميشع: اسحب يسار.' },
  wDown: { en: 'Now beat it: swipe down.', ar: 'الحين دقّ: اسحب لتحت.' },
  lOpen: { en: 'Open', ar: 'افتح' }, lPass: { en: 'Pass', ar: 'مرّر' }, lBeat: { en: 'Beat', ar: 'دق' }
};
var PICK = {
  threads: { en: 'The threads', ar: 'الخيوط' },
  row: { en: 'This row', ar: 'هالصف' },
  woven: { en: 'Woven', ar: 'المنسوج' },
  match: { en: 'That is the row. Swipe down to beat it in.', ar: 'هذا الصف. اسحب لتحت ودقّه.' },
  notYet: { en: 'Not yet. Lift the threads where the row shows white.', ar: 'لسه. ارفع الخيوط اللي مكانها أبيض بالصف.' },
  rest: { en: 'The rest of the tree, the same way...', ar: 'وباقي الشجرة بنفس الطريقة...' }
};

var G = {
  name: { en: 'Grandma Haya', ar: 'الجدة هيا' }, short: { en: 'Grandma', ar: 'الجدة' },
  role: { en: 'The master weaver', ar: 'أمهر ناسجة' },
  introT: { en: 'Weave for Grandma Haya', ar: 'انسج للجدة هيا' },
  introP: { en: 'Grandma Haya has woven Sadu all her life. First, show her you can read a Sadu. Then race her: two looms, the same band, and whoever reaches the end first wins.', ar: 'الجدة هيا تنسج السدو من عمرها. أول شي، وريها إنك تعرف تقرا السدو. وبعدين سابقها: نولين، نفس القطعة، واللي يوصل للآخر أول يفوز.' },
  start: { en: 'Start', ar: 'يلا نبدأ' },
  r1: { en: 'Round 1 · Read the Sadu', ar: 'الجولة ١ · اقرا السدو' },
  again: { en: 'Play again', ar: 'العب مرة ثانية' }, finish: { en: 'Finish', ar: 'إنهاء' },
  learned: { en: 'What you learned', ar: 'وش تعلمت' },
  score: { en: 'Score', ar: 'النقاط' },
  readPart: { en: 'Reading the Sadu', ar: 'قراءة السدو' }, racePart: { en: 'The race', ar: 'السباق' }
};
var R = {
  title: { en: 'Round 2 · The race', ar: 'الجولة ٢ · السباق' },
  level: { en: 'Level', ar: 'المستوى' },
  intro: { en: 'Now show me your hands. We weave the same band, you on your loom and me on mine. First to the end wins. I will give you a head start.', ar: 'الحين وريني شغل يدينك. بننسج نفس القطعة، أنت على نولك وأنا على نولي، واللي يوصل للآخر أول يفوز. وبعطيك سبق.' },
  intro2: { en: 'Again? This time I will not go easy on you.', ar: 'مرة ثانية؟ هالمرة ما راح أرحمك.' },
  band: { en: 'The band', ar: 'القطعة' },
  open: { en: 'Open', ar: 'افتح' }, pass: { en: 'Pass', ar: 'مرّر' }, beat: { en: 'Beat', ar: 'دق' }, pack: { en: 'Pack', ar: 'رصّ' },
  tip: { en: 'Every row: open, pass, beat. The weft goes right, then comes back left. Every few rows, tap fast to pack it tight. Learn the rhythm and you can move before the arrow shows.', ar: 'كل صف: افتح، مرّر، دق. اللحمة تروح يمين وترجع يسار. وكل كم صف، اضغط بسرعة عشان ترصّه. إذا حفظت الإيقاع تقدر تتحرك قبل ما يطلع السهم.' },
  ready: { en: 'I am ready', ar: 'جاهز' },
  go: { en: 'Go!', ar: 'يلا!' },
  you: { en: 'You', ar: 'أنت' },
  streak: { en: 'Rhythm', ar: 'الإيقاع' },
  packNow: { en: 'Pack it! Tap fast', ar: 'رصّه! اضغط بسرعة' },
  wrong: { en: 'Wrong move', ar: 'حركة غلط' },
  youWin: { en: 'You won!', ar: 'فزت!' }, hayaWins: { en: 'Grandma Haya won', ar: 'الجدة هيا فازت' },
  won: { en: 'You beat me! Your hands are quicker than mine were at your age.', ar: 'سبقتني! يدينك أسرع من يديني يوم كنت بعمرك.' },
  lost: { en: 'My hands still have it. Practice, then come back and race me again.', ar: 'يديني ما زالت سريعة. تمرّن، وارجع سابقني مرة ثانية.' },
  hungYours: { en: 'Your band is hanging on the front of her house.', ar: 'قطعتك تعلّقت على واجهة بيتها.' },
  hungHers: { en: 'She hung hers on the front of the house. Yours is still on the loom.', ar: 'علّقت قطعتها على واجهة البيت، وقطعتك لسه على النول.' },
  time: { en: 'Time', ar: 'الوقت' }, slips: { en: 'Wrong moves', ar: 'حركات غلط' }, best: { en: 'Best rhythm', ar: 'أطول إيقاع' }, rows: { en: 'Rows', ar: 'الصفوف' },
  ptsWin: { en: 'Beat Grandma Haya', ar: 'سبقت الجدة هيا' },
  ptsClean: { en: 'Two wrong moves or fewer', ar: 'حركتين غلط أو أقل' },
  ptsRhythm: { en: 'A rhythm of 12 moves without a slip', ar: 'إيقاع ١٢ حركة بدون غلطة' },
  again: { en: 'Race again', ar: 'سابق مرة ثانية' },
  sec: { en: 's', ar: ' ث' }
};
var MEAN = {
  unity: { en: 'The unity of the tribe', ar: 'وحدة القبيلة وتماسكها' },
  rain: { en: 'The rainy season', ar: 'موسم المطر' },
  journey: { en: 'A long journey', ar: 'السفر الطويل' }
};
var QUESTIONS = [
  { key: 'find', kind: 'bands', options: ['tree', 'chain', 'camels'], answer: 'tree',
    prompt: { en: 'Which band has the tree?', ar: 'أي قطعة فيها نقش الشجرة؟' },
    good: { en: 'Right. The tree, drawn in straight lines.', ar: 'صح. الشجرة، مرسومة بخطوط مستقيمة.' },
    bad: { en: 'Not that one. Look for a trunk with branches on both sides.', ar: 'مو هذي. دوّر على جذع وعلى جنبيه أغصان.' } },
  { key: 'edge', kind: 'text', show: { edge: 'teeth', center: 'chain', ground: 'black', figure: 'white' }, dim: 'edges', options: ['teeth', 'grains', 'tree'], answer: 'teeth',
    prompt: { en: 'What is the pattern along the edges called?', ar: 'وش اسم النقش اللي على الأطراف؟' },
    good: { en: 'Right. Horse teeth: small squares, like the square teeth of a horse.', ar: 'صح. أسنان الخيل: مربعات صغيرة مثل أسنان الخيل المربعة.' },
    bad: { en: 'Those small squares are horse teeth, named after the square teeth of a horse.', ar: 'هالمربعات الصغيرة اسمها أسنان الخيل، على شكل أسنان الخيل المربعة.' } },
  { key: 'mean', kind: 'text', show: { edge: 'grains', center: 'chain', ground: 'red', figure: 'white' }, dim: 'center', options: ['unity', 'rain', 'journey'], answer: 'unity', labels: MEAN,
    prompt: { en: 'Rings linked into one chain. What do they stand for?', ar: 'حلقات متداخلة في سلسلة وحدة. وش ترمز له؟' },
    good: { en: 'Right. The chain of rings stands for the unity of the tribe.', ar: 'صح. الحلقات المتداخلة ترمز لوحدة القبيلة وتماسكها.' },
    bad: { en: 'The chain of rings stands for the unity of the tribe, its people holding together.', ar: 'الحلقات المتداخلة ترمز لوحدة القبيلة وتماسك أهلها.' } },
  { key: 'dye', kind: 'yarn', options: ['black', 'white', 'red'], answer: 'red',
    prompt: { en: 'Which of these yarns had to be dyed?', ar: 'أي خيط من هذول انصبغ؟' },
    good: { en: 'Right. Black is goat hair and white is sheep\'s wool, straight from the animals. Red is dyed.', ar: 'صح. الأسود شعر ماعز والأبيض صوف غنم، من الحلال نفسه. والأحمر مصبوغ.' },
    bad: { en: 'That one comes straight from the animals. Black is goat hair, white is sheep\'s wool. Red is the dyed one.', ar: 'هذا من الحلال نفسه. الأسود شعر ماعز، والأبيض صوف غنم. الأحمر هو المصبوغ.' } }
];
// the bands Grandma Haya races you on
var BANDS = [
  { edge: 'teeth', center: 'tree', figure: 'white', ground: 'red' },
  { edge: 'grains', center: 'chain', figure: 'white', ground: 'black' },
  { edge: 'grains', center: 'camels', figure: 'black', ground: 'beige' }
];
var LEARN = [
  { en: 'Sadu is woven by Bedouin women on a ground loom tied to four stakes.', ar: 'السدو تنسجه نساء البادية على نول أرضي مربوط بأربعة أوتاد.' },
  { en: 'Each row: open the threads, pass the weft on the mishaʿ, beat it with the minshaza.', ar: 'كل صف: تفتح الخيوط، وتمرّر اللحمة على الميشع، وتدقها بالمنشزة.' },
  { en: 'The pattern lives in the warp: the weaver picks its threads up by hand.', ar: 'النقش يطلع من السدى: الناسجة ترفع خيوطه بيدها.' },
  { en: 'Reds and oranges come from dyes, the other colors from the animals.', ar: 'الأحمر والبرتقالي من الصبغ، وباقي الألوان من الحلال.' }
];
var MAX_SCORE = QUESTIONS.length + 4;
var RESULT_TITLES = [
  { min: MAX_SCORE, t: { en: 'Grandma Haya is proud of you', ar: 'الجدة هيا فخورة فيك' } },
  { min: MAX_SCORE - 2, t: { en: 'A good hand at the loom', ar: 'يدك تعرف النول' } },
  { min: 0, t: { en: 'Keep practicing', ar: 'تحتاج شوي تمرين' } }
];

// the band in How it's made: a few plain rows, then the tree picked up by hand
var LEAD = 4, PICK_ROWS = 5, TREE_ROWS = 24;
// the race: 20 rows, each one packs 5 rows of the band
var RACE = { rows: 20, per: 5, packEvery: 5, packTaps: 4, head: 2.5, row: 1.4, pack: 0.75, lock: 0.45 };
var SCALE = [293.7, 311.1, 370, 392, 440, 466.2, 554.4, 587.3];

// ════════════════════════════════════════════════════════════
// state
// ════════════════════════════════════════════════════════════
var S = { part: 'story', ch: 0, fiber: null, motif: null, how: 0, hs: {}, howDone: false, game: null, sound: true, arMode: null, inAR: false, arPlaced: false, gest: null, touching: false };
try { S.sound = localStorage.getItem('cl_sound') !== 'off'; } catch (e) {}
var world, panel, bar, parts, toastEl, touch, callout, arBtn, root;
var guideEl, markEl, gaugeEl, loupeEl, hudEl, promptEl;
var token = 0;

// ════════════════════════════════════════════════════════════
// sound (made in code, no files)
// ════════════════════════════════════════════════════════════
var AC = null;
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
  pluck: function () { noise(0.06, 0.06, 2600, 1.4); tone(1400, 0.07, 'triangle', 0.03, 0, 800); },
  comb: function () { noise(0.16, 0.05, 3600, 0.8); },
  whirr: function () { tone(160, 0.6, 'sawtooth', 0.02, 0, 520); noise(0.5, 0.025, 900, 3); },
  lay: function () { pluck(392, 0, 0.05); },
  thunk: function () { tone(140, 0.16, 'sine', 0.14, 0, 70); noise(0.08, 0.06, 400, 0.8, 'lowpass'); },
  shed: function () { tone(620, 0.05, 'square', 0.018); noise(0.05, 0.04, 2400, 2); },
  pass: function () { noise(0.2, 0.05, 1500, 0.7); },
  beat: function () { tone(520, 0.06, 'triangle', 0.06); noise(0.05, 0.05, 1600, 1.4); },
  pack: function () { tone(260, 0.06, 'triangle', 0.07); noise(0.05, 0.05, 1000, 1); },
  dip: function () { noise(0.4, 0.05, 700, 0.6, 'lowpass'); tone(380, 0.1, 'sine', 0.03, 0.1, 620); },
  ok: function () { tone(659, 0.22, 'sine', 0.07); tone(988, 0.32, 'sine', 0.06, 0.1); },
  bad: function () { tone(196, 0.28, 'triangle', 0.07, 0, 150); },
  tick: function () { tone(1046, 0.08, 'sine', 0.06); },
  go: function () { tone(784, 0.14, 'sine', 0.08); tone(1175, 0.3, 'sine', 0.07, 0.09); },
  note: function (i) { pluck(SCALE[i % SCALE.length], 0, 0.045); },
  star: function () { tone(784, 0.2, 'sine', 0.06); tone(1175, 0.4, 'sine', 0.05, 0.12); tone(1568, 0.5, 'sine', 0.04, 0.24); },
  win: function () { [293.7, 311.1, 370, 392, 440].forEach(function (f, i) { pluck(f, i * 0.11, 0.07); }); pluck(587.3, 0.6, 0.06); }
};
function sfx(n, a) { if (!S.sound) return; try { SFX[n](a); } catch (e) {} }
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
  var g = S.game, nq = QUESTIONS.length + 1;
  var play = 0;
  if (g) {
    if (g.over) play = 1;
    else if (g.phase === 'q') play = g.qi / nq;
    else if (g.phase === 'raceIntro' || g.phase === 'race') play = QUESTIONS.length / nq;
    else if (g.phase === 'raceDone') play = 1;
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
function band(spec, rows, o) {
  o = o || {};
  var c = bandCanvas(spec, rows, { cw: o.cw || 3, ch: o.ch || 4, dir: o.dir || 'h', dim: o.dim, scale: 2 });
  c.className = 'sd-band' + (o.cls ? ' ' + o.cls : '');
  return c;
}
function stepsDots(n, i) { var s = ''; for (var k = 0; k < n; k++) s += '<i class="' + (k === i ? 'is-on' : k < i ? 'is-done' : '') + '"></i>'; return s; }
function bandName(spec) {
  return { en: NAMES[spec.edge].en + ' · ' + NAMES[spec.center].en + ' · ' + YARN[spec.figure].en + ' on ' + YARN[spec.ground].en.toLowerCase(),
    ar: NAMES[spec.edge].ar + ' · ' + NAMES[spec.center].ar + ' · ' + YARN[spec.figure].ar + ' على ' + YARN[spec.ground].ar };
}

// ════════════════════════════════════════════════════════════
// gestures on the scene
// ════════════════════════════════════════════════════════════
function setGesture(h) { S.gest = h || null; }
function pt(e) { return { x: e.clientX, y: e.clientY }; }
// fires as soon as the finger has moved far enough, and again whenever it turns a corner
// (so "up, then right" can be one stroke). A long stroke in one direction fires once.
function swiper(o) {
  var st = null, MIN = o.min || 30;
  return {
    down: function (p) { st = { x: p.x, y: p.y, x0: p.x, y0: p.y, n: 0, last: null }; },
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
      if (st && !st.n && Math.hypot(p.x - st.x0, p.y - st.y0) < 16 && o.onTap) o.onTap({ x: st.x0, y: st.y0 });
      st = null;
    }
  };
}

// the hand that shows what to do: it fades in when you're not touching the screen
var GD = { kind: null, at: null, to: null, from: 0 };
function guide(kind, at, to, label) {
  GD.kind = kind; GD.at = at; GD.to = to || null; GD.from = now() + 250;
  var icon = kind === 'lr' ? ARROW_LR : kind === 'tap' ? TAPPER : kind === 'drag' ? '' : ARROW;
  guideEl.className = 'sd-guide g-' + kind;
  guideEl.innerHTML = '<div class="sd-g-icon">' + icon + '</div><i class="sd-g-dot"></i>' + (label ? '<span class="sd-g-label">' + L(label) + '</span>' : '');
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
// glowing rings on the things to tap
var MK = [];
function setMarks(list) {
  if (!markEl) return;
  markEl.innerHTML = '';
  MK = (list || []).map(function (f) { var i = document.createElement('i'); markEl.appendChild(i); return { el: i, at: f }; });
}
function frameMarks() {
  for (var k = 0; k < MK.length; k++) {
    var m = MK[k], p = m.at();
    if (!p || p.ok === false) { m.el.style.display = 'none'; continue; }
    m.el.style.display = ''; m.el.style.left = p.x + 'px'; m.el.style.top = p.y + 'px';
  }
}
// a small dial by the spindle showing how fast it spins
var GG = { on: false, at: null, v: 0 };
function gaugeOn(at) { GG.on = true; GG.at = at; GG.v = 0; }
function gaugeOff() { GG.on = false; if (gaugeEl) gaugeEl.hidden = true; }
function frameGauge() {
  if (!GG.on) { gaugeEl.hidden = true; return; }
  var p = GG.at(); gaugeEl.hidden = !p;
  if (!p) return;
  gaugeEl.style.left = p.x + 'px'; gaugeEl.style.top = p.y + 'px';
  $('.val', gaugeEl).style.strokeDasharray = (clamp(GG.v, 0, 1) * 100).toFixed(1) + ' 100';
  gaugeEl.classList.toggle('low', GG.v < 0.25);
}
function screenOf(p) { return function () { return world.toScreen(typeof p === 'function' ? p() : p); }; }
function clearStepUI() {
  setGesture(null); clearGuide(); setMarks(null); gaugeOff(); hideLoupe(); hideHUD();
  clearTimeout(cueTimer); if (promptEl) { promptEl.classList.remove('show'); promptEl.hidden = true; }
  document.body.classList.remove('sd-racing', 'sd-picking');
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
  if (p === 'story') { finishedLoom(); goCh(S.ch, true); }
  else if (p === 'how') startHow();
  else startPlay();
  renderParts();
  if (S.inAR && !S.arPlaced) renderScan();
}
// the loom as a weaver left it: halfway through a band
function finishedLoom() {
  world.setSpec(DEMO); world.setStakes(4); world.setWarp(1); world.setWoven(120);
  world.setTwigs(0); world.setCombed(1); world.setComb(0);
  world.setSpindle('rest'); world.spinSpeed = 0; world.setDrop(0); world.setCop(1);
  world.setDyed('red', true); world.setDyed('orange', true); world.skeinsHome();
  world.hideBall(); world.shedOpen = 0; world.mishaa.visible = false; world.placeTools();
}

// ════════════════════════════════════════════════════════════
// 1. STORY
// ════════════════════════════════════════════════════════════
function goCh(i, fresh) {
  var changed = i !== S.ch || fresh;
  S.ch = clamp(i, 0, STORY.length - 1);
  var c = STORY[S.ch];
  if (changed) {
    S.fiber = null; S.motif = null;
    if (c.scene === 'patterns') world.setSpec(DEMO);
    if (!S.inAR) world.view(c.scene, { k: 1.4 });
  }
  var html = '<div class="mq-dots">' + stepsDots(STORY.length, S.ch) + '</div>' +
    (c.kicker ? '<div class="qx-kicker">' + L(c.kicker) + '</div>' : '<div class="qx-chapter-num">' + L(T.chapter) + ' ' + num(S.ch) + ' ' + L(T.of) + ' ' + num(STORY.length - 1) + '</div>') +
    '<h1 class="mq-title">' + L(c.title) + '</h1>' +
    (c.body ? '<p class="mq-p">' + L(c.body) + '</p>' : '');
  if (c.fibers) {
    html += '<div class="sd-chips">' + c.fibers.map(function (f) {
      return '<button class="sd-chip' + (S.fiber === f.key ? ' is-on' : '') + '" data-fiber="' + f.key + '"><i style="background:' + YARN[f.key].hex + '"></i>' + L(f.name) + '</button>';
    }).join('') + '</div><div class="sd-info" id="sd-info"></div>';
  }
  if (c.colors) {
    html += '<div class="sd-yarns">' + c.colors.map(function (k) {
      return '<div class="sd-yarn"><i style="background:' + YARN[k].hex + '"></i><b>' + L(YARN[k]) + '</b><small>' + L(YARN[k].dyed ? T.dyed : YARN[k].from) + '</small></div>';
    }).join('') + '</div>';
  }
  if (c.motifs) {
    html += '<div class="sd-preview" id="sd-preview"></div><div class="sd-chips">' + c.motifs.map(function (m) {
      return '<button class="sd-chip' + (S.motif === m.key ? ' is-on' : '') + '" data-motif="' + m.key + '">' + L(NAMES[m.key]) + '</button>';
    }).join('') + '</div><div class="sd-info" id="sd-info"></div>';
  }
  if (c.timeline) {
    html += '<div class="qx-timeline sd-timeline">' + c.timeline.map(function (t) {
      return '<div class="qx-tl"><div class="qx-tl-year">' + L(t.year) + '</div><div class="qx-tl-text">' + L(t.text) + '</div></div>';
    }).join('') + '</div><p class="qx-sources">' + L(c.sources) + '</p>';
  }
  if (c.hint && !S.inAR && !(c.fibers && S.fiber) && !(c.motifs && S.motif)) html += '<div class="qx-hint"><i></i><span>' + L(c.hint) + '</span></div>';
  panel.className = 'mq-panel qx-enter' + (c.kicker ? ' is-cover' : '') + (c.timeline ? ' is-long' : '');
  panel.innerHTML = html;
  if (c.fibers) {
    $$('[data-fiber]', panel).forEach(function (b) { b.addEventListener('click', function () { sfx('tap'); S.fiber = b.getAttribute('data-fiber'); bounce(world.fleeces[S.fiber]); goCh(S.ch); }); });
    if (S.fiber) { var f = c.fibers.filter(function (x) { return x.key === S.fiber; })[0]; $('#sd-info').innerHTML = '<b>' + L(f.name) + '</b><span>' + L(f.text) + '</span>'; }
  }
  if (c.motifs) {
    var mk = S.motif || 'tree', spec = Object.assign({}, DEMO), dim = null;
    if (mk === 'teeth' || mk === 'grains') { spec.edge = mk; spec.center = 'chain'; dim = 'edges'; }
    else { spec.center = mk; dim = 'center'; }
    $('#sd-preview').appendChild(band(spec, 92, { dim: S.motif ? dim : null }));
    $$('[data-motif]', panel).forEach(function (b) {
      b.addEventListener('click', function () {
        sfx('tap'); S.motif = b.getAttribute('data-motif');
        var s2 = Object.assign({}, DEMO);
        if (S.motif === 'teeth' || S.motif === 'grains') s2.edge = S.motif; else s2.center = S.motif;
        world.setSpec(s2);
        goCh(S.ch);
      });
    });
    if (S.motif) { var m = c.motifs.filter(function (x) { return x.key === S.motif; })[0]; $('#sd-info').innerHTML = '<b>' + L(NAMES[m.key]) + '</b><span>' + L(m.text) + '</span>'; }
  }
  var last = S.ch === STORY.length - 1;
  setBar({
    back: S.ch > 0 ? function () { goCh(S.ch - 1); renderParts(); } : null,
    buttons: [{ label: S.ch === 0 ? T.begin : last ? T.toHow : T.next, icon: 'next', onClick: function () { sfx('tap'); if (last) setPart('how'); else { goCh(S.ch + 1); renderParts(); } } }]
  });
}
function bounce(g) {
  if (!g) return;
  var s0 = g.scale.x;
  world.animate(0.45, function (t) { var k = 1 + Math.sin(t * Math.PI) * 0.25; g.scale.setScalar(s0 * k); }, function () { g.scale.setScalar(s0); });
}

// ════════════════════════════════════════════════════════════
// 2. HOW IT'S MADE
// ════════════════════════════════════════════════════════════
function stepIndex(key) { for (var i = 0; i < HOW.length; i++) if (HOW[i].key === key) return i; return -1; }
// the world as it is when step i begins: every step before it done, this one untouched
function stage(i) {
  var past = function (k) { return i > stepIndex(k); };
  world.setSpec(DEMO, { lead: LEAD });
  world.setTwigs(past('clean') ? 0 : 5);
  world.setCombed(past('comb') ? 1 : 0); world.setComb(0);
  world.setSpindle(HOW[i] && HOW[i].key === 'spin' ? 'hang' : 'rest'); world.spinSpeed = 0; world.setDrop(0);
  world.setCop(past('spin') ? 1 : 0);
  world.setDyed('red', past('dye')); world.setDyed('orange', past('dye')); world.skeinsHome();
  world.setStakes(past('stakes') ? 4 : 0);
  world.setWarpCols(past('warp') ? COLS : 0); world.hideBall();
  world.setWoven(past('pick') ? LEAD + TREE_ROWS : past('weave') ? LEAD : 0);
  world.shedOpen = 0; world.mishaaX = -0.34; world.mishaa.visible = false; world.placeTools();
}
function startHow() { S.how = 0; S.howDone = false; startStep(); }
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
  setGesture(null); clearGuide(); setMarks(null); gaugeOff();
  sfx('star'); buzz(20);
  renderHow(false); renderParts();
}
function skipStep() {
  var hs = S.hs;
  hs.ok = true; setGesture(null); clearGuide(); setMarks(null); gaugeOff(); hideLoupe();
  renderHow(false); renderParts();
}
function renderHow(fresh) {
  if (S.howDone) { renderHowDone(); return; }
  var st = HOW[S.how], hs = S.hs;
  var html = '<div class="mq-steps">' + stepsDots(HOW.length, S.how) + '</div>' +
    '<div class="qx-chapter-num">' + L(T.step) + ' ' + num(S.how + 1) + ' ' + L(T.of) + ' ' + num(HOW.length) + '</div>' +
    '<h2 class="mq-title">' + L(st.title) + '</h2>' +
    '<p class="mq-p">' + L(st.text) + '</p>';
  if (st.key === 'dye') html += dyeBars(hs);
  if (st.key === 'warp') html += warpPlan(hs);
  html += '<div class="mq-status" id="mq-status"></div>';
  panel.className = 'mq-panel sd-how' + (fresh ? ' qx-enter' : '');
  panel.innerHTML = html;
  stepStatus();
  howBar();
}
// the line under the text: what just happened, or how far along you are
function stepStatus() {
  var el = $('#mq-status'); if (!el) return;
  var st = HOW[S.how], hs = S.hs, c = CTRL[st.key];
  if (hs.ok) status('good', st.done);
  else if (hs.msg) status(hs.msgKind, hs.msg);
  else if (c.status) status('', c.status(hs));
  else el.className = 'mq-status';
  if (st.key === 'warp') { var pl = $('#sd-plan'); if (pl) pl.outerHTML = warpPlan(hs); }
}
function howNext() {
  sfx('tap');
  if (S.how < HOW.length - 1) { S.how++; startStep(); renderParts(); }
  else { token++; clearStepUI(); S.howDone = true; stage(HOW.length); renderHowDone(); renderParts(); }
}
function howBack() { if (S.how > 0) { S.how--; startStep(); renderParts(); } }
function howBar() {
  var st = HOW[S.how], hs = S.hs, back = S.how > 0 ? howBack : null;
  if (hs.ok) { setBar({ back: back, buttons: [{ label: S.how === HOW.length - 1 ? T.next : T.nextStep, icon: 'next', onClick: howNext }] }); return; }
  var btns = [{ label: st.hint, kind: 'line', disabled: true, iconFirst: 'hand', cls: 'sd-hintpill' }];
  if (hs.canSkip) btns.push({ label: T.skip, kind: 'line', cls: 'sd-skip', onClick: function () { sfx('tap'); skipStep(); } });
  setBar({ back: back, buttons: btns });
}
function renderHowDone() {
  if (!S.inAR) world.view('loom', { k: 1.4 });
  panel.className = 'mq-panel qx-enter';
  panel.innerHTML = '<div class="mq-steps">' + stepsDots(HOW.length, HOW.length) + '</div>' +
    '<h2 class="mq-title">' + L(HOW_DONE.title) + '</h2><p class="mq-p">' + L(HOW_DONE.text) + '</p>' +
    '<p class="qx-sources">' + L(HOW_DONE.sources) + '</p>';
  setBar({ back: function () { S.howDone = false; S.how = HOW.length - 1; startStep(); renderParts(); }, buttons: [{ label: T.toGame, icon: 'next', onClick: function () { sfx('tap'); setPart('play'); } }] });
}

// ── the steps ──
var CTRL = {};

// 1. pick the thorns and bits of plants out of the fleece
CTRL.clean = {
  start: function (hs) {
    hs.left = [0, 1, 2, 3, 4];
    setMarks(hs.left.map(function (i) { return function () { return hs.left.indexOf(i) > -1 ? world.toScreen(world.twigPos(i)) : null; }; }));
  },
  gesture: function (hs) {
    return swiper({ onTap: function (p) {
      if (hs.ok) return;
      var best = -1, bd = 50;
      hs.left.forEach(function (i) { var s = world.toScreen(world.twigPos(i)), d = Math.hypot(s.x - p.x, s.y - p.y); if (d < bd) { bd = d; best = i; } });
      if (best < 0) return;
      hs.left.splice(hs.left.indexOf(best), 1); hs.n++;
      world.pluckTwig(best); sfx('pluck'); buzz(10);
      if (!hs.left.length) setTimeout(stepDone, 500); else stepStatus();
    } });
  },
  status: function (hs) { return { en: hs.n + ' of 5 picked out', ar: 'طلّعت ' + num(hs.n) + ' من ' + num(5) }; }
};

// 2. comb: the top board of the kirdash follows your finger, left and right
CTRL.comb = {
  gesture: function (hs) {
    var last = null, dir = 0, travel = 0;
    function stroke() {
      hs.n++; sfx('comb'); buzz(6);
      world.setCombed(Math.min(1, hs.n / 8));
      if (hs.n >= 8) { world.setComb(0); stepDone(); } else stepStatus();
    }
    return {
      down: function (p) { last = p.x; dir = 0; travel = 0; },
      move: function (p) {
        if (last == null || hs.ok) return;
        var dx = p.x - last; last = p.x;
        if (!dx) return;
        world.setComb(world.kirdash.userData.b1.position.x + dx * 0.0007);
        var d = dx > 0 ? 1 : -1;
        if (d !== dir) { if (travel > 34) stroke(); dir = d; travel = 0; }
        travel += Math.abs(dx);
      },
      up: function () { if (travel > 34 && !hs.ok) stroke(); last = null; travel = 0; dir = 0; }
    };
  },
  guide: function () { guide('lr', screenOf({ x: 0.38, y: 0.06, z: 0.74 })); },
  status: function (hs) { return { en: hs.n + ' of 8 strokes', ar: num(hs.n) + ' من ' + num(8) + ' مشطات' }; }
};

// 3. spin: swipe up to roll the spindle, drag down to let it drop and draw out the thread
CTRL.spin = {
  start: function (hs) {
    hs.e = 0; hs.d = 0; hs.len = 0; hs.phase = 'roll';
    world.setSpindle('hang'); world.setDrop(0); world.spinSpeed = 0;
    gaugeOn(screenOf(function () { var p = world.spindleTop(); return { x: p.x + 0.11, y: p.y - 0.02, z: p.z }; }));
  },
  frame: function (hs, dt) {
    hs.e = Math.max(0, hs.e - dt * (hs.drawing ? 0.22 : 0.15));
    world.spinSpeed = hs.e * 38;
    GG.v = hs.e;
    if (hs.phase === 'draw' && hs.e < 0.1 && !hs.winding) {
      hs.phase = 'roll'; hs.msg = SPIN.stopped; hs.msgKind = 'bad'; stepStatus(); CTRL.spin.guide(hs);
    }
  },
  gesture: function (hs) {
    var st = null;
    function wind() {
      hs.winding = true; hs.drawing = false; hs.len++;
      sfx('lay'); buzz(12);
      var c0 = (hs.len - 1) / 3;
      world.animate(0.7, function (t) { world.setDrop(1 - t); world.setCop(c0 + t / 3); }, function () {
        hs.winding = false; hs.d = 0;
        if (hs.len >= 3) { world.spinSpeed = 0; hs.e = 0; stepDone(); return; }
        hs.msg = SPIN.wound; hs.msgKind = 'good'; stepStatus(); CTRL.spin.guide(hs);
      });
    }
    return {
      down: function (p) { st = { y0: p.y, y: p.y, t: now(), rolled: false }; },
      move: function (p) {
        if (!st || hs.ok || hs.winding) return;
        var dy = p.y - st.y; st.y = p.y;
        if (!st.rolled && st.y0 - p.y > 36) {
          // rolled up the thigh: the faster the roll, the faster it spins
          st.rolled = true;
          var v = (st.y0 - p.y) / Math.max(40, now() - st.t);
          hs.e = Math.min(1, hs.e + 0.7 + v * 0.3);
          sfx('whirr'); buzz(10);
          if (hs.phase !== 'draw') { hs.phase = 'draw'; hs.msg = SPIN.draw; hs.msgKind = ''; stepStatus(); CTRL.spin.guide(hs); }
          return;
        }
        if (dy > 0 && hs.e >= 0.1) {
          hs.drawing = true;
          hs.d = Math.min(1, hs.d + dy / 230);
          world.setDrop(hs.d);
          if (hs.d >= 1) wind();
        }
      },
      up: function () { st = null; hs.drawing = false; }
    };
  },
  guide: function (hs) {
    var at = screenOf(function () { var p = world.spindleTop(); return { x: p.x, y: p.y - 0.08, z: p.z }; });
    if (hs.phase === 'roll') guide('up', at, null, SPIN.lRoll); else guide('down', at, null, SPIN.lDrop);
  },
  status: function (hs) { return hs.len ? { en: 'Spun ' + hs.len + ' of 3 lengths', ar: 'غزلت ' + num(hs.len) + ' من ' + num(3) + ' أطوال' } : SPIN.roll; }
};

// 4. dye: drag a white skein into a pot, hold it there while it soaks, let go when the color is right
function slotFor(hs, pot) { for (var k in hs.bind) if (hs.bind[k] === pot) return k; return null; }
function dyePct(d) { return (clamp(d / 1.6, 0, 1) * 100).toFixed(1); }
function dyeBars(hs) {
  return '<div class="sd-dyes" id="sd-dyes">' + ['red', 'orange'].map(function (pot) {
    var slot = slotFor(hs, pot), d = slot ? hs.d[slot] : 0, done = hs.done[pot];
    var dark = '#' + world.dyeColor(pot, 1.6).getHexString();
    return '<div class="sd-dye' + (done ? ' is-done' : '') + '" data-pot="' + pot + '">' +
      '<b>' + L(YARN[pot]) + '</b>' +
      '<div class="sd-dyebar" style="--c:' + YARN[pot].hex + ';--d:' + dark + '"><i class="z"></i><i class="m" style="left:' + dyePct(d) + '%"></i></div>' +
      (done ? ICON.check : '<span></span>') + '</div>';
  }).join('') +
  '<div class="sd-dye-k"><span>' + L(DYE.lPale) + '</span><span>' + L(DYE.lRight) + '</span><span>' + L(DYE.lDark) + '</span></div></div>';
}
function updateDyeBar(pot, d) { var m = $('.sd-dye[data-pot="' + pot + '"] .m', panel); if (m) m.style.left = dyePct(d) + '%'; }
CTRL.dye = {
  start: function (hs) {
    hs.d = { red: 0, orange: 0 }; hs.bind = {}; hs.done = {}; hs.slotDone = {}; hs.drag = null;
    setMarks(['red', 'orange'].map(function (k) { return function () { return !hs.slotDone[k] && !(hs.drag && hs.drag.slot === k) ? world.toScreen(world.skeinPos(k)) : null; }; }));
  },
  frame: function (hs, dt) {
    var g = hs.drag; if (!g || !g.pot) return;
    hs.d[g.slot] += dt * 0.42;
    world.setDyeDepth(g.slot, g.pot, hs.d[g.slot]);
    updateDyeBar(g.pot, hs.d[g.slot]);
  },
  gesture: function (hs) {
    function move(p) {
      var g = hs.drag; if (!g) return;
      var q = world.planeAt(p.x, p.y, 0.42); if (!q) return;
      var near = null, nd = 0.1;
      ['red', 'orange'].forEach(function (k) { var pp = world.potPos(k), d = Math.hypot(q.x - pp.x, q.z - pp.z); if (d < nd) { nd = d; near = k; } });
      var ok = near && !hs.done[near] && (!hs.bind[g.slot] || hs.bind[g.slot] === near);
      if (near && !ok && g.warned !== near) {
        g.warned = near; hs.msg = hs.done[near] ? DYE.potDone : DYE.samePot; hs.msgKind = 'bad'; stepStatus();
      }
      if (ok) {
        if (g.pot !== near) { g.pot = near; hs.bind[g.slot] = near; world.ripple(near); sfx('dip'); hs.msg = DYE.soak; hs.msgKind = ''; stepStatus(); clearGuide(); }
        var pp = world.potPos(near); world.skeinTo(g.slot, pp.x, 0.235, pp.z);
      } else {
        if (g.pot) { world.ripple(g.pot); g.pot = null; }
        world.skeinTo(g.slot, q.x, 0.42, q.z);
      }
    }
    return {
      down: function (p) {
        if (hs.ok || now() < (hs.flyUntil || 0)) return;
        var best = null, bd = 54;
        ['black', 'white', 'brown', 'beige', 'red', 'orange'].forEach(function (k) { var s = world.toScreen(world.skeinPos(k)), d = Math.hypot(s.x - p.x, s.y - p.y); if (d < bd) { bd = d; best = k; } });
        if (!best) return;
        if (best !== 'red' && best !== 'orange') {
          var y = YARN[best];
          toast({ en: 'No dye needed: ' + y.en.toLowerCase() + ' comes from ' + y.from.en + '.', ar: 'ما يحتاج صبغ: ' + y.arDef + ' من ' + y.from.ar + '.' });
          return;
        }
        if (hs.slotDone[best]) return;
        hs.drag = { slot: best, pot: null };
        sfx('tap');
        move(p);
      },
      move: move,
      up: function () {
        var g = hs.drag; if (!g) return;
        hs.drag = null;
        var slot = g.slot, pot = hs.bind[slot], d = hs.d[slot];
        if (!pot || d <= 0) { world.skeinHome(slot); return; }
        if (d < 0.78) { hs.msg = DYE.pale; hs.msgKind = 'bad'; sfx('bad'); }
        else if (d > 1.25) {
          hs.msg = DYE.dark; hs.msgKind = 'bad'; sfx('bad');
          hs.d[slot] = 0; delete hs.bind[slot]; world.setDyeDepth(slot, pot, 0);
        } else { hs.done[pot] = true; hs.slotDone[slot] = true; hs.msg = DYE.right; hs.msgKind = 'good'; sfx('ok'); buzz(15); }
        world.skeinHome(slot); hs.flyUntil = now() + 450;
        renderHow(false);
        if (hs.done.red && hs.done.orange) setTimeout(stepDone, 450);
        else CTRL.dye.guide(hs);
      }
    };
  },
  guide: function (hs) {
    var slot = !hs.slotDone.red ? 'red' : !hs.slotDone.orange ? 'orange' : null;
    if (!slot) { clearGuide(); return; }
    var pot = hs.bind[slot] || (hs.done.red ? 'orange' : hs.done.orange ? 'red' : (slot === 'red' ? 'red' : 'orange'));
    guide('drag', screenOf(function () { return world.skeinPos(slot); }), screenOf(function () { return world.potPos(pot); }));
  }
};

// 5. stakes: tap each one twice to drive it into the sand
CTRL.stakes = {
  start: function () {
    setMarks([0, 1, 2, 3].map(function (i) { return function () { return (world.stakes[i].userData.hits || 0) < 2 ? world.toScreen(world.stakeTop(i)) : null; }; }));
  },
  gesture: function (hs) {
    function hit(p) {
      if (hs.ok) return;
      var best = -1, bd = 56;
      for (var i = 0; i < 4; i++) {
        if ((world.stakes[i].userData.hits || 0) >= 2 || now() < (world.stakes[i].userData.until || 0)) continue;
        var s = world.toScreen(world.stakeTop(i)), d = Math.hypot(s.x - p.x, s.y - p.y);
        if (d < bd) { bd = d; best = i; }
      }
      if (best < 0) return;
      world.stakes[best].userData.until = now() + 280;
      var h = world.hitStake(best);
      setTimeout(function () { sfx('thunk'); buzz(18); }, 130);
      if (h >= 2) { hs.n++; if (hs.n >= 4) setTimeout(stepDone, 550); else setTimeout(stepStatus, 200); }
    }
    return swiper({ onTap: hit, onSwipe: function (dir, p, from) { if (dir === 'down') hit(from); } });
  },
  status: function (hs) { return { en: hs.n + ' of 4 stakes in', ar: 'دقّيت ' + num(hs.n) + ' من ' + num(4) + ' أوتاد' }; }
};

// 6. the warp: drag the ball of yarn from one beam to the other and back
function warpPlan(hs) {
  var cells = world.warpCols.map(function (c, i) {
    var pair = world.pairCols[i];
    return '<i class="' + (i < hs.cols ? 'on' : '') + '" style="background:' + (pair ? 'linear-gradient(90deg,' + c + ' 50%,' + pair + ' 50%)' : c) + '"></i>';
  }).join('');
  return '<div class="sd-plan" id="sd-plan"><div class="sd-plan-l"><span>' + L(WARP.plan) + '</span><b>' + num(hs.cols) + '/' + num(COLS) + '</b></div><div class="sd-plan-c">' + cells + '</div></div>';
}
function yarnOf(hex) { for (var k in YARN) if (YARN[k].hex === hex) return k; return 'white'; }
function ballZ(t) { return LOOM.FRONT + 0.02 + t * (LOOM.BACK - LOOM.FRONT - 0.04); }
function placeBall(hs) {
  var i = Math.min(COLS - 1, hs.cols + 1.5);
  world.setBall(world.colX(i), ballZ(hs.t), world.warpCols[Math.min(COLS - 1, hs.cols)], hs.toBack ? LOOM.FRONT : LOOM.BACK);
}
CTRL.warp = {
  start: function (hs) { hs.cols = 0; hs.toBack = true; hs.t = 0; placeBall(hs); },
  gesture: function (hs) {
    var st = null;
    function fingerZ(p) { var q = world.planeAt(p.x, p.y, LOOM.Y); return q ? q.z : null; }
    function commit() {
      hs.t = hs.toBack ? 1 : 0;
      var before = hs.cols; hs.cols = Math.min(COLS, hs.cols + 4);
      world.setWarpCols(hs.cols);
      hs.toBack = !hs.toBack;
      sfx('lay'); buzz(8);
      if (hs.cols >= COLS) { world.hideBall(); st = null; stepDone(); return; }
      var mid = ZONES.center[0];
      if (hs.cols >= mid && before < mid) { hs.msg = WARP.pairs; hs.msgKind = ''; }
      else if (world.warpCols[before] !== world.warpCols[hs.cols]) { hs.msg = WARP.now(yarnOf(world.warpCols[hs.cols])); hs.msgKind = ''; }
      else hs.msg = null;
      placeBall(hs); stepStatus(); CTRL.warp.guide(hs);
    }
    return {
      down: function (p) { if (hs.ok) return; var z = fingerZ(p); st = { t0: hs.t, z0: z }; },
      move: function (p) {
        if (!st || hs.ok) return;
        var z = fingerZ(p); if (z == null) return;
        if (st.z0 == null) { st.z0 = z; return; }
        hs.t = clamp(st.t0 + (st.z0 - z) / (LOOM.FRONT - LOOM.BACK), 0, 1);
        placeBall(hs);
        if (hs.toBack ? hs.t >= 0.94 : hs.t <= 0.06) { commit(); if (st) { st.t0 = hs.t; st.z0 = z; } }
      },
      up: function () {
        st = null;
        if (hs.ok) return;
        // the thread has to reach the other beam: the ball slides back to where this pass began
        var from = hs.t, to = hs.toBack ? 0 : 1;
        if (Math.abs(from - to) < 0.001) return;
        world.animate(0.25, function (k) { hs.t = from + (to - from) * k; placeBall(hs); });
      }
    };
  },
  guide: function (hs) {
    guide('drag', screenOf(function () { return world.ball.position; }), screenOf(function () { return { x: world.ball.position.x, y: LOOM.Y, z: ballZ(hs.toBack ? 1 : 0) }; }));
  },
  status: function (hs) { return { en: 'Thread by thread, in order', ar: 'خيط ورا خيط، بالترتيب' }; }
};

// 7. weave: swipe up to open, across to pass the mishaʿ, down to beat with the minshaza
function weaveWant(hs) { return hs.step === 0 ? 'up' : hs.step === 1 ? (hs.row % 2 ? 'left' : 'right') : 'down'; }
CTRL.weave = {
  start: function (hs) { hs.row = 0; hs.step = 0; world.setWoven(0); world.mishaaX = -0.34; world.mishaa.visible = true; world.placeTools(); },
  gesture: function (hs) {
    return swiper({ min: 30, onSwipe: function (dir) {
      if (hs.ok || hs.lock) return;
      var want = weaveWant(hs);
      if (dir !== want) {
        hs.msg = want === 'up' ? WEAVE.wUp : want === 'down' ? WEAVE.wDown : want === 'right' ? WEAVE.wRight : WEAVE.wLeft;
        hs.msgKind = 'bad'; sfx('bad'); buzz([15, 30, 15]); stepStatus(); return;
      }
      hs.msgKind = '';
      if (hs.step === 0) { world.openShed(hs.row % 2); sfx('shed'); hs.msg = hs.row === 1 ? WEAVE.other : WEAVE.up; }
      else if (hs.step === 1) { world.passWeft(hs.row % 2 ? -1 : 1); sfx('pass'); hs.msg = WEAVE.pass; }
      else { world.doBeat(); world.closeShed(); sfx('beat'); buzz(12); hs.row++; world.setWoven(hs.row); hs.msg = WEAVE.beat; }
      hs.step = (hs.step + 1) % 3;
      if (hs.row >= 4) { hs.lock = true; setTimeout(stepDone, 450); stepStatus(); return; }
      stepStatus(); CTRL.weave.guide(hs);
    } });
  },
  guide: function (hs) {
    var want = weaveWant(hs);
    guide(want, screenOf(function () { return { x: 0, y: LOOM.Y + 0.02, z: world.fellZ() - 0.05 }; }), null, want === 'up' ? WEAVE.lOpen : want === 'down' ? WEAVE.lBeat : WEAVE.lPass);
  },
  status: function (hs) { return { en: 'Row ' + (hs.row + 1) + ' of 4', ar: 'الصف ' + num(hs.row + 1) + ' من ' + num(4) }; }
};

// 8. pick up the pattern: a close-up of the threads; tap the ones the row needs, then beat
function pickTarget(hs) {
  var y = LEAD + hs.r, F = world.spec.figure, a = [];
  for (var i = 0; i < 15; i++) a.push(world.cellAt(y, ZONES.center[0] + i) === F);
  return a;
}
function pickMatch(hs) { var t = pickTarget(hs); for (var i = 0; i < 15; i++) if (t[i] !== hs.up[i]) return false; return true; }
function showLoupe(hs) { loupeEl.hidden = false; document.body.classList.add('sd-picking'); renderLoupe(hs, true); }
function hideLoupe() { if (loupeEl) { loupeEl.hidden = true; loupeEl.innerHTML = ''; } document.body.classList.remove('sd-picking'); }
function renderLoupe(hs, fresh) {
  var t = pickTarget(hs), Fh = YARN[world.spec.figure].hex, Gh = YARN[world.spec.ground].hex, th = '', gh = '';
  for (var i = 0; i < 15; i++) {
    th += '<span class="sd-lp-t' + (hs.up[i] ? ' up' : '') + '" data-i="' + i + '"><i class="g" style="background:' + Gh + '"></i><i class="f" style="background:' + Fh + '"></i></span>';
    gh += '<i class="' + (t[i] === hs.up[i] ? 'ok' : 'no') + '" style="background:' + (t[i] ? Fh : Gh) + '"></i>';
  }
  var match = pickMatch(hs);
  loupeEl.innerHTML =
    '<div class="sd-lp-h"><span>' + L(PICK.threads) + '</span><b>' + L({ en: 'Row ' + (hs.r + 1) + ' of ' + PICK_ROWS, ar: 'الصف ' + num(hs.r + 1) + ' من ' + num(PICK_ROWS) }) + '</b></div>' +
    '<div class="sd-lp-threads" id="sd-lp-threads">' + th + '</div>' +
    '<div class="sd-lp-row' + (match ? ' is-match' : '') + '" title="' + L(PICK.row) + '">' + gh + '</div>' +
    '<canvas class="sd-lp-cloth" id="sd-lp-cloth"></canvas>';
  drawCloth(hs);
}
function drawCloth(hs) {
  var cv = $('#sd-lp-cloth', loupeEl); if (!cv) return;
  var w = cv.clientWidth || 340, rows = 4, dpr = Math.min(2, window.devicePixelRatio || 1);
  var cw = w / 15, ch = 15;
  cv.width = Math.round(w * dpr); cv.height = Math.round(rows * ch * dpr);
  cv.style.height = (rows * ch) + 'px';
  var ctx = cv.getContext('2d'); ctx.scale(dpr, dpr);
  // newest row on top, right under the threads
  var cells = new Uint8Array(15 * rows), newest = LEAD + hs.r - 1;
  for (var r = 0; r < rows; r++) for (var i = 0; i < 15; i++) {
    var y = newest - r;
    cells[r * 15 + i] = y >= 0 ? world.grid.cells[y * COLS + ZONES.center[0] + i] : YARN_KEYS.indexOf(world.spec.ground);
  }
  drawBand(ctx, { W: 15, R: rows, cells: cells }, { cw: cw, ch: ch });
}
function threadAt(x) {
  var el = $('#sd-lp-threads', loupeEl); if (!el) return -1;
  var r = el.getBoundingClientRect(); if (x < r.left || x > r.right) return -1;
  return clamp(Math.floor((x - r.left) / r.width * 15), 0, 14);
}
function setThread(hs, i, up) {
  if (i < 0 || hs.up[i] === up) return;
  hs.up[i] = up;
  sfx(up ? 'pluck' : 'tap'); buzz(6);
  renderLoupe(hs);
  if (pickMatch(hs)) { hs.msg = PICK.match; hs.msgKind = 'good'; } else if (hs.msgKind === 'good' || hs.msg === PICK.notYet) { hs.msg = null; }
  stepStatus(); CTRL.pick.guide(hs);
}
function pickBeat(hs) {
  if (hs.ok || hs.finishing) return;
  if (!pickMatch(hs)) {
    hs.msg = PICK.notYet; hs.msgKind = 'bad'; sfx('bad'); buzz([15, 30, 15]); stepStatus();
    loupeEl.classList.remove('shake'); void loupeEl.offsetWidth; loupeEl.classList.add('shake');
    return;
  }
  world.doBeat(); sfx('beat'); buzz(12);
  hs.r++; world.setWoven(LEAD + hs.r);
  hs.up = hs.up.map(function () { return false; });
  hs.msg = null;
  if (hs.r >= PICK_ROWS) { finishTree(hs); return; }
  renderLoupe(hs); stepStatus(); CTRL.pick.guide(hs);
}
function finishTree(hs) {
  hs.finishing = true; hideLoupe(); clearGuide();
  hs.msg = PICK.rest; hs.msgKind = ''; stepStatus();
  if (!S.inAR) world.view('weave', { k: 1.2 });
  var my = token, row = LEAD + hs.r, end = LEAD + TREE_ROWS;
  (function next() {
    if (my !== token) return;
    if (row >= end) { stepDone(); return; }
    row++; world.setWoven(row); world.doBeat(0.12);
    if (row % 3 === 0) sfx('beat');
    setTimeout(next, 120);
  })();
}
CTRL.pick = {
  start: function (hs) {
    hs.r = 0; hs.up = []; for (var i = 0; i < 15; i++) hs.up.push(false);
    world.setWoven(LEAD);
    showLoupe(hs);
    // the loupe takes taps and drags across the threads, and a swipe down to beat
    var lp = null;
    loupeEl.onpointerdown = function (e) {
      if (hs.ok || hs.finishing) return;
      S.touching = true;
      try { loupeEl.setPointerCapture(e.pointerId); } catch (x) {}
      var i = threadAt(e.clientX), onThreads = i > -1 && e.target.closest && e.target.closest('.sd-lp-threads');
      lp = { x: e.clientX, y: e.clientY, first: onThreads ? i : -1, mode: onThreads ? !hs.up[i] : null, beat: false };
      if (onThreads) setThread(hs, i, lp.mode);
    };
    loupeEl.onpointermove = function (e) {
      if (!lp || lp.beat) return;
      var dy = e.clientY - lp.y, dx = e.clientX - lp.x;
      if (dy > 42 && Math.abs(dx) < 34) {
        lp.beat = true;
        if (lp.first > -1) setThread(hs, lp.first, !lp.mode);
        pickBeat(hs); return;
      }
      if (lp.mode != null) setThread(hs, threadAt(e.clientX), lp.mode);
    };
    loupeEl.onpointerup = loupeEl.onpointercancel = function () { lp = null; S.touching = false; GD.from = now() + 1600; };
  },
  gesture: function (hs) { return swiper({ onSwipe: function (dir) { if (dir === 'down') pickBeat(hs); } }); },
  guide: function (hs) {
    if (hs.finishing) return;
    if (pickMatch(hs)) { guide('down', function () { var r = loupeEl.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.bottom + 46 }; }, null, WEAVE.lBeat); return; }
    var t = pickTarget(hs), k = -1;
    for (var i = 0; i < 15; i++) if (t[i] !== hs.up[i]) { k = i; break; }
    guide('tap', function () { var el = $('.sd-lp-t[data-i="' + k + '"]', loupeEl); if (!el) return null; var r = el.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height * 0.55 }; });
  },
  status: function () { return { en: 'Lift the white threads where the row shows white.', ar: 'ارفع الخيوط البيضاء مكان الأبيض بالصف.' }; }
};

// ════════════════════════════════════════════════════════════
// 3. THE GAME: read the Sadu, then race Grandma Haya
// ════════════════════════════════════════════════════════════
var lastBand = -1;
function newGame() {
  return { phase: 'intro', qi: 0, score: 0, answered: null, order: QUESTIONS.map(function (q) { return shuffle(q.options); }),
    racePts: 0, raceLevel: 1, race: null, spec: null, over: false };
}
function startPlay() {
  S.game = newGame();
  finishedLoom();
  if (!S.inAR) world.view('tent', { k: 1.3 });
  renderGame();
}
function renderGame() {
  var g = S.game;
  if (g.over) return renderResults();
  if (g.phase === 'intro') return renderIntro();
  if (g.phase === 'q') return renderQuestion();
  if (g.phase === 'raceIntro') return renderRaceIntro();
  if (g.phase === 'race') { panel.innerHTML = ''; panel.className = 'mq-panel'; setBar({ buttons: [] }); return; }
  if (g.phase === 'raceDone') return renderRaceDone();
}
function hayaHead(sub) {
  return '<div class="sd-haya">' + HAYA + '<div><div class="sd-haya-name">' + L(G.name) + '</div><div class="sd-haya-role">' + L(sub || G.role) + '</div></div></div>';
}
function renderIntro() {
  panel.className = 'mq-panel qx-enter';
  panel.innerHTML = hayaHead() + '<h2 class="mq-title">' + L(G.introT) + '</h2><p class="mq-p">' + L(G.introP) + '</p>';
  setBar({ buttons: [{ label: G.start, icon: 'next', onClick: function () { sfx('tap'); S.game.phase = 'q'; S.game.qi = 0; renderGame(); renderParts(); } }] });
}

// ── round 1: read the Sadu ──
function renderQuestion() {
  var g = S.game, q = QUESTIONS[g.qi], opts = g.order[g.qi], ans = g.answered;
  if (!S.inAR) world.view('loom', { k: 1.2 });
  var html = '<div class="qx-kicker">' + L(G.r1) + ' · ' + num(g.qi + 1) + '/' + num(QUESTIONS.length) + '</div>' +
    '<h2 class="mq-title sd-q">' + L(q.prompt) + '</h2>';
  if (q.show) html += '<div class="sd-preview" id="sd-show"></div>';
  html += '<div class="sd-opts sd-opts-' + q.kind + '">' + opts.map(function (k) {
    var cls = 'sd-opt';
    if (ans) { if (k === q.answer) cls += ' is-right'; else if (k === ans) cls += ' is-wrong'; else cls += ' is-dim'; }
    var inner = q.kind === 'bands' ? '' : q.kind === 'yarn' ? '<i style="background:' + YARN[k].hex + '"></i><b>' + L(YARN[k]) + '</b>' : '<b>' + L((q.labels || NAMES)[k]) + '</b>';
    return '<button class="' + cls + '" data-opt="' + k + '"' + (ans ? ' disabled' : '') + '>' + inner + '</button>';
  }).join('') + '</div>';
  if (ans) html += '<div class="qx-feedback ' + (ans === q.answer ? 'good' : 'bad') + '">' + (ans === q.answer ? ICON.check : ICON.info) + '<span>' + L(ans === q.answer ? q.good : q.bad) + '</span></div>';
  panel.className = 'mq-panel is-game' + (ans ? '' : ' qx-enter');
  panel.innerHTML = html;
  if (q.show) $('#sd-show').appendChild(band(q.show, 92, { dim: q.dim }));
  if (q.kind === 'bands') {
    $$('[data-opt]', panel).forEach(function (b) {
      var k = b.getAttribute('data-opt');
      b.appendChild(band({ edge: 'teeth', center: k, ground: 'red', figure: 'white' }, 92));
    });
  }
  $$('[data-opt]', panel).forEach(function (b) { b.addEventListener('click', function () { answer(b.getAttribute('data-opt')); }); });
  if (ans) {
    var last = g.qi === QUESTIONS.length - 1;
    setBar({ buttons: [{ label: T.next, icon: 'next', onClick: function () {
      sfx('tap'); g.answered = null;
      if (last) g.phase = 'raceIntro'; else g.qi++;
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

// ── round 2: the race ──
function raceRowTime(level) { return RACE.row * Math.pow(0.85, level - 1); }
// from level 2 the arrow comes a beat late, so knowing the rhythm pays off
function raceCueDelay(level) { return Math.min(0.2, 0.07 * (level - 1)); }
function newRace(level) { return { phase: 'count', level: level, row: 0, step: 0, pack: 0, slips: 0, streak: 0, best: 0, t: 0, haya: 0, hayaWait: 0, lockT: 0, won: false }; }
function raceWant(r) { if (r.pack > 0) return 'tap'; return r.step === 0 ? 'up' : r.step === 1 ? (r.row % 2 ? 'left' : 'right') : 'down'; }
function setupRaceLoom(spec) {
  world.setSpec(spec); world.setStakes(4); world.setWarp(1); world.setWoven(0);
  world.shedOpen = 0; world.mishaaX = -0.34; world.mishaa.visible = true; world.placeTools();
}
function moveChip(kind, label) {
  var icon = kind === 'across' ? ARROW_LR : kind === 'tap' ? TAPPER : ARROW;
  return '<div class="sd-move m-' + kind + '"><span class="sd-move-i">' + icon + '</span><b>' + L(label) + '</b></div>';
}
function renderRaceIntro() {
  var g = S.game;
  if (!g.spec) { var bi; do { bi = Math.floor(Math.random() * BANDS.length); } while (bi === lastBand && BANDS.length > 1); lastBand = bi; g.spec = BANDS[bi]; }
  setupRaceLoom(g.spec);
  if (!S.inAR) world.view('race', { k: 1.3 });
  panel.className = 'mq-panel is-game qx-enter';
  panel.innerHTML = '<div class="qx-kicker">' + L(R.title) + (g.raceLevel > 1 ? ' · ' + L(R.level) + ' ' + num(g.raceLevel) : '') + '</div>' +
    '<div class="sd-bubble">' + HAYA + '<p>' + L(g.raceLevel > 1 ? R.intro2 : R.intro) + '</p></div>' +
    '<div class="sd-raceband"><div class="sd-preview" id="sd-rb"></div><small>' + L(bandName(g.spec)) + '</small></div>' +
    '<div class="sd-moves">' + moveChip('up', R.open) + moveChip('across', R.pass) + moveChip('down', R.beat) + moveChip('tap', R.pack) + '</div>' +
    '<p class="sd-tip">' + L(R.tip) + '</p>';
  $('#sd-rb').appendChild(band(g.spec, 70, { cw: 2.2, ch: 3 }));
  setBar({ buttons: [{ label: R.ready, icon: 'next', onClick: function () { sfx('tap'); startCountdown(); } }] });
}
function startCountdown() {
  var g = S.game, my = ++token;
  g.phase = 'race'; g.race = newRace(g.raceLevel);
  renderGame();
  document.body.classList.add('sd-racing');
  showHUD(); renderRaceHUD();
  var seq = [{ en: '3', ar: '٣' }, { en: '2', ar: '٢' }, { en: '1', ar: '١' }, null];
  seq.forEach(function (s, i) {
    setTimeout(function () {
      if (my !== token || !g.race) return;
      if (!s) {
        shout(R.go, 'good'); sfx('go');
        g.race.phase = 'run';
        setGesture(swiper({ min: 26, onSwipe: function (dir) { raceInput(dir); }, onTap: function () { raceInput('tap'); } }));
        raceCue();
      } else { shout(s, 'round'); sfx('tick'); }
    }, i * 700);
  });
}
function raceInput(m) {
  var g = S.game, r = g && g.race;
  if (!r || r.phase !== 'run' || r.lockT > 0) return;
  var want = raceWant(r);
  if (want === 'tap') {
    if (m !== 'tap') return;
    r.pack--; world.doBeat(0.12); sfx('pack'); buzz(8);
    renderPrompt(r);
    if (r.pack <= 0) raceCue();
    return;
  }
  if (m !== want) {
    if (m === 'tap') return;          // stray taps don't count against you
    r.slips++; r.streak = 0; r.lockT = RACE.lock;
    sfx('bad'); buzz([15, 30, 15]);
    shout(R.wrong, 'bad');
    promptEl.classList.remove('shake'); void promptEl.offsetWidth; promptEl.classList.add('shake');
    renderRaceHUD();
    return;
  }
  r.streak++; r.best = Math.max(r.best, r.streak);
  sfx('note', r.streak);
  if (r.step === 0) { world.openShed(r.row % 2, 0.12); sfx('shed'); }
  else if (r.step === 1) { world.passWeft(r.row % 2 ? -1 : 1, 0.16); }
  else { world.doBeat(0.16); world.closeShed(0.1); sfx('beat'); buzz(10); }
  r.step++;
  if (r.step === 3) {
    r.step = 0; r.row++;
    world.setWoven(r.row * RACE.per);
    if (r.row >= RACE.rows) { endRace(true); return; }
    if (r.row % RACE.packEvery === 0) r.pack = RACE.packTaps;
  }
  renderRaceHUD();
  raceCue();
}
var cueTimer = 0;
function raceCue() {
  clearTimeout(cueTimer);
  promptEl.classList.remove('show');
  var r = S.game && S.game.race;
  // the arrow shows a moment later, so a weaver who knows the rhythm can move first
  cueTimer = setTimeout(function () {
    if (!r || r.phase !== 'run') return;
    renderPrompt(r); promptEl.hidden = false;
    void promptEl.offsetWidth; promptEl.classList.add('show');
  }, r && r.pack > 0 ? 0 : raceCueDelay(r ? r.level : 1) * 1000);
}
function renderPrompt(r) {
  var w = raceWant(r);
  var icon = w === 'tap' ? TAPPER : ARROW;
  var label = w === 'tap' ? L(R.packNow) + ' <em>' + num(r.pack) + '</em>' : L(w === 'up' ? R.open : w === 'down' ? R.beat : R.pass);
  promptEl.className = 'sd-prompt p-' + w + (promptEl.classList.contains('show') ? ' show' : '');
  promptEl.innerHTML = '<div class="sd-prompt-i">' + icon + '</div><span>' + label + '</span>';
}
function showHUD() {
  hudEl.hidden = false;
  hudEl.innerHTML =
    '<div class="mq-pl me"><span class="mq-name">' + L(R.you) + '</span><b data-k="me">0</b><span class="sd-track"><i data-k="meBar"></i></span></div>' +
    '<div class="mq-pot"><small>' + L(R.streak) + '</small><b data-k="streak">0</b></div>' +
    '<div class="mq-pl haya"><span class="mq-name">' + L(G.short) + '</span><b data-k="haya">0</b><span class="sd-track"><i data-k="hayaBar"></i></span></div>';
}
function hideHUD() { if (hudEl) { hudEl.hidden = true; hudEl.innerHTML = ''; } }
function renderRaceHUD() {
  var r = S.game && S.game.race; if (!r || hudEl.hidden) return;
  var q = function (k) { return $('[data-k="' + k + '"]', hudEl); };
  var me = q('me'); if (!me) return;
  me.textContent = num(r.row);
  q('haya').textContent = num(Math.floor(r.haya));
  q('streak').textContent = num(r.streak);
  q('meBar').style.width = (r.row / RACE.rows * 100).toFixed(1) + '%';
  q('hayaBar').style.width = (Math.min(1, r.haya / RACE.rows) * 100).toFixed(1) + '%';
}
function raceFrame(dt) {
  var g = S.game; if (!g || g.phase !== 'race') return;
  var r = g.race; if (!r || r.phase !== 'run') return;
  r.t += dt;
  if (r.lockT > 0) r.lockT -= dt;
  if (r.t > RACE.head) {
    if (r.hayaWait > 0) r.hayaWait -= dt;
    else {
      var before = Math.floor(r.haya);
      r.haya += dt / raceRowTime(r.level);
      var after = Math.floor(r.haya);
      if (after > before && after % RACE.packEvery === 0 && after < RACE.rows) r.hayaWait = RACE.pack;
    }
  }
  if (r.haya >= RACE.rows) { r.haya = RACE.rows; renderRaceHUD(); endRace(false); return; }
  renderRaceHUD();
}
function racePoints(r) {
  return [
    { ok: r.won, t: R.ptsWin, v: 2 },
    { ok: r.slips <= 2 && r.row >= 8, t: R.ptsClean, v: 1 },
    { ok: r.best >= 12, t: R.ptsRhythm, v: 1 }
  ];
}
function endRace(won) {
  var g = S.game, r = g.race, my = token;
  r.phase = 'done'; r.won = won;
  clearTimeout(cueTimer); promptEl.classList.remove('show'); promptEl.hidden = true;
  setGesture(null);
  r.pts = racePoints(r).reduce(function (a, p) { return a + (p.ok ? p.v : 0); }, 0);
  g.racePts = Math.max(g.racePts, r.pts);
  if (won) g.raceLevel++;
  g.phase = 'raceDone';
  shout(won ? R.youWin : R.hayaWins, won ? 'good' : 'bad');
  if (won) { sfx('win'); buzz([30, 40, 70]); } else sfx('bad');
  renderRaceHUD();
  setTimeout(function () {
    if (my !== token || S.part !== 'play' || g.phase !== 'raceDone') return;
    hideHUD(); document.body.classList.remove('sd-racing');
    world.setHanging(g.spec);
    if (!S.inAR) world.view('tent', { k: 1.1 });
    renderRaceDone(); renderParts();
  }, 1200);
}
function fmtTime(t) { return num(t.toFixed(1)) + L(R.sec); }
function renderRaceDone() {
  var g = S.game, r = g.race, won = r.won;
  var stat = function (label, v) { return '<div><small>' + L(label) + '</small><b>' + v + '</b></div>'; };
  panel.className = 'mq-panel is-game qx-enter';
  panel.innerHTML = '<div class="sd-bubble">' + HAYA + '<p>' + L(won ? R.won : R.lost) + '</p></div>' +
    '<p class="sd-note">' + L(won ? R.hungYours : R.hungHers) + '</p>' +
    '<div class="sd-stats">' + stat(R.time, fmtTime(r.t)) + stat(R.slips, num(r.slips)) + stat(R.best, num(r.best)) +
    (won ? '' : stat(R.rows, num(r.row) + '/' + num(RACE.rows))) + '</div>' +
    '<div class="sd-marks">' + racePoints(r).map(function (p) {
      return '<div class="' + (p.ok ? 'y' : 'n') + '">' + (p.ok ? ICON.check : ICON.x) + '<span><b>' + L(p.t) + '</b> <small>+' + num(p.v) + '</small></span></div>';
    }).join('') + '</div>';
  setBar({ buttons: [
    { label: R.again, kind: 'line', iconFirst: 'replay', onClick: function () { sfx('tap'); g.phase = 'raceIntro'; g.spec = null; renderGame(); renderParts(); } },
    { label: T.next, icon: 'next', onClick: function () { sfx('tap'); endGame(); } }
  ] });
}

function starsFor(score) { return score >= MAX_SCORE ? 3 : score >= MAX_SCORE - 2 ? 2 : 1; }
function endGame() {
  var g = S.game, total = g.score + g.racePts;
  g.over = true; g.phase = 'over';
  var stars = starsFor(total);
  try {
    var all = JSON.parse(localStorage.getItem('cl_progress') || '{}');
    var prev = all.sadu || {};
    all.sadu = { score: Math.max(total, prev.score || 0), last: total, max: MAX_SCORE, stars: Math.max(stars, prev.stars || 0), at: new Date().toISOString() };
    localStorage.setItem('cl_progress', JSON.stringify(all));
  } catch (e) {}
  sfx('star');
  renderResults();
  renderParts();
}
function renderResults() {
  var g = S.game, total = g.score + g.racePts, stars = starsFor(total);
  var title = RESULT_TITLES.filter(function (r) { return total >= r.min; })[0].t;
  panel.className = 'mq-panel mq-results qx-enter';
  panel.innerHTML = '<div class="mq-stars">' + [0, 1, 2].map(function (i) { return '<i class="' + (i < stars ? 'on' : '') + '">' + ICON.star + '</i>'; }).join('') + '</div>' +
    '<h2 class="mq-title">' + L(title) + '</h2>' +
    '<p class="mq-p">' + L(G.score) + ': ' + num(total) + ' / ' + num(MAX_SCORE) + '</p>' +
    '<div class="sd-split"><span>' + L(G.readPart) + ' <b>' + num(g.score) + '/' + num(QUESTIONS.length) + '</b></span><span>' + L(G.racePart) + ' <b>' + num(g.racePts) + '/' + num(4) + '</b></span></div>' +
    '<div class="mq-learn"><div class="qx-kicker">' + L(G.learned) + '</div>' + LEARN.map(function (l) { return '<div class="mq-learn-row">' + ICON.check + '<span>' + L(l) + '</span></div>'; }).join('') + '</div>';
  setBar({ buttons: [
    { label: G.again, kind: 'line', iconFirst: 'replay', onClick: function () { sfx('tap'); setPart('play'); } },
    { label: G.finish, onClick: function () { location.href = 'experience.html?x=sadu'; } }
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
  panel.innerHTML = '<div class="qx-kicker">' + L(T.ar) + '</div><h2 class="mq-title">' + L(T.arScanT) + '</h2><p class="mq-p">' + L(T.arScanP) + '</p><div class="mq-status show" id="sd-scan">' + L(world.canPlace() ? T.arGood : T.arWait) + '</div>';
  setBar({ buttons: [
    { label: T.arFloor, kind: world.arScale === 1 ? 'solid' : 'line', id: 'sd-floor', onClick: function () { world.setARScale(1); renderScan(); } },
    { label: T.arTable, kind: world.arScale < 1 ? 'solid' : 'line', id: 'sd-table', onClick: function () { world.setARScale(0.35); renderScan(); } },
    { label: T.arPlace, id: 'sd-place', disabled: !world.canPlace(), onClick: function () { if (world.placeField()) { sfx('thunk'); buzz(20); } } }
  ] });
  $$('#sd-floor, #sd-table', bar).forEach(function (b) { b.classList.add('mq-chip'); });
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
    var v = S.part === 'story' ? STORY[S.ch].scene : S.part === 'how' ? (S.howDone ? 'loom' : HOW[S.how].view) : (g && (g.phase === 'race' || g.phase === 'raceIntro') ? 'race' : 'loom');
    world.view(v, { snap: true });
  }
}
function resume() {
  if (S.part === 'story') goCh(S.ch);
  else if (S.part === 'how') renderHow(false);
  else renderGame();
}

// ════════════════════════════════════════════════════════════
// touch: gestures for the steps and the race, or drag to look around
// ════════════════════════════════════════════════════════════
function wireTouch() {
  var orbit = null, pid = null;
  touch.addEventListener('pointerdown', function (e) {
    if (pid !== null) return;                 // one finger at a time
    ac();
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
    '<div class="sd-markl" id="sd-markl" aria-hidden="true"></div>' +
    '<div class="sd-guide" id="sd-guide" hidden aria-hidden="true"></div>' +
    '<div class="sd-gauge" id="sd-gauge" hidden aria-hidden="true"><svg viewBox="0 0 40 40"><circle class="trk" cx="20" cy="20" r="15"/><circle class="val" cx="20" cy="20" r="15" pathLength="100"/></svg></div>' +
    '<div class="sd-loupe" id="sd-loupe" hidden></div>' +
    '<div class="mq-hud sd-hud" id="sd-hud" hidden></div>' +
    '<div class="sd-prompt" id="sd-prompt" hidden aria-live="polite"></div>');
  markEl = $('#sd-markl'); guideEl = $('#sd-guide'); gaugeEl = $('#sd-gauge');
  loupeEl = $('#sd-loupe'); hudEl = $('#sd-hud'); promptEl = $('#sd-prompt');
  loupeEl.addEventListener('beforexrselect', function (e) { e.preventDefault(); });
}
function onFrame(dt) {
  var t = now();
  if (S.part === 'how' && !S.howDone && S.hs && !S.hs.ok) {
    var c = CTRL[HOW[S.how].key];
    if (c.frame) c.frame(S.hs, dt);
    if (!S.hs.ok && !S.hs.canSkip && t - S.hs.t0 > 30000) { S.hs.canSkip = true; howBar(); }
  }
  if (S.part === 'play') raceFrame(dt);
  frameGuide(t); frameMarks(); frameGauge();
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
  if (S.part === 'how' && !S.howDone && HOW[S.how].key === 'pick' && !loupeEl.hidden) renderLoupe(S.hs);
  if (S.part === 'how' && !S.howDone && GD.kind) { var c = CTRL[HOW[S.how].key]; if (c.guide && !S.hs.ok) c.guide(S.hs); }
  if (S.part === 'play' && S.game && S.game.phase === 'race' && S.game.race) { showHUD(); renderRaceHUD(); if (S.game.race.phase === 'run') renderPrompt(S.game.race); }
}
async function boot() {
  panel = $('#mq-panel'); bar = $('#qx-bar'); parts = $('#qx-parts'); toastEl = $('#qx-toast');
  touch = $('#mq-touch'); callout = $('#mq-callout'); arBtn = $('#mq-ar'); root = $('#mq-root');
  $('#qx-close').innerHTML = ICON.close;
  makeOverlays();
  renderSound();
  $('#qx-sound').addEventListener('click', function () {
    S.sound = !S.sound;
    try { localStorage.setItem('cl_sound', S.sound ? 'on' : 'off'); } catch (e) {}
    if (S.sound) sfx('tap');
    renderSound();
  });
  if (window.ThemeManager && !window.ThemeManager.current()) window.ThemeManager.applyRegionTheme('northern');
  document.title = L(T.title) + ' — CultureLens';
  $('#mq-loading span').textContent = L(T.loading);

  world = new World($('#mq-canvas'));
  try { await world.init(); }
  catch (e) { console.error(e); $('#mq-loading').innerHTML = '<span>' + L(T.noGL) + '</span>'; return; }
  document.body.classList.add('mq-ready');

  world.on('ar', onARState);
  world.on('frame', onFrame);
  world.on('reticle', function (ok) {
    var b = $('#sd-place'); if (b) b.disabled = !ok;
    var s = $('#sd-scan'); if (s) s.textContent = L(ok ? T.arGood : T.arWait);
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

  window.__sd = { world: world, S: S, setPart: setPart, goCh: goCh, HOW: HOW, CTRL: CTRL, stepDone: stepDone, raceInput: raceInput, startStep: startStep, howNext: howNext, RACE: RACE };
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
else boot();
