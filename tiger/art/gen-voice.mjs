#!/usr/bin/env node
// Sinh giọng đọc (tiếng Anh + tiếng Việt) cho trò "Hổ đâu?" bằng giọng nơ-ron — cùng cách làm với Thế Giới Nhỏ:
//   node tiger/art/gen-voice.mjs            # chỉ sinh clip còn thiếu
//   node tiger/art/gen-voice.mjs --force    # sinh lại tất cả
//
// Cần edge-tts (giọng Microsoft Neural) và ffmpeg, cài ngoài repo:
//   python3 -m venv /tmp/tiger-tts && /tmp/tiger-tts/bin/pip install edge-tts
//   export EDGE_TTS=/tmp/tiger-tts/bin/edge-tts
//
// Câu đọc lấy thẳng từ FIND_OTHERS và LINES trong tiger/index.html, nên sửa câu ở đó rồi chạy lại script này.
// Giọng vui tươi cho trẻ nhỏ: tiếng Anh AnaNeural (giọng bé gái), tiếng Việt HoaiMy cao giọng.
// Kết quả: tiger/voice/<en|vi>/ask.mp3, yes.mp3, no-<con vật>.mp3
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

const VOICES = {
  en: { voice: 'en-US-AnaNeural', rate: '-5%', pitch: '+10Hz' },
  vi: { voice: 'vi-VN-HoaiMyNeural', rate: '+0%', pitch: '+30Hz' },
};

const html = readFileSync(join(dir, 'index.html'), 'utf8');
const grab = (re, what) => { const m = html.match(re); if (!m) throw new Error('Không tìm thấy ' + what + ' trong tiger/index.html'); return Function(`return (${m[1]})`)(); };
const FIND_OTHERS = grab(/const FIND_OTHERS = (\[[\s\S]*?\n\]);/, 'FIND_OTHERS');
const LINES = grab(/const LINES = (\{[\s\S]*?\n\});/, 'LINES');

const todo = [], keep = {};
for (const [lang, V] of Object.entries(VOICES)) {
  const L = LINES[lang], items = [['ask', L.ask], ['yes', L.yes], ...FIND_OTHERS.map(o => ['no-' + o[0], L.no(o)])];
  mkdirSync(join(OUT, lang), { recursive: true });
  keep[lang] = new Set(items.map(([k]) => k + '.mp3'));
  for (const [k, text] of items) {
    const file = join(OUT, lang, k + '.mp3');
    if (force || !existsSync(file)) todo.push([file, V, text]);
  }
}
console.log(`cần sinh ${todo.length} clip`);

const tmp = join(OUT, '.tmp'); mkdirSync(tmp, { recursive: true });
let done = 0, fail = 0;
for (const [file, V, text] of todo) {
  const raw = join(tmp, basename(dirname(file)) + '-' + basename(file));
  let ok = false;
  for (let attempt = 0; attempt < 4 && !ok; attempt++) {
    try {
      await run(EDGE, ['--voice', V.voice, `--rate=${V.rate}`, `--pitch=${V.pitch}`, '--text', text, '--write-media', raw]);
      // mono 24 kHz 48 kbps, cắt lặng đầu/cuối, nâng dải cao cho giọng sáng, chuẩn hoá độ to
      await run('ffmpeg', ['-y', '-loglevel', 'error', '-i', raw, '-af',
        'silenceremove=start_periods=1:start_threshold=-50dB,areverse,silenceremove=start_periods=1:start_threshold=-50dB,areverse,apad=pad_dur=0.08,highshelf=f=3500:g=2,loudnorm=I=-16:TP=-1.5',
        '-ac', '1', '-ar', '24000', '-b:a', '48k', file]);
      unlinkSync(raw); ok = true; done++;
      console.log('  ✓', basename(dirname(file)) + '/' + basename(file), '—', text);
    } catch (e) { await new Promise(r => setTimeout(r, [500, 3000, 10000, 20000][attempt])); }
  }
  if (!ok) { fail++; console.warn('  lỗi:', file, text); }
  await new Promise(r => setTimeout(r, 250));
}
rmSync(tmp, { recursive: true, force: true });

// xoá clip không còn dùng
let bytes = 0, n = 0;
for (const lang of Object.keys(VOICES)) for (const f of readdirSync(join(OUT, lang))) {
  const p = join(OUT, lang, f);
  if (f.endsWith('.mp3') && !keep[lang].has(f)) { unlinkSync(p); continue; }
  bytes += statSync(p).size; n++;
}
console.log(`xong: ${done} mới, ${fail} lỗi; ${n} clip, ${(bytes / 1024).toFixed(0)} KB → tiger/voice/`);
