// ── palette (one per number, 1-indexed) ──
const COLORS = [
  null,           // 0 unused
  '#ff6b6b',      // 1 red
  '#ff9f43',      // 2 orange
  '#ffd32a',      // 3 yellow
  '#26de81',      // 4 green
  '#2bcbba',      // 5 teal
  '#45aaf2',      // 6 blue
  '#a55eea',      // 7 purple
  '#fd9644',      // 8 amber
  '#fc5c65',      // 9 rose
  '#4b7bec',      // 10 indigo
];

// VOICE-BEGIN — art/gen-voice.mjs đọc đúng đoạn này để sinh voice/<khoá>.mp3; sửa câu thì chạy lại script.
const NUM_WORDS = ['không', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín', 'mười'];
const VOICE_LINES = {
  intro: 'Hãy tìm số này nhé!',
  'learn-turn': 'Đến lượt con! Chạm vào ngón tay để đếm nhé!',
};
for (let n = 1; n <= 10; n++) {
  const w = NUM_WORDS[n], W = w.charAt(0).toUpperCase() + w.slice(1);
  VOICE_LINES['count-' + n] = W + '!';                                 // đếm từng chấm / ngón tay
  VOICE_LINES['num-' + n]   = `Số ${w}!`;
  VOICE_LINES['pick-' + n]  = `Bấm vào số ${w} nào!`;
  VOICE_LINES['wrong-' + n] = `Đây là số ${w}. Thử lại nhé!`;
  VOICE_LINES['win-' + n]   = `Giỏi lắm! Con đã tìm được số ${w}!`;
  VOICE_LINES['learn-' + n] = `Cùng đếm đến ${w} nào!`;
  VOICE_LINES['learn-win-' + n] = `Giỏi lắm! Con đã đếm đến ${w}!`;
}
// Tiếng Anh: khoá có tiền tố "en-" (gen-voice dùng giọng tiếng Anh)
const EN_WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];
VOICE_LINES['en-intro'] = 'Find this number!';
VOICE_LINES['en-learn-turn'] = 'Your turn! Tap the fingers to count!';
for (let n = 1; n <= 10; n++) {
  const w = EN_WORDS[n], W = w.charAt(0).toUpperCase() + w.slice(1);
  VOICE_LINES['en-count-' + n]     = W + '!';
  VOICE_LINES['en-num-' + n]       = `Number ${w}!`;
  VOICE_LINES['en-pick-' + n]      = `Tap the number ${w}!`;
  VOICE_LINES['en-wrong-' + n]     = `This is number ${w}. Try again!`;
  VOICE_LINES['en-win-' + n]       = `Great job! You found number ${w}!`;
  VOICE_LINES['en-learn-' + n]     = `Let's count to ${w}!`;
  VOICE_LINES['en-learn-win-' + n] = `Great job! You counted to ${w}!`;
}
// VOICE-END

/* ── Giọng đọc: clip mp3 giọng nơ-ron sinh sẵn (art/gen-voice.mjs → voice/), thiếu clip thì dùng giọng máy ── */
const SILENT_MP3 = 'data:audio/mpeg;base64,SUQzBAAAAAAAIlRTU0UAAAAOAAADTGF2ZjYyLjMuMTAwAAAAAAAAAAAAAAD/84TAAAAAAAAAAAAASW5mbwAAAA8AAAAFAAACoABtbW1tbW1tbW1tbW1tbW1tbW1tkpKSkpKSkpKSkpKSkpKSkpKSkpK2tra2tra2tra2tra2tra2tra2ttvb29vb29vb29vb29vb29vb29vb//////////////////////////8AAAAATGF2YzYyLjExAAAAAAAAAAAAAAAAJARQAAAAAAAAAqC9P8gWAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD/80TEAAAAA0gAAAAATEFNRTMuMTAwVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVMQU1FMy7/80TEUwAAA0gAAAAAMTAwVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVMQU1FMy7/80TEpgAAA0gAAAAAMTAwVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVX/80TErAAAA0gAAAAAVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVX/80TErAAAA0gAAAAAVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVU=';
const Speech = {
  // một thẻ <audio> dùng lại cho mọi câu: iOS chỉ cho phát tự động trên thẻ đã từng phát trong một cú chạm
  el: new Audio(), unlocked: false, token: 0, pending: null,
  synth: 'speechSynthesis' in window, voices: {},

  unlock() {
    if (this.pending) { const f = this.pending; this.pending = null; this.unlocked = true; f(); return; }
    if (this.unlocked) return;
    this.unlocked = true;
    if (this.el.src && !this.el.paused) return;
    this.el.src = SILENT_MP3;
    const p = this.el.play(); if (p && p.catch) p.catch(() => {});
  },
  loadVoice() {
    if (!this.synth) return;
    const all = speechSynthesis.getVoices();
    this.voices = { vi: all.find((v) => /^vi/i.test(v.lang)) || null, en: all.find((v) => /^en/i.test(v.lang)) || null };
  },
  // Phát lần lượt các khoá; onEach(i) gọi khi bắt đầu câu thứ i. replay: chạy lại cả chuỗi nếu trình duyệt chặn tự phát.
  play(keys, { onEach, onEnd, replay, gap = 0 } = {}) {
    this.cancel();
    const my = this.token;
    const step = (i) => {
      if (my !== this.token) return;
      if (i >= keys.length) { if (onEnd) onEnd(); return; }
      if (onEach) onEach(i);
      const key = keys[i], text = VOICE_LINES[key];
      let done = false, fell = false;
      const next = () => { if (done || my !== this.token) return; done = true; if (gap) setTimeout(() => step(i + 1), gap); else step(i + 1); };
      const fallback = () => { if (fell || done || my !== this.token) return; fell = true; this.speak(text, next, key.startsWith('en-') ? 'en' : 'vi'); };
      const el = this.el;
      el.onended = next; el.onerror = fallback;
      el.src = `voice/${key}.mp3`;
      const p = el.play();
      if (p && p.catch) p.catch((e) => {
        if (e && e.name === 'NotAllowedError' && replay) { this.token++; this.pending = replay; return; }
        fallback();
      });
    };
    step(0);
  },
  speak(text, finish, lang = 'vi') {
    if (!this.synth) { setTimeout(finish, 300); return; }
    if (!this.voices[lang]) this.loadVoice();
    const voice = this.voices[lang];
    const u = new SpeechSynthesisUtterance(text);
    u.lang = voice ? voice.lang : (lang === 'en' ? 'en-US' : 'vi-VN');
    if (voice) u.voice = voice;
    u.rate = 0.9; u.pitch = 1.1;
    let fin = false; const once = () => { if (!fin) { fin = true; finish(); } };
    u.onend = u.onerror = once;
    try { speechSynthesis.resume(); } catch (e) {}
    speechSynthesis.speak(u);
    setTimeout(once, 1500 + text.length * 110);
  },
  cancel() {
    this.token++; this.pending = null;
    const el = this.el; el.onended = el.onerror = null;
    try { el.pause(); } catch (e) {}
    if (this.synth) try { speechSynthesis.cancel(); } catch (e) {}
  },
};
if (Speech.synth) { Speech.loadVoice(); speechSynthesis.onvoiceschanged = () => Speech.loadVoice(); }
document.addEventListener('pointerdown', () => Speech.unlock(), { capture: true });

// ── Web Audio for simple tones ──
let audioCtx;
function getAudio() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  return audioCtx;
}
function playTone(freq, dur, type='sine', vol=0.25) {
  try {
    const ac = getAudio();
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.connect(gain); gain.connect(ac.destination);
    osc.type = type; osc.frequency.value = freq;
    gain.gain.setValueAtTime(vol, ac.currentTime);
    gain.gain.exponentialRampToValueAtTime(.0001, ac.currentTime + dur);
    osc.start(); osc.stop(ac.currentTime + dur);
  } catch(e) {}
}
function playCorrect() {
  [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => playTone(f, .18), i * 80));
}
function playWrong() {
  playTone(200, .25, 'sawtooth', .15);
  setTimeout(() => playTone(160, .25, 'sawtooth', .12), 120);
}
function playPop(n) { playTone(440 + n * 45, .12, 'triangle', .2); }

// ── helpers ──
function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
const $ = (id) => document.getElementById(id);
function show(id)  { $(id).classList.remove('hidden'); }
function hide(id)  { $(id).classList.add('hidden'); }
function bump(el, cls) { el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); }

const SCREENS = ['screen-menu', 'screen-show', 'screen-pick', 'screen-learn', 'screen-win'];
function showScreen(id) {
  SCREENS.forEach((s) => (s === id ? show(s) : hide(s)));
  $('btn-menu').classList.toggle('hidden', id === 'screen-menu');
}

// hẹn giờ của ván đang chơi — huỷ hết khi về menu để không nhảy màn bất ngờ
let timers = [];
function later(fn, ms) { timers.push(setTimeout(fn, ms)); }
function clearTimers() { timers.forEach(clearTimeout); timers = []; }

// số ngẫu nhiên 1–10, khác số vừa chơi
function randomNumber(prev) {
  let n;
  do n = Math.floor(Math.random() * 10) + 1; while (n === prev);
  return n;
}

/* ── Ngôn ngữ (Tiếng Việt / English) cho cả hai trò, lưu lại cho lần sau ── */
const LANG_KEY = 'numbers-lang';
const TEXT = {
  vi: { find: 'Tìm Số', learn: 'Tập Đếm', lang: '🇻🇳 Tiếng Việt', win: 'Giỏi lắm!', more: 'Chơi tiếp! 🔄',
        intro: 'Hãy tìm số này nhé!', ready: 'Tôi sẵn sàng! ▶', pick: (n) => `Bấm vào số <strong>${n}</strong> nào!`,
        found: (n) => `Con đã tìm được số ${n}! Cố lên nhé!`,
        watch: 'Nhìn bàn tay và đếm theo nhé!', turn: 'Chạm vào ngón tay để đếm nào! 👆', go: 'Con đếm nào! ▶', again: 'Xem lại 👀',
        counted: (n) => `Con đã đếm đến ${n}!` },
  en: { find: 'Find It', learn: 'Let’s Count', lang: '🇬🇧 English', win: 'Great job!', more: 'Play again! 🔄',
        intro: 'Find this number!', ready: 'I’m ready! ▶', pick: (n) => `Tap the number <strong>${n}</strong>!`,
        found: (n) => `You found number ${n}! Keep it up!`,
        watch: 'Watch the hands and count along!', turn: 'Tap the fingers to count! 👆', go: 'My turn! ▶', again: 'Watch again 👀',
        counted: (n) => `You counted to ${n}!` },
};
let lang = 'vi';
try { if (localStorage.getItem(LANG_KEY) === 'en') lang = 'en'; } catch (e) {}
const V = (key) => (lang === 'en' ? 'en-' + key : key);   // khoá giọng đọc theo ngôn ngữ đang chọn
const T = () => TEXT[lang];

function applyLang() {
  const t = T();
  document.documentElement.lang = lang;
  $('btn-lang').textContent = t.lang;
  $('menu-find').textContent = t.find;
  $('menu-learn').textContent = t.learn;
  $('show-label').textContent = t.intro;
  $('btn-ready').textContent = t.ready;
  $('btn-turn').textContent = t.go;
  $('btn-watch').textContent = t.again;
  $('win-title').textContent = t.win;
  $('btn-again').textContent = t.more;
}
// đổi ngôn ngữ: đang ở giữa ván thì đọc lại câu hướng dẫn bằng ngôn ngữ mới
function toggleLang() {
  lang = lang === 'en' ? 'vi' : 'en';
  try { localStorage.setItem(LANG_KEY, lang); } catch (e) {}
  applyLang();
  if (!$('screen-show').classList.contains('hidden')) announce();
  else if (!$('screen-pick').classList.contains('hidden')) setPickLabel(true);
  else if (!$('screen-learn').classList.contains('hidden')) { if (learn.phase === 'turn') startTurn(); else demo(); }
  else if (!$('screen-win').classList.contains('hidden')) $('win-sub').textContent = (mode === 'learn' ? T().counted : T().found)(targetNumber);
}

let mode = 'find';
let targetNumber = 1;

function goMenu() {
  clearTimers();
  Speech.cancel();
  showScreen('screen-menu');
}

function startMode(m) {
  mode = m;
  if (m === 'learn') startLearn(); else startFind();
}

/* ══════════════════════════════════
   TÌM SỐ
══════════════════════════════════ */
function startFind() {
  clearTimers();
  targetNumber = randomNumber(targetNumber);

  // render target screen
  const disp = $('target-display');
  disp.textContent = targetNumber;
  disp.style.color = COLORS[targetNumber];

  // dots (visual count)
  const dotsRow = $('dots-row');
  dotsRow.innerHTML = '';
  for (let i = 0; i < targetNumber; i++) {
    const d = document.createElement('div');
    d.className = 'dot';
    d.style.background = COLORS[targetNumber];
    d.style.animationDelay = (i * 50) + 'ms';
    dotsRow.appendChild(d);
  }

  showScreen('screen-show');
  announce();
}

// "Hãy tìm số này nhé!" rồi đếm từng chấm "Một! Hai! Ba!" và đọc "Số ba!"
function announce() {
  const dots = [...document.querySelectorAll('#dots-row .dot')];
  dots.forEach(d => d.classList.remove('lit'));
  const keys = [V('intro')];
  for (let i = 1; i <= targetNumber; i++) keys.push(V('count-' + i));
  keys.push(V('num-' + targetNumber));
  Speech.play(keys, {
    replay: announce, gap: 280,
    onEach: (i) => {
      const d = dots[i - 1];
      if (i >= 1 && d) bump(d, 'lit');
      if (i === keys.length - 1) bump($('target-display'), 'say');
    },
  });
}

function goToPick() {
  // build shuffled grid
  const grid = $('number-grid');
  grid.innerHTML = '';
  const nums = shuffle([1,2,3,4,5,6,7,8,9,10]);
  nums.forEach(n => {
    const btn = document.createElement('button');
    btn.className = 'num-btn';
    btn.textContent = n;
    btn.style.background = COLORS[n];
    btn.setAttribute('aria-label', 'Số ' + n);
    btn.onclick = () => pickNumber(n, btn);
    grid.appendChild(btn);
  });

  showScreen('screen-pick');
  setPickLabel(true);
}

function setPickLabel(speak) {
  $('pick-label').innerHTML = `${T().pick(targetNumber)} <span class="replay" aria-label="Nghe lại">🔊</span>`;
  if (speak) Speech.play([V('pick-' + targetNumber)]);
}

function pickNumber(n, btn) {
  if (n === targetNumber) {
    btn.classList.add('correct');
    Speech.cancel();
    playCorrect();
    later(() => showWin(T().found(targetNumber), V('win-' + targetNumber)), 600);
  } else {
    btn.classList.add('wrong');
    playWrong();
    later(() => Speech.play([V('wrong-' + n)]), 250);
  }
}

/* ══════════════════════════════════
   TẬP ĐẾM — bàn tay giơ từng ngón theo nhịp đếm, rồi bé chạm để tự đếm
══════════════════════════════════ */
// Hai bàn tay nhìn từ mu bàn tay (như bé nhìn tay mình): tay trái bên trái, ngón cái quay vào giữa.
// Đếm 1–5 ở tay trái, 6–10 ở tay phải; mỗi tay theo thứ tự trỏ, giữa, áp út, út, cái.
const HAND_W = 230;
const PALM_TOP = 130;
const FINGERS = [               // toạ độ cho tay trái; tay phải lật gương
  { x: 145, len: 84 },          // trỏ
  { x: 115, len: 92 },          // giữa
  { x: 85,  len: 82 },          // áp út
  { x: 55,  len: 62 },          // út
];
const THUMB = { px: 152, py: 215, len: 85, up: 38, down: -28, badge: [210, 140], hint: [158, 182] };
const SLEEVES = ['#45aaf2', '#a55eea'];

function handSVG(h) {
  const mirror = h === 1, X = (x) => (mirror ? HAND_W - x : x), s = mirror ? -1 : 1;
  let back = '', front = '';
  const badge = (n, x, y) =>
    `<g class="badge" data-n="${n}"><circle cx="${x}" cy="${y}" r="16" fill="${COLORS[n]}" stroke="#fff" stroke-width="3"/>` +
    `<text x="${x}" y="${y + 7}" text-anchor="middle">${n}</text></g>`;
  const hint = (n, x, y) => `<circle class="hint" data-n="${n}" cx="${x}" cy="${y}" r="18" stroke="${COLORS[n]}"/>`;

  FINGERS.forEach((f, i) => {
    const n = h * 5 + i + 1, cx = X(f.x), top = PALM_TOP - f.len;
    back += `<g class="finger" data-n="${n}" style="--drop:${f.len - 8}px">` +
      `<rect class="skin" x="${cx - 13}" y="${top}" width="26" height="${f.len + 30}" rx="13"/>` +
      `<rect class="nail" x="${cx - 8}" y="${top + 5}" width="16" height="15" rx="7"/></g>`;
    front += hint(n, cx, PALM_TOP + 5) + badge(n, cx, top - 20);
  });

  const n = h * 5 + 5, px = X(THUMB.px), py = THUMB.py, L = THUMB.len;
  back += `<g class="thumb" data-n="${n}" style="transform-origin:${px}px ${py}px;--up:${THUMB.up * s}deg;--down:${THUMB.down * s}deg">` +
    `<rect class="skin" x="${px - 15}" y="${py - L}" width="30" height="${L + 15}" rx="15"/>` +
    `<rect class="nail" x="${px - 9}" y="${py - L + 5}" width="18" height="16" rx="8"/></g>`;
  front += hint(n, X(THUMB.hint[0]), THUMB.hint[1]) + badge(n, X(THUMB.badge[0]), THUMB.badge[1]);

  const palm = `<rect class="sleeve" x="${mirror ? X(142) : 58}" y="238" width="84" height="62" rx="14" fill="${SLEEVES[h]}"/>` +
    `<rect class="skin" x="${mirror ? X(160) : 40}" y="${PALM_TOP}" width="120" height="120" rx="40"/>`;
  return `<svg class="hand" viewBox="0 -10 ${HAND_W} 310" aria-hidden="true">${back}${palm}${front}</svg>`;
}

const learn = { phase: 'idle', count: 0 };
function setFingers(k) {
  document.querySelectorAll('#hands .finger, #hands .thumb').forEach((g) => g.classList.toggle('up', +g.dataset.n <= k));
  document.querySelectorAll('#hands .badge').forEach((g) => g.classList.toggle('on', +g.dataset.n <= k));
}
function setHint(n) {
  document.querySelectorAll('#hands .hint').forEach((c) => c.classList.toggle('on', +c.dataset.n === n));
}

function startLearn() {
  clearTimers();
  targetNumber = randomNumber(targetNumber);
  const num = $('learn-number');
  num.textContent = targetNumber;
  num.style.color = COLORS[targetNumber];
  bump(num, 'big-number');
  $('hands').innerHTML = handSVG(0) + handSVG(1);
  showScreen('screen-learn');
  demo();
}

// Bàn tay mẫu: "Cùng đếm đến ba nào!" → "Một! Hai! Ba!" (giơ từng ngón) → "Số ba!" → đến lượt bé
function demo() {
  clearTimers();
  learn.phase = 'demo';
  setFingers(0); setHint(0);
  $('learn-label').textContent = T().watch;
  show('btn-turn'); hide('btn-watch');
  const keys = [V('learn-' + targetNumber)];
  for (let i = 1; i <= targetNumber; i++) keys.push(V('count-' + i));
  keys.push(V('num-' + targetNumber));
  Speech.play(keys, {
    replay: demo, gap: 380,
    onEach: (i) => {
      if (i >= 1 && i <= targetNumber) { setFingers(i); playPop(i); }
      if (i === keys.length - 1) bump($('learn-number'), 'say');
    },
    onEnd: () => later(startTurn, 900),
  });
}

function startTurn() {
  clearTimers();
  learn.phase = 'turn';
  learn.count = 0;
  setFingers(0); setHint(1);
  $('learn-label').textContent = T().turn;
  hide('btn-turn'); show('btn-watch');
  Speech.play([V('learn-turn')]);
}

function tapHands() {
  if (learn.phase !== 'turn') return;
  const k = ++learn.count;
  setFingers(k); playPop(k);
  if (k < targetNumber) {
    setHint(k + 1);
    Speech.play([V('count-' + k)]);
    return;
  }
  learn.phase = 'done';
  setHint(0);
  bump($('learn-number'), 'say');
  Speech.play([V('count-' + k)], {
    onEnd: () => { playCorrect(); later(() => showWin(T().counted(targetNumber), V('learn-win-' + targetNumber)), 500); },
  });
}

/* ══════════════════════════════════
   THẮNG
══════════════════════════════════ */
function showWin(sub, voiceKey) {
  const emojis = ['🎉','🌟','🥳','🦄','🎊','🌈','⭐','🐸','🎈'];
  $('win-emoji').textContent = emojis[Math.floor(Math.random() * emojis.length)];
  $('win-sub').textContent = sub;

  launchConfetti();
  showScreen('screen-win');
  Speech.play([voiceKey]);
}

function launchConfetti() {
  const wrap = $('confetti');
  wrap.innerHTML = '';
  const confettiColors = ['#ff6b6b','#ffd32a','#26de81','#45aaf2','#a55eea','#ff9f43'];
  for (let i = 0; i < 60; i++) {
    const c = document.createElement('div');
    c.className = 'confetto';
    c.style.left = Math.random() * 100 + 'vw';
    c.style.background = confettiColors[Math.floor(Math.random() * confettiColors.length)];
    c.style.animationDuration = (.8 + Math.random() * 1.4) + 's';
    c.style.animationDelay = (Math.random() * .6) + 's';
    c.style.transform = `rotate(${Math.random()*360}deg)`;
    wrap.appendChild(c);
  }
  // clean up after animation
  later(() => { wrap.innerHTML = ''; }, 2500);
}

// ── sự kiện ──
document.querySelectorAll('.menu-card').forEach((b) => b.addEventListener('click', () => startMode(b.dataset.mode)));
$('btn-menu').addEventListener('click', goMenu);
$('btn-again').addEventListener('click', () => startMode(mode));
$('btn-ready').addEventListener('click', goToPick);
// chạm vào số to / chấm để nghe đếm lại; chạm 🔊 để nghe lại câu hỏi
$('target-display').addEventListener('click', announce);
$('dots-row').addEventListener('click', announce);
$('pick-label').addEventListener('click', () => Speech.play([V('pick-' + targetNumber)]));
$('hands').addEventListener('pointerdown', tapHands);
$('btn-turn').addEventListener('click', startTurn);
$('btn-watch').addEventListener('click', demo);
$('learn-number').addEventListener('click', () => { if (learn.phase === 'turn') Speech.play([V('learn-turn')]); });
$('learn-label').addEventListener('click', () => { if (learn.phase === 'turn') Speech.play([V('learn-turn')]); });
$('btn-lang').addEventListener('click', toggleLang);
applyLang();
