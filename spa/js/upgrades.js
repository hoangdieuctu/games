// ── Cửa hàng nâng cấp giữa các ngày (giống Sally's Spa) ──
// Tiền kiếm được mỗi ngày cộng vào ngân quỹ, dùng mua nâng cấp vĩnh viễn.

import { SERVICES } from './config.js';

export const UPGRADES = {
  tea: {
    name: 'Trà & Tạp Chí', icon: '🍵',
    desc: 'Khách chờ bớt sốt ruột · xe trà thêm lượt, hồi nhiều tim hơn',
    costs: [80, 180],
  },
  oil: {
    name: 'Dầu Thơm Hảo Hạng', icon: '🫧',
    desc: 'Mát-xa & làm móng nhanh xong hơn · giữ ngón tay càng ăn tiền',
    costs: [100, 220],
  },
  steam: {
    name: 'Máy Xông Xịn', icon: '♨️',
    desc: 'Mặt nạ & xông hơi nhanh hơn',
    costs: [100, 220],
  },
  staff: {
    name: 'Thêm Nhân Viên', icon: '💁‍♀️',
    desc: 'Thuê thêm 1 cô nhân viên phục vụ',
    costs: [320],
  },
  decor: {
    name: 'Trang Trí Lộng Lẫy', icon: '🌺',
    desc: 'Khách vui hơn, boa nhiều hơn',
    costs: [120, 260],
  },
  seat: {
    name: 'Thêm Ghế Chờ', icon: '🛋️',
    desc: 'Kê thêm ghế cho khách chờ (tối đa 7 ghế)',
    costs: [110, 190, 300, 430, 580],
  },
};

let levels = {};
let bank = 0;

export function loadShop() {
  try { levels = JSON.parse(localStorage.getItem('spa_upg') || '{}') || {}; } catch (e) { levels = {}; }
  bank = parseInt(localStorage.getItem('spa_bank') || '0', 10) || 0;
}

export function getBank() { return bank; }

// trừ ngân quỹ (dùng cho cả nâng cấp và trang trí)
export function spendBank(amount) {
  if (bank < amount) return false;
  bank -= amount;
  localStorage.setItem('spa_bank', String(bank));
  return true;
}
export function addToBank(amount) {
  bank += amount;
  localStorage.setItem('spa_bank', String(bank));
}

export function resetShop() {
  levels = {};
  bank = 0;
  localStorage.removeItem('spa_upg');
  localStorage.removeItem('spa_bank');
}

export function levelOf(key) { return levels[key] || 0; }

export function nextCost(key) {
  const lv = levelOf(key);
  return lv < UPGRADES[key].costs.length ? UPGRADES[key].costs[lv] : null;
}

export function buy(key) {
  const cost = nextCost(key);
  if (cost == null || bank < cost) return false;
  bank -= cost;
  levels[key] = levelOf(key) + 1;
  localStorage.setItem('spa_bank', String(bank));
  localStorage.setItem('spa_upg', JSON.stringify(levels));
  return true;
}

// ── hiệu ứng của nâng cấp lên gameplay ──

export function sitDecayMult()  { return [1, 0.65, 0.45][levelOf('tea')]; }

// ── xe trà: mỗi ngày mời được mấy lượt, mỗi lượt hồi mấy tim, nguội bao lâu ──
export function teaUses()     { return [3, 4, 5][levelOf('tea')]; }
export function teaHeal()     { return [3, 3.5, 4][levelOf('tea')]; }
export function teaCooldown() { return [18, 15, 12][levelOf('tea')]; }

// giữ ngón tay: tiến độ cộng thêm bao nhiêu mỗi giây
export function holdBoostRate() { return [0.26, 0.33, 0.42][levelOf('oil')]; }
export function tipMult()       { return [1, 1.5, 2][levelOf('decor')]; }
export function extraSeats()    { return levelOf('seat'); }
export function staffCount()    { return 1 + levelOf('staff'); }

// thời gian nhân viên làm mát-xa / làm móng
export function staffDur(key) {
  return SERVICES[key].dur * [1, 0.8, 0.65][levelOf('oil')];
}

// thời gian mặt nạ ngấm
export function maskTime() {
  return SERVICES.facial.maskT * [1, 0.8, 0.65][levelOf('steam')];
}

// thời gian xông hơi
export function saunaTime() {
  return SERVICES.sauna.dur * [1, 0.8, 0.65][levelOf('steam')];
}
