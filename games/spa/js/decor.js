// ── Trang trí tiệm: tường, sàn, thảm, màu đồ vật, đồ trang trí tường ──
// Mua bằng ngân quỹ; lựa chọn được lưu lại và áp dụng ngay khi vẽ.

import { getBank, spendBank } from './upgrades.js';

export const DECOR = {
  wall: {
    name: 'Tường', icon: '🧱',
    items: [
      { id: 'blush',    name: 'Hồng chấm bi',   price: 0,   swatch: '#ffdfe9' },
      { id: 'mint',     name: 'Xanh bạc hà',    price: 90,  swatch: '#d8f2e6' },
      { id: 'lavender', name: 'Tím oải hương',  price: 150, swatch: '#e6dcfa' },
      { id: 'cream',    name: 'Kem gạch trắng', price: 200, swatch: '#ffeedd' },
    ],
  },
  floor: {
    name: 'Sàn', icon: '🔲',
    items: [
      { id: 'warm',   name: 'Gạch kem ấm',  price: 0,   swatch: '#eecfae' },
      { id: 'wood',   name: 'Sàn gỗ sáng',  price: 100, swatch: '#dcb488' },
      { id: 'rose',   name: 'Gạch hồng',    price: 160, swatch: '#f2cfd6' },
      { id: 'marble', name: 'Đá hoa xám',   price: 220, swatch: '#e4e4ea' },
    ],
  },
  rug: {
    name: 'Thảm', icon: '🟫',
    items: [
      { id: 'pink',  name: 'Thảm hồng sọc',  price: 0,   swatch: '#ffc0d4' },
      { id: 'mint',  name: 'Thảm bạc hà',    price: 80,  swatch: '#c8ede0' },
      { id: 'cream', name: 'Thảm viền vàng', price: 140, swatch: '#fff2d8' },
      { id: 'none',  name: 'Không thảm',     price: 0,   emoji: '🚫' },
    ],
  },
  furn: {
    name: 'Màu đồ', icon: '🎨',
    items: [
      { id: 'rose',   name: 'Hồng ngọt',   price: 0,   swatch: '#ff9ab5' },
      { id: 'mint',   name: 'Bạc hà',      price: 70,  swatch: '#8fdcc4' },
      { id: 'blue',   name: 'Xanh biển',   price: 120, swatch: '#94c8ea' },
      { id: 'purple', name: 'Tím pastel',  price: 180, swatch: '#c0aae8' },
    ],
  },
  art: {
    name: 'Trang trí', icon: '🖼️',
    items: [
      { id: 'flowers', name: 'Tranh hoa & nến', price: 0,   emoji: '🌸' },
      { id: 'zen',     name: 'Góc thiền',       price: 120, emoji: '🎍' },
      { id: 'window',  name: 'Cửa sổ vườn',     price: 200, emoji: '🪟' },
      { id: 'lights',  name: 'Đèn lồng & sao',  price: 260, emoji: '🏮' },
    ],
  },
};

// giá trị màu / kiểu vẽ cho từng lựa chọn
const WALLS = {
  blush:    { top: '#fff0f5', bot: '#ffdfe9', pattern: 'dots',   dot: 'rgba(240,150,180,.14)', base: '#f0b6c8', baseDark: '#e39ab0', ink: '#b3446f' },
  mint:     { top: '#f2fbf7', bot: '#d8f2e6', pattern: 'stripe', dot: 'rgba(90,190,160,.12)',  base: '#a8ddc8', baseDark: '#8ac3ad', ink: '#2f8a6d' },
  lavender: { top: '#f9f5ff', bot: '#e6dcfa', pattern: 'floral', dot: 'rgba(150,120,210,.14)', base: '#c9b8ea', baseDark: '#ac99d8', ink: '#6a4fae' },
  cream:    { top: '#fffaf2', bot: '#ffeedd', pattern: 'tile',   dot: 'rgba(200,160,120,.16)', base: '#e8c9a8', baseDark: '#d0ac86', ink: '#a5713c' },
};
const FLOORS = {
  warm:   { base: '#f5dcc0', alt: '#eecfae', line: 'rgba(190,140,110,.14)', style: 'checker' },
  wood:   { base: '#eec9a2', alt: '#e0b88c', line: 'rgba(160,110,70,.18)',  style: 'plank' },
  rose:   { base: '#fce6ea', alt: '#f4d2d9', line: 'rgba(200,140,155,.16)', style: 'checker' },
  marble: { base: '#f4f4f7', alt: '#e6e6ec', line: 'rgba(140,140,160,.14)', style: 'diamond' },
};
const RUGS = {
  pink:  { outer: '#f2a8c0', inner: '#ffc0d4', stripe: 'rgba(255,255,255,.22)', ink: '#fff' },
  mint:  { outer: '#7fc9b0', inner: '#c8ede0', stripe: 'rgba(255,255,255,.3)',  ink: '#2f7a62' },
  cream: { outer: '#e8c98a', inner: '#fff2d8', stripe: 'rgba(210,170,90,.18)',  ink: '#a5762c' },
  none:  null,
};
const FURNS = {
  rose:   { main: '#e0708f', light: '#ff9ab5', dark: '#d4607f', soft: '#ffb0c8', wood: '#c98a52', woodDark: '#a06a3c' },
  mint:   { main: '#57b79d', light: '#8fdcc4', dark: '#469a83', soft: '#b5e8d8', wood: '#c98a52', woodDark: '#a06a3c' },
  blue:   { main: '#5f9fd0', light: '#94c8ea', dark: '#4a86b8', soft: '#bcdff5', wood: '#b58a62', woodDark: '#946c48' },
  purple: { main: '#9a7fd0', light: '#c0aae8', dark: '#8268b8', soft: '#d8cbf2', wood: '#b58a62', woodDark: '#946c48' },
};

const DEFAULT = { wall: 'blush', floor: 'warm', rug: 'pink', furn: 'rose', art: 'flowers' };

let owned = {};
let pick = { ...DEFAULT };

export function loadDecor() {
  try { owned = JSON.parse(localStorage.getItem('spa_decor') || '{}') || {}; } catch (e) { owned = {}; }
  try {
    const saved = JSON.parse(localStorage.getItem('spa_theme') || 'null');
    if (saved) pick = { ...DEFAULT, ...saved };
  } catch (e) { pick = { ...DEFAULT }; }
}

export function resetDecor() {
  owned = {};
  pick = { ...DEFAULT };
  localStorage.removeItem('spa_decor');
  localStorage.removeItem('spa_theme');
}

function save() {
  localStorage.setItem('spa_decor', JSON.stringify(owned));
  localStorage.setItem('spa_theme', JSON.stringify(pick));
}

export function isOwnedDecor(cat, item) {
  return item.price === 0 || !!owned[cat + ':' + item.id];
}

export function pickedDecor(cat) { return pick[cat]; }

// mua (nếu cần) rồi dùng luôn: 'used' | 'bought' | 'poor'
export function chooseDecor(cat, item) {
  if (!isOwnedDecor(cat, item)) {
    if (getBank() < item.price || !spendBank(item.price)) return 'poor';
    owned[cat + ':' + item.id] = 1;
    pick[cat] = item.id;
    save();
    return 'bought';
  }
  pick[cat] = item.id;
  save();
  return 'used';
}

// bảng màu / kiểu vẽ đang dùng, cho render.js đọc mỗi khung hình
export function getTheme() {
  return {
    wall: WALLS[pick.wall] || WALLS.blush,
    floor: FLOORS[pick.floor] || FLOORS.warm,
    rug: RUGS[pick.rug] !== undefined ? RUGS[pick.rug] : RUGS.pink,
    furn: FURNS[pick.furn] || FURNS.rose,
    art: pick.art,
  };
}
