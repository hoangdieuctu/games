#!/usr/bin/env node
// Gộp colorsort/src/ thành colorsort/index.html:   node colorsort/build.mjs
// Xem bundle.mjs.
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { bundle } from './bundle.mjs';

bundle({
  dir: dirname(fileURLToPath(import.meta.url)),
  // Xếp theo phụ thuộc: tệp nào cũng phải đứng sau thứ nó cần.
  order: ['config', 'layout', 'fx', 'level', 'state', 'render', 'game', 'ui', 'main'],
});
