#!/usr/bin/env node
// Sinh giọng quản trò (tiếng Việt + tiếng Anh) bằng giọng nơ-ron — cùng cách làm với các game khác trong kho:
//   node werewolf/art/gen-voice.mjs            # chỉ sinh câu còn thiếu
//   node werewolf/art/gen-voice.mjs --force    # sinh lại tất cả
//
// Cần edge-tts (giọng Microsoft Neural) và ffmpeg, cài ngoài repo:
//   python3 -m venv /tmp/ww-tts && /tmp/ww-tts/bin/pip install edge-tts
//   export EDGE_TTS=/tmp/ww-tts/bin/edge-tts
//
// Câu đọc lấy từ NARR trong werewolf/i18n.js (đoạn VOICE-BEGIN … VOICE-END). Kết quả: werewolf/voice/<vi|en>/<khoá>.mp3.
// Thiếu tệp nào thì game tự đọc bằng giọng máy của trình duyệt.
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
const onlyLang = (process.argv.find(a => a.startsWith('--lang=')) || '').slice(7);

// giọng trầm, chậm rãi cho người quản trò kể chuyện
const LANGS = {
  vi: { voice: 'vi-VN-NamMinhNeural', rate: '-6%', pitch: '-4Hz' },
  en: { voice: 'en-GB-RyanNeural', rate: '-8%', pitch: '-6Hz' },
};
const src = readFileSync(join(dir, 'i18n.js'), 'utf8');
const block = src.slice(src.indexOf('// VOICE-BEGIN'), src.indexOf('// VOICE-END'));
const NARR = Function(block + '\nreturn NARR;')();

const todo = [];
for (const [lang, L] of Object.entries(LANGS)) {
  mkdirSync(join(OUT, lang), { recursive: true });
  if (onlyLang && lang !== onlyLang) continue;
  for (const [key, txt] of Object.entries(NARR)) {
    const file = join(OUT, lang, key + '.mp3');
    if (force || !existsSync(file)) todo.push([file, L, txt[lang]]);
  }
}
console.log(`${Object.keys(NARR).length} câu, cần sinh ${todo.length} clip`);

const tmp = join(OUT, '.tmp'); mkdirSync(tmp, { recursive: true });
let done = 0, fail = 0;
async function gen([file, L, text]) {
  const raw = join(tmp, basename(dirname(file)) + '-' + basename(file));
  for (let attempt = 0; attempt < 12; attempt++) {
    try {
      await run(EDGE, ['--voice', L.voice, `--rate=${L.rate}`, `--pitch=${L.pitch}`, '--text', text, '--write-media', raw]);
      // mono 24 kHz 48 kbps, cắt lặng đầu/cuối, chuẩn hoá độ to
      await run('ffmpeg', ['-y', '-loglevel', 'error', '-i', raw, '-af',
        'silenceremove=start_periods=1:start_threshold=-50dB,areverse,silenceremove=start_periods=1:start_threshold=-50dB,areverse,apad=pad_dur=0.1,loudnorm=I=-16:TP=-1.5',
        '-ac', '1', '-ar', '24000', '-b:a', '48k', file]);
      unlinkSync(raw);
      done++;
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

// xoá clip của câu không còn dùng
const keep = new Set(Object.keys(NARR).map(k => k + '.mp3'));
let bytes = 0, n = 0;
for (const lang of Object.keys(LANGS)) for (const f of readdirSync(join(OUT, lang))) {
  const p = join(OUT, lang, f);
  if (f.endsWith('.mp3') && !keep.has(f)) { unlinkSync(p); continue; }
  bytes += statSync(p).size; n++;
}
console.log(`xong: ${done} mới, ${fail} lỗi; ${n} clip, ${(bytes / 1024).toFixed(0)} KB → werewolf/voice/`);
