// ── Luật chơi, hoạt ảnh rót bóng và các vật phẩm hỗ trợ ──
import { COLORS, BALL_DUR, BALL_STAGGER } from './config.js';
import { buildLevel, canPour, runLen, topColor, solved, isPure, hintMove } from './level.js';
import { computeLayout } from './layout.js';
import * as R from './render.js';
import * as FX from './fx.js';
import * as A from './audio.js';

export const G = {
  level: 1, tubes: [], cap: 4, plan: null, par: 10,
  moves: 0, sel: -1, flyers: [], history: [],
  doneSet: new Set(), hint: null, hintUntil: 0, wandMode: false,
  layout: null, initial: null, W: 0, H: 0, locked: true, finished: false,
};

let canvas, ctx, dpr = 1, hooks = {}, lastT = 0, shake = 0;

export function initGame(cv, callbacks) {
  canvas = cv;
  ctx = cv.getContext('2d');
  hooks = callbacks || {};
  window.addEventListener('resize', resize);
  window.addEventListener('orientationchange', () => setTimeout(resize, 250));
  canvas.addEventListener('pointerdown', onPointer);
  resize();
  requestAnimationFrame(loop);
}

export function resize() {
  dpr = Math.min(window.devicePixelRatio || 1, 2.5);
  const rect = canvas.getBoundingClientRect();
  G.W = Math.max(320, rect.width);
  G.H = Math.max(320, rect.height);
  canvas.width = Math.round(G.W * dpr);
  canvas.height = Math.round(G.H * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  relayout();
}

function relayout() {
  if (!G.tubes.length) return;
  G.layout = computeLayout(G.W, G.H, G.tubes.length, G.cap);
  R.buildSprites(G.layout.r, dpr);
}

/* ═══ BẮT ĐẦU VÒNG ═══ */
export function startLevel(n, keepBoard) {
  const L = keepBoard || buildLevel(n);
  G.level = n;
  G.initial = { tubes: L.tubes.map((t) => t.slice()), cap: L.cap, plan: L.plan, par: L.par };
  G.tubes = L.tubes.map((t) => t.slice());
  G.cap = L.cap;
  G.plan = L.plan;
  G.par = L.par;
  G.moves = 0;
  G.sel = -1;
  G.flyers.length = 0;
  G.history.length = 0;
  G.doneSet = new Set();
  G.hint = null;
  G.wandMode = false;
  G.finished = false;
  G.locked = false;
  FX.clearFx();
  relayout();
  markDone(true);
  hooks.onChange && hooks.onChange();
}

// Chơi lại đúng bàn cũ chứ không xáo ván mới, để bé thử lại cách khác.
export function restartLevel() { startLevel(G.level, G.initial); }

function markDone(silent) {
  G.tubes.forEach((t, i) => {
    if (t.length === G.cap && isPure(t)) G.doneSet.add(i);
  });
  if (silent) return;
}

/* ═══ CHẠM ═══ */
function tubeAt(px, py) {
  const L = G.layout;
  if (!L) return -1;
  const d = L.d;
  for (let i = 0; i < L.tubes.length; i++) {
    const t = L.tubes[i];
    if (px >= t.x - d * 0.16 && px <= t.x + t.w + d * 0.16 &&
        py >= t.y - d * 0.95 && py <= t.y + t.h + d * 0.28) return i;
  }
  return -1;
}

function onPointer(e) {
  if (G.locked || G.finished) return;
  const rect = canvas.getBoundingClientRect();
  const i = tubeAt(e.clientX - rect.left, e.clientY - rect.top);
  if (i < 0) { if (G.sel >= 0) { G.sel = -1; A.sBack(); } return; }
  A.ac();
  if (G.wandMode) { useWandOn(i); return; }
  tapTube(i);
}

function tapTube(i) {
  G.hint = null;
  if (G.sel < 0) {
    if (!G.tubes[i].length) { A.sBack(); return; }
    if (G.tubes[i].length === G.cap && isPure(G.tubes[i])) { A.sBack(); return; }
    G.sel = i;
    A.sLift();
    return;
  }
  if (i === G.sel) { G.sel = -1; A.sBack(); return; }
  const k = canPour(G.tubes, G.sel, i, G.cap);
  if (!k) {
    // Không rót được: thử chọn ống mới cho bé đỡ phải chạm hai lần.
    if (G.tubes[i].length && !(G.tubes[i].length === G.cap && isPure(G.tubes[i]))) {
      G.sel = i; A.sLift();
    } else { A.sNope(); shake = 1; }
    return;
  }
  doMove(G.sel, i, k);
  G.sel = -1;
}

/* ═══ NƯỚC ĐI ═══ */
function snapshot() {
  G.history.push({ tubes: G.tubes.map((t) => t.slice()), moves: G.moves, done: [...G.doneSet] });
  if (G.history.length > 60) G.history.shift();
}

function doMove(from, to, k) {
  snapshot();
  const L = G.layout;
  const color = topColor(G.tubes[from]);
  const srcT = L.tubes[from], dstT = L.tubes[to];
  const baseFrom = G.tubes[from].length;
  const baseTo = G.tubes[to].length;
  const lane = Math.min(srcT.y, dstT.y) - L.d * 0.62;

  for (let n = 0; n < k; n++) G.tubes[from].pop();

  for (let n = 0; n < k; n++) {
    G.flyers.push({
      color,
      x0: srcT.cx, y0: L.ballY(srcT, baseFrom - 1 - n),
      x1: dstT.cx, y1: L.ballY(dstT, baseTo + n),
      lane, t: -n * BALL_STAGGER, dur: BALL_DUR,
      to, slot: baseTo + n, landed: false,
    });
  }
  G.moves++;
  G.locked = true;
  hooks.onChange && hooks.onChange();
}

function landFlyer(f) {
  G.tubes[f.to].push(f.color);
  const L = G.layout, t = L.tubes[f.to];
  const y = L.ballY(t, G.tubes[f.to].length - 1);
  A.sDrop(G.tubes[f.to].length - 1);
  FX.splash(t.cx, y + L.r * 0.5, COLORS[f.color].light, 7);

  if (G.tubes[f.to].length === G.cap && isPure(G.tubes[f.to]) && !G.doneSet.has(f.to)) {
    G.doneSet.add(f.to);
    const c = COLORS[f.color];
    A.sTubeDone(G.doneSet.size - 1);
    FX.sparkBurst(t.cx, t.y + t.h * 0.45, c.light, 20, 1.25);
    FX.sparkBurst(t.cx, t.y + t.h * 0.45, '#fff6c8', 10, 0.9);
    FX.ring(t.cx, t.y + t.h * 0.5, c.light, L.r * 0.6, L.r * 3.4, 620);
  }
}

function afterAnim() {
  G.locked = false;
  if (solved(G.tubes)) { finish(); return; }
  hooks.onChange && hooks.onChange();
  checkStuck();
}

function checkStuck() {
  if (hooks.onStuck && !hasAnyMove()) hooks.onStuck();
}

// Còn nước nào đi được không? Dùng để nhắc bé khi bàn chơi tắc.
function hasAnyMove() {
  for (let i = 0; i < G.tubes.length; i++) {
    for (let j = 0; j < G.tubes.length; j++) if (canPour(G.tubes, i, j, G.cap)) return true;
  }
  return false;
}

function finish() {
  G.finished = true;
  G.locked = true;
  const stars = G.moves <= G.par * 1.5 ? 3 : G.moves <= G.par * 2.2 ? 2 : 1;
  A.duckMusic(2600);
  A.sWin();
  FX.confetti(G.W, G.H, 110);
  for (const t of G.layout.tubes) {
    FX.sparkBurst(t.cx, t.y + t.h * 0.4, '#fff2b0', 8, 1);
  }
  setTimeout(() => hooks.onWin && hooks.onWin({ level: G.level, moves: G.moves, stars, par: G.par }), 900);
}

/* ═══ VẬT PHẨM ═══ */
export function undo() {
  if (G.locked || G.finished || !G.history.length) return false;
  const h = G.history.pop();
  G.tubes = h.tubes;
  G.moves = h.moves;
  G.doneSet = new Set(h.done);
  G.sel = -1;
  G.hint = null;
  A.sUndo();
  hooks.onChange && hooks.onChange();
  return true;
}

export function addTube() {
  if (G.locked || G.finished) return false;
  G.tubes.push([]);
  G.history.forEach((h) => h.tubes.push([]));
  relayout();
  const t = G.layout.tubes[G.tubes.length - 1];
  A.sNewTube();
  FX.sparkBurst(t.cx, t.y + t.h * 0.5, '#bfefff', 22, 1.2);
  FX.ring(t.cx, t.y + t.h * 0.5, '#bfefff', 10, G.layout.r * 3.6, 620);
  hooks.onChange && hooks.onChange();
  return true;
}

export function armWand() {
  if (G.locked || G.finished) return false;
  G.wandMode = true; G.sel = -1; G.hint = null;
  canvas.classList.add('wand');
  return true;
}
export function disarmWand() { G.wandMode = false; canvas.classList.remove('wand'); }

function useWandOn(i) {
  if (!G.tubes[i].length) { A.sNope(); return; }
  snapshot();
  const L = G.layout, t = L.tubes[i];
  const y = L.ballY(t, G.tubes[i].length - 1);
  const c = COLORS[G.tubes[i].pop()];
  A.sWand();
  FX.sparkBurst(t.cx, y, c.light, 26, 1.3);
  FX.sparkBurst(t.cx, y, '#ffffff', 12, 0.8);
  FX.ring(t.cx, y, c.light, 6, L.r * 3, 560);
  disarmWand();
  G.doneSet.delete(i);
  markDone(true);
  if (solved(G.tubes)) { finish(); return; }
  hooks.onChange && hooks.onChange();
  checkStuck();
}

export function showHint() {
  if (G.locked || G.finished) return false;
  const m = hintMove(G.tubes, G.cap);
  if (!m) { A.sNope(); return false; }
  G.hint = m;
  G.hintUntil = performance.now() + 4200;
  G.sel = -1;
  A.sHint();
  return true;
}

/* ═══ VÒNG LẶP VẼ ═══ */
function step(dt) {
  // Cập nhật bóng đang bay.
  if (G.flyers.length) {
    for (let i = G.flyers.length - 1; i >= 0; i--) {
      const f = G.flyers[i];
      f.t += dt;
      if (f.t >= f.dur && !f.landed) { f.landed = true; landFlyer(f); G.flyers.splice(i, 1); }
    }
    if (!G.flyers.length) afterAnim();
  }
  FX.updateFx(dt);
  if (shake > 0) shake = Math.max(0, shake - dt / 260);
}

function loop(now) {
  const dt = Math.min(50, now - (lastT || now));
  lastT = now;
  step(dt);
  draw(now);
  requestAnimationFrame(loop);
}

// iPad tạm dừng requestAnimationFrame khi bé chuyển sang app khác; nhịp dự phòng
// này giúp nước đi đang dở vẫn kết thúc, tránh bàn chơi bị "đứng" lúc quay lại.
setInterval(() => {
  if (document.hidden && G.flyers.length) { step(60); lastT = 0; }
}, 120);

const easeOut = (t) => 1 - Math.pow(1 - t, 2.4);
const easeIn = (t) => t * t;
const easeInOut = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

function flyerPos(f) {
  const p = Math.max(0, Math.min(1, f.t / f.dur));
  let x, y;
  if (p < 0.3) {
    x = f.x0;
    y = f.y0 + (f.lane - f.y0) * easeOut(p / 0.3);
  } else if (p < 0.66) {
    const q = (p - 0.3) / 0.36;
    x = f.x0 + (f.x1 - f.x0) * easeInOut(q);
    y = f.lane - Math.sin(q * Math.PI) * 10;
  } else {
    const q = (p - 0.66) / 0.34;
    x = f.x1;
    y = f.lane + (f.y1 - f.lane) * easeIn(q);
  }
  return { x, y, p };
}

function draw(now) {
  const L = G.layout;
  ctx.save();
  if (shake > 0) {
    ctx.translate(Math.sin(now * 0.07) * 7 * shake, Math.sin(now * 0.11) * 3 * shake);
  }
  R.drawBackground(ctx, G.W, G.H, now);
  if (!L) { ctx.restore(); return; }

  const liftedIdx = G.sel >= 0 ? G.tubes[G.sel].length - 1 : -1;

  for (const t of L.tubes) R.drawTubeBack(ctx, t, L.d);

  // Bóng đang nằm yên trong ống (bỏ qua quả đang được nhấc lên).
  for (let i = 0; i < G.tubes.length; i++) {
    const t = L.tubes[i], stack = G.tubes[i];
    if (!stack.length) continue;
    ctx.save();
    R.clipTube(ctx, t);
    for (let j = 0; j < stack.length; j++) {
      if (i === G.sel && j === liftedIdx) continue;
      R.drawBall(ctx, t.cx, L.ballY(t, j), stack[j]);
    }
    ctx.restore();
  }

  // Kính phía trước + hào quang.
  const pulse = 0.55 + Math.sin(now * 0.006) * 0.45;
  for (let i = 0; i < L.tubes.length; i++) {
    let glow = 0, done = false;
    if (G.doneSet.has(i)) { glow = 0.45 + Math.sin(now * 0.003 + i) * 0.16; done = true; }
    if (i === G.sel) glow = Math.max(glow, 0.55 + pulse * 0.45);
    if (G.hint && now < G.hintUntil && (i === G.hint[0] || i === G.hint[1])) glow = Math.max(glow, pulse);
    R.drawTubeGlass(ctx, L.tubes[i], L.d, { glow, done: done && i !== G.sel });
  }

  // Quả bóng được nhấc lên khỏi miệng ống, nhún nhẹ.
  if (G.sel >= 0 && liftedIdx >= 0) {
    const t = L.tubes[G.sel];
    const bob = Math.sin(now * 0.005) * L.d * 0.05;
    R.drawBall(ctx, t.cx, t.y - L.d * 0.52 + bob, G.tubes[G.sel][liftedIdx], 1.06);
  }

  // Bóng đang bay.
  for (const f of G.flyers) {
    const { x, y } = flyerPos(f);
    R.drawBall(ctx, x, y, f.color);
  }

  // Mũi tên gợi ý.
  if (G.hint && now < G.hintUntil) {
    const a = L.tubes[G.hint[0]], b = L.tubes[G.hint[1]];
    R.drawHintArrow(ctx, a.cx, a.y - L.d * 0.95, now);
    R.drawHintArrow(ctx, b.cx, b.y - L.d * 0.95, now + 300);
  }

  FX.drawFx(ctx);
  ctx.restore();
}
