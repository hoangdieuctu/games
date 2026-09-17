// ── Khởi động trò chơi ──
import { initUI, syncHud, showWin, showStuck, persistBoard } from './ui.js';
import { initGame } from './game.js';

window.__csReady = true;   // cho lớp báo lỗi biết mã trò chơi đã chạy được

initUI();
initGame(document.getElementById('board'), {
  onChange: () => { syncHud(); persistBoard(); },
  onWin: showWin,
  onStuck: showStuck,
});
syncHud();

// Chặn zoom hai ngón cho bàn chơi luôn đứng yên. Nháy đúp đã được
// `touch-action: manipulation` trong CSS lo, không tự chặn touchend ở đây nữa —
// làm vậy sẽ nuốt luôn cú chạm thứ hai vào các nút.
document.addEventListener('gesturestart', (e) => e.preventDefault());
