// ── Xử lý chạm: mời khách vào bàn, ghi món, bưng món, thu tiền, dọn bàn ──

import { G } from './state.js';
import { plateSpot, bonusSpot, N_PLATES } from './layout.js';
import { enqueueTask, waterTarget } from './staff.js';
import { seatCustomer } from './customers.js';
import { cheerCook } from './kitchen.js';
import { ac, sSelect, sNope, sOrder } from './audio.js';
import { setHint } from './ui.js';
import { openMinigame } from './minigame.js';

export function bindInput() {
  G.canvas.addEventListener('pointerdown', onTap, { passive: false });
}

function tapCustomer(c) {
  const idx = c.anchor && c.anchor.kind === 'table' ? c.anchor.idx : -1;
  if (c.state === 'wait') {
    G.selected = (G.selected === c) ? null : c;
    if (G.selected) sSelect();
    setHint();
    return true;
  }
  if ((c.state === 'menu' || c.state === 'order') && idx >= 0) {
    if (!enqueueTask('order', idx, null)) sNope();
    else setHint();
    return true;
  }
  if (c.state === 'bill' && idx >= 0) {
    if (!enqueueTask('bill', idx, null)) sNope();
    else setHint();
    return true;
  }
  return false;
}

function onTap(e) {
  e.preventDefault();
  ac();
  if (!G.running || G.paused) return;
  const x = e.clientX, y = e.clientY;
  const K = G.K;

  // 1) chuông đơn đặc biệt → mini-game
  if (G.bonusReady) {
    const b = bonusSpot();
    if (Math.hypot(x - b.x, y - b.y) < 52 * K) { openMinigame(); return; }
  }

  // 2) chạm khách
  for (let i = G.customers.length - 1; i >= 0; i--) {
    const c = G.customers[i];
    if (c.state.startsWith('exit')) continue;
    if (Math.hypot(x - c.x, y - (c.y - 45 * K)) < 52 * K) {
      if (tapCustomer(c)) return;
      break;
    }
  }

  // 3) chạm bàn
  for (let i = 0; i < G.tables.length; i++) {
    const t = G.tables[i];
    if (Math.abs(x - t.x) > t.w * 0.62 || Math.abs(y - t.y) > t.h * 0.78) continue;
    if (t.dirty) {
      if (!enqueueTask('clean', i, null)) sNope();
      else setHint();
      return;
    }
    if (t.cust) { if (!tapCustomer(t.cust)) sNope(); return; }
    if (G.selected && G.selected.state === 'wait') {
      seatCustomer(G.selected, t);
      sOrder();
      setHint();
    } else { sNope(); t.shakeT = 0.3; }
    return;
  }

  // 4) chạm đĩa món ăn trên quầy bếp
  for (let i = 0; i < N_PLATES; i++) {
    if (!G.plates[i]) continue;
    const p = plateSpot(i);
    if (Math.hypot(x - p.x, y - p.y) < 40 * K) {
      if (!enqueueTask('serve', null, i)) sNope();
      else setHint();
      return;
    }
  }

  // 5) chạm quầy bếp → cổ vũ đầu bếp nấu nhanh hơn
  const ps = G.pass;
  if (x > ps.x - ps.w * 0.7 && y > ps.y - ps.h * 0.55 && y < ps.y + ps.h * 0.55) {
    if (!cheerCook()) sNope();
    return;
  }

  // 6) chạm quầy nước → mời nước khách sốt ruột nhất
  const w = G.water;
  if (Math.hypot(x - w.x, y - w.y) < 58 * K) {
    if (!waterTarget() || !enqueueTask('water', null, null)) sNope();
    return;
  }

  // 7) chạm chỗ trống → bỏ chọn
  G.selected = null;
  setHint();
}
