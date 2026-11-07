/**
 * masaqeel-world.js — the 3D world for Al-Masaqil (marbles).
 *
 * The sand, the square drawn in it, the hole, the glass marbles and how they roll,
 * an old Najdi alley around them, the camera, and AR:
 *   - Android (Chrome + ARCore): WebXR. The field is placed on your real floor and
 *     the whole experience runs there.
 *   - iPhone: AR Quick Look shows the field, as it is right now, in your room.
 *
 * Units are meters. The field lives in its own group ("field space"): the hole is at
 * the origin, x runs across, z runs toward the player, y is up.
 *
 * Lighting: "Quarry 01" HDRI by Poly Haven (CC0), from the three.js examples.
 */
import * as THREE from 'three';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';

export const K = {
  R: 0.02,           // marble radius (about twice a real one, so it reads on a phone)
  HOLE_R: 0.058,     // hole radius
  HOLE_D: 0.07,      // hole depth
  SQ: 0.36,          // half the side of the square drawn in the sand
  LINE_Z: 1.25,      // the line you throw from (in the alleys: about five meters)
  DECEL: 0.8,        // rolling on sand, m/s²
  V_MAX: 2.4,        // the strongest flick, m/s
  V_CAPTURE: 0.72,   // slower than this over the hole, and the marble drops in
  E: 0.9,            // marble-on-marble bounce
  SLOPE: 0.35,       // how much the uneven sand bends a roll
  PATCH: { cx: 0, cz: 0.3, ax: 1.05, az: 1.35 }
};

// marble colors: the twist inside the glass
export const PALETTE = {
  me: ['#E4572E', '#F3B23C', '#B8235A'],
  fahad: ['#1E7FD8', '#1FA79A', '#7DB343'],
  show: ['#2F9E6A', '#E9B949', '#2C6FB7']
};

// ─────────────────────────────────────────────────────────────
// noise
// ─────────────────────────────────────────────────────────────
function mulberry32(a) {
  return function () {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    var t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
// value noise on a lattice that wraps every `period` cells (so textures tile)
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
var W1 = lattice(64, 3), W2 = lattice(64, 9), W3 = lattice(64, 21);
function fbmW(x, z) { return W1(x, z) * 0.6 + W2(x * 2.03, z * 2.03) * 0.28 + W3(x * 4.1, z * 4.1) * 0.12; }
function smooth(a, b, x) { var t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); }

// The shape of the sand. The mesh and the physics both use it, so a marble bends
// along the dips you can see. Level near the hole, where the kids smoothed it.
export function groundH(x, z) {
  var r = Math.sqrt(x * x + z * z);
  return 0.0034 * (fbmW(x * 2.1 + 10, z * 2.1 + 10) - 0.5) * smooth(0.06, 0.3, r);
}
function rippleH(x, z) { // fine wind ripples, for the eye only
  return 0.0007 * Math.sin(z * 46 + x * 9 + 4 * fbmW(x * 1.4 + 3, z * 1.4 + 7));
}
function slopeAt(x, z) {
  var e = 0.01;
  return { x: (groundH(x + e, z) - groundH(x - e, z)) / (2 * e), z: (groundH(x, z + e) - groundH(x, z - e)) / (2 * e) };
}
// distance from the hole to the edge of the sand patch along a direction
function rayEllipse(dx, dz) {
  var P = K.PATCH, A = (dx / P.ax) * (dx / P.ax) + (dz / P.az) * (dz / P.az);
  var B = -2 * (dx * P.cx / (P.ax * P.ax) + dz * P.cz / (P.az * P.az));
  var C = (P.cx / P.ax) * (P.cx / P.ax) + (P.cz / P.az) * (P.cz / P.az) - 1;
  return (-B + Math.sqrt(B * B - 4 * A * C)) / (2 * A);
}
function inPatch(x, z, k) {
  var P = K.PATCH, a = (x - P.cx) / P.ax, b = (z - P.cz) / P.az;
  return a * a + b * b < k * k;
}

// ─────────────────────────────────────────────────────────────
// textures, painted in code
// ─────────────────────────────────────────────────────────────
function canvas(w, h) { var c = document.createElement('canvas'); c.width = w; c.height = h || w; return c; }

function sandTextures(size) {
  var c = canvas(size), ctx = c.getContext('2d'), img = ctx.createImageData(size, size), d = img.data;
  var n1 = lattice(6, 1), n2 = lattice(12, 2), n3 = lattice(24, 3), n4 = lattice(48, 4), rnd = mulberry32(42);
  var H = new Float32Array(size * size);
  for (var y = 0; y < size; y++) {
    for (var x = 0; x < size; x++) {
      var u = x / size, v = y / size;
      var f = n1(u * 6, v * 6) * 0.45 + n2(u * 12, v * 12) * 0.25 + n3(u * 24, v * 24) * 0.18 + n4(u * 48, v * 48) * 0.12;
      var g = rnd(), k = 0.84 + f * 0.3 + (g - 0.5) * 0.14;
      var r = 206 * k, gg = 158 * k, b = 106 * k;
      if (g < 0.006) { r *= 0.6; gg *= 0.58; b *= 0.55; }          // dark grains
      else if (g > 0.9965) { r = 246; gg = 234; b = 212; }          // bits of quartz
      var i = (y * size + x) * 4;
      d[i] = r; d[i + 1] = gg; d[i + 2] = b; d[i + 3] = 255;
      H[y * size + x] = f * 0.75 + g * 0.25;
    }
  }
  ctx.putImageData(img, 0, 0);
  var cn = canvas(size), nctx = cn.getContext('2d'), nimg = nctx.createImageData(size, size), nd = nimg.data;
  for (y = 0; y < size; y++) {
    for (x = 0; x < size; x++) {
      var xl = (x - 1 + size) % size, xr = (x + 1) % size, yu = (y - 1 + size) % size, yd = (y + 1) % size;
      var dx = (H[y * size + xr] - H[y * size + xl]) * 2.4, dy = (H[yd * size + x] - H[yu * size + x]) * 2.4;
      var l = Math.sqrt(dx * dx + dy * dy + 1);
      i = (y * size + x) * 4;
      nd[i] = (-dx / l * 0.5 + 0.5) * 255; nd[i + 1] = (dy / l * 0.5 + 0.5) * 255; nd[i + 2] = (1 / l * 0.5 + 0.5) * 255; nd[i + 3] = 255;
    }
  }
  nctx.putImageData(nimg, 0, 0);
  var map = new THREE.CanvasTexture(c), normal = new THREE.CanvasTexture(cn);
  map.colorSpace = THREE.SRGBColorSpace;
  [map, normal].forEach(function (t) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 4; });
  return { map: map, normal: normal };
}

function grooveTexture() {
  var c = canvas(64, 32), ctx = c.getContext('2d'), img = ctx.createImageData(64, 32), d = img.data, rnd = mulberry32(5);
  for (var y = 0; y < 32; y++) {
    for (var x = 0; x < 64; x++) {
      var u = x / 63, k = 0.92 + rnd() * 0.16, r, g, b, a;
      var t = Math.abs(u - 0.5) * 2;                   // 0 center, 1 edge
      if (t < 0.38) { r = 141; g = 106; b = 68; }      // the bottom of the groove, in shade
      else if (t < 0.7) { var m = (t - 0.38) / 0.32; r = 141 + m * 95; g = 106 + m * 102; b = 68 + m * 98; } // the wall, catching light
      else { r = 236; g = 214; b = 172; }              // the sand pushed up beside it
      a = t < 0.82 ? 255 : 255 * (1 - (t - 0.82) / 0.18);
      var i = (y * 64 + x) * 4;
      d[i] = r * k; d[i + 1] = g * k; d[i + 2] = b * k; d[i + 3] = a;
    }
  }
  ctx.putImageData(img, 0, 0);
  var t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace; t.wrapT = THREE.RepeatWrapping;
  return t;
}

function mudTexture() {
  var size = 512, c = canvas(size), ctx = c.getContext('2d'), img = ctx.createImageData(size, size), d = img.data;
  var n1 = lattice(8, 31), n2 = lattice(32, 32), rnd = mulberry32(77);
  for (var y = 0; y < size; y++) {
    for (var x = 0; x < size; x++) {
      var u = x / size, v = y / size;
      var f = n1(u * 8, v * 8) * 0.6 + n2(u * 32, v * 32) * 0.4, g = rnd();
      var k = 0.8 + f * 0.32 + (g - 0.5) * 0.1;
      var course = Math.abs(((v * 5) % 1) - 0.5) < 0.012 + f * 0.01 ? 0.84 : 1;   // the mud courses
      var i = (y * size + x) * 4;
      d[i] = 182 * k * course; d[i + 1] = 132 * k * course; d[i + 2] = 92 * k * course; d[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  // straw in the plaster
  ctx.lineWidth = 1;
  for (var s = 0; s < 900; s++) {
    var sx = rnd() * size, sy = rnd() * size, a = rnd() * Math.PI, len = 4 + rnd() * 9;
    ctx.strokeStyle = 'rgba(' + (220 + rnd() * 30 | 0) + ',' + (190 + rnd() * 30 | 0) + ',120,' + (0.25 + rnd() * 0.3) + ')';
    ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(sx + Math.cos(a) * len, sy + Math.sin(a) * len); ctx.stroke();
  }
  var t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 4;
  return t;
}

// a painted Najdi door: dark planks with bands of colored triangles
function doorTexture() {
  var w = 256, h = 512, c = canvas(w, h), ctx = c.getContext('2d'), rnd = mulberry32(12);
  ctx.fillStyle = '#4A2E1C'; ctx.fillRect(0, 0, w, h);
  for (var p = 0; p < 5; p++) {
    ctx.fillStyle = 'rgba(0,0,0,' + (0.08 + rnd() * 0.1) + ')';
    ctx.fillRect(p * (w / 5), 0, 2, h);
    for (var g = 0; g < 40; g++) {
      ctx.fillStyle = 'rgba(255,220,180,' + (rnd() * 0.05) + ')';
      ctx.fillRect(p * (w / 5) + rnd() * (w / 5), rnd() * h, 1, 20 + rnd() * 60);
    }
  }
  var colors = ['#B8342B', '#2F7A4A', '#E2B13C', '#EDE3D0', '#1F4F8A'];
  function band(y0, size, k) {
    var n = Math.floor(w / size);
    for (var i = 0; i < n; i++) {
      ctx.fillStyle = colors[(i + k) % colors.length];
      ctx.beginPath();
      ctx.moveTo(i * size, y0 + size); ctx.lineTo(i * size + size / 2, y0); ctx.lineTo(i * size + size, y0 + size);
      ctx.closePath(); ctx.fill();
    }
    ctx.fillStyle = '#EDE3D0'; ctx.fillRect(0, y0 + size, w, 3);
  }
  band(40, 28, 0); band(130, 22, 2); band(300, 22, 1); band(420, 28, 3);
  ctx.strokeStyle = 'rgba(237,227,208,.8)'; ctx.lineWidth = 3;
  ctx.strokeRect(14, 184, w - 28, 100);
  ctx.beginPath(); ctx.moveTo(14, 184); ctx.lineTo(w - 14, 284); ctx.moveTo(w - 14, 184); ctx.lineTo(14, 284); ctx.stroke();
  var t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

// soft contact shadow under a glass marble, with the bright spot glass makes
function shadowTexture() {
  var s = 128, c = canvas(s), ctx = c.getContext('2d');
  var g = ctx.createRadialGradient(64, 64, 2, 64, 64, 60);
  g.addColorStop(0, 'rgba(38,22,8,0.55)'); g.addColorStop(0.45, 'rgba(38,22,8,0.32)'); g.addColorStop(1, 'rgba(38,22,8,0)');
  ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(64, 64, 62, 44, 0, 0, Math.PI * 2); ctx.fill();
  var k = ctx.createRadialGradient(84, 64, 0, 84, 64, 16);
  k.addColorStop(0, 'rgba(255,244,210,0.95)'); k.addColorStop(0.5, 'rgba(255,230,170,0.45)'); k.addColorStop(1, 'rgba(255,230,170,0)');
  ctx.fillStyle = k; ctx.beginPath(); ctx.arc(84, 64, 16, 0, Math.PI * 2); ctx.fill();
  var t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function dashTexture() {
  var c = canvas(64, 32), ctx = c.getContext('2d');
  ctx.clearRect(0, 0, 64, 32);
  ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.arc(20, 16, 12, 0, Math.PI * 2); ctx.fill();
  var t = new THREE.CanvasTexture(c);
  t.wrapS = THREE.RepeatWrapping;
  return t;
}

// ─────────────────────────────────────────────────────────────
// geometry
// ─────────────────────────────────────────────────────────────
// the twisted colored vanes inside a marble (the "eye")
function vaneGeometry(colors) {
  var R = K.R, NV = 18, NS = 4, pos = [], col = [], idx = [], base = 0;
  colors.forEach(function (hex, b) {
    var cc = new THREE.Color(hex), th0 = b * Math.PI * 2 / colors.length;
    for (var v = 0; v <= NV; v++) {
      var u = -1 + 2 * v / NV, w = 0.66 * R * Math.sqrt(Math.max(0, 1 - u * u)), a = th0 + 2.1 * u;
      for (var s = 0; s <= NS; s++) {
        var t = s / NS;
        pos.push(Math.cos(a) * t * w, u * 0.8 * R, Math.sin(a) * t * w);
        col.push(cc.r, cc.g, cc.b);
      }
    }
    for (v = 0; v < NV; v++) {
      for (s = 0; s < NS; s++) {
        var i0 = base + v * (NS + 1) + s, i1 = i0 + 1, i2 = i0 + NS + 1, i3 = i2 + 1;
        idx.push(i0, i2, i1, i1, i2, i3);
      }
    }
    base += (NV + 1) * (NS + 1);
  });
  var g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  g.setIndex(idx); g.computeVertexNormals();
  return g;
}

// a strip that follows a path on the sand (the square, the line)
function ribbonGeometry(pts, width) {
  var pos = [], uv = [], nrm = [], idx = [], len = 0;
  for (var i = 0; i < pts.length; i++) {
    var p = pts[i], q = pts[Math.min(pts.length - 1, i + 1)], o = pts[Math.max(0, i - 1)];
    var tx = q.x - o.x, tz = q.z - o.z, tl = Math.sqrt(tx * tx + tz * tz) || 1;
    var nx = -tz / tl, nz = tx / tl;
    if (i > 0) len += Math.hypot(p.x - pts[i - 1].x, p.z - pts[i - 1].z);
    var y = groundH(p.x, p.z) + rippleH(p.x, p.z) + 0.0007;
    pos.push(p.x + nx * width / 2, y, p.z + nz * width / 2, p.x - nx * width / 2, y, p.z - nz * width / 2);
    uv.push(0, len * 8, 1, len * 8);
    nrm.push(0, 1, 0, 0, 1, 0);
  }
  for (i = 0; i < pts.length - 1; i++) {
    var a = i * 2, b = a + 1, c = a + 2, d = a + 3;
    idx.push(a, b, c, b, d, c);
  }
  var g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nrm, 3));
  g.setIndex(idx);
  // make sure the strip faces up
  if (pts.length > 1) {
    var p0 = new THREE.Vector3().fromArray(pos, 0), p1 = new THREE.Vector3().fromArray(pos, 3), p2 = new THREE.Vector3().fromArray(pos, 6);
    var n = new THREE.Vector3().subVectors(p1, p0).cross(new THREE.Vector3().subVectors(p2, p0));
    if (n.y < 0) { for (i = 0; i < idx.length; i += 3) { var t = idx[i + 1]; idx[i + 1] = idx[i + 2]; idx[i + 2] = t; } g.setIndex(idx); }
  }
  return g;
}

function wobblyPath(corners, closed, seed, step) {
  var rnd = mulberry32(seed), out = [], list = closed ? corners.concat([corners[0]]) : corners;
  for (var s = 0; s < list.length - 1; s++) {
    var a = list[s], b = list[s + 1], L = Math.hypot(b.x - a.x, b.z - a.z), n = Math.max(2, Math.ceil(L / step));
    var nx = -(b.z - a.z) / L, nz = (b.x - a.x) / L, ph = rnd() * 6, amp = 0.004 + rnd() * 0.003;
    for (var i = (s === 0 ? 0 : 1); i <= n; i++) {
      var t = i / n, w = Math.sin(t * Math.PI * 2.2 + ph) * amp * Math.sin(t * Math.PI);
      out.push({ x: a.x + (b.x - a.x) * t + nx * w, z: a.z + (b.z - a.z) * t + nz * w });
    }
  }
  return out;
}

// ─────────────────────────────────────────────────────────────
// the world
// ─────────────────────────────────────────────────────────────
export class World {
  constructor(canvasEl, opts) {
    opts = opts || {};
    this.canvas = canvasEl;
    this.sky = opts.sky || 'masaqeel-sky.hdr';
    this.lowPower = /Android|iPhone|iPad|Mobile/i.test(navigator.userAgent);
    this.listeners = {};
    this.marbles = [];
    this.anims = [];
    this.timeScale = 1;
    this.drama = false;
    this.squareP = 1; this.lineP = 1; this.dig = 1;
    this.xr = null; this.placed = false; this.arScale = 1;
    this.clock = 0;
    this.orbit = { yaw: 0, pitch: 0, on: false };
    this.slopeOn = true;   // off for the story's demo shots, so they always go in
  }

  on(name, fn) { (this.listeners[name] = this.listeners[name] || []).push(fn); }
  emit(name, a, b, c) { (this.listeners[name] || []).forEach(function (f) { try { f(a, b, c); } catch (e) { console.error(e); } }); }

  async init() {
    // CL_MQ_FAST: a cheap look for slow machines and automated tests
    this.fast = !!window.CL_MQ_FAST;
    var r = this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: !this.fast, alpha: true, powerPreference: 'high-performance' });
    r.setPixelRatio(window.CL_MQ_DPR || Math.min(window.devicePixelRatio || 1, 2));
    r.outputColorSpace = THREE.SRGBColorSpace;
    r.toneMapping = THREE.ACESFilmicToneMapping;
    r.toneMappingExposure = 0.92;
    r.shadowMap.enabled = !this.fast;
    r.shadowMap.type = THREE.PCFSoftShadowMap;
    r.xr.enabled = true;

    var scene = this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(46, 1, 0.01, 60);
    this.camera.position.set(1.15, 1.2, 2.35);
    this.rig = { pos: this.camera.position.clone(), look: new THREE.Vector3(0, 0.1, 0), tpos: this.camera.position.clone(), tlook: new THREE.Vector3(0, 0.1, 0), k: 2, drift: 0 };

    // the field and everything in it
    this.field = new THREE.Group();
    scene.add(this.field);

    this.tex = sandTextures(512);
    this.tex.map.repeat.set(1, 1); this.tex.normal.repeat.set(1, 1);
    this.sandMat = new THREE.MeshStandardMaterial({
      map: this.tex.map, normalMap: this.tex.normal, normalScale: new THREE.Vector2(0.9, 0.9),
      roughness: 1, metalness: 0, vertexColors: true, alphaHash: true
    });
    this.buildSand();
    this.buildPit();
    this.buildGrooves();
    this.buildStick();
    this.buildMarbleKit();
    this.buildAim();

    // light: late-afternoon (Asr) sun, warm, from behind the left wall
    var sun = this.sun = new THREE.DirectionalLight(0xFFD9A6, 2.3);
    sun.position.set(-1.0, 2.6, -1.5);
    sun.target.position.set(0.1, 0, 0.3);
    sun.castShadow = true;
    sun.shadow.mapSize.set(this.lowPower ? 1024 : 2048, this.lowPower ? 1024 : 2048);
    var sc = sun.shadow.camera; sc.left = -3.2; sc.right = 3.2; sc.top = 3.2; sc.bottom = -3.2; sc.near = 0.2; sc.far = 9;
    sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.015;
    this.field.add(sun); this.field.add(sun.target);
    this.hemi = new THREE.HemisphereLight(0xBFD7FF, 0xB07A4A, 0.28);
    scene.add(this.hemi);

    this.env3d = this.buildAlley();
    scene.add(this.env3d);
    this.env3d.add(this.buildDust());
    scene.fog = new THREE.Fog(0xE6CFAE, 7, 18);

    // the reticle for placing the field in AR
    this.buildReticle();

    // sky and reflections
    try {
      var hdr;
      if (/\.hdr$/i.test(this.sky)) hdr = await new RGBELoader().loadAsync(this.sky);
      else { hdr = await new THREE.TextureLoader().loadAsync(this.sky); hdr.colorSpace = THREE.SRGBColorSpace; }
      hdr.mapping = THREE.EquirectangularReflectionMapping;
      var pm = new THREE.PMREMGenerator(r);
      this.envMap = pm.fromEquirectangular(hdr).texture;
      pm.dispose();
      scene.environment = this.envMap;
      scene.background = hdr; this.bg = hdr;
      scene.backgroundIntensity = 0.9; scene.environmentIntensity = 0.5;
    } catch (e) {
      scene.background = new THREE.Color(0x9EC3E6); this.bg = scene.background;
    }

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
    // a phone held upright needs a wider lens
    var fov = w / h < 0.7 ? 58 : 44;
    // the words sit on the lower part of the screen, so the camera aims a little higher
    // (drawing a window of a taller view; widen it so the visible part keeps the same lens)
    var off = Math.round(h * (w / h < 0.7 ? 0.15 : 0.08));
    this.camera.fov = 2 * Math.atan(Math.tan(fov * Math.PI / 360) * (h + 2 * off) / h) * 180 / Math.PI;
    this.camera.setViewOffset(w, h + 2 * off, 0, 2 * off, w, h);
    this.camera.updateProjectionMatrix();
  }

  // ── the sand patch: a polar mesh around the hole, fading out at its edge ──
  buildSand() {
    var NT = this.lowPower ? 112 : 144, NR = this.lowPower ? 60 : 78;
    var pos = new Float32Array((NR + 1) * NT * 3), col = new Float32Array((NR + 1) * NT * 4), uv = new Float32Array((NR + 1) * NT * 2), idx = [];
    var edge = [], rnd = mulberry32(8), ph = [rnd() * 6, rnd() * 6, rnd() * 6];
    for (var i = 0; i < NT; i++) {
      var th = i / NT * Math.PI * 2;
      edge.push(0.93 + 0.04 * Math.sin(th * 3 + ph[0]) + 0.025 * Math.sin(th * 7 + ph[1]) + 0.015 * Math.sin(th * 13 + ph[2]));
    }
    this.sandInfo = { NT: NT, NR: NR, edge: edge };
    for (var j = 0; j <= NR; j++) {
      var t = j / NR;
      for (i = 0; i < NT; i++) {
        th = i / NT * Math.PI * 2;
        var dx = Math.cos(th), dz = Math.sin(th);
        var rmax = rayEllipse(dx, dz) * edge[i];
        var r = K.HOLE_R + (rmax - K.HOLE_R) * Math.pow(t, 1.55);
        var x = dx * r, z = dz * r, k = j * NT + i;
        pos[k * 3] = x; pos[k * 3 + 2] = z;
        uv[k * 2] = x / 0.62; uv[k * 2 + 1] = z / 0.62;
        col[k * 4 + 3] = 1 - smooth(0.8, 1.0, r / rmax);
      }
    }
    for (j = 0; j < NR; j++) {
      for (i = 0; i < NT; i++) {
        var a = j * NT + i, b = j * NT + (i + 1) % NT, c = (j + 1) * NT + i, d = (j + 1) * NT + (i + 1) % NT;
        idx.push(a, c, b, b, c, d);
      }
    }
    var g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('color', new THREE.BufferAttribute(col, 4));
    g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
    g.setIndex(idx);
    this.sandGeo = g;
    this.shapeSand();
    // faces up?
    g.computeVertexNormals();
    if (g.attributes.normal.getY(NT * 10) < 0) {
      for (var q = 0; q < idx.length; q += 3) { var tmp = idx[q + 1]; idx[q + 1] = idx[q + 2]; idx[q + 2] = tmp; }
      g.setIndex(idx); g.computeVertexNormals();
    }
    this.sand = new THREE.Mesh(g, this.sandMat);
    this.sand.receiveShadow = true;
    this.sand.castShadow = !this.fast;   // so the rim throws shade into the hole
    this.field.add(this.sand);
  }

  // heights and shading, including the rim and the little pile of dug sand
  shapeSand() {
    var g = this.sandGeo, pos = g.attributes.position.array, col = g.attributes.color.array, dig = this.dig;
    var n = pos.length / 3;
    for (var k = 0; k < n; k++) {
      var x = pos[k * 3], z = pos[k * 3 + 2], r = Math.sqrt(x * x + z * z);
      var y = groundH(x, z) + rippleH(x, z) * smooth(0.12, 0.5, r);
      y += dig * (0.0035 * Math.exp(-Math.pow((r - K.HOLE_R) / 0.013, 2)) +
                  0.012 * Math.exp(-(Math.pow(x - 0.14, 2) + Math.pow(z + 0.1, 2)) / 0.0032));
      pos[k * 3 + 1] = y;
      var ao = 1 - 0.42 * dig * Math.exp(-Math.pow((r - K.HOLE_R) / 0.014, 2));
      col[k * 4] = col[k * 4 + 1] = col[k * 4 + 2] = ao;
    }
    g.attributes.position.needsUpdate = true;
    g.attributes.color.needsUpdate = true;
    g.computeVertexNormals();
  }

  // ── the hole: a little bowl dug into the sand ──
  buildPit() {
    var R = K.HOLE_R, D = K.HOLE_D;
    var prof = [[R + 0.0005, 0.0], [R * 0.985, -0.006], [R * 0.94, -0.02], [R * 0.86, -0.038], [R * 0.72, -0.055], [R * 0.48, -0.066], [R * 0.2, -0.0695], [0.0001, -D]];
    var pts = prof.map(function (p) { return new THREE.Vector2(p[0], p[1]); });
    var g = new THREE.LatheGeometry(pts, 48);
    var p = g.attributes.position, uv = g.attributes.uv, col = [];
    for (var i = 0; i < p.count; i++) {
      // unwrap around the bowl, so the walls don't smear the sand texture
      var px = p.getX(i), pz = p.getZ(i), pr = Math.sqrt(px * px + pz * pz);
      uv.setXY(i, Math.atan2(pz, px) * R / 0.31, (R - pr - p.getY(i)) / 0.31);
      var depth = -p.getY(i) / D, c = 0.55 - 0.47 * Math.pow(depth, 0.5);
      col.push(c, c, c, 1);
    }
    g.setAttribute('color', new THREE.Float32BufferAttribute(col, 4));
    this.pitAO = col.slice();
    this.pitMat = new THREE.MeshStandardMaterial({ map: this.tex.map, normalMap: this.tex.normal, roughness: 1, metalness: 0, vertexColors: true, side: THREE.DoubleSide, envMapIntensity: 0.3 });
    this.pit = new THREE.Mesh(g, this.pitMat);
    this.pit.receiveShadow = true;
    this.pit.position.y = 0.0005;
    this.field.add(this.pit);
    this.setDig(this.dig);
  }
  setDig(p) {
    this.dig = Math.max(0, Math.min(1, p));
    this.pit.scale.y = Math.max(0.004, this.dig);
    // an undug hole is just sand: the shade inside grows as it gets deeper
    var c = this.pit.geometry.attributes.color, ao = this.pitAO;
    for (var i = 0; i < c.count; i++) { var v = 1 - (1 - ao[i * 4]) * Math.min(1, this.dig * 1.4); c.setXYZ(i, v, v, v); }
    c.needsUpdate = true;
    if (this.sandGeo) this.shapeSand();
  }

  // ── the square and the line, drawn in the sand ──
  buildGrooves() {
    this.grooveMat = new THREE.MeshStandardMaterial({ map: grooveTexture(), roughness: 1, metalness: 0, alphaHash: true, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
    var S = K.SQ;
    // drawn starting from the near left corner, the way a kid walks around it
    this.squarePts = wobblyPath([{ x: -S, z: S }, { x: S, z: S }, { x: S, z: -S }, { x: -S, z: -S }], true, 4, 0.01);
    this.square = new THREE.Mesh(ribbonGeometry(this.squarePts, 0.013), this.grooveMat);
    this.square.receiveShadow = true;
    this.field.add(this.square);
    this.linePts = wobblyPath([{ x: -0.5, z: K.LINE_Z }, { x: 0.5, z: K.LINE_Z }], false, 9, 0.01);
    this.line = new THREE.Mesh(ribbonGeometry(this.linePts, 0.016), this.grooveMat);
    this.line.receiveShadow = true;
    this.field.add(this.line);
    this.setSquare(this.squareP); this.setLine(this.lineP);
  }
  setSquare(p) {
    this.squareP = Math.max(0, Math.min(1, p));
    var segs = this.squarePts.length - 1, n = Math.round(segs * this.squareP);
    this.square.geometry.setDrawRange(0, n * 6);
    this.square.visible = n > 0;
    this.stickAt(this.squarePts, this.squareP);
  }
  setLine(p) {
    this.lineP = Math.max(0, Math.min(1, p));
    var segs = this.linePts.length - 1, n = Math.round(segs * this.lineP);
    this.line.geometry.setDrawRange(0, n * 6);
    this.line.visible = n > 0;
    this.stickAt(this.linePts, this.lineP);
  }

  // the stick that draws in the sand
  buildStick() {
    var g = new THREE.CylinderGeometry(0.004, 0.0065, 0.55, 8);
    g.translate(0, 0.275, 0);
    var m = new THREE.MeshStandardMaterial({ color: 0x7A5634, roughness: 0.8 });
    this.stick = new THREE.Mesh(g, m);
    this.stick.castShadow = true;
    this.stick.rotation.set(0.5, 0, -0.35);
    this.stick.visible = false;
    this.field.add(this.stick);
  }
  stickAt(pts, p) {
    if (!this.stick) return;
    if (p <= 0 || p >= 1) { this.stick.visible = false; return; }
    var i = Math.min(pts.length - 1, Math.round((pts.length - 1) * p)), q = pts[i];
    this.stick.visible = true;
    this.stick.position.set(q.x, groundH(q.x, q.z) - 0.002, q.z);
  }

  // ── marbles ──
  buildMarbleKit() {
    this.ballGeo = new THREE.SphereGeometry(K.R, this.lowPower ? 32 : 40, this.lowPower ? 22 : 28);
    this.glassMat = this.fast
      ? new THREE.MeshPhysicalMaterial({ color: 0xEAF6F0, roughness: 0.05, metalness: 0, transparent: true, opacity: 0.45, envMapIntensity: 1.3 })
      : new THREE.MeshPhysicalMaterial({
          color: 0xffffff, roughness: 0.03, metalness: 0, transmission: 1, thickness: K.R * 1.7, ior: 1.52,
          attenuationColor: new THREE.Color('#dff6ec'), attenuationDistance: 0.3, specularIntensity: 1, envMapIntensity: 1.3
        });
    this.vaneGeo = {};
    this.vaneMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.32, metalness: 0, side: THREE.DoubleSide });
    for (var k in PALETTE) this.vaneGeo[k] = vaneGeometry(PALETTE[k]);
    this.shadowGeo = new THREE.PlaneGeometry(K.R * 3.6, K.R * 3.6);
    this.shadowMat = new THREE.MeshBasicMaterial({ map: shadowTexture(), transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4 });
    this.marbleGroup = new THREE.Group();
    this.field.add(this.marbleGroup);
    // which way the shadows fall, from the sun
    var s = new THREE.Vector3(-1.0, 2.6, -1.5).normalize();
    this.shadowDir = new THREE.Vector2(-s.x, -s.z).normalize();
  }

  addMarble(owner, palette) {
    var g = new THREE.Group(), spin = new THREE.Group();
    var ball = new THREE.Mesh(this.ballGeo, this.glassMat);
    var vanes = new THREE.Mesh(this.vaneGeo[palette || owner] || this.vaneGeo.show, this.vaneMat);
    vanes.castShadow = true;
    spin.add(vanes); spin.add(ball);
    spin.rotation.set(Math.random() * 6, Math.random() * 6, Math.random() * 6);
    g.add(spin);
    var sh = new THREE.Mesh(this.shadowGeo, this.shadowMat);
    sh.rotation.x = -Math.PI / 2;
    sh.rotation.z = -Math.atan2(this.shadowDir.y, this.shadowDir.x);
    this.marbleGroup.add(g); this.marbleGroup.add(sh);
    this.uid = (this.uid || 0) + 1;
    var m = { id: this.uid, owner: owner, g: g, spin: spin, sh: sh, pos: new THREE.Vector2(), vel: new THREE.Vector2(), state: 'hand', y: 0, noCap: 0, alpha: 1, tag: '' };
    g.visible = sh.visible = false;
    this.marbles.push(m);
    return m;
  }
  placeMarble(m, x, z) {
    m.pos.set(x, z); m.vel.set(0, 0); m.state = 'rest'; m.y = 0; m.g.scale.setScalar(1);
    m.g.visible = m.sh.visible = true;
    this.syncMarble(m);
  }
  removeMarble(m, animate) {
    var self = this;
    if (!animate) { this.dropMarble(m); return; }
    m.state = 'gone';
    this.animate(0.35, function (t) { m.g.scale.setScalar(Math.max(0.001, 1 - t)); m.y = t * 0.06; self.syncMarble(m); }, function () { self.dropMarble(m); });
  }
  dropMarble(m) {
    this.marbleGroup.remove(m.g); this.marbleGroup.remove(m.sh);
    var i = this.marbles.indexOf(m); if (i > -1) this.marbles.splice(i, 1);
  }
  clearMarbles() {
    var self = this;
    this.marbles.slice().forEach(function (m) { self.dropMarble(m); });
    this.anims.forEach(function (a) { a.dead = true; });
    this.anims = [];
    this.shotMarble = null; this.markShooter(null); this.hideAim();
    if (this.rig.follow) this.rig.follow = null;
  }
  inHole() { return this.marbles.filter(function (m) { return m.state === 'hole' || m.state === 'sinking'; }); }

  // where the n-th marble in the hole comes to rest
  holeSlot(n) {
    var R = K.R, bottom = -K.HOLE_D + R + 0.002;
    var ring = [[0, 0], [0.024, 0], [-0.012, 0.021], [-0.012, -0.021], [0.012, 0.021], [0.012, -0.021], [-0.024, 0]];
    var layer = Math.floor(n / 4), k = n % 4, s = ring[(k + layer * 2) % ring.length];
    return { x: s[0] * (layer % 2 ? -1 : 1), z: s[1], y: bottom + layer * 0.026 };
  }

  // a stake marble dropped into the hole from above
  dropStake(m, delay) {
    var self = this, slot = this.holeSlot(this.inHole().length);
    m.state = 'sinking'; m.g.visible = false; m.sh.visible = false;
    m.pos.set(slot.x, slot.z);
    this.animate(0.55, function (t) {
      m.g.visible = true;
      var e = t < 0.75 ? Math.pow(t / 0.75, 2) : 1;
      var bounce = t >= 0.75 ? Math.sin((t - 0.75) / 0.25 * Math.PI) * 0.012 : 0;
      m.y = 0.32 * (1 - e) + (slot.y - K.R) * e + bounce;
      self.syncMarble(m);
    }, function () { m.state = 'hole'; m.y = slot.y - K.R; self.syncMarble(m); self.emit('stake', m); }, delay || 0);
  }

  // the winner's marbles come out of the hole and roll to him
  collectHole(toZ, toX) {
    var self = this, list = this.inHole();
    list.forEach(function (m, i) {
      var from = { x: m.pos.x, z: m.pos.y, y: m.y };
      m.state = 'gone';
      self.animate(0.7, function (t) {
        var e = 1 - Math.pow(1 - t, 3);
        m.pos.set(from.x + (toX + (i - list.length / 2) * 0.05 - from.x) * e, from.z + (toZ - from.z) * e);
        m.y = from.y + (0 - from.y) * Math.min(1, t * 3) + Math.sin(t * Math.PI) * 0.08;
        m.g.visible = true; m.sh.visible = t > 0.3;
        m.spin.rotation.x += 0.3;
        self.syncMarble(m);
      }, function () { self.removeMarble(m, true); }, i * 0.09);
    });
    return list.length;
  }

  shoot(m, vx, vz) {
    m.vel.set(vx, vz); m.state = 'roll'; m.noCap = 0; m.shot = true;
    this.marbles.forEach(function (o) { if (o !== m) o.shot = false; });
    this.shotMarble = m;
  }
  settled() {
    if (this.anims.some(function (a) { return a.blocking; })) return false;
    return !this.marbles.some(function (m) { return m.state === 'roll' || m.state === 'sinking'; });
  }
  rollSpeed() {
    var s = 0;
    this.marbles.forEach(function (m) { if (m.state === 'roll') s += m.vel.length(); });
    return s;
  }

  capture(m) {
    var self = this, slot = this.holeSlot(this.inHole().length), from = { x: m.pos.x, z: m.pos.y };
    var v = m.vel.clone();
    m.state = 'sinking';
    this.emit('sink', m);
    this.animate(0.32, function (t) {
      var e = t * t;
      m.pos.set(from.x + v.x * 0.04 * (1 - t) + (slot.x - from.x) * e, from.z + v.y * 0.04 * (1 - t) + (slot.z - from.z) * e);
      m.y = (slot.y - K.R) * e;
      self.syncMarble(m);
    }, function () { m.state = 'hole'; m.vel.set(0, 0); m.y = slot.y - K.R; self.syncMarble(m); self.emit('landed', m); }, 0, true);
  }

  step(dt) {
    var ms = this.marbles, self = this;
    for (var i = 0; i < ms.length; i++) {
      var m = ms[i];
      if (m.state !== 'roll') continue;
      var sp = m.vel.length();
      if (sp > 0.03 && this.slopeOn) {
        var s = slopeAt(m.pos.x, m.pos.y), a = 9.8 * 0.71 * K.SLOPE;
        m.vel.x -= s.x * a * dt; m.vel.y -= s.z * a * dt;
        sp = m.vel.length();
      }
      var dec = K.DECEL * dt;
      if (sp <= dec) m.vel.set(0, 0); else m.vel.multiplyScalar((sp - dec) / sp);
      m.pos.addScaledVector(m.vel, dt);
      // spin the glass as it rolls
      var dist = sp * dt;
      if (dist > 0) {
        var axis = new THREE.Vector3(m.vel.y, 0, -m.vel.x).normalize();
        m.spin.quaternion.premultiply(new THREE.Quaternion().setFromAxisAngle(axis, dist / K.R));
      }
      // the hole
      if (m.noCap > 0) m.noCap -= dt;
      var d = m.pos.length(), v = m.vel.length();
      if (d < K.HOLE_R && m.noCap <= 0) {
        if (v < K.V_CAPTURE || (d < K.HOLE_R * 0.5 && v < K.V_CAPTURE * 1.7)) { this.capture(m); continue; }
        // too fast: it hops over the hole and comes out a little off line
        var n = m.pos.clone().normalize(), side = Math.sign(n.x * m.vel.y - n.y * m.vel.x) || 1;
        m.vel.rotateAround(new THREE.Vector2(), side * (0.1 + Math.random() * 0.2));
        m.vel.multiplyScalar(0.8);
        m.noCap = 0.25;
        this.emit('lip', m);
      }
      // the edge of the sand patch acts like a soft bank
      if (!inPatch(m.pos.x, m.pos.y, 0.86)) {
        var P = K.PATCH, nx = (m.pos.x - P.cx) / (P.ax * P.ax), nz = (m.pos.y - P.cz) / (P.az * P.az), nl = Math.sqrt(nx * nx + nz * nz);
        nx /= nl; nz /= nl;
        var vn = m.vel.x * nx + m.vel.y * nz;
        if (vn > 0) { m.vel.x -= 1.6 * vn * nx; m.vel.y -= 1.6 * vn * nz; m.vel.multiplyScalar(0.5); }
        m.pos.x -= nx * 0.002; m.pos.y -= nz * 0.002;
      }
      if (m.vel.lengthSq() === 0) { m.state = 'rest'; this.emit('stop', m); }
    }
    // marble on marble
    for (i = 0; i < ms.length; i++) {
      var a1 = ms[i];
      if (a1.state !== 'roll' && a1.state !== 'rest') continue;
      for (var j = i + 1; j < ms.length; j++) {
        var b1 = ms[j];
        if (b1.state !== 'roll' && b1.state !== 'rest') continue;
        var dx = b1.pos.x - a1.pos.x, dz = b1.pos.y - a1.pos.y, dd = dx * dx + dz * dz, min = 2 * K.R;
        if (dd >= min * min || dd === 0) continue;
        var dl = Math.sqrt(dd), ux = dx / dl, uz = dz / dl, push = (min - dl) / 2;
        a1.pos.x -= ux * push; a1.pos.y -= uz * push; b1.pos.x += ux * push; b1.pos.y += uz * push;
        var vr = (a1.vel.x - b1.vel.x) * ux + (a1.vel.y - b1.vel.y) * uz;
        if (vr <= 0) continue;
        var jx = vr * (1 + K.E) / 2;
        a1.vel.x -= ux * jx; a1.vel.y -= uz * jx; b1.vel.x += ux * jx; b1.vel.y += uz * jx;
        a1.state = 'roll'; b1.state = 'roll';
        self.emit('hit', a1, b1, vr);
      }
    }
  }

  syncMarble(m) {
    var y = groundH(m.pos.x, m.pos.y) + K.R + m.y;
    m.g.position.set(m.pos.x, y, m.pos.y);
    m.sh.position.set(m.pos.x + this.shadowDir.x * K.R * 0.45, groundH(m.pos.x, m.pos.y) + 0.0012, m.pos.y + this.shadowDir.y * K.R * 0.45);
    var lift = Math.max(0, m.y);
    m.sh.visible = m.g.visible && m.state !== 'hole' && m.state !== 'sinking' && m.state !== 'gone' && lift < 0.2;
    if (m.sh.visible) m.sh.scale.setScalar(1 + lift * 4);
  }

  // ── aiming ──
  buildAim() {
    this.dash = dashTexture();
    var g = new THREE.PlaneGeometry(1, 0.026);
    g.translate(0.5, 0, 0);
    g.rotateX(-Math.PI / 2);
    this.aimMat = new THREE.MeshBasicMaterial({ map: this.dash, color: 0xFFFFFF, transparent: true, depthWrite: false, opacity: 1, toneMapped: false });
    this.aimLine = new THREE.Mesh(g, this.aimMat);
    this.aimLine.renderOrder = 6;
    // a soft dark band under the dots, so they read on bright sand
    var sg = new THREE.PlaneGeometry(1, 0.05); sg.translate(0.5, 0, 0); sg.rotateX(-Math.PI / 2);
    var sc = canvas(8, 32), sx = sc.getContext('2d'), sgr = sx.createLinearGradient(0, 0, 0, 32);
    sgr.addColorStop(0, 'rgba(30,15,5,0)'); sgr.addColorStop(0.5, 'rgba(30,15,5,0.4)'); sgr.addColorStop(1, 'rgba(30,15,5,0)');
    sx.fillStyle = sgr; sx.fillRect(0, 0, 8, 32);
    this.aimShade = new THREE.Mesh(sg, new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(sc), transparent: true, depthWrite: false }));
    this.aimShade.renderOrder = 5;
    var head = new THREE.Shape(); head.moveTo(0, 0.034); head.lineTo(0.05, 0); head.lineTo(0, -0.034); head.lineTo(0, 0.034);
    var hg = new THREE.ShapeGeometry(head); hg.rotateX(-Math.PI / 2);
    this.aimHead = new THREE.Mesh(hg, new THREE.MeshBasicMaterial({ color: 0xFFFFFF, transparent: true, depthWrite: false, toneMapped: false }));
    this.aimHead.renderOrder = 6;
    this.aim = new THREE.Group(); this.aim.add(this.aimShade); this.aim.add(this.aimLine); this.aim.add(this.aimHead); this.aim.visible = false;
    this.field.add(this.aim);
    // where a practice shot would stop (on flat sand)
    var rg = new THREE.RingGeometry(0.026, 0.032, 40); rg.rotateX(-Math.PI / 2);
    this.stopRing = new THREE.Mesh(rg, new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.55, depthWrite: false }));
    this.stopRing.visible = false; this.field.add(this.stopRing);
    // a ring under whoever is shooting
    var mg = new THREE.RingGeometry(K.R * 1.45, K.R * 1.85, 40); mg.rotateX(-Math.PI / 2);
    this.mark = new THREE.Mesh(mg, new THREE.MeshBasicMaterial({ color: 0xFFC46B, transparent: true, opacity: 0.85, depthWrite: false }));
    this.mark.visible = false; this.field.add(this.mark);
    // the target glow around the hole
    var tg = new THREE.RingGeometry(K.HOLE_R * 1.08, K.HOLE_R * 1.3, 48); tg.rotateX(-Math.PI / 2);
    this.target = new THREE.Mesh(tg, new THREE.MeshBasicMaterial({ color: 0xFFD27A, transparent: true, opacity: 0.0, depthWrite: false }));
    this.target.position.y = 0.002; this.field.add(this.target);
  }
  showAim(m, dir, power, showStop) {
    var len = 0.06 + power * 0.5;
    var a = Math.atan2(dir.y, dir.x);
    this.aim.visible = true;
    var y = groundH(m.pos.x, m.pos.y) + 0.003;
    this.aim.position.set(m.pos.x + dir.x * K.R * 1.4, y, m.pos.y + dir.y * K.R * 1.4);
    this.aim.rotation.set(0, -a, 0);
    this.aimLine.scale.set(len, 1, 1); this.aimShade.scale.set(len + 0.04, 1, 1);
    this.dash.repeat.set(len / 0.042, 1);
    this.aimHead.position.set(len, 0, 0);
    var hot = new THREE.Color(0xFFF3D6).lerp(new THREE.Color(0xFF8A3D), power);
    this.aimMat.color.copy(hot); this.aimHead.material.color.copy(hot);
    if (showStop) {
      var v = Math.pow(power, 1.15) * K.V_MAX, d = v * v / (2 * K.DECEL);
      this.stopRing.visible = true;
      var sx = m.pos.x + dir.x * d, sz = m.pos.y + dir.y * d;
      this.stopRing.position.set(sx, groundH(sx, sz) + 0.003, sz);
    } else this.stopRing.visible = false;
  }
  hideAim() { this.aim.visible = false; this.stopRing.visible = false; }
  markShooter(m, color) {
    if (!m) { this.mark.visible = false; return; }
    this.mark.visible = true; this.markM = m;
    this.mark.material.color.set(color || 0xFFC46B);
  }

  // ── the alley around the field (3D view only) ──
  buildAlley() {
    var g = new THREE.Group(), mud = mudTexture();
    var mudMat = new THREE.MeshStandardMaterial({ map: mud, roughness: 0.96, metalness: 0 });
    function wall(w, h, d, x, y, z, rx) {
      var geo = new THREE.BoxGeometry(w, h, d), uv = geo.attributes.uv, p = geo.attributes.position, nrm = geo.attributes.normal;
      for (var i = 0; i < uv.count; i++) {
        var nx = Math.abs(nrm.getX(i)), ny = Math.abs(nrm.getY(i));
        var u = nx > 0.5 ? p.getZ(i) : p.getX(i), v = ny > 0.5 ? p.getZ(i) : p.getY(i);
        uv.setXY(i, (u + (rx || 0)) / 1.6, v / 1.6);
      }
      var mesh = new THREE.Mesh(geo, mudMat);
      mesh.position.set(x, y, z); mesh.castShadow = true; mesh.receiveShadow = true;
      g.add(mesh);
      return mesh;
    }
    var L = { x: -1.45, h: 2.2 }, Rr = { x: 1.6, h: 3.0 }, B = { z: -2.6, h: 2.9 };
    wall(0.32, L.h, 7.4, L.x, L.h / 2, 0.9);
    wall(0.32, Rr.h, 7.4, Rr.x, Rr.h / 2, 0.9, 3);
    wall(Rr.x - L.x + 0.32, B.h, 0.32, (L.x + Rr.x) / 2, B.h / 2, B.z, 7);
    // stepped crenellations along the tops (shurfat)
    var sh = new THREE.Shape(), w = 0.13;
    sh.moveTo(-w, 0); sh.lineTo(w, 0); sh.lineTo(w, 0.06); sh.lineTo(w * 0.62, 0.06); sh.lineTo(w * 0.62, 0.12); sh.lineTo(w * 0.28, 0.12); sh.lineTo(w * 0.28, 0.18); sh.lineTo(-w * 0.28, 0.18); sh.lineTo(-w * 0.28, 0.12); sh.lineTo(-w * 0.62, 0.12); sh.lineTo(-w * 0.62, 0.06); sh.lineTo(-w, 0.06); sh.lineTo(-w, 0);
    var cg = new THREE.ExtrudeGeometry(sh, { depth: 0.24, bevelEnabled: false }); cg.translate(0, 0, -0.12);
    function crenels(n, fn) {
      var im = new THREE.InstancedMesh(cg, mudMat, n), o = new THREE.Object3D();
      for (var i = 0; i < n; i++) { fn(o, i); o.updateMatrix(); im.setMatrixAt(i, o.matrix); }
      im.castShadow = true; im.receiveShadow = true; g.add(im);
    }
    crenels(18, function (o, i) { o.position.set(L.x, L.h, -2.4 + i * 0.4); o.rotation.set(0, Math.PI / 2, 0); });
    crenels(18, function (o, i) { o.position.set(Rr.x, Rr.h, -2.4 + i * 0.4); o.rotation.set(0, Math.PI / 2, 0); });
    crenels(8, function (o, i) { o.position.set(L.x + 0.2 + i * 0.4, B.h, B.z); o.rotation.set(0, 0, 0); });
    // triangular openings near the top (furjat)
    var tri = new THREE.Shape(); tri.moveTo(-0.07, 0); tri.lineTo(0.07, 0); tri.lineTo(0, 0.12); tri.lineTo(-0.07, 0);
    var tg = new THREE.ShapeGeometry(tri), dark = new THREE.MeshBasicMaterial({ color: 0x24160D });
    [-0.35, -0.15, 0.05, 0.25, 0.45].forEach(function (x, i) {
      var t = new THREE.Mesh(tg, dark); t.position.set(x + 0.05, B.h - 0.5 + (i % 2) * 0.0, B.z + 0.165); g.add(t);
    });
    for (var k = 0; k < 4; k++) {
      var t2 = new THREE.Mesh(tg, dark); t2.position.set(Rr.x - 0.165, Rr.h - 0.55, -1.6 + k * 0.3); t2.rotation.y = -Math.PI / 2; g.add(t2);
    }
    // the painted wooden door
    var door = new THREE.Mesh(new THREE.BoxGeometry(0.95, 1.9, 0.06), [
      new THREE.MeshStandardMaterial({ color: 0x3A2416, roughness: 0.8 }), new THREE.MeshStandardMaterial({ color: 0x3A2416, roughness: 0.8 }),
      new THREE.MeshStandardMaterial({ color: 0x3A2416, roughness: 0.8 }), new THREE.MeshStandardMaterial({ color: 0x3A2416, roughness: 0.8 }),
      new THREE.MeshStandardMaterial({ map: doorTexture(), roughness: 0.75 }), new THREE.MeshStandardMaterial({ color: 0x3A2416, roughness: 0.8 })
    ]);
    door.position.set(0.15, 0.95, B.z + 0.17); door.castShadow = true; door.receiveShadow = true; g.add(door);
    var lintel = new THREE.Mesh(new THREE.BoxGeometry(1.25, 0.12, 0.2), new THREE.MeshStandardMaterial({ color: 0x5A3A22, roughness: 0.85 }));
    lintel.position.set(0.15, 1.96, B.z + 0.17); lintel.castShadow = true; g.add(lintel);
    // the ground beyond the sand patch
    var groundMat = new THREE.MeshStandardMaterial({ map: this.tex.map.clone(), normalMap: this.tex.normal.clone(), roughness: 1, color: 0xF6EEE2 });
    groundMat.map.repeat.set(14 / 0.62, 14 / 0.62); groundMat.normalMap.repeat.set(14 / 0.62, 14 / 0.62);
    groundMat.map.needsUpdate = groundMat.normalMap.needsUpdate = true;
    // a ring, so the hole goes through it
    var gg = new THREE.RingGeometry(K.HOLE_R * 1.01, 9, 64, 8), gp = gg.attributes.position, guv = gg.attributes.uv;
    for (var gi = 0; gi < gp.count; gi++) guv.setXY(gi, gp.getX(gi) / 0.62, gp.getY(gi) / 0.62);
    groundMat.map.repeat.set(1, 1); groundMat.normalMap.repeat.set(1, 1);
    var ground = new THREE.Mesh(gg, groundMat);
    ground.rotation.x = -Math.PI / 2; ground.position.y = -0.004; ground.receiveShadow = true;
    g.add(ground);
    return g;
  }

  // motes of dust drifting through the late sun
  buildDust() {
    var n = this.lowPower ? 90 : 160, pos = new Float32Array(n * 3), rnd = mulberry32(19);
    for (var i = 0; i < n; i++) { pos[i * 3] = -1.3 + rnd() * 2.8; pos[i * 3 + 1] = 0.05 + rnd() * 1.6; pos[i * 3 + 2] = -1.6 + rnd() * 3.4; }
    var g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    var c = canvas(32), ctx = c.getContext('2d'), gr = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
    gr.addColorStop(0, 'rgba(255,236,200,1)'); gr.addColorStop(1, 'rgba(255,236,200,0)');
    ctx.fillStyle = gr; ctx.fillRect(0, 0, 32, 32);
    var m = new THREE.PointsMaterial({ size: 0.012, map: new THREE.CanvasTexture(c), transparent: true, depthWrite: false, opacity: 0.55, blending: THREE.AdditiveBlending, color: 0xFFE2B0 });
    var pts = new THREE.Points(g, m);
    this.dust = pts;
    return pts;
  }

  buildReticle() {
    var g = new THREE.Group();
    var ring = new THREE.Mesh(new THREE.RingGeometry(0.075, 0.09, 48).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0xFFFFFF, transparent: true, opacity: 0.9 }));
    var dot = new THREE.Mesh(new THREE.CircleGeometry(K.HOLE_R, 32).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0x2A1A10, transparent: true, opacity: 0.7 }));
    g.add(ring); g.add(dot);
    // a ghost of the square and the line, so you can see how much room it needs
    var S = K.SQ, pts = [-S, 0, S, S, 0, S, S, 0, S, S, 0, -S, S, 0, -S, -S, 0, -S, -S, 0, -S, -S, 0, S, -0.5, 0, K.LINE_Z, 0.5, 0, K.LINE_Z];
    var lg = new THREE.BufferGeometry(); lg.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
    g.add(new THREE.LineSegments(lg, new THREE.LineBasicMaterial({ color: 0xFFE2A8, transparent: true, opacity: 0.85 })));
    g.visible = false;
    this.reticle = g;
    this.scene.add(g);
  }

  // ── camera ──
  // named shots for the story and the game (3D view only; in AR the phone is the camera)
  view(name, o) {
    o = o || {};
    var r = this.rig, P = o.from, k = o.k || 2.2;
    r.drift = 0; r.k = k; r.follow = null; r.mode = name;
    var at = function (x, y, z, lx, ly, lz) { r.tpos.set(x, y, z); r.tlook.set(lx, ly, lz); };
    if (name === 'cover') { at(0.45, 0.4, 1.0, 0.08, 0.12, -0.12); r.drift = 1; }
    else if (name === 'macro') at(0.17, 0.07, 0.46, 0.01, 0.022, 0.25);
    else if (name === 'top') at(0, 2.05, 0.66, 0, 0, 0.48);
    else if (name === 'hole') at(0.2, 0.22, 0.27, 0, -0.02, 0);
    else if (name === 'square') at(0.0, 1.7, 1.15, 0, 0, 0.04);
    else if (name === 'dig') at(0.32, 0.4, 0.46, 0, -0.01, 0);
    else if (name === 'line') at(0.0, 0.92, K.LINE_Z + 0.95, 0, 0, K.LINE_Z - 0.15);
    else if (name === 'aim' && P) {
      var u = new THREE.Vector2(-P.x, -P.y).normalize();
      var back = Math.min(0.62, 0.3 + P.length() * 0.28);
      at(P.x - u.x * back, 0.2 + P.length() * 0.14, P.y - u.y * back, P.x + u.x * 0.75, 0, P.y + u.y * 0.75);
    }
    else if (name === 'side' && P) at(0.95, 0.62, P.y * 0.55 + 0.1, 0, 0, P.y * 0.42);
    else if (name === 'follow') r.follow = o.marble;
    if (o.snap) { r.pos.copy(r.tpos); r.look.copy(r.tlook); }
  }

  updateRig(dt) {
    var r = this.rig;
    if (r.follow) {
      var m = r.follow, p = m.pos, v = m.vel, sp = v.length();
      if (!r.fdir) r.fdir = new THREE.Vector2(0, -1);
      if (sp > 0.05) r.fdir.lerp(v.clone().normalize(), 1 - Math.exp(-dt * 3)).normalize();
      var nearHole = p.length() < 0.35 && (sp < 1.0 || m.state === 'sinking' || m.state === 'hole');
      if (nearHole) { r.tpos.set(0.18, 0.2, 0.3); r.tlook.set(0, -0.01, 0); }
      else {
        r.tpos.set(p.x - r.fdir.x * 0.55 + 0.1, 0.32, p.y - r.fdir.y * 0.55);
        r.tlook.set(p.x + r.fdir.x * 0.3, 0, p.y + r.fdir.y * 0.3);
      }
      r.k = nearHole ? 2.2 : 3.2;
    }
    var a = 1 - Math.exp(-dt * r.k);
    r.pos.lerp(r.tpos, a); r.look.lerp(r.tlook, a);
    var pos = r.pos.clone();
    if (r.drift) {
      var ang = Math.sin(this.clock * 0.12) * 0.16, c = Math.cos(ang), s = Math.sin(ang);
      var dx = pos.x - r.look.x, dz = pos.z - r.look.z;
      pos.x = r.look.x + dx * c - dz * s; pos.z = r.look.z + dx * s + dz * c;
    }
    // the visitor's drag turns the camera a little around what it's looking at
    if (this.orbit.yaw || this.orbit.pitch) {
      var off = pos.clone().sub(r.look), sph = new THREE.Spherical().setFromVector3(off);
      sph.theta += this.orbit.yaw; sph.phi = Math.max(0.15, Math.min(1.5, sph.phi + this.orbit.pitch));
      pos.copy(r.look).add(new THREE.Vector3().setFromSpherical(sph));
      if (!this.orbit.on) { this.orbit.yaw *= Math.exp(-dt * 1.5); this.orbit.pitch *= Math.exp(-dt * 1.5); }
    }
    this.camera.position.copy(pos);
    this.camera.lookAt(r.look);
  }

  // ── small tweens ──
  animate(dur, fn, done, delay, blocking) {
    var a = { t: -(delay || 0), dur: dur, fn: fn, done: done, blocking: !!blocking };
    this.anims.push(a);
    return a;
  }
  runAnims(dt) {
    var list = this.anims, keep = [];
    this.anims = [];                       // anything started during this frame lands here
    for (var i = 0; i < list.length; i++) {
      var a = list[i];
      if (a.dead) continue;
      a.t += dt;
      if (a.t < 0) { keep.push(a); continue; }
      var t = Math.min(1, a.t / a.dur);
      try { a.fn(t); } catch (e) { console.error(e); }
      if (t < 1) keep.push(a); else if (a.done) { try { a.done(); } catch (e2) { console.error(e2); } }
    }
    this.anims = keep.concat(this.anims);
  }

  // ── AR ──
  async arSupport() {
    if (this._ar !== undefined) return this._ar;
    var r = null;
    try { if (navigator.xr && await navigator.xr.isSessionSupported('immersive-ar')) r = 'webxr'; } catch (e) {}
    if (!r) { var a = document.createElement('a'); if (a.relList && a.relList.supports && a.relList.supports('ar')) r = 'quicklook'; }
    this._ar = r;
    // load what AR needs now, so the tap that starts it isn't spent waiting on the network
    var self = this;
    if (r === 'webxr') import('three/addons/webxr/XREstimatedLight.js').then(function (m) { self._estMod = m; }).catch(function () {});
    if (r === 'quicklook') import('three/addons/exporters/USDZExporter.js').then(function (m) { self._usdzMod = m; }).catch(function () {});
    return r;
  }

  async enterAR(root) {
    var self = this;
    // reflections from the real room, when the phone can estimate them (must exist before the session starts;
    // no waiting here: the session has to be requested straight from the tap)
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
    this.scene.background = null; this.scene.fog = null;
    this.sun.shadow.camera.left = this.sun.shadow.camera.bottom = -1.8;
    this.sun.shadow.camera.right = this.sun.shadow.camera.top = 1.8;
    this.sun.shadow.camera.updateProjectionMatrix();
    var viewer = await session.requestReferenceSpace('viewer');
    this.hitSource = await session.requestHitTestSource({ space: viewer });
    session.addEventListener('end', function () { self.onXREnd(); });
    // without the DOM overlay, a tap on the screen places the field
    session.addEventListener('select', function () { if (!self.placed) self.placeField(); });
    this.overlay = !!session.domOverlayState;
    this.emit('ar', 'scanning');
  }
  exitAR() { if (this.xr) this.xr.end(); }
  onXREnd() {
    this.xr = null; this.placed = false;
    if (this.hitSource) { try { this.hitSource.cancel(); } catch (e) {} this.hitSource = null; }
    this.reticle.visible = false;
    this.field.visible = true; this.env3d.visible = true;
    this.field.position.set(0, 0, 0); this.field.rotation.set(0, 0, 0); this.field.scale.setScalar(1);
    this.scene.background = this.bg; this.scene.fog = new THREE.Fog(0xE6CFAE, 7, 18);
    this.scene.environment = this.envMap;
    this.sun.shadow.camera.left = this.sun.shadow.camera.bottom = -3.2;
    this.sun.shadow.camera.right = this.sun.shadow.camera.top = 3.2;
    this.sun.shadow.camera.updateProjectionMatrix();
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
  movField() { if (!this.xr) return; this.placed = false; this.field.visible = false; this.emit('ar', 'scanning'); }

  // AR Quick Look on iPhone: the field as it is right now, in your room
  async quickLook() {
    var mod = this._usdzMod || await import('three/addons/exporters/USDZExporter.js');
    var swaps = [], self = this;
    // glass and see-through edges don't carry over, so export a simpler look
    var glass = new THREE.MeshStandardMaterial({ color: 0xEAF6F0, roughness: 0.05, metalness: 0, transparent: true, opacity: 0.42 });
    this.field.traverse(function (o) {
      if (!o.isMesh) return;
      if (o.material === self.glassMat) { swaps.push([o, o.material]); o.material = glass; }
      else if (o.material === self.pitMat) { var pm = self.pitMat.clone(); pm.side = THREE.DoubleSide; pm.vertexColors = false; pm.color.set(0x8a6a48); swaps.push([o, o.material]); o.material = pm; }
      else if (o.material === self.grooveMat) { var gm = self.grooveMat.clone(); gm.alphaHash = false; gm.transparent = true; swaps.push([o, o.material]); o.material = gm; }
      else if (o.material === self.sandMat) { var sm = self.sandMat.clone(); sm.alphaHash = false; sm.vertexColors = false; swaps.push([o, o.material]); o.material = sm; }
    });
    var hidden = [];
    [this.aim, this.stopRing, this.mark, this.target, this.stick].forEach(function (o) { if (o.visible) { hidden.push(o); o.visible = false; } });
    var saved = { p: this.field.position.clone(), r: this.field.rotation.clone(), s: this.field.scale.clone() };
    this.field.position.set(0, 0, 0); this.field.rotation.set(0, 0, 0); this.field.scale.setScalar(1);
    this.field.updateMatrixWorld(true);
    var data;
    try { data = await new mod.USDZExporter().parse(this.field, { quickLookCompatible: true }); }
    finally {
      swaps.forEach(function (s) { s[0].material = s[1]; });
      hidden.forEach(function (o) { o.visible = true; });
      this.field.position.copy(saved.p); this.field.rotation.copy(saved.r); this.field.scale.copy(saved.s);
    }
    var url = URL.createObjectURL(new Blob([data], { type: 'model/vnd.usdz+zip' }));
    var a = document.createElement('a');
    a.setAttribute('rel', 'ar'); a.appendChild(document.createElement('img'));
    a.href = url + '#allowsContentScaling=1';
    document.body.appendChild(a); a.click();
    setTimeout(function () { a.remove(); }, 1000);
  }

  // screen point -> a point on the sand (field space), for aiming with a finger
  screenToField(x, y) {
    var cam = this.camera;
    if (this.renderer.xr.isPresenting) { var xc = this.renderer.xr.getCamera(); cam = xc.cameras && xc.cameras.length ? xc.cameras[0] : xc; }
    var w = this.renderer.xr.isPresenting ? window.innerWidth : this.canvas.clientWidth;
    var h = this.renderer.xr.isPresenting ? window.innerHeight : this.canvas.clientHeight;
    var rect = this.renderer.xr.isPresenting ? { left: 0, top: 0 } : this.canvas.getBoundingClientRect();
    var ndc = new THREE.Vector2(((x - rect.left) / w) * 2 - 1, -((y - rect.top) / h) * 2 + 1);
    var ray = new THREE.Raycaster(); ray.setFromCamera(ndc, cam);
    var inv = new THREE.Matrix4().copy(this.field.matrixWorld).invert();
    var o = ray.ray.origin.clone().applyMatrix4(inv), d = ray.ray.direction.clone().transformDirection(inv);
    if (Math.abs(d.y) < 1e-4) return null;
    var t = -o.y / d.y; if (t < 0) return null;
    return new THREE.Vector2(o.x + d.x * t, o.z + d.z * t);
  }
  fieldToScreen(x, z) {
    var cam = this.camera;
    if (this.renderer.xr.isPresenting) { var xc = this.renderer.xr.getCamera(); cam = xc.cameras && xc.cameras.length ? xc.cameras[0] : xc; }
    var p = new THREE.Vector3(x, groundH(x, z), z).applyMatrix4(this.field.matrixWorld).project(cam);
    var w = this.renderer.xr.isPresenting ? window.innerWidth : this.canvas.clientWidth;
    var h = this.renderer.xr.isPresenting ? window.innerHeight : this.canvas.clientHeight;
    var rect = this.renderer.xr.isPresenting ? { left: 0, top: 0 } : this.canvas.getBoundingClientRect();
    return { x: rect.left + (p.x * 0.5 + 0.5) * w, y: rect.top + (-p.y * 0.5 + 0.5) * h };
  }

  // ── the loop ──
  tick(t, frame) {
    var now = performance.now(), dt = Math.min(window.CL_MQ_DTMAX || 0.05, (now - this.last) / 1000);
    this.last = now; this.clock += dt;
    // AR: find the floor under the middle of the screen
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
    // slow motion when a marble creeps up on the hole
    var want = 1;
    if (this.drama) {
      for (var i = 0; i < this.marbles.length; i++) {
        var mm = this.marbles[i];
        if (mm.state === 'roll' && mm.pos.length() < 0.16 && mm.vel.length() < 0.95) { want = 0.42; break; }
      }
    }
    this.timeScale += (want - this.timeScale) * (1 - Math.exp(-dt * 8));
    var sdt = dt * this.timeScale;
    while (sdt > 1e-6) { var h = Math.min(sdt, 1 / 240); this.step(h); sdt -= h; }
    this.runAnims(dt * (this.timeScale < 0.99 ? Math.max(0.6, this.timeScale) : 1));
    for (i = 0; i < this.marbles.length; i++) {
      var q = this.marbles[i];
      if (q.state === 'roll' || q.state === 'rest') this.syncMarble(q);
    }
    if (this.mark.visible && this.markM) {
      var mp = this.markM.pos;
      this.mark.position.set(mp.x, groundH(mp.x, mp.y) + 0.002, mp.y);
      this.mark.material.opacity = 0.55 + 0.35 * Math.sin(this.clock * 5);
      this.mark.visible = this.markM.state === 'rest';
    }
    if (this.aim.visible) this.dash.offset.x -= dt * 1.4;
    if (this.dust && this.env3d.visible) {
      var dp = this.dust.geometry.attributes.position, arr = dp.array;
      for (var di = 0; di < arr.length; di += 3) {
        arr[di] += Math.sin(this.clock * 0.3 + di) * 0.0004; arr[di + 1] += 0.0009 * Math.sin(this.clock * 0.2 + di * 0.7) + 0.00025;
        if (arr[di + 1] > 1.7) arr[di + 1] = 0.05;
      }
      dp.needsUpdate = true;
    }
    // keep the phone cool: if frames are slow, draw fewer pixels
    if (!this.renderer.xr.isPresenting && !window.CL_MQ_DPR) {
      this.ft = (this.ft || 0.016) * 0.95 + dt * 0.05;
      if (this.clock > 3 && this.ft > 0.045 && this.renderer.getPixelRatio() > 1 && this.clock - (this.lastDrop || 0) > 2) {
        this.renderer.setPixelRatio(Math.max(1, this.renderer.getPixelRatio() - 0.5)); this.resize(); this.lastDrop = this.clock;
      }
    }
    this.target.material.opacity += ((this.aim.visible ? 0.55 + 0.25 * Math.sin(this.clock * 4) : 0) - this.target.material.opacity) * 0.15;
    if (!this.renderer.xr.isPresenting) this.updateRig(dt);
    this.emit('frame', dt);
    this.renderer.render(this.scene, this.camera);
  }
}
