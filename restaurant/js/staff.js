// ── Bạn phục vụ: nhận việc trong hàng đợi rồi đi làm từng bước ──
//
// Các loại việc (G.tasks, FIFO):
//   order — tới bàn ghi món
//   serve — lấy món ở quầy bếp rồi bưng ra bàn
//   bill  — tới bàn thu tiền
//   clean — dọn bàn bẩn
//   water — rót nước mời khách đang sốt ruột

import { G } from './state.js';
import { DISHES } from './config.js';
import { plateSpot, tableSpot } from './layout.js';
import { staffCount, walkMult } from './upgrades.js';
import { takeOrder, deliverDish, payCustomer, findCustomer } from './customers.js';
import { sAssign, sDone, sClean, sOrder } from './audio.js';
import { spark, heartPop, puff } from './particles.js';
import { getLook } from './wardrobe.js';

export function initStaff() {
  G.tasks = [];
  G.staff = [];
  for (let i = 0; i < staffCount(); i++) {
    G.staff.push({
      idx: i,
      x: 0, y: 0, tx: 0, ty: 0,
      state: 'idle', // idle | walk | act
      task: null,
      steps: [],
      actT: 0,
      actFn: null,
      carry: null, // món đang bưng
      bobT: Math.random() * 6,
    });
  }
  placeStaffHome();
}

export function staffHome(i) {
  return { x: G.W * (0.72 + i * 0.05), y: G.H * 0.56 };
}

export function placeStaffHome() {
  for (const s of G.staff) {
    const h = staffHome(s.idx);
    s.x = h.x; s.y = h.y; s.tx = h.x; s.ty = h.y;
  }
}

// bạn phục vụ số 0 là cô chủ (mặc đồ người chơi chọn), còn lại mặc đồng phục
export function staffLook(s) {
  if (s.idx === 0) return getLook();
  return {
    skin: '#f5cfa8', hair: 'pony', hairColor: '#2e2018',
    dress: 'classic', dressColor: '#7cc6f0', apron: 'white', acc: 'none',
  };
}

export function waterTarget() {
  let best = null;
  for (const c of G.customers) {
    if (c.state !== 'wait' && c.state !== 'order' && c.state !== 'waitFood') continue;
    if (c.patience >= c.maxPatience - 0.6) continue;
    if (!best || c.patience < best.patience) best = c;
  }
  return best;
}

export function taskExists(type, tIdx, plate) {
  const same = (t) => t.type === type && t.tIdx === tIdx && t.plate === plate;
  if (G.tasks.some(same)) return true;
  return G.staff.some(s => s.task && same(s.task));
}

export function enqueueTask(type, tIdx, plate) {
  if (taskExists(type, tIdx, plate)) return false;
  G.tasks.push({ type, tIdx: tIdx == null ? null : tIdx, plate: plate == null ? null : plate });
  sAssign();
  return true;
}

function custAt(tIdx) {
  const t = G.tables[tIdx];
  return t ? t.cust : null;
}

function taskValid(t) {
  if (t.type === 'water') return !!waterTarget();
  if (t.type === 'serve') {
    const pl = G.plates[t.plate];
    if (!pl) return false;
    const c = findCustomer(pl.custId);
    return !!c && c.state === 'waitFood';
  }
  const tb = G.tables[t.tIdx];
  if (!tb) return false;
  if (t.type === 'clean') return tb.dirty;
  const c = tb.cust;
  if (!c) return false;
  if (t.type === 'order') return c.state === 'order' || c.state === 'menu' || c.state === 'walk';
  if (t.type === 'bill') return c.state === 'bill';
  return false;
}

/* ── chuỗi bước cho từng loại việc ── */

function buildSteps(s, t) {
  if (t.type === 'water') {
    const w = G.water;
    return [
      { to: () => ({ x: w.x + 26 * G.K, y: w.y + 26 * G.K }) },
      { act: 0.35 },
      { to: () => { const c = waterTarget(); return c ? { x: c.x + 42 * G.K, y: c.y + 8 * G.K } : { x: w.x, y: w.y }; } },
      {
        act: 0.4, fn: () => {
          const c = waterTarget();
          if (!c) return;
          c.patience = Math.min(c.maxPatience, c.patience + 2);
          sDone();
          for (let i = 0; i < 3; i++) heartPop(c.x + (Math.random() - 0.5) * 40 * G.K, c.y - 80 * G.K);
        },
      },
    ];
  }
  if (t.type === 'serve') {
    const sp = plateSpot(t.plate);
    return [
      { to: () => ({ x: sp.x - 46 * G.K, y: sp.y + 16 * G.K }) },
      {
        act: 0.3, fn: () => {
          const pl = G.plates[t.plate];
          if (!pl) return;
          G.plates[t.plate] = null;
          s.carry = pl;
        },
      },
      {
        to: () => {
          const pl = s.carry;
          const c = pl ? findCustomer(pl.custId) : null;
          const tb = c && c.anchor && c.anchor.kind === 'table' ? G.tables[c.anchor.idx] : null;
          return tb ? tableSpot(tb) : staffHome(s.idx);
        },
      },
      {
        act: 0.3, fn: () => {
          const pl = s.carry;
          s.carry = null;
          if (!pl) return;
          const c = findCustomer(pl.custId);
          if (c && c.state === 'waitFood') deliverDish(c, pl.dish);
          else puff(s.x, s.y - 40 * G.K, '#c8b0a0');
        },
      },
    ];
  }
  const tb = G.tables[t.tIdx];
  const spot = () => tableSpot(G.tables[t.tIdx]);
  if (t.type === 'order') {
    return [
      { to: spot },
      { wait: () => { const c = custAt(t.tIdx); return !c || c.state === 'order'; } },
      {
        act: 0.55, fn: () => {
          const c = custAt(t.tIdx);
          if (c && c.state === 'order') { sOrder(); takeOrder(c); }
        },
      },
    ];
  }
  if (t.type === 'bill') {
    return [
      { to: spot },
      {
        act: 0.55, fn: () => {
          const c = custAt(t.tIdx);
          if (c && c.state === 'bill') payCustomer(c);
        },
      },
    ];
  }
  // clean
  return [
    { to: spot },
    {
      act: 0.7, fn: () => {
        const tbl = G.tables[t.tIdx];
        if (tbl) { tbl.dirty = false; sClean(); }
        for (let i = 0; i < 4; i++) spark(tb.x + (Math.random() - 0.5) * 50 * G.K, tb.y - Math.random() * 30 * G.K);
      },
    },
  ];
}

function abortTask(s) {
  if (s.carry) { puff(s.x, s.y - 40 * G.K, '#c8b0a0'); s.carry = null; }
  s.task = null; s.steps = []; s.state = 'idle';
}

function nextStep(s) {
  // đang bưng món thì cứ đi tiếp, các bước sau tự lo khách đã về hay chưa
  if (!s.carry && !taskValid(s.task)) { abortTask(s); return; }
  const st = s.steps.shift();
  if (!st) { s.task = null; s.state = 'idle'; return; }
  s.cur = st;
  if (st.to) {
    const p = st.to();
    s.tx = p.x; s.ty = p.y;
    s.state = 'walk';
  } else if (st.wait) {
    s.state = 'hold';
  } else {
    s.state = 'act';
    s.actT = st.act;
    s.actFn = st.fn || null;
  }
}

export function updateStaff(dt) {
  const speed = 344 * G.K * walkMult();
  for (const s of G.staff) {
    s.bobT += dt * (s.state === 'walk' ? 12 : 4);

    if (s.state === 'idle') {
      while (G.tasks.length && !s.task) {
        const t = G.tasks.shift();
        if (taskValid(t)) {
          s.task = t;
          s.steps = buildSteps(s, t);
          nextStep(s);
        }
      }
      if (!s.task) {
        const h = staffHome(s.idx);
        if (Math.hypot(s.x - h.x, s.y - h.y) > 4) { s.tx = h.x; s.ty = h.y; }
      }
    }

    if (s.state === 'walk' || s.state === 'idle') {
      const dx = s.tx - s.x, dy = s.ty - s.y;
      const d = Math.hypot(dx, dy);
      if (d > 2) {
        const step = Math.min(d, speed * dt);
        s.x += dx / d * step;
        s.y += dy / d * step;
      } else if (s.state === 'walk') {
        nextStep(s);
      }
      continue;
    }

    // chờ khách xem xong thực đơn rồi mới ghi món
    if (s.state === 'hold') {
      if (!taskValid(s.task)) { abortTask(s); continue; }
      if (s.cur.wait()) nextStep(s);
      continue;
    }

    if (s.state === 'act') {
      s.actT -= dt;
      if (s.actT > 0) continue;
      if (!s.carry && !taskValid(s.task)) { abortTask(s); continue; }
      const fn = s.actFn;
      s.actFn = null;
      if (fn) fn();
      nextStep(s);
    }
  }
}

// món ăn bạn phục vụ đang bưng (để vẽ trên tay)
export function carryIcon(s) {
  return s.carry ? DISHES[s.carry.dish].icon : null;
}
