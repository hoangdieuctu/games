// Âm thanh: hiệu ứng tổng hợp bằng WebAudio (không cần tệp), nhạc nền tự sinh,
// và giọng quản trò mp3 (voice/<vi|en>/<khoá>.mp3, sinh bằng art/gen-voice.mjs; thiếu tệp thì dùng giọng máy).
const Sound = (() => {
  let ctx = null, master = null, sfxBus = null, musBus = null, noiseBuf = null;
  const cfg = { sfx: true, music: true, narr: true, vol: 0.8 };
  function ac() {
    if (!ctx) {
      try {
        ctx = new (window.AudioContext || window.webkitAudioContext)();
        master = ctx.createGain(); master.connect(ctx.destination);
        sfxBus = ctx.createGain(); sfxBus.connect(master);
        musBus = ctx.createGain(); musBus.gain.value = 0.0001; musBus.connect(master);
        const n = ctx.sampleRate; noiseBuf = ctx.createBuffer(1, n, n);
        const d = noiseBuf.getChannelData(0); for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
        apply();
      } catch (e) { return null; }
    }
    if (ctx.state !== 'running') ctx.resume().catch(() => {});
    return ctx;
  }
  function apply() {
    if (!ctx) return;
    master.gain.value = cfg.vol;
    sfxBus.gain.value = cfg.sfx ? 1 : 0;
  }
  const T = () => ctx.currentTime;
  function tone(type, f0, t, len, vol, f1, out) {
    const c = ac(); if (!c) return;
    const o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.setValueAtTime(f0, T() + t);
    if (f1) o.frequency.exponentialRampToValueAtTime(f1, T() + t + len);
    g.gain.setValueAtTime(0.0001, T() + t);
    g.gain.exponentialRampToValueAtTime(vol, T() + t + Math.min(0.03, len / 3));
    g.gain.exponentialRampToValueAtTime(0.0001, T() + t + len);
    o.connect(g).connect(out || sfxBus); o.start(T() + t); o.stop(T() + t + len + 0.05);
    return o;
  }
  function noise(t, len, vol, freq, q = 1, type = 'bandpass', f1) {
    const c = ac(); if (!c) return;
    const s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
    s.buffer = noiseBuf; s.loop = true; f.type = type; f.Q.value = q;
    f.frequency.setValueAtTime(freq, T() + t); if (f1) f.frequency.exponentialRampToValueAtTime(f1, T() + t + len);
    g.gain.setValueAtTime(0.0001, T() + t); g.gain.exponentialRampToValueAtTime(vol, T() + t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, T() + t + len);
    s.connect(f).connect(g).connect(sfxBus); s.start(T() + t, Math.random()); s.stop(T() + t + len + 0.05);
  }
  const fx = {
    click() { tone('triangle', 660, 0, 0.06, 0.12); },
    select() { tone('sine', 520, 0, 0.08, 0.15, 780); },
    shuffle() { for (let i = 0; i < 9; i++) noise(i * 0.055, 0.05, 0.25, 2500 + Math.random() * 1500, 2); },
    deal() { noise(0, 0.08, 0.3, 3000, 1.5, 'bandpass', 1200); },
    flip() { noise(0, 0.14, 0.25, 900, 1, 'bandpass', 4000); tone('sine', 300, 0.05, 0.12, 0.08, 600); },
    night() { tone('sine', 220, 0, 2.2, 0.12, 110); tone('sine', 330, 0.15, 2, 0.06, 165); noise(0, 2.4, 0.05, 600, 0.6, 'lowpass', 200); },
    howl() {
      const c = ac(); if (!c) return;
      const o = c.createOscillator(), g = c.createGain(), lfo = c.createOscillator(), lg = c.createGain();
      o.type = 'sawtooth'; const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 1400;
      o.frequency.setValueAtTime(300, T()); o.frequency.exponentialRampToValueAtTime(620, T() + 0.6); o.frequency.setValueAtTime(620, T() + 1.4); o.frequency.exponentialRampToValueAtTime(380, T() + 2.4);
      lfo.frequency.value = 5.5; lg.gain.value = 9; lfo.connect(lg).connect(o.frequency);
      g.gain.setValueAtTime(0.0001, T()); g.gain.exponentialRampToValueAtTime(0.09, T() + 0.4); g.gain.setValueAtTime(0.09, T() + 1.6); g.gain.exponentialRampToValueAtTime(0.0001, T() + 2.5);
      o.connect(f).connect(g).connect(sfxBus); o.start(); lfo.start(); o.stop(T() + 2.6); lfo.stop(T() + 2.6);
    },
    birds() { for (let i = 0; i < 6; i++) { const t = i * 0.22 + Math.random() * 0.1, f = 2400 + Math.random() * 1400; tone('sine', f, t, 0.09, 0.07, f * 1.4); tone('sine', f * 1.2, t + 0.1, 0.07, 0.05, f); } tone('sine', 392, 0, 1.6, 0.05); tone('sine', 523, 0.2, 1.6, 0.04); },
    vote() { tone('square', 180, 0, 0.07, 0.08, 120); noise(0, 0.05, 0.2, 800, 2); },
    gavel() { noise(0, 0.12, 0.5, 400, 1.2); tone('sine', 110, 0, 0.3, 0.3, 60); },
    death() { tone('sine', 196, 0, 1.6, 0.18, 98); tone('sine', 233, 0.05, 1.5, 0.08, 117); noise(0, 0.25, 0.3, 300, 1); },
    bell() { for (const [f, v] of [[440, 0.12], [880, 0.05], [1320, 0.03]]) tone('sine', f, 0, 2.2, v); },
    growl() { const c = ac(); if (!c) return; noise(0, 1.1, 0.35, 140, 3, 'bandpass', 90); tone('sawtooth', 70, 0, 1, 0.06, 55); },
    tick() { tone('sine', 1100, 0, 0.05, 0.08); },
    win() { [523, 659, 784, 1047].forEach((f, i) => tone('triangle', f, i * 0.14, 0.5, 0.14)); tone('sine', 1047, 0.6, 1.4, 0.08); },
    lose() { [392, 330, 262, 196].forEach((f, i) => tone('triangle', f, i * 0.2, 0.55, 0.12)); },
    shot() { noise(0, 0.25, 0.6, 1500, 0.7, 'lowpass', 200); tone('sine', 90, 0, 0.3, 0.3, 40); },
  };
  function play(k) { if (!cfg.sfx || !fx[k]) return; try { if (ac()) fx[k](); } catch (e) {} }

  // nhạc nền: hợp âm nền chậm (đêm: thứ, ngày: trưởng), đổi nhẹ mỗi 6 giây
  let mood = 'menu', musT = 0;
  const CH = { night: [[110, 130.8, 164.8], [98, 123.5, 146.8], [87.3, 110, 130.8], [98, 116.5, 146.8]], day: [[130.8, 164.8, 196], [146.8, 174.6, 220], [174.6, 220, 261.6], [130.8, 196, 246.9]], menu: [[110, 130.8, 164.8], [87.3, 110, 130.8]] };
  let chord = 0;
  function musicStep() {
    if (!ctx || !cfg.music) return;
    const set = CH[mood] || CH.menu, c = set[chord++ % set.length];
    for (const f of c) { tone('sine', f, 0, 6.5, 0.05, null, musBus); tone('triangle', f * 2, 0.4, 5.5, 0.012, null, musBus); }
  }
  function setMood(m) { mood = m; }
  function syncMusic() {
    if (!ctx) return;
    musBus.gain.setTargetAtTime(cfg.music ? 0.9 : 0.0001, T(), 0.4);
    if (cfg.music && !musT) { musicStep(); musT = setInterval(musicStep, 6000); }
    if (!cfg.music && musT) { clearInterval(musT); musT = 0; }
  }

  // giọng quản trò
  let voiceEl = null, voiceTok = 0, synthVoices = null;
  // đọc lần lượt một danh sách câu (câu mới thay hàng đợi cũ)
  function say(keys, lang) {
    if (!cfg.narr) return;
    const list = (Array.isArray(keys) ? keys : [keys]).filter(k => NARR[k]);
    if (!list.length) return;
    const tok = ++voiceTok;
    stopVoice(true);
    const next = () => {
      if (tok !== voiceTok || !list.length) return;
      const key = list.shift(), text = NARR[key][lang] || NARR[key].vi;
      const el = voiceEl = new Audio(`voice/${lang}/${key}.mp3`);
      el.volume = Math.min(1, cfg.vol * 1.1);
      let fell = false;
      const fallback = () => { if (fell || tok !== voiceTok) return; fell = true; speak(text, lang, next); };
      el.onended = () => { if (!fell) setTimeout(next, 250); };
      el.onerror = fallback;
      const p = el.play(); if (p && p.catch) p.catch(fallback);
    };
    next();
  }
  function speak(text, lang, done) {
    try {
      const S = window.speechSynthesis; if (!S) return;
      if (!synthVoices || !synthVoices.length) synthVoices = S.getVoices();
      const u = new SpeechSynthesisUtterance(text);
      const v = synthVoices.find(x => x.lang && x.lang.toLowerCase().startsWith(lang));
      if (v) u.voice = v; u.lang = v ? v.lang : lang === 'en' ? 'en-US' : 'vi-VN';
      u.volume = cfg.vol; u.rate = 1;
      if (done) u.onend = () => setTimeout(done, 250);
      S.cancel(); S.speak(u);
    } catch (e) { if (done) done(); }
  }
  function stopVoice(keepTok) {
    if (!keepTok) voiceTok++;
    if (voiceEl) { try { voiceEl.pause(); } catch (e) {} voiceEl = null; }
    try { if (window.speechSynthesis) speechSynthesis.cancel(); } catch (e) {}
  }

  return {
    cfg, play, say, stopVoice, setMood, ctx: () => ac(),
    set(k, v) { cfg[k] = v; apply(); if (k === 'music') syncMusic(); if (k === 'narr' && !v) stopVoice(); },
    unlock() { if (ac()) syncMusic(); },
  };
})();
