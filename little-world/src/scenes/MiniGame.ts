// ── Khung chung cho mọi mini-game ──
// Không gian thiết kế cố định (1600×900 ngang / 900×1600 dọc), camera tự co giãn cho vừa màn hình.
// Mỗi game chỉ cần: buildRound(), và gọi good()/miss()/nextRound()/complete().
import { AssetLoader } from '../services/AssetLoader.js';
import { Store } from '../services/Store.js';
import { Audio } from '../services/Audio.js';
import { Hud } from '../services/Hud.js';
import { Ui } from '../services/Ui.js';
import { actById, Activity, pick, PET_LINES } from '../data/Content.js';
import { preloadWithProgress } from './BootScene.js';

declare const Phaser: any;

export const FONT = '"Baloo 2", Nunito, sans-serif';
export const shuffle = <T>(a: T[]): T[] => { const b = a.slice(); for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };
export const randInt = (a: number, b: number) => a + Math.floor(Math.random() * (b - a + 1));

export class MiniGame extends Phaser.Scene {
  act: Activity = null as any;
  mode = '';
  level = 1;
  round = 0;
  rounds = 5;
  mistakes = 0;
  roundMistakes = 0;
  startedAt = 0;
  W = 1600; H = 900; portrait = false;
  bg: any; bgKey = '';
  layer: any;            // container cho nội dung của vòng hiện tại
  dots: any;
  busy = false;
  done = false;
  petSprite: any;

  init(data: any) {
    this.act = actById(data?.act) || actById('animal-match')!;
    this.mode = this.act.mode || '';
    this.level = Store.level(this.act.id);
    this.rounds = this.act.rounds;
    this.round = 0; this.mistakes = 0; this.roundMistakes = 0; this.done = false; this.busy = false;
    this.W = 0; this.H = 0; this.portrait = false;
  }

  /** Tài sản riêng của game (id). */
  assets(): string[] { return []; }

  preload() {
    const region = (AssetLoader.data('world')?.regions || []).find((r: any) => r.id === this.act.region);
    this.bgKey = region?.background || '';
    const pets = AssetLoader.data('pets') || {};
    const pet = Store.p?.pet || 'fox';
    preloadWithProgress(this, () => AssetLoader.queueIds(this, [this.bgKey, pets[pet]?.sheet, ...this.assets()]), 'Đang chuẩn bị trò chơi…');
  }

  create() {
    if (Ui.stale(this)) return;
    Ui.setActiveTab('Play');
    AssetLoader.createAnimations(this);
    this.cameras.main.setBackgroundColor('#dff3fd');
    if (this.bgKey && this.textures.exists(this.bgKey)) this.bg = this.add.image(0, 0, this.bgKey).setDepth(-100);
    this.layer = this.add.container(0, 0);
    this.dots = this.add.container(0, 0).setDepth(900);
    this.spawnPet();
    this.fit();
    this.scale.on('resize', this.onResize, this);
    this.events.once('shutdown', () => { this.scale.off('resize', this.onResize, this); Ui.clearPanel(); Hud.hideGuide(); });
    this.buildBar();
    this.startedAt = Date.now();
    this.setup();
    this.startRound();
  }

  /** Gọi một lần trước vòng đầu (tuỳ game). */
  setup() { /* */ }
  buildRound() { /* game ghi đè */ }

  // ───────── bố cục ─────────
  fit() {
    const sw = this.scale.width, sh = this.scale.height;
    const portrait = sh > sw * 1.1;
    const changed = portrait !== this.portrait;
    this.portrait = portrait;
    // không gian thiết kế co theo tỉ lệ màn hình (ngang: cao 900; dọc: rộng 900)
    const ar = sw / sh, clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
    const W = portrait ? 900 : Math.round(clamp(900 * ar, 1300, 2000)), H = portrait ? Math.round(clamp(900 / ar, 1350, 2000)) : 900;
    // chỉ dựng lại khi đổi đáng kể (thanh địa chỉ điện thoại ẩn/hiện thì không)
    const changed2 = Math.abs(W - this.W) > this.W * 0.1 || Math.abs(H - this.H) > this.H * 0.1;
    if (!changed && !changed2 && this.layer) { this.applyCam(sw, sh); return false; }
    this.W = W; this.H = H;
    this.applyCam(sw, sh);
    return changed || changed2;
  }
  applyCam(sw: number, sh: number) {
    const cam = this.cameras.main;
    const z = Math.min(sw / this.W, sh / this.H);
    cam.setZoom(z);
    cam.centerOn(this.W / 2, this.H / 2);
    if (this.bg) {
      // ảnh nền phủ kín cả phần thừa ngoài không gian thiết kế
      const vw = sw / z, vh = sh / z;
      const s = Math.max(vw / this.bg.width, vh / this.bg.height);
      this.bg.setScale(s).setPosition(this.W / 2, this.H / 2);
    }
    this.placePet();
  }
  onResize() { if (this.fit() && !this.done) this.relayout(); }
  /** Đổi chiều màn hình: dựng lại vòng hiện tại. */
  relayout() { this.startRound(true); }

  /** Toạ độ trên cùng của vùng chơi (dưới thanh trên của trang). */
  get top() { return this.portrait ? 290 : 120; }

  // ───────── thanh điều khiển (DOM) ─────────
  buildBar() {
    const el = Ui.panel(`
      <div class="game-bar">
        <button class="btn icon" data-a="exit" aria-label="Thoát">✕</button>
        <div class="gb-title"><b>${Ui.esc(this.act.name)}</b><span>Cấp ${this.level}</span></div>
        <div class="gb-dots"></div>
        <button class="btn icon" data-a="hint" aria-label="Gợi ý">?</button>
      </div>`, 'game-panel');
    el.onclick = (e: any) => {
      const a = e.target.closest('button')?.dataset.a;
      if (a === 'exit') { Audio.sfx('tap'); this.exit(); }
      else if (a === 'hint') { Audio.sfx('tap'); this.hint(); }
    };
    this.updateDots();
  }
  updateDots() {
    const d = document.querySelector('.gb-dots'); if (!d) return;
    if (this.rounds <= 1) { d.innerHTML = ''; return; }
    d.innerHTML = Array.from({ length: this.rounds }, (_, i) => `<i class="${i < this.round ? 'on' : i === this.round ? 'cur' : ''}"></i>`).join('');
  }

  exit() { location.hash = 'map/' + this.act.region; }
  hint() { this.say(this.instruction()); }
  instruction(): string { return this.act.desc; }

  // ───────── vòng chơi ─────────
  startRound(same = false) {
    if (!same) this.roundMistakes = 0;
    this.busy = false;
    this.tweens.killTweensOf(this.layer.list);
    this.layer.removeAll(true);
    this.input.setDraggable && this.layer.list.forEach(() => 0);
    this.buildRound();
    this.updateDots();
  }

  nextRound(delay = 900) {
    this.busy = true;
    this.time.delayedCall(delay, () => {
      this.round++;
      if (this.round >= this.rounds) this.complete();
      else this.startRound();
    });
  }

  /** Bé làm đúng: lấp lánh + tiếng vui + thú cưng khen. */
  good(x: number, y: number, praise = true) {
    Audio.sfx('good');
    this.sparkle(x, y);
    if (praise) { this.petReact('happy'); if (Math.random() < 0.6) this.say(pick(PET_LINES.great), false); }
  }
  /** Bé chọn chưa đúng: không phạt, chỉ lắc nhẹ + gợi ý. */
  miss(obj?: any, hint?: string) {
    this.mistakes++; this.roundMistakes++;
    Audio.sfx('soft');
    if (obj) {
      const x0 = obj.x;
      this.tweens.add({ targets: obj, x: x0 + 12, duration: 60, yoyo: true, repeat: 2, onComplete: () => (obj.x = x0) });
    }
    if (hint) this.say(hint);
    else if (this.roundMistakes === 2) this.say(pick(PET_LINES.tryAgain));
  }

  complete(extra: { noAdapt?: boolean } = {}) {
    if (this.done) return;
    this.done = true;
    this.petReact('celebrate');
    this.confetti();
    const res = Store.finish(this.act.id, { mistakes: this.mistakes, ms: Date.now() - this.startedAt, rounds: this.rounds, ...extra });
    this.time.delayedCall(900, () => {
      Hud.rewardModal(res, pick(['Bé giỏi quá!', 'Hoàn thành rồi!', 'Tuyệt vời!']), {
        again: () => this.scene.restart({ act: this.act.id }),
        island: () => { location.hash = 'island'; },
        map: () => { location.hash = 'map/' + this.act.region; },
      });
    });
  }

  say(text: string, speak = true) { Hud.say(text, { speak }); }

  // ───────── thú cưng ở góc ─────────
  spawnPet() {
    const pets = AssetLoader.data('pets') || {};
    const id = Store.p?.pet || 'fox';
    const P = pets[id];
    if (!P || !this.textures.exists(P.sheet)) return;
    this.petSprite = this.add.sprite(0, 0, P.sheet).setOrigin(0.5, 0.92).setDepth(800);
    this.petSprite.setData('id', id);
    this.petPlay('greet', true);
    this.petSprite.setInteractive({ pixelPerfect: true, alphaTolerance: 40, useHandCursor: true });
    this.petSprite.on('pointerup', () => { this.petPlay('interact', true); this.hint(); });
  }
  placePet() {
    if (!this.petSprite) return;
    const s = this.portrait ? 1.0 : 1.1;
    this.petSprite.setScale(s).setPosition(this.portrait ? 110 : 120, this.H - 20);
  }
  petPlay(anim: string, once = false) {
    const s = this.petSprite; if (!s) return;
    const key = `${s.getData('id')}-${anim}`;
    if (!this.anims.exists(key)) return;
    s.play(key);
    if (once) s.once('animationcomplete', () => this.petPlay('idle-front'));
  }
  petReact(anim: 'happy' | 'celebrate') { this.petPlay(anim === 'happy' ? 'happy' : 'celebrate', true); if (anim === 'happy') this.time.delayedCall(900, () => this.petPlay('idle-front')); }

  // ───────── hiệu ứng ─────────
  sparkle(x: number, y: number, n = 10) {
    for (let i = 0; i < n; i++) {
      const a = (Math.PI * 2 * i) / n + Math.random() * 0.4;
      const g = this.add.star(x, y, 5, 6, 14, [0xffd96b, 0xffffff, 0xffb8cb, 0xa6e3c4][i % 4]).setDepth(950);
      this.tweens.add({ targets: g, x: x + Math.cos(a) * (70 + Math.random() * 50), y: y + Math.sin(a) * (70 + Math.random() * 50), angle: 180, alpha: 0, scale: 0.4, duration: 650, ease: 'Cubic.easeOut', onComplete: () => g.destroy() });
    }
  }
  confetti() {
    for (let i = 0; i < 60; i++) {
      const x = Math.random() * this.W, c = [0xffd96b, 0xffac6b, 0xffb8cb, 0xa6e3c4, 0xc7b5f0, 0x8fd6f0][i % 6];
      const r = this.add.rectangle(x, -20 - Math.random() * 200, 14, 22, c).setDepth(960).setAngle(Math.random() * 180);
      this.tweens.add({ targets: r, y: this.H + 40, angle: r.angle + 360 + Math.random() * 360, x: x + (Math.random() - 0.5) * 200, duration: 1600 + Math.random() * 1200, ease: 'Sine.easeIn', onComplete: () => r.destroy() });
    }
  }

  /** Khung bo tròn nền trắng mờ (dùng cho thẻ, khay). */
  plate(x: number, y: number, w: number, h: number, color = 0xfffaf2, alpha = 0.92, r = 28) {
    const g = this.add.graphics();
    g.fillStyle(0x4c3876, 0.14).fillRoundedRect(x - w / 2 + 4, y - h / 2 + 8, w, h, r);
    g.fillStyle(color, alpha).fillRoundedRect(x - w / 2, y - h / 2, w, h, r);
    g.lineStyle(5, 0xffffff, 1).strokeRoundedRect(x - w / 2, y - h / 2, w, h, r);
    return g;
  }
  label(x: number, y: number, text: string, size = 44, color = '#4b3a5e') {
    return this.add.text(x, y, text, { fontFamily: FONT, fontSize: size + 'px', fontStyle: '800', color, stroke: '#ffffff', strokeThickness: Math.round(size / 6), align: 'center', wordWrap: { width: this.W - 120 } }).setOrigin(0.5);
  }
  /** Ảnh vừa khít một ô w×h (giữ tỉ lệ). */
  fitImage(key: string, x: number, y: number, w: number, h: number) {
    const img = this.add.image(x, y, key);
    const s = Math.min(w / img.width, h / img.height);
    img.setScale(s);
    img.setData('baseScale', s);
    return img;
  }
  pulse(obj: any, k = 1.08) {
    const s = obj.getData('baseScale') || obj.scale;
    this.tweens.add({ targets: obj, scale: s * k, duration: 160, yoyo: true, ease: 'Quad.easeOut' });
  }

  update(_t: number, _dt: number) { /* */ }
}
