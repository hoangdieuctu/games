// ── Vẽ toàn bộ khung cảnh: nền, ghế, ô dịch vụ, quầy, khách, hiệu ứng ──

import { G } from './state.js';
import { SERVICES, PAY_ICON } from './config.js';
import { currentWish } from './customers.js';
import { drawParticles, drawHeart } from './particles.js';
import { tapsFor, durFor } from './upgrades.js';

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

/* ── nền tiệm ── */

function drawBackground() {
  const { ctx, W, H, K } = G;
  const wallH = H * 0.24;
  const wg = ctx.createLinearGradient(0, 0, 0, wallH);
  wg.addColorStop(0, '#ffe3ec');
  wg.addColorStop(1, '#ffd2e0');
  ctx.fillStyle = wg;
  ctx.fillRect(0, 0, W, wallH);
  ctx.fillStyle = '#f5b8cc';
  ctx.fillRect(0, wallH - 10 * K, W, 10 * K);
  const fg = ctx.createLinearGradient(0, wallH, 0, H);
  fg.addColorStop(0, '#f2d5ae');
  fg.addColorStop(1, '#e5bd8c');
  ctx.fillStyle = fg;
  ctx.fillRect(0, wallH, W, H - wallH);
  ctx.strokeStyle = 'rgba(160,110,60,.16)';
  ctx.lineWidth = 2;
  for (let y = wallH + 42 * K; y < H; y += 46 * K) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
  }
  // thảm khu chờ (phủ cả 2 cột ghế so le)
  const s0 = G.seats[0], sN = G.seats[G.seats.length - 1];
  const sxMin = Math.min(...G.seats.map(s => s.x)), sxMax = Math.max(...G.seats.map(s => s.x));
  ctx.fillStyle = 'rgba(255,150,180,.22)';
  rr(sxMin - 62 * K, s0.y - 60 * K, sxMax - sxMin + 124 * K, sN.y - s0.y + 120 * K, 30 * K);
  ctx.fill();
  // cửa ra vào
  ctx.fillStyle = '#e8a8be';
  rr(-8, G.door.y - 95 * K, 20 * K, 190 * K, 8 * K);
  ctx.fill();
  ctx.fillStyle = 'rgba(150,80,110,.25)';
  ctx.beginPath(); ctx.ellipse(30 * K, G.door.y + 88 * K, 46 * K, 15 * K, 0, 0, 7); ctx.fill();
  // trang trí
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.font = `${34 * K}px sans-serif`;
  const deco = ['🌸', '🕯️', '🌺', '🕯️', '🌸'];
  for (let i = 0; i < deco.length; i++) ctx.fillText(deco[i], W * (0.18 + 0.16 * i), wallH * 0.52);
  ctx.font = `${44 * K}px sans-serif`;
  ctx.fillText('🪴', W * 0.045, H - 46 * K);
  ctx.fillText('🪴', W * 0.955, H - 46 * K);
  ctx.font = `800 ${19 * K}px 'Baloo 2', sans-serif`;
  ctx.fillStyle = 'rgba(190,90,130,.5)';
  ctx.fillText('✿ KHU CHỜ ✿', (sxMin + sxMax) / 2, s0.y - 74 * K);
}

function drawSeats() {
  const { ctx, K } = G;
  for (const s of G.seats) {
    ctx.fillStyle = 'rgba(140,80,50,.25)';
    ctx.beginPath(); ctx.ellipse(s.x, s.y + 26 * K, 34 * K, 11 * K, 0, 0, 7); ctx.fill();
    ctx.fillStyle = '#c98a52';
    rr(s.x - 26 * K, s.y + 2 * K, 52 * K, 22 * K, 8 * K); ctx.fill();
    ctx.fillStyle = '#ff9eb8';
    ctx.beginPath(); ctx.ellipse(s.x, s.y + 4 * K, 30 * K, 13 * K, 0, 0, 7); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.45)';
    ctx.beginPath(); ctx.ellipse(s.x - 7 * K, s.y + 1 * K, 13 * K, 5 * K, -0.3, 0, 7); ctx.fill();
  }
}

/* ── ô dịch vụ ── */

const TILE_COLORS = { massage: '#cdeafc', facial: '#e5d8fc', sauna: '#fcdfc2', nail: '#fcd8e8' };

function drawStationTile(st, dt) {
  const { ctx, K } = G;
  const svc = SERVICES[st.key];
  const x = st.x, y = st.y, w = st.w, h = st.h;
  let sx = 0;
  if (st.shakeT > 0) { st.shakeT -= dt; sx = Math.sin(st.shakeT * 60) * 5 * K; }
  ctx.save();
  ctx.translate(sx, 0);

  const occ = st.occupant;
  const busy = occ && occ.state === 'service';
  const done = occ && occ.state === 'done';
  const validTarget = G.selected && !occ && currentWish(G.selected) === st.key;

  ctx.fillStyle = 'rgba(140,80,50,.18)';
  ctx.beginPath(); ctx.ellipse(x, y + h * 0.42, w * 0.58, h * 0.2, 0, 0, 7); ctx.fill();

  ctx.fillStyle = TILE_COLORS[st.key];
  rr(x - w / 2, y - h / 2, w, h, 20 * K);
  ctx.fill();
  if (validTarget) {
    const p = 0.5 + 0.5 * Math.sin(G.time * 7);
    ctx.strokeStyle = `rgba(60,200,110,${0.5 + p * 0.5})`;
    ctx.lineWidth = (4 + p * 3) * K;
  } else if (done) {
    const p = 0.5 + 0.5 * Math.sin(G.time * 6);
    ctx.strokeStyle = `rgba(255,180,0,${0.4 + p * 0.5})`;
    ctx.lineWidth = 4 * K;
  } else {
    ctx.strokeStyle = 'rgba(255,255,255,.8)';
    ctx.lineWidth = 4 * K;
  }
  rr(x - w / 2, y - h / 2, w, h, 20 * K);
  ctx.stroke();

  drawFurniture(st);

  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.font = `${26 * K}px sans-serif`;
  ctx.fillText(svc.icon, x - w / 2 + 24 * K, y - h / 2 + 22 * K);
  ctx.font = `800 ${14.5 * K}px 'Baloo 2', sans-serif`;
  ctx.fillStyle = 'rgba(90,60,80,.75)';
  ctx.fillText(svc.name, x, y + h / 2 + 15 * K);

  if (occ && (occ.state === 'service' || occ.state === 'done')) {
    drawCustomerAtStation(occ, st, busy);
  }

  if (busy) {
    const prog = svc.mode === 'tap' ? occ.workProgress : occ.serviceTimer / durFor(st.key);
    const bw = w * 0.72, bh = 12 * K;
    const bx = x - bw / 2, by = y - h / 2 - 20 * K;
    ctx.fillStyle = 'rgba(255,255,255,.85)';
    rr(bx - 2, by - 2, bw + 4, bh + 4, bh); ctx.fill();
    ctx.fillStyle = svc.mode === 'tap' ? '#ff7ba3' : '#7cc576';
    if (prog > 0.02) { rr(bx, by, bw * Math.min(1, prog), bh, bh / 2); ctx.fill(); }
    if (svc.mode === 'tap') {
      const p = 0.5 + 0.5 * Math.sin(G.time * 9);
      ctx.font = `800 ${(15 + p * 3) * K}px 'Baloo 2', sans-serif`;
      ctx.fillStyle = '#e0447a';
      ctx.fillText('CHẠM! 👆', x, by - 16 * K);
    }
  }

  ctx.restore();
}

function drawFurniture(st) {
  const { ctx, K } = G;
  const { x, y, w, h } = st;
  const fx = x - w * 0.18, fy = y + h * 0.02;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  if (st.key === 'massage') {
    ctx.fillStyle = '#a06a3c';
    ctx.fillRect(fx - w * 0.24, fy + h * 0.13, 8 * K, h * 0.2);
    ctx.fillRect(fx + w * 0.18, fy + h * 0.13, 8 * K, h * 0.2);
    ctx.fillStyle = '#fff';
    rr(fx - w * 0.3, fy - h * 0.1, w * 0.58, h * 0.26, 10 * K); ctx.fill();
    ctx.fillStyle = '#ffd3e2';
    ctx.beginPath(); ctx.ellipse(fx - w * 0.21, fy - h * 0.02, 12 * K, 8 * K, 0, 0, 7); ctx.fill();
  } else if (st.key === 'facial') {
    ctx.fillStyle = '#fff';
    rr(fx - w * 0.28, fy - h * 0.06, w * 0.5, h * 0.22, 12 * K); ctx.fill();
    ctx.fillStyle = '#c9a8f0';
    rr(fx - w * 0.28, fy - h * 0.2, w * 0.16, h * 0.2, 8 * K); ctx.fill();
    ctx.font = `${20 * K}px sans-serif`;
    ctx.fillText('🧴', fx + w * 0.3, fy + h * 0.02);
  } else if (st.key === 'sauna') {
    ctx.fillStyle = '#c98a52';
    rr(fx - w * 0.26, fy - h * 0.34, w * 0.5, h * 0.62, 10 * K); ctx.fill();
    ctx.strokeStyle = 'rgba(120,70,30,.4)'; ctx.lineWidth = 2;
    for (let i = 1; i < 4; i++) {
      ctx.beginPath();
      ctx.moveTo(fx - w * 0.26, fy - h * 0.34 + i * h * 0.155);
      ctx.lineTo(fx + w * 0.24, fy - h * 0.34 + i * h * 0.155);
      ctx.stroke();
    }
    ctx.fillStyle = '#5a3a1e';
    ctx.beginPath(); ctx.arc(fx - w * 0.01, fy - h * 0.1, 15 * K, 0, 7); ctx.fill();
  } else if (st.key === 'nail') {
    ctx.fillStyle = '#fff';
    rr(fx - w * 0.26, fy - h * 0.02, w * 0.48, h * 0.16, 8 * K); ctx.fill();
    ctx.fillStyle = '#c98a52';
    ctx.fillRect(fx - w * 0.18, fy + h * 0.14, 6 * K, h * 0.16);
    ctx.fillRect(fx + w * 0.1, fy + h * 0.14, 6 * K, h * 0.16);
    ctx.font = `${18 * K}px sans-serif`;
    ctx.fillText('💅', fx - w * 0.02, fy - h * 0.12);
  }
}

/* ── khách tại ô dịch vụ (tư thế riêng theo loại) ── */

function drawCustomerAtStation(c, st, busy) {
  const { ctx } = G;
  if (!busy) { drawCustomer(c); return; }
  const K = G.K;
  if (st.key === 'sauna') {
    drawHead(c, st.x - st.w * 0.19, st.y - st.h * 0.08, 13 * K, { sweat: true });
    return;
  }
  if (st.key === 'massage') {
    ctx.save();
    ctx.translate(st.x - st.w * 0.18, st.y - st.h * 0.13);
    ctx.fillStyle = '#fff';
    rr(-st.w * 0.06, -10 * K, st.w * 0.34, 22 * K, 10 * K); ctx.fill();
    ctx.fillStyle = 'rgba(200,170,220,.4)';
    rr(-st.w * 0.06, -10 * K, st.w * 0.34, 8 * K, 6 * K); ctx.fill();
    drawHead(c, -st.w * 0.13, 0, 13 * K, { relaxed: true });
    ctx.restore();
    return;
  }
  if (st.key === 'facial') {
    ctx.save();
    ctx.translate(st.x - st.w * 0.05, st.y - st.h * 0.05);
    ctx.fillStyle = '#fff';
    rr(-st.w * 0.26, -6 * K, st.w * 0.44, 18 * K, 8 * K); ctx.fill();
    drawHead(c, -st.w * 0.2, -4 * K, 13 * K, { mask: true });
    ctx.restore();
    return;
  }
  drawCustomer(c, { small: true });
}

function drawHead(c, x, y, r, opt) {
  const { ctx } = G;
  opt = opt || {};
  ctx.fillStyle = opt.mask ? '#eafaf0' : c.skin;
  ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.arc(x, y - r * 0.28, r * 1.02, Math.PI, 0); ctx.fill();
  ctx.beginPath(); ctx.arc(x, y - r * 1.1, r * 0.34, 0, 7); ctx.fill();
  if (opt.mask) {
    ctx.fillStyle = '#8fd070';
    ctx.beginPath(); ctx.arc(x - r * 0.4, y + r * 0.05, r * 0.24, 0, 7); ctx.fill();
    ctx.beginPath(); ctx.arc(x + r * 0.4, y + r * 0.05, r * 0.24, 0, 7); ctx.fill();
  } else if (opt.relaxed || opt.sweat) {
    ctx.strokeStyle = '#503020'; ctx.lineWidth = Math.max(1.4, r * 0.1); ctx.lineCap = 'round';
    ctx.beginPath(); ctx.arc(x - r * 0.38, y + r * 0.1, r * 0.2, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke();
    ctx.beginPath(); ctx.arc(x + r * 0.38, y + r * 0.1, r * 0.2, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke();
  }
  if (!opt.mask) {
    ctx.strokeStyle = '#c06060'; ctx.lineWidth = Math.max(1.4, r * 0.1); ctx.lineCap = 'round';
    ctx.beginPath(); ctx.arc(x, y + r * 0.35, r * 0.28, 0.2 * Math.PI, 0.8 * Math.PI); ctx.stroke();
  }
  if (opt.sweat) {
    ctx.fillStyle = 'rgba(120,190,255,.85)';
    ctx.beginPath(); ctx.arc(x + r * 1.05, y - r * 0.4 + Math.sin(G.time * 5) * 2, r * 0.18, 0, 7); ctx.fill();
  }
}

/* ── khách đứng/đi ── */

export function drawCustomer(c, opt) {
  const { ctx, K } = G;
  opt = opt || {};
  const u = (opt.small ? 0.85 : 1) * K;
  const moving = c.state === 'walk' || c.state === 'enter' || c.state.startsWith('exit');
  const bob = moving ? Math.abs(Math.sin(c.bobT)) * 5 * u : Math.sin(c.bobT) * 1.5 * u;
  const x = c.x, y = c.y - bob;

  ctx.fillStyle = 'rgba(120,70,40,.2)';
  ctx.beginPath(); ctx.ellipse(c.x, c.y + 22 * u, 26 * u, 8 * u, 0, 0, 7); ctx.fill();

  if (G.selected === c) {
    const p = 0.5 + 0.5 * Math.sin(G.time * 7);
    ctx.strokeStyle = `rgba(60,200,110,${0.55 + p * 0.45})`;
    ctx.lineWidth = 4 * u;
    ctx.beginPath(); ctx.ellipse(c.x, c.y + 20 * u, (32 + p * 4) * u, (11 + p * 2) * u, 0, 0, 7); ctx.stroke();
    ctx.font = `${26 * u}px sans-serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('🔽', x, y - 128 * u - p * 6 * u);
  }

  // dép
  ctx.fillStyle = '#ff8fae';
  ctx.beginPath(); ctx.ellipse(x - 10 * u, c.y + 18 * u, 8 * u, 5 * u, 0, 0, 7); ctx.fill();
  ctx.beginPath(); ctx.ellipse(x + 10 * u, c.y + 18 * u, 8 * u, 5 * u, 0, 0, 7); ctx.fill();

  // áo choàng
  ctx.fillStyle = c.robe;
  rr(x - 24 * u, y - 40 * u, 48 * u, 60 * u, 18 * u);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,.85)';
  ctx.beginPath();
  ctx.moveTo(x - 12 * u, y - 40 * u);
  ctx.lineTo(x, y - 22 * u);
  ctx.lineTo(x + 12 * u, y - 40 * u);
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,.55)';
  ctx.fillRect(x - 24 * u, y - 12 * u, 48 * u, 5 * u);

  // đầu và tóc
  const hr = 20 * u, hy = y - 58 * u;
  ctx.fillStyle = c.skin;
  ctx.beginPath(); ctx.arc(x, hy, hr, 0, 7); ctx.fill();
  ctx.fillStyle = c.hair;
  ctx.beginPath(); ctx.arc(x, hy - hr * 0.25, hr * 1.02, Math.PI * 1.02, -Math.PI * 0.02); ctx.fill();
  ctx.beginPath(); ctx.arc(x, hy - hr * 1.22, hr * 0.4, 0, 7); ctx.fill();
  if (c.type === 'star') {
    ctx.font = `${16 * u}px sans-serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('✨', x + hr * 1.1, hy - hr * 1.1);
  }
  if (c.type === 'granny') {
    ctx.strokeStyle = 'rgba(90,70,90,.7)'; ctx.lineWidth = 1.8 * u;
    ctx.beginPath(); ctx.arc(x - hr * 0.4, hy + hr * 0.05, hr * 0.32, 0, 7); ctx.stroke();
    ctx.beginPath(); ctx.arc(x + hr * 0.4, hy + hr * 0.05, hr * 0.32, 0, 7); ctx.stroke();
  }

  // biểu cảm theo tâm trạng
  const happy = c.state === 'exitHappy' || c.state === 'pay';
  const mood = c.state === 'exitAngry' ? 0 : happy ? 1 : c.patience / c.maxPatience;
  ctx.fillStyle = '#503020';
  if (happy) {
    ctx.strokeStyle = '#503020'; ctx.lineWidth = 2 * u; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.arc(x - hr * 0.4, hy + hr * 0.02, hr * 0.2, Math.PI * 1.15, Math.PI * 1.85); ctx.stroke();
    ctx.beginPath(); ctx.arc(x + hr * 0.4, hy + hr * 0.02, hr * 0.2, Math.PI * 1.15, Math.PI * 1.85); ctx.stroke();
  } else {
    ctx.beginPath(); ctx.arc(x - hr * 0.4, hy + hr * 0.05, hr * 0.13, 0, 7); ctx.fill();
    ctx.beginPath(); ctx.arc(x + hr * 0.4, hy + hr * 0.05, hr * 0.13, 0, 7); ctx.fill();
  }
  ctx.fillStyle = 'rgba(255,120,150,.35)';
  ctx.beginPath(); ctx.ellipse(x - hr * 0.62, hy + hr * 0.38, hr * 0.2, hr * 0.13, 0, 0, 7); ctx.fill();
  ctx.beginPath(); ctx.ellipse(x + hr * 0.62, hy + hr * 0.38, hr * 0.2, hr * 0.13, 0, 0, 7); ctx.fill();
  ctx.strokeStyle = '#c06060'; ctx.lineWidth = 2 * u; ctx.lineCap = 'round';
  ctx.beginPath();
  if (c.state === 'exitAngry' || mood < 0.28) {
    ctx.arc(x, hy + hr * 0.72, hr * 0.24, Math.PI * 1.15, Math.PI * 1.85);
  } else if (mood < 0.6) {
    ctx.moveTo(x - hr * 0.22, hy + hr * 0.52); ctx.lineTo(x + hr * 0.22, hy + hr * 0.52);
  } else {
    ctx.arc(x, hy + hr * 0.38, hr * 0.26, Math.PI * 0.15, Math.PI * 0.85);
  }
  ctx.stroke();

  // tim kiên nhẫn
  const showHearts = c.state === 'sit' || c.state === 'done' || c.state === 'queue' ||
    (c.state === 'service' && c.workIdle > 3);
  if (showHearts) {
    const n = Math.ceil(c.maxPatience);
    const filled = Math.ceil(Math.max(0, c.patience));
    const hs = 9 * u, gap = 11.5 * u;
    const hx0 = x - ((n - 1) * gap) / 2;
    const hyy = hy - hr - 16 * u;
    const low = filled <= 2;
    const blink = low && Math.sin(G.time * 9) > 0;
    for (let i = 0; i < n; i++) {
      const on = i < filled;
      drawHeart(ctx, hx0 + i * gap, hyy, hs, on ? (low && blink ? '#ff2a55' : '#ff5f8f') : 'rgba(150,130,140,.3)');
    }
  }

  // bong bóng ước muốn
  if (c.state === 'sit' || c.state === 'done' || c.state === 'queue') {
    const wish = currentWish(c);
    const icon = wish === 'pay' ? PAY_ICON : SERVICES[wish].icon;
    const by = hy - hr - 52 * u + Math.sin(G.time * 3 + c.id) * 2.5 * u;
    ctx.fillStyle = 'rgba(255,255,255,.95)';
    ctx.beginPath(); ctx.arc(x, by, 22 * u, 0, 7); ctx.fill();
    ctx.beginPath();
    ctx.moveTo(x - 7 * u, by + 18 * u);
    ctx.lineTo(x, by + 30 * u);
    ctx.lineTo(x + 7 * u, by + 18 * u);
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = G.selected === c ? 'rgba(60,200,110,.9)' : 'rgba(220,150,180,.6)';
    ctx.lineWidth = 2.5 * u;
    ctx.beginPath(); ctx.arc(x, by, 22 * u, 0, 7); ctx.stroke();
    ctx.font = `${23 * u}px sans-serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(icon, x, by + 1);
    const left = c.wishes.length - c.wishIndex;
    if (left > 1) {
      ctx.fillStyle = '#f06292';
      ctx.beginPath(); ctx.arc(x + 18 * u, by - 14 * u, 9.5 * u, 0, 7); ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.font = `800 ${12 * u}px 'Baloo 2', sans-serif`;
      ctx.fillText(left, x + 18 * u, by - 13.5 * u);
    }
  }
}

/* ── quầy thu ngân ── */

function drawRegister() {
  const { ctx, K } = G;
  const r = G.register;
  const validTarget = G.selected && currentWish(G.selected) === 'pay';
  const front = G.queueSpots[0].taken;
  const frontReady = front && front.state === 'queue';

  ctx.fillStyle = 'rgba(255,180,90,.2)';
  const q0 = G.queueSpots[0], q2 = G.queueSpots[2];
  rr(q2.x - 36 * K, q0.y - 30 * K, (q0.x - q2.x) + 72 * K, 92 * K, 18 * K);
  ctx.fill();

  ctx.fillStyle = 'rgba(140,80,50,.22)';
  ctx.beginPath(); ctx.ellipse(r.x, r.y + r.h * 0.62, r.w * 0.62, 15 * K, 0, 0, 7); ctx.fill();
  ctx.fillStyle = '#b57a44';
  rr(r.x - r.w / 2, r.y - r.h * 0.2, r.w, r.h * 0.75, 12 * K); ctx.fill();
  ctx.fillStyle = '#d99a5e';
  rr(r.x - r.w / 2 - 6 * K, r.y - r.h * 0.34, r.w + 12 * K, r.h * 0.22, 8 * K); ctx.fill();
  ctx.fillStyle = '#7a4a5e';
  rr(r.x - r.w * 0.16, r.y - r.h * 0.72, r.w * 0.4, r.h * 0.42, 6 * K); ctx.fill();
  ctx.fillStyle = '#cdeafc';
  rr(r.x - r.w * 0.1, r.y - r.h * 0.66, r.w * 0.28, r.h * 0.14, 3 * K); ctx.fill();
  ctx.font = `${22 * K}px sans-serif`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('💰', r.x - r.w * 0.3, r.y - r.h * 0.5);
  ctx.font = `800 ${14 * K}px 'Baloo 2', sans-serif`;
  ctx.fillStyle = 'rgba(90,50,70,.8)';
  ctx.fillText('THU NGÂN', r.x, r.y + r.h * 0.18);

  if (validTarget || frontReady) {
    const p = 0.5 + 0.5 * Math.sin(G.time * 7);
    ctx.strokeStyle = validTarget ? `rgba(60,200,110,${0.5 + p * 0.5})` : `rgba(255,180,0,${0.4 + p * 0.5})`;
    ctx.lineWidth = (4 + p * 3) * K;
    rr(r.x - r.w / 2 - 8 * K, r.y - r.h * 0.8, r.w + 16 * K, r.h * 1.4, 14 * K);
    ctx.stroke();
    if (frontReady && !validTarget) {
      ctx.font = `${(22 + p * 4) * K}px sans-serif`;
      ctx.fillText('👆', r.x, r.y - r.h * 1.05);
    }
  }
}

/* ── khung hình đầy đủ ── */

export function draw(dt) {
  const { ctx, W, H } = G;
  ctx.clearRect(0, 0, W, H);
  drawBackground();
  drawSeats();
  drawRegister();
  for (const st of G.stations) drawStationTile(st, dt);
  const sorted = G.customers.slice().sort((a, b) => a.y - b.y);
  for (const c of sorted) {
    const inService = c.anchor && c.anchor.kind === 'station' && (c.state === 'service' || c.state === 'done');
    if (inService) continue; // ô dịch vụ tự vẽ khách của nó
    drawCustomer(c);
  }
  drawParticles();
}
