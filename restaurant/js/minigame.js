// ── Mini-game giữa ngày: chuông đơn đặc biệt reo, chơi xong nhận vàng + kinh nghiệm ──
// Có hai trò đổi phiên nhau: canh lửa nướng bánh và nhớ công thức món.

import { G } from './state.js';
import { bonusDone } from './game.js';
import { addGold, addExp } from './player.js';
import { updateHud, bump } from './ui.js';
import { sSelect, sDone, sNope, sCash, sBell } from './audio.js';

const $ = (id) => document.getElementById(id);
const INGREDIENTS = ['🍅', '🧀', '🥬', '🍗', '🍄', '🌶️', '🥕', '🍤'];

let raf = 0;

export function openMinigame() {
  G.paused = true;
  sBell();
  $('ov-mini').classList.add('show');
  if (Math.random() < 0.5) playTiming(); else playRecipe();
}

function closeMinigame() {
  cancelAnimationFrame(raf);
  $('ov-mini').classList.remove('show');
  bonusDone();
}

function reward(gold, exp, title) {
  addGold(gold);
  addExp(exp);
  updateHud();
  bump('money-pill'); bump('exp-pill');
  if (gold > 0) sCash(); else sNope();
  $('mini-body').innerHTML =
    '<h1>' + title + '</h1>' +
    '<div class="mini-prize"><span>+' + gold + ' 💰</span><span class="exp">+' + exp + ' ⭐</span></div>' +
    '<button class="big-btn" id="mini-close">Quay Lại Quán ➜</button>';
  $('mini-close').addEventListener('click', closeMinigame);
}

/* ── Trò 1: canh lửa nướng bánh ── */

function playTiming() {
  const TURNS = 3;
  let turn = 0, gold = 0, exp = 0;
  let center = 0, half = 0, speed = 1, running = false, pos = 0;

  $('mini-body').innerHTML =
    '<h1>🔥 Canh Lửa Nướng Bánh</h1>' +
    '<p class="mini-sub">Chạm <b>DỪNG</b> khi kim vào vùng xanh — trúng ô vàng được gấp đôi!</p>' +
    '<div class="mini-track" id="mg-track">' +
      '<div class="zone" id="mg-zone"></div>' +
      '<div class="bulls" id="mg-bulls"></div>' +
      '<div class="needle" id="mg-needle"></div>' +
    '</div>' +
    '<div class="mini-dots" id="mg-dots"></div>' +
    '<button class="big-btn" id="mg-stop">DỪNG! 🔥</button>';

  const dots = () => {
    if (!$('mg-dots')) return;
    $('mg-dots').innerHTML = Array.from({ length: TURNS }, (_, i) =>
      '<span class="dot' + (i < turn ? ' on' : '') + '"></span>').join('');
  };

  const startTurn = () => {
    if (!$('mg-zone')) return;
    center = 0.2 + Math.random() * 0.6;
    half = (0.13 - turn * 0.02) ;
    speed = 0.9 + turn * 0.28;
    $('mg-zone').style.left = ((center - half) * 100) + '%';
    $('mg-zone').style.width = (half * 200) + '%';
    $('mg-bulls').style.left = ((center - half * 0.28) * 100) + '%';
    $('mg-bulls').style.width = (half * 56) + '%';
    running = true;
    dots();
    const t0 = performance.now();
    const loop = (t) => {
      const needle = $('mg-needle');
      if (!running || !needle) return;
      const k = (t - t0) / 1000 * speed;
      pos = 0.5 - 0.5 * Math.cos(k * Math.PI * 1.6);
      needle.style.left = (pos * 100) + '%';
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
  };

  const stop = () => {
    const track = $('mg-track');
    if (!running || !track) return;
    running = false;
    cancelAnimationFrame(raf);
    const d = Math.abs(pos - center);
    if (d < half * 0.28) { gold += 22; exp += 9; sDone(); track.classList.add('hit'); }
    else if (d < half) { gold += 12; exp += 5; sSelect(); track.classList.add('hit'); }
    else { sNope(); track.classList.add('miss'); }
    turn++;
    dots();
    setTimeout(() => {
      if (!$('mg-track')) return; // màn hình đã đóng
      track.classList.remove('hit', 'miss');
      if (turn < TURNS) startTurn();
      else reward(gold, exp, gold >= 40 ? 'Bánh Hoàn Hảo! 🎉' : gold > 0 ? 'Ngon Lắm! 😋' : 'Cháy Mất Rồi 😅');
    }, 620);
  };

  $('mg-stop').addEventListener('click', stop);
  $('mg-track').addEventListener('pointerdown', stop);
  startTurn();
}

/* ── Trò 2: nhớ công thức món ── */

function playRecipe() {
  const n = 3 + (G.day >= 4 ? 1 : 0);
  const pool = [...INGREDIENTS].sort(() => Math.random() - 0.5).slice(0, 6);
  const recipe = Array.from({ length: n }, () => pool[Math.floor(Math.random() * pool.length)]);
  let step = 0, done = false;

  $('mini-body').innerHTML =
    '<h1>👩‍🍳 Nhớ Công Thức</h1>' +
    '<p class="mini-sub">Nhớ thứ tự nguyên liệu rồi chạm lại cho đúng nhé!</p>' +
    '<div class="mini-recipe" id="mg-show">' + recipe.map((e, i) =>
      '<span class="ing" style="animation-delay:' + (i * 0.18) + 's">' + e + '</span>').join('') + '</div>' +
    '<div class="mini-count" id="mg-count">3</div>';

  let left = 3;
  const tick = setInterval(() => {
    const cd = $('mg-count');
    if (!cd) { clearInterval(tick); return; } // màn hình đã đóng
    left--;
    if (left > 0) { cd.textContent = left; sSelect(); return; }
    clearInterval(tick);
    askBack();
  }, 1000);

  function askBack() {
    $('mini-body').innerHTML =
      '<h1>👩‍🍳 Nhớ Công Thức</h1>' +
      '<p class="mini-sub">Chạm đúng thứ tự vừa xem!</p>' +
      '<div class="mini-slots" id="mg-slots">' +
        recipe.map(() => '<span class="slot"></span>').join('') + '</div>' +
      '<div class="mini-grid" id="mg-grid">' +
        pool.map(e => '<button class="ing-btn" data-e="' + e + '">' + e + '</button>').join('') + '</div>';

    $('mg-grid').querySelectorAll('.ing-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        if (done) return;
        const e = btn.dataset.e;
        const slots = $('mg-slots').children;
        if (e === recipe[step]) {
          slots[step].textContent = e;
          slots[step].classList.add('ok');
          step++;
          sSelect();
          if (step >= recipe.length) {
            done = true;
            sDone();
            setTimeout(() => reward(14 + step * 7, 5 + step * 3, 'Chuẩn Công Thức! 🎉'), 450);
          }
        } else {
          done = true;
          btn.classList.add('wrong');
          sNope();
          setTimeout(() => reward(step * 6, step * 2, step ? 'Gần Đúng Rồi! 😊' : 'Tiếc Quá 😅'), 550);
        }
      });
    });
  }
}
