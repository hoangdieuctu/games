#!/usr/bin/env node
// ── Gộp aquarium/src/ thành một tệp index.html tự chứa ──
//   node aquarium/build.mjs
// Các tệp .js là script thường (không module), nối theo thứ tự rồi bọc trong một IIFE.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const src = (f) => join(here, 'src', f);
const ORDER = ['config', 'state', 'sim', 'boids', 'render', 'ui', 'main'];

const js = `(function () {\n'use strict';\n${ORDER.map((n) => `/* ══════════ ${n}.js ══════════ */\n${readFileSync(src(n + '.js'), 'utf8')}`).join('\n\n')}\n})();`;
try { new Function(js); } catch (err) { console.error('Lỗi cú pháp trong mã gộp:', err.message); process.exit(1); }

const css = readFileSync(src('style.css'), 'utf8').trim();
const iconPath = join(here, '..', 'icon-aquarium-180.png');
const icon = existsSync(iconPath) ? 'data:image/png;base64,' + readFileSync(iconPath).toString('base64') : '';

const html = readFileSync(src('page.html'), 'utf8')
  .replace('/*__ICON__*/', icon)
  .replace('/*__CSS__*/', () => css)
  .replace('/*__JS__*/', () => js)
  .replace('<!DOCTYPE html>', '<!DOCTYPE html>\n<!-- TỆP NÀY ĐƯỢC TẠO TỰ ĐỘNG — đừng sửa trực tiếp.\n     Sửa trong aquarium/src/ rồi chạy: node aquarium/build.mjs -->');
writeFileSync(join(here, 'index.html'), html);
console.log(`aquarium/index.html: ${(html.length / 1024).toFixed(0)} KB`);
