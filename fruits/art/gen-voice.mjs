#!/usr/bin/env node
// Sinh giọng đọc tên trái cây (tiếng Việt + tiếng Anh) bằng giọng nơ-ron — cùng cách làm với 100 Động Vật:
//   node fruits/art/gen-voice.mjs            # chỉ sinh clip còn thiếu
//   node fruits/art/gen-voice.mjs --force    # sinh lại tất cả
//
// Cần edge-tts (giọng Microsoft Neural) và ffmpeg, cài ngoài repo:
//   python3 -m venv /tmp/fruits-tts && /tmp/fruits-tts/bin/pip install edge-tts
//   export EDGE_TTS=/tmp/fruits-tts/bin/edge-tts
//
// Danh sách đọc thẳng từ mảng FRUITS trong fruits/data.js; tên tệp lấy theo ảnh (img/mango.jpg → mango.mp3).
// Tiếng Việt: "Quả xoài!" (riêng các loại hạt đọc "Hạt điều!", "Hạt óc chó!", "Đậu phộng!"); tiếng Anh: "Mango!".
// Kết quả: fruits/voice/vi/<tên>.mp3, fruits/voice/en/<tên>.mp3.
import { readFileSync, existsSync, mkdirSync, readdirSync, unlinkSync, statSync, rmSync } from 'node:fs';
import { dirname, join, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const run = promisify(execFile);
const dir = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(dir, 'voice');
const EDGE = process.env.EDGE_TTS || 'edge-tts';
const force = process.argv.includes('--force');
// --lang=vi hoặc --lang=en: chỉ sinh một thứ tiếng (dịch vụ đôi khi tạm chặn riêng một giọng)
const onlyLang = (process.argv.find(a => a.startsWith('--lang=')) || '').slice(7);

const viText = f => {
  const name = f.vi.toLowerCase();
  if (/^(hạt|đậu)/.test(name)) return `${name[0].toUpperCase()}${name.slice(1)}!`;
  // nhóm Hạt: "Hạt óc chó!", riêng ca cao, cà phê vẫn là "Quả …"
  if (f.cat === 'Hạt' && !/^(ca cao|cà phê)$/.test(name)) return `Hạt ${name}!`;
  return `Quả ${name}!`;
};
const LANGS = {
  vi: { voice: 'vi-VN-HoaiMyNeural', rate: '+8%', pitch: '+30Hz', text: viText },
  en: { voice: 'en-US-AnaNeural', rate: '-5%', pitch: '+10Hz', text: f => `${f.en}!` },
};

const FRUITS = Function(readFileSync(join(dir, 'data.js'), 'utf8') + '\nreturn FRUITS;')();
const slug = f => basename(f.img).replace(/\.[^.]+$/, '');

const todo = [];
for (const [lang, L] of Object.entries(LANGS)) {
  mkdirSync(join(OUT, lang), { recursive: true });
  if (onlyLang && lang !== onlyLang) continue;
  for (const f of FRUITS) {
    const file = join(OUT, lang, slug(f) + '.mp3');
    if (force || !existsSync(file)) todo.push([file, L, L.text(f)]);
  }
}
console.log(`${FRUITS.length} loại quả, cần sinh ${todo.length} clip`);

const tmp = join(OUT, '.tmp'); mkdirSync(tmp, { recursive: true });
let done = 0, fail = 0;
async function gen([file, L, text]) {
  const raw = join(tmp, basename(dirname(file)) + '-' + basename(file));
  // giọng tiếng Việt hay trả về rỗng ngẫu nhiên — thử lại nhiều lần, chờ ngắn
  for (let attempt = 0; attempt < 12; attempt++) {
    try {
      await run(EDGE, ['--voice', L.voice, `--rate=${L.rate}`, `--pitch=${L.pitch}`, '--text', text, '--write-media', raw]);
      // mono 24 kHz 48 kbps, cắt lặng đầu/cuối, nâng dải cao cho giọng sáng, chuẩn hoá độ to
      await run('ffmpeg', ['-y', '-loglevel', 'error', '-i', raw, '-af',
        'silenceremove=start_periods=1:start_threshold=-50dB,areverse,silenceremove=start_periods=1:start_threshold=-50dB,areverse,apad=pad_dur=0.08,highshelf=f=3500:g=2,loudnorm=I=-16:TP=-1.5',
        '-ac', '1', '-ar', '24000', '-b:a', '48k', file]);
      unlinkSync(raw);
      if (++done % 25 === 0) console.log(`  ${done}/${todo.length}`);
      return;
    } catch (e) { await new Promise(r => setTimeout(r, attempt < 6 ? 800 : 5000)); }
  }
  fail++; console.warn('  lỗi:', file, text);
}
const queue = [...todo];
await Promise.all(Array.from({ length: 2 }, async () => {
  while (queue.length) { await gen(queue.shift()); await new Promise(r => setTimeout(r, 300)); }
}));
rmSync(tmp, { recursive: true, force: true });

// xoá clip của loại quả không còn trong danh sách
const keep = new Set(FRUITS.map(f => slug(f) + '.mp3'));
let bytes = 0, n = 0;
for (const lang of Object.keys(LANGS)) for (const f of readdirSync(join(OUT, lang))) {
  const p = join(OUT, lang, f);
  if (f.endsWith('.mp3') && !keep.has(f)) { unlinkSync(p); continue; }
  bytes += statSync(p).size; n++;
}
console.log(`xong: ${done} mới, ${fail} lỗi; ${n} clip, ${(bytes / 1024).toFixed(0)} KB → fruits/voice/`);
