// ── Lớp giao diện HTML phủ trên canvas (nút, bảng, hộp thoại) ──
// Dùng DOM cho UI để chữ luôn sắc nét và thao tác chạm thoải mái trên điện thoại.

const $ = (sel: string) => document.querySelector(sel) as HTMLElement;

export const Ui = {
  /** Scene mà đường dẫn hiện tại muốn mở; scene khác tạo xong muộn (đang tải dở) sẽ tự dừng. */
  route: '',
  stale(scene: any): boolean {
    if (Ui.route && Ui.route !== scene.scene.key) { scene.scene.stop(); return true; }
    return false;
  },
  setActiveTab(key: string) {
    document.body.dataset.scene = key;
    document.querySelectorAll<HTMLElement>('.tabs button').forEach((b) => {
      b.classList.toggle('on', b.dataset.scene === key);
    });
  },

  /** Đặt nội dung bảng điều khiển của scene. Trả về phần tử để gắn sự kiện. */
  panel(html: string, cls = ''): HTMLElement {
    const el = $('#panel');
    el.className = 'panel ' + cls;
    el.innerHTML = html;
    el.hidden = !html;
    return el;
  },
  clearPanel() { const el = $('#panel'); el.innerHTML = ''; el.hidden = true; },

  /** Thẻ thông tin nổi (ví dụ: vùng đang chọn). */
  card(html: string | null): HTMLElement {
    const el = $('#card');
    if (!html) { el.hidden = true; el.innerHTML = ''; return el; }
    el.innerHTML = html;
    el.hidden = false;
    el.classList.remove('pop'); void el.offsetWidth; el.classList.add('pop');
    return el;
  },

  modal(html: string | null, opts: { noClose?: boolean; cls?: string; onClose?: () => void } = {}): HTMLElement {
    const el = $('#modal');
    if (!html) { el.hidden = true; el.innerHTML = ''; el.className = ''; el.onclick = null; return el; }
    el.className = opts.cls || '';
    el.innerHTML = `<div class="modal-box">${html}${opts.noClose ? '' : '<button class="modal-close" aria-label="Đóng">✕</button>'}</div>`;
    el.hidden = false;
    const close = () => { Ui.modal(null); opts.onClose?.(); };
    el.querySelector('.modal-close')?.addEventListener('click', close);
    el.onclick = (e) => { if (e.target === el && !opts.noClose) close(); };
    return el;
  },
  get modalOpen() { return !$('#modal').hidden; },

  toast(msg: string, ms = 1800) {
    const el = $('#toast');
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout((el as any)._t);
    (el as any)._t = setTimeout(() => el.classList.remove('show'), ms);
  },

  loading(pct: number | null, label = 'Đang tải thế giới nhỏ…') {
    const el = $('#loading');
    if (pct === null) { el.classList.add('done'); setTimeout(() => (el.hidden = true), 400); return; }
    el.hidden = false; el.classList.remove('done');
    (el.querySelector('.bar i') as HTMLElement).style.width = Math.round(pct * 100) + '%';
    (el.querySelector('.label') as HTMLElement).textContent = label;
  },

  esc(s: string) {
    return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' } as any)[c]);
  },
};
