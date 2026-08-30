// ── HUD, gợi ý hướng dẫn, màn hình phủ (bắt đầu / kết thúc / cửa hàng) ──

import { G } from './state.js';
import { SERVICES } from './config.js';
import { UPGRADES, getBank, levelOf, nextCost, buy } from './upgrades.js';
import { sSelect, sCash, sNope } from './audio.js';

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
      msg = '👆 Chạm liên tục để cô nhân viên làm nhanh hơn!';
    else if (has('awaitStaff')) msg = '💁‍♀️ Cô nhân viên đang đến phục vụ...';
    else msg = '⏳ Chờ dịch vụ xong nhé...';
  }
  else if (ts === 3) msg = '💰 Chọn khách rồi chạm vào quầy thu ngân!';
  else if (ts >= 0 && has('queue')) msg = '👆 Chạm vào quầy để cô nhân viên ra tính tiền!';
  const el = $('hint');
  el.textContent = msg;
  el.classList.toggle('show', !!msg);
}

/* ── màn hình bắt đầu ── */

export function showStart() {
  $('start-day').textContent = 'Ngày ' + G.day;
  $('start-goal').textContent = G.cfg.goal;
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
  $('ov-start').classList.add('show');
}

export function hideStart() { $('ov-start').classList.remove('show'); }

/* ── màn hình kết thúc ngày ── */

export function showEnd({ passed, stars }) {
  $('end-title').textContent = passed ? 'Tuyệt Vời! 🎉' : 'Ôi, Chưa Đủ...';
  $('end-money').textContent = '💰 ' + G.money + ' / ' + G.cfg.goal;
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

export function bindUi({ onStart, onRetry, onNext }) {
  $('btn-start').addEventListener('click', onStart);
  $('btn-retry').addEventListener('click', onRetry);
  $('btn-next').addEventListener('click', onNext);
  $('btn-shop').addEventListener('click', () => { sSelect(); renderShop(); $('ov-shop').classList.add('show'); });
  $('btn-shop-close').addEventListener('click', () => { sSelect(); $('ov-shop').classList.remove('show'); });
}
