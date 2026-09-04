// ── HUD, gợi ý, màn hình phủ: cốt truyện tranh, hướng dẫn cơ bản,
//    chọn mặt nạ, bắt đầu / kết thúc ngày, cửa hàng, trang trí ──

import { G } from './state.js';
import { SERVICES, HERO_LOOK, HERO_NAME, FRIEND_NAME } from './config.js';
import { UPGRADES, getBank, levelOf, nextCost, buy } from './upgrades.js';
import { DECOR, isOwnedDecor, pickedDecor, chooseDecor } from './decor.js';
import { drawPerson } from './avatar.js';
import { heartPop, textPop } from './particles.js';
import { sSelect, sCash, sNope, sDone, startMusic, stopMusic } from './audio.js';

const $ = (id) => document.getElementById(id);

export function bump(id) {
  const el = $(id);
  el.classList.remove('bump');
  void el.offsetWidth;
  el.classList.add('bump');
}

/* ── HUD ── */

export function updateHud() {
  $('day-val').textContent = 'Ngày ' + G.day;
  $('goal-big').textContent = G.cfg.goal;
  $('money-val').textContent = Math.round(G.moneyShown);
}

let lastStars = -1;
export function updateHudStars() {
  if (!G.cfg) return;
  const mid = Math.round((G.cfg.goal + G.cfg.expert) / 2);
  const n = G.money >= G.cfg.expert ? 3 : G.money >= mid ? 2 : G.money >= G.cfg.goal ? 1 : 0;
  if (n === lastStars) return;
  lastStars = n;
  for (let i = 1; i <= 3; i++) $('hst' + i).classList.toggle('on', i <= n);
}

export function updateCustPill() {
  const left = G.cfg.nCustomers - G.spawned +
    G.customers.filter(c => c.state !== 'exitHappy' && c.state !== 'exitAngry').length;
  $('cust-val').textContent = left;
}

/* ── chân dung cô chủ tiệm vẽ lên canvas nhỏ trong các thẻ ── */

function paintHero(canvasId, opts) {
  const cv = $(canvasId);
  if (!cv) return;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const w = cv.clientWidth || 150, h = cv.clientHeight || 210;
  cv.width = w * dpr; cv.height = h * dpr;
  const ctx = cv.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, w, h);
  const u = h / 118;
  drawPerson(ctx, w / 2, h - 18 * (u / 1.6), u / 1.6 * 1.35, HERO_LOOK,
    { mood: 1, happy: true, ...(opts || {}) });
}

/* ── gợi ý hướng dẫn (lời cô chủ tiệm) ── */

export function advanceTutorial(step) {
  if (G.tutorialStep >= 0 && step === G.tutorialStep + 1) { G.tutorialStep = step; setHint(); }
  if (G.tutorialStep >= 4) G.tutorialStep = -1;
}

export function setHint() {
  let msg = '';
  const ts = G.tutorialStep;
  const has = (state) => G.customers.some(c => c.state === state);
  if ((ts >= 0 || G.day <= 2) && has('maskDone')) msg = '👆 Mặt nạ ngấm xong rồi — chạm để gỡ cho khách nhé!';
  else if (ts === 0 && has('sit')) msg = '👆 Chạm vào vị khách đầu tiên đang ngồi chờ!';
  else if (ts === 1) msg = '👆 Giờ chạm vào chỗ dịch vụ khách muốn (nhìn bong bóng 💭)';
  else if (ts === 2) {
    if (G.customers.some(c => c.state === 'service' && c.anchor &&
      SERVICES[G.stations[c.anchor.idx].key].mode === 'staff'))
      msg = '👆 Làm tốt lắm! Giữ ngón tay trên ô để phục vụ nhanh hơn!';
    else if (has('awaitStaff')) msg = '🌸 Cô chủ đang chạy đến phục vụ...';
    else msg = '⏳ Chờ dịch vụ xong nhé...';
  }
  else if (ts === 3) msg = '💰 Xong rồi! Chọn khách rồi chạm vào quầy lễ tân để tính tiền!';
  else if (ts >= 0 && has('queue')) msg = '🌸 Khách vui thì tiền boa càng nhiều đó! Đang tính tiền...';
  const el = $('hint');
  el.textContent = msg;
  el.classList.toggle('show', !!msg);
}

/* ── cốt truyện tranh mở đầu ── */

function paintStoryPanel(cv, kind) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const w = cv.clientWidth || 260, h = cv.clientHeight || 150;
  cv.width = w * dpr; cv.height = h * dpr;
  const ctx = cv.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  // nền biển: trời — biển — cát
  const sky = ctx.createLinearGradient(0, 0, 0, h * 0.5);
  sky.addColorStop(0, '#bfe8f7'); sky.addColorStop(1, '#e8f7fd');
  ctx.fillStyle = sky; ctx.fillRect(0, 0, w, h * 0.5);
  ctx.fillStyle = '#6fc9d8'; ctx.fillRect(0, h * 0.42, w, h * 0.26);
  ctx.fillStyle = 'rgba(255,255,255,.5)';
  for (let i = 0; i < 4; i++) {
    ctx.beginPath();
    ctx.ellipse(w * (0.12 + i * 0.25), h * (0.52 + (i % 2) * 0.07), w * 0.07, h * 0.012, 0, 0, 7);
    ctx.fill();
  }
  ctx.fillStyle = '#f2dfb4'; ctx.fillRect(0, h * 0.64, w, h * 0.36);
  // mặt trời
  ctx.fillStyle = '#ffd97a';
  ctx.beginPath(); ctx.arc(w * 0.85, h * 0.14, h * 0.1, 0, 7); ctx.fill();

  const friend = { skin: '#f5cfa8', hair: 'long', hairColor: '#6a4020', dress: 'flare', dressColor: '#5cc9b5', apron: 'none', acc: 'flower' };
  const u = h / 260;

  if (kind === 'villa' || kind === 'villaSad' || kind === 'plan') {
    // biệt thự spa mái ngói trên đồi nhỏ
    const vx = w * 0.68, vy = h * 0.52;
    ctx.fillStyle = '#8fbf7a';
    ctx.beginPath(); ctx.ellipse(vx, vy + h * 0.08, w * 0.24, h * 0.1, 0, 0, 7); ctx.fill();
    ctx.fillStyle = '#fdf3e0';
    ctx.fillRect(vx - w * 0.14, vy - h * 0.18, w * 0.28, h * 0.24);
    ctx.fillStyle = '#c96f42';
    ctx.beginPath();
    ctx.moveTo(vx - w * 0.17, vy - h * 0.18);
    ctx.lineTo(vx, vy - h * 0.34);
    ctx.lineTo(vx + w * 0.17, vy - h * 0.18);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#8a5c30';
    ctx.fillRect(vx - w * 0.02, vy - h * 0.04, w * 0.05, h * 0.1);
    ctx.fillStyle = '#bfe3f0';
    ctx.fillRect(vx - w * 0.11, vy - h * 0.12, w * 0.06, h * 0.07);
    ctx.fillRect(vx + w * 0.05, vy - h * 0.12, w * 0.06, h * 0.07);
    if (kind === 'villaSad') {
      // biển "đóng cửa" gác chéo
      ctx.save();
      ctx.translate(vx, vy - h * 0.02);
      ctx.rotate(-0.16);
      ctx.fillStyle = '#b8a888';
      ctx.fillRect(-w * 0.12, -h * 0.03, w * 0.24, h * 0.06);
      ctx.restore();
    }
    if (kind === 'plan') {
      ctx.font = `${h * 0.13}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText('💭', vx - w * 0.28, vy - h * 0.3);
      ctx.fillText('✨', vx + w * 0.2, vy - h * 0.38);
    }
    drawPerson(ctx, w * 0.22, h * 0.9, u, HERO_LOOK, { mood: 1, happy: kind === 'plan' });
    if (kind !== 'villa') drawPerson(ctx, w * 0.4, h * 0.93, u * 0.96, friend, { mood: kind === 'villaSad' ? 0.4 : 1 });
    return;
  }

  if (kind === 'spa') {
    // spa mới khai trương lấp lánh
    ctx.fillStyle = '#fdf3e0';
    ctx.fillRect(w * 0.28, h * 0.34, w * 0.44, h * 0.34);
    ctx.fillStyle = '#c96f42';
    ctx.beginPath();
    ctx.moveTo(w * 0.24, h * 0.34); ctx.lineTo(w * 0.5, h * 0.12); ctx.lineTo(w * 0.76, h * 0.34);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#3a9a8a';
    ctx.fillRect(w * 0.36, h * 0.40, w * 0.28, h * 0.10);
    ctx.fillStyle = '#fff';
    ctx.font = `800 ${h * 0.062}px 'Baloo 2', sans-serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('SPA BỜ BIỂN', w * 0.5, h * 0.452);
    ctx.font = `${h * 0.1}px sans-serif`;
    ctx.fillText('✨', w * 0.2, h * 0.3);
    ctx.fillText('🌺', w * 0.82, h * 0.4);
    ctx.fillText('✨', w * 0.78, h * 0.2);
    drawPerson(ctx, w * 0.5, h * 0.94, u * 1.05, HERO_LOOK, { mood: 1, happy: true });
    return;
  }

  // mặc định: hai cô bạn trên bãi biển với nước chanh + dù
  // dù che nắng
  ctx.strokeStyle = '#b58a62'; ctx.lineWidth = 3 * u;
  ctx.beginPath(); ctx.moveTo(w * 0.78, h * 0.9); ctx.lineTo(w * 0.78, h * 0.44); ctx.stroke();
  ctx.fillStyle = '#f27d93';
  ctx.beginPath(); ctx.arc(w * 0.78, h * 0.46, w * 0.14, Math.PI, 0); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#ffd0dc';
  ctx.beginPath(); ctx.arc(w * 0.78, h * 0.46, w * 0.14, Math.PI * 1.25, Math.PI * 1.5); ctx.lineTo(w * 0.78, h * 0.46); ctx.closePath(); ctx.fill();
  drawPerson(ctx, w * 0.3, h * 0.92, u, HERO_LOOK, { mood: 1, happy: kind !== 'intro' });
  drawPerson(ctx, w * 0.52, h * 0.94, u * 0.96, friend, { mood: 1, happy: true });
  if (kind === 'drink') {
    const cvx = w * 0.415, cvy = h * 0.62;
    ctx.font = `${h * 0.11}px sans-serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('🍹', cvx, cvy);
  }
}

const STORY_PANELS = [
  { kind: 'intro', cap: 'Chuỗi salon làm ăn phát đạt, ' + HERO_NAME + ' tự thưởng cho mình một kỳ nghỉ ra biển thăm cô bạn thân ' + FRIEND_NAME + '.', say: 'Lâu lắm mới được ra biển! 🌊' },
  { kind: 'drink', cap: '', say: FRIEND_NAME + ': "' + HERO_NAME + '! Uống ly nước mát nhé?" · ' + HERO_NAME + ': "Tuyệt quá đi!"' },
  { kind: 'villaSad', cap: '', say: FRIEND_NAME + ': "Thấy căn biệt thự kia không? Trước là một tiệm spa, ông bà chủ mới nghỉ hưu rồi."' },
  { kind: 'villaSad', cap: '', say: FRIEND_NAME + ': "Từ ngày spa đóng cửa, xe mỹ phẩm của mình cũng vắng khách hẳn…"' },
  { kind: 'plan', cap: '', say: HERO_NAME + ': "Căn biệt thự đó… người ta bán lại bao nhiêu nhỉ? 🤭" · ' + FRIEND_NAME + ': "Cậu lại tính gì thế?!"' },
  { kind: 'spa', cap: 'Và thế là Spa Bờ Biển Xanh của ' + HERO_NAME + ' ra đời! Cùng giúp cô ấy đón những vị khách đầu tiên nào! ✨', say: '' },
];

function buildStory() {
  const grid = $('story-grid');
  if (!grid || grid.childElementCount) return;
  STORY_PANELS.forEach((p, i) => {
    const el = document.createElement('div');
    el.className = 'panel';
    el.innerHTML =
      (p.cap ? '<div class="pcap">' + p.cap + '</div>' : '') +
      '<canvas id="story-cv-' + i + '"></canvas>' +
      (p.say ? '<div class="pbubble">' + p.say + '</div>' : '');
    grid.appendChild(el);
  });
  requestAnimationFrame(() => {
    STORY_PANELS.forEach((p, i) => paintStoryPanel($('story-cv-' + i), p.kind));
  });
}

export function showStory() {
  buildStory();
  $('ov-story').classList.add('show');
}
function hideStory() {
  $('ov-story').classList.remove('show');
  localStorage.setItem('spa_story_seen', '1');
}

/* ── "Những Điều Cơ Bản" — cô chủ dặn dò trước ngày đầu ── */

export function showBasics() {
  G.paused = true;
  paintHero('basics-hero');
  $('ov-basics').classList.add('show');
}
function hideBasics() {
  $('ov-basics').classList.remove('show');
  G.paused = false;
}

/* ── minigame "Chọn Mặt Nạ!" ── */

const MASKS = [
  { col: '#a8dd8a', edge: '#7cbf5e', name: 'Dưa leo' },
  { col: '#a8c8f0', edge: '#7aa4d8', name: 'Việt quất' },
  { col: '#f0b8d0', edge: '#d88aac', name: 'Hoa hồng' },
];

let maskState = null; // { c, idx, happyIdx }
const maskQueue = [];

function drawMaskFace() {
  const cv = $('mask-face');
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const w = cv.clientWidth || 200, h = cv.clientHeight || 200;
  cv.width = w * dpr; cv.height = h * dpr;
  const ctx = cv.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, w, h);
  const { c, idx, happyIdx } = maskState;
  const m = MASKS[idx];
  const mood = idx === happyIdx ? 'happy' : (idx + 1) % 3 === happyIdx ? 'flat' : 'sad';
  const cx = w / 2, cy = h * 0.54, r = w * 0.34;

  // khăn quấn đầu
  ctx.fillStyle = '#fffaf4';
  ctx.beginPath();
  ctx.ellipse(cx, cy - r * 0.72, r * 1.06, r * 0.72, 0, Math.PI, 0);
  ctx.closePath(); ctx.fill();
  ctx.strokeStyle = 'rgba(200,180,190,.6)'; ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = '#fff4ea';
  ctx.beginPath(); ctx.ellipse(cx + r * 0.1, cy - r * 1.28, r * 0.34, r * 0.24, 0.3, 0, 7); ctx.fill();
  // mặt
  ctx.fillStyle = c ? c.look.skin : '#ffdfc4';
  ctx.beginPath(); ctx.ellipse(cx, cy, r * 0.97, r, 0, 0, 7); ctx.fill();
  // lớp mặt nạ
  ctx.fillStyle = m.col;
  ctx.globalAlpha = 0.75;
  ctx.beginPath(); ctx.ellipse(cx, cy + r * 0.08, r * 0.88, r * 0.82, 0, 0, 7); ctx.fill();
  ctx.globalAlpha = 1;
  // hai lát dưa / miếng đắp mắt
  for (const sg of [-1, 1]) {
    ctx.fillStyle = m.edge;
    ctx.beginPath(); ctx.ellipse(cx + sg * r * 0.42, cy - r * 0.06, r * 0.26, r * 0.2, 0, 0, 7); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.55)';
    ctx.beginPath(); ctx.ellipse(cx + sg * r * 0.42, cy - r * 0.06, r * 0.15, r * 0.11, 0, 0, 7); ctx.fill();
  }
  // chân mày + miệng theo phản ứng
  ctx.strokeStyle = '#8a5a48';
  ctx.lineWidth = Math.max(2, r * 0.07);
  ctx.lineCap = 'round';
  for (const sg of [-1, 1]) {
    ctx.beginPath();
    if (mood === 'sad') {
      ctx.moveTo(cx + sg * r * 0.24, cy - r * 0.4);
      ctx.lineTo(cx + sg * r * 0.58, cy - r * 0.5);
    } else {
      ctx.arc(cx + sg * r * 0.42, cy - r * 0.34, r * 0.2, Math.PI * 1.2, Math.PI * 1.8);
    }
    ctx.stroke();
  }
  ctx.strokeStyle = '#c2506a';
  ctx.lineWidth = Math.max(2.4, r * 0.085);
  ctx.beginPath();
  if (mood === 'happy') ctx.arc(cx, cy + r * 0.42, r * 0.26, Math.PI * 0.15, Math.PI * 0.85);
  else if (mood === 'flat') { ctx.moveTo(cx - r * 0.2, cy + r * 0.52); ctx.lineTo(cx + r * 0.2, cy + r * 0.52); }
  else ctx.arc(cx, cy + r * 0.72, r * 0.22, Math.PI * 1.15, Math.PI * 1.85);
  ctx.stroke();
  // má hồng khi cười
  if (mood === 'happy') {
    ctx.fillStyle = 'rgba(255,130,155,.4)';
    for (const sg of [-1, 1]) {
      ctx.beginPath(); ctx.ellipse(cx + sg * r * 0.62, cy + r * 0.3, r * 0.14, r * 0.09, 0, 0, 7); ctx.fill();
    }
    ctx.font = `${r * 0.3}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('✨', cx + r * 0.95, cy - r * 0.6);
    ctx.fillText('✨', cx - r * 0.95, cy - r * 0.3);
  }
  $('mask-name').textContent = 'Mặt nạ ' + m.name;
}

export function openMaskPick(c) {
  if (maskState) { maskQueue.push(c); c.state = 'maskPick'; return; }
  maskState = { c, idx: Math.floor(Math.random() * 3), happyIdx: Math.floor(Math.random() * 3) };
  c.state = 'maskPick';
  drawMaskFace();
  $('ov-mask').classList.add('show');
}

function confirmMask() {
  if (!maskState) return;
  const { c, idx, happyIdx } = maskState;
  const bonus = idx === happyIdx;
  c.state = 'masked';
  c.serviceTimer = 0;
  if (bonus) {
    c.patience = Math.min(c.maxPatience, c.patience + 1);
    for (let i = 0; i < 4; i++) heartPop(c.x + (Math.random() - 0.5) * 40 * G.K, c.y - 80 * G.K);
    textPop(c.x, c.y - 100 * G.K, '+1 ♥ Khách thích!', 20);
    sDone();
  } else sSelect();
  closeMask();
  setHint();
}

function closeMask() {
  maskState = null;
  $('ov-mask').classList.remove('show');
  const next = maskQueue.shift();
  if (next && next.state === 'maskPick') openMaskPick(next);
}

// khách bỏ về / hết ngày trong lúc đang mở bảng chọn cho khách đó
export function closeMaskPickFor(c) {
  const qi = maskQueue.indexOf(c);
  if (qi !== -1) maskQueue.splice(qi, 1);
  if (maskState && maskState.c === c) closeMask();
}

/* ── màn hình bắt đầu ngày (bản đồ tiệm) ── */

export function showStart() {
  const ch = G.cfg.chapter;
  $('start-chapter').textContent = ch.icon + ' ' + ch.name;
  $('start-day').textContent = ch.endless
    ? 'Ngày ' + G.day + ' · Thử thách ' + ch.day
    : 'Ngày ' + G.day + ' · Màn ' + ch.day + '/' + ch.days;
  $('start-goal').textContent = G.cfg.goal;
  $('start-expert').textContent = G.cfg.expert;

  // chấm tiến trình trong chương
  const dots = $('start-dots');
  dots.innerHTML = '';
  dots.style.display = ch.endless ? 'none' : '';
  for (let i = 1; i <= ch.days; i++) {
    const d = document.createElement('i');
    d.className = i < ch.day ? 'done' : i === ch.day ? 'now' : '';
    dots.appendChild(d);
  }

  // hôm nay mở thêm gì
  const un = $('start-unlocks');
  un.innerHTML = '';
  for (const u of G.cfg.unlocks) {
    const chip = document.createElement('div');
    chip.className = 'unlock-chip';
    chip.innerHTML = '<span class="e">' + u.icon + '</span>Mới: ' + u.name;
    un.appendChild(chip);
  }
  un.style.display = G.cfg.unlocks.length ? '' : 'none';

  const row = $('start-svcs');
  row.innerHTML = '';
  for (const k of [...new Set(G.cfg.stations)]) {
    const s = SERVICES[k];
    const chip = document.createElement('div');
    chip.className = 'svc-chip';
    chip.innerHTML = '<span class="e">' + s.icon + '</span>' + s.name + ' · ' + s.price + '💰';
    row.appendChild(chip);
  }
  $('start-bank').textContent = getBank();
  document.querySelector('.reset-row').classList.remove('asking');
  $('ov-pause').classList.remove('show');
  $('pause-btn').textContent = '⏸️';
  $('ov-start').classList.add('show');
  paintHero('start-hero');

  // lần đầu vào Ngày 1 thì kể cốt truyện trước
  if (G.day === 1 && !localStorage.getItem('spa_story_seen')) showStory();
}

export function hideStart() { $('ov-start').classList.remove('show'); }

/* ── màn hình kết thúc ngày (bảng tổng kết như trong video) ── */

export function showEnd({ passed, stars }) {
  $('end-title').textContent = passed ? 'Chúc Mừng! 🎉' : 'Ôi, Chưa Đạt...';
  $('end-banner').textContent = 'ĐÓNG CỬA';
  $('r-serv').textContent = (G.money - G.tips) + ' 💰';
  $('r-tip').textContent = G.tips + ' 💰';
  $('r-total').textContent = G.money + ' / ' + G.cfg.goal + ' 💰';
  $('r-served').textContent = G.paidCount;
  $('r-lost').textContent = G.angryCount;
  $('end-goals').textContent = G.money >= G.cfg.expert
    ? '🏆 Đạt mục tiêu vàng ' + G.cfg.expert + ' 💰 — 3 sao!'
    : 'Mục tiêu vàng (3 sao): ' + G.cfg.expert + ' 💰';
  $('end-bank').textContent = 'Ngân quỹ: ' + getBank() + ' 💰';
  for (let i = 1; i <= 3; i++) {
    const el = $('st' + i);
    el.classList.remove('on');
    if (i <= stars) setTimeout(() => el.classList.add('on'), 300 + i * 350);
  }
  $('btn-next').style.display = passed ? '' : 'none';
  $('ov-end').classList.add('show');
  paintHero('end-hero');
}

export function hideEnd() { $('ov-end').classList.remove('show'); }

/* ── tạm dừng ── */

export function setPaused(on) {
  if (!G.running) return;          // chỉ tạm dừng khi đang chơi
  if (G.paused === on) return;
  G.paused = on;
  G.holding = null;
  if (on) {
    stopMusic();
    $('pause-stat').textContent =
      '💰 ' + G.money + ' / ' + G.cfg.goal + '  ·  👩 còn ' + $('cust-val').textContent + ' khách';
    $('ov-pause').classList.add('show');
  } else {
    $('ov-pause').classList.remove('show');
    startMusic();
  }
  $('pause-btn').textContent = on ? '▶️' : '⏸️';
}

export function togglePause() { setPaused(!G.paused); }

/* ── cửa hàng nâng cấp ── */

export function renderShop() {
  $('shop-bank').textContent = getBank();
  const list = $('shop-list');
  list.innerHTML = '';
  for (const key of Object.keys(UPGRADES)) {
    const u = UPGRADES[key];
    const lv = levelOf(key);
    const cost = nextCost(key);
    const maxed = cost == null;
    const item = document.createElement('div');
    item.className = 'shop-item';
    const pips = u.costs.map((_, i) => '<span class="pip' + (i < lv ? ' on' : '') + '"></span>').join('');
    item.innerHTML =
      '<div class="shop-ico">' + u.icon + '</div>' +
      '<div class="shop-info"><div class="shop-name">' + u.name + ' <span class="pips">' + pips + '</span></div>' +
      '<div class="shop-desc">' + u.desc + '</div></div>' +
      '<button class="shop-buy' + (maxed ? ' maxed' : '') + '" data-key="' + key + '"' +
      (maxed ? ' disabled' : '') + '>' + (maxed ? 'ĐỦ RỒI ✓' : cost + ' 💰') + '</button>';
    list.appendChild(item);
  }
  list.querySelectorAll('.shop-buy:not(.maxed)').forEach(btn => {
    btn.addEventListener('click', () => {
      if (buy(btn.dataset.key)) { sCash(); renderShop(); $('start-bank').textContent = getBank(); }
      else sNope();
    });
  });
}

/* ── trang trí tiệm ── */

let decorCat = 'wall';

export function renderDecor() {
  $('decor-bank').textContent = getBank();
  const tabs = $('decor-tabs');
  tabs.innerHTML = '';
  for (const key of Object.keys(DECOR)) {
    const c = DECOR[key];
    const b = document.createElement('button');
    b.className = 'decor-tab' + (key === decorCat ? ' on' : '');
    b.innerHTML = '<span>' + c.icon + '</span>' + c.name;
    b.addEventListener('click', () => { decorCat = key; sSelect(); renderDecor(); });
    tabs.appendChild(b);
  }
  const grid = $('decor-items');
  grid.innerHTML = '';
  for (const item of DECOR[decorCat].items) {
    const owned = isOwnedDecor(decorCat, item);
    const on = pickedDecor(decorCat) === item.id;
    const b = document.createElement('button');
    b.className = 'decor-item' + (on ? ' on' : '');
    const ico = item.swatch
      ? '<span class="decor-sw" style="background:' + item.swatch + '"></span>'
      : '<span class="decor-emo">' + (item.emoji || '✨') + '</span>';
    const tag = on ? 'Đang dùng ✓' : owned ? 'Đã có' : item.price + ' 💰';
    b.innerHTML = ico + '<span class="decor-name">' + item.name + '</span>' +
      '<span class="decor-tag' + (on ? ' on' : owned ? '' : ' buy') + '">' + tag + '</span>';
    b.addEventListener('click', () => {
      const r = chooseDecor(decorCat, item);
      if (r === 'bought') sCash();
      else if (r === 'used') sSelect();
      else sNope();
      renderDecor();
    });
    grid.appendChild(b);
  }
}

export function bindUi({ onStart, onRetry, onNext, onReset }) {
  $('pause-btn').addEventListener('click', () => { sSelect(); togglePause(); });
  $('btn-resume').addEventListener('click', () => { sSelect(); setPaused(false); });
  // rời khỏi tab / khoá máy → tự tạm dừng cho khách khỏi giận oan
  document.addEventListener('visibilitychange', () => { if (document.hidden) setPaused(true); });

  $('btn-start').addEventListener('click', onStart);
  $('btn-retry').addEventListener('click', onRetry);
  $('btn-next').addEventListener('click', onNext);
  $('btn-shop').addEventListener('click', () => { sSelect(); renderShop(); $('ov-shop').classList.add('show'); });
  $('btn-shop-close').addEventListener('click', () => { sSelect(); $('ov-shop').classList.remove('show'); });
  // trang trí: tạm ẩn thẻ bắt đầu để thấy tiệm đổi ngay phía sau
  $('btn-decor').addEventListener('click', () => {
    sSelect();
    renderDecor();
    $('ov-start').classList.remove('show');
    $('ov-decor').classList.add('show');
  });
  $('btn-decor-close').addEventListener('click', () => {
    sSelect();
    $('ov-decor').classList.remove('show');
    $('start-bank').textContent = getBank();
    $('ov-start').classList.add('show');
  });

  // cốt truyện, hướng dẫn cơ bản, chọn mặt nạ
  $('btn-story').addEventListener('click', () => { sSelect(); showStory(); });
  $('btn-story-close').addEventListener('click', () => { sSelect(); hideStory(); });
  $('btn-basics-go').addEventListener('click', () => { sSelect(); hideBasics(); });
  $('mask-left').addEventListener('click', () => {
    if (!maskState) return;
    maskState.idx = (maskState.idx + 2) % 3;
    sSelect(); drawMaskFace();
  });
  $('mask-right').addEventListener('click', () => {
    if (!maskState) return;
    maskState.idx = (maskState.idx + 1) % 3;
    sSelect(); drawMaskFace();
  });
  $('btn-mask-ok').addEventListener('click', confirmMask);

  // bắt đầu lại từ Ngày 1: hỏi lại một lần cho chắc rồi mới xoá
  const resetRow = document.querySelector('.reset-row');
  $('btn-reset').addEventListener('click', () => { sSelect(); resetRow.classList.add('asking'); });
  $('btn-reset-no').addEventListener('click', () => { sSelect(); resetRow.classList.remove('asking'); });
  $('btn-reset-yes').addEventListener('click', () => {
    sNope();
    resetRow.classList.remove('asking');
    onReset();
  });
}
