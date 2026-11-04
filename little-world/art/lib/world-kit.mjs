// ── Little World: bộ "đạo cụ" vẽ dùng chung cho bản đồ thế giới, mốc vùng và ảnh nền vùng ──
// Mọi hàm vẽ nhận P (painter: Doc + bộ nhớ gradient) và toạ độ ĐẾ (chân chạm đất).
// s = hệ số kích thước, lw = độ dày viền tuyệt đối (đơn vị SVG).
import {
  PAL, LINE, ramp, lighten, darken, mix, alpha, rng, smoothPath, blob, blobPoints, puffPath,
  groundShadow, gloss, shape, stroke, circle, ellipse, rect, g, r2,
} from './style.mjs';

export { PAL, LINE, ramp, lighten, darken, mix, alpha, rng, smoothPath, blob, blobPoints, puffPath, groundShadow, gloss, shape, stroke, circle, ellipse, rect, g, r2 };

/** Painter: gói Doc + cache gradient (tránh tạo hàng nghìn <defs> trùng). */
export function painter(doc) {
  const c = new Map();
  const memo = (k, f) => { if (!c.has(k)) c.set(k, f()); return c.get(k); };
  return {
    doc,
    sphere: (h, s = 1) => memo('s' + h + s, () => doc.sphere(h, s)),
    vgrad: (h, s = 1) => memo('v' + h + s, () => doc.vgrad(h, s)),
    /** gradient dọc đơn giản từ a → b */
    v2: (a, b, ao = 1, bo = 1) => memo(`v2${a}${b}${ao}${bo}`, () => doc.linear([[0, a, ao], [1, b, bo]])),
    h2: (a, b) => memo(`h2${a}${b}`, () => doc.linear([[0, a], [1, b]], 0, 0, 1, 0)),
    lin: (key, stops, x1, y1, x2, y2, u) => memo('l' + key, () => doc.linear(stops, x1, y1, x2, y2, u)),
    rad: (key, stops, ...a) => memo('r' + key, () => doc.radial(stops, ...a)),
    /** quầng sáng tròn mờ dần tới trong suốt */
    glow: (h, a = 0.85) => memo('g' + h + a, () => doc.radial([[0, h, a], [0.45, h, a * 0.45], [1, h, 0]])),
    /** mảng màu mềm (dùng tô vùng đất) — đậm ở giữa, trong suốt ở rìa */
    soft: (h, a = 0.6) => memo('f' + h + a, () => doc.radial([[0, h, a], [0.6, h, a * 0.7], [1, h, 0]])),
    clip: (inner) => doc.clip(inner),
  };
}

const TAU = Math.PI * 2;
const pt = (a) => a.map(([x, y]) => `${r2(x)},${r2(y)}`).join(' ');

// ───────────────────────── Cây cối ─────────────────────────
/** Cây tán tròn. (x,y)=gốc. Chiều cao ~ 64*s */
export function tree(P, x, y, s = 1, o = {}) {
  const col = o.color || PAL.leaf, R = ramp(col), lw = o.lw ?? 2.4 * Math.sqrt(s), seed = o.seed || 1;
  const trunk = o.trunk || PAL.wood, T = ramp(trunk);
  const cy = y - 36 * s, rx = 25 * s * (o.wide || 1), ry = 23 * s;
  let b = o.noShadow ? '' : groundShadow(x + 4 * s, y, 20 * s * (o.wide || 1), 6.5 * s);
  b += shape(`M${r2(x - 4 * s)},${r2(y + 1)} L${r2(x - 3 * s)},${r2(cy + 8 * s)} L${r2(x + 3 * s)},${r2(cy + 8 * s)} L${r2(x + 4 * s)},${r2(y + 1)}Z`, T.base, T.line, lw * 0.8);
  b += shape(puffPath(x, cy, rx, ry, o.bumps || 7, 0.16, seed), P.sphere(col), R.line, lw);
  if (o.fruit) {
    const F = rng(seed + 9);
    for (let i = 0; i < 4; i++) b += circle(x + F.range(-rx * 0.6, rx * 0.6), cy + F.range(-ry * 0.3, ry * 0.6), 3.4 * s, o.fruit, ramp(o.fruit).line, lw * 0.5);
  }
  if (o.blossom) {
    const F = rng(seed + 5);
    for (let i = 0; i < 5; i++) b += circle(x + F.range(-rx * 0.65, rx * 0.65), cy + F.range(-ry * 0.5, ry * 0.55), 2.6 * s, o.blossom, null);
  }
  b += gloss(x - rx * 0.35, cy - ry * 0.4, rx * 0.32, ry * 0.18, 0.4);
  return b;
}

/** Cây thông tròn trịa (3 tầng). */
export function pine(P, x, y, s = 1, o = {}) {
  const col = o.color || PAL.leafDark, R = ramp(col), lw = o.lw ?? 2.4 * Math.sqrt(s);
  let b = o.noShadow ? '' : groundShadow(x + 4 * s, y, 16 * s, 5.5 * s);
  b += rect(x - 3 * s, y - 12 * s, 6 * s, 13 * s, 2 * s, PAL.woodDark, ramp(PAL.woodDark).line, lw * 0.7);
  const tiers = [[y - 8 * s, 19, 22], [y - 24 * s, 15, 20], [y - 38 * s, 10.5, 18]];
  for (const [ty, w, h] of tiers) {
    const W = w * s, H = h * s;
    const d = `M${r2(x - W)},${r2(ty)} Q${r2(x - W * 0.55)},${r2(ty - H * 0.45)} ${r2(x - 2 * s)},${r2(ty - H)} Q${r2(x)},${r2(ty - H - 2.5 * s)} ${r2(x + 2 * s)},${r2(ty - H)} Q${r2(x + W * 0.55)},${r2(ty - H * 0.45)} ${r2(x + W)},${r2(ty)} Q${r2(x)},${r2(ty + 5 * s)} ${r2(x - W)},${r2(ty)}Z`;
    b += shape(d, P.vgrad(col), R.line, lw);
  }
  if (o.snow) b += shape(`M${r2(x - 5 * s)},${r2(y - 50 * s)} Q${r2(x)},${r2(y - 60 * s)} ${r2(x + 5 * s)},${r2(y - 50 * s)} Q${r2(x)},${r2(y - 47 * s)} ${r2(x - 5 * s)},${r2(y - 50 * s)}Z`, PAL.white, null, 0);
  b += gloss(x - 6 * s, y - 40 * s, 3.5 * s, 7 * s, 0.35, 20);
  return b;
}

/** Cây cọ. */
export function palm(P, x, y, s = 1, o = {}) {
  const lw = o.lw ?? 2.2 * Math.sqrt(s), L = ramp(PAL.leaf), T = ramp(PAL.woodLight), lean = o.lean ?? 1;
  let b = groundShadow(x + 10 * s * lean, y, 18 * s, 5 * s);
  const tx = x + 10 * s * lean, ty = y - 54 * s;
  b += shape(`M${r2(x - 4 * s)},${r2(y)} Q${r2(x + 2 * s * lean)},${r2(y - 30 * s)} ${r2(tx - 3 * s)},${r2(ty)} L${r2(tx + 3 * s)},${r2(ty + 1 * s)} Q${r2(x + 8 * s * lean)},${r2(y - 30 * s)} ${r2(x + 4 * s)},${r2(y)}Z`, P.vgrad(PAL.woodLight), T.line, lw * 0.8);
  for (const [a, l] of [[-160, 30], [-120, 26], [-60, 26], [-20, 30], [-90, 20], [150, 22], [30, 22]]) {
    const rad = a * Math.PI / 180, ex = tx + Math.cos(rad) * l * s, ey = ty + Math.sin(rad) * l * s * 0.7 + 8 * s;
    const mx = tx + Math.cos(rad) * l * s * 0.5, my = ty + Math.sin(rad) * l * s * 0.5 - 8 * s;
    const nx = -Math.sin(rad) * 5 * s, ny = Math.cos(rad) * 5 * s;
    b += shape(`M${r2(tx)},${r2(ty)} Q${r2(mx + nx)},${r2(my + ny)} ${r2(ex)},${r2(ey)} Q${r2(mx - nx)},${r2(my - ny)} ${r2(tx)},${r2(ty)}Z`, P.vgrad(PAL.leaf), L.line, lw * 0.8);
  }
  b += circle(tx - 2 * s, ty + 3 * s, 3 * s, PAL.soil, ramp(PAL.soil).line, lw * 0.5) + circle(tx + 3 * s, ty + 4 * s, 3 * s, PAL.soil, ramp(PAL.soil).line, lw * 0.5);
  return b;
}

export function bush(P, x, y, s = 1, o = {}) {
  const col = o.color || PAL.grassDark, R = ramp(col), lw = o.lw ?? 2 * Math.sqrt(s);
  let b = groundShadow(x + 3 * s, y, 15 * s, 4.5 * s);
  b += shape(puffPath(x, y - 9 * s, 15 * s, 10 * s, 6, 0.2, o.seed || 3), P.sphere(col), R.line, lw);
  if (o.flower) for (let i = -1; i <= 1; i++) b += circle(x + i * 7 * s, y - 11 * s + Math.abs(i) * 3 * s, 2.4 * s, o.flower, null);
  b += gloss(x - 6 * s, y - 14 * s, 5 * s, 2.5 * s, 0.35);
  return b;
}

export function rock(P, x, y, s = 1, o = {}) {
  const col = o.color || PAL.stone, R = ramp(col), lw = o.lw ?? 2 * Math.sqrt(s);
  let b = groundShadow(x + 3 * s, y, 14 * s, 4.5 * s);
  b += shape(blob(x, y - 7 * s, 13 * s, 9 * s, 7, 0.14, o.seed || 2), P.vgrad(col), R.line, lw);
  b += gloss(x - 4 * s, y - 11 * s, 4 * s, 2 * s, 0.4);
  return b;
}

export function flower(P, x, y, s = 1, col = PAL.pink) {
  let b = stroke(`M${r2(x)},${r2(y)} L${r2(x)},${r2(y - 6 * s)}`, PAL.grassDeep, 1.2 * s);
  for (let i = 0; i < 5; i++) { const a = i / 5 * TAU; b += circle(x + Math.cos(a) * 2.6 * s, y - 8 * s + Math.sin(a) * 2.6 * s, 2.1 * s, col, null); }
  return b + circle(x, y - 8 * s, 1.5 * s, PAL.yellow, null);
}

/** Nấm. cap = màu mũ */
export function mushroom(P, x, y, s = 1, o = {}) {
  const cap = o.cap || PAL.coral, C = ramp(cap), lw = o.lw ?? 2.2 * Math.sqrt(s), W = 16 * s, H = 13 * s;
  let b = o.glow ? ellipse(x, y - 18 * s, 34 * s, 28 * s, P.glow(o.glow, 0.55), null) : '';
  b += groundShadow(x + 3 * s, y, 13 * s, 4 * s);
  b += shape(`M${r2(x - 6 * s)},${r2(y)} Q${r2(x - 7 * s)},${r2(y - 9 * s)} ${r2(x - 5 * s)},${r2(y - 15 * s)} L${r2(x + 5 * s)},${r2(y - 15 * s)} Q${r2(x + 7 * s)},${r2(y - 9 * s)} ${r2(x + 6 * s)},${r2(y)} Q${r2(x)},${r2(y + 2 * s)} ${r2(x - 6 * s)},${r2(y)}Z`, P.vgrad(PAL.cream), ramp(PAL.cream).line, lw * 0.8);
  const ty = y - 14 * s;
  b += shape(`M${r2(x - W)},${r2(ty)} Q${r2(x - W)},${r2(ty - H * 1.5)} ${r2(x)},${r2(ty - H * 1.5)} Q${r2(x + W)},${r2(ty - H * 1.5)} ${r2(x + W)},${r2(ty)} Q${r2(x)},${r2(ty + 5 * s)} ${r2(x - W)},${r2(ty)}Z`, P.sphere(cap), C.line, lw);
  b += circle(x - 7 * s, ty - 8 * s, 2.6 * s, PAL.white, null) + circle(x + 4 * s, ty - 12 * s, 2.2 * s, PAL.white, null) + circle(x + 9 * s, ty - 4 * s, 1.8 * s, PAL.white, null);
  b += gloss(x - 7 * s, ty - 14 * s, 4.5 * s, 2.2 * s, 0.45);
  return b;
}

/** Nhà nhỏ nhìn chính diện, thấy mái. (x,y)=giữa đế. w ~ 40*s */
export function house(P, x, y, s = 1, o = {}) {
  const wall = o.wall || PAL.cream, roof = o.roof || PAL.coral, W = ramp(wall), Rf = ramp(roof);
  const lw = o.lw ?? 2.4 * Math.sqrt(s), w = (o.w || 36) * s, h = (o.h || 26) * s, rh = (o.rh || 22) * s;
  const x0 = x - w / 2, y0 = y - h;
  let b = groundShadow(x + 5 * s, y, w * 0.62, 6 * s);
  b += rect(x0, y0, w, h, 3 * s, P.vgrad(wall), W.line, lw);
  // cửa
  b += shape(`M${r2(x - 5 * s)},${r2(y)} L${r2(x - 5 * s)},${r2(y - 10 * s)} Q${r2(x)},${r2(y - 16 * s)} ${r2(x + 5 * s)},${r2(y - 10 * s)} L${r2(x + 5 * s)},${r2(y)}Z`, P.vgrad(o.door || PAL.wood), ramp(o.door || PAL.wood).line, lw * 0.7);
  // cửa sổ
  const wc = o.lit ? PAL.yellowLight : PAL.skyLight;
  for (const sx of [-1, 1]) b += rect(x + sx * w * 0.3 - 4 * s, y0 + h * 0.28, 8 * s, 7 * s, 2 * s, wc, W.line, lw * 0.6);
  // mái
  const ov = 5 * s;
  if (o.roofStyle === 'round') {
    b += shape(`M${r2(x0 - ov)},${r2(y0 + 2 * s)} Q${r2(x0 - ov)},${r2(y0 - rh * 1.2)} ${r2(x)},${r2(y0 - rh * 1.25)} Q${r2(x0 + w + ov)},${r2(y0 - rh * 1.2)} ${r2(x0 + w + ov)},${r2(y0 + 2 * s)} Q${r2(x)},${r2(y0 + 7 * s)} ${r2(x0 - ov)},${r2(y0 + 2 * s)}Z`, P.sphere(roof), Rf.line, lw);
  } else if (o.roofStyle === 'flat') {
    b += rect(x0 - ov, y0 - rh * 0.45, w + ov * 2, rh * 0.55, 4 * s, P.vgrad(roof), Rf.line, lw);
  } else {
    b += shape(`M${r2(x0 - ov)},${r2(y0 + 2 * s)} L${r2(x - 3 * s)},${r2(y0 - rh)} Q${r2(x)},${r2(y0 - rh - 3 * s)} ${r2(x + 3 * s)},${r2(y0 - rh)} L${r2(x0 + w + ov)},${r2(y0 + 2 * s)} Q${r2(x)},${r2(y0 + 6 * s)} ${r2(x0 - ov)},${r2(y0 + 2 * s)}Z`, P.vgrad(roof), Rf.line, lw);
    b += stroke(`M${r2(x - 3 * s)},${r2(y0 - rh + 3 * s)} L${r2(x0 + 2 * s)},${r2(y0)}`, alpha('#ffffff', 0.45), lw * 0.9);
  }
  if (o.chimney) b += rect(x + w * 0.22, y0 - rh * 0.85, 6 * s, 10 * s, 1.5 * s, PAL.stoneDark, ramp(PAL.stoneDark).line, lw * 0.6);
  return b;
}

export function fence(P, x1, y1, x2, y2, s = 1, col = PAL.woodLight) {
  const n = Math.max(2, Math.round(Math.hypot(x2 - x1, y2 - y1) / (10 * s))), C = ramp(col);
  let b = stroke(`M${r2(x1)},${r2(y1 - 6 * s)} L${r2(x2)},${r2(y2 - 6 * s)}`, C.line, 3.4 * s) + stroke(`M${r2(x1)},${r2(y1 - 6 * s)} L${r2(x2)},${r2(y2 - 6 * s)}`, col, 1.8 * s);
  for (let i = 0; i <= n; i++) {
    const t = i / n, x = x1 + (x2 - x1) * t, y = y1 + (y2 - y1) * t;
    b += rect(x - 1.6 * s, y - 10 * s, 3.2 * s, 11 * s, 1.2 * s, col, C.line, 1 * s);
  }
  return b;
}

/** Núi tròn hiền: (x,y) = giữa chân núi. */
export function mountain(P, x, y, w, h, o = {}) {
  const col = o.color || PAL.peach, lw = o.lw ?? 4, seed = o.seed || 1;
  const R0 = ramp(col), R = { hi: lighten(col, 0.4), lo: mix(col, PAL.purple, 0.32), line: mix(R0.line, PAL.purple, 0.55) };
  const F = rng(seed);
  const pk = x + (o.skew ?? F.range(-0.08, 0.08)) * w;
  const L = x - w / 2, Rr = x + w / 2, top = y - h;
  const d = `M${r2(L)},${r2(y)} C${r2(L + w * 0.18)},${r2(y - h * 0.45)} ${r2(pk - w * 0.2)},${r2(top)} ${r2(pk)},${r2(top)} C${r2(pk + w * 0.2)},${r2(top)} ${r2(Rr - w * 0.18)},${r2(y - h * 0.45)} ${r2(Rr)},${r2(y)} Q${r2(x)},${r2(y + h * 0.06)} ${r2(L)},${r2(y)}Z`;
  let b = o.noShadow ? '' : groundShadow(x + w * 0.06, y, w * 0.55, h * 0.09);
  b += shape(d, P.lin('mt' + col, [[0, R.hi], [0.45, col], [1, mix(col, PAL.lavender, 0.45)]], 0.1, 0, 0.6, 1), R.line, lw);
  // mặt khuất bên phải
  const sh = `M${r2(pk)},${r2(top + 2)} C${r2(pk + w * 0.2)},${r2(top)} ${r2(Rr - w * 0.18)},${r2(y - h * 0.45)} ${r2(Rr - lw)},${r2(y - lw * 0.3)} Q${r2(x + w * 0.2)},${r2(y + h * 0.02)} ${r2(pk + w * 0.12)},${r2(y)} C${r2(pk + w * 0.2)},${r2(y - h * 0.4)} ${r2(pk + w * 0.02)},${r2(top + h * 0.4)} ${r2(pk)},${r2(top + 2)}Z`;
  b += `<path d="${sh}" fill="${R.lo}" opacity="0.45"/>`;
  // vân sườn núi + đá nhỏ
  for (let i = 0; i < 3; i++) {
    const t = 0.35 + i * 0.18, yy = top + h * t, xx = pk - w * (0.08 + t * 0.22);
    b += stroke(`M${r2(xx)},${r2(yy)} Q${r2(xx + w * 0.05)},${r2(yy + h * 0.05)} ${r2(xx + w * 0.02)},${r2(yy + h * 0.14)}`, alpha(R.lo, 0.8), lw * 0.7);
  }
  if (o.boulders !== false) for (const [dx, r] of [[-0.3, 0.035], [0.34, 0.03]]) b += shape(blob(x + dx * w, y - w * r * 0.6, w * r * 1.3, w * r, 7, 0.1, seed + dx * 10), R.hi, R.line, lw * 0.6);
  if (o.snow !== false) {
    const sw = w * 0.17, sy = top + h * 0.26;
    const sd = `M${r2(pk - sw * 1.05)},${r2(sy)} C${r2(pk - sw * 0.7)},${r2(top + h * 0.06)} ${r2(pk - sw * 0.35)},${r2(top)} ${r2(pk)},${r2(top)} C${r2(pk + sw * 0.35)},${r2(top)} ${r2(pk + sw * 0.7)},${r2(top + h * 0.06)} ${r2(pk + sw * 1.05)},${r2(sy)} Q${r2(pk + sw * 0.6)},${r2(sy + h * 0.07)} ${r2(pk + sw * 0.3)},${r2(sy - h * 0.02)} Q${r2(pk)},${r2(sy + h * 0.09)} ${r2(pk - sw * 0.35)},${r2(sy)} Q${r2(pk - sw * 0.7)},${r2(sy + h * 0.06)} ${r2(pk - sw * 1.05)},${r2(sy)}Z`;
    b += shape(sd, P.v2(PAL.white, PAL.lavenderLight), ramp(PAL.lavenderLight).line, lw * 0.6);
  }
  b += gloss(pk - w * 0.14, top + h * 0.32, w * 0.05, h * 0.16, 0.25, 25);
  return b;
}

/** Đám mây bông (mặt dưới tím nhạt). (x,y)=tâm */
export function cloud(P, x, y, w, o = {}) {
  const h = w * (o.ratio || 0.42), seed = o.seed || 4, lw = o.lw ?? Math.max(2, w / 70);
  const F = rng(seed);
  let parts = '';
  const n = o.n || 5;
  const pts = [];
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1);
    const px = x - w * 0.4 + w * 0.8 * t, r = h * (0.38 + 0.32 * Math.sin(t * Math.PI)) * F.range(0.85, 1.1);
    pts.push([px, y + h * 0.18 - r * 0.55, r]);
  }
  const fill = P.lin('cloud', [[0, '#ffffff'], [0.6, '#fbf8ff'], [1, PAL.lavenderLight]]);
  const line = o.line || mix(PAL.lavender, PAL.purple, 0.25);
  // viền (vẽ dày phía sau), rồi thân
  let back = '', front = '';
  for (const [px, py, r] of pts) { back += circle(px, py, r + lw, line, null); front += circle(px, py, r, fill, null); }
  const baseD = `M${r2(x - w * 0.45)},${r2(y + h * 0.2)} Q${r2(x - w * 0.5)},${r2(y + h * 0.5)} ${r2(x - w * 0.3)},${r2(y + h * 0.5)} L${r2(x + w * 0.3)},${r2(y + h * 0.5)} Q${r2(x + w * 0.5)},${r2(y + h * 0.5)} ${r2(x + w * 0.45)},${r2(y + h * 0.2)}Z`;
  back += shape(baseD, line, line, lw * 2);
  front += `<path d="${baseD}" fill="${PAL.lavenderLight}"/>`;
  parts = (o.shadow ? ellipse(x + w * 0.05, y + h * 1.4, w * 0.45, h * 0.18, PAL.shadowSoft, null) : '') + back + front;
  parts += gloss(pts[1][0] - pts[1][2] * 0.2, pts[1][1] - pts[1][2] * 0.45, pts[1][2] * 0.45, pts[1][2] * 0.2, 0.7, -10);
  return parts;
}

/** Ngôi sao lấp lánh 4 cánh. */
export function sparkle(x, y, r, col = '#ffffff', op = 1) {
  const k = r * 0.28;
  return `<path d="M${r2(x)},${r2(y - r)} Q${r2(x + k)},${r2(y - k)} ${r2(x + r)},${r2(y)} Q${r2(x + k)},${r2(y + k)} ${r2(x)},${r2(y + r)} Q${r2(x - k)},${r2(y + k)} ${r2(x - r)},${r2(y)} Q${r2(x - k)},${r2(y - k)} ${r2(x)},${r2(y - r)}Z" fill="${col}" opacity="${op}"/>`;
}

/** Gợn sóng nhỏ trên biển. */
export function wave(x, y, w, col = PAL.foam, lw = 3, op = 0.85) {
  return stroke(`M${r2(x - w / 2)},${r2(y)} Q${r2(x - w / 4)},${r2(y - w * 0.22)} ${r2(x)},${r2(y)} Q${r2(x + w / 4)},${r2(y - w * 0.22)} ${r2(x + w / 2)},${r2(y)}`, col, lw, `opacity="${op}"`);
}

/** Thuyền buồm nhỏ. (x,y)=mặt nước giữa thân */
export function boat(P, x, y, s = 1, o = {}) {
  const lw = o.lw ?? 2.4 * Math.sqrt(s), hull = o.hull || PAL.coral, sail = o.sail || PAL.white;
  let b = ellipse(x + 2 * s, y + 3 * s, 30 * s, 6 * s, alpha(PAL.oceanDeep, 0.35), null);
  b += stroke(`M${r2(x - 34 * s)},${r2(y + 4 * s)} Q${r2(x - 40 * s)},${r2(y + 1 * s)} ${r2(x - 46 * s)},${r2(y + 4 * s)}`, PAL.foam, 2 * s);
  b += shape(`M${r2(x - 26 * s)},${r2(y - 9 * s)} L${r2(x + 28 * s)},${r2(y - 9 * s)} Q${r2(x + 22 * s)},${r2(y + 4 * s)} ${r2(x + 10 * s)},${r2(y + 4 * s)} L${r2(x - 14 * s)},${r2(y + 4 * s)} Q${r2(x - 22 * s)},${r2(y + 3 * s)} ${r2(x - 26 * s)},${r2(y - 9 * s)}Z`, P.vgrad(hull), ramp(hull).line, lw);
  b += stroke(`M${r2(x - 22 * s)},${r2(y - 4 * s)} L${r2(x + 23 * s)},${r2(y - 4 * s)}`, PAL.white, 2 * s);
  b += rect(x - 1.5 * s, y - 52 * s, 3 * s, 44 * s, 1.5 * s, PAL.woodDark, ramp(PAL.woodDark).line, lw * 0.6);
  b += shape(`M${r2(x + 3 * s)},${r2(y - 50 * s)} Q${r2(x + 24 * s)},${r2(y - 30 * s)} ${r2(x + 24 * s)},${r2(y - 13 * s)} L${r2(x + 3 * s)},${r2(y - 13 * s)}Z`, P.vgrad(sail), ramp(sail).line, lw);
  b += shape(`M${r2(x - 3 * s)},${r2(y - 44 * s)} Q${r2(x - 18 * s)},${r2(y - 28 * s)} ${r2(x - 18 * s)},${r2(y - 13 * s)} L${r2(x - 3 * s)},${r2(y - 13 * s)}Z`, P.vgrad(o.sail2 || PAL.yellow), ramp(o.sail2 || PAL.yellow).line, lw);
  b += shape(`M${r2(x + 1.5 * s)},${r2(y - 52 * s)} L${r2(x + 12 * s)},${r2(y - 49 * s)} L${r2(x + 1.5 * s)},${r2(y - 46 * s)}Z`, o.flag || PAL.rose, ramp(o.flag || PAL.rose).line, lw * 0.5);
  return b;
}

/** Hàng cọc/đá bậc thang nhỏ — dùng cho đường đi băng nước. */
export function stepStones(P, pts, s = 1) {
  let b = '';
  pts.forEach(([x, y], i) => { b += ellipse(x + 2, y + 3, 11 * s, 5 * s, PAL.shadowSoft, null) + shape(blob(x, y, 10 * s, 6 * s, 7, 0.12, i + 3), P.vgrad(PAL.stoneLight), ramp(PAL.stone).line, 2 * s); });
  return b;
}

/** Cầu gỗ nối 2 điểm (nhìn từ trên xuống). width = bề rộng mặt cầu. */
export function bridge(P, x1, y1, x2, y2, width = 30, o = {}) {
  const col = o.color || PAL.woodLight, C = ramp(col), lw = o.lw ?? 2.6;
  const dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy), ux = dx / L, uy = dy / L, nx = -uy, ny = ux;
  const hw = width / 2, arch = o.arch ?? Math.min(18, L * 0.08);
  const q = (k) => [x1 + dx * 0.5 + nx * 0 , y1 + dy * 0.5 - arch * k];
  const [mx, my] = q(1);
  const pa = [x1 + nx * hw, y1 + ny * hw], pb = [x2 + nx * hw, y2 + ny * hw], pc = [x2 - nx * hw, y2 - ny * hw], pd = [x1 - nx * hw, y1 - ny * hw];
  // bóng dưới cầu
  let b = `<path d="M${r2(pa[0])},${r2(pa[1] + 10)} Q${r2(mx + nx * hw)},${r2(my + ny * hw + 10)} ${r2(pb[0])},${r2(pb[1] + 10)} L${r2(pc[0])},${r2(pc[1] + 10)} Q${r2(mx - nx * hw)},${r2(my - ny * hw + 10)} ${r2(pd[0])},${r2(pd[1] + 10)}Z" fill="${PAL.shadow}"/>`;
  b += shape(`M${r2(pa[0])},${r2(pa[1])} Q${r2(mx + nx * hw)},${r2(my + ny * hw)} ${r2(pb[0])},${r2(pb[1])} L${r2(pc[0])},${r2(pc[1])} Q${r2(mx - nx * hw)},${r2(my - ny * hw)} ${r2(pd[0])},${r2(pd[1])}Z`, P.vgrad(col), C.line, lw);
  // ván cầu
  const n = Math.max(3, Math.round(L / 11));
  for (let i = 1; i < n; i++) {
    const t = i / n, a = 4 * t * (1 - t);
    const cx = x1 + dx * t, cy = y1 + dy * t - arch * a;
    b += stroke(`M${r2(cx + nx * hw * 0.92)},${r2(cy + ny * hw * 0.92)} L${r2(cx - nx * hw * 0.92)},${r2(cy - ny * hw * 0.92)}`, C.lo, 1.4);
  }
  // lan can
  for (const sgn of [1, -1]) {
    const e1 = [x1 + nx * hw * sgn, y1 + ny * hw * sgn - 8], e2 = [x2 + nx * hw * sgn, y2 + ny * hw * sgn - 8], m = [mx + nx * hw * sgn, my + ny * hw * sgn - 8];
    b += stroke(`M${r2(e1[0])},${r2(e1[1])} Q${r2(m[0])},${r2(m[1])} ${r2(e2[0])},${r2(e2[1])}`, C.line, 4.4) + stroke(`M${r2(e1[0])},${r2(e1[1])} Q${r2(m[0])},${r2(m[1])} ${r2(e2[0])},${r2(e2[1])}`, PAL.wood, 2.4);
    for (let i = 0; i <= 4; i++) {
      const t = i / 4, a = 4 * t * (1 - t), cx = x1 + dx * t + nx * hw * sgn, cy = y1 + dy * t - arch * a + ny * hw * sgn;
      b += rect(cx - 2, cy - 10, 4, 10, 1.5, PAL.wood, C.line, 1.2);
    }
  }
  return b;
}

export { pt, TAU };

// ───────────────────────── Mảnh kiến trúc cho mốc lớn ─────────────────────────
/** Cửa sổ có song. (x,y)=góc trên-trái */
export function win(x, y, w, h, lw = 2.4, o = {}) {
  const frame = o.frame || PAL.white, F = ramp(o.line || PAL.woodDark);
  const glass = o.lit ? PAL.yellowLight : '#cdeefc';
  let b = rect(x - 2, y - 2, w + 4, h + 4, Math.min(w, h) * 0.3, frame, F.line, lw);
  b += rect(x, y, w, h, Math.min(w, h) * 0.25, glass, null);
  b += stroke(`M${r2(x + w / 2)},${r2(y)} L${r2(x + w / 2)},${r2(y + h)} M${r2(x)},${r2(y + h / 2)} L${r2(x + w)},${r2(y + h / 2)}`, frame, lw * 0.9);
  b += stroke(`M${r2(x + w * 0.15)},${r2(y + h * 0.35)} L${r2(x + w * 0.35)},${r2(y + h * 0.12)}`, '#ffffff', lw * 0.8, 'opacity="0.8"');
  if (o.arch) b = rect(x - 2, y - 2, w + 4, h + 4, w / 2, frame, F.line, lw) + rect(x, y, w, h, w / 2 - 1, glass, null) + stroke(`M${r2(x + w / 2)},${r2(y)} L${r2(x + w / 2)},${r2(y + h)}`, frame, lw * 0.9);
  return b;
}
/** Cửa vòm. (x,y)=giữa chân cửa */
export function door(P, x, y, w, h, col = PAL.wood, lw = 2.4) {
  const C = ramp(col);
  let b = shape(`M${r2(x - w / 2)},${r2(y)} L${r2(x - w / 2)},${r2(y - h + w / 2)} Q${r2(x - w / 2)},${r2(y - h)} ${r2(x)},${r2(y - h)} Q${r2(x + w / 2)},${r2(y - h)} ${r2(x + w / 2)},${r2(y - h + w / 2)} L${r2(x + w / 2)},${r2(y)}Z`, P.vgrad(col), C.line, lw);
  b += stroke(`M${r2(x)},${r2(y - h + 3)} L${r2(x)},${r2(y)}`, C.lo, lw * 0.6) + circle(x + w * 0.28, y - h * 0.42, Math.max(1.5, w * 0.07), PAL.yellow, C.line, lw * 0.4);
  return b;
}
/** Mái hai mái có ngói. (x0,y0)=trái-đáy mái, w=rộng, rh=cao */
export function gableRoof(P, x0, y0, w, rh, col, lw = 3, ov = 8) {
  const C = ramp(col), x = x0 + w / 2;
  const d = `M${r2(x0 - ov)},${r2(y0 + 3)} L${r2(x - 5)},${r2(y0 - rh)} Q${r2(x)},${r2(y0 - rh - 4)} ${r2(x + 5)},${r2(y0 - rh)} L${r2(x0 + w + ov)},${r2(y0 + 3)} Q${r2(x)},${r2(y0 + 9)} ${r2(x0 - ov)},${r2(y0 + 3)}Z`;
  let b = shape(d, P.vgrad(col), C.line, lw);
  const n = Math.max(2, Math.round(rh / 12));
  for (let i = 1; i < n; i++) {
    const t = i / n, yy = y0 - rh + rh * t, hw = (w / 2 + ov) * t;
    b += stroke(`M${r2(x - hw + 4)},${r2(yy + 1)} Q${r2(x)},${r2(yy + 4)} ${r2(x + hw - 4)},${r2(yy + 1)}`, C.lo, lw * 0.6, 'opacity="0.8"');
  }
  b += stroke(`M${r2(x - 4)},${r2(y0 - rh + 4)} L${r2(x0 - ov + 8)},${r2(y0)}`, '#ffffff', lw * 1.1, 'opacity="0.45"');
  return b;
}
/** Dây cờ đuôi nheo */
export function bunting(x1, y1, x2, y2, sag = 14, cols = [PAL.coral, PAL.yellow, '#58b4e8', PAL.mint, PAL.pink], lw = 1.6) {
  const mx = (x1 + x2) / 2, my = (y1 + y2) / 2 + sag;
  let b = stroke(`M${r2(x1)},${r2(y1)} Q${r2(mx)},${r2(my + sag)} ${r2(x2)},${r2(y2)}`, PAL.woodDark, lw);
  const n = Math.max(3, Math.round(Math.hypot(x2 - x1, y2 - y1) / 14));
  for (let i = 1; i < n; i++) {
    const t = i / n, x = (1 - t) ** 2 * x1 + 2 * t * (1 - t) * mx + t * t * x2, y = (1 - t) ** 2 * y1 + 2 * t * (1 - t) * (my + sag) + t * t * y2;
    const c = cols[i % cols.length];
    b += shape(`M${r2(x - 5)},${r2(y)} L${r2(x + 5)},${r2(y)} L${r2(x)},${r2(y + 10)}Z`, c, ramp(c).line, lw * 0.6);
  }
  return b;
}
/** Đèn lồng phát sáng treo */
export function lantern(P, x, y, c = PAL.yellow, s = 1) {
  return circle(x, y, 22 * s, P.glow(PAL.yellowLight, 0.75), null) + stroke(`M${r2(x)},${r2(y - 12 * s)} L${r2(x)},${r2(y - 7 * s)}`, PAL.woodDark, 1.6 * s) +
    ellipse(x, y, 6 * s, 7.5 * s, P.sphere(c), ramp(c).line, 1.8 * s) + rect(x - 3.5 * s, y - 9 * s, 7 * s, 3 * s, 1, PAL.woodDark, null) + circle(x - 2 * s, y - 2 * s, 1.8 * s, '#ffffff', null, 0, 'opacity="0.8"');
}
/** Bóng nước nhỏ / mây sương */
export function mist(P, x, y, r, op = 0.8) {
  return circle(x, y, r, P.glow('#ffffff', op), null);
}
