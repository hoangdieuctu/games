// ── Trạng thái động của game, chia sẻ giữa các module ──

export const G = {
  canvas: null,
  ctx: null,
  W: 0, H: 0,
  K: 1, // hệ số phóng theo chiều cao màn hình

  // tiến trình
  day: 1,
  cfg: null,
  running: false,
  paused: false, // đang chơi mini-game
  time: 0,

  // trong ngày
  money: 0,
  moneyShown: 0,
  dayExp: 0,
  spawned: 0,
  spawnTimer: 0,
  paidCount: 0,
  angryCount: 0,
  custId: 0,

  // đơn đặc biệt (mini-game)
  bonusTimer: 0,
  bonusReady: false,
  bonusLeft: 0,

  // thực thể
  customers: [],
  staff: [],      // các bạn phục vụ
  tasks: [],      // hàng đợi việc cho phục vụ (FIFO)
  tables: [],
  waitSpots: [],  // chỗ đứng chờ ở cửa
  plates: [],     // ô đựng món đã nấu xong ở quầy bếp
  orders: [],     // đơn đang chờ tới lượt nấu
  cooking: [],    // món đang trên bếp
  chef: { x: 0, y: 0, bobT: 0 },
  pass: { x: 0, y: 0, w: 0, h: 0 }, // quầy bếp
  water: { x: 0, y: 0 },            // quầy nước
  door: { x: 0, y: 0 },
  selected: null,
  particles: [],
};
