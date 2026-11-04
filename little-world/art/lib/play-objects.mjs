// ── Little World · Phase 2: đồ vật cho mini-game ──
// Môi trường sống, đồ đếm, mảnh ghép hình, khối xây, thẻ bài, phần thưởng, đồ phân loại.
// Mọi hàm vẽ nhận (doc) và vẽ trong khung cố định (w×h đơn vị) — KHÔNG cắt sát nội dung,
// vì mã game dựa vào kích thước chính xác (khối xây = thân vật lý, hình = ô bóng).
import { PAL, LINE, ramp, lighten, darken, mix, rng, smoothPath, puffPath, blob, gloss, r2 } from './style.mjs';
import { canopy, flowerHead, leafTuft, blade, pebble, sparkle, leaf } from './island-kit.mjs';
import { eye, mouth, blush, starPath, heartPath } from './characters-rig.mjs';
import { P, L, E, ell } from './play-animals.mjs';

const LW = 4, LS = 2.8;
const lineOf = (c) => mix(ramp(c).line, PAL.ink, 0.25);
const R = (x, y, w, h, rx, fill, line, lw = LW, extra = '') => `<rect x="${r2(x)}" y="${r2(y)}" width="${r2(w)}" height="${r2(h)}" rx="${r2(rx)}" fill="${fill}" ${line ? `stroke="${line}" stroke-width="${lw}"` : ''} stroke-linejoin="round" ${extra}/>`;
const shadow = (cx, cy, rx) => E(cx + rx * 0.06, cy, rx, rx * 0.2, PAL.shadow, null) + E(cx + rx * 0.04, cy, rx * 0.68, rx * 0.14, PAL.shadow, null);
const poly = (pts) => 'M' + pts.map(([x, y]) => `${r2(x)},${r2(y)}`).join(' L') + 'Z';

export const DEFS = [];
const def = (id, sub, w, h, usage, draw, extra = {}) => DEFS.push({ id, file: `play/${sub}/${id.replace(/^(animal|habitat|item|shape|block|card|reward|bin|trash|sea|sort|play)-/, '')}.png`, category: `play/${sub}`, w, h, usage, draw, origin: [0.5, 0.5], ...extra });

// ═════════════════════════ môi trường sống (360×240) ═════════════════════════
function card(doc, w, h, inner) {
  const clip = doc.clip(`<rect x="7" y="7" width="${w - 14}" height="${h - 14}" rx="24"/>`);
  return R(3, 3, w - 6, h - 6, 28, PAL.white, '#d9cfe6', 3) + `<g clip-path="${clip}">${inner}</g>` + R(7, 7, w - 14, h - 14, 24, 'none', 'rgba(76,56,118,.18)', 2);
}
const sky = (doc, w, h, top = PAL.skyLight, bot = PAL.sky) => R(0, 0, w, h, 0, doc.linear([[0, bot], [1, top]]), null);
const cloud = (x, y, s) => `<path d="${puffPath(x, y, 26 * s, 11 * s, 7, 0.22, 3)}" fill="#ffffff" opacity=".92"/>`;

function hills(doc, w, y, color, seed, amp = 18) {
  const r = rng(seed), pts = [[0, y]];
  for (let x = 0; x <= w; x += w / 4) pts.push([x, y - amp * (0.4 + r())]);
  return P(smoothPath([...pts, [w, y], [w, 260], [0, 260]], false, 0.7) + 'Z', doc.vgrad(color), lineOf(color), LS);
}

def('habitat-farm', 'habitats', 360, 240, 'Thẻ môi trường: nông trại (chuồng, hàng rào, cánh đồng)', (doc) => {
  let s = sky(doc, 360, 240) + cloud(70, 40, 1) + cloud(260, 30, 0.8);
  s += hills(doc, 360, 128, PAL.grassLight, 3, 22);
  // cánh đồng sọc
  s += P('M0,150 L360,140 L360,240 L0,240Z', doc.vgrad(PAL.grass), lineOf(PAL.grass), LS);
  for (let i = 0; i < 6; i++) s += L(`M${-20 + i * 70},240 Q${40 + i * 56},190 ${100 + i * 46},146`, PAL.grassDark, 5, 'opacity=".45"');
  // chuồng đỏ
  const bx = 210, by = 150, red = '#f07a6e', rr = ramp(red);
  s += R(bx, by - 62, 92, 64, 4, doc.vgrad(red), lineOf(red), LW);
  s += P(`M${bx - 10},${by - 58} L${bx + 46},${by - 96} L${bx + 102},${by - 58}Z`, doc.vgrad('#b0586a'), lineOf('#b0586a'), LW);
  s += R(bx + 30, by - 38, 32, 40, 3, PAL.white, rr.line, LS) + L(`M${bx + 30},${by - 38} L${bx + 62},${by + 2} M${bx + 62},${by - 38} L${bx + 30},${by + 2}`, rr.line, LS);
  s += R(bx + 36, by - 82, 20, 16, 3, PAL.yellowLight, rr.line, LS);
  // hàng rào
  for (let x = 14; x < 190; x += 30) s += R(x, 150, 10, 40, 3, doc.vgrad(PAL.woodLight), lineOf(PAL.wood), LS);
  s += R(6, 158, 190, 9, 3, doc.vgrad(PAL.wood), lineOf(PAL.wood), LS) + R(6, 176, 190, 9, 3, doc.vgrad(PAL.wood), lineOf(PAL.wood), LS);
  s += canopy(doc, 330, 112, 30, 28, PAL.leaf, 5, { lw: LS, sparkles: 3 });
  for (const x of [60, 120, 300]) s += flowerHead(doc, x, 214, 9, PAL.pink);
  return card(doc, 360, 240, s);
});

def('habitat-pond', 'habitats', 360, 240, 'Thẻ môi trường: ao hồ (mặt nước, lau sậy, lá súng)', (doc) => {
  let s = sky(doc, 360, 240) + cloud(280, 36, 1);
  s += hills(doc, 360, 110, PAL.grassLight, 9, 16);
  s += R(0, 100, 360, 140, 0, doc.vgrad(PAL.grass), null);
  s += P(ell(180, 172, 150, 56), doc.linear([[0, PAL.oceanLight], [1, PAL.ocean]]), lineOf(PAL.ocean), LW);
  s += E(180, 166, 128, 40, 'none', '#ffffff', 3, 'opacity=".35"');
  for (const [x, y, k] of [[110, 180, 1], [230, 196, 0.8], [270, 160, 0.7]]) {
    s += P(`M${x},${y} m-${22 * k},0 a${22 * k},${10 * k} 0 1 1 ${44 * k},0 a${22 * k},${10 * k} 0 0 1 -${30 * k},${8 * k} l${8 * k},-${8 * k}Z`, doc.vgrad(PAL.leaf), lineOf(PAL.leafDark), LS);
  }
  s += flowerHead(doc, 236, 190, 10, PAL.pinkLight, PAL.yellow, 6);
  for (const [x, h] of [[34, 70], [50, 86], [66, 62], [306, 74], [322, 90], [338, 64]]) {
    s += L(`M${x},${200} Q${x + 4},${200 - h / 2} ${x},${200 - h}`, PAL.leafDark, 4);
    s += R(x - 5, 200 - h - 4, 10, 26, 5, doc.vgrad('#a5754f'), lineOf('#a5754f'), 2.4);
  }
  for (const [x, y] of [[150, 150], [200, 184]]) s += E(x, y, 12, 3, '#fff', null, 0, 'opacity=".5"');
  return card(doc, 360, 240, s);
});

def('habitat-forest', 'habitats', 360, 240, 'Thẻ môi trường: khu rừng (nhiều cây, nấm)', (doc) => {
  let s = sky(doc, 360, 240, '#e6f6d8', '#bfe6c4');
  s += canopy(doc, 50, 80, 50, 52, PAL.leafDark, 3, { lw: LS, sparkles: 2 });
  s += canopy(doc, 300, 74, 56, 56, PAL.leafDark, 7, { lw: LS, sparkles: 2 });
  s += R(0, 150, 360, 90, 0, doc.vgrad(PAL.grass), null);
  s += hills(doc, 360, 160, PAL.grass, 4, 14);
  const trunk = (x, y, h) => R(x - 9, y, 18, h, 6, doc.vgrad(PAL.woodDark), lineOf(PAL.woodDark), LS);
  s += trunk(120, 110, 70) + canopy(doc, 120, 92, 46, 48, PAL.leaf, 11, { lw: LW, sparkles: 4 });
  s += trunk(236, 100, 84) + canopy(doc, 236, 84, 52, 52, '#8fd174', 13, { lw: LW, sparkles: 4 });
  for (const [x, y, k, c] of [[64, 200, 1, '#f07a6e'], [90, 212, 0.7, '#f07a6e'], [300, 206, 0.9, PAL.orange]]) {
    s += R(x - 6 * k, y - 4, 12 * k, 18 * k, 5, PAL.cream, lineOf(PAL.sand), 2.4);
    s += P(`M${x - 18 * k},${y} Q${x},${y - 26 * k} ${x + 18 * k},${y}Z`, doc.vgrad(c), lineOf(c), LS);
    s += E(x - 6 * k, y - 8 * k, 3 * k, 2.4 * k, '#fff', null) + E(x + 6 * k, y - 6 * k, 2.4 * k, 2 * k, '#fff', null);
  }
  s += leafTuft(doc, 180, 226, 70, 26, PAL.grassDark, 5, LS);
  return card(doc, 360, 240, s);
});

def('habitat-savanna', 'habitats', 360, 240, 'Thẻ môi trường: đồng cỏ châu Phi (cỏ vàng, cây keo, mặt trời)', (doc) => {
  let s = sky(doc, 360, 240, '#fff0c8', '#ffcf9a');
  s += `<circle cx="280" cy="62" r="30" fill="${doc.sphere(PAL.yellow, 0.6)}" stroke="${lineOf(PAL.orange)}" stroke-width="${LS}"/>`;
  s += hills(doc, 360, 140, '#f2c97a', 6, 20);
  s += R(0, 150, 360, 90, 0, doc.vgrad('#f6d98c'), null);
  s += P('M0,160 Q180,140 360,158 L360,240 L0,240Z', doc.vgrad('#f6d98c'), lineOf('#e4b860'), LS);
  // cây keo tán phẳng
  s += P('M92,190 Q96,150 88,118 L100,118 Q108,150 108,190Z', doc.vgrad(PAL.woodDark), lineOf(PAL.woodDark), LS);
  s += L('M96,130 Q76,118 66,108 M100,128 Q124,116 132,104', PAL.woodDark, 6);
  s += P(`M30,104 Q40,74 96,76 Q156,72 168,102 Q150,114 98,112 Q48,116 30,104Z`, doc.vgrad('#8fbf5a'), lineOf('#6a9a44'), LW);
  s += L('M48,98 Q96,90 152,98', '#b5d97a', 4, 'opacity=".8"');
  const r = rng(4);
  for (let i = 0; i < 26; i++) { const x = 10 + i * 13.5, y = 214 + r() * 20; s += blade(x, y, 22 + r() * 16, (r() - 0.5) * 10, 4, '#e8b85a', lineOf('#d09a3c'), 1.6); }
  return card(doc, 360, 240, s);
});

// ═════════════════════════ đồ đếm (120×120) ═════════════════════════
const C60 = 60;
def('item-apple', 'items', 120, 120, 'Quả táo đỏ (đếm, thu thập)', (doc) => {
  const c = '#f2665e';
  let s = shadow(60, 104, 34);
  s += P(`M60,34 C36,22 12,36 14,66 C16,92 38,106 60,100 C82,106 104,92 106,66 C108,36 84,22 60,34Z`, doc.sphere(c, 1), lineOf(c), LW);
  s += gloss(38, 52, 9, 6, 0.55);
  s += L('M60,36 Q58,22 64,12', PAL.woodDark, 5);
  s += leaf(doc, 64, 22, 26, 11, 60, PAL.leaf, LS);
  return s;
});
def('item-orange', 'items', 120, 120, 'Quả cam (đếm, thu thập)', (doc) => {
  const c = PAL.orange;
  let s = shadow(60, 104, 34);
  s += P(ell(60, 64, 44, 42), doc.sphere(c, 1.1), lineOf(PAL.orangeDeep), LW);
  for (const [x, y] of [[44, 56], [70, 48], [78, 74], [54, 82], [36, 72], [62, 66]]) s += E(x, y, 1.8, 1.6, ramp(c).lo, null, 0, 'opacity=".55"');
  s += gloss(42, 46, 10, 6, 0.55);
  s += E(60, 24, 5, 3, PAL.leafDark, null);
  s += leaf(doc, 62, 24, 24, 10, 70, PAL.leaf, LS);
  return s;
});
def('item-banana', 'items', 120, 120, 'Quả chuối (đếm, thu thập)', (doc) => {
  const c = PAL.yellow;
  let s = shadow(60, 104, 38);
  s += P('M20,44 Q24,92 64,96 Q96,96 106,70 Q90,80 66,78 Q38,74 32,40 Q26,34 20,44Z', doc.vgrad(c), lineOf('#e4ae3e'), LW);
  s += L('M30,48 Q38,82 70,86', '#f2c24a', 3, 'opacity=".9"');
  s += R(18, 30, 12, 16, 4, doc.vgrad('#9b7a45'), lineOf('#9b7a45'), LS, 'transform="rotate(-14 24 38)"');
  s += E(104, 71, 4, 3, '#7a5a3a', null);
  s += gloss(40, 66, 10, 4, 0.5, 50);
  return s;
});
def('item-strawberry', 'items', 120, 120, 'Quả dâu tây (đếm, thu thập)', (doc) => {
  const c = '#f25f6e';
  let s = shadow(60, 106, 30);
  s += P('M60,104 C30,92 16,60 22,44 C28,30 48,30 60,36 C72,30 92,30 98,44 C104,60 90,92 60,104Z', doc.sphere(c, 1), lineOf(c), LW);
  for (const [x, y] of [[42, 52], [60, 50], [78, 52], [48, 68], [70, 68], [58, 84], [36, 64], [84, 64]]) s += E(x, y, 2.2, 3, PAL.yellowLight, null);
  s += gloss(38, 50, 7, 5, 0.5);
  s += P('M60,40 L44,30 L52,26 L40,18 L56,22 L60,10 L64,22 L80,18 L68,26 L76,30Z', doc.vgrad(PAL.leaf), lineOf(PAL.leafDark), LS);
  return s;
});
def('item-carrot', 'items', 120, 120, 'Củ cà rốt (đếm, thu thập)', (doc) => {
  const c = '#ff9a4a';
  let s = shadow(60, 108, 28);
  s += P('M38,40 Q60,30 82,40 Q78,72 62,106 Q58,110 56,104 Q42,72 38,40Z', doc.vgrad(c), lineOf(PAL.orangeDeep), LW);
  for (const y of [54, 68, 82]) s += L(`M${48 + (y - 54) / 5},${y} l10,1`, ramp(c).lo, 2.6);
  s += gloss(48, 50, 4, 9, 0.45, 0);
  for (const [r, l] of [[-28, 28], [0, 32], [26, 28]]) s += leaf(doc, 60, 38, l, 10, r, PAL.leaf, LS);
  return s;
});
def('item-star', 'items', 120, 120, 'Ngôi sao vàng (đếm, thu thập)', (doc) => {
  let s = shadow(60, 108, 30);
  s += P(starPath(60, 60, 50, 24), doc.sphere(PAL.yellow, 1.1), lineOf('#e4a63e'), LW);
  s += P(starPath(60, 60, 34, 16), 'none', '#fff', 2.4, 'opacity=".55"');
  s += gloss(46, 42, 8, 5, 0.6);
  return s;
});
def('item-flower', 'items', 120, 120, 'Bông hoa hồng (đếm, thu thập)', (doc) => {
  let s = shadow(60, 108, 26);
  s += L('M60,62 Q56,86 60,106', PAL.leafDark, 5);
  s += leaf(doc, 59, 96, 24, 9, -55, PAL.leaf, LS) + leaf(doc, 60, 88, 22, 8, 55, PAL.leaf, LS);
  s += flowerHead(doc, 60, 48, 44, PAL.pink, PAL.yellow, 5);
  return s;
});
def('item-mushroom', 'items', 120, 120, 'Cây nấm đỏ chấm trắng (đếm, thu thập)', (doc) => {
  const c = '#f2665e';
  let s = shadow(60, 106, 30);
  s += P('M44,62 Q42,96 50,104 L70,104 Q78,96 76,62Z', doc.vgrad(PAL.cream), lineOf(PAL.sand), LW);
  s += P('M12,66 Q14,18 60,16 Q106,18 108,66 Q60,78 12,66Z', doc.sphere(c, 1), lineOf(c), LW);
  for (const [x, y, r] of [[36, 46, 7], [60, 32, 6], [84, 46, 7], [58, 56, 5]]) s += E(x, y, r, r * 0.85, PAL.white, null);
  s += gloss(34, 30, 9, 4, 0.5);
  return s;
});

// ═════════════════════════ mảnh hình (gỗ đồ chơi) ═════════════════════════
// Hình lấp kín khung (trừ nửa nét viền), không có bóng ngoài silhouette.
const SL = 5, I = SL / 2 + 0.5;
function toyPiece(doc, d, inner, c, cx, cy, w, h) {
  let s = P(d, doc.sphere(c, 1.1), lineOf(c), SL);
  const clip = doc.clip(`<path d="${inner}"/>`);
  s += `<path d="${inner}" fill="none" stroke="${lighten(c, 0.45)}" stroke-width="3" stroke-linejoin="round" opacity=".85"/>`;
  s += `<g clip-path="${clip}">${gloss(cx - w * 0.16, cy - h * 0.2, w * 0.12, h * 0.07, 0.55)}</g>`;
  return s;
}
const scalePath = (fn, k) => fn(k);
def('shape-circle', 'shapes', 160, 160, 'Mảnh ghép hình tròn (đỏ)', (doc) => toyPiece(doc, ell(80, 80, 80 - I, 80 - I), ell(80, 80, 60, 60), '#f2665e', 80, 80, 160, 160));
def('shape-square', 'shapes', 160, 160, 'Mảnh ghép hình vuông (xanh dương)', (doc) => toyPiece(doc, rrect(I, I, 160 - 2 * I, 160 - 2 * I, 16), rrect(20, 20, 120, 120, 10), '#6aa8ec', 80, 80, 160, 160));
def('shape-triangle', 'shapes', 160, 160, 'Mảnh ghép hình tam giác (vàng)', (doc) => toyPiece(doc, roundPoly([[80, I + 2], [160 - I - 1, 160 - I], [I + 1, 160 - I]], 10), roundPoly([[80, 34], [130, 140], [30, 140]], 8), '#ffd24a', 80, 96, 160, 160));
def('shape-rectangle', 'shapes', 200, 120, 'Mảnh ghép hình chữ nhật (xanh lá)', (doc) => toyPiece(doc, rrect(I, I, 200 - 2 * I, 120 - 2 * I, 14), rrect(20, 20, 160, 80, 9), '#7cc96a', 100, 60, 200, 120));
def('shape-star', 'shapes', 160, 160, 'Mảnh ghép ngôi sao (cam)', (doc) => {
  const Rr = (160 - 2 * I) / 1.809, cy = I + Rr;
  return toyPiece(doc, starPath(80, cy, Rr, Rr * 0.5), starPath(80, cy, Rr * 0.66, Rr * 0.33), PAL.orange, 80, cy, 160, 160);
});
def('shape-heart', 'shapes', 160, 160, 'Mảnh ghép trái tim (hồng)', (doc) => {
  const H = (k) => { const t = (x, y) => `${r2(80 + (x - 80) * k)},${r2(80 + (y - 80) * k)}`; return `M${t(80, 153)} C${t(22, 112)} ${t(4, 80)} ${t(5, 50)} C${t(6, 22)} ${t(28, 6)} ${t(52, 6)} C${t(66, 6)} ${t(76, 14)} ${t(80, 27)} C${t(84, 14)} ${t(94, 6)} ${t(108, 6)} C${t(132, 6)} ${t(154, 22)} ${t(155, 50)} C${t(156, 80)} ${t(138, 112)} ${t(80, 153)}Z`; };
  return toyPiece(doc, H(1), H(0.72), '#f58aa8', 80, 70, 160, 160);
});
def('shape-oval', 'shapes', 180, 130, 'Mảnh ghép hình bầu dục (tím lavender)', (doc) => toyPiece(doc, ell(90, 65, 90 - I, 65 - I), ell(90, 65, 68, 46), '#b39adb', 90, 65, 180, 130));
def('shape-diamond', 'shapes', 160, 160, 'Mảnh ghép hình thoi (xanh bạc hà)', (doc) => toyPiece(doc, roundPoly([[80, I + 1], [160 - I - 1, 80], [80, 160 - I - 1], [I + 1, 80]], 8), roundPoly([[80, 26], [134, 80], [80, 134], [26, 80]], 6), '#6fd0b0', 80, 80, 160, 160));

function rrect(x, y, w, h, r) { return `M${r2(x + r)},${r2(y)} H${r2(x + w - r)} Q${r2(x + w)},${r2(y)} ${r2(x + w)},${r2(y + r)} V${r2(y + h - r)} Q${r2(x + w)},${r2(y + h)} ${r2(x + w - r)},${r2(y + h)} H${r2(x + r)} Q${r2(x)},${r2(y + h)} ${r2(x)},${r2(y + h - r)} V${r2(y + r)} Q${r2(x)},${r2(y)} ${r2(x + r)},${r2(y)}Z`; }
/** Đa giác bo góc (bán kính r) nằm TRONG đa giác gốc. */
function roundPoly(pts, r) {
  const n = pts.length;
  let d = '';
  for (let i = 0; i < n; i++) {
    const p = pts[i], a = pts[(i - 1 + n) % n], b = pts[(i + 1) % n];
    const ua = norm([a[0] - p[0], a[1] - p[1]]), ub = norm([b[0] - p[0], b[1] - p[1]]);
    const p1 = [p[0] + ua[0] * r, p[1] + ua[1] * r], p2 = [p[0] + ub[0] * r, p[1] + ub[1] * r];
    d += `${i ? ' L' : 'M'}${r2(p1[0])},${r2(p1[1])} Q${r2(p[0])},${r2(p[1])} ${r2(p2[0])},${r2(p2[1])}`;
  }
  return d + 'Z';
}
function norm([x, y]) { const l = Math.hypot(x, y) || 1; return [x / l, y / l]; }

def('play-board-wood', 'shapes', 1000, 620, 'Khay gỗ để đặt ô bóng của trò ghép hình', (doc) => {
  const c = PAL.woodLight;
  let s = R(4, 10, 992, 606, 46, PAL.shadowSoft, null);
  s += R(4, 4, 992, 600, 46, doc.vgrad(c), lineOf(PAL.wood), 6);
  s += R(36, 34, 928, 540, 30, doc.linear([[0, darken(PAL.sand, 0.12)], [0.06, PAL.sand], [1, lighten(PAL.sand, 0.15)]]), lineOf(PAL.woodLight), 4);
  const r = rng(7);
  for (let i = 0; i < 9; i++) { const y = 70 + i * 58 + r() * 10; s += L(`M${70 + r() * 80},${y} Q${400 + r() * 200},${y - 10 + r() * 20} ${870 - r() * 80},${y + 4}`, darken(PAL.sand, 0.1), 2.4, 'opacity=".55"'); }
  for (const [x, y] of [[20, 20], [980, 20], [20, 588], [980, 588]]) s += E(x, y, 7, 7, doc.sphere(PAL.yellow, 1), lineOf(PAL.wood), 2.4);
  s += gloss(160, 18, 90, 5, 0.4, 0);
  return s;
});

// ═════════════════════════ khối xây (kích thước chính xác) ═════════════════════════
const BL = 3, BI = BL / 2;
function blockRect(doc, w, h, c, r = 8, deco = '') {
  let s = R(BI, BI, w - BL, h - BL, r, doc.vgrad(c, 1.2), lineOf(c), BL);
  s += R(BI + 5, BI + 5, w - BL - 10, h - BL - 10, Math.max(2, r - 4), 'none', lighten(c, 0.4), 2, 'opacity=".9"');
  s += deco;
  s += gloss(w * 0.28, h * 0.22, Math.min(w, h) * 0.16, Math.min(w, h) * 0.07, 0.5, -20);
  return s;
}
const cube = (c, mark) => (doc) => blockRect(doc, 64, 64, c, 9, mark ? mark(doc) : '');
def('block-cube-red', 'blocks', 64, 64, 'Khối vuông đỏ 64×64', cube('#f2665e', () => P(starPath(32, 33, 11, 5.5), '#ffffff', 'none', 0, 'opacity=".55"')));
def('block-cube-yellow', 'blocks', 64, 64, 'Khối vuông vàng 64×64', cube('#ffd24a', () => P(heartPath(32, 33, 9), '#ffffff', 'none', 0, 'opacity=".6"')));
def('block-cube-blue', 'blocks', 64, 64, 'Khối vuông xanh dương 64×64', cube('#6aa8ec', () => E(32, 32, 10, 10, '#ffffff', null, 0, 'opacity=".5"')));
def('block-cube-green', 'blocks', 64, 64, 'Khối vuông xanh lá 64×64', cube('#7cc96a', () => P('M32,22 L42,40 L22,40Z', '#ffffff', 'none', 0, 'opacity=".55"')));
def('block-plank', 'blocks', 192, 32, 'Thanh gỗ dài 192×32 (làm sàn, cầu)', (doc) => {
  const c = PAL.wood;
  let s = R(BI, BI, 192 - BL, 32 - BL, 7, doc.vgrad(c, 1.2), lineOf(c), BL);
  s += L('M20,14 Q60,8 100,14 T176,12', ramp(c).lo, 2, 'opacity=".7"') + L('M34,22 Q70,26 120,21', ramp(c).lo, 1.6, 'opacity=".6"');
  for (const x of [12, 180]) s += E(x, 16, 3, 3, ramp(c).deep, null);
  s += gloss(50, 8, 26, 2.4, 0.5, 0);
  return s;
});
const pillar = (c) => (doc) => {
  let s = R(BI, BI, 32 - BL, 128 - BL, 7, doc.linear([[0, lighten(c, 0.25)], [0.45, c], [1, darken(c, 0.18)]], 0, 0, 1, 0), lineOf(c), BL);
  for (const y of [22, 106]) s += R(BI, y - 5, 32 - BL, 10, 3, lighten(c, 0.2), lineOf(c), 2);
  s += R(8, 30, 5, 70, 2.5, '#ffffff', null, 0, 'opacity=".4"');
  return s;
};
def('block-pillar-orange', 'blocks', 32, 128, 'Cột cam 32×128', pillar(PAL.orange));
def('block-pillar-purple', 'blocks', 32, 128, 'Cột tím 32×128', pillar('#a58be0'));
const roof = (c) => (doc) => {
  const d = roundPoly([[64, BI], [128 - BI, 64 - BI], [BI, 64 - BI]], 5);
  const clip = doc.clip(`<path d="${d}"/>`);
  let s = P(d, doc.vgrad(c, 1.2), lineOf(c), BL);
  let rows = '';
  for (let y = 26; y < 64; y += 13) for (let x = -8; x < 140; x += 16) rows += `<path d="M${x},${y} q8,9 16,0" fill="none" stroke="${darken(c, 0.15)}" stroke-width="2"/>`;
  s += `<g clip-path="${clip}">${rows}</g>`;
  s += gloss(46, 26, 10, 4, 0.5, -28);
  return s;
};
def('block-roof-red', 'blocks', 128, 64, 'Mái tam giác đỏ 128×64', roof('#f2665e'));
def('block-roof-blue', 'blocks', 128, 64, 'Mái tam giác xanh 128×64', roof('#6aa8ec'));
def('block-dome-yellow', 'blocks', 128, 64, 'Mái vòm nửa tròn vàng 128×64', (doc) => {
  const c = '#ffd24a', r = 64 - BI;
  const d = `M${BI},${64 - BI} A${r},${r - BI} 0 0 1 ${128 - BI},${64 - BI} Z`;
  let s = P(d, doc.sphere(c, 1.1), lineOf(c), BL);
  s += `<path d="M18,${64 - BI} A46,44 0 0 1 110,${64 - BI}" fill="none" stroke="${lighten(c, 0.45)}" stroke-width="2.4" opacity=".9"/>`;
  s += gloss(40, 22, 12, 5, 0.55, -30);
  return s;
});
def('block-window', 'blocks', 64, 64, 'Khối tường có cửa sổ 64×64', (doc) => {
  const c = PAL.cream;
  let s = R(BI, BI, 64 - BL, 64 - BL, 9, doc.vgrad(c, 1.4), lineOf(PAL.sand), BL);
  s += R(14, 14, 36, 36, 6, doc.linear([[0, PAL.skyLight], [1, PAL.sky]]), lineOf(PAL.wood), 3);
  s += L('M32,15 L32,49 M15,32 L49,32', PAL.woodLight, 3.4);
  s += L('M19,24 L26,18', '#ffffff', 2.4, 'opacity=".9"');
  return s;
});
def('block-door', 'blocks', 64, 96, 'Khối tường có cửa ra vào 64×96', (doc) => {
  const c = PAL.peach;
  let s = R(BI, BI, 64 - BL, 96 - BL, 9, doc.vgrad(c, 1.3), lineOf(c), BL);
  s += P('M14,94 L14,44 Q14,24 32,24 Q50,24 50,44 L50,94Z', doc.vgrad(PAL.wood), lineOf(PAL.wood), 3);
  s += L('M32,26 L32,92', ramp(PAL.wood).lo, 2) + E(43, 64, 3, 3, PAL.yellow, lineOf(PAL.wood), 1.6);
  return s;
});
def('block-ground', 'blocks', 1200, 60, 'Dải đất cỏ làm nền cho trò xây dựng (mép trên phẳng ở y=0)', (doc) => {
  let s = R(0, 0, 1200, 60, 0, doc.linear([[0, PAL.soil], [1, PAL.soilDark]]), null);
  const r = rng(3);
  for (let i = 0; i < 22; i++) s += pebble(doc, 30 + i * 54 + r() * 20, 36 + r() * 16, 7 + r() * 5, 4 + r() * 3, PAL.earth, i + 1, 1.6);
  let edge = 'M0,0 L1200,0 L1200,18';
  for (let x = 1200; x >= 0; x -= 40) edge += ` Q${x - 20},${26 + (x % 80 ? 3 : -2)} ${x - 40},18`;
  s += `<path d="${edge}Z" fill="${doc.linear([[0, PAL.grassLight], [1, PAL.grass]])}"/>`;
  s += `<path d="${edge.replace('M0,0 L1200,0 L1200,18', 'M1200,18')}" fill="none" stroke="${PAL.grassDark}" stroke-width="3"/>`;
  s += R(0, 0, 1200, 3, 0, PAL.grassDeep, null);
  return s;
});

// ═════════════════════════ thẻ bài (160×200) ═════════════════════════
def('card-back', 'cards', 160, 200, 'Mặt sau thẻ trò lật thẻ ghi nhớ', (doc) => {
  const c = PAL.lavender;
  let s = R(3, 3, 154, 194, 20, PAL.white, '#cbbde6', 3);
  const clip = doc.clip(`<rect x="11" y="11" width="138" height="178" rx="14"/>`);
  let pat = R(0, 0, 160, 200, 0, doc.vgrad(c, 1.1), null);
  for (let y = 0; y < 220; y += 34) for (let x = (y / 34) % 2 ? 0 : 17; x < 180; x += 34) {
    pat += ((x + y) / 17) % 2 ? P(starPath(x, y, 7, 3.4), lighten(c, 0.35), 'none', 0, 'opacity=".8"') : `<path d="M${x},${y - 7} Q${x + 6},${y} ${x},${y + 7} Q${x - 6},${y} ${x},${y - 7}Z" fill="${lighten(c, 0.3)}" opacity=".8"/>`;
  }
  s += `<g clip-path="${clip}">${pat}</g>` + R(11, 11, 138, 178, 14, 'none', darken(c, 0.25), 2.4);
  s += E(80, 100, 34, 34, doc.sphere(PAL.white, 0.6), darken(c, 0.25), 3);
  s += P(starPath(80, 102, 24, 11), doc.sphere(PAL.yellow, 1), lineOf('#e4a63e'), 3);
  s += gloss(40, 30, 18, 6, 0.4, -20);
  return s;
});
def('card-front', 'cards', 160, 200, 'Mặt trước thẻ (trống) để đặt hình con vật', (doc) => {
  let s = R(3, 3, 154, 194, 20, PAL.white, '#cbbde6', 3);
  s += R(11, 11, 138, 178, 14, doc.linear([[0, '#fffdf8'], [1, PAL.cream]]), '#eadfce', 2.4);
  s += gloss(40, 28, 18, 5, 0.5, -20);
  return s;
});

// ═════════════════════════ phần thưởng (96×96) ═════════════════════════
def('reward-star', 'rewards', 96, 96, 'Biểu tượng phần thưởng: sao', (doc) => {
  let s = P(starPath(48, 51, 42, 20), doc.sphere(PAL.yellow, 1.1), lineOf('#e4a63e'), LW);
  s += P(starPath(48, 51, 27, 13), 'none', '#fff', 2.2, 'opacity=".5"') + gloss(36, 34, 7, 4, 0.6);
  s += sparkle(84, 14, 8) + sparkle(12, 20, 5);
  return s;
});
def('reward-seed', 'rewards', 96, 96, 'Biểu tượng phần thưởng: hạt giống (gói hạt)', (doc) => {
  let s = P('M18,20 L78,20 L76,84 Q48,90 20,84Z', doc.vgrad(PAL.cream), lineOf(PAL.sand), LW);
  s += P('M18,20 L26,12 L34,20 L42,12 L50,20 L58,12 L66,20 L74,12 L78,20Z', PAL.white, lineOf(PAL.sand), LS);
  s += R(26, 30, 44, 36, 8, doc.linear([[0, PAL.skyLight], [1, PAL.mint]]), lineOf(PAL.mint), 2.4);
  s += L('M48,64 L48,48', PAL.leafDark, 3) + flowerHead(doc, 48, 44, 18, PAL.pink, PAL.yellow);
  for (const [x, y, r] of [[72, 80, 0], [84, 72, 30], [80, 88, -20]]) s += P(ell(x, y, 6, 4, r), doc.sphere('#b8875a', 1), lineOf('#9b6a3c'), 2);
  return s;
});
def('reward-wood', 'rewards', 96, 96, 'Biểu tượng phần thưởng: gỗ (bó khúc gỗ)', (doc) => {
  let s = '';
  const log = (x, y) => R(x - 30, y - 11, 52, 22, 10, doc.vgrad(PAL.wood), lineOf(PAL.wood), LS) + E(x + 22, y, 10, 11, doc.sphere(PAL.woodLight, 0.6), lineOf(PAL.wood), LS) + E(x + 22, y, 5, 5.5, 'none', ramp(PAL.wood).lo, 1.6);
  s += log(34, 70) + log(62, 70) + log(48, 48);
  s += leaf(doc, 30, 40, 18, 8, -40, PAL.leaf, 2);
  return s;
});
def('reward-stone', 'rewards', 96, 96, 'Biểu tượng phần thưởng: đá (đống đá)', (doc) => {
  let s = pebble(doc, 30, 66, 22, 17, PAL.stone, 2, LS) + pebble(doc, 64, 68, 24, 18, PAL.stoneLight, 4, LS) + pebble(doc, 46, 42, 22, 17, mix(PAL.stone, PAL.lavender, 0.3), 6, LS);
  s += sparkle(74, 30, 6);
  return s;
});
def('reward-flower', 'rewards', 96, 96, 'Biểu tượng phần thưởng: hoa', (doc) => {
  let s = L('M48,52 Q46,72 48,90', PAL.leafDark, 4) + leaf(doc, 47, 82, 20, 8, -55, PAL.leaf, 2) + leaf(doc, 48, 76, 18, 7, 55, PAL.leaf, 2);
  s += flowerHead(doc, 48, 40, 40, PAL.pink, PAL.yellow, 5);
  return s;
});
def('reward-shell', 'rewards', 96, 96, 'Biểu tượng phần thưởng: vỏ sò', (doc) => {
  const c = '#ffc2b0';
  let s = P('M48,84 L20,46 Q20,16 48,14 Q76,16 76,46Z', doc.sphere(c, 1), lineOf('#f08a78'), LW);
  for (const x of [30, 39, 48, 57, 66]) s += L(`M48,80 Q${x + (x - 48) * 0.2},40 ${x},${20 + Math.abs(x - 48) * 0.3}`, darken(c, 0.15), 2.2);
  s += P('M38,82 L58,82 L56,90 L40,90Z', doc.vgrad(c), lineOf('#f08a78'), LS);
  s += gloss(34, 30, 7, 4, 0.55);
  return s;
});

// ═════════════════════════ phân loại & dọn biển ═════════════════════════
function bin(doc, c, mark) {
  const ln = lineOf(c);
  let s = shadow(80, 182, 64);
  s += P('M28,58 L132,58 L122,178 Q80,186 38,178Z', doc.linear([[0, lighten(c, 0.15)], [0.5, c], [1, darken(c, 0.15)]], 0, 0, 1, 0), ln, LW);
  for (const x of [50, 80, 110]) s += L(`M${x},72 L${x + (x - 80) * -0.06},164`, darken(c, 0.12), 4, 'opacity=".5"');
  s += R(18, 40, 124, 22, 10, doc.vgrad(darken(c, 0.05)), ln, LW);
  s += R(62, 26, 36, 16, 7, doc.vgrad(darken(c, 0.05)), ln, LS);
  s += E(80, 116, 32, 32, PAL.white, ln, LS) + mark;
  s += gloss(46, 48, 14, 3, 0.5, 0);
  return s;
}
def('bin-recycle', 'sort', 160, 190, 'Thùng rác tái chế (xanh dương)', (doc) => {
  const c = '#6aa8ec', ln = lineOf(c);
  let m = '';
  for (let i = 0; i < 3; i++) {
    const a = i * 120;
    m += `<g transform="rotate(${a} 80 116)"><path d="M66,104 Q80,92 94,104" fill="none" stroke="${c}" stroke-width="5.5" stroke-linecap="round"/><path d="M90,96 L99,107 L86,109Z" fill="${c}" stroke="${c}" stroke-width="2" stroke-linejoin="round"/></g>`;
  }
  return bin(doc, c, m);
}, { origin: [0.5, 0.95] });
def('bin-organic', 'sort', 160, 190, 'Thùng rác hữu cơ (xanh lá)', (doc) => {
  const c = '#7cc96a';
  return bin(doc, c, leaf(doc, 76, 136, 40, 17, 20, PAL.leaf, LS));
}, { origin: [0.5, 0.95] });
def('sort-boat', 'sort', 300, 190, 'Thuyền dọn biển có lưới (mép nước ở 80% chiều cao)', (doc) => {
  const c = '#f2665e', wl = 152;
  let s = '';
  // cột + lưới
  s += R(196, 26, 8, 110, 3, doc.vgrad(PAL.woodDark), lineOf(PAL.woodDark), LS);
  s += L('M200,30 Q248,34 262,80', PAL.woodDark, 5);
  s += P('M232,72 Q262,64 290,82 Q282,120 258,124 Q236,112 232,72Z', 'rgba(255,255,255,.35)', lineOf(PAL.stone), 3);
  for (let i = 0; i < 4; i++) s += L(`M${238 + i * 13},${70 + i * 2} Q${244 + i * 10},${100} ${248 + i * 6},${122}`, lineOf(PAL.stone), 1.8, 'opacity=".8"') + L(`M${234 + i},${80 + i * 11} Q262,${78 + i * 12} ${288 - i * 5},${84 + i * 10}`, lineOf(PAL.stone), 1.8, 'opacity=".8"');
  s += P('M20,104 L280,104 Q266,166 210,170 L90,170 Q34,166 20,104Z', doc.vgrad(PAL.white), lineOf(PAL.stone), LW);
  s += P('M28,124 L272,124 Q262,150 230,158 L70,158 Q38,150 28,124Z', doc.vgrad(c), lineOf(c), LS);
  s += R(14, 96, 272, 14, 7, doc.vgrad(PAL.woodLight), lineOf(PAL.wood), LS);
  for (const x of [80, 130]) s += E(x, 140, 9, 9, doc.linear([[0, PAL.skyLight], [1, PAL.sky]]), lineOf(PAL.stone), 3);
  s += R(60, 56, 90, 44, 10, doc.vgrad(PAL.yellowLight), lineOf(PAL.sandDark), LS) + R(70, 64, 30, 24, 5, PAL.skyLight, lineOf(PAL.stone), 2.4);
  s += P('M52,58 L158,58 L150,44 L60,44Z', doc.vgrad('#6aa8ec'), lineOf('#6aa8ec'), LS);
  // sóng nước ở mép nước
  s += P(`M0,${wl} Q20,${wl - 8} 40,${wl} T80,${wl} T120,${wl} T160,${wl} T200,${wl} T240,${wl} T280,${wl} T300,${wl - 4} L300,190 L0,190Z`, 'rgba(143,214,240,.75)', '#ffffff', 3);
  s += gloss(60, 112, 30, 3, 0.5, 0);
  return s;
}, { origin: [0.5, 0.8] });

const T = (id, usage, draw) => def(id, 'sort', 110, 110, usage, draw);
T('trash-bottle', 'Rác: chai nhựa (tái chế)', (doc) => {
  let s = shadow(55, 98, 30);
  s += P('M44,30 L66,30 L66,38 Q82,46 82,62 L82,90 Q82,98 74,98 L36,98 Q28,98 28,90 L28,62 Q28,46 44,38Z', 'rgba(180,225,245,.85)', '#5a9ccc', LW, 'transform="rotate(-18 55 64)"');
  s += R(43, 16, 24, 15, 4, doc.vgrad('#6aa8ec'), lineOf('#6aa8ec'), LS, 'transform="rotate(-18 55 64)"');
  s += R(30, 60, 50, 18, 3, doc.vgrad(PAL.mint), lineOf(PAL.mint), 2.4, 'transform="rotate(-18 55 64)"');
  s += gloss(42, 54, 4, 14, 0.7, -18);
  return s;
});
T('trash-can', 'Rác: lon nước (tái chế)', (doc) => {
  const c = '#f2665e';
  let s = shadow(55, 98, 30);
  s += `<g transform="rotate(14 55 60)">${P('M32,24 L78,24 L80,46 L72,58 L80,70 L78,94 L32,94 L30,70 L38,58 L30,46Z', doc.linear([[0, lighten(c, 0.3)], [0.4, c], [1, darken(c, 0.2)]], 0, 0, 1, 0), lineOf(c), LW)}${E(55, 24, 23, 6, doc.vgrad(PAL.stoneLight), lineOf(PAL.stone), LS)}${R(38, 66, 34, 10, 3, PAL.white, 'none', 0, 'opacity=".75"')}</g>`;
  return s;
});
T('trash-paper', 'Rác: giấy vo tròn (tái chế)', (doc) => {
  let s = shadow(55, 96, 32);
  s += P(blob(55, 58, 38, 34, 11, 0.16, 7), doc.sphere(PAL.white, 1.3), '#a9a0c2', LW);
  for (const d of ['M30,50 L48,60 L40,78', 'M58,30 L60,52 L80,58', 'M50,64 L70,72 L66,86', 'M40,40 L52,46']) s += L(d, '#c4bcd6', 2.6);
  return s;
});
T('trash-box', 'Rác: hộp giấy các-tông (tái chế)', (doc) => {
  const c = '#e0b07a';
  let s = shadow(55, 98, 36);
  s += P('M20,44 L90,44 L90,96 L20,96Z', doc.vgrad(c), lineOf(c), LW);
  s += P('M20,44 L8,28 L46,28 L55,44Z', doc.vgrad(lighten(c, 0.15)), lineOf(c), LS) + P('M90,44 L102,28 L64,28 L55,44Z', doc.vgrad(lighten(c, 0.1)), lineOf(c), LS);
  s += R(44, 44, 22, 52, 0, '#cf9a5f', 'none', 0, 'opacity=".55"');
  s += L('M30,70 l12,0 M30,78 l8,0', darken(c, 0.25), 2.6);
  return s;
});
T('trash-banana-peel', 'Rác: vỏ chuối (hữu cơ)', (doc) => {
  const c = PAL.yellow;
  let s = shadow(55, 96, 34);
  s += P('M55,48 Q30,52 18,86 Q30,82 40,70 Q46,86 46,96 Q56,84 56,68 Q64,84 76,92 Q76,74 66,62 Q84,70 94,78 Q90,56 60,46Z', doc.vgrad(c), lineOf('#e4ae3e'), LW);
  s += P('M50,50 Q50,30 58,20 Q66,24 64,48Z', doc.vgrad('#f2d46a'), lineOf('#e4ae3e'), LS);
  s += E(58, 20, 4, 3, '#7a5a3a', null);
  for (const [x, y] of [[34, 72], [70, 72], [52, 80]]) s += E(x, y, 3, 2, '#c9a25a', null, 0, 'opacity=".8"');
  return s;
});
T('trash-apple-core', 'Rác: lõi táo (hữu cơ)', (doc) => {
  let s = shadow(55, 100, 26);
  s += P('M34,22 Q56,30 76,22 Q74,38 64,44 Q60,58 64,74 Q76,82 76,96 Q56,90 34,96 Q34,82 46,74 Q50,58 46,44 Q36,38 34,22Z', doc.vgrad(PAL.yellowLight), lineOf(PAL.sand), LW);
  s += P('M34,22 Q56,30 76,22 Q66,14 56,14 Q44,14 34,22Z', doc.vgrad('#f2665e'), lineOf('#f2665e'), LS) + P('M34,96 Q56,90 76,96 Q66,104 56,104 Q44,104 34,96Z', doc.vgrad('#f2665e'), lineOf('#f2665e'), LS);
  s += E(52, 56, 3, 4.5, '#7a5a3a', null) + E(60, 62, 3, 4.5, '#7a5a3a', null);
  s += L('M56,14 Q54,6 60,2', PAL.woodDark, 4);
  return s;
});
T('trash-leaf', 'Rác: lá khô (hữu cơ)', (doc) => {
  const c = '#e0a35a';
  let s = shadow(55, 98, 30);
  s += `<g transform="rotate(-30 55 58)">${P('M55,98 C20,80 18,40 55,12 C92,40 90,80 55,98Z', doc.vgrad(c), lineOf(c), LW)}${L('M55,96 L55,18', darken(c, 0.25), 3)}${[30, 48, 66].map((y) => L(`M55,${y + 10} L38,${y} M55,${y + 10} L72,${y}`, darken(c, 0.2), 2.2)).join('')}</g>`;
  return s;
});
T('trash-eggshell', 'Rác: vỏ trứng (hữu cơ)', (doc) => {
  let s = shadow(55, 98, 34);
  s += P('M18,62 Q18,96 50,96 Q74,96 78,72 L68,66 L60,74 L52,62 L42,70 L34,60 L26,66Z', doc.sphere('#fbeedd', 1), lineOf(PAL.sand), LW);
  s += P('M62,52 Q60,20 82,18 Q102,22 100,50 L94,46 L88,54 L80,46 L72,54Z', doc.sphere('#fbeedd', 1), lineOf(PAL.sand), LW, 'transform="rotate(20 82 36)"');
  s += gloss(30, 74, 5, 8, 0.6, 20);
  return s;
});
T('trash-bag', 'Rác: túi ni-lông (rác biển)', (doc) => {
  let s = '';
  s += P('M26,40 Q20,92 34,98 Q55,104 76,98 Q92,92 84,40 Q72,46 55,44 Q38,46 26,40Z', 'rgba(232,240,252,.95)', '#8f86b0', LW);
  s += P('M28,42 Q26,14 40,14 Q46,16 44,42', 'none', '#8f86b0', LW) + P('M66,42 Q66,14 76,14 Q86,16 82,42', 'none', '#8f86b0', LW);
  for (const d of ['M40,58 Q46,74 40,88', 'M64,56 Q60,72 68,86']) s += L(d, '#c4bcd6', 2.4);
  return s;
});

const SEA = (id, usage, draw) => def(id, 'sort', 130, 130, usage, draw);
SEA('sea-crab', 'Sinh vật biển: cua đỏ', (doc) => {
  const c = '#f2735e', ln = lineOf(c);
  let s = shadow(65, 116, 46);
  for (const sgn of [-1, 1]) for (const k of [0, 1, 2]) s += L(`M${65 + sgn * 28},${86 + k * 6} q${sgn * 16},${2 + k * 4} ${sgn * 22},${14 + k * 4}`, ln, 5);
  for (const sgn of [-1, 1]) {
    s += L(`M${65 + sgn * 30},76 Q${65 + sgn * 46},62 ${65 + sgn * 46},48`, ln, 6);
    s += P(`M${65 + sgn * 34},48 Q${65 + sgn * 34},24 ${65 + sgn * 52},22 Q${65 + sgn * 62},30 ${65 + sgn * 56},40 L${65 + sgn * 48},34 L${65 + sgn * 50},48 Q${65 + sgn * 44},54 ${65 + sgn * 34},48Z`, doc.vgrad(c), ln, LS);
  }
  s += P(ell(65, 84, 40, 26), doc.sphere(c, 1.1), ln, LW);
  for (const sgn of [-1, 1]) { s += L(`M${65 + sgn * 12},64 L${65 + sgn * 14},50`, ln, 4); s += E(65 + sgn * 14, 46, 9, 9, PAL.white, ln, 2.6) + eye(doc, { x: 65 + sgn * 14, y: 47, rx: 4.6, ry: 5.6 }); }
  s += mouth({ x: 65, y: 86, s: 1.8, kind: 'smile', lw: 3 }) + blush(43, 86, 6, 4, 0.6) + blush(87, 86, 6, 4, 0.6);
  s += gloss(46, 72, 8, 4, 0.5);
  return s;
});
SEA('sea-jellyfish', 'Sinh vật biển: sứa hồng', (doc) => {
  const c = '#f7a8c8', ln = lineOf('#e57aa8');
  let s = '';
  for (const [x, w] of [[42, 6], [56, -6], [74, 6], [88, -6]]) s += L(`M${x},70 q${w},14 0,26 q${-w},12 0,26`, ln, 4.4) + L(`M${x},70 q${w},14 0,26 q${-w},12 0,26`, lighten(c, 0.3), 2);
  s += P('M18,72 Q16,16 65,14 Q114,16 112,72 Q102,80 92,72 Q82,80 72,72 Q62,80 52,72 Q42,80 32,72 Q24,80 18,72Z', doc.sphere(c, 1.1), ln, LW);
  s += gloss(42, 32, 12, 6, 0.6);
  s += eye(doc, { x: 50, y: 50, rx: 5, ry: 6.4 }) + eye(doc, { x: 80, y: 50, rx: 5, ry: 6.4 });
  s += mouth({ x: 65, y: 58, s: 1.6, kind: 'cat', lw: 3 }) + blush(38, 60, 6, 4, 0.7, PAL.rose) + blush(92, 60, 6, 4, 0.7, PAL.rose);
  return s;
});
SEA('sea-octopus', 'Sinh vật biển: bạch tuộc tím', (doc) => {
  const c = '#b39adb', ln = lineOf('#8a70c8');
  let s = shadow(65, 120, 46);
  for (const [x, dir] of [[30, -1], [46, -1], [62, 1], [78, -1], [94, 1]]) s += L(`M${x + 4},80 Q${x - 4},104 ${x + 6},112 Q${x + 14 * dir + 6},118 ${x + 10 * dir + 6},106`, ln, 13) + L(`M${x + 4},80 Q${x - 4},104 ${x + 6},112 Q${x + 14 * dir + 6},118 ${x + 10 * dir + 6},106`, c, 7);
  s += P('M22,78 Q14,16 65,12 Q116,16 108,78 Q65,94 22,78Z', doc.sphere(c, 1.1), ln, LW);
  s += gloss(44, 30, 11, 6, 0.55);
  for (const [x, y] of [[40, 26], [90, 30], [96, 50]]) s += E(x, y, 4, 3, lighten(c, 0.35), null);
  s += eye(doc, { x: 50, y: 56, rx: 6, ry: 7.6 }) + eye(doc, { x: 80, y: 56, rx: 6, ry: 7.6 });
  s += mouth({ x: 65, y: 66, s: 1.7, kind: 'smile', lw: 3 }) + blush(36, 68, 7, 4.4, 0.65) + blush(94, 68, 7, 4.4, 0.65);
  return s;
});

// ═════════════════════════ chăm bạn thú (Phase 3) ═════════════════════════
// Đồ chăm sóc 120×120 (kéo vào thú cưng) và biểu tượng nhu cầu 100×100 (trong bong bóng ý nghĩ).
const CARE = (id, usage, draw) => def(id, 'care', 120, 120, usage, draw);
const NEED = (id, usage, draw) => def(id, 'care', 100, 100, usage, draw);
const bowl = (doc, c, inner) => {
  const ln = lineOf(c);
  let s = shadow(60, 104, 46);
  s += P('M12,66 L108,66 Q104,98 82,102 L38,102 Q16,98 12,66Z', doc.vgrad(c), ln, LW);
  s += inner;
  s += P(ell(60, 66, 48, 12), doc.vgrad(lighten(c, 0.25)), ln, LS) + E(60, 67, 40, 8, darken(c, 0.25), null);
  s += R(30, 80, 60, 8, 4, '#ffffff', 'none', 0, 'opacity=".35"');
  return s;
};
CARE('care-food', 'Chăm thú: bát thức ăn (hạt)', (doc) => {
  const c = '#f2665e';
  let s = bowl(doc, c, '');
  const r = rng(7);
  for (let i = 0; i < 16; i++) {
    const x = 26 + r() * 68, y = 50 + r() * 16 - Math.abs(x - 60) * 0.12;
    s += E(x, y, 7, 5.4, doc.sphere('#c98c4f', 1), lineOf('#a5754f'), 2, `transform="rotate(${Math.round(r() * 60 - 30)} ${r2(x)} ${r2(y)})"`);
  }
  s += P('M40,36 a8,8 0 1 1 10,10 l-6,6 a8,8 0 1 1 -10,-10Z', PAL.white, lineOf(PAL.stone), 2.4, 'transform="rotate(-30 44 40)"');
  return s;
});
CARE('care-water', 'Chăm thú: bát nước', (doc) => {
  const c = '#6aa8ec';
  let s = bowl(doc, c, '');
  s += E(60, 64, 38, 7, doc.linear([[0, PAL.oceanLight], [1, PAL.ocean]]), null);
  s += E(48, 62, 12, 2.4, '#fff', null, 0, 'opacity=".7"');
  s += P('M60,14 Q74,34 74,42 Q74,54 60,54 Q46,54 46,42 Q46,34 60,14Z', doc.sphere(PAL.oceanLight, 1.1), lineOf(PAL.ocean), LS);
  s += gloss(54, 40, 3, 5, 0.7, 0);
  return s;
});
CARE('care-sponge', 'Chăm thú: bọt biển và xà phòng (tắm)', (doc) => {
  const c = PAL.yellow, ln = lineOf('#e4a63e');
  let s = shadow(56, 104, 40);
  s += P('M18,62 Q16,48 30,46 L86,40 Q100,40 100,54 L102,86 Q102,98 88,98 L32,100 Q20,100 20,88Z', doc.vgrad(c), ln, LW);
  s += P('M18,62 L100,56', 'none', ln, LS);
  for (const [x, y, r] of [[34, 74, 4], [52, 84, 3], [70, 72, 4.5], [86, 86, 3], [44, 64, 2.6], [80, 64, 2.6]]) s += E(x, y, r, r, '#e4b74a', null);
  for (const [x, y, r] of [[30, 34, 12], [52, 24, 15], [76, 30, 11], [94, 20, 8]]) {
    s += E(x, y, r, r, 'rgba(255,255,255,.85)', '#a9c9ec', 2.4) + E(x - r * 0.35, y - r * 0.35, r * 0.28, r * 0.2, '#fff', null);
  }
  return s;
});
CARE('care-ball', 'Chăm thú: quả bóng (chơi đùa)', (doc) => {
  let s = shadow(60, 106, 36);
  const clip = doc.clip(`<circle cx="60" cy="60" r="42"/>`);
  s += `<circle cx="60" cy="60" r="42" fill="${doc.sphere('#ff8f8f', 1)}"/>`;
  s += `<g clip-path="${clip}">${P('M10,40 Q60,58 110,40 L110,62 Q60,80 10,62Z', doc.vgrad(PAL.white), 'none', 0)}${P('M10,78 Q60,96 110,78 L110,110 L10,110Z', doc.vgrad('#6aa8ec'), 'none', 0)}</g>`;
  s += L('M18,46 Q60,62 102,46 M18,66 Q60,82 102,66', lineOf('#ff8f8f'), 2.4, 'opacity=".6"');
  s += `<circle cx="60" cy="60" r="42" fill="none" stroke="${lineOf('#f2665e')}" stroke-width="${LW}"/>`;
  s += P(starPath(60, 38, 10, 4.6), PAL.yellow, lineOf('#e4a63e'), 2);
  s += gloss(42, 36, 10, 6, 0.6);
  return s;
});
CARE('care-pillow', 'Chăm thú: gối và chăn nhỏ (đi ngủ)', (doc) => {
  const c = PAL.lavender, ln = lineOf(PAL.purple);
  let s = shadow(60, 104, 48);
  s += P('M14,56 Q12,34 34,36 Q60,28 86,36 Q108,34 106,56 Q110,76 92,80 Q60,86 28,80 Q10,76 14,56Z', doc.sphere(PAL.white, 0.9), lineOf(PAL.stone), LW);
  s += L('M34,46 Q60,40 86,46', '#dcd8e6', 2.4);
  s += P('M8,78 Q30,68 60,72 Q92,68 112,78 L108,100 Q60,108 12,100Z', doc.vgrad(c), ln, LW);
  for (const x of [30, 60, 90]) s += P(starPath(x, 88, 6, 2.6), PAL.yellowLight, 'none', 0);
  s += P('M78,14 a14,14 0 1 0 14,18 a11,11 0 1 1 -14,-18Z', doc.sphere(PAL.yellow, 1), lineOf('#e4a63e'), LS);
  return s;
});
CARE('care-brush', 'Chăm thú: lược chải lông', (doc) => {
  const c = '#7cc96a', ln = lineOf(PAL.leafDark);
  let s = shadow(60, 106, 42);
  s += `<g transform="rotate(-24 60 62)">`;
  s += R(52, 60, 16, 52, 8, doc.vgrad(PAL.woodLight), lineOf(PAL.wood), LW);
  for (let i = 0; i < 10; i++) s += L(`M${23 + i * 8.2},34 L${23 + i * 8.2},18`, '#8a7fa6', 3.4) + E(23 + i * 8.2, 17, 2.2, 2.2, PAL.pink, null);
  s += R(14, 30, 92, 34, 16, doc.vgrad(c), ln, LW);
  s += R(22, 34, 76, 6, 3, '#ffffff', 'none', 0, 'opacity=".35"');
  s += `</g>`;
  return s;
});
NEED('need-hungry', 'Nhu cầu: đói bụng (đĩa trống)', (doc) => {
  let s = E(50, 64, 42, 16, doc.vgrad(PAL.white), lineOf(PAL.stone), LW) + E(50, 62, 28, 9, PAL.cream, lineOf(PAL.stone), 2);
  for (const [x, y] of [[42, 62], [56, 60], [50, 66]]) s += E(x, y, 2.4, 2, '#c98c4f', null);
  s += L('M18,12 L18,40 M10,12 L10,28 Q10,36 18,36 Q26,36 26,28 L26,12', lineOf(PAL.stone), 4);
  s += L('M82,12 Q92,24 82,40 L82,12', lineOf(PAL.stone), 4) + L('M82,40 L82,50', lineOf(PAL.stone), 4);
  return s;
});
NEED('need-thirsty', 'Nhu cầu: khát nước (giọt nước)', (doc) => {
  let s = P('M50,8 Q78,46 78,62 Q78,90 50,90 Q22,90 22,62 Q22,46 50,8Z', doc.sphere(PAL.oceanLight, 1.2), lineOf(PAL.ocean), LW);
  s += gloss(38, 54, 5, 10, 0.75, 0);
  s += P('M84,20 Q90,30 90,34 Q90,40 84,40 Q78,40 78,34 Q78,30 84,20Z', PAL.oceanLight, lineOf(PAL.ocean), 2.4);
  return s;
});
NEED('need-dirty', 'Nhu cầu: bị lấm bẩn (vệt bùn)', (doc) => {
  const c = '#a5754f';
  let s = P(blob(50, 56, 38, 30, 12, 0.3, 5), doc.vgrad(c), lineOf(c), LW);
  for (const [x, y, r] of [[14, 22, 7], [86, 24, 6], [88, 86, 5], [20, 88, 4]]) s += E(x, y, r, r * 0.85, doc.vgrad(c), lineOf(c), 2.4);
  s += gloss(38, 44, 8, 4, 0.4);
  return s;
});
NEED('need-sleepy', 'Nhu cầu: buồn ngủ (trăng và Zzz)', (doc) => {
  let s = P('M44,14 a36,36 0 1 0 38,52 a28,28 0 1 1 -38,-52Z', doc.sphere(PAL.yellow, 1), lineOf('#e4a63e'), LW);
  s += L('M64,14 L80,14 L64,30 L80,30', PAL.purple, 4.4) + L('M80,40 L90,40 L80,50 L90,50', PAL.purple, 3.4);
  s += sparkle(20, 18, 6) ;
  return s;
});
NEED('need-play', 'Nhu cầu: muốn chơi (con diều)', (doc) => {
  const c = '#ff8f8f';
  let s = L('M50,64 Q40,78 52,84 Q64,90 54,98', PAL.ink, 2.6);
  for (const [x, y] of [[44, 76], [58, 88]]) s += P(`M${x},${y} l-7,-4 l0,8Z`, PAL.yellow, lineOf('#e4a63e'), 1.6);
  s += P('M50,4 L86,34 L50,66 L14,34Z', doc.vgrad(c), lineOf('#f2665e'), LW);
  s += P('M50,4 L50,66 M14,34 L86,34', 'none', lineOf('#f2665e'), 2.4);
  s += P('M50,4 L86,34 L50,34Z', 'rgba(255,255,255,.35)', 'none', 0);
  return s;
});
NEED('need-messy', 'Nhu cầu: lông rối (cuộn rối)', (doc) => {
  const c = '#e0b07a';
  let s = P(puffPath(50, 54, 38, 32, 9, 0.2, 4), doc.sphere(c, 1), lineOf(c), LW);
  s += L('M24,50 Q34,30 48,44 Q60,58 70,38 Q80,26 78,50 Q74,72 54,66 Q34,62 40,76 M30,64 Q42,52 52,58', darken(c, 0.28), 3.2);
  return s;
});
