// ── Cấu hình: các "ô" (slot) trang điểm/trang phục và danh mục vật phẩm ──
// Mỗi slot: id, tên, icon, kiểu ('style' vẽ thumbnail SVG | 'color' hiển thị ô màu),
// crop = viewBox thu nhỏ khi vẽ thumbnail, items = danh sách vật phẩm (2 món đầu luôn miễn phí).

export const TOTAL_LEVELS = 20;
export const START_GEMS = 40;
export const START_HINTS = 1;
export const HINT_PRICE = 45;
export const HINT_LEVELS = [2, 5, 8, 11, 14, 17]; // hoàn thành các vòng này lần đầu → tặng 1 gương thần

export const SLOTS = [
  { id: 'hair', name: 'Kiểu tóc', icon: '💇‍♀️', type: 'style', crop: '10 20 280 300', unlock: 1,
    items: [
      { id: 'long',     name: 'Dài thẳng',   price: 0 },
      { id: 'bob',      name: 'Ngắn bob',    price: 0 },
      { id: 'bun',      name: 'Búi cao',     price: 14 },
      { id: 'twin',     name: 'Hai bím',     price: 16 },
      { id: 'ponytail', name: 'Đuôi ngựa',   price: 18 },
      { id: 'braid',    name: 'Tóc tết',     price: 20 },
      { id: 'curly',    name: 'Xoăn bồng',   price: 24 },
      { id: 'wavy',     name: 'Gợn sóng',    price: 26 },
    ] },
  { id: 'hairColor', name: 'Màu tóc', icon: '🎨', type: 'color', unlock: 1,
    items: [
      { id: 'brown',  name: 'Nâu',      color: '#6b3f24', price: 0 },
      { id: 'black',  name: 'Đen',      color: '#2b2230', price: 0 },
      { id: 'blonde', name: 'Vàng óng', color: '#f3cf6a', price: 12 },
      { id: 'red',    name: 'Đỏ cam',   color: '#c9452f', price: 14 },
      { id: 'pink',   name: 'Hồng',     color: '#ff8fc0', price: 16 },
      { id: 'purple', name: 'Tím',      color: '#8e5cd6', price: 18 },
      { id: 'blue',   name: 'Xanh',     color: '#4f8de8', price: 20 },
      { id: 'silver', name: 'Bạch kim', color: '#dfe1ee', price: 24 },
    ] },
  { id: 'dress', name: 'Kiểu váy', icon: '👗', type: 'style', crop: '20 240 260 320', unlock: 1,
    items: [
      { id: 'aline',   name: 'Chữ A',      price: 0 },
      { id: 'ball',    name: 'Xòe bồng',   price: 0 },
      { id: 'puff',    name: 'Tay phồng',  price: 16 },
      { id: 'tutu',    name: 'Váy ngắn',   price: 18 },
      { id: 'gown',    name: 'Dạ hội',     price: 22 },
      { id: 'mermaid', name: 'Đuôi cá',    price: 26 },
    ] },
  { id: 'dressColor', name: 'Màu váy', icon: '🌈', type: 'color', unlock: 1,
    items: [
      { id: 'pink',   name: 'Hồng',     color: '#ff9ccf', price: 0 },
      { id: 'blue',   name: 'Xanh biển', color: '#7fb8ff', price: 0 },
      { id: 'purple', name: 'Tím',      color: '#b58cff', price: 12 },
      { id: 'yellow', name: 'Vàng',     color: '#ffe066', price: 12 },
      { id: 'green',  name: 'Xanh lá',  color: '#8fe3a0', price: 14 },
      { id: 'red',    name: 'Đỏ',       color: '#ff6b7a', price: 16 },
      { id: 'white',  name: 'Trắng',    color: '#fbf6ff', price: 18 },
      { id: 'mint',   name: 'Bạc hà',   color: '#9ff0e0', price: 18 },
      { id: 'orange', name: 'Cam đào',  color: '#ffb266', price: 20 },
      { id: 'gold',   name: 'Vàng kim', color: '#f2c14e', price: 24 },
    ] },
  { id: 'crown', name: 'Vương miện', icon: '👑', type: 'style', crop: '70 10 160 110', unlock: 3,
    items: [
      { id: 'none',   name: 'Không',        price: 0 },
      { id: 'tiara',  name: 'Tiara bạc',    price: 0 },
      { id: 'gold',   name: 'Tiara vàng',   price: 16 },
      { id: 'bow',    name: 'Nơ to',        price: 16 },
      { id: 'flower', name: 'Vòng hoa',     price: 20 },
      { id: 'pearl',  name: 'Băng ngọc',    price: 22 },
      { id: 'big',    name: 'Vương miện lớn', price: 30 },
    ] },
  { id: 'lips', name: 'Son môi', icon: '💋', type: 'color', unlock: 3,
    items: [
      { id: 'none',   name: 'Tự nhiên', color: '#e8a898', price: 0 },
      { id: 'pink',   name: 'Hồng',     color: '#ff7fb0', price: 0 },
      { id: 'red',    name: 'Đỏ',       color: '#e0344d', price: 12 },
      { id: 'coral',  name: 'San hô',   color: '#ff8a65', price: 14 },
      { id: 'berry',  name: 'Dâu tằm',  color: '#b9265d', price: 16 },
      { id: 'purple', name: 'Tím mộng', color: '#b04ee0', price: 18 },
      { id: 'nude',   name: 'Nude',     color: '#d9a08a', price: 18 },
    ] },
  { id: 'shoes', name: 'Giày', icon: '👠', type: 'style', crop: '90 500 120 60', unlock: 5,
    items: [
      { id: 'pink',   name: 'Hồng',      color: '#ff8fc0', price: 0 },
      { id: 'blue',   name: 'Xanh',      color: '#6fa8ff', price: 0 },
      { id: 'red',    name: 'Đỏ',        color: '#e8404f', price: 12 },
      { id: 'purple', name: 'Tím',       color: '#a370e8', price: 14 },
      { id: 'gold',   name: 'Vàng kim',  color: '#f2c14e', price: 18 },
      { id: 'white',  name: 'Trắng',     color: '#ffffff', price: 18 },
      { id: 'glass',  name: 'Thủy tinh', color: '#c8ecff', price: 26 },
    ] },
  { id: 'necklace', name: 'Vòng cổ', icon: '📿', type: 'style', crop: '100 240 100 60', unlock: 5,
    items: [
      { id: 'none',   name: 'Không',       price: 0 },
      { id: 'pearl',  name: 'Ngọc trai',   price: 0 },
      { id: 'heart',  name: 'Trái tim',    price: 14 },
      { id: 'gem',    name: 'Kim cương',   price: 18 },
      { id: 'star',   name: 'Ngôi sao',    price: 18 },
      { id: 'choker', name: 'Ruy băng',    price: 20 },
    ] },
  { id: 'eyes', name: 'Màu mắt', icon: '👁️', type: 'color', unlock: 7,
    items: [
      { id: 'brown',  name: 'Nâu',     color: '#6b3f24', price: 0 },
      { id: 'blue',   name: 'Xanh',    color: '#4a8fe6', price: 0 },
      { id: 'green',  name: 'Xanh lá', color: '#4fb56f', price: 12 },
      { id: 'purple', name: 'Tím',     color: '#9d6be8', price: 14 },
      { id: 'pink',   name: 'Hồng',    color: '#ff7fb0', price: 16 },
      { id: 'amber',  name: 'Hổ phách', color: '#e0a040', price: 16 },
      { id: 'gray',   name: 'Xám',     color: '#8090a8', price: 18 },
    ] },
  { id: 'earrings', name: 'Hoa tai', icon: '💎', type: 'style', crop: '50 130 200 100', unlock: 7,
    items: [
      { id: 'none',     name: 'Không',     price: 0 },
      { id: 'pearl',    name: 'Ngọc trai', price: 0 },
      { id: 'ruby',     name: 'Hồng ngọc', price: 14 },
      { id: 'sapphire', name: 'Lam ngọc',  price: 14 },
      { id: 'hoop',     name: 'Khoen vàng', price: 16 },
      { id: 'star',     name: 'Ngôi sao',  price: 18 },
    ] },
  { id: 'blush', name: 'Má hồng', icon: '🌸', type: 'color', unlock: 9,
    items: [
      { id: 'none',     name: 'Không',    color: null,      price: 0 },
      { id: 'pink',     name: 'Hồng',     color: '#ff8fb8', price: 0 },
      { id: 'peach',    name: 'Đào',      color: '#ffb08a', price: 12 },
      { id: 'rose',     name: 'Hồng đậm', color: '#ff6f9c', price: 14 },
      { id: 'lavender', name: 'Oải hương', color: '#c9a0f0', price: 16 },
    ] },
  { id: 'pattern', name: 'Họa tiết', icon: '✨', type: 'style', crop: '20 330 260 220', unlock: 9,
    items: [
      { id: 'none',    name: 'Trơn',    price: 0 },
      { id: 'dots',    name: 'Chấm bi', price: 0 },
      { id: 'stripes', name: 'Kẻ sọc',  price: 12 },
      { id: 'hearts',  name: 'Trái tim', price: 14 },
      { id: 'stars',   name: 'Ngôi sao', price: 16 },
      { id: 'flowers', name: 'Hoa nhỏ', price: 18 },
    ] },
  { id: 'eyeshadow', name: 'Phấn mắt', icon: '👁️‍🗨️', type: 'color', unlock: 11,
    items: [
      { id: 'none',   name: 'Không',   color: null,      price: 0 },
      { id: 'pink',   name: 'Hồng',    color: '#ff9ccf', price: 0 },
      { id: 'purple', name: 'Tím',     color: '#b58cff', price: 12 },
      { id: 'blue',   name: 'Xanh',    color: '#7fb8ff', price: 12 },
      { id: 'gold',   name: 'Vàng',    color: '#f2c14e', price: 14 },
      { id: 'green',  name: 'Xanh lá', color: '#8fe3a0', price: 16 },
      { id: 'silver', name: 'Bạc',     color: '#cfd6e6', price: 18 },
    ] },
  { id: 'gloves', name: 'Bao tay', icon: '🧤', type: 'style', crop: '40 290 220 110', unlock: 13,
    items: [
      { id: 'none',   name: 'Không', price: 0 },
      { id: 'white',  name: 'Trắng', color: '#ffffff', price: 0 },
      { id: 'pink',   name: 'Hồng',  color: '#ffb3d6', price: 12 },
      { id: 'purple', name: 'Tím',   color: '#c9a0f0', price: 14 },
      { id: 'black',  name: 'Đen',   color: '#3a3040', price: 16 },
      { id: 'blue',   name: 'Xanh',  color: '#a5cdff', price: 16 },
    ] },
  { id: 'hand', name: 'Cầm tay', icon: '🪄', type: 'style', crop: '180 270 120 130', unlock: 15,
    items: [
      { id: 'none',    name: 'Không',       price: 0 },
      { id: 'wand',    name: 'Đũa phép',    price: 0 },
      { id: 'fan',     name: 'Quạt',        price: 14 },
      { id: 'bouquet', name: 'Bó hoa',      price: 16 },
      { id: 'bag',     name: 'Túi xách',    price: 18 },
      { id: 'mirror',  name: 'Gương tay',   price: 20 },
      { id: 'parasol', name: 'Dù ren',      price: 24 },
    ] },
];

export const SLOT_BY_ID = Object.fromEntries(SLOTS.map((s) => [s.id, s]));

export function itemOf(slotId, itemId) {
  return SLOT_BY_ID[slotId].items.find((i) => i.id === itemId);
}

// Diện mạo mặc định của công chúa "trắng" (chưa trang điểm)
export const DEFAULT_LOOK = Object.fromEntries(SLOTS.map((s) => [s.id, s.items[0].id]));

// Màu da đổi theo từng vòng (áp dụng cho cả mẫu và người chơi)
export const SKINS = ['#ffe0c8', '#f9d3b6', '#f1c39f', '#e2a97f', '#c98c62', '#ffe6d4'];

// Slot nào hoạt động ở vòng nào
export function activeSlots(level) {
  return SLOTS.filter((s) => level >= s.unlock).map((s) => s.id);
}

// Số vật phẩm được dùng làm mẫu ở mỗi slot (tăng dần theo vòng)
export function poolSize(level, slot) {
  const n = slot.items.length;
  const since = level - slot.unlock; // số vòng kể từ khi slot mở
  return Math.min(n, 3 + Math.floor(since / 2) + Math.floor(level / 6));
}

// Số món mẫu chưa sở hữu tối đa ở mỗi vòng (để không bắt mua quá nhiều)
export function maxUnowned(level) {
  if (level <= 2) return 1;
  if (level <= 6) return 2;
  if (level <= 10) return 3;
  if (level <= 14) return 4;
  return 5;
}

export function levelReward(level, stars) {
  return 14 + level * 3 + stars * 6;
}
