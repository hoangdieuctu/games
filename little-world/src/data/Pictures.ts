// ── Tranh tô màu (Bé tô màu) — vẽ bằng hình học trong khung 600×600 ──
// Mỗi tranh: các vùng tô được (đa giác, xếp từ dưới lên trên) + nét chi tiết không tô (mắt, viền trang trí).
// `c` = màu trong tranh mẫu (chế độ tô theo mẫu); `opt` = không bắt buộc tô (nền).

export interface Pt { x: number; y: number; }
export interface Region { id: string; name: string; pts: Pt[]; c: string; opt?: boolean; }
export type Detail =
  | { k: 'line'; pts: Pt[]; w?: number }
  | { k: 'dot'; x: number; y: number; r: number; fill?: number };
export interface Picture { id: string; name: string; diff: number; regions: Region[]; details: Detail[]; }

/** Bút màu: tên đọc to + mã màu. */
export const CRAYONS: { id: string; name: string; color: number }[] = [
  { id: 'red', name: 'đỏ', color: 0xf2665e },
  { id: 'orange', name: 'cam', color: 0xffac6b },
  { id: 'yellow', name: 'vàng', color: 0xffd96b },
  { id: 'green', name: 'xanh lá', color: 0x7cc96a },
  { id: 'mint', name: 'xanh bạc hà', color: 0xa6e3c4 },
  { id: 'sky', name: 'xanh da trời', color: 0x8fd6f0 },
  { id: 'blue', name: 'xanh dương', color: 0x6aa8ec },
  { id: 'purple', name: 'tím', color: 0xb39adb },
  { id: 'pink', name: 'hồng', color: 0xffb8cb },
  { id: 'brown', name: 'nâu', color: 0xc99f74 },
  { id: 'grey', name: 'xám', color: 0xbdb8ca },
];

// ───── hình học → đa giác ─────
const rad = (d: number) => (d * Math.PI) / 180;
export function ell(cx: number, cy: number, rx: number, ry: number, rot = 0, n = 40): Pt[] {
  const a = rad(rot), ca = Math.cos(a), sa = Math.sin(a);
  return Array.from({ length: n }, (_, i) => {
    const t = (i / n) * Math.PI * 2, x = Math.cos(t) * rx, y = Math.sin(t) * ry;
    return { x: cx + x * ca - y * sa, y: cy + x * sa + y * ca };
  });
}
const circ = (cx: number, cy: number, r: number) => ell(cx, cy, r, r);
const poly = (...xy: number[]): Pt[] => Array.from({ length: xy.length / 2 }, (_, i) => ({ x: xy[i * 2], y: xy[i * 2 + 1] }));
function rrect(x: number, y: number, w: number, h: number, r: number): Pt[] {
  const out: Pt[] = [];
  const corner = (cx: number, cy: number, a0: number) => { for (let i = 0; i <= 6; i++) { const t = rad(a0 + i * 15); out.push({ x: cx + Math.cos(t) * r, y: cy + Math.sin(t) * r }); } };
  corner(x + w - r, y + r, -90); corner(x + w - r, y + h - r, 0); corner(x + r, y + h - r, 90); corner(x + r, y + r, 180);
  return out;
}
/** Mây / bụi cây: đường viền gợn sóng. */
function puff(cx: number, cy: number, rx: number, ry: number, bumps = 7): Pt[] {
  return Array.from({ length: 70 }, (_, i) => {
    const t = (i / 70) * Math.PI * 2, k = 1 + 0.12 * Math.abs(Math.sin(t * bumps / 2));
    return { x: cx + Math.cos(t) * rx * k, y: cy + Math.sin(t) * ry * k };
  });
}
/** Đường sóng nằm ngang từ x0→x1 ở cao độ y, rồi đóng xuống đáy. */
function waveBand(y: number, amp: number, n: number, bottom = 600): Pt[] {
  const pts: Pt[] = [];
  for (let i = 0; i <= 48; i++) { const x = (i / 48) * 600; pts.push({ x, y: y + Math.sin((i / 48) * Math.PI * 2 * n) * amp }); }
  return [...pts, { x: 600, y: bottom }, { x: 0, y: bottom }];
}
const arc = (cx: number, cy: number, r: number, a0: number, a1: number, n = 12): Pt[] =>
  Array.from({ length: n + 1 }, (_, i) => { const t = rad(a0 + ((a1 - a0) * i) / n); return { x: cx + Math.cos(t) * r, y: cy + Math.sin(t) * r }; });
const face = (x: number, y: number, s = 1): Detail[] => [
  { k: 'dot', x: x - 16 * s, y: y - 6 * s, r: 6 * s }, { k: 'dot', x: x + 16 * s, y: y - 6 * s, r: 6 * s },
  { k: 'dot', x: x - 14 * s, y: y - 8 * s, r: 2 * s, fill: 0xffffff }, { k: 'dot', x: x + 18 * s, y: y - 8 * s, r: 2 * s, fill: 0xffffff },
  { k: 'line', pts: arc(x, y + 2 * s, 12 * s, 20, 160), w: 4 },
];
const bg = (c: string): Region => ({ id: 'bg', name: 'nền', pts: poly(0, 0, 600, 0, 600, 600, 0, 600), c, opt: true });

export const PICTURES: Picture[] = [
  {
    id: 'icecream', name: 'Cây kem', diff: 1,
    regions: [
      bg('sky'),
      { id: 'cone', name: 'ốc quế', pts: poly(215, 300, 385, 300, 300, 570), c: 'brown' },
      { id: 's1', name: 'viên kem trái', pts: circ(235, 285, 72), c: 'pink' },
      { id: 's2', name: 'viên kem phải', pts: circ(365, 285, 72), c: 'mint' },
      { id: 's3', name: 'viên kem trên', pts: circ(300, 195, 78), c: 'yellow' },
      { id: 'cherry', name: 'quả anh đào', pts: circ(300, 98, 28), c: 'red' },
    ],
    details: [
      { k: 'line', pts: poly(250, 380, 330, 340) }, { k: 'line', pts: poly(265, 440, 355, 365) }, { k: 'line', pts: poly(285, 500, 340, 455) },
      { k: 'line', pts: poly(350, 380, 270, 340) }, { k: 'line', pts: poly(335, 440, 245, 365) },
      { k: 'line', pts: [{ x: 300, y: 70 }, { x: 310, y: 45 }, { x: 330, y: 30 }], w: 5 },
      ...face(300, 200, 1.3),
    ],
  },
  {
    id: 'fish', name: 'Bạn cá', diff: 1,
    regions: [
      bg('sky'),
      { id: 'sand', name: 'cát', pts: waveBand(530, 10, 2), c: 'yellow' },
      { id: 'weed', name: 'rong biển', pts: poly(70, 540, 60, 470, 90, 420, 70, 360, 100, 310, 120, 360, 100, 420, 125, 470, 110, 540), c: 'green' },
      { id: 'tail', name: 'đuôi cá', pts: poly(165, 300, 60, 210, 85, 300, 60, 390), c: 'red' },
      { id: 'fin', name: 'vây', pts: poly(250, 210, 320, 140, 375, 150, 360, 215), c: 'red' },
      { id: 'body', name: 'thân cá', pts: ell(310, 300, 165, 105), c: 'orange' },
      { id: 'stripe', name: 'sọc', pts: ell(255, 300, 24, 92), c: 'yellow' },
      { id: 'b1', name: 'bong bóng', pts: circ(490, 180, 24), c: 'mint' },
      { id: 'b2', name: 'bong bóng', pts: circ(525, 115, 17), c: 'mint' },
      { id: 'b3', name: 'bong bóng', pts: circ(495, 65, 12), c: 'mint' },
    ],
    details: [
      { k: 'dot', x: 400, y: 280, r: 16 }, { k: 'dot', x: 405, y: 274, r: 5, fill: 0xffffff },
      { k: 'line', pts: arc(430, 320, 18, 20, 120), w: 4 },
      { k: 'line', pts: arc(330, 300, 40, -50, 50), w: 3 },
    ],
  },
  {
    id: 'house', name: 'Ngôi nhà', diff: 2,
    regions: [
      { id: 'sky', name: 'bầu trời', pts: poly(0, 0, 600, 0, 600, 430, 0, 430), c: 'sky', opt: true },
      { id: 'grass', name: 'bãi cỏ', pts: waveBand(420, 12, 1.5), c: 'green' },
      { id: 'sun', name: 'mặt trời', pts: circ(500, 95, 52), c: 'yellow' },
      { id: 'chimney', name: 'ống khói', pts: poly(370, 150, 420, 150, 420, 240, 370, 240), c: 'brown' },
      { id: 'roof', name: 'mái nhà', pts: poly(125, 275, 300, 135, 475, 275), c: 'red' },
      { id: 'wall', name: 'tường nhà', pts: poly(160, 270, 440, 270, 440, 490, 160, 490), c: 'yellow' },
      { id: 'door', name: 'cửa ra vào', pts: rrect(268, 370, 72, 120, 16), c: 'brown' },
      { id: 'w1', name: 'cửa sổ', pts: rrect(185, 305, 66, 62, 8), c: 'sky' },
      { id: 'w2', name: 'cửa sổ', pts: rrect(358, 305, 66, 62, 8), c: 'sky' },
      { id: 'path', name: 'lối đi', pts: poly(272, 490, 338, 490, 390, 600, 220, 600), c: 'grey' },
    ],
    details: [
      { k: 'line', pts: poly(218, 305, 218, 367) }, { k: 'line', pts: poly(185, 336, 251, 336) },
      { k: 'line', pts: poly(391, 305, 391, 367) }, { k: 'line', pts: poly(358, 336, 424, 336) },
      { k: 'dot', x: 325, y: 435, r: 6 },
      ...[0, 45, 90, 135, 180, 225, 270, 315].map((a): Detail => ({ k: 'line', pts: [{ x: 500 + Math.cos(rad(a)) * 66, y: 95 + Math.sin(rad(a)) * 66 }, { x: 500 + Math.cos(rad(a)) * 82, y: 95 + Math.sin(rad(a)) * 82 }], w: 5 })),
    ],
  },
  {
    id: 'boat', name: 'Thuyền buồm', diff: 2,
    regions: [
      { id: 'sky', name: 'bầu trời', pts: poly(0, 0, 600, 0, 600, 420, 0, 420), c: 'sky', opt: true },
      { id: 'sun', name: 'mặt trời', pts: circ(105, 105, 50), c: 'yellow' },
      { id: 'cloud', name: 'đám mây', pts: puff(440, 110, 95, 42), c: 'grey' },
      { id: 'sea', name: 'biển', pts: waveBand(440, 14, 3), c: 'blue' },
      { id: 'mast', name: 'cột buồm', pts: poly(292, 95, 308, 95, 308, 430, 292, 430), c: 'brown' },
      { id: 'flag', name: 'lá cờ', pts: poly(308, 95, 360, 115, 308, 135), c: 'red' },
      { id: 'sail1', name: 'cánh buồm lớn', pts: poly(314, 150, 314, 405, 465, 405), c: 'yellow' },
      { id: 'sail2', name: 'cánh buồm nhỏ', pts: poly(286, 190, 286, 405, 165, 405), c: 'pink' },
      { id: 'hull', name: 'thân thuyền', pts: poly(140, 420, 460, 420, 405, 505, 195, 505), c: 'red' },
    ],
    details: [
      { k: 'line', pts: arc(80, 560, 30, 200, 340) }, { k: 'line', pts: arc(500, 555, 30, 200, 340) }, { k: 'line', pts: arc(300, 575, 30, 200, 340) },
      { k: 'line', pts: poly(200, 230, 220, 245, 240, 230), w: 4 }, { k: 'line', pts: poly(500, 230, 515, 242, 530, 230), w: 4 },
      { k: 'dot', x: 250, y: 462, r: 12, fill: 0xffffff }, { k: 'dot', x: 350, y: 462, r: 12, fill: 0xffffff },
    ],
  },
  {
    id: 'flower', name: 'Bông hoa', diff: 3,
    regions: [
      bg('mint'),
      { id: 'stem', name: 'thân cây', pts: poly(290, 250, 310, 250, 310, 460, 290, 460), c: 'green' },
      { id: 'leafL', name: 'lá cây', pts: ell(235, 385, 62, 24, -30), c: 'green' },
      { id: 'leafR', name: 'lá cây', pts: ell(365, 345, 62, 24, 30), c: 'green' },
      ...[0, 60, 120, 180, 240, 300].map((a, i): Region => ({ id: 'p' + i, name: 'cánh hoa', pts: ell(300 + Math.cos(rad(a - 90)) * 78, 200 + Math.sin(rad(a - 90)) * 78, 58, 36, a - 90), c: i % 2 ? 'purple' : 'pink' })),
      { id: 'center', name: 'nhụy hoa', pts: circ(300, 200, 48), c: 'yellow' },
      { id: 'rim', name: 'miệng chậu', pts: rrect(200, 450, 200, 42, 12), c: 'red' },
      { id: 'pot', name: 'chậu hoa', pts: poly(220, 492, 380, 492, 358, 590, 242, 590), c: 'orange' },
    ],
    details: [...face(300, 205, 1)],
  },
  {
    id: 'butterfly', name: 'Con bướm', diff: 3,
    regions: [
      bg('sky'),
      { id: 'wTL', name: 'cánh trên', pts: ell(200, 225, 115, 88, -25), c: 'orange' },
      { id: 'wTR', name: 'cánh trên', pts: ell(400, 225, 115, 88, 25), c: 'orange' },
      { id: 'wBL', name: 'cánh dưới', pts: ell(225, 395, 82, 68, 25), c: 'yellow' },
      { id: 'wBR', name: 'cánh dưới', pts: ell(375, 395, 82, 68, -25), c: 'yellow' },
      { id: 'sTL', name: 'chấm trên cánh', pts: circ(180, 215, 34), c: 'purple' },
      { id: 'sTR', name: 'chấm trên cánh', pts: circ(420, 215, 34), c: 'purple' },
      { id: 'sBL', name: 'chấm trên cánh', pts: circ(220, 400, 24), c: 'pink' },
      { id: 'sBR', name: 'chấm trên cánh', pts: circ(380, 400, 24), c: 'pink' },
      { id: 'body', name: 'thân bướm', pts: ell(300, 320, 26, 140), c: 'brown' },
      { id: 'head', name: 'đầu bướm', pts: circ(300, 165, 40), c: 'brown' },
    ],
    details: [
      { k: 'line', pts: [{ x: 288, y: 130 }, { x: 270, y: 90 }, { x: 245, y: 70 }], w: 5 }, { k: 'dot', x: 243, y: 68, r: 9 },
      { k: 'line', pts: [{ x: 312, y: 130 }, { x: 330, y: 90 }, { x: 355, y: 70 }], w: 5 }, { k: 'dot', x: 357, y: 68, r: 9 },
      ...face(300, 168, 0.9),
      { k: 'line', pts: poly(282, 260, 318, 260) }, { k: 'line', pts: poly(280, 310, 320, 310) }, { k: 'line', pts: poly(282, 360, 318, 360) },
    ],
  },
];
export const crayon = (id: string) => CRAYONS.find((c) => c.id === id)!;
