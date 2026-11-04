// ── Hằng số và đường cong độ khó ──
export const SCENE_W = 800;
export const SCENE_H = 500;
export const TOTAL_LEVELS = 100;
export const HINT_COST = 30;       // giá một gợi ý (tiền vàng)
export const START_COINS = 60;     // tiền có sẵn khi mới chơi
export const HINT_SECONDS = 6;     // vòng gợi ý nhấp nháy bao lâu
export const SAVE_KEY = 'spot-diff-v1';

// Tham số sinh vòng chơi theo số vòng L (1..100).
//   t = 0 ở vòng 1 → 1 ở vòng 100: khác biệt càng lúc càng tinh vi.
//   u = 0 cho tới vòng 50 → 1 ở vòng 100: đồ vật thu nhỏ, chen chúc, khác biệt nằm ở chi tiết bé xíu.
export function levelParams(L) {
  const t = Math.max(0, Math.min(1, (L - 1) / (TOTAL_LEVELS - 1)));
  const u = Math.max(0, Math.min(1, (L - 50) / 50));
  const w = { color: 3, missing: 3, size: 2 };   // trọng số các kiểu khác biệt
  if (L >= 5)  { w.flip = 2; w.rot = 2; }
  if (L >= 12) { w.move = 2; w.count = 2; }
  if (L >= 18) { w.part = 2.5; }
  if (L >= 25) { w.missing = 1.5; w.color = 2; }
  if (L >= 40) { w.missing = 1; }
  if (L >= 50) { w.tint = 3; w.part = 4; w.count = 3; w.color = 1.5; w.size = 1.5; w.rot = 1.5; w.missing = 0.8; }
  if (L >= 75) { w.tint = 4; w.part = 5; w.missing = 0.5; w.size = 1; w.flip = 1.5; }
  return {
    t, u,
    diffs: Math.min(10, 3 + Math.floor((L - 1) / 12)),  // 3 → 10 điểm khác nhau
    objects: Math.round(9 + 14 * t + 10 * u),           // 9 → 23 → 33 đồ vật trong cảnh
    maxDup: L >= 50 ? 3 : 2,                            // một loại đồ vật xuất hiện tối đa bao nhiêu lần
    scaleMul: 1 - 0.3 * u,                              // đồ vật nhỏ dần từ vòng 50
    sizeMul: 1.45 - 0.33 * t,                           // to/nhỏ hơn bao nhiêu lần (1.45 → 1.12)
    rotDeg: 32 - 24 * t,                                // xoay bao nhiêu độ (32 → 8)
    moveDist: 50 - 36 * t,                              // dịch đi bao xa (50 → 14)
    tint: 0.32 - 0.14 * u,                              // đổi sắc độ đậm/nhạt bao nhiêu (0.32 → 0.18)
    w,
  };
}

// Tiền thưởng
export function coinPerDiff(L, replay) { return replay ? 1 : 3 + Math.floor(L / 10); }
export function coinClearBonus(L, replay) { return replay ? 5 : 10 + L; }
export function coinStarBonus(stars, replay) { return replay ? 0 : (stars === 3 ? 15 : stars === 2 ? 5 : 0); }
export function starsFor(hints, wrong) {
  if (hints === 0 && wrong <= 3) return 3;
  if (hints <= 1 && wrong <= 6) return 2;
  return 1;
}
