// ── Trạng thái động của game, chia sẻ giữa các module ──

export const G = {
  // canvas
  canvas: null,
  ctx: null,
  W: 0, H: 0,
  K: 1, // hệ số phóng theo chiều cao màn hình

  // tiến trình
  day: 1,
  cfg: null,
  running: false,
  time: 0,

  // trong ngày
  money: 0,
  moneyShown: 0,
  spawned: 0,
  spawnTimer: 0,
  paidCount: 0,
  angryCount: 0,
  custId: 0,
  tutorialStep: -1,

  // thực thể
  customers: [],
  staff: [],   // các cô nhân viên
  tasks: [],   // hàng đợi việc cho nhân viên (FIFO)
  stations: [],
  seats: [],
  queueSpots: [],
  register: { x: 0, y: 0, w: 0, h: 0 },
  teaCart: { x: 0, y: 0 },
  door: { x: 0, y: 0 },
  selected: null,
  particles: [],
};

export function loadDay() {
  const d = parseInt(localStorage.getItem('spa_day') || '1', 10);
  G.day = d >= 1 ? d : 1;
}

export function saveDayUnlocked(day) {
  const saved = parseInt(localStorage.getItem('spa_day') || '1', 10);
  if (day > saved) localStorage.setItem('spa_day', String(day));
}
