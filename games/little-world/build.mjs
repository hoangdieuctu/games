#!/usr/bin/env node
// Gộp games/little-world/src/**/*.ts thành games/little-world/index.html:
//   node games/little-world/build.mjs
//
// Mã nguồn viết bằng TypeScript; Node (≥ 22.13) tự bỏ phần kiểu (stripTypeScriptTypes),
// không cần cài gì thêm. Phaser 3 nạp từ CDN. Tài sản hình ảnh nằm trong public/assets/
// (sinh bởi art/build-all.mjs) và được tải lúc chạy — vì vậy demo cần chạy qua http(s)
// (GitHub Pages hoặc `npx serve`), không mở trực tiếp bằng file://.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { stripTypeScriptTypes } from 'node:module';

const dir = dirname(fileURLToPath(import.meta.url));
const src = (f) => join(dir, 'src', f);

// Thứ tự nạp theo phụ thuộc
const ORDER = [
  'services/AssetLoader', 'services/Ui', 'services/CameraControls', 'services/LayeredAvatar',
  'scenes/BootScene', 'scenes/WorldMapPreviewScene', 'scenes/IslandPreviewScene', 'scenes/CharacterGalleryScene',
  'main',
];

const modName = (p) => basename(p).replace(/\W/g, '_');

function transform(path) {
  const ts = readFileSync(src(path + '.ts'), 'utf8');
  let code = stripTypeScriptTypes(ts, { mode: 'strip' });
  const names = new Set();
  for (const m of code.matchAll(/^export\s+(?:const|let|function|class)\s+([A-Za-z_$][\w$]*)/gm)) names.add(m[1]);
  code = code
    // import type / interface-only imports đã bị bỏ; còn lại: import { a, b } from './x.js'
    .replace(/^import\s*\{([^}]*)\}\s*from\s*'([^']+)\.js';?\s*$/gm, (_, list, p) => {
      const binds = list.split(',').map((x) => x.trim()).filter(Boolean)
        .filter((x) => !/^type\s/.test(x))
        .map((x) => x.replace(/\s+as\s+/, ': '));
      return binds.length ? `const { ${binds.join(', ')} } = M.${modName(p)};` : '';
    })
    .replace(/^export\s+(const|let|function|class)\s/gm, '$1 ');
  const leftover = code.match(/^\s*(import|export)\s/m);
  if (leftover) throw new Error(`${path}.ts: chưa xử lý được "${leftover[0].trim()}"`);
  // Các tên chỉ là kiểu (interface) không còn tồn tại sau khi strip → không export chúng
  return `/* ══════════ ${path}.ts ══════════ */\nM.${modName(path)} = (function () {\n${code.trim()}\nreturn { ${[...names].join(', ')} };\n})();`;
}

const js = `(function () {\n'use strict';\nconst M = {};\n\n${ORDER.map(transform).join('\n\n')}\n})();`;
try { new Function(js); } catch (err) {
  console.error('little-world: mã gộp lại bị lỗi cú pháp:', err.message);
  process.exit(1);
}

const css = readFileSync(src('style.css'), 'utf8').trim();
const iconPath = join(dir, 'icon.png');
const icon = existsSync(iconPath) ? 'data:image/png;base64,' + readFileSync(iconPath).toString('base64') : 'data:,';
const html = readFileSync(src('page.html'), 'utf8')
  .replace('/*__ICON__*/', icon)
  .replace('/*__CSS__*/', () => '\n' + css + '\n')
  .replace('/*__JS__*/', () => js)
  .replace('<!DOCTYPE html>',
    '<!DOCTYPE html>\n<!-- TỆP NÀY ĐƯỢC TẠO TỰ ĐỘNG — đừng sửa trực tiếp.\n'
    + '     Sửa trong games/little-world/src/ rồi chạy: node games/little-world/build.mjs -->');
writeFileSync(join(dir, 'index.html'), html);
console.log(`games/little-world/index.html: ${(html.length / 1024).toFixed(0)} KB (${ORDER.length} tệp)`);
