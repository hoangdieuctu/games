#!/usr/bin/env node
// Sinh lại TOÀN BỘ tài sản hình ảnh rồi gộp manifest:
//   PLAYWRIGHT_CORE=/path/to/playwright-core node little-world/art/build-all.mjs [world|island|characters ...]
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';
import { ART_DIR } from './lib/manifest.mjs';

const all = ['world', 'island', 'characters'];
const pick = process.argv.slice(2).filter((a) => all.includes(a));
for (const g of pick.length ? pick : all) {
  console.log(`\n── gen-${g} ──`);
  const r = spawnSync(process.execPath, [join(ART_DIR, `gen-${g}.mjs`)], { stdio: 'inherit' });
  if (r.status !== 0) { console.error(`gen-${g} lỗi`); process.exit(r.status || 1); }
}
console.log('\n── manifest ──');
const r = spawnSync(process.execPath, [join(ART_DIR, 'build-manifest.mjs')], { stdio: 'inherit' });
process.exit(r.status || 0);
