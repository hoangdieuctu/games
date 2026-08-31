// ── HUD, gợi ý hướng dẫn, màn hình phủ (bắt đầu / kết thúc / cửa hàng) ──

import { G } from './state.js';
import { SERVICES } from './config.js';
import { UPGRADES, getBank, levelOf, nextCost, buy } from './upgrades.js';
import { DECOR, isOwnedDecor, pickedDecor, chooseDecor } from './decor.js';
import { sSelect, sCash, sNope, startMusic, stopMusic } from './audio.js';

const $ = (id) => document.getElementById(id);

export function bump(id) {
  const el = $(id);
  el.classList.remove('bump');
  void el.offsetWidth;
  el.classList.add('bump');
}

export function updateHud() {
  $('day-val').textContent = 'Ngày ' + G.day;
  $('goal-val').textContent = '/' + G.cfg.goal;
  $('money-val').textContent = Math.round(G.moneyShown);
}

export function updateCustPill() {
  const left = G.cfg.nCustomers - G.spawned +
    G.customers.filter(c => c.state !== 'exitHappy' && c.state !== 'exitAngry').length;
  $('cust-val').textContent = left;
}

/* ── gợi ý hướng dẫn ── */

export function advanceTutorial(step) {
  if (G.tutorialStep >= 0 && step === G.tutorialStep + 1) { G.tutorialStep = step; setHint(); }
  if (G.tutorialStep >= 4) G.tutorialStep = -1;
}

export function setHint() {
  let msg = '';
  const ts = G.tutorialStep;
  const has = (state) => G.customers.some(c => c.state === state);
  if ((ts >= 0 || G.day <= 2) && has('maskDone')) msg = '👆 Mặt nạ ngấm xong rồi — chạm vào ô mặt nạ để gỡ!';
  else if (ts === 0 && has('sit')) msg = '👆 Chạm vào khách đang ngồi chờ!';
  else if (ts === 1) msg = '👆 Chạm vào ô dịch vụ mà khách muốn (xem bong bóng 💭)';
  else if (ts === 2) {
    if (G.customers.some(c => c.state === 'service' && c.anchor &&
      SERVICES[G.stations[c.anchor.idx].key].mode === 'staff'))
      msg = '👆 Giữ ngón tay trên ô để cô nhân viên làm nhanh hơn!';
    else if (has('awaitStaff')) msg = '💁‍♀️ Cô nhân viên đang đến phục vụ...';
    else msg = '⏳ Chờ dịch vụ xong nhé...';
  }
  else if (ts === 3) msg = '💰 Chọn khách rồi chạm vào quầy thu ngân!';
  else if (ts >= 0 && has('queue')) msg = '💁‍♀️ Cô nhân viên đang ra quầy tính tiền cho cả hàng...';
  const el = $('hint');
  el.textContent = msg;
  el.classList.toggle('show', !!msg);
}

/* ── màn hình bắt đầu ── */

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
}

export function hideStart() { $('ov-start').classList.remove('show'); }

/* ── màn hình kết thúc ngày ── */

export function showEnd({ passed, stars }) {
  $('end-title').textContent = passed ? 'Tuyệt Vời! 🎉' : 'Ôi, Chưa Đủ...';
  $('end-money').textContent = '💰 ' + G.money + ' / ' + G.cfg.goal;
  $('end-goals').textContent = G.money >= G.cfg.expert
    ? '🏆 Đạt mục tiêu vàng ' + G.cfg.expert + ' 💰 — 3 sao!'
    : 'Mục tiêu vàng (3 sao): ' + G.cfg.expert + ' 💰';
  $('end-sub').textContent =
    '😊 ' + G.paidCount + ' khách vui vẻ' +
    (G.angryCount ? ' · 💢 ' + G.angryCount + ' khách bỏ về' : '') +
    ' · Ngân quỹ: ' + getBank() + ' 💰';
  for (let i = 1; i <= 3; i++) {
    const el = $('st' + i);
    el.classList.remove('on');
    if (i <= stars) setTimeout(() => el.classList.add('on'), 300 + i * 350);
  }
  $('btn-next').style.display = passed ? '' : 'none';
  $('ov-end').classList.add('show');
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
