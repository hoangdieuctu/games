// ── Cô nhân viên spa: nhận việc từ hàng đợi, đi tới nơi và phục vụ ──
//
// Các loại việc (G.tasks, FIFO):
//   work     — bắt đầu mát-xa / làm móng (làm suốt dur giây)
//   apply    — đắp mặt nạ cho khách
//   remove   — gỡ mặt nạ khi đã ngấm xong
//   checkout — ra quầy tính tiền cho MỌI khách đang đứng hàng (một lượt)
//   tea      — đẩy xe trà mời cả tiệm, hồi tim cho mọi khách đang chờ
//
// Hai nguyên tắc để nhân viên đỡ chạy loăng quăng:
//   · việc mới giao cho cô nào đang RẢNH và ĐỨNG GẦN chỗ làm nhất
//   · hết việc thì đứng luôn tại chỗ, không đi về chỗ chờ

import { G } from './state.js';
import { SERVICES } from './config.js';
import { staffCount, teaHeal, teaCooldown } from './upgrades.js';
import { finishService, payQueue } from './customers.js';
import { openMaskPick } from './ui.js';
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
  // cô chủ đứng chờ gần quầy lễ tân như trong video
  return { x: G.W * (0.66 - i * 0.05), y: G.H * 0.70 };
}

export function placeStaffHome() {
  for (const s of G.staff) {
    const h = staffHome(s.idx);
    s.x = h.x; s.y = h.y; s.tx = h.x; s.ty = h.y;
  }
}

// chỗ đứng của nhân viên khi làm tại ô dịch vụ / quầy / bên cạnh khách
export function staffSpot(task) {
  if (task.type === 'checkout') {
    const r = G.register;
    return { x: r.x - r.w * 0.72, y: r.y + r.h * 0.55 };
  }
  if (task.type === 'tea') {
    // đến bên khách ít tim nhất rồi mời trà cho cả tiệm
    const c = teaTarget();
    if (c) return { x: c.x + 40 * G.K, y: c.y + 10 * G.K };
    return { x: G.teaCart.x, y: G.teaCart.y };
  }
  const st = G.stations[task.stIdx];
  return { x: st.x - st.w * 0.34, y: st.y + st.h * 0.38 };
}

// khách đang chờ và đã sụt tim — xe trà hồi tim cho tất cả những người này
const THIRSTY = ['sit', 'queue', 'done', 'awaitStaff', 'maskDone'];

export function teaGuests() {
  return G.customers.filter(c => THIRSTY.includes(c.state) && c.patience < c.maxPatience - 0.05);
}

// người được ưu tiên: ít tim nhất (tự chọn, người chơi không cần chỉ định)
export function teaTarget() {
  let best = null;
  for (const c of teaGuests()) if (!best || c.patience < best.patience) best = c;
  return best;
}

export function teaReady() {
  return G.teaLeft > 0 && G.teaCool <= 0 && !!teaTarget();
}

// khách nào đang đứng ở quầy chờ tính tiền
export function queueGuests() {
  return G.queueSpots.map(q => q.taken).filter(c => c && c.state === 'queue');
}

// đã có việc cùng loại cho cùng chỗ trong hàng đợi / đang làm chưa?
export function taskExists(type, stIdx) {
  if (G.tasks.some(t => t.type === type && t.stIdx === stIdx)) return true;
  return G.staff.some(s => s.task && s.task.type === type && s.task.stIdx === stIdx);
}

export function enqueueTask(type, stIdx, quiet) {
  if (taskExists(type, stIdx)) return false;
  G.tasks.push({ type, stIdx });
  if (!quiet) sAssign();
  return true;
}

// việc còn hợp lệ không (khách có thể đã bỏ về)
function taskValid(t) {
  if (t.type === 'checkout') {
    // còn ai đứng ở quầy là còn phải ra tính tiền
    return G.queueSpots.some(q => q.taken && (q.taken.state === 'queue' || q.taken.state === 'walk'));
  }
  if (t.type === 'tea') return !!teaTarget();
  const st = G.stations[t.stIdx];
  if (!st || !st.occupant) return false;
  const c = st.occupant;
  if (t.type === 'work' || t.type === 'apply') return c.state === 'walk' || c.state === 'awaitStaff';
  if (t.type === 'remove') return c.state === 'maskDone';
  return false;
}

/* ── giao việc: mỗi việc về tay cô rảnh đứng gần nhất ── */

function dispatchTasks() {
  if (!G.tasks.length) return;
  let idle = G.staff.filter(s => s.state === 'idle' && !s.task);
  if (!idle.length) return;

  const keep = [];
  for (const t of G.tasks) {
    if (!taskValid(t)) continue;          // khách bỏ về rồi → bỏ việc
    if (!idle.length) { keep.push(t); continue; }
    const p = staffSpot(t);
    let best = idle[0], bestD = Infinity;
    for (const s of idle) {
      const d = Math.hypot(s.x - p.x, s.y - p.y);
      if (d < bestD) { bestD = d; best = s; }
    }
    best.task = t;
    best.tx = p.x; best.ty = p.y;
    best.state = 'walk';
    idle = idle.filter(s => s !== best);
  }
  G.tasks = keep;
}

export function updateStaff(dt) {
  dispatchTasks();

  for (const s of G.staff) {
    s.bobT += dt * (s.state === 'walk' ? 12 : 4);

    // di chuyển tới chỗ làm
    if (s.state === 'walk') {
      const sp = 300 * G.K;
      const dx = s.tx - s.x, dy = s.ty - s.y;
      const d = Math.hypot(dx, dy);
      if (d > 2) {
        const step = Math.min(d, sp * dt);
        s.x += dx / d * step;
        s.y += dy / d * step;
        continue;
      }
      s.state = s.task ? 'waitCust' : 'idle';
    }

    // rảnh thì đứng yên tại chỗ, đỡ chạy qua chạy lại cho rối mắt
    if (s.state === 'idle') { s.tx = s.x; s.ty = s.y; continue; }

    // đến nơi: chờ khách tới / bắt đầu làm
    if (s.state === 'waitCust') {
      const t = s.task;
      if (!taskValid(t)) { s.task = null; s.state = 'idle'; continue; }
      if (t.type === 'checkout') {
        if (queueGuests().length) { s.state = 'action'; s.actionT = 0.8; }
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

    // hành động ngắn: đắp / gỡ mặt nạ, tính tiền, mời trà
    if (s.state === 'action') {
      s.actionT -= dt;
      if (s.actionT > 0) continue;
      const t = s.task;
      if (t.type === 'checkout') {
        payQueue(); // một lượt tính tiền cho tất cả khách đang đứng ở quầy
      } else if (t.type === 'tea') {
        serveTeaToAll();
      } else {
        const st = G.stations[t.stIdx];
        const c = st.occupant;
        if (c && t.type === 'apply' && c.state === 'awaitStaff') {
          // mở bảng "Chọn mặt nạ!" — chọn đúng mặt cười khách được thêm tim
          openMaskPick(c);
        } else if (c && t.type === 'remove' && c.state === 'maskDone') {
          finishService(c);
        }
      }
      s.task = null;
      s.state = 'idle';
    }
  }
}

/* ── mời trà: hồi tim cho toàn bộ khách đang chờ, rồi xe trà nguội một lúc ── */

function serveTeaToAll() {
  const guests = teaGuests();
  if (!guests.length) return;
  const heal = teaHeal();
  for (const c of guests) {
    c.patience = Math.min(c.maxPatience, c.patience + heal);
    for (let i = 0; i < 3; i++) heartPop(c.x + (Math.random() - 0.5) * 40 * G.K, c.y - 80 * G.K);
  }
  G.teaCool = teaCooldown();
  G.teaLeft = Math.max(0, G.teaLeft - 1);
  sDone();
}

// nhân viên đang làm việc tại ô này? (để vẽ và cộng tiến độ)
export function staffWorkingAt(stIdx) {
  return G.staff.find(s => (s.state === 'working' || s.state === 'action') &&
    s.task && s.task.stIdx === stIdx);
}
