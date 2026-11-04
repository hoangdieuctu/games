// ── Little World: generator BẢN ĐỒ THẾ GIỚI + 6 VÙNG ──
// Chạy:  PLAYWRIGHT_CORE=<...>/playwright-core node games/little-world/art/gen-world.mjs
// Xuất:  public/assets/world-map/*, public/assets/regions/<id>/*, public/assets/ui/{lock-badge,unlocked-sparkle,map-pin,compass}.png
//        art/manifest/world.json (data.world) + public/assets/world-map/world-map.json
// Tất định (deterministic): mọi ngẫu nhiên đều có seed.
import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { Doc, PAL } from './lib/style.mjs';
import { openRasterizer } from './lib/raster.mjs';
import { manifestGroup, ASSETS } from './lib/manifest.mjs';
import { painter } from './lib/world-kit.mjs';
import { W, H, HOME, REGIONS, LANDMARKS } from './lib/world-layout.mjs';
import { renderBase } from './lib/world-map.mjs';
import * as LA from './lib/world-landmarks-a.mjs';
import * as LB from './lib/world-landmarks-b.mjs';
import * as UI from './lib/world-ui.mjs';
import { renderScene } from './lib/world-scenes.mjs';

const ONLY = process.env.ONLY ? process.env.ONLY.split(',') : null; // ONLY=base,landmarks,ui,bg (để lặp nhanh)
const want = (k) => !ONLY || ONLY.includes(k);

const R = await openRasterizer();
const M = manifestGroup('world');
const t0 = Date.now();
const out = (rel) => join(ASSETS, rel);
const kb = (n) => (n / 1024).toFixed(0) + ' KB';

/** Đo hộp bao (bbox) của thân SVG trong Chromium. */
async function measure(body) {
  return R.page.evaluate((body) => {
    const ns = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('width', '10'); svg.setAttribute('height', '10');
    svg.innerHTML = `<g>${body}</g>`;
    document.body.appendChild(svg);
    const b = svg.firstChild.getBBox();
    svg.remove();
    return { x: b.x, y: b.y, w: b.width, h: b.height };
  }, body);
}

/**
 * Vẽ sprite từ hàm draw(P) (toạ độ cục bộ, gốc (0,0) = điểm neo), tự cắt theo bbox + lề.
 * Trả về {w,h,origin} theo đơn vị thế giới và lưu PNG ở scale.
 */
async function sprite(rel, draw, { scale = 2, pad = 8, fixed } = {}) {
  const doc = new Doc(10, 10, { prefix: rel.replace(/[^a-z0-9]/gi, '').slice(-24) });
  const P = painter(doc);
  const body = draw(P);
  let box;
  if (fixed) box = fixed; // [x, y, w, h]
  else { const b = await measure(body); box = [Math.floor(b.x - pad), Math.floor(b.y - pad), Math.ceil(b.w + pad * 2), Math.ceil(b.h + pad * 2)]; }
  const [x, y, w, h] = box;
  doc.w = w; doc.h = h; doc.viewBox = `${x} ${y} ${w} ${h}`;
  const r = await R.save(doc.toString(body), out(rel), { scale });
  return { w, h, W: r.W, H: r.H, bytes: r.bytes, origin: [+(-x / w).toFixed(4), +(-y / h).toFixed(4)] };
}

/** Spritesheet: frames = n hàm draw(P,i), khung cố định [x,y,w,h] cục bộ, xếp 1 hàng. */
async function sheet(rel, n, draw, box, scale = 2) {
  const [bx, by, fw, fh] = box;
  const doc = new Doc(fw * n, fh, { prefix: rel.replace(/[^a-z0-9]/gi, '').slice(-24) });
  const P = painter(doc);
  let body = '';
  for (let i = 0; i < n; i++) body += `<g transform="translate(${i * fw - bx},${-by})">${draw(P, i)}</g>`;
  const r = await R.save(doc.toString(body), out(rel), { scale });
  return { fw: fw * scale, fh: fh * scale, W: r.W, H: r.H, origin: [+(-bx / fw).toFixed(4), +(-by / fh).toFixed(4)] };
}

const UNLOCKED = new Set(['animal-island', 'life-skills-village', 'math-mountain']);
const FN = {
  'animal-island': { waterfall: LA.waterfall, 'big-tree': LA.bigTree, 'animal-houses': LA.animalHouses, barn: LA.barn },
  'puzzle-forest': { 'magic-tree': LA.magicTree, mushrooms: LA.mushroomCluster, 'jigsaw-arch': LA.jigsawArch, maze: LA.maze, 'rune-stones': LA.runeStones },
  'math-mountain': { peak: LA.mathPeak, 'floating-blocks': LA.floatingBlocks, 'dice-tower': LA.diceTower, 'fruit-garden': LA.fruitGarden },
  'creative-town': { 'art-studio': LB.artStudio, houses: LB.townHouses, crane: LB.crane, workshop: LB.workshop },
  'life-skills-village': { school: LB.school, grocery: LB.grocery, kitchen: LB.kitchen, playground: LB.playground, garden: LB.communityGarden },
  'adventure-ocean': { 'submarine-dock': LB.submarineDock, 'coral-reef': LB.coralReef, 'sea-cave': LB.seaCave, 'palm-hut': LB.palmHut },
};
const LABEL_VI = {
  waterfall: 'Thác nước trên vách đá', 'big-tree': 'Cây cổ thụ có nhà trên cây', 'animal-houses': 'Cụm nhà thú (hang thỏ, nhà gấu, chuồng chim)', barn: 'Chuồng trại & tháp silo',
  'magic-tree': 'Cây phép thuật phát sáng', mushrooms: 'Cụm nấm khổng lồ', 'jigsaw-arch': 'Cổng vòm đá ghép hình', maze: 'Mê cung hàng rào', 'rune-stones': 'Vòng đá ký hiệu phát sáng',
  peak: 'Đỉnh Núi Toán (bậc khối màu, bàn tính, cờ đỉnh)', 'floating-blocks': 'Đảo khối hình học bay', 'dice-tower': 'Tháp xúc xắc', 'fruit-garden': 'Vườn trái cây',
  'art-studio': 'Xưởng vẽ mái bảng màu', houses: 'Dãy nhà nhiều màu', crane: 'Công trường: cần cẩu & giàn giáo', workshop: 'Xưởng mộc bánh răng',
  school: 'Trường học có tháp chuông', grocery: 'Cửa hàng tạp hoá', kitchen: 'Nhà bếp cộng đồng', playground: 'Sân chơi', garden: 'Vườn rau cộng đồng',
  'submarine-dock': 'Bến tàu ngầm', 'coral-reef': 'Rạn san hô', 'sea-cave': 'Hang biển trên đảo đá', 'palm-hut': 'Chòi sàn trên đảo dừa',
};

const world = { width: W, height: H, background: 'world-map-base', homeIsland: { x: HOME.x, y: HOME.y, asset: 'world-map-home-island' }, regions: [], decorations: [] };

// ═══════════ 1. Nền bản đồ ═══════════
if (want('base')) {
  const { doc, out: parts } = renderBase();
  const svg = doc.toString(parts.join(''));
  const r = await R.save(svg, out('world-map/world-map-base.webp'), { scale: 1, quality: 0.93 });
  console.log('world-map-base.webp', r.W + '×' + r.H, kb(r.bytes), `svg ${(svg.length / 1e6).toFixed(1)}MB`);
}
M.add({ id: 'world-map-base', file: 'world-map/world-map-base.webp', width: W, height: H, format: 'webp', scale: 1, origin: [0, 0], category: 'world-map', usage: 'Ảnh nền bản đồ thế giới (địa hình + chi tiết nhỏ nướng sẵn). Đặt tại (0,0), depth thấp nhất.', tags: ['background', 'world-map'] });

// ═══════════ 2. Đảo Nhà ═══════════
{
  const rel = 'world-map/home-island.png';
  const s = want('landmarks') ? await sprite(rel, LB.homeIsland) : null;
  M.add({ id: 'world-map-home-island', file: rel, width: s?.W, height: s?.H, scale: 0.5, origin: s?.origin, category: 'world-map', usage: 'Đảo Nhà của bé giữa Vịnh Trung Tâm; đặt tại homeIsland.x,y (tâm đảo).', tags: ['landmark', 'home'] });
}

// ═══════════ 3. Vùng: mốc, icon, cổng, sương khoá, nền ═══════════
for (const reg of REGIONS) {
  const id = reg.id, dir = `regions/${id}`;
  const entry = { id, name: reg.name, nameEn: reg.nameEn, color: reg.color, polygon: reg.polygon, center: reg.center, label: reg.label };
  // icon
  {
    const rel = `${dir}/icon.png`;
    const s = want('ui') ? await sprite(rel, (P) => UI.regionIcon(P, id, reg.color), { fixed: [-68, -68, 136, 136] }) : null;
    M.add({ id: `world-${id}-icon`, file: rel, width: s?.W ?? 272, height: s?.H ?? 272, scale: 0.5, origin: [0.5, 0.5], category: dir, usage: `Huy hiệu tròn của vùng ${reg.name} (~128 đơn vị)`, tags: ['icon', 'region'] });
    entry.icon = `world-${id}-icon`;
  }
  // cổng
  {
    const rel = `${dir}/entrance.png`;
    const s = want('ui') ? await sprite(rel, UI.ENTRANCES[id]) : null;
    M.add({ id: `world-${id}-entrance`, file: rel, width: s?.W, height: s?.H, scale: 0.5, origin: s?.origin, category: dir, usage: `Cổng vào vùng ${reg.name}; có biển trống để Phaser vẽ tên. Dùng trong cảnh vùng (scale 0.5 ≈ 260 đơn vị) hoặc trên bản đồ (scale ~0.2).`, tags: ['entrance', 'region'] });
    entry.entrance = `world-${id}-entrance`; entry.entrancePos = reg.entrancePos;
  }
  // nền vùng
  {
    const rel = `${dir}/background.webp`;
    if (want('bg')) {
      const { doc, body } = renderScene(id);
      const r = await R.save(doc.toString(body), out(rel), { scale: 1, quality: 0.84 });
      console.log(rel, kb(r.bytes));
    }
    M.add({ id: `world-${id}-background`, file: rel, width: 1920, height: 1080, format: 'webp', scale: 1, origin: [0, 0], category: dir, usage: `Ảnh nền cảnh bên trong vùng ${reg.name} (trời/xa/giữa/gần); vùng giữa-dưới để trống cho UI/mini-game.`, tags: ['background', 'region'] });
    entry.background = `world-${id}-background`;
  }
  // sương khoá vùng (toạ độ bản đồ; scale 1)
  {
    const rel = `${dir}/locked-overlay.webp`;
    let box;
    const fog = (P) => { const f = UI.fogOverlay(P, reg.polygon, reg.color, id.length * 7); box = f.bbox; return f.body; };
    { const d = new Doc(1, 1); fog(painter(d)); }
    const [x0, y0, x1, y1] = box;
    const fx = Math.floor(x0), fy = Math.floor(y0), fw = Math.ceil(x1 - x0), fh = Math.ceil(y1 - y0);
    if (want('ui')) { const s = await sprite(rel, fog, { scale: 1, fixed: [fx, fy, fw, fh] }); console.log(rel, kb(s.bytes)); }
    M.add({ id: `world-${id}-locked`, file: rel, width: fw, height: fh, scale: 1, origin: [0.5, 0.5], category: dir, usage: `Mây phép phủ vùng ${reg.name} khi còn khoá (toạ độ bản đồ, scale 1).`, tags: ['overlay', 'locked'] });
    entry.lockedOverlay = { asset: `world-${id}-locked`, x: Math.round(fx + fw / 2), y: Math.round(fy + fh / 2) };
  }
  entry.unlocked = UNLOCKED.has(id);
  // mốc
  entry.landmarks = [];
  for (const l of LANDMARKS[id]) {
    const rel = `${dir}/${l.key}.png`;
    const s = want('landmarks') ? await sprite(rel, FN[id][l.key]) : null;
    const aid = `world-${id}-${l.key}`;
    M.add({ id: aid, file: rel, width: s?.W, height: s?.H, scale: 0.5, origin: s?.origin, category: dir, usage: `${LABEL_VI[l.key]} — mốc vùng ${reg.name} trên bản đồ (setDepth theo y đế).`, tags: ['landmark', 'region', id] });
    entry.landmarks.push({ asset: aid, x: l.x, y: l.y });
  }
  world.regions.push(entry);
}

// ═══════════ 4. UI bản đồ ═══════════
const uiItems = [
  ['ui/lock-badge.png', 'world-ui-lock-badge', UI.lockBadge, 'Huy hiệu ổ khoá đặt ở nhãn vùng đang khoá'],
  ['ui/unlocked-sparkle.png', 'world-ui-unlocked-sparkle', UI.unlockedSparkle, 'Lấp lánh khi vùng vừa mở khoá (tween scale/alpha)'],
  ['ui/map-pin.png', 'world-ui-map-pin', UI.mapPin, 'Ghim đánh dấu vị trí trên bản đồ (neo ở mũi ghim)'],
  ['ui/compass.png', 'world-ui-compass', UI.compass, 'La bàn trang trí góc bản đồ (tam giác đỏ = hướng Bắc)'],
];
for (const [rel, aid, fn, usage] of uiItems) {
  const s = want('ui') ? await sprite(rel, fn) : null;
  M.add({ id: aid, file: rel, width: s?.W, height: s?.H, scale: 0.5, origin: s?.origin ?? [0.5, 0.5], category: 'ui', usage, tags: ['ui', 'world-map'] });
}

// ═══════════ 5. Trang trí bản đồ ═══════════
const deco = [];
async function decoSprite(rel, aid, fn, usage, tags = []) {
  const s = want('ui') ? await sprite(rel, fn) : null;
  M.add({ id: aid, file: rel, width: s?.W, height: s?.H, scale: 0.5, origin: s?.origin ?? [0.5, 0.5], category: 'world-map', usage, tags: ['decoration', 'world-map', ...tags] });
}
for (let i = 0; i < 3; i++) await decoSprite(`world-map/cloud-${i + 1}.png`, `world-map-cloud-${i + 1}`, (P) => UI.cloudSprite(P, i), 'Mây trôi ngang bản đồ (drift: tween x chậm, lặp lại)', ['cloud']);
await decoSprite('world-map/boat.png', 'world-map-boat', UI.sailBoat, 'Thuyền buồm nhỏ trên biển (lắc nhẹ, trôi theo tuyến)', ['boat']);
await decoSprite('world-map/footprints.png', 'world-map-footprints', UI.footprints, 'Dấu chân trên đường đi (decal)', ['path']);
await decoSprite('world-map/path-dash.png', 'world-map-path-dash', UI.pathDash, 'Vạch đường đi (vẽ tuyến động/đường mới mở)', ['path']);
await decoSprite('world-map/bridge-wood.png', 'world-map-bridge-wood', UI.bridgeWood, 'Mảnh cầu gỗ ngang (dùng thêm cầu mới)', ['bridge']);
await decoSprite('world-map/bridge-stone.png', 'world-map-bridge-stone', UI.bridgeStone, 'Mảnh cầu đá vòm ngang', ['bridge']);
{
  const rel = 'world-map/cloud-transition.png';
  const s = want('ui') ? await sprite(rel, (P) => UI.cloudTransition(P), { scale: 1 }) : null;
  M.add({ id: 'world-map-cloud-transition', file: rel, width: s?.W, height: s?.H, scale: 1, origin: [0.5, 0.5], category: 'world-map', usage: 'Khối mây lớn dùng chuyển cảnh (phóng to che màn hình rồi tan)', tags: ['transition'] });
}
// spritesheets
{
  const s = want('ui') ? await sheet('world-map/seagull.png', 4, UI.gull, [-34, -30, 68, 44]) : { fw: 136, fh: 88, origin: [0.5, 0.68] };
  M.add({ id: 'world-map-seagull', file: 'world-map/seagull.png', type: 'spritesheet', width: s.fw * 4, height: s.fh, frameWidth: s.fw, frameHeight: s.fh, frames: 4, scale: 0.5, origin: s.origin, category: 'world-map', usage: 'Mòng biển vỗ cánh (bay ngang bản đồ)', tags: ['decoration', 'animated'], animations: [{ key: 'seagull-flap', frames: [0, 1, 2, 3], frameRate: 8, repeat: -1 }] });
}
{
  const s = want('ui') ? await sheet('world-map/whale.png', 6, UI.whale, [-104, -150, 208, 166]) : { fw: 416, fh: 332, origin: [0.5, 0.9] };
  M.add({ id: 'world-map-whale', file: 'world-map/whale.png', type: 'spritesheet', width: s.fw * 6, height: s.fh, frameWidth: s.fw, frameHeight: s.fh, frames: 6, scale: 0.5, origin: s.origin, category: 'world-map', usage: 'Cá voi trồi lên phun nước (chạy 1 lượt, nghỉ vài giây rồi lặp)', tags: ['decoration', 'animated'], animations: [{ key: 'whale-spout', frames: [0, 1, 2, 3, 4, 3, 4, 2, 1, 5], frameRate: 6, repeat: 0 }] });
}
{
  const s = want('ui') ? await sheet('world-map/wave-sparkle.png', 4, UI.waveSparkle, [-24, -24, 48, 48]) : { fw: 96, fh: 96, origin: [0.5, 0.5] };
  M.add({ id: 'world-map-wave-sparkle', file: 'world-map/wave-sparkle.png', type: 'spritesheet', width: s.fw * 4, height: s.fh, frameWidth: s.fw, frameHeight: s.fh, frames: 4, scale: 0.5, origin: s.origin, category: 'world-map', usage: 'Lấp lánh mặt nước', tags: ['decoration', 'animated'], animations: [{ key: 'wave-sparkle', frames: [0, 1, 2, 3, 0], frameRate: 7, repeat: -1, repeatDelay: 900 }] });
}
{
  const s = want('ui') ? await sheet('world-map/fish-jump.png', 5, UI.fishJump, [-56, -62, 112, 76]) : { fw: 224, fh: 152, origin: [0.5, 0.82] };
  M.add({ id: 'world-map-fish-jump', file: 'world-map/fish-jump.png', type: 'spritesheet', width: s.fw * 5, height: s.fh, frameWidth: s.fw, frameHeight: s.fh, frames: 5, scale: 0.5, origin: s.origin, category: 'world-map', usage: 'Cá nhảy khỏi mặt nước', tags: ['decoration', 'animated'], animations: [{ key: 'fish-jump', frames: [0, 1, 2, 3, 4], frameRate: 8, repeat: 0 }] });
}
world.decorations.push(
  { asset: 'world-map-cloud-1', x: 900, y: 1150, drift: true },
  { asset: 'world-map-cloud-2', x: 2600, y: 1020, drift: true },
  { asset: 'world-map-cloud-3', x: 2500, y: 1990, drift: true },
  { asset: 'world-map-cloud-2', x: 230, y: 2050, drift: true },
  { asset: 'world-map-boat', x: 2300, y: 1160 },
  { asset: 'world-map-boat', x: 3420, y: 1980 },
  { asset: 'world-map-seagull', x: 3000, y: 1250, anim: 'seagull-flap', drift: true },
  { asset: 'world-map-seagull', x: 1500, y: 1180, anim: 'seagull-flap', drift: true },
  { asset: 'world-map-seagull', x: 700, y: 1080, anim: 'seagull-flap', drift: true },
  { asset: 'world-map-whale', x: 3600, y: 1450, anim: 'whale-spout' },
  { asset: 'world-map-fish-jump', x: 3350, y: 1800, anim: 'fish-jump' },
  { asset: 'world-map-fish-jump', x: 2150, y: 1250, anim: 'fish-jump' },
  { asset: 'world-map-wave-sparkle', x: 3150, y: 1700, anim: 'wave-sparkle' },
  { asset: 'world-map-wave-sparkle', x: 1700, y: 1240, anim: 'wave-sparkle' },
  { asset: 'world-map-wave-sparkle', x: 3700, y: 700, anim: 'wave-sparkle' },
  { asset: 'world-map-wave-sparkle', x: 80, y: 700, anim: 'wave-sparkle' },
  { asset: 'world-map-wave-sparkle', x: 2700, y: 2100, anim: 'wave-sparkle' },
  { asset: 'world-ui-compass', x: 3690, y: 190 },
);

// ═══════════ 6. Dữ liệu bản đồ ═══════════
// Chỉ ghi manifest khi chạy đầy đủ (chạy ONLY=… thiếu kích thước của phần bị bỏ qua).
if (!ONLY) {
  M.data('world', world);
  M.write();
  writeFileSync(out('world-map/world-map.json'), JSON.stringify(world, null, 1));
}
await R.close();
console.log(`xong: ${R.count} ảnh, ${((Date.now() - t0) / 1000).toFixed(1)}s`);
