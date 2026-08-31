// ── Khởi động: nối các module, vòng lặp khung hình ──

import { G, loadDay } from './state.js';
import { loadShop } from './upgrades.js';
import { loadDecor } from './decor.js';
import { layout } from './layout.js';
import { bindInput } from './input.js';
import { update, prepareDay, bindDayFlow } from './game.js';
import { draw } from './render.js';
import { bindUi } from './ui.js';
import { initSoundToggle, initMusicToggle, startMusic, ac } from './audio.js';

G.canvas = document.getElementById('cv');
G.ctx = G.canvas.getContext('2d');

loadDay();
loadShop();
loadDecor();
layout();
bindInput();
initSoundToggle(document.getElementById('snd-btn'));
initMusicToggle(document.getElementById('music-btn'));

const flow = bindDayFlow();
bindUi({
  onStart: () => { ac(); startMusic(); flow.onStart(); },
  onRetry: flow.onRetry,
  onNext: flow.onNext,
});

window.addEventListener('resize', layout);
window.addEventListener('orientationchange', () => setTimeout(layout, 120));

let lastT = 0;
function tick(t) {
  const dt = Math.min(0.05, (t - lastT) / 1000 || 0.016);
  lastT = t;
  update(dt);
  draw(dt);
  requestAnimationFrame(tick);
}

prepareDay();
requestAnimationFrame(tick);

// hook gỡ lỗi trong console
window.__spa = G;
window.__spaStep = (dt) => { update(dt); };
window.__step = (dt, n) => { for (let i = 0; i < (n || 1); i++) { update(dt || 0.05); draw(dt || 0.05); } };
