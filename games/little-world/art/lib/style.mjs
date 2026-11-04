// ── Little World: thư viện phong cách dùng chung cho MỌI tài sản hình ảnh ──
// Mọi generator (nhân vật, môi trường, bản đồ) phải dùng bảng màu, độ dày viền,
// bóng và hướng sáng ở đây để toàn bộ game cùng một phong cách.
//
// Quy ước (xem docs/ART_GUIDELINES.md):
//  - Đơn vị SVG = "đơn vị thế giới" (1 ô lưới đảo = 64 đơn vị).
//  - Xuất texture ở @2x (raster scale 2), Phaser hiển thị scale 0.5.
//  - Ánh sáng từ TRÊN-TRÁI. Mặt sáng ngả vàng ấm, mặt tối ngả tím lavender.
//  - Viền màu (không dùng đen): cùng tông với màu nền nhưng tối & đậm hơn.
//  - Góc nhìn: 3/4 từ trên xuống (top-down oblique). Vật thể nhìn chính diện,
//    hơi thấy mặt trên; mặt đất nhìn từ trên xuống. Sắp xếp chiều sâu theo y.

// ───────────────────────── Bảng màu ─────────────────────────
export const PAL = {
  // trời & biển
  sky: '#a8dcf7', skyLight: '#dff3fd', skyDeep: '#7cc3ee',
  ocean: '#5ab4e0', oceanLight: '#8fd6f0', oceanDeep: '#3d8ccc', oceanAbyss: '#2f6fae',
  foam: '#f2fbff',
  // cỏ & cây
  grass: '#9fd67c', grassLight: '#c8eb9c', grassDark: '#72b85e', grassDeep: '#4f9a52',
  leaf: '#7cc96a', leafDark: '#4f9e57', mint: '#a6e3c4',
  // ấm
  yellow: '#ffd96b', yellowLight: '#fff0b3', orange: '#ffac6b', orangeDeep: '#f28a4e',
  peach: '#ffc9a3', coral: '#ff8f8f',
  // hồng & tím
  pink: '#ffb8cb', pinkLight: '#ffdbe5', rose: '#f58aa8',
  lavender: '#c7b5f0', lavenderLight: '#e6dcfb', purple: '#9b85d9',
  // đất & đá & gỗ
  sand: '#f6e0ae', sandDark: '#e4c487',
  earth: '#c99f74', earthDark: '#9b7453', soil: '#a97a57', soilDark: '#7f5a43',
  wood: '#cf9161', woodLight: '#e6b386', woodDark: '#99643f',
  stone: '#bdb8ca', stoneLight: '#dcd8e6', stoneDark: '#918ca5',
  // trung tính
  white: '#fffaf2', cream: '#fff3dc', ink: '#4b3a5e', // ink = màu viền/chi tiết tối nhất
  // bóng (lavender trong suốt — không dùng đen)
  shadow: 'rgba(76,56,118,0.22)', shadowSoft: 'rgba(76,56,118,0.12)',
  // da (cho nhân vật)
  skin: ['#ffe3cf', '#f9cfae', '#e7b08a', '#c68a63', '#94603f'],
  hair: ['#4a3426', '#7a4b2e', '#c98c4f', '#f2cf7a', '#e86f5a', '#2f2c3d', '#b49ae6', '#ff9fbf'],
};

// ───────────────────────── Độ dày viền (đơn vị thế giới) ─────────────────────────
export const LINE = {
  xl: 5,      // vật rất lớn: núi, nhà lớn, nền đảo
  lg: 4,      // nhà, cây lớn
  md: 3,      // đồ vật vừa, nhân vật (thân)
  sm: 2,      // chi tiết nhỏ, nhân vật (mặt, ngón)
  xs: 1.25,   // nét trang trí bên trong
};

// ───────────────────────── Màu ─────────────────────────
export function hexToRgb(hex) {
  const h = hex.replace('#', '');
  const v = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  return [0, 2, 4].map((i) => parseInt(v.slice(i, i + 2), 16));
}
export function rgbToHex([r, g, b]) {
  return '#' + [r, g, b].map((x) => Math.round(Math.max(0, Math.min(255, x))).toString(16).padStart(2, '0')).join('');
}
export function rgbToHsl([r, g, b]) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0; const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
  }
  return [h, s, l];
}
export function hslToRgb([h, s, l]) {
  h = ((h % 360) + 360) % 360;
  const c = (1 - Math.abs(2 * l - 1)) * s, x = c * (1 - Math.abs(((h / 60) % 2) - 1)), m = l - c / 2;
  let [r, g, b] = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
  return [(r + m) * 255, (g + m) * 255, (b + m) * 255];
}
const clamp01 = (v) => Math.max(0, Math.min(1, v));

// Dịch hue về phía mục tiêu theo khoảng ngắn nhất
function hueToward(h, target, amt) {
  let d = ((target - h + 540) % 360) - 180;
  return h + d * amt;
}

/** Làm sáng: ngả về vàng ấm (hue 50). amt 0..1 */
export function lighten(hex, amt = 0.15) {
  const [h, s, l] = rgbToHsl(hexToRgb(hex));
  return rgbToHex(hslToRgb([hueToward(h, 50, amt * 0.35), clamp01(s * (1 - amt * 0.15)), clamp01(l + (1 - l) * amt * 1.6)]));
}
/** Làm tối: ngả về tím lavender (hue 265). amt 0..1 */
export function darken(hex, amt = 0.15) {
  const [h, s, l] = rgbToHsl(hexToRgb(hex));
  return rgbToHex(hslToRgb([hueToward(h, 265, amt * 0.45), clamp01(s * (1 + amt * 0.08)), clamp01(l * (1 - amt * 1.05))]));
}
export function mix(a, b, t) {
  const A = hexToRgb(a), B = hexToRgb(b);
  return rgbToHex(A.map((v, i) => v + (B[i] - v) * t));
}
export function alpha(hex, a) {
  const [r, g, b] = hexToRgb(hex);
  return `rgba(${r},${g},${b},${a})`;
}

/** Dải màu chuẩn cho một vật liệu: sáng / gốc / tối / viền */
export function ramp(hex) {
  return {
    hi: lighten(hex, 0.28),
    base: hex,
    lo: darken(hex, 0.18),
    deep: darken(hex, 0.32),
    line: darken(hex, 0.46),
  };
}

// ───────────────────────── Ngẫu nhiên có seed ─────────────────────────
export function rng(seed = 1) {
  let s = seed >>> 0 || 1;
  const f = () => { s ^= s << 13; s >>>= 0; s ^= s >> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; };
  f.range = (a, b) => a + (b - a) * f();
  f.int = (a, b) => Math.floor(a + (b - a + 1) * f());
  f.pick = (arr) => arr[Math.floor(f() * arr.length)];
  return f;
}

// ───────────────────────── Hình học ─────────────────────────
const r2 = (v) => Math.round(v * 100) / 100;

/** Đường cong mượt qua các điểm (Catmull-Rom → Bezier). */
export function smoothPath(pts, closed = true, tension = 1) {
  if (pts.length < 2) return '';
  const P = closed ? [pts[pts.length - 1], ...pts, pts[0], pts[1]] : [pts[0], ...pts, pts[pts.length - 1]];
  let d = `M${r2(P[1][0])},${r2(P[1][1])}`;
  const n = closed ? pts.length : pts.length - 1;
  for (let i = 1; i <= n; i++) {
    const p0 = P[i - 1], p1 = P[i], p2 = P[i + 1], p3 = P[i + 2];
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6 * tension, p1[1] + (p2[1] - p0[1]) / 6 * tension];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6 * tension, p2[1] - (p3[1] - p1[1]) / 6 * tension];
    d += ` C${r2(c1[0])},${r2(c1[1])} ${r2(c2[0])},${r2(c2[1])} ${r2(p2[0])},${r2(p2[1])}`;
  }
  return closed ? d + 'Z' : d;
}

/** Khối tròn méo hữu cơ (tán lá, bụi cây, đá, đảo). */
export function blobPoints(cx, cy, rx, ry, n = 9, jitter = 0.12, seed = 1, rot = 0) {
  const R = rng(seed);
  const pts = [];
  for (let i = 0; i < n; i++) {
    const a = rot + (i / n) * Math.PI * 2;
    const k = 1 + (R() * 2 - 1) * jitter;
    pts.push([cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k]);
  }
  return pts;
}
export function blob(cx, cy, rx, ry, n, jitter, seed, rot) {
  return smoothPath(blobPoints(cx, cy, rx, ry, n, jitter, seed, rot), true);
}

/** Đám mây/tán lá "bông" — vòng ngoài gồm nhiều cung tròn phồng. */
export function puffPath(cx, cy, rx, ry, bumps = 8, depth = 0.18, seed = 1) {
  const R = rng(seed);
  const pts = [];
  for (let i = 0; i < bumps; i++) {
    const a = (i / bumps) * Math.PI * 2 - Math.PI / 2;
    const k = 1 + (R() - 0.5) * 0.12;
    pts.push([cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k]);
  }
  let d = `M${r2(pts[0][0])},${r2(pts[0][1])}`;
  for (let i = 0; i < bumps; i++) {
    const a = pts[i], b = pts[(i + 1) % bumps];
    const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2;
    const ox = mx - cx, oy = my - cy, len = Math.hypot(ox, oy) || 1;
    const bulge = (rx + ry) / 2 * depth * (0.8 + R() * 0.5);
    d += ` Q${r2(mx + ox / len * bulge * 2)},${r2(my + oy / len * bulge * 2)} ${r2(b[0])},${r2(b[1])}`;
  }
  return d + 'Z';
}

// ───────────────────────── Tài liệu SVG ─────────────────────────
/**
 * const doc = new Doc(w, h);
 * const g = doc.vgrad('#9fd67c');            // gradient dọc chuẩn (sáng trên, tối dưới)
 * doc.toString(`<path d="..." fill="${g}" stroke="${ramp(c).line}" .../>`)
 */
export class Doc {
  constructor(w, h, opts = {}) {
    this.w = w; this.h = h; this.defs = []; this.n = 0;
    this.prefix = opts.prefix || 'lw' + Math.floor(Math.random() * 1e6).toString(36);
    this.viewBox = opts.viewBox || `0 0 ${w} ${h}`;
  }
  id(p = 'd') { return `${this.prefix}-${p}${++this.n}`; }
  add(def) { this.defs.push(def); }
  /** gradient tuyến tính; stops: [[offset, color, opacity?], ...] */
  linear(stops, x1 = 0, y1 = 0, x2 = 0, y2 = 1, units = 'objectBoundingBox') {
    const id = this.id('lg');
    this.add(`<linearGradient id="${id}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" gradientUnits="${units}">${stops.map(([o, c, a = 1]) => `<stop offset="${o}" stop-color="${c}" stop-opacity="${a}"/>`).join('')}</linearGradient>`);
    return `url(#${id})`;
  }
  radial(stops, cx = 0.5, cy = 0.5, r = 0.5, fx = cx, fy = cy, units = 'objectBoundingBox') {
    const id = this.id('rg');
    this.add(`<radialGradient id="${id}" cx="${cx}" cy="${cy}" r="${r}" fx="${fx}" fy="${fy}" gradientUnits="${units}">${stops.map(([o, c, a = 1]) => `<stop offset="${o}" stop-color="${c}" stop-opacity="${a}"/>`).join('')}</radialGradient>`);
    return `url(#${id})`;
  }
  /** Tô chuẩn của Little World: sáng trên-trái → tối dưới-phải. */
  vgrad(hex, strength = 1) {
    const r = ramp(hex);
    return this.linear([[0, mix(hex, r.hi, strength)], [0.55, hex], [1, mix(hex, r.lo, strength)]], 0.2, 0, 0.8, 1);
  }
  /** Tô dạng khối cầu (tán cây, quả, đầu nhân vật). */
  sphere(hex, strength = 1) {
    const r = ramp(hex);
    return this.radial([[0, mix(hex, r.hi, strength)], [0.6, hex], [1, mix(hex, r.lo, strength)]], 0.38, 0.32, 0.75);
  }
  /** Bộ lọc mềm (blur) — dùng tiết kiệm, chủ yếu cho ánh sáng/sương. */
  blur(std = 4) {
    const id = this.id('bl');
    this.add(`<filter id="${id}" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="${std}"/></filter>`);
    return `url(#${id})`;
  }
  clip(inner) {
    const id = this.id('cp');
    this.add(`<clipPath id="${id}">${inner}</clipPath>`);
    return `url(#${id})`;
  }
  toString(body) {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${this.w}" height="${this.h}" viewBox="${this.viewBox}"><defs>${this.defs.join('')}</defs>${body}</svg>`;
  }
}

// ───────────────────────── Mảnh vẽ chuẩn ─────────────────────────
/** Bóng đổ trên mặt đất (elip lavender mờ) — đặt dưới MỌI vật đứng trên đất. */
export function groundShadow(cx, cy, rx, ry = rx * 0.32, op = 1) {
  return `<ellipse cx="${r2(cx)}" cy="${r2(cy)}" rx="${r2(rx)}" ry="${r2(ry)}" fill="${PAL.shadow}" opacity="${op}"/>`;
}
/** Vệt sáng bóng (trên-trái) cho khối tròn. */
export function gloss(cx, cy, rx, ry, op = 0.45, rot = -25) {
  return `<ellipse cx="${r2(cx)}" cy="${r2(cy)}" rx="${r2(rx)}" ry="${r2(ry)}" fill="#ffffff" opacity="${op}" transform="rotate(${rot} ${r2(cx)} ${r2(cy)})"/>`;
}
/** path với viền chuẩn */
export function shape(d, fill, line, w = LINE.md, extra = '') {
  return `<path d="${d}" fill="${fill}" stroke="${line}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round" ${extra}/>`;
}
/** nét chi tiết (không tô) */
export function stroke(d, color, w = LINE.sm, extra = '') {
  return `<path d="${d}" fill="none" stroke="${color}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round" ${extra}/>`;
}
export function circle(cx, cy, r, fill, line, w = LINE.md, extra = '') {
  return `<circle cx="${r2(cx)}" cy="${r2(cy)}" r="${r2(r)}" fill="${fill}" ${line ? `stroke="${line}" stroke-width="${w}"` : ''} ${extra}/>`;
}
export function ellipse(cx, cy, rx, ry, fill, line, w = LINE.md, extra = '') {
  return `<ellipse cx="${r2(cx)}" cy="${r2(cy)}" rx="${r2(rx)}" ry="${r2(ry)}" fill="${fill}" ${line ? `stroke="${line}" stroke-width="${w}"` : ''} ${extra}/>`;
}
export function rect(x, y, w, h, rx, fill, line, lw = LINE.md, extra = '') {
  return `<rect x="${r2(x)}" y="${r2(y)}" width="${r2(w)}" height="${r2(h)}" rx="${r2(rx)}" fill="${fill}" ${line ? `stroke="${line}" stroke-width="${lw}"` : ''} stroke-linejoin="round" ${extra}/>`;
}
export const g = (body, transform = '', extra = '') => `<g${transform ? ` transform="${transform}"` : ''} ${extra}>${body}</g>`;
export { r2 };
