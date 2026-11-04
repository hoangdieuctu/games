// ── Màn chào: chọn hồ sơ bé hoặc tạo hồ sơ mới (tên, độ tuổi, bạn đồng hành) ──
import { AssetLoader } from '../services/AssetLoader.js';
import { Store, AgeBand } from '../services/Store.js';
import { Audio } from '../services/Audio.js';
import { Hud } from '../services/Hud.js';
import { Ui } from '../services/Ui.js';
import { preloadWithProgress } from './BootScene.js';

declare const Phaser: any;

const AGES: [AgeBand, string, string][] = [['toddler', '2–3 tuổi', 'Bé xíu'], ['preschool', '4–5 tuổi', 'Mầm non'], ['explorer', '6–8 tuổi', 'Nhà thám hiểm']];

export class HomeScene extends Phaser.Scene {
  bg: any; form = { name: '', age: 'preschool' as AgeBand, pet: 'fox' }; creating = false;
  constructor() { super('Home'); }

  preload() {
    preloadWithProgress(this, () => AssetLoader.queueIds(this, ['world-map-base', 'world-map-home-island', 'cloud-1', 'world-map-cloud-1', 'world-map-cloud-2']), 'Đang mở Thế Giới Nhỏ…');
  }

  create(data: any) {
    if (Ui.stale(this)) return;
    Ui.setActiveTab('Home');
    Hud.show(false); Hud.hideGuide();
    this.cameras.main.setBackgroundColor('#5ab4e0');
    const W = AssetLoader.data('world');
    if (this.textures.exists(W.background)) {
      this.bg = this.add.image(0, 0, W.background).setOrigin(0, 0).setDisplaySize(W.width, W.height);
      this.layout();
      this.tweens.add({ targets: this.cameras.main, scrollX: '+=220', duration: 26000, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    }
    for (const k of ['world-map-cloud-1', 'world-map-cloud-2']) {
      if (!this.textures.exists(k)) continue;
      const c = this.add.image(Math.random() * W.width, 300 + Math.random() * 1200, k).setScale(0.8).setAlpha(0.95);
      this.tweens.add({ targets: c, x: c.x + 900, duration: 40000, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    }
    this.scale.on('resize', this.layout, this);
    this.events.once('shutdown', () => { this.scale.off('resize', this.layout, this); Ui.clearPanel(); });
    this.creating = !!data?.create || !Store.profiles.length;
    this.render();
  }

  layout() {
    const W = AssetLoader.data('world');
    const z = Math.max(this.scale.width / W.width, this.scale.height / W.height) * 1.25;
    this.cameras.main.setZoom(z);
    this.cameras.main.centerOn(W.homeIsland.x, W.homeIsland.y);
  }

  render() {
    const pets = AssetLoader.data('pets') || {};
    const portrait = (id: string) => AssetLoader.url(`${id}-portrait`);
    let html: string;
    if (!this.creating) {
      html = `
        <div class="home-box">
          <h1 class="logo">Thế Giới Nhỏ</h1>
          <p class="tag">Khám phá · Học hỏi · Sáng tạo · Lớn lên</p>
          <h3>Ai đang chơi nào?</h3>
          <div class="profiles">${Store.profiles.map((p) => `
            <button class="prof" data-id="${p.id}"><img src="${portrait(p.pet)}" alt=""><b>${Ui.esc(p.name)}</b><span><img src="${AssetLoader.url('reward-star')}" alt="">${p.earned.star}</span></button>`).join('')}
            <button class="prof add" data-a="new"><span class="plus">+</span><b>Thêm bé</b></button>
          </div>
        </div>`;
    } else {
      const f = this.form;
      html = `
        <div class="home-box">
          <h1 class="logo">Thế Giới Nhỏ</h1>
          <p class="tag">Một hòn đảo nhỏ đang chờ bé!</p>
          <label class="field"><span>Tên của bé</span><input id="pname" maxlength="16" placeholder="Ví dụ: Bông" value="${Ui.esc(f.name)}" autocomplete="off"></label>
          <div class="field"><span>Bé mấy tuổi?</span><div class="seg wide big">${AGES.map(([k, a, n]) => `<button data-age="${k}" class="${f.age === k ? 'on' : ''}"><b>${a}</b><small>${n}</small></button>`).join('')}</div></div>
          <div class="field"><span>Chọn bạn đồng hành</span><div class="pet-pick">${['fox', 'bunny', 'bear'].map((id) => `
            <button data-pet="${id}" class="${f.pet === id ? 'on' : ''}"><img src="${portrait(id)}" alt=""><b>${Ui.esc(pets[id]?.name || id)}</b></button>`).join('')}</div>
            <p class="hint">${Ui.esc(pets[f.pet]?.personality || '')}</p></div>
          <div class="row center">
            ${Store.profiles.length ? '<button class="btn big ghost" data-a="cancel">Quay lại</button>' : ''}
            <button class="btn big accent" data-a="go">Bắt đầu phiêu lưu!</button>
          </div>
        </div>`;
    }
    const el = Ui.panel(html, 'home-panel');
    const name = el.querySelector('#pname') as HTMLInputElement | null;
    if (name) name.oninput = () => { this.form.name = name.value; };
    el.onclick = (e: any) => {
      const b = e.target.closest('button'); if (!b) return;
      Audio.unlock(); Audio.sfx('tap');
      const d = b.dataset;
      if (d.id) { Store.selectProfile(d.id); this.enter(); }
      else if (d.a === 'new') { this.creating = true; this.form = { name: '', age: 'preschool', pet: 'fox' }; this.render(); }
      else if (d.a === 'cancel') { this.creating = false; this.render(); }
      else if (d.age) { this.form.age = d.age; this.render(); }
      else if (d.pet) { this.form.pet = d.pet; Audio.sfx('pop'); this.render(); }
      else if (d.a === 'go') {
        Store.createProfile(this.form.name || 'Bé', this.form.age, this.form.pet);
        this.enter();
      }
    };
  }

  enter() {
    Store.startSession();
    Ui.clearPanel();
    window.dispatchEvent(new Event('lw-profile'));
    location.hash = 'island';
  }
}
