/**
 * samri-world.js — the 3D world for Al-Samri.
 *
 * A Samri night in the sand dunes outside Unaizah: two Sadu rugs on the sand, two facing
 * rows of nine men kneeling with their frame drums, the mu'allim at the center of each row,
 * a coffee hearth at one end, a lantern at the other, palms and the moon.
 *
 * The performers are drawn as instanced parts (thobe, shemagh, igal, arms, drum...). Each one
 * has an invisible rig that is posed every frame from the beat, so eighteen of them cost about
 * a dozen draw calls. A row can rest, sing and clap, or sway and lift the drums; "you" can be
 * one of them, moved by your own taps and swipes.
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
  return tex(c, 4, 3);
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
// gold thread along the edge of a bisht
function bishtTexture() {
  var c = canvas(64, 256), g = c.getContext('2d'), rnd = mulberry32(17);
  g.fillStyle = '#2A1E17'; g.fillRect(0, 0, 64, 256);
  for (var y = 0; y < 256; y += 2) { g.fillStyle = 'rgba(255,255,255,' + (rnd() * 0.035) + ')'; g.fillRect(0, y, 64, 1); }
  g.fillStyle = '#C9A04E'; g.fillRect(0, 0, 64, 10); g.fillStyle = 'rgba(255,230,160,0.6)'; g.fillRect(0, 3, 64, 2);
  return tex(c, 6, 1);
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
// the performer: the shapes of the parts (posed by a rig, drawn instanced)
// ─────────────────────────────────────────────────────────────
function performerGeometry() {
  var G = {};
  // kneeling, sitting back on the heels: the thobe over the folded legs
  G.legs = new RoundedBoxGeometry(0.42, 0.22, 0.56, 4, 0.1); G.legs.translate(0, 0.11, 0.1);
  // the body of the thobe, from the hips to the neck
  G.torso = lathe([[0, 0], [0.2, 0.0], [0.214, 0.05], [0.188, 0.2], [0.176, 0.3], [0.196, 0.41], [0.178, 0.47], [0.085, 0.515], [0.05, 0.53], [0, 0.535]], 22);
  G.torso.scale(1, 1, 0.74);
  // a bisht for the mu'allim: open at the front
  G.bisht = lathe([[0.235, 0.0], [0.24, 0.06], [0.215, 0.22], [0.205, 0.33], [0.218, 0.42], [0.19, 0.465], [0.1, 0.5]], 22, 0.55, Math.PI * 2 - 1.1);
  G.bisht.scale(1, 1, 0.8);
  var skull = new THREE.SphereGeometry(0.086, 18, 14); skull.scale(0.94, 1.08, 1); skull.translate(0, 0.102, 0.02);
  var nose = new THREE.SphereGeometry(0.016, 8, 6); nose.scale(0.8, 1.4, 1.1); nose.translate(0, 0.098, 0.103);
  G.head = mergeGeometries([skull, nose]);
  // a beard and moustache: the lower front of the face
  G.beard = new THREE.SphereGeometry(0.09, 16, 10, Math.PI * 0.08, Math.PI * 0.84, Math.PI * 0.52, Math.PI * 0.4);   // centered on the front (+z)
  G.beard.scale(0.95, 1.05, 1.06); G.beard.translate(0, 0.104, 0.024);
  // the shemagh: over the head and down onto the shoulders, open for the face
  G.shemagh = lathe([[0.0, 0.214], [0.062, 0.206], [0.1, 0.178], [0.113, 0.13], [0.117, 0.07], [0.13, 0.0], [0.168, -0.05], [0.2, -0.085], [0.215, -0.12]], 28, 0.9, Math.PI * 2 - 1.8);
  // it hangs down the back to the shoulder blades, and lies over the shoulders at the sides
  (function () {
    var sp = G.shemagh.attributes.position;
    for (var i = 0; i < sp.count; i++) {
      var x = sp.getX(i), y = sp.getY(i), z = sp.getZ(i);
      if (y >= 0.02) continue;
      var back = (1 - z / Math.max(0.001, Math.hypot(x, z))) / 2;      // 0 at the front, 1 at the back
      var d = (0.02 - y);
      sp.setY(i, 0.02 - d * (1 + 1.4 * back * back));
      var k = 1 + d * 1.5 * back;
      sp.setX(i, x * (1 + d * 0.6)); sp.setZ(i, z * k - back * d * 0.12);
    }
    G.shemagh.computeVertexNormals();
  })();
  // two black cords of the igal
  var i1 = new THREE.TorusGeometry(0.094, 0.012, 8, 30); i1.rotateX(Math.PI / 2); i1.translate(0, 0.17, 0);
  var i2 = new THREE.TorusGeometry(0.09, 0.011, 8, 30); i2.rotateX(Math.PI / 2); i2.translate(0, 0.192, -0.004);
  G.igal = mergeGeometries([i1, i2]); G.igal.rotateX(-0.12);
  G.upper = new THREE.CapsuleGeometry(0.044, 0.2, 4, 10); G.upper.translate(0, -0.135, 0);
  G.fore = new THREE.CapsuleGeometry(0.037, 0.17, 4, 10); G.fore.translate(0, -0.12, 0);
  G.hand = new THREE.SphereGeometry(0.041, 12, 10); G.hand.scale(1, 1.15, 0.8);
  // the frame drum (tar): a wooden frame with the skin on the side facing +z
  G.rim = new THREE.CylinderGeometry(0.21, 0.21, 0.055, 36, 1, true); G.rim.rotateX(Math.PI / 2);
  G.skin = new THREE.CircleGeometry(0.207, 36); G.skin.translate(0, 0, 0.026);
  return G;
}
// arm poses: [shoulder x, shoulder z (outward), elbow x], left arm; the right one is mirrored
var POSE = {
  knee: [-0.42, 0.06, -0.78],
  clap: [-1.0, -0.44, -1.15],
  holdL: [-1.0, 0.36, -1.05], holdR: [-0.92, -0.02, -1.38],
  upL: [-2.75, 0.22, -0.35], upR: [-2.55, -0.12, -0.62]
};
function mix3(a, b, t) { return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]; }

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
    this.beat = 0; this.bpm = 66;
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
      shemagh: new THREE.MeshStandardMaterial({ map: shemaghTexture(), roughness: 0.85, side: THREE.DoubleSide }),
      igal: new THREE.MeshStandardMaterial({ color: 0x141212, roughness: 0.55 }),
      beard: new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.95 }),
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
    this.im = {
      legs: inst(G.legs, M.thobe, N), torso: inst(G.torso, M.thobe, N), head: inst(G.head, M.skin, N),
      shemagh: inst(G.shemagh, M.shemagh, N), igal: inst(G.igal, M.igal, N),
      beard: inst(G.beard, M.beard, N),
      upper: inst(G.upper, M.thobe, N * 2), fore: inst(G.fore, M.thobe, N * 2), hand: inst(G.hand, M.skin, N * 2),
      rim: inst(G.rim, M.rim, N), skin: inst(G.skin, M.drum, N),
      bisht: inst(G.bisht, M.bisht, 2)
    };
    // a little variety in the white of the thobes
    var rnd = mulberry32(42), tint = new THREE.Color();
    for (var i = 0; i < N; i++) {
      var w = 0.93 + rnd() * 0.07;
      tint.setRGB(w, w * (0.985 + rnd() * 0.015), w * (0.96 + rnd() * 0.04));
      this.im.legs.setColorAt(i, tint); this.im.torso.setColorAt(i, tint);
      this.im.upper.setColorAt(i * 2, tint); this.im.upper.setColorAt(i * 2 + 1, tint);
      this.im.fore.setColorAt(i * 2, tint); this.im.fore.setColorAt(i * 2 + 1, tint);
      var s = 0.85 + rnd() * 0.3; tint.setRGB(s, s, s);
      this.im.head.setColorAt(i, tint); this.im.hand.setColorAt(i * 2, tint); this.im.hand.setColorAt(i * 2 + 1, tint);
      // beards: black, dark brown, or grey for the elders (the two mu'allims are elders)
      var lead = i % ROW.N === ROW.LEAD, k = rnd();
      tint.set(lead || k < 0.18 ? 0xB9B4AC : k < 0.6 ? 0x1A1512 : 0x3A2A1E);
      this.im.beard.setColorAt(i, tint);
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
    this.leadScale = new THREE.Matrix4().makeScale(1.12, 1.02, 1.3);
    this.updateFigures(0.016);
  }
  makeFigure(row, seat, rnd) {
    var root = new THREE.Object3D();
    var hips = new THREE.Object3D(); hips.position.set(0, 0.2, -0.04); root.add(hips);
    var chest = new THREE.Object3D(); chest.position.set(0, 0.0, 0); hips.add(chest);
    var head = new THREE.Object3D(); head.position.set(0, 0.52, 0.012); chest.add(head);
    var shL = new THREE.Object3D(); shL.position.set(0.2, 0.44, 0); chest.add(shL);
    var shR = new THREE.Object3D(); shR.position.set(-0.2, 0.44, 0); chest.add(shR);
    var elL = new THREE.Object3D(); elL.position.set(0, -0.27, 0); shL.add(elL);
    var elR = new THREE.Object3D(); elR.position.set(0, -0.27, 0); shR.add(elR);
    var hdL = new THREE.Object3D(); hdL.position.set(0, -0.255, 0); elL.add(hdL);
    var hdR = new THREE.Object3D(); hdR.position.set(0, -0.255, 0); elR.add(hdR);
    // where the drum sits: held at the chest, lifted over the head, or lying on the rug
    var dHold = new THREE.Object3D(); dHold.position.set(-0.03, 0.34, 0.31); dHold.rotation.set(-0.12, -0.28, 0); chest.add(dHold);
    var dUp = new THREE.Object3D(); dUp.position.set(-0.02, 0.76, 0.17); dUp.rotation.set(-0.55, -0.12, 0); chest.add(dUp);
    var dDown = new THREE.Object3D(); dDown.position.set(0.02, 0.035, 0.5); dDown.rotation.set(-Math.PI / 2, 0, 0.3); root.add(dDown);
    var p = this.seatPos(row, seat);
    root.position.set(p.x, 0, p.z); root.rotation.y = row === 0 ? 0 : Math.PI;
    return {
      row: row, seat: seat, nodes: { root: root, hips: hips, chest: chest, head: head, shL: shL, shR: shR, elL: elL, elR: elR, hdL: hdL, hdR: hdR, dHold: dHold, dUp: dUp, dDown: dDown },
      jit: (rnd() - 0.5) * 0.06, lean: 0, bob: 0, lift: 0, hold: 1, clapOn: 0, sing: 0, show: 1, showTo: 1,
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
        // one row sings and claps: drums down, hands meeting on the beat, a small rock forward
        tHold = 0; tClapOn = 1; tSing = 1; clap = pulse(b, 0.24);
        tBob = 0.35 * pulse(b, 0.45);
      } else if (mode === 'sway') {
        // the other row sways side to side, lifting the drums every other bar, striking on the beat
        tHold = 1; tLean = Math.cos(Math.PI * b / 2);
        tLift = rowLift != null ? rowLift : (Math.floor(b / 4) % 2 === 1) ? 1 : 0;
        strike = pulse(b, 0.2); tBob = 0.15 * pulse(b + 1, 0.5);
      } else if (mode === 'beat') {
        // drums held at the chest, struck on every beat
        tHold = 1; strike = pulse(b, 0.2); tBob = 0.18 * pulse(b, 0.5);
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
      f.show = damp(f.show, f.showTo, 5, dt);
      if (f.tx !== undefined) f.x = damp(f.x, f.tx, 4, dt);
      // the joints
      n.root.position.set(f.x, 0, f.z);
      var sh = Math.max(0.0001, f.show);
      n.root.scale.setScalar(sh);
      n.hips.rotation.set(f.bob * 0.32, 0, f.lean * 0.21);
      n.chest.rotation.set(f.bob * 0.18 - f.sing * 0.04, 0, f.lean * 0.1);
      n.head.rotation.set(-f.sing * 0.24 + f.bob * 0.2, 0, f.lean * 0.12);
      var gL = mix3(POSE.knee, POSE.clap, f.clapOn), gR = mix3(POSE.knee, POSE.clap, f.clapOn);
      var hL = mix3(POSE.holdL, POSE.upL, f.lift), hR = mix3(POSE.holdR, POSE.upR, f.lift);
      var L = mix3(gL, hL, f.hold), Rr = mix3(gR, hR, f.hold);
      var apart = (1 - clap) * 0.3 * f.clapOn * (1 - f.hold);
      L[1] += apart; Rr[1] += apart;
      Rr[2] += strike * 0.5 * f.hold; Rr[0] += strike * 0.12 * f.hold;
      L[0] -= slap * 0.5; Rr[0] -= slap * 0.5;
      n.shL.rotation.set(L[0], 0, L[1]); n.elL.rotation.set(L[2], 0, 0);
      n.shR.rotation.set(Rr[0], 0, -Rr[1]); n.elR.rotation.set(Rr[2], 0, 0);
      n.root.updateMatrixWorld(true);
      // instance matrices
      if (f.show < 0.02) {
        ['legs', 'torso', 'head', 'beard', 'shemagh', 'igal', 'rim', 'skin'].forEach(function (k) { im[k].setMatrixAt(i, self.zero); });
        ['upper', 'fore', 'hand'].forEach(function (k) { im[k].setMatrixAt(i * 2, self.zero); im[k].setMatrixAt(i * 2 + 1, self.zero); });
        if (f.leader) im.bisht.setMatrixAt(f.bishtIndex, self.zero);
        continue;
      }
      im.legs.setMatrixAt(i, n.root.matrixWorld);
      im.torso.setMatrixAt(i, n.chest.matrixWorld);
      im.head.setMatrixAt(i, n.head.matrixWorld);
      im.beard.setMatrixAt(i, n.head.matrixWorld);
      // the mu'allim's shemagh lies over his bisht
      if (f.leader) { tm.multiplyMatrices(n.head.matrixWorld, this.leadScale); im.shemagh.setMatrixAt(i, tm); }
      else im.shemagh.setMatrixAt(i, n.head.matrixWorld);
      im.igal.setMatrixAt(i, n.head.matrixWorld);
      im.upper.setMatrixAt(i * 2, n.shL.matrixWorld); im.upper.setMatrixAt(i * 2 + 1, n.shR.matrixWorld);
      im.fore.setMatrixAt(i * 2, n.elL.matrixWorld); im.fore.setMatrixAt(i * 2 + 1, n.elR.matrixWorld);
      im.hand.setMatrixAt(i * 2, n.hdL.matrixWorld); im.hand.setMatrixAt(i * 2 + 1, n.hdR.matrixWorld);
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
    var tmp = new THREE.Group(), m4 = new THREE.Matrix4();
    for (var k in this.im) {
      var im = this.im[k];
      for (var i = 0; i < im.count; i++) {
        im.getMatrixAt(i, m4);
        if (Math.abs(m4.determinant()) < 1e-9) continue;
        var mesh = new THREE.Mesh(im.geometry, im.material);
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
