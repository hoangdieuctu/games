// ── Chủ đề QUÁN ĂN: nền và đồ vật ──
import { S, L, rep, hl, spread, shade } from './draw.js';

const BUN = '#e0a050', DARK = '#455a64', WOOD = '#8d6e63';

export const RESTAURANT_OBJECTS = [
  { id: 'cake', w: 54, h: 56, zones: ['table'], c1: ['pink', 'brown', 'yellow', 'cream', 'purple'], parts: ['cherry'],
    draw: ({ c, hide }) =>
      `<path d="M-25 0 H25 V-30 L0 -44 L-25 -30 Z" ${S(c)}/><path d="M-25 -20 H25 M-25 -10 H25" ${L('#fff', 3)}/>`
      + `<path d="M-25 -30 L0 -44 L25 -30 L25 -26 L0 -40 L-25 -26 Z" fill="#fff" opacity=".7"/>`
      + (hide !== 'cherry' ? `<circle cx="0" cy="-49" r="5" ${S('#e53935')}/><path d="M0 -53 q3 -5 6 -6" ${L('#43a047', 2)}/>` : '') },

  { id: 'pizza', w: 64, h: 48, zones: ['table'], c1: ['red', 'green', 'brown', 'black'], n: [2, 6],
    draw: ({ c, n }) =>
      `<ellipse cx="0" cy="-22" rx="31" ry="22" ${S(BUN)}/><ellipse cx="0" cy="-22" rx="26" ry="17" fill="#e53935"/><ellipse cx="0" cy="-22" rx="23" ry="14" fill="#ffd54f"/>`
      + rep(n, (i) => { const a = i * 2 * Math.PI / n + .6; return `<circle cx="${(15 * Math.cos(a)).toFixed(1)}" cy="${(-22 + 9 * Math.sin(a)).toFixed(1)}" r="4" ${S(c, 1.5)}/>`; }) },

  { id: 'burger', w: 60, h: 54, zones: ['table'], c1: ['yellow', 'orange', 'red'], n: [2, 5],
    draw: ({ c, n }) =>
      `<path d="M-27 0 H27 V-10 H-27 Z" ${S(BUN)}/><rect x="-29" y="-19" width="58" height="10" rx="3" ${S('#6d4c41')}/>`
      + `<path d="M-29 -22 H29 L22 -14 L14 -22 L6 -14 L-2 -22 L-10 -14 L-18 -22 L-26 -14 Z" ${S(c, 1.5)}/>`
      + `<path d="M-30 -24 q5 -6 10 0 q5 -6 10 0 q5 -6 10 0 q5 -6 10 0 q5 -6 10 0 q5 -6 10 0 v5 h-60 z" ${S('#43a047', 1.5)}/>`
      + `<path d="M-29 -26 Q0 -56 29 -26 Z" ${S(BUN)}/>`
      + rep(n, (i) => `<ellipse cx="${spread(i, n, -16, 16).toFixed(1)}" cy="${-42 + (i % 2) * 5}" rx="2.5" ry="1.5" fill="#fff8e1"/>`) },

  { id: 'drink', w: 46, h: 78, zones: ['table'], c1: ['orange', 'red', 'lime', 'purple', 'cyan', 'yellow'], asym: true, parts: ['straw', 'lemon'],
    draw: ({ c, hide }) =>
      (hide !== 'straw' ? `<path d="M4 -50 L16 -76" ${L('#e53935', 4)}/>` : '')
      + `<path d="M-16 -56 H16 L12 0 H-12 Z" ${S(shade(c, .15))}/><path d="M-16 -56 H16 L15 -48 H-15 Z" fill="#fff" opacity=".5"/>${hl(-10, -46, 5, 36, 2.5)}`
      + (hide !== 'lemon' ? `<circle cx="-16" cy="-56" r="8" ${S('#fdd835', 1.5)}/><path d="M-16 -56 v-8 M-16 -56 l7 4 M-16 -56 l-7 4" ${L('#fff', 1.5)}/>` : '') },

  { id: 'noodles', w: 72, h: 68, zones: ['table'], c1: ['blue', 'red', 'green', 'cream', 'purple', 'teal'], asym: true, parts: ['chopsticks'],
    draw: ({ c, hide }) =>
      (hide !== 'chopsticks' ? `<path d="M-10 -34 L26 -66 M-2 -34 L32 -64" ${L(WOOD, 3.5)}/>` : '')
      + `<ellipse cx="0" cy="-28" rx="33" ry="9" ${S('#ffcc80', 2)}/><ellipse cx="-6" cy="-30" rx="12" ry="4" fill="#fff"/><circle cx="12" cy="-31" r="4" fill="#43a047"/><circle cx="-16" cy="-27" r="3" fill="#e53935"/>`
      + `<path d="M-33 -28 H33 Q31 0 0 0 Q-31 0 -33 -28 Z" ${S(c)}/><path d="M-30 -16 H30" ${L('#fff', 2)}/>` },

  { id: 'icecream', w: 40, h: 92, zones: ['table'], c1: ['pink', 'brown', 'lime', 'yellow', 'purple'], c2: ['cream', 'cyan', 'red', 'green'], n: [1, 3],
    draw: ({ c, d, n }) => {
      const cols = [c, d, '#fff'];
      return `<path d="M-16 -42 H16 L0 0 Z" ${S(BUN)}/><path d="M-10 -34 L6 -12 M10 -34 L-6 -12 M-14 -26 H14" ${L(shade(BUN, -.35), 1.5)}/>`
        + rep(n, (i) => `<circle cx="0" cy="${-52 - i * 16}" r="16" ${S(cols[i])}/>`);
    } },

  { id: 'coffee', w: 62, h: 46, zones: ['table'], c1: ['red', 'blue', 'green', 'yellow', 'pink', 'black'], asym: true, parts: ['steam'],
    draw: ({ c, hide }) =>
      `<ellipse cx="0" cy="-4" rx="30" ry="5" ${S('#fff', 2)}/>`
      + `<path d="M18 -26 Q30 -26 28 -14 Q26 -10 16 -10" ${L(shade(c, -.45), 7)}/><path d="M18 -26 Q30 -26 28 -14 Q26 -10 16 -10" ${L(c, 3.5)}/>`
      + `<path d="M-18 -30 H18 L14 -6 H-14 Z" ${S(c)}/><ellipse cx="0" cy="-30" rx="18" ry="4" fill="#6d4c41"/>`
      + (hide !== 'steam' ? `<path d="M-6 -36 q4 -6 0 -12 M6 -36 q4 -6 0 -12" ${L('#b0bec5', 2)}/>` : '') },

  { id: 'ketchup', w: 28, h: 62, zones: ['table'], c1: ['red', 'yellow', 'brown', 'green'], parts: ['label'],
    draw: ({ c, hide }) =>
      `<rect x="-11" y="-42" width="22" height="42" rx="6" ${S(c)}/><path d="M-11 -42 L-5 -52 H5 L11 -42 Z" ${S(c)}/><rect x="-6" y="-61" width="12" height="10" rx="3" ${S('#fafafa', 2)}/>`
      + (hide !== 'label' ? `<rect x="-8" y="-32" width="16" height="16" rx="2" fill="#fff"/><rect x="-5" y="-27" width="10" height="3" fill="${c}"/><rect x="-5" y="-22" width="7" height="2" fill="#999"/>` : '') },

  { id: 'sushi', w: 74, h: 32, zones: ['table'], c1: ['black', 'blue', 'red', 'cream', 'green'], n: [2, 4],
    draw: ({ c, n }) =>
      `<ellipse cx="0" cy="-6" rx="36" ry="7" ${S(c)}/>`
      + rep(n, (i) => { const x = spread(i, n, -22, 22); return `<rect x="${(x - 9).toFixed(1)}" y="-24" width="18" height="16" rx="3" ${S('#fff', 1.5)}/><rect x="${(x - 9).toFixed(1)}" y="-29" width="18" height="8" rx="3" ${S('#ff7043', 1.5)}/><rect x="${(x - 2).toFixed(1)}" y="-29" width="4" height="21" fill="#2e7d32"/>`; }) },

  { id: 'vase', w: 44, h: 78, zones: ['table'], c1: ['blue', 'teal', 'cream', 'purple', 'pink'], c2: ['pink', 'red', 'yellow', 'purple', 'white'], n: [1, 3],
    draw: ({ c, d, n }) => {
      const pos = [[0, -66], [-15, -60], [15, -60]];
      return `<path d="M0 -40 V-62 M-8 -40 L-15 -56 M8 -40 L15 -56" ${L('#43a047', 3)}/>`
        + rep(n, (i) => `<circle cx="${pos[i][0]}" cy="${pos[i][1]}" r="8" ${S(d, 1.5)}/><circle cx="${pos[i][0]}" cy="${pos[i][1]}" r="3" fill="#ffd54f"/>`)
        + `<path d="M-14 -40 H14 L18 0 H-18 Z" ${S(c)}/>${hl(-10, -34, 5, 26, 2.5)}`;
    } },

  { id: 'candle', w: 26, h: 62, zones: ['table'], c1: ['white', 'red', 'cream', 'pink', 'blue'], parts: ['flame'],
    draw: ({ c, hide }) =>
      `<path d="M-12 0 H12 L8 -10 H-8 Z" ${S('#c9a227')}/><rect x="-6" y="-46" width="12" height="36" rx="2" ${S(c)}/>`
      + (hide !== 'flame' ? `<path d="M0 -62 Q7 -52 0 -46 Q-7 -52 0 -62 Z" ${S('#ffb300', 1.5)}/><path d="M0 -56 Q3 -52 0 -48 Q-3 -52 0 -56 Z" fill="#fff59d"/>` : '') },

  { id: 'menu', w: 64, h: 72, zones: ['wall'], c1: ['brown', 'red', 'green', 'blue', 'black'], n: [2, 4],
    draw: ({ c, n }) =>
      `<rect x="-31" y="-72" width="62" height="66" rx="4" ${S(c)}/><rect x="-26" y="-66" width="52" height="54" fill="#263238"/>`
      + `<rect x="-14" y="-60" width="28" height="5" rx="2" fill="#ffd54f"/>`
      + rep(n, (i) => `<rect x="-20" y="${-48 + i * 10}" width="${36 - (i % 2) * 12}" height="4" rx="2" fill="#fff" opacity=".85"/>`) },

  { id: 'picture', w: 60, h: 52, zones: ['wall'], c1: ['brown', 'yellow', 'red', 'black', 'white'], asym: true, parts: ['sun'],
    draw: ({ c, hide }) =>
      `<rect x="-30" y="-52" width="60" height="46" rx="3" ${S(c)}/><rect x="-24" y="-46" width="48" height="34" fill="#81d4fa"/>`
      + `<path d="M-24 -12 L-10 -32 L0 -20 L10 -30 L24 -12 Z" fill="#66bb6a"/>`
      + (hide !== 'sun' ? `<circle cx="14" cy="-38" r="4.5" fill="#ffd54f"/>` : '') },

  { id: 'lamp', w: 64, h: 140, zones: ['ceiling'], c1: ['red', 'green', 'yellow', 'teal', 'pink', 'cream'], hy: 0.14, rot: false,
    draw: ({ c }) =>
      `<path d="M0 -140 V-40" ${L('#546e7a', 2.5)}/><path d="M-31 -10 H31 L17 -40 H-17 Z" ${S(c)}/><ellipse cx="0" cy="-10" rx="31" ry="5" ${S(shade(c, -.15), 1.5)}/><ellipse cx="0" cy="-8" rx="20" ry="4" fill="#fff59d" opacity=".9"/>` },

  { id: 'plant', w: 60, h: 84, zones: ['floor'], c1: ['orange', 'red', 'blue', 'cream', 'gray'], n: [3, 5],
    draw: ({ c, n }) =>
      rep(n, (i) => `<ellipse cx="0" cy="-56" rx="9" ry="24" transform="rotate(${((i - (n - 1) / 2) * 28).toFixed(0)} 0 -30)" ${S('#43a047', 2)}/>`)
      + `<path d="M-20 0 H20 L26 -32 H-26 Z" ${S(c)}/><rect x="-28" y="-36" width="56" height="8" rx="3" ${S(shade(c, -.15), 2)}/>` },

  { id: 'chair', w: 54, h: 90, zones: ['floor'], c1: ['brown', 'red', 'blue', 'green', 'black', 'cream'], n: [1, 3],
    draw: ({ c, n }) =>
      `<path d="M-20 -38 V0 M20 -38 V0" ${L(shade(c, -.3), 5)}/><path d="M-18 -46 V-90 M18 -46 V-90" ${L(shade(c, -.3), 5)}/>`
      + `<rect x="-22" y="-90" width="44" height="9" rx="4" ${S(c)}/>`
      + rep(n, (i) => `<rect x="-18" y="${-76 + i * 9}" width="36" height="5" rx="2" ${S(c, 1.5)}/>`)
      + `<rect x="-26" y="-46" width="52" height="10" rx="4" ${S(c)}/>` },

  { id: 'bell', w: 42, h: 40, zones: ['table'], c1: ['red', 'blue', 'black', 'green', 'purple'],
    draw: ({ c }) =>
      `<path d="M-16 -8 Q-16 -34 0 -34 Q16 -34 16 -8 Z" ${S('#fbc02d')}/><rect x="-4" y="-40" width="8" height="7" rx="2" ${S('#f57f17', 1.5)}/>${hl(-10, -28, 5, 14, 2.5)}`
      + `<rect x="-21" y="-8" width="42" height="8" rx="3" ${S(c)}/>` },

  { id: 'teapot', w: 88, h: 52, zones: ['table'], c1: ['blue', 'red', 'cream', 'green', 'pink', 'purple'], asym: true, parts: ['handle'],
    draw: ({ c, hide }) =>
      (hide !== 'handle' ? `<path d="M-24 -32 Q-48 -22 -24 -10" ${L(shade(c, -.45), 8)}/><path d="M-24 -32 Q-48 -22 -24 -10" ${L(c, 4)}/>` : '')
      + `<path d="M22 -28 Q40 -34 42 -50" ${L(shade(c, -.45), 9)}/><path d="M22 -28 Q40 -34 42 -50" ${L(c, 5)}/>`
      + `<ellipse cx="0" cy="-20" rx="26" ry="20" ${S(c)}/><ellipse cx="0" cy="-40" rx="12" ry="4" ${S(shade(c, -.15), 1.5)}/><circle cx="0" cy="-45" r="4" ${S(shade(c, -.3), 1.5)}/>${hl(-18, -30, 6, 16, 3)}` },

  { id: 'donut', w: 46, h: 46, zones: ['table'], c1: ['pink', 'brown', 'purple', 'cyan', 'yellow'], n: [3, 8],
    draw: ({ c, n }) =>
      `<circle cx="0" cy="-23" r="23" ${S(BUN)}/><circle cx="0" cy="-23" r="18" fill="${c}"/><circle cx="0" cy="-23" r="6" ${S(BUN, 1.5)}/>`
      + rep(n, (i) => { const a = i * 2.4 + .5, r = 11 + (i % 2) * 3; return `<rect x="${(r * Math.cos(a) - 2.5).toFixed(1)}" y="${(-23 + r * Math.sin(a) - 1).toFixed(1)}" width="5" height="2" rx="1" fill="#fff" transform="rotate(${(i * 40) % 180} ${(r * Math.cos(a)).toFixed(1)} ${(-23 + r * Math.sin(a)).toFixed(1)})"/>`; }) },

  { id: 'fries', w: 50, h: 60, zones: ['table'], c1: ['red', 'yellow', 'blue', 'green'], n: [3, 6],
    draw: ({ c, n }) =>
      rep(n, (i) => `<rect x="${(spread(i, n, -16, 10)).toFixed(1)}" y="${-58 + (i % 2) * 7}" width="6" height="34" rx="2" ${S('#ffd54f', 1.5)}/>`)
      + `<path d="M-20 0 H20 L25 -34 H-25 Z" ${S(c)}/><path d="M-25 -34 Q0 -26 25 -34" ${L(shade(c, -.45), 2)}/>` },
];

const WALLS = ['#f8e1e7', '#e0f2f1', '#fff3e0'];
const STRIPES = ['#f3c6d2', '#c8e6e3', '#ffe0b2'];
const CLOTHS = ['#e53935', '#1e88e5', '#43a047'];

export function restaurantBg(v) {
  const wall = WALLS[v], stripe = STRIPES[v], cloth = CLOTHS[v];
  let s = `<rect width="800" height="500" fill="${wall}"/>`;
  for (let x = 0; x < 800; x += 60) s += `<rect x="${x}" y="0" width="24" height="280" fill="${stripe}"/>`;
  // ốp chân tường
  s += `<rect x="0" y="280" width="800" height="100" fill="#d7ccc8"/><rect x="0" y="280" width="800" height="8" fill="#a1887f"/>`;
  for (let x = 20; x < 800; x += 80) s += `<rect x="${x}" y="300" width="50" height="60" rx="3" fill="none" stroke="#bcaaa4" stroke-width="3"/>`;
  // sàn gỗ
  s += `<rect x="0" y="380" width="800" height="120" fill="#c8955a"/>`;
  for (let y = 380; y < 500; y += 24) s += `<path d="M0 ${y} H800" stroke="#a9773f" stroke-width="2"/>`;
  for (let i = 0; i < 20; i++) s += `<path d="M${(i * 137) % 800} ${380 + (i % 5) * 24} v24" stroke="#a9773f" stroke-width="2"/>`;
  // hai bàn khăn trải
  for (const tx of [120, 420]) {
    s += `<path d="M${tx + 24} 470 V310 M${tx + 236} 470 V310" stroke="#6d4c41" stroke-width="8" stroke-linecap="round"/>`
       + `<path d="M${tx} 300 H${tx + 260} L${tx + 250} 348 H${tx + 10} Z" fill="${cloth}" stroke="${shade(cloth, -.35)}" stroke-width="2"/>`
       + `<rect x="${tx}" y="296" width="260" height="10" rx="3" fill="#fff" stroke="#e0e0e0" stroke-width="2"/>`;
    for (let x = tx + 20; x < tx + 250; x += 40) s += `<path d="M${x} 314 l8 22" stroke="#fff" stroke-width="3" opacity=".6"/>`;
  }
  return s;
}

export const RESTAURANT = {
  id: 'restaurant', name: 'Quán ăn', emoji: '🍕', variants: 3,
  zones: {
    ceiling: { rects: [{ x1: 60, x2: 740, y1: 0, y2: 0 }], top: 0, scale: 0.9 },
    wall:    { rects: [{ x1: 60, x2: 740, y1: 150, y2: 260 }], scale: 1 },
    table:   { rects: [{ x1: 130, x2: 370, y1: 294, y2: 300 }, { x1: 430, x2: 670, y1: 294, y2: 300 }], scale: 0.8 },
    floor:   { rects: [{ x1: 40, x2: 760, y1: 466, y2: 494 }], scale: 1 },
  },
  objects: RESTAURANT_OBJECTS,
  bg: restaurantBg,
};
