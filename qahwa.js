/**
 * qahwa.js — the Saudi Coffee experience
 *
 *   1. History        six illustrated chapters (some interactive)
 *   2. How it's made  eight hands-on steps, with the 3D dallah you can place in AR
 *   3. The game       serve four guests the Najdi way
 *
 * Content follows the team's heritage sheet (content.js → qahwa) plus sourced history:
 *   UNESCO 2015 "Arabic coffee, a symbol of generosity" (10.COM 10.B.32)
 *   Year of Saudi Coffee 2022 (Ministry of Culture)
 *   UNESCO 2022 Khawlani coffee (Nov 30, 2022)
 *
 * Open a part directly with qahwa.html#story, #brew or #game.
 * Needs: language.js, patterns.js, content.js, ThemeManager.js, qahwa-art.js.
 */
(function () {
  'use strict';

  // ════════════════════════════════════════════════════════════
  // HELPERS
  // ════════════════════════════════════════════════════════════
  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function isAr() { return window.currentLang === 'ar'; }
  function L(o) { if (o == null) return ''; if (typeof o === 'string') return o; return isAr() ? (o.ar != null ? o.ar : o.en) : o.en; }
  function num(n) { return isAr() ? String(n).replace(/\d/g, function (d) { return '٠١٢٣٤٥٦٧٨٩'[d]; }) : String(n); }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function pct(v) { return num(Math.round(v * 100)) + (isAr() ? '٪' : '%'); }

  var ICON = {
    close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>',
    back: '<svg class="qx-flip" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 6l-6 6 6 6"/></svg>',
    next: '<svg class="qx-flip" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6"/></svg>',
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
    x: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M9 9l6 6M15 9l-6 6"/></svg>',
    info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/></svg>',
    leaf: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 19c0-8 5-13 14-14-1 9-6 14-14 14z"/><path d="M5 19l7-7"/></svg>',
    cube: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M12 3l8 4.5v9L12 21l-8-4.5v-9z"/><path d="M12 12l8-4.5M12 12v9M12 12L4 7.5"/></svg>',
    star: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.8l2.8 5.9 6.4.8-4.7 4.4 1.2 6.3L12 17.1l-5.7 3.1 1.2-6.3L2.8 9.5l6.4-.8z"/></svg>',
    soundOn: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9h4l5-4v14l-5-4H4z"/><path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12"/></svg>',
    soundOff: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9h4l5-4v14l-5-4H4z"/><path d="M17 9.5l5 5M22 9.5l-5 5"/></svg>',
    replay: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12a8 8 0 1 0 2.4-5.7"/><path d="M4 4v4h4"/></svg>'
  };

  // ════════════════════════════════════════════════════════════
  // CONTENT — STORY
  // ════════════════════════════════════════════════════════════
  var T = {
    begin: { en: 'Begin the story', ar: 'ابدأ القصة' },
    next: { en: 'Next', ar: 'التالي' },
    toBrew: { en: 'Now, make it', ar: 'يالله نسويها' },
    chapter: { en: 'Chapter', ar: 'الفصل' },
    of: { en: 'of', ar: 'من' },
    step: { en: 'Step', ar: 'الخطوة' },
    nextStep: { en: 'Next step', ar: 'الخطوة الجاية' },
    finish: { en: 'Finish brewing', ar: 'خلصت القهوة' },
    viewAR: { en: 'View on your table', ar: 'شوفها على طاولتك' },
    loading3d: { en: 'Loading the 3D model', ar: 'جاري تحميل المجسم' },
    noAR: { en: 'AR works on your phone. Here you can spin the model with your finger.', ar: 'الواقع المعزز يشتغل على الجوال. هنا تقدر تلف المجسم بإصبعك.' },
    toGame: { en: 'Serve your guests', ar: 'صب لضيوفك' },
    title: { en: 'Saudi Coffee', ar: 'القهوة السعودية' }
  };

  var STORY = [
    {
      key: 'cover', art: 'hearth', cover: true,
      kicker: { en: 'Saudi Coffee', ar: 'القهوة السعودية' },
      title: { en: 'Before a word is spoken, the coffee speaks.', ar: 'قبل لا ينقال أي كلام، تتكلم القهوة.' },
      body: {
        en: 'The story of Saudi coffee in five short chapters: the sound that welcomes a guest, where coffee comes from, its tools, its customs, and how the world came to honor it.',
        ar: 'حكاية القهوة السعودية في خمسة فصول قصيرة: الصوت اللي يرحّب بالضيف، ومن وين جات القهوة، وعدّتها، وسلومها، وكيف صار العالم يعرفها.'
      }
    },
    {
      key: 'najr', art: 'najrScene',
      title: { en: 'The sound of the najr', ar: 'صوت النجر' },
      body: {
        en: 'For the people of Najd, coffee is the sign of generosity and the first thing offered to a guest. Its aroma fills the majlis before it is poured, and the ringing of the najr tells the neighbors that the house has a guest.',
        ar: 'القهوة عند أهل نجد عنوان الكرم وأول ما يُقدَّم للضيف. يفوح ريحها في المجلس قبل ما تنصب، وصوت النجر يعلن للجيران إن عند البيت ضيف.'
      },
      hint: { en: 'Tap the najr', ar: 'اطرق النجر' },
      after: { en: 'Now the neighbors know: this house has a guest.', ar: 'الحين الجيران عرفوا إن عندكم ضيف.' }
    },
    {
      key: 'origins', art: 'terraces',
      chip: { en: 'Jazan · the Khawlan mountains', ar: 'جازان · جبال خولان' },
      title: { en: 'Where coffee comes from', ar: 'من وين جات القهوة' },
      body: {
        en: 'Most historians trace coffee from Ethiopia to Yemen, and from there to Makkah around the year 1500, from where it spread across Arabia. Saudi Arabia grows its own, too. On the terraced mountains of Jazan, 1,000 to 1,800 meters up, the farmers of Khawlan have grown the Khawlani coffee bean for more than 300 years.',
        ar: 'يرجّح أغلب المؤرخين إن القهوة انتقلت من الحبشة إلى اليمن، ومنها وصلت مكة المكرمة حوالي سنة ١٥٠٠م، وانتشرت في الجزيرة العربية. والسعودية تزرع قهوتها بعد: في جبال جازان، على مدرّجات ترتفع من ألف إلى ألف وثمانمية متر، يزرع أهل خولان البن الخولاني من أكثر من ٣٠٠ سنة.'
      }
    },
    {
      key: 'tools', art: 'tools',
      title: { en: 'The tools of the coffee', ar: 'عدّة القهوة' },
      body: {
        en: 'In a Najdi majlis, the same set of tools waits by the fire. Tap each one to learn its name.',
        ar: 'في المجلس النجدي، نفس العدّة دايم جنب النار. اضغط على كل وحدة وتعرّف عليها.'
      },
      hint: { en: 'Tap a tool', ar: 'اضغط على أداة' },
      tools: [
        { key: 'mihmas', name: { en: 'Al-Mihmas', ar: 'المحماس' }, text: { en: 'A shallow iron pan with a long handle. The green beans are roasted in it over the fire.', ar: 'مقلاة حديد بيد طويلة، يتحمّس فيها البن الأخضر على النار.' } },
        { key: 'mubarrid', name: { en: 'Al-Mubarrid', ar: 'المبرد' }, text: { en: 'A wooden tray where the roasted beans are spread out to cool.', ar: 'صحن خشب ينفرش فيه البن بعد التحميص عشان يبرد.' } },
        { key: 'najr', name: { en: 'Al-Najr', ar: 'النجر' }, text: { en: 'A brass mortar and pestle for pounding the beans. Its ringing tells the neighbors there is a guest.', ar: 'هاون نحاس مع يده، يندق فيه البن، ورنّته تعلم الجيران إن فيه ضيف.' } },
        { key: 'dallah', name: { en: 'Al-Dallah', ar: 'الدلة' }, text: { en: 'The coffee pot. A plug of palm fiber in its spout, the leef, keeps the grounds out of the cup.', ar: 'إبريق القهوة. وفي خشمها «الليف» اللي يمنع البن ينزل بالفنجال.' } },
        { key: 'finjan', name: { en: 'Al-Finjal', ar: 'الفناجيل' }, text: { en: 'Small cups without handles, poured a little at a time.', ar: 'فناجيل صغيرة بلا يد، ينصب فيها شوي شوي.' } }
      ]
    },
    {
      key: 'etiquette', art: 'fourCups',
      title: { en: 'The customs of the cup', ar: 'سلوم الفنجال' },
      body: {
        en: 'The server holds the dallah in his left hand and the cups in his right. He pours the first cup for the host, then serves the elders and the guests. The cup is filled only about a quarter, and refilled. When a guest has had enough, he shakes the cup as he hands it back.',
        ar: 'يمسك المُقهوي الدلة باليد اليسرى والفناجيل باليمنى، ويصب أول فنجال للمضيف، ثم يقدّم القهوة لكبار السن والضيوف. والفنجال ما ينملى، ربعه بس، وينعاد له. وإذا اكتفى الضيف هزّ الفنجال وهو يرجّعه.'
      },
      saying: {
        ar: 'الأول للهيف، والثاني للضيف، والثالث للكيف، والرابع للسيف',
        en: 'The first for the haif, the second for the guest, the third for pleasure, the fourth for the sword.'
      },
      hint: { en: 'Tap each cup', ar: 'اضغط على كل فنجال' },
      cups: [
        { name: { en: 'Al-Haif', ar: 'الهيف' }, text: { en: 'The host drinks the first cup himself, so his guest knows the coffee is good.', ar: 'يشربه المضيف بنفسه، عشان يطمّن ضيفه إن القهوة زينة.' } },
        { name: { en: 'Al-Dayf', ar: 'الضيف' }, text: { en: "The guest's cup, the duty of hospitality. A guest is expected to drink it.", ar: 'فنجال الضيف، واجب الضيافة، والضيف يشربه.' } },
        { name: { en: 'Al-Kayf', ar: 'الكيف' }, text: { en: 'A cup for pleasure and good mood. The guest may take it or leave it.', ar: 'فنجال الكيف والوناسة، والضيف مخيّر فيه.' } },
        { name: { en: 'Al-Sayf', ar: 'السيف' }, text: { en: 'The cup of the sword. In old custom, drinking it meant standing with the host in hard times.', ar: 'فنجال السيف، وكان في السلوم القديمة يعني إن الضيف يوقف مع المضيف في الشدايد.' } }
      ]
    },
    {
      key: 'heritage', art: 'pour',
      title: { en: 'A heritage the world recognizes', ar: 'تراث يعرفه العالم' },
      timeline: [
        { year: { en: '2015', ar: '٢٠١٥' }, text: { en: 'UNESCO inscribed "Arabic coffee, a symbol of generosity" on its list of the intangible cultural heritage of humanity, nominated by Saudi Arabia with the UAE, Oman, and Qatar.', ar: 'سجّلت اليونسكو «القهوة العربية، رمز الكرم» في قائمة التراث الثقافي غير المادي للبشرية، بترشيح من السعودية مع الإمارات وعُمان وقطر.' } },
        { year: { en: '2022', ar: '٢٠٢٢' }, text: { en: 'The Ministry of Culture named 2022 the Year of Saudi Coffee, and the name "Saudi coffee" was adopted in cafés and restaurants across the Kingdom.', ar: 'أعلنت وزارة الثقافة ٢٠٢٢ «عام القهوة السعودية»، واعتُمد اسم «القهوة السعودية» في المقاهي والمطاعم بالمملكة.' } },
        { year: { en: '2022', ar: '٢٠٢٢' }, text: { en: 'UNESCO inscribed the knowledge and practices of growing Khawlani coffee beans in Jazan.', ar: 'سجّلت اليونسكو المعارف والممارسات المرتبطة بزراعة البن الخولاني في جازان.' } },
        { year: { en: 'Today', ar: 'اليوم' }, text: { en: 'Coffee is still the first step in receiving official guests.', ar: 'وما زالت القهوة أول خطوة في مراسم استقبال الضيوف الرسميين.' } }
      ],
      sources: { en: 'Sources: UNESCO Intangible Cultural Heritage lists; Saudi Ministry of Culture; the CultureLens heritage sheet.', ar: 'المصادر: قوائم اليونسكو للتراث غير المادي؛ وزارة الثقافة؛ ملف تراث المناطق لفريق عدسة ثقافية.' }
    }
  ];

  // ════════════════════════════════════════════════════════════
  // CONTENT — BREWING STEPS
  // ════════════════════════════════════════════════════════════
  var STEPS = [
    {
      key: 'roast', stage: 'scene', scene: 'roast', action: 'roast',
      title: { en: 'Roast the beans', ar: 'حمّس البن' },
      text: { en: 'Roast the green beans in the mihmas over the fire, stirring, until they turn golden. Hold the button to roast, and let go when the color is right.', ar: 'حمّس البن الأخضر بالمحماس على النار وحرّكه لين يصير لونه ذهبي. اضغط مطوّل على الزر، وفكّه لما يصير اللون مضبوط.' },
      note: { en: 'In Najd the roast is light and golden, never dark. A roasted batch is called a hamsa.', ar: 'في نجد التحميصة خفيفة ذهبية، مو غامقة. والكمية المحمّسة تسمى «حمسة».' },
      cta: { en: 'Hold to roast', ar: 'اضغط مطوّل للتحميص' }
    },
    {
      key: 'najr', stage: 'scene', scene: 'najrScene', action: 'taps', taps: 8,
      title: { en: 'Pound it in the najr', ar: 'دقّه بالنجر' },
      text: { en: 'Let the beans cool on the mubarrid, then pound them in the najr until they are coarsely ground. Tap the najr, or the button, eight times.', ar: 'خلّ البن يبرد بالمبرد، وبعدين دقّه بالنجر لين ينطحن خشن. اطرق النجر، أو الزر، ثمان مرات.' },
      note: { en: 'The najr is struck in a rhythm, and its ringing tells the neighbors there is a guest.', ar: 'النجر ينطرق على إيقاع، ورنّته تعلم الجيران إن عندكم ضيف.' },
      cta: { en: 'Pound', ar: 'دق' }
    },
    {
      key: 'boil', stage: 'model', model: 'saudi_dallah.glb', size: 0.25, hot: true, action: 'timed', secs: 2.6, fx: 'after',
      title: { en: 'Boil the water', ar: 'غلّ الماي' },
      text: { en: 'Pour water into the dallah and set it on the fire until it boils. Put the dallah on your table in AR and walk around it.', ar: 'حط الماي بالدلة وخلها على النار لين يغلي. حط الدلة على طاولتك بالواقع المعزز ولف حولها.' },
      note: { en: 'The dallah is never washed with soap, only rinsed with hot water.', ar: 'الدلة ما تنغسل بالصابون أبد، بس تنشطف بماي حار.' },
      cta: { en: 'Light the fire', ar: 'شبّ النار' },
      wait: { en: 'Bringing it to a boil', ar: 'لين يغلي الماي' }
    },
    {
      key: 'coffee', stage: 'model', model: 'coffee_beans.glb', size: 0.06, action: 'taps', taps: 3, spoons: true,
      title: { en: 'Add the coffee', ar: 'حط البن' },
      text: { en: 'Add the ground coffee to the boiling water, about two to three tablespoons for three cups.', ar: 'حط البن المدقوق على الماي اللي يغلي، حوالي ملعقتين لثلاث ملاعق لكل ثلاث فناجيل.' },
      note: { en: 'Watch it as it rises, and lower the fire so it does not boil over.', ar: 'انتبه لها لما تفور، وخفف النار عشان ما تطفح.' },
      cta: { en: 'Add a spoon', ar: 'زيد ملعقة' }
    },
    {
      key: 'brew', stage: 'model', model: 'saudi_dallah.glb', size: 0.25, action: 'timed', secs: 6, fx: 'always',
      title: { en: 'Let it brew', ar: 'خلها تفوح' },
      text: { en: 'Lower the fire and let it brew gently for ten to fifteen minutes.', ar: 'خفف النار وخلها تفوح على هون، من عشر لين ربع ساعة.' },
      note: { en: 'Patience is part of hospitality.', ar: 'الصبر من الكرم.' },
      cta: { en: 'Lower the fire', ar: 'خفّف النار' },
      wait: { en: 'A few quiet minutes by the fire', ar: 'دقايق هادية جنب النار' }
    },
    {
      key: 'spices', stage: 'scene', scene: 'spices', action: 'spices',
      title: { en: 'Add the spices', ar: 'زيد الهيل' },
      text: { en: 'Take the dallah off the fire and add crushed cardamom. In Najd, cloves and saffron are added too. Pick what goes in.', ar: 'شيل الدلة عن النار وزيد الهيل المدقوق، وفي نجد يزيدون القرنفل والزعفران. اختار وش يدخل فيها.' },
      note: { en: 'Cardamom goes into every Saudi coffee. Each region adds its own touch: saffron in the east, mastic in the west.', ar: 'الهيل أساس القهوة السعودية، وكل منطقة لها لمستها: الزعفران في الشرقية، والمستكة في الغربية.' },
      cta: { en: 'Add to the dallah', ar: 'زيّدها بالدلة' }
    },
    {
      key: 'settle', stage: 'model', model: 'saudi_dallah.glb', size: 0.25, hot: true, action: 'timed', secs: 3.5,
      title: { en: 'Let it settle', ar: 'خلها ترقد' },
      text: { en: 'Let it rest for a few minutes so the grounds sink to the bottom.', ar: 'خلها ترتاح شوي عشان البن يرقد تحت.' },
      note: { en: 'The leef in the spout catches what is left, so only clear coffee reaches the cup.', ar: 'الليف اللي بخشم الدلة يمسك الباقي، فما يوصل الفنجال إلا القهوة الصافية.' },
      cta: { en: 'Take it off the fire', ar: 'شيلها عن النار' },
      wait: { en: 'Letting the grounds settle', ar: 'البن يرقد' }
    },
    {
      key: 'pour', stage: 'scene', scene: 'pour', action: 'pour',
      title: { en: 'Pour the first cup', ar: 'صب أول فنجال' },
      text: { en: 'Hold the dallah in your left hand and pour a little into the finjan, about a quarter. Hold the button to pour, and stop at the line.', ar: 'امسك الدلة باليسار وصب شوي بالفنجال، حوالي الربع. اضغط مطوّل للصب، ووقّف عند الخط.' },
      note: { en: 'Serve it with dates. Their sweetness balances the coffee.', ar: 'قدّمها مع التمر، حلاته توازن القهوة.' },
      cta: { en: 'Hold to pour', ar: 'اضغط مطوّل وصب' }
    }
  ];

  var SPICES = {
    cardamom: { ok: true, need: true, name: { en: 'Cardamom', ar: 'الهيل' } },
    cloves: { ok: true, name: { en: 'Cloves', ar: 'القرنفل' } },
    saffron: { ok: true, name: { en: 'Saffron', ar: 'الزعفران' } },
    sugar: { ok: false, name: { en: 'Sugar', ar: 'السكر' }, why: { en: 'No sugar. Saudi coffee is never sweetened; the dates bring the sweetness.', ar: 'لا سكر. القهوة السعودية ما تنحلّى، والتمر هو اللي يحلّيها.' } },
    milk: { ok: false, name: { en: 'Milk', ar: 'الحليب' }, why: { en: 'No milk. Saudi coffee is served clear and golden.', ar: 'لا حليب. القهوة السعودية تنقدّم صافية ذهبية.' } }
  };

  // ════════════════════════════════════════════════════════════
  // CONTENT — GAME
  // ════════════════════════════════════════════════════════════
  var GUESTS = {
    host: { key: 'host', skin: '#9C6B48', ghutrah: 'red', beard: 'black', bisht: true, name: { en: 'Abu Fahad', ar: 'أبو فهد' }, role: { en: 'The host', ar: 'صاحب البيت' } },
    elder: { key: 'elder', skin: '#B07A52', ghutrah: 'white', beard: 'grey', name: { en: 'Abu Saad', ar: 'أبو سعد' }, role: { en: '82 years old', ar: 'عمره ٨٢ سنة' } },
    guest: { key: 'guest', skin: '#A8714A', ghutrah: 'red', beard: 'short', name: { en: 'Mohammed', ar: 'محمد' }, role: { en: 'Guest from Al-Ahsa', ar: 'ضيف من الأحساء' } },
    youth: { key: 'youth', skin: '#C48D63', ghutrah: 'white', beard: 'none', name: { en: 'Omar', ar: 'عمر' }, role: { en: '19 years old', ar: 'عمره ١٩ سنة' } }
  };
  var SEATS = ['guest', 'youth', 'host', 'elder'];      // left to right in the majlis
  var ORDER = ['host', 'elder', 'guest', 'youth'];      // the right serving order
  var READS = [{ key: 'elder', shake: true }, { key: 'guest', shake: false }, { key: 'youth', shake: true }];
  var MAX_SCORE = ORDER.length * 2 + 1 + READS.length;  // order + pour per guest, hand, reading

  var G_TEXT = {
    introTitle: { en: 'Serve with honor', ar: 'صب لضيوفك بأصول' },
    introSub: { en: 'Four men are seated in your majlis. Serve them the Najdi way: the right order, the right hand, the right amount. Then watch their cups.', ar: 'أربعة رجال جالسين بمجلسك. صب لهم على السلوم النجدية: بالترتيب الصح، وباليد الصح، وبالمقدار الصح. وبعدين انتبه لفناجيلهم.' },
    start: { en: 'Start serving', ar: 'ابدأ الصب' },
    round1: { en: 'Round 1 · The order', ar: 'الجولة ١ · الترتيب' },
    round2: { en: 'Round 2 · Read the cup', ar: 'الجولة ٢ · اقرأ الفنجال' },
    pickFirst: { en: 'Who gets the first cup?', ar: 'لمن أول فنجال؟' },
    pickNext: { en: 'Who is next?', ar: 'مين بعده؟' },
    pickSub: { en: 'Tap a man in the majlis.', ar: 'اضغط على واحد من اللي بالمجلس.' },
    handQ: { en: 'Which hand holds the finjan?', ar: 'بأي يد تمسك الفنجال؟' },
    handSub: { en: 'The other hand holds the dallah.', ar: 'واليد الثانية فيها الدلة.' },
    left: { en: 'Left hand', ar: 'اليسار' },
    right: { en: 'Right hand', ar: 'اليمين' },
    pourQ: { en: 'Pour for ', ar: 'صب ل' },   // joins the name: لأبو فهد، لمحمد، لعمر
    pourSub: { en: 'Hold to pour. Let go at about a quarter.', ar: 'اضغط مطوّل وصب، وفكّ عند الربع تقريباً.' },
    holdPour: { en: 'Hold to pour', ar: 'اضغط مطوّل وصب' },
    readQ: { en: ' hands you his cup.', ar: ' يمد لك فنجاله.' },
    shakes: { en: 'He gives it a little shake.', ar: 'وهو يهزه هزة خفيفة.' },
    still: { en: 'He holds it out, still.', ar: 'ويمده بدون ما يهزه.' },
    pourMore: { en: 'Pour more', ar: 'صب له' },
    take: { en: 'Take the cup', ar: 'خذ الفنجال' },
    cont: { en: 'Continue', ar: 'كمّل' },
    score: { en: 'Score', ar: 'النقاط' },
    again: { en: 'Play again', ar: 'العب مرة ثانية' },
    done: { en: 'Finish', ar: 'إنهاء' },
    best: { en: 'Your best: ', ar: 'أفضل نتيجة لك: ' },
    learned: { en: 'What you learned', ar: 'وش تعلمت' }
  };
  var PICK_GOOD = [
    { en: 'Right. The first cup, the haif, goes to the host. He tastes it so his guests know the coffee is good.', ar: 'صح. أول فنجال، الهيف، للمضيف. يذوقه عشان يطمّن ضيوفه إن القهوة زينة.' },
    { en: 'Right. After the host, start with the eldest.', ar: 'صح. بعد المضيف، تبدأ بالكبير.' },
    { en: 'Right. Then the guest who came from afar.', ar: 'صح. وبعده الضيف اللي جاي من بعيد.' },
    { en: 'Right. The youngest is served last.', ar: 'صح. والأصغر آخر واحد.' }
  ];
  var PICK_BAD = [
    { en: 'Not yet. The first cup is the haif, and it goes to the host, Abu Fahad. He tastes it before anyone else.', ar: 'مو هو. أول فنجال هو الهيف، وهو للمضيف أبو فهد. يذوقه قبل الكل.' },
    { en: 'Not yet. After the host comes the eldest: Abu Saad, 82.', ar: 'مو هو. بعد المضيف يجي دور الكبير: أبو سعد، ٨٢ سنة.' },
    { en: 'Not yet. Next is the guest who came from Al-Ahsa, Mohammed.', ar: 'مو هو. بعده الضيف اللي جاي من الأحساء، محمد.' },
    { en: 'Omar, the youngest, is served last.', ar: 'عمر، الأصغر، آخر واحد.' }
  ];
  var HAND_GOOD = { en: 'Right. The finjan in the right hand, the dallah in the left.', ar: 'صح. الفنجال باليمين، والدلة باليسار.' };
  var HAND_BAD = { en: 'The finjan is always offered with the right hand. The dallah stays in the left.', ar: 'الفنجال دايم ينعطى باليمين، والدلة تبقى باليسار.' };
  var POUR_GOOD = { en: 'A quarter cup. Just right.', ar: 'ربع فنجال، مضبوط.' };
  var POUR_LOW = { en: 'A little too little. Aim for about a quarter.', ar: 'قليل شوي. خلّه حوالي الربع.' };
  var POUR_HIGH = { en: 'Too full. A full cup rushes the guest. A little at a time keeps him company.', ar: 'مليان زيادة. الفنجال المترّس كأنك تستعجل ضيفك، والقليل يونّسه.' };
  var READ_GOOD = {
    take: { en: 'Right. A shaken cup means "enough, thank you."', ar: 'صح. هزّة الفنجال تعني «بس، الله يجزاك خير».' },
    pour: { en: 'Right. He held it out without shaking it, so he would like more. This one is the kayf, the cup for pleasure.', ar: 'صح. مدّه بدون ما يهزه، يعني يبي زيادة. وهذا فنجال الكيف.' }
  };
  var READ_BAD = {
    take: { en: 'He didn\'t shake his cup, so he would like another.', ar: 'ما هز فنجاله، يعني يبي زيادة.' },
    pour: { en: 'He shook his cup. That means he has had enough.', ar: 'هز فنجاله، يعني اكتفى.' }
  };
  var THANKS = {
    host: { en: 'It\'s good. Serve the guests.', ar: 'زينة، صبّ للضيوف.' },
    other: { en: 'Bless your hand.', ar: 'تسلم يمينك.' }
  };
  var LEARN = [
    { key: 'order1', text: { en: 'The first cup, the haif, is for the host.', ar: 'أول فنجال، الهيف، للمضيف.' } },
    { key: 'order', text: { en: 'Then the eldest, then the guests, and the youngest last.', ar: 'بعده الكبير، ثم الضيوف، والأصغر آخر واحد.' } },
    { key: 'hand', text: { en: 'The finjan in the right hand, the dallah in the left.', ar: 'الفنجال باليمين، والدلة باليسار.' } },
    { key: 'pour', text: { en: 'Pour about a quarter, and refill often.', ar: 'صب حوالي الربع، وعاود الصب.' } },
    { key: 'read', text: { en: 'A shaken cup means "enough."', ar: 'هزّة الفنجال تعني «بس».' } }
  ];
  var RESULT_TITLES = [
    { min: MAX_SCORE, t: { en: 'A true host of the majlis', ar: 'راعي مجلس وأصول' } },
    { min: Math.ceil(MAX_SCORE * 0.7), t: { en: 'A generous host', ar: 'مضيف كريم' } },
    { min: 0, t: { en: 'Keep practicing', ar: 'تحتاج شوي تمرين' } }
  ];

  // ════════════════════════════════════════════════════════════
  // STATE
  // ════════════════════════════════════════════════════════════
  var S = {
    part: 'story', ch: 0, step: 0, done: false, brewFinished: false,
    seenTools: {}, tool: null, seenCups: {}, cup: null, najrTaps: 0,
    act: {}, game: null, sound: true
  };
  try { S.sound = localStorage.getItem('cl_sound') !== 'off'; } catch (e) {}

  var main, bar, parts, toastEl;

  // ════════════════════════════════════════════════════════════
  // SOUND (Web Audio, made in code — no files)
  // ════════════════════════════════════════════════════════════
  var AC = null, pourNode = null;
  function ac() {
    if (!AC) { var C = window.AudioContext || window.webkitAudioContext; if (!C) return null; AC = new C(); }
    if (AC.state === 'suspended') AC.resume();
    return AC;
  }
  function tone(f, dur, type, vol, delay, f2) {
    var c = ac(); if (!c) return;
    var t = c.currentTime + (delay || 0);
    var o = c.createOscillator(), g = c.createGain();
    o.type = type || 'sine';
    o.frequency.setValueAtTime(f, t);
    if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol || 0.1, t + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(c.destination);
    o.start(t); o.stop(t + dur + 0.05);
  }
  function noiseBuf(c, secs) {
    var b = c.createBuffer(1, Math.floor(c.sampleRate * secs), c.sampleRate), d = b.getChannelData(0);
    for (var i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    return b;
  }
  function noise(dur, vol, freq, q, delay) {
    var c = ac(); if (!c) return;
    var t = c.currentTime + (delay || 0);
    var s = c.createBufferSource(); s.buffer = noiseBuf(c, dur + 0.05);
    var f = c.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = freq || 1200; f.Q.value = q || 1;
    var g = c.createGain();
    g.gain.setValueAtTime(vol || 0.05, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f); f.connect(g); g.connect(c.destination);
    s.start(t); s.stop(t + dur + 0.05);
  }
  var SFX = {
    // the najr: a bright brass ring over a low knock
    ting: function () { tone(1318, 0.9, 'sine', 0.06); tone(2637, 0.6, 'sine', 0.03); tone(3950, 0.35, 'sine', 0.015); tone(120, 0.12, 'sine', 0.12, 0, 60); noise(0.04, 0.05, 3000, 2); },
    tap: function () { tone(880, 0.06, 'triangle', 0.04); },
    ok: function () { tone(659, 0.22, 'sine', 0.07); tone(988, 0.32, 'sine', 0.06, 0.1); },
    bad: function () { tone(196, 0.28, 'triangle', 0.07, 0, 150); },
    sizzle: function () { noise(0.18, 0.025, 4200, 0.8); },
    bubble: function () { tone(300 + Math.random() * 300, 0.08, 'sine', 0.03, 0, 700 + Math.random() * 300); },
    spoon: function () { tone(1600, 0.15, 'sine', 0.03); noise(0.1, 0.03, 2500, 1.5); },
    star: function () { tone(784, 0.2, 'sine', 0.06); tone(1175, 0.4, 'sine', 0.05, 0.12); tone(1568, 0.5, 'sine', 0.04, 0.24); }
  };
  function sfx(n) { if (!S.sound) return; try { SFX[n](); } catch (e) {} }
  function pourSound(on) {
    if (!S.sound && on) return;
    var c = ac(); if (!c) return;
    if (on && !pourNode) {
      var s = c.createBufferSource(); s.buffer = noiseBuf(c, 2); s.loop = true;
      var f = c.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 900; f.Q.value = 0.9;
      var g = c.createGain(); g.gain.value = 0.0001; g.gain.exponentialRampToValueAtTime(0.05, c.currentTime + 0.1);
      s.connect(f); f.connect(g); g.connect(c.destination); s.start();
      pourNode = { s: s, g: g };
    } else if (!on && pourNode) {
      var p = pourNode; pourNode = null;
      try { p.g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + 0.12); p.s.stop(c.currentTime + 0.15); } catch (e) {}
    }
  }
  function buzz(ms) { try { if (navigator.vibrate) navigator.vibrate(ms); } catch (e) {} }

  // ════════════════════════════════════════════════════════════
  // UI PIECES
  // ════════════════════════════════════════════════════════════
  var toastTimer = 0;
  function toast(o) {
    toastEl.textContent = L(o);
    toastEl.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove('show'); }, 2800);
  }

  // Bottom bar. cfg = { back, buttons: [{ label, icon, kind, onClick, hold, disabled, id }] }
  function setBar(cfg) {
    var html = '';
    if (cfg.back) html += '<button class="qx-btn qx-btn-line qx-btn-round" data-i="back" aria-label="' + L({ en: 'Back', ar: 'رجوع' }) + '">' + ICON.back + '</button>';
    (cfg.buttons || []).forEach(function (b, i) {
      html += '<button class="qx-btn ' + (b.kind === 'line' ? 'qx-btn-line' : 'qx-btn-solid') + (b.hold ? ' qx-btn-hold' : '') + '" data-i="' + i + '"' +
        (b.id ? ' id="' + b.id + '"' : '') + (b.disabled ? ' disabled' : '') + '>' +
        '<span>' + L(b.label) + '</span>' + (b.icon ? ICON[b.icon] : '') + '</button>';
    });
    bar.innerHTML = html;
    bar.classList.toggle('is-physical', !!cfg.physical);   // left/right answers sit on their own side in both languages
    if (cfg.back) $('[data-i="back"]', bar).addEventListener('click', cfg.back);
    (cfg.buttons || []).forEach(function (b, i) {
      var el = $('[data-i="' + i + '"]', bar);
      if (b.hold) wireHold(el, b.hold);
      else if (b.onClick) el.addEventListener('click', function () { if (!el.disabled) b.onClick(); });
    });
  }

  // Press-and-hold: onStart, onTick(dt), onEnd
  function wireHold(btn, h) {
    var down = false, raf = 0, last = 0;
    function frame(t) {
      if (!down) return;
      var dt = Math.min(0.05, (t - last) / 1000); last = t;
      if (h.onTick(dt) === false) { stop(); return; }
      raf = requestAnimationFrame(frame);
    }
    function start(e) {
      if (btn.disabled || down) return;
      if (e) { e.preventDefault(); try { btn.setPointerCapture(e.pointerId); } catch (x) {} }
      down = true; last = performance.now();
      btn.classList.add('is-holding');
      if (h.onStart) h.onStart();
      raf = requestAnimationFrame(frame);
    }
    function stop() {
      if (!down) return;
      down = false; cancelAnimationFrame(raf);
      btn.classList.remove('is-holding');
      if (h.onEnd) h.onEnd();
    }
    btn.addEventListener('pointerdown', start);
    ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(function (ev) { btn.addEventListener(ev, stop); });
    btn.addEventListener('contextmenu', function (e) { e.preventDefault(); });
    btn.addEventListener('keydown', function (e) { if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) { e.preventDefault(); start(); } });
    btn.addEventListener('keyup', function (e) { if (e.key === ' ' || e.key === 'Enter') stop(); });
  }

  function statusHTML(kind, text) {
    if (!text) return '';
    var ic = kind === 'good' ? ICON.check : kind === 'bad' ? ICON.x : ICON.info;
    return ic + '<span>' + L(text) + '</span>';
  }
  function setStatus(kind, text) {
    var el = $('#qx-status');
    if (!el) return;
    el.className = 'qx-status ' + (kind || '');
    el.innerHTML = statusHTML(kind, text);
  }

  // ════════════════════════════════════════════════════════════
  // PARTS (tabs)
  // ════════════════════════════════════════════════════════════
  function renderParts() {
    var prog = {
      story: S.ch / (STORY.length - 1),
      brew: S.brewFinished ? 1 : S.step / STEPS.length,
      game: S.game ? (S.game.phase === 'end' ? 1 : (S.game.turn + (S.game.readIdx || 0)) / (ORDER.length + READS.length)) : 0
    };
    $$('.qx-part', parts).forEach(function (b) {
      var p = b.getAttribute('data-part');
      b.classList.toggle('is-active', p === S.part);
      b.classList.toggle('is-done', prog[p] >= 1 && p !== S.part);
      $('.bar b', b).style.width = Math.round(clamp(prog[p], 0, 1) * 100) + '%';
    });
  }

  function setPart(p) {
    if (S.part === 'brew' && p !== 'brew') stopAction();
    S.part = p;
    try { history.replaceState(null, '', '#' + p); } catch (e) {}
    main.removeAttribute('data-view');
    if (p === 'story') renderStory();
    else if (p === 'brew') renderBrew();
    else renderGame();
    renderParts();
    window.scrollTo(0, 0);
  }

  // ════════════════════════════════════════════════════════════
  // 1. STORY
  // ════════════════════════════════════════════════════════════
  function goCh(i) { S.ch = clamp(i, 0, STORY.length - 1); renderStory(); renderParts(); window.scrollTo(0, 0); }

  function renderStory() {
    var c = STORY[S.ch];
    main.setAttribute('data-view', 'story');
    var n = S.ch;
    var html = '<article class="qx-chapter' + (c.cover ? ' qx-cover' : '') + '">' +
      '<div class="qx-art">' + QArt[c.art]({ rtl: isAr(), num: num }) + (c.chip ? '<span class="qx-art-chip">' + L(c.chip) + '</span>' : '') +
        (c.cups ? '<div class="qx-cup-labels">' + c.cups.map(function (cu, i) { return '<span data-l="' + i + '"' + (S.cup === i ? ' class="is-on"' : '') + '>' + L(cu.name) + '</span>'; }).join('') + '</div>' : '') +
      '</div>' +
      '<div class="qx-text qx-enter">' +
        (c.cover ? '<div class="qx-kicker">' + L(c.kicker) + '</div>'
                 : '<div class="qx-chapter-num">' + L(T.chapter) + ' ' + num(n) + ' ' + L(T.of) + ' ' + num(STORY.length - 1) + '</div>') +
        '<h1 class="qx-h1">' + L(c.title) + '</h1>' +
        (c.body ? '<p class="qx-p">' + L(c.body) + '</p>' : '') +
        (c.hint ? '<div class="qx-hint"><i></i><span>' + L(c.hint) + '</span></div>' : '') +
        (c.after ? '<p class="qx-after" id="qx-after"' + (S.najrTaps >= 3 ? '' : ' hidden') + '>' + L(c.after) + '</p>' : '') +
      '</div>';
    if (c.tools) html += '<div class="qx-card qx-info qx-enter-2" id="qx-info"></div>';
    if (c.cups) {
      html += '<div class="qx-card qx-info qx-enter-2" id="qx-info"></div>';
      html += '<div class="qx-saying qx-enter-3"><div class="qx-saying-ar">' + c.saying.ar + '</div>' + (isAr() ? '' : '<div class="qx-saying-en">' + c.saying.en + '</div>') + '</div>';
    }
    if (c.timeline) {
      html += '<div class="qx-timeline qx-enter-2">' + c.timeline.map(function (t) {
        return '<div class="qx-tl"><div class="qx-tl-year">' + L(t.year) + '</div><div class="qx-tl-text">' + L(t.text) + '</div></div>';
      }).join('') + '</div><p class="qx-sources">' + L(c.sources) + '</p>';
    }
    html += '</article>';
    main.innerHTML = html;
    wireChapter(c);

    var last = S.ch === STORY.length - 1;
    setBar({
      back: S.ch > 0 ? function () { goCh(S.ch - 1); } : null,
      buttons: [{ label: S.ch === 0 ? T.begin : (last ? T.toBrew : T.next), icon: 'next', onClick: function () { if (last) setPart('brew'); else goCh(S.ch + 1); } }]
    });
  }

  function wireChapter(c) {
    if (c.key === 'najr') {
      var hit = $('.qa-najr-hit', main), rings = $('.qa-rings', main), pestle = $('#qx-pestle', main);
      var houses = $$('.qa-house', main);
      houses.forEach(function (h, i) { if (S.najrTaps > i) h.classList.add('lit'); });
      var strike = function () {
        S.najrTaps += 1;
        sfx('ting'); buzz(12);
        pestle.classList.add('hit');
        setTimeout(function () { pestle.classList.remove('hit'); }, 110);
        rings.classList.remove('go'); void rings.getBoundingClientRect(); rings.classList.add('go');
        houses.forEach(function (h, i) { if (S.najrTaps > i) h.classList.add('lit'); });
        if (S.najrTaps >= 3) { var a = $('#qx-after'); if (a && a.hidden) { a.hidden = false; a.classList.add('qx-enter'); } }
      };
      hit.addEventListener('click', strike);
      hit.setAttribute('tabindex', '0'); hit.setAttribute('role', 'button');
      hit.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); strike(); } });
    }
    if (c.tools) {
      var showTool = function (key) {
        S.tool = key; S.seenTools[key] = true;
        $$('.qa-tool', main).forEach(function (t) {
          var k = t.getAttribute('data-tool');
          t.classList.toggle('is-on', k === key);
          t.classList.toggle('is-seen', !!S.seenTools[k]);
        });
        renderToolInfo(c);
      };
      $$('.qa-tool', main).forEach(function (t) {
        var k = t.getAttribute('data-tool');
        t.addEventListener('click', function () { sfx('tap'); showTool(k); });
        t.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); showTool(k); } });
      });
      if (S.tool) showTool(S.tool); else renderToolInfo(c);
    }
    if (c.cups) {
      var showCup = function (i) {
        S.cup = i; S.seenCups[i] = true;
        $$('.qa-cup', main).forEach(function (el) { el.classList.toggle('is-on', +el.getAttribute('data-cup') === i); });
        $$('.qx-cup-labels span', main).forEach(function (el) { el.classList.toggle('is-on', +el.getAttribute('data-l') === i); });
        renderCupInfo(c);
      };
      $$('.qa-cup', main).forEach(function (el) {
        var i = +el.getAttribute('data-cup');
        el.addEventListener('click', function () { sfx('tap'); showCup(i); });
        el.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); showCup(i); } });
      });
      if (S.cup != null) showCup(S.cup); else renderCupInfo(c);
    }
    if (c.art === 'pour') {
      // the last chapter shows a served cup
      var fill = $('#qx-pour-fill', main), surf = $('#qx-pour-surface', main), line = $('#qx-pour-line', main), stream = $('.qa-stream', main);
      if (fill) { var y = 61 - 0.25 * 40; fill.setAttribute('y', y); surf.setAttribute('cy', y); }
      if (line) line.style.display = 'none';
      if (stream) stream.style.display = 'none';
    }
  }

  function renderToolInfo(c) {
    var box = $('#qx-info'); if (!box) return;
    var seen = Object.keys(S.seenTools).length;
    var t = c.tools.filter(function (x) { return x.key === S.tool; })[0];
    box.innerHTML = (t
      ? '<div class="qx-kicker">' + L({ en: 'Tool', ar: 'الأداة' }) + '</div><div class="qx-info-name">' + L(t.name) + '</div><div class="qx-info-text">' + L(t.text) + '</div>'
      : '<div class="qx-info-text">' + L({ en: 'Five tools sit by the fire. Tap one on the shelf above.', ar: 'خمس أدوات جنب النار. اضغط على وحدة منها فوق.' }) + '</div>') +
      '<div class="qx-tabs-line">' + c.tools.map(function (x) {
        return '<button class="qx-chip' + (S.seenTools[x.key] ? ' is-seen' : '') + (x.key === S.tool ? ' is-on' : '') + '" data-t="' + x.key + '">' + L(x.name) + '</button>';
      }).join('') + '</div>' +
      '<div class="qx-count">' + num(seen) + ' ' + L(T.of) + ' ' + num(c.tools.length) + '</div>';
    $$('[data-t]', box).forEach(function (b) {
      b.addEventListener('click', function () {
        var k = b.getAttribute('data-t');
        var el = $('.qa-tool[data-tool="' + k + '"]', main);
        if (el) el.dispatchEvent(new Event('click'));
      });
    });
  }

  function renderCupInfo(c) {
    var box = $('#qx-info'); if (!box) return;
    var cu = S.cup != null ? c.cups[S.cup] : null;
    box.innerHTML = cu
      ? '<div class="qx-kicker">' + L({ en: 'Cup', ar: 'الفنجال' }) + ' ' + num(S.cup + 1) + '</div><div class="qx-info-name">' + L(cu.name) + '</div><div class="qx-info-text">' + L(cu.text) + '</div>'
      : '<div class="qx-info-text">' + L({ en: 'Each of the four cups has a name. Tap a cup above.', ar: 'كل فنجال من الأربعة له اسم. اضغط على فنجال فوق.' }) + '</div>';
  }

  // swipe between chapters
  function wireSwipe() {
    var x0 = null, y0 = null;
    main.addEventListener('touchstart', function (e) { if (S.part !== 'story') return; x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; }, { passive: true });
    main.addEventListener('touchend', function (e) {
      if (S.part !== 'story' || x0 == null) return;
      var dx = e.changedTouches[0].clientX - x0, dy = e.changedTouches[0].clientY - y0;
      x0 = null;
      if (Math.abs(dx) < 60 || Math.abs(dy) > 50) return;
      var forward = isAr() ? dx > 0 : dx < 0;
      if (forward && S.ch < STORY.length - 1) goCh(S.ch + 1);
      else if (!forward && S.ch > 0) goCh(S.ch - 1);
    }, { passive: true });
  }

  // ════════════════════════════════════════════════════════════
  // 2. HOW IT'S MADE (AR)
  // ════════════════════════════════════════════════════════════
  var MV_SRC = 'https://ajax.googleapis.com/ajax/libs/model-viewer/3.5.0/model-viewer.min.js';
  var mvReady = null;
  function ensureModelViewer() {
    if (mvReady) return mvReady;
    mvReady = new Promise(function (resolve) {
      if (window.customElements && customElements.get('model-viewer')) { resolve(true); return; }
      var s = document.createElement('script');
      s.type = 'module';
      s.src = window.CL_MODEL_VIEWER_SRC || MV_SRC;
      s.onerror = function () { resolve(false); };
      document.head.appendChild(s);
      if (window.customElements) customElements.whenDefined('model-viewer').then(function () { resolve(true); });
      setTimeout(function () { resolve(!!(window.customElements && customElements.get('model-viewer'))); }, 12000);
    });
    return mvReady;
  }

  function brewLayout() {
    main.setAttribute('data-view', 'brew');
    main.innerHTML =
      '<section class="qx-brew">' +
        '<div class="qx-stage" id="qx-stage">' +
          '<div class="qx-stage-loading" id="qx-loading" hidden><i class="qx-spinner"></i><span></span></div>' +
          '<model-viewer id="qx-mv" hidden ar ar-modes="webxr scene-viewer quick-look" ar-scale="fixed" ar-placement="floor" ' +
            'camera-controls touch-action="pan-y" auto-rotate auto-rotate-delay="0" rotation-per-second="14deg" interaction-prompt="none" ' +
            'shadow-intensity="1.1" shadow-softness=".9" exposure="1.15" environment-image="neutral" camera-orbit="30deg 72deg auto" alt="">' +
            '<div class="qx-hot" slot="hotspot-spout" data-position="0 0 0" data-normal="0 0 1" hidden><i></i><span data-h="spout"></span></div>' +
            '<div class="qx-hot" slot="hotspot-lid" data-position="0 0 0" data-normal="0 0 1" hidden><i></i><span data-h="lid"></span></div>' +
            '<div class="qx-hot to-left" slot="hotspot-handle" data-position="0 0 0" data-normal="0 0 1" hidden><i></i><span data-h="handle"></span></div>' +
          '</model-viewer>' +
          '<div class="qx-scene-box" id="qx-scene"></div>' +
          '<div class="qx-fx" id="qx-fx"><span></span><span></span><span></span></div>' +
          '<button class="qx-ar-btn" id="qx-ar" hidden>' + ICON.cube + '<span></span></button>' +
        '</div>' +
        '<div class="qx-dots" id="qx-dots">' + STEPS.map(function () { return '<i></i>'; }).join('') + '</div>' +
        '<article class="qx-card" id="qx-stepcard"></article>' +
      '</section>';
    $('#qx-ar').addEventListener('click', launchAR);
    var mv = $('#qx-mv');
    mv.addEventListener('load', function () { $('#qx-loading').hidden = true; fitModel(); });
    // a model that can't load (offline, slow network) is replaced by its drawing, the step still works
    mv.addEventListener('error', function () { if (stageModel && mv.getAttribute('src') === modelSrc(stageModel)) markBad(stageModel); });
  }

  var HOT = {
    spout: { en: 'The spout, with the leef inside', ar: 'الخشم، وفيه الليف' },
    lid: { en: 'The lid', ar: 'الغطاء' },
    handle: { en: 'The handle', ar: 'اليد' }
  };

  function renderBrew() {
    if (main.getAttribute('data-view') !== 'brew') brewLayout();
    if (S.brewFinished) { renderBrewDone(); return; }
    renderStep(true);
  }

  function currentStep() { return STEPS[S.step]; }

  function renderStep(fresh) {
    var st = currentStep();
    if (fresh) { stopAction(); S.done = false; S.act = {}; }
    // dots
    $$('#qx-dots i').forEach(function (d, i) { d.className = i < S.step ? 'is-done' : (i === S.step ? 'is-on' : ''); });
    // stage
    showStage(st, fresh);
    // card
    var card = $('#qx-stepcard');
    card.className = 'qx-card' + (fresh ? ' qx-enter' : '');
    card.innerHTML =
      '<div class="qx-step-head"><div class="qx-kicker">' + L(T.step) + ' ' + num(S.step + 1) + ' ' + L(T.of) + ' ' + num(STEPS.length) + '</div></div>' +
      '<h2 class="qx-step-title">' + L(st.title) + '</h2>' +
      '<p class="qx-step-text">' + L(st.text) + '</p>' +
      '<div class="qx-act" id="qx-act">' + actionHTML(st) + '</div>' +
      '<div class="qx-status" id="qx-status"></div>' +
      '<div class="qx-note">' + ICON.leaf + '<span>' + L(st.note) + '</span></div>';
    if (S.done) setStatus('good', S.act.doneMsg || { en: 'Done.', ar: 'تمام.' });
    else if (S.act.msg) setStatus(S.act.msgKind, S.act.msg);
    wireAction(st);
    renderStepBar();
    var labels = $$('.qx-hot [data-h]');
    labels.forEach(function (el) { el.textContent = L(HOT[el.getAttribute('data-h')]); });
    var arBtn = $('#qx-ar span'); if (arBtn) arBtn.textContent = L(T.viewAR);
    var ld = $('#qx-loading span'); if (ld) ld.textContent = L(T.loading3d);
  }

  function renderStepBar() {
    var st = currentStep(), last = S.step === STEPS.length - 1;
    var back = S.step > 0 ? function () { S.step -= 1; renderStep(true); renderParts(); window.scrollTo(0, 0); } : null;
    if (S.done) {
      setBar({ back: back, buttons: [{ label: last ? T.finish : T.nextStep, icon: 'next', onClick: function () {
        if (last) { S.brewFinished = true; renderBrewDone(); }
        else { S.step += 1; renderStep(true); }
        renderParts(); window.scrollTo(0, 0);
      } }] });
      return;
    }
    var b = { label: st.cta, id: 'qx-cta' };
    if (st.action === 'roast') b.hold = roastHold();
    else if (st.action === 'pour') b.hold = pourHold();
    else if (st.action === 'taps') b.onClick = function () { tapOnce(); };
    else if (st.action === 'timed') { b.onClick = function () { startTimed(); }; b.disabled = !!S.act.running; }
    else if (st.action === 'spices') { b.onClick = function () { finishSpices(); }; b.disabled = !(S.act.picked && S.act.picked.cardamom); }
    setBar({ back: back, buttons: [b] });
  }

  // ── stage ──
  var stageModel = null;
  function showStage(st, fresh) {
    var mv = $('#qx-mv'), scene = $('#qx-scene'), ar = $('#qx-ar'), fx = $('#qx-fx');
    fx.classList.toggle('on', st.fx === 'always');
    if (st.stage === 'model') {
      mv.setAttribute('alt', L(st.title));
      if (badModel[st.model]) { stageModel = st.model; showFallback(st.model); return; }
      scene.hidden = true; scene.innerHTML = '';
      mv.hidden = false; ar.hidden = false;
      if (stageModel !== st.model) loadModel(st.model);
      else if (fresh) fitModel();
      $$('.qx-hot', mv).forEach(function (h) { h.hidden = !st.hot; });
      // labels stay readable when the model holds still; other models turn slowly
      if (st.hot) { mv.removeAttribute('auto-rotate'); mv.setAttribute('camera-orbit', '30deg 76deg auto'); mv.resetTurntableRotation && mv.resetTurntableRotation(0); }
      else mv.setAttribute('auto-rotate', '');
    } else {
      mv.hidden = true; ar.hidden = true;
      $('#qx-loading').hidden = true;
      scene.hidden = false;
      if (fresh || !scene.firstChild) scene.innerHTML = QArt[st.scene]();
      if (st.scene === 'roast') paintBeans(S.act.r || 0);
      if (st.scene === 'pour') paintPour(S.act.l || 0);
    }
  }

  // window.CL_MODEL_URLS can point a model name at another address (a CDN, or an embedded copy)
  function modelSrc(name) { return (window.CL_MODEL_URLS && window.CL_MODEL_URLS[name]) || name; }
  var badModel = {};
  function loadModel(name) {
    var mv = $('#qx-mv');
    stageModel = name;
    $('#qx-loading').hidden = false;
    ensureModelViewer().then(function (ok) {
      if (stageModel !== name) return;          // the visitor already moved on
      if (!ok) { markBad(name); return; }
      mv.setAttribute('scale', '1 1 1');
      mv.setAttribute('src', modelSrc(name));
    });
  }
  function markBad(name) {
    badModel[name] = true;
    if (stageModel === name && main.getAttribute('data-view') === 'brew') showFallback(name);
  }
  function showFallback(name) {
    var scene = $('#qx-scene'), mv = $('#qx-mv'), st = currentStep() || {};
    mv.hidden = true; $('#qx-ar').hidden = true; $('#qx-loading').hidden = true;
    scene.hidden = false;
    var labels = !S.brewFinished && st.hot ? { spout: L(HOT.spout), lid: L(HOT.lid), handle: L(HOT.handle) } : null;
    scene.innerHTML = QArt.fallback(name, { labels: labels });
  }

  // scale each model to its real size (meters) so it sits right on a table in AR
  function fitModel() {
    var st = currentStep() || {}, mv = $('#qx-mv');
    var size = S.brewFinished ? 0.07 : st.size;
    if (!mv || !mv.loaded || typeof mv.getDimensions !== 'function' || !size) return;
    mv.setAttribute('scale', '1 1 1');
    requestAnimationFrame(function () {
      var d = mv.getDimensions(), h = Math.max(d.x, d.y, d.z);
      if (h > 0) mv.setAttribute('scale', [size / h, size / h, size / h].join(' '));
      requestAnimationFrame(function () {
        if (mv.updateFraming) mv.updateFraming();
        placeHotspots();
      });
    });
  }

  // label the dallah's parts. In this model the spout points to -x and the handle to +x.
  function placeHotspots() {
    var mv = $('#qx-mv');
    if (!mv || stageModel !== 'saudi_dallah.glb' || !mv.getBoundingBoxCenter) return;
    // center and size come back in meters, already scaled, which is what hotspots use
    var c = mv.getBoundingBoxCenter(), d = mv.getDimensions();
    var cx = c.x, cy = c.y, cz = c.z, dx = d.x, dy = d.y;
    var set = function (name, x, y, z) { try { mv.updateHotspot({ name: 'hotspot-' + name, position: x + ' ' + y + ' ' + z }); } catch (e) {} };
    set('spout', cx - dx * 0.47, cy + dy * 0.14, cz);
    set('lid', cx + dx * 0.04, cy + dy * 0.47, cz);
    set('handle', cx + dx * 0.43, cy + dy * 0.06, cz);
  }

  function launchAR() {
    var mv = $('#qx-mv');
    if (mv && mv.canActivateAR) { try { mv.activateAR(); } catch (e) { toast(T.noAR); } }
    else toast(T.noAR);
  }

  // ── actions ──
  function stopAction() {
    pourSound(false);
    if (S.act && S.act.timer) { clearInterval(S.act.timer); S.act.timer = 0; }
  }

  function succeed(msg) {
    stopAction();
    S.done = true; S.act.doneMsg = msg;
    setStatus('good', msg);
    sfx('ok'); buzz(20);
    renderStepBar();
    renderParts();
  }

  function actionHTML(st) {
    var a = S.act;
    if (st.action === 'roast') {
      return '<div class="qx-meter"><div class="qx-meter-zone"></div><div class="qx-meter-needle" id="qx-needle"></div></div>' +
        '<div class="qx-meter-labels"><span>' + L({ en: 'Green', ar: 'أخضر' }) + '</span><b>' + L({ en: 'Golden', ar: 'ذهبي' }) + '</b><span>' + L({ en: 'Dark', ar: 'غامق' }) + '</span></div>';
    }
    if (st.action === 'taps') {
      var n = a.taps || 0, pips = '';
      for (var i = 0; i < st.taps; i++) pips += '<i class="' + (i < n ? 'is-on' : '') + '">' + ICON.check + '</i>';
      return '<div class="qx-pips" id="qx-pips">' + pips + '</div>';
    }
    if (st.action === 'timed') {
      return '<div class="qx-timer"><svg viewBox="0 0 60 60"><circle class="track" cx="30" cy="30" r="25"/><circle class="fill" id="qx-ring" cx="30" cy="30" r="25" stroke-dasharray="157.1" stroke-dashoffset="' + (157.1 * (1 - (a.t || 0))) + '"/></svg>' +
        '<div class="qx-timer-text" id="qx-timer-text">' + L(st.wait || { en: 'Press the button to begin', ar: 'اضغط الزر عشان تبدأ' }) + '</div></div>';
    }
    if (st.action === 'spices') {
      var picked = a.picked || {};
      var names = Object.keys(picked).filter(function (k) { return picked[k]; }).map(function (k) { return L(SPICES[k].name); });
      return '<div class="qx-timer-text">' + (names.length ? L({ en: 'In the dallah: ', ar: 'بالدلة: ' }) + names.join(isAr() ? '، ' : ', ') : L({ en: 'Tap the bowls above to pick.', ar: 'اضغط على الصحون فوق عشان تختار.' })) + '</div>';
    }
    if (st.action === 'pour') {
      var l = a.l || 0;
      return '<div class="qx-gauge"><div class="qx-gauge-bar"><u></u><b id="qx-gauge" style="width:' + Math.round(l * 100) + '%"></b></div><div class="qx-gauge-num" id="qx-gauge-num">' + pct(l) + '</div></div>';
    }
    return '';
  }

  function wireAction(st) {
    if (st.action === 'roast') paintBeans(S.act.r || 0);
    if (st.action === 'taps' && st.scene === 'najrScene') {
      var hit = $('.qa-najr-hit', $('#qx-scene'));
      if (hit) hit.addEventListener('click', function () { tapOnce(); });
    }
    if (st.action === 'spices') {
      S.act.picked = S.act.picked || {};
      $$('.qa-spice', $('#qx-scene')).forEach(function (el) {
        var k = el.getAttribute('data-spice');
        el.classList.toggle('is-on', !!S.act.picked[k]);
        var pick = function () { if (!S.done) toggleSpice(k, el); };
        el.addEventListener('click', pick);
        el.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(); } });
      });
    }
  }

  // roast: the bean color moves from green to golden to dark while held
  var BEAN_STOPS = [[0, [141, 158, 90]], [0.28, [184, 170, 98]], [0.5, [201, 161, 90]], [0.64, [168, 122, 69]], [0.82, [110, 69, 38]], [1, [58, 36, 22]]];
  function beanColor(r) {
    for (var i = 1; i < BEAN_STOPS.length; i++) {
      if (r <= BEAN_STOPS[i][0]) {
        var a = BEAN_STOPS[i - 1], b = BEAN_STOPS[i], k = (r - a[0]) / (b[0] - a[0]);
        return 'rgb(' + [0, 1, 2].map(function (j) { return Math.round(a[1][j] + (b[1][j] - a[1][j]) * k); }).join(',') + ')';
      }
    }
    return 'rgb(58,36,22)';
  }
  function paintBeans(r) {
    var col = beanColor(r);
    $$('.qa-bean', $('#qx-scene')).forEach(function (b) { b.setAttribute('fill', col); });
    var n = $('#qx-needle'); if (n) n.style.left = (r * 100) + '%';
    var smoke = $('.qa-roast-smoke', $('#qx-scene')); if (smoke) smoke.style.opacity = clamp((r - 0.25) * 2, 0, 1);
  }
  var GOLD = [0.42, 0.62];
  function roastHold() {
    var acc = 0;
    return {
      onStart: function () { if (S.done) return; setStatus('info', { en: 'Roasting, stirring the beans', ar: 'نحمّس ونحرّك البن' }); $('.qa-stir', $('#qx-scene')) && $('.qa-stir', $('#qx-scene')).classList.add('qx-stirring'); },
      onTick: function (dt) {
        if (S.done) return false;
        S.act.r = clamp((S.act.r || 0) + dt * 0.16, 0, 1);
        paintBeans(S.act.r);
        var btn = $('#qx-cta'); if (btn) btn.style.setProperty('--p', S.act.r);
        acc += dt; if (acc > 0.22) { acc = 0; sfx('sizzle'); }
        if (S.act.r >= 1) return false;
      },
      onEnd: function () {
        if (S.done) return;
        var r = S.act.r || 0;
        if (r >= GOLD[0] && r <= GOLD[1]) succeed({ en: 'Golden. That is a Najdi hamsa.', ar: 'ذهبي. هذي حمسة نجدية.' });
        else if (r < GOLD[0]) { S.act.msg = { en: 'Still green. Keep roasting.', ar: 'لسا أخضر. كمّل التحميص.' }; S.act.msgKind = 'info'; setStatus('info', S.act.msg); }
        else {
          sfx('bad'); buzz([20, 40, 20]);
          S.act.msg = { en: 'Too dark. Najdi coffee is a light, golden roast. Try a fresh batch.', ar: 'غامق زيادة. القهوة النجدية تحميصتها خفيفة ذهبية. جرّب حمسة جديدة.' }; S.act.msgKind = 'bad';
          setStatus('bad', S.act.msg);
          setTimeout(function () { if (!S.done && currentStep().action === 'roast') { S.act.r = 0; paintBeans(0); var b = $('#qx-cta'); if (b) b.style.setProperty('--p', 0); } }, 1400);
        }
      }
    };
  }

  // taps: najr strikes or spoons of coffee
  function tapOnce() {
    var st = currentStep();
    if (S.done || st.action !== 'taps') return;
    S.act.taps = (S.act.taps || 0) + 1;
    if (st.scene === 'najrScene') {
      sfx('ting'); buzz(12);
      var sc = $('#qx-scene'), pestle = $('#qx-pestle', sc), rings = $('.qa-rings', sc);
      if (pestle) { pestle.classList.add('hit'); setTimeout(function () { pestle.classList.remove('hit'); }, 110); }
      if (rings) { rings.classList.remove('go'); void rings.getBoundingClientRect(); rings.classList.add('go'); }
      $$('.qa-house', sc).forEach(function (h, i) { if (S.act.taps > i * 3) h.classList.add('lit'); });
    } else { sfx('spoon'); buzz(10); }
    $$('#qx-pips i').forEach(function (p, i) { p.classList.toggle('is-on', i < S.act.taps); });
    if (S.act.taps >= st.taps) {
      succeed(st.scene === 'najrScene'
        ? { en: 'Coarsely ground, and the whole street heard it.', ar: 'انطحن خشن، والحارة كلها سمعت.' }
        : { en: 'Three spoons. Now it rises.', ar: 'ثلاث ملاعق، والحين تفور.' });
    }
  }

  // timed: a ring fills while the step happens on its own
  function startTimed() {
    var st = currentStep();
    if (S.done || S.act.running) return;
    S.act.running = true; S.act.t = 0;
    var btn = $('#qx-cta'); if (btn) btn.disabled = true;
    if (st.fx === 'after') $('#qx-fx').classList.add('on');
    var t0 = performance.now(), last = 0;
    S.act.timer = setInterval(function () {
      var k = clamp((performance.now() - t0) / (st.secs * 1000), 0, 1);
      S.act.t = k;
      var ring = $('#qx-ring'); if (ring) ring.setAttribute('stroke-dashoffset', 157.1 * (1 - k));
      if (st.key !== 'settle' && performance.now() - last > 260) { last = performance.now(); sfx('bubble'); }
      if (k >= 1) {
        clearInterval(S.act.timer); S.act.timer = 0; S.act.running = false;
        if (st.key === 'settle') $('#qx-fx').classList.remove('on');
        succeed(st.key === 'boil' ? { en: 'The water is boiling.', ar: 'الماي يغلي.' }
          : st.key === 'brew' ? { en: 'The coffee has brewed. Smell that?', ar: 'فاحت القهوة. شامّ ريحتها؟' }
          : { en: 'Settled and clear.', ar: 'رقدت وصفت.' });
      }
    }, 50);
  }

  // spices: cardamom is a must, cloves and saffron are Najdi, sugar and milk never
  function toggleSpice(k, el) {
    var sp = SPICES[k];
    if (!sp.ok) {
      sfx('bad'); buzz([20, 40, 20]);
      el.classList.remove('is-wrong'); void el.getBoundingClientRect(); el.classList.add('is-wrong');
      S.act.msg = sp.why; S.act.msgKind = 'bad';
      setStatus('bad', sp.why);
      return;
    }
    sfx('tap');
    S.act.picked[k] = !S.act.picked[k];
    el.classList.toggle('is-on', S.act.picked[k]);
    $('#qx-act').innerHTML = actionHTML(currentStep());
    S.act.msg = null; setStatus('', null);
    var b = $('#qx-cta'); if (b) b.disabled = !S.act.picked.cardamom;
  }
  function finishSpices() {
    var p = S.act.picked || {};
    if (!p.cardamom) return;
    var najdi = p.cloves && p.saffron;
    succeed(najdi
      ? { en: 'Cardamom, cloves, and saffron: a true Najdi coffee.', ar: 'هيل وقرنفل وزعفران: قهوة نجدية أصيلة.' }
      : { en: 'Good. Cardamom is the heart of it. In Najd, cloves and saffron are often added too.', ar: 'زين. الهيل أساسها، وفي نجد غالباً يزيدون القرنفل والزعفران.' });
  }

  // pour: hold to fill the finjan, aim for a quarter
  var QUARTER = [0.18, 0.38];
  function paintPour(l) {
    var y = 61 - l * 40;
    var f = $('#qx-pour-fill'), s = $('#qx-pour-surface');
    if (f) f.setAttribute('y', y.toFixed(2));
    if (s) { s.setAttribute('cy', y.toFixed(2)); s.style.opacity = l > 0.01 ? 1 : 0; }
    var g = $('#qx-gauge'); if (g) g.style.width = Math.round(l * 100) + '%';
    var gn = $('#qx-gauge-num'); if (gn) gn.textContent = pct(l);
  }
  function pourHold() {
    return {
      onStart: function () { if (S.done) return; var sc = $('#qx-scene'); sc.classList.add('is-pouring'); pourSound(true); },
      onTick: function (dt) {
        if (S.done) return false;
        S.act.l = clamp((S.act.l || 0) + dt * 0.3, 0, 1);
        paintPour(S.act.l);
        var btn = $('#qx-cta'); if (btn) btn.style.setProperty('--p', S.act.l);
        if (S.act.l >= 0.62) return false;
      },
      onEnd: function () {
        var sc = $('#qx-scene'); if (sc) sc.classList.remove('is-pouring');
        pourSound(false);
        if (S.done) return;
        var l = S.act.l || 0;
        if (l >= QUARTER[0] && l <= QUARTER[1]) succeed({ en: 'A quarter cup. Perfect.', ar: 'ربع فنجال. مضبوط.' });
        else if (l < QUARTER[0]) { S.act.msg = { en: 'A little more. Up to the line.', ar: 'زيد شوي، لين الخط.' }; S.act.msgKind = 'info'; setStatus('info', S.act.msg); }
        else {
          sfx('bad'); buzz([20, 40, 20]);
          S.act.msg = POUR_HIGH; S.act.msgKind = 'bad'; setStatus('bad', POUR_HIGH);
          setTimeout(function () { if (!S.done && currentStep().action === 'pour') { S.act.l = 0; paintPour(0); var b = $('#qx-cta'); if (b) b.style.setProperty('--p', 0); } }, 1500);
        }
      }
    };
  }

  // ── brewing finished ──
  function renderBrewDone() {
    if (main.getAttribute('data-view') !== 'brew') brewLayout();
    stopAction();
    $$('#qx-dots i').forEach(function (d) { d.className = 'is-done'; });
    var mv = $('#qx-mv'), scene = $('#qx-scene'), CUP = 'arabic_coffee_cup.glb';
    $('#qx-fx').classList.remove('on');
    $$('.qx-hot', mv).forEach(function (h) { h.hidden = true; });
    mv.setAttribute('auto-rotate', '');
    $('#qx-ar span').textContent = L({ en: 'Put the finjan on your table', ar: 'حط الفنجال على طاولتك' });
    if (badModel[CUP]) { stageModel = CUP; showFallback(CUP); }
    else {
      scene.hidden = true; scene.innerHTML = '';
      mv.hidden = false; $('#qx-ar').hidden = false;
      if (stageModel !== CUP) loadModel(CUP);
      else fitModel();
    }
    var card = $('#qx-stepcard');
    card.className = 'qx-card qx-done-card qx-enter';
    card.innerHTML =
      '<div class="qx-kicker">' + L({ en: 'Your coffee is ready', ar: 'قهوتك جاهزة' }) + '</div>' +
      '<h2 class="qx-h1">' + L({ en: 'Golden, fragrant, and poured a quarter.', ar: 'ذهبية، فايحة، وربع فنجال.' }) + '</h2>' +
      '<p class="qx-p">' + L({ en: 'You roasted it, pounded it, brewed it, and spiced it the Najdi way. Now the most important part: serving it.', ar: 'حمّستها، ودقّيتها، وطبختها، وهيّلتها على الطريقة النجدية. والحين أهم شي: الصبّة.' }) + '</p>';
    setBar({
      back: function () { S.brewFinished = false; S.step = STEPS.length - 1; renderStep(true); renderParts(); },
      buttons: [{ label: T.toGame, icon: 'next', onClick: function () { setPart('game'); } }]
    });
    renderParts();
  }

  // ════════════════════════════════════════════════════════════
  // 3. THE GAME
  // ════════════════════════════════════════════════════════════
  function newGame() {
    return { phase: 'intro', turn: 0, readIdx: 0, score: 0, served: {}, current: null, l: 0, fb: null, fbKind: '', learned: { order1: true, order: true, hand: true, pour: true, read: true } };
  }

  function renderGame() {
    if (!S.game) S.game = newGame();
    var g = S.game;
    main.setAttribute('data-view', 'game');
    main.innerHTML =
      '<section class="qx-game">' +
        '<div class="qx-game-scene" id="qx-gscene">' +
          '<div class="qx-cam" id="qx-cam">' +
            QArt.majlis(SEATS.map(function (k) { return GUESTS[k]; })) +
            '<div class="qx-glabels" id="qx-glabels"></div>' +
          '</div>' +
          '<div class="qx-score" id="qx-score">' + ICON.star + '<span></span></div>' +
        '</div>' +
        '<article class="qx-card qx-enter" id="qx-gcard"></article>' +
      '</section>';
    $$('.qa-guest', main).forEach(function (el) {
      var k = el.getAttribute('data-guest');
      el.addEventListener('click', function () { onGuest(k); });
      el.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onGuest(k); } });
    });
    drawGuests();
    if (g.phase === 'end') renderResult();
    else renderGameCard();
  }

  function seatX(k) { return ((8 + 46 + SEATS.indexOf(k) * 94) / 390 * 100); }

  // the camera moves in on one guest (or back out with null)
  function camTo(k) {
    var cam = $('#qx-cam'); if (!cam) return;
    if (!k) { cam.style.transform = ''; cam.classList.remove('is-close'); return; }
    var s = 1.75, lim = 50 * (1 - 1 / s);
    var tx = clamp(50 - seatX(k), -lim, lim), ty = clamp(50 - 56, -lim, lim);
    cam.style.transform = 'scale(' + s + ') translate(' + tx.toFixed(2) + '%, ' + ty.toFixed(2) + '%)';
    cam.classList.add('is-close');
  }

  function drawGuests() {
    var g = S.game;
    var labels = $('#qx-glabels'); if (!labels) return;
    labels.innerHTML = SEATS.map(function (k) {
      var gu = GUESTS[k];
      return '<div class="qx-glabel" style="left:' + seatX(k) + '%">' + (g.served[k] ? '<span class="ok"></span>' : '') + L(gu.name) + '<small>' + L(gu.role) + '</small></div>' +
        '<div class="qx-bubble" id="qx-bub-' + k + '" style="left:' + seatX(k) + '%"></div>';
    }).join('');
    $$('.qa-guest', main).forEach(function (el) {
      var k = el.getAttribute('data-guest');
      el.classList.toggle('is-served', !!g.served[k] && g.phase !== 'read');
      el.classList.toggle('is-dim', g.phase === 'pick' && !!g.served[k]);
      el.classList.toggle('is-pickable', g.phase === 'pick' && !g.served[k]);
      el.classList.toggle('is-target', (g.phase === 'hand' || g.phase === 'pour') && g.current === k);
    });
    var sc = $('#qx-score span'); if (sc) sc.textContent = num(g.score) + ' / ' + num(MAX_SCORE);
  }

  function bubble(k, text) {
    var b = $('#qx-bub-' + k); if (!b) return;
    b.textContent = L(text);
    b.classList.add('show');
    setTimeout(function () { b.classList.remove('show'); }, 2200);
  }

  function feedbackHTML(g) {
    if (!g.fb) return '<div class="qx-feedback" id="qx-fb"></div>';
    return '<div class="qx-feedback ' + g.fbKind + '" id="qx-fb">' + (g.fbKind === 'good' ? ICON.check : ICON.info) + '<span>' + L(g.fb) + '</span></div>';
  }

  function renderGameCard() {
    var g = S.game, card = $('#qx-gcard');
    var gu = g.current ? GUESTS[g.current] : null;
    var html = '';
    if (g.phase === 'intro') {
      html = '<div class="qx-round">' + L(G_TEXT.round1) + '</div><h2 class="qx-prompt">' + L(G_TEXT.introTitle) + '</h2><p class="qx-sub">' + L(G_TEXT.introSub) + '</p>';
      setBar({ buttons: [{ label: G_TEXT.start, icon: 'next', onClick: function () { g.phase = 'pick'; g.fb = null; drawGuests(); renderGameCard(); renderParts(); } }] });
    } else if (g.phase === 'pick') {
      html = '<div class="qx-round">' + L(G_TEXT.round1) + ' · ' + num(g.turn + 1) + '/' + num(ORDER.length) + '</div>' +
        '<h2 class="qx-prompt">' + L(g.turn === 0 ? G_TEXT.pickFirst : G_TEXT.pickNext) + '</h2><p class="qx-sub">' + L(G_TEXT.pickSub) + '</p>' + feedbackHTML(g);
      bar.innerHTML = '';
    } else if (g.phase === 'hand') {
      html = '<div class="qx-round">' + L(G_TEXT.round1) + '</div><h2 class="qx-prompt">' + L(G_TEXT.handQ) + '</h2><p class="qx-sub">' + L(G_TEXT.handSub) + '</p>' + feedbackHTML(g);
      setBar({ physical: true, buttons: [
        { label: G_TEXT.left, kind: 'line', onClick: function () { answerHand('left'); } },
        { label: G_TEXT.right, kind: 'line', onClick: function () { answerHand('right'); } }
      ] });
    } else if (g.phase === 'pour') {
      html = '<div class="qx-round">' + L(G_TEXT.round1) + ' · ' + num(g.turn + 1) + '/' + num(ORDER.length) + '</div>' +
        '<div style="display:flex;gap:14px;align-items:center">' +
          '<svg class="qx-mini-cup" viewBox="0 0 100 80" id="qx-mini">' + QArt.finjan(g.l) + '</svg>' +
          '<div><h2 class="qx-prompt">' + L(G_TEXT.pourQ) + L(gu.name) + '</h2><p class="qx-sub">' + L(G_TEXT.pourSub) + '</p></div>' +
        '</div>' +
        '<div class="qx-gauge" style="margin-top:14px"><div class="qx-gauge-bar"><u></u><b id="qx-gauge" style="width:' + Math.round(g.l * 100) + '%"></b></div><div class="qx-gauge-num" id="qx-gauge-num">' + pct(g.l) + '</div></div>' +
        feedbackHTML(g);
      setBar({ buttons: [{ label: G_TEXT.holdPour, id: 'qx-cta', hold: gamePourHold() }] });
    } else if (g.phase === 'read') {
      var r = READS[g.readIdx], rg = GUESTS[r.key];
      html = '<div class="qx-round">' + L(G_TEXT.round2) + ' · ' + num(g.readIdx + 1) + '/' + num(READS.length) + '</div>' +
        '<h2 class="qx-prompt">' + L(rg.name) + L(G_TEXT.readQ) + '</h2><p class="qx-sub">' + L(r.shake ? G_TEXT.shakes : G_TEXT.still) + '</p>' + feedbackHTML(g);
      setBar({ buttons: [
        { label: G_TEXT.pourMore, kind: 'line', onClick: function () { answerRead('pour'); } },
        { label: G_TEXT.take, kind: 'line', onClick: function () { answerRead('take'); } }
      ] });
      showReadGesture();
    }
    card.innerHTML = html;
    camTo(g.phase === 'hand' || g.phase === 'pour' ? g.current : g.phase === 'read' ? READS[g.readIdx].key : null);
  }

  function onGuest(k) {
    var g = S.game;
    if (!g || g.phase !== 'pick' || g.served[k] || g.busy) return;
    var want = ORDER[g.turn];
    if (k === want) {
      g.score += 1; sfx('ok'); buzz(15);
      g.fb = PICK_GOOD[g.turn]; g.fbKind = 'good';
      g.current = k;
      g.phase = g.turn === 0 ? 'hand' : 'pour';
      g.l = 0;
      drawGuests(); renderGameCard();
    } else {
      sfx('bad'); buzz([20, 40, 20]);
      if (g.turn === 0) g.learned.order1 = false; else g.learned.order = false;
      var el = $('.qa-guest[data-guest="' + k + '"]', main);
      if (el) { el.classList.remove('is-wrong'); void el.getBoundingClientRect(); el.classList.add('is-wrong'); }
      g.fb = PICK_BAD[g.turn]; g.fbKind = 'bad';
      g.current = want; g.busy = true;
      var tgt = $('.qa-guest[data-guest="' + want + '"]', main); if (tgt) tgt.classList.add('is-target');
      renderGameCard();
      setTimeout(function () {
        g.busy = false;
        g.phase = g.turn === 0 ? 'hand' : 'pour'; g.l = 0;
        drawGuests(); renderGameCard();
      }, 2200);
    }
    renderParts();
  }

  function answerHand(h) {
    var g = S.game;
    if (h === 'right') { g.score += 1; g.fb = HAND_GOOD; g.fbKind = 'good'; sfx('ok'); }
    else { g.learned.hand = false; g.fb = HAND_BAD; g.fbKind = 'bad'; sfx('bad'); buzz([20, 40, 20]); }
    g.phase = 'pour'; g.l = 0;
    drawGuests(); renderGameCard();
  }

  function paintMini(l) {
    var mini = $('#qx-mini'); if (mini) mini.innerHTML = QArt.finjan(l);
    var gb = $('#qx-gauge'); if (gb) gb.style.width = Math.round(l * 100) + '%';
    var gn = $('#qx-gauge-num'); if (gn) gn.textContent = pct(l);
  }

  function gamePourHold() {
    return {
      onStart: function () { pourSound(true); },
      onTick: function (dt) {
        var g = S.game;
        g.l = clamp(g.l + dt * 0.3, 0, 1);
        paintMini(g.l);
        var btn = $('#qx-cta'); if (btn) btn.style.setProperty('--p', g.l);
        if (g.l >= 0.7) return false;
      },
      onEnd: function () {
        pourSound(false);
        var g = S.game, k = g.current, l = g.l;
        if (l < 0.04) return;              // a tap, not a pour
        if (l >= QUARTER[0] && l <= QUARTER[1]) { g.score += 1; g.fb = POUR_GOOD; g.fbKind = 'good'; sfx('ok'); }
        else { g.learned.pour = false; g.fb = l < QUARTER[0] ? POUR_LOW : POUR_HIGH; g.fbKind = 'bad'; sfx('bad'); }
        g.served[k] = true;
        bubble(k, k === 'host' ? THANKS.host : THANKS.other);
        g.turn += 1; g.current = null;
        if (g.turn >= ORDER.length) { g.phase = 'read'; g.readIdx = 0; }
        else g.phase = 'pick';
        drawGuests(); renderGameCard(); renderParts();
      }
    };
  }

  function showReadGesture() {
    var g = S.game, r = READS[g.readIdx];
    $$('.qa-guest', main).forEach(function (el) {
      var k = el.getAttribute('data-guest');
      el.classList.remove('is-shaking', 'is-holding', 'is-target', 'is-served');
      if (k === r.key) {
        el.classList.add('is-target');
        void el.getBoundingClientRect();
        el.classList.add(r.shake ? 'is-shaking' : 'is-holding');
      } else if (g.served[k]) el.classList.add('is-served');
    });
  }

  function answerRead(choice) {
    var g = S.game, r = READS[g.readIdx];
    if (g.busy) return;
    var right = r.shake ? 'take' : 'pour';
    if (choice === right) { g.score += 1; g.fb = READ_GOOD[right]; g.fbKind = 'good'; sfx('ok'); buzz(15); }
    else { g.learned.read = false; g.fb = READ_BAD[choice]; g.fbKind = 'bad'; sfx('bad'); buzz([20, 40, 20]); }
    if (right === 'pour') bubble(r.key, THANKS.other);
    g.busy = true;
    renderGameCardFeedbackOnly();
    drawGuests();
    setTimeout(function () {
      g.busy = false;
      g.readIdx += 1; g.fb = null;
      if (g.readIdx >= READS.length) { g.phase = 'end'; saveResult(); renderResult(); }
      else renderGameCard();
      renderParts();
    }, 2300);
  }

  function renderGameCardFeedbackOnly() {
    var fb = $('#qx-fb'), g = S.game; if (!fb) return;
    fb.className = 'qx-feedback ' + g.fbKind;
    fb.innerHTML = (g.fbKind === 'good' ? ICON.check : ICON.info) + '<span>' + L(g.fb) + '</span>';
    $$('button', bar).forEach(function (b) { b.disabled = true; });
  }

  function starsFor(score) { return score >= MAX_SCORE ? 3 : score >= Math.ceil(MAX_SCORE * 0.7) ? 2 : 1; }

  function saveResult() {
    var g = S.game;
    try {
      var all = JSON.parse(localStorage.getItem('cl_progress') || '{}');
      var prev = all.qahwa || {};
      all.qahwa = { score: Math.max(g.score, prev.score || 0), last: g.score, max: MAX_SCORE, stars: Math.max(starsFor(g.score), prev.stars || 0), at: new Date().toISOString() };
      localStorage.setItem('cl_progress', JSON.stringify(all));
    } catch (e) {}
  }

  function renderResult() {
    var g = S.game, stars = starsFor(g.score);
    var title = RESULT_TITLES.filter(function (r) { return g.score >= r.min; })[0].t;
    var best = null;
    try { best = (JSON.parse(localStorage.getItem('cl_progress') || '{}').qahwa || {}).score; } catch (e) {}
    $$('.qa-guest', main).forEach(function (el) { el.classList.remove('is-target', 'is-shaking', 'is-holding', 'is-dim'); el.classList.add('is-served'); });
    camTo(null);
    var card = $('#qx-gcard');
    card.className = 'qx-card qx-result qx-enter';
    card.innerHTML =
      '<div class="qx-stars">' + [0, 1, 2].map(function (i) { return ICON.star.replace('<svg', '<svg class="' + (i < stars ? 'on' : '') + '"'); }).join('') + '</div>' +
      '<h2 class="qx-prompt">' + L(title) + '</h2>' +
      '<div class="qx-big-score">' + num(g.score) + ' <small>/ ' + num(MAX_SCORE) + '</small></div>' +
      (best != null && best > g.score ? '<p class="qx-sub">' + L(G_TEXT.best) + num(best) + '</p>' : '') +
      '<div class="qx-learned"><div class="qx-kicker" style="margin-bottom:2px">' + L(G_TEXT.learned) + '</div>' +
        LEARN.map(function (r) { var y = g.learned[r.key]; return '<div class="' + (y ? 'y' : 'n') + '">' + (y ? ICON.check : ICON.info) + '<span>' + L(r.text) + '</span></div>'; }).join('') +
      '</div>';
    sfx('star');
    setBar({ buttons: [
      { label: G_TEXT.again, kind: 'line', icon: 'replay', onClick: function () { S.game = newGame(); renderGame(); renderParts(); } },
      { label: G_TEXT.done, onClick: function () { window.location.href = 'experience.html?x=qahwa'; } }
    ] });
    drawGuests();
  }

  // ════════════════════════════════════════════════════════════
  // BOOT
  // ════════════════════════════════════════════════════════════
  function renderSound() {
    var b = $('#qx-sound'); if (!b) return;
    b.innerHTML = S.sound ? ICON.soundOn : ICON.soundOff;
    b.setAttribute('aria-label', L(S.sound ? { en: 'Sound on', ar: 'الصوت شغّال' } : { en: 'Sound off', ar: 'الصوت مقفل' }));
    b.setAttribute('aria-pressed', S.sound ? 'true' : 'false');
  }

  function refresh() {
    // language.js and ThemeManager both announce changes; only redraw when the language really changed
    if (S.lastLang === window.currentLang) return;
    S.lastLang = window.currentLang;
    document.title = L(T.title) + ' — CultureLens';
    renderSound();
    if (S.part === 'story') renderStory();
    else if (S.part === 'brew') { if (S.brewFinished) renderBrewDone(); else renderStep(false); }
    else { drawGuests(); if (S.game && S.game.phase === 'end') renderResult(); else renderGameCard(); }
    renderParts();
  }

  function boot() {
    main = $('#qx-main'); bar = $('#qx-bar'); parts = $('#qx-parts'); toastEl = $('#qx-toast');
    document.body.insertAdjacentHTML('afterbegin', QArt.defs());
    $('#qx-close').innerHTML = ICON.close;
    $('#qx-sound').addEventListener('click', function () {
      S.sound = !S.sound;
      try { localStorage.setItem('cl_sound', S.sound ? 'on' : 'off'); } catch (e) {}
      if (!S.sound) pourSound(false); else sfx('tap');
      renderSound();
    });
    $$('.qx-part', parts).forEach(function (b) {
      b.addEventListener('click', function () { setPart(b.getAttribute('data-part')); });
    });
    // theme this page as Najd unless the visitor picked another region (the region gate handles that)
    if (window.ThemeManager && !window.ThemeManager.current()) window.ThemeManager.applyRegionTheme('najd');
    wireSwipe();
    document.addEventListener('languageChanged', refresh);
    S.lastLang = window.currentLang;
    document.title = L(T.title) + ' — CultureLens';
    var h = (location.hash || '').replace('#', '');
    S.part = ['story', 'brew', 'game'].indexOf(h) > -1 ? h : 'story';
    setPart(S.part);
    renderSound();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
