// ── Little World · Đảo: công trình (island/buildings) ──
// Góc nhìn 3/4 từ trên: tường mặt trước nhìn chính diện, mái nghiêng ra sau thấy rõ
// (mặt mái chiếm ~ 45–50% chiều cao nhà). Đế (origin) = mép trước bậc thềm/nền.
import { sprite } from './island-common.mjs';
import {
  PAL, LINE, ramp, lighten, darken, mix, alpha, rng, smoothPath, blob, gloss, shape, stroke, circle, ellipse, rect, r2,
  baseShadow, canopy, flowerHead, flowerBox, windowBox, roundWindow, door, scallops, shingleRows, plank, pebble,
  leafTuft, tulip, sparkle, glow, leafMark,
} from './island-kit.mjs';

// ───────────── mảnh ghép nhà ─────────────
/** Mái dốc (mặt mái nhìn thấy từ trên): hình thang bo góc. Trả về {svg, path}. */
export function roofSlope(doc, cx, eaveY, ridgeY, halfEave, halfRidge, color, o = {}) {
  const r = ramp(color);
  const k = 8;
  const d = `M${r2(cx - halfEave + k)},${r2(eaveY)} L${r2(cx + halfEave - k)},${r2(eaveY)} Q${r2(cx + halfEave)},${r2(eaveY)} ${r2(cx + halfEave - 2)},${r2(eaveY - k)} ` +
    `L${r2(cx + halfRidge + 1)},${r2(ridgeY + k)} Q${r2(cx + halfRidge)},${r2(ridgeY)} ${r2(cx + halfRidge - k)},${r2(ridgeY)} L${r2(cx - halfRidge + k)},${r2(ridgeY)} ` +
    `Q${r2(cx - halfRidge)},${r2(ridgeY)} ${r2(cx - halfRidge - 1)},${r2(ridgeY + k)} L${r2(cx - halfEave + 2)},${r2(eaveY - k)} Q${r2(cx - halfEave)},${r2(eaveY)} ${r2(cx - halfEave + k)},${r2(eaveY)}Z`;
  const fill = doc.linear([[0, lighten(color, 0.22)], [0.5, color], [1, darken(color, 0.1)]], 0.3, 0, 0.7, 1);
  let s = shape(d, fill, r.line, o.lw || LINE.lg);
  const cl = doc.clip(`<path d="${d}"/>`);
  s += `<g clip-path="${cl}">`;
  if (o.tiles === 'scallop') s += scallops(cx - halfEave, cx + halfEave, ridgeY, eaveY, o.step || 13, o.rad || 9, r.lo, LINE.xs * 1.3, 0.75);
  else if (o.tiles === 'rows') s += shingleRows(cx - halfEave, cx + halfEave, ridgeY, eaveY, o.step || 12, r.lo);
  else if (o.tiles === 'thatch') {
    const R = rng(7);
    for (let y = ridgeY + 10; y < eaveY; y += 11) {
      let dd = '';
      for (let x = cx - halfEave; x < cx + halfEave; x += 7) dd += `M${r2(x)},${r2(y)} l${r2((R() - 0.5) * 3)},${r2(7 + R() * 4)} `;
      s += stroke(dd, r.lo, LINE.xs, 'opacity="0.7"');
    }
  }
  // sáng mép trái, tối mép phải (mặt mái hơi cong)
  s += `<path d="M${r2(cx + halfRidge - 20)},${r2(ridgeY)} L${r2(cx + halfRidge + 40)},${r2(ridgeY)} L${r2(cx + halfEave + 10)},${r2(eaveY)} L${r2(cx + halfEave - 30)},${r2(eaveY)}Z" fill="${PAL.purple}" opacity="0.13"/>`;
  s += `</g>`;
  // máng mái / diềm mái
  s += rect(cx - halfEave - 2, eaveY - 6, halfEave * 2 + 4, 11, 5.5, doc.vgrad(o.fascia || lighten(color, 0.3)), r.line, LINE.md);
  // nóc mái
  if (o.ridge !== false) s += rect(cx - halfRidge - 3, ridgeY - 5, halfRidge * 2 + 6, 10, 5, doc.vgrad(lighten(color, 0.35)), r.line, LINE.md);
  return { svg: s, path: d };
}

/** Tường mặt trước có ván ngang, cột góc, đá móng, bóng dưới mái. */
export function wallFront(doc, x0, x1, topY, by, color, o = {}) {
  const r = ramp(color);
  let s = rect(x0, topY, x1 - x0, by - topY, 6, doc.vgrad(color, 0.8), r.line, LINE.lg);
  const cl = doc.clip(`<rect x="${x0}" y="${topY}" width="${x1 - x0}" height="${by - topY}" rx="6"/>`);
  s += `<g clip-path="${cl}">`;
  if (o.siding !== false) {
    for (let y = topY + 14; y < by - 10; y += o.sidingStep || 13) s += stroke(`M${x0 + 2},${r2(y)} L${x1 - 2},${r2(y)}`, r.lo, LINE.xs, 'opacity="0.45"');
  }
  if (o.bricks) {
    const R = rng(5);
    for (let i = 0; i < o.bricks; i++) {
      const x = x0 + 10 + R() * (x1 - x0 - 30), y = topY + 20 + R() * (by - topY - 40);
      s += rect(x, y, 14, 7, 3, lighten(color, 0.2), r.lo, LINE.xs, 'opacity="0.7"');
    }
  }
  // bóng dưới mái
  s += `<rect x="${x0}" y="${topY}" width="${x1 - x0}" height="${o.eaveShadow || 16}" fill="${darken(color, 0.35)}" opacity="0.35"/>`;
  s += `</g>`;
  // cột góc
  if (o.posts !== false) {
    const pc = o.post || PAL.woodLight;
    s += plank(doc, x0 - 2, topY + 2, 9, by - topY - 4, pc, LINE.sm, false);
    s += plank(doc, x1 - 7, topY + 2, 9, by - topY - 4, pc, LINE.sm, false);
  }
  // móng đá
  if (o.foundation !== false) s += foundation(doc, x0 - 4, x1 + 4, by, o.stone || PAL.stone);
  return s;
}

export function foundation(doc, x0, x1, by, color = PAL.stone) {
  const r = ramp(color);
  let s = rect(x0, by - 13, x1 - x0, 15, 6, doc.vgrad(color), r.line, LINE.md);
  const R = rng(Math.round(x0 * 7 + x1));
  for (let x = x0 + 6; x < x1 - 12; x += 16 + R() * 6) {
    s += rect(x, by - 10, 12 + R() * 4, 8, 4, lighten(color, 0.25), r.lo, LINE.xs, 'opacity="0.85"');
  }
  return s;
}

/** Ống khói gạch. */
export function chimney(doc, x, topY, botY, w = 26, color = '#d98e7a') {
  const r = ramp(color);
  let s = rect(x - w / 2, topY, w, botY - topY, 4, doc.vgrad(color), r.line, LINE.md);
  for (let y = topY + 12; y < botY - 4; y += 9) {
    const off = ((y - topY) / 9) % 2 ? 0 : w / 4;
    s += stroke(`M${r2(x - w / 2 + 2)},${r2(y)} L${r2(x + w / 2 - 2)},${r2(y)}`, r.lo, LINE.xs, 'opacity="0.6"');
    s += stroke(`M${r2(x - w / 4 + off)},${r2(y)} L${r2(x - w / 4 + off)},${r2(y - 9)}`, r.lo, LINE.xs, 'opacity="0.5"');
  }
  s += rect(x - w / 2 - 4, topY - 6, w + 8, 10, 4, doc.vgrad(lighten(color, 0.15)), r.line, LINE.md);
  s += ellipse(x, topY - 4, w / 2 - 1, 2.6, darken(color, 0.55), null);
  return s;
}

/** Bậc thềm gỗ/đá phía trước cửa. */
export function steps(doc, cx, by, w, n = 2, color = PAL.stoneLight) {
  const r = ramp(color);
  let s = '';
  for (let i = 0; i < n; i++) {
    const ww = w + (n - 1 - i) * 0 + i * 10;
    const y = by - (n - i) * 7;
    s += rect(cx - ww / 2, y, ww, 9, 4, doc.vgrad(color), r.line, LINE.md);
  }
  return s;
}

/** Mặt hồi tam giác phía trước (cross-gable) + diềm mái chữ V. */
export function gableFront(doc, cx, baseY, peakY, half, wallC, roofC, o = {}) {
  const wr = ramp(wallC), rr = ramp(roofC);
  const face = `M${r2(cx - half)},${r2(baseY)} L${r2(cx - half)},${r2(baseY - 8)} L${r2(cx)},${r2(peakY + 6)} L${r2(cx + half)},${r2(baseY - 8)} L${r2(cx + half)},${r2(baseY)}Z`;
  let s = shape(face, doc.vgrad(wallC, 0.7), wr.line, LINE.md);
  const cl = doc.clip(`<path d="${face}"/>`);
  s += `<g clip-path="${cl}">`;
  for (let x = cx - half + 10; x < cx + half; x += 12) s += stroke(`M${r2(x)},${r2(peakY)} L${r2(x)},${r2(baseY)}`, wr.lo, LINE.xs, 'opacity="0.4"');
  s += `<path d="M${r2(cx - half - 4)},${r2(baseY - 4)} L${r2(cx)},${r2(peakY + 4)} L${r2(cx + half + 4)},${r2(baseY - 4)} L${r2(cx + half + 4)},${r2(baseY - 4 + 14)} L${r2(cx)},${r2(peakY + 18)} L${r2(cx - half - 4)},${r2(baseY + 10)}Z" fill="${darken(wallC, 0.35)}" opacity="0.32"/>`;
  s += `</g>`;
  // diềm mái dày
  const ov = o.overhang || 14, th = o.thick || 13;
  const bx0 = cx - half - ov, by0 = baseY + ov * 0.55;
  const bx1 = cx + half + ov;
  const band = `M${r2(bx0)},${r2(by0)} L${r2(cx)},${r2(peakY - th * 0.4)} L${r2(bx1)},${r2(by0)} L${r2(bx1 - th * 0.8)},${r2(by0 + th * 0.75)} L${r2(cx)},${r2(peakY + th * 0.85)} L${r2(bx0 + th * 0.8)},${r2(by0 + th * 0.75)}Z`;
  // mặt trên của mái hồi (thấy từ trên) – dải mái mỏng phía sau diềm
  const topFace = `M${r2(bx0)},${r2(by0)} L${r2(cx)},${r2(peakY - th * 0.4)} L${r2(bx1)},${r2(by0)} L${r2(bx1 - 4)},${r2(by0 - 16)} L${r2(cx)},${r2(peakY - th * 0.4 - 22)} L${r2(bx0 + 4)},${r2(by0 - 16)}Z`;
  if (o.topFace !== false) {
    s = shape(topFace, doc.vgrad(lighten(roofC, 0.1)), rr.line, LINE.lg) + s;
  }
  s += shape(band, doc.linear([[0, lighten(roofC, 0.25)], [1, darken(roofC, 0.05)]], 0, 0, 0, 1), rr.line, LINE.lg);
  if (o.scallop !== false) s += stroke(`M${r2(bx0 + th)},${r2(by0 + th * 0.3)} L${r2(cx)},${r2(peakY + th * 0.3)} L${r2(bx1 - th)},${r2(by0 + th * 0.3)}`, lighten(roofC, 0.45), LINE.xs * 1.3, 'opacity="0.8"');
  return s;
}

/** Đèn treo nhỏ cạnh cửa (sáng ấm). */
export function wallLamp(doc, x, y) {
  let s = glow(doc, x, y + 6, 18, PAL.yellowLight, 0.6);
  s += stroke(`M${x - 6},${y - 4} L${x},${y - 4} L${x},${y}`, PAL.ink, LINE.sm);
  s += rect(x - 5, y, 10, 13, 3, doc.vgrad(PAL.yellowLight), ramp(PAL.yellow).line, LINE.sm);
  s += rect(x - 6.5, y - 2, 13, 4, 2, '#6e6187', null);
  return s;
}

/** Bụi hoa trước nhà. */
export function frontBush(doc, cx, by, w, h, flowers = [PAL.rose, PAL.yellowLight], seed = 3) {
  const R = rng(seed);
  let s = leafTuft(doc, cx, by, w, h, PAL.leaf, seed, LINE.md);
  for (let i = 0; i < Math.round(w / 12); i++) {
    s += flowerHead(doc, cx - w * 0.35 + R() * w * 0.7, by - h * 0.35 - R() * h * 0.45, 5.5, flowers[i % flowers.length], PAL.yellow, 5, R());
  }
  return s;
}

// ───────────── nhà chính (3 phối màu) ─────────────
function mainHouse(c) {
  return (doc, ox, oy) => {
    const W = 228, wallH = 100, cx = ox;
    const by = oy - 12; // chân tường (thềm phía trước)
    const x0 = cx - W / 2, x1 = cx + W / 2;
    const eaveY = by - wallH + 4, ridgeY = eaveY - 96;
    let s = baseShadow(cx, oy - 8, 150, 26);
    // ống khói (sau mái)
    s += chimney(doc, cx + 70, ridgeY - 26, eaveY - 30, 26, c.chimney);
    // khói mềm
    s += circle(cx + 76, ridgeY - 46, 8, '#fff', null, 0, 'opacity="0.55"') + circle(cx + 88, ridgeY - 60, 6, '#fff', null, 0, 'opacity="0.4"');
    s += wallFront(doc, x0, x1, by - wallH, by, c.wall, { post: c.post });
    s += roofSlope(doc, cx, eaveY, ridgeY, W / 2 + 18, W / 2 - 16, c.roof, { tiles: 'scallop' }).svg;
    // cửa sổ mái nhỏ bên trái
    const dx = cx - 66, dy = ridgeY + 50;
    s += shape(`M${dx - 20},${dy + 22} L${dx - 20},${dy} Q${dx},${dy - 24} ${dx + 20},${dy} L${dx + 20},${dy + 22}Z`, doc.vgrad(c.wall), ramp(c.wall).line, LINE.md);
    s += windowBox(doc, dx - 11, dy - 7, 22, 26, { arch: true, sill: false });
    s += shape(`M${dx - 27},${dy + 4} Q${dx},${dy - 34} ${dx + 27},${dy + 4}`, 'none', ramp(c.roof).line, LINE.lg + 5);
    s += shape(`M${dx - 27},${dy + 4} Q${dx},${dy - 34} ${dx + 27},${dy + 4}`, 'none', lighten(c.roof, 0.2), LINE.lg + 0.5);
    // mặt hồi giữa
    s += gableFront(doc, cx, by - wallH + 6, ridgeY + 2, 60, c.gable, c.roof);
    s += roundWindow(doc, cx, ridgeY + 58, 16, { frame: PAL.white });
    // cửa + hiên
    s += rect(cx - 52, by - wallH + 22, 104, wallH - 22, 4, darken(c.gable, 0.02), ramp(c.gable).line, LINE.md);
    s += stroke(`M${cx - 50},${by - wallH + 34} L${cx + 50},${by - wallH + 34}`, ramp(c.gable).lo, LINE.xs, 'opacity="0.5"');
    s += door(doc, cx, by - 2, 38, 62, c.door);
    s += wallLamp(doc, cx - 34, by - 70);
    // mái hiên nhỏ trên cửa
    s += shape(`M${cx - 40},${by - 74} L${cx + 40},${by - 74} L${cx + 34},${by - 88} L${cx - 34},${by - 88}Z`, doc.vgrad(c.roof), ramp(c.roof).line, LINE.md);
    s += rect(cx - 42, by - 78, 84, 7, 3.5, lighten(c.roof, 0.3), ramp(c.roof).line, LINE.sm);
    // cột hiên
    s += plank(doc, cx - 46, by - 72, 7, 70, PAL.white, LINE.sm, false);
    s += plank(doc, cx + 39, by - 72, 7, 70, PAL.white, LINE.sm, false);
    // cửa sổ hai bên + hộp hoa
    for (const wx of [cx - 86, cx + 54]) {
      s += windowBox(doc, wx, by - 78, 32, 38, { shutters: c.shutter, lit: c.lit });
      s += flowerBox(doc, wx - 6, by - 36, 44, PAL.wood, c.flowers, wx | 0);
    }
    // hiên gỗ + bậc thềm
    s += shape(`M${cx - 62},${by - 4} L${cx + 62},${by - 4} L${cx + 66},${by + 8} L${cx - 66},${by + 8}Z`, doc.vgrad(PAL.woodLight), ramp(PAL.wood).line, LINE.md);
    for (let k = -2; k <= 2; k++) s += stroke(`M${cx + k * 25},${by - 3} L${cx + k * 26.5},${by + 7}`, ramp(PAL.woodLight).lo, LINE.xs);
    s += steps(doc, cx, oy + 1, 52, 1, PAL.stoneLight);
    // bụi hoa hai góc nhà
    s += frontBush(doc, x0 + 6, by + 4, 44, 26, c.flowers, 5);
    s += frontBush(doc, x1 - 4, by + 4, 48, 28, c.flowers, 9);
    // hộp thư nhỏ trên tường? -> không, hòm thư là vật riêng
    return s;
  };
}

function smallCottage(c) {
  return (doc, ox, oy) => {
    const W = c.W || 150, wallH = c.wallH || 78, cx = ox;
    const by = oy - 6;
    const x0 = cx - W / 2, x1 = cx + W / 2;
    const eaveY = by - wallH + 4;
    let s = baseShadow(cx, oy - 4, W * 0.62, 20);
    if (c.style === 'slope') {
      const ridgeY = eaveY - 74;
      s += chimney(doc, cx - 40, ridgeY - 18, eaveY - 26, 22, c.chimney || '#c9a48f');
      s += wallFront(doc, x0, x1, by - wallH, by, c.wall, { post: c.post });
      s += roofSlope(doc, cx, eaveY, ridgeY, W / 2 + 16, W / 2 - 14, c.roof, { tiles: c.tiles || 'rows' }).svg;
      s += windowBox(doc, cx + 22, by - 62, 30, 34, { shutters: c.shutter });
      s += flowerBox(doc, cx + 16, by - 26, 42, PAL.wood, c.flowers, 4);
      s += door(doc, cx - 30, by - 2, 34, 56, c.door);
      s += roundWindow(doc, cx - 16, ridgeY + 38, 12);
    } else if (c.style === 'dome') {
      // mái tròn rơm (nhà nấm/rơm)
      s += wallFront(doc, x0 + 6, x1 - 6, by - wallH + 6, by, c.wall, { post: c.post, siding: false, bricks: 6 });
      const r = ramp(c.roof);
      const top = eaveY - 92;
      const d = `M${x0 - 20},${eaveY + 6} C${x0 - 26},${eaveY - 70} ${cx - 60},${top} ${cx},${top} C${cx + 60},${top} ${x1 + 26},${eaveY - 70} ${x1 + 20},${eaveY + 6} Q${cx},${eaveY + 22} ${x0 - 20},${eaveY + 6}Z`;
      s += shape(d, doc.sphere(c.roof, 0.9), r.line, LINE.lg);
      const cl = doc.clip(`<path d="${d}"/>`);
      s += `<g clip-path="${cl}">`;
      const R = rng(9);
      for (let y = top + 16; y < eaveY + 14; y += 12) {
        let dd = '';
        for (let x = x0 - 24; x < x1 + 24; x += 8) dd += `M${r2(x)},${r2(y + Math.pow((x - cx) / W, 2) * 30)} l${r2((R() - 0.5) * 3)},${r2(8 + R() * 4)} `;
        s += stroke(dd, r.lo, LINE.xs, 'opacity="0.75"');
      }
      s += `</g>`;
      s += stroke(`M${x0 - 18},${eaveY + 6} Q${cx},${eaveY + 22} ${x1 + 18},${eaveY + 6}`, r.lo, LINE.md);
      s += gloss(cx - 34, top + 26, 22, 9, 0.4);
      s += roundWindow(doc, cx, top + 44, 13);
      s += door(doc, cx + 22, by - 2, 34, 52, c.door);
      s += windowBox(doc, cx - 52, by - 56, 28, 30, { arch: true });
      s += flowerBox(doc, cx - 58, by - 24, 40, PAL.wood, c.flowers, 8);
    } else if (c.style === 'aframe') {
      // nhà chữ A: hồi tam giác cao nhìn chính diện, mái hai bên thấy từ trên
      const peak = by - 168;
      const r = ramp(c.roof);
      const back = `M${x0 - 24},${by + 2} L${x0 - 18},${by - 34} L${cx},${peak - 44} L${x1 + 18},${by - 34} L${x1 + 24},${by + 2} L${cx},${peak - 8}Z`;
      s += shape(back, doc.linear([[0, lighten(c.roof, 0.25)], [1, darken(c.roof, 0.05)]], 0, 0, 0, 1), r.line, LINE.lg);
      const bcl = doc.clip(`<path d="${back}"/>`);
      let rows = '';
      for (let k = 1; k < 9; k++) {
        const t = k / 9;
        rows += stroke(`M${r2(x0 - 22 + (cx - x0 + 22) * t)},${r2(by - 16 + (peak - by - 10) * t)} l10,-16 M${r2(x1 + 22 - (x1 + 22 - cx) * t)},${r2(by - 16 + (peak - by - 10) * t)} l-10,-16`, r.lo, LINE.xs * 1.2, 'opacity="0.7"');
      }
      s += `<g clip-path="${bcl}">${rows}</g>`;
      const face = `M${cx},${peak + 14} L${x0 + 4},${by} L${x1 - 4},${by}Z`;
      s += shape(face, doc.vgrad(c.wall), ramp(c.wall).line, LINE.lg);
      const cl = doc.clip(`<path d="${face}"/>`);
      s += `<g clip-path="${cl}">`;
      for (let x = x0; x < x1; x += 13) s += stroke(`M${x},${peak} L${x},${by}`, ramp(c.wall).lo, LINE.xs, 'opacity="0.45"');
      s += `</g>`;
      s += shape(`M${cx},${peak - 8} L${x0 - 24},${by + 2} L${x0 - 8},${by + 6} L${cx},${peak + 16} L${x1 + 8},${by + 6} L${x1 + 24},${by + 2}Z`, doc.linear([[0, lighten(c.roof, 0.3)], [1, c.roof]]), r.line, LINE.lg);
      s += stroke(`M${x0 - 10},${by - 2} L${cx},${peak + 4} L${x1 + 10},${by - 2}`, lighten(c.roof, 0.5), LINE.xs * 1.3, 'opacity="0.7"');
      s += roundWindow(doc, cx, peak + 62, 14);
      s += door(doc, cx, by - 2, 36, 58, c.door);
      s += foundation(doc, x0 + 10, x1 - 10, by + 3, PAL.stone);
      s += frontBush(doc, x0 + 30, by + 6, 34, 20, c.flowers, 3);
      s += frontBush(doc, x1 - 30, by + 6, 34, 20, c.flowers, 6);
    }
    s += steps(doc, c.style === 'slope' ? cx - 30 : c.style === 'dome' ? cx + 22 : cx, oy + 1, 44, 1);
    return s;
  };
}

export function defineBuildings() {
  const B = (id, file, d, usage, footprint, draw, tags = []) => sprite({
    id: `island-building-${id}`, file: `island/buildings/${file}.png`, ...d, usage, footprint,
    tags: ['building', ...tags], draw,
  });
  const H = { w: 320, h: 330, ox: 160, oy: 316 };
  B('house-main', 'house-main', H, 'Nhà chính của bé (mái hồng san hô): cửa sổ tròn, ống khói, hộp hoa, hiên – tiêu điểm của đảo', [4, 3],
    mainHouse({ wall: '#fff0d6', gable: '#fff7e8', roof: '#f08a7e', door: PAL.wood, post: PAL.woodLight, shutter: '#8fc9a6', chimney: '#d99a85', flowers: [PAL.rose, PAL.yellow, PAL.lavender] }), ['home']);
  B('house-main-blue', 'house-main-blue', H, 'Nhà chính – phối màu mái xanh dương, tường bạc hà', [4, 3],
    mainHouse({ wall: '#e2f4ea', gable: '#f1faf4', roof: '#73a9e0', door: '#e59a6b', post: PAL.white, shutter: PAL.yellow, chimney: '#c8b4a8', flowers: [PAL.yellow, PAL.pink, PAL.white] }), ['home', 'variant']);
  B('house-main-lavender', 'house-main-lavender', H, 'Nhà chính – phối màu mái tím lavender, tường vàng kem', [4, 3],
    mainHouse({ wall: '#fff0c2', gable: '#fff7dc', roof: '#a58fdc', door: '#c9845e', post: PAL.white, shutter: '#f5a3bd', chimney: '#d9a38c', flowers: [PAL.pink, PAL.white, PAL.orange] }), ['home', 'variant']);

  const C = { w: 230, h: 230, ox: 115, oy: 218 };
  B('cottage-1', 'cottage-1', C, 'Nhà nhỏ 1: mái dốc xanh ngọc, tường kem (nhà khách/bạn bè)', [3, 2],
    smallCottage({ style: 'slope', wall: '#fff3dc', roof: '#5fb8b0', door: '#d98e64', shutter: PAL.pink, flowers: [PAL.pink, PAL.yellow], tiles: 'scallop' }), ['cottage', 'placeable']);
  B('cottage-2', 'cottage-2', C, 'Nhà nhỏ 2: mái tròn lợp rơm vàng, tường đá-vữa (nhà rơm)', [3, 2],
    smallCottage({ style: 'dome', wall: '#f4e6d4', roof: '#f1c56a', door: '#9fc66b', flowers: [PAL.orange, PAL.rose] }), ['cottage', 'placeable']);
  B('cottage-3', 'cottage-3', { w: 230, h: 240, ox: 115, oy: 226 }, 'Nhà nhỏ 3: nhà chữ A mái tím, mặt hồi gỗ', [3, 2],
    smallCottage({ style: 'aframe', W: 150, wall: '#f2c99d', roof: '#9b85d9', door: '#7fc0a0', flowers: [PAL.yellow, PAL.white] }), ['cottage', 'placeable']);

  // ── chuồng thỏ ──
  B('bunny-hutch', 'bunny-hutch', { w: 170, h: 150, ox: 85, oy: 140 }, 'Chuồng thỏ gỗ trên chân, có lưới, cỏ khô và cà rốt', [2, 1], (doc, ox, oy) => {
    const cx = ox, by = oy - 4;
    const W = 120;
    let s = baseShadow(cx, oy - 4, 74, 15);
    const wood = '#e3a774', wr = ramp(wood);
    // chân
    for (const x of [cx - W / 2 + 6, cx + W / 2 - 14]) s += plank(doc, x, by - 34, 8, 34, PAL.woodDark, LINE.sm, false);
    // thân hộp
    s += rect(cx - W / 2, by - 92, W, 60, 6, doc.vgrad(wood), wr.line, LINE.md);
    for (let y = by - 80; y < by - 36; y += 11) s += stroke(`M${cx - W / 2 + 3},${y} L${cx + W / 2 - 3},${y}`, wr.lo, LINE.xs, 'opacity="0.5"');
    // ô lưới
    s += rect(cx - W / 2 + 10, by - 84, 54, 44, 4, '#6e5a7d', wr.line, LINE.sm);
    const cl = doc.clip(`<rect x="${cx - W / 2 + 12}" y="${by - 82}" width="50" height="40" rx="3"/>`);
    let mesh = `<rect x="${cx - W / 2 + 10}" y="${by - 84}" width="54" height="44" fill="${doc.linear([[0, '#8d7aa3'], [1, '#5c4a6e']])}"/>`;
    // hai tai thỏ nhô lên trong chuồng
    mesh += ellipse(cx - 28, by - 46, 13, 10, PAL.white, ramp(PAL.stone).line, LINE.sm);
    mesh += ellipse(cx - 33, by - 62, 4, 10, PAL.white, ramp(PAL.stone).line, LINE.sm) + ellipse(cx - 24, by - 63, 4, 10, PAL.white, ramp(PAL.stone).line, LINE.sm);
    mesh += circle(cx - 31, by - 49, 1.6, PAL.ink, null) + circle(cx - 24, by - 49, 1.6, PAL.ink, null);
    for (let x = cx - W / 2 + 10; x < cx; x += 8) mesh += stroke(`M${x},${by - 84} L${x + 22},${by - 40}`, '#e6dcfb', 1, 'opacity="0.75"') + stroke(`M${x + 22},${by - 84} L${x},${by - 40}`, '#e6dcfb', 1, 'opacity="0.75"');
    s += `<g clip-path="${cl}">${mesh}</g>`;
    s += rect(cx - W / 2 + 10, by - 84, 54, 44, 4, 'none', wr.line, LINE.sm);
    // cửa gỗ phải
    s += rect(cx + 8, by - 84, 42, 44, 4, doc.vgrad(lighten(wood, 0.15)), wr.line, LINE.sm);
    s += stroke(`M${cx + 12},${by - 80} L${cx + 46},${by - 44} M${cx + 46},${by - 80} L${cx + 12},${by - 44}`, wr.lo, LINE.sm);
    s += circle(cx + 44, by - 62, 2.4, PAL.yellow, ramp(PAL.yellow).line, LINE.xs);
    // mái
    s += roofSlope(doc, cx, by - 90, by - 126, W / 2 + 12, W / 2 - 6, PAL.coral, { tiles: 'rows', step: 10 }).svg;
    // cỏ khô + cà rốt
    s += leafTuft(doc, cx - 12, by + 2, 60, 12, PAL.yellow, 4, LINE.sm);
    const carrot = (x, y, rot) => `<g transform="rotate(${rot} ${x} ${y})">${shape(`M${x - 5},${y} Q${x},${y + 22} ${x + 1},${y + 22} Q${x + 3},${y + 10} ${x + 5},${y}Z`, doc.vgrad(PAL.orange), ramp(PAL.orange).line, LINE.sm)}${leafMark(x - 3, y - 5, 5, PAL.leaf, -20)}${leafMark(x + 3, y - 5, 5, PAL.leafDark, 20)}</g>`;
    s += carrot(cx + 38, by - 10, 70) + carrot(cx + 50, by - 4, 85);
    // ramp gỗ
    s += shape(`M${cx + 8},${by - 32} L${cx + 26},${by - 32} L${cx + 34},${by + 2} L${cx + 14},${by + 2}Z`, doc.vgrad(PAL.woodLight), wr.line, LINE.sm);
    return s;
  }, ['animal', 'placeable']);

  // ── nhà thú cưng (kiểu chuồng chó) ──
  B('pet-house', 'pet-house', { w: 130, h: 130, ox: 65, oy: 120 }, 'Nhà thú cưng (kiểu nhà gỗ chó): cửa vòm, gối nằm, khay đồ ăn', [2, 1], (doc, ox, oy) => {
    const cx = ox, by = oy - 4;
    let s = baseShadow(cx, oy - 4, 60, 14);
    const wall = '#ffd59e', wr = ramp(wall);
    const face = `M${cx - 40},${by} L${cx - 40},${by - 46} L${cx},${by - 82} L${cx + 40},${by - 46} L${cx + 40},${by}Z`;
    // mái hai bên nhìn từ trên
    const rc = '#73a9e0', rr = ramp(rc);
    s += shape(`M${cx},${by - 98} L${cx - 54},${by - 48} L${cx - 46},${by - 38} L${cx},${by - 80} L${cx + 46},${by - 38} L${cx + 54},${by - 48}Z`, doc.vgrad(lighten(rc, 0.1)), rr.line, LINE.md);
    s += shape(face, doc.vgrad(wall), wr.line, LINE.md);
    const cl = doc.clip(`<path d="${face}"/>`);
    s += `<g clip-path="${cl}">`;
    for (let x = cx - 40; x < cx + 40; x += 11) s += stroke(`M${x},${by - 90} L${x},${by}`, wr.lo, LINE.xs, 'opacity="0.5"');
    s += `</g>`;
    s += shape(`M${cx},${by - 96} L${cx - 56},${by - 44} L${cx - 46},${by - 36} L${cx},${by - 78} L${cx + 46},${by - 36} L${cx + 56},${by - 44}Z`, doc.linear([[0, lighten(rc, 0.3)], [1, rc]]), rr.line, LINE.md);
    // cửa vòm tối
    s += shape(`M${cx - 18},${by} L${cx - 18},${by - 26} A18,18 0 0 1 ${cx + 18},${by - 26} L${cx + 18},${by}Z`, doc.linear([[0, '#5d4a72'], [1, '#3f3152']]), wr.line, LINE.md);
    s += ellipse(cx, by - 4, 16, 5, PAL.rose, null, 0, 'opacity="0.9"');
    // biển tên trống (không chữ) + khúc xương
    s += rect(cx - 14, by - 64, 28, 12, 4, PAL.white, wr.line, LINE.sm);
    s += shape(`M${cx - 6},${by - 58} L${cx + 6},${by - 58}`, 'none', PAL.stoneDark, 3);
    s += circle(cx - 7, by - 60, 2, PAL.stoneDark, null) + circle(cx - 7, by - 56, 2, PAL.stoneDark, null) + circle(cx + 7, by - 60, 2, PAL.stoneDark, null) + circle(cx + 7, by - 56, 2, PAL.stoneDark, null);
    // bát ăn
    s += ellipse(cx + 46, by + 2, 13, 5, doc.vgrad(PAL.coral), ramp(PAL.coral).line, LINE.sm);
    s += shape(`M${cx + 33},${by + 1} Q${cx + 34},${by + 10} ${cx + 46},${by + 10} Q${cx + 58},${by + 10} ${cx + 59},${by + 1}`, doc.vgrad(PAL.coral), ramp(PAL.coral).line, LINE.sm);
    s += ellipse(cx + 46, by + 1, 10, 3, '#c99062', null);
    return s;
  }, ['animal', 'pet', 'placeable']);

  // ── chuồng gà / kho nhỏ (barn) ──
  B('barn', 'barn', { w: 220, h: 230, ox: 110, oy: 218 }, 'Kho thóc nhỏ / chuồng gà màu đỏ hồng, cửa chữ X, ô gác mái', [3, 2], (doc, ox, oy) => {
    const cx = ox, by = oy - 6, W = 150, wallH = 92;
    const red = '#ee7b78', rr = ramp(red);
    let s = baseShadow(cx, oy - 4, 96, 20);
    // mái gambrel nhìn từ trên: 2 mặt
    const eave = by - wallH + 4;
    const roofC = '#8f7fb8';
    s += roofSlope(doc, cx, eave, eave - 40, W / 2 + 16, W / 2 + 4, roofC, { tiles: 'rows', ridge: false, step: 10 }).svg;
    s += roofSlope(doc, cx, eave - 38, eave - 76, W / 2 + 4, W / 2 - 22, lighten(roofC, 0.12), { tiles: 'rows', step: 10 }).svg;
    s += wallFront(doc, cx - W / 2, cx + W / 2, by - wallH + 10, by, red, { post: PAL.white, siding: false });
    for (let x = cx - W / 2 + 12; x < cx + W / 2 - 6; x += 12) s += stroke(`M${x},${by - wallH + 26} L${x},${by - 14}`, rr.lo, LINE.xs, 'opacity="0.5"');
    // cửa đôi chữ X
    const dw = 58, dh = 58;
    s += rect(cx - dw / 2, by - dh - 2, dw, dh, 3, doc.vgrad(PAL.white), rr.line, LINE.md);
    s += rect(cx - dw / 2 + 5, by - dh + 3, dw / 2 - 7, dh - 10, 2, doc.vgrad(red), rr.line, LINE.sm);
    s += rect(cx + 2, by - dh + 3, dw / 2 - 7, dh - 10, 2, doc.vgrad(red), rr.line, LINE.sm);
    s += stroke(`M${cx - dw / 2 + 6},${by - dh + 4} L${cx - 3},${by - 8} M${cx - 3},${by - dh + 4} L${cx - dw / 2 + 6},${by - 8}`, PAL.white, 3.4);
    s += stroke(`M${cx + 3},${by - dh + 4} L${cx + dw / 2 - 6},${by - 8} M${cx + dw / 2 - 6},${by - dh + 4} L${cx + 3},${by - 8}`, PAL.white, 3.4);
    // ô gác mái tròn
    s += roundWindow(doc, cx, eave - 30, 13, { frame: PAL.white });
    // cửa sổ bên + gà con
    s += windowBox(doc, cx - W / 2 + 12, by - 70, 26, 26, { frame: PAL.white, sill: false });
    s += windowBox(doc, cx + W / 2 - 38, by - 70, 26, 26, { frame: PAL.white, sill: false });
    // ổ rơm + gà con
    s += leafTuft(doc, cx + 70, by + 4, 40, 12, PAL.yellow, 8, LINE.sm);
    const chick = (x, y) => circle(x, y - 7, 7, doc.sphere(PAL.yellowLight), ramp(PAL.yellow).line, LINE.sm) + circle(x + 2, y - 9, 1.3, PAL.ink, null) + shape(`M${x + 6},${y - 8} l4,1.5 l-4,1.5Z`, PAL.orange, ramp(PAL.orange).line, 1);
    s += chick(cx + 62, by - 2) + chick(cx + 78, by + 1);
    s += steps(doc, cx, oy + 1, 62, 1, PAL.stoneLight);
    return s;
  }, ['animal', 'farm', 'placeable']);

  // ── trường học ──
  B('school', 'school', { w: 330, h: 330, ox: 165, oy: 316 }, 'Trường học nhỏ của đảo: tháp chuông, đồng hồ (không số), cửa sổ lớn, cờ', [4, 3], (doc, ox, oy) => {
    const cx = ox, by = oy - 10, W = 250, wallH = 104;
    const wall = '#ffe1b8', roof = '#f2a35e';
    let s = baseShadow(cx, oy - 6, 160, 26);
    const eave = by - wallH + 4, ridge = eave - 86;
    s += wallFront(doc, cx - W / 2, cx + W / 2, by - wallH, by, wall, { post: PAL.white, sidingStep: 14 });
    s += roofSlope(doc, cx, eave, ridge, W / 2 + 18, W / 2 - 14, roof, { tiles: 'rows' }).svg;
    // tháp chuông
    const tw = 54, tTop = ridge - 64;
    s += rect(cx - tw / 2, tTop, tw, ridge - tTop + 22, 5, doc.vgrad('#fff4e2'), ramp(wall).line, LINE.md);
    s += shape(`M${cx - 16},${tTop + 44} L${cx - 16},${tTop + 22} A16,16 0 0 1 ${cx + 16},${tTop + 22} L${cx + 16},${tTop + 44}Z`, '#6e5a7d', ramp(wall).line, LINE.sm);
    s += shape(`M${cx - 9},${tTop + 40} Q${cx - 9},${tTop + 22} ${cx},${tTop + 22} Q${cx + 9},${tTop + 22} ${cx + 9},${tTop + 40}Z`, doc.vgrad(PAL.yellow), ramp(PAL.yellow).line, LINE.sm);
    s += circle(cx, tTop + 42, 3, PAL.yellow, ramp(PAL.yellow).line, LINE.xs);
    s += shape(`M${cx - tw / 2 - 10},${tTop + 4} L${cx},${tTop - 44} L${cx + tw / 2 + 10},${tTop + 4}Z`, doc.vgrad('#e9746f'), ramp('#e9746f').line, LINE.md);
    s += stroke(`M${cx},${tTop - 44} L${cx},${tTop - 72}`, PAL.woodDark, LINE.sm);
    s += shape(`M${cx},${tTop - 72} L${cx + 22},${tTop - 66} L${cx},${tTop - 58}Z`, doc.vgrad(PAL.mint), ramp(PAL.mint).line, LINE.sm);
    // đồng hồ (không số)
    s += circle(cx, ridge + 36, 20, doc.vgrad(PAL.white), ramp(wall).line, LINE.md);
    s += circle(cx, ridge + 36, 15, '#fffdf8', ramp(wall).lo, LINE.xs);
    for (let k = 0; k < 12; k++) { const a = k / 12 * Math.PI * 2; s += circle(cx + Math.cos(a) * 12, ridge + 36 + Math.sin(a) * 12, 1.2, ramp(wall).line, null); }
    s += stroke(`M${cx},${ridge + 36} L${cx},${ridge + 26} M${cx},${ridge + 36} L${cx + 7},${ridge + 39}`, PAL.ink, LINE.sm);
    // cửa chính đôi
    s += rect(cx - 34, by - 80, 68, 78, 6, doc.vgrad('#fff4e2'), ramp(wall).line, LINE.md);
    s += door(doc, cx - 14, by - 2, 26, 62, '#79b7e0', { window: false });
    s += door(doc, cx + 14, by - 2, 26, 62, '#79b7e0', { window: false });
    s += shape(`M${cx - 44},${by - 82} L${cx + 44},${by - 82} L${cx + 36},${by - 96} L${cx - 36},${by - 96}Z`, doc.vgrad('#e9746f'), ramp('#e9746f').line, LINE.md);
    // dãy cửa sổ
    for (const wx of [cx - 112, cx - 74, cx + 44, cx + 82]) s += windowBox(doc, wx, by - 84, 30, 44, { frame: PAL.white });
    s += flowerBox(doc, cx - 118, by - 38, 74, PAL.wood, [PAL.rose, PAL.yellow], 3);
    s += flowerBox(doc, cx + 38, by - 38, 74, PAL.wood, [PAL.lavender, PAL.yellow], 7);
    s += steps(doc, cx, oy + 1, 80, 2);
    return s;
  }, ['public']);

  // ── cửa hàng tạp hoá ──
  B('grocery', 'grocery', { w: 300, h: 290, ox: 150, oy: 276 }, 'Cửa hàng tạp hoá: mái hiên sọc hồng-trắng, kệ trái cây/rau trước cửa', [4, 2], (doc, ox, oy) => {
    const cx = ox, by = oy - 10, W = 230, wallH = 110;
    const wall = '#d9f0e4', roof = '#62b3a8';
    let s = baseShadow(cx, oy - 6, 146, 24);
    const eave = by - wallH + 4, ridge = eave - 70;
    s += wallFront(doc, cx - W / 2, cx + W / 2, by - wallH, by, wall, { post: PAL.white });
    s += roofSlope(doc, cx, eave, ridge, W / 2 + 16, W / 2 - 12, roof, { tiles: 'scallop' }).svg;
    // bảng hiệu trống (không chữ) với hình quả táo
    s += rect(cx - 52, ridge + 14, 104, 34, 10, doc.vgrad(PAL.cream), ramp(PAL.wood).line, LINE.md);
    s += circle(cx, ridge + 32, 10, doc.sphere('#f2626b'), ramp('#f2626b').line, LINE.sm) + leafMark(cx + 4, ridge + 20, 4, PAL.leaf, 40);
    s += circle(cx - 28, ridge + 31, 6, doc.sphere(PAL.yellow), ramp(PAL.yellow).line, LINE.xs) + circle(cx + 28, ridge + 31, 6, doc.sphere(PAL.orange), ramp(PAL.orange).line, LINE.xs);
    // cửa kính + cửa sổ trưng bày
    s += windowBox(doc, cx - 102, by - 92, 62, 54, { frame: PAL.white, cross: false });
    s += windowBox(doc, cx + 40, by - 92, 62, 54, { frame: PAL.white, cross: false });
    s += door(doc, cx, by - 2, 42, 70, PAL.yellow, { window: true });
    // mái hiên sọc
    const ay = by - 106, ah = 24;
    const awn = `M${cx - W / 2 - 6},${ay} L${cx + W / 2 + 6},${ay} L${cx + W / 2 + 12},${ay + ah} L${cx - W / 2 - 12},${ay + ah}Z`;
    s += shape(awn, PAL.white, ramp(PAL.rose).line, LINE.md);
    const cl = doc.clip(`<path d="${awn}"/>`);
    let st = '';
    for (let k = 0; k < 12; k++) {
      const x0 = cx - W / 2 - 6 + k * ((W + 12) / 12);
      if (k % 2 === 0) st += `<path d="M${x0},${ay} L${x0 + (W + 12) / 12},${ay} L${x0 + (W + 12) / 12 + (k - 5.5) * 1.1},${ay + ah} L${x0 + (k - 6.5) * 1.1},${ay + ah}Z" fill="${PAL.rose}"/>`;
    }
    s += `<g clip-path="${cl}">${st}<rect x="${cx - W / 2 - 20}" y="${ay}" width="${W + 40}" height="6" fill="#fff" opacity="0.35"/></g>`;
    s += shape(awn, 'none', ramp(PAL.rose).line, LINE.md);
    // diềm lượn sóng
    let sc = `M${cx - W / 2 - 12},${ay + ah}`;
    const n = 12, step = (W + 24) / n;
    for (let k = 0; k < n; k++) sc += ` q${step / 2},${12} ${step},0`;
    s += shape(sc + 'Z', PAL.white, ramp(PAL.rose).line, LINE.sm);
    // kệ trái cây
    const crate = (x, fc) => {
      let c = shape(`M${x - 24},${by - 22} L${x + 24},${by - 22} L${x + 22},${by + 4} L${x - 22},${by + 4}Z`, doc.vgrad(PAL.woodLight), ramp(PAL.wood).line, LINE.sm);
      c += stroke(`M${x - 22},${by - 10} L${x + 22},${by - 10}`, ramp(PAL.wood).lo, LINE.xs);
      for (let i = 0; i < 4; i++) c += circle(x - 15 + i * 10, by - 24 - (i % 2) * 2, 6, doc.sphere(fc), ramp(fc).line, LINE.xs);
      for (let i = 0; i < 3; i++) c += circle(x - 10 + i * 10, by - 31, 5.5, doc.sphere(fc), ramp(fc).line, LINE.xs);
      return c;
    };
    s += crate(cx - 76, '#f2626b') + crate(cx - 26 - 18, PAL.orange);
    s += crate(cx + 62, '#9fd67c') + crate(cx + 96, PAL.yellow);
    s += steps(doc, cx, oy + 1, 56, 1);
    return s;
  }, ['shop', 'public']);

  // ── xưởng mộc / workshop ──
  B('workshop', 'workshop', { w: 260, h: 250, ox: 130, oy: 238 }, 'Xưởng thủ công: tường gỗ, cửa kho lớn, biểu tượng bánh răng, đống gỗ & bàn cưa', [3, 2], (doc, ox, oy) => {
    const cx = ox, by = oy - 8, W = 180, wallH = 96;
    const wall = '#dca57a', roof = '#7d8fb3';
    let s = baseShadow(cx, oy - 6, 120, 22);
    const eave = by - wallH + 4, ridge = eave - 70;
    s += chimney(doc, cx + 52, ridge - 18, eave - 24, 22, '#9aa0b5');
    s += wallFront(doc, cx - W / 2, cx + W / 2, by - wallH, by, wall, { post: PAL.woodDark, siding: false });
    for (let x = cx - W / 2 + 14; x < cx + W / 2 - 6; x += 14) s += stroke(`M${x},${by - wallH + 16} L${x},${by - 14}`, ramp(wall).lo, LINE.xs, 'opacity="0.55"');
    s += roofSlope(doc, cx, eave, ridge, W / 2 + 16, W / 2 - 12, roof, { tiles: 'rows' }).svg;
    // bánh răng trên mái
    const gx = cx - 30, gy = ridge + 34;
    let gear = '';
    for (let k = 0; k < 8; k++) { const a = k / 8 * 360; gear += `<rect x="${gx - 4}" y="${gy - 19}" width="8" height="10" rx="2" fill="${PAL.yellow}" stroke="${ramp(PAL.yellow).line}" stroke-width="${LINE.sm}" transform="rotate(${a} ${gx} ${gy})"/>`; }
    s += gear + circle(gx, gy, 13, doc.sphere(PAL.yellow), ramp(PAL.yellow).line, LINE.sm) + circle(gx, gy, 5, PAL.cream, ramp(PAL.yellow).line, LINE.sm);
    s += roundWindow(doc, cx + 30, ridge + 36, 11);
    // cửa kho trượt
    s += rect(cx - 34, by - 74, 68, 72, 4, doc.vgrad('#b9d9cf'), ramp('#b9d9cf').line, LINE.md);
    for (let x = cx - 34 + 11; x < cx + 34; x += 11) s += stroke(`M${x},${by - 72} L${x},${by - 4}`, ramp('#b9d9cf').lo, LINE.xs);
    s += stroke(`M${cx - 30},${by - 70} L${cx + 30},${by - 6}`, PAL.white, 3) + stroke(`M${cx + 30},${by - 70} L${cx - 30},${by - 6}`, PAL.white, 3);
    s += rect(cx - 40, by - 80, 80, 7, 3, '#6e6187', null);
    s += windowBox(doc, cx - 80, by - 74, 28, 30, { frame: PAL.cream });
    s += windowBox(doc, cx + 52, by - 74, 28, 30, { frame: PAL.cream });
    // đống gỗ
    const logs = (x, y) => {
      let l = '';
      [[0, 0], [16, 0], [8, -13]].forEach(([dx, dy]) => {
        l += circle(x + dx, y + dy, 8, doc.sphere(PAL.woodLight), ramp(PAL.wood).line, LINE.sm) + circle(x + dx, y + dy, 4, 'none', ramp(PAL.wood).lo, LINE.xs);
      });
      return l;
    };
    s += logs(cx - 112, by - 4);
    // bàn cưa / ngựa gỗ
    s += stroke(`M${cx + 86},${by + 2} L${cx + 94},${by - 22} L${cx + 102},${by + 2} M${cx + 112},${by + 2} L${cx + 120},${by - 22} L${cx + 128},${by + 2}`, ramp(PAL.wood).line, LINE.md);
    s += plank(doc, cx + 84, by - 27, 48, 8, PAL.woodLight, LINE.sm);
    s += steps(doc, cx, oy + 1, 70, 1, PAL.stone);
    return s;
  }, ['craft', 'public']);

  // ── xưởng vẽ ──
  B('art-studio', 'art-studio', { w: 260, h: 260, ox: 130, oy: 248 }, 'Xưởng vẽ: tường tím nhạt, cửa sổ mái kính lớn, bảng màu và vết sơn', [3, 2], (doc, ox, oy) => {
    const cx = ox, by = oy - 8, W = 180, wallH = 96;
    const wall = '#ecdcfb', roof = '#f59ab1';
    let s = baseShadow(cx, oy - 6, 120, 22);
    const eave = by - wallH + 4, ridge = eave - 78;
    s += wallFront(doc, cx - W / 2, cx + W / 2, by - wallH, by, wall, { post: PAL.white });
    const rs = roofSlope(doc, cx, eave, ridge, W / 2 + 16, W / 2 - 12, roof, { tiles: 'scallop' });
    s += rs.svg;
    // ô kính mái
    for (const [x, w] of [[cx - 66, 50], [cx + 4, 50]]) {
      s += rect(x, ridge + 14, w, 46, 4, PAL.white, ramp(roof).line, LINE.md);
      s += `<rect x="${x + 4}" y="${ridge + 18}" width="${w - 8}" height="38" rx="2" fill="${doc.linear([[0, PAL.skyLight], [1, PAL.sky]], 0, 0, 0.5, 1)}"/>`;
      s += stroke(`M${x + w / 2},${ridge + 16} L${x + w / 2},${ridge + 58} M${x + 4},${ridge + 37} L${x + w - 4},${ridge + 37}`, PAL.white, 3);
      s += `<path d="M${x + 8},${ridge + 56} L${x + w * 0.55},${ridge + 18} L${x + w * 0.75},${ridge + 18} L${x + 18},${ridge + 56}Z" fill="#fff" opacity="0.5"/>`;
    }
    // bảng màu treo
    const px = cx + 66, py = ridge + 34;
    s += shape(`M${px - 20},${py} C${px - 22},${py - 16} ${px + 10},${py - 22} ${px + 20},${py - 8} C${px + 26},${py + 4} ${px + 10},${py + 4} ${px + 6},${py + 10} C${px + 2},${py + 18} ${px - 18},${py + 16} ${px - 20},${py}Z`, doc.vgrad(PAL.woodLight), ramp(PAL.wood).line, LINE.sm);
    [[-10, -6, PAL.rose], [0, -11, PAL.yellow], [10, -7, PAL.sky], [-11, 5, PAL.mint]].forEach(([dx, dy, c]) => { s += circle(px + dx, py + dy, 3.6, c, ramp(c).line, LINE.xs); });
    // cửa + cửa sổ
    s += door(doc, cx - 26, by - 2, 38, 64, '#8fc9a6');
    s += windowBox(doc, cx + 10, by - 82, 62, 46, { frame: PAL.white });
    s += flowerBox(doc, cx + 6, by - 36, 70, PAL.wood, [PAL.yellow, PAL.rose, PAL.sky], 5);
    // vết sơn trên tường
    s += blobSplat(cx - 72, by - 64, PAL.sky) + blobSplat(cx - 64, by - 36, PAL.yellow) + blobSplat(cx + 80, by - 22, PAL.rose);
    // giá vẽ trước cửa
    const ex = cx + 104;
    s += stroke(`M${ex - 14},${by + 2} L${ex},${by - 52} L${ex + 14},${by + 2} M${ex},${by - 52} L${ex + 2},${by + 2}`, ramp(PAL.wood).line, LINE.md);
    s += rect(ex - 18, by - 46, 36, 30, 3, PAL.white, ramp(PAL.wood).line, LINE.sm);
    s += `<path d="M${ex - 14},${by - 22} Q${ex - 4},${by - 40} ${ex + 4},${by - 28} T${ex + 14},${by - 34} L${ex + 14},${by - 20} L${ex - 14},${by - 20}Z" fill="${PAL.mint}"/>` + circle(ex + 8, by - 38, 4, PAL.yellow, null);
    s += plank(doc, ex - 20, by - 18, 40, 5, PAL.woodLight, LINE.xs);
    s += steps(doc, cx - 26, oy + 1, 50, 1);
    return s;
  }, ['craft', 'public']);

  // ── nhà kính ──
  B('greenhouse', 'greenhouse', { w: 250, h: 220, ox: 125, oy: 208 }, 'Nhà kính trồng cây: khung trắng, mái vòm kính, cây xanh và chậu bên trong', [3, 2], (doc, ox, oy) => {
    const cx = ox, by = oy - 8, W = 180, wallH = 74;
    let s = baseShadow(cx, oy - 6, 120, 22);
    const frame = PAL.white, fr = ramp('#9ec7b8');
    const glassF = doc.linear([[0, '#e9fbf7', 0.95], [1, '#b6e3e0', 0.92]], 0, 0, 0.4, 1);
    // mái vòm (mặt trên nhìn thấy)
    const top = by - wallH - 74;
    const roofD = `M${cx - W / 2 - 6},${by - wallH + 4} C${cx - W / 2 - 4},${top + 20} ${cx - W / 2 + 30},${top} ${cx},${top} C${cx + W / 2 - 30},${top} ${cx + W / 2 + 4},${top + 20} ${cx + W / 2 + 6},${by - wallH + 4}Z`;
    s += shape(roofD, glassF, fr.line, LINE.md);
    const cl = doc.clip(`<path d="${roofD}"/>`);
    let inner = '';
    // cây nhìn qua kính mái
    inner += canopy(doc, cx - 40, by - wallH - 10, 34, 24, PAL.leaf, 5, { lw: LINE.sm, sparkles: 0 });
    inner += canopy(doc, cx + 36, by - wallH - 14, 30, 22, PAL.leafDark, 7, { lw: LINE.sm, sparkles: 0 });
    inner += `<rect x="${cx - W}" y="${top - 10}" width="${W * 2}" height="${wallH + 120}" fill="#e9fbf7" opacity="0.45"/>`;
    for (let k = -3; k <= 3; k++) inner += stroke(`M${cx + k * 26},${by - wallH + 4} Q${cx + k * 22},${top + 10} ${cx + k * 8},${top - 4}`, frame, 3.4);
    inner += stroke(`M${cx - W / 2},${by - wallH - 30} Q${cx},${top + 20} ${cx + W / 2},${by - wallH - 30}`, frame, 3.4);
    inner += `<path d="M${cx - 60},${by - wallH} L${cx - 20},${top} L${cx},${top} L${cx - 40},${by - wallH}Z" fill="#fff" opacity="0.45"/>`;
    s += `<g clip-path="${cl}">${inner}</g>` + shape(roofD, 'none', fr.line, LINE.md);
    s += rect(cx - 10, top - 8, 20, 10, 4, frame, fr.line, LINE.sm);
    // tường kính trước
    const wy = by - wallH;
    s += rect(cx - W / 2, wy, W, wallH, 4, glassF, fr.line, LINE.md);
    const cl2 = doc.clip(`<rect x="${cx - W / 2}" y="${wy}" width="${W}" height="${wallH}" rx="4"/>`);
    let iw = '';
    // kệ cây bên trong
    iw += rect(cx - W / 2, by - 26, W, 26, 0, '#cfe9d9', null);
    iw += leafTuft(doc, cx - 60, by - 22, 46, 26, PAL.leaf, 3, LINE.sm) + leafTuft(doc, cx + 56, by - 22, 46, 30, PAL.leafDark, 9, LINE.sm);
    iw += tulip(doc, cx - 70, by - 40, 6, PAL.rose) + tulip(doc, cx - 52, by - 44, 6, PAL.yellow) + tulip(doc, cx + 48, by - 46, 6, PAL.lavender) + tulip(doc, cx + 66, by - 42, 6, PAL.pink);
    for (const x of [cx - 74, cx - 48, cx + 44, cx + 70]) iw += shape(`M${x - 8},${by - 24} L${x + 8},${by - 24} L${x + 6},${by - 10} L${x - 6},${by - 10}Z`, doc.vgrad(PAL.orange), ramp(PAL.orange).line, LINE.sm);
    iw += `<rect x="${cx - W}" y="${wy}" width="${W * 2}" height="${wallH}" fill="#e9fbf7" opacity="0.35"/>`;
    for (let k = 1; k < 6; k++) iw += stroke(`M${cx - W / 2 + k * W / 6},${wy} L${cx - W / 2 + k * W / 6},${by}`, frame, 3.4);
    iw += stroke(`M${cx - W / 2},${wy + wallH * 0.45} L${cx + W / 2},${wy + wallH * 0.45}`, frame, 3.4);
    iw += `<path d="M${cx - 80},${by} L${cx - 50},${wy} L${cx - 30},${wy} L${cx - 60},${by}Z" fill="#fff" opacity="0.4"/>`;
    s += `<g clip-path="${cl2}">${iw}</g>` + rect(cx - W / 2, wy, W, wallH, 4, 'none', fr.line, LINE.md);
    // cửa kính giữa
    s += rect(cx - 18, by - 60, 36, 58, 4, doc.linear([[0, '#f4fffc'], [1, '#c4ebe6']]), fr.line, LINE.md);
    s += stroke(`M${cx},${by - 58} L${cx},${by - 4}`, frame, 3) + circle(cx + 10, by - 30, 2.4, PAL.yellow, ramp(PAL.yellow).line, LINE.xs);
    s += foundation(doc, cx - W / 2 - 4, cx + W / 2 + 4, by + 4, PAL.stoneLight);
    s += steps(doc, cx, oy + 1, 44, 1);
    // chậu cây ngoài cửa
    s += leafTuft(doc, cx - 34, by + 4, 22, 18, PAL.leaf, 4, LINE.sm) + shape(`M${cx - 42},${by + 2} L${cx - 26},${by + 2} L${cx - 28},${by + 14} L${cx - 40},${by + 14}Z`, doc.vgrad(PAL.orange), ramp(PAL.orange).line, LINE.sm);
    return s;
  }, ['garden', 'placeable']);

  // ── hải đăng ──
  B('lighthouse', 'lighthouse', { w: 170, h: 320, ox: 85, oy: 306 }, 'Hải đăng sọc đỏ-trắng trên bệ đá, phòng đèn vàng sáng, ban công', [2, 2], (doc, ox, oy) => {
    const cx = ox, by = oy - 8;
    let s = baseShadow(cx, oy - 6, 76, 18);
    const red = '#ee6f6f', rr = ramp(red);
    // nhà nhỏ cạnh chân
    s += wallFront(doc, cx + 22, cx + 84, by - 46, by, PAL.white, { posts: false, foundation: false, eaveShadow: 8 });
    s += roofSlope(doc, cx + 53, by - 44, by - 70, 40, 30, '#73a9e0', { tiles: 'rows', step: 9 }).svg;
    s += door(doc, cx + 66, by - 2, 18, 30, PAL.wood, { window: false });
    s += windowBox(doc, cx + 42, by - 34, 12, 14, { sill: false, cross: false, lw: LINE.sm });
    // thân tháp thon
    const bw = 40, tw = 26, tTop = by - 214;
    const tower = `M${cx - bw},${by} L${cx - tw},${tTop} L${cx + tw},${tTop} L${cx + bw},${by}Z`;
    s += shape(tower, doc.linear([[0, '#fffdf8'], [0.55, PAL.white], [1, '#e2d9ea']], 0, 0, 1, 0), rr.line, LINE.lg);
    const cl = doc.clip(`<path d="${tower}"/>`);
    let band = '';
    for (let k = 0; k < 3; k++) {
      const y0 = by - 30 - k * 64, y1 = y0 - 30;
      band += `<path d="M${cx - 60},${y0 + 6} Q${cx},${y0 + 16} ${cx + 60},${y0 + 6} L${cx + 60},${y1 + 6} Q${cx},${y1 + 16} ${cx - 60},${y1 + 6}Z" fill="${doc.linear([[0, lighten(red, 0.2)], [0.55, red], [1, darken(red, 0.15)]], 0, 0, 1, 0)}"/>`;
    }
    band += `<path d="M${cx + 8},${by} L${cx + 20},${tTop} L${cx + 40},${tTop} L${cx + 50},${by}Z" fill="${PAL.purple}" opacity="0.14"/>`;
    s += `<g clip-path="${cl}">${band}</g>` + shape(tower, 'none', rr.line, LINE.lg);
    s += windowBox(doc, cx - 8, by - 120, 16, 22, { arch: true, sill: false, cross: false });
    s += windowBox(doc, cx - 7, by - 180, 14, 18, { arch: true, sill: false, cross: false });
    s += door(doc, cx - 6, by - 2, 24, 40, '#73a9e0', { window: false });
    // ban công
    s += ellipse(cx, tTop + 2, 40, 9, doc.vgrad(PAL.stoneLight), ramp(PAL.stone).line, LINE.md);
    // phòng đèn
    s += glow(doc, cx, tTop - 26, 60, PAL.yellowLight, 0.8);
    s += rect(cx - 20, tTop - 44, 40, 40, 6, doc.linear([[0, PAL.yellowLight], [1, PAL.yellow]]), ramp(PAL.yellow).line, LINE.md);
    s += circle(cx, tTop - 24, 10, '#fff', null, 0, 'opacity="0.85"');
    s += stroke(`M${cx - 7},${tTop - 44} L${cx - 7},${tTop - 4} M${cx + 7},${tTop - 44} L${cx + 7},${tTop - 4}`, ramp(PAL.yellow).line, LINE.sm);
    // lan can
    s += stroke(`M${cx - 36},${tTop - 2} L${cx + 36},${tTop - 2}`, ramp(PAL.stone).line, LINE.sm);
    for (let k = -3; k <= 3; k++) s += stroke(`M${cx + k * 11},${tTop - 2} L${cx + k * 11},${tTop - 14}`, ramp(PAL.stone).line, LINE.sm);
    s += stroke(`M${cx - 36},${tTop - 14} L${cx + 36},${tTop - 14}`, ramp(PAL.stone).line, LINE.sm);
    // mái chóp
    s += shape(`M${cx - 30},${tTop - 42} Q${cx},${tTop - 92} ${cx + 30},${tTop - 42} Q${cx},${tTop - 34} ${cx - 30},${tTop - 42}Z`, doc.sphere(red), rr.line, LINE.md);
    s += circle(cx, tTop - 70, 5, doc.sphere(PAL.yellow), ramp(PAL.yellow).line, LINE.sm);
    s += gloss(cx - 12, tTop - 56, 7, 4, 0.5);
    // bệ đá
    s += shape(blob(cx - 6, by + 2, 56, 10, 9, 0.1, 3), doc.vgrad(PAL.stone), ramp(PAL.stone).line, LINE.md);
    return s;
  }, ['landmark', 'coast']);

  // ── trạm tàu ngầm ──
  B('submarine-station', 'submarine-station', { w: 340, h: 280, ox: 170, oy: 262 }, 'Trạm tàu ngầm: nhà trên cầu cảng gỗ, tàu ngầm vàng dễ thương neo bên cạnh – đặt ở mép nước/bãi biển', [4, 3], (doc, ox, oy) => {
    const cx = ox, by = oy - 10;
    let s = '';
    // nước vỗ quanh trụ
    const water = PAL.ocean;
    s += ellipse(cx + 70, by + 2, 120, 16, alpha(PAL.oceanDeep, 0.25), null);
    // cầu cảng gỗ (mặt trên)
    const deckY = by - 30;
    s += shape(`M${cx - 150},${deckY} L${cx + 40},${deckY} L${cx + 46},${deckY + 22} L${cx - 156},${deckY + 22}Z`, doc.vgrad(PAL.woodLight), ramp(PAL.wood).line, LINE.md);
    for (let x = cx - 136; x < cx + 40; x += 18) s += stroke(`M${x},${deckY + 2} L${x - 1},${deckY + 20}`, ramp(PAL.woodLight).lo, LINE.xs);
    s += rect(cx - 156, deckY + 20, 202, 9, 4, doc.vgrad(PAL.wood), ramp(PAL.wood).line, LINE.sm);
    for (const x of [cx - 146, cx - 90, cx - 34, cx + 30]) {
      s += rect(x, deckY + 26, 12, 30, 4, doc.vgrad(PAL.woodDark), ramp(PAL.woodDark).line, LINE.sm);
      s += ellipse(x + 6, deckY + 56, 12, 3.5, alpha(PAL.foam, 0.9), null);
    }
    // nhà trạm (vòm tròn kiểu tàu)
    const hx = cx - 70, hy = deckY;
    const wall = '#ffe9a8', wr = ramp(wall);
    s += rect(hx - 62, hy - 78, 124, 80, 10, doc.vgrad(wall), wr.line, LINE.lg);
    for (let y = hy - 64; y < hy - 4; y += 14) s += stroke(`M${hx - 58},${y} L${hx + 58},${y}`, wr.lo, LINE.xs, 'opacity="0.4"');
    // đinh tán
    for (let x = hx - 52; x <= hx + 52; x += 13) s += circle(x, hy - 70, 1.8, wr.lo, null);
    const roofC = '#5aa9d8';
    s += shape(`M${hx - 72},${hy - 74} Q${hx - 70},${hy - 142} ${hx},${hy - 144} Q${hx + 70},${hy - 142} ${hx + 72},${hy - 74}Z`, doc.sphere(roofC, 0.9), ramp(roofC).line, LINE.lg);
    s += rect(hx - 76, hy - 82, 152, 12, 6, doc.vgrad(lighten(roofC, 0.3)), ramp(roofC).line, LINE.md);
    s += gloss(hx - 30, hy - 124, 22, 8, 0.4);
    // kính tiềm vọng/ăng ten
    s += stroke(`M${hx + 30},${hy - 132} L${hx + 30},${hy - 160} L${hx + 42},${hy - 160}`, ramp(PAL.stone).line, LINE.md + 2) + stroke(`M${hx + 30},${hy - 132} L${hx + 30},${hy - 160} L${hx + 42},${hy - 160}`, PAL.stoneLight, LINE.md - 1);
    s += circle(hx + 44, hy - 160, 5, doc.sphere(PAL.coral), ramp(PAL.coral).line, LINE.sm);
    s += roundWindow(doc, hx, hy - 108, 16, { frame: PAL.stoneLight, frameLine: PAL.stoneDark });
    s += roundWindow(doc, hx - 38, hy - 44, 13, { frame: PAL.stoneLight, frameLine: PAL.stoneDark });
    s += door(doc, hx + 26, hy, 30, 52, '#73a9e0', { window: true, frame: PAL.stoneLight, frameLine: PAL.stoneDark });
    // phao cứu sinh
    s += circle(hx - 4, hy - 40, 11, 'none', ramp(PAL.coral).line, 9) + circle(hx - 4, hy - 40, 11, 'none', PAL.white, 6.4);
    for (let k = 0; k < 4; k++) s += `<path d="M${hx - 4},${hy - 51} a11,11 0 0 1 7.8,3.2" stroke="${PAL.coral}" stroke-width="6.4" fill="none" transform="rotate(${k * 90 + 20} ${hx - 4} ${hy - 40})"/>`;
    // tàu ngầm
    const sx = cx + 104, sy = by - 12;
    const sub = PAL.yellow, sr = ramp(sub);
    s += ellipse(sx, sy + 12, 82, 12, alpha(PAL.oceanDeep, 0.3), null);
    s += shape(`M${sx - 70},${sy} C${sx - 70},${sy - 44} ${sx + 58},${sy - 46} ${sx + 66},${sy - 6} C${sx + 70},${sy + 10} ${sx - 64},${sy + 14} ${sx - 70},${sy}Z`, doc.sphere(sub, 1), sr.line, LINE.lg);
    // tháp chỉ huy
    s += shape(`M${sx - 22},${sy - 34} L${sx - 18},${sy - 62} Q${sx},${sy - 68} ${sx + 18},${sy - 62} L${sx + 24},${sy - 34}Z`, doc.vgrad(sub), sr.line, LINE.md);
    s += stroke(`M${sx + 6},${sy - 64} L${sx + 6},${sy - 84} L${sx + 18},${sy - 84}`, sr.line, LINE.md + 1.5) + stroke(`M${sx + 6},${sy - 64} L${sx + 6},${sy - 84} L${sx + 18},${sy - 84}`, PAL.orange, LINE.sm);
    for (const x of [sx - 34, sx - 4, sx + 26]) s += roundWindow(doc, x, sy - 18, 9, { frame: PAL.stoneLight, frameLine: PAL.stoneDark, cross: false });
    s += shape(`M${sx - 66},${sy - 4} Q${sx - 80},${sy - 30} ${sx - 86},${sy - 26} Q${sx - 90},${sy - 6} ${sx - 84},${sy + 10} Q${sx - 76},${sy + 10} ${sx - 66},${sy}Z`, doc.vgrad(PAL.orange), ramp(PAL.orange).line, LINE.md);
    s += circle(sx - 70, sy - 4, 4, doc.sphere(PAL.stoneLight), ramp(PAL.stone).line, LINE.sm);
    s += gloss(sx - 30, sy - 34, 22, 6, 0.55, -8);
    // gợn nước trước tàu
    s += shape(`M${sx - 90},${sy + 8} q10,-6 20,0 t20,0 t20,0 t20,0 t20,0 t20,0 t20,0 t20,0 L${sx + 70},${sy + 18} L${sx - 90},${sy + 18}Z`, alpha(PAL.oceanLight, 0.9), alpha('#3d8ccc', 0.6), LINE.sm);
    s += stroke(`M${sx - 84},${sy + 9} q10,-6 20,0 t20,0 t20,0 t20,0 t20,0 t20,0 t20,0 t20,0`, PAL.foam, LINE.sm);
    // dây neo
    s += stroke(`M${cx + 36},${deckY + 6} Q${cx + 50},${sy - 6} ${sx - 58},${sy - 16}`, PAL.cream, 2.4);
    s += rect(cx + 30, deckY - 10, 10, 14, 4, doc.vgrad(PAL.woodDark), ramp(PAL.woodDark).line, LINE.sm);
    return s;
  }, ['ocean', 'coast']);
}

function blobSplat(x, y, c) {
  return `<path d="${blob(x, y, 7, 5, 7, 0.35, Math.round(x + y))}" fill="${c}" opacity="0.8"/>` + circle(x + 9, y + 5, 2, c, null, 0, 'opacity="0.8"');
}
