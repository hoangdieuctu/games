// ── Bố cục: kích thước canvas và toạ độ mọi vị trí trong nhà hàng ──

import { G } from './state.js';

export const N_PLATES = 4;

export function layout() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  G.W = window.innerWidth; G.H = window.innerHeight;
  G.canvas.width = G.W * dpr; G.canvas.height = G.H * dpr;
  G.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  G.K = Math.max(0.62, Math.min(1.15, G.H / 820));
  const { W, H, K } = G;

  const topPad = 74;
  const py = (f) => topPad + (H - topPad) * f; // toạ độ theo phần trăm vùng chơi

  G.door = { x: -60 * K, y: py(0.66) };

  // hàng khách đứng chờ dọc mép trái, so le 2 cột cho đỡ chồng hình
  const oldWait = G.waitSpots;
  G.waitSpots = [];
  for (let i = 0; i < 4; i++) {
    G.waitSpots.push({
      x: W * (0.072 + (i % 2) * 0.052),
      y: py(0.34 + 0.155 * i),
      taken: oldWait[i] ? oldWait[i].taken : null,
    });
  }

  // quầy nước mời khách chờ
  G.water = { x: W * 0.185, y: py(0.10) };

  // khu bếp bên phải: quầy đặt món + anh đầu bếp đứng nấu
  const zoneW = 196 * K;
  G.pass = { x: W - zoneW + 50 * K, y: py(0.5), w: zoneW, h: (H - topPad) * 0.82 };
  G.chef = G.chef || { x: 0, y: 0, bobT: 0 };
  G.chef.x = W - zoneW * 0.30;
  G.chef.y = py(0.40);

  // bàn ăn ở giữa
  if (G.tables.length) {
    const zL = W * 0.22, zR = W - G.pass.w - 26 * K;
    const n = G.tables.length;
    const row1 = Math.ceil(n / 2), row2 = n - row1;
    const tw = Math.min(158 * K, (zR - zL) / Math.max(row1, 1) - 26 * K);
    const th = 104 * K;
    const y1 = py(0.30), y2 = py(0.76);
    const place = (count, y, start) => {
      const total = count * tw + (count - 1) * 30 * K;
      let x = (zL + zR) / 2 - total / 2 + tw / 2;
      for (let i = 0; i < count; i++) {
        const t = G.tables[start + i];
        t.x = x; t.y = y; t.w = tw; t.h = th;
        x += tw + 30 * K;
      }
    };
    place(row1, y1, 0);
    if (row2 > 0) place(row2, y2, row1);
  }

  // khách đứng yên thì dịch về đúng chỗ neo mới
  for (const c of G.customers) {
    const a = anchorPos(c);
    if (!a) continue;
    if (c.state === 'walk') { c.tx = a.x; c.ty = a.y; }
    else if (!c.state.startsWith('exit')) { c.x = a.x; c.y = a.y; }
  }
  for (const s of G.staff) {
    if (s.state === 'idle') { s.tx = s.x; s.ty = s.y; }
  }
}

// vị trí ô đặt món đã nấu xong trên quầy bếp
export function plateSpot(i) {
  const p = G.pass;
  const top = p.y - p.h * 0.34;
  const gap = (p.h * 0.68) / (N_PLATES - 1);
  return { x: p.x, y: top + i * gap };
}

// chuông đơn đặc biệt (mini-game) đặt trên đầu quầy bếp
export function bonusSpot() {
  return { x: G.pass.x, y: G.pass.y - G.pass.h * 0.47 };
}

export function anchorPos(c) {
  if (c.anchor == null) return null;
  if (c.anchor.kind === 'wait') {
    const s = G.waitSpots[c.anchor.idx];
    return s ? { x: s.x, y: s.y } : null;
  }
  if (c.anchor.kind === 'table') {
    const t = G.tables[c.anchor.idx];
    return t ? { x: t.x, y: t.y - t.h * 0.16 } : null;
  }
  return null;
}

// chỗ bạn phục vụ đứng khi làm việc tại bàn
export function tableSpot(t) {
  return { x: t.x - t.w * 0.62, y: t.y + t.h * 0.42 };
}
