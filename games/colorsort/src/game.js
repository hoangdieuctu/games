// ── Luật chơi, hoạt ảnh rót bóng và các vật phẩm hỗ trợ ──
import { COLORS, BALL_DUR, BALL_STAGGER } from './config.js';
import { buildLevel, canPour, runLen, topColor, solved, isPure } from './level.js';
import { computeLayout } from './layout.js';
import * as R from './render.js';
import * as FX from './fx.js';

export const G = {
  level: 1, tubes: [], cap: 4, plan: null, par: 10,
  moves: 0, sel: -1, flyers: [], history: [],
  doneSet: new Set(), doneAt: new Map(), nudgeAt: new Map(), mark: null,
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
  // Số trên bóng được vẽ sẵn vào sprite; phông chữ về muộn thì vẽ lại cả bộ.
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => { R.invalidateSprites(); relayout(); });
  }
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
  G.doneAt = new Map();
  G.nudgeAt = new Map();
  G.mark = null;
  G.finished = false;
  G.locked = false;
  FX.clearFx();
  relayout();
  markDone();
  hooks.onChange && hooks.onChange();
}

// Chơi lại đúng bàn cũ chứ không xáo ván mới, để bé thử lại cách khác.
export function restartLevel() { startLevel(G.level, G.initial); }

// ── Cất / dựng lại ván đang chơi dở ──
// Chỉ cất khi bàn đang đứng yên: lúc bóng còn bay, số bóng đã rời ống nguồn
// nhưng chưa tới ống đích, cất lúc đó là mất bóng.
export function boardSnapshot() {
  if (G.locked || G.flyers.length || G.finished || !G.tubes.length) return null;
  return {
    level: G.level, cap: G.cap, par: G.par, plan: G.plan, moves: G.moves,
    tubes: G.tubes.map((t) => t.slice()),
    initial: G.initial.tubes.map((t) => t.slice()),
    history: G.history.slice(-20).map((h) => ({ tubes: h.tubes.map((t) => t.slice()), moves: h.moves, done: h.done })),
    mark: G.mark ? { tubes: G.mark.tubes.map((t) => t.slice()), moves: G.mark.moves, done: G.mark.done.slice() } : null,
  };
}

export function restoreLevel(b) {
  G.level = b.level;
  G.cap = b.cap;
  G.plan = b.plan || null;
  G.par = b.par || b.cap * 4;
  G.tubes = b.tubes.map((t) => t.slice());
  G.initial = { tubes: b.initial.map((t) => t.slice()), cap: b.cap, plan: b.plan, par: b.par };
  G.moves = b.moves || 0;
  G.history = (b.history || []).map((h) => ({ tubes: h.tubes.map((t) => t.slice()), moves: h.moves, done: h.done }));
  G.sel = -1;
  G.flyers.length = 0;
  G.doneSet = new Set();
  G.doneAt = new Map();
  G.nudgeAt = new Map();
  G.mark = b.mark ? { tubes: b.mark.tubes.map((t) => t.slice()), moves: b.mark.moves, done: b.mark.done.slice() } : null;
  G.finished = false;
  G.locked = false;
  FX.clearFx();
  relayout();
  markDone();
  hooks.onChange && hooks.onChange();
}

// Ống đã đầy một màu thì coi như đóng nút chai: khoá lại, chạm vào cũng không mở.
export function isSealed(i) {
  return G.tubes[i].length === G.cap && isPure(G.tubes[i]);
}

function markDone() {
  G.tubes.forEach((t, i) => {
    if (isSealed(i) && !G.doneSet.has(i)) { G.doneSet.add(i); G.doneAt.set(i, 0); }
  });
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
  if (i < 0) { G.sel = -1; return; }
  tapTube(i);
}

function tapTube(i) {
  // Ống đã đóng nút: chỉ cho nút nảy một cái rồi thôi, không chọn được.
  if (isSealed(i)) { G.nudgeAt.set(i, performance.now()); return; }

  if (G.sel < 0) {
    if (!G.tubes[i].length) return;
    G.sel = i;
    return;
  }
  if (i === G.sel) { G.sel = -1; return; }
  const k = canPour(G.tubes, G.sel, i, G.cap);
  if (!k) {
    // Không rót được: thử chọn ống mới cho bé đỡ phải chạm hai lần.
    if (G.tubes[i].length) { G.sel = i; }
    else { shake = 1; }
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
  FX.splash(t.cx, y + L.r * 0.5, COLORS[f.color].light, 7);

  if (isSealed(f.to) && !G.doneSet.has(f.to)) {
    G.doneSet.add(f.to);
    G.doneAt.set(f.to, performance.now());
    const c = COLORS[f.color];
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
  for (const i of [...G.doneAt.keys()]) if (!G.doneSet.has(i)) G.doneAt.delete(i);
  G.sel = -1;
  hooks.onChange && hooks.onChange();
  return true;
}

export function addTube() {
  if (G.locked || G.finished) return false;
  G.tubes.push([]);
  G.history.forEach((h) => h.tubes.push([]));
  if (G.mark) G.mark.tubes.push([]);
  relayout();
  const t = G.layout.tubes[G.tubes.length - 1];
  FX.sparkBurst(t.cx, t.y + t.h * 0.5, '#bfefff', 22, 1.2);
  FX.ring(t.cx, t.y + t.h * 0.5, '#bfefff', 10, G.layout.r * 3.6, 620);
  hooks.onChange && hooks.onChange();
  return true;
}

/* ── Đánh dấu một chỗ để quay về ──
   Bé cắm "cờ" trước khi thử một nước mạo hiểm; hỏng thì bấm lần nữa là về đúng
   chỗ đã cắm, khỏi phải bấm Quay lại chục lần. Về tới nơi thì cờ nhổ đi, cắm
   lại ngay được nếu muốn thử tiếp lần nữa. */
export function setMark() {
  if (G.locked || G.finished || !G.tubes.length) return false;
  G.mark = { tubes: G.tubes.map((t) => t.slice()), moves: G.moves, done: [...G.doneSet] };
  const L = G.layout;
  if (L) for (const t of L.tubes) FX.sparkBurst(t.cx, t.y + t.h + L.d * 0.2, '#ffe07a', 3, 0.7);
  hooks.onChange && hooks.onChange();
  return true;
}

export function gotoMark() {
  if (G.locked || G.finished || !G.mark) return false;
  snapshot();                       // vẫn bấm Quay lại được nếu bé đổi ý
  const m = G.mark;
  G.tubes = m.tubes.map((t) => t.slice());
  G.moves = m.moves;
  G.doneSet = new Set(m.done);
  G.doneAt = new Map([...G.doneSet].map((i) => [i, 0]));
  G.nudgeAt = new Map();
  G.sel = -1;
  G.mark = null;
  const L = G.layout;
  if (L) FX.ring(G.W / 2, G.H / 2, '#ffe07a', 20, Math.max(G.W, G.H) * 0.5, 520);
  hooks.onChange && hooks.onChange();
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
  R.drawBackground(ctx, G.W, G.H, dpr);
  if (!L) { ctx.restore(); return; }

  const liftedIdx = G.sel >= 0 ? G.tubes[G.sel].length - 1 : -1;

  for (const t of L.tubes) R.drawTubeBack(ctx, t, L.d);

  // Số thứ tự của từng ống, nằm ngay dưới đáy.
  for (let i = 0; i < L.tubes.length; i++) R.drawTubeNumber(ctx, L.tubes[i], L.d, i + 1, i === G.sel);

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
    R.drawTubeGlass(ctx, L.tubes[i], L.d, { glow, done: done && i !== G.sel });
  }

  // Nút chai trên các ống đã xếp xong.
  for (const i of G.doneSet) {
    const t0 = G.doneAt.get(i);
    const grow = t0 ? Math.min(1, (now - t0) / 360) : 1;
    const n0 = G.nudgeAt.get(i);
    const nudge = n0 ? (now - n0) / 420 : 0;
    if (nudge >= 1) G.nudgeAt.delete(i);
    R.drawTubeCap(ctx, L.tubes[i], L.d, grow, nudge > 0 && nudge < 1 ? nudge : 0, G.tubes[i][0]);
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

  FX.drawFx(ctx);
  ctx.restore();
}
