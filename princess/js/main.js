// ── Khởi động: nền lấp lánh, màn tiêu đề, âm thanh, gắn sự kiện ──
import { $ } from './ui.js';
import { renderPrincess } from './princess.js';
import { DEFAULT_LOOK } from './config.js';
import { bindGame, openMap, showScreen } from './game.js';
import { initSoundToggle, initMusicToggle, startMusic, sTap } from './audio.js';

// nền lấp lánh
(function bg() {
  const box = $('bg-fx');
  const em = ['✨', '💖', '⭐', '🌸', '💜', '🎀'];
  for (let i = 0; i < 26; i++) {
    const s = document.createElement('span');
    s.textContent = em[i % em.length];
    s.style.left = Math.random() * 100 + '%';
    s.style.top = Math.random() * 100 + '%';
    s.style.setProperty('--d', (3 + Math.random() * 4) + 's');
    s.style.setProperty('--dl', (Math.random() * 5) + 's');
    s.style.fontSize = (12 + Math.random() * 18) + 'px';
    box.appendChild(s);
  }
})();

// công chúa trang bìa
renderPrincess($('title-hero'), Object.assign({}, DEFAULT_LOOK, {
  hair: 'wavy', hairColor: 'blonde', dress: 'ball', dressColor: 'pink', pattern: 'stars', crown: 'big',
  lips: 'pink', blush: 'pink', eyeshadow: 'pink', eyes: 'blue', earrings: 'pearl', necklace: 'gem',
  gloves: 'white', shoes: 'glass', hand: 'wand', skin: '#ffe0c8',
}), { idp: 'title' });

document.querySelectorAll('.snd-btn').forEach((b) => initSoundToggle(b));
document.querySelectorAll('.music-btn').forEach((b) => initMusicToggle(b));

// nhạc nền bắt đầu sau lần chạm đầu (chính sách autoplay của trình duyệt)
const kick = () => { startMusic(); document.removeEventListener('pointerdown', kick); };
document.addEventListener('pointerdown', kick);

bindGame();
$('btn-play').addEventListener('click', () => { sTap(); openMap(); });
$('map-back').addEventListener('click', () => { sTap(); showScreen('scr-title'); });

// chặn zoom hai ngón / double tap trên iPad
document.addEventListener('gesturestart', (e) => e.preventDefault());
document.addEventListener('dblclick', (e) => e.preventDefault(), { passive: false });
