// ── Âm thanh tổng hợp bằng WebAudio (không cần file ngoài) ──

let audioCtx = null;
let soundOn = localStorage.getItem('spa_snd') !== '0';

export function ac() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  if (audioCtx.state === 'suspended') audioCtx.resume();
  return audioCtx;
}

function tone(f0, f1, dur, type, vol, delay) {
  if (!soundOn) return;
  try {
    const a = ac(), t = a.currentTime + (delay || 0);
    const o = a.createOscillator(), g = a.createGain();
    o.type = type || 'sine';
    o.frequency.setValueAtTime(f0, t);
    if (f1) o.frequency.exponentialRampToValueAtTime(f1, t + dur);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol || 0.18, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g); g.connect(a.destination);
    o.start(t); o.stop(t + dur + 0.05);
  } catch (e) { /* bỏ qua lỗi audio */ }
}

export const sSelect  = () => tone(520, 760, 0.1, 'sine', 0.16);
export const sAssign  = () => { tone(660, 0, 0.07, 'sine', 0.14); tone(880, 0, 0.09, 'sine', 0.14, 0.08); };
export const sTapWork = () => { tone(280 + Math.random() * 160, 0, 0.06, 'triangle', 0.2); tone(1300 + Math.random() * 500, 0, 0.09, 'sine', 0.08, 0.02); };
export const sDone    = () => { tone(880, 0, 0.12, 'sine', 0.18); tone(1320, 0, 0.2, 'sine', 0.16, 0.1); };
export const sBell    = () => { tone(660, 0, 0.25, 'sine', 0.14); tone(524, 0, 0.35, 'sine', 0.12, 0.22); };
export const sAngry   = () => tone(340, 150, 0.5, 'sawtooth', 0.1);
export const sCash    = () => { tone(1568, 0, 0.09, 'square', 0.07); tone(2093, 0, 0.3, 'sine', 0.16, 0.09); tone(2637, 0, 0.35, 'sine', 0.1, 0.12); };
export const sNope    = () => tone(240, 190, 0.15, 'triangle', 0.14);

export function initSoundToggle(btn) {
  btn.textContent = soundOn ? '🔊' : '🔇';
  btn.addEventListener('click', () => {
    soundOn = !soundOn;
    localStorage.setItem('spa_snd', soundOn ? '1' : '0');
    btn.textContent = soundOn ? '🔊' : '🔇';
    if (soundOn) sSelect();
  });
}

/* ════════════════ NHẠC NỀN THƯ GIÃN ════════════════
   Tự sinh bằng WebAudio: pad hợp âm êm, giai điệu ngũ cung
   thánh thót có tiếng vọng, thỉnh thoảng chuông gió. */

let musicOn = localStorage.getItem('spa_music') !== '0';
let musicTimer = null;
let musicGain = null;
let nextChordAt = 0, nextNoteAt = 0, chordIdx = 0;

// Cmaj7 → Am7 → Fmaj7 → G6, vòng lặp dịu dàng
const CHORDS = [
  [261.63, 329.63, 392.00, 493.88],
  [220.00, 261.63, 329.63, 392.00],
  [174.61, 220.00, 261.63, 329.63],
  [196.00, 246.94, 293.66, 329.63],
];
// ngũ cung Đô cao cho giai điệu
const SCALE = [523.25, 587.33, 659.25, 783.99, 880.00, 1046.5];

function padNote(t, freq, dur) {
  const a = ac();
  const g = a.createGain();
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(0.035, t + dur * 0.35);
  g.gain.linearRampToValueAtTime(0.0001, t + dur);
  g.connect(musicGain);
  for (const det of [-3, 3]) {
    const o = a.createOscillator();
    o.type = 'triangle';
    o.frequency.setValueAtTime(freq, t);
    o.detune.setValueAtTime(det, t);
    o.connect(g);
    o.start(t); o.stop(t + dur + 0.1);
  }
}

function pluck(t, freq, vol) {
  const a = ac();
  const o = a.createOscillator(), g = a.createGain();
  o.type = 'sine';
  o.frequency.setValueAtTime(freq, t);
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(vol, t + 0.025);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 1.9);
  o.connect(g); g.connect(musicGain);
  o.start(t); o.stop(t + 2);
}

function melodyNote(t, freq) {
  pluck(t, freq, 0.055);
  pluck(t + 0.38, freq, 0.022); // tiếng vọng nhẹ
}

function windChime(t) {
  const notes = [1046.5, 1318.5, 1568.0, 2093.0];
  let d = 0;
  for (let i = 0; i < 3 + Math.floor(Math.random() * 3); i++) {
    pluck(t + d, notes[Math.floor(Math.random() * notes.length)], 0.02);
    d += 0.1 + Math.random() * 0.14;
  }
}

function musicTick() {
  const a = ac();
  if (!musicOn || !musicGain || a.state !== 'running') return;
  const now = a.currentTime;
  if (nextChordAt < now) { nextChordAt = now + 0.1; nextNoteAt = now + 1; }
  while (nextChordAt < now + 1.5) {
    const chord = CHORDS[chordIdx % CHORDS.length];
    for (const f of chord) padNote(nextChordAt, f, 8.5);
    chordIdx++;
    nextChordAt += 7.5;
  }
  while (nextNoteAt < now + 1.5) {
    const r = Math.random();
    if (r < 0.62) melodyNote(nextNoteAt, SCALE[Math.floor(Math.random() * SCALE.length)]);
    else if (r < 0.72) windChime(nextNoteAt);
    // phần còn lại: khoảng lặng
    nextNoteAt += 1.4 + Math.random() * 2.2;
  }
}

export function startMusic() {
  if (!musicOn || musicTimer) return;
  const a = ac();
  musicGain = a.createGain();
  musicGain.gain.value = 1;
  const lp = a.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = 2400;
  musicGain.connect(lp); lp.connect(a.destination);
  nextChordAt = 0; nextNoteAt = 0; chordIdx = 0;
  musicTick();
  musicTimer = setInterval(musicTick, 400);
}

export function stopMusic() {
  if (musicTimer) { clearInterval(musicTimer); musicTimer = null; }
  if (musicGain) {
    const a = ac();
    musicGain.gain.setValueAtTime(musicGain.gain.value, a.currentTime);
    musicGain.gain.linearRampToValueAtTime(0.0001, a.currentTime + 0.6);
    const g = musicGain;
    setTimeout(() => g.disconnect(), 800);
    musicGain = null;
  }
}

export function initMusicToggle(btn) {
  const paint = () => {
    btn.textContent = '🎵';
    btn.classList.toggle('off', !musicOn);
  };
  paint();
  btn.addEventListener('click', () => {
    musicOn = !musicOn;
    localStorage.setItem('spa_music', musicOn ? '1' : '0');
    paint();
    if (musicOn) startMusic(); else stopMusic();
  });
}
