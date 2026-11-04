// ── Game 5: Bé xây dựng — xếp khối có trọng lực (Matter.js có sẵn trong Phaser) ──
// Không có một đáp án đúng duy nhất. Thử thách tuỳ chọn: tháp chạm cờ, nhà có mái, tự do.
import { AssetLoader } from '../services/AssetLoader.js';
import { Audio } from '../services/Audio.js';
import { Ui } from '../services/Ui.js';
import { MiniGame, FONT } from '../scenes/MiniGame.js';

declare const Phaser: any;

const K = 1.35;   // phóng to khối cho tay bé dễ cầm
const CHALLENGES = [
  { id: 'tower', name: 'Tháp chạm cờ', say: 'Xây một cái tháp thật cao, chạm tới lá cờ nhé!' },
  { id: 'house', name: 'Ngôi nhà có mái', say: 'Xây một ngôi nhà, nhớ đặt mái nhà lên trên cùng nhé!' },
  { id: 'free', name: 'Tự do sáng tạo', say: 'Bé muốn xây gì cũng được! Xong thì bấm "Xong rồi" nhé.' },
];

export class BuilderScene extends MiniGame {
  ground: any; tray: any[] = []; blocks: any[] = []; dragging: any = null; dragDef: any = null;
  challenge = 'tower'; flagY = 0; flag: any; trayRect = { x: 0, y: 0, w: 0, h: 0 }; achieved = false; stableT = 0; placed = 0;
  constructor() { super({ key: 'Builder', physics: { default: 'matter', matter: { gravity: { y: 1.1 }, enableSleeping: true } } }); }

  get play() { return AssetLoader.data('play'); }
  placePet() { if (this.petSprite) this.petSprite.setScale(this.portrait ? 0.9 : 1).setPosition(this.portrait ? this.W - 90 : this.W - 230, this.H - (this.portrait ? 300 : 70)); }
  assets() { const P = this.play; return [...P.blocks.map((b: any) => b.asset), P.ground || 'block-ground']; }
  instruction() { return CHALLENGES.find((c) => c.id === this.challenge)!.say; }

  setup() {
    this.placed = 0;
    this.input.on('pointermove', (p: any) => this.moveDrag(p));
    this.input.on('pointerup', (p: any) => this.endDrag(p));
    this.events.on('update', () => this.checkGoal());
  }

  relayout() {
    // đổi chiều màn hình: giữ nguyên công trình là khó → dựng lại sân, xoá khối
    this.startRound(true);
  }

  buildRound() {
    for (const b of this.blocks) b.destroy();
    this.blocks = [];
    this.matter.world.setBounds(0, -2000, this.W, this.H + 2000 - (this.portrait ? 300 : 70), 64, true, true, false, false);
    // mặt đất
    const gy = this.H - (this.portrait ? 300 : 70);
    const groundImg = this.add.image(this.W / 2, gy, this.play.ground || 'block-ground').setOrigin(0.5, 0);
    groundImg.setDisplaySize(this.W + 40, 60 * 1.2 * (this.W / 1200));
    this.layer.add(groundImg);
    this.ground = this.matter.add.rectangle(this.W / 2, gy + 200, this.W + 400, 400, { isStatic: true, friction: 1 });
    this.layer.add(this.add.rectangle(this.W / 2, gy + 30 + 400, this.W + 40, 800, 0x9b7453).setOrigin(0.5, 0));

    // khay khối
    const defs = this.play.blocks as any[];
    this.tray = [];
    if (this.portrait) this.trayRect = { x: 20, y: gy + 50, w: this.W - 40, h: 230 };
    else this.trayRect = { x: 20, y: this.top + 10, w: 230, h: gy - this.top - 20 };
    const R = this.trayRect;
    this.layer.add(this.plate(R.x + R.w / 2, R.y + R.h / 2, R.w, R.h, 0xfffaf2, 0.9));
    const cols = this.portrait ? 7 : 2, rows = Math.ceil(defs.length / cols);
    defs.forEach((d: any, i: number) => {
      const c = i % cols, r = Math.floor(i / cols);
      const cw = R.w / cols, ch = R.h / rows;
      const x = R.x + cw * (c + 0.5), y = R.y + ch * (r + 0.5);
      const img = this.fitImage(d.asset, x, y, cw - 16, ch - 14);
      img.setInteractive({ useHandCursor: true }).setData('def', d);
      img.on('pointerdown', (p: any) => this.startDrag(p, d, null));
      this.layer.add(img);
      this.tray.push(img);
    });

    // cờ đích (thử thách tháp)
    this.flagY = gy - (this.portrait ? 640 : 470);
    const fx = this.portrait ? this.W - 90 : this.W - 110;
    const flag = this.add.container(0, 0);
    const pole = this.add.rectangle(fx, (this.flagY + gy) / 2, 8, gy - this.flagY, 0x99643f);
    const cloth = this.add.triangle(fx + 4, this.flagY + 22, 0, 0, 0, 44, 64, 22, 0xf58aa8).setOrigin(0, 0.5);
    const line = this.add.graphics();
    line.lineStyle(4, 0xffffff, 0.8);
    for (let x = R.x + R.w + 20; x < fx - 10; x += 36) line.lineBetween(x, this.flagY, x + 18, this.flagY);
    flag.add([line, pole, cloth]);
    this.flag = flag;
    this.layer.add(flag);
    this.tweens.add({ targets: cloth, scaleX: 0.85, duration: 500, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    this.flag.setVisible(this.challenge === 'tower');
    this.achieved = false;
    this.buildBarExtras();
    this.time.delayedCall(300, () => this.say(this.instruction()));
  }

  buildBarExtras() {
    const p = document.getElementById('panel'); if (!p) return;
    let ex = p.querySelector('.builder-ex') as HTMLElement;
    if (!ex) { ex = document.createElement('div'); ex.className = 'builder-ex'; p.appendChild(ex); }
    ex.innerHTML = `<div class="seg">${CHALLENGES.map((c) => `<button data-ch="${c.id}" class="${c.id === this.challenge ? 'on' : ''}">${Ui.esc(c.name)}</button>`).join('')}</div>
      <button class="btn" data-b="clear">Dọn hết</button><button class="btn accent" data-b="done">Xong rồi!</button>`;
    ex.onclick = (e: any) => {
      const b = e.target.closest('button'); if (!b) return;
      Audio.sfx('tap');
      if (b.dataset.ch) { this.challenge = b.dataset.ch; this.achieved = false; this.flag.setVisible(this.challenge === 'tower'); this.buildBarExtras(); this.say(this.instruction()); }
      else if (b.dataset.b === 'clear') { for (const k of this.blocks) k.destroy(); this.blocks = []; this.achieved = false; }
      else if (b.dataset.b === 'done') this.finishBuild();
    };
  }

  finishBuild() {
    if (this.done) return;
    if (this.blocks.length < 3) { this.say('Đặt thêm vài khối nữa rồi bấm "Xong rồi" nhé!'); return; }
    this.complete({ noAdapt: true });
  }

  // ───── kéo thả ─────
  startDrag(p: any, def: any, from: any) {
    if (this.done || this.dragging) return;
    const w = this.cameras.main.getWorldPoint(p.x, p.y);
    if (from) { from.destroy(); this.blocks = this.blocks.filter((b) => b !== from); }
    const img = this.add.image(w.x, w.y, def.asset).setScale(0.5 * K).setDepth(500).setAlpha(0.92);
    this.dragging = img; this.dragDef = def;
    Audio.sfx('pop');
  }
  moveDrag(p: any) {
    if (!this.dragging) return;
    const w = this.cameras.main.getWorldPoint(p.x, p.y);
    this.dragging.setPosition(w.x, w.y);
    this.dragging.setTint(this.inTray(w.x, w.y) ? 0xff9b9b : 0xffffff);
  }
  endDrag(_p: any) {
    if (!this.dragging) return;
    const img = this.dragging, def = this.dragDef;
    this.dragging = null; this.dragDef = null;
    const { x, y } = img; img.destroy();
    if (this.inTray(x, y)) { Audio.sfx('soft'); return; }   // thả lại vào khay = cất đi
    this.spawnBlock(def, x, y);
  }
  inTray(x: number, y: number) { const R = this.trayRect; return x > R.x && x < R.x + R.w && y > R.y && y < R.y + R.h; }

  spawnBlock(def: any, x: number, y: number) {
    const opts: any = { friction: 0.9, frictionStatic: 1, restitution: 0.02, density: 0.002, chamfer: def.body === 'rect' ? { radius: 3 } : undefined };
    const tw = def.w * 2, th = def.h * 2;   // kích thước texture (@2x)
    if (def.body === 'triangle') opts.shape = { type: 'fromVerts', verts: [{ x: 0, y: th }, { x: tw / 2, y: 0 }, { x: tw, y: th }] };
    else if (def.body === 'semicircle') {
      const verts = []; for (let i = 0; i <= 12; i++) { const a = Math.PI * i / 12; verts.push({ x: tw / 2 - Math.cos(a) * tw / 2, y: th - Math.sin(a) * th }); }
      opts.shape = { type: 'fromVerts', verts };
    }
    const b = this.matter.add.image(x, y, def.asset, undefined, opts);
    b.setScale(0.5 * K);
    if (opts.shape) {
      // Matter đặt thân theo trọng tâm → dời điểm neo ảnh cho khớp
      const body = b.body;
      const cx = (body.bounds.min.x + body.bounds.max.x) / 2, cy = (body.bounds.min.y + body.bounds.max.y) / 2;
      const dx = body.position.x - cx, dy = body.position.y - cy;
      b.setOrigin(0.5 + dx / b.displayWidth, 0.5 + dy / b.displayHeight);
    }
    b.setData('def', def);
    b.setInteractive({ useHandCursor: true });
    b.on('pointerdown', (p: any) => this.startDrag(p, def, b));
    this.blocks.push(b);
    this.placed++;
    Audio.sfx('place');
  }

  // ───── kiểm tra thử thách ─────
  checkGoal() {
    if (this.done || this.achieved || this.dragging || this.challenge === 'free') return;
    const resting = this.blocks.filter((b) => b.body && b.body.speed < 0.15);
    if (resting.length !== this.blocks.length || !this.blocks.length) { this.stableT = 0; return; }
    let ok = false;
    if (this.challenge === 'tower') ok = this.blocks.some((b) => b.body.bounds.min.y <= this.flagY);
    else if (this.challenge === 'house') {
      const roofs = this.blocks.filter((b) => b.getData('def').body !== 'rect');
      const gy = this.H - (this.portrait ? 300 : 70);
      ok = roofs.some((r) => {
        const below = this.blocks.filter((b) => b !== r && b.getData('def').body === 'rect' && Math.abs(b.x - r.x) < r.displayWidth * 0.6 && b.y > r.y);
        return below.length >= 2 && r.body.bounds.max.y < gy - 80;
      });
    }
    if (ok) {
      this.stableT += this.game.loop.delta;
      if (this.stableT > 900) {
        this.achieved = true;
        const top = this.blocks.reduce((a, b) => (b.y < a.y ? b : a));
        this.good(top.x, top.y - 40);
        this.confetti();
        this.say(this.challenge === 'tower' ? 'Oa, tháp cao chạm tới cờ rồi!' : 'Ngôi nhà đẹp quá! Có cả mái nữa!');
        const t = this.add.text(this.W / 2, this.top + 40, '★ Hoàn thành thử thách! ★', { fontFamily: FONT, fontSize: '54px', fontStyle: '800', color: '#f28a4e', stroke: '#fff', strokeThickness: 10 }).setOrigin(0.5).setDepth(900);
        this.tweens.add({ targets: t, scale: { from: 0.4, to: 1 }, duration: 400, ease: 'Back.easeOut' });
        this.time.delayedCall(2600, () => t.destroy());
      }
    } else this.stableT = 0;
  }
}
