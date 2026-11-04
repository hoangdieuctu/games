// ── Game 2: Lật thẻ ghi nhớ ──
// Cấp 1–5: 2, 3, 4, 6, 8 cặp. Không có đồng hồ đếm ngược.
import { AssetLoader } from '../services/AssetLoader.js';
import { Audio } from '../services/Audio.js';
import { MiniGame, shuffle } from '../scenes/MiniGame.js';

declare const Phaser: any;

export class MemoryScene extends MiniGame {
  open: any[] = [];
  found = 0;
  pairs = 2;
  constructor() { super('Memory'); }

  get play() { return AssetLoader.data('play'); }
  assets() { const P = this.play; return [...P.animals.map((a: any) => a.asset), 'card-back', 'card-front']; }
  instruction() { return 'Lật hai thẻ. Nếu giống nhau là tìm được một cặp!'; }

  buildRound() {
    this.pairs = [2, 3, 4, 6, 8][this.level - 1];
    this.open = []; this.found = 0;
    const animals = shuffle(this.play.animals as any[]).slice(0, this.pairs);
    const deck = shuffle([...animals, ...animals]);
    const n = deck.length;
    let cols: number;
    if (this.portrait) cols = n <= 4 ? 2 : n <= 12 ? 3 : 4;
    else cols = n <= 4 ? n : n <= 6 ? 3 : n <= 8 ? 4 : n <= 12 ? 4 : 6;
    const rows = Math.ceil(n / cols);
    const top = this.top + 20, bottom = this.H - (this.portrait ? 200 : 40);
    const availH = bottom - top, availW = this.W - (this.portrait ? 80 : 300);
    const ch = Math.min(260, availH / rows - 18), cw = Math.min(ch * 0.8, availW / cols - 18);
    const chh = cw / 0.8;
    deck.forEach((a: any, i: number) => {
      const c = i % cols, r = Math.floor(i / cols);
      const rowCount = Math.min(cols, n - r * cols);
      const x = this.W / 2 + (c - (rowCount - 1) / 2) * (cw + 18) + (this.portrait ? 0 : 60);
      const y = top + availH / 2 + (r - (rows - 1) / 2) * (chh + 18);
      const card = this.add.container(x, y);
      const back = this.add.image(0, 0, 'card-back').setDisplaySize(cw, chh);
      const front = this.add.image(0, 0, 'card-front').setDisplaySize(cw, chh).setVisible(false);
      const pic = this.fitImage(a.asset, 0, 0, cw * 0.86, chh * 0.75).setVisible(false);
      card.add([back, front, pic]);
      card.setData({ a, back, front, pic, up: false, done: false });
      card.setSize(cw, chh).setInteractive({ useHandCursor: true });
      card.on('pointerup', () => this.flip(card));
      card.setScale(0);
      this.tweens.add({ targets: card, scale: 1, duration: 300, delay: i * 40, ease: 'Back.easeOut' });
      this.layer.add(card);
    });
    // cấp 1: cho xem trước các thẻ một chút
    if (this.level === 1) this.time.delayedCall(700, () => {
      for (const c of this.layer.list) this.show(c, true);
      this.time.delayedCall(1500, () => { for (const c of this.layer.list) this.show(c, false); });
    });
    this.time.delayedCall(300, () => this.say(this.instruction()));
  }

  show(card: any, up: boolean) {
    card.setData('up', up);
    this.tweens.add({
      targets: card, scaleX: 0, duration: 120, ease: 'Quad.easeIn',
      onComplete: () => {
        card.getData('back').setVisible(!up);
        card.getData('front').setVisible(up);
        card.getData('pic').setVisible(up);
        this.tweens.add({ targets: card, scaleX: 1, duration: 140, ease: 'Quad.easeOut' });
      },
    });
  }

  flip(card: any) {
    if (this.busy || card.getData('up') || card.getData('done') || this.open.length >= 2) return;
    Audio.sfx('flip');
    this.show(card, true);
    this.open.push(card);
    if (this.open.length < 2) return;
    const [a, b] = this.open;
    this.busy = true;
    if (a.getData('a').id === b.getData('a').id) {
      this.time.delayedCall(350, () => {
        for (const c of [a, b]) {
          c.setData('done', true);
          this.tweens.add({ targets: c, scale: 1.12, duration: 160, yoyo: true });
        }
        this.good((a.x + b.x) / 2, (a.y + b.y) / 2, false);
        Audio.say(a.getData('a').name);
        this.open = []; this.busy = false;
        this.found++;
        if (this.found >= this.pairs) this.time.delayedCall(700, () => this.complete());
      });
    } else {
      this.mistakes += 0.5; // nhớ dần là chuyện bình thường: lật sai chỉ tính nửa lần
      this.time.delayedCall(900, () => {
        Audio.sfx('soft');
        this.show(a, false); this.show(b, false);
        this.open = []; this.busy = false;
      });
    }
  }

  complete() {
    // lật sai trong game trí nhớ là bình thường; chuẩn hoá theo số cặp
    this.mistakes = Math.max(0, Math.round(this.mistakes - this.pairs * 0.75));
    super.complete();
  }
}
