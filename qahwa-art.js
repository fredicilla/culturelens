/**
 * qahwa-art.js — illustrations for the Saudi Coffee experience
 *
 * Every function returns an SVG string. Shared gradients live in one hidden
 * <svg> (QArt.defs()), injected once into the page, so pieces stay light.
 *
 *   QArt.defs()            shared gradients and patterns (inject once)
 *   QArt.dallah()          brass dallah, as a <g> in a 120x150 box
 *   QArt.najr()            brass mortar with its pestle (#qx-pestle), 120x140 box
 *   QArt.finjan(level)     cup with coffee, level 0..1, 100x80 box
 *   QArt.hearth()          night majlis: hearth, embers, three dallahs, steam
 *   QArt.najrScene()       the najr with three neighbor houses that light up
 *   QArt.terraces()        the coffee terraces of the Jazan mountains
 *   QArt.tools()           the coffee tools on a shelf, each tappable (data-tool)
 *   QArt.fourCups(o)       the four cups: haif, dayf, kayf, sayf (data-cup); o.rtl mirrors the order
 *   QArt.fallback(n, o)    drawn stand-in for a 3D model (dallah, beans, cup) when it can't load
 *   QArt.roast()           mihmas over the fire; bean color from CSS var --bean
 *   QArt.spices()          spice tray, each bowl tappable (data-spice)
 *   QArt.pour()            big finjan for pouring (#qx-pour-fill, #qx-pour-line)
 *   QArt.avatar(o)         seated guest, as a <g> in a 90x110 box
 *   QArt.majlis(guests)    majlis wall, cushions and guests (data-guest)
 */
(function () {
  var uid = 0;
  function id(p) { uid += 1; return p + uid; }

  // ── Shared definitions ──
  function defs() {
    return '' +
      '<svg width="0" height="0" style="position:absolute;width:0;height:0" aria-hidden="true" focusable="false"><defs>' +
        // brass, lit from the upper left
        '<linearGradient id="qa-brass" x1="0" y1="0" x2="1" y2="0">' +
          '<stop offset="0" stop-color="#6E4A1C"/><stop offset=".18" stop-color="#C79A4C"/>' +
          '<stop offset=".34" stop-color="#FFEDBE"/><stop offset=".5" stop-color="#D9AE5E"/>' +
          '<stop offset=".78" stop-color="#9A6D2C"/><stop offset="1" stop-color="#5A3B14"/>' +
        '</linearGradient>' +
        '<linearGradient id="qa-brass-v" x1="0" y1="0" x2="0" y2="1">' +
          '<stop offset="0" stop-color="#FFE7AE"/><stop offset=".5" stop-color="#C99A4A"/><stop offset="1" stop-color="#6A4718"/>' +
        '</linearGradient>' +
        '<linearGradient id="qa-brass-dark" x1="0" y1="0" x2="1" y2="0">' +
          '<stop offset="0" stop-color="#4A3010"/><stop offset=".4" stop-color="#A07434"/><stop offset="1" stop-color="#3E280C"/>' +
        '</linearGradient>' +
        // copper for the najr
        '<linearGradient id="qa-copper" x1="0" y1="0" x2="1" y2="0">' +
          '<stop offset="0" stop-color="#5E2F14"/><stop offset=".22" stop-color="#C27A45"/>' +
          '<stop offset=".38" stop-color="#FFD3A6"/><stop offset=".56" stop-color="#C9824B"/>' +
          '<stop offset="1" stop-color="#4E2510"/>' +
        '</linearGradient>' +
        '<linearGradient id="qa-iron" x1="0" y1="0" x2="0" y2="1">' +
          '<stop offset="0" stop-color="#5B5550"/><stop offset=".5" stop-color="#2E2A27"/><stop offset="1" stop-color="#151311"/>' +
        '</linearGradient>' +
        '<linearGradient id="qa-wood" x1="0" y1="0" x2="0" y2="1">' +
          '<stop offset="0" stop-color="#9A6A40"/><stop offset="1" stop-color="#4E3018"/>' +
        '</linearGradient>' +
        '<linearGradient id="qa-porcelain" x1="0" y1="0" x2="1" y2="0">' +
          '<stop offset="0" stop-color="#BDB3A3"/><stop offset=".3" stop-color="#FFFDF8"/>' +
          '<stop offset=".7" stop-color="#EDE6DA"/><stop offset="1" stop-color="#A89E8D"/>' +
        '</linearGradient>' +
        '<linearGradient id="qa-coffee" x1="0" y1="0" x2="0" y2="1">' +
          '<stop offset="0" stop-color="#D9AE5C"/><stop offset="1" stop-color="#9C6C26"/>' +
        '</linearGradient>' +
        '<linearGradient id="qa-mud" x1="0" y1="0" x2="0" y2="1">' +
          '<stop offset="0" stop-color="#8E6544"/><stop offset="1" stop-color="#5B3D26"/>' +
        '</linearGradient>' +
        '<linearGradient id="qa-thobe" x1="0" y1="0" x2="1" y2="0">' +
          '<stop offset="0" stop-color="#BDB4A5"/><stop offset=".35" stop-color="#FBF8F2"/>' +
          '<stop offset=".7" stop-color="#ECE6DB"/><stop offset="1" stop-color="#B3A998"/>' +
        '</linearGradient>' +
        '<linearGradient id="qa-bisht" x1="0" y1="0" x2="1" y2="0">' +
          '<stop offset="0" stop-color="#2A1A10"/><stop offset=".5" stop-color="#5C3D27"/><stop offset="1" stop-color="#24160D"/>' +
        '</linearGradient>' +
        '<radialGradient id="qa-ember" cx=".5" cy=".5" r=".5">' +
          '<stop offset="0" stop-color="#FFD089"/><stop offset=".35" stop-color="#FF8A35" stop-opacity=".9"/>' +
          '<stop offset="1" stop-color="#C2410C" stop-opacity="0"/>' +
        '</radialGradient>' +
        '<radialGradient id="qa-glow" cx=".5" cy=".5" r=".5">' +
          '<stop offset="0" stop-color="#FFB86B" stop-opacity=".55"/><stop offset="1" stop-color="#FFB86B" stop-opacity="0"/>' +
        '</radialGradient>' +
        '<radialGradient id="qa-shadow" cx=".5" cy=".5" r=".5">' +
          '<stop offset="0" stop-color="#000" stop-opacity=".55"/><stop offset="1" stop-color="#000" stop-opacity="0"/>' +
        '</radialGradient>' +
        '<radialGradient id="qa-bean-roast" cx=".38" cy=".32" r=".75">' +
          '<stop offset="0" stop-color="#E2BC7E"/><stop offset=".45" stop-color="#B3844B"/><stop offset="1" stop-color="#6B4422"/>' +
        '</radialGradient>' +
        '<linearGradient id="qa-flame" x1="0" y1="1" x2="0" y2="0">' +
          '<stop offset="0" stop-color="#FF6A1A"/><stop offset=".6" stop-color="#FFB13B"/><stop offset="1" stop-color="#FFE8A3"/>' +
        '</linearGradient>' +
        // red-and-white shemagh check
        '<pattern id="qa-shemagh" patternUnits="userSpaceOnUse" width="5" height="5">' +
          '<rect width="5" height="5" fill="#F4EEE4"/>' +
          '<path d="M0 0L5 5M5 0L0 5" stroke="#B3282D" stroke-width="1.1"/>' +
        '</pattern>' +
        // Sadu stripe for cushions and the carpet
        '<pattern id="qa-sadu" patternUnits="userSpaceOnUse" width="24" height="14">' +
          '<rect width="24" height="14" fill="#7E2219"/>' +
          '<rect y="0" width="24" height="2" fill="#16100C"/><rect y="12" width="24" height="2" fill="#16100C"/>' +
          '<path d="M0 7 L4 3 L8 7 L4 11 Z M12 7 L16 3 L20 7 L16 11 Z" fill="#EADBC0"/>' +
          '<path d="M8 7 L12 4 L16 7 L12 10 Z M20 7 L24 4 L28 7 L24 10 Z M-4 7 L0 4 L4 7 L0 10 Z" fill="#16100C"/>' +
        '</pattern>' +
        // the Najdi facade motif from patterns.js, for the majlis frieze
        (window.CLPatterns ? '<pattern id="qa-motif-najd" patternUnits="userSpaceOnUse" width="24" height="24"><image width="24" height="24" href="data:image/svg+xml,' + encodeURIComponent(window.CLPatterns.svg('najd', 'full')) + '"/></pattern>' : '<pattern id="qa-motif-najd" width="1" height="1"><rect width="1" height="1" fill="#6F4A2D"/></pattern>') +
        '<filter id="qa-soft" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="3"/></filter>' +
        '<filter id="qa-blur" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="8"/></filter>' +
      '</defs></svg>';
  }

  // ── Dallah: 120 x 150, base at y≈142, spout tip at (6,46) ──
  function dallah() {
    return '' +
      '<g class="qa-dallah">' +
        // handle (behind the body)
        '<path d="M79 66 C101 62 109 82 101 99 C97 107 91 111 86 113" fill="none" stroke="url(#qa-brass-dark)" stroke-width="6.5" stroke-linecap="round"/>' +
        '<path d="M80 65 C99 62 106 80 99 97" fill="none" stroke="#FFE3A1" stroke-opacity=".35" stroke-width="1.5" stroke-linecap="round"/>' +
        // spout
        '<path d="M55 84 C45 78 35 70 27 60 C21 53 15 48.5 6 46.5 L5.5 48.5 C13 51 18.5 55.5 24 63 C31 73 39 86 47 101 Z" fill="url(#qa-brass)"/>' +
        '<path d="M53 82 C43 75 33 67 26 58 C21 52.5 15 49 7 47.2" fill="none" stroke="#FFF2CC" stroke-opacity=".6" stroke-width="1.2"/>' +
        // foot ring
        '<path d="M45 141 Q66 147 87 141 L85 134 Q66 139 47 134 Z" fill="url(#qa-brass-dark)"/>' +
        // belly
        '<path d="M47 134 C29 128 27 104 41 94 C49 88 53.5 86 55.5 80 L76.5 80 C78.5 86 83 88 91 94 C105 104 103 128 85 134 Q66 139 47 134 Z" fill="url(#qa-brass)"/>' +
        // engraved bands
        '<path d="M33 112 Q66 120 99 112" fill="none" stroke="#5E3F14" stroke-opacity=".55" stroke-width="1.1"/>' +
        '<path d="M32.5 118 Q66 126 99.5 118" fill="none" stroke="#5E3F14" stroke-opacity=".55" stroke-width="1.1"/>' +
        '<path d="M44 115.5 l3 -2.6 l3 2.6 l-3 2.6 Z M60 117.6 l3 -2.6 l3 2.6 l-3 2.6 Z M76 117 l3 -2.6 l3 2.6 l-3 2.6 Z" fill="#5E3F14" fill-opacity=".5"/>' +
        // belly highlight
        '<path d="M42 101 C37 109 37 120 43 128" fill="none" stroke="#FFF7DE" stroke-opacity=".7" stroke-width="2.6" stroke-linecap="round"/>' +
        // neck
        '<path d="M55.5 80 C53.5 74 51.5 68 49.5 62 L82.5 62 C80.5 68 78.5 74 76.5 80 Z" fill="url(#qa-brass)"/>' +
        '<path d="M56 79 C54.5 74 53 69 52 64" fill="none" stroke="#FFF2CC" stroke-opacity=".6" stroke-width="1.4"/>' +
        // rim
        '<rect x="47.5" y="57.5" width="37" height="5" rx="2.2" fill="url(#qa-brass-dark)"/>' +
        // lid: dome, collar, finial
        '<path d="M51.5 58 C51.5 50 58 45.5 66 45.5 C74 45.5 80.5 50 80.5 58 Z" fill="url(#qa-brass)"/>' +
        '<rect x="60" y="39.5" width="12" height="6.5" rx="2" fill="url(#qa-brass-dark)"/>' +
        '<path d="M61.6 40 C59.6 34 61.6 28 66 22 C70.4 28 72.4 34 70.4 40 Z" fill="url(#qa-brass)"/>' +
        '<circle cx="66" cy="18.6" r="3.1" fill="url(#qa-brass)"/>' +
        '<path d="M66 9 L67.3 15.8 L64.7 15.8 Z" fill="url(#qa-brass-dark)"/>' +
      '</g>';
  }

  // ── Najr: 120 x 140. Pestle is #qx-pestle (animated by the page) ──
  function najr() {
    return '' +
      '<g class="qa-najr">' +
        '<ellipse cx="60" cy="132" rx="40" ry="6" fill="url(#qa-shadow)"/>' +
        // pestle (drawn first, its lower end sits inside the mortar)
        '<g id="qx-pestle" class="qa-pestle">' +
          '<g transform="rotate(24 60 66)">' +
            '<rect x="55.5" y="-6" width="9" height="82" rx="4.5" fill="url(#qa-copper)"/>' +
            '<ellipse cx="60" cy="-6" rx="7" ry="5.5" fill="url(#qa-copper)"/>' +
            '<rect x="54.5" y="10" width="11" height="3" rx="1.5" fill="#5E2F14" fill-opacity=".6"/>' +
          '</g>' +
        '</g>' +
        // base
        '<path d="M40 116 L80 116 L85 128 L35 128 Z" fill="url(#qa-copper)"/>' +
        '<rect x="33" y="126" width="54" height="5" rx="2" fill="#4E2510"/>' +
        // bowl
        '<path d="M24 60 L96 60 L90 68 C86 92 82 108 74 116 L46 116 C38 108 34 92 30 68 Z" fill="url(#qa-copper)"/>' +
        '<path d="M31 76 Q60 84 89 76" fill="none" stroke="#5E2F14" stroke-opacity=".5" stroke-width="1.2"/>' +
        '<path d="M34 96 Q60 103 86 96" fill="none" stroke="#5E2F14" stroke-opacity=".5" stroke-width="1.2"/>' +
        '<path d="M36 70 C38 90 42 104 48 113" fill="none" stroke="#FFE2C2" stroke-opacity=".7" stroke-width="2.4" stroke-linecap="round"/>' +
        // opening
        '<ellipse cx="60" cy="60" rx="36" ry="6.5" fill="url(#qa-copper)"/>' +
        '<ellipse cx="60" cy="60.6" rx="31" ry="4.4" fill="#2A140A"/>' +
        // the pestle in front of the far rim
        '<g class="qa-pestle-front" opacity="0"></g>' +
      '</g>';
  }

  // ── Finjan: 100 x 80. level 0..1 ──
  function finjan(level, opts) {
    var o = opts || {};
    var lv = Math.max(0, Math.min(1, level || 0));
    var top = 22, bottom = 60, y = bottom - lv * (bottom - top);
    var cid = id('qa-cup-');
    return '' +
      '<g class="qa-finjan">' +
        (o.noShadow ? '' : '<ellipse cx="50" cy="66" rx="30" ry="4.5" fill="url(#qa-shadow)"/>') +
        '<clipPath id="' + cid + '"><path d="M19 21 L81 21 C79 44 69 61 50 61 C31 61 21 44 19 21 Z"/></clipPath>' +
        '<path d="M17 19 L83 19 C81 45 70 63 50 63 C30 63 19 45 17 19 Z" fill="url(#qa-porcelain)"/>' +
        (lv > 0 ? '<g clip-path="url(#' + cid + ')"><rect x="10" y="' + y.toFixed(1) + '" width="80" height="60" fill="url(#qa-coffee)"/>' +
          '<ellipse cx="50" cy="' + y.toFixed(1) + '" rx="31" ry="2.2" fill="#F0CD84" fill-opacity=".7"/></g>' : '') +
        '<ellipse cx="50" cy="19.5" rx="33" ry="4.2" fill="none" stroke="#C9A04E" stroke-width="2.2"/>' +
        '<path d="M24 30 C26 44 33 54 42 58" fill="none" stroke="#FFFFFF" stroke-opacity=".75" stroke-width="2" stroke-linecap="round"/>' +
        '<path d="M22 36 Q50 42 78 36" fill="none" stroke="#2E5788" stroke-opacity=".55" stroke-width="1.4"/>' +
      '</g>';
  }

  // ── Steam wisps (animated by CSS .qa-steam path) ──
  function steam(x, y, s) {
    var k = s || 1;
    return '<g class="qa-steam" transform="translate(' + x + ' ' + y + ') scale(' + k + ')">' +
      '<path d="M0 0 C-6 -10 6 -18 0 -28 C-6 -38 6 -46 0 -56"/>' +
      '<path d="M8 -4 C2 -14 14 -22 8 -32 C2 -42 14 -50 8 -60"/>' +
      '<path d="M-8 -6 C-14 -16 -2 -24 -8 -34 C-14 -44 -2 -52 -8 -62"/>' +
    '</g>';
  }

  function triangleOpenings(x, y, s, fill) {
    var k = s || 1, f = fill || '#0E1420';
    return '<g transform="translate(' + x + ' ' + y + ') scale(' + k + ')">' +
      '<path d="M-6 0 L0 -10 L6 0 Z M-14 13 L-8 3 L-2 13 Z M2 13 L8 3 L14 13 Z" fill="' + f + '"/>' +
    '</g>';
  }

  // ── Cover: the hearth of a Najdi majlis at night (390 x 360) ──
  function hearth() {
    var embers = '';
    for (var i = 0; i < 16; i++) {
      var ex = 120 + (i * 37) % 150, ey = 270 + (i * 13) % 10;
      embers += '<circle class="qa-ember" style="animation-delay:' + (i * 0.23).toFixed(2) + 's" cx="' + ex + '" cy="' + ey + '" r="' + (1.4 + (i % 3) * 0.6) + '" fill="#FFB25E"/>';
    }
    var sparks = '';
    for (var j = 0; j < 7; j++) {
      sparks += '<circle class="qa-spark" style="animation-delay:' + (j * 0.7).toFixed(1) + 's" cx="' + (150 + j * 14) + '" cy="262" r="1.3" fill="#FFD18A"/>';
    }
    return '' +
      '<svg class="qa-scene" viewBox="0 0 390 360" preserveAspectRatio="xMidYMid slice" role="img" aria-label="A Najdi majlis at night: dallahs by the hearth">' +
        '<rect width="390" height="360" fill="#160E0A"/>' +
        '<rect width="390" height="250" fill="url(#qa-mud)" opacity=".28"/>' +
        // wall frieze with triangles
        '<rect x="0" y="34" width="390" height="10" fill="#3A281B"/>' +
        '<g fill="#25180F">' + [0,1,2,3,4,5,6,7,8,9,10,11,12].map(function (n) { return '<path d="M' + (n * 32) + ' 44 l16 14 l16 -14 Z"/>'; }).join('') + '</g>' +
        triangleOpenings(70, 110, 1.6, '#0D1626') + triangleOpenings(320, 110, 1.6, '#0D1626') +
        '<g opacity=".55">' + triangleOpenings(70, 110, 1.6, 'none') + '</g>' +
        // moonlight through openings
        '<path d="M60 94 L80 94 L110 250 L20 250 Z" fill="#9DB6E0" opacity=".04"/>' +
        '<path d="M310 94 L330 94 L370 250 L280 250 Z" fill="#9DB6E0" opacity=".04"/>' +
        // warm glow from the hearth
        '<ellipse cx="195" cy="262" rx="230" ry="150" fill="url(#qa-glow)"/>' +
        // floor and carpet
        '<rect x="0" y="292" width="390" height="68" fill="#1B110B"/>' +
        '<rect x="-10" y="318" width="410" height="16" fill="url(#qa-sadu)" opacity=".85"/>' +
        // hearth block
        '<path d="M80 252 L310 252 L318 296 L72 296 Z" fill="url(#qa-mud)"/>' +
        '<path d="M80 252 L310 252 L312 258 L78 258 Z" fill="#B48A62" opacity=".55"/>' +
        '<ellipse cx="195" cy="266" rx="92" ry="12" fill="#2A120A"/>' +
        '<ellipse cx="195" cy="266" rx="86" ry="10" fill="url(#qa-ember)" class="qa-embers-glow"/>' +
        embers + sparks +
        // three dallahs, small to large
        '<g transform="translate(250 166) scale(.62)">' + dallah() + '</g>' +
        '<g transform="translate(96 150) scale(.72)">' + dallah() + '</g>' +
        '<g transform="translate(150 112) scale(1)">' + dallah() + '</g>' +
        steam(156, 152, .9) +
        // incense burner
        '<g transform="translate(330 248)">' +
          '<path d="M-14 40 L14 40 L10 30 L-10 30 Z" fill="url(#qa-wood)"/>' +
          '<path d="M-12 30 L12 30 L16 10 L-16 10 Z" fill="url(#qa-wood)"/>' +
          '<rect x="-17" y="6" width="34" height="5" rx="2" fill="#C9A04E"/>' +
          '<ellipse cx="0" cy="6" rx="12" ry="3" fill="#FF8A35" class="qa-embers-glow"/>' +
          '<g class="qa-smoke"><path d="M0 4 C-8 -10 8 -20 0 -34 C-8 -48 8 -56 0 -70"/></g>' +
        '</g>' +
      '</svg>';
  }

  // ── Chapter 1: the najr, with neighbor houses that hear it (390 x 300) ──
  function najrScene() {
    function house(x, s, n) {
      return '<g class="qa-house" data-house="' + n + '" transform="translate(' + x + ' 0) scale(' + s + ')">' +
        '<path d="M0 120 L0 70 L60 70 L60 120 Z" fill="#2B1D14"/>' +
        '<g fill="#2B1D14">' + [0,1,2,3,4].map(function (k) { return '<path d="M' + (k * 12) + ' 70 l6 -8 l6 8 Z"/>'; }).join('') + '</g>' +
        '<path class="qa-window" d="M24 98 L30 88 L36 98 Z" fill="#3A2A1E"/>' +
        '<rect class="qa-window" x="10" y="100" width="8" height="12" fill="#3A2A1E"/>' +
        '<rect class="qa-window" x="42" y="100" width="8" height="12" fill="#3A2A1E"/>' +
      '</g>';
    }
    return '' +
      '<svg class="qa-scene" viewBox="0 0 390 300" preserveAspectRatio="xMidYMid slice" role="img" aria-label="A brass najr; tap it to ring">' +
        '<rect width="390" height="300" fill="#130C08"/>' +
        '<g transform="translate(0 70)" opacity=".95">' + house(10, .9, 0) + house(300, 1, 1) + house(345, .7, 2) + '</g>' +
        '<ellipse cx="195" cy="240" rx="170" ry="90" fill="url(#qa-glow)" opacity=".8"/>' +
        '<g class="qa-rings" transform="translate(195 150)">' +
          '<circle class="qa-ring" r="40"/><circle class="qa-ring" r="40"/><circle class="qa-ring" r="40"/>' +
        '</g>' +
        '<g class="qa-najr-hit" transform="translate(135 110) scale(1)">' + najr() + '</g>' +
        '<rect x="0" y="262" width="390" height="38" fill="#1B110B"/>' +
      '</svg>';
  }

  // ── Chapter 2: coffee terraces of the Jazan mountains (390 x 300) ──
  function terraces() {
    var shrubs = '';
    var rows = [[248, 7, 1.15], [222, 8, 1.0], [198, 9, .85], [176, 10, .72], [157, 11, .6]];
    rows.forEach(function (r, ri) {
      for (var i = 0; i < r[1]; i++) {
        var x = 18 + i * (354 / r[1]) + ((ri * 17 + i * 23) % 14), y = r[0] - ((i * 7) % 5), k = r[2] * (0.85 + ((i * 13) % 5) / 14);
        shrubs += '<g transform="translate(' + x.toFixed(0) + ' ' + y + ') scale(' + k.toFixed(2) + ')">' +
          '<ellipse cx="0" cy="2" rx="10" ry="3" fill="#000" opacity=".25"/>' +
          '<ellipse cx="0" cy="-3" rx="9" ry="7" fill="#2C4524"/><ellipse cx="-2" cy="-5" rx="6" ry="4.5" fill="#466639"/>' +
          '<circle cx="3" cy="-2" r="1.7" fill="#C0392B"/><circle cx="-3" cy="0" r="1.5" fill="#A93226"/><circle cx="1" cy="-6" r="1.2" fill="#D35400"/>' +
        '</g>';
      }
    });
    function band(y, c, edge) {
      return '<path d="M0 ' + y + ' Q195 ' + (y - 26) + ' 390 ' + y + ' L390 300 L0 300 Z" fill="' + c + '"/>' +
        '<path d="M0 ' + (y + 3) + ' Q195 ' + (y - 23) + ' 390 ' + (y + 3) + '" stroke="#00000055" stroke-width="4" fill="none"/>' +
        '<path d="M0 ' + y + ' Q195 ' + (y - 26) + ' 390 ' + y + '" stroke="' + edge + '" stroke-width="2" fill="none"/>';
    }
    return '' +
      '<svg class="qa-scene" viewBox="0 0 390 300" preserveAspectRatio="xMidYMid slice" role="img" aria-label="Coffee terraces on the mountains of Jazan">' +
        '<defs><linearGradient id="qa-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#141B28"/><stop offset=".55" stop-color="#4E3D35"/><stop offset="1" stop-color="#C7905A"/></linearGradient></defs>' +
        '<rect width="390" height="300" fill="url(#qa-sky)"/>' +
        '<circle cx="300" cy="70" r="20" fill="#FFDDA8" opacity=".9"/>' +
        '<circle cx="300" cy="70" r="48" fill="#FFDDA8" opacity=".1"/>' +
        '<path d="M0 132 L48 96 L96 118 L150 64 L206 104 L258 72 L318 110 L390 84 L390 300 L0 300 Z" fill="#262732"/>' +
        '<path d="M0 150 L70 116 L130 140 L200 100 L280 136 L340 112 L390 128 L390 300 L0 300 Z" fill="#30302F"/>' +
        '<g class="qa-mist"><ellipse cx="110" cy="132" rx="150" ry="12" fill="#E8DCCB" opacity=".1"/></g>' +
        band(160, '#455030', '#7F7A58') + band(180, '#4E5934', '#8C8460') + band(202, '#475332', '#7F7A58') +
        band(226, '#525E37', '#8C8460') + band(252, '#48542F', '#7F7A58') +
        shrubs +
        '<g class="qa-mist"><ellipse cx="300" cy="196" rx="150" ry="13" fill="#E8DCCB" opacity=".08"/></g>' +
      '</svg>';
  }

  // ── Small tools for the shelf (each in its own box) ──
  function mihmasSmall() {
    return '<g>' +
      '<ellipse cx="44" cy="62" rx="34" ry="5" fill="url(#qa-shadow)"/>' +
      '<path d="M8 44 Q44 64 80 44 L76 52 Q44 70 12 52 Z" fill="url(#qa-iron)"/>' +
      '<ellipse cx="44" cy="44" rx="36" ry="9" fill="#3A3430"/><ellipse cx="44" cy="45" rx="31" ry="6.5" fill="#1E1A17"/>' +
      '<g fill="#C9A15A"><ellipse cx="34" cy="45" rx="3.2" ry="2"/><ellipse cx="44" cy="44" rx="3.2" ry="2"/><ellipse cx="53" cy="46" rx="3.2" ry="2"/><ellipse cx="40" cy="47" rx="3.2" ry="2"/></g>' +
      '<path d="M78 42 L130 22" stroke="url(#qa-iron)" stroke-width="5" stroke-linecap="round"/>' +
    '</g>';
  }
  function mubarridSmall() {
    return '<g>' +
      '<ellipse cx="56" cy="62" rx="44" ry="5" fill="url(#qa-shadow)"/>' +
      '<path d="M10 46 Q56 66 102 46 L96 54 Q56 72 16 54 Z" fill="url(#qa-wood)"/>' +
      '<ellipse cx="56" cy="46" rx="46" ry="10" fill="#8A5E37"/><ellipse cx="56" cy="47" rx="40" ry="7" fill="#5E3C22"/>' +
      '<g fill="#B88B52"><ellipse cx="44" cy="47" rx="3.2" ry="2"/><ellipse cx="54" cy="46" rx="3.2" ry="2"/><ellipse cx="63" cy="48" rx="3.2" ry="2"/><ellipse cx="70" cy="46" rx="3.2" ry="2"/><ellipse cx="50" cy="49" rx="3.2" ry="2"/></g>' +
      '<path d="M100 44 L124 36" stroke="#6E4A2B" stroke-width="6" stroke-linecap="round"/>' +
    '</g>';
  }
  function cupsSmall() {
    return '<g>' +
      '<g transform="translate(0 6) scale(.62)">' + finjan(0, { noShadow: true }) + '</g>' +
      '<g transform="translate(36 6) scale(.62)">' + finjan(0, { noShadow: true }) + '</g>' +
      '<g transform="translate(18 -10) scale(.62)">' + finjan(0, { noShadow: true }) + '</g>' +
    '</g>';
  }

  // ── Chapter 3: the tools on a shelf (390 x 260) ──
  function tools() {
    function slot(key, x, y, inner, w, h) {
      return '<g class="qa-tool" data-tool="' + key + '" tabindex="0" role="button" transform="translate(' + x + ' ' + y + ')">' +
        '<rect class="qa-tool-hit" x="-6" y="-8" width="' + w + '" height="' + h + '" rx="12" fill="transparent"/><g class="qa-tool-art">' + inner + '</g></g>';
    }
    return '' +
      '<svg class="qa-scene" viewBox="0 0 390 260" preserveAspectRatio="xMidYMid meet" role="group" aria-label="The coffee tools">' +
        '<rect width="390" height="260" fill="#140D09"/>' +
        '<ellipse cx="195" cy="130" rx="220" ry="140" fill="url(#qa-glow)" opacity=".45"/>' +
        // two shelves
        '<rect x="10" y="116" width="370" height="10" rx="2" fill="url(#qa-wood)"/>' +
        '<rect x="10" y="236" width="370" height="10" rx="2" fill="url(#qa-wood)"/>' +
        '<rect x="10" y="126" width="370" height="6" fill="#000" opacity=".35"/>' +
        '<rect x="10" y="246" width="370" height="6" fill="#000" opacity=".35"/>' +
        slot('mihmas', 18, 52, mihmasSmall(), 140, 70) +
        slot('mubarrid', 180, 56, mubarridSmall(), 140, 66) +
        slot('najr', 34, 128, '<g transform="scale(.82)">' + najr() + '</g>', 100, 112) +
        slot('dallah', 160, 126, '<g transform="scale(.76)">' + dallah() + '</g>', 92, 116) +
        slot('finjan', 268, 172, '<g transform="scale(1.1)">' + cupsSmall() + '</g>', 100, 70) +
      '</svg>';
  }

  // ── Chapter 4: the four cups (390 x 200) ──
  function fourCups(opts) {
    var levels = [0.25, 0.25, 0.25, 0.25];
    var rtl = !!(opts && opts.rtl), fmt = (opts && opts.num) || String;
    return '' +
      '<svg class="qa-scene" viewBox="0 0 390 200" preserveAspectRatio="xMidYMid meet" role="group" aria-label="The four cups">' +
        '<rect width="390" height="200" fill="#140D09"/>' +
        '<ellipse cx="195" cy="120" rx="210" ry="110" fill="url(#qa-glow)" opacity=".45"/>' +
        '<rect x="0" y="146" width="390" height="54" fill="#1B110B"/>' +
        '<rect x="-10" y="162" width="410" height="12" fill="url(#qa-sadu)" opacity=".7"/>' +
        [0, 1, 2, 3].map(function (n) {
          var x = 18 + (rtl ? 3 - n : n) * 92;   // first cup on the reader's starting side
          return '<g class="qa-cup" data-cup="' + n + '" tabindex="0" role="button" transform="translate(' + x + ' 72)">' +
            '<rect x="-4" y="-30" width="96" height="110" rx="12" fill="transparent"/>' +
            '<g class="qa-cup-art"><g transform="scale(.88)">' + finjan(levels[n]) + '</g></g>' +
            '<text class="qa-cup-num" x="44" y="-10" text-anchor="middle">' + fmt(n + 1) + '</text>' +
          '</g>';
        }).join('') +
      '</svg>';
  }

  // ── Drawn stand-ins for the 3D models, used when a model can't load (offline, slow network).
  //    Returns HTML for the stage: the object sits on the table, labels are optional. ──
  function fallback(name, opts) {
    var o = opts || {}, lb = o.labels;
    var hot = function (k, x, y, cls) {
      return lb && lb[k] ? '<div class="qx-hot' + (cls ? ' ' + cls : '') + '" style="left:' + x + '%;top:' + y + '%"><i></i><span>' + lb[k] + '</span></div>' : '';
    };
    if (/beans/.test(name)) {
      // a small mound of golden Najdi-roast beans, back rows first
      var rows = [[40, [70, 98]], [52, [50, 76, 102, 124]], [66, [32, 56, 82, 108, 134]], [80, [18, 42, 66, 90, 114, 138, 156]]];
      var beans = '';
      rows.forEach(function (r, ri) {
        r[1].forEach(function (x, i) {
          var rot = ((ri * 47 + i * 71) % 120) - 60;
          beans += '<g transform="translate(' + x + ' ' + r[0] + ') rotate(' + rot + ')">' +
            '<ellipse rx="10.5" ry="7" fill="url(#qa-bean-roast)"/>' +
            '<path d="M-8.4 0.8 C-4.5 -1.8 -1.2 2.4 2.6 -0.4 C5.2 -2.2 7.2 -0.7 8.8 0.4" fill="none" stroke="#3B220F" stroke-opacity=".75" stroke-width="1.4" stroke-linecap="round"/>' +
            '<ellipse cx="-3.4" cy="-3.2" rx="4.2" ry="1.6" fill="#FFF3D6" fill-opacity=".28"/>' +
          '</g>';
        });
      });
      return '<div class="qx-fallback is-beans" style="aspect-ratio:174/100">' +
        '<svg viewBox="0 0 174 100" aria-hidden="true"><ellipse cx="87" cy="90" rx="84" ry="9" fill="url(#qa-shadow)"/>' + beans + '</svg></div>';
    }
    if (/cup/.test(name)) {
      return '<div class="qx-fallback is-cup" style="aspect-ratio:80/60">' +
        '<svg viewBox="10 12 80 60" aria-hidden="true">' + finjan(0.25) + '</svg></div>';
    }
    // the dallah, with its parts named on the steps that teach them
    return '<div class="qx-fallback is-dallah' + (lb ? ' has-labels' : '') + '" style="aspect-ratio:120/142">' +
      '<svg viewBox="0 6 120 142" aria-hidden="true"><ellipse cx="66" cy="143" rx="34" ry="4.5" fill="url(#qa-shadow)"/>' + dallah() + '</svg>' +
      hot('spout', 6, 30, 'to-left wrap') + hot('lid', 55, 31) + hot('handle', 87, 58) +
    '</div>';
  }

  // ── Step: roasting in the mihmas (390 x 300). Bean color = CSS var(--bean) ──
  function roast() {
    var beans = '';
    var pos = [[150,150,10],[170,146,-20],[190,152,30],[210,147,0],[230,151,-35],[160,162,45],[180,160,-10],[200,163,20],[220,160,-25],[240,158,15],[170,172,-40],[192,174,5],[214,171,35],[150,174,-15],[235,170,25]];
    pos.forEach(function (p) {
      beans += '<g transform="translate(' + p[0] + ' ' + p[1] + ') rotate(' + p[2] + ')">' +
        '<ellipse rx="8" ry="5.2" class="qa-bean"/>' +
        '<path d="M-6 0.4 Q0 -1.6 6 0.4" stroke="#000" stroke-opacity=".35" stroke-width="1.1" fill="none"/>' +
        '<ellipse cx="-2" cy="-2" rx="3" ry="1.4" fill="#fff" fill-opacity=".18"/>' +
      '</g>';
    });
    return '' +
      '<svg class="qa-scene qa-roast" viewBox="0 0 390 300" preserveAspectRatio="xMidYMid slice" role="img" aria-label="Beans roasting in the mihmas">' +
        '<rect width="390" height="300" fill="#120B08"/>' +
        '<ellipse cx="195" cy="230" rx="200" ry="120" fill="url(#qa-glow)"/>' +
        // fire
        '<ellipse cx="195" cy="250" rx="90" ry="14" fill="url(#qa-ember)" class="qa-embers-glow"/>' +
        '<g class="qa-flames" transform="translate(195 248)">' +
          '<path class="qa-flame f1" d="M-40 0 C-50 -24 -30 -34 -34 -56 C-18 -40 -16 -22 -20 0 Z" fill="url(#qa-flame)"/>' +
          '<path class="qa-flame f2" d="M-10 0 C-22 -30 4 -44 -2 -74 C18 -50 16 -24 12 0 Z" fill="url(#qa-flame)"/>' +
          '<path class="qa-flame f3" d="M24 0 C16 -22 34 -32 30 -52 C46 -36 46 -18 42 0 Z" fill="url(#qa-flame)"/>' +
        '</g>' +
        // mihmas
        '<g class="qa-mihmas">' +
          '<path d="M100 150 Q195 206 290 150 L282 168 Q195 222 108 168 Z" fill="url(#qa-iron)"/>' +
          '<ellipse cx="195" cy="150" rx="96" ry="22" fill="#3A3430"/>' +
          '<ellipse cx="195" cy="152" rx="86" ry="17" fill="#1C1815"/>' +
          beans +
          '<path d="M286 146 L380 110" stroke="url(#qa-iron)" stroke-width="7" stroke-linecap="round"/>' +
        '</g>' +
        // stirring rod
        '<g class="qa-stir"><path d="M120 120 L250 168" stroke="#7A5532" stroke-width="5" stroke-linecap="round"/></g>' +
        '<g class="qa-roast-smoke">' + steam(195, 130, .8) + '</g>' +
      '</svg>';
  }

  // ── Step: the spice tray (390 x 260) ──
  function spices() {
    function bowl(key, x, inner) {
      return '<g class="qa-spice" data-spice="' + key + '" tabindex="0" role="button" transform="translate(' + x + ' 120)">' +
        '<rect x="-36" y="-56" width="72" height="122" rx="14" fill="transparent"/>' +
        '<g class="qa-spice-art">' +
        '<ellipse cx="0" cy="40" rx="32" ry="6" fill="url(#qa-shadow)"/>' +
        '<path d="M-30 4 Q0 46 30 4 Z" fill="url(#qa-porcelain)"/>' +
        '<ellipse cx="0" cy="4" rx="30" ry="8" fill="#F4EEE4"/>' +
        '<ellipse cx="0" cy="5" rx="26" ry="5.5" fill="#2A2018"/>' +
        inner +
        '<g transform="translate(22 -22)"><g class="qa-check"><circle r="10"/><path d="M-4.5 0 L-1 3.5 L5 -3.5"/></g></g>' +
        '</g>' +
      '</g>';
    }
    var cardamom = '<g>' + [[-12,2,20],[-3,0,-15],[7,3,30],[14,1,-5],[0,5,10]].map(function (p) {
      return '<ellipse cx="' + p[0] + '" cy="' + p[1] + '" rx="6" ry="3.4" transform="rotate(' + p[2] + ' ' + p[0] + ' ' + p[1] + ')" fill="#8AA155" stroke="#5E7336" stroke-width=".8"/>';
    }).join('') + '</g>';
    var cloves = '<g stroke="#4A2614" stroke-width="2.2" stroke-linecap="round">' + [[-12,3,-30],[-2,1,20],[8,4,-60],[14,0,40],[2,5,80]].map(function (p) {
      return '<g transform="translate(' + p[0] + ' ' + p[1] + ') rotate(' + p[2] + ')"><path d="M0 -4 L0 5"/><circle cy="-5" r="2.2" fill="#5A2E18" stroke="none"/></g>';
    }).join('') + '</g>';
    var saffron = '<g stroke="#C0261B" stroke-width="1.4" stroke-linecap="round" fill="none">' +
      '<path d="M-14 4 q6 -6 12 -2"/><path d="M-6 2 q8 -4 14 2"/><path d="M2 5 q6 -6 12 -3"/><path d="M-10 6 q6 -2 10 -6"/><path d="M4 0 q4 4 10 2"/>' +
    '</g>';
    var sugar = '<g fill="#FFFFFF" stroke="#D8D2C8" stroke-width=".6">' +
      '<rect x="-14" y="-3" width="9" height="8" rx="1"/><rect x="-3" y="-5" width="9" height="8" rx="1"/><rect x="7" y="-2" width="9" height="8" rx="1"/>' +
    '</g>';
    var milk = '<g transform="translate(0 -6)">' +
      '<path d="M-10 10 L-8 -14 L8 -14 L10 10 Z" fill="#F7F4EE" stroke="#CFC8BC" stroke-width=".8"/>' +
      '<path d="M8 -12 L14 -16 L12 -10 Z" fill="#F7F4EE"/><rect x="-8" y="-6" width="16" height="4" fill="#5C8FC9" opacity=".6"/>' +
    '</g>';
    return '' +
      '<svg class="qa-scene" viewBox="0 0 390 260" preserveAspectRatio="xMidYMid meet" role="group" aria-label="Spice tray">' +
        '<rect width="390" height="260" fill="#140D09"/>' +
        '<ellipse cx="195" cy="150" rx="210" ry="120" fill="url(#qa-glow)" opacity=".5"/>' +
        '<ellipse cx="195" cy="168" rx="190" ry="34" fill="url(#qa-brass)" opacity=".9"/>' +
        '<ellipse cx="195" cy="166" rx="180" ry="29" fill="#2A1C10" opacity=".5"/>' +
        bowl('cardamom', 47, cardamom) + bowl('cloves', 121, cloves) + bowl('saffron', 195, saffron) +
        bowl('sugar', 269, sugar) + bowl('milk', 343, milk) +
      '</svg>';
  }

  // ── Step: pouring (390 x 300). Fill is #qx-pour-fill, set by the page ──
  function pour() {
    return '' +
      '<svg class="qa-scene qa-pour" viewBox="0 0 390 300" preserveAspectRatio="xMidYMid slice" role="img" aria-label="Pouring coffee into a finjan">' +
        '<rect width="390" height="300" fill="#120B08"/>' +
        '<ellipse cx="195" cy="250" rx="200" ry="120" fill="url(#qa-glow)"/>' +
        '<rect x="0" y="262" width="390" height="38" fill="#1B110B"/>' +
        // dallah, tilted toward the cup
        '<g class="qa-pour-dallah" transform="translate(150 24) rotate(-28 66 90) scale(.95)">' + dallah() + '</g>' +
        '<path class="qa-stream" d="M150 92 C150 130 166 160 172 182" stroke="url(#qa-coffee)" stroke-width="4" fill="none" stroke-linecap="round"/>' +
        // big cup
        '<g transform="translate(95 150) scale(2)">' +
          '<ellipse cx="50" cy="66" rx="30" ry="4.5" fill="url(#qa-shadow)"/>' +
          '<clipPath id="qx-pour-clip"><path d="M19 21 L81 21 C79 44 69 61 50 61 C31 61 21 44 19 21 Z"/></clipPath>' +
          '<path d="M17 19 L83 19 C81 45 70 63 50 63 C30 63 19 45 17 19 Z" fill="url(#qa-porcelain)"/>' +
          '<g clip-path="url(#qx-pour-clip)">' +
            '<rect id="qx-pour-fill" x="10" y="61" width="80" height="60" fill="url(#qa-coffee)"/>' +
            '<ellipse id="qx-pour-surface" cx="50" cy="61" rx="31" ry="2.2" fill="#F0CD84" fill-opacity=".7"/>' +
          '</g>' +
          '<path id="qx-pour-line" d="M22 50.5 L78 50.5" stroke="#FFFFFF" stroke-opacity=".7" stroke-width=".8" stroke-dasharray="2 2"/>' +
          '<ellipse cx="50" cy="19.5" rx="33" ry="4.2" fill="none" stroke="#C9A04E" stroke-width="2.2"/>' +
          '<path d="M24 30 C26 44 33 54 42 58" fill="none" stroke="#FFFFFF" stroke-opacity=".6" stroke-width="2" stroke-linecap="round"/>' +
        '</g>' +
        // dates on a small plate
        '<g transform="translate(300 236)">' +
          '<ellipse cx="0" cy="12" rx="40" ry="8" fill="#C9A04E" opacity=".8"/><ellipse cx="0" cy="10" rx="34" ry="6" fill="#E9DFC9"/>' +
          '<ellipse cx="-12" cy="5" rx="9" ry="5" fill="#5A2414"/><ellipse cx="6" cy="4" rx="9" ry="5" fill="#6B2C18"/><ellipse cx="-2" cy="-1" rx="9" ry="5" fill="#4E1E10"/>' +
          '<ellipse cx="-4" cy="-3" rx="4" ry="1.4" fill="#fff" fill-opacity=".2"/>' +
        '</g>' +
      '</svg>';
  }

  // ── Seated guest (faceless), 90 x 110 ──
  function avatar(o) {
    var skin = o.skin || '#B07A52';
    var head = o.ghutrah === 'red' ? 'url(#qa-shemagh)' : '#F5F1EA';
    var beard = '';
    if (o.beard === 'grey') beard = '<path d="M33 41 C33 56 39 63 45 63 C51 63 57 56 57 41 C54 48 50 51 45 51 C40 51 36 48 33 41 Z" fill="#D8D4CC"/><path d="M39 47 Q45 44 51 47" stroke="#C8C3BA" stroke-width="2.2" fill="none" stroke-linecap="round"/>';
    else if (o.beard === 'black') beard = '<path d="M34 42 C34 53 39 58 45 58 C51 58 56 53 56 42 C53 47 50 49 45 49 C40 49 37 47 34 42 Z" fill="#1C1612"/><path d="M39 46.5 Q45 44 51 46.5" stroke="#1C1612" stroke-width="2.2" fill="none" stroke-linecap="round"/>';
    else if (o.beard === 'short') beard = '<path d="M35 44 C36 51 40 54 45 54 C50 54 54 51 55 44 C52 48 49 49.5 45 49.5 C41 49.5 38 48 35 44 Z" fill="#2A211B" fill-opacity=".85"/><path d="M40 46.5 Q45 44.5 50 46.5" stroke="#2A211B" stroke-width="1.8" fill="none" stroke-linecap="round"/>';
    var bisht = o.bisht ? '<path d="M6 110 C6 84 16 72 30 68 L37 110 Z" fill="url(#qa-bisht)"/><path d="M84 110 C84 84 74 72 60 68 L53 110 Z" fill="url(#qa-bisht)"/>' +
      '<path d="M30 68 L37 110 M60 68 L53 110" stroke="#D4AF5A" stroke-width="1.8" fill="none"/>' : '';
    return '' +
      '<g class="qa-avatar">' +
        '<path d="M8 110 C8 82 22 67 45 67 C68 67 82 82 82 110 Z" fill="url(#qa-thobe)"/>' +
        '<path d="M45 70 L45 92" stroke="#C9C0B0" stroke-width="1.2"/>' +
        bisht +
        '<rect x="39" y="52" width="12" height="16" rx="5" fill="' + skin + '"/>' +
        '<ellipse cx="45" cy="40" rx="12" ry="15" fill="' + skin + '"/>' +
        '<path d="M50 30 C55 36 56 46 52 53" stroke="#000" stroke-opacity=".12" stroke-width="5" fill="none" stroke-linecap="round"/>' +
        beard +
        '<path d="M45 13 C30 13 25.5 25 26.5 40 C27 54 24 66 17 77 L30 73 C33 61 33 49 33 40 C33 30 38 23.5 45 23.5 C52 23.5 57 30 57 40 C57 49 57 61 60 73 L73 77 C66 66 63 54 63.5 40 C64.5 25 60 13 45 13 Z" fill="' + head + '"/>' +
        '<path d="M45 13 C30 13 25.5 25 26.5 40" stroke="#000" stroke-opacity=".08" stroke-width="2" fill="none"/>' +
        '<ellipse cx="45" cy="19.5" rx="14.5" ry="4.2" fill="none" stroke="#141110" stroke-width="2.6"/>' +
        '<ellipse cx="45" cy="23" rx="15" ry="4.2" fill="none" stroke="#141110" stroke-width="2.6"/>' +
        '<g transform="translate(52 76)"><g class="qa-held" opacity="0">' +
          '<g transform="scale(.36)">' + finjan(0.25, { noShadow: true }) + '</g>' +
          '<circle cx="12" cy="24" r="6" fill="' + skin + '"/>' +
        '</g></g>' +
      '</g>';
  }

  // ── Game: the majlis with seated guests (390 x 300) ──
  function majlis(guests) {
    var xs = [8, 102, 196, 290];
    var seats = guests.map(function (g, i) {
      return '<g class="qa-guest" data-guest="' + g.key + '" tabindex="0" role="button" transform="translate(' + xs[i] + ' 120)">' +
        '<ellipse class="qa-guest-ring" cx="46" cy="114" rx="40" ry="9"/>' +
        '<g class="qa-guest-body">' + avatar(g) + '</g>' +
      '</g>';
    }).join('');
    return '' +
      '<svg class="qa-scene qa-majlis" viewBox="0 0 390 300" preserveAspectRatio="xMidYMid slice" role="group" aria-label="Your majlis and your guests">' +
        '<rect width="390" height="300" fill="#1A110B"/>' +
        '<rect width="390" height="230" fill="url(#qa-mud)" opacity=".42"/>' +
        '<rect x="0" y="22" width="390" height="16" fill="url(#qa-motif-najd)" opacity=".55"/>' +
        '<rect x="0" y="38" width="390" height="3" fill="#2A1B12"/>' +
        triangleOpenings(48, 92, 1.4, '#0D1626') + triangleOpenings(195, 82, 1.4, '#0D1626') + triangleOpenings(342, 92, 1.4, '#0D1626') +
        '<ellipse cx="195" cy="210" rx="250" ry="140" fill="url(#qa-glow)" opacity=".7"/>' +
        // back cushions
        '<rect x="0" y="176" width="390" height="40" rx="6" fill="url(#qa-sadu)" opacity=".9"/>' +
        '<rect x="0" y="176" width="390" height="40" fill="#000" opacity=".25"/>' +
        // seat
        '<rect x="0" y="216" width="390" height="22" fill="#5B2A1C"/>' +
        '<rect x="0" y="216" width="390" height="3" fill="#8A4A32"/>' +
        // floor carpet
        '<rect x="0" y="238" width="390" height="62" fill="#26150E"/>' +
        '<rect x="-10" y="262" width="410" height="14" fill="url(#qa-sadu)" opacity=".75"/>' +
        seats +
      '</svg>';
  }

  window.QArt = {
    defs: defs, dallah: dallah, najr: najr, finjan: finjan,
    hearth: hearth, najrScene: najrScene, terraces: terraces, tools: tools, fourCups: fourCups, fallback: fallback,
    roast: roast, spices: spices, pour: pour, avatar: avatar, majlis: majlis
  };
})();
