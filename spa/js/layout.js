// ── Bố cục sân trong biệt thự spa bên bờ biển (theo kiểu Sally's Spa):
//    ghế mặt nạ vàng trên-trái · buồng tắm vòi sen giữa-trên · ghế làm móng
//    trên-phải · giường mát-xa ở giữa · đài phun nước · ghế băng chờ phía dưới
//    · quầy lễ tân + thu ngân dưới-phải · xe trà dưới-trái ──

import { G } from './state.js';
import { extraSeats } from './upgrades.js';

// vị trí đặt sẵn cho từng loại ô dịch vụ (tỉ lệ theo màn hình)
const ZONES = {
  facial:  [[0.135, 0.20], [0.295, 0.20], [0.135, 0.52]],
  sauna:   [[0.50, 0.10]],
  nail:    [[0.685, 0.20], [0.845, 0.20], [0.895, 0.52]],
  massage: [[0.545, 0.50], [0.72, 0.50], [0.37, 0.50], [0.545, 0.80]],
};

export function layout() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  G.W = window.innerWidth; G.H = window.innerHeight;
  G.canvas.width = G.W * dpr; G.canvas.height = G.H * dpr;
  G.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  G.K = Math.max(0.62, Math.min(1.15, G.H / 820));
  const { W, H, K } = G;

  const topPad = 78;
  const zoneH = H - topPad;
  const zy = (f) => topPad + zoneH * f;

  // khách bước vào từ lối đi bên trái (con đường từ bãi biển)
  G.door = { x: -60 * K, y: H * 0.66 };

  // ghế băng gỗ chờ phía dưới, ngồi thành hàng ngang
  const oldSeats = G.seats;
  const nSeats = 2 + extraSeats();
  const benchY = zy(0.835);
  const seatGap = Math.min(72 * K, (W * 0.34) / Math.max(1, nSeats - 1));
  const benchX0 = W * 0.31 - (seatGap * (nSeats - 1)) / 2; // hàng ghế canh giữa quanh 0.31W
  G.seats = [];
  for (let i = 0; i < nSeats; i++) {
    G.seats.push({
      x: benchX0 + i * seatGap,
      y: benchY,
      taken: oldSeats[i] ? oldSeats[i].taken : null,
    });
  }

  // xe trà góc dưới-trái, cạnh xe chở mỹ phẩm
  G.teaCart = { x: W * 0.085, y: zy(0.80) };

  // quầy lễ tân + thu ngân dưới-phải (có máy tính như trong video)
  const rw = 200 * K, rh = 96 * K;
  G.register = { x: W * 0.845, y: zy(0.80), w: rw, h: rh };
  const oldQ = G.queueSpots;
  G.queueSpots = [];
  for (let i = 0; i < 3; i++) {
    G.queueSpots.push({
      x: G.register.x - rw * 0.62 - 10 * K - i * 64 * K,
      y: G.register.y + rh * 0.14,
      taken: oldQ[i] ? oldQ[i].taken : null,
    });
  }

  // đài phun nước trang trí ở khoảng sân giữa (chỉ để ngắm)
  G.fountain = { x: W * 0.40, y: zy(0.42), r: 70 * K };

  // các ô dịch vụ đặt theo khu như trong video
  if (G.stations.length) {
    const tw = Math.min(185 * K, W * 0.145);
    const th = 122 * K;
    const used = { facial: 0, sauna: 0, nail: 0, massage: 0 };
    const overflow = [];
    for (const st of G.stations) {
      const zone = ZONES[st.key] || ZONES.massage;
      const slot = zone[used[st.key]];
      if (slot) {
        used[st.key]++;
        st.x = W * slot[0];
        st.y = zy(slot[1]) + th / 2;
        st.w = st.key === 'sauna' ? tw * 1.55 : tw;
        st.h = th;
      } else {
        overflow.push(st);
      }
    }
    // ô vượt quá chỗ đặt sẵn: xếp thành hàng giữa sân
    overflow.forEach((st, i) => {
      st.x = W * (0.30 + i * 0.16);
      st.y = zy(0.66) + th / 2;
      st.w = st.key === 'sauna' ? tw * 1.55 : tw;
      st.h = th;
    });
  }

  // khách đang đứng yên thì dịch về đúng chỗ neo mới
  for (const c of G.customers) {
    const a = anchorPos(c);
    if (!a) continue;
    if (c.state === 'walk' || c.state === 'enter') { c.tx = a.x; c.ty = a.y; }
    else if (c.state !== 'exitHappy' && c.state !== 'exitAngry') { c.x = a.x; c.y = a.y; }
  }

  // nhân viên đứng yên thì về lại chỗ chờ mới
  for (const s of G.staff) {
    if (s.state === 'idle') { s.tx = s.x; s.ty = s.y; }
  }
}

export function anchorPos(c) {
  if (c.anchor == null) return null;
  const K = G.K;
  if (c.anchor.kind === 'seat') { const s = G.seats[c.anchor.idx]; return s ? { x: s.x, y: s.y - 14 * K } : null; }
  if (c.anchor.kind === 'station') {
    const s = G.stations[c.anchor.idx];
    if (!s) return null;
    if (s.key === 'sauna') {
      // mỗi khách một buồng tắm
      const slot = c.anchor.slot || 0;
      return { x: s.x + (slot - 1) * s.w * 0.28, y: s.y + s.h * 0.30 };
    }
    return { x: s.x + s.w * 0.26, y: s.y + s.h * 0.30 };
  }
  if (c.anchor.kind === 'queue') { const q = G.queueSpots[c.anchor.idx]; return q ? { x: q.x, y: q.y } : null; }
  return null;
}
