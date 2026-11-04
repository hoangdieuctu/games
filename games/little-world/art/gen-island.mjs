// ── Little World · generator Đảo cá nhân + thư viện công trình / thiên nhiên / trang trí ──
// Chạy (từ gốc repo):
//   PLAYWRIGHT_CORE=<thư mục playwright-core> node games/little-world/art/gen-island.mjs
// Xuất:
//   public/assets/island/{buildings,trees,plants,decorations,terrain}/*.png  (@2x, hiển thị scale 0.5)
//   public/assets/island/terrain/island-base.webp, island-grid.png, island-reference.webp (1×)
//   public/assets/island/island-layout.json
//   public/assets/environment/*.png
//   art/manifest/island.json, art/manifest/environment.json
// Tuỳ chọn: PREVIEW_DIR=<thư mục> để ghi thêm ảnh xem trước (contact sheet, ảnh tham chiếu thu nhỏ).
import { writeFileSync, mkdirSync, rmSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { openRasterizer } from './lib/raster.mjs';
import { manifestGroup, ASSETS } from './lib/manifest.mjs';
import { REG, fitSprite, checkSvg, placeSvg, byId } from './lib/island-common.mjs';
import { defineTrees } from './lib/island-trees.mjs';
import { defineBuildings } from './lib/island-buildings.mjs';
import { definePlants, defineTerrain } from './lib/island-plants.mjs';
import { defineDecor } from './lib/island-decor.mjs';
import { defineEnvironment } from './lib/island-env.mjs';
import { ISLAND, baseSvg, gridSvg, walkArea, pointInPoly, OBJECTS, BUILD_ZONES, PLACEABLE } from './lib/island-base.mjs';

const t0 = Date.now();
defineBuildings();
defineTrees();
definePlants();
defineTerrain();
defineDecor();
defineEnvironment();

// dọn thư mục đầu ra (chỉ của generator này) để chạy lại sạch
for (const d of ['island/buildings', 'island/trees', 'island/plants', 'island/decorations', 'island/terrain', 'environment']) {
  const p = join(ASSETS, d);
  if (existsSync(p)) rmSync(p, { recursive: true, force: true });
  mkdirSync(p, { recursive: true });
}

const R = await openRasterizer();
const groups = { island: manifestGroup('island'), environment: manifestGroup('environment') };
const round = (v) => Math.round(v * 10000) / 10000;
const warn = [];
let bytesTotal = 0;

for (const a of REG) {
  await fitSprite(R.page, a);
  const sheetW = a.kind === 'sheet' ? a.fw * a.cols : a.w, sheetH = a.kind === 'sheet' ? a.fh * a.rows : a.h;
  if (!a.fixed) {
    if (a.kind === 'sheet') {
      // kiểm tra từng khung: nội dung không chạm mép khung
      for (let i = 0; i < a.frames; i++) {
        const fsvg = a.svg.replace(/width="[\d.]+" height="[\d.]+" viewBox="[^"]*"/, `width="${a.fw}" height="${a.fh}" viewBox="${(i % a.cols) * a.fw} ${Math.floor(i / a.cols) * a.fh} ${a.fw} ${a.fh}"`);
        const c = await checkSvg(R.page, fsvg, a.fw, a.fh, 4);
        if (c.edge) warn.push(`${a.id} khung ${i}: chạm lề (${c.edge}px)`);
      }
    } else {
      const c = await checkSvg(R.page, a.svg, sheetW, sheetH, 4);
      if (c.edge) warn.push(`${a.id}: chạm lề (${c.edge}px)`);
    }
  }
  const out = join(ASSETS, a.file);
  const res = await R.save(a.svg, out, { scale: a.scale });
  bytesTotal += res.bytes;
  if (res.bytes > 200 * 1024) warn.push(`${a.id}: ${Math.round(res.bytes / 1024)} KB > 200 KB`);
  const e = {
    id: a.id, file: a.file, type: a.kind === 'sheet' ? 'spritesheet' : 'image', category: dirname(a.file),
    width: res.W, height: res.H, scale: round(1 / a.scale),
    origin: a.kind === 'sheet' ? [round(a.ox / a.fw), round(a.oy / a.fh)] : [round(a.ox / a.w), round(a.oy / a.h)],
    usage: a.usage, tags: a.tags, layer: a.layer || (a.tags?.includes('ground') ? 'ground' : 'object'),
    worldSize: [a.w, a.h],
  };
  if (a.footprint) e.footprint = a.footprint;
  if (a.lightSource) e.lightSource = a.lightSource;
  if (a.kind === 'sheet') Object.assign(e, { frameWidth: a.fw * a.scale, frameHeight: a.fh * a.scale, frames: a.frames, animations: a.animations });
  groups[a.group].add(e);
}

// ───── nền đảo, lưới, bố cục ─────
const walk = walkArea();
const baseOut = join(ASSETS, 'island/terrain/island-base.webp');
const base = baseSvg();
const bres = await R.save(base, baseOut, { scale: 1, quality: 0.86 });
if (bres.bytes > 1.5 * 1024 * 1024) warn.push(`island-base.webp ${Math.round(bres.bytes / 1024)} KB > 1.5 MB`);
groups.island.add({
  id: 'island-terrain-base', file: 'island/terrain/island-base.webp', category: 'island/terrain', width: bres.W, height: bres.H, scale: 1, origin: [0, 0],
  usage: 'Nền Đảo cá nhân 2560×1600 (biển, bãi cát, vách đất phía trước, mặt cỏ, đường đất vẽ sẵn) – KHÔNG có vật đứng. Đặt tại (0,0), depth thấp nhất', tags: ['island', 'background'], layer: 'background',
});

// ô xây dựng trống: trong vùng đi lại, không đè vật nào
const T = ISLAND.tile;
const occupied = (c, r) => OBJECTS.some(([id, x, y]) => {
  const a = byId(id); if (!a) return false;
  const [fw, fh] = a.footprint || [1, 1];
  const x0 = x - (fw * T) / 2, x1 = x + (fw * T) / 2, y0 = y - fh * T, y1 = y;
  return c * T < x1 && (c + 1) * T > x0 && r * T < y1 && (r + 1) * T > y0;
});
const buildCells = [];
for (const [c0, r0, c1, r1] of BUILD_ZONES) for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) {
  const corners = [[c * T, r * T], [(c + 1) * T, r * T], [c * T, (r + 1) * T], [(c + 1) * T, (r + 1) * T]];
  if (corners.every((p) => pointInPoly(p, walk)) && !occupied(c, r)) buildCells.push([c, r]);
}
const gres = await R.save(gridSvg(buildCells, walk), join(ASSETS, 'island/terrain/island-grid.png'), { scale: 1 });
groups.island.add({
  id: 'island-terrain-grid', file: 'island/terrain/island-grid.png', category: 'island/terrain', width: gres.W, height: gres.H, scale: 1, origin: [0, 0],
  usage: 'Lưới tham chiếu 64 đơn vị (chấm mờ trong vùng đi lại; ô xây dựng trống tô vàng nhạt). Bật khi ở chế độ xây/trang trí', tags: ['island', 'grid', 'overlay'], layer: 'overlay',
});

for (const [id] of OBJECTS) if (!byId(id)) throw new Error('layout: thiếu asset ' + id);
for (const id of PLACEABLE) if (!byId(id)) throw new Error('placeable: thiếu asset ' + id);
const petBed = OBJECTS.find(([id]) => id === 'island-deco-pet-bed');
const layout = {
  width: ISLAND.width, height: ISLAND.height, tile: T,
  terrain: 'island-terrain-base', gridOverlay: 'island-terrain-grid',
  walkArea: walk,
  buildCells,
  objects: OBJECTS.map(([asset, x, y, flipX = false]) => ({ asset, x, y, flipX })),
  spawn: { avatar: [1284, 760], pet: [1470, 790] },
  petArea: [petBed[1], petBed[2] - 14],
  placeable: PLACEABLE,
};
writeFileSync(join(ASSETS, 'island/island-layout.json'), JSON.stringify(layout, null, 1));
groups.island.data('island', layout);
groups.island.add({
  id: 'island-layout', file: 'island/island-layout.json', type: 'json', category: 'island', width: 0, height: 0, scale: 1, origin: [0, 0],
  usage: 'Bố cục ban đầu của Đảo cá nhân (walkArea, buildCells, objects, spawn, petArea, placeable) – giống manifest.data.island', tags: ['island', 'data'],
});

// ───── ảnh tham chiếu tổng hợp ─────
const layerRank = (a) => (a.layer === 'ground' ? 0 : 1);
const sorted = OBJECTS.map(([id, x, y, flip]) => ({ a: byId(id), x, y, flip })).sort((p, q) => layerRank(p.a) - layerRank(q.a) || p.y - q.y);
const refBody = base.replace('<svg ', '<svg x="0" y="0" ') + sorted.map(({ a, x, y, flip }) => placeSvg(a, x, y, flip)).join('');
const refSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${ISLAND.width}" height="${ISLAND.height}" viewBox="0 0 ${ISLAND.width} ${ISLAND.height}">${refBody}</svg>`;
const rres = await R.save(refSvg, join(ASSETS, 'island/terrain/island-reference.webp'), { scale: 1, quality: 0.86 });
groups.island.add({
  id: 'island-terrain-reference', file: 'island/terrain/island-reference.webp', category: 'island/terrain', width: rres.W, height: rres.H, scale: 1, origin: [0, 0],
  usage: 'Ảnh tham chiếu (chỉ để duyệt): nền + toàn bộ vật trong bố cục ban đầu, sắp chiều sâu theo y. Không dùng trong game', tags: ['island', 'reference'], layer: 'reference',
});

if (process.env.PREVIEW_DIR) {
  const P = process.env.PREVIEW_DIR;
  mkdirSync(P, { recursive: true });
  await R.save(refSvg, join(P, 'island-reference-half.png'), { scale: 0.5 });
  const gsvg = gridSvg(buildCells, walk);
  await R.save(refSvg.replace('</svg>', gsvg.replace('<svg ', '<svg x="0" y="0" ') + '</svg>'), join(P, 'island-reference-grid-half.png'), { scale: 0.5 });
}

groups.island.write();
groups.environment.write();
await R.close();
for (const w of warn) console.warn('CẢNH BÁO', w);
console.log(`Đảo: ${REG.length} sprite + nền/lưới/tham chiếu · sprite ${Math.round(bytesTotal / 1024)} KB · nền ${Math.round(bres.bytes / 1024)} KB · ${buildCells.length} ô xây · ${((Date.now() - t0) / 1000).toFixed(1)}s`);
