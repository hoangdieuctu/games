// ── Little World: vẽ ảnh nền bản đồ thế giới (địa hình + chi tiết nhỏ nướng sẵn) ──
import { Doc } from './style.mjs';
import {
  PAL, ramp, lighten, darken, mix, alpha, rng, smoothPath, blob, blobPoints, shape, stroke, circle, ellipse, rect, r2, g,
  painter, tree, pine, palm, bush, rock, flower, mushroom, house, fence, mountain, sparkle, wave, bridge, groundShadow, gloss, puffPath,
} from './world-kit.mjs';
import { W, H, MAINLAND, ANIMAL_ISLE, ISLETS, HOME, RIVERS, LAKES, PATHS, BRIDGES, REGIONS, LANDMARKS, inPoly } from './world-layout.mjs';
import { details } from './world-map-detail.mjs';
import { sampleSpline, ribbon, polyD, lineD, scatter, distToPolyline } from './world-geo.mjs';

// Đa giác bờ đã làm mượt (khớp với smoothPath) để kiểm tra điểm trên đất liền.
export const MAIN_S = sampleSpline(MAINLAND, 14, true);
export const ANIMAL_S = sampleSpline(ANIMAL_ISLE, 14, true);
export const isletPts = ISLETS.map(([cx, cy, rx, ry, seed]) => blobPoints(cx, cy, rx, ry, 9, 0.13, seed));
export const HOME_PTS = blobPoints(HOME.x, HOME.y, HOME.rx, HOME.ry, 10, 0.08, 31);

export const onLand = (p) => inPoly(p, MAIN_S) || inPoly(p, ANIMAL_S);
const RIV_S = RIVERS.map((r) => sampleSpline(r.pts, 12));
const PATH_S = PATHS.map((p) => sampleSpline(p.pts, 12));
export function nearWater(p, d) { return RIV_S.some((s) => distToPolyline(p, s) < d); }
export function nearPath(p, d) { return PATH_S.some((s) => distToPolyline(p, s) < d); }
export function coastDist(p) { return Math.min(distToPolyline(p, [...MAIN_S, MAIN_S[0]]), distToPolyline(p, [...ANIMAL_S, ANIMAL_S[0]])); }

/** Các vùng "để trống" cho sprite mốc (landmark) — không rải cây vào đây. */
export let RESERVED = [];
export function setReserved(list) { RESERVED = list; }
const inReserved = (p) => RESERVED.some(([x, y, rx, ry]) => ((p[0] - x) / rx) ** 2 + ((p[1] - y) / ry) ** 2 < 1);

export function renderBase(opts = {}) {
  const doc = new Doc(W, H, { prefix: 'wm' });
  const P = painter(doc);
  const out = [];
  const push = (s) => out.push(s);

  // ───── Biển ─────
  push(`<rect width="${W}" height="${H}" fill="${doc.linear([[0, '#79c9ec'], [0.5, PAL.ocean], [1, '#4a9fd6']], 0, 0, 0.6, 1)}"/>`);
  // vùng biển sâu (mảng tối mềm) & ánh sáng
  for (const [x, y, rx, ry, c, a] of [
    [3500, 1700, 700, 520, PAL.oceanDeep, 0.55], [600, 2150, 700, 300, PAL.oceanDeep, 0.35], [3700, 300, 360, 600, PAL.oceanDeep, 0.3],
    [2300, 2200, 600, 200, PAL.oceanDeep, 0.4], [3650, 2050, 500, 300, PAL.oceanAbyss, 0.45],
    [100, 300, 300, 500, '#a9e4f6', 0.4], [1950, 1100, 650, 300, '#9be0f4', 0.55],
  ]) push(ellipse(x, y, rx, ry, P.soft(c, a), null));
  // gợn sóng nền rất nhạt (hoạ tiết)
  {
    const R = rng(77);
    for (let i = 0; i < 520; i++) {
      const p = [R.range(20, W - 20), R.range(20, H - 20)];
      if (onLand(p) || coastDist(p) < 90) continue;
      push(wave(p[0], p[1], R.range(18, 34), '#ffffff', 2.6, R.range(0.25, 0.5)));
    }
  }

  // ───── Đất liền ─────
  const lands = [
    { d: smoothPath(MAINLAND), pts: MAIN_S, cliff: 26 },
    { d: smoothPath(ANIMAL_ISLE), pts: ANIMAL_S, cliff: 26 },
    ...isletPts.map((pts, i) => ({ d: smoothPath(pts), pts, cliff: 14, islet: ISLETS[i] })),
    { d: smoothPath(HOME_PTS), pts: HOME_PTS, cliff: 16, home: true },
  ];
  // nước nông quanh bờ → bọt sóng → vách đất (2.5D) → bãi cát → cỏ
  const SANDLINE = '#d6a86e';
  const bw = (L) => (L.islet ? 16 : L.home ? 18 : 26);
  const sw = (L, w) => `stroke-width="${r2(w)}" stroke-linejoin="round"`;
  for (const L of lands) push(`<path d="${L.d}" fill="none" ${sw(L, 2 * (bw(L) + (L.islet ? 60 : 92)))} stroke="#a3e6f3" opacity="0.42"/>`);
  for (const L of lands) push(`<path d="${L.d}" fill="none" ${sw(L, 2 * (bw(L) + (L.islet ? 28 : 40)))} stroke="#c3f1f6" opacity="0.6"/>`);
  for (const L of lands) push(`<path d="${L.d}" fill="none" ${sw(L, 2 * (bw(L) + 11))} stroke="${PAL.foam}" opacity="0.9"/>`);
  const solid = lands.filter((L) => !L.home);
  for (const L of solid) {
    const cliff = darken(PAL.sandDark, 0.12);
    push(`<path d="${L.d}" transform="translate(0,${L.cliff})" fill="${cliff}" stroke="${cliff}" stroke-width="${2 * bw(L)}" stroke-linejoin="round"/>`);
    push(`<path d="${L.d}" transform="translate(0,${L.cliff})" fill="none" stroke="${darken(PAL.sandDark, 0.4)}" stroke-width="${2 * bw(L) + 6}" stroke-linejoin="round" opacity="0.5"/>`);
  }
  for (const L of solid) {
    push(`<path d="${L.d}" fill="${PAL.sand}" ${sw(L, 2 * bw(L) + 7)} stroke="${SANDLINE}"/>`);
    push(`<path d="${L.d}" fill="${PAL.sand}" ${sw(L, 2 * bw(L))} stroke="${PAL.sand}"/>`);
    push(`<path d="${L.d}" fill="none" ${sw(L, 2 * bw(L) - 14)} stroke="${lighten(PAL.sand, 0.25)}" opacity="0.6"/>`);
  }
  const grassFill = doc.linear([[0, PAL.grassLight], [0.5, PAL.grass], [1, mix(PAL.grass, PAL.grassDark, 0.5)]], 0, 0, 0.3, 1);
  const clipMain = doc.clip(`<path d="${smoothPath(MAINLAND)}"/><path d="${smoothPath(ANIMAL_ISLE)}"/>`);
  for (const L of solid) {
    if (L.islet && L.islet[5] === 'tiny') continue;
    push(`<path d="${L.d}" fill="${grassFill}" stroke="${PAL.grassDark}" stroke-width="5" stroke-linejoin="round"/>`);
  }

  // ───── Sắc độ đất theo vùng (mềm, cắt theo đất liền) ─────
  let tint = '';
  const T = (x, y, rx, ry, c, a) => { tint += ellipse(x, y, rx, ry, P.soft(c, a), null); };
  // Rừng Câu Đố — cỏ ngả xanh bạc hà/tím
  T(760, 560, 650, 480, '#9fd1c0', 0.9); T(900, 420, 400, 300, '#b7a9e6', 0.6); T(520, 760, 300, 240, '#a99be0', 0.5);
  // Núi Toán Học — đất cam đào
  T(2020, 380, 760, 380, '#f7c08e', 0.95); T(2000, 260, 520, 220, '#f3ab7b', 0.6); T(1700, 600, 300, 200, '#cde59a', 0.5);
  // Thị Trấn Sáng Tạo — cỏ sáng, hồng phớt
  T(3130, 600, 560, 460, '#e9d6c6', 0.65); T(3150, 640, 420, 300, '#ffd0dc', 0.7);
  // Làng Kỹ Năng — vàng ruộng lúa
  T(2050, 1720, 820, 330, '#f3e08a', 0.85); T(1500, 1750, 400, 280, '#e8e58f', 0.6);
  // Đảo Động Vật — xanh tươi đậm
  T(560, 1580, 480, 440, '#86cf6a', 0.75);
  push(g(tint, '', `clip-path="${clipMain}"`));

  // ───── Hoạ tiết cỏ ─────
  {
    const R = rng(5);
    let tex = '';
    for (let i = 0; i < 2600; i++) {
      const p = [R.range(100, W - 100), R.range(80, H - 60)];
      if (!onLand(p) || coastDist(p) < 40) continue;
      const c = R() < 0.5 ? PAL.grassLight : darken(PAL.grass, 0.12);
      if (R() < 0.6) tex += stroke(`M${r2(p[0] - 5)},${r2(p[1] - 6)} L${r2(p[0] - 1)},${r2(p[1])} L${r2(p[0] + 4)},${r2(p[1] - 7)}`, c, 2.4, 'opacity="0.55"');
      else tex += ellipse(p[0], p[1], R.range(12, 30), R.range(5, 10), c, null, 0, 'opacity="0.3"');
    }
    ISLETS.forEach(([cx, cy, rx, ry, seed, kind], i) => {
      if (kind === 'tiny') return;
      for (let k = 0; k < 14; k++) {
        const p = [cx + R.range(-rx, rx) * 0.75, cy + R.range(-ry, ry) * 0.7];
        if (!inPoly(p, isletPts[i])) continue;
        tex += stroke(`M${r2(p[0] - 5)},${r2(p[1] - 6)} L${r2(p[0] - 1)},${r2(p[1])} L${r2(p[0] + 4)},${r2(p[1] - 7)}`, darken(PAL.grass, 0.15), 2.4, 'opacity="0.6"');
      }
    });
    push(tex);
  }

  details(P, push);
  return { doc, P, out, push };
}

/** transform co đa giác quanh tâm (tạo viền cát đều tương đối). */
function insetT(pts, k) {
  const cx = pts.reduce((a, p) => a + p[0], 0) / pts.length, cy = pts.reduce((a, p) => a + p[1], 0) / pts.length;
  return `translate(${r2(cx * (1 - k))},${r2(cy * (1 - k))}) scale(${k})`;
}
