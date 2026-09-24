// ── Âm thanh nhỏ bằng WebAudio, không cần tệp ngoài ──
import { save } from './state.js';

let ctx = null;
function ac() {
  if (!save.sound) return null;
  try {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  } catch (e) { return null; }
}
function tone(freq, t0, dur, type = 'sine', vol = 0.18) {
  const c = ac(); if (!c) return;
  const o = c.createOscillator(), g = c.createGain();
  o.type = type; o.frequency.value = freq;
  g.gain.setValueAtTime(0, c.currentTime + t0);
  g.gain.linearRampToValueAtTime(vol, c.currentTime + t0 + 0.01);
  g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + t0 + dur);
  o.connect(g).connect(c.destination);
  o.start(c.currentTime + t0); o.stop(c.currentTime + t0 + dur + 0.05);
}
export const sfx = {
  found() { tone(880, 0, .12); tone(1320, .1, .18); },
  wrong() { tone(180, 0, .18, 'square', .08); },
  coin()  { tone(1560, 0, .08, 'triangle', .12); tone(2080, .07, .12, 'triangle', .12); },
  hint()  { tone(660, 0, .1, 'triangle'); tone(660, .15, .1, 'triangle'); },
  win()   { [523, 659, 784, 1046].forEach((f, i) => tone(f, i * .12, .3, 'triangle', .16)); },
  tap()   { tone(600, 0, .05, 'triangle', .06); },
};
