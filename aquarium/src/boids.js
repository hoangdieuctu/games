/* ═══════════════════════ boids.js — chuyển động cá (đơn vị cm, cm/s) ═══════════════════════ */

const AI = new Map(); // id -> trạng thái tạm (không lưu)
function ai(f) {
  let a = AI.get(f.id);
  if (!a) { a = { tx: f.x, ty: f.y, timer: 0, phase: rand(Math.PI * 2), state: 'wander', bank: 0, face: 1, chaseT: 0, restT: 0 }; AI.set(f.id, a); }
  return a;
}

function zoneBand(sp, d) {
  if (sp.zone === 'top') return [d.H * 0.08, d.H * 0.45];
  if (sp.zone === 'bottom') return [d.H * 0.8, d.H * 0.94];
  return [d.H * 0.2, d.H * 0.8];
}

function decoAt(t, d, minHide = 0.5) {
  const list = t.deco.filter((x) => (DECO[x.type]?.hide || 0) >= minHide);
  return list.length ? pick(list) : null;
}

function newTarget(f, sp, t, d, a) {
  const [y0, y1] = zoneBand(sp, d);
  const hideNeed = sp.shy && (f.stress > 35 || Math.random() < 0.35);
  if (hideNeed) {
    const dc = decoAt(t, d, 0.5);
    if (dc) { const D = DECO[dc.type]; a.tx = dc.x + rand(-D.w * 0.3, D.w * 0.3); a.ty = d.H - D.h * rand(0.3, 0.8); a.state = 'hide'; a.timer = rand(4, 10); return; }
  }
  a.tx = rand(d.W * 0.06, d.W * 0.94); a.ty = rand(y0, y1); a.state = 'wander';
  a.timer = rand(2.5, 7) * (sp.speed < 5 ? 1.5 : 1);
}

function updateMovement(t, dt, time) {
  const d = tankDims(t);
  const fs = fishIn(t.id);
  const pellets = t.pellets;
  // mồi rơi
  for (let i = pellets.length - 1; i >= 0; i--) {
    const p = pellets[i];
    p.age += dt;
    const floor = d.H - 1.2;
    if (p.y < floor) { p.y += p.vy * dt; p.x += p.vx * dt; p.vx *= 0.98; }
    else p.y = floor;
    if (p.age > 150) { rotPellet(t); pellets.splice(i, 1); }
  }
  for (const f of fs) {
    const sp = SPECIES[f.sp], a = ai(f);
    if (sp.shape === 'snail') { moveSnail(f, a, d, dt); continue; }
    if (sp.shape === 'shrimp') { moveShrimp(f, a, d, dt, t); continue; }
    const sick = f.health < 35 || (f.disease && f.disease.sev > 0.6);
    const lenCm = visSize(sp.size) * (0.35 + 0.65 * f.growth);
    let maxSp = sp.speed * (0.5 + 0.5 * f.health / 100) * (f.growth < 0.6 ? 0.8 : 1);
    if (sick) maxSp *= 0.45;
    a.timer -= dt;

    // 1. mục tiêu
    let sx = 0, sy = 0;
    let feeding = false;
    if (f.hunger > 25 && pellets.length && !sp.invert) {
      let best = null, bd = 1e9;
      for (const p of pellets) { const dd = (p.x - f.x) ** 2 + (p.y - f.y) ** 2; if (dd < bd) { bd = dd; best = p; } }
      if (best && (sp.zone !== 'bottom' || best.y > d.H * 0.7 || bd < 36)) {
        feeding = true;
        a.tx = best.x; a.ty = best.y; a.state = 'feed';
        if (bd < (lenCm * 0.45 + 0.8) ** 2) { pellets.splice(pellets.indexOf(best), 1); eatPellet(f); a.timer = 0.3; }
      }
    }
    if (!feeding) {
      if (a.state === 'feed') { a.state = 'wander'; a.timer = 0; }
      if (a.timer <= 0 || ((a.tx - f.x) ** 2 + (a.ty - f.y) ** 2) < 4) newTarget(f, sp, t, d, a);
      // xiêm/tứ vân đuổi cá vây dài
      if ((sp.temper === 'aggr' || sp.nipper) && a.chaseT <= 0 && Math.random() < dt * 0.05) {
        const vic = fs.filter((o) => o !== f && !SPECIES[o.sp].invert && (SPECIES[o.sp].longFin || (sp.temper === 'aggr' && o.sp === f.sp)));
        if (vic.length) { a.victim = pick(vic).id; a.chaseT = rand(2, 4); }
      }
      if (a.chaseT > 0) {
        a.chaseT -= dt;
        const v = fishById(a.victim);
        if (v && v.tankId === t.id) { a.tx = v.x; a.ty = v.y; maxSp *= 1.4; const va = ai(v); va.fleeX = f.x; va.fleeY = f.y; va.fleeT = 1.2; }
        else a.chaseT = 0;
      }
    }
    let dx = a.tx - f.x, dy = a.ty - f.y;
    let dist = Math.hypot(dx, dy) || 1;
    const arrive = Math.min(1, dist / 6);
    sx += (dx / dist) * maxSp * arrive * 1.2; sy += (dy / dist) * maxSp * arrive * 1.2;

    // chạy trốn
    if (a.fleeT > 0) { a.fleeT -= dt; const fx = f.x - a.fleeX, fy = f.y - a.fleeY, fd = Math.hypot(fx, fy) || 1; sx += (fx / fd) * maxSp * 2.5; sy += (fy / fd) * maxSp * 1.5; }

    // 2. đàn & tách
    let cx = 0, cy = 0, ax = 0, ay = 0, n = 0, rx = 0, ry = 0;
    for (const o of fs) {
      if (o === f) continue;
      const ox = o.x - f.x, oy = o.y - f.y, dd = ox * ox + oy * oy;
      const so = SPECIES[o.sp];
      const sep = (lenCm + visSize(so.size) * (0.35 + 0.65 * o.growth)) * 0.45;
      if (dd < sep * sep && dd > 0.0001) { const q = Math.sqrt(dd); rx -= (ox / q) * (sep - q) / sep; ry -= (oy / q) * (sep - q) / sep; }
      if (sp.school > 0 && o.sp === f.sp && dd < (lenCm * 8) ** 2) { cx += o.x; cy += o.y; ax += o.vx; ay += o.vy; n++; }
    }
    if (n) {
      cx = cx / n - f.x; cy = cy / n - f.y;
      sx += cx * 0.35 + (ax / n - f.vx) * 0.6; sy += cy * 0.35 + (ay / n - f.vy) * 0.6;
    }
    sx += rx * maxSp * 1.6; sy += ry * maxSp * 1.6;

    // 3. tường
    const m = lenCm * 0.6 + 1;
    if (f.x < m) sx += (m - f.x) * 4; if (f.x > d.W - m) sx -= (f.x - d.W + m) * 4;
    if (f.y < m * 0.6) sy += (m * 0.6 - f.y) * 4; if (f.y > d.H - m * 0.5) sy -= (f.y - d.H + m * 0.5) * 4;
    // né trang trí (chỉ vật rắn)
    for (const dc of t.deco) {
      const D = DECO[dc.type]; if (!D || D.plant || D.kind === 'bubbler' || D.kind === 'shell') continue;
      if (a.state === 'hide') continue;
      const cxD = dc.x, cyD = d.H - D.h / 2, rr = Math.max(D.w, D.h) * 0.55 + lenCm * 0.3;
      const ox = f.x - cxD, oy = f.y - cyD, q = Math.hypot(ox, oy);
      if (q < rr && q > 0.01) { sx += (ox / q) * (rr - q) * 3; sy += (oy / q) * (rr - q) * 3; }
    }

    // 4. bệnh: bơi nghiêng, chìm/nổi
    if (sick) { sy += (f.disease && f.disease.id === 'swim' ? (Math.sin(time * 0.7 + a.phase) > 0 ? -1 : 1) * 2 : 1.2); }
    if (f.hunger < 20 && a.restT <= 0 && Math.random() < dt * 0.02) a.restT = rand(2, 5);
    if (a.restT > 0) { a.restT -= dt; sx *= 0.15; sy *= 0.15; }

    // 5. tích phân
    const accel = maxSp * (feeding ? 3 : 1.6);
    let ddx = sx - f.vx, ddy = sy - f.vy;
    const dl = Math.hypot(ddx, ddy) || 1;
    const lim = Math.min(dl, accel * dt);
    f.vx += (ddx / dl) * lim; f.vy += (ddy / dl) * lim;
    const spd = Math.hypot(f.vx, f.vy);
    if (spd > maxSp) { f.vx *= maxSp / spd; f.vy *= maxSp / spd; }
    // cá bơi ngang là chính
    f.vy *= 0.97;
    f.x = clamp(f.x + f.vx * dt, 0.5, d.W - 0.5);
    f.y = clamp(f.y + f.vy * dt, 0.5, d.H - 0.6);
    // hướng mặt (đổi chậm để không giật)
    if (Math.abs(f.vx) > maxSp * 0.08) a.face = f.vx > 0 ? 1 : -1;
    a.phase += dt * (2.5 + spd * 1.6 / Math.max(1, lenCm * 0.4));
    a.speedN = spd / Math.max(0.1, maxSp);
  }
}

function moveSnail(f, a, d, dt) {
  // bò dọc đáy hoặc theo kính bên
  if (a.timer <= 0) { a.timer = rand(6, 15); a.dir = pick([-1, 1]); a.onGlass = Math.random() < 0.35; }
  a.timer -= dt;
  const v = 0.8;
  if (a.onGlass) {
    const side = f.x < d.W / 2 ? 0.8 : d.W - 0.8; f.x += (side - f.x) * Math.min(1, dt * 2);
    f.y = clamp(f.y + a.dir * v * dt, d.H * 0.2, d.H - 1);
    if (f.y <= d.H * 0.2 || f.y >= d.H - 1) a.dir *= -1;
  } else {
    f.y += (d.H - 1 - f.y) * Math.min(1, dt * 2);
    f.x = clamp(f.x + a.dir * v * dt, 1, d.W - 1);
    if (f.x <= 1 || f.x >= d.W - 1) a.dir *= -1;
  }
  a.face = a.dir; a.phase += dt;
}

function moveShrimp(f, a, d, dt, t) {
  a.timer -= dt;
  if (a.timer <= 0) {
    a.timer = rand(1.5, 4);
    if (Math.random() < 0.3) { a.hopX = rand(-6, 6); a.hopY = -rand(2, 5); }
    else { a.hopX = rand(-1.5, 1.5); a.hopY = 0; }
    a.dir = a.hopX < 0 ? -1 : 1;
  }
  // nhặt mồi gần đáy
  let best = null, bd = 1e9;
  for (const p of t.pellets) if (p.y > d.H * 0.75) { const dd = (p.x - f.x) ** 2; if (dd < bd) { bd = dd; best = p; } }
  if (best && f.hunger > 20) { f.vx += Math.sign(best.x - f.x) * 2 * dt; if (bd < 1.5) { t.pellets.splice(t.pellets.indexOf(best), 1); eatPellet(f); } }
  f.vx += a.hopX * dt * 2; f.vy += a.hopY * dt * 2 + 3 * dt; // trọng lực
  f.vx *= 0.9; f.vy *= 0.92;
  f.x = clamp(f.x + f.vx * dt, 1, d.W - 1);
  f.y = clamp(f.y + f.vy * dt, d.H * 0.5, d.H - 1);
  if (f.y >= d.H - 1) f.vy = 0;
  if (Math.abs(f.vx) > 0.2) a.face = f.vx > 0 ? 1 : -1;
  a.phase += dt * 3;
}
