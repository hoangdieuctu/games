// ── Tiến trình người chơi, lưu vào localStorage ──
import { SAVE_KEY, START_COINS, TOTAL_LEVELS } from './config.js';

export const save = {
  coins: START_COINS,
  unlocked: 1,        // vòng cao nhất được mở
  stars: {},          // { "3": 2 } — sao từng vòng
  sound: true,
  cur: null,          // vòng đang chơi dở: { L, found:[...], wrong, hints }
};

export function load() {
  try {
    const raw = JSON.parse(localStorage.getItem(SAVE_KEY) || '{}');
    if (typeof raw.coins === 'number') save.coins = raw.coins;
    if (typeof raw.unlocked === 'number') save.unlocked = Math.max(1, Math.min(TOTAL_LEVELS, raw.unlocked));
    if (raw.stars && typeof raw.stars === 'object') save.stars = raw.stars;
    if (typeof raw.sound === 'boolean') save.sound = raw.sound;
    if (raw.cur && typeof raw.cur.L === 'number') save.cur = raw.cur;
  } catch (e) { /* bỏ qua tệp lưu hỏng */ }
}

export function persist() {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(save)); } catch (e) { /* bỏ qua */ }
}

export const isDone = (L) => !!save.stars[L];
export function totalStars() { let n = 0; for (const k in save.stars) n += save.stars[k]; return n; }
