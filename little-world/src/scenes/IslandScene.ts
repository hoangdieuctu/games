// ── Màn 2: Xem trước đảo của bé ──
// Dạo chơi: chạm mặt đất để bé đi tới, thú cưng đi theo.
// Sắp xếp: kéo thả đồ vật, chọn đồ trong túi đồ rồi chạm để đặt, lật / cất đồ.
import { AssetLoader } from '../services/AssetLoader.js';
import { CameraControls } from '../services/CameraControls.js';
import { LayeredAvatar, defaultLook, lookAssetIds } from '../services/LayeredAvatar.js';
import { Ui } from '../services/Ui.js';
import { preloadWithProgress } from './BootScene.js';

declare const Phaser: any;

const PET_IDS = ['fox', 'bunny', 'bear'];
const SNAP = 16;

export class IslandPreviewScene extends Phaser.Scene {
  L: any;
  controls: any;
  walk: any;
  grid: any;
  avatar: any;
  pet: any;
  petId = 'fox';
  objs: any[] = [];
  mode: 'play' | 'edit' = 'play';
  selected: any = null;
  selRing: any;
  placing: string | null = null;
  ghost: any = null;
  target: { x: number; y: number } | null = null;
  facing = 'down';
  running = false;
  petBusy = false;
  dragFrom: { x: number; y: number } | null = null;
  tapMarker: any;

  constructor() { super('Island'); }

  preload() {
    preloadWithProgress(this, () => {
      const pets = AssetLoader.data('pets') || {};
      const ids = [
        ...lookAssetIds(defaultLook()),
        ...PET_IDS.map((p) => pets[p]?.sheet),
      ];
      return AssetLoader.queueCategories(this, ['island', 'environment']) + AssetLoader.queueIds(this, ids);
    }, 'Đang ghé thăm đảo của bé…');
  }

  create() {
    Ui.setActiveTab('Island');
    AssetLoader.createAnimations(this);
    const L = this.L = AssetLoader.data('island');
    this.cameras.main.setBackgroundColor('#5ab4e0');

    this.add.image(0, 0, L.terrain).setOrigin(0, 0).setDisplaySize(L.width, L.height).setDepth(-10);
    if (L.gridOverlay && this.textures.exists(L.gridOverlay)) {
      this.grid = this.add.image(0, 0, L.gridOverlay).setOrigin(0, 0).setDisplaySize(L.width, L.height).setDepth(-5).setVisible(false);
    }
    this.walk = new Phaser.Geom.Polygon(L.walkArea.flat());

    for (const o of L.objects) this.addObject(o.asset, o.x, o.y, !!o.flipX);

    this.selRing = this.add.graphics().setDepth(-1);
    this.tapMarker = this.add.graphics().setDepth(-2);

    // bé + thú cưng
    const [ax, ay] = L.spawn.avatar;
    this.avatar = new LayeredAvatar(this, ax, ay);
    this.avatar.container.setSize(60, 90);
    this.avatar.container.setInteractive(new Phaser.Geom.Rectangle(-30, -84, 60, 88), Phaser.Geom.Rectangle.Contains);
    this.avatar.container.on('pointerup', () => {
      if (this.mode !== 'play' || this.controls.dragging) return;
      this.target = null;
      this.avatar.play('wave', true, () => this.avatar.play('idle-down'));
    });
    this.spawnPet(this.petId);

    this.controls = new CameraControls(this, {
      width: L.width, height: L.height, maxZoom: 3.5,
      onTap: (_p, x, y) => this.tap(x, y),
      onHover: (x, y) => this.moveGhost(x, y),
    });
    this.cameras.main.setZoom(this.controls.minZoom * (this.scale.width > this.scale.height ? 1.35 : 1));
    this.cameras.main.centerOn(ax, ay - 120);

    // kéo thả đồ (chế độ sắp xếp)
    this.input.on('gameobjectdown', (_p: any, obj: any) => {
      if (this.mode !== 'edit' || !obj.getData('placed') || this.placing) return;
      this.controls.locked = true;
      this.select(obj);
      this.dragFrom = { x: obj.x, y: obj.y };
    });
    this.input.on('drag', (_p: any, obj: any, dx: number, dy: number) => {
      if (this.mode !== 'edit' || !obj.getData('placed')) return;
      obj.setPosition(Math.round(dx / SNAP) * SNAP, Math.round(dy / SNAP) * SNAP);
      obj.setDepth(obj.y);
      obj.setTint(this.inside(obj.x, obj.y) ? 0xffffff : 0xff9b9b);
      this.drawSelection();
    });
    this.input.on('dragend', (_p: any, obj: any) => {
      obj.clearTint();
      if (!this.inside(obj.x, obj.y) && this.dragFrom) {
        this.tweens.add({ targets: obj, x: this.dragFrom.x, y: this.dragFrom.y, duration: 220, ease: 'Back.easeOut', onUpdate: () => this.drawSelection(), onComplete: () => obj.setDepth(obj.y) });
        Ui.toast('Chỉ đặt được trên đất của đảo');
      } else {
        this.bounce(obj);
      }
    });
    this.input.on('pointerup', () => { setTimeout(() => { this.controls.locked = false; }, 0); });

    this.buildPanel();
    this.events.once('shutdown', () => { Ui.clearPanel(); Ui.card(null); });
  }

  // ───────────── đồ vật ─────────────
  addObject(asset: string, x: number, y: number, flipX = false) {
    if (!this.textures.exists(asset)) return null;
    const s = AssetLoader.sprite(this, asset, x, y);
    s.setDepth(y).setFlipX(flipX);
    s.setData('placed', true).setData('asset', asset);
    s.setInteractive({ pixelPerfect: true, alphaTolerance: 40, draggable: false, useHandCursor: false });
    this.objs.push(s);
    return s;
  }

  inside(x: number, y: number) { return Phaser.Geom.Polygon.Contains(this.walk, x, y); }

  bounce(obj: any) {
    const sy = obj.scaleY;
    this.tweens.add({ targets: obj, scaleY: sy * 0.9, duration: 90, yoyo: true, ease: 'Quad.easeOut', onComplete: () => obj.setScale(obj.scaleX, sy) });
  }

  select(obj: any) {
    this.selected = obj;
    this.drawSelection();
    if (!obj) { Ui.card(null); return; }
    const e = AssetLoader.entry(obj.getData('asset'));
    const el = Ui.card(`
      <div class="card-head" style="--c:#a6e3c4"><img class="card-icon sq" src="${AssetLoader.url(obj.getData('asset'))}" alt="">
      <div><h3>${Ui.esc(e?.usage || obj.getData('asset'))}</h3><p>${Ui.esc(e?.category || '')}</p></div></div>
      <div class="row">
        <button class="btn" data-a="flip">Lật</button>
        <button class="btn" data-a="dup">Nhân bản</button>
        <button class="btn danger" data-a="del">Cất đi</button>
        <button class="btn ghost" data-a="close">Xong</button>
      </div>`, );
    el.onclick = (ev: any) => {
      const a = ev.target.closest('button')?.dataset.a;
      if (!a || !this.selected) return;
      const o = this.selected;
      if (a === 'flip') { o.setFlipX(!o.flipX); this.bounce(o); }
      else if (a === 'dup') {
        const n = this.addObject(o.getData('asset'), o.x + 64, o.y + 32, o.flipX);
        if (n) { if (this.mode === 'edit') this.input.setDraggable(n, true); this.select(n); this.bounce(n); }
      } else if (a === 'del') {
        this.objs = this.objs.filter((x) => x !== o);
        this.tweens.add({ targets: o, alpha: 0, scale: o.scale * 0.6, duration: 200, onComplete: () => o.destroy() });
        this.select(null);
      } else if (a === 'close') this.select(null);
    };
  }

  drawSelection() {
    const g = this.selRing; g.clear();
    const o = this.selected;
    if (!o || !o.active) return;
    const w = Math.max(40, o.displayWidth * 0.55);
    g.lineStyle(6, 0xffffff, 0.95).strokeEllipse(o.x, o.y, w, w * 0.36);
    g.lineStyle(3, 0xffac6b, 1).strokeEllipse(o.x, o.y, w + 10, w * 0.36 + 6);
  }

  // ───────────── chế độ ─────────────
  setMode(m: 'play' | 'edit') {
    this.mode = m;
    this.setPlacing(null);
    this.select(null);
    for (const o of this.objs) this.input.setDraggable(o, m === 'edit');
    if (this.grid) this.grid.setVisible(m === 'edit' || this.grid.getData('forced'));
    this.buildPanel();
  }

  setPlacing(id: string | null) {
    this.placing = id;
    if (this.ghost) { this.ghost.destroy(); this.ghost = null; }
    if (id) {
      this.select(null);
      this.ghost = AssetLoader.image(this, id, -999, -999).setAlpha(0.65).setDepth(99999);
      const p = this.input.activePointer;
      const w = this.cameras.main.getWorldPoint(p.x, p.y);
      this.moveGhost(w.x, w.y);
    }
    document.querySelectorAll<HTMLElement>('.palette button').forEach((b) => b.classList.toggle('on', b.dataset.id === id));
  }

  moveGhost(x: number, y: number) {
    if (!this.ghost) return;
    const sx = Math.round(x / SNAP) * SNAP, sy = Math.round(y / SNAP) * SNAP;
    this.ghost.setPosition(sx, sy);
    this.ghost.setTint(this.inside(sx, sy) ? 0xffffff : 0xff8f8f);
  }

  tap(x: number, y: number) {
    if (this.mode === 'edit') {
      if (this.placing) {
        const sx = Math.round(x / SNAP) * SNAP, sy = Math.round(y / SNAP) * SNAP;
        if (!this.inside(sx, sy)) { Ui.toast('Chỉ đặt được trên đất của đảo'); return; }
        const o = this.addObject(this.placing, sx, sy);
        if (o) { this.input.setDraggable(o, true); this.bounce(o); }
        return;
      }
      // chạm vào chỗ trống → bỏ chọn
      const hit = this.input.hitTestPointer(this.input.activePointer).filter((o: any) => o.getData && o.getData('placed'));
      if (!hit.length) this.select(null);
      return;
    }
    // dạo chơi: đi tới điểm chạm
    if (!this.inside(x, y)) { Ui.toast('Bé không bơi được đâu!'); return; }
    this.target = { x, y };
    const d = Math.hypot(x - this.avatar.x, y - this.avatar.y);
    this.running = d > 340;
    this.tapMarker.clear();
    this.tapMarker.lineStyle(5, 0xffffff, 0.9).strokeEllipse(x, y, 46, 18);
    this.tapMarker.setAlpha(1);
    this.tweens.killTweensOf(this.tapMarker);
    this.tweens.add({ targets: this.tapMarker, alpha: 0, duration: 700, delay: 150 });
  }

  // ───────────── thú cưng ─────────────
  spawnPet(id: string) {
    const pets = AssetLoader.data('pets') || {};
    const P = pets[id];
    if (!P || !this.textures.exists(P.sheet)) return;
    const pos = this.pet ? { x: this.pet.x, y: this.pet.y } : { x: this.L.spawn.pet[0], y: this.L.spawn.pet[1] };
    if (this.pet) this.pet.destroy();
    this.petId = id;
    const s = this.pet = this.add.sprite(pos.x, pos.y, P.sheet);
    s.setOrigin(...(P.origin || [0.5, 0.92])).setScale(P.scale ?? 0.5);
    s.setData('cfg', P);
    this.petPlay('greet', () => this.petPlay('idle-front'));
    s.setInteractive({ pixelPerfect: true, alphaTolerance: 40 });
    s.on('pointerup', () => {
      if (this.mode !== 'play' || this.controls.dragging) return;
      this.petPlay(Math.random() < 0.5 ? 'interact' : 'happy', () => this.petPlay('idle-front'));
    });
  }

  petPlay(anim: string, done?: () => void) {
    const key = `${this.petId}-${anim}`;
    if (!this.pet || !this.anims.exists(key)) return;
    if (done) {
      this.petBusy = true;
      this.pet.play(key);
      this.pet.once('animationcomplete', () => { this.petBusy = false; done(); });
    } else if (this.pet.anims.currentAnim?.key !== key) this.pet.play(key);
  }

  // ───────────── bảng điều khiển ─────────────
  buildPanel() {
    const L = this.L;
    const pets = AssetLoader.data('pets') || {};
    const petBtns = PET_IDS.filter((p) => pets[p]).map((p) => {
      const portrait = AssetLoader.entry(`${p}-portrait`) ? AssetLoader.url(`${p}-portrait`) : '';
      return `<button class="pet ${p === this.petId ? 'on' : ''}" data-pet="${p}" title="${Ui.esc(pets[p].name || p)}">${portrait ? `<img src="${portrait}" alt="">` : ''}<span>${Ui.esc(pets[p].name || p)}</span></button>`;
    }).join('');
    const palette = this.mode === 'edit'
      ? `<div class="palette">${(L.placeable || []).filter((id: string) => AssetLoader.entry(id)).map((id: string) =>
        `<button data-id="${id}" class="${id === this.placing ? 'on' : ''}" title="${Ui.esc(AssetLoader.entry(id)?.usage || id)}"><img src="${AssetLoader.url(id)}" alt=""></button>`).join('')}</div>
        <p class="hint">Kéo đồ để di chuyển · chọn đồ bên trên rồi chạm lên đảo để đặt</p>`
      : `<p class="hint">Chạm mặt đất để bé đi · chạm bé hoặc thú cưng để chào</p>`;
    const el = Ui.panel(`
      <div class="row">
        <div class="seg"><button data-m="play" class="${this.mode === 'play' ? 'on' : ''}">Dạo chơi</button><button data-m="edit" class="${this.mode === 'edit' ? 'on' : ''}">Sắp xếp</button></div>
        <button class="btn" data-a="grid">Lưới</button>
        <button class="btn icon" data-a="zin" aria-label="Phóng to">＋</button>
        <button class="btn icon" data-a="zout" aria-label="Thu nhỏ">－</button>
        <button class="btn" data-a="map">Bản đồ</button>
      </div>
      <div class="pets">${petBtns}</div>
      ${palette}`, 'island-panel');
    el.onclick = (e: any) => {
      const b = e.target.closest('button'); if (!b) return;
      if (b.dataset.m) this.setMode(b.dataset.m);
      else if (b.dataset.pet) { this.spawnPet(b.dataset.pet); this.buildPanel(); }
      else if (b.dataset.id) this.setPlacing(this.placing === b.dataset.id ? null : b.dataset.id);
      else if (b.dataset.a === 'grid' && this.grid) { const v = !this.grid.visible; this.grid.setVisible(v).setData('forced', v); }
      else if (b.dataset.a === 'zin') this.controls.zoomBy(1.35);
      else if (b.dataset.a === 'zout') this.controls.zoomBy(1 / 1.35);
      else if (b.dataset.a === 'map') location.hash = 'map';
    };
  }

  // ───────────── vòng lặp ─────────────
  update(_t: number, dt: number) {
    if (!this.avatar) return;
    const A = this.avatar;
    if (this.target) {
      const dx = this.target.x - A.x, dy = this.target.y - A.y;
      const d = Math.hypot(dx, dy);
      const speed = (this.running ? 250 : 140) * dt / 1000;
      if (d <= speed) {
        A.setPosition(this.target.x, this.target.y);
        this.target = null;
        A.play(`idle-${this.facing}`);
        if (!this.petBusy && Math.random() < 0.35) this.petPlay('happy', () => this.petPlay('idle-front'));
      } else {
        A.setPosition(A.x + dx / d * speed, A.y + dy / d * speed);
        if (Math.abs(dx) > Math.abs(dy) * 1.1) { this.facing = 'side'; A.setFlip(dx < 0); }
        else this.facing = dy > 0 ? 'down' : 'up';
        A.play(`${this.running ? 'run' : 'walk'}-${this.facing}`);
      }
    }
    A.container.setDepth(A.y);
    A.update(dt);

    // thú cưng đi theo, đứng chếch phía sau bé
    const P = this.pet;
    if (P) {
      const side = A.flip ? 1 : -1;
      const off = this.facing === 'side' ? { x: side * 70, y: 6 } : this.facing === 'up' ? { x: 46, y: 46 } : { x: 56, y: -18 };
      const tx = A.x + off.x, ty = A.y + off.y;
      const dx = tx - P.x, dy = ty - P.y, d = Math.hypot(dx, dy);
      if (d > 24) {
        const sp = Math.min(d, (d > 120 ? 280 : 150) * dt / 1000);
        P.x += dx / d * sp; P.y += dy / d * sp;
        this.petBusy = false;
        if (Math.abs(dx) > Math.abs(dy)) { this.petPlay('walk-side'); P.setFlipX(dx < 0); }
        else { this.petPlay(dy > 0 ? 'walk-front' : 'walk-back'); P.setFlipX(false); }
      } else if (!this.petBusy) {
        const cur = P.anims.currentAnim?.key || '';
        if (/walk-side/.test(cur)) this.petPlay('idle-side');
        else if (/walk/.test(cur)) this.petPlay('idle-front');
      }
      P.setDepth(P.y);
    }
  }
}
