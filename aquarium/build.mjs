#!/usr/bin/env node
// Gộp aquarium/src/ thành aquarium/index.html:   node aquarium/build.mjs
// Các tệp trong src/ là script thường (không phải module). Xem tools/bundle.mjs.
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { bundle } from '../tools/bundle.mjs';

bundle({
  dir: dirname(fileURLToPath(import.meta.url)),
  mode: 'script',
  // Xếp theo phụ thuộc: tệp nào cũng phải đứng sau thứ nó cần.
  order: ['config', 'state', 'sim', 'boids', 'render', 'ui', 'main'],
});
