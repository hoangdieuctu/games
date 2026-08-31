// ── Khởi động: nối các module lại và chạy vòng lặp khung hình ──

import { G } from './state.js';
import { loadPlayer, loadDay, resetPlayer } from './player.js';
import { loadShop, resetShop } from './upgrades.js';
import { loadWardrobe, resetWardrobe } from './wardrobe.js';
import { loadDecor, resetDecor } from './decor.js';
import { layout } from './layout.js';
import { bindInput } from './input.js';
import { update, prepareDay, bindDayFlow } from './game.js';
import { draw } from './render.js';
import { bindUi, updateHud } from './ui.js';
import { initSoundToggle, initMusicToggle, startMusic, ac } from './audio.js';

G.canvas = document.getElementById('cv');
G.ctx = G.canvas.getContext('2d');

loadPlayer();
loadShop();
loadWardrobe();
loadDecor();
G.day = loadDay();
layout();
bindInput();
initSoundToggle(document.getElementById('snd-btn'));
initMusicToggle(document.getElementById('music-btn'));

const flow = bindDayFlow();
bindUi({
  onStart: () => { ac(); startMusic(); flow.onStart(); updateHud(); },
  onRetry: () => { flow.onRetry(); updateHud(); },
  onNext: flow.onNext,
  // xoá hết dữ liệu cũ rồi dựng lại Ngày 1 (giữ cài đặt âm thanh)
  onReset: () => {
    resetPlayer();
    resetShop();
    resetWardrobe();
    resetDecor();
    G.running = false;
    G.paused = false;
    G.day = 1;
    prepareDay();
    updateHud();
  },
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
updateHud();
requestAnimationFrame(tick);

// hook gỡ lỗi trong console
window.__rest = G;
window.__step = (dt, n) => { for (let i = 0; i < (n || 1); i++) { update(dt || 0.05); draw(dt || 0.05); } };
