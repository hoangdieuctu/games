// ── Cấu hình tĩnh của game: dịch vụ, loại khách, màu sắc, độ khó từng ngày ──

export const SERVICES = {
  massage: { name: 'Mát-xa',   icon: '💆‍♀️', price: 30, mode: 'tap',  taps: 6 },
  facial:  { name: 'Mặt nạ',   icon: '🧖‍♀️', price: 26, mode: 'auto', dur: 7 },
  sauna:   { name: 'Xông hơi', icon: '♨️',  price: 22, mode: 'auto', dur: 9 },
  nail:    { name: 'Làm móng', icon: '💅',  price: 28, mode: 'tap',  taps: 6 },
};

export const PAY_ICON = '💰';

export const ROBES = ['#ff9eb8', '#a5d8ff', '#b9e8a8', '#ffd98a', '#d5b8ff', '#ffc2a0'];
export const SKINS = ['#ffdfc4', '#f5cfa8', '#e8b88a'];
export const HAIRS = ['#6a4020', '#2e2018', '#a05c28', '#4a3550', '#c8763a'];

// loại khách: patience = số tim, payMult = hệ số trả tiền, speed = tốc độ đi
export const TYPES = {
  lady:     { patience: 5,   payMult: 1.0,  speed: 1.0  },
  granny:   { patience: 7,   payMult: 0.9,  speed: 0.72 },
  business: { patience: 3.5, payMult: 1.35, speed: 1.25 },
  star:     { patience: 3,   payMult: 1.9,  speed: 1.1  },
};

// tốc độ giảm kiên nhẫn (tim / giây) theo trạng thái chờ
export const DECAY = {
  sit: 1 / 6,
  done: 1 / 8,
  queue: 1 / 8,
  neglected: 1 / 7, // dịch vụ chạm bị bỏ mặc giữa chừng
};

export function dayConfig(d) {
  const st = ['massage', 'massage', 'facial'];
  if (d >= 2) st.push('sauna');
  if (d >= 3) st.push('nail');
  if (d >= 4) st.push('facial');
  if (d >= 5) st.push('massage');
  if (d >= 6) st.push('nail');
  const types = ['lady', 'lady', 'granny'];
  if (d >= 3) types.push('business');
  if (d >= 5) types.push('star', 'business');
  const minW = d < 2 ? 1 : d < 4 ? 1 : 2;
  const maxW = d < 2 ? 1 : d < 4 ? 2 : 3;
  const n = Math.min(6 + d * 2, 20);
  const goal = Math.round(n * ((minW + maxW) / 2) * 27 * 0.55 / 10) * 10;
  return {
    stations: st.slice(0, 8),
    types,
    minW, maxW,
    nCustomers: n,
    spawnGap: Math.max(3.4, 9 - d * 0.8),
    goal,
  };
}

export function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
