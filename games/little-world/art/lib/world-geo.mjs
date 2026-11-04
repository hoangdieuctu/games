// ── Hình học phụ trợ cho bản đồ: spline, dải sông, rải điểm trong đa giác ──
import { rng, r2 } from './style.mjs';
import { inPoly } from './world-layout.mjs';

/** Lấy mẫu đường Catmull-Rom qua các điểm (mở). */
export function sampleSpline(pts, step = 12, closed = false) {
  const P = closed ? [pts[pts.length - 1], ...pts, pts[0], pts[1]] : [pts[0], ...pts, pts[pts.length - 1]];
  const out = [];
  const n = closed ? pts.length : pts.length - 1;
  for (let i = 1; i <= n; i++) {
    const p0 = P[i - 1], p1 = P[i], p2 = P[i + 1], p3 = P[i + 2];
    const L = Math.hypot(p2[0] - p1[0], p2[1] - p1[1]);
    const k = Math.max(2, Math.ceil(L / step));
    for (let j = 0; j < k; j++) {
      const t = j / k, t2 = t * t, t3 = t2 * t;
      const f = (a, b, c, d) => 0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
      out.push([f(p0[0], p1[0], p2[0], p3[0]), f(p0[1], p1[1], p2[1], p3[1])]);
    }
  }
  if (!closed) out.push(pts[pts.length - 1]);
  return out;
}

/** Dải có bề rộng thay đổi dọc theo đường (sông) → đa giác. */
export function ribbon(pts, w0, w1, wobble = 0.12, seed = 1) {
  const S = sampleSpline(pts, 10);
  const R = rng(seed);
  const L = [], Rr = [];
  const ph = R() * 6;
  S.forEach((p, i) => {
    const a = S[Math.max(0, i - 1)], b = S[Math.min(S.length - 1, i + 1)];
    let dx = b[0] - a[0], dy = b[1] - a[1]; const l = Math.hypot(dx, dy) || 1; dx /= l; dy /= l;
    const t = i / (S.length - 1);
    const w = (w0 + (w1 - w0) * t) * (1 + wobble * Math.sin(i * 0.35 + ph)) / 2;
    L.push([p[0] - dy * w, p[1] + dx * w]);
    Rr.push([p[0] + dy * w, p[1] - dx * w]);
  });
  return [...L, ...Rr.reverse()];
}

export const polyD = (pts) => 'M' + pts.map(([x, y]) => `${r2(x)},${r2(y)}`).join(' L') + 'Z';
export const lineD = (pts) => 'M' + pts.map(([x, y]) => `${r2(x)},${r2(y)}`).join(' L');

/** Rải điểm ngẫu nhiên (có khoảng cách tối thiểu) trong đa giác, tránh các vùng cấm. */
export function scatter(poly, n, minD, seed, avoid = () => false, bbox) {
  const R = rng(seed);
  const xs = poly.map((p) => p[0]), ys = poly.map((p) => p[1]);
  const [x0, y0, x1, y1] = bbox || [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)];
  const out = [];
  let tries = 0;
  while (out.length < n && tries < n * 60) {
    tries++;
    const p = [R.range(x0, x1), R.range(y0, y1)];
    if (!inPoly(p, poly) || avoid(p)) continue;
    if (out.some((q) => (q[0] - p[0]) ** 2 + (q[1] - p[1]) ** 2 < minD * minD)) continue;
    out.push(p);
  }
  return out;
}

/** Khoảng cách từ điểm tới đường gấp khúc. */
export function distToPolyline(p, pts) {
  let best = Infinity;
  for (let i = 0; i < pts.length - 1; i++) {
    const [ax, ay] = pts[i], [bx, by] = pts[i + 1];
    const dx = bx - ax, dy = by - ay, l2 = dx * dx + dy * dy || 1;
    let t = ((p[0] - ax) * dx + (p[1] - ay) * dy) / l2; t = Math.max(0, Math.min(1, t));
    best = Math.min(best, Math.hypot(p[0] - ax - dx * t, p[1] - ay - dy * t));
  }
  return best;
}

/** Khoảng cách tới cạnh đa giác (bờ). */
export function distToEdge(p, poly) { return distToPolyline(p, [...poly, poly[0]]); }
