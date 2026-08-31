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

  // ghế chờ bên trái — mở tiệm chỉ có 2 ghế, mua nâng cấp mới có thêm.
  // Nhóm ghế được canh giữa khu chờ; ghế so le 2 cột cho đỡ chồng hình.
  const oldSeats = G.seats;
  const nSeats = 2 + extraSeats();
  const band = 0.58;
  const seatGap = nSeats > 1 ? Math.min(0.14, band / (nSeats - 1)) : 0;
  const seatTop = 0.29 + (band - seatGap * (nSeats - 1)) / 2;
  G.seats = [];
  for (let i = 0; i < nSeats; i++) {
    G.seats.push({
      x: W * (0.06 + (i % 2) * 0.065),
      y: topPad + (H - topPad) * (seatTop + seatGap * i),
      taken: oldSeats[i] ? oldSeats[i].taken : null,
    });
  }

  // xe trà cạnh khu chờ — mời trà giúp khách hồi tim
  G.teaCart = { x: W * 0.165, y: topPad + (H - topPad) * 0.90 };

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
  // phòng xông hơi rộng gấp rưỡi vì chứa nhiều khách
  if (G.stations.length) {
    const zL = W * 0.24, zR = W * 0.84;
    const n = G.stations.length;
    const row1 = Math.ceil(n / 2), row2 = n - row1;
    const wf = (st) => st.key === 'sauna' ? 1.55 : 1;
    // bề rộng một ô: lấy theo hàng "nặng" nhất để hàng nhiều ô nhất vẫn vừa khung
    const rows = [G.stations.slice(0, row1), G.stations.slice(row1)];
    let tw = 196 * K;
    for (const items of rows) {
      if (!items.length) continue;
      const wSum = items.reduce((a, st) => a + wf(st), 0);
      const gaps = (items.length - 1) * 26 * K;
      tw = Math.min(tw, (zR - zL - gaps) / wSum);
    }
    const th = 128 * K;
    const y1 = topPad + (H - topPad) * 0.30;
    const y2 = topPad + (H - topPad) * 0.72;
    const place = (count, y, startIdx) => {
      const items = G.stations.slice(startIdx, startIdx + count);
      const total = items.reduce((a, st) => a + tw * wf(st), 0) + (count - 1) * 26 * K;
      let x = (zL + zR) / 2 - total / 2;
      for (const st of items) {
        const w = tw * wf(st);
        st.x = x + w / 2;
        st.y = y;
        st.w = w; st.h = th;
        x += w + 26 * K;
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
      // mỗi khách một suất trong phòng xông
      const slot = c.anchor.slot || 0;
      return { x: s.x + (slot - 1) * s.w * 0.26, y: s.y + s.h * 0.30 };
    }
    return { x: s.x + s.w * 0.26, y: s.y + s.h * 0.30 };
  }
  if (c.anchor.kind === 'queue') { const q = G.queueSpots[c.anchor.idx]; return q ? { x: q.x, y: q.y } : null; }
  return null;
}
