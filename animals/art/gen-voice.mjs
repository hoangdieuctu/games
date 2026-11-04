#!/usr/bin/env node
// Sinh giọng đọc tên con vật (tiếng Việt + tiếng Anh) bằng giọng nơ-ron — cùng cách làm với Thế Giới Nhỏ:
//   node animals/art/gen-voice.mjs            # chỉ sinh clip còn thiếu
//   node animals/art/gen-voice.mjs --force    # sinh lại tất cả
//
// Cần edge-tts (giọng Microsoft Neural) và ffmpeg, cài ngoài repo:
//   python3 -m venv /tmp/animals-tts && /tmp/animals-tts/bin/pip install edge-tts
//   export EDGE_TTS=/tmp/animals-tts/bin/edge-tts
//
// Danh sách con vật đọc thẳng từ mảng ANIMALS trong animals/index.html; tên tệp lấy theo ảnh (img/dog.jpg → dog.mp3).
// Giọng vui tươi cho trẻ nhỏ: tiếng Việt HoaiMy nói nhanh, cao giọng ("Con chó!"),
// tiếng Anh AnaNeural (giọng bé gái) cũng hơi cao giọng.
// Kết quả: animals/voice/vi/<tên>.mp3, animals/voice/en/<tên>.mp3.
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

const LANGS = {
  vi: { voice: 'vi-VN-HoaiMyNeural', rate: '+8%', pitch: '+30Hz', text: a => `Con ${a.vi.toLowerCase()}!` },
  en: { voice: 'en-US-AnaNeural', rate: '-5%', pitch: '+10Hz', text: a => `${a.en}!` },
};

const html = readFileSync(join(dir, 'index.html'), 'utf8');
const m = html.match(/const ANIMALS = (\[[\s\S]*?\n\]);/);
if (!m) throw new Error('Không tìm thấy ANIMALS trong animals/index.html');
const ANIMALS = Function(`return (${m[1]})`)();
export const slug = a => basename(a.img).replace(/\.[^.]+$/, '');

const todo = [];
for (const [lang, L] of Object.entries(LANGS)) {
  mkdirSync(join(OUT, lang), { recursive: true });
  for (const a of ANIMALS) {
    const file = join(OUT, lang, slug(a) + '.mp3');
    if (force || !existsSync(file)) todo.push([file, L, L.text(a)]);
  }
}
console.log(`${ANIMALS.length} con vật, cần sinh ${todo.length} clip`);

const tmp = join(OUT, '.tmp'); mkdirSync(tmp, { recursive: true });
let done = 0, fail = 0;
async function gen([file, L, text]) {
  const raw = join(tmp, basename(dirname(file)) + '-' + basename(file));
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      await run(EDGE, ['--voice', L.voice, `--rate=${L.rate}`, `--pitch=${L.pitch}`, '--text', text, '--write-media', raw]);
      // mono 24 kHz 48 kbps, cắt lặng đầu/cuối, nâng dải cao cho giọng sáng, chuẩn hoá độ to
      await run('ffmpeg', ['-y', '-loglevel', 'error', '-i', raw, '-af',
        'silenceremove=start_periods=1:start_threshold=-50dB,areverse,silenceremove=start_periods=1:start_threshold=-50dB,areverse,apad=pad_dur=0.08,highshelf=f=3500:g=2,loudnorm=I=-16:TP=-1.5',
        '-ac', '1', '-ar', '24000', '-b:a', '48k', file]);
      unlinkSync(raw);
      if (++done % 25 === 0) console.log(`  ${done}/${todo.length}`);
      return;
    } catch (e) { await new Promise(r => setTimeout(r, [500, 3000, 10000, 20000][attempt])); }
  }
  fail++; console.warn('  lỗi:', file, text);
}
const queue = [...todo];
await Promise.all(Array.from({ length: 2 }, async () => {
  while (queue.length) { await gen(queue.shift()); await new Promise(r => setTimeout(r, 300)); }
}));
rmSync(tmp, { recursive: true, force: true });

// xoá clip của con vật không còn trong danh sách
const keep = new Set(ANIMALS.map(a => slug(a) + '.mp3'));
let bytes = 0, n = 0;
for (const lang of Object.keys(LANGS)) for (const f of readdirSync(join(OUT, lang))) {
  const p = join(OUT, lang, f);
  if (f.endsWith('.mp3') && !keep.has(f)) { unlinkSync(p); continue; }
  bytes += statSync(p).size; n++;
}
console.log(`xong: ${done} mới, ${fail} lỗi; ${n} clip, ${(bytes / 1024).toFixed(0)} KB → animals/voice/`);
