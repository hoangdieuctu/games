// ── Âm thanh tổng hợp bằng WebAudio (không cần tải file ngoài) ──

let audioCtx = null;
let soundOn = localStorage.getItem('rest_snd') !== '0';

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

export const sSelect = () => tone(520, 760, 0.1, 'sine', 0.16);
export const sAssign = () => { tone(660, 0, 0.07, 'sine', 0.14); tone(880, 0, 0.09, 'sine', 0.14, 0.08); };
export const sOrder  = () => { tone(740, 0, 0.06, 'triangle', 0.12); tone(988, 0, 0.12, 'sine', 0.12, 0.06); };
export const sDone   = () => { tone(880, 0, 0.12, 'sine', 0.18); tone(1320, 0, 0.2, 'sine', 0.16, 0.1); };
export const sBell   = () => { tone(1046, 0, 0.22, 'sine', 0.14); tone(1568, 0, 0.34, 'sine', 0.1, 0.1); };
export const sDoor   = () => { tone(660, 0, 0.25, 'sine', 0.13); tone(524, 0, 0.35, 'sine', 0.11, 0.22); };
export const sAngry  = () => tone(340, 150, 0.5, 'sawtooth', 0.1);
export const sCash   = () => { tone(1568, 0, 0.09, 'square', 0.07); tone(2093, 0, 0.3, 'sine', 0.16, 0.09); tone(2637, 0, 0.35, 'sine', 0.1, 0.12); };
export const sNope   = () => tone(240, 190, 0.15, 'triangle', 0.14);
export const sClean  = () => { tone(320, 620, 0.16, 'triangle', 0.1); tone(300, 580, 0.16, 'triangle', 0.08, 0.16); };
export const sLevel  = () => { [523, 659, 784, 1046].forEach((f, i) => tone(f, 0, 0.35, 'sine', 0.16, i * 0.12)); };

export function initSoundToggle(btn) {
  btn.textContent = soundOn ? '🔊' : '🔇';
  btn.addEventListener('click', () => {
    soundOn = !soundOn;
    localStorage.setItem('rest_snd', soundOn ? '1' : '0');
    btn.textContent = soundOn ? '🔊' : '🔇';
    if (soundOn) sSelect();
  });
}

/* ════════════ NHẠC NỀN QUÁN CÀ PHÊ ════════════
   Tự sinh bằng WebAudio: hợp âm jazz êm, bass ấm,
   giai điệu piano thưa thớt — nghe nhẹ nhàng, không gây mệt. */

let musicOn = localStorage.getItem('rest_music') !== '0';
let musicTimer = null;
let musicGain = null;
let nextChordAt = 0, nextNoteAt = 0, chordIdx = 0;

// Cmaj7 → Am7 → Dm7 → G7: vòng hoà âm ấm áp kiểu quán nhỏ
const CHORDS = [
  { bass: 130.81, notes: [261.63, 329.63, 392.00, 493.88] },
  { bass: 110.00, notes: [261.63, 329.63, 392.00, 440.00] },
  { bass: 146.83, notes: [293.66, 349.23, 440.00, 523.25] },
  { bass: 98.00,  notes: [293.66, 349.23, 392.00, 493.88] },
];
const SCALE = [523.25, 587.33, 659.25, 783.99, 880.00, 1046.5, 1174.7];

function padNote(t, freq, dur) {
  const a = ac();
  const g = a.createGain();
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(0.03, t + dur * 0.3);
  g.gain.linearRampToValueAtTime(0.0001, t + dur);
  g.connect(musicGain);
  for (const det of [-4, 4]) {
    const o = a.createOscillator();
    o.type = 'triangle';
    o.frequency.setValueAtTime(freq, t);
    o.detune.setValueAtTime(det, t);
    o.connect(g);
    o.start(t); o.stop(t + dur + 0.1);
  }
}

function bassNote(t, freq) {
  const a = ac();
  const o = a.createOscillator(), g = a.createGain();
  o.type = 'sine';
  o.frequency.setValueAtTime(freq, t);
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(0.075, t + 0.05);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 2.2);
  o.connect(g); g.connect(musicGain);
  o.start(t); o.stop(t + 2.3);
}

function pluck(t, freq, vol) {
  const a = ac();
  const o = a.createOscillator(), g = a.createGain();
  o.type = 'sine';
  o.frequency.setValueAtTime(freq, t);
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(vol, t + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 1.7);
  o.connect(g); g.connect(musicGain);
  o.start(t); o.stop(t + 1.8);
}

function melodyNote(t, freq) {
  pluck(t, freq, 0.05);
  pluck(t + 0.34, freq * 2, 0.014); // tiếng vọng lấp lánh
}

function musicTick() {
  const a = ac();
  if (!musicOn || !musicGain || a.state !== 'running') return;
  const now = a.currentTime;
  if (nextChordAt < now) { nextChordAt = now + 0.1; nextNoteAt = now + 0.9; }
  while (nextChordAt < now + 1.5) {
    const ch = CHORDS[chordIdx % CHORDS.length];
    for (const f of ch.notes) padNote(nextChordAt, f, 7.2);
    bassNote(nextChordAt, ch.bass);
    bassNote(nextChordAt + 3.1, ch.bass * 1.5);
    chordIdx++;
    nextChordAt += 6.4;
  }
  while (nextNoteAt < now + 1.5) {
    const r = Math.random();
    if (r < 0.6) melodyNote(nextNoteAt, SCALE[Math.floor(Math.random() * SCALE.length)]);
    else if (r < 0.7) {
      // câu nhạc hai nốt nối nhau
      const i = Math.floor(Math.random() * (SCALE.length - 1));
      melodyNote(nextNoteAt, SCALE[i]);
      melodyNote(nextNoteAt + 0.42, SCALE[i + 1]);
    }
    // còn lại: khoảng lặng cho thoáng
    nextNoteAt += 1.3 + Math.random() * 2.1;
  }
}

export function startMusic() {
  if (!musicOn || musicTimer) return;
  const a = ac();
  musicGain = a.createGain();
  musicGain.gain.value = 1;
  const lp = a.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = 2600;
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
    localStorage.setItem('rest_music', musicOn ? '1' : '0');
    paint();
    if (musicOn) startMusic(); else stopMusic();
  });
}
