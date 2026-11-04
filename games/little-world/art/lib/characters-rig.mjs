// ── Little World: công cụ dựng hình nhân vật dùng chung (bé + thú cưng) ──
// - Phép chiếu "giả 3D": mỗi nhân vật có toạ độ cục bộ X (trái/phải), Y (lên), Z (phía trước);
//   góc quay yaw (độ) xoay quanh trục đứng: 0 = nhìn thẳng (xuống), 90 = quay sang PHẢI,
//   180 = quay lưng (lên). Nhờ vậy mặt/tóc/tai ở mọi góc nhìn đều nhất quán.
// - limbPath: tay/chân/đuôi dạng "ống" bo tròn, có độ dày thay đổi.
// - Mắt, miệng, má hồng dùng chung một phong cách.
// - Ghép lớp có mặt nạ (mask): một phần thuộc lớp DƯỚI nhưng ở PHÍA TRƯỚC (ví dụ bàn tay
//   đặt trước áo) sẽ khoét lỗ trên các lớp trên, để khi chồng sprite trong Phaser vẫn đúng chiều sâu.
import { PAL, smoothPath, r2, mix, ramp } from './style.mjs';

export const rad = (d) => (d * Math.PI) / 180;
export const lerp = (a, b, t) => a + (b - a) * t;
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const TAU = Math.PI * 2;
export const ease = (t) => 0.5 - 0.5 * Math.cos(Math.PI * clamp(t, 0, 1));

// ───────────── vector 3D nhỏ ─────────────
export const v3 = {
  add: (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]],
  sub: (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]],
  mul: (a, k) => [a[0] * k, a[1] * k, a[2] * k],
};
/** Xoay vector quanh trục X (vung trước/sau). f>0: hướng -Y quay về +Z (ra phía trước). */
export function rotX([x, y, z], fdeg) {
  const f = rad(fdeg), c = Math.cos(f), s = Math.sin(f);
  return [x, y * c + z * s, -y * s + z * c];
}
/** Xoay quanh trục Z (dang tay sang ngang). side=+1 → về phía +X. */
export function rotZ([x, y, z], odeg, side = 1) {
  const o = rad(odeg) * side, c = Math.cos(o), s = Math.sin(o);
  return [x * c - y * s, x * s + y * c, z];
}
/** Hướng của một đoạn tay/chân: thẳng xuống, dang `out`, vung `fwd`. */
export function limbDir(out, fwd, side) {
  return rotX(rotZ([0, -1, 0], out, side), fwd);
}

// ───────────── chiếu ─────────────
/** Tạo hàm chiếu cho một khung: cx, gy = điểm đế; yaw độ; k = độ "chếch" (gần → thấp hơn). */
export function projector(cx, gy, yawDeg, k = 0.15) {
  const c = Math.cos(rad(yawDeg)), s = Math.sin(rad(yawDeg));
  const P = ([X, Y, Z]) => {
    const d = -X * s + Z * c;
    return [cx + X * c + Z * s, gy - Y + d * k, d];
  };
  P.c = c; P.s = s; P.yaw = yawDeg; P.k = k;
  return P;
}

// ───────────── hình ống (tay, chân, đuôi) ─────────────
export function limbOutline(pts, radii, cap = 4) {
  const n = pts.length;
  const dirs = [];
  for (let i = 0; i < n - 1; i++) {
    const dx = pts[i + 1][0] - pts[i][0], dy = pts[i + 1][1] - pts[i][1], l = Math.hypot(dx, dy);
    dirs.push(l < 1e-3 ? null : [dx / l, dy / l]);
  }
  for (let i = 0; i < dirs.length; i++) if (!dirs[i]) dirs[i] = dirs[i - 1] || dirs.find(Boolean) || [0, 1];
  if (!dirs.length) dirs.push([0, 1]);
  const tang = pts.map((_, i) => {
    const a = dirs[Math.max(0, i - 1)], b = dirs[Math.min(dirs.length - 1, i)];
    const tx = a[0] + b[0], ty = a[1] + b[1], l = Math.hypot(tx, ty);
    return l < 1e-3 ? b : [tx / l, ty / l];
  });
  const L = [], R = [];
  pts.forEach((p, i) => {
    const [tx, ty] = tang[i], nx = -ty, ny = tx;
    L.push([p[0] + nx * radii[i], p[1] + ny * radii[i]]);
    R.push([p[0] - nx * radii[i], p[1] - ny * radii[i]]);
  });
  const out = [...L];
  const pe = pts[n - 1], te = tang[n - 1], re = radii[n - 1], an = Math.atan2(te[0], -te[1]);
  for (let k = 1; k < cap; k++) { const a = an - (Math.PI * k) / cap; out.push([pe[0] + Math.cos(a) * re, pe[1] + Math.sin(a) * re]); }
  for (let i = n - 1; i >= 0; i--) out.push(R[i]);
  const p0 = pts[0], t0 = tang[0], r0 = radii[0], a0 = Math.atan2(t0[0], -t0[1]) + Math.PI;
  for (let k = 1; k < cap; k++) { const a = a0 - (Math.PI * k) / cap; out.push([p0[0] + Math.cos(a) * r0, p0[1] + Math.sin(a) * r0]); }
  return out;
}
export const limbPath = (pts, radii, cap) => smoothPath(limbOutline(pts, radii, cap), true);

/** Elip xoay (path) — dùng khi cần silhouette làm mặt nạ. */
export function ellipsePath(cx, cy, rx, ry, rot = 0) {
  const k = 0.5523, c = Math.cos(rad(rot)), s = Math.sin(rad(rot));
  const T = (x, y) => `${r2(cx + x * c - y * s)},${r2(cy + x * s + y * c)}`;
  return `M${T(rx, 0)} C${T(rx, ry * k)} ${T(rx * k, ry)} ${T(0, ry)} C${T(-rx * k, ry)} ${T(-rx, ry * k)} ${T(-rx, 0)} C${T(-rx, -ry * k)} ${T(-rx * k, -ry)} ${T(0, -ry)} C${T(rx * k, -ry)} ${T(rx, -ry * k)} ${T(rx, 0)}Z`;
}
export const circlePath = (cx, cy, r) => ellipsePath(cx, cy, r, r);

/** Đường cong mượt qua điểm (mở). */
export const curve = (pts) => smoothPath(pts, false);

// ───────────── vẽ ─────────────
export const path = (d, fill, line, w, extra = '') =>
  `<path d="${d}" fill="${fill}"${line ? ` stroke="${line}" stroke-width="${r2(w)}" stroke-linejoin="round" stroke-linecap="round"` : ''} ${extra}/>`;
export const line = (d, color, w, extra = '') =>
  `<path d="${d}" fill="none" stroke="${color}" stroke-width="${r2(w)}" stroke-linejoin="round" stroke-linecap="round" ${extra}/>`;
/** Nhiều mảnh ghép thành một khối: viền ngoài chung, không lộ đường nối bên trong. */
export function union(ds, fill, lineColor, w) {
  return ds.map((d) => `<path d="${d}" fill="${lineColor}" stroke="${lineColor}" stroke-width="${r2(w * 2)}" stroke-linejoin="round"/>`).join('')
    + ds.map((d) => `<path d="${d}" fill="${fill}"/>`).join('');
}
export const T = (x, y, rot = 0, sx = 1, sy = sx) => `translate(${r2(x)} ${r2(y)})${rot ? ` rotate(${r2(rot)})` : ''}${sx !== 1 || sy !== 1 ? ` scale(${r2(sx)} ${r2(sy)})` : ''}`;

/** Ngôi sao 5 cánh bo tròn. */
export function starPath(cx, cy, R, r = R * 0.5, rot = -90) {
  const pts = [];
  for (let i = 0; i < 10; i++) { const a = rad(rot + i * 36), rr = i % 2 ? r : R; pts.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]); }
  return smoothPath(pts, true, 0.35);
}
export function heartPath(cx, cy, s) {
  return `M${r2(cx)},${r2(cy + s * 0.9)} C${r2(cx - s * 1.3)},${r2(cy + s * 0.1)} ${r2(cx - s * 0.9)},${r2(cy - s * 0.9)} ${r2(cx)},${r2(cy - s * 0.35)} C${r2(cx + s * 0.9)},${r2(cy - s * 0.9)} ${r2(cx + s * 1.3)},${r2(cy + s * 0.1)} ${r2(cx)},${r2(cy + s * 0.9)}Z`;
}

// ───────────── mắt & miệng ─────────────
/**
 * Mắt kiểu "đá quý": tròng mực, ánh tím/màu ở đáy, 2 chấm sáng trắng.
 * o: { x, y, rx, ry, sq (nén ngang 0..1), state:'open'|'blink'|'happy'|'sparkle'|'wink', look:[dx,dy], glow, ink }
 */
export function eye(doc, o) {
  const ink = o.ink || PAL.ink;
  const sq = o.sq ?? 1;
  const rx = o.rx * sq, ry = o.ry;
  const lw = o.lw || 1.9;
  const st = o.state || 'open';
  if (st === 'blink' || st === 'closed') {
    return line(`M${r2(o.x - rx * 1.05)},${r2(o.y + ry * 0.05)} Q${r2(o.x)},${r2(o.y + ry * 0.55)} ${r2(o.x + rx * 1.05)},${r2(o.y + ry * 0.05)}`, ink, lw);
  }
  if (st === 'happy') {
    return line(`M${r2(o.x - rx * 1.1)},${r2(o.y + ry * 0.35)} Q${r2(o.x)},${r2(o.y - ry * 0.75)} ${r2(o.x + rx * 1.1)},${r2(o.y + ry * 0.35)}`, ink, lw * 1.1);
  }
  const [lx, ly] = o.look || [0, 0];
  const x = o.x + lx * rx * 0.18, y = o.y + ly * ry * 0.12;
  const glow = o.glow || '#8a70c8';
  if (!doc._eyeGrad) doc._eyeGrad = {};
  if (!doc._eyeGrad[glow]) doc._eyeGrad[glow] = doc.linear([[0, ink], [0.5, ink], [1, glow]], 0, 0, 0, 1);
  let s = `<ellipse cx="${r2(x)}" cy="${r2(y)}" rx="${r2(rx)}" ry="${r2(ry)}" fill="${doc._eyeGrad[glow]}"/>`;
  // chấm sáng (dịch theo hướng nhìn)
  const cx1 = x - rx * 0.28 + lx * rx * 0.22, cy1 = y - ry * 0.36 + ly * ry * 0.2;
  s += `<ellipse cx="${r2(cx1)}" cy="${r2(cy1)}" rx="${r2(Math.max(0.6, rx * 0.46))}" ry="${r2(ry * 0.34)}" fill="#ffffff"/>`;
  s += `<circle cx="${r2(x + rx * 0.36 + lx * rx * 0.15)}" cy="${r2(y + ry * 0.4 + ly * ry * 0.1)}" r="${r2(Math.max(0.45, rx * 0.2))}" fill="#ffffff" opacity="0.9"/>`;
  if (st === 'sparkle') s += `<path d="${starPath(x + rx * 0.25, y + ry * 0.15, rx * 0.42, rx * 0.16)}" fill="#ffffff" opacity="0.95"/>`;
  return s;
}

/** Miệng. kind: smile|open|grin|o|hmm|cat|flat|tiny */
export function mouth(o) {
  const { x, y } = o, s = o.s || 1, sq = o.sq ?? 1, ink = o.ink || PAL.ink;
  const W = (v) => r2(x + v * s * sq), H = (v) => r2(y + v * s);
  const lw = (o.lw || 1.7) * Math.min(1, s);
  const dark = '#9b4d6e', tongue = '#ff9fae';
  switch (o.kind) {
    case 'open': return `<path d="M${W(-3.1)},${H(-0.6)} Q${W(0)},${H(0.1)} ${W(3.1)},${H(-0.6)} Q${W(2.6)},${H(3.9)} ${W(0)},${H(4.1)} Q${W(-2.6)},${H(3.9)} ${W(-3.1)},${H(-0.6)}Z" fill="${dark}" stroke="${ink}" stroke-width="${r2(lw * 0.85)}" stroke-linejoin="round"/>`
      + `<path d="M${W(-1.7)},${H(2.9)} Q${W(0)},${H(1.6)} ${W(1.7)},${H(2.9)} Q${W(0)},${H(4)} ${W(-1.7)},${H(2.9)}Z" fill="${tongue}"/>`;
    case 'grin': return `<path d="M${W(-4.2)},${H(-1)} Q${W(0)},${H(0.2)} ${W(4.2)},${H(-1)} Q${W(3.6)},${H(5)} ${W(0)},${H(5.3)} Q${W(-3.6)},${H(5)} ${W(-4.2)},${H(-1)}Z" fill="${dark}" stroke="${ink}" stroke-width="${r2(lw * 0.85)}" stroke-linejoin="round"/>`
      + `<path d="M${W(-2.4)},${H(3.6)} Q${W(0)},${H(2)} ${W(2.4)},${H(3.6)} Q${W(0)},${H(5.2)} ${W(-2.4)},${H(3.6)}Z" fill="${tongue}"/>`
      + `<path d="M${W(-3.2)},${H(-0.6)} Q${W(0)},${H(0.3)} ${W(3.2)},${H(-0.6)} L${W(2.9)},${H(0.6)} Q${W(0)},${H(1.2)} ${W(-2.9)},${H(0.6)}Z" fill="#ffffff" opacity="0.9"/>`;
    case 'o': return `<ellipse cx="${W(0)}" cy="${H(0.9)}" rx="${r2(1.5 * s * sq)}" ry="${r2(1.8 * s)}" fill="${dark}" stroke="${ink}" stroke-width="${r2(lw * 0.8)}"/>`;
    case 'hmm': return line(`M${W(-2.2)},${H(0.6)} Q${W(-0.8)},${H(-0.4)} ${W(0.3)},${H(0.5)} T${W(2.4)},${H(0.2)}`, ink, lw);
    case 'flat': return line(`M${W(-1.8)},${H(0.5)} L${W(1.8)},${H(0.5)}`, ink, lw);
    case 'cat': return line(`M${W(-2.8)},${H(-0.3)} Q${W(-1.4)},${H(1.8)} ${W(0)},${H(0)} Q${W(1.4)},${H(1.8)} ${W(2.8)},${H(-0.3)}`, ink, lw);
    case 'catopen': return `<path d="M${W(-2.2)},${H(0.4)} Q${W(0)},${H(-0.2)} ${W(2.2)},${H(0.4)} Q${W(1.8)},${H(3.6)} ${W(0)},${H(3.7)} Q${W(-1.8)},${H(3.6)} ${W(-2.2)},${H(0.4)}Z" fill="${dark}" stroke="${ink}" stroke-width="${r2(lw * 0.8)}" stroke-linejoin="round"/>`
      + `<ellipse cx="${W(0)}" cy="${H(2.7)}" rx="${r2(1.2 * s * sq)}" ry="${r2(0.8 * s)}" fill="${tongue}"/>`
      + line(`M${W(-2.8)},${H(-0.4)} Q${W(-1.4)},${H(1.2)} ${W(0)},${H(-0.1)} Q${W(1.4)},${H(1.2)} ${W(2.8)},${H(-0.4)}`, ink, lw);
    case 'tiny': return line(`M${W(-1.4)},${H(0)} Q${W(0)},${H(1.3)} ${W(1.4)},${H(0)}`, ink, lw);
    default: return line(`M${W(-2.7)},${H(-0.2)} Q${W(0)},${H(2.3)} ${W(2.7)},${H(-0.2)}`, ink, lw);
  }
}

export function blush(cx, cy, rx, ry, op = 0.6, color = PAL.pink) {
  return `<ellipse cx="${r2(cx)}" cy="${r2(cy)}" rx="${r2(rx)}" ry="${r2(ry)}" fill="${color}" opacity="${op}"/>`
    + `<ellipse cx="${r2(cx - rx * 0.3)}" cy="${r2(cy - ry * 0.3)}" rx="${r2(rx * 0.28)}" ry="${r2(ry * 0.22)}" fill="#ffffff" opacity="${op * 0.7}"/>`;
}

// ───────────── tint (nhân màu, giống Phaser setTint) ─────────────
export function tintFilter(doc, hex, box = [-20, -20, 140, 140]) {
  if (!doc._tint) doc._tint = {};
  const key = hex + box.join(',');
  if (doc._tint[key]) return doc._tint[key];
  const h = hex.replace('#', '');
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
  const id = doc.id('tf');
  doc.add(`<filter id="${id}" filterUnits="userSpaceOnUse" x="${box[0]}" y="${box[1]}" width="${box[2]}" height="${box[3]}" color-interpolation-filters="sRGB"><feColorMatrix type="matrix" values="${r2(r * 1000) / 1000} 0 0 0 0 0 ${r2(g * 1000) / 1000} 0 0 0 0 0 ${r2(b * 1000) / 1000} 0 0 0 0 0 1 0"/></filter>`);
  return (doc._tint[key] = `url(#${id})`);
}

// ───────────── ghép phần theo chiều sâu, có mặt nạ ─────────────
/**
 * parts: [{ z, svg, tf? }]; holes: [{ z, sil, tf?, w? }] (silhouette các phần thuộc lớp DƯỚI).
 * Mỗi phần p bị khoét bởi mọi hole q có q.z > p.z.
 */
export function layerParts(doc, parts, holes = [], box = [-20, -20, 140, 140]) {
  const sorted = [...parts].sort((a, b) => a.z - b.z);
  let out = '', curKey = null, buf = '', curHoles = [];
  const flush = () => {
    if (!buf) return;
    if (curHoles.length) {
      const id = doc.id('mk');
      doc.add(`<mask id="${id}" maskUnits="userSpaceOnUse" x="${box[0]}" y="${box[1]}" width="${box[2]}" height="${box[3]}"><rect x="${box[0]}" y="${box[1]}" width="${box[2]}" height="${box[3]}" fill="#fff"/>${curHoles.map((q) => `<path d="${q.sil}" fill="#000" stroke="#000" stroke-width="${r2(q.w ?? 1.6)}" stroke-linejoin="round"${q.tf ? ` transform="${q.tf}"` : ''}/>`).join('')}</mask>`);
      out += `<g mask="url(#${id})">${buf}</g>`;
    } else out += buf;
    buf = '';
  };
  for (const p of sorted) {
    const hs = p.noMask ? [] : holes.filter((q) => q.sil && q.z > p.z);
    const key = hs.map((q) => holes.indexOf(q)).join(',');
    if (key !== curKey) { flush(); curKey = key; curHoles = hs; }
    buf += p.tf ? `<g transform="${p.tf}">${p.svg}</g>` : p.svg;
  }
  flush();
  return out;
}

export { PAL, mix, ramp, r2 };
