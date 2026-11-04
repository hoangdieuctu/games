// ── Little World · Đảo: các "mảnh vẽ" dùng lại (tán lá, hoa, cửa sổ, ván gỗ…) ──
import {
  PAL, LINE, ramp, lighten, darken, mix, alpha, rng, smoothPath, blob, blobPoints, puffPath,
  groundShadow, gloss, shape, stroke, circle, ellipse, rect, r2,
} from './style.mjs';

export { PAL, LINE, ramp, lighten, darken, mix, alpha, rng, smoothPath, blob, blobPoints, puffPath, groundShadow, gloss, shape, stroke, circle, ellipse, rect, r2 };

/** Bóng đế chuẩn: lệch nhẹ sang phải, hai lớp (mềm + đậm ở tâm). */
export function baseShadow(cx, cy, rx, ry = rx * 0.32) {
  return groundShadow(cx + rx * 0.08, cy, rx, ry, 0.7) + groundShadow(cx + rx * 0.05, cy, rx * 0.72, ry * 0.7, 0.75);
}

/**
 * Tán lá dạng nhiều "chùm" bông: viền ngoài đậm, các chùm sáng dần lên trên-trái.
 * Trả về chuỗi SVG.
 */
export function canopy(doc, cx, cy, rx, ry, color, seed = 1, o = {}) {
  const r = ramp(color);
  if (o.line) r.line = o.line;
  const R = rng(seed);
  const bumps = o.bumps || 9;
  const outer = puffPath(cx, cy, rx, ry, bumps, o.depth ?? 0.15, seed);
  const clip = doc.clip(`<path d="${outer}"/>`);
  const lw = o.lw || LINE.lg;
  let s = shape(outer, doc.sphere(color, 0.8), r.line, lw);
  let inner = '';
  // vùng tối phía dưới tán
  inner += `<path d="${puffPath(cx + rx * 0.08, cy + ry * 0.78, rx * 1.05, ry * 0.5, 9, 0.2, seed + 7)}" fill="${r.lo}" opacity="0.75"/>`;
  // chùm lá: từ dưới lên trên, càng lên càng sáng
  const clumps = o.clumps || [
    [-0.5, 0.25, 0.42], [0.42, 0.3, 0.44], [0.0, 0.42, 0.4],
    [-0.38, -0.25, 0.42], [0.3, -0.22, 0.45], [-0.02, -0.5, 0.4],
  ];
  clumps.forEach(([dx, dy, k], i) => {
    const x = cx + dx * rx, y = cy + dy * ry;
    const light = 0.03 + (0.5 - dy) * 0.1 - dx * 0.04;
    const c = lighten(color, Math.max(0, light));
    const p = puffPath(x, y, rx * k, ry * k * 0.92, 7, 0.16, seed * 13 + i);
    inner += `<path d="${p}" fill="${doc.sphere(c, 0.55)}"/>`;
    // đường viền dưới của chùm (tối) để tách khối
    inner += stroke(puffArc(x, y, rx * k, ry * k * 0.92), r.lo, LINE.sm, 'opacity="0.8"');
  });
  // lá nhỏ li ti sáng (điểm nhấn)
  for (let i = 0; i < (o.sparkles ?? 6); i++) {
    const a = R() * Math.PI * 2, d = R() * 0.7;
    const x = cx + Math.cos(a) * rx * d, y = cy + Math.sin(a) * ry * d - ry * 0.1;
    inner += leafMark(x, y, 3 + R() * 2.5, lighten(color, 0.55), R() * 60 - 30);
  }
  s += `<g clip-path="${clip}">${inner}</g>`;
  // viền ngoài vẽ lại cho sạch
  s += shape(outer, 'none', r.line, lw);
  s += gloss(cx - rx * 0.35, cy - ry * 0.5, rx * 0.2, ry * 0.1, 0.38);
  return s;
}

/** Cung dưới (nửa dưới) của một chùm — dùng làm nét tách khối. */
export function puffArc(x, y, rx, ry) {
  return `M${r2(x - rx * 0.92)},${r2(y + ry * 0.2)} Q${r2(x - rx * 0.55)},${r2(y + ry * 1.02)} ${r2(x)},${r2(y + ry * 0.95)} Q${r2(x + rx * 0.6)},${r2(y + ry * 1.02)} ${r2(x + rx * 0.92)},${r2(y + ry * 0.25)}`;
}

/** Dấu lá nhỏ (hình giọt). */
export function leafMark(x, y, s, fill, rot = 0) {
  return `<path d="M${r2(x)},${r2(y - s)} Q${r2(x + s * 0.8)},${r2(y)} ${r2(x)},${r2(y + s)} Q${r2(x - s * 0.8)},${r2(y)} ${r2(x)},${r2(y - s)}Z" fill="${fill}" transform="rotate(${r2(rot)} ${r2(x)} ${r2(y)})"/>`;
}

/** Lá to có gân, xoay theo góc (độ), gốc tại (x,y). */
export function leaf(doc, x, y, len, wid, rot, color, lw = LINE.sm) {
  const r = ramp(color);
  const d = `M0,0 C${r2(wid)},${r2(-len * 0.25)} ${r2(wid * 0.8)},${r2(-len * 0.8)} 0,${r2(-len)} C${r2(-wid * 0.8)},${r2(-len * 0.8)} ${r2(-wid)},${r2(-len * 0.25)} 0,0Z`;
  return `<g transform="translate(${r2(x)},${r2(y)}) rotate(${r2(rot)})">${shape(d, doc.vgrad(color), r.line, lw)}${stroke(`M0,-2 L0,${r2(-len * 0.8)}`, r.lo, LINE.xs)}</g>`;
}

/** Bông hoa 5 cánh nhìn hơi từ trên. */
export function flowerHead(doc, x, y, rad, petal, center = PAL.yellow, n = 5, rot = 0) {
  const r = ramp(petal);
  let s = '';
  for (let i = 0; i < n; i++) {
    const a = rot + (i / n) * Math.PI * 2 - Math.PI / 2;
    const px = x + Math.cos(a) * rad * 0.58, py = y + Math.sin(a) * rad * 0.5;
    s += ellipse(px, py, rad * 0.5, rad * 0.42, doc.sphere(petal, 0.8), r.line, LINE.xs * 1.1);
  }
  s += circle(x, y, rad * 0.32, doc.sphere(center, 1), ramp(center).line, LINE.xs);
  s += circle(x - rad * 0.1, y - rad * 0.12, rad * 0.1, '#fff', null, 0, 'opacity="0.7"');
  return s;
}

/** Hoa tulip/chuông nhỏ (cho luống, bồn hoa). */
export function tulip(doc, x, y, s, color) {
  const r = ramp(color);
  const d = `M${r2(x - s)},${r2(y - s * 1.3)} Q${r2(x - s * 1.05)},${r2(y)} ${r2(x)},${r2(y + s * 0.2)} Q${r2(x + s * 1.05)},${r2(y)} ${r2(x + s)},${r2(y - s * 1.3)} L${r2(x + s * 0.5)},${r2(y - s * 0.8)} L${r2(x)},${r2(y - s * 1.4)} L${r2(x - s * 0.5)},${r2(y - s * 0.8)}Z`;
  return shape(d, doc.vgrad(color), r.line, LINE.xs * 1.2) + gloss(x - s * 0.45, y - s * 0.6, s * 0.18, s * 0.35, 0.45, 10);
}

/** Bụi lá nền (cụm thấp) – dùng dưới hoa, quanh chân nhà. */
export function leafTuft(doc, cx, by, w, h, color, seed = 3, lw = LINE.md) {
  const R = rng(seed);
  const r = ramp(color);
  const pts = [];
  const n = 7;
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const x = cx - w / 2 + t * w;
    const hh = Math.sin(Math.PI * t) * h * (0.75 + R() * 0.35);
    pts.push([x, by - hh]);
  }
  let d = `M${r2(cx - w / 2)},${r2(by)}`;
  for (let i = 1; i < pts.length; i++) {
    const [x0, y0] = pts[i - 1], [x1, y1] = pts[i];
    const mx = (x0 + x1) / 2, my = Math.min(y0, y1) - h * 0.28;
    d += ` Q${r2(mx)},${r2(my)} ${r2(x1)},${r2(y1)}`;
  }
  d += ` Q${r2(cx)},${r2(by + h * 0.12)} ${r2(cx - w / 2)},${r2(by)}Z`;
  return shape(d, doc.sphere(color, 1), r.line, lw);
}

/** Lá cỏ (ngọn cỏ nhọn mềm). */
export function blade(x, y, h, lean, w, fill, line, lw = LINE.xs * 1.2) {
  const tx = x + lean, ty = y - h;
  const d = `M${r2(x - w)},${r2(y)} Q${r2(x - w * 0.6 + lean * 0.3)},${r2(y - h * 0.55)} ${r2(tx)},${r2(ty)} Q${r2(x + w * 0.5 + lean * 0.35)},${r2(y - h * 0.5)} ${r2(x + w)},${r2(y)}Z`;
  return shape(d, fill, line, lw);
}

/** Tấm gỗ (ván) bo góc, có vân. */
export function plank(doc, x, y, w, h, color = PAL.wood, lw = LINE.sm, grain = true) {
  const r = ramp(color);
  let s = rect(x, y, w, h, Math.min(3, h / 2, w / 2), doc.vgrad(color), r.line, lw);
  if (grain && w > 14) {
    const horiz = w >= h;
    if (horiz) s += stroke(`M${r2(x + w * 0.18)},${r2(y + h * 0.5)} Q${r2(x + w * 0.4)},${r2(y + h * 0.35)} ${r2(x + w * 0.62)},${r2(y + h * 0.52)}`, r.lo, LINE.xs, 'opacity="0.7"');
    else s += stroke(`M${r2(x + w * 0.5)},${r2(y + h * 0.15)} Q${r2(x + w * 0.35)},${r2(y + h * 0.4)} ${r2(x + w * 0.52)},${r2(y + h * 0.65)}`, r.lo, LINE.xs, 'opacity="0.7"');
  }
  return s;
}

/** Cửa sổ: khung kem, kính xanh trời có vệt phản chiếu, song cửa chữ thập, tuỳ chọn cửa chớp. */
export function windowBox(doc, x, y, w, h, o = {}) {
  const frame = o.frame || PAL.white;
  const fr = ramp(o.frameLine || PAL.woodDark);
  const glass = o.lit ? PAL.yellowLight : PAL.skyLight;
  const lw = o.lw || LINE.md;
  let s = '';
  if (o.shutters) {
    const sc = o.shutters, sr = ramp(sc);
    const sw = w * 0.36;
    s += rect(x - sw - 2, y - 1, sw, h + 2, 3, doc.vgrad(sc), sr.line, LINE.sm);
    s += rect(x + w + 2, y - 1, sw, h + 2, 3, doc.vgrad(sc), sr.line, LINE.sm);
    for (const sx of [x - sw - 2, x + w + 2]) {
      for (let k = 1; k < 4; k++) s += stroke(`M${r2(sx + 3)},${r2(y - 1 + (h + 2) * k / 4)} L${r2(sx + sw - 3)},${r2(y - 1 + (h + 2) * k / 4)}`, sr.lo, LINE.xs);
    }
  }
  const rx = o.arch ? w / 2 : 4;
  const path = o.arch
    ? `M${r2(x)},${r2(y + h)} L${r2(x)},${r2(y + w / 2)} A${r2(w / 2)},${r2(w / 2)} 0 0 1 ${r2(x + w)},${r2(y + w / 2)} L${r2(x + w)},${r2(y + h)}Z`
    : null;
  if (path) s += shape(path, frame, fr.line, lw);
  else s += rect(x, y, w, h, rx, frame, fr.line, lw);
  const ix = x + 4, iy = y + 4, iw = w - 8, ih = h - 8;
  const gl = doc.linear([[0, lighten(glass, 0.3)], [1, o.lit ? PAL.yellow : PAL.sky]], 0, 0, 0.6, 1);
  const inner = o.arch
    ? `M${r2(ix)},${r2(iy + ih)} L${r2(ix)},${r2(iy + iw / 2)} A${r2(iw / 2)},${r2(iw / 2)} 0 0 1 ${r2(ix + iw)},${r2(iy + iw / 2)} L${r2(ix + iw)},${r2(iy + ih)}Z`
    : null;
  const cl = doc.clip(inner ? `<path d="${inner}"/>` : `<rect x="${ix}" y="${iy}" width="${iw}" height="${ih}" rx="2"/>`);
  s += `<g clip-path="${cl}"><rect x="${ix - 2}" y="${iy - 2}" width="${iw + 4}" height="${ih + 4}" fill="${gl}"/>`;
  if (!o.lit) {
    s += `<path d="M${r2(ix + iw * 0.15)},${r2(iy + ih)} L${r2(ix + iw * 0.75)},${r2(iy - 1)} L${r2(ix + iw * 0.98)},${r2(iy - 1)} L${r2(ix + iw * 0.38)},${r2(iy + ih)}Z" fill="#fff" opacity="0.55"/>`;
    s += `<rect x="${ix - 2}" y="${iy - 2}" width="${iw + 4}" height="${r2(ih * 0.22)}" fill="${PAL.purple}" opacity="0.18"/>`;
  } else {
    s += `<ellipse cx="${r2(ix + iw / 2)}" cy="${r2(iy + ih * 0.6)}" rx="${r2(iw * 0.5)}" ry="${r2(ih * 0.5)}" fill="#fff" opacity="0.45"/>`;
  }
  s += `</g>`;
  if (inner) s += shape(inner, 'none', fr.line, LINE.sm);
  else s += rect(ix, iy, iw, ih, 2, 'none', fr.line, LINE.sm);
  if (o.cross !== false) {
    s += stroke(`M${r2(x + w / 2)},${r2(iy + (o.arch ? 1 : 0))} L${r2(x + w / 2)},${r2(iy + ih)}`, frame, 3.2);
    s += stroke(`M${r2(ix)},${r2(iy + ih * (o.arch ? 0.58 : 0.5))} L${r2(ix + iw)},${r2(iy + ih * (o.arch ? 0.58 : 0.5))}`, frame, 3.2);
  }
  if (o.sill !== false) s += rect(x - 4, y + h - 2, w + 8, 6, 3, doc.vgrad(frame), fr.line, LINE.sm);
  return s;
}

/** Cửa sổ tròn (ô tròn). */
export function roundWindow(doc, cx, cy, rad, o = {}) {
  const frame = o.frame || PAL.white;
  const fr = ramp(o.frameLine || PAL.woodDark);
  let s = circle(cx, cy, rad, doc.vgrad(frame), fr.line, LINE.md);
  const ir = rad - 4.5;
  const cl = doc.clip(`<circle cx="${cx}" cy="${cy}" r="${ir}"/>`);
  s += `<g clip-path="${cl}"><circle cx="${cx}" cy="${cy}" r="${ir}" fill="${doc.linear([[0, o.lit ? PAL.yellowLight : PAL.skyLight], [1, o.lit ? PAL.yellow : PAL.sky]], 0, 0, 0.5, 1)}"/>`;
  s += `<path d="M${r2(cx - ir)},${r2(cy + ir * 0.4)} L${r2(cx + ir * 0.2)},${r2(cy - ir)} L${r2(cx + ir * 0.65)},${r2(cy - ir)} L${r2(cx - ir * 0.3)},${r2(cy + ir)}Z" fill="#fff" opacity="0.5"/></g>`;
  s += circle(cx, cy, ir, 'none', fr.line, LINE.sm);
  if (o.cross !== false) {
    s += stroke(`M${r2(cx - ir)},${r2(cy)} L${r2(cx + ir)},${r2(cy)}`, frame, 2.6);
    s += stroke(`M${r2(cx)},${r2(cy - ir)} L${r2(cx)},${r2(cy + ir)}`, frame, 2.6);
  }
  return s;
}

/** Hộp hoa dưới cửa sổ. */
export function flowerBox(doc, x, y, w, color = PAL.wood, flowers = [PAL.rose, PAL.yellow, PAL.lavender], seed = 2) {
  const R = rng(seed);
  let s = '';
  // lá
  s += leafTuft(doc, x + w / 2, y + 2, w * 0.98, 12, PAL.leaf, seed, LINE.sm);
  const n = Math.max(3, Math.round(w / 11));
  for (let i = 0; i < n; i++) {
    const fx = x + 6 + (i / (n - 1)) * (w - 12) + (R() - 0.5) * 2;
    const fy = y - 6 - R() * 5;
    s += flowerHead(doc, fx, fy, 6.5, flowers[i % flowers.length], PAL.yellowLight, 5, R());
  }
  s += rect(x, y, w, 11, 3, doc.vgrad(color), ramp(color).line, LINE.sm);
  s += stroke(`M${r2(x + 3)},${r2(y + 3.5)} L${r2(x + w - 3)},${r2(y + 3.5)}`, lighten(color, 0.4), LINE.xs, 'opacity="0.8"');
  return s;
}

/** Cửa ra vào gỗ bo vòm trên, tay nắm vàng. */
export function door(doc, cx, by, w, h, color = PAL.wood, o = {}) {
  const r = ramp(color);
  const x = cx - w / 2, y = by - h;
  const d = `M${r2(x)},${r2(by)} L${r2(x)},${r2(y + w / 2)} A${r2(w / 2)},${r2(w / 2)} 0 0 1 ${r2(x + w)},${r2(y + w / 2)} L${r2(x + w)},${r2(by)}Z`;
  let s = '';
  // khung cửa
  const fw = 5;
  const fd = `M${r2(x - fw)},${r2(by)} L${r2(x - fw)},${r2(y + w / 2)} A${r2(w / 2 + fw)},${r2(w / 2 + fw)} 0 0 1 ${r2(x + w + fw)},${r2(y + w / 2)} L${r2(x + w + fw)},${r2(by)}Z`;
  s += shape(fd, doc.vgrad(o.frame || PAL.cream), ramp(o.frameLine || PAL.woodDark).line, LINE.md);
  s += shape(d, doc.vgrad(color), r.line, LINE.md);
  // ván dọc
  for (let k = 1; k < 3; k++) {
    const px = x + (w * k) / 3;
    s += stroke(`M${r2(px)},${r2(y + 6 + (k === 1 || k === 2 ? 3 : 0))} L${r2(px)},${r2(by - 2)}`, r.lo, LINE.xs * 1.2);
  }
  if (o.window !== false) {
    s += roundWindow(doc, cx, y + w * 0.5, Math.min(8, w * 0.22), { cross: true });
  }
  s += circle(x + w * 0.8, by - h * 0.42, 2.8, doc.sphere(PAL.yellow), ramp(PAL.yellow).line, LINE.xs);
  return s;
}

/** Mái lợp vảy cá (scallop) – vẽ các hàng vảy trong vùng clip. */
export function scallops(x0, x1, y0, y1, step, rad, color, lw = LINE.xs * 1.2, op = 0.9) {
  let s = '';
  let row = 0;
  for (let y = y1; y > y0 - rad; y -= step, row++) {
    let d = '';
    const off = (row % 2) * rad;
    for (let x = x0 - rad * 2 + off; x < x1 + rad * 2; x += rad * 2) {
      d += `M${r2(x)},${r2(y - step * 0.55)} Q${r2(x)},${r2(y)} ${r2(x + rad)},${r2(y)} Q${r2(x + rad * 2)},${r2(y)} ${r2(x + rad * 2)},${r2(y - step * 0.55)} `;
    }
    s += stroke(d, color, lw, `opacity="${op}"`);
  }
  return s;
}

/** Hàng ngói dạng sóng ngang. */
export function shingleRows(x0, x1, y0, y1, step, color, lw = LINE.xs * 1.2, op = 0.8) {
  let s = '';
  for (let y = y1 - step; y > y0; y -= step) {
    let d = `M${r2(x0)},${r2(y)}`;
    for (let x = x0; x < x1; x += 14) d += ` q7,5 14,0`;
    s += stroke(d, color, lw, `opacity="${op}"`);
  }
  return s;
}

/** Đá nhỏ (viên sỏi) nhìn hơi từ trên. */
export function pebble(doc, cx, cy, rx, ry, color = PAL.stone, seed = 1, lw = LINE.sm) {
  const r = ramp(color);
  const p = blob(cx, cy, rx, ry, 7, 0.12, seed);
  return shape(p, doc.vgrad(color, 1.2), r.line, lw) + gloss(cx - rx * 0.3, cy - ry * 0.35, rx * 0.35, ry * 0.2, 0.5);
}

/** Lấp lánh 4 cánh (ma thuật). */
export function sparkle(x, y, s, color = '#fff', op = 0.95) {
  const d = `M${r2(x)},${r2(y - s)} Q${r2(x + s * 0.18)},${r2(y - s * 0.18)} ${r2(x + s)},${r2(y)} Q${r2(x + s * 0.18)},${r2(y + s * 0.18)} ${r2(x)},${r2(y + s)} Q${r2(x - s * 0.18)},${r2(y + s * 0.18)} ${r2(x - s)},${r2(y)} Q${r2(x - s * 0.18)},${r2(y - s * 0.18)} ${r2(x)},${r2(y - s)}Z`;
  return `<path d="${d}" fill="${color}" opacity="${op}"/>`;
}

/** Quầng sáng tròn mờ dần (đèn, nấm phát sáng). */
export function glow(doc, cx, cy, rad, color = PAL.yellowLight, op = 0.7) {
  const g = doc.radial([[0, color, op], [0.45, color, op * 0.45], [1, color, 0]]);
  return `<circle cx="${r2(cx)}" cy="${r2(cy)}" r="${r2(rad)}" fill="${g}"/>`;
}
