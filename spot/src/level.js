// ── Sinh vòng chơi: đặt đồ vật vào cảnh rồi tạo các điểm khác nhau ──
import { SCENE_W, SCENE_H, levelParams } from './config.js';
import { rng } from './rng.js';
import { NEAR } from './draw.js';
import { themeFor } from './themes.js';

function bbox(spec, x, y, s) {
  return { x1: x - spec.w * s / 2, x2: x + spec.w * s / 2, y1: y - spec.h * s, y2: y };
}
// Hai hộp có chạm nhau không (mỗi hộp co lại một chút để đồ vật được đứng sát nhau).
function overlaps(a, b) {
  const sa = 0.1 * Math.min(a.x2 - a.x1, a.y2 - a.y1), sb = 0.1 * Math.min(b.x2 - b.x1, b.y2 - b.y1);
  return a.x1 + sa < b.x2 - sb && a.x2 - sa > b.x1 + sb && a.y1 + sa < b.y2 - sb && a.y2 - sa > b.y1 + sb;
}
function inScene(box) {
  return box.x1 >= 2 && box.x2 <= SCENE_W - 2 && box.y1 >= 2 && box.y2 <= SCENE_H - 2;
}
// Tâm và bán kính vùng chạm của một đồ vật.
export function hitOf(o) {
  const hy = o.spec.hy == null ? 0.5 : o.spec.hy;
  const r = Math.max(36, Math.min(84, 0.5 * Math.max(o.spec.w, o.spec.h) * o.s));
  return { x: o.x, y: o.y - o.spec.h * o.s * hy, r };
}

function placeObjects(theme, P, R) {
  const placed = [], counts = {};
  let tries = 0;
  while (placed.length < P.objects && tries < 2500) {
    tries++;
    const spec = R.pick(theme.objects);
    if ((counts[spec.id] || 0) >= P.maxDup) continue;
    const zoneName = R.pick(spec.zones);
    const zone = theme.zones[zoneName];
    const rect = R.pick(zone.rects);
    const s = zone.scale * P.scaleMul * R.range(0.85, 1.15);
    const hw = spec.w * s / 2;
    if (rect.x2 - hw < rect.x1 + hw) continue;
    const x = R.range(rect.x1 + hw, rect.x2 - hw);
    const y = zone.top != null ? zone.top + spec.h * s : R.range(Math.max(rect.y1, spec.h * s + 4), Math.max(rect.y1, rect.y2));
    const box = bbox(spec, x, y, s);
    if (!inScene(box)) continue;
    if (placed.some((o) => overlaps(box, o.box))) continue;
    placed.push({
      spec, x, y, s, rot: 0, flip: spec.asym && R.chance(0.3) ? -1 : 1,
      c1: R.pick(spec.c1), c2: spec.c2 ? R.pick(spec.c2) : null,
      n: spec.n ? R.int(spec.n[0], spec.n[1]) : 0, hide: null, tint: 0, zone: zoneName, box, gone: false,
      top: zone.top != null ? zone.top : null,
    });
    counts[spec.id] = (counts[spec.id] || 0) + 1;
  }
  return placed;
}

function pickColor(spec, cur, t, R) {
  const cands = spec.c1.filter((k) => k !== cur);
  const near = cands.filter((k) => (NEAR[cur] || []).includes(k));
  const far = cands.filter((k) => !near.includes(k));
  if (near.length && (R.chance(t) || !far.length)) return R.pick(near);
  return R.pick(far.length ? far : cands);
}

// Tạo một điểm khác nhau trên bản sao `r` của đồ vật `o`. Trả về mô tả hoặc null.
function mutate(o, r, P, R, used, others) {
  const spec = o.spec, opts = [];
  const add = (k) => { if (P.w[k]) opts.push([k, P.w[k] / (1 + 1.5 * (used[k] || 0))]); };
  if (spec.c1.length > 1) add('color');
  add('tint');
  add('missing'); add('size');
  if (spec.asym) add('flip');
  if (spec.rot !== false) add('rot');
  add('move');
  if (spec.n && spec.n[1] > spec.n[0]) add('count');
  if (spec.parts && spec.parts.length) add('part');
  if (!opts.length) return null;

  const kind = R.weighted(opts);
  const hit = hitOf(o);
  const hits = [hit];
  switch (kind) {
    case 'color': r.c1 = pickColor(spec, o.c1, P.t, R); break;
    case 'missing': r.gone = true; break;
    case 'size': {
      const bigger = R.chance(0.5) || o.s < 0.8;
      r.s = o.s * (bigger ? P.sizeMul : 1 / P.sizeMul);
      if (o.top != null) r.y = o.top + spec.h * r.s;   // đồ treo: giữ móc ở thanh
      if (!inScene(bbox(spec, r.x, r.y, r.s))) { r.s = o.s / P.sizeMul; if (o.top != null) r.y = o.top + spec.h * r.s; }
      hits[0] = hitOf(r.s > o.s ? r : o);
      break;
    }
    case 'flip': r.flip = -o.flip; break;
    case 'rot': r.rot = (R.chance(0.5) ? 1 : -1) * P.rotDeg; break;
    case 'move': {
      let ok = false;
      for (let k = 0; k < 12 && !ok; k++) {
        const a = R.range(0, Math.PI * 2);
        let dx = Math.cos(a) * P.moveDist, dy = o.top != null ? 0 : Math.sin(a) * P.moveDist * 0.7;
        if (Math.abs(dx) < P.moveDist * 0.5 || o.top != null) dx = Math.sign(dx || 1) * P.moveDist;
        const nx = o.x + dx, ny = o.y + dy;
        const box = bbox(spec, nx, ny, o.s);
        if (!inScene(box)) continue;
        // không đè hẳn lên đồ vật khác
        if (others.some((q) => q !== o && overlaps(box, q.box))) continue;
        r.x = nx; r.y = ny; ok = true;
      }
      if (!ok) { r.x = o.x + (o.x < SCENE_W / 2 ? P.moveDist : -P.moveDist); }
      hits.push(hitOf(r));
      break;
    }
    case 'count': {
      const [lo, hi] = spec.n;
      let cands = [];
      for (let v = lo; v <= hi; v++) if (v !== o.n) cands.push(v);
      if (P.t > 0.45) { const one = cands.filter((v) => Math.abs(v - o.n) === 1); if (one.length) cands = one; }
      r.n = R.pick(cands);
      break;
    }
    case 'part': r.hide = R.pick(spec.parts); break;
    case 'tint': r.tint = (R.chance(0.5) ? 1 : -1) * P.tint; break;
  }
  used[kind] = (used[kind] || 0) + 1;
  return { kind, hits, obj: o.spec.id };
}

// Sinh toàn bộ vòng L. Kết quả luôn giống nhau với cùng L.
export function buildLevel(L) {
  const theme = themeFor(L);
  const P = levelParams(L);
  const R = rng(L * 7919 + 104729);
  const variant = R.int(0, theme.variants - 1);
  const left = placeObjects(theme, P, R);
  const right = left.map((o) => ({ ...o }));
  const order = R.shuffle(left.map((_, i) => i));
  const diffs = [], used = {};
  for (const i of order) {
    if (diffs.length >= P.diffs) break;
    const d = mutate(left[i], right[i], P, R, used, left);
    if (d) { d.index = i; diffs.push(d); }
  }
  return { L, theme, variant, left, right, diffs, P };
}
