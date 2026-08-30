// ── Cô nhân viên spa: nhận việc từ hàng đợi, đi tới nơi và phục vụ ──
//
// Các loại việc (G.tasks, FIFO):
//   work     — bắt đầu mát-xa / làm móng (làm suốt dur giây)
//   apply    — đắp mặt nạ cho khách
//   remove   — gỡ mặt nạ khi đã ngấm xong
//   checkout — ra quầy tính tiền cho khách đứng đầu hàng

import { G } from './state.js';
import { SERVICES } from './config.js';
import { staffCount } from './upgrades.js';
import { finishService, completePay } from './customers.js';
import { sAssign, sDone } from './audio.js';
import { spark, heartPop } from './particles.js';

export function initStaff() {
  G.tasks = [];
  G.staff = [];
  for (let i = 0; i < staffCount(); i++) {
    G.staff.push({
      idx: i,
      x: 0, y: 0, tx: 0, ty: 0,
      state: 'idle', // idle | walk | waitCust | working | action
      task: null,
      actionT: 0,
      bobT: Math.random() * 6,
    });
  }
  placeStaffHome();
}

export function staffHome(i) {
  return { x: G.W * (0.175 + i * 0.045), y: G.H * 0.56 };
}

export function placeStaffHome() {
  for (const s of G.staff) {
    const h = staffHome(s.idx);
    s.x = h.x; s.y = h.y; s.tx = h.x; s.ty = h.y;
  }
}

// chỗ đứng của nhân viên khi làm tại ô dịch vụ / quầy
export function staffSpot(task) {
  if (task.type === 'checkout') {
    const r = G.register;
    return { x: r.x - r.w * 0.72, y: r.y + r.h * 0.55 };
  }
  if (task.type === 'tea') {
    // đến chỗ khách đang chờ ít tim nhất
    const c = teaTarget();
    if (c) return { x: c.x + 40 * G.K, y: c.y + 10 * G.K };
    return { x: G.teaCart.x, y: G.teaCart.y };
  }
  const st = G.stations[task.stIdx];
  return { x: st.x - st.w * 0.34, y: st.y + st.h * 0.38 };
}

export function teaTarget() {
  let best = null;
  for (const c of G.customers) {
    if (c.state !== 'sit') continue;
    if (c.patience >= c.maxPatience - 0.5) continue; // còn đầy tim thì thôi
    if (!best || c.patience < best.patience) best = c;
  }
  return best;
}

// đã có việc cùng loại cho cùng chỗ trong hàng đợi / đang làm chưa?
export function taskExists(type, stIdx) {
  if (G.tasks.some(t => t.type === type && t.stIdx === stIdx)) return true;
  return G.staff.some(s => s.task && s.task.type === type && s.task.stIdx === stIdx);
}

export function enqueueTask(type, stIdx) {
  if (taskExists(type, stIdx)) return false;
  G.tasks.push({ type, stIdx });
  sAssign();
  return true;
}

// việc còn hợp lệ không (khách có thể đã bỏ về)
function taskValid(t) {
  if (t.type === 'checkout') {
    const c = G.queueSpots[0].taken;
    return c && (c.state === 'queue' || c.state === 'walk');
  }
  if (t.type === 'tea') return !!teaTarget();
  const st = G.stations[t.stIdx];
  if (!st || !st.occupant) return false;
  const c = st.occupant;
  if (t.type === 'work' || t.type === 'apply') return c.state === 'walk' || c.state === 'awaitStaff';
  if (t.type === 'remove') return c.state === 'maskDone';
  return false;
}

export function updateStaff(dt) {
  for (const s of G.staff) {
    s.bobT += dt * (s.state === 'walk' ? 12 : 4);

    // rảnh → nhận việc kế tiếp còn hợp lệ
    if (s.state === 'idle') {
      while (G.tasks.length) {
        const t = G.tasks.shift();
        if (taskValid(t)) { s.task = t; break; }
      }
      if (s.task) {
        const p = staffSpot(s.task);
        s.tx = p.x; s.ty = p.y;
        s.state = 'walk';
      } else {
        // về chỗ đứng chờ
        const h = staffHome(s.idx);
        if (Math.hypot(s.x - h.x, s.y - h.y) > 4) { s.tx = h.x; s.ty = h.y; }
      }
    }

    // di chuyển (cả khi idle đi về chỗ chờ)
    if (s.state === 'walk' || s.state === 'idle') {
      const sp = 300 * G.K;
      const dx = s.tx - s.x, dy = s.ty - s.y;
      const d = Math.hypot(dx, dy);
      if (d > 2) {
        const step = Math.min(d, sp * dt);
        s.x += dx / d * step;
        s.y += dy / d * step;
      } else if (s.state === 'walk') {
        s.state = s.task ? 'waitCust' : 'idle';
      }
      if (s.state === 'walk') continue;
    }

    // đến nơi: chờ khách tới / bắt đầu làm
    if (s.state === 'waitCust') {
      const t = s.task;
      if (!taskValid(t)) { s.task = null; s.state = 'idle'; continue; }
      if (t.type === 'checkout') {
        const c = G.queueSpots[0].taken;
        if (c && c.state === 'queue') { s.state = 'action'; s.actionT = 0.8; }
        continue;
      }
      if (t.type === 'tea') { s.state = 'action'; s.actionT = 0.6; continue; }
      const c = G.stations[t.stIdx].occupant;
      if (c.state === 'awaitStaff') {
        if (t.type === 'work') {
          c.state = 'service';
          c.workProgress = 0;
          s.state = 'working';
        } else if (t.type === 'apply') {
          s.state = 'action';
          s.actionT = SERVICES.facial.applyT;
        }
      } else if (c.state === 'maskDone' && t.type === 'remove') {
        s.state = 'action';
        s.actionT = SERVICES.facial.removeT;
      }
      continue;
    }

    // đang làm mát-xa / làm móng: tiến độ do game.js cộng, xong thì rảnh
    if (s.state === 'working') {
      const t = s.task;
      const st = G.stations[t.stIdx];
      if (!st.occupant || st.occupant.state !== 'service') { s.task = null; s.state = 'idle'; continue; }
      if (Math.random() < dt * 6) {
        spark(s.x + (Math.random() * 30 + 8) * G.K, s.y - (20 + Math.random() * 40) * G.K);
      }
      continue;
    }

    // hành động ngắn: đắp / gỡ mặt nạ, tính tiền
    if (s.state === 'action') {
      s.actionT -= dt;
      if (s.actionT > 0) continue;
      const t = s.task;
      if (t.type === 'checkout') {
        const c = G.queueSpots[0].taken;
        if (c && c.state === 'queue') completePay(c);
      } else if (t.type === 'tea') {
        const c = teaTarget();
        if (c) {
          c.patience = Math.min(c.maxPatience, c.patience + 2);
          sDone();
          for (let i = 0; i < 3; i++) heartPop(c.x + (Math.random() - 0.5) * 40 * G.K, c.y - 80 * G.K);
        }
      } else {
        const st = G.stations[t.stIdx];
        const c = st.occupant;
        if (c && t.type === 'apply' && c.state === 'awaitStaff') {
          c.state = 'masked';
          c.serviceTimer = 0;
        } else if (c && t.type === 'remove' && c.state === 'maskDone') {
          finishService(c);
        }
      }
      s.task = null;
      s.state = 'idle';
    }
  }
}

// nhân viên đang làm việc tại ô này? (để vẽ và cộng tiến độ)
export function staffWorkingAt(stIdx) {
  return G.staff.find(s => (s.state === 'working' || s.state === 'action') &&
    s.task && s.task.stIdx === stIdx);
}
