/**
 * keyart.js — CultureLens key art, drawn in code (no image files)
 *
 *   CLKeyArt.skyline(region)      a dusk skyline of the region's architecture (SVG string, 390 x 440)
 *   CLKeyArt.glyph(category)      line icon for a category: food, music, games, clothing (SVG string)
 *   CLKeyArt.medal(category, region, earned)   an eight-point medallion around the glyph (SVG string)
 *
 * The regions:
 *   najd      mud-brick towers with stepped parapets and triangular openings (Diriyah)
 *   hejaz     tall coral-stone houses with wooden roshan bay windows (old Jeddah)
 *   eastern   the palm groves of Al-Ahsa and low houses with arched gypsum windows
 *   southern  stone towers with slate ledges in the Asir mountains
 *   northern  sandstone rock, a Bedouin tent with an Al-Sadu band, a camel
 */
(function () {
  var ACCENT = { najd: '#C98A55', hejaz: '#4FA593', eastern: '#7AA9C7', southern: '#DDA63E', northern: '#C9574A' };
  var W = 390, H = 440, GROUND = 360;

  function rng(seed) {
    var a = seed >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function f(n) { return Math.round(n * 10) / 10; }

  var SIL = '#0B0914', SIL2 = '#2A1C33', LIT = '#F4C777';

  // ── shared sky ──
  function sky(key, r) {
    var acc = ACCENT[key] || '#C98A55', s = '';
    s += '<defs>' +
      '<linearGradient id="ka-sky" x1="0" y1="0" x2="0" y2="1">' +
        '<stop offset="0" stop-color="#0C0A18"/><stop offset=".28" stop-color="#1B1430"/>' +
        '<stop offset=".46" stop-color="#3B2546"/><stop offset=".6" stop-color="#7E4453"/>' +
        '<stop offset=".7" stop-color="' + acc + '"/><stop offset=".77" stop-color="#EFAE72"/>' +
        '<stop offset=".82" stop-color="#F8CF92"/>' +
      '</linearGradient>' +
      '<radialGradient id="ka-sun" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#FFD9A0" stop-opacity=".75"/><stop offset=".4" stop-color="' + acc + '" stop-opacity=".28"/><stop offset="1" stop-color="' + acc + '" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="ka-moon" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#FFF4DC" stop-opacity=".4"/><stop offset="1" stop-color="#FFF4DC" stop-opacity="0"/></radialGradient>' +
      '<linearGradient id="ka-haze" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F7CB8E" stop-opacity="0"/><stop offset="1" stop-color="#F7CB8E" stop-opacity=".22"/></linearGradient>' +
      '<linearGradient id="ka-ground" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + SIL + '"/><stop offset="1" stop-color="#07060D"/></linearGradient>' +
      '<linearGradient id="ka-rim" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + acc + '" stop-opacity=".9"/><stop offset="1" stop-color="' + acc + '" stop-opacity="0"/></linearGradient>' +
      '<mask id="ka-cres"><rect width="' + W + '" height="' + H + '" fill="#fff"/><circle cx="309" cy="64" r="15" fill="#000"/></mask>' +
    '</defs>';
    s += '<rect width="' + W + '" height="' + H + '" fill="url(#ka-sky)"/>';
    // the last light of the sun, on the horizon
    s += '<ellipse cx="' + f(W * 0.32) + '" cy="' + (GROUND - 30) + '" rx="300" ry="150" fill="url(#ka-sun)"/>';
    // haze that sits on the horizon, so the far layers fade into the glow
    s += '<rect x="0" y="' + (GROUND - 150) + '" width="' + W + '" height="150" fill="url(#ka-haze)"/>';
    // stars
    for (var i = 0; i < 70; i++) {
      var x = r() * W, y = r() * (GROUND * 0.55), sz = r() < 0.12 ? 1.4 : 0.7 + r() * 0.5;
      s += '<circle cx="' + f(x) + '" cy="' + f(y) + '" r="' + f(sz) + '" fill="#FFF4DC" opacity="' + f(0.25 + r() * 0.6) + '"/>';
    }
    // the crescent
    s += '<circle cx="300" cy="70" r="46" fill="url(#ka-moon)"/>';
    s += '<circle cx="300" cy="70" r="17" fill="#FFF1D2" mask="url(#ka-cres)"/>';
    return s;
  }
  function ground() {
    return '<rect x="0" y="' + GROUND + '" width="' + W + '" height="' + (H - GROUND) + '" fill="url(#ka-ground)"/>';
  }
  function dunes(r, y, amp, color, op) {
    var d = 'M0 ' + H + ' L0 ' + y;
    var x = 0;
    while (x < W) {
      var nx = x + 60 + r() * 70, cy = y - amp * (0.4 + r() * 0.6);
      d += ' Q' + f((x + nx) / 2) + ' ' + f(cy) + ' ' + f(nx) + ' ' + f(y + (r() - 0.5) * amp * 0.4);
      x = nx;
    }
    d += ' L' + W + ' ' + H + ' Z';
    return '<path d="' + d + '" fill="' + color + '" opacity="' + (op || 1) + '"/>';
  }
  function windowLit(x, y, w, h, r, p) {
    return '<rect x="' + f(x) + '" y="' + f(y) + '" width="' + f(w) + '" height="' + f(h) + '" fill="' + LIT + '" opacity="' + f((p || 0.6) + r() * 0.35) + '"/>';
  }
  function rim(d) { return '<path d="' + d + '" fill="none" stroke="url(#ka-rim)" stroke-width="1.4" opacity=".75"/>'; }

  // a date palm: curved trunk, a crown of fronds
  function palm(x, base, h, lean, color, r) {
    var tx = x + lean, ty = base - h, s = '';
    s += '<path d="M' + f(x - 3) + ' ' + base + ' Q' + f(x + lean * 0.4) + ' ' + f(base - h * 0.5) + ' ' + f(tx) + ' ' + f(ty) +
      ' L' + f(tx + 3) + ' ' + f(ty + 2) + ' Q' + f(x + lean * 0.4 + 4) + ' ' + f(base - h * 0.5) + ' ' + f(x + 4) + ' ' + base + ' Z" fill="' + color + '"/>';
    var n = 9;
    for (var i = 0; i < n; i++) {
      var a = -Math.PI * 0.95 + (i / (n - 1)) * Math.PI * 0.9 + (r() - 0.5) * 0.15;
      var L = h * (0.32 + r() * 0.12), ex = tx + Math.cos(a) * L, ey = ty + Math.sin(a) * L * 0.55 + L * 0.35;
      var mx = tx + Math.cos(a) * L * 0.5, my = ty + Math.sin(a) * L * 0.5 - 6;
      s += '<path d="M' + f(tx) + ' ' + f(ty) + ' Q' + f(mx) + ' ' + f(my) + ' ' + f(ex) + ' ' + f(ey) + ' Q' + f(mx) + ' ' + f(my + 5) + ' ' + f(tx) + ' ' + f(ty + 3) + ' Z" fill="' + color + '"/>';
    }
    return s;
  }

  // ── Najd: mud-brick towers, stepped parapets, triangular openings ──
  function najd(r) {
    var s = dunes(r, GROUND - 20, 30, SIL2, 0.9);
    s += palm(40, GROUND - 4, 120, 10, SIL2, r) + palm(352, GROUND - 2, 105, -12, SIL2, r);
    var blocks = [[0, 92, 150], [86, 70, 112], [150, 104, 196], [248, 64, 132], [306, 92, 170]];
    blocks.forEach(function (b, bi) {
      var x = b[0], w = b[1], h = b[2], top = GROUND - h, taper = 3;
      var d = 'M' + x + ' ' + GROUND + ' L' + (x + taper) + ' ' + top + ' L' + (x + w - taper) + ' ' + top + ' L' + (x + w) + ' ' + GROUND + ' Z';
      s += '<path d="' + d + '" fill="' + SIL + '"/>';
      // stepped crenellations along the top
      var n = Math.floor((w - 2 * taper) / 13), cw = (w - 2 * taper) / n;
      for (var i = 0; i < n; i++) {
        var cx = x + taper + i * cw + cw / 2;
        s += '<path d="M' + f(cx - cw * 0.36) + ' ' + top + ' v-5 h' + f(cw * 0.18) + ' v-5 h' + f(cw * 0.18) + ' v-5 h' + f(cw * 0.18) + ' v5 h' + f(cw * 0.18) + ' v5 h' + f(cw * 0.18) + ' v5 Z" fill="' + SIL + '"/>';
      }
      s += rim('M' + (x + taper) + ' ' + top + ' L' + (x + w - taper) + ' ' + top);
      // a row of triangular openings near the top
      var tn = Math.max(2, Math.floor(w / 18));
      for (var t = 0; t < tn; t++) {
        var tx = x + w * (t + 0.5) / tn, ty = top + 16;
        s += '<path d="M' + f(tx - 4) + ' ' + f(ty + 7) + ' L' + f(tx) + ' ' + f(ty) + ' L' + f(tx + 4) + ' ' + f(ty + 7) + ' Z" fill="' + (r() < 0.55 ? LIT : '#2B2140') + '" opacity="' + f(0.55 + r() * 0.4) + '"/>';
      }
      // windows below
      var rows = Math.floor((h - 50) / 34);
      for (var k = 0; k < rows; k++) {
        if (r() < 0.45) s += windowLit(x + w * (0.25 + r() * 0.4), top + 44 + k * 34, 7, 10, r, 0.45);
      }
      // the door of the tallest one
      if (bi === 2) s += '<rect x="' + (x + w / 2 - 9) + '" y="' + (GROUND - 30) + '" width="18" height="30" fill="' + LIT + '" opacity=".35"/>';
    });
    return s;
  }

  // ── Hejaz: tall houses with wooden roshan bay windows ──
  function roshan(x, y, w, h, r) {
    var s = '<rect x="' + f(x - 3) + '" y="' + f(y - 4) + '" width="' + f(w + 6) + '" height="' + f(h + 8) + '" fill="#1A1222"/>';
    s += '<rect x="' + f(x) + '" y="' + f(y) + '" width="' + f(w) + '" height="' + f(h) + '" fill="' + LIT + '" opacity="' + f(0.35 + r() * 0.45) + '"/>';
    // the lattice
    for (var i = 1; i < 4; i++) s += '<path d="M' + f(x + w * i / 4) + ' ' + f(y) + ' v' + f(h) + '" stroke="#1A1222" stroke-width="1.6"/>';
    for (var j = 1; j < 6; j++) s += '<path d="M' + f(x) + ' ' + f(y + h * j / 6) + ' h' + f(w) + '" stroke="#1A1222" stroke-width="1.1"/>';
    s += '<path d="M' + f(x - 5) + ' ' + f(y - 4) + ' h' + f(w + 10) + ' l-4 -6 h' + f(-(w + 2)) + ' Z" fill="#1A1222"/>';
    return s;
  }
  function hejaz(r) {
    var s = dunes(r, GROUND - 10, 18, SIL2, 0.8);
    var houses = [[-6, 84, 210], [74, 78, 262], [148, 96, 236], [240, 72, 280], [308, 90, 214]];
    houses.forEach(function (b) {
      var x = b[0], w = b[1], h = b[2], top = GROUND - h;
      s += '<rect x="' + x + '" y="' + top + '" width="' + w + '" height="' + h + '" fill="' + SIL + '"/>';
      s += '<rect x="' + (x - 2) + '" y="' + (top - 6) + '" width="' + (w + 4) + '" height="6" fill="' + SIL + '"/>';
      s += rim('M' + (x - 2) + ' ' + (top - 6) + ' h' + (w + 4));
      var floors = Math.floor((h - 40) / 62);
      for (var k = 0; k < floors; k++) {
        var rw = w * 0.42, rx = x + (k % 2 ? w * 0.48 : w * 0.12), ry = top + 22 + k * 62;
        if (r() < 0.85) s += roshan(rx, ry, rw, 40, r);
        if (r() < 0.5) s += windowLit(x + (k % 2 ? w * 0.14 : w * 0.66), ry + 10, 8, 14, r, 0.4);
      }
      s += '<rect x="' + f(x + w * 0.4) + '" y="' + (GROUND - 26) + '" width="' + f(w * 0.2) + '" height="26" fill="#2A1B30"/>';
    });
    return s;
  }

  // ── Eastern: palm groves of Al-Ahsa, low houses with arched windows ──
  function eastern(r) {
    var s = '<rect x="0" y="' + (GROUND - 6) + '" width="' + W + '" height="10" fill="' + ACCENT.eastern + '" opacity=".18"/>';
    s += dunes(r, GROUND - 26, 14, SIL2, 0.85);
    for (var i = 0; i < 9; i++) s += palm(10 + i * 46 + r() * 20, GROUND - 30, 70 + r() * 50, (r() - 0.5) * 30, '#120F20', r);
    var houses = [[0, 120, 70], [112, 88, 92], [196, 110, 64], [300, 96, 84]];
    houses.forEach(function (b) {
      var x = b[0], w = b[1], h = b[2], top = GROUND - h;
      s += '<rect x="' + x + '" y="' + top + '" width="' + w + '" height="' + h + '" fill="' + SIL + '"/>';
      s += rim('M' + x + ' ' + top + ' h' + w);
      var n = Math.max(2, Math.floor(w / 30));
      for (var k = 0; k < n; k++) {
        var ax = x + w * (k + 0.5) / n - 7, ay = top + 22;
        s += '<path d="M' + f(ax) + ' ' + f(ay + 22) + ' v-14 a7 7 0 0 1 14 0 v14 Z" fill="' + LIT + '" opacity="' + f(0.3 + r() * 0.5) + '"/>';
      }
    });
    s += palm(70, GROUND, 150, 14, SIL, r) + palm(330, GROUND, 135, -18, SIL, r);
    return s;
  }

  // ── Southern: stone towers with slate ledges, Asir mountains ──
  function southern(r) {
    var s = '';
    var d = 'M0 ' + (GROUND - 120) + ' L40 ' + (GROUND - 170) + ' L84 ' + (GROUND - 132) + ' L130 ' + (GROUND - 210) + ' L176 ' + (GROUND - 150) + ' L220 ' + (GROUND - 186) + ' L270 ' + (GROUND - 128) + ' L318 ' + (GROUND - 196) + ' L362 ' + (GROUND - 140) + ' L390 ' + (GROUND - 160) + ' L390 ' + H + ' L0 ' + H + ' Z';
    s += '<path d="' + d + '" fill="' + SIL2 + '"/>';
    s += rim('M0 ' + (GROUND - 120) + ' L40 ' + (GROUND - 170) + ' L84 ' + (GROUND - 132) + ' L130 ' + (GROUND - 210) + ' L176 ' + (GROUND - 150) + ' L220 ' + (GROUND - 186) + ' L270 ' + (GROUND - 128) + ' L318 ' + (GROUND - 196) + ' L362 ' + (GROUND - 140) + ' L390 ' + (GROUND - 160));
    var towers = [[30, 66, 190], [118, 54, 150], [190, 76, 228], [292, 60, 176]];
    towers.forEach(function (b) {
      var x = b[0], w = b[1], h = b[2], top = GROUND - h, t = 7;
      s += '<path d="M' + x + ' ' + GROUND + ' L' + (x + t) + ' ' + top + ' L' + (x + w - t) + ' ' + top + ' L' + (x + w) + ' ' + GROUND + ' Z" fill="' + SIL + '"/>';
      // slate ledges that keep the rain off the mud
      for (var k = 1; k * 16 < h - 10; k++) {
        var yy = top + k * 16, inset = t * (1 - k * 16 / h);
        s += '<path d="M' + f(x + inset - 2) + ' ' + f(yy) + ' h' + f(w - 2 * inset + 4) + '" stroke="#2A2140" stroke-width="2.2"/>';
      }
      s += rim('M' + (x + t) + ' ' + top + ' h' + (w - 2 * t));
      // windows framed in color, the way Al-Qatt paints them
      for (var j = 0; j < 3; j++) {
        if (r() < 0.6) {
          var wx = x + w * (0.3 + r() * 0.3), wy = top + 26 + j * 46;
          s += '<path d="M' + f(wx - 7) + ' ' + f(wy - 4) + ' l7 -7 l7 7 Z" fill="#DDA63E" opacity=".75"/>';
          s += windowLit(wx - 5, wy - 2, 10, 13, r, 0.5);
        }
      }
    });
    return s;
  }

  // ── Northern: sandstone rock, a Bedouin tent with Al-Sadu, a camel ──
  function northern(r) {
    var s = '';
    s += '<path d="M-10 ' + H + ' L-10 ' + (GROUND - 90) + ' Q10 ' + (GROUND - 150) + ' 60 ' + (GROUND - 150) + ' L96 ' + (GROUND - 146) + ' Q120 ' + (GROUND - 110) + ' 132 ' + (GROUND - 60) + ' L140 ' + H + ' Z" fill="' + SIL2 + '"/>';
    s += '<path d="M250 ' + H + ' L262 ' + (GROUND - 80) + ' Q270 ' + (GROUND - 176) + ' 320 ' + (GROUND - 182) + ' L372 ' + (GROUND - 176) + ' Q400 ' + (GROUND - 140) + ' 400 ' + (GROUND - 90) + ' L400 ' + H + ' Z" fill="' + SIL2 + '"/>';
    s += rim('M262 ' + (GROUND - 80) + ' Q270 ' + (GROUND - 176) + ' 320 ' + (GROUND - 182) + ' L372 ' + (GROUND - 176));
    s += rim('M-10 ' + (GROUND - 90) + ' Q10 ' + (GROUND - 150) + ' 60 ' + (GROUND - 150) + ' L96 ' + (GROUND - 146));
    s += dunes(r, GROUND - 14, 22, SIL, 1);
    // the tent of goat hair, with a Sadu band along it
    var tx = 96, ty = GROUND - 56, tw = 190;
    s += '<path d="M' + tx + ' ' + (GROUND - 6) + ' L' + (tx + 10) + ' ' + ty + ' Q' + (tx + tw * 0.25) + ' ' + (ty - 14) + ' ' + (tx + tw * 0.5) + ' ' + ty + ' Q' + (tx + tw * 0.75) + ' ' + (ty - 14) + ' ' + (tx + tw - 10) + ' ' + ty + ' L' + (tx + tw) + ' ' + (GROUND - 6) + ' Z" fill="' + SIL + '"/>';
    var band = ['#C9574A', '#EDE3D0', '#C9574A', '#2B2140'];
    for (var i = 0; i < 18; i++) {
      var bx = tx + 14 + i * ((tw - 28) / 18);
      s += '<path d="M' + f(bx) + ' ' + f(GROUND - 20) + ' l' + f((tw - 28) / 36) + ' -6 l' + f((tw - 28) / 36) + ' 6 Z" fill="' + band[i % band.length] + '" opacity=".8"/>';
    }
    s += '<rect x="' + (tx + 14) + '" y="' + (GROUND - 16) + '" width="' + (tw - 28) + '" height="2" fill="#EDE3D0" opacity=".55"/>';
    s += '<rect x="' + (tx + tw / 2 - 14) + '" y="' + (GROUND - 40) + '" width="28" height="34" fill="' + LIT + '" opacity=".42"/>';
    s += rim('M' + (tx + 10) + ' ' + ty + ' Q' + (tx + tw * 0.25) + ' ' + (ty - 14) + ' ' + (tx + tw * 0.5) + ' ' + ty + ' Q' + (tx + tw * 0.75) + ' ' + (ty - 14) + ' ' + (tx + tw - 10) + ' ' + ty);
    // a camel
    var cx = 300, cy = GROUND - 8;
    s += '<path d="M' + cx + ' ' + cy + ' l2 -26 q-2 -14 8 -20 q10 -12 20 -2 q8 -6 14 4 q6 -8 10 -18 q2 -6 8 -4 l6 2 q2 4 -4 4 q-4 10 -8 22 q-2 10 -6 14 l2 22 h-4 l-3 -20 h-22 l-3 20 h-4 l1 -21 q-6 6 -9 21 Z" fill="' + SIL + '"/>';
    return s;
  }

  var DRAW = { najd: najd, hejaz: hejaz, eastern: eastern, southern: southern, northern: northern };
  var SEED = { najd: 11, hejaz: 23, eastern: 37, southern: 41, northern: 53 };

  function skyline(key) {
    key = DRAW[key] ? key : 'najd';
    var r = rng(SEED[key]);
    return '<svg class="ka-skyline" viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="xMidYMax slice" role="img" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">' +
      sky(key, r) + DRAW[key](r) + ground() + '</svg>';
  }

  // ── category glyphs (24 x 24, strokes) ──
  var GLYPH = {
    // the dallah
    food: '<path d="M9.6 6.2c0-1.5 1.1-2.6 2.4-2.6s2.4 1.1 2.4 2.6"/><path d="M12 2.2v1.4"/><path d="M9 6.2h6l-.6 2.2c1.9 1.1 3.1 3.6 3.1 6.4 0 3.2-1.6 5.8-5.5 5.8s-5.5-2.6-5.5-5.8c0-2.8 1.2-5.3 3.1-6.4z"/><path d="M8.4 10.2C6 10 4.3 8.6 3 6.6"/><path d="M17.4 9.6c1.9.2 3.2 1.6 3.2 3.4s-1.3 3.2-3.2 3.4"/><path d="M8 20.6h8"/>',
    // a frame drum
    music: '<circle cx="12" cy="12" r="8.4"/><circle cx="12" cy="12" r="6.2"/><circle cx="12" cy="3.6" r="1" fill="currentColor"/><circle cx="20.4" cy="12" r="1" fill="currentColor"/><circle cx="12" cy="20.4" r="1" fill="currentColor"/><circle cx="3.6" cy="12" r="1" fill="currentColor"/><path d="M9.5 10.5c1.4-1 3.6-1 5 0"/>',
    // three marbles
    games: '<circle cx="8" cy="15.5" r="4.3"/><circle cx="16.4" cy="15.9" r="3.6"/><circle cx="12.4" cy="7.6" r="3.4"/><path d="M6.3 14.2c.8-1 2.4-1.1 3.3-.2"/><path d="M15.1 14.9c.6-.7 1.8-.8 2.5-.1"/><path d="M11.2 6.6c.6-.7 1.8-.8 2.5-.1"/>',
    // the bisht
    clothing: '<path d="M9 3.5c1 1.6 5 1.6 6 0"/><path d="M9 3.5L4.5 6 3 12l3 1.2.8 7.3h10.4l.8-7.3L21 12l-1.5-6L15 3.5"/><path d="M9 3.5l3 9 3-9"/><path d="M12 12.5v8"/>'
  };
  function glyph(cat, cls) {
    return '<svg class="ka-glyph ' + (cls || '') + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (GLYPH[cat] || GLYPH.food) + '</svg>';
  }

  // ── an eight-point medallion around the glyph (badges, featured art) ──
  var uid = 0;
  function medal(cat, key, earned) {
    var acc = ACCENT[key] || '#C98A55', id = 'ka-m' + (++uid);
    var c = 60, R = 52, star = '';
    for (var i = 0; i < 2; i++) {
      var a = i * Math.PI / 4, pts = [];
      for (var k = 0; k < 4; k++) { var aa = a + k * Math.PI / 2 + Math.PI / 4; pts.push(f(c + Math.cos(aa) * R) + ' ' + f(c + Math.sin(aa) * R)); }
      star += '<polygon points="' + pts.join(' ') + '"/>';
    }
    var gold = earned === false ? '#5C5470' : '#E8C891';
    return '<svg class="ka-medal' + (earned === false ? ' is-dim' : '') + '" viewBox="0 0 120 120" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">' +
      '<defs><radialGradient id="' + id + '" cx=".38" cy=".32" r=".8"><stop offset="0" stop-color="' + acc + '"/><stop offset="1" stop-color="#1A1430"/></radialGradient></defs>' +
      '<g fill="url(#' + id + ')" stroke="' + gold + '" stroke-width="2" stroke-linejoin="round">' + star + '</g>' +
      '<circle cx="60" cy="60" r="33" fill="#120F22" stroke="' + gold + '" stroke-width="1.5"/>' +
      '<circle cx="60" cy="60" r="28.5" fill="none" stroke="' + gold + '" stroke-opacity=".35" stroke-width="1"/>' +
      '<g transform="translate(42 42) scale(1.5)" fill="none" stroke="' + (earned === false ? '#8E86A6' : '#F4EADB') + '" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">' + (GLYPH[cat] || GLYPH.food) + '</g>' +
    '</svg>';
  }

  window.CLKeyArt = { skyline: skyline, glyph: glyph, medal: medal, ACCENT: ACCENT };
})();
