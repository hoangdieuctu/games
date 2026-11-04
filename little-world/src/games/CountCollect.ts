// ── Game 4: Đếm và hái — hái đúng số quả, so sánh hai nhóm, phép cộng nhỏ ──
// Cấp 1: 1–3 · cấp 2: 2–5 · cấp 3: 4–7 (lẫn quả khác) · cấp 4: + so sánh · cấp 5: + phép cộng.
import { AssetLoader } from '../services/AssetLoader.js';
import { Audio } from '../services/Audio.js';
import { MiniGame, shuffle, randInt, FONT } from '../scenes/MiniGame.js';

declare const Phaser: any;

const NUM = ['không', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín', 'mười'];

export class CountCollectScene extends MiniGame {
  kind: 'collect' | 'compare' | 'add' = 'collect';
  target = 0; item: any; inBasket: any[] = []; basket: any; countText: any; askText = '';
  constructor() { super('CountCollect'); }
  get play() { return AssetLoader.data('play'); }
  assets() { return (this.play.items as any[]).map((i) => i.asset); }
  instruction() { return this.askText || this.act.desc; }

  buildRound() {
    const kinds: ('collect' | 'compare' | 'add')[] =
      this.level <= 3 ? ['collect'] : this.level === 4 ? ['collect', 'compare', 'collect', 'compare', 'collect'] : ['collect', 'compare', 'add', 'compare', 'add'];
    this.kind = kinds[this.round % kinds.length];
    if (this.kind === 'collect') this.buildCollect();
    else if (this.kind === 'compare') this.buildCompare();
    else this.buildAdd();
  }

  // ───── hái đúng số ─────
  buildCollect() {
    const items = this.play.items as any[];
    const [lo, hi] = [[1, 3], [2, 5], [4, 7], [3, 8], [4, 9]][this.level - 1];
    this.target = randInt(lo, hi);
    this.item = items[randInt(0, items.length - 1)];
    const extra = this.level >= 3 ? randInt(2, 4) : 0;
    const total = Math.min(12, this.target + randInt(1, 3));
    const others = shuffle(items.filter((i) => i.id !== this.item.id)).slice(0, 2);
    this.inBasket = [];
    this.askText = `Hái ${this.item.name} bỏ vào giỏ nhé! Cần đủ ${NUM[this.target]}.`;
    this.layer.add(this.label(this.W / 2, this.top + 30, `Hái ${this.target} ${this.item.name}`, 58));

    // vùng quả (trên) và giỏ (dưới phải)
    const field = this.portrait ? { x: 70, y: this.top + 110, w: this.W - 140, h: Math.min(640, this.H - this.top - 110 - 520) } : { x: 300, y: this.top + 90, w: 820, h: 560 };
    this.layer.add(this.plate(field.x + field.w / 2, field.y + field.h / 2, field.w, field.h, 0xf3fbef, 0.85));
    const spots = this.scatter(field, total + extra, 120);
    const list = shuffle([...Array(total).fill(this.item), ...Array.from({ length: extra }, (_, i) => others[i % others.length])]);
    list.forEach((it, i) => {
      const [x, y] = spots[i];
      const s = this.fitImage(it.asset, x, y, 104, 104);
      s.setData({ it, home: { x, y } }).setInteractive({ useHandCursor: true });
      s.setScale(0); this.tweens.add({ targets: s, scale: s.getData('baseScale'), delay: i * 40, duration: 250, ease: 'Back.easeOut' });
      s.on('pointerup', () => this.toggle(s));
      this.layer.add(s);
    });

    const bx = this.portrait ? this.W / 2 : 1320, by = this.portrait ? field.y + field.h + 230 : this.top + 360;
    this.basket = this.drawBasket(bx, by);
    this.countText = this.add.text(bx, by + 140, '0', { fontFamily: FONT, fontSize: '72px', fontStyle: '800', color: '#f28a4e', stroke: '#ffffff', strokeThickness: 12 }).setOrigin(0.5);
    this.layer.add(this.countText);
    const ok = this.bigButton(bx, by + (this.portrait ? 250 : 250), 'Xong rồi!', () => this.checkCollect());
    this.layer.add(ok);
    this.time.delayedCall(300, () => this.say(this.instruction()));
  }

  toggle(s: any) {
    if (this.busy) return;
    const i = this.inBasket.indexOf(s);
    if (i >= 0) {
      this.inBasket.splice(i, 1);
      const h = s.getData('home');
      this.tweens.add({ targets: s, x: h.x, y: h.y, duration: 260, ease: 'Back.easeOut' });
      Audio.sfx('soft');
    } else {
      if (s.getData('it').id !== this.item.id) { this.miss(s, `Đó là ${s.getData('it').name}. Mình cần ${this.item.name} cơ!`); return; }
      this.inBasket.push(s);
      const k = this.inBasket.length - 1;
      const bx = this.basket.x + ((k % 5) - 2) * 44, by = this.basket.y - 50 - Math.floor(k / 5) * 34;
      this.layer.bringToTop(s);
      this.tweens.add({ targets: s, x: bx, y: by, duration: 320, ease: 'Cubic.easeOut' });
      Audio.sfx('pop');
      Audio.say(NUM[this.inBasket.length] || String(this.inBasket.length));
    }
    this.countText.setText(String(this.inBasket.length));
    this.pulse(this.countText, 1.25);
    this.layer.bringToTop(this.basket.front);
  }

  checkCollect() {
    if (this.busy) return;
    const n = this.inBasket.length;
    if (n === this.target) {
      this.good(this.basket.x, this.basket.y - 60);
      Audio.say(`Đúng rồi! Đủ ${NUM[n]} rồi!`);
      this.nextRound(1400);
    } else if (n < this.target) this.miss(this.basket.front, `Trong giỏ mới có ${NUM[n]}. Cần ${NUM[this.target]} cơ, hái thêm nhé!`);
    else this.miss(this.basket.front, `Trong giỏ có ${NUM[n]} rồi, nhiều quá! Chạm vào quả trong giỏ để bỏ bớt nhé.`);
  }

  // ───── so sánh hai nhóm ─────
  buildCompare() {
    const items = shuffle(this.play.items as any[]);
    const a = randInt(1, this.level >= 5 ? 9 : 6);
    let b = randInt(1, this.level >= 5 ? 9 : 6); if (b === a) b = a + (a > 3 ? -randInt(1, 2) : randInt(1, 2));
    const askMore = Math.random() < 0.6;
    this.askText = askMore ? 'Bên nào nhiều hơn?' : 'Bên nào ít hơn?';
    this.layer.add(this.label(this.W / 2, this.top + 30, this.askText, 58));
    const groups = [a, b];
    const want = askMore ? (a > b ? 0 : 1) : (a < b ? 0 : 1);
    groups.forEach((n, gi) => {
      const f = this.portrait
        ? { x: 80, y: this.top + 110 + gi * 560, w: this.W - 160, h: 500 }
        : { x: gi === 0 ? 170 : 870, y: this.top + 110, w: 560, h: 560 };
      const plate = this.plate(f.x + f.w / 2, f.y + f.h / 2, f.w, f.h, 0xfffaf2, 0.92);
      const zone = this.add.zone(f.x + f.w / 2, f.y + f.h / 2, f.w, f.h).setInteractive({ useHandCursor: true });
      this.layer.add([plate, zone]);
      const it = items[gi];
      const spots = this.scatter({ x: f.x + 20, y: f.y + 20, w: f.w - 40, h: f.h - 40 }, n, 115);
      for (const [x, y] of spots) this.layer.add(this.fitImage(it.asset, x, y, 100, 100));
      zone.on('pointerup', () => {
        if (this.busy) return;
        if (gi === want) {
          this.good(zone.x, zone.y);
          Audio.say(`Đúng rồi! Bên này ${askMore ? 'nhiều hơn' : 'ít hơn'}!`);
          this.nextRound(1600);
        } else this.miss(plate, `Mình cùng đếm nhé! Bên này có ${NUM[n]}. Bên kia có ${NUM[groups[1 - gi]]}.`);
      });
    });
    this.time.delayedCall(300, () => this.say(this.instruction()));
  }

  // ───── phép cộng ─────
  buildAdd() {
    const it = (this.play.items as any[])[randInt(0, 7)];
    const a = randInt(1, 5), b = randInt(1, 4), sum = a + b;
    this.askText = `${NUM[a]} thêm ${NUM[b]} là mấy?`;
    this.layer.add(this.label(this.W / 2, this.top + 30, `${a} + ${b} = ?`, 72));
    const y0 = this.portrait ? this.top + 380 : this.top + 290;
    const gw = this.portrait ? 360 : 460;
    [a, b].forEach((n, gi) => {
      const cx = this.portrait ? this.W / 2 + (gi === 0 ? -200 : 200) : this.W / 2 + (gi === 0 ? -330 : 330);
      this.layer.add(this.plate(cx, y0, gw, 360, 0xfffaf2, 0.9));
      const spots = this.scatter({ x: cx - gw / 2 + 20, y: y0 - 160, w: gw - 40, h: 320 }, n, 110);
      for (const [x, y] of spots) this.layer.add(this.fitImage(it.asset, x, y, 96, 96));
    });
    this.layer.add(this.label(this.W / 2, y0, '+', 110));
    const opts = shuffle([sum, sum + 1, Math.max(1, sum - 1) === sum ? sum + 2 : Math.max(1, sum - 1)].filter((v, i, arr) => arr.indexOf(v) === i));
    while (opts.length < 3) opts.push(sum + opts.length + 1);
    opts.forEach((v, i) => {
      const bx = this.W / 2 + (i - 1) * 240, by = this.portrait ? this.H - 380 : this.H - 150;
      const c = this.add.container(bx, by);
      const g = this.add.circle(0, 0, 90, 0xffd96b).setStrokeStyle(8, 0xffffff);
      const t = this.add.text(0, -4, String(v), { fontFamily: FONT, fontSize: '96px', fontStyle: '800', color: '#4b3a5e' }).setOrigin(0.5);
      c.add([g, t]); c.setSize(180, 180).setInteractive({ useHandCursor: true });
      c.on('pointerup', () => {
        if (this.busy) return;
        if (v === sum) { this.good(bx, by); Audio.say(`${NUM[a]} thêm ${NUM[b]} là ${NUM[sum]}!`); this.nextRound(1600); }
        else this.miss(c, 'Mình cùng đếm tất cả các quả nhé!');
      });
      this.layer.add(c);
    });
    this.time.delayedCall(300, () => this.say(this.instruction()));
  }

  // ───── tiện ích ─────
  scatter(f: { x: number; y: number; w: number; h: number }, n: number, gap: number): [number, number][] {
    const pts: [number, number][] = [];
    for (let tries = 0; pts.length < n && tries < 4000; tries++) {
      const x = f.x + 60 + Math.random() * (f.w - 120), y = f.y + 60 + Math.random() * (f.h - 120);
      const g = tries > 2500 ? gap * 0.7 : gap;
      if (pts.every(([px, py]) => Math.hypot(px - x, py - y) > g)) pts.push([x, y]);
    }
    while (pts.length < n) pts.push([f.x + f.w / 2 + (pts.length % 4) * 30, f.y + f.h / 2]);
    return pts;
  }

  drawBasket(x: number, y: number) {
    const back = this.add.graphics();
    back.fillStyle(0x99643f, 1).fillEllipse(x, y - 40, 260, 70);
    const front = this.add.graphics();
    front.fillStyle(0x4c3876, 0.15).fillEllipse(x + 6, y + 78, 250, 40);
    front.fillStyle(0xcf9161, 1).lineStyle(6, 0x99643f, 1);
    front.beginPath(); front.moveTo(x - 130, y - 40); front.lineTo(x + 130, y - 40); front.lineTo(x + 100, y + 70); front.lineTo(x - 100, y + 70); front.closePath(); front.fillPath(); front.strokePath();
    front.lineStyle(4, 0xe6b386, 1);
    for (let i = -2; i <= 2; i++) { front.lineBetween(x + i * 44, y - 34, x + i * 36, y + 64); }
    front.lineBetween(x - 118, y - 2, x + 118, y - 2); front.lineBetween(x - 108, y + 34, x + 108, y + 34);
    front.lineStyle(10, 0x99643f, 1).strokeEllipse(x, y - 40, 260, 40);
    this.layer.add([back, front]);
    return { x, y, back, front };
  }
}
