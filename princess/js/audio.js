// ── Âm thanh tổng hợp bằng WebAudio (không cần file ngoài) ──
let audioCtx = null;
let soundOn = localStorage.getItem('princess_snd') !== '0';
let musicOn = localStorage.getItem('princess_music') !== '0';

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
  } catch (e) { /* bỏ qua */ }
}

export const sTap     = () => tone(620, 820, 0.08, 'sine', 0.12);
export const sUp      = () => { tone(784, 0, 0.1, 'sine', 0.16); tone(1175, 0, 0.16, 'sine', 0.14, 0.08); tone(1568, 0, 0.22, 'sine', 0.1, 0.16); };
export const sDown    = () => tone(420, 300, 0.22, 'triangle', 0.1);
export const sNope    = () => { tone(260, 200, 0.14, 'triangle', 0.13); tone(220, 170, 0.18, 'triangle', 0.11, 0.12); };
export const sCash    = () => { tone(1568, 0, 0.08, 'square', 0.06); tone(2093, 0, 0.28, 'sine', 0.15, 0.08); tone(2637, 0, 0.32, 'sine', 0.1, 0.12); };
export const sHint    = () => { for (let i = 0; i < 5; i++) tone(1000 + i * 220, 0, 0.14, 'sine', 0.1, i * 0.06); };
export const sStar    = (i) => tone(1046 + i * 262, 0, 0.35, 'sine', 0.16);
export const sFanfare = () => {
  const n = [523, 659, 784, 1046, 784, 1046, 1318];
  n.forEach((f, i) => tone(f, 0, 0.22, i > 4 ? 'triangle' : 'sine', 0.14, i * 0.11));
};
export const sPop     = () => tone(900 + Math.random() * 300, 1400, 0.07, 'sine', 0.12);
export const sFlip    = () => tone(500, 700, 0.06, 'triangle', 0.1);
export const sTick    = () => tone(1200, 0, 0.04, 'square', 0.04);

const sndBtns = [], musBtns = [];
function syncBtns() {
  for (const b of sndBtns) b.textContent = soundOn ? '🔊' : '🔇';
  for (const b of musBtns) b.classList.toggle('off', !musicOn);
}
export function initSoundToggle(btn) {
  sndBtns.push(btn); syncBtns();
  btn.addEventListener('click', () => {
    soundOn = !soundOn;
    localStorage.setItem('princess_snd', soundOn ? '1' : '0');
    syncBtns();
    if (soundOn) sTap();
  });
}

/* ═══ NHẠC NỀN: hộp nhạc công chúa (waltz 3/4, pad êm + giai điệu chuông) ═══ */
let musicGain = null, musicTimer = null, nextBeat = 0, bar = 0;

// C – Am – F – G (waltz), giai điệu ngũ cung C
const CHORDS = [
  [261.63, 329.63, 392.00],
  [220.00, 261.63, 329.63],
  [174.61, 220.00, 261.63],
  [196.00, 246.94, 293.66],
];
const MELODY = [523.25, 587.33, 659.25, 783.99, 880.00, 1046.5, 1174.7, 1318.5];
const BEAT = 0.42;

function bell(t, f, dur, vol) {
  const a = ac();
  const g = a.createGain();
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(vol, t + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  g.connect(musicGain);
  const o = a.createOscillator(); o.type = 'sine'; o.frequency.setValueAtTime(f, t); o.connect(g);
  const o2 = a.createOscillator(); o2.type = 'sine'; o2.frequency.setValueAtTime(f * 3, t);
  const g2 = a.createGain(); g2.gain.setValueAtTime(vol * 0.18, t); g2.gain.exponentialRampToValueAtTime(0.0001, t + dur * 0.4);
  o2.connect(g2); g2.connect(musicGain);
  o.start(t); o.stop(t + dur + 0.05); o2.start(t); o2.stop(t + dur * 0.4 + 0.05);
}
function pad(t, f, dur, vol) {
  const a = ac();
  const g = a.createGain();
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(vol, t + dur * 0.3);
  g.gain.linearRampToValueAtTime(0.0001, t + dur);
  g.connect(musicGain);
  for (const det of [-4, 4]) {
    const o = a.createOscillator(); o.type = 'triangle';
    o.frequency.setValueAtTime(f, t); o.detune.setValueAtTime(det, t);
    o.connect(g); o.start(t); o.stop(t + dur + 0.1);
  }
}

function schedule() {
  const a = ac();
  while (nextBeat < a.currentTime + 1.2) {
    const chord = CHORDS[Math.floor(bar / 1) % CHORDS.length];
    // bass + đệm waltz: nhấn 1, nhẹ 2-3
    pad(nextBeat, chord[0] / 2, BEAT * 3, 0.05);
    pad(nextBeat + BEAT, chord[1], BEAT * 0.9, 0.028);
    pad(nextBeat + BEAT * 2, chord[2], BEAT * 0.9, 0.028);
    // giai điệu chuông: 2–3 nốt mỗi ô nhịp, hạt giống theo ô để lặp dễ nghe
    const r = (k) => ((bar * 37 + k * 11) % 17) / 17;
    const notes = 2 + Math.floor(r(1) * 2);
    for (let i = 0; i < notes; i++) {
      const f = MELODY[Math.floor(r(i + 2) * MELODY.length)];
      bell(nextBeat + i * BEAT * (3 / notes), f, BEAT * 1.6, 0.06);
    }
    nextBeat += BEAT * 3;
    bar++;
  }
}

export function startMusic() {
  if (!musicOn || musicTimer) return;
  try {
    const a = ac();
    if (!musicGain) { musicGain = a.createGain(); musicGain.gain.value = 0.9; musicGain.connect(a.destination); }
    nextBeat = a.currentTime + 0.1;
    schedule();
    musicTimer = setInterval(schedule, 400);
  } catch (e) { /* bỏ qua */ }
}
export function stopMusic() {
  if (musicTimer) { clearInterval(musicTimer); musicTimer = null; }
}
export function initMusicToggle(btn) {
  musBtns.push(btn); syncBtns();
  btn.addEventListener('click', () => {
    musicOn = !musicOn;
    localStorage.setItem('princess_music', musicOn ? '1' : '0');
    syncBtns();
    if (musicOn) startMusic(); else stopMusic();
  });
}
export function musicEnabled() { return musicOn; }
