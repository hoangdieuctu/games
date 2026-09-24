// ── Khởi động trò chơi ──
import { load } from './state.js';
import { initUI } from './ui.js';

window.__spReady = true;   // cho lớp báo lỗi biết mã trò chơi đã chạy được
load();
initUI();

// Chặn zoom hai ngón trên iPad để hai bức tranh luôn đứng yên.
document.addEventListener('gesturestart', (e) => e.preventDefault());
