// ── Vẽ bàn chơi: nền động, ống thuỷ tinh và bóng bi 3D bóng loáng ──
import { COLORS } from './config.js';
import { drawFx } from './fx.js';

/* ═══ SPRITE BÓNG ═══
   Mỗi màu được vẽ sẵn một lần vào canvas riêng rồi dán lại — nhẹ cho iPad. */
let sprites = [], spriteR = 0, spritePad = 0;

export function buildSprites(r, dpr) {
  if (Math.abs(r - spriteR) < 0.5 && sprites.length) return;
  spriteR = r;
  spritePad = Math.ceil(r * 0.34);
  const size = Math.ceil((r + spritePad) * 2);
  sprites = COLORS.map((col) => {
    const cv = document.createElement('canvas');
    cv.width = cv.height = Math.ceil(size * dpr);
    const c = cv.getContext('2d');
    c.scale(dpr, dpr);
    paintBall(c, size / 2, size / 2, r, col);
    return { cv, size };
  });
}

function paintBall(c, cx, cy, r, col) {
  // Thân bóng: sáng ở trên trái, tối dần xuống dưới phải.
  const g = c.createRadialGradient(cx - r * 0.36, cy - r * 0.42, r * 0.04, cx, cy, r * 1.06);
  g.addColorStop(0, col.light);
  g.addColorStop(0.22, col.base);
  g.addColorStop(0.72, col.base);
  g.addColorStop(1, col.dark);
  c.fillStyle = g;
  c.beginPath(); c.arc(cx, cy, r, 0, 6.2832); c.fill();

  // Ánh hắt từ dưới lên (bounce light) cho bóng tròn khối hơn.
  const g2 = c.createRadialGradient(cx + r * 0.24, cy + r * 0.56, r * 0.05, cx + r * 0.2, cy + r * 0.5, r * 0.85);
  g2.addColorStop(0, 'rgba(255,255,255,.34)');
  g2.addColorStop(1, 'rgba(255,255,255,0)');
  c.fillStyle = g2;
  c.beginPath(); c.arc(cx, cy, r, 0, 6.2832); c.fill();

  // Viền tối rất mảnh để bóng tách khỏi nền.
  c.strokeStyle = 'rgba(0,0,0,.22)';
  c.lineWidth = Math.max(1, r * 0.05);
  c.beginPath(); c.arc(cx, cy, r * 0.985, 0, 6.2832); c.stroke();

  // Đốm sáng chính + đốm phụ.
  c.save();
  c.translate(cx - r * 0.34, cy - r * 0.40);
  c.rotate(-0.5);
  const hg = c.createRadialGradient(0, 0, 0, 0, 0, r * 0.34);
  hg.addColorStop(0, 'rgba(255,255,255,.95)');
  hg.addColorStop(0.55, 'rgba(255,255,255,.45)');
  hg.addColorStop(1, 'rgba(255,255,255,0)');
  c.fillStyle = hg;
  c.beginPath(); c.ellipse(0, 0, r * 0.34, r * 0.22, 0, 0, 6.2832); c.fill();
  c.restore();

  c.fillStyle = 'rgba(255,255,255,.85)';
  c.beginPath(); c.arc(cx - r * 0.12, cy - r * 0.58, r * 0.08, 0, 6.2832); c.fill();
}

export function drawBall(ctx, x, y, ci, scale = 1, alpha = 1) {
  const s = sprites[ci % sprites.length];
  if (!s) return;
  const half = (s.size / 2) * scale;
  ctx.save();
  if (alpha < 1) ctx.globalAlpha = alpha;
  ctx.drawImage(s.cv, x - half, y - half, half * 2, half * 2);
  ctx.restore();
}

/* ═══ NỀN ═══ */
const ORBS = [];
function seedOrbs(W, H) {
  ORBS.length = 0;
  const hues = ['#7ae7ff', '#ff9ad5', '#ffe07a', '#9affc4', '#b49bff'];
  for (let i = 0; i < 11; i++) {
    ORBS.push({
      x: Math.random(), y: Math.random(),
      r: 0.06 + Math.random() * 0.16,
      sp: 0.00004 + Math.random() * 0.00009,
      ph: Math.random() * 6.28,
      c: hues[i % hues.length],
      a: 0.07 + Math.random() * 0.08,
    });
  }
}

export function drawBackground(ctx, W, H, t) {
  if (!ORBS.length) seedOrbs(W, H);
  const g = ctx.createLinearGradient(0, 0, W * 0.3, H);
  g.addColorStop(0, '#14306e');
  g.addColorStop(0.45, '#3a2378');
  g.addColorStop(1, '#6b2470');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);

  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for (const o of ORBS) {
    const x = (o.x + Math.sin(t * o.sp * 1000 + o.ph) * 0.06) * W;
    const y = (o.y + Math.cos(t * o.sp * 700 + o.ph) * 0.05) * H;
    const r = o.r * Math.min(W, H) * (1 + Math.sin(t * 0.0006 + o.ph) * 0.08);
    const rg = ctx.createRadialGradient(x, y, 0, x, y, r);
    rg.addColorStop(0, o.c);
    rg.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.globalAlpha = o.a;
    ctx.fillStyle = rg;
    ctx.beginPath(); ctx.arc(x, y, r, 0, 6.2832); ctx.fill();
  }
  ctx.restore();

  // Quầng sáng ấm sau khu vực đặt ống.
  const halo = ctx.createRadialGradient(W / 2, H * 0.62, 0, W / 2, H * 0.62, Math.max(W, H) * 0.55);
  halo.addColorStop(0, 'rgba(255,236,190,.13)');
  halo.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = halo;
  ctx.fillRect(0, 0, W, H);

  // Tối bốn góc cho bàn chơi nổi lên giữa màn.
  const vg = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.32, W / 2, H / 2, Math.max(W, H) * 0.78);
  vg.addColorStop(0, 'rgba(0,0,0,0)');
  vg.addColorStop(1, 'rgba(4,2,20,.5)');
  ctx.fillStyle = vg;
  ctx.fillRect(0, 0, W, H);
}

/* ═══ ỐNG THUỶ TINH ═══ */
function tubePath(ctx, t, inset = 0) {
  const x = t.x + inset, y = t.y + inset;
  const w = t.w - inset * 2, h = t.h - inset * 2;
  const rb = w / 2;                       // đáy bo tròn như ống nghiệm
  const lip = w * 0.11;                   // độ dẹt của hình elip miệng ống
  ctx.beginPath();
  ctx.moveTo(x, y + lip);
  ctx.lineTo(x, y + h - rb);
  ctx.arcTo(x, y + h, x + rb, y + h, rb);
  ctx.arcTo(x + w, y + h, x + w, y + h - rb, rb);
  ctx.lineTo(x + w, y + lip);
  ctx.ellipse(x + w / 2, y + lip, w / 2, lip, 0, 0, Math.PI, true);
  ctx.closePath();
}

export function drawTubeBack(ctx, t, d) {
  const lip = t.w * 0.11;

  // Bóng đổ mềm xuống "mặt bàn".
  ctx.save();
  ctx.fillStyle = 'rgba(10,4,30,.34)';
  ctx.beginPath();
  ctx.ellipse(t.cx, t.y + t.h + d * 0.10, t.w * 0.46, d * 0.13, 0, 0, 6.2832);
  ctx.fill();
  ctx.restore();

  // Thân kính: dải sáng dọc mô phỏng độ cong của ống.
  tubePath(ctx, t);
  const g = ctx.createLinearGradient(t.x, 0, t.x + t.w, 0);
  g.addColorStop(0.00, 'rgba(255,255,255,.20)');
  g.addColorStop(0.16, 'rgba(255,255,255,.07)');
  g.addColorStop(0.45, 'rgba(120,150,220,.13)');
  g.addColorStop(0.82, 'rgba(255,255,255,.06)');
  g.addColorStop(1.00, 'rgba(255,255,255,.17)');
  ctx.fillStyle = g;
  ctx.fill();

  // Miệng ống: elip tối cho thấy lòng ống rỗng.
  ctx.save();
  ctx.fillStyle = 'rgba(18,10,44,.55)';
  ctx.beginPath();
  ctx.ellipse(t.cx, t.y + lip, t.w / 2 - 1, lip, 0, 0, 6.2832);
  ctx.fill();
  ctx.restore();
}

export function clipTube(ctx, t) {
  tubePath(ctx, t, 2);
  ctx.clip();
}

export function drawTubeGlass(ctx, t, d, opts = {}) {
  const lip = t.w * 0.11;
  const { glow = 0, done = false } = opts;

  ctx.save();
  tubePath(ctx, t, 1.5);
  ctx.clip();

  // Vệt sáng dọc bên trái + vệt mảnh bên phải.
  ctx.fillStyle = 'rgba(255,255,255,.30)';
  roundRect(ctx, t.x + t.w * 0.13, t.y + t.w * 0.26, t.w * 0.105, t.h - t.w * 0.62, t.w * 0.055);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,.14)';
  roundRect(ctx, t.x + t.w * 0.79, t.y + t.w * 0.34, t.w * 0.055, t.h - t.w * 0.85, t.w * 0.03);
  ctx.fill();

  // Đáy ống dày hơn: tối nhẹ ở dưới cùng.
  const bg = ctx.createLinearGradient(0, t.y + t.h - d * 0.55, 0, t.y + t.h);
  bg.addColorStop(0, 'rgba(20,8,50,0)');
  bg.addColorStop(1, 'rgba(20,8,50,.30)');
  ctx.fillStyle = bg;
  ctx.fillRect(t.x, t.y + t.h - d * 0.55, t.w, d * 0.55);
  ctx.restore();

  // Viền ngoài.
  tubePath(ctx, t);
  ctx.strokeStyle = 'rgba(255,255,255,.42)';
  ctx.lineWidth = Math.max(1.6, t.w * 0.026);
  ctx.stroke();

  // Vành miệng ống sáng rõ.
  ctx.beginPath();
  ctx.ellipse(t.cx, t.y + lip, t.w / 2, lip, 0, 0, 6.2832);
  ctx.strokeStyle = 'rgba(255,255,255,.75)';
  ctx.lineWidth = Math.max(1.8, t.w * 0.03);
  ctx.stroke();

  if (glow > 0) {
    ctx.save();
    ctx.strokeStyle = done ? `rgba(255,220,90,${0.95 * glow})` : `rgba(150,240,255,${0.95 * glow})`;
    ctx.lineWidth = Math.max(3, t.w * 0.055);
    ctx.shadowColor = done ? 'rgba(255,205,60,.95)' : 'rgba(120,230,255,.95)';
    ctx.shadowBlur = 26 * glow;
    tubePath(ctx, t);
    ctx.stroke();
    ctx.restore();
  }
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

// ── Nút chai đậy lên ống đã xếp xong ──
// Nắp khoén thật: mặt nắp ăn theo màu của ống, váy nắp bằng kim loại có răng cưa.
// Ống đã đậy nút là khoá hẳn, bé chạm vào cũng không chọn được nữa.
const CRIMPS = 11;        // số răng nhìn thấy ở nửa trước của váy nắp

export function drawTubeCap(ctx, t, d, grow, nudge, ci) {
  const lip = t.w * 0.11;
  const col = COLORS[ci % COLORS.length];

  // Nắp rơi từ trên xuống, hơi nảy một cái rồi đậy khít.
  const e = grow >= 1 ? 1 : 1 - Math.pow(1 - grow, 3);
  const drop = (1 - e) * d * 0.9;
  const squash = grow >= 1 ? 1 : 1 + Math.sin(grow * Math.PI) * 0.14;
  const bounce = nudge > 0 ? Math.sin(nudge * Math.PI * 3) * (1 - nudge) * d * 0.13 : 0;
  if (e < 0.02) return;

  const rx = (t.w / 2) * 1.07 * squash;
  const ry = rx * 0.23;
  const skirt = d * 0.24 * e;
  const cx = t.cx;
  const cy = t.y + lip - skirt * 0.45 - drop - bounce;

  // Toạ độ một điểm trên vành trước của hình elip.
  const front = (a, ox, oy) => [cx + rx * Math.cos(a), cy + oy + ry * Math.sin(a) + (ox || 0)];

  ctx.save();

  // Bóng nắp hắt xuống miệng ống.
  ctx.fillStyle = 'rgba(16,6,44,.38)';
  ctx.beginPath();
  ctx.ellipse(cx, cy + skirt + ry * 0.5, rx * 0.94, ry * 0.85, 0, 0, 6.2832);
  ctx.fill();

  /* ── Váy nắp: dải kim loại có răng cưa ở mép dưới ── */
  const STEPS = 64;
  ctx.beginPath();
  for (let i = 0; i <= STEPS; i++) {            // mép trên, trái → phải qua phía trước
    const a = Math.PI - (i / STEPS) * Math.PI;
    const [x, y] = front(a, 0, 0);
    i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
  }
  for (let i = STEPS; i >= 0; i--) {            // mép dưới có răng, phải → trái
    const a = Math.PI - (i / STEPS) * Math.PI;
    const tooth = Math.abs(Math.sin(a * CRIMPS)) * skirt * 0.26;
    const [x, y] = front(a, 0, skirt - tooth);
    ctx.lineTo(x, y);
  }
  ctx.closePath();

  const mg = ctx.createLinearGradient(cx - rx, 0, cx + rx, 0);
  mg.addColorStop(0.00, '#8a5a06');
  mg.addColorStop(0.18, '#e8b545');
  mg.addColorStop(0.38, '#fff1c2');
  mg.addColorStop(0.62, '#f2cf72');
  mg.addColorStop(0.84, '#c98c16');
  mg.addColorStop(1.00, '#7d4f04');
  ctx.fillStyle = mg;
  ctx.fill();

  // Rãnh dọc giữa các răng cho váy nắp có khối.
  ctx.save();
  ctx.clip();
  ctx.lineWidth = Math.max(1, rx * 0.035);
  for (let k = 0; k < CRIMPS; k++) {
    const a = Math.PI - ((k + 0.5) / CRIMPS) * Math.PI;
    const [x0, y0] = front(a, 0, 0);
    const [x1, y1] = front(a, 0, skirt);
    ctx.strokeStyle = 'rgba(80,44,0,.32)';
    ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,.34)';
    ctx.beginPath();
    ctx.moveTo(x0 + rx * 0.03, y0); ctx.lineTo(x1 + rx * 0.03, y1);
    ctx.stroke();
  }
  ctx.restore();

  /* ── Mặt nắp: ăn theo màu của ống ── */
  const tg = ctx.createRadialGradient(cx - rx * 0.34, cy - ry * 0.7, ry * 0.1, cx, cy, rx * 1.02);
  tg.addColorStop(0, col.light);
  tg.addColorStop(0.42, col.base);
  tg.addColorStop(1, col.dark);
  ctx.fillStyle = tg;
  ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, 0, 0, 6.2832); ctx.fill();

  // Vành vàng quanh mặt nắp.
  ctx.strokeStyle = '#ffe9a8';
  ctx.lineWidth = Math.max(1.6, rx * 0.075);
  ctx.beginPath(); ctx.ellipse(cx, cy, rx * 0.97, ry * 0.94, 0, 0, 6.2832); ctx.stroke();

  // Gân chìm đồng tâm như nắp chai thật.
  ctx.strokeStyle = 'rgba(255,255,255,.22)';
  ctx.lineWidth = Math.max(1, rx * 0.03);
  ctx.beginPath(); ctx.ellipse(cx, cy, rx * 0.62, ry * 0.58, 0, 0, 6.2832); ctx.stroke();

  // Vệt sáng lưỡi liềm phía trên trái, mờ dần cho đỡ chói.
  const hl = ctx.createLinearGradient(cx - rx * 0.7, cy - ry, cx + rx * 0.2, cy + ry * 0.4);
  hl.addColorStop(0, 'rgba(255,255,255,.55)');
  hl.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = hl;
  ctx.beginPath();
  ctx.ellipse(cx - rx * 0.32, cy - ry * 0.34, rx * 0.42, ry * 0.32, -0.3, 0, 6.2832);
  ctx.fill();

  ctx.restore();
}

// Mũi tên gợi ý bay lượn giữa hai ống.
export function drawHintArrow(ctx, x, y, t) {
  const bob = Math.sin(t * 0.006) * 6;
  ctx.save();
  ctx.translate(x, y + bob);
  ctx.fillStyle = 'rgba(255,235,120,.95)';
  ctx.shadowColor = 'rgba(255,220,80,.9)';
  ctx.shadowBlur = 18;
  ctx.beginPath();
  ctx.moveTo(0, 14); ctx.lineTo(-12, -6); ctx.lineTo(-5, -6);
  ctx.lineTo(-5, -18); ctx.lineTo(5, -18); ctx.lineTo(5, -6);
  ctx.lineTo(12, -6); ctx.closePath();
  ctx.fill();
  ctx.restore();
}

export { drawFx };
