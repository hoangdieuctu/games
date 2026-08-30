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
