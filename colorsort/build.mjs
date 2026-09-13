#!/usr/bin/env node
// ── Gộp mã nguồn trong src/ thành một tệp index.html tự chứa ──
//
//   node colorsort/build.mjs
//
// Vì sao phải gộp: trò chơi viết bằng ES module, mà trình duyệt chặn module khi
// trang được mở bằng file:// — nháy đúp vào tệp thì không mẩu mã nào chạy. Gộp
// hết vào một tệp thì nháy đúp, gửi AirDrop sang iPad hay đưa lên web đều chạy.
//
// Mỗi module thành một hàm tự gọi, trả về đúng những thứ nó `export`; các câu
// `import` được đổi thành lấy từ bảng M. Thứ tự nạp phải theo phụ thuộc.

import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const src = (f) => join(here, 'src', f);

// Xếp theo phụ thuộc: module nào cũng phải đứng sau thứ nó cần.
const ORDER = ['config', 'layout', 'fx', 'audio', 'level', 'state', 'render', 'game', 'ui', 'main'];

function exportedNames(code) {
  const names = new Set();
  for (const m of code.matchAll(/^export\s+(?:const|let|function)\s+([A-Za-z_$][\w$]*)/gm)) {
    names.add(m[1]);
  }
  for (const m of code.matchAll(/^export\s*\{([^}]*)\}\s*;?/gm)) {
    for (const part of m[1].split(',')) {
      const n = part.trim().split(/\s+as\s+/).pop().trim();
      if (n) names.add(n);
    }
  }
  return [...names];
}

function transform(name, code) {
  const names = exportedNames(code);

  const body = code
    // import { a, b as c } from './x.js';  ->  const { a, b: c } = M.x;
    .replace(/^import\s*\{([^}]*)\}\s*from\s*'\.\/([\w-]+)\.js';?$/gm, (_, list, mod) => {
      const binds = list.split(',').map((x) => x.trim()).filter(Boolean)
        .map((x) => x.replace(/\s+as\s+/, ': '));
      return `const { ${binds.join(', ')} } = M.${mod};`;
    })
    // import * as A from './x.js';  ->  const A = M.x;
    .replace(/^import\s*\*\s*as\s+([A-Za-z_$][\w$]*)\s*from\s*'\.\/([\w-]+)\.js';?$/gm,
      (_, alias, mod) => `const ${alias} = M.${mod};`)
    // export const/let/function X  ->  const/let/function X
    .replace(/^export\s+(const|let|function)\s/gm, '$1 ')
    // export { a, b };  ->  bỏ hẳn, danh sách đã gom ở trên
    .replace(/^export\s*\{[^}]*\}\s*;?$/gm, '');

  // Còn sót `import`/`export` nào là bộ gộp chưa hiểu — dừng ngay còn hơn tạo ra tệp hỏng.
  const leftover = body.match(/^\s*(import|export)\s/m);
  if (leftover) throw new Error(`${name}.js: chưa xử lý được "${leftover[0].trim()}"`);

  return `/* ══════════ ${name}.js ══════════ */\nM.${name} = (function () {\n${body.trim()}\n`
       + `return { ${names.join(', ')} };\n})();`;
}

const modules = ORDER.map((n) => transform(n, readFileSync(src(`${n}.js`), 'utf8')));
const js = `(function () {\n'use strict';\nconst M = {};\n\n${modules.join('\n\n')}\n})();`;

// Biên dịch thử (không chạy): thà build hỏng còn hơn xuất ra tệp index.html chết.
try {
  new Function(js);
} catch (err) {
  console.error('Mã gộp lại bị lỗi cú pháp:', err.message);
  process.exit(1);
}

const css = readFileSync(src('style.css'), 'utf8').trim();
const icon = 'data:image/png;base64,'
  + readFileSync(join(here, '..', 'icon-colorsort-180.png')).toString('base64');

const html = readFileSync(src('page.html'), 'utf8')
  .replace('/*__ICON__*/', icon)
  .replace('/*__CSS__*/', () => '\n' + css + '\n')
  .replace('/*__JS__*/', () => js)
  .replace('<!DOCTYPE html>',
    '<!DOCTYPE html>\n<!-- TỆP NÀY ĐƯỢC TẠO TỰ ĐỘNG — đừng sửa trực tiếp.\n'
    + '     Sửa trong colorsort/src/ rồi chạy: node colorsort/build.mjs -->');

writeFileSync(join(here, 'index.html'), html);
console.log(`index.html: ${(html.length / 1024).toFixed(0)} KB (${ORDER.length} module)`);
