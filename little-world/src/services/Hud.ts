// ── Thanh tài nguyên, lời thú cưng, bảng phần thưởng ──
import { AssetLoader } from './AssetLoader.js';
import { Store } from './Store.js';
import { Audio } from './Audio.js';
import { Ui } from './Ui.js';
import { RES_LIST, RES_NAMES, RES_USE, ACHIEVEMENTS, REGION_STARS, pick, PET_LINES } from '../data/Content.js';

const $ = (s: string) => document.querySelector(s) as HTMLElement;
export const resIcon = (r: string) => AssetLoader.url('reward-' + r);
export const costHtml = (cost: Record<string, number>, cls = 'cost') =>
  `<span class="${cls}">${Object.entries(cost).filter(([, v]) => v).map(([k, v]) => `<span><img src="${resIcon(k)}" alt="${RES_NAMES[k as keyof typeof RES_NAMES]}">${v}</span>`).join('')}</span>`;

let guideTimer: any = null;

export const Hud = {
  show(on: boolean) {
    $('#hud').hidden = !on;
    ($('.tabs') as HTMLElement).hidden = !on;
    if (on) this.render();
  },

  render() {
    const p = Store.p;
    // tên game ở giữa thanh trên: "Thế giới của <tên bé>"
    const sub = document.querySelector('.brand span') as HTMLElement | null;
    if (sub) sub.textContent = p?.name ? `Thế giới của ${p.name}` : 'Little World';
    if (!p) return;
    const el = $('#hud');
    el.innerHTML = RES_LIST.map((r) =>
      `<button class="res" data-res="${r}" title="${RES_NAMES[r]}"><img src="${resIcon(r)}" alt=""><b>${p.res[r]}</b></button>`).join('');
    el.onclick = (e: any) => {
      const b = e.target.closest('[data-res]'); if (!b) return;
      const r = b.dataset.res;
      Audio.sfx('tap');
      Ui.toast(`${RES_NAMES[r as keyof typeof RES_NAMES]}: ${RES_USE[r as keyof typeof RES_USE]}`, 2600);
    };
  },

  /** Nảy số khi tài nguyên tăng. */
  bump(r: string) {
    const b = document.querySelector(`#hud [data-res="${r}"]`) as HTMLElement | null;
    if (!b) return;
    b.classList.remove('bump'); void b.offsetWidth; b.classList.add('bump');
  },

  /** Thú cưng nói một câu (bong bóng + giọng đọc). */
  say(text: string, opts: { speak?: boolean; ms?: number } = {}) {
    const p = Store.p;
    const el = $('#guide');
    const img = el.querySelector('img') as HTMLImageElement;
    const pet = p?.pet || 'fox';
    img.src = AssetLoader.url(`${pet}-portrait`);
    (el.querySelector('p') as HTMLElement).textContent = text;
    el.hidden = false;
    // trong trò chơi trên điện thoại: đặt bong bóng ngay dưới thanh điều khiển
    if (document.body.dataset.scene === 'Play' && window.innerWidth < 760) {
      const r = ($('#panel') as HTMLElement).getBoundingClientRect();
      el.style.top = Math.round(r.bottom + 8) + 'px';
    } else el.style.top = '';
    el.classList.remove('pop'); void el.offsetWidth; el.classList.add('pop');
    el.onclick = () => { Audio.say(text); el.classList.remove('pop'); void el.offsetWidth; el.classList.add('pop'); };
    clearTimeout(guideTimer);
    if (opts.ms !== 0) guideTimer = setTimeout(() => { el.hidden = true; }, opts.ms || Math.max(3500, text.length * 90));
    if (opts.speak !== false) Audio.say(text);
  },
  hideGuide() { clearTimeout(guideTimer); $('#guide').hidden = true; },

  /** Bảng phần thưởng sau khi chơi xong. */
  rewardModal(res: { reward: Record<string, number>; levelBefore: number; levelAfter: number; newAch: string[]; unlocked: string[] },
    title: string, actions: { again: () => void; island: () => void; map: () => void }) {
    const items = Object.entries(res.reward).filter(([, v]) => v).map(([k, v], i) =>
      `<div class="rw" style="animation-delay:${0.15 + i * 0.18}s"><img src="${resIcon(k)}" alt=""><b>+${v}</b><span>${RES_NAMES[k as keyof typeof RES_NAMES]}</span></div>`).join('');
    const lvl = res.levelAfter > res.levelBefore ? `<p class="lvl up">Lần sau sẽ khó hơn một chút — cấp ${res.levelAfter}!</p>`
      : res.levelAfter < res.levelBefore ? `<p class="lvl">Lần sau mình chơi nhẹ nhàng hơn nhé — cấp ${res.levelAfter}.</p>` : '';
    const ach = res.newAch.map((id) => ACHIEVEMENTS.find((a) => a.id === id)).filter(Boolean).map((a: any) =>
      `<div class="ach-new"><img src="${AssetLoader.url(a.icon)}" alt=""><div><b>Huy hiệu mới: ${Ui.esc(a.name)}</b><span>${Ui.esc(a.desc)}</span></div></div>`).join('');
    const regions = (AssetLoader.data('world')?.regions || []) as any[];
    const unl = res.unlocked.map((id) => regions.find((r) => r.id === id)).filter(Boolean).map((r: any) =>
      `<div class="ach-new"><img src="${AssetLoader.url(r.icon)}" alt=""><div><b>Đã mở vùng đất mới: ${Ui.esc(r.name)}!</b><span>Mở bản đồ để ghé thăm nhé.</span></div></div>`).join('');
    const p = Store.p!;
    const el = Ui.modal(`
      <div class="reward-box">
        <img class="rw-pet" src="${AssetLoader.url(p.pet + '-portrait')}" alt="">
        <h2>${Ui.esc(title)}</h2>
        <div class="rw-row">${items}</div>
        ${lvl}${unl}${ach}
        <div class="row center">
          <button class="btn big" data-a="again">Chơi nữa</button>
          <button class="btn big accent" data-a="island">Về đảo trang trí</button>
          <button class="btn big" data-a="map">Bản đồ</button>
        </div>
      </div>`, { noClose: true, cls: 'modal-reward' });
    Audio.sfx('reward');
    if (res.unlocked.length) setTimeout(() => Audio.sfx('unlock'), 900);
    setTimeout(() => { for (const k of Object.keys(res.reward)) this.bump(k); }, 400);
    this.render();
    el.querySelector('.reward-box')!.addEventListener('click', (e: any) => {
      const a = e.target.closest('button')?.dataset.a; if (!a) return;
      Audio.sfx('tap'); Ui.modal(null);
      (actions as any)[a]();
    });
  },

  regionNeed(id: string) { return Math.max(0, (REGION_STARS[id] ?? 0) - Store.starsTotal()); },
  hello() { this.say(pick(PET_LINES.hello)); },
};
