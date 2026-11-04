#!/usr/bin/env node
// Gộp art/manifest/*.json → public/assets/asset-manifest.json + docs/ASSET_INVENTORY.md
// và KIỂM TRA: file tồn tại, kích thước thật khớp manifest, spritesheet chia đều khung,
// trùng id, layout tham chiếu tới id không có.
import { readFileSync, writeFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { ART_DIR, GAME_DIR, ASSETS } from './lib/manifest.mjs';

function imageSize(path) {
  const b = readFileSync(path);
  if (b.slice(1, 4).toString() === 'PNG') return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) };
  if (b.slice(0, 4).toString() === 'RIFF' && b.slice(8, 12).toString() === 'WEBP') {
    const fmt = b.slice(12, 16).toString();
    if (fmt === 'VP8X') return { w: 1 + b.readUIntLE(24, 3), h: 1 + b.readUIntLE(27, 3) };
    if (fmt === 'VP8L') { const v = b.readUInt32LE(21); return { w: (v & 0x3fff) + 1, h: ((v >> 14) & 0x3fff) + 1 }; }
    if (fmt === 'VP8 ') return { w: b.readUInt16LE(26) & 0x3fff, h: b.readUInt16LE(28) & 0x3fff };
  }
  return null;
}

const groups = readdirSync(join(ART_DIR, 'manifest')).filter((f) => f.endsWith('.json')).sort();
const entries = [], data = {}, problems = [];
for (const f of groups) {
  const g = JSON.parse(readFileSync(join(ART_DIR, 'manifest', f), 'utf8'));
  for (const e of g.entries) {
    if (entries.some((x) => x.id === e.id)) problems.push(`trùng id: ${e.id}`);
    entries.push({ group: g.group, ...e });
  }
  Object.assign(data, g.data || {});
}

let bytes = 0;
for (const e of entries) {
  const p = join(ASSETS, e.file);
  if (!existsSync(p)) { problems.push(`thiếu file: ${e.file} (${e.id})`); continue; }
  e.bytes = statSync(p).size; bytes += e.bytes;
  if (e.format === 'png' || e.format === 'webp') {
    const s = imageSize(p);
    if (!s) { problems.push(`không đọc được kích thước: ${e.file}`); continue; }
    if (s.w !== e.width || s.h !== e.height) problems.push(`kích thước lệch ${e.id}: manifest ${e.width}×${e.height}, file ${s.w}×${s.h}`);
    if (e.type === 'spritesheet') {
      const cols = Math.floor(s.w / e.frameWidth), rows = Math.floor(s.h / e.frameHeight);
      if (e.frames && e.frames > cols * rows) problems.push(`${e.id}: ${e.frames} khung nhưng sheet chỉ chứa ${cols * rows}`);
      for (const a of e.animations || []) for (const fr of a.frames) if (fr >= cols * rows) problems.push(`${e.id}/${a.key}: khung ${fr} vượt sheet`);
    }
  }
}

// tham chiếu trong dữ liệu
const ids = new Set(entries.map((e) => e.id));
const refCheck = (where, id) => { if (id && !ids.has(id)) problems.push(`${where} tham chiếu id không có: ${id}`); };
if (data.world) {
  refCheck('world.background', data.world.background);
  refCheck('world.homeIsland', data.world.homeIsland?.asset);
  for (const r of data.world.regions || []) {
    ['icon', 'entrance', 'background'].forEach((k) => refCheck(`world.${r.id}.${k}`, r[k]));
    refCheck(`world.${r.id}.lockedOverlay`, r.lockedOverlay?.asset);
    for (const l of r.landmarks || []) refCheck(`world.${r.id}.landmark`, l.asset);
  }
  for (const d of data.world.decorations || []) refCheck('world.decoration', d.asset);
}
if (data.island) {
  refCheck('island.terrain', data.island.terrain);
  refCheck('island.gridOverlay', data.island.gridOverlay);
  for (const o of data.island.objects || []) refCheck('island.object', o.asset);
  for (const id of data.island.placeable || []) refCheck('island.placeable', id);
}
if (data.avatar) {
  for (const L of data.avatar.layers || []) for (const v of L.variants) refCheck(`avatar.${L.slot}`, v.id);
  refCheck('avatar.composite', data.avatar.composite);
}
for (const [k, p] of Object.entries(data.pets || {})) refCheck(`pets.${k}`, p.sheet);

const strip = ({ group, bytes, ...e }) => e;
writeFileSync(join(ASSETS, 'asset-manifest.json'), JSON.stringify({ version: 1, base: 'public/assets/', entries: entries.map(strip), data }));

// ── ASSET_INVENTORY.md ──
const kb = (n) => n > 1024 * 1024 ? (n / 1048576).toFixed(2) + ' MB' : Math.round(n / 1024) + ' KB';
const byCat = {};
for (const e of entries) (byCat[e.category] ||= []).push(e);
let md = `# Little World — Danh mục tài sản (Asset Inventory)\n\n`
  + `> Tệp này được sinh tự động bởi \`art/build-manifest.mjs\` từ manifest — đừng sửa tay.\n\n`
  + `- Tổng số tài sản: **${entries.length}**, dung lượng **${kb(bytes)}**\n`
  + `- Manifest cho Phaser: \`public/assets/asset-manifest.json\` (nạp bởi \`src/services/AssetLoader.ts\`)\n`
  + `- Kích thước là kích thước texture thật (px). \`scale\` là tỉ lệ hiển thị mặc định (texture @2x → 0.5).\n`
  + `- Kiểm tra tự động: ${problems.length ? `**${problems.length} vấn đề**, xem cuối tệp` : 'không có vấn đề (file tồn tại, kích thước khớp, khung spritesheet hợp lệ, tham chiếu đầy đủ)'}\n\n`;
for (const cat of Object.keys(byCat).sort()) {
  const list = byCat[cat];
  md += `## ${cat} (${list.length})\n\n| ID | Tệp | Kích thước | Định dạng | Scale · Origin | Công dụng |\n|---|---|---|---|---|---|\n`;
  for (const e of list) {
    const anim = e.type === 'spritesheet' ? `<br>khung ${e.frameWidth}×${e.frameHeight} · ${e.frames ?? '?'} khung${(e.animations || []).length ? `<br>anim: ${e.animations.map((a) => `\`${a.key}\` (${a.frames.length}f @${a.frameRate}fps${a.repeat === -1 ? ', lặp' : ''})`).join(', ')}` : ''}` : '';
    md += `| \`${e.id}\` | ${e.file} | ${e.width}×${e.height} · ${kb(e.bytes || 0)} | ${e.format}${e.type === 'spritesheet' ? ' sheet' : ''} | ${e.scale} · [${(e.origin || []).join(', ')}] | ${(e.usage || '').replace(/\|/g, '/')}${e.footprint ? ` (đế ${e.footprint.join('×')} ô)` : ''}${anim} |\n`;
  }
  md += '\n';
}
if (problems.length) md += `## Vấn đề phát hiện\n\n${problems.map((p) => `- ${p}`).join('\n')}\n`;
writeFileSync(join(GAME_DIR, 'docs', 'ASSET_INVENTORY.md'), md);

console.log(`asset-manifest.json: ${entries.length} mục, ${kb(bytes)} — ${groups.length} nhóm`);
if (problems.length) { console.log(`⚠ ${problems.length} vấn đề:`); for (const p of problems.slice(0, 60)) console.log('  - ' + p); process.exitCode = 1; }
