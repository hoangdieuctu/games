/* ═══════════════════════ render.js — vẽ hồ, trang trí, cá ═══════════════════════ */

const R = { bubbles: [], debris: [], sparks: [], time: 0, layout: null, selected: null, hover: null, clean: null, dragDeco: null, ghost: null };

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

function computeLayout(t, rect) {
  const d = tankDims(t), spec = tankSpec(t.kind, t.size);
  const pad = 18;
  const s = Math.min(((rect.w - pad * 2) * spec.fit) / d.W, ((rect.h - pad * 2) * spec.fit) / d.H);
  const w = d.W * s, h = d.H * s;
  const x = rect.x + (rect.w - w) / 2, y = rect.y + (rect.h - h) / 2 + rect.h * 0.03;
  return { x, y, w, h, s, W: d.W, H: d.H };
}
const toPx = (L, cx, cy) => [L.x + cx * L.s, L.y + cy * L.s];
const toCm = (L, px, py) => [(px - L.x) / L.s, (py - L.y) / L.s];

/* ── Phòng & hồ ── */
function drawRoom(ctx, W, Hh, night) {
  const g = ctx.createLinearGradient(0, 0, 0, Hh);
  if (night) { g.addColorStop(0, '#0b1020'); g.addColorStop(1, '#05070d'); }
  else { g.addColorStop(0, '#1b2838'); g.addColorStop(1, '#0d141d'); }
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, Hh);
}

function drawTankBack(ctx, t, L, night) {
  const bg = BACKGROUNDS[t.bg] || BACKGROUNDS.blue;
  const lightOn = t.eq.light > 0;
  // bóng & tủ
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,.45)'; ctx.filter = 'blur(14px)';
  ctx.fillRect(L.x - 6, L.y + L.h * 0.15, L.w + 12, L.h + 14);
  ctx.restore();
  ctx.fillStyle = night ? '#0a0d14' : '#131a24';
  ctx.fillRect(L.x - 10, L.y + L.h, L.w + 20, 16);
  // nước
  const g = ctx.createLinearGradient(0, L.y, 0, L.y + L.h);
  g.addColorStop(0, bg.top); g.addColorStop(1, bg.bot);
  ctx.fillStyle = g; ctx.fillRect(L.x, L.y, L.w, L.h);
  // đèn tắt → tối
  if (!lightOn) { ctx.fillStyle = `rgba(2,6,14,${night ? 0.72 : 0.45})`; ctx.fillRect(L.x, L.y, L.w, L.h); }
  else if (t.eq.light === 2) { const gg = ctx.createRadialGradient(L.x + L.w / 2, L.y, 0, L.x + L.w / 2, L.y, L.w * 0.8); gg.addColorStop(0, 'rgba(255,255,230,.28)'); gg.addColorStop(1, 'rgba(255,255,230,0)'); ctx.fillStyle = gg; ctx.fillRect(L.x, L.y, L.w, L.h); }
  // tia sáng
  if (lightOn) {
    ctx.save(); ctx.beginPath(); ctx.rect(L.x, L.y, L.w, L.h); ctx.clip();
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 4; i++) {
      const x0 = L.x + L.w * (0.15 + i * 0.22) + Math.sin(R.time * 0.25 + i) * L.w * 0.04;
      const gr = ctx.createLinearGradient(0, L.y, 0, L.y + L.h);
      gr.addColorStop(0, `rgba(255,255,255,${0.09 * t.eq.light})`); gr.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = gr; ctx.beginPath();
      ctx.moveTo(x0 - L.w * 0.02, L.y); ctx.lineTo(x0 + L.w * 0.02, L.y); ctx.lineTo(x0 + L.w * 0.12, L.y + L.h); ctx.lineTo(x0 - L.w * 0.06, L.y + L.h); ctx.closePath(); ctx.fill();
    }
    ctx.restore();
  }
  // màu nước xấu
  const w = t.water;
  if (w.ammonia > 15) { ctx.fillStyle = `rgba(190,200,60,${(w.ammonia - 15) / 100 * 0.35})`; ctx.fillRect(L.x, L.y, L.w, L.h); }
  if (w.dirt > 20) { const gd = ctx.createLinearGradient(0, L.y, 0, L.y + L.h); gd.addColorStop(0, 'rgba(110,80,40,0)'); gd.addColorStop(1, `rgba(110,80,40,${(w.dirt - 20) / 80 * 0.5})`); ctx.fillStyle = gd; ctx.fillRect(L.x, L.y, L.w, L.h); }
  if (t.med) { const mc = { antifungal: 'rgba(40,90,255,.18)', ich: 'rgba(60,200,120,.12)', copper: 'rgba(80,200,220,.12)', antibiotic: 'rgba(255,220,120,.1)', epsom: 'rgba(255,255,255,.06)' }[t.med.type]; ctx.fillStyle = mc; ctx.fillRect(L.x, L.y, L.w, L.h); }
}

function drawSubstrate(ctx, t, L) {
  const sub = SUBSTRATES[t.substrate]; if (!sub || !sub.c1) return;
  const hpx = Math.max(8, L.s * 2.2);
  const y = L.y + L.h - hpx;
  const g = ctx.createLinearGradient(0, y, 0, L.y + L.h); g.addColorStop(0, sub.c1); g.addColorStop(1, sub.c2);
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.moveTo(L.x, L.y + L.h);
  for (let x = 0; x <= L.w; x += 12) ctx.lineTo(L.x + x, y + Math.sin(x * 0.05 + 1) * hpx * 0.15);
  ctx.lineTo(L.x + L.w, L.y + L.h); ctx.closePath(); ctx.fill();
  if (sub.speck) {
    for (let i = 0; i < 70; i++) {
      const px = L.x + hash01(t.id, i) * L.w, py = y + 2 + hash01(t.id, i + 500) * (hpx - 3);
      ctx.fillStyle = i % 3 ? 'rgba(255,255,255,.18)' : 'rgba(0,0,0,.25)';
      ctx.beginPath(); ctx.arc(px, py, 1 + hash01(t.id, i + 900) * 1.6, 0, 7); ctx.fill();
    }
  }
}
const groundY = (L) => L.y + L.h - Math.max(6, L.s * 1.6);

/* ── Trang trí ── */
function drawDeco(ctx, dc, L, time, alpha = 1) {
  const D = DECO[dc.type]; if (!D) return;
  const [x] = toPx(L, dc.x, 0); const gy = groundY(L);
  const w = D.w * L.s, h = D.h * L.s;
  ctx.save(); ctx.globalAlpha = alpha; ctx.translate(x, gy); if (dc.flip) ctx.scale(-1, 1);
  const seed = dc.id || dc.type;
  switch (D.kind) {
    case 'rock': {
      const g = ctx.createRadialGradient(-w * 0.2, -h * 0.7, 2, 0, -h * 0.3, w * 0.8); g.addColorStop(0, '#9aa3ad'); g.addColorStop(1, '#3b424b');
      ctx.fillStyle = g; ctx.beginPath();
      const n = 9;
      for (let i = 0; i <= n; i++) { const a = Math.PI + (i / n) * Math.PI; const r = (0.8 + hash01(seed, i) * 0.35); ctx.lineTo(Math.cos(a) * w * 0.5 * r, Math.sin(a) * h * r * 1.05); }
      ctx.closePath(); ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,.25)'; ctx.lineWidth = 1; ctx.stroke(); break;
    }
    case 'wood': {
      ctx.strokeStyle = '#4a2f1b'; ctx.lineCap = 'round'; ctx.lineWidth = w * 0.11;
      ctx.beginPath(); ctx.moveTo(-w * 0.45, 0); ctx.quadraticCurveTo(-w * 0.1, -h * 0.3, w * 0.35, -h * 0.9); ctx.stroke();
      ctx.lineWidth = w * 0.07; ctx.beginPath(); ctx.moveTo(-w * 0.15, -h * 0.28); ctx.quadraticCurveTo(-w * 0.3, -h * 0.6, -w * 0.45, -h * 0.75); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(w * 0.1, -h * 0.55); ctx.quadraticCurveTo(w * 0.35, -h * 0.5, w * 0.5, -h * 0.45); ctx.stroke();
      ctx.strokeStyle = '#7a5433'; ctx.lineWidth = w * 0.03; ctx.beginPath(); ctx.moveTo(-w * 0.42, -2); ctx.quadraticCurveTo(-w * 0.1, -h * 0.32, w * 0.32, -h * 0.86); ctx.stroke(); break;
    }
    case 'cave': {
      const g = ctx.createLinearGradient(0, -h, 0, 0); g.addColorStop(0, '#7d858f'); g.addColorStop(1, '#3a4047');
      ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(-w / 2, 0); ctx.quadraticCurveTo(-w * 0.55, -h * 1.05, 0, -h); ctx.quadraticCurveTo(w * 0.55, -h * 1.05, w / 2, 0); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#0b0d10'; ctx.beginPath(); ctx.ellipse(w * 0.05, -h * 0.02, w * 0.28, h * 0.55, 0, Math.PI, 0); ctx.fill(); break;
    }
    case 'castle': {
      ctx.fillStyle = '#c9b8a3';
      ctx.fillRect(-w * 0.5, -h * 0.55, w, h * 0.55);
      ctx.fillRect(-w * 0.5, -h * 0.85, w * 0.28, h * 0.85); ctx.fillRect(w * 0.22, -h * 0.85, w * 0.28, h * 0.85);
      ctx.fillRect(-w * 0.12, -h, w * 0.24, h);
      ctx.fillStyle = '#a8957f';
      for (let i = -2; i <= 2; i++) ctx.fillRect(i * w * 0.2 - w * 0.05, -h * 0.62, w * 0.1, h * 0.08);
      ctx.fillRect(-w * 0.5, -h * 0.92, w * 0.1, h * 0.08); ctx.fillRect(-w * 0.32, -h * 0.92, w * 0.1, h * 0.08);
      ctx.fillRect(w * 0.22, -h * 0.92, w * 0.1, h * 0.08); ctx.fillRect(w * 0.4, -h * 0.92, w * 0.1, h * 0.08);
      ctx.fillStyle = '#e04848'; ctx.beginPath(); ctx.moveTo(-w * 0.12, -h); ctx.lineTo(w * 0.12, -h); ctx.lineTo(0, -h * 1.18); ctx.fill();
      ctx.fillStyle = '#2a2018'; ctx.beginPath(); ctx.ellipse(0, -h * 0.02, w * 0.12, h * 0.25, 0, Math.PI, 0); ctx.fill(); break;
    }
    case 'shell': {
      ctx.fillStyle = '#f2d9c4'; ctx.beginPath(); ctx.moveTo(0, 0);
      for (let i = 0; i <= 8; i++) { const a = Math.PI + (i / 8) * Math.PI; ctx.lineTo(Math.cos(a) * w * 0.5 * (i % 2 ? 1 : 0.92), Math.sin(a) * h * 1.1); }
      ctx.fill(); ctx.strokeStyle = '#c49b7c'; ctx.lineWidth = 1;
      for (let i = 1; i < 8; i++) { const a = Math.PI + (i / 8) * Math.PI; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(a) * w * 0.5, Math.sin(a) * h * 1.1); ctx.stroke(); } break;
    }
    case 'bubbler': { ctx.fillStyle = '#556'; ctx.beginPath(); ctx.ellipse(0, -h * 0.4, w * 0.5, h * 0.5, 0, 0, 7); ctx.fill(); break; }
    case 'plant': drawPlant(ctx, D, w, h, seed, time); break;
  }
  ctx.restore();
}

function drawPlant(ctx, D, w, h, seed, time) {
  const sway = (k, f = 1) => Math.sin(time * 1.1 * f + hash01(seed, k) * 6) * 0.12;
  switch (D.style) {
    case 'moss': {
      for (let i = 0; i < 14; i++) { const px = (hash01(seed, i) - 0.5) * w, py = -hash01(seed, i + 40) * h; ctx.fillStyle = i % 2 ? '#2f7a3a' : '#4aa050'; ctx.beginPath(); ctx.arc(px, py, w * 0.14, 0, 7); ctx.fill(); }
      break;
    }
    case 'round': {
      for (let i = 0; i < 6; i++) {
        const a = -Math.PI / 2 + (i - 2.5) * 0.4 + sway(i) * 1.5, len = h * (0.55 + hash01(seed, i) * 0.45);
        const ex = Math.cos(a) * len, ey = Math.sin(a) * len;
        ctx.strokeStyle = '#1f5a2a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(ex, ey); ctx.stroke();
        const g = ctx.createRadialGradient(ex, ey, 1, ex, ey, w * 0.3); g.addColorStop(0, '#4caf50'); g.addColorStop(1, '#1b5e20');
        ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(ex, ey - w * 0.1, w * 0.26, w * 0.2, a + Math.PI / 2, 0, 7); ctx.fill();
      } break;
    }
    case 'fern': case 'red': case 'broad': {
      const col = D.style === 'red' ? ['#8e2a3a', '#d8506a'] : D.style === 'broad' ? ['#1e6b2e', '#5cc46a'] : ['#1f5e2c', '#3f9a4a'];
      const n = D.style === 'broad' ? 5 : 7;
      for (let i = 0; i < n; i++) {
        const a = -Math.PI / 2 + (i - (n - 1) / 2) * (D.style === 'broad' ? 0.35 : 0.22) + sway(i);
        const len = h * (0.7 + hash01(seed, i) * 0.3), wd = D.style === 'broad' ? w * 0.28 : w * 0.13;
        const g = ctx.createLinearGradient(0, 0, 0, -len); g.addColorStop(0, col[0]); g.addColorStop(1, col[1]);
        ctx.save(); ctx.rotate(a + Math.PI / 2); ctx.fillStyle = g;
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(-wd, -len * 0.5, 0, -len); ctx.quadraticCurveTo(wd, -len * 0.5, 0, 0); ctx.fill();
        if (D.style === 'fern') { ctx.strokeStyle = 'rgba(0,0,0,.15)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -len); ctx.stroke(); }
        ctx.restore();
      } break;
    }
    case 'grass': {
      for (let i = 0; i < 9; i++) {
        const bx = (hash01(seed, i) - 0.5) * w, len = h * (0.6 + hash01(seed, i + 20) * 0.4), sw = sway(i, 0.8) * len * 1.3;
        ctx.strokeStyle = i % 2 ? '#3f9a4a' : '#2e7d3a'; ctx.lineWidth = Math.max(1.5, w * 0.08); ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(bx, 0); ctx.quadraticCurveTo(bx + sw * 0.3, -len * 0.5, bx + sw, -len); ctx.stroke();
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
    case 'torpedo': case 'phoenix': hb = L * 0.14; break;
    case 'oval': case 'sword': hb = L * 0.22; break;
    case 'fan': case 'veil': hb = L * 0.2; break;
    case 'tall': hb = L * 0.42; break;
    case 'disc': hb = L * 0.44; break;
    case 'fancy': hb = L * 0.3; break;
    case 'koi': hb = L * 0.17; break;
    case 'bottom': case 'pleco': hb = L * 0.17; break;
    default: hb = L * 0.2;
  }
  const tail = -hl * (shape === 'fan' || shape === 'veil' ? 0.55 : shape === 'phoenix' ? 0.8 : 0.85);
  const nose = hl * (shape === 'tall' || shape === 'disc' ? 0.8 : 1);
  if (shape === 'tall') {
    p.moveTo(nose, 0); p.quadraticCurveTo(nose * 0.4, -hb * 1.1, -hl * 0.2, -hb * 0.6); p.quadraticCurveTo(tail, -hb * 0.35, tail, 0);
    p.quadraticCurveTo(tail, hb * 0.35, -hl * 0.2, hb * 0.6); p.quadraticCurveTo(nose * 0.4, hb * 1.1, nose, 0);
  } else if (shape === 'disc') {
    p.ellipse(0, 0, hl * 0.82, hb, 0, 0, Math.PI * 2);
  } else if (shape === 'bottom' || shape === 'pleco') {
    p.moveTo(nose, hb * 0.5); p.quadraticCurveTo(nose * 0.5, -hb * 1.4, -hl * 0.1, -hb * 0.9); p.quadraticCurveTo(tail, -hb * 0.2, tail, wag);
    p.quadraticCurveTo(tail, hb * 0.5, -hl * 0.2, hb * 0.55); p.lineTo(nose * 0.7, hb * 0.55); p.quadraticCurveTo(nose, hb * 0.55, nose, hb * 0.5);
  } else {
    p.moveTo(nose, 0);
    p.quadraticCurveTo(hl * 0.45, -hb * 1.25, -hl * 0.1, -hb * 0.95);
    p.quadraticCurveTo(tail * 0.75, -hb * 0.5, tail, wag * 0.6);
    p.quadraticCurveTo(tail * 0.75, hb * 0.5, -hl * 0.1, hb * 0.95);
    p.quadraticCurveTo(hl * 0.45, hb * 1.25, nose, 0);
  }
  p.closePath();
  return { p, hb, tail, nose };
}

function drawFish(ctx, f, L, time, a) {
  const sp = SPECIES[f.sp];
  if (sp.shape === 'snail') return drawSnail(ctx, f, L, a);
  if (sp.shape === 'shrimp') return drawShrimp(ctx, f, L, a);
  if (sp.shape === 'dragon') return drawDragon(ctx, f, L, time, a);
  const col = sp.variants ? sp.variants[f.variant] || sp.col : sp.col;
  const lenCm = visSize(sp.size) * (0.35 + 0.65 * f.growth);
  const Lpx = Math.max(10, lenCm * L.s);
  const [px, py] = toPx(L, f.x, f.y);
  const face = a.face || 1;
  let ang = Math.atan2(f.vy, Math.abs(f.vx) + 0.01); ang = clamp(ang, -0.45, 0.45);
  const sick = f.health < 35 || (f.disease && f.disease.sev > 0.6);
  if (f.disease && f.disease.id === 'swim') ang += Math.sin(time * 0.8 + a.phase) * 0.8;
  else if (sick) ang += 0.25;
  const wag = Math.sin(a.phase) * Lpx * 0.07 * (0.4 + (a.speedN || 0.5));
  const fin = col.fin, body = col.body, acc = col.accent;
  const finS = sp.finScale || 1;
  const dull = 1 - f.health / 100;

  ctx.save();
  ctx.translate(px, py); ctx.scale(face, 1); ctx.rotate(ang);
  if (f.disease && f.disease.id === 'bloat') ctx.scale(1, 1 + 0.3 * f.disease.sev);
  if (sp.glow) { ctx.shadowColor = withAlpha(acc.length === 7 ? acc : '#ffffff', 0.6 + 0.3 * Math.sin(time * 2)); ctx.shadowBlur = 6 + sp.glow * 5 * (L.s / 6); }

  const { p, hb, tail, nose } = bodyPath(sp.shape, Lpx, wag);
  const ragged = f.disease && f.disease.id === 'finrot' ? f.disease.sev : 0;

  // ── vây đuôi ──
  ctx.fillStyle = withAlpha(fin, 0.85);
  const tx = tail; // gốc đuôi
  ctx.beginPath();
  if (sp.shape === 'fan') {
    const r = Lpx * 0.5 * finS;
    const g = ctx.createRadialGradient(tx, 0, r * 0.15, tx, 0, r); g.addColorStop(0, fin); g.addColorStop(1, withAlpha(acc, 0.85)); ctx.fillStyle = g;
    ctx.moveTo(tx + 2, 0); ctx.arc(tx + wag * 0.3, 0, r, Math.PI * 0.68, Math.PI * 1.32); ctx.closePath();
  } else if (sp.shape === 'veil') {
    const r = Lpx * 0.62 * finS, ww = wag * 1.4, tip = tx - r * (1 - ragged * 0.4);
    const g = ctx.createLinearGradient(tx, 0, tip, 0); g.addColorStop(0, withAlpha(fin, 0.9)); g.addColorStop(1, withAlpha(acc, 0.35)); ctx.fillStyle = g;
    for (let k = 0; k < 2; k++) {
      const o = k ? ww * 0.8 : 0, sc = k ? 0.8 : 1;
      ctx.beginPath(); ctx.moveTo(tx + 2, 0);
      ctx.bezierCurveTo(tx - r * 0.35, -r * 0.45 * sc + o, tx - r * 1.05, -r * 0.5 * sc + o, tip, ww * 1.6 + o);
      ctx.bezierCurveTo(tx - r * 1.05, r * 0.5 * sc + o, tx - r * 0.35, r * 0.45 * sc + o, tx + 2, 0);
      ctx.fill();
    }
    ctx.beginPath();
  } else if (sp.shape === 'phoenix') {
    for (let i = -1; i <= 1; i++) {
      const r = Lpx * (i === 0 ? 1.3 : 0.95), sw = Math.sin(a.phase * 0.7 + i) * Lpx * 0.15;
      const g = ctx.createLinearGradient(tx, 0, tx - r, 0); g.addColorStop(0, fin); g.addColorStop(0.6, body); g.addColorStop(1, withAlpha(acc, 0));
      ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(tx + 2, 0);
      ctx.bezierCurveTo(tx - r * 0.3, i * Lpx * 0.25 + sw, tx - r * 0.7, i * Lpx * 0.45 + sw * 1.5, tx - r, i * Lpx * 0.4 + sw * 2);
      ctx.bezierCurveTo(tx - r * 0.6, i * Lpx * 0.15 + sw, tx - r * 0.3, i * Lpx * 0.05, tx + 2, 0); ctx.fill();
    }
    ctx.beginPath();
  } else if (sp.shape === 'fancy') {
    const r = Lpx * 0.6;
    ctx.moveTo(tx, 0); ctx.bezierCurveTo(tx - r * 0.5, -r * 0.6 + wag, tx - r, -r * 0.8 + wag, tx - r * 0.7, wag * 0.5);
    ctx.bezierCurveTo(tx - r, r * 0.8 + wag, tx - r * 0.5, r * 0.6 + wag, tx, 0);
  } else if (sp.shape === 'sword') {
    ctx.moveTo(tx, 0); ctx.lineTo(tx - Lpx * 0.22, -hb * 0.9 + wag); ctx.lineTo(tx - Lpx * 0.15, wag * 0.6); ctx.lineTo(tx - Lpx * 0.6, hb * 1.6 + wag); ctx.lineTo(tx - Lpx * 0.1, hb * 0.5 + wag * 0.5); ctx.closePath();
  } else if (sp.shape === 'tall' || sp.shape === 'disc') {
    ctx.moveTo(tx, -hb * 0.35); ctx.quadraticCurveTo(tx - Lpx * 0.25, wag, tx - Lpx * 0.22, -hb * 0.6 + wag); ctx.lineTo(tx - Lpx * 0.2, hb * 0.6 + wag); ctx.quadraticCurveTo(tx - Lpx * 0.25, wag, tx, hb * 0.35); ctx.closePath();
  } else {
    const r = Lpx * 0.28 * (1 - ragged * 0.4);
    ctx.moveTo(tx, 0); ctx.lineTo(tx - r, -hb * 1.1 + wag); ctx.lineTo(tx - r * 0.6, wag * 0.8); ctx.lineTo(tx - r, hb * 1.1 + wag); ctx.closePath();
  }
  ctx.fill();
  if (ragged > 0.15) { ctx.fillStyle = 'rgba(30,20,20,.5)'; for (let i = 0; i < 4; i++) { const yy = (i - 1.5) * hb * 0.5; ctx.beginPath(); ctx.arc(tx - Lpx * 0.26 * (sp.shape === 'veil' ? 2.4 : 1), yy + wag, Lpx * 0.03 + ragged * Lpx * 0.03, 0, 7); ctx.fill(); } }

  // ── vây lưng / bụng ──
  ctx.fillStyle = withAlpha(fin, 0.75);
  if (sp.shape === 'veil') {
    const r = Lpx * 0.32 * finS;
    ctx.beginPath(); ctx.moveTo(-Lpx * 0.15, -hb * 0.9); ctx.quadraticCurveTo(-Lpx * 0.2 - wag, -hb - r, tail - r * 0.6, -hb * 0.5 + wag * 0.5); ctx.lineTo(tail, -hb * 0.3); ctx.fill();
    ctx.beginPath(); ctx.moveTo(-Lpx * 0.05, hb * 0.9); ctx.quadraticCurveTo(-Lpx * 0.2 - wag, hb + r, tail - r * 0.6, hb * 0.5 + wag * 0.5); ctx.lineTo(tail, hb * 0.3); ctx.fill();
  } else if (sp.shape === 'tall') {
    const r = Lpx * 0.7 * finS;
    ctx.beginPath(); ctx.moveTo(Lpx * 0.1, -hb * 0.9); ctx.quadraticCurveTo(-Lpx * 0.1, -hb - r * 0.9, -Lpx * 0.45, -hb - r * 0.4 + wag * 0.3); ctx.lineTo(tail, -hb * 0.4); ctx.fill();
    ctx.beginPath(); ctx.moveTo(Lpx * 0.1, hb * 0.9); ctx.quadraticCurveTo(-Lpx * 0.1, hb + r * 0.9, -Lpx * 0.45, hb + r * 0.4 + wag * 0.3); ctx.lineTo(tail, hb * 0.4); ctx.fill();
  } else if (sp.shape === 'disc') {
    const r = hb * 0.35 * finS;
    ctx.beginPath(); ctx.ellipse(-Lpx * 0.05, -hb * 0.95, Lpx * 0.4, r, 0, Math.PI, 0); ctx.fill();
    ctx.beginPath(); ctx.ellipse(-Lpx * 0.05, hb * 0.95, Lpx * 0.4, r, 0, 0, Math.PI); ctx.fill();
  } else if (sp.shape !== 'bottom' && sp.shape !== 'pleco') {
    ctx.beginPath(); ctx.moveTo(Lpx * 0.15, -hb * 0.9); ctx.quadraticCurveTo(-Lpx * 0.05, -hb * (sp.shape === 'fancy' ? 2 : 1.7), -Lpx * 0.3, -hb * 0.7); ctx.fill();
    ctx.beginPath(); ctx.moveTo(-Lpx * 0.05, hb * 0.9); ctx.quadraticCurveTo(-Lpx * 0.15, hb * 1.5, -Lpx * 0.3, hb * 0.7); ctx.fill();
  } else {
    ctx.beginPath(); ctx.moveTo(Lpx * 0.05, -hb * 0.9); ctx.lineTo(-Lpx * 0.05, -hb * 1.9); ctx.lineTo(-Lpx * 0.2, -hb * 0.8); ctx.fill();
  }

  // ── thân ──
  ctx.shadowBlur = 0;
  const g = ctx.createLinearGradient(0, -hb, 0, hb);
  g.addColorStop(0, shade(body, -0.25)); g.addColorStop(0.45, body); g.addColorStop(1, col.belly || shade(body, 0.45));
  ctx.fillStyle = g; ctx.fill(p);
  ctx.save(); ctx.clip(p);
  drawPattern(ctx, sp, col, f, Lpx, hb, time, a);
  // bóng nắng
  ctx.fillStyle = 'rgba(255,255,255,.18)'; ctx.beginPath(); ctx.ellipse(Lpx * 0.05, -hb * 0.5, Lpx * 0.3, hb * 0.28, 0, 0, 7); ctx.fill();
  if (dull > 0.3) { ctx.fillStyle = `rgba(120,120,120,${(dull - 0.3) * 0.7})`; ctx.fillRect(-Lpx, -Lpx, Lpx * 2, Lpx * 2); }
  drawDiseaseMarks(ctx, f, Lpx, hb);
  ctx.restore();
  ctx.strokeStyle = 'rgba(0,0,0,.18)'; ctx.lineWidth = 1; ctx.stroke(p);

  // vây ngực
  ctx.fillStyle = withAlpha(fin, 0.6);
  ctx.save(); ctx.translate(Lpx * 0.15, hb * 0.3); ctx.rotate(Math.sin(a.phase * 1.3) * 0.4 + 0.5);
  ctx.beginPath(); ctx.ellipse(0, 0, Lpx * 0.14, hb * 0.35, 0, 0, 7); ctx.fill(); ctx.restore();

  // râu
  if (sp.shape === 'koi' || sp.shape === 'bottom') {
    ctx.strokeStyle = 'rgba(40,30,20,.7)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(nose - 2, hb * 0.3); ctx.quadraticCurveTo(nose + Lpx * 0.1, hb * 0.6, nose + Lpx * 0.12, hb * 0.9 + Math.sin(a.phase) * 2); ctx.stroke();
  }
  if (sp.shape === 'pleco') { ctx.fillStyle = '#2a2018'; ctx.beginPath(); ctx.ellipse(nose - Lpx * 0.05, hb * 0.45, Lpx * 0.09, hb * 0.2, 0, 0, 7); ctx.fill(); }

  // mắt
  const ex = nose - Lpx * (sp.shape === 'tall' || sp.shape === 'disc' ? 0.22 : 0.16), ey = -hb * (sp.shape === 'bottom' ? 0.4 : 0.2);
  const er = Math.max(1.3, Lpx * 0.045);
  ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(ex, ey, er, 0, 7); ctx.fill();
  ctx.fillStyle = '#111'; ctx.beginPath(); ctx.arc(ex + er * 0.3, ey, er * 0.55, 0, 7); ctx.fill();
  ctx.restore();

  // tàn lửa phượng hoàng
  if (sp.shape === 'phoenix' && Math.random() < 0.35) R.sparks.push({ x: f.x - face * lenCm * 0.5, y: f.y, vx: rand(-1, 1), vy: rand(-2, -0.5), life: rand(0.6, 1.4), c: pick([fin, acc, body]) });
  if (sp.glow >= 2 && Math.random() < 0.08) R.sparks.push({ x: f.x + rand(-lenCm / 2, lenCm / 2), y: f.y + rand(-1, 1), vx: 0, vy: -0.6, life: 1, c: acc, tiny: true });
}

function drawPattern(ctx, sp, col, f, Lpx, hb, time, a) {
  const acc = col.accent;
  switch (sp.pattern) {
    case 'neon': {
      ctx.fillStyle = acc; ctx.shadowColor = acc; ctx.shadowBlur = 6;
      ctx.fillRect(-Lpx * 0.45, -hb * 0.35, Lpx * 0.9, hb * 0.35); ctx.shadowBlur = 0;
      ctx.fillStyle = col.fin; ctx.fillRect(-Lpx * 0.45, hb * 0.05, Lpx * 0.5, hb); break;
    }
    case 'hstripes': { ctx.fillStyle = withAlpha(acc, 0.85); for (let i = -1; i <= 1; i++) ctx.fillRect(-Lpx * 0.45, i * hb * 0.55 - hb * 0.12, Lpx * 0.9, hb * 0.22); break; }
    case 'bars': { ctx.fillStyle = withAlpha(acc, 0.85); for (let i = 0; i < 3; i++) { const x = Lpx * 0.22 - i * Lpx * 0.26; ctx.beginPath(); ctx.moveTo(x - Lpx * 0.05, -hb * 1.2); ctx.lineTo(x + Lpx * 0.05, -hb * 1.2); ctx.lineTo(x, hb * 1.2); ctx.lineTo(x - Lpx * 0.1, hb * 1.2); ctx.fill(); } break; }
    case 'spots': { ctx.fillStyle = withAlpha(acc, 0.7); for (let i = 0; i < 12; i++) { ctx.beginPath(); ctx.arc((hash01(f.id, i) - 0.5) * Lpx * 0.85, (hash01(f.id, i + 30) - 0.5) * hb * 1.6, Lpx * 0.03 + hash01(f.id, i + 60) * Lpx * 0.03, 0, 7); ctx.fill(); } break; }
    case 'speckle': { ctx.fillStyle = withAlpha(acc, 0.8); for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.arc((hash01(f.id, i) - 0.7) * Lpx * 0.6, (hash01(f.id, i + 30) - 0.5) * hb * 1.4, Lpx * 0.025, 0, 7); ctx.fill(); } break; }
    case 'patch': { ctx.fillStyle = acc; for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.ellipse((hash01(f.id, i) - 0.5) * Lpx * 0.7, (hash01(f.id, i + 9) - 0.5) * hb, Lpx * (0.1 + hash01(f.id, i + 3) * 0.12), hb * 0.6, hash01(f.id, i + 5) * 3, 0, 7); ctx.fill(); } break; }
    case 'wave': { ctx.strokeStyle = withAlpha(acc, 0.7); ctx.lineWidth = Math.max(1, Lpx * 0.03); for (let i = 0; i < 5; i++) { const x = Lpx * 0.3 - i * Lpx * 0.15; ctx.beginPath(); for (let y = -hb; y <= hb; y += hb * 0.25) ctx.lineTo(x + Math.sin(y / hb * 4 + i) * Lpx * 0.03, y); ctx.stroke(); } break; }
    case 'iridescent': {
      const hue = (time * 40 + hash01(f.id) * 360) % 360;
      const g = ctx.createLinearGradient(-Lpx / 2, 0, Lpx / 2, 0);
      g.addColorStop(0, `hsla(${hue},90%,65%,.45)`); g.addColorStop(0.5, `hsla(${(hue + 90) % 360},90%,65%,.35)`); g.addColorStop(1, `hsla(${(hue + 180) % 360},90%,65%,.45)`);
      ctx.fillStyle = g; ctx.fillRect(-Lpx, -Lpx, Lpx * 2, Lpx * 2); break;
    }
    case 'plates': { ctx.strokeStyle = withAlpha(acc, 0.6); ctx.lineWidth = 1; for (let i = -1; i <= 1; i++) { ctx.beginPath(); ctx.moveTo(-Lpx * 0.45, i * hb * 0.5); ctx.lineTo(Lpx * 0.3, i * hb * 0.5); ctx.stroke(); } for (let i = 0; i < 5; i++) { const x = Lpx * 0.25 - i * Lpx * 0.15; ctx.beginPath(); ctx.moveTo(x, -hb); ctx.lineTo(x, hb); ctx.stroke(); } break; }
    case 'scales': { ctx.strokeStyle = withAlpha(acc, 0.55); ctx.lineWidth = 1; for (let r = 0; r < 6; r++) for (let c = 0; c < 3; c++) { ctx.beginPath(); ctx.arc(Lpx * 0.35 - r * Lpx * 0.14, (c - 1) * hb * 0.6 + (r % 2) * hb * 0.3, hb * 0.32, Math.PI * 0.7, Math.PI * 1.3); ctx.stroke(); } break; }
    case 'flame': { const g = ctx.createLinearGradient(Lpx / 2, 0, -Lpx / 2, 0); g.addColorStop(0, withAlpha(acc, 0.6)); g.addColorStop(1, withAlpha(col.fin, 0)); ctx.fillStyle = g; ctx.fillRect(-Lpx, -Lpx, Lpx * 2, Lpx * 2); break; }
    case 'stars': { for (let i = 0; i < 14; i++) { const tw = 0.5 + 0.5 * Math.sin(time * 3 + i * 1.7); ctx.fillStyle = `rgba(255,255,255,${0.4 + 0.6 * tw})`; ctx.beginPath(); ctx.arc((hash01(f.id, i) - 0.5) * Lpx * 0.9, (hash01(f.id, i + 30) - 0.5) * hb * 1.7, 0.6 + tw * Lpx * 0.02, 0, 7); ctx.fill(); } break; }
    case 'plain': default:
      if (col.spots) { ctx.fillStyle = 'rgba(20,20,20,.8)'; for (let i = 0; i < 9; i++) { ctx.beginPath(); ctx.arc((hash01(f.id, i) - 0.5) * Lpx * 0.85, (hash01(f.id, i + 30) - 0.5) * hb * 1.6, Lpx * 0.04, 0, 7); ctx.fill(); } }
  }
}

function drawDiseaseMarks(ctx, f, Lpx, hb) {
  if (!f.disease) return;
  const sev = f.disease.sev, id = f.disease.id, n = Math.round(3 + sev * 14);
  if (id === 'ich') { ctx.fillStyle = 'rgba(255,255,255,.95)'; for (let i = 0; i < n; i++) { ctx.beginPath(); ctx.arc((hash01(f.id, i + 100) - 0.5) * Lpx * 0.9, (hash01(f.id, i + 200) - 0.5) * hb * 1.7, Math.max(0.8, Lpx * 0.018), 0, 7); ctx.fill(); } }
  else if (id === 'velvet') { ctx.fillStyle = 'rgba(230,180,60,.8)'; for (let i = 0; i < n * 2; i++) { ctx.beginPath(); ctx.arc((hash01(f.id, i + 100) - 0.5) * Lpx * 0.9, (hash01(f.id, i + 200) - 0.5) * hb * 1.7, 0.7, 0, 7); ctx.fill(); } }
  else if (id === 'fungus') { ctx.fillStyle = 'rgba(245,245,245,.85)'; for (let i = 0; i < Math.round(1 + sev * 3); i++) { const x = (hash01(f.id, i + 100) - 0.5) * Lpx * 0.8, y = (hash01(f.id, i + 200) - 0.5) * hb; for (let k = 0; k < 5; k++) { ctx.beginPath(); ctx.arc(x + (hash01(f.id, k + i * 7) - 0.5) * Lpx * 0.08, y + (hash01(f.id, k + 50 + i * 7) - 0.5) * hb * 0.3, Lpx * 0.035, 0, 7); ctx.fill(); } } }
}

function drawSnail(ctx, f, L, a) {
  const [px, py] = toPx(L, f.x, f.y); const r = Math.max(4, SPECIES.snail.size * L.s * 0.5 * (0.5 + 0.5 * f.growth));
  ctx.save(); ctx.translate(px, py); ctx.scale(a.face || 1, 1);
  ctx.fillStyle = '#6b4a2b'; ctx.beginPath(); ctx.ellipse(r * 0.3, 0, r * 1.2, r * 0.45, 0, 0, 7); ctx.fill();
  ctx.strokeStyle = '#6b4a2b'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(r * 1.2, -r * 0.2); ctx.lineTo(r * 1.7, -r * 0.9); ctx.moveTo(r * 1.3, -r * 0.1); ctx.lineTo(r * 1.9, -r * 0.4); ctx.stroke();
  const g = ctx.createRadialGradient(-r * 0.3, -r * 0.7, 1, -r * 0.2, -r * 0.5, r); g.addColorStop(0, '#f0c060'); g.addColorStop(1, '#3a2510');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(-r * 0.2, -r * 0.45, r * 0.75, 0, 7); ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,.35)'; ctx.beginPath(); ctx.arc(-r * 0.2, -r * 0.45, r * 0.4, 0, 5); ctx.stroke();
  ctx.restore();
}
function drawShrimp(ctx, f, L, a) {
  const [px, py] = toPx(L, f.x, f.y); const l = Math.max(6, SPECIES.shrimp.size * L.s * (0.5 + 0.5 * f.growth));
  ctx.save(); ctx.translate(px, py); ctx.scale(a.face || 1, 1);
  const col = SPECIES.shrimp.col;
  ctx.strokeStyle = withAlpha(col.body, 0.9); ctx.lineWidth = Math.max(2, l * 0.28); ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(l * 0.5, 0); ctx.quadraticCurveTo(0, -l * 0.35, -l * 0.4, 0); ctx.quadraticCurveTo(-l * 0.5, l * 0.2, -l * 0.6, l * 0.1); ctx.stroke();
  ctx.lineWidth = 1; ctx.strokeStyle = withAlpha(col.fin, 0.8);
  for (let i = 0; i < 4; i++) { const x = l * 0.3 - i * l * 0.18; ctx.beginPath(); ctx.moveTo(x, l * 0.1); ctx.lineTo(x - l * 0.05 + Math.sin(a.phase + i) * 2, l * 0.35); ctx.stroke(); }
  ctx.beginPath(); ctx.moveTo(l * 0.5, -l * 0.05); ctx.lineTo(l * 1.1, -l * 0.35); ctx.moveTo(l * 0.5, 0); ctx.lineTo(l * 1.15, -l * 0.05); ctx.stroke();
  ctx.fillStyle = '#111'; ctx.beginPath(); ctx.arc(l * 0.45, -l * 0.12, Math.max(0.8, l * 0.06), 0, 7); ctx.fill();
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
  ctx.fillStyle = withAlpha(col.fin, 0.7); ctx.beginPath(); ctx.moveTo(pts[1][0], pts[1][1]);
  for (let i = 1; i < N; i++) { const r = Lpx * (0.045 + 0.025 * Math.sin(i * 1.3)); ctx.lineTo(pts[i][0] - seg * 0.3, pts[i][1] - Lpx * 0.07 - r); ctx.lineTo(pts[i + 1][0], pts[i + 1][1] - Lpx * 0.06); }
  ctx.closePath(); ctx.fill();
  // đuôi
  ctx.beginPath(); const tp = pts[N]; ctx.moveTo(tp[0], tp[1]); ctx.lineTo(tp[0] - Lpx * 0.22, tp[1] - Lpx * 0.16); ctx.lineTo(tp[0] - Lpx * 0.12, tp[1]); ctx.lineTo(tp[0] - Lpx * 0.22, tp[1] + Lpx * 0.16); ctx.closePath(); ctx.fill();
  // thân theo đoạn
  ctx.shadowBlur = 0;
  for (let i = N - 1; i >= 0; i--) {
    const [x, y] = pts[i]; const r = Lpx * 0.085 * (i < 3 ? 1 + (3 - i) * 0.1 : 1 - (i / N) * 0.5);
    const g = ctx.createRadialGradient(x, y - r * 0.4, 1, x, y, r); g.addColorStop(0, shade(col.body, 0.3)); g.addColorStop(1, shade(col.body, -0.3));
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill();
    ctx.strokeStyle = withAlpha(col.accent, 0.5); ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(x, y, r * 0.7, Math.PI * 0.7, Math.PI * 1.3); ctx.stroke();
  }
  // đầu, râu, mắt
  const hx = pts[0][0], hy = pts[0][1], hr = Lpx * 0.11;
  ctx.fillStyle = shade(col.body, 0.1); ctx.beginPath(); ctx.ellipse(hx + hr * 0.3, hy, hr * 1.4, hr, 0, 0, 7); ctx.fill();
  ctx.strokeStyle = col.fin; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(hx + hr * 1.3, hy + hr * 0.3); ctx.quadraticCurveTo(hx + hr * 2.6, hy + hr * 0.2 + Math.sin(time * 3) * 3, hx + hr * 3.2, hy + hr * 1.2); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(hx + hr * 0.2, hy - hr * 0.8); ctx.quadraticCurveTo(hx - hr * 0.3, hy - hr * 2, hx - hr * 1.2, hy - hr * 2.2); ctx.stroke();
  ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(hx + hr * 0.7, hy - hr * 0.3, hr * 0.3, 0, 7); ctx.fill();
  ctx.fillStyle = col.accent; ctx.beginPath(); ctx.arc(hx + hr * 0.78, hy - hr * 0.3, hr * 0.16, 0, 7); ctx.fill();
  ctx.restore();
  if (Math.random() < 0.2) R.sparks.push({ x: f.x - face * lenCm * 0.5 + rand(-2, 2), y: f.y + rand(-1, 1), vx: 0, vy: -0.8, life: 1.2, c: col.fin, tiny: true });
}

/* ── Hiệu ứng ── */
function updateParticles(t, L, dt) {
  const d = tankDims(t);
  // bọt khí từ sủi & đá sủi
  const srcs = [];
  if (t.eq.air) srcs.push(d.W - 2);
  for (const dc of t.deco) if (DECO[dc.type]?.kind === 'bubbler') srcs.push(dc.x);
  for (const sx of srcs) if (Math.random() < dt * 6) R.bubbles.push({ x: sx + rand(-0.6, 0.6), y: d.H - 1.5, r: rand(0.25, 0.7), vy: rand(6, 10), w: rand(6) });
  for (let i = R.bubbles.length - 1; i >= 0; i--) { const b = R.bubbles[i]; b.y -= b.vy * dt; b.x += Math.sin(R.time * 4 + b.w) * dt * 1.2; if (b.y < 0.3) R.bubbles.splice(i, 1); }
  // rác lơ lửng theo độ bẩn
  const want = Math.round(t.water.dirt / 100 * 45);
  while (R.debris.length < want) R.debris.push({ x: rand(d.W), y: rand(d.H * 0.3, d.H), vx: rand(-0.2, 0.2), s: rand(0.6, 1.4) });
  if (R.debris.length > want) R.debris.length = want;
  for (const p of R.debris) { p.x += p.vx * dt; p.y += Math.sin(R.time + p.s) * dt * 0.15 + dt * 0.05; if (p.y > d.H - 1) p.y = d.H * 0.4; if (p.x < 0) p.x = d.W; if (p.x > d.W) p.x = 0; }
  for (let i = R.sparks.length - 1; i >= 0; i--) { const s = R.sparks[i]; s.life -= dt; s.x += s.vx * dt; s.y += s.vy * dt; if (s.life <= 0) R.sparks.splice(i, 1); }
}

function drawEffects(ctx, t, L) {
  for (const b of R.bubbles) { const [x, y] = toPx(L, b.x, b.y); const r = b.r * L.s; ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.stroke(); ctx.fillStyle = 'rgba(255,255,255,.25)'; ctx.beginPath(); ctx.arc(x - r * 0.3, y - r * 0.3, r * 0.35, 0, 7); ctx.fill(); }
  ctx.fillStyle = 'rgba(90,70,40,.55)';
  for (const p of R.debris) { const [x, y] = toPx(L, p.x, p.y); ctx.fillRect(x, y, p.s * 1.5, p.s * 1.5); }
  for (const s of R.sparks) { const [x, y] = toPx(L, s.x, s.y); ctx.fillStyle = withAlpha(s.c, Math.max(0, s.life) * 0.9); ctx.beginPath(); ctx.arc(x, y, s.tiny ? 1.2 : 1.5 + s.life * 1.5, 0, 7); ctx.fill(); }
  // mồi
  for (const p of t.pellets) { const [x, y] = toPx(L, p.x, p.y); ctx.fillStyle = '#8b5a2b'; ctx.beginPath(); ctx.arc(x, y, Math.max(1.5, L.s * 0.22), 0, 7); ctx.fill(); ctx.fillStyle = 'rgba(255,220,160,.5)'; ctx.beginPath(); ctx.arc(x - 0.5, y - 0.5, Math.max(0.6, L.s * 0.08), 0, 7); ctx.fill(); }
  // trứng đang ấp
  if (t.breeding) {
    const moss = t.deco.find((d) => DECO[d.type]?.plant) || { x: tankDims(t).W / 2 };
    const [mx] = toPx(L, moss.x, 0); const gy = groundY(L);
    const prog = clamp((now() - t.breeding.start) / (t.breeding.end - t.breeding.start), 0, 1);
    for (let i = 0; i < 9; i++) { const x = mx + (hash01(t.id, i) - 0.5) * L.s * 6, y = gy - L.s * 1.5 - hash01(t.id, i + 9) * L.s * 2; ctx.fillStyle = `rgba(255,240,200,${0.5 + prog * 0.4})`; ctx.beginPath(); ctx.arc(x, y, Math.max(1.5, L.s * 0.28), 0, 7); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,.7)'; ctx.beginPath(); ctx.arc(x - 1, y - 1, 1, 0, 7); ctx.fill(); }
  }
}

function drawGlassFront(ctx, t, L) {
  const al = t.water.algae / 100;
  if (al > 0.05) {
    ctx.save(); ctx.beginPath(); ctx.rect(L.x, L.y, L.w, L.h); ctx.clip();
    const gL = ctx.createLinearGradient(L.x, 0, L.x + L.w * 0.25, 0); gL.addColorStop(0, `rgba(60,140,60,${al * 0.75})`); gL.addColorStop(1, 'rgba(60,140,60,0)');
    ctx.fillStyle = gL; ctx.fillRect(L.x, L.y, L.w * 0.25, L.h);
    const gR = ctx.createLinearGradient(L.x + L.w, 0, L.x + L.w * 0.75, 0); gR.addColorStop(0, `rgba(60,140,60,${al * 0.75})`); gR.addColorStop(1, 'rgba(60,140,60,0)');
    ctx.fillStyle = gR; ctx.fillRect(L.x + L.w * 0.75, L.y, L.w * 0.25, L.h);
    ctx.fillStyle = `rgba(70,150,60,${al * 0.5})`;
    for (let i = 0; i < 40 * al; i++) { ctx.beginPath(); ctx.arc(L.x + hash01(t.id, i + 300) * L.w, L.y + hash01(t.id, i + 400) * L.h, 2 + hash01(t.id, i + 500) * 8, 0, 7); ctx.fill(); }
    ctx.restore();
  }
  // mặt nước
  ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.lineWidth = 2; ctx.beginPath();
  for (let x = 0; x <= L.w; x += 8) ctx.lineTo(L.x + x, L.y + 2 + Math.sin(x * 0.04 + R.time * 1.5) * 1.5);
  ctx.stroke();
  // phản chiếu kính
  const g = ctx.createLinearGradient(L.x, L.y, L.x + L.w * 0.3, L.y + L.h);
  g.addColorStop(0, 'rgba(255,255,255,.12)'); g.addColorStop(0.3, 'rgba(255,255,255,0)');
  ctx.fillStyle = g; ctx.fillRect(L.x, L.y, L.w, L.h);
  // khung
  ctx.strokeStyle = '#2b3542'; ctx.lineWidth = 6; ctx.strokeRect(L.x - 3, L.y - 3, L.w + 6, L.h + 6);
  ctx.strokeStyle = 'rgba(255,255,255,.18)'; ctx.lineWidth = 1; ctx.strokeRect(L.x - 6, L.y - 6, L.w + 12, L.h + 12);
  // thiết bị: lọc (góc phải), sưởi (trái)
  if (t.eq.filter) { ctx.fillStyle = '#1d232c'; const fw = 8 + t.eq.filter * 5, fh = L.h * 0.35; ctx.fillRect(L.x + L.w - fw - 4, L.y - 4, fw, fh); ctx.fillStyle = '#35404f'; ctx.fillRect(L.x + L.w - fw - 2, L.y + 4, fw - 4, 6); }
  if (t.eq.heater) { ctx.fillStyle = '#1d232c'; ctx.fillRect(L.x + 6, L.y + L.h * 0.3, 5, L.h * 0.55); ctx.fillStyle = t.water.temp < t.eq.heatTemp - 0.2 ? '#ff5533' : '#334'; ctx.fillRect(L.x + 7, L.y + L.h * 0.32, 3, 4); }
}

function drawSelection(ctx, f, L, time) {
  const sp = SPECIES[f.sp]; const [x, y] = toPx(L, f.x, f.y); const r = Math.max(14, visSize(sp.size) * (0.35 + 0.65 * f.growth) * L.s * 0.6);
  ctx.strokeStyle = 'rgba(255,255,255,.85)'; ctx.setLineDash([4, 4]); ctx.lineDashOffset = -time * 20; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.stroke(); ctx.setLineDash([]);
}
function drawFishBadges(ctx, f, L) {
  const sp = SPECIES[f.sp]; const [x, y] = toPx(L, f.x, f.y); const r = Math.max(8, visSize(sp.size) * (0.35 + 0.65 * f.growth) * L.s * 0.35);
  let icon = null;
  if (f.disease) icon = '🤒'; else if (f.hunger > 75) icon = '🍽️'; else if (f.stress > 65) icon = '💢';
  if (!icon) return;
  ctx.font = '13px system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.fillText(icon, x, y - r - 4);
}

/* ── Khung hình ── */
function renderFrame(ctx, W, Hh, t, dt) {
  R.time += dt;
  const night = isNight();
  drawRoom(ctx, W, Hh, night);
  const L = R.layout; if (!L) return;
  drawTankBack(ctx, t, L, night);
  ctx.save(); ctx.beginPath(); ctx.rect(L.x, L.y, L.w, L.h); ctx.clip();
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
