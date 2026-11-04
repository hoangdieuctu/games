// ── Hoạt động thêm: Phân loại rác (Ngôi Làng Kỹ Năng) · Biển sạch (Đại Dương Khám Phá) ──
// Một scene, hai bộ nội dung — thêm bộ mới chỉ cần thêm mode.
import { AssetLoader } from '../services/AssetLoader.js';
import { Audio } from '../services/Audio.js';
import { MiniGame, shuffle } from '../scenes/MiniGame.js';

declare const Phaser: any;

export const SORT_NAMES: Record<string, string> = {
  'trash-bottle': 'chai nhựa', 'trash-can': 'lon nước', 'trash-paper': 'giấy vụn', 'trash-box': 'hộp giấy',
  'trash-banana-peel': 'vỏ chuối', 'trash-apple-core': 'lõi táo', 'trash-leaf': 'lá khô', 'trash-eggshell': 'vỏ trứng', 'trash-bag': 'túi ni lông',
  'sea-crab': 'bạn cua', 'sea-jellyfish': 'bạn sứa', 'sea-octopus': 'bạn bạch tuộc', 'animal-fish': 'bạn cá', 'animal-turtle': 'bạn rùa',
};

export class SortScene extends MiniGame {
  queue: string[] = []; current: any = null; bins: any[] = []; left = 0; floaters: any[] = []; boat: any;
  constructor() { super('Sort'); }
  get play() { return AssetLoader.data('play'); }
  assets() {
    const S = this.play.sort;
    return [...S.recycle, ...S.organic, ...S.oceanTrash, ...S.seaLife, 'bin-recycle', 'bin-organic', 'sort-boat'];
  }
  instruction() {
    return this.mode === 'ocean' ? 'Chạm vào rác để nhặt lên thuyền. Các bạn sinh vật biển thì để yên nhé!'
      : 'Rác tái chế bỏ thùng xanh dương, rác hữu cơ bỏ thùng xanh lá nhé!';
  }

  buildRound() { if (this.mode === 'ocean') this.buildOcean(); else this.buildTrash(); }

  // ───── phân loại rác ─────
  buildTrash() {
    const S = this.play.sort;
    const n = [4, 6, 8, 10, 12][this.level - 1];
    const pool = [...S.recycle, ...S.organic];
    this.queue = shuffle(Array.from({ length: n }, (_, i) => pool[i % pool.length]));
    this.left = n;
    this.layer.add(this.label(this.W / 2, this.top + 30, 'Bỏ rác vào đúng thùng', 54));
    const by = this.H - (this.portrait ? 260 : 60);
    const defs = [
      { key: 'bin-recycle', kind: 'recycle', name: 'Tái chế', x: this.W / 2 - (this.portrait ? 220 : 330) },
      { key: 'bin-organic', kind: 'organic', name: 'Hữu cơ', x: this.W / 2 + (this.portrait ? 220 : 330) },
    ];
    this.bins = defs.map((d) => {
      const img = this.fitImage(d.key, d.x, by, 300, 360).setOrigin(0.5, 0.95);
      const t = this.label(d.x, by + 30, d.name, 40);
      this.layer.add([img, t]);
      return { ...d, img };
    });
    // hình nhỏ minh hoạ dưới mỗi thùng (cấp thấp)
    if (this.level <= 2) {
      this.layer.add(this.fitImage(S.recycle[0], defs[0].x + 110, by - 300, 70, 70));
      this.layer.add(this.fitImage(S.organic[0], defs[1].x + 110, by - 300, 70, 70));
    }
    this.nextItem();
    this.time.delayedCall(300, () => this.say(this.instruction()));
  }

  nextItem() {
    const key = this.queue.shift();
    if (!key) { this.complete(); return; }
    const S = this.play.sort;
    const kind = S.recycle.includes(key) ? 'recycle' : 'organic';
    const x = this.W / 2, y = this.portrait ? this.top + 380 : this.top + 240;
    const it = this.fitImage(key, x, y, 200, 200);
    it.setData({ key, kind, home: { x, y } });
    it.setInteractive({ draggable: true, useHandCursor: true });
    this.input.setDraggable(it);
    it.setScale(0);
    this.tweens.add({ targets: it, scale: it.getData('baseScale'), duration: 300, ease: 'Back.easeOut' });
    it.on('drag', (_p: any, px: number, py: number) => { it.setPosition(px, py); for (const b of this.bins) b.img.setScale(b.img.getData('baseScale') * (this.overBin(it) === b ? 1.08 : 1)); });
    it.on('dragstart', () => Audio.sfx('pop'));
    it.on('dragend', () => this.dropItem(it));
    this.layer.add(it);
    this.current = it;
    if (this.level <= 2) this.time.delayedCall(400, () => Audio.say(SORT_NAMES[key]));
  }
  overBin(it: any) { return this.bins.find((b) => Math.abs(it.x - b.x) < 150 && it.y > b.img.y - 380 && it.y < b.img.y + 20); }

  dropItem(it: any) {
    const b = this.overBin(it);
    for (const x of this.bins) x.img.setScale(x.img.getData('baseScale'));
    if (b && b.kind === it.getData('kind')) {
      it.disableInteractive();
      this.tweens.add({ targets: it, x: b.x, y: b.img.y - 250, scale: 0.1, duration: 280, ease: 'Quad.easeIn', onComplete: () => it.destroy() });
      this.tweens.add({ targets: b.img, scaleY: b.img.getData('baseScale') * 0.92, duration: 100, yoyo: true, delay: 250 });
      this.good(b.x, b.img.y - 280, Math.random() < 0.4);
      this.left--;
      this.time.delayedCall(500, () => this.nextItem());
    } else {
      if (b) {
        const name = SORT_NAMES[it.getData('key')];
        this.miss(b.img, it.getData('kind') === 'recycle' ? `${cap(name)} tái chế được, bỏ thùng xanh dương nhé!` : `${cap(name)} là rác hữu cơ, bỏ thùng xanh lá nhé!`);
      }
      const h = it.getData('home');
      this.tweens.add({ targets: it, x: h.x, y: h.y, duration: 300, ease: 'Back.easeOut' });
    }
  }

  // ───── biển sạch ─────
  buildOcean() {
    const S = this.play.sort;
    const nT = [4, 5, 6, 8, 10][this.level - 1], nL = [2, 3, 4, 5, 6][this.level - 1];
    this.left = nT;
    this.layer.add(this.label(this.W / 2, this.top + 30, 'Nhặt hết rác dưới biển', 54));
    const bx = this.portrait ? this.W / 2 : this.W - 230, byy = this.portrait ? this.H - 250 : this.H - 140;
    this.boat = this.fitImage('sort-boat', bx, byy, 380, 240);
    this.layer.add(this.boat);
    this.tweens.add({ targets: this.boat, y: byy - 8, angle: 2, duration: 1300, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    const things = shuffle([
      ...Array.from({ length: nT }, (_, i) => ({ key: S.oceanTrash[i % S.oceanTrash.length], trash: true })),
      ...Array.from({ length: nL }, (_, i) => ({ key: S.seaLife[i % S.seaLife.length], trash: false })),
    ]);
    const area = this.portrait ? { x: 60, y: this.top + 120, w: this.W - 120, h: this.H - this.top - 520 } : { x: 300, y: this.top + 110, w: this.W - 700, h: this.H - this.top - 200 };
    const pts: [number, number][] = [];
    for (let t = 0; pts.length < things.length && t < 3000; t++) {
      const x = area.x + Math.random() * area.w, y = area.y + Math.random() * area.h;
      if (pts.every(([a, b]) => Math.hypot(a - x, b - y) > (t > 2000 ? 100 : 150))) pts.push([x, y]);
    }
    things.forEach((th, i) => {
      const [x, y] = pts[i] || [area.x + area.w / 2, area.y + area.h / 2];
      const s = this.fitImage(th.key, x, y, th.trash ? 140 : 170, th.trash ? 140 : 170);
      s.setData(th).setInteractive({ useHandCursor: true });
      s.setAngle(th.trash ? Math.random() * 40 - 20 : 0);
      this.tweens.add({ targets: s, y: y - 18, x: x + (Math.random() - 0.5) * 30, duration: 1400 + Math.random() * 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      s.on('pointerup', () => this.tapOcean(s));
      this.layer.add(s);
    });
    this.time.delayedCall(300, () => this.say(this.instruction()));
  }

  tapOcean(s: any) {
    if (this.busy) return;
    if (s.getData('trash')) {
      s.disableInteractive();
      this.tweens.killTweensOf(s);
      Audio.sfx('whoosh');
      this.tweens.add({ targets: s, x: this.boat.x + (Math.random() - 0.5) * 80, y: this.boat.y - 40, scale: s.getData('baseScale') * 0.4, angle: 360, duration: 520, ease: 'Cubic.easeIn', onComplete: () => { s.destroy(); this.sparkle(this.boat.x, this.boat.y - 40, 6); } });
      Audio.sfx('pop');
      if (--this.left <= 0) {
        this.busy = true;
        this.time.delayedCall(700, () => { this.say('Biển sạch rồi! Các bạn sinh vật biển cảm ơn bạn!'); this.complete(); });
      }
    } else {
      // không phạt: bạn sinh vật biển vẫy chào
      this.mistakes += 0.5;
      Audio.sfx('bloop');
      this.tweens.add({ targets: s, angle: { from: -12, to: 12 }, duration: 120, yoyo: true, repeat: 3, onComplete: () => s.setAngle(0) });
      this.say(`Mình là ${SORT_NAMES[s.getData('key')]}, mình sống ở biển! Hãy nhặt rác thôi nhé.`);
    }
  }
}
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
