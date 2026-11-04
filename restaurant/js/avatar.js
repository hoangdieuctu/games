// ── Vẽ nhân vật kiểu chibi vector: dùng chung cho cô chủ (tuỳ chỉnh được),
//    khách hàng và anh đầu bếp. Không phụ thuộc state game để màn hình
//    Tủ Đồ cũng vẽ xem trước được.
//
// Thứ tự vẽ (dưới lên trên): bóng → tóc sau → chân/giày → váy → thân →
// tạp dề → tay → cổ → đầu → mặt → mái tóc → phụ kiện.

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

// viền mềm cùng tông cho ra nét vector
function outline(ctx, col, u, k) {
  ctx.strokeStyle = shade(col, k || 0.76);
  ctx.lineWidth = 1.5 * u;
  ctx.lineJoin = 'round';
  ctx.stroke();
}

function vgrad(ctx, y0, y1, top, bot) {
  const g = ctx.createLinearGradient(0, y0, 0, y1);
  g.addColorStop(0, top);
  g.addColorStop(1, bot);
  return g;
}

/* ══════════════ TÓC ══════════════ */

// phần tóc phía sau đầu và sau vai
function hairBack(ctx, x, hy, hr, look, u, shoulderY) {
  const col = look.hairColor;
  const dark = shade(col, 0.84);
  const s = look.hair;
  ctx.fillStyle = dark;

  if (s === 'long') {
    ctx.beginPath();
    ctx.moveTo(x - hr * 1.02, hy - hr * 0.5);
    ctx.quadraticCurveTo(x - hr * 1.5, hy + hr * 1.2, x - hr * 1.28, shoulderY + hr * 1.5);
    ctx.quadraticCurveTo(x - hr * 0.7, shoulderY + hr * 2.0, x, shoulderY + hr * 1.9);
    ctx.quadraticCurveTo(x + hr * 0.7, shoulderY + hr * 2.0, x + hr * 1.28, shoulderY + hr * 1.5);
    ctx.quadraticCurveTo(x + hr * 1.5, hy + hr * 1.2, x + hr * 1.02, hy - hr * 0.5);
    ctx.closePath();
    ctx.fill();
  } else if (s === 'bob') {
    ctx.beginPath();
    ctx.moveTo(x - hr * 1.04, hy - hr * 0.4);
    ctx.quadraticCurveTo(x - hr * 1.32, hy + hr * 0.9, x - hr * 0.98, hy + hr * 1.32);
    ctx.quadraticCurveTo(x, hy + hr * 1.62, x + hr * 0.98, hy + hr * 1.32);
    ctx.quadraticCurveTo(x + hr * 1.32, hy + hr * 0.9, x + hr * 1.04, hy - hr * 0.4);
    ctx.closePath();
    ctx.fill();
  } else if (s === 'pony') {
    // đuôi ngựa cao vắt sang phải
    ctx.beginPath();
    ctx.moveTo(x + hr * 0.5, hy - hr * 0.9);
    ctx.quadraticCurveTo(x + hr * 2.1, hy - hr * 0.5, x + hr * 1.75, hy + hr * 1.15);
    ctx.quadraticCurveTo(x + hr * 1.55, hy + hr * 2.0, x + hr * 0.95, hy + hr * 1.75);
    ctx.quadraticCurveTo(x + hr * 1.35, hy + hr * 0.75, x + hr * 0.62, hy - hr * 0.25);
    ctx.closePath();
    ctx.fill();
  } else if (s === 'twin') {
    for (const sg of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(x + sg * hr * 0.85, hy - hr * 0.2);
      ctx.quadraticCurveTo(x + sg * hr * 1.85, hy + hr * 0.35, x + sg * hr * 1.5, hy + hr * 1.5);
      ctx.quadraticCurveTo(x + sg * hr * 1.3, hy + hr * 2.15, x + sg * hr * 0.72, hy + hr * 1.85);
      ctx.quadraticCurveTo(x + sg * hr * 1.05, hy + hr * 0.9, x + sg * hr * 0.6, hy + hr * 0.15);
      ctx.closePath();
      ctx.fill();
    }
  }
  // khối tóc sau đầu cho mọi kiểu
  ctx.fillStyle = dark;
  ctx.beginPath();
  ctx.ellipse(x, hy - hr * 0.12, hr * 1.06, hr * 1.04, 0, 0, 7);
  ctx.fill();
}

// mái tóc phía trước + khối đỉnh đầu + vệt sáng
function hairFront(ctx, x, hy, hr, look, u) {
  const col = look.hairColor;
  const s = look.hair;
  ctx.fillStyle = col;

  // mái lệch một bên, có độ phồng
  ctx.beginPath();
  ctx.moveTo(x - hr * 1.06, hy + hr * 0.18);
  ctx.quadraticCurveTo(x - hr * 1.16, hy - hr * 1.06, x - hr * 0.1, hy - hr * 1.14);
  ctx.quadraticCurveTo(x + hr * 1.1, hy - hr * 1.2, x + hr * 1.08, hy + hr * 0.1);
  ctx.quadraticCurveTo(x + hr * 0.9, hy - hr * 0.28, x + hr * 0.34, hy - hr * 0.46);
  ctx.quadraticCurveTo(x - hr * 0.1, hy - hr * 0.06, x - hr * 0.52, hy - hr * 0.62);
  ctx.quadraticCurveTo(x - hr * 0.86, hy - hr * 0.12, x - hr * 1.06, hy + hr * 0.18);
  ctx.closePath();
  ctx.fill();

  // lọn tóc hai bên má
  ctx.fillStyle = shade(col, 0.94);
  for (const sg of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(x + sg * hr * 1.0, hy - hr * 0.35);
    ctx.quadraticCurveTo(x + sg * hr * 1.24, hy + hr * 0.45, x + sg * hr * 0.94, hy + hr * 0.92);
    ctx.quadraticCurveTo(x + sg * hr * 0.82, hy + hr * 0.3, x + sg * hr * 0.86, hy - hr * 0.3);
    ctx.closePath();
    ctx.fill();
  }

  if (s === 'bun') {
    // búi tròn trên đỉnh, có dây buộc
    ctx.fillStyle = col;
    ctx.beginPath(); ctx.ellipse(x + hr * 0.05, hy - hr * 1.44, hr * 0.5, hr * 0.44, 0.2, 0, 7); ctx.fill();
    ctx.fillStyle = shade(col, 1.18);
    ctx.beginPath(); ctx.ellipse(x - hr * 0.08, hy - hr * 1.56, hr * 0.2, hr * 0.14, 0.4, 0, 7); ctx.fill();
    ctx.strokeStyle = shade(col, 0.72);
    ctx.lineWidth = 2 * u;
    ctx.beginPath(); ctx.arc(x + hr * 0.05, hy - hr * 1.12, hr * 0.3, Math.PI * 1.15, Math.PI * 1.85); ctx.stroke();
  } else if (s === 'pony') {
    ctx.fillStyle = shade(col, 0.8);
    ctx.beginPath(); ctx.ellipse(x + hr * 0.72, hy - hr * 0.92, hr * 0.24, hr * 0.18, -0.4, 0, 7); ctx.fill();
  } else if (s === 'twin') {
    // hai nơ buộc bím
    for (const sg of [-1, 1]) {
      ctx.fillStyle = '#ff6f9c';
      ctx.beginPath(); ctx.ellipse(x + sg * hr * 0.98, hy - hr * 0.12, hr * 0.2, hr * 0.14, sg * 0.5, 0, 7); ctx.fill();
      ctx.beginPath(); ctx.ellipse(x + sg * hr * 1.2, hy + hr * 0.06, hr * 0.2, hr * 0.14, -sg * 0.5, 0, 7); ctx.fill();
      ctx.fillStyle = '#ffd0e0';
      ctx.beginPath(); ctx.arc(x + sg * hr * 1.09, hy - hr * 0.03, hr * 0.08, 0, 7); ctx.fill();
    }
  }

  // vệt sáng trên tóc
  ctx.strokeStyle = shade(col, 1.35);
  ctx.lineWidth = 2.6 * u;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x - hr * 0.52, hy - hr * 0.86);
  ctx.quadraticCurveTo(x + hr * 0.12, hy - hr * 1.12, x + hr * 0.66, hy - hr * 0.76);
  ctx.stroke();
}

/* ══════════════ MẶT ══════════════ */

function eyes(ctx, x, hy, hr, mode, u) {
  const ex = hr * 0.44, ey = hy + hr * 0.16;
  const dark = '#4a3226';
  if (mode === 'happy') {
    // mắt nhắm cong hình vòng cung
    ctx.strokeStyle = dark;
    ctx.lineWidth = Math.max(1.6, hr * 0.13);
    ctx.lineCap = 'round';
    for (const sg of [-1, 1]) {
      ctx.beginPath();
      ctx.arc(x + sg * ex, ey + hr * 0.06, hr * 0.2, Math.PI * 1.12, Math.PI * 1.88);
      ctx.stroke();
    }
    return;
  }
  const small = mode === 'sad' ? 0.86 : 1;
  for (const sg of [-1, 1]) {
    const cx = x + sg * ex;
    // lòng trắng
    ctx.fillStyle = '#fffdfa';
    ctx.beginPath(); ctx.ellipse(cx, ey, hr * 0.2 * small, hr * 0.25 * small, 0, 0, 7); ctx.fill();
    // con ngươi
    ctx.fillStyle = dark;
    ctx.beginPath(); ctx.ellipse(cx, ey + hr * 0.02, hr * 0.155 * small, hr * 0.205 * small, 0, 0, 7); ctx.fill();
    // đốm sáng
    ctx.fillStyle = 'rgba(255,255,255,.95)';
    ctx.beginPath(); ctx.arc(cx - hr * 0.06, ey - hr * 0.08, hr * 0.062, 0, 7); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.55)';
    ctx.beginPath(); ctx.arc(cx + hr * 0.06, ey + hr * 0.1, hr * 0.035, 0, 7); ctx.fill();
    // mí trên và lông mi
    ctx.strokeStyle = dark;
    ctx.lineWidth = Math.max(1.5, hr * 0.11);
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(cx, ey + hr * 0.02, hr * 0.235 * small, Math.PI * 1.08, Math.PI * 1.92);
    ctx.stroke();
    ctx.lineWidth = Math.max(1.2, hr * 0.075);
    ctx.beginPath();
    ctx.moveTo(cx + sg * hr * 0.2, ey - hr * 0.16);
    ctx.lineTo(cx + sg * hr * 0.34, ey - hr * 0.28);
    ctx.stroke();
  }
  // chân mày
  ctx.strokeStyle = 'rgba(90,64,48,.7)';
  ctx.lineWidth = Math.max(1.3, hr * 0.082);
  for (const sg of [-1, 1]) {
    ctx.beginPath();
    if (mode === 'sad') {
      ctx.moveTo(x + sg * hr * 0.26, ey - hr * 0.42);
      ctx.lineTo(x + sg * hr * 0.62, ey - hr * 0.56);
    } else {
      ctx.arc(x + sg * ex, ey - hr * 0.3, hr * 0.22, Math.PI * 1.18, Math.PI * 1.82);
    }
    ctx.stroke();
  }
}

function mouth(ctx, x, hy, hr, mode, u) {
  const my = hy + hr * 0.62;
  if (mode === 'happy') {
    // miệng cười tươi có lưỡi hồng
    ctx.fillStyle = '#c2506a';
    ctx.beginPath();
    ctx.moveTo(x - hr * 0.24, my - hr * 0.04);
    ctx.quadraticCurveTo(x, my + hr * 0.32, x + hr * 0.24, my - hr * 0.04);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#ff9db4';
    ctx.beginPath();
    ctx.moveTo(x - hr * 0.1, my + hr * 0.12);
    ctx.quadraticCurveTo(x, my + hr * 0.3, x + hr * 0.1, my + hr * 0.12);
    ctx.closePath();
    ctx.fill();
    return;
  }
  ctx.strokeStyle = '#c2506a';
  ctx.lineWidth = Math.max(1.5, hr * 0.1);
  ctx.lineCap = 'round';
  ctx.beginPath();
  if (mode === 'sad') ctx.arc(x, my + hr * 0.3, hr * 0.2, Math.PI * 1.2, Math.PI * 1.8);
  else if (mode === 'flat') { ctx.moveTo(x - hr * 0.16, my); ctx.lineTo(x + hr * 0.16, my); }
  else ctx.arc(x, my - hr * 0.1, hr * 0.22, Math.PI * 0.18, Math.PI * 0.82);
  ctx.stroke();
}

function blush(ctx, x, hy, hr) {
  ctx.fillStyle = 'rgba(255,130,155,.34)';
  for (const sg of [-1, 1]) {
    ctx.beginPath();
    ctx.ellipse(x + sg * hr * 0.68, hy + hr * 0.46, hr * 0.19, hr * 0.12, 0, 0, 7);
    ctx.fill();
  }
}

/* ══════════════ THÂN ══════════════ */

function legs(ctx, x, y, u, skin, seated) {
  if (seated) return;
  ctx.fillStyle = shade(skin, 0.97);
  for (const sg of [-1, 1]) {
    rr(ctx, x + sg * 6.6 * u - 3.4 * u, y - 12 * u, 6.8 * u, 24 * u, 3.4 * u);
    ctx.fill();
  }
}

function shoes(ctx, x, y, u, col) {
  for (const sg of [-1, 1]) {
    const cx = x + sg * 6.8 * u;
    // quai ngang
    ctx.strokeStyle = col;
    ctx.lineWidth = 2 * u;
    ctx.beginPath();
    ctx.moveTo(cx - 4 * u, y + 8 * u); ctx.lineTo(cx + 4 * u, y + 8 * u);
    ctx.stroke();
    // mũi giày
    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.moveTo(cx - 5 * u, y + 13.6 * u);
    ctx.quadraticCurveTo(cx - 5.4 * u, y + 8.6 * u, cx - 3 * u, y + 8.4 * u);
    ctx.lineTo(cx + 3 * u, y + 8.4 * u);
    ctx.quadraticCurveTo(cx + 6.4 * u, y + 9 * u, cx + 6 * u, y + 13.6 * u);
    ctx.closePath();
    ctx.fill();
    // đế sáng
    ctx.fillStyle = shade(col, 1.5);
    ctx.beginPath();
    ctx.ellipse(cx + 0.4 * u, y + 13.8 * u, 5.6 * u, 1.7 * u, 0, 0, 7);
    ctx.fill();
    // ánh sáng trên mũi giày
    ctx.fillStyle = 'rgba(255,255,255,.3)';
    ctx.beginPath();
    ctx.ellipse(cx - 1.6 * u, y + 10 * u, 2 * u, 1.1 * u, -0.3, 0, 7);
    ctx.fill();
  }
}

function arms(ctx, x, shoulderY, u, skin, dcol, swing, dress) {
  const handY = shoulderY + 27 * u;
  for (const sg of [-1, 1]) {
    const sw = sg === 1 ? swing : -swing;
    const sx = x + sg * 14 * u;
    const ex = x + sg * (16.5 * u + sw * 2 * u);
    const ey = handY + sw * 3 * u;
    // cánh tay thon, hơi cong vào thân
    ctx.strokeStyle = shade(skin, 0.97);
    ctx.lineWidth = 4.6 * u;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(sx + sg * 1.5 * u, shoulderY + 5 * u);
    ctx.quadraticCurveTo(x + sg * 19 * u, shoulderY + 15 * u, ex, ey);
    ctx.stroke();
    // bàn tay
    ctx.fillStyle = shade(skin, 0.97);
    ctx.beginPath(); ctx.arc(ex, ey + 1.6 * u, 3.4 * u, 0, 7); ctx.fill();
    // tay áo
    if (dress === 'suit') {
      ctx.strokeStyle = shade(dcol, 0.94);
      ctx.lineWidth = 6.6 * u;
      ctx.beginPath();
      ctx.moveTo(sx + sg * 1.5 * u, shoulderY + 5 * u);
      ctx.quadraticCurveTo(x + sg * 19 * u, shoulderY + 13 * u, ex - sg * 0.5 * u, ey - 4 * u);
      ctx.stroke();
    } else if (dress === 'aodai') {
      ctx.strokeStyle = dcol;
      ctx.lineWidth = 6.2 * u;
      ctx.beginPath();
      ctx.moveTo(sx + sg * 1.2 * u, shoulderY + 4 * u);
      ctx.quadraticCurveTo(x + sg * 18 * u, shoulderY + 12 * u, ex - sg * 1 * u, ey - 6 * u);
      ctx.stroke();
    } else {
      ctx.fillStyle = dcol;
      ctx.beginPath();
      ctx.ellipse(sx + sg * 1.4 * u, shoulderY + 4.5 * u, 5 * u, 5.6 * u, sg * 0.3, 0, 7);
      ctx.fill();
      outline(ctx, dcol, u, 0.84);
    }
  }
}

// thân + váy theo từng kiểu trang phục
function outfit(ctx, x, by, u, look, o) {
  const dcol = look.dressColor;
  const dress = look.dress;
  const shoulderY = by - 42 * u;
  const waistY = by - 16 * u;
  const hemY = by + 1 * u;
  const light = shade(dcol, 1.1), deep = shade(dcol, 0.86);

  if (dress === 'aodai') {
    // ống quần lụa trắng
    ctx.fillStyle = '#fdf7ee';
    for (const sg of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(x + sg * 1.6 * u, waistY + 2 * u);
      ctx.lineTo(x + sg * 11.5 * u, waistY + 2 * u);
      ctx.quadraticCurveTo(x + sg * 12.5 * u, by + 6 * u, x + sg * 10 * u, by + 13 * u);
      ctx.lineTo(x + sg * 2 * u, by + 13 * u);
      ctx.closePath();
      ctx.fill();
    }
    ctx.strokeStyle = 'rgba(190,160,130,.4)';
    ctx.lineWidth = 1.1 * u;
    ctx.beginPath(); ctx.moveTo(x, waistY + 3 * u); ctx.lineTo(x, by + 12 * u); ctx.stroke();

    // thân áo bó, hai tà dài xẻ từ hông
    ctx.fillStyle = vgrad(ctx, shoulderY, by + 8 * u, light, deep);
    ctx.beginPath();
    ctx.moveTo(x - 14.5 * u, shoulderY - 1 * u);
    ctx.quadraticCurveTo(x - 16 * u, waistY - 12 * u, x - 11 * u, waistY - 2 * u);
    ctx.quadraticCurveTo(x - 11 * u, by + 2 * u, x - 8.5 * u, by + 7 * u);
    ctx.quadraticCurveTo(x - 4.5 * u, by + 3 * u, x - 1.6 * u, by + 6 * u);
    ctx.lineTo(x - 1.6 * u, waistY);
    ctx.lineTo(x + 1.6 * u, waistY);
    ctx.lineTo(x + 1.6 * u, by + 6 * u);
    ctx.quadraticCurveTo(x + 4.5 * u, by + 3 * u, x + 8.5 * u, by + 7 * u);
    ctx.quadraticCurveTo(x + 11 * u, by + 2 * u, x + 11 * u, waistY - 2 * u);
    ctx.quadraticCurveTo(x + 16 * u, waistY - 12 * u, x + 14.5 * u, shoulderY - 1 * u);
    ctx.closePath();
    ctx.fill();
    outline(ctx, dcol, u, 0.78);

    // nẹp giữa, cổ đứng và dải thắt lưng
    ctx.strokeStyle = shade(dcol, 0.76);
    ctx.lineWidth = 1.3 * u;
    ctx.beginPath();
    ctx.moveTo(x + 2 * u, shoulderY + 3 * u);
    ctx.lineTo(x + 2 * u, waistY - 1 * u);
    ctx.stroke();
    ctx.fillStyle = '#fffdf8';
    rr(ctx, x - 5.5 * u, shoulderY - 5 * u, 11 * u, 7 * u, 2.6 * u); ctx.fill();
    ctx.strokeStyle = shade(dcol, 0.8);
    ctx.lineWidth = 1.1 * u;
    rr(ctx, x - 5.5 * u, shoulderY - 5 * u, 11 * u, 7 * u, 2.6 * u); ctx.stroke();
    ctx.fillStyle = shade(dcol, 0.72);
    rr(ctx, x - 11.5 * u, waistY - 5 * u, 23 * u, 3.6 * u, 1.8 * u); ctx.fill();
    return { shoulderY };
  }

  if (dress === 'suit') {
    // chân váy bút chì
    ctx.fillStyle = deep;
    rr(ctx, x - 14 * u, waistY - 2 * u, 28 * u, 24 * u, 5 * u); ctx.fill();
    // áo sơ mi
    ctx.fillStyle = '#fffdf8';
    rr(ctx, x - 9 * u, shoulderY, 18 * u, 30 * u, 4 * u); ctx.fill();
    // vest
    ctx.fillStyle = vgrad(ctx, shoulderY, waistY + 6 * u, light, deep);
    ctx.beginPath();
    ctx.moveTo(x - 16 * u, shoulderY - 1 * u);
    ctx.lineTo(x - 8 * u, shoulderY - 1 * u);
    ctx.lineTo(x - 2 * u, shoulderY + 13 * u);
    ctx.lineTo(x - 6 * u, waistY + 8 * u);
    ctx.lineTo(x - 15 * u, waistY + 6 * u);
    ctx.closePath(); ctx.fill();
    ctx.beginPath();
    ctx.moveTo(x + 16 * u, shoulderY - 1 * u);
    ctx.lineTo(x + 8 * u, shoulderY - 1 * u);
    ctx.lineTo(x + 2 * u, shoulderY + 13 * u);
    ctx.lineTo(x + 6 * u, waistY + 8 * u);
    ctx.lineTo(x + 15 * u, waistY + 6 * u);
    ctx.closePath(); ctx.fill();
    // cà vạt
    ctx.fillStyle = '#e0485f';
    ctx.beginPath();
    ctx.moveTo(x, shoulderY + 2 * u);
    ctx.lineTo(x + 3.4 * u, shoulderY + 8 * u);
    ctx.lineTo(x, shoulderY + 22 * u);
    ctx.lineTo(x - 3.4 * u, shoulderY + 8 * u);
    ctx.closePath(); ctx.fill();
    return { shoulderY };
  }

  // classic & flare: thân bó + chân váy xoè
  const flare = dress === 'flare';
  ctx.fillStyle = vgrad(ctx, shoulderY, waistY, light, dcol);
  ctx.beginPath();
  ctx.moveTo(x - 15.5 * u, shoulderY - 1 * u);
  ctx.quadraticCurveTo(x - 17 * u, waistY - 12 * u, x - 12.5 * u, waistY + 1 * u);
  ctx.lineTo(x + 12.5 * u, waistY + 1 * u);
  ctx.quadraticCurveTo(x + 17 * u, waistY - 12 * u, x + 15.5 * u, shoulderY - 1 * u);
  ctx.closePath();
  ctx.fill();
  outline(ctx, dcol, u, 0.8);

  const spread = flare ? 25 * u : 20 * u;
  ctx.fillStyle = vgrad(ctx, waistY, hemY + 4 * u, dcol, deep);
  ctx.beginPath();
  ctx.moveTo(x - 12.5 * u, waistY - 1 * u);
  ctx.quadraticCurveTo(x - spread * 0.9, hemY - 6 * u, x - spread, hemY + 2 * u);
  if (flare) {
    // gấu váy lượn sóng
    for (let i = 0; i < 4; i++) {
      const x0 = x - spread + (i * spread * 2) / 4;
      const x1 = x - spread + ((i + 1) * spread * 2) / 4;
      ctx.quadraticCurveTo((x0 + x1) / 2, hemY + 9 * u, x1, hemY + 2 * u);
    }
  } else {
    ctx.lineTo(x + spread, hemY + 2 * u);
  }
  ctx.quadraticCurveTo(x + spread * 0.9, hemY - 6 * u, x + 12.5 * u, waistY - 1 * u);
  ctx.closePath();
  ctx.fill();
  outline(ctx, dcol, u, 0.8);

  // nếp gấp váy
  ctx.strokeStyle = shade(dcol, 0.82);
  ctx.lineWidth = 1.3 * u;
  for (const t of [-0.5, 0, 0.5]) {
    ctx.beginPath();
    ctx.moveTo(x + t * 10 * u, waistY + 2 * u);
    ctx.lineTo(x + t * spread * 1.5, hemY - 1 * u);
    ctx.stroke();
  }

  // cổ áo chữ V và thắt lưng
  ctx.fillStyle = 'rgba(255,255,255,.9)';
  ctx.beginPath();
  ctx.moveTo(x - 8 * u, shoulderY - 1 * u);
  ctx.quadraticCurveTo(x, shoulderY + 10 * u, x + 8 * u, shoulderY - 1 * u);
  ctx.quadraticCurveTo(x, shoulderY + 4 * u, x - 8 * u, shoulderY - 1 * u);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = shade(dcol, 0.7);
  rr(ctx, x - 13 * u, waistY - 4 * u, 26 * u, 4.2 * u, 2 * u); ctx.fill();
  if (flare) {
    ctx.fillStyle = shade(dcol, 1.3);
    ctx.beginPath(); ctx.ellipse(x - 3 * u, waistY - 2 * u, 3.4 * u, 2.6 * u, -0.5, 0, 7); ctx.fill();
    ctx.beginPath(); ctx.ellipse(x + 3 * u, waistY - 2 * u, 3.4 * u, 2.6 * u, 0.5, 0, 7); ctx.fill();
  }
  return { shoulderY };
}

function apron(ctx, x, by, u, look) {
  const ap = look.apron;
  if (!ap || ap === 'none') return;
  const shoulderY = by - 42 * u;
  const waistY = by - 16 * u;
  const base = ap === 'pink' ? '#ffd0e2' : ap === 'gold' ? '#fff6dc' : '#fffdf8';

  // yếm
  ctx.fillStyle = base;
  ctx.beginPath();
  ctx.moveTo(x - 7.5 * u, shoulderY + 3 * u);
  ctx.lineTo(x + 7.5 * u, shoulderY + 3 * u);
  ctx.lineTo(x + 9.5 * u, waistY - 1 * u);
  ctx.lineTo(x - 9.5 * u, waistY - 1 * u);
  ctx.closePath();
  ctx.fill();
  // thân tạp dề
  ctx.beginPath();
  ctx.moveTo(x - 10 * u, waistY - 1 * u);
  ctx.quadraticCurveTo(x - 15 * u, by - 2 * u, x - 12.5 * u, by + 4 * u);
  ctx.quadraticCurveTo(x, by + 9 * u, x + 12.5 * u, by + 4 * u);
  ctx.quadraticCurveTo(x + 15 * u, by - 2 * u, x + 10 * u, waistY - 1 * u);
  ctx.closePath();
  ctx.fill();
  // dây vai
  ctx.strokeStyle = base;
  ctx.lineWidth = 2.6 * u;
  for (const sg of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(x + sg * 6 * u, shoulderY + 3 * u);
    ctx.quadraticCurveTo(x + sg * 12 * u, shoulderY - 1 * u, x + sg * 13 * u, shoulderY + 5 * u);
    ctx.stroke();
  }
  // hoạ tiết
  if (ap === 'check') {
    ctx.save();
    ctx.beginPath();
    ctx.rect(x - 13 * u, shoulderY + 3 * u, 26 * u, by + 8 * u - shoulderY);
    ctx.clip();
    ctx.strokeStyle = 'rgba(232,110,140,.45)';
    ctx.lineWidth = 1.4 * u;
    for (let i = -3; i <= 3; i++) {
      ctx.beginPath(); ctx.moveTo(x + i * 4.5 * u, shoulderY + 3 * u); ctx.lineTo(x + i * 4.5 * u, by + 8 * u); ctx.stroke();
    }
    for (let j = 0; j < 8; j++) {
      const yy = shoulderY + 5 * u + j * 5 * u;
      ctx.beginPath(); ctx.moveTo(x - 14 * u, yy); ctx.lineTo(x + 14 * u, yy); ctx.stroke();
    }
    ctx.restore();
  } else if (ap === 'gold') {
    ctx.strokeStyle = '#e8b73c';
    ctx.lineWidth = 1.8 * u;
    ctx.beginPath();
    ctx.moveTo(x - 10 * u, waistY - 1 * u);
    ctx.quadraticCurveTo(x - 15 * u, by - 2 * u, x - 12.5 * u, by + 4 * u);
    ctx.quadraticCurveTo(x, by + 9 * u, x + 12.5 * u, by + 4 * u);
    ctx.quadraticCurveTo(x + 15 * u, by - 2 * u, x + 10 * u, waistY - 1 * u);
    ctx.stroke();
  }
  // nơ thắt lưng
  ctx.fillStyle = shade(base, 0.93);
  rr(ctx, x - 11 * u, waistY - 4 * u, 22 * u, 4 * u, 2 * u); ctx.fill();
  ctx.strokeStyle = 'rgba(150,110,90,.22)';
  ctx.lineWidth = 1.1 * u;
  ctx.beginPath();
  ctx.moveTo(x - 10 * u, waistY - 1 * u);
  ctx.quadraticCurveTo(x - 15 * u, by - 2 * u, x - 12.5 * u, by + 4 * u);
  ctx.quadraticCurveTo(x, by + 9 * u, x + 12.5 * u, by + 4 * u);
  ctx.quadraticCurveTo(x + 15 * u, by - 2 * u, x + 10 * u, waistY - 1 * u);
  ctx.stroke();
}

/* ══════════════ PHỤ KIỆN ══════════════ */

function accessory(ctx, x, hy, hr, look, u) {
  const a = look.acc;
  if (!a || a === 'none') return;
  if (a === 'glasses') {
    ctx.strokeStyle = 'rgba(80,58,66,.9)';
    ctx.lineWidth = Math.max(1.5, hr * 0.09);
    for (const sg of [-1, 1]) {
      ctx.beginPath();
      ctx.ellipse(x + sg * hr * 0.44, hy + hr * 0.18, hr * 0.3, hr * 0.27, 0, 0, 7);
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.moveTo(x - hr * 0.14, hy + hr * 0.16); ctx.lineTo(x + hr * 0.14, hy + hr * 0.16);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,.5)';
    ctx.lineWidth = hr * 0.07;
    ctx.beginPath();
    ctx.moveTo(x - hr * 0.6, hy + hr * 0.06); ctx.lineTo(x - hr * 0.44, hy - hr * 0.02);
    ctx.stroke();
    return;
  }
  if (a === 'chef') {
    // mũ đầu bếp phồng
    ctx.fillStyle = '#fffdf8';
    ctx.beginPath(); ctx.ellipse(x - hr * 0.5, hy - hr * 1.32, hr * 0.44, hr * 0.38, 0, 0, 7); ctx.fill();
    ctx.beginPath(); ctx.ellipse(x + hr * 0.5, hy - hr * 1.32, hr * 0.44, hr * 0.38, 0, 0, 7); ctx.fill();
    ctx.beginPath(); ctx.ellipse(x, hy - hr * 1.52, hr * 0.5, hr * 0.44, 0, 0, 7); ctx.fill();
    rr(ctx, x - hr * 0.9, hy - hr * 1.18, hr * 1.8, hr * 0.34, hr * 0.15); ctx.fill();
    ctx.strokeStyle = 'rgba(190,160,130,.35)';
    ctx.lineWidth = 1.2 * u;
    rr(ctx, x - hr * 0.9, hy - hr * 1.18, hr * 1.8, hr * 0.34, hr * 0.15); ctx.stroke();
    return;
  }
  if (a === 'crown') {
    const cy = hy - hr * 1.16;
    ctx.fillStyle = '#ffd34d';
    ctx.beginPath();
    ctx.moveTo(x - hr * 0.66, cy + hr * 0.24);
    ctx.lineTo(x - hr * 0.66, cy - hr * 0.34);
    ctx.lineTo(x - hr * 0.33, cy + hr * 0.02);
    ctx.lineTo(x, cy - hr * 0.46);
    ctx.lineTo(x + hr * 0.33, cy + hr * 0.02);
    ctx.lineTo(x + hr * 0.66, cy - hr * 0.34);
    ctx.lineTo(x + hr * 0.66, cy + hr * 0.24);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#e8a92c';
    rr(ctx, x - hr * 0.68, cy + hr * 0.16, hr * 1.36, hr * 0.14, hr * 0.06); ctx.fill();
    ctx.fillStyle = '#ff6f9c';
    ctx.beginPath(); ctx.arc(x, cy + hr * 0.02, hr * 0.09, 0, 7); ctx.fill();
    return;
  }
  if (a === 'bow') {
    const bx = x + hr * 0.82, by2 = hy - hr * 0.92;
    ctx.fillStyle = '#ff6f9c';
    ctx.beginPath(); ctx.ellipse(bx - hr * 0.22, by2, hr * 0.24, hr * 0.17, -0.4, 0, 7); ctx.fill();
    ctx.beginPath(); ctx.ellipse(bx + hr * 0.22, by2, hr * 0.24, hr * 0.17, 0.4, 0, 7); ctx.fill();
    ctx.fillStyle = '#ffc2d6';
    ctx.beginPath(); ctx.arc(bx, by2, hr * 0.1, 0, 7); ctx.fill();
    return;
  }
  if (a === 'flower') {
    const fx = x + hr * 0.86, fy = hy - hr * 0.86;
    ctx.fillStyle = '#ff8fb5';
    for (let i = 0; i < 5; i++) {
      const an = (i / 5) * Math.PI * 2;
      ctx.beginPath();
      ctx.ellipse(fx + Math.cos(an) * hr * 0.17, fy + Math.sin(an) * hr * 0.17, hr * 0.13, hr * 0.1, an, 0, 7);
      ctx.fill();
    }
    ctx.fillStyle = '#ffe07a';
    ctx.beginPath(); ctx.arc(fx, fy, hr * 0.1, 0, 7); ctx.fill();
  }
}

/* ══════════════ VẼ TRỌN NHÂN VẬT ══════════════ */
// (x, y) là chỗ chân đứng; u là đơn vị phóng

export function drawPerson(ctx, x, y, u, look, o) {
  o = o || {};
  const seated = !!o.seated;
  const bob = o.bob || 0;
  const by = y - bob;
  const skin = look.skin || '#ffdfc4';
  const hr = 20 * u;
  const hy = by - 64 * u;
  const swing = o.swing || 0;

  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  if (!seated) {
    ctx.fillStyle = 'rgba(110,70,40,.2)';
    ctx.beginPath();
    ctx.ellipse(x, y + 15 * u, 24 * u, 7 * u, 0, 0, 7);
    ctx.fill();
  }

  hairBack(ctx, x, hy, hr, look, u, by - 42 * u);
  legs(ctx, x, y, u, skin, seated);
  if (!seated) shoes(ctx, x, y, u, o.shoe || shade(look.dressColor, 0.68));

  const { shoulderY } = outfit(ctx, x, by, u, look, o);
  apron(ctx, x, by, u, look);
  arms(ctx, x, shoulderY, u, skin, look.dressColor, swing, look.dress);

  // cổ
  ctx.fillStyle = shade(skin, 0.93);
  rr(ctx, x - 4.6 * u, hy + hr * 0.72, 9.2 * u, 9 * u, 3 * u);
  ctx.fill();

  // đầu
  ctx.fillStyle = shade(skin, 0.95);
  for (const sg of [-1, 1]) {
    ctx.beginPath();
    ctx.ellipse(x + sg * hr * 0.97, hy + hr * 0.22, hr * 0.16, hr * 0.2, 0, 0, 7);
    ctx.fill();
  }
  ctx.fillStyle = skin;
  ctx.beginPath();
  ctx.ellipse(x, hy, hr * 0.97, hr, 0, 0, 7);
  ctx.fill();
  ctx.strokeStyle = shade(skin, 0.9);
  ctx.lineWidth = 1.1 * u;
  ctx.stroke();

  const mood = o.mood == null ? 1 : o.mood;
  const mode = o.happy ? 'happy' : mood < 0.28 ? 'sad' : mood < 0.62 ? 'flat' : 'calm';
  blush(ctx, x, hy, hr);
  eyes(ctx, x, hy, hr, mode === 'flat' ? 'calm' : mode, u);
  mouth(ctx, x, hy, hr, mode, u);
  hairFront(ctx, x, hy, hr, look, u);
  accessory(ctx, x, hy, hr, look, u);

  // giọt mồ hôi khi sắp hết kiên nhẫn
  if (mode === 'sad') {
    ctx.fillStyle = 'rgba(120,190,255,.9)';
    ctx.beginPath();
    ctx.ellipse(x + hr * 1.05, hy - hr * 0.5, hr * 0.13, hr * 0.18, 0.3, 0, 7);
    ctx.fill();
  }
}

// chiều cao ước lượng của nhân vật (để canh khung xem trước)
export const PERSON_H = 100;
