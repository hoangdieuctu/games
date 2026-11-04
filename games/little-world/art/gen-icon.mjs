#!/usr/bin/env node
// Icon 180×180 cho iPad / trang chủ: đảo của bé trên biển + Cáo ló đầu.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { openRasterizer } from './lib/raster.mjs';
import { Doc, PAL } from './lib/style.mjs';
import { ASSETS, GAME_DIR } from './lib/manifest.mjs';

const uri = (f) => 'data:image/png;base64,' + readFileSync(join(ASSETS, f)).toString('base64');
const d = new Doc(180, 180);
const sea = d.linear([[0, PAL.skyLight], [0.42, PAL.sky], [0.43, PAL.oceanLight], [1, PAL.ocean]]);
const svg = d.toString(`
  <rect width="180" height="180" fill="${sea}"/>
  <ellipse cx="90" cy="112" rx="88" ry="30" fill="${PAL.foam}" opacity=".45"/>
  <image href="${uri('world-map/home-island.png')}" x="-4" y="40" width="188" height="117"/>
  <image href="${uri('characters/fox/portrait.png')}" x="112" y="112" width="64" height="64"/>`);
const R = await openRasterizer();
await R.save(svg, join(GAME_DIR, 'icon.png'), { scale: 1 });
await R.close();
console.log('icon.png');

// Ảnh thẻ trang chủ 640×360: cắt quanh nhà chính trên ảnh tham chiếu đảo
{
  const ref = 'data:image/webp;base64,' + readFileSync(join(ASSETS, 'island/terrain/island-reference.webp')).toString('base64');
  const t = new Doc(640, 360, { viewBox: '560 330 1440 810' });
  const R2 = await openRasterizer();
  await R2.save(t.toString(`<image href="${ref}" x="0" y="0" width="2560" height="1600"/>`), join(GAME_DIR, 'thumb.webp'), { scale: 1, quality: 0.82 });
  await R2.close();
  console.log('thumb.webp');
}
