// ── Nhân vật chính ghép lớp ──
// Mỗi lớp (tóc sau, da, mặt, quần, áo, giày, tóc trước, phụ kiện) là một spritesheet
// có CÙNG bố cục khung. Ta chạy một đồng hồ chung và đặt cùng chỉ số khung cho mọi lớp,
// nên các lớp luôn khớp nhau. Lớp tô được (tint) nhân màu theo bảng màu đã chọn.

import { AssetLoader } from './AssetLoader.js';

declare const Phaser: any;

export interface AvatarLook {
  variants: Record<string, string | null>;   // slot → asset id (null = không có)
  colors: Record<string, string>;            // 'skin' | 'hair' | 'top' | 'bottom' | 'shoes' → hex
}

const toInt = (hex: string) => parseInt(String(hex).replace('#', ''), 16);

export function avatarConfig(): any { return AssetLoader.data('avatar'); }

/** Diện mạo mặc định từ manifest. */
export function defaultLook(): AvatarLook {
  const cfg = avatarConfig();
  const d = cfg.defaults || {};
  const variants: Record<string, string | null> = {};
  const isHex = (v: any) => typeof v === 'string' && v.startsWith('#');
  for (const L of cfg.layers) {
    const v = d[L.slot];
    // defaults.top/bottom/shoes có thể là mã màu (#hex) thay vì asset id → lấy kiểu đầu tiên
    variants[L.slot] = L.slot in d && !isHex(v) ? v : (L.variants.find((x: any) => x.id)?.id ?? null);
  }
  const pal = cfg.palettes || {};
  const pick = (v: any, list: string[], fb: string) => (typeof v === 'number' ? list?.[v] : isHex(v) ? v : null) || list?.[0] || fb;
  return {
    variants,
    colors: {
      skin: pick(d.skin, pal.skin, '#f9cfae'),
      hair: pick(d.hair, pal.hair, '#7a4b2e'),
      top: pick(d.topColor ?? d.top, pal.cloth, '#ffac6b'),
      bottom: pick(d.bottomColor ?? d.bottom, pal.cloth, '#7cc3ee'),
      shoes: pick(d.shoesColor ?? d.shoes, pal.shoes, '#c7b5f0'),
    },
  };
}

/** Mọi asset id cần nạp cho một diện mạo. */
export function lookAssetIds(look: AvatarLook): string[] {
  return Object.values(look.variants).filter(Boolean) as string[];
}
export function allAvatarAssetIds(): string[] {
  const cfg = avatarConfig();
  return cfg.layers.flatMap((L: any) => L.variants.map((v: any) => v.id)).filter(Boolean);
}

export class LayeredAvatar {
  scene: any;
  container: any;
  sprites: Record<string, any> = {};
  cfg: any;
  look: AvatarLook;
  anim = 'idle-down';
  t = 0;
  flip = false;
  onComplete: (() => void) | null = null;

  constructor(scene: any, x: number, y: number, look: AvatarLook = defaultLook()) {
    this.scene = scene;
    this.cfg = avatarConfig();
    this.container = scene.add.container(x, y);
    this.look = look;
    const [ox, oy] = this.cfg.origin || [0.5, 0.92];
    for (const L of this.cfg.layers) {
      const s = scene.add.sprite(0, 0, '__DEFAULT');
      s.setOrigin(ox, oy);
      s.setScale(this.cfg.scale ?? 0.5);
      this.sprites[L.slot] = s;
      this.container.add(s);
    }
    this.setLook(look);
    this.apply();
  }

  setLook(look: AvatarLook) {
    this.look = look;
    for (const L of this.cfg.layers) {
      const s = this.sprites[L.slot];
      const id = look.variants[L.slot];
      if (id && this.scene.textures.exists(id)) {
        s.setTexture(id);
        s.setVisible(true);
      } else {
        s.setVisible(false);
      }
      const colorKey = this.cfg.tintSlots?.[L.slot];
      if (L.tint && colorKey) {
        const hex = colorKey === 'cloth' ? (L.slot === 'bottom' ? look.colors.bottom : look.colors.top) : look.colors[colorKey];
        if (hex) s.setTint(toInt(hex)); else s.clearTint();
      } else {
        s.clearTint();
      }
    }
    this.apply();
  }

  play(key: string, restart = false, onComplete: (() => void) | null = null) {
    if (!this.cfg.anims[key]) return;
    if (this.anim !== key || restart) { this.anim = key; this.t = 0; }
    this.onComplete = onComplete;
  }

  setFlip(f: boolean) { this.flip = f; }

  frameIndex(): number {
    const a = this.cfg.anims[this.anim];
    const step = Math.floor(this.t * (a.frameRate || 8) / 1000);
    if (a.repeat === -1 || a.repeat === undefined) return a.start + (step % a.count);
    if (step >= a.count) {
      if (this.onComplete) { const cb = this.onComplete; this.onComplete = null; cb(); }
      return a.start + a.count - 1;
    }
    return a.start + step;
  }

  /** Đặt một khung tĩnh theo tên góc nhìn (front/side/back/threequarter). */
  showView(view: string) {
    const idx = this.cfg.views?.[view];
    if (idx === undefined) return;
    this.anim = '__static'; this.t = 0;
    for (const s of Object.values(this.sprites)) if (s.visible) s.setFrame(idx);
  }

  apply() {
    if (this.anim === '__static') return;
    const f = this.frameIndex();
    for (const s of Object.values(this.sprites)) {
      if (!s.visible) continue;
      s.setFrame(f);
      s.setFlipX(this.flip);
    }
  }

  update(dt: number) {
    if (this.anim === '__static') return;
    this.t += dt;
    this.apply();
  }

  set depth(d: number) { this.container.setDepth(d); }
  get x() { return this.container.x; }
  get y() { return this.container.y; }
  setPosition(x: number, y: number) { this.container.setPosition(x, y); }
  setScale(s: number) { this.container.setScale(s); }
  destroy() { this.container.destroy(); }
}

/** Diện mạo đã lưu (có thể cũ/hỏng) → diện mạo hợp lệ với manifest hiện tại. */
export function validLook(s: any): AvatarLook {
  const d = defaultLook();
  try {
    if (s && s.variants && s.colors) {
      const cfg = avatarConfig();
      const ok = cfg.layers.every((L: any) => !(L.slot in s.variants) || s.variants[L.slot] === null || L.variants.some((v: any) => v.id === s.variants[L.slot]));
      if (ok) return { variants: { ...d.variants, ...s.variants }, colors: { ...d.colors, ...s.colors } };
    }
  } catch (e) { /* bỏ qua */ }
  return d;
}
