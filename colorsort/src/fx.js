// ── Hiệu ứng hạt: tia lấp lánh, sóng tròn, kim tuyến ──
const parts = [];
const rings = [];

export function sparkBurst(x, y, color, n = 14, power = 1) {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2;
    const sp = (1.4 + Math.random() * 3.4) * power;
    parts.push({
      x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 1.2 * power,
      life: 1, decay: 0.016 + Math.random() * 0.02,
      r: (2 + Math.random() * 3.4) * power, color, g: 0.14, star: Math.random() < 0.4,
    });
  }
}

export function splash(x, y, color, n = 8) {
  for (let i = 0; i < n; i++) {
    const a = -Math.PI / 2 + (Math.random() - 0.5) * 2.2;
    const sp = 1.2 + Math.random() * 2.4;
    parts.push({
      x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
      life: 1, decay: 0.045, r: 1.6 + Math.random() * 2.2, color, g: 0.26, star: false,
    });
  }
}

export function ring(x, y, color, r0, r1, dur = 520) {
  rings.push({ x, y, color, r0, r1, t: 0, dur });
}

const CONFETTI = ['#ff3355', '#ffcc1a', '#2ec25f', '#2f7dff', '#ff6ec7', '#a34cf0', '#12cfd0', '#ff861a'];
export function confetti(W, H, n = 90) {
  for (let i = 0; i < n; i++) {
    parts.push({
      x: Math.random() * W, y: -20 - Math.random() * H * 0.5,
      vx: (Math.random() - 0.5) * 2.6, vy: 1.6 + Math.random() * 3.2,
      life: 1, decay: 0.0042, r: 4 + Math.random() * 6,
      color: CONFETTI[(Math.random() * CONFETTI.length) | 0],
      g: 0.05, conf: true, rot: Math.random() * 6.28, vr: (Math.random() - 0.5) * 0.3,
      sway: Math.random() * 6.28,
    });
  }
}

export function updateFx(dt) {
  const k = dt / 16.67;
  for (let i = parts.length - 1; i >= 0; i--) {
    const p = parts[i];
    p.x += p.vx * k; p.y += p.vy * k; p.vy += p.g * k;
    if (p.conf) { p.rot += p.vr * k; p.sway += 0.08 * k; p.x += Math.sin(p.sway) * 0.9 * k; }
    else { p.vx *= 0.98; }
    p.life -= p.decay * k;
    if (p.life <= 0) parts.splice(i, 1);
  }
  for (let i = rings.length - 1; i >= 0; i--) {
    rings[i].t += dt;
    if (rings[i].t >= rings[i].dur) rings.splice(i, 1);
  }
}

export function drawFx(ctx) {
  for (const rg of rings) {
    const p = rg.t / rg.dur;
    const r = rg.r0 + (rg.r1 - rg.r0) * (1 - Math.pow(1 - p, 2));
    ctx.save();
    ctx.globalAlpha = (1 - p) * 0.75;
    ctx.strokeStyle = rg.color;
    ctx.lineWidth = Math.max(1.5, 7 * (1 - p));
    ctx.beginPath(); ctx.arc(rg.x, rg.y, r, 0, 6.2832); ctx.stroke();
    ctx.restore();
  }

  for (const p of parts) {
    ctx.save();
    ctx.globalAlpha = Math.max(0, Math.min(1, p.life));
    if (p.conf) {
      ctx.translate(p.x, p.y); ctx.rotate(p.rot);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.r * 0.5, -p.r * 0.34, p.r, p.r * 0.68);
    } else if (p.star) {
      ctx.translate(p.x, p.y);
      ctx.fillStyle = p.color;
      const R = p.r * p.life * 1.9;
      ctx.beginPath();
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        const rr = i % 2 ? R * 0.34 : R;
        ctx[i ? 'lineTo' : 'moveTo'](Math.cos(a) * rr, Math.sin(a) * rr);
      }
      ctx.closePath(); ctx.fill();
    } else {
      ctx.fillStyle = p.color;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r * p.life, 0, 6.2832); ctx.fill();
    }
    ctx.restore();
  }
}

export function clearFx() { parts.length = 0; rings.length = 0; }
export const fxBusy = () => parts.length > 0;
