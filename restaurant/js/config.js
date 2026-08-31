// ── Cấu hình tĩnh của game: món ăn, loại khách, độ khó từng ngày ──

// cook: số giây bếp nấu xong; price: tiền món
export const DISHES = {
  coffee: { name: 'Cà phê',    icon: '☕', price: 18, cook: 2.6, color: '#c89060' },
  boba:   { name: 'Trà sữa',   icon: '🧋', price: 22, cook: 3.0, color: '#e0b48a' },
  pho:    { name: 'Phở',       icon: '🍜', price: 34, cook: 5.6, color: '#f0c070' },
  burger: { name: 'Burger',    icon: '🍔', price: 30, cook: 5.0, color: '#e8a050' },
  salad:  { name: 'Salad',     icon: '🥗', price: 26, cook: 3.6, color: '#8ed070' },
  cake:   { name: 'Bánh ngọt', icon: '🍰', price: 28, cook: 4.0, color: '#ffb0c8' },
  pizza:  { name: 'Pizza',     icon: '🍕', price: 38, cook: 6.4, color: '#f09040' },
  sushi:  { name: 'Sushi',     icon: '🍣', price: 42, cook: 7.0, color: '#ff9c8a' },
};

export const BILL_ICON = '💰';

export const SKINS = ['#ffdfc4', '#f5cfa8', '#e8b88a'];
export const HAIRS = ['#6a4020', '#2e2018', '#a05c28', '#4a3550', '#c8763a', '#8a5a3a'];
export const CLOTHES = ['#ff9eb8', '#a5d8ff', '#b9e8a8', '#ffd98a', '#d5b8ff', '#ffc2a0', '#9ee0d0'];

// patience = số tim, payMult = hệ số trả tiền, speed = tốc độ đi, exp = kinh nghiệm
export const TYPES = {
  guest:    { patience: 5,   payMult: 1.0,  speed: 1.0,  exp: 4 },
  granny:   { patience: 7,   payMult: 0.9,  speed: 0.72, exp: 4 },
  business: { patience: 3.5, payMult: 1.4,  speed: 1.28, exp: 7 },
  star:     { patience: 3,   payMult: 2.0,  speed: 1.12, exp: 10 },
};

// tốc độ giảm kiên nhẫn (tim / giây) theo trạng thái chờ
export const DECAY = {
  wait: 1 / 15,     // đứng chờ ở cửa (xếp hàng thì kiên nhẫn hơn)
  order: 1 / 8,     // cầm thực đơn, chờ ghi món
  waitFood: 1 / 16, // chờ món ra (bếp nấu nên khách chịu chờ hơn)
  bill: 1 / 9,      // ăn xong, chờ tính tiền
};

export const MENU_BY_DAY = [
  ['pho', 'coffee'],
  ['pho', 'coffee', 'burger'],
  ['pho', 'coffee', 'burger', 'boba'],
  ['pho', 'coffee', 'burger', 'boba', 'salad'],
  ['pho', 'coffee', 'burger', 'boba', 'salad', 'cake'],
  ['pho', 'coffee', 'burger', 'boba', 'salad', 'cake', 'pizza'],
  ['pho', 'coffee', 'burger', 'boba', 'salad', 'cake', 'pizza', 'sushi'],
];

export function dayConfig(d) {
  const menu = MENU_BY_DAY[Math.min(d - 1, MENU_BY_DAY.length - 1)];
  const types = ['guest', 'guest', 'granny'];
  if (d >= 3) types.push('business');
  if (d >= 5) types.push('star', 'business');

  const tables = Math.min(6, 2 + Math.ceil(d / 1.5));
  const minOrd = d >= 6 ? 2 : 1;
  const maxOrd = d >= 3 ? 2 : 1;
  const n = Math.min(6 + Math.round(d * 1.5), 16);

  const avgPrice = menu.reduce((a, k) => a + DISHES[k].price, 0) / menu.length;
  const goal = Math.round(n * ((minOrd + maxOrd) / 2) * avgPrice * 0.52 / 10) * 10;

  return {
    menu, types, tables, minOrd, maxOrd,
    nCustomers: n,
    spawnGap: Math.max(5.8, 9.6 - d * 0.5),
    goal,
  };
}

export function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
