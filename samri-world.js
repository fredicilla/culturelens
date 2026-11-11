/**
 * samri-world.js — the 3D world for Al-Samri.
 *
 * A Samri night in the sand dunes outside Unaizah: two Sadu rugs on the sand, two facing
 * rows of nine men kneeling with their frame drums, the mu'allim at the center of each row,
 * a coffee hearth at one end, a lantern at the other, palms and the moon.
 *
 * The performers are drawn as instanced parts (thobe, shemagh, igal, arms, hands, drum...). Each
 * one has an invisible rig that is posed every frame from the beat, so eighteen of them cost about
 * sixteen draw calls. The shapes are drawn in code as smooth skins through rings (a body, a head with
 * a face, hands), and two parts bend between two joints: the shemagh, which sits on the head but lies
 * on the shoulders and back, and the beard, whose chin drops with the jaw when a man sings. A row can
 * rest, sing and clap, or sway and lift the drums; "you" can be one of them, moved by your own taps
 * and swipes.
 *
 * AR, as in Al-Masaqil and Al-Sadu:
 *   - Android (Chrome + ARCore): WebXR. The gathering sits on your real floor or table.
 *   - iPhone: AR Quick Look shows the gathering as it is right now, in your room.
 *
 * Units are meters. Row A kneels at z = -ROW.Z facing +z, row B at z = +ROW.Z facing -z.
 * Seats run along x; seat 4 (the middle) is the mu'allim's.
 */
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { bandCanvas } from './sadu-weave.js';

export const ROW = { N: 9, GAP: 0.52, Z: 0.86, LEAD: 4 };

// ─────────────────────────────────────────────────────────────
// small helpers
// ─────────────────────────────────────────────────────────────
function mulberry32(a) {
  return function () {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    var t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
function lattice(period, seed) {
  var rnd = mulberry32(seed), v = new Float32Array(period * period);
  for (var i = 0; i < v.length; i++) v[i] = rnd();
  return function (x, y) {
    var xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
    var x0 = ((xi % period) + period) % period, y0 = ((yi % period) + period) % period;
    var x1 = (x0 + 1) % period, y1 = (y0 + 1) % period;
    var sx = xf * xf * (3 - 2 * xf), sy = yf * yf * (3 - 2 * yf);
    var a = v[y0 * period + x0], b = v[y0 * period + x1], c = v[y1 * period + x0], d = v[y1 * period + x1];
    return a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy;
  };
}
var N1 = lattice(64, 7), N2 = lattice(64, 19), N3 = lattice(64, 31);
function fbm(x, y) { return N1(x, y) * 0.55 + N2(x * 2.1, y * 2.1) * 0.3 + N3(x * 4.3, y * 4.3) * 0.15; }
function smooth(a, b, x) { var t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); }
function canvas(w, h) { var c = document.createElement('canvas'); c.width = w; c.height = h || w; return c; }
function tex(c, rx, ry) {
  var t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  if (rx) t.repeat.set(rx, ry || rx);
  t.anisotropy = 4;
  return t;
}
function lathe(points, seg, start, len) { return new THREE.LatheGeometry(points.map(function (p) { return new THREE.Vector2(p[0], p[1]); }), seg || 24, start || 0, len || Math.PI * 2); }
function pulse(b, w) { var d = Math.abs(b - Math.round(b)); return Math.max(0, 1 - d / (w || 0.22)); }
// like pulse, but on the drum strokes of the Samri cycle (two beats long), wherever they fall
function strokePulse(b, list, w) {
  var c = b - Math.floor(b / 2) * 2, m = 0;
  for (var i = 0; i < list.length; i++) { var d = Math.abs(c - list[i]); d = Math.min(d, 2 - d); m = Math.max(m, 1 - d / (w || 0.16)); }
  return m;
}
function damp(cur, to, k, dt) { return cur + (to - cur) * (1 - Math.exp(-k * dt)); }

// ─────────────────────────────────────────────────────────────
// textures, drawn in code
// ─────────────────────────────────────────────────────────────
function sandTexture() {
  var S = 256, c = canvas(S), g = c.getContext('2d'), img = g.createImageData(S, S), d = img.data;
  for (var y = 0; y < S; y++) for (var x = 0; x < S; x++) {
    var u = x / S * 8, v = y / S * 8;
    var n = fbm(u, v), r = N3(u * 7.7, v * 7.7);
    var rip = 0.5 + 0.5 * Math.sin((v * 2.4 + n * 1.8) * Math.PI * 2);
    var k = 0.8 + n * 0.24 + rip * 0.06 + (r - 0.5) * 0.12;
    var i = (y * S + x) * 4;
    d[i] = Math.min(255, 210 * k); d[i + 1] = Math.min(255, 170 * k); d[i + 2] = Math.min(255, 126 * k); d[i + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  return tex(c, 26);
}
// the weave of a white thobe, barely there
function clothTexture() {
  var S = 128, c = canvas(S), g = c.getContext('2d'), rnd = mulberry32(5);
  g.fillStyle = '#ffffff'; g.fillRect(0, 0, S, S);
  for (var y = 0; y < S; y += 2) { g.fillStyle = 'rgba(0,0,0,' + (0.008 + rnd() * 0.014) + ')'; g.fillRect(0, y, S, 1); }
  for (var x = 0; x < S; x += 3) { g.fillStyle = 'rgba(0,0,0,' + (rnd() * 0.012) + ')'; g.fillRect(x, 0, 1, S); }
  return tex(c, 2, 2);
}
// the red and white check of a shemagh
function shemaghTexture() {
  var S = 128, c = canvas(S), g = c.getContext('2d');
  g.fillStyle = '#F2EDE5'; g.fillRect(0, 0, S, S);
  g.fillStyle = '#B4232B';
  for (var k = 0; k < S; k += 16) {
    g.fillRect(k + 2, 0, 3, S); g.fillRect(0, k + 2, S, 3);
    g.fillRect(k + 9, 0, 1, S); g.fillRect(0, k + 9, S, 1);
  }
  for (var y = 0; y < S; y += 16) for (var x = 0; x < S; x += 16) { g.fillRect(x + 1, y + 1, 5, 5); }
  return tex(c, 1, 1);
}
function skinTexture() {
  var S = 64, c = canvas(S), g = c.getContext('2d'), rnd = mulberry32(9);
  g.fillStyle = '#ffffff'; g.fillRect(0, 0, S, S);
  for (var k = 0; k < 300; k++) { g.fillStyle = 'rgba(120,70,40,' + (rnd() * 0.06) + ')'; g.fillRect(rnd() * S, rnd() * S, 2, 2); }
  return tex(c);
}
// goat skin on the frame drum: pale, a little mottled, darker where it is struck
function drumSkinTexture() {
  var S = 256, c = canvas(S), g = c.getContext('2d'), rnd = mulberry32(21);
  var gr = g.createRadialGradient(S / 2, S / 2, 4, S / 2, S / 2, S / 2);
  gr.addColorStop(0, '#C9AA7C'); gr.addColorStop(0.35, '#E4CFA6'); gr.addColorStop(0.85, '#DCC395'); gr.addColorStop(1, '#9C7A4C');
  g.fillStyle = gr; g.fillRect(0, 0, S, S);
  for (var k = 0; k < 160; k++) {
    g.strokeStyle = 'rgba(110,80,45,' + (rnd() * 0.12) + ')'; g.lineWidth = 1 + rnd() * 2;
    var x = rnd() * S, y = rnd() * S; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + (rnd() - 0.5) * 40, y + (rnd() - 0.5) * 40, x + (rnd() - 0.5) * 60, y + (rnd() - 0.5) * 60); g.stroke();
  }
  // the dark ring of the frame showing through near the edge
  g.strokeStyle = 'rgba(70,45,25,0.35)'; g.lineWidth = 6; g.beginPath(); g.arc(S / 2, S / 2, S / 2 - 10, 0, Math.PI * 2); g.stroke();
  var t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
function woodTexture() {
  var c = canvas(64, 256), g = c.getContext('2d'), rnd = mulberry32(11);
  g.fillStyle = '#6E4A2C'; g.fillRect(0, 0, 64, 256);
  for (var x = 0; x < 64; x += 2) { g.fillStyle = 'rgba(' + (50 + rnd() * 50 | 0) + ',' + (30 + rnd() * 30 | 0) + ',16,' + (0.25 + rnd() * 0.35) + ')'; g.fillRect(x, 0, 1 + rnd() * 2, 256); }
  return tex(c);
}
// the two colors of a face's features: dark (brows, lashes, the eye, the open mouth) and the white of the eye
function faceTexture() {
  var c = canvas(16, 8), g = c.getContext('2d');
  g.fillStyle = '#1C1411'; g.fillRect(0, 0, 8, 8); g.fillStyle = '#E9E3D8'; g.fillRect(8, 0, 8, 8);
  var t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.magFilter = THREE.NearestFilter; t.minFilter = THREE.NearestFilter; t.generateMipmaps = false; return t;
}
// gold thread along the edge of a bisht
function bishtTexture() {
  var c = canvas(256, 256), g = c.getContext('2d'), rnd = mulberry32(17);
  g.fillStyle = '#2A1E17'; g.fillRect(0, 0, 256, 256);
  for (var y = 0; y < 256; y += 2) { g.fillStyle = 'rgba(255,255,255,' + (rnd() * 0.035) + ')'; g.fillRect(0, y, 256, 1); }
  // gold down the two front edges and round the neck
  g.fillStyle = '#C9A04E'; g.fillRect(0, 0, 9, 256); g.fillRect(247, 0, 9, 256); g.fillRect(0, 0, 256, 7);
  g.fillStyle = 'rgba(255,230,160,0.6)'; g.fillRect(3, 0, 2, 256); g.fillRect(251, 0, 2, 256); g.fillRect(0, 2, 256, 2);
  var t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
}
function rugTexture(specs, rows) {
  var parts = specs.map(function (s) { return bandCanvas(s, rows, { cw: 4, ch: 5, dir: 'h' }); });
  var w = parts[0].width, h = parts.reduce(function (a, p) { return a + p.height; }, 0);
  var c = canvas(w, h), g = c.getContext('2d'), y = 0;
  parts.forEach(function (p) { g.drawImage(p, 0, y); y += p.height; });
  return tex(c);
}
function moonTexture() {
  var S = 256, c = canvas(S), g = c.getContext('2d');
  var gr = g.createRadialGradient(S / 2, S / 2, 16, S / 2, S / 2, S / 2);
  gr.addColorStop(0, 'rgba(255,246,222,0.55)'); gr.addColorStop(0.3, 'rgba(220,226,255,0.16)'); gr.addColorStop(1, 'rgba(200,210,255,0)');
  g.fillStyle = gr; g.fillRect(0, 0, S, S);
  var disc = g.createRadialGradient(S / 2 - 8, S / 2 - 8, 4, S / 2, S / 2, 40);
  disc.addColorStop(0, '#FFFBEF'); disc.addColorStop(1, '#E9E4D2');
  g.fillStyle = disc; g.beginPath(); g.arc(S / 2, S / 2, 38, 0, Math.PI * 2); g.fill();
  var rnd = mulberry32(3);
  for (var k = 0; k < 9; k++) { g.fillStyle = 'rgba(160,160,150,' + (0.12 + rnd() * 0.12) + ')'; g.beginPath(); g.arc(S / 2 + (rnd() - 0.5) * 50, S / 2 + (rnd() - 0.5) * 50, 3 + rnd() * 8, 0, Math.PI * 2); g.fill(); }
  var t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
function flameTexture() {
  var c = canvas(64, 128), g = c.getContext('2d');
  var gr = g.createRadialGradient(32, 96, 2, 32, 80, 60);
  gr.addColorStop(0, 'rgba(255,240,190,1)'); gr.addColorStop(0.25, 'rgba(255,170,70,0.9)'); gr.addColorStop(0.6, 'rgba(220,80,30,0.35)'); gr.addColorStop(1, 'rgba(120,30,10,0)');
  g.fillStyle = gr;
  g.beginPath(); g.moveTo(32, 4); g.bezierCurveTo(54, 50, 60, 90, 32, 124); g.bezierCurveTo(4, 90, 10, 50, 32, 4); g.fill();
  var t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
function glowTexture(r, gC, b) {
  var c = canvas(64), g = c.getContext('2d');
  var gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  gr.addColorStop(0, 'rgba(' + r + ',' + gC + ',' + b + ',0.9)'); gr.addColorStop(0.35, 'rgba(' + r + ',' + gC + ',' + b + ',0.3)'); gr.addColorStop(1, 'rgba(' + r + ',' + gC + ',' + b + ',0)');
  g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
  var t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
// a palm frond: a feather of leaflets on a transparent sheet
function frondTexture() {
  var c = canvas(64, 256), g = c.getContext('2d');
  g.strokeStyle = '#1D2A1C'; g.lineWidth = 3; g.beginPath(); g.moveTo(32, 0); g.lineTo(32, 256); g.stroke();
  g.lineWidth = 2.2;
  for (var y = 8; y < 250; y += 7) {
    var w = 28 * Math.sin(Math.PI * y / 256) + 4;
    g.beginPath(); g.moveTo(32, y); g.lineTo(32 - w, y + 16); g.moveTo(32, y); g.lineTo(32 + w, y + 16); g.stroke();
  }
  var t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
// a night sky as an equirect image, for soft reflections
function skyEquirect() {
  var c = canvas(256, 128), g = c.getContext('2d');
  var gr = g.createLinearGradient(0, 0, 0, 128);
  gr.addColorStop(0, '#05060F'); gr.addColorStop(0.38, '#101A3A'); gr.addColorStop(0.49, '#2A3560'); gr.addColorStop(0.52, '#20201E'); gr.addColorStop(1, '#100D0A');
  g.fillStyle = gr; g.fillRect(0, 0, 256, 128);
  var m = g.createRadialGradient(190, 40, 2, 190, 40, 40);
  m.addColorStop(0, 'rgba(220,228,255,0.8)'); m.addColorStop(1, 'rgba(220,228,255,0)');
  g.fillStyle = m; g.fillRect(0, 0, 256, 128);
  var t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.mapping = THREE.EquirectangularReflectionMapping;
  return t;
}

// ─────────────────────────────────────────────────────────────
// surfaces drawn through stacks of rings (bodies, heads, cloth)
// ─────────────────────────────────────────────────────────────
function lerp(a, b, t) { return a + (b - a) * t; }
// a ring is [y, half-width (x), depth to the front (+z), depth to the back, squareness (2 is an ellipse), middle along z]
function ringAt(T, y) {
  var i = 0; while (i < T.length - 2 && y > T[i + 1][0]) i++;
  var a = T[i], b = T[i + 1], t = Math.min(1, Math.max(0, (y - a[0]) / (b[0] - a[0])));
  return { y: y, w: lerp(a[1], b[1], t), f: lerp(a[2], b[2], t), b: lerp(a[3], b[3], t), n: lerp(a[4] || 2, b[4] || 2, t), cz: lerp(a[5] || 0, b[5] || 0, t) };
}
// the point of a ring at angle phi (0 is the front, a quarter turn is +x)
function ringXZ(r, phi) {
  var s = Math.sin(phi), c = Math.cos(phi), e = 2 / (r.n || 2);
  return [Math.sign(s) * Math.pow(Math.abs(s), e) * r.w, (r.cz || 0) + Math.sign(c) * Math.pow(Math.abs(c), e) * (c >= 0 ? r.f : r.b)];
}
// the front (or the back) of a ring at a given x
function ringZ(r, x, back) {
  var lo = back ? Math.PI : 0, hi = Math.PI / 2, ax = Math.min(Math.abs(x), r.w * 0.999);
  for (var i = 0; i < 22; i++) { var mid = (lo + hi) / 2; if (Math.abs(ringXZ(r, mid)[0]) < ax) lo = mid; else hi = mid; }
  return ringXZ(r, lo)[1];
}
function inRing(r, x, z, grow) {
  var dz = z - (r.cz || 0), g = grow || 0, n = r.n || 2;
  return Math.pow(Math.abs(x) / (r.w + g), n) + Math.pow(Math.abs(dz) / ((dz >= 0 ? r.f : r.b) + g), n) < 1;
}
// a sheet of rows and columns; fn(i, j) gives [x, y, z, u, v]. Rows go up, columns go round toward +x
function grid(nr, nc, fn, o) {
  o = o || {};
  var pos = new Float32Array(nr * nc * 3), uv = new Float32Array(nr * nc * 2), idx = [], k = 0, q = 0, i, j;
  for (i = 0; i < nr; i++) for (j = 0; j < nc; j++) { var p = fn(i, j); pos[k++] = p[0]; pos[k++] = p[1]; pos[k++] = p[2]; uv[q++] = p[3] || 0; uv[q++] = p[4] || 0; }
  for (i = 0; i < nr - 1; i++) for (j = 0; j < nc - 1; j++) {
    var a = i * nc + j, b = a + 1, c = a + nc, d = c + 1;
    if (o.flip) idx.push(a, c, b, b, c, d); else idx.push(a, b, c, b, d, c);
  }
  var g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); g.setIndex(idx);
  g.computeVertexNormals();
  // where the first and last column are the same line, give them the same normals so no seam shows
  var nm = g.attributes.normal;
  for (i = 0; i < nr; i++) {
    var s0 = i * nc, s1 = s0 + nc - 1;
    if (Math.abs(pos[s0 * 3] - pos[s1 * 3]) + Math.abs(pos[s0 * 3 + 1] - pos[s1 * 3 + 1]) + Math.abs(pos[s0 * 3 + 2] - pos[s1 * 3 + 2]) > 1e-5) continue;
    var x = nm.getX(s0) + nm.getX(s1), y = nm.getY(s0) + nm.getY(s1), z = nm.getZ(s0) + nm.getZ(s1), l = Math.hypot(x, y, z) || 1;
    nm.setXYZ(s0, x / l, y / l, z / l); nm.setXYZ(s1, x / l, y / l, z / l);
  }
  return g;
}
// a closed skin through a table of rings, at the heights given
function loft(T, ys, seg, o) {
  o = o || {};
  var rings = ys.map(function (y) { return ringAt(T, y); });
  return grid(rings.length, seg + 1, function (i, j) {
    var p = ringXZ(rings[i], Math.PI * 2 * j / seg);
    return [p[0], rings[i].y, p[1], j / seg * (o.us || 1), rings[i].y * (o.vs || 1)];
  });
}
function setAll(g, name, v) { var a = new Float32Array(g.attributes.position.count); a.fill(v); g.setAttribute(name, new THREE.BufferAttribute(a, 1)); return g; }
// the same shape for the other side of the body
function mirrorX(g) {
  var m = g.clone(); m.scale(-1, 1, 1);
  var ix = m.index.array; for (var i = 0; i < ix.length; i += 3) { var t = ix[i + 1]; ix[i + 1] = ix[i + 2]; ix[i + 2] = t; }
  m.computeVertexNormals(); return m;
}

// ─────────────────────────────────────────────────────────────
// the performer: the shapes of the parts (posed by a rig, drawn instanced)
// ─────────────────────────────────────────────────────────────
// the thobe over the body, from below the hips to the collar (heights above the hips)
var TORSO = [
  [-0.09, 0.190, 0.125, 0.118, 2.6], [0.0, 0.186, 0.122, 0.112, 2.6], [0.10, 0.180, 0.118, 0.104, 2.5], [0.20, 0.178, 0.114, 0.100, 2.5],
  [0.28, 0.183, 0.116, 0.100, 2.5], [0.35, 0.192, 0.116, 0.100, 2.5], [0.405, 0.199, 0.110, 0.097, 2.5], [0.44, 0.197, 0.098, 0.090, 2.4],
  [0.462, 0.172, 0.084, 0.082, 2.3], [0.482, 0.125, 0.068, 0.072, 2.2], [0.497, 0.078, 0.058, 0.062, 2.1], [0.507, 0.061, 0.054, 0.057, 2],
  [0.531, 0.058, 0.052, 0.055, 2]
];
// the head and neck (heights above the base of the neck, where the head turns)
var HEAD = [
  [-0.045, 0.049, 0.046, 0.053, 2], [0.020, 0.050, 0.047, 0.056, 2], [0.033, 0.052, 0.058, 0.058, 2], [0.043, 0.056, 0.078, 0.062, 2.1],
  [0.055, 0.061, 0.090, 0.068, 2.2], [0.072, 0.066, 0.0935, 0.078, 2.3], [0.092, 0.0705, 0.0935, 0.088, 2.35], [0.112, 0.0735, 0.092, 0.096, 2.35],
  [0.135, 0.0752, 0.0905, 0.100, 2.35], [0.155, 0.0755, 0.093, 0.102, 2.3], [0.175, 0.0748, 0.094, 0.101, 2.25], [0.195, 0.072, 0.090, 0.097, 2.2],
  [0.212, 0.066, 0.080, 0.088, 2.1], [0.226, 0.054, 0.064, 0.072, 2.05], [0.235, 0.034, 0.040, 0.046, 2], [0.2395, 0.0006, 0.0006, 0.0006, 2]
];
var HEAD_AT = { x: 0, y: 0.52, z: 0.012 };      // where the head sits on the chest
// the face is pressed in at the eyes and out at the brow, the cheekbones and the mouth
function faceBump(x, y) {
  var ax = Math.abs(x), d = 0;
  d -= 0.0078 * Math.exp(-(Math.pow((ax - 0.031) / 0.018, 2) + Math.pow((y - 0.137) / 0.0115, 2)));
  d += 0.0034 * Math.exp(-Math.pow((y - 0.1535) / 0.0075, 2)) * Math.exp(-Math.pow(x / 0.058, 2));
  d += 0.0030 * Math.exp(-(Math.pow((ax - 0.045) / 0.02, 2) + Math.pow((y - 0.112) / 0.016, 2)));
  d += 0.0022 * Math.exp(-(Math.pow(x / 0.03, 2) + Math.pow((y - 0.071) / 0.012, 2)));
  return d;
}
// a point on the head at angle phi and height y, lifted `off` off the skin
function headAt(phi, y, off) {
  var r = ringAt(HEAD, y), p = ringXZ(r, phi), x = p[0], z = p[1];
  if (z > 0.02) z += faceBump(x, y) * smooth(0.02, 0.06, z);
  if (off) { var l = Math.hypot(x, z) || 1; x += x / l * off; z += z / l * off; }
  return [x, y, z];
}
function faceZ(x, y) { var z = ringZ(ringAt(HEAD, y), x); return z + faceBump(x, y) * smooth(0.02, 0.06, z); }
// is a point (in the head's frame) inside the body or the neck? `grow` makes the body that much bigger
function inBody(x, y, z, grow) {
  var yc = y + HEAD_AT.y, zc = z + HEAD_AT.z;
  if (yc > 0.531) return inRing(ringAt(HEAD, Math.max(-0.045, y)), x, z, grow);
  if (yc < -0.09) return false;
  if (inRing(ringAt(TORSO, yc), x, zc, grow)) return true;
  // the round tops of the sleeves at the shoulders
  var dx = Math.abs(x) - 0.2, dy = yc - 0.44; return dx * dx + dy * dy + zc * zc < Math.pow(0.058 + (grow || 0), 2);
}
var HOOD_TOP = 0.2478, FOREHEAD = 0.170, FACE_OPEN = 1.02;
// the shemagh over the head: it follows the skull down to the temples, then hangs straight
function hoodRing(y) {
  var wide = ringAt(HEAD, 0.155);
  if (y >= 0.155) {
    var r = ringAt(HEAD, 0.155 + (y - 0.155) * (0.2395 - 0.155) / (HOOD_TOP - 0.155));
    return { y: y, w: r.w * 1.112, f: r.f * 1.08, b: r.b * 1.085, n: r.n, cz: 0 };
  }
  // below the temples it hangs free, a little wider and further back the lower it goes
  var t = smooth(0.155, 0.015, y);
  return { y: y, w: wide.w * 1.112 + 0.032 * t, f: 0.0975 - 0.006 * t, b: wide.b * 1.085 + 0.008 * t, n: 2.3, cz: 0 };
}
// how far the face opening has spread at height y (nothing above the forehead line)
function faceOpen(y) { return y >= FOREHEAD ? 0 : FACE_OPEN * Math.sqrt(Math.min(1, (FOREHEAD - y) / 0.022)); }

function performerGeometry() {
  var G = {}, PI = Math.PI;

  // ── kneeling, sitting back on the heels: the thobe over the folded legs, the knees showing through ──
  // drawn as a row of arches from behind the heels to the front of the knees
  var LEGS = [   // [along the body (z), half-width, height]: the feet under the cloth, the seat, the thighs, the knees
    [-0.296, 0.04, 0.02], [-0.288, 0.105, 0.062], [-0.262, 0.165, 0.098], [-0.228, 0.192, 0.158], [-0.20, 0.202, 0.214], [-0.14, 0.212, 0.243], [-0.04, 0.216, 0.245],
    [0.06, 0.212, 0.222], [0.16, 0.207, 0.192], [0.26, 0.202, 0.166], [0.34, 0.196, 0.146], [0.40, 0.184, 0.116], [0.436, 0.15, 0.07], [0.45, 0.07, 0.022]
  ];
  var LZ = [-0.296, -0.288, -0.275, -0.262, -0.245, -0.228, -0.20, -0.17, -0.14, -0.09, -0.04, 0.01, 0.06, 0.11, 0.16, 0.21, 0.26, 0.30, 0.34, 0.37, 0.40, 0.42, 0.436, 0.45];
  var legRings = LZ.map(function (z) { var r = ringAt(LEGS.map(function (L) { return [L[0], L[1], L[2], 0.004, 2.4]; }), z); return r; });
  G.legs = grid(legRings.length, 33, function (i, j) {
    // an arch standing on the rug: built lying down (a ring per step along the body), then stood up
    var r = legRings[i], p = ringXZ(r, PI * 2 * j / 32), x = p[0], h = Math.max(0, p[1]), z = r.y;
    // the cloth dips between the two thighs, deeper toward the knees
    h *= 1 - 0.36 * smooth(-0.02, 0.3, z) * Math.exp(-Math.pow(x / 0.055, 2));
    // and the thighs are rounder on top than the lap between them
    h *= 1 + 0.05 * smooth(0.0, 0.2, z) * Math.exp(-Math.pow((Math.abs(x) - 0.12) / 0.05, 2));
    return [x, h, z, j / 32 * 2.6, z * 2.2];
  }, { flip: true });

  // ── the body of the thobe, from the hips up to the collar, with the placket down the chest ──
  var TY = [-0.09, -0.04, 0.0, 0.05, 0.10, 0.15, 0.20, 0.24, 0.28, 0.315, 0.35, 0.38, 0.405, 0.425, 0.44, 0.452, 0.462, 0.472, 0.482, 0.49, 0.497, 0.507, 0.519, 0.531];
  var body = loft(TORSO, TY, 32, { us: 2.6, vs: 2.2 });
  // the top of the collar turns in and closes around the neck
  var lip = grid(3, 33, function (i, j) {
    var r = { y: 0, w: [0.058, 0.0505, 0.02][i], f: [0.052, 0.0455, 0.02][i], b: [0.055, 0.0485, 0.02][i], n: 2 };
    var p = ringXZ(r, PI * 2 * j / 32); return [p[0], [0.531, 0.527, 0.5][i], p[1], j / 32, 0];
  });
  var plk = grid(9, 3, function (i, j) {
    var y = 0.31 + (0.505 - 0.31) * i / 8, x = (j - 1) * 0.009;
    return [x, y, ringZ(ringAt(TORSO, y), x) + (j === 1 ? 0.0024 : 0.0006), 0.5, y * 2.2];
  });
  var parts = [body, lip, plk];
  [0.475, 0.435, 0.395, 0.355].forEach(function (y) { var bt = new THREE.SphereGeometry(0.0038, 8, 6); bt.scale(1, 1, 0.5); bt.translate(0, y, ringZ(ringAt(TORSO, y), 0) + 0.0028); parts.push(bt); });
  G.torso = mergeGeometries(parts);

  // ── a bisht for the mu'allim: over the shoulders, open down the front ──
  var BY = [0.0, 0.06, 0.12, 0.18, 0.24, 0.30, 0.35, 0.39, 0.42, 0.44, 0.455, 0.468, 0.48, 0.49, 0.498];
  G.bisht = grid(BY.length, 31, function (i, j) {
    var r = ringAt(TORSO, BY[i]), g = 0.017 - 0.006 * smooth(0.46, 0.5, BY[i]);
    var open = 0.5 - 0.22 * smooth(0.3, 0.498, BY[i]);                 // the opening narrows toward the neck
    var p = ringXZ({ w: r.w + g, f: r.f + g, b: r.b + g, n: r.n }, open + (PI * 2 - open * 2) * j / 30);
    return [p[0], BY[i], p[1], j / 30, i / (BY.length - 1)];
  });

  // ── the head: neck, jaw, cheeks, brow, with a nose ──
  var HY = [-0.045, 0.0, 0.02, 0.033, 0.043, 0.055, 0.063, 0.072, 0.082, 0.092, 0.102, 0.112, 0.120, 0.128, 0.135, 0.142, 0.149, 0.155, 0.165, 0.175, 0.195, 0.212, 0.226, 0.235, 0.2395];
  var skull = grid(HY.length, 37, function (i, j) { var p = headAt(PI * 2 * j / 36, HY[i]); return [p[0], p[1], p[2], j / 36, HY[i] * 4]; });
  var NY = [0.0965, 0.100, 0.106, 0.115, 0.130, 0.146], NW = [0.009, 0.0135, 0.0145, 0.011, 0.008, 0.0055], NP = [0.004, 0.016, 0.0235, 0.019, 0.010, 0.002];
  var nose = grid(6, 9, function (i, j) {
    var a = -PI / 2 + PI * j / 8, base = faceZ(0, NY[i]) - 0.003;
    return [NW[i] * Math.sin(a), NY[i], base + (NP[i] + 0.003) * Math.cos(a), 0.5, NY[i] * 4];
  });
  G.head = mergeGeometries([skull, nose]);

  // ── the features of the face: eyes, brows, and the inside of the mouth (seen when the jaw drops). The part is
  //    painted from a two-color strip: everything is dark except the whites of the eyes ──
  var dark = [];
  function paint(g, white) { var uv = g.attributes.uv; for (var q = 0; q < uv.count; q++) uv.setXY(q, white ? 0.75 : 0.25, 0.5); return g; }
  [-1, 1].forEach(function (sd) {
    var ez = faceZ(0.031, 0.1372);
    var white = new THREE.SphereGeometry(1, 12, 8); white.scale(0.0128, 0.0058, 0.0042);
    white.rotateZ(sd * -0.08); white.translate(sd * 0.031, 0.1368, ez + 0.0002); dark.push(paint(white, true));
    var iris = new THREE.SphereGeometry(1, 10, 8); iris.scale(0.0058, 0.0058, 0.003); iris.translate(sd * 0.0305, 0.1368, ez + 0.0024); dark.push(paint(iris));
    // the upper lid and lashes, and the brow
    var lid = [-0.0125, -0.0065, 0, 0.0065, 0.0125].map(function (dx, k) { return new THREE.Vector3(sd * (0.031 + dx), 0.1368 + [0.0006, 0.0052, 0.0066, 0.0052, 0.0004][k] - dx * sd * 0.0 , ez + [0.0006, 0.003, 0.0038, 0.003, 0.0006][k]); });
    dark.push(paint(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(lid), 8, 0.0016, 5, false)));
    var pts = [0.011, 0.023, 0.036, 0.049].map(function (x, k) { var y = [0.1502, 0.1538, 0.1538, 0.1492][k]; return new THREE.Vector3(sd * x, y, faceZ(x, y) + 0.0014); });
    dark.push(paint(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 8, 0.0029, 5, false)));
  });
  // the inside of the mouth: a dark patch lying on the lips, wide enough for everything the jaw uncovers when it drops
  var mouth = grid(6, 11, function (i, j) {
    var x = -0.031 + 0.062 * j / 10, y = 0.0527 + 0.0285 * i / 5;
    return [x, y, faceZ(x, y) + 0.0012, 0.25, 0.5];
  });
  dark.push(paint(mouth));
  G.face = mergeGeometries(dark);

  // ── a beard: along the jaw and under the chin, and a moustache. The chin moves with the jaw (bw = 1) ──
  var HANG = [[0.02, 0.031], [0.03, 0.038], [0.045, 0.022], [0.06, 0.010], [0.0745, 0.0012], [0.2, 0.0012]];
  function hang(y) { var i = 0; while (i < HANG.length - 2 && y > HANG[i + 1][0]) i++; var a = HANG[i], b = HANG[i + 1]; return lerp(a[1], b[1], Math.min(1, Math.max(0, (y - a[0]) / (b[0] - a[0])))); }
  var bwL = [];
  var low = grid(10, 31, function (i, j) {
    var phi = -1.75 + 3.5 * j / 30, a = Math.abs(phi), t = i / 9;
    var yb = 0.02 + 0.087 * Math.pow(a / 1.75, 1.6), yt = 0.0745 + 0.0605 * Math.pow(smooth(0.3, 1.75, a), 0.8), y = lerp(yb, yt, t);
    var chin = Math.exp(-Math.pow(a / 0.75, 2));
    var th = 0.0012 + 0.0036 * Math.pow(Math.sin(PI * Math.min(1, 0.08 + 0.92 * t)), 0.6) + chin * hang(y);
    var p = headAt(phi, y, th);
    bwL.push(smooth(0.95, 0.35, a) * smooth(0.118, 0.085, y));
    return [p[0], p[1], p[2], j / 30, t];
  });
  low.setAttribute('bw', new THREE.BufferAttribute(new Float32Array(bwL), 1));
  var stache = grid(5, 15, function (i, j) {
    var phi = -0.44 + 0.88 * j / 14, a = Math.abs(phi) / 0.44, t = i / 4;
    var y = lerp(0.0765 - 0.011 * Math.pow(a, 1.5), 0.0948 - 0.006 * a * a, t);
    var p = headAt(phi, y, 0.001 + 0.0044 * Math.sin(PI * (0.14 + 0.8 * t)) * (1 - 0.45 * a * a));
    return [p[0], p[1], p[2], j / 14, t];
  });
  G.beard = mergeGeometries([low, setAll(stache, 'bw', 0)]);

  // ── the shemagh: one cloth over the head, open for the face, lying on the shoulders by the neck and
  //    hanging in a point down the back. The part on the body follows the chest (bw = 1), so it never cuts
  //    through the body when the head turns ──
  var HOOD = [0.015, 0.035, 0.055, 0.075, 0.095, 0.115, 0.135, 0.148, 0.152, 0.158, 0.163, 0.167, FOREHEAD, 0.188, 0.205, 0.222, 0.235, 0.243, HOOD_TOP];
  var KD = 9, NU = 44, rowsS = KD + HOOD.length, bwS = [];
  function hoodPoint(y, j) {
    var a0 = faceOpen(y), phi = a0 + (PI * 2 - a0 * 2) * j / NU;
    var p = ringXZ(hoodRing(y), phi); return [p[0], y, p[1]];
  }
  // push a point of the cloth out of the body until it lies `gap` off it
  function outOf(pt, gap) {
    for (var it = 0; it < 40 && inBody(pt[0], pt[1], pt[2], gap); it++) {
      var yc = pt[1] + HEAD_AT.y, l = Math.hypot(pt[0], pt[2]) || 1, up = yc > 0.43 ? 1.4 : 0, n = Math.hypot(1, up);
      pt[0] += pt[0] / l * 0.003 / n; pt[2] += pt[2] / l * 0.003 / n; pt[1] += 0.003 * up / n;
    }
    return pt;
  }
  // where the edge of the cloth ends for each column: `a` is 0 at the middle of the back, 1 at the face
  function hem(a, sd) {
    var x, y, z;
    if (a <= 0.6) { var q = a / 0.6; x = 0.16 * Math.pow(q, 0.9); y = -0.30 + 0.245 * q; z = -0.2; }
    else { var q2 = (a - 0.6) / 0.4; x = 0.16 - 0.058 * q2; y = -0.055 + 0.02 * q2; z = -0.09 + 0.135 * q2; }
    var pt = [sd * x, y, z];
    if (a <= 0.6) {                 // on the back: come forward until the cloth meets it
      for (var it = 0; it < 80 && !inBody(pt[0], pt[1], pt[2], 0.013); it++) pt[2] += 0.002;
      pt[2] -= 0.002;
    }
    return outOf(pt, 0.012);
  }
  // the part below the head, column by column from the hem up; then evened out along the rows so the edge is clean
  var drape = [], backness = [];
  for (var dj = 0; dj <= NU; dj++) {
    var top = hoodPoint(HOOD[0], dj), dphi = FACE_OPEN + (PI * 2 - FACE_OPEN * 2) * dj / NU;
    var da = Math.abs(dphi - PI) / (PI - FACE_OPEN), h = hem(da, dphi < PI ? 1 : -1), col = [];
    for (var di = 0; di < KD; di++) { var ds = 1 - di / KD; col.push(outOf([lerp(top[0], h[0], ds), lerp(top[1], h[1], ds), lerp(top[2], h[2], Math.pow(ds, 0.8))], 0.011)); }
    drape.push(col); backness.push(1 - smooth(0.55, 1, da));
  }
  for (var pass = 0; pass < 2; pass++) {
    var nxt = drape.map(function (col) { return col.map(function (pt) { return pt.slice(); }); });
    for (dj = 1; dj < NU; dj++) for (di = 0; di < KD; di++) for (var ax = 0; ax < 3; ax++) nxt[dj][di][ax] = drape[dj][di][ax] * 0.5 + (drape[dj - 1][di][ax] + drape[dj + 1][di][ax]) * 0.25;
    drape = nxt.map(function (col) { return col.map(function (pt) { return outOf(pt, 0.0095); }); });
  }
  G.shemagh = grid(rowsS, NU + 1, function (i, j) {
    var p = i >= KD ? hoodPoint(HOOD[i - KD], j) : drape[j][i];
    bwS.push(smooth(0.075, -0.01, p[1]));
    // the check goes round the head; on the back it is laid flat, and on the crown it is laid flat from above
    var u = j / NU * 6.2, v = p[1] * 10;
    if (i < KD) u = lerp(u, 3.1 - p[0] * 9.6, backness[j] * Math.min(1, (KD - i) / 2));
    if (p[1] >= 0.2215) { u = p[0] * 10; v = p[2] * 10; }
    return [p[0], p[1], p[2], u, v];
  });
  G.shemagh.setAttribute('bw', new THREE.BufferAttribute(new Float32Array(bwS), 1));

  // ── the two black cords of the igal, lying on the cloth ──
  function cord(y0, rt) {
    return grid(41, 8, function (i, j) {
      var phi = PI * 2 * i / 40, c = ringXZ(hoodRing(y0), phi), l = Math.hypot(c[0], c[1]) || 1, m = PI * 2 * j / 7;
      var out = rt * 0.7 + rt * Math.cos(m), y = y0 + c[1] * 0.1 + rt * Math.sin(m);
      return [c[0] + c[0] / l * out, y, c[1] + c[1] / l * out, i / 40, j / 7];
    }, { flip: true });
  }
  G.igal = mergeGeometries([cord(0.204, 0.0092), cord(0.2215, 0.0088)]);

  // ── sleeves: round at the shoulder and the elbow, an open cuff at the wrist ──
  G.upper = lathe([[0, -0.317], [0.03, -0.311], [0.044, -0.294], [0.048, -0.27], [0.052, -0.16], [0.057, -0.06], [0.0585, 0], [0.051, 0.03], [0.031, 0.05], [0, 0.0585]], 16);
  G.fore = lathe([[0, -0.2], [0.03, -0.212], [0.035, -0.233], [0.0455, -0.233], [0.0445, -0.224], [0.043, -0.19], [0.046, -0.08], [0.048, 0], [0.046, 0.016], [0.03, 0.038], [0, 0.048]], 16);

  // ── hands: a palm, the fingers together and slightly curled, a thumb (the palm faces -z) ──
  var HAND = [
    [-0.122, 0.006, 0.0025, 0.0025, 2, -0.021], [-0.115, 0.022, 0.0065, 0.0065, 2.2, -0.017], [-0.103, 0.033, 0.0095, 0.009, 2.5, -0.010],
    [-0.085, 0.0385, 0.0115, 0.0105, 2.6, -0.004], [-0.065, 0.0405, 0.0135, 0.0125, 2.6, 0], [-0.045, 0.0395, 0.015, 0.014, 2.5, 0],
    [-0.02, 0.0335, 0.016, 0.015, 2.3, 0], [0.0, 0.0245, 0.016, 0.0155, 2.1, 0], [0.036, 0.0215, 0.017, 0.017, 2, 0]
  ];
  var palm = loft(HAND, [-0.122, -0.115, -0.103, -0.085, -0.065, -0.045, -0.02, 0.0, 0.036], 16);
  var thumb = new THREE.CapsuleGeometry(0.0105, 0.034, 3, 8);
  var dir = new THREE.Vector3(-0.024, -0.044, -0.008).normalize();
  thumb.applyMatrix4(new THREE.Matrix4().makeRotationFromQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, -1, 0), dir)));
  thumb.translate(-0.04, -0.04, -0.007);
  G.handL = mergeGeometries([palm, thumb]);
  G.handR = mirrorX(G.handL);

  // ── the frame drum (tar): a wooden frame with the skin on the side facing +z ──
  G.rim = new THREE.CylinderGeometry(0.21, 0.21, 0.055, 36, 1, true); G.rim.rotateX(Math.PI / 2);
  G.skin = new THREE.CircleGeometry(0.207, 36); G.skin.translate(0, 0, 0.026);
  return G;
}
// a part that follows two joints at once, a little of each per vertex (cloth between the head and the
// shoulders, a beard on a moving jaw). `bw` says how much of the second joint; `rel` is where that joint
// is, seen from the first one
function twoBone(mat) {
  mat.onBeforeCompile = function (sh) {
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nattribute float bw;\nattribute mat4 rel;')
      .replace('#include <beginnormal_vertex>', '#include <beginnormal_vertex>\n  objectNormal = normalize(mix(objectNormal, mat3(rel) * objectNormal, bw));')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\n  transformed = mix(transformed, (rel * vec4(transformed, 1.0)).xyz, bw);');
  };
  mat.customProgramCacheKey = function () { return 'twoBone'; };
  return mat;
}
// arm poses, left arm (the right one is mirrored): [shoulder x, shoulder z (outward), elbow, turn of the forearm,
// turn of the upper arm, bend of the wrist, tilt of the wrist]. They were worked out so that the palms land where
// they should: on the thighs, flat on each other, under the frame of the drum, on its skin, and on its two sides
// when it is lifted
var POSE = {
  knee: [-0.34, 0.16, -0.43, 0.85, -1.06, -0.46, 0.05],
  clap: [-0.52, 0.09, -1.48, 1.60, -0.88, -0.85, 0.15], clapOpen: [-0.32, 0.15, -1.64, 1.44, -0.55, -0.88, 0.07],
  holdL: [-0.17, 0.15, -1.51, -0.53, -0.52, 0.22, 0.16],
  holdR: [-0.46, 0.06, -1.67, 1.60, -0.01, 0.69, -0.45], hitR: [-0.32, 0.07, -1.84, 1.60, -0.14, 0.67, -0.45],
  upL: [-2.28, 0.04, -1.11, 1.60, 0.00, 0.28, -0.17], upR: [-2.19, 0.20, -1.40, 1.60, -0.06, 0.17, 0.01]
};
function mix3(a, b, t) { var o = []; for (var i = 0; i < a.length; i++) o.push(a[i] + (b[i] - a[i]) * t); return o; }

// ─────────────────────────────────────────────────────────────
// the world
// ─────────────────────────────────────────────────────────────
export class World {
  constructor(canvasEl) {
    this.canvas = canvasEl;
    this.lowPower = /Android|iPhone|iPad|Mobile/i.test(navigator.userAgent);
    this.listeners = {};
    this.anims = [];
    this.clock = 0;
    this.xr = null; this.placed = false; this.arScale = 1;
    this.orbit = { yaw: 0, pitch: 0, on: false };
    // the beat everyone moves to (set by the controller each frame), and what each row is doing
    this.beat = 0; this.bpm = 48;
    this.strokes = [0, 2 / 3, 1, 4 / 3];   // where the drum strokes fall in the cycle (set by the controller)
    this.rows = [{ mode: 'hold' }, { mode: 'hold' }];
    this.you = -1;            // which performer is you (-1: nobody)
    this.youManual = false;   // when true, your performer moves only with your taps and swipes
    this.khalluAt = null;     // the beat when everyone slaps the drums down
    this._v = null;
  }
  on(name, fn) { (this.listeners[name] = this.listeners[name] || []).push(fn); }
  emit(name, a, b, c) { (this.listeners[name] || []).forEach(function (f) { try { f(a, b, c); } catch (e) { console.error(e); } }); }

  async init() {
    this.fast = !!window.CL_SM_FAST;
    var r = this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: !this.fast, alpha: true, powerPreference: 'high-performance' });
    r.setPixelRatio(window.CL_SM_DPR || Math.min(window.devicePixelRatio || 1, 2));
    r.outputColorSpace = THREE.SRGBColorSpace;
    r.toneMapping = THREE.ACESFilmicToneMapping;
    r.toneMappingExposure = 1.05;
    r.shadowMap.enabled = !this.fast;
    r.shadowMap.type = THREE.PCFSoftShadowMap;
    r.xr.enabled = true;

    var scene = this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(46, 1, 0.02, 120);
    this.camera.position.set(4, 1.6, 4);
    this.rig = { pos: this.camera.position.clone(), look: new THREE.Vector3(0, 0.6, 0), tpos: this.camera.position.clone(), tlook: new THREE.Vector3(0, 0.6, 0), k: 2, drift: 0, mode: 'cover' };

    this.mats();
    this.field = new THREE.Group(); scene.add(this.field);
    this.env3d = new THREE.Group(); scene.add(this.env3d);
    this.buildGathering();
    this.buildHearth();
    this.buildLantern();
    this.buildDunes();
    this.buildPalms();
    this.buildSky();
    this.buildReticle();

    // light: the moon, the night sky, the fire and the lantern
    var moon = this.moonLight = new THREE.DirectionalLight(0xAFC2FF, 1.0);
    moon.position.set(4.5, 6.5, -3.5);
    moon.target.position.set(0, 0, 0);
    moon.castShadow = !this.fast;
    moon.shadow.mapSize.set(this.lowPower ? 1024 : 2048, this.lowPower ? 1024 : 2048);
    var sc = moon.shadow.camera; sc.left = -4.5; sc.right = 4.5; sc.top = 4; sc.bottom = -4; sc.near = 0.5; sc.far = 18;
    moon.shadow.bias = -0.0006; moon.shadow.normalBias = 0.025;
    this.field.add(moon); this.field.add(moon.target);
    this.hemi = new THREE.HemisphereLight(0x46558A, 0x1A140F, 0.5);
    scene.add(this.hemi);
    scene.fog = new THREE.Fog(0x0C1226, 14, 46);

    var pm = new THREE.PMREMGenerator(r);
    this.envMap = pm.fromEquirectangular(skyEquirect()).texture;
    pm.dispose();
    scene.environment = this.envMap;

    this.resize();
    var self = this;
    if (window.ResizeObserver) new ResizeObserver(function () { self.resize(); }).observe(this.canvas.parentElement);
    window.addEventListener('resize', function () { self.resize(); });
    this.last = performance.now();
    r.setAnimationLoop(function (t, frame) { self.tick(t, frame); });
  }

  resize() {
    if (this.renderer.xr.isPresenting) return;
    var el = this.canvas.parentElement, w = el.clientWidth || window.innerWidth, h = el.clientHeight || window.innerHeight;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    var fov = w / h < 0.7 ? 58 : 44;
    var off = Math.round(h * (w / h < 0.7 ? 0.15 : 0.08));
    this.camera.fov = 2 * Math.atan(Math.tan(fov * Math.PI / 360) * (h + 2 * off) / h) * 180 / Math.PI;
    this.camera.setViewOffset(w, h + 2 * off, 0, 2 * off, w, h);
    this.camera.updateProjectionMatrix();
  }

  mats() {
    this.wood = new THREE.MeshStandardMaterial({ map: woodTexture(), roughness: 0.8 });
    this.woodDark = new THREE.MeshStandardMaterial({ color: 0x4A3220, roughness: 0.9 });
    this.brass = new THREE.MeshStandardMaterial({ color: 0xC9A04E, metalness: 0.9, roughness: 0.32 });
    this.iron = new THREE.MeshStandardMaterial({ color: 0x2C2622, metalness: 0.7, roughness: 0.5 });
    this.stone = new THREE.MeshStandardMaterial({ color: 0x6A5243, roughness: 1, flatShading: true });
  }

  // ── the gathering: rugs, seats, and eighteen performers ──
  seatPos(row, seat) { return { x: (seat - ROW.LEAD) * ROW.GAP, z: row === 0 ? -ROW.Z : ROW.Z }; }
  buildGathering() {
    var F = this.field;
    // a Sadu rug under each row
    var specsA = [{ edge: 'teeth', center: 'tree', ground: 'red', figure: 'white' }, { edge: 'grains', center: 'chain', ground: 'black', figure: 'white' }];
    var specsB = [{ edge: 'grains', center: 'chain', ground: 'red', figure: 'white' }, { edge: 'teeth', center: 'camels', ground: 'black', figure: 'white' }];
    [specsA, specsB].forEach(function (sp, r) {
      var t = rugTexture(sp, 200);
      var rug = new THREE.Mesh(new THREE.PlaneGeometry(5.3, 1.05), new THREE.MeshStandardMaterial({ map: t, roughness: 1 }));
      rug.rotation.x = -Math.PI / 2; rug.position.set(0, 0.006, (r === 0 ? -1 : 1) * (ROW.Z - 0.02)); rug.receiveShadow = true;
      F.add(rug);
    });
    // the performers
    var G = this.geo = performerGeometry();
    var N = ROW.N * 2;
    var cloth = clothTexture();
    var M = this.pm = {
      thobe: new THREE.MeshStandardMaterial({ map: cloth, color: 0xF1EEE6, roughness: 0.82 }),
      skin: new THREE.MeshStandardMaterial({ map: skinTexture(), color: 0xB07C59, roughness: 0.62 }),
      face: new THREE.MeshStandardMaterial({ map: faceTexture(), roughness: 0.45 }),
      shemagh: twoBone(new THREE.MeshStandardMaterial({ map: shemaghTexture(), roughness: 0.85, side: THREE.DoubleSide })),
      igal: new THREE.MeshStandardMaterial({ color: 0x141212, roughness: 0.55 }),
      beard: twoBone(new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.95 })),
      bisht: new THREE.MeshStandardMaterial({ map: bishtTexture(), roughness: 0.75, side: THREE.DoubleSide }),
      rim: new THREE.MeshStandardMaterial({ map: this.wood.map, color: 0xB08A60, roughness: 0.7, side: THREE.DoubleSide }),
      drum: new THREE.MeshStandardMaterial({ map: drumSkinTexture(), roughness: 0.75, side: THREE.DoubleSide })
    };
    var self = this;
    function inst(geo, mat, count) {
      var m = new THREE.InstancedMesh(geo, mat, count);
      m.castShadow = true; m.receiveShadow = true;
      m.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      m.frustumCulled = false;
      F.add(m); return m;
    }
    // the two parts that bend between two joints carry, for each man, where the second joint is
    function bend(geo) {
      var rel = new THREE.InstancedBufferAttribute(new Float32Array(N * 16), 16); rel.setUsage(THREE.DynamicDrawUsage);
      var id = new THREE.Matrix4(); for (var k = 0; k < N; k++) id.toArray(rel.array, k * 16);
      geo.setAttribute('rel', rel); return geo;
    }
    var depthBend = twoBone(new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking }));
    this.im = {
      legs: inst(G.legs, M.thobe, N), torso: inst(G.torso, M.thobe, N), head: inst(G.head, M.skin, N),
      face: inst(G.face, M.face, N),
      shemagh: inst(bend(G.shemagh), M.shemagh, N), igal: inst(G.igal, M.igal, N),
      beard: inst(bend(G.beard), M.beard, N),
      upper: inst(G.upper, M.thobe, N * 2), fore: inst(G.fore, M.thobe, N * 2), handL: inst(G.handL, M.skin, N), handR: inst(G.handR, M.skin, N),
      rim: inst(G.rim, M.rim, N), skin: inst(G.skin, M.drum, N),
      bisht: inst(G.bisht, M.bisht, 2)
    };
    this.im.shemagh.customDepthMaterial = depthBend; this.im.beard.customDepthMaterial = depthBend;
    this.im.face.castShadow = false;
    // a little variety in the white of the thobes
    var rnd = mulberry32(42), tint = new THREE.Color();
    for (var i = 0; i < N; i++) {
      var w = 0.93 + rnd() * 0.07;
      tint.setRGB(w, w * (0.985 + rnd() * 0.015), w * (0.96 + rnd() * 0.04));
      this.im.legs.setColorAt(i, tint); this.im.torso.setColorAt(i, tint);
      this.im.upper.setColorAt(i * 2, tint); this.im.upper.setColorAt(i * 2 + 1, tint);
      this.im.fore.setColorAt(i * 2, tint); this.im.fore.setColorAt(i * 2 + 1, tint);
      var s = 0.85 + rnd() * 0.3; tint.setRGB(s, s, s);
      this.im.head.setColorAt(i, tint); this.im.handL.setColorAt(i, tint); this.im.handR.setColorAt(i, tint);
      // beards: black, dark brown, or grey for the elders (the two mu'allims are elders)
      var lead = i % ROW.N === ROW.LEAD, k = rnd();
      tint.set(lead || k < 0.18 ? 0xB9B4AC : k < 0.6 ? 0x1A1512 : 0x3A2A1E);
      this.im.beard.setColorAt(i, tint);
      // the mu'allim's arms are in the sleeves of his bisht
      if (lead) { tint.set(0x30231B); ['upper', 'fore'].forEach(function (k2) { self.im[k2].setColorAt(i * 2, tint); self.im[k2].setColorAt(i * 2 + 1, tint); }); }
    }
    var white = new THREE.Color(1, 1, 1);
    for (var c2 = 0; c2 < N; c2++) this.im.skin.setColorAt(c2, white);
    // the rigs: invisible joints, posed every frame
    this.figs = [];
    for (var r = 0; r < 2; r++) for (var s2 = 0; s2 < ROW.N; s2++) this.figs.push(this.makeFigure(r, s2, rnd));
    this.leaders = [this.figs[ROW.LEAD], this.figs[ROW.N + ROW.LEAD]];
    this.leaders.forEach(function (f, k) { f.leader = true; f.bishtIndex = k; });
    // the ring that marks your seat
    this.youRing = new THREE.Mesh(new THREE.RingGeometry(0.3, 0.36, 48), new THREE.MeshBasicMaterial({ color: 0xFFD27A, transparent: true, opacity: 0.85, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide }));
    this.youRing.rotation.x = -Math.PI / 2; this.youRing.position.y = 0.012; this.youRing.visible = false; F.add(this.youRing);
    // rings on empty seats, for choosing where to sit
    this.seatRings = [];
    for (var q = 0; q < 3; q++) {
      var ring = new THREE.Mesh(new THREE.RingGeometry(0.22, 0.27, 40), new THREE.MeshBasicMaterial({ color: 0xFFE7B0, transparent: true, opacity: 0.6, depthWrite: false, side: THREE.DoubleSide }));
      ring.rotation.x = -Math.PI / 2; ring.position.y = 0.013; ring.visible = false; F.add(ring); this.seatRings.push(ring);
    }
    this.tmpM = new THREE.Matrix4(); this.tmpQ = new THREE.Quaternion(); this.tmpQ2 = new THREE.Quaternion();
    this.tmpP = new THREE.Vector3(); this.tmpP2 = new THREE.Vector3(); this.tmpS = new THREE.Vector3();
    this.zero = new THREE.Matrix4().makeScale(0, 0, 0);
    this.tmpM2 = new THREE.Matrix4(); this.tmpE = new THREE.Euler();
    // the mu'allim's shemagh lies over his bisht: the part on his body sits a little further out
    var d = HEAD_AT;
    this.leadDrape = new THREE.Matrix4().makeTranslation(-d.x, -d.y + 0.008, -d.z).multiply(new THREE.Matrix4().makeScale(1.09, 1, 1.16)).multiply(new THREE.Matrix4().makeTranslation(d.x, d.y, d.z));
    this.updateFigures(0.016);
  }
  makeFigure(row, seat, rnd) {
    var root = new THREE.Object3D();
    var hips = new THREE.Object3D(); hips.position.set(0, 0.2, -0.04); root.add(hips);
    var chest = new THREE.Object3D(); chest.position.set(0, 0.0, 0); hips.add(chest);
    var head = new THREE.Object3D(); head.position.set(HEAD_AT.x, HEAD_AT.y, HEAD_AT.z); chest.add(head);
    var shL = new THREE.Object3D(); shL.position.set(0.2, 0.44, 0); chest.add(shL);
    var shR = new THREE.Object3D(); shR.position.set(-0.2, 0.44, 0); chest.add(shR);
    var elL = new THREE.Object3D(); elL.position.set(0, -0.27, 0); shL.add(elL);
    var elR = new THREE.Object3D(); elR.position.set(0, -0.27, 0); shR.add(elR);
    var hdL = new THREE.Object3D(); hdL.position.set(0, -0.255, 0); hdL.rotation.order = 'YXZ'; elL.add(hdL);
    var hdR = new THREE.Object3D(); hdR.position.set(0, -0.255, 0); hdR.rotation.order = 'YXZ'; elR.add(hdR);
    // where the drum sits: held at the chest, lifted over the head, or lying on the rug
    var dHold = new THREE.Object3D(); dHold.position.set(-0.03, 0.34, 0.31); dHold.rotation.set(-0.12, -0.28, 0); chest.add(dHold);
    var dUp = new THREE.Object3D(); dUp.position.set(-0.02, 0.86, 0.14); dUp.rotation.set(-0.75, -0.12, 0); chest.add(dUp);
    var dDown = new THREE.Object3D(); dDown.position.set(0.02, 0.035, 0.66); dDown.rotation.set(-Math.PI / 2, 0, 0.3); root.add(dDown);
    var p = this.seatPos(row, seat);
    root.position.set(p.x, 0, p.z); root.rotation.y = row === 0 ? 0 : Math.PI;
    return {
      row: row, seat: seat, nodes: { root: root, hips: hips, chest: chest, head: head, shL: shL, shR: shR, elL: elL, elR: elR, hdL: hdL, hdR: hdR, dHold: dHold, dUp: dUp, dDown: dDown },
      jit: (rnd() - 0.5) * 0.06, lean: 0, bob: 0, lift: 0, hold: 1, clapOn: 0, sing: 0, mouth: 0, wide: 0.8 + rnd() * 0.35, show: 1, showTo: 1,
      strike: 0, clap: 0, slap: 0, x: p.x, z: p.z,
      // your own moves, when you are this performer
      man: { lean: 0, leanT: 0, lift: 0, hold: 1, strikeT: -9, clapT: -9, sing: 0, slapT: -9 }
    };
  }
  // put a performer in a seat (they shuffle along the rug)
  setSeat(fig, seat, snap) {
    var p = this.seatPos(fig.row, seat);
    fig.seat = seat;
    if (snap) { fig.x = p.x; fig.z = p.z; }
    fig.tx = p.x;
  }
  figAt(row, seat) { for (var i = 0; i < this.figs.length; i++) { var f = this.figs[i]; if (f.row === row && f.seat === seat) return f; } return null; }
  // you sit in this row and seat; whoever sat there moves to where you were
  moveYou(seat, snap) {
    var me = this.figs[this.you]; if (!me) return;
    var other = this.figAt(me.row, seat);
    var from = me.seat;
    if (other && other !== me) this.setSeat(other, from, snap);
    this.setSeat(me, seat, snap);
  }
  setYou(i) {
    this.you = i;
    this.youRing.visible = i >= 0;
    if (i >= 0) { var f = this.figs[i]; f.man.hold = f.hold; f.man.lift = f.lift; }
  }
  youFig() { return this.figs[this.you] || null; }
  // what your performer does when you tap or swipe
  youDo(kind) {
    var f = this.youFig(); if (!f) return;
    var m = f.man, t = this.clock;
    if (kind === 'left' || kind === 'right') { m.lean = kind === 'right' ? 1 : -1; m.leanT = t; }
    else if (kind === 'up') { m.lift = 1; m.hold = 1; }
    else if (kind === 'down') { m.lift = 0; }
    else if (kind === 'strike') m.strikeT = t;
    else if (kind === 'clap') m.clapT = t;
    else if (kind === 'khallu') { m.slapT = t; m.lift = 0; }
  }
  youSing(on) { var f = this.youFig(); if (f) f.man.sing = on ? 1 : 0; }
  // a drum skin darkens when it is wet
  setDrumTint(i, k) { var c = new THREE.Color(1, 1, 1).multiplyScalar(k); this.im.skin.setColorAt(i, c); this.im.skin.instanceColor.needsUpdate = true; }
  setShow(fig, v, snap) { fig.showTo = v; if (snap) fig.show = v; }
  // rings on seats you could choose
  showSeatRings(list) {
    var self = this;
    this.seatRings.forEach(function (r, k) {
      var s = list && list[k];
      r.visible = !!s;
      if (s) { var p = self.seatPos(s.row, s.seat); r.position.x = p.x; r.position.z = p.z + (s.row === 0 ? 0.08 : -0.08); }
    });
  }

  // pose everyone for this frame
  updateFigures(dt) {
    var figs = this.figs, b0 = this.beat, im = this.im, self = this;
    var tm = this.tmpM, q = this.tmpQ, q2 = this.tmpQ2, p1 = this.tmpP, p2 = this.tmpP2, sc = this.tmpS;
    var relS = im.shemagh.geometry.attributes.rel, relB = im.beard.geometry.attributes.rel, m2 = this.tmpM2;
    for (var i = 0; i < figs.length; i++) {
      var f = figs[i], n = f.nodes, b = b0 + f.jit, mode = this.rows[f.row].mode;
      var isYou = i === this.you && this.youManual;
      // targets from what the row is doing
      var tLean = 0, tBob = 0, tLift = 0, tHold = 1, tClapOn = 0, tSing = 0, strike = 0, clap = 0;
      var rowLift = this.rows[f.row].lift;
      if (mode === 'rest') { tHold = 0; tBob = Math.sin(this.clock * 0.9 + i) * 0.04; }
      else if (mode === 'hold') { tHold = 1; tBob = Math.sin(this.clock * 0.9 + i) * 0.04; if (rowLift != null) tLift = rowLift; }
      else if (mode === 'voice') {
        // singing a line with the drums held: heads up, a slow sway
        tHold = 1; tSing = 1; tLean = 0.3 * Math.sin(Math.PI * b / 2); tBob = 0.08 * Math.sin(Math.PI * b);
      }
      else if (mode === 'sing') {
        // one row sings and claps: drums down, hands meeting on the drum strokes, a small rock forward
        tHold = 0; tClapOn = 1; tSing = 1; clap = strokePulse(b, this.strokes, 0.15);
        tBob = 0.35 * pulse(b, 0.45);
      } else if (mode === 'sway') {
        // the other row sways, right for one cycle and left for the next, lifting the drums every
        // other pair of cycles and striking on every stroke
        tHold = 1; tLean = Math.cos(Math.PI * b / 2);
        tLift = rowLift != null ? rowLift : (Math.floor(b / 4) % 2 === 1) ? 1 : 0;
        strike = strokePulse(b, this.strokes, 0.13); tBob = 0.15 * pulse(b + 1, 0.5);
      } else if (mode === 'beat') {
        // drums held at the chest, struck on every stroke
        tHold = 1; strike = strokePulse(b, this.strokes, 0.13); tBob = 0.18 * pulse(b, 0.5);
      }
      if (isYou) {
        var m = f.man;
        var since = this.clock - m.leanT;
        tLean = m.lean * Math.max(0, 1 - Math.max(0, since - 0.25) / 0.5);
        tLift = m.lift; tHold = mode === 'sing' || mode === 'rest' ? 0 : m.hold; tClapOn = mode === 'sing' ? 1 : 0;
        tSing = m.sing; tBob = m.sing * 0.15 * Math.sin(this.clock * 3);
        strike = Math.max(0, 1 - (this.clock - m.strikeT) / 0.16);
        clap = Math.max(0, 1 - (this.clock - m.clapT) / 0.16);
      }
      // the mouth: on the syllables of the verse when the controller says which, otherwise a plain open-and-close
      var rm = this.rows[f.row].mouth, tMouth = rm != null ? rm : (tSing > 0.5 ? 0.35 + 0.3 * Math.sin(this.clock * 7 + i) : 0);
      // the khallu: drums slapped down on the rug together
      var slap = 0, slapHold = 1;
      var ks = isYou ? (this.clock - f.man.slapT) : (this.khalluAt != null ? (b0 - this.khalluAt) * 60 / this.bpm : -9);
      if (ks > -0.12 && ks < 1.4) {
        var down = ks < 0 ? 1 + ks / 0.12 : 1;
        slap = ks < 0 ? down : Math.max(0, 1 - ks / 0.25);
        slapHold = ks < 0.9 ? 1 - down : Math.min(1, (ks - 0.9) / 0.5);
        tBob = Math.max(tBob, 0.5 * (ks < 0.4 ? 1 : Math.max(0, 1 - (ks - 0.4) / 0.6)));
        tLift = 0;
      }
      f.lean = damp(f.lean, tLean, 7, dt);
      f.bob = damp(f.bob, tBob, 10, dt);
      f.lift = damp(f.lift, tLift, 6, dt);
      f.hold = damp(f.hold, tHold * slapHold, slapHold < 1 ? 30 : 5, dt);
      f.clapOn = damp(f.clapOn, tClapOn, 6, dt);
      f.sing = damp(f.sing, tSing, 4, dt);
      f.mouth = damp(f.mouth, Math.min(1, tMouth * f.wide), 26, dt);
      f.show = damp(f.show, f.showTo, 5, dt);
      if (f.tx !== undefined) f.x = damp(f.x, f.tx, 4, dt);
      // the joints
      n.root.position.set(f.x, 0, f.z);
      var sh = Math.max(0.0001, f.show);
      n.root.scale.setScalar(sh);
      n.hips.rotation.set(f.bob * 0.32, 0, f.lean * 0.21);
      n.chest.rotation.set(f.bob * 0.18 - f.sing * 0.04, 0, f.lean * 0.1);
      n.head.rotation.set(-f.sing * 0.2 + f.bob * 0.2 - f.mouth * 0.05, 0, f.lean * 0.12);
      // hands on the thighs, or clapping (apart, then together on the stroke)
      var gL = mix3(POSE.knee, mix3(POSE.clapOpen, POSE.clap, clap), f.clapOn);
      // the left hand under the frame of the drum; the right one off the skin, landing on it for a stroke; both on the frame when it is lifted
      var hL = mix3(POSE.holdL, POSE.upL, f.lift), hR = mix3(mix3(POSE.holdR, POSE.hitR, strike), POSE.upR, f.lift);
      var L = mix3(gL, hL, f.hold), Rr = mix3(gL, hR, f.hold);
      Rr[2] += strike * 0.12 * f.lift * f.hold;
      L[0] -= slap * 0.5; Rr[0] -= slap * 0.5;
      n.shL.rotation.set(L[0], L[4], L[1]); n.elL.rotation.set(L[2], 0, 0); n.hdL.rotation.set(L[5], L[3], L[6]);
      n.shR.rotation.set(Rr[0], -Rr[4], -Rr[1]); n.elR.rotation.set(Rr[2], 0, 0); n.hdR.rotation.set(Rr[5], -Rr[3], -Rr[6]);
      n.root.updateMatrixWorld(true);
      // instance matrices
      if (f.show < 0.02) {
        ['legs', 'torso', 'head', 'face', 'beard', 'shemagh', 'igal', 'handL', 'handR', 'rim', 'skin'].forEach(function (k) { im[k].setMatrixAt(i, self.zero); });
        ['upper', 'fore'].forEach(function (k) { im[k].setMatrixAt(i * 2, self.zero); im[k].setMatrixAt(i * 2 + 1, self.zero); });
        if (f.leader) im.bisht.setMatrixAt(f.bishtIndex, self.zero);
        continue;
      }
      im.legs.setMatrixAt(i, n.root.matrixWorld);
      im.torso.setMatrixAt(i, n.chest.matrixWorld);
      im.head.setMatrixAt(i, n.head.matrixWorld); im.face.setMatrixAt(i, n.head.matrixWorld);
      // the beard sits on the head; its chin drops with the jaw as the mouth opens
      im.beard.setMatrixAt(i, n.head.matrixWorld);
      m2.makeTranslation(0, -0.0135 * f.mouth, -0.0015 * f.mouth); m2.toArray(relB.array, i * 16);
      // the shemagh sits on the head; the part lying on the shoulders and back stays with the chest. Seen
      // from the head, the chest is the head's own turn undone (the mu'allim's lies a little further out, over his bisht)
      im.shemagh.setMatrixAt(i, n.head.matrixWorld);
      m2.makeRotationFromEuler(n.head.rotation).invert(); if (f.leader) m2.multiply(this.leadDrape);
      m2.toArray(relS.array, i * 16);
      im.igal.setMatrixAt(i, n.head.matrixWorld);
      im.upper.setMatrixAt(i * 2, n.shL.matrixWorld); im.upper.setMatrixAt(i * 2 + 1, n.shR.matrixWorld);
      im.fore.setMatrixAt(i * 2, n.elL.matrixWorld); im.fore.setMatrixAt(i * 2 + 1, n.elR.matrixWorld);
      im.handL.setMatrixAt(i, n.hdL.matrixWorld); im.handR.setMatrixAt(i, n.hdR.matrixWorld);
      if (f.leader) im.bisht.setMatrixAt(f.bishtIndex, n.chest.matrixWorld);
      // the drum: between held and lifted, then between that and lying on the rug
      n.dHold.matrixWorld.decompose(p1, q, sc);
      n.dUp.matrixWorld.decompose(p2, q2, sc);
      p1.lerp(p2, f.lift); q.slerp(q2, f.lift);
      n.dDown.matrixWorld.decompose(p2, q2, sc);
      var hw = f.hold;
      p2.lerp(p1, hw); q2.slerp(q, hw);
      tm.compose(p2, q2, sc.set(sh, sh, sh));
      im.rim.setMatrixAt(i, tm); im.skin.setMatrixAt(i, tm);
      f.drumPos = f.drumPos || new THREE.Vector3(); f.drumPos.copy(p2);
    }
    for (var k in im) { im[k].instanceMatrix.needsUpdate = true; if (im[k].instanceColor) im[k].instanceColor.needsUpdate = true; }
    relS.needsUpdate = true; relB.needsUpdate = true;
    // your ring follows you
    var me = this.youFig();
    if (me && this.youRing.visible) {
      this.youRing.position.x = me.x; this.youRing.position.z = me.z + (me.row === 0 ? 0.1 : -0.1);
      this.youRing.material.opacity = 0.55 + 0.3 * Math.sin(this.clock * 3);
    }
  }
  // where your drum is, and the top of your head (for guides on screen)
  youDrum() { var f = this.youFig(); return f && f.drumPos ? f.drumPos : null; }
  youHead() { var f = this.youFig(); if (!f) return null; return { x: f.x, y: 1.05 * Math.max(0.3, f.show), z: f.z }; }

  // ── the coffee hearth at the end of the rows ──
  buildHearth() {
    var F = this.field, H = this.hearth = new THREE.Group(); F.add(H);
    H.position.set(-3.45, 0, 0.05);
    var rnd = mulberry32(9);
    for (var i = 0; i < 9; i++) {
      var a = i / 9 * Math.PI * 2, s = new THREE.Mesh(new THREE.DodecahedronGeometry(0.06 + rnd() * 0.025, 0), this.stone);
      s.position.set(Math.cos(a) * 0.22, 0.03, Math.sin(a) * 0.22); s.rotation.set(rnd() * 3, rnd() * 3, 0); s.castShadow = true; H.add(s);
    }
    var ember = new THREE.MeshStandardMaterial({ color: 0x220A04, emissive: 0xFF5A1A, emissiveIntensity: 1.6, roughness: 1 });
    for (var j = 0; j < 7; j++) { var e = new THREE.Mesh(new THREE.DodecahedronGeometry(0.03 + rnd() * 0.02, 0), ember); e.position.set((rnd() - 0.5) * 0.18, 0.02, (rnd() - 0.5) * 0.18); H.add(e); }
    var ft = flameTexture();
    this.flames = [];
    for (var f = 0; f < 3; f++) {
      var fl = new THREE.Mesh(new THREE.PlaneGeometry(0.17, 0.34), new THREE.MeshBasicMaterial({ map: ft, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, fog: false }));
      fl.position.set((f - 1) * 0.05, 0.16, (f - 1) * 0.02); fl.rotation.y = f * 1.05; H.add(fl); this.flames.push(fl);
    }
    var light = this.fire = new THREE.PointLight(0xFF8A3C, 3.4, 7, 1.5);
    light.position.set(0, 0.4, 0); H.add(light);
    var dallah = new THREE.Mesh(lathe([[0, 0], [0.06, 0.004], [0.065, 0.03], [0.05, 0.08], [0.028, 0.12], [0.03, 0.15], [0.042, 0.17], [0.012, 0.2], [0.004, 0.24], [0, 0.245]], 24), this.brass);
    dallah.position.set(0.3, 0, 0.18); dallah.castShadow = true; H.add(dallah);
    var spout = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.013, 0.12, 8), this.brass);
    spout.position.set(0.35, 0.13, 0.18); spout.rotation.z = -0.9; H.add(spout);
    var cupM = new THREE.MeshStandardMaterial({ color: 0xF2EDE4, roughness: 0.4 });
    [[0.38, 0.32], [0.45, 0.26], [0.42, 0.38]].forEach(function (p) { var cup = new THREE.Mesh(lathe([[0, 0], [0.016, 0.002], [0.022, 0.03], [0.021, 0.032]], 16), cupM); cup.position.set(p[0], 0, p[1]); H.add(cup); });
    var n = this.fast ? 12 : 30, ep = new Float32Array(n * 3);
    for (var k = 0; k < n; k++) { ep[k * 3] = (rnd() - 0.5) * 0.2; ep[k * 3 + 1] = rnd() * 1.2; ep[k * 3 + 2] = (rnd() - 0.5) * 0.2; }
    var eg = new THREE.BufferGeometry(); eg.setAttribute('position', new THREE.BufferAttribute(ep, 3));
    this.sparks = new THREE.Points(eg, new THREE.PointsMaterial({ color: 0xFFB060, size: 0.02, transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }));
    H.add(this.sparks);
  }
  // ── a lantern at the other end ──
  buildLantern() {
    var F = this.field, g = this.lantern = new THREE.Group(); F.add(g);
    g.position.set(3.3, 0, -0.05);
    var base = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.09, 0.04, 16), this.brass); base.position.y = 0.02; g.add(base);
    var glass = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.16, 16, 1, true), new THREE.MeshStandardMaterial({ color: 0xFFE2A0, emissive: 0xFFB45A, emissiveIntensity: 2.2, transparent: true, opacity: 0.85, side: THREE.DoubleSide }));
    glass.position.y = 0.12; g.add(glass);
    var cap = new THREE.Mesh(new THREE.ConeGeometry(0.085, 0.08, 16), this.brass); cap.position.y = 0.24; g.add(cap);
    var ringT = new THREE.Mesh(new THREE.TorusGeometry(0.03, 0.005, 6, 16), this.brass); ringT.position.y = 0.3; g.add(ringT);
    for (var k = 0; k < 4; k++) { var bar = new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.005, 0.17, 5), this.brass); var a = k * Math.PI / 2; bar.position.set(Math.cos(a) * 0.065, 0.12, Math.sin(a) * 0.065); g.add(bar); }
    var glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(255, 190, 110), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }));
    glow.position.y = 0.13; glow.scale.setScalar(0.7); g.add(glow);
    var l = this.lampLight = new THREE.PointLight(0xFFB66B, 1.9, 6, 1.6); l.position.y = 0.3; g.add(l);
  }

  // ── the dunes: a hollow in the sand with dunes rising around it ──
  buildDunes() {
    var E = this.env3d;
    var g = new THREE.PlaneGeometry(90, 90, 170, 170), pos = g.attributes.position;
    for (var i = 0; i < pos.count; i++) {
      var x = pos.getX(i), y = pos.getY(i), r = Math.sqrt(x * x + y * y);
      var ridge = Math.pow(0.5 + 0.5 * Math.sin(x * 0.16 + y * 0.09 + fbm(x * 0.05, y * 0.05) * 3.2), 2.2);
      var h = smooth(5.5, 18, r) * (ridge * 3.8 + (fbm(x * 0.06 + 2, y * 0.06 + 5) - 0.4) * 2.2) + (fbm(x * 0.7, y * 0.7) - 0.5) * 0.03 * smooth(2, 4, r);
      pos.setZ(i, h);
    }
    g.computeVertexNormals();
    var ground = this.ground = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ map: sandTexture(), color: 0x7E7C8C, roughness: 1, metalness: 0 }));
    ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true;
    E.add(ground);
  }
  // ── palms of the oasis, dark against the sky ──
  buildPalms() {
    var E = this.env3d, rnd = mulberry32(12);
    var trunkM = new THREE.MeshStandardMaterial({ color: 0x3A2C22, roughness: 1 });
    var frondM = new THREE.MeshStandardMaterial({ map: frondTexture(), alphaTest: 0.35, side: THREE.DoubleSide, roughness: 1, color: 0x8A9A80 });
    [[-9, -12, 4.6], [-6.8, -14, 5.4], [-11.5, -9.5, 3.9], [7.5, -15, 5.0], [10.5, -12.5, 4.2], [12.5, -16, 5.6], [-14, -15, 4.8]].forEach(function (p, j) {
      var g = new THREE.Group(), h = p[2];
      var bend = (rnd() - 0.5) * 0.5;
      var curve = new THREE.CatmullRomCurve3([new THREE.Vector3(0, 0, 0), new THREE.Vector3(bend * 0.3, h * 0.5, 0), new THREE.Vector3(bend, h, 0)]);
      var trunk = new THREE.Mesh(new THREE.TubeGeometry(curve, 10, 0.13, 7), trunkM); g.add(trunk);
      for (var k = 0; k < 11; k++) {
        var fr = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 2.4, 1, 6), frondM);
        var fp = fr.geometry.attributes.position;
        for (var v = 0; v < fp.count; v++) { var yy = fp.getY(v) + 1.2; fp.setZ(v, -Math.pow(yy / 2.4, 2) * 0.9); fp.setY(v, yy); }
        fr.geometry.computeVertexNormals();
        var holder = new THREE.Group(); holder.position.set(bend, h, 0);
        holder.rotation.y = k / 11 * Math.PI * 2 + rnd() * 0.3;
        fr.rotation.x = -0.9 - rnd() * 0.6;
        holder.add(fr); g.add(holder);
      }
      g.position.set(p[0], -0.1, p[1]); g.rotation.y = rnd() * 6;
      E.add(g);
    });
  }
  // ── the night sky, the stars and the moon ──
  buildSky() {
    var E = this.env3d;
    var moonDir = new THREE.Vector3(0.55, 0.32, -0.77).normalize();
    var sky = new THREE.Mesh(new THREE.SphereGeometry(55, 32, 16), new THREE.ShaderMaterial({
      side: THREE.BackSide, depthWrite: false, fog: false,
      uniforms: { uMoon: { value: moonDir } },
      vertexShader: 'varying vec3 vDir; void main(){ vDir = normalize(position); vec4 p = modelViewMatrix * vec4(position, 1.0); gl_Position = projectionMatrix * p; }',
      fragmentShader: [
        'uniform vec3 uMoon; varying vec3 vDir;',
        'float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }',
        'float noise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f); return mix(mix(hash(i), hash(i+vec2(1,0)), f.x), mix(hash(i+vec2(0,1)), hash(i+vec2(1,1)), f.x), f.y); }',
        'void main(){',
        '  float h = vDir.y;',
        '  vec3 top = vec3(0.012, 0.016, 0.05), mid = vec3(0.035, 0.055, 0.13), low = vec3(0.11, 0.12, 0.2);',
        '  vec3 c = mix(low, mid, smoothstep(0.0, 0.22, h));',
        '  c = mix(c, top, smoothstep(0.2, 0.9, h));',
        // a faint band of the Milky Way across the sky
        '  vec3 axis = normalize(vec3(0.3, 0.75, 0.6));',
        '  float band = exp(-pow(dot(vDir, axis) * 3.2, 2.0));',
        '  float n = noise(vDir.xz * 9.0 + vDir.y * 4.0) * 0.6 + noise(vDir.xz * 21.0) * 0.4;',
        '  c += vec3(0.07, 0.075, 0.1) * band * n * smoothstep(0.05, 0.35, h);',
        '  float m = max(dot(vDir, uMoon), 0.0);',
        '  c += vec3(0.35, 0.4, 0.55) * pow(m, 30.0) * 0.5 + vec3(0.1, 0.12, 0.2) * pow(m, 4.0) * 0.35;',
        // the glow of the town on the horizon
        '  c += vec3(0.16, 0.09, 0.04) * exp(-h * 18.0) * smoothstep(-0.2, 0.6, -vDir.z) * 0.6;',
        '  c = mix(c, vec3(0.03, 0.03, 0.04), smoothstep(0.0, -0.05, h));',
        '  gl_FragColor = vec4(c, 1.0);',
        '}'
      ].join('\n')
    }));
    E.add(sky); this.sky = sky;
    var rnd = mulberry32(5), n = this.fast ? 300 : 900, sp = new Float32Array(n * 3), cl = new Float32Array(n * 3);
    for (var i = 0; i < n; i++) {
      var y = 0.08 + rnd() * 0.92, a = rnd() * Math.PI * 2, r = Math.sqrt(1 - y * y);
      sp[i * 3] = Math.cos(a) * r * 50; sp[i * 3 + 1] = y * 50; sp[i * 3 + 2] = Math.sin(a) * r * 50;
      var w = 0.75 + rnd() * 0.25; cl[i * 3] = w; cl[i * 3 + 1] = w; cl[i * 3 + 2] = Math.min(1, w + rnd() * 0.15);
    }
    var sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.BufferAttribute(sp, 3)); sg.setAttribute('color', new THREE.BufferAttribute(cl, 3));
    this.stars = new THREE.Points(sg, new THREE.PointsMaterial({ size: 0.1, vertexColors: true, transparent: true, opacity: 0.9, depthWrite: false, fog: false }));
    E.add(this.stars);
    var moon = this.moonSprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: moonTexture(), transparent: true, depthWrite: false, fog: false }));
    moon.position.copy(moonDir).multiplyScalar(48); moon.scale.setScalar(13); E.add(moon);
  }
  // ── AR reticle: the gathering's footprint on the floor ──
  buildReticle() {
    var g = new THREE.Group();
    var m = new THREE.MeshBasicMaterial({ color: 0xFFD27A, transparent: true, opacity: 0.9, depthTest: false });
    var ring = new THREE.Mesh(new THREE.RingGeometry(0.1, 0.12, 40), m); ring.rotation.x = -Math.PI / 2; g.add(ring);
    var edge = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.PlaneGeometry(5.4, 2.6)), new THREE.LineBasicMaterial({ color: 0xFFD27A, transparent: true, opacity: 0.5, depthTest: false }));
    edge.rotation.x = -Math.PI / 2; g.add(edge);
    g.visible = false; g.renderOrder = 10;
    this.reticle = g; this.scene.add(g);
  }

  // ── camera ──
  view(name, o) {
    o = o || {};
    var r = this.rig;
    r.drift = 0; r.k = o.k || 2; r.mode = name;
    r.follow = name === 'seat' || name === 'game' || name === 'mydrum';
    this.aim(name);
    if (o.snap) { r.pos.copy(r.tpos); r.look.copy(r.tlook); }
  }
  aim(name) {
    var r = this.rig;
    var at = function (x, y, z, lx, ly, lz) { r.tpos.set(x, y, z); r.tlook.set(lx, ly, lz); };
    var me = this.youFig(), mx = me ? me.x : ROW.LEAD * ROW.GAP, mz = me ? me.z : ROW.Z;
    if (name === 'cover') { at(4.0, 1.5, 0.5, -0.5, 0.55, 0); r.drift = 1; }
    else if (name === 'where') { at(6.5, 3.2, 7.8, 0, 1.0, -2.5); r.drift = 1; }
    else if (name === 'rows') at(4.6, 2.8, 0.9, -0.5, 0.3, 0);
    else if (name === 'leader') at(-0.75, 0.95, -0.25, 0.05, 0.7, ROW.Z);
    else if (name === 'end') at(1.28, 0.95, -0.25, 2.13, 0.7, ROW.Z);
    else if (name === 'drum') at(-0.1, 0.92, 0.3, -0.6, 0.74, -0.7);
    else if (name === 'poetry') at(3.7, 1.15, 0.05, -0.2, 0.62, 0);
    else if (name === 'today') { at(-5.2, 2.1, 4.4, 0, 0.5, 0); r.drift = 1; }
    else if (name === 'seat') at(1.15, 5.2, 3.3, 1.15, 0.0, 0.45);
    else if (name === 'mydrum') at(mx - 0.68, 1.05, mz - 1.38, mx + 0.02, 0.66, mz);
    else if (name === 'answer') at(3.75, 1.2, 1.05, 0.0, 0.6, 0.15);
    else if (name === 'sway') at(mx + 1.6, 1.25, mz + 2.2, mx - 0.7, 0.62, mz - 0.4);
    else if (name === 'game') at(mx + 2.2, 1.6, mz + 0.9, mx - 1.5, 0.5, -0.2);
    else if (name === 'loom') at(0, 2.6, 4.2, 0, 0.4, 0);
  }
  updateRig(dt) {
    var r = this.rig;
    if (r.follow) this.aim(r.mode);
    var a = 1 - Math.exp(-dt * r.k);
    r.pos.lerp(r.tpos, a); r.look.lerp(r.tlook, a);
    var pos = r.pos.clone();
    if (r.drift) {
      var ang = Math.sin(this.clock * 0.08) * 0.16, c = Math.cos(ang), s = Math.sin(ang);
      var dx = pos.x - r.look.x, dz = pos.z - r.look.z;
      pos.x = r.look.x + dx * c - dz * s; pos.z = r.look.z + dx * s + dz * c;
    }
    if (this.orbit.yaw || this.orbit.pitch) {
      var off = pos.clone().sub(r.look), sph = new THREE.Spherical().setFromVector3(off);
      sph.theta += this.orbit.yaw; sph.phi = Math.max(0.25, Math.min(1.5, sph.phi + this.orbit.pitch));
      pos.copy(r.look).add(new THREE.Vector3().setFromSpherical(sph));
      if (!this.orbit.on) { this.orbit.yaw *= Math.exp(-dt * 1.5); this.orbit.pitch *= Math.exp(-dt * 1.5); }
    }
    if (this.shake > 0) { pos.y += (Math.random() - 0.5) * this.shake * 0.04; pos.x += (Math.random() - 0.5) * this.shake * 0.03; this.shake = Math.max(0, this.shake - dt * 4); }
    this.camera.position.copy(pos);
    this.camera.lookAt(r.look);
  }
  bump(v) { this.shake = Math.max(this.shake || 0, v || 1); }

  // field-local point -> screen pixels (works in 3D and in AR)
  activeCam() {
    if (this.renderer.xr.isPresenting) { var xc = this.renderer.xr.getCamera(); return xc.cameras && xc.cameras.length ? xc.cameras[0] : xc; }
    return this.camera;
  }
  screenRect() {
    if (this.renderer.xr.isPresenting) return { left: 0, top: 0, width: window.innerWidth, height: window.innerHeight };
    return this.canvas.getBoundingClientRect();
  }
  toScreen(p) {
    var v = this._v || (this._v = new THREE.Vector3());
    v.set(p.x, p.y, p.z); this.field.localToWorld(v); v.project(this.activeCam());
    var r = this.screenRect();
    return { x: r.left + (v.x + 1) / 2 * r.width, y: r.top + (1 - v.y) / 2 * r.height, ok: v.z > -1 && v.z < 1 };
  }

  // ── small tweens ──
  animate(dur, fn, done, delay) { this.anims.push({ t: -(delay || 0), dur: dur, fn: fn, done: done }); }
  runAnims(dt) {
    var list = this.anims; this.anims = [];
    var keep = [];
    for (var i = 0; i < list.length; i++) {
      var a = list[i];
      a.t += dt;
      if (a.t < 0) { keep.push(a); continue; }
      var t = Math.min(1, a.t / a.dur);
      try { a.fn(t); } catch (e) { console.error(e); }
      if (t < 1) keep.push(a); else if (a.done) { try { a.done(); } catch (e2) { console.error(e2); } }
    }
    this.anims = keep.concat(this.anims);
  }
  busy() { return this.anims.length > 0; }

  // ── AR ──
  async arSupport() {
    if (this._ar !== undefined) return this._ar;
    var r = null;
    try { if (navigator.xr && await navigator.xr.isSessionSupported('immersive-ar')) r = 'webxr'; } catch (e) {}
    if (!r) { var a = document.createElement('a'); if (a.relList && a.relList.supports && a.relList.supports('ar')) r = 'quicklook'; }
    this._ar = r;
    var self = this;
    if (r === 'webxr') import('three/addons/webxr/XREstimatedLight.js').then(function (m) { self._estMod = m; }).catch(function () {});
    if (r === 'quicklook') import('three/addons/exporters/USDZExporter.js').then(function (m) { self._usdzMod = m; }).catch(function () {});
    return r;
  }
  async enterAR(root) {
    var self = this;
    if (!this.est && this._estMod) {
      try {
        var est = this.est = new this._estMod.XREstimatedLight(this.renderer);
        est.addEventListener('estimationstart', function () { if (est.environment) self.scene.environment = est.environment; });
        est.addEventListener('estimationend', function () { self.scene.environment = self.envMap; });
      } catch (e) {}
    }
    var session = await navigator.xr.requestSession('immersive-ar', {
      requiredFeatures: ['hit-test'],
      optionalFeatures: ['dom-overlay', 'light-estimation'],
      domOverlay: { root: root }
    });
    this.renderer.xr.setReferenceSpaceType('local');
    await this.renderer.xr.setSession(session);
    this.xr = session; this.placed = false;
    this.field.visible = false; this.env3d.visible = false;
    this.scene.fog = null;
    this.hemi.intensity = 1.2;
    var viewer = await session.requestReferenceSpace('viewer');
    this.hitSource = await session.requestHitTestSource({ space: viewer });
    session.addEventListener('end', function () { self.onXREnd(); });
    session.addEventListener('select', function () { if (!self.placed) self.placeField(); });
    this.emit('ar', 'scanning');
  }
  exitAR() { if (this.xr) this.xr.end(); }
  onXREnd() {
    this.xr = null; this.placed = false;
    if (this.hitSource) { try { this.hitSource.cancel(); } catch (e) {} this.hitSource = null; }
    this.reticle.visible = false;
    this.field.visible = true; this.env3d.visible = true;
    this.field.position.set(0, 0, 0); this.field.rotation.set(0, 0, 0); this.field.scale.setScalar(1);
    this.scene.fog = new THREE.Fog(0x0C1226, 14, 46);
    this.scene.environment = this.envMap;
    this.hemi.intensity = 0.5;
    this.resize();
    this.emit('ar', 'ended');
  }
  setARScale(s) { this.arScale = s; if (this.placed) this.field.scale.setScalar(s); this.reticle.scale.setScalar(s); }
  canPlace() { return !!(this.xr && this.reticle.visible); }
  placeField() {
    if (!this.canPlace()) return false;
    this.field.position.copy(this.reticle.position);
    this.field.rotation.set(0, this.reticle.rotation.y, 0);
    this.field.scale.setScalar(this.arScale);
    this.field.visible = true; this.placed = true; this.reticle.visible = false;
    this.emit('ar', 'placed');
    return true;
  }
  // AR Quick Look on iPhone: the gathering as it is right now, in your room
  async quickLook() {
    var mod = this._usdzMod || await import('three/addons/exporters/USDZExporter.js');
    // the exporter doesn't take instanced meshes: copy each performer's parts into plain meshes first
    var tmp = new THREE.Group(), m4 = new THREE.Matrix4(), rel = new THREE.Matrix4(), v = new THREE.Vector3(), col = new THREE.Color(), mats = {};
    for (var k in this.im) {
      var im = this.im[k], bw = im.geometry.attributes.bw, relA = im.geometry.attributes.rel;
      for (var i = 0; i < im.count; i++) {
        im.getMatrixAt(i, m4);
        if (Math.abs(m4.determinant()) < 1e-9) continue;
        var geo = im.geometry, mat = im.material;
        if (bw && relA) {
          // a part bent between two joints: work out where each point really is for this man
          geo = new THREE.BufferGeometry(); geo.setIndex(im.geometry.index);
          geo.setAttribute('uv', im.geometry.attributes.uv);
          var src = im.geometry.attributes.position, out = new Float32Array(src.count * 3);
          rel.fromArray(relA.array, i * 16);
          for (var q = 0; q < src.count; q++) {
            var w = bw.getX(q), x = src.getX(q), y = src.getY(q), z = src.getZ(q);
            v.set(x, y, z).applyMatrix4(rel);
            out[q * 3] = x + (v.x - x) * w; out[q * 3 + 1] = y + (v.y - y) * w; out[q * 3 + 2] = z + (v.z - z) * w;
          }
          geo.setAttribute('position', new THREE.BufferAttribute(out, 3)); geo.computeVertexNormals();
        }
        if (im.instanceColor) {
          // each man's own shade (his beard, his thobe, his skin)
          im.getColorAt(i, col); var key = k + col.getHexString();
          if (!mats[key]) { mats[key] = new THREE.MeshStandardMaterial({ map: im.material.map, color: im.material.color.clone().multiply(col), roughness: im.material.roughness, side: im.material.side }); }
          mat = mats[key];
        } else if (mat.onBeforeCompile && bw) mat = new THREE.MeshStandardMaterial({ map: mat.map, color: mat.color, roughness: mat.roughness, side: mat.side });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.applyMatrix4(m4); tmp.add(mesh);
      }
    }
    var hide = [], self = this;
    for (var k2 in this.im) { hide.push(this.im[k2]); this.im[k2].visible = false; }
    this.field.add(tmp);
    var saved = { p: this.field.position.clone(), r: this.field.rotation.clone(), s: this.field.scale.clone() };
    this.field.position.set(0, 0, 0); this.field.rotation.set(0, 0, 0); this.field.scale.setScalar(1);
    var moon = this.moonLight; this.field.remove(moon); this.field.remove(moon.target);
    this.field.updateMatrixWorld(true);
    var data;
    try { data = await new mod.USDZExporter().parse(this.field, { quickLookCompatible: true }); }
    finally {
      this.field.remove(tmp);
      hide.forEach(function (m) { m.visible = true; });
      this.field.add(moon); this.field.add(moon.target);
      this.field.position.copy(saved.p); this.field.rotation.copy(saved.r); this.field.scale.copy(saved.s);
    }
    var url = URL.createObjectURL(new Blob([data], { type: 'model/vnd.usdz+zip' }));
    var a = document.createElement('a');
    a.setAttribute('rel', 'ar'); a.appendChild(document.createElement('img'));
    a.href = url + '#allowsContentScaling=1';
    document.body.appendChild(a); a.click();
    setTimeout(function () { a.remove(); }, 1000);
  }

  // ── the loop ──
  tick(t, frame) {
    var now = performance.now(), dt = Math.min(window.CL_SM_DTMAX || 0.05, (now - this.last) / 1000);
    this.last = now; this.clock += dt;
    if (frame && this.hitSource && !this.placed) {
      var ref = this.renderer.xr.getReferenceSpace(), hits = frame.getHitTestResults(this.hitSource);
      if (hits.length) {
        var pose = hits[0].getPose(ref), m = new THREE.Matrix4().fromArray(pose.transform.matrix);
        var p = new THREE.Vector3().setFromMatrixPosition(m);
        var cam = this.renderer.xr.getCamera(), cp = new THREE.Vector3().setFromMatrixPosition(cam.matrixWorld);
        this.reticle.visible = true;
        this.reticle.position.copy(p);
        this.reticle.rotation.set(0, Math.atan2(cp.x - p.x, cp.z - p.z), 0);
        this.reticle.scale.setScalar(this.arScale);
      } else this.reticle.visible = false;
      this.emit('reticle', this.reticle.visible);
    }
    this.runAnims(dt);
    // the controller moves the beat on, then everyone is posed for it
    this.emit('frame', dt);
    this.updateFigures(dt);
    var fl = 0.82 + 0.12 * Math.sin(this.clock * 13.3) + 0.08 * Math.sin(this.clock * 7.1 + 1.3) + 0.05 * Math.sin(this.clock * 23);
    this.fire.intensity = 3.4 * fl;
    this.lampLight.intensity = 1.9 * (0.94 + 0.06 * Math.sin(this.clock * 9.1));
    for (var i = 0; i < this.flames.length; i++) {
      var f = this.flames[i];
      f.scale.set(0.9 + 0.15 * Math.sin(this.clock * (9 + i) + i), 0.85 + 0.25 * Math.sin(this.clock * (11 + i * 2) + i * 2), 1);
      if (!this.renderer.xr.isPresenting) f.lookAt(this.camera.position.x, f.getWorldPosition(new THREE.Vector3()).y, this.camera.position.z);
    }
    if (this.sparks) {
      var ap = this.sparks.geometry.attributes.position, arr = ap.array;
      for (var k = 0; k < arr.length; k += 3) {
        arr[k + 1] += dt * (0.25 + (k % 7) * 0.04);
        arr[k] += Math.sin(this.clock * 2 + k) * dt * 0.05;
        if (arr[k + 1] > 1.3) { arr[k + 1] = 0.05; arr[k] = (Math.random() - 0.5) * 0.15; arr[k + 2] = (Math.random() - 0.5) * 0.15; }
      }
      ap.needsUpdate = true;
    }
    if (this.stars) this.stars.material.opacity = 0.82 + 0.08 * Math.sin(this.clock * 1.7);
    // keep the phone cool: if frames are slow, draw fewer pixels
    if (!this.renderer.xr.isPresenting && !window.CL_SM_DPR) {
      this.ft = (this.ft || 0.016) * 0.95 + dt * 0.05;
      if (this.clock > 3 && this.ft > 0.045 && this.renderer.getPixelRatio() > 1 && this.clock - (this.lastDrop || 0) > 2) {
        this.renderer.setPixelRatio(Math.max(1, this.renderer.getPixelRatio() - 0.5)); this.resize(); this.lastDrop = this.clock;
      }
    }
    if (!this.renderer.xr.isPresenting) this.updateRig(dt);
    this.renderer.render(this.scene, this.camera);
  }
}
