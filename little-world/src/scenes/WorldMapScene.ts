// ── Bản đồ thế giới: 6 vùng đất, mỗi vùng có các trò chơi ──
// Vùng mở dần theo số sao bé nhận được. Vùng khoá vẫn nhìn thấy và xem trước được.
import { AssetLoader } from '../services/AssetLoader.js';
import { Store } from '../services/Store.js';
import { Audio } from '../services/Audio.js';
import { Hud, resIcon, costHtml } from '../services/Hud.js';
import { ACTIVITIES, REGION_STARS, PET_LINES, pick } from '../data/Content.js';
import { CameraControls } from '../services/CameraControls.js';
import { Ui } from '../services/Ui.js';
import { preloadWithProgress } from './BootScene.js';

declare const Phaser: any;

const hexInt = (h: string) => parseInt(String(h || '#ffffff').replace('#', ''), 16);

export class WorldMapScene extends Phaser.Scene {
  world: any;
  controls: any;
  polys: Record<string, any> = {};
  overlays: Record<string, any[]> = {};
  labels: Record<string, any> = {};
  unlocked: Record<string, boolean> = {};
  hover: string | null = null;
  selected: string | null = null;
  hl: any; hlGlow: any;
  showLabels = true;
  t = 0;

  constructor() { super('WorldMap'); }

  preload() {
    preloadWithProgress(this, () => {
      const entries = ['world-map', 'regions', 'ui']
        .flatMap((p) => AssetLoader.byCategory(p))
        // ảnh nền từng vùng lớn — chỉ nạp khi mở xem vùng
        .filter((e) => !/background\.webp$/.test(e.file));
      return AssetLoader.queue(this, entries);
    }, 'Đang mở bản đồ thế giới…');
  }

  focus: string | null = null;
  init(data: any) { this.focus = data?.region || null; }

  create() {
    if (Ui.stale(this)) return;
    Ui.setActiveTab('WorldMap');
    Hud.show(true);
    AssetLoader.createAnimations(this);
    const W = this.world = AssetLoader.data('world');
    this.cameras.main.setBackgroundColor('#5ab4e0');

    const base = this.add.image(0, 0, W.background).setOrigin(0, 0).setDisplaySize(W.width, W.height);
    base.setDepth(0);

    // lớp tô nổi vùng (dưới các công trình) + viền sáng (trên)
    this.hl = this.add.graphics().setDepth(1);
    this.hlGlow = this.add.graphics().setDepth(4800);

    // công trình từng vùng
    for (const r of W.regions) {
      this.polys[r.id] = new Phaser.Geom.Polygon(r.polygon.flat());
      this.unlocked[r.id] = Store.regionOpen(r.id);
      for (const lm of r.landmarks || []) {
        if (!this.textures.exists(lm.asset)) continue;
        const s = AssetLoader.sprite(this, lm.asset, lm.x, lm.y);
        s.setDepth(10 + lm.y / 10);
        if (lm.scale) s.setScale(s.scaleX * lm.scale);
      }
    }

    // đảo của bé
    if (W.homeIsland && this.textures.exists(W.homeIsland.asset)) {
      const h = AssetLoader.sprite(this, W.homeIsland.asset, W.homeIsland.x, W.homeIsland.y);
      h.setDepth(10 + W.homeIsland.y / 10);
      this.tweens.add({ targets: h, y: h.y - 10, duration: 2200, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      const pin = this.textures.exists('ui-map-pin') ? AssetLoader.image(this, 'ui-map-pin', W.homeIsland.x, W.homeIsland.y - h.displayHeight * 0.9) : null;
      if (pin) {
        pin.setDepth(5600);
        this.tweens.add({ targets: pin, y: pin.y - 18, duration: 700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      }
    }

    // trang trí: mây trôi, chim bay, thuyền dập dềnh
    for (const d of W.decorations || []) {
      if (!this.textures.exists(d.asset)) continue;
      const s = AssetLoader.sprite(this, d.asset, d.x, d.y);
      const isCloud = /cloud/.test(d.asset);
      s.setDepth(isCloud ? 5200 + d.y / 100 : 10 + d.y / 10);
      if (d.anim && this.anims.exists(d.anim)) s.play(d.anim);
      if (d.flipX) s.setFlipX(true);
      if (d.drift || isCloud) {
        const dist = 600 + (d.x % 400);
        this.tweens.add({ targets: s, x: s.x + dist, duration: 40000 + (d.y % 7) * 4000, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      } else {
        this.tweens.add({ targets: s, y: s.y - 6, duration: 1600 + (d.x % 900), yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      }
    }

    // mây khoá + ổ khoá
    for (const r of W.regions) this.buildOverlay(r);

    // nhãn tên vùng
    for (const r of W.regions) this.labels[r.id] = this.buildLabel(r);

    this.controls = new CameraControls(this, {
      width: W.width, height: W.height, maxZoom: 3.2,
      onHover: (x, y) => this.setHover(this.regionAt(x, y)),
      onTap: (_p, x, y) => this.tap(x, y),
    });

    this.buildPanel();
    Ui.card(null);
    this.events.once('shutdown', () => { Ui.card(null); Ui.clearPanel(); });

    // vùng vừa mở khoá (chưa xem): mây tan + lấp lánh
    const p = Store.p!;
    const fresh = W.regions.filter((r: any) => this.unlocked[r.id] && REGION_STARS[r.id] > 0 && !p.counters['seen-' + r.id]);
    if (this.focus) this.time.delayedCall(50, () => this.select(this.focus, true));
    else if (fresh.length) {
      const r = fresh[0];
      for (const x of fresh) p.counters['seen-' + x.id] = 1;
      Store.commit();
      for (const o of this.overlays[r.id] || []) o.setVisible(true);
      this.time.delayedCall(400, () => { this.select(r.id, true); this.time.delayedCall(700, () => this.revealRegion(r)); });
    } else this.time.delayedCall(300, () => Hud.say(pick(PET_LINES.map)));
  }

  revealRegion(r: any) {
    Audio.sfx('unlock');
    for (const p of this.overlays[r.id] || []) {
      this.tweens.add({ targets: p, alpha: 0, scale: p.scale * 1.2, duration: 900, onComplete: () => p.setVisible(false) });
    }
    if (this.textures.exists('world-ui-unlocked-sparkle')) {
      const c = r.label || r.center;
      const s = AssetLoader.image(this, 'world-ui-unlocked-sparkle', c[0], c[1] - 60).setDepth(5900).setAlpha(0);
      const sc = s.scale; s.setScale(sc * 0.4);
      this.tweens.add({ targets: s, alpha: 1, scale: sc * 1.6, duration: 500, ease: 'Back.easeOut', yoyo: true, hold: 700, onComplete: () => s.destroy() });
    }
    Hud.say(`Vùng ${r.name} đã mở! Mình vào chơi nhé!`);
  }

  // ───────────── dựng ─────────────
  buildOverlay(r: any) {
    const o = r.lockedOverlay;
    const parts: any[] = [];
    if (o && this.textures.exists(o.asset)) {
      const s = AssetLoader.image(this, o.asset, o.x, o.y).setDepth(5000);
      this.tweens.add({ targets: s, alpha: { from: 0.96, to: 0.86 }, duration: 2400, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      parts.push(s);
    }
    if (this.textures.exists('ui-lock-badge')) {
      const c = r.label || r.center;
      const b = AssetLoader.image(this, 'ui-lock-badge', c[0], c[1] - 110).setDepth(5100);
      this.tweens.add({ targets: b, angle: { from: -6, to: 6 }, duration: 1300, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      parts.push(b);
    }
    this.overlays[r.id] = parts;
    for (const p of parts) p.setVisible(!this.unlocked[r.id]);
  }

  buildLabel(r: any) {
    const [x, y] = r.label || r.center;
    const c = this.add.container(x, y).setDepth(6000);
    const txt = this.add.text(0, 0, r.name, {
      fontFamily: '"Baloo 2", Nunito, sans-serif', fontSize: '54px', fontStyle: '800',
      color: '#ffffff', stroke: '#' + hexInt(r.color).toString(16).padStart(6, '0'), strokeThickness: 0,
    }).setOrigin(0.5, 0.5);
    const sub = this.add.text(0, 40, r.nameEn || '', {
      fontFamily: 'Nunito, sans-serif', fontSize: '26px', fontStyle: '800', color: '#4b3a5e',
    }).setOrigin(0.5, 0.5);
    const w = Math.max(txt.width, sub.width) + 70, h = 118;
    const bg = this.add.graphics();
    bg.fillStyle(0x4b3a5e, 0.18).fillRoundedRect(-w / 2 + 4, -h / 2 + 10, w, h, 40);
    bg.fillStyle(0xfffaf2, 0.96).fillRoundedRect(-w / 2, -h / 2, w, h, 40);
    bg.fillStyle(hexInt(r.color), 1).fillRoundedRect(-w / 2 + 10, -h / 2 + 8, w - 20, 62, 30);
    txt.setY(-h / 2 + 39);
    sub.setY(h / 2 - 25);
    c.add([bg, txt, sub]);
    c.setSize(w, h);
    (c as any).baseScale = 1;
    return c;
  }

  buildPanel() {
    const el = Ui.panel(`
      <div class="row">
        <button class="btn" data-a="fit">Toàn cảnh</button>
        <button class="btn accent" data-a="home">Về đảo</button>
      </div>
    `, 'map-panel');
    el.onclick = (e: any) => {
      const b = e.target.closest('button'); if (!b) return;
      Audio.sfx('tap');
      const a = b.dataset.a;
      if (a === 'fit') { this.select(null); this.controls.flyTo(this.world.width / 2, this.world.height / 2, 1, 600); }
      else if (a === 'home') this.goHome();
    };
  }

  // ───────────── tương tác ─────────────
  regionAt(x: number, y: number): string | null {
    for (const r of this.world.regions) if (Phaser.Geom.Polygon.Contains(this.polys[r.id], x, y)) return r.id;
    return null;
  }

  tap(x: number, y: number) {
    const h = this.world.homeIsland;
    if (h && Math.hypot(x - h.x, y - (h.y - 80)) < 170) { this.showHomeCard(); return; }
    const id = this.regionAt(x, y);
    this.select(id, !!id);
  }

  setHover(id: string | null) {
    if (id === this.hover) return;
    this.hover = id;
    this.input.setDefaultCursor(id ? 'pointer' : 'grab');
    this.drawHighlight();
  }

  select(id: string | null, fly = false) {
    this.selected = id;
    this.drawHighlight();
    for (const [rid, l] of Object.entries(this.labels)) {
      this.tweens.add({ targets: l, scale: (l as any).baseScale * (rid === id ? 1.25 : 1), duration: 220, ease: 'Back.easeOut' });
    }
    if (!id) { Ui.card(null); return; }
    const r = this.world.regions.find((x: any) => x.id === id);
    if (fly) this.controls.flyTo(r.center[0], r.center[1], 1.7, 650);
    this.showRegionCard(r);
  }

  drawHighlight() {
    this.hl.clear(); this.hlGlow.clear();
    const draw = (id: string, strong: boolean) => {
      const r = this.world.regions.find((x: any) => x.id === id);
      const pts = r.polygon.map(([x, y]: number[]) => new Phaser.Geom.Point(x, y));
      this.hl.fillStyle(hexInt(r.color), strong ? 0.3 : 0.18).fillPoints(pts, true);
      this.hlGlow.lineStyle(strong ? 26 : 18, 0xffffff, strong ? 0.35 : 0.22).strokePoints(pts, true);
      this.hlGlow.lineStyle(strong ? 9 : 6, 0xfffaf2, 0.95).strokePoints(pts, true);
    };
    if (this.hover && this.hover !== this.selected) draw(this.hover, false);
    if (this.selected) draw(this.selected, true);
  }

  showRegionCard(r: any) {
    const open = this.unlocked[r.id];
    const p = Store.p!;
    const acts = ACTIVITIES.filter((x) => x.region === r.id);
    const need = Hud.regionNeed(r.id);
    const list = acts.map((x) => `
      <button class="act ${open ? '' : 'off'}" data-act="${x.id}">
        <div><b>${Ui.esc(x.name)}</b><span>${Ui.esc(x.desc)}</span></div>
        <em>${p.plays[x.id] ? `Cấp ${Store.level(x.id)} · ${p.plays[x.id]} lượt` : 'Mới!'}</em>
        ${costHtml(x.reward as any, 'cost gain')}
      </button>`).join('');
    const el = Ui.card(`
      <div class="card-head" style="--c:${r.color}">
        <img class="card-icon" src="${AssetLoader.url(r.icon)}" alt="">
        <div><h3>${Ui.esc(r.name)}</h3><p>${Ui.esc(r.nameEn || '')}</p></div>
        <span class="badge ${open ? 'open' : 'locked'}">${open ? 'Đã mở' : 'Đang khoá'}</span>
      </div>
      ${open ? '' : `<p class="card-text need">Cần thêm <b>${need}</b> <img src="${resIcon('star')}" alt="sao"> để mở. Chơi ở các vùng khác để nhận sao nhé!</p>`}
      <div class="acts">${list}</div>
      <div class="row">
        <button class="btn" data-a="view">Xem cảnh vùng</button>
        <button class="btn ghost" data-a="close">Đóng</button>
      </div>`);
    el.onclick = (e: any) => {
      const b = e.target.closest('button'); if (!b) return;
      Audio.sfx('tap');
      if (b.dataset.act) {
        if (!open) { Hud.say(`${r.name} chưa mở. Cần thêm ${need} ngôi sao nữa nhé!`); return; }
        location.hash = 'play/' + b.dataset.act;
        return;
      }
      const a = b.dataset.a;
      if (a === 'close') this.select(null);
      else if (a === 'view') this.showRegionView(r);
    };
  }

  showHomeCard() {
    this.select(null);
    const el = Ui.card(`
      <div class="card-head" style="--c:#ffd96b">
        <div><h3>Đảo của bé</h3><p>Personal Island</p></div>
      </div>
      <p class="card-text">Hòn đảo nhỏ của riêng bé — nơi có ngôi nhà, khu vườn và thú cưng.</p>
      <div class="row"><button class="btn accent" data-a="go">Đến đảo</button><button class="btn ghost" data-a="close">Đóng</button></div>`);
    el.onclick = (e: any) => {
      const a = e.target.closest('button')?.dataset.a;
      if (a === 'go') this.goHome(); else if (a === 'close') Ui.card(null);
    };
  }

  goHome() { location.hash = 'island'; }

  showRegionView(r: any) {
    const bg = this.world.regions && AssetLoader.url(r.background);
    Ui.modal(`
      <div class="region-view" style="--c:${r.color}">
        <div class="rv-stage">
          <img class="rv-bg" src="${bg}" alt="Khung cảnh ${Ui.esc(r.name)}">
          <img class="rv-gate" src="${AssetLoader.url(r.entrance)}" alt="">
          <div class="rv-title"><img src="${AssetLoader.url(r.icon)}" alt=""><span>${Ui.esc(r.name)}</span></div>
        </div>
      </div>`);
  }

  update(_t: number, dt: number) {
    if (!this.controls) return;
    // nhãn giữ cỡ dễ đọc khi phóng to
    const rel = this.cameras.main.zoom / this.controls.minZoom;
    const s = Math.pow(rel, -0.75);
    for (const l of Object.values(this.labels) as any[]) {
      if (l.baseScale !== s) {
        const sel = this.selected && this.labels[this.selected] === l;
        l.baseScale = s;
        if (!this.tweens.isTweening(l)) l.setScale(s * (sel ? 1.25 : 1));
      }
    }
    this.t += dt;
  }
}
