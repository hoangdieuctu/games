// ── Nội dung game: vùng → hoạt động, giá đồ trên đảo, huy hiệu ──
// Thêm hoạt động mới: khai báo ở ACTIVITIES (scene + mode) và gắn vào một vùng ở REGION_ACTS.

export type Res = 'star' | 'seed' | 'wood' | 'stone' | 'flower' | 'shell';
export const RES_LIST: Res[] = ['star', 'seed', 'wood', 'stone', 'flower', 'shell'];
export const RES_NAMES: Record<Res, string> = {
  star: 'Sao', seed: 'Hạt giống', wood: 'Gỗ', stone: 'Đá', flower: 'Hoa', shell: 'Vỏ sò',
};
export const RES_USE: Record<Res, string> = {
  star: 'Mở vùng đất mới và đồ trang trí đặc biệt',
  seed: 'Gieo vào luống đất, trồng cây và bụi cỏ',
  wood: 'Làm nhà, ghế, hàng rào, cầu',
  stone: 'Lát đường, làm giếng, đài phun nước',
  flower: 'Trồng hoa và chậu hoa',
  shell: 'Trang trí bãi biển',
};

export type Skill = 'nature' | 'logic' | 'memory' | 'math' | 'creative' | 'life' | 'science';
export const SKILL_NAMES: Record<Skill, string> = {
  nature: 'Nhận biết & ngôn ngữ', logic: 'Logic & hình khối', memory: 'Trí nhớ', math: 'Toán học',
  creative: 'Sáng tạo & không gian', life: 'Kỹ năng sống', science: 'Khám phá & khoa học',
};

export interface Activity {
  id: string; scene: string; mode?: string; name: string; desc: string;
  skill: Skill; region: string; reward: Partial<Record<Res, number>>; rounds: number;
}

export const ACTIVITIES: Activity[] = [
  { id: 'animal-match', scene: 'AnimalMatch', mode: 'find', name: 'Tìm bạn thú', desc: 'Nghe tên và chọn đúng con vật', skill: 'nature', region: 'animal-island', reward: { star: 3, seed: 2 }, rounds: 5 },
  { id: 'animal-habitat', scene: 'AnimalMatch', mode: 'habitat', name: 'Nhà của thú', desc: 'Đưa con vật về đúng nơi ở', skill: 'nature', region: 'animal-island', reward: { star: 3, seed: 2 }, rounds: 5 },
  { id: 'memory', scene: 'Memory', name: 'Lật thẻ ghi nhớ', desc: 'Lật thẻ, tìm hai thẻ giống nhau', skill: 'memory', region: 'puzzle-forest', reward: { star: 3, wood: 2 }, rounds: 1 },
  { id: 'shape-puzzle', scene: 'ShapePuzzle', name: 'Ghép hình', desc: 'Kéo mảnh ghép vào đúng bóng', skill: 'logic', region: 'puzzle-forest', reward: { star: 3, wood: 2 }, rounds: 3 },
  { id: 'pattern', scene: 'Pattern', name: 'Tìm quy luật', desc: 'Xem dãy hình lặp lại, chọn hình còn thiếu', skill: 'logic', region: 'math-mountain', reward: { star: 3, stone: 2 }, rounds: 5 },
  { id: 'count', scene: 'CountCollect', name: 'Đếm và hái', desc: 'Hái đúng số quả, so sánh và cộng', skill: 'math', region: 'math-mountain', reward: { star: 3, stone: 2 }, rounds: 5 },
  { id: 'builder', scene: 'Builder', name: 'Bé xây dựng', desc: 'Xếp khối thành tháp, nhà, cầu', skill: 'creative', region: 'creative-town', reward: { star: 3, wood: 3 }, rounds: 1 },
  { id: 'coloring', scene: 'Coloring', name: 'Bé tô màu', desc: 'Chọn bút màu và tô bức tranh', skill: 'creative', region: 'creative-town', reward: { star: 3, flower: 2, seed: 1 }, rounds: 1 },
  { id: 'pet-care', scene: 'PetCare', name: 'Chăm bạn thú', desc: 'Xem bạn thú cần gì và giúp bạn ấy', skill: 'life', region: 'life-skills-village', reward: { star: 3, seed: 2, wood: 1 }, rounds: 5 },
  { id: 'sort-trash', scene: 'Sort', mode: 'trash', name: 'Phân loại rác', desc: 'Bỏ rác vào đúng thùng', skill: 'life', region: 'life-skills-village', reward: { star: 3, seed: 1, flower: 2 }, rounds: 1 },
  { id: 'ocean-clean', scene: 'Sort', mode: 'ocean', name: 'Biển sạch', desc: 'Nhặt rác, giữ lại các bạn biển', skill: 'science', region: 'adventure-ocean', reward: { star: 3, shell: 3 }, rounds: 1 },
];
export const actById = (id: string) => ACTIVITIES.find((a) => a.id === id);

/** Số sao cần để mở vùng (vùng 0 sao mở sẵn). */
export const REGION_STARS: Record<string, number> = {
  'animal-island': 0, 'puzzle-forest': 0, 'math-mountain': 6, 'creative-town': 12, 'life-skills-village': 20, 'adventure-ocean': 28,
};

// ───────── giá đồ trên đảo (mua bằng tài nguyên kiếm được khi chơi) ─────────
export type Cost = Partial<Record<Res, number>>;
export interface ShopItem { asset: string; cost: Cost; group: 'plant' | 'tree' | 'deco' | 'build' | 'ground'; name: string; }
export const SHOP: ShopItem[] = [
  // hoa & cỏ
  { asset: 'island-plant-flower-pink', cost: { flower: 1 }, group: 'plant', name: 'Hoa hồng phấn' },
  { asset: 'island-plant-flower-yellow', cost: { flower: 1 }, group: 'plant', name: 'Hoa vàng' },
  { asset: 'island-plant-flower-lavender', cost: { flower: 1 }, group: 'plant', name: 'Hoa oải hương' },
  { asset: 'island-plant-flower-white', cost: { flower: 1 }, group: 'plant', name: 'Hoa cúc trắng' },
  { asset: 'island-plant-flower-tulip', cost: { flower: 1 }, group: 'plant', name: 'Hoa tulip' },
  { asset: 'island-plant-flower-blue', cost: { flower: 1 }, group: 'plant', name: 'Hoa xanh' },
  { asset: 'island-plant-grass-1', cost: { seed: 1 }, group: 'plant', name: 'Bụi cỏ' },
  { asset: 'island-plant-bush-1', cost: { seed: 2 }, group: 'plant', name: 'Bụi cây' },
  { asset: 'island-plant-bush-2', cost: { seed: 2 }, group: 'plant', name: 'Bụi quả mọng' },
  { asset: 'island-plant-bush-3', cost: { seed: 2, flower: 1 }, group: 'plant', name: 'Bụi hoa' },
  { asset: 'island-plant-hedge-small', cost: { seed: 2 }, group: 'plant', name: 'Bờ rào cây' },
  { asset: 'island-plant-mushroom-red', cost: { seed: 1 }, group: 'plant', name: 'Nấm đỏ' },
  { asset: 'island-plant-mushroom-glow', cost: { seed: 2, star: 2 }, group: 'plant', name: 'Nấm phát sáng' },
  // cây
  { asset: 'island-tree-oak-1', cost: { seed: 3 }, group: 'tree', name: 'Cây sồi' },
  { asset: 'island-tree-pine-1', cost: { seed: 3 }, group: 'tree', name: 'Cây thông' },
  { asset: 'island-tree-apple', cost: { seed: 4 }, group: 'tree', name: 'Cây táo' },
  { asset: 'island-tree-orange', cost: { seed: 4 }, group: 'tree', name: 'Cây cam' },
  { asset: 'island-tree-blossom', cost: { seed: 4, flower: 1 }, group: 'tree', name: 'Cây hoa anh đào' },
  { asset: 'island-tree-palm', cost: { seed: 3, shell: 1 }, group: 'tree', name: 'Cây dừa' },
  { asset: 'island-tree-magic', cost: { seed: 5, star: 10 }, group: 'tree', name: 'Cây phép màu' },
  // mặt đất
  { asset: 'island-terrain-plot-empty', cost: { wood: 1, seed: 1 }, group: 'ground', name: 'Luống đất' },
  { asset: 'island-terrain-path-stones', cost: { stone: 2 }, group: 'ground', name: 'Đường đá' },
  { asset: 'island-terrain-rock-2', cost: { stone: 1 }, group: 'ground', name: 'Hòn đá' },
  { asset: 'island-terrain-rock-mossy', cost: { stone: 1, seed: 1 }, group: 'ground', name: 'Đá rêu' },
  { asset: 'island-terrain-sand-patch', cost: { shell: 2 }, group: 'ground', name: 'Bãi cát' },
  { asset: 'island-terrain-meadow', cost: { flower: 3 }, group: 'ground', name: 'Thảm hoa' },
  { asset: 'env-starfish', cost: { shell: 1 }, group: 'ground', name: 'Sao biển' },
  { asset: 'env-shells-cluster', cost: { shell: 2 }, group: 'ground', name: 'Vỏ sò' },
  // đồ trang trí
  { asset: 'island-deco-fence-h', cost: { wood: 1 }, group: 'deco', name: 'Hàng rào' },
  { asset: 'island-deco-fence-post', cost: { wood: 1 }, group: 'deco', name: 'Cột rào' },
  { asset: 'island-deco-bench-wood', cost: { wood: 3 }, group: 'deco', name: 'Ghế gỗ' },
  { asset: 'island-deco-bench-garden', cost: { wood: 3, flower: 1 }, group: 'deco', name: 'Ghế vườn' },
  { asset: 'island-deco-lamp-street', cost: { wood: 1, stone: 2 }, group: 'deco', name: 'Đèn đường' },
  { asset: 'island-deco-lamp-mushroom', cost: { seed: 1, stone: 1 }, group: 'deco', name: 'Đèn nấm' },
  { asset: 'island-deco-sign-board', cost: { wood: 1 }, group: 'deco', name: 'Bảng gỗ' },
  { asset: 'island-deco-mailbox', cost: { wood: 2 }, group: 'deco', name: 'Hộp thư' },
  { asset: 'island-deco-birdhouse', cost: { wood: 2 }, group: 'deco', name: 'Nhà chim' },
  { asset: 'island-deco-flower-pot-1', cost: { stone: 1, flower: 1 }, group: 'deco', name: 'Chậu hoa' },
  { asset: 'island-deco-flower-pot-2', cost: { stone: 1, seed: 1 }, group: 'deco', name: 'Chậu cây' },
  { asset: 'island-deco-picnic-blanket', cost: { flower: 2 }, group: 'deco', name: 'Thảm dã ngoại' },
  { asset: 'island-deco-pet-bed', cost: { wood: 2 }, group: 'deco', name: 'Ổ thú cưng' },
  { asset: 'island-deco-swing', cost: { wood: 4 }, group: 'deco', name: 'Xích đu' },
  { asset: 'island-deco-well', cost: { stone: 4, wood: 1 }, group: 'deco', name: 'Giếng nước' },
  { asset: 'island-deco-bridge-plank', cost: { wood: 3 }, group: 'deco', name: 'Cầu ván' },
  { asset: 'island-deco-statue-bunny', cost: { stone: 3, star: 5 }, group: 'deco', name: 'Tượng thỏ' },
  { asset: 'island-deco-lantern-string', cost: { wood: 2, star: 4 }, group: 'deco', name: 'Dây đèn lồng' },
  { asset: 'island-deco-fountain', cost: { stone: 5, star: 8 }, group: 'deco', name: 'Đài phun nước' },
  { asset: 'island-deco-windmill', cost: { wood: 6, star: 12 }, group: 'deco', name: 'Cối xay gió' },
  // nhà
  { asset: 'island-building-pet-house', cost: { wood: 3 }, group: 'build', name: 'Nhà thú cưng' },
  { asset: 'island-building-bunny-hutch', cost: { wood: 4 }, group: 'build', name: 'Chuồng thỏ' },
  { asset: 'island-building-cottage-1', cost: { wood: 6, stone: 2 }, group: 'build', name: 'Nhà nhỏ đỏ' },
  { asset: 'island-building-cottage-2', cost: { wood: 6, stone: 2 }, group: 'build', name: 'Nhà nhỏ xanh' },
  { asset: 'island-building-cottage-3', cost: { wood: 7, stone: 3 }, group: 'build', name: 'Nhà hai tầng' },
  { asset: 'island-building-greenhouse', cost: { wood: 4, stone: 3, seed: 2 }, group: 'build', name: 'Nhà kính' },
  { asset: 'island-building-barn', cost: { wood: 8, stone: 2 }, group: 'build', name: 'Nhà kho' },
  { asset: 'island-building-lighthouse', cost: { stone: 6, shell: 4, star: 10 }, group: 'build', name: 'Hải đăng' },
];
export const SHOP_GROUPS: [ShopItem['group'], string][] = [['plant', 'Hoa & cỏ'], ['tree', 'Cây'], ['deco', 'Đồ trang trí'], ['build', 'Nhà'], ['ground', 'Mặt đất']];
export const shopItem = (asset: string) => SHOP.find((s) => s.asset === asset);

/** Đồ có sẵn trong túi khi bắt đầu, để bé tập đặt ngay. */
export const STARTER_ITEMS: Record<string, number> = { 'island-plant-flower-pink': 2, 'island-plant-flower-yellow': 1, 'island-deco-bench-wood': 1 };
export const STARTER_RES: Partial<Record<Res, number>> = { seed: 2, wood: 1 };

// ───────── luống đất: gieo hạt → nảy mầm → lớn → nở hoa ─────────
export const PLOT_ASSETS = ['island-terrain-plot-empty', 'island-terrain-plot-sprout', 'island-terrain-plot-growing'];
export const PLOT_GROW_MS = [0, 45_000, 120_000];   // mốc thời gian (sau khi gieo) cho mầm / lớn / nở
export const PLOT_HARVEST: Partial<Record<Res, number>> = { flower: 3, seed: 1 };

// ───────── huy hiệu ─────────
export interface Achievement { id: string; name: string; desc: string; icon: string; }
export const ACHIEVEMENTS: Achievement[] = [
  { id: 'first-play', name: 'Bước đầu tiên', desc: 'Chơi xong trò chơi đầu tiên', icon: 'reward-star' },
  { id: 'plays-10', name: 'Nhà thám hiểm nhỏ', desc: 'Chơi xong 10 lượt', icon: 'world-ui-compass' },
  { id: 'plays-30', name: 'Nhà thám hiểm lớn', desc: 'Chơi xong 30 lượt', icon: 'world-ui-map-pin' },
  { id: 'all-regions', name: 'Đi khắp thế giới', desc: 'Chơi ở cả 6 vùng đất', icon: 'world-ui-unlocked-sparkle' },
  { id: 'stars-50', name: 'Bầu trời sao', desc: 'Nhận tổng cộng 50 sao', icon: 'reward-star' },
  { id: 'first-place', name: 'Kiến trúc sư', desc: 'Đặt món đồ đầu tiên lên đảo', icon: 'island-deco-bench-wood' },
  { id: 'place-15', name: 'Đảo thật xinh', desc: 'Đặt 15 món đồ lên đảo', icon: 'island-deco-fountain' },
  { id: 'harvest-1', name: 'Người làm vườn', desc: 'Thu hoạch luống hoa đầu tiên', icon: 'reward-flower' },
  { id: 'harvest-5', name: 'Bàn tay xanh', desc: 'Thu hoạch 5 lần', icon: 'reward-seed' },
  { id: 'animal-friend', name: 'Bạn của muông thú', desc: 'Chơi các trò ở Đảo Động Vật 5 lần', icon: 'world-animal-island-icon' },
  { id: 'memory-5', name: 'Trí nhớ siêu đỉnh', desc: 'Lật thẻ ở cấp 5', icon: 'world-puzzle-forest-icon' },
  { id: 'math-4', name: 'Nhà toán học', desc: 'Đếm và hái tới cấp 4', icon: 'world-math-mountain-icon' },
  { id: 'builder-3', name: 'Thợ xây tài ba', desc: 'Xây 3 công trình', icon: 'world-creative-town-icon' },
  { id: 'eco-hero', name: 'Bạn của Trái Đất', desc: 'Chơi Phân loại rác và Biển sạch', icon: 'world-adventure-ocean-icon' },
  { id: 'pattern-4', name: 'Thám tử quy luật', desc: 'Tìm quy luật tới cấp 4', icon: 'shape-star' },
  { id: 'artist-3', name: 'Hoạ sĩ nhí', desc: 'Tô xong 3 bức tranh', icon: 'reward-flower' },
  { id: 'pet-care-3', name: 'Bạn thân của thú cưng', desc: 'Chăm bạn thú 3 lần', icon: 'care-food' },
  { id: 'new-pet-friend', name: 'Đổi bạn đồng hành', desc: 'Chọn một bạn thú cưng khác', icon: 'fox-portrait' },
];

// ───────── lời thú cưng (ngắn, thân thiện) ─────────
export const PET_LINES = {
  hello: ['Chào bạn! Hôm nay mình khám phá nhé!', 'Mình nhớ bạn quá! Đi chơi thôi!', 'Ồ, bạn đến rồi! Đảo mình đang chờ đó.'],
  great: ['Giỏi quá!', 'Đúng rồi!', 'Tuyệt vời!', 'Bạn làm được rồi!', 'Hay quá đi!'],
  tryAgain: ['Thử lại nhé, không sao đâu!', 'Gần đúng rồi! Thử con khác xem.', 'Mình cùng nhìn kỹ lại nào.'],
  island: ['Mình trang trí đảo nhé!', 'Chạm vào luống đất để gieo hạt nha.', 'Đảo mình ngày càng xinh!'],
  map: ['Bạn muốn đi đâu hôm nay?', 'Chạm vào một vùng đất để xem trò chơi nhé.'],
};
export const pick = <T>(a: T[]): T => a[Math.floor(Math.random() * a.length)];
