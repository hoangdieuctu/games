#!/usr/bin/env node
// Sinh lời hô (giọng nơ-ron tiếng Việt) cho các khoảnh khắc trong Cờ Tỷ Phú — cùng cách làm với Thế Giới Nhỏ:
//   node tycoon/art/gen-voice.mjs            # chỉ sinh clip còn thiếu
//   node tycoon/art/gen-voice.mjs --force    # sinh lại tất cả
//
// Cần edge-tts (giọng Microsoft Neural vi-VN) và ffmpeg, cài ngoài repo:
//   python3 -m venv /tmp/typhu-tts && /tmp/typhu-tts/bin/pip install edge-tts
//   export EDGE_TTS=/tmp/typhu-tts/bin/edge-tts
//
// Mỗi khoảnh khắc có vài câu (xen giọng nữ HoaiMy và giọng nam NamMinh), game chọn ngẫu nhiên một câu.
// Câu ngắn, chỉ nói nội dung, không thêm từ cảm thán; cảm xúc thể hiện bằng tốc độ và cao độ giọng.
// Kết quả: tycoon/voice/<khoảnh khắc>-<số>.mp3 và tycoon/voice/index.json ({ khoảnh khắc: [tệp...] }).
import { writeFileSync, existsSync, mkdirSync, readdirSync, unlinkSync, statSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const run = promisify(execFile);
const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'voice');
const EDGE = process.env.EDGE_TTS || 'edge-tts';
const force = process.argv.includes('--force');

// ngữ điệu: [tốc độ, cao độ] — câu ngắn, chỉ nói nội dung; cảm xúc nằm ở giọng:
// vui thì nhanh và cao, bất ngờ thì cao vút, xui thì chậm và trầm hơn một chút
const HYPE = ['+20%', '+40Hz'], HAPPY = ['+12%', '+28Hz'], SHOCK = ['+15%', '+50Hz'], DOWN = ['-8%', '+5Hz'];
const F = 'vi-VN-HoaiMyNeural', M = 'vi-VN-NamMinhNeural';
const v = (voice, tune, text) => ({ voice, rate: tune[0], pitch: tune[1], text });

export const LINES = {
  double:   [v(F, HYPE, 'Đổ đôi!'), v(M, HYPE, 'Đổ đôi rồi!')],
  triple:   [v(F, SHOCK, 'Ba đôi liền!'), v(M, SHOCK, 'Ba đôi, ra đảo!')],
  island:   [v(F, DOWN, 'Ra Côn Đảo!'), v(M, DOWN, 'Vào đảo rồi!')],
  free:     [v(F, HYPE, 'Thoát đảo!'), v(M, HYPE, 'Ra đảo rồi!')],
  bankrupt: [v(M, DOWN, 'Phá sản rồi!'), v(F, DOWN, 'Phá sản!')],
  festival: [v(F, HYPE, 'Lễ hội!'), v(M, HYPE, 'Mở lễ hội!')],
  festJump: [v(M, HYPE, 'Tới Đại Nhạc Hội!')],
  landmark: [v(F, HYPE, 'Xây Biểu tượng!'), v(M, HYPE, 'Biểu tượng mới!')],
  tour:     [v(F, HAPPY, 'Mua điểm du lịch!'), v(M, HAPPY, 'Thêm điểm du lịch!')],
  takeover: [v(M, SHOCK, 'Mua lại!'), v(F, SHOCK, 'Bị mua lại!')],
  hack:     [v(M, SHOCK, 'Bị hack!')],
  bigRent:  [v(F, SHOCK, 'Phí cao quá!'), v(M, SHOCK, 'Mất nhiều tiền!')],
  debt:     [v(F, DOWN, 'Thiếu tiền!'), v(M, DOWN, 'Hết tiền rồi!')],
  pot:      [v(F, HYPE, 'Trúng Quỹ Thuế!'), v(M, HYPE, 'Ăn trọn Quỹ Thuế!')],
  casinoWin:  [v(M, HYPE, 'Thắng rồi!'), v(F, HYPE, 'Thắng!')],
  casinoLose: [v(F, DOWN, 'Thua rồi!'), v(M, DOWN, 'Thua!')],
  rob:      [v(M, SHOCK, 'Bị cướp!')],
  destroy:  [v(M, SHOCK, 'Nhà bị phá!')],
  plague:   [v(F, SHOCK, 'Dịch bệnh!')],
  blackout: [v(M, SHOCK, 'Mất điện!')],
  forceSell:[v(F, SHOCK, 'Bị ép bán!')],
  swap:     [v(M, HAPPY, 'Đổi thành phố!')],
  lift:     [v(F, HAPPY, 'Nhấc ô đất!')],
  luck:     [v(F, HYPE, 'Gấp đôi tiền!')],
  event:    [v(M, HAPPY, 'Sự kiện mới!')],
  won:      [v(M, HYPE, 'Chiến thắng!'), v(F, HYPE, 'Vô địch!')],
};

mkdirSync(OUT, { recursive: true });
const tmp = join(OUT, '.tmp'); mkdirSync(tmp, { recursive: true });
const index = {}, todo = [];
for (const [k, list] of Object.entries(LINES)) {
  index[k] = list.map((_, n) => `${k}-${n + 1}.mp3`);
  list.forEach((l, n) => { if (force || !existsSync(join(OUT, index[k][n]))) todo.push([index[k][n], l]); });
}
console.log(`${todo.length} clip cần sinh`);
let fail = 0;
for (const [file, l] of todo) {
  const raw = join(tmp, file);
  let ok = false;
  for (let attempt = 0; attempt < 4 && !ok; attempt++) {
    try {
      await run(EDGE, ['--voice', l.voice, `--rate=${l.rate}`, `--pitch=${l.pitch}`, '--text', l.text, '--write-media', raw]);
      // mono 24 kHz 48 kbps, cắt lặng đầu/cuối, nâng dải cao cho giọng sáng, chuẩn hoá độ to
      await run('ffmpeg', ['-y', '-loglevel', 'error', '-i', raw, '-af',
        'silenceremove=start_periods=1:start_threshold=-50dB,areverse,silenceremove=start_periods=1:start_threshold=-50dB,areverse,apad=pad_dur=0.05,highshelf=f=3500:g=3,loudnorm=I=-15:TP=-1.5',
        '-ac', '1', '-ar', '24000', '-b:a', '48k', join(OUT, file)]);
      ok = true; console.log('  ✓', file, '—', l.text);
    } catch (e) { await new Promise(r => setTimeout(r, [500, 3000, 10000, 20000][attempt])); }
  }
  if (!ok) { fail++; console.warn('  lỗi:', file, l.text); }
  await new Promise(r => setTimeout(r, 300));
}
rmSync(tmp, { recursive: true, force: true });
// bỏ khỏi index những clip không có tệp; xoá clip không còn dùng
for (const k of Object.keys(index)) { index[k] = index[k].filter(f => existsSync(join(OUT, f))); if (!index[k].length) delete index[k]; }
const used = new Set(Object.values(index).flat());
for (const f of readdirSync(OUT)) if (f.endsWith('.mp3') && !used.has(f)) unlinkSync(join(OUT, f));
writeFileSync(join(OUT, 'index.json'), JSON.stringify(index));
const bytes = [...used].reduce((s, f) => s + statSync(join(OUT, f)).size, 0);
console.log(`xong: ${used.size} clip, ${fail} lỗi, ${(bytes / 1024).toFixed(0)} KB → tycoon/voice/`);
