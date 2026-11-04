// ── Little World · Đảo cá nhân: nền đảo 2560×1600, lưới tham chiếu, bố cục ban đầu ──
import { Doc } from './style.mjs';
import {
  PAL, LINE, ramp, lighten, darken, mix, alpha, rng, smoothPath, blob, puffPath, gloss, shape, stroke, circle, ellipse, rect, r2,
  sparkle, pebble, leafMark,
} from './island-kit.mjs';

export const ISLAND = { width: 2560, height: 1600, tile: 64 };
const CLIFF = 62; // chiều cao vách đất phía trước (2.5D)

// Viền cỏ (mặt cao nguyên) – theo chiều kim đồng hồ
export const GRASS = [
  [330, 330], [520, 214], [820, 176], [1120, 196], [1400, 166], [1700, 194], [2000, 234], [2230, 330],
  [2334, 520], [2322, 760], [2272, 980], [2150, 1150], [1960, 1214], [1800, 1236], [1620, 1252], [1400, 1270],
  [1150, 1282], [900, 1262], [650, 1212], [440, 1112], [300, 944], [240, 724], [262, 500],
];
// Bãi cát (rộng hơn ở phía trước & vịnh nhỏ bên phải-dưới có cầu cảng)
export const SAND = [
  [300, 290], [510, 168], [820, 128], [1120, 150], [1400, 120], [1710, 148], [2020, 190], [2280, 296],
  [2396, 510], [2392, 780], [2346, 1010], [2240, 1210], [2060, 1330], [1880, 1418], [1720, 1440], [1560, 1420],
  [1380, 1386], [1150, 1394], [890, 1376], [620, 1326], [390, 1220], [236, 1012], [176, 736], [200, 470],
];
// Lối đi (bậc thang gỗ) từ mặt cỏ xuống vịnh cầu cảng
const STAIRS = { x: 1712, top: 1222, bottom: 1318, w: 92 };
const DOCK_X = 1716;

// Đường đất vẽ sẵn: từ bến → quảng trường trước nhà và nhánh phụ
export const PATHS = [
  { w: 60, d: `M${STAIRS.x},${STAIRS.top + 14} C1712,1120 1560,1010 1470,930 S1310,800 1284,690` },   // bến → nhà
  { w: 46, d: 'M1420,880 C1260,860 1120,880 1000,900 S860,930 828,950' },                             // → vườn rau
  { w: 44, d: 'M1196,700 C1100,690 1010,660 930,620' },                                                 // → cây cổ thụ
  { w: 44, d: 'M1372,702 C1500,720 1640,740 1752,712' },                                                // → ao
];
const PLAZA = { cx: 1284, cy: 688, rx: 150, ry: 44 };

/** Đa giác đi lại được (mặt cỏ + bậc thang + vịnh cát + cầu cảng). */
export function walkArea() {
  const inset = (pts, k) => {
    const cx = 1290, cy = 740;
    return pts.map(([x, y]) => [Math.round(cx + (x - cx) * k), Math.round(cy + (y - cy) * k)]);
  };
  const g = inset(GRASS, 0.975);
  // chèn lối xuống bến giữa [1800,1236] và [1620,1252]
  const i = g.findIndex(([x, y]) => x < 1790 && y > 1200);
  const cove = [[STAIRS.x + 40, 1236], [STAIRS.x + 44, 1320], [1850, 1386], [DOCK_X + 30, 1406], [DOCK_X + 26, 1572], [DOCK_X - 26, 1572], [DOCK_X - 30, 1406], [1590, 1386], [STAIRS.x - 44, 1320], [STAIRS.x - 40, 1236]];
  return [...g.slice(0, i), ...cove, ...g.slice(i)];
}

export function pointInPoly([x, y], poly) {
  let c = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i], [xj, yj] = poly[j];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c;
  }
  return c;
}

// ───────────── Nền đảo ─────────────
export function baseSvg() {
  const { width: W, height: H } = ISLAND;
  const doc = new Doc(W, H, { prefix: 'isl' });
  const R = rng(2024);
  const G = smoothPath(GRASS, true), S = smoothPath(SAND, true);
  const Gc = smoothPath(GRASS.map(([x, y]) => [x, y + CLIFF]), true);
  const halo = smoothPath(SAND.map(([x, y]) => [1290 + (x - 1290) * 1.07, 760 + (y - 760) * 1.09]), true);
  const halo2 = smoothPath(SAND.map(([x, y]) => [1290 + (x - 1290) * 1.17, 760 + (y - 760) * 1.22]), true);
  let s = '';
  // biển
  s += `<rect width="${W}" height="${H}" fill="${doc.radial([[0, '#7fd3ee'], [0.55, PAL.ocean], [1, PAL.oceanDeep]], 0.5, 0.48, 0.75)}"/>`;
  s += `<path d="${halo2}" fill="${PAL.oceanLight}" opacity="0.35" filter="${doc.blur(30)}"/>`;
  s += `<path d="${halo}" fill="#a9ecef" opacity="0.75" filter="${doc.blur(14)}"/>`;
  // sóng lấp lánh trên biển
  for (let i = 0; i < 240; i++) {
    const x = R() * W, y = R() * H;
    if (pointInPoly([x, y], SAND.map(([a, b]) => [1290 + (a - 1290) * 1.1, 760 + (b - 760) * 1.12]))) continue;
    const w = 10 + R() * 22, op = 0.25 + R() * 0.45;
    s += stroke(`M${r2(x - w)},${r2(y)} Q${r2(x - w / 2)},${r2(y - 5)} ${r2(x)},${r2(y)} Q${r2(x + w / 2)},${r2(y - 5)} ${r2(x + w)},${r2(y)}`, '#ffffff', 2.6, `opacity="${r2(op)}"`);
  }
  for (let i = 0; i < 46; i++) {
    const x = R() * W, y = R() * H;
    if (pointInPoly([x, y], SAND.map(([a, b]) => [1290 + (a - 1290) * 1.08, 760 + (b - 760) * 1.1]))) continue;
    s += sparkle(x, y, 4 + R() * 6, '#ffffff', 0.55 + R() * 0.35);
  }
  // vệt bọt sóng quanh bờ
  s += `<path d="${halo}" fill="none" stroke="#ffffff" stroke-width="16" opacity="0.35" filter="${doc.blur(6)}"/>`;
  for (let i = 0; i < SAND.length; i++) {
    const [x0, y0] = SAND[i], [x1, y1] = SAND[(i + 1) % SAND.length];
    for (let k = 0; k < 3; k++) {
      const t = (k + 0.3 + R() * 0.4) / 3;
      const x = 1290 + (x0 + (x1 - x0) * t - 1290) * 1.045, y = 760 + (y0 + (y1 - y0) * t - 760) * 1.055;
      const w = 16 + R() * 20;
      s += stroke(`M${r2(x - w)},${r2(y)} Q${r2(x)},${r2(y - 7)} ${r2(x + w)},${r2(y)}`, '#ffffff', 3.4, `opacity="${r2(0.5 + R() * 0.3)}"`);
    }
  }
  // bãi cát
  s += `<path d="${S}" fill="${doc.linear([[0, '#fbe9bf'], [1, PAL.sand]])}" stroke="#ffffff" stroke-width="10" stroke-linejoin="round" opacity="1"/>`;
  s += `<path d="${S}" fill="none" stroke="${PAL.foam}" stroke-width="4" stroke-dasharray="70 30" stroke-linejoin="round" transform="translate(0,9)" opacity="0.8"/>`;
  const sclip = doc.clip(`<path d="${S}"/>`);
  let sand = `<path d="${S}" fill="none" stroke="${PAL.sandDark}" stroke-width="34" opacity="0.55"/>`;
  for (let i = 0; i < 520; i++) {
    const x = 180 + R() * 2220, y = 120 + R() * 1340;
    sand += circle(x, y, 1 + R() * 1.6, R() < 0.5 ? PAL.sandDark : '#fff8e6', null, 0, `opacity="${r2(0.5 + R() * 0.4)}"`);
  }
  s += `<g clip-path="${sclip}">${sand}</g>`;
  // vách đất phía trước (2.5D)
  const cl = '#c99f74';
  s += `<path d="${Gc}" fill="${PAL.shadow}" transform="translate(10,12)" filter="${doc.blur(8)}"/>`;
  s += shape(Gc, doc.linear([[0, '#d8b086'], [0.5, cl], [1, '#a87c5b']], 0, 0, 0, 1), '#8a6550', LINE.xl);
  const cclip = doc.clip(`<path d="${Gc}"/>`);
  let cliff = '';
  for (let k = 1; k <= 2; k++) cliff += `<path d="${G}" fill="none" stroke="#a87c5b" stroke-width="3" opacity="0.6" transform="translate(${k * 3},${CLIFF * k / 3 + 4})"/>`;
  for (let i = 0; i < 70; i++) {
    const x = 240 + R() * 2100, y = 900 + R() * 450;
    cliff += `<ellipse cx="${r2(x)}" cy="${r2(y)}" rx="${r2(7 + R() * 9)}" ry="${r2(4 + R() * 4)}" fill="#e2c09a" stroke="#a87c5b" stroke-width="1.5" opacity="0.85"/>`;
  }
  cliff += `<path d="M1300,0 L2600,0 L2600,1600 L1700,1600Z" fill="${PAL.purple}" opacity="0.1"/>`;
  s += `<g clip-path="${cclip}">${cliff}</g>`;
  // mặt cỏ
  s += `<path d="${G}" fill="${doc.linear([[0, '#b3e38a'], [0.5, PAL.grass], [1, '#93cf73']], 0.2, 0, 0.8, 1)}"/>`;
  const gclip = doc.clip(`<path d="${G}"/>`);
  let gr = '';
  // mảng sáng/tối (biến đổi màu cỏ)
  for (let i = 0; i < 34; i++) {
    const x = 300 + R() * 2000, y = 220 + R() * 1020;
    const light = R() < 0.55;
    gr += `<path d="${blob(x, y, 90 + R() * 160, 50 + R() * 80, 9, 0.2, i + 7)}" fill="${light ? PAL.grassLight : PAL.grassDark}" opacity="${light ? 0.35 : 0.16}" filter="${doc.blur(18)}"/>`;
  }
  // bóng mềm dọc mép cỏ phía trước-phải, sáng ở trên-trái
  gr += `<path d="${G}" fill="none" stroke="${PAL.grassDark}" stroke-width="60" opacity="0.28" transform="translate(-14,-20)" filter="${doc.blur(14)}"/>`;
  gr += `<path d="${G}" fill="none" stroke="${PAL.grassLight}" stroke-width="40" opacity="0.5" transform="translate(16,22)" filter="${doc.blur(10)}"/>`;
  // nét cỏ nhỏ
  for (let i = 0; i < 650; i++) {
    const x = 260 + R() * 2080, y = 180 + R() * 1100;
    const c = R() < 0.7 ? PAL.grassDark : '#c9ef9f';
    const h = 5 + R() * 5;
    gr += stroke(`M${r2(x - 3)},${r2(y)} l${r2(-1)},${r2(-h)} M${r2(x)},${r2(y)} l0,${r2(-h - 2)} M${r2(x + 3)},${r2(y)} l1,${r2(-h)}`, c, 1.8, `opacity="${r2(0.35 + R() * 0.35)}"`);
  }
  // hoa li ti
  for (let i = 0; i < 110; i++) {
    const x = 280 + R() * 2040, y = 200 + R() * 1060;
    const c = R.pick([PAL.white, PAL.yellowLight, PAL.pinkLight, PAL.lavenderLight]);
    gr += circle(x, y, 2.4, c, null, 0, 'opacity="0.9"') + circle(x + 4, y + 1, 2, c, null, 0, 'opacity="0.8"');
  }
  // quảng trường trước nhà + đường
  gr += `<ellipse cx="${PLAZA.cx + 6}" cy="${PLAZA.cy + 8}" rx="${PLAZA.rx + 8}" ry="${PLAZA.ry + 8}" fill="${alpha(PAL.earthDark, 0.25)}"/>`;
  for (const p of PATHS) gr += pathStroke(p.d, p.w, alpha(PAL.earthDark, 0.28), 6);
  for (const p of PATHS) gr += pathStroke(p.d, p.w, '#d9b98a', 0);
  gr += ellipse(PLAZA.cx, PLAZA.cy, PLAZA.rx, PLAZA.ry, '#d9b98a', null);
  for (const p of PATHS) gr += pathStroke(p.d, p.w, '#ecd3a4', -9);
  gr += ellipse(PLAZA.cx, PLAZA.cy, PLAZA.rx - 6, PLAZA.ry - 5, '#ecd3a4', null);
  for (const p of PATHS) gr += pathStroke(p.d, p.w * 0.4, '#f5e3bd', -p.w * 0.6, 'opacity="0.6"');
  // đá lát quảng trường
  const PR = rng(55);
  for (let i = 0; i < 26; i++) {
    const a = PR() * Math.PI * 2, rr = Math.sqrt(PR()) * 0.86;
    const x = PLAZA.cx + Math.cos(a) * PLAZA.rx * rr, y = PLAZA.cy + Math.sin(a) * PLAZA.ry * rr;
    gr += ellipse(x, y, 9 + PR() * 6, 5 + PR() * 3, '#f6e7c8', '#d0ad80', 1.4);
  }
  s += `<g clip-path="${gclip}">${gr}</g>`;
  // viền cỏ + mép cỏ rủ xuống vách
  s += `<path d="${G}" fill="none" stroke="${PAL.grassDeep}" stroke-width="${LINE.xl}" stroke-linejoin="round"/>`;
  s += `<path d="${G}" fill="none" stroke="#c9ef9f" stroke-width="2.5" stroke-linejoin="round" transform="translate(0,4)" opacity="0.7"/>`;
  // mép lá rủ (scallop) chỉ ở cạnh dưới
  for (let i = 0; i < GRASS.length; i++) {
    const [x0, y0] = GRASS[i], [x1, y1] = GRASS[(i + 1) % GRASS.length];
    if (x1 >= x0 || (y0 + y1) / 2 < 700) continue; // chỉ cạnh phía trước (đi từ phải sang trái)
    const n = Math.round(Math.hypot(x1 - x0, y1 - y0) / 34);
    for (let k = 0; k < n; k++) {
      const t = (k + 0.5) / n, x = x0 + (x1 - x0) * t, y = y0 + (y1 - y0) * t;
      if (PR() < 0.45) s += `<path d="M${r2(x - 12)},${r2(y)} Q${r2(x)},${r2(y + 16 + PR() * 8)} ${r2(x + 12)},${r2(y)}Z" fill="${PAL.grass}" stroke="${PAL.grassDeep}" stroke-width="3" stroke-linejoin="round"/>`;
    }
  }
  // bậc thang gỗ xuống bến
  s += stairsSvg(doc);
  // vài viên đá trên bãi cát
  for (const [x, y, rx, ry, sd] of [[520, 1290, 16, 9, 3], [1040, 1366, 12, 7, 4], [2210, 1236, 18, 10, 5], [2330, 860, 14, 8, 6], [420, 230, 14, 8, 8]]) s += pebble(doc, x, y, rx, ry, PAL.stone, sd);
  return doc.toString(s);
}

function pathStroke(d, w, color, extra = 0, attrs = '') {
  return `<path d="${d}" fill="none" stroke="${color}" stroke-width="${w + extra}" stroke-linecap="round" stroke-linejoin="round" ${attrs}/>`;
}

function stairsSvg(doc) {
  const { x, top, bottom, w } = STAIRS;
  let s = `<path d="M${x - w / 2 - 6},${top} L${x + w / 2 + 6},${top} L${x + w / 2 + 14},${bottom + 8} L${x - w / 2 - 14},${bottom + 8}Z" fill="${alpha(PAL.earthDark, 0.5)}"/>`;
  const n = 6;
  for (let k = 0; k < n; k++) {
    const t = k / n, y = top + (bottom - top) * t, ww = w + t * 18;
    s += rect(x - ww / 2, y, ww, (bottom - top) / n + 2, 4, doc.vgrad(k % 2 ? PAL.wood : PAL.woodLight), ramp(PAL.wood).line, LINE.sm);
  }
  for (const sx of [-1, 1]) s += rect(x + sx * (w / 2 + 6) - 6, top - 14, 12, bottom - top + 18, 5, doc.vgrad(PAL.woodDark), ramp(PAL.woodDark).line, LINE.sm, `transform="rotate(${-sx * 4} ${x + sx * (w / 2 + 6)} ${top})"`);
  return s;
}

// ───────────── Lưới tham chiếu ─────────────
export function gridSvg(buildCells, walk) {
  const { width: W, height: H, tile } = ISLAND;
  const doc = new Doc(W, H, { prefix: 'grd' });
  const wp = 'M' + walk.map(([x, y]) => `${x},${y}`).join(' L') + 'Z';
  const cl = doc.clip(`<path d="${wp}"/>`);
  let lines = '';
  for (let x = tile; x < W; x += tile) lines += `<line x1="${x}" y1="0" x2="${x}" y2="${H}"/>`;
  for (let y = tile; y < H; y += tile) lines += `<line x1="0" y1="${y}" x2="${W}" y2="${y}"/>`;
  let s = `<g clip-path="${cl}">`;
  for (const [c, r] of buildCells) s += `<rect x="${c * tile + 3}" y="${r * tile + 3}" width="${tile - 6}" height="${tile - 6}" rx="9" fill="#fff6c9" fill-opacity="0.38" stroke="#fff3a8" stroke-opacity="0.9" stroke-width="2"/>`;
  s += `<g stroke="#ffffff" stroke-opacity="0.55" stroke-width="2" stroke-dasharray="2 8" stroke-linecap="round">${lines}</g>`;
  for (let x = 0; x <= W; x += tile) for (let y = 0; y <= H; y += tile) if (pointInPoly([x, y], walk)) s += `<circle cx="${x}" cy="${y}" r="2.6" fill="#ffffff" fill-opacity="0.7"/>`;
  s += `</g>`;
  s += `<path d="${wp}" fill="none" stroke="#ffffff" stroke-opacity="0.6" stroke-width="3" stroke-dasharray="10 10"/>`;
  return doc.toString(s);
}

// ───────────── Bố cục ban đầu ─────────────
// x,y = điểm đế (trùng origin của sprite). Sắp xếp chiều sâu theo y (lớp 'ground' luôn ở dưới).
export const OBJECTS = [
  // trung tâm: nhà chính
  ['island-building-house-main', 1284, 652],
  ['island-tree-great-tree', 790, 590],
  ['island-terrain-pond', 1930, 660],
  // vườn rau + hàng rào
  ['island-terrain-plot-sprout', 520, 986], ['island-terrain-plot-growing', 662, 986], ['island-terrain-plot-empty', 520, 1086],
  ['island-deco-fence-h', 436, 1150], ['island-deco-fence-h', 500, 1150], ['island-deco-fence-h', 564, 1150], ['island-deco-fence-gate', 628, 1150], ['island-deco-fence-h', 692, 1150], ['island-deco-fence-post', 756, 1150],
  ['island-deco-fence-v', 436, 1150], ['island-deco-fence-v', 436, 1086], ['island-deco-fence-post', 436, 1022],
  ['island-deco-sign-board', 812, 1012],
  // khu thú cưng (bên phải nhà)
  ['island-building-pet-house', 1600, 700], ['island-deco-pet-bed', 1516, 760],
  // đồ quanh nhà
  ['island-deco-mailbox', 1150, 708], ['island-deco-lamp-street', 1404, 712], ['island-deco-lamp-mushroom', 1460, 958], ['island-deco-lamp-mushroom', 1640, 1170],
  ['island-deco-bench-wood', 960, 720], ['island-deco-flower-pot-1', 1234, 682], ['island-deco-flower-pot-2', 1336, 682],
  ['island-deco-birdhouse', 664, 716],
  // cây
  ['island-tree-pine-1', 420, 470], ['island-tree-pine-2', 520, 380], ['island-tree-pine-2', 348, 640],
  ['island-tree-blossom', 1586, 446], ['island-tree-oak-1', 2200, 470], ['island-tree-apple', 2150, 860], ['island-tree-oak-2', 1040, 400],
  ['island-tree-palm', 2110, 1290], ['island-tree-palm', 300, 1140],
  // bụi
  ['island-plant-bush-1', 1090, 610], ['island-plant-bush-3', 1488, 612], ['island-plant-bush-2', 2280, 640], ['island-plant-bush-1', 1840, 1170],
  ['island-plant-bush-3', 1600, 1236], ['island-plant-flower-white', 1800, 1232], ['island-plant-flower-pink', 1640, 1252],
  // hoa
  ['island-plant-flower-pink', 1186, 760], ['island-plant-flower-yellow', 1390, 770], ['island-plant-flower-lavender', 1560, 1080], ['island-plant-flower-white', 1004, 958],
  ['island-plant-flower-tulip', 850, 860], ['island-plant-flower-blue', 1700, 810], ['island-plant-flower-pink', 2070, 760], ['island-plant-flower-yellow', 330, 1000],
  ['island-terrain-meadow', 800, 1136],
  // đá
  ['island-terrain-rock-3', 2010, 1172], ['island-terrain-rock-mossy', 300, 884], ['island-terrain-rock-2', 1780, 520], ['island-terrain-rock-1', 1260, 1020],
  ['island-terrain-rock-1', 2120, 640],
  // cỏ, nấm
  ['island-plant-grass-1', 1120, 840], ['island-plant-grass-2', 1600, 900], ['island-plant-grass-3', 760, 760], ['island-plant-grass-1', 1764, 1004],
  ['island-plant-grass-2', 880, 1180], ['island-plant-grass-3', 1360, 1180], ['island-plant-grass-1', 1560, 280], ['island-plant-grass-2', 2240, 1060],
  ['island-plant-mushroom-red', 640, 600], ['island-plant-mushroom-glow', 980, 560],
  // bến & bãi biển
  ['env-pier-segment', DOCK_X, 1480], ['env-pier-end', DOCK_X, 1596],
  ['env-starfish', 1540, 1400], ['env-shells-cluster', 1950, 1370], ['env-shell-pink', 760, 1350], ['env-sea-rock', 250, 1440], ['env-sea-rock', 2420, 300],
];

export const BUILD_ZONES = [
  // [col0, row0, col1, row1] (bao gồm) – ô trống dành cho xây dựng sau
  [26, 4, 31, 6],   // khu A: phía trên bên phải (sau ao)
  [15, 16, 19, 18], // khu B: bãi cỏ phía trước, giữa
  [28, 13, 32, 16], // khu C: bên phải, dưới ao
  [5, 10, 8, 12],   // khu D: bãi cỏ bên trái, dưới rừng thông
];

export const PLACEABLE = [
  'island-tree-oak-1', 'island-tree-oak-2', 'island-tree-pine-1', 'island-tree-apple', 'island-tree-blossom', 'island-tree-palm', 'island-tree-magic',
  'island-plant-bush-1', 'island-plant-bush-2', 'island-plant-bush-3', 'island-plant-flower-pink', 'island-plant-flower-yellow', 'island-plant-flower-lavender', 'island-plant-flower-tulip', 'island-plant-flower-blue',
  'island-plant-mushroom-glow', 'island-plant-hedge-small', 'island-terrain-rock-2', 'island-terrain-plot-empty',
  'island-deco-bench-wood', 'island-deco-lamp-street', 'island-deco-lamp-mushroom', 'island-deco-fence-h', 'island-deco-flower-pot-1',
  'island-deco-statue-bunny', 'island-deco-fountain', 'island-deco-birdhouse', 'island-deco-swing', 'island-deco-picnic-blanket', 'island-deco-windmill',
];
