// ── Đảo của bé ──
// Dạo chơi: chạm mặt đất để bé đi, chạm luống đất để gieo hạt / thu hoạch hoa.
// Trang trí: lấy đồ trong túi đặt lên đảo, kéo để di chuyển, lật, cất lại vào túi.
// Cửa hàng: đổi tài nguyên (kiếm được khi chơi) lấy đồ mới. Mọi thay đổi tự lưu.
import { AssetLoader } from '../services/AssetLoader.js';
import { CameraControls } from '../services/CameraControls.js';
import { LayeredAvatar, validLook, lookAssetIds } from '../services/LayeredAvatar.js';
import { Store, IslandObj } from '../services/Store.js';
import { Audio } from '../services/Audio.js';
import { Hud, costHtml, resIcon } from '../services/Hud.js';
import { Ui } from '../services/Ui.js';
import { SHOP, SHOP_GROUPS, shopItem, PLOT_ASSETS, PLOT_GROW_MS, PLOT_HARVEST, ACHIEVEMENTS, PET_LINES, RES_NAMES, pick } from '../data/Content.js';
import { preloadWithProgress } from './BootScene.js';

declare const Phaser: any;

const PET_IDS = ['fox', 'bunny', 'bear'];
const SNAP = 16;
const FIXED = new Set(['island-building-house-main']);   // nhà chính không cất đi được
const BLOOMS = ['island-plant-flower-pink', 'island-plant-flower-yellow', 'island-plant-flower-lavender', 'island-plant-flower-tulip'];

export class IslandScene extends Phaser.Scene {
  L: any; controls: any; walk: any; grid: any; avatar: any; pet: any; petId = 'fox';
  objs: any[] = [];
  mode: 'play' | 'edit' = 'play';
  selected: any = null; selRing: any; placing: string | null = null; ghost: any = null;
  target: { x: number; y: number; then?: () => void } | null = null;
  facing = 'down'; running = false; petBusy = false; dragFrom: { x: number; y: number } | null = null; tapMarker: any;
  plotTimer = 0; shopGroup = 'plant';

  constructor() { super('Island'); }

  preload() {
    preloadWithProgress(this, () => {
      const pets = AssetLoader.data('pets') || {};
      const ids = [...lookAssetIds(validLook(Store.p?.look)), ...PET_IDS.map((p) => pets[p]?.sheet)];
      return AssetLoader.queueCategories(this, ['island', 'environment']) + AssetLoader.queueIds(this, ids);
    }, 'Đang về đảo của bé…');
  }

  create() {
    if (Ui.stale(this)) return;
    Ui.setActiveTab('Island');
    Hud.show(true);
    AssetLoader.createAnimations(this);
    const L = this.L = AssetLoader.data('island');
    const P = Store.p!;
    this.petId = P.pet;
    this.objs = []; this.mode = 'play'; this.placing = null; this.selected = null;
    this.cameras.main.setBackgroundColor('#5ab4e0');

    this.add.image(0, 0, L.terrain).setOrigin(0, 0).setDisplaySize(L.width, L.height).setDepth(-10);
    if (L.gridOverlay && this.textures.exists(L.gridOverlay)) {
      this.grid = this.add.image(0, 0, L.gridOverlay).setOrigin(0, 0).setDisplaySize(L.width, L.height).setDepth(-5).setVisible(false);
    }
    this.walk = new Phaser.Geom.Polygon(L.walkArea.flat());

    // bố cục đã lưu, hoặc bố cục ban đầu (luống đất đang lớn sẵn cho bé thấy ngay)
    let objs: IslandObj[] = P.island as IslandObj[];
    if (!objs) {
      const now = Date.now();
      objs = L.objects.map((o: any) => {
        const r: IslandObj = { a: o.asset, x: o.x, y: o.y, f: !!o.flipX };
        if (o.asset === 'island-terrain-plot-sprout') { r.a = 'island-terrain-plot-empty'; r.seed = now - 20_000; }
        if (o.asset === 'island-terrain-plot-growing') { r.a = 'island-terrain-plot-empty'; r.seed = now - PLOT_GROW_MS[2] + 15_000; }
        return r;
      });
    }
    for (const o of objs) this.addObject(o.a, o.x, o.y, !!o.f, o.seed);

    this.selRing = this.add.graphics().setDepth(-1);
    this.tapMarker = this.add.graphics().setDepth(-2);

    const [ax, ay] = L.spawn.avatar;
    this.avatar = new LayeredAvatar(this, ax, ay, validLook(P.look));
    this.avatar.container.setSize(60, 90);
    this.avatar.container.setInteractive(new Phaser.Geom.Rectangle(-30, -84, 60, 88), Phaser.Geom.Rectangle.Contains);
    this.avatar.container.on('pointerup', () => {
      if (this.mode !== 'play' || this.controls.dragging) return;
      this.target = null;
      Audio.sfx('pop');
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

    this.input.on('gameobjectdown', (_p: any, obj: any) => {
      if (this.mode !== 'edit' || !obj.getData('placed') || this.placing) return;
      this.controls.locked = true;
      this.select(obj);
      this.dragFrom = { x: obj.x, y: obj.y };
    });
    this.input.on('drag', (_p: any, obj: any, dx: number, dy: number) => {
      if (this.mode !== 'edit' || !obj.getData('placed')) return;
      obj.setPosition(Math.round(dx / SNAP) * SNAP, Math.round(dy / SNAP) * SNAP);
      obj.setDepth(this.depthOf(obj));
      obj.setTint(this.inside(obj.x, obj.y) ? 0xffffff : 0xff9b9b);
      this.syncBloom(obj);
      this.drawSelection();
    });
    this.input.on('dragend', (_p: any, obj: any) => {
      obj.clearTint();
      if (!this.inside(obj.x, obj.y) && this.dragFrom) {
        this.tweens.add({ targets: obj, x: this.dragFrom.x, y: this.dragFrom.y, duration: 220, ease: 'Back.easeOut', onUpdate: () => { this.drawSelection(); this.syncBloom(obj); }, onComplete: () => { obj.setDepth(this.depthOf(obj)); this.syncBloom(obj); } });
        Ui.toast('Chỉ đặt được trên đất của đảo');
      } else { this.bounce(obj); Audio.sfx('place'); this.save(); }
    });
    this.input.on('pointerup', () => { setTimeout(() => { if (this.controls) this.controls.locked = false; }, 0); });

    this.buildPanel();
    this.refreshPlots();
    this.events.once('shutdown', () => { Ui.clearPanel(); Ui.card(null); });   // không lưu ở đây: lúc tắt scene đồ vật đã bị huỷ

    if (!P.seenIntro) {
      P.seenIntro = true; Store.commit();
      const pets = AssetLoader.data('pets') || {};
      this.time.delayedCall(600, () => Hud.say(`Chào ${P.name}! Mình là ${pets[this.petId]?.name || 'bạn đồng hành'}. Đây là đảo của chúng mình!`));
      this.time.delayedCall(5200, () => Hud.say('Mở Bản đồ để chơi trò chơi, nhận sao và đồ xây đảo nhé!'));
    } else this.time.delayedCall(500, () => Hud.say(pick([...PET_LINES.hello, ...PET_LINES.island])));
  }

  // ───────────── đồ vật ─────────────
  depthOf(o: any) { const a = o.getData('asset'); const e = AssetLoader.entry(a); return (e?.tags || []).includes('ground') || PLOT_ASSETS.includes(a) ? -3 + o.y / 10000 : o.y; }

  addObject(asset: string, x: number, y: number, flipX = false, seed?: number) {
    if (!this.textures.exists(asset)) return null;
    const s = AssetLoader.sprite(this, asset, x, y);
    s.setFlipX(flipX);
    s.setData('placed', true).setData('asset', asset);
    if (seed) s.setData('seed', seed);
    s.setDepth(this.depthOf(s));
    s.setInteractive({ pixelPerfect: true, alphaTolerance: 40, draggable: false, useHandCursor: false });
    if (this.mode === 'edit') this.input.setDraggable(s, true);
    this.objs.push(s);
    return s;
  }

  save() {
    Store.setIsland(this.objs.filter((o) => o.active).map((o) => {
      const r: IslandObj = { a: o.getData('asset'), x: Math.round(o.x), y: Math.round(o.y) };
      if (o.flipX) r.f = true;
      if (o.getData('seed')) r.seed = o.getData('seed');
      return r;
    }));
  }

  inside(x: number, y: number) { return Phaser.Geom.Polygon.Contains(this.walk, x, y); }
  bounce(obj: any) {
    const sy = obj.scaleY;
    this.tweens.add({ targets: obj, scaleY: sy * 0.9, duration: 90, yoyo: true, ease: 'Quad.easeOut', onComplete: () => obj.setScale(obj.scaleX, sy) });
  }

  // ───────────── luống đất ─────────────
  isPlot(o: any) { return PLOT_ASSETS.includes(o.getData('asset')); }
  plotStage(o: any): number {
    const seed = o.getData('seed'); if (!seed) return 0;
    const t = Date.now() - seed;
    return t >= PLOT_GROW_MS[2] ? 3 : t >= PLOT_GROW_MS[1] ? 2 : 1;
  }
  refreshPlots() {
    for (const o of this.objs) if (o.active && this.isPlot(o)) {
      const st = this.plotStage(o);
      const want = st === 0 ? 'island-terrain-plot-empty' : st === 1 ? 'island-terrain-plot-sprout' : 'island-terrain-plot-growing';
      if (o.texture.key !== want && this.textures.exists(want)) { o.setTexture(want); o.setData('asset', 'island-terrain-plot-empty'); }
      const ready = st === 3;
      if (ready && !o.getData('bloom')) {
        const bloom = BLOOMS.slice(0, 3).map((k, i) => this.add.image(0, 0, k).setScale(0.42).setOrigin(0.5, 0.9));
        const spark = this.textures.exists('world-ui-unlocked-sparkle') ? this.add.image(0, 0, 'world-ui-unlocked-sparkle').setScale(0.22) : null;
        if (spark) this.tweens.add({ targets: spark, scale: 0.28, angle: 20, duration: 700, yoyo: true, repeat: -1 });
        o.setData('bloom', { flowers: bloom, spark });
        this.syncBloom(o);
      } else if (!ready && o.getData('bloom')) {
        const b = o.getData('bloom'); b.flowers.forEach((f: any) => f.destroy()); b.spark?.destroy(); o.setData('bloom', null);
      }
    }
  }
  syncBloom(o: any) {
    const b = o.getData('bloom'); if (!b) return;
    b.flowers.forEach((f: any, i: number) => f.setPosition(o.x + (i - 1) * 42, o.y - 6 + (i % 2) * 8).setDepth(o.y + 1 + i));
    b.spark?.setPosition(o.x, o.y - 80).setDepth(o.y + 10);
  }
  tapPlot(o: any) {
    const st = this.plotStage(o);
    if (st === 0) {
      if (!Store.pay({ seed: 1 })) { Hud.say('Mình hết hạt giống rồi. Chơi ở Đảo Động Vật để nhận thêm nhé!'); return; }
      o.setData('seed', Date.now());
      Audio.sfx('plant'); Hud.bump('seed'); Hud.render();
      Hud.say('Gieo hạt rồi! Chờ một chút, hoa sẽ nở nhé.');
    } else if (st === 3) {
      o.setData('seed', null);
      Store.give(PLOT_HARVEST); Store.count('harvest');
      const got = Store.checkAchievements(); Store.commit();
      Audio.sfx('reward');
      for (const k of Object.keys(PLOT_HARVEST)) Hud.bump(k);
      Hud.render();
      Hud.say(`Thu hoạch được ${PLOT_HARVEST.flower} bông hoa và ${PLOT_HARVEST.seed} hạt giống!`);
      this.achToast(got);
      this.flyIcons(o.x, o.y - 40, PLOT_HARVEST as any);
    } else {
      const left = Math.ceil((PLOT_GROW_MS[2] - (Date.now() - o.getData('seed'))) / 1000);
      Hud.say(st === 1 ? `Mầm non đang lớn! Khoảng ${left} giây nữa hoa sẽ nở.` : `Sắp nở rồi! Còn khoảng ${left} giây.`);
    }
    this.bounce(o);
    this.refreshPlots();
    this.save();
  }

  flyIcons(x: number, y: number, r: Record<string, number>) {
    let i = 0;
    for (const [k, v] of Object.entries(r)) for (let n = 0; n < v; n++) {
      const key = 'reward-' + k;
      if (!this.textures.exists(key)) { AssetLoader.loadNow(this, [key], () => {}); continue; }
      const s = this.add.image(x, y, key).setScale(0.4).setDepth(99990);
      this.tweens.add({ targets: s, y: y - 120 - Math.random() * 40, x: x + (i++ - 2) * 30, alpha: 0, duration: 900, ease: 'Cubic.easeOut', onComplete: () => s.destroy() });
    }
  }

  achToast(ids: string[]) {
    ids.forEach((id, i) => {
      const a = ACHIEVEMENTS.find((x) => x.id === id); if (!a) return;
      this.time.delayedCall(900 + i * 2200, () => { Audio.sfx('unlock'); Ui.toast(`Huy hiệu mới: ${a.name}!`, 2600); });
    });
  }

  // ───────────── chọn & sửa ─────────────
  select(obj: any) {
    this.selected = obj;
    this.drawSelection();
    if (!obj) { Ui.card(null); return; }
    const asset = obj.getData('asset');
    const name = shopItem(asset)?.name || AssetLoader.entry(asset)?.usage || asset;
    const fixed = FIXED.has(asset);
    const el = Ui.card(`
      <div class="card-head" style="--c:#a6e3c4"><img class="card-icon sq" src="${AssetLoader.url(asset)}" alt="">
      <div><h3>${Ui.esc(name)}</h3><p>Kéo để di chuyển</p></div></div>
      <div class="row">
        <button class="btn" data-a="flip">Lật</button>
        ${fixed ? '' : '<button class="btn danger" data-a="store">Cất vào túi</button>'}
        <button class="btn ghost" data-a="close">Xong</button>
      </div>`);
    el.onclick = (ev: any) => {
      const a = ev.target.closest('button')?.dataset.a;
      if (!a || !this.selected) return;
      Audio.sfx('tap');
      const o = this.selected;
      if (a === 'flip') { o.setFlipX(!o.flipX); this.bounce(o); this.save(); }
      else if (a === 'store') {
        this.objs = this.objs.filter((x) => x !== o);
        const b = o.getData('bloom'); if (b) { b.flowers.forEach((f: any) => f.destroy()); b.spark?.destroy(); }
        Store.addItem(asset);
        this.tweens.add({ targets: o, alpha: 0, scale: o.scale * 0.6, duration: 200, onComplete: () => o.destroy() });
        this.select(null);
        this.save(); this.buildPanel();
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

  setMode(m: 'play' | 'edit') {
    this.mode = m;
    this.setPlacing(null);
    this.select(null);
    for (const o of this.objs) this.input.setDraggable(o, m === 'edit');
    if (this.grid) this.grid.setVisible(m === 'edit');
    this.buildPanel();
    if (m === 'edit') Hud.say(Object.keys(Store.p!.items).length ? 'Chọn đồ trong túi rồi chạm lên đảo để đặt nhé!' : 'Túi đang trống. Bấm "Cửa hàng" để đổi đồ mới nhé!');
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
        const id = this.placing;
        const P = Store.p!;
        if (!P.items[id]) { this.setPlacing(null); return; }
        const o = this.addObject(id, sx, sy);
        if (o) {
          this.bounce(o); Audio.sfx('place');
          Store.addItem(id, -1); Store.count('placed');
          const got = Store.checkAchievements(); Store.commit();
          this.achToast(got);
          this.save();
          if (!P.items[id]) this.setPlacing(null);
          this.buildPanel();
        }
        return;
      }
      const hit = this.input.hitTestPointer(this.input.activePointer).filter((o: any) => o.getData && o.getData('placed'));
      if (!hit.length) this.select(null);
      return;
    }
    // dạo chơi: chạm luống đất → đi tới rồi gieo / thu hoạch
    const hits = this.input.hitTestPointer(this.input.activePointer).filter((o: any) => o.getData && o.getData('placed'));
    const plot = hits.find((o: any) => this.isPlot(o)) || this.objs.find((o) => o.active && this.isPlot(o) && Math.abs(o.x - x) < 75 && Math.abs(o.y - y) < 45);
    if (plot) {
      this.walkTo(plot.x - 90, plot.y + 10, () => { this.facing = 'side'; this.avatar.setFlip(false); this.avatar.play('interact', true, () => this.avatar.play('idle-side')); this.tapPlot(plot); });
      return;
    }
    if (!this.inside(x, y)) { Ui.toast('Bé không bơi được đâu!'); return; }
    this.walkTo(x, y);
  }

  walkTo(x: number, y: number, then?: () => void) {
    if (!this.inside(x, y)) { const c = { x: (x + this.avatar.x) / 2, y: (y + this.avatar.y) / 2 }; if (this.inside(c.x, c.y)) { x = c.x; y = c.y; } else { then?.(); return; } }
    this.target = { x, y, then };
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
    this.petPlay('greet', () => this.petPlay('idle-front'));
    s.setInteractive({ pixelPerfect: true, alphaTolerance: 40 });
    s.on('pointerup', () => {
      if (this.mode !== 'play' || this.controls.dragging) return;
      Audio.sfx('bloop');
      this.petPlay(Math.random() < 0.5 ? 'interact' : 'happy', () => this.petPlay('idle-front'));
      Hud.say(pick([...PET_LINES.island, ...PET_LINES.hello]));
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
    const P = Store.p!;
    const pets = AssetLoader.data('pets') || {};
    const petBtns = PET_IDS.filter((p) => pets[p]).map((p) =>
      `<button class="pet ${p === this.petId ? 'on' : ''}" data-pet="${p}" title="${Ui.esc(pets[p].name || p)}"><img src="${AssetLoader.url(`${p}-portrait`)}" alt=""><span>${Ui.esc(pets[p].name || p)}</span></button>`).join('');
    const inv = Object.entries(P.items).filter(([id, n]) => n > 0 && AssetLoader.entry(id));
    const palette = this.mode === 'edit'
      ? `<h4>Túi đồ <button class="btn small accent" data-a="shop">Cửa hàng</button></h4>
        ${inv.length ? `<div class="palette">${inv.map(([id, n]) =>
          `<button data-id="${id}" class="${id === this.placing ? 'on' : ''}" title="${Ui.esc(shopItem(id)?.name || id)}"><img src="${AssetLoader.url(id)}" alt=""><i>${n}</i></button>`).join('')}</div>
        <p class="hint">Chọn đồ rồi chạm lên đảo để đặt · kéo đồ trên đảo để di chuyển</p>`
          : '<p class="hint">Túi đang trống — vào Cửa hàng đổi đồ bằng sao, hạt giống, gỗ, đá… kiếm được khi chơi.</p>'}`
      : `<p class="hint">Chạm mặt đất để bé đi · chạm luống đất để gieo hạt và hái hoa</p>`;
    const el = Ui.panel(`
      <div class="row">
        <div class="seg"><button data-m="play" class="${this.mode === 'play' ? 'on' : ''}">Dạo chơi</button><button data-m="edit" class="${this.mode === 'edit' ? 'on' : ''}">Trang trí</button></div>
        <button class="btn icon" data-a="zin" aria-label="Phóng to">＋</button>
        <button class="btn icon" data-a="zout" aria-label="Thu nhỏ">－</button>
        <button class="btn" data-a="ach">Huy hiệu</button>
        <button class="btn accent" data-a="map">Đi chơi</button>
      </div>
      ${this.mode === 'play' ? `<div class="pets">${petBtns}</div>` : ''}
      ${palette}`, 'island-panel');
    el.onclick = (e: any) => {
      const b = e.target.closest('button'); if (!b) return;
      Audio.sfx('tap');
      if (b.dataset.m) this.setMode(b.dataset.m);
      else if (b.dataset.pet) {
        if (b.dataset.pet === this.petId) return;
        Store.setPet(b.dataset.pet); this.spawnPet(b.dataset.pet); this.buildPanel();
        Hud.say(`Chào bạn! Mình là ${pets[b.dataset.pet]?.name}. Cùng chơi nhé!`);
        this.achToast(Object.keys(Store.p!.ach).filter((k) => k === 'new-pet-friend' && Date.now() - Store.p!.ach[k] < 2000));
      }
      else if (b.dataset.id) this.setPlacing(this.placing === b.dataset.id ? null : b.dataset.id);
      else if (b.dataset.a === 'zin') this.controls.zoomBy(1.35);
      else if (b.dataset.a === 'zout') this.controls.zoomBy(1 / 1.35);
      else if (b.dataset.a === 'map') location.hash = 'map';
      else if (b.dataset.a === 'shop') this.openShop();
      else if (b.dataset.a === 'ach') this.openAchievements();
    };
  }

  openShop() {
    const P = Store.p!;
    const items = SHOP.filter((s) => s.group === this.shopGroup && AssetLoader.entry(s.asset));
    const el = Ui.modal(`
      <div class="shop">
        <h2>Cửa hàng của đảo</h2>
        <div class="shop-res">${Object.entries(P.res).map(([k, v]) => `<span><img src="${resIcon(k)}" alt="">${v} ${RES_NAMES[k as keyof typeof RES_NAMES]}</span>`).join('')}</div>
        <div class="seg wide">${SHOP_GROUPS.map(([g, n]) => `<button data-g="${g}" class="${g === this.shopGroup ? 'on' : ''}">${n}</button>`).join('')}</div>
        <div class="shop-grid">${items.map((s) => {
          const ok = Store.has(s.cost);
          return `<button class="shop-item ${ok ? '' : 'cant'}" data-buy="${s.asset}"><img src="${AssetLoader.url(s.asset)}" alt=""><b>${Ui.esc(s.name)}</b>${costHtml(s.cost as any)}${P.items[s.asset] ? `<i>Trong túi: ${P.items[s.asset]}</i>` : ''}</button>`;
        }).join('')}</div>
        <p class="hint">Mọi thứ đều đổi bằng phần thưởng bé tự kiếm khi chơi. Không có mua bằng tiền thật.</p>
      </div>`, { cls: 'modal-wide', onClose: () => this.buildPanel() });
    el.querySelector('.shop')!.addEventListener('click', (e: any) => {
      const b = e.target.closest('button'); if (!b) return;
      if (b.dataset.g) { Audio.sfx('tap'); this.shopGroup = b.dataset.g; this.openShop(); return; }
      if (b.dataset.buy) {
        const s = shopItem(b.dataset.buy)!;
        if (!Store.pay(s.cost)) {
          Audio.sfx('soft');
          const miss = Object.entries(s.cost).filter(([k, v]) => P.res[k as keyof typeof P.res] < (v as number)).map(([k, v]) => `${(v as number) - P.res[k as keyof typeof P.res]} ${RES_NAMES[k as keyof typeof RES_NAMES].toLowerCase()}`).join(', ');
          Ui.toast(`Cần thêm ${miss}`, 2200);
          return;
        }
        Audio.sfx('reward');
        Store.addItem(s.asset);
        Hud.render();
        Ui.toast(`Đã cho ${s.name} vào túi!`);
        this.openShop();
      }
    });
  }

  openAchievements() {
    const P = Store.p!;
    const got = ACHIEVEMENTS.filter((a) => P.ach[a.id]).length;
    Ui.modal(`
      <div class="achv">
        <h2>Huy hiệu của ${Ui.esc(P.name)} <small>${got}/${ACHIEVEMENTS.length}</small></h2>
        <div class="ach-grid">${ACHIEVEMENTS.map((a) => `<div class="ach-card ${P.ach[a.id] ? 'on' : ''}"><img src="${AssetLoader.url(a.icon)}" alt=""><b>${Ui.esc(a.name)}</b><span>${Ui.esc(a.desc)}</span></div>`).join('')}</div>
      </div>`, { cls: 'modal-wide' });
  }

  // ───────────── vòng lặp ─────────────
  update(_t: number, dt: number) {
    if (!this.avatar) return;
    this.plotTimer += dt;
    if (this.plotTimer > 1000) { this.plotTimer = 0; this.refreshPlots(); }
    const A = this.avatar;
    if (this.target) {
      const dx = this.target.x - A.x, dy = this.target.y - A.y;
      const d = Math.hypot(dx, dy);
      const speed = (this.running ? 250 : 140) * dt / 1000;
      if (d <= speed) {
        A.setPosition(this.target.x, this.target.y);
        const then = this.target.then;
        this.target = null;
        A.play(`idle-${this.facing}`);
        if (then) then();
        else if (!this.petBusy && Math.random() < 0.35) this.petPlay('happy', () => this.petPlay('idle-front'));
      } else {
        A.setPosition(A.x + dx / d * speed, A.y + dy / d * speed);
        if (Math.abs(dx) > Math.abs(dy) * 1.1) { this.facing = 'side'; A.setFlip(dx < 0); }
        else this.facing = dy > 0 ? 'down' : 'up';
        A.play(`${this.running ? 'run' : 'walk'}-${this.facing}`);
      }
    }
    A.container.setDepth(A.y);
    A.update(dt);

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
