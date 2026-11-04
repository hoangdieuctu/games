// ── Little World · Đảo: đồ trang trí (island/decorations) ──
import { sprite, sheet } from './island-common.mjs';
import {
  PAL, LINE, ramp, lighten, darken, mix, alpha, rng, blob, puffPath, gloss, shape, stroke, circle, ellipse, rect, r2,
  baseShadow, canopy, flowerHead, tulip, leafTuft, plank, pebble, sparkle, glow, leafMark, roundWindow, windowBox,
} from './island-kit.mjs';
import { roofSlope } from './island-buildings.mjs';
import { bush } from './island-plants.mjs';

const W = PAL.wood, WR = ramp(PAL.wood);
const METAL = '#6e6187', MR = ramp(METAL);

function post(doc, x, by, h, w = 9, color = PAL.wood) {
  const r = ramp(color);
  let s = rect(x - w / 2, by - h, w, h, 3, doc.linear([[0, r.hi], [0.5, color], [1, r.lo]], 0, 0, 1, 0), r.line, LINE.sm);
  s += ellipse(x, by - h + 1.5, w / 2 - 0.5, 2.2, lighten(color, 0.4), null);
  return s;
}

export function defineDecor() {
  const D = (id, d, usage, draw, tags = [], fp = [1, 1], extra = {}) => sprite({ id: `island-deco-${id}`, file: `island/decorations/${id}.png`, ...d, usage, draw, footprint: fp, tags: ['decoration', 'placeable', ...tags], ...extra });

  // ── ghế ──
  D('bench-wood', { w: 110, h: 80, ox: 55, oy: 72 }, 'Ghế băng gỗ công viên (2 người ngồi)', (doc, ox, oy) => {
    let s = baseShadow(ox, oy - 3, 50, 9);
    const by = oy - 4;
    // chân sau
    s += rect(ox - 40, by - 46, 7, 30, 3, doc.vgrad(PAL.woodDark), ramp(PAL.woodDark).line, LINE.sm) + rect(ox + 33, by - 46, 7, 30, 3, doc.vgrad(PAL.woodDark), ramp(PAL.woodDark).line, LINE.sm);
    // tựa lưng 2 thanh
    s += plank(doc, ox - 46, by - 54, 92, 10, PAL.woodLight, LINE.sm) + plank(doc, ox - 46, by - 41, 92, 9, PAL.wood, LINE.sm);
    // mặt ngồi (thấy từ trên)
    s += shape(`M${ox - 46},${by - 24} L${ox + 46},${by - 24} L${ox + 50},${by - 12} L${ox - 50},${by - 12}Z`, doc.vgrad(PAL.woodLight), WR.line, LINE.sm);
    s += stroke(`M${ox - 47},${by - 18} L${ox + 47},${by - 18}`, WR.lo, LINE.xs);
    s += rect(ox - 50, by - 13, 100, 6, 3, doc.vgrad(W), WR.line, LINE.sm);
    // chân trước + tay vịn
    for (const x of [ox - 44, ox + 37]) s += rect(x, by - 10, 7, 12, 2.5, doc.vgrad(PAL.woodDark), ramp(PAL.woodDark).line, LINE.sm);
    s += stroke(`M${ox - 48},${by - 26} Q${ox - 52},${by - 42} ${ox - 42},${by - 44}`, METAL, LINE.md + 1) + stroke(`M${ox + 48},${by - 26} Q${ox + 52},${by - 42} ${ox + 42},${by - 44}`, METAL, LINE.md + 1);
    return s;
  }, ['seat'], [2, 1]);
  D('bench-garden', { w: 110, h: 84, ox: 55, oy: 76 }, 'Ghế vườn trắng uốn lượn, đệm hồng', (doc, ox, oy) => {
    let s = baseShadow(ox, oy - 3, 48, 9);
    const by = oy - 4, c = PAL.white, cr = ramp('#d9cfe6');
    // tựa lưng hình vòm có song
    s += shape(`M${ox - 42},${by - 22} L${ox - 42},${by - 46} Q${ox},${by - 70} ${ox + 42},${by - 46} L${ox + 42},${by - 22}Z`, doc.vgrad(c), cr.line, LINE.md);
    for (let k = -3; k <= 3; k++) s += rect(ox + k * 11 - 3, by - 54 + Math.abs(k) * 2.5, 6, 26 - Math.abs(k) * 2.5, 3, '#ece4f4', null);
    s += shape(`M${ox - 34},${by - 28} L${ox - 34},${by - 42} Q${ox},${by - 60} ${ox + 34},${by - 42} L${ox + 34},${by - 28}`, 'none', cr.line, LINE.xs);
    // đệm
    s += shape(`M${ox - 44},${by - 26} L${ox + 44},${by - 26} L${ox + 48},${by - 12} L${ox - 48},${by - 12}Z`, doc.vgrad(PAL.pink), ramp(PAL.pink).line, LINE.sm);
    s += circle(ox - 20, by - 19, 1.6, ramp(PAL.pink).lo, null) + circle(ox + 20, by - 19, 1.6, ramp(PAL.pink).lo, null) + circle(ox, by - 19, 1.6, ramp(PAL.pink).lo, null);
    s += rect(ox - 48, by - 13, 96, 6, 3, doc.vgrad(c), cr.line, LINE.sm);
    for (const x of [ox - 44, ox + 38]) s += shape(`M${x},${by - 8} L${x + 6},${by - 8} Q${x + 7},${by - 2} ${x + 9},${by + 2} L${x - 3},${by + 2} Q${x - 1},${by - 2} ${x},${by - 8}Z`, doc.vgrad(c), cr.line, LINE.sm);
    return s;
  }, ['seat'], [2, 1]);

  // ── đèn (quầng sáng mềm đã vẽ sẵn) ──
  D('lamp-street', { w: 70, h: 130, ox: 35, oy: 124 }, 'Đèn đường cổ điển, đèn vàng ấm (quầng sáng vẽ sẵn; ban đêm có thể thêm ánh sáng additive trong Phaser)', (doc, ox, oy) => {
    const by = oy - 3;
    let s = baseShadow(ox, oy - 3, 16, 5);
    s += glow(doc, ox, by - 100, 34, PAL.yellowLight, 0.75);
    s += shape(`M${ox - 11},${by} L${ox - 8},${by - 12} L${ox + 8},${by - 12} L${ox + 11},${by}Z`, doc.vgrad(METAL), MR.line, LINE.sm);
    s += rect(ox - 3.5, by - 86, 7, 76, 3, doc.linear([[0, lighten(METAL, 0.3)], [1, darken(METAL, 0.1)]], 0, 0, 1, 0), MR.line, LINE.sm);
    s += rect(ox - 6, by - 52, 12, 5, 2, METAL, MR.line, LINE.xs);
    // đầu đèn
    s += shape(`M${ox - 11},${by - 88} L${ox + 11},${by - 88} L${ox + 13},${by - 110} L${ox - 13},${by - 110}Z`, doc.linear([[0, PAL.yellowLight], [1, PAL.yellow]]), MR.line, LINE.sm);
    s += ellipse(ox, by - 99, 6, 8, '#fff', null, 0, 'opacity="0.8"');
    s += stroke(`M${ox},${by - 110} L${ox},${by - 88}`, MR.line, LINE.xs);
    s += shape(`M${ox - 17},${by - 108} Q${ox},${by - 126} ${ox + 17},${by - 108}Z`, doc.vgrad(METAL), MR.line, LINE.sm);
    s += circle(ox, by - 120, 3, METAL, MR.line, LINE.xs);
    s += rect(ox - 13, by - 90, 26, 4, 2, METAL, MR.line, LINE.xs);
    return s;
  }, ['light'], [1, 1], { lightSource: { x: 0, y: -100, radius: 90, color: '#fff0b3' } });
  D('lamp-mushroom', { w: 64, h: 80, ox: 32, oy: 74 }, 'Đèn vườn hình nấm phát sáng (thấp, dọc lối đi)', (doc, ox, oy) => {
    const by = oy - 3;
    let s = baseShadow(ox, oy - 3, 14, 4);
    s += glow(doc, ox, by - 42, 30, PAL.yellowLight, 0.8);
    s += rect(ox - 5, by - 40, 10, 40, 4, doc.linear([[0, PAL.white], [1, PAL.cream]], 0, 0, 1, 0), ramp(PAL.cream).line, LINE.sm);
    s += shape(`M${ox - 22},${by - 38} C${ox - 22},${by - 70} ${ox + 22},${by - 70} ${ox + 22},${by - 38} Q${ox},${by - 32} ${ox - 22},${by - 38}Z`, doc.radial([[0, '#fffbe0'], [0.6, PAL.yellowLight], [1, PAL.yellow]], 0.4, 0.35, 0.7), ramp(PAL.orange).line, LINE.sm);
    s += circle(ox - 9, by - 52, 3, PAL.peach, null) + circle(ox + 7, by - 57, 3.5, PAL.peach, null) + circle(ox + 12, by - 44, 2.4, PAL.peach, null);
    s += gloss(ox - 8, by - 58, 5, 2.5, 0.6);
    return s;
  }, ['light'], [1, 1], { lightSource: { x: 0, y: -45, radius: 60, color: '#fff0b3' } });

  // ── hàng rào (ghép được) ──
  const fenceC = PAL.white, FR = ramp('#d7c8b5');
  const picket = (doc, x, by, h) => shape(`M${x - 5},${by} L${x - 5},${by - h + 5} L${x},${by - h} L${x + 5},${by - h + 5} L${x + 5},${by}Z`, doc.linear([[0, '#fffdf8'], [1, '#e9e0d6']], 0, 0, 1, 0), FR.line, LINE.sm);
  const fpost = (doc, x, by) => rect(x - 6, by - 46, 12, 46, 3, doc.linear([[0, '#fffdf8'], [1, '#e2d6cc']], 0, 0, 1, 0), FR.line, LINE.sm) + rect(x - 7.5, by - 50, 15, 7, 3, PAL.white, FR.line, LINE.sm);
  // fence-h: origin = chân cột trái; thanh ngang kéo tới +64 (cột kế tiếp do đoạn sau/cột cuối vẽ)
  D('fence-h', { w: 92, h: 64, ox: 14, oy: 58, fixed: true }, 'Hàng rào gỗ trắng – đoạn ngang 1 ô. Origin = chân cột trái; ghép đoạn kế tiếp tại x+64, kết thúc bằng fence-post', (doc, ox, oy) => {
    let s = `<rect x="${ox}" y="${oy - 3}" width="64" height="5" rx="2.5" fill="${PAL.shadowSoft}"/>`;
    s += rect(ox, oy - 34, 68, 6, 3, doc.vgrad(fenceC), FR.line, LINE.sm) + rect(ox, oy - 17, 68, 6, 3, doc.vgrad(fenceC), FR.line, LINE.sm);
    for (const x of [ox + 16, ox + 32, ox + 48]) s += picket(doc, x, oy - 1, 38);
    s += fpost(doc, ox, oy);
    return s;
  }, ['fence', 'tile'], [1, 1]);
  D('fence-v', { w: 30, h: 120, ox: 15, oy: 112, fixed: true }, 'Hàng rào – đoạn dọc (chạy lên trên 1 ô). Origin = chân cột dưới; cột trên ở y-64', (doc, ox, oy) => {
    let s = `<rect x="${ox - 3}" y="${oy - 64}" width="6" height="64" rx="3" fill="${PAL.shadowSoft}"/>`;
    // thanh nhìn từ cạnh: 2 dải dọc
    s += rect(ox - 4, oy - 64 - 34, 8, 66, 4, doc.linear([[0, '#fffdf8'], [1, '#e2d6cc']], 0, 0, 1, 0), FR.line, LINE.sm);
    for (const y of [oy - 16, oy - 32, oy - 48]) s += picket(doc, ox, y, 36);
    s += fpost(doc, ox, oy);
    return s;
  }, ['fence', 'tile'], [1, 1]);
  D('fence-post', { w: 30, h: 64, ox: 15, oy: 58, fixed: true }, 'Cột rào đơn (kết thúc / góc hàng rào)', (doc, ox, oy) => `<ellipse cx="${ox + 2}" cy="${oy - 1}" rx="9" ry="3" fill="${PAL.shadowSoft}"/>` + fpost(doc, ox, oy), ['fence', 'tile'], [1, 1]);
  D('fence-gate', { w: 92, h: 72, ox: 14, oy: 64, fixed: true }, 'Cổng rào (1 ô, ghép như fence-h). Origin = chân cột trái', (doc, ox, oy) => {
    let s = `<rect x="${ox}" y="${oy - 3}" width="64" height="5" rx="2.5" fill="${PAL.shadowSoft}"/>`;
    const gx = ox + 8, gw = 50;
    s += shape(`M${gx},${oy - 4} L${gx},${oy - 38} Q${gx + gw / 2},${oy - 52} ${gx + gw},${oy - 38} L${gx + gw},${oy - 4}Z`, 'none', FR.line, LINE.sm);
    for (let k = 0; k < 4; k++) { const x = gx + 6 + k * 12.5; s += rect(x - 4, oy - 44 + Math.abs(k - 1.5) * 3, 8, 40 - Math.abs(k - 1.5) * 3, 3, doc.linear([[0, '#fffdf8'], [1, '#e9e0d6']], 0, 0, 1, 0), FR.line, LINE.sm); }
    s += rect(gx, oy - 28, gw, 5, 2.5, doc.vgrad(fenceC), FR.line, LINE.sm) + rect(gx, oy - 14, gw, 5, 2.5, doc.vgrad(fenceC), FR.line, LINE.sm);
    s += circle(gx + gw - 4, oy - 22, 2.4, PAL.yellow, ramp(PAL.yellow).line, LINE.xs);
    s += fpost(doc, ox, oy);
    return s;
  }, ['fence', 'tile'], [1, 1]);

  // ── biển (trống, không chữ) ──
  D('sign-board', { w: 80, h: 84, ox: 40, oy: 78 }, 'Biển gỗ đứng (bảng trống – tên do Phaser vẽ chữ lên)', (doc, ox, oy) => {
    let s = baseShadow(ox, oy - 3, 24, 6);
    s += post(doc, ox - 18, oy - 2, 46, 8) + post(doc, ox + 18, oy - 2, 46, 8);
    s += rect(ox - 34, oy - 72, 68, 40, 8, doc.vgrad(PAL.woodLight), WR.line, LINE.md);
    s += rect(ox - 28, oy - 66, 56, 28, 5, doc.vgrad(PAL.cream), ramp(PAL.cream).line, LINE.xs);
    s += leafTuft(doc, ox, oy, 34, 10, PAL.leaf, 3, LINE.sm);
    s += flowerHead(doc, ox - 12, oy - 6, 5, PAL.pink) + flowerHead(doc, ox + 10, oy - 4, 5, PAL.yellow);
    return s;
  }, ['sign']);
  D('sign-arrow', { w: 84, h: 100, ox: 42, oy: 94 }, 'Biển chỉ đường 2 mũi tên (trống)', (doc, ox, oy) => {
    let s = baseShadow(ox, oy - 3, 14, 5);
    s += post(doc, ox, oy - 2, 82, 9);
    s += shape(`M${ox - 30},${oy - 80} L${ox + 22},${oy - 80} L${ox + 34},${oy - 70} L${ox + 22},${oy - 60} L${ox - 30},${oy - 60}Z`, doc.vgrad('#8fc9a6'), ramp('#8fc9a6').line, LINE.md);
    s += shape(`M${ox + 30},${oy - 54} L${ox - 22},${oy - 54} L${ox - 34},${oy - 44} L${ox - 22},${oy - 34} L${ox + 30},${oy - 34}Z`, doc.vgrad(PAL.peach), ramp(PAL.peach).line, LINE.md);
    s += circle(ox, oy - 70, 2, PAL.stoneDark, null) + circle(ox, oy - 44, 2, PAL.stoneDark, null);
    return s;
  }, ['sign']);

  // ── cầu ──
  D('bridge-arch', { w: 200, h: 120, ox: 100, oy: 104 }, 'Cầu gỗ vòm nhỏ (bắc ngang dòng suối chảy dọc). Origin = giữa mép trước', (doc, ox, oy) => {
    let s = `<ellipse cx="${ox + 4}" cy="${oy - 4}" rx="86" ry="9" fill="${PAL.shadow}"/>`;
    const by = oy - 6;
    const deck = (dy) => `M${ox - 92},${by + dy} Q${ox},${by - 46 + dy} ${ox + 92},${by + dy}`;
    // mặt cầu (thấy từ trên): dải giữa 2 cung
    const top = `M${ox - 92},${by - 30} Q${ox},${by - 76} ${ox + 92},${by - 30} L${ox + 92},${by} Q${ox},${by - 46} ${ox - 92},${by}Z`;
    s += shape(top, doc.vgrad(PAL.woodLight), WR.line, LINE.md);
    const cl = doc.clip(`<path d="${top}"/>`);
    let pl = '';
    for (let x = ox - 92; x < ox + 96; x += 13) pl += stroke(`M${x},${by - 90} L${x},${by + 10}`, WR.lo, LINE.xs * 1.2);
    s += `<g clip-path="${cl}">${pl}</g>`;
    // thành cầu trước
    s += stroke(deck(0), WR.line, 13) + stroke(deck(0), W, 9) + stroke(deck(-2), lighten(W, 0.3), 2.5);
    // lan can sau + trước
    for (const dy of [-30, 0]) {
      for (let k = -3; k <= 3; k++) {
        const x = ox + k * 26, t = (x - (ox - 92)) / 184;
        const y = (1 - t) * (1 - t) * (by + dy) + 2 * (1 - t) * t * (by - 46 + dy) + t * t * (by + dy);
        s += rect(x - 3.5, y - 26, 7, 26, 3, doc.vgrad(PAL.woodLight), WR.line, LINE.sm);
      }
      s += stroke(`M${ox - 92},${by + dy - 24} Q${ox},${by - 70 + dy} ${ox + 92},${by + dy - 24}`, WR.line, 9) + stroke(`M${ox - 92},${by + dy - 24} Q${ox},${by - 70 + dy} ${ox + 92},${by + dy - 24}`, PAL.woodLight, 5.5);
      if (dy === -30) s = s; // giữ thứ tự
    }
    return s;
  }, ['bridge'], [3, 2]);
  D('bridge-plank', { w: 140, h: 100, ox: 70, oy: 90 }, 'Cầu ván phẳng (nhìn từ trên, bắc ngang suối dọc). Origin = giữa mép trước', (doc, ox, oy) => {
    let s = `<rect x="${ox - 60}" y="${oy - 52}" width="128" height="54" rx="8" fill="${PAL.shadow}"/>`;
    const R = rng(12);
    for (let k = 0; k < 7; k++) {
      const x = ox - 60 + k * 17.4, j = (R() - 0.5) * 4;
      s += plank(doc, x, oy - 56 + j, 16, 50, k % 2 ? PAL.wood : PAL.woodLight, LINE.sm);
      s += circle(x + 8, oy - 50 + j, 1.4, WR.line, null) + circle(x + 8, oy - 12 + j, 1.4, WR.line, null);
    }
    // dây thừng hai bên + cọc góc
    for (const y of [oy - 56, oy - 4]) {
      s += stroke(`M${ox - 62},${y} Q${ox},${y + 8} ${ox + 62},${y}`, ramp(PAL.cream).line, 4) + stroke(`M${ox - 62},${y} Q${ox},${y + 8} ${ox + 62},${y}`, PAL.cream, 2);
      s += post(doc, ox - 64, y + 6, 18, 9, PAL.woodDark) + post(doc, ox + 64, y + 6, 18, 9, PAL.woodDark);
    }
    return s;
  }, ['bridge', 'ground'], [2, 1], { layer: 'ground' });

  // ── hòm thư ──
  D('mailbox', { w: 60, h: 90, ox: 30, oy: 84 }, 'Hòm thư xanh có cờ đỏ (nơi nhận thư/quà)', (doc, ox, oy) => {
    let s = baseShadow(ox, oy - 3, 16, 5);
    s += post(doc, ox, oy - 2, 48, 9);
    const c = '#73a9e0', r = ramp(c);
    s += shape(`M${ox - 18},${oy - 46} L${ox - 18},${oy - 66} Q${ox - 18},${oy - 80} ${ox},${oy - 80} Q${ox + 18},${oy - 80} ${ox + 18},${oy - 66} L${ox + 18},${oy - 46}Z`, doc.sphere(c, 0.8), r.line, LINE.md);
    s += shape(`M${ox - 12},${oy - 46} L${ox - 12},${oy - 64} Q${ox - 12},${oy - 74} ${ox},${oy - 74} Q${ox + 12},${oy - 74} ${ox + 12},${oy - 64} L${ox + 12},${oy - 46}`, 'none', r.lo, LINE.xs);
    s += rect(ox - 7, oy - 60, 14, 3, 1.5, r.line, null);
    s += stroke(`M${ox + 18},${oy - 58} L${ox + 24},${oy - 58} L${ox + 24},${oy - 80}`, METAL, LINE.sm);
    s += shape(`M${ox + 24},${oy - 80} L${ox + 36},${oy - 77} L${ox + 24},${oy - 72}Z`, '#f2626b', ramp('#f2626b').line, LINE.sm);
    s += gloss(ox - 8, oy - 70, 4, 6, 0.5, 0);
    // phong thư nhô ra
    s += rect(ox - 8, oy - 50, 16, 9, 2, PAL.white, ramp(PAL.cream).line, LINE.xs) + stroke(`M${ox - 8},${oy - 50} L${ox},${oy - 45} L${ox + 8},${oy - 50}`, ramp(PAL.cream).line, LINE.xs);
    return s;
  }, ['mail']);

  // ── nhà chim ──
  D('birdhouse', { w: 60, h: 112, ox: 30, oy: 106 }, 'Nhà chim trên cột, có chú chim nhỏ', (doc, ox, oy) => {
    let s = baseShadow(ox, oy - 3, 14, 4);
    s += post(doc, ox, oy - 2, 60, 8, PAL.woodDark);
    s += leafTuft(doc, ox, oy, 26, 9, PAL.leaf, 2, LINE.sm);
    const by = oy - 60;
    s += shape(`M${ox - 16},${by} L${ox - 16},${by - 28} L${ox},${by - 42} L${ox + 16},${by - 28} L${ox + 16},${by}Z`, doc.vgrad(PAL.mint), ramp(PAL.mint).line, LINE.md);
    s += shape(`M${ox},${by - 52} L${ox - 24},${by - 28} L${ox - 18},${by - 24} L${ox},${by - 42} L${ox + 18},${by - 24} L${ox + 24},${by - 28}Z`, doc.vgrad(PAL.coral), ramp(PAL.coral).line, LINE.md);
    s += circle(ox, by - 20, 6, '#4f3f63', ramp(PAL.mint).line, LINE.sm);
    s += rect(ox - 2, by - 10, 4, 8, 2, PAL.woodDark, null);
    // chim
    const bx = ox + 16, byy = by - 44;
    s += ellipse(bx, byy, 8, 6.5, doc.sphere(PAL.yellow), ramp(PAL.yellow).line, LINE.sm);
    s += circle(bx + 5, byy - 5, 5, doc.sphere(PAL.yellow), ramp(PAL.yellow).line, LINE.sm);
    s += circle(bx + 6.5, byy - 6, 1.2, PAL.ink, null) + shape(`M${bx + 9.5},${byy - 5} l4,1 l-4,2Z`, PAL.orange, ramp(PAL.orange).line, 1);
    s += shape(`M${bx - 3},${byy - 1} q-6,-3 -10,1 q5,3 10,2Z`, PAL.orange, ramp(PAL.orange).line, 1);
    return s;
  }, ['animal']);

  // ── tượng ──
  D('statue-bunny', { w: 70, h: 100, ox: 35, oy: 94 }, 'Tượng thỏ bằng đá trên bệ (trang trí vườn)', (doc, ox, oy) => {
    let s = baseShadow(ox, oy - 3, 26, 7);
    const st = PAL.stoneLight, sr = ramp(PAL.stone);
    s += rect(ox - 24, oy - 22, 48, 20, 5, doc.vgrad(PAL.stone), sr.line, LINE.md);
    s += rect(ox - 28, oy - 28, 56, 9, 4, doc.vgrad(st), sr.line, LINE.md);
    const by = oy - 28;
    s += ellipse(ox - 3, by - 16, 17, 15, doc.sphere(st), sr.line, LINE.md);
    s += circle(ox + 12, by - 7, 5, doc.sphere('#ffffff'), sr.line, LINE.sm);
    s += circle(ox - 6, by - 36, 12, doc.sphere(st), sr.line, LINE.md);
    s += ellipse(ox - 12, by - 58, 4.5, 13, doc.sphere(st), sr.line, LINE.md, `transform="rotate(-10 ${ox - 12} ${by - 58})"`);
    s += ellipse(ox - 1, by - 59, 4.5, 13, doc.sphere(st), sr.line, LINE.md, `transform="rotate(12 ${ox - 1} ${by - 59})"`);
    s += circle(ox - 10, by - 37, 1.6, sr.line, null) + circle(ox - 2, by - 37, 1.6, sr.line, null);
    s += ellipse(ox - 6, by - 32, 2, 1.4, sr.deep, null);
    // rêu nhẹ
    s += `<path d="${puffPath(ox - 18, oy - 28, 9, 4, 6, 0.3, 4)}" fill="${PAL.leaf}" opacity="0.85"/>`;
    s += gloss(ox - 12, by - 42, 4, 2.5, 0.6);
    return s;
  }, ['statue']);
  D('fountain', { w: 120, h: 110, ox: 60, oy: 100 }, 'Đài phun nước đá tròn 2 tầng (nước tĩnh, có thể thêm hạt nước trong Phaser)', (doc, ox, oy) => {
    let s = baseShadow(ox, oy - 4, 54, 12);
    const sr = ramp(PAL.stone);
    const by = oy - 6;
    // bể dưới
    s += shape(`M${ox - 52},${by - 26} L${ox - 50},${by - 6} Q${ox},${by + 8} ${ox + 50},${by - 6} L${ox + 52},${by - 26}Z`, doc.vgrad(PAL.stoneLight), sr.line, LINE.md);
    s += ellipse(ox, by - 26, 52, 14, doc.vgrad(PAL.stoneLight), sr.line, LINE.md);
    s += ellipse(ox, by - 25, 44, 10, doc.radial([[0, PAL.oceanLight], [1, PAL.ocean]]), '#3f86c2', LINE.sm);
    s += stroke(`M${ox - 24},${by - 22} q8,-3 16,0 M${ox + 10},${by - 28} q8,-3 16,0`, PAL.foam, LINE.sm);
    // trụ + bát trên
    s += rect(ox - 6, by - 56, 12, 32, 4, doc.linear([[0, PAL.stoneLight], [1, PAL.stone]], 0, 0, 1, 0), sr.line, LINE.sm);
    s += shape(`M${ox - 22},${by - 58} Q${ox},${by - 44} ${ox + 22},${by - 58}Z`, doc.vgrad(PAL.stoneLight), sr.line, LINE.sm);
    s += ellipse(ox, by - 58, 22, 6, PAL.oceanLight, sr.line, LINE.sm);
    // tia nước
    s += stroke(`M${ox},${by - 60} L${ox},${by - 82}`, PAL.oceanLight, 6) + stroke(`M${ox},${by - 60} L${ox},${by - 82}`, '#fff', 2.4);
    s += stroke(`M${ox},${by - 82} Q${ox - 14},${by - 90} ${ox - 20},${by - 60} M${ox},${by - 82} Q${ox + 14},${by - 90} ${ox + 20},${by - 60}`, alpha(PAL.oceanLight, 0.9), 3.4);
    s += circle(ox, by - 84, 4, '#fff', null, 0, 'opacity="0.9"');
    s += circle(ox - 22, by - 54, 2, PAL.foam, null) + circle(ox + 22, by - 54, 2, PAL.foam, null);
    return s;
  }, ['statue', 'water'], [2, 2]);

  // ── chỗ nằm thú cưng ──
  D('pet-bed', { w: 96, h: 66, ox: 48, oy: 60 }, 'Đệm nằm thú cưng tròn có gối và hình bàn chân (khu nghỉ của thú cưng)', (doc, ox, oy) => {
    let s = `<ellipse cx="${ox + 3}" cy="${oy - 18}" rx="44" ry="18" fill="${PAL.shadow}"/>`;
    const c = '#9ec9f0', r = ramp(c);
    const by = oy - 6;
    // thành đệm (vòng ngoài) – thấy từ trên
    s += ellipse(ox, by - 20, 42, 22, doc.sphere(c, 0.8), r.line, LINE.md);
    s += ellipse(ox, by - 22, 30, 14, doc.radial([[0, PAL.cream], [1, '#f3e3cf']], 0.5, 0.4, 0.6), r.line, LINE.sm);
    // viền trước dày
    s += shape(`M${ox - 42},${by - 20} Q${ox - 40},${by + 4} ${ox},${by + 4} Q${ox + 40},${by + 4} ${ox + 42},${by - 20} Q${ox + 30},${by - 6} ${ox},${by - 6} Q${ox - 30},${by - 6} ${ox - 42},${by - 20}Z`, doc.vgrad(lighten(c, 0.1)), r.line, LINE.md);
    // hình bàn chân
    const paw = (x, y) => ellipse(x, y + 2, 4, 3, PAL.pink, null) + circle(x - 4, y - 2.5, 1.6, PAL.pink, null) + circle(x, y - 4, 1.6, PAL.pink, null) + circle(x + 4, y - 2.5, 1.6, PAL.pink, null);
    s += paw(ox - 20, by - 6) + paw(ox + 22, by - 7);
    // gối nhỏ + đồ chơi bóng
    s += shape(blob(ox - 12, by - 26, 13, 7, 7, 0.1, 2), doc.vgrad(PAL.pinkLight), ramp(PAL.pink).line, LINE.sm);
    s += circle(ox + 16, by - 24, 6, doc.sphere(PAL.yellow), ramp(PAL.yellow).line, LINE.sm) + stroke(`M${ox + 10},${by - 24} Q${ox + 16},${by - 20} ${ox + 22},${by - 25}`, PAL.white, 1.6);
    return s;
  }, ['pet'], [2, 1]);

  // ── thảm picnic ──
  D('picnic-blanket', { w: 150, h: 100, ox: 75, oy: 72 }, 'Thảm picnic ca-rô hồng có giỏ (decal mặt đất + giỏ). Origin = mép trước thảm', (doc, ox, oy) => {
    const quad = `M${ox - 58},${oy - 50} L${ox + 58},${oy - 50} L${ox + 66},${oy} L${ox - 66},${oy}Z`;
    let s = `<path d="M${ox - 60},${oy - 46} L${ox + 64},${oy - 46} L${ox + 72},${oy + 4} L${ox - 62},${oy + 4}Z" fill="${PAL.shadowSoft}"/>`;
    s += shape(quad, PAL.white, ramp(PAL.rose).line, LINE.sm);
    const cl = doc.clip(`<path d="${quad}"/>`);
    let c = '';
    for (let i = 0; i < 6; i++) {
      const t0 = i / 6, t1 = (i + 0.5) / 6;
      c += `<path d="M${ox - 58 + 116 * t0},${oy - 50} L${ox - 58 + 116 * t1},${oy - 50} L${ox - 66 + 132 * t1},${oy} L${ox - 66 + 132 * t0},${oy}Z" fill="${PAL.rose}" opacity="0.55"/>`;
    }
    for (let j = 0; j < 4; j++) c += `<rect x="${ox - 70}" y="${oy - 50 + j * 12.5}" width="140" height="6.25" fill="${PAL.rose}" opacity="0.45"/>`;
    s += `<g clip-path="${cl}">${c}</g>` + shape(quad, 'none', ramp(PAL.rose).line, LINE.sm);
    // giỏ
    const bx = ox + 26, by = oy - 18;
    s += ellipse(bx + 2, by, 18, 5, PAL.shadow, null);
    s += stroke(`M${bx - 14},${by - 16} Q${bx},${by - 40} ${bx + 14},${by - 16}`, ramp(PAL.woodLight).line, 5) + stroke(`M${bx - 14},${by - 16} Q${bx},${by - 40} ${bx + 14},${by - 16}`, PAL.woodLight, 2.4);
    s += shape(`M${bx - 17},${by - 18} L${bx + 17},${by - 18} L${bx + 13},${by} L${bx - 13},${by}Z`, doc.vgrad(PAL.woodLight), WR.line, LINE.sm);
    s += stroke(`M${bx - 15},${by - 12} L${bx + 15},${by - 12} M${bx - 14},${by - 6} L${bx + 14},${by - 6}`, WR.lo, LINE.xs);
    s += circle(bx - 6, by - 21, 5, doc.sphere('#f2626b'), ramp('#f2626b').line, LINE.xs);
    // đĩa bánh
    s += ellipse(ox - 24, oy - 24, 14, 6, PAL.white, ramp(PAL.stone).line, LINE.sm) + ellipse(ox - 24, oy - 27, 7, 4, doc.vgrad(PAL.yellow), ramp(PAL.orange).line, LINE.xs) + circle(ox - 24, oy - 31, 2, '#f2626b', null);
    return s;
  }, ['picnic', 'ground'], [2, 1]);

  // ── chậu hoa ──
  D('flower-pot-1', { w: 50, h: 64, ox: 25, oy: 58 }, 'Chậu đất nung có tulip', (doc, ox, oy) => {
    let s = baseShadow(ox, oy - 3, 14, 4);
    s += leafTuft(doc, ox, oy - 22, 26, 14, PAL.leaf, 5, LINE.sm);
    s += stroke(`M${ox - 6},${oy - 26} L${ox - 8},${oy - 38} M${ox + 1},${oy - 26} L${ox + 2},${oy - 44} M${ox + 7},${oy - 26} L${ox + 9},${oy - 36}`, PAL.leafDark, LINE.sm);
    s += tulip(doc, ox - 8, oy - 38, 6, '#f2626b') + tulip(doc, ox + 2, oy - 44, 6.5, PAL.yellow) + tulip(doc, ox + 9, oy - 36, 5.5, PAL.pink);
    const c = '#e58f63', r = ramp(c);
    s += shape(`M${ox - 14},${oy - 22} L${ox + 14},${oy - 22} L${ox + 10},${oy - 2} L${ox - 10},${oy - 2}Z`, doc.vgrad(c), r.line, LINE.sm);
    s += rect(ox - 16, oy - 26, 32, 7, 3, doc.vgrad(lighten(c, 0.15)), r.line, LINE.sm);
    return s;
  }, ['flower', 'pot']);
  D('flower-pot-2', { w: 56, h: 64, ox: 28, oy: 58 }, 'Chậu sứ xanh có bụi cây tròn', (doc, ox, oy) => {
    let s = baseShadow(ox, oy - 3, 15, 4);
    s += canopy(doc, ox, oy - 38, 17, 15, PAL.leaf, 9, { lw: LINE.sm, sparkles: 1, clumps: [[-0.3, 0.1, 0.5], [0.3, 0.1, 0.5], [0, -0.3, 0.5]] });
    const c = '#8cbdf0', r = ramp(c);
    s += shape(`M${ox - 14},${oy - 24} Q${ox - 16},${oy - 4} ${ox - 8},${oy - 2} L${ox + 8},${oy - 2} Q${ox + 16},${oy - 4} ${ox + 14},${oy - 24}Z`, doc.sphere(c, 0.8), r.line, LINE.sm);
    s += rect(ox - 16, oy - 28, 32, 6, 3, doc.vgrad(PAL.white), r.line, LINE.sm);
    s += stroke(`M${ox - 10},${oy - 14} q5,-4 10,0 t10,0`, PAL.white, LINE.sm);
    return s;
  }, ['plant', 'pot']);

  // ── xích đu khung chữ A ──
  D('swing', { w: 130, h: 120, ox: 65, oy: 112 }, 'Xích đu khung gỗ chữ A cho bé', (doc, ox, oy) => {
    let s = baseShadow(ox, oy - 4, 54, 10);
    const by = oy - 4;
    const leg = (x, dir) => stroke(`M${x - 14 * dir},${by} L${x},${by - 96} L${x + 14 * dir},${by}`, ramp(PAL.woodDark).line, 9) + stroke(`M${x - 14 * dir},${by} L${x},${by - 96} L${x + 14 * dir},${by}`, PAL.wood, 5.5);
    s += leg(ox - 46, 1) + leg(ox + 46, 1);
    s += rect(ox - 54, by - 102, 108, 10, 5, doc.vgrad(PAL.woodLight), WR.line, LINE.md);
    s += stroke(`M${ox - 18},${by - 92} L${ox - 18},${by - 26} M${ox + 18},${by - 92} L${ox + 18},${by - 26}`, ramp(PAL.stone).line, 3.4) + stroke(`M${ox - 18},${by - 92} L${ox - 18},${by - 26} M${ox + 18},${by - 92} L${ox + 18},${by - 26}`, PAL.cream, 1.6);
    s += rect(ox - 24, by - 30, 48, 9, 4, doc.vgrad(PAL.yellow), ramp(PAL.yellow).line, LINE.sm);
    s += ellipse(ox + 2, by - 4, 22, 4, PAL.shadowSoft, null);
    return s;
  }, ['play'], [2, 1]);

  // ── giếng ──
  D('well', { w: 100, h: 120, ox: 50, oy: 112 }, 'Giếng đá có mái gỗ, ròng rọc và xô', (doc, ox, oy) => {
    let s = baseShadow(ox, oy - 4, 40, 10);
    const by = oy - 4, sr = ramp(PAL.stone);
    // trụ mái
    s += post(doc, ox - 32, by - 30, 56, 8) + post(doc, ox + 32, by - 30, 56, 8);
    // thành giếng
    s += shape(`M${ox - 36},${by - 34} L${ox - 36},${by - 4} Q${ox},${by + 8} ${ox + 36},${by - 4} L${ox + 36},${by - 34}Z`, doc.vgrad(PAL.stone), sr.line, LINE.md);
    const R = rng(9);
    for (let row = 0; row < 3; row++) for (let k = 0; k < 5; k++) {
      const x = ox - 30 + k * 14 + (row % 2) * 7, y = by - 30 + row * 9;
      if (x < ox + 30) s += rect(x, y, 12, 7, 3.5, lighten(PAL.stone, 0.2 + R() * 0.15), sr.lo, LINE.xs);
    }
    s += ellipse(ox, by - 34, 36, 11, doc.vgrad(PAL.stoneLight), sr.line, LINE.md);
    s += ellipse(ox, by - 33, 27, 7, doc.radial([[0, PAL.oceanAbyss], [1, '#4f6f9c']]), sr.line, LINE.sm);
    // ròng rọc + xô
    s += stroke(`M${ox - 32},${by - 78} L${ox + 32},${by - 78}`, ramp(PAL.woodDark).line, 6) + stroke(`M${ox - 32},${by - 78} L${ox + 32},${by - 78}`, PAL.woodDark, 3);
    s += stroke(`M${ox},${by - 78} L${ox},${by - 58}`, PAL.cream, 1.6);
    s += shape(`M${ox - 8},${by - 58} L${ox + 8},${by - 58} L${ox + 6},${by - 44} L${ox - 6},${by - 44}Z`, doc.vgrad(PAL.wood), WR.line, LINE.sm);
    // mái
    s += roofSlope(doc, ox, by - 80, by - 104, 46, 30, PAL.coral, { tiles: 'rows', step: 8 }).svg;
    return s;
  }, ['water'], [2, 1]);

  // ── dây đèn lồng ──
  D('lantern-string', { w: 200, h: 110, ox: 100, oy: 104 }, 'Dây đèn lồng giữa 2 cột (lễ hội, sáng ấm)', (doc, ox, oy) => {
    let s = baseShadow(ox - 84, oy - 3, 10, 3) + baseShadow(ox + 84, oy - 3, 10, 3);
    s += post(doc, ox - 84, oy - 2, 92, 8) + post(doc, ox + 84, oy - 2, 92, 8);
    const y0 = oy - 88;
    s += stroke(`M${ox - 84},${y0} Q${ox},${y0 + 36} ${ox + 84},${y0}`, PAL.woodDark, LINE.sm);
    const cols = [PAL.rose, PAL.yellow, PAL.mint, PAL.lavender, PAL.orange];
    for (let k = 1; k <= 5; k++) {
      const t = k / 6, x = ox - 84 + 168 * t, y = (1 - t) * (1 - t) * y0 + 2 * (1 - t) * t * (y0 + 36) + t * t * y0;
      const c = cols[k - 1];
      s += glow(doc, x, y + 12, 16, lighten(c, 0.5), 0.6);
      s += stroke(`M${x},${y} L${x},${y + 3}`, PAL.woodDark, LINE.xs);
      s += ellipse(x, y + 12, 8, 9.5, doc.radial([[0, lighten(c, 0.6)], [0.7, c], [1, darken(c, 0.1)]], 0.5, 0.45, 0.6), ramp(c).line, LINE.sm);
      s += rect(x - 4.5, y + 2, 9, 3, 1.5, ramp(c).line, null) + rect(x - 4.5, y + 20, 9, 3, 1.5, ramp(c).line, null);
    }
    return s;
  }, ['light', 'festival'], [3, 1]);

  // ── cối xay gió (spritesheet 4 khung) ──
  sheet({
    id: 'island-deco-windmill', file: 'island/decorations/windmill.png', fw: 200, fh: 250, frames: 4, ox: 100, oy: 234,
    usage: 'Cối xay gió nhỏ – spritesheet 4 khung cánh quay (vòng lặp liền vì cánh đối xứng 90°)', footprint: [2, 2],
    tags: ['decoration', 'placeable', 'animated', 'farm'],
    animations: [{ key: 'windmill-spin', frames: [0, 1, 2, 3], frameRate: 6, repeat: -1 }],
    drawFrame: (doc, i, ox, oy) => {
      let s = baseShadow(ox, oy - 6, 56, 13);
      const by = oy - 8;
      const wc = PAL.cream, wr = ramp('#e9d2b4');
      // tháp thon
      const tower = `M${ox - 46},${by} L${ox - 30},${by - 120} L${ox + 30},${by - 120} L${ox + 46},${by}Z`;
      s += shape(tower, doc.linear([[0, '#fffaf0'], [0.6, wc], [1, '#ead8c0']], 0, 0, 1, 0), wr.line, LINE.lg);
      s += foundation(doc, ox - 50, ox + 50, by + 2, PAL.stone);
      s += windowBox(doc, ox - 9, by - 96, 18, 22, { arch: true, sill: false, cross: false });
      s += shape(`M${ox - 14},${by - 2} L${ox - 14},${by - 30} A14,14 0 0 1 ${ox + 14},${by - 30} L${ox + 14},${by - 2}Z`, doc.vgrad(PAL.wood), WR.line, LINE.md);
      // mái
      s += shape(`M${ox - 40},${by - 116} Q${ox},${by - 172} ${ox + 40},${by - 116} Q${ox},${by - 108} ${ox - 40},${by - 116}Z`, doc.sphere(PAL.coral), ramp(PAL.coral).line, LINE.lg);
      s += gloss(ox - 14, by - 146, 9, 4, 0.5);
      // cánh quạt (xoay)
      const hx = ox, hy = by - 124;
      let blades = '';
      for (let k = 0; k < 4; k++) {
        blades += `<g transform="rotate(${k * 90 + i * 22.5} ${hx} ${hy})">`;
        blades += rect(hx - 3, hy - 84, 6, 84, 3, PAL.woodDark, ramp(PAL.woodDark).line, LINE.sm);
        blades += rect(hx + 2, hy - 80, 20, 60, 3, doc.vgrad(PAL.white), wr.line, LINE.sm);
        for (let j = 1; j < 4; j++) blades += stroke(`M${hx + 3},${hy - 80 + j * 15} L${hx + 21},${hy - 80 + j * 15}`, wr.lo, LINE.xs);
        blades += `</g>`;
      }
      s += blades;
      s += circle(hx, hy, 8, doc.sphere(PAL.yellow), ramp(PAL.yellow).line, LINE.md);
      return s;
    },
  });
}

import { foundation } from './island-buildings.mjs';
