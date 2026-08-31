// ── Vẽ nhân vật: dùng chung cho cô chủ (tuỳ chỉnh được) và cho khách ──
// Không phụ thuộc state game để màn hình Tủ Đồ cũng vẽ xem trước được.

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function shade(hex, k) {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.max(0, Math.min(255, ((n >> 16) & 255) * k));
  const g = Math.max(0, Math.min(255, ((n >> 8) & 255) * k));
  const b = Math.max(0, Math.min(255, (n & 255) * k));
  return `rgb(${r | 0},${g | 0},${b | 0})`;
}

/* ── tóc ── */

function hairBack(ctx, x, hy, hr, look, u) {
  ctx.fillStyle = look.hairColor;
  const s = look.hair;
  if (s === 'long') {
    rr(ctx, x - hr * 1.12, hy - hr * 0.5, hr * 2.24, hr * 2.7, hr * 0.75);
    ctx.fill();
  } else if (s === 'bob') {
    rr(ctx, x - hr * 1.1, hy - hr * 0.5, hr * 2.2, hr * 1.75, hr * 0.8);
    ctx.fill();
  } else if (s === 'pony') {
    ctx.beginPath();
    ctx.ellipse(x + hr * 1.05, hy + hr * 0.55, hr * 0.42, hr * 1.0, -0.25, 0, 7);
    ctx.fill();
  } else if (s === 'twin') {
    for (const sg of [-1, 1]) {
      ctx.beginPath();
      ctx.ellipse(x + sg * hr * 1.02, hy + hr * 0.62, hr * 0.36, hr * 0.85, 0, 0, 7);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(x + sg * hr * 1.02, hy + hr * 1.42, hr * 0.28, 0, 7);
      ctx.fill();
    }
  }
}

function hairFront(ctx, x, hy, hr, look, u) {
  ctx.fillStyle = look.hairColor;
  // mái tóc ôm đỉnh đầu, dùng cho mọi kiểu
  ctx.beginPath();
  ctx.arc(x, hy - hr * 0.25, hr * 1.03, Math.PI * 1.02, -Math.PI * 0.02);
  ctx.fill();
  const s = look.hair;
  if (s === 'bun') {
    ctx.beginPath(); ctx.arc(x, hy - hr * 1.24, hr * 0.44, 0, 7); ctx.fill();
    ctx.strokeStyle = shade(look.hairColor, 0.75);
    ctx.lineWidth = hr * 0.09;
    ctx.beginPath(); ctx.arc(x, hy - hr * 1.24, hr * 0.44, Math.PI * 0.15, Math.PI * 0.85); ctx.stroke();
  } else if (s === 'pony') {
    ctx.beginPath(); ctx.arc(x + hr * 0.86, hy - hr * 0.42, hr * 0.24, 0, 7); ctx.fill();
  } else if (s === 'twin') {
    for (const sg of [-1, 1]) {
      ctx.beginPath(); ctx.arc(x + sg * hr * 0.92, hy - hr * 0.3, hr * 0.26, 0, 7); ctx.fill();
    }
  }
}

/* ── phụ kiện ── */

function accessory(ctx, x, hy, hr, look, u) {
  const a = look.acc;
  if (!a || a === 'none') return;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  if (a === 'glasses') {
    ctx.strokeStyle = 'rgba(70,50,60,.85)';
    ctx.lineWidth = Math.max(1.4, hr * 0.1);
    ctx.beginPath(); ctx.arc(x - hr * 0.4, hy + hr * 0.05, hr * 0.33, 0, 7); ctx.stroke();
    ctx.beginPath(); ctx.arc(x + hr * 0.4, hy + hr * 0.05, hr * 0.33, 0, 7); ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x - hr * 0.07, hy + hr * 0.05); ctx.lineTo(x + hr * 0.07, hy + hr * 0.05);
    ctx.stroke();
    return;
  }
  if (a === 'chef') {
    ctx.fillStyle = '#fff';
    rr(ctx, x - hr * 0.72, hy - hr * 1.45, hr * 1.44, hr * 0.42, hr * 0.16); ctx.fill();
    ctx.beginPath(); ctx.arc(x - hr * 0.42, hy - hr * 1.62, hr * 0.34, 0, 7); ctx.fill();
    ctx.beginPath(); ctx.arc(x + hr * 0.42, hy - hr * 1.62, hr * 0.34, 0, 7); ctx.fill();
    ctx.beginPath(); ctx.arc(x, hy - hr * 1.78, hr * 0.42, 0, 7); ctx.fill();
    return;
  }
  const map = { flower: '🌸', bow: '🎀', crown: '👑' };
  const e = map[a];
  if (!e) return;
  ctx.font = `${hr * (a === 'crown' ? 1.15 : 0.85)}px sans-serif`;
  if (a === 'crown') ctx.fillText(e, x, hy - hr * 1.28);
  else ctx.fillText(e, x + hr * 0.78, hy - hr * 1.0);
}

/* ── khuôn mặt ── */

function face(ctx, x, hy, hr, o) {
  const mood = o.mood == null ? 1 : o.mood;
  const happy = !!o.happy;
  const lw = Math.max(1.4, hr * 0.1);
  ctx.lineCap = 'round';
  if (happy || mood > 0.85) {
    ctx.strokeStyle = '#503020'; ctx.lineWidth = lw;
    ctx.beginPath(); ctx.arc(x - hr * 0.4, hy + hr * 0.02, hr * 0.2, Math.PI * 1.15, Math.PI * 1.85); ctx.stroke();
    ctx.beginPath(); ctx.arc(x + hr * 0.4, hy + hr * 0.02, hr * 0.2, Math.PI * 1.15, Math.PI * 1.85); ctx.stroke();
  } else {
    ctx.fillStyle = '#503020';
    ctx.beginPath(); ctx.arc(x - hr * 0.4, hy + hr * 0.05, hr * 0.13, 0, 7); ctx.fill();
    ctx.beginPath(); ctx.arc(x + hr * 0.4, hy + hr * 0.05, hr * 0.13, 0, 7); ctx.fill();
  }
  ctx.fillStyle = 'rgba(255,120,150,.32)';
  ctx.beginPath(); ctx.ellipse(x - hr * 0.64, hy + hr * 0.38, hr * 0.2, hr * 0.13, 0, 0, 7); ctx.fill();
  ctx.beginPath(); ctx.ellipse(x + hr * 0.64, hy + hr * 0.38, hr * 0.2, hr * 0.13, 0, 0, 7); ctx.fill();
  ctx.strokeStyle = '#c06060'; ctx.lineWidth = lw;
  ctx.beginPath();
  if (!happy && mood < 0.28) ctx.arc(x, hy + hr * 0.74, hr * 0.24, Math.PI * 1.15, Math.PI * 1.85);
  else if (!happy && mood < 0.6) { ctx.moveTo(x - hr * 0.22, hy + hr * 0.54); ctx.lineTo(x + hr * 0.22, hy + hr * 0.54); }
  else ctx.arc(x, hy + hr * 0.38, hr * 0.26, Math.PI * 0.15, Math.PI * 0.85);
  ctx.stroke();
}

/* ── thân người ── */

function body(ctx, x, ty, u, look, o) {
  const col = look.dressColor;
  const style = look.dress;
  if (style === 'flare') {
    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.moveTo(x - 20 * u, ty);
    ctx.lineTo(x + 20 * u, ty);
    ctx.lineTo(x + 17 * u, ty + 26 * u);
    ctx.quadraticCurveTo(x + 34 * u, ty + 46 * u, x + 31 * u, ty + 60 * u);
    ctx.lineTo(x - 31 * u, ty + 60 * u);
    ctx.quadraticCurveTo(x - 34 * u, ty + 46 * u, x - 17 * u, ty + 26 * u);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.4)';
    ctx.fillRect(x - 18 * u, ty + 22 * u, 36 * u, 5 * u);
  } else if (style === 'aodai') {
    ctx.fillStyle = '#fdf6ee';
    rr(ctx, x - 16 * u, ty + 34 * u, 32 * u, 28 * u, 8 * u); ctx.fill();
    ctx.fillStyle = col;
    rr(ctx, x - 19 * u, ty, 38 * u, 62 * u, 14 * u); ctx.fill();
    ctx.fillStyle = shade(col, 0.85);
    ctx.fillRect(x - 2 * u, ty + 6 * u, 4 * u, 40 * u);
    ctx.fillStyle = 'rgba(255,255,255,.85)';
    rr(ctx, x - 9 * u, ty - 2 * u, 18 * u, 7 * u, 3 * u); ctx.fill();
  } else if (style === 'suit') {
    ctx.fillStyle = '#fff';
    rr(ctx, x - 10 * u, ty, 20 * u, 46 * u, 6 * u); ctx.fill();
    ctx.fillStyle = col;
    rr(ctx, x - 24 * u, ty, 48 * u, 60 * u, 16 * u); ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.moveTo(x - 11 * u, ty - 1 * u);
    ctx.lineTo(x, ty + 26 * u);
    ctx.lineTo(x + 11 * u, ty - 1 * u);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#e04a6a';
    ctx.beginPath();
    ctx.moveTo(x, ty + 6 * u);
    ctx.lineTo(x + 5 * u, ty + 14 * u);
    ctx.lineTo(x, ty + 30 * u);
    ctx.lineTo(x - 5 * u, ty + 14 * u);
    ctx.closePath(); ctx.fill();
  } else { // classic
    ctx.fillStyle = col;
    rr(ctx, x - 24 * u, ty, 48 * u, 60 * u, 18 * u); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.85)';
    ctx.beginPath();
    ctx.moveTo(x - 12 * u, ty);
    ctx.lineTo(x, ty + 18 * u);
    ctx.lineTo(x + 12 * u, ty);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.5)';
    ctx.fillRect(x - 24 * u, ty + 28 * u, 48 * u, 5 * u);
  }

  // tạp dề
  const ap = look.apron;
  if (ap && ap !== 'none') {
    const base = ap === 'pink' ? '#ffc3d8' : ap === 'gold' ? '#fff4d0' : '#ffffff';
    ctx.fillStyle = base;
    rr(ctx, x - 15 * u, ty + 22 * u, 30 * u, 36 * u, 9 * u); ctx.fill();
    ctx.beginPath();
    ctx.moveTo(x - 9 * u, ty + 4 * u);
    ctx.lineTo(x + 9 * u, ty + 4 * u);
    ctx.lineTo(x + 11 * u, ty + 24 * u);
    ctx.lineTo(x - 11 * u, ty + 24 * u);
    ctx.closePath(); ctx.fill();
    if (ap === 'check') {
      ctx.strokeStyle = 'rgba(230,90,120,.5)';
      ctx.lineWidth = 1.6 * u;
      for (let i = -1; i <= 1; i++) {
        ctx.beginPath();
        ctx.moveTo(x + i * 9 * u, ty + 6 * u); ctx.lineTo(x + i * 9 * u, ty + 56 * u); ctx.stroke();
      }
      for (let j = 0; j < 4; j++) {
        ctx.beginPath();
        ctx.moveTo(x - 14 * u, ty + 14 * u + j * 11 * u); ctx.lineTo(x + 14 * u, ty + 14 * u + j * 11 * u); ctx.stroke();
      }
    } else if (ap === 'gold') {
      ctx.strokeStyle = '#e8b73c'; ctx.lineWidth = 2.4 * u;
      rr(ctx, x - 15 * u, ty + 22 * u, 30 * u, 36 * u, 9 * u); ctx.stroke();
    }
    ctx.strokeStyle = 'rgba(0,0,0,.08)'; ctx.lineWidth = 1.2 * u;
    rr(ctx, x - 15 * u, ty + 22 * u, 30 * u, 36 * u, 9 * u); ctx.stroke();
  }
}

/* ── vẽ trọn một nhân vật; (x, y) là chỗ chân đứng ── */

export function drawPerson(ctx, x, y, u, look, o) {
  o = o || {};
  const bob = o.bob || 0;
  const by = y - bob;
  const ty = by - 40 * u;

  if (!o.seated) {
    ctx.fillStyle = 'rgba(120,70,40,.2)';
    ctx.beginPath(); ctx.ellipse(x, y + 22 * u, 26 * u, 8 * u, 0, 0, 7); ctx.fill();
    ctx.fillStyle = o.shoe || shade(look.dressColor, 0.72);
    ctx.beginPath(); ctx.ellipse(x - 10 * u, y + 18 * u, 8 * u, 5 * u, 0, 0, 7); ctx.fill();
    ctx.beginPath(); ctx.ellipse(x + 10 * u, y + 18 * u, 8 * u, 5 * u, 0, 0, 7); ctx.fill();
  }

  body(ctx, x, ty, u, look, o);

  const hr = 20 * u, hy = by - 58 * u;
  hairBack(ctx, x, hy, hr, look, u);
  ctx.fillStyle = look.skin || '#ffdfc4';
  ctx.beginPath(); ctx.arc(x, hy, hr, 0, 7); ctx.fill();
  hairFront(ctx, x, hy, hr, look, u);
  face(ctx, x, hy, hr, o);
  accessory(ctx, x, hy, hr, look, u);
}

// chiều cao ước lượng của nhân vật (để canh khung xem trước)
export const PERSON_H = 100;
