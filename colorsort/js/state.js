// ── Tiến trình người chơi, lưu vào localStorage ──
import { SAVE_KEY } from './config.js';

const DEFAULTS = { level: 1, gems: 40, stars: 0, best: 1, items: { tube: 1, wand: 1, hint: 2 } };

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
export function resetAll() {
  Object.assign(save, { ...DEFAULTS, items: { ...DEFAULTS.items } });
  persist();
}
