// ── Mốc vùng (phần A): Đảo Động Vật, Rừng Câu Đố, Núi Toán Học ──
// Mỗi hàm vẽ trong toạ độ cục bộ: ĐẾ của mốc tại (0,0), y âm hướng lên.
import {
  PAL, ramp, lighten, darken, mix, alpha, rng, smoothPath, blob, shape, stroke, circle, ellipse, rect, r2, g,
  tree, pine, bush, rock, flower, mushroom, house, fence, mountain, sparkle, wave, groundShadow, gloss, puffPath,
  win, door, gableRoof, bunting, lantern, mist,
} from './world-kit.mjs';
import { dice, pyramid, ball } from './world-map-detail.mjs';

const LW = 3; // viền chuẩn cho mốc trên bản đồ

/** Ao/nước nông nhìn từ trên xuống */
export function pond(P, x, y, rx, ry, seed = 3) {
  const d = blob(x, y, rx, ry, 9, 0.08, seed);
  return `<path d="${d}" fill="${PAL.sand}" stroke="#d6a86e" stroke-width="${r2(Math.max(14, rx * 0.2) + 6)}" stroke-linejoin="round"/><path d="${d}" fill="${PAL.sand}" stroke="${PAL.sand}" stroke-width="${r2(Math.max(14, rx * 0.2))}" stroke-linejoin="round"/>` +
    `<path d="${d}" fill="${P.rad('pond', [[0, '#d2f4fa'], [0.55, PAL.oceanLight], [1, PAL.ocean]], 0.4, 0.35, 0.7)}" stroke="${PAL.oceanDeep}" stroke-width="3"/>`;
}

// ═══════════════════════ ĐẢO ĐỘNG VẬT ═══════════════════════
export function waterfall(P) {
  const st = '#c8bdd9', S = ramp(st);
  let b = '';
  b += groundShadow(10, -4, 150, 26);
  // vách đá
  const cliff = `M-138,-18 C-152,-110 -132,-190 -70,-210 L70,-212 C128,-196 152,-110 138,-18 Q0,4 -138,-18Z`;
  b += shape(cliff, P.lin('cliff', [[0, lighten(st, 0.3)], [0.5, st], [1, mix(st, PAL.purple, 0.25)]], 0, 0, 0.4, 1), S.line, LW + 1);
  // khối đá & gờ
  for (const [x, y, rx, ry, sd] of [[-95, -60, 34, 26, 1], [-60, -140, 30, 22, 2], [95, -70, 30, 26, 3], [70, -150, 26, 20, 4], [-110, -120, 22, 30, 5], [115, -125, 20, 26, 6]]) {
    b += shape(blob(x, y, rx, ry, 7, 0.14, sd), P.vgrad(lighten(st, 0.12)), S.line, LW * 0.7);
    b += gloss(x - rx * 0.3, y - ry * 0.4, rx * 0.3, ry * 0.15, 0.35);
  }
  // nắp cỏ trên đỉnh + rêu rủ
  b += shape(puffPath(0, -212, 150, 34, 11, 0.12, 7), P.vgrad(PAL.grass), ramp(PAL.grass).line, LW);
  for (const [x, l] of [[-120, 26], [-84, 18], [-48, 30], [52, 24], [92, 32], [124, 18]]) b += shape(`M${x - 9},-190 Q${x - 10},${-190 + l} ${x},${-190 + l + 4} Q${x + 10},${-190 + l} ${x + 9},-190Z`, PAL.grass, ramp(PAL.grass).line, LW * 0.6);
  // cây trên đỉnh
  b += tree(P, -100, -222, 1.15, { color: PAL.leaf, seed: 4 }) + pine(P, -62, -228, 1.05, { color: PAL.leafDark }) + tree(P, 98, -220, 1.05, { color: '#8fd16f', seed: 8, fruit: PAL.coral }) + bush(P, 62, -214, 0.9, { flower: PAL.pink });
  // ao dưới chân thác
  b += pond(P, 0, -4, 110, 30, 9);
  // dòng thác
  b += shape(`M-30,-214 Q-34,-222 -20,-224 L20,-224 Q34,-222 30,-214 L34,-24 Q0,-12 -34,-24Z`, P.lin('fall', [[0, '#f4fdff'], [0.4, '#bfeefa'], [1, '#8fd6f0']], 0, 0, 0, 1), PAL.oceanDeep, LW * 0.8);
  for (const [x, y1, y2] of [[-18, -210, -60], [-4, -200, -110], [10, -214, -40], [22, -190, -90], [-24, -150, -30]]) b += stroke(`M${x},${y1} L${x + (x > 0 ? 1 : -1)},${y2}`, '#ffffff', 3.2, 'opacity="0.85"');
  // bọt & hơi nước
  for (const [x, y, r] of [[-30, -22, 16], [0, -16, 20], [30, -22, 15], [-50, -12, 10], [50, -12, 11]]) b += circle(x, y, r, '#ffffff', ramp(PAL.foam).line, 1.4, 'opacity="0.95"');
  b += mist(P, 0, -40, 70, 0.55);
  b += wave(-70, 6, 22, '#ffffff', 2.4) + wave(68, 10, 20, '#ffffff', 2.4);
  // cầu vồng nhỏ
  const rb = ['#ff9a9a', '#ffc58a', '#ffe58a', '#a9e39a', '#9cd2f5', '#c3b0f2'];
  rb.forEach((c, i) => { b += stroke(`M${40 + i * 5},-30 A${70 - i * 5},${78 - i * 5} 0 0 1 ${180 - i * 5 - 40},-30`, c, 5, 'opacity="0.75"'); });
  // đá & lau sậy quanh ao
  b += rock(P, -112, 10, 1.1, { seed: 3 }) + rock(P, 104, 14, 0.9, { seed: 6 }) + flower(P, -84, 18, 1.1, PAL.yellow) + flower(P, 88, 22, 1.1, PAL.pink);
  return b;
}

export function bigTree(P) {
  const T = ramp(PAL.wood);
  let b = groundShadow(10, -2, 100, 24);
  // rễ & thân
  b += shape(`M-58,0 Q-30,-6 -26,-30 L-22,-120 Q-50,-140 -70,-150 L-60,-160 Q-30,-150 -12,-136 L12,-136 Q34,-156 66,-166 L74,-156 Q44,-142 24,-120 L28,-30 Q32,-6 62,0 Q40,6 22,-2 Q0,8 -22,-2 Q-40,6 -58,0Z`, P.lin('trunk', [[0, lighten(PAL.wood, 0.25)], [0.6, PAL.wood], [1, darken(PAL.wood, 0.2)]], 0, 0, 1, 0), T.line, LW + 0.5);
  b += stroke('M-6,-120 Q-12,-80 -4,-40 M12,-110 Q18,-70 10,-36', T.lo, 2.4);
  b += door(P, 0, -4, 26, 40, PAL.coral, LW * 0.8) + win(-20, -96, 14, 14, 2, { lit: true });
  // tán lớn
  const L = ramp(PAL.leaf);
  for (const [x, y, rx, ry, c, sd] of [[-62, -170, 56, 46, '#6fbf5f', 1], [66, -176, 54, 44, '#6fbf5f', 2], [0, -214, 82, 58, PAL.leaf, 3], [-50, -232, 48, 36, '#8fd16f', 4], [48, -236, 50, 36, '#8fd16f', 5]]) {
    b += shape(puffPath(x, y, rx, ry, 8, 0.15, sd), P.sphere(c), L.line, LW);
    b += gloss(x - rx * 0.35, y - ry * 0.4, rx * 0.3, ry * 0.15, 0.4);
  }
  // táo
  for (const [x, y] of [[-70, -160], [-30, -200], [20, -226], [64, -170], [86, -190], [-58, -238], [40, -248]]) b += circle(x, y, 5.5, P.sphere(PAL.coral), ramp(PAL.coral).line, 1.6);
  // nhà trên cây
  b += rect(26, -140, 92, 10, 4, P.vgrad(PAL.woodLight), ramp(PAL.woodLight).line, LW * 0.8);
  b += stroke('M40,-130 L54,-104 M104,-130 L90,-104', T.line, 4) + stroke('M40,-130 L54,-104 M104,-130 L90,-104', PAL.wood, 2);
  b += rect(44, -186, 56, 46, 5, P.vgrad(PAL.cream), ramp(PAL.cream).line, LW * 0.8) + win(52, -176, 14, 14, 2, { lit: true }) + door(P, 86, -140, 16, 26, PAL.wood, 2);
  b += gableRoof(P, 44, -186, 56, 30, PAL.rose, LW * 0.8, 8);
  b += bunting(30, -150, 116, -150, 2, undefined, 1.4);
  // thang dây
  b += stroke('M30,-130 L36,-4 M46,-130 L52,-4', T.line, 3.2);
  for (let y = -118; y < -8; y += 14) b += stroke(`M${32 + (y + 130) * 0.05},${y} L${48 + (y + 130) * 0.05},${y}`, PAL.woodLight, 3);
  // xích đu lốp xe
  b += stroke('M-74,-152 L-78,-58', PAL.woodDark, 2) + ellipse(-78, -50, 13, 9, 'none', '#7a6a8a', 5);
  b += flower(P, -40, 16, 1.2, PAL.pink) + flower(P, 60, 18, 1.2, PAL.yellow) + bush(P, -88, 12, 0.9, {});
  return b;
}

export function animalHouses(P) {
  let b = groundShadow(0, -2, 140, 18);
  // hang thỏ: gò đất có cửa tròn, cà rốt
  b += groundShadow(-100, 0, 50, 12) + shape('M-150,0 Q-152,-70 -100,-76 Q-48,-70 -50,0 Q-100,8 -150,0Z', P.sphere(PAL.grass), ramp(PAL.grass).line, LW);
  b += ellipse(-100, -24, 18, 22, PAL.soilDark, ramp(PAL.soil).line, LW * 0.8) + ellipse(-100, -20, 13, 15, '#5a3f36', null);
  b += stroke('M-78,-60 L-74,-36', PAL.orangeDeep, 6) + shape('M-78,-60 Q-86,-70 -80,-74 Q-76,-68 -78,-60 Q-70,-70 -66,-66 Q-70,-60 -78,-60Z', PAL.leaf, PAL.leafDark, 1.4);
  b += flower(P, -134, -4, 1.1, PAL.white) + flower(P, -62, -2, 1.1, PAL.yellow);
  // nhà gấu (nhà gỗ tròn)
  b += groundShadow(10, 0, 60, 14);
  b += rect(-40, -66, 100, 66, 8, P.vgrad(PAL.woodLight), ramp(PAL.woodLight).line, LW);
  for (let y = -54; y < -4; y += 13) b += stroke(`M-36,${y} L56,${y}`, ramp(PAL.woodLight).lo, 2.2);
  b += door(P, 10, 0, 24, 40, PAL.woodDark, LW * 0.8) + win(-30, -48, 16, 16, 2, { lit: true }) + win(34, -48, 16, 16, 2, { lit: true });
  b += gableRoof(P, -40, -66, 100, 46, PAL.orangeDeep, LW, 10);
  b += rect(28, -122, 12, 26, 3, PAL.stoneDark, ramp(PAL.stoneDark).line, 2) + circle(36, -132, 7, '#ffffff', null, 0, 'opacity="0.7"') + circle(44, -144, 9, '#ffffff', null, 0, 'opacity="0.5"');
  // tai gấu trên mái (biểu tượng)
  b += circle(-8, -100, 7, PAL.soil, ramp(PAL.soil).line, 2) + circle(28, -100, 7, PAL.soil, ramp(PAL.soil).line, 2);
  // chuồng chim trên cột
  b += rect(106, -82, 6, 82, 2, PAL.wood, ramp(PAL.wood).line, 2) + groundShadow(112, 0, 18, 5);
  b += rect(90, -118, 38, 36, 6, P.vgrad(PAL.yellowLight), ramp(PAL.yellow).line, LW * 0.8) + circle(109, -100, 7, '#6b4d5c', ramp(PAL.yellow).line, 1.6) + rect(104, -88, 10, 3, 1, PAL.woodDark, null);
  b += gableRoof(P, 90, -118, 38, 22, '#58b4e8', LW * 0.8, 6);
  // chú chim nhỏ
  b += ellipse(130, -136, 8, 6, P.sphere(PAL.coral), ramp(PAL.coral).line, 1.6) + circle(134, -139, 1.4, PAL.ink, null) + shape('M138,-137 L143,-136 L138,-134Z', PAL.yellow, null, 0);
  // máng nước & hàng rào
  b += fence(P, -150, 18, -40, 22, 1) + fence(P, 60, 22, 140, 18, 1);
  return b;
}

export function barn(P) {
  const red = '#f27a6e', R = ramp(red);
  let b = groundShadow(0, -2, 110, 20);
  // tháp silo
  b += rect(52, -130, 46, 130, 14, P.lin('silo', [[0, lighten(PAL.stone, 0.3)], [0.5, PAL.stoneLight], [1, PAL.stone]], 0, 0, 1, 0), ramp(PAL.stone).line, LW);
  for (let y = -110; y < -6; y += 18) b += stroke(`M54,${y} L96,${y}`, ramp(PAL.stone).lo, 1.8);
  b += shape('M48,-128 Q75,-170 102,-128Z', P.sphere('#58b4e8'), ramp('#58b4e8').line, LW);
  // chuồng chính
  b += shape('M-80,0 L-80,-80 L-30,-118 L20,-80 L20,0Z', P.vgrad(red), R.line, LW);
  b += shape('M-92,-74 L-30,-126 L32,-74 L24,-66 L-30,-110 L-84,-66Z', P.vgrad(PAL.white), ramp(PAL.cream).line, LW * 0.8);
  b += rect(-54, -54, 48, 54, 4, P.vgrad(darken(red, 0.1)), R.line, LW * 0.8);
  b += stroke('M-54,-54 L-6,0 M-6,-54 L-54,0', PAL.white, 5) + rect(-54, -54, 48, 54, 4, 'none', PAL.white, 3);
  b += win(-38, -94, 16, 14, 2, {});
  // cỏ khô & gà
  b += shape('M-96,6 Q-98,-22 -78,-24 Q-60,-22 -60,6Z', P.vgrad('#f2c75c'), ramp('#f2c75c').line, 2.4);
  for (const [x, y] of [[0, 16], [24, 22]]) b += ellipse(x, y - 8, 9, 8, P.sphere(PAL.white), ramp(PAL.cream).line, 1.6) + circle(x + 6, y - 15, 4.5, P.sphere(PAL.white), ramp(PAL.cream).line, 1.4) + shape(`M${x + 9},${y - 21} l3,-4 l2,4Z`, PAL.coral, null, 0) + shape(`M${x + 10},${y - 15} l5,1 l-5,2Z`, PAL.yellow, null, 0) + circle(x + 7, y - 16, 1, PAL.ink, null);
  b += fence(P, -100, 24, -20, 28, 1) + fence(P, 40, 28, 104, 22, 1);
  return b;
}

// ═══════════════════════ RỪNG CÂU ĐỐ ═══════════════════════
export function magicTree(P) {
  let b = circle(0, -160, 150, P.glow('#d9ccff', 0.6), null);
  b += groundShadow(8, -2, 100, 22);
  const T = ramp('#8b6b8f');
  // thân xoắn
  b += shape('M-54,0 Q-24,-8 -20,-40 Q-30,-90 -10,-130 Q-40,-150 -76,-152 L-70,-164 Q-30,-160 -2,-146 L10,-146 Q40,-170 74,-168 L76,-156 Q40,-150 22,-130 Q34,-80 22,-40 Q24,-8 56,0 Q30,8 0,0 Q-30,8 -54,0Z', P.lin('mtrunk', [[0, '#b597b5'], [0.6, '#8b6b8f'], [1, '#6c5276']], 0, 0, 1, 0), T.line, LW + 0.5);
  b += stroke('M-8,-128 Q-16,-90 -4,-44 M10,-120 Q16,-80 8,-40', T.lo, 2.4);
  b += door(P, 0, -6, 26, 42, PAL.purple, LW * 0.8);
  b += circle(0, -64, 10, P.glow(PAL.yellowLight, 0.9), null) + win(-6, -82, 12, 12, 2, { lit: true, arch: true });
  // tán nhiều màu
  const tiers = [[-80, -176, 56, 44, '#8f9de8', 1], [84, -180, 54, 42, '#6fc3b2', 2], [0, -214, 92, 60, '#a58ae0', 3], [-52, -250, 54, 40, '#b58de0', 4], [56, -252, 52, 40, '#7fb0e8', 5], [0, -278, 46, 30, '#c3a8f0', 6]];
  for (const [x, y, rx, ry, c, sd] of tiers) {
    b += shape(puffPath(x, y, rx, ry, 8, 0.16, sd), P.sphere(c), ramp(c).line, LW);
    b += gloss(x - rx * 0.35, y - ry * 0.42, rx * 0.3, ry * 0.15, 0.45);
  }
  // quả sáng & đèn lồng
  for (const [x, y] of [[-60, -200], [-20, -240], [30, -206], [70, -236], [96, -178], [-96, -172], [10, -280]]) b += circle(x, y, 9, P.glow(PAL.yellowLight, 0.9), null) + circle(x, y, 4, '#fffbe0', '#e8c25c', 1.2);
  b += stroke('M-76,-152 L-78,-130', PAL.woodDark, 1.4) + lantern(P, -78, -120, PAL.yellow) + stroke('M74,-158 L76,-136', PAL.woodDark, 1.4) + lantern(P, 76, -126, PAL.pink);
  for (const [x, y, r] of [[-120, -230, 9], [118, -260, 8], [-30, -310, 7], [130, -130, 6], [-130, -100, 7], [40, -300, 6]]) b += sparkle(x, y, r, '#ffffff', 0.95);
  b += mushroom(P, -70, 12, 1.1, { cap: PAL.coral, glow: PAL.yellowLight }) + mushroom(P, 74, 14, 0.9, { cap: '#58b4e8', glow: PAL.lavenderLight });
  return b;
}

export function mushroomCluster(P) {
  let b = groundShadow(0, -2, 110, 20);
  const big = (x, y, s, cap, dots = PAL.white, doorOn = false) => {
    const C = ramp(cap);
    let m = circle(x, y - 80 * s, 80 * s, P.glow(lighten(cap, 0.4), 0.45), null);
    m += groundShadow(x + 6 * s, y, 34 * s, 9 * s);
    m += shape(`M${x - 22 * s},${y} Q${x - 26 * s},${y - 40 * s} ${x - 18 * s},${y - 70 * s} L${x + 18 * s},${y - 70 * s} Q${x + 26 * s},${y - 40 * s} ${x + 22 * s},${y} Q${x},${y + 6 * s} ${x - 22 * s},${y}Z`, P.lin('stem', [[0, '#fffaf0'], [0.6, PAL.cream], [1, '#ead6c0']], 0, 0, 1, 0), ramp(PAL.cream).line, LW);
    if (doorOn) m += door(P, x, y - 2, 18 * s, 30 * s, PAL.wood, LW * 0.8) + win(x - 5 * s, y - 56 * s, 10 * s, 10 * s, 1.8, { lit: true, arch: true });
    const ty = y - 66 * s, W = 58 * s, Hh = 54 * s;
    m += shape(`M${x - W},${ty} Q${x - W - 4 * s},${ty - Hh} ${x},${ty - Hh * 1.05} Q${x + W + 4 * s},${ty - Hh} ${x + W},${ty} Q${x + W * 0.5},${ty + 14 * s} ${x},${ty + 10 * s} Q${x - W * 0.5},${ty + 14 * s} ${x - W},${ty}Z`, P.sphere(cap), C.line, LW);
    m += shape(`M${x - W + 6 * s},${ty + 2 * s} Q${x},${ty + 16 * s} ${x + W - 6 * s},${ty + 2 * s} Q${x},${ty + 8 * s} ${x - W + 6 * s},${ty + 2 * s}Z`, C.lo, null, 0, 'opacity="0.6"');
    for (const [dx, dy, r] of [[-30, -22, 9], [8, -38, 11], [34, -16, 8], [-8, -12, 6], [-40, -6, 5]]) m += circle(x + dx * s, ty + dy * s, r * s, dots, alpha(C.line, 0.4), 1.2);
    m += gloss(x - 26 * s, ty - 38 * s, 16 * s, 6 * s, 0.5);
    return m;
  };
  b += big(64, -10, 0.78, '#58b4e8', PAL.yellowLight);
  b += big(-60, -6, 0.86, PAL.purple, PAL.pinkLight);
  b += big(6, 4, 1.05, PAL.coral, PAL.white, true);
  b += mushroom(P, -104, 14, 1.2, { cap: PAL.yellow }) + mushroom(P, 100, 16, 1.1, { cap: PAL.rose, glow: PAL.yellowLight }) + mushroom(P, -30, 22, 0.9, { cap: PAL.orange });
  for (const [x, y, r] of [[-100, -120, 7], [96, -130, 8], [10, -170, 7]]) b += sparkle(x, y, r, '#ffffff', 0.95);
  return b;
}

/** Mảnh ghép hình (puzzle) — hình vuông bo có 1 núm tròn trên và bên phải. */
export function jigsaw(P, x, y, s, col, knobs = [1, 1, 0, 0]) {
  const C = ramp(col), h = s / 2, k = s * 0.17;
  // cạnh: trên(+núm), phải(+núm), dưới, trái
  let d = `M${r2(x - h)},${r2(y - h)}`;
  d += knobs[0] ? ` L${r2(x - k)},${r2(y - h)} C${r2(x - k * 1.6)},${r2(y - h - k * 2.2)} ${r2(x + k * 1.6)},${r2(y - h - k * 2.2)} ${r2(x + k)},${r2(y - h)} L${r2(x + h)},${r2(y - h)}` : ` L${r2(x + h)},${r2(y - h)}`;
  d += knobs[1] ? ` L${r2(x + h)},${r2(y - k)} C${r2(x + h + k * 2.2)},${r2(y - k * 1.6)} ${r2(x + h + k * 2.2)},${r2(y + k * 1.6)} ${r2(x + h)},${r2(y + k)} L${r2(x + h)},${r2(y + h)}` : ` L${r2(x + h)},${r2(y + h)}`;
  d += knobs[2] ? ` L${r2(x + k)},${r2(y + h)} C${r2(x + k * 1.6)},${r2(y + h - k * 2.2)} ${r2(x - k * 1.6)},${r2(y + h - k * 2.2)} ${r2(x - k)},${r2(y + h)} L${r2(x - h)},${r2(y + h)}` : ` L${r2(x - h)},${r2(y + h)}`;
  d += knobs[3] ? ` L${r2(x - h)},${r2(y + k)} C${r2(x - h + k * 2.2)},${r2(y + k * 1.6)} ${r2(x - h + k * 2.2)},${r2(y - k * 1.6)} ${r2(x - h)},${r2(y - k)}Z` : 'Z';
  return shape(d, P.vgrad(col), C.line, LW) + gloss(x - h * 0.45, y - h * 0.55, s * 0.16, s * 0.07, 0.5, -15);
}
export function jigsawArch(P) {
  let b = groundShadow(4, -2, 108, 20);
  const s = 44;
  const cols = [PAL.lavender, '#8fd1c0', PAL.pink, PAL.yellow, '#9cd2f5', PAL.peach, '#b58de0', PAL.mint];
  // hai cột
  const L = [[-74, -22], [-74, -66], [-70, -110]], R = [[74, -22], [74, -66], [70, -110]];
  L.forEach(([x, y], i) => { b += jigsaw(P, x, y, s, cols[i], [1, i % 2, 0, 0]); });
  R.forEach(([x, y], i) => { b += jigsaw(P, x, y, s, cols[i + 3], [1, 0, 0, i % 2]); });
  // vòm
  for (const [x, y, c, kn] of [[-50, -148, 6, [1, 1, 0, 0]], [0, -164, 7, [1, 1, 1, 0]], [50, -148, 2, [1, 0, 0, 1]]]) b += jigsaw(P, x, y, s, cols[c], kn);
  // ánh sáng trong cổng
  b += ellipse(0, -70, 44, 64, P.glow('#e6dcfb', 0.8), null);
  for (const [x, y, r] of [[0, -90, 9], [-18, -50, 6], [20, -40, 7]]) b += sparkle(x, y, r, '#ffffff', 0.95);
  // dây leo
  b += stroke('M-96,-130 Q-70,-176 -20,-186 Q30,-190 70,-170', PAL.leafDark, 3);
  for (const [x, y] of [[-88, -146], [-60, -172], [-30, -184], [10, -188], [46, -180], [70, -168]]) b += ellipse(x, y, 7, 4.5, PAL.leaf, PAL.leafDark, 1.4, `transform="rotate(-30 ${x} ${y})"`);
  b += flower(P, -40, -184, 1.2, PAL.pink) + flower(P, 30, -186, 1.2, PAL.yellow);
  // mảnh ghép rơi dưới đất
  b += g(jigsaw(P, 0, 0, 22, PAL.coral, [1, 1, 0, 0]), 'translate(-104,6) rotate(-20)') + g(jigsaw(P, 0, 0, 20, '#9cd2f5', [0, 1, 1, 0]), 'translate(108,8) rotate(15)');
  return b;
}

export function maze(P) {
  // mê cung hàng rào nhìn từ trên xuống 3/4 (tường cây có mặt trên + mặt trước)
  const hedge = '#5fae6a', Hh = ramp(hedge);
  let b = groundShadow(0, -4, 150, 24);
  b += rect(-132, -170, 264, 168, 26, P.vgrad('#d8f0c0', 0.4), Hh.line, LW);
  const walls = [
    // ngoài
    [-120, -158, 120, -158], [120, -158, 120, -14], [120, -14, 20, -14], [-20, -14, -120, -14], [-120, -14, -120, -158],
    // trong
    [-90, -128, 60, -128], [90, -128, 90, -44], [90, -44, 30, -44], [-90, -128, -90, -44], [-90, -44, -30, -44],
    [-60, -98, 60, -98], [60, -98, 60, -70], [-60, -98, -60, -70], [-60, -70, -20, -70], [20, -70, 60, -70],
  ];
  const wallsSorted = walls.map((w) => [...w]).sort((a, c) => Math.max(a[1], a[3]) - Math.max(c[1], c[3]));
  for (const [x1, y1, x2, y2] of wallsSorted) {
    const minx = Math.min(x1, x2) - 9, maxx = Math.max(x1, x2) + 9, miny = Math.min(y1, y2) - 14, maxy = Math.max(y1, y2) + 6;
    b += rect(minx, miny + 6, maxx - minx, maxy - miny, 8, Hh.lo, Hh.line, LW * 0.8); // mặt trước (tối)
    b += rect(minx, miny, maxx - minx, maxy - miny - 6, 8, P.vgrad(lighten(hedge, 0.15)), Hh.line, LW * 0.8); // mặt trên
  }
  // chòi giữa có ngôi sao
  b += groundShadow(0, -80, 22, 6) + rect(-14, -102, 28, 22, 4, P.vgrad(PAL.cream), ramp(PAL.cream).line, 2.4);
  b += shape('M-22,-100 Q0,-128 22,-100Z', P.sphere(PAL.purple), ramp(PAL.purple).line, 2.4);
  b += sparkle(0, -134, 12, PAL.yellow, 1) + circle(0, -134, 18, P.glow(PAL.yellowLight, 0.8), null);
  b += flower(P, -130, 10, 1.2, PAL.pink) + flower(P, 130, 8, 1.2, PAL.yellow);
  return b;
}

export function runeStones(P) {
  let b = ellipse(0, -30, 110, 40, P.glow('#c9fff0', 0.5), null);
  b += ellipse(0, -30, 92, 30, alpha('#b7a9e6', 0.4), alpha(PAL.purple, 0.5), 2, 'stroke-dasharray="6 8"');
  const st = '#b8b2d6', S = ramp(st);
  const symbols = [
    (x, y) => circle(x, y, 7, 'none', '#7af0d8', 3),
    (x, y) => shape(`M${x},${y - 8} L${x + 8},${y + 6} L${x - 8},${y + 6}Z`, 'none', '#ffe27a', 3),
    (x, y) => stroke(`M${x - 6},${y} a6,6 0 1 1 6,6 a3,3 0 1 1 -3,-3`, '#ffb8e0', 3),
    (x, y) => rect(x - 7, y - 7, 14, 14, 3, 'none', '#9cd2f5', 3),
    (x, y) => stroke(`M${x - 7},${y + 5} L${x},${y - 7} L${x + 7},${y + 5} M${x - 4},${y} L${x + 4},${y}`, '#c3b0f2', 3),
  ];
  const stones = [[-80, -40, 0.85], [-44, -60, 0.75], [44, -60, 0.75], [80, -40, 0.85], [-60, 6, 1], [60, 6, 1]];
  stones.sort((a, c) => a[1] - c[1]).forEach(([x, y, s], i) => {
    b += groundShadow(x + 5, y, 22 * s, 6 * s);
    b += shape(`M${x - 18 * s},${y} Q${x - 22 * s},${y - 50 * s} ${x - 10 * s},${y - 62 * s} Q${x},${y - 68 * s} ${x + 10 * s},${y - 62 * s} Q${x + 22 * s},${y - 50 * s} ${x + 18 * s},${y} Q${x},${y + 5 * s} ${x - 18 * s},${y}Z`, P.vgrad(st), S.line, LW);
    b += circle(x, y - 34 * s, 14 * s, P.glow('#ffffff', 0.6), null);
    b += symbols[i % symbols.length](x, y - 34 * s);
    b += gloss(x - 8 * s, y - 50 * s, 5 * s, 9 * s, 0.35, 15);
  });
  // tinh thể giữa
  b += circle(0, -54, 40, P.glow('#c9fff0', 0.9), null);
  b += shape('M0,-96 L16,-60 L0,-18 L-16,-60Z', P.lin('crystal', [[0, '#e6fffb'], [0.5, '#8fe6df'], [1, '#6fb7e8']], 0, 0, 1, 1), '#4f8fb8', LW * 0.8) + stroke('M0,-96 L0,-18 M-16,-60 L16,-60', '#ffffff', 1.6, 'opacity="0.7"');
  b += sparkle(22, -96, 8) + sparkle(-26, -80, 6);
  return b;
}

// ═══════════════════════ NÚI TOÁN HỌC ═══════════════════════
export function mathPeak(P) {
  let b = '';
  b += groundShadow(20, -6, 240, 34);
  // núi chính lớn + 2 vai núi
  b += mountain(P, -150, -10, 220, 190, { color: '#ffd2b0', seed: 7, lw: 4.5, snow: false, noShadow: true });
  b += mountain(P, 160, -6, 230, 210, { color: '#ffc39a', seed: 8, lw: 4.5, snow: true, noShadow: true });
  b += mountain(P, 0, 0, 380, 380, { color: '#ffb889', seed: 9, lw: 5, skew: 0, noShadow: true, boulders: false });
  // bậc thang khối màu leo lên núi (đường zíc zắc)
  const steps = [[-30, -24], [-70, -62], [-40, -98], [10, -128], [50, -160], [24, -196], [-20, -226], [-4, -262], [12, -296]];
  const cols = [PAL.coral, PAL.yellow, '#9cd2f5', PAL.mint, PAL.lavender, PAL.pink, PAL.orange, '#9cd2f5', PAL.yellow];
  b += stroke(smoothPath(steps, false), '#f6e3c4', 16) + stroke(smoothPath(steps, false), '#e8c58f', 3, 'stroke-dasharray="2 10"');
  steps.forEach(([x, y], i) => { const s = 11 - i * 0.55; b += rect(x - s, y - s * 1.3, s * 2, s * 1.3, 3, P.vgrad(cols[i]), ramp(cols[i]).line, 2.2) + rect(x - s, y - s * 1.7, s * 2, s * 0.55, 2, lighten(cols[i], 0.3), ramp(cols[i]).line, 1.6); });
  // khối hình học khắc trên sườn
  b += dice(P, -110, -40, 18, PAL.white) + pyramid(P, 120, -40, 22, PAL.yellow) + ball(P, 92, -116, 14, '#58b4e8') + pyramid(P, -86, -150, 15, PAL.mint);
  // hàng hạt bàn tính (rào bàn tính)
  for (const [y0, x0, x1] of [[-70, 40, 140]]) {
    b += stroke(`M${x0},${y0} L${x1},${y0 + 12}`, PAL.woodDark, 3);
    for (let i = 0; i < 7; i++) { const t = i / 6, x = x0 + (x1 - x0) * t, y = y0 + 12 * t; b += ellipse(x, y, 6.5, 5.5, P.sphere(cols[i]), ramp(cols[i]).line, 1.6); }
    b += rect(x0 - 3, y0 - 8, 6, 22, 2, PAL.wood, ramp(PAL.wood).line, 1.6) + rect(x1 - 3, y0 + 4, 6, 22, 2, PAL.wood, ramp(PAL.wood).line, 1.6);
  }
  // cờ đỉnh núi (cờ tam giác) & ngôi sao
  b += rect(-2, -400, 4, 46, 2, PAL.woodDark, null) + shape('M2,-400 L34,-390 L2,-378Z', P.vgrad(PAL.coral), ramp(PAL.coral).line, 2);
  b += circle(0, -400, 30, P.glow(PAL.yellowLight, 0.8), null) + sparkle(-36, -384, 10, '#ffffff', 1) + sparkle(42, -350, 7, '#ffffff', 1);
  // đài quan sát mái vòm nhỏ ở vai núi phải
  b += rect(140, -172, 40, 30, 5, P.vgrad(PAL.cream), ramp(PAL.cream).line, 2.4) + shape('M136,-170 Q160,-204 184,-170Z', P.sphere(PAL.lavender), ramp(PAL.lavender).line, 2.4) + rect(160, -200, 14, 6, 3, PAL.stoneDark, null, 0, 'transform="rotate(-30 167 -197)"');
  // cây & thông chân núi
  b += pine(P, -220, 6, 1.1) + pine(P, -190, 14, 0.9) + tree(P, 210, 10, 1, { color: PAL.leaf, fruit: PAL.orange, seed: 5 }) + pine(P, 236, 4, 0.95);
  return b;
}

export function floatingBlocks(P) {
  let b = ellipse(0, -2, 100, 18, PAL.shadowSoft, null) + ellipse(0, -2, 60, 10, PAL.shadowSoft, null);
  const plat = (x, y, w, col, kind) => {
    const C = ramp(col);
    let m = '';
    // đáy: hình học
    if (kind === 'cube') m += rect(x - w / 2, y, w, w * 0.7, 8, P.vgrad(col), C.line, LW) + rect(x - w / 2 + 6, y + 8, w - 12, 6, 3, lighten(col, 0.3), null);
    else if (kind === 'cone') m += shape(`M${x - w / 2},${y} L${x + w / 2},${y} L${x + 4},${y + w * 0.9} Q${x},${y + w * 0.95} ${x - 4},${y + w * 0.9}Z`, P.vgrad(col), C.line, LW);
    else m += shape(`M${x - w / 2},${y} L${x + w / 2},${y} L${x + w / 2},${y + w * 0.5} Q${x},${y + w * 0.75} ${x - w / 2},${y + w * 0.5}Z`, P.vgrad(col), C.line, LW);
    // mặt cỏ trên
    m += ellipse(x, y, w / 2 + 6, w * 0.16, P.vgrad(PAL.grass), ramp(PAL.grass).line, LW * 0.9);
    // mây dưới
    m += ellipse(x - w * 0.3, y + w * 0.55, w * 0.22, w * 0.1, '#ffffff', null, 0, 'opacity="0.85"') + ellipse(x + w * 0.25, y + w * 0.6, w * 0.18, w * 0.08, '#ffffff', null, 0, 'opacity="0.75"');
    return m;
  };
  b += plat(-70, -150, 80, PAL.lavender, 'cube');
  b += dice(P, -80, -154, 12, PAL.white) + pine(P, -50, -156, 0.7, { color: PAL.leafDark });
  b += plat(76, -196, 70, '#9cd2f5', 'cone');
  b += tree(P, 76, -200, 0.75, { color: PAL.leaf, fruit: PAL.orange, seed: 2 });
  b += plat(0, -90, 96, PAL.peach, 'cyl');
  b += pyramid(P, -20, -96, 16, PAL.yellow) + ball(P, 24, -94, 11, PAL.coral) + flower(P, 4, -88, 1, PAL.pink);
  // đường bậc đá bay nối các đảo
  for (const [x, y] of [[-30, -118], [30, -140], [50, -166]]) b += ellipse(x, y, 10, 5, P.vgrad(PAL.stoneLight), ramp(PAL.stone).line, 2);
  for (const [x, y, r] of [[-120, -200, 8], [120, -120, 9], [10, -230, 7], [-110, -60, 6]]) b += sparkle(x, y, r, '#ffffff', 0.95);
  return b;
}

export function diceTower(P) {
  let b = groundShadow(6, -2, 70, 16);
  const cols = [PAL.white, PAL.pinkLight, PAL.yellowLight, '#d7f0ff'];
  const pips = { 1: [[0, 0]], 2: [[-1, -1], [1, 1]], 3: [[-1, -1], [0, 0], [1, 1]], 4: [[-1, -1], [1, -1], [-1, 1], [1, 1]], 5: [[-1, -1], [1, -1], [0, 0], [-1, 1], [1, 1]], 6: [[-1, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [1, 1]] };
  const cube = (x, y, s, c, n, rot = 0) => {
    const C = ramp(c);
    let m = rect(x - s, y - s * 2.55, s * 2, s * 1, s * 0.35, lighten(c, 0.25), C.line, LW * 0.9);
    m += circle(x - s * 0.4, y - s * 2.2, s * 0.12, PAL.ink, null, 0, 'opacity="0.7"') + circle(x + s * 0.4, y - s * 2.2, s * 0.12, PAL.ink, null, 0, 'opacity="0.7"');
    m += rect(x - s, y - s * 2, s * 2, s * 2, s * 0.35, P.vgrad(c), C.line, LW);
    for (const [dx, dy] of pips[n]) m += circle(x + dx * s * 0.5, y - s + dy * s * 0.5, s * 0.15, PAL.ink, null);
    return g(m, rot ? `rotate(${rot} ${x} ${y - s})` : '');
  };
  b += cube(0, 0, 44, cols[0], 5) + cube(-4, -92, 36, cols[1], 3, -4) + cube(4, -168, 30, cols[2], 6, 4);
  // mái chóp + cờ
  b += shape('M-36,-232 L4,-290 L42,-232 Q4,-222 -36,-232Z', P.vgrad(PAL.purple), ramp(PAL.purple).line, LW) + stroke('M4,-290 L4,-312', PAL.woodDark, 2.4) + shape('M4,-312 L24,-305 L4,-298Z', PAL.yellow, ramp(PAL.yellow).line, 1.6);
  // xúc xắc nhỏ dưới chân
  b += cube(-64, 14, 14, cols[3], 2, -10) + cube(62, 16, 12, cols[1], 4, 8);
  b += sparkle(-56, -200, 8) + sparkle(56, -130, 7);
  return b;
}

export function fruitGarden(P) {
  let b = rect(-126, -90, 252, 96, 22, P.vgrad('#c8e88f', 0.4), darken('#c8e88f', 0.35), LW);
  for (let i = 1; i < 4; i++) b += stroke(`M-112,${-90 + i * 24} L112,${-90 + i * 24}`, darken('#c8e88f', 0.12), 3, 'opacity="0.7"');
  const fruits = [PAL.orange, PAL.coral, PAL.yellow, '#b6e35e'];
  const trees = [];
  for (let r = 0; r < 2; r++) for (let c = 0; c < 4; c++) trees.push([-90 + c * 60 + (r ? 30 : 0), -64 + r * 44, fruits[(c + r) % 4]]);
  trees.sort((a, c) => a[1] - c[1]).forEach(([x, y, f], i) => { if (x < 120) b += tree(P, x, y, 0.95, { color: i % 2 ? PAL.leaf : '#8fd16f', fruit: f, seed: i + 3 }); });
  // giỏ trái cây, thang
  b += shape('M-130,16 L-104,16 L-108,0 L-126,0Z', P.vgrad(PAL.woodLight), ramp(PAL.woodLight).line, 2.2) + circle(-122, -2, 5, PAL.orange, null) + circle(-112, -3, 5, PAL.coral, null);
  b += fence(P, -136, 20, 136, 20, 1.1);
  return b;
}
