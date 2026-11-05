// ── Game 1: Tìm bạn thú (chọn đúng con vật) / Nhà của thú (đưa thú về đúng nơi ở) ──
// Cấp 1–5: số lựa chọn 2 → 3 → 4 → 6; cấp 5 chỉ nghe tiếng kêu.
import { AssetLoader } from '../services/AssetLoader.js';
import { Audio } from '../services/Audio.js';
import { MiniGame, shuffle } from '../scenes/MiniGame.js';

declare const Phaser: any;

export class AnimalMatchScene extends MiniGame {
  target: any = null;
  constructor() { super('AnimalMatch'); }

  get play() { return AssetLoader.data('play'); }
  assets() {
    const P = this.play;
    return [...P.animals.map((a: any) => a.asset), ...P.habitats.map((h: any) => h.asset), P.cards?.front || 'card-front'];
  }
  instruction() {
    if (!this.target) return this.act.desc;
    if (this.mode === 'habitat') return `${this.target.name} sống ở đâu nhỉ? Kéo bạn ấy về nhà nhé.`;
    return this.level >= 5 ? `Con nào kêu "${this.target.sound}"?` : `Con ${this.target.name.toLowerCase()} đâu rồi?`;
  }

  buildRound() {
    if (this.mode === 'habitat') this.buildHabitat(); else this.buildFind();
  }

  // ───── Tìm bạn thú ─────
  buildFind() {
    const P = this.play;
    const n = [2, 3, 4, 6, 6][this.level - 1];
    const pool = shuffle(P.animals as any[]);
    const choices = pool.slice(0, n);
    this.target = choices[Math.floor(Math.random() * n)];
    const top = this.top;
    const q = this.label(this.W / 2, top + 30, this.level >= 5 ? `Con nào kêu "${this.target.sound}"?` : `Con ${this.target.name.toLowerCase()} đâu?`, this.portrait ? 54 : 58);
    this.layer.add(q);
    // loa: đọc lại
    const spk = this.add.circle(q.x + q.width / 2 + 50, q.y, 32, 0xffd96b).setStrokeStyle(5, 0xffffff).setInteractive({ useHandCursor: true });
    const spkT = this.label(spk.x, spk.y - 2, '♪', 40);
    spk.on('pointerup', () => { Audio.sfx('tap'); this.say(this.instruction()); });
    this.layer.add([spk, spkT]);

    const cols = this.portrait ? (n <= 2 ? 1 : 2) : Math.min(n, n === 6 ? 3 : n);
    const rows = Math.ceil(n / cols);
    const areaT = top + 110, areaB = this.H - (this.portrait ? 220 : 60);
    const cw = Math.min(this.portrait ? 380 : 330, (this.W - 140) / cols), ch = Math.min(cw * 1.15, (areaB - areaT) / rows - 20);
    choices.forEach((a: any, i: number) => {
      const c = i % cols, r = Math.floor(i / cols);
      const rowCount = Math.min(cols, n - r * cols);
      const x = this.W / 2 + (c - (rowCount - 1) / 2) * (cw + 24);
      const y = areaT + (r + 0.5) * ((areaB - areaT) / rows);
      const card = this.add.container(x, y);
      const plate = this.plate(0, 0, cw, ch, 0xfffaf2, 0.95);
      const img = this.fitImage(a.asset, 0, -14, cw * 0.82, ch * 0.72);
      const name = this.label(0, ch / 2 - 34, this.level <= 2 ? a.name : '', 34);
      card.add([plate, img, name]);
      card.setSize(cw, ch).setInteractive({ useHandCursor: true });
      card.setScale(0);
      this.tweens.add({ targets: card, scale: 1, duration: 320, delay: i * 70, ease: 'Back.easeOut' });
      card.on('pointerup', () => this.pickFind(card, a, img));
      this.layer.add(card);
    });
    this.time.delayedCall(250, () => this.say(this.instruction()));
  }

  pickFind(card: any, a: any, img: any) {
    if (this.busy) return;
    if (a.id === this.target.id) {
      this.busy = true;
      this.good(card.x, card.y);
      Audio.say(`Đúng rồi! Con ${a.name.toLowerCase()} kêu ${a.sound}!`);
      this.tweens.add({ targets: card, scale: 1.15, duration: 220, yoyo: true, repeat: 1, ease: 'Quad.easeOut' });
      this.tweens.add({ targets: img, angle: { from: -8, to: 8 }, duration: 160, yoyo: true, repeat: 3 });
      for (const o of this.layer.list) if (o !== card && o.input) this.tweens.add({ targets: o, alpha: 0.35, duration: 250 });
      this.nextRound(1500);
    } else {
      this.miss(card, `Đây là con ${a.name.toLowerCase()}. Tìm con ${this.target.name.toLowerCase()} nhé!`);
    }
  }

  // ───── Nhà của thú ─────
  buildHabitat() {
    const P = this.play;
    const nh = [2, 2, 3, 4, 4][this.level - 1];
    const habitats = shuffle(P.habitats as any[]).slice(0, nh);
    const cand = shuffle((P.animals as any[]).filter((a) => habitats.some((h) => h.id === a.habitat)));
    this.target = cand[0];
    const top = this.top;
    this.layer.add(this.label(this.W / 2, top + 30, `${this.target.name} sống ở đâu?`, 56));

    const homes: any[] = [];
    let dragging = false;
    let animal: any = null, home0 = { x: 0, y: 0 };
    const bob = () => this.tweens.add({ targets: animal, y: home0.y - 14, duration: 700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    const choose = (c: any) => {
      if (this.busy || !animal) return;
      if (c.getData('h').id === this.target.habitat) {
        this.busy = true;
        this.tweens.killTweensOf(animal);
        animal.disableInteractive();
        for (const h of homes) h.disableInteractive();
        this.tweens.add({ targets: animal, x: c.x, y: c.y - 10, scale: animal.getData('baseScale') * 0.7, duration: 300, ease: 'Back.easeOut' });
        this.good(c.x, c.y);
        Audio.say(`Đúng rồi! ${this.target.name} sống ở ${c.getData('h').name.toLowerCase()}.`);
        this.nextRound(1500);
      } else {
        this.miss(c, `${this.target.name} không sống ở ${c.getData('h').name.toLowerCase()} đâu. Thử nơi khác nhé!`);
        this.tweens.killTweensOf(animal);
        this.tweens.add({ targets: animal, x: home0.x, y: home0.y, duration: 300, ease: 'Back.easeOut', onComplete: bob });
      }
    };
    // chừa góc dưới trái cho thú cưng đồng hành
    const left = 250, right = 30, cx = this.portrait ? this.W / 2 : (left + this.W - right) / 2;
    const hw = this.portrait ? 380 : Math.min(340, (this.W - left - right) / nh - 30), hh = hw * 0.66;
    habitats.forEach((h: any, i: number) => {
      let x, y;
      if (this.portrait) {
        const row = Math.floor(i / 2), inRow = Math.min(2, nh - row * 2);
        x = cx + ((i % 2) - (inRow - 1) / 2) * (hw + 24);
        y = this.H - 340 - row * (hh + 70);
      } else { x = cx + (i - (nh - 1) / 2) * (hw + 30); y = this.H - hh / 2 - 70; }
      const c = this.add.container(x, y);
      const img = this.fitImage(h.asset, 0, 0, hw, hh);
      const t = this.label(0, hh / 2 + 26, h.name, 32);
      c.add([img, t]);
      c.setData('h', h).setData('w', hw).setData('hh', hh);
      // bấm thẳng vào nơi ở cũng chọn được (không chỉ kéo thả)
      c.setSize(hw, hh + 60).setInteractive({ useHandCursor: true });
      c.on('pointerup', () => { if (!dragging) choose(c); });
      this.layer.add(c);
      homes.push(c);
    });

    const ay = this.portrait ? top + 330 : top + 230;
    animal = this.fitImage(this.target.asset, this.W / 2, ay, 260, 260);
    animal.setInteractive({ draggable: true, useHandCursor: true });
    this.input.setDraggable(animal);
    this.layer.add(animal);
    home0 = { x: animal.x, y: ay };
    bob();
    const hit = (x: number, y: number) => homes.find((c) => Math.abs(x - c.x) < c.getData('w') / 2 && Math.abs(y - c.y) < c.getData('hh') / 2 + 30);

    animal.on('dragstart', () => { if (this.busy) return; dragging = true; this.tweens.killTweensOf(animal); animal.setScale(animal.getData('baseScale') * 1.1); Audio.sfx('pop'); });
    animal.on('drag', (_p: any, x: number, y: number) => {
      if (this.busy) return;
      animal.setPosition(x, y);
      for (const c of homes) c.setScale(c === hit(x, y) ? 1.06 : 1);
    });
    animal.on('dragend', () => {
      // để pointerup của nơi ở (phát ngay sau) không chọn lần nữa
      this.time.delayedCall(0, () => { dragging = false; });
      if (this.busy) return;
      animal.setScale(animal.getData('baseScale'));
      const c = hit(animal.x, animal.y);
      for (const h of homes) h.setScale(1);
      if (c) choose(c);
      else { this.tweens.add({ targets: animal, x: home0.x, y: home0.y, duration: 300, ease: 'Back.easeOut', onComplete: bob }); }
    });
    this.time.delayedCall(250, () => this.say(this.instruction()));
  }
}
