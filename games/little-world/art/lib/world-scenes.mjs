// ── Little World: ảnh nền bên trong 6 vùng (1920×1080) ──
// Lớp: trời → xa → giữa → gần. Vùng giữa-dưới (x≈480–1440, y≈660–1000) để thoáng cho UI/mini-game.
import { Doc } from './style.mjs';
import {
  PAL, ramp, lighten, darken, mix, alpha, rng, smoothPath, blob, shape, stroke, circle, ellipse, rect, r2, g,
  painter, tree, pine, palm, bush, rock, flower, mushroom, house, fence, cloud, sparkle, wave, boat, mountain, groundShadow, gloss, puffPath, lantern,
} from './world-kit.mjs';
import * as LA from './world-landmarks-a.mjs';
import * as LB from './world-landmarks-b.mjs';
import { dice, pyramid, ball } from './world-map-detail.mjs';

const SW = 1920, SH = 1080;
const at = (body, x, y, s = 1, flip = false) => g(body, `translate(${x},${y}) scale(${flip ? -s : s},${s})`);

/** Dải đồi lượn sóng từ y xuống đáy. */
function hills(P, y, amp, col, seed, o = {}) {
  const R = rng(seed);
  const pts = [[-40, SH + 40]];
  const n = o.n || 7;
  for (let i = 0; i <= n; i++) pts.push([-40 + (SW + 80) * i / n, y + R.range(-amp, amp) * (i % 2 ? 1 : 0.4)]);
  pts.push([SW + 40, SH + 40]);
  const top = pts.slice(1, -1);
  const d = smoothPath(top, false) + ` L${SW + 40},${SH + 40} L-40,${SH + 40}Z`;
  const fill = o.fill || P.lin('hill' + col + seed, [[0, lighten(col, 0.15)], [0.5, col], [1, darken(col, 0.12)]]);
  return shape(d, fill, o.line ?? ramp(col).line, o.lw ?? 4);
}
function sky(P, top, bottom, o = {}) {
  let b = rect(0, 0, SW, SH, 0, P.lin('sky' + top, [[0, top], [0.75, bottom], [1, bottom]]), null);
  if (o.sun) b += circle(o.sun[0], o.sun[1], 260, P.glow(o.sunCol || PAL.yellowLight, 0.75), null) + circle(o.sun[0], o.sun[1], 70, P.sphere(o.sunCol || PAL.yellowLight), mix(PAL.yellow, PAL.orange, 0.4), 4);
  return b;
}
function clouds(P, list) { return list.map(([x, y, w, seed]) => cloud(P, x, y, w, { seed, n: 5 })).join(''); }
function stars(R, n, y1, col = '#ffffff') { let b = ''; for (let i = 0; i < n; i++) b += sparkle(R.range(20, SW - 20), R.range(20, y1), R.range(4, 10), col, R.range(0.6, 1)); return b; }
/** Khung tiền cảnh: bụi & hoa ở hai góc dưới */
function frameBushes(P, cols, seed, flowerCols = [PAL.pink, PAL.yellow, PAL.white]) {
  const R = rng(seed);
  let b = '';
  for (const side of [0, 1]) {
    for (let i = 0; i < 7; i++) {
      const x = side ? SW - R.range(0, 340) : R.range(0, 340), y = SH - R.range(-10, 140) + (side ? 0 : 0);
      const c = R.pick(cols);
      b += shape(puffPath(x, y, R.range(70, 120), R.range(50, 80), 7, 0.18, i + seed + side * 10), P.sphere(c), ramp(c).line, 4.5);
      b += gloss(x - 30, y - 30, 26, 10, 0.35);
    }
    for (let i = 0; i < 10; i++) b += flower(P, side ? SW - R.range(40, 420) : R.range(40, 420), SH - R.range(10, 120), R.range(2.2, 3), R.pick(flowerCols));
  }
  return b;
}
function groundTufts(P, R, n, y0, y1, col) {
  let b = '';
  for (let i = 0; i < n; i++) { const x = R.range(0, SW), y = R.range(y0, y1), s = 1 + (y - y0) / (y1 - y0); b += stroke(`M${r2(x - 7 * s)},${r2(y - 8 * s)} L${r2(x - 1)},${r2(y)} L${r2(x + 6 * s)},${r2(y - 10 * s)}`, col, 3 * s, 'opacity="0.6"'); }
  return b;
}
function pathBand(P, pts, w, edge = '#c99a62', fill = '#f1d6a1') {
  const d = smoothPath(pts, false);
  return stroke(d, PAL.shadowSoft, w + 16, 'transform="translate(4,8)"') + stroke(d, edge, w + 10) + stroke(d, fill, w) + stroke(d, lighten(fill, 0.3), w * 0.35, 'opacity="0.6"');
}

// Mỗi cảnh: back (trời, lớp xa) → ground (đồi/mặt đất, xa→gần) → objs (vật đứng, sắp theo y đế) → front (khung tiền cảnh)
function scene() {
  const L = { back: '', ground: '', objs: [], front: '' };
  return {
    back: (s) => { L.back += s; }, ground: (s) => { L.ground += s; }, obj: (y, s) => { L.objs.push([y, s]); }, front: (s) => { L.front += s; },
    toString: () => L.back + L.ground + L.objs.sort((a, b) => a[0] - b[0]).map((o) => o[1]).join('') + L.front,
  };
}

const SCENES = {
  'animal-island': (P) => {
    const R = rng(1), S = scene();
    S.back(sky(P, '#8fd3f4', '#e6f7fd', { sun: [1600, 170] }) + clouds(P, [[300, 160, 300, 1], [900, 110, 220, 2], [1350, 230, 260, 3]]));
    S.back(hills(P, 520, 40, '#a9dc8f', 3, { lw: 3 }));
    for (let i = 0; i < 22; i++) S.back(tree(P, R.range(20, 1900), 545 + R.range(-20, 30), R.range(1.3, 1.8), { color: R.pick(['#8fd16f', '#7cc96a', '#9fd67c']), seed: i, lw: 3.5 }));
    S.ground(hills(P, 660, 26, PAL.grass, 7, { lw: 4 }) + hills(P, 760, 14, '#a9df84', 11, { lw: 4, n: 5 }));
    S.ground(groundTufts(P, R, 120, 780, 1060, darken(PAL.grass, 0.12)));
    S.ground(pathBand(P, [[960, 1100], [920, 960], [1000, 860], [1180, 800], [1380, 770]], 70));
    S.obj(690, at(LA.waterfall(P), 1440, 690, 1.8));
    S.obj(800, at(LA.bigTree(P), 290, 800, 1.9));
    S.obj(790, at(LA.animalHouses(P), 1560, 790, 1.3));
    S.obj(700, at(LA.barn(P), 760, 690, 0.95));
    for (const [x, y] of [[700, 860], [1250, 900], [560, 960]]) S.obj(y, flower(P, x, y, 2.4, PAL.pink));
    S.front(frameBushes(P, [PAL.grassDark, '#5fb85f', PAL.leaf], 5));
    return S.toString();
  },
  'puzzle-forest': (P) => {
    const R = rng(2), S = scene();
    S.back(sky(P, '#7b74c9', '#e6d6f6') + stars(R, 40, 380));
    S.back(circle(1500, 170, 220, P.glow('#fff6d8', 0.5), null) + circle(1500, 170, 70, P.sphere('#fff6d8'), '#e8d6a8', 4));
    for (let i = 0; i < 22; i++) S.back(tree(P, i * 92 + R.range(-20, 20), 560 + R.range(-30, 20), R.range(2.2, 2.8), { color: R.pick(['#9d8fd8', '#8a9fe0', '#a99be0']), seed: i, lw: 3.5, noShadow: true }));
    S.back(hills(P, 560, 26, '#8fcdbe', 5, { lw: 3 }));
    for (let i = 0; i < 12; i++) S.back(pine(P, R.range(0, SW), 640 + R.range(-20, 20), R.range(2.2, 2.8), { color: R.pick(['#6fc3b2', '#7fb0e8', '#a58ae0']) }));
    S.ground(hills(P, 690, 18, '#9fd6c3', 9, { lw: 4 }) + hills(P, 790, 12, '#b2e0c8', 13, { lw: 4, n: 5 }));
    S.ground(groundTufts(P, R, 100, 800, 1060, '#7fbfa8'));
    S.ground(pathBand(P, [[900, 1100], [960, 960], [1060, 860], [1150, 760]], 80, '#a98fc8', '#e6dcfb'));
    S.obj(860, at(LA.magicTree(P), 300, 860, 2));
    S.obj(820, at(LA.jigsawArch(P), 1600, 820, 1.7));
    S.obj(720, at(LA.mushroomCluster(P), 1200, 720, 1.1));
    S.obj(720, at(LA.runeStones(P), 660, 720, 0.9));
    for (let i = 0; i < 14; i++) { const x = R.range(100, 1820), y = R.range(420, 1000); S.front(circle(x, y, 18, P.glow(R.pick([PAL.yellowLight, '#c9fff0', PAL.lavenderLight]), 0.85), null) + circle(x, y, 4, '#ffffff', null)); }
    S.front(frameBushes(P, ['#8f9de8', '#6fc3b2', '#a58ae0'], 7, [PAL.yellowLight, PAL.pink, '#9be6d8']));
    S.front(mushroom(P, 120, 1040, 3, { cap: PAL.coral, glow: PAL.yellowLight }) + mushroom(P, 1800, 1030, 2.6, { cap: '#58b4e8', glow: PAL.lavenderLight }));
    return S.toString();
  },
  'creative-town': (P) => {
    const R = rng(3), S = scene();
    S.back(sky(P, '#9fd8f6', '#fde7ef', { sun: [300, 160] }) + clouds(P, [[800, 140, 260, 4], [1500, 100, 300, 5]]));
    S.back(hills(P, 560, 16, '#d9ecc0', 4, { lw: 3 }));
    const walls = [PAL.pinkLight, '#d7f0ff', PAL.yellowLight, '#e4f6d6', PAL.lavenderLight, '#ffe3cf'], roofs = [PAL.rose, PAL.purple, '#58b4e8', PAL.orangeDeep, '#6cc46a', PAL.coral];
    for (let i = 0; i < 16; i++) S.back(house(P, 60 + i * 120 + R.range(-16, 16), 600 + R.range(-6, 10), R.range(2.2, 2.7), { wall: walls[i % 6], roof: roofs[(i * 5) % 6], roofStyle: i % 3 === 0 ? 'round' : 'gable', chimney: i % 2 === 0, lw: 3.5 }));
    S.ground(hills(P, 680, 10, '#c8e6a8', 6, { lw: 4 }));
    S.ground(ellipse(960, 990, 720, 270, '#e5a9b2', null) + ellipse(960, 985, 710, 260, P.lin('plaza', [[0, '#ffe6e6'], [1, '#f6c9cf']]), null));
    for (let i = 0; i < 90; i++) { const a = R() * Math.PI * 2, k = Math.sqrt(R()); S.ground(rect(960 + Math.cos(a) * 630 * k - 14, 985 + Math.sin(a) * 220 * k - 7, 28, 14, 5, alpha('#e9a9b3', 0.45), null)); }
    S.obj(690, at(LB.crane(P), 1180, 690, 1.25));
    S.obj(700, at(LB.workshop(P), 760, 700, 1.0));
    S.obj(830, at(LB.artStudio(P), 330, 830, 1.8));
    S.obj(830, at(LB.townHouses(P), 1590, 830, 1.55));
    S.front(frameBushes(P, ['#8fd16f', '#f7a9c0', PAL.leaf], 9, [PAL.pink, PAL.yellow, PAL.lavender]));
    return S.toString();
  },
  'math-mountain': (P) => {
    const R = rng(4), S = scene();
    S.back(sky(P, '#a8dcf7', '#fff0dc', { sun: [1680, 180], sunCol: '#fff3c4' }) + clouds(P, [[420, 150, 280, 6], [1150, 90, 220, 7]]));
    S.back(mountain(P, 300, 620, 760, 440, { color: '#e6c9e8', seed: 1, lw: 4, noShadow: true }) + mountain(P, 1650, 620, 820, 480, { color: '#e6c9e8', seed: 2, lw: 4, noShadow: true }));
    S.back(mountain(P, 960, 650, 900, 560, { color: '#ffc39a', seed: 3, lw: 5, skew: 0, noShadow: true }));
    S.back(mountain(P, 560, 680, 520, 300, { color: '#ffd2b0', seed: 4, lw: 4.5, noShadow: true, snow: false }) + mountain(P, 1420, 690, 560, 320, { color: '#ffb889', seed: 5, lw: 4.5, noShadow: true, snow: false }));
    S.back(at(LA.floatingBlocks(P), 1560, 560, 1.4));
    S.ground(hills(P, 660, 22, '#cfe79a', 8, { lw: 4 }) + hills(P, 790, 10, '#f7d8a8', 10, { lw: 4, n: 5 }));
    for (let i = 0; i < 12; i++) { const x = R.range(0, SW), y = 690 + R.range(-16, 16); S.obj(y, pine(P, x, y, R.range(1.8, 2.3), { color: R.pick([PAL.leafDark, '#5fae6a']) })); }
    const sd = 'M780,795 Q900,860 840,940 Q780,1020 900,1100 L1060,1100 Q940,1020 1000,940 Q1060,860 900,795Z';
    S.ground(shape(sd, P.lin('stream', [[0, PAL.oceanLight], [1, PAL.ocean]]), PAL.oceanDeep, 4) + stroke('M850,820 Q940,870 900,940 Q860,1020 970,1090', '#e6fbff', 4, 'stroke-dasharray="20 30"'));
    S.ground(groundTufts(P, R, 80, 800, 1060, '#e2b27a'));
    S.obj(860, at(LA.diceTower(P), 260, 860, 1.8));
    S.obj(860, at(LA.fruitGarden(P), 1620, 860, 1.5));
    for (const [x, y, k] of [[560, 960, 0], [1340, 980, 1], [640, 1040, 2], [1250, 880, 1]]) S.obj(y, k === 0 ? dice(P, x, y, 26, PAL.white) : k === 1 ? pyramid(P, x, y, 30, PAL.yellow) : ball(P, x, y, 22, '#58b4e8'));
    S.front(frameBushes(P, [PAL.leaf, '#8fd16f', PAL.grassDark], 11, [PAL.orange, PAL.yellow, PAL.white]));
    return S.toString();
  },
  'life-skills-village': (P) => {
    const R = rng(5), S = scene();
    S.back(sky(P, '#a8dcf7', '#fff4d6', { sun: [260, 170] }) + clouds(P, [[900, 130, 260, 8], [1600, 170, 300, 9]]));
    S.back(hills(P, 540, 30, '#c9e59a', 12, { lw: 3 }));
    for (let i = 0; i < 6; i++) { const x = 160 + i * 320, y = 600 + (i % 2) * 14, c = i % 2 ? '#f6d56a' : '#b7dd7c'; S.back(rect(x - 140, y - 24, 280, 48, 18, P.vgrad(c, 0.5), darken(c, 0.3), 3) + stroke(`M${x - 120},${y} L${x + 120},${y}`, darken(c, 0.15), 3)); }
    for (let i = 0; i < 8; i++) S.back(house(P, 120 + i * 240 + R.range(-30, 30), 566 + R.range(-10, 6), 1.7, { wall: PAL.cream, roof: R.pick([PAL.orangeDeep, PAL.coral, '#e8a24f']), chimney: true, lw: 3 }));
    S.ground(hills(P, 660, 16, PAL.grass, 13, { lw: 4 }) + hills(P, 780, 10, '#b5e38c', 14, { lw: 4, n: 5 }));
    S.ground(groundTufts(P, R, 110, 790, 1060, darken(PAL.grass, 0.12)));
    S.ground(pathBand(P, [[700, 1100], [820, 960], [1040, 850], [1080, 720]], 76));
    S.obj(830, at(LB.school(P), 360, 830, 1.65));
    S.obj(810, at(LB.grocery(P), 1560, 810, 1.55));
    S.obj(700, at(LB.kitchen(P), 1100, 700, 1.0));
    S.obj(700, at(LB.playground(P), 720, 700, 0.9));
    for (let i = 0; i < 6; i++) { const x = [1240, 1330, 1800, 1880, 560, 620][i], y = [740, 760, 760, 740, 750, 770][i]; S.obj(y, tree(P, x, y, 2, { color: i % 2 ? PAL.leaf : '#8fd16f', fruit: i % 3 ? PAL.coral : PAL.orange, seed: i, lw: 3.5 })); }
    S.obj(920, fence(P, 40, 900, 360, 920, 2.2));
    S.front(frameBushes(P, [PAL.grassDark, PAL.leaf, '#8fd16f'], 13));
    return S.toString();
  },
  'adventure-ocean': (P) => {
    const R = rng(6), S = scene();
    S.back(sky(P, '#7fcdf2', '#e8f8fd', { sun: [1500, 180] }) + clouds(P, [[360, 150, 280, 10], [1000, 100, 220, 11], [1750, 260, 200, 12]]));
    S.back(rect(0, 500, SW, 600, 0, P.lin('sea', [[0, '#8fd6f0'], [0.5, PAL.ocean], [1, PAL.oceanDeep]]), null) + stroke('M0,500 L1920,500', '#e6fbff', 4));
    for (let i = 0; i < 60; i++) S.back(wave(R.range(0, SW), R.range(520, 860), R.range(30, 60), '#ffffff', 3.5, R.range(0.4, 0.8)));
    S.ground(shape(blob(420, 600, 230, 50, 9, 0.1, 3), P.vgrad(PAL.sand), '#d6a86e', 4) + shape(blob(420, 590, 190, 36, 9, 0.1, 4), P.vgrad(PAL.grass), PAL.grassDark, 4));
    S.obj(650, at(LB.seaCave(P), 1560, 650, 1.5));
    S.obj(600, at(LB.palmHut(P), 420, 600, 1.2));
    S.obj(640, at(LB.submarineDock(P), 1000, 640, 1.1));
    S.obj(560, boat(P, 760, 560, 1.4));
    S.obj(840, at(LB.coralReef(P), 960, 850, 1.5));
    S.front(hills(P, 935, 16, PAL.sand, 15, { lw: 4, n: 5, line: '#d6a86e' }));
    S.front(stroke(smoothPath([[0, 930], [480, 920], [960, 935], [1440, 917], [1920, 931]], false), PAL.foam, 14, 'opacity="0.9"'));
    for (const [x, y, c] of [[300, 1010, PAL.coral], [1650, 1000, PAL.pink], [1500, 1050, PAL.yellow], [420, 1060, PAL.lavender]]) S.front(shape(`M${x - 18},${y} Q${x - 20},${y - 30} ${x},${y - 32} Q${x + 20},${y - 30} ${x + 18},${y}Z`, P.vgrad(c), ramp(c).line, 3) + stroke(`M${x},${y - 2} L${x},${y - 28} M${x - 9},${y - 2} L${x - 5},${y - 26} M${x + 9},${y - 2} L${x + 5},${y - 26}`, ramp(c).lo, 2));
    S.front(palm(P, 120, 1060, 3.2, { lean: 1 }) + palm(P, 1820, 1070, 3, { lean: -1 }));
    return S.toString();
  },
};

export function renderScene(id) {
  const doc = new Doc(SW, SH, { prefix: 'sc' + id.slice(0, 6) });
  const P = painter(doc);
  return { doc, body: SCENES[id](P) };
}
