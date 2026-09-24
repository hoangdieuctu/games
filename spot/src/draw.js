// ── Bảng màu và các hàm vẽ SVG dùng chung ──
export const PALETTE = {
  red: '#e53935', orange: '#fb8c00', yellow: '#fdd835', lime: '#9ccc65',
  green: '#43a047', teal: '#26a69a', cyan: '#29b6f6', blue: '#1e88e5',
  navy: '#3949ab', purple: '#8e24aa', pink: '#ec407a', brown: '#8d6e63',
  gray: '#90a4ae', white: '#fafafa', cream: '#fff3d6', black: '#455a64',
};
// Màu "gần giống" — vòng sau dùng để đổi màu tinh vi hơn.
export const NEAR = {
  red: ['orange', 'pink'], orange: ['red', 'yellow'], yellow: ['orange', 'lime', 'cream'],
  lime: ['green', 'yellow'], green: ['lime', 'teal'], teal: ['green', 'cyan'],
  cyan: ['teal', 'blue'], blue: ['cyan', 'navy'], navy: ['blue', 'purple'],
  purple: ['navy', 'pink'], pink: ['purple', 'red'], brown: ['orange', 'gray'],
  gray: ['brown', 'navy', 'black'], white: ['cream', 'gray'], cream: ['white', 'yellow'],
  black: ['navy', 'gray'],
};
export const col = (k) => PALETTE[k] || k;

// Làm tối (amt < 0) hoặc sáng (amt > 0) một màu hex.
export function shade(hex, amt) {
  const n = parseInt(hex.slice(1), 16);
  const f = (v) => Math.round(amt < 0 ? v * (1 + amt) : v + (255 - v) * amt);
  const r = f(n >> 16), g = f((n >> 8) & 255), b = f(n & 255);
  return '#' + [r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('');
}

// Thuộc tính tô màu có viền đậm kiểu hoạt hình.
export const S = (fill, sw = 2.5) =>
  `fill="${fill}" stroke="${shade(fill, -0.45)}" stroke-width="${sw}" stroke-linejoin="round" stroke-linecap="round"`;
// Thuộc tính nét vẽ không tô.
export const L = (color, sw = 3) =>
  `fill="none" stroke="${color}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round"`;
// Lặp một mẩu SVG n lần.
export const rep = (n, f) => { let s = ''; for (let i = 0; i < n; i++) s += f(i); return s; };
// Vệt sáng bóng.
export const hl = (x, y, w, h, r = 4) =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="#fff" opacity=".3"/>`;
// Toạ độ x của mục thứ i trong n mục trải đều từ x1 đến x2.
export const spread = (i, n, x1, x2) => (n <= 1 ? (x1 + x2) / 2 : x1 + (x2 - x1) * i / (n - 1));
// Móc treo áo: từ đỉnh -h xuống thanh ngang ở -h+26.
export const hanger = (h) =>
  `<path d="M0 ${-h + 12} Q0 ${-h} 6 ${-h} Q12 ${-h} 12 ${-h + 6}" ${L('#78909c', 2.5)}/>`
  + `<path d="M-32 ${-h + 26} L0 ${-h + 10} L32 ${-h + 26} Z" ${L('#a1887f', 3.5)}/>`;
// Ngôi sao 5 cánh tâm (cx,cy).
export function star(cx, cy, ro, ri) {
  let d = '';
  for (let i = 0; i < 10; i++) {
    const r = i % 2 ? ri : ro, a = -Math.PI / 2 + i * Math.PI / 5;
    d += (i ? 'L' : 'M') + (cx + r * Math.cos(a)).toFixed(1) + ' ' + (cy + r * Math.sin(a)).toFixed(1);
  }
  return d + 'Z';
}
