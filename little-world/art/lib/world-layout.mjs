// ── Little World: địa lý bản đồ thế giới (toạ độ bản đồ 3840×2160, đơn vị = px ở scale 1) ──
// Một lục địa hình chữ C ôm lấy Vịnh Trung Tâm (có Đảo Nhà ở giữa); vịnh mở ra Đại Dương
// Phiêu Lưu ở phía đông. Đảo Động Vật là một đảo lớn tách riêng ở phía tây nam.

export const W = 3840, H = 2160;

/** Làm gồ ghề bờ biển: chia nhỏ cạnh và đẩy theo pháp tuyến bằng nhiễu mượt (có seed). */
export function roughen(pts, seg = 110, amp = 26, seed = 1) {
  let s = seed * 9301 + 49297;
  const R = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
  const out = [];
  const n = pts.length;
  const ph = [R() * 6, R() * 6, R() * 6];
  let acc = 0;
  for (let i = 0; i < n; i++) {
    const a = pts[i], b = pts[(i + 1) % n];
    const L = Math.hypot(b[0] - a[0], b[1] - a[1]), k = Math.max(1, Math.round(L / seg));
    const nx = -(b[1] - a[1]) / L, ny = (b[0] - a[0]) / L;
    for (let j = 0; j < k; j++) {
      const t = j / k;
      const off = j === 0 ? 0 : amp * (0.6 * Math.sin(acc * 0.011 + ph[0]) + 0.4 * Math.sin(acc * 0.027 + ph[1]) + 0.25 * (R() - 0.5));
      out.push([a[0] + (b[0] - a[0]) * t + nx * off, a[1] + (b[1] - a[1]) * t + ny * off]);
      acc += L / k;
    }
  }
  return out;
}

/** Bờ lục địa (chữ C quanh vịnh, mở về phía đông) — điểm khung, sau đó làm gồ ghề. */
const MAIN_CTRL = [
  [290, 330], [430, 195], [700, 165], [930, 120], [1150, 175], [1400, 120], [1650, 98], [1900, 125], [2150, 92], [2450, 118], [2750, 96], [3020, 150], [3250, 250],
  [3390, 430], [3410, 640], [3330, 860], [3150, 990],
  // bờ bắc kênh → vào vịnh
  [2960, 1035], [2790, 990], [2620, 890], [2360, 822], [2060, 795], [1760, 803], [1520, 864], [1385, 975], [1335, 1140],
  // bờ nam vịnh → ra kênh
  [1405, 1300], [1600, 1385], [1900, 1402], [2200, 1357], [2460, 1292], [2690, 1278], [2870, 1330], [2960, 1450],
  // bờ đông bán đảo phía nam → đi về tây
  [2900, 1640], [2700, 1800], [2560, 1960], [2320, 2010], [2100, 1990], [1900, 2060], [1640, 2040], [1450, 1990], [1225, 1880], [1120, 1660], [1130, 1420], [1095, 1195],
  // bờ tây lên bắc
  [905, 1065], [700, 1050], [520, 960], [380, 880], [250, 650],
];
export const MAINLAND = roughen(MAIN_CTRL, 120, 22, 3);

/** Đảo Động Vật (tây nam). */
export const ANIMAL_ISLE = roughen([
  [200, 1260], [420, 1160], [620, 1190], [790, 1165], [955, 1310], [1000, 1460], [990, 1640], [915, 1850], [760, 1930], [640, 2010], [470, 1975], [330, 2000], [190, 1840], [150, 1660], [110, 1480],
], 110, 20, 7);

/** Đảo nhỏ trang trí + đảo trong Đại Dương Phiêu Lưu. [cx, cy, rx, ry, seed, kind] */
export const ISLETS = [
  [3290, 1300, 125, 70, 11, 'palm'],     // đảo dừa
  [3540, 1700, 160, 90, 12, 'rock'],     // đảo đá có hang (landmark)
  [3130, 1930, 100, 54, 13, 'palm'],
  [3650, 1060, 80, 44, 14, 'palm'],
  [3640, 520, 90, 50, 19, 'palm'],
  [3700, 2050, 70, 34, 20, 'tiny'],
  [2500, 2110, 85, 34, 15, 'tiny'],
  [60, 1010, 60, 34, 16, 'tiny'],
  [1640, 1130, 70, 38, 17, 'tiny'],      // đảo nhỏ trong vịnh
  [2400, 1050, 62, 34, 18, 'tiny'],
];

/** Đảo Nhà của bé (giữa vịnh). */
export const HOME = { x: 1960, y: 1105, rx: 175, ry: 92 };

/** Sông: danh sách điểm (từ nguồn → cửa), độ rộng đầu/cuối. */
export const RIVERS = [
  { id: 'math', pts: [[1745, 335], [1690, 450], [1765, 565], [1715, 690], [1790, 830]], w0: 22, w1: 48 },
  { id: 'forest', pts: [[1150, 480], [1010, 560], [900, 690], [730, 800], [600, 910], [500, 1000]], w0: 18, w1: 46 },
  { id: 'creative', pts: [[3110, 250], [3060, 380], [3130, 520], [3020, 700], [2890, 860], [2880, 1040]], w0: 16, w1: 44 },
  { id: 'animal', pts: [[480, 1450], [560, 1560], [520, 1700], [610, 1840], [660, 2000]], w0: 22, w1: 46 },
];

/** Hồ trên núi (nguồn sông) [cx, cy, rx, ry, seed] */
export const LAKES = [
  [1745, 325, 74, 30, 21],
  [3110, 240, 54, 24, 22],
];

/** Đường đi (cát). */
export const PATHS = [
  // vòng quanh vịnh: Làng → tây → bắc → Thị Trấn
  { pts: [[1900, 1500], [1560, 1470], [1300, 1420], [1215, 1250], [1255, 1050], [1390, 880], [1600, 772], [1900, 742], [2200, 748], [2500, 805], [2735, 905], [2775, 985]] },
  // Thị Trấn Sáng Tạo
  { pts: [[2735, 905], [2900, 800], [3050, 700], [3160, 620]] },
  { pts: [[3050, 700], [2990, 560], [2930, 470]] },
  { pts: [[3160, 620], [3260, 500], [3250, 380]] },
  // Làng Kỹ Năng
  { pts: [[2735, 1285], [2700, 1400], [2450, 1520], [2150, 1530], [1900, 1500]] },
  { pts: [[1900, 1500], [1880, 1700], [1780, 1860], [1620, 1900]] },
  { pts: [[1880, 1700], [2100, 1800], [2280, 1870]] },
  { pts: [[1560, 1470], [1560, 1660]] },
  { pts: [[2450, 1520], [2470, 1700]] },
  { pts: [[2700, 1400], [2880, 1490], [2960, 1500]] },
  // sang Đảo Động Vật
  { pts: [[1300, 1420], [1210, 1540], [1150, 1560]] },
  { pts: [[985, 1560], [830, 1580], [720, 1640], [700, 1700]] },
  { pts: [[830, 1580], [680, 1520], [540, 1480]] },
  { pts: [[700, 1700], [560, 1820], [520, 1900]] },
  { pts: [[560, 1820], [400, 1760], [320, 1700]] },
  // Rừng Câu Đố
  { pts: [[1255, 1050], [1110, 910], [940, 820], [760, 790], [560, 820]] },
  { pts: [[940, 820], [860, 660], [800, 570]] },
  { pts: [[800, 570], [690, 470], [570, 420]] },
  { pts: [[1110, 910], [1190, 790], [1170, 700]] },
  { pts: [[860, 660], [1000, 500], [1100, 430]] },
  // Núi Toán Học
  { pts: [[1900, 742], [1905, 680], [1960, 610], [2010, 560]] },
  { pts: [[1600, 772], [1560, 640], [1590, 500]] },
  { pts: [[2200, 748], [2300, 700], [2380, 660]] },
  { pts: [[2010, 560], [2160, 470], [2300, 400]] },
];

/** Cầu lớn: [x1,y1,x2,y2,width] (cầu nhỏ qua sông được tính tự động ở chỗ đường cắt sông) */
export const BRIDGES = [
  [1955, 1192, 1935, 1400, 36],    // Đảo Nhà ↔ bờ nam
  [2775, 985, 2735, 1285, 42],     // qua cửa kênh: Thị Trấn ↔ Làng
  [1150, 1560, 985, 1560, 38],     // eo biển sang Đảo Động Vật
];

/** Mốc (landmark) — vị trí đế trên bản đồ (px) và kích thước sprite (đơn vị bản đồ). */
export const LANDMARKS = {
  'animal-island': [
    { key: 'waterfall', x: 470, y: 1470, w: 300, h: 260 },
    { key: 'big-tree', x: 300, y: 1700, w: 230, h: 270 },
    { key: 'animal-houses', x: 760, y: 1730, w: 300, h: 200 },
    { key: 'barn', x: 470, y: 1930, w: 220, h: 170 },
  ],
  'puzzle-forest': [
    { key: 'magic-tree', x: 800, y: 600, w: 260, h: 300 },
    { key: 'mushrooms', x: 520, y: 860, w: 230, h: 180 },
    { key: 'jigsaw-arch', x: 1110, y: 460, w: 220, h: 190 },
    { key: 'maze', x: 520, y: 470, w: 280, h: 190 },
    { key: 'rune-stones', x: 1180, y: 720, w: 210, h: 150 },
  ],
  'math-mountain': [
    { key: 'peak', x: 2040, y: 560, w: 520, h: 420 },
    { key: 'floating-blocks', x: 2390, y: 400, w: 260, h: 260 },
    { key: 'dice-tower', x: 1590, y: 500, w: 180, h: 250 },
    { key: 'fruit-garden', x: 2420, y: 700, w: 260, h: 150 },
  ],
  'creative-town': [
    { key: 'art-studio', x: 2930, y: 470, w: 240, h: 230 },
    { key: 'houses', x: 3170, y: 640, w: 320, h: 230 },
    { key: 'crane', x: 3250, y: 390, w: 250, h: 300 },
    { key: 'workshop', x: 2900, y: 700, w: 200, h: 170 },
  ],
  'life-skills-village': [
    { key: 'school', x: 1560, y: 1700, w: 280, h: 230 },
    { key: 'grocery', x: 2150, y: 1600, w: 230, h: 180 },
    { key: 'kitchen', x: 2480, y: 1740, w: 210, h: 190 },
    { key: 'playground', x: 1640, y: 1960, w: 250, h: 150 },
    { key: 'garden', x: 2280, y: 1920, w: 260, h: 140 },
  ],
  'adventure-ocean': [
    { key: 'submarine-dock', x: 3040, y: 1530, w: 260, h: 170 },
    { key: 'coral-reef', x: 3330, y: 1560, w: 300, h: 160 },
    { key: 'sea-cave', x: 3540, y: 1745, w: 300, h: 230 },
    { key: 'palm-hut', x: 3290, y: 1320, w: 200, h: 180 },
  ],
};

/** Vùng — polygon dùng cho hover/hit-test; tâm và chỗ đặt nhãn. */
export const REGIONS = [
  {
    id: 'animal-island', name: 'Đảo Động Vật', nameEn: 'Animal Island', color: '#6cc46a',
    polygon: [[190, 1215], [450, 1110], [790, 1135], [1000, 1300], [1060, 1590], [960, 1880], [670, 2040], [340, 2030], [130, 1850], [80, 1500]],
    center: [580, 1600], label: [600, 1270], entrancePos: [905, 1575],
  },
  {
    id: 'puzzle-forest', name: 'Rừng Câu Đố', nameEn: 'Puzzle Forest', color: '#9b85d9',
    polygon: [[255, 650], [300, 300], [470, 175], [800, 125], [1150, 150], [1420, 120], [1470, 480], [1400, 760], [1300, 950], [1260, 1180], [1095, 1190], [905, 1060], [610, 1005], [390, 885]],
    center: [820, 560], label: [820, 210], entrancePos: [1100, 900],
  },
  {
    id: 'math-mountain', name: 'Núi Toán Học', nameEn: 'Math Mountain', color: '#ff9d5c',
    polygon: [[1420, 120], [1500, 98], [1900, 84], [2300, 104], [2620, 90], [2640, 480], [2600, 860], [2360, 805], [2060, 775], [1760, 785], [1520, 848], [1400, 760], [1470, 480]],
    center: [2020, 440], label: [2040, 700], entrancePos: [1905, 680],
  },
  {
    id: 'creative-town', name: 'Thị Trấn Sáng Tạo', nameEn: 'Creative Town', color: '#f58aa8',
    polygon: [[2620, 90], [3100, 134], [3420, 250], [3610, 470], [3640, 720], [3500, 930], [3260, 1040], [3010, 1050], [2800, 995], [2600, 860], [2640, 480]],
    center: [3120, 600], label: [3130, 210], entrancePos: [2960, 800],
  },
  {
    id: 'life-skills-village', name: 'Làng Kỹ Năng', nameEn: 'Life Skills Village', color: '#f5c242',
    polygon: [[1330, 1140], [1400, 1300], [1600, 1385], [1900, 1400], [2200, 1355], [2460, 1290], [2690, 1275], [2900, 1330], [3010, 1440], [2930, 1640], [2680, 1850], [2320, 1995], [1900, 2050], [1500, 2015], [1225, 1880], [1115, 1660], [1125, 1420], [1095, 1190], [1260, 1180]],
    center: [2000, 1700], label: [1960, 1640], entrancePos: [1900, 1540],
  },
  {
    id: 'adventure-ocean', name: 'Đại Dương Phiêu Lưu', nameEn: 'Adventure Ocean', color: '#3d9ad6',
    polygon: [[3010, 1090], [3290, 1075], [3560, 960], [3800, 930], [3810, 2130], [2350, 2130], [2700, 1900], [2980, 1660], [3070, 1440], [2960, 1300]],
    center: [3380, 1620], label: [3420, 1900], entrancePos: [2985, 1470],
  },
];

export const regionById = Object.fromEntries(REGIONS.map((r) => [r.id, r]));

/** Điểm-trong-đa-giác */
export function inPoly([x, y], poly) {
  let c = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i], [xj, yj] = poly[j];
    if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) c = !c;
  }
  return c;
}
export function regionAt(p) { return REGIONS.find((r) => inPoly(p, r.polygon))?.id || null; }
