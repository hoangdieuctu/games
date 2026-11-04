// ── Mốc vùng (phần B): Thị Trấn Sáng Tạo, Làng Kỹ Năng, Đại Dương Phiêu Lưu, Đảo Nhà ──
// Toạ độ cục bộ: ĐẾ của mốc tại (0,0), y âm hướng lên.
import {
  PAL, ramp, lighten, darken, mix, alpha, rng, smoothPath, blob, blobPoints, shape, stroke, circle, ellipse, rect, r2, g,
  tree, pine, palm, bush, rock, flower, mushroom, house, fence, sparkle, wave, groundShadow, gloss, puffPath,
  win, door, gableRoof, bunting, lantern, mist,
} from './world-kit.mjs';
import { pond } from './world-landmarks-a.mjs';

const LW = 3;
const BLUE = '#58b4e8', TEAL = '#5cc7c0';

/** Khối nhà chữ nhật có mái tuỳ kiểu (dùng cho các toà nhà lớn). (x,y)=giữa đế */
function building(P, x, y, w, h, wall, roof, o = {}) {
  const Wl = ramp(wall);
  let b = o.noShadow ? '' : groundShadow(x + 8, y, w * 0.6, 9);
  b += rect(x - w / 2, y - h, w, h, 6, P.vgrad(wall), Wl.line, LW);
  if (o.trim) b += rect(x - w / 2, y - 10, w, 10, 3, darken(wall, 0.12), Wl.line, LW * 0.6);
  const rh = o.rh ?? h * 0.55;
  if (o.roofStyle === 'flat') b += rect(x - w / 2 - 6, y - h - 12, w + 12, 16, 5, P.vgrad(roof), ramp(roof).line, LW);
  else if (o.roofStyle === 'dome') b += shape(`M${x - w / 2 - 4},${y - h + 2} Q${x - w / 2 - 4},${y - h - rh * 1.25} ${x},${y - h - rh * 1.3} Q${x + w / 2 + 4},${y - h - rh * 1.25} ${x + w / 2 + 4},${y - h + 2} Q${x},${y - h + 8} ${x - w / 2 - 4},${y - h + 2}Z`, P.sphere(roof), ramp(roof).line, LW);
  else b += gableRoof(P, x - w / 2, y - h, w, rh, roof, LW, o.ov ?? 9);
  return b;
}

// ═══════════════════════ THỊ TRẤN SÁNG TẠO ═══════════════════════
export function artStudio(P) {
  let b = groundShadow(10, -2, 116, 22);
  // toà tròn
  b += rect(-80, -112, 160, 112, 20, P.vgrad(PAL.pinkLight), ramp(PAL.pink).line, LW);
  b += rect(-80, -14, 160, 14, 6, PAL.pink, ramp(PAL.pink).line, LW * 0.7);
  b += win(-64, -90, 30, 34, 2.4, { arch: true, lit: true }) + win(34, -90, 30, 34, 2.4, { arch: true, lit: true }) + door(P, 0, -2, 34, 56, PAL.purple, LW * 0.9);
  // vết sơn trên tường
  for (const [x, y, c] of [[-50, -36, PAL.yellow], [46, -40, BLUE], [-24, -104, PAL.mint]]) b += shape(puffPath(x, y, 9, 6, 6, 0.3, x), c, ramp(c).line, 1.6);
  // mái hình bảng màu
  const pal = `M-104,-104 C-112,-170 -40,-206 18,-200 C80,-196 118,-160 106,-120 C98,-96 60,-104 50,-112 C38,-122 22,-108 30,-98 C38,-86 10,-82 -20,-86 C-60,-90 -100,-86 -104,-104Z`;
  b += shape(pal, P.vgrad('#f6d3a6'), ramp(PAL.woodLight).line, LW + 0.5);
  b += ellipse(36, -112, 12, 8, PAL.pinkLight, ramp(PAL.woodLight).line, 2);
  for (const [x, y, c] of [[-70, -128, PAL.coral], [-40, -160, PAL.yellow], [0, -176, '#6cc46a'], [44, -168, BLUE], [80, -140, PAL.purple], [-6, -130, PAL.rose]]) b += circle(x, y, 13, P.sphere(c), ramp(c).line, 2.2) + gloss(x - 4, y - 5, 4, 2, 0.6);
  // cọ vẽ khổng lồ dựng nghiêng
  b += g(rect(-6, -150, 12, 130, 5, P.vgrad(PAL.woodLight), ramp(PAL.woodLight).line, 2.4) + rect(-8, -170, 16, 22, 3, P.vgrad(PAL.stoneLight), ramp(PAL.stone).line, 2.2) + shape('M-9,-170 Q-12,-200 0,-216 Q12,-200 9,-170Z', P.vgrad(PAL.coral), ramp(PAL.coral).line, 2.4), 'translate(104,2) rotate(14)');
  // giá vẽ & vũng sơn
  b += ellipse(-104, 10, 18, 6, alpha(BLUE, 0.7), null) + ellipse(-86, 16, 12, 4, alpha(PAL.yellow, 0.8), null);
  b += stroke('M-116,8 L-106,-40 M-92,8 L-102,-40', PAL.woodDark, 3) + rect(-124, -60, 36, 30, 3, PAL.white, ramp(PAL.woodDark).line, 2.2) + circle(-112, -48, 5, PAL.coral, null) + circle(-100, -42, 5, PAL.mint, null) + circle(-102, -52, 4, BLUE, null);
  return b;
}

export function townHouses(P) {
  let b = groundShadow(0, -2, 160, 22);
  const H = [
    [-115, 66, 120, PAL.yellowLight, PAL.rose, 'gable'], [-45, 58, 150, '#d7f0ff', PAL.purple, 'gable'], [22, 62, 132, '#e4f6d6', PAL.orangeDeep, 'dome'],
    [92, 64, 110, PAL.lavenderLight, BLUE, 'gable'],
  ];
  for (const [x, w, h, wall, roof, st] of H) {
    b += building(P, x, 0, w, h, wall, roof, { roofStyle: st, rh: st === 'dome' ? 30 : 46, noShadow: true, ov: 6 });
    for (let r = 0; r < Math.floor((h - 50) / 34); r++) b += win(x - w / 2 + 10, -h + 16 + r * 34, 16, 18, 2) + win(x + w / 2 - 26, -h + 16 + r * 34, 16, 18, 2, { lit: r % 2 === 0 });
    b += door(P, x, -2, 20, 34, darken(roof, 0.05), LW * 0.8);
    b += rect(x - w / 2 + 8, -h + 2, w - 16, 7, 3, alpha('#ffffff', 0.35), null);
  }
  // mái hiên sọc + hộp hoa
  b += shape('M-150,-54 L-80,-54 L-86,-38 L-144,-38Z', P.vgrad(PAL.coral), ramp(PAL.coral).line, 2.4);
  for (let i = 0; i < 4; i++) b += rect(-146 + i * 16, -54, 8, 16, 1, PAL.white, null, 0, 'opacity="0.85"');
  for (const x of [-60, 108]) b += rect(x - 12, -66, 24, 8, 3, PAL.woodLight, ramp(PAL.wood).line, 1.8) + circle(x - 6, -68, 4, PAL.pink, null) + circle(x + 4, -69, 4, PAL.yellow, null);
  b += bunting(-140, -112, -18, -138, 8) + bunting(-18, -138, 120, -104, 8, [BLUE, PAL.yellow, PAL.pink, PAL.mint]);
  b += tree(P, -150, 14, 0.9, { color: '#f7a9c0', blossom: PAL.pinkLight, seed: 3 }) + bush(P, 140, 14, 1, { flower: PAL.yellow });
  b += lampPost(P, 58, 18);
  return b;
}
function lampPost(P, x, y) {
  return groundShadow(x + 3, y, 9, 3) + rect(x - 2, y - 52, 4, 52, 2, PAL.purple, ramp(PAL.purple).line, 1.6) + circle(x, y - 58, 16, P.glow(PAL.yellowLight, 0.8), null) + circle(x, y - 58, 7, PAL.yellowLight, ramp(PAL.yellow).line, 1.8);
}

export function crane(P) {
  const Y = '#ffc94d', Yr = ramp(Y);
  let b = groundShadow(0, -2, 120, 20);
  // nhà đang xây + giàn giáo
  b += rect(-20, -96, 110, 96, 4, P.vgrad(PAL.peach), ramp(PAL.peach).line, LW);
  for (let r = 0; r < 3; r++) for (let c = 0; c < 4; c++) b += rect(-12 + c * 26, -88 + r * 30, 18, 4, 1, ramp(PAL.peach).lo, null);
  b += win(4, -60, 18, 18, 2) + win(52, -60, 18, 18, 2);
  for (const x of [-30, 20, 70, 100]) b += stroke(`M${x},0 L${x},-120`, '#8c7fa8', 4);
  for (const y of [-40, -80, -118]) b += stroke(`M-34,${y} L104,${y}`, '#8c7fa8', 4) + rect(-34, y - 3, 138, 6, 2, P.vgrad(PAL.woodLight), ramp(PAL.woodLight).line, 1.6);
  b += stroke('M-30,0 L20,-40 M20,0 L70,-40 M-30,-40 L20,-80', '#8c7fa8', 2.2, 'opacity="0.7"');
  // cần cẩu
  const mx = -70;
  b += rect(mx - 12, -250, 24, 250, 3, 'none', Yr.line, LW);
  b += rect(mx - 12, -250, 24, 250, 3, alpha(Y, 0.25), null);
  for (let y = -240; y < 0; y += 22) b += stroke(`M${mx - 12},${y} L${mx + 12},${y + 22} M${mx + 12},${y} L${mx - 12},${y + 22}`, Y, 3) + stroke(`M${mx - 12},${y} L${mx + 12},${y}`, Yr.line, 2);
  b += stroke(`M${mx - 12},-250 L${mx - 12},0 M${mx + 12},-250 L${mx + 12},0`, Yr.line, 6) + stroke(`M${mx - 12},-250 L${mx - 12},0 M${mx + 12},-250 L${mx + 12},0`, Y, 3);
  // cần ngang
  b += rect(mx - 46, -268, 196, 16, 4, P.vgrad(Y), Yr.line, LW);
  for (let x = mx - 40; x < mx + 146; x += 16) b += stroke(`M${x},-266 L${x + 8},-254`, Yr.line, 1.6);
  b += rect(mx - 54, -264, 22, 20, 4, P.vgrad(PAL.stoneDark), ramp(PAL.stoneDark).line, 2.4);
  b += rect(mx - 16, -292, 32, 26, 5, P.vgrad(BLUE), ramp(BLUE).line, 2.4) + rect(mx - 10, -286, 20, 12, 3, '#d7f0ff', null);
  // cáp + khối gạch
  b += stroke(`M${mx + 120},-252 L${mx + 120},-170`, PAL.ink, 1.6) + rect(mx + 104, -170, 32, 22, 3, P.vgrad(PAL.coral), ramp(PAL.coral).line, 2.2) + stroke(`M${mx + 104},-159 L${mx + 136},-159 M${mx + 120},-170 L${mx + 120},-159`, ramp(PAL.coral).lo, 1.6);
  // cọc giao thông & khối
  for (const x of [-110, 112]) b += shape(`M${x - 8},6 L${x - 2},-20 L${x + 2},-20 L${x + 8},6Z`, P.vgrad(PAL.orange), ramp(PAL.orange).line, 2) + rect(x - 6, -10, 12, 4, 1, PAL.white, null);
  b += rect(-124, -14, 30, 16, 3, P.vgrad('#9cd2f5'), ramp('#9cd2f5').line, 2) + rect(-118, -28, 22, 14, 3, P.vgrad(PAL.yellow), ramp(PAL.yellow).line, 2);
  return b;
}

export function workshop(P) {
  let b = building(P, 0, 0, 150, 84, PAL.woodLight, '#6cc46a', { rh: 50 });
  for (let y = -72; y < -6; y += 12) b += stroke(`M-70,${y} L70,${y}`, ramp(PAL.woodLight).lo, 2);
  // cửa cuốn mở
  b += rect(-50, -62, 64, 62, 4, '#6b5570', ramp(PAL.woodDark).line, LW * 0.8) + rect(-50, -62, 64, 16, 3, P.vgrad('#a3c4e8'), ramp('#a3c4e8').line, 2);
  b += rect(-40, -30, 44, 8, 2, PAL.woodLight, null) + rect(-36, -22, 4, 22, 1, PAL.woodLight, null) + rect(-2, -22, 4, 22, 1, PAL.woodLight, null);
  b += win(30, -62, 26, 22, 2.4, { lit: true });
  // biển hình bánh răng
  const gx = 0, gy = -148, R1 = 22, R2 = 16;
  let gd = '';
  for (let i = 0; i < 16; i++) { const a = i / 16 * Math.PI * 2, r = i % 2 ? R2 : R1; gd += `${i ? 'L' : 'M'}${r2(gx + Math.cos(a) * r)},${r2(gy + Math.sin(a) * r)} `; }
  b += shape(gd + 'Z', P.sphere(PAL.yellow), ramp(PAL.yellow).line, 2.4) + circle(gx, gy, 7, PAL.cream, ramp(PAL.yellow).line, 2);
  // củi & cưa
  for (let i = 0; i < 3; i++) b += ellipse(90, -8 - i * 12, 14, 7, P.vgrad(PAL.wood), ramp(PAL.wood).line, 2) + ellipse(80, -8 - i * 12, 5, 6, PAL.woodLight, ramp(PAL.wood).line, 1.4);
  b += g(rect(-4, -40, 8, 34, 3, PAL.wood, ramp(PAL.wood).line, 1.6) + rect(-14, -52, 28, 14, 4, P.vgrad(PAL.stoneLight), ramp(PAL.stone).line, 2), 'translate(-92,6) rotate(-18)');
  return b;
}

// ═══════════════════════ LÀNG KỸ NĂNG ═══════════════════════
export function school(P) {
  let b = groundShadow(10, -2, 140, 24);
  // sân trường
  b += ellipse(0, 6, 120, 18, '#f3ddb0', '#d9b27a', 2);
  // cánh nhà
  b += building(P, -82, -2, 80, 80, PAL.cream, PAL.coral, { rh: 40, noShadow: true });
  b += building(P, 82, -2, 80, 80, PAL.cream, PAL.coral, { rh: 40, noShadow: true });
  for (const x of [-112, -72, 52, 92]) b += win(x, -64, 20, 22, 2.2, { lit: x % 3 === 0 });
  // khối giữa + tháp chuông
  b += rect(-48, -128, 96, 126, 6, P.vgrad(PAL.peach), ramp(PAL.peach).line, LW);
  b += gableRoof(P, -48, -128, 96, 50, PAL.orangeDeep, LW, 10);
  b += rect(-18, -210, 36, 40, 4, P.vgrad(PAL.cream), ramp(PAL.cream).line, LW * 0.8) + shape('M-26,-206 L0,-240 L26,-206Z', P.vgrad(PAL.coral), ramp(PAL.coral).line, LW * 0.8);
  b += shape('M-8,-180 Q-8,-200 0,-200 Q8,-200 8,-180Z', P.sphere(PAL.yellow), ramp(PAL.yellow).line, 2);
  // đồng hồ (không chữ số)
  b += circle(0, -100, 16, PAL.white, ramp(PAL.peach).line, 2.6) + stroke('M0,-100 L0,-110 M0,-100 L7,-96', PAL.ink, 2.4);
  for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2; b += circle(Math.cos(a) * 12, -100 + Math.sin(a) * 12, 1.6, PAL.ink, null); }
  b += door(P, 0, -2, 34, 50, PAL.woodDark, LW * 0.9);
  b += rect(-34, -6, 68, 6, 2, PAL.stoneLight, ramp(PAL.stone).line, 1.6);
  // cột cờ
  b += rect(128, -130, 4, 132, 2, PAL.stoneDark, null) + shape('M132,-128 L162,-120 L132,-110Z', P.vgrad(PAL.yellow), ramp(PAL.yellow).line, 2) + groundShadow(132, 2, 10, 3);
  // ba lô & sách? → cây hai bên
  b += tree(P, -138, 16, 1, { color: PAL.leaf, seed: 6 }) + bush(P, 108, 18, 0.9, { flower: PAL.pink });
  return b;
}

export function grocery(P) {
  let b = building(P, 0, 0, 170, 96, '#e4f6d6', '#6cc46a', { rh: 46, trim: true });
  // mái hiên sọc
  const aw = 'M-92,-84 L92,-84 L100,-60 Q86,-52 75,-60 Q62,-52 50,-60 Q38,-52 25,-60 Q12,-52 0,-60 Q-12,-52 -25,-60 Q-38,-52 -50,-60 Q-62,-52 -75,-60 Q-86,-52 -100,-60Z';
  b += shape(aw, P.vgrad(PAL.white), ramp(PAL.coral).line, LW);
  let stripes = '';
  for (let i = 0; i < 8; i += 2) stripes += rect(-100 + i * 25, -90, 25, 40, 0, PAL.coral, null);
  b += g(stripes, '', `clip-path="${P.clip(`<path d="${aw}"/>`)}"`);
  b += shape(aw, 'none', ramp(PAL.coral).line, LW);
  b += win(-74, -50, 44, 30, 2.4, { lit: true }) + win(30, -50, 44, 30, 2.4, { lit: true }) + door(P, 0, -2, 26, 46, PAL.woodDark, LW * 0.8);
  // biển hình quả táo
  b += circle(0, -118, 16, P.sphere(PAL.coral), ramp(PAL.coral).line, 2.4) + shape('M0,-134 Q6,-146 14,-142 Q8,-134 0,-134Z', PAL.leaf, PAL.leafDark, 1.6) + gloss(-5, -123, 5, 3, 0.6);
  // thùng trái cây
  const crate = (x, y, c) => rect(x - 18, y - 16, 36, 16, 3, P.vgrad(PAL.woodLight), ramp(PAL.wood).line, 2) + [-10, 0, 10].map((dx) => circle(x + dx, y - 18, 6, P.sphere(c), ramp(c).line, 1.4)).join('');
  b += crate(-110, 14, PAL.orange) + crate(-72, 18, '#9be06a') + crate(78, 18, PAL.coral) + crate(114, 12, PAL.yellow);
  // xe đẩy
  b += stroke('M40,16 L48,-8 L70,-8', '#8c7fa8', 3) + rect(48, -10, 22, 14, 3, 'none', '#8c7fa8', 2.4) + circle(52, 18, 3.5, PAL.ink, null) + circle(66, 18, 3.5, PAL.ink, null);
  return b;
}

export function kitchen(P) {
  let b = building(P, 0, 0, 140, 90, PAL.cream, PAL.orangeDeep, { rh: 56 });
  // ống khói & khói
  b += rect(34, -168, 22, 44, 4, P.vgrad(PAL.stoneLight), ramp(PAL.stone).line, LW * 0.8) + rect(30, -172, 30, 10, 3, PAL.stone, ramp(PAL.stone).line, 2);
  for (const [x, y, r] of [[46, -186, 10], [36, -204, 13], [50, -226, 15]]) b += circle(x, y, r, '#ffffff', ramp(PAL.lavenderLight).line, 1.6, 'opacity="0.9"');
  // cửa sổ có bánh
  b += win(-56, -62, 38, 28, 2.4, { lit: true }) + door(P, 30, -2, 30, 50, PAL.wood, LW * 0.8);
  b += ellipse(-37, -36, 16, 5, P.vgrad(PAL.orange), ramp(PAL.orange).line, 1.6) + rect(-60, -34, 46, 4, 2, PAL.white, null);
  // biển hình nồi
  b += shape('M-24,-128 L24,-128 L20,-108 Q0,-100 -20,-108Z', P.vgrad(PAL.stoneDark), ramp(PAL.stoneDark).line, 2.4) + rect(-30, -132, 60, 6, 3, PAL.stone, ramp(PAL.stone).line, 1.6) + stroke('M-6,-140 Q-10,-148 -4,-154 M6,-140 Q2,-148 8,-154', '#ffffff', 2.2);
  // bàn ngoài trời
  b += ellipse(-96, 2, 22, 7, P.vgrad(PAL.woodLight), ramp(PAL.wood).line, 2) + rect(-98, 2, 4, 14, 1, PAL.wood, null) + circle(-102, -4, 4, PAL.coral, null) + circle(-90, -5, 4, PAL.white, ramp(PAL.stone).line, 1);
  b += bush(P, 86, 14, 0.9, { flower: PAL.yellow });
  return b;
}

export function playground(P) {
  let b = ellipse(0, -30, 128, 50, '#f6e0ae', '#d9b27a', 2.6);
  // cầu trượt
  b += stroke('M-90,-10 L-90,-96 M-60,-10 L-60,-96', '#8c7fa8', 5) + rect(-96, -100, 42, 8, 3, PAL.yellow, ramp(PAL.yellow).line, 2);
  for (let y = -84; y < -10; y += 14) b += stroke(`M-90,${y} L-60,${y}`, '#8c7fa8', 3);
  b += shape('M-56,-100 Q-20,-96 -8,-30 Q-4,-10 14,-8 L14,4 Q-14,6 -22,-24 Q-30,-80 -56,-88Z', P.vgrad(PAL.coral), ramp(PAL.coral).line, LW);
  b += shape('M-96,-100 L-75,-126 L-54,-100Z', P.vgrad(BLUE), ramp(BLUE).line, 2.4);
  // xích đu
  b += stroke('M30,0 L50,-90 L70,0 M100,0 L120,-90 L140,0', PAL.purple, 5) + stroke('M50,-90 L120,-90', PAL.purple, 6);
  b += stroke('M70,-88 L70,-30 M84,-88 L84,-30 M96,-88 L96,-24 M110,-88 L110,-24', PAL.stoneDark, 1.6) + rect(66, -32, 22, 6, 2, PAL.coral, ramp(PAL.coral).line, 1.6) + rect(92, -26, 22, 6, 2, PAL.yellow, ramp(PAL.yellow).line, 1.6);
  // bập bênh & hố cát
  b += rect(-40, -36, 70, 7, 3, P.vgrad(PAL.mint), ramp(PAL.mint).line, 2, 'transform="rotate(-10 -5 -32)"') + shape('M-12,-24 L-5,-36 L2,-24Z', PAL.purple, ramp(PAL.purple).line, 1.6);
  b += rect(-20, -4, 60, 20, 8, '#f6d89a', '#d9b27a', 2.4) + shape('M0,6 Q8,-6 16,6Z', '#e8c27a', null, 0) + rect(24, -2, 8, 6, 2, PAL.coral, null);
  b += groundShadow(-74, 2, 26, 6, 0.6) + groundShadow(85, 4, 60, 8, 0.6);
  b += tree(P, 126, 22, 0.9, { color: PAL.leaf, seed: 8 }) + bush(P, -124, 20, 0.9, { flower: PAL.pink });
  return b;
}

export function communityGarden(P) {
  let b = rect(-130, -100, 260, 104, 22, P.vgrad('#c8e88f', 0.4), darken('#c8e88f', 0.35), LW);
  const bed = (x, y, w, crop) => {
    let m = rect(x - w / 2, y - 22, w, 22, 6, P.vgrad(PAL.wood), ramp(PAL.wood).line, 2.4) + rect(x - w / 2 + 4, y - 22, w - 8, 10, 4, PAL.soilDark, null);
    for (let i = 0; i < Math.floor(w / 20); i++) {
      const cx = x - w / 2 + 12 + i * 20, cy = y - 20;
      if (crop === 'carrot') m += shape(`M${cx - 3},${cy} L${cx + 3},${cy} L${cx},${cy + 8}Z`, PAL.orangeDeep, null, 0) + stroke(`M${cx},${cy} L${cx - 4},${cy - 10} M${cx},${cy} L${cx + 4},${cy - 10} M${cx},${cy} L${cx},${cy - 12}`, PAL.leaf, 2.4);
      else if (crop === 'cabbage') m += circle(cx, cy - 4, 8, P.sphere('#9be06a'), ramp('#9be06a').line, 1.6) + stroke(`M${cx - 4},${cy - 4} Q${cx},${cy - 10} ${cx + 4},${cy - 4}`, ramp('#9be06a').lo, 1.4);
      else m += stroke(`M${cx},${cy} L${cx},${cy - 22}`, PAL.woodLight, 2) + circle(cx - 4, cy - 12, 5, P.sphere(PAL.coral), ramp(PAL.coral).line, 1.2) + circle(cx + 4, cy - 18, 4.5, P.sphere(PAL.coral), ramp(PAL.coral).line, 1.2) + ellipse(cx, cy - 6, 6, 3, PAL.leaf, null);
    }
    return m;
  };
  b += bed(-60, -62, 110, 'cabbage') + bed(64, -62, 100, 'tomato') + bed(-60, -18, 110, 'carrot') + bed(64, -18, 100, 'cabbage');
  // bù nhìn & bình tưới
  b += stroke('M126,-6 L126,-80 M106,-62 L146,-62', PAL.woodDark, 4) + circle(126, -88, 12, P.sphere(PAL.peach), ramp(PAL.peach).line, 2) + shape('M110,-94 L142,-94 L134,-108 L118,-108Z', P.vgrad('#f2c75c'), ramp('#f2c75c').line, 2) + rect(114, -68, 24, 26, 5, P.vgrad(BLUE), ramp(BLUE).line, 2);
  b += circle(121, -90, 1.6, PAL.ink, null) + circle(131, -90, 1.6, PAL.ink, null);
  b += shape('M-130,8 L-104,8 L-106,-12 L-128,-12Z', P.vgrad(TEAL), ramp(TEAL).line, 2) + stroke('M-106,-8 L-92,-20', ramp(TEAL).line, 3);
  b += fence(P, -136, 12, 136, 12, 1.1);
  return b;
}

// ═══════════════════════ ĐẠI DƯƠNG PHIÊU LƯU ═══════════════════════
export function submarineDock(P) {
  let b = '';
  // cầu tàu gỗ
  b += rect(-130, -46, 150, 26, 4, P.vgrad(PAL.woodLight), ramp(PAL.woodLight).line, LW);
  for (let x = -120; x < 20; x += 14) b += stroke(`M${x},-44 L${x},-22`, ramp(PAL.woodLight).lo, 1.6);
  for (const x of [-124, -70, -16]) b += rect(x - 4, -24, 8, 24, 2, PAL.woodDark, ramp(PAL.woodDark).line, 1.6) + wave(x, 2, 18, '#ffffff', 2.2);
  // tàu ngầm vàng
  const Y = '#ffd34d', Yr = ramp(Y);
  b += ellipse(70, 0, 80, 14, alpha(PAL.oceanDeep, 0.35), null);
  b += shape('M10,-30 Q10,-62 60,-62 L96,-62 Q132,-62 132,-30 Q132,-4 96,-4 L50,-4 Q10,-4 10,-30Z', P.sphere(Y), Yr.line, LW);
  b += rect(52, -86, 36, 26, 8, P.vgrad(Y), Yr.line, LW * 0.9) + stroke('M80,-86 L80,-104 L94,-104', Yr.line, 4) + stroke('M80,-86 L80,-104 L94,-104', '#bdb8ca', 2);
  for (const x of [40, 72, 104]) b += circle(x, -32, 9, '#bdeffa', Yr.line, 2.4) + circle(x - 3, -35, 3, '#ffffff', null);
  b += shape('M132,-30 L150,-46 L150,-14Z', P.vgrad(PAL.orange), ramp(PAL.orange).line, 2.4);
  b += gloss(40, -54, 16, 5, 0.55, -8);
  b += wave(30, 0, 30, '#ffffff', 3) + wave(110, 2, 30, '#ffffff', 3);
  // phao cứu sinh & hộp
  b += circle(-100, -58, 12, 'none', PAL.coral, 6) + circle(-100, -58, 12, 'none', '#ffffff', 2, 'stroke-dasharray="5 7"');
  b += rect(-60, -66, 28, 20, 3, P.vgrad(PAL.wood), ramp(PAL.wood).line, 2) + rect(-48, -62, 4, 12, 1, PAL.yellow, null);
  for (const [x, y] of [[150, -80], [160, -100], [140, -108]]) b += circle(x, y, 4, 'none', '#ffffff', 1.8, 'opacity="0.9"');
  return b;
}

export function coralReef(P) {
  let b = shape(blob(0, -40, 140, 50, 10, 0.12, 4), alpha('#8fe6df', 0.6), alpha('#ffffff', 0.7), 3, 'stroke-dasharray="12 10"');
  const items = [];
  const F = rng(9);
  for (let i = 0; i < 22; i++) { const a = F() * Math.PI * 2, k = Math.sqrt(F()); items.push([Math.cos(a) * 118 * k, -40 + Math.sin(a) * 38 * k, F.pick([PAL.coral, PAL.pink, PAL.orange, PAL.lavender, PAL.yellow, PAL.rose, '#ff9fd0']), F.int(0, 3), F.range(1, 1.5)]); }
  items.sort((p, q) => p[1] - q[1]);
  for (const [x, y, c, k, s] of items) {
    const L = darken(c, 0.4);
    if (k === 0) for (const [dx, h, bend] of [[-7, 18, -7], [0, 26, 2], [7, 17, 8]]) b += stroke(`M${r2(x)},${r2(y)} Q${r2(x + dx * s)},${r2(y - h * 0.5 * s)} ${r2(x + (dx + bend) * s)},${r2(y - h * s)}`, L, 8.5 * s) + stroke(`M${r2(x)},${r2(y)} Q${r2(x + dx * s)},${r2(y - h * 0.5 * s)} ${r2(x + (dx + bend) * s)},${r2(y - h * s)}`, c, 5 * s);
    else if (k === 1) b += ellipse(x, y - 8 * s, 14 * s, 10 * s, P.sphere(c), L, 2.4) + stroke(`M${r2(x - 8 * s)},${r2(y - 8 * s)} q${r2(4 * s)},${r2(-6 * s)} ${r2(8 * s)},0 t${r2(8 * s)},0`, L, 1.8);
    else if (k === 2) b += stroke(`M${r2(x)},${r2(y)} q${r2(-6 * s)},${r2(-10 * s)} 0,${r2(-18 * s)} t0,${r2(-18 * s)}`, '#4fae7f', 6 * s) + stroke(`M${r2(x)},${r2(y)} q${r2(-6 * s)},${r2(-10 * s)} 0,${r2(-18 * s)} t0,${r2(-18 * s)}`, '#7fd6a0', 3.4 * s);
    else b += shape(starD(x, y - 4, 9 * s, 4 * s), P.vgrad(PAL.orange), ramp(PAL.orange).line, 1.8);
  }
  // cá nhỏ & rùa
  b += fish(P, -60, -110, 1, PAL.yellow) + fish(P, 40, -118, 0.9, BLUE, true) + fish(P, 96, -90, 0.8, PAL.coral);
  b += turtle(P, -100, -40);
  for (const [x, y, r] of [[-20, -120, 4], [-14, -134, 3], [60, -140, 3.5]]) b += circle(x, y, r, 'none', '#ffffff', 1.8);
  return b;
}
function starD(x, y, R, r) {
  let d = '';
  for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r : R; d += `${i ? 'L' : 'M'}${r2(x + Math.cos(a) * rr)},${r2(y + Math.sin(a) * rr)} `; }
  return d + 'Z';
}
export function fish(P, x, y, s, c, flip = false) {
  const C = ramp(c);
  const body = shape(`M${-14 * s},0 Q${-4 * s},${-11 * s} ${10 * s},${-2 * s} Q${14 * s},0 ${10 * s},${2 * s} Q${-4 * s},${11 * s} ${-14 * s},0Z`, P.sphere(c), C.line, 2) + shape(`M${-12 * s},0 L${-22 * s},${-8 * s} L${-21 * s},${8 * s}Z`, c, C.line, 1.8) + circle(5 * s, -2 * s, 1.8 * s, PAL.ink, null);
  return g(body, `translate(${x},${y})${flip ? ' scale(-1,1)' : ''}`);
}
function turtle(P, x, y) {
  return ellipse(x - 18, y - 2, 6, 4, '#8fd16f', PAL.leafDark, 1.6) + ellipse(x + 14, y + 6, 6, 4, '#8fd16f', PAL.leafDark, 1.6) + ellipse(x + 14, y - 10, 6, 4, '#8fd16f', PAL.leafDark, 1.6) + circle(x - 22, y - 12, 6, P.sphere('#8fd16f'), PAL.leafDark, 1.6) +
    ellipse(x, y - 4, 16, 12, P.sphere('#6fb85f'), PAL.leafDark, 2.2) + stroke(`M${x - 6},${y - 12} L${x - 6},${y + 4} M${x + 6},${y - 12} L${x + 6},${y + 4} M${x - 14},${y - 4} L${x + 14},${y - 4}`, PAL.leafDark, 1.4) + circle(x - 24, y - 13, 1.2, PAL.ink, null);
}

export function seaCave(P) {
  const st = '#b8aed0', S = ramp(st);
  let b = ellipse(0, -6, 150, 26, alpha(PAL.oceanDeep, 0.3), null);
  // khối đá vòm
  b += shape('M-140,-6 C-150,-90 -110,-176 -30,-190 C40,-200 120,-160 138,-90 C146,-50 140,-20 132,-6 Q0,6 -140,-6Z', P.lin('cave', [[0, lighten(st, 0.3)], [0.55, st], [1, mix(st, PAL.purple, 0.3)]], 0, 0, 0.5, 1), S.line, LW + 1);
  // miệng hang
  b += shape('M-54,-4 Q-62,-90 0,-104 Q62,-96 58,-4 Q0,4 -54,-4Z', P.lin('caveIn', [[0, '#4a3f6e'], [0.7, '#2f6fae'], [1, '#3d8ccc']], 0, 0, 0, 1), S.line, LW);
  b += ellipse(0, -40, 36, 40, P.glow('#7ff0e0', 0.7), null);
  for (const [x, y] of [[-14, -52], [12, -70], [20, -36]]) b += circle(x, y, 4, '#c9fff0', null, 0, 'opacity="0.9"');
  // nhũ đá
  for (const x of [-34, -14, 10, 32]) b += shape(`M${x - 6},${-98 + Math.abs(x) * 0.5} L${x},${-78 + Math.abs(x) * 0.5} L${x + 6},${-98 + Math.abs(x) * 0.5}Z`, st, S.line, 1.6);
  // gờ đá, rêu, sao biển
  for (const [x, y, rx, ry, sd] of [[-100, -110, 28, 22, 1], [90, -120, 26, 20, 2], [-110, -46, 24, 26, 3], [104, -50, 22, 26, 4]]) b += shape(blob(x, y, rx, ry, 7, 0.14, sd), P.vgrad(lighten(st, 0.15)), S.line, LW * 0.7);
  b += shape(puffPath(-20, -188, 70, 16, 8, 0.2, 5), P.vgrad(PAL.grass), ramp(PAL.grass).line, LW * 0.9);
  b += palm(P, -26, -190, 0.95, { lean: -1 }) + bush(P, 26, -186, 0.8, { flower: PAL.coral });
  b += shape(starD(86, -26, 11, 5), P.vgrad(PAL.coral), ramp(PAL.coral).line, 2) + shape(starD(-92, -18, 9, 4), P.vgrad(PAL.yellow), ramp(PAL.yellow).line, 1.8);
  // sóng & bọt
  b += wave(-120, 2, 34, '#ffffff', 3.4) + wave(110, 4, 34, '#ffffff', 3.4) + wave(0, 6, 40, '#ffffff', 3);
  // cờ cướp biển? → cờ cánh buồm hình tròn
  return b;
}

export function palmHut(P) {
  let b = groundShadow(10, -2, 90, 16);
  // nhà sàn lá dừa
  for (const x of [-46, -6, 34]) b += rect(x - 3, -40, 6, 42, 2, PAL.woodDark, ramp(PAL.woodDark).line, 1.6);
  b += rect(-60, -48, 106, 10, 3, P.vgrad(PAL.woodLight), ramp(PAL.wood).line, 2.4);
  b += rect(-50, -96, 86, 48, 5, P.vgrad(PAL.woodLight), ramp(PAL.wood).line, LW);
  for (let x = -42; x < 36; x += 12) b += stroke(`M${x},-94 L${x},-50`, ramp(PAL.woodLight).lo, 1.6);
  b += door(P, -6, -48, 22, 34, PAL.woodDark, 2.2) + win(16, -84, 14, 14, 2, { lit: true });
  b += shape('M-70,-92 Q-30,-140 -6,-144 Q20,-140 56,-92 Q-6,-80 -70,-92Z', P.vgrad('#f2c75c'), ramp('#f2c75c').line, LW);
  for (let i = 0; i < 7; i++) b += stroke(`M${-60 + i * 18},-90 L${-58 + i * 18},-80`, ramp('#f2c75c').lo, 3);
  // thang
  b += stroke('M-6,0 L-6,-40 M6,0 L6,-40', PAL.wood, 2.4);
  // dừa & rương báu
  b += palm(P, 70, 6, 1.3, { lean: 1 });
  b += rect(-90, -14, 32, 20, 5, P.vgrad(PAL.wood), ramp(PAL.wood).line, 2.4) + shape('M-90,-14 Q-74,-32 -58,-14Z', P.vgrad(PAL.woodDark), ramp(PAL.wood).line, 2.2) + rect(-77, -18, 6, 8, 1, PAL.yellow, ramp(PAL.yellow).line, 1.2) + circle(-74, -26, 10, P.glow(PAL.yellowLight, 0.8), null);
  return b;
}

// ═══════════════════════ ĐẢO NHÀ ═══════════════════════
export function homeIsland(P) {
  // nền đảo (ăn khớp với vùng nước nông nướng sẵn ở nền); tâm đảo = (0,0)
  const pts = blobPoints(0, 0, 175, 92, 10, 0.08, 31);
  const d = smoothPath(pts);
  let b = `<path d="${d}" transform="translate(0,16)" fill="${darken(PAL.sandDark, 0.12)}" stroke="${darken(PAL.sandDark, 0.4)}" stroke-width="42" stroke-linejoin="round" opacity="0.6"/>`;
  b += `<path d="${d}" transform="translate(0,16)" fill="${darken(PAL.sandDark, 0.12)}" stroke="${darken(PAL.sandDark, 0.12)}" stroke-width="36" stroke-linejoin="round"/>`;
  b += `<path d="${d}" fill="${PAL.sand}" stroke="#d6a86e" stroke-width="43" stroke-linejoin="round"/><path d="${d}" fill="${PAL.sand}" stroke="${PAL.sand}" stroke-width="36" stroke-linejoin="round"/>`;
  b += `<path d="${d}" fill="${P.lin('homeGrass', [[0, PAL.grassLight], [0.6, PAL.grass], [1, PAL.grassDark]], 0, 0, 0.3, 1)}" stroke="${PAL.grassDark}" stroke-width="5"/>`;
  b += ellipse(0, 0, 230, 140, P.glow(PAL.yellowLight, 0.35), null);
  // lối đi tới cầu (phía nam)
  b += stroke('M-10,30 Q-14,60 -6,92', '#c99a62', 26) + stroke('M-10,30 Q-14,60 -6,92', '#f1d6a1', 19);
  // các ô xây dựng trống (gợi ý)
  for (const [x, y] of [[-110, 10], [100, 20], [80, -40]]) b += rect(x - 24, y - 14, 48, 28, 8, alpha('#ffffff', 0.35), alpha(PAL.grassDark, 0.7), 2, 'stroke-dasharray="6 6"');
  // nhà của bé
  b += house(P, -14, 22, 2.4, { wall: PAL.cream, roof: PAL.rose, chimney: true, lit: true, h: 26, w: 38 });
  b += tree(P, -96, -14, 1.3, { color: PAL.leaf, fruit: PAL.coral, seed: 5 }) + tree(P, 108, -30, 1.1, { color: '#8fd16f', seed: 9 });
  b += bush(P, 54, 32, 1.1, { flower: PAL.pink }) + flower(P, -70, 44, 1.3, PAL.yellow) + flower(P, 34, 50, 1.3, PAL.pink) + flower(P, 70, 0, 1.2, PAL.white);
  // hòm thư
  b += rect(26, 6, 4, 26, 1, PAL.wood, null) + rect(18, -6, 20, 14, 5, P.vgrad('#58b4e8'), ramp('#58b4e8').line, 2) + shape('M36,-4 L44,-8 L44,-2Z', PAL.coral, null, 0);
  // cầu tàu nhỏ & thuyền (phía đông)
  b += rect(150, -12, 60, 16, 3, P.vgrad(PAL.woodLight), ramp(PAL.woodLight).line, 2.4);
  b += sparkle(-40, -96, 9) + sparkle(60, -84, 7);
  return b;
}
