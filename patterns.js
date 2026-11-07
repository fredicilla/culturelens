/**
 * patterns.js — CultureLens regional motifs
 *
 * Each region's pattern is drawn from a real tradition of that region:
 *   najd      Najdi mud-brick facade: shurfat (triangular crenellations), the engraved
 *             strip of inverted triangles under them, and furjat (triangular openings)
 *   hejaz     Roshan / mashrabiya: the turned-wood lattice screens of old Jeddah
 *   eastern   Naqsh al-jiss: carved gypsum star-and-cross panels of Al-Ahsa
 *   southern  Al-Qatt Al-Asiri: bands of triangles, checks and zigzags painted by Asiri women
 *   northern  Al-Sadu: Bedouin weaving bands of black, madder red and ivory,
 *             with "teeth" rows and diamond "eyes"
 *
 * CLPatterns.svg(region, mode)  -> SVG string for one tile
 * CLPatterns.url(region, mode)  -> CSS url("data:...") for background-image
 * CLPatterns.size(region)       -> CSS background-size for one tile
 *   mode 'full' = traditional colors, 'tone' = one accent color on transparent (for quiet backgrounds)
 */
(function () {
  var PALETTES = {
    najd:     { bg: '#B98D62', a: '#6F4A2D', b: '#D8B78F', c: '#8C3B24', d: '#4E331F' },
    hejaz:    { bg: '#22170F', a: '#8C5B35', b: '#B07A4C', c: '#3E9A8A', d: '#5E3B22' },
    eastern:  { bg: '#C9BBA2', a: '#ECE4D6', b: '#A89A82', c: '#7F735F', d: '#DDD2BF' },
    southern: { bg: '#EEE6D5', a: '#B9392E', b: '#D9A339', c: '#3F7D4D', d: '#2E5788', k: '#1B1714' },
    northern: { bg: '#1D1713', a: '#9E2C24', b: '#ECE2CE', c: '#6E4B33', d: '#C9893B', k: '#120E0B' }
  };

  var TILE = { najd: [48, 48], hejaz: [24, 24], eastern: [48, 48], southern: [48, 64], northern: [48, 56] };

  function hexA(hex, a) {
    var n = parseInt(hex.replace('#', ''), 16);
    return 'rgba(' + ((n >> 16) & 255) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',' + a + ')';
  }

  // One accent color at different strengths, on a transparent tile
  function tonePalette(accent) {
    return { bg: 'none', a: hexA(accent, 0.34), b: hexA(accent, 0.16), c: hexA(accent, 0.5), d: hexA(accent, 0.24), k: hexA(accent, 0.42) };
  }

  function rect(x, y, w, h, f) { return "<rect x='" + x + "' y='" + y + "' width='" + w + "' height='" + h + "' fill='" + f + "'/>"; }
  function poly(pts, f) { return "<polygon points='" + pts + "' fill='" + f + "'/>"; }

  var DRAW = {
    najd: function (p) {
      var s = '';
      // shurfat: triangular crenellations along the top of the wall
      for (var x = 0; x < 48; x += 12) s += poly(x + ',11 ' + (x + 6) + ',1 ' + (x + 12) + ',11', p.a);
      s += rect(0, 11, 48, 2, p.d);
      // engraved strip of inverted triangles under the crenellations
      for (x = 0; x < 48; x += 6) s += poly(x + ',15 ' + (x + 6) + ',15 ' + (x + 3) + ',19', p.a);
      s += rect(0, 21, 48, 1, p.b);
      // furjat: clusters of triangular openings (two below, one above)
      [[12, 30], [36, 40]].forEach(function (c) {
        var cx = c[0], cy = c[1];
        s += poly((cx - 3) + ',' + (cy - 1) + ' ' + cx + ',' + (cy - 6) + ' ' + (cx + 3) + ',' + (cy - 1), p.d);
        s += poly((cx - 7) + ',' + (cy + 6) + ' ' + (cx - 4) + ',' + (cy + 1) + ' ' + (cx - 1) + ',' + (cy + 6), p.d);
        s += poly((cx + 1) + ',' + (cy + 6) + ' ' + (cx + 4) + ',' + (cy + 1) + ' ' + (cx + 7) + ',' + (cy + 6), p.d);
      });
      // painted door accent: small diamonds
      s += poly('36,24 39,27 36,30 33,27', p.c) + poly('12,42 15,45 12,48 9,45', p.c);
      return s;
    },
    hejaz: function (p) {
      // roshan lattice: diagonal turned-wood bars with square nodes and round beads
      var s = '';
      s += "<path d='M-2,-2 L26,26 M26,-2 L-2,26' stroke='" + p.a + "' stroke-width='3'/>";
      s += "<path d='M-2,10 L10,-2 M14,26 L26,14 M-2,14 L10,26 M14,-2 L26,10' stroke='" + p.a + "' stroke-width='3'/>";
      s += poly('12,8 16,12 12,16 8,12', p.b);
      ['0,0', '24,0', '0,24', '24,24', '12,0', '0,12', '24,12', '12,24'].forEach(function (pt) {
        var xy = pt.split(',');
        s += "<rect x='" + (xy[0] - 2) + "' y='" + (xy[1] - 2) + "' width='4' height='4' transform='rotate(45 " + xy[0] + ' ' + xy[1] + ")' fill='" + p.b + "'/>";
      });
      s += "<circle cx='6' cy='6' r='1.6' fill='" + p.d + "'/><circle cx='18' cy='6' r='1.6' fill='" + p.d + "'/>";
      s += "<circle cx='6' cy='18' r='1.6' fill='" + p.d + "'/><circle cx='18' cy='18' r='1.6' fill='" + p.d + "'/>";
      return s;
    },
    eastern: function (p) {
      // naqsh al-jiss: eight-point stars with the crosses that form between them
      function star(cx, cy, R, r) {
        var pts = [];
        for (var i = 0; i < 16; i++) {
          var ang = Math.PI / 8 * i - Math.PI / 2, rad = i % 2 ? r : R;
          pts.push((cx + rad * Math.cos(ang)).toFixed(2) + ',' + (cy + rad * Math.sin(ang)).toFixed(2));
        }
        return pts.join(' ');
      }
      var s = '';
      [[24, 24], [0, 0], [48, 0], [0, 48], [48, 48]].forEach(function (c) {
        s += "<polygon points='" + star(c[0], c[1], 16.5, 12.6) + "' fill='" + p.a + "' stroke='" + p.c + "' stroke-width='1.1'/>";
        s += "<circle cx='" + c[0] + "' cy='" + c[1] + "' r='4.2' fill='none' stroke='" + p.b + "' stroke-width='1.1'/>";
      });
      // the crosses between the stars, carved slightly deeper
      [[24, 0], [0, 24], [48, 24], [24, 48]].forEach(function (c) {
        s += "<circle cx='" + c[0] + "' cy='" + c[1] + "' r='2' fill='" + p.c + "'/>";
      });
      return s;
    },
    southern: function (p) {
      var k = p.k, s = '';
      s += rect(0, 0, 48, 2, k);
      // row of triangles, alternating up and down
      for (var x = 0, i = 0; x < 48; x += 8, i++) {
        s += poly(x + ',14 ' + (x + 4) + ',3 ' + (x + 8) + ',14', i % 2 ? p.b : p.a);
        s += poly((x + 4) + ',3 ' + (x + 8) + ',14 ' + (x + 12) + ',3', i % 2 ? p.c : p.d);
      }
      s += rect(0, 14, 48, 2, k);
      // checks
      for (x = 0, i = 0; x < 48; x += 6, i++) {
        s += rect(x, 17, 6, 6, i % 2 ? p.c : (p.bg === 'none' ? 'none' : p.bg));
        s += rect(x, 23, 6, 6, i % 2 ? (p.bg === 'none' ? 'none' : p.bg) : p.a);
      }
      s += rect(0, 29, 48, 2, k);
      // zigzag
      s += "<polyline points='0,42 6,34 12,42 18,34 24,42 30,34 36,42 42,34 48,42' fill='none' stroke='" + p.d + "' stroke-width='3.2' stroke-linejoin='miter'/>";
      s += rect(0, 45, 48, 2, k);
      // diamonds with outlined centers ("tree" eyes)
      [8, 24, 40].forEach(function (cx, j) {
        s += poly(cx + ',49 ' + (cx + 7) + ',55 ' + cx + ',61 ' + (cx - 7) + ',55', j % 2 ? p.a : p.b);
        s += poly(cx + ',52 ' + (cx + 3) + ',55 ' + cx + ',58 ' + (cx - 3) + ',55', k);
      });
      s += rect(0, 62, 48, 2, k);
      return s;
    },
    northern: function (p) {
      var s = '';
      s += rect(0, 0, 48, 6, p.a) + rect(0, 6, 48, 2, p.k);
      // dhurs al-khail ("horse teeth"): alternating small blocks
      for (var x = 0, i = 0; x < 48; x += 4, i++) s += rect(x, 9, 4, 6, i % 2 ? p.k : p.b);
      s += rect(0, 15, 48, 2, p.k);
      // main field with diamond "eyes"
      s += rect(0, 17, 48, 20, p.k === 'none' ? 'none' : p.bg);
      [12, 36].forEach(function (cx) {
        s += poly(cx + ',19 ' + (cx + 9) + ',27 ' + cx + ',35 ' + (cx - 9) + ',27', p.b);
        s += poly(cx + ',22 ' + (cx + 6) + ',27 ' + cx + ',32 ' + (cx - 6) + ',27', p.a);
        s += poly(cx + ',25 ' + (cx + 2) + ',27 ' + cx + ',29 ' + (cx - 2) + ',27', p.k);
      });
      s += poly('24,22 27,27 24,32 21,27', p.d) + poly('0,22 3,27 0,32', p.d) + poly('48,22 45,27 48,32', p.d);
      s += rect(0, 37, 48, 2, p.k);
      for (x = 0, i = 0; x < 48; x += 4, i++) s += rect(x, 40, 4, 6, i % 2 ? p.b : p.k);
      s += rect(0, 46, 48, 2, p.k) + rect(0, 48, 48, 6, p.c) + rect(0, 54, 48, 2, p.k);
      return s;
    }
  };

  function svg(region, mode, accent) {
    var t = TILE[region];
    if (!t) return '';
    var p = mode === 'tone' ? tonePalette(accent || '#C9A84C') : PALETTES[region];
    var bg = p.bg && p.bg !== 'none' ? rect(0, 0, t[0], t[1], p.bg) : '';
    return "<svg xmlns='http://www.w3.org/2000/svg' width='" + t[0] + "' height='" + t[1] + "' viewBox='0 0 " + t[0] + ' ' + t[1] + "' shape-rendering='geometricPrecision'>" + bg + DRAW[region](p) + '</svg>';
  }

  window.CLPatterns = {
    PALETTES: PALETTES,
    svg: svg,
    url: function (region, mode, accent) { return 'url("data:image/svg+xml,' + encodeURIComponent(svg(region, mode, accent)) + '")'; },
    size: function (region, scale) { var t = TILE[region]; var k = scale || 1; return t ? (t[0] * k) + 'px ' + (t[1] * k) + 'px' : 'auto'; },
    tile: function (region) { return TILE[region]; }
  };
})();
