// ── Bố cục: kích thước canvas và toạ độ neo của mọi vị trí trong tiệm ──

import { G } from './state.js';
import { extraSeats } from './upgrades.js';

export function layout() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  G.W = window.innerWidth; G.H = window.innerHeight;
  G.canvas.width = G.W * dpr; G.canvas.height = G.H * dpr;
  G.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  G.K = Math.max(0.62, Math.min(1.15, G.H / 820));
  const { W, H, K } = G;

  const topPad = 74;
  G.door = { x: -60 * K, y: H * 0.52 };

  // ghế chờ bên trái — giữ lại khách đang ngồi khi đổi kích thước
  // ghế đầu hạ thấp xuống để bong bóng ước muốn của khách không bị HUD che
  const oldSeats = G.seats;
  const nSeats = 5 + extraSeats();
  const seatGap = Math.min(0.15, 0.62 / (nSeats - 1));
  G.seats = [];
  for (let i = 0; i < nSeats; i++) {
    G.seats.push({
      x: W * (0.06 + (i % 2) * 0.065), // so le 2 cột cho đỡ chồng hình
      y: topPad + (H - topPad) * (0.24 + seatGap * i),
      taken: oldSeats[i] ? oldSeats[i].taken : null,
    });
  }

  // quầy thu ngân trên phải
  const rw = 168 * K, rh = 92 * K;
  G.register = { x: W * 0.885, y: topPad + (H - topPad) * 0.20, w: rw, h: rh };
  const oldQ = G.queueSpots;
  G.queueSpots = [];
  for (let i = 0; i < 3; i++) {
    G.queueSpots.push({
      x: G.register.x - rw * 0.55 - 8 * K - i * 66 * K,
      y: G.register.y + rh * 0.22,
      taken: oldQ[i] ? oldQ[i].taken : null,
    });
  }

  // các ô dịch vụ ở giữa (giữ nguyên đối tượng station, chỉ cập nhật toạ độ)
  if (G.stations.length) {
    const zL = W * 0.21, zR = W * 0.84;
    const n = G.stations.length;
    const row1 = Math.ceil(n / 2), row2 = n - row1;
    const tw = Math.min(196 * K, (zR - zL) / Math.max(row1, 2) - 12);
    const th = 128 * K;
    const y1 = topPad + (H - topPad) * 0.30;
    const y2 = topPad + (H - topPad) * 0.72;
    const place = (count, y, startIdx) => {
      const total = count * tw + (count - 1) * 26 * K;
      const x0 = (zL + zR) / 2 - total / 2;
      for (let i = 0; i < count; i++) {
        const st = G.stations[startIdx + i];
        st.x = x0 + i * (tw + 26 * K) + tw / 2;
        st.y = y;
        st.w = tw; st.h = th;
      }
    };
    place(row1, y1, 0);
    if (row2 > 0) place(row2, y2, row1);
  }

  // khách đang đứng yên thì dịch về đúng chỗ neo mới
  for (const c of G.customers) {
    const a = anchorPos(c);
    if (!a) continue;
    if (c.state === 'walk' || c.state === 'enter') { c.tx = a.x; c.ty = a.y; }
    else if (c.state !== 'exitHappy' && c.state !== 'exitAngry') { c.x = a.x; c.y = a.y; }
  }
}

export function anchorPos(c) {
  if (c.anchor == null) return null;
  const K = G.K;
  if (c.anchor.kind === 'seat')    { const s = G.seats[c.anchor.idx]; return s ? { x: s.x, y: s.y - 14 * K } : null; }
  if (c.anchor.kind === 'station') { const s = G.stations[c.anchor.idx]; return s ? { x: s.x + s.w * 0.26, y: s.y + s.h * 0.30 } : null; }
  if (c.anchor.kind === 'queue')   { const q = G.queueSpots[c.anchor.idx]; return q ? { x: q.x, y: q.y } : null; }
  return null;
}
