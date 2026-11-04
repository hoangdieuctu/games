// ── Little World · Đảo: cây (island/trees) ──
import { sprite } from './island-common.mjs';
import {
  PAL, LINE, ramp, lighten, darken, mix, rng, smoothPath, blob, puffPath, gloss, shape, stroke, circle,
  ellipse, rect, r2, baseShadow, canopy, leafMark, flowerHead, sparkle, glow, leaf, leafTuft, plank,
} from './island-kit.mjs';

/** Thân cây: hơi cong, chân loe có rễ, có vân. */
export function trunk(doc, cx, by, topY, w, color = PAL.wood, o = {}) {
  const r = ramp(color);
  const bend = o.bend || 0;
  const tw = w * 0.62;
  const d = `M${r2(cx - w * 0.95)},${r2(by)} Q${r2(cx - w * 0.55)},${r2(by - 4)} ${r2(cx - w * 0.5)},${r2(by - 14)} ` +
    `C${r2(cx - w * 0.45 + bend)},${r2(by - (by - topY) * 0.5)} ${r2(cx - tw / 2 + bend)},${r2(topY + 20)} ${r2(cx - tw / 2 + bend)},${r2(topY)} ` +
    `L${r2(cx + tw / 2 + bend)},${r2(topY)} C${r2(cx + tw / 2 + bend)},${r2(topY + 20)} ${r2(cx + w * 0.45 + bend)},${r2(by - (by - topY) * 0.5)} ${r2(cx + w * 0.5)},${r2(by - 14)} ` +
    `Q${r2(cx + w * 0.55)},${r2(by - 4)} ${r2(cx + w * 0.95)},${r2(by)} Q${r2(cx + w * 0.3)},${r2(by + 3)} ${r2(cx)},${r2(by + 2)} Q${r2(cx - w * 0.4)},${r2(by + 3)} ${r2(cx - w * 0.95)},${r2(by)}Z`;
  let s = shape(d, doc.linear([[0, r.hi], [0.45, color], [1, r.lo]], 0, 0, 1, 0), r.line, o.lw || LINE.md);
  // vân thân
  s += stroke(`M${r2(cx - w * 0.15 + bend * 0.6)},${r2(by - 8)} Q${r2(cx - w * 0.2 + bend * 0.8)},${r2((by + topY) / 2)} ${r2(cx - w * 0.05 + bend)},${r2(topY + 8)}`, r.lo, LINE.xs * 1.2, 'opacity="0.8"');
  s += stroke(`M${r2(cx + w * 0.22 + bend * 0.5)},${r2(by - 12)} Q${r2(cx + w * 0.18 + bend * 0.6)},${r2(by - (by - topY) * 0.4)} ${r2(cx + w * 0.2 + bend * 0.7)},${r2(by - (by - topY) * 0.6)}`, r.lo, LINE.xs * 1.2, 'opacity="0.7"');
  return s;
}

function dims(w, h, oy) { return { w, h, ox: w / 2, oy: h - oy }; }

export function defineTrees() {
  const T = (id, file, d, usage, draw, extra = {}) => sprite({
    id: `island-tree-${id}`, file: `island/trees/${file}.png`, ...d, usage,
    tags: ['tree', 'nature', 'placeable', ...(extra.tags || [])], footprint: extra.footprint || [1, 1], draw,
  });

  // ── Sồi tròn ×2 ──
  const oak = (seed, leafC, wid, ht, extraFx) => (doc, ox, oy) => {
    let s = baseShadow(ox, oy - 2, wid * 0.42, 13);
    s += trunk(doc, ox, oy, oy - ht * 0.48, 24, PAL.wood);
    const cy = oy - ht * 0.6;
    s += canopy(doc, ox, cy, wid * 0.46, ht * 0.36, leafC, seed);
    if (extraFx) s += extraFx(doc, ox, cy);
    return s;
  };
  T('oak-1', 'oak-1', dims(176, 200, 10), 'Cây sồi tròn xanh lá (to vừa), đặt trên cỏ', oak(11, PAL.leaf, 160, 186));
  T('oak-2', 'oak-2', dims(150, 176, 10), 'Cây sồi tròn nhỏ hơn, lá xanh vàng', oak(23, mix(PAL.leaf, PAL.yellow, 0.25), 134, 162));

  // ── Thông/linh sam ×2 ──
  const pine = (tiers, wid, ht, color, seed, snowTips) => (doc, ox, oy) => {
    const r = ramp(color);
    let s = baseShadow(ox, oy - 2, wid * 0.36, 11);
    s += trunk(doc, ox, oy, oy - 34, 18, PAL.woodDark);
    const top = oy - ht;
    const base = oy - 24;
    const lv = [];
    for (let i = 0; i < tiers; i++) {
      const t = i / (tiers - 1);
      const yb = base - (base - top) * (i / tiers) * 0.95;
      const yt = top + (base - top) * Math.max(0, (i - 1)) / tiers * 0.6 - (i === tiers - 1 ? 0 : 0);
      lv.push({ yb, half: wid / 2 * (1 - t * 0.62), yt: i === tiers - 1 ? top : yb - (base - top) * 0.52 });
    }
    lv.forEach(({ yb, half, yt }, i) => {
      // tầng lá: tam giác bo, đáy lượn sóng
      const n = 4 + Math.round(half / 14);
      let bottom = '';
      for (let k = n; k >= 0; k--) {
        const x = ox - half + (2 * half * k) / n;
        if (k < n) bottom += ` Q${r2(x + half / n)},${r2(yb + 9)} ${r2(x)},${r2(yb)}`;
      }
      const d = `M${r2(ox)},${r2(yt)} Q${r2(ox + half * 0.35)},${r2(yt + (yb - yt) * 0.35)} ${r2(ox + half)},${r2(yb)}${bottom} Q${r2(ox - half * 0.35)},${r2(yt + (yb - yt) * 0.35)} ${r2(ox)},${r2(yt)}Z`;
      const c = lighten(color, 0.06 * i);
      const cl = doc.clip(`<path d="${d}"/>`);
      s += shape(d, doc.linear([[0, lighten(c, 0.3)], [0.5, c], [1, darken(c, 0.15)]], 0, 0, 1, 0.6), r.line, LINE.lg);
      s += `<g clip-path="${cl}"><path d="M${r2(ox + 2)},${r2(yt)} L${r2(ox + half + 4)},${r2(yb + 10)} L${r2(ox + half + 10)},${r2(yt)}Z" fill="${r.lo}" opacity="0.45"/>`;
      s += stroke(`M${r2(ox - half * 0.55)},${r2(yb - 6)} Q${r2(ox - half * 0.25)},${r2(yb - 12)} ${r2(ox)},${r2(yb - 6)}`, lighten(c, 0.45), LINE.sm, 'opacity="0.7"');
      s += `</g>`;
      if (snowTips) s += `<path d="M${r2(ox)},${r2(yt)} Q${r2(ox + 6)},${r2(yt + 10)} ${r2(ox + 9)},${r2(yt + 16)} Q${r2(ox + 3)},${r2(yt + 12)} ${r2(ox)},${r2(yt + 15)} Q${r2(ox - 4)},${r2(yt + 11)} ${r2(ox - 9)},${r2(yt + 16)} Q${r2(ox - 6)},${r2(yt + 10)} ${r2(ox)},${r2(yt)}Z" fill="${PAL.white}" opacity="0.9"/>`;
    });
    s += gloss(ox - wid * 0.12, top + ht * 0.25, 4, 9, 0.35, 25);
    return s;
  };
  T('pine-1', 'pine-1', dims(128, 214, 10), 'Cây thông xanh đậm, cao (dùng viền đảo, góc rừng)', pine(4, 112, 196, PAL.leafDark, 3, false));
  T('pine-2', 'pine-2', dims(108, 172, 10), 'Cây linh sam nhỏ xanh ngọc, đầu ngọn lấp lánh', pine(3, 94, 156, mix(PAL.leafDark, PAL.mint, 0.35), 5, true));

  // ── Cây ăn quả: táo & cam ──
  const fruit = (fc, leafC, seed) => (doc, ox, oy) => {
    let s = oak(seed, leafC, 158, 184)(doc, ox, oy);
    const R = rng(seed);
    const cy = oy - 184 * 0.6;
    const spots = [[-38, -18], [-12, -40], [22, -30], [44, -4], [-46, 14], [-6, 2], [26, 18], [6, -18], [-24, 30]];
    for (const [dx, dy] of spots) {
      const x = ox + dx + (R() - 0.5) * 6, y = cy + dy + (R() - 0.5) * 6;
      s += circle(x, y, 7.2, doc.sphere(fc, 1.1), ramp(fc).line, LINE.sm);
      s += stroke(`M${r2(x)},${r2(y - 6)} q1,-3 3,-4`, PAL.woodDark, LINE.xs * 1.3);
      s += leafMark(x + 4, y - 8, 3, PAL.leaf, 50);
      s += gloss(x - 2.5, y - 2.5, 2.2, 1.5, 0.7);
    }
    // vài quả rơi dưới gốc
    s += circle(ox - 30, oy - 2, 6, doc.sphere(fc), ramp(fc).line, LINE.sm) + gloss(ox - 32, oy - 4, 2, 1.3, 0.6);
    s += circle(ox + 34, oy + 1, 5.5, doc.sphere(fc), ramp(fc).line, LINE.sm);
    return s;
  };
  T('apple', 'apple-tree', dims(176, 202, 10), 'Cây táo (quả đỏ hồng) – có thể dùng cho hoạt động hái quả', fruit('#f2626b', PAL.leaf, 31), { tags: ['fruit'] });
  T('orange', 'orange-tree', dims(176, 202, 10), 'Cây cam (quả cam) – có thể dùng cho hoạt động hái quả', fruit(PAL.orange, mix(PAL.leaf, PAL.leafDark, 0.3), 37), { tags: ['fruit'] });

  // ── Cây hoa anh đào hồng ──
  T('blossom', 'blossom-tree', dims(182, 204, 12), 'Cây hoa hồng phấn (anh đào), cánh hoa rơi dưới gốc', (doc, ox, oy) => {
    let s = baseShadow(ox, oy - 2, 66, 13);
    // cánh hoa rơi trên đất
    const R = rng(41);
    for (let i = 0; i < 9; i++) s += leafMark(ox + (R() - 0.5) * 120, oy + (R() - 0.5) * 12, 3, i % 2 ? PAL.pink : PAL.pinkLight, R() * 180);
    s += trunk(doc, ox, oy, oy - 92, 22, '#b98067', { bend: -3 });
    // nhánh
    s += stroke(`M${ox - 2},${oy - 84} q-18,-14 -30,-14`, ramp('#b98067').line, 7) + stroke(`M${ox - 2},${oy - 84} q-18,-14 -30,-14`, '#b98067', 4);
    const cy = oy - 120;
    s += canopy(doc, ox, cy, 78, 64, PAL.pink, 43, { sparkles: 0, line: '#d0668f' });
    for (let i = 0; i < 14; i++) {
      const a = R() * Math.PI * 2, d = 0.15 + R() * 0.65;
      const fx = ox + Math.cos(a) * 66 * d, fy = cy + Math.sin(a) * 50 * d - 6;
      for (let k = 0; k < 5; k++) { const b = R() * 0 + k / 5 * Math.PI * 2; s += ellipse(fx + Math.cos(b) * 3.2, fy + Math.sin(b) * 2.8, 3.2, 2.8, i % 3 ? PAL.white : PAL.pinkLight, null); }
      s += circle(fx, fy, 1.8, PAL.rose, null);
    }
    return s;
  }, { tags: ['flower'] });

  // ── Cây dừa ──
  T('palm', 'palm', dims(176, 220, 10), 'Cây dừa (bãi biển), lá xoè, có trái dừa', (doc, ox, oy) => {
    let s = baseShadow(ox + 10, oy - 2, 46, 12);
    // thân cong nhiều đốt
    const top = [ox + 22, oy - 160];
    const bark = '#c99668', br = ramp(bark);
    const segs = 9;
    for (let i = segs; i >= 0; i--) {
      const t = i / segs;
      const x = ox + (top[0] - ox) * Math.pow(t, 1.6), y = oy - 6 + (top[1] - oy + 6) * t;
      const w = 13 - t * 4;
      s += ellipse(x, y, w, 9, doc.linear([[0, br.hi], [0.5, bark], [1, br.lo]], 0, 0, 1, 0), br.line, LINE.sm);
      s += stroke(`M${r2(x - w * 0.6)},${r2(y + 2)} Q${r2(x)},${r2(y + 6)} ${r2(x + w * 0.6)},${r2(y + 2)}`, br.lo, LINE.xs);
    }
    const lc = PAL.leaf, lr = ramp(lc);
    const fronds = [[-150, 72], [-120, 64], [-80, 56], [-30, 64], [10, 70], [-180 + 20, 58], [-100, 74], [-55, 76]];
    const frond = (ang, len, shade = 0) => {
      const a = (ang * Math.PI) / 180;
      const ex = top[0] + Math.cos(a) * len, ey = top[1] + Math.sin(a) * len * 0.45 + len * 0.62;
      const mx = top[0] + Math.cos(a) * len * 0.6, my = top[1] + Math.sin(a) * len * 0.35 - 26;
      const P = (t) => [(1 - t) * (1 - t) * top[0] + 2 * (1 - t) * t * mx + t * t * ex, (1 - t) * (1 - t) * top[1] + 2 * (1 - t) * t * my + t * t * ey];
      const N = 14, W = 17;
      const L = [], Rr = [];
      for (let k = 0; k <= N; k++) {
        const t = k / N;
        const [px, py] = P(t);
        const [qx, qy] = P(Math.min(1, t + 0.01));
        const [bx, by2] = P(Math.max(0, t - 0.01));
        let dx = qx - bx, dy = qy - by2; const l = Math.hypot(dx, dy) || 1; dx /= l; dy /= l;
        const w = W * Math.pow(Math.sin(Math.PI * Math.min(0.98, t * 0.92 + 0.04)), 0.8) * (k % 2 ? 1 : 0.62);
        const sweep = 4 * t;
        L.push([px - dy * w + dx * sweep, py + dx * w + dy * sweep]);
        Rr.push([px + dy * w + dx * sweep, py - dx * w + dy * sweep]);
      }
      const pts = [...L, ...Rr.reverse()];
      const d = 'M' + pts.map(([x, y]) => `${r2(x)},${r2(y)}`).join(' L') + 'Z';
      const c = darken(lc, shade);
      let f = shape(d, doc.vgrad(lighten(c, 0.08)), lr.line, LINE.md);
      f += stroke(`M${r2(top[0])},${r2(top[1])} Q${r2(mx)},${r2(my)} ${r2(ex)},${r2(ey)}`, darken(c, 0.25), LINE.sm);
      f += stroke(`M${r2(top[0])},${r2(top[1] - 2)} Q${r2(mx)},${r2(my - 3)} ${r2((mx + ex) / 2)},${r2((my + ey) / 2 - 4)}`, lighten(c, 0.4), LINE.xs, 'opacity="0.8"');
      return f;
    };
    // lá sau trước
    [[-165, 78], [-15, 80], [-120, 66], [-62, 68]].forEach(([a, l]) => { s += frond(a, l, 0.12); });
    s += circle(top[0] - 6, top[1] + 8, 8, doc.sphere('#a8784e'), ramp('#a8784e').line, LINE.sm);
    s += circle(top[0] + 7, top[1] + 9, 8, doc.sphere('#a8784e'), ramp('#a8784e').line, LINE.sm);
    s += circle(top[0], top[1] + 14, 7.5, doc.sphere('#b8875a'), ramp('#a8784e').line, LINE.sm);
    [[168, 84], [12, 86], [142, 70], [40, 70], [-92, 44]].forEach(([a, l]) => { s += frond(a, l); });
    s += circle(top[0], top[1] - 2, 9, doc.sphere(lighten(lc, 0.2)), lr.line, LINE.sm);
    return s;
  }, { tags: ['beach'] });

  // ── Cây cổ thụ lớn (đặc biệt của đảo) – có xích đu và sàn nhà cây ──
  T('great-tree', 'great-tree', { w: 360, h: 380, ox: 180, oy: 360 }, 'Cây cổ thụ lớn thân thiện của đảo: tán to, sàn nhà cây nhỏ, xích đu – điểm nhấn bên trái nhà', (doc, ox, oy) => {
    let s = baseShadow(ox, oy - 4, 130, 30);
    // rễ lớn
    const tc = '#c08a5e', tr = ramp(tc);
    // thân to
    const d = `M${ox - 70},${oy} Q${ox - 52},${oy - 6} ${ox - 40},${oy - 26} C${ox - 30},${oy - 80} ${ox - 36},${oy - 130} ${ox - 30},${oy - 170} L${ox + 34},${oy - 170} C${ox + 40},${oy - 130} ${ox + 32},${oy - 80} ${ox + 42},${oy - 26} Q${ox + 54},${oy - 6} ${ox + 76},${oy} Q${ox + 44},${oy + 6} ${ox + 22},${oy - 2} Q${ox + 4},${oy + 8} ${ox - 18},${oy - 1} Q${ox - 44},${oy + 6} ${ox - 70},${oy}Z`;
    s += shape(d, doc.linear([[0, tr.hi], [0.4, tc], [1, tr.lo]], 0, 0, 1, 0), tr.line, LINE.lg);
    // vân + hốc cây
    s += stroke(`M${ox - 14},${oy - 8} Q${ox - 22},${oy - 70} ${ox - 12},${oy - 160}`, tr.lo, LINE.sm);
    s += stroke(`M${ox + 18},${oy - 14} Q${ox + 14},${oy - 60} ${ox + 20},${oy - 110}`, tr.lo, LINE.sm);
    s += ellipse(ox + 4, oy - 64, 11, 15, doc.linear([[0, tr.deep], [1, tr.line]]), tr.line, LINE.sm);
    s += ellipse(ox + 4, oy - 60, 7, 9, darken(tc, 0.6), null);
    // nhánh sang trái (giữ xích đu)
    const bd = `M${ox - 28},${oy - 150} Q${ox - 70},${oy - 160} ${ox - 120},${oy - 176} L${ox - 118},${oy - 190} Q${ox - 70},${oy - 178} ${ox - 26},${oy - 172}Z`;
    s += shape(bd, doc.vgrad(tc), tr.line, LINE.md);
    // tán sau
    s += canopy(doc, ox - 72, oy - 238, 100, 78, darken(PAL.leaf, 0.08), 61, { sparkles: 3 });
    s += canopy(doc, ox + 82, oy - 228, 96, 76, darken(PAL.leaf, 0.06), 67, { sparkles: 3 });
    s += canopy(doc, ox + 4, oy - 280, 118, 82, PAL.leaf, 71, { sparkles: 8 });
    // sàn nhà cây (bệ gỗ) giữa tán – chiếu nghỉ
    const px = ox + 40, py = oy - 196;
    s += shape(`M${px - 56},${py} L${px + 56},${py} L${px + 50},${py + 14} L${px - 50},${py + 14}Z`, doc.vgrad(PAL.wood), ramp(PAL.wood).line, LINE.md);
    s += shape(`M${px - 56},${py} L${px - 46},${py - 10} L${px + 46},${py - 10} L${px + 56},${py}Z`, doc.vgrad(PAL.woodLight), ramp(PAL.wood).line, LINE.md);
    for (let k = -2; k <= 2; k++) s += stroke(`M${px + k * 20},${py - 9} L${px + k * 22},${py - 1}`, ramp(PAL.woodLight).lo, LINE.xs);
    // lan can
    for (let k = -2; k <= 2; k++) s += rect(px + k * 24 - 2.5, py - 30, 5, 22, 2, doc.vgrad(PAL.woodLight), ramp(PAL.wood).line, LINE.sm);
    s += rect(px - 56, py - 34, 112, 7, 3.5, doc.vgrad(PAL.woodLight), ramp(PAL.wood).line, LINE.sm);
    // cờ đuôi nheo nhỏ trên lan can
    s += stroke(`M${px - 52},${py - 34} Q${px},${py - 18} ${px + 52},${py - 34}`, PAL.woodDark, LINE.xs * 1.2);
    [[-36, PAL.rose], [-16, PAL.yellow], [6, PAL.mint], [28, PAL.lavender]].forEach(([dx, c], i) => {
      const x = px + dx, y = py - 28 + (i === 0 || i === 3 ? 0 : 3);
      s += shape(`M${x - 6},${y} L${x + 6},${y} L${x},${y + 10}Z`, c, ramp(c).line, LINE.xs);
    });
    // thang dây
    s += stroke(`M${px + 30},${py + 14} L${px + 26},${oy - 30}`, PAL.woodDark, LINE.sm) + stroke(`M${px + 46},${py + 14} L${px + 44},${oy - 30}`, PAL.woodDark, LINE.sm);
    for (let y = py + 28; y < oy - 34; y += 16) s += rect(px + 23, y, 26, 5, 2.5, PAL.woodLight, ramp(PAL.wood).line, LINE.xs * 1.2);
    // xích đu treo ở nhánh trái
    const sx = ox - 96, sy = oy - 178;
    s += stroke(`M${sx - 16},${sy} L${sx - 18},${oy - 48}`, PAL.cream, 3.4) + stroke(`M${sx - 16},${sy} L${sx - 18},${oy - 48}`, ramp(PAL.wood).line, 1);
    s += stroke(`M${sx + 16},${sy - 4} L${sx + 18},${oy - 48}`, PAL.cream, 3.4) + stroke(`M${sx + 16},${sy - 4} L${sx + 18},${oy - 48}`, ramp(PAL.wood).line, 1);
    s += rect(sx - 26, oy - 52, 52, 9, 4, doc.vgrad(PAL.rose), ramp(PAL.rose).line, LINE.sm);
    // bóng nhỏ của xích đu
    s += ellipse(sx + 2, oy - 6, 26, 5, PAL.shadowSoft, null);
    // chùm lá phủ trước một chút
    s += canopy(doc, ox - 120, oy - 202, 40, 30, lighten(PAL.leaf, 0.05), 79, { sparkles: 2, lw: LINE.md, clumps: [[-0.3, 0.1, 0.5], [0.3, 0.05, 0.5], [0, -0.35, 0.5]] });
    s += canopy(doc, ox + 150, oy - 200, 38, 28, lighten(PAL.leaf, 0.05), 83, { sparkles: 2, lw: LINE.md, clumps: [[-0.3, 0.1, 0.5], [0.3, 0.05, 0.5], [0, -0.35, 0.5]] });
    // đom đóm/lấp lánh
    s += sparkle(ox - 150, oy - 290, 6, PAL.yellowLight) + sparkle(ox + 150, oy - 300, 5, PAL.yellowLight);
    return s;
  }, { footprint: [3, 2], tags: ['landmark', 'large'] });

  // ── Cây phép thuật (tím phát sáng) ──
  T('magic', 'magic-tree', dims(182, 214, 12), 'Cây phép thuật: tán tím lavender phát sáng nhẹ, quả cầu sáng – vật hiếm/phần thưởng', (doc, ox, oy) => {
    let s = glow(doc, ox, oy - 120, 96, PAL.lavenderLight, 0.75);
    s += baseShadow(ox, oy - 2, 60, 13);
    s += trunk(doc, ox, oy, oy - 96, 22, '#a98bc4', { bend: 4 });
    const cy = oy - 128;
    s += canopy(doc, ox, cy, 76, 64, PAL.lavender, 91, { sparkles: 0, line: '#7f68c4' });
    const R = rng(93);
    for (let i = 0; i < 7; i++) {
      const a = R() * Math.PI * 2, d = 0.2 + R() * 0.6;
      const x = ox + Math.cos(a) * 64 * d, y = cy + Math.sin(a) * 50 * d;
      s += glow(doc, x, y, 12, PAL.yellowLight, 0.8);
      s += circle(x, y, 5, doc.sphere(PAL.yellowLight), ramp(PAL.yellow).line, LINE.xs);
    }
    for (let i = 0; i < 6; i++) s += sparkle(ox + (R() - 0.5) * 170, oy - 30 - R() * 170, 3 + R() * 4, i % 2 ? '#fff' : PAL.yellowLight);
    return s;
  }, { tags: ['magic', 'rare'] });
}
