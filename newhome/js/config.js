// ── Hằng số và dữ liệu game. Đổi số ở đây là đổi cảm giác chơi. ──
export const TILE = 48;
export const COLS = 48, ROWS = 36;
export const T = { GRASS: 0, FOREST: 1, SAND: 2, WATER: 3, FORD: 4, DIRT: 5 };
export const SPEED = 165;          // px/giây
export const PR = 13;              // bán kính va chạm nhân vật
export const CAP = 30;             // sức chứa túi
export const REACH = 70;           // tầm với hành động (px)
export const MAX_PLAYERS = 4;
export const START = { tx: 24, ty: 15 };

export const ENERGY = { max: 100, gather: 4, build: 2, regen: 1 / 3000, fireMul: 4, eat: 25, drink: 15, slowBelow: 20 };

export const RES = {
  wood:  { name: 'Gỗ',        icon: '🪵' },
  stone: { name: 'Đá',        icon: '🪨' },
  fiber: { name: 'Sợi',       icon: '🧶' },
  food:  { name: 'Thức ăn',   icon: '🍎' },
  water: { name: 'Nước',      icon: '💧' },
  seeds: { name: 'Hạt giống', icon: '🌾' },
};
export const RES_KEYS = Object.keys(RES);

// Node tài nguyên: hits = số lần thu; gives = nhận mỗi lần; respawn ms; solid = cản đường
export const NODES = {
  tree:  { icon: '🌲', empty: '🪵', name: 'Cây thông', hits: 3, gives: { wood: 2 },           respawn: 90000,  solid: true,  verb: 'Chặt cây',   size: 46 },
  oak:   { icon: '🌳', empty: '🌳', name: 'Cây táo',   hits: 3, gives: { food: 2 },           respawn: 90000,  solid: true,  verb: 'Hái táo',    size: 46 },
  rock:  { icon: '🪨', empty: '',   name: 'Tảng đá',   hits: 3, gives: { stone: 2 },          respawn: 120000, solid: true,  verb: 'Đập đá',     size: 36 },
  bush:  { icon: '🫐', empty: '🌿', name: 'Bụi dâu',   hits: 2, gives: { food: 2 },           respawn: 80000,  solid: false, verb: 'Hái dâu',    size: 32 },
  grass: { icon: '🌿', empty: '',   name: 'Bụi cỏ',    hits: 1, gives: { fiber: 2 },          respawn: 60000,  solid: false, verb: 'Nhổ cỏ',     size: 30 },
  wheat: { icon: '🌾', empty: '',   name: 'Lúa hoang', hits: 1, gives: { seeds: 2, fiber: 1 }, respawn: 80000,  solid: false, verb: 'Lấy hạt',    size: 32 },
  drift: { icon: '🪵', empty: '',   name: 'Gỗ trôi',   hits: 1, gives: { wood: 3 },           respawn: 100000, solid: false, verb: 'Nhặt gỗ',    size: 30 },
  shell: { icon: '🐚', empty: '',   name: 'Vỏ sò',     hits: 1, gives: { fiber: 1 },          respawn: 70000,  solid: false, verb: 'Nhặt vỏ sò', size: 26 },
};

// Công trình: w×h ô; cost; needs = công trình phải có trước
export const BUILD = {
  campfire: { icon: '🔥', name: 'Lửa trại',     w: 1, h: 1, cost: { wood: 6, stone: 4 },             desc: 'Đứng gần hồi sức nhanh. Cần có trước khi xây nhà.' },
  storage:  { icon: '📦', name: 'Kho chung',    w: 1, h: 1, cost: { wood: 10, fiber: 4 },            desc: 'Cả nhà cất đồ và lấy đồ chung ở đây.' },
  house:    { icon: '🏠', name: 'Ngôi nhà nhỏ', w: 2, h: 2, cost: { wood: 24, stone: 12, fiber: 8 }, needs: 'campfire', desc: 'Ngôi nhà đầu tiên của gia đình mình.' },
  farm:     { icon: '🌱', name: 'Ruộng',        w: 3, h: 3, cost: { wood: 8, fiber: 6 },             desc: '9 ô đất trồng lúa. Cần hạt giống (lúa hoang 🌾) và nước.' },
  well:     { icon: '⛲', name: 'Giếng nước',   w: 1, h: 1, cost: { stone: 10, wood: 4 },            needs: 'house', desc: 'Lấy nước ngay cạnh nhà, khỏi ra sông.' },
};
export const BUILD_ORDER = ['campfire', 'storage', 'house', 'farm', 'well'];

// Cây trồng: s = 0 trống, 1 hạt, 2 mầm, 3 đang lớn, 4 chín
export const CROP = { stageMs: 20000, waterMs: 45000, icons: ['', '🌱', '🌿', '🌾', '🌾'], yieldFood: 3, yieldSeeds: 1 };

export const AVATARS = ['👨', '👩', '👧', '👦', '👴', '👵', '🧑', '🧒'];
export const COLORS = ['#e05a4f', '#2f7fd9', '#f0a830', '#3fae6a', '#9a5fd6', '#e6679c', '#2bb3c0', '#8a6d3b'];
export const EMOTES = ['👋', '❤️', '😄', '🙏', '👍', '😴'];

// 5 bước đầu, tick theo flags của thế giới
export const QUESTS = [
  { key: 'wood',  text: 'Nhặt vài khúc gỗ 🪵' },
  { key: 'stone', text: 'Nhặt vài viên đá 🪨' },
  { key: 'fire',  text: 'Dựng lửa trại 🔥' },
  { key: 'house', text: 'Xây ngôi nhà đầu tiên 🏠' },
  { key: 'plant', text: 'Trồng vụ mùa đầu tiên 🌱' },
];

export const ROOM_PREFIX = 'newhome-vibe-';
export const PEERJS_URL = 'https://cdn.jsdelivr.net/npm/peerjs@1.5.5/dist/peerjs.min.js';
