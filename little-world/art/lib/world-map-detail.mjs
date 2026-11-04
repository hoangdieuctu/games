// ── Little World: chi tiết nướng sẵn trên nền bản đồ (sông, đường, rừng, núi, ruộng, phố, rạn san hô…) ──
import {
  PAL, ramp, lighten, darken, mix, alpha, rng, smoothPath, blob, blobPoints, shape, stroke, circle, ellipse, rect, r2, g,
  tree, pine, palm, bush, rock, flower, mushroom, house, fence, mountain, sparkle, wave, bridge, groundShadow, gloss, puffPath,
} from './world-kit.mjs';
import { W, H, ISLETS, RIVERS, LAKES, PATHS, BRIDGES, REGIONS, LANDMARKS, inPoly, regionById } from './world-layout.mjs';
import { sampleSpline, ribbon, polyD, lineD, scatter, distToPolyline } from './world-geo.mjs';
import { MAIN_S, ANIMAL_S, isletPts, onLand, nearWater, nearPath, coastDist } from './world-map.mjs';

const RESERVE = [];
for (const list of Object.values(LANDMARKS)) for (const l of list) RESERVE.push([l.x, l.y - l.h * 0.42, l.w * 0.62, l.h * 0.62]);
const inRes = (p, k = 1) => RESERVE.some(([x, y, rx, ry]) => ((p[0] - x) / (rx * k)) ** 2 + ((p[1] - y) / (ry * k)) ** 2 < 1);
const regionPoly = (id) => regionById[id].polygon;
const inRegion = (p, id) => inPoly(p, regionPoly(id));

/** Điểm hợp lệ để đặt vật đứng trên đất. */
function freeSpot(p, o = {}) {
  if (!onLand(p)) return false;
  if (coastDist(p) < (o.coast ?? 44)) return false;
  if (nearPath(p, o.path ?? 30)) return false;
  if (nearWater(p, o.water ?? 38)) return false;
  if (inRes(p, o.res ?? 1)) return false;
  for (const [cx, cy, rx, ry] of KEEP) if (((p[0] - cx) / rx) ** 2 + ((p[1] - cy) / ry) ** 2 < 1) return false;
  return true;
}
// các khoảng để trống thêm (nhãn tên vùng, ruộng, quảng trường…)
const KEEP = [];

export function details(P, push) {
  const objs = []; // {y, s} — vật đứng, sắp theo y
  const add = (y, s) => objs.push({ y, s });
  const ground = []; // lớp mặt đất (vẽ trước sông/đường)

  // ════════ Mặt đất theo vùng ════════
  groundVillage(P, ground, add);
  groundCreative(P, ground, add);
  groundMath(P, ground, add);
  groundForest(P, ground, add);
  groundAnimal(P, ground, add);
  push(ground.join(''));

  // ════════ Sông & hồ ════════
  push(waters(P));

  // ════════ Đường đi ════════
  push(paths(P));
  for (const [x1, y1, x2, y2, w] of BRIDGES) add(Math.max(y1, y2) - 30, bridge(P, x1, y1, x2, y2, w, { lw: 3.2, arch: 14 }));
  for (const b of riverCrossings()) add(b[1] + 6, bridge(P, b[0] - b[2] * 34, b[1] - b[3] * 34, b[0] + b[2] * 34, b[1] + b[3] * 34, 30, { lw: 3, arch: 8 }));

  // ════════ Biển: san hô, sóng, phao, tuyến thuyền ════════
  push(seaDetails(P));

  // ════════ Vật đứng theo vùng ════════
  objMath(P, add);
  objForest(P, add);
  objAnimal(P, add);
  objCreative(P, add);
  objVillage(P, add);
  objIslets(P, add);
  objFillers(P, add);

  objs.sort((a, b) => a.y - b.y);
  push(objs.map((o) => o.s).join(''));
}

// ───────────────────────── Sông, hồ ─────────────────────────
function waters(P) {
  let bank = '', water = '', hi = '';
  const wfill = P.lin('river', [[0, PAL.oceanLight], [1, PAL.ocean]], 0, 0, 1, 1);
  for (const r of RIVERS) {
    const poly = ribbon(r.pts, r.w0, r.w1, 0.14, r.pts.length * 7);
    const d = smoothPath(poly.filter((_, i) => i % 2 === 0));
    bank += `<path d="${d}" fill="${PAL.sand}" stroke="#d6a86e" stroke-width="26" stroke-linejoin="round"/><path d="${d}" fill="${PAL.sand}" stroke="${PAL.sand}" stroke-width="20" stroke-linejoin="round"/>`;
    water += `<path d="${d}" fill="${wfill}" stroke="${PAL.oceanDeep}" stroke-width="3.5" stroke-linejoin="round"/>`;
    const c = sampleSpline(r.pts, 12);
    hi += stroke(smoothPath(r.pts, false), '#d8f6fb', 4, 'stroke-dasharray="18 26" opacity="0.9"');
    const R = rng(r.pts.length * 3);
    for (let i = 4; i < c.length - 2; i += 7) hi += wave(c[i][0] + R.range(-4, 4), c[i][1] + R.range(-4, 4), 14, '#ffffff', 2.2, 0.7);
  }
  for (const [cx, cy, rx, ry, seed] of LAKES) {
    const d = blob(cx, cy, rx, ry, 9, 0.1, seed);
    bank += `<path d="${d}" fill="${PAL.sand}" stroke="#d6a86e" stroke-width="30" stroke-linejoin="round"/><path d="${d}" fill="${PAL.sand}" stroke="${PAL.sand}" stroke-width="24" stroke-linejoin="round"/>`;
    water += `<path d="${d}" fill="${P.rad('lake', [[0, '#c9f1f8'], [0.6, PAL.oceanLight], [1, PAL.ocean]], 0.4, 0.35, 0.7)}" stroke="${PAL.oceanDeep}" stroke-width="3.5"/>`;
    hi += wave(cx - rx * 0.3, cy - 2, 20, '#ffffff', 2.4, 0.8) + wave(cx + rx * 0.3, cy + 8, 16, '#ffffff', 2.2, 0.7);
  }
  return bank + water + hi;
}

// ───────────────────────── Đường ─────────────────────────
function paths(P) {
  const ds = PATHS.map((p) => smoothPath(p.pts, false));
  const all = ds.join(' ');
  let s = '';
  s += `<path d="${all}" fill="none" stroke="${PAL.shadowSoft}" stroke-width="34" stroke-linecap="round" stroke-linejoin="round" transform="translate(2,5)"/>`;
  s += `<path d="${all}" fill="none" stroke="#c99a62" stroke-width="30" stroke-linecap="round" stroke-linejoin="round"/>`;
  s += `<path d="${all}" fill="none" stroke="#f1d6a1" stroke-width="23" stroke-linecap="round" stroke-linejoin="round"/>`;
  s += `<path d="${all}" fill="none" stroke="#fbe9c4" stroke-width="10" stroke-linecap="round" stroke-linejoin="round" opacity="0.7"/>`;
  // dấu bước chân / chấm trang trí
  s += `<path d="${all}" fill="none" stroke="#e0b67c" stroke-width="5" stroke-dasharray="0.1 24" stroke-linecap="round"/>`;
  return s;
}

function riverCrossings() {
  const out = [];
  const RS = RIVERS.map((r) => sampleSpline(r.pts, 6));
  for (const p of PATHS) {
    const S = sampleSpline(p.pts, 6);
    for (let i = 1; i < S.length; i++) {
      for (const rs of RS) {
        for (let j = 1; j < rs.length; j++) {
          const hit = segX(S[i - 1], S[i], rs[j - 1], rs[j]);
          if (hit) {
            const dx = S[i][0] - S[i - 1][0], dy = S[i][1] - S[i - 1][1], L = Math.hypot(dx, dy);
            if (!out.some((o) => Math.hypot(o[0] - hit[0], o[1] - hit[1]) < 60)) out.push([hit[0], hit[1], dx / L, dy / L]);
          }
        }
      }
    }
  }
  return out;
}
function segX(a, b, c, d) {
  const r = [b[0] - a[0], b[1] - a[1]], s = [d[0] - c[0], d[1] - c[1]], den = r[0] * s[1] - r[1] * s[0];
  if (Math.abs(den) < 1e-9) return null;
  const t = ((c[0] - a[0]) * s[1] - (c[1] - a[1]) * s[0]) / den, u = ((c[0] - a[0]) * r[1] - (c[1] - a[1]) * r[0]) / den;
  return t >= 0 && t <= 1 && u >= 0 && u <= 1 ? [a[0] + r[0] * t, a[1] + r[1] * t] : null;
}

// ───────────────────────── Biển ─────────────────────────
function seaDetails(P) {
  let s = '';
  const R = rng(404);
  // rạn san hô (dưới nước, mờ)
  const reef = (cx, cy, n, spread, seed) => {
    const F = rng(seed);
    let b = shape(blob(cx, cy, spread * 1.05, spread * 0.5, 10, 0.18, seed), alpha('#8fe6df', 0.55), alpha('#ffffff', 0.5), 3, 'stroke-dasharray="10 12"');
    const items = [];
    for (let i = 0; i < n; i++) {
      const a = F() * Math.PI * 2, k = Math.sqrt(F());
      items.push([cx + Math.cos(a) * spread * 0.85 * k, cy + Math.sin(a) * spread * 0.4 * k, F.pick([PAL.coral, PAL.pink, PAL.orange, PAL.lavender, PAL.yellow, PAL.rose]), F.int(0, 2), F.range(0.8, 1.25)]);
    }
    items.sort((p, q) => p[1] - q[1]);
    for (const [x, y, c, k, sc] of items) {
      const C = alpha(c, 0.92), L = alpha(darken(c, 0.4), 0.8);
      if (k === 0) { // san hô cành
        for (const [dx, h, bend] of [[-6, 14, -6], [0, 20, 2], [6, 13, 7]]) b += stroke(`M${r2(x)},${r2(y)} Q${r2(x + dx * sc)},${r2(y - h * 0.5 * sc)} ${r2(x + (dx + bend) * sc)},${r2(y - h * sc)}`, L, 7.5 * sc) + stroke(`M${r2(x)},${r2(y)} Q${r2(x + dx * sc)},${r2(y - h * 0.5 * sc)} ${r2(x + (dx + bend) * sc)},${r2(y - h * sc)}`, C, 4.5 * sc);
      } else if (k === 1) { // san hô não
        b += ellipse(x, y - 6 * sc, 12 * sc, 9 * sc, C, L, 2.2) + stroke(`M${r2(x - 7 * sc)},${r2(y - 6 * sc)} q${r2(3.5 * sc)},${r2(-5 * sc)} ${r2(7 * sc)},0 t${r2(7 * sc)},0`, L, 1.8);
      } else { // rong biển
        b += stroke(`M${r2(x)},${r2(y)} q${r2(-5 * sc)},${r2(-8 * sc)} 0,${r2(-15 * sc)} t0,${r2(-15 * sc)}`, alpha('#5fbf8f', 0.9), 4 * sc);
      }
    }
    return b;
  };
  s += reef(3420, 1470, 16, 110, 1) + reef(3220, 1780, 12, 90, 2) + reef(3700, 1900, 10, 80, 3) + reef(2980, 2050, 9, 70, 4) + reef(3600, 1250, 8, 70, 5) + reef(3680, 820, 7, 60, 6);
  // rong biển gần bờ đảo
  // tuyến thuyền (nét đứt trắng) từ bến tàu ngầm ra các đảo
  const route = (pts) => stroke(smoothPath(pts, false), '#ffffff', 4, 'stroke-dasharray="4 16" opacity="0.8"');
  s += route([[3080, 1500], [3170, 1420], [3230, 1360]]);
  s += route([[3100, 1560], [3300, 1650], [3440, 1720]]);
  s += route([[3060, 1590], [3080, 1780], [3110, 1880]]);
  s += route([[2140, 1180], [2350, 1200], [2600, 1180], [2850, 1180], [3200, 1230]]);
  // phao
  for (const [x, y, c] of [[3180, 1460, PAL.coral], [3350, 1880, PAL.yellow], [2960, 1180, PAL.coral], [3700, 1500, PAL.yellow], [2300, 1110, PAL.yellow]]) {
    s += ellipse(x, y + 7, 13, 5, alpha(PAL.oceanDeep, 0.35), null) + shape(`M${x - 9},${y + 4} Q${x - 9},${y - 12} ${x},${y - 14} Q${x + 9},${y - 12} ${x + 9},${y + 4}Z`, P.vgrad(c), ramp(c).line, 2.4) + rect(x - 9, y - 6, 18, 5, 2, PAL.white, null) + wave(x, y + 9, 26, '#ffffff', 2.2, 0.8);
  }
  // sóng nổi bật hơn ở biển khơi
  for (let i = 0; i < 160; i++) {
    const p = [R.range(30, W - 30), R.range(30, H - 30)];
    if (onLand(p) || coastDist(p) < 110 || isletPts.some((q) => inPoly(p, q))) continue;
    s += wave(p[0], p[1], R.range(26, 40), '#ffffff', 3.2, 0.75) + (R() < 0.4 ? wave(p[0] + 16, p[1] + 12, 18, '#ffffff', 2.6, 0.6) : '');
  }
  // lấp lánh trên mặt nước
  for (let i = 0; i < 60; i++) {
    const p = [R.range(30, W - 30), R.range(30, H - 30)];
    if (onLand(p) || coastDist(p) < 80) continue;
    s += sparkle(p[0], p[1], R.range(5, 9), '#ffffff', 0.85);
  }
  return s;
}

// ───────────────────────── Làng Kỹ Năng (nam) ─────────────────────────
function groundVillage(P, G, add) {
  // ruộng chắp vá (nhìn từ trên xuống)
  const fields = [
    [1330, 1760, 150, 95, -8, '#f6d56a'], [1430, 1890, 130, 70, -5, '#b7dd7c'], [1250, 1640, 90, 80, 4, '#d9e88d'],
    [2620, 1640, 140, 80, 10, '#f6d56a'], [2700, 1530, 110, 55, 6, '#c3e38a'], [2120, 1980, 130, 50, -2, '#f4c96a'],
    [1960, 1960, 110, 55, 3, '#b7dd7c'], [2560, 1880, 110, 65, 12, '#d9e88d'],
  ];
  for (const [x, y, w, h, rot, c] of fields) {
    KEEP.push([x, y, w * 0.85, h * 0.85]);
    let b = rect(x - w, y - h, w * 2, h * 2, 26, P.vgrad(c, 0.5), darken(c, 0.35), 3.4);
    const n = Math.floor(h * 2 / 16);
    for (let i = 1; i < n; i++) b += stroke(`M${r2(x - w + 12)},${r2(y - h + i * 16)} L${r2(x + w - 12)},${r2(y - h + i * 16)}`, darken(c, 0.16), 4, 'opacity="0.7"');
    G.push(g(b, `rotate(${rot} ${x} ${y})`));
  }
  // quảng trường làng (sân lát gạch) quanh điểm cầu Đảo Nhà
  G.push(ellipse(1905, 1500, 120, 50, '#c99a62', null) + ellipse(1905, 1498, 114, 45, '#f3ddb0', null) + ellipse(1905, 1498, 70, 26, '#fbe9c4', null));
  KEEP.push([1905, 1500, 130, 60]);
}
function objVillage(P, add) {
  const R = rng(61);
  // nhà nhỏ dọc đường
  const homes = [[1440, 1560], [1700, 1560], [2010, 1640], [2320, 1650], [2600, 1450], [2030, 1840], [1760, 1720], [2690, 1760], [1340, 1520], [2470, 1950]];
  const walls = [PAL.cream, '#fff0d6', PAL.white, '#ffe6c4'], roofs = [PAL.orangeDeep, PAL.coral, '#e8a24f', PAL.rose, '#d98b5a'];
  homes.forEach(([x, y], i) => { if (!inRes([x, y], 0.9)) add(y, house(P, x, y, 1.05, { wall: walls[i % 4], roof: roofs[i % 5], chimney: i % 2 === 0, seed: i })); });
  // đống rơm, hàng rào
  for (const [x, y] of [[1290, 1700], [2580, 1720], [1420, 1950], [2650, 1580]]) add(y, hay(P, x, y));
  for (const [x1, y1, x2, y2] of [[1180, 1600, 1290, 1560], [2520, 1560, 2600, 1540], [1900, 1890, 2010, 1900], [2600, 1940, 2700, 1880]]) add(Math.max(y1, y2), fence(P, x1, y1, x2, y2, 1.2));
  // vườn cây ăn quả
  for (const p of scatter(regionPoly('life-skills-village'), 110, 44, 66, (q) => !freeSpot(q))) {
    const t = R();
    if (t < 0.55) add(p[1], tree(P, p[0], p[1], R.range(0.8, 1.05), { color: R.pick([PAL.leaf, PAL.grassDark, '#8fd16f']), seed: R.int(1, 99), fruit: R() < 0.35 ? R.pick([PAL.coral, PAL.orange, PAL.yellow]) : null }));
    else if (t < 0.8) add(p[1], bush(P, p[0], p[1], R.range(0.9, 1.2), { flower: R() < 0.5 ? R.pick([PAL.pink, PAL.yellow, PAL.white]) : null, seed: R.int(1, 50) }));
    else add(p[1], flowerPatch(P, p[0], p[1], R));
  }
}
function hay(P, x, y) {
  const c = '#f2c75c';
  return groundShadow(x + 4, y, 22, 7) + shape(`M${x - 20},${y} Q${x - 22},${y - 30} ${x},${y - 34} Q${x + 22},${y - 30} ${x + 20},${y} Q${x},${y + 5} ${x - 20},${y}Z`, P.vgrad(c), ramp(c).line, 2.6) + stroke(`M${x - 14},${y - 12} Q${x},${y - 8} ${x + 14},${y - 12}`, ramp(c).lo, 2);
}
function flowerPatch(P, x, y, R) {
  let b = '';
  const c = R.pick([PAL.pink, PAL.yellow, PAL.coral, PAL.lavender, PAL.white]);
  for (let i = 0; i < 4; i++) b += flower(P, x + R.range(-12, 12), y + R.range(-5, 5), 1.1, c);
  return b;
}

// ───────────────────────── Thị Trấn Sáng Tạo (đông bắc) ─────────────────────────
function groundCreative(P, G, add) {
  // quảng trường & phố lát gạch hồng
  const plaza = [[3050, 700, 110, 52], [3170, 760, 80, 34]];
  for (const [x, y, rx, ry] of plaza) {
    G.push(ellipse(x, y, rx + 6, ry + 5, '#d58f9a', null) + ellipse(x, y, rx, ry, P.v2('#ffe3e3', '#f8cfd3'), null));
    const R = rng(x);
    for (let i = 0; i < 26; i++) { const a = R() * Math.PI * 2, k = Math.sqrt(R()); G.push(rect(x + Math.cos(a) * rx * 0.85 * k - 5, y + Math.sin(a) * ry * 0.8 * k - 3, 10, 6, 2, alpha('#e9a9b3', 0.6), null)); }
    KEEP.push([x, y, rx, ry]);
  }
  // luống hoa sặc sỡ
  for (const [x, y, c] of [[2820, 600, PAL.pink], [3330, 760, PAL.yellow], [3050, 880, PAL.lavender], [3300, 560, PAL.coral], [2800, 300, PAL.yellow], [3000, 260, PAL.pink]]) {
    let b = ellipse(x, y, 46, 18, '#b07a55', null) + ellipse(x, y - 2, 42, 15, '#8e5d43', null);
    const R = rng(x + y);
    for (let i = 0; i < 9; i++) b += circle(x + R.range(-34, 34), y - 2 + R.range(-9, 9), 5.5, R() < 0.7 ? c : PAL.white, darken(c, 0.35), 1.4);
    G.push(b);
  }
}
function objCreative(P, add) {
  const R = rng(71);
  // nhà nhiều màu (nhỏ) — dày đặc thành phố
  const walls = [PAL.pinkLight, '#d7f0ff', PAL.yellowLight, '#e4f6d6', PAL.lavenderLight, '#ffe3cf'];
  const roofs = [PAL.rose, PAL.purple, '#58b4e8', PAL.orangeDeep, '#6cc46a', PAL.coral, '#f2b53d'];
  const spots = scatter(regionPoly('creative-town'), 60, 58, 72, (q) => !freeSpot(q, { path: 32 }) || q[1] < 240);
  spots.forEach((p, i) => {
    const t = R();
    if (t < 0.5 && Math.hypot(p[0] - 3100, p[1] - 620) < 360) add(p[1], house(P, p[0], p[1], R.range(0.95, 1.15), { wall: walls[i % 6], roof: roofs[(i * 3) % 7], roofStyle: R() < 0.35 ? 'round' : 'gable', chimney: R() < 0.4, h: R.range(24, 32) }));
    else if (t < 0.8) add(p[1], tree(P, p[0], p[1], R.range(0.8, 1), { color: R.pick(['#8fd16f', PAL.leaf, '#f7a9c0']), blossom: R() < 0.6 ? PAL.pinkLight : null, seed: i }));
    else add(p[1], bush(P, p[0], p[1], 1, { flower: R.pick([PAL.pink, PAL.yellow, PAL.lavender]), seed: i }));
  });
  // đài phun nước giữa quảng trường
  add(705, fountain(P, 3050, 705));
  // cờ dây & giá vẽ nhỏ
  for (const [x, y] of [[3200, 770], [2990, 640]]) add(y, easel(P, x, y));
}
function fountain(P, x, y) {
  const st = PAL.stoneLight, S = ramp(st);
  let b = groundShadow(x + 4, y + 2, 44, 12);
  b += ellipse(x, y - 4, 42, 16, P.vgrad(st), S.line, 3) + ellipse(x, y - 7, 34, 11, P.v2(PAL.oceanLight, PAL.ocean), PAL.oceanDeep, 2);
  b += rect(x - 6, y - 34, 12, 28, 4, P.vgrad(st), S.line, 2.4) + ellipse(x, y - 34, 16, 6, P.vgrad(st), S.line, 2.4);
  b += stroke(`M${x},${y - 40} Q${x - 18},${y - 58} ${x - 26},${y - 12}`, '#bdeffa', 3) + stroke(`M${x},${y - 40} Q${x + 18},${y - 58} ${x + 26},${y - 12}`, '#bdeffa', 3) + circle(x, y - 44, 5, '#e6fbff', null);
  return b;
}
function easel(P, x, y) {
  const w = PAL.wood, Wr = ramp(w);
  let b = groundShadow(x + 3, y, 14, 4);
  b += stroke(`M${x - 10},${y} L${x - 2},${y - 36} M${x + 10},${y} L${x + 2},${y - 36} M${x},${y - 30} L${x + 4},${y}`, Wr.line, 3.4) + stroke(`M${x - 10},${y} L${x - 2},${y - 36} M${x + 10},${y} L${x + 2},${y - 36}`, w, 1.8);
  b += rect(x - 13, y - 40, 26, 22, 3, PAL.white, Wr.line, 2) + circle(x - 5, y - 31, 4, PAL.coral, null) + circle(x + 4, y - 27, 4, '#58b4e8', null) + circle(x + 3, y - 35, 3, PAL.yellow, null);
  return b;
}

// ───────────────────────── Núi Toán Học (bắc) ─────────────────────────
function groundMath(P, G) {
  // bậc thang/ruộng trái cây nhỏ chân núi
}
function objMath(P, add) {
  const cols = ['#ffc9a3', '#ffb889', '#f9a979', '#ffd2b0'];
  const far = '#e6c9e8';
  // dãy núi — hàng sau → trước
  const M = [
    // hàng xa (tím hồng nhạt)
    [1530, 250, 260, 170, far], [1830, 220, 300, 190, far], [2230, 215, 320, 190, far], [2520, 240, 260, 160, far], [1380, 300, 200, 120, far],
    // hàng giữa
    [1480, 360, 280, 210, 0], [1900, 330, 260, 200, 1], [2260, 300, 300, 230, 2], [2580, 360, 240, 190, 3], [1680, 300, 200, 150, 2],
    // hàng gần (nhỏ, xanh chân)
    [1450, 560, 200, 150, 1], [2560, 560, 210, 160, 0], [2230, 560, 150, 110, 3], [1760, 470, 150, 110, 3], [2480, 470, 150, 120, 2],
  ];
  M.forEach(([x, y, w, h, c], i) => {
    if (inRes([x, y - 10], 0.75)) return;
    const col = typeof c === 'string' ? c : cols[c];
    add(y - (typeof c === 'string' ? 300 : 0), mountain(P, x, y, w, h, { color: col, seed: i + 3, lw: 4, snow: h > 150 }));
    // thông ở chân núi
    const F = rng(i + 40);
    if (typeof c !== 'string') for (let k = 0; k < 4; k++) { const px = x + F.range(-w * 0.45, w * 0.45), py = y + F.range(0, 16); if (!nearWater([px, py], 30) && !nearPath([px, py], 24)) add(py, pine(P, px, py, F.range(0.7, 0.95), { color: F.pick([PAL.leafDark, '#5fae6a']) })); }
  });
  // khối hình học & xúc xắc rải rác (trang trí chủ đề toán)
  const R = rng(91);
  for (const p of scatter(regionPoly('math-mountain'), 26, 70, 92, (q) => !freeSpot(q, { coast: 60 }) || q[1] < 380)) {
    const k = R.int(0, 3);
    if (k === 0) add(p[1], dice(P, p[0], p[1], 15, R.pick([PAL.white, PAL.pinkLight, PAL.yellowLight])));
    else if (k === 1) add(p[1], pyramid(P, p[0], p[1], 18, R.pick([PAL.yellow, PAL.mint, PAL.lavender])));
    else if (k === 2) add(p[1], ball(P, p[0], p[1], 12, R.pick([PAL.coral, '#58b4e8', PAL.yellow])));
    else add(p[1], tree(P, p[0], p[1], 0.85, { color: PAL.leaf, fruit: PAL.orange, seed: R.int(1, 99) }));
  }
  // thông & cây rải chân núi gần vịnh
  for (const p of scatter(regionPoly('math-mountain'), 60, 46, 93, (q) => !freeSpot(q) || q[1] < 560)) add(p[1], R() < 0.5 ? pine(P, p[0], p[1], R.range(0.75, 1), { color: R.pick([PAL.leafDark, '#5fae6a']) }) : tree(P, p[0], p[1], R.range(0.8, 1), { color: R.pick([PAL.leaf, '#8fd16f']), seed: R.int(1, 99), fruit: R() < 0.3 ? PAL.orange : null }));
  // thác nhỏ từ hồ núi
  add(400, cascade(P, 1700, 440, 40));
}
export function dice(P, x, y, s, col = PAL.white) {
  const C = ramp(col), lw = 2.6;
  let b = groundShadow(x + 4, y, s * 1.3, s * 0.4);
  b += rect(x - s, y - s * 2.6, s * 2, s * 1.1, s * 0.4, lighten(col, 0.25), C.line, lw); // mặt trên
  b += rect(x - s, y - s * 2, s * 2, s * 2, s * 0.4, P.vgrad(col), C.line, lw); // mặt trước
  for (const [dx, dy] of [[-0.45, -1.55], [0, -1], [0.45, -0.45]]) b += circle(x + dx * s, y + dy * s, s * 0.17, PAL.ink, null);
  b += circle(x, y - s * 2.32, s * 0.15, PAL.ink, null, 0, 'opacity="0.8"');
  return b;
}
export function pyramid(P, x, y, s, col) {
  const C = ramp(col);
  return groundShadow(x + 4, y, s * 1.2, s * 0.35) + shape(`M${x - s},${y} L${x},${y - s * 1.8} L${x + s},${y} Q${x},${y + 3} ${x - s},${y}Z`, P.vgrad(col), C.line, 2.6) + shape(`M${x},${y - s * 1.8} L${x + s},${y} Q${x + s * 0.4},${y + 2} ${x + s * 0.25},${y + 1}Z`, C.lo, null, 0, 'opacity="0.7"');
}
export function ball(P, x, y, s, col) {
  return groundShadow(x + 4, y, s * 1.1, s * 0.33) + circle(x, y - s, s, P.sphere(col), ramp(col).line, 2.6) + gloss(x - s * 0.35, y - s * 1.4, s * 0.35, s * 0.2, 0.6);
}
function cascade(P, x, y, h) {
  return shape(`M${x - 12},${y - h} Q${x - 16},${y} ${x - 14},${y + 6} L${x + 14},${y + 6} Q${x + 16},${y} ${x + 12},${y - h}Z`, P.v2('#e6fbff', PAL.oceanLight), PAL.oceanDeep, 2.4) + stroke(`M${x - 4},${y - h + 6} L${x - 5},${y} M${x + 5},${y - h + 10} L${x + 5},${y + 2}`, '#ffffff', 2.4) + ellipse(x, y + 8, 22, 7, '#ffffff', null, 0, 'opacity="0.8"');
}

// ───────────────────────── Rừng Câu Đố (tây bắc) ─────────────────────────
const MAGIC = ['#8f9de8', '#a58ae0', '#6fc3b2', '#7fb0e8', '#b58de0', '#5fae9c'];
function groundForest(P, G) {
  // thảm rêu tím & các vòng sáng
  const R = rng(13);
  for (let i = 0; i < 26; i++) {
    const p = [R.range(320, 1350), R.range(200, 1000)];
    if (!inRegion(p, 'puzzle-forest')) continue;
    G.push(ellipse(p[0], p[1], R.range(40, 90), R.range(18, 36), alpha(R.pick(['#b7a9e6', '#8fd1c0', '#a3b8ee']), 0.35), null));
  }
}
function objForest(P, add) {
  const R = rng(21);
  const pts = scatter(regionPoly('puzzle-forest'), 420, 34, 22, (q) => !freeSpot(q, { path: 28, water: 34 }));
  for (const p of pts) {
    const t = R();
    if (t < 0.7) {
      const col = R.pick(MAGIC);
      add(p[1], R() < 0.4 ? pine(P, p[0], p[1], R.range(0.85, 1.15), { color: col }) : tree(P, p[0], p[1], R.range(0.85, 1.15), { color: col, seed: R.int(1, 99), blossom: R() < 0.2 ? PAL.yellowLight : null }));
    } else if (t < 0.88) add(p[1], mushroom(P, p[0], p[1], R.range(0.8, 1.2), { cap: R.pick([PAL.coral, PAL.purple, '#58b4e8', PAL.rose, PAL.orange]), glow: R() < 0.5 ? PAL.yellowLight : null }));
    else add(p[1], glowOrb(P, p[0], p[1] - 30, R));
  }
}
function glowOrb(P, x, y, R) {
  const c = R.pick([PAL.yellowLight, PAL.lavenderLight, '#c9fff0']);
  return circle(x, y, 22, P.glow(c, 0.9), null) + circle(x, y, 4.5, '#ffffff', null) + sparkle(x + 10, y - 8, 5, '#ffffff', 0.9);
}

// ───────────────────────── Đảo Động Vật (tây nam) ─────────────────────────
function groundAnimal(P, G) {
  // ao nhỏ có lá sen
  for (const [x, y, rx, ry] of [[860, 1440, 48, 22], [300, 1460, 40, 18], [800, 1880, 46, 20]]) {
    const d = blob(x, y, rx, ry, 8, 0.1, x);
    G.push(`<path d="${d}" fill="${PAL.sand}" stroke="#d6a86e" stroke-width="18"/><path d="${d}" fill="${PAL.sand}" stroke="${PAL.sand}" stroke-width="13"/><path d="${d}" fill="${P.v2(PAL.oceanLight, PAL.ocean)}" stroke="${PAL.oceanDeep}" stroke-width="3"/>`);
    G.push(ellipse(x - rx * 0.4, y, 9, 4.5, PAL.leaf, PAL.leafDark, 1.5) + ellipse(x + rx * 0.3, y - 5, 7, 3.5, PAL.leaf, PAL.leafDark, 1.5) + circle(x + rx * 0.3, y - 7, 2.5, PAL.pink, null));
    KEEP.push([x, y, rx + 14, ry + 12]);
  }
  // bãi cỏ chăn thả có hàng rào (đồng cỏ sáng)
  G.push(ellipse(620, 1290, 120, 50, alpha(PAL.grassLight, 0.8), null));
  KEEP.push([620, 1290, 110, 45]);
}
function objAnimal(P, add) {
  const R = rng(31);
  // hàng rào đồng cỏ
  const fx = 620, fy = 1290;
  const ring = [];
  for (let i = 0; i <= 12; i++) { const a = Math.PI * 2 * i / 12; ring.push([fx + Math.cos(a) * 120, fy + Math.sin(a) * 48]); }
  for (let i = 0; i < 12; i++) if (i !== 3) add(Math.max(ring[i][1], ring[i + 1][1]) + (ring[i][1] > fy ? 0 : -60), fence(P, ring[i][0], ring[i][1], ring[i + 1][0], ring[i + 1][1], 1.1));
  // thú nhỏ (cừu, gà) trong đồng cỏ
  for (const [x, y] of [[580, 1290], [660, 1300], [620, 1270]]) add(y, sheep(P, x, y));
  const pts = scatter(regionPoly('animal-island'), 260, 34, 32, (q) => !freeSpot(q, { coast: 40 }));
  for (const p of pts) {
    const t = R();
    if (t < 0.6) add(p[1], tree(P, p[0], p[1], R.range(0.9, 1.2), { color: R.pick([PAL.leaf, '#5fb85f', '#8fd16f', PAL.grassDark]), seed: R.int(1, 99), fruit: R() < 0.12 ? PAL.coral : null }));
    else if (t < 0.85) add(p[1], pine(P, p[0], p[1], R.range(0.9, 1.15), { color: R.pick([PAL.leafDark, '#4f9e57']) }));
    else if (t < 0.95) add(p[1], bush(P, p[0], p[1], 1.1, { flower: R() < 0.5 ? PAL.pink : null, seed: R.int(1, 60) }));
    else add(p[1], rock(P, p[0], p[1], 1.1, { seed: R.int(1, 50) }));
  }
}
function sheep(P, x, y) {
  return groundShadow(x + 3, y, 14, 4) + shape(puffPath(x, y - 10, 13, 9, 7, 0.25, x), P.sphere(PAL.white), ramp(PAL.cream).line, 2) + ellipse(x + 11, y - 12, 5, 4.5, PAL.ink, null) + circle(x + 12, y - 13, 1, '#ffffff', null);
}

// ───────────────────────── Đảo nhỏ ─────────────────────────
function objIslets(P, add) {
  const R = rng(51);
  ISLETS.forEach(([cx, cy, rx, ry, seed, kind]) => {
    if (kind === 'palm') {
      if (Math.hypot(cx - 3290, cy - 1300) < 10) { add(cy + ry * 0.4, palm(P, cx - rx * 0.62, cy + ry * 0.3, 1.1, { lean: -1 })); return; }
      add(cy, palm(P, cx - rx * 0.25, cy + ry * 0.15, 1.15, { lean: -1 }));
      add(cy + 10, palm(P, cx + rx * 0.25, cy + ry * 0.3, 1, { lean: 1 }));
      add(cy + 20, bush(P, cx + 5, cy + ry * 0.45, 0.9, { flower: PAL.coral }));
    } else if (kind === 'tiny') {
      add(cy, rock(P, cx - rx * 0.2, cy + 6, 1.2, { seed }) + rock(P, cx + rx * 0.3, cy + 10, 0.8, { seed: seed + 1 }));
      if (R() < 0.6) add(cy + 2, palm(P, cx + rx * 0.05, cy + 4, 0.8, { lean: 1 }));
    }
  });
}

// ───────────────────────── Lấp chỗ trống giữa các vùng ─────────────────────────
function objFillers(P, add) {
  const R = rng(81);
  // ven bờ: cây cọ trên bãi biển (chỉ ở bờ đông/nam), đá ven biển
  for (let i = 0; i < MAIN_S.length; i += 9) {
    const [x, y] = MAIN_S[i];
    if (R() < 0.35 && y > 1400 && !inRes([x, y]) && !nearPath([x, y], 40) && !nearWater([x, y], 50)) {
      add(y - 4, palm(P, x + R.range(-6, 6), y - 14, R.range(0.75, 0.95), { lean: x > 2000 ? 1 : -1 }));
    } else if (R() < 0.25) add(y + 8, rock(P, x + R.range(-6, 6), y + 14, R.range(0.7, 1), { seed: i }));
  }
  // thung lũng giữa vùng: viền rừng bao quanh vịnh
  const ring = [[1460, 980, 130, 120], [2580, 960, 120, 70], [1250, 1300, 90, 90]];
  for (const [x, y, rx, ry] of ring) {
    for (let i = 0; i < 18; i++) {
      const p = [x + R.range(-rx, rx), y + R.range(-ry, ry)];
      if (!freeSpot(p)) continue;
      add(p[1], tree(P, p[0], p[1], R.range(0.85, 1.05), { color: R.pick([PAL.leaf, '#8fd16f']), seed: R.int(1, 99) }));
    }
  }
}
