/* Nhạc nền lo-fi chill, tạo trực tiếp bằng Web Audio (không cần file âm thanh):
   hợp âm jazz tiếng đàn phím mộc, bass ấm, trống nhẹ 72 nhịp/phút và tiếng lạo xạo đĩa than. */
(function () {
  const HD = window.HD;
  const BEAT = 60 / 72, BAR = BEAT * 4, VOLUME = 0.75;
  /* Fa trưởng 9 – Mi thứ 7 – Rê thứ 9 – Đô trưởng 9: [nốt bass, các nốt hợp âm] */
  const CHORDS = [
    [87.31, [174.61, 220.0, 261.63, 329.63, 392.0]],
    [82.41, [164.81, 196.0, 246.94, 293.66, 369.99]],
    [73.42, [146.83, 174.61, 220.0, 261.63, 329.63]],
    [65.41, [130.81, 164.81, 196.0, 246.94, 293.66]]
  ];
  const NOTES = [392.0, 440.0, 523.25, 587.33, 659.25, 783.99];
  let ctx, master, keys, drums, noise, timer = null, nextBar = 0, step = 0;

  function init() {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    master = ctx.createGain(); master.gain.value = 0;
    const warm = ctx.createBiquadFilter(); warm.type = 'lowpass'; warm.frequency.value = 4200;
    warm.connect(master); master.connect(ctx.destination);
    drums = ctx.createGain(); drums.connect(warm);
    /* Đàn phím đi qua bộ lọc cho tiếng đục, ấm và một chút vọng */
    keys = ctx.createGain();
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1300; lp.Q.value = 0.6;
    const delay = ctx.createDelay(1), fb = ctx.createGain(), wet = ctx.createGain();
    delay.delayTime.value = BEAT * 0.75; fb.gain.value = 0.3; wet.gain.value = 0.22;
    keys.connect(lp); lp.connect(warm); lp.connect(delay); delay.connect(fb); fb.connect(delay); delay.connect(wet); wet.connect(warm);

    noise = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const d = noise.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    /* Tiếng lạo xạo đĩa than chạy nền liên tục */
    const crackle = ctx.createBuffer(1, ctx.sampleRate * 4, ctx.sampleRate), c = crackle.getChannelData(0);
    for (let i = 0; i < c.length; i++) c[i] = (Math.random() * 2 - 1) * 0.02 + (Math.random() < 0.0006 ? (Math.random() * 2 - 1) * 0.9 : 0);
    const src = ctx.createBufferSource(), hp = ctx.createBiquadFilter(), g = ctx.createGain();
    src.buffer = crackle; src.loop = true; hp.type = 'highpass'; hp.frequency.value = 1200; g.gain.value = 0.11;
    src.connect(hp); hp.connect(g); g.connect(warm); src.start();
  }

  function note(freq, t, dur, vol, type, out) {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.value = freq; o.detune.value = Math.random() * 14 - 7;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.015);
    g.gain.exponentialRampToValueAtTime(vol * 0.35, t + dur * 0.4);
    g.gain.linearRampToValueAtTime(0, t + dur);
    o.connect(g); g.connect(out);
    o.start(t); o.stop(t + dur + 0.05);
  }
  function chord(notes, t, dur, vol) {
    notes.forEach((f, i) => {
      note(f, t + i * 0.018, dur, vol, 'triangle', keys);
      note(f * 2, t + i * 0.018, dur * 0.5, vol * 0.25, 'sine', keys);
    });
  }
  function kick(t) {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.frequency.setValueAtTime(120, t); o.frequency.exponentialRampToValueAtTime(42, t + 0.13);
    g.gain.setValueAtTime(0.5, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
    o.connect(g); g.connect(drums); o.start(t); o.stop(t + 0.32);
  }
  function hiss(t, dur, vol, type, freq) {
    const s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    s.buffer = noise; f.type = type; f.frequency.value = freq;
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    s.connect(f); f.connect(g); g.connect(drums); s.start(t, Math.random()); s.stop(t + dur + 0.02);
  }

  function bar(t) {
    const [root, notes] = CHORDS[step++ % CHORDS.length];
    chord(notes, t, BEAT * 2.8, 0.05);
    chord(notes.slice(1), t + BEAT * 2.5, BEAT * 1.3, 0.03);
    note(root, t, BEAT * 1.6, 0.2, 'sine', drums);
    note(root, t + BEAT * 2.5, BEAT * 1.2, 0.16, 'sine', drums);
    kick(t); kick(t + BEAT * 2.5);
    if (Math.random() < 0.35) kick(t + BEAT * 1.5);
    hiss(t + BEAT, 0.16, 0.1, 'bandpass', 1700); hiss(t + BEAT * 3, 0.16, 0.1, 'bandpass', 1700);
    /* Hi-hat móc đơn, phách yếu trễ một chút cho có độ lắc */
    for (let i = 0; i < 8; i++) hiss(t + (i / 2 + (i % 2 ? 0.09 : 0)) * BEAT, 0.05, i % 2 ? 0.022 : 0.035, 'highpass', 7000);
    for (let i = 0; i < 8; i++) {
      if (Math.random() < 0.2) note(NOTES[Math.floor(Math.random() * NOTES.length)], t + i * BEAT / 2, BEAT * 1.6, 0.045, 'sine', keys);
    }
  }
  function tick() {
    while (nextBar - ctx.currentTime < 1.2) { bar(nextBar); nextBar += BAR; }
  }

  HD.music = {
    /* Phải gọi lần đầu từ một thao tác của người dùng (trình duyệt chặn tự phát nhạc) */
    set(on) {
      if (!on && !ctx) return;
      if (!ctx) init();
      const now = ctx.currentTime;
      master.gain.cancelScheduledValues(now);
      master.gain.setValueAtTime(master.gain.value, now);
      if (on) {
        ctx.resume();
        master.gain.linearRampToValueAtTime(VOLUME, now + 1.5);
        if (timer === null) { nextBar = Math.max(nextBar, now + 0.1); tick(); timer = setInterval(tick, 300); }
      } else {
        master.gain.linearRampToValueAtTime(0, now + 0.4);
        clearInterval(timer); timer = null;
        setTimeout(() => { if (timer === null) ctx.suspend(); }, 500);
      }
    }
  };
})();
