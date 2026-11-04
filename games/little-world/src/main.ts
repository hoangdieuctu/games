// ── Little World — Phase 1: bản demo hình ảnh ──
// Ba màn: Bản đồ thế giới (#map), Đảo của bé (#island), Phòng nhân vật (#gallery).
import { BootScene, sceneFromHash } from './scenes/BootScene.js';
import { WorldMapPreviewScene } from './scenes/WorldMapPreviewScene.js';
import { IslandPreviewScene } from './scenes/IslandPreviewScene.js';
import { CharacterGalleryScene } from './scenes/CharacterGalleryScene.js';
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
  scene: [BootScene, WorldMapPreviewScene, IslandPreviewScene, CharacterGalleryScene],
});

window.addEventListener('resize', () => {
  const s = size();
  game.scale.resize(s.w, s.h);
  game.scale.setZoom(1 / DPR);
});

function goTo(key: string) {
  const running = game.scene.getScenes(true).map((s: any) => s.scene.key).filter((k: string) => k !== 'Boot');
  if (running.includes(key)) return;
  Ui.card(null); Ui.modal(null);
  for (const k of running) game.scene.stop(k);
  if (game.scene.getScene('Boot')?.sys.settings.status >= Phaser.Scenes.RUNNING || game.scene.isActive('Boot')) game.scene.stop('Boot');
  game.scene.start(key);
}

window.addEventListener('hashchange', () => {
  // chỉ chuyển khi manifest đã sẵn sàng (Boot xong)
  if (game.cache.json.exists('lw-manifest')) goTo(sceneFromHash());
});

document.querySelectorAll<HTMLElement>('.tabs button').forEach((b) => {
  b.addEventListener('click', () => {
    const h = ({ WorldMap: 'map', Island: 'island', Gallery: 'gallery' } as any)[b.dataset.scene as string];
    if (location.hash.replace('#', '') === h) goTo(b.dataset.scene as string);
    else location.hash = h;
  });
});

(window as any).__lw = game; // tiện cho kiểm thử
