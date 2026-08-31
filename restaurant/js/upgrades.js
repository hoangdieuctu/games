// ── Cửa hàng nâng cấp nhà hàng, mua bằng vàng đã kiếm được ──

import { getGold, spendGold } from './player.js';

export const UPGRADES = {
  stove: {
    name: 'Bếp Xịn', icon: '🔥',
    desc: 'Bếp nấu món nhanh hơn',
    costs: [110, 240],
  },
  pan: {
    name: 'Thêm Chảo', icon: '🍳',
    desc: 'Bếp nấu được nhiều món cùng lúc hơn',
    costs: [180, 380],
  },
  staff: {
    name: 'Thêm Phục Vụ', icon: '💁‍♀️',
    desc: 'Thuê thêm bạn chạy bàn (tối đa 3 người)',
    costs: [320, 700],
  },
  table: {
    name: 'Thêm Bàn', icon: '🪑',
    desc: 'Kê thêm một bàn cho khách',
    costs: [200],
  },
  menu: {
    name: 'Thực Đơn Đẹp', icon: '📖',
    desc: 'Khách chọn món nhanh, bớt sốt ruột',
    costs: [90, 200],
  },
  decor: {
    name: 'Trang Trí Ấm Cúng', icon: '🕯️',
    desc: 'Khách vui hơn nên boa nhiều hơn',
    costs: [130, 280],
  },
  shoes: {
    name: 'Giày Êm Chân', icon: '👟',
    desc: 'Phục vụ chạy nhanh hơn',
    costs: [120, 260],
  },
};

let levels = {};

export function loadShop() {
  try { levels = JSON.parse(localStorage.getItem('rest_upg') || '{}') || {}; } catch (e) { levels = {}; }
}

export function levelOf(key) { return levels[key] || 0; }

export function nextCost(key) {
  const lv = levelOf(key);
  return lv < UPGRADES[key].costs.length ? UPGRADES[key].costs[lv] : null;
}

export function buy(key) {
  const cost = nextCost(key);
  if (cost == null || getGold() < cost || !spendGold(cost)) return false;
  levels[key] = levelOf(key) + 1;
  localStorage.setItem('rest_upg', JSON.stringify(levels));
  return true;
}

// ── ảnh hưởng lên lối chơi ──

export function cookMult()    { return [1, 0.82, 0.66][levelOf('stove')]; }
export function cookSlots()   { return 2 + levelOf('pan'); }
export function staffCount()  { return 1 + levelOf('staff'); }
export function extraTables() { return levelOf('table'); }
export function menuTime()    { return [2.2, 1.6, 1.1][levelOf('menu')]; }
export function tipMult()     { return [1, 1.5, 2][levelOf('decor')]; }
export function walkMult()    { return [1, 1.2, 1.42][levelOf('shoes')]; }
