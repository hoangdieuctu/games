// ── Góc phụ huynh: cổng xác nhận người lớn, thống kê, cài đặt, quản lý hồ sơ ──
// Mọi dữ liệu chỉ nằm trên máy này; không gửi đi đâu cả.
import { Store, Profile } from './Store.js';
import { Audio } from './Audio.js';
import { Ui } from './Ui.js';
import { AssetLoader } from './AssetLoader.js';
import { ACTIVITIES, ACHIEVEMENTS, SKILL_NAMES, actById, REGION_STARS } from '../data/Content.js';

const fmtMin = (ms: number) => { const m = Math.round(ms / 60000); return m < 60 ? `${m} phút` : `${Math.floor(m / 60)} giờ ${m % 60} phút`; };
const fmtDate = (t: number) => new Date(t).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
const AGE_NAMES: Record<string, string> = { toddler: '2–3 tuổi', preschool: '4–5 tuổi', explorer: '6–8 tuổi' };

export const Parent = {
  /** Cổng người lớn: phép nhân nhỏ, trẻ nhỏ khó tự bấm đúng. */
  open(onDone?: () => void) {
    const a = 3 + Math.floor(Math.random() * 6), b = 3 + Math.floor(Math.random() * 6), ans = a * b;
    const opts = new Set<number>([ans]);
    while (opts.size < 4) opts.add(ans + (Math.floor(Math.random() * 13) - 6) || ans + 7);
    const list = [...opts].sort(() => Math.random() - 0.5);
    const el = Ui.modal(`
      <div class="parent-gate">
        <h2>Dành cho phụ huynh</h2>
        <p>Để vào, xin chọn kết quả của phép tính:</p>
        <div class="gate-q">${a} × ${b} = ?</div>
        <div class="row center">${list.map((n) => `<button class="btn big" data-n="${n}">${n}</button>`).join('')}</div>
      </div>`, { onClose: onDone });
    el.querySelector('.parent-gate')!.addEventListener('click', (e: any) => {
      const n = e.target.closest('[data-n]')?.dataset.n; if (n === undefined) return;
      if (+n === ans) this.dashboard(onDone);
      else { Audio.sfx('soft'); Ui.toast('Chưa đúng — nhờ bố mẹ giúp nhé'); Ui.modal(null); onDone?.(); }
    });
  },

  dashboard(onDone?: () => void, tab = 'stats') {
    const p = Store.p;
    const tabs = [['stats', 'Hoạt động'], ['profiles', 'Hồ sơ'], ['settings', 'Cài đặt']];
    let body = '';
    if (tab === 'stats') body = p ? this.statsHtml(p) : '<p>Chưa có hồ sơ nào.</p>';
    else if (tab === 'profiles') body = this.profilesHtml();
    else body = this.settingsHtml();
    const el = Ui.modal(`
      <div class="parent">
        <h2>Góc phụ huynh</h2>
        <div class="seg wide">${tabs.map(([k, n]) => `<button data-tab="${k}" class="${k === tab ? 'on' : ''}">${n}</button>`).join('')}</div>
        <div class="parent-body">${body}</div>
        <p class="hint">Dữ liệu chỉ lưu trên thiết bị này (localStorage), không gửi đi đâu. Số liệu chỉ mô tả hoạt động trong game — không phải đánh giá trí tuệ hay sự phát triển của trẻ.</p>
      </div>`, { onClose: onDone, cls: 'modal-wide' });
    el.querySelector('.parent')!.addEventListener('click', (e: any) => this.onClick(e, onDone));
    el.querySelector('.parent')!.addEventListener('input', (e: any) => {
      if (e.target.dataset.set === 'volume') { Store.setSettings({ volume: +e.target.value }); Audio.applySettings(); }
    });
  },

  statsHtml(p: Profile): string {
    const plays = Object.values(p.plays).reduce((a, b) => a + b, 0);
    const fav = Object.entries(p.plays).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([k, v]) => `${Ui.esc(actById(k)?.name || k)} (${v})`).join(', ') || '—';
    const regions = (AssetLoader.data('world')?.regions || []) as any[];
    const explored = regions.filter((r) => ACTIVITIES.some((a) => a.region === r.id && p.plays[a.id]));
    const bySkill: Record<string, number> = {};
    for (const a of ACTIVITIES) bySkill[a.skill] = (bySkill[a.skill] || 0) + (p.plays[a.id] || 0);
    const max = Math.max(1, ...Object.values(bySkill));
    const bars = Object.entries(SKILL_NAMES).map(([k, n]) => `<div class="bar-row"><span>${n}</span><i style="--w:${(bySkill[k] || 0) / max * 100}%"></i><b>${bySkill[k] || 0}</b></div>`).join('');
    const acts = ACTIVITIES.map((a) => `<tr><td>${Ui.esc(a.name)}</td><td>${p.plays[a.id] || 0}</td><td>${p.plays[a.id] ? 'cấp ' + Store.level(a.id) : '—'}</td></tr>`).join('');
    const hist = p.history.slice(-12).reverse().map((h) => `<tr><td>${fmtDate(h.t)}</td><td>${Ui.esc(actById(h.act)?.name || h.act)}</td><td>${Math.max(1, Math.round(h.ms / 1000))} giây</td><td>cấp ${h.level}</td></tr>`).join('');
    const ach = ACHIEVEMENTS.map((a) => `<span class="ach ${p.ach[a.id] ? 'on' : ''}" title="${Ui.esc(a.desc)}"><img src="${AssetLoader.url(a.icon)}" alt="">${Ui.esc(a.name)}</span>`).join('');
    return `
      <div class="stat-grid">
        <div><b>${p.sessions}</b><span>lần mở game</span></div>
        <div><b>${fmtMin(p.playMs)}</b><span>thời gian chơi (ước tính)</span></div>
        <div><b>${plays}</b><span>lượt chơi hoàn thành</span></div>
        <div><b>${explored.length}/${regions.length}</b><span>vùng đất đã khám phá</span></div>
      </div>
      <p><b>${Ui.esc(p.name)}</b> · ${AGE_NAMES[p.age]} · Hoạt động bé thích: ${fav}</p>
      <h4>Hoạt động theo nhóm kỹ năng</h4><div class="bars">${bars}</div>
      <h4>Các trò chơi</h4><table class="tbl"><tr><th>Trò chơi</th><th>Lượt</th><th>Độ khó hiện tại</th></tr>${acts}</table>
      <h4>Gần đây</h4>${hist ? `<table class="tbl"><tr><th>Lúc</th><th>Trò chơi</th><th>Thời gian</th><th>Độ khó</th></tr>${hist}</table>` : '<p>Chưa có.</p>'}
      <h4>Huy hiệu</h4><div class="achs">${ach}</div>`;
  },

  profilesHtml(): string {
    const cur = Store.p?.id;
    const rows = Store.profiles.map((p) => `
      <div class="prof-row ${p.id === cur ? 'on' : ''}">
        <img src="${AssetLoader.url(p.pet + '-portrait')}" alt="">
        <div><b>${Ui.esc(p.name)}</b><span>${AGE_NAMES[p.age]} · ${p.earned.star} sao</span></div>
        <select data-age="${p.id}">${Object.entries(AGE_NAMES).map(([k, n]) => `<option value="${k}" ${k === p.age ? 'selected' : ''}>${n}</option>`).join('')}</select>
        ${p.id === cur ? '<em>đang chơi</em>' : `<button class="btn small" data-use="${p.id}">Chọn</button>`}
        <button class="btn small" data-reset="${p.id}">Chơi lại từ đầu</button>
        <button class="btn small danger" data-del="${p.id}">Xoá</button>
      </div>`).join('');
    return `${rows || '<p>Chưa có hồ sơ.</p>'}
      <div class="row"><button class="btn accent" data-a="new">Thêm bé mới</button></div>
      <p class="hint">Độ tuổi chỉ dùng để chọn độ khó ban đầu; game tự điều chỉnh theo cách bé chơi.</p>`;
  },

  settingsHtml(): string {
    const s = Store.settings;
    const t = (k: string, on: boolean, name: string) => `<label class="tog"><input type="checkbox" data-set="${k}" ${on ? 'checked' : ''}><span>${name}</span></label>`;
    return `
      <div class="opts">
        ${t('sound', s.sound, 'Âm thanh')}
        ${t('music', s.music, 'Nhạc nền')}
        ${t('voice', s.voice, 'Đọc hướng dẫn bằng giọng nói' + (Audio.hasVoice ? '' : ' (máy này chưa có giọng tiếng Việt)'))}
        <label class="tog"><span>Âm lượng</span><input type="range" min="0" max="1" step="0.05" value="${s.volume}" data-set="volume"></label>
        <label class="tog"><span>Ngôn ngữ</span><select data-set="lang"><option value="vi" selected>Tiếng Việt</option></select></label>
      </div>
      <div class="row"><button class="btn danger" data-a="wipe">Xoá toàn bộ dữ liệu trên máy</button></div>`;
  },

  onClick(e: any, onDone?: () => void) {
    const t = e.target;
    const d = t.closest('[data-tab],[data-use],[data-del],[data-reset],[data-a]')?.dataset;
    if (t.matches('input[type=checkbox]')) { Store.setSettings({ [t.dataset.set]: t.checked } as any); Audio.applySettings(); return; }
    if (t.matches('select[data-age]')) {
      t.onchange = () => { const p = Store.profiles.find((x) => x.id === t.dataset.age); if (p) { p.age = t.value; Store.commit(); } };
      return;
    }
    if (!d) return;
    if (d.tab) { this.dashboard(onDone, d.tab); return; }
    if (d.use) { Store.selectProfile(d.use); Ui.modal(null); location.hash = 'island'; window.dispatchEvent(new Event('lw-profile')); return; }
    if (d.reset) { if (confirm('Chơi lại từ đầu cho hồ sơ này? Đảo, đồ và sao sẽ được làm mới.')) { Store.resetProfile(d.reset); window.dispatchEvent(new Event('lw-profile')); this.dashboard(onDone, 'profiles'); } return; }
    if (d.del) { if (confirm('Xoá hồ sơ này khỏi máy?')) { Store.deleteProfile(d.del); window.dispatchEvent(new Event('lw-profile')); this.dashboard(onDone, 'profiles'); } return; }
    if (d.a === 'new') { Ui.modal(null); location.hash = 'home'; window.dispatchEvent(new CustomEvent('lw-new-profile')); return; }
    if (d.a === 'wipe') { if (confirm('Xoá toàn bộ hồ sơ và tiến trình trên máy này?')) { Store.resetAll(); Ui.modal(null); location.hash = 'home'; window.dispatchEvent(new Event('lw-profile')); } }
  },
  _unused: REGION_STARS,
};
