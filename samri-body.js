/**
 * samri-body.js: the Samri teacher's eyes. The front camera and a pose model running on the phone (MediaPipe Pose
 * Landmarker, the same one the Samri coach used; no video leaves the phone) follow the learner's head, shoulders and
 * hands about 30 times a second. Every reading is kept with the drum clock's time, so the teacher can tell when the
 * learner leaned right or left, lifted or lowered the tar, struck it, or slapped it down, against the beat.
 *   const body = createBody({ video, canvas, clock: () => music.time(), sim })
 *   await body.start()          -> true, or 'camera' / 'model' (what failed)
 *   body.now()                  -> the latest reading: { seen, hands, standing, lean, h }
 *   body.calibrate()            -> takes the learner's upright, resting pose as zero
 *   body.samples(t0, t1)        -> the readings between two drum-clock times
 *   body.stop()
 * A reading: t (drum clock, the camera's delay taken off), lean (shoulder widths; + toward the learner's own right),
 * h (how high the hands are: shoulder widths above the shoulders, so about -0.7 holding the tar at the chest and
 * above 0 lifted), seen (head and shoulders in view), stand (true standing, false kneeling, null when the knees
 * are out of view).
 * With sim, nothing is filmed: a simulated learner follows body.simPlan(...), for testing.
 */
const MP = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14';
const MODEL = 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task';
const CAM_LAG = 0.1;            // seconds between a move and the reading that shows it (capture and the model)
const KEEP = 90;                // seconds of readings kept

let mp = null, files = null, landmarker = null, delegate = 'GPU', loading = null;
const opts = (d) => ({ baseOptions: { modelAssetPath: MODEL, delegate: d }, runningMode: 'VIDEO', numPoses: 1 });
// fetched once, as soon as the teacher opens, so the camera is ready when the learner is
export function prepare() {
  if (landmarker) return Promise.resolve();
  if (loading) return loading;
  loading = (async () => {
    mp = await import(MP + '/vision_bundle.mjs');
    files = await mp.FilesetResolver.forVisionTasks(MP + '/wasm');
    try { landmarker = await mp.PoseLandmarker.createFromOptions(files, opts('GPU')); delegate = 'GPU'; }
    catch (e) { landmarker = await mp.PoseLandmarker.createFromOptions(files, opts('CPU')); delegate = 'CPU'; }
  })();
  loading.catch(() => { loading = null; });
  return loading;
}
async function toCPU() {
  if (delegate === 'CPU' || !mp) return;
  try { const old = landmarker; landmarker = await mp.PoseLandmarker.createFromOptions(files, opts('CPU')); delegate = 'CPU'; try { old && old.close(); } catch (e) {} } catch (e) {}
}

const vis = (p, t) => { if (!p) return false; const v = p.v != null ? p.v : p.visibility; return v == null || v > (t || 0.5); };

// ── reading the body from the 33 landmarks (pure, so it can be tested) ──
export function readPose(lm, W, H) {
  if (!lm) return { seen: false };
  const P = (i) => (lm[i] ? { x: lm[i].x * W, y: lm[i].y * H, v: lm[i].visibility } : null);
  const n = P(0), ls = P(11), rs = P(12), lw = P(15), rw = P(16);
  if (!vis(ls) || !vis(rs)) return { seen: false };
  const w = Math.hypot(rs.x - ls.x, rs.y - ls.y); if (w < 12) return { seen: false };
  const ux = (rs.x - ls.x) / w, uy = (rs.y - ls.y) / w, mx = (ls.x + rs.x) / 2, my = (ls.y + rs.y) / 2;
  // + when the learner leans toward their own right: the head goes toward the right shoulder, and that shoulder drops
  const head = vis(n) ? ((n.x - mx) * ux + (n.y - my) * uy) / w : 0;
  const lean = 0.6 * head + 0.9 * (rs.y - ls.y) / w;
  // the hands: how high above the shoulders, in shoulder widths (whichever wrists are in view)
  const ws = [lw, rw].filter((p) => vis(p, 0.3));
  const h = ws.length ? (my - ws.reduce((a, p) => a + p.y, 0) / ws.length) / w : null;
  // standing or kneeling, when the hips and knees are in view: standing puts the knees far below the hips
  const lh = P(23), rh = P(24), lk = P(25), rk = P(26), on = (p) => p && p.v > 0.65 && p.y < H * 0.98;
  const stand = on(lh) && on(rh) && on(lk) && on(rk) ? ((lk.y - lh.y) + (rk.y - rh.y)) / 2 / w > 0.85 : null;
  return { seen: true, lean, h, hands: ws.length, stand, pts: { n, ls, rs, lw, rw, le: P(13), re: P(14) } };
}

export function createBody({ video, canvas, clock, sim }) {
  const ctx = canvas.getContext('2d');
  const B = { base: 0, h0: -0.7, list: [], last: null, raf: 0, on: false, lastVT: -1, lastDet: 0, stamp: 0, errs: 0, sm: 0, plan: [], standN: 0, standing: false };

  const read = readPose;
  // standing or kneeling, smoothed, so one bad frame does not flip it
  function posture(r) {
    if (!r.seen || r.stand == null) B.standN = Math.max(0, B.standN - 1);
    else if (r.stand) B.standN = Math.min(30, B.standN + 1);
    else B.standN = Math.max(0, B.standN - 2);
    if (!B.standing && B.standN >= 15) B.standing = true; else if (B.standing && B.standN === 0) B.standing = false;
    return B.standing;
  }

  // ── what the learner sees: themselves, with the points the teacher follows ──
  function draw(r) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (!r || !r.seen || !r.pts) return;
    const p = r.pts, line = (a, b) => { if (vis(a, 0.3) && vis(b, 0.3)) { ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); } };
    const s = Math.max(2, canvas.width / 160);
    ctx.lineWidth = s; ctx.lineCap = 'round'; ctx.strokeStyle = 'rgba(227,196,122,.85)';
    line(p.ls, p.rs); line(p.ls, p.le); line(p.le, p.lw); line(p.rs, p.re); line(p.re, p.rw);
    if (vis(p.n)) line({ x: (p.ls.x + p.rs.x) / 2, y: (p.ls.y + p.rs.y) / 2, v: 1 }, p.n);
    ctx.fillStyle = '#E3C47A';
    [p.n, p.lw, p.rw].forEach((q) => { if (vis(q, 0.3)) { ctx.beginPath(); ctx.arc(q.x, q.y, s * 2.4, 0, Math.PI * 2); ctx.fill(); } });
  }

  // ── a simulated learner: follows the plan a little late, sometimes on the wrong side first ──
  function simRead(t) {
    let lean = 0, h = B.h0;
    for (const e of B.plan) {
      const at = e.due + e.lag;
      if (t < at) break;
      const k = Math.min(1, (t - at) / 0.18);     // the body takes a moment to get there
      if (e.k === 'sway') lean = lean + ((e.side === 'R' ? 0.32 : -0.32) - lean) * k;
      else if (e.k === 'up') h = h + (0.7 - h) * k;
      else if (e.k === 'down') h = h + (B.h0 - h) * k;
      else if (e.k === 'khallu') h = h + (-2.1 - h) * k;
      else if (e.k === 'strike' && t - at < 0.12) h = B.h0 - 0.35 * Math.sin(Math.PI * (t - at) / 0.12);
    }
    return { seen: true, lean: lean + B.base + (Math.random() - 0.5) * 0.01, h, hands: 2, stand: false };
  }

  function tick() {
    B.raf = requestAnimationFrame(tick);
    let r = null;
    const t = clock() - (sim ? 0 : CAM_LAG);
    if (sim) r = simRead(t);
    else {
      const now = performance.now();
      if (!landmarker || video.readyState < 2 || video.currentTime === B.lastVT || now - B.lastDet < 30) return;
      B.lastVT = video.currentTime; B.lastDet = now;
      try {
        const stamp = Math.max(now, B.stamp + 1); B.stamp = stamp;   // the model needs rising timestamps
        const res = landmarker.detectForVideo(video, stamp);
        const W = video.videoWidth || canvas.width, H = video.videoHeight || canvas.height;
        if (canvas.width !== W || canvas.height !== H) { canvas.width = W; canvas.height = H; }
        r = read(res && res.landmarks && res.landmarks[0], W, H); B.errs = 0;
      } catch (e) { if (++B.errs > 3) { B.errs = 0; toCPU(); } return; }
      draw(r);
    }
    const standing = posture(r);
    const lean = r.seen ? r.lean - B.base : null;
    if (lean != null) B.sm += (lean - B.sm) * 0.45;           // smoothed: one shaky frame does not count as a lean
    const s = { t, seen: r.seen, lean: r.seen ? B.sm : null, h: r.seen ? r.h : null, hands: r.hands || 0, stand: r.stand == null ? null : standing };
    B.last = s; B.list.push(s);
    while (B.list.length && B.list[0].t < t - KEEP) B.list.shift();
  }

  const api = {
    sim: !!sim,
    async start() {
      if (B.on) return true;
      if (!sim) {
        try {
          const st = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 }, frameRate: { ideal: 30, max: 30 } }, audio: false });
          video.srcObject = st; video.muted = true; video.setAttribute('playsinline', ''); await video.play();
        } catch (e) { console.warn('samri-body camera', e); return 'camera'; }
        try {
          let to; const slow = new Promise((_, rej) => { to = setTimeout(() => rej(new Error('timeout')), 30000); });
          await Promise.race([prepare(), slow]).finally(() => clearTimeout(to));
        } catch (e) { console.warn('samri-body model', e); api.stop(); return 'model'; }
      }
      B.on = true; cancelAnimationFrame(B.raf); B.raf = requestAnimationFrame(tick);
      return true;
    },
    stop() {
      B.on = false; cancelAnimationFrame(B.raf);
      try { video.srcObject && video.srcObject.getTracks().forEach((t) => t.stop()); } catch (e) {}
      video.srcObject = null; ctx.clearRect(0, 0, canvas.width, canvas.height);
    },
    get on() { return B.on; },
    now() { return B.last ? { ...B.last, standing: B.standing } : { seen: false }; },
    // the learner's upright, resting pose (holding the tar) becomes zero for the lean, and the hands' resting height
    calibrate(sec, leanOnly) {
      const t1 = clock(), xs = B.list.filter((s) => s.t >= t1 - (sec || 1.2) && s.seen);
      if (xs.length < 5) return false;
      const med = (a) => { a = a.slice().sort((x, y) => x - y); return a[Math.floor(a.length / 2)]; };
      const raw = xs.map((s) => s.lean + B.base);
      B.base = med(raw); B.sm = 0;
      const hs = xs.filter((s) => s.h != null).map((s) => s.h);
      if (!leanOnly && hs.length > 4) B.h0 = Math.max(-2.2, Math.min(-0.2, med(hs)));
      return true;
    },
    get h0() { return B.h0; },
    samples(t0, t1) { return B.list.filter((s) => s.t >= t0 && s.t <= t1); },
    // for testing: what the simulated learner will do (drum-clock times), each a little late, with some faults
    simPlan(list) { B.plan = list.map((e) => ({ ...e, lag: e.lag != null ? e.lag : 0.05 + Math.random() * 0.12 })).sort((a, b) => a.due + a.lag - (b.due + b.lag)); },
  };
  return api;
}
