// ── Little World · môi trường dùng chung (environment/): thác, sông, san hô, cầu cảng, vỏ sò ──
import { sprite, sheet } from './island-common.mjs';
import {
  PAL, LINE, ramp, lighten, darken, mix, alpha, rng, blob, blobPoints, smoothPath, puffPath, gloss, shape, stroke, circle,
  ellipse, rect, r2, baseShadow, leafMark, plank, pebble, sparkle, blade, leafTuft,
} from './island-kit.mjs';
import { rock, pondSvg, shell } from './island-plants.mjs';

const WATER = PAL.ocean;

export function defineEnvironment() {
  const E = (id, d, usage, draw, tags = [], extra = {}) => sprite({ group: 'environment', id: `env-${id}`, file: `environment/${id}.png`, ...d, usage, draw, tags: ['environment', ...tags], ...extra });

  // ── Thác nước: spritesheet 4 khung ──
  sheet({
    group: 'environment', id: 'env-waterfall', file: 'environment/waterfall.png', fw: 224, fh: 250, frames: 4, ox: 112, oy: 226,
    usage: 'Thác nước nhỏ đổ từ vách đá xuống hồ – spritesheet 4 khung (dòng nước chảy, bọt trắng). Origin = giữa mép hồ phía trước',
    tags: ['environment', 'water', 'animated'], footprint: [3, 3], layer: 'object',
    animations: [{ key: 'waterfall-flow', frames: [0, 1, 2, 3], frameRate: 8, repeat: -1 }],
    drawFrame: (doc, i, ox, oy) => {
      const top = 26, lipY = 62, poolY = oy - 34;
      let s = '';
      // hồ dưới chân thác
      const pool = blob(ox, poolY + 4, 86, 26, 10, 0.06, 3);
      s += shape(pool, doc.radial([[0, PAL.oceanDeep], [0.7, WATER], [1, PAL.oceanLight]], 0.5, 0.3, 0.7), '#3f86c2', LINE.md);
      // khối vách đá phía sau (một mảng liền), mặt trên phủ cỏ
      const cliffD = smoothPath([[ox - 88, poolY + 2], [ox - 92, 110], [ox - 80, top + 18], [ox - 40, top + 4], [ox, top], [ox + 42, top + 4], [ox + 82, top + 20], [ox + 92, 112], [ox + 86, poolY + 2]], true, 0.9);
      s += shape(cliffD, doc.linear([[0, PAL.stoneLight], [0.45, PAL.stone], [1, PAL.stoneDark]], 0, 0, 0.5, 1), ramp(PAL.stone).line, LINE.lg);
      const ccl = doc.clip(`<path d="${cliffD}"/>`);
      let cl0 = '';
      // các tảng đá/khe nứt
      [[-62, 110, 22, 16], [62, 120, 22, 18], [-58, 160, 18, 12], [64, 170, 16, 12], [-70, 70, 14, 12], [70, 76, 14, 12]].forEach(([dx, y, rx, ry], k) => {
        cl0 += `<path d="${blob(ox + dx, y, rx, ry, 7, 0.15, k + 4)}" fill="${lighten(PAL.stone, 0.25)}" stroke="${ramp(PAL.stone).lo}" stroke-width="${LINE.sm}" opacity="0.9"/>`;
      });
      cl0 += `<path d="M${ox + 30},${top} L${ox + 120},${top} L${ox + 120},${poolY} L${ox + 50},${poolY}Z" fill="${PAL.purple}" opacity="0.13"/>`;
      s += `<g clip-path="${ccl}">${cl0}</g>`;
      // nắp cỏ
      const capD = puffPath(ox, top + 22, 86, 22, 11, 0.12, 9);
      s += shape(capD, doc.linear([[0, PAL.grassLight], [1, PAL.grass]]), ramp(PAL.grassDark).line, LINE.md);
      s += leafMark(ox - 60, top + 18, 4, PAL.grassDark, 20) + leafMark(ox + 58, top + 24, 4, PAL.grassDark, -20) + leafMark(ox + 30, top + 12, 3.4, PAL.leafDark, 10);
      // rêu rủ xuống
      s += `<path d="M${ox - 84},${top + 34} q6,16 12,4 q6,14 12,2 q6,10 10,-2Z" fill="${PAL.leaf}" stroke="${ramp(PAL.leaf).line}" stroke-width="${LINE.sm}"/>`;
      s += `<path d="M${ox + 52},${top + 38} q6,14 12,2 q6,12 12,0 q4,8 8,-4Z" fill="${PAL.leaf}" stroke="${ramp(PAL.leaf).line}" stroke-width="${LINE.sm}"/>`;
      // dòng nước rơi
      const fall = `M${ox - 36},${lipY - 6} Q${ox - 40},${(lipY + poolY) / 2} ${ox - 44},${poolY} L${ox + 44},${poolY} Q${ox + 40},${(lipY + poolY) / 2} ${ox + 36},${lipY - 6}Z`;
      s += shape(fall, doc.linear([[0, PAL.oceanLight], [0.5, '#7ccbef'], [1, PAL.ocean]]), '#3f86c2', LINE.md);
      const cl = doc.clip(`<path d="${fall}"/>`);
      let st = '';
      const period = 48, off = (i / 4) * period;
      for (let k = -3; k <= 3; k++) {
        const x = ox + k * 12 + (k % 2) * 2;
        st += `<path d="M${x},${lipY - 40 + off} L${x},${poolY + 20}" stroke="#fff" stroke-width="${k % 2 ? 3 : 4.5}" stroke-dasharray="${k % 2 ? '20 28' : '28 20'}" stroke-linecap="round" opacity="${k % 2 ? 0.55 : 0.75}" stroke-dashoffset="${(k * 7) % period}"/>`;
      }
      st += `<rect x="${ox - 50}" y="${lipY - 6}" width="100" height="16" fill="#fff" opacity="0.5"/>`;
      s += `<g clip-path="${cl}">${st}</g>`;
      // bọt dưới chân + sương
      const R = rng(10 + i);
      for (let k = 0; k < 9; k++) {
        const x = ox - 50 + k * 12.5, y = poolY + 2 + Math.sin(k * 1.7 + i * 1.57) * 3;
        s += circle(x, y, 8 + ((k + i) % 3) * 2, PAL.foam, alpha('#7ccbef', 0.7), LINE.xs);
      }
      for (let k = 0; k < 4; k++) s += circle(ox - 60 + R() * 120, poolY - 10 - R() * 20, 3 + R() * 4, '#fff', null, 0, 'opacity="0.5"');
      // gợn sóng hồ
      s += stroke(`M${ox - 70},${poolY + 18 + (i % 2)} q10,-4 20,0 M${ox + 40},${poolY + 20 - (i % 2)} q10,-4 20,0`, PAL.foam, LINE.sm, 'opacity="0.8"');
      // đá viền trước
      s += pebble(doc, ox - 76, oy - 14, 14, 8, PAL.stone, 2) + pebble(doc, ox + 72, oy - 12, 16, 9, PAL.stoneLight, 3) + pebble(doc, ox - 30, oy - 6, 10, 6, PAL.stoneLight, 4);
      return s;
    },
  });

  // ── Sông (decal ghép được) ──
  const riverD = (d, ripples) => (doc) => {
    let s = `<path d="${d}" fill="none" stroke="${alpha(PAL.earthDark, 0.35)}" stroke-width="86"/>`;
    s += `<path d="${d}" fill="none" stroke="${PAL.sand}" stroke-width="80"/>`;
    s += `<path d="${d}" fill="none" stroke="#3f86c2" stroke-width="62"/>`;
    s += `<path d="${d}" fill="none" stroke="${WATER}" stroke-width="58"/>`;
    s += `<path d="${d}" fill="none" stroke="${PAL.oceanLight}" stroke-width="30" opacity="0.6"/>`;
    for (const [x, y] of ripples) s += stroke(`M${x - 8},${y} Q${x},${y - 5} ${x + 8},${y}`, '#fff', LINE.sm, 'opacity="0.75"');
    return s;
  };
  E('river-straight', { w: 128, h: 128, ox: 64, oy: 64, fixed: true }, 'Đoạn suối thẳng (chảy dọc, ghép trên-dưới; xoay 90° để chảy ngang). Decal mặt đất', (doc) => riverD('M64,-10 L64,138', [[56, 30], [74, 70], [58, 104]])(doc), ['water', 'river', 'tile', 'ground'], { layer: 'ground', footprint: [2, 2] });
  E('river-curve', { w: 128, h: 128, ox: 64, oy: 64, fixed: true }, 'Đoạn suối cong 90° (vào từ trên, ra bên phải). Decal mặt đất', (doc) => riverD('M64,-10 L64,30 Q64,64 98,64 L138,64', [[60, 22], [80, 54], [108, 70]])(doc), ['water', 'river', 'tile', 'ground'], { layer: 'ground', footprint: [2, 2] });

  // ── San hô ×3 ──
  const coralBase = (doc, ox, oy) => `<ellipse cx="${ox + 3}" cy="${oy - 2}" rx="34" ry="8" fill="${alpha(PAL.oceanAbyss, 0.25)}"/>` + pebble(doc, ox - 14, oy - 4, 12, 6, PAL.sandDark, 1) + pebble(doc, ox + 16, oy - 3, 10, 5, PAL.sand, 2);
  E('coral-pink', { w: 90, h: 90, ox: 45, oy: 84 }, 'San hô nhánh hồng (vùng nước nông/đáy biển)', (doc, ox, oy) => {
    const c = PAL.rose, r = ramp(c);
    let s = coralBase(doc, ox, oy);
    const br = (x0, y0, pts) => {
      const d = `M${x0},${y0} ` + pts.map(([x, y]) => `L${x},${y}`).join(' ');
      return stroke(d, r.line, 12) + stroke(d, c, 8) + stroke(d, lighten(c, 0.35), 2.6, 'opacity="0.7" transform="translate(-1.5,-1)"');
    };
    s += br(ox, oy - 6, [[ox - 4, oy - 30], [ox - 20, oy - 48], [ox - 22, oy - 64]]);
    s += br(ox - 6, oy - 34, [[ox - 30, oy - 38], [ox - 34, oy - 52]]);
    s += br(ox, oy - 6, [[ox + 6, oy - 36], [ox + 22, oy - 52], [ox + 24, oy - 68]]);
    s += br(ox + 10, oy - 40, [[ox + 2, oy - 58], [ox + 4, oy - 72]]);
    s += br(ox + 4, oy - 22, [[ox + 30, oy - 30], [ox + 34, oy - 44]]);
    for (const [x, y] of [[ox - 22, oy - 64], [ox - 34, oy - 52], [ox + 24, oy - 68], [ox + 4, oy - 72], [ox + 34, oy - 44]]) s += circle(x, y, 5.5, doc.sphere(lighten(c, 0.2)), r.line, LINE.sm);
    return s;
  }, ['ocean', 'coral']);
  E('coral-orange', { w: 96, h: 84, ox: 48, oy: 78 }, 'San hô quạt cam + san hô não (đáy biển)', (doc, ox, oy) => {
    const c = PAL.orange, r = ramp(c);
    let s = coralBase(doc, ox, oy);
    const fan = `M${ox - 8},${oy - 8} C${ox - 44},${oy - 30} ${ox - 30},${oy - 74} ${ox + 2},${oy - 72} C${ox + 30},${oy - 72} ${ox + 34},${oy - 36} ${ox + 2},${oy - 8}Z`;
    s += shape(fan, doc.sphere(c, 0.8), r.line, LINE.md);
    for (const a of [-60, -35, -10, 15, 40]) {
      const rad = (a - 90) * Math.PI / 180;
      s += stroke(`M${ox - 3},${oy - 10} Q${r2(ox - 3 + Math.cos(rad) * 22)},${r2(oy - 30 + Math.sin(rad) * 18)} ${r2(ox - 3 + Math.cos(rad) * 32)},${r2(oy - 36 + Math.sin(rad) * 28)}`, r.lo, LINE.sm);
    }
    s += stroke(`M${ox - 22},${oy - 40} Q${ox},${oy - 52} ${ox + 18},${oy - 40} M${ox - 16},${oy - 56} Q${ox},${oy - 64} ${ox + 12},${oy - 56}`, lighten(c, 0.4), LINE.xs, 'opacity="0.9"');
    // san hô não
    const bc = PAL.yellow, brr = ramp(bc);
    s += ellipse(ox + 28, oy - 14, 16, 12, doc.sphere(bc), brr.line, LINE.md);
    s += stroke(`M${ox + 16},${oy - 14} q4,-6 8,0 t8,0 t8,0 M${ox + 18},${oy - 20} q4,-5 8,0 t8,0`, brr.lo, LINE.xs * 1.3);
    return s;
  }, ['ocean', 'coral']);
  E('coral-lavender', { w: 90, h: 86, ox: 45, oy: 80 }, 'San hô ống tím lavender (đáy biển)', (doc, ox, oy) => {
    const c = PAL.lavender, r = ramp(c);
    let s = coralBase(doc, ox, oy);
    [[-22, 34, 8], [-8, 52, 9], [8, 44, 8.5], [22, 30, 7.5], [0, 26, 7]].forEach(([dx, h, w]) => {
      const x = ox + dx, by = oy - 6;
      s += rect(x - w, by - h, w * 2, h, w, doc.linear([[0, lighten(c, 0.3)], [0.5, c], [1, darken(c, 0.15)]], 0, 0, 1, 0), r.line, LINE.md);
      s += ellipse(x, by - h + 3, w - 1.5, 3.5, darken(c, 0.4), r.line, LINE.sm);
    });
    s += circle(ox + 30, oy - 60, 3, '#fff', '#8fd6f0', 1) + circle(ox + 26, oy - 70, 2, '#fff', '#8fd6f0', 1);
    return s;
  }, ['ocean', 'coral']);

  E('sea-rock', { w: 120, h: 80, ox: 60, oy: 62 }, 'Đá biển nhô lên mặt nước, vòng bọt sóng, rong biển', (doc, ox, oy) => {
    let s = ellipse(ox, oy - 4, 52, 13, alpha(PAL.oceanDeep, 0.25), null);
    s += rock(doc, ox - 6, oy - 4, 64, 46, 31, { color: '#b2aec4', lw: LINE.lg }).replace(/<ellipse[^>]*fill="rgba\(76,56,118,0.22\)"[^>]*\/>/g, '');
    s += rock(doc, ox + 28, oy - 2, 30, 20, 33, { color: PAL.stone }).replace(/<ellipse[^>]*fill="rgba\(76,56,118,0.22\)"[^>]*\/>/g, '');
    s += `<path d="M${ox - 50},${oy - 2} q8,-6 16,0 t16,0 t16,0 t16,0 t16,0 t16,0 L${ox + 50},${oy + 6} Q${ox},${oy + 14} ${ox - 50},${oy + 6}Z" fill="${alpha(PAL.foam, 0.95)}" stroke="${alpha('#3f86c2', 0.5)}" stroke-width="${LINE.sm}"/>`;
    s += blade(ox - 30, oy - 6, 16, -4, 2.4, '#5fae7e', ramp('#5fae7e').line, LINE.xs) + blade(ox - 25, oy - 6, 12, 3, 2.2, '#5fae7e', ramp('#5fae7e').line, LINE.xs);
    return s;
  }, ['ocean', 'rock']);

  E('pond-round', { w: 230, h: 150, ox: 115, oy: 75 }, 'Ao tròn nhỏ (biến thể 1, chỉ lá súng). Decal mặt đất, origin tâm', (doc, ox, oy) => pondSvg(doc, ox, oy, 96, 58, 21, true), ['water', 'pond', 'ground'], { layer: 'ground', footprint: [3, 2] });
  E('pond-long', { w: 330, h: 170, ox: 165, oy: 85 }, 'Ao dài hình hạt đậu (biến thể 2). Decal mặt đất, origin tâm', (doc, ox, oy) => pondSvg(doc, ox, oy, 146, 66, 27, true), ['water', 'pond', 'ground'], { layer: 'ground', footprint: [5, 2] });

  // ── cầu cảng ──
  const pierPlanks = (doc, x0, y0, w, h, seed) => {
    let s = '';
    const R = rng(seed);
    for (let y = y0; y < y0 + h; y += 16) s += plank(doc, x0 + (R() - 0.5) * 3, y, w, 15, R() < 0.5 ? PAL.woodLight : PAL.wood, LINE.sm);
    return s;
  };
  E('pier-segment', { w: 80, h: 128, ox: 40, oy: 128, fixed: true }, 'Đoạn cầu cảng gỗ (chạy dọc, ghép nối tiếp mỗi 128 đơn vị theo trục y). Origin = mép dưới giữa', (doc, ox, oy) => {
    let s = `<rect x="${ox - 30}" y="0" width="68" height="128" fill="${alpha(PAL.oceanAbyss, 0.22)}"/>`;
    s += pierPlanks(doc, ox - 32, 0, 64, 128, 5);
    s += rect(ox - 36, 0, 7, 128, 3, doc.vgrad(PAL.woodDark), ramp(PAL.woodDark).line, LINE.sm) + rect(ox + 29, 0, 7, 128, 3, doc.vgrad(PAL.woodDark), ramp(PAL.woodDark).line, LINE.sm);
    for (const y of [20, 84]) for (const x of [ox - 34, ox + 34]) s += circle(x, y, 6, doc.sphere(PAL.woodDark), ramp(PAL.woodDark).line, LINE.sm) + circle(x, y, 2.5, darken(PAL.woodDark, 0.3), null);
    return s;
  }, ['ocean', 'dock', 'tile', 'ground'], { layer: 'ground', footprint: [1, 2] });
  E('pier-end', { w: 120, h: 150, ox: 60, oy: 140 }, 'Đầu cầu cảng: sàn rộng, cọc buộc thuyền, thang xuống nước, phao. Origin = mép dưới giữa (đặt ở đầu xa của cầu)', (doc, ox, oy) => {
    let s = `<rect x="${ox - 44}" y="${oy - 118}" width="96" height="120" rx="6" fill="${alpha(PAL.oceanAbyss, 0.22)}"/>`;
    s += pierPlanks(doc, ox - 46, oy - 128, 92, 120, 9);
    s += rect(ox - 50, oy - 128, 8, 122, 3, doc.vgrad(PAL.woodDark), ramp(PAL.woodDark).line, LINE.sm) + rect(ox + 42, oy - 128, 8, 122, 3, doc.vgrad(PAL.woodDark), ramp(PAL.woodDark).line, LINE.sm);
    s += rect(ox - 50, oy - 12, 100, 8, 3, doc.vgrad(PAL.woodDark), ramp(PAL.woodDark).line, LINE.sm);
    // cọc + dây
    for (const x of [ox - 46, ox + 46]) {
      s += rect(x - 7, oy - 30, 14, 26, 5, doc.linear([[0, PAL.woodLight], [1, PAL.woodDark]], 0, 0, 1, 0), ramp(PAL.woodDark).line, LINE.sm);
      s += ellipse(x, oy - 30, 7, 3, PAL.woodLight, ramp(PAL.woodDark).line, LINE.xs);
      s += stroke(`M${x - 7},${oy - 20} q7,4 14,0`, PAL.cream, 2.4);
    }
    // thang
    s += stroke(`M${ox - 12},${oy - 4} L${ox - 12},${oy + 6} M${ox + 12},${oy - 4} L${ox + 12},${oy + 6}`, PAL.stoneDark, LINE.sm);
    s += ellipse(ox, oy + 6, 22, 4, alpha(PAL.foam, 0.8), null);
    // phao
    s += circle(ox + 22, oy - 90, 11, 'none', ramp(PAL.coral).line, 9) + circle(ox + 22, oy - 90, 11, 'none', PAL.white, 6.4);
    for (let k = 0; k < 4; k++) s += `<path d="M${ox + 22},${oy - 101} a11,11 0 0 1 7.8,3.2" stroke="${PAL.coral}" stroke-width="6.4" fill="none" transform="rotate(${k * 90 + 20} ${ox + 22} ${oy - 90})"/>`;
    // xô + cần câu
    s += shape(`M${ox - 30},${oy - 70} L${ox - 16},${oy - 70} L${ox - 18},${oy - 56} L${ox - 28},${oy - 56}Z`, doc.vgrad('#73a9e0'), ramp('#73a9e0').line, LINE.sm);
    return s;
  }, ['ocean', 'dock', 'ground'], { layer: 'ground', footprint: [2, 2] });

  // ── vỏ sò & sao biển ──
  E('shell-pink', { w: 30, h: 26, ox: 15, oy: 14 }, 'Vỏ sò hồng (decal bãi biển)', (doc, ox, oy) => `<ellipse cx="${ox + 1}" cy="${oy + 5}" rx="9" ry="3" fill="${PAL.shadowSoft}"/>` + shell(doc, ox, oy, 9, PAL.pink), ['beach', 'ground', 'placeable'], { layer: 'ground' });
  E('starfish', { w: 46, h: 44, ox: 23, oy: 22 }, 'Sao biển cam (decal bãi biển)', (doc, ox, oy) => {
    const c = PAL.orange, r = ramp(c);
    let pts = [];
    for (let k = 0; k < 10; k++) { const a = -Math.PI / 2 + k * Math.PI / 5; const rr = k % 2 ? 7.5 : 17; pts.push([ox + Math.cos(a) * rr, oy + Math.sin(a) * rr * 0.85]); }
    let s = `<ellipse cx="${ox + 1}" cy="${oy + 5}" rx="11" ry="3.5" fill="${PAL.shadowSoft}"/>`;
    s += shape(smoothPath(pts, true, 0.35), doc.sphere(c), darken(c, 0.3), LINE.sm);
    for (let k = 0; k < 5; k++) { const a = -Math.PI / 2 + k * Math.PI * 2 / 5; s += circle(ox + Math.cos(a) * 8, oy + Math.sin(a) * 7, 1.6, lighten(c, 0.5), null); }
    return s;
  }, ['beach', 'ground', 'placeable'], { layer: 'ground' });
  E('shells-cluster', { w: 60, h: 36, ox: 30, oy: 18 }, 'Cụm vỏ ốc, vỏ sò, sỏi trên cát (decal)', (doc, ox, oy) => {
    let s = shell(doc, ox - 14, oy + 2, 7, PAL.peach) + shell(doc, ox + 6, oy - 4, 6, PAL.lavenderLight);
    // ốc xoắn
    s += ellipse(ox + 18, oy + 5, 7, 5, doc.sphere(PAL.pinkLight), ramp(PAL.pink).line, LINE.xs * 1.2) + stroke(`M${ox + 18},${oy + 5} m-3,0 a3,2.4 0 1 1 3,2.4 a1.6,1.3 0 1 1 1.4,-1.3`, ramp(PAL.pink).line, LINE.xs);
    s += pebble(doc, ox - 2, oy + 8, 4, 3, PAL.stoneLight, 3) + pebble(doc, ox + 26, oy - 6, 3, 2.4, PAL.stone, 4);
    return s;
  }, ['beach', 'ground', 'placeable'], { layer: 'ground' });
}
