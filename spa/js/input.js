// ── Xử lý chạm: chọn khách, giao dịch vụ, cổ vũ nhân viên, gỡ mặt nạ, thu tiền ──

import { G } from './state.js';
import { SERVICES } from './config.js';
import { currentWish, assignToStation, assignToQueue, stationFree, cheerTap } from './customers.js';
import { enqueueTask, taskExists, teaTarget } from './staff.js';
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
    if (c.state === 'exitHappy' || c.state === 'exitAngry') continue;
    if (Math.hypot(x - c.x, y - (c.y - 45 * K)) < 55 * K) { hit = c; break; }
  }
  if (hit) {
    if (hit.state === 'service' && hit.anchor && SERVICES[G.stations[hit.anchor.idx].key].mode === 'staff') {
      sTapWork(); cheerTap(hit); // cổ vũ cho nhanh xong
      return;
    }
    if (hit.state === 'maskDone' && hit.anchor) {
      if (enqueueTask('remove', hit.anchor.idx)) setHint();
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
      const idx = G.stations.indexOf(st);
      const occ = st.occupant;
      // cổ vũ khi nhân viên đang làm
      if (occ && occ.state === 'service' && SERVICES[st.key].mode === 'staff') {
        sTapWork(); cheerTap(occ);
        return;
      }
      // gỡ mặt nạ đã ngấm xong
      if (occ && occ.state === 'maskDone') {
        if (enqueueTask('remove', idx)) setHint();
        else sNope();
        return;
      }
      if (occ && occ.state === 'done') {
        G.selected = (G.selected === occ) ? null : occ;
        if (G.selected) sSelect();
        setHint();
        return;
      }
      // giao khách vào ô trống
      if (G.selected && stationFree(st)) {
        if (currentWish(G.selected) === st.key) {
          assignToStation(G.selected, st);
          const mode = SERVICES[st.key].mode;
          if (mode === 'staff') enqueueTask('work', idx);
          if (mode === 'mask') enqueueTask('apply', idx);
        } else { sNope(); st.shakeT = 0.3; }
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
    const front = G.queueSpots[0].taken;
    if (front && front.state === 'queue' && !taskExists('checkout', null)) {
      enqueueTask('checkout', null);
    } else sNope();
    return;
  }

  // 4) chạm xe trà → mời trà khách đang chờ ít tim nhất
  const t = G.teaCart;
  if (Math.hypot(x - t.x, y - t.y) < 60 * K) {
    if (!teaTarget() || !enqueueTask('tea', null)) sNope();
    return;
  }

  // 5) chạm chỗ trống → bỏ chọn
  G.selected = null;
  setHint();
}
