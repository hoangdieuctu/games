// ── Màn 3: Phòng trưng bày nhân vật ──
// Bé (4 góc nhìn + animation + tuỳ biến từng lớp) và ba thú cưng (animation).
import { AssetLoader } from '../services/AssetLoader.js';
import { LayeredAvatar, avatarConfig, defaultLook, allAvatarAssetIds, AvatarLook } from '../services/LayeredAvatar.js';
import { Ui } from '../services/Ui.js';
import { preloadWithProgress } from './BootScene.js';

declare const Phaser: any;

const PET_IDS = ['fox', 'bunny', 'bear'];
const VIEWS: [string, string][] = [['front', 'Trước'], ['threequarter', '3/4'], ['side', 'Bên'], ['back', 'Sau']];
const ANIM_NAMES: Record<string, string> = {
  'idle-down': 'Đứng (trước)', 'idle-up': 'Đứng (sau)', 'idle-side': 'Đứng (bên)', 'idle-threequarter': 'Đứng (3/4)',
  'walk-down': 'Đi (trước)', 'walk-up': 'Đi (sau)', 'walk-side': 'Đi (bên)',
  'run-down': 'Chạy (trước)', 'run-up': 'Chạy (sau)', 'run-side': 'Chạy (bên)',
  happy: 'Vui vẻ', celebrate: 'Ăn mừng', think: 'Suy nghĩ', wave: 'Vẫy tay', interact: 'Tương tác',
  'idle-front': 'Đứng (trước)', 'walk-front': 'Đi (trước)', 'walk-back': 'Đi (sau)', greet: 'Chào',
};
const COLOR_SLOTS: [string, string, string][] = [['skin', 'Màu da', 'skin'], ['hair', 'Màu tóc', 'hair'], ['top', 'Màu áo', 'cloth'], ['bottom', 'Màu quần/váy', 'cloth'], ['shoes', 'Màu giày', 'shoes']];

export class CharacterGalleryScene extends Phaser.Scene {
  look: AvatarLook = null as any;
  hero: any;
  views: any[] = [];
  pets: Record<string, any> = {};
  bg: any;
  tab: 'avatar' | 'pets' = 'avatar';
  heroAnim = 'idle-down';
  petAnim: Record<string, string> = { fox: 'idle-front', bunny: 'idle-front', bear: 'idle-front' };
  labels: any[] = [];

  constructor() { super('Gallery'); }

  preload() {
    preloadWithProgress(this, () => {
      const pets = AssetLoader.data('pets') || {};
      return AssetLoader.queueIds(this, [...allAvatarAssetIds(), ...PET_IDS.map((p) => pets[p]?.sheet)]);
    }, 'Đang mời các bạn nhỏ ra chào…');
  }

  create() {
    Ui.setActiveTab('Gallery');
    AssetLoader.createAnimations(this);
    this.cameras.main.setBackgroundColor('#fff3dc');
    this.bg = this.add.graphics().setDepth(-10);
    this.look = this.loadLook();

    this.hero = new LayeredAvatar(this, 0, 0, this.look);
    this.hero.play(this.heroAnim);
    for (const [v] of VIEWS) {
      const a = new LayeredAvatar(this, 0, 0, this.look);
      a.showView(v);
      this.views.push(a);
    }
    const pets = AssetLoader.data('pets') || {};
    for (const p of PET_IDS) {
      const P = pets[p];
      if (!P || !this.textures.exists(P.sheet)) continue;
      const s = this.add.sprite(0, 0, P.sheet).setOrigin(...(P.origin || [0.5, 0.92]));
      s.setInteractive({ pixelPerfect: true, alphaTolerance: 40, useHandCursor: true });
      s.on('pointerup', () => this.playPet(p, 'greet'));
      this.pets[p] = s;
      this.playPet(p, 'idle-front');
    }
    this.hero.container.setSize(120, 180);

    this.layout();
    this.scale.on('resize', this.layout, this);
    this.events.once('shutdown', () => { this.scale.off('resize', this.layout, this); Ui.clearPanel(); });
    this.buildPanel();
  }

  // ───────────── diện mạo ─────────────
  loadLook(): AvatarLook {
    try {
      const s = JSON.parse(localStorage.getItem('lw-look') || 'null');
      if (s && s.variants && s.colors) {
        const cfg = avatarConfig();
        const ok = cfg.layers.every((L: any) => !(L.slot in s.variants) || s.variants[L.slot] === null || L.variants.some((v: any) => v.id === s.variants[L.slot]));
        if (ok) return { variants: { ...defaultLook().variants, ...s.variants }, colors: { ...defaultLook().colors, ...s.colors } };
      }
    } catch (e) { /* bỏ qua */ }
    return defaultLook();
  }
  saveLook() { try { localStorage.setItem('lw-look', JSON.stringify(this.look)); } catch (e) { /* bỏ qua */ } }

  applyLook() {
    this.hero.setLook(this.look);
    for (let i = 0; i < this.views.length; i++) { this.views[i].setLook(this.look); this.views[i].showView(VIEWS[i][0]); }
    this.saveLook();
  }

  randomize() {
    const cfg = avatarConfig();
    const pick = (a: any[]) => a[Math.floor(Math.random() * a.length)];
    for (const L of cfg.layers) if (L.variants.length > 1) this.look.variants[L.slot] = pick(L.variants).id;
    if (hasHairPair(cfg)) this.look.variants.hairBack = matchingHairBack(cfg, this.look.variants.hairFront);
    for (const [k, , pal] of COLOR_SLOTS) this.look.colors[k] = pick(cfg.palettes[pal] || [this.look.colors[k]]);
    this.applyLook();
    this.hero.play('celebrate', true, () => this.hero.play(this.heroAnim));
    this.buildPanel();
  }

  playPet(p: string, anim: string) {
    const s = this.pets[p]; if (!s) return;
    const key = `${p}-${anim}`;
    if (!this.anims.exists(key)) return;
    s.play(key);
    const def = this.anims.get(key);
    if (def && def.repeat !== -1) s.once('animationcomplete', () => s.play(`${p}-${this.petAnim[p]}`));
    else this.petAnim[p] = anim;
  }

  // ───────────── bố cục ─────────────
  layout() {
    const W = this.scale.width, H = this.scale.height;
    const panel = document.getElementById('panel');
    const pr = panel && !panel.hidden ? panel.getBoundingClientRect() : null;
    const dpr = W / window.innerWidth;
    const portrait = window.innerWidth < 760;
    // vùng trống cho sân khấu (đơn vị pixel game)
    const top = 64 * dpr;
    let areaW = W, areaH = H - top;
    if (pr) {
      if (portrait) areaH = (pr.top * dpr) - top;
      else areaW = pr.left * dpr;
    }
    const cx = areaW / 2;
    const unit = Math.min(areaW / 7.2, areaH / 4.4); // ~ chiều cao một "ô" nhân vật

    this.bg.clear();
    this.bg.fillGradientStyle(0xdff3fd, 0xdff3fd, 0xfff3dc, 0xfff3dc, 1).fillRect(0, 0, W, H);
    const ped = (x: number, y: number, rx: number, c: number) => {
      this.bg.fillStyle(0x4c3876, 0.12).fillEllipse(x + rx * 0.06, y + rx * 0.08, rx * 2.05, rx * 0.62);
      this.bg.fillStyle(c, 1).fillEllipse(x, y, rx * 2, rx * 0.56);
      this.bg.fillStyle(0xffffff, 0.45).fillEllipse(x - rx * 0.2, y - rx * 0.08, rx * 1.1, rx * 0.2);
    };

    // hàng trên: bé lớn + 4 góc nhìn nhỏ
    const heroY = top + unit * 2.1;
    const heroScale = (unit * 1.75) / 96;
    const heroX = portrait ? cx : cx - unit * 1.6;
    ped(heroX, heroY, unit * 0.75, 0xffd96b);
    this.hero.setPosition(heroX, heroY);
    this.hero.setScale(heroScale);

    const vScale = (unit * 0.78) / 96;
    const vx0 = portrait ? cx - unit * 1.65 : cx + unit * 0.4;
    const vy = portrait ? heroY + unit * 1.05 : top + unit * 1.35;
    const vgap = portrait ? unit * 1.1 : unit * 0.95;
    for (let i = 0; i < this.views.length; i++) {
      const x = vx0 + i * vgap;
      ped(x, vy, unit * 0.32, 0xc7b5f0);
      this.views[i].setPosition(x, vy);
      this.views[i].setScale(vScale);
    }
    for (const l of this.labels) l.destroy();
    this.labels = [];
    const fs = Math.max(12, unit * 0.16);
    VIEWS.forEach(([, name], i) => {
      this.labels.push(this.add.text(vx0 + i * vgap, vy + unit * 0.2, name, { fontFamily: 'Nunito, sans-serif', fontSize: fs + 'px', fontStyle: '800', color: '#6f5a8a' }).setOrigin(0.5, 0));
    });

    // hàng dưới: ba thú cưng
    const petY = portrait ? vy + unit * 1.45 : top + unit * 3.6;
    const petScale = (unit * 1.5) / 80;
    const pets = AssetLoader.data('pets') || {};
    PET_IDS.forEach((p, i) => {
      const s = this.pets[p]; if (!s) return;
      const x = (portrait ? cx : cx + unit * 0.8) + (i - 1) * unit * 1.25;
      ped(x, petY, unit * 0.46, [0xffc9a3, 0xffdbe5, 0xe6b386][i]);
      s.setPosition(x, petY).setScale(petScale * (pets[p].scale ?? 0.5));
      this.labels.push(this.add.text(x, petY + unit * 0.22, pets[p].name || p, { fontFamily: 'Nunito, sans-serif', fontSize: fs * 1.1 + 'px', fontStyle: '800', color: '#4b3a5e' }).setOrigin(0.5, 0));
    });
  }

  // ───────────── bảng điều khiển ─────────────
  buildPanel() {
    const cfg = avatarConfig();
    const pets = AssetLoader.data('pets') || {};
    let body = '';
    if (this.tab === 'avatar') {
      const anims = Object.keys(cfg.anims).map((k) => `<button class="chip ${k === this.heroAnim ? 'on' : ''}" data-anim="${k}">${Ui.esc(ANIM_NAMES[k] || k)}</button>`).join('');
      const slots = cfg.layers.filter((L: any) => L.variants.length > 1 && !(L.slot === 'hairBack' && hasHairPair(cfg))).map((L: any) => {
        const i = Math.max(0, L.variants.findIndex((v: any) => v.id === this.look.variants[L.slot]));
        return `<div class="opt"><span>${Ui.esc(SLOT_NAMES[L.slot] || L.slot)}</span>
          <button class="btn icon" data-slot="${L.slot}" data-d="-1" aria-label="Trước">‹</button>
          <b>${Ui.esc(L.variants[i]?.name || '')}</b>
          <button class="btn icon" data-slot="${L.slot}" data-d="1" aria-label="Sau">›</button></div>`;
      }).join('');
      const colors = COLOR_SLOTS.map(([k, name, pal]) => `<div class="opt col"><span>${name}</span><div class="sw">${(cfg.palettes[pal] || []).map((hex: string) =>
        `<button class="swatch ${hex === this.look.colors[k] ? 'on' : ''}" style="background:${hex}" data-color="${k}" data-hex="${hex}" aria-label="${hex}"></button>`).join('')}</div></div>`).join('');
      body = `<h4>Animation</h4><div class="chips">${anims}</div>
        <h4>Tuỳ biến <button class="btn small accent" data-a="rand">Ngẫu nhiên</button> <button class="btn small ghost" data-a="reset">Mặc định</button></h4>
        <div class="opts">${slots}</div><div class="opts">${colors}</div>`;
    } else {
      body = PET_IDS.filter((p) => pets[p]).map((p) => {
        const P = pets[p];
        const portrait = AssetLoader.entry(`${p}-portrait`) ? `<img src="${AssetLoader.url(`${p}-portrait`)}" alt="">` : '';
        const anims = Object.keys(P.anims).map((k) => `<button class="chip ${k === this.petAnim[p] ? 'on' : ''}" data-pet="${p}" data-anim="${k}">${Ui.esc(ANIM_NAMES[k] || k)}</button>`).join('');
        return `<div class="petcard">${portrait}<div><h4>${Ui.esc(P.name || p)}</h4><p>${Ui.esc(P.personality || '')}</p></div></div><div class="chips">${anims}</div>`;
      }).join('') + `<div class="row"><button class="btn accent" data-a="allcele">Cả ba cùng ăn mừng</button><button class="btn" data-a="allgreet">Cả ba cùng chào</button></div>`;
    }
    const el = Ui.panel(`
      <div class="seg wide"><button data-tab="avatar" class="${this.tab === 'avatar' ? 'on' : ''}">Bé</button><button data-tab="pets" class="${this.tab === 'pets' ? 'on' : ''}">Thú cưng</button></div>
      ${body}`, 'gallery-panel');
    el.onclick = (e: any) => {
      const b = e.target.closest('button'); if (!b) return;
      const d = b.dataset;
      if (d.tab) { this.tab = d.tab; this.buildPanel(); return; }
      if (d.pet && d.anim) { this.playPet(d.pet, d.anim); this.buildPanel(); return; }
      if (d.anim) {
        const a = cfg.anims[d.anim];
        if (a.repeat === -1 || a.repeat === undefined) { this.heroAnim = d.anim; this.hero.play(d.anim, true); this.hero.setFlip(false); }
        else this.hero.play(d.anim, true, () => this.hero.play(this.heroAnim));
        this.buildPanel(); return;
      }
      if (d.slot) {
        const L = cfg.layers.find((x: any) => x.slot === d.slot);
        const i = Math.max(0, L.variants.findIndex((v: any) => v.id === this.look.variants[L.slot]));
        const n = (i + Number(d.d) + L.variants.length) % L.variants.length;
        this.look.variants[L.slot] = L.variants[n].id;
        if (L.slot === 'hairFront' && hasHairPair(cfg)) this.look.variants.hairBack = matchingHairBack(cfg, L.variants[n].id);
        this.applyLook(); this.buildPanel(); return;
      }
      if (d.color) { this.look.colors[d.color] = d.hex; this.applyLook(); this.buildPanel(); return; }
      if (d.a === 'rand') this.randomize();
      else if (d.a === 'reset') { this.look = defaultLook(); this.applyLook(); this.buildPanel(); }
      else if (d.a === 'allcele') PET_IDS.forEach((p) => this.playPet(p, 'celebrate'));
      else if (d.a === 'allgreet') PET_IDS.forEach((p) => this.playPet(p, 'greet'));
    };
    this.time.delayedCall(30, () => this.layout());
  }

  update(_t: number, dt: number) {
    if (this.hero) this.hero.update(dt);
  }
}

const SLOT_NAMES: Record<string, string> = {
  hairBack: 'Tóc (sau)', body: 'Dáng', face: 'Gương mặt', bottom: 'Quần / váy', top: 'Áo', shoes: 'Giày', hairFront: 'Kiểu tóc', accessory: 'Phụ kiện',
};

// Tóc trước + tóc sau là một kiểu tóc: 'avatar-hairfront-bob' đi với 'avatar-hairback-bob' (nếu có)
function hasHairPair(cfg: any) { return cfg.layers.some((L: any) => L.slot === 'hairBack') && cfg.layers.some((L: any) => L.slot === 'hairFront'); }
function matchingHairBack(cfg: any, frontId: string | null): string | null {
  if (!frontId) return null;
  const want = frontId.replace('hairfront', 'hairback');
  const back = cfg.layers.find((L: any) => L.slot === 'hairBack');
  return back.variants.some((v: any) => v.id === want) ? want : null;
}
