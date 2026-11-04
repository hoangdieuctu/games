#!/usr/bin/env node
// ── Little World · generator Phase 2: hình cho mini-game (play/*) ──
// Chạy (từ gốc repo):
//   PLAYWRIGHT_CORE=<thư mục playwright-core> node little-world/art/gen-play.mjs
// Xuất public/assets/play/{animals,habitats,items,shapes,blocks,cards,rewards,sort}/*.png (@2x, scale 0.5)
// và art/manifest/play.json (dữ liệu trò chơi ở manifest.data.play).
// Tuỳ chọn: PREVIEW=<file.png> để ghi ảnh tổng hợp (contact sheet).
import { mkdirSync, rmSync, existsSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { openRasterizer } from './lib/raster.mjs';
import { manifestGroup, ASSETS } from './lib/manifest.mjs';
import { checkSvg } from './lib/island-common.mjs';
import { Doc } from './lib/style.mjs';
import { ANIMALS, ANIMAL_LIST, AW, AH } from './lib/play-animals.mjs';
import { DEFS } from './lib/play-objects.mjs';

const SCALE = 2;
const all = [
  ...ANIMAL_LIST.map(([id, name]) => ({
    id: `animal-${id}`, file: `play/animals/${id}.png`, category: 'play/animals', w: AW, h: AH, origin: [0.5, 0.5],
    usage: `Con vật: ${name}`, draw: ANIMALS[id], checkEdge: true,
  })),
  ...DEFS,
];

const outDir = join(ASSETS, 'play');
if (existsSync(outDir)) rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });
for (const a of all) mkdirSync(join(ASSETS, a.file, '..'), { recursive: true });

const R = await openRasterizer();
// Rasterize + lượng tử hoá nhẹ kênh màu (bước 4) để PNG nhỏ hơn mà không thấy khác biệt.
async function savePng(svg, out, W, H) {
  const dataUrl = await R.page.evaluate(async ({ svg, W, H }) => {
    const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
    const img = new Image();
    await new Promise((ok, bad) => { img.onload = ok; img.onerror = () => bad(new Error('SVG lỗi')); img.src = url; });
    const c = document.createElement('canvas'); c.width = W; c.height = H;
    const ctx = c.getContext('2d'); ctx.imageSmoothingQuality = 'high'; ctx.drawImage(img, 0, 0, W, H);
    URL.revokeObjectURL(url);
    const im = ctx.getImageData(0, 0, W, H), d = im.data;
    for (let i = 0; i < d.length; i += 4) {
      if (d[i + 3] === 0) { d[i] = d[i + 1] = d[i + 2] = 0; continue; }
      for (let k = 0; k < 3; k++) d[i + k] = Math.min(255, Math.round(d[i + k] / 4) * 4);
      d[i + 3] = d[i + 3] > 250 ? 255 : Math.round(d[i + 3] / 4) * 4;
    }
    ctx.putImageData(im, 0, 0);
    return c.toDataURL('image/png');
  }, { svg, W, H });
  const buf = Buffer.from(dataUrl.split(',')[1], 'base64');
  writeFileSync(out, buf);
  return { W, H, bytes: buf.length };
}
const group = manifestGroup('play');
const warn = [];
let bytes = 0;
const rendered = [];
for (const a of all) {
  const doc = new Doc(a.w, a.h, { prefix: a.id });
  const svg = doc.toString(a.draw(doc));
  if (a.checkEdge) {
    const c = await checkSvg(R.page, svg, a.w, a.h, 1);
    if (c.edge) warn.push(`${a.id}: chạm mép khung (${c.edge}px)`);
  }
  const res = await savePng(svg, join(ASSETS, a.file), a.w * SCALE, a.h * SCALE);
  bytes += res.bytes;
  rendered.push({ ...a, svg });
  group.add({
    id: a.id, file: a.file, type: 'image', category: a.category, width: res.W, height: res.H,
    scale: 1 / SCALE, origin: a.origin, usage: a.usage, tags: ['play', a.category.split('/')[1]], worldSize: [a.w, a.h],
  });
}

const sub = (p) => all.filter((a) => a.category === 'play/' + p).map((a) => a.id);
const HAB = { farm: 'Nông trại', pond: 'Ao hồ', forest: 'Khu rừng', savanna: 'Đồng cỏ' };
const ITEMS = { apple: 'quả táo', orange: 'quả cam', banana: 'quả chuối', strawberry: 'quả dâu', carrot: 'củ cà rốt', star: 'ngôi sao', flower: 'bông hoa', mushroom: 'cây nấm' };
const SHAPES = [['circle', 'Hình tròn', 160, 160], ['square', 'Hình vuông', 160, 160], ['triangle', 'Hình tam giác', 160, 160], ['rectangle', 'Hình chữ nhật', 200, 120],
  ['star', 'Ngôi sao', 160, 160], ['heart', 'Trái tim', 160, 160], ['oval', 'Hình bầu dục', 180, 130], ['diamond', 'Hình thoi', 160, 160]];
const body = (id) => (/roof/.test(id) ? 'triangle' : /dome/.test(id) ? 'semicircle' : 'rect');
group.data('play', {
  animals: ANIMAL_LIST.map(([id, name, habitat, sound]) => ({ id, asset: `animal-${id}`, name, habitat, sound })),
  habitats: Object.entries(HAB).map(([id, name]) => ({ id, asset: `habitat-${id}`, name })),
  items: Object.entries(ITEMS).map(([id, name]) => ({ id, asset: `item-${id}`, name })),
  shapes: SHAPES.map(([id, name, w, h]) => ({ id, asset: `shape-${id}`, name, w, h })),
  board: 'play-board-wood',
  blocks: all.filter((a) => a.category === 'play/blocks' && a.id !== 'block-ground')
    .map((a) => ({ id: a.id.replace('block-', ''), asset: a.id, w: a.w, h: a.h, body: body(a.id) })),
  ground: 'block-ground',
  cards: { back: 'card-back', front: 'card-front' },
  rewards: { star: 'reward-star', seed: 'reward-seed', wood: 'reward-wood', stone: 'reward-stone', flower: 'reward-flower', shell: 'reward-shell' },
  sort: {
    recycle: ['trash-bottle', 'trash-can', 'trash-paper', 'trash-box'],
    organic: ['trash-banana-peel', 'trash-apple-core', 'trash-leaf', 'trash-eggshell'],
    oceanTrash: ['trash-bottle', 'trash-can', 'trash-bag'],
    seaLife: ['sea-crab', 'sea-jellyfish', 'sea-octopus', 'animal-fish', 'animal-turtle'],
    bins: { recycle: 'bin-recycle', organic: 'bin-organic', boat: 'sort-boat' },
  },
  // chăm bạn thú: nhu cầu → đồ đúng
  care: [
    { id: 'hungry', need: 'need-hungry', tool: 'care-food', say: 'Mình đói bụng quá!', tname: 'bát thức ăn', done: 'Ngon quá! Cảm ơn bạn!' },
    { id: 'thirsty', need: 'need-thirsty', tool: 'care-water', say: 'Mình khát nước!', tname: 'bát nước', done: 'Mát quá đi!' },
    { id: 'dirty', need: 'need-dirty', tool: 'care-sponge', say: 'Ôi, mình bị lấm bùn rồi!', tname: 'bọt biển', done: 'Sạch thơm rồi!' },
    { id: 'sleepy', need: 'need-sleepy', tool: 'care-pillow', say: 'Mình buồn ngủ quá…', tname: 'cái gối', done: 'Ngủ một giấc thật ngon!' },
    { id: 'play', need: 'need-play', tool: 'care-ball', say: 'Mình muốn chơi đùa!', tname: 'quả bóng', done: 'Vui quá! Chơi nữa nhé!' },
    { id: 'messy', need: 'need-messy', tool: 'care-brush', say: 'Lông mình rối hết rồi!', tname: 'cái lược', done: 'Lông mượt rồi nè!' },
  ],
});
group.write();

// ── ảnh tổng hợp ──
if (process.env.PREVIEW) {
  const cell = 220, cols = 10;
  let x = 0, y = 0, rowH = 0, out = '';
  const W = cols * cell;
  for (const a of rendered) {
    const k = Math.min(1, (cell - 20) / Math.max(a.w, a.h)) * (a.w > 400 ? 2 : 1);
    const w = a.w * Math.min(k, (W - 20) / a.w), h = a.h * Math.min(k, (W - 20) / a.w);
    if (x + w + 20 > W) { x = 0; y += rowH; rowH = 0; }
    out += `<rect x="${x + 6}" y="${y + 6}" width="${w + 8}" height="${h + 8}" rx="8" fill="#ffffff" opacity=".5"/>`;
    out += a.svg.replace('<svg ', `<svg x="${x + 10}" y="${y + 10}" `).replace(/width="[\d.]+" height="[\d.]+"/, `width="${w}" height="${h}"`);
    x += w + 20; rowH = Math.max(rowH, h + 24);
  }
  const H = y + rowH;
  await R.save(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><rect width="100%" height="100%" fill="#fff3dc"/>${out}</svg>`, process.env.PREVIEW, { scale: 1 });
  console.log('preview → ' + process.env.PREVIEW);
}
await R.close();
console.log(`play: ${all.length} hình, ${(bytes / 1048576).toFixed(2)} MB`);
if (warn.length) { console.log('⚠ ' + warn.length + ' cảnh báo:'); for (const w of warn) console.log('  - ' + w); }
