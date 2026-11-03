// ── Cấu hình tĩnh của game: dịch vụ, loại khách, màu sắc, độ khó từng ngày ──

// mode 'staff': cô nhân viên phải đến làm trong dur giây (giữ ngón tay để nhanh hơn)
// mode 'mask' : nhân viên đắp mặt nạ → chờ ngấm → chạm để nhân viên đến gỡ
// mode 'room' : phòng xông hơi chứa nhiều khách, tự chạy theo thời gian
export const SERVICES = {
  massage: { name: 'Mát-xa',   icon: '💆‍♀️', price: 30, mode: 'staff', dur: 5 },
  facial:  { name: 'Mặt nạ',   icon: '🧖‍♀️', price: 26, mode: 'mask',  applyT: 1.0, maskT: 6, removeT: 1.0 },
  sauna:   { name: 'Vòi sen',  icon: '🚿',  price: 22, mode: 'room',  dur: 8, cap: 3 },
  nail:    { name: 'Làm móng', icon: '💅',  price: 28, mode: 'staff', dur: 5 },
};

export const PAY_ICON = '💰';

// cô chủ tiệm — tóc cam kiểu bob, hoa cài tóc, kính, áo trắng thắt đai đỏ
export const HERO_LOOK = {
  skin: '#ffdfc4', hair: 'bob', hairColor: '#e8752c',
  dress: 'hero', dressColor: '#fdfaf4', apron: 'none', acc: 'flowerglasses',
};
export const HERO_NAME = 'Sen';
export const FRIEND_NAME = 'Nhi';

// khách spa mặc áo choàng tông xanh biển / trắng như ở tiệm bên bờ biển
export const ROBES = ['#bfe0f2', '#a5d8ff', '#d8ecf8', '#9ee0d0', '#eaf4fb', '#c2e8e2', '#b9d8f0'];
export const HAIR_STYLES = ['bun', 'pony', 'long', 'twin', 'bob'];
export const SKINS = ['#ffdfc4', '#f5cfa8', '#e8b88a'];
export const HAIRS = ['#6a4020', '#2e2018', '#a05c28', '#4a3550', '#c8763a'];

// loại khách: patience = số tim, payMult = hệ số trả tiền, speed = tốc độ đi
export const TYPES = {
  lady:     { name: 'Cô gái',    patience: 5,   payMult: 1.0,  speed: 1.0  },
  granny:   { name: 'Bà cụ',     patience: 7,   payMult: 0.9,  speed: 0.72 },
  business: { name: 'Nữ doanh nhân', patience: 3.5, payMult: 1.35, speed: 1.25 },
  star:     { name: 'Ngôi sao',  patience: 3,   payMult: 1.9,  speed: 1.1  },
};

// tốc độ giảm kiên nhẫn (tim / giây) theo trạng thái chờ
export const DECAY = {
  sit: 1 / 6,
  awaitStaff: 1 / 9, // chờ cô nhân viên đến
  maskDone: 1 / 8,   // mặt nạ ngấm xong, chờ được gỡ
  done: 1 / 8,
  queue: 1 / 8,
};

/* ══════════════ TIẾN TRIỂN THEO CẤP ĐỘ ══════════════
   Dựng theo cách Sally's Spa chia màn: game gồm nhiều CHƯƠNG (mỗi chương là
   một tiệm), mỗi chương vài ngày. Mỗi ngày mở thêm ô dịch vụ hoặc loại khách
   mới, đông khách hơn, mục tiêu cao hơn. Ngoài mục tiêu để qua ngày còn có
   MỤC TIÊU VÀNG (expert) — đạt được mới ăn 3 sao.                         */

export const CHAPTERS = [
  { name: 'Spa Bờ Biển Xanh',    icon: '🏖️', from: 1,  to: 5  },
  { name: 'Spa Vườn Nhiệt Đới',  icon: '🌴',  from: 6,  to: 10 },
  { name: 'Spa Cao Cấp',         icon: '💎',  from: 11, to: 15 },
  // qua hết 3 chương thì chơi tiếp không giới hạn, mỗi ngày khó thêm chút
  { name: 'Spa Trong Mơ',        icon: '🌙',  from: 16, to: Infinity, endless: true },
];

const M = 'massage', F = 'facial', S = 'sauna', N = 'nail';
const LADY = 'lady', GRAN = 'granny', BIZ = 'business', STAR = 'star';

// st = các ô dịch vụ · ty = loại khách có thể tới · w = [ít nhất, nhiều nhất] điều muốn
// n = số khách trong ngày · gap = giây giữa hai lượt khách · f = độ khó của mục tiêu
const LEVELS = [
  /* ── Chương 1 · Spa Bờ Biển Xanh: học nghề như ngày đầu trong video ── */
  { st: [F, F, M, S],       ty: [LADY],                   w: [1, 1], n: 8,  gap: 9.2, f: 0.50 },
  { st: [F, F, M, S],       ty: [LADY, LADY, GRAN],       w: [1, 1], n: 10, gap: 8.6, f: 0.52 },
  { st: [F, F, M, S, N],    ty: [LADY, LADY, GRAN],       w: [1, 2], n: 11, gap: 8.2, f: 0.54 },
  { st: [F, M, M, S, N],    ty: [LADY, LADY, GRAN, BIZ],  w: [1, 2], n: 12, gap: 7.6, f: 0.56 },
  { st: [F, F, M, M, S, N], ty: [LADY, LADY, GRAN, BIZ],  w: [1, 2], n: 14, gap: 7.2, f: 0.58 },

  /* ── Chương 2 · Spa Vườn Nhiệt Đới ── */
  { st: [M, F, S, N],       ty: [LADY, LADY, GRAN, BIZ],        w: [1, 2], n: 14, gap: 7.4, f: 0.56 },
  { st: [M, M, F, S, N],    ty: [LADY, LADY, GRAN, BIZ],        w: [2, 2], n: 15, gap: 7.0, f: 0.58 },
  { st: [M, F, F, S, N],    ty: [LADY, GRAN, BIZ, STAR],        w: [2, 2], n: 16, gap: 6.6, f: 0.60 },
  { st: [M, M, F, S, N, N], ty: [LADY, GRAN, BIZ, BIZ, STAR],   w: [2, 3], n: 17, gap: 6.2, f: 0.62 },
  { st: [M, M, F, F, S, N], ty: [LADY, GRAN, BIZ, BIZ, STAR],   w: [2, 3], n: 18, gap: 5.8, f: 0.64 },

  /* ── Chương 3 · Spa Cao Cấp: khách sang, đòi nhiều ── */
  { st: [M, M, F, S, N, N],       ty: [LADY, GRAN, BIZ, STAR],       w: [2, 3], n: 18, gap: 6.0, f: 0.60 },
  { st: [M, M, F, F, S, N],       ty: [LADY, BIZ, BIZ, STAR],        w: [2, 3], n: 19, gap: 5.6, f: 0.62 },
  { st: [M, M, F, S, S, N, N],    ty: [LADY, GRAN, BIZ, STAR, STAR], w: [2, 3], n: 20, gap: 5.2, f: 0.64 },
  { st: [M, M, M, F, F, S, N],    ty: [LADY, BIZ, BIZ, STAR, STAR],  w: [2, 3], n: 21, gap: 4.8, f: 0.66 },
  { st: [M, M, M, F, F, S, N, N], ty: [BIZ, BIZ, STAR, STAR, LADY],  w: [3, 3], n: 22, gap: 4.5, f: 0.68 },
];

// một khách của màn này mang lại khoảng bao nhiêu tiền khi phục vụ tốt:
// tiền dịch vụ (theo giá các ô có mặt) × hệ số trả tiền, cộng tiền boa theo tim
// còn lại. Tính với người chơi CHƯA nâng cấp gì, nên nâng cấp luôn làm dễ hơn.
function perCustomer(lv) {
  const keys = [...new Set(lv.st)];
  const avgPrice = keys.reduce((a, k) => a + SERVICES[k].price, 0) / keys.length;
  const avgPay = lv.ty.reduce((a, k) => a + TYPES[k].payMult, 0) / lv.ty.length;
  const avgPat = lv.ty.reduce((a, k) => a + TYPES[k].patience, 0) / lv.ty.length;
  const avgW = (lv.w[0] + lv.w[1]) / 2;
  return avgW * avgPrice * avgPay + 0.7 * avgPat * 2;
}

// f = phần trăm doanh thu hoàn hảo cần đạt để qua ngày
function levelGoal(lv, f) {
  return Math.round(lv.n * perCustomer(lv) * f / 10) * 10;
}

// ngày vượt quá bảng thì nối tiếp chương cuối, mỗi ngày khó thêm một chút
function endlessLevel(d) {
  const base = LEVELS[LEVELS.length - 1];
  const over = d - LEVELS.length;
  return {
    st: base.st,
    ty: base.ty,
    w: base.w,
    n: Math.min(30, base.n + over),
    gap: Math.max(3.4, base.gap - over * 0.1),
    f: Math.min(0.72, base.f + over * 0.01),
  };
}

export function chapterOf(d) {
  for (let i = 0; i < CHAPTERS.length; i++) {
    const c = CHAPTERS[i];
    if (d >= c.from && d <= c.to)
      return { ...c, index: i, day: d - c.from + 1, days: c.endless ? 0 : c.to - c.from + 1 };
  }
  const last = CHAPTERS[CHAPTERS.length - 1];
  return { ...last, index: CHAPTERS.length - 1, day: d - last.from + 1, days: 0 };
}

function levelAt(d) {
  return d <= LEVELS.length ? LEVELS[d - 1] : endlessLevel(d);
}

// những gì ngày này mở thêm — tính theo "chưa từng gặp ở ngày nào trước"
function unlocksOf(d) {
  if (d <= 1) return [];
  const now = levelAt(d);
  const seenSt = new Set(), seenTy = new Set();
  let maxW = 0;
  for (let i = 1; i < d; i++) {
    const p = levelAt(i);
    for (const k of p.st) seenSt.add(k);
    for (const k of p.ty) seenTy.add(k);
    maxW = Math.max(maxW, p.w[1]);
  }
  const out = [];
  for (const k of new Set(now.st))
    if (!seenSt.has(k)) out.push({ kind: 'service', icon: SERVICES[k].icon, name: SERVICES[k].name });
  for (const k of new Set(now.ty))
    if (!seenTy.has(k)) out.push({ kind: 'type', icon: k === 'star' ? '👑' : '👩‍💼', name: TYPES[k].name });
  if (now.w[1] > maxW)
    out.push({ kind: 'wish', icon: '💭', name: 'Khách muốn tới ' + now.w[1] + ' dịch vụ' });
  return out;
}

export function dayConfig(d) {
  const lv = levelAt(d);
  const goal = levelGoal(lv, lv.f);
  return {
    stations: lv.st.slice(0, 8),
    types: lv.ty,
    minW: lv.w[0], maxW: lv.w[1],
    nCustomers: lv.n,
    spawnGap: lv.gap,
    goal,
    expert: Math.round(goal * 1.35 / 10) * 10, // mục tiêu vàng → 3 sao
    chapter: chapterOf(d),
    unlocks: unlocksOf(d),
    isLastDayOfChapter: CHAPTERS.some(c => c.to === d),
  };
}

export function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
