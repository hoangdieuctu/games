// ── Vẽ cảnh thành SVG ──
import { SCENE_W, SCENE_H } from './config.js';
import { col, shade } from './draw.js';

function objectSVG(o) {
  const spec = o.spec;
  const p = { c: o.tint ? shade(col(o.c1), o.tint) : col(o.c1), d: o.c2 ? col(o.c2) : null, n: o.n, hide: o.hide };
  const tf = `translate(${o.x.toFixed(1)} ${o.y.toFixed(1)}) rotate(${o.rot} 0 ${(o.top != null ? -spec.h * o.s : -spec.h * o.s / 2).toFixed(1)}) scale(${(o.s * o.flip).toFixed(3)} ${o.s.toFixed(3)})`;
  return `<g transform="${tf}">${spec.draw(p)}</g>`;
}

// side: 'L' (bản gốc) hoặc 'R' (bản có khác biệt)
export function sceneSVG(level, side) {
  const objs = side === 'L' ? level.left : level.right;
  const sorted = objs.map((o, i) => ({ o, i })).sort((a, b) => a.o.y - b.o.y || a.i - b.i);
  let s = level.theme.bg(level.variant, side);
  for (const { o } of sorted) if (!o.gone) s += objectSVG(o);
  return `<svg viewBox="0 0 ${SCENE_W} ${SCENE_H}" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet">`
    + `<g class="scene">${s}</g><g class="marks"></g></svg>`;
}

const SVG_NS = 'http://www.w3.org/2000/svg';
function el(tag, attrs) {
  const e = document.createElementNS(SVG_NS, tag);
  for (const k in attrs) e.setAttribute(k, attrs[k]);
  return e;
}

// Vòng tròn xanh đánh dấu điểm đã tìm được.
export function markFound(svg, hit) {
  const g = svg.querySelector('.marks');
  const ring = el('circle', { cx: hit.x, cy: hit.y, r: hit.r, fill: 'rgba(76,175,80,.18)', stroke: '#2e7d32', 'stroke-width': 5 });
  const a = el('animate', { attributeName: 'r', from: hit.r * 1.8, to: hit.r, dur: '0.35s', fill: 'freeze' });
  ring.appendChild(a);
  g.appendChild(ring);
  const ok = el('text', { x: hit.x + hit.r * 0.7, y: hit.y - hit.r * 0.7, 'font-size': 30, 'text-anchor': 'middle', fill: '#2e7d32', 'font-weight': 'bold' });
  ok.textContent = '✓';
  g.appendChild(ok);
}

// Dấu ✕ đỏ mờ dần khi bấm nhầm.
export function markWrong(svg, x, y) {
  const g = svg.querySelector('.marks');
  const grp = el('g', { transform: `translate(${x} ${y})`, opacity: 1 });
  grp.appendChild(el('path', { d: 'M-16 -16 L16 16 M16 -16 L-16 16', stroke: '#e53935', 'stroke-width': 7, 'stroke-linecap': 'round', fill: 'none' }));
  grp.appendChild(el('animate', { attributeName: 'opacity', from: 1, to: 0, begin: '0.3s', dur: '0.5s', fill: 'freeze' }));
  g.appendChild(grp);
  setTimeout(() => grp.remove(), 900);
}

// Vòng gợi ý nhấp nháy; trả về hàm để xoá.
export function markHint(svg, hit, seconds) {
  const g = svg.querySelector('.marks');
  const ring = el('circle', { cx: hit.x, cy: hit.y, r: hit.r, fill: 'none', stroke: '#ffb300', 'stroke-width': 6, 'stroke-dasharray': '14 10', class: 'hint-ring' });
  ring.appendChild(el('animate', { attributeName: 'r', values: `${hit.r};${hit.r + 14};${hit.r}`, dur: '1s', repeatCount: 'indefinite' }));
  g.appendChild(ring);
  const t = setTimeout(() => ring.remove(), seconds * 1000);
  return () => { clearTimeout(t); ring.remove(); };
}
