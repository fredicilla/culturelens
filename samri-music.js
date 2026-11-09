/**
 * samri-music.js — the sound of the Samri, made in code (no recordings): frame drums,
 * hand claps, the slap of the drums thrown down together, and hummed lines for the two rows.
 *
 * A small scheduler plays the beat on the audio clock. Everything that moves or is judged
 * (the dancers, the cues, the notes of the game) reads its time from here, so what you see,
 * what you hear and what you are scored against stay together.
 *
 * The two styles are a simple slow, heavy pulse and a fast, light one (the booklet of the
 * Royal Institute of Traditional Arts splits Samri into heavy and light). They are not a
 * transcription of a particular Samri rhythm or melody.
 */
export const STYLES = {
  heavy: { bpm: 66, steps: [[0, 'dum', 1], [2, 'tak', 0.75], [4, 'dum', 0.85], [5, 'dum', 0.45], [6, 'tak', 0.75]] },
  light: { bpm: 108, steps: [[0, 'dum', 1], [2, 'tak', 0.75], [3, 'tak', 0.4], [4, 'dum', 0.85], [6, 'tak', 0.75], [7, 'tak', 0.4]] }
};
// two short lines for the rows to hum (midi notes): [beat, note, beats]
export const LINES = {
  call: [[0, 50, 1], [1, 53, 0.5], [1.5, 55, 0.5], [2, 57, 1.2], [3.2, 55, 0.4], [3.6, 53, 0.4]],
  answer: [[0, 57, 1], [1, 55, 0.5], [1.5, 53, 0.5], [2, 52, 0.9], [2.9, 50, 1.1]],
  waneen: [[0, 50, 1.6], [1.6, 52, 0.4], [2, 53, 0.6], [2.6, 52, 0.4], [3, 50, 1]]
};

function mtof(m) { return 440 * Math.pow(2, (m - 69) / 12); }

export class Music {
  constructor() {
    this.ctx = null; this.muted = false;
    this.segs = [{ t0: 0, b0: 0, bpm: 66, style: 'heavy' }];
    this.playing = false; this.drums = true; this.claps = false; this.drumVol = 1;
    this.step = 0; this.timer = 0;
    this.t0perf = performance.now() / 1000;
  }
  // the audio clock only runs after a tap on the page; call this from a tap
  ensure() {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return this.ctx; }
    var C = window.AudioContext || window.webkitAudioContext; if (!C) return null;
    var ctx = this.ctx = new C();
    this.master = ctx.createGain(); this.master.gain.value = this.muted ? 0 : 0.9;
    var comp = ctx.createDynamicsCompressor(); comp.threshold.value = -16; comp.ratio.value = 3; comp.attack.value = 0.004; comp.release.value = 0.2;
    this.master.connect(comp); comp.connect(ctx.destination);
    // the open night air: a short made-up reverb
    this.verb = ctx.createConvolver(); this.verb.buffer = this.impulse(1.8, 2.6);
    var wet = ctx.createGain(); wet.gain.value = 0.2; this.verb.connect(wet); wet.connect(this.master);
    this.noiseB = this.makeNoise(1.5);
    return ctx;
  }
  setMuted(m) {
    this.muted = m;
    if (this.master) this.master.gain.setTargetAtTime(m ? 0 : 0.9, this.ctx.currentTime, 0.05);
  }
  ready() { return !!(this.ctx && this.ctx.state === 'running'); }
  time() { return this.ctx ? this.ctx.currentTime : performance.now() / 1000 - this.t0perf; }
  // how late sound reaches the ear, plus a little for the finger
  latency() { var c = this.ctx; return (c ? (c.outputLatency || c.baseLatency || 0) : 0) + 0.02; }
  impulse(secs, decay) {
    var c = this.ctx, n = Math.floor(c.sampleRate * secs), b = c.createBuffer(2, n, c.sampleRate);
    for (var ch = 0; ch < 2; ch++) { var d = b.getChannelData(ch); for (var i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, decay); }
    return b;
  }
  makeNoise(secs) {
    var c = this.ctx, b = c.createBuffer(1, Math.floor(c.sampleRate * secs), c.sampleRate), d = b.getChannelData(0);
    for (var i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    return b;
  }
  out(node, wet) { node.connect(this.master); if (wet !== false) node.connect(this.verb); }
  env(t, peak, attack, decay) {
    var g = this.ctx.createGain();
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), t + attack); g.gain.exponentialRampToValueAtTime(0.0001, t + attack + decay);
    return g;
  }
  burst(t, dur, vol, type, freq, q, wet) {
    var c = this.ctx, s = c.createBufferSource(); s.buffer = this.noiseB;
    var f = c.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q || 1;
    var g = this.env(t, vol, 0.002, dur);
    s.connect(f); f.connect(g); this.out(g, wet);
    s.start(t, Math.random() * 0.5); s.stop(t + dur + 0.05);
  }
  tone(t, f0, f1, dur, vol, type, wet) {
    var c = this.ctx, o = c.createOscillator(); o.type = type || 'sine';
    o.frequency.setValueAtTime(f0, t); if (f1) o.frequency.exponentialRampToValueAtTime(f1, t + dur * 0.6);
    var g = this.env(t, vol, 0.003, dur);
    o.connect(g); this.out(g, wet); o.start(t); o.stop(t + dur + 0.05);
  }

  // ── the instruments ──
  // the deep stroke in the middle of the skin; tension 0..1 makes it higher and shorter
  dum(t, v, tension) {
    if (!this.ctx) return;
    v = v == null ? 1 : v; var k = 1 + (tension || 0) * 1.1;
    this.tone(t, 112 * k, 64 * k, 0.5 / (1 + (tension || 0) * 1.4), 0.8 * v);
    this.tone(t, 228 * k, 150 * k, 0.16, 0.2 * v, 'triangle');
    this.burst(t, 0.045, 0.25 * v, 'lowpass', 900, 0.7);
  }
  // the sharp stroke near the rim
  tak(t, v) {
    if (!this.ctx) return;
    v = v == null ? 1 : v;
    this.burst(t, 0.07, 0.5 * v, 'bandpass', 2700, 1.3);
    this.tone(t, 540, 400, 0.09, 0.2 * v, 'sine');
  }
  // a row clapping: a few hands, not quite together
  clap(t, v) {
    if (!this.ctx) return;
    v = v == null ? 1 : v;
    for (var i = 0; i < 4; i++) this.burst(t + Math.random() * 0.022, 0.05, 0.3 * v, 'bandpass', 1300 + Math.random() * 500, 0.9);
  }
  // eighteen drums thrown down on the rug at once
  slap(t, v) {
    if (!this.ctx) return;
    v = v == null ? 1 : v;
    for (var i = 0; i < 6; i++) this.burst(t + Math.random() * 0.03, 0.2, 0.42 * v, 'bandpass', 900 + Math.random() * 1600, 0.7);
    this.tone(t, 95, 40, 0.35, 0.9 * v);
    this.burst(t, 0.06, 0.6 * v, 'highpass', 3000, 0.7);
  }
  // a row humming a line: a few low voices on an "aa" vowel, sliding between notes
  sing(t, line, secPerBeat, o) {
    o = o || {};
    if (!this.ctx) return { stop: function () {} };
    var c = this.ctx, nodes = [], voices = o.voices || 3, vol = (o.vol || 0.07) / Math.sqrt(voices), shift = o.shift || 0;
    var end = 0; line.forEach(function (n) { end = Math.max(end, n[0] + n[2]); });
    var T = end * secPerBeat;
    var bus = c.createGain(); bus.gain.setValueAtTime(0.0001, t); bus.gain.exponentialRampToValueAtTime(1, t + 0.12); bus.gain.setValueAtTime(1, t + T - 0.2); bus.gain.exponentialRampToValueAtTime(0.0001, t + T + 0.15);
    // formants of a man's "aa"
    var mix = c.createGain(); mix.gain.value = 1;
    [[730, 7, 1], [1090, 8, 0.6], [2440, 10, 0.25]].forEach(function (fm) {
      var bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = fm[0]; bp.Q.value = fm[1];
      var gg = c.createGain(); gg.gain.value = fm[2] * 3; bp.connect(gg); gg.connect(bus); mix.connect(bp);
    });
    var lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 600; var lpg = c.createGain(); lpg.gain.value = 0.5; mix.connect(lp); lp.connect(lpg); lpg.connect(bus);
    this.out(bus);
    for (var v = 0; v < voices; v++) {
      var osc = c.createOscillator(); osc.type = 'sawtooth';
      var det = (v - (voices - 1) / 2) * 7 + (Math.random() - 0.5) * 4;
      osc.detune.value = det;
      var lag = v * 0.025, pf = 0;
      line.forEach(function (n, k) {
        var at = t + n[0] * secPerBeat + lag, f = mtof(n[1] + shift);
        if (k === 0) osc.frequency.setValueAtTime(f, at);
        else { osc.frequency.setValueAtTime(pf, at - 0.001); osc.frequency.linearRampToValueAtTime(f, at + 0.07); }
        pf = f;
      });
      var lfo = c.createOscillator(), lg = c.createGain(); lfo.frequency.value = 5 + Math.random(); lg.gain.value = 3.5;
      lfo.connect(lg); lg.connect(osc.frequency);
      var g = c.createGain(); g.gain.value = vol; osc.connect(g); g.connect(mix);
      osc.start(t); lfo.start(t); osc.stop(t + T + 0.3); lfo.stop(t + T + 0.3);
      nodes.push(osc, lfo);
    }
    return {
      end: t + T,
      stop: function (at) {
        at = Math.max(at || c.currentTime, c.currentTime);
        try { bus.gain.cancelScheduledValues(at); bus.gain.setValueAtTime(bus.gain.value || 0.5, at); bus.gain.exponentialRampToValueAtTime(0.0001, at + 0.12); } catch (e) {}
        nodes.forEach(function (n) { try { n.stop(at + 0.2); } catch (e) {} });
      }
    };
  }

  // ── the beat ──
  segAtTime(t) { var s = this.segs[0]; for (var i = 1; i < this.segs.length; i++) if (this.segs[i].t0 <= t) s = this.segs[i]; return s; }
  segAtBeat(b) { var s = this.segs[0]; for (var i = 1; i < this.segs.length; i++) if (this.segs[i].b0 <= b) s = this.segs[i]; return s; }
  beatAt(t) { var s = this.segAtTime(t); return s.b0 + (t - s.t0) * s.bpm / 60; }
  timeOf(b) { var s = this.segAtBeat(b); return s.t0 + (b - s.b0) * 60 / s.bpm; }
  // the beat you hear right now
  beat() { return this.beatAt(this.time() - this.latency()); }
  bpm() { return this.segAtTime(this.time()).bpm; }
  secPerBeat() { return 60 / this.bpm(); }
  // start the drums: beat 0 falls `delay` seconds from now
  start(style, delay) {
    this.ensure();
    this.stop();
    var t0 = this.time() + (delay == null ? 0.25 : delay);
    this.segs = [{ t0: t0, b0: 0, bpm: STYLES[style].bpm, style: style }];
    this.step = 0; this.playing = true;
    var self = this;
    this.timer = setInterval(function () { self.pump(); }, 25);
    this.pump();
    return t0;
  }
  // switch to another style from a given beat (a bar line)
  change(style, atBeat) {
    var t = this.timeOf(atBeat);
    this.segs = this.segs.filter(function (s) { return s.b0 < atBeat; });
    this.segs.push({ t0: t, b0: atBeat, bpm: STYLES[style].bpm, style: style });
  }
  stop() { this.playing = false; clearInterval(this.timer); this.timer = 0; }
  pump() {
    if (!this.playing) return;
    var horizon = this.time() + 0.15;
    while (true) {
      var b = this.step / 2, t = this.timeOf(b);
      if (t > horizon) break;
      var s = this.segAtBeat(b), st = STYLES[s.style], inBar = this.step % 8;
      if (t >= this.time() - 0.05) {
        if (this.drums) st.steps.forEach(function (e) { if (e[0] === inBar) this[e[1]](t, e[2] * this.drumVol); }, this);
        if (this.claps && inBar % 2 === 0) this.clap(t, inBar === 0 ? 0.9 : 0.7);
      }
      this.step++;
    }
  }
}
