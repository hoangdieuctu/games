// ── Bộ gộp dùng chung: gộp games/<game>/src/ thành một tệp games/<game>/index.html tự chứa ──
//
// Mỗi game có build.mjs riêng chỉ khai báo thứ tự nạp rồi gọi bundle():
//
//   node games/colorsort/build.mjs
//
// Vì sao phải gộp: trình duyệt chặn ES module khi trang được mở bằng file:// —
// nháy đúp vào tệp thì không mẩu mã nào chạy. Gộp hết vào một tệp thì nháy đúp,
// gửi AirDrop sang iPad hay đưa lên web đều chạy.
//
// Hai kiểu mã nguồn:
//   mode: 'module' — các tệp là ES module. Mỗi module thành một hàm tự gọi, trả về
//                    đúng những thứ nó `export`; `import` đổi thành lấy từ bảng M.
//   mode: 'script' — các tệp là script thường, chỉ nối lại theo thứ tự.
// Cả hai đều bọc trong một IIFE 'use strict'. Thứ tự nạp phải theo phụ thuộc.
//
// src/page.html chứa ba chỗ giữ chỗ: /*__ICON__*/ (icon.png dạng data URI),
// /*__CSS__*/ (src/style.css) và /*__JS__*/ (mã đã gộp).

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { basename, join } from 'node:path';

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

function transformModule(name, code) {
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

/**
 * @param {object} opt
 * @param {string}   opt.dir    thư mục game (chứa src/, icon.png, index.html)
 * @param {string[]} opt.order  tên các tệp trong src/ (không có .js), theo thứ tự nạp
 * @param {'module'|'script'} [opt.mode='module']
 */
export function bundle({ dir, order, mode = 'module' }) {
  const game = basename(dir);
  const src = (f) => join(dir, 'src', f);
  const read = (n) => readFileSync(src(`${n}.js`), 'utf8');

  const js = mode === 'script'
    ? `(function () {\n'use strict';\n${order.map((n) => `/* ══════════ ${n}.js ══════════ */\n${read(n)}`).join('\n\n')}\n})();`
    : `(function () {\n'use strict';\nconst M = {};\n\n${order.map((n) => transformModule(n, read(n))).join('\n\n')}\n})();`;

  // Biên dịch thử (không chạy): thà build hỏng còn hơn xuất ra tệp index.html chết.
  try {
    new Function(js);
  } catch (err) {
    console.error(`${game}: mã gộp lại bị lỗi cú pháp:`, err.message);
    process.exit(1);
  }

  const css = readFileSync(src('style.css'), 'utf8').trim();
  const iconPath = join(dir, 'icon.png');
  const icon = existsSync(iconPath) ? 'data:image/png;base64,' + readFileSync(iconPath).toString('base64') : '';

  const html = readFileSync(src('page.html'), 'utf8')
    .replace('/*__ICON__*/', icon)
    .replace('/*__CSS__*/', () => '\n' + css + '\n')
    .replace('/*__JS__*/', () => js)
    .replace('<!DOCTYPE html>',
      '<!DOCTYPE html>\n<!-- TỆP NÀY ĐƯỢC TẠO TỰ ĐỘNG — đừng sửa trực tiếp.\n'
      + `     Sửa trong games/${game}/src/ rồi chạy: node games/${game}/build.mjs -->`);

  writeFileSync(join(dir, 'index.html'), html);
  console.log(`games/${game}/index.html: ${(html.length / 1024).toFixed(0)} KB (${order.length} tệp)`);
}
