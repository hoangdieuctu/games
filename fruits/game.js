// Lưu ảnh và giọng đọc vào bộ nhớ trình duyệt (service worker) để mở lại nhanh và chơi được khi mất mạng.
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(() => {});
    // Bản cũ đăng ký sw.js ở thư mục gốc của trang web; gỡ nó đi để không còn worker thừa.
    navigator.serviceWorker.getRegistrations().then((regs) => {
      const mine = new URL('./', location.href).href;
      for (const r of regs) if (r.scope !== mine && !r.scope.startsWith(mine)) r.unregister();
    }).catch(() => {});
  });
}


/* ══════════ Phát âm tên trái cây ══════════
   Ưu tiên clip mp3 giọng nơ-ron sinh sẵn (art/gen-voice.mjs → voice/en, voice/vi).
   Clip lỗi / thiếu thì rơi về giọng máy (Speech Synthesis). */
const Clip = {
  // một thẻ <audio> dùng lại cho mọi câu: iOS chỉ cho phát tự động (không cần chạm)
  // trên thẻ đã từng được phát trong một cú chạm
  el: new Audio(), unlocked: false,
  unlock() {
    if (this.unlocked) return;
    this.unlocked = true;
    const a = this.el;
    a.src = 'data:audio/mpeg;base64,SUQzBAAAAAAAIlRTU0UAAAAOAAADTGF2ZjYyLjMuMTAwAAAAAAAAAAAAAAD/84TAAAAAAAAAAAAASW5mbwAAAA8AAAAFAAACoABtbW1tbW1tbW1tbW1tbW1tbW1tkpKSkpKSkpKSkpKSkpKSkpKSkpK2tra2tra2tra2tra2tra2tra2ttvb29vb29vb29vb29vb29vb29vb//////////////////////////8AAAAATGF2YzYyLjExAAAAAAAAAAAAAAAAJARQAAAAAAAAAqC9P8gWAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD/80TEAAAAA0gAAAAATEFNRTMuMTAwVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVMQU1FMy7/80TEUwAAA0gAAAAAMTAwVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVMQU1FMy7/80TEpgAAA0gAAAAAMTAwVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVX/80TErAAAA0gAAAAAVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVX/80TErAAAA0gAAAAAVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVU=';
    const p = a.play(); if (p && p.catch) p.catch(() => { this.unlocked = false; });
  },
  stop() { this.el.onended = this.el.onerror = null; try { this.el.pause(); } catch (e) {} },
  // phát voice/<lang>/<tên>.mp3; ok = phát xong, fail = không phát được
  play(lang, a, ok, fail) {
    this.stop();
    const el = this.el;
    el.onended = ok;
    el.onerror = fail;
    el.src = `voice/${lang}/${a.img.replace(/^.*\//, '').replace(/\.[^.]+$/, '')}.mp3`;
    const p = el.play(); if (p && p.catch) p.catch(fail);
  }
};
document.addEventListener('pointerdown', () => Clip.unlock(), true);

const Speech = {
  enVoice: null, viVoice: null, loaded: false, supported: 'speechSynthesis' in window,

  loadVoices() {
    if (!this.supported) return;
    const vs = speechSynthesis.getVoices();
    if (!vs.length) return;
    this.enVoice =
        vs.find(v => /^google us english/i.test(v.name)) ||
        vs.find(v => /^google/i.test(v.name) && /^en/i.test(v.lang)) ||
        vs.find(v => /^en[-_]US/i.test(v.lang)) ||
        vs.find(v => /^en[-_]GB/i.test(v.lang)) ||
        vs.find(v => /^en/i.test(v.lang)) || null;
    this.viVoice = vs.find(v => /^vi/i.test(v.lang)) || null;
    this.loaded = true;
  },

  cancel() {
    if (!this.supported) return;
    clearTimeout(this._guard);
    try { speechSynthesis.cancel(); } catch (e) {}
  },

  say(text, onEnd, lang = 'en') {
    if (!this.supported || !text) { if (onEnd) onEnd(); return; }
    if (!this.loaded) this.loadVoices();
    this.cancel();

    const done = onceOnly(onEnd);
    const u = new SpeechSynthesisUtterance(text);
    const v = lang === 'vi' ? this.viVoice : this.enVoice;
    u.lang = v ? v.lang : (lang === 'vi' ? 'vi-VN' : 'en-US');
    if (v) u.voice = v;
    u.rate = 0.92;
    u.pitch = 1.05;
    u.volume = 1;
    u.onend = u.onerror = () => { clearTimeout(this._guard); done(); };
    // Chrome đôi khi "kẹt" hàng đợi sau khi cancel — resume cho chắc.
    try { speechSynthesis.resume(); } catch (e) {}
    // speak() phải nằm ngay trong cú chạm của người dùng: hoãn dù chỉ một
    // nhịp là mất quyền phát tiếng và trình duyệt nuốt luôn câu đọc.
    speechSynthesis.speak(u);
    // Vài trình duyệt không bắn onend — tự gỡ hiệu ứng khi đã đủ lâu.
    this._guard = setTimeout(done, 1200 + text.length * 140);
  }
};

function onceOnly(fn) {
  let called = false;
  return () => { if (!called) { called = true; if (fn) fn(); } };
}

if (Speech.supported) {
  Speech.loadVoices();
  speechSynthesis.onvoiceschanged = () => Speech.loadVoices();
  // Một số trình duyệt nạp giọng chậm sau khi tải trang.
  setTimeout(() => Speech.loadVoices(), 400);
  setTimeout(() => Speech.loadVoices(), 1500);
}

let autoSpeak = localStorage.getItem('fruits_autospeak') !== '0';
let autoPlay  = localStorage.getItem('fruits_autoplay')  === '1';
// ngôn ngữ đọc khi mở một quả / tự động / loa trên thẻ: 'en', 'vi' hoặc 'both' (tiếng Anh trước rồi tiếng Việt)
const LANG_MODES = ['both', 'en', 'vi'];
const LANG_LABEL = { both: '🗣 EN+VI', en: '🗣 English', vi: '🗣 Tiếng Việt' };
let voiceLang = localStorage.getItem('fruits_voicelang');
if (!LANG_MODES.includes(voiceLang)) voiceLang = 'both';
const langSeq = () => (voiceLang === 'both' ? ['en', 'vi'] : [voiceLang]);
let autoTimer = null;
const AUTO_DELAY = 5000;

function toggleSound() {
  autoSpeak = !autoSpeak;
  localStorage.setItem('fruits_autospeak', autoSpeak ? '1' : '0');
  if (!autoSpeak) stopSpeaking();
  renderToggles();
}

function toggleLang() {
  voiceLang = LANG_MODES[(LANG_MODES.indexOf(voiceLang) + 1) % LANG_MODES.length];
  localStorage.setItem('fruits_voicelang', voiceLang);
  renderToggles();
}

function toggleAutoPlay() {
  autoPlay = !autoPlay;
  localStorage.setItem('fruits_autoplay', autoPlay ? '1' : '0');
  renderToggles();
  // Nếu đang mở một quả thì bật/tắt đếm ngược ngay.
  if (!document.getElementById('modal').classList.contains('hidden')) armAutoPlay();
  else stopAutoPlay();
}

function renderToggles() {
  const b = document.getElementById('sound-toggle');
  b.textContent = autoSpeak ? '🔊 Đọc tên' : '🔇 Tắt tiếng';
  b.classList.toggle('off', !autoSpeak);
  document.getElementById('lang-toggle').textContent = LANG_LABEL[voiceLang];
  const a = document.getElementById('auto-toggle');
  a.textContent = autoPlay ? '⏭ Tự động 5s' : '⏭ Tự động';
  a.classList.toggle('off', !autoPlay);
}


/* ── Đếm ngược tự động chuyển sang quả tiếp theo ── */
function stopAutoPlay() {
  clearTimeout(autoTimer);
  autoTimer = null;
  const bar = document.getElementById('auto-bar');
  bar.classList.add('hidden');
  bar.classList.remove('run');
}

function armAutoPlay() {
  stopAutoPlay();
  if (!autoPlay) return;
  const bar = document.getElementById('auto-bar');
  bar.classList.remove('hidden');
  void bar.offsetWidth;          // ép trình duyệt chạy lại animation
  bar.classList.add('run');
  autoTimer = setTimeout(() => nav(1), AUTO_DELAY);
}

/* ── Đọc tên ── */
let speakToken = 0;

// đọc lần lượt từng ngôn ngữ trong langs (mặc định theo cài đặt), nghỉ ngắn giữa hai thứ tiếng
function speakName(a, langs = langSeq()) {
  if (!a) return;
  const my = ++speakToken;
  Clip.stop(); Speech.cancel();
  const next = k => {
    if (my !== speakToken) return;
    markSpeaking(null);
    if (k >= langs.length) return;
    const lang = langs[k], go = () => setTimeout(() => next(k + 1), 350);
    markSpeaking(lang);
    let fell = false;
    Clip.play(lang, a, go, () => {
      if (fell || my !== speakToken) return; fell = true;
      Speech.say(lang === 'vi' ? a.vi : a.en, () => { if (my === speakToken) go(); }, lang);
    });
  };
  next(0);
}

function stopSpeaking() { speakToken++; Clip.stop(); Speech.cancel(); markSpeaking(null); }

function markSpeaking(lang) {
  for (const l of ['en', 'vi']) {
    const b = document.getElementById('btn-speak-' + l);
    if (b) b.classList.toggle('speaking', lang === l);
  }
}

function speakCurrent(lang) { speakName(filteredList[currentIdx], [lang]); }

// Nút loa nhỏ trên từng thẻ ở lưới.
function speakCard(e, idx) {
  e.stopPropagation();
  speakName(filteredList[idx]);
}

const CATS = ['Tất Cả','Nhiệt Đới','Có Múi','Quả Mọng','Họ Dưa','Ôn Đới','Dân Dã','Hạt'];
let filteredList = [];
let currentIdx = 0;

/* ── Lưu trạng thái để lần sau mở lại chơi tiếp: nhóm đang xem, vị trí cuộn, quả đang mở ── */
const saved = {
  get(k)    { try { return localStorage.getItem('fruits_' + k); } catch (e) { return null; } },
  set(k, v) { try { v == null ? localStorage.removeItem('fruits_' + k) : localStorage.setItem('fruits_' + k, v); } catch (e) {} },
};

function init() {
  const tabs = document.getElementById('cat-tabs');
  const startCat = CATS.includes(saved.get('cat')) ? saved.get('cat') : 'Tất Cả';
  const startScroll = Number(saved.get('scroll')) || 0;
  CATS.forEach(cat => {
    const b = document.createElement('button');
    b.className = 'cat-tab' + (cat===startCat?' active':'');
    b.textContent = cat;
    b.onclick = () => {
      document.querySelectorAll('.cat-tab').forEach(x=>x.classList.remove('active'));
      b.classList.add('active');
      saved.set('cat', cat);
      renderGrid(cat);
    };
    tabs.appendChild(b);
  });
  if (startCat !== 'Tất Cả') tabs.querySelector('.active').scrollIntoView({ inline: 'center', block: 'nearest' });
  renderToggles();
  renderGrid(startCat);

  const grid = document.getElementById('fruit-grid');
  grid.scrollTop = startScroll;
  grid.addEventListener('scroll', () => saved.set('scroll', Math.round(grid.scrollTop)), { passive: true });
  const openIdx = filteredList.findIndex(a => a.img === saved.get('open'));
  if (openIdx >= 0) openModal(openIdx);
}

function renderGrid(cat) {
  filteredList = cat==='Tất Cả' ? FRUITS : FRUITS.filter(a=>a.cat===cat);
  document.getElementById('browse-count').textContent = filteredList.length + ' quả';
  const grid = document.getElementById('fruit-grid');
  grid.innerHTML = '';
  grid.scrollTop = 0;
  saved.set('scroll', 0);

  filteredList.forEach((a, idx) => {
    const card = document.createElement('div');
    card.className = 'fruit-card';
    card.innerHTML = `
      <div class="img-wrap">
        <div class="img-fallback">${a.emoji}</div>
        <img src="${a.img}" alt="${a.vi}" loading="lazy"
          onload="this.classList.add('loaded')"
          onerror="this.style.display='none'">
      </div>
      <div class="fruit-name">${a.vi}</div>
      <button class="card-speak" aria-label="Đọc tên ${a.vi}" onclick="speakCard(event, ${idx})">🔊</button>`;
    card.onclick = () => openModal(idx);
    grid.appendChild(card);
  });
}

function openModal(idx) {
  currentIdx = idx;
  renderModal();
  document.getElementById('modal').classList.remove('hidden');
}

function renderModal() {
  const a = filteredList[currentIdx];
  const area = document.getElementById('modal-img-area');
  area.innerHTML = `
    <span class="fallback">${a.emoji}</span>
    <img src="${a.img}" alt="${a.vi}"
      onload="this.classList.add('loaded'); this.previousElementSibling.style.display='none'"
      onerror="this.style.display='none'">`;
  document.getElementById('modal-vi').textContent      = a.vi;
  document.getElementById('modal-en').textContent      = a.en;
  document.getElementById('modal-desc').textContent    = a.desc;
  document.getElementById('modal-origin').textContent  = a.origin  || '—';
  document.getElementById('modal-season').textContent  = a.season  || '—';
  document.getElementById('modal-taste').textContent   = a.taste   || '—';
  document.getElementById('modal-fact').textContent    = a.fact    || '—';
  document.getElementById('modal-story').textContent   = a.story   || '';
  document.getElementById('modal-tag').textContent     = a.cat     || '';
  saved.set('open', a.img);
  markSpeaking(null);
  if (autoSpeak) speakName(a);
  armAutoPlay();
}

function nav(dir) {
  currentIdx = (currentIdx + dir + filteredList.length) % filteredList.length;
  renderModal();
}

function closeModal() {
  stopSpeaking();
  stopAutoPlay();
  document.getElementById('modal').classList.add('hidden');
  saved.set('open', null);
}
function handleModalBg(e) { if(e.target===document.getElementById('modal')) closeModal(); }

init();
