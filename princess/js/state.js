// ── Trạng thái & lưu tiến trình (localStorage) ──
import { SLOTS, START_GEMS, START_HINTS, TOTAL_LEVELS } from './config.js';

const KEY = 'princess_save_v1';

function defaultOwned() {
  const o = {};
  for (const s of SLOTS) for (const it of s.items) if (it.price === 0) o[s.id + ':' + it.id] = true;
  return o;
}

export const S = load();

function load() {
  let d = null;
  try { d = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) { d = null; }
  const base = {
    gems: START_GEMS,
    hints: START_HINTS,
    stars: {},        // level → số sao (1-3)
    owned: defaultOwned(),
    targets: {},      // level → look mẫu đã sinh
    hintGranted: {},  // level → true nếu đã tặng gương
    played: 0,        // số lượt mini game đã chơi
  };
  if (!d) return base;
  const s = Object.assign(base, d);
  s.owned = Object.assign(defaultOwned(), d.owned || {});
  return s;
}

export function save() {
  try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* bỏ qua */ }
}

export function owns(slotId, itemId) { return !!S.owned[slotId + ':' + itemId]; }
export function own(slotId, itemId) { S.owned[slotId + ':' + itemId] = true; save(); }

export function unlockedLevel() {
  let lv = 1;
  while (lv < TOTAL_LEVELS && S.stars[lv]) lv++;
  return lv;
}

export function totalStars() {
  return Object.values(S.stars).reduce((a, b) => a + b, 0);
}

export function resetAll() {
  localStorage.removeItem(KEY);
  location.reload();
}
