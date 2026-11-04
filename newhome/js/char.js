// ── Vẽ nhân vật người: đầu, tóc, áo, tay chân vung khi đi, quay mặt theo hướng ──
// Dùng chung cho canvas thế giới, ô chọn nhân vật ở màn tiêu đề và chip trong HUD.

export const LOOKS = {
  '👨': { name: 'Bố',       hair: '#3b2a1a', style: 'short',    skin: '#f3cfae', s: 1 },
  '👩': { name: 'Mẹ',       hair: '#5a3a22', style: 'long',     skin: '#f6d6b8', s: .96, dress: true },
  '👧': { name: 'Con gái',  hair: '#6b4426', style: 'pigtails', skin: '#f8dcc0', s: .76, dress: true, child: true },
  '👦': { name: 'Con trai', hair: '#2d2015', style: 'short',    skin: '#f3cfae', s: .76, child: true },
  '👴': { name: 'Ông',      hair: '#d8d8d8', style: 'short',    skin: '#eec9a6', s: .96, beard: true },
  '👵': { name: 'Bà',       hair: '#dadada', style: 'bun',      skin: '#f1d1b3', s: .93, dress: true },
  '🧑': { name: 'Cô / Chú', hair: '#8a4b22', style: 'curly',    skin: '#e8b98f', s: 1 },
  '🧒': { name: 'Em bé',    hair: '#3b2a1a', style: 'short',    skin: '#f8dcc0', s: .64, child: true },
};

export function shade(hex, k) {
  const n = parseInt(hex.slice(1), 16); let r = n >> 16, g = (n >> 8) & 255, b = n & 255;
  const t = k < 0 ? 0 : 255, a = Math.abs(k);
  r = Math.round(r + (t - r) * a); g = Math.round(g + (t - g) * a); b = Math.round(b + (t - b) * a);
  return `rgb(${r},${g},${b})`;
}
function rr(ctx, x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2); ctx.beginPath();
  ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); ctx.fill();
}
const circle = (ctx, x, y, r) => { ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); };

// o = { avatar, color, fx, fy, phase, moving, working, now, scale }
// (x, y) là điểm chân chạm đất.
export function drawChar(ctx, x, y, o) {
  const L = LOOKS[o.avatar] || LOOKS['🧑'], s = L.s * (o.scale || 1);
  const fx = o.fx || 0, fy = o.fy == null ? 1 : o.fy;
  const face = Math.abs(fx) > Math.abs(fy) ? (fx < 0 ? 'L' : 'R') : (fy < 0 ? 'U' : 'D');
  const side = face === 'L' || face === 'R', back = face === 'U';
  const walk = o.moving ? 1 : 0, ph = o.phase || 0;
  // sin(ph) > 0: chân phải đang bước tới (tay trái vung tới), sin(ph) < 0: ngược lại
  const sw = Math.sin(ph) * walk, bob = Math.abs(Math.cos(ph)) * 1.6 * walk;
  const shirt = o.color, pants = L.dress ? shade(o.color, -.35) : '#3b4a6b', skin = L.skin, hair = L.hair, shoe = '#4a2d1a';

  ctx.save(); ctx.translate(x, y);
  ctx.fillStyle = 'rgba(0,0,0,.2)'; ctx.beginPath(); ctx.ellipse(0, 0, 11 * s, 4.5 * s, 0, 0, 7); ctx.fill();
  ctx.translate(0, -bob);
  if (face === 'L') ctx.scale(-1, 1);

  // Chân nhìn ngang: xoay quanh hông (vung trước-sau). Nhìn trước/sau: chân thẳng, nhấc lên hạ xuống luân phiên.
  const legSide = (hx, ang) => {
    ctx.save(); ctx.translate(hx, -14 * s); ctx.rotate(ang);
    ctx.fillStyle = L.dress ? skin : pants; rr(ctx, -2.6 * s, 0, 5.2 * s, 13 * s, 2.2 * s);
    ctx.fillStyle = shoe; rr(ctx, -3.2 * s, 10.5 * s, 7 * s, 4 * s, 2 * s);
    ctx.restore();
  };
  const legFront = (hx, lift) => {
    ctx.save(); ctx.translate(hx, -14 * s - lift);
    ctx.fillStyle = L.dress ? skin : pants; rr(ctx, -2.6 * s, 0, 5.2 * s, 13 * s, 2.2 * s);
    ctx.fillStyle = shoe; rr(ctx, -3.2 * s, 10.5 * s, 6.4 * s, 4 * s, 2 * s);
    ctx.restore();
  };
  // Tay: nhìn ngang xoay quanh vai; nhìn trước/sau co ngắn (tay vung ra trước thì ngắn lại, bàn tay nhích lên) và hơi xoè ra.
  const arm = (hx, ang, len, tool, dy = 0) => {
    ctx.save(); ctx.translate(hx, -27.5 * s + dy); ctx.rotate(ang);
    ctx.fillStyle = shirt; rr(ctx, -2.3 * s, 0, 4.6 * s, 8 * s * len, 2 * s);
    ctx.fillStyle = skin; rr(ctx, -2.1 * s, 7 * s * len, 4.2 * s, 6 * s, 2 * s);
    if (tool) { ctx.fillStyle = '#6b4a2a'; rr(ctx, -1 * s, 9 * s, 2 * s, 10 * s, 1); ctx.fillStyle = '#9aa3ad'; rr(ctx, -4.5 * s, 16 * s, 7 * s, 4 * s, 1.5 * s); }
    ctx.restore();
  };
  const working = !!o.working, workAng = -2.1 + Math.sin((o.now || 0) / 45) * .55;
  const skirt = (w0, w1, hem) => { ctx.fillStyle = pants; ctx.beginPath(); ctx.moveTo(-w0 * s, -16 * s); ctx.lineTo(w0 * s, -16 * s); ctx.lineTo(w1 * s, hem * s); ctx.lineTo(-w1 * s, hem * s); ctx.closePath(); ctx.fill(); };

  if (side) {
    // nhân vật quay mặt sang phải (trái thì đã lật gương): chân trước là chân gần người xem
    arm(-1.5 * s, -sw * .75, 1, false);                     // tay sau: vung ngược chân sau
    legSide(-1.8 * s, -sw * .75); legSide(1.8 * s, sw * .75);
    if (L.dress) skirt(6, 7.5, -8);
    ctx.fillStyle = shirt; rr(ctx, -6.5 * s, -31 * s, 13 * s, 18 * s, 5 * s);
    arm(1.5 * s, working ? workAng : sw * .75, 1, working); // tay trước
  } else {
    const lift = Math.max(0, sw) * 4.5 * s, lift2 = Math.max(0, -sw) * 4.5 * s;
    legFront(-4 * s, back ? lift2 : lift); legFront(4 * s, back ? lift : lift2);
    if (L.dress) skirt(8, 10.5, -6);
    ctx.fillStyle = shirt; rr(ctx, -8.5 * s, -31 * s, 17 * s, 18 * s, 5.5 * s);
    // tay trái vung cùng nhịp chân phải: tay nào vung ra trước thì co ngắn
    const fL = Math.max(0, sw), fR = Math.max(0, -sw);       // tay nào đang vung ra trước
    arm(-8 * s, -.1 - fL * .25, 1 - fL * .45, false, -fL * 2 * s);
    arm(8 * s, working ? workAng : .1 + fR * .25, working ? 1 : 1 - fR * .45, working, working ? 0 : -fR * 2 * s);
    if (!back) { ctx.fillStyle = shade(o.color, .35); rr(ctx, -2 * s, -30 * s, 4 * s, 10 * s, 1.5 * s); } // nẹp áo
  }

  // đầu
  const hy = -39 * s, hr = (L.child ? 9.5 : 8.6) * s;
  ctx.fillStyle = skin; circle(ctx, 0, hy, hr);
  // tóc
  ctx.fillStyle = hair;
  ctx.beginPath(); ctx.arc(0, hy - .5 * s, hr + .6 * s, Math.PI, 0); ctx.fill();
  if (back) { ctx.beginPath(); ctx.arc(0, hy - .5 * s, hr + .6 * s, 0, Math.PI); ctx.fill(); }
  else { ctx.fillRect(-(hr + .6 * s), hy - 1.5 * s, hr + .6 * s, 3.5 * s); if (!side) ctx.fillRect(0, hy - 1.5 * s, hr + .6 * s, 3.5 * s); }
  if (L.style === 'long') { rr(ctx, -(hr + 1) * s, hy - 2 * s, 4 * s, 14 * s, 2 * s); if (!side) rr(ctx, (hr - 3) * s, hy - 2 * s, 4 * s, 14 * s, 2 * s); }
  if (L.style === 'pigtails') { circle(ctx, -(hr + 2) * s, hy + 1 * s, 3.6 * s); if (!side) circle(ctx, (hr + 2) * s, hy + 1 * s, 3.6 * s); }
  if (L.style === 'bun') circle(ctx, side ? -5 * s : 0, hy - hr - 1.5 * s, 3.8 * s);
  if (L.style === 'curly') for (let i = -3; i <= 3; i++) circle(ctx, i * 2.6 * s, hy - hr + 1.2 * s - Math.abs(i) * .6 * s, 2.8 * s);
  if (L.beard && !back) { ctx.beginPath(); ctx.arc(side ? 1.5 * s : 0, hy + 2.5 * s, hr - 1.5 * s, .15 * Math.PI, .85 * Math.PI); ctx.fill(); }
  // mặt
  if (!back) {
    ctx.fillStyle = '#2b2b2b';
    if (side) circle(ctx, 3.5 * s, hy - 1 * s, 1.2 * s); else { circle(ctx, -3 * s, hy - 1 * s, 1.2 * s); circle(ctx, 3 * s, hy - 1 * s, 1.2 * s); }
    if (!L.beard) { ctx.strokeStyle = '#8a4a3a'; ctx.lineWidth = 1.2 * s; ctx.beginPath(); ctx.arc(side ? 3 * s : 0, hy + 2.2 * s, 2.6 * s, .25 * Math.PI, .75 * Math.PI); ctx.stroke(); }
    if (L.child) { ctx.fillStyle = 'rgba(255,120,120,.35)'; circle(ctx, side ? 5 * s : -5 * s, hy + 2 * s, 1.8 * s); if (!side) circle(ctx, 5 * s, hy + 2 * s, 1.8 * s); }
  }
  ctx.restore();
}

// Canvas nhỏ để dùng trong DOM (chọn nhân vật, chip người chơi)
export function charCanvas(avatar, color, w, h, scale = 1) {
  const c = document.createElement('canvas'), dpr = Math.min(2, devicePixelRatio || 1);
  c.width = w * dpr; c.height = h * dpr; c.style.width = w + 'px'; c.style.height = h + 'px';
  const ctx = c.getContext('2d'); ctx.scale(dpr, dpr);
  drawChar(ctx, w / 2, h - 4, { avatar, color, fx: 0, fy: 1, scale });
  return c;
}
