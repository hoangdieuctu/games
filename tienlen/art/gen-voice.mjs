#!/usr/bin/env node
// Sinh lời hô (giọng nơ-ron tiếng Việt) cho Tiến Lên Miền Nam — cùng cách làm với Thế Giới Nhỏ:
//   node tienlen/art/gen-voice.mjs            # chỉ sinh clip còn thiếu
//   node tienlen/art/gen-voice.mjs --force    # sinh lại tất cả
//
// Cần edge-tts (giọng Microsoft Neural) và ffmpeg, cài ngoài repo:
//   python3 -m venv /tmp/tl-tts && /tmp/tl-tts/bin/pip install edge-tts
//   export EDGE_TTS=/tmp/tl-tts/bin/edge-tts
//
// Câu hô lấy từ đoạn VOICE-BEGIN … VOICE-END trong tienlen/index.html (bảng VOICE_LINES).
// Mỗi ghế một giọng vui nhộn riêng → tienlen/voice/<ghế>/<loại>-<i>.mp3
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

// ghế 0 Hổ, 1 Cáo, 2 Gấu Trúc, 3 Ếch — tiếng Việt chỉ có 2 giọng nơ-ron nên đổi cao độ / tốc độ cho khác nhau
const SEATS = [
  { voice: 'vi-VN-NamMinhNeural', rate: '+8%', pitch: '+10Hz' },   // Hổ: anh trai sôi nổi
  { voice: 'vi-VN-HoaiMyNeural', rate: '+10%', pitch: '+25Hz' },   // Cáo: chị lanh lợi
  { voice: 'vi-VN-NamMinhNeural', rate: '-2%', pitch: '+35Hz' },   // Gấu Trúc: cậu bé tròn trịa
  { voice: 'vi-VN-HoaiMyNeural', rate: '+18%', pitch: '+50Hz' },   // Ếch: bé nhí nhảnh
];

const html = readFileSync(join(dir, 'index.html'), 'utf8');
const m = html.match(/\/\/ VOICE-BEGIN[^\n]*\n([\s\S]*?)\/\/ VOICE-END/);
if (!m) throw new Error('Không tìm thấy đoạn VOICE-BEGIN … VOICE-END trong tienlen/index.html');
const LINES = Function(m[1] + '\nreturn VOICE_LINES;')();

const jobs = [], keep = SEATS.map(() => new Set());
SEATS.forEach((V, s) => {
  mkdirSync(join(OUT, String(s)), { recursive: true });
  for (const [cat, list] of Object.entries(LINES)) list.forEach((text, i) => {
    const name = `${cat}-${i}.mp3`;
    keep[s].add(name);
    const file = join(OUT, String(s), name);
    if (force || !existsSync(file)) jobs.push({ s, V, text, file, name });
  });
});
console.log(`${keep.reduce((a, k) => a + k.size, 0)} clip, cần sinh ${jobs.length}`);

const tmp = join(OUT, '.tmp'); mkdirSync(tmp, { recursive: true });
let done = 0, fail = 0;
async function gen({ s, V, text, file, name }) {
  const raw = join(tmp, `${s}-${name}`);
  for (let attempt = 0; attempt < 10; attempt++) {
    try {
      // dịch vụ hay trả về rỗng ngẫu nhiên (nhất là câu ngắn như "Bỏ!") → thử lại nhiều lần; lần thử lẻ bỏ dấu cuối
      const say = attempt % 2 ? text.replace(/[.!?…]+$/, '') : text;
      await run(EDGE, ['--voice', V.voice, `--rate=${V.rate}`, `--pitch=${V.pitch}`, '--text', say, '--write-media', raw]);
      // mono 24 kHz 48 kbps, cắt lặng đầu/cuối, nâng dải cao cho giọng sáng, chuẩn hoá độ to
      await run('ffmpeg', ['-y', '-loglevel', 'error', '-i', raw, '-af',
        'silenceremove=start_periods=1:start_threshold=-50dB,areverse,silenceremove=start_periods=1:start_threshold=-50dB,areverse,apad=pad_dur=0.06,highshelf=f=3500:g=2,loudnorm=I=-16:TP=-1.5',
        '-ac', '1', '-ar', '24000', '-b:a', '48k', file]);
      unlinkSync(raw); done++;
      console.log(`  ✓ ${s}/${name} — ${text}`);
      return;
    } catch (e) { await new Promise((r) => setTimeout(r, [500, 1000, 2000, 2000, 3000, 3000, 5000, 5000, 10000, 10000][attempt])); }
  }
  fail++; console.warn(`  lỗi: ${s}/${name} ${text}`);
}
const queue = [...jobs];
const JOBS = +(process.env.TL_TTS_JOBS || 3);
await Promise.all(Array.from({ length: JOBS }, async () => {
  while (queue.length) { await gen(queue.shift()); await new Promise((r) => setTimeout(r, 250)); }
}));
rmSync(tmp, { recursive: true, force: true });

// xoá clip không còn dùng
let bytes = 0, n = 0;
SEATS.forEach((_, s) => {
  for (const f of readdirSync(join(OUT, String(s)))) {
    const p = join(OUT, String(s), f);
    if (f.endsWith('.mp3') && !keep[s].has(f)) { unlinkSync(p); continue; }
    if (f.endsWith('.mp3')) { bytes += statSync(p).size; n++; }
  }
});
console.log(`xong: ${done} mới, ${fail} lỗi; ${n} clip, ${(bytes / 1024).toFixed(0)} KB → tienlen/voice/`);
