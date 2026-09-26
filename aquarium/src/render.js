/* ═══════════════════════ render.js — vẽ hồ, trang trí, cá (phong cách hoạt hình phẳng) ═══════════════════════ */

const R = { bubbles: [], debris: [], sparks: [], time: 0, layout: null, selected: null, hover: null, clean: null, dragDeco: null, ghost: null, roomBubbles: [] };

function hash01(str, n = 0) {
  let h = 2166136261 ^ n;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  return ((h >>> 0) % 10000) / 10000;
}
function shade(hex, k) { // k>0 sáng, <0 tối
  const n = parseInt(hex.slice(1), 16); let r = n >> 16, g = (n >> 8) & 255, b = n & 255;
  const f = (c) => clamp(Math.round(k > 0 ? c + (255 - c) * k : c * (1 + k)), 0, 255);
  return `rgb(${f(r)},${f(g)},${f(b)})`;
}
function withAlpha(hex, a) { const n = parseInt(hex.slice(1), 16); return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`; }
function rrect(ctx, x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2);
  ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
}
// giọt nước / lá bo tròn: từ (0,0) tới (0,-len), rộng wd
function leafPath(ctx, len, wd) {
  ctx.beginPath(); ctx.moveTo(0, 0);
  ctx.bezierCurveTo(-wd, -len * 0.25, -wd, -len * 0.75, 0, -len);
  ctx.bezierCurveTo(wd, -len * 0.75, wd, -len * 0.25, 0, 0); ctx.closePath();
}
function blob(ctx, x, y, rx, ry) { ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, 7); ctx.fill(); }

function computeLayout(t, rect) {
  const d = tankDims(t), spec = tankSpec(t.kind, t.size);
  const pad = 22;
  const s = Math.min(((rect.w - pad * 2) * spec.fit) / d.W, ((rect.h - pad * 2) * spec.fit) / d.H);
  const w = d.W * s, h = d.H * s;
  const x = rect.x + (rect.w - w) / 2, y = rect.y + (rect.h - h) / 2 + rect.h * 0.02;
  return { x, y, w, h, s, W: d.W, H: d.H };
}
const toPx = (L, cx, cy) => [L.x + cx * L.s, L.y + cy * L.s];
const toCm = (L, px, py) => [(px - L.x) / L.s, (py - L.y) / L.s];

/* ── Tia nắng xiên & bọt lơ lửng (dùng chung cho phòng và hồ) ── */
function drawRays(ctx, x, y, w, h, alpha, time) {
  ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
  for (let i = 0; i < 5; i++) {
    const bw = w * (0.05 + (i % 2) * 0.03), x0 = x + w * (0.05 + i * 0.2) + Math.sin(time * 0.2 + i * 1.7) * w * 0.03;
    ctx.fillStyle = `rgba(255,255,255,${alpha * (0.6 + 0.4 * Math.sin(time * 0.5 + i))})`;
    ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x0 + bw, y); ctx.lineTo(x0 + bw + w * 0.22, y + h); ctx.lineTo(x0 + w * 0.22 - bw * 0.6, y + h); ctx.closePath(); ctx.fill();
  }
  ctx.restore();
}
function drawDots(ctx, seed, x, y, w, h, n, time, alpha) {
  for (let i = 0; i < n; i++) {
    const px = x + hash01(seed, i) * w, py = y + ((hash01(seed, i + 77) * h - time * (4 + hash01(seed, i + 9) * 6)) % h + h) % h;
    ctx.fillStyle = `rgba(255,255,255,${alpha})`; blob(ctx, px, py, 1.5 + hash01(seed, i + 33) * 4, 1.5 + hash01(seed, i + 33) * 4);
  }
}

/* ── Phòng: đại dương sáng, đồi và cát ở đáy màn hình ── */
function drawRoom(ctx, W, Hh, night) {
  const g = ctx.createLinearGradient(0, 0, 0, Hh);
  if (night) { g.addColorStop(0, '#173a6e'); g.addColorStop(1, '#0a1c3d'); }
  else { g.addColorStop(0, '#7dd6f8'); g.addColorStop(0.6, '#43acea'); g.addColorStop(1, '#2d8fd6'); }
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, Hh);
  drawRays(ctx, 0, 0, W, Hh, night ? 0.03 : 0.07, R.time);
  drawDots(ctx, 'room', 0, 0, W, Hh, 18, R.time, night ? 0.08 : 0.16);
  // đồi xa
  ctx.fillStyle = night ? 'rgba(10,30,70,.7)' : 'rgba(30,80,150,.32)';
  ctx.beginPath(); ctx.moveTo(0, Hh);
  ctx.lineTo(0, Hh * 0.72); ctx.quadraticCurveTo(W * 0.12, Hh * 0.5, W * 0.26, Hh * 0.74); ctx.quadraticCurveTo(W * 0.4, Hh * 0.6, W * 0.55, Hh * 0.78);
  ctx.quadraticCurveTo(W * 0.7, Hh * 0.52, W * 0.86, Hh * 0.75); ctx.quadraticCurveTo(W * 0.95, Hh * 0.66, W, Hh * 0.7); ctx.lineTo(W, Hh); ctx.closePath(); ctx.fill();
  // cát đáy màn hình
  ctx.fillStyle = night ? '#3d4d6b' : '#f2dea8';
  ctx.beginPath(); ctx.moveTo(0, Hh); ctx.lineTo(0, Hh * 0.9);
  for (let x = 0; x <= W; x += W / 6) ctx.quadraticCurveTo(x + W / 12, Hh * 0.86, x + W / 6, Hh * 0.9);
  ctx.lineTo(W, Hh); ctx.closePath(); ctx.fill();
  ctx.fillStyle = night ? 'rgba(0,0,0,.15)' : 'rgba(210,170,100,.4)';
  for (let i = 0; i < 12; i++) blob(ctx, hash01('sand', i) * W, Hh * (0.92 + hash01('sand', i + 5) * 0.07), 5 + hash01('sand', i + 9) * 9, 2.5 + hash01('sand', i + 9) * 3);
}

/* ── Hồ: khung trắng bo tròn, nước sáng, đồi xanh phía sau ── */
function drawTankBack(ctx, t, L, night) {
  const bg = BACKGROUNDS[t.bg] || BACKGROUNDS.blue;
  const lightOn = t.eq.light > 0;
  const rad = Math.max(10, L.s * 1.6);
  // bóng đổ
  ctx.save(); ctx.fillStyle = 'rgba(10,40,90,.28)'; ctx.filter = 'blur(16px)';
  rrect(ctx, L.x - 4, L.y + 18, L.w + 8, L.h + 6, rad); ctx.fill(); ctx.restore();
  // tủ đứng
  const stH = Math.max(10, L.s * 1.8);
  ctx.fillStyle = night ? '#6e5a42' : '#d9a86c'; rrect(ctx, L.x - 8, L.y + L.h + 2, L.w + 16, stH + 6, 8); ctx.fill();
  ctx.fillStyle = night ? '#8a7256' : '#f0c48a'; rrect(ctx, L.x - 8, L.y + L.h + 2, L.w + 16, stH * 0.5, 8); ctx.fill();
  // nước
  ctx.save(); rrect(ctx, L.x, L.y, L.w, L.h, rad * 0.6); ctx.clip();
  const g = ctx.createLinearGradient(0, L.y, 0, L.y + L.h);
  g.addColorStop(0, bg.top); g.addColorStop(1, bg.bot);
  ctx.fillStyle = g; ctx.fillRect(L.x, L.y, L.w, L.h);
  // đồi xanh navy phía sau (2 lớp)
  const hill = (k, alpha, yb, amp) => {
    ctx.fillStyle = withAlpha(bg.hill || '#1f4f8c', alpha);
    ctx.beginPath(); ctx.moveTo(L.x, L.y + L.h);
    const n = 4 + k;
    for (let i = 0; i <= n; i++) {
      const x = L.x + (i / n) * L.w, y = L.y + L.h * yb - hash01(t.id + k, i) * L.h * amp;
      if (i === 0) ctx.lineTo(x, y); else ctx.quadraticCurveTo(x - L.w / n / 2, L.y + L.h * yb - hash01(t.id + k, i + 20) * L.h * amp * 1.4, x, y);
    }
    ctx.lineTo(L.x + L.w, L.y + L.h); ctx.closePath(); ctx.fill();
  };
  hill(0, 0.35, 0.9, 0.42); hill(1, 0.55, 0.95, 0.28);
  drawDots(ctx, t.id, L.x, L.y, L.w, L.h, 10, R.time * 0.6, 0.18);
  // đèn
  if (!lightOn) { ctx.fillStyle = `rgba(5,20,60,${night ? 0.6 : 0.38})`; ctx.fillRect(L.x, L.y, L.w, L.h); }
  else {
    drawRays(ctx, L.x, L.y, L.w, L.h, 0.07 * t.eq.light, R.time);
    if (t.eq.light === 2) { const gg = ctx.createLinearGradient(0, L.y, 0, L.y + L.h * 0.5); gg.addColorStop(0, 'rgba(255,255,230,.25)'); gg.addColorStop(1, 'rgba(255,255,230,0)'); ctx.fillStyle = gg; ctx.fillRect(L.x, L.y, L.w, L.h); }
  }
  // màu nước xấu
  const w = t.water;
  if (w.ammonia > 15) { ctx.fillStyle = `rgba(190,200,60,${(w.ammonia - 15) / 100 * 0.35})`; ctx.fillRect(L.x, L.y, L.w, L.h); }
  if (w.dirt > 20) { const gd = ctx.createLinearGradient(0, L.y, 0, L.y + L.h); gd.addColorStop(0, 'rgba(110,80,40,0)'); gd.addColorStop(1, `rgba(110,80,40,${(w.dirt - 20) / 80 * 0.5})`); ctx.fillStyle = gd; ctx.fillRect(L.x, L.y, L.w, L.h); }
  if (t.med) { const mc = { antifungal: 'rgba(40,90,255,.18)', ich: 'rgba(60,200,120,.12)', copper: 'rgba(80,200,220,.12)', antibiotic: 'rgba(255,220,120,.1)', epsom: 'rgba(255,255,255,.06)' }[t.med.type]; ctx.fillStyle = mc; ctx.fillRect(L.x, L.y, L.w, L.h); }
  ctx.restore();
}

function drawSubstrate(ctx, t, L) {
  const sub = SUBSTRATES[t.substrate]; if (!sub || !sub.c1) return;
  const hpx = Math.max(10, L.s * 2.6);
  const y = L.y + L.h - hpx;
  ctx.fillStyle = sub.c1;
  ctx.beginPath(); ctx.moveTo(L.x, L.y + L.h); ctx.lineTo(L.x, y);
  const n = 5;
  for (let i = 0; i < n; i++) { const x0 = L.x + (i / n) * L.w, x1 = L.x + ((i + 1) / n) * L.w; ctx.quadraticCurveTo((x0 + x1) / 2, y - hpx * 0.35 * (i % 2 ? 1 : -0.4), x1, y); }
  ctx.lineTo(L.x + L.w, L.y + L.h); ctx.closePath(); ctx.fill();
  // đốm cát / sỏi
  for (let i = 0; i < 26; i++) {
    const px = L.x + hash01(t.id, i) * L.w, py = y + hpx * 0.25 + hash01(t.id, i + 500) * (hpx * 0.7);
    const r = (0.9 + hash01(t.id, i + 900) * 1.4) * L.s * 0.25;
    ctx.fillStyle = sub.speck ? (sub.dots || ['#ffffff'])[i % (sub.dots || ['#ffffff']).length] : sub.c2;
    if (sub.speck) ctx.globalAlpha = 0.9; blob(ctx, px, py, r * 1.6, r); ctx.globalAlpha = 1;
  }
}
const groundY = (L) => L.y + L.h - Math.max(7, L.s * 1.8);

/* ── Trang trí (phẳng, không viền) ── */
function drawDeco(ctx, dc, L, time, alpha = 1) {
  const D = DECO[dc.type]; if (!D) return;
  const [x] = toPx(L, dc.x, 0); const gy = groundY(L);
  const w = D.w * L.s, h = D.h * L.s;
  ctx.save(); ctx.globalAlpha = alpha; ctx.translate(x, gy); if (dc.flip) ctx.scale(-1, 1);
  const seed = dc.id || dc.type;
  const sway = Math.sin(time * 1.2 + hash01(seed) * 6) * 0.08;
  switch (D.kind) {
    case 'rock': {
      ctx.fillStyle = '#254f8a'; ctx.beginPath(); ctx.moveTo(-w / 2, 0);
      ctx.bezierCurveTo(-w * 0.55, -h * 0.9, -w * 0.15, -h * 1.15, w * 0.1, -h * 0.95);
      ctx.bezierCurveTo(w * 0.4, -h * 0.85, w * 0.55, -h * 0.4, w / 2, 0); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#3b6ba8'; blob(ctx, -w * 0.12, -h * 0.62, w * 0.22, h * 0.2);
      ctx.fillStyle = '#1b3d6e'; blob(ctx, w * 0.22, -h * 0.35, w * 0.08, h * 0.08); blob(ctx, -w * 0.3, -h * 0.25, w * 0.06, h * 0.06); break;
    }
    case 'wood': {
      ctx.strokeStyle = '#7a4b2a'; ctx.lineCap = 'round'; ctx.lineWidth = w * 0.13;
      ctx.beginPath(); ctx.moveTo(-w * 0.45, 0); ctx.quadraticCurveTo(-w * 0.1, -h * 0.3, w * 0.35, -h * 0.9); ctx.stroke();
      ctx.lineWidth = w * 0.08; ctx.beginPath(); ctx.moveTo(-w * 0.15, -h * 0.28); ctx.quadraticCurveTo(-w * 0.3, -h * 0.6, -w * 0.45, -h * 0.75); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(w * 0.1, -h * 0.55); ctx.quadraticCurveTo(w * 0.35, -h * 0.5, w * 0.5, -h * 0.45); ctx.stroke();
      ctx.strokeStyle = '#a06a40'; ctx.lineWidth = w * 0.04; ctx.beginPath(); ctx.moveTo(-w * 0.42, -h * 0.04); ctx.quadraticCurveTo(-w * 0.1, -h * 0.34, w * 0.3, -h * 0.86); ctx.stroke(); break;
    }
    case 'cave': {
      ctx.fillStyle = '#254f8a'; ctx.beginPath(); ctx.moveTo(-w / 2, 0); ctx.quadraticCurveTo(-w * 0.55, -h * 1.1, 0, -h); ctx.quadraticCurveTo(w * 0.55, -h * 1.1, w / 2, 0); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#3b6ba8'; blob(ctx, -w * 0.2, -h * 0.75, w * 0.16, h * 0.12);
      ctx.fillStyle = '#0f2a52'; ctx.beginPath(); ctx.ellipse(w * 0.05, 0, w * 0.28, h * 0.55, 0, Math.PI, 0); ctx.fill(); break;
    }
    case 'castle': {
      ctx.fillStyle = '#f3dfae';
      rrect(ctx, -w * 0.5, -h * 0.55, w, h * 0.55, 3); ctx.fill();
      rrect(ctx, -w * 0.5, -h * 0.85, w * 0.28, h * 0.85, 3); ctx.fill(); rrect(ctx, w * 0.22, -h * 0.85, w * 0.28, h * 0.85, 3); ctx.fill();
      rrect(ctx, -w * 0.13, -h, w * 0.26, h, 3); ctx.fill();
      ctx.fillStyle = '#d9bd80';
      for (let i = -2; i <= 2; i++) ctx.fillRect(i * w * 0.2 - w * 0.05, -h * 0.62, w * 0.1, h * 0.08);
      ctx.fillRect(-w * 0.5, -h * 0.92, w * 0.09, h * 0.08); ctx.fillRect(-w * 0.32, -h * 0.92, w * 0.09, h * 0.08);
      ctx.fillRect(w * 0.22, -h * 0.92, w * 0.09, h * 0.08); ctx.fillRect(w * 0.41, -h * 0.92, w * 0.09, h * 0.08);
      ctx.fillStyle = '#ff6f5e'; ctx.beginPath(); ctx.moveTo(-w * 0.16, -h); ctx.lineTo(w * 0.16, -h); ctx.lineTo(0, -h * 1.22); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#ffd23f'; ctx.fillRect(-w * 0.01, -h * 1.32, w * 0.02, h * 0.12); ctx.beginPath(); ctx.moveTo(0, -h * 1.32); ctx.lineTo(w * 0.1, -h * 1.28); ctx.lineTo(0, -h * 1.24); ctx.fill();
      ctx.fillStyle = '#5b4632'; ctx.beginPath(); ctx.ellipse(0, 0, w * 0.11, h * 0.24, 0, Math.PI, 0); ctx.fill();
      ctx.fillStyle = '#9db9de'; for (const [sx, sy] of [[-0.36, -0.5], [0.36, -0.5]]) { ctx.beginPath(); ctx.ellipse(w * sx, h * sy, w * 0.04, h * 0.07, 0, Math.PI, 0); ctx.fill(); } break;
    }
    case 'shell': { // sò điệp hồng
      const c1 = D.col || '#ff8fb8', c2 = shade(D.col || '#ff8fb8', -0.25);
      ctx.fillStyle = c1; ctx.beginPath(); ctx.moveTo(0, 0);
      for (let i = 0; i <= 9; i++) { const a = Math.PI + (i / 9) * Math.PI; ctx.lineTo(Math.cos(a) * w * 0.5 * (i % 2 ? 1 : 0.93), Math.sin(a) * h * 1.15); }
      ctx.closePath(); ctx.fill();
      ctx.strokeStyle = c2; ctx.lineWidth = Math.max(1, w * 0.06); ctx.lineCap = 'round';
      for (let i = 1; i < 9; i += 2) { const a = Math.PI + (i / 9) * Math.PI; ctx.beginPath(); ctx.moveTo(0, -h * 0.05); ctx.lineTo(Math.cos(a) * w * 0.42, Math.sin(a) * h * 0.95); ctx.stroke(); }
      ctx.fillStyle = c2; blob(ctx, 0, 0, w * 0.14, h * 0.18); break;
    }
    case 'bubbler': { ctx.fillStyle = '#6f86a8'; blob(ctx, 0, -h * 0.4, w * 0.5, h * 0.5); ctx.fillStyle = '#9db3d1'; blob(ctx, -w * 0.15, -h * 0.55, w * 0.2, h * 0.15); break; }
    case 'star': {
      const c = D.col || '#ffa62b';
      ctx.save(); ctx.translate(0, -h * 0.5); ctx.rotate(hash01(seed, 3) * 0.6 - 0.3);
      ctx.fillStyle = c; ctx.beginPath();
      for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + (i / 10) * Math.PI * 2, r = i % 2 ? w * 0.2 : w * 0.5; ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r * (h / w) * 1.05); }
      ctx.closePath(); ctx.lineJoin = 'round'; ctx.strokeStyle = c; ctx.lineWidth = w * 0.12; ctx.stroke(); ctx.fill();
      ctx.fillStyle = shade(c, -0.3); for (let i = 0; i < 5; i++) { const a = -Math.PI / 2 + (i / 5) * Math.PI * 2; blob(ctx, Math.cos(a) * w * 0.28, Math.sin(a) * w * 0.28 * (h / w), w * 0.035, w * 0.035); }
      ctx.restore(); break;
    }
    case 'coral': drawCoral(ctx, D, w, h, seed, sway); break;
    case 'plant': drawPlant(ctx, D, w, h, seed, time); break;
  }
  ctx.restore();
}

function drawCoral(ctx, D, w, h, seed, sway) {
  const c = D.col, c2 = shade(D.col, 0.25);
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  if (D.style === 'branch') { // san hô cành (hồng / đỏ)
    const branch = (x, y, len, ang, wd, depth) => {
      const ex = x + Math.cos(ang) * len, ey = y + Math.sin(ang) * len;
      ctx.strokeStyle = depth > 1 ? c : c2; ctx.lineWidth = wd; ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + Math.cos(ang - 0.3) * len * 0.5, y + Math.sin(ang - 0.3) * len * 0.5, ex, ey); ctx.stroke();
      if (depth <= 0) { ctx.fillStyle = c2; blob(ctx, ex, ey, wd * 0.7, wd * 0.7); return; }
      const k = hash01(seed, depth * 7 + Math.round(x));
      branch(ex, ey, len * 0.68, ang - 0.5 - k * 0.3 + sway, wd * 0.7, depth - 1);
      branch(ex, ey, len * 0.62, ang + 0.45 + k * 0.3 + sway, wd * 0.7, depth - 1);
      if (depth === 2) branch(ex, ey, len * 0.5, ang + (k - 0.5) * 0.4, wd * 0.6, 0);
    };
    branch(0, 0, h * 0.4, -Math.PI / 2 + sway * 0.5, Math.max(2, w * 0.14), 3);
  } else if (D.style === 'tube') { // san hô ống tím
    const n = 5;
    for (let i = 0; i < n; i++) {
      const bx = (i - (n - 1) / 2) * w * 0.2, len = h * (0.55 + hash01(seed, i) * 0.45), wd = w * 0.16;
      ctx.strokeStyle = i % 2 ? c : c2; ctx.lineWidth = wd; ctx.beginPath(); ctx.moveTo(bx, 0); ctx.quadraticCurveTo(bx + sway * len * 0.6, -len * 0.5, bx + sway * len * 1.2 + (i - 2) * w * 0.05, -len); ctx.stroke();
      ctx.fillStyle = shade(c, -0.3); blob(ctx, bx + sway * len * 1.2 + (i - 2) * w * 0.05, -len, wd * 0.42, wd * 0.28);
    }
  } else { // 'fan' quạt biển: lưới nan + vòng cung
    ctx.save(); ctx.rotate(sway * 0.5);
    ctx.fillStyle = withAlpha(c, 0.3); ctx.beginPath(); ctx.moveTo(0, 0);
    ctx.arc(0, 0, h * 0.95, Math.PI * 1.22, Math.PI * 1.78); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = c; ctx.lineWidth = Math.max(1.5, w * 0.05);
    for (let i = -3; i <= 3; i++) { const a = -Math.PI / 2 + i * 0.26; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(a) * h * 0.95, Math.sin(a) * h * 0.95); ctx.stroke(); ctx.fillStyle = c2; blob(ctx, Math.cos(a) * h * 0.95, Math.sin(a) * h * 0.95, w * 0.05, w * 0.05); }
    ctx.lineWidth = Math.max(1, w * 0.035);
    for (let k = 1; k <= 3; k++) { ctx.beginPath(); ctx.arc(0, 0, h * 0.3 * k, Math.PI * 1.22, Math.PI * 1.78); ctx.stroke(); }
    ctx.lineWidth = Math.max(2, w * 0.1); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -h * 0.2); ctx.stroke();
    ctx.restore();
  }
}

function drawPlant(ctx, D, w, h, seed, time) {
  const sway = (k, f = 1) => Math.sin(time * 1.1 * f + hash01(seed, k) * 6) * 0.12;
  ctx.lineCap = 'round';
  switch (D.style) {
    case 'moss': {
      for (let i = 0; i < 12; i++) { const px = (hash01(seed, i) - 0.5) * w, py = -hash01(seed, i + 40) * h * 0.9; ctx.fillStyle = i % 3 ? '#3fae5e' : '#6ad17e'; blob(ctx, px, py, w * 0.17, w * 0.14); }
      break;
    }
    case 'round': {
      for (let i = 0; i < 6; i++) {
        const a = -Math.PI / 2 + (i - 2.5) * 0.42 + sway(i) * 1.5, len = h * (0.55 + hash01(seed, i) * 0.45);
        ctx.strokeStyle = '#2e8b45'; ctx.lineWidth = Math.max(1.5, w * 0.05); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(a) * len * 0.7, Math.sin(a) * len * 0.7); ctx.stroke();
        ctx.save(); ctx.translate(Math.cos(a) * len * 0.65, Math.sin(a) * len * 0.65); ctx.rotate(a + Math.PI / 2);
        ctx.fillStyle = i % 2 ? '#3fae5e' : '#52c46f'; blob(ctx, 0, -w * 0.18, w * 0.2, w * 0.24); ctx.restore();
      } break;
    }
    case 'fern': case 'red': case 'broad': {
      const col = D.style === 'red' ? ['#e2536b', '#ff8aa0'] : D.style === 'broad' ? ['#2e9b5a', '#5ccb7a'] : ['#2f8f4a', '#4fbb65'];
      const n = D.style === 'broad' ? 5 : 7;
      for (let i = 0; i < n; i++) {
        const a = (i - (n - 1) / 2) * (D.style === 'broad' ? 0.36 : 0.24) + sway(i);
        const len = h * (0.7 + hash01(seed, i) * 0.3), wd = D.style === 'broad' ? w * 0.3 : w * 0.14;
        ctx.save(); ctx.rotate(a); ctx.fillStyle = col[i % 2]; leafPath(ctx, len, wd); ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,.28)'; ctx.lineWidth = Math.max(1, wd * 0.12); ctx.beginPath(); ctx.moveTo(0, -len * 0.1); ctx.lineTo(0, -len * 0.85); ctx.stroke();
        ctx.restore();
      } break;
    }
    case 'grass': {
      for (let i = 0; i < 8; i++) {
        const bx = (hash01(seed, i) - 0.5) * w, len = h * (0.6 + hash01(seed, i + 20) * 0.4), sw = sway(i, 0.8) * len * 1.3;
        ctx.strokeStyle = i % 2 ? '#4fbb65' : '#2e9b5a'; ctx.lineWidth = Math.max(2, w * 0.1);
        ctx.beginPath(); ctx.moveTo(bx, 0); ctx.quadraticCurveTo(bx + sw * 0.3, -len * 0.5, bx + sw, -len); ctx.stroke();
      } break;
    }
    case 'kelp': { // rong biển dải rộng uốn lượn như trong video
      const n = 4;
      for (let i = 0; i < n; i++) {
        const bx = (i - (n - 1) / 2) * w * 0.25, len = h * (0.7 + hash01(seed, i) * 0.3), wd = w * 0.16, ph = hash01(seed, i + 8) * 6;
        ctx.fillStyle = i % 2 ? '#2f9b5b' : '#49c072';
        ctx.beginPath(); ctx.moveTo(bx - wd, 0);
        const seg = 5;
        for (let k = 1; k <= seg; k++) { const y = -len * (k / seg), off = Math.sin(time * 1.2 + ph + k * 0.9) * w * 0.12 * (k / seg); ctx.lineTo(bx + off - wd * (1 - k / seg * 0.5), y); }
        for (let k = seg; k >= 0; k--) { const y = -len * (k / seg), off = Math.sin(time * 1.2 + ph + k * 0.9) * w * 0.12 * (k / seg); ctx.lineTo(bx + off + wd * (1 - k / seg * 0.5), y); }
        ctx.closePath(); ctx.fill();
      } break;
    }
  }
}

/* ── Cá ── */
function bodyPath(shape, L, wag) {
  const p = new Path2D();
  const hl = L / 2;
  let hb; // nửa chiều cao
  switch (shape) {
    case 'torpedo': hb = L * 0.19; break;
    case 'phoenix': hb = L * 0.2; break;
    case 'oval': case 'sword': hb = L * 0.27; break;
    case 'fan': case 'veil': hb = L * 0.24; break;
    case 'tall': hb = L * 0.42; break;
    case 'disc': hb = L * 0.45; break;
    case 'fancy': hb = L * 0.33; break;
    case 'koi': hb = L * 0.2; break;
    case 'bottom': hb = L * 0.22; break;
    case 'pleco': hb = L * 0.17; break;
    default: hb = L * 0.22;
  }
  const tail = -hl * (shape === 'fan' || shape === 'veil' ? 0.55 : shape === 'phoenix' ? 0.8 : 0.85);
  const nose = hl * (shape === 'tall' || shape === 'disc' ? 0.8 : 1);
  if (shape === 'tall') {
    p.moveTo(nose, 0); p.quadraticCurveTo(nose * 0.5, -hb * 1.05, -hl * 0.15, -hb * 0.7); p.quadraticCurveTo(tail, -hb * 0.4, tail, 0);
    p.quadraticCurveTo(tail, hb * 0.4, -hl * 0.15, hb * 0.7); p.quadraticCurveTo(nose * 0.5, hb * 1.05, nose, 0);
  } else if (shape === 'disc') {
    p.ellipse(0, 0, hl * 0.82, hb, 0, 0, Math.PI * 2);
  } else if (shape === 'bottom' || shape === 'pleco') {
    p.moveTo(nose, hb * 0.55); p.quadraticCurveTo(nose * 0.7, -hb * 1.3, -hl * 0.1, -hb * 0.95); p.quadraticCurveTo(tail * 0.9, -hb * 0.3, tail, wag * 0.5);
    p.quadraticCurveTo(tail, hb * 0.5, -hl * 0.2, hb * 0.6); p.lineTo(nose * 0.7, hb * 0.6); p.quadraticCurveTo(nose, hb * 0.6, nose, hb * 0.55);
  } else { // giọt nước bo tròn: đầu tròn, thon về đuôi
    p.moveTo(nose, 0);
    p.bezierCurveTo(nose * 0.92, -hb * 1.15, hl * 0.15, -hb * 1.18, -hl * 0.15, -hb * 0.98);
    p.bezierCurveTo(-hl * 0.55, -hb * 0.7, tail * 0.9, -hb * 0.28, tail, wag * 0.5);
    p.bezierCurveTo(tail * 0.9, hb * 0.28, -hl * 0.55, hb * 0.7, -hl * 0.15, hb * 0.98);
    p.bezierCurveTo(hl * 0.15, hb * 1.18, nose * 0.92, hb * 1.15, nose, 0);
  }
  p.closePath();
  return { p, hb, tail, nose };
}

// đuôi chẻ hai thuỳ bo tròn
function forkTail(ctx, tx, len, hgt, wag) {
  ctx.beginPath(); ctx.moveTo(tx + 1, 0);
  ctx.bezierCurveTo(tx - len * 0.3, -hgt * 0.35 + wag * 0.5, tx - len * 1.1, -hgt * 1.15 + wag, tx - len, -hgt + wag);
  ctx.bezierCurveTo(tx - len * 0.8, -hgt * 0.5 + wag, tx - len * 0.55, wag * 0.8, tx - len * 0.45, wag * 0.8);
  ctx.bezierCurveTo(tx - len * 0.55, wag * 0.8, tx - len * 0.8, hgt * 0.5 + wag, tx - len, hgt + wag);
  ctx.bezierCurveTo(tx - len * 1.1, hgt * 1.15 + wag, tx - len * 0.3, hgt * 0.35 + wag * 0.5, tx + 1, 0);
  ctx.closePath(); ctx.fill();
}

function drawFace(ctx, f, sp, Lpx, hb, nose, a) {
  // mắt: hai hình bầu dục trắng lớn kề nhau, con ngươi đen to nhìn về phía trước
  const tallish = sp.shape === 'tall' || sp.shape === 'disc';
  const bottom = sp.shape === 'bottom' || sp.shape === 'pleco';
  const ex = nose - Lpx * (tallish ? 0.3 : sp.shape === 'fan' || sp.shape === 'veil' ? 0.2 : 0.22);
  const ey = bottom ? -hb * 0.55 : tallish ? -hb * 0.28 : -hb * 0.3;
  const er = Math.max(2.2, Lpx * (tallish ? 0.075 : 0.095)), gap = er * 0.95;
  const sick = f.health < 35 || (f.disease && f.disease.sev > 0.6);
  const hungry = f.hunger > 75;
  const blink = ((a.phase * 0.13 + hash01(f.id) * 10) % 6) < 0.12;
  for (const k of [1, 0]) { // k=1 mắt sau, k=0 mắt trước
    const cx = ex - k * gap, cy = ey - k * er * 0.1;
    ctx.fillStyle = '#fff'; blob(ctx, cx, cy, er * 0.85, er * (blink ? 0.15 : 1));
    if (!blink) {
      ctx.fillStyle = '#1a1a1a'; blob(ctx, cx + er * 0.25, cy + er * 0.1, er * 0.45, er * 0.6);
      ctx.fillStyle = '#fff'; blob(ctx, cx + er * 0.12, cy - er * 0.2, er * 0.14, er * 0.14);
    }
  }
  if (sick) { ctx.strokeStyle = 'rgba(30,30,40,.7)'; ctx.lineWidth = Math.max(1, Lpx * 0.02); ctx.beginPath(); ctx.moveTo(ex - gap - er, ey - er * 1.3); ctx.lineTo(ex + er * 0.6, ey - er * 1.05); ctx.stroke(); }
  // miệng
  const mx = nose - Lpx * (tallish ? 0.12 : 0.08), my = bottom ? hb * 0.35 : ey + er * 1.45;
  ctx.strokeStyle = 'rgba(40,20,30,.75)'; ctx.lineWidth = Math.max(1, Lpx * 0.022); ctx.lineCap = 'round';
  if (hungry) { ctx.fillStyle = '#4a1a2a'; blob(ctx, mx, my + er * 0.2, er * 0.32, er * 0.4); ctx.fillStyle = '#ff7f95'; blob(ctx, mx, my + er * 0.4, er * 0.2, er * 0.14); }
  else if (sick) { ctx.beginPath(); ctx.arc(mx, my + er * 0.55, er * 0.45, Math.PI * 1.2, Math.PI * 1.8); ctx.stroke(); }
  else { ctx.beginPath(); ctx.arc(mx - er * 0.1, my - er * 0.1, er * 0.5, Math.PI * 0.15, Math.PI * 0.85); ctx.stroke(); }
  // mang: 2 vạch cong nhỏ sau mắt
  if (!bottom) {
    ctx.strokeStyle = 'rgba(0,0,0,.22)'; ctx.lineWidth = Math.max(1, Lpx * 0.018);
    const gx = ex - gap - er * 1.5;
    for (let i = 0; i < 2; i++) { ctx.beginPath(); ctx.arc(gx - i * er * 0.45, ey + hb * 0.35, hb * 0.28, Math.PI * 0.7, Math.PI * 1.3); ctx.stroke(); }
  }
}

function drawFish(ctx, f, L, time, a) {
  const sp = SPECIES[f.sp];
  if (sp.shape === 'snail') return drawSnail(ctx, f, L, a);
  if (sp.shape === 'shrimp') return drawShrimp(ctx, f, L, a);
  if (sp.shape === 'dragon') return drawDragon(ctx, f, L, time, a);
  const col = sp.variants ? sp.variants[f.variant] || sp.col : sp.col;
  const lenCm = visSize(sp.size) * (0.35 + 0.65 * f.growth);
  const Lpx = Math.max(12, lenCm * L.s);
  const [px, py] = toPx(L, f.x, f.y);
  const face = a.face || 1;
  let ang = Math.atan2(f.vy, Math.abs(f.vx) + 0.01); ang = clamp(ang, -0.45, 0.45);
  const sick = f.health < 35 || (f.disease && f.disease.sev > 0.6);
  if (f.disease && f.disease.id === 'swim') ang += Math.sin(time * 0.8 + a.phase) * 0.8;
  else if (sick) ang += 0.25;
  const wag = Math.sin(a.phase) * Lpx * 0.07 * (0.4 + (a.speedN || 0.5));
  const fin = col.fin, body = col.body, acc = col.accent;
  const belly = col.belly || shade(body, 0.6);
  const finS = sp.finScale || 1;
  const dull = 1 - f.health / 100;

  ctx.save();
  ctx.translate(px, py); ctx.scale(face, 1); ctx.rotate(ang);
  if (f.disease && f.disease.id === 'bloat') ctx.scale(1, 1 + 0.3 * f.disease.sev);
  if (sp.glow) { ctx.shadowColor = withAlpha(acc.length === 7 ? acc : '#ffffff', 0.55 + 0.3 * Math.sin(time * 2)); ctx.shadowBlur = 5 + sp.glow * 4 * (L.s / 6); }

  const { p, hb, tail, nose } = bodyPath(sp.shape, Lpx, wag);
  const ragged = f.disease && f.disease.id === 'finrot' ? f.disease.sev : 0;

  // ── vây đuôi ──
  ctx.fillStyle = fin;
  const tx = tail;
  if (sp.shape === 'fan') {
    const r = Lpx * 0.52 * finS;
    ctx.beginPath(); ctx.moveTo(tx + 2, 0); ctx.arc(tx + wag * 0.3, 0, r, Math.PI * 0.66, Math.PI * 1.34); ctx.closePath(); ctx.fill();
    ctx.fillStyle = withAlpha(acc, 0.7); ctx.beginPath(); ctx.moveTo(tx + 2, 0); ctx.arc(tx + wag * 0.3, 0, r * 0.62, Math.PI * 0.72, Math.PI * 1.28); ctx.closePath(); ctx.fill();
    ctx.fillStyle = withAlpha(body, 0.5); ctx.beginPath(); ctx.moveTo(tx + 2, 0); ctx.arc(tx + wag * 0.3, 0, r * 0.3, Math.PI * 0.75, Math.PI * 1.25); ctx.closePath(); ctx.fill();
  } else if (sp.shape === 'veil') {
    const r = Lpx * 0.62 * finS, ww = wag * 1.4, tip = tx - r * (1 - ragged * 0.4);
    for (let k = 0; k < 2; k++) {
      const o = k ? ww * 0.8 : 0, sc = k ? 0.8 : 1;
      ctx.fillStyle = k ? withAlpha(acc, 0.75) : fin;
      ctx.beginPath(); ctx.moveTo(tx + 2, 0);
      ctx.bezierCurveTo(tx - r * 0.35, -r * 0.5 * sc + o, tx - r * 1.1, -r * 0.55 * sc + o, tip, ww * 1.6 + o);
      ctx.bezierCurveTo(tx - r * 1.1, r * 0.55 * sc + o, tx - r * 0.35, r * 0.5 * sc + o, tx + 2, 0);
      ctx.fill();
    }
  } else if (sp.shape === 'phoenix') {
    for (let i = -1; i <= 1; i++) {
      const r = Lpx * (i === 0 ? 1.3 : 0.95), sw = Math.sin(a.phase * 0.7 + i) * Lpx * 0.15;
      ctx.fillStyle = i === 0 ? fin : withAlpha(acc, 0.8); ctx.beginPath(); ctx.moveTo(tx + 2, 0);
      ctx.bezierCurveTo(tx - r * 0.3, i * Lpx * 0.25 + sw, tx - r * 0.7, i * Lpx * 0.45 + sw * 1.5, tx - r, i * Lpx * 0.4 + sw * 2);
      ctx.bezierCurveTo(tx - r * 0.6, i * Lpx * 0.15 + sw, tx - r * 0.3, i * Lpx * 0.05, tx + 2, 0); ctx.fill();
    }
  } else if (sp.shape === 'fancy') {
    // đuôi voan cá vàng: hai thuỳ mềm bo tròn
    const r = Lpx * 0.55;
    for (const s of [-1, 1]) {
      ctx.fillStyle = s < 0 ? fin : shade(fin, -0.1); ctx.beginPath(); ctx.moveTo(tx + 1, 0);
      ctx.bezierCurveTo(tx - r * 0.2, s * r * 0.15 + wag * 0.3, tx - r * 0.9, s * r * 0.1 + wag, tx - r * 1.0, s * r * 0.6 + wag);
      ctx.bezierCurveTo(tx - r * 1.05, s * r * 0.9 + wag, tx - r * 0.7, s * r * 0.95 + wag, tx - r * 0.5, s * r * 0.7 + wag);
      ctx.bezierCurveTo(tx - r * 0.35, s * r * 0.5 + wag * 0.6, tx - r * 0.15, s * r * 0.2 + wag * 0.3, tx + 1, 0); ctx.fill();
    }
  } else if (sp.shape === 'sword') {
    forkTail(ctx, tx, Lpx * 0.25, hb * 0.9, wag);
    ctx.fillStyle = acc; ctx.beginPath(); ctx.moveTo(tx - Lpx * 0.05, hb * 0.5 + wag * 0.5); ctx.lineTo(tx - Lpx * 0.62, hb * 1.5 + wag); ctx.lineTo(tx - Lpx * 0.18, hb * 0.85 + wag * 0.7); ctx.closePath(); ctx.fill();
  } else if (sp.shape === 'tall' || sp.shape === 'disc') {
    ctx.beginPath(); ctx.moveTo(tx + 2, -hb * 0.35); ctx.bezierCurveTo(tx - Lpx * 0.15, -hb * 0.5 + wag, tx - Lpx * 0.28, -hb * 0.6 + wag, tx - Lpx * 0.24, wag);
    ctx.bezierCurveTo(tx - Lpx * 0.28, hb * 0.6 + wag, tx - Lpx * 0.15, hb * 0.5 + wag, tx + 2, hb * 0.35); ctx.closePath(); ctx.fill();
  } else {
    forkTail(ctx, tx, Lpx * 0.3 * (1 - ragged * 0.4), hb * 0.95, wag);
  }
  if (ragged > 0.15) { ctx.fillStyle = 'rgba(30,20,20,.5)'; for (let i = 0; i < 4; i++) { const yy = (i - 1.5) * hb * 0.5; ctx.beginPath(); ctx.arc(tx - Lpx * 0.26 * (sp.shape === 'veil' ? 2.4 : 1), yy + wag, Lpx * 0.03 + ragged * Lpx * 0.03, 0, 7); ctx.fill(); } }

  // ── vây lưng / bụng ──
  ctx.fillStyle = fin;
  if (sp.shape === 'veil') {
    const r = Lpx * 0.34 * finS;
    ctx.beginPath(); ctx.moveTo(-Lpx * 0.1, -hb * 0.9); ctx.quadraticCurveTo(-Lpx * 0.2 - wag, -hb - r, tail - r * 0.6, -hb * 0.5 + wag * 0.5); ctx.quadraticCurveTo(tail - r * 0.2, -hb * 0.3, tail, -hb * 0.3); ctx.fill();
    ctx.beginPath(); ctx.moveTo(-Lpx * 0.02, hb * 0.9); ctx.quadraticCurveTo(-Lpx * 0.2 - wag, hb + r, tail - r * 0.6, hb * 0.5 + wag * 0.5); ctx.quadraticCurveTo(tail - r * 0.2, hb * 0.3, tail, hb * 0.3); ctx.fill();
  } else if (sp.shape === 'tall') {
    const r = Lpx * 0.7 * finS;
    ctx.beginPath(); ctx.moveTo(Lpx * 0.1, -hb * 0.85); ctx.quadraticCurveTo(-Lpx * 0.1, -hb - r * 0.9, -Lpx * 0.42, -hb - r * 0.4 + wag * 0.3); ctx.quadraticCurveTo(-Lpx * 0.4, -hb * 0.6, tail, -hb * 0.4); ctx.fill();
    ctx.beginPath(); ctx.moveTo(Lpx * 0.1, hb * 0.85); ctx.quadraticCurveTo(-Lpx * 0.1, hb + r * 0.9, -Lpx * 0.42, hb + r * 0.4 + wag * 0.3); ctx.quadraticCurveTo(-Lpx * 0.4, hb * 0.6, tail, hb * 0.4); ctx.fill();
  } else if (sp.shape === 'disc') {
    const r = hb * 0.35 * finS;
    ctx.beginPath(); ctx.ellipse(-Lpx * 0.05, -hb * 0.95, Lpx * 0.42, r, 0, Math.PI, 0); ctx.fill();
    ctx.beginPath(); ctx.ellipse(-Lpx * 0.05, hb * 0.95, Lpx * 0.42, r, 0, 0, Math.PI); ctx.fill();
  } else if (sp.shape !== 'bottom' && sp.shape !== 'pleco') {
    const dh = sp.shape === 'fancy' ? 1.9 : 1.6;
    ctx.beginPath(); ctx.moveTo(Lpx * 0.18, -hb * 0.85); ctx.quadraticCurveTo(-Lpx * 0.02, -hb * dh, -Lpx * 0.22, -hb * dh * 0.75); ctx.quadraticCurveTo(-Lpx * 0.3, -hb * 0.9, -Lpx * 0.34, -hb * 0.6); ctx.fill();
    ctx.beginPath(); ctx.moveTo(-Lpx * 0.02, hb * 0.85); ctx.quadraticCurveTo(-Lpx * 0.14, hb * 1.45, -Lpx * 0.3, hb * 1.05); ctx.quadraticCurveTo(-Lpx * 0.32, hb * 0.8, -Lpx * 0.34, hb * 0.6); ctx.fill();
  } else {
    ctx.beginPath(); ctx.moveTo(Lpx * 0.08, -hb * 0.9); ctx.quadraticCurveTo(-Lpx * 0.02, -hb * 2, -Lpx * 0.12, -hb * 1.7); ctx.quadraticCurveTo(-Lpx * 0.2, -hb * 1.2, -Lpx * 0.24, -hb * 0.75); ctx.fill();
  }

  // ── thân: màu phẳng + bụng sáng ──
  ctx.shadowBlur = 0;
  ctx.fillStyle = body; ctx.fill(p);
  ctx.save(); ctx.clip(p);
  ctx.fillStyle = belly;
  const bottomish = sp.shape === 'bottom' || sp.shape === 'pleco';
  ctx.beginPath(); ctx.ellipse(nose * 0.12, hb * (bottomish ? 0.9 : 0.62), Lpx * 0.5, hb * 0.66, 0, 0, 7); ctx.fill();
  drawPattern(ctx, sp, col, f, Lpx, hb, time, a);
  // vảy nhẹ ở nửa sau
  if (!sp.pattern || sp.pattern === 'plain' || sp.pattern === 'speckle' || sp.pattern === 'spots') {
    ctx.strokeStyle = 'rgba(255,255,255,.22)'; ctx.lineWidth = Math.max(0.8, Lpx * 0.014);
    const sr = Math.max(1.5, hb * 0.28);
    for (let r = 0; r < 4; r++) for (let c = -2; c <= 2; c++) { ctx.beginPath(); ctx.arc(-Lpx * 0.02 - r * sr * 1.1, c * sr * 1.3 + (r % 2) * sr * 0.65, sr * 0.55, Math.PI * 0.75, Math.PI * 1.25); ctx.stroke(); }
  }
  if (dull > 0.3) { ctx.fillStyle = `rgba(120,120,120,${(dull - 0.3) * 0.7})`; ctx.fillRect(-Lpx, -Lpx, Lpx * 2, Lpx * 2); }
  drawDiseaseMarks(ctx, f, Lpx, hb);
  ctx.restore();

  // vây ngực (bo tròn, phẳng)
  ctx.fillStyle = shade(fin, -0.12);
  ctx.save(); ctx.translate(Lpx * 0.1, hb * 0.35); ctx.rotate(Math.sin(a.phase * 1.3) * 0.35 + 0.9);
  leafPath(ctx, Lpx * 0.3, Lpx * 0.09); ctx.fill(); ctx.restore();

  // râu
  if (sp.shape === 'koi' || sp.shape === 'bottom') {
    ctx.strokeStyle = 'rgba(40,30,20,.6)'; ctx.lineWidth = Math.max(1, Lpx * 0.02); ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(nose - 2, hb * 0.35); ctx.quadraticCurveTo(nose + Lpx * 0.1, hb * 0.6, nose + Lpx * 0.12, hb * 0.9 + Math.sin(a.phase) * 2); ctx.stroke();
  }
  if (sp.shape === 'pleco') { ctx.fillStyle = '#3a2a1e'; blob(ctx, nose - Lpx * 0.06, hb * 0.5, Lpx * 0.09, hb * 0.2); }

  drawFace(ctx, f, sp, Lpx, hb, nose, a);
  ctx.restore();

  // tàn lửa phượng hoàng
  if (sp.shape === 'phoenix' && Math.random() < 0.35) R.sparks.push({ x: f.x - face * lenCm * 0.5, y: f.y, vx: rand(-1, 1), vy: rand(-2, -0.5), life: rand(0.6, 1.4), c: pick([fin, acc, body]) });
  if (sp.glow >= 2 && Math.random() < 0.08) R.sparks.push({ x: f.x + rand(-lenCm / 2, lenCm / 2), y: f.y + rand(-1, 1), vx: 0, vy: -0.6, life: 1, c: acc, tiny: true });
}

function drawPattern(ctx, sp, col, f, Lpx, hb, time, a) {
  const acc = col.accent;
  switch (sp.pattern) {
    case 'neon': {
      ctx.fillStyle = acc; rrect(ctx, -Lpx * 0.45, -hb * 0.4, Lpx * 0.9, hb * 0.38, hb * 0.19); ctx.fill();
      ctx.fillStyle = col.fin; rrect(ctx, -Lpx * 0.45, hb * 0.08, Lpx * 0.55, hb, hb * 0.3); ctx.fill(); break;
    }
    case 'hstripes': { ctx.fillStyle = withAlpha(acc, 0.85); for (let i = -1; i <= 1; i++) { rrect(ctx, -Lpx * 0.45, i * hb * 0.55 - hb * 0.12, Lpx * 0.9, hb * 0.24, hb * 0.12); ctx.fill(); } break; }
    case 'bars': { ctx.fillStyle = withAlpha(acc, 0.85); for (let i = 0; i < 3; i++) { const x = Lpx * 0.2 - i * Lpx * 0.26; ctx.beginPath(); ctx.moveTo(x - Lpx * 0.06, -hb * 1.3); ctx.lineTo(x + Lpx * 0.06, -hb * 1.3); ctx.lineTo(x + Lpx * 0.01, hb * 1.3); ctx.lineTo(x - Lpx * 0.11, hb * 1.3); ctx.closePath(); ctx.fill(); } break; }
    case 'spots': { ctx.fillStyle = withAlpha(acc, 0.7); for (let i = 0; i < 10; i++) { blob(ctx, (hash01(f.id, i) - 0.5) * Lpx * 0.85, (hash01(f.id, i + 30) - 0.5) * hb * 1.6, Lpx * 0.035 + hash01(f.id, i + 60) * Lpx * 0.03, Lpx * 0.03 + hash01(f.id, i + 60) * Lpx * 0.03); } break; }
    case 'speckle': { ctx.fillStyle = withAlpha(acc, 0.8); for (let i = 0; i < 6; i++) blob(ctx, (hash01(f.id, i) - 0.7) * Lpx * 0.6, (hash01(f.id, i + 30) - 0.5) * hb * 1.4, Lpx * 0.03, Lpx * 0.03); break; }
    case 'patch': { ctx.fillStyle = acc; for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.ellipse((hash01(f.id, i) - 0.5) * Lpx * 0.7, (hash01(f.id, i + 9) - 0.6) * hb, Lpx * (0.1 + hash01(f.id, i + 3) * 0.12), hb * 0.6, hash01(f.id, i + 5) * 3, 0, 7); ctx.fill(); } break; }
    case 'wave': { ctx.strokeStyle = withAlpha(acc, 0.7); ctx.lineWidth = Math.max(1, Lpx * 0.03); ctx.lineCap = 'round'; for (let i = 0; i < 5; i++) { const x = Lpx * 0.3 - i * Lpx * 0.15; ctx.beginPath(); for (let y = -hb; y <= hb; y += hb * 0.25) ctx.lineTo(x + Math.sin(y / hb * 4 + i) * Lpx * 0.03, y); ctx.stroke(); } break; }
    case 'iridescent': {
      const hue = (time * 40 + hash01(f.id) * 360) % 360;
      const g = ctx.createLinearGradient(-Lpx / 2, 0, Lpx / 2, 0);
      g.addColorStop(0, `hsla(${hue},90%,65%,.4)`); g.addColorStop(0.5, `hsla(${(hue + 90) % 360},90%,65%,.3)`); g.addColorStop(1, `hsla(${(hue + 180) % 360},90%,65%,.4)`);
      ctx.fillStyle = g; ctx.fillRect(-Lpx, -Lpx, Lpx * 2, Lpx * 2); break;
    }
    case 'plates': { ctx.strokeStyle = withAlpha(acc, 0.6); ctx.lineWidth = Math.max(1, Lpx * 0.02); for (let i = -1; i <= 1; i++) { ctx.beginPath(); ctx.moveTo(-Lpx * 0.45, i * hb * 0.5); ctx.lineTo(Lpx * 0.3, i * hb * 0.5); ctx.stroke(); } for (let i = 0; i < 5; i++) { const x = Lpx * 0.25 - i * Lpx * 0.15; ctx.beginPath(); ctx.moveTo(x, -hb); ctx.lineTo(x, hb); ctx.stroke(); } break; }
    case 'scales': { ctx.strokeStyle = withAlpha(acc, 0.55); ctx.lineWidth = Math.max(1, Lpx * 0.02); for (let r = 0; r < 6; r++) for (let c = 0; c < 3; c++) { ctx.beginPath(); ctx.arc(Lpx * 0.35 - r * Lpx * 0.14, (c - 1) * hb * 0.6 + (r % 2) * hb * 0.3, hb * 0.32, Math.PI * 0.7, Math.PI * 1.3); ctx.stroke(); } break; }
    case 'flame': { const g = ctx.createLinearGradient(Lpx / 2, 0, -Lpx / 2, 0); g.addColorStop(0, withAlpha(acc, 0.6)); g.addColorStop(1, withAlpha(col.fin, 0)); ctx.fillStyle = g; ctx.fillRect(-Lpx, -Lpx, Lpx * 2, Lpx * 2); break; }
    case 'stars': { for (let i = 0; i < 14; i++) { const tw = 0.5 + 0.5 * Math.sin(time * 3 + i * 1.7); ctx.fillStyle = `rgba(255,255,255,${0.4 + 0.6 * tw})`; blob(ctx, (hash01(f.id, i) - 0.5) * Lpx * 0.9, (hash01(f.id, i + 30) - 0.5) * hb * 1.7, 0.6 + tw * Lpx * 0.02, 0.6 + tw * Lpx * 0.02); } break; }
    case 'plain': default:
      if (col.spots) { ctx.fillStyle = 'rgba(20,20,20,.8)'; for (let i = 0; i < 9; i++) blob(ctx, (hash01(f.id, i) - 0.5) * Lpx * 0.85, (hash01(f.id, i + 30) - 0.5) * hb * 1.6, Lpx * 0.045, Lpx * 0.04); }
  }
}

function drawDiseaseMarks(ctx, f, Lpx, hb) {
  if (!f.disease) return;
  const sev = f.disease.sev, id = f.disease.id, n = Math.round(3 + sev * 14);
  if (id === 'ich') { ctx.fillStyle = 'rgba(255,255,255,.95)'; for (let i = 0; i < n; i++) blob(ctx, (hash01(f.id, i + 100) - 0.5) * Lpx * 0.9, (hash01(f.id, i + 200) - 0.5) * hb * 1.7, Math.max(0.8, Lpx * 0.02), Math.max(0.8, Lpx * 0.02)); }
  else if (id === 'velvet') { ctx.fillStyle = 'rgba(230,180,60,.8)'; for (let i = 0; i < n * 2; i++) blob(ctx, (hash01(f.id, i + 100) - 0.5) * Lpx * 0.9, (hash01(f.id, i + 200) - 0.5) * hb * 1.7, 0.8, 0.8); }
  else if (id === 'fungus') { ctx.fillStyle = 'rgba(245,245,245,.85)'; for (let i = 0; i < Math.round(1 + sev * 3); i++) { const x = (hash01(f.id, i + 100) - 0.5) * Lpx * 0.8, y = (hash01(f.id, i + 200) - 0.5) * hb; for (let k = 0; k < 5; k++) blob(ctx, x + (hash01(f.id, k + i * 7) - 0.5) * Lpx * 0.08, y + (hash01(f.id, k + 50 + i * 7) - 0.5) * hb * 0.3, Lpx * 0.035, Lpx * 0.035); } }
}

// mắt hoạt hình đơn (dùng cho ốc, tép, rồng)
function cartoonEye(ctx, x, y, r, look = 0.3) {
  ctx.fillStyle = '#fff'; blob(ctx, x, y, r, r * 1.1);
  ctx.fillStyle = '#1a1a1a'; blob(ctx, x + r * look, y + r * 0.1, r * 0.5, r * 0.62);
  ctx.fillStyle = '#fff'; blob(ctx, x + r * 0.1, y - r * 0.3, r * 0.16, r * 0.16);
}

function drawSnail(ctx, f, L, a) {
  const [px, py] = toPx(L, f.x, f.y); const r = Math.max(5, SPECIES.snail.size * L.s * 0.5 * (0.5 + 0.5 * f.growth));
  ctx.save(); ctx.translate(px, py); ctx.scale(a.face || 1, 1);
  ctx.fillStyle = '#ffb066'; blob(ctx, r * 0.35, 0, r * 1.25, r * 0.5);
  // cuống mắt
  ctx.strokeStyle = '#ffb066'; ctx.lineWidth = Math.max(1.5, r * 0.22); ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(r * 1.2, -r * 0.2); ctx.lineTo(r * 1.5, -r * 1.0); ctx.moveTo(r * 1.4, -r * 0.1); ctx.lineTo(r * 1.95, -r * 0.7); ctx.stroke();
  cartoonEye(ctx, r * 1.5, -r * 1.05, r * 0.28); cartoonEye(ctx, r * 1.97, -r * 0.75, r * 0.28);
  // vỏ xoắn
  ctx.fillStyle = '#ff7f95'; ctx.beginPath(); ctx.arc(-r * 0.25, -r * 0.5, r * 0.8, 0, 7); ctx.fill();
  ctx.strokeStyle = '#d94f6e'; ctx.lineWidth = Math.max(1.2, r * 0.16); ctx.beginPath();
  for (let t = 0; t < Math.PI * 3.2; t += 0.2) { const rr = r * 0.08 + t * r * 0.075; ctx.lineTo(-r * 0.25 + Math.cos(t) * rr, -r * 0.5 + Math.sin(t) * rr); } ctx.stroke();
  ctx.restore();
}
function drawShrimp(ctx, f, L, a) {
  const [px, py] = toPx(L, f.x, f.y); const l = Math.max(8, SPECIES.shrimp.size * L.s * (0.5 + 0.5 * f.growth));
  ctx.save(); ctx.translate(px, py); ctx.scale(a.face || 1, 1);
  const col = SPECIES.shrimp.col;
  ctx.strokeStyle = col.body; ctx.lineWidth = Math.max(3, l * 0.32); ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(l * 0.5, 0); ctx.quadraticCurveTo(0, -l * 0.38, -l * 0.4, 0); ctx.quadraticCurveTo(-l * 0.5, l * 0.2, -l * 0.6, l * 0.1); ctx.stroke();
  ctx.strokeStyle = col.fin; ctx.lineWidth = Math.max(1.2, l * 0.06);
  for (let i = 0; i < 4; i++) { const x = l * 0.3 - i * l * 0.18; ctx.beginPath(); ctx.moveTo(x, l * 0.12); ctx.lineTo(x - l * 0.05 + Math.sin(a.phase + i) * 2, l * 0.38); ctx.stroke(); }
  ctx.beginPath(); ctx.moveTo(l * 0.5, -l * 0.05); ctx.lineTo(l * 1.1, -l * 0.35); ctx.moveTo(l * 0.5, 0); ctx.lineTo(l * 1.15, -l * 0.05); ctx.stroke();
  ctx.fillStyle = col.accent; blob(ctx, -l * 0.6, l * 0.1, l * 0.14, l * 0.1);
  cartoonEye(ctx, l * 0.42, -l * 0.15, Math.max(1.6, l * 0.11), 0.4);
  ctx.restore();
}
function drawDragon(ctx, f, L, time, a) {
  const sp = SPECIES.dragon, col = sp.col;
  const lenCm = visSize(sp.size) * (0.35 + 0.65 * f.growth), Lpx = lenCm * L.s;
  const [px, py] = toPx(L, f.x, f.y); const face = a.face || 1;
  const ang = clamp(Math.atan2(f.vy, Math.abs(f.vx) + 0.01), -0.4, 0.4);
  ctx.save(); ctx.translate(px, py); ctx.scale(face, 1); ctx.rotate(ang);
  ctx.shadowColor = withAlpha(col.fin, 0.8); ctx.shadowBlur = 14;
  const N = 14, seg = Lpx / N;
  const pts = [];
  for (let i = 0; i <= N; i++) { const x = Lpx * 0.45 - i * seg; const y = Math.sin(a.phase - i * 0.55) * Lpx * 0.06 * (i / N); pts.push([x, y]); }
  // vây lưng
  ctx.fillStyle = col.fin; ctx.beginPath(); ctx.moveTo(pts[1][0], pts[1][1]);
  for (let i = 1; i < N; i++) { const r = Lpx * (0.045 + 0.025 * Math.sin(i * 1.3)); ctx.quadraticCurveTo(pts[i][0] - seg * 0.3, pts[i][1] - Lpx * 0.07 - r, pts[i + 1][0], pts[i + 1][1] - Lpx * 0.06); }
  ctx.closePath(); ctx.fill();
  // đuôi
  ctx.beginPath(); const tp = pts[N]; ctx.moveTo(tp[0], tp[1]); ctx.quadraticCurveTo(tp[0] - Lpx * 0.15, tp[1] - Lpx * 0.2, tp[0] - Lpx * 0.24, tp[1] - Lpx * 0.14); ctx.quadraticCurveTo(tp[0] - Lpx * 0.1, tp[1], tp[0] - Lpx * 0.24, tp[1] + Lpx * 0.14); ctx.quadraticCurveTo(tp[0] - Lpx * 0.15, tp[1] + Lpx * 0.2, tp[0], tp[1]); ctx.fill();
  // thân theo đoạn (phẳng, bụng sáng)
  ctx.shadowBlur = 0;
  for (let i = N - 1; i >= 0; i--) {
    const [x, y] = pts[i]; const r = Lpx * 0.085 * (i < 3 ? 1 + (3 - i) * 0.1 : 1 - (i / N) * 0.5);
    ctx.fillStyle = col.body; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill();
    ctx.fillStyle = shade(col.body, 0.5); ctx.beginPath(); ctx.arc(x, y + r * 0.35, r * 0.55, 0, 7); ctx.fill();
    ctx.strokeStyle = withAlpha(col.accent, 0.5); ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(x, y, r * 0.7, Math.PI * 0.7, Math.PI * 1.3); ctx.stroke();
  }
  // đầu, râu, mắt
  const hx = pts[0][0], hy = pts[0][1], hr = Lpx * 0.11;
  ctx.fillStyle = col.body; blob(ctx, hx + hr * 0.3, hy, hr * 1.4, hr);
  ctx.fillStyle = shade(col.body, 0.5); blob(ctx, hx + hr * 0.5, hy + hr * 0.4, hr * 1.0, hr * 0.45);
  ctx.strokeStyle = col.fin; ctx.lineWidth = Math.max(1.5, hr * 0.15); ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(hx + hr * 1.3, hy + hr * 0.3); ctx.quadraticCurveTo(hx + hr * 2.6, hy + hr * 0.2 + Math.sin(time * 3) * 3, hx + hr * 3.2, hy + hr * 1.2); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(hx + hr * 0.2, hy - hr * 0.8); ctx.quadraticCurveTo(hx - hr * 0.3, hy - hr * 2, hx - hr * 1.2, hy - hr * 2.2); ctx.stroke();
  cartoonEye(ctx, hx + hr * 0.35, hy - hr * 0.35, hr * 0.42, 0.3); cartoonEye(ctx, hx + hr * 1.0, hy - hr * 0.3, hr * 0.42, 0.3);
  ctx.strokeStyle = 'rgba(60,20,20,.7)'; ctx.lineWidth = Math.max(1, hr * 0.1); ctx.beginPath(); ctx.arc(hx + hr * 1.1, hy + hr * 0.35, hr * 0.3, Math.PI * 0.15, Math.PI * 0.85); ctx.stroke();
  ctx.restore();
  if (Math.random() < 0.2) R.sparks.push({ x: f.x - face * lenCm * 0.5 + rand(-2, 2), y: f.y + rand(-1, 1), vx: 0, vy: -0.8, life: 1.2, c: col.fin, tiny: true });
}

/* ── Hiệu ứng ── */
function updateParticles(t, L, dt) {
  const d = tankDims(t);
  const srcs = [];
  if (t.eq.air) srcs.push(d.W - 2);
  for (const dc of t.deco) if (DECO[dc.type]?.kind === 'bubbler') srcs.push(dc.x);
  for (const sx of srcs) if (Math.random() < dt * 6) R.bubbles.push({ x: sx + rand(-0.6, 0.6), y: d.H - 1.5, r: rand(0.3, 0.8), vy: rand(6, 10), w: rand(6) });
  for (let i = R.bubbles.length - 1; i >= 0; i--) { const b = R.bubbles[i]; b.y -= b.vy * dt; b.x += Math.sin(R.time * 4 + b.w) * dt * 1.2; if (b.y < 0.3) R.bubbles.splice(i, 1); }
  const want = Math.round(t.water.dirt / 100 * 45);
  while (R.debris.length < want) R.debris.push({ x: rand(d.W), y: rand(d.H * 0.3, d.H), vx: rand(-0.2, 0.2), s: rand(0.6, 1.4) });
  if (R.debris.length > want) R.debris.length = want;
  for (const p of R.debris) { p.x += p.vx * dt; p.y += Math.sin(R.time + p.s) * dt * 0.15 + dt * 0.05; if (p.y > d.H - 1) p.y = d.H * 0.4; if (p.x < 0) p.x = d.W; if (p.x > d.W) p.x = 0; }
  for (let i = R.sparks.length - 1; i >= 0; i--) { const s = R.sparks[i]; s.life -= dt; s.x += s.vx * dt; s.y += s.vy * dt; if (s.life <= 0) R.sparks.splice(i, 1); }
}

function drawEffects(ctx, t, L) {
  for (const b of R.bubbles) { const [x, y] = toPx(L, b.x, b.y); const r = b.r * L.s; ctx.fillStyle = 'rgba(255,255,255,.35)'; blob(ctx, x, y, r, r); ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.stroke(); ctx.fillStyle = 'rgba(255,255,255,.8)'; blob(ctx, x - r * 0.35, y - r * 0.35, r * 0.25, r * 0.25); }
  ctx.fillStyle = 'rgba(90,70,40,.55)';
  for (const p of R.debris) { const [x, y] = toPx(L, p.x, p.y); blob(ctx, x, y, p.s * 1.2, p.s * 1.2); }
  for (const s of R.sparks) { const [x, y] = toPx(L, s.x, s.y); ctx.fillStyle = withAlpha(s.c, Math.max(0, s.life) * 0.9); blob(ctx, x, y, s.tiny ? 1.2 : 1.5 + s.life * 1.5, s.tiny ? 1.2 : 1.5 + s.life * 1.5); }
  // mồi
  for (const p of t.pellets) { const [x, y] = toPx(L, p.x, p.y); const r = Math.max(1.8, L.s * 0.24); ctx.fillStyle = '#a0622e'; blob(ctx, x, y, r, r); ctx.fillStyle = 'rgba(255,220,160,.7)'; blob(ctx, x - r * 0.3, y - r * 0.3, r * 0.35, r * 0.35); }
  // trứng đang ấp
  if (t.breeding) {
    const moss = t.deco.find((d) => DECO[d.type]?.plant) || { x: tankDims(t).W / 2 };
    const [mx] = toPx(L, moss.x, 0); const gy = groundY(L);
    const prog = clamp((now() - t.breeding.start) / (t.breeding.end - t.breeding.start), 0, 1);
    for (let i = 0; i < 9; i++) { const x = mx + (hash01(t.id, i) - 0.5) * L.s * 6, y = gy - L.s * 1.5 - hash01(t.id, i + 9) * L.s * 2; const r = Math.max(1.8, L.s * 0.3); ctx.fillStyle = `rgba(255,240,200,${0.6 + prog * 0.4})`; blob(ctx, x, y, r, r); ctx.fillStyle = 'rgba(255,255,255,.8)'; blob(ctx, x - r * 0.3, y - r * 0.3, r * 0.3, r * 0.3); }
  }
}

function drawGlassFront(ctx, t, L) {
  const rad = Math.max(10, L.s * 1.6);
  const al = t.water.algae / 100;
  ctx.save(); rrect(ctx, L.x, L.y, L.w, L.h, rad * 0.6); ctx.clip();
  if (al > 0.05) {
    ctx.fillStyle = `rgba(70,160,70,${al * 0.55})`;
    for (let i = 0; i < 46 * al; i++) blob(ctx, L.x + hash01(t.id, i + 300) * L.w, L.y + hash01(t.id, i + 400) * L.h, 4 + hash01(t.id, i + 500) * 14, 3 + hash01(t.id, i + 600) * 9);
    const gL = ctx.createLinearGradient(L.x, 0, L.x + L.w * 0.2, 0); gL.addColorStop(0, `rgba(60,150,60,${al * 0.7})`); gL.addColorStop(1, 'rgba(60,150,60,0)');
    ctx.fillStyle = gL; ctx.fillRect(L.x, L.y, L.w * 0.2, L.h);
    const gR = ctx.createLinearGradient(L.x + L.w, 0, L.x + L.w * 0.8, 0); gR.addColorStop(0, `rgba(60,150,60,${al * 0.7})`); gR.addColorStop(1, 'rgba(60,150,60,0)');
    ctx.fillStyle = gR; ctx.fillRect(L.x + L.w * 0.8, L.y, L.w * 0.2, L.h);
  }
  // mặt nước
  ctx.fillStyle = 'rgba(255,255,255,.28)'; ctx.beginPath(); ctx.moveTo(L.x, L.y);
  for (let x = 0; x <= L.w; x += 8) ctx.lineTo(L.x + x, L.y + 4 + Math.sin(x * 0.04 + R.time * 1.5) * 2);
  ctx.lineTo(L.x + L.w, L.y); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,.75)'; ctx.lineWidth = 2.5; ctx.lineCap = 'round'; ctx.beginPath();
  for (let x = 0; x <= L.w; x += 8) ctx.lineTo(L.x + x, L.y + 4 + Math.sin(x * 0.04 + R.time * 1.5) * 2);
  ctx.stroke();
  // phản chiếu kính: dải sáng cong góc trên trái
  ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = Math.max(3, L.s * 0.5); ctx.beginPath(); ctx.moveTo(L.x + L.w * 0.04, L.y + L.h * 0.3); ctx.quadraticCurveTo(L.x + L.w * 0.04, L.y + L.h * 0.08, L.x + L.w * 0.16, L.y + L.h * 0.06); ctx.stroke();
  ctx.restore();
  // khung trắng bo tròn
  ctx.lineJoin = 'round';
  ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 9; rrect(ctx, L.x - 4, L.y - 4, L.w + 8, L.h + 8, rad); ctx.stroke();
  ctx.strokeStyle = 'rgba(120,180,230,.55)'; ctx.lineWidth = 1.5; rrect(ctx, L.x - 9, L.y - 9, L.w + 18, L.h + 18, rad + 5); ctx.stroke();
  // thiết bị: lọc (góc phải), sưởi (trái)
  if (t.eq.filter) {
    const fw = 12 + t.eq.filter * 6, fh = L.h * 0.32, fx = L.x + L.w - fw - 10, fy = L.y - 8;
    ctx.fillStyle = '#ffffff'; rrect(ctx, fx, fy, fw, fh, 5); ctx.fill();
    ctx.fillStyle = '#5bb8ee'; rrect(ctx, fx + 3, fy + 6, fw - 6, 5, 2.5); ctx.fill();
    ctx.fillStyle = '#cfe8f7'; for (let i = 0; i < 3; i++) { rrect(ctx, fx + 3, fy + fh - 8 - i * 6, fw - 6, 3, 1.5); ctx.fill(); }
  }
  if (t.eq.heater) {
    const hx = L.x + 10, hy = L.y + L.h * 0.28, hh = L.h * 0.55;
    ctx.fillStyle = '#ffffff'; rrect(ctx, hx, hy, 7, hh, 3.5); ctx.fill();
    ctx.fillStyle = t.water.temp < t.eq.heatTemp - 0.2 ? '#ff6f5e' : '#8fb4d6'; blob(ctx, hx + 3.5, hy + 8, 2.6, 2.6);
    ctx.fillStyle = '#ff9a8a'; rrect(ctx, hx + 2, hy + hh * 0.35, 3, hh * 0.55, 1.5); ctx.fill();
  }
}

function drawSelection(ctx, f, L, time) {
  const sp = SPECIES[f.sp]; const [x, y] = toPx(L, f.x, f.y); const r = Math.max(16, visSize(sp.size) * (0.35 + 0.65 * f.growth) * L.s * 0.62);
  ctx.strokeStyle = '#ffd23f'; ctx.setLineDash([6, 5]); ctx.lineDashOffset = -time * 20; ctx.lineWidth = 3; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.stroke(); ctx.setLineDash([]);
}
function drawFishBadges(ctx, f, L) {
  const sp = SPECIES[f.sp]; const [x, y] = toPx(L, f.x, f.y); const r = Math.max(8, visSize(sp.size) * (0.35 + 0.65 * f.growth) * L.s * 0.35);
  let icon = null;
  if (f.disease) icon = '🤒'; else if (f.hunger > 75) icon = '🍽️'; else if (f.stress > 65) icon = '💢';
  if (!icon) return;
  ctx.fillStyle = 'rgba(255,255,255,.9)'; blob(ctx, x, y - r - 10, 11, 11);
  ctx.font = '13px system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#000'; ctx.fillText(icon, x, y - r - 9); ctx.textBaseline = 'alphabetic';
}

/* ── Khung hình ── */
function renderFrame(ctx, W, Hh, t, dt) {
  R.time += dt;
  const night = isNight();
  drawRoom(ctx, W, Hh, night);
  const L = R.layout; if (!L) return;
  drawTankBack(ctx, t, L, night);
  ctx.save(); rrect(ctx, L.x, L.y, L.w, L.h, Math.max(10, L.s * 1.6) * 0.6); ctx.clip();
  drawSubstrate(ctx, t, L);
  const decos = [...t.deco].sort((a, b) => (DECO[b.type]?.h || 0) - (DECO[a.type]?.h || 0));
  for (const dc of decos) drawDeco(ctx, dc, L, R.time, R.dragDeco === dc ? 0.6 : 1);
  if (R.ghost) drawDeco(ctx, R.ghost, L, R.time, 0.55);
  updateParticles(t, L, dt);
  drawEffects(ctx, t, L);
  const fs = fishIn(t.id).sort((a, b) => SPECIES[a.sp].size - SPECIES[b.sp].size);
  for (const f of fs) drawFish(ctx, f, L, R.time, ai(f));
  for (const f of fs) drawFishBadges(ctx, f, L);
  if (R.selected) { const f = fishById(R.selected); if (f && f.tankId === t.id) drawSelection(ctx, f, L, R.time); }
  ctx.restore();
  drawGlassFront(ctx, t, L);
  if (R.clean) { ctx.font = '34px system-ui'; ctx.textAlign = 'center'; ctx.fillText('🧽', R.clean.x, R.clean.y + 12); }
}
