// ── Bộ sinh số giả ngẫu nhiên có hạt (mulberry32) ──
// Cùng một hạt → cùng một dãy số, nên vòng 7 luôn là cùng một bức tranh.
export function rng(seed) {
  let a = seed >>> 0;
  const next = () => {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const R = next;
  R.range = (lo, hi) => lo + (hi - lo) * next();
  R.int = (lo, hi) => Math.floor(lo + (hi - lo + 1) * next());
  R.chance = (p) => next() < p;
  R.pick = (arr) => arr[Math.floor(next() * arr.length)];
  R.shuffle = (arr) => {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(next() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  };
  R.weighted = (pairs) => {          // [[value, weight], ...]
    let sum = 0;
    for (const p of pairs) sum += p[1];
    let x = next() * sum;
    for (const p of pairs) { x -= p[1]; if (x <= 0) return p[0]; }
    return pairs[pairs.length - 1][0];
  };
  return R;
}
