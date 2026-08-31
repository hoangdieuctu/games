// ── Vẽ toàn bộ khung cảnh nhà hàng ──

import { G } from './state.js';
import { DISHES, BILL_ICON } from './config.js';
import { plateSpot, bonusSpot, N_PLATES } from './layout.js';
import { drawParticles, drawHeart } from './particles.js';
import { drawPerson } from './avatar.js';
import { staffLook, waterTarget } from './staff.js';
import { cookSlots } from './upgrades.js';

const CHEF_LOOK = {
  skin: '#f2c9a0', hair: 'bob', hairColor: '#3a2a20',
  dress: 'classic', dressColor: '#dfe6ef', apron: 'white', acc: 'chef',
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
  const { ctx } = G;
  const p = 0.5 + 0.5 * Math.sin(G.time * (speed || 7));
  ctx.strokeStyle = col.replace('%A%', (0.42 + p * 0.5).toFixed(2));
  ctx.lineWidth = (3.5 + p * 3) * G.K;
  rr(x, y, w, h, r);
  ctx.stroke();
}

function drawWall() {
  const { ctx, W, H, K } = G;
  const wallH = H * 0.24;

  const wg = ctx.createLinearGradient(0, 0, 0, wallH);
  wg.addColorStop(0, '#fff2df');
  wg.addColorStop(1, '#ffddb8');
  ctx.fillStyle = wg;
  ctx.fillRect(0, 0, W, wallH);

  // giấy dán tường kẻ dọc nhạt
  ctx.strokeStyle = 'rgba(215,150,95,.16)';
  ctx.lineWidth = 6 * K;
  for (let x = 20 * K; x < W; x += 46 * K) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, wallH - 26 * K); ctx.stroke();
  }

  // ván ốp chân tường
  ctx.fillStyle = '#c98a52';
  ctx.fillRect(0, wallH - 26 * K, W, 26 * K);
  ctx.fillStyle = '#a9713c';
  ctx.fillRect(0, wallH - 8 * K, W, 8 * K);
  ctx.fillStyle = 'rgba(255,255,255,.25)';
  ctx.fillRect(0, wallH - 26 * K, W, 4 * K);

  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';

  // đèn thả trần
  for (let i = 0; i < 3; i++) {
    const lx = W * (0.32 + 0.17 * i);
    ctx.strokeStyle = 'rgba(120,80,50,.45)'; ctx.lineWidth = 2 * K;
    ctx.beginPath(); ctx.moveTo(lx, 0); ctx.lineTo(lx, wallH * 0.30); ctx.stroke();
    ctx.fillStyle = '#e8833a';
    ctx.beginPath();
    ctx.moveTo(lx - 22 * K, wallH * 0.54);
    ctx.lineTo(lx + 22 * K, wallH * 0.54);
    ctx.lineTo(lx + 8 * K, wallH * 0.30);
    ctx.lineTo(lx - 8 * K, wallH * 0.30);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#f7b968';
    ctx.beginPath(); ctx.ellipse(lx, wallH * 0.54, 22 * K, 6 * K, 0, 0, 7); ctx.fill();
    ctx.fillStyle = 'rgba(255,214,140,.5)';
    ctx.beginPath(); ctx.arc(lx, wallH * 0.58, 9 * K, 0, 7); ctx.fill();
    ctx.fillStyle = 'rgba(255,220,150,.18)';
    ctx.beginPath();
    ctx.moveTo(lx - 20 * K, wallH * 0.56);
    ctx.lineTo(lx + 20 * K, wallH * 0.56);
    ctx.lineTo(lx + 46 * K, wallH * 1.02);
    ctx.lineTo(lx - 46 * K, wallH * 1.02);
    ctx.closePath(); ctx.fill();
  }

  // tranh treo tường
  const frame = (fx, fy, emo) => {
    ctx.fillStyle = '#a9713c';
    rr(fx - 30 * K, fy - 26 * K, 60 * K, 52 * K, 7 * K); ctx.fill();
    ctx.fillStyle = '#fff6ea';
    rr(fx - 24 * K, fy - 20 * K, 48 * K, 40 * K, 4 * K); ctx.fill();
    ctx.font = `${26 * K}px sans-serif`;
    ctx.fillText(emo, fx, fy + 1);
  };
  frame(W * 0.10, wallH * 0.42, '🍕');
  frame(W * 0.20, wallH * 0.42, '🥗');
  frame(W * 0.70, wallH * 0.42, '☕');

  // đồng hồ tường
  const cx = W * 0.79, cy = wallH * 0.42, cr = 24 * K;
  ctx.fillStyle = '#a9713c';
  ctx.beginPath(); ctx.arc(cx, cy, cr, 0, 7); ctx.fill();
  ctx.fillStyle = '#fff6ea';
  ctx.beginPath(); ctx.arc(cx, cy, cr * 0.78, 0, 7); ctx.fill();
  ctx.strokeStyle = '#96603a'; ctx.lineWidth = 2.4 * K; ctx.lineCap = 'round';
  const ang = G.time * 0.25;
  ctx.beginPath(); ctx.moveTo(cx, cy);
  ctx.lineTo(cx + Math.sin(ang) * cr * 0.5, cy - Math.cos(ang) * cr * 0.5); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx, cy);
  ctx.lineTo(cx + Math.sin(ang * 6) * cr * 0.62, cy - Math.cos(ang * 6) * cr * 0.62); ctx.stroke();

  return wallH;
}

function drawFloor(wallH) {
  const { ctx, W, H, K } = G;
  ctx.fillStyle = '#e9b586';
  ctx.fillRect(0, wallH, W, H - wallH);
  // gạch lát so le hai màu
  const tile = 62 * K;
  let row = 0;
  for (let y = wallH; y < H; y += tile, row++) {
    for (let x = -tile + (row % 2 ? tile / 2 : 0), col = 0; x < W; x += tile, col++) {
      if ((col + row) % 2) continue;
      ctx.fillStyle = '#dfa471';
      ctx.fillRect(x, y, tile, Math.min(tile, H - y));
    }
  }
  ctx.strokeStyle = 'rgba(150,95,50,.13)';
  ctx.lineWidth = 1.5;
  for (let y = wallH; y < H; y += tile) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
  }
  // bóng tường đổ xuống sàn
  const sg = ctx.createLinearGradient(0, wallH, 0, wallH + 42 * K);
  sg.addColorStop(0, 'rgba(120,70,30,.22)');
  sg.addColorStop(1, 'rgba(120,70,30,0)');
  ctx.fillStyle = sg;
  ctx.fillRect(0, wallH, W, 42 * K);
}

function drawDoorAndWaitArea() {
  const { ctx, W, H, K } = G;
  // cửa ra vào
  ctx.fillStyle = '#a9713c';
  rr(-10, G.door.y - 106 * K, 26 * K, 212 * K, 8 * K); ctx.fill();
  ctx.fillStyle = '#9fd8ef';
  rr(2 * K, G.door.y - 88 * K, 12 * K, 96 * K, 6 * K); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,.5)';
  rr(4 * K, G.door.y - 84 * K, 5 * K, 40 * K, 3 * K); ctx.fill();
  ctx.fillStyle = 'rgba(120,80,40,.18)';
  ctx.beginPath(); ctx.ellipse(26 * K, G.door.y + 100 * K, 46 * K, 14 * K, 0, 0, 7); ctx.fill();
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.font = `${22 * K}px sans-serif`;
  ctx.fillText('🚪', 14 * K, G.door.y - 122 * K);

  // thảm khu chờ
  const ws = G.waitSpots;
  const xMin = Math.min(...ws.map(s => s.x)), xMax = Math.max(...ws.map(s => s.x));
  const rx = xMin - 50 * K, ry = ws[0].y - 66 * K;
  const rw = xMax - xMin + 100 * K, rh = ws[ws.length - 1].y - ws[0].y + 122 * K;
  ctx.fillStyle = '#e08a5a';
  rr(rx, ry, rw, rh, 26 * K); ctx.fill();
  ctx.fillStyle = '#eaa270';
  rr(rx + 8 * K, ry + 8 * K, rw - 16 * K, rh - 16 * K, 20 * K); ctx.fill();
  ctx.save();
  rr(rx + 8 * K, ry + 8 * K, rw - 16 * K, rh - 16 * K, 20 * K); ctx.clip();
  ctx.fillStyle = 'rgba(255,255,255,.14)';
  for (let i = 0; i < 14; i++) ctx.fillRect(rx, ry + i * 34 * K, rw, 16 * K);
  ctx.restore();
  ctx.strokeStyle = 'rgba(255,255,255,.4)'; ctx.lineWidth = 3 * K;
  rr(rx + 20 * K, ry + 20 * K, rw - 40 * K, rh - 40 * K, 14 * K); ctx.stroke();
  ctx.font = `800 ${17 * K}px 'Baloo 2', sans-serif`;
  ctx.fillStyle = '#fff';
  ctx.fillText('❋ CHỜ BÀN ❋', rx + rw / 2, ry + rh - 22 * K);

  // chậu cây góc phòng
  ctx.font = `${44 * K}px sans-serif`;
  ctx.fillText('🪴', 34 * K, H - 44 * K);
  ctx.font = `${34 * K}px sans-serif`;
  ctx.fillText('🌿', W * 0.235, H * 0.32);
}

function drawBackground() {
  const wallH = drawWall();
  drawFloor(wallH);
  drawDoorAndWaitArea();
}

/* ── quầy nước mời khách ── */

function drawWater() {
  const { ctx, K } = G;
  const w = G.water;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillStyle = 'rgba(120,80,40,.2)';
  ctx.beginPath(); ctx.ellipse(w.x, w.y + 30 * K, 40 * K, 12 * K, 0, 0, 7); ctx.fill();
  // tủ gỗ nhỏ
  ctx.fillStyle = '#a9713c';
  rr(w.x - 32 * K, w.y - 8 * K, 64 * K, 38 * K, 8 * K); ctx.fill();
  ctx.fillStyle = '#c98a52';
  rr(w.x - 36 * K, w.y - 18 * K, 72 * K, 13 * K, 6 * K); ctx.fill();
  ctx.fillStyle = 'rgba(0,0,0,.12)';
  rr(w.x - 22 * K, w.y + 4 * K, 44 * K, 20 * K, 5 * K); ctx.fill();
  // bình nước cam + ly
  ctx.fillStyle = 'rgba(255,255,255,.8)';
  rr(w.x - 20 * K, w.y - 56 * K, 30 * K, 40 * K, 7 * K); ctx.fill();
  ctx.fillStyle = '#ff9f43';
  rr(w.x - 17 * K, w.y - 42 * K, 24 * K, 24 * K, 5 * K); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,.55)';
  rr(w.x - 14 * K, w.y - 50 * K, 6 * K, 30 * K, 3 * K); ctx.fill();
  ctx.font = `${19 * K}px sans-serif`;
  ctx.fillText('🍹', w.x + 22 * K, w.y - 30 * K);
  ctx.font = `800 ${13 * K}px 'Baloo 2', sans-serif`;
  ctx.fillStyle = '#fff';
  const lw = 74 * K;
  ctx.fillStyle = 'rgba(160,95,50,.85)';
  rr(w.x - lw / 2, w.y + 32 * K, lw, 20 * K, 10 * K); ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.fillText('Mời nước', w.x, w.y + 42 * K);
  if (G.running && waterTarget()) {
    glowRing(w.x - 46 * K, w.y - 64 * K, 92 * K, 118 * K, 16 * K, 'rgba(60,200,110,%A%)', 6);
  }
}

/* ── khu bếp: đầu bếp, nồi đang nấu, đĩa món chờ bưng ── */

function drawPass() {
  const { ctx, W, H, K } = G;
  const p = G.pass;
  const zx = W - p.w;

  // tường gạch men khu bếp
  ctx.fillStyle = '#f7ece0';
  ctx.fillRect(zx, 0, W - zx, H);
  ctx.strokeStyle = 'rgba(185,150,120,.3)';
  ctx.lineWidth = 1.6;
  const t = 32 * K;
  for (let y = 0, r = 0; y < H; y += t, r++) {
    ctx.beginPath(); ctx.moveTo(zx, y); ctx.lineTo(W, y); ctx.stroke();
    for (let x = zx + (r % 2 ? t / 2 : 0); x < W; x += t) {
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + t); ctx.stroke();
    }
  }
  // vách ngăn
  ctx.fillStyle = '#c98a52';
  ctx.fillRect(zx - 7 * K, 0, 7 * K, H);
  ctx.fillStyle = 'rgba(255,255,255,.3)';
  ctx.fillRect(zx - 7 * K, 0, 2 * K, H);

  // bếp lò sau lưng đầu bếp (cao theo số chảo)
  const sx = G.chef.x, sy = G.chef.y;
  const nSlots = cookSlots();
  ctx.fillStyle = '#7b828c';
  rr(sx - 42 * K, sy + 34 * K, 84 * K, (56 + nSlots * 48) * K, 12 * K); ctx.fill();
  ctx.fillStyle = '#9aa2ac';
  rr(sx - 42 * K, sy + 34 * K, 84 * K, 12 * K, 6 * K); ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,.2)'; ctx.lineWidth = 2 * K;
  for (let i = 0; i < nSlots; i++) {
    ctx.beginPath(); ctx.arc(sx, sy + (66 + i * 48) * K, 25 * K, 0, 7); ctx.stroke();
  }

  // nồi trên bếp kèm vòng tiến độ
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  for (let i = 0; i < nSlots; i++) {
    const cx = sx, cy = sy + (66 + i * 48) * K;
    ctx.fillStyle = 'rgba(0,0,0,.18)';
    ctx.beginPath(); ctx.ellipse(cx, cy + 14 * K, 26 * K, 7 * K, 0, 0, 7); ctx.fill();
    ctx.fillStyle = '#4d525a';
    rr(cx - 24 * K, cy - 13 * K, 48 * K, 28 * K, 8 * K); ctx.fill();
    ctx.fillStyle = '#5f6670';
    rr(cx - 28 * K, cy - 17 * K, 56 * K, 9 * K, 4 * K); ctx.fill();
    const k = G.cooking[i];
    if (!k) continue;
    if (k.done) {
      const pl = 0.5 + 0.5 * Math.sin(G.time * 6);
      ctx.font = `${(23 + pl * 3) * K}px sans-serif`;
      ctx.fillText(DISHES[k.dish].icon, cx, cy - 30 * K);
    } else {
      ctx.font = `${17 * K}px sans-serif`;
      ctx.fillText(DISHES[k.dish].icon, cx, cy - 32 * K);
      ctx.strokeStyle = 'rgba(255,255,255,.85)'; ctx.lineWidth = 5 * K;
      ctx.beginPath(); ctx.arc(cx, cy, 21 * K, 0, 7); ctx.stroke();
      ctx.strokeStyle = '#ff8a3d';
      ctx.beginPath();
      ctx.arc(cx, cy, 21 * K, -Math.PI / 2, -Math.PI / 2 + (k.t / k.dur) * Math.PI * 2);
      ctx.stroke();
    }
  }

  // đầu bếp
  drawPerson(ctx, G.chef.x, G.chef.y, K, CHEF_LOOK, {
    bob: Math.abs(Math.sin(G.chef.bobT)) * 3 * K,
    mood: 1, happy: true,
  });

  // quầy đặt món chờ bưng + đèn hâm nóng
  const px = plateSpot(0).x;
  const cTop = p.y - p.h * 0.44, cH = p.h * 0.88;
  ctx.fillStyle = 'rgba(120,80,40,.16)';
  rr(px - 40 * K, cTop + 6 * K, 80 * K, cH, 18 * K); ctx.fill();
  ctx.fillStyle = '#b57a44';
  rr(px - 38 * K, cTop, 76 * K, cH, 16 * K); ctx.fill();
  ctx.fillStyle = '#d99a5e';
  rr(px - 38 * K, cTop, 76 * K, cH - 12 * K, 16 * K); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,.3)';
  rr(px - 32 * K, cTop + 6 * K, 64 * K, 8 * K, 4 * K); ctx.fill();
  // đèn hâm nóng phía trên quầy
  ctx.fillStyle = '#8a5a2e';
  rr(px - 30 * K, cTop - 22 * K, 60 * K, 10 * K, 5 * K); ctx.fill();
  ctx.fillStyle = 'rgba(255,180,80,.45)';
  ctx.beginPath();
  ctx.moveTo(px - 28 * K, cTop - 12 * K);
  ctx.lineTo(px + 28 * K, cTop - 12 * K);
  ctx.lineTo(px + 40 * K, cTop + cH * 0.35);
  ctx.lineTo(px - 40 * K, cTop + cH * 0.35);
  ctx.closePath(); ctx.fill();
  ctx.font = `800 ${12 * K}px 'Baloo 2', sans-serif`;
  ctx.fillStyle = 'rgba(120,70,35,.75)';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('QUẦY BẾP', px, cTop + cH - 14 * K);

  for (let i = 0; i < N_PLATES; i++) {
    const sp = plateSpot(i);
    const pl = G.plates[i];
    if (!pl) {
      ctx.strokeStyle = 'rgba(255,255,255,.45)';
      ctx.lineWidth = 2.5 * K;
      ctx.beginPath(); ctx.arc(sp.x, sp.y, 19 * K, 0, 7); ctx.stroke();
      continue;
    }
    ctx.fillStyle = 'rgba(90,55,25,.22)';
    ctx.beginPath(); ctx.ellipse(sp.x, sp.y + 13 * K, 24 * K, 7 * K, 0, 0, 7); ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(sp.x, sp.y, 24 * K, 0, 7); ctx.fill();
    ctx.fillStyle = DISHES[pl.dish].color;
    ctx.beginPath(); ctx.arc(sp.x, sp.y, 16 * K, 0, 7); ctx.fill();
    ctx.font = `${25 * K}px sans-serif`;
    ctx.fillText(DISHES[pl.dish].icon, sp.x, sp.y);
    glowRing(sp.x - 29 * K, sp.y - 29 * K, 58 * K, 58 * K, 16 * K, 'rgba(255,170,0,%A%)', 6);
  }

  // chuông đơn đặc biệt
  if (G.bonusReady) {
    const b = bonusSpot();
    const pl = 0.5 + 0.5 * Math.sin(G.time * 7);
    ctx.fillStyle = '#ffd76a';
    ctx.beginPath(); ctx.arc(b.x, b.y, (25 + pl * 3) * K, 0, 7); ctx.fill();
    ctx.strokeStyle = `rgba(255,255,255,${0.6 + pl * 0.4})`;
    ctx.lineWidth = 3.5 * K;
    ctx.beginPath(); ctx.arc(b.x, b.y, (25 + pl * 3) * K, 0, 7); ctx.stroke();
    ctx.font = `${25 * K}px sans-serif`;
    ctx.fillText('🔔', b.x, b.y + 1);
    ctx.fillStyle = 'rgba(180,105,15,.9)';
    rr(b.x - 52 * K, b.y - 46 * K, 104 * K, 20 * K, 10 * K); ctx.fill();
    ctx.font = `800 ${12 * K}px 'Baloo 2', sans-serif`;
    ctx.fillStyle = '#fff';
    ctx.fillText('ĐƠN ĐẶC BIỆT', b.x, b.y - 36 * K);
  }
}

/* ── bàn ăn ── */

function drawChair(x, y, w, h) {
  const { ctx, K } = G;
  // lưng ghế
  ctx.fillStyle = '#96603a';
  rr(x - w * 0.24, y, w * 0.48, h * 0.5, 10 * K); ctx.fill();
  ctx.fillStyle = '#b07a46';
  rr(x - w * 0.19, y + 5 * K, w * 0.38, h * 0.34, 7 * K); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,.18)';
  rr(x - w * 0.19, y + 5 * K, w * 0.38, h * 0.1, 5 * K); ctx.fill();
  // mặt ghế thò ra hai bên khách
  ctx.fillStyle = '#a9713c';
  rr(x - w * 0.28, y + h * 0.5, w * 0.56, h * 0.16, 7 * K); ctx.fill();
}

function drawTable(t, dt) {
  const { ctx, K } = G;
  let sx = 0;
  if (t.shakeT > 0) { t.shakeT -= dt; sx = Math.sin(t.shakeT * 60) * 5 * K; }
  ctx.save();
  ctx.translate(sx, 0);

  const free = !t.cust && !t.dirty;
  const validTarget = G.selected && G.selected.state === 'wait' && free;
  const c = t.cust;

  // ghế phía sau khách
  drawChair(t.x, t.y - t.h * 0.78, t.w, t.h);

  // khách ngồi (vẽ trước để mặt bàn che phần dưới)
  if (c && c.state !== 'walk') {
    drawPerson(ctx, c.x, c.y, K, c.look, {
      seated: true,
      bob: Math.sin(c.bobT) * 1.6 * K,
      mood: c.state === 'eating' ? 1 : c.patience / c.maxPatience,
      happy: c.state === 'eating' || c.state === 'bill',
    });
  }

  // bóng + chân bàn
  const ty = t.y + t.h * 0.16;      // tâm mặt bàn
  const trx = t.w * 0.47, tryy = t.h * 0.24;
  ctx.fillStyle = 'rgba(110,70,35,.24)';
  ctx.beginPath(); ctx.ellipse(t.x, t.y + t.h * 0.52, trx * 0.9, tryy * 0.5, 0, 0, 7); ctx.fill();
  ctx.fillStyle = '#96603a';
  ctx.fillRect(t.x - 6 * K, ty, 12 * K, t.h * 0.36);
  ctx.fillStyle = '#a9713c';
  ctx.beginPath(); ctx.ellipse(t.x, t.y + t.h * 0.5, 22 * K, 7 * K, 0, 0, 7); ctx.fill();

  // khăn trải bàn kẻ ô
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(t.x - trx, ty);
  ctx.lineTo(t.x - trx, ty + t.h * 0.24);
  ctx.quadraticCurveTo(t.x, ty + t.h * 0.40, t.x + trx, ty + t.h * 0.24);
  ctx.lineTo(t.x + trx, ty);
  ctx.closePath();
  ctx.fillStyle = '#f5ece2';
  ctx.fill();
  ctx.clip();
  ctx.fillStyle = 'rgba(230,110,110,.22)';
  for (let i = -3; i <= 3; i++) ctx.fillRect(t.x + i * t.w * 0.16 - t.w * 0.04, ty, t.w * 0.08, t.h * 0.44);
  ctx.fillStyle = 'rgba(120,70,40,.12)';
  ctx.fillRect(t.x - trx, ty + t.h * 0.02, trx * 2, t.h * 0.42);
  ctx.restore();

  ctx.fillStyle = '#fff8f0';
  ctx.beginPath(); ctx.ellipse(t.x, ty, trx, tryy, 0, 0, 7); ctx.fill();
  ctx.save();
  ctx.beginPath(); ctx.ellipse(t.x, ty, trx, tryy, 0, 0, 7); ctx.clip();
  ctx.fillStyle = 'rgba(230,110,110,.2)';
  for (let i = -3; i <= 3; i++) ctx.fillRect(t.x + i * t.w * 0.16 - t.w * 0.04, ty - tryy, t.w * 0.08, tryy * 2);
  for (let j = -2; j <= 2; j++) ctx.fillRect(t.x - trx, ty + j * tryy * 0.5 - tryy * 0.09, trx * 2, tryy * 0.18);
  ctx.restore();
  ctx.strokeStyle = 'rgba(190,120,80,.35)'; ctx.lineWidth = 2 * K;
  ctx.beginPath(); ctx.ellipse(t.x, ty, trx, tryy, 0, 0, 7); ctx.stroke();

  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  if (t.dirty) {
    ctx.font = `${26 * K}px sans-serif`;
    ctx.fillText('🍽️', t.x - t.w * 0.15, ty - tryy * 0.1);
    ctx.font = `${18 * K}px sans-serif`;
    ctx.fillText('🥢', t.x + t.w * 0.16, ty + tryy * 0.2);
    ctx.fillText('🧽', t.x + t.w * 0.42, t.y - t.h * 0.36 + Math.sin(G.time * 4) * 3 * K);
    glowRing(t.x - t.w * 0.52, ty - tryy - 8 * K, t.w * 1.04, tryy * 2 + t.h * 0.34, 16 * K,
      'rgba(150,120,255,%A%)', 5);
  } else {
    // bình hoa nhỏ
    ctx.fillStyle = '#9fd8ef';
    rr(t.x + t.w * 0.3, ty - 6 * K, 11 * K, 15 * K, 3 * K); ctx.fill();
    ctx.font = `${17 * K}px sans-serif`;
    ctx.fillText('🌷', t.x + t.w * 0.3 + 5 * K, ty - 14 * K);
    if (c && (c.state === 'eating' || c.state === 'bill')) {
      ctx.font = `${23 * K}px sans-serif`;
      c.orders.forEach((d, i) => {
        ctx.fillStyle = '#fff';
        const dx = t.x - t.w * 0.2 + i * t.w * 0.24;
        ctx.beginPath(); ctx.ellipse(dx, ty + 2 * K, 17 * K, 11 * K, 0, 0, 7); ctx.fill();
        ctx.fillStyle = '#000';
        ctx.fillText(DISHES[d].icon, dx, ty);
      });
    }
  }
  if (validTarget) {
    glowRing(t.x - t.w * 0.54, t.y - t.h * 0.9, t.w * 1.08, t.h * 1.5, 18 * K, 'rgba(60,200,110,%A%)', 7);
    ctx.font = `${24 * K}px sans-serif`;
    ctx.fillText('👆', t.x, t.y - t.h * 1.0 + Math.sin(G.time * 6) * 4 * K);
  }
  ctx.restore();
}

/* ── bạn phục vụ ── */

function drawStaffPerson(s) {
  const { ctx, K } = G;
  const moving = s.state === 'walk' || (s.state === 'idle' && Math.hypot(s.tx - s.x, s.ty - s.y) > 3);
  const acting = s.state === 'act';
  const bob = moving ? Math.abs(Math.sin(s.bobT)) * 5 * K
    : acting ? Math.abs(Math.sin(G.time * 10)) * 2.5 * K
    : Math.sin(s.bobT) * 1.5 * K;
  drawPerson(ctx, s.x, s.y, K, staffLook(s), {
    bob, mood: 1, happy: true,
    swing: moving ? Math.sin(s.bobT) * 0.9 : 0,
  });
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  if (s.carry) {
    // khay bưng món trên tay
    const ty = s.y - 74 * K - bob;
    ctx.fillStyle = 'rgba(120,80,50,.2)';
    ctx.beginPath(); ctx.ellipse(s.x + 26 * K, ty + 12 * K, 20 * K, 6 * K, 0, 0, 7); ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(s.x + 26 * K, ty, 17 * K, 0, 7); ctx.fill();
    ctx.font = `${19 * K}px sans-serif`;
    ctx.fillText(DISHES[s.carry.dish].icon, s.x + 26 * K, ty);
  } else if (acting) {
    ctx.font = `${16 * K}px sans-serif`;
    ctx.fillText('✨', s.x + 26 * K, s.y - 30 * K + Math.sin(G.time * 12) * 4 * K);
  }
}

/* ── tim kiên nhẫn + bong bóng mong muốn ── */

function drawCustomerUi(c) {
  const { ctx, K } = G;
  if (c.state.startsWith('exit') || c.state === 'walk') return;
  const x = c.x;
  const headY = c.y - 64 * K;
  const hr = 20 * K;

  // tim
  if (c.state !== 'eating') {
    const n = Math.ceil(c.maxPatience);
    const filled = Math.ceil(Math.max(0, c.patience));
    const hs = 9 * K, gap = 11.5 * K;
    const hx0 = x - ((n - 1) * gap) / 2;
    const hy = headY - hr - 23 * K;
    const low = filled <= 2;
    const blink = low && Math.sin(G.time * 9) > 0;
    for (let i = 0; i < n; i++) {
      drawHeart(ctx, hx0 + i * gap, hy, hs,
        i < filled ? (low && blink ? '#ff2a55' : '#ff5f8f') : 'rgba(150,130,140,.3)');
    }
  }

  // vòng sáng chọn khách đang chờ bàn
  if (G.selected === c) {
    const p = 0.5 + 0.5 * Math.sin(G.time * 7);
    ctx.strokeStyle = `rgba(60,200,110,${0.55 + p * 0.45})`;
    ctx.lineWidth = 4 * K;
    ctx.beginPath(); ctx.ellipse(c.x, c.y + 20 * K, (32 + p * 4) * K, (11 + p * 2) * K, 0, 0, 7); ctx.stroke();
    ctx.font = `${24 * K}px sans-serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('🔽', c.x, c.y - 122 * K - p * 6 * K);
  }

  // bong bóng
  let icons = null, badge = 0;
  if (c.state === 'wait') icons = null;
  else if (c.state === 'menu') icons = ['📖'];
  else if (c.state === 'order') icons = c.orders.map(d => DISHES[d].icon);
  else if (c.state === 'waitFood') { icons = ['⏳']; badge = c.orders.length - c.served; }
  else if (c.state === 'eating') icons = ['😋'];
  else if (c.state === 'bill') icons = [BILL_ICON];
  if (!icons) return;

  const bw = 22 * K + (icons.length - 1) * 20 * K;
  const by = headY - hr - 60 * K + Math.sin(G.time * 3 + c.id) * 2.5 * K;
  ctx.fillStyle = 'rgba(255,255,255,.95)';
  rr(x - bw, by - 22 * K, bw * 2, 44 * K, 22 * K); ctx.fill();
  ctx.beginPath();
  ctx.moveTo(x - 7 * K, by + 18 * K);
  ctx.lineTo(x, by + 30 * K);
  ctx.lineTo(x + 7 * K, by + 18 * K);
  ctx.closePath(); ctx.fill();
  const hot = c.state === 'order' || c.state === 'bill' || c.state === 'wait';
  ctx.strokeStyle = G.selected === c ? 'rgba(60,200,110,.95)'
    : hot ? 'rgba(255,170,60,.8)' : 'rgba(210,160,130,.5)';
  ctx.lineWidth = 2.5 * K;
  rr(x - bw, by - 22 * K, bw * 2, 44 * K, 22 * K); ctx.stroke();
  ctx.font = `${23 * K}px sans-serif`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  const gapI = 40 * K;
  icons.forEach((ic, i) => {
    ctx.fillText(ic, x - (icons.length - 1) * gapI / 2 + i * gapI, by + 1);
  });
  if (badge > 1) {
    ctx.fillStyle = '#f06292';
    ctx.beginPath(); ctx.arc(x + bw - 4 * K, by - 16 * K, 9.5 * K, 0, 7); ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = `800 ${12 * K}px 'Baloo 2', sans-serif`;
    ctx.fillText(badge, x + bw - 4 * K, by - 15.5 * K);
  }

}

/* ── số thứ tự việc đang chờ phục vụ ── */

function drawTaskBadges() {
  const { ctx, K } = G;
  G.tasks.forEach((t, i) => {
    let bx, by;
    if (t.type === 'water') { bx = G.water.x + 34 * K; by = G.water.y - 40 * K; }
    else if (t.type === 'serve') { const sp = plateSpot(t.plate); bx = sp.x - 26 * K; by = sp.y - 22 * K; }
    else {
      const tb = G.tables[t.tIdx];
      if (!tb) return;
      bx = tb.x + tb.w * 0.44; by = tb.y - tb.h * 0.34;
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

/* ── khung hình đầy đủ ── */

export function draw(dt) {
  const { ctx, W, H, K } = G;
  ctx.clearRect(0, 0, W, H);
  drawBackground();
  drawWater();
  drawPass();
  for (const t of G.tables) drawTable(t, dt);

  // khách đang đi + bạn phục vụ, vẽ theo thứ tự từ trên xuống
  const actors = [];
  for (const c of G.customers) {
    const seated = c.anchor && c.anchor.kind === 'table' && c.state !== 'walk';
    if (!seated) {
      const moving = c.state === 'walk' || c.state.startsWith('exit');
      actors.push({
        y: c.y, draw: () => drawPerson(ctx, c.x, c.y, K, c.look, {
          bob: moving ? Math.abs(Math.sin(c.bobT)) * 5 * K : Math.sin(c.bobT) * 1.5 * K,
          mood: c.state === 'exitAngry' ? 0 : c.patience / c.maxPatience,
          happy: c.state === 'exitHappy',
          swing: moving ? Math.sin(c.bobT) * 0.9 : 0,
        }),
      });
    }
  }
  for (const s of G.staff) actors.push({ y: s.y, draw: () => drawStaffPerson(s) });
  actors.sort((a, b) => a.y - b.y);
  for (const a of actors) a.draw();

  for (const c of G.customers) drawCustomerUi(c);
  drawTaskBadges();
  drawParticles();
}
