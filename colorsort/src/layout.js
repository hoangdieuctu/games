// ── Tính chỗ đặt các ống sao cho luôn vừa khít màn hình iPad, bóng to nhất có thể ──

const TUBE_W_RATIO = 1.19;   // bề ngang ống so với đường kính bóng
const TUBE_H_EXTRA = 0.52;   // phần miệng + đáy ống cộng thêm (theo đường kính bóng)
const GAP_X = 0.26;          // khoảng hở ngang, theo bề ngang ống
const GAP_Y = 0.22;          // khoảng hở dọc, theo chiều cao ống
const LANE = 1.35;           // chiều cao "đường bay" phía trên, theo đường kính bóng
const D_MAX = 118;           // bóng không to quá mức này

export function computeLayout(W, H, count, cap) {
  const padX = Math.max(16, W * 0.035);
  const padY = Math.max(12, H * 0.03);
  const availW = W - padX * 2;
  const availH = H - padY * 2;

  let best = null;
  for (let rows = 1; rows <= 4; rows++) {
    const perRow = Math.ceil(count / rows);
    if (rows > 1 && Math.ceil(count / (rows - 1)) === perRow) continue; // thêm hàng mà không lợi gì
    const tubeW = availW / (perRow * (1 + GAP_X) - GAP_X);
    const dW = tubeW / TUBE_W_RATIO;
    const dH = availH / ((cap + TUBE_H_EXTRA) * (rows * (1 + GAP_Y) - GAP_Y) + LANE);
    const d = Math.min(dW, dH, D_MAX);
    if (!best || d > best.d) best = { rows, perRow, d };
  }

  const { rows, d } = best;
  const r = d / 2;
  const tubeW = d * TUBE_W_RATIO;
  const tubeH = d * (cap + TUBE_H_EXTRA);
  const gapX = tubeW * GAP_X;
  const gapY = tubeH * GAP_Y;

  // Chia số ống cho từng hàng, hàng trên nhiều hơn một quả nếu lẻ.
  const counts = [];
  let left = count;
  for (let i = 0; i < rows; i++) {
    const n = Math.ceil(left / (rows - i));
    counts.push(n); left -= n;
  }

  const blockH = rows * tubeH + (rows - 1) * gapY;
  // Canh giữa khối ống, chỉ đẩy xuống khi cần chừa chỗ cho bóng bay phía trên.
  const top = Math.max(padY + d * 1.15, padY + (availH - blockH) / 2);

  const tubes = [];
  counts.forEach((n, row) => {
    const rowW = n * tubeW + (n - 1) * gapX;
    const x0 = (W - rowW) / 2;
    const y = top + row * (tubeH + gapY);
    for (let i = 0; i < n; i++) {
      const x = x0 + i * (tubeW + gapX);
      tubes.push({
        x, y, w: tubeW, h: tubeH,
        cx: x + tubeW / 2,
        innerBottom: y + tubeH - d * 0.24,
        row,
      });
    }
  });

  return {
    d, r, tubeW, tubeH, rows, tubes,
    laneY: padY + d * 0.6,
    // Tâm quả bóng thứ `i` (tính từ đáy) trong ống `t`.
    ballY: (t, i) => t.innerBottom - r - i * d,
  };
}
