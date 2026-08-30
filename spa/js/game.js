// ── Vòng đời ngày chơi và cập nhật mỗi khung hình ──

import { G, saveDayUnlocked } from './state.js';
import { SERVICES, DECAY, dayConfig } from './config.js';
import { layout } from './layout.js';
import { steam, spark, updateParticles } from './particles.js';
import { updateHud, updateCustPill, setHint, showStart, hideStart, showEnd, hideEnd } from './ui.js';
import { spawnCustomer, finishService, completePay, customerAngry } from './customers.js';
import { sitDecayMult, durFor } from './upgrades.js';
import { sBell, sDone, sCash } from './audio.js';

export function prepareDay() {
  G.cfg = dayConfig(G.day);
  showStart();
}

export function startDay() {
  G.cfg = dayConfig(G.day);
  G.stations = G.cfg.stations.map(k => ({ key: k, x: 0, y: 0, w: 0, h: 0, occupant: null, shakeT: 0 }));
  G.customers = [];
  G.particles = [];
  G.selected = null;
  G.money = 0; G.moneyShown = 0;
  G.spawned = 0; G.spawnTimer = 1.2;
  G.paidCount = 0; G.angryCount = 0;
  G.time = 0;
  G.tutorialStep = G.day === 1 ? 0 : -1;
  for (const s of G.seats) s.taken = null;
  for (const q of G.queueSpots) q.taken = null;
  layout();
  G.running = true;
  updateHud();
  updateCustPill();
  setHint();
  sBell();
}

function endDay() {
  G.running = false;
  const passed = G.money >= G.cfg.goal;
  const stars = G.money >= G.cfg.goal * 1.5 ? 3 : G.money >= G.cfg.goal * 1.25 ? 2 : passed ? 1 : 0;
  if (passed) saveDayUnlocked(G.day + 1);
  setTimeout(() => {
    showEnd({ passed, stars });
    if (passed) { sDone(); setTimeout(sCash, 350); }
  }, 700);
}

export function update(dt) {
  G.time += dt;

  if (G.running) {
    // sinh khách mới khi còn ghế trống
    if (G.spawned < G.cfg.nCustomers) {
      G.spawnTimer -= dt;
      const freeSeat = G.seats.findIndex(s => !s.taken);
      if (G.spawnTimer <= 0 && freeSeat !== -1) {
        G.spawnTimer = G.cfg.spawnGap * (0.8 + Math.random() * 0.4);
        spawnCustomer(freeSeat);
      }
    }

    for (const c of G.customers) {
      c.bobT += dt * (c.state === 'walk' || c.state === 'enter' || c.state.startsWith('exit') ? 11 : 3);

      // di chuyển
      if (c.state === 'walk' || c.state === 'exitHappy' || c.state === 'exitAngry') {
        const sp = 250 * G.K * c.speed * (c.state === 'exitAngry' ? 1.4 : 1);
        const dx = c.tx - c.x, dy = c.ty - c.y;
        const d = Math.hypot(dx, dy);
        if (d < sp * dt) {
          c.x = c.tx; c.y = c.ty;
          const f = c.arrive; c.arrive = null;
          if (f) f();
        } else {
          c.x += dx / d * sp * dt;
          c.y += dy / d * sp * dt;
        }
        continue;
      }

      // kiên nhẫn giảm khi phải chờ
      let decay = 0;
      if (c.state === 'sit') decay = DECAY.sit * sitDecayMult();
      else if (c.state === 'done') decay = DECAY.done;
      else if (c.state === 'queue') decay = DECAY.queue;
      else if (c.state === 'service' && c.anchor && SERVICES[G.stations[c.anchor.idx].key].mode === 'tap') {
        c.workIdle += dt;
        if (c.workIdle > 3) decay = DECAY.neglected; // bị bỏ mặc giữa chừng
      }
      if (decay) {
        c.patience -= decay * dt;
        if (c.patience <= 0) { customerAngry(c); continue; }
      }

      // dịch vụ tự động chạy theo thời gian
      if (c.state === 'service' && c.anchor) {
        const st = G.stations[c.anchor.idx];
        if (SERVICES[st.key].mode === 'auto') {
          c.serviceTimer += dt;
          if (st.key === 'sauna' && Math.random() < dt * 4) steam(st.x + (Math.random() - 0.5) * st.w * 0.5, st.y - st.h * 0.45);
          if (st.key === 'facial' && Math.random() < dt * 1.2) spark(st.x + (Math.random() - 0.5) * st.w * 0.6, st.y - Math.random() * 40 * G.K);
          if (c.serviceTimer >= durFor(st.key)) finishService(c);
        }
      }

      // đang thanh toán
      if (c.state === 'pay') {
        c.payTimer -= dt;
        if (c.payTimer <= 0) completePay(c);
      }
    }

    // hết ngày khi mọi khách đã rời tiệm
    if (G.spawned >= G.cfg.nCustomers && G.customers.length === 0) endDay();
  }

  // đếm tiền hiển thị mượt
  G.moneyShown += (G.money - G.moneyShown) * Math.min(1, dt * 8);
  if (Math.abs(G.money - G.moneyShown) < 0.6) G.moneyShown = G.money;
  document.getElementById('money-val').textContent = Math.round(G.moneyShown);

  updateParticles(dt);
}

export function bindDayFlow() {
  return {
    onStart: () => { hideStart(); startDay(); },
    onRetry: () => { hideEnd(); startDay(); },
    onNext:  () => { G.day++; hideEnd(); prepareDay(); },
  };
}
