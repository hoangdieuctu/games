#!/usr/bin/env node
// Gộp colorsort/src/ thành colorsort/index.html:   node colorsort/build.mjs
// Các tệp trong src/ là ES module. Xem tools/bundle.mjs.
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { bundle } from '../tools/bundle.mjs';

bundle({
  dir: dirname(fileURLToPath(import.meta.url)),
  mode: 'module',
  // Xếp theo phụ thuộc: tệp nào cũng phải đứng sau thứ nó cần.
  order: ['config', 'layout', 'fx', 'level', 'state', 'render', 'game', 'ui', 'main'],
});
