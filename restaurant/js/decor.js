// ── Trang trí nhà hàng: tường, sàn, khăn bàn, màu đồ gỗ, trang trí tường ──
// Mua bằng vàng; lựa chọn lưu lại và áp dụng ngay khi vẽ.

import { getGold, spendGold } from './player.js';

export const DECOR = {
  wall: {
    name: 'Tường', icon: '🧱',
    items: [
      { id: 'cream',  name: 'Kem sọc dọc',    price: 0,   swatch: '#ffddb8' },
      { id: 'mint',   name: 'Xanh bạc hà',    price: 90,  swatch: '#d6f0e4' },
      { id: 'sky',    name: 'Xanh trời nhạt', price: 150, swatch: '#d6e8f7' },
      { id: 'brick',  name: 'Gạch đỏ ấm',     price: 200, swatch: '#e8b49a' },
    ],
  },
  floor: {
    name: 'Sàn', icon: '🔲',
    items: [
      { id: 'terra',  name: 'Gạch đất nung', price: 0,   swatch: '#dfa471' },
      { id: 'wood',   name: 'Sàn gỗ sáng',   price: 100, swatch: '#e0b88c' },
      { id: 'check',  name: 'Gạch cờ đen',   price: 170, swatch: '#c8c8cc' },
      { id: 'sea',    name: 'Gạch xanh biển', price: 220, swatch: '#bcdce8' },
    ],
  },
  cloth: {
    name: 'Khăn bàn', icon: '🍽️',
    items: [
      { id: 'red',    name: 'Kẻ đỏ cổ điển', price: 0,   swatch: '#f0a0a0' },
      { id: 'blue',   name: 'Kẻ xanh biển',  price: 80,  swatch: '#a0c4f0' },
      { id: 'plain',  name: 'Trơn kem',      price: 130, swatch: '#fff3e2' },
      { id: 'floral', name: 'Hoa nhí hồng',  price: 190, swatch: '#ffc2d8' },
    ],
  },
  furn: {
    name: 'Màu đồ', icon: '🎨',
    items: [
      { id: 'wood',   name: 'Gỗ nâu ấm',   price: 0,   swatch: '#a9713c' },
      { id: 'white',  name: 'Trắng Bắc Âu', price: 90,  swatch: '#eee4d6' },
      { id: 'green',  name: 'Xanh rêu',    price: 150, swatch: '#7d9a6a' },
      { id: 'pink',   name: 'Hồng pastel', price: 200, swatch: '#e8a2b8' },
    ],
  },
  art: {
    name: 'Trang trí', icon: '🖼️',
    items: [
      { id: 'photos',  name: 'Tranh món ăn',  price: 0,   emoji: '🍕' },
      { id: 'menu',    name: 'Bảng menu đen', price: 120, emoji: '📋' },
      { id: 'plants',  name: 'Giàn cây leo',  price: 190, emoji: '🌿' },
      { id: 'lantern', name: 'Đèn lồng giấy', price: 260, emoji: '🏮' },
    ],
  },
};

const WALLS = {
  cream: { top: '#fff2df', bot: '#ffddb8', pattern: 'stripe', ink: 'rgba(215,150,95,.16)', base: '#c98a52', baseDark: '#a9713c' },
  mint:  { top: '#f0fbf6', bot: '#d6f0e4', pattern: 'stripe', ink: 'rgba(90,180,150,.14)', base: '#7fc0a6', baseDark: '#5fa189' },
  sky:   { top: '#f2f9ff', bot: '#d6e8f7', pattern: 'dots',   ink: 'rgba(110,160,210,.16)', base: '#8fb6d8', baseDark: '#7098bb' },
  brick: { top: '#fff0e6', bot: '#e8b49a', pattern: 'brick',  ink: 'rgba(180,100,70,.18)', base: '#b5714f', baseDark: '#96593c' },
};
const FLOORS = {
  terra: { base: '#e9b586', alt: '#dfa471', line: 'rgba(150,95,50,.13)', style: 'checker' },
  wood:  { base: '#eec9a2', alt: '#e0b88c', line: 'rgba(160,110,70,.18)', style: 'plank' },
  check: { base: '#f2f2f4', alt: '#6b6b76', line: 'rgba(70,70,80,.18)', style: 'checker' },
  sea:   { base: '#e2f1f7', alt: '#bcdce8', line: 'rgba(90,150,175,.16)', style: 'diamond' },
};
const CLOTHS = {
  red:    { base: '#fff8f0', stripe: 'rgba(230,110,110,.2)', pattern: 'check', edge: 'rgba(190,120,80,.35)' },
  blue:   { base: '#f7fbff', stripe: 'rgba(90,140,215,.2)',  pattern: 'check', edge: 'rgba(110,150,190,.4)' },
  plain:  { base: '#fff3e2', stripe: 'rgba(200,160,110,.12)', pattern: 'none', edge: 'rgba(190,150,110,.4)' },
  floral: { base: '#fff6fa', stripe: 'rgba(255,140,180,.22)', pattern: 'floral', edge: 'rgba(220,140,175,.4)' },
};
const FURNS = {
  wood:  { main: '#a9713c', light: '#b07a46', dark: '#96603a', metal: '#7b828c' },
  white: { main: '#e6dbcb', light: '#f2ebe0', dark: '#cbbfab', metal: '#9aa2ac' },
  green: { main: '#7d9a6a', light: '#93ae80', dark: '#658052', metal: '#7b828c' },
  pink:  { main: '#e8a2b8', light: '#f2b8ca', dark: '#cf8299', metal: '#a89aa2' },
};

const DEFAULT = { wall: 'cream', floor: 'terra', cloth: 'red', furn: 'wood', art: 'photos' };

let owned = {};
let pick = { ...DEFAULT };

export function loadDecor() {
  try { owned = JSON.parse(localStorage.getItem('rest_decor') || '{}') || {}; } catch (e) { owned = {}; }
  try {
    const saved = JSON.parse(localStorage.getItem('rest_theme') || 'null');
    if (saved) pick = { ...DEFAULT, ...saved };
  } catch (e) { pick = { ...DEFAULT }; }
}

function save() {
  localStorage.setItem('rest_decor', JSON.stringify(owned));
  localStorage.setItem('rest_theme', JSON.stringify(pick));
}

export function isOwnedDecor(cat, item) {
  return item.price === 0 || !!owned[cat + ':' + item.id];
}

export function pickedDecor(cat) { return pick[cat]; }

// mua (nếu cần) rồi dùng luôn: 'used' | 'bought' | 'poor'
export function chooseDecor(cat, item) {
  if (!isOwnedDecor(cat, item)) {
    if (getGold() < item.price || !spendGold(item.price)) return 'poor';
    owned[cat + ':' + item.id] = 1;
    pick[cat] = item.id;
    save();
    return 'bought';
  }
  pick[cat] = item.id;
  save();
  return 'used';
}

export function getTheme() {
  return {
    wall: WALLS[pick.wall] || WALLS.cream,
    floor: FLOORS[pick.floor] || FLOORS.terra,
    cloth: CLOTHS[pick.cloth] || CLOTHS.red,
    furn: FURNS[pick.furn] || FURNS.wood,
    art: pick.art,
  };
}
