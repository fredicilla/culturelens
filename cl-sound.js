/**
 * cl-sound.js: sound that works on every page and every phone. Loaded first, before any other script.
 *
 * Why pages were silent on iPhones:
 *   1. The silent switch mutes sound made by a page's audio engine (Web Audio) unless the page says it is playing
 *      media: navigator.audioSession.type = 'playback' (older iPhones: a silent <audio> loop does the same).
 *   2. An audio engine only starts inside a real tap (touchend or click; touchstart and pointerdown do not count),
 *      so an engine made at the wrong moment stayed asleep. Here every engine a page makes is woken on every tap.
 *   3. The phone's own voice (speechSynthesis) only speaks later if it spoke once inside a tap.
 * While a microphone is open the session is play-and-record, so the phone can hear; when it closes, playback again.
 *
 *   clSound.prime()      call inside a tap, before work that ends in sound (a reply, a voice): wakes everything now
 *   clSound.ctx()        a shared audio engine for voices, woken by prime()
 *   clSound.capturing()  is a microphone open
 */
(function () {
  if (window.clSound) return;
  var C = window.AudioContext || window.webkitAudioContext;
  var all = [], shared = null, spoke = false, keep = null;
  // a breath of silence, as a tiny WAV file (made here, so nothing to download)
  function silence() {
    var n = 800, b = new Uint8Array(44 + n), dv = new DataView(b.buffer), i;
    var w = function (o, t) { for (var k = 0; k < t.length; k++) b[o + k] = t.charCodeAt(k); };
    w(0, 'RIFF'); dv.setUint32(4, 36 + n, true); w(8, 'WAVE'); w(12, 'fmt '); dv.setUint32(16, 16, true); dv.setUint16(20, 1, true); dv.setUint16(22, 1, true);
    dv.setUint32(24, 8000, true); dv.setUint32(28, 8000, true); dv.setUint16(32, 1, true); dv.setUint16(34, 8, true); w(36, 'data'); dv.setUint32(40, n, true);
    for (i = 44; i < b.length; i++) b[i] = 128;
    var str = ''; for (i = 0; i < b.length; i++) str += String.fromCharCode(b[i]);
    return 'data:audio/wav;base64,' + btoa(str);
  }

  // every audio engine the page makes is kept here, so a tap can wake it
  if (C) {
    var Kept = function (o) { var c = o !== undefined ? new C(o) : new C(); all.push(c); return c; };
    Kept.prototype = C.prototype;
    try { Object.setPrototypeOf(Kept, C); } catch (e) {}
    window.AudioContext = Kept;
    if (window.webkitAudioContext) window.webkitAudioContext = Kept;
  }

  // ── the microphone: play-and-record while it is open ──
  var live = [];
  function capturing() {
    live = live.filter(function (t) { return t.readyState === 'live'; });
    return live.length > 0;
  }
  function setType(t) { try { var s = navigator.audioSession; if (s && s.type !== t) s.type = t; } catch (e) {} }
  function session() {
    if (capturing()) setType('play-and-record');
    else if (all.length || shared) setType('playback');   // only pages that make sound take over the phone's audio
  }
  var md = navigator.mediaDevices;
  if (md && md.getUserMedia) {
    var gum = md.getUserMedia.bind(md);
    md.getUserMedia = function (c) {
      if (c && c.audio) setType('play-and-record');
      return gum(c).then(function (st) {
        st.getAudioTracks().forEach(function (t) {
          live.push(t);
          var stop = t.stop.bind(t);
          t.stop = function () { stop(); setTimeout(session, 0); };     // back to playback as soon as the mic closes
          t.addEventListener('ended', function () { setTimeout(session, 0); });
        });
        return st;
      }, function (e) { setTimeout(session, 0); throw e; });
    };
  }

  // ── waking ──
  function kick(c) {
    if (c.state === 'closed') return;
    if (c.state !== 'running') { try { var p = c.resume(); if (p && p.catch) p.catch(function () {}); } catch (e) {} }
    if (!c.__clKicked) {   // some phones only start an engine when a sound starts inside the tap itself
      c.__clKicked = true;
      try { var b = c.createBuffer(1, 1, 22050), s = c.createBufferSource(); s.buffer = b; s.connect(c.destination); s.start(0); } catch (e) {}
    }
  }
  function keepAlive() {
    // older iPhones (no audioSession): a silent loop on an <audio> element puts the page in the playback category
    if (navigator.audioSession || !/iPhone|iPad|iPod/.test(navigator.userAgent || '') || (keep && !keep.paused)) return;
    try {
      if (!keep) { keep = document.createElement('audio'); keep.setAttribute('playsinline', ''); keep.setAttribute('x-webkit-airplay', 'deny'); keep.loop = true; keep.preload = 'auto'; keep.src = silence(); }
      var p = keep.play(); if (p && p.catch) p.catch(function () {});
    } catch (e) {}
  }
  function voice() {
    if (spoke || !('speechSynthesis' in window)) return;
    spoke = true;
    try { var u = new SpeechSynthesisUtterance(' '); u.volume = 0; speechSynthesis.speak(u); } catch (e) {}
  }
  function wake() {
    all = all.filter(function (c) { return c.state !== 'closed'; });
    if (!all.length && !shared) return;
    ctx(); voice();     // this page makes sound: the voices get ready inside this tap too
    session(); keepAlive();
    all.forEach(kick);
  }
  function ctx() {
    if (!shared && C) { try { shared = new window.AudioContext(); } catch (e) { shared = null; } }
    return shared;
  }
  function prime() { ctx(); voice(); wake(); }
  ['touchend', 'click', 'keydown', 'pointerup', 'mousedown'].forEach(function (ev) { document.addEventListener(ev, wake, true); });
  // coming back to the page: the phone may have put the engines to sleep
  document.addEventListener('visibilitychange', function () { if (!document.hidden) all.forEach(function (c) { if (c.state === 'suspended' && c.__clKicked) { try { c.resume(); } catch (e) {} } }); });

  // once per phone: a mute left on from before this fix is lifted (the experiences' sound button still mutes after)
  try { if (!localStorage.getItem('cl_sound_fix1')) { localStorage.setItem('cl_sound_fix1', '1'); if (localStorage.getItem('cl_sound') === 'off') localStorage.removeItem('cl_sound'); } } catch (e) {}

  window.clSound = { prime: prime, ctx: ctx, capturing: capturing, wake: wake, session: session };
})();
