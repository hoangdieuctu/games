// ── Little World · Đảo: cây bụi, hoa, cỏ, nấm (island/plants) + địa hình (island/terrain) ──
import { sprite } from './island-common.mjs';
import {
  PAL, LINE, ramp, lighten, darken, mix, alpha, rng, smoothPath, blob, blobPoints, puffPath, gloss, shape, stroke, circle,
  ellipse, rect, r2, baseShadow, canopy, leafMark, flowerHead, tulip, leafTuft, blade, pebble, sparkle, glow, leaf, plank,
} from './island-kit.mjs';

// ───────────── mảnh vẽ ─────────────
export function bush(doc, cx, by, w, h, color, seed, o = {}) {
  let s = baseShadow(cx, by - 2, w * 0.5, h * 0.18);
  s += canopy(doc, cx, by - h * 0.48, w * 0.5, h * 0.46, color, seed, {
    lw: LINE.md, sparkles: 3, line: o.line,
    clumps: [[-0.45, 0.2, 0.5], [0.42, 0.22, 0.5], [0, 0.3, 0.48], [-0.22, -0.3, 0.5], [0.28, -0.28, 0.48]],
  });
  return s;
}

/** Cụm hoa: lá nền + nhiều bông. */
function flowerCluster(doc, cx, by, petal, center, seed, kind = 'daisy') {
  const R = rng(seed);
  let s = baseShadow(cx, by - 1, 22, 6);
  // lá
  for (let i = 0; i < 7; i++) {
    const a = -70 + i * 23 + (R() - 0.5) * 10;
    s += leaf(doc, cx + (i - 3) * 3, by, 14 + R() * 6, 5.5, a, i % 2 ? PAL.leaf : PAL.leafDark, LINE.xs * 1.2);
  }
  const heads = [[-12, -18], [10, -22], [-2, -30], [16, -10], [-16, -6], [3, -12]];
  heads.forEach(([dx, dy], i) => {
    const x = cx + dx, y = by + dy;
    s += stroke(`M${cx + dx * 0.3},${by - 2} Q${x - 1},${y + 8} ${x},${y + 2}`, PAL.leafDark, LINE.sm);
    if (kind === 'tulip') s += tulip(doc, x, y, 6.5, i % 2 ? petal : lighten(petal, 0.15));
    else if (kind === 'bell') {
      const r = ramp(petal);
      s += shape(`M${x - 6},${y - 3} Q${x - 6},${y - 11} ${x},${y - 11} Q${x + 6},${y - 11} ${x + 6},${y - 3} L${x + 8},${y + 3} Q${x + 4},${y + 1} ${x + 2},${y + 4} Q${x},${y + 1} ${x - 2},${y + 4} Q${x - 4},${y + 1} ${x - 8},${y + 3}Z`, doc.vgrad(petal), r.line, LINE.xs * 1.2) + gloss(x - 2.5, y - 7, 1.8, 3, 0.5, 10);
    } else s += flowerHead(doc, x, y, kind === 'big' ? 10 : 8.5, i % 2 ? petal : lighten(petal, 0.12), center, kind === 'daisy' ? 7 : 5, R());
  });
  return s;
}

export function rock(doc, cx, by, w, h, seed, o = {}) {
  const color = o.color || PAL.stone;
  const r = ramp(color);
  let s = baseShadow(cx, by - 2, w * 0.5, h * 0.22);
  const pts = blobPoints(cx, by - h * 0.45, w * 0.5, h * 0.5, 8, 0.1, seed, -0.3);
  // phẳng đáy
  const d = smoothPath(pts.map(([x, y]) => [x, Math.min(y, by - 2)]), true);
  s += shape(d, doc.linear([[0, lighten(color, 0.3)], [0.5, color], [1, darken(color, 0.2)]], 0.2, 0, 0.8, 1), r.line, o.lw || LINE.md);
  const cl = doc.clip(`<path d="${d}"/>`);
  let inner = '';
  // mặt trên sáng (thấy từ trên xuống)
  inner += `<path d="${blob(cx - w * 0.06, by - h * 0.7, w * 0.4, h * 0.3, 7, 0.12, seed + 3)}" fill="${lighten(color, 0.4)}" opacity="0.85"/>`;
  inner += `<path d="M${r2(cx + w * 0.1)},${r2(by - h)} L${r2(cx + w * 0.6)},${r2(by - h)} L${r2(cx + w * 0.6)},${r2(by)} L${r2(cx + w * 0.2)},${r2(by)}Z" fill="${PAL.purple}" opacity="0.14"/>`;
  if (o.moss) {
    inner += `<path d="${puffPath(cx - w * 0.1, by - h * 0.86, w * 0.36, h * 0.22, 7, 0.2, seed)}" fill="${doc.sphere(PAL.leaf)}"/>`;
    inner += `<path d="${puffPath(cx + w * 0.22, by - h * 0.74, w * 0.2, h * 0.14, 6, 0.2, seed + 1)}" fill="${doc.sphere(PAL.grass)}"/>`;
  }
  s += `<g clip-path="${cl}">${inner}</g>`;
  s += stroke(`M${r2(cx + w * 0.05)},${r2(by - h * 0.55)} l${r2(w * 0.08)},${r2(h * 0.14)} l${r2(-w * 0.04)},${r2(h * 0.12)}`, r.lo, LINE.sm);
  if (o.moss) {
    s += stroke(puffArcTop(cx - w * 0.1, by - h * 0.86, w * 0.36, h * 0.22), ramp(PAL.leaf).line, LINE.sm);
    s += leafMark(cx - w * 0.28, by - h * 0.62, 3, PAL.leafDark, 20) + leafMark(cx + w * 0.02, by - h * 0.6, 2.6, PAL.leafDark, -10);
  }
  s += gloss(cx - w * 0.22, by - h * 0.78, w * 0.1, h * 0.06, 0.55);
  return s;
}
function puffArcTop(x, y, rx, ry) {
  return `M${r2(x - rx)},${r2(y + ry * 0.3)} Q${r2(x - rx * 0.7)},${r2(y + ry * 1.1)} ${r2(x - rx * 0.2)},${r2(y + ry * 0.75)} Q${r2(x + rx * 0.2)},${r2(y + ry * 1.25)} ${r2(x + rx * 0.6)},${r2(y + ry * 0.75)} Q${r2(x + rx)},${r2(y + ry * 0.9)} ${r2(x + rx * 0.95)},${r2(y + ry * 0.2)}`;
}

function mushroom(doc, x, by, s, cap, o = {}) {
  const cr = ramp(cap);
  let g = '';
  if (o.glow) g += glow(doc, x, by - s * 1.2, s * 2.6, o.glow, 0.75);
  g += shape(`M${x - s * 0.38},${by} Q${x - s * 0.45},${by - s * 0.8} ${x - s * 0.28},${by - s * 1.05} L${x + s * 0.28},${by - s * 1.05} Q${x + s * 0.45},${by - s * 0.8} ${x + s * 0.38},${by} Q${x},${by + s * 0.12} ${x - s * 0.38},${by}Z`, doc.linear([[0, PAL.white], [1, PAL.cream]], 0, 0, 1, 0), ramp(PAL.cream).line, LINE.sm);
  const cd = `M${x - s},${by - s * 0.95} C${x - s * 1.02},${by - s * 1.9} ${x + s * 1.02},${by - s * 1.9} ${x + s},${by - s * 0.95} Q${x},${by - s * 0.7} ${x - s},${by - s * 0.95}Z`;
  g += shape(cd, doc.sphere(cap, 1), cr.line, LINE.sm);
  if (o.dots !== false) {
    g += ellipse(x - s * 0.45, by - s * 1.3, s * 0.18, s * 0.13, o.dot || PAL.white, null);
    g += ellipse(x + s * 0.2, by - s * 1.55, s * 0.22, s * 0.15, o.dot || PAL.white, null);
    g += ellipse(x + s * 0.6, by - s * 1.15, s * 0.14, s * 0.1, o.dot || PAL.white, null);
  }
  g += gloss(x - s * 0.4, by - s * 1.55, s * 0.22, s * 0.1, 0.5);
  return g;
}

// ───────────── khai báo ─────────────
export function definePlants() {
  const P = (id, d, usage, draw, tags = [], fp = [1, 1]) => sprite({ id: `island-plant-${id}`, file: `island/plants/${id}.png`, ...d, usage, draw, footprint: fp, tags: ['plant', 'nature', 'placeable', ...tags] });

  P('bush-1', { w: 90, h: 70, ox: 45, oy: 64 }, 'Bụi cây tròn xanh lá', (doc, ox, oy) => bush(doc, ox, oy, 76, 56, PAL.leaf, 101));
  P('bush-2', { w: 90, h: 70, ox: 45, oy: 64 }, 'Bụi quả mọng (quả đỏ hồng)', (doc, ox, oy) => {
    let s = bush(doc, ox, oy, 80, 58, PAL.leafDark, 103);
    const R = rng(7);
    for (let i = 0; i < 9; i++) {
      const x = ox + (R() - 0.5) * 56, y = oy - 18 - R() * 30;
      s += circle(x, y, 4, doc.sphere('#e9557a'), ramp('#e9557a').line, LINE.xs) + circle(x - 1.2, y - 1.4, 1.2, '#fff', null, 0, 'opacity="0.8"');
    }
    return s;
  }, ['fruit']);
  P('bush-3', { w: 96, h: 74, ox: 48, oy: 68 }, 'Bụi hoa cẩm tú cầu (xanh lavender)', (doc, ox, oy) => {
    let s = bush(doc, ox, oy, 84, 58, PAL.leaf, 107);
    [[-22, -34, PAL.lavender], [8, -42, '#9ec9f0'], [26, -26, PAL.lavender], [-4, -22, '#b7a6ee'], [-30, -16, '#9ec9f0']].forEach(([dx, dy, c], i) => {
      const x = ox + dx, y = oy + dy;
      s += `<path d="${puffPath(x, y, 11, 9, 7, 0.22, i + 3)}" fill="${doc.sphere(c)}" stroke="${ramp(c).line}" stroke-width="${LINE.xs * 1.2}"/>`;
      for (let k = 0; k < 4; k++) s += circle(x - 5 + (k % 2) * 8, y - 3 + Math.floor(k / 2) * 6, 1.6, lighten(c, 0.5), null);
    });
    return s;
  }, ['flower']);

  const F = [
    ['flower-pink', PAL.pink, PAL.yellow, 'daisy', 'Cụm hoa cúc hồng'],
    ['flower-yellow', PAL.yellow, PAL.orangeDeep, 'round', 'Cụm hoa vàng'],
    ['flower-lavender', PAL.lavender, PAL.yellowLight, 'daisy', 'Cụm hoa tím lavender'],
    ['flower-white', PAL.white, PAL.yellow, 'daisy', 'Cụm hoa cúc trắng'],
    ['flower-tulip', '#f2626b', PAL.yellow, 'tulip', 'Cụm tulip đỏ-cam'],
    ['flower-blue', '#8cbdf0', PAL.white, 'bell', 'Cụm hoa chuông xanh'],
  ];
  F.forEach(([id, c, cc, kind, usage], i) => P(id, { w: 64, h: 60, ox: 32, oy: 54 }, usage, (doc, ox, oy) => flowerCluster(doc, ox, oy, c, cc, 200 + i, kind), ['flower']));

  const G = [[PAL.grass, 5], [PAL.grassDark, 7], [mix(PAL.grass, PAL.yellow, 0.25), 6]];
  G.forEach(([c, n], i) => P(`grass-${i + 1}`, { w: 50, h: 40, ox: 25, oy: 34 }, 'Khóm cỏ nhỏ (rải trang trí trên cỏ)', (doc, ox, oy) => {
    const R = rng(300 + i);
    const r = ramp(c);
    let s = groundOval(ox, oy, 16, 4);
    for (let k = 0; k < n; k++) {
      const t = k / (n - 1) - 0.5;
      s += blade(ox + t * 22, oy, 14 + R() * 10 - Math.abs(t) * 8, t * 12 + (R() - 0.5) * 4, 3.4, doc.vgrad(lighten(c, 0.1 * (k % 2))), r.line, LINE.xs * 1.2);
    }
    if (i === 2) s += circle(ox + 6, oy - 20, 3, PAL.white, ramp(PAL.white).line, LINE.xs) + circle(ox + 6, oy - 20, 1.2, PAL.yellow, null);
    return s;
  }, ['grass']));

  P('mushroom-red', { w: 56, h: 52, ox: 28, oy: 46 }, 'Nấm mũ đỏ chấm trắng', (doc, ox, oy) => groundOval(ox, oy - 1, 18, 5) + mushroom(doc, ox - 4, oy, 15, '#f26b6b') + mushroom(doc, ox + 14, oy + 1, 8, '#f26b6b'), ['mushroom']);
  P('mushroom-brown', { w: 60, h: 48, ox: 30, oy: 42 }, 'Cụm nấm nâu nhỏ', (doc, ox, oy) => groundOval(ox, oy - 1, 22, 5) + mushroom(doc, ox - 10, oy, 10, '#d5a06f', { dots: false }) + mushroom(doc, ox + 6, oy - 1, 13, '#c58a5c', { dot: PAL.cream }) + mushroom(doc, ox + 20, oy + 1, 7, '#d5a06f', { dots: false }), ['mushroom']);
  P('mushroom-glow', { w: 70, h: 64, ox: 35, oy: 54 }, 'Nấm phát sáng tím (ma thuật, đẹp vào ban đêm)', (doc, ox, oy) => groundOval(ox, oy - 1, 20, 5) + mushroom(doc, ox - 6, oy, 14, PAL.lavender, { glow: PAL.lavenderLight, dot: PAL.yellowLight }) + mushroom(doc, ox + 13, oy + 1, 8, '#a6e3f0', { glow: '#dff6ff', dot: '#fff' }) + sparkle(ox + 20, oy - 34, 4) + sparkle(ox - 24, oy - 26, 3, PAL.yellowLight), ['mushroom', 'magic']);

  P('hedge-long', { w: 140, h: 70, ox: 70, oy: 62 }, 'Hàng rào cây xén (dài 2 ô ngang)', (doc, ox, oy) => hedge(doc, ox, oy, 124, 46), ['hedge'], [2, 1]);
  P('hedge-small', { w: 76, h: 70, ox: 38, oy: 62 }, 'Khối cây xén nhỏ (1 ô)', (doc, ox, oy) => hedge(doc, ox, oy, 58, 44), ['hedge']);

  P('lilypad-1', { w: 60, h: 40, ox: 30, oy: 20 }, 'Lá súng có hoa (đặt trên mặt nước ao)', (doc, ox, oy) => lilypad(doc, ox, oy, 22, 13, 1) + flowerHead(doc, ox + 4, oy - 4, 8, PAL.pink, PAL.yellow, 6), ['water', 'ground']);
  P('lilypad-2', { w: 70, h: 44, ox: 35, oy: 22 }, 'Cụm 2 lá súng (đặt trên mặt nước)', (doc, ox, oy) => lilypad(doc, ox - 8, oy + 2, 18, 11, 2) + lilypad(doc, ox + 16, oy - 6, 11, 7, 3), ['water', 'ground']);
}

function groundOval(cx, cy, rx, ry) { return `<ellipse cx="${cx + 1}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${PAL.shadowSoft}"/>`; }

function hedge(doc, cx, by, w, h) {
  const c = PAL.leafDark, r = ramp(c);
  let s = baseShadow(cx, by - 2, w * 0.55, 10);
  // mặt trước + mặt trên (thấy từ trên)
  const topH = h * 0.42;
  const front = `M${cx - w / 2},${by - h + topH * 0.6} Q${cx - w / 2 - 2},${by} ${cx - w / 2 + 8},${by} L${cx + w / 2 - 8},${by} Q${cx + w / 2 + 2},${by} ${cx + w / 2},${by - h + topH * 0.6}Z`;
  s += shape(front, doc.vgrad(c, 0.8), r.line, LINE.md);
  const top = puffPath(cx, by - h + topH * 0.5, w / 2 + 2, topH * 0.62, Math.round(w / 12) + 4, 0.1, Math.round(w));
  s += shape(top, doc.linear([[0, lighten(c, 0.3)], [1, lighten(c, 0.08)]]), r.line, LINE.md);
  s += gloss(cx - w * 0.25, by - h + topH * 0.35, w * 0.12, topH * 0.12, 0.35, -5);
  const R = rng(w);
  for (let i = 0; i < w / 10; i++) s += leafMark(cx - w / 2 + 8 + R() * (w - 16), by - h + topH + 8 + R() * (h - topH - 14), 3, darken(c, 0.15), R() * 60 - 30);
  for (let i = 0; i < w / 14; i++) s += leafMark(cx - w / 2 + 10 + R() * (w - 20), by - h + topH * 0.3 + R() * topH * 0.4, 2.6, lighten(c, 0.5), R() * 60 - 30);
  return s;
}

function lilypad(doc, cx, cy, rx, ry, seed) {
  const c = PAL.leaf, r = ramp(c);
  const a = 0.4 + seed;
  const nx = Math.cos(a), ny = Math.sin(a);
  const d = `M${r2(cx)},${r2(cy)} L${r2(cx + nx * rx * 1.05)},${r2(cy + ny * ry * 1.05 - 3)} A${rx},${ry} 0 1 1 ${r2(cx + nx * rx * 0.95 + 4)},${r2(cy + ny * ry * 0.95 + 3)}Z`;
  let s = `<ellipse cx="${cx + 2}" cy="${cy + 3}" rx="${rx}" ry="${ry}" fill="${PAL.oceanDeep}" opacity="0.18"/>`;
  s += shape(d, doc.sphere(c, 0.7), r.line, LINE.sm);
  for (let k = 0; k < 5; k++) { const b = a + 0.9 + k * 1.0; s += stroke(`M${cx},${cy} L${r2(cx + Math.cos(b) * rx * 0.75)},${r2(cy + Math.sin(b) * ry * 0.75)}`, r.lo, LINE.xs, 'opacity="0.7"'); }
  s += gloss(cx - rx * 0.4, cy - ry * 0.4, rx * 0.25, ry * 0.15, 0.4, -10);
  return s;
}

// ───────────── Địa hình (island/terrain) ─────────────
const SOIL = '#b98a63';
export function plotSvg(doc, cx, by, state) {
  // luống 2×1 ô: 124×58, mặt đất nhìn từ trên + thành gỗ phía trước
  const W = 120, D = 50, F = 12;
  const x0 = cx - W / 2, top = by - F - D;
  let s = `<ellipse cx="${cx + 4}" cy="${by - 2}" rx="${W * 0.55}" ry="8" fill="${PAL.shadow}"/>`;
  // khung gỗ (mặt trên)
  s += rect(x0 - 6, top - 6, W + 12, D + 12, 9, doc.vgrad(PAL.woodLight), ramp(PAL.wood).line, LINE.md);
  // đất
  const soil = state === 'empty' ? SOIL : darken(SOIL, 0.05);
  s += rect(x0, top, W, D, 6, doc.linear([[0, darken(soil, 0.12)], [1, soil]]), ramp(SOIL).line, LINE.sm);
  // luống cày
  const rows = 3;
  for (let i = 0; i < rows; i++) {
    const y = top + 9 + i * 15;
    s += rect(x0 + 6, y, W - 12, 10, 5, lighten(soil, 0.12), null);
    s += stroke(`M${x0 + 9},${y + 9.5} L${x0 + W - 9},${y + 9.5}`, darken(soil, 0.22), LINE.xs * 1.2, 'opacity="0.8"');
  }
  // mặt trước khung
  s += rect(x0 - 6, by - F - 4, W + 12, F + 4, 5, doc.vgrad(PAL.wood), ramp(PAL.wood).line, LINE.md);
  s += stroke(`M${x0 + 30},${by - F + 2} l14,0 M${x0 + 76},${by - F + 4} l12,0`, ramp(PAL.wood).lo, LINE.xs);
  // cọc góc
  for (const x of [x0 - 6, x0 + W - 1]) s += rect(x, top - 10, 7, by - top + 8, 3, doc.vgrad(PAL.woodDark), ramp(PAL.woodDark).line, LINE.sm);
  if (state === 'sprout') {
    for (let i = 0; i < rows; i++) for (let k = 0; k < 5; k++) {
      const x = x0 + 16 + k * 22 + (i % 2) * 6, y = top + 15 + i * 15;
      s += stroke(`M${x},${y} l0,-5`, PAL.leafDark, LINE.sm);
      s += leafMark(x - 3.5, y - 7, 3.6, PAL.grass, -55) + leafMark(x + 3.5, y - 7, 3.6, PAL.leaf, 55);
    }
  } else if (state === 'growing') {
    const crops = ['#f28a4e', PAL.leaf, '#f2626b'];
    for (let i = 0; i < rows; i++) for (let k = 0; k < 4; k++) {
      const x = x0 + 18 + k * 28 + (i % 2) * 6, y = top + 16 + i * 15;
      if (i === 1) {
        // bắp cải
        s += circle(x, y - 5, 8, doc.sphere(PAL.mint), ramp(PAL.leaf).line, LINE.sm) + stroke(`M${x - 5},${y - 3} Q${x},${y - 12} ${x + 5},${y - 3}`, ramp(PAL.leaf).lo, LINE.xs);
      } else {
        // cà rốt/củ cải: lá xoè + đầu củ
        s += ellipse(x, y - 1, 5, 3, crops[i], ramp(crops[i]).line, LINE.xs);
        for (const a of [-35, 0, 35]) s += leaf(doc, x, y - 2, 13, 4, a, PAL.leaf, LINE.xs);
      }
    }
  }
  return s;
}

export function defineTerrain() {
  const T = (id, d, usage, draw, tags = [], fp = [1, 1], layer = 'object') => sprite({ id: `island-terrain-${id}`, file: `island/terrain/${id}.png`, ...d, usage, draw, footprint: fp, layer, tags: ['terrain', ...tags] });

  T('rock-1', { w: 40, h: 30, ox: 20, oy: 26 }, 'Đá nhỏ', (doc, ox, oy) => rock(doc, ox, oy, 28, 18, 11, { lw: LINE.sm }), ['rock', 'placeable']);
  T('rock-2', { w: 60, h: 46, ox: 30, oy: 40 }, 'Đá vừa', (doc, ox, oy) => rock(doc, ox, oy, 46, 30, 13), ['rock', 'placeable']);
  T('rock-3', { w: 96, h: 74, ox: 48, oy: 66 }, 'Tảng đá lớn (chặn lối, trang trí góc)', (doc, ox, oy) => rock(doc, ox - 6, oy, 70, 50, 17, { lw: LINE.lg }) + rock(doc, ox + 26, oy + 2, 30, 20, 19), ['rock', 'placeable'], [2, 1]);
  T('rock-mossy', { w: 76, h: 60, ox: 38, oy: 52 }, 'Đá phủ rêu xanh', (doc, ox, oy) => rock(doc, ox, oy, 58, 40, 23, { moss: true }), ['rock', 'placeable']);

  // ao (lớp mặt đất)
  T('pond', { w: 300, h: 190, ox: 150, oy: 95 }, 'Ao nhỏ có lá súng, cỏ nến và viền đá (lớp mặt đất, origin ở tâm; vẽ dưới vật đứng)', (doc, ox, oy) => pondSvg(doc, ox, oy, 128, 76, 5, true), ['water', 'ground'], [4, 3], 'ground');

  T('plot-empty', { w: 140, h: 82, ox: 70, oy: 74 }, 'Luống vườn 2×1 – đất đã xới, trống', (doc, ox, oy) => plotSvg(doc, ox, oy, 'empty'), ['garden', 'plot', 'placeable'], [2, 1]);
  T('plot-sprout', { w: 140, h: 82, ox: 70, oy: 74 }, 'Luống vườn 2×1 – mầm vừa nhú', (doc, ox, oy) => plotSvg(doc, ox, oy, 'sprout'), ['garden', 'plot'], [2, 1]);
  T('plot-growing', { w: 140, h: 90, ox: 70, oy: 82 }, 'Luống vườn 2×1 – rau đang lớn (cà rốt, bắp cải, củ cải)', (doc, ox, oy) => plotSvg(doc, ox, oy, 'growing'), ['garden', 'plot'], [2, 1]);

  // đường đi (decal mặt đất)
  T('path-stones', { w: 128, h: 64, ox: 64, oy: 32 }, 'Đá lát bước chân (decal mặt đất 2×1)', (doc, ox, oy) => {
    let s = '';
    [[-38, 4, 20, 12], [0, -6, 22, 13], [38, 5, 19, 11]].forEach(([dx, dy, rx, ry], i) => {
      s += `<ellipse cx="${ox + dx + 2}" cy="${oy + dy + 3}" rx="${rx}" ry="${ry}" fill="${PAL.shadowSoft}"/>`;
      s += pebble(doc, ox + dx, oy + dy, rx, ry, PAL.stoneLight, 40 + i);
    });
    return s;
  }, ['path', 'ground', 'placeable'], [2, 1], 'ground');
  T('path-straight', { w: 128, h: 64, ox: 64, oy: 32, fixed: true }, 'Đường đất thẳng (ngang, nối được 2 đầu; xoay 90° để đi dọc)', (doc, ox, oy) => dirtPath(doc, `M-10,${oy} L138,${oy}`, 7), ['path', 'ground', 'tile'], [2, 1], 'ground');
  T('path-curve', { w: 128, h: 128, ox: 64, oy: 64, fixed: true }, 'Đường đất cong 90° (vào từ trái, ra phía dưới)', (doc, ox, oy) => dirtPath(doc, `M-10,64 Q64,64 64,138`, 9), ['path', 'ground', 'tile'], [2, 2], 'ground');
  T('path-end', { w: 64, h: 64, ox: 32, oy: 32, fixed: true }, 'Đầu đường đất bo tròn (nối bên trái)', (doc, ox, oy) => dirtPath(doc, `M-30,${oy} L${ox - 4},${oy}`, 11, true), ['path', 'ground'], [1, 1], 'ground');

  T('sand-patch', { w: 170, h: 100, ox: 85, oy: 50 }, 'Mảng cát (decal) có vỏ sò nhỏ', (doc, ox, oy) => {
    const d = blob(ox, oy, 76, 40, 10, 0.12, 77);
    let s = shape(d, doc.radial([[0, PAL.sand], [0.8, PAL.sand], [1, PAL.sandDark]]), alpha(PAL.earthDark, 0.45), LINE.sm);
    const R = rng(78);
    for (let i = 0; i < 26; i++) s += circle(ox + (R() - 0.5) * 120, oy + (R() - 0.5) * 56, 1 + R(), i % 3 ? PAL.sandDark : PAL.white, null, 0, 'opacity="0.8"');
    s += shell(doc, ox + 30, oy + 8, 7, PAL.pink) + shell(doc, ox - 34, oy - 10, 5.5, PAL.peach);
    return s;
  }, ['sand', 'ground', 'placeable'], [3, 2], 'ground');

  T('meadow', { w: 220, h: 130, ox: 110, oy: 65 }, 'Thảm cỏ hoa dại (decal mặt đất, phủ lên cỏ)', (doc, ox, oy) => {
    const d = blob(ox, oy, 100, 54, 11, 0.14, 81);
    let s = `<path d="${d}" fill="${doc.radial([[0, PAL.grassLight, 0.9], [0.75, PAL.grassLight, 0.6], [1, PAL.grassLight, 0]])}"/>`;
    const R = rng(82);
    const cols = [PAL.white, PAL.pink, PAL.yellow, PAL.lavender, '#9ec9f0'];
    for (let i = 0; i < 46; i++) {
      const a = R() * Math.PI * 2, rr = Math.sqrt(R()) * 0.85;
      const x = ox + Math.cos(a) * 96 * rr, y = oy + Math.sin(a) * 50 * rr;
      if (i % 3 === 0) s += stroke(`M${r2(x - 3)},${r2(y + 2)} l2,-6 M${r2(x + 1)},${r2(y + 2)} l1,-7 M${r2(x + 4)},${r2(y + 2)} l-1,-5`, PAL.grassDark, LINE.xs);
      else {
        const c = cols[i % cols.length];
        for (let k = 0; k < 5; k++) { const b = k / 5 * Math.PI * 2; s += circle(x + Math.cos(b) * 2.4, y + Math.sin(b) * 2, 2, c, null); }
        s += circle(x, y, 1.3, PAL.yellow, null);
      }
    }
    return s;
  }, ['flower', 'ground', 'placeable'], [3, 2], 'ground');
}

export function shell(doc, x, y, s, c) {
  const r = ramp(c);
  let g = shape(`M${x - s},${y + s * 0.4} Q${x - s * 1.1},${y - s * 0.9} ${x},${y - s} Q${x + s * 1.1},${y - s * 0.9} ${x + s},${y + s * 0.4} Q${x},${y + s * 0.9} ${x - s},${y + s * 0.4}Z`, doc.vgrad(c), r.line, LINE.xs * 1.2);
  for (const k of [-0.5, 0, 0.5]) g += stroke(`M${x + k * s * 1.4},${y - s * 0.85} L${x + k * s * 0.4},${y + s * 0.5}`, r.lo, LINE.xs, 'opacity="0.8"');
  return g;
}

/** Đường đất: dải mềm có viền, sỏi nhỏ. path = đường trục. */
export function dirtPath(doc, d, seed, cap = false, width = 46) {
  const edge = '#d9b98a', fill = '#ecd3a4';
  const lc = cap ? 'round' : 'butt';
  const P = (col, w, extra = '') => `<path d="${d}" fill="none" stroke="${col}" stroke-width="${w}" stroke-linecap="${lc}" stroke-linejoin="round" ${extra}/>`;
  let s = P(alpha(PAL.earthDark, 0.3), width + 6);
  s += P(edge, width + 1);
  s += P(fill, width - 9);
  s += P(lighten(fill, 0.35), width * 0.42, 'opacity="0.5"');
  return s;
}

/** Ao: viền đá + nước + lá súng + cỏ nến. */
export function pondSvg(doc, cx, cy, rx, ry, seed, extras = true) {
  const R = rng(seed);
  const outer = blob(cx, cy, rx, ry, 10, 0.1, seed);
  const inner = blob(cx, cy + 2, rx * 0.88, ry * 0.84, 10, 0.08, seed);
  let s = '';
  s += shape(outer, doc.vgrad(PAL.sand), alpha(PAL.earthDark, 0.6), LINE.md);
  const water = doc.radial([[0, PAL.oceanDeep], [0.6, PAL.ocean], [1, PAL.oceanLight]], 0.5, 0.55, 0.6);
  s += shape(inner, water, '#3f86c2', LINE.md);
  const cl = doc.clip(`<path d="${inner}"/>`);
  let w = '';
  // mép trên bị bóng (nhìn 3/4: thành ao phía trên)
  w += `<path d="${blob(cx, cy - ry * 0.86, rx * 0.95, ry * 0.32, 9, 0.1, seed + 1)}" fill="${PAL.oceanAbyss}" opacity="0.35"/>`;
  for (let i = 0; i < 6; i++) {
    const x = cx + (R() - 0.5) * rx * 1.2, y = cy + (R() - 0.3) * ry * 0.9;
    w += stroke(`M${r2(x - 12)},${r2(y)} Q${r2(x)},${r2(y - 4)} ${r2(x + 12)},${r2(y)}`, PAL.foam, LINE.sm, 'opacity="0.55"');
  }
  w += `<ellipse cx="${cx - rx * 0.3}" cy="${cy + ry * 0.25}" rx="${rx * 0.3}" ry="${ry * 0.12}" fill="#fff" opacity="0.25"/>`;
  s += `<g clip-path="${cl}">${w}</g>`;
  // đá viền
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2 + R() * 0.3;
    if (Math.sin(a) < -0.2 && R() < 0.4) continue;
    const x = cx + Math.cos(a) * rx * 0.95, y = cy + Math.sin(a) * ry * 0.95;
    s += pebble(doc, x, y, 9 + R() * 6, 6 + R() * 3, i % 3 ? PAL.stone : PAL.stoneLight, i + seed);
  }
  if (extras) {
    s += lilypad(doc, cx + rx * 0.35, cy + ry * 0.1, 17, 10, 1) + flowerHead(doc, cx + rx * 0.38, cy + ry * 0.02, 7, PAL.pink, PAL.yellow, 6);
    s += lilypad(doc, cx - rx * 0.2, cy + ry * 0.35, 13, 8, 2) + lilypad(doc, cx + rx * 0.05, cy - ry * 0.25, 10, 6, 3);
    // cỏ nến (cattail) góc trái-sau
    const bx = cx - rx * 0.78, byy = cy - ry * 0.35;
    for (let k = 0; k < 5; k++) {
      const x = bx + k * 7 - 10, h = 34 + (k % 2) * 10;
      s += blade(x, byy + 6, h, (k - 2) * 4, 2.6, doc.vgrad(PAL.leaf), ramp(PAL.leaf).line, LINE.xs);
      if (k % 2 === 0) s += rect(x + (k - 2) * 3 - 3, byy + 6 - h * 0.85, 6, 14, 3, doc.vgrad('#a5704c'), ramp('#a5704c').line, LINE.xs);
    }
    s += blade(cx + rx * 0.82, cy - ry * 0.2, 24, 6, 2.6, PAL.leaf, ramp(PAL.leaf).line, LINE.xs) + blade(cx + rx * 0.9, cy - ry * 0.1, 18, 8, 2.4, PAL.grassDark, ramp(PAL.leaf).line, LINE.xs);
  }
  return s;
}
