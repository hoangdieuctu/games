#!/usr/bin/env node
// ── Little World: sinh toàn bộ tài sản NHÂN VẬT ──
//   PLAYWRIGHT_CORE=/path/to/playwright-core node games/little-world/art/gen-characters.mjs
// Xuất vào public/assets/characters/{avatar,fox,bunny,bear}/ và ghi art/manifest/characters.json.
// Tất định: chạy lại cho cùng kết quả.
import { join } from 'node:path';
import { mkdirSync } from 'node:fs';
import { Doc, PAL, r2 } from './lib/style.mjs';
import { openRasterizer } from './lib/raster.mjs';
import { manifestGroup, ASSETS } from './lib/manifest.mjs';
import { saveSmallPNG } from './lib/characters-png.mjs';
import { HAIR_NAMES, TOPS, BOTTOMS, SHOES, ACCESSORIES, AV } from './lib/characters-avatar.mjs';
import { avatarFrames, slotFrameSVG, compositeFrameSVG, SLOTS } from './lib/characters-avatar-anims.mjs';
import { SPECIES, PET, petFrames, petFrameSVG } from './lib/characters-pets.mjs';

const OUT = join(ASSETS, 'characters');
const man = manifestGroup('characters');
const R = await openRasterizer();
const SCALE = 2;
const ORIGIN = [0.5, 0.92];

// ───────────── bảng màu tô ─────────────
const PALETTES = {
  skin: PAL.skin,
  hair: PAL.hair,
  cloth: ['#ffd96b', '#ff8f8f', '#ffac6b', '#9fd67c', '#7cc3ee', '#7b8fd1', '#c7b5f0', '#ffb8cb'],
  shoes: ['#ff8f8f', '#7cc3ee', '#fffaf2', '#9b85d9', '#cf9161'],
};
const DEFAULT_LOOK = {
  variants: { hairBack: null, body: 'base', face: 'default', bottom: 'shorts', top: 'tshirt', shoes: 'sneakers', hairFront: 'short', accessory: null },
  colors: { body: PAL.skin[1], hairBack: PAL.hair[1], hairFront: PAL.hair[1], top: '#ffd96b', bottom: '#7b8fd1', shoes: '#ff8f8f' },
};

// ───────────── tiện ích sheet ─────────────
let docN = 0;
function sheet(frames, fw, fh, cols, renderFn) {
  const rows = Math.ceil(frames.length / cols);
  const doc = new Doc(cols * fw, rows * fh, { prefix: 'c' + (++docN) });
  const cell = doc.id('cell');
  doc.add(`<clipPath id="${cell}" clipPathUnits="userSpaceOnUse"><rect x="0" y="0" width="${fw}" height="${fh}"/></clipPath>`);
  let body = '';
  frames.forEach((fr, i) => {
    const inner = renderFn(doc, fr, i);
    if (inner) body += `<g transform="translate(${(i % cols) * fw} ${Math.floor(i / cols) * fh})"><g clip-path="url(#${cell})">${inner}</g></g>`;
  });
  return { svg: doc.toString(body), cols, rows };
}
async function save(svg, rel, scale = SCALE) {
  const file = join(OUT, rel);
  let info;
  try { info = await saveSmallPNG(R.page, svg, file, { scale }); } catch (e) { if (process.env.LW_DEBUG_SVG) (await import("node:fs")).writeFileSync(process.env.LW_DEBUG_SVG, svg); throw e; }
  console.log(`  ${rel}  ${info.W}×${info.H}  ${(info.bytes / 1024).toFixed(0)} KB ${info.kind}`);
  return info;
}
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const text = (x, y, s, size = 14, color = PAL.ink, anchor = 'middle', weight = 800) =>
  `<text x="${x}" y="${y}" font-family="Nunito, 'Baloo 2', 'Segoe UI', sans-serif" font-size="${size}" font-weight="${weight}" fill="${color}" text-anchor="${anchor}">${esc(s)}</text>`;

// ═════════════════════════ A. BÉ ═════════════════════════
console.log('Bé (avatar):');
mkdirSync(join(OUT, 'avatar', 'layers'), { recursive: true });
const { frames: AF, anims: AA } = avatarFrames();
const ACOLS = 10;
const FW = AV.W, FH = AV.H;

const LAYER_DEFS = {
  hairBack: { tint: true, opts: [['ponytail', HAIR_NAMES.ponytail], ['bob', HAIR_NAMES.bob], ['puffs', HAIR_NAMES.puffs], ['long', HAIR_NAMES.long]], none: true },
  body: { tint: true, opts: [['base', 'Dáng bé']] },
  face: { tint: false, opts: [['default', 'Mắt tròn lấp lánh'], ['freckles', 'Tàn nhang đáng yêu']] },
  bottom: { tint: true, opts: Object.entries(BOTTOMS).map(([k, v]) => [k, v.name]) },
  top: { tint: true, opts: Object.entries(TOPS).map(([k, v]) => [k, v.name]) },
  shoes: { tint: true, opts: Object.entries(SHOES).map(([k, v]) => [k, v.name]) },
  hairFront: { tint: true, opts: [['short', HAIR_NAMES.short], ['bob', HAIR_NAMES.bob], ['ponytail', HAIR_NAMES.ponytail], ['puffs', HAIR_NAMES.puffs], ['long', HAIR_NAMES.long]] },
  accessory: { tint: false, opts: Object.entries(ACCESSORIES).map(([k, v]) => [k, v.name]), none: true, noneFirst: true },
};
const SLOT_FILE = { hairBack: 'hairback', body: 'body', face: 'face', bottom: 'bottom', top: 'top', shoes: 'shoes', hairFront: 'hairfront', accessory: 'acc' };
const SLOT_USAGE = {
  hairBack: 'Tóc phía sau đầu/thân (tô màu tóc)', body: 'Da: đầu, tai, cổ, tay, chân + bóng đất (tô màu da)', face: 'Mắt, mày, miệng, má hồng (đủ màu, không tô)',
  bottom: 'Quần/váy (tô màu quần)', top: 'Áo (tô màu áo)', shoes: 'Giày (tô màu giày)', hairFront: 'Tóc mái/đỉnh đầu, che gáy khi quay lưng (tô màu tóc)', accessory: 'Phụ kiện (đủ màu, không tô)',
};
const aid = (slot, v) => (slot === 'body' ? 'avatar-body' : `avatar-${SLOT_FILE[slot]}-${v}`);
const layersData = [];
const animList = (prefix, anims) => Object.entries(anims).map(([k, a]) => ({ key: `${prefix}-${k}`, frames: Array.from({ length: a.count }, (_, i) => a.start + i), frameRate: a.frameRate, repeat: a.repeat }));

for (const slot of SLOTS) {
  const L = LAYER_DEFS[slot];
  const variants = [];
  if (L.none && L.noneFirst) variants.push({ id: null, name: 'Không' });
  for (const [v, name] of L.opts) {
    const id = aid(slot, v);
    const rel = slot === 'body' ? 'avatar/layers/body.png' : `avatar/layers/${SLOT_FILE[slot]}-${v}.png`;
    const { svg } = sheet(AF, FW, FH, ACOLS, (doc, fr) => slotFrameSVG(doc, fr, slot, v));
    const info = await save(svg, rel);
    man.add({
      id, file: 'characters/' + rel, type: 'spritesheet', category: 'characters/avatar', width: info.W, height: info.H, format: 'png',
      scale: 0.5, origin: ORIGIN, frameWidth: FW * SCALE, frameHeight: FH * SCALE, frames: AF.length,
      usage: `Lớp "${slot}" của bé — ${name}. ${SLOT_USAGE[slot]}. Cùng bố cục khung với mọi lớp khác.`,
      tags: ['avatar-layer', slot, L.tint ? 'tint' : 'full-color'],
    });
    variants.push({ id, name });
  }
  if (L.none && !L.noneFirst) variants.push({ id: null, name: 'Không' });
  layersData.push({ slot, tint: L.tint, variants });
}

// Bản ghép sẵn đủ màu
{
  const box = [-20, -20, 140, 140];
  const { svg } = sheet(AF, FW, FH, ACOLS, (doc, fr) => compositeFrameSVG(doc, fr, DEFAULT_LOOK, box));
  const info = await save(svg, 'avatar/avatar-default.png');
  man.add({
    id: 'avatar-default', file: 'characters/avatar/avatar-default.png', type: 'spritesheet', category: 'characters/avatar', width: info.W, height: info.H, format: 'png',
    scale: 0.5, origin: ORIGIN, frameWidth: FW * SCALE, frameHeight: FH * SCALE, frames: AF.length,
    usage: 'Bé mặc định đã ghép sẵn đủ màu (tóc ngắn nâu, áo phông vàng, quần soóc xanh, giày san hô). Dùng khi không cần tuỳ biến.',
    tags: ['avatar', 'composite'], animations: animList('avatar', AA),
  });
}

man.data('avatar', {
  frameWidth: FW * SCALE, frameHeight: FH * SCALE, origin: ORIGIN, scale: 0.5,
  anims: AA,
  views: { front: AA['idle-down'].start, side: AA['idle-side'].start, back: AA['idle-up'].start, threequarter: AA['idle-threequarter'].start },
  layers: layersData,
  palettes: PALETTES,
  tintSlots: { body: 'skin', hairBack: 'hair', hairFront: 'hair', top: 'cloth', bottom: 'cloth', shoes: 'shoes' },
  defaults: {
    hairBack: null, body: 'avatar-body', face: 'avatar-face-default', bottom: 'avatar-bottom-shorts', top: 'avatar-top-tshirt', shoes: 'avatar-shoes-sneakers',
    hairFront: 'avatar-hairfront-short', accessory: null, skin: 1, hair: 1,
    // JSON không cho trùng khoá: top/bottom/shoes ở trên là asset id, màu tô nằm ở *Color
    topColor: '#ffd96b', bottomColor: '#7b8fd1', shoesColor: '#ff8f8f',
  },
  composite: 'avatar-default',
  // Kiểu tóc gồm 2 lớp đi cặp (tóc sau + tóc trước). Khi quay lưng, đuôi tóc/màn tóc nằm ở lớp hairFront.
  hairstyles: Object.keys(HAIR_NAMES).map((k) => ({ key: k, name: HAIR_NAMES[k], hairFront: aid('hairFront', k), hairBack: k === 'short' ? null : aid('hairBack', k) })),
  flipForLeft: true,
});

// ── tham chiếu + chân dung ──
const LOOKS = [
  DEFAULT_LOOK,
  { variants: { hairBack: 'ponytail', body: 'base', face: 'freckles', hairFront: 'ponytail', bottom: 'skirt', top: 'dress', shoes: 'maryjane', accessory: 'flower' }, colors: { body: PAL.skin[0], hairBack: PAL.hair[4], hairFront: PAL.hair[4], top: '#ffb8cb', bottom: '#c7b5f0', shoes: '#9b85d9' } },
  { variants: { hairBack: 'puffs', body: 'base', face: 'default', hairFront: 'puffs', bottom: 'pants', top: 'hoodie', shoes: 'boots', accessory: 'backpack' }, colors: { body: PAL.skin[4], hairBack: PAL.hair[5], hairFront: PAL.hair[5], top: '#9fd67c', bottom: '#7cc3ee', shoes: '#ffd96b' } },
  { variants: { hairBack: 'bob', body: 'base', face: 'default', hairFront: 'bob', bottom: 'shorts', top: 'stripe', shoes: 'sneakers', accessory: 'glasses' }, colors: { body: PAL.skin[2], hairBack: PAL.hair[3], hairFront: PAL.hair[3], top: '#c7b5f0', bottom: '#ffac6b', shoes: '#7cc3ee' } },
  { variants: { hairBack: 'long', body: 'base', face: 'default', hairFront: 'long', bottom: 'skirt', top: 'tshirt', shoes: 'sneakers', accessory: 'scarf' }, colors: { body: PAL.skin[3], hairBack: PAL.hair[0], hairFront: PAL.hair[0], top: '#7cc3ee', bottom: '#ffb8cb', shoes: '#fffaf2' } },
  { variants: { hairBack: null, body: 'base', face: 'default', hairFront: 'short', bottom: 'pants', top: 'hoodie', shoes: 'sneakers', accessory: 'cap' }, colors: { body: PAL.skin[1], hairFront: PAL.hair[6], top: '#ff8f8f', bottom: '#7b8fd1', shoes: '#fffaf2' } },
];
const AFR = (k, i = 0) => AF[AA[k].start + i];
const cellBox = [-20, -20, 140, 140];
const place = (doc, inner, x, y, s, flip = false) => `<g transform="translate(${r2(x)} ${r2(y)}) scale(${flip ? -s : s} ${s})${flip ? ' translate(-96 0)' : ''}">${inner}</g>`;
const pedestal = (x, y, rx, c = '#fff3dc') => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${rx * 0.22}" fill="${c}" opacity="0.9"/>`;

{
  const W = 1280, H = 960;
  const doc = new Doc(W, H, { prefix: 'aref' });
  let b = `<rect width="${W}" height="${H}" fill="#fffaf2"/><rect x="16" y="16" width="${W - 32}" height="${H - 32}" rx="28" fill="#eef8f3" stroke="#d8ecdf" stroke-width="3"/>`;
  b += text(48, 66, 'Little World — Bé (nhân vật chính) · bảng tham chiếu', 30, PAL.ink, 'start', 900);
  b += text(48, 96, 'Chibi ~6–8 tuổi · đầu ≈ 42% chiều cao · khung 96×96 đơn vị (192 px @2x) · đế chân y = 88', 16, '#7d6b92', 'start', 700);
  // hàng 1: xoay vòng
  const views = [['idle-down', 'Trước'], ['idle-threequarter', '3/4'], ['idle-side', 'Bên phải'], ['idle-side', 'Bên trái (lật X)', true], ['idle-up', 'Sau']];
  views.forEach(([k, name, flip], i) => {
    const x = 60 + i * 238, y = 110, s = 2.4;
    b += pedestal(x + 48 * s, y + 88 * s, 70, '#d9f0e2');
    b += place(doc, compositeFrameSVG(doc, AFR(k), DEFAULT_LOOK, cellBox), x, y, s, flip);
    b += text(x + 48 * s, y + 96 * s + 8, name, 17, '#5f4d78');
  });
  // hàng 2: phối đồ
  b += text(48, 402, 'Phối đồ (lớp + màu tô)', 20, PAL.ink, 'start', 900);
  LOOKS.forEach((lk, i) => {
    const x = 50 + i * 200, y = 410, s = 1.9;
    b += pedestal(x + 48 * s, y + 88 * s, 52, '#dceef8');
    b += place(doc, compositeFrameSVG(doc, AFR(i % 2 ? 'idle-threequarter' : 'idle-down'), lk, cellBox), x, y, s);
  });
  // hàng 3: biểu cảm / emote
  b += text(48, 628, 'Biểu cảm & hành động', 20, PAL.ink, 'start', 900);
  const emotes = [['happy', 1, 'Vui vẻ'], ['celebrate', 3, 'Ăn mừng'], ['think', 3, 'Suy nghĩ'], ['wave', 1, 'Vẫy tay'], ['interact', 2, 'Tương tác'], ['walk-side', 1, 'Đi'], ['run-side', 0, 'Chạy']];
  emotes.forEach(([k, i, name], j) => {
    const x = 44 + j * 172, y = 636, s = 1.7;
    b += place(doc, compositeFrameSVG(doc, AFR(k, i), LOOKS[j % LOOKS.length], cellBox), x, y, s);
    b += text(x + 48 * s, y + 96 * s + 4, name, 15, '#5f4d78');
  });
  // bảng màu
  b += text(48, 855, 'Bảng màu tô (Phaser setTint):', 16, PAL.ink, 'start', 800);
  let px = 300;
  for (const [k, list] of Object.entries(PALETTES)) {
    b += text(px, 855, { skin: 'Da', hair: 'Tóc', cloth: 'Áo/quần', shoes: 'Giày' }[k], 14, '#5f4d78', 'start', 800);
    list.forEach((hex, i) => { b += `<rect x="${px + i * 24}" y="866" width="20" height="20" rx="6" fill="${hex}" stroke="#8f8a9c" stroke-width="1.5"/>`; });
    px += Math.max(list.length * 24, 60) + 30;
  }
  b += text(48, 920, 'Lớp từ dưới lên: tóc sau · da · mặt · quần · áo · giày · tóc trước · phụ kiện. Lớp tô vẽ bằng xám trung tính; mặt & phụ kiện đủ màu.', 14, '#7d6b92', 'start', 700);
  await save(doc.toString(b), 'avatar/reference-sheet.png', 1.5);
  man.add({ id: 'avatar-reference', file: 'characters/avatar/reference-sheet.png', type: 'image', category: 'characters/avatar', width: W * 1.5, height: H * 1.5, format: 'png', scale: 1, origin: [0.5, 0.5], usage: 'Bảng tham chiếu gốc của bé (xoay vòng, phối đồ, biểu cảm, bảng màu). Không dùng trong game.', tags: ['reference'] });
}

function portraitSVG(bg, inner, cx, cy, s) {
  const doc = new Doc(128, 128, { prefix: 'pt' + (++docN) });
  const g = doc.radial([[0, '#ffffff'], [0.55, bg[0]], [1, bg[1]]], 0.4, 0.3, 0.8);
  const clip = doc.clip('<circle cx="64" cy="64" r="56"/>');
  const content = typeof inner === 'function' ? inner(doc) : inner;
  return doc.toString(`<circle cx="66" cy="68" r="60" fill="rgba(76,56,118,0.18)"/><circle cx="64" cy="64" r="60" fill="#ffffff"/><circle cx="64" cy="64" r="56" fill="${g}"/>`
    + `<g clip-path="${clip}"><ellipse cx="64" cy="132" rx="70" ry="30" fill="#ffffff" opacity="0.35"/><g transform="translate(${64 - cx * s} ${64 - cy * s}) scale(${s})">${content}</g></g>`
    + `<circle cx="64" cy="64" r="56" fill="none" stroke="${bg[2]}" stroke-width="4"/><path d="M24,46 A44,44 0 0 1 52,16" fill="none" stroke="#ffffff" stroke-width="4" stroke-linecap="round" opacity="0.7"/>`);
}
{
  const fr = { anim: 'portrait', i: 0, view: 'front', pose: { face: { eyes: 'open', mouth: 'open' }, armL: { out: 10 }, armR: { out: 10 } } };
  const svg = portraitSVG(['#dff3fd', '#a8dcf7', '#7cc3ee'], (doc) => compositeFrameSVG(doc, fr, DEFAULT_LOOK, cellBox), 48, 37, 1.85);
  await save(svg, 'avatar/portrait.png');
  man.add({ id: 'avatar-portrait', file: 'characters/avatar/portrait.png', type: 'image', category: 'characters/avatar', width: 256, height: 256, format: 'png', scale: 0.5, origin: [0.5, 0.5], usage: 'Huy hiệu chân dung bé (đầu + vai) trong khung tròn cho UI', tags: ['portrait', 'ui'] });
}

// ═════════════════════════ B. THÚ CƯNG ═════════════════════════
const PCOLS = 8;
const petsData = {};
const PET_BG = { fox: ['#ffe9d6', '#ffc9a3', '#f28a4e'], bunny: ['#fff0f5', '#ffdbe5', '#f58aa8'], bear: ['#fff3dc', '#f6e0ae', '#cf9161'] };
for (const kind of ['fox', 'bunny', 'bear']) {
  console.log(`Thú cưng ${kind}:`);
  const sp = SPECIES[kind];
  const { frames, anims } = petFrames(kind);
  const { svg } = sheet(frames, PET.W, PET.H, PCOLS, (doc, fr) => petFrameSVG(doc, kind, fr.pose));
  const info = await save(svg, `${kind}/${kind}-sheet.png`);
  man.add({
    id: `${kind}-sheet`, file: `characters/${kind}/${kind}-sheet.png`, type: 'spritesheet', category: `characters/${kind}`, width: info.W, height: info.H, format: 'png',
    scale: 0.5, origin: ORIGIN, frameWidth: PET.W * SCALE, frameHeight: PET.H * SCALE, frames: frames.length,
    usage: `${sp.name} — thú cưng đồng hành (đủ màu). Nhìn nghiêng quay PHẢI; sang trái dùng flipX.`, tags: ['pet', kind], animations: animList(kind, anims),
  });
  petsData[kind] = {
    sheet: `${kind}-sheet`, name: sp.name, personality: sp.personality, frameWidth: PET.W * SCALE, frameHeight: PET.H * SCALE, origin: ORIGIN, scale: 0.5,
    anims, views: { front: anims['idle-front'].start, side: anims['idle-side'].start, back: anims['idle-back'].start }, portrait: `${kind}-portrait`, flipForLeft: true,
  };

  // tham chiếu
  {
    const W = 1100, H = 760;
    const doc = new Doc(W, H, { prefix: 'pref' + kind });
    let b = `<rect width="${W}" height="${H}" fill="#fffaf2"/><rect x="16" y="16" width="${W - 32}" height="${H - 32}" rx="28" fill="${PET_BG[kind][0]}" stroke="${PET_BG[kind][1]}" stroke-width="3"/>`;
    b += text(48, 66, `Little World — ${sp.name} · bảng tham chiếu`, 30, PAL.ink, 'start', 900);
    b += text(48, 96, sp.personality, 15, '#7d6b92', 'start', 700);
    const views = [[{ yaw: 0 }, 'Trước'], [{ yaw: 40 }, '3/4'], [{ yaw: 90 }, 'Bên phải'], [{ yaw: 180 }, 'Sau']];
    views.forEach(([pose, name], i) => {
      const x = 50 + i * 255, y = 110, s = 3;
      b += pedestal(x + 40 * s, y + 73.6 * s, 80, PET_BG[kind][1]);
      b += `<g transform="translate(${x} ${y}) scale(${s})">${petFrameSVG(doc, kind, pose)}</g>`;
      b += text(x + 40 * s, y + 80 * s + 8, name, 17, '#5f4d78');
    });
    b += text(48, 410, 'Biểu cảm & hành động', 20, PAL.ink, 'start', 900);
    const ex = [['happy', 1, 'Vui'], ['greet', 2, 'Chào'], ['celebrate', 2, 'Ăn mừng'], ['interact', 2, 'Tương tác'], ['walk-side', 2, 'Đi'], ['idle-front', 3, 'Chớp mắt']];
    ex.forEach(([k, i, name], j) => {
      const fr = frames[anims[k].start + i];
      const x = 40 + j * 172, y = 420, s = 2.05;
      b += `<g transform="translate(${x} ${y}) scale(${s})">${petFrameSVG(doc, kind, fr.pose)}</g>`;
      b += text(x + 40 * s, y + 80 * s + 6, name, 15, '#5f4d78');
    });
    b += text(48, 640, 'Bảng màu:', 16, PAL.ink, 'start', 800);
    const cols = [sp.body, sp.belly, sp.feet, sp.earInner, sp.line, sp.scarf, sp.bow, sp.heart, sp.glow].filter(Boolean);
    cols.forEach((hex, i) => { b += `<rect x="${150 + i * 74}" y="622" width="60" height="26" rx="8" fill="${hex}" stroke="#8f8a9c" stroke-width="1.5"/>` + text(180 + i * 74, 666, hex, 11, '#5f4d78', 'middle', 700); });
    b += text(48, 712, 'Khung 80×80 đơn vị (160 px @2x) · đế chân y = 73.6 · origin [0.5, 0.92] · hiển thị scale 0.5', 14, '#7d6b92', 'start', 700);
    await save(doc.toString(b), `${kind}/reference-sheet.png`, 1.5);
    man.add({ id: `${kind}-reference`, file: `characters/${kind}/reference-sheet.png`, type: 'image', category: `characters/${kind}`, width: W * 1.5, height: H * 1.5, format: 'png', scale: 1, origin: [0.5, 0.5], usage: `Bảng tham chiếu gốc của ${sp.name}. Không dùng trong game.`, tags: ['reference'] });
  }
  // chân dung
  {
    const H0 = sp.head;
    const svg = portraitSVG(PET_BG[kind], (doc) => petFrameSVG(doc, kind, { yaw: 0, face: { eyes: 'open', mouth: 'catopen' }, earL: 4 }), 40, PET.GY - H0.Y - 6, 2.35);
    await save(svg, `${kind}/portrait.png`);
    man.add({ id: `${kind}-portrait`, file: `characters/${kind}/portrait.png`, type: 'image', category: `characters/${kind}`, width: 256, height: 256, format: 'png', scale: 0.5, origin: [0.5, 0.5], usage: `Huy hiệu chân dung ${sp.name} trong khung tròn cho UI`, tags: ['portrait', 'ui'] });
  }
}
man.data('pets', petsData);

man.write();
await R.close();
console.log("Xong.");
