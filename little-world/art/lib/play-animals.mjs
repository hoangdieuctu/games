// ── Little World · Phase 2: 16 con vật chibi cho mini-game (play/animals) ──
// Khung 200×200 đơn vị (xuất @2x = 400 px). Dáng "thú bông chibi" giống bộ thú cưng:
// đầu to, thân tròn, chân ngắn, mắt "đá quý" có 2 chấm sáng, má hồng, viền cùng tông màu.
import { PAL, LINE, ramp, lighten, darken, mix, smoothPath, puffPath, blob, gloss, r2 } from './style.mjs';
import { eye, mouth, blush, heartPath } from './characters-rig.mjs';

export const AW = 200, AH = 200, CX = 100, GY = 186;
const LW = 4.6, LS = 3.2;

const lineOf = (c) => mix(ramp(c).line, PAL.ink, 0.3);
export const P = (d, fill, line, w = LW, extra = '') => `<path d="${d}" fill="${fill}" stroke="${line}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round" ${extra}/>`;
export const L = (d, color, w = LS, extra = '') => `<path d="${d}" fill="none" stroke="${color}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round" ${extra}/>`;
export const E = (cx, cy, rx, ry, fill, line, w = LW, extra = '') => `<ellipse cx="${r2(cx)}" cy="${r2(cy)}" rx="${r2(rx)}" ry="${r2(ry)}" fill="${fill}" ${line ? `stroke="${line}" stroke-width="${w}"` : ''} ${extra}/>`;
export const ell = (cx, cy, rx, ry, rot = 0) => {
  const k = 0.5523, a = (rot * Math.PI) / 180, c = Math.cos(a), s = Math.sin(a);
  const pt = (x, y) => [cx + x * c - y * s, cy + x * s + y * c];
  const q = [[rx, 0], [0, ry], [-rx, 0], [0, -ry]];
  const cp = [[[rx, ry * k], [rx * k, ry]], [[-rx * k, ry], [-rx, ry * k]], [[-rx, -ry * k], [-rx * k, -ry]], [[rx * k, -ry], [rx, -ry * k]]];
  const p0 = pt(...q[0]);
  let d = `M${r2(p0[0])},${r2(p0[1])}`;
  for (let i = 0; i < 4; i++) {
    const c1 = pt(...cp[i][0]), c2 = pt(...cp[i][1]), e = pt(...q[(i + 1) % 4]);
    d += ` C${r2(c1[0])},${r2(c1[1])} ${r2(c2[0])},${r2(c2[1])} ${r2(e[0])},${r2(e[1])}`;
  }
  return d + 'Z';
};
const shadow = (rx = 58) => E(CX + 4, GY, rx, rx * 0.17, PAL.shadow, null) + E(CX + 3, GY, rx * 0.7, rx * 0.12, PAL.shadow, null);
const glossy = (cx, cy, rx, ry, op = 0.42) => gloss(cx, cy, rx, ry, op);

/** Mặt chuẩn: 2 mắt, má hồng, miệng. o: { cx, cy, dx, rx, ry, mouth, my, ms, blushDx, blushDy, glow, eyes } */
function face(doc, o) {
  const dx = o.dx ?? 21, ey = o.cy + (o.ey ?? 4);
  let s = '';
  for (const sgn of [-1, 1]) s += eye(doc, { x: o.cx + sgn * dx, y: ey, rx: o.rx ?? 7.4, ry: o.ry ?? 9.4, lw: 3.6, glow: o.glow, state: o.eyes });
  if (o.blush !== false) for (const sgn of [-1, 1]) s += blush(o.cx + sgn * (o.blushDx ?? 37), o.cy + (o.blushDy ?? 22), 9, 5.6, 0.62, o.blushColor || PAL.pink);
  if (o.mouth !== 'none') s += mouth({ x: o.cx, y: o.cy + (o.my ?? 24), s: o.ms ?? 2.3, kind: o.mouth || 'cat', lw: 3.4 });
  return s;
}

/** Thân + chân + bụng chuẩn. */
function torso(doc, c, o = {}) {
  const line = o.line || lineOf(c);
  const cy = o.cy ?? 150, rx = o.rx ?? 40, ry = o.ry ?? 32;
  const feet = o.feet || darken(c, 0.06);
  let s = '';
  for (const sgn of [-1, 1]) s += P(ell(CX + sgn * (o.fx ?? 22), GY - 7, o.frx ?? 16, o.fry ?? 10), doc.sphere(feet, 1), line, LS + 0.4);
  s += P(ell(CX, cy, rx, ry), doc.sphere(c, 1.1), line, LW);
  if (o.belly) {
    const id = doc.clip(`<path d="${ell(CX, cy, rx - 1.5, ry - 1.5)}"/>`);
    s += `<g clip-path="${id}">${E(CX, cy + 8, rx * 0.62, ry * 0.75, doc.sphere(o.belly, 0.5), null)}</g>`;
  }
  // tay
  if (o.arms !== false) for (const sgn of [-1, 1]) {
    s += P(ell(CX + sgn * (rx - 6), cy + 2, 11, 15, sgn * -18), doc.sphere(o.arm || c, 1), line, LS + 0.4);
  }
  s += glossy(CX - rx * 0.42, cy - ry * 0.45, rx * 0.22, ry * 0.14, 0.38);
  return s;
}

/** Đầu chuẩn (elip) + vệt sáng. */
function headShape(doc, c, cx = CX, cy = 86, rx = 56, ry = 47, line = lineOf(c)) {
  return P(ell(cx, cy, rx, ry), doc.sphere(c, 1.1), line, LW) + glossy(cx - rx * 0.45, cy - ry * 0.5, rx * 0.22, ry * 0.12, 0.45);
}
function muzzle(doc, cx, cy, rx, ry, color, line) {
  return P(ell(cx, cy, rx, ry), doc.sphere(color, 0.6), line, LS) + glossy(cx - rx * 0.35, cy - ry * 0.4, rx * 0.25, ry * 0.15, 0.5);
}
const triNose = (cx, cy, w = 7, h = 5, fill = '#e98aa0', line = PAL.ink) =>
  P(`M${r2(cx - w)},${r2(cy - h * 0.5)} Q${r2(cx)},${r2(cy - h * 0.9)} ${r2(cx + w)},${r2(cy - h * 0.5)} Q${r2(cx + w * 0.4)},${r2(cy + h)} ${r2(cx)},${r2(cy + h)} Q${r2(cx - w * 0.4)},${r2(cy + h)} ${r2(cx - w)},${r2(cy - h * 0.5)}Z`, fill, line, 2.4)
  + E(cx - w * 0.3, cy - h * 0.2, w * 0.28, h * 0.22, '#fff', null, 0, 'opacity="0.7"');

function pointyEar(doc, x, y, w, h, tilt, c, inner, line) {
  const d = `M${r2(-w / 2)},0 Q${r2(-w * 0.35)},${r2(-h * 0.7)} ${r2(-w * 0.05)},${r2(-h)} Q${r2(w * 0.12)},${r2(-h * 1.02)} ${r2(w * 0.28)},${r2(-h * 0.8)} Q${r2(w * 0.5)},${r2(-h * 0.4)} ${r2(w / 2)},0Z`;
  const di = `M${r2(-w * 0.28)},${r2(-h * 0.08)} Q${r2(-w * 0.2)},${r2(-h * 0.6)} ${r2(-w * 0.02)},${r2(-h * 0.8)} Q${r2(w * 0.2)},${r2(-h * 0.55)} ${r2(w * 0.28)},${r2(-h * 0.08)}Z`;
  return `<g transform="translate(${r2(x)} ${r2(y)}) rotate(${r2(tilt)})">${P(d, doc.vgrad(c), line, LW)}${inner ? `<path d="${di}" fill="${inner}"/>` : ''}</g>`;
}
function roundEar(doc, x, y, r, c, inner, line) {
  return P(ell(x, y, r, r), doc.sphere(c, 1), line, LW) + (inner ? E(x + 1, y + 1, r * 0.55, r * 0.55, inner, null) : '');
}
const whiskers = (cx, cy, line) => [-1, 1].map((s) =>
  L(`M${r2(cx + s * 30)},${r2(cy)} L${r2(cx + s * 52)},${r2(cy - 5)}`, line, 2.4, 'opacity=".7"') +
  L(`M${r2(cx + s * 30)},${r2(cy + 6)} L${r2(cx + s * 52)},${r2(cy + 8)}`, line, 2.4, 'opacity=".7"')).join('');

// ───────────────────────── từng con vật ─────────────────────────
export const ANIMALS = {
  cat(doc) {
    const c = '#c9c1db', line = lineOf(c), inner = PAL.pink;
    let s = shadow();
    s += L(`M${CX + 34},${GY - 20} C${CX + 72},${GY - 22} ${CX + 74},${GY - 70} ${CX + 56},${GY - 86}`, line, 17) + L(`M${CX + 34},${GY - 20} C${CX + 72},${GY - 22} ${CX + 74},${GY - 70} ${CX + 56},${GY - 86}`, c, 10.5);
    s += E(CX + 56.5, GY - 85, 5.2, 5.2, '#fffaf2', null);
    s += torso(doc, c, { belly: '#f3effa', feet: '#f3effa' });
    s += pointyEar(doc, CX - 34, 60, 34, 40, -16, c, inner, line) + pointyEar(doc, CX + 34, 60, 34, 40, 16, c, inner, line);
    s += headShape(doc, c);
    // vằn trán
    for (const [dx, h] of [[-12, 13], [0, 17], [12, 13]]) s += L(`M${CX + dx},${42} l0,${h}`, darken(c, 0.25), 4.2);
    s += muzzle(doc, CX, 108, 21, 13, '#f3effa', line);
    s += face(doc, { cx: CX, cy: 84, glow: '#7fbf8f', my: 25.5, ms: 2.1 });
    s += triNose(CX, 104, 6, 4.4);
    s += whiskers(CX, 106, line);
    return s;
  },
  dog(doc) {
    const c = '#f4d8a6', line = lineOf('#d9a96a'), ear = '#b07a52';
    let s = shadow();
    s += L(`M${CX + 36},${GY - 30} Q${CX + 64},${GY - 44} ${CX + 62},${GY - 70}`, line, 15) + L(`M${CX + 36},${GY - 30} Q${CX + 64},${GY - 44} ${CX + 62},${GY - 70}`, c, 8.5);
    s += torso(doc, c, { belly: PAL.white, line });
    s += headShape(doc, c, CX, 86, 55, 46, line);
    // đốm mắt
    const cid = doc.clip(`<path d="${ell(CX, 86, 54, 45)}"/>`);
    s += `<g clip-path="${cid}">${E(CX + 24, 76, 20, 18, '#e4b77c', null)}</g>`;
    // tai cụp
    for (const sgn of [-1, 1]) s += P(`M${CX + sgn * 36},52 Q${CX + sgn * 70},50 ${CX + sgn * 70},90 Q${CX + sgn * 68},118 ${CX + sgn * 52},112 Q${CX + sgn * 44},88 ${CX + sgn * 32},62Z`, doc.vgrad(ear), lineOf(ear), LW);
    s += muzzle(doc, CX, 107, 23, 15, PAL.white, line);
    s += face(doc, { cx: CX, cy: 82, glow: '#b98552', mouth: 'catopen', my: 29, ms: 2.3 });
    s += P(ell(CX, 101, 9.5, 6.5), doc.sphere('#5a4568', 1), PAL.ink, 2.4) + E(CX - 3, 99, 3, 1.8, '#fff', null, 0, 'opacity=".75"');
    return s;
  },
  cow(doc) {
    const c = '#fffaf2', line = '#9a8aa8', spot = '#5d4f72';
    let s = shadow();
    s += torso(doc, c, { line, feet: '#7a6a8c', arm: c });
    const bid = doc.clip(`<path d="${ell(CX, 150, 39, 31)}"/>`);
    s += `<g clip-path="${bid}">${P(blob(CX + 22, 142, 16, 12, 7, 0.2, 3), spot, 'none', 0)}${P(blob(CX - 26, 162, 13, 10, 7, 0.2, 5), spot, 'none', 0)}</g>`;
    // sừng + tai
    for (const sgn of [-1, 1]) {
      s += P(`M${CX + sgn * 22},46 Q${CX + sgn * 30},24 ${CX + sgn * 40},22 Q${CX + sgn * 38},34 ${CX + sgn * 34},50Z`, doc.vgrad(PAL.yellowLight), '#c9a25a', LS);
      s += P(ell(CX + sgn * 62, 70, 17, 9, sgn * 20), doc.vgrad(c), line, LW) + E(CX + sgn * 62, 71, 10, 4.5, PAL.pink, null, 0, `transform="rotate(${sgn * 20} ${CX + sgn * 62} 71)"`);
    }
    s += headShape(doc, c, CX, 84, 52, 45, line);
    const hid = doc.clip(`<path d="${ell(CX, 84, 51, 44)}"/>`);
    s += `<g clip-path="${hid}">${P(blob(CX - 34, 62, 20, 17, 7, 0.18, 9), spot, 'none', 0)}</g>`;
    s += E(CX - 3, 47, 12, 7, spot, null); // chỏm lông
    s += muzzle(doc, CX, 110, 33, 19, '#ffc2d0', '#c97d93');
    for (const sgn of [-1, 1]) s += E(CX + sgn * 12, 108, 4, 5.5, '#b25d79', null);
    s += face(doc, { cx: CX, cy: 76, dx: 22, glow: '#8a70c8', blushDy: 18, blushDx: 40, mouth: 'tiny', my: 44, ms: 2.4 });
    return s;
  },
  pig(doc) {
    const c = '#ffc2d0', line = lineOf('#f58aa8');
    let s = shadow();
    s += L(`M${CX + 38},${GY - 34} c10,-2 14,-10 8,-14 c-6,-4 -12,4 -4,8 c8,4 14,-2 14,-8`, line, 4.6);
    s += torso(doc, c, { line, belly: '#ffdbe5' });
    for (const sgn of [-1, 1]) s += P(`M${CX + sgn * 22},50 Q${CX + sgn * 44},26 ${CX + sgn * 60},38 Q${CX + sgn * 62},58 ${CX + sgn * 46},70Z`, doc.vgrad(c), line, LW)
      + P(`M${CX + sgn * 36},52 Q${CX + sgn * 46},40 ${CX + sgn * 54},44 Q${CX + sgn * 52},54 ${CX + sgn * 44},60Z`, PAL.rose, 'none', 0, 'opacity=".6"');
    s += headShape(doc, c, CX, 88, 56, 46, line);
    s += muzzle(doc, CX, 104, 21, 15, '#ffa3ba', line);
    for (const sgn of [-1, 1]) s += E(CX + sgn * 8, 104, 4.2, 6.2, '#b25d79', null);
    s += face(doc, { cx: CX, cy: 80, dx: 26, glow: '#d7799b', mouth: 'tiny', my: 44, ms: 2.4, blushDx: 40, blushDy: 26 });
    return s;
  },
  duck(doc) {
    const c = PAL.white, line = '#a9a0c2', bill = PAL.orange;
    let s = shadow(54);
    s += P(ell(CX, 144, 48, 36), doc.sphere(c, 1.1), line, LW);
    for (const sgn of [-1, 1]) s += P(`M${CX + sgn * 22 - 15},${GY - 3} Q${CX + sgn * 22 - 6},${GY - 16} ${CX + sgn * 22},${GY - 12} Q${CX + sgn * 22 + 6},${GY - 16} ${CX + sgn * 22 + 15},${GY - 3} Q${CX + sgn * 22},${GY + 2} ${CX + sgn * 22 - 15},${GY - 3}Z`, doc.vgrad(PAL.orange), ramp(PAL.orange).line, LS);
    s += P(`M${CX + 40},128 Q${CX + 62},116 ${CX + 58},140 Q${CX + 50},152 ${CX + 40},150Z`, doc.vgrad(c), line, LW); // đuôi
    for (const sgn of [-1, 1]) s += P(ell(CX + sgn * 40, 148, 13, 22, sgn * -20), doc.vgrad('#eef0fb'), line, LS + 0.4);
    s += headShape(doc, c, CX, 84, 46, 42, line);
    s += L(`M${CX - 2},44 q-4,-14 8,-16`, line, 4) + L(`M${CX + 4},44 q2,-12 12,-10`, line, 4);
    // mỏ dẹt
    s += P(`M${CX - 26},104 Q${CX},92 ${CX + 26},104 Q${CX + 30},116 ${CX},120 Q${CX - 30},116 ${CX - 26},104Z`, doc.vgrad(bill), ramp(bill).line, LS);
    s += L(`M${CX - 22},109 Q${CX},114 ${CX + 22},109`, ramp(bill).line, 2.4);
    s += E(CX - 6, 100, 3, 1.6, ramp(bill).deep, null) + E(CX + 6, 100, 3, 1.6, ramp(bill).deep, null);
    s += face(doc, { cx: CX, cy: 76, dx: 20, glow: '#5aa0d8', mouth: 'none', blushDx: 34, blushDy: 20 });
    s += `<path d="M${CX - 46},150 l-3,10" stroke="none"/>`;
    return s;
  },
  chick(doc) {
    const c = PAL.yellow, line = lineOf('#f2b84a');
    let s = shadow(48);
    for (const sgn of [-1, 1]) s += L(`M${CX + sgn * 16},${GY - 14} l0,10 m-8,2 l8,-2 l8,2`, ramp(PAL.orange).line, 4.4);
    s += P(blob(CX, 116, 62, 64, 11, 0.03, 4), doc.sphere(c, 1.1), line, LW);
    s += glossy(CX - 28, 78, 14, 8);
    for (const sgn of [-1, 1]) s += P(`M${CX + sgn * 52},112 Q${CX + sgn * 74},112 ${CX + sgn * 70},132 Q${CX + sgn * 62},144 ${CX + sgn * 50},138Z`, doc.vgrad('#ffcf4d'), line, LS + 0.4);
    // chỏm
    s += P(`M${CX - 6},56 Q${CX - 14},36 ${CX - 2},34 Q${CX + 2},44 ${CX + 2},54 Q${CX + 8},38 ${CX + 16},44 Q${CX + 12},52 ${CX + 6},58Z`, doc.vgrad(c), line, LS);
    s += P(`M${CX - 13},110 Q${CX},100 ${CX + 13},110 Q${CX},126 ${CX - 13},110Z`, doc.vgrad(PAL.orange), ramp(PAL.orange).line, LS);
    s += face(doc, { cx: CX, cy: 92, dx: 23, rx: 7.6, ry: 9.6, glow: '#c28a3a', mouth: 'none', blushDx: 38, blushDy: 16 });
    return s;
  },
  sheep(doc) {
    const wool = PAL.white, line = '#a9a0c2', skin = '#6b5a80';
    let s = shadow();
    for (const sgn of [-1, 1]) s += P(ell(CX + sgn * 24, GY - 10, 10, 13), doc.sphere(skin, 1), PAL.ink, LS);
    s += P(puffPath(CX, 146, 52, 36, 11, 0.13, 7), doc.sphere(wool, 1.2), line, LW);
    s += P(puffPath(CX, 78, 62, 52, 12, 0.12, 3), doc.sphere(wool, 1.2), line, LW);
    for (const sgn of [-1, 1]) s += P(ell(CX + sgn * 50, 92, 18, 9, sgn * 24), doc.vgrad(skin), PAL.ink, LS) + E(CX + sgn * 50, 93, 10, 4, '#a58fbd', null, 0, `transform="rotate(${sgn * 24} ${CX + sgn * 50} 93)"`);
    s += P(ell(CX, 98, 34, 32), doc.sphere(skin, 1), PAL.ink, LS + 0.6);
    s += glossy(CX - 14, 76, 8, 4, 0.35);
    s += P(puffPath(CX, 62, 30, 16, 7, 0.2, 11), doc.sphere(wool, 1), line, LS);
    s += face(doc, { cx: CX, cy: 92, dx: 14, rx: 6.4, ry: 8, glow: '#ffffff', mouth: 'cat', my: 20, ms: 1.9, blushDx: 23, blushDy: 14 });
    // tròng mắt sáng trên mặt tối: viền trắng nhẹ
    return s;
  },
  horse(doc) {
    const c = '#c98c5a', line = lineOf(c), mane = '#7a4b2e', snout = '#f0cfa8';
    let s = shadow();
    s += P(`M${CX + 34},${GY - 40} Q${CX + 70},${GY - 40} ${CX + 62},${GY - 6} Q${CX + 50},${GY - 20} ${CX + 36},${GY - 22}Z`, doc.vgrad(mane), lineOf(mane), LS + 0.6);
    s += torso(doc, c, { line, feet: '#6b4a38', belly: '#e3ae7c' });
    for (const sgn of [-1, 1]) s += pointyEar(doc, CX + sgn * 28, 46, 22, 34, sgn * 14, c, '#f0c3a0', line);
    s += P(ell(CX, 78, 42, 40), doc.sphere(c, 1.1), line, LW);
    s += glossy(CX - 20, 54, 10, 5);
    // bờm
    s += P(`M${CX - 22},44 Q${CX - 10},22 ${CX + 14},30 Q${CX + 26},36 ${CX + 22},50 Q${CX + 8},40 ${CX - 2},50 Q${CX - 12},44 ${CX - 22},56Z`, doc.vgrad(mane), lineOf(mane), LS + 0.4);
    s += muzzle(doc, CX, 114, 30, 22, snout, line);
    for (const sgn of [-1, 1]) s += E(CX + sgn * 11, 116, 3.6, 5, '#9b6a4e', null);
    s += L(`M${CX - 9},126 Q${CX},131 ${CX + 9},126`, PAL.ink, 3);
    s += face(doc, { cx: CX, cy: 70, dx: 19, rx: 7, ry: 9, glow: '#9a6a3c', mouth: 'none', blushDx: 32, blushDy: 18 });
    return s;
  },
  rabbit(doc) {
    const c = '#d9bc9d', line = lineOf('#b98e66'), inner = PAL.pink;
    let s = shadow();
    s += E(CX + 40, GY - 26, 12, 12, doc.sphere(PAL.white, 0.6), line, LS);
    s += torso(doc, c, { line, belly: PAL.white, feet: '#f2e2cf' });
    for (const sgn of [-1, 1]) {
      const tf = `translate(${CX + sgn * 19} 60) rotate(${sgn * 10})`;
      s += `<g transform="${tf}">${P(ell(0, -24, 13, 28), doc.vgrad(c), line, LW)}${E(0, -22, 6.5, 19, inner, null)}</g>`;
    }
    s += headShape(doc, c, CX, 90, 52, 44, line);
    s += muzzle(doc, CX, 110, 20, 13, PAL.white, line);
    s += face(doc, { cx: CX, cy: 86, dx: 22, glow: '#9a6a3c', mouth: 'cat', my: 26, ms: 2.0 });
    s += triNose(CX, 105, 5.5, 4);
    s += P(`M${CX - 6},115 L${CX + 6},115 L${CX + 6},124 Q${CX},126 ${CX - 6},124Z`, PAL.white, PAL.ink, 2.2) + L(`M${CX},115 L${CX},124`, PAL.ink, 1.6);
    return s;
  },
  frog(doc) {
    const c = '#8fd174', line = lineOf('#5aa152'), belly = '#e6f6c8';
    let s = shadow(60);
    for (const sgn of [-1, 1]) s += P(`M${CX + sgn * 18},${GY - 4} q${sgn * 14},-10 ${sgn * 36},-4 q${sgn * 4},6 ${-sgn * 4},8 q${-sgn * 16},3 ${-sgn * 32},-4Z`, doc.vgrad(darken(c, 0.05)), line, LS);
    s += P(ell(CX, 130, 66, 54), doc.sphere(c, 1.1), line, LW);
    const id = doc.clip(`<path d="${ell(CX, 130, 64, 52)}"/>`);
    s += `<g clip-path="${id}">${E(CX, 156, 42, 34, doc.sphere(belly, 0.5), null)}</g>`;
    for (const sgn of [-1, 1]) s += P(ell(CX + sgn * 48, 156, 12, 16, sgn * -24), doc.sphere(c, 1), line, LS + 0.4);
    for (const sgn of [-1, 1]) {
      s += P(ell(CX + sgn * 30, 78, 26, 25), doc.sphere(c, 1.1), line, LW);
      s += E(CX + sgn * 30, 80, 17, 17, PAL.white, null);
      s += eye(doc, { x: CX + sgn * 30, y: 81, rx: 9, ry: 11, glow: '#5a9a4e' });
    }
    s += glossy(CX - 44, 64, 7, 4);
    s += L(`M${CX - 34},120 Q${CX},144 ${CX + 34},120`, PAL.ink, 4);
    for (const sgn of [-1, 1]) s += blush(CX + sgn * 44, 118, 10, 6, 0.65);
    s += E(CX - 6, 106, 2.4, 1.6, line, null) + E(CX + 6, 106, 2.4, 1.6, line, null);
    return s;
  },
  fish(doc) {
    const c = PAL.orange, line = lineOf(PAL.orangeDeep), fin = '#ffd96b';
    let s = '';
    for (const [x, y, r] of [[36, 46, 7], [52, 28, 5], [30, 22, 4]]) s += E(x, y, r, r, 'rgba(255,255,255,.55)', '#8fd6f0', 2.2);
    s += E(CX + 4, 176, 54, 8, PAL.shadowSoft, null);
    // đuôi
    s += P(`M${CX + 50},104 Q${CX + 84},70 ${CX + 92},80 Q${CX + 80},104 ${CX + 92},130 Q${CX + 84},138 ${CX + 50},108Z`, doc.vgrad(fin), ramp(fin).line, LW);
    // vây lưng + bụng
    s += P(`M${CX - 20},64 Q${CX},36 ${CX + 30},56 Q${CX + 14},64 ${CX + 6},70Z`, doc.vgrad(fin), ramp(fin).line, LS + 0.4);
    s += P(`M${CX - 4},140 Q${CX + 10},160 ${CX + 26},150 Q${CX + 18},140 ${CX + 14},134Z`, doc.vgrad(fin), ramp(fin).line, LS);
    s += P(ell(CX - 8, 104, 66, 46), doc.sphere(c, 1.1), line, LW);
    const id = doc.clip(`<path d="${ell(CX - 8, 104, 64, 44)}"/>`);
    s += `<g clip-path="${id}">${E(CX - 10, 136, 52, 20, PAL.yellowLight, null, 0, 'opacity=".75"')}${[0, 22].map((dx) => L(`M${CX + 10 + dx},64 Q${CX - 2 + dx},104 ${CX + 10 + dx},146`, PAL.white, 7, 'opacity=".75"')).join('')}</g>`;
    s += glossy(CX - 44, 80, 16, 8);
    s += P(`M${CX + 2},106 Q${CX + 22},96 ${CX + 26},112 Q${CX + 14},122 ${CX + 2},112Z`, doc.vgrad(fin), ramp(fin).line, LS);
    s += E(CX - 42, 96, 15, 15, PAL.white, line, LS);
    s += eye(doc, { x: CX - 44, y: 97, rx: 8.5, ry: 10, glow: '#5a8ad8' });
    s += blush(CX - 40, 122, 9, 5.5, 0.6);
    s += mouth({ x: CX - 66, y: 112, s: 1.8, kind: 'smile', lw: 3.2 });
    return s;
  },
  turtle(doc) {
    const skin = '#a6dc8a', line = lineOf('#5aa152'), shell = '#7cb860', sline = lineOf('#4f8a44');
    let s = shadow(70);
    for (const sgn of [-1, 1]) s += P(ell(CX + sgn * 52, GY - 12, 16, 11), doc.sphere(skin, 1), line, LS + 0.4);
    s += P(`M${CX - 68},150 Q${CX - 66},84 ${CX},82 Q${CX + 66},84 ${CX + 68},150 Q${CX},166 ${CX - 68},150Z`, doc.sphere(shell, 1.1), sline, LW);
    // vân mai (hình lục giác bo)
    s += P(`M${CX - 20},104 L${CX + 20},104 L${CX + 30},126 L${CX + 18},146 L${CX - 18},146 L${CX - 30},126Z`, doc.vgrad(lighten(shell, 0.2)), sline, LS);
    for (const [x1, y1, x2, y2] of [[-20, 104, -40, 92], [20, 104, 40, 92], [-30, 126, -64, 128], [30, 126, 64, 128], [-18, 146, -28, 158], [18, 146, 28, 158]]) s += L(`M${CX + x1},${y1} L${CX + x2},${y2}`, sline, LS);
    s += P(`M${CX - 70},150 Q${CX},170 ${CX + 70},150 Q${CX + 66},162 ${CX},176 Q${CX - 66},162 ${CX - 70},150Z`, doc.vgrad('#e9f3c4'), sline, LS);
    s += glossy(CX - 34, 100, 14, 6, 0.4);
    // đầu ló ra trước
    s += P(ell(CX, 66, 38, 34), doc.sphere(skin, 1.1), line, LW);
    s += glossy(CX - 18, 46, 8, 4);
    s += face(doc, { cx: CX, cy: 62, dx: 15, rx: 6.4, ry: 8.2, glow: '#5a9a4e', mouth: 'smile', my: 18, ms: 2, blushDx: 26, blushDy: 14 });
    return s;
  },
  elephant(doc) {
    const c = '#b9c1de', line = lineOf('#8a93bb'), inner = '#ffc9d6';
    let s = shadow(62);
    s += torso(doc, c, { line, feet: '#d6dbee', rx: 44, ry: 32 });
    for (const sgn of [-1, 1]) s += P(`M${CX + sgn * 30},58 Q${CX + sgn * 92},34 ${CX + sgn * 90},90 Q${CX + sgn * 86},128 ${CX + sgn * 44},116Z`, doc.vgrad(c), line, LW)
      + P(`M${CX + sgn * 40},66 Q${CX + sgn * 80},52 ${CX + sgn * 78},90 Q${CX + sgn * 74},114 ${CX + sgn * 48},106Z`, inner, 'none', 0, 'opacity=".75"');
    s += headShape(doc, c, CX, 82, 46, 42, line);
    // vòi cong lên
    s += P(`M${CX - 12},100 Q${CX - 14},130 ${CX - 2},144 Q${CX + 14},156 ${CX + 30},140 Q${CX + 36},132 ${CX + 28},128 Q${CX + 20},138 ${CX + 8},132 Q${CX + 12},118 ${CX + 12},100Z`, doc.vgrad(c), line, LW);
    for (const y of [116, 126]) s += L(`M${CX - 8},${y} q8,3 16,0`, line, 2.2, 'opacity=".6"');
    s += face(doc, { cx: CX, cy: 76, dx: 22, glow: '#7a8ad0', mouth: 'none', blushDx: 32, blushDy: 20 });
    return s;
  },
  lion(doc) {
    const c = '#ffcf6b', line = lineOf('#e4a63e'), mane = '#e8894a', mline = lineOf('#c2632f');
    let s = shadow();
    s += L(`M${CX + 34},${GY - 26} Q${CX + 66},${GY - 24} ${CX + 64},${GY - 60}`, line, 9) + L(`M${CX + 34},${GY - 26} Q${CX + 66},${GY - 24} ${CX + 64},${GY - 60}`, c, 4);
    s += P(blob(CX + 64, GY - 64, 9, 10, 6, 0.2, 2), doc.sphere(mane, 1), mline, LS);
    s += torso(doc, c, { line, belly: PAL.yellowLight });
    s += P(puffPath(CX, 86, 72, 64, 13, 0.14, 5), doc.sphere(mane, 1.1), mline, LW);
    s += P(puffPath(CX, 88, 58, 52, 12, 0.1, 8), doc.sphere('#f5a65a', 0.8), 'none', 0, 'opacity=".9"');
    for (const sgn of [-1, 1]) s += roundEar(doc, CX + sgn * 36, 48, 12, c, '#f5b26a', line);
    s += headShape(doc, c, CX, 90, 44, 40, line);
    s += muzzle(doc, CX, 108, 20, 13, PAL.yellowLight, line);
    s += face(doc, { cx: CX, cy: 84, dx: 19, rx: 7, ry: 8.8, glow: '#c2832f', my: 26, ms: 2.0, blushDx: 30, blushDy: 18 });
    s += triNose(CX, 103, 7, 4.6, '#b8654e');
    return s;
  },
  monkey(doc) {
    const c = '#b98157', line = lineOf(c), facec = '#f4d4ae';
    let s = shadow();
    s += L(`M${CX + 30},${GY - 22} C${CX + 80},${GY - 20} ${CX + 82},${GY - 90} ${CX + 56},${GY - 92} C${CX + 44},${GY - 92} ${CX + 46},${GY - 76} ${CX + 56},${GY - 78}`, line, 10) + L(`M${CX + 30},${GY - 22} C${CX + 80},${GY - 20} ${CX + 82},${GY - 90} ${CX + 56},${GY - 92} C${CX + 44},${GY - 92} ${CX + 46},${GY - 76} ${CX + 56},${GY - 78}`, c, 4.4);
    s += torso(doc, c, { line, belly: facec, feet: facec });
    for (const sgn of [-1, 1]) s += roundEar(doc, CX + sgn * 56, 88, 16, c, facec, line);
    s += headShape(doc, c, CX, 84, 52, 46, line);
    // mặt hình trái tim
    s += P(`M${CX},64 C${CX - 14},46 ${CX - 46},56 ${CX - 40},88 C${CX - 38},118 ${CX - 18},126 ${CX},126 C${CX + 18},126 ${CX + 38},118 ${CX + 40},88 C${CX + 46},56 ${CX + 14},46 ${CX},64Z`, doc.sphere(facec, 0.5), line, LS);
    s += face(doc, { cx: CX, cy: 80, dx: 17, rx: 7, ry: 9, glow: '#9a6a3c', mouth: 'smile', my: 30, ms: 2.6, blushDx: 28, blushDy: 22 });
    s += E(CX - 4, 100, 2.2, 1.6, line, null) + E(CX + 4, 100, 2.2, 1.6, line, null);
    s += L(`M${CX - 6},36 q4,-12 12,-8`, line, 4);
    return s;
  },
  owl(doc) {
    const c = '#b39adb', line = lineOf('#8a70c8'), belly = '#f1e9fb', wing = '#9b85d9';
    let s = shadow(52);
    for (const sgn of [-1, 1]) s += L(`M${CX + sgn * 18},${GY - 12} l${-sgn * 4},10 m${sgn * 4},-10 l0,11 m0,-11 l${sgn * 5},10`, ramp(PAL.orange).line, 4.2);
    s += P(`M${CX - 60},120 Q${CX - 62},42 ${CX},40 Q${CX + 62},42 ${CX + 60},120 Q${CX + 56},180 ${CX},180 Q${CX - 56},180 ${CX - 60},120Z`, doc.sphere(c, 1.1), line, LW);
    // chỏm tai
    for (const sgn of [-1, 1]) s += P(`M${CX + sgn * 30},48 Q${CX + sgn * 50},22 ${CX + sgn * 56},26 Q${CX + sgn * 56},46 ${CX + sgn * 50},62Z`, doc.vgrad(c), line, LW);
    const id = doc.clip(`<path d="M${CX - 58},120 Q${CX - 60},44 ${CX},42 Q${CX + 60},44 ${CX + 58},120 Q${CX + 54},178 ${CX},178 Q${CX - 54},178 ${CX - 58},120Z"/>`);
    s += `<g clip-path="${id}">${E(CX, 150, 38, 34, doc.sphere(belly, 0.5), null)}${[[-14, 140], [0, 152], [14, 140], [-8, 164], [8, 164]].map(([dx, y]) => L(`M${CX + dx - 5},${y} q5,5 10,0`, '#c7b5f0', 2.6)).join('')}</g>`;
    for (const sgn of [-1, 1]) s += P(`M${CX + sgn * 52},104 Q${CX + sgn * 74},130 ${CX + sgn * 56},162 Q${CX + sgn * 44},140 ${CX + sgn * 46},110Z`, doc.vgrad(wing), line, LS + 0.4);
    s += glossy(CX - 34, 64, 12, 6);
    // vòng mắt to
    for (const sgn of [-1, 1]) {
      s += E(CX + sgn * 22, 88, 22, 22, PAL.white, line, LS);
      s += eye(doc, { x: CX + sgn * 22, y: 89, rx: 10, ry: 12, glow: '#d8a03a' });
    }
    s += P(`M${CX - 8},104 Q${CX},100 ${CX + 8},104 Q${CX + 2},118 ${CX},120 Q${CX - 2},118 ${CX - 8},104Z`, doc.vgrad(PAL.orange), ramp(PAL.orange).line, LS);
    for (const sgn of [-1, 1]) s += blush(CX + sgn * 44, 110, 8, 5, 0.6);
    return s;
  },
};

export const ANIMAL_LIST = [
  ['cat', 'Mèo', 'farm', 'meo meo'], ['dog', 'Chó', 'farm', 'gâu gâu'], ['cow', 'Bò', 'farm', 'ò ò'], ['pig', 'Heo', 'farm', 'ụt ịt'],
  ['duck', 'Vịt', 'pond', 'cạp cạp'], ['chick', 'Gà con', 'farm', 'chíp chíp'], ['sheep', 'Cừu', 'farm', 'be be'], ['horse', 'Ngựa', 'farm', 'hí hí'],
  ['rabbit', 'Thỏ', 'forest', 'chụt chụt'], ['frog', 'Ếch', 'pond', 'ộp ộp'], ['fish', 'Cá', 'pond', 'lắc lắc đuôi'], ['turtle', 'Rùa', 'pond', 'bò chậm chậm'],
  ['elephant', 'Voi', 'savanna', 'phù phù'], ['lion', 'Sư tử', 'savanna', 'gừ gừ'], ['monkey', 'Khỉ', 'forest', 'khẹc khẹc'], ['owl', 'Cú mèo', 'forest', 'cú cú'],
];
