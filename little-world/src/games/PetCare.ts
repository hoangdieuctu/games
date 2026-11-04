// ── Hoạt động: Chăm bạn thú (Ngôi Làng Kỹ Năng) ──
// Bạn đồng hành của bé nghĩ trong bong bóng: đói, khát, lấm bùn, buồn ngủ, muốn chơi, lông rối.
// Bé chọn đúng đồ (kéo vào bạn thú hoặc chạm) — lấm bùn / lông rối thì phải chà, chải cho sạch.
// Cấp 1: 3 lượt, 3 đồ, nói tên đồ cần · cấp 5: 6 lượt, 6 đồ, chỉ có bong bóng gợi ý.
import { AssetLoader } from '../services/AssetLoader.js';
import { Audio } from '../services/Audio.js';
import { MiniGame, shuffle, randInt } from '../scenes/MiniGame.js';

declare const Phaser: any;

interface Care { id: string; need: string; tool: string; say: string; tname: string; done: string; }
const EASY = ['hungry', 'thirsty', 'sleepy', 'play', 'dirty'];

export class PetCareScene extends MiniGame {
  needs: Care[] = []; care: Care = null as any;
  phase: 'choose' | 'scrub' | 'anim' = 'choose';
  tools: any[] = []; fx: any; spots: any[] = []; bubble: any; scrubber: any = null;
  px = 0; feet = 0; ps = 2.4;
  constructor() { super('PetCare'); }
  get careList(): Care[] { return AssetLoader.data('play').care; }
  assets() { return this.careList.flatMap((c) => [c.need, c.tool]); }
  instruction() {
    if (this.phase === 'scrub') return this.care.id === 'dirty' ? 'Kéo bọt biển chà lên các vết bùn nhé!' : 'Kéo lược chải lên chỗ lông rối nhé!';
    return this.care ? `${this.care.say} Bạn ấy cần gì nhỉ? Kéo đồ vào bạn ấy nhé!` : this.act.desc;
  }

  setup() {
    this.rounds = [3, 4, 5, 5, 6][this.level - 1];
    const pool = this.level <= 2 ? this.careList.filter((c) => EASY.includes(c.id)) : this.careList;
    // không lặp lại nhu cầu liền nhau
    this.needs = [];
    while (this.needs.length < this.rounds) {
      for (const c of shuffle(pool)) if (this.needs.length < this.rounds && this.needs[this.needs.length - 1] !== c) this.needs.push(c);
    }
    this.fx = this.add.container(0, 0).setDepth(820);
    this.updateDots();
  }

  // bạn thú to ở giữa màn hình (thay cho bạn nhỏ ở góc)
  placePet() {
    const s = this.petSprite; if (!s) return;
    this.ps = this.portrait ? 3.1 : 2.3;
    this.px = this.portrait ? this.W / 2 - 40 : this.W * 0.4;
    this.feet = this.portrait ? this.H - 560 : this.H - 250;
    s.setScale(this.ps).setPosition(this.px, this.feet);
  }
  get petH() { return 160 * this.ps; }
  /** Tâm thân bạn thú (để đặt vết bùn, kiểm tra thả đồ). */
  get body() { return { x: this.px, y: this.feet - this.petH * 0.4, rx: this.petH * 0.28, ry: this.petH * 0.3 }; }

  buildRound() {
    this.care = this.needs[this.round];
    this.phase = 'choose'; this.scrubber = null;
    this.fx.removeAll(true); this.spots = [];
    this.tweens.killTweensOf(this.petSprite);
    this.placePet();
    this.petPlay('idle-front');
    this.layer.add(this.label(this.W / 2, this.top + 30, 'Bạn thú cần gì nhỉ?', 54));

    // bong bóng ý nghĩ
    const b = this.body;
    const bx = this.px + this.petH * 0.5, by = this.feet - this.petH * 0.98;
    const g = this.add.graphics();
    g.fillStyle(0x4c3876, 0.12).fillEllipse(bx + 6, by + 10, 230, 190);
    g.fillStyle(0xffffff, 1).fillEllipse(bx, by, 230, 190).fillCircle(bx - 110, by + 95, 20).fillCircle(bx - 140, by + 130, 12);
    g.lineStyle(5, 0xc7b5f0, 1).strokeEllipse(bx, by, 230, 190).strokeCircle(bx - 110, by + 95, 20).strokeCircle(bx - 140, by + 130, 12);
    const icon = this.fitImage(this.care.need, bx, by, 140, 140);
    this.bubble = this.add.container(0, 0, [g, icon]);
    this.bubble.setAlpha(0);
    this.tweens.add({ targets: this.bubble, alpha: 1, duration: 300, delay: 250 });
    this.tweens.add({ targets: icon, scale: icon.getData('baseScale') * 1.08, duration: 700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    this.layer.add(this.bubble);

    // vết bùn / lông rối trên người bạn thú
    if (this.care.id === 'dirty' || this.care.id === 'messy') {
      const n = [3, 4, 5, 5, 6][this.level - 1];
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2 + Math.random() * 0.5, r = 0.35 + Math.random() * 0.55;
        const x = b.x + Math.cos(a) * b.rx * r, y = b.y + Math.sin(a) * b.ry * r;
        const sp = this.add.graphics().setPosition(x, y);
        if (this.care.id === 'dirty') {
          sp.fillStyle(0x9b7453, 0.92).fillEllipse(0, 0, 54 + Math.random() * 20, 40 + Math.random() * 12).fillCircle(26, -16, 9).fillCircle(-24, 18, 7);
          sp.fillStyle(0xc99f74, 0.7).fillEllipse(-8, -6, 18, 10);
        } else {
          sp.lineStyle(7, 0xb07a4a, 1);
          sp.beginPath(); sp.moveTo(-28, 4);
          for (let t = 0; t <= 1.001; t += 0.1) sp.lineTo(-28 + t * 56 + Math.sin(t * 18) * 10, 4 + Math.cos(t * 18) * 14);
          sp.strokePath();
        }
        sp.setData('hp', 1);
        this.spots.push(sp); this.fx.add(sp);
      }
    }

    // khay đồ
    const nTools = [3, 4, 4, 5, 6][this.level - 1];
    const others = shuffle(this.careList.filter((c) => c !== this.care)).slice(0, nTools - 1);
    const list = shuffle([this.care, ...others]);
    const perRow = this.portrait ? 3 : list.length, rows = Math.ceil(list.length / perRow);
    const cw = this.portrait ? 250 : Math.min(190, (this.W - 200) / list.length);
    const ty = this.portrait ? this.H - 250 - (rows - 1) * 200 : this.H - 105;
    this.layer.add(this.plate(this.W / 2, ty + (rows - 1) * 100, Math.min(perRow, list.length) * cw + 40, rows * 200 - 10, 0xfffaf2, 0.85));
    this.tools = list.map((c, i) => {
      const row = Math.floor(i / perRow), col = i % perRow, inRow = Math.min(perRow, list.length - row * perRow);
      const x = this.W / 2 + (col - (inRow - 1) / 2) * cw, y = ty + row * 200;
      const t = this.fitImage(c.tool, x, y, 150, 150);
      t.setData({ c, home: { x, y } }).setInteractive({ useHandCursor: true, draggable: true });
      this.input.setDraggable(t);
      t.on('dragstart', () => { if (this.phase !== 'anim') { Audio.sfx('pop'); this.layer.bringToTop(t); } });
      t.on('drag', (_p: any, x2: number, y2: number) => { if (this.phase === 'choose' || (this.phase === 'scrub' && t === this.scrubber)) { t.setPosition(x2, y2); if (t === this.scrubber) this.scrub(t); } });
      t.on('dragend', (p: any) => { if (p.getDistance() >= 14 && this.phase === 'choose') this.give(t, true); });
      t.on('pointerup', (p: any) => { if (p.getDistance() < 14 && this.phase === 'choose') this.give(t, false); });
      this.layer.add(t);
      return t;
    });

    this.time.delayedCall(500, () => {
      if (this.level <= 2) this.say(`${this.care.say} Bạn ấy cần ${this.care.tname}.`);
      else this.say(this.care.say);
    });
  }

  goHome(t: any) { const h = t.getData('home'); this.tweens.add({ targets: t, x: h.x, y: h.y, scale: t.getData('baseScale'), duration: 280, ease: 'Back.easeOut' }); }

  /** Bé đưa một món đồ cho bạn thú (dropped = kéo thả; ngược lại là chạm). */
  give(t: any, dropped: boolean) {
    const b = this.body;
    if (dropped && Math.hypot((t.x - b.x) / (b.rx * 1.6), (t.y - b.y) / (b.ry * 1.6)) > 1) { this.goHome(t); return; }
    const c = t.getData('c') as Care;
    if (c !== this.care) {
      this.goHome(t);
      this.miss(this.petSprite, this.level <= 2 || this.roundMistakes >= 1 ? `Không phải ${c.tname} đâu. Bạn ấy cần ${this.care.tname} cơ!` : 'Chưa đúng rồi. Nhìn bong bóng xem bạn ấy cần gì nhé!');
      if (this.roundMistakes >= 2) { const right = this.tools.find((x) => x.getData('c') === this.care); if (right) this.pulse(right, 1.25); }
      return;
    }
    this.tweens.add({ targets: this.bubble, alpha: 0, duration: 250 });
    if (c.id === 'dirty' || c.id === 'messy') return this.startScrub(t);
    this.phase = 'anim';
    t.disableInteractive();
    const front = { x: this.px + this.petH * 0.32, y: this.feet - 40 };
    if (c.id === 'hungry' || c.id === 'thirsty') {
      this.tweens.add({ targets: t, x: front.x, y: front.y, duration: 380, ease: 'Cubic.easeOut', onComplete: () => {
        this.petPlay('interact');
        for (let i = 0; i < 3; i++) this.time.delayedCall(i * 420, () => { Audio.sfx(c.id === 'hungry' ? 'munch' : 'splash'); this.pulse(t, 0.9); });
        this.time.delayedCall(1400, () => this.tweens.add({ targets: t, alpha: 0, scale: 0.2, duration: 300, onComplete: () => this.cared(t) }));
      } });
    } else if (c.id === 'sleepy') {
      this.tweens.add({ targets: t, x: this.px, y: this.feet + 10, duration: 380, ease: 'Cubic.easeOut', onComplete: () => {
        Audio.sfx('yawn');
        const night = this.add.rectangle(this.W / 2, this.H / 2, this.W * 3, this.H * 3, 0x2f2c5d, 0).setDepth(805);
        this.fx.add(night);
        this.tweens.add({ targets: night, fillAlpha: 0.5, duration: 500, yoyo: true, hold: 1800 });
        this.petPlay('idle-back'); this.petSprite.anims.timeScale = 0.4;
        this.tweens.add({ targets: this.petSprite, scaleY: this.ps * 0.96, duration: 600, yoyo: true, repeat: 1, ease: 'Sine.easeInOut' });
        for (let i = 0; i < 4; i++) this.time.delayedCall(300 + i * 450, () => {
          const z = this.label(this.px + 60 + i * 14, this.feet - this.petH * 0.8, 'z', 40 + i * 10, '#9b85d9').setDepth(830);
          this.fx.add(z);
          this.tweens.add({ targets: z, y: z.y - 160, x: z.x + 60, alpha: 0, duration: 1400, onComplete: () => z.destroy() });
        });
        this.time.delayedCall(2700, () => { this.petSprite.anims.timeScale = 1; this.tweens.add({ targets: t, alpha: 0, duration: 300 }); this.cared(t); });
      } });
    } else {
      // chơi bóng: bóng nảy qua lại, bạn thú nhảy theo
      const pts = [[this.px + 260, this.feet - 40], [this.px - 220, this.feet - 30], [this.px + 140, this.feet - 20]];
      this.petPlay('happy');
      const hop = () => this.tweens.add({ targets: this.petSprite, y: this.feet - 50, duration: 220, yoyo: true, ease: 'Quad.easeOut' });
      let chain = Promise.resolve();
      pts.forEach(([x, y], i) => {
        chain = chain.then(() => new Promise<void>((ok) => {
          const sx = t.x, sy = t.y;
          this.tweens.addCounter({ from: 0, to: 1, duration: 520, ease: 'Linear', onUpdate: (tw: any) => {
            const v = tw.getValue(); t.setPosition(sx + (x - sx) * v, sy + (y - sy) * v - Math.sin(v * Math.PI) * 220); t.setAngle(v * 360);
          }, onComplete: () => { Audio.sfx('pop'); if (i % 2 === 0) hop(); ok(); } });
        }));
      });
      chain.then(() => this.time.delayedCall(200, () => { this.tweens.add({ targets: t, alpha: 0, duration: 300 }); this.cared(t); }));
    }
  }

  startScrub(t: any) {
    this.phase = 'scrub';
    this.scrubber = t;
    const b = this.body;
    this.tweens.add({ targets: t, x: b.x + b.rx * 0.9, y: b.y, scale: t.getData('baseScale') * 0.85, duration: 300, ease: 'Cubic.easeOut' });
    t.setDepth(840); this.layer.remove(t); this.fx.add(t);
    this.say(this.instruction());
  }

  /** Món đồ chà/chải đi qua vết bẩn → vết mờ dần. */
  scrub(t: any) {
    const reach = 70 * this.ps / 2.3;
    let any = false;
    for (const s of this.spots) {
      if (s.getData('hp') <= 0 || Math.hypot(s.x - t.x, s.y - t.y) > reach) continue;
      const hp = s.getData('hp') - (this.level <= 2 ? 0.12 : 0.08);
      s.setData('hp', hp); s.setAlpha(Math.max(0, hp)); any = true;
      if (hp <= 0) { this.sparkle(s.x, s.y, 6); Audio.sfx('good'); }
    }
    if (any && Math.random() < 0.35) {
      if (this.care.id === 'dirty') {
        Audio.sfx('bubble');
        const bub = this.add.circle(t.x + randInt(-40, 40), t.y + randInt(-30, 30), randInt(8, 18), 0xffffff, 0.85).setStrokeStyle(3, 0xa9c9ec);
        this.fx.add(bub);
        this.tweens.add({ targets: bub, y: bub.y - 90, alpha: 0, duration: 900, onComplete: () => bub.destroy() });
      } else this.sparkle(t.x, t.y, 3);
    }
    if (this.spots.every((s) => s.getData('hp') <= 0) && this.phase === 'scrub') {
      this.phase = 'anim';
      t.disableInteractive();
      this.tweens.add({ targets: t, alpha: 0, duration: 300 });
      this.cared(t);
    }
  }

  cared(_t: any) {
    this.petPlay('happy');
    this.time.delayedCall(900, () => this.petPlay('idle-front'));
    this.good(this.px, this.feet - this.petH * 0.6, false);
    this.say(this.care.done);
    this.nextRound(1500);
  }

  hint() {
    if (this.phase === 'scrub') { this.say(this.instruction()); for (const s of this.spots) if (s.getData('hp') > 0) this.tweens.add({ targets: s, scale: 1.3, duration: 200, yoyo: true }); return; }
    this.say(`${this.care.say} Bạn ấy cần ${this.care.tname}.`);
    const right = this.tools.find((x) => x.getData('c') === this.care);
    if (right) this.pulse(right, 1.25);
  }
}
