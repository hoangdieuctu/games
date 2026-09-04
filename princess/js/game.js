// ── Vòng chơi: so sánh với mẫu, chọn vật phẩm, gợi ý, mua, hoàn thành ──
import { SLOTS, SLOT_BY_ID, DEFAULT_LOOK, TOTAL_LEVELS, HINT_LEVELS, HINT_PRICE, activeSlots, itemOf, levelReward } from './config.js';
import { S, save, owns, own, unlockedLevel, totalStars } from './state.js';
import { getTarget, skinFor, similarity, starsFor } from './levels.js';
import { renderPrincess, princessMarkup } from './princess.js';
import { $, refreshGems, bump, toast, showOverlay, hideOverlay, confetti, sparkle } from './ui.js';
import { openMinigame } from './minigame.js';
import { sTap, sUp, sDown, sNope, sCash, sHint, sStar, sFanfare } from './audio.js';

export const G = { level: 1, target: null, look: null, tab: 'hair', pct: 0, hintSlot: null, hintTimer: 0, pending: null };

/* ═══ MÀN HÌNH ═══ */
export function showScreen(id) {
  document.querySelectorAll('.screen').forEach((s) => s.classList.toggle('show', s.id === id));
}

/* ═══ BẢN ĐỒ ═══ */
export function openMap() {
  showScreen('scr-map');
  refreshGems();
  $('map-stars').textContent = totalStars();
  const grid = $('map-grid');
  grid.innerHTML = '';
  const cur = unlockedLevel();
  for (let lv = 1; lv <= TOTAL_LEVELS; lv++) {
    const st = S.stars[lv] || 0;
    const b = document.createElement('button');
    b.className = 'node' + (lv > cur ? ' locked' : '') + (lv === cur && !S.stars[lv] ? ' current' : '');
    b.innerHTML = '<div class="num">' + lv + '</div>' +
      '<div class="st">' + [1, 2, 3].map((i) => (i <= st ? '<b>★</b>' : '★')).join('') + '</div>' +
      '<div class="lbl">' + activeSlots(lv).length + ' mục</div>';
    if (lv <= cur) b.addEventListener('click', () => { sTap(); startLevel(lv); });
    else b.addEventListener('click', () => { sNope(); toast('🔒 Hãy hoàn thành vòng trước đã nhé!'); });
    grid.appendChild(b);
  }
}

/* ═══ BẮT ĐẦU VÒNG ═══ */
export function startLevel(lv) {
  G.level = lv;
  G.target = getTarget(lv);
  G.look = Object.assign({}, DEFAULT_LOOK, { skin: skinFor(lv) });
  G.tab = activeSlots(lv)[0];
  clearHint();
  $('g-level').textContent = lv;
  showScreen('scr-game');
  refreshGems();
  renderPrincess($('svg-model'), G.target, { idp: 'model' });
  renderAll(true);
}

function renderAll(silent) {
  renderPrincess($('svg-mine'), G.look, { idp: 'mine' });
  renderTabs();
  renderOptions();
  updateMeter(silent);
}

/* ═══ THANH % GIỐNG ═══ */
function updateMeter(silent) {
  const { pct } = similarity(G.look, G.target, G.level);
  const prev = G.pct; G.pct = pct;
  $('meter-fill').style.width = pct + '%';
  $('meter-txt').textContent = 'Giống ' + pct + '%';
  const ready = pct >= 90;
  $('meter').classList.toggle('ready', ready);
  const done = $('g-done');
  done.disabled = !ready;
  done.classList.toggle('ready', ready);
  done.textContent = pct === 100 ? 'Hoàn thành ★★★' : ready ? 'Hoàn thành ✔' : 'Chưa đủ 90%';
  if (silent) return;
  if (pct > prev) { sUp(); sparkle($('fx-mine'), pct === 100 ? 16 : 7); bump('meter'); }
  else if (pct < prev) { sDown(); const p = $('svg-mine').parentElement; p.classList.remove('shake'); void p.offsetWidth; p.classList.add('shake'); }
  else sTap();
  if (pct === 100 && prev !== 100) toast('💯 Giống hoàn toàn! Nhấn Hoàn thành để lấy 3 sao ⭐⭐⭐');
  else if (ready && prev < 90) toast('✨ Đủ 90%! Có thể hoàn thành, hoặc tiếp tục để lấy thêm sao');
}

/* ═══ TAB & VẬT PHẨM ═══ */
function renderTabs() {
  const act = activeSlots(G.level);
  const tabs = $('tabs');
  tabs.innerHTML = '';
  for (const sid of act) {
    const s = SLOT_BY_ID[sid];
    const b = document.createElement('button');
    b.className = 'tab' + (sid === G.tab ? ' on' : '') + (sid === G.hintSlot ? ' hintflash' : '');
    b.innerHTML = '<span class="ico">' + s.icon + '</span><span>' + s.name + '</span>';
    b.addEventListener('click', () => { if (G.tab !== sid) { sTap(); G.tab = sid; renderTabs(); renderOptions(); } });
    tabs.appendChild(b);
  }
  const on = tabs.querySelector('.tab.on');
  if (on) on.scrollIntoView({ inline: 'center', block: 'nearest' });
}

function thumbMarkup(slot, item, look) {
  if (slot.type === 'color') {
    if (!item.color) return '<div class="swatch none">✕</div>';
    return '<div class="swatch" style="background:' + item.color + '"></div>';
  }
  const l = Object.assign({}, look, { [slot.id]: item.id });
  return '<div class="thumb"><svg viewBox="' + slot.crop + '">' + princessMarkup(l, { idp: 'th-' + slot.id + '-' + item.id }) + '</svg></div>';
}

function renderOptions() {
  const slot = SLOT_BY_ID[G.tab];
  const box = $('options');
  box.innerHTML = '';
  for (const it of slot.items) {
    const has = owns(slot.id, it.id);
    const b = document.createElement('button');
    const hinted = G.hintSlot === slot.id && G.target[slot.id] === it.id;
    b.className = 'opt' + (G.look[slot.id] === it.id ? ' on' : '') + (has ? '' : ' locked') + (hinted ? ' hinted' : '');
    b.innerHTML = thumbMarkup(slot, it, G.look) + '<span class="nm">' + it.name + '</span>' +
      (has ? '' : '<span class="price">🔒 ' + it.price + ' 💎</span>') + (hinted ? '<span class="hintmark">🪞</span>' : '');
    b.addEventListener('click', () => pick(slot.id, it.id));
    box.appendChild(b);
  }
  const on = box.querySelector('.opt.on');
  if (on) on.scrollIntoView({ inline: 'center', block: 'nearest' });
}

function pick(slotId, itemId) {
  if (!owns(slotId, itemId)) { openBuy(slotId, itemId); return; }
  if (G.look[slotId] === itemId) { sTap(); return; }
  G.look[slotId] = itemId;
  if (G.hintSlot === slotId && G.target[slotId] === itemId) clearHint();
  renderAll(false);
}

/* ═══ MUA VẬT PHẨM ═══ */
function openBuy(slotId, itemId) {
  const slot = SLOT_BY_ID[slotId], it = itemOf(slotId, itemId);
  G.pending = { slotId, itemId };
  sTap();
  $('buy-title').textContent = '🛍️ ' + slot.name;
  $('buy-preview').innerHTML = slot.type === 'color'
    ? '<div class="swatch" style="background:' + (it.color || '#eee') + '"></div>'
    : '<svg viewBox="' + slot.crop + '">' + princessMarkup(Object.assign({}, G.look, { [slotId]: itemId }), { idp: 'buy' }) + '</svg>';
  $('buy-name').textContent = it.name;
  $('buy-price').textContent = it.price;
  $('buy-have').textContent = S.gems;
  const enough = S.gems >= it.price;
  $('buy-msg').textContent = enough ? '' : 'Chưa đủ kim cương. Chơi mini game để kiếm thêm nhé!';
  $('buy-ok').hidden = !enough;
  $('buy-mini').hidden = enough;
  showOverlay('ov-buy');
}

function confirmBuy() {
  const p = G.pending; if (!p) return;
  const it = itemOf(p.slotId, p.itemId);
  if (S.gems < it.price) { sNope(); return; }
  S.gems -= it.price; own(p.slotId, p.itemId); save();
  sCash(); refreshGems(); bump('g-gems');
  hideOverlay('ov-buy');
  toast('🛍️ Đã mua ' + it.name + '!');
  G.look[p.slotId] = p.itemId;
  if (G.hintSlot === p.slotId && G.target[p.slotId] === p.itemId) clearHint();
  G.pending = null;
  renderAll(false);
}

/* ═══ GƯƠNG THẦN (GỢI Ý) ═══ */
function useHint() {
  if (G.pct >= 100) { sTap(); toast('💯 Đã giống hoàn toàn rồi!'); return; }
  if (S.hints <= 0) { sNope(); $('nohint-price').textContent = HINT_PRICE; showOverlay('ov-nohint'); return; }
  const wrong = activeSlots(G.level).filter((sid) => G.look[sid] !== G.target[sid]);
  if (!wrong.length) return;
  S.hints--; save(); refreshGems(); bump('g-hint');
  sHint();
  const sid = wrong[Math.floor(Math.random() * wrong.length)];
  G.hintSlot = sid; G.tab = sid;
  renderTabs(); renderOptions();
  const slot = SLOT_BY_ID[sid];
  toast('🪞 Gương thần: hãy xem lại "' + slot.name + '" — ' + itemOf(sid, G.target[sid]).name + '!', 4000);
  clearTimeout(G.hintTimer);
  G.hintTimer = setTimeout(() => { clearHint(); renderTabs(); renderOptions(); }, 8000);
}
function clearHint() { G.hintSlot = null; clearTimeout(G.hintTimer); }

function buyHint() {
  if (S.gems < HINT_PRICE) { sNope(); toast('Chưa đủ 💎 để mua gương thần'); return; }
  S.gems -= HINT_PRICE; S.hints++; save(); refreshGems(); sCash();
  hideOverlay('ov-nohint'); toast('🪞 Đã mua 1 gương thần!');
}

/* ═══ HOÀN THÀNH ═══ */
function complete() {
  if (G.pct < 90) return;
  const stars = starsFor(G.pct);
  const prevStars = S.stars[G.level] || 0;
  const reward = levelReward(G.level, stars);
  S.gems += reward;
  if (stars > prevStars) S.stars[G.level] = stars;
  let gift = false;
  if (HINT_LEVELS.includes(G.level) && !S.hintGranted[G.level]) { S.hints++; S.hintGranted[G.level] = true; gift = true; }
  save(); refreshGems();
  clearHint();

  $('cp-title').textContent = stars === 3 ? 'Hoàn hảo! 👑' : stars === 2 ? 'Xuất sắc! 🎉' : 'Làm tốt lắm! 💖';
  $('cp-sub').textContent = 'Giống ' + G.pct + '%' + (stars < 3 ? ' · Chơi lại để đạt 100% và lấy 3 sao' : '');
  $('cp-reward').textContent = '+' + reward + ' 💎';
  $('cp-gift').hidden = !gift;
  $('cp-next').hidden = G.level >= TOTAL_LEVELS;
  const spans = $('cp-stars').querySelectorAll('span');
  spans.forEach((s) => s.classList.remove('lit'));
  confetti($('confetti'), stars === 3 ? 60 : 30);
  showOverlay('ov-complete');
  sFanfare();
  for (let i = 0; i < stars; i++) setTimeout(() => { spans[i].classList.add('lit'); sStar(i); }, 500 + i * 380);
}

function nextLevel() {
  hideOverlay('ov-complete');
  if (G.level >= TOTAL_LEVELS) {
    $('final-stars').textContent = totalStars();
    renderPrincess($('final-hero'), G.target, { idp: 'final' });
    confetti($('confetti2'), 70);
    showOverlay('ov-final');
    return;
  }
  startLevel(G.level + 1);
}

/* ═══ GẮN SỰ KIỆN ═══ */
export function bindGame() {
  $('g-back').addEventListener('click', () => { sTap(); clearHint(); openMap(); });
  $('g-done').addEventListener('click', complete);
  $('g-hint').addEventListener('click', useHint);
  $('g-mini').addEventListener('click', () => { sTap(); openMinigame(() => { refreshGems(); renderOptions(); }); });
  $('map-mini').addEventListener('click', () => { sTap(); openMinigame(() => refreshGems()); });

  $('buy-close').addEventListener('click', () => { sTap(); hideOverlay('ov-buy'); G.pending = null; });
  $('buy-ok').addEventListener('click', confirmBuy);
  $('buy-mini').addEventListener('click', () => {
    sTap(); hideOverlay('ov-buy');
    openMinigame(() => { refreshGems(); if (G.pending) openBuy(G.pending.slotId, G.pending.itemId); });
  });
  $('nohint-close').addEventListener('click', () => { sTap(); hideOverlay('ov-nohint'); });
  $('nohint-buy').addEventListener('click', buyHint);
  $('nohint-mini').addEventListener('click', () => { sTap(); hideOverlay('ov-nohint'); openMinigame(() => refreshGems()); });

  $('cp-map').addEventListener('click', () => { sTap(); hideOverlay('ov-complete'); openMap(); });
  $('cp-retry').addEventListener('click', () => { sTap(); hideOverlay('ov-complete'); startLevel(G.level); });
  $('cp-next').addEventListener('click', () => { sTap(); nextLevel(); });
  $('final-map').addEventListener('click', () => { sTap(); hideOverlay('ov-final'); openMap(); });
  $('mini-x').addEventListener('click', () => { sTap(); import('./minigame.js').then((m) => m.closeMinigame()); });
}
