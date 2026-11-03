// ── Xử lý chạm: chọn khách, giao dịch vụ, giữ ngón tay, đổi chỗ, mời trà ──

import { G } from './state.js';
import { SERVICES } from './config.js';
import {
  currentWish, assignToStation, assignToQueue, stationFree,
  cheerTap, canSwap, swapCustomers, moveToSeat,
} from './customers.js';
import { enqueueTask, taskExists, teaTarget } from './staff.js';
import { ac, sSelect, sNope, sTapWork } from './audio.js';
import { setHint, advanceTutorial } from './ui.js';

export function bindInput() {
  G.canvas.addEventListener('pointerdown', onDown, { passive: false });
  // nhấc ngón tay ở đâu cũng phải thả, kể cả khi trượt ra ngoài canvas
  for (const ev of ['pointerup', 'pointercancel', 'pointerleave'])
    window.addEventListener(ev, releaseHold);
  window.addEventListener('blur', releaseHold);
}

export function releaseHold() { G.holding = null; }

// ô dịch vụ đang có người được cô nhân viên làm tay (mát-xa / làm móng)?
function beingWorked(st) {
  const c = st && st.occupant;
  return c && c.state === 'service' && SERVICES[st.key].mode === 'staff' ? c : null;
}

function startHold(stIdx, c) {
  G.holding = { stIdx };
  sTapWork();
  cheerTap(c); // chạm một nhịp cũng nhích được chút tiến độ
}

function onDown(e) {
  e.preventDefault();
  ac();
  if (!G.running || G.paused) return;
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
    // đang chọn một khách khác mà chạm khách này → thử đổi chỗ hai người
    if (G.selected && G.selected !== hit && canSwap(G.selected, hit)) {
      const needStaff = swapCustomers(G.selected, hit);
      for (const s of needStaff) {
        if (s.mode === 'staff') enqueueTask('work', s.stIdx, true);
        if (s.mode === 'mask') enqueueTask('apply', s.stIdx, true);
      }
      setHint();
      return;
    }
    if (hit.state === 'service' && hit.anchor &&
        SERVICES[G.stations[hit.anchor.idx].key].mode === 'staff') {
      startHold(hit.anchor.idx, hit); // giữ ngón tay cho nhanh xong
      return;
    }
    if (hit.state === 'maskDone' && hit.anchor) {
      if (enqueueTask('remove', hit.anchor.idx)) setHint();
      return;
    }
    if (hit.state === 'sit' || hit.state === 'done' || hit.state === 'awaitStaff' ||
        hit.state === 'queue') {
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
      // giữ ngón tay khi nhân viên đang làm
      const working = beingWorked(st);
      if (working) { startHold(idx, working); return; }
      // gỡ mặt nạ đã ngấm xong
      if (occ && occ.state === 'maskDone') {
        if (enqueueTask('remove', idx)) setHint();
        else sNope();
        return;
      }
      // đổi chỗ: đang chọn khách chờ mà chạm vào ô đang có người khác chờ
      if (G.selected && occ && G.selected !== occ && canSwap(G.selected, occ)) {
        const needStaff = swapCustomers(G.selected, occ);
        for (const s of needStaff) {
          if (s.mode === 'staff') enqueueTask('work', s.stIdx, true);
          if (s.mode === 'mask') enqueueTask('apply', s.stIdx, true);
        }
        setHint();
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
          const c = G.selected;
          assignToStation(c, st);
          const mode = SERVICES[st.key].mode;
          if (mode === 'staff') enqueueTask('work', idx);
          if (mode === 'mask') enqueueTask('apply', idx);
        } else { sNope(); st.shakeT = 0.3; }
      }
      return;
    }
  }

  // 3) chạm quầy thu ngân? (nhân viên tự ra tính tiền, chạm chỉ để gửi khách)
  const r = G.register;
  if (x > r.x - r.w * 0.7 && x < r.x + r.w * 0.7 &&
      y > r.y - r.h && y < r.y + r.h * 1.4) {
    if (G.selected && currentWish(G.selected) === 'pay') {
      const qi = G.queueSpots.findIndex(q => !q.taken);
      if (qi !== -1) assignToQueue(G.selected, qi);
      else sNope();
      return;
    }
    // gọi nhân viên ra ngay nếu vì lý do gì đó chưa có ai tới
    if (!taskExists('checkout', null) && G.queueSpots.some(q => q.taken)) {
      enqueueTask('checkout', null);
    } else sNope();
    return;
  }

  // 4) chạm xe trà → mời trà cả tiệm (hồi tim cho mọi khách đang chờ)
  const t = G.teaCart;
  if (Math.hypot(x - t.x, y - t.y) < 60 * K) {
    if (G.teaLeft <= 0 || G.teaCool > 0 || !teaTarget() || !enqueueTask('tea', null)) sNope();
    return;
  }

  // 5) chạm ghế chờ trống → đưa khách đang chọn về ghế ngồi đợi
  if (G.selected) {
    for (let i = 0; i < G.seats.length; i++) {
      const st = G.seats[i];
      if (st.taken) continue;
      if (Math.hypot(x - st.x, y - (st.y - 20 * K)) < 62 * K) {
        if (!moveToSeat(G.selected, i)) sNope();
        setHint();
        return;
      }
    }
  }

  // 6) chạm chỗ trống → bỏ chọn
  G.selected = null;
  setHint();
}
