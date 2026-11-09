/**
 * sadu-world.js — the 3D world for Al-Sadu.
 *
 * A Bedouin house of hair (بيت الشعر) at dusk in the north, Sadu on its floor and
 * cushions, a coffee hearth by the door, and a ground loom stretched out on the sand
 * with everything a weaver needs around it: the fleece, the kirdash, the spindle,
 * the yarn drying on a rope and the dye pots.
 *
 * AR, as in Al-Masaqil:
 *   - Android (Chrome + ARCore): WebXR. The loom and its tools stand on your real floor.
 *   - iPhone: AR Quick Look shows the loom as it is right now, in your room.
 *
 * Units are meters. The loom lives in its own group ("field"): the warp runs along z,
 * the weaver sits at +z, y is up.
 */
import * as THREE from 'three';
import { bandCanvas, YARN, YARN_KEYS, DEMO, COLS, ZONES } from './sadu-weave.js';

export const LOOM = { W: 0.30, FRONT: 0.92, BACK: -1.08, Y: 0.062, ROWS: 160, CW: 6, CH: 8 };
LOOM.LEN = LOOM.FRONT - LOOM.BACK;
LOOM.ROW = LOOM.LEN / LOOM.ROWS;

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
var N1 = lattice(64, 5), N2 = lattice(64, 17), N3 = lattice(64, 29);
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

// ─────────────────────────────────────────────────────────────
// textures, drawn in code
// ─────────────────────────────────────────────────────────────
function sandTexture() {
  var S = 256, c = canvas(S), g = c.getContext('2d'), img = g.createImageData(S, S), d = img.data;
  for (var y = 0; y < S; y++) for (var x = 0; x < S; x++) {
    var u = x / S * 8, v = y / S * 8;
    var n = fbm(u, v), r = N3(u * 7.7, v * 7.7);
    var rip = 0.5 + 0.5 * Math.sin((v * 2.2 + n * 1.6) * Math.PI * 2);
    var k = 0.82 + n * 0.22 + rip * 0.05 + (r - 0.5) * 0.12;
    var i = (y * S + x) * 4;
    d[i] = Math.min(255, 214 * k); d[i + 1] = Math.min(255, 168 * k); d[i + 2] = Math.min(255, 118 * k); d[i + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  return tex(c, 24);
}
// goat-hair cloth for the tent: black, with the faint stripes of narrow woven strips
function hairTexture() {
  var S = 256, c = canvas(S), g = c.getContext('2d'), rnd = mulberry32(3);
  g.fillStyle = '#17110E'; g.fillRect(0, 0, S, S);
  for (var y = 0; y < S; y += 2) {
    g.fillStyle = 'rgba(' + (40 + rnd() * 30 | 0) + ',' + (30 + rnd() * 20 | 0) + ',' + (24 + rnd() * 14 | 0) + ',' + (0.35 + rnd() * 0.4) + ')';
    g.fillRect(0, y, S, 1);
  }
  for (var x = 0; x < S; x += 64) { g.fillStyle = 'rgba(0,0,0,0.5)'; g.fillRect(x, 0, 2, S); g.fillStyle = 'rgba(90,70,56,0.25)'; g.fillRect(x + 2, 0, 1, S); }
  for (var k = 0; k < 900; k++) { g.fillStyle = 'rgba(120,96,78,' + (rnd() * 0.18) + ')'; g.fillRect(rnd() * S, rnd() * S, 1, 1 + rnd() * 3); }
  return tex(c, 6, 3);
}
// several Sadu strips sewn side by side
function rugTexture(specs, rows) {
  var parts = specs.map(function (s) { return bandCanvas(s, rows, { cw: 4, ch: 5, dir: 'h' }); });
  var w = parts[0].width, h = parts.reduce(function (a, p) { return a + p.height; }, 0);
  var c = canvas(w, h), g = c.getContext('2d'), y = 0;
  parts.forEach(function (p) { g.drawImage(p, 0, y); y += p.height; });
  return tex(c);
}
function woolTexture(base, seed) {
  var S = 128, c = canvas(S), g = c.getContext('2d'), rnd = mulberry32(seed);
  g.fillStyle = base; g.fillRect(0, 0, S, S);
  for (var k = 0; k < 1400; k++) {
    var x = rnd() * S, y = rnd() * S, a = rnd() * Math.PI * 2, l = 2 + rnd() * 6;
    g.strokeStyle = rnd() < 0.5 ? 'rgba(255,255,255,' + (rnd() * 0.25) + ')' : 'rgba(0,0,0,' + (rnd() * 0.22) + ')';
    g.lineWidth = 0.8;
    g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + Math.cos(a) * l, y + Math.sin(a) * l, x + Math.cos(a + 1) * l, y + Math.sin(a + 1) * l); g.stroke();
  }
  return tex(c, 2);
}
// a hank of yarn: many strands side by side
function strandTexture() {
  if (strandTexture.t) return strandTexture.t;
  var c = canvas(64, 64), g = c.getContext('2d'), rnd = mulberry32(13);
  g.fillStyle = '#ffffff'; g.fillRect(0, 0, 64, 64);
  for (var y = 0; y < 64; y += 2) { g.fillStyle = 'rgba(0,0,0,' + (0.08 + rnd() * 0.18) + ')'; g.fillRect(0, y, 64, 1); }
  for (var k = 0; k < 40; k++) { g.strokeStyle = 'rgba(0,0,0,0.12)'; g.beginPath(); var x = rnd() * 64; g.moveTo(x, 0); g.lineTo(x + 18, 64); g.stroke(); }
  var t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(6, 1);
  return (strandTexture.t = t);
}
function woodTexture() {
  var c = canvas(64, 256), g = c.getContext('2d'), rnd = mulberry32(11);
  g.fillStyle = '#7A5636'; g.fillRect(0, 0, 64, 256);
  for (var x = 0; x < 64; x += 2) { g.fillStyle = 'rgba(' + (60 + rnd() * 50 | 0) + ',' + (38 + rnd() * 30 | 0) + ',20,' + (0.25 + rnd() * 0.35) + ')'; g.fillRect(x, 0, 1 + rnd() * 2, 256); }
  return tex(c);
}
function moonTexture() {
  var c = canvas(128), g = c.getContext('2d');
  var gr = g.createRadialGradient(64, 64, 10, 64, 64, 64);
  gr.addColorStop(0, 'rgba(255,240,210,0.35)'); gr.addColorStop(1, 'rgba(255,240,210,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
  g.fillStyle = '#FFF2D6'; g.beginPath(); g.arc(64, 64, 22, 0, Math.PI * 2); g.fill();
  g.globalCompositeOperation = 'destination-out';
  g.beginPath(); g.arc(75, 58, 21, 0, Math.PI * 2); g.fill();
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
// a dusk sky as an equirect image, for reflections
function skyEquirect() {
  var c = canvas(256, 128), g = c.getContext('2d');
  var gr = g.createLinearGradient(0, 0, 0, 128);
  gr.addColorStop(0, '#0E0D22'); gr.addColorStop(0.32, '#2B1C3E'); gr.addColorStop(0.46, '#7A4552'); gr.addColorStop(0.5, '#D98A5C'); gr.addColorStop(0.52, '#4A3329'); gr.addColorStop(1, '#22180F');
  g.fillStyle = gr; g.fillRect(0, 0, 256, 128);
  var sun = g.createRadialGradient(64, 62, 2, 64, 62, 60);
  sun.addColorStop(0, 'rgba(255,200,140,0.9)'); sun.addColorStop(1, 'rgba(255,200,140,0)');
  g.fillStyle = sun; g.fillRect(0, 0, 256, 128);
  var t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.mapping = THREE.EquirectangularReflectionMapping;
  return t;
}

// lathe profiles
function lathe(points, seg) { return new THREE.LatheGeometry(points.map(function (p) { return new THREE.Vector2(p[0], p[1]); }), seg || 24); }

// ─────────────────────────────────────────────────────────────
// the world
// ─────────────────────────────────────────────────────────────
export class World {
  constructor(canvasEl, opts) {
    opts = opts || {};
    this.canvas = canvasEl;
    this.lowPower = /Android|iPhone|iPad|Mobile/i.test(navigator.userAgent);
    this.listeners = {};
    this.anims = [];
    this.clock = 0;
    this.xr = null; this.placed = false; this.arScale = 1;
    this.orbit = { yaw: 0, pitch: 0, on: false };
    this.spec = Object.assign({}, DEMO); this.lead = 0;
    this.woven = 120; this.warpP = 1; this.stakesIn = 4; this.fluff = 1; this.cop = 1;
    // the hanging spindle: how fast it turns and how far it has dropped (0 at the hand, 1 near the ground)
    this.spinSpeed = 0; this.drop = 0;
    // weaving: how open the shed is (0..1), which half of the threads is up, where the mishaʿ is
    this.shedOpen = 0; this.shedSet = 0; this.mishaaX = -0.34;
    this._v = null;
  }
  on(name, fn) { (this.listeners[name] = this.listeners[name] || []).push(fn); }
  emit(name, a, b, c) { (this.listeners[name] || []).forEach(function (f) { try { f(a, b, c); } catch (e) { console.error(e); } }); }

  async init() {
    this.fast = !!window.CL_SD_FAST;
    var r = this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: !this.fast, alpha: true, powerPreference: 'high-performance' });
    r.setPixelRatio(window.CL_SD_DPR || Math.min(window.devicePixelRatio || 1, 2));
    r.outputColorSpace = THREE.SRGBColorSpace;
    r.toneMapping = THREE.ACESFilmicToneMapping;
    r.toneMappingExposure = 1.05;
    r.shadowMap.enabled = !this.fast;
    r.shadowMap.type = THREE.PCFSoftShadowMap;
    r.xr.enabled = true;

    var scene = this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(46, 1, 0.01, 80);
    this.camera.position.set(2.0, 1.25, 2.9);
    this.rig = { pos: this.camera.position.clone(), look: new THREE.Vector3(-0.2, 0.45, -1), tpos: this.camera.position.clone(), tlook: new THREE.Vector3(-0.2, 0.45, -1), k: 2, drift: 0, mode: 'cover' };

    this.mats();
    this.field = new THREE.Group(); scene.add(this.field);
    this.env3d = new THREE.Group(); scene.add(this.env3d);
    this.buildLoom();
    this.buildProps();
    this.buildDesert();
    this.buildTent();
    this.buildHearth();
    this.buildSky();
    this.buildReticle();

    // light: the last of the sun on the western horizon, the hearth, and the dusk sky
    var sun = this.sun = new THREE.DirectionalLight(0xFFB27A, 1.9);
    sun.position.set(-3.2, 1.6, 1.4);
    sun.target.position.set(0, 0, -0.4);
    sun.castShadow = !this.fast;
    sun.shadow.mapSize.set(this.lowPower ? 1024 : 2048, this.lowPower ? 1024 : 2048);
    var sc = sun.shadow.camera; sc.left = -3; sc.right = 3; sc.top = 3; sc.bottom = -3; sc.near = 0.1; sc.far = 12;
    sun.shadow.bias = -0.0005; sun.shadow.normalBias = 0.02;
    this.field.add(sun); this.field.add(sun.target);
    this.hemi = new THREE.HemisphereLight(0x6F7BB8, 0x5A3B28, 0.75);
    scene.add(this.hemi);
    scene.fog = new THREE.Fog(0x6E4250, 10, 38);

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
    this.wood = new THREE.MeshStandardMaterial({ map: woodTexture(), roughness: 0.85, metalness: 0 });
    this.woodDark = new THREE.MeshStandardMaterial({ color: 0x5B3D25, roughness: 0.9 });
    this.rope = new THREE.MeshStandardMaterial({ color: 0xBFA27C, roughness: 1 });
    this.hair = new THREE.MeshStandardMaterial({ map: hairTexture(), roughness: 1, side: THREE.DoubleSide });
    this.brass = new THREE.MeshStandardMaterial({ color: 0xC9A04E, metalness: 0.9, roughness: 0.32 });
    this.iron = new THREE.MeshStandardMaterial({ color: 0x2C2622, metalness: 0.7, roughness: 0.5 });
    this.stone = new THREE.MeshStandardMaterial({ color: 0x6A5243, roughness: 1, flatShading: true });
  }

  // ── the loom: two beams, four stakes, the warp, and the woven band ──
  buildLoom() {
    var F = this.field, L = LOOM;
    var loom = this.loom = new THREE.Group(); F.add(loom);
    // the band texture: what's woven plus the bare warp beyond it
    this.bandC = canvas(COLS * L.CW, L.ROWS * L.CH);
    this.bandT = new THREE.CanvasTexture(this.bandC);
    this.bandT.colorSpace = THREE.SRGBColorSpace; this.bandT.flipY = false; this.bandT.anisotropy = 8;
    this.bandMat = new THREE.MeshStandardMaterial({ map: this.bandT, roughness: 0.95, alphaTest: 0.4, side: THREE.DoubleSide });
    var band = this.band = new THREE.Mesh(new THREE.PlaneGeometry(L.W, L.LEN), this.bandMat);
    band.rotation.x = -Math.PI / 2;
    band.position.set(0, L.Y, (L.FRONT + L.BACK) / 2);
    band.receiveShadow = true; band.castShadow = true;
    loom.add(band);
    // beams
    var beamG = new THREE.CylinderGeometry(0.022, 0.022, 0.48, 12);
    this.beams = [L.FRONT + 0.015, L.BACK - 0.015].map(function (z) {
      var b = new THREE.Mesh(beamG, this.wood); b.rotation.z = Math.PI / 2; b.position.set(0, L.Y + 0.004, z); b.castShadow = true; loom.add(b); return b;
    }, this);
    // stakes (driven in during "set up the loom")
    var stakeG = new THREE.CylinderGeometry(0.012, 0.008, 0.24, 8);
    this.stakes = [];
    [[-0.2, L.FRONT + 0.05], [0.2, L.FRONT + 0.05], [-0.2, L.BACK - 0.05], [0.2, L.BACK - 0.05]].forEach(function (p) {
      var s = new THREE.Mesh(stakeG, this.woodDark); s.position.set(p[0], 0.03, p[1]); s.castShadow = true; loom.add(s); this.stakes.push(s);
      // the cord from the stake to the beam
      var cord = new THREE.Mesh(new THREE.CylinderGeometry(0.003, 0.003, 0.07, 5), this.rope);
      cord.position.set(p[0] * 0.9, 0.06, p[1] + (p[1] > 0 ? -0.02 : 0.02)); cord.rotation.x = p[1] > 0 ? 0.9 : -0.9;
      loom.add(cord); s.userData.cord = cord;
    }, this);
    // heddle rod and shed stick across the warp, near where the weaving stops
    this.heddle = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.4, 8), this.woodDark);
    this.heddle.rotation.z = Math.PI / 2; loom.add(this.heddle);
    this.shed = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.01, 0.035), this.wood);
    loom.add(this.shed);
    // the leashes: loops of string from the heddle rod around every other thread
    this.leashes = new THREE.Group(); loom.add(this.leashes);
    var lm = new THREE.MeshStandardMaterial({ color: 0xD9C9A6, roughness: 1 });
    for (var q = 0; q < 11; q++) { var ls = new THREE.Mesh(new THREE.CylinderGeometry(0.0009, 0.0009, 1, 3), lm); ls.position.x = -0.14 + q * 0.028; this.leashes.add(ls); }
    // the open shed: half of the threads lifted toward the heddle, drawn on a strip that tilts up
    this.shedC = canvas(COLS * L.CW, 16);
    this.shedT = new THREE.CanvasTexture(this.shedC); this.shedT.colorSpace = THREE.SRGBColorSpace;
    this.shedMesh = new THREE.Mesh(new THREE.PlaneGeometry(L.W, 1), new THREE.MeshStandardMaterial({ map: this.shedT, alphaTest: 0.4, side: THREE.DoubleSide, roughness: 1 }));
    this.shedMesh.visible = false; this.shedMesh.castShadow = true; loom.add(this.shedMesh);
    // the minshaza: a long wooden piece with two sharp ends, used to pack the weft tight
    var mg = new THREE.BoxGeometry(0.5, 0.008, 0.026, 8, 1, 1), pos = mg.attributes.position;
    for (var i = 0; i < pos.count; i++) { var x = pos.getX(i), k = 1 - Math.pow(Math.abs(x) / 0.25, 3); pos.setZ(i, pos.getZ(i) * Math.max(0.15, k)); }
    mg.computeVertexNormals();
    this.minshaza = new THREE.Mesh(mg, this.wood); this.minshaza.castShadow = true; loom.add(this.minshaza);
    // the mishaʿ: wooden sticks with the weft wound around them like a fan
    var mi = this.mishaa = new THREE.Group();
    var stick = new THREE.Mesh(new THREE.CylinderGeometry(0.0035, 0.0035, 0.36, 6), this.woodDark); stick.rotation.z = Math.PI / 2; mi.add(stick);
    var wrapM = new THREE.MeshStandardMaterial({ map: strandTexture(), color: 0x3A2C25, roughness: 1 });
    var wrap = new THREE.Mesh(new THREE.SphereGeometry(1, 14, 8), wrapM); wrap.scale.set(0.075, 0.011, 0.03); mi.add(wrap);
    mi.traverse(function (o) { if (o.isMesh) o.castShadow = true; });
    mi.visible = false; loom.add(mi);
    // a stone to drive the stakes in
    this.mallet = new THREE.Mesh(new THREE.DodecahedronGeometry(0.034, 0), this.stone);
    this.mallet.castShadow = true; this.mallet.visible = false; loom.add(this.mallet);
    // the ball of yarn that lays the warp, and the thread trailing behind it
    this.ball = new THREE.Mesh(new THREE.SphereGeometry(0.036, 18, 12), new THREE.MeshStandardMaterial({ map: strandTexture(), roughness: 1 }));
    this.ball.castShadow = true; this.ball.visible = false; loom.add(this.ball);
    this.layLine = new THREE.Mesh(new THREE.CylinderGeometry(0.0016, 0.0016, 1, 4), new THREE.MeshStandardMaterial({ roughness: 1 }));
    this.layLine.visible = false; loom.add(this.layLine);
    this.beat = 0;
    this.setSpec(this.spec);
    this.placeTools();
  }

  // the weaving stops here (z of the fell)
  fellZ() { return LOOM.FRONT - this.woven * LOOM.ROW; }
  placeTools() {
    var z = this.fellZ(), L = LOOM, b = this.beat, open = this.shedOpen;
    var hy = L.Y + 0.022 + open * 0.04;
    this.heddle.position.set(0, hy, z - 0.07);
    this.shed.position.set(0, L.Y + 0.012, z - 0.2);
    this.minshaza.position.set(0, L.Y + 0.012 + b * 0.012, z - 0.03 + b * 0.025);
    this.minshaza.rotation.x = -b * 0.5;
    var on = this.warpP >= 1;
    this.heddle.visible = this.shed.visible = this.minshaza.visible = this.leashes.visible = on;
    // the leashes run from the heddle rod down to the threads they lift
    var bot = L.Y + 0.002 + open * 0.028;
    this.leashes.position.z = z - 0.07;
    this.leashes.children.forEach(function (ls) { ls.scale.y = Math.max(0.002, hy - bot); ls.position.y = (hy + bot) / 2; });
    // the open shed: a strip of lifted threads from the fell up to the heddle
    this.shedMesh.visible = on && open > 0.03;
    if (this.shedMesh.visible) {
      var len = 0.07, rise = open * 0.028;
      this.shedMesh.scale.y = Math.hypot(len, rise);
      this.shedMesh.rotation.set(-Math.PI / 2 + Math.atan2(rise, len), 0, 0);
      this.shedMesh.position.set(0, L.Y + 0.002 + rise / 2, z - len / 2);
    }
    this.mishaa.position.set(this.mishaaX, L.Y + 0.008 + open * 0.005, z - 0.035);
  }

  // spec: the band to weave. o.lead: plain rows before the pattern starts
  setSpec(spec, o) {
    o = o || {};
    this.spec = Object.assign({}, spec); this.lead = o.lead || 0;
    this.full = bandCanvas(this.spec, LOOM.ROWS, { cw: LOOM.CW, ch: LOOM.CH, flip: true, lead: this.lead });
    this.grid = this.full._grid;
    // the warp as laid: in the middle, a ground thread and a pattern thread side by side for every column,
    // so the weaver can pick up whichever the pattern needs
    var G = YARN[spec.ground].hex, F = YARN[spec.figure].hex;
    this.warpCols = []; this.pairCols = [];
    for (var x = 0; x < COLS; x++) {
      var mid = x >= ZONES.center[0] && x < ZONES.center[1];
      this.warpCols.push(mid ? G : YARN[YARN_KEYS[this.grid.cells[x]]].hex);
      this.pairCols.push(mid ? F : null);
    }
    this.drawLoom();
  }
  drawLoom() {
    var g = this.bandC.getContext('2d'), L = LOOM, W = COLS * L.CW, H = L.ROWS * L.CH;
    var woven = Math.max(0, Math.min(L.ROWS, Math.round(this.woven))), cols = Math.round(this.warpP * COLS);
    var top = woven * L.CH, h = H - top;
    g.clearRect(0, 0, W, H);
    if (woven > 0) g.drawImage(this.full, 0, 0, W, top, 0, 0, W, top);
    for (var x = 0; x < cols; x++) {
      var px = x * L.CW;
      if (this.pairCols[x]) {
        g.fillStyle = this.warpCols[x]; g.fillRect(px + L.CW * 0.08, top, L.CW * 0.38, h);
        g.fillStyle = this.pairCols[x]; g.fillRect(px + L.CW * 0.54, top, L.CW * 0.38, h);
      } else {
        g.fillStyle = this.warpCols[x]; g.fillRect(px + L.CW * 0.28, top, L.CW * 0.44, h);
        g.fillStyle = 'rgba(255,255,255,0.18)'; g.fillRect(px + L.CW * 0.36, top, L.CW * 0.1, h);
      }
    }
    if (woven > 0 && woven < L.ROWS) { g.fillStyle = 'rgba(0,0,0,0.5)'; g.fillRect(0, top - 1, W, 2); }
    this.bandT.needsUpdate = true;
    if (this.heddle) this.placeTools();
  }
  setWoven(rows) { this.woven = rows; this.drawLoom(); }
  setWarp(p) { this.warpP = Math.max(0, Math.min(1, p)); this.drawLoom(); }
  setWarpCols(n) { this.setWarp(n / COLS); }
  colX(i) { return -LOOM.W / 2 + (i + 0.5) * LOOM.W / COLS; }
  // which yarn sits in grid cell (row, col) of the band on the loom
  cellAt(row, col) { return YARN_KEYS[this.grid.cells[row * COLS + col]]; }

  // ── the stakes: two blows each ──
  setStakes(n) {
    this.stakesIn = n;
    for (var i = 0; i < this.stakes.length; i++) this.setStakeHits(i, i < n ? 2 : 0);
  }
  setStakeHits(i, h) {
    var s = this.stakes[i];
    s.userData.hits = h;
    s.position.y = 0.13 - 0.1 * Math.min(1, h / 2);
    s.userData.cord.visible = h >= 2;
  }
  stakeTop(i) { var s = this.stakes[i]; return { x: s.position.x, y: s.position.y + 0.11, z: s.position.z }; }
  hitStake(i) {
    var s = this.stakes[i], self = this, m = this.mallet, h = (s.userData.hits || 0) + 1;
    var from = s.position.y, to = 0.13 - 0.1 * Math.min(1, h / 2), top = from + 0.12;
    s.userData.hits = h;
    m.visible = true; m.position.set(s.position.x + 0.015, top + 0.17, s.position.z);
    this.animate(0.13, function (t) { m.position.y = top + 0.035 + 0.17 * (1 - t * t); m.rotation.z = t * 0.6; }, function () {
      self.animate(0.09, function (t) { s.position.y = from + (to - from) * t; }, function () { s.userData.cord.visible = h >= 2; });
      self.animate(0.3, function (t) { m.position.y = top + 0.035 + (to - from) + 0.07 * Math.sin(t * Math.PI); m.position.x = s.position.x + 0.015 + t * 0.03; }, function () { m.visible = false; });
    });
    return h;
  }

  // ── laying the warp: a ball of yarn carried from beam to beam ──
  setBall(x, z, hex, fromZ) {
    var b = this.ball, L = LOOM;
    b.visible = true; b.position.set(x, L.Y + 0.036, z); b.material.color.set(hex);
    var line = this.layLine;
    if (fromZ == null || Math.abs(fromZ - z) < 0.01) { line.visible = false; return; }
    var a = new THREE.Vector3(x, L.Y + 0.004, fromZ), e = new THREE.Vector3(x, L.Y + 0.012, z);
    line.visible = true; line.material.color.set(hex);
    line.position.copy(a).add(e).multiplyScalar(0.5); line.scale.y = a.distanceTo(e);
    line.lookAt(this.field.localToWorld(e.clone())); line.rotateX(Math.PI / 2);
  }
  hideBall() { this.ball.visible = false; this.layLine.visible = false; }

  // ── weaving: open the shed, pass the mishaʿ, beat with the minshaza ──
  drawShed(set) {
    var g = this.shedC.getContext('2d'), L = LOOM;
    g.clearRect(0, 0, this.shedC.width, this.shedC.height);
    for (var x = set; x < COLS; x += 2) {
      g.fillStyle = this.warpCols[x]; g.fillRect(x * L.CW + L.CW * 0.16, 0, L.CW * 0.68, 16);
      g.fillStyle = 'rgba(255,255,255,0.22)'; g.fillRect(x * L.CW + L.CW * 0.3, 0, L.CW * 0.14, 16);
    }
    this.shedT.needsUpdate = true;
  }
  openShed(set, dur) {
    var self = this, from = this.shedOpen;
    this.shedSet = set; this.drawShed(set);
    this.animate(dur || 0.2, function (t) { self.shedOpen = from + (1 - from) * t; self.placeTools(); });
  }
  closeShed(dur) {
    var self = this, from = this.shedOpen;
    this.animate(dur || 0.16, function (t) { self.shedOpen = from * (1 - t); self.placeTools(); });
  }
  passWeft(dir, dur) {
    var self = this, from = dir > 0 ? -0.34 : 0.34, to = -from;
    this.mishaa.visible = true;
    this.animate(dur || 0.28, function (t) { var e = t * t * (3 - 2 * t); self.mishaaX = from + (to - from) * e; self.placeTools(); });
  }
  doBeat(dur) {
    var self = this;
    this.animate(dur || 0.28, function (t) { self.beat = Math.sin(t * Math.PI); self.placeTools(); }, function () { self.beat = 0; self.placeTools(); });
  }

  // ── the weaver's things around the loom ──
  buildProps() {
    var F = this.field;
    // the weaver's cushion at the front of the loom
    var cush = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.09, 0.3), new THREE.MeshStandardMaterial({ map: rugTexture([{ edge: 'teeth', center: 'chain', ground: 'black', figure: 'white' }], 40), roughness: 1 }));
    cush.position.set(0, 0.045, 1.22); cush.castShadow = true; cush.receiveShadow = true; F.add(cush);
    // three fleeces: white sheep's wool, black goat hair, brown camel hair
    this.fleeces = {};
    var self = this;
    [['white', '#E9DFCB', 0.5, 0.5, 1.0], ['black', '#2A221E', 0.68, 0.33, 0.85], ['brown', '#9A6844', 0.7, 0.62, 0.85]].forEach(function (f, j) {
      var g = new THREE.Group(), m = new THREE.MeshStandardMaterial({ map: woolTexture(f[1], 21 + j), roughness: 1 }), rnd = mulberry32(40 + j);
      for (var i = 0; i < 13; i++) {
        var a = rnd() * Math.PI * 2, rr = Math.sqrt(rnd()) * 0.075;
        var s = new THREE.Mesh(new THREE.IcosahedronGeometry(0.026 + rnd() * 0.022, 2), m);
        s.position.set(Math.cos(a) * rr, 0.018 + rnd() * 0.022 + (0.075 - rr) * 0.25, Math.sin(a) * rr); s.scale.set(1.25, 0.55, 1.1); s.rotation.y = rnd() * 3;
        s.castShadow = true; g.add(s);
      }
      g.position.set(f[2], 0, f[3]); g.scale.setScalar(f[4]); g.userData.mat = m;
      F.add(g); self.fleeces[f[0]] = g;
    });
    this.buildTwigs();
    // the kirdash: two boards full of fine teeth, for combing the wool
    var kd = this.kirdash = new THREE.Group();
    var boardM = new THREE.MeshStandardMaterial({ color: 0x9A7048, roughness: 0.8 });
    for (var b = 0; b < 2; b++) {
      var board = new THREE.Group();
      var p = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.012, 0.085), boardM); board.add(p);
      var hdl = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.08, 8), this.woodDark); hdl.rotation.z = Math.PI / 2; hdl.position.set(0.1, 0, 0); board.add(hdl);
      var teeth = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.006, 0.075), this.iron); teeth.position.y = b ? 0.009 : -0.009; board.add(teeth);
      board.position.set(0, 0.012 + b * 0.03, 0); board.castShadow = true;
      kd.add(board); kd.userData['b' + b] = board;
    }
    // the wool being combed, between the two boards
    var tuft = this.kdWool = new THREE.Mesh(new THREE.IcosahedronGeometry(0.04, 2), new THREE.MeshStandardMaterial({ map: woolTexture('#E9DFCB', 51), roughness: 1 }));
    tuft.position.set(0, 0.026, 0); tuft.castShadow = true; kd.add(tuft);
    kd.position.set(0.38, 0, 0.74); kd.rotation.y = 0.4; F.add(kd);
    // the spindle: a shaft, a cross-shaped whorl, a hook on top, and the yarn wound on it
    var sp = this.spindle = new THREE.Group();
    var shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.007, 0.0055, 0.3, 8), this.wood); sp.add(shaft);
    for (var w = 0; w < 2; w++) { var bar = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.011, 0.016), this.woodDark); bar.position.y = 0.1; bar.rotation.y = w * Math.PI / 2; sp.add(bar); }
    var hook = new THREE.Mesh(new THREE.TorusGeometry(0.008, 0.0018, 6, 12, Math.PI * 1.4), this.iron); hook.position.y = 0.155; sp.add(hook);
    this.copMat = new THREE.MeshStandardMaterial({ map: woolTexture('#E6DAC2', 33), roughness: 1 });
    this.copMesh = new THREE.Mesh(lathe([[0.004, -0.02], [0.02, 0.0], [0.024, 0.04], [0.016, 0.075], [0.004, 0.09]], 16), this.copMat);
    this.copMesh.position.y = -0.02; sp.add(this.copMesh);
    sp.traverse(function (o) { if (o.isMesh) o.castShadow = true; });
    // when it spins fast, the cross of the whorl blurs into a disc
    this.whorlBlur = new THREE.Mesh(new THREE.CircleGeometry(0.072, 32), new THREE.MeshBasicMaterial({ color: 0x5B3D25, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide }));
    this.whorlBlur.rotation.x = -Math.PI / 2; this.whorlBlur.position.y = 0.1; sp.add(this.whorlBlur);
    F.add(sp);
    // the thread from the spinner's hand (above, out of view) down to the hook of the spindle
    this.handPt = new THREE.Vector3(0.42, 1.25, 0.9);
    this.thread = new THREE.Mesh(new THREE.CylinderGeometry(0.0018, 0.0018, 1, 5), new THREE.MeshStandardMaterial({ color: 0xEDE3CF, roughness: 1 }));
    this.thread.visible = false; F.add(this.thread);
    this.setSpindle('rest');
    // yarn drying on a rope between two sticks
    var ropeG = new THREE.Group(); F.add(ropeG); this.yarnRope = ropeG;
    [0.16, 0.92].forEach(function (z) { var st = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.012, 0.56, 8), self.woodDark); st.position.set(-0.98, 0.28, z); st.castShadow = true; ropeG.add(st); });
    var rp = new THREE.Mesh(new THREE.CylinderGeometry(0.003, 0.003, 0.78, 5), this.rope); rp.rotation.x = Math.PI / 2; rp.position.set(-0.98, 0.53, 0.54); ropeG.add(rp);
    this.skeins = {};
    ['black', 'white', 'brown', 'beige', 'red', 'orange'].forEach(function (k, i) {
      // a hank of yarn folded over the rope: two bundles hanging side by side
      var m = new THREE.MeshStandardMaterial({ map: strandTexture(), color: new THREE.Color(YARN[k].hex), roughness: 1 });
      var sk = new THREE.Group();
      for (var h = 0; h < 2; h++) {
        var b = new THREE.Mesh(new THREE.CapsuleGeometry(0.014, 0.13, 4, 10), m);
        b.position.set(0, -0.075, (h - 0.5) * 0.026); b.rotation.x = (h - 0.5) * 0.12; b.castShadow = true;
        sk.add(b);
      }
      var top = new THREE.Mesh(new THREE.TorusGeometry(0.014, 0.008, 6, 12, Math.PI), m); top.rotation.y = Math.PI / 2; top.position.y = 0.0; sk.add(top);
      sk.material = m;
      sk.position.set(-0.98, 0.53, 0.25 + i * 0.115);
      ropeG.add(sk); self.skeins[k] = sk; sk.userData.home = sk.position.clone();
    });
    // two dye pots
    this.pots = {};
    [['red', -0.66, 1.0], ['orange', -0.46, 1.16]].forEach(function (p) {
      var g = new THREE.Group();
      var pot = new THREE.Mesh(lathe([[0.0, 0.0], [0.07, 0.005], [0.085, 0.05], [0.08, 0.1], [0.072, 0.115], [0.075, 0.12]], 24), self.iron);
      pot.castShadow = true; g.add(pot);
      var liq = new THREE.Mesh(new THREE.CircleGeometry(0.07, 24), new THREE.MeshStandardMaterial({ color: new THREE.Color(YARN[p[0]].hex), roughness: 0.25, metalness: 0.1 }));
      liq.rotation.x = -Math.PI / 2; liq.position.y = 0.105; g.add(liq); g.userData.liq = liq;
      g.position.set(p[1], 0, p[2]); F.add(g); self.pots[p[0]] = g;
    });
  }

  // 'rest': lying by the cushion. 'hang': hanging from the thread, spun and dropped by the player
  setSpindle(mode) {
    var sp = this.spindle;
    this.spindleMode = mode;
    if (mode === 'hang') { sp.rotation.set(0, sp.rotation.y, 0); this.thread.visible = true; this.placeSpindle(); }
    else { sp.position.set(0.2, 0.1, 1.22); sp.rotation.set(0, 0.5, Math.PI / 2 - 0.15); this.thread.visible = false; this.whorlBlur.material.opacity = 0; }
  }
  placeSpindle() { this.spindle.position.set(0.42, 0.4 - this.drop * 0.16, 0.9); }
  setDrop(d) { this.drop = Math.max(0, Math.min(1, d)); if (this.spindleMode === 'hang') this.placeSpindle(); }
  spindleTop() { var p = this.spindle.position; return { x: p.x, y: p.y + 0.12, z: p.z }; }
  setCop(p) { this.cop = p; var s = 0.25 + 0.75 * p; this.copMesh.scale.set(s, 0.4 + 0.6 * p, s); }
  setFluff(p) {
    this.fluff = p;
    var w = this.fleeces.white;
    w.children.forEach(function (s) { if (!s.userData.twig) s.scale.set(1 + p * 0.35, 0.65 + p * 0.25, 1 + p * 0.35); });
  }

  // ── cleaning: thorns and bits of plants caught in the white fleece ──
  buildTwigs() {
    var w = this.fleeces.white, self = this;
    var twigM = new THREE.MeshStandardMaterial({ color: 0x4E3320, roughness: 0.9 });
    var burrM = new THREE.MeshStandardMaterial({ color: 0x77683A, roughness: 1, flatShading: true });
    this.twigs = [];
    // [x, z, kind, turn]: three twigs and two burrs
    [[0.03, -0.035, 't', 0.5], [-0.05, 0.02, 'b', 0], [0.01, 0.05, 't', 2.3], [-0.035, -0.05, 't', 1.3], [0.06, 0.03, 'b', 0]].forEach(function (s) {
      var g = new THREE.Group();
      if (s[2] === 't') {
        var main = new THREE.Mesh(new THREE.CylinderGeometry(0.0026, 0.0034, 0.07, 5), twigM); main.rotation.z = Math.PI / 2 - 0.2; g.add(main);
        var side = new THREE.Mesh(new THREE.CylinderGeometry(0.0016, 0.0022, 0.028, 5), twigM); side.position.set(0.01, 0.009, 0); side.rotation.z = 0.6; g.add(side);
        var tip = new THREE.Mesh(new THREE.ConeGeometry(0.0022, 0.012, 4), twigM); tip.position.set(-0.035, -0.006, 0); tip.rotation.z = Math.PI / 2 + 0.2; g.add(tip);
      } else {
        g.add(new THREE.Mesh(new THREE.IcosahedronGeometry(0.01, 0), burrM));
        for (var k = 0; k < 12; k++) {
          var a = k / 12 * Math.PI * 2, b = ((k % 3) - 1) * 0.8;
          var sp = new THREE.Mesh(new THREE.ConeGeometry(0.0018, 0.013, 3), burrM);
          var dir = new THREE.Vector3(Math.cos(a) * Math.cos(b), Math.sin(b), Math.sin(a) * Math.cos(b));
          sp.position.copy(dir).multiplyScalar(0.011);
          sp.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
          g.add(sp);
        }
      }
      g.position.set(s[0], 0.074, s[1]); g.rotation.y = s[3];
      g.userData.twig = true; g.userData.home = g.position.clone();
      g.traverse(function (o) { if (o.isMesh) o.castShadow = true; });
      w.add(g); self.twigs.push(g);
    });
  }
  setTwigs(n) {
    this.twigs.forEach(function (t, i) { t.visible = i < n; t.position.copy(t.userData.home); t.scale.setScalar(1); t.rotation.x = 0; });
    // dusty until it's cleaned
    this.fleeces.white.userData.mat.color.set(n > 0 ? 0xC9B998 : 0xFFFFFF);
  }
  twigPos(i) { var p = new THREE.Vector3(); this.twigs[i].getWorldPosition(p); this.field.worldToLocal(p); return p; }
  pluckTwig(i) {
    var t = this.twigs[i], h = t.userData.home.clone(), self = this;
    this.animate(0.55, function (k) { t.position.set(h.x + k * 0.05, h.y + Math.sin(k * Math.PI * 0.85) * 0.13 + k * 0.02, h.z); t.rotation.x = k * 5; t.scale.setScalar(Math.max(0.001, 1 - k * k)); }, function () {
      t.visible = false;
      var left = self.twigs.filter(function (x) { return x.visible; }).length;
      self.fleeces.white.userData.mat.color.set(new THREE.Color(0xC9B998).lerp(new THREE.Color(0xFFFFFF), 1 - left / self.twigs.length));
    });
  }

  // ── combing: the top board of the kirdash follows the finger ──
  setComb(dx) { this.kirdash.userData.b1.position.x = Math.max(-0.045, Math.min(0.045, dx)); }
  setCombed(p) {
    var t = this.kdWool; t.scale.set(1.25 + p * 0.55, 0.32 + p * 0.12, 0.95 + p * 0.25);
    t.material.color.set(new THREE.Color(0xBFAF92).lerp(new THREE.Color(0xFFFFFF), p));
    this.setFluff(p);
  }

  // ── dyeing: drag a white skein into a pot; the longer it soaks, the deeper the color ──
  dyeColor(pot, d) {
    var c0 = new THREE.Color(YARN.white.hex), c1 = new THREE.Color(YARN[pot].hex);
    if (d <= 1) return c0.lerp(c1, Math.max(0, d));
    return c1.clone().lerp(c1.clone().multiplyScalar(0.42), Math.min(1, (d - 1) / 0.6));
  }
  setDyeDepth(slot, pot, d) { this.skeins[slot].material.color.copy(this.dyeColor(pot, d)); }
  setDyed(key, on) { this.setDyeDepth(key, key, on ? 1 : 0); }
  skeinPos(key) { var p = this.skeins[key].position; return { x: p.x, y: p.y - 0.075, z: p.z }; }
  skeinTo(key, x, y, z) { this.skeins[key].position.set(x, y, z); }
  skeinHome(key, done) {
    var sk = this.skeins[key], from = sk.position.clone(), to = sk.userData.home;
    this.animate(0.4, function (t) { sk.position.lerpVectors(from, to, t * t * (3 - 2 * t)); sk.position.y += Math.sin(t * Math.PI) * 0.06; }, done);
  }
  skeinsHome() { for (var k in this.skeins) this.skeins[k].position.copy(this.skeins[k].userData.home); }
  potPos(key) { var p = this.pots[key].position; return { x: p.x, y: 0.11, z: p.z }; }
  ripple(key) {
    var liq = this.pots[key].userData.liq;
    this.animate(0.4, function (t) { liq.scale.setScalar(1 + Math.sin(t * Math.PI) * 0.08); liq.position.y = 0.105 + Math.sin(t * Math.PI * 3) * 0.003 * (1 - t); });
  }

  // ── the desert ──
  buildDesert() {
    var E = this.env3d;
    var g = new THREE.PlaneGeometry(70, 70, 140, 140), pos = g.attributes.position;
    for (var i = 0; i < pos.count; i++) {
      var x = pos.getX(i), y = pos.getY(i), r = Math.sqrt(x * x + y * y);
      var h = smooth(5, 16, r) * (fbm(x * 0.07 + 3, y * 0.07 + 9) - 0.3) * 3.2 + (fbm(x * 0.6, y * 0.6) - 0.5) * 0.04 * smooth(1.2, 3, r);
      pos.setZ(i, h);
    }
    g.computeVertexNormals();
    this.sandMat = new THREE.MeshStandardMaterial({ map: sandTexture(), roughness: 1, metalness: 0 });
    var ground = this.ground = new THREE.Mesh(g, this.sandMat);
    ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true;
    E.add(ground);
    // sandstone outcrops on the horizon, like those around Jubbah
    var rnd = mulberry32(77), stone = new THREE.MeshStandardMaterial({ color: 0x9A5D3E, roughness: 1, flatShading: true });
    [[11, -16, 3.0, 1.6], [17, -9, 2.2, 1.2], [-13, -17, 3.6, 1.9], [-19, -7, 2.6, 1.3], [3, -24, 4.4, 2.1], [-6, -26, 3.2, 1.7]].forEach(function (p, j) {
      var rg = new THREE.IcosahedronGeometry(1, 3), rp = rg.attributes.position;
      for (var i = 0; i < rp.count; i++) {
        var x = rp.getX(i), y = rp.getY(i), z = rp.getZ(i), n = fbm(x * 1.6 + j * 7, z * 1.6 + y * 0.9 + j * 3);
        var k = 0.78 + n * 0.55;
        y = Math.min(y, 0.62 + (n - 0.5) * 0.25);           // flat-topped, like eroded sandstone
        rp.setXYZ(i, x * k, y * k, z * k);
      }
      rg.computeVertexNormals();
      var m = new THREE.Mesh(rg, stone); m.position.set(p[0], -0.15 * p[2], p[1]); m.scale.set(p[2], p[3], p[2] * 0.8); m.rotation.y = rnd() * 6;
      E.add(m);
    });
  }

  // ── the house of hair ──
  buildTent() {
    var E = this.env3d, T = this.tent = new THREE.Group(); E.add(T);
    var CX = -0.5, CZ = -3.15, WX = 5.6, DZ = 2.9, HF = 1.5, HM = 1.92, HB = 1.3;
    var front = CZ + DZ / 2, back = CZ - DZ / 2;
    this.tentFront = front;
    function roofH(x, z) {
      var t = (z - back) / DZ;                       // 0 at the back, 1 at the front
      var hz = t < 0.5 ? HB + (HM - HB) * smooth(0, 0.5, t) : HM + (HF - HM) * smooth(0.5, 1, t);
      var fx = ((x - (CX - WX / 2)) / 1.4) % 1;      // sags between the poles
      var sag = Math.pow(Math.sin(fx * Math.PI), 2) * 0.16;
      return hz - sag;
    }
    var rg = new THREE.PlaneGeometry(WX + 0.3, DZ + 0.2, 40, 18), rp = rg.attributes.position;
    for (var i = 0; i < rp.count; i++) {
      var x = rp.getX(i) + CX, z = -rp.getY(i) + CZ;
      rp.setXYZ(i, x, roofH(Math.min(CX + WX / 2, Math.max(CX - WX / 2, x)), Math.min(front, Math.max(back, z))) + (fbm(x * 2, z * 2) - 0.5) * 0.03, z);
    }
    rg.computeVertexNormals();
    var roof = new THREE.Mesh(rg, this.hair); roof.castShadow = true; roof.receiveShadow = true; T.add(roof);
    // walls: the back and the two sides down to the sand
    var back3 = new THREE.Mesh(new THREE.PlaneGeometry(WX, HB, 20, 2), this.hair);
    back3.position.set(CX, HB / 2, back + 0.05); T.add(back3);
    [-1, 1].forEach(function (s) {
      var wg = new THREE.PlaneGeometry(DZ, 1, 16, 2), wp = wg.attributes.position;
      for (var i = 0; i < wp.count; i++) { var z = wp.getX(i) + CZ, y0 = wp.getY(i) + 0.5; wp.setXYZ(i, 0, y0 * roofH(CX + s * WX / 2, z), z); }
      wg.computeVertexNormals();
      var w = new THREE.Mesh(wg, this.hair); w.position.x = CX + s * WX / 2; T.add(w);
    }, this);
    // poles and guy ropes
    var poleG = new THREE.CylinderGeometry(0.022, 0.026, 1, 8);
    for (var px = -2; px <= 2; px++) {
      var x = CX + px * 1.4;
      [[front - 0.02, HF], [CZ, HM], [back + 0.1, HB]].forEach(function (pz) {
        var h = roofH(x, pz[0]);
        var pole = new THREE.Mesh(poleG, this.woodDark); pole.scale.y = h; pole.position.set(x, h / 2, pz[0]); pole.castShadow = true; T.add(pole);
      }, this);
      if (Math.abs(px) === 2) {
        var a = new THREE.Vector3(x, roofH(x, front) - 0.05, front), b = new THREE.Vector3(x + px * 0.45, 0, front + 1.1);
        var len = a.distanceTo(b), ropeM = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, len, 5), this.rope);
        ropeM.position.copy(a).add(b).multiplyScalar(0.5); ropeM.lookAt(b); ropeM.rotateX(Math.PI / 2); T.add(ropeM);
        var peg = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.008, 0.12, 6), this.woodDark); peg.position.set(b.x, 0.04, b.z); T.add(peg);
      }
    }
    // inside: rugs of Sadu strips on the floor, cushions along the back
    var rugA = rugTexture([
      { edge: 'teeth', center: 'tree', ground: 'red', figure: 'white' },
      { edge: 'grains', center: 'chain', ground: 'black', figure: 'white' },
      { edge: 'teeth', center: 'camels', ground: 'brown', figure: 'white' },
      { edge: 'stripes', center: 'tree', ground: 'black', figure: 'orange' }
    ], 120);
    var rug = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 1.7), new THREE.MeshStandardMaterial({ map: rugA, roughness: 1 }));
    rug.rotation.x = -Math.PI / 2; rug.rotation.z = Math.PI / 2; rug.position.set(CX - 0.9, 0.012, CZ + 0.1); rug.receiveShadow = true; T.add(rug);
    var rugB = rugTexture([
      { edge: 'grains', center: 'camels', ground: 'beige', figure: 'black' },
      { edge: 'teeth', center: 'chain', ground: 'red', figure: 'white' },
      { edge: 'grains', center: 'tree', ground: 'black', figure: 'white' }
    ], 110);
    var rug2 = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 1.3), new THREE.MeshStandardMaterial({ map: rugB, roughness: 1 }));
    rug2.rotation.x = -Math.PI / 2; rug2.rotation.z = Math.PI / 2; rug2.position.set(CX + 1.4, 0.013, CZ - 0.2); rug2.receiveShadow = true; T.add(rug2);
    var cushT = rugTexture([{ edge: 'teeth', center: 'chain', ground: 'red', figure: 'white' }, { edge: 'teeth', center: 'tree', ground: 'black', figure: 'white' }], 60);
    var cushM = new THREE.MeshStandardMaterial({ map: cushT, roughness: 1 });
    for (var c = 0; c < 6; c++) {
      var cu = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.34, 0.22), cushM);
      cu.position.set(CX - 2.2 + c * 0.88, 0.17, back + 0.3); cu.rotation.x = -0.12; cu.castShadow = true; cu.receiveShadow = true; T.add(cu);
    }
    // a Sadu band hung across the front of the tent (the one you weave in the game ends up here)
    this.hangC = canvas(30 * 8, COLS * 6);
    this.hangT = new THREE.CanvasTexture(this.hangC); this.hangT.colorSpace = THREE.SRGBColorSpace; this.hangT.anisotropy = 8;
    var hang = this.hang = new THREE.Mesh(new THREE.PlaneGeometry(2.5, 0.3), new THREE.MeshStandardMaterial({ map: this.hangT, roughness: 1, side: THREE.DoubleSide }));
    hang.position.set(CX + 0.2, roofH(CX + 0.2, front) - 0.2, front + 0.02); hang.castShadow = true;
    T.add(hang);
    this.setHanging({ edge: 'grains', center: 'camels', ground: 'red', figure: 'white' });
  }
  setHanging(spec) {
    var c = bandCanvas(spec, 200, { cw: 6, ch: 8, dir: 'h' });
    this.hangC.width = c.width; this.hangC.height = c.height;
    this.hangC.getContext('2d').drawImage(c, 0, 0);
    this.hangT.needsUpdate = true;
  }

  // ── the coffee hearth by the door ──
  buildHearth() {
    var E = this.env3d, H = this.hearth = new THREE.Group(); E.add(H);
    H.position.set(1.55, 0, -1.25);
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
      var fl = new THREE.Mesh(new THREE.PlaneGeometry(0.16, 0.32), new THREE.MeshBasicMaterial({ map: ft, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, fog: false }));
      fl.position.set((f - 1) * 0.05, 0.15, (f - 1) * 0.02); fl.rotation.y = f * 1.05; H.add(fl); this.flames.push(fl);
    }
    var light = this.fire = new THREE.PointLight(0xFF8A3C, 3.2, 6, 1.6);
    light.position.set(0, 0.35, 0); H.add(light);
    // the dallah and two finjans by the fire
    var dallah = new THREE.Mesh(lathe([[0, 0], [0.06, 0.004], [0.065, 0.03], [0.05, 0.08], [0.028, 0.12], [0.03, 0.15], [0.042, 0.17], [0.012, 0.2], [0.004, 0.24], [0, 0.245]], 24), this.brass);
    dallah.position.set(0.32, 0, 0.12); dallah.castShadow = true; H.add(dallah);
    var spout = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.013, 0.12, 8), this.brass);
    spout.position.set(0.37, 0.13, 0.12); spout.rotation.z = -0.9; H.add(spout);
    var cupM = new THREE.MeshStandardMaterial({ color: 0xF2EDE4, roughness: 0.4 });
    [[0.38, 0.28], [0.44, 0.22]].forEach(function (p) { var cup = new THREE.Mesh(lathe([[0, 0], [0.016, 0.002], [0.022, 0.03], [0.021, 0.032]], 16), cupM); cup.position.set(p[0], 0, p[1]); H.add(cup); });
    // embers rising
    var n = this.fast ? 14 : 34, ep = new Float32Array(n * 3);
    for (var k = 0; k < n; k++) { ep[k * 3] = (rnd() - 0.5) * 0.2; ep[k * 3 + 1] = rnd() * 1.2; ep[k * 3 + 2] = (rnd() - 0.5) * 0.2; }
    var eg = new THREE.BufferGeometry(); eg.setAttribute('position', new THREE.BufferAttribute(ep, 3));
    this.sparks = new THREE.Points(eg, new THREE.PointsMaterial({ color: 0xFFB060, size: 0.018, transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }));
    H.add(this.sparks);
  }

  // ── the dusk sky ──
  buildSky() {
    var E = this.env3d;
    var sunDir = new THREE.Vector3(-0.9, 0.05, 0.35).normalize();
    var sky = new THREE.Mesh(new THREE.SphereGeometry(40, 32, 16), new THREE.ShaderMaterial({
      side: THREE.BackSide, depthWrite: false, fog: false,
      uniforms: { uSun: { value: sunDir } },
      vertexShader: 'varying vec3 vDir; void main(){ vDir = normalize(position); vec4 p = modelViewMatrix * vec4(position, 1.0); gl_Position = projectionMatrix * p; }',
      fragmentShader: [
        'uniform vec3 uSun; varying vec3 vDir;',
        'void main(){',
        '  float h = vDir.y;',
        '  vec3 top = vec3(0.035, 0.035, 0.11), mid = vec3(0.17, 0.10, 0.25), low = vec3(0.78, 0.43, 0.30), dusk = vec3(0.45, 0.24, 0.32);',
        '  vec3 c = mix(low, dusk, smoothstep(0.0, 0.1, h));',
        '  c = mix(c, mid, smoothstep(0.08, 0.3, h));',
        '  c = mix(c, top, smoothstep(0.25, 0.85, h));',
        '  float s = max(dot(normalize(vDir), uSun), 0.0);',
        '  c += vec3(1.0, 0.62, 0.36) * pow(s, 6.0) * 0.6 * (1.0 - smoothstep(0.0, 0.4, h));',
        '  c = mix(c, vec3(0.13, 0.09, 0.09), smoothstep(0.0, -0.06, h));',
        '  gl_FragColor = vec4(c, 1.0);',
        '}'
      ].join('\n')
    }));
    E.add(sky); this.sky = sky;
    // stars
    var rnd = mulberry32(5), n = this.fast ? 220 : 600, sp = new Float32Array(n * 3);
    for (var i = 0; i < n; i++) {
      var y = 0.18 + rnd() * 0.82, a = rnd() * Math.PI * 2, r = Math.sqrt(1 - y * y);
      sp[i * 3] = Math.cos(a) * r * 36; sp[i * 3 + 1] = y * 36; sp[i * 3 + 2] = Math.sin(a) * r * 36;
    }
    var sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.BufferAttribute(sp, 3));
    this.stars = new THREE.Points(sg, new THREE.PointsMaterial({ color: 0xFFF4DC, size: 0.09, transparent: true, opacity: 0.85, depthWrite: false, fog: false }));
    E.add(this.stars);
    var moon = new THREE.Sprite(new THREE.SpriteMaterial({ map: moonTexture(), depthWrite: false, fog: false }));
    moon.position.set(14, 15, -24); moon.scale.setScalar(5); E.add(moon);
  }

  // ── AR reticle: the loom's footprint on the floor ──
  buildReticle() {
    var g = new THREE.Group();
    var m = new THREE.MeshBasicMaterial({ color: 0xFFD27A, transparent: true, opacity: 0.9, depthTest: false });
    var ring = new THREE.Mesh(new THREE.RingGeometry(0.1, 0.12, 40), m); ring.rotation.x = -Math.PI / 2; g.add(ring);
    var edge = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.PlaneGeometry(1.5, 2.6)), new THREE.LineBasicMaterial({ color: 0xFFD27A, transparent: true, opacity: 0.5, depthTest: false }));
    edge.rotation.x = -Math.PI / 2; edge.position.z = 0.1; g.add(edge);
    g.visible = false; g.renderOrder = 10;
    this.reticle = g; this.scene.add(g);
  }

  // ── camera ──
  view(name, o) {
    o = o || {};
    var r = this.rig;
    r.drift = 0; r.k = o.k || 2; r.mode = name;
    // these follow the fell as the band grows
    r.follow = name === 'weave' || name === 'pick' || name === 'race';
    this.aim(name);
    if (o.snap) { r.pos.copy(r.tpos); r.look.copy(r.tlook); }
  }
  aim(name) {
    var r = this.rig;
    var at = function (x, y, z, lx, ly, lz) { r.tpos.set(x, y, z); r.tlook.set(lx, ly, lz); };
    var fz = this.fellZ();
    if (name === 'cover') { at(1.3, 0.78, 1.95, -0.5, 0.62, -1.5); r.drift = 1; }
    else if (name === 'house') at(1.5, 1.0, 0.4, -0.7, 0.8, -3.0);
    else if (name === 'fibers') at(1.02, 0.42, 1.0, 0.56, 0.04, 0.48);
    else if (name === 'colors') at(-0.2, 0.72, 1.85, -0.9, 0.32, 0.6);
    else if (name === 'patterns') at(0.34, 0.52, 1.35, 0, 0.04, 0.5);
    else if (name === 'heritage') { at(-2.5, 1.55, 2.7, -0.2, 0.7, -1.7); r.drift = 1; }
    else if (name === 'clean') at(0.74, 0.36, 0.84, 0.5, 0.05, 0.5);
    else if (name === 'card') at(0.6, 0.4, 1.16, 0.38, 0.03, 0.74);
    else if (name === 'spin') at(0.8, 0.7, 1.66, 0.42, 0.37, 0.9);
    else if (name === 'dye') at(-0.07, 0.98, 2.14, -0.78, 0.32, 0.86);
    else if (name === 'stakes') at(0.1, 2.2, 2.64, 0, 0, -0.26);
    else if (name === 'warp') at(0.0, 2.45, 3.0, 0, 0, -0.04);
    else if (name === 'weave') at(0.0, 0.66, fz + 0.4, 0, 0.05, fz - 0.14);
    else if (name === 'pick') at(0.0, 0.62, fz + 0.36, 0, 0.04, fz - 0.16);
    else if (name === 'race') at(0.05, 0.74, fz + 0.5, 0, 0.04, fz - 0.2);
    else if (name === 'loom') at(0.0, 1.3, 1.45, 0, 0.0, 0.1);
    else if (name === 'tent') at(0.7, 1.15, 1.2, -0.25, 1.05, this.tentFront);
  }
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
  // screen pixels -> the point on a level plane (height h, field-local) under the finger
  planeAt(x, y, h) {
    var r = this.screenRect(), rc = this._rc || (this._rc = new THREE.Raycaster());
    rc.setFromCamera(new THREE.Vector2((x - r.left) / r.width * 2 - 1, -((y - r.top) / r.height * 2 - 1)), this.activeCam());
    var ray = rc.ray.clone().applyMatrix4(new THREE.Matrix4().copy(this.field.matrixWorld).invert());
    var out = new THREE.Vector3();
    return ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0, 1, 0), -h), out) ? out : null;
  }
  updateRig(dt) {
    var r = this.rig;
    if (r.follow) this.aim(r.mode);
    var a = 1 - Math.exp(-dt * r.k);
    r.pos.lerp(r.tpos, a); r.look.lerp(r.tlook, a);
    var pos = r.pos.clone();
    if (r.drift) {
      var ang = Math.sin(this.clock * 0.1) * 0.14, c = Math.cos(ang), s = Math.sin(ang);
      var dx = pos.x - r.look.x, dz = pos.z - r.look.z;
      pos.x = r.look.x + dx * c - dz * s; pos.z = r.look.z + dx * s + dz * c;
    }
    if (this.orbit.yaw || this.orbit.pitch) {
      var off = pos.clone().sub(r.look), sph = new THREE.Spherical().setFromVector3(off);
      sph.theta += this.orbit.yaw; sph.phi = Math.max(0.2, Math.min(1.5, sph.phi + this.orbit.pitch));
      pos.copy(r.look).add(new THREE.Vector3().setFromSpherical(sph));
      if (!this.orbit.on) { this.orbit.yaw *= Math.exp(-dt * 1.5); this.orbit.pitch *= Math.exp(-dt * 1.5); }
    }
    this.camera.position.copy(pos);
    this.camera.lookAt(r.look);
  }

  // ── small tweens ──
  animate(dur, fn, done, delay) {
    this.anims.push({ t: -(delay || 0), dur: dur, fn: fn, done: done });
  }
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
    this.hemi.intensity = 1.1;
    var viewer = await session.requestReferenceSpace('viewer');
    this.hitSource = await session.requestHitTestSource({ space: viewer });
    session.addEventListener('end', function () { self.onXREnd(); });
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
    this.scene.fog = new THREE.Fog(0x6E4250, 10, 38);
    this.scene.environment = this.envMap;
    this.hemi.intensity = 0.75;
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

  // AR Quick Look on iPhone: the loom as it is right now, in your room
  async quickLook() {
    var mod = this._usdzMod || await import('three/addons/exporters/USDZExporter.js');
    var self = this, swaps = [];
    // see-through warp doesn't carry over, so export the band on a dark backing
    var c = canvas(this.bandC.width, this.bandC.height), g = c.getContext('2d');
    g.fillStyle = '#5A4632'; g.fillRect(0, 0, c.width, c.height); g.drawImage(this.bandC, 0, 0);
    var t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.flipY = false;
    var bm = new THREE.MeshStandardMaterial({ map: t, roughness: 1 });
    swaps.push([this.band, this.band.material]); this.band.material = bm;
    var saved = { p: this.field.position.clone(), r: this.field.rotation.clone(), s: this.field.scale.clone() };
    this.field.position.set(0, 0, 0); this.field.rotation.set(0, 0, 0); this.field.scale.setScalar(1);
    var sun = this.sun; this.field.remove(sun); this.field.remove(sun.target);
    this.field.updateMatrixWorld(true);
    var data;
    try { data = await new mod.USDZExporter().parse(this.field, { quickLookCompatible: true }); }
    finally {
      swaps.forEach(function (s) { s[0].material = s[1]; });
      this.field.add(sun); this.field.add(sun.target);
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
    var now = performance.now(), dt = Math.min(window.CL_SD_DTMAX || 0.05, (now - this.last) / 1000);
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
    // the hearth flickers
    var fl = 0.82 + 0.12 * Math.sin(this.clock * 13.3) + 0.08 * Math.sin(this.clock * 7.1 + 1.3) + 0.05 * Math.sin(this.clock * 23);
    this.fire.intensity = 3.2 * fl;
    for (var i = 0; i < this.flames.length; i++) {
      var f = this.flames[i];
      f.scale.set(0.9 + 0.15 * Math.sin(this.clock * (9 + i) + i), 0.85 + 0.25 * Math.sin(this.clock * (11 + i * 2) + i * 2), 1);
      if (!this.renderer.xr.isPresenting) f.lookAt(this.camera.position.x, f.getWorldPosition(new THREE.Vector3()).y, this.camera.position.z);
    }
    if (this.sparks && this.env3d.visible) {
      var ap = this.sparks.geometry.attributes.position, arr = ap.array;
      for (var k = 0; k < arr.length; k += 3) {
        arr[k + 1] += dt * (0.25 + (k % 7) * 0.04);
        arr[k] += Math.sin(this.clock * 2 + k) * dt * 0.05;
        if (arr[k + 1] > 1.3) { arr[k + 1] = 0.05; arr[k] = (Math.random() - 0.5) * 0.15; arr[k + 2] = (Math.random() - 0.5) * 0.15; }
      }
      ap.needsUpdate = true;
    }
    if (this.stars) this.stars.material.opacity = 0.78 + 0.08 * Math.sin(this.clock * 1.7);
    // the hanging spindle turns as fast as it was rolled, and its whorl blurs
    if (this.spindleMode === 'hang') {
      this.spindle.rotation.y += dt * this.spinSpeed;
      this.whorlBlur.material.opacity = Math.min(0.55, this.spinSpeed / 40);
      var a0 = this.spindle.position.clone().add(new THREE.Vector3(0, 0.155, 0)), b0 = this.handPt;
      this.thread.position.copy(a0).add(b0).multiplyScalar(0.5);
      this.thread.scale.y = a0.distanceTo(b0);
      this.thread.lookAt(this.field.localToWorld(b0.clone())); this.thread.rotateX(Math.PI / 2);
    }
    // keep the phone cool: if frames are slow, draw fewer pixels
    if (!this.renderer.xr.isPresenting && !window.CL_SD_DPR) {
      this.ft = (this.ft || 0.016) * 0.95 + dt * 0.05;
      if (this.clock > 3 && this.ft > 0.045 && this.renderer.getPixelRatio() > 1 && this.clock - (this.lastDrop || 0) > 2) {
        this.renderer.setPixelRatio(Math.max(1, this.renderer.getPixelRatio() - 0.5)); this.resize(); this.lastDrop = this.clock;
      }
    }
    if (!this.renderer.xr.isPresenting) this.updateRig(dt);
    this.emit('frame', dt);
    this.renderer.render(this.scene, this.camera);
  }
}
