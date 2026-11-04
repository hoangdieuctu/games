#!/usr/bin/env node
// Sinh giọng đọc tiếng Việt (giọng nơ-ron) cho MỌI câu thú cưng nói trong game:
//   npx -y node@22 little-world/art/gen-voice.mjs            # chỉ sinh câu còn thiếu
//   npx -y node@22 little-world/art/gen-voice.mjs --list     # in danh sách câu, không gọi TTS
//   npx -y node@22 little-world/art/gen-voice.mjs --force    # sinh lại tất cả
//
// Cần edge-tts (giọng Microsoft Neural vi-VN-HoaiMyNeural) và ffmpeg, cài ngoài repo:
//   python3 -m venv /tmp/lw-tts && /tmp/lw-tts/bin/pip install edge-tts
//   export EDGE_TTS=/tmp/lw-tts/bin/edge-tts
//
// Câu được tách thành từng câu đơn (theo . ! ?) — lúc chạy, Audio.say() tách giống hệt rồi phát
// các đoạn nối nhau. Nhờ vậy câu ghép ("Đó là X. Mình cần Y cơ!") không bùng nổ tổ hợp.
// Mọi mẫu câu dưới đây phải khớp với chuỗi trong src/ — sửa lời thoại thì sửa cả ở đây rồi chạy lại.
// Câu nào thiếu clip sẽ tự rơi về Speech Synthesis của máy (và in cảnh báo [voice] trong console).
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, unlinkSync, statSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { stripTypeScriptTypes } from 'node:module';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { createHash } from 'node:crypto';

const run = promisify(execFile);
const dir = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(dir, 'public/assets/voice');
const VOICE = process.env.LW_VOICE || 'vi-VN-HoaiMyNeural';
const RATE = '-8%', PITCH = '+12Hz';     // chậm hơn một chút, cao hơn một chút cho trẻ nhỏ
const EDGE = process.env.EDGE_TTS || 'edge-tts';
const args = new Set(process.argv.slice(2));

// ── phải giống hệt splitSpeech / speechKey trong src/services/Audio.ts ──
export const splitSpeech = (t) => t.split(/(?<=[.!?…])\s+/).map((s) => s.trim()).filter(Boolean);
export const speechKey = (s) => s.normalize('NFC').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim();

async function loadTs(rel) {
  const code = stripTypeScriptTypes(readFileSync(join(dir, 'src', rel), 'utf8'), { mode: 'strip' });
  return import('data:text/javascript;base64,' + Buffer.from(code).toString('base64'));
}
const constFrom = (rel, name) => {
  // hằng số khai báo trong file game (file đó phụ thuộc Phaser nên không import được)
  const src = readFileSync(join(dir, 'src', rel), 'utf8');
  const m = src.match(new RegExp(`const ${name}[^=]*=\\s*([\\[{][\\s\\S]*?[\\]}]);\\n`));
  if (!m) throw new Error(`Không tìm thấy ${name} trong ${rel}`);
  return Function(`return (${m[1]})`)();
};

const C = await loadTs('data/Content.ts');
const PIC = await loadTs('data/Pictures.ts');
const M = JSON.parse(readFileSync(join(dir, 'public/assets/asset-manifest.json'), 'utf8'));
const P = M.data.play, PETS = M.data.pets, REGIONS = M.data.world.regions;
const NUM = constFrom('games/CountCollect.ts', 'NUM');
const SORT_NAMES = constFrom('games/Sort.ts', 'SORT_NAMES');
const CHALLENGES = constFrom('games/Builder.ts', 'CHALLENGES');
const lc = (s) => s.toLowerCase();
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

const lines = [];
const add = (...t) => lines.push(...t);

// ── chung ──
for (const k of Object.keys(C.PET_LINES)) add(...C.PET_LINES[k]);
for (const a of C.ACTIVITIES) add(a.desc);
// đảo
add('Chào bé!', 'Mình là bạn đồng hành.', 'Đây là đảo của chúng mình!', 'Mở Bản đồ để chơi trò chơi, nhận sao và đồ xây đảo nhé!',
  'Mình hết hạt giống rồi. Chơi ở Đảo Động Vật để nhận thêm nhé!', 'Gieo hạt rồi! Chờ một chút, hoa sẽ nở nhé.',
  `Thu hoạch được ${C.PLOT_HARVEST.flower} bông hoa và ${C.PLOT_HARVEST.seed} hạt giống!`,
  'Chọn đồ trong túi rồi chạm lên đảo để đặt nhé!', 'Túi đang trống. Bấm "Cửa hàng" để đổi đồ mới nhé!',
  'Mầm non đang lớn!', 'Sắp nở rồi!', 'Chào bạn!', 'Cùng chơi nhé!', 'Từ giờ mình đi cùng bạn nhé!',
  'Bé muốn mặc gì hôm nay? Chạm các nút để đổi nhé!');
add('Hoa sẽ nở sớm thôi.', 'Chờ thêm chút xíu nhé.');
for (const id of Object.keys(PETS)) add(`Mình là ${PETS[id].name}.`);
// bản đồ
for (const r of REGIONS) {
  add(`Vùng ${r.name} đã mở!`, 'Mình vào chơi nhé!');
  add(`${r.name} chưa mở.`);
}

for (let n = 1; n <= Math.max(...Object.values(C.REGION_STARS)); n++) add(`Cần thêm ${n} ngôi sao nữa nhé!`);

// ── Tìm bạn thú / Nhà của thú ──
for (const a of P.animals) {
  add(`Con ${lc(a.name)} đâu rồi?`, `Con nào kêu "${a.sound}"?`, `Đúng rồi!`, `Con ${lc(a.name)} kêu ${a.sound}!`,
    `Đây là con ${lc(a.name)}.`, `Tìm con ${lc(a.name)} nhé!`, `${a.name} sống ở đâu nhỉ?`, 'Kéo bạn ấy về nhà nhé.', a.name);
  for (const h of P.habitats) add(`${a.name} sống ở ${lc(h.name)}.`, `${a.name} không sống ở ${lc(h.name)} đâu.`, 'Thử nơi khác nhé!');
}
// ── Lật thẻ, Ghép hình ──
add('Lật hai thẻ.', 'Nếu giống nhau là tìm được một cặp!', 'Kéo từng mảnh vào cái bóng giống nó nhé!');
for (const s of P.shapes) add(s.name, `Mảnh này là ${lc(s.name)}.`, 'Tìm cái bóng giống nó nhé!');
// ── Đếm và hái ──
for (let n = 0; n < NUM.length; n++) add(NUM[n]);
for (const it of P.items) {
  add(`Hái ${it.name} bỏ vào giỏ nhé!`, `Đó là ${it.name}.`, `Mình cần ${it.name} cơ!`);
}
for (let n = 1; n <= 10; n++) add(`Cần đủ ${NUM[n]}.`, `Đủ ${NUM[n]} rồi!`);
for (let a = 1; a <= 5; a++) for (let b = 1; b <= 4; b++) add(`${NUM[a]} thêm ${NUM[b]} là mấy?`, `${NUM[a]} thêm ${NUM[b]} là ${NUM[a + b]}!`);
for (let n = 0; n <= 10; n++) {
  add(`Trong giỏ mới có ${NUM[n]}.`, `Cần ${NUM[n]} cơ, hái thêm nhé!`, `Trong giỏ có ${NUM[n]} rồi, nhiều quá!`, 'Chạm vào quả trong giỏ để bỏ bớt nhé.');
  add(`Bên này có ${NUM[n]}.`, `Bên kia có ${NUM[n]}.`);
}
add('Mình cùng đếm nhé!', 'Bên này nhiều hơn!', 'Bên này ít hơn!');
add('Bên nào nhiều hơn?', 'Bên nào ít hơn?', 'Mình cùng đếm tất cả các quả nhé!');
// ── Tìm quy luật ──
add('Dãy hình lặp lại theo quy luật.', 'Tìm các hình còn thiếu nhé!', 'Hình nào còn thiếu nhỉ?', 'Chưa đúng rồi.', 'Nhìn kỹ dãy hình lặp lại nhé!', 'Đúng quy luật rồi!');
const things = [...P.items.map((i) => i.name), ...P.shapes.map((s) => lc(s.name)), ...P.animals.slice(0, 8).map((a) => 'bạn ' + lc(a.name))];
for (let u = 1; u <= 4; u++) add(`Nhìn ô cách ${u} ô phía trước xem.`);
for (const t of things) add(`Đó là ${t}!`);
// ── Bé xây dựng ──
for (const c of CHALLENGES) add(c.say);
add('Đặt thêm vài khối nữa rồi bấm "Xong rồi" nhé!', 'Oa, tháp cao chạm tới cờ rồi!', 'Ngôi nhà đẹp quá!', 'Có cả mái nữa!');
// ── Bé tô màu ──
add('Nhìn tranh mẫu ở góc, chọn bút đúng màu rồi chạm vào từng ô để tô nhé!', 'Chọn một cây bút màu, rồi chạm vào bức tranh để tô.',
  'Bé thích màu nào cũng được!', 'Giống hệt tranh mẫu luôn!', 'Bé tô đẹp quá!', 'Bức tranh đẹp quá!', 'Bé là hoạ sĩ nhí!');
for (const c of PIC.CRAYONS) add('Màu ' + c.name, `Ô này trong tranh mẫu không phải màu ${c.name} đâu.`, `Chọn bút ${c.name} nhé!`);
for (const pic of PIC.PICTURES) for (const r of pic.regions) {
  const w = PIC.crayon(r.c).name;
  add(`Tô ${r.name} màu ${w} nhé!`, `Trong tranh mẫu, ${r.name} màu ${w}.`);
}
// ── Chăm bạn thú ──
add('Kéo bọt biển chà lên các vết bùn nhé!', 'Kéo lược chải lên chỗ lông rối nhé!', 'Bạn ấy cần gì nhỉ?', 'Kéo đồ vào bạn ấy nhé!', 'Nhìn bong bóng xem bạn ấy cần gì nhé!');
for (const c of P.care) {
  add(c.say, c.done, `Bạn ấy cần ${c.tname}.`, `Không phải ${c.tname} đâu.`, `Bạn ấy cần ${c.tname} cơ!`);
}
// ── Phân loại rác, Biển sạch ──
add('Chạm vào rác để nhặt lên thuyền.', 'Các bạn sinh vật biển thì để yên nhé!', 'Rác tái chế bỏ thùng xanh dương, rác hữu cơ bỏ thùng xanh lá nhé!',
  'Biển sạch rồi!', 'Các bạn sinh vật biển cảm ơn bạn!', 'Hãy nhặt rác thôi nhé.');
for (const [k, n] of Object.entries(SORT_NAMES)) {
  add(n);
  if (k.startsWith('trash-')) add(`${cap(n)} tái chế được, bỏ thùng xanh dương nhé!`, `${cap(n)} là rác hữu cơ, bỏ thùng xanh lá nhé!`);
  if (k.startsWith('sea-') || k.startsWith('animal-')) add(`Mình là ${n}, mình sống ở biển!`);
}

// ── gom câu đơn, khử trùng ──
const units = new Map();      // key → câu gốc
for (const l of lines) for (const s of splitSpeech(l)) { const k = speechKey(s); if (k && !units.has(k)) units.set(k, s); }
if (args.has('--list')) { for (const s of units.values()) console.log(s); console.error(`${units.size} câu`); process.exit(0); }

mkdirSync(OUT, { recursive: true });
const fileOf = (k) => createHash('sha1').update(VOICE + '|' + RATE + '|' + PITCH + '|' + k).digest('hex').slice(0, 12) + '.mp3';
const index = {};
for (const k of units.keys()) index[k] = fileOf(k);
const todo = [...units].filter(([k]) => args.has('--force') || !existsSync(join(OUT, index[k])));
console.log(`${units.size} câu, cần sinh ${todo.length}`);

const tmp = join(OUT, '.tmp'); mkdirSync(tmp, { recursive: true });
let done = 0, fail = 0;
async function gen([k, text]) {
  const raw = join(tmp, index[k]);
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      // dịch vụ đôi khi trả về rỗng với câu có dấu ở cuối → lần thử lẻ bỏ dấu cuối
      const say = attempt % 2 ? text.replace(/[.!?…]+$/, '') : text;
      await run(EDGE, ['--voice', VOICE, `--rate=${RATE}`, `--pitch=${PITCH}`, '--text', say, '--write-media', raw]);
      // mono 24 kHz 40 kbps, cắt lặng đầu câu, thêm 60 ms đệm cuối
      await run('ffmpeg', ['-y', '-loglevel', 'error', '-i', raw, '-af', 'silenceremove=start_periods=1:start_threshold=-50dB,apad=pad_dur=0.06,loudnorm=I=-16:TP=-1.5',
        '-ac', '1', '-ar', '24000', '-b:a', '40k', join(OUT, index[k])]);
      unlinkSync(raw);
      if (++done % 50 === 0) console.log(`  ${done}/${todo.length}`);
      return;
    } catch (e) { await new Promise((r) => setTimeout(r, [300, 3000, 3000, 20000, 20000][attempt])); }
  }
  fail++; delete index[k]; console.warn('  lỗi:', text);
}
const queue = [...todo];
// dịch vụ TTS chặn nếu gọi dồn dập → ít luồng, nghỉ giữa các câu
const JOBS = +(process.env.LW_TTS_JOBS || 2);
await Promise.all(Array.from({ length: JOBS }, async () => {
  while (queue.length) { await gen(queue.shift()); await new Promise((r) => setTimeout(r, 300)); }
}));
rmSync(tmp, { recursive: true, force: true });

// xoá clip cũ không còn dùng
const used = new Set(Object.values(index));
// (clip lỗi đã bị bỏ khỏi index → câu đó dùng giọng máy; chạy lại script để sinh nốt)
for (const f of readdirSync(OUT)) if (f.endsWith('.mp3') && !used.has(f)) unlinkSync(join(OUT, f));
writeFileSync(join(OUT, 'index.json'), JSON.stringify({ voice: VOICE, clips: index }));
const bytes = readdirSync(OUT).filter((f) => f.endsWith('.mp3')).reduce((s, f) => s + statSync(join(OUT, f)).size, 0);
console.log(`xong: ${done} mới, ${fail} lỗi; ${used.size} clip, ${(bytes / 1048576).toFixed(1)} MB → public/assets/voice/`);
