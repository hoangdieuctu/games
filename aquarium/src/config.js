/* ═══════════════════════ config.js — hằng số, danh mục ═══════════════════════ */

const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const lerp = (a, b, t) => a + (b - a) * t;
const rand = (a = 1, b) => (b === undefined ? Math.random() * a : a + Math.random() * (b - a));
const randInt = (a, b) => Math.floor(rand(a, b + 1));
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const H = 3600;              // giây / giờ
const MIN = 60;
const now = () => Date.now();
// kích cỡ hiển thị: cá lớn được nén lại để không choán hồ
const visSize = (sz) => (sz <= 6 ? sz : 6 + (sz - 6) * 0.6);

const SAVE_KEY = 'ho-ca-thu-gian-v1';
const OFFLINE_CAP = 8 * H;   // tối đa bù thời gian khi mở lại (giây)
const MAX_TANKS = 6;

const RARITY = [
  { key: 'common',    name: 'Thường',      color: '#9fb3c8' },
  { key: 'uncommon',  name: 'Khá',         color: '#5ad17a' },
  { key: 'rare',      name: 'Hiếm',        color: '#4aa8ff' },
  { key: 'epic',      name: 'Cực hiếm',    color: '#c774ff' },
  { key: 'legendary', name: 'Huyền thoại', color: '#ffc63a' },
];
// tỉ lệ ép đẻ cơ bản & thời gian (phút) theo độ hiếm của con lai
const BREED_BASE   = [0.85, 0.65, 0.45, 0.28, 0.12];
const BREED_MIN    = [2, 5, 10, 20, 40];
const INCOME_MIN   = [0.10, 0.25, 0.8, 2.2, 6];      // xu / phút / cá khỏe
const HYBRID_PRICE = [10, 30, 220, 700, 2500];

const TANK_KINDS = {
  main: {
    S: { name: 'Hồ nhỏ 40L',  W: 40,  H: 25, litres: 40,  price: 0,   fit: 0.8 },
    M: { name: 'Hồ vừa 120L', W: 80,  H: 40, litres: 120, price: 180, fit: 0.92 },
    L: { name: 'Hồ lớn 300L', W: 120, H: 50, litres: 300, price: 450, fit: 1.0 },
  },
  breed:    { name: 'Hồ ép đẻ 60L',       W: 50, H: 30, litres: 60, price: 90, fit: 0.85 },
  hospital: { name: 'Hồ dưỡng bệnh 40L',  W: 40, H: 25, litres: 40, price: 70, fit: 0.8 },
};
const KIND_NAME = { main: 'Hồ chính', breed: 'Hồ ép đẻ', hospital: 'Hồ dưỡng bệnh' };
const KIND_ICON = { main: '🐠', breed: '🥚', hospital: '🩺' };

const SUBSTRATES = {
  sand:   { name: 'Cát trắng', price: 15, c1: '#e8d9b5', c2: '#cbb98f' },
  gravel: { name: 'Sỏi màu',   price: 20, c1: '#a58a6c', c2: '#7a6350', speck: true },
  dark:   { name: 'Nền đen',   price: 25, c1: '#2b2f36', c2: '#171a1f', speck: true },
  bare:   { name: 'Không nền', price: 0,  c1: null },
};
const BACKGROUNDS = {
  blue:   { name: 'Xanh biển',   price: 0,  top: '#6fd3ff', bot: '#0b5b93' },
  deep:   { name: 'Biển sâu',    price: 15, top: '#1f6fa8', bot: '#031d38' },
  black:  { name: 'Đen huyền',   price: 20, top: '#233042', bot: '#05070c' },
  forest: { name: 'Rừng thủy sinh', price: 25, top: '#8fd9a8', bot: '#0d4a3a' },
};

const EQUIPMENT = {
  filter: { name: 'Máy lọc',   levels: ['Không', 'Lọc nhỏ', 'Lọc lớn'], price: [0, 40, 110] },
  heater: { name: 'Máy sưởi',  price: 50 },
  air:    { name: 'Máy sủi',   price: 30 },
  light:  { name: 'Đèn',       levels: ['Tắt', 'Đèn dịu', 'Đèn sáng'], price: [0, 20, 60] },
};

// Trang trí & cây thủy sinh. w,h tính bằng cm.
const DECO = {
  rock_s:  { name: 'Đá cuội',        price: 10, kind: 'rock',    w: 8,  h: 5,  hide: 0 },
  rock_l:  { name: 'Tảng đá',        price: 25, kind: 'rock',    w: 16, h: 11, hide: 0.5 },
  wood:    { name: 'Gỗ lũa',         price: 40, kind: 'wood',    w: 24, h: 16, hide: 1 },
  cave:    { name: 'Hang đá',        price: 45, kind: 'cave',    w: 16, h: 10, hide: 1.5 },
  castle:  { name: 'Lâu đài',        price: 60, kind: 'castle',  w: 14, h: 18, hide: 1 },
  shell:   { name: 'Vỏ sò',          price: 8,  kind: 'shell',   w: 6,  h: 4,  hide: 0 },
  bubbler: { name: 'Đá sủi',         price: 20, kind: 'bubbler', w: 5,  h: 3,  hide: 0, o2: 6 },
  moss:    { name: 'Rêu Java',       price: 10, kind: 'plant',   w: 8,  h: 4,  hide: 0.5, plant: 1, o2: 2, style: 'moss' },
  anubias: { name: 'Ráy Nana',       price: 15, kind: 'plant',   w: 10, h: 8,  hide: 0.8, plant: 1, o2: 3, style: 'round' },
  fern:    { name: 'Dương xỉ Java',  price: 15, kind: 'plant',   w: 12, h: 14, hide: 1,   plant: 1, o2: 3, style: 'fern' },
  vallis:  { name: 'Cỏ hẹ nước',     price: 12, kind: 'plant',   w: 8,  h: 24, hide: 1,   plant: 1, o2: 4, style: 'grass' },
  amazon:  { name: 'Trầu bà Amazon', price: 20, kind: 'plant',   w: 16, h: 18, hide: 1.2, plant: 1, o2: 4, style: 'broad' },
  red:     { name: 'Huyết tâm lan',  price: 25, kind: 'plant',   w: 10, h: 16, hide: 0.8, plant: 1, o2: 3, style: 'red' },
};

const MEDS = {
  ich:        { name: 'Thuốc trị nấm trắng', price: 25, harmInverts: true,  desc: 'Trị đốm trắng (Ich). Hại tép, ốc.' },
  antibiotic: { name: 'Kháng sinh',          price: 30, harmInverts: false, desc: 'Trị thối vây, nhiễm khuẩn.' },
  antifungal: { name: 'Xanh Methylen',       price: 20, harmInverts: false, desc: 'Trị nấm bông. Làm nước xanh nhẹ.' },
  copper:     { name: 'Thuốc đồng',          price: 30, harmInverts: true,  desc: 'Trị nấm nhung (Velvet). Rất hại tép, ốc.' },
  epsom:      { name: 'Muối Epsom',          price: 10, harmInverts: false, desc: 'Trị sình bụng, rối loạn bong bóng.' },
};
const MED_HOURS = 2;

const DISEASES = {
  ich: {
    name: 'Nấm trắng (Ich)', visual: 'dots', contagious: 0.35, med: 'ich',
    symptoms: ['Đốm trắng nhỏ như hạt muối trên thân và vây', 'Cọ mình vào đá, trang trí', 'Thở gấp, kẹp vây'],
    causes: 'Sốc nhiệt, nước lạnh hoặc dao động, căng thẳng khi mới chuyển hồ.',
    treat: ['Bật máy sưởi, tăng nhiệt lên 29–30°C trong vài ngày', 'Dùng Thuốc trị nấm trắng cho cả hồ (chuyển tép/ốc đi trước)', 'Thay nước 30% và dọn đáy để hút bào tử'],
  },
  finrot: {
    name: 'Thối vây', visual: 'ragged', contagious: 0, med: 'antibiotic',
    symptoms: ['Vây rách, mép vây trắng đục hoặc đen', 'Vây ngày càng ngắn', 'Bơi lờ đờ, kém ăn'],
    causes: 'Nước bẩn, độc cao, hoặc bị cá khác rỉa vây liên tục.',
    treat: ['Thay nước 30% và dọn hồ ngay', 'Tách cá cắn vây (tứ vân, xiêm) sang hồ khác', 'Dùng Kháng sinh'],
  },
  fungus: {
    name: 'Nấm bông', visual: 'fuzz', contagious: 0.15, med: 'antifungal',
    symptoms: ['Mảng trắng như bông gòn trên thân hoặc miệng', 'Kém ăn, hay đứng yên'],
    causes: 'Nước bẩn, vết thương, sức đề kháng yếu do căng thẳng.',
    treat: ['Cách ly sang hồ dưỡng bệnh', 'Dùng Xanh Methylen', 'Giữ nước sạch, thay nước đều'],
  },
  bloat: {
    name: 'Sình bụng', visual: 'swollen', contagious: 0, med: 'epsom',
    symptoms: ['Bụng phình to', 'Vảy hơi dựng', 'Khó bơi, nổi hoặc chìm'],
    causes: 'Cho ăn quá nhiều, quá thường xuyên.',
    treat: ['Ngưng cho ăn 1–2 ngày', 'Dùng Muối Epsom', 'Giữ nhiệt độ ổn định'],
  },
  velvet: {
    name: 'Nấm nhung (Velvet)', visual: 'dust', contagious: 0.3, med: 'copper',
    symptoms: ['Lớp bụi vàng nâu óng ánh trên thân', 'Cọ mình, thở gấp', 'Kẹp vây, trốn góc'],
    causes: 'Nước độc, ammonia cao, căng thẳng kéo dài.',
    treat: ['Thay nước 30%', 'Dùng Thuốc đồng (rất hại tép, ốc — chuyển đi trước)', 'Giảm đèn trong lúc điều trị'],
  },
  swim: {
    name: 'Rối loạn bong bóng', visual: 'tilt', contagious: 0, med: 'epsom',
    symptoms: ['Bơi nghiêng, lật ngửa', 'Nổi lên mặt hoặc chìm đáy', 'Khó giữ thăng bằng'],
    causes: 'Nước lạnh, ăn quá no, táo bón (hay gặp ở cá vàng, cá tròn).',
    treat: ['Tăng nhiệt nhẹ bằng máy sưởi', 'Ngưng cho ăn 1–2 ngày', 'Dùng Muối Epsom'],
  },
};

/* ── Loài ─────────────────────────────────────────────────────────────────
   shape: torpedo | oval | fan | veil | tall | disc | bottom | pleco | koi | fancy | sword
          | dragon | phoenix | shrimp | snail
   zone: top | mid | bottom       temper: peace | semi | aggr
   hardy: hệ số nhạy với nước xấu (cao = nhạy hơn)                          */
const SPECIES = {
  guppy: { name: 'Cá Bảy Màu', sub: 'Guppy', rarity: 0, price: 8, size: 4, shape: 'fan', zone: 'top', speed: 6,
    school: 3, temper: 'peace', longFin: true, temp: [22, 28], hardy: 0.8, pattern: 'speckle',
    variants: [
      { body: '#ffb347', fin: '#ff5e3a', accent: '#ffe66d' },
      { body: '#5ad0ff', fin: '#3b6cff', accent: '#c3f0ff' },
      { body: '#ff6bcb', fin: '#b83dff', accent: '#ffd6f5' },
      { body: '#7cff8a', fin: '#12b886', accent: '#e6ffe9' },
    ],
    desc: 'Dễ nuôi, đẻ nhiều, đuôi xoè rực rỡ. Thích sống theo nhóm nhỏ.' },
  neon: { name: 'Cá Neon', sub: 'Neon tetra', rarity: 0, price: 6, size: 3, shape: 'torpedo', zone: 'mid', speed: 9,
    school: 6, temper: 'peace', shy: true, temp: [22, 27], hardy: 1.1, pattern: 'neon',
    col: { body: '#cfd8e6', fin: '#ff3b3b', accent: '#00e5ff' },
    desc: 'Sọc lam phát sáng, đi đàn từ 6 con mới yên tâm. Cần cây để trốn.' },
  platy: { name: 'Cá Hột Lựu', sub: 'Platy', rarity: 0, price: 8, size: 5, shape: 'oval', zone: 'mid', speed: 6,
    school: 3, temper: 'peace', temp: [22, 28], hardy: 0.8, pattern: 'plain',
    col: { body: '#ff8a3d', fin: '#ff5a1f', accent: '#ffc48a' },
    desc: 'Hiền, khoẻ, màu cam đỏ ấm áp. Rất hợp cho người mới.' },
  molly: { name: 'Cá Trân Châu', sub: 'Molly', rarity: 0, price: 10, size: 7, shape: 'oval', zone: 'mid', speed: 6,
    school: 3, temper: 'peace', temp: [24, 28], hardy: 0.9, pattern: 'plain',
    variants: [
      { body: '#242a35', fin: '#161a22', accent: '#3a4250' },
      { body: '#f2f2f2', fin: '#d8d8d8', accent: '#222', spots: true },
    ],
    desc: 'Đen tuyền hoặc trắng đốm. Ăn rêu nhẹ, hiền lành.' },
  danio: { name: 'Cá Ngựa Vằn', sub: 'Zebra danio', rarity: 0, price: 6, size: 4, shape: 'torpedo', zone: 'top', speed: 12,
    school: 6, temper: 'peace', temp: [18, 27], hardy: 0.7, pattern: 'hstripes',
    col: { body: '#dbe4ee', fin: '#c0ccd9', accent: '#2c3e50' },
    desc: 'Bơi nhanh không ngừng, chịu lạnh tốt. Đàn 6 con trở lên.' },
  sword: { name: 'Cá Đuôi Kiếm', sub: 'Swordtail', rarity: 0, price: 10, size: 8, shape: 'sword', zone: 'mid', speed: 7,
    school: 3, temper: 'peace', temp: [22, 28], hardy: 0.8, pattern: 'plain',
    col: { body: '#ff4d2e', fin: '#d13a1f', accent: '#ff9a7a' },
    desc: 'Đuôi dưới kéo dài như lưỡi kiếm. Khoẻ, hiền.' },
  cory: { name: 'Cá Chuột', sub: 'Corydoras', rarity: 0, price: 12, size: 5, shape: 'bottom', zone: 'bottom', speed: 5,
    school: 4, temper: 'peace', temp: [22, 27], hardy: 0.9, pattern: 'spots', cleaner: 'dirt',
    col: { body: '#b9a27f', fin: '#9c8666', accent: '#5c4a32' },
    desc: 'Lục lọi đáy hồ ăn thức ăn thừa, giúp hồ sạch hơn. Đi nhóm 4+.' },
  betta: { name: 'Cá Xiêm', sub: 'Betta', rarity: 1, price: 25, size: 6, shape: 'veil', zone: 'top', speed: 4,
    school: 0, temper: 'aggr', longFin: true, temp: [25, 30], hardy: 0.9, pattern: 'iridescent', minLitres: 20,
    col: { body: '#2748ff', fin: '#ff2d55', accent: '#8f5cff' },
    desc: 'Vây voan lộng lẫy. Hai con xiêm cùng hồ sẽ đánh nhau; hay rỉa cá vây dài.' },
  goldfish: { name: 'Cá Vàng', sub: 'Goldfish', rarity: 1, price: 20, size: 14, shape: 'fancy', zone: 'mid', speed: 4,
    school: 0, temper: 'peace', temp: [18, 26], hardy: 0.8, pattern: 'plain', bioload: 2, minLitres: 100,
    col: { body: '#ffa726', fin: '#ff8f00', accent: '#ffe0b2' },
    desc: 'Cá nước mát, ăn nhiều thải nhiều. Cần hồ rộng và lọc tốt.' },
  angel: { name: 'Cá Thần Tiên', sub: 'Angelfish', rarity: 1, price: 35, size: 12, shape: 'tall', zone: 'mid', speed: 5,
    school: 2, temper: 'semi', temp: [24, 29], hardy: 1.1, pattern: 'bars', minLitres: 100,
    col: { body: '#e8eef5', fin: '#cfd8e6', accent: '#1c2333' },
    desc: 'Dáng cao thanh thoát. Có thể ăn cá nhỏ như neon khi lớn.' },
  pleco: { name: 'Cá Lau Kiếng', sub: 'Bristlenose pleco', rarity: 1, price: 30, size: 10, shape: 'pleco', zone: 'bottom', speed: 3,
    school: 0, temper: 'peace', temp: [23, 28], hardy: 0.8, pattern: 'spots', cleaner: 'algae', minLitres: 60,
    col: { body: '#4b3d2e', fin: '#3a2e22', accent: '#d9c7a0' },
    desc: 'Chuyên cạo rêu trên kính và đá. Bám kính cả ngày.' },
  barb: { name: 'Cá Tứ Vân', sub: 'Tiger barb', rarity: 1, price: 12, size: 6, shape: 'oval', zone: 'mid', speed: 10,
    school: 6, temper: 'semi', nipper: true, temp: [22, 27], hardy: 0.8, pattern: 'bars',
    col: { body: '#ffb347', fin: '#ff3b3b', accent: '#1b1b1b' },
    desc: 'Sọc hổ nghịch ngợm, hay rỉa vây cá vây dài. Đàn 6 con giảm tính hung.' },
  discus: { name: 'Cá Dĩa', sub: 'Discus', rarity: 2, price: 90, size: 15, shape: 'disc', zone: 'mid', speed: 4,
    school: 5, temper: 'peace', shy: true, temp: [28, 31], hardy: 1.7, pattern: 'wave', minLitres: 200,
    col: { body: '#3f8cff', fin: '#2f6fd8', accent: '#ff6b3d' },
    desc: 'Vua hồ thủy sinh: đẹp nhưng khó, cần nước ấm 28–31°C và rất sạch.' },
  koi: { name: 'Cá Koi', sub: 'Koi', rarity: 2, price: 150, size: 25, shape: 'koi', zone: 'mid', speed: 4,
    school: 2, temper: 'peace', temp: [15, 26], hardy: 0.9, pattern: 'patch', bioload: 2, minLitres: 300,
    col: { body: '#f5f5f5', fin: '#e6e6e6', accent: '#ff3b1f' },
    desc: 'Biểu tượng may mắn. Lớn và ăn nhiều, chỉ hợp hồ 300L nước mát.' },

  /* thủy sinh khác */
  shrimp: { name: 'Tép Đỏ', sub: 'Cherry shrimp', rarity: 0, price: 6, size: 2, shape: 'shrimp', zone: 'bottom', speed: 3,
    school: 0, temper: 'peace', temp: [20, 28], hardy: 1.2, invert: true, cleaner: 'dirt', pattern: 'plain',
    col: { body: '#ff3b3b', fin: '#ff7a7a', accent: '#ffd0d0' },
    desc: 'Nhặt vụn thức ăn, rất nhạy với thuốc đồng và thuốc nấm trắng.' },
  snail: { name: 'Ốc Nerita', sub: 'Nerite snail', rarity: 0, price: 5, size: 2, shape: 'snail', zone: 'bottom', speed: 1,
    school: 0, temper: 'peace', temp: [20, 29], hardy: 1.0, invert: true, cleaner: 'algae', pattern: 'plain',
    col: { body: '#5c3d1e', fin: '#3a2510', accent: '#f0c060' },
    desc: 'Ăn rêu trên kính không ngừng nghỉ. Không sinh sản trong nước ngọt.' },

  /* ── Loài lai (không mua được, phải ép đẻ) ── */
  neonguppy: { name: 'Bảy Màu Neon', sub: 'Guppy × Neon', rarity: 2, parents: ['guppy', 'neon'], size: 5, shape: 'fan', zone: 'top', speed: 6,
    school: 3, temper: 'peace', longFin: true, temp: [22, 28], hardy: 0.9, pattern: 'neon', glow: 1,
    col: { body: '#5ad0ff', fin: '#ff3b8c', accent: '#00e5ff' },
    desc: 'Đuôi xoè phát sáng lam neon. Bơi tầng mặt như đèn nhỏ.' },
  veilbetta: { name: 'Xiêm Voan', sub: 'Betta × Guppy', rarity: 2, parents: ['betta', 'guppy'], size: 7, shape: 'veil', zone: 'top', speed: 4,
    school: 0, temper: 'aggr', longFin: true, temp: [24, 30], hardy: 0.9, pattern: 'iridescent', glow: 1, finScale: 1.2,
    col: { body: '#7b2cff', fin: '#ff4fd8', accent: '#ffe66d' },
    desc: 'Vây voan dài gấp rưỡi, óng ánh tím hồng.' },
  goldkoi: { name: 'Koi Kim', sub: 'Koi × Cá vàng', rarity: 2, parents: ['koi', 'goldfish'], size: 20, shape: 'koi', zone: 'mid', speed: 4,
    school: 2, temper: 'peace', temp: [18, 27], hardy: 0.9, pattern: 'patch', glow: 1, bioload: 2, minLitres: 200,
    col: { body: '#ffd54f', fin: '#ffb300', accent: '#ff6f00' },
    desc: 'Vảy vàng kim lấp lánh, mảng cam lửa.' },
  bluezebra: { name: 'Vằn Lam', sub: 'Neon × Ngựa vằn', rarity: 2, parents: ['neon', 'danio'], size: 4, shape: 'torpedo', zone: 'top', speed: 12,
    school: 6, temper: 'peace', temp: [20, 27], hardy: 0.9, pattern: 'hstripes', glow: 1,
    col: { body: '#0f2a5a', fin: '#1f4a8a', accent: '#35f0ff' },
    desc: 'Sọc lam điện phát sáng, cả đàn bơi như tia chớp.' },
  armorcat: { name: 'Chuột Giáp', sub: 'Chuột × Lau kiếng', rarity: 2, parents: ['cory', 'pleco'], size: 8, shape: 'bottom', zone: 'bottom', speed: 4,
    school: 2, temper: 'peace', temp: [22, 28], hardy: 0.7, pattern: 'plates', cleaner: 'both',
    col: { body: '#5d6b7a', fin: '#46525e', accent: '#c9d6e3' },
    desc: 'Vảy giáp bạc, vừa dọn đáy vừa cạo rêu. Người quét hồ hoàn hảo.' },
  tigerbetta: { name: 'Hổ Xiêm', sub: 'Betta × Tứ vân', rarity: 3, parents: ['betta', 'barb'], size: 8, shape: 'veil', zone: 'mid', speed: 6,
    school: 0, temper: 'aggr', longFin: true, nipper: true, temp: [24, 29], hardy: 0.9, pattern: 'bars', glow: 1, finScale: 1.12,
    col: { body: '#ff8a00', fin: '#ff2d2d', accent: '#1b1b1b' },
    desc: 'Sọc hổ trên vây voan lửa. Rất dữ, nên nuôi một mình.' },
  angeldisc: { name: 'Thiên Thần Ngọc', sub: 'Thần tiên × Dĩa', rarity: 3, parents: ['angel', 'discus'], size: 16, shape: 'disc', zone: 'mid', speed: 4,
    school: 3, temper: 'peace', shy: true, temp: [27, 30], hardy: 1.5, pattern: 'iridescent', glow: 2, finScale: 1.15, minLitres: 200,
    col: { body: '#7fd4ff', fin: '#b9ecff', accent: '#ff7edb' },
    desc: 'Đĩa ngọc trai đổi màu theo ánh sáng, vây dài như dải lụa.' },
  lanvu: { name: 'Lân Vũ', sub: 'Xiêm voan × Bảy màu neon', rarity: 3, parents: ['veilbetta', 'neonguppy'], size: 8, shape: 'veil', zone: 'top', speed: 5,
    school: 0, temper: 'semi', longFin: true, temp: [24, 29], hardy: 0.9, pattern: 'neon', glow: 2, finScale: 1.3,
    col: { body: '#ff5fa2', fin: '#8a2bff', accent: '#00f0ff' },
    desc: 'Vây như lông vũ kỳ lân, viền neon phát sáng.' },
  pearl: { name: 'Bạch Ngọc', sub: 'Chuột giáp × Koi kim', rarity: 3, parents: ['armorcat', 'goldkoi'], size: 18, shape: 'koi', zone: 'mid', speed: 4,
    school: 0, temper: 'peace', temp: [18, 28], hardy: 0.7, pattern: 'iridescent', glow: 2, minLitres: 120,
    col: { body: '#ffffff', fin: '#e9defc', accent: '#d7c3ff' },
    desc: 'Toàn thân trắng ngọc trai ánh tím. Rất khoẻ.' },
  dragon: { name: 'Long Ngư', sub: 'Koi kim × Thiên thần ngọc', rarity: 4, parents: ['goldkoi', 'angeldisc'], size: 30, shape: 'dragon', zone: 'mid', speed: 5,
    school: 0, temper: 'semi', temp: [22, 30], hardy: 0.8, pattern: 'scales', glow: 3, minLitres: 200,
    col: { body: '#ff9a1f', fin: '#ffd700', accent: '#ff2a2a' },
    desc: 'Rồng nước thần thoại: thân dài uốn lượn, râu vàng, vảy lửa toả sáng.' },
  phoenix: { name: 'Phượng Hoàng Lửa', sub: 'Vằn lam × Lân vũ', rarity: 4, parents: ['bluezebra', 'lanvu'], size: 14, shape: 'phoenix', zone: 'top', speed: 7,
    school: 0, temper: 'semi', longFin: true, temp: [24, 30], hardy: 0.8, pattern: 'flame', glow: 3, minLitres: 100,
    col: { body: '#ff3d00', fin: '#ffab00', accent: '#fff176' },
    desc: 'Đuôi lửa kéo dài để lại vệt tàn lửa lung linh khi bơi.' },
  celestial: { name: 'Thiên Hà', sub: 'Bạch ngọc × Hổ xiêm', rarity: 4, parents: ['pearl', 'tigerbetta'], size: 16, shape: 'veil', zone: 'mid', speed: 5,
    school: 0, temper: 'semi', longFin: true, temp: [22, 30], hardy: 0.7, pattern: 'stars', glow: 3, finScale: 1.25, minLitres: 120,
    col: { body: '#1a0b3d', fin: '#4a2bd8', accent: '#9d7bff' },
    desc: 'Thân đêm tím thẫm lấm tấm sao, vây voan như dải ngân hà.' },
};
for (const [id, s] of Object.entries(SPECIES)) {
  s.id = id;
  if (!s.col) s.col = s.variants[0];
  if (s.parents) s.price = HYBRID_PRICE[s.rarity];
  s.bioload = s.bioload || 1;
}
const BUYABLE = Object.values(SPECIES).filter((s) => !s.parents);
const HYBRIDS = Object.values(SPECIES).filter((s) => s.parents);

function findRecipe(a, b) {
  return HYBRIDS.find((h) => (h.parents[0] === a && h.parents[1] === b) || (h.parents[0] === b && h.parents[1] === a)) || null;
}

const FISH_NAMES = ['Bông', 'Mít', 'Tí', 'Sò', 'Kẹo', 'Bơ', 'Xíu', 'Nấm', 'Đậu', 'Mun', 'Cam', 'Sóc', 'Bí', 'Mèo', 'Chôm', 'Nhím',
  'Mây', 'Tép', 'Bún', 'Muối', 'Kem', 'Cốm', 'Khoai', 'Sao', 'Mưa', 'Bống', 'Lúa', 'Hạt', 'Bạc', 'Gấu', 'Su', 'Ổi', 'Dâu', 'Na'];

const fmtDur = (s) => {
  s = Math.max(0, Math.round(s));
  if (s < 60) return s + ' giây';
  if (s < 3600) return Math.floor(s / 60) + ' phút' + (s % 60 ? ' ' + (s % 60) + 's' : '');
  const h = Math.floor(s / 3600), m = Math.round((s % 3600) / 60);
  return h + ' giờ' + (m ? ' ' + m + ' phút' : '');
};
const fmtCoins = (n) => (n >= 1000 ? (n / 1000).toFixed(n >= 10000 ? 0 : 1) + 'k' : Math.floor(n).toString());
const pct = (v) => Math.round(v * 100) + '%';
