// ── Thế Giới Nhỏ (Little World) ──
// Đảo của bé · Bản đồ 6 vùng · 11 hoạt động · phần thưởng, túi đồ, huy hiệu · góc phụ huynh.
import { BootScene, routeFromHash } from './scenes/BootScene.js';
import { HomeScene } from './scenes/HomeScene.js';
import { WorldMapScene } from './scenes/WorldMapScene.js';
import { IslandScene } from './scenes/IslandScene.js';
import { WardrobeScene } from './scenes/WardrobeScene.js';
import { AnimalMatchScene } from './games/AnimalMatch.js';
import { MemoryScene } from './games/Memory.js';
import { ShapePuzzleScene } from './games/ShapePuzzle.js';
import { CountCollectScene } from './games/CountCollect.js';
import { BuilderScene } from './games/Builder.js';
import { SortScene } from './games/Sort.js';
import { PatternScene } from './games/Pattern.js';
import { ColoringScene } from './games/Coloring.js';
import { PetCareScene } from './games/PetCare.js';
import { Store } from './services/Store.js';
import { Audio } from './services/Audio.js';
import { Hud } from './services/Hud.js';
import { Parent } from './services/Parent.js';
import { Ui } from './services/Ui.js';

declare const Phaser: any;

// Vẽ canvas theo điểm ảnh thật của màn hình (nét trên retina), hiển thị thu lại bằng zoom.
const DPR = Math.min(2, window.devicePixelRatio || 1);
const size = () => ({ w: Math.round(window.innerWidth * DPR), h: Math.round(window.innerHeight * DPR) });
const s0 = size();

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  width: s0.w,
  height: s0.h,
  backgroundColor: '#a8dcf7',
  scale: { mode: Phaser.Scale.NONE, zoom: 1 / DPR },
  render: { antialias: true, roundPixels: false, powerPreference: 'high-performance' },
  input: { activePointers: 3 },
  scene: [BootScene, HomeScene, WorldMapScene, IslandScene, WardrobeScene,
    AnimalMatchScene, MemoryScene, ShapePuzzleScene, CountCollectScene, BuilderScene, SortScene, PatternScene, ColoringScene, PetCareScene],
});

window.addEventListener('resize', () => {
  const s = size();
  game.scale.resize(s.w, s.h);
  game.scale.setZoom(1 / DPR);
});

let current = '';
function go() {
  if (!game.cache.json.exists('lw-manifest')) return;    // Boot chưa xong
  const r = routeFromHash();
  const key = r.key + JSON.stringify(r.data || {});
  if (key === current) return;
  current = key;
  Ui.route = r.key;
  Ui.card(null); Ui.modal(null); Hud.hideGuide();
  for (const s of game.scene.getScenes(true)) game.scene.stop(s.scene.key);
  game.scene.start(r.key, r.data);
}
window.addEventListener('hashchange', go);
window.addEventListener('lw-profile', () => { current = ''; Hud.render(); go(); });

document.querySelectorAll<HTMLElement>('.tabs button').forEach((b) => {
  b.addEventListener('click', () => {
    Audio.sfx('tap');
    if (location.hash.replace('#', '') === b.dataset.h) { current = ''; go(); } else location.hash = b.dataset.h as string;
  });
});
document.getElementById('btn-parent')!.addEventListener('click', () => { Audio.sfx('tap'); Parent.open(); });

// ── toàn màn hình (ẩn nút nếu trình duyệt không hỗ trợ, ví dụ iPhone, hoặc đã mở từ màn hình chính) ──
{
  const d: any = document, root: any = document.documentElement;
  const btn = document.getElementById('btn-fs')!;
  const fsEl = () => d.fullscreenElement || d.webkitFullscreenElement;
  const can = !!(root.requestFullscreen || root.webkitRequestFullscreen) && !(window.navigator as any).standalone
    && !matchMedia('(display-mode: standalone), (display-mode: fullscreen)').matches;
  btn.hidden = !can;
  const sync = () => {
    const on = !!fsEl();
    btn.classList.toggle('on', on);
    btn.setAttribute('aria-label', on ? 'Thoát toàn màn hình' : 'Toàn màn hình');
    btn.title = btn.getAttribute('aria-label')!;
  };
  btn.addEventListener('click', () => {
    Audio.sfx('tap');
    try {
      if (fsEl()) (d.exitFullscreen || d.webkitExitFullscreen).call(d);
      else {
        const r = (root.requestFullscreen || root.webkitRequestFullscreen).call(root, { navigationUI: 'hide' });
        Promise.resolve(r).catch(() => {});
      }
    } catch (e) { /* trình duyệt từ chối */ }
  });
  document.addEventListener('fullscreenchange', sync);
  document.addEventListener('webkitfullscreenchange', sync);
}

// Âm thanh chỉ bật sau lần chạm đầu tiên
window.addEventListener('pointerdown', () => Audio.unlock(), { once: true });

// Ước tính thời gian chơi (chỉ khi trang đang hiển thị)
setInterval(() => { if (document.visibilityState === 'visible' && Store.p) Store.tickPlaytime(15000); }, 15000);

// Chơi ngoại tuyến sau lần tải đầu tiên
if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  navigator.serviceWorker.register('sw.js').catch(() => { /* không bắt buộc */ });
}

(window as any).__lw = game; // tiện cho kiểm thử
(window as any).__lwStore = Store;
