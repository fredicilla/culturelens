/**
 * najd-guide.js — «دليل نجد», a guide for the Najd region.
 *
 * When the visitor is in Najd (body[data-region="najd"], map closed), a button on the side opens the guide.
 * Two ways to use it:
 *   1. Chat  — type a question, get an answer.
 *   2. Talk  — a Najdi man in a white ghutra, black agal and thobe; speak to him (microphone) and he answers out loud.
 * The answers come from a small knowledge base written below (no server, nothing leaves the device apart from the
 * browser's own speech recognition). It answers only what it knows; anything else gets an honest «I do not know» and
 * a few questions it can answer.
 * Add ?region=najd&guide=1 to the address to open it straight away (for testing).
 */
(function () {
  if (window.__najdGuide) return;
  var isAr = function () { return window.currentLang === 'ar'; };
  var L = function (o) { return o == null ? '' : typeof o === 'string' ? o : (isAr() ? o.ar : o.en); };
  var $ = function (s, r) { return (r || document).querySelector(s); };

  // ════════════════════════════════════════════════════════════
  // KNOWLEDGE — each entry: words that point to it, the answer, related entries, and an experience to try
  // ════════════════════════════════════════════════════════════
  var KB = [
    { id: 'najd', title: { ar: 'وش هي نجد؟', en: 'What is Najd?' },
      k: ['نجد', 'المنطقة الوسطى', 'الوسطى', 'منطقة نجد', 'وش نجد', 'najd', 'central region'],
      a: { ar: 'نجد هي قلب الجزيرة العربية، الهضبة اللي في وسطها، واسمها معناه «الأرض المرتفعة». أشهر مناطقها اليوم الرياض والقصيم، ومنها انطلقت الدولة السعودية من الدرعية.',
           en: 'Najd is the heart of the Arabian Peninsula, the high plateau at its center; the name means "the high land". Today its best-known areas are Riyadh and Al-Qassim, and the Saudi state began here, in Diriyah.' },
      rel: ['diriyah', 'places', 'food'] },

    { id: 'riyadh', title: { ar: 'الرياض', en: 'Riyadh' },
      k: ['الرياض', 'رياض', 'العاصمه', 'العاصمة', 'riyadh', 'capital'],
      a: { ar: 'الرياض عاصمة المملكة وأكبر مدن نجد، واسمها جمع «روضة» وهي الأرض الخضراء اللي يجتمع فيها الماي. فيها قصر المصمك والمتحف الوطني، وجنبها الدرعية ووادي حنيفة.',
           en: 'Riyadh is the capital of the Kingdom and the largest city in Najd. Its name is the plural of "rawdah", a green meadow where rainwater gathers. It has Al-Masmak Fort and the National Museum, with Diriyah and Wadi Hanifa right next to it.' },
      rel: ['masmak', 'diriyah', 'places'] },

    { id: 'diriyah', title: { ar: 'الدرعية', en: 'Diriyah' },
      k: ['الدرعيه', 'الدرعية', 'درعيه', 'الطريف', 'طريف', 'البجيري', 'diriyah', 'turaif', 'bujairi'],
      a: { ar: 'الدرعية على ضفاف وادي حنيفة، أسسها مانع المريدي سنة ١٤٤٦م، وصارت عاصمة الدولة السعودية الأولى سنة ١٧٢٧م مع الإمام محمد بن سعود. وحي الطريف فيها مسجّل في قائمة اليونسكو للتراث العالمي من سنة ٢٠١٠م، وهو من أكبر المدن الطينية في العالم.',
           en: 'Diriyah sits on the banks of Wadi Hanifa. It was founded by Mani\' Al-Muraydi in 1446 and became the capital of the first Saudi state in 1727 under Imam Muhammad bin Saud. Its At-Turaif district has been a UNESCO World Heritage Site since 2010, and is one of the largest mud-brick cities in the world.' },
      rel: ['founding', 'architecture', 'places'] },

    { id: 'founding', title: { ar: 'يوم التأسيس', en: 'Founding Day' },
      k: ['يوم التاسيس', 'التاسيس', 'تاسيس', '22 فبراير', '٢٢ فبراير', 'الدوله السعوديه الاولى', 'الدولة السعودية الأولى', 'محمد بن سعود', 'founding day', 'founding', 'first saudi state'],
      a: { ar: 'يوم التأسيس يوافق ٢٢ فبراير من كل سنة، ويُحتفل فيه بتأسيس الدولة السعودية الأولى على يد الإمام محمد بن سعود في الدرعية سنة ١٧٢٧م. وصار يوم وطني رسمي من سنة ٢٠٢٢م.',
           en: 'Founding Day falls on 22 February each year. It marks Imam Muhammad bin Saud founding the first Saudi state in Diriyah in 1727, and it has been an official national day since 2022.' },
      rel: ['diriyah', 'unification', 'ardah'] },

    { id: 'masmak', title: { ar: 'قصر المصمك', en: 'Al-Masmak Fort' },
      k: ['المصمك', 'مصمك', 'قصر المصمك', 'masmak'],
      a: { ar: 'قصر المصمك حصن من الطين في وسط الرياض القديمة، بأبراجه الأربعة وبابه الخشبي الكبير. شهد استرداد الملك عبدالعزيز للرياض سنة ١٩٠٢م (١٣١٩هـ)، واليوم صار متحف يحكي القصة.',
           en: 'Al-Masmak is a mud-brick fort in the heart of old Riyadh, with four towers and a great wooden gate. It saw King Abdulaziz take back Riyadh in 1902 (1319 AH), and today it is a museum that tells that story.' },
      rel: ['unification', 'riyadh', 'architecture'] },

    { id: 'unification', title: { ar: 'توحيد المملكة', en: 'The unification' },
      k: ['التوحيد', 'توحيد المملكه', 'توحيد', 'توحدت', 'توحد', 'وحد', 'تاسست المملكه', 'تاسيس المملكه', 'الملك عبدالعزيز', 'عبدالعزيز', 'اليوم الوطني', '23 سبتمبر', '٢٣ سبتمبر', 'national day', 'king abdulaziz', 'unification'],
      a: { ar: 'انطلق الملك عبدالعزيز من الرياض سنة ١٩٠٢م، ووحّد البلاد وأعلن اسم «المملكة العربية السعودية» في ٢٣ سبتمبر ١٩٣٢م، وهذا هو اليوم الوطني.',
           en: 'King Abdulaziz set out from Riyadh in 1902, unified the country, and proclaimed the name "Kingdom of Saudi Arabia" on 23 September 1932, which is National Day.' },
      rel: ['masmak', 'founding', 'ardah'] },

    { id: 'qassim', title: { ar: 'القصيم', en: 'Al-Qassim' },
      k: ['القصيم', 'قصيم', 'بريده', 'بريدة', 'عنيزه', 'عنيزة', 'الرس', 'qassim', 'buraydah', 'unaizah'],
      a: { ar: 'القصيم سلة نجد الزراعية، وأشهر مدنها بريدة وعنيزة والرس. مشهورة بتمر السكري، ومهرجان تمور بريدة من أكبر أسواق التمر في العالم، ومنها الكليجا، والسامري أصله من القصيم.',
           en: 'Al-Qassim is the farming heart of Najd; its best-known towns are Buraydah, Unaizah and Ar-Rass. It is famous for Sukkari dates, and the Buraydah date festival is one of the largest date markets in the world. Kleija comes from here, and so does the Samri.' },
      rel: ['dates', 'kleija', 'samri'] },

    { id: 'coffee', title: { ar: 'القهوة السعودية', en: 'Saudi coffee' },
      k: ['القهوه', 'القهوة', 'قهوه', 'قهوة', 'الدله', 'الدلة', 'دله', 'هيل', 'النجر', 'المحماس', 'coffee', 'qahwa', 'dallah'],
      a: { ar: 'القهوة عند أهل نجد عنوان الكرم وأول ما يقدّم للضيف. يُحمَّس البن تحميصة ذهبية، ويُدق في النجر، ويُغلى في الدلة مع الهيل، ويضيفون له في نجد القرنفل والزعفران. والقهوة العربية مسجلة في اليونسكو من سنة ٢٠١٥م، وسمّت وزارة الثقافة سنة ٢٠٢٢م «عام القهوة السعودية».',
           en: 'For the people of Najd, coffee is the sign of generosity and the first thing offered to a guest. The beans are roasted golden, pounded in the najr (mortar) and boiled in the dallah with cardamom; in Najd, cloves and saffron are added too. Arabic coffee has been on UNESCO\'s list since 2015, and the Ministry of Culture named 2022 "the Year of Saudi Coffee".' },
      rel: ['coffeeEtiquette', 'hospitality', 'food'], page: 'qahwa.html' },

    { id: 'coffeeEtiquette', title: { ar: 'سنع القهوة', en: 'Coffee manners' },
      k: ['سنع', 'سنع القهوه', 'تقديم القهوه', 'تقديم القهوة', 'يصب', 'صب القهوه', 'الفنجال', 'الفنجان', 'فنجال', 'هز الفنجال', 'اهز', 'كيف اقدم', 'كيف اصب', 'اصب', 'اقدم القهوه', 'تقدم القهوه', 'etiquette', 'serve coffee', 'finjan', 'pour'],
      a: { ar: 'يمسك المُقهوي الدلة بيده اليسار والفناجيل باليمين، ويبدأ بالكبار والضيوف. يصب شوي بالفنجال ما يعبيه، ويظل واقف يصب لين الضيف يهز الفنجال، وهز الفنجال معناه «بس، كفيت».',
           en: 'The server holds the dallah in the left hand and the cups in the right, and starts with the elders and the guests. He pours only a little into the cup, never filling it, and keeps pouring until the guest gives the cup a small shake, which means "that\'s enough, thank you".' },
      rel: ['coffee', 'hospitality'], page: 'qahwa.html' },

    { id: 'ardah', title: { ar: 'العرضة النجدية', en: 'Al-Ardah' },
      k: ['العرضه', 'العرضة', 'عرضه', 'عرضة', 'السيوف', 'سيف', 'ardah', 'sword dance'],
      a: { ar: 'العرضة النجدية فن يجمع الرقص وقرع الطبول والشعر. يصطف الرجال صفين متقابلين بالسيوف، وبينهم الطبول والعلم، والشاعر ينشد والصفوف ترد. مسجلة في قائمة اليونسكو من سنة ٢٠١٥م، وتؤدّى في الأعياد والمناسبات الوطنية.',
           en: 'Al-Ardah Al-Najdiyah combines dance, drumming and poetry. Men line up in two facing rows holding swords, with the drums and the flag between them; the poet chants and the rows answer. It has been on UNESCO\'s list since 2015 and is performed at Eids and national occasions.' },
      rel: ['samri', 'poetry', 'founding'] },

    { id: 'samri', title: { ar: 'السامري', en: 'The Samri' },
      k: ['السامري', 'سامري', 'الطار', 'طار', 'الطارات', 'samri', 'tar'],
      a: { ar: 'السامري فن شعبي من مجالس السمر، اسمه من «السَّمَر» وهو حديث الليل، وبدأ في القصيم وانتشر في نجد. يجلس صفّان من الرجال على ركبهم متقابلين، صف يغني ويصفق والثاني يتمايل ويرفع الطارات وينزلها على الإيقاع.',
           en: 'The Samri is a folk art of evening gatherings; its name comes from "samar", the talk of the night. It began in Al-Qassim and spread across Najd. Two rows of men kneel facing each other: one row sings and claps while the other sways and lifts and lowers its frame drums to the beat.' },
      rel: ['ardah', 'poetry', 'qassim'], page: 'samri.html' },

    { id: 'poetry', title: { ar: 'الشعر النبطي', en: 'Nabati poetry' },
      k: ['الشعر', 'شعر', 'النبطي', 'نبطي', 'قصيده', 'قصيدة', 'شاعر', 'poetry', 'poem', 'nabati'],
      a: { ar: 'الشعر النبطي هو الشعر باللهجة المحكية، وهو ديوان أهل نجد: فيه الفخر والحكمة والغزل والوصف. يُلقى في المجالس، ويُنشد في العرضة والسامري.',
           en: 'Nabati poetry is poetry in the spoken dialect, the record of life in Najd: pride, wisdom, love and description. It is recited in the majlis and sung in the Ardah and the Samri.' },
      rel: ['ardah', 'samri', 'dialect'] },

    { id: 'food', title: { ar: 'أكلات نجد', en: 'Najdi food' },
      k: ['اكلات', 'أكلات', 'اكل', 'أكل', 'طبخ', 'وجبه', 'وجبة', 'الاكلات الشعبيه', 'الكبسه', 'الكبسة', 'كبسه', 'الجريش', 'جريش', 'القرصان', 'قرصان', 'المرقوق', 'مرقوق', 'المطازيز', 'مطازيز', 'food', 'dish', 'eat', 'kabsa', 'jareesh'],
      a: { ar: 'من أشهر أكلات نجد: الكبسة، والجريش (قمح مجروش يُطبخ باللبن أو المرق)، والقرصان والمرقوق والمطازيز (عجين يُطبخ بمرق اللحم والخضار)، والحنيني في الشتاء (خبز وتمر وسمن)، والكليجا من القصيم.',
           en: 'Some of Najd\'s best-known dishes: kabsa, jareesh (cracked wheat cooked with buttermilk or broth), qursan, marqooq and matazeez (dough cooked in a meat and vegetable stew), haneeni in winter (bread, dates and ghee), and kleija from Al-Qassim.' },
      rel: ['kleija', 'dates', 'coffee'] },

    { id: 'kleija', title: { ar: 'الكليجا', en: 'Kleija' },
      k: ['الكليجا', 'كليجا', 'كليجه', 'kleija', 'kleicha'],
      a: { ar: 'الكليجا قرص من عجين البر محشي بالتمر أو السكر والهيل، يُخبز ويُقدَّم مع القهوة. تشتهر فيها القصيم، ولها مهرجان سنوي في بريدة.',
           en: 'Kleija is a round pastry of wheat dough filled with dates or sugar and cardamom, baked and served with coffee. Al-Qassim is famous for it, and Buraydah holds a yearly kleija festival.' },
      rel: ['qassim', 'food', 'coffee'] },

    { id: 'dates', title: { ar: 'التمور', en: 'Dates' },
      k: ['التمر', 'تمر', 'التمور', 'تمور', 'السكري', 'سكري', 'النخل', 'نخل', 'dates', 'sukkari', 'palm'],
      a: { ar: 'النخل رفيق أهل نجد من قديم، والتمر ما يغيب عن المجلس مع القهوة. أشهر تمور نجد السكري من القصيم، ومهرجان تمور بريدة من أكبر أسواق التمر في العالم.',
           en: 'The palm has been the companion of the people of Najd for ages, and dates are always served with coffee in the majlis. The best-known Najdi date is the Sukkari of Al-Qassim, and the Buraydah date festival is one of the largest date markets in the world.' },
      rel: ['qassim', 'coffee', 'food'] },

    { id: 'architecture', title: { ar: 'العمارة النجدية', en: 'Najdi architecture' },
      k: ['العماره', 'العمارة', 'عماره', 'البيوت', 'بيوت', 'بيت', 'الطين', 'طين', 'اللبن', 'المباني', 'الابواب', 'الأبواب', 'باب', 'architecture', 'mud', 'house', 'door', 'building'],
      a: { ar: 'البيت النجدي يُبنى من اللَّبِن، وهو طين مخلوط بالتبن، وجدرانه سميكة تحمي من حر الصيف وبرد الشتاء. فيه فتحات مثلثة للتهوية والنور، وشرفات مسننة فوق الجدران، وأبواب خشب ملوّنة بنقوش هندسية، وفناء في الوسط. والسقف من خشب الأثل وجريد النخل.',
           en: 'The Najdi house is built of mud brick (clay mixed with straw), with thick walls that keep out the summer heat and the winter cold. It has triangular openings for air and light, stepped crenellations along the top of the walls, wooden doors painted with geometric patterns, and a courtyard in the middle. The roof is made of tamarisk wood and palm fronds.' },
      rel: ['diriyah', 'places', 'masmak'] },

    { id: 'clothing', title: { ar: 'اللبس', en: 'Clothing' },
      k: ['اللبس', 'لبس', 'الملابس', 'ملابس', 'الثوب', 'ثوب', 'الغتره', 'الغترة', 'غتره', 'الشماغ', 'شماغ', 'العقال', 'عقال', 'البشت', 'بشت', 'clothes', 'clothing', 'thobe', 'ghutra', 'shemagh', 'agal', 'bisht'],
      a: { ar: 'لبس الرجل في نجد: الثوب، وعلى الراس الغترة البيضاء (وغالبًا في الشتاء الشماغ الأحمر)، وفوقها العقال الأسود. وفي المناسبات يُلبس البشت فوق الثوب.',
           en: 'A man in Najd wears the thobe, with the white ghutra on his head (often the red shemagh in winter) held by the black agal. On special occasions he wears the bisht, a cloak, over the thobe.' },
      rel: ['hospitality', 'ardah'] },

    { id: 'dialect', title: { ar: 'كلمات نجدية', en: 'Najdi words' },
      k: ['اللهجه', 'اللهجة', 'لهجه', 'كلمات', 'كلمه', 'كلمة', 'معنى', 'وش معنى', 'وش يعني', 'وش تعني', 'ابشر', 'سم', 'قايله', 'dialect', 'words', 'word', 'meaning', 'slang'],
      a: { ar: 'من كلمات أهل نجد: «وش» يعني ماذا، و«أبشر» يعني تم ولك ما تبي، و«سم» يعني نعم تفضل، و«زين» يعني جيد، و«الحين» يعني الآن، و«مير» يعني لكن، و«القايلة» وقت الظهر الحار.',
           en: 'Some Najdi words: "wesh" means "what", "abshir" means "you\'ve got it", "sem" means "yes, at your service", "zain" means "good", "al-heen" means "now", "meer" means "but", and "al-gayla" is the hot midday hours.' },
      rel: ['hospitality', 'poetry'] },

    { id: 'hospitality', title: { ar: 'الكرم والمجلس', en: 'Hospitality and the majlis' },
      k: ['الكرم', 'كرم', 'الضيافه', 'الضيافة', 'ضيف', 'الضيف', 'المجلس', 'مجلس', 'السنع', 'hospitality', 'guest', 'majlis', 'generosity'],
      a: { ar: 'الكرم عند أهل نجد شي أساسي: الضيف يُستقبل بـ«حيّاك الله» ويُقدَّم له التمر والقهوة أول شي. والمجلس مكان استقبال الضيوف، يُجلس فيه على مساند حول الجدار، ويبدأون بالكبار.',
           en: 'Generosity is essential in Najd: a guest is welcomed with "hayyak Allah" and offered dates and coffee first of all. The majlis is the room for receiving guests, with cushions along the walls, and the elders are always served first.' },
      rel: ['coffeeEtiquette', 'coffee', 'dialect'] },

    { id: 'places', title: { ar: 'وين أروح في نجد؟', en: 'Where to go in Najd' },
      k: ['اماكن', 'أماكن', 'مكان', 'وين اروح', 'وين أروح', 'سياحه', 'سياحة', 'ازور', 'أزور', 'زياره', 'معالم', 'طرف العالم', 'اشيقر', 'أشيقر', 'شقراء', 'places', 'visit', 'tourism', 'see', 'edge of the world', 'ushaiger'],
      a: { ar: 'قل لي وين تبي تروح وأنا بالخدمة! وإذا جيت نجد لا يفوتك: حي الطريف والبجيري في الدرعية، وقصر المصمك والمتحف الوطني في الرياض، و«طرف العالم» على جبال طويق، وقرية أشيقر التراثية، وشقراء القديمة، ووادي حنيفة، وسوق التمور في بريدة.',
           en: 'If you come to Najd, don\'t miss: At-Turaif and Al-Bujairi in Diriyah, Al-Masmak Fort and the National Museum in Riyadh, the "Edge of the World" on the Tuwaiq escarpment, the heritage village of Ushaiger, old Shaqra, Wadi Hanifa, and the date market in Buraydah.' },
      rel: ['diriyah', 'masmak', 'nature'] },

    { id: 'nature', title: { ar: 'طبيعة نجد وجوها', en: 'Land and weather' },
      k: ['الطبيعه', 'الطبيعة', 'طبيعه', 'الجو', 'جو', 'الطقس', 'طقس', 'حر', 'برد', 'مطر', 'الشتاء', 'شتاء', 'الصيف', 'صيف', 'طويق', 'جبال طويق', 'وادي حنيفه', 'وادي حنيفة', 'صحراء', 'weather', 'climate', 'nature', 'tuwaiq', 'desert', 'winter', 'summer'],
      a: { ar: 'نجد هضبة صحراوية تقطعها جبال طويق ووديان مثل وادي حنيفة. الصيف حار وجاف، والشتاء ليله بارد، والربيع بعد المطر تخضر فيه الروضات، وهو أحلى وقت للكشتة.',
           en: 'Najd is a desert plateau crossed by the Tuwaiq escarpment and valleys like Wadi Hanifa. Summers are hot and dry and winter nights are cold; in spring, after the rain, the meadows turn green, the best time for a desert outing.' },
      rel: ['places', 'najd'] },

    { id: 'masaqil', title: { ar: 'المصاقيل', en: 'Al-Masaqil' },
      k: ['المصاقيل', 'مصاقيل', 'الالعاب', 'الألعاب', 'العاب', 'لعبه', 'لعبة', 'games', 'game', 'marbles', 'masaqil'],
      a: { ar: 'المصاقيل لعبة شعبية من المنطقة الوسطى يلعبها الصغار في الحواري بحبيبات زجاج صغيرة: يرسمون مربع على الرمل ويصوّبون الحبيبات من بعيد، واللي يفوز ياخذ الحبيبات اللي في الحفرة.',
           en: 'Al-Masaqil is a folk game from the Central Region that children play in the alleys with small glass marbles: they draw a square in the sand and aim their marbles from a distance, and the winner takes the marbles in the hole.' },
      rel: ['samri', 'food'], page: 'masaqeel.html' }
  ];

  // small talk
  var TALK = {
    hello: { k: ['السلام عليكم', 'السلام', 'سلام', 'هلا', 'مرحبا', 'اهلين', 'أهلين', 'هاي', 'hello', 'hi', 'hey', 'salam'],
      a: { ar: 'وعليكم السلام ورحمة الله، هلا والله وغلا! أنا دليلك في نجد وبالخدمة. سم، وش تبي تعرف؟ عن تاريخها، أكلها، قهوتها، فنونها، أو قل لي وين تبي تروح.', en: 'Peace be upon you too, welcome! I am your guide to Najd. Ask me about its history, food, coffee, folk arts, or where to go.' } },
    thanks: { k: ['شكرا', 'شكراً', 'يعطيك العافيه', 'يعطيك العافية', 'مشكور', 'تسلم', 'thanks', 'thank you'],
      a: { ar: 'العفو، الله يحييك! أنا بالخدمة، تامر على شي ثاني؟', en: 'You\'re welcome! Ask me anything else about Najd.' } },
    who: { k: ['من انت', 'من أنت', 'وش انت', 'مين انت', 'وش اسمك', 'اسمك', 'who are you', 'your name'],
      a: { ar: 'أنا دليلك في نجد، وأنا بالخدمة. أعرّفك على تاريخها وناسها وأكلها وفنونها، سم اسأل وأبشر.', en: 'I am your guide to Najd: its history, its people, its food and its folk arts. Ask away.' } },
    help: { k: ['وش تعرف', 'ساعدني', 'وش اسال', 'وش أسأل', 'help', 'what can you'],
      a: { ar: 'أبشر، أقدر أعلّمك عن: الدرعية ويوم التأسيس، الرياض والمصمك، القصيم وتمورها، القهوة وسنعها، العرضة والسامري، الأكلات، العمارة الطينية، اللبس، كلمات نجدية، ووين تروح.', en: 'I can tell you about: Diriyah and Founding Day, Riyadh and Al-Masmak, Al-Qassim and its dates, coffee and its manners, the Ardah and the Samri, food, mud-brick architecture, clothing, Najdi words, and where to go.' } }
  };
  var UNKNOWN = { ar: 'السموحة، هذي ما عندي فيها علم أكيد، وما أحب أقولك شي مو متأكد منه. بس سم، اسألني عن نجد: تاريخها، أكلها، قهوتها، فنونها، أو قل لي وين تبي تروح وأنا بالخدمة.',
                  en: 'I don\'t have reliable information on that, and I\'d rather not guess. Ask me about Najd: its history, food, coffee, folk arts, or where to go.' };
  var STARTERS = ['diriyah', 'food', 'coffeeEtiquette', 'dialect', 'places'];

  // ── matching: Arabic is normalized (hamza forms, taa marbuta, alif maqsura, diacritics) ──
  function norm(s) {
    return (' ' + String(s || '').toLowerCase() + ' ')
      .replace(/[ً-ْـ]/g, '')
      .replace(/[إأآ]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي').replace(/ؤ/g, 'و').replace(/ئ/g, 'ي')
      .replace(/[٠-٩]/g, function (d) { return '٠١٢٣٤٥٦٧٨٩'.indexOf(d); })
      .replace(/[^؀-ۿa-z0-9 ]+/g, ' ').replace(/\s+/g, ' ');
  }
  // a keyword counts if it is a whole word or phrase in the question, a longer piece of it, or the start of a word
  // (لبس → لبسكم). Overlapping hits count once (القهوه and قهوه are the same hit), longer hits weigh more.
  function score(q, words) {
    var toks = q.trim().split(' '), seen = {}, hits = [];
    words.forEach(function (w) {
      var n = norm(w).trim(); if (!n || seen[n]) return; seen[n] = 1;
      var bare = n.indexOf('ال') === 0 && n.length > 4 ? n.slice(2) : n;
      var hit = q.indexOf(' ' + n + ' ') >= 0 || (n.length >= 4 && q.indexOf(n) >= 0) || q.indexOf(' ' + bare + ' ') >= 0 ||
        (n.indexOf(' ') < 0 && bare.length >= 3 && toks.some(function (t) { var tb = t.indexOf('ال') === 0 && t.length > 4 ? t.slice(2) : t; return tb.indexOf(bare) === 0 && tb.length - bare.length <= 3; }));
      if (hit) hits.push(bare);
    });
    hits = hits.filter(function (h, i) { return !hits.some(function (o, j) { return j !== i && o.length > h.length && o.indexOf(h) >= 0; }); });
    var total = 0, best = 0; hits.forEach(function (h) { total += h.length; best = Math.max(best, h.length); });
    return total + best;
  }
  // he talks like a Najdi host: «أبشر»، «سم»، «أنا بالخدمة»
  var OPEN = ['أبشر، ', 'سم، ', 'أبشر بعزّك، ', 'من عيوني، ', 'أبشر بسعدك، '];
  var CLOSE = [' وأنا بالخدمة.', ' تامر على شي ثاني؟', ' وإذا تبي زود قل لي، أنا بالخدمة.', ' وأي سؤال ثاني أبشر.', ' سم، وش تبي تعرف بعد؟'];
  var turn = 0;
  function najdi(a) {
    turn++;
    return { ar: OPEN[turn % OPEN.length] + a.ar + CLOSE[(turn * 3) % CLOSE.length], en: a.en };
  }
  function answer(text) {
    var q = norm(text);
    var bestKB = null, bestS = 0;
    KB.forEach(function (e) { var s = score(q, e.k.concat([L(e.title)])); if (s > bestS) { bestS = s; bestKB = e; } });
    var bestT = null, bestTS = 0;
    Object.keys(TALK).forEach(function (k) { var s = score(q, TALK[k].k); if (s > bestTS) { bestTS = s; bestT = TALK[k]; } });
    // a greeting with a real question in it: return the greeting, then answer the question
    if (bestKB && bestS >= 4) {
      var a = najdi(bestKB.a);
      if (bestT === TALK.hello) a = { ar: 'وعليكم السلام وهلا والله! ' + a.ar, en: 'Peace be upon you too! ' + a.en };
      return { a: a, e: bestKB };
    }
    if (bestT && bestTS >= 2) return { a: bestT.a, e: null, starters: true };
    return { a: UNKNOWN, e: null, starters: true };
  }

  // ════════════════════════════════════════════════════════════
  // THE NAJDI MAN — white ghutra, black agal, thobe (drawn here, no image files)
  // ════════════════════════════════════════════════════════════
  // each copy gets its own gradient ids (a hidden copy would otherwise take the gradients with it)
  var MAN_SRC = '<svg class="ng-man" viewBox="0 0 240 280" aria-hidden="true">' +
    '<defs>' +
    '<radialGradient id="ngSkin" cx="45%" cy="38%" r="70%"><stop offset="0" stop-color="#D9A57A"/><stop offset=".6" stop-color="#C48C60"/><stop offset="1" stop-color="#A06E48"/></radialGradient>' +
    '<linearGradient id="ngNeck" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8E5F3D"/><stop offset="1" stop-color="#B37E56"/></linearGradient>' +
    '<linearGradient id="ngCloth" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFFFFF"/><stop offset=".55" stop-color="#F4F1EA"/><stop offset="1" stop-color="#DAD4C7"/></linearGradient>' +
    '<linearGradient id="ngClothR" x1="1" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F7F5EF"/><stop offset=".6" stop-color="#E9E5DB"/><stop offset="1" stop-color="#CFC8B9"/></linearGradient>' +
    '<linearGradient id="ngThobe" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FBFAF6"/><stop offset="1" stop-color="#E2DDD1"/></linearGradient>' +
    '<linearGradient id="ngAgal" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4A4A4A"/><stop offset=".35" stop-color="#151515"/><stop offset="1" stop-color="#050505"/></linearGradient>' +
    '<radialGradient id="ngBeard" cx="50%" cy="30%" r="80%"><stop offset="0" stop-color="#33261C"/><stop offset="1" stop-color="#17110C"/></radialGradient>' +
    '<radialGradient id="ngIris" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#5A3A22"/><stop offset="1" stop-color="#24160D"/></radialGradient>' +
    '</defs>' +
    '<path d="M18 280 C22 236 44 212 86 202 L120 210 L154 202 C196 212 218 236 222 280 Z" fill="url(#ngThobe)"/>' +
    '<path d="M60 236 C70 250 72 266 70 280" stroke="#D8D2C4" stroke-width="2" fill="none"/>' +
    '<path d="M180 236 C170 250 168 266 170 280" stroke="#D8D2C4" stroke-width="2" fill="none"/>' +
    '<path d="M72 84 C56 126 50 176 40 230 C60 228 82 218 96 206 C90 172 86 138 90 108 Z" fill="url(#ngCloth)"/>' +
    '<path d="M168 84 C184 126 190 176 200 230 C180 228 158 218 144 206 C150 172 154 138 150 108 Z" fill="url(#ngClothR)"/>' +
    '<path d="M66 128 C62 160 58 192 50 222" stroke="#DCD6C9" stroke-width="2" fill="none"/>' +
    '<path d="M80 150 C78 176 76 196 72 216" stroke="#E4DFD3" stroke-width="1.6" fill="none"/>' +
    '<path d="M174 128 C178 160 182 192 190 222" stroke="#D2CBBC" stroke-width="2" fill="none"/>' +
    '<path d="M160 150 C162 176 164 196 168 216" stroke="#DAD3C5" stroke-width="1.6" fill="none"/>' +
    '<path d="M74 96 C70 140 78 186 98 206 L142 206 C162 186 170 140 166 96 Z" fill="#CBC3B1"/>' +
    '<path d="M102 162 L138 162 L140 204 C131 212 109 212 100 204 Z" fill="url(#ngNeck)"/>' +
    '<path d="M98 200 C108 208 132 208 142 200 L144 212 C132 220 108 220 96 212 Z" fill="#F2EEE5" stroke="#D3CCBD" stroke-width="1.2"/>' +
    '<path d="M120 214 L120 280" stroke="#D1CABB" stroke-width="2"/>' +
    '<circle cx="120" cy="226" r="2.4" fill="#C9C1AF"/><circle cx="120" cy="241" r="2.4" fill="#C9C1AF"/><circle cx="120" cy="256" r="2.4" fill="#C9C1AF"/>' +
    '<ellipse cx="80" cy="124" rx="6" ry="11" fill="#B07A51"/><ellipse cx="160" cy="124" rx="6" ry="11" fill="#B07A51"/>' +
    '<path d="M80 112 C80 82 98 70 120 70 C142 70 160 82 160 112 C160 142 152 166 120 174 C88 166 80 142 80 112 Z" fill="url(#ngSkin)"/>' +
    '<path d="M86 132 C92 150 104 162 120 166 C136 162 148 150 154 132" fill="none" stroke="#9E6C46" stroke-width="2" opacity=".35"/>' +
    '<path d="M82 126 C83 152 98 172 120 176 C142 172 157 152 158 126 C154 142 147 152 140 156 C134 150 127 147 120 147 C113 147 106 150 100 156 C93 152 86 142 82 126 Z" fill="url(#ngBeard)"/>' +
    '<path d="M102 144 C108 139 114 140 120 142 C126 140 132 139 138 144 C136 148 128 149 120 148 C112 149 104 148 102 144 Z" fill="#1B140E"/>' +
    '<g stroke="#4A382A" stroke-width=".8" opacity=".55"><path d="M92 150 l2 5"/><path d="M98 158 l1 5"/><path d="M106 163 l1 5"/><path d="M114 166 l0 5"/><path d="M126 166 l0 5"/><path d="M134 163 l-1 5"/><path d="M142 158 l-1 5"/><path d="M148 150 l-2 5"/></g>' +
    '<path class="ng-mouth-c" d="M110 154 Q120 157.5 130 154" stroke="#6B3326" stroke-width="2.4" fill="none" stroke-linecap="round"/>' +
    '<ellipse class="ng-mouth-o" cx="120" cy="155.5" rx="8" ry="5" fill="#3E1714"/>' +
    '<path d="M117 106 C116 118 112 128 113 133 C116 137 124 137 127 133" stroke="#93613D" stroke-width="2" fill="none" stroke-linecap="round"/>' +
    '<path d="M112 131 C114 134 117 135 119 134 M121 134 C123 135 126 134 128 131" stroke="#7E5132" stroke-width="1.4" fill="none"/>' +
    '<g class="ng-eyes">' +
    '<path d="M94 113 C98 108 108 108 112 113 C108 116 98 116 94 113 Z" fill="#F7F1E8"/>' +
    '<circle cx="103" cy="112.6" r="3.6" fill="url(#ngIris)"/><circle cx="104.2" cy="111.5" r="1" fill="#FFF"/>' +
    '<path d="M128 113 C132 108 142 108 146 113 C142 116 132 116 128 113 Z" fill="#F7F1E8"/>' +
    '<circle cx="137" cy="112.6" r="3.6" fill="url(#ngIris)"/><circle cx="138.2" cy="111.5" r="1" fill="#FFF"/>' +
    '<path d="M93 113 C98 107.5 108 107.5 113 113" stroke="#2A1C13" stroke-width="1.8" fill="none"/>' +
    '<path d="M127 113 C132 107.5 142 107.5 147 113" stroke="#2A1C13" stroke-width="1.8" fill="none"/>' +
    '</g>' +
    '<path d="M91 102 C97 97 106 97 113 100" stroke="#1E1610" stroke-width="3.6" fill="none" stroke-linecap="round"/>' +
    '<path d="M127 100 C134 97 143 97 149 102" stroke="#1E1610" stroke-width="3.6" fill="none" stroke-linecap="round"/>' +
    '<path d="M70 132 C62 82 86 44 120 42 C154 44 178 82 170 132 C168 112 164 98 158 90 C148 80 136 76 120 76 C104 76 92 80 82 90 C76 98 72 112 70 132 Z" fill="url(#ngCloth)"/>' +
    '<path d="M82 90 C92 82 106 78 120 78 C134 78 148 82 158 90" stroke="#E2DDD1" stroke-width="2" fill="none"/>' +
    '<path d="M112 78 L120 86 L128 78" fill="none" stroke="#E3DED2" stroke-width="1.6" stroke-linejoin="round"/>' +
    '<path d="M76 78 C84 66 96 58 110 56" stroke="#ECE8DF" stroke-width="2" fill="none"/>' +
    '<path d="M79 72 C93 61 147 61 161 72" stroke="url(#ngAgal)" stroke-width="7.5" fill="none" stroke-linecap="round"/>' +
    '<path d="M78 81 C93 70 147 70 162 81" stroke="url(#ngAgal)" stroke-width="7.5" fill="none" stroke-linecap="round"/>' +
    '<path d="M88 68 C102 62 138 62 152 68" stroke="#7A7A7A" stroke-width="1.1" fill="none" opacity=".6"/>' +
    '<path d="M87 77 C102 71 138 71 153 77" stroke="#7A7A7A" stroke-width="1.1" fill="none" opacity=".6"/>' +
    '</svg>';
  var manN = 0;
  function MANsvg() { var n = 'm' + (++manN); return MAN_SRC.replace(/id="ng(\w+)"/g, 'id="ng$1' + n + '"').replace(/url\(#ng(\w+)\)/g, 'url(#ng$1' + n + ')'); }

  // ════════════════════════════════════════════════════════════
  // LOOK
  // ════════════════════════════════════════════════════════════
  var CSS = '' +
    '#ng-btn{position:fixed;z-index:150;inset-inline-end:14px;bottom:calc(78px + env(safe-area-inset-bottom,0px));display:none;align-items:center;gap:8px;' +
    'background:#1D1813;color:#F3EEE6;border:1px solid rgba(226,174,127,.55);border-radius:999px;padding:6px 16px 6px 6px;font:inherit;font-weight:700;font-size:14px;cursor:pointer;box-shadow:0 10px 28px rgba(0,0,0,.4)}' +
    'html[dir="rtl"] #ng-btn{padding:6px 6px 6px 16px}' +
    '#ng-btn.show{display:inline-flex}#ng-btn .ng-face{width:40px;height:40px;border-radius:50%;background:#2B221A;overflow:hidden;flex:none}' +
    '#ng-btn .ng-face svg{width:100%;height:100%;transform:scale(1.5) translateY(9%)}' +
    '#ng-panel{position:fixed;z-index:2147482000;top:0;bottom:0;inset-inline-end:0;width:min(420px,100vw);background:#14100D;color:#F3EEE6;display:flex;flex-direction:column;' +
    'transform:translateX(105%);transition:transform .28s ease;box-shadow:-12px 0 40px rgba(0,0,0,.45);font-family:var(--font-ui,"IBM Plex Sans Arabic",system-ui,sans-serif)}' +
    'html[dir="rtl"] #ng-panel{transform:translateX(-105%)}#ng-panel.open{transform:none!important}' +
    '#ng-panel *{box-sizing:border-box}' +
    '.ng-head{display:flex;align-items:center;gap:10px;padding:calc(12px + env(safe-area-inset-top,0px)) 14px 10px;border-bottom:1px solid rgba(243,238,230,.1)}' +
    '.ng-head .ng-face{width:44px;height:44px;border-radius:50%;background:#2B221A;overflow:hidden;flex:none}.ng-head .ng-face svg{width:100%;height:100%;transform:scale(1.5) translateY(9%)}' +
    '.ng-head b{display:block;font-size:16px}.ng-head small{color:rgba(243,238,230,.6);font-size:12.5px}.ng-head .ng-x{margin-inline-start:auto;background:rgba(243,238,230,.08);border:1px solid rgba(243,238,230,.18);color:#F3EEE6;border-radius:999px;width:36px;height:36px;font-size:16px;cursor:pointer}' +
    '.ng-tabs{display:flex;gap:6px;padding:10px 14px}.ng-tabs button{flex:1;background:transparent;color:#F3EEE6;border:1px solid rgba(243,238,230,.22);border-radius:999px;padding:9px;font:inherit;font-weight:700;font-size:14px;cursor:pointer}' +
    '.ng-tabs button.on{background:#C98A55;color:#1A120B;border-color:#C98A55}' +
    '.ng-chat{flex:1;overflow-y:auto;padding:6px 14px 10px;display:flex;flex-direction:column;gap:10px}' +
    '.ng-msg{max-width:88%;padding:10px 13px;border-radius:16px;line-height:1.75;font-size:15px;white-space:pre-wrap}' +
    '.ng-msg.bot{background:#1D1813;border:1px solid rgba(226,174,127,.25);align-self:flex-start}.ng-msg.me{background:#C98A55;color:#1A120B;align-self:flex-end;font-weight:600}' +
    '.ng-msg a.ng-try{display:inline-block;margin-top:8px;background:rgba(201,138,85,.18);color:#E2AE7F;border:1px solid rgba(226,174,127,.5);border-radius:999px;padding:5px 12px;font-size:13px;font-weight:700;text-decoration:none}' +
    '.ng-chips{display:flex;flex-wrap:wrap;gap:6px;align-self:flex-start}.ng-chips button{background:transparent;color:#E2AE7F;border:1px solid rgba(226,174,127,.45);border-radius:999px;padding:6px 11px;font:inherit;font-size:13px;cursor:pointer}' +
    '.ng-form{display:flex;gap:8px;padding:10px 14px calc(12px + env(safe-area-inset-bottom,0px));border-top:1px solid rgba(243,238,230,.1)}' +
    '.ng-form input{flex:1;min-width:0;background:#1D1813;color:#F3EEE6;border:1px solid rgba(243,238,230,.2);border-radius:999px;padding:11px 15px;font:inherit;font-size:15px}' +
    '.ng-form button{background:#C98A55;color:#1A120B;border:0;border-radius:999px;padding:0 16px;font:inherit;font-weight:800;cursor:pointer}' +
    '.ng-talk{flex:1;display:none;flex-direction:column;align-items:center;justify-content:flex-start;padding:4px 18px 10px;overflow-y:auto;text-align:center}' +
    '#ng-panel.talk .ng-talk{display:flex}#ng-panel.talk .ng-chat{display:none}' +
    '.ng-stage{width:min(250px,62vw);aspect-ratio:240/280;border-radius:22px;background:radial-gradient(circle at 50% 38%,#3A2C1F,#1D1813 70%);border:1px solid rgba(226,174,127,.3);overflow:hidden;flex:none;position:relative}' +
    '.ng-stage svg{width:100%;height:100%;display:block}' +
    '.ng-man .ng-mouth-o{opacity:0}.ng-man.open .ng-mouth-o{opacity:1}.ng-man.open .ng-mouth-c{opacity:0}' +
    '.ng-man.half .ng-mouth-o{opacity:1;transform:scaleY(.5);transform-box:fill-box;transform-origin:center}.ng-man.half .ng-mouth-c{opacity:0}' +
    '.ng-man .ng-eyes{transform-box:fill-box;transform-origin:center;animation:ngBlink 4.6s infinite}' +
    '@keyframes ngBlink{0%,94%,100%{transform:scaleY(1)}96%{transform:scaleY(.08)}}' +
    '.ng-stage.speaking{box-shadow:0 0 0 4px rgba(201,138,85,.25)}.ng-stage.listening{box-shadow:0 0 0 4px rgba(126,224,138,.35)}' +
    '.ng-said{min-height:1.6em;margin:12px 0 4px;color:rgba(243,238,230,.65);font-size:14px}.ng-reply{font-size:16.5px;line-height:1.8;margin:2px 0 10px;font-weight:600}' +
    '.ng-mic{width:76px;height:76px;border-radius:50%;border:0;background:#C98A55;color:#1A120B;font-size:30px;cursor:pointer;flex:none;box-shadow:0 8px 24px rgba(0,0,0,.4)}' +
    '.ng-mic.on{background:#7EE08A;animation:ngPulse 1.2s infinite}@keyframes ngPulse{50%{box-shadow:0 0 0 12px rgba(126,224,138,0)}}' +
    '.ng-hint{color:rgba(243,238,230,.55);font-size:13px;margin-top:8px}' +
    '#ng-panel.talk .ng-form{display:flex}';

  var PANEL = '<div class="ng-head"><span class="ng-face">' + MANsvg() + '</span><div><b id="ng-title"></b><small id="ng-sub"></small></div>' +
    '<button class="ng-x" id="ng-x" type="button" aria-label="Close">✕</button></div>' +
    '<div class="ng-tabs"><button type="button" id="ng-t-chat" class="on"></button><button type="button" id="ng-t-talk"></button></div>' +
    '<div class="ng-chat" id="ng-chat" aria-live="polite"></div>' +
    '<div class="ng-talk"><div class="ng-stage" id="ng-stage">' + MANsvg() + '</div>' +
    '<div class="ng-said" id="ng-said"></div><div class="ng-reply" id="ng-reply"></div>' +
    '<button class="ng-mic" id="ng-mic" type="button" aria-label="Talk">🎙</button><div class="ng-hint" id="ng-hint"></div></div>' +
    '<form class="ng-form" id="ng-form"><input id="ng-in" autocomplete="off"><button type="submit" id="ng-send"></button></form>';

  var TXT = {
    btn: { ar: 'اسأل دليل نجد', en: 'Ask about Najd' },
    title: { ar: 'دليلك في نجد', en: 'Your Najd guide' },
    sub: { ar: 'سم، أنا بالخدمة', en: 'Ask me about its history, people and food' },
    chat: { ar: '💬 اكتب له', en: '💬 Chat' },
    talk: { ar: '🗣 كلّمه', en: '🗣 Talk to him' },
    ph: { ar: 'سم، وش تبي تعرف عن نجد؟', en: 'Ask anything about Najd…' },
    send: { ar: 'إرسال', en: 'Send' },
    hello: { ar: 'هلا والله وغلا، وحيّاك الله في نجد! أنا دليلك فيها وبالخدمة. سم، وش تبي تعرف؟ اسألني عن تاريخها، أكلها، قهوتها، فنونها، أو قل لي وين تبي تروح.', en: 'Welcome to Najd! I am your guide here. Ask me about its history, food, coffee, folk arts, or where to go.' },
    tapMic: { ar: 'اضغط الميكروفون وتكلّم، أو اكتب تحت', en: 'Tap the microphone and speak, or type below' },
    listening: { ar: 'أسمعك… تكلّم', en: 'Listening… go ahead' },
    noMic: { ar: 'متصفحك ما يدعم الكلام. اكتب سؤالك تحت ويرد عليك بصوته.', en: 'Your browser does not support speech input. Type your question below and he will answer out loud.' },
    micDenied: { ar: 'ما قدرت أسمعك. اسمح للمتصفح يستخدم الميكروفون، أو اكتب سؤالك تحت.', en: 'I could not hear you. Allow microphone access, or type your question below.' },
    you: { ar: 'سألت: ', en: 'You asked: ' },
    tryIt: { ar: 'جرّبها بنفسك ←', en: 'Try it yourself →' }
  };

  // ════════════════════════════════════════════════════════════
  // BUILD
  // ════════════════════════════════════════════════════════════
  var st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
  var btn = document.createElement('button'); btn.id = 'ng-btn'; btn.type = 'button'; document.body.appendChild(btn);
  var panel = document.createElement('aside'); panel.id = 'ng-panel'; panel.setAttribute('aria-hidden', 'true'); panel.innerHTML = PANEL; document.body.appendChild(panel);
  var chat = $('#ng-chat', panel), input = $('#ng-in', panel), stage = $('#ng-stage', panel), man = $('.ng-man', stage);
  var mode = 'chat', greeted = false;

  function labels() {
    btn.innerHTML = '<span class="ng-face">' + MANsvg() + '</span><span>' + L(TXT.btn) + '</span>';
    $('#ng-title', panel).textContent = L(TXT.title); $('#ng-sub', panel).textContent = L(TXT.sub);
    $('#ng-t-chat', panel).textContent = L(TXT.chat); $('#ng-t-talk', panel).textContent = L(TXT.talk);
    input.placeholder = L(TXT.ph); $('#ng-send', panel).textContent = L(TXT.send);
    $('#ng-hint', panel).textContent = SR ? L(TXT.tapMic) : L(TXT.noMic);
  }

  function bubble(cls, html) { var d = document.createElement('div'); d.className = 'ng-msg ' + cls; d.innerHTML = html; chat.appendChild(d); chat.scrollTop = chat.scrollHeight; return d; }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function chips(ids) {
    var c = document.createElement('div'); c.className = 'ng-chips';
    ids.forEach(function (id) {
      var e = KB.filter(function (x) { return x.id === id; })[0]; if (!e) return;
      var b = document.createElement('button'); b.type = 'button'; b.textContent = L(e.title);
      b.onclick = function () { ask(L(e.title)); }; c.appendChild(b);
    });
    chat.appendChild(c); chat.scrollTop = chat.scrollHeight;
  }

  function ask(text) {
    text = String(text || '').trim(); if (!text) return;
    var r = answer(text), reply = L(r.a);
    bubble('me', esc(text));
    var html = esc(reply);
    if (r.e && r.e.page) html += '<br><a class="ng-try" href="' + r.e.page + '">' + L(TXT.tryIt) + '</a>';
    bubble('bot', html);
    if (r.starters) chips(STARTERS); else if (r.e && r.e.rel) chips(r.e.rel);
    if (mode === 'talk') {
      $('#ng-said', panel).textContent = L(TXT.you) + text;
      $('#ng-reply', panel).textContent = reply;
      speak(reply);
    }
  }

  // ════════════════════════════════════════════════════════════
  // VOICE — he speaks (speech synthesis, mouth moves) and listens (speech recognition)
  // ════════════════════════════════════════════════════════════
  var flap = 0;
  function pickVoice() {
    if (!('speechSynthesis' in window)) return null;
    var vs = speechSynthesis.getVoices(), want = isAr() ? 'ar' : 'en';
    var mine = vs.filter(function (v) { return v.lang && v.lang.toLowerCase().indexOf(want) === 0; });
    var male = /maged|naayf|tarik|hamed|fahed|majed|male|daniel|alex|fred|guy|david/i;
    return mine.filter(function (v) { return male.test(v.name); })[0] || mine.filter(function (v) { return /sa/i.test(v.lang); })[0] || mine[0] || null;
  }
  function mouth(on) {
    clearInterval(flap); man.classList.remove('open', 'half');
    stage.classList.toggle('speaking', !!on);
    if (!on) return;
    flap = setInterval(function () {
      var r = Math.random(); man.classList.remove('open', 'half');
      if (r > 0.55) man.classList.add('open'); else if (r > 0.2) man.classList.add('half');
    }, 120);
  }
  function speak(text) {
    stopListen();
    if (!('speechSynthesis' in window)) { mouth(true); setTimeout(function () { mouth(false); }, Math.min(9000, 600 + text.length * 55)); return; }
    try {
      speechSynthesis.cancel();
      var u = new SpeechSynthesisUtterance(text), v = pickVoice();
      if (v) u.voice = v; u.lang = v ? v.lang : (isAr() ? 'ar-SA' : 'en-US'); u.rate = 0.95; u.pitch = 0.9;
      var guard = setTimeout(function () { mouth(false); }, Math.min(30000, 1500 + text.length * 90));
      u.onstart = function () { mouth(true); };
      u.onend = u.onerror = function () { clearTimeout(guard); mouth(false); };
      mouth(true); speechSynthesis.speak(u);
    } catch (e) { mouth(false); }
  }
  function hush() { try { speechSynthesis.cancel(); } catch (e) {} mouth(false); }

  var SR = window.SpeechRecognition || window.webkitSpeechRecognition, rec = null, listening = false;
  function stopListen() { if (rec && listening) { try { rec.stop(); } catch (e) {} } listening = false; $('#ng-mic', panel).classList.remove('on'); stage.classList.remove('listening'); }
  function listen() {
    if (!SR) { $('#ng-hint', panel).textContent = L(TXT.noMic); input.focus(); return; }
    if (listening) { stopListen(); return; }
    hush();
    rec = new SR(); rec.lang = isAr() ? 'ar-SA' : 'en-US'; rec.interimResults = true; rec.maxAlternatives = 1; rec.continuous = false;
    var final = '';
    rec.onresult = function (e) {
      var t = ''; for (var i = e.resultIndex; i < e.results.length; i++) { t += e.results[i][0].transcript; if (e.results[i].isFinal) final += e.results[i][0].transcript; }
      $('#ng-said', panel).textContent = L(TXT.you) + (final || t);
    };
    rec.onerror = function (e) { if (e && (e.error === 'not-allowed' || e.error === 'service-not-allowed')) $('#ng-hint', panel).textContent = L(TXT.micDenied); };
    rec.onend = function () { var was = listening; stopListen(); $('#ng-hint', panel).textContent = L(TXT.tapMic); if (was && final.trim()) ask(final); };
    try { rec.start(); listening = true; $('#ng-mic', panel).classList.add('on'); stage.classList.add('listening'); $('#ng-hint', panel).textContent = L(TXT.listening); }
    catch (e) { listening = false; }
  }

  // ════════════════════════════════════════════════════════════
  // OPEN, CLOSE, MODES
  // ════════════════════════════════════════════════════════════
  function setMode(m) {
    mode = m; panel.classList.toggle('talk', m === 'talk');
    $('#ng-t-chat', panel).classList.toggle('on', m === 'chat'); $('#ng-t-talk', panel).classList.toggle('on', m === 'talk');
    if (m === 'talk') {
      if (!$('#ng-reply', panel).textContent) { $('#ng-reply', panel).textContent = L(TXT.hello); speak(L(TXT.hello)); }
    } else { stopListen(); hush(); }
  }
  function open() {
    panel.classList.add('open'); panel.setAttribute('aria-hidden', 'false'); btn.classList.remove('show');
    if (!greeted) { greeted = true; bubble('bot', esc(L(TXT.hello))); chips(STARTERS); }
    if (mode === 'chat') setTimeout(function () { input.focus(); }, 300);
  }
  function close() { panel.classList.remove('open'); panel.setAttribute('aria-hidden', 'true'); stopListen(); hush(); }

  btn.addEventListener('click', open);
  $('#ng-x', panel).addEventListener('click', close);
  $('#ng-t-chat', panel).addEventListener('click', function () { setMode('chat'); });
  $('#ng-t-talk', panel).addEventListener('click', function () { setMode('talk'); });
  $('#ng-mic', panel).addEventListener('click', listen);
  $('#ng-form', panel).addEventListener('submit', function (e) { e.preventDefault(); var t = input.value; input.value = ''; ask(t); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && panel.classList.contains('open')) close(); });

  // the button shows only in Najd, when the map is closed
  function inNajd() { return document.body.getAttribute('data-region') === 'najd' && !document.body.classList.contains('map-open'); }
  function refresh() {
    var ok = inNajd();
    btn.classList.toggle('show', ok && !panel.classList.contains('open'));
    if (!ok && panel.classList.contains('open')) close();
  }
  new MutationObserver(refresh).observe(document.body, { attributes: true, attributeFilter: ['data-region', 'class'] });
  document.addEventListener('languageChanged', function () { labels(); });
  if ('speechSynthesis' in window) { try { speechSynthesis.getVoices(); speechSynthesis.onvoiceschanged = function () {}; } catch (e) {} }
  labels(); refresh();
  // a direct link (?guide=1) goes straight to Najd with the guide open, e.g. to share it for testing
  if (/[?&]guide=1/.test(location.search)) setTimeout(function () {
    if (!inNajd() && window.ThemeManager && window.ThemeManager.selectRegion) window.ThemeManager.selectRegion('najd');
    setTimeout(function () { if (inNajd()) { open(); if (/[?&]talk=1/.test(location.search)) setMode('talk'); } }, 300);
  }, 700);
  window.__najdGuide = { open: open, close: close, ask: ask, answer: answer, setMode: setMode, KB: KB };
})();
