// ── HUD, gợi ý, các màn hình phủ: bắt đầu ngày, kết thúc, nâng cấp, tủ đồ ──

import { G } from './state.js';
import { DISHES } from './config.js';
import { UPGRADES, levelOf, nextCost, buy, staffCount } from './upgrades.js';
import { CATS, getLook, isOwned, isLocked, chooseItem, equippedOf } from './wardrobe.js';
import { DECOR, isOwnedDecor, pickedDecor, chooseDecor } from './decor.js';
import { getGold, getExp, getLevel, expNeed } from './player.js';
import { drawPerson } from './avatar.js';
import { sSelect, sCash, sNope, sLevel } from './audio.js';

const $ = (id) => document.getElementById(id);

export function bump(id) {
  const el = $(id);
  if (!el) return;
  el.classList.remove('bump');
  void el.offsetWidth;
  el.classList.add('bump');
}

export function updateHud() {
  $('day-val').textContent = 'Ngày ' + G.day;
  $('goal-val').textContent = '/' + (G.cfg ? G.cfg.goal : 0);
  $('money-val').textContent = Math.round(G.moneyShown);
  $('lv-val').textContent = getLevel();
  $('exp-fill').style.width = Math.min(100, getExp() / expNeed(getLevel()) * 100) + '%';
}

export function updateCustPill() {
  const left = G.cfg.nCustomers - G.spawned +
    G.customers.filter(c => !c.state.startsWith('exit')).length;
  $('cust-val').textContent = left;
}

/* ── gợi ý theo tình huống (chỉ hiện những ngày đầu) ── */

export function setHint() {
  let msg = '';
  const has = (st) => G.customers.some(c => c.state === st);
  if (G.running && G.day <= 3) {
    if (G.bonusReady) msg = '🔔 Đơn đặc biệt! Chạm chuông vàng ở quầy bếp để chơi thử thách';
    else if (G.selected && G.selected.state === 'wait') msg = '👆 Chạm vào một bàn trống để mời khách vào ngồi';
    else if (G.plates.some(Boolean)) msg = '🍽️ Món xong rồi — chạm vào đĩa ở quầy bếp để bưng ra bàn!';
    else if (has('order')) msg = '📝 Khách đã chọn xong — chạm vào khách để ghi món';
    else if (has('bill')) msg = '💰 Khách ăn xong — chạm vào khách để thu tiền';
    else if (G.tables.some(t => t.dirty)) msg = '🧽 Chạm vào bàn bẩn để dọn cho khách sau';
    else if (has('wait')) msg = '👆 Chạm vào khách đang đứng chờ ở cửa';
  }
  const el = $('hint');
  el.textContent = msg;
  el.classList.toggle('show', !!msg);
}

/* ── màn hình bắt đầu ngày ── */

function fillLevelLine(barId, txtId) {
  $(txtId).textContent = 'Cấp ' + getLevel() + ' · ' + getExp() + '/' + expNeed(getLevel()) + ' ⭐';
  $(barId).style.width = Math.min(100, getExp() / expNeed(getLevel()) * 100) + '%';
}

export function showStart() {
  $('start-day').textContent = 'Ngày ' + G.day;
  $('start-goal').textContent = G.cfg.goal;
  $('start-gold').textContent = getGold();
  fillLevelLine('start-exp-fill', 'start-lv');
  // nhắc nhẹ khi đã đủ vàng mua nâng cấp đáng giá nhất
  const tip = $('start-tip');
  const staffCost = nextCost('staff');
  let tipMsg = '';
  if (staffCost != null && getGold() >= staffCost && G.day >= 3)
    tipMsg = '💡 Đủ vàng thuê thêm phục vụ rồi — ghé 🛍️ Nâng Cấp nhé!';
  else if (nextCost('pan') != null && getGold() >= nextCost('pan') && G.day >= 4 && staffCount() > 1)
    tipMsg = '💡 Mua thêm chảo để bếp ra món nhanh hơn nhé!';
  tip.textContent = tipMsg;
  tip.classList.toggle('show', !!tipMsg);

  const row = $('start-menu');
  row.innerHTML = '';
  for (const k of G.cfg.menu) {
    const d = DISHES[k];
    const chip = document.createElement('div');
    chip.className = 'dish-chip';
    chip.innerHTML = '<span class="e">' + d.icon + '</span>' + d.name + ' · ' + d.price + '💰';
    row.appendChild(chip);
  }
  $('start-howto').style.display = G.day <= 2 ? '' : 'none';
  $('ov-start').classList.add('show');
}

export function hideStart() { $('ov-start').classList.remove('show'); }

/* ── màn hình kết thúc ngày ── */

export function showEnd({ passed, stars }) {
  $('end-title').textContent = passed ? 'Tuyệt Vời! 🎉' : 'Ôi, Chưa Đủ...';
  $('end-money').textContent = '💰 ' + G.money + ' / ' + G.cfg.goal;
  $('end-sub').textContent =
    '😊 ' + G.paidCount + ' khách hài lòng' +
    (G.angryCount ? ' · 💢 ' + G.angryCount + ' khách bỏ về' : '') +
    ' · +' + G.dayExp + ' ⭐ kinh nghiệm';
  fillLevelLine('end-exp-fill', 'end-lv');
  const lvUp = $('end-levelup');
  if (G.levelUpPending > 0) {
    lvUp.textContent = '🎊 Lên cấp ' + getLevel() + '! Tủ đồ có món mới đấy!';
    lvUp.classList.add('show');
    setTimeout(sLevel, 900);
  } else lvUp.classList.remove('show');
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
  $('shop-gold').textContent = getGold();
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
      if (buy(btn.dataset.key)) { sCash(); renderShop(); $('start-gold').textContent = getGold(); }
      else sNope();
    });
  });
}

/* ── tủ đồ: tuỳ chỉnh cô chủ ── */

let wardCat = 'hair';

function drawWardPreview() {
  const cv = $('ward-cv');
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const w = 190, h = 232;
  cv.width = w * dpr; cv.height = h * dpr;
  cv.style.width = w + 'px'; cv.style.height = h + 'px';
  const ctx = cv.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, w, h);
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, '#fff6ea');
  g.addColorStop(1, '#ffe2ec');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = 'rgba(200,150,120,.18)';
  ctx.beginPath(); ctx.ellipse(w / 2, h - 30, 62, 16, 0, 0, 7); ctx.fill();
  drawPerson(ctx, w / 2, h - 34, 1.42, getLook(), { mood: 1, happy: true });
}

export function renderWardrobe() {
  $('ward-gold').textContent = getGold();
  $('ward-lv').textContent = getLevel();

  const tabs = $('ward-tabs');
  tabs.innerHTML = '';
  for (const key of Object.keys(CATS)) {
    const c = CATS[key];
    const b = document.createElement('button');
    b.className = 'ward-tab' + (key === wardCat ? ' on' : '');
    b.innerHTML = '<span>' + c.icon + '</span>' + c.name;
    b.addEventListener('click', () => { wardCat = key; sSelect(); renderWardrobe(); });
    tabs.appendChild(b);
  }

  const grid = $('ward-items');
  grid.innerHTML = '';
  for (const item of CATS[wardCat].items) {
    const owned = isOwned(wardCat, item);
    const locked = isLocked(item);
    const on = equippedOf(wardCat) === item.id;
    const b = document.createElement('button');
    b.className = 'ward-item' + (on ? ' on' : '') + (locked ? ' locked' : '');
    const ico = item.swatch
      ? '<span class="ward-sw" style="background:' + item.swatch + '"></span>'
      : '<span class="ward-emo">' + (item.emoji || '✨') + '</span>';
    const tag = locked ? '🔒 Cấp ' + item.lv
      : on ? 'Đang mặc ✓'
      : owned ? 'Đã có' : item.price + ' 💰';
    b.innerHTML = ico + '<span class="ward-name">' + item.name + '</span>' +
      '<span class="ward-tag' + (locked ? ' lock' : on ? ' on' : owned ? '' : ' buy') + '">' + tag + '</span>';
    b.addEventListener('click', () => {
      const r = chooseItem(wardCat, item);
      if (r === 'bought') sCash();
      else if (r === 'equipped') sSelect();
      else sNope();
      renderWardrobe();
      $('start-gold').textContent = getGold();
    });
    grid.appendChild(b);
  }
  drawWardPreview();
}

/* ── trang trí nhà hàng ── */

let decorCat = 'wall';

export function renderDecor() {
  $('decor-gold').textContent = getGold();
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

/* ── nối nút bấm ── */

export function bindUi({ onStart, onRetry, onNext }) {
  $('btn-start').addEventListener('click', onStart);
  $('btn-retry').addEventListener('click', onRetry);
  $('btn-next').addEventListener('click', onNext);
  $('btn-shop').addEventListener('click', () => { sSelect(); renderShop(); $('ov-shop').classList.add('show'); });
  $('btn-shop-close').addEventListener('click', () => { sSelect(); $('ov-shop').classList.remove('show'); });
  $('btn-ward').addEventListener('click', () => { sSelect(); renderWardrobe(); $('ov-ward').classList.add('show'); });
  $('btn-ward-close').addEventListener('click', () => { sSelect(); $('ov-ward').classList.remove('show'); });
  // trang trí: tạm ẩn thẻ bắt đầu để thấy quán đổi ngay phía sau
  $('btn-decor').addEventListener('click', () => {
    sSelect();
    renderDecor();
    $('ov-start').classList.remove('show');
    $('ov-decor').classList.add('show');
  });
  $('btn-decor-close').addEventListener('click', () => {
    sSelect();
    $('ov-decor').classList.remove('show');
    $('start-gold').textContent = getGold();
    $('ov-start').classList.add('show');
  });
}
