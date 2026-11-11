/**
 * ThemeManager.js — CultureLens region engine
 *
 * Five regions (Najd, Hejaz, Eastern, Southern, Northern). Picking one:
 *   - sets the region's accent color and a slightly tinted background
 *   - uses that region's traditional motif (see patterns.js) for artwork
 *   - swaps the Arabic UI text to that region's dialect
 *   - opens only the experiences that belong to the region
 *
 * Needs patterns.js and content.js loaded first.
 * Any element with data-dialect="key" gets its text from REGIONS[region].ar[key] / .en[key].
 * Any element with data-region-text="name|area" gets the region's name or area.
 */
(function () {
  // Last region picked (remembered between visits, used to preselect on the map)
  var STORAGE_KEY = 'cl_region';
  // Set once a region is picked in this visit. The map opens on every new visit.
  var SESSION_KEY = 'cl_region_session';
  // The old April region picker used this key; clear it so it can't skip the map
  try { localStorage.removeItem('culturelens_selected_region'); } catch (e) {}

  var P = window.CLPatterns;

  // ════════════════════════════════════════════════════════════
  // REGIONS
  // ════════════════════════════════════════════════════════════
  var REGIONS = {
    najd: {
      nameEn: 'Najd', nameAr: 'نجد',
      areaEn: 'Riyadh and Al-Qassim', areaAr: 'الرياض والقصيم',
      colors: { bg: '#14100D', surface: '#1D1813', accent: '#C98A55', accentLt: '#E2AE7F', onAccent: '#1A120B' },
      motifEn: 'Najdi mud-brick facade', motifAr: 'واجهة الطين النجدية',
      en: {
        welcome: 'Welcome to Najd',
        known: 'Saudi Coffee, Al-Ardah, Samri nights, and the mud-brick lanes of Diriyah'
      },
      ar: {
        welcome: 'هلا والله، حيّاك الله في نجد',
        tagline: 'عِش الثقافة، لا تقرا عنها وبس',
        known: 'القهوة السعودية، العرضة، ليالي السامري، وطين الدرعية',
        change: 'غيّر المنطقة',
        soon: 'قريّب إن شاء الله'
      }
    },
    hejaz: {
      nameEn: 'Hejaz', nameAr: 'الحجاز',
      areaEn: 'Makkah and Madinah', areaAr: 'مكة المكرمة والمدينة المنورة',
      colors: { bg: '#0F1312', surface: '#171D1B', accent: '#4FA593', accentLt: '#7CC4B4', onAccent: '#0B1513' },
      motifEn: 'Roshan lattice of old Jeddah', motifAr: 'رواشين جدة القديمة',
      en: {
        welcome: 'Welcome to Hejaz',
        known: 'The roshan windows of Al-Balad, Al-Mizmar, and old Jeddah'
      },
      ar: {
        welcome: 'يا هلا وغلا، نوّرت الحجاز',
        tagline: 'عيش الثقافة، مو بس تقرا عنها',
        known: 'رواشين البلد، المزمار، وبيوت جدة القديمة',
        change: 'غيّر المنطقة',
        soon: 'قريب إن شاء الله، استنّونا'
      }
    },
    eastern: {
      nameEn: 'Eastern Region', nameAr: 'المنطقة الشرقية',
      areaEn: 'Al-Ahsa and the Gulf coast', areaAr: 'الأحساء وساحل الخليج',
      colors: { bg: '#0F1215', surface: '#171B20', accent: '#7AA9C7', accentLt: '#A3C6DC', onAccent: '#0B1218' },
      motifEn: 'Carved gypsum of Al-Ahsa', motifAr: 'نقش الجص الحساوي',
      en: {
        welcome: 'Welcome to the Eastern Region',
        known: 'The Al-Ahsa oasis, pearl diving, and the Hasawi bisht'
      },
      ar: {
        welcome: 'هلا والله فيك، حيّاك بالشرقية',
        tagline: 'عيش الثقافة صج، مو بس تقرا عنها',
        known: 'واحة الأحساء، الغوص على اللؤلؤ، والبشت الحساوي',
        change: 'غيّر المنطقة',
        soon: 'قريب إن شاء الله، اصبر علينا شوي'
      }
    },
    southern: {
      nameEn: 'Southern Region', nameAr: 'المنطقة الجنوبية',
      areaEn: 'Asir, Jazan, Najran, and Al-Baha', areaAr: 'عسير وجازان ونجران والباحة',
      colors: { bg: '#141110', surface: '#1E1A17', accent: '#DDA63E', accentLt: '#EBC277', onAccent: '#1A1307' },
      motifEn: 'Al-Qatt Al-Asiri', motifAr: 'القط العسيري',
      en: {
        welcome: 'Welcome to the South',
        known: 'Al-Qatt Al-Asiri, stone villages, and Al-Khatwa'
      },
      ar: {
        welcome: 'يا مرحبا ألف، حيّ الله من جانا',
        tagline: 'عِش الثقافة، ما هي قراية وبس',
        known: 'القط العسيري، قرى الحجر، والخطوة',
        change: 'غيّر المنطقة',
        soon: 'قريب إن شاء الله'
      }
    },
    northern: {
      nameEn: 'Northern Region', nameAr: 'المنطقة الشمالية',
      areaEn: "Ha'il, Al-Jawf, Tabuk, and the Northern Borders", areaAr: 'حائل والجوف وتبوك والحدود الشمالية',
      colors: { bg: '#141010', surface: '#1E1716', accent: '#C9574A', accentLt: '#DE8478', onAccent: '#FFF5EE' },
      motifEn: 'Al-Sadu weaving', motifAr: 'نسيج السدو',
      en: {
        welcome: 'Welcome to the North',
        known: 'Al-Sadu weaving, the rock art of Jubbah, and Al-Jawf olives'
      },
      ar: {
        welcome: 'هلا ومرحبا، يا هلا بك في الشمال',
        tagline: 'عِش الثقافة، لا تقرا عنها بس',
        known: 'السدو، نقوش جبة، وزيتون الجوف',
        change: 'غيّر المنطقة',
        soon: 'قريب إن شاء الله'
      }
    }
  };

  var DEFAULT_TEXT = {
    en: { soon: 'Coming in the next update', change: 'Change region' },
    ar: { soon: 'قريباً في التحديث القادم', change: 'غيّر المنطقة' }
  };

  var TEXT = '#F3EEE6';

  function hexA(hex, alpha) {
    var h = hex.replace('#', '');
    var n = parseInt(h.length === 3 ? h.replace(/(.)/g, '$1$1') : h, 16);
    return 'rgba(' + ((n >> 16) & 255) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',' + alpha + ')';
  }

  // Motif artwork for a region: 'full' = traditional colors, 'tone' = quiet accent version
  function motif(key, mode) {
    var r = REGIONS[key];
    if (!r || !P) return 'none';
    return P.url(key, mode || 'full', r.colors.accent);
  }
  function motifSize(key, scale) { return P ? P.size(key, scale) : 'auto'; }
  function paint(el, key, mode, scale) {
    if (!el || !REGIONS[key]) return;
    el.style.backgroundImage = motif(key, mode);
    el.style.backgroundSize = motifSize(key, scale);
  }

  // ════════════════════════════════════════════════════════════
  // STORAGE
  // ════════════════════════════════════════════════════════════
  function remember(key) {
    try { localStorage.setItem(STORAGE_KEY, key); } catch (e) {}
    try { sessionStorage.setItem(SESSION_KEY, key); } catch (e) {}
  }
  function pickedThisVisit() {
    try { return !!sessionStorage.getItem(SESSION_KEY); } catch (e) { return false; }
  }
  function saved() {
    try { return localStorage.getItem(STORAGE_KEY); } catch (e) { return null; }
  }

  var activeKey = REGIONS[saved()] ? saved() : null;
  function lang() { return window.currentLang === 'ar' ? 'ar' : 'en'; }

  // ════════════════════════════════════════════════════════════
  // THEME
  // ════════════════════════════════════════════════════════════
  function applyTheme(key) {
    var r = REGIONS[key];
    if (!r || !document.body) return;
    var c = r.colors, b = document.body;
    b.setAttribute('data-region', key);
    var vars = {
      '--region-bg': c.bg,
      '--region-surface': c.surface,
      '--region-accent': c.accent,
      '--region-accent-lt': c.accentLt,
      '--region-on-accent': c.onAccent,
      '--region-text': TEXT,
      '--region-border': 'rgba(243,238,230,0.10)',
      '--region-glow': hexA(c.accent, 0.12),
      '--region-muted': 'rgba(243,238,230,0.62)',
      '--region-motif': motif(key, 'full'),
      '--region-motif-tone': motif(key, 'tone'),
      '--region-motif-size': motifSize(key, 1),
      // older names still used by the experience pages
      '--region-card': c.surface,
      '--region-hero-a': c.bg,
      '--region-hero-b': c.surface,
      '--region-pattern': motif(key, 'tone'),
      '--region-pattern-size': motifSize(key, 1),
      '--green': c.bg,
      '--card-dark': c.surface,
      '--gold': c.accent,
      '--gold-lt': c.accentLt,
      '--cream': TEXT,
      '--text-light': 'rgba(243,238,230,0.62)'
    };
    for (var k in vars) b.style.setProperty(k, vars[k]);

    // the app's own pages keep the logo's ink strip on top; the experiences take the region's dark
    var meta = document.querySelector('meta[name="theme-color"]');
    if (!meta) { meta = document.createElement('meta'); meta.name = 'theme-color'; document.head.appendChild(meta); }
    meta.content = b.classList.contains('cl-app') ? '#0E0B1A' : c.bg;

    updateRegionUI(key);
  }

  // ════════════════════════════════════════════════════════════
  // DIALECT TEXT
  // ════════════════════════════════════════════════════════════
  function t(k, key) {
    var r = REGIONS[key || activeKey];
    return (r && r[lang()][k]) || DEFAULT_TEXT[lang()][k] || '';
  }

  function applyDialect() {
    var r = REGIONS[activeKey];
    document.querySelectorAll('[data-dialect]').forEach(function (el) {
      var k = el.getAttribute('data-dialect');
      if (!el.hasAttribute('data-ar-default')) el.setAttribute('data-ar-default', el.getAttribute('data-ar') || '');
      if (!el.hasAttribute('data-en-default')) el.setAttribute('data-en-default', el.getAttribute('data-en') || '');
      el.setAttribute('data-ar', (r && r.ar[k]) || el.getAttribute('data-ar-default'));
      el.setAttribute('data-en', (r && r.en[k]) || el.getAttribute('data-en-default'));
    });
    if (typeof window.applyLanguage === 'function') window.applyLanguage();
  }

  function setT(el, en, ar) {
    el.classList.add('translatable');
    el.setAttribute('data-en', en);
    el.setAttribute('data-ar', ar);
    el.textContent = lang() === 'ar' ? ar : en;
  }

  // ════════════════════════════════════════════════════════════
  // HEADER PILL + REGION TEXT
  // ════════════════════════════════════════════════════════════
  var PILL_PAGES = ['food.html', 'music.html', 'clothing.html', 'games.html', 'experience.html', 'community.html', 'account.html'];
  function currentFile() { return (window.location.pathname.split('/').pop() || 'index.html').toLowerCase(); }

  function ensureIndicator() {
    if (document.getElementById('region-indicator')) return;
    var langBtn = document.getElementById('lang-toggle');
    if (PILL_PAGES.indexOf(currentFile()) === -1 || !langBtn) return;
    var b = document.createElement('button');
    b.id = 'region-indicator';
    b.type = 'button';
    b.addEventListener('click', openMap);
    langBtn.parentNode.insertBefore(b, langBtn);
  }

  function updateRegionUI(key) {
    var r = REGIONS[key];
    if (!r) return;
    ensureIndicator();
    document.querySelectorAll('[data-region-text]').forEach(function (n) {
      var f = n.getAttribute('data-region-text');
      if (f === 'area') setT(n, r.areaEn, r.areaAr);
      else if (f === 'motif') setT(n, r.motifEn, r.motifAr);
      else setT(n, r.nameEn, r.nameAr);
    });
    document.querySelectorAll('[data-motif]').forEach(function (n) {
      var sc = parseFloat(n.getAttribute('data-motif-scale')) || 1;
      // a band shows whole tiles of the pattern, as tall as the band
      if (n.hasAttribute('data-motif-fit') && P) { var hh = n.clientHeight || parseFloat(getComputedStyle(n).height) || 0; if (hh) sc = hh / P.tile(key)[1]; }
      paint(n, key, n.getAttribute('data-motif') || 'full', sc);
    });
    var el = document.getElementById('region-indicator');
    if (!el) return;
    el.style.display = 'inline-flex';
    el.innerHTML = '<span class="ri-dot" aria-hidden="true"></span>' +
      '<span class="translatable" data-en="' + r.nameEn + '" data-ar="' + r.nameAr + '">' + (lang() === 'ar' ? r.nameAr : r.nameEn) + '</span>';
    el.setAttribute('aria-label', t('change', key));
    el.title = t('change', key);
  }

  // ════════════════════════════════════════════════════════════
  // MAP SCREEN (index.html)
  // ════════════════════════════════════════════════════════════
  var screen = null;
  var entering = null;

  function markPicked(key) {
    if (!screen) return;
    screen.classList.toggle('has-pick', !!key);
    screen.querySelectorAll('.rm-region').forEach(function (p) {
      var on = p.getAttribute('data-region-key') === key;
      p.classList.toggle('picked', on);
      p.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
  }

  // Tap a region: it lights up for a moment, then the app opens on it.
  function enterRegion(key) {
    if (!REGIONS[key] || entering) return;
    entering = key;
    activeKey = key;
    applyTheme(key);
    applyDialect();
    markPicked(key);
    // the camera moves in on the region, then the region's home opens
    var still = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var path = screen && screen.querySelector('.rm-region[data-region-key="' + key + '"]');
    var svg = screen && screen.querySelector('.rm-map svg');
    if (path && svg && !still) {
      try {
        var bb = path.getBBox(), vb = svg.viewBox.baseVal;
        svg.style.setProperty('--zx', ((bb.x + bb.width / 2 - vb.x) / vb.width * 100).toFixed(1) + '%');
        svg.style.setProperty('--zy', ((bb.y + bb.height / 2 - vb.y) / vb.height * 100).toFixed(1) + '%');
      } catch (e) {}
      screen.classList.add('is-zooming');
      setTimeout(function () { screen.classList.add('is-leaving'); }, 250);
    }
    setTimeout(function () {
      entering = null;
      selectRegion(key);
      if (screen) { screen.classList.remove('is-zooming', 'is-leaving'); }
    }, still ? 300 : 820);
  }

  function selectRegion(key) {
    if (!REGIONS[key]) return;
    remember(key);
    activeKey = key;
    applyTheme(key);
    applyContent();
    applyDialect();
    closeMap();
  }

  function openMap() {
    if (!screen) { window.location.href = 'index.html#map'; return; }
    screen.classList.add('open');
    screen.setAttribute('aria-hidden', 'false');
    document.body.classList.add('map-open');
    window.scrollTo(0, 0);
    markPicked(activeKey);
  }

  function closeMap() {
    if (!screen) return;
    screen.classList.remove('open');
    screen.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('map-open');
    if (window.location.hash === '#map') history.replaceState(null, '', window.location.pathname);
  }

  // Each region on the map: its own color, with its pattern drawn faintly over it in cream
  var MAP_INK = { najd: '#8F5427', hejaz: '#1E6E61', eastern: '#2B6688', southern: '#8A5C0C', northern: '#9B392E' };
  function paintMap() {
    var svg = screen && screen.querySelector('svg');
    if (!svg || !P) return;
    var NS = 'http://www.w3.org/2000/svg';
    var defs = svg.querySelector('defs') || svg.insertBefore(document.createElementNS(NS, 'defs'), svg.firstChild);
    Object.keys(REGIONS).forEach(function (key) {
      var tile = P.tile(key), k = 1.5, w = tile[0] * k, h = tile[1] * k;
      var pat = document.createElementNS(NS, 'pattern');
      pat.setAttribute('id', 'motif-' + key);
      pat.setAttribute('patternUnits', 'userSpaceOnUse');
      pat.setAttribute('width', w);
      pat.setAttribute('height', h);
      var bg = document.createElementNS(NS, 'rect');
      bg.setAttribute('width', w); bg.setAttribute('height', h); bg.setAttribute('fill', MAP_INK[key]);
      var img = document.createElementNS(NS, 'image');
      img.setAttribute('href', 'data:image/svg+xml,' + encodeURIComponent(P.svg(key, 'tone', '#F3EADB')));
      img.setAttribute('width', w);
      img.setAttribute('height', h);
      img.setAttribute('opacity', '0.42');
      pat.appendChild(bg);
      pat.appendChild(img);
      defs.appendChild(pat);
      var path = svg.querySelector('.rm-region[data-region-key="' + key + '"]');
      if (path) path.setAttribute('fill', 'url(#motif-' + key + ')');
    });
  }

  function initMap() {
    screen = document.getElementById('region-map-screen');
    if (!screen) return;
    paintMap();
    screen.querySelectorAll('.rm-region').forEach(function (p) {
      var key = p.getAttribute('data-region-key');
      p.addEventListener('click', function () { enterRegion(key); });
      p.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); enterRegion(key); }
      });
    });
    // the list under the map: same as tapping the region
    screen.querySelectorAll('.rm-legend [data-region-key]').forEach(function (b) {
      var key = b.getAttribute('data-region-key');
      paint(b.querySelector('.sw'), key, 'full', 0.75);
      b.addEventListener('click', function () { enterRegion(key); });
      var n = Object.keys(CATALOG).filter(function (id) { return CATALOG[id].page && inRegion(CATALOG[id], key); }).length;
      if (n && !b.querySelector('.rm-count')) {
        var c = document.createElement('span'); c.className = 'rm-count';
        var chev = b.querySelector('.chev');
        b.insertBefore(c, chev);
        setT(c, n === 1 ? '1 full experience' : n + ' full experiences', n === 1 ? 'تجربة كاملة' : (n === 2 ? 'تجربتين كاملة' : arNum(n) + ' تجارب كاملة'));
      }
    });
    if (!pickedThisVisit() || window.location.hash === '#map') openMap();
  }

  // ════════════════════════════════════════════════════════════
  // REGION CONTENT (from content.js, the team's heritage spreadsheet)
  // Every experience belongs to a region. In a region you can open only that
  // region's experiences; the rest show as "From <region>".
  // Every experience has a guide page (experience.html?x=<id>) with its story,
  // how it is made / performed / played, materials and occasion. Experiences
  // with a `page` also have the full History, AR and game experience.
  // ════════════════════════════════════════════════════════════
  var DATA = window.CL_CONTENT || { CATEGORIES: {}, ITEMS: {}, HOW: {}, MATERIALS: {} };
  var CATEGORIES = DATA.CATEGORIES;
  var CATALOG = DATA.ITEMS;
  var CAT_ORDER = ['food', 'music', 'games', 'clothing'];

  function inRegion(item, key) {
    return item.regions.indexOf('all') > -1 || item.regions.indexOf(key) > -1;
  }
  function homeKeyOf(item, key) { return item.regions[0] === 'all' ? key : item.regions[0]; }
  function arNum(n) { return String(n).replace(/\d/g, function (x) { return '٠١٢٣٤٥٦٧٨٩'[x]; }); }
  function countAr(n) {
    if (n === 1) return 'تجربة وحدة';
    if (n === 2) return 'تجربتين';
    return arNum(n) + ' تجارب';
  }
  function countEn(n) { return n + (n === 1 ? ' experience' : ' experiences'); }
  // "لـ" + name, joined properly: لـنجد، للحجاز، للمنطقة الشرقية
  function li(nameAr) { return nameAr.indexOf('ال') === 0 ? 'ل' + nameAr.slice(1) : 'لـ' + nameAr; }
  // "the Southern Region", but plain "Najd" and "Hejaz"
  function the(nameEn) { return /Region$/.test(nameEn) ? 'the ' + nameEn : nameEn; }
  function guideURL(id) { return 'experience.html?x=' + encodeURIComponent(id); }
  function metaFor(it) {
    if (it.page) return { en: 'History, AR, game · ' + it.mins + ' min', ar: 'قصة، واقع معزز، لعبة · ' + arNum(it.mins) + ' دقايق' };
    return { en: it.place.en, ar: it.place.ar };
  }

  var KA = window.CLKeyArt || null;
  function progress() { try { return JSON.parse(localStorage.getItem('cl_progress') || '{}'); } catch (e) { return {}; } }
  function starsFor(id) { var p = progress()[id]; return p ? (p.stars || 0) : 0; }
  function starsHTML(n) { if (!n) return ''; var h = '<span class="xp-stars" aria-label="' + n + ' / 3">'; for (var i = 0; i < 3; i++) h += '<i class="' + (i < n ? 'on' : '') + '"></i>'; return h + '</span>'; }

  var CHEVRON = '<svg class="chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg>';
  var LOCK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>';
  var ARROW = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';
  // the viewfinder corners of the logo, around a picture of an experience
  var VF = ['tl', 'tr', 'bl', 'br'].map(function (k) { return '<svg class="vf-c ' + k + '" viewBox="0 0 26 26" aria-hidden="true"><path d="M2 24V2h22"/></svg>'; }).join('');
  // a picture of the experience (its own scene) or, without one, its region's pattern
  function artFor(el, it, hk, alt) {
    if (it.cover) {
      el.innerHTML = '<img src="' + it.cover + '" alt="" loading="lazy" decoding="async">';
      el.classList.remove('is-pattern');
      return true;
    }
    paint(el, hk, 'full', 1);
    el.classList.add('is-pattern');
    return false;
  }

  var toastTimer = null;
  function toast(en, ar) {
    var el = document.getElementById('cl-region-toast');
    if (!el) {
      el = document.createElement('div');
      el.id = 'cl-region-toast';
      el.className = 'cl-toast';
      el.setAttribute('role', 'status');
      document.body.appendChild(el);
    }
    el.textContent = lang() === 'ar' ? ar : en;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.classList.remove('show'); }, 2600);
  }
  function elsewhereToast(home) {
    toast('This one is from ' + the(home.nameEn) + '. Switch to ' + the(home.nameEn) + ' on the map to open it.',
          'هذي التجربة من ' + home.nameAr + '. غيّر منطقتك ' + li(home.nameAr) + ' من الخريطة عشان تفتحها.');
  }

  // offset the motif per item so a list doesn't repeat the same square
  function offsetArt(el, id, hk) {
    var h = 0;
    for (var i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) % 997;
    var tl = P ? P.tile(hk) : [48, 48];
    el.style.backgroundPosition = -(h % tl[0]) + 'px ' + -((h * 7) % tl[1]) + 'px';
  }

  // One experience row (category pages)
  function rowFor(id, key) {
    var it = CATALOG[id];
    var mine = inRegion(it, key);
    var hk = homeKeyOf(it, key), home = REGIONS[hk];
    var a = document.createElement('a');
    a.className = 'xp-row' + (mine ? '' : ' is-locked is-elsewhere');
    a.href = mine ? guideURL(id) : '#';
    a.setAttribute('data-exp', id);
    a.innerHTML =
      '<div class="xp-art"></div>' +
      '<div class="xp-body">' +
        '<div class="xp-status"></div>' +
        '<div class="xp-title"></div>' +
        '<div class="xp-desc"></div>' +
        '<div class="xp-meta"></div>' +
      '</div>' + (mine ? CHEVRON : '<span class="xp-lock">' + LOCK + '</span>');
    var art = a.querySelector('.xp-art');
    if (!artFor(art, it, hk)) {
      offsetArt(art, id, hk);
      if (KA) art.innerHTML = '<span class="xp-glyph">' + KA.glyph(it.cat) + '</span>';
    }
    var st = a.querySelector('.xp-status');
    if (!mine) setT(st, 'From ' + the(home.nameEn), 'من ' + home.nameAr);
    else if (it.page) setT(st, 'Full experience', 'تجربة كاملة');
    else setT(st, 'Story and guide', 'القصة والطريقة');
    setT(a.querySelector('.xp-title'), it.name.en, it.name.ar);
    setT(a.querySelector('.xp-desc'), it.story.en, it.story.ar);
    var m = metaFor(it);
    setT(a.querySelector('.xp-meta'), m.en, m.ar);
    var st2 = mine ? starsFor(id) : 0;
    if (st2) { var me = a.querySelector('.xp-meta'); me.insertAdjacentHTML('beforeend', starsHTML(st2)); me.setAttribute('data-stars', st2); }
    if (!mine) a.addEventListener('click', function (e) { e.preventDefault(); elsewhereToast(home); });
    return a;
  }

  // Category pages (food, music, games, clothing): rows built from CATALOG
  function applyHub(key) {
    var container = document.querySelector('.xp-list[data-category]');
    if (!container) return;
    var cat = container.getAttribute('data-category');
    var region = REGIONS[key];
    var ids = Object.keys(CATALOG).filter(function (id) { return CATALOG[id].cat === cat; });
    var mine = ids.filter(function (id) { return inRegion(CATALOG[id], key); });
    var elsewhere = ids.filter(function (id) { return !inRegion(CATALOG[id], key); });
    mine.sort(function (a, b) { return (CATALOG[b].page ? 1 : 0) - (CATALOG[a].page ? 1 : 0); });
    container.innerHTML = '';
    mine.forEach(function (id) { container.appendChild(rowFor(id, key)); });
    if (!mine.length) {
      var empty = document.createElement('p');
      empty.className = 'xp-empty';
      setT(empty, 'Nothing from ' + the(region.nameEn) + ' in this category yet.', 'ما فيه شي من ' + region.nameAr + ' في هذا القسم للحين.');
      container.appendChild(empty);
    }
    if (elsewhere.length) {
      var h = document.createElement('div');
      h.className = 'sec-label';
      setT(h, 'From other regions', 'من مناطق ثانية');
      container.appendChild(h);
      elsewhere.forEach(function (id) { container.appendChild(rowFor(id, key)); });
    }
    var note = document.querySelector('.hub-note');
    if (note) {
      var n = mine.length;
      setT(note,
        region.nameEn + ': ' + (n ? countEn(n) : 'nothing here yet'),
        region.nameAr + ': ' + (n ? countAr(n) : 'ما فيه شي للحين'));
    }
  }

  // Home: the region's featured experience, the rest of its experiences, and the four categories
  function applyHome(key) {
    var region = REGIONS[key];
    document.querySelectorAll('.cat-row[data-category]').forEach(function (row) {
      var catKey = row.getAttribute('data-category'), cat = CATEGORIES[catKey];
      if (!cat) return;
      var n = Object.keys(CATALOG).filter(function (id) {
        return CATALOG[id].cat === catKey && inRegion(CATALOG[id], key);
      }).length;
      var meta = row.querySelector('.cat-meta');
      row.classList.toggle('is-locked', !n);
      row.href = n ? cat.page : '#';
      row.onclick = n ? null : function (e) {
        e.preventDefault();
        toast('Nothing from ' + the(region.nameEn) + ' in this category yet.', 'ما فيه شي من ' + region.nameAr + ' في هذا القسم للحين.');
      };
      if (meta) {
        if (n) setT(meta, countEn(n), countAr(n));
        else setT(meta, 'Not here yet', 'مو موجود هنا');
      }
    });

    var feat = document.getElementById('home-featured');
    if (!feat) return;
    var ids = Object.keys(CATALOG).filter(function (id) { return inRegion(CATALOG[id], key); });
    ids.sort(function (a, b) { return (CATALOG[b].page ? 1 : 0) - (CATALOG[a].page ? 1 : 0); });
    var pick = ids[0];
    if (!pick) { feat.innerHTML = ''; return; }
    var it = CATALOG[pick], cat = CATEGORIES[it.cat], hk = homeKeyOf(it, key);
    feat.innerHTML =
      '<a class="feat" href="' + guideURL(pick) + '">' +
        '<div class="feat-media"></div>' +
        '<div class="feat-body">' +
          '<div class="feat-kicker"></div>' +
          '<div class="feat-title"></div>' +
          '<div class="feat-desc"></div>' +
          '<div class="feat-foot"><span class="feat-meta"></span><span class="feat-cta"><span></span>' + ARROW + '</span></div>' +
        '</div>' +
      '</a>';
    var media = feat.querySelector('.feat-media');
    if (artFor(media, it, hk)) media.insertAdjacentHTML('beforeend', VF);
    setT(feat.querySelector('.feat-kicker'),
      cat.en + (it.page ? ' · Full experience' : ''),
      cat.ar + (it.page ? ' · تجربة كاملة' : ''));
    setT(feat.querySelector('.feat-title'), it.name.en, it.name.ar);
    setT(feat.querySelector('.feat-desc'), it.story.en, it.story.ar);
    var m = metaFor(it);
    setT(feat.querySelector('.feat-meta'), m.en, m.ar);
    if (starsFor(pick)) feat.querySelector('.feat-meta').insertAdjacentHTML('beforeend', starsHTML(starsFor(pick)));
    setT(feat.querySelector('.feat-cta span'),
      it.page ? (progress()[pick] ? 'Play again' : 'Begin') : 'Read',
      it.page ? (progress()[pick] ? 'العبها مرة ثانية' : 'ابدأ') : 'اقرأ');

    // everything else from this region
    var more = document.getElementById('home-more');
    if (more) {
      var rest = ids.slice(1, 5);
      more.innerHTML = '';
      more.style.display = rest.length ? '' : 'none';
      if (rest.length) {
        var h = document.createElement('h2');
        h.className = 'sec-label';
        setT(h, 'Also in ' + the(region.nameEn), 'كمان في ' + region.nameAr);
        more.appendChild(h);
        var list = document.createElement('div');
        list.className = 'xp-list is-inline';
        rest.forEach(function (id) { list.appendChild(rowFor(id, key)); });
        more.appendChild(list);
      }
    }
  }

  // Guide page (experience.html?x=<id>): everything from the spreadsheet for one experience
  function currentItemId() {
    var m = window.location.search.match(/[?&]x=([^&]+)/);
    return m ? decodeURIComponent(m[1]) : null;
  }

  function applyGuide(key) {
    var root = document.getElementById('guide');
    if (!root) return;
    var id = currentItemId(), it = CATALOG[id];
    if (!it) { window.location.replace('index.html'); return; }
    var hk = homeKeyOf(it, key), cat = CATEGORIES[it.cat];
    var how = DATA.HOW[it.cat], mat = DATA.MATERIALS[it.cat];
    document.title = it.name.en + ' — CultureLens';
    var back = document.querySelector('.cl-header .back-btn');
    if (back) back.href = cat.page;
    // a picture of the experience in the viewfinder, or a wide band of its region's pattern
    paint(root.querySelector('.g-band'), hk, 'full', 1.5);
    var cov = root.querySelector('.g-cover');
    if (it.cover) {
      if (!cov) { cov = document.createElement('div'); cov.className = 'g-cover'; root.insertBefore(cov, root.firstChild); }
      if (cov.getAttribute('data-x') !== id) { cov.innerHTML = '<img src="' + it.cover + '" alt="">' + VF; cov.setAttribute('data-x', id); }
    } else if (cov) cov.remove();
    var gh = root.querySelector('.g-head');
    var old = root.querySelector('.g-path'); if (old) old.remove();
    var oldGo = root.querySelector('.g-go'); if (oldGo) oldGo.remove();
    if (it.page && gh) {
      // a way in right away, under the three parts; the full note stays at the end
      var go = document.createElement('div');
      go.className = 'g-go';
      go.innerHTML = '<a class="btn btn-solid" href="' + it.page + '"><span></span>' + ARROW + '</a>';
      setT(go.querySelector('span'), progress()[id] ? 'Play again' : 'Start the experience', progress()[id] ? 'العبها مرة ثانية' : 'ابدأ التجربة');
      gh.parentNode.insertBefore(go, gh.nextSibling);
      var played = !!progress()[id];
      var path = document.createElement('div');
      path.className = 'g-path';
      var steps = [
        { en: 'History', ar: 'القصة', pen: 'The story behind it', par: 'وش قصتها' },
        { en: it.cat === 'games' ? 'How to play' : it.cat === 'music' ? 'How it is performed' : 'How it is made', ar: it.cat === 'games' ? 'طريقة اللعب' : it.cat === 'music' ? 'طريقة الأداء' : 'التحضير', pen: 'Hands-on, in AR', par: 'بيدك، بالواقع المعزز' },
        { en: 'The game', ar: 'اللعبة', pen: 'Put it to the test', par: 'جرّب نفسك' }
      ];
      path.innerHTML = steps.map(function (st, i) {
        return '<div class="g-step' + (played ? ' is-done' : '') + '"><div class="st-num">' + (lang() === 'ar' ? arNum(i + 1) : (i + 1)) + '</div><div class="st-h"></div><div class="st-p"></div></div>';
      }).join('');
      steps.forEach(function (st, i) {
        var el = path.children[i];
        setT(el.querySelector('.st-h'), st.en, st.ar);
        setT(el.querySelector('.st-p'), st.pen, st.par);
      });
      gh.parentNode.insertBefore(path, gh.nextSibling);
    }
    setT(root.querySelector('.g-cat'), cat.en, cat.ar);
    setT(root.querySelector('.g-title'), it.name.en, it.name.ar);
    setT(root.querySelector('.g-place'), it.place.en, it.place.ar);

    var sections = [
      { t: { en: 'The story', ar: 'القصة' }, b: it.story },
      { t: how, b: it.how },
      { t: mat, b: it.materials },
      it.occasion ? { t: { en: 'When', ar: 'المناسبة' }, b: it.occasion } : null
    ];
    var body = root.querySelector('.g-sections');
    body.innerHTML = '';
    sections.forEach(function (sec, i) {
      if (!sec || !sec.b) return;
      var s = document.createElement('section');
      s.className = 'g-sec';
      s.innerHTML = '<div class="g-num">0' + (i + 1) + '</div><div><h2 class="g-h"></h2><p class="g-p"></p></div>';
      setT(s.querySelector('.g-h'), sec.t.en, sec.t.ar);
      setT(s.querySelector('.g-p'), sec.b.en, sec.b.ar);
      body.appendChild(s);
    });

    var cta = root.querySelector('.g-cta');
    if (it.page) {
      cta.innerHTML =
        '<p class="g-cta-k"></p><h2 class="g-cta-t"></h2><p class="g-cta-p"></p>' +
        '<a class="btn btn-solid g-start" href="' + it.page + '"></a>';
      setT(cta.querySelector('.g-cta-k'), 'Full experience', 'التجربة الكاملة');
      setT(cta.querySelector('.g-cta-t'), 'History, AR, and a game', 'قصة، واقع معزز، ولعبة');
      setT(cta.querySelector('.g-cta-p'), 'About ' + it.mins + ' minutes. Works best on your phone.', 'حوالي ' + arNum(it.mins) + ' دقايق. أحسن على الجوال.');
      setT(cta.querySelector('.g-start'), progress()[id] ? 'Play again' : 'Start the experience', progress()[id] ? 'العبها مرة ثانية' : 'ابدأ التجربة');
      if (starsFor(id)) {
        var best = document.createElement('div'); best.className = 'g-best';
        best.innerHTML = '<span></span>' + starsHTML(starsFor(id));
        setT(best.querySelector('span'), 'Your best', 'أفضل نتيجة لك');
        cta.appendChild(best);
      }
    } else {
      cta.innerHTML = '<p class="g-cta-k"></p><p class="g-cta-p"></p>';
      setT(cta.querySelector('.g-cta-k'), 'Coming next', 'قريباً');
      setT(cta.querySelector('.g-cta-p'),
        'The AR version and the game for ' + it.name.en + ' are on the way.',
        'الواقع المعزز واللعبة حقت ' + it.name.ar + ' جايين في التحديث الجاي.');
    }
  }

  // Experience pages: only open if the experience belongs to the chosen region
  function applyGate(key) {
    var file = currentFile(), item = null;
    if (file === 'experience.html') item = CATALOG[currentItemId()] || null;
    else Object.keys(CATALOG).forEach(function (id) { if (CATALOG[id].page === file) item = CATALOG[id]; });
    var old = document.getElementById('cl-region-gate');
    if (old) old.remove();
    if (!item || inRegion(item, key)) { document.body.style.overflow = ''; return; }
    var homeKey = item.regions[0], home = REGIONS[homeKey], here = REGIONS[key];
    var ar = lang() === 'ar';
    var g = document.createElement('div');
    g.id = 'cl-region-gate';
    g.setAttribute('role', 'dialog');
    g.setAttribute('aria-modal', 'true');
    g.innerHTML =
      '<div class="gate-card">' +
        '<div class="gate-art"></div>' +
        '<div class="gate-body">' +
          '<h2>' + (ar ? 'هذي التجربة من ' + home.nameAr : 'This experience is from ' + the(home.nameEn)) + '</h2>' +
          '<p>' + (ar ? 'أنت الحين تستكشف ' + here.nameAr + '. انتقل ' + li(home.nameAr) + ' عشان تفتحها.'
                      : "You're exploring " + the(here.nameEn) + ' right now. Switch to ' + the(home.nameEn) + ' to open it.') + '</p>' +
          '<button type="button" class="btn btn-solid gate-go">' + (ar ? 'انتقل ' + li(home.nameAr) : 'Switch to ' + the(home.nameEn)) + '</button>' +
          '<button type="button" class="btn btn-ghost gate-back">' + (ar ? 'ارجع' : 'Go back') + '</button>' +
        '</div>' +
      '</div>';
    paint(g.querySelector('.gate-art'), homeKey, 'full', 1.5);
    var go = g.querySelector('.gate-go');
    go.style.background = MAP_INK[homeKey] || home.colors.accent;
    go.style.color = '#F4EEE4';
    go.addEventListener('click', function () {
      remember(homeKey);
      activeKey = homeKey;
      applyTheme(homeKey);
      applyContent();
      applyDialect();
    });
    g.querySelector('.gate-back').addEventListener('click', function () {
      if (document.referrer && history.length > 1) history.back();
      else window.location.href = 'index.html';
    });
    document.body.appendChild(g);
    document.body.style.overflow = 'hidden';
  }

  function applyContent() {
    if (!activeKey || !REGIONS[activeKey]) {
      // opened a guide link without picking a region: show it in its own region
      var it = CATALOG[currentItemId()];
      if (it && currentFile() === 'experience.html') { applyTheme(homeKeyOf(it, 'najd')); applyGuide(homeKeyOf(it, 'najd')); }
      return;
    }
    applyHome(activeKey);
    applyHub(activeKey);
    applyGuide(activeKey);
    applyGate(activeKey);
  }

  function intro() {
    if (currentFile() !== 'index.html' && currentFile() !== '') return;
    var seen = false;
    try { seen = !!sessionStorage.getItem('cl_intro'); sessionStorage.setItem('cl_intro', '1'); } catch (e) { seen = true; }
    if (seen || window.CL_NO_INTRO) return;
    var el = document.createElement('div');
    el.className = 'cl-intro';
    el.setAttribute('aria-hidden', 'true');
    el.innerHTML = '<img class="ci-logo" src="logo.svg" alt=""><div class="ci-by">Threya Studio</div>';
    document.body.appendChild(el);
    var gone = function () { el.classList.add('is-gone'); setTimeout(function () { el.remove(); }, 800); };
    el.addEventListener('click', gone);
    setTimeout(gone, 1900);
  }

  function init() {
    var f = currentFile();
    if (f === 'index.html' || f === '' || PILL_PAGES.indexOf(f) > -1) {
      document.body.classList.add('cl-app');
      var onScroll = function () { document.body.classList.toggle('is-scrolled', window.scrollY > 40); };
      window.addEventListener('scroll', onScroll, { passive: true }); onScroll();
    }
    intro();
    if (activeKey) applyTheme(activeKey);
    initMap();
    applyContent();
    applyDialect();
    document.addEventListener('languageChanged', function () {
      if (activeKey) updateRegionUI(activeKey);
      if (document.getElementById('cl-region-gate')) applyGate(activeKey);
    });
  }

  // Experience pages call this with their own region. The visitor's chosen
  // region wins; the experience's region is only used if none was picked.
  function applyRegionTheme(key) {
    applyTheme(saved() && REGIONS[saved()] ? saved() : key);
  }

  window.ThemeManager = {
    REGIONS: REGIONS,
    CATALOG: CATALOG,
    CATEGORIES: CATEGORIES,
    toast: toast,
    applyRegionTheme: applyRegionTheme,
    selectRegion: selectRegion,
    openMap: openMap,
    applyDialect: applyDialect,
    t: function (k) { return t(k); },
    current: function () { return activeKey; },
    hexToRgba: hexA
  };
  // the header pill and "Change region" buttons call resetRegion()
  window.resetRegion = openMap;

  if (document.body) init();
  else document.addEventListener('DOMContentLoaded', init);
})();
