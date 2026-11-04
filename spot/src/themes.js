// ── Danh sách chủ đề; vòng L dùng chủ đề thứ (L-1) mod 4 ──
import { KITCHEN } from './kitchen.js';
import { RESTAURANT } from './restaurant.js';
import { CLOTHES } from './clothes.js';
import { BEACH } from './beach.js';

export const THEMES = [KITCHEN, RESTAURANT, CLOTHES, BEACH];
export const themeFor = (L) => THEMES[(L - 1) % THEMES.length];
