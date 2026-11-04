#!/usr/bin/env node
// Gộp spot/src/ thành spot/index.html:   node spot/build.mjs
// Các tệp trong src/ là ES module. Xem tools/bundle.mjs.
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { bundle } from '../tools/bundle.mjs';

bundle({
  dir: dirname(fileURLToPath(import.meta.url)),
  mode: 'module',
  // Xếp theo phụ thuộc: tệp nào cũng phải đứng sau thứ nó cần.
  order: ['config', 'rng', 'draw', 'kitchen', 'restaurant', 'clothes', 'beach', 'themes', 'level', 'state', 'render', 'sound', 'game', 'ui', 'main'],
});
