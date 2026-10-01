// ── Bàn phím (WASD/mũi tên, Space/E = hành động) và joystick cảm ứng ──
import { $ } from './state.js';

export const input = { mx: 0, my: 0, keys: new Set(), stick: null };
let onAction = () => {}, onMove = () => {};

export function initInput(canvas, handlers) {
  onAction = handlers.onAction; onMove = handlers.onMove || onMove;
  const keyMap = { ArrowUp: 'u', KeyW: 'u', ArrowDown: 'd', KeyS: 'd', ArrowLeft: 'l', KeyA: 'l', ArrowRight: 'r', KeyD: 'r' };
  const typing = () => { const a = document.activeElement; return a && (a.tagName === 'INPUT' || a.tagName === 'TEXTAREA'); };
  addEventListener('keydown', e => {
    if (typing()) return;
    if (keyMap[e.code]) { input.keys.add(keyMap[e.code]); e.preventDefault(); recompute(); }
    else if (e.code === 'Space' || e.code === 'KeyE' || e.code === 'Enter') { if (!e.repeat) onAction(); e.preventDefault(); }
    else if (e.code === 'Escape') handlers.onEscape && handlers.onEscape();
    else if (e.code === 'KeyB') handlers.onBuild && handlers.onBuild();
  });
  addEventListener('keyup', e => { if (keyMap[e.code]) { input.keys.delete(keyMap[e.code]); recompute(); } });
  addEventListener('blur', () => { input.keys.clear(); recompute(); });

  // joystick: chạm bất kỳ đâu trên canvas rồi kéo
  const stick = $('stick'), knob = $('knob');
  const R = 46;
  canvas.addEventListener('pointerdown', e => {
    if (input.stick) return;
    canvas.setPointerCapture(e.pointerId);
    input.stick = { id: e.pointerId, x: e.clientX, y: e.clientY, moved: false };
    stick.style.left = e.clientX + 'px'; stick.style.top = e.clientY + 'px'; stick.hidden = false;
    knob.style.transform = 'translate(0,0)';
  });
  canvas.addEventListener('pointermove', e => {
    const s = input.stick; if (!s || s.id !== e.pointerId) return;
    let dx = e.clientX - s.x, dy = e.clientY - s.y;
    const len = Math.hypot(dx, dy);
    if (len > 8) s.moved = true;
    if (len > R) { dx *= R / len; dy *= R / len; }
    knob.style.transform = `translate(${dx}px,${dy}px)`;
    const dead = len < 8;
    s.mx = dead ? 0 : dx / R; s.my = dead ? 0 : dy / R;
    recompute();
  });
  const end = e => {
    const s = input.stick; if (!s || s.id !== e.pointerId) return;
    if (!s.moved && handlers.onTap) handlers.onTap(e.clientX, e.clientY);
    input.stick = null; stick.hidden = true; recompute();
  };
  canvas.addEventListener('pointerup', end); canvas.addEventListener('pointercancel', end);
}
function recompute() {
  let mx = 0, my = 0;
  const k = input.keys;
  if (k.has('l')) mx -= 1; if (k.has('r')) mx += 1; if (k.has('u')) my -= 1; if (k.has('d')) my += 1;
  if (input.stick && (input.stick.mx || input.stick.my)) { mx = input.stick.mx; my = input.stick.my; }
  const changed = mx !== input.mx || my !== input.my;
  input.mx = mx; input.my = my;
  if (changed) onMove();
}
