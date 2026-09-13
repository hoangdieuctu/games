// ── Khởi động trò chơi ──
import { initUI, syncHud, showWin, showStuck } from './ui.js';
import { initGame } from './game.js';
import { startMusic } from './audio.js';

initUI();
initGame(document.getElementById('board'), {
  onChange: syncHud,
  onWin: showWin,
  onStuck: showStuck,
});
syncHud();

// iPad chỉ cho phát tiếng sau khi bé chạm màn hình lần đầu.
const kick = () => { startMusic(); window.removeEventListener('pointerdown', kick); };
window.addEventListener('pointerdown', kick);

// Chặn zoom hai ngón / nháy đúp để bàn chơi luôn đứng yên.
document.addEventListener('gesturestart', (e) => e.preventDefault());
let lastTouch = 0;
document.addEventListener('touchend', (e) => {
  const now = Date.now();
  if (now - lastTouch < 320) e.preventDefault();
  lastTouch = now;
}, { passive: false });
