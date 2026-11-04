// ── Nạp tài sản Little World theo manifest ──
// public/assets/asset-manifest.json do art/build-manifest.mjs sinh ra.
// Mỗi scene chỉ nạp nhóm nó cần (lọc theo tiền tố category) để mở nhanh trên điện thoại.

declare const Phaser: any;

export const ASSET_BASE = 'public/assets/';
export const MANIFEST_KEY = 'lw-manifest';

export interface AnimDef { key: string; frames: number[]; frameRate: number; repeat: number; }
export interface AssetEntry {
  id: string; file: string; type: 'image' | 'spritesheet' | 'json'; category: string;
  width: number; height: number; format: string; scale: number; origin: [number, number];
  usage?: string; tags?: string[]; footprint?: [number, number];
  frameWidth?: number; frameHeight?: number; frames?: number; animations?: AnimDef[];
}
export interface Manifest { version: number; entries: AssetEntry[]; data: Record<string, any>; }

let manifest: Manifest | null = null;
const byId = new Map<string, AssetEntry>();

export const AssetLoader = {
  /** Gọi trong preload() của scene khởi động. */
  queueManifest(scene: any) {
    scene.load.json(MANIFEST_KEY, ASSET_BASE + 'asset-manifest.json');
  },

  /** Gọi sau khi manifest đã nạp (create() của scene khởi động). */
  init(scene: any): Manifest {
    manifest = scene.cache.json.get(MANIFEST_KEY) as Manifest;
    if (!manifest) throw new Error('Không đọc được asset-manifest.json');
    byId.clear();
    for (const e of manifest.entries) byId.set(e.id, e);
    return manifest;
  },

  get manifest(): Manifest { return manifest as Manifest; },
  data(key: string): any { return manifest ? manifest.data[key] : undefined; },
  entry(id: string): AssetEntry | undefined { return byId.get(id); },
  url(id: string): string { const e = byId.get(id); return e ? ASSET_BASE + e.file : ''; },
  byCategory(prefix: string): AssetEntry[] {
    return manifest ? manifest.entries.filter((e) => e.category === prefix || e.category.startsWith(prefix + '/')) : [];
  },

  /** Xếp hàng nạp các entry (bỏ qua cái đã có texture). Trả về số file đã xếp. */
  queue(scene: any, entries: AssetEntry[]): number {
    let n = 0;
    for (const e of entries) {
      if (!e || scene.textures.exists(e.id)) continue;
      const url = ASSET_BASE + e.file;
      if (e.type === 'spritesheet') {
        scene.load.spritesheet(e.id, url, { frameWidth: e.frameWidth, frameHeight: e.frameHeight });
      } else if (e.type === 'image') {
        if (e.format === 'svg') scene.load.svg(e.id, url, { width: e.width, height: e.height });
        else scene.load.image(e.id, url);
      } else continue;
      n++;
    }
    return n;
  },
  queueIds(scene: any, ids: (string | null | undefined)[]): number {
    return this.queue(scene, ids.filter(Boolean).map((id) => byId.get(id as string)).filter(Boolean) as AssetEntry[]);
  },
  queueCategories(scene: any, prefixes: string[]): number {
    return this.queue(scene, prefixes.flatMap((p) => this.byCategory(p)));
  },

  /** Nạp ngay (ngoài preload), gọi cb khi xong. */
  loadNow(scene: any, ids: string[], cb: () => void) {
    const n = this.queueIds(scene, ids);
    if (!n) { cb(); return; }
    scene.load.once('complete', () => { this.createAnimations(scene); cb(); });
    scene.load.start();
  },

  /** Tạo mọi animation khai báo trong manifest cho texture đã nạp. */
  createAnimations(scene: any) {
    if (!manifest) return;
    for (const e of manifest.entries) {
      if (!e.animations || !scene.textures.exists(e.id)) continue;
      for (const a of e.animations) {
        if (scene.anims.exists(a.key)) continue;
        scene.anims.create({
          key: a.key,
          frames: scene.anims.generateFrameNumbers(e.id, { frames: a.frames }),
          frameRate: a.frameRate || 8,
          repeat: a.repeat === undefined ? -1 : a.repeat,
        });
      }
    }
  },

  /** Đặt một ảnh theo đúng scale/origin của manifest. */
  image(scene: any, id: string, x: number, y: number): any {
    const e = byId.get(id);
    const img = scene.add.image(x, y, id);
    if (e) {
      img.setScale(e.scale ?? 1);
      img.setOrigin(e.origin?.[0] ?? 0.5, e.origin?.[1] ?? 0.5);
    }
    return img;
  },
  sprite(scene: any, id: string, x: number, y: number): any {
    const e = byId.get(id);
    const s = scene.add.sprite(x, y, id);
    if (e) {
      s.setScale(e.scale ?? 1);
      s.setOrigin(e.origin?.[0] ?? 0.5, e.origin?.[1] ?? 0.5);
      if (e.animations && e.animations.length && scene.anims.exists(e.animations[0].key)) s.play(e.animations[0].key);
    }
    return s;
  },
};
