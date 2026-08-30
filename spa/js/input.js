// ── Xử lý chạm: chọn khách, giao dịch vụ, chạm làm việc, thu tiền ──

import { G } from './state.js';
import { SERVICES } from './config.js';
import { currentWish, assignToStation, assignToQueue, workTap, checkout } from './customers.js';
import { ac, sSelect, sNope, sTapWork } from './audio.js';
import { setHint, advanceTutorial } from './ui.js';

export function bindInput() {
  G.canvas.addEventListener('pointerdown', onTap, { passive: false });
}

function onTap(e) {
  e.preventDefault();
  ac();
  if (!G.running) return;
  const x = e.clientX, y = e.clientY;
  const K = G.K;

  // 1) chạm khách?
  let hit = null;
  for (let i = G.customers.length - 1; i >= 0; i--) {
    const c = G.customers[i];
    if (c.state === 'exitHappy' || c.state === 'exitAngry' || c.state === 'pay') continue;
    if (Math.hypot(x - c.x, y - (c.y - 45 * K)) < 55 * K) { hit = c; break; }
  }
  if (hit) {
    if (hit.state === 'service' && hit.anchor) {
      const st = G.stations[hit.anchor.idx];
      if (SERVICES[st.key].mode === 'tap') { sTapWork(); workTap(hit, st); }
      return;
    }
    if (hit.state === 'sit' || hit.state === 'done') {
      G.selected = (G.selected === hit) ? null : hit;
      if (G.selected) { sSelect(); advanceTutorial(1); }
      setHint();
    }
    return;
  }

  // 2) chạm ô dịch vụ?
  for (const st of G.stations) {
    if (Math.abs(x - st.x) < st.w / 2 + 10 && Math.abs(y - st.y) < st.h / 2 + 26 * K) {
      const occ = st.occupant;
      if (occ && occ.state === 'service' && SERVICES[st.key].mode === 'tap') {
        sTapWork(); workTap(occ, st);
        return;
      }
      if (occ && occ.state === 'done') {
        G.selected = (G.selected === occ) ? null : occ;
        if (G.selected) sSelect();
        setHint();
        return;
      }
      if (!occ && G.selected) {
        if (currentWish(G.selected) === st.key) assignToStation(G.selected, st);
        else { sNope(); st.shakeT = 0.3; }
      }
      return;
    }
  }

  // 3) chạm quầy thu ngân?
  const r = G.register;
  if (x > r.x - r.w * 0.7 && x < r.x + r.w * 0.7 &&
      y > r.y - r.h && y < r.y + r.h * 1.4) {
    if (G.selected && currentWish(G.selected) === 'pay') {
      const qi = G.queueSpots.findIndex(q => !q.taken);
      if (qi !== -1) assignToQueue(G.selected, qi);
      else sNope();
      return;
    }
    if (!checkout()) sNope();
    return;
  }

  // 4) chạm chỗ trống → bỏ chọn
  G.selected = null;
  setHint();
}
