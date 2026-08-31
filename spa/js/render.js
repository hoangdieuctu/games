// ── Vẽ toàn bộ khung cảnh tiệm spa: nền, khu chờ, các ô dịch vụ, quầy, người ──

import { G } from './state.js';
import { SERVICES, PAY_ICON } from './config.js';
import { currentWish, stationFree } from './customers.js';
import { teaTarget } from './staff.js';
import { drawParticles, drawHeart } from './particles.js';
import { drawPerson, drawHeadOnly } from './avatar.js';
import { maskTime, saunaTime } from './upgrades.js';
import { getTheme } from './decor.js';

// bảng màu trang trí đang dùng, cập nhật mỗi khung hình
let T = getTheme();

// cô nhân viên spa: đồng phục hồng, tạp dề trắng, hoa cài tóc
const STAFF_LOOK = {
  skin: '#ffdfc4', hair: 'bun', hairColor: '#6a4020',
  dress: 'classic', dressColor: '#f06292', apron: 'white', acc: 'flower',
};

function rr(x, y, w, h, r) {
  const { ctx } = G;
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function glowRing(x, y, w, h, r, col, speed) {
  const { ctx, K } = G;
  const p = 0.5 + 0.5 * Math.sin(G.time * (speed || 7));
  ctx.strokeStyle = col.replace('%A%', (0.42 + p * 0.5).toFixed(2));
  ctx.lineWidth = (3.5 + p * 3) * K;
  rr(x, y, w, h, r);
  ctx.stroke();
}

/* ══════════════ NỀN TIỆM ══════════════ */

function wallPattern(wallH) {
  const { ctx, W, K } = G;
  const w = T.wall;
  ctx.fillStyle = w.dot;
  if (w.pattern === 'dots' || w.pattern === 'floral') {
    const r = w.pattern === 'floral' ? 7 * K : 4.5 * K;
    for (let x = 24 * K; x < W; x += 54 * K) {
      for (let y = 18 * K; y < wallH - 30 * K; y += 44 * K) {
        const ox = (Math.floor(y / (44 * K)) % 2 ? 27 * K : 0);
        if (w.pattern === 'floral') {
          for (let i = 0; i < 5; i++) {
            const a = (i / 5) * Math.PI * 2;
            ctx.beginPath();
            ctx.ellipse(x + ox + Math.cos(a) * r * 0.7, y + Math.sin(a) * r * 0.7, r * 0.5, r * 0.36, a, 0, 7);
            ctx.fill();
          }
        } else {
          ctx.beginPath(); ctx.arc(x + ox, y, r, 0, 7); ctx.fill();
        }
      }
    }
  } else if (w.pattern === 'stripe') {
    for (let x = 16 * K; x < W; x += 46 * K) ctx.fillRect(x, 0, 16 * K, wallH - 26 * K);
  } else if (w.pattern === 'tile') {
    ctx.strokeStyle = w.dot;
    ctx.lineWidth = 2 * K;
    const th = 34 * K;
    for (let y = 0, r2 = 0; y < wallH - 26 * K; y += th, r2++) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
      for (let x = (r2 % 2 ? 0 : th); x < W; x += th * 2) {
        ctx.beginPath();
        ctx.moveTo(x, y); ctx.lineTo(x, Math.min(y + th, wallH - 26 * K));
        ctx.stroke();
      }
    }
  }
}

// đồ trang trí tường theo bộ người chơi chọn
function drawWallArt(wallH) {
  const { ctx, W, K } = G;
  const w = T.wall;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';

  const shelf = (sx, items) => {
    ctx.fillStyle = w.baseDark;
    rr(sx - 34 * K, wallH * 0.52, 68 * K, 6 * K, 3 * K); ctx.fill();
    ctx.font = `${20 * K}px sans-serif`;
    items.forEach((e, i) => ctx.fillText(e, sx - 20 * K + i * 20 * K, wallH * 0.40));
  };
  const frame = (fx, emo) => {
    ctx.fillStyle = w.baseDark;
    rr(fx - 27 * K, wallH * 0.24, 54 * K, 48 * K, 7 * K); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.75)';
    rr(fx - 21 * K, wallH * 0.30, 42 * K, 36 * K, 4 * K); ctx.fill();
    ctx.font = `${24 * K}px sans-serif`;
    ctx.fillText(emo, fx, wallH * 0.485);
  };

  if (T.art === 'zen') {
    // thư pháp, tre và đá xếp
    ctx.fillStyle = '#f7efdf';
    rr(W * 0.10 - 24 * K, wallH * 0.18, 48 * K, 62 * K, 4 * K); ctx.fill();
    ctx.fillStyle = w.baseDark;
    rr(W * 0.10 - 28 * K, wallH * 0.16, 56 * K, 6 * K, 3 * K); ctx.fill();
    ctx.font = `${26 * K}px serif`;
    ctx.fillStyle = 'rgba(90,70,60,.75)';
    ctx.fillText('禅', W * 0.10, wallH * 0.44);
    ctx.font = `${30 * K}px sans-serif`;
    ctx.fillText('🎍', W * 0.235, wallH * 0.42);
    ctx.fillText('🪨', W * 0.63, wallH * 0.46);
    shelf(W * 0.755, ['🕯️', '🪷', '🕯️']);
  } else if (T.art === 'window') {
    // cửa sổ nhìn ra vườn
    const cx = W * 0.235, cy = wallH * 0.44;
    ctx.fillStyle = w.baseDark;
    rr(cx - 52 * K, cy - 34 * K, 104 * K, 68 * K, 8 * K); ctx.fill();
    ctx.fillStyle = '#bfe6f7';
    rr(cx - 46 * K, cy - 28 * K, 92 * K, 56 * K, 5 * K); ctx.fill();
    ctx.fillStyle = '#8fd08a';
    ctx.beginPath(); ctx.ellipse(cx - 22 * K, cy + 22 * K, 26 * K, 14 * K, 0, 0, 7); ctx.fill();
    ctx.beginPath(); ctx.ellipse(cx + 24 * K, cy + 24 * K, 22 * K, 12 * K, 0, 0, 7); ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(cx + 26 * K, cy - 16 * K, 8 * K, 0, 7); ctx.fill();
    ctx.strokeStyle = w.baseDark; ctx.lineWidth = 4 * K;
    ctx.beginPath(); ctx.moveTo(cx, cy - 28 * K); ctx.lineTo(cx, cy + 28 * K); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx - 46 * K, cy); ctx.lineTo(cx + 46 * K, cy); ctx.stroke();
    frame(W * 0.63, '🪷');
    shelf(W * 0.755, ['🕯️', '🧴', '🕯️']);
  } else if (T.art === 'lights') {
    // dây đèn và đèn lồng
    ctx.strokeStyle = 'rgba(200,150,170,.6)';
    ctx.lineWidth = 2 * K;
    ctx.beginPath();
    ctx.moveTo(0, wallH * 0.12);
    ctx.quadraticCurveTo(W * 0.5, wallH * 0.3, W, wallH * 0.12);
    ctx.stroke();
    for (let i = 0; i <= 12; i++) {
      const t = i / 12;
      const bx = t * W;
      const by = wallH * 0.12 + Math.sin(Math.PI * t) * wallH * 0.09;
      ctx.fillStyle = i % 2 ? '#ffd88a' : '#fff0b8';
      ctx.beginPath(); ctx.arc(bx, by + 7 * K, 5 * K, 0, 7); ctx.fill();
      ctx.fillStyle = 'rgba(255,220,140,.25)';
      ctx.beginPath(); ctx.arc(bx, by + 7 * K, 11 * K, 0, 7); ctx.fill();
    }
    const lantern = (lx, ly, col) => {
      ctx.strokeStyle = 'rgba(160,110,130,.6)';
      ctx.lineWidth = 1.6 * K;
      ctx.beginPath(); ctx.moveTo(lx, ly - 26 * K); ctx.lineTo(lx, ly - 15 * K); ctx.stroke();
      ctx.fillStyle = '#c94a5e';
      rr(lx - 9 * K, ly - 16 * K, 18 * K, 4 * K, 2 * K); ctx.fill();
      rr(lx - 9 * K, ly + 12 * K, 18 * K, 4 * K, 2 * K); ctx.fill();
      ctx.fillStyle = col;
      ctx.beginPath(); ctx.ellipse(lx, ly, 13 * K, 15 * K, 0, 0, 7); ctx.fill();
      ctx.strokeStyle = 'rgba(180,50,70,.5)';
      ctx.lineWidth = 1.4 * K;
      for (const dx of [-6, 0, 6]) {
        ctx.beginPath();
        ctx.moveTo(lx + dx * K, ly - 13 * K);
        ctx.quadraticCurveTo(lx + dx * K * 1.2, ly, lx + dx * K, ly + 13 * K);
        ctx.stroke();
      }
      ctx.fillStyle = 'rgba(255,220,150,.35)';
      ctx.beginPath(); ctx.arc(lx, ly, 22 * K, 0, 7); ctx.fill();
    };
    lantern(W * 0.235, wallH * 0.56, '#f4707f');
    lantern(W * 0.63, wallH * 0.56, '#ffa15c');
    ctx.font = `${16 * K}px sans-serif`;
    ctx.fillText('⭐', W * 0.42, wallH * 0.52);
    ctx.fillText('⭐', W * 0.55, wallH * 0.46);
    ctx.fillText('⭐', W * 0.10, wallH * 0.4);
    ctx.fillText('⭐', W * 0.155, wallH * 0.56);
    shelf(W * 0.755, ['🕯️', '🌺', '🕯️']);
  } else {
    // bộ mặc định: tranh hoa và kệ nến
    shelf(W * 0.10, ['🕯️', '🧴', '🕯️']);
    shelf(W * 0.755, ['🧖‍♀️', '🕯️', '🌺']);
    frame(W * 0.235, '🌸');
    frame(W * 0.63, '🪷');
  }
}

function drawWall() {
  const { ctx, W, H, K } = G;
  const wallH = H * 0.24;
  const w = T.wall;

  const wg = ctx.createLinearGradient(0, 0, 0, wallH);
  wg.addColorStop(0, w.top);
  wg.addColorStop(1, w.bot);
  ctx.fillStyle = wg;
  ctx.fillRect(0, 0, W, wallH);

  wallPattern(wallH);

  // ván ốp chân tường
  ctx.fillStyle = w.base;
  ctx.fillRect(0, wallH - 26 * K, W, 26 * K);
  ctx.fillStyle = w.baseDark;
  ctx.fillRect(0, wallH - 8 * K, W, 8 * K);
  ctx.fillStyle = 'rgba(255,255,255,.35)';
  ctx.fillRect(0, wallH - 26 * K, W, 4 * K);

  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';

  // đèn tường toả sáng ấm
  for (let i = 0; i < 3; i++) {
    const lx = W * (0.34 + 0.18 * i);
    ctx.fillStyle = 'rgba(255,225,170,.28)';
    ctx.beginPath();
    ctx.moveTo(lx - 16 * K, wallH * 0.34);
    ctx.lineTo(lx + 16 * K, wallH * 0.34);
    ctx.lineTo(lx + 40 * K, wallH * 1.05);
    ctx.lineTo(lx - 40 * K, wallH * 1.05);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#ffe3a8';
    ctx.beginPath();
    ctx.moveTo(lx - 17 * K, wallH * 0.34);
    ctx.lineTo(lx + 17 * K, wallH * 0.34);
    ctx.lineTo(lx + 11 * K, wallH * 0.16);
    ctx.lineTo(lx - 11 * K, wallH * 0.16);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#e8a86a';
    rr(lx - 3 * K, wallH * 0.08, 6 * K, 9 * K, 2 * K); ctx.fill();
  }

  drawWallArt(wallH);

  // bảng hiệu tiệm
  ctx.fillStyle = w.baseDark;
  rr(W * 0.44, wallH * 0.14, W * 0.12, wallH * 0.3, 12 * K); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,.65)';
  rr(W * 0.445, wallH * 0.16, W * 0.11, wallH * 0.26, 10 * K); ctx.fill();
  ctx.font = `800 ${19 * K}px 'Baloo 2', sans-serif`;
  ctx.fillStyle = w.ink;
  ctx.fillText('❀ SPA ❀', W * 0.5, wallH * 0.29);

  return wallH;
}

function drawFloor(wallH) {
  const { ctx, W, H, K } = G;
  const f = T.floor;
  ctx.fillStyle = f.base;
  ctx.fillRect(0, wallH, W, H - wallH);

  const tile = 64 * K;
  if (f.style === 'plank') {
    // sàn gỗ: thanh dài so le
    ctx.fillStyle = f.alt;
    let row = 0;
    for (let y = wallH; y < H; y += tile * 0.5, row++) {
      for (let x = -tile + (row % 2 ? tile : 0); x < W; x += tile * 2) {
        ctx.fillRect(x, y, tile, Math.min(tile * 0.5 - 2, H - y));
      }
    }
    ctx.strokeStyle = f.line;
    ctx.lineWidth = 1.5;
    for (let y = wallH; y < H; y += tile * 0.5) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }
  } else if (f.style === 'diamond') {
    // đá hoa: ô vuông xoay 45 độ
    ctx.save();
    ctx.beginPath(); ctx.rect(0, wallH, W, H - wallH); ctx.clip();
    ctx.translate(0, wallH);
    ctx.rotate(Math.PI / 4);
    const d = tile * 0.72;
    ctx.fillStyle = f.alt;
    for (let i = -20; i < 40; i++) {
      for (let j = -20; j < 40; j++) {
        if ((i + j) % 2) continue;
        ctx.fillRect(i * d, j * d, d - 1.5, d - 1.5);
      }
    }
    ctx.restore();
  } else {
    // gạch vuông so le
    let row = 0;
    for (let y = wallH; y < H; y += tile, row++) {
      for (let x = -tile + (row % 2 ? tile / 2 : 0), col = 0; x < W; x += tile, col++) {
        if ((col + row) % 2) continue;
        ctx.fillStyle = f.alt;
        ctx.fillRect(x, y, tile, Math.min(tile, H - y));
      }
    }
    ctx.strokeStyle = f.line;
    ctx.lineWidth = 1.5;
    for (let y = wallH; y < H; y += tile) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }
  }

  const sg = ctx.createLinearGradient(0, wallH, 0, wallH + 40 * K);
  sg.addColorStop(0, 'rgba(150,90,110,.2)');
  sg.addColorStop(1, 'rgba(150,90,110,0)');
  ctx.fillStyle = sg;
  ctx.fillRect(0, wallH, W, 40 * K);
}

function drawDoorAndRug() {
  const { ctx, W, H, K } = G;
  const fu = T.furn;

  // cửa kính ra vào
  ctx.fillStyle = T.wall.baseDark;
  rr(-10, G.door.y - 104 * K, 26 * K, 208 * K, 8 * K); ctx.fill();
  ctx.fillStyle = '#cbe9f5';
  rr(2 * K, G.door.y - 86 * K, 12 * K, 94 * K, 6 * K); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,.55)';
  rr(4 * K, G.door.y - 82 * K, 5 * K, 40 * K, 3 * K); ctx.fill();
  ctx.fillStyle = 'rgba(150,90,110,.16)';
  ctx.beginPath(); ctx.ellipse(26 * K, G.door.y + 98 * K, 44 * K, 13 * K, 0, 0, 7); ctx.fill();

  // thảm khu chờ
  const xs = G.seats.map(s => s.x);
  const xMin = Math.min(...xs), xMax = Math.max(...xs);
  const s0 = G.seats[0], sN = G.seats[G.seats.length - 1];
  const rx = xMin - 60 * K, ry = s0.y - 78 * K;
  const rw = xMax - xMin + 120 * K, rh = sN.y - s0.y + 142 * K;
  const rug = T.rug;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  if (rug) {
    ctx.fillStyle = rug.outer;
    rr(rx, ry, rw, rh, 28 * K); ctx.fill();
    ctx.fillStyle = rug.inner;
    rr(rx + 8 * K, ry + 8 * K, rw - 16 * K, rh - 16 * K, 22 * K); ctx.fill();
    ctx.save();
    rr(rx + 8 * K, ry + 8 * K, rw - 16 * K, rh - 16 * K, 22 * K);
    ctx.clip();
    ctx.fillStyle = rug.stripe;
    for (let i = 0; i < 18; i++) ctx.fillRect(rx, ry + i * 36 * K, rw, 16 * K);
    ctx.restore();
    ctx.strokeStyle = 'rgba(255,255,255,.45)';
    ctx.lineWidth = 3 * K;
    rr(rx + 20 * K, ry + 20 * K, rw - 40 * K, rh - 40 * K, 16 * K); ctx.stroke();
    ctx.font = `800 ${17 * K}px 'Baloo 2', sans-serif`;
    ctx.fillStyle = rug.ink;
    ctx.fillText('✿ KHU CHỜ ✿', (xMin + xMax) / 2, ry + rh - 22 * K);
  } else {
    ctx.font = `800 ${17 * K}px 'Baloo 2', sans-serif`;
    ctx.fillStyle = fu.main;
    ctx.fillText('✿ KHU CHỜ ✿', (xMin + xMax) / 2, ry + 18 * K);
  }

  // cây cảnh hai góc
  ctx.font = `${46 * K}px sans-serif`;
  ctx.fillText('🪴', 34 * K, H - 44 * K);
  ctx.font = `${34 * K}px sans-serif`;
  ctx.fillText('🎍', W * 0.215, H * 0.34);
}

/* ══════════════ GHẾ CHỜ ══════════════ */

function seatBack(s) {
  const { ctx, K } = G;
  const fu = T.furn;
  ctx.fillStyle = 'rgba(150,90,110,.18)';
  ctx.beginPath(); ctx.ellipse(s.x, s.y + 30 * K, 32 * K, 10 * K, 0, 0, 7); ctx.fill();
  // tựa lưng
  ctx.fillStyle = fu.main;
  rr(s.x - 24 * K, s.y - 44 * K, 48 * K, 52 * K, 14 * K); ctx.fill();
  ctx.fillStyle = fu.light;
  rr(s.x - 19 * K, s.y - 38 * K, 38 * K, 42 * K, 11 * K); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,.28)';
  rr(s.x - 19 * K, s.y - 38 * K, 38 * K, 12 * K, 8 * K); ctx.fill();
}

function seatFront(s) {
  const { ctx, K } = G;
  const fu = T.furn;
  // đệm ngồi
  ctx.fillStyle = fu.main;
  rr(s.x - 27 * K, s.y + 4 * K, 54 * K, 18 * K, 8 * K); ctx.fill();
  ctx.fillStyle = fu.soft;
  ctx.beginPath(); ctx.ellipse(s.x, s.y + 6 * K, 25 * K, 8 * K, 0, 0, 7); ctx.fill();
  // tay ghế
  ctx.fillStyle = fu.dark;
  for (const sg of [-1, 1]) {
    rr(s.x + sg * 27 * K - 6 * K, s.y - 12 * K, 12 * K, 26 * K, 6 * K); ctx.fill();
  }
  // chân gỗ
  ctx.fillStyle = fu.wood;
  rr(s.x - 20 * K, s.y + 21 * K, 7 * K, 9 * K, 3 * K); ctx.fill();
  rr(s.x + 13 * K, s.y + 21 * K, 7 * K, 9 * K, 3 * K); ctx.fill();
}

/* ══════════════ XE TRÀ ══════════════ */

function drawTeaCart() {
  const { ctx, K } = G;
  const t = G.teaCart;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillStyle = 'rgba(150,90,110,.2)';
  ctx.beginPath(); ctx.ellipse(t.x, t.y + 28 * K, 40 * K, 11 * K, 0, 0, 7); ctx.fill();
  // khung xe hai tầng
  ctx.fillStyle = T.furn.wood;
  rr(t.x - 34 * K, t.y - 20 * K, 68 * K, 6 * K, 3 * K); ctx.fill();
  rr(t.x - 34 * K, t.y + 8 * K, 68 * K, 6 * K, 3 * K); ctx.fill();
  ctx.fillStyle = T.furn.woodDark;
  rr(t.x - 32 * K, t.y - 16 * K, 5 * K, 26 * K, 2 * K); ctx.fill();
  rr(t.x + 27 * K, t.y - 16 * K, 5 * K, 26 * K, 2 * K); ctx.fill();
  // bánh xe
  ctx.fillStyle = '#7a5230';
  ctx.beginPath(); ctx.arc(t.x - 24 * K, t.y + 22 * K, 6.5 * K, 0, 7); ctx.fill();
  ctx.beginPath(); ctx.arc(t.x + 24 * K, t.y + 22 * K, 6.5 * K, 0, 7); ctx.fill();
  // ấm trà và tách
  ctx.fillStyle = '#fff8f2';
  rr(t.x - 16 * K, t.y - 40 * K, 24 * K, 20 * K, 7 * K); ctx.fill();
  ctx.strokeStyle = '#e3b3c4'; ctx.lineWidth = 2.4 * K;
  ctx.beginPath(); ctx.arc(t.x + 12 * K, t.y - 30 * K, 6 * K, -Math.PI / 2, Math.PI / 2); ctx.stroke();
  ctx.fillStyle = T.furn.soft;
  rr(t.x - 12 * K, t.y - 44 * K, 6 * K, 5 * K, 2 * K); ctx.fill();
  ctx.fillStyle = '#fff8f2';
  ctx.beginPath(); ctx.ellipse(t.x + 20 * K, t.y - 22 * K, 7 * K, 4 * K, 0, 0, 7); ctx.fill();
  ctx.font = `${16 * K}px sans-serif`;
  ctx.fillText('🌸', t.x + 22 * K, t.y + 1 * K);
  ctx.font = `${15 * K}px sans-serif`;
  ctx.fillText('🍵', t.x - 16 * K, t.y + 1 * K);
  // nhãn
  const lw = 72 * K;
  ctx.fillStyle = T.furn.dark;
  rr(t.x - lw / 2, t.y + 32 * K, lw, 20 * K, 10 * K); ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.font = `800 ${13 * K}px 'Baloo 2', sans-serif`;
  ctx.fillText('Mời trà', t.x, t.y + 42 * K);

  if (G.running && teaTarget()) {
    glowRing(t.x - 46 * K, t.y - 52 * K, 92 * K, 106 * K, 16 * K, 'rgba(60,200,110,%A%)', 6);
  }
}

/* ══════════════ QUẦY THU NGÂN ══════════════ */

function drawRegister() {
  const { ctx, K } = G;
  const r = G.register;
  const validTarget = G.selected && currentWish(G.selected) === 'pay';
  const front = G.queueSpots[0].taken;
  const frontReady = front && front.state === 'queue';

  // vạch hàng chờ
  const q0 = G.queueSpots[0], q2 = G.queueSpots[G.queueSpots.length - 1];
  ctx.fillStyle = 'rgba(255,190,120,.18)';
  rr(q2.x - 36 * K, q0.y - 34 * K, (q0.x - q2.x) + 72 * K, 96 * K, 18 * K); ctx.fill();
  ctx.strokeStyle = 'rgba(230,150,90,.3)';
  ctx.lineWidth = 2 * K;
  ctx.setLineDash([7 * K, 6 * K]);
  rr(q2.x - 36 * K, q0.y - 34 * K, (q0.x - q2.x) + 72 * K, 96 * K, 18 * K); ctx.stroke();
  ctx.setLineDash([]);

  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillStyle = 'rgba(150,90,110,.22)';
  ctx.beginPath(); ctx.ellipse(r.x, r.y + r.h * 0.66, r.w * 0.6, 14 * K, 0, 0, 7); ctx.fill();

  // thân quầy gỗ
  const bg = ctx.createLinearGradient(0, r.y - r.h * 0.2, 0, r.y + r.h * 0.6);
  bg.addColorStop(0, T.furn.wood);
  bg.addColorStop(1, T.furn.woodDark);
  ctx.fillStyle = bg;
  rr(r.x - r.w / 2, r.y - r.h * 0.18, r.w, r.h * 0.78, 12 * K); ctx.fill();
  ctx.fillStyle = 'rgba(80,40,20,.18)';
  rr(r.x - r.w * 0.36, r.y + r.h * 0.06, r.w * 0.72, r.h * 0.4, 7 * K); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,.14)';
  rr(r.x - r.w * 0.33, r.y + r.h * 0.09, r.w * 0.66, r.h * 0.1, 5 * K); ctx.fill();
  // mặt quầy
  ctx.fillStyle = T.furn.wood;
  rr(r.x - r.w / 2 - 8 * K, r.y - r.h * 0.36, r.w + 16 * K, r.h * 0.24, 8 * K); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,.45)';
  rr(r.x - r.w / 2 - 8 * K, r.y - r.h * 0.36, r.w + 16 * K, 6 * K, 3 * K); ctx.fill();
  ctx.fillStyle = 'rgba(120,60,30,.25)';
  rr(r.x - r.w / 2 - 8 * K, r.y - r.h * 0.15, r.w + 16 * K, 4 * K, 2 * K); ctx.fill();

  // máy tính tiền
  ctx.fillStyle = '#8a5a72';
  rr(r.x - r.w * 0.3, r.y - r.h * 0.78, r.w * 0.34, r.h * 0.46, 6 * K); ctx.fill();
  ctx.fillStyle = '#cdeafc';
  rr(r.x - r.w * 0.26, r.y - r.h * 0.72, r.w * 0.26, r.h * 0.24, 3 * K); ctx.fill();
  ctx.fillStyle = '#a8d8f0';
  rr(r.x - r.w * 0.24, r.y - r.h * 0.42, r.w * 0.22, r.h * 0.08, 2 * K); ctx.fill();
  // chuông và hoa
  ctx.fillStyle = '#e8b73c';
  ctx.beginPath(); ctx.arc(r.x + r.w * 0.12, r.y - r.h * 0.4, 8 * K, Math.PI, 0); ctx.fill();
  rr(r.x + r.w * 0.12 - 9 * K, r.y - r.h * 0.4, 18 * K, 3 * K, 1.5 * K); ctx.fill();
  ctx.font = `${20 * K}px sans-serif`;
  ctx.fillText('🌷', r.x + r.w * 0.34, r.y - r.h * 0.46);
  ctx.font = `800 ${14 * K}px 'Baloo 2', sans-serif`;
  ctx.fillStyle = 'rgba(120,60,85,.85)';
  ctx.fillText('THU NGÂN', r.x, r.y + r.h * 0.2);

  if (validTarget || frontReady) {
    glowRing(r.x - r.w / 2 - 10 * K, r.y - r.h * 0.86, r.w + 20 * K, r.h * 1.5, 14 * K,
      validTarget ? 'rgba(60,200,110,%A%)' : 'rgba(255,180,0,%A%)', 7);
    if (frontReady && !validTarget) {
      const p = 0.5 + 0.5 * Math.sin(G.time * 7);
      ctx.font = `${(22 + p * 4) * K}px sans-serif`;
      ctx.fillText('👆', r.x, r.y - r.h * 1.1);
    }
  }
}

/* ══════════════ NỘI THẤT TỪNG Ô DỊCH VỤ ══════════════ */

const TILE_COLORS = { massage: '#d6eefc', facial: '#ecdffc', sauna: '#fde5cc', nail: '#fddced' };

function massageBed(st) {
  const { ctx, K } = G;
  const { x, y, w, h } = st;
  const bx = x - w * 0.14, by = y + h * 0.04;
  const bw = w * 0.56, bh = h * 0.26;
  // chân giường
  ctx.fillStyle = T.furn.woodDark;
  rr(bx - bw * 0.42, by + bh * 0.5, 7 * K, h * 0.2, 3 * K); ctx.fill();
  rr(bx + bw * 0.36, by + bh * 0.5, 7 * K, h * 0.2, 3 * K); ctx.fill();
  // đệm trắng
  ctx.fillStyle = 'rgba(150,90,110,.16)';
  ctx.beginPath(); ctx.ellipse(bx, by + bh * 0.72, bw * 0.5, 8 * K, 0, 0, 7); ctx.fill();
  ctx.fillStyle = '#fffdfa';
  rr(bx - bw / 2, by - bh / 2, bw, bh, 9 * K); ctx.fill();
  ctx.strokeStyle = 'rgba(200,160,175,.4)'; ctx.lineWidth = 1.4 * K;
  rr(bx - bw / 2, by - bh / 2, bw, bh, 9 * K); ctx.stroke();
  // khăn vắt ngang theo màu trang trí
  ctx.fillStyle = T.furn.soft;
  rr(bx + bw * 0.02, by - bh / 2, bw * 0.34, bh, 6 * K); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,.4)';
  rr(bx + bw * 0.02, by - bh / 2, bw * 0.34, 4 * K, 2 * K); ctx.fill();
  // gối tựa đầu ở đầu giường (bên trái)
  ctx.fillStyle = '#f5e3ea';
  rr(bx - bw / 2 - 2 * K, by - bh * 0.36, bw * 0.2, bh * 0.72, 7 * K); ctx.fill();
  // khăn cuộn xếp cạnh giường
  ctx.fillStyle = '#fff';
  for (let i = 0; i < 2; i++) {
    ctx.beginPath(); ctx.arc(x + w * 0.2, by + bh * 0.7 + i * 11 * K, 6.5 * K, 0, 7); ctx.fill();
    ctx.strokeStyle = 'rgba(210,170,185,.6)'; ctx.lineWidth = 1.2 * K;
    ctx.beginPath(); ctx.arc(x + w * 0.2, by + bh * 0.7 + i * 11 * K, 3 * K, 0, 7); ctx.stroke();
  }
  // bàn nhỏ với nến & tinh dầu
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.font = `${15 * K}px sans-serif`;
  ctx.fillText('🕯️', x - w * 0.38, y - h * 0.2);
  ctx.fillText('🧴', x - w * 0.31, y - h * 0.16);
}

function facialChair(st) {
  const { ctx, K } = G;
  const { x, y, w, h } = st;
  const cx = x - w * 0.14, cy = y + h * 0.04;
  // chân ghế
  ctx.fillStyle = '#b0889c';
  rr(cx - 5 * K, cy + h * 0.1, 10 * K, h * 0.18, 4 * K); ctx.fill();
  ctx.beginPath(); ctx.ellipse(cx, cy + h * 0.28, 22 * K, 6 * K, 0, 0, 7); ctx.fill();
  // ghế ngả có tựa đầu bên trái
  ctx.fillStyle = 'rgba(150,90,110,.16)';
  ctx.beginPath(); ctx.ellipse(cx, cy + h * 0.2, w * 0.3, 8 * K, 0, 0, 7); ctx.fill();
  ctx.fillStyle = T.furn.main;
  rr(cx - w * 0.28, cy - h * 0.12, w * 0.54, h * 0.24, 10 * K); ctx.fill();
  ctx.fillStyle = T.furn.light;
  rr(cx - w * 0.26, cy - h * 0.1, w * 0.5, h * 0.14, 8 * K); ctx.fill();
  // tựa đầu
  ctx.fillStyle = T.furn.dark;
  rr(cx - w * 0.36, cy - h * 0.16, w * 0.12, h * 0.2, 7 * K); ctx.fill();
  // xe đẩy dụng cụ
  ctx.fillStyle = '#e8dcf5';
  rr(x + w * 0.08, y + h * 0.16, w * 0.2, h * 0.2, 6 * K); ctx.fill();
  ctx.fillStyle = '#c9a8f0';
  rr(x + w * 0.08, y + h * 0.16, w * 0.2, 4 * K, 2 * K); ctx.fill();
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.font = `${13 * K}px sans-serif`;
  ctx.fillText('🧴', x + w * 0.13, y + h * 0.1);
  ctx.fillText('🥒', x + w * 0.23, y + h * 0.1);
  // đèn soi da
  ctx.strokeStyle = '#d9c3ee'; ctx.lineWidth = 3 * K;
  ctx.beginPath();
  ctx.moveTo(x - w * 0.42, y - h * 0.14);
  ctx.quadraticCurveTo(x - w * 0.42, y - h * 0.4, x - w * 0.2, y - h * 0.38);
  ctx.stroke();
  ctx.fillStyle = '#fff3c4';
  ctx.beginPath(); ctx.ellipse(x - w * 0.18, y - h * 0.36, 10 * K, 6 * K, 0.3, 0, 7); ctx.fill();
}

function saunaRoom(st) {
  const { ctx, K } = G;
  const { x, y, w, h } = st;
  // vách gỗ
  ctx.fillStyle = '#c98a52';
  rr(x - w * 0.45, y - h * 0.46, w * 0.9, h * 0.58, 12 * K); ctx.fill();
  ctx.fillStyle = '#b5773f';
  rr(x - w * 0.45, y - h * 0.46, w * 0.9, h * 0.1, 10 * K); ctx.fill();
  ctx.strokeStyle = 'rgba(120,70,30,.3)'; ctx.lineWidth = 1.6 * K;
  for (let i = 1; i < 4; i++) {
    const yy = y - h * 0.38 + i * h * 0.13;
    ctx.beginPath(); ctx.moveTo(x - w * 0.45, yy); ctx.lineTo(x + w * 0.45, yy); ctx.stroke();
  }
  ctx.strokeStyle = 'rgba(255,225,190,.22)';
  ctx.beginPath(); ctx.moveTo(x - w * 0.45, y - h * 0.32); ctx.lineTo(x + w * 0.45, y - h * 0.32); ctx.stroke();

  // cửa sổ tròn cho từng khách
  const cap = (st.slots || [null, null, null]).length;
  for (let s = 0; s < cap; s++) {
    const wx = x + (s - (cap - 1) / 2) * w * 0.26;
    ctx.fillStyle = '#6b431f';
    ctx.beginPath(); ctx.arc(wx, y - h * 0.16, 19 * K, 0, 7); ctx.fill();
    ctx.fillStyle = '#f2e0c8';
    ctx.beginPath(); ctx.arc(wx, y - h * 0.16, 16 * K, 0, 7); ctx.fill();
    ctx.fillStyle = 'rgba(190,220,235,.5)';
    ctx.beginPath(); ctx.arc(wx, y - h * 0.16, 16 * K, 0, 7); ctx.fill();
  }
  // bếp đá nóng góc phải
  ctx.fillStyle = '#8a6a52';
  rr(x + w * 0.3, y - h * 0.12, 22 * K, 16 * K, 5 * K); ctx.fill();
  ctx.fillStyle = '#6b5342';
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.arc(x + w * 0.3 + 6 * K + (i % 2) * 9 * K, y - h * 0.1 + Math.floor(i / 2) * 6 * K, 4 * K, 0, 7);
    ctx.fill();
  }
  ctx.fillStyle = 'rgba(255,140,60,.55)';
  ctx.beginPath(); ctx.ellipse(x + w * 0.3 + 11 * K, y - h * 0.11, 8 * K, 3 * K, 0, 0, 7); ctx.fill();
  // biển gỗ
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillStyle = '#8a5c30';
  rr(x - 34 * K, y - h * 0.45, 68 * K, 16 * K, 5 * K); ctx.fill();
  ctx.font = `800 ${11 * K}px 'Baloo 2', sans-serif`;
  ctx.fillStyle = '#ffe3c4';
  ctx.fillText('XÔNG HƠI', x, y - h * 0.37);
}

function nailTable(st) {
  const { ctx, K } = G;
  const { x, y, w, h } = st;
  const tx = x - w * 0.08, ty = y + h * 0.06;
  // chân bàn
  ctx.fillStyle = T.furn.wood;
  rr(tx - w * 0.22, ty + 6 * K, 6 * K, h * 0.2, 3 * K); ctx.fill();
  rr(tx + w * 0.17, ty + 6 * K, 6 * K, h * 0.2, 3 * K); ctx.fill();
  // mặt bàn
  ctx.fillStyle = 'rgba(150,90,110,.16)';
  ctx.beginPath(); ctx.ellipse(tx, ty + h * 0.24, w * 0.26, 7 * K, 0, 0, 7); ctx.fill();
  ctx.fillStyle = '#fff8fb';
  rr(tx - w * 0.26, ty - 8 * K, w * 0.52, 16 * K, 6 * K); ctx.fill();
  ctx.fillStyle = '#f7dfe9';
  rr(tx - w * 0.26, ty + 2 * K, w * 0.52, 6 * K, 3 * K); ctx.fill();
  // gối kê tay
  ctx.fillStyle = T.furn.soft;
  rr(tx - w * 0.04, ty - 16 * K, w * 0.2, 10 * K, 5 * K); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,.4)';
  rr(tx - w * 0.04, ty - 16 * K, w * 0.2, 3.5 * K, 2 * K); ctx.fill();
  // lọ sơn và đèn
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.font = `${13 * K}px sans-serif`;
  ctx.fillText('💅', tx - w * 0.19, ty - 15 * K);
  ctx.fillText('🧴', tx - w * 0.12, ty - 14 * K);
  ctx.strokeStyle = '#e8c0d0'; ctx.lineWidth = 2.6 * K;
  ctx.beginPath();
  ctx.moveTo(tx + w * 0.24, ty - 6 * K);
  ctx.quadraticCurveTo(tx + w * 0.26, ty - h * 0.32, tx + w * 0.1, ty - h * 0.3);
  ctx.stroke();
  ctx.fillStyle = '#fff3c4';
  ctx.beginPath(); ctx.ellipse(tx + w * 0.08, ty - h * 0.29, 9 * K, 5.5 * K, 0.3, 0, 7); ctx.fill();
}

function drawFurniture(st) {
  if (st.key === 'massage') massageBed(st);
  else if (st.key === 'facial') facialChair(st);
  else if (st.key === 'sauna') saunaRoom(st);
  else if (st.key === 'nail') nailTable(st);
}

/* ══════════════ Ô DỊCH VỤ ══════════════ */

function drawProgressBar(x, by, bw, prog, col) {
  const { ctx, K } = G;
  const bh = 12 * K;
  const bx = x - bw / 2;
  ctx.fillStyle = 'rgba(255,255,255,.9)';
  rr(bx - 2, by - 2, bw + 4, bh + 4, bh); ctx.fill();
  ctx.fillStyle = col;
  if (prog > 0.02) { rr(bx, by, bw * Math.min(1, prog), bh, bh / 2); ctx.fill(); }
}

function drawStationTile(st, dt) {
  const { ctx, K } = G;
  const svc = SERVICES[st.key];
  const x = st.x, y = st.y, w = st.w, h = st.h;
  let sx = 0;
  if (st.shakeT > 0) { st.shakeT -= dt; sx = Math.sin(st.shakeT * 60) * 5 * K; }
  ctx.save();
  ctx.translate(sx, 0);

  const occ = st.occupant;
  const occupants = st.slots ? st.slots.filter(Boolean) : (occ ? [occ] : []);
  const anyDone = occupants.some(c => c.state === 'done');
  const maskDone = occ && occ.state === 'maskDone';
  const validTarget = G.selected && stationFree(st) && currentWish(G.selected) === st.key;

  // nền ô
  ctx.fillStyle = 'rgba(150,90,110,.14)';
  ctx.beginPath(); ctx.ellipse(x, y + h * 0.44, w * 0.56, h * 0.18, 0, 0, 7); ctx.fill();
  ctx.fillStyle = TILE_COLORS[st.key];
  rr(x - w / 2, y - h / 2, w, h, 20 * K);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,.45)';
  rr(x - w / 2, y - h / 2, w, h * 0.3, 20 * K);
  ctx.fill();
  if (validTarget) glowRing(x - w / 2, y - h / 2, w, h, 20 * K, 'rgba(60,200,110,%A%)', 7);
  else if (anyDone || maskDone) glowRing(x - w / 2, y - h / 2, w, h, 20 * K, 'rgba(255,180,0,%A%)', 6);
  else {
    ctx.strokeStyle = 'rgba(255,255,255,.85)';
    ctx.lineWidth = 4 * K;
    rr(x - w / 2, y - h / 2, w, h, 20 * K);
    ctx.stroke();
  }

  drawFurniture(st);

  // nhãn dịch vụ
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.font = `${24 * K}px sans-serif`;
  ctx.fillText(svc.icon, x - w / 2 + 24 * K, y - h / 2 + 22 * K);
  ctx.font = `800 ${14.5 * K}px 'Baloo 2', sans-serif`;
  ctx.fillStyle = 'rgba(120,70,95,.8)';
  ctx.fillText(svc.name, x, y + h / 2 + 15 * K);

  for (const c of occupants) {
    if (c.state === 'walk') continue; // đang đi tới thì vẽ như khách thường
    drawCustomerAtStation(c, st);
  }

  // thanh tiến độ và lời nhắc
  const by = y - h / 2 - 20 * K;
  if (occ && occ.state === 'service' && svc.mode === 'staff') {
    drawProgressBar(x, by, w * 0.72, occ.workProgress, '#ff7ba3');
    const p = 0.5 + 0.5 * Math.sin(G.time * 9);
    ctx.font = `800 ${(15 + p * 3) * K}px 'Baloo 2', sans-serif`;
    ctx.fillStyle = '#e0447a';
    ctx.fillText('CHẠM! 👆', x, by - 16 * K);
  } else if (occ && occ.state === 'masked') {
    drawProgressBar(x, by, w * 0.72, occ.serviceTimer / maskTime(), '#a58ae0');
  } else if (maskDone) {
    const p = 0.5 + 0.5 * Math.sin(G.time * 8);
    ctx.font = `800 ${(15 + p * 3) * K}px 'Baloo 2', sans-serif`;
    ctx.fillStyle = '#8a5ad0';
    ctx.fillText('GỠ MẶT NẠ! 👆', x, by - 4 * K);
  } else if (st.slots) {
    for (const c of st.slots.filter(c => c && c.state === 'service')) {
      const prog = c.serviceTimer / saunaTime();
      ctx.strokeStyle = 'rgba(255,255,255,.8)';
      ctx.lineWidth = 4 * K;
      ctx.beginPath(); ctx.arc(c.x, y - h * 0.56, 12 * K, 0, 7); ctx.stroke();
      ctx.strokeStyle = '#f0964c';
      ctx.beginPath(); ctx.arc(c.x, y - h * 0.56, 12 * K, -Math.PI / 2, -Math.PI / 2 + prog * Math.PI * 2); ctx.stroke();
    }
  }

  ctx.restore();
}

/* ══════════════ KHÁCH TẠI Ô DỊCH VỤ ══════════════ */

function drawCustomerAtStation(c, st) {
  const { ctx, K } = G;

  // phòng xông: chỉ thấy đầu qua cửa sổ
  if (st.key === 'sauna' && c.state === 'service') {
    const cap = (st.slots || []).length || 3;
    const slot = c.anchor.slot || 0;
    const wx = st.x + (slot - (cap - 1) / 2) * st.w * 0.26;
    drawHeadOnly(ctx, wx, st.y - st.h * 0.1, 13 * K, c.lookTowel, { sweat: true });
    return;
  }

  // nằm sấp trên giường mát-xa, đắp khăn
  if (st.key === 'massage' && c.state === 'service') {
    const bx = st.x - st.w * 0.14, by = st.y + st.h * 0.04;
    const bw = st.w * 0.56, bh = st.h * 0.26;
    const top = by - bh * 0.16;
    // lưng và vai lộ trên khăn
    ctx.fillStyle = c.look.skin;
    ctx.beginPath();
    ctx.moveTo(bx - bw * 0.3, top + bh * 0.3);
    ctx.quadraticCurveTo(bx - bw * 0.26, top - bh * 0.16, bx - bw * 0.1, top - bh * 0.1);
    ctx.lineTo(bx + bw * 0.06, top - bh * 0.06);
    ctx.lineTo(bx + bw * 0.06, top + bh * 0.3);
    ctx.closePath();
    ctx.fill();
    // khăn phủ từ lưng xuống chân
    ctx.fillStyle = '#fff6f9';
    ctx.beginPath();
    ctx.moveTo(bx - bw * 0.02, top - bh * 0.08);
    ctx.quadraticCurveTo(bx + bw * 0.2, top - bh * 0.22, bx + bw * 0.42, top - bh * 0.02);
    ctx.lineTo(bx + bw * 0.42, top + bh * 0.32);
    ctx.lineTo(bx - bw * 0.02, top + bh * 0.32);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(210,170,185,.55)'; ctx.lineWidth = 1.2 * K;
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,190,215,.5)';
    rr(bx + bw * 0.12, top - bh * 0.14, bw * 0.12, bh * 0.46, 3 * K); ctx.fill();
    // bàn chân nhô ra cuối khăn
    ctx.fillStyle = c.look.skin;
    ctx.beginPath(); ctx.ellipse(bx + bw * 0.46, top + bh * 0.1, 5 * K, 4 * K, 0, 0, 7); ctx.fill();
    ctx.beginPath(); ctx.ellipse(bx + bw * 0.46, top + bh * 0.24, 5 * K, 4 * K, 0, 0, 7); ctx.fill();
    // cánh tay buông xuống cạnh giường
    ctx.strokeStyle = c.look.skin;
    ctx.lineWidth = 4.4 * K;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(bx - bw * 0.2, top + bh * 0.22);
    ctx.quadraticCurveTo(bx - bw * 0.24, top + bh * 0.5, bx - bw * 0.16, top + bh * 0.62);
    ctx.stroke();
    drawHeadOnly(ctx, bx - bw * 0.4, top + bh * 0.02, 12.5 * K, c.lookTowel, {});
    return;
  }

  // ngả ghế đắp mặt nạ
  if (st.key === 'facial' && (c.state === 'masked' || c.state === 'maskDone')) {
    const cx = st.x - st.w * 0.14, cy = st.y + st.h * 0.04;
    const top = cy - st.h * 0.11;
    // thân khoác áo choàng nằm ngả trên ghế
    ctx.fillStyle = c.look.dressColor;
    ctx.beginPath();
    ctx.moveTo(cx - st.w * 0.22, top + st.h * 0.02);
    ctx.quadraticCurveTo(cx - st.w * 0.1, top - st.h * 0.06, cx + st.w * 0.16, top - st.h * 0.02);
    ctx.lineTo(cx + st.w * 0.16, top + st.h * 0.16);
    ctx.lineTo(cx - st.w * 0.22, top + st.h * 0.16);
    ctx.closePath(); ctx.fill();
    // khăn bông đắp ngang người
    ctx.fillStyle = '#fff6f9';
    rr(cx - st.w * 0.02, top - st.h * 0.04, st.w * 0.2, st.h * 0.2, 6 * K); ctx.fill();
    ctx.strokeStyle = 'rgba(210,170,185,.5)'; ctx.lineWidth = 1.2 * K;
    rr(cx - st.w * 0.02, top - st.h * 0.04, st.w * 0.2, st.h * 0.2, 6 * K); ctx.stroke();
    drawHeadOnly(ctx, cx - st.w * 0.3, top + st.h * 0.02, 12.5 * K, c.lookTowel, { mask: true });
    return;
  }

  // làm móng: ngồi cạnh bàn
  if (st.key === 'nail' && c.state === 'service') {
    drawPerson(G.ctx, c.x, c.y, K * 0.92, c.look, {
      seated: true, bob: Math.sin(c.bobT) * 1.2 * K, mood: 1, happy: true,
    });
    return;
  }

  // các trạng thái còn lại: đứng cạnh ô
  drawPerson(G.ctx, c.x, c.y, K, c.look, {
    bob: Math.sin(c.bobT) * 1.5 * K,
    mood: c.patience / c.maxPatience,
    happy: c.state === 'done',
  });
}

/* ══════════════ CÔ NHÂN VIÊN ══════════════ */

function drawStaffPerson(s) {
  const { ctx, K } = G;
  const moving = (s.state === 'walk' || s.state === 'idle') && Math.hypot(s.tx - s.x, s.ty - s.y) > 3;
  const working = s.state === 'working' || s.state === 'action';
  const bob = moving ? Math.abs(Math.sin(s.bobT)) * 5 * K
    : working ? Math.abs(Math.sin(G.time * 10)) * 2.5 * K
    : Math.sin(s.bobT) * 1.5 * K;
  drawPerson(ctx, s.x, s.y, K, STAFF_LOOK, {
    bob, mood: 1, happy: true,
    swing: moving ? Math.sin(s.bobT) * 0.9 : 0,
  });
  if (working) {
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.font = `${15 * K}px sans-serif`;
    ctx.fillText('✨', s.x + 26 * K, s.y - 34 * K + Math.sin(G.time * 12) * 4 * K);
    ctx.fillText('💫', s.x - 24 * K, s.y - 46 * K + Math.cos(G.time * 10) * 4 * K);
  }
}

/* ══════════════ TIM & BONG BÓNG ══════════════ */

function drawCustomerUi(c) {
  const { ctx, K } = G;
  if (c.state === 'exitHappy' || c.state === 'exitAngry' || c.state === 'walk') return;
  const showHearts = c.state === 'sit' || c.state === 'done' || c.state === 'queue' ||
    c.state === 'awaitStaff' || c.state === 'maskDone';
  const showBubble = c.state === 'sit' || c.state === 'done' || c.state === 'queue';
  if (!showHearts && !showBubble && G.selected !== c) return;

  const headY = c.y - 64 * K;
  const hr = 20 * K;

  if (G.selected === c) {
    const p = 0.5 + 0.5 * Math.sin(G.time * 7);
    ctx.strokeStyle = `rgba(60,200,110,${0.55 + p * 0.45})`;
    ctx.lineWidth = 4 * K;
    ctx.beginPath(); ctx.ellipse(c.x, c.y + 16 * K, (32 + p * 4) * K, (11 + p * 2) * K, 0, 0, 7); ctx.stroke();
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.font = `${24 * K}px sans-serif`;
    ctx.fillText('🔽', c.x, c.y - 128 * K - p * 6 * K);
  }

  if (showHearts) {
    const n = Math.ceil(c.maxPatience);
    const filled = Math.ceil(Math.max(0, c.patience));
    const hs = 9 * K, gap = 11.5 * K;
    const hx0 = c.x - ((n - 1) * gap) / 2;
    const hy = headY - hr - 23 * K;
    const low = filled <= 2;
    const blink = low && Math.sin(G.time * 9) > 0;
    for (let i = 0; i < n; i++) {
      drawHeart(ctx, hx0 + i * gap, hy, hs,
        i < filled ? (low && blink ? '#ff2a55' : '#ff5f8f') : 'rgba(150,130,140,.3)');
    }
  }

  if (!showBubble) return;
  const wish = currentWish(c);
  const icon = wish === 'pay' ? PAY_ICON : SERVICES[wish].icon;
  const by = headY - hr - 60 * K + Math.sin(G.time * 3 + c.id) * 2.5 * K;
  ctx.fillStyle = 'rgba(255,255,255,.96)';
  ctx.beginPath(); ctx.arc(c.x, by, 22 * K, 0, 7); ctx.fill();
  ctx.beginPath();
  ctx.moveTo(c.x - 7 * K, by + 18 * K);
  ctx.lineTo(c.x, by + 30 * K);
  ctx.lineTo(c.x + 7 * K, by + 18 * K);
  ctx.closePath(); ctx.fill();
  ctx.strokeStyle = G.selected === c ? 'rgba(60,200,110,.95)' : 'rgba(230,150,180,.7)';
  ctx.lineWidth = 2.5 * K;
  ctx.beginPath(); ctx.arc(c.x, by, 22 * K, 0, 7); ctx.stroke();
  ctx.font = `${23 * K}px sans-serif`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(icon, c.x, by + 1);
  const left = c.wishes.length - c.wishIndex;
  if (left > 1) {
    ctx.fillStyle = '#f06292';
    ctx.beginPath(); ctx.arc(c.x + 18 * K, by - 15 * K, 9.5 * K, 0, 7); ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = `800 ${12 * K}px 'Baloo 2', sans-serif`;
    ctx.fillText(left, c.x + 18 * K, by - 14.5 * K);
  }
}

/* ══════════════ SỐ THỨ TỰ VIỆC ══════════════ */

function drawTaskBadges() {
  const { ctx, K } = G;
  G.tasks.forEach((t, i) => {
    let bx, by;
    if (t.type === 'checkout') {
      bx = G.register.x + G.register.w * 0.42;
      by = G.register.y - G.register.h * 0.9;
    } else if (t.type === 'tea') {
      bx = G.teaCart.x + 36 * K;
      by = G.teaCart.y - 40 * K;
    } else {
      const st = G.stations[t.stIdx];
      if (!st) return;
      bx = st.x + st.w / 2 - 14 * K;
      by = st.y - st.h / 2 - 2 * K;
    }
    ctx.fillStyle = '#f06292';
    ctx.beginPath(); ctx.arc(bx, by, 13 * K, 0, 7); ctx.fill();
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 2.5 * K;
    ctx.beginPath(); ctx.arc(bx, by, 13 * K, 0, 7); ctx.stroke();
    ctx.fillStyle = '#fff';
    ctx.font = `800 ${14 * K}px 'Baloo 2', sans-serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(i + 1, bx, by + 0.5);
  });
}

/* ══════════════ MỘT KHUNG HÌNH ══════════════ */

export function draw(dt) {
  const { ctx, W, H, K } = G;
  T = getTheme();
  ctx.clearRect(0, 0, W, H);
  const wallH = drawWall();
  drawFloor(wallH);
  drawDoorAndRug();

  // ghế chờ: tựa lưng → khách ngồi → đệm và tay ghế
  for (const s of G.seats) {
    seatBack(s);
    const c = s.taken;
    if (c && c.state === 'sit') {
      drawPerson(ctx, c.x, c.y, K, c.look, {
        seated: true,
        bob: Math.sin(c.bobT) * 1.4 * K,
        mood: c.patience / c.maxPatience,
      });
    }
    seatFront(s);
  }

  drawTeaCart();
  drawRegister();
  for (const st of G.stations) drawStationTile(st, dt);

  // khách đang đi / đứng chờ ngoài ô + nhân viên, xếp theo chiều sâu
  const actors = [];
  for (const c of G.customers) {
    const atStation = c.anchor && c.anchor.kind === 'station' && c.state !== 'walk';
    const seated = c.anchor && c.anchor.kind === 'seat' && c.state === 'sit';
    if (atStation || seated) continue;
    const moving = c.state === 'walk' || c.state === 'exitHappy' || c.state === 'exitAngry';
    actors.push({
      y: c.y,
      draw: () => drawPerson(ctx, c.x, c.y, K, c.look, {
        bob: moving ? Math.abs(Math.sin(c.bobT)) * 5 * K : Math.sin(c.bobT) * 1.5 * K,
        mood: c.state === 'exitAngry' ? 0 : c.patience / c.maxPatience,
        happy: c.state === 'exitHappy' || c.state === 'done',
        swing: moving ? Math.sin(c.bobT) * 0.9 : 0,
      }),
    });
  }
  for (const s of G.staff) actors.push({ y: s.y, draw: () => drawStaffPerson(s) });
  actors.sort((a, b) => a.y - b.y);
  for (const a of actors) a.draw();

  for (const c of G.customers) drawCustomerUi(c);
  drawTaskBadges();
  drawParticles();
}
