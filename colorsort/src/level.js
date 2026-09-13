// ── Sinh vòng chơi (luôn giải được) và bộ giải dùng cho gợi ý / chấm sao ──
import { levelPlan } from './config.js';

// Một ống là mảng số màu, phần tử 0 nằm dưới đáy.
export const topColor = (t) => (t.length ? t[t.length - 1] : -1);

// Độ dài dải bóng cùng màu trên cùng của một ống.
export function runLen(t) {
  if (!t.length) return 0;
  const c = t[t.length - 1];
  let k = 1;
  while (k < t.length && t[t.length - 1 - k] === c) k++;
  return k;
}

export const isPure = (t) => t.length === 0 || t.every((c) => c === t[0]);

// Xong vòng khi MỌI ống chỉ còn một màu VÀ mỗi màu gom trọn vào đúng một ống.
// Cùng một màu còn nằm ở hai ống là chưa xong, dù ống nào cũng thuần một màu.
export function solved(tubes) {
  const seen = new Set();
  for (const t of tubes) {
    if (!t.length) continue;
    if (!isPure(t)) return false;
    if (seen.has(t[0])) return false;
    seen.add(t[0]);
  }
  return true;
}

// Nước đi hợp lệ: đổ dải trên cùng của `from` sang `to`.
export function canPour(tubes, from, to, cap) {
  if (from === to) return 0;
  const a = tubes[from], b = tubes[to];
  if (!a.length) return 0;
  const space = cap - b.length;
  if (space <= 0) return 0;
  if (b.length && topColor(b) !== topColor(a)) return 0;
  // Không cho di chuyển vô ích: ống đã thuần màu mà đổ sang ống rỗng.
  if (!b.length && a.length === runLen(a)) return 0;
  return Math.min(runLen(a), space);
}

/* ═══ SINH VÒNG ═══
   Chia đều bóng vào các ống cho đủ đầy (giống bàn chơi quen thuộc), rồi nhờ bộ
   giải kiểm tra. Chỉ nhận ván nào giải được, nên bé không bao giờ gặp ván bí. */
// Mốc "đi đẹp": mỗi đoạn bóng rời rạc cần ít nhất một nước để gom lại.
function parOf(tubes, colors, empties) {
  let seg = 0;
  for (const t of tubes) for (let i = 0; i < t.length; i++) if (i === 0 || t[i] !== t[i - 1]) seg++;
  return Math.max(colors, seg - colors + empties);
}

export function buildLevel(n) {
  const plan = levelPlan(n);
  const { colors, cap, empties } = plan;

  const deal = () => {
    const pool = [];
    for (let c = 0; c < colors; c++) for (let i = 0; i < cap; i++) pool.push(c);
    for (let i = pool.length - 1; i > 0; i--) {
      const j = (Math.random() * (i + 1)) | 0;
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    const tubes = [];
    for (let c = 0; c < colors; c++) tubes.push(pool.slice(c * cap, (c + 1) * cap));
    for (let e = 0; e < empties; e++) tubes.push([]);
    return tubes;
  };

  for (let attempt = 0; attempt < 400; attempt++) {
    const tubes = deal();
    if (tubes.some((t) => t.length && isPure(t))) continue;   // đừng cho sẵn màu nào xong
    if (solve(tubes, cap, 250000, 140)) return { tubes, cap, plan, par: parOf(tubes, colors, empties) };
  }

  // Rất hiếm khi tới đây: nới thêm một ống trống cho chắc chắn giải được.
  for (let attempt = 0; attempt < 200; attempt++) {
    const tubes = deal();
    tubes.push([]);
    if (solve(tubes, cap, 250000, 140)) {
      return { tubes, cap, plan: { ...plan, empties: empties + 1 }, par: parOf(tubes, colors, empties + 1) };
    }
  }
  const tubes = deal();
  tubes.push([]);
  return { tubes, cap, plan: { ...plan, empties: empties + 1 }, par: colors * 4 };
}

/* ═══ BỘ GIẢI ═══
   DFS có nhớ trạng thái + giới hạn số nút, ưu tiên nước "hoàn thành ống".
   Trả về mảng nước đi [ [from,to], ... ] hoặc null nếu không tìm ra trong hạn mức. */
export function solve(tubes, cap, nodeCap = 400000, maxDepth = 120) {
  const T = tubes.length;
  const key = (st) => st.map((t) => t.join(',')).sort().join('|');
  const seen = new Set();
  let nodes = 0;
  const path = [];

  // Liệt kê nước đi hợp lệ, đã bỏ trùng (mọi ống rỗng là như nhau) và xếp theo ưu tiên.
  const moves = (st) => {
    const out = [];
    for (let i = 0; i < T; i++) {
      if (!st[i].length) continue;
      if (st[i].length === cap && runLen(st[i]) === cap) continue; // ống đã xong
      let usedEmpty = false;
      for (let j = 0; j < T; j++) {
        const k = canPour(st, i, j, cap);
        if (!k) continue;
        if (!st[j].length) {
          if (usedEmpty) continue;   // các ống rỗng tương đương nhau
          usedEmpty = true;
        }
        // Điểm ưu tiên: hoàn thành ống > gộp vào ống cùng màu > đổ ra ống rỗng.
        let score = st[j].length ? 30 + k * 2 : 0;
        if (st[j].length + k === cap) score += 100;
        if (runLen(st[i]) === st[i].length) score += 20;   // dọn sạch ống nguồn
        out.push([i, j, score]);
      }
    }
    out.sort((a, b) => b[2] - a[2]);
    return out;
  };

  const dfs = (st, depth) => {
    if (solved(st)) return true;
    if (depth >= maxDepth || nodes++ > nodeCap) return false;
    const k = key(st);
    if (seen.has(k)) return false;
    seen.add(k);

    for (const [i, j] of moves(st)) {
      const cnt = canPour(st, i, j, cap);
      if (!cnt) continue;
      const c = topColor(st[i]);
      for (let x = 0; x < cnt; x++) { st[i].pop(); st[j].push(c); }
      path.push([i, j]);
      if (dfs(st, depth + 1)) return true;
      path.pop();
      for (let x = 0; x < cnt; x++) { st[j].pop(); st[i].push(c); }
    }
    return false;
  };

  const work = tubes.map((t) => t.slice());
  const ok = dfs(work, 0);
  return ok ? path.slice() : null;
}

// Nước đi gợi ý tiếp theo, hoặc null nếu bộ giải chịu thua.
export function hintMove(tubes, cap) {
  const s = solve(tubes, cap, 250000, 110);
  if (s && s.length) return s[0];
  // Bộ giải chịu thua (ván rất rối): đưa ra nước đi tốt nhất theo kinh nghiệm.
  let best = null, bestScore = -1;
  for (let i = 0; i < tubes.length; i++) {
    for (let j = 0; j < tubes.length; j++) {
      const k = canPour(tubes, i, j, cap);
      if (!k) continue;
      let sc = tubes[j].length ? 40 + k * 3 : 5;
      if (tubes[j].length + k === cap && tubes[j].length) sc += 100;
      if (runLen(tubes[i]) === tubes[i].length) sc += 20;
      if (sc > bestScore) { bestScore = sc; best = [i, j]; }
    }
  }
  return best;
}
