// ── Vẽ sân trong biệt thự spa bên bờ biển (phong cách Sally's Spa):
//    nền gạch cát, hiên gỗ mái ngói, cây xanh viền quanh, đài phun nước,
//    ghế mặt nạ vàng, buồng tắm vòi sen, giường mát-xa, ghế làm móng,
//    quầy lễ tân có máy tính, ghế băng chờ, xe trà và xe mỹ phẩm ──

import { G } from './state.js';
import { SERVICES, PAY_ICON, HERO_LOOK } from './config.js';
import { currentWish, stationFree, canSwap } from './customers.js';
import { teaTarget, teaReady } from './staff.js';
import { teaCooldown } from './upgrades.js';
import { drawParticles, drawHeart } from './particles.js';
import { drawPerson, drawHeadOnly } from './avatar.js';
import { maskTime, saunaTime } from './upgrades.js';
import { getTheme } from './decor.js';

// bảng màu trang trí đang dùng, cập nhật mỗi khung hình
let T = getTheme();

// màu cố định của khung cảnh bờ biển
const SC = {
  wood: '#9c6b40', woodDark: '#7e5330', woodLight: '#b8834f',
  roof: '#c96f42', roofDark: '#a8552c',
  leaf: '#4a8a4e', leafDark: '#356b3a', leafLight: '#6cab66',
  stone: '#b8b0a2', stoneDark: '#9a9184',
  water: '#8fd8e0', waterDeep: '#5cbcca',
  sign: '#8a5c30', signInk: '#ffe9cc',
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
  const { ctx, K } = G;
  const p = 0.5 + 0.5 * Math.sin(G.time * (speed || 7));
  ctx.strokeStyle = col.replace('%A%', (0.42 + p * 0.5).toFixed(2));
  ctx.lineWidth = (3.5 + p * 3) * K;
  rr(x, y, w, h, r);
  ctx.stroke();
}

/* ══════════════ KHUNG CẢNH SÂN SPA ══════════════ */

// sàn gạch cát vuông so le như sân biệt thự
function drawFloor() {
  const { ctx, W, H, K } = G;
  const f = T.floor;
  ctx.fillStyle = f.base;
  ctx.fillRect(0, 0, W, H);
  const tile = 58 * K;
  let row = 0;
  for (let y = 0; y < H; y += tile, row++) {
    for (let x = -tile + (row % 2 ? tile / 2 : 0), col = 0; x < W; x += tile, col++) {
      if ((col + row) % 2) continue;
      ctx.fillStyle = f.alt;
      ctx.fillRect(x, y, tile, Math.min(tile, H - y));
    }
  }
  ctx.strokeStyle = f.line;
  ctx.lineWidth = 1.5;
  for (let y = 0; y < H; y += tile) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
  }
}

// hiên gỗ + mái ngói đất nung chạy ngang phía trên (villa phía sau)
function drawVeranda() {
  const { ctx, W, K } = G;
  const hutH = 66 * K;

  // vách ván gỗ ngang
  const wg = ctx.createLinearGradient(0, 0, 0, hutH);
  wg.addColorStop(0, SC.woodLight);
  wg.addColorStop(1, SC.wood);
  ctx.fillStyle = wg;
  ctx.fillRect(0, 0, W, hutH);
  ctx.strokeStyle = 'rgba(90,50,20,.28)';
  ctx.lineWidth = 1.6 * K;
  for (let i = 1; i < 4; i++) {
    ctx.beginPath(); ctx.moveTo(0, (hutH / 4) * i); ctx.lineTo(W, (hutH / 4) * i); ctx.stroke();
  }
  // cột gỗ chống hiên
  ctx.fillStyle = SC.woodDark;
  for (const fx of [0.06, 0.36, 0.66, 0.94]) {
    rr(W * fx - 7 * K, 0, 14 * K, hutH + 26 * K, 5 * K); ctx.fill();
  }
  // mái ngói cong lượn (hàng ngói nửa ống)
  ctx.fillStyle = SC.roof;
  ctx.fillRect(0, hutH, W, 14 * K);
  ctx.fillStyle = SC.roofDark;
  const tw2 = 30 * K;
  for (let x = 0; x < W + tw2; x += tw2) {
    ctx.beginPath();
    ctx.arc(x, hutH + 14 * K, 14 * K, Math.PI, 0);
    ctx.fill();
  }
  ctx.fillStyle = 'rgba(255,235,200,.22)';
  ctx.fillRect(0, hutH, W, 4 * K);

  // bóng mái đổ xuống sàn
  const sg = ctx.createLinearGradient(0, hutH + 22 * K, 0, hutH + 66 * K);
  sg.addColorStop(0, 'rgba(110,70,30,.22)');
  sg.addColorStop(1, 'rgba(110,70,30,0)');
  ctx.fillStyle = sg;
  ctx.fillRect(0, hutH + 22 * K, W, 44 * K);
  return hutH;
}

// một bụi cây nhiệt đới (cụm tán tròn nhiều lớp)
function bush(x, y, s) {
  const { ctx } = G;
  ctx.fillStyle = SC.leafDark;
  ctx.beginPath(); ctx.ellipse(x, y + s * 0.15, s * 1.15, s * 0.7, 0, 0, 7); ctx.fill();
  ctx.fillStyle = SC.leaf;
  ctx.beginPath(); ctx.arc(x - s * 0.5, y - s * 0.1, s * 0.55, 0, 7); ctx.fill();
  ctx.beginPath(); ctx.arc(x + s * 0.45, y - s * 0.05, s * 0.6, 0, 7); ctx.fill();
  ctx.beginPath(); ctx.arc(x, y - s * 0.35, s * 0.58, 0, 7); ctx.fill();
  ctx.fillStyle = SC.leafLight;
  ctx.beginPath(); ctx.arc(x - s * 0.2, y - s * 0.42, s * 0.3, 0, 7); ctx.fill();
  ctx.beginPath(); ctx.arc(x + s * 0.35, y - s * 0.28, s * 0.24, 0, 7); ctx.fill();
  // vài bông hoa nhỏ
  ctx.fillStyle = '#ff8fb5';
  ctx.beginPath(); ctx.arc(x - s * 0.45, y - s * 0.05, s * 0.08, 0, 7); ctx.fill();
  ctx.beginPath(); ctx.arc(x + s * 0.2, y - s * 0.45, s * 0.08, 0, 7); ctx.fill();
}

// cây cọ nhỏ trong chậu đá
function palm(x, y, s) {
  const { ctx } = G;
  ctx.fillStyle = SC.stone;
  ctx.beginPath(); ctx.ellipse(x, y, s * 0.5, s * 0.2, 0, 0, 7); ctx.fill();
  ctx.strokeStyle = '#8a6a42';
  ctx.lineWidth = s * 0.14;
  ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + s * 0.15, y - s * 0.8, x + s * 0.05, y - s * 1.3); ctx.stroke();
  ctx.strokeStyle = SC.leaf;
  ctx.lineWidth = s * 0.11;
  ctx.lineCap = 'round';
  for (let i = 0; i < 5; i++) {
    const a = -Math.PI / 2 + (i - 2) * 0.55;
    ctx.beginPath();
    ctx.moveTo(x + s * 0.05, y - s * 1.3);
    ctx.quadraticCurveTo(
      x + s * 0.05 + Math.cos(a) * s * 0.6, y - s * 1.3 + Math.sin(a) * s * 0.5 - s * 0.25,
      x + s * 0.05 + Math.cos(a) * s * 1.0, y - s * 1.3 + Math.sin(a) * s * 0.62,
    );
    ctx.stroke();
  }
}

// sao biển trang trí
function starfish(x, y, s, col) {
  const { ctx } = G;
  ctx.fillStyle = col || '#e8875a';
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const r = i % 2 ? s * 0.42 : s;
    const a = -Math.PI / 2 + (i / 10) * Math.PI * 2;
    const px = x + Math.cos(a) * r, py = y + Math.sin(a) * r;
    i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
  }
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,.3)';
  ctx.beginPath(); ctx.arc(x, y, s * 0.28, 0, 7); ctx.fill();
}

// đài phun nước bằng đá, hoa sứ thả nổi
function drawFountain() {
  const { ctx, K } = G;
  const f = G.fountain;
  if (!f) return;
  const r = f.r;
  ctx.fillStyle = 'rgba(110,70,30,.16)';
  ctx.beginPath(); ctx.ellipse(f.x, f.y + r * 0.5, r * 1.18, r * 0.42, 0, 0, 7); ctx.fill();
  // thành đá ngoài
  ctx.fillStyle = SC.stone;
  ctx.beginPath(); ctx.ellipse(f.x, f.y, r * 1.12, r * 0.62, 0, 0, 7); ctx.fill();
  ctx.fillStyle = SC.stoneDark;
  ctx.beginPath(); ctx.ellipse(f.x, f.y + r * 0.06, r * 0.98, r * 0.52, 0, 0, 7); ctx.fill();
  // mặt nước
  ctx.fillStyle = SC.water;
  ctx.beginPath(); ctx.ellipse(f.x, f.y + r * 0.04, r * 0.88, r * 0.44, 0, 0, 7); ctx.fill();
  // gợn nước lan toả
  ctx.strokeStyle = 'rgba(255,255,255,.5)';
  ctx.lineWidth = 2 * K;
  for (let i = 0; i < 2; i++) {
    const p = ((G.time * 0.35 + i * 0.5) % 1);
    ctx.globalAlpha = 1 - p;
    ctx.beginPath();
    ctx.ellipse(f.x, f.y + r * 0.04, r * 0.25 + p * r * 0.55, (r * 0.25 + p * r * 0.55) * 0.48, 0, 0, 7);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  // đá cuội + hoa sứ nổi
  ctx.fillStyle = SC.stoneDark;
  ctx.beginPath(); ctx.ellipse(f.x - r * 0.5, f.y - r * 0.16, r * 0.16, r * 0.1, 0, 0, 7); ctx.fill();
  ctx.beginPath(); ctx.ellipse(f.x - r * 0.32, f.y - r * 0.26, r * 0.12, r * 0.08, 0, 0, 7); ctx.fill();
  const flower = (fx, fy, s) => {
    ctx.fillStyle = '#fffaf2';
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2 + G.time * 0.2;
      ctx.beginPath();
      ctx.ellipse(fx + Math.cos(a) * s * 0.6, fy + Math.sin(a) * s * 0.4, s * 0.5, s * 0.3, a, 0, 7);
      ctx.fill();
    }
    ctx.fillStyle = '#ffd34d';
    ctx.beginPath(); ctx.arc(fx, fy, s * 0.3, 0, 7); ctx.fill();
  };
  flower(f.x + r * 0.35 + Math.sin(G.time * 0.7) * 3 * K, f.y + r * 0.14, 8 * K);
  flower(f.x - r * 0.15, f.y + r * 0.3 + Math.cos(G.time * 0.6) * 2 * K, 6.5 * K);
}

// xe chở mỹ phẩm đậu góc dưới-trái (đồ trang trí, sau này bán hàng)
function drawTruck() {
  const { ctx, H, K } = G;
  const x = 66 * K, y = H - 150 * K;
  ctx.fillStyle = 'rgba(110,70,30,.18)';
  ctx.beginPath(); ctx.ellipse(x + 10 * K, y + 78 * K, 66 * K, 14 * K, 0, 0, 7); ctx.fill();
  // thùng xe
  ctx.fillStyle = '#f2a83c';
  rr(x - 44 * K, y - 12 * K, 96 * K, 74 * K, 10 * K); ctx.fill();
  ctx.fillStyle = '#e08f24';
  rr(x - 44 * K, y + 40 * K, 96 * K, 22 * K, 8 * K); ctx.fill();
  ctx.fillStyle = '#fff2d8';
  rr(x - 34 * K, y - 2 * K, 76 * K, 34 * K, 7 * K); ctx.fill();
  // hoa văn chai lọ trên thùng
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.font = `${19 * K}px sans-serif`;
  ctx.fillText('🧴', x - 16 * K, y + 15 * K);
  ctx.fillText('🌺', x + 8 * K, y + 15 * K);
  ctx.fillText('🧼', x + 30 * K, y + 15 * K);
  // bánh xe
  for (const dx of [-24, 32]) {
    ctx.fillStyle = '#5a4232';
    ctx.beginPath(); ctx.arc(x + dx * K, y + 66 * K, 12 * K, 0, 7); ctx.fill();
    ctx.fillStyle = '#c9b8a0';
    ctx.beginPath(); ctx.arc(x + dx * K, y + 66 * K, 5.5 * K, 0, 7); ctx.fill();
  }
}

// lối đi lát đá từ cửa bên trái vào sân
function drawPath() {
  const { ctx, K } = G;
  const y0 = G.door.y;
  ctx.fillStyle = 'rgba(180,168,150,.55)';
  for (let i = 0; i < 5; i++) {
    ctx.beginPath();
    ctx.ellipse(30 * K + i * 52 * K, y0 + 20 * K + (i % 2 ? 8 : -6) * K, 26 * K, 13 * K, 0, 0, 7);
    ctx.fill();
  }
}

function drawScene() {
  const { W, H, K, ctx } = G;
  drawFloor();
  const hutH = drawVeranda();
  drawPath();

  // cây xanh viền quanh sân như trong video
  bush(W * 0.035, hutH + 44 * K, 34 * K);
  bush(W * 0.24, hutH + 30 * K, 26 * K);
  bush(W * 0.40, hutH + 30 * K, 24 * K);
  bush(W * 0.60, hutH + 30 * K, 24 * K);
  bush(W * 0.965, hutH + 44 * K, 34 * K);
  bush(W * 0.985, H * 0.42, 30 * K);
  bush(W * 0.015, H * 0.40, 26 * K);
  palm(W * 0.045, H * 0.60, 34 * K);
  palm(W * 0.955, H * 0.62, 38 * K);

  // sao biển và cánh hoa điểm xuyết
  starfish(W * 0.47, H * 0.40, 10 * K, '#f2917a');
  starfish(W * 0.30, H * 0.68, 8 * K, '#e8b05a');
  starfish(W * 0.88, H * 0.44, 7.5 * K, '#f2917a');
  ctx.fillStyle = 'rgba(255,250,240,.8)';
  for (const [fx, fy] of [[0.42, 0.55], [0.52, 0.36], [0.62, 0.70], [0.25, 0.42]]) {
    ctx.beginPath(); ctx.ellipse(W * fx, H * fy, 4.5 * K, 2.6 * K, fx * 6, 0, 7); ctx.fill();
  }

  drawFountain();
  drawTruck();
}

/* ══════════════ GHẾ BĂNG CHỜ ══════════════ */

function benchGeom() {
  const { K } = G;
  const xs = G.seats.map(s => s.x);
  const xMin = Math.min(...xs), xMax = Math.max(...xs);
  const y = G.seats[0].y;
  return { x0: xMin - 46 * K, x1: xMax + 46 * K, y };
}

function drawBenchBack() {
  const { ctx, K } = G;
  const b = benchGeom();
  const w = b.x1 - b.x0;
  ctx.fillStyle = 'rgba(110,70,30,.18)';
  ctx.beginPath(); ctx.ellipse((b.x0 + b.x1) / 2, b.y + 30 * K, w * 0.56, 12 * K, 0, 0, 7); ctx.fill();
  // tựa lưng nan gỗ
  ctx.fillStyle = SC.wood;
  rr(b.x0, b.y - 52 * K, w, 14 * K, 7 * K); ctx.fill();
  ctx.fillStyle = SC.woodLight;
  rr(b.x0, b.y - 34 * K, w, 12 * K, 6 * K); ctx.fill();
  // trụ hai đầu
  ctx.fillStyle = SC.woodDark;
  rr(b.x0 + 2 * K, b.y - 52 * K, 9 * K, 74 * K, 4 * K); ctx.fill();
  rr(b.x1 - 11 * K, b.y - 52 * K, 9 * K, 74 * K, 4 * K); ctx.fill();
}

function drawBenchFront() {
  const { ctx, K } = G;
  const b = benchGeom();
  const w = b.x1 - b.x0;
  // mặt ghế
  ctx.fillStyle = SC.woodLight;
  rr(b.x0, b.y + 2 * K, w, 16 * K, 7 * K); ctx.fill();
  ctx.fillStyle = 'rgba(255,240,210,.35)';
  rr(b.x0, b.y + 2 * K, w, 5 * K, 3 * K); ctx.fill();
  ctx.fillStyle = SC.wood;
  rr(b.x0, b.y + 14 * K, w, 6 * K, 3 * K); ctx.fill();
  // chân ghế
  ctx.fillStyle = SC.woodDark;
  rr(b.x0 + 8 * K, b.y + 20 * K, 8 * K, 12 * K, 3 * K); ctx.fill();
  rr(b.x1 - 16 * K, b.y + 20 * K, 8 * K, 12 * K, 3 * K); ctx.fill();
}

/* ══════════════ XE TRÀ ══════════════ */

function drawTeaCart() {
  const { ctx, K } = G;
  const t = G.teaCart;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillStyle = 'rgba(110,70,30,.2)';
  ctx.beginPath(); ctx.ellipse(t.x, t.y + 28 * K, 40 * K, 11 * K, 0, 0, 7); ctx.fill();
  // khung xe hai tầng
  ctx.fillStyle = SC.wood;
  rr(t.x - 34 * K, t.y - 20 * K, 68 * K, 6 * K, 3 * K); ctx.fill();
  rr(t.x - 34 * K, t.y + 8 * K, 68 * K, 6 * K, 3 * K); ctx.fill();
  ctx.fillStyle = SC.woodDark;
  rr(t.x - 32 * K, t.y - 16 * K, 5 * K, 26 * K, 2 * K); ctx.fill();
  rr(t.x + 27 * K, t.y - 16 * K, 5 * K, 26 * K, 2 * K); ctx.fill();
  // bánh xe
  ctx.fillStyle = '#7a5230';
  ctx.beginPath(); ctx.arc(t.x - 24 * K, t.y + 22 * K, 6.5 * K, 0, 7); ctx.fill();
  ctx.beginPath(); ctx.arc(t.x + 24 * K, t.y + 22 * K, 6.5 * K, 0, 7); ctx.fill();
  // ấm trà và tách
  ctx.fillStyle = '#fff8f2';
  rr(t.x - 16 * K, t.y - 40 * K, 24 * K, 20 * K, 7 * K); ctx.fill();
  ctx.strokeStyle = '#7fc9c2'; ctx.lineWidth = 2.4 * K;
  ctx.beginPath(); ctx.arc(t.x + 12 * K, t.y - 30 * K, 6 * K, -Math.PI / 2, Math.PI / 2); ctx.stroke();
  ctx.fillStyle = '#9ee0d0';
  rr(t.x - 12 * K, t.y - 44 * K, 6 * K, 5 * K, 2 * K); ctx.fill();
  ctx.fillStyle = '#fff8f2';
  ctx.beginPath(); ctx.ellipse(t.x + 20 * K, t.y - 22 * K, 7 * K, 4 * K, 0, 0, 7); ctx.fill();
  ctx.font = `${16 * K}px sans-serif`;
  ctx.fillText('🌺', t.x + 22 * K, t.y + 1 * K);
  ctx.font = `${15 * K}px sans-serif`;
  ctx.fillText('🍵', t.x - 16 * K, t.y + 1 * K);
  // nhãn: còn lượt thì "Mời trà ×n", đang nguội thì đếm giây, hết thì "Hết trà"
  const cooling = G.teaCool > 0;
  const empty = G.teaLeft <= 0;
  const label = empty ? 'Hết trà' : cooling ? Math.ceil(G.teaCool) + 's' : 'Mời trà ×' + G.teaLeft;
  const lw = (cooling ? 52 : 82) * K;
  ctx.fillStyle = (cooling || empty) ? 'rgba(120,110,115,.85)' : '#3a9a8a';
  rr(t.x - lw / 2, t.y + 32 * K, lw, 20 * K, 10 * K); ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.font = `800 ${13 * K}px 'Baloo 2', sans-serif`;
  ctx.fillText(label, t.x, t.y + 42 * K);

  // vòng tròn nguội dần quanh xe trà
  if (cooling) {
    const total = teaCooldown();
    const left = G.teaCool / total;
    ctx.strokeStyle = 'rgba(255,255,255,.75)';
    ctx.lineWidth = 4.5 * K;
    ctx.beginPath(); ctx.arc(t.x, t.y - 8 * K, 46 * K, 0, 7); ctx.stroke();
    ctx.strokeStyle = 'rgba(120,180,230,.95)';
    ctx.beginPath();
    ctx.arc(t.x, t.y - 8 * K, 46 * K, -Math.PI / 2, -Math.PI / 2 + (1 - left) * Math.PI * 2);
    ctx.stroke();
  }

  if (G.running && teaReady()) {
    glowRing(t.x - 46 * K, t.y - 52 * K, 92 * K, 106 * K, 16 * K, 'rgba(60,200,110,%A%)', 6);
    const n = G.customers.filter(c => c.patience < c.maxPatience - 0.05 &&
      ['sit', 'queue', 'done', 'awaitStaff', 'maskDone'].includes(c.state)).length;
    if (n > 1) {
      ctx.fillStyle = '#2a8a6a';
      ctx.font = `800 ${12.5 * K}px 'Baloo 2', sans-serif`;
      ctx.fillText('cả tiệm · ' + n + ' khách', t.x, t.y + 62 * K);
    }
  }
}

/* ══════════════ QUẦY LỄ TÂN + THU NGÂN ══════════════ */

function drawRegister() {
  const { ctx, K } = G;
  const r = G.register;
  const validTarget = G.selected && currentWish(G.selected) === 'pay';
  const front = G.queueSpots[0].taken;
  const frontReady = front && front.state === 'queue';

  // sàn gỗ hiên dưới quầy
  ctx.fillStyle = 'rgba(160,110,60,.16)';
  rr(r.x - r.w * 0.95, r.y - r.h * 1.0, r.w * 1.9, r.h * 2.0, 14 * K); ctx.fill();
  ctx.strokeStyle = 'rgba(110,70,30,.14)';
  ctx.lineWidth = 1.4 * K;
  for (let i = 1; i < 5; i++) {
    const yy = r.y - r.h * 1.0 + (r.h * 2.0 / 5) * i;
    ctx.beginPath(); ctx.moveTo(r.x - r.w * 0.92, yy); ctx.lineTo(r.x + r.w * 0.92, yy); ctx.stroke();
  }

  // vạch hàng chờ trước quầy
  const q0 = G.queueSpots[0], q2 = G.queueSpots[G.queueSpots.length - 1];
  ctx.fillStyle = 'rgba(255,220,150,.20)';
  rr(q2.x - 36 * K, q0.y - 34 * K, (q0.x - q2.x) + 72 * K, 96 * K, 18 * K); ctx.fill();
  ctx.strokeStyle = 'rgba(200,140,60,.35)';
  ctx.lineWidth = 2 * K;
  ctx.setLineDash([7 * K, 6 * K]);
  rr(q2.x - 36 * K, q0.y - 34 * K, (q0.x - q2.x) + 72 * K, 96 * K, 18 * K); ctx.stroke();
  ctx.setLineDash([]);

  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillStyle = 'rgba(110,70,30,.22)';
  ctx.beginPath(); ctx.ellipse(r.x, r.y + r.h * 0.66, r.w * 0.6, 14 * K, 0, 0, 7); ctx.fill();

  // thân quầy gỗ sẫm
  const bg = ctx.createLinearGradient(0, r.y - r.h * 0.2, 0, r.y + r.h * 0.6);
  bg.addColorStop(0, SC.wood);
  bg.addColorStop(1, SC.woodDark);
  ctx.fillStyle = bg;
  rr(r.x - r.w / 2, r.y - r.h * 0.18, r.w, r.h * 0.78, 12 * K); ctx.fill();
  ctx.fillStyle = 'rgba(80,40,20,.18)';
  rr(r.x - r.w * 0.36, r.y + r.h * 0.06, r.w * 0.72, r.h * 0.4, 7 * K); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,.14)';
  rr(r.x - r.w * 0.33, r.y + r.h * 0.09, r.w * 0.66, r.h * 0.1, 5 * K); ctx.fill();
  // mặt quầy
  ctx.fillStyle = SC.woodLight;
  rr(r.x - r.w / 2 - 8 * K, r.y - r.h * 0.36, r.w + 16 * K, r.h * 0.24, 8 * K); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,.45)';
  rr(r.x - r.w / 2 - 8 * K, r.y - r.h * 0.36, r.w + 16 * K, 6 * K, 3 * K); ctx.fill();

  // máy tính thu ngân màn hình xanh ngọc như trong video
  ctx.fillStyle = '#e8f0f2';
  rr(r.x - r.w * 0.30, r.y - r.h * 0.86, r.w * 0.36, r.h * 0.5, 6 * K); ctx.fill();
  ctx.strokeStyle = '#b0c4cc'; ctx.lineWidth = 1.6 * K;
  rr(r.x - r.w * 0.30, r.y - r.h * 0.86, r.w * 0.36, r.h * 0.5, 6 * K); ctx.stroke();
  ctx.fillStyle = '#7fd8d0';
  rr(r.x - r.w * 0.265, r.y - r.h * 0.80, r.w * 0.29, r.h * 0.32, 3 * K); ctx.fill();
  ctx.fillStyle = '#3aa89a';
  ctx.font = `800 ${15 * K}px 'Baloo 2', sans-serif`;
  ctx.fillText('$', r.x - r.w * 0.12, r.y - r.h * 0.63);
  // bàn phím
  ctx.fillStyle = '#d8e4e8';
  rr(r.x - r.w * 0.26, r.y - r.h * 0.34, r.w * 0.28, r.h * 0.09, 3 * K); ctx.fill();
  // chuông + hoa
  ctx.fillStyle = '#e8b73c';
  ctx.beginPath(); ctx.arc(r.x + r.w * 0.16, r.y - r.h * 0.40, 8 * K, Math.PI, 0); ctx.fill();
  rr(r.x + r.w * 0.16 - 9 * K, r.y - r.h * 0.40, 18 * K, 3 * K, 1.5 * K); ctx.fill();
  ctx.font = `${20 * K}px sans-serif`;
  ctx.fillText('🌺', r.x + r.w * 0.36, r.y - r.h * 0.48);
  // biển gỗ
  ctx.fillStyle = SC.sign;
  rr(r.x - 44 * K, r.y + r.h * 0.10, 88 * K, 18 * K, 6 * K); ctx.fill();
  ctx.font = `800 ${12 * K}px 'Baloo 2', sans-serif`;
  ctx.fillStyle = SC.signInk;
  ctx.fillText('LỄ TÂN', r.x, r.y + r.h * 0.2);

  if (validTarget || frontReady) {
    glowRing(r.x - r.w / 2 - 10 * K, r.y - r.h * 0.95, r.w + 20 * K, r.h * 1.6, 14 * K,
      validTarget ? 'rgba(60,200,110,%A%)' : 'rgba(255,180,0,%A%)', 7);
    if (frontReady && !validTarget) {
      const p = 0.5 + 0.5 * Math.sin(G.time * 7);
      ctx.font = `${(22 + p * 4) * K}px sans-serif`;
      ctx.fillText('👆', r.x, r.y - r.h * 1.2);
    }
  }
}

/* ══════════════ NỘI THẤT TỪNG Ô DỊCH VỤ ══════════════ */

// giường mát-xa trắng nệm dày như trong video
function massageBed(st) {
  const { ctx, K } = G;
  const { x, y, w, h } = st;
  const bx = x - w * 0.10, by = y + h * 0.02;
  const bw = w * 0.62, bh = h * 0.28;
  // chân gỗ
  ctx.fillStyle = SC.woodDark;
  rr(bx - bw * 0.42, by + bh * 0.5, 8 * K, h * 0.22, 3 * K); ctx.fill();
  rr(bx + bw * 0.36, by + bh * 0.5, 8 * K, h * 0.22, 3 * K); ctx.fill();
  ctx.fillStyle = 'rgba(110,70,30,.16)';
  ctx.beginPath(); ctx.ellipse(bx, by + bh * 0.95, bw * 0.55, 9 * K, 0, 0, 7); ctx.fill();
  // nệm trắng dày
  ctx.fillStyle = '#fffdfa';
  rr(bx - bw / 2, by - bh / 2, bw, bh, 10 * K); ctx.fill();
  ctx.strokeStyle = 'rgba(180,190,200,.5)'; ctx.lineWidth = 1.4 * K;
  rr(bx - bw / 2, by - bh / 2, bw, bh, 10 * K); ctx.stroke();
  ctx.fillStyle = 'rgba(210,225,235,.5)';
  rr(bx - bw / 2, by + bh * 0.18, bw, bh * 0.32, 6 * K); ctx.fill();
  // khăn xanh ngọc vắt ngang
  ctx.fillStyle = '#9ee0d0';
  rr(bx + bw * 0.04, by - bh / 2, bw * 0.3, bh, 6 * K); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,.4)';
  rr(bx + bw * 0.04, by - bh / 2, bw * 0.3, 4 * K, 2 * K); ctx.fill();
  // gối đầu bên trái
  ctx.fillStyle = '#f5f0e8';
  rr(bx - bw / 2 - 2 * K, by - bh * 0.36, bw * 0.2, bh * 0.72, 7 * K); ctx.fill();
  // khăn cuộn và tinh dầu
  ctx.fillStyle = '#fff';
  for (let i = 0; i < 2; i++) {
    ctx.beginPath(); ctx.arc(x + w * 0.26, by + bh * 0.85 + i * 11 * K, 6.5 * K, 0, 7); ctx.fill();
    ctx.strokeStyle = 'rgba(150,190,200,.6)'; ctx.lineWidth = 1.2 * K;
    ctx.beginPath(); ctx.arc(x + w * 0.26, by + bh * 0.85 + i * 11 * K, 3 * K, 0, 7); ctx.stroke();
  }
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.font = `${15 * K}px sans-serif`;
  ctx.fillText('🕯️', x - w * 0.40, y - h * 0.26);
  ctx.fillText('🧴', x - w * 0.32, y - h * 0.22);
}

// ghế mặt nạ màu vàng ngả lưng như trong video
function facialChair(st) {
  const { ctx, K } = G;
  const { x, y, w, h } = st;
  const cx = x - w * 0.10, cy = y + h * 0.02;
  const yel = '#f2d24a', yelD = '#d8b52c', yelL = '#f9e37c';
  ctx.fillStyle = 'rgba(110,70,30,.16)';
  ctx.beginPath(); ctx.ellipse(cx, cy + h * 0.26, w * 0.34, 9 * K, 0, 0, 7); ctx.fill();
  // chân trụ
  ctx.fillStyle = '#b09a6a';
  rr(cx - 6 * K, cy + h * 0.08, 12 * K, h * 0.16, 4 * K); ctx.fill();
  // tựa lưng ngả về bên trái
  ctx.fillStyle = yelD;
  ctx.beginPath();
  ctx.moveTo(cx - w * 0.40, cy - h * 0.30);
  ctx.quadraticCurveTo(cx - w * 0.46, cy - h * 0.02, cx - w * 0.30, cy + h * 0.04);
  ctx.lineTo(cx - w * 0.12, cy + h * 0.04);
  ctx.lineTo(cx - w * 0.20, cy - h * 0.30);
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = yel;
  ctx.beginPath();
  ctx.moveTo(cx - w * 0.37, cy - h * 0.27);
  ctx.quadraticCurveTo(cx - w * 0.42, cy - h * 0.02, cx - w * 0.28, cy + h * 0.02);
  ctx.lineTo(cx - w * 0.15, cy + h * 0.02);
  ctx.lineTo(cx - w * 0.22, cy - h * 0.27);
  ctx.closePath(); ctx.fill();
  // mặt ghế + phần để chân
  ctx.fillStyle = yel;
  rr(cx - w * 0.16, cy - h * 0.10, w * 0.52, h * 0.24, 10 * K); ctx.fill();
  ctx.fillStyle = yelL;
  rr(cx - w * 0.14, cy - h * 0.08, w * 0.48, h * 0.12, 8 * K); ctx.fill();
  ctx.fillStyle = yelD;
  rr(cx + w * 0.28, cy - h * 0.12, w * 0.10, h * 0.26, 6 * K); ctx.fill();
  // gối tựa đầu trắng
  ctx.fillStyle = '#fffdf6';
  ctx.beginPath(); ctx.ellipse(cx - w * 0.30, cy - h * 0.20, w * 0.09, h * 0.10, -0.5, 0, 7); ctx.fill();
  // xe đẩy dụng cụ
  ctx.fillStyle = '#eaf4f6';
  rr(x + w * 0.16, y + h * 0.14, w * 0.18, h * 0.2, 6 * K); ctx.fill();
  ctx.fillStyle = '#a8d8dc';
  rr(x + w * 0.16, y + h * 0.14, w * 0.18, 4 * K, 2 * K); ctx.fill();
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.font = `${13 * K}px sans-serif`;
  ctx.fillText('🧴', x + w * 0.20, y + h * 0.08);
  ctx.fillText('🥒', x + w * 0.30, y + h * 0.08);
}

// buồng tắm vòi sen: khung gỗ, cửa kính mờ, thấy bóng khách bên trong
function saunaRoom(st) {
  const { ctx, K } = G;
  const { x, y, w, h } = st;
  const cap = (st.slots || [null, null, null]).length;
  // khung gỗ buồng
  ctx.fillStyle = SC.wood;
  rr(x - w * 0.48, y - h * 0.52, w * 0.96, h * 0.72, 10 * K); ctx.fill();
  ctx.fillStyle = SC.woodDark;
  rr(x - w * 0.48, y - h * 0.52, w * 0.96, h * 0.12, 8 * K); ctx.fill();
  // từng buồng kính mờ
  for (let s = 0; s < cap; s++) {
    const wx = x + (s - (cap - 1) / 2) * w * 0.28;
    const gw = w * 0.22, gh = h * 0.5;
    const c = st.slots ? st.slots[s] : null;
    const busy = c && c.state === 'service';
    // kính mờ xanh
    ctx.fillStyle = busy ? 'rgba(190,228,240,.95)' : 'rgba(205,235,244,.85)';
    rr(wx - gw / 2, y - h * 0.36, gw, gh, 6 * K); ctx.fill();
    // bóng khách sau kính + tim bay như trong video
    if (busy) {
      ctx.fillStyle = 'rgba(70,110,140,.45)';
      ctx.beginPath(); ctx.arc(wx, y - h * 0.16, gw * 0.22, 0, 7); ctx.fill();
      ctx.beginPath();
      ctx.moveTo(wx - gw * 0.3, y + h * 0.14);
      ctx.quadraticCurveTo(wx, y - h * 0.08, wx + gw * 0.3, y + h * 0.14);
      ctx.closePath(); ctx.fill();
      const p = (G.time * 0.8 + s * 0.4) % 1;
      drawHeart(ctx, wx + Math.sin(G.time * 3 + s) * 5 * K, y - h * 0.28 - p * 14 * K, 5.5 * K,
        `rgba(240,90,130,${(1 - p).toFixed(2)})`);
      // vòi sen phun nước
      ctx.strokeStyle = 'rgba(140,200,230,.8)';
      ctx.lineWidth = 1.6 * K;
      for (let d = 0; d < 3; d++) {
        const off = ((G.time * 1.6 + d * 0.33) % 1);
        ctx.beginPath();
        ctx.moveTo(wx - 6 * K + d * 6 * K, y - h * 0.33 + off * 10 * K);
        ctx.lineTo(wx - 6 * K + d * 6 * K, y - h * 0.33 + off * 10 * K + 5 * K);
        ctx.stroke();
      }
    }
    // vệt sáng kính
    ctx.strokeStyle = 'rgba(255,255,255,.7)';
    ctx.lineWidth = 2.4 * K;
    ctx.beginPath();
    ctx.moveTo(wx - gw * 0.24, y - h * 0.30);
    ctx.lineTo(wx - gw * 0.06, y - h * 0.02);
    ctx.stroke();
    // tay nắm cửa
    ctx.fillStyle = '#c9d8de';
    rr(wx + gw * 0.3, y - h * 0.12, 3.5 * K, 12 * K, 2 * K); ctx.fill();
    // đầu vòi sen
    ctx.fillStyle = '#b8c8d0';
    rr(wx - 5 * K, y - h * 0.40, 10 * K, 5 * K, 2 * K); ctx.fill();
  }
  // biển gỗ
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillStyle = SC.sign;
  rr(x - 38 * K, y - h * 0.56, 76 * K, 17 * K, 5 * K); ctx.fill();
  ctx.font = `800 ${11 * K}px 'Baloo 2', sans-serif`;
  ctx.fillStyle = SC.signInk;
  ctx.fillText('VÒI SEN', x, y - h * 0.475);
}

// ghế làm móng gỗ + chậu ngâm chân như hai ghế trên-phải trong video
function nailTable(st) {
  const { ctx, K } = G;
  const { x, y, w, h } = st;
  const cx = x + w * 0.26, cy = y + h * 0.30; // ghế đặt đúng chỗ khách ngồi
  ctx.fillStyle = 'rgba(110,70,30,.16)';
  ctx.beginPath(); ctx.ellipse(cx, cy + 16 * K, 34 * K, 9 * K, 0, 0, 7); ctx.fill();
  // tựa lưng gỗ nan
  ctx.fillStyle = SC.wood;
  rr(cx - 24 * K, cy - 66 * K, 48 * K, 40 * K, 9 * K); ctx.fill();
  ctx.fillStyle = SC.woodLight;
  rr(cx - 19 * K, cy - 61 * K, 38 * K, 30 * K, 7 * K); ctx.fill();
  ctx.strokeStyle = 'rgba(110,60,20,.3)';
  ctx.lineWidth = 1.6 * K;
  for (const dx of [-9, 0, 9]) {
    ctx.beginPath(); ctx.moveTo(cx + dx * K, cy - 59 * K); ctx.lineTo(cx + dx * K, cy - 33 * K); ctx.stroke();
  }
  // đệm ngồi trắng
  ctx.fillStyle = '#fffdf6';
  rr(cx - 22 * K, cy - 4 * K, 44 * K, 14 * K, 6 * K); ctx.fill();
  // chậu ngâm chân trước ghế
  const bx2 = x - w * 0.14, by2 = y + h * 0.30;
  ctx.fillStyle = '#d8e8ec';
  ctx.beginPath(); ctx.ellipse(bx2, by2 + 10 * K, 26 * K, 12 * K, 0, 0, 7); ctx.fill();
  ctx.fillStyle = SC.water;
  ctx.beginPath(); ctx.ellipse(bx2, by2 + 8 * K, 21 * K, 9 * K, 0, 0, 7); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,.6)';
  ctx.beginPath(); ctx.ellipse(bx2 - 6 * K, by2 + 6 * K, 6 * K, 2.6 * K, 0.3, 0, 7); ctx.fill();
  // bàn con để lọ sơn
  ctx.fillStyle = SC.woodLight;
  rr(x - w * 0.42, y - h * 0.16, w * 0.2, h * 0.3, 6 * K); ctx.fill();
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.font = `${13 * K}px sans-serif`;
  ctx.fillText('💅', x - w * 0.36, y - h * 0.22);
  ctx.fillText('🧴', x - w * 0.27, y - h * 0.20);
}

function drawFurniture(st) {
  if (st.key === 'massage') massageBed(st);
  else if (st.key === 'facial') facialChair(st);
  else if (st.key === 'sauna') saunaRoom(st);
  else if (st.key === 'nail') nailTable(st);
}

/* ══════════════ Ô DỊCH VỤ ══════════════ */

function drawProgressBar(x, by, bw, prog, col) {
  const { ctx, K } = G;
  const bh = 12 * K;
  const bx = x - bw / 2;
  ctx.fillStyle = 'rgba(255,255,255,.9)';
  rr(bx - 2, by - 2, bw + 4, bh + 4, bh); ctx.fill();
  ctx.fillStyle = col;
  if (prog > 0.02) { rr(bx, by, bw * Math.min(1, prog), bh, bh / 2); ctx.fill(); }
}

function drawStationTile(st, dt) {
  const { ctx, K } = G;
  const svc = SERVICES[st.key];
  const x = st.x, y = st.y, w = st.w, h = st.h;
  let sx = 0;
  if (st.shakeT > 0) { st.shakeT -= dt; sx = Math.sin(st.shakeT * 60) * 5 * K; }
  ctx.save();
  ctx.translate(sx, 0);

  const occ = st.occupant;
  const occupants = st.slots ? st.slots.filter(Boolean) : (occ ? [occ] : []);
  const anyDone = occupants.some(c => c.state === 'done');
  const maskDone = occ && occ.state === 'maskDone';
  const validTarget = G.selected && stationFree(st) && currentWish(G.selected) === st.key;
  const swapTarget = !validTarget && G.selected && occ && canSwap(G.selected, occ);

  // thảm cói mềm dưới mỗi khu (thay cho ô màu)
  ctx.fillStyle = 'rgba(190,155,100,.24)';
  rr(x - w / 2, y - h / 2, w, h, 20 * K); ctx.fill();
  ctx.strokeStyle = 'rgba(150,110,60,.30)';
  ctx.lineWidth = 2 * K;
  rr(x - w / 2 + 4 * K, y - h / 2 + 4 * K, w - 8 * K, h - 8 * K, 16 * K); ctx.stroke();
  if (validTarget) glowRing(x - w / 2, y - h / 2, w, h, 20 * K, 'rgba(60,200,110,%A%)', 7);
  else if (swapTarget) glowRing(x - w / 2, y - h / 2, w, h, 20 * K, 'rgba(80,150,240,%A%)', 7);
  else if (anyDone || maskDone) glowRing(x - w / 2, y - h / 2, w, h, 20 * K, 'rgba(255,180,0,%A%)', 6);

  drawFurniture(st);

  // nhãn dịch vụ trên biển gỗ nhỏ
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  if (st.key !== 'sauna') {
    ctx.fillStyle = SC.sign;
    rr(x - 40 * K, y + h / 2 + 4 * K, 80 * K, 17 * K, 5 * K); ctx.fill();
    ctx.font = `800 ${11 * K}px 'Baloo 2', sans-serif`;
    ctx.fillStyle = SC.signInk;
    ctx.fillText(svc.icon + ' ' + svc.name, x, y + h / 2 + 12.5 * K);
  }

  for (const c of occupants) {
    if (c.state === 'walk') continue; // đang đi tới thì vẽ như khách thường
    drawCustomerAtStation(c, st);
  }

  // thanh tiến độ và lời nhắc
  const by = y - h / 2 - 20 * K;
  if (occ && occ.state === 'service' && svc.mode === 'staff') {
    const holding = G.holding && G.holding.stIdx === G.stations.indexOf(st);
    drawProgressBar(x, by, w * 0.72, occ.workProgress, holding ? '#ff4f86' : '#ff7ba3');
    const p = 0.5 + 0.5 * Math.sin(G.time * 9);
    ctx.font = `800 ${(15 + p * 3) * K}px 'Baloo 2', sans-serif`;
    ctx.fillStyle = holding ? '#c62a5e' : '#e0447a';
    ctx.fillText(holding ? 'ĐANG GIỮ… ✨' : 'GIỮ NGÓN TAY! 👆', x, by - 16 * K);
  } else if (occ && occ.state === 'masked') {
    drawProgressBar(x, by, w * 0.72, occ.serviceTimer / maskTime(), '#a58ae0');
  } else if (maskDone) {
    const p = 0.5 + 0.5 * Math.sin(G.time * 8);
    ctx.font = `800 ${(15 + p * 3) * K}px 'Baloo 2', sans-serif`;
    ctx.fillStyle = '#8a5ad0';
    ctx.fillText('GỠ MẶT NẠ! 👆', x, by - 4 * K);
  } else if (st.slots) {
    const cap = st.slots.length;
    st.slots.forEach((c, s) => {
      if (!c || c.state !== 'service') return;
      const wx = x + (s - (cap - 1) / 2) * w * 0.28;
      const prog = c.serviceTimer / saunaTime();
      ctx.strokeStyle = 'rgba(255,255,255,.85)';
      ctx.lineWidth = 4 * K;
      ctx.beginPath(); ctx.arc(wx, y - h * 0.62, 12 * K, 0, 7); ctx.stroke();
      ctx.strokeStyle = '#4cb8d8';
      ctx.beginPath(); ctx.arc(wx, y - h * 0.62, 12 * K, -Math.PI / 2, -Math.PI / 2 + prog * Math.PI * 2); ctx.stroke();
    });
  }

  ctx.restore();
}

/* ══════════════ KHÁCH TẠI Ô DỊCH VỤ ══════════════ */

function drawCustomerAtStation(c, st) {
  const { ctx, K } = G;

  // buồng tắm: chỉ thấy bóng sau kính (đã vẽ trong saunaRoom)
  if (st.key === 'sauna' && c.state === 'service') return;

  // nằm sấp trên giường mát-xa, đắp khăn
  if (st.key === 'massage' && c.state === 'service') {
    const bx = st.x - st.w * 0.10, by = st.y + st.h * 0.02;
    const bw = st.w * 0.62, bh = st.h * 0.28;
    const top = by - bh * 0.16;
    // lưng và vai lộ trên khăn
    ctx.fillStyle = c.look.skin;
    ctx.beginPath();
    ctx.moveTo(bx - bw * 0.3, top + bh * 0.3);
    ctx.quadraticCurveTo(bx - bw * 0.26, top - bh * 0.16, bx - bw * 0.1, top - bh * 0.1);
    ctx.lineTo(bx + bw * 0.06, top - bh * 0.06);
    ctx.lineTo(bx + bw * 0.06, top + bh * 0.3);
    ctx.closePath();
    ctx.fill();
    // khăn phủ từ lưng xuống chân
    ctx.fillStyle = '#fff6f9';
    ctx.beginPath();
    ctx.moveTo(bx - bw * 0.02, top - bh * 0.08);
    ctx.quadraticCurveTo(bx + bw * 0.2, top - bh * 0.22, bx + bw * 0.42, top - bh * 0.02);
    ctx.lineTo(bx + bw * 0.42, top + bh * 0.32);
    ctx.lineTo(bx - bw * 0.02, top + bh * 0.32);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(170,200,215,.55)'; ctx.lineWidth = 1.2 * K;
    ctx.stroke();
    ctx.fillStyle = 'rgba(158,224,208,.5)';
    rr(bx + bw * 0.12, top - bh * 0.14, bw * 0.12, bh * 0.46, 3 * K); ctx.fill();
    // bàn chân nhô ra cuối khăn
    ctx.fillStyle = c.look.skin;
    ctx.beginPath(); ctx.ellipse(bx + bw * 0.46, top + bh * 0.1, 5 * K, 4 * K, 0, 0, 7); ctx.fill();
    ctx.beginPath(); ctx.ellipse(bx + bw * 0.46, top + bh * 0.24, 5 * K, 4 * K, 0, 0, 7); ctx.fill();
    // cánh tay buông xuống cạnh giường
    ctx.strokeStyle = c.look.skin;
    ctx.lineWidth = 4.4 * K;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(bx - bw * 0.2, top + bh * 0.22);
    ctx.quadraticCurveTo(bx - bw * 0.24, top + bh * 0.5, bx - bw * 0.16, top + bh * 0.62);
    ctx.stroke();
    drawHeadOnly(ctx, bx - bw * 0.4, top + bh * 0.02, 12.5 * K, c.lookTowel, {});
    return;
  }

  // ngả trên ghế vàng đắp mặt nạ
  if (st.key === 'facial' && (c.state === 'masked' || c.state === 'maskDone')) {
    const cx = st.x - st.w * 0.10, cy = st.y + st.h * 0.02;
    const top = cy - st.h * 0.13;
    // thân khoác áo choàng nằm ngả trên ghế
    ctx.fillStyle = c.look.dressColor;
    ctx.beginPath();
    ctx.moveTo(cx - st.w * 0.22, top + st.h * 0.02);
    ctx.quadraticCurveTo(cx - st.w * 0.1, top - st.h * 0.06, cx + st.w * 0.18, top - st.h * 0.02);
    ctx.lineTo(cx + st.w * 0.18, top + st.h * 0.16);
    ctx.lineTo(cx - st.w * 0.22, top + st.h * 0.16);
    ctx.closePath(); ctx.fill();
    // khăn bông đắp ngang người
    ctx.fillStyle = '#fff6f9';
    rr(cx - st.w * 0.02, top - st.h * 0.04, st.w * 0.22, st.h * 0.2, 6 * K); ctx.fill();
    ctx.strokeStyle = 'rgba(170,200,215,.5)'; ctx.lineWidth = 1.2 * K;
    rr(cx - st.w * 0.02, top - st.h * 0.04, st.w * 0.22, st.h * 0.2, 6 * K); ctx.stroke();
    drawHeadOnly(ctx, cx - st.w * 0.30, top + st.h * 0.01, 12.5 * K, c.lookTowel, { mask: true });
    return;
  }

  // làm móng: ngồi trên ghế gỗ, chân ngâm chậu
  if (st.key === 'nail' && c.state === 'service') {
    drawPerson(G.ctx, c.x, c.y, K * 0.92, c.look, {
      seated: true, bob: Math.sin(c.bobT) * 1.2 * K, mood: 1, happy: true,
    });
    return;
  }

  // các trạng thái còn lại: đứng cạnh ô
  drawPerson(G.ctx, c.x, c.y, K, c.look, {
    bob: Math.sin(c.bobT) * 1.5 * K,
    mood: c.patience / c.maxPatience,
    happy: c.state === 'done',
  });
}

/* ══════════════ CÔ CHỦ TIỆM ══════════════ */

function drawStaffPerson(s) {
  const { ctx, K } = G;
  const moving = (s.state === 'walk' || s.state === 'idle') && Math.hypot(s.tx - s.x, s.ty - s.y) > 3;
  const working = s.state === 'working' || s.state === 'action';
  const bob = moving ? Math.abs(Math.sin(s.bobT)) * 5 * K
    : working ? Math.abs(Math.sin(G.time * 10)) * 2.5 * K
    : Math.sin(s.bobT) * 1.5 * K;
  drawPerson(ctx, s.x, s.y, K, HERO_LOOK, {
    bob, mood: 1, happy: true,
    swing: moving ? Math.sin(s.bobT) * 0.9 : 0,
  });
  if (working) {
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.font = `${15 * K}px sans-serif`;
    ctx.fillText('✨', s.x + 26 * K, s.y - 34 * K + Math.sin(G.time * 12) * 4 * K);
    ctx.fillText('💫', s.x - 24 * K, s.y - 46 * K + Math.cos(G.time * 10) * 4 * K);
  }
}

/* ══════════════ TIM & BONG BÓNG ══════════════ */

function drawCustomerUi(c) {
  const { ctx, K } = G;
  if (c.state === 'exitHappy' || c.state === 'exitAngry' || c.state === 'walk') return;
  const showHearts = c.state === 'sit' || c.state === 'done' || c.state === 'queue' ||
    c.state === 'awaitStaff' || c.state === 'maskDone' || c.state === 'maskPick';
  const showBubble = c.state === 'sit' || c.state === 'done' || c.state === 'queue';
  if (!showHearts && !showBubble && G.selected !== c) return;

  const headY = c.y - 64 * K;
  const hr = 20 * K;

  if (G.selected === c) {
    const p = 0.5 + 0.5 * Math.sin(G.time * 7);
    ctx.strokeStyle = `rgba(60,200,110,${0.55 + p * 0.45})`;
    ctx.lineWidth = 4 * K;
    ctx.beginPath(); ctx.ellipse(c.x, c.y + 16 * K, (32 + p * 4) * K, (11 + p * 2) * K, 0, 0, 7); ctx.stroke();
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.font = `${24 * K}px sans-serif`;
    ctx.fillText('🔽', c.x, c.y - 128 * K - p * 6 * K);
  }

  if (showHearts) {
    const n = Math.ceil(c.maxPatience);
    const filled = Math.ceil(Math.max(0, c.patience));
    const hs = 9 * K, gap = 11.5 * K;
    const hx0 = c.x - ((n - 1) * gap) / 2;
    const hy = headY - hr - 23 * K;
    const low = filled <= 2;
    const blink = low && Math.sin(G.time * 9) > 0;
    for (let i = 0; i < n; i++) {
      drawHeart(ctx, hx0 + i * gap, hy, hs,
        i < filled ? (low && blink ? '#ff2a55' : '#ff5f8f') : 'rgba(150,130,140,.3)');
    }
  }

  // đổi chỗ được với khách đang chọn → hiện dấu 🔄
  if (G.selected && G.selected !== c && canSwap(G.selected, c)) {
    const p = 0.5 + 0.5 * Math.sin(G.time * 6);
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.font = `${(21 + p * 4) * K}px sans-serif`;
    ctx.fillText('🔄', c.x, c.y - 118 * K);
  }

  if (!showBubble) return;
  const wish = currentWish(c);
  const icon = wish === 'pay' ? PAY_ICON : SERVICES[wish].icon;
  const by = headY - hr - 60 * K + Math.sin(G.time * 3 + c.id) * 2.5 * K;
  ctx.fillStyle = 'rgba(255,255,255,.96)';
  ctx.beginPath(); ctx.arc(c.x, by, 22 * K, 0, 7); ctx.fill();
  ctx.beginPath();
  ctx.moveTo(c.x - 7 * K, by + 18 * K);
  ctx.lineTo(c.x, by + 30 * K);
  ctx.lineTo(c.x + 7 * K, by + 18 * K);
  ctx.closePath(); ctx.fill();
  ctx.strokeStyle = G.selected === c ? 'rgba(60,200,110,.95)' : 'rgba(120,190,215,.8)';
  ctx.lineWidth = 2.5 * K;
  ctx.beginPath(); ctx.arc(c.x, by, 22 * K, 0, 7); ctx.stroke();
  ctx.font = `${23 * K}px sans-serif`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(icon, c.x, by + 1);
  const left = c.wishes.length - c.wishIndex;
  if (left > 1) {
    ctx.fillStyle = '#2a9aae';
    ctx.beginPath(); ctx.arc(c.x + 18 * K, by - 15 * K, 9.5 * K, 0, 7); ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = `800 ${12 * K}px 'Baloo 2', sans-serif`;
    ctx.fillText(left, c.x + 18 * K, by - 14.5 * K);
  }
}

/* ══════════════ SỐ THỨ TỰ VIỆC ══════════════ */

function drawTaskBadges() {
  const { ctx, K } = G;
  G.tasks.forEach((t, i) => {
    let bx, by;
    if (t.type === 'checkout') {
      bx = G.register.x + G.register.w * 0.42;
      by = G.register.y - G.register.h * 0.9;
    } else if (t.type === 'tea') {
      bx = G.teaCart.x + 36 * K;
      by = G.teaCart.y - 40 * K;
    } else {
      const st = G.stations[t.stIdx];
      if (!st) return;
      bx = st.x + st.w / 2 - 14 * K;
      by = st.y - st.h / 2 - 2 * K;
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

/* ══════════════ MỘT KHUNG HÌNH ══════════════ */

export function draw(dt) {
  const { ctx, W, H, K } = G;
  T = getTheme();
  ctx.clearRect(0, 0, W, H);
  drawScene();

  // ghế băng chờ: tựa lưng → khách ngồi → mặt ghế
  drawBenchBack();
  for (const s of G.seats) {
    const c = s.taken;
    if (c && c.state === 'sit') {
      drawPerson(ctx, c.x, c.y, K, c.look, {
        seated: true,
        bob: Math.sin(c.bobT) * 1.4 * K,
        mood: c.patience / c.maxPatience,
      });
    }
  }
  drawBenchFront();

  // chỗ trống trên ghế băng sáng lên khi đang chọn khách
  if (G.running && G.selected && ['sit', 'done', 'awaitStaff', 'queue'].includes(G.selected.state)) {
    for (const st of G.seats) {
      if (st.taken) continue;
      glowRing(st.x - 30 * K, st.y - 52 * K, 60 * K, 80 * K, 14 * K, 'rgba(80,150,240,%A%)', 5);
    }
  }

  drawTeaCart();
  drawRegister();
  for (const st of G.stations) drawStationTile(st, dt);

  // khách đang đi / đứng chờ ngoài ô + cô chủ tiệm, xếp theo chiều sâu
  const actors = [];
  for (const c of G.customers) {
    const atStation = c.anchor && c.anchor.kind === 'station' && c.state !== 'walk';
    const seated = c.anchor && c.anchor.kind === 'seat' && c.state === 'sit';
    if (atStation || seated) continue;
    const moving = c.state === 'walk' || c.state === 'exitHappy' || c.state === 'exitAngry';
    actors.push({
      y: c.y,
      draw: () => drawPerson(ctx, c.x, c.y, K, c.look, {
        bob: moving ? Math.abs(Math.sin(c.bobT)) * 5 * K : Math.sin(c.bobT) * 1.5 * K,
        mood: c.state === 'exitAngry' ? 0 : c.patience / c.maxPatience,
        happy: c.state === 'exitHappy' || c.state === 'done',
        swing: moving ? Math.sin(c.bobT) * 0.9 : 0,
      }),
    });
  }
  for (const s of G.staff) actors.push({ y: s.y, draw: () => drawStaffPerson(s) });
  actors.sort((a, b) => a.y - b.y);
  for (const a of actors) a.draw();

  for (const c of G.customers) drawCustomerUi(c);
  drawTaskBadges();
  drawParticles();
}
