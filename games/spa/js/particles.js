// ── Hạt hiệu ứng: lấp lánh, xu bay, hơi nước, khói, tim, chữ nổi ──

import { G } from './state.js';
import { bump } from './ui.js';

export function spark(x, y) {
  G.particles.push({ t: 'spark', x, y, vx: (Math.random() - 0.5) * 60, vy: -40 - Math.random() * 60, life: 0.7, max: 0.7, sz: (4 + Math.random() * 5) * G.K, hue: 45 + Math.random() * 20 });
}
export function coin(x, y) {
  // bay về thanh TỔNG ở giữa phía trên
  G.particles.push({ t: 'coin', x, y, sx: x, sy: y, life: 0.75, max: 0.75, dx: G.W * 0.44, dy: 34 });
}
export function steam(x, y) {
  G.particles.push({ t: 'steam', x, y, vx: (Math.random() - 0.5) * 14, vy: -34 - Math.random() * 24, life: 1.6, max: 1.6, sz: (9 + Math.random() * 9) * G.K });
}
export function puff(x, y, col) {
  for (let i = 0; i < 8; i++)
    G.particles.push({ t: 'puff', x: x + (Math.random() - 0.5) * 30 * G.K, y: y + (Math.random() - 0.5) * 30 * G.K, vx: (Math.random() - 0.5) * 80, vy: (Math.random() - 0.5) * 80 - 20, life: 0.6, max: 0.6, sz: (8 + Math.random() * 10) * G.K, col });
}
export function heartPop(x, y) {
  G.particles.push({ t: 'heart', x, y, vx: (Math.random() - 0.5) * 40, vy: -70 - Math.random() * 40, life: 1, max: 1, sz: (10 + Math.random() * 6) * G.K });
}
export function textPop(x, y, txt, size) {
  G.particles.push({ t: 'text', x, y, vx: 0, vy: -46, life: 1.15, max: 1.15, txt, sz: (size || 22) * G.K });
}

export function updateParticles(dt) {
  for (const p of G.particles) {
    p.life -= dt;
    if (p.t === 'coin') {
      const k = 1 - p.life / p.max;
      const e = k * k * (3 - 2 * k);
      p.x = p.sx + (p.dx - p.sx) * e;
      p.y = p.sy + (p.dy - p.sy) * e - Math.sin(k * Math.PI) * 60 * G.K;
      if (p.life <= 0) bump('money-pill');
    } else {
      p.x += (p.vx || 0) * dt * G.K;
      p.y += (p.vy || 0) * dt * G.K;
      if (p.t === 'spark') p.vy += 130 * dt;
    }
  }
  G.particles = G.particles.filter(p => p.life > 0);
}

export function drawHeart(ctx, x, y, s, col) {
  ctx.fillStyle = col;
  ctx.beginPath();
  ctx.moveTo(x, y + s * 0.32);
  ctx.bezierCurveTo(x, y, x - s * 0.55, y - s * 0.1, x - s * 0.55, y + s * 0.22);
  ctx.bezierCurveTo(x - s * 0.55, y + s * 0.55, x - s * 0.15, y + s * 0.75, x, y + s * 0.95);
  ctx.bezierCurveTo(x + s * 0.15, y + s * 0.75, x + s * 0.55, y + s * 0.55, x + s * 0.55, y + s * 0.22);
  ctx.bezierCurveTo(x + s * 0.55, y - s * 0.1, x, y, x, y + s * 0.32);
  ctx.fill();
}

export function drawParticles() {
  const { ctx, K } = G;
  for (const p of G.particles) {
    const a = Math.max(0, p.life / p.max);
    if (p.t === 'spark') {
      ctx.save();
      ctx.globalAlpha = a;
      ctx.fillStyle = `hsl(${p.hue}, 100%, 62%)`;
      ctx.translate(p.x, p.y);
      ctx.rotate(p.life * 6);
      const s = p.sz * a;
      ctx.beginPath();
      for (let i = 0; i < 4; i++) {
        ctx.rotate(Math.PI / 2);
        ctx.moveTo(0, 0); ctx.lineTo(s * 0.28, s * 0.28); ctx.lineTo(0, s); ctx.lineTo(-s * 0.28, s * 0.28);
      }
      ctx.fill();
      ctx.restore();
    } else if (p.t === 'coin') {
      ctx.globalAlpha = 1;
      ctx.font = `${22 * K}px sans-serif`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('🪙', p.x, p.y);
    } else if (p.t === 'steam') {
      ctx.globalAlpha = a * 0.4;
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.arc(p.x, p.y, p.sz * (1.4 - a * 0.4), 0, 7); ctx.fill();
    } else if (p.t === 'puff') {
      ctx.globalAlpha = a * 0.6;
      ctx.fillStyle = p.col;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.sz * (1.3 - a * 0.3), 0, 7); ctx.fill();
    } else if (p.t === 'heart') {
      ctx.globalAlpha = a;
      drawHeart(ctx, p.x, p.y, p.sz, '#ff5f8f');
    } else if (p.t === 'text') {
      ctx.globalAlpha = Math.min(1, a * 2);
      ctx.font = `800 ${p.sz}px 'Baloo 2', sans-serif`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.lineWidth = 5 * K; ctx.strokeStyle = 'rgba(255,255,255,.9)';
      ctx.strokeText(p.txt, p.x, p.y);
      ctx.fillStyle = '#c2557a';
      ctx.fillText(p.txt, p.x, p.y);
    }
  }
  ctx.globalAlpha = 1;
}
