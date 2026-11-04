// ── Hoạt động: Bé tô màu (Thị Trấn Sáng Tạo) ──
// Cấp 1–2: tô tự do — chọn bút, chạm vào ô để tô; tô hết các ô là xong.
// Cấp 3–5: tô theo mẫu — tranh mẫu nhỏ ở góc, mỗi ô phải đúng màu của mẫu.
import { Audio } from '../services/Audio.js';
import { Store } from '../services/Store.js';
import { MiniGame } from '../scenes/MiniGame.js';
import { PICTURES, CRAYONS, crayon, Picture, Region, Detail } from '../data/Pictures.js';

declare const Phaser: any;

const INK = 0x4b3a5e, BLANK = 0xffffff;

export class ColoringScene extends MiniGame {
  pic: Picture = PICTURES[0];
  copy = false;
  color = CRAYONS[2];
  painted: Record<string, number> = {};
  regionGfx: Record<string, any> = {};
  crayonObjs: any[] = [];
  S = 600; ox = 0; oy = 0; k = 1; maskG: any = null;
  constructor() { super('Coloring'); }

  init(data: any) {
    super.init(data);
    this.painted = {}; this.pic = null as any;
  }

  instruction() {
    return this.copy ? 'Nhìn tranh mẫu ở góc, chọn bút đúng màu rồi chạm vào từng ô để tô nhé!'
      : 'Chọn một cây bút màu, rồi chạm vào bức tranh để tô. Bé thích màu nào cũng được!';
  }

  setup() {
    this.copy = this.level >= 3;
    // ưu tiên tranh bé chưa tô gần đây
    const pool = PICTURES.filter((p) => p.diff <= Math.min(3, Math.ceil(this.level / 2) + (this.level >= 4 ? 1 : 0)));
    const recent = (Store.p?.history || []).filter((h) => h.act === this.act.id).length;
    this.pic = pool[(recent + Math.floor(Math.random() * pool.length)) % pool.length];
  }

  /** Đổi chiều màn hình: giữ màu đã tô. */
  relayout() { this.startRound(true); }

  buildRound() {
    this.regionGfx = {}; this.crayonObjs = [];
    const portrait = this.portrait;
    const TS = portrait ? 170 : 250;   // cỡ tranh mẫu
    if (portrait && this.copy) this.layer.add(this.label((this.W - TS - 60) / 2, this.top + 80, `Tô ${this.pic.name.toLowerCase()}\ngiống tranh mẫu`, 46));
    else this.layer.add(this.label(this.W / 2, this.top + 26, this.copy ? `Tô ${this.pic.name.toLowerCase()} giống tranh mẫu` : `Tô màu ${this.pic.name.toLowerCase()}`, 50));

    // khung tranh
    if (portrait) {
      // trên: (tranh mẫu) · giữa: tranh · dưới: một hàng bút, chừa góc dưới cho bạn thú
      this.oy = this.top + (this.copy ? 250 : 90);
      this.S = Math.min(this.W - 80, this.H - this.oy - 430);
      this.ox = (this.W - this.S) / 2;
    } else {
      // trái: tranh mẫu (hoặc chỗ trống cho bạn thú) · giữa: tranh · phải: hộp bút
      const left = this.copy ? 300 : 200, right = 420;
      this.S = Math.min(this.H - this.top - 110, this.W - left - right - 60);
      this.ox = left + (this.W - left - right - this.S) / 2; this.oy = this.top + 80;
    }
    this.k = this.S / 600;
    this.layer.add(this.plate(this.ox + this.S / 2, this.oy + this.S / 2, this.S + 36, this.S + 36, 0xffffff, 1, 30));
    this.maskG?.destroy();
    const mask = this.maskG = this.make.graphics({}, false).fillStyle(0xffffff).fillRoundedRect(this.ox, this.oy, this.S, this.S, 18);
    const picBox = this.add.container(0, 0);
    picBox.setMask(mask.createGeometryMask());
    this.layer.add(picBox);
    for (const r of this.pic.regions) {
      const g = this.add.graphics().setPosition(this.ox, this.oy).setScale(this.k);
      g.setInteractive(new Phaser.Geom.Polygon(r.pts), Phaser.Geom.Polygon.Contains);
      g.input.cursor = 'pointer';
      g.on('pointerup', (p: any) => { if (p.getDistance() < 30) this.paint(r, p); });
      this.regionGfx[r.id] = g;
      this.drawRegion(r);
      picBox.add(g);
    }
    const det = this.add.graphics().setPosition(this.ox, this.oy).setScale(this.k);
    this.drawDetails(det, this.pic.details, 1);
    picBox.add(det);

    // tranh mẫu
    if (this.copy) {
      const ts = TS;
      const tx = portrait ? this.W - ts - 45 : 45, ty = portrait ? this.top - 10 : this.top + 120;
      this.layer.add(this.plate(tx + ts / 2, ty + ts / 2 + 22, ts + 24, ts + 70, 0xfffaf2, 1, 22));
      const t = this.add.graphics().setPosition(tx, ty + 34).setScale(ts / 600);
      for (const r of this.pic.regions) this.fillPoly(t, r.pts, crayon(r.c).color, 7);
      this.drawDetails(t, this.pic.details, 1.4);
      this.layer.add([t, this.label(tx + ts / 2, ty + 12, 'Tranh mẫu', 30)]);
    }

    // bút màu
    const n = CRAYONS.length;
    if (portrait) {
      const cw = (this.W - 40) / n, y = this.oy + this.S + 170;
      this.layer.add(this.plate(this.W / 2, y + 10, this.W - 20, 230, 0xfffaf2, 0.9, 30));
      CRAYONS.forEach((c, i) => this.addCrayon(c, this.W / 2 + (i - (n - 1) / 2) * cw, y, false));
    } else {
      const cols = 2, rows = Math.ceil(n / cols), ch = Math.min(112, (this.S + 20) / rows);
      const cx = this.W - 220, y0 = this.oy + this.S / 2 - ((rows - 1) * ch) / 2;
      this.layer.add(this.plate(cx, this.oy + this.S / 2, 400, rows * ch + 40, 0xfffaf2, 0.9, 30));
      CRAYONS.forEach((c, i) => this.addCrayon(c, cx - 90 + (i % cols) * 190 - (i % cols) * 10, y0 + Math.floor(i / cols) * ch, true));
    }
    this.selectCrayon(this.color, false);
    this.time.delayedCall(300, () => this.say(this.instruction()));
  }

  fillPoly(g: any, pts: any[], color: number, lw: number) {
    g.fillStyle(color, 1).fillPoints(pts, true, true);
    g.lineStyle(lw, INK, 1).strokePoints(pts, true, true);
  }
  drawRegion(r: Region, flash = false) {
    const g = this.regionGfx[r.id]; if (!g) return;
    g.clear();
    const c = this.painted[r.id];
    this.fillPoly(g, r.pts, flash ? 0xfff0b3 : c ?? BLANK, 5 / this.k);
  }
  drawDetails(g: any, ds: Detail[], wk: number) {
    for (const d of ds) {
      if (d.k === 'line') g.lineStyle((d.w || 4) * wk, INK, 1).strokePoints(d.pts, false, false);
      else g.fillStyle(d.fill ?? INK, 1).fillCircle(d.x, d.y, d.r);
    }
  }

  /** Bút sáp: thân + đầu nhọn, nằm ngang (ngang) hoặc đứng (dọc). */
  addCrayon(c: { id: string; name: string; color: number }, x: number, y: number, horizontal: boolean) {
    const box = this.add.container(x, y);
    const g = this.add.graphics();
    const dark = Phaser.Display.Color.IntegerToColor(c.color).darken(25).color;
    if (horizontal) {
      g.fillStyle(0x4c3876, 0.15).fillRoundedRect(-44, -18, 88, 44, 12);
      g.fillStyle(c.color, 1).fillRoundedRect(-48, -22, 72, 44, 12);
      g.fillTriangle(22, -16, 22, 16, 50, 0);
      g.fillStyle(dark, 1).fillRect(-30, -22, 10, 44).fillRect(-6, -22, 10, 44);
      g.fillStyle(0xffffff, 0.4).fillRoundedRect(-42, -16, 56, 8, 4);
      g.lineStyle(4, INK, 1).strokeRoundedRect(-48, -22, 72, 44, 12).strokeTriangle(24, -16, 24, 16, 50, 0);
      box.setSize(110, 60).setScale(1.3);
    } else {
      g.fillStyle(0x4c3876, 0.15).fillRoundedRect(-18, -40, 44, 96, 12);
      g.fillStyle(c.color, 1).fillRoundedRect(-22, -28, 44, 80, 12);
      g.fillTriangle(-16, -26, 16, -26, 0, -60);
      g.fillStyle(dark, 1).fillRect(-22, -6, 44, 10).fillRect(-22, 20, 44, 10);
      g.fillStyle(0xffffff, 0.4).fillRoundedRect(-16, -20, 8, 64, 4);
      g.lineStyle(4, INK, 1).strokeRoundedRect(-22, -28, 44, 80, 12).strokeTriangle(-16, -28, 16, -28, 0, -60);
      box.setSize(70, 130).setScale(1.4);
    }
    box.add(g);
    box.setInteractive({ useHandCursor: true });
    box.setData({ c, home: { x, y }, horizontal });
    box.on('pointerup', () => { Audio.sfx('tap'); this.selectCrayon(c); });
    this.crayonObjs.push(box);
    this.layer.add(box);
  }
  selectCrayon(c: { id: string; name: string; color: number }, speak = true) {
    this.color = c;
    for (const b of this.crayonObjs) {
      const on = b.getData('c').id === c.id, h = b.getData('home');
      this.tweens.add({ targets: b, x: h.x - (on && b.getData('horizontal') ? 26 : 0), y: h.y - (on && !b.getData('horizontal') ? 26 : 0), scale: (b.getData('horizontal') ? 1.3 : 1.4) * (on ? 1.15 : 1), duration: 160, ease: 'Back.easeOut' });
    }
    if (speak) Audio.say('Màu ' + c.name);
  }

  paint(r: Region, p: any) {
    if (this.busy) return;
    const want = crayon(r.c);
    if (this.copy && this.color.id !== want.id) {
      if (this.painted[r.id] === want.color) return;
      this.miss(undefined, this.roundMistakes >= 1 ? `Trong tranh mẫu, ${r.name} màu ${want.name}. Chọn bút ${want.name} nhé!` : `Ô này trong tranh mẫu không phải màu ${this.color.name} đâu.`);
      if (this.roundMistakes >= 2) { const b = this.crayonObjs.find((o) => o.getData('c').id === want.id); if (b) this.tweens.add({ targets: b, angle: { from: -10, to: 10 }, duration: 90, yoyo: true, repeat: 3, onComplete: () => b.setAngle(0) }); }
      return;
    }
    const first = this.painted[r.id] === undefined;
    this.painted[r.id] = this.color.color;
    this.drawRegion(r, true);
    this.time.delayedCall(70, () => this.drawRegion(r));
    Audio.sfx(first ? 'pop' : 'tap');
    const wp = this.cameras.main.getWorldPoint(p.x, p.y);
    this.sparkle(wp.x, wp.y, 6);
    if (this.isDone()) this.finishPicture();
  }

  isDone() {
    return this.pic.regions.filter((r) => !r.opt).every((r) => this.painted[r.id] !== undefined && (!this.copy || this.painted[r.id] === crayon(r.c).color));
  }

  finishPicture() {
    this.busy = true;
    this.say(this.copy ? 'Giống hệt tranh mẫu luôn! Bé tô đẹp quá!' : 'Bức tranh đẹp quá! Bé là hoạ sĩ nhí!');
    this.good(this.ox + this.S / 2, this.oy + this.S / 2, false);
    this.time.delayedCall(1300, () => this.complete());
  }

  hint() {
    if (!this.copy) { this.say(this.instruction()); return; }
    const r = this.pic.regions.find((x) => !x.opt && this.painted[x.id] !== crayon(x.c).color);
    if (!r) return;
    this.say(`Tô ${r.name} màu ${crayon(r.c).name} nhé!`);
    let n = 0;
    this.time.addEvent({ delay: 180, repeat: 5, callback: () => { this.drawRegion(r, n++ % 2 === 0); } });
  }
}
