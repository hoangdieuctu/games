// ── Little World: biểu tượng vùng, cổng vào, sương khoá vùng, UI bản đồ và đồ trang trí động ──
// Toạ độ cục bộ: icon/badge có tâm (0,0); cổng có ĐẾ ở (0,0).
import {
  PAL, ramp, lighten, darken, mix, alpha, rng, smoothPath, blob, blobPoints, shape, stroke, circle, ellipse, rect, r2, g,
  tree, pine, palm, bush, rock, flower, mushroom, house, fence, cloud, sparkle, wave, boat, bridge, groundShadow, gloss, puffPath,
  win, door, gableRoof, bunting, lantern,
} from './world-kit.mjs';
import { jigsaw } from './world-landmarks-a.mjs';
import { fish } from './world-landmarks-b.mjs';
import { dice, pyramid, ball } from './world-map-detail.mjs';
import { sampleSpline } from './world-geo.mjs';

const LW = 3;
const BLUE = '#58b4e8';

// ═══════════════════════ ICON VÙNG (huy hiệu tròn ~128 đơn vị) ═══════════════════════
function badge(P, col, inner) {
  const C0 = ramp(col), C = { line: mix(C0.line, PAL.ink, 0.3) };
  let b = circle(3, 6, 62, PAL.shadow, null);
  b += circle(0, 0, 62, P.v2('#ffffff', PAL.cream), C.line, 4);
  b += circle(0, 0, 52, P.rad('badge' + col, [[0, lighten(col, 0.45)], [0.7, lighten(col, 0.1)], [1, col]], 0.4, 0.35, 0.75), C.line, 3);
  b += g(inner, '', `clip-path="${P.clip('<circle cx="0" cy="0" r="51"/>')}"`);
  b += circle(0, 0, 52, 'none', C.line, 3);
  b += gloss(-24, -32, 20, 9, 0.55, -30);
  return b;
}
export const ICONS = {
  'animal-island': (P) => {
    // đầu thỏ
    const w = PAL.white, Wl = mix(PAL.lavender, PAL.purple, 0.55);
    let m = ellipse(0, 46, 70, 20, alpha(PAL.grassDark, 0.5), null);
    m += shape('M-22,-8 Q-34,-60 -18,-62 Q-6,-60 -8,-12Z', P.vgrad(w), Wl, 2.6) + shape('M-19,-16 Q-26,-50 -18,-52 Q-12,-50 -13,-18Z', PAL.pink, null, 0);
    m += shape('M22,-8 Q34,-60 18,-62 Q6,-60 8,-12Z', P.vgrad(w), Wl, 2.6) + shape('M19,-16 Q26,-50 18,-52 Q12,-50 13,-18Z', PAL.pink, null, 0);
    m += ellipse(0, 14, 34, 29, P.sphere(w), Wl, 3);
    m += circle(-12, 10, 4.5, PAL.ink, null) + circle(12, 10, 4.5, PAL.ink, null) + circle(-10.5, 8.5, 1.5, '#ffffff', null) + circle(13.5, 8.5, 1.5, '#ffffff', null);
    m += ellipse(-20, 22, 6, 3.5, PAL.pink, null) + ellipse(20, 22, 6, 3.5, PAL.pink, null) + ellipse(0, 19, 3.5, 2.5, PAL.rose, null) + stroke('M-5,24 Q0,28 0,24 Q0,28 5,24', PAL.ink, 1.8);
    m += tree(P, -38, 50, 0.6, { color: PAL.leaf, noShadow: true }) + tree(P, 40, 52, 0.55, { color: '#5fb85f', noShadow: true });
    return m;
  },
  'puzzle-forest': (P) => {
    let m = circle(0, 0, 40, P.glow('#ffffff', 0.6), null);
    m += g(jigsaw(P, 0, 0, 52, PAL.purple, [1, 1, 0, 0]), 'translate(-4,8) rotate(-8)');
    m += mushroom(P, 30, 46, 0.9, { cap: PAL.coral }) + mushroom(P, -34, 48, 0.75, { cap: BLUE });
    m += sparkle(-28, -30, 8) + sparkle(30, -24, 6) + sparkle(8, -40, 5);
    return m;
  },
  'creative-town': (P) => {
    const pal = 'M-40,6 C-44,-30 -10,-44 14,-40 C40,-36 50,-12 42,8 C36,22 18,14 14,8 C8,0 -2,8 4,16 C10,26 -6,32 -20,28 C-34,24 -38,18 -40,6Z';
    let m = shape(pal, P.vgrad('#f6d3a6'), ramp(PAL.woodLight).line, 3);
    for (const [x, y, c] of [[-24, -10, PAL.coral], [-8, -26, PAL.yellow], [14, -28, '#6cc46a'], [32, -12, BLUE], [-24, 12, PAL.purple]]) m += circle(x, y, 7.5, P.sphere(c), ramp(c).line, 1.8);
    m += g(rect(-4, -40, 8, 62, 3, P.vgrad(PAL.woodLight), ramp(PAL.woodLight).line, 2.2) + rect(-5, -50, 10, 12, 2, PAL.stoneLight, ramp(PAL.stone).line, 1.8) + shape('M-6,-50 Q-8,-68 0,-76 Q8,-68 6,-50Z', P.vgrad(PAL.rose), ramp(PAL.rose).line, 2), 'translate(30,26) rotate(28)');
    return m;
  },
  'math-mountain': (P) => {
    let m = ellipse(0, 40, 70, 18, alpha('#f3c08a', 0.8), null);
    m += shape('M-50,32 Q-24,-26 -2,-30 Q20,-26 50,32 Q0,38 -50,32Z', P.vgrad('#ffc9a3'), mix(ramp('#ffc9a3').line, PAL.purple, 0.5), 3);
    m += shape('M-14,-18 Q-2,-32 10,-18 Q4,-12 -2,-16 Q-8,-12 -14,-18Z', PAL.white, null, 0);
    m += rect(-3, -46, 3, 18, 1, PAL.woodDark, null) + shape('M0,-46 L14,-41 L0,-36Z', PAL.coral, null, 0);
    m += dice(P, -22, 38, 11, PAL.white) + pyramid(P, 22, 36, 12, PAL.yellow) + ball(P, 0, 42, 8, BLUE);
    return m;
  },
  'life-skills-village': (P) => {
    let m = ellipse(0, 44, 70, 22, alpha('#e8c96a', 0.7), null);
    m += house(P, 0, 34, 1.5, { wall: PAL.cream, roof: PAL.orangeDeep, chimney: true, lit: true });
    // trái tim trên mái
    m += shape('M0,-34 C-4,-42 -14,-40 -12,-32 C-10,-26 0,-22 0,-20 C0,-22 10,-26 12,-32 C14,-40 4,-42 0,-34Z', P.vgrad(PAL.rose), ramp(PAL.rose).line, 2);
    m += tree(P, -40, 40, 0.65, { color: PAL.leaf, fruit: PAL.coral, noShadow: true }) + bush(P, 40, 42, 0.8, { flower: PAL.pink });
    return m;
  },
  'adventure-ocean': (P) => {
    let m = rect(-60, 14, 120, 50, 0, alpha(PAL.oceanDeep, 0.5), null);
    m += wave(-30, 14, 30, '#ffffff', 3) + wave(26, 18, 30, '#ffffff', 3);
    const Y = '#ffd34d';
    m += shape('M-34,-2 Q-34,-26 0,-26 L14,-26 Q38,-26 38,-2 Q38,18 14,18 L-6,18 Q-34,18 -34,-2Z', P.sphere(Y), ramp(Y).line, 3);
    m += rect(-8, -40, 22, 16, 5, P.vgrad(Y), ramp(Y).line, 2.4) + stroke('M10,-40 L10,-52 L20,-52', ramp(Y).line, 3);
    for (const x of [-18, 2, 22]) m += circle(x, -2, 6, '#bdeffa', ramp(Y).line, 2);
    m += fish(P, -22, 34, 0.8, PAL.coral) + fish(P, 24, 38, 0.7, PAL.yellow, true);
    m += circle(42, -30, 4, 'none', '#ffffff', 1.8) + circle(48, -42, 3, 'none', '#ffffff', 1.6);
    return m;
  },
};
export function regionIcon(P, id, col) { return badge(P, col, ICONS[id](P)); }

// ═══════════════════════ CỔNG VÀO VÙNG (~260×260) ═══════════════════════
function plaque(P, y, col, w = 90) { // biển trống — tên do Phaser vẽ
  const C = ramp(col);
  return rect(-w / 2, y - 16, w, 32, 12, P.vgrad(lighten(col, 0.25)), C.line, LW) + rect(-w / 2 + 6, y - 11, w - 12, 22, 8, alpha('#ffffff', 0.4), null);
}
export const ENTRANCES = {
  'animal-island': (P) => {
    const W = PAL.wood, Wr = ramp(W);
    let b = groundShadow(4, -2, 120, 22);
    for (const x of [-92, 92]) b += rect(x - 14, -190, 28, 192, 8, P.lin('post', [[0, lighten(W, 0.25)], [1, darken(W, 0.12)]], 0, 0, 1, 0), Wr.line, LW) + stroke(`M${x - 4},-170 L${x - 4},-20`, Wr.lo, 2);
    // xà ngang cong như cành cây + lá
    b += shape('M-120,-176 Q0,-236 120,-176 L120,-156 Q0,-214 -120,-156Z', P.vgrad(W), Wr.line, LW);
    for (const [x, y, r, c] of [[-110, -186, 22, PAL.leaf], [-70, -206, 24, '#8fd16f'], [-24, -218, 22, PAL.leaf], [24, -218, 24, '#5fb85f'], [70, -206, 22, '#8fd16f'], [110, -186, 22, PAL.leaf]]) b += shape(puffPath(x, y, r, r * 0.8, 6, 0.2, x), P.sphere(c), ramp(c).line, 2.6);
    for (const [x, y] of [[-80, -212], [0, -226], [86, -200]]) b += flower(P, x, y + 6, 1.4, PAL.pink);
    // tai thỏ & tai gấu trên đỉnh cột
    b += shape('M-104,-190 Q-112,-232 -100,-234 Q-92,-230 -96,-190Z', PAL.white, ramp(PAL.cream).line, 2.4) + shape('M-88,-190 Q-86,-230 -76,-228 Q-70,-222 -80,-190Z', PAL.white, ramp(PAL.cream).line, 2.4);
    b += circle(84, -196, 9, PAL.soil, ramp(PAL.soil).line, 2.4) + circle(102, -196, 9, PAL.soil, ramp(PAL.soil).line, 2.4);
    b += plaque(P, -150, PAL.leaf, 100);
    // dây leo trên cột
    b += stroke('M-92,-150 Q-80,-120 -96,-90 Q-108,-60 -92,-30', PAL.leafDark, 2.4) + stroke('M92,-150 Q104,-120 88,-90 Q76,-60 92,-30', PAL.leafDark, 2.4);
    for (const [x, y] of [[-84, -124], [-102, -80], [-94, -44], [100, -120], [82, -84], [90, -40]]) b += ellipse(x, y, 7, 4, PAL.leaf, PAL.leafDark, 1.4);
    b += bush(P, -128, 12, 1.2, { flower: PAL.yellow }) + bush(P, 130, 14, 1.1, { flower: PAL.pink });
    return b;
  },
  'puzzle-forest': (P) => {
    let b = ellipse(0, -100, 110, 120, P.glow('#d9ccff', 0.6), null) + groundShadow(4, -2, 120, 22);
    // hai nấm cổng
    const stem = (x) => shape(`M${x - 18},0 Q${x - 22},-90 ${x - 14},-150 L${x + 14},-150 Q${x + 22},-90 ${x + 18},0Z`, P.lin('mstem', [[0, '#fffaf0'], [1, '#e6d2c0']], 0, 0, 1, 0), ramp(PAL.cream).line, LW);
    b += stem(-88) + stem(88);
    for (const [x, c] of [[-88, PAL.purple], [88, BLUE]]) {
      b += shape(`M${x - 50},-146 Q${x - 52},-200 ${x},-202 Q${x + 52},-200 ${x + 50},-146 Q${x},-132 ${x - 50},-146Z`, P.sphere(c), ramp(c).line, LW);
      for (const [dx, dy, r] of [[-24, -176, 7], [6, -188, 8], [26, -164, 6]]) b += circle(x + dx, dy, r, PAL.yellowLight, null);
    }
    // vòm dây leo + đèn lồng
    b += stroke('M-60,-150 Q0,-230 60,-150', PAL.leafDark, 6) + stroke('M-60,-150 Q0,-230 60,-150', PAL.leaf, 3);
    b += stroke('M-30,-176 L-30,-150 M30,-176 L30,-150 M0,-190 L0,-160', PAL.woodDark, 1.4) + lantern(P, -30, -142, PAL.yellow) + lantern(P, 30, -142, PAL.pink) + lantern(P, 0, -152, '#9be6d8');
    b += plaque(P, -112, PAL.lavender, 92);
    b += g(jigsaw(P, 0, 0, 34, PAL.mint, [1, 1, 0, 0]), 'translate(-124,-10) rotate(-12)') + g(jigsaw(P, 0, 0, 30, PAL.pink, [0, 1, 1, 0]), 'translate(126,-8) rotate(10)');
    b += sparkle(-40, -200, 8) + sparkle(46, -214, 7) + sparkle(0, -80, 7);
    return b;
  },
  'creative-town': (P) => {
    let b = groundShadow(4, -2, 124, 22);
    // cột là bút chì khổng lồ
    const pencil = (x, c) => {
      const C = ramp(c);
      return rect(x - 16, -176, 32, 176, 4, P.lin('pen' + c, [[0, lighten(c, 0.3)], [0.5, c], [1, darken(c, 0.1)]], 0, 0, 1, 0), C.line, LW) +
        stroke(`M${x - 5},-170 L${x - 5},-6 M${x + 5},-170 L${x + 5},-6`, C.lo, 1.6) + rect(x - 16, -12, 32, 12, 3, PAL.stoneLight, ramp(PAL.stone).line, 2) +
        shape(`M${x - 16},-176 L${x},-214 L${x + 16},-176Z`, P.vgrad(PAL.woodLight), ramp(PAL.woodLight).line, LW) + shape(`M${x - 5},-202 L${x},-214 L${x + 5},-202Z`, c, C.line, 1.6);
    };
    b += pencil(-96, PAL.coral) + pencil(96, BLUE);
    // xà ngang: cây cọ nằm ngang + vệt sơn cầu vồng
    const rb = [PAL.coral, PAL.orange, PAL.yellow, '#8fd16f', BLUE, PAL.purple];
    rb.forEach((c, i) => { b += stroke(`M-96,${-150 + i * 7} Q0,${-238 + i * 7} 96,${-150 + i * 7}`, c, 8); });
    b += stroke('M-96,-150 Q0,-238 96,-150', ramp(PAL.coral).line, 2, 'opacity="0.6"') + stroke('M-96,-115 Q0,-203 96,-115', ramp(PAL.purple).line, 2, 'opacity="0.6"');
    b += plaque(P, -100, PAL.pink, 100);
    b += bunting(-96, -80, 96, -80, 8);
    // giọt sơn & cây cọ
    b += ellipse(-130, 10, 18, 6, alpha(PAL.yellow, 0.8), null) + ellipse(128, 12, 16, 5, alpha(PAL.pink, 0.8), null);
    b += g(rect(-4, -60, 8, 50, 3, P.vgrad(PAL.woodLight), ramp(PAL.woodLight).line, 2) + shape('M-6,-60 Q-8,-80 0,-88 Q8,-80 6,-60Z', P.vgrad(PAL.purple), ramp(PAL.purple).line, 2), 'translate(-134,6) rotate(-20)');
    return b;
  },
  'math-mountain': (P) => {
    let b = groundShadow(4, -2, 124, 22);
    const cube = (x, y, s, c) => rect(x - s, y - s * 2.5, s * 2, s * 0.9, s * 0.3, lighten(c, 0.25), ramp(c).line, LW * 0.9) + rect(x - s, y - s * 2, s * 2, s * 2, s * 0.3, P.vgrad(c), ramp(c).line, LW);
    // cột trái: khối vuông chồng; cột phải: trụ tròn chồng
    b += cube(-96, 0, 26, PAL.lavender) + cube(-96, -52, 23, PAL.mint) + cube(-96, -98, 20, PAL.pink);
    for (const [y, c, w] of [[0, PAL.yellow, 52], [-50, '#9cd2f5', 48], [-96, PAL.peach, 44]]) b += rect(96 - w / 2, y - 46, w, 46, 6, P.vgrad(c), ramp(c).line, LW) + ellipse(96, y - 46, w / 2, 8, lighten(c, 0.25), ramp(c).line, LW * 0.8);
    // xà ngang hình tam giác + thanh bàn tính
    b += shape('M-130,-150 L130,-150 Q134,-150 128,-158 L6,-226 Q0,-230 -6,-226 L-128,-158 Q-134,-150 -130,-150Z', P.vgrad(PAL.orange), ramp(PAL.orange).line, LW);
    b += shape('M-60,-162 L60,-162 L0,-200Z', lighten(PAL.orange, 0.3), ramp(PAL.orange).line, 2);
    b += stroke('M-74,-130 L74,-130', PAL.woodDark, 3.4);
    const cols = [PAL.coral, PAL.yellow, '#9cd2f5', PAL.mint, PAL.lavender, PAL.pink, PAL.orange, '#9cd2f5'];
    cols.forEach((c, i) => { b += ellipse(-56 + i * 16, -130, 7.5, 6.5, P.sphere(c), ramp(c).line, 1.8); });
    b += plaque(P, -96, PAL.peach, 92);
    b += ball(P, -134, 14, 12, PAL.coral) + pyramid(P, 134, 12, 16, PAL.yellow);
    b += sparkle(0, -240, 9) + sparkle(-110, -200, 6);
    return b;
  },
  'life-skills-village': (P) => {
    const W = PAL.woodLight, Wr = ramp(W);
    let b = groundShadow(4, -2, 124, 22);
    for (const x of [-92, 92]) b += rect(x - 12, -176, 24, 178, 6, P.lin('vpost', [[0, lighten(W, 0.25)], [1, darken(W, 0.12)]], 0, 0, 1, 0), Wr.line, LW) + rect(x - 18, -10, 36, 12, 4, PAL.stoneLight, ramp(PAL.stone).line, 2);
    // mái nhỏ trên cổng
    b += gableRoof(P, -116, -168, 232, 50, PAL.orangeDeep, LW, 10);
    b += rect(-112, -176, 224, 14, 4, P.vgrad(PAL.wood), ramp(PAL.wood).line, LW);
    // chuông
    b += stroke('M0,-176 L0,-160', PAL.woodDark, 2) + shape('M-12,-140 Q-12,-160 0,-160 Q12,-160 12,-140 L15,-136 L-15,-136Z', P.vgrad(PAL.yellow), ramp(PAL.yellow).line, 2.4) + circle(0, -133, 3, ramp(PAL.yellow).line, null);
    b += plaque(P, -104, PAL.yellow, 96);
    // hộp hoa trên cột + hàng rào
    for (const x of [-92, 92]) b += rect(x - 20, -72, 40, 14, 4, P.vgrad(PAL.wood), ramp(PAL.wood).line, 2) + flower(P, x - 10, -70, 1.2, PAL.pink) + flower(P, x, -72, 1.2, PAL.yellow) + flower(P, x + 10, -70, 1.2, PAL.white);
    b += fence(P, -150, 4, -106, 2, 1.2) + fence(P, 106, 2, 150, 4, 1.2);
    b += bunting(-80, -150, 80, -150, 6);
    return b;
  },
  'adventure-ocean': (P) => {
    let b = ellipse(0, 4, 140, 22, alpha(PAL.oceanLight, 0.8), null) + wave(-110, 8, 30, '#ffffff', 3) + wave(110, 10, 30, '#ffffff', 3);
    // vòm vỏ ốc + gỗ trôi
    const D = '#d9b48a', Dr = ramp(D);
    for (const x of [-92, 92]) b += shape(`M${x - 16},4 Q${x - 22},-90 ${x - 10},-170 L${x + 12},-170 Q${x + 22},-90 ${x + 16},4Z`, P.lin('drift', [[0, lighten(D, 0.3)], [1, darken(D, 0.1)]], 0, 0, 1, 0), Dr.line, LW) + stroke(`M${x - 4},-150 Q${x - 8},-90 ${x - 2},-20`, Dr.lo, 2);
    b += stroke('M-104,-160 Q0,-250 104,-160', Dr.line, 26) + stroke('M-104,-160 Q0,-250 104,-160', D, 20) + stroke('M-104,-166 Q0,-256 104,-166', lighten(D, 0.3), 5);
    // vỏ sò lớn trên đỉnh
    b += shape('M-30,-196 Q-34,-238 0,-244 Q34,-238 30,-196 Q0,-186 -30,-196Z', P.sphere(PAL.pink), ramp(PAL.pink).line, LW);
    for (const dx of [-18, -6, 6, 18]) b += stroke(`M0,-194 L${dx * 1.4},-236`, ramp(PAL.pink).lo, 1.8);
    // phao cứu sinh, mỏ neo, dây thừng
    b += circle(-92, -110, 18, 'none', PAL.coral, 9) + circle(-92, -110, 18, 'none', '#ffffff', 3, 'stroke-dasharray="7 10"');
    b += g(stroke('M0,-30 L0,10 M-14,0 Q0,20 14,0 M-8,-22 L8,-22', '#7a86a8', 5) + circle(0, -34, 5, 'none', '#7a86a8', 3), 'translate(92,-110)');
    b += stroke('M-104,-150 Q-60,-120 -20,-150 Q20,-120 60,-150 Q90,-130 104,-150', '#e6c28f', 3, 'stroke-dasharray="6 4"');
    b += plaque(P, -100, BLUE, 92);
    b += shape(`M126,-8 l4,-10 l4,10 l10,0 l-8,6 l3,10 l-9,-6 l-9,6 l3,-10 l-8,-6Z`, P.vgrad(PAL.orange), ramp(PAL.orange).line, 1.8);
    for (const [x, y, r] of [[-130, -40, 5], [-136, -60, 3.5], [140, -60, 4]]) b += circle(x, y, r, 'none', '#ffffff', 2);
    return b;
  },
};

// ═══════════════════════ SƯƠNG MÂY KHOÁ VÙNG ═══════════════════════
/** Mây phủ theo đa giác vùng; trả về {body, bbox}. Toạ độ bản đồ (ghép translate khi vẽ). */
export function fogOverlay(P, poly, col, seed = 1) {
  const R = rng(seed);
  const S = sampleSpline(poly, 40, true);
  const xs = S.map((p) => p[0]), ys = S.map((p) => p[1]);
  const pad = 80;
  const bbox = [Math.min(...xs) - pad, Math.min(...ys) - pad, Math.max(...xs) + pad, Math.max(...ys) + pad];
  const tintLine = mix(PAL.lavender, col, 0.25);
  const fill = P.lin('fog' + col, [[0, '#ffffff', 0.9], [0.6, mix('#ffffff', PAL.lavenderLight, 0.6), 0.88], [1, mix(PAL.lavenderLight, col, 0.2), 0.9]], 0, 0, 0.3, 1);
  const d = smoothPath(poly);
  // viền mây phồng quanh mép
  let outline = '', body = '', hi = '';
  const puffs = [];
  for (let i = 0; i < S.length; i++) puffs.push([S[i][0] + R.range(-14, 14), S[i][1] + R.range(-14, 14), R.range(42, 70)]);
  for (const [x, y, r] of puffs) outline += circle(x, y, r + 5, tintLine, null);
  outline += `<path d="${d}" fill="${tintLine}" stroke="${tintLine}" stroke-width="10"/>`;
  for (const [x, y, r] of puffs) body += circle(x, y, r, fill, null);
  body += `<path d="${d}" fill="${fill}"/>`;
  // các đám mây nổi bên trong để có khối
  const [x0, y0, x1, y1] = bbox;
  const inside = [];
  for (let k = 0; k < 400 && inside.length < 26; k++) {
    const p = [R.range(x0, x1), R.range(y0, y1)];
    if (!inPoly(p, S)) continue;
    if (inside.some((q) => Math.hypot(q[0] - p[0], q[1] - p[1]) < 140)) continue;
    inside.push(p);
  }
  for (const [x, y] of inside) {
    const w = R.range(120, 220);
    hi += ellipse(x + 8, y + w * 0.2, w * 0.5, w * 0.12, alpha(PAL.purple, 0.12), null);
    for (const [dx, dy, r] of [[-0.25, 0, 0.2], [0, -0.1, 0.27], [0.25, 0, 0.19]]) hi += circle(x + dx * w, y + dy * w, r * w, alpha('#ffffff', 0.75), null);
    hi += gloss(x - w * 0.08, y - w * 0.22, w * 0.12, w * 0.05, 0.7, -10);
  }
  for (let k = 0; k < 14; k++) { const p = [R.range(x0, x1), R.range(y0, y1)]; if (inPoly(p, S)) hi += sparkle(p[0], p[1], R.range(7, 13), '#ffffff', 0.95); }
  return { body: outline + body + hi, bbox };
}
function inPoly([x, y], poly) {
  let c = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i], [xj, yj] = poly[j];
    if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) c = !c;
  }
  return c;
}

// ═══════════════════════ UI BẢN ĐỒ ═══════════════════════
export function lockBadge(P) {
  const L = PAL.purple;
  let b = circle(2, 4, 34, PAL.shadow, null) + circle(0, 0, 34, P.v2('#ffffff', PAL.lavenderLight), ramp(L).line, 3.4) + circle(0, 0, 27, P.sphere(PAL.lavender), ramp(L).line, 2.4);
  // ổ khoá vàng
  const Y = PAL.yellow, Yr = ramp(Y);
  b += stroke('M-9,-4 L-9,-12 Q-9,-22 0,-22 Q9,-22 9,-12 L9,-4', Yr.line, 7) + stroke('M-9,-4 L-9,-12 Q-9,-22 0,-22 Q9,-22 9,-12 L9,-4', '#e6e2ef', 3.4);
  b += rect(-15, -6, 30, 24, 6, P.vgrad(Y), Yr.line, 2.6) + circle(0, 3, 3.6, Yr.line, null) + rect(-1.4, 4, 2.8, 8, 1.2, Yr.line, null);
  b += gloss(-8, -1, 5, 2.4, 0.6) + gloss(-14, -20, 9, 4, 0.5, -30);
  return b;
}
export function unlockedSparkle(P) {
  let b = circle(0, 0, 46, P.glow(PAL.yellowLight, 0.85), null);
  for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; b += sparkle(Math.cos(a) * 30, Math.sin(a) * 30, i % 2 ? 6 : 9, i % 2 ? PAL.yellowLight : '#ffffff', 0.95); }
  b += sparkle(0, 0, 22, '#ffffff', 1) + sparkle(0, 0, 13, PAL.yellow, 1);
  return b;
}
export function mapPin(P, col = PAL.coral) {
  const C = ramp(col);
  let b = ellipse(0, 0, 11, 4, PAL.shadow, null);
  b += shape('M0,-2 C-6,-14 -22,-26 -22,-44 C-22,-58 -12,-66 0,-66 C12,-66 22,-58 22,-44 C22,-26 6,-14 0,-2Z', P.sphere(col), C.line, 3);
  b += circle(0, -44, 11, PAL.white, C.line, 2) + sparkle(0, -44, 8, PAL.yellow, 1);
  b += gloss(-9, -54, 6, 3, 0.6);
  return b;
}
export function compass(P) {
  const G = PAL.yellow, Gr = ramp(G);
  let b = circle(4, 6, 74, PAL.shadow, null);
  b += circle(0, 0, 74, P.v2(PAL.cream, '#f3e2c0'), ramp(PAL.wood).line, 4) + circle(0, 0, 64, 'none', ramp(PAL.wood).lo, 2.4, 'stroke-dasharray="3 7"');
  b += circle(0, 0, 56, P.rad('compass', [[0, '#fffaf0'], [1, '#e8f3fb']], 0.4, 0.35, 0.7), ramp(PAL.wood).line, 2.4);
  // 8 tia
  for (let i = 0; i < 8; i++) {
    const a = -Math.PI / 2 + i * Math.PI / 4, L = i % 2 ? 34 : 52, w = i % 2 ? 7 : 11;
    const tx = Math.cos(a) * L, ty = Math.sin(a) * L, nx = -Math.sin(a) * w, ny = Math.cos(a) * w;
    const c = i === 0 ? PAL.coral : i % 2 ? PAL.lavender : '#9cd2f5';
    b += shape(`M${r2(tx)},${r2(ty)} L${r2(nx)},${r2(ny)} L0,0Z`, lighten(c, 0.2), ramp(c).line, 2);
    b += shape(`M${r2(tx)},${r2(ty)} L${r2(-nx)},${r2(-ny)} L0,0Z`, c, ramp(c).line, 2);
  }
  b += circle(0, 0, 9, P.sphere(G), Gr.line, 2.4) + gloss(-3, -3, 3, 1.6, 0.7);
  // hình tam giác nhỏ chỉ hướng Bắc (không chữ)
  b += shape('M0,-86 L9,-72 L-9,-72Z', PAL.coral, ramp(PAL.coral).line, 2);
  b += gloss(-30, -44, 22, 8, 0.4, -30);
  return b;
}

// ═══════════════════════ TRANG TRÍ ĐỘNG ═══════════════════════
export function cloudSprite(P, i) {
  const spec = [[0, 0, 340, { n: 6, seed: 3, ratio: 0.36 }], [0, 0, 260, { n: 5, seed: 7, ratio: 0.42 }], [0, 0, 200, { n: 4, seed: 11, ratio: 0.45 }]][i];
  return cloud(P, spec[0], spec[1], spec[2], spec[3]);
}
export function sailBoat(P) { return boat(P, 0, 0, 1.25, { hull: PAL.coral, sail2: PAL.yellow, flag: '#58b4e8' }); }

/** Mòng biển — khung f (0..3) vỗ cánh. Tâm khung (0,0). */
export function gull(P, f) {
  const ang = [-38, -12, 14, -12][f];
  const line = ramp(PAL.stone).line;
  const wing = (sgn) => {
    const a = ang * Math.PI / 180, ex = sgn * 26 * Math.cos(a), ey = -26 * Math.sin(a) * 1 - 2;
    const mx = sgn * 12, my = ey * 0.4 - 6;
    return shape(`M${sgn * 4},-2 Q${r2(mx)},${r2(my - 6)} ${r2(ex)},${r2(ey)} Q${r2(mx + sgn * 2)},${r2(my + 6)} ${sgn * 4},4Z`, PAL.white, line, 2) + stroke(`M${r2(ex * 0.75)},${r2(ey * 0.75)} L${r2(ex)},${r2(ey)}`, PAL.stoneDark, 3);
  };
  let b = ellipse(0, 1, 9, 6, P.sphere(PAL.white), line, 2);
  b += wing(-1) + wing(1);
  b += circle(0, -5, 5, PAL.white, line, 1.6) + shape('M3,-5 L10,-3 L3,-2Z', PAL.orange, ramp(PAL.orange).line, 1) + circle(1.5, -6, 1, PAL.ink, null);
  return b;
}
/** Cá voi phun nước — 6 khung. Đáy mặt nước tại y=0 của khung. */
export function whale(P, f) {
  const C = '#6a9fdc', Cr = ramp(C);
  let b = '';
  const rip = (rx, op) => ellipse(0, 0, rx, rx * 0.28, 'none', '#ffffff', 3, `opacity="${op}"`);
  if (f === 0) return rip(26, 0.8) + rip(44, 0.4);
  if (f === 5) return rip(50, 0.5) + rip(70, 0.25) + wave(-30, -2, 16, '#ffffff', 2.4, 0.7);
  const rise = [0, 18, 30, 34, 26][f];
  b += ellipse(0, 2, 70, 14, alpha(PAL.oceanDeep, 0.35), null);
  b += g(shape(`M-60,0 Q-50,${-rise * 1.4} 0,${-rise * 1.5} Q50,${-rise * 1.4} 62,0Z`, P.sphere(C), Cr.line, 3) + (rise > 20 ? circle(30, -rise * 0.8, 3, PAL.ink, null) + ellipse(40, -rise * 0.5, 6, 3, PAL.pink, null, 0, 'opacity="0.8"') : ''), '');
  // đuôi
  if (f >= 2) b += shape('M-60,-2 Q-74,-24 -92,-30 Q-86,-14 -78,-10 Q-90,-4 -96,8 Q-76,4 -60,-2Z', P.vgrad(C), Cr.line, 2.6);
  // vòi nước
  const sp = [0, 0, 26, 54, 40][f];
  if (sp) {
    const top = -rise * 1.5 - sp;
    b += stroke(`M10,${-rise * 1.5} L10,${top + 10}`, '#d8f6fb', 7) + stroke(`M10,${-rise * 1.5} L10,${top + 10}`, '#ffffff', 3);
    for (const [dx, dy, r] of [[-12, 4, 8], [0, -4, 10], [14, 4, 8], [-20, 16, 5], [22, 16, 5]]) b += circle(10 + dx, top + dy + 10, r * sp / 54, '#ffffff', '#bdeffa', 1.6);
  }
  b += wave(-40, 2, 26, '#ffffff', 3) + wave(46, 3, 24, '#ffffff', 3);
  return b;
}
/** Lấp lánh mặt nước — 4 khung */
export function waveSparkle(P, f) {
  const k = [0.35, 0.75, 1, 0.6][f];
  return circle(0, 0, 18 * k, P.glow('#ffffff', 0.6), null) + sparkle(0, 0, 14 * k, '#ffffff', 1) + (f === 2 ? sparkle(12, -9, 5, '#ffffff', 0.9) : '');
}
/** Cá nhảy khỏi mặt nước — 5 khung */
export function fishJump(P, f) {
  const pos = [[-30, 0, 20], [-15, -26, -10], [0, -36, 0], [15, -26, 25], [30, 0, 50]][f];
  let b = '';
  if (f === 0 || f === 4) b += ellipse(pos[0], 0, 16, 4, 'none', '#ffffff', 2.4, 'opacity="0.85"');
  b += g(fish(P, 0, 0, 1, PAL.coral), `translate(${pos[0]},${pos[1] - 4}) rotate(${pos[2] - 20})`);
  if (f === 2) b += circle(-20, -16, 2.4, '#ffffff', null) + circle(-26, -8, 2, '#ffffff', null);
  return b;
}

// ═══════════════════════ ĐƯỜNG ĐI & CẦU ═══════════════════════
export function footprints(P) {
  const c = '#d9ae76';
  const paw = (x, y) => ellipse(x, y, 5, 6, c, null) + circle(x - 5, y - 7, 2, c, null) + circle(x, y - 9, 2.2, c, null) + circle(x + 5, y - 7, 2, c, null);
  return paw(-6, 6) + paw(7, -6);
}
export function pathDash(P) { return rect(-9, -4, 18, 8, 4, '#f1d6a1', '#c99a62', 2); }
export function bridgeWood(P) { return bridge(P, -70, 0, 70, 0, 34, { lw: 3, arch: 10 }); }
export function bridgeStone(P) {
  const st = PAL.stoneLight, S = ramp(st);
  let b = `<path d="M-80,6 Q0,-30 80,6 L80,18 Q0,-16 -80,18Z" fill="${PAL.shadow}"/>`;
  b += shape('M-80,-6 Q0,-40 80,-6 L80,10 L56,10 Q0,-22 -56,10 L-80,10Z', P.vgrad(st), S.line, 3);
  for (const x of [-60, -36, -12, 12, 36, 60]) { const y = -6 - 34 * (1 - (x / 80) ** 2) * 0.85; b += rect(x - 10, y - 6, 20, 10, 3, lighten(st, 0.12), S.line, 1.4); }
  b += shape('M-82,-14 Q0,-48 82,-14', 'none', S.line, 5) + shape('M-82,-14 Q0,-48 82,-14', 'none', st, 2.6);
  return b;
}
/** Đám mây chuyển cảnh lớn (khối mây bông phủ gần kín, mép phồng). Tâm (0,0). */
export function cloudTransition(P, w = 2200, h = 1300) {
  const R = rng(99);
  const fill = P.lin('ctr', [[0, '#ffffff'], [0.7, '#fbf8ff'], [1, PAL.lavenderLight]]);
  const line = mix(PAL.lavender, PAL.purple, 0.2);
  const puffs = [];
  const n = 26;
  for (let i = 0; i < n; i++) {
    const a = i / n * Math.PI * 2;
    puffs.push([Math.cos(a) * w * 0.4 + R.range(-30, 30), Math.sin(a) * h * 0.38 + R.range(-30, 30), R.range(150, 230)]);
  }
  let b = '';
  for (const [x, y, r] of puffs) b += circle(x, y + 16, r, alpha(PAL.purple, 0.12), null);
  for (const [x, y, r] of puffs) b += circle(x, y, r + 7, line, null);
  b += ellipse(0, 0, w * 0.42, h * 0.4, line, null);
  for (const [x, y, r] of puffs) b += circle(x, y, r, fill, null);
  b += ellipse(0, 0, w * 0.41, h * 0.39, fill, null);
  for (let i = 0; i < 9; i++) { const x = R.range(-w * 0.3, w * 0.3), y = R.range(-h * 0.25, h * 0.25), r = R.range(110, 200); b += circle(x, y, r, alpha('#ffffff', 0.7), null) + gloss(x - r * 0.3, y - r * 0.45, r * 0.35, r * 0.12, 0.6, -10); }
  for (let i = 0; i < 16; i++) b += sparkle(R.range(-w * 0.35, w * 0.35), R.range(-h * 0.3, h * 0.3), R.range(10, 22), i % 3 ? '#ffffff' : PAL.yellowLight, 0.9);
  return b;
}
