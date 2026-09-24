// ── Màn hình, HUD, lớp phủ ──
import { TOTAL_LEVELS, HINT_COST, START_COINS } from './config.js';
import { save, persist, totalStars } from './state.js';
import { THEMES, themeFor } from './themes.js';
import { G, initGame, startLevel, useHint } from './game.js';
import { sfx } from './sound.js';

const $ = (id) => document.getElementById(id);
let tipTimer = 0;

function show(screen) {
  document.querySelectorAll('.screen').forEach((s) => s.classList.toggle('show', s.id === screen));
  if (screen === 'scr-game') { layout(); requestAnimationFrame(layout); }
}
function overlay(id, on) { $(id).hidden = !on; }
function tip(msg, ms = 2200) {
  const t = $('tip'); t.textContent = msg; t.hidden = false;
  clearTimeout(tipTimer); tipTimer = setTimeout(() => { t.hidden = true; }, ms);
}

// ── Xếp hai bức tranh: cạnh nhau hay chồng lên nhau, cái nào to hơn thì chọn ──
export function layout() {
  const wrap = $('panes');
  const W = wrap.clientWidth - 24, H = wrap.clientHeight - 8, gap = 12;
  if (!W || !H) return;
  const row = Math.min((W - gap) / 2, H * 1.6);
  const col = Math.min(W, ((H - gap) / 2) * 1.6);
  const useRow = row >= col;
  wrap.classList.toggle('row', useRow);
  wrap.classList.toggle('col', !useRow);
  const pw = Math.floor(useRow ? row : col), ph = Math.floor(pw / 1.6);
  for (const id of ['pane-l', 'pane-r']) { $(id).style.width = pw + 'px'; $(id).style.height = ph + 'px'; }
}

// ── HUD ──
export function syncHud() {
  const lv = G.level;
  $('g-coins').textContent = save.coins;
  $('title-coins').textContent = save.coins;
  $('lv-coins').textContent = save.coins;
  $('g-sound').textContent = save.sound ? '🔊' : '🔇';
  $('t-hint').disabled = !lv || G.done || save.coins < HINT_COST;
  if (!lv) return;
  $('g-level').textContent = lv.L;
  $('g-theme').textContent = lv.theme.emoji + ' ' + lv.theme.name;
  const n = lv.diffs.length, f = G.found.size;
  $('g-found').textContent = `${f}/${n}`;
  let dots = '';
  for (let i = 0; i < n; i++) dots += `<span class="${i < f ? 'on' : ''}"></span>`;
  $('g-dots').innerHTML = dots;
}

function bumpCoins() {
  for (const id of ['g-coins']) {
    const el = $(id).parentElement;
    el.classList.remove('bump'); void el.offsetWidth; el.classList.add('bump');
  }
}

function syncTitle() {
  const next = save.cur ? save.cur.L : Math.min(save.unlocked, TOTAL_LEVELS);
  $('btn-play').textContent = save.cur ? `Chơi tiếp ▸ Vòng ${next}` : (save.unlocked === 1 && !save.stars[1] ? 'Chơi ngay ▸' : `Vòng ${next} ▸`);
  const stars = totalStars();
  $('title-meta').textContent = stars ? `⭐ ${stars}/${TOTAL_LEVELS * 3} sao · Đã mở ${save.unlocked}/${TOTAL_LEVELS} vòng` : `${TOTAL_LEVELS} vòng · 4 chủ đề · thu thập tiền vàng`;
}

// ── Danh sách vòng ──
function renderLevels() {
  const grid = $('level-grid');
  let html = '';
  for (let L = 1; L <= TOTAL_LEVELS; L++) {
    const th = themeFor(L), st = save.stars[L] || 0;
    const locked = L > save.unlocked;
    const cls = locked ? 'locked' : st ? 'done' : 'next';
    const stars = st ? '★'.repeat(st) + '<i>' + '★'.repeat(3 - st) + '</i>' : (locked ? '' : 'mới');
    html += `<button class="tile ${cls}" data-l="${L}" ${locked ? 'disabled' : ''}>`
      + `<span class="tile-em">${locked ? '🔒' : th.emoji}</span><b>${L}</b><span class="tile-stars">${stars}</span></button>`;
  }
  grid.innerHTML = html;
  $('lv-stars').textContent = `⭐ ${totalStars()}`;
}

function play(L, resume) {
  overlay('ov-win', false); overlay('ov-menu', false);
  startLevel(L, resume);
  show('scr-game');
  syncHud();
}

// ── Lớp phủ thắng ──
function showWin({ L, stars, earned, wrong, hints }) {
  const st = $('win-stars').children;
  for (let i = 0; i < 3; i++) st[i].classList.toggle('lit', i < stars);
  $('win-level').textContent = L;
  $('win-coins').textContent = '+' + earned;
  $('win-line').textContent = `Bấm nhầm ${wrong} lần · Dùng ${hints} gợi ý`;
  const last = L >= TOTAL_LEVELS;
  $('win-ribbon').textContent = last ? '🏆 Hoàn thành tất cả!' : stars === 3 ? 'Tuyệt vời!' : stars === 2 ? 'Giỏi lắm!' : 'Xong rồi!';
  $('btn-next').textContent = last ? 'Chơi lại từ vòng 1 ▸' : 'Vòng tiếp theo ▸';
  $('btn-next').onclick = () => play(last ? 1 : L + 1);
  overlay('ov-win', true);
}

export function initUI() {
  initGame($('pane-l'), $('pane-r'), {
    onChange: syncHud,
    onCoins: bumpCoins,
    onWrong: (pane) => { pane.classList.remove('shake'); void pane.offsetWidth; pane.classList.add('shake'); },
    onNoCoins: () => tip(`Chưa đủ tiền! Gợi ý cần ${HINT_COST} 🪙 — tìm thêm điểm khác nhau để kiếm tiền nhé.`),
    onWin: showWin,
  });

  // Trang đầu
  $('btn-play').onclick = () => { sfx.tap(); if (save.cur) play(save.cur.L, save.cur); else play(Math.min(save.unlocked, TOTAL_LEVELS)); };
  $('btn-levels').onclick = () => { sfx.tap(); renderLevels(); show('scr-levels'); };
  $('lv-back').onclick = () => { syncTitle(); show('scr-title'); };
  $('level-grid').onclick = (e) => {
    const b = e.target.closest('.tile'); if (!b || b.disabled) return;
    sfx.tap(); play(+b.dataset.l);
  };

  // HUD
  $('g-home').onclick = () => { sfx.tap(); overlay('ov-menu', true); };
  $('g-sound').onclick = () => { save.sound = !save.sound; persist(); syncHud(); sfx.tap(); };
  $('t-hint').onclick = () => { if (useHint()) tip('Nhìn vào vòng vàng nhấp nháy nhé! 👀', 1800); };
  $('t-levels').onclick = () => { sfx.tap(); renderLevels(); show('scr-levels'); };
  $('t-again').onclick = () => { sfx.tap(); play(G.level.L); };

  // Lớp phủ
  $('btn-replay').onclick = () => play(G.level.L);
  $('btn-win-levels').onclick = () => { overlay('ov-win', false); renderLevels(); show('scr-levels'); };
  $('btn-resume').onclick = () => overlay('ov-menu', false);
  $('btn-menu-restart').onclick = () => play(G.level.L);
  $('btn-menu-levels').onclick = () => { overlay('ov-menu', false); renderLevels(); show('scr-levels'); };
  $('btn-menu-home').onclick = () => { overlay('ov-menu', false); syncTitle(); show('scr-title'); };

  // Hộp thoại đặt lại
  $('btn-reset').onclick = () => {
    if (!confirm('Xoá toàn bộ tiến trình và bắt đầu lại từ vòng 1?')) return;
    save.coins = START_COINS; save.unlocked = 1; save.stars = {}; save.cur = null; persist();
    syncTitle(); syncHud(); renderLevels();
  };

  window.addEventListener('resize', layout);
  window.addEventListener('orientationchange', () => setTimeout(layout, 120));
  $('hint-cost').textContent = HINT_COST;
  $('theme-list').textContent = THEMES.map((t) => t.emoji + ' ' + t.name).join(' · ');
  syncTitle();
  syncHud();
}
