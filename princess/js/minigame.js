// ── Mini game kiếm kim cương: "Hứng sao rơi" và "Ghép đôi trang sức" ──
import { S, save } from './state.js';
import { $, refreshGems, bump, showOverlay, hideOverlay } from './ui.js';
import { sPop, sFlip, sUp, sNope, sCash, sTick, sTap } from './audio.js';

let raf = 0, timer = 0, onCloseCb = null;

export function openMinigame(onClose) {
  onCloseCb = onClose || null;
  showOverlay('ov-mini');
  chooser();
}

function chooser() {
  $('mini-body').innerHTML =
    '<h1>🎮 Kiếm kim cương</h1>' +
    '<p class="mini-sub">Chọn một trò để kiếm 💎 mua váy áo, trang sức nhé!</p>' +
    '<div class="mini-choose">' +
      '<button class="mini-choice" id="mc-star"><span class="big">🌠</span>Hứng sao rơi<small>Chạm sao trước khi rơi mất · 20 giây</small></button>' +
      '<button class="mini-choice" id="mc-mem"><span class="big">💎</span>Ghép đôi trang sức<small>Lật thẻ tìm cặp giống nhau</small></button>' +
    '</div>';
  $('mc-star').addEventListener('click', () => { sTap(); playStars(); });
  $('mc-mem').addEventListener('click', () => { sTap(); playMemory(); });
}

export function closeMinigame() {
  cancelAnimationFrame(raf); clearInterval(timer);
  hideOverlay('ov-mini');
  if (onCloseCb) onCloseCb();
}

function reward(gems, title, detail) {
  S.gems += gems; S.played++; save();
  refreshGems(); bump('g-gems'); bump('map-gems');
  if (gems > 0) sCash(); else sNope();
  $('mini-body').innerHTML =
    '<h1>' + title + '</h1>' +
    '<p class="mini-sub">' + detail + '</p>' +
    '<div class="mini-prize">+' + gems + ' 💎</div>' +
    '<div class="btn-row"><button class="big-btn ghost" id="mini-again">Chơi tiếp 🎮</button><button class="big-btn" id="mini-back">Quay lại ➜</button></div>';
  $('mini-again').addEventListener('click', chooser);
  $('mini-back').addEventListener('click', closeMinigame);
}

/* ── Trò 1: hứng sao rơi ── */
function playStars() {
  const DUR = 20;
  $('mini-body').innerHTML =
    '<div class="mini-top"><span>🌠 Hứng sao rơi</span><span id="mg-time">⏱ ' + DUR + '</span><span id="mg-score">💎 0</span></div>' +
    '<canvas id="mg-canvas"></canvas>' +
    '<p class="mini-sub" style="margin-top:8px">⭐ = 2 💎 &nbsp;·&nbsp; 💎 lớn = 5 💎 &nbsp;·&nbsp; Chạm thật nhanh!</p>';
  const cv = $('mg-canvas');
  const ctx = cv.getContext('2d');
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const rect = cv.getBoundingClientRect();
  cv.width = rect.width * dpr; cv.height = rect.height * dpr;
  ctx.scale(dpr, dpr);
  const W = rect.width, H = rect.height;

  const items = [], pops = [];
  let score = 0, t0 = performance.now(), last = t0, spawnAt = 0, done = false;

  function spawn(now) {
    const big = Math.random() < 0.15;
    items.push({ x: 30 + Math.random() * (W - 60), y: -30, vy: 60 + Math.random() * 50 + (now - t0) / 1000 * 6, big, r: big ? 26 : 20, rot: Math.random() * 6, spin: (Math.random() - .5) * 3 });
  }
  function star(x, y, r, rot, fill) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.beginPath();
    for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * .45 : r; ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); }
    ctx.closePath(); ctx.fillStyle = fill; ctx.shadowColor = fill; ctx.shadowBlur = 14; ctx.fill(); ctx.restore();
  }
  function gem(x, y, r, rot) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot * 0.3); ctx.beginPath();
    ctx.moveTo(-r, -r * .3); ctx.lineTo(-r * .5, -r); ctx.lineTo(r * .5, -r); ctx.lineTo(r, -r * .3); ctx.lineTo(0, r); ctx.closePath();
    ctx.fillStyle = '#8fd3ff'; ctx.shadowColor = '#bfe9ff'; ctx.shadowBlur = 18; ctx.fill();
    ctx.beginPath(); ctx.moveTo(-r * .5, -r); ctx.lineTo(-r * .2, -r * .3); ctx.lineTo(r * .3, -r * .3); ctx.closePath(); ctx.fillStyle = 'rgba(255,255,255,.6)'; ctx.fill();
    ctx.restore();
  }
  function frame(now) {
    if (done) return;
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    const el = (now - t0) / 1000;
    if (now > spawnAt) { spawn(now); spawnAt = now + 380 + Math.random() * 400 - Math.min(200, el * 8); }
    ctx.clearRect(0, 0, W, H);
    // sao nền
    ctx.fillStyle = 'rgba(255,255,255,.35)';
    for (let i = 0; i < 30; i++) { const sx = (i * 97) % W, sy = (i * 53 + el * 12) % H; ctx.fillRect(sx, sy, 2, 2); }
    for (const it of items) {
      it.y += it.vy * dt; it.rot += it.spin * dt;
      if (it.big) gem(it.x, it.y, it.r, it.rot); else star(it.x, it.y, it.r, it.rot, '#ffd84a');
    }
    for (let i = items.length - 1; i >= 0; i--) if (items[i].y > H + 40) items.splice(i, 1);
    for (let i = pops.length - 1; i >= 0; i--) {
      const p = pops[i]; p.t += dt;
      ctx.globalAlpha = Math.max(0, 1 - p.t * 2); ctx.fillStyle = '#fff'; ctx.font = 'bold 22px Baloo 2, sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(p.txt, p.x, p.y - p.t * 60); ctx.globalAlpha = 1;
      if (p.t > 0.5) pops.splice(i, 1);
    }
    const left = Math.max(0, DUR - el);
    $('mg-time').textContent = '⏱ ' + Math.ceil(left);
    if (left <= 0) { done = true; setTimeout(() => reward(score, score >= 30 ? 'Siêu sao! 🌟' : 'Giỏi lắm! ⭐', 'Bạn hứng được ' + score / 1 + ' kim cương từ bầu trời.'), 300); return; }
    raf = requestAnimationFrame(frame);
  }
  cv.addEventListener('pointerdown', (e) => {
    if (done) return;
    const r = cv.getBoundingClientRect();
    const x = e.clientX - r.left, y = e.clientY - r.top;
    for (let i = items.length - 1; i >= 0; i--) {
      const it = items[i];
      if (Math.hypot(it.x - x, it.y - y) < it.r + 20) {
        const g = it.big ? 5 : 2; score += g;
        pops.push({ x: it.x, y: it.y, t: 0, txt: '+' + g });
        items.splice(i, 1); sPop();
        $('mg-score').textContent = '💎 ' + score;
        return;
      }
    }
  });
  raf = requestAnimationFrame(frame);
}

/* ── Trò 2: ghép đôi trang sức ── */
function playMemory() {
  const EM = ['💍', '💎', '👑', '🎀', '🌸', '🦋'];
  const deck = EM.concat(EM).sort(() => Math.random() - 0.5);
  let open = [], moves = 0, matched = 0, lock = false;
  $('mini-body').innerHTML =
    '<div class="mini-top"><span>💎 Ghép đôi trang sức</span><span id="mm-moves">Lượt: 0</span><span id="mm-pairs">Cặp: 0/6</span></div>' +
    '<div class="mem-grid" id="mm-grid"></div>' +
    '<p class="mini-sub" style="margin-top:10px">Mỗi cặp +4 💎 · Xong trong 9 lượt thưởng thêm +8 💎</p>';
  const grid = $('mm-grid');
  deck.forEach((em, i) => {
    const b = document.createElement('button');
    b.className = 'mem-card'; b.textContent = em; b.dataset.i = i;
    b.addEventListener('click', () => flip(b, em));
    grid.appendChild(b);
  });
  function flip(b, em) {
    if (lock || b.classList.contains('up') || b.classList.contains('ok')) return;
    sFlip(); b.classList.add('up'); open.push({ b, em });
    if (open.length === 2) {
      moves++; $('mm-moves').textContent = 'Lượt: ' + moves;
      lock = true;
      if (open[0].em === open[1].em) {
        setTimeout(() => {
          open.forEach((o) => { o.b.classList.remove('up'); o.b.classList.add('ok'); });
          open = []; lock = false; matched++; sUp();
          $('mm-pairs').textContent = 'Cặp: ' + matched + '/6';
          if (matched === 6) {
            const bonus = moves <= 9 ? 8 : 0;
            setTimeout(() => reward(matched * 4 + bonus, bonus ? 'Trí nhớ siêu phàm! 🧠' : 'Hoàn thành! 💎', 'Bạn ghép đủ 6 cặp trong ' + moves + ' lượt' + (bonus ? ' và nhận thưởng nhanh tay.' : '.')), 500);
          }
        }, 350);
      } else {
        setTimeout(() => { open.forEach((o) => o.b.classList.remove('up')); open = []; lock = false; sTick(); }, 800);
      }
    }
  }
}
