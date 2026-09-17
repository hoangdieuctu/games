// ── Tiến trình người chơi, lưu vào localStorage ──
import { SAVE_KEY } from './config.js';

const DEFAULTS = { level: 1, gems: 40, stars: 0, best: 1, board: null, items: { tube: 1 } };

export const save = load();

function load() {
  try {
    const raw = JSON.parse(localStorage.getItem(SAVE_KEY) || '{}');
    return {
      ...DEFAULTS, ...raw,
      items: { ...DEFAULTS.items, ...(raw.items || {}) },
    };
  } catch (e) {
    return { ...DEFAULTS, items: { ...DEFAULTS.items } };
  }
}

export function persist() {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(save)); } catch (e) { /* bỏ qua */ }
}

export function addGems(n) { save.gems = Math.max(0, save.gems + n); persist(); }
export function addItem(k, n = 1) { save.items[k] = (save.items[k] || 0) + n; persist(); }
export function useItem(k) {
  if ((save.items[k] || 0) <= 0) return false;
  save.items[k]--; persist(); return true;
}
// Ván đang chơi dở: cất lại để bé đóng máy rồi mở ra vẫn chơi tiếp được.
export function saveBoard(b) { save.board = b; persist(); }
export function clearBoard() { save.board = null; persist(); }

// Dữ liệu cũ hoặc hỏng thì bỏ qua, thà xếp ván mới còn hơn vào một bàn lỗi.
export function validBoard(b, level) {
  return !!b && b.level === level
    && Number.isInteger(b.cap) && b.cap > 0
    && Array.isArray(b.tubes) && b.tubes.length > 1
    && Array.isArray(b.initial) && b.initial.length === b.tubes.length
    && b.tubes.every((t) => Array.isArray(t) && t.length <= b.cap
        && t.every((c) => Number.isInteger(c) && c >= 0));
}

export function resetAll() {
  Object.assign(save, { ...DEFAULTS, items: { ...DEFAULTS.items } });
  persist();
}
