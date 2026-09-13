// ── Âm thanh & nhạc nền tổng hợp bằng WebAudio (không cần tải file) ──
let ctx = null, master = null;
let soundOn = localStorage.getItem('cs_snd') !== '0';
let musicOn = localStorage.getItem('cs_music') !== '0';

export function ac() {
  if (!ctx) {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    master = ctx.createGain();
    master.gain.value = 0.9;
    master.connect(ctx.destination);
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function env(dest, t, dur, vol, attack = 0.008) {
  const g = ac().createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(vol, t + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  g.connect(dest);
  return g;
}

function tone(f0, f1, dur, type, vol, delay = 0, dest) {
  if (!soundOn && !dest) return;
  try {
    const a = ac(), t = a.currentTime + delay;
    const g = env(dest || master, t, dur, vol);
    const o = a.createOscillator();
    o.type = type || 'sine';
    o.frequency.setValueAtTime(f0, t);
    if (f1) o.frequency.exponentialRampToValueAtTime(Math.max(30, f1), t + dur);
    o.connect(g);
    o.start(t); o.stop(t + dur + 0.05);
  } catch (e) { /* bỏ qua */ }
}

// Tiếng "bụp" nhựa dẻo khi bóng rơi vào ống — cao dần theo chiều cao chồng bóng.
export function sDrop(h = 0) {
  if (!soundOn) return;
  const f = 200 + h * 46;
  tone(f * 2.4, f, 0.13, 'sine', 0.24);
  tone(f * 1.2, f * 0.7, 0.09, 'triangle', 0.1, 0.01);
  noise(0.05, 0.05, 1400);
}

function noise(dur, vol, hz) {
  if (!soundOn) return;
  try {
    const a = ac(), t = a.currentTime;
    const n = a.createBufferSource();
    const buf = a.createBuffer(1, (a.sampleRate * dur) | 0, a.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
    n.buffer = buf;
    const f = a.createBiquadFilter();
    f.type = 'bandpass'; f.frequency.value = hz; f.Q.value = 1.2;
    const g = env(master, t, dur, vol, 0.004);
    n.connect(f); f.connect(g);
    n.start(t);
  } catch (e) { /* bỏ qua */ }
}

export const sTap    = () => tone(680, 900, 0.07, 'sine', 0.14);
export const sLift   = () => { tone(520, 880, 0.1, 'sine', 0.16); tone(1040, 1600, 0.09, 'sine', 0.05, 0.02); };
export const sBack   = () => tone(700, 460, 0.11, 'sine', 0.12);
export const sNope   = () => { tone(180, 130, 0.16, 'sawtooth', 0.09); tone(150, 110, 0.2, 'square', 0.05, 0.06); };
export const sCoin   = () => { tone(1568, 0, 0.07, 'square', 0.07); tone(2093, 0, 0.24, 'sine', 0.13, 0.06); };
export const sWand   = () => { for (let i = 0; i < 7; i++) tone(700 + i * 260, 0, 0.16, 'sine', 0.07, i * 0.035); noise(0.3, 0.05, 3000); };
export const sHint   = () => { [1046, 1318, 1568].forEach((f, i) => tone(f, 0, 0.3, 'sine', 0.1, i * 0.07)); };
export const sUndo   = () => tone(760, 420, 0.16, 'triangle', 0.12);
export const sNewTube= () => { tone(300, 900, 0.22, 'triangle', 0.12); tone(1200, 1800, 0.18, 'sine', 0.06, 0.08); };

// Ống xong: rải arpeggio lấp lánh, cao dần theo số ống đã xong trong vòng.
export function sTubeDone(idx = 0) {
  const root = 523.25 * Math.pow(2, Math.min(idx, 6) / 12);
  [0, 4, 7, 12].forEach((st, i) => tone(root * Math.pow(2, st / 12), 0, 0.5, 'sine', 0.13, i * 0.055));
  [0, 4, 7, 12].forEach((st, i) => tone(root * 2 * Math.pow(2, st / 12), 0, 0.28, 'triangle', 0.04, i * 0.055));
}

export function sWin() {
  const n = [523, 659, 784, 1046, 1318, 1046, 1318, 1568];
  n.forEach((f, i) => {
    tone(f, 0, 0.38, 'triangle', 0.13, i * 0.1);
    tone(f * 2, 0, 0.24, 'sine', 0.05, i * 0.1);
  });
  tone(130.8, 0, 1.2, 'sine', 0.12, 0);
  tone(196.0, 0, 1.2, 'sine', 0.1, 0.4);
}

/* ═══ NHẠC NỀN ═══
   Vòng hoà thanh vui tươi (C – Am – F – G) với bass nảy, marimba và bộ gõ nhẹ. */
let musGain = null, timer = null, nextT = 0, bar = 0;

const PROG = [
  { root: 130.81, notes: [261.63, 329.63, 392.00, 523.25] },   // C
  { root: 110.00, notes: [261.63, 329.63, 440.00, 523.25] },   // Am
  { root: 174.61, notes: [261.63, 349.23, 440.00, 523.25] },   // F
  { root: 196.00, notes: [293.66, 392.00, 493.88, 587.33] },   // G
];
const STEP = 0.30;   // một phách móc đơn

function marimba(t, f, dur, vol) {
  const a = ac();
  const g = env(musGain, t, dur, vol, 0.006);
  const o = a.createOscillator(); o.type = 'sine'; o.frequency.setValueAtTime(f, t);
  o.connect(g); o.start(t); o.stop(t + dur + 0.05);
  const g2 = env(musGain, t, dur * 0.35, vol * 0.35, 0.004);
  const o2 = a.createOscillator(); o2.type = 'sine'; o2.frequency.setValueAtTime(f * 4, t);
  o2.connect(g2); o2.start(t); o2.stop(t + dur * 0.35 + 0.05);
}
function bass(t, f, dur, vol) {
  const a = ac();
  const g = env(musGain, t, dur, vol, 0.01);
  const o = a.createOscillator(); o.type = 'triangle';
  o.frequency.setValueAtTime(f * 1.5, t);
  o.frequency.exponentialRampToValueAtTime(f, t + 0.05);
  o.connect(g); o.start(t); o.stop(t + dur + 0.05);
}
function hat(t, vol) {
  const a = ac();
  const n = a.createBufferSource();
  const buf = a.createBuffer(1, (a.sampleRate * 0.05) | 0, a.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
  n.buffer = buf;
  const f = a.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = 7000;
  const g = env(musGain, t, 0.05, vol, 0.003);
  n.connect(f); f.connect(g); n.start(t);
}

function schedule() {
  const a = ac();
  while (nextT < a.currentTime + 1.5) {
    const ch = PROG[bar % PROG.length];
    // Bass nảy: phách 1 và 3 của ô nhịp 8 móc đơn.
    bass(nextT, ch.root, STEP * 1.4, 0.10);
    bass(nextT + STEP * 3, ch.root, STEP * 0.9, 0.07);
    bass(nextT + STEP * 4, ch.root * 1.5, STEP * 1.2, 0.07);
    // Marimba: mẫu giai điệu lặp có biến tấu nhẹ theo ô nhịp.
    const r = (k) => ((bar * 53 + k * 29) % 31) / 31;
    for (let i = 0; i < 8; i++) {
      if (i % 2 === 1 && r(i) < 0.55) continue;
      const f = ch.notes[(Math.floor(r(i + 3) * 4) + (i % 2)) % 4];
      marimba(nextT + i * STEP, f * (r(i + 9) < 0.18 ? 2 : 1), STEP * 2.1, 0.055);
    }
    for (let i = 0; i < 8; i++) hat(nextT + i * STEP + STEP * 0.5, i % 4 === 2 ? 0.022 : 0.012);
    nextT += STEP * 8;
    bar++;
  }
}

export function startMusic() {
  if (!musicOn || timer) return;
  try {
    const a = ac();
    if (!musGain) { musGain = a.createGain(); musGain.gain.value = 0.55; musGain.connect(master); }
    nextT = a.currentTime + 0.15;
    schedule();
    timer = setInterval(schedule, 450);
  } catch (e) { /* bỏ qua */ }
}
export function stopMusic() { if (timer) { clearInterval(timer); timer = null; } }

// Hạ nhỏ nhạc nền trong lúc chúc mừng để fanfare nổi lên.
export function duckMusic(ms = 2200) {
  if (!musGain) return;
  try {
    const a = ac(), t = a.currentTime;
    musGain.gain.cancelScheduledValues(t);
    musGain.gain.setValueAtTime(musGain.gain.value, t);
    musGain.gain.linearRampToValueAtTime(0.12, t + 0.15);
    musGain.gain.linearRampToValueAtTime(0.55, t + ms / 1000);
  } catch (e) { /* bỏ qua */ }
}

const sndBtns = [], musBtns = [];
function sync() {
  for (const b of sndBtns) { b.textContent = soundOn ? '🔊' : '🔇'; b.classList.toggle('off', !soundOn); }
  for (const b of musBtns) { b.textContent = musicOn ? '🎵' : '🎶'; b.classList.toggle('off', !musicOn); }
}
export function initSoundToggle(btn) {
  sndBtns.push(btn); sync();
  btn.addEventListener('click', () => {
    soundOn = !soundOn;
    localStorage.setItem('cs_snd', soundOn ? '1' : '0');
    sync(); if (soundOn) sTap();
  });
}
export function initMusicToggle(btn) {
  musBtns.push(btn); sync();
  btn.addEventListener('click', () => {
    musicOn = !musicOn;
    localStorage.setItem('cs_music', musicOn ? '1' : '0');
    sync(); if (musicOn) startMusic(); else stopMusic();
  });
}
