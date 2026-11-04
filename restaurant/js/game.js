// ── Vòng đời một ngày và cập nhật mỗi khung hình ──

import { G } from './state.js';
import { DECAY, dayConfig } from './config.js';
import { layout } from './layout.js';
import { updateParticles } from './particles.js';
import { updateHud, updateCustPill, setHint, showStart, hideStart, showEnd, hideEnd } from './ui.js';
import { spawnCustomer, customerAngry, finishEating, shiftWaitLine } from './customers.js';
import { initStaff, updateStaff } from './staff.js';
import { initKitchen, updateKitchen } from './kitchen.js';
import { extraTables } from './upgrades.js';
import { saveDayUnlocked } from './player.js';
import { sDoor, sBell } from './audio.js';

export function prepareDay() {
  G.cfg = dayConfig(G.day);
  buildTables();
  layout();
  showStart();
}

function buildTables() {
  const n = G.cfg.tables + extraTables();
  G.tables = [];
  for (let i = 0; i < n; i++) {
    G.tables.push({ i, x: 0, y: 0, w: 0, h: 0, cust: null, dirty: false, shakeT: 0 });
  }
}

export function startDay() {
  G.cfg = dayConfig(G.day);
  buildTables();
  G.customers = [];
  G.particles = [];
  G.selected = null;
  G.money = 0; G.moneyShown = 0;
  G.dayExp = 0;
  G.spawned = 0; G.spawnTimer = 1.0;
  G.paidCount = 0; G.angryCount = 0;
  G.time = 0;
  G.levelUpPending = 0;
  G.bonusLeft = Math.min(3, 2 + Math.floor(G.day / 4));
  G.bonusTimer = 16;
  G.bonusReady = false;
  for (const s of G.waitSpots) s.taken = null;
  initKitchen();
  initStaff();
  layout();
  G.running = true;
  G.paused = false;
  updateHud();
  updateCustPill();
  setHint();
  sDoor();
}

function endDay() {
  G.running = false;
  const passed = G.money >= G.cfg.goal;
  const stars = G.money >= G.cfg.goal * 1.5 ? 3 : G.money >= G.cfg.goal * 1.25 ? 2 : passed ? 1 : 0;
  if (passed) saveDayUnlocked(G.day + 1);
  setTimeout(() => showEnd({ passed, stars }), 700);
}

export function update(dt) {
  G.time += dt;

  if (G.running && !G.paused) {
    // Khách mới tới khi hàng chờ còn chỗ. Nếu quán đã kín bàn thì chỉ để
    // tối đa 2 khách đứng chờ — quán đông vẫn xoay kịp, không bị dồn ứ oan.
    if (G.spawned < G.cfg.nCustomers) {
      G.spawnTimer -= dt;
      const free = G.waitSpots.findIndex(s => !s.taken);
      const waiting = G.waitSpots.filter(s => s.taken).length;
      const tableFree = G.tables.some(t => !t.cust && !t.dirty);
      const room = waiting < (tableFree ? G.waitSpots.length : 2);
      if (G.spawnTimer <= 0 && free !== -1 && room) {
        G.spawnTimer = G.cfg.spawnGap * (0.8 + Math.random() * 0.4);
        spawnCustomer(free);
      }
    }

    // đơn đặc biệt: chạm vào để chơi mini-game kiếm thêm vàng
    if (!G.bonusReady && G.bonusLeft > 0 && G.spawned > 0) {
      G.bonusTimer -= dt;
      if (G.bonusTimer <= 0) { G.bonusReady = true; sBell(); setHint(); }
    }

    for (const c of G.customers) {
      const moving = c.state === 'walk' || c.state === 'exitHappy' || c.state === 'exitAngry';
      c.bobT += dt * (moving ? 11 : 3);

      if (moving) {
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

      // xem thực đơn xong thì gọi món
      if (c.state === 'menu') {
        c.timer -= dt;
        if (c.timer <= 0) { c.state = 'order'; setHint(); }
        continue;
      }
      // đang ăn thì vui vẻ, không mất tim
      if (c.state === 'eating') {
        c.timer -= dt;
        if (c.timer <= 0) finishEating(c);
        continue;
      }

      const decay = DECAY[c.state];
      if (decay) {
        c.patience -= decay * dt;
        if (c.patience <= 0) { customerAngry(c); continue; }
      }
    }

    shiftWaitLine();
    updateKitchen(dt);
    updateStaff(dt);

    if (G.spawned >= G.cfg.nCustomers && G.customers.length === 0) endDay();
  }

  // đếm tiền hiển thị cho mượt
  G.moneyShown += (G.money - G.moneyShown) * Math.min(1, dt * 8);
  if (Math.abs(G.money - G.moneyShown) < 0.6) G.moneyShown = G.money;
  const el = document.getElementById('money-val');
  if (el) el.textContent = Math.round(G.moneyShown);

  updateParticles(dt);
}

// mini-game xong: nhận thưởng rồi chơi tiếp
export function bonusDone() {
  G.bonusReady = false;
  G.bonusLeft--;
  G.bonusTimer = 26 + Math.random() * 8;
  G.paused = false;
  setHint();
}

export function bindDayFlow() {
  return {
    onStart: () => { hideStart(); startDay(); },
    onRetry: () => { hideEnd(); startDay(); },
    onNext:  () => { G.day++; hideEnd(); prepareDay(); },
  };
}
