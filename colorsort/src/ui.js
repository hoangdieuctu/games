// ── Màn hình, thanh thông tin, cửa hàng và bảng chúc mừng ──
import { ITEMS } from './config.js';
import { save, persist, addGems, addItem, useItem, saveBoard, clearBoard, validBoard } from './state.js';
import * as A from './audio.js';
import * as Game from './game.js';
import { G } from './game.js';

const $ = (id) => document.getElementById(id);
const els = {};
let pendingNext = 1;

export function initUI() {
  ['scr-title', 'scr-game', 'ov-win', 'ov-shop', 'ov-menu', 'loading',
   'g-level', 'g-moves', 'g-gems', 'g-chal', 'title-meta', 'wand-tip',
   'c-hint', 'c-wand', 'c-tube', 'win-stars', 'win-level', 'win-moves',
   'win-gems', 'win-item', 'win-item-ic', 'win-item-tx', 'shop-gems', 'shop-list',
  ].forEach((id) => { els[id] = $(id); });

  buildBubbles();
  buildShop();
  wire();
  syncTitle();
}

function buildBubbles() {
  const box = $('title-bubbles');
  const cols = ['#ff3355', '#2f7dff', '#ffcc1a', '#2ec25f', '#a34cf0', '#ff6ec7', '#12cfd0'];
  for (let i = 0; i < 14; i++) {
    const b = document.createElement('i');
    const s = 18 + Math.random() * 54;
    b.style.cssText = `width:${s}px;height:${s}px;left:${Math.random() * 100}%;` +
      `animation-duration:${10 + Math.random() * 12}s;animation-delay:${-Math.random() * 18}s;` +
      `box-shadow:inset -6px -8px 14px ${cols[i % cols.length]}aa, 0 0 18px ${cols[i % cols.length]}66;`;
    box.appendChild(b);
  }
}

function wire() {
  $('btn-play').addEventListener('click', () => { A.ac(); A.sTap(); A.startMusic(); play(save.level); });
  $('g-home').addEventListener('click', () => { A.sTap(); openMenu(); });
  $('btn-resume').addEventListener('click', () => { A.sTap(); els['ov-menu'].hidden = true; });
  $('btn-menu-restart').addEventListener('click', () => { A.sTap(); els['ov-menu'].hidden = true; Game.restartLevel(); });

  $('g-shop').addEventListener('click', () => { A.sTap(); openShop(); });
  $('btn-shop-close').addEventListener('click', () => { A.sTap(); els['ov-shop'].hidden = true; });

  $('t-undo').addEventListener('click', () => { Game.undo(); });
  $('t-again').addEventListener('click', () => { A.sTap(); Game.restartLevel(); });

  $('t-hint').addEventListener('click', () => {
    if (G.locked || G.finished) return;
    if (!save.items.hint) { needGems('hint'); return; }
    if (Game.showHint()) { useItem('hint'); syncHud(); }
  });
  $('t-wand').addEventListener('click', () => {
    if (G.locked || G.finished) return;
    if (G.wandMode) { Game.disarmWand(); syncHud(); return; }
    if (!save.items.wand) { needGems('wand'); return; }
    if (Game.armWand()) { useItem('wand'); A.sTap(); syncHud(); }
  });
  $('t-tube').addEventListener('click', () => {
    if (G.locked || G.finished) return;
    if (!save.items.tube) { needGems('tube'); return; }
    if (Game.addTube()) { useItem('tube'); syncHud(); }
  });

  $('btn-next').addEventListener('click', () => { A.sTap(); els['ov-win'].hidden = true; play(pendingNext); });
  $('btn-replay').addEventListener('click', () => {
    A.sTap();
    els['ov-win'].hidden = true;
    // Quay lại chơi vòng vừa xong thì tiến trình cũng phải lùi về vòng đó,
    // không thì lần mở sau bé lại nhảy sang vòng kế tiếp.
    save.level = G.level;
    persist();
    Game.restartLevel();
  });

  A.initSoundToggle(document.querySelector('.snd-btn'));
  A.initMusicToggle(document.querySelector('.music-btn'));
}

function needGems(key) {
  A.sNope();
  openShop(key);
}

/* ══ CHUYỂN MÀN ══ */
export function play(level) {
  els['scr-title'].classList.remove('show');
  els['scr-game'].classList.add('show');
  els['loading'].hidden = false;
  // Nhường một nhịp để vòng quay kịp hiện ra trước khi sinh vòng chơi.
  setTimeout(() => {
    Game.resize();
    // Còn ván dở đúng vòng này thì dựng lại đúng chỗ bé đang chơi.
    if (validBoard(save.board, level)) Game.restoreLevel(save.board);
    else Game.startLevel(level);
    els['loading'].hidden = true;
    A.startMusic();
  }, 60);
}

function openMenu() { els['ov-menu'].hidden = false; }

/* ══ THANH THÔNG TIN ══ */
// Cất ván sau mỗi nước đi để đóng máy giữa chừng vẫn chơi tiếp được.
export function persistBoard() {
  const b = Game.boardSnapshot();
  if (b) saveBoard(b);
}

let stuckTimer = 0;
export function showStuck() {
  const el = $('stuck-tip');
  el.hidden = false;
  A.sNope();
  clearTimeout(stuckTimer);
  stuckTimer = setTimeout(() => { el.hidden = true; }, 4200);
}

export function syncHud() {
  els['g-level'].textContent = G.level;
  els['g-moves'].textContent = G.moves;
  els['g-gems'].textContent = save.gems;
  els['g-chal'].hidden = !(G.plan && G.plan.challenge);
  for (const k of ['hint', 'wand', 'tube']) {
    const n = save.items[k] || 0;
    els['c-' + k].textContent = n;
    $('t-' + k).classList.toggle('empty', n === 0);
  }
  $('t-wand').classList.toggle('armed', G.wandMode);
  els['wand-tip'].hidden = !G.wandMode;
  $('t-undo').disabled = !G.history.length || G.locked;
}

function syncTitle() {
  if (save.best <= 1 && !validBoard(save.board, save.level)) {
    els['title-meta'].textContent = 'Vòng đầu tiên đang đợi bé!';
    return;
  }
  const dang = validBoard(save.board, save.level) && save.board.moves > 0 ? ' · đang chơi dở' : '';
  els['title-meta'].textContent =
    `Bé đang ở vòng ${save.level} · ⭐ ${save.stars} · 💎 ${save.gems}${dang}`;
}

/* ══ CỬA HÀNG ══ */
function buildShop() {
  const list = els['shop-list'];
  list.innerHTML = '';
  for (const [key, it] of Object.entries(ITEMS)) {
    const row = document.createElement('div');
    row.className = 'shop-row';
    row.dataset.key = key;
    row.innerHTML = `<span class="ic">${it.icon}</span>
      <span class="info"><span class="nm">${it.name}</span>
      <span class="ds">${it.desc}</span>
      <span class="have">Đang có: <b data-have>0</b></span></span>
      <button class="buy">💎 ${it.price}</button>`;
    row.querySelector('.buy').addEventListener('click', () => buy(key));
    list.appendChild(row);
  }
}

function buy(key) {
  const it = ITEMS[key];
  if (save.gems < it.price) { A.sNope(); return; }
  addGems(-it.price);
  addItem(key, 1);
  A.sCoin();
  refreshShop();
  syncHud();
}

export function openShop(highlight) {
  els['ov-shop'].hidden = false;
  refreshShop();
  if (highlight) {
    const row = els['shop-list'].querySelector(`[data-key="${highlight}"]`);
    if (row) row.style.outline = '3px solid #ffd24a';
    setTimeout(() => { if (row) row.style.outline = ''; }, 1600);
  }
}

function refreshShop() {
  els['shop-gems'].textContent = save.gems;
  els['shop-list'].querySelectorAll('.shop-row').forEach((row) => {
    const key = row.dataset.key;
    row.querySelector('[data-have]').textContent = save.items[key] || 0;
    row.querySelector('.buy').disabled = save.gems < ITEMS[key].price;
  });
}

/* ══ CHÚC MỪNG ══ */
export function showWin({ level, moves, stars }) {
  const bonus = G.plan && G.plan.challenge ? 12 : 0;
  const gems = 8 + stars * 4 + bonus;
  addGems(gems);
  save.stars += stars;
  save.level = level + 1;
  save.best = Math.max(save.best, save.level);
  save.board = null;          // vòng này xong rồi, vòng sau xếp bàn mới
  persist();
  pendingNext = level + 1;

  // Cứ 4 vòng tặng thêm một vật phẩm ngẫu nhiên.
  let giftKey = null;
  if (level % 4 === 0) {
    const keys = Object.keys(ITEMS);
    giftKey = keys[(Math.random() * keys.length) | 0];
    addItem(giftKey, 1);
  }

  els['win-level'].textContent = level;
  els['win-moves'].textContent = moves;
  els['win-gems'].textContent = '+' + gems;
  els['win-item'].hidden = !giftKey;
  if (giftKey) {
    els['win-item-ic'].textContent = ITEMS[giftKey].icon;
    els['win-item-tx'].textContent = '+1';
  }

  const sp = els['win-stars'].children;
  for (const s of sp) s.classList.remove('on');
  els['ov-win'].hidden = false;
  for (let i = 0; i < stars; i++) {
    setTimeout(() => { sp[i].classList.add('on'); A.sCoin(); }, 260 + i * 280);
  }
  syncHud();
  syncTitle();
}
