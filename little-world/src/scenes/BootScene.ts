// ── Khởi động: đọc manifest rồi mở màn hình theo #hash ──
// #home · #island · #map · #map/<vùng> · #wardrobe · #play/<hoạt động>
import { AssetLoader } from '../services/AssetLoader.js';
import { Store } from '../services/Store.js';
import { Ui } from '../services/Ui.js';
import { actById } from '../data/Content.js';

declare const Phaser: any;

export interface Route { key: string; data?: any; }

export function routeFromHash(): Route {
  const [h, arg] = location.hash.replace('#', '').split('/');
  if (!Store.p) return { key: 'Home' };
  if (h === 'map') return { key: 'WorldMap', data: { region: arg || null } };
  if (h === 'wardrobe') return { key: 'Wardrobe' };
  if (h === 'home') return { key: 'Home' };
  if (h === 'play' && arg) {
    const a = actById(arg);
    if (a && Store.regionOpen(a.region)) return { key: a.scene, data: { act: a.id } };
    if (a) return { key: 'WorldMap', data: { region: a.region } };
  }
  return { key: 'Island' };
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
    if (Store.p) Store.startSession();
    const r = routeFromHash();
    Ui.route = r.key;
    this.scene.start(r.key, r.data);
  }
}
