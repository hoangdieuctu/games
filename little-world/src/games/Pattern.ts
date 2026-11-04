// ── Hoạt động: Tìm quy luật (Núi Toán Học) — xem dãy hình lặp lại, chọn hình còn thiếu ──
// Cấp 1: AB, ô trống cuối, 2 lựa chọn · cấp 2: + AAB, 3 lựa chọn · cấp 3: + ABB, ABC
// cấp 4: ô trống ở giữa dãy, 4 lựa chọn · cấp 5: + AABB, ABCD, hai ô trống.
import { AssetLoader } from '../services/AssetLoader.js';
import { Audio } from '../services/Audio.js';
import { MiniGame, shuffle, randInt } from '../scenes/MiniGame.js';

declare const Phaser: any;

const UNITS: Record<number, string[]> = {
  1: ['AB'],
  2: ['AB', 'AAB'],
  3: ['AAB', 'ABB', 'ABC'],
  4: ['AAB', 'ABB', 'ABC', 'AABB'],
  5: ['ABC', 'AABB', 'ABCD', 'ABBC'],
};
// nốt nhạc cho từng chữ trong quy luật: bé "nghe" được nhịp lặp lại
const PITCH: Record<string, number> = { A: 523, B: 659, C: 784, D: 988 };

interface Thing { asset: string; name: string; }

export class PatternScene extends MiniGame {
  seq: Thing[] = []; letters = ''; blanks: number[] = []; cells: any[] = []; options: any[] = []; cell = 150;
  constructor() { super('Pattern'); }
  get play() { return AssetLoader.data('play'); }
  assets() { const P = this.play; return [...P.items.map((i: any) => i.asset), ...P.shapes.map((s: any) => s.asset), ...P.animals.slice(0, 8).map((a: any) => a.asset)]; }
  instruction() { return this.blanks.length > 1 ? 'Dãy hình lặp lại theo quy luật. Tìm các hình còn thiếu nhé!' : 'Dãy hình lặp lại theo quy luật. Hình nào còn thiếu nhỉ?'; }

  /** Bộ đồ vật cho một vòng: đồ ăn, hình khối, hoặc bạn thú. */
  pool(): Thing[] {
    const P = this.play;
    const sets: Thing[][] = [
      P.items.map((i: any) => ({ asset: i.asset, name: i.name })),
      P.shapes.filter((s: any) => s.w === s.h).map((s: any) => ({ asset: s.asset, name: s.name.toLowerCase() })),
      P.animals.slice(0, 8).map((a: any) => ({ asset: a.asset, name: 'bạn ' + a.name.toLowerCase() })),
    ];
    return shuffle(sets[this.round % sets.length]);
  }

  buildRound() {
    const unit = UNITS[this.level][randInt(0, UNITS[this.level].length - 1)];
    const kinds = [...new Set(unit.split(''))];
    const things = this.pool();
    const map: Record<string, Thing> = {};
    kinds.forEach((k, i) => (map[k] = things[i]));
    const len = Math.max(6, Math.min(unit.length * 3, unit.length >= 4 ? 8 : unit.length * 2 + (this.level >= 3 ? unit.length : 1)));
    this.letters = Array.from({ length: len }, (_, i) => unit[i % unit.length]).join('');
    this.seq = this.letters.split('').map((k) => map[k]);
    // vị trí ô trống
    if (this.level <= 3) this.blanks = [len - 1];
    else if (this.level === 4) this.blanks = [randInt(unit.length, len - 1)];
    else { const a = randInt(unit.length, len - 2); this.blanks = [a, randInt(a + 1, len - 1)]; }

    this.layer.add(this.label(this.W / 2, this.top + 30, this.blanks.length > 1 ? 'Tìm các hình còn thiếu' : 'Hình nào còn thiếu?', 54));

    // dãy hình: một hàng (ngang) hoặc hai hàng (dọc khi dãy dài)
    const rows = this.portrait && len > 5 ? 2 : 1;
    const perRow = Math.ceil(len / rows);
    this.cell = Math.min(180, (this.W - 100) / perRow);
    const y0 = this.portrait ? this.top + 260 : this.top + 250;
    const rowGap = this.cell + 30;
    this.layer.add(this.plate(this.W / 2, y0 + (rows - 1) * rowGap / 2, perRow * this.cell + 50, rows * rowGap + 20, 0xfffaf2, 0.85));
    this.cells = this.seq.map((t, i) => {
      const r = Math.floor(i / perRow), c = i % perRow, n = Math.min(perRow, len - r * perRow);
      const x = this.W / 2 + (c - (n - 1) / 2) * this.cell, y = y0 + r * rowGap;
      const blank = this.blanks.includes(i);
      const box = this.add.graphics();
      this.drawBox(box, x, y, blank);
      const img = this.fitImage(t.asset, x, y, this.cell * 0.72, this.cell * 0.72);
      img.setData('i', i);
      if (blank) img.setVisible(false);
      else {
        img.setScale(0);
        this.tweens.add({ targets: img, scale: img.getData('baseScale'), delay: i * 90, duration: 260, ease: 'Back.easeOut', onStart: () => this.note(this.letters[i], 0.08) });
      }
      const q = blank ? this.label(x, y, '?', this.cell * 0.5, '#9b85d9') : null;
      this.layer.add([box, img, ...(q ? [q] : [])]);
      return { x, y, box, img, q, filled: !blank };
    });

    // lựa chọn: các hình trong dãy + hình lạ
    const nOpt = [2, 3, 3, 4, 4][this.level - 1];
    const needed = [...new Set(this.blanks.map((b) => this.seq[b]))];
    const inSeq = kinds.map((k) => map[k]).filter((t) => !needed.includes(t));
    const extra = things.filter((t) => !kinds.some((k) => map[k] === t));
    const opts = shuffle([...needed, ...shuffle([...inSeq, ...extra]).slice(0, Math.max(0, nOpt - needed.length))]);
    const oy = this.portrait ? y0 + rows * rowGap + 260 : this.H - 170;
    const ow = Math.min(230, (this.W - 120) / opts.length);
    this.layer.add(this.plate(this.W / 2, oy, opts.length * ow + 40, ow + 20, 0xf3fbef, 0.85));
    this.options = opts.map((t, i) => {
      const x = this.W / 2 + (i - (opts.length - 1) / 2) * ow;
      const img = this.fitImage(t.asset, x, oy, ow * 0.7, ow * 0.7);
      img.setData({ t, home: { x, y: oy } }).setInteractive({ useHandCursor: true, draggable: true });
      this.input.setDraggable(img);
      img.on('pointerup', (p: any) => { if (p.getDistance() < 12) this.choose(img); });
      img.on('dragstart', () => { if (!this.busy) { Audio.sfx('pop'); this.layer.bringToTop(img); } });
      img.on('drag', (_p: any, px: number, py: number) => { if (!this.busy) img.setPosition(px, py); });
      img.on('dragend', (p: any) => { if (p.getDistance() >= 12) this.dropOn(img); });
      this.layer.add(img);
      return img;
    });
    this.time.delayedCall(len * 90 + 300, () => this.say(this.instruction()));
  }

  drawBox(g: any, x: number, y: number, blank: boolean, ok = false) {
    const s = this.cell * 0.86;
    g.clear();
    g.fillStyle(ok ? 0xe3f6d6 : blank ? 0xf1ebfb : 0xffffff, 1).fillRoundedRect(x - s / 2, y - s / 2, s, s, 22);
    g.lineStyle(5, ok ? 0x7cc96a : blank ? 0xc7b5f0 : 0xeadfce, 1).strokeRoundedRect(x - s / 2, y - s / 2, s, s, 22);
  }

  note(letter: string, vol = 0.12) {
    if (!this.sys.isActive()) return;
    Audio.tone(PITCH[letter] || 600, 0.22, vol);
  }

  /** Ô trống tiếp theo (bé chạm vào lựa chọn thì điền ô này). */
  nextBlank() { return this.blanks.find((b) => !this.cells[b].filled); }

  choose(img: any) { const b = this.nextBlank(); if (b !== undefined) this.tryFill(img, b); }
  dropOn(img: any) {
    const open = this.blanks.filter((b) => !this.cells[b].filled)
      .map((b) => ({ b, d: Math.hypot(this.cells[b].x - img.x, this.cells[b].y - img.y) })).sort((a, z) => a.d - z.d)[0];
    if (open && open.d < this.cell) this.tryFill(img, open.b);
    else this.goHome(img);
  }
  goHome(img: any) { const h = img.getData('home'); this.tweens.add({ targets: img, x: h.x, y: h.y, duration: 260, ease: 'Back.easeOut' }); }

  tryFill(img: any, b: number) {
    if (this.busy) return;
    const want = this.seq[b], got = img.getData('t') as Thing, cell = this.cells[b];
    if (got === want) {
      cell.filled = true;
      this.busy = true;
      this.tweens.add({ targets: img, x: cell.x, y: cell.y, duration: 240, ease: 'Cubic.easeOut', onComplete: () => {
        img.setPosition(img.getData('home').x, img.getData('home').y).setScale(0);
        this.tweens.add({ targets: img, scale: img.getData('baseScale'), duration: 200 });
        cell.img.setVisible(true); cell.q?.destroy(); this.drawBox(cell.box, cell.x, cell.y, false, true);
        this.pulse(cell.img, 1.15);
        this.good(cell.x, cell.y, false);
        this.busy = false;
        if (this.nextBlank() === undefined) this.finishRound();
      } });
    } else {
      // gợi ý: chỉ ra phần lặp lại ngay trước ô trống
      const unitLen = this.unitLength();
      const ref = b - unitLen >= 0 ? b - unitLen : b + unitLen;
      this.miss(img, this.roundMistakes >= 1 ? `Nhìn ô cách ${unitLen} ô phía trước xem. Đó là ${this.seq[ref].name}!` : 'Chưa đúng rồi. Nhìn kỹ dãy hình lặp lại nhé!');
      if (this.roundMistakes >= 2 && this.cells[ref]) this.pulse(this.cells[ref].img, 1.3);
      this.goHome(img);
    }
  }

  unitLength() {
    for (let k = 1; k <= this.letters.length; k++) if (this.letters.split('').every((c, i) => c === this.letters[i % k])) return k;
    return this.letters.length;
  }

  /** Cả dãy "hát" lại từng hình, rồi sang vòng mới. */
  finishRound() {
    this.busy = true;
    this.cells.forEach((c, i) => this.time.delayedCall(i * 140, () => { this.note(this.letters[i]); this.pulse(c.img, 1.18); }));
    if (Math.random() < 0.6) this.say('Đúng quy luật rồi!', false);
    this.petReact('happy');
    this.nextRound(this.cells.length * 140 + 700);
  }
}
