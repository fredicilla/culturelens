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
      a: { ar: 'الرياض عاصمة المملكة وأكبر مدن نجد، واسمها القديم «حَجْر»، واسمها الحين جمع «روضة» وهي الأرض الخضراء اللي يجتمع فيها الماي. صارت عاصمة من سنة ١٨٢٤م مع الإمام تركي بن عبدالله. فيها قصر المصمك والمتحف الوطني، وجنبها الدرعية ووادي حنيفة.',
           en: 'Riyadh is the capital of the Kingdom and the largest city in Najd; its old name was Hajr. It became the capital in 1824 under Imam Turki bin Abdullah. Its name is the plural of "rawdah", a green meadow where rainwater gathers. It has Al-Masmak Fort and the National Museum, with Diriyah and Wadi Hanifa right next to it.' },
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
      a: { ar: 'قصر المصمك حصن من الطين واللبن في وسط الرياض القديمة، بدأ بناؤه سنة ١٨٦٥م (١٢٨٢هـ) في عهد الإمام عبدالله بن فيصل، وله أربعة أبراج وباب خشبي كبير. شهد استرداد الملك عبدالعزيز للرياض فجر ٥ شوال ١٣١٩هـ (١٩٠٢م)، وتقدر تشوف رأس الحربة المكسور في بابه للحين. وصار متحف من سنة ١٩٩٥م.',
           en: 'Al-Masmak is a mud-brick fort in the heart of old Riyadh, begun in 1865 (1282 AH) under Imam Abdullah bin Faisal, with four towers and a great wooden gate. It saw King Abdulaziz take back Riyadh at dawn in 1902 (1319 AH); the broken spearhead is still lodged in its door. It has been a museum since 1995.' },
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
      k: ['اكلات', 'أكلات', 'اكل', 'أكل', 'طبخ', 'وجبه', 'وجبة', 'الاكلات الشعبيه', 'الاكل الشعبي', 'وش ناكل', 'وش اكل', 'food', 'dish', 'eat', 'dishes'],
      a: { ar: 'من أشهر أكلات نجد: الكبسة، والجريش (قمح مجروش يُطبخ باللبن أو المرق)، والقرصان والمرقوق والمطازيز (عجين يُطبخ بمرق اللحم والخضار)، والحنيني في الشتاء (خبز وتمر وسمن)، والكليجا من القصيم.',
           en: 'Some of Najd\'s best-known dishes: kabsa, jareesh (cracked wheat cooked with buttermilk or broth), qursan, marqooq and matazeez (dough cooked in a meat and vegetable stew), haneeni in winter (bread, dates and ghee), and kleija from Al-Qassim.' },
      rel: ['kleija', 'dates', 'coffee'] },

    { id: 'kleija', title: { ar: 'الكليجا', en: 'Kleija' },
      k: ['الكليجا', 'كليجا', 'كليجه', 'kleija', 'kleicha'],
      a: { ar: 'الكليجا قرص من عجين البر محشي بالتمر أو دبس التمر والهيل، يُخبز ويُقدَّم مع القهوة. تشتهر فيها القصيم، ولها مهرجان سنوي في بريدة، واختارتها هيئة فنون الطهي سنة ٢٠٢٤م «طبق منطقة القصيم».',
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
      k: ['اماكن', 'أماكن', 'مكان', 'وين اروح', 'وين أروح', 'سياحه', 'سياحة', 'ازور', 'أزور', 'زياره', 'معالم', 'وين نروح', 'places', 'visit', 'tourism', 'where to go', 'where should i go', 'go'],
      a: { ar: 'قل لي وين تبي تروح وأنا بالخدمة! وإذا جيت نجد لا يفوتك: حي الطريف والبجيري في الدرعية، وقصر المصمك والمتحف الوطني في الرياض، و«طرف العالم» على جبال طويق، وقرية أشيقر التراثية، وشقراء القديمة، ووادي حنيفة، وسوق التمور في بريدة.',
           en: 'If you come to Najd, don\'t miss: At-Turaif and Al-Bujairi in Diriyah, Al-Masmak Fort and the National Museum in Riyadh, the "Edge of the World" on the Tuwaiq escarpment, the heritage village of Ushaiger, old Shaqra, Wadi Hanifa, and the date market in Buraydah.' },
      rel: ['diriyah', 'masmak', 'nature'] },

    { id: 'nature', title: { ar: 'طبيعة نجد وجوها', en: 'Land and weather' },
      k: ['الطبيعه', 'الطبيعة', 'طبيعه', 'الجو', 'جو', 'الطقس', 'طقس', 'حر', 'برد', 'مطر', 'الشتاء', 'شتاء', 'الصيف', 'صيف', 'طويق', 'جبال طويق', 'صحراء', 'الجو في', 'جو الرياض', 'طقس الرياض', 'جو نجد', 'weather', 'climate', 'nature', 'tuwaiq', 'desert', 'winter', 'summer'],
      a: { ar: 'نجد هضبة صحراوية تقطعها جبال طويق ووديان مثل وادي حنيفة. الصيف حار وجاف، والشتاء ليله بارد، والربيع بعد المطر تخضر فيه الروضات، وهو أحلى وقت للكشتة.',
           en: 'Najd is a desert plateau crossed by the Tuwaiq escarpment and valleys like Wadi Hanifa. Summers are hot and dry and winter nights are cold; in spring, after the rain, the meadows turn green, the best time for a desert outing.' },
      rel: ['places', 'najd'] },

    { id: 'kabsa', title: { ar: 'الكبسة', en: 'Kabsa' },
      k: ['الكبسه', 'الكبسة', 'كبسه', 'كبسة', 'كبسات', 'kabsa', 'kabsah'],
      a: { ar: 'الكبسة رز مطبوخ مع اللحم أو الدجاج والبهارات، وهي أشهر طبق في نجد والمملكة. تُطبخ في قدر واحد، وتُقدَّم على صينية كبيرة يتجمّع عليها الأهل والضيوف.',
           en: 'Kabsa is rice cooked with meat or chicken and spices, the best-known dish in Najd and the whole Kingdom. It is cooked in one pot and served on a large tray that the family and guests gather around.' },
      rel: ['food', 'jareesh', 'hospitality'] },

    { id: 'jareesh', title: { ar: 'الجريش', en: 'Jareesh' },
      k: ['الجريش', 'جريش', 'jareesh', 'jarish'],
      a: { ar: 'الجريش قمح مجروش يُطبخ على نار هادية مع اللبن أو المرق حتى يصير ناعم، ويُزيَّن بالبصل المحمّر والسمن. أكلة نجدية أصيلة، وتنحب في رمضان والشتاء.',
           en: 'Jareesh is cracked wheat slow-cooked with buttermilk or broth until soft, topped with fried onions and ghee. It is a true Najdi dish, loved in Ramadan and in winter.' },
      rel: ['food', 'qursan', 'kabsa'] },

    { id: 'qursan', title: { ar: 'القرصان والمرقوق والمطازيز', en: 'Qursan, marqooq and matazeez' },
      k: ['القرصان', 'قرصان', 'المرقوق', 'مرقوق', 'المطازيز', 'مطازيز', 'qursan', 'marqooq', 'matazeez'],
      a: { ar: 'ثلاث أكلات نجدية من العجين والمرق: القرصان خبز رقيق يُقطّع ويُطبخ بمرق اللحم والخضار، والمرقوق عجين يُرقّق ويُطبخ في المرق مع اللحم والكوسة والقرع، والمطازيز قطع عجين مربعة تُطبخ بنفس الطريقة.',
           en: 'Three Najdi dishes of dough and stew: qursan is thin bread torn and cooked in meat and vegetable broth; marqooq is rolled-out dough cooked in the stew with meat, zucchini and squash; and matazeez are small squares of dough cooked the same way.' },
      rel: ['food', 'jareesh', 'haneeni'] },

    { id: 'haneeni', title: { ar: 'الحنيني', en: 'Haneeni' },
      k: ['الحنيني', 'حنيني', 'haneeni'],
      a: { ar: 'الحنيني حلا نجدي شتوي: خبز البر يُفتّ ويُخلط مع التمر والسمن ويُرشّ عليه الهيل والزعفران. يدفّي في البرد ويُقدَّم مع القهوة.',
           en: 'Haneeni is a Najdi winter sweet: wheat bread crumbled and mixed with dates and ghee, finished with cardamom and saffron. It warms you in the cold and is served with coffee.' },
      rel: ['dates', 'food', 'coffee'] },

    { id: 'coffeeHow', title: { ar: 'كيف تسوي القهوة', en: 'How to make the coffee' },
      k: ['كيف اسوي القهوه', 'كيف تسوي القهوه', 'طريقه القهوه', 'طريقة القهوة', 'تحضير القهوه', 'اسوي قهوه', 'اطبخ القهوه', 'make coffee', 'brew coffee', 'coffee recipe'],
      a: { ar: 'الطريقة: تحمّس البن على النار لين يصير ذهبي، وتدقّه بالنجر، وتغلي الماي بالدلة، وتحط البن وتخليه يفور على نار هادية، بعدها تحط الهيل المدقوق (ومن يحب يزيد زعفران أو قرنفل)، وتخليها تركد شوي، وتصبها وتقدّمها مع التمر.',
           en: 'Roast the beans over the fire until golden, pound them in the najr, boil water in the dallah, add the coffee and let it simmer gently, then add crushed cardamom (and saffron or cloves if you like). Let it settle a moment, pour, and serve it with dates.' },
      rel: ['coffeeEtiquette', 'coffee', 'dates'], page: 'qahwa.html' },

    { id: 'wadiHanifa', title: { ar: 'وادي حنيفة', en: 'Wadi Hanifa' },
      k: ['وادي حنيفه', 'وادي حنيفة', 'حنيفه', 'حنيفة', 'wadi hanifa', 'hanifa'],
      a: { ar: 'وادي حنيفة من أشهر أودية نجد، يمتد أكثر من ١٢٠ كيلو ويمر بالدرعية والرياض، وعلى ضفافه قامت الدرعية. واليوم صار متنزه طبيعي فيه ممشى ومزارع نخل.',
           en: 'Wadi Hanifa is one of the best-known valleys of Najd. It runs for more than 120 km past Diriyah and Riyadh, and Diriyah was built on its banks. Today it is a natural park with walking trails and palm groves.' },
      rel: ['diriyah', 'riyadh', 'nature'] },

    { id: 'edge', title: { ar: 'طرف العالم', en: 'The Edge of the World' },
      k: ['طرف العالم', 'حافه العالم', 'حافة العالم', 'جبل الفهرين', 'الفهرين', 'edge of the world'],
      a: { ar: 'طرف العالم جزء من جبال طويق، شمال غرب الرياض بحوالي ١٠٠ كيلو. فيه منحدرات صخرية عالية تطل على سهل واسع، والمنظر وقت الغروب ما ينوصف. أحلى وقت تروحه الشتاء والربيع، وخذ معك ماي وسيارة تتحمل الطريق.',
           en: 'The Edge of the World is part of the Tuwaiq escarpment, about 100 km north-west of Riyadh. Tall cliffs drop to a wide plain, and the sunset there is unforgettable. Go in winter or spring, take water, and a car that can handle the track.' },
      rel: ['nature', 'places', 'ushaiger'] },

    { id: 'ushaiger', title: { ar: 'أشيقر وشقراء', en: 'Ushaiger and Shaqra' },
      k: ['اشيقر', 'أشيقر', 'شقراء', 'شقرا', 'الوشم', 'ushaiger', 'shaqra'],
      a: { ar: 'أشيقر بلدة تراثية قريبة من شقراء في منطقة الوشم، بيوتها الطينية ومساجدها وأزقتها القديمة محفوظة، وتقدر تتمشى فيها وتعيش جو نجد القديم. وشقراء نفسها فيها بلدة قديمة مرمّمة تستاهل الزيارة.',
           en: 'Ushaiger is a heritage village near Shaqra in the Al-Washm area. Its mud houses, mosques and old lanes are preserved, and you can walk through them and feel old Najd. Shaqra itself has a restored old town that is well worth a visit.' },
      rel: ['architecture', 'places', 'edge'] },

    { id: 'museum', title: { ar: 'المتحف الوطني', en: 'The National Museum' },
      k: ['المتحف الوطني', 'المتحف', 'متحف', 'مركز الملك عبدالعزيز التاريخي', 'museum', 'national museum'],
      a: { ar: 'المتحف الوطني في الرياض، داخل مركز الملك عبدالعزيز التاريخي، يحكي تاريخ الجزيرة العربية من القدم إلى توحيد المملكة. وقريب منه قصر المربع.',
           en: 'The National Museum in Riyadh, inside the King Abdulaziz Historical Center, tells the story of the Arabian Peninsula from ancient times to the unification of the Kingdom. Al-Murabba Palace is right next to it.' },
      rel: ['riyadh', 'masmak', 'unification'] },

    { id: 'secondState', title: { ar: 'الدولة السعودية الثانية', en: 'The second Saudi state' },
      k: ['الدوله السعوديه الثانيه', 'الدولة السعودية الثانية', 'الدوله الثانيه', 'تركي بن عبدالله', 'الامام تركي', 'سقوط الدرعيه', 'الدوله السعوديه الاولى', 'second saudi state', 'turki bin abdullah'],
      a: { ar: 'بعد سقوط الدرعية ونهاية الدولة السعودية الأولى سنة ١٨١٨م (١٢٣٣هـ)، أسس الإمام تركي بن عبدالله بن محمد بن سعود الدولة السعودية الثانية سنة ١٨٢٤م (١٢٤٠هـ)، ونقل الحكم إلى الرياض وصارت عاصمتها، واستمرت لين ١٨٩١م (١٣٠٩هـ).',
           en: 'After Diriyah fell and the first Saudi state ended in 1818 (1233 AH), Imam Turki bin Abdullah bin Muhammad bin Saud founded the second Saudi state in 1824 (1240 AH). He moved the seat of rule to Riyadh, which became its capital, and the state lasted until 1891 (1309 AH).' },
      rel: ['founding', 'riyadh', 'unification'] },

    { id: 'murabba', title: { ar: 'قصر المربع', en: 'Al-Murabba Palace' },
      k: ['المربع', 'قصر المربع', 'قصر الملك عبدالعزيز', 'murabba'],
      a: { ar: 'قصر المربع أول قصر يُبنى للملك عبدالعزيز برا أسوار الرياض القديمة. أمر ببنائه سنة ١٩٣٦م (١٣٥٥هـ) وانتقل له سنة ١٩٣٨م (١٣٥٧هـ)، وهو على الطراز النجدي بالطين وسعف النخل. منه صدرت قرارات مهمة مثل إصدار العملة وإنشاء سكة حديد الرياض والدمام، واليوم هو داخل مركز الملك عبدالعزيز التاريخي.',
           en: 'Al-Murabba was the first palace built for King Abdulaziz outside the old walls of Riyadh. He ordered it in 1936 (1355 AH) and moved in in 1938 (1357 AH). It is built in the Najdi style of mud and palm fronds, and key decisions such as issuing the currency and building the Riyadh-Dammam railway were made there. Today it stands inside the King Abdulaziz Historical Center.' },
      rel: ['museum', 'masmak', 'unification'] },

    { id: 'unaizah', title: { ar: 'عنيزة «باريس نجد»', en: 'Unaizah, "the Paris of Najd"' },
      k: ['عنيزه', 'عنيزة', 'باريس نجد', 'المسوكف', 'سوق المسوكف', 'بيت البسام', 'unaizah', 'paris of najd'],
      a: { ar: 'عنيزة من أكبر مدن القصيم، ولقّبها الأديب أمين الريحاني لما زارها سنة ١٣٤١هـ «باريس نجد» لجمالها ومزارعها وعلم أهلها وذوقهم. من معالمها سوق المسوكف الشعبي اللي انبنى من جديد على الطراز القديم سنة ٢٠٠٩م، وبيت البسام التراثي.',
           en: 'Unaizah is one of the largest towns in Al-Qassim. The writer Ameen Rihani, visiting in 1341 AH, called it "the Paris of Najd" for its beauty, its farms and the learning and taste of its people. Its sights include the Al-Musawkaf market, rebuilt in the old style in 2009, and the Al-Bassam heritage house.' },
      rel: ['qassim', 'kleija', 'samri'] },

    { id: 'sudair', title: { ar: 'سدير والمجمعة', en: 'Sudair and Al-Majma\'ah' },
      k: ['سدير', 'المجمعه', 'المجمعة', 'مجمعه', 'روضه سدير', 'روضة سدير', 'جلاجل', 'مرقب منيخ', 'الغاط', 'sudair', 'majmaah'],
      a: { ar: 'سدير شمال الرياض، فيها بلدات تراثية جميلة. في المجمعة البلدة القديمة المرمّمة ومرقب جبل منيخ اللي انبنى سنة ٨٣٠هـ وهو أقدم مبانيها، وفي روضة سدير بلدة تراثية من أقدم حواضر سدير على بعد حوالي ١٨٠ كيلو من الرياض، وجلاجل على منحدرات طويق، وقرية الغاط التراثية.',
           en: 'Sudair lies north of Riyadh and has lovely heritage towns: Al-Majma\'ah\'s restored old town and its Muneekh watchtower, built in 830 AH and the oldest building there; the heritage village of Rawdat Sudair, one of the oldest settlements in Sudair, about 180 km from Riyadh; Jalajil on the slopes of Tuwaiq; and the heritage village of Al-Ghat.' },
      rel: ['ushaiger', 'architecture', 'places'] },

    { id: 'souqs', title: { ar: 'الأسواق الشعبية', en: 'Old markets' },
      k: ['سوق', 'اسواق', 'أسواق', 'الاسواق الشعبيه', 'سوق الزل', 'الزل', 'سوق الموسم', 'تسوق', 'اتسوق', 'نتسوق', 'اشتري', 'وين اشتري', 'souq', 'market', 'shopping'],
      a: { ar: 'من أشهر أسواق نجد: سوق الزل جنب قصر المصمك في الرياض، من بداية القرن الرابع عشر الهجري، تلقى فيه السجاد والبشوت والمنتجات التراثية. وسوق المسوكف في عنيزة، وسوق التمور في بريدة. وفي الدرعية قديمًا كان سوق الموسم من أوائل أسواق نجد، تجيه القوافل من الهند والعراق واليمن.',
           en: 'Some of Najd\'s best-known markets: Souq Al-Zal next to Al-Masmak in Riyadh, running since the start of the 14th Hijri century, with carpets, bishts and traditional goods; Al-Musawkaf in Unaizah; and the date market in Buraydah. In old Diriyah, Souq Al-Mawsim was one of the first markets of Najd, visited by caravans from India, Iraq and Yemen.' },
      rel: ['masmak', 'unaizah', 'dates'] },

    { id: 'marasee', title: { ar: 'المراصيع وقرص عقيل', en: 'Marasee and Qurs Ogaili' },
      k: ['المراصيع', 'مراصيع', 'المصابيب', 'مصابيب', 'قرص عقيل', 'العقيلات', 'القشد', 'قشد', 'حلويات', 'حلا', 'marasee', 'masabeeb', 'sweets'],
      a: { ar: 'من حلويات نجد: المراصيع (وتسمى المصابيب) خليط من دقيق البر يختمر ويُصب على مقلاة حارة، ويُقدّم بالعسل أو الدبس والسمن. وقرص عقيل جابه رجال العقيلات من الشام وانتشر في نجد، وصار ثاني أكثر أكلة تنقدّم للزوار في القصيم بعد الكليجا. ومنها بعد الحنيني والقشد في الشتاء.',
           en: 'Najdi sweets include marasee (also called masabeeb): a wheat batter left to rise and poured onto a hot pan, served with honey or date syrup and ghee. Qurs Ogaili was brought from the Levant by the Ogailat traders and spread across Najd; in Al-Qassim it is the most offered treat to visitors after kleija. In winter there are also haneeni and qashd.' },
      rel: ['kleija', 'haneeni', 'food'] },

    { id: 'sadu', title: { ar: 'السدو', en: 'Al-Sadu weaving' },
      k: ['السدو', 'سدو', 'النسيج', 'الحياكه', 'بيت الشعر', 'sadu', 'weaving'],
      a: { ar: 'السدو نسيج تقليدي تحيكه نساء البادية من صوف الغنم ووبر الإبل وشعر الماعز، بنقوش هندسية ملوّنة، ومنه بيوت الشعر والمساند والزينة. وسجلته اليونسكو سنة ٢٠٢٠م في قائمة التراث غير المادي باسم المملكة والكويت.',
           en: 'Al-Sadu is the traditional weaving of Bedouin women, made from sheep\'s wool, camel hair and goat hair in bright geometric patterns, used for tents, cushions and decoration. UNESCO inscribed it in 2020 on its intangible heritage list for Saudi Arabia and Kuwait.' },
      rel: ['clothing', 'hospitality', 'architecture'], page: 'sadu.html' },

    { id: 'plants', title: { ar: 'نباتات نجد والربيع', en: 'Plants and spring' },
      k: ['النباتات', 'نباتات', 'نبات', 'الخزامى', 'خزامى', 'العرفج', 'عرفج', 'الطلح', 'طلح', 'السدر', 'الرمث', 'الربيع', 'ربيع', 'الكشته', 'الكشتة', 'كشته', 'plants', 'flowers', 'spring', 'lavender'],
      a: { ar: 'بعد أمطار الشتاء تخضر برّ نجد وتطلع الخزامى بلونها البنفسجي وريحتها، والعرفج بزهره الأصفر، والنفل والأقحوان. ومن أشجارها الطلح النجدي والسدر والرمث والأرطى. وهذا وقت الكشتة: يطلع الناس للبر ويخيّمون ويشبّون النار ويسوّون القهوة.',
           en: 'After the winter rains the Najdi desert turns green: wild lavender (khuzama) with its purple flowers and scent, arfaj with yellow blooms, clover and chamomile. Its trees include the Najdi talh acacia, sidr, rimth and arta. This is the season for kashta: people head to the desert to camp, light a fire and make coffee.' },
      rel: ['nature', 'edge', 'coffee'] },

    { id: 'masaqil', title: { ar: 'المصاقيل', en: 'Al-Masaqil' },
      k: ['المصاقيل', 'مصاقيل', 'الالعاب', 'الألعاب', 'العاب', 'لعبه', 'لعبة', 'games', 'game', 'marbles', 'masaqil'],
      a: { ar: 'المصاقيل لعبة شعبية من المنطقة الوسطى يلعبها الصغار في الحواري بحبيبات زجاج صغيرة: يرسمون مربع على الرمل ويصوّبون الحبيبات من بعيد، واللي يفوز ياخذ الحبيبات اللي في الحفرة.',
           en: 'Al-Masaqil is a folk game from the Central Region that children play in the alleys with small glass marbles: they draw a square in the sand and aim their marbles from a distance, and the winner takes the marbles in the hole.' },
      rel: ['samri', 'food'], page: 'masaqeel.html' }
  ];

  // small talk
  var TALK = {
    hello: { k: ['السلام عليكم', 'السلام', 'سلام', 'هلا', 'مرحبا', 'اهلين', 'أهلين', 'هاي', 'hello', 'hi', 'hey', 'salam'],
      a: { ar: 'وعليكم السلام ورحمة الله، هلا والله وغلا! أنا فهد، دليلك في نجد وبالخدمة. سم، وش تبي تعرف؟ عن تاريخها، أكلها، قهوتها، فنونها، أو قل لي وين تبي تروح.', en: 'Peace be upon you too, welcome! I am your guide to Najd. Ask me about its history, food, coffee, folk arts, or where to go.' } },
    howAreYou: { k: ['وش علومك', 'علومك', 'كيف حالك', 'كيفك', 'شلونك', 'كيف الحال', 'how are you'],
      a: { ar: 'علوم الخير، الله يسلمك! أنا بخير وبالخدمة. سم، وش تبي تعرف عن نجد؟', en: 'All good, thank you! I\'m here to help. What would you like to know about Najd?' } },
    thanks: { k: ['شكرا', 'شكراً', 'يعطيك العافيه', 'يعطيك العافية', 'مشكور', 'تسلم', 'thanks', 'thank you'],
      a: { ar: 'العفو، الله يحييك! أنا بالخدمة، تامر على شي ثاني؟', en: 'You\'re welcome! Ask me anything else about Najd.' } },
    who: { k: ['من انت', 'من أنت', 'وش انت', 'مين انت', 'وش اسمك', 'اسمك', 'who are you', 'your name'],
      a: { ar: 'أنا فهد، دليلك في نجد، وأنا بالخدمة. أعرّفك على تاريخها وناسها وأكلها وفنونها، سم اسأل وأبشر.', en: 'I am Fahad, your guide to Najd: its history, its people, its food and its folk arts. Ask away.' } },
    help: { k: ['وش تعرف', 'ساعدني', 'وش اسال', 'وش أسأل', 'help', 'what can you'],
      a: { ar: 'أبشر، أقدر أعلّمك عن: الدرعية ويوم التأسيس، الرياض والمصمك، القصيم وتمورها، القهوة وسنعها، العرضة والسامري، الأكلات، العمارة الطينية، اللبس، كلمات نجدية، ووين تروح.', en: 'I can tell you about: Diriyah and Founding Day, Riyadh and Al-Masmak, Al-Qassim and its dates, coffee and its manners, the Ardah and the Samri, food, mud-brick architecture, clothing, Najdi words, and where to go.' } }
  };
  var UNKNOWN = { ar: 'السموحة، هذي ما عندي فيها علم أكيد، وما أحب أقولك شي مو متأكد منه. بس سم، اسألني عن نجد: تاريخها، أكلها، قهوتها، فنونها، أو قل لي وين تبي تروح وأنا بالخدمة.',
                  en: 'I don\'t have reliable information on that, and I\'d rather not guess. Ask me about Najd: its history, food, coffee, folk arts, or where to go.' };
  var STARTERS = ['diriyah', 'food', 'coffeeHow', 'unaizah', 'places', 'plants'];

  // ── matching: Arabic is normalized (hamza forms, taa marbuta, alif maqsura, diacritics) ──
  // the same word can be written many ways: unify letters, drop diacritics, and turn other dialects' words into Najdi ones
  var SAME = { 'ايش': 'وش', 'شنو': 'وش', 'شو': 'وش', 'ماذا': 'وش', 'ما هي': 'وش', 'ما هو': 'وش', 'اكله': 'اكلات', 'اكلة': 'اكلات', 'مشهور': 'اشهر', 'مشهوره': 'اشهر' };
  var STOP = ['ابي', 'ابغى', 'ابغا', 'اعرف', 'عطني', 'عطنا', 'قول', 'قل', 'لي', 'خبرني', 'كلمني', 'تكلم', 'عن', 'في', 'من', 'على', 'الى', 'هل', 'لو', 'سمحت', 'يا', 'شي', 'شيء', 'معلومه', 'معلومات', 'tell', 'me', 'about', 'the', 'a', 'is', 'what', 'please', 'of', 'in'];
  function norm(s) {
    var t = (' ' + String(s || '').toLowerCase() + ' ')
      .replace(/[\u064B-\u0652\u0640]/g, '')
      .replace(/[إأآ]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي').replace(/ؤ/g, 'و').replace(/ئ/g, 'ي')
      .replace(/[٠-٩]/g, function (d) { return '٠١٢٣٤٥٦٧٨٩'.indexOf(d); })
      .replace(/[^\u0600-\u06FFa-z0-9 ]+/g, ' ').replace(/\s+/g, ' ');
    Object.keys(SAME).forEach(function (k) { t = t.split(' ' + k + ' ').join(' ' + SAME[k] + ' '); });
    return t;
  }
  function stripAl(t) { return t.indexOf('ال') === 0 && t.length > 4 ? t.slice(2) : t.replace(/^(و|ب|ل)ال/, ''); }
  // how many letters apart two words are (for typing mistakes)
  function dist(a, b) {
    if (Math.abs(a.length - b.length) > 2) return 9;
    var d = []; for (var i = 0; i <= a.length; i++) { d[i] = [i]; } for (var j = 1; j <= b.length; j++) d[0][j] = j;
    for (i = 1; i <= a.length; i++) for (j = 1; j <= b.length; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    return d[a.length][b.length];
  }
  // a keyword counts if it is in the question as a word or phrase, as the start of a word (لبس → لبسكم),
  // or as a word with a small typing mistake (الدرعيه → الدرعيا). Overlapping hits count once; longer hits weigh more.
  function score(q, words) {
    var toks = q.trim().split(' ').filter(function (t) { return t && STOP.indexOf(t) < 0; }).map(stripAl), seen = {}, hits = [];
    words.forEach(function (w) {
      var n = norm(w).trim(); if (!n || seen[n]) return; seen[n] = 1;
      var bare = stripAl(n), hit = 0;
      if (q.indexOf(' ' + n + ' ') >= 0 || (n.length >= 4 && q.indexOf(n) >= 0) || q.indexOf(' ' + bare + ' ') >= 0) hit = 1;
      else if (n.indexOf(' ') < 0 && bare.length >= 3) {
        toks.some(function (t) {
          if (t.indexOf(bare) === 0 && t.length - bare.length <= 3) { hit = 1; return true; }
          if (bare.length >= 5 && t.length >= 5 && dist(t, bare) <= (bare.length >= 8 ? 2 : 1)) { hit = 0.8; return true; }
          return false;
        });
      }
      if (hit) hits.push({ w: bare, v: bare.length * hit });
    });
    hits = hits.filter(function (h) { return !hits.some(function (o) { return o !== h && o.w.length > h.w.length && o.w.indexOf(h.w) >= 0; }); });
    var total = 0, best = 0; hits.forEach(function (h) { total += h.v; best = Math.max(best, h.v); });
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
    var ranked = KB.map(function (e) { return { e: e, s: score(q, e.k.concat([L(e.title)])) }; }).sort(function (a, b) { return b.s - a.s; });
    var bestKB = ranked[0].s > 0 ? ranked[0].e : null, bestS = ranked[0].s;
    var bestT = null, bestTS = 0;
    Object.keys(TALK).forEach(function (k) { var s = score(q, TALK[k].k); if (s > bestTS) { bestTS = s; bestT = TALK[k]; } });
    if (bestKB && bestS >= 4) {
      var a = najdi(bestKB.a);
      if (bestT === TALK.hello) a = { ar: 'وعليكم السلام وهلا والله! ' + a.ar, en: 'Peace be upon you too! ' + a.en };
      return { a: a, e: bestKB };
    }
    if (bestT && bestTS >= 2) return { a: bestT.a, e: null, starters: true };
    // a weak match: ask what they meant instead of guessing
    var near = ranked.filter(function (r) { return r.s >= 2; }).slice(0, 3).map(function (r) { return r.e.id; });
    if (near.length) return { a: { ar: 'سم، ما فهمت عليك زين. تقصد وحدة من هذي؟', en: 'Sorry, I did not quite get that. Did you mean one of these?' }, e: null, near: near };
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
    // the site's tokens (app.css), with fallbacks; --acc is the region's colour (Najd: clay brown)
    '#ng-btn,#ng-panel,#ng-peek{--g-paper:var(--paper,#F4EEE4);--g-ink:var(--ink,#16121D);--g-night:var(--night,#0E0B1A);--g-gold:var(--logo-gold,#E3C47A);--g-cream:var(--logo-cream,#F3EADB);' +
    '--g-acc:var(--acc,#8F5427);--g-rule:var(--rule,rgba(22,18,29,.14));--g-r:var(--r,3px);font-family:var(--f,"IBM Plex Sans Arabic",system-ui,sans-serif)}' +
    '#ng-btn{position:fixed;z-index:150;inset-inline-start:16px;bottom:calc(var(--nav,62px) + 16px + env(safe-area-inset-bottom,0px));display:none;width:64px;height:64px;padding:0;' +
    'border-radius:50%;background:radial-gradient(circle at 50% 35%,#3A2E46,var(--g-night) 75%);border:2.5px solid var(--g-gold);cursor:pointer;box-shadow:0 10px 26px rgba(14,11,26,.35),0 0 0 5px rgba(227,196,122,.18);overflow:visible;transition:transform .2s}' +
    '#ng-btn.show{display:block;animation:ngIn .5s var(--ease,cubic-bezier(.22,1,.36,1))}@keyframes ngIn{from{transform:scale(.6);opacity:0}to{transform:none;opacity:1}}' +
    '#ng-btn:hover{transform:translateY(-2px)}#ng-btn:active{transform:scale(.96)}' +
    '#ng-btn .ng-face{position:absolute;inset:0;border-radius:50%;overflow:hidden}' +
    '#ng-btn .ng-face svg{width:100%;height:100%;transform:scale(1.55) translateY(10%)}' +
    '#ng-btn .ng-dot{position:absolute;bottom:2px;inset-inline-end:2px;width:14px;height:14px;border-radius:50%;background:#3E8E5A;border:2.5px solid var(--g-paper)}' +
    '#ng-btn::after{content:"";position:absolute;inset:-5px;border-radius:50%;border:2px solid var(--g-gold);opacity:0;animation:ngRing 3.2s 1.2s infinite}' +
    '@keyframes ngRing{0%{transform:scale(.9);opacity:.7}70%,100%{transform:scale(1.25);opacity:0}}' +
    '.ng-head .ng-face svg{width:100%;height:100%;transform:scale(1.5) translateY(9%)}' +
    '#ng-panel{position:fixed;z-index:2147482000;top:0;bottom:0;inset-inline-end:0;width:min(420px,100vw);background:var(--g-paper);color:var(--g-ink);display:flex;flex-direction:column;' +
    'transform:translateX(105%);transition:transform .32s var(--ease,cubic-bezier(.22,1,.36,1));box-shadow:-14px 0 40px rgba(14,11,26,.25)}' +
    'html[dir="rtl"] #ng-panel{transform:translateX(-105%)}#ng-panel.open{transform:none!important}#ng-panel *{box-sizing:border-box}' +
    '.ng-head{display:flex;align-items:center;gap:12px;padding:calc(10px + env(safe-area-inset-top,0px)) 16px 10px;background:var(--g-night);color:var(--g-cream);min-height:var(--hdr,56px)}' +
    '.ng-head .ng-face{width:42px;height:42px;border-radius:var(--g-r);background:#2A2235;overflow:hidden;flex:none;border:1px solid rgba(227,196,122,.35)}' +
    '.ng-head b{display:block;font-size:16px;font-weight:700}.ng-head small{color:var(--g-gold);font-size:12.5px}' +
    '.ng-head .ng-x{margin-inline-start:auto;background:transparent;border:1px solid rgba(243,234,219,.24);color:var(--g-cream);border-radius:var(--g-r);width:38px;height:38px;font-size:15px;cursor:pointer}' +
    '.ng-band{height:10px;background:var(--region-motif-tone,none) var(--g-acc);background-size:auto 10px;opacity:.9}' +
    '.ng-tabs{display:flex;padding:0 16px;border-bottom:1px solid var(--g-rule)}' +
    '.ng-tabs button{flex:1;background:transparent;color:var(--g-ink);opacity:.6;border:0;border-bottom:2px solid transparent;padding:13px 4px 11px;font:inherit;font-weight:700;font-size:14.5px;cursor:pointer;margin-bottom:-1px}' +
    '.ng-tabs button.on{opacity:1;border-bottom-color:var(--g-acc);color:var(--g-acc)}' +
    '.ng-chat{flex:1;overflow-y:auto;padding:14px 16px 10px;display:flex;flex-direction:column;gap:10px}' +
    '.ng-msg{max-width:90%;padding:11px 14px;border-radius:var(--g-r);line-height:1.8;font-size:15.5px;white-space:pre-wrap}' +
    '.ng-msg.bot{background:#FFFDF9;border:1px solid var(--g-rule);border-inline-start:3px solid var(--g-acc);align-self:flex-start}' +
    '.ng-msg.me{background:var(--g-ink);color:var(--g-paper);align-self:flex-end;font-weight:500}' +
    '.ng-msg a.ng-try{display:inline-flex;margin-top:10px;background:var(--g-acc);color:var(--g-paper);border-radius:var(--g-r);padding:7px 14px;font-size:13.5px;font-weight:700;text-decoration:none}' +
    '.ng-chips{display:flex;flex-wrap:wrap;gap:6px;align-self:flex-start}.ng-chips button{background:transparent;color:var(--g-acc);border:1px solid var(--g-acc);border-radius:var(--g-r);padding:6px 11px;font:inherit;font-size:13.5px;font-weight:500;cursor:pointer}' +
    '.ng-chips button:hover{background:var(--g-acc);color:var(--g-paper)}' +
    '.ng-form{display:flex;gap:8px;padding:10px 16px calc(12px + env(safe-area-inset-bottom,0px));border-top:1px solid var(--g-rule);background:var(--g-paper)}' +
    '.ng-form input{flex:1;min-width:0;background:#FFFDF9;color:var(--g-ink);border:1px solid var(--g-rule);border-radius:var(--g-r);padding:12px 14px;font:inherit;font-size:15.5px}' +
    '.ng-form input:focus{outline:2px solid var(--g-acc);outline-offset:-1px}' +
    '.ng-form button{background:var(--g-acc);color:var(--g-paper);border:0;border-radius:var(--g-r);padding:0 18px;font:inherit;font-weight:700;cursor:pointer}' +
    '.ng-talk{flex:1;display:none;flex-direction:column;align-items:center;justify-content:flex-start;padding:16px 18px 10px;overflow-y:auto;text-align:center}' +
    '#ng-panel.talk .ng-talk{display:flex}#ng-panel.talk .ng-chat{display:none}' +
    '.ng-stage{width:min(240px,60vw);aspect-ratio:240/280;border-radius:var(--g-r);background:radial-gradient(circle at 50% 36%,#3A2E46,var(--g-night) 72%);overflow:hidden;flex:none;position:relative;transition:box-shadow .2s}' +
    '.ng-stage svg{width:100%;height:100%;display:block}' +
    '.ng-man .ng-mouth-o{opacity:0}.ng-man.open .ng-mouth-o{opacity:1}.ng-man.open .ng-mouth-c{opacity:0}' +
    '.ng-man.half .ng-mouth-o{opacity:1;transform:scaleY(.5);transform-box:fill-box;transform-origin:center}.ng-man.half .ng-mouth-c{opacity:0}' +
    '.ng-man .ng-eyes{transform-box:fill-box;transform-origin:center;animation:ngBlink 4.6s infinite}' +
    '@keyframes ngBlink{0%,94%,100%{transform:scaleY(1)}96%{transform:scaleY(.08)}}' +
    '.ng-stage.speaking{box-shadow:0 0 0 3px var(--g-gold)}.ng-stage.listening{box-shadow:0 0 0 3px #3E8E5A}' +
    '.ng-said{min-height:1.6em;margin:14px 0 4px;color:rgba(22,18,29,.6);font-size:14px}' +
    '.ng-reply{font-size:16.5px;line-height:1.85;margin:2px 0 14px;font-weight:500;background:#FFFDF9;border:1px solid var(--g-rule);border-inline-start:3px solid var(--g-acc);border-radius:var(--g-r);padding:12px 14px;text-align:start;width:100%}' +
    '.ng-reply:empty{display:none}' +
    '#ng-peek{position:fixed;z-index:151;inset-inline-start:16px;bottom:calc(var(--nav,62px) + 92px + env(safe-area-inset-bottom,0px));max-width:min(260px,72vw);background:var(--g-paper);color:var(--g-ink);' +
    'border:1px solid var(--g-rule);border-inline-start:3px solid var(--g-acc);border-radius:var(--g-r);padding:10px 34px 10px 14px;font-size:14.5px;font-weight:500;line-height:1.6;box-shadow:0 10px 26px rgba(14,11,26,.22);' +
    'opacity:0;transform:translateY(8px);transition:opacity .35s,transform .35s;pointer-events:none;cursor:pointer}' +
    'html[dir="rtl"] #ng-peek{padding:10px 14px 10px 34px}#ng-peek.show{opacity:1;transform:none;pointer-events:auto}' +
    '#ng-peek button{position:absolute;top:6px;inset-inline-end:6px;width:22px;height:22px;border:0;background:transparent;color:var(--g-ink);opacity:.55;font-size:13px;cursor:pointer}' +
    '.ng-hint{color:rgba(22,18,29,.55);font-size:13px;margin-top:10px;line-height:1.6}';

  var PANEL = '<div class="ng-head"><span class="ng-face">' + MANsvg() + '</span><div><b id="ng-title"></b><small id="ng-sub"></small></div>' +
    '<button class="ng-x" id="ng-x" type="button" aria-label="Close">✕</button></div>' +
    '<div class="ng-band" aria-hidden="true"></div><div class="ng-tabs"><button type="button" id="ng-t-chat" class="on"></button><button type="button" id="ng-t-talk"></button></div>' +
    '<div class="ng-chat" id="ng-chat" aria-live="polite"></div>' +
    '<div class="ng-talk"><div class="ng-stage" id="ng-stage">' + MANsvg() + '</div>' +
    '<div class="ng-said" id="ng-said"></div><div class="ng-reply" id="ng-reply"></div>' +
    '<div class="ng-hint" id="ng-hint"></div></div>' +
    '<form class="ng-form" id="ng-form"><input id="ng-in" autocomplete="off"><button type="submit" id="ng-send"></button></form>';

  var TXT = {
    btn: { ar: 'اسأل دليل نجد', en: 'Ask about Najd' },
    title: { ar: 'فهد · دليلك في نجد', en: 'Fahad · your Najd guide' },
    sub: { ar: 'سم، أنا بالخدمة', en: 'Ask me about its history, people and food' },
    chat: { ar: 'اكتب له', en: 'Chat' },
    talk: { ar: 'تكلّم مع فهد', en: 'Talk with Fahad' },
    ph: { ar: 'سم، وش تبي تعرف عن نجد؟', en: 'Ask anything about Najd…' },
    send: { ar: 'إرسال', en: 'Send' },
    hello: { ar: 'هلا والله وغلا، وحيّاك الله في نجد! أنا فهد، دليلك فيها وبالخدمة. سم، وش تبي تعرف؟ اسألني عن تاريخها، أكلها، قهوتها، فنونها، أو قل لي وين تبي تروح.', en: 'Welcome to Najd! I am Fahad, your guide here. Ask me about its history, food, coffee, folk arts, or where to go.' },
    typeBelow: { ar: 'اكتب سؤالك تحت، وفهد يرد عليك.', en: 'Type your question below and Fahad will answer.' },
    tapMic: { ar: 'اضغط الميكروفون وتكلّم، أو اكتب تحت', en: 'Tap the microphone and speak, or type below' },
    listening: { ar: 'أسمعك… تكلّم', en: 'Listening… go ahead' },
    noMic: { ar: 'متصفحك ما يدعم الكلام. اكتب سؤالك تحت ويرد عليك بصوته.', en: 'Your browser does not support speech input. Type your question below and he will answer out loud.' },
    noVoice: { ar: 'جهازك ما فيه صوت عربي للقراءة، فالرد مكتوب فوق. (على الآيفون والماك وكروم أندرويد الصوت العربي موجود عادة)', en: 'Your device has no voice for this language, so the answer is written above.' },
    micDenied: { ar: 'ما قدرت أسمعك. اسمح للمتصفح يستخدم الميكروفون، أو اكتب سؤالك تحت.', en: 'I could not hear you. Allow microphone access, or type your question below.' },
    you: { ar: 'سألت: ', en: 'You asked: ' },
    peek: { ar: 'حيّاك الله، أنا فهد! كيف أقدر أخدمك؟', en: 'Welcome, I am Fahad! How can I help you?' },
    tryIt: { ar: 'جرّبها بنفسك ←', en: 'Try it yourself →' }
  };

  // ════════════════════════════════════════════════════════════
  // BUILD
  // ════════════════════════════════════════════════════════════
  var st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
  var btn = document.createElement('button'); btn.id = 'ng-btn'; btn.type = 'button'; document.body.appendChild(btn);
  var peek = document.createElement('div'); peek.id = 'ng-peek'; peek.setAttribute('role', 'status'); document.body.appendChild(peek);
  var panel = document.createElement('aside'); panel.id = 'ng-panel'; panel.setAttribute('aria-hidden', 'true'); panel.innerHTML = PANEL; document.body.appendChild(panel);
  var chat = $('#ng-chat', panel), input = $('#ng-in', panel), stage = $('#ng-stage', panel), man = $('.ng-man', stage);
  var mode = 'chat', greeted = false;

  function labels() {
    btn.innerHTML = '<span class="ng-face">' + MANsvg() + '</span><span class="ng-dot" aria-hidden="true"></span>';
    btn.setAttribute('aria-label', L(TXT.peek));
    $('#ng-title', panel).textContent = L(TXT.title); $('#ng-sub', panel).textContent = L(TXT.sub);
    $('#ng-t-chat', panel).textContent = L(TXT.chat); $('#ng-t-talk', panel).textContent = L(TXT.talk);
    input.placeholder = L(TXT.ph); $('#ng-send', panel).textContent = L(TXT.send);
    $('#ng-hint', panel).textContent = L(TXT.typeBelow);
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
    if (r.near) chips(r.near); else if (r.starters) chips(STARTERS); else if (r.e && r.e.rel) chips(r.e.rel);
    if (mode === 'talk') {
      $('#ng-said', panel).textContent = L(TXT.you) + text;
      speak(reply);
    }
  }

  // ════════════════════════════════════════════════════════════
  // HE «SPEAKS» — the answer appears word by word under him while his mouth moves (no sound)
  // ════════════════════════════════════════════════════════════
  var flap = 0;
  function mouth(on) {
    clearInterval(flap); man.classList.remove('open', 'half');
    stage.classList.toggle('speaking', !!on);
    if (!on) return;
    flap = setInterval(function () {
      var r = Math.random(); man.classList.remove('open', 'half');
      if (r > 0.55) man.classList.add('open'); else if (r > 0.2) man.classList.add('half');
    }, 120);
  }
  var talkId = 0;
  function speak(text) {
    var my = ++talkId, box = $('#ng-reply', panel), words = String(text).split(' '), i = 0;
    box.textContent = ''; mouth(true);
    var step = function () {
      if (my !== talkId) return;
      if (i >= words.length) { mouth(false); return; }
      box.textContent += (i ? ' ' : '') + words[i++];
      setTimeout(step, 70 + Math.min(120, words[i - 1].length * 12));
    };
    step();
  }
  function hush() { talkId++; mouth(false); }

  // ════════════════════════════════════════════════════════════
  // OPEN, CLOSE, MODES
  // ════════════════════════════════════════════════════════════
  function setMode(m) {
    mode = m; panel.classList.toggle('talk', m === 'talk');
    $('#ng-t-chat', panel).classList.toggle('on', m === 'chat'); $('#ng-t-talk', panel).classList.toggle('on', m === 'talk');
    if (m === 'talk') {
      if (!$('#ng-reply', panel).textContent) speak(L(TXT.hello));
      setTimeout(function () { input.focus(); }, 200);
    } else { hush(); }
  }
  function open() {
    hidePeek();
    panel.classList.add('open'); panel.setAttribute('aria-hidden', 'false'); btn.classList.remove('show');
    if (!greeted) { greeted = true; bubble('bot', esc(L(TXT.hello))); chips(STARTERS); }
    if (mode === 'chat') setTimeout(function () { input.focus(); }, 300);
  }
  function close() { panel.classList.remove('open'); panel.setAttribute('aria-hidden', 'true'); hush(); }

  btn.addEventListener('click', open);
  $('#ng-x', panel).addEventListener('click', close);
  $('#ng-t-chat', panel).addEventListener('click', function () { setMode('chat'); });
  $('#ng-t-talk', panel).addEventListener('click', function () { setMode('talk'); });
  $('#ng-form', panel).addEventListener('submit', function (e) { e.preventDefault(); var t = input.value; input.value = ''; ask(t); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && panel.classList.contains('open')) close(); });

  // the button shows only in Najd, when the map is closed
  function inNajd() { return document.body.getAttribute('data-region') === 'najd' && !document.body.classList.contains('map-open'); }
  // the greeting bubble: once per visitor, a moment after the button first appears, gone after a few seconds
  var PEEK_KEY = 'cl_najd_peek', peekTimer = 0;
  function seenPeek() { try { return localStorage.getItem(PEEK_KEY) === '1'; } catch (e) { return true; } }
  function hidePeek() { clearTimeout(peekTimer); peek.classList.remove('show'); }
  function showPeek() {
    if (seenPeek() || peek.classList.contains('show')) return;
    try { localStorage.setItem(PEEK_KEY, '1'); } catch (e) {}
    peek.innerHTML = '<span></span><button type="button" aria-label="Close">✕</button>';
    peek.firstChild.textContent = L(TXT.peek);
    peek.querySelector('button').onclick = function (e) { e.stopPropagation(); hidePeek(); };
    peek.onclick = function () { hidePeek(); open(); };
    peek.classList.add('show');
    peekTimer = setTimeout(hidePeek, 7000);
  }
  // hovering the button shows the same greeting, every time (the button's own title would only show a plain tooltip)
  var hoverTimer = 0;
  function hoverPeek() {
    if (panel.classList.contains('open')) return;
    clearTimeout(peekTimer); clearTimeout(hoverTimer);
    peek.innerHTML = '<span></span>'; peek.firstChild.textContent = L(TXT.peek);
    peek.onclick = function () { hidePeek(); open(); };
    peek.classList.add('show');
  }
  btn.addEventListener('mouseenter', hoverPeek);
  btn.addEventListener('focus', hoverPeek);
  btn.addEventListener('mouseleave', function () { hoverTimer = setTimeout(hidePeek, 500); });
  btn.addEventListener('blur', function () { hoverTimer = setTimeout(hidePeek, 500); });
  peek.addEventListener('mouseenter', function () { clearTimeout(hoverTimer); });
  peek.addEventListener('mouseleave', function () { hoverTimer = setTimeout(hidePeek, 500); });
  function refresh() {
    var ok = inNajd();
    if (!ok || panel.classList.contains('open')) hidePeek();
    else if (!seenPeek()) setTimeout(function () { if (inNajd() && !panel.classList.contains('open')) showPeek(); }, 1200);
    btn.classList.toggle('show', ok && !panel.classList.contains('open'));
    if (!ok && panel.classList.contains('open')) close();
  }
  new MutationObserver(refresh).observe(document.body, { attributes: true, attributeFilter: ['data-region', 'class'] });
  document.addEventListener('languageChanged', function () { labels(); });
  labels(); refresh();
  // a direct link (?guide=1) goes straight to Najd with the guide open, e.g. to share it for testing
  if (/[?&]guide=1/.test(location.search)) setTimeout(function () {
    if (!inNajd() && window.ThemeManager && window.ThemeManager.selectRegion) window.ThemeManager.selectRegion('najd');
    setTimeout(function () { if (inNajd()) { open(); if (/[?&]talk=1/.test(location.search)) setMode('talk'); } }, 300);
  }, 700);
  window.__najdGuide = { open: open, close: close, ask: ask, answer: answer, setMode: setMode, KB: KB };
})();
