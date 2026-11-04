// ── Khởi động: đọc manifest rồi mở màn hình theo #hash ──
import { AssetLoader } from '../services/AssetLoader.js';
import { Ui } from '../services/Ui.js';

declare const Phaser: any;

export const SCENES: Record<string, string> = { map: 'WorldMap', island: 'Island', gallery: 'Gallery' };

export function sceneFromHash(): string {
  const h = location.hash.replace('#', '');
  return SCENES[h] || 'WorldMap';
}

/** Gói preload chung: xếp hàng tài sản + thanh tiến trình. */
export function preloadWithProgress(scene: any, queue: () => number, label: string) {
  const n = queue();
  if (!n) return;
  Ui.loading(0, label);
  scene.load.on('progress', (p: number) => Ui.loading(p, label));
  scene.load.once('complete', () => Ui.loading(null));
  scene.load.on('loaderror', (f: any) => console.warn('Không tải được', f.key, f.src));
}

export class BootScene extends Phaser.Scene {
  constructor() { super('Boot'); }
  preload() {
    Ui.loading(0.05);
    AssetLoader.queueManifest(this);
  }
  create() {
    AssetLoader.init(this);
    // ảnh UI dùng chung (nhỏ) nạp sẵn
    this.scene.start(sceneFromHash());
  }
}
