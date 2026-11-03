// ── Chủ đề NHÀ BẾP: nền và đồ vật ──
import { S, L, rep, hl, spread, shade } from './draw.js';

const WOOD = '#8d6e63', DARK = '#455a64', METAL = '#c7ccd1';

export const KITCHEN_OBJECTS = [
  { id: 'pot', w: 84, h: 66, zones: ['counter', 'shelf'], c1: ['red', 'blue', 'green', 'orange', 'gray', 'teal'], parts: ['lid', 'handle'],
    draw: ({ c, hide }) =>
      (hide !== 'handle' ? `<path d="M-36 -34 h-10 v9 h10 M36 -34 h10 v9 h-10" ${L(shade(c, -.45), 4.5)}/>` : '')
      + `<rect x="-34" y="-44" width="68" height="44" rx="8" ${S(c)}/>${hl(-28, -38, 10, 30, 5)}`
      + (hide !== 'lid' ? `<path d="M-38 -44 h76 v-5 a8 8 0 0 0 -8 -8 h-60 a8 8 0 0 0 -8 8 z" ${S(METAL)}/><rect x="-6" y="-64" width="12" height="8" rx="3" ${S(DARK)}/>` : '') },

  { id: 'pan', w: 104, h: 30, zones: ['counter', 'shelf'], c1: ['black', 'gray', 'red', 'blue', 'teal'], asym: true,
    draw: ({ c }) =>
      `<rect x="20" y="-22" width="44" height="8" rx="4" ${S(WOOD)}/>`
      + `<path d="M-50 -24 H24 L18 -2 H-44 Z" ${S(c)}/><rect x="-46" y="-23" width="66" height="4" fill="${shade(c, .35)}"/>` },

  { id: 'kettle', w: 84, h: 74, zones: ['counter', 'shelf'], c1: ['red', 'blue', 'teal', 'cream', 'purple', 'gray'], asym: true, parts: ['handle'],
    draw: ({ c, hide }) =>
      `<path d="M-30 -30 L-46 -50 L-38 -54 L-22 -36 Z" ${S(c)}/>`
      + `<path d="M-32 0 H32 Q40 -30 20 -48 H-20 Q-40 -30 -32 0 Z" ${S(c)}/>${hl(-22, -40, 8, 26, 4)}`
      + `<rect x="-16" y="-54" width="32" height="8" rx="3" ${S(shade(c, -.2))}/><circle cx="0" cy="-56" r="4" ${S(DARK)}/>`
      + (hide !== 'handle' ? `<path d="M-12 -54 Q0 -76 12 -54" ${L(DARK, 5)}/>` : '') },

  { id: 'mug', w: 56, h: 46, zones: ['counter', 'shelf'], c1: ['red', 'blue', 'green', 'yellow', 'pink', 'purple', 'cyan'], n: [2, 5], asym: true,
    draw: ({ c, n }) =>
      `<path d="M20 -32 Q40 -32 40 -20 Q40 -8 20 -8" ${L(shade(c, -.45), 10)}/><path d="M20 -32 Q40 -32 40 -20 Q40 -8 20 -8" ${L(c, 5)}/>`
      + `<rect x="-20" y="-42" width="40" height="42" rx="6" ${S(c)}/>`
      + rep(n, (i) => `<circle cx="${spread(i, n, -13, 13).toFixed(1)}" cy="${-22 + (i % 2) * 9}" r="3.2" fill="#fff" opacity=".85"/>`) },

  { id: 'plate', w: 58, h: 58, zones: ['counter', 'shelf'], c1: ['blue', 'red', 'green', 'pink', 'orange', 'purple'], n: [4, 8], rot: false,
    draw: ({ c, n }) =>
      `<circle cx="0" cy="-29" r="29" ${S('#fafafa', 2)}/><circle cx="0" cy="-29" r="19" fill="${shade(c, .6)}" stroke="${c}" stroke-width="3"/>`
      + rep(n, (i) => { const a = -Math.PI / 2 + i * 2 * Math.PI / n; return `<circle cx="${(24 * Math.cos(a)).toFixed(1)}" cy="${(-29 + 24 * Math.sin(a)).toFixed(1)}" r="3" fill="${c}"/>`; }) },

  { id: 'knife', w: 92, h: 20, zones: ['counter'], c1: ['black', 'brown', 'red', 'blue'], asym: true,
    draw: ({ c }) =>
      `<path d="M-46 -10 H22 Q32 -10 32 -5 L-46 -2 Z" ${S('#cfd8dc', 2)}/><rect x="28" y="-14" width="32" height="12" rx="4" ${S(c)}/>` },

  { id: 'board', w: 92, h: 40, zones: ['counter'], c1: ['red', 'green', 'orange'], n: [1, 4], asym: true,
    draw: ({ c, n }) =>
      `<rect x="-46" y="-40" width="72" height="40" rx="8" ${S('#c8955a')}/><circle cx="36" cy="-20" r="10" ${S('#c8955a')}/><circle cx="36" cy="-20" r="3.5" fill="#6d4c41"/>`
      + rep(n, (i) => `<circle cx="${spread(i, n, -32, 10).toFixed(1)}" cy="-20" r="8" ${S(c)}/><circle cx="${spread(i, n, -32, 10).toFixed(1)}" cy="-20" r="4" fill="#fff" opacity=".45"/>`) },

  { id: 'apple', w: 44, h: 50, zones: ['counter', 'shelf'], c1: ['red', 'green', 'yellow'], asym: true, parts: ['leaf'],
    draw: ({ c, hide }) =>
      `<circle cx="0" cy="-20" r="20" ${S(c)}/><ellipse cx="-8" cy="-27" rx="5" ry="8" fill="#fff" opacity=".35"/>`
      + `<path d="M0 -40 Q2 -48 6 -50" ${L('#5d4037', 3)}/>`
      + (hide !== 'leaf' ? `<path d="M2 -44 Q14 -56 20 -46 Q10 -40 2 -44 Z" ${S('#43a047')}/>` : '') },

  { id: 'banana', w: 70, h: 36, zones: ['counter', 'shelf'], c1: ['yellow', 'lime', 'green'], asym: true,
    draw: ({ c }) =>
      `<path d="M-34 -32 Q-10 8 34 -16 Q38 -8 32 -8 Q-6 14 -36 -28 Z" ${S(c)}/><path d="M32 -18 l6 -8" ${L(shade(c, -.5), 3)}/>` },

  { id: 'bottle', w: 32, h: 92, zones: ['counter', 'shelf'], c1: ['yellow', 'green', 'red', 'orange', 'brown', 'teal'], c2: ['red', 'blue', 'black', 'white', 'green'], parts: ['cap', 'label'],
    draw: ({ c, d, hide }) =>
      `<rect x="-14" y="-62" width="28" height="62" rx="6" ${S(shade(c, .1))}/><path d="M-14 -62 L-6 -80 H6 L14 -62 Z" ${S(c)}/>`
      + (hide !== 'cap' ? `<rect x="-7" y="-91" width="14" height="12" rx="3" ${S(d)}/>` : '')
      + (hide !== 'label' ? `<rect x="-11" y="-46" width="22" height="20" rx="3" fill="#fff" stroke="#ddd"/><rect x="-7" y="-40" width="14" height="3" fill="${c}"/><rect x="-7" y="-34" width="10" height="3" fill="#bbb"/>` : '') },

  { id: 'jar', w: 50, h: 60, zones: ['counter', 'shelf'], c1: ['red', 'blue', 'green', 'yellow', 'black'], c2: ['brown', 'pink', 'yellow', 'lime', 'purple'], n: [2, 6],
    draw: ({ c, d, n }) =>
      `<rect x="-22" y="-48" width="44" height="48" rx="8" fill="#e3f2fd" stroke="#90a4ae" stroke-width="2.5"/>`
      + rep(n, (i) => `<circle cx="${-12 + (i % 3) * 12}" cy="${-12 - Math.floor(i / 3) * 14}" r="6" ${S(d, 1.5)}/>`)
      + `<rect x="-24" y="-60" width="48" height="13" rx="4" ${S(c)}/>${hl(-14, -44, 6, 36, 3)}` },

  { id: 'toaster', w: 76, h: 60, zones: ['counter'], c1: ['red', 'cyan', 'cream', 'gray', 'pink', 'lime'], n: [0, 2], asym: true,
    draw: ({ c, n }) =>
      rep(n, (i) => `<path d="M${-24 + i * 28} -44 v-12 a10 10 0 0 1 20 0 v12 z" ${S('#e0b168')}/>`)
      + `<rect x="-36" y="-42" width="72" height="42" rx="8" ${S(c)}/><rect x="-26" y="-46" width="22" height="7" rx="2" fill="${DARK}"/><rect x="2" y="-46" width="22" height="7" rx="2" fill="${DARK}"/>`
      + `<rect x="34" y="-30" width="7" height="14" rx="2" ${S(DARK, 1.5)}/>${hl(-30, -34, 8, 26, 4)}` },

  { id: 'clock', w: 56, h: 56, zones: ['wall'], c1: ['red', 'blue', 'yellow', 'green', 'black'], asym: true,
    draw: ({ c }) =>
      `<circle cx="0" cy="-28" r="28" ${S(c)}/><circle cx="0" cy="-28" r="21" fill="#fff" stroke="#cfd8dc" stroke-width="2"/>`
      + `<path d="M0 -46 v4 M0 -14 v4 M-18 -28 h4 M18 -28 h-4" ${L('#555', 2)}/>`
      + `<path d="M0 -28 V-42 M0 -28 L10 -20" ${L('#333', 3)}/><circle cx="0" cy="-28" r="2.5" fill="#e53935"/>` },

  { id: 'ladle', w: 34, h: 76, zones: ['wall'], c1: ['gray', 'black', 'red', 'yellow', 'teal'],
    draw: ({ c }) =>
      `<circle cx="0" cy="-70" r="4" ${L('#555', 2.5)}/><path d="M0 -66 V-20" ${L(c, 7)}/>`
      + `<path d="M-15 -20 H15 Q15 0 0 0 Q-15 0 -15 -20 Z" ${S(c)}/>` },

  { id: 'towel', w: 52, h: 66, zones: ['wall'], c1: ['red', 'blue', 'green', 'yellow', 'pink', 'purple', 'cyan'], n: [1, 4],
    draw: ({ c, n }) =>
      `<rect x="-20" y="-58" width="40" height="58" rx="4" ${S(c)}/>`
      + rep(n, (i) => `<rect x="-20" y="${-50 + i * 12}" width="40" height="5" fill="#fff" opacity=".65"/>`)
      + `<rect x="-26" y="-66" width="52" height="7" rx="3.5" ${S(WOOD)}/>` },

  { id: 'shaker', w: 26, h: 44, zones: ['counter', 'shelf'], c1: ['red', 'blue', 'black', 'green', 'yellow'],
    draw: ({ c }) =>
      `<rect x="-10" y="-33" width="20" height="33" rx="5" fill="#fff" stroke="#b0bec5" stroke-width="2"/><rect x="-6" y="-24" width="12" height="12" rx="2" fill="${shade(c, .5)}"/>`
      + `<rect x="-11" y="-44" width="22" height="12" rx="4" ${S(c)}/><circle cx="-5" cy="-38" r="1.5" fill="#fff"/><circle cx="0" cy="-38" r="1.5" fill="#fff"/><circle cx="5" cy="-38" r="1.5" fill="#fff"/>` },

  { id: 'bowl', w: 70, h: 46, zones: ['counter', 'shelf'], c1: ['blue', 'red', 'green', 'cream', 'purple'], c2: ['orange', 'red', 'green', 'yellow', 'purple'], n: [1, 4],
    draw: ({ c, d, n }) =>
      rep(n, (i) => `<circle cx="${spread(i, n, -20, 20).toFixed(1)}" cy="${-32 + (i % 2) * 3}" r="10" ${S(d)}/>`)
      + `<path d="M-33 -26 H33 Q31 0 0 0 Q-31 0 -33 -26 Z" ${S(c)}/>${hl(-24, -20, 8, 12, 4)}` },

  { id: 'cat', w: 68, h: 54, zones: ['floor'], c1: ['orange', 'gray', 'black', 'white', 'brown'], asym: true, parts: ['tail'],
    draw: ({ c, hide }) =>
      (hide !== 'tail' ? `<path d="M30 -18 Q48 -30 42 -48" ${L(shade(c, -.45), 8)}/><path d="M30 -18 Q48 -30 42 -48" ${L(c, 4.5)}/>` : '')
      + `<ellipse cx="6" cy="-14" rx="26" ry="14" ${S(c)}/>`
      + `<path d="M-30 -40 l-3 -13 l11 6 z M-6 -40 l3 -13 l-11 6 z" ${S(c)}/><circle cx="-18" cy="-32" r="14" ${S(c)}/>`
      + `<circle cx="-23" cy="-34" r="2.2" fill="#222"/><circle cx="-13" cy="-34" r="2.2" fill="#222"/><path d="M-20 -27 q2 2 4 0" ${L('#222', 1.5)}/>`
      + `<path d="M-30 -28 h-8 M-30 -25 h-8 M-6 -28 h8 M-6 -25 h8" ${L('#555', 1.2)}/>` },

  { id: 'bin', w: 54, h: 64, zones: ['floor'], c1: ['green', 'gray', 'blue', 'red', 'black'], parts: ['lid'],
    draw: ({ c, hide }) =>
      `<path d="M-20 0 H20 L24 -50 H-24 Z" ${S(c)}/><path d="M-12 -40 V-10 M0 -40 V-10 M12 -40 V-10" ${L(shade(c, -.3), 2)}/>`
      + (hide !== 'lid' ? `<rect x="-27" y="-58" width="54" height="10" rx="4" ${S(shade(c, -.15))}/><rect x="-6" y="-64" width="12" height="6" rx="2" ${S(shade(c, -.3))}/>` : '') },

  { id: 'stool', w: 56, h: 60, zones: ['floor'], c1: ['red', 'blue', 'yellow', 'green', 'pink', 'brown'],
    draw: ({ c }) =>
      `<path d="M-18 -50 L-24 0 M18 -50 L24 0 M-20 -20 H20" ${L(WOOD, 5)}/><rect x="-28" y="-60" width="56" height="12" rx="6" ${S(c)}/>` },
];

const WALLS = ['#fde9c9', '#dcedc8', '#e3f2fd'];
const COUNTERS = ['#8d6e63', '#546e7a', '#a1887f'];
const CABS = ['#f5f5f5', '#fff8e1', '#ffffff'];

export function kitchenBg(v) {
  const wall = WALLS[v], counter = COUNTERS[v], cab = CABS[v];
  let s = `<rect width="800" height="500" fill="${wall}"/>`;
  // gạch ốp tường
  s += `<g stroke="${shade(wall, -.08)}" stroke-width="1.5">`;
  for (let x = 0; x <= 800; x += 50) s += `<path d="M${x} 0 V330"/>`;
  for (let y = 0; y <= 330; y += 50) s += `<path d="M0 ${y} H800"/>`;
  s += '</g>';
  // cửa sổ
  s += `<rect x="574" y="44" width="172" height="152" rx="6" fill="#81d4fa" stroke="#eceff1" stroke-width="8"/>`
     + `<path d="M660 44 V196 M574 120 H746" stroke="#eceff1" stroke-width="6"/>`
     + `<circle cx="620" cy="90" r="16" fill="#fff59d"/><ellipse cx="700" cy="150" rx="26" ry="9" fill="#fff" opacity=".8"/>`
     + `<path d="M574 40 H620 Q610 120 590 196 H574 Z" fill="#ef9a9a" opacity=".9"/><path d="M746 40 H700 Q710 120 730 196 H746 Z" fill="#ef9a9a" opacity=".9"/>`;
  // kệ treo tường
  s += `<rect x="40" y="150" width="490" height="12" rx="3" fill="${counter}" stroke="${shade(counter, -.3)}" stroke-width="2"/>`
     + `<path d="M70 162 v14 M500 162 v14" stroke="${shade(counter, -.3)}" stroke-width="4"/>`;
  // mặt bàn bếp và tủ dưới
  s += `<rect x="0" y="372" width="800" height="98" fill="${cab}" stroke="#cfd8dc" stroke-width="2"/>`;
  for (let x = 20; x < 800; x += 130) {
    s += `<rect x="${x}" y="386" width="110" height="72" rx="6" fill="none" stroke="#cfd8dc" stroke-width="3"/><circle cx="${x + 55}" cy="422" r="4" fill="#90a4ae"/>`;
  }
  s += `<rect x="0" y="332" width="800" height="42" rx="4" fill="${counter}" stroke="${shade(counter, -.35)}" stroke-width="2"/><rect x="0" y="332" width="800" height="8" fill="${shade(counter, .25)}"/>`;
  // sàn ca-rô
  s += `<rect x="0" y="470" width="800" height="30" fill="#d7ccc8"/>`;
  for (let x = 0; x < 800; x += 60) s += `<rect x="${x}" y="470" width="30" height="30" fill="#bcaaa4"/><rect x="${x + 30}" y="485" width="30" height="15" fill="#bcaaa4" opacity=".5"/>`;
  return s;
}

export const KITCHEN = {
  id: 'kitchen', name: 'Nhà bếp', emoji: '🍳', variants: 3,
  zones: {
    shelf:   { rects: [{ x1: 60, x2: 510, y1: 150, y2: 150 }], scale: 0.72 },
    wall:    { rects: [{ x1: 60, x2: 740, y1: 236, y2: 300 }], scale: 0.95 },
    counter: { rects: [{ x1: 40, x2: 760, y1: 338, y2: 366 }], scale: 1 },
    floor:   { rects: [{ x1: 50, x2: 750, y1: 480, y2: 494 }], scale: 1 },
  },
  objects: KITCHEN_OBJECTS,
  bg: kitchenBg,
};
