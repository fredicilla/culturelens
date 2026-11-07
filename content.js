/**
 * content.js — CultureLens experiences
 *
 * Source: the team's heritage spreadsheet ("تراث مناطق المملكة العربية السعودية").
 * Arabic text is from the spreadsheet as written. English is a translation of it.
 * Region names in the sheet map to the app's regions:
 *   المنطقة الوسطى = najd, المنطقة الغربية = hejaz, الشرقية = eastern,
 *   الجنوبية = southern, الشمالية = northern
 *
 * Fields
 *   cat       food | music | games | clothing
 *   regions   region keys ('all' = every region)
 *   page      the full experience page, when it's built (history, AR, game)
 *   name      { en, ar }
 *   story     { en, ar }  the description (history)
 *   how       { label: {en, ar}, en, ar }  how it's made / performed / played
 *   materials { en, ar }  ingredients, instruments or tools
 *   occasion  { en, ar }
 *   place     { en, ar }
 *   mins      length of the full experience, when built
 */
window.CL_CONTENT = {
  CATEGORIES: {
    food:     { page: 'food.html',     en: 'Food & Drinks',          ar: 'المأكولات والمشروبات',
                subEn: 'Dishes, drinks, and the customs around them', subAr: 'أكلات ومشروبات وسلومها' },
    music:    { page: 'music.html',    en: 'Music & Performances',   ar: 'الفنون والعروض',
                subEn: 'Folk arts, instruments, and performances',     subAr: 'الفنون الشعبية وآلاتها' },
    games:    { page: 'games.html',    en: 'Traditional Games',      ar: 'الألعاب القديمة',
                subEn: 'The games of the old neighborhoods',           subAr: 'ألعاب الحواري القديمة' },
    clothing: { page: 'clothing.html', en: 'Fabrics & Clothing',     ar: 'الأزياء والثياب',
                subEn: 'What we wear and where it comes from',         subAr: 'وش نلبس ومن وين جا' }
  },

  HOW: {
    food:  { en: 'How it is made', ar: 'طريقة التحضير' },
    music: { en: 'How it is performed', ar: 'طريقة الأداء' },
    games: { en: 'How to play', ar: 'طريقة اللعب' },
    clothing: { en: 'How it is worn', ar: 'طريقة اللبس' }
  },
  MATERIALS: {
    food:  { en: 'Ingredients', ar: 'المكونات' },
    music: { en: 'Instruments and dress', ar: 'الآلات والأزياء' },
    games: { en: 'What you need', ar: 'الأدوات' },
    clothing: { en: 'Pieces', ar: 'القطع' }
  },

  ITEMS: {
    // ════ EASTERN REGION ════
    mufallaq: {
      cat: 'food', regions: ['eastern'],
      name: { en: 'Hasawi Mufallaq', ar: 'المفلّق الحساوي' },
      story: {
        ar: 'من أشهر أكلات المنطقة الشرقية، يُطبخ فيه القمح المجروش بدل الرز، ويحضر على السفرة مع الأطباق الرئيسية.',
        en: 'One of the best-known dishes of the Eastern Region. It is cooked with cracked wheat instead of rice and comes to the table alongside the main dishes.'
      },
      how: {
        ar: 'قمح مجروش يُطبخ مع الربيان وخضار الموسم.',
        en: 'Cracked wheat is cooked with shrimp and seasonal vegetables.'
      },
      materials: { ar: 'قمح مجروش، ربيان، خضار', en: 'Cracked wheat, shrimp, vegetables' },
      occasion: {
        ar: 'يُقدَّم مع الأطباق الرئيسية مثل كبسة السمك والمكبوس',
        en: 'Served with main dishes such as fish kabsa and makboos'
      },
      place: { ar: 'المنطقة الشرقية', en: 'Eastern Region' }
    },
    samri: {
      cat: 'music', regions: ['eastern'], page: 'samri.html', mins: 4,
      name: { en: 'Al-Samri', ar: 'السامري' },
      story: {
        ar: 'فن شعبي يزيّن مجالس السمر، واسمه مأخوذ من «السَّمَر» وهو حديث الليل.',
        en: 'A folk art that livens up evening gatherings. Its name comes from "samar," the talk of the night.'
      },
      how: {
        ar: 'يجلس المؤدّون ويغنّون على إيقاع الطبول والطارات.',
        en: 'The performers sit and sing to the beat of drums and tars (frame drums).'
      },
      materials: { ar: 'طبلان، وعدد من الطارات', en: 'Two drums and several tars' },
      occasion: { ar: 'مجالس السمر والأفراح', en: 'Evening gatherings and celebrations' },
      place: { ar: 'المنطقة الشرقية', en: 'Eastern Region' }
    },
    taqiyah: {
      cat: 'games', regions: ['eastern'],
      name: { en: 'Taq Taq Taqiyah', ar: 'طاق طاق طاقية' },
      story: { ar: 'لعبة جماعية للأطفال.', en: 'A group game for children.' },
      how: {
        ar: 'يجلس الأطفال في دائرة، ويدور واحد حولهم ويحط الطاقية خلف واحد منهم بدون ما ينتبه. إذا انتبه قام يلحقه، وإذا ما انتبه أخذ اللي يدور مكانه.',
        en: 'The children sit in a circle while one walks around them and quietly drops the taqiyah (cap) behind someone. If that child notices, they jump up and chase the walker. If not, the walker takes their place.'
      },
      materials: { ar: 'طاقية', en: 'A taqiyah (cap)' },
      place: { ar: 'المنطقة الشرقية', en: 'Eastern Region' }
    },

    // ════ NAJD (CENTRAL REGION) ════
    qahwa: {
      cat: 'food', regions: ['najd'], page: 'qahwa.html', mins: 10,
      name: { en: 'Saudi Coffee', ar: 'القهوة السعودية' },
      story: {
        ar: 'القهوة عند أهل نجد عنوان الكرم وأول ما يُقدَّم للضيف. يفوح ريحها في المجلس قبل ما تنصب، وصوت النجر يعلن للجيران إن عند البيت ضيف. وما زالت إلى اليوم أول خطوة في مراسم استقبال الضيوف الرسميين.',
        en: 'For the people of Najd, coffee is the sign of generosity and the first thing offered to a guest. Its aroma fills the majlis before it is poured, and the sound of the mortar tells the neighbors that the house has a guest. To this day it is the first step in receiving official guests.'
      },
      how: {
        ar: 'تُحمَّس الحبوب على النار حتى يصير لونها ذهبياً (وتسمى الكمية المحمّسة «حمسة»)، ثم تُدق في النجر، وتُغلى في الدلة مع الهيل والبهارات.',
        en: 'The beans are roasted over the fire until they turn golden (a roasted batch is called a "hamsa"), then pounded in the mortar (najr) and boiled in the dallah with cardamom and spices.'
      },
      materials: {
        ar: 'بن محمّص تحميصة ذهبية، هيل، ويُضاف في نجد القرنفل والزعفران. الأدوات: المحماس، النجر، الدلة، الفناجيل.',
        en: 'Golden-roasted coffee and cardamom. In Najd, cloves and saffron are added. Tools: the mihmas (roasting pan), the najr (mortar), the dallah, and the finjans.'
      },
      occasion: {
        ar: 'المجالس واستقبال الضيوف. يمسك المُقهوي الدلة باليد اليسرى والفناجيل باليمنى، ويصب أول فنجان للمضيف، ثم يقدّم القهوة لكبار السن والضيوف.',
        en: 'Majlis gatherings and receiving guests. The server holds the dallah in the left hand and the finjans in the right, pours the first cup for the host, then serves the elders and the guests.'
      },
      place: { ar: 'المنطقة الوسطى', en: 'Central Region (Najd)' }
    },
    ardah: {
      cat: 'music', regions: ['najd'],
      name: { en: 'Al-Ardah Al-Najdiyah', ar: 'العرضة النجدية' },
      story: {
        ar: 'فن أدائي يجمع الرقص وقرع الطبول وإنشاد الشعر.',
        en: 'A performing art that brings together dance, drumming, and sung poetry.'
      },
      how: {
        ar: 'يقف الرجال كتفاً بكتف في صفّين متقابلين ويحملون سيوفاً خفيفة، وبين الصفّين قارعو الطبول، ويحمل أحدهم العلم. يُنشد الشاعر الأبيات فيردّدها المشاركون، وهم يتمايلون ويرفعون سيوفهم ويخفضونها على إيقاع الطبول. وفي ختام القصيدة يجتمعون حول العلم.',
        en: 'Men stand shoulder to shoulder in two facing rows holding light swords, with the drummers between the rows and one man carrying the flag. The poet chants the verses and the participants repeat them, swaying and raising and lowering their swords to the drumbeat. At the end of the poem they gather around the flag.'
      },
      materials: {
        ar: 'سيوف خفيفة، طبول كبيرة وصغيرة، علم، أزياء تقليدية',
        en: 'Light swords, large and small drums, a flag, traditional dress'
      },
      occasion: {
        ar: 'الأعياد، الأعراس، المواليد، حفلات التخرج، المناسبات الوطنية',
        en: 'Eids, weddings, births, graduations, and national occasions'
      },
      place: { ar: 'المنطقة الوسطى، وتُؤدّى في أنحاء المملكة', en: 'Central Region, and performed across the Kingdom' }
    },
    masaqil: {
      cat: 'games', regions: ['najd'], page: 'masaqeel.html', mins: 8,
      name: { en: 'Al-Masaqil', ar: 'المصاقيل' },
      story: {
        ar: 'لعبة شعبية تشتهر في المنطقة الوسطى، تُلعب بحبيبات كروية صغيرة.',
        en: 'A folk game well known in the Central Region, played with small round marbles.'
      },
      how: {
        ar: 'يرسم اللاعبون مربعاً بخط على الرمل، ويقفون على بُعد خمسة أمتار، ثم يصوّب كل لاعب حبيبته لتدخل الحفرة. والفائز يكسب كل الحبيبات اللي في الحفرة.',
        en: 'The players draw a square in the sand and stand five meters away, then each one aims a marble at the hole. The winner takes all the marbles in the hole.'
      },
      materials: { ar: 'حبيبات كروية مصنوعة من الزجاج الصلد', en: 'Round marbles made of hard glass' },
      occasion: { ar: 'لعبة يلعبها الصغار في الحواري', en: 'Played by children in the neighborhood alleys' },
      place: { ar: 'المنطقة الوسطى', en: 'Central Region (Najd)' }
    },
    // Not in the spreadsheet: the existing Ghutrah experience page, kept as is
    ghutrah: {
      cat: 'clothing', regions: ['najd'], page: 'ghutrah.html', mins: 3,
      name: { en: 'The Iqal and Ghutrah', ar: 'العقال والغترة' },
      story: {
        ar: 'اللبس يختلف حسب المناسبة، وكل قطعة تقول شي عن صاحبها.',
        en: 'What a man wears changes with the occasion, and every piece says something about the person wearing it.'
      },
      how: {
        ar: 'الثوب أول، ثم الغترة، ثم العقال، وكل وحدة لها طريقة.',
        en: 'The thobe comes first, then the ghutrah, then the iqal, each worn its own way.'
      },
      materials: { ar: 'الثوب، الغترة، العقال', en: 'The thobe, the ghutrah, the iqal' },
      place: { ar: 'المنطقة الوسطى', en: 'Central Region (Najd)' }
    },

    // ════ SOUTHERN REGION ════
    areeka: {
      cat: 'food', regions: ['southern'],
      name: { en: 'Al-Areeka', ar: 'العريكة' },
      story: {
        ar: 'من أشهر أكلات الجنوب وأقربها للقلب، تتصدّر الولائم والمناسبات، ويكثر تقديمها في الشتاء لأنها تمدّ الجسم بالدفء.',
        en: 'One of the best-known and best-loved dishes of the south. It takes the center of feasts and occasions, and is served most in winter because it warms the body.'
      },
      how: {
        ar: 'خبز البر يُفتّ ويُعرك باليد مع السمن، ثم يُقدَّم مع العسل.',
        en: 'Whole-wheat bread is crumbled and kneaded by hand with ghee, then served with honey.'
      },
      materials: { ar: 'خبز بر، سمن، عسل', en: 'Whole-wheat bread, ghee, honey' },
      occasion: { ar: 'الولائم والمناسبات والشتاء', en: 'Feasts, occasions, and winter' },
      place: { ar: 'المنطقة الجنوبية', en: 'Southern Region' }
    },
    khatwa: {
      cat: 'music', regions: ['southern'],
      name: { en: 'Al-Khatwa', ar: 'الخطوة الجنوبية' },
      story: {
        ar: 'فن شعبي من أشهر فنون الجنوب، يؤدّيه الرجال بخطوات منتظمة على إيقاع الطبول.',
        en: 'One of the best-known folk arts of the south, performed by men in steady steps to the beat of the drums.'
      },
      how: {
        ar: 'يقف المؤدّون في صف، يتقدّمون خطوة ويرجعون خطوة بإيقاع ثابت، ويتنقل بعضهم بين الصفوف وهم يردّدون أبياتاً قصيرة.',
        en: 'The performers stand in a line, stepping forward and back in a steady rhythm, while some move between the rows repeating short verses.'
      },
      materials: { ar: 'الطبول، الجنبية، الخيزرانة', en: 'Drums, the janbiya (curved dagger), the khaizarana (cane)' },
      occasion: { ar: 'الأعياد، اليوم الوطني، المهرجانات الشعبية', en: 'Eids, National Day, folk festivals' },
      place: { ar: 'المنطقة الجنوبية', en: 'Southern Region' }
    },
    mizqara: {
      cat: 'games', regions: ['southern'],
      name: { en: 'Al-Mizqara', ar: 'المزقرة' },
      story: {
        ar: 'لعبة شعبية من ألعاب الجنوب، تعتمد على المهارة والدقة والقوة.',
        en: 'A folk game from the south that takes skill, precision, and strength.'
      },
      how: {
        ar: 'توضع قطعة خشب صغيرة فوق شق في الأرض، فيرفعها اللاعب بالعصا ويضربها بقوة للأمام. والفائز اللي تروح قطعته أبعد.',
        en: 'A small piece of wood is laid over a groove in the ground. The player flicks it up with the stick and strikes it hard forward. Whoever sends their piece farthest wins.'
      },
      materials: { ar: 'عصا خشبية مستقيمة، وقطعة خشب صغيرة', en: 'A straight wooden stick and a small piece of wood' },
      place: { ar: 'المنطقة الجنوبية', en: 'Southern Region' }
    },

    // ════ HEJAZ (WESTERN REGION) ════
    mantu: {
      cat: 'food', regions: ['hejaz'],
      name: { en: 'Al-Mantu', ar: 'المنتو' },
      story: {
        ar: 'المنتو ضيف دائم على السفرة الحجازية، عرفه أهل الحجاز عن طريق الحجاج، فصار من أكلاتهم.',
        en: 'Mantu is a constant guest at the Hejazi table. The people of the Hejaz learned it from pilgrims, and it became one of their own dishes.'
      },
      how: {
        ar: 'عجينة محشوة باللحم، تُطهى على البخار.',
        en: 'Dough filled with meat and cooked by steaming.'
      },
      materials: { ar: 'دقيق، لحم مفروم، بصل، بهارات، كمون', en: 'Flour, minced meat, onion, spices, cumin' },
      occasion: { ar: 'رمضان والعزايم', en: 'Ramadan and dinner invitations' },
      place: { ar: 'المنطقة الغربية', en: 'Western Region (Hejaz)' }
    },
    tasheer: {
      cat: 'music', regions: ['hejaz'],
      name: { en: 'Al-Tasheer', ar: 'التعشير' },
      story: {
        ar: 'فن شعبي أصله استعراض حربي، ثم صار عنوان الفرح عند أهل الحجاز.',
        en: 'A folk art that began as a display of war, then became the sign of celebration for the people of the Hejaz.'
      },
      how: {
        ar: 'يقف المؤدّون في صفّين متقابلين، ويقفزون ويطلقون ببنادقهم نحو الأرض.',
        en: 'The performers stand in two facing rows, jumping and firing their rifles toward the ground.'
      },
      materials: {
        ar: 'بندقية تقليدية تسمى «المقمّع»، والأزياء التقليدية',
        en: 'A traditional rifle called the "muqamma," and traditional dress'
      },
      occasion: { ar: 'الأعراس، الاحتفالات الرسمية، المهرجانات الوطنية', en: 'Weddings, official celebrations, national festivals' },
      place: { ar: 'المنطقة الغربية', en: 'Western Region (Hejaz)' }
    },
    zughzughiyah: {
      cat: 'games', regions: ['hejaz'],
      name: { en: 'Al-Zughzughiyah', ar: 'الزغزغية' },
      story: {
        ar: 'لعبة جماعية من ألعاب حواري مكة القديمة، يلعبها الكبار والصغار.',
        en: 'A group game from the old neighborhoods of Makkah, played by adults and children alike.'
      },
      how: {
        ar: 'يُغطّى وجه لاعب، ويختبئ الباقون، ثم يدوّر عليهم. واللي يمسكه يصير هو اللي يدوّر.',
        en: "One player's eyes are covered while the others hide, then the player goes looking for them. Whoever gets caught becomes the seeker."
      },
      materials: { ar: 'لا تحتاج أدوات', en: 'No tools needed' },
      occasion: { ar: 'لعبة جماعية للكبار والصغار في الحواري', en: 'A group game for adults and children in the neighborhoods' },
      place: {
        ar: 'مكة المكرمة، في حواري مثل المسفلة وأجياد والسليمانية وحارة الباب',
        en: 'Makkah, in neighborhoods such as Al-Misfalah, Ajyad, Al-Sulaimaniyah, and Harat Al-Bab'
      }
    },

    // ════ NORTHERN REGION ════
    melihiyah: {
      cat: 'food', regions: ['northern'],
      name: { en: 'Al-Melihiyah', ar: 'المليحية' },
      story: {
        ar: 'الأكلة اللي تمثّل المنطقة الشمالية، تتميّز بمذاقها المالح، ويكثر تقديمها في الشتاء لأنها تمدّ الجسم بالدفء.',
        en: 'The dish that represents the Northern Region. It is known for its salty taste and is served most in winter because it warms the body.'
      },
      how: {
        ar: 'رز يُطبخ مع مريس الأقط أو اللحم، ويُسقى بالسمن البري والمرق، ويُزيَّن بالبقدونس.',
        en: 'Rice is cooked with dissolved aqit (dried yogurt) or meat, soaked with wild ghee and broth, and garnished with parsley.'
      },
      materials: { ar: 'رز، أقط، لحم، سمن بري، مرق، بقدونس', en: 'Rice, aqit, meat, wild ghee, broth, parsley' },
      occasion: { ar: 'الشتاء ورمضان', en: 'Winter and Ramadan' },
      place: { ar: 'المنطقة الشمالية', en: 'Northern Region' }
    },
    dahha: {
      cat: 'music', regions: ['northern'],
      name: { en: 'Al-Dahha', ar: 'الدحّة الشمالية' },
      story: {
        ar: 'فن شعبي يؤدّيه الرجال احتفالاً بالنصر، ويتميّز بأصوات قوية تشبه زئير الأسد.',
        en: 'A folk art performed by men to celebrate victory, known for its powerful voices that sound like a lion roaring.'
      },
      how: {
        ar: 'يقف المؤدّون في صف أو صفّين، ويتحرك أمامهم مؤدٍّ لابس المشلح، وهم يطلقون أصواتهم بإيقاع واحد.',
        en: 'The performers stand in one or two rows while a performer wearing the mishlah (cloak) moves in front of them, and they let out their voices in one rhythm.'
      },
      materials: { ar: 'أصوات المؤدّين، المشلح', en: "The performers' voices, the mishlah (cloak)" },
      occasion: { ar: 'الاحتفالات الوطنية والمهرجانات الشعبية', en: 'National celebrations and folk festivals' },
      place: { ar: 'المنطقة الشمالية، وتشتهر في الجوف', en: 'Northern Region, especially Al-Jawf' }
    },
    idrees: {
      cat: 'games', regions: ['northern'],
      name: { en: 'Al-Idrees', ar: 'الإدريس' },
      story: {
        ar: 'لعبة ذكاء قديمة يلعبها اثنان على لوح مرسوم عليه مربعات، بحصى صغيرة.',
        en: 'An old strategy game for two players, played with small pebbles on a board marked with squares.'
      },
      how: {
        ar: 'كل لاعب يحط حجاره ويحركها ليصفّ ثلاثة في خط واحد، وإذا صفّها يشيل حجر من حجار خصمه. واللي تخلص حجاره يخسر.',
        en: "Each player places and moves their stones to line up three in a row. Lining up three lets you remove one of your opponent's stones. Whoever runs out of stones loses."
      },
      materials: { ar: 'لوح خشبي مرسوم عليه مربعات، وحصى بلونين', en: 'A wooden board marked with squares, and pebbles in two colors' },
      place: { ar: 'المنطقة الشمالية', en: 'Northern Region' }
    }
  }
};
