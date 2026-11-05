#!/usr/bin/env node
// Sinh giọng đọc tiếng Việt (giọng nơ-ron) cho Học Đếm Số — cùng cách làm với Thế Giới Nhỏ:
//   node numbers/art/gen-voice.mjs            # chỉ sinh clip còn thiếu
//   node numbers/art/gen-voice.mjs --force    # sinh lại tất cả
//
// Cần edge-tts (giọng Microsoft Neural vi-VN-HoaiMyNeural) và ffmpeg, cài ngoài repo:
//   python3 -m venv /tmp/num-tts && /tmp/num-tts/bin/pip install edge-tts
//   export EDGE_TTS=/tmp/num-tts/bin/edge-tts
//
// Câu đọc lấy thẳng từ đoạn VOICE-BEGIN … VOICE-END trong numbers/index.html (bảng VOICE_LINES),
// nên sửa câu ở đó rồi chạy lại script này. Kết quả: numbers/voice/<khoá>.mp3
import { readFileSync, existsSync, mkdirSync, readdirSync, unlinkSync, statSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const run = promisify(execFile);
const dir = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(dir, 'voice');
const EDGE = process.env.EDGE_TTS || 'edge-tts';
const force = process.argv.includes('--force');
// giọng vui tươi cho trẻ nhỏ: chậm hơn một chút, cao giọng
const V = { voice: 'vi-VN-HoaiMyNeural', rate: '-5%', pitch: '+25Hz' };

const html = readFileSync(join(dir, 'index.html'), 'utf8');
const m = html.match(/\/\/ VOICE-BEGIN[^\n]*\n([\s\S]*?)\/\/ VOICE-END/);
if (!m) throw new Error('Không tìm thấy đoạn VOICE-BEGIN … VOICE-END trong numbers/index.html');
const LINES = Function(m[1] + '\nreturn VOICE_LINES;')();

mkdirSync(OUT, { recursive: true });
const keep = new Set(Object.keys(LINES).map((k) => k + '.mp3'));
const todo = Object.entries(LINES).filter(([k]) => force || !existsSync(join(OUT, k + '.mp3')));
console.log(`${keep.size} câu, cần sinh ${todo.length}`);

const tmp = join(OUT, '.tmp'); mkdirSync(tmp, { recursive: true });
let done = 0, fail = 0;
for (const [k, text] of todo) {
  const raw = join(tmp, k + '.mp3'), file = join(OUT, k + '.mp3');
  let ok = false;
  for (let attempt = 0; attempt < 10 && !ok; attempt++) {
    try {
      // dịch vụ hay trả về rỗng ngẫu nhiên (nhất là câu ngắn) → thử lại nhiều lần; lần thử lẻ bỏ dấu cuối
      const say = attempt % 2 ? text.replace(/[.!?…]+$/, '') : text;
      await run(EDGE, ['--voice', V.voice, `--rate=${V.rate}`, `--pitch=${V.pitch}`, '--text', say, '--write-media', raw]);
      // mono 24 kHz 48 kbps, cắt lặng đầu/cuối (để đếm "Một! Hai! Ba!" liền nhịp), nâng dải cao cho giọng sáng, chuẩn hoá độ to
      await run('ffmpeg', ['-y', '-loglevel', 'error', '-i', raw, '-af',
        'silenceremove=start_periods=1:start_threshold=-50dB,areverse,silenceremove=start_periods=1:start_threshold=-50dB,areverse,apad=pad_dur=0.12,highshelf=f=3500:g=2,loudnorm=I=-16:TP=-1.5',
        '-ac', '1', '-ar', '24000', '-b:a', '48k', file]);
      unlinkSync(raw); ok = true; done++;
      console.log('  ✓', k + '.mp3', '—', text);
    } catch (e) { await new Promise((r) => setTimeout(r, [500, 1000, 2000, 2000, 3000, 3000, 5000, 5000, 10000, 10000][attempt])); }
  }
  if (!ok) { fail++; console.warn('  lỗi:', k, text); }
  await new Promise((r) => setTimeout(r, 250));
}
rmSync(tmp, { recursive: true, force: true });

// xoá clip không còn dùng
let bytes = 0, n = 0;
for (const f of readdirSync(OUT)) {
  const p = join(OUT, f);
  if (f.endsWith('.mp3') && !keep.has(f)) { unlinkSync(p); continue; }
  if (f.endsWith('.mp3')) { bytes += statSync(p).size; n++; }
}
console.log(`xong: ${done} mới, ${fail} lỗi; ${n} clip, ${(bytes / 1024).toFixed(0)} KB → numbers/voice/`);
