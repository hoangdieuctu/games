// ── Game 3: Ghép hình — kéo mảnh vào đúng bóng trên khay gỗ ──
// Cấp 1–5: 2 → 6 mảnh; cấp cao có hình gần giống nhau (tròn/bầu dục, vuông/chữ nhật/thoi).
import { AssetLoader } from '../services/AssetLoader.js';
import { Audio } from '../services/Audio.js';
import { MiniGame, shuffle } from '../scenes/MiniGame.js';

declare const Phaser: any;

const EASY = ['circle', 'square', 'triangle', 'star', 'heart'];

export class ShapePuzzleScene extends MiniGame {
  left = 0;
  slots: any[] = [];
  constructor() { super('ShapePuzzle'); }
  get play() { return AssetLoader.data('play'); }
  assets() { const P = this.play; return [...P.shapes.map((s: any) => s.asset), P.board || 'play-board-wood']; }
  instruction() { return 'Kéo từng mảnh vào cái bóng giống nó nhé!'; }

  buildRound() {
    const P = this.play;
    const n = [2, 3, 4, 5, 6][this.level - 1];
    const all = P.shapes as any[];
    const pool = this.level <= 2 ? all.filter((s) => EASY.includes(s.id)) : all;
    const shapes = shuffle(pool).slice(0, n);
    this.left = n; this.slots = [];

    // khay gỗ
    const bw = this.portrait ? 820 : 900, bh = this.portrait ? Math.min(640, this.H - this.top - 540) : 560;
    const bx = this.portrait ? this.W / 2 : this.W / 2 + 170, by = this.portrait ? this.top + 60 + bh / 2 : this.top + 30 + bh / 2 + 40;
    const board = this.add.image(bx, by, P.board || 'play-board-wood').setDisplaySize(bw, bh);
    this.layer.add(board);
    const cols = n <= 2 ? 2 : n <= 4 ? 2 : 3, rows = Math.ceil(n / cols);
    const cell = Math.min((bw - 80) / cols, (bh - 80) / rows);
    const k = Math.min(1, (cell - 30) / 200);
    shuffle(shapes).forEach((s: any, i: number) => {
      const c = i % cols, r = Math.floor(i / cols);
      const rowCount = Math.min(cols, n - r * cols);
      const x = bx + (c - (rowCount - 1) / 2) * cell, y = by + (r - (rows - 1) / 2) * cell;
      const sil = this.add.image(x, y, s.asset).setDisplaySize(s.w * k, s.h * k).setTintFill(0x7a5a8c).setAlpha(0.32);
      sil.setData({ s, filled: false });
      this.slots.push(sil);
      this.layer.add(sil);
    });

    // các mảnh ghép: bên trái (ngang) hoặc bên dưới (dọc)
    const pieces = shuffle(shapes);
    if (this.portrait) this.layer.add(this.plate(this.W / 2, by + bh / 2 + 140 + (Math.ceil(n / 3) - 1) * 105, this.W - 60, Math.ceil(n / 3) * 210 + 20, 0xfffaf2, 0.8));
    else this.layer.add(this.plate(n <= 3 ? 250 : 310, this.top + 40 + (this.H - this.top - 220) / 2 + 20, n <= 3 ? 240 : 430, this.H - this.top - 200, 0xfffaf2, 0.8));
    pieces.forEach((s: any, i: number) => {
      let x: number, y: number;
      if (this.portrait) {
        const pc = Math.min(3, n), pr = Math.ceil(n / pc);
        const c = i % pc, r = Math.floor(i / pc);
        x = this.W / 2 + (c - (Math.min(pc, n - r * pc) - 1) / 2) * 250;
        y = by + bh / 2 + 140 + r * 210 - (pr > 1 ? 0 : 0);
      } else {
        const pc = n <= 3 ? 1 : 2;
        const c = i % pc, r = Math.floor(i / pc), pr = Math.ceil(n / pc);
        x = pc === 1 ? 250 : 210 + c * 200;
        y = this.top + 60 + (r + 0.5) * ((this.H - this.top - 260) / pr) + 20;
      }
      const piece = this.add.image(x, y, s.asset).setDisplaySize(s.w * k * 0.95, s.h * k * 0.95);
      piece.setData({ s, home: { x, y }, base: piece.scale });
      piece.setInteractive({ draggable: true, useHandCursor: true, pixelPerfect: false });
      this.input.setDraggable(piece);
      piece.setAngle(-8 + Math.random() * 16);
      this.layer.add(piece);
      piece.on('dragstart', () => { if (this.busy) return; Audio.sfx('pop'); piece.setScale(piece.getData('base') * 1.1).setAngle(0); this.layer.bringToTop(piece); });
      piece.on('drag', (_p: any, px: number, py: number) => piece.setPosition(px, py));
      piece.on('dragend', () => this.drop(piece, k));
    });
    this.time.delayedCall(300, () => this.say(this.instruction()));
  }

  drop(piece: any, k: number) {
    const s = piece.getData('s');
    const near = this.slots.filter((sl) => !sl.getData('filled')).map((sl) => ({ sl, d: Math.hypot(sl.x - piece.x, sl.y - piece.y) }))
      .sort((a, b) => a.d - b.d)[0];
    const reach = 110 * Math.max(0.7, k) + (this.level <= 2 ? 40 : 0);
    if (near && near.d < reach && near.sl.getData('s').id === s.id) {
      const sl = near.sl;
      sl.setData('filled', true);
      piece.disableInteractive();
      this.tweens.add({ targets: piece, x: sl.x, y: sl.y, scaleX: sl.scaleX, scaleY: sl.scaleY, angle: 0, duration: 200, ease: 'Back.easeOut' });
      Audio.sfx('snap');
      this.good(sl.x, sl.y, false);
      Audio.say(s.name);
      this.tweens.add({ targets: sl, alpha: 0, duration: 200 });
      if (--this.left <= 0) {
        this.good(this.W / 2, this.H / 2);
        this.nextRound(1200);
      }
      return;
    }
    // sai hoặc thả ra ngoài: mảnh quay về chỗ cũ
    if (near && near.d < reach) {
      this.miss(undefined, this.roundMistakes >= 1 ? `Mảnh này là ${s.name.toLowerCase()}. Tìm cái bóng giống nó nhé!` : undefined);
      if (this.roundMistakes >= 2) {
        const right = this.slots.find((sl) => !sl.getData('filled') && sl.getData('s').id === s.id);
        if (right) this.tweens.add({ targets: right, alpha: 0.7, duration: 300, yoyo: true, repeat: 2 });
      }
    }
    const h = piece.getData('home');
    this.tweens.add({ targets: piece, x: h.x, y: h.y, scale: piece.getData('base'), duration: 280, ease: 'Back.easeOut' });
  }
}
