// ── Ghi mảnh manifest cho từng nhóm tài sản ──
// Mỗi generator ghi art/manifest/<group>.json; art/build-manifest.mjs gộp thành
// public/assets/asset-manifest.json mà Phaser (src/services/AssetLoader.ts) đọc.
//
// Một mục (entry):
// {
//   id:        'island-tree-oak-1',          // duy nhất, kebab-case, có tiền tố nhóm
//   file:      'island/trees/oak-1.png',     // tương đối với public/assets/
//   type:      'image' | 'spritesheet' | 'json',
//   category:  'island/trees',               // = thư mục
//   width, height,                            // kích thước TEXTURE (px thật)
//   format:    'png' | 'webp' | 'svg' | 'json',
//   scale:     0.5,                           // scale hiển thị mặc định (texture @2x → 0.5)
//   origin:    [0.5, 0.92],                   // điểm neo (thường là chân/đế chạm đất)
//   usage:     'Cây sồi tròn đặt trên đảo',   // mục đích sử dụng
//   tags:      ['placeable','decoration'],    // tuỳ chọn
//   // chỉ spritesheet:
//   frameWidth, frameHeight, frames,
//   animations: [{ key:'fox-walk-side', frames:[8,9,10,11,12,13,14,15], frameRate:10, repeat:-1 }],
// }
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const ART_DIR = dirname(dirname(fileURLToPath(import.meta.url)));
export const GAME_DIR = dirname(ART_DIR);
export const ASSETS = join(GAME_DIR, 'public', 'assets');

export function manifestGroup(group) {
  const entries = [];
  const extra = {};
  return {
    add(e) {
      if (!e.id || !e.file) throw new Error('entry cần id và file');
      if (entries.some((x) => x.id === e.id)) throw new Error('trùng id ' + e.id);
      const format = e.format || e.file.split('.').pop();
      entries.push({ type: 'image', scale: 0.5, origin: [0.5, 0.5], ...e, format });
      return e;
    },
    /** dữ liệu phụ (ví dụ avatar layout) — gộp vào manifest.data[group] */
    data(key, value) { extra[key] = value; },
    write() {
      const out = join(ART_DIR, 'manifest', `${group}.json`);
      mkdirSync(dirname(out), { recursive: true });
      writeFileSync(out, JSON.stringify({ group, entries, data: extra }, null, 1));
      console.log(`manifest ${group}: ${entries.length} mục`);
    },
  };
}
