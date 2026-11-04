// ── Tủ đồ: kiểu tóc, váy, tạp dề, phụ kiện cho cô chủ nhà hàng ──
// Món có price = 0 thì có sẵn; lv = cấp tối thiểu mới mua được.

import { getLevel, spendGold } from './player.js';

export const CATS = {
  hair: {
    name: 'Kiểu tóc', icon: '💇‍♀️',
    items: [
      { id: 'bun',   name: 'Búi cao',    price: 0,   emoji: '👩' },
      { id: 'pony',  name: 'Đuôi ngựa',  price: 60,  emoji: '👱‍♀️' },
      { id: 'long',  name: 'Xoã dài',    price: 120, emoji: '👩‍🦰' },
      { id: 'twin',  name: 'Hai bím',    price: 180, lv: 3, emoji: '👧' },
      { id: 'bob',   name: 'Tóc ngắn',   price: 140, emoji: '💇' },
    ],
  },
  hairColor: {
    name: 'Màu tóc', icon: '🎨',
    items: [
      { id: '#6a4020', name: 'Nâu',      price: 0,   swatch: '#6a4020' },
      { id: '#2e2018', name: 'Đen',      price: 0,   swatch: '#2e2018' },
      { id: '#c8763a', name: 'Hạt dẻ',   price: 70,  swatch: '#c8763a' },
      { id: '#e8c46a', name: 'Vàng nắng', price: 90, swatch: '#e8c46a' },
      { id: '#a06ad0', name: 'Tím khói', price: 160, lv: 2, swatch: '#a06ad0' },
      { id: '#ff8fb5', name: 'Hồng đào', price: 220, lv: 4, swatch: '#ff8fb5' },
    ],
  },
  dress: {
    name: 'Trang phục', icon: '👗',
    items: [
      { id: 'classic', name: 'Cổ điển',  price: 0,   emoji: '👚' },
      { id: 'flare',   name: 'Váy xoè',  price: 140, emoji: '👗' },
      { id: 'aodai',   name: 'Áo dài',   price: 260, lv: 3, emoji: '🥻' },
      { id: 'suit',    name: 'Vest lịch lãm', price: 200, lv: 2, emoji: '🧥' },
    ],
  },
  dressColor: {
    name: 'Màu áo', icon: '🌈',
    items: [
      { id: '#f06292', name: 'Hồng',    price: 0,   swatch: '#f06292' },
      { id: '#7cc6f0', name: 'Xanh biển', price: 50, swatch: '#7cc6f0' },
      { id: '#8fd070', name: 'Xanh lá', price: 50,  swatch: '#8fd070' },
      { id: '#ffc34d', name: 'Vàng',    price: 80,  swatch: '#ffc34d' },
      { id: '#b98ae8', name: 'Tím',     price: 110, swatch: '#b98ae8' },
      { id: '#ff7a5c', name: 'Cam san hô', price: 140, lv: 2, swatch: '#ff7a5c' },
      { id: '#f5f0ea', name: 'Trắng ngà', price: 180, lv: 3, swatch: '#f5f0ea' },
      { id: '#2e3a50', name: 'Xanh đêm', price: 240, lv: 4, swatch: '#2e3a50' },
    ],
  },
  apron: {
    name: 'Tạp dề', icon: '🧵',
    items: [
      { id: 'white', name: 'Trắng tinh', price: 0,   swatch: '#ffffff' },
      { id: 'none',  name: 'Không mặc',  price: 0,   emoji: '🚫' },
      { id: 'pink',  name: 'Hồng phấn',  price: 70,  swatch: '#ffc3d8' },
      { id: 'check', name: 'Kẻ caro',    price: 130, emoji: '🏁' },
      { id: 'gold',  name: 'Viền vàng',  price: 260, lv: 4, swatch: '#ffd76a' },
    ],
  },
  acc: {
    name: 'Phụ kiện', icon: '💎',
    items: [
      { id: 'none',    name: 'Không',       price: 0,   emoji: '🚫' },
      { id: 'flower',  name: 'Hoa cài',     price: 60,  emoji: '🌸' },
      { id: 'bow',     name: 'Nơ xinh',     price: 90,  emoji: '🎀' },
      { id: 'glasses', name: 'Kính tròn',   price: 120, emoji: '👓' },
      { id: 'chef',    name: 'Mũ đầu bếp',  price: 170, lv: 2, emoji: '👨‍🍳' },
      { id: 'crown',   name: 'Vương miện',  price: 320, lv: 5, emoji: '👑' },
    ],
  },
};

const DEFAULT_LOOK = {
  hair: 'bun', hairColor: '#6a4020',
  dress: 'classic', dressColor: '#f06292',
  apron: 'white', acc: 'flower',
};

let ownedSet = {};
let look = { ...DEFAULT_LOOK };

export function loadWardrobe() {
  try { ownedSet = JSON.parse(localStorage.getItem('rest_owned') || '{}') || {}; } catch (e) { ownedSet = {}; }
  try {
    const saved = JSON.parse(localStorage.getItem('rest_look') || 'null');
    if (saved) look = { ...DEFAULT_LOOK, ...saved };
  } catch (e) { look = { ...DEFAULT_LOOK }; }
  // hoa cài có sẵn từ đầu cho đỡ trống trải
  if (!ownedSet['acc:flower']) { ownedSet['acc:flower'] = 1; saveOwned(); }
}

export function resetWardrobe() {
  ownedSet = {};
  look = { ...DEFAULT_LOOK };
  localStorage.removeItem('rest_owned');
  localStorage.removeItem('rest_look');
  loadWardrobe(); // trả lại hoa cài tặng sẵn
}

function saveOwned() { localStorage.setItem('rest_owned', JSON.stringify(ownedSet)); }
function saveLook() { localStorage.setItem('rest_look', JSON.stringify(look)); }

export function getLook() { return look; }
export function equippedOf(cat) { return look[cat]; }

export function isOwned(cat, item) {
  return item.price === 0 || !!ownedSet[cat + ':' + item.id];
}

export function isLocked(item) {
  return !!item.lv && getLevel() < item.lv;
}

// mua (nếu cần) rồi mặc luôn; trả về 'equipped' | 'bought' | 'poor' | 'locked'
export function chooseItem(cat, item) {
  if (isLocked(item)) return 'locked';
  if (!isOwned(cat, item)) {
    if (!spendGold(item.price)) return 'poor';
    ownedSet[cat + ':' + item.id] = 1;
    saveOwned();
    look[cat] = item.id;
    saveLook();
    return 'bought';
  }
  look[cat] = item.id;
  saveLook();
  return 'equipped';
}
