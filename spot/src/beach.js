// ── Chủ đề BÃI BIỂN: nền và đồ vật ──
import { S, L, rep, hl, spread, shade, star } from './draw.js';

const SAND = '#e6c98a', WOOD = '#5d4037', GREEN = '#43a047';

export const BEACH_OBJECTS = [
  { id: 'cloud', w: 92, h: 42, zones: ['sky'], c1: ['white', 'cream', 'gray'], asym: true, rot: false,
    draw: ({ c }) =>
      `<path d="M-38 0 H38 Q50 0 48 -12 Q46 -24 32 -22 Q28 -40 8 -36 Q-4 -46 -18 -34 Q-38 -36 -36 -20 Q-50 -16 -38 0 Z" ${S(c, 2)}/>` },

  { id: 'seagull', w: 64, h: 28, zones: ['sky'], c1: ['white', 'gray', 'black'], asym: true,
    draw: ({ c }) =>
      `<path d="M-32 -14 Q-16 -28 0 -14 Q16 -28 32 -14" ${L('#455a64', 4.5)}/><ellipse cx="0" cy="-10" rx="11" ry="6.5" ${S(c, 2)}/>`
      + `<path d="M11 -11 L20 -8 L11 -6 Z" fill="#fb8c00"/><circle cx="6" cy="-12" r="1.5" fill="#222"/>` },

  { id: 'kite', w: 52, h: 104, zones: ['sky'], c1: ['red', 'blue', 'green', 'purple', 'orange', 'pink'], c2: ['red', 'yellow', 'white', 'blue'], n: [1, 4], asym: true,
    draw: ({ c, d, n }) =>
      `<path d="M0 -104 L23 -72 L0 -30 L-23 -72 Z" ${S(c)}/><path d="M0 -104 V-30 M-23 -72 H23" ${L(shade(c, -.4), 2)}/>`
      + `<path d="M0 -30 Q12 -14 0 0" ${L('#555', 2)}/>`
      + rep(n, (i) => { const t = (i + 1) / (n + 1); const bx = 12 * Math.sin(Math.PI * t) * .9, by = -30 + 30 * t; return `<path d="M${(bx - 5).toFixed(1)} ${(by - 4).toFixed(1)} l10 4 l-10 4 z" fill="${d}"/>`; }) },

  { id: 'balloon', w: 42, h: 84, zones: ['sky'], c1: ['red', 'blue', 'yellow', 'green', 'pink', 'purple', 'orange'],
    draw: ({ c }) =>
      `<ellipse cx="0" cy="-60" rx="19" ry="23" ${S(c)}/><ellipse cx="-7" cy="-68" rx="4" ry="7" fill="#fff" opacity=".4"/>`
      + `<path d="M-4 -38 L0 -33 L4 -38 Z" ${S(c, 1.5)}/><path d="M0 -33 Q7 -16 0 0" ${L('#555', 2)}/>` },

  { id: 'plane', w: 94, h: 34, zones: ['sky'], c1: ['white', 'red', 'blue', 'yellow'], c2: ['red', 'blue', 'yellow', 'orange'], n: [2, 5], asym: true,
    draw: ({ c, d, n }) =>
      `<path d="M-40 -16 L-30 -34 H-18 L-26 -16 Z" ${S(d)}/>`
      + `<path d="M-42 -16 H30 Q47 -16 45 -9 Q41 -2 30 -2 H-42 Q-48 -9 -42 -16 Z" ${S(c)}/>`
      + `<path d="M-6 -8 L-18 6 H2 L12 -8 Z" ${S(d)}/>`
      + rep(n, (i) => `<circle cx="${-26 + i * 10}" cy="-10" r="2.6" fill="#81d4fa"/>`) },

  { id: 'sailboat', w: 74, h: 84, zones: ['sea'], c1: ['red', 'blue', 'brown', 'green', 'orange'], c2: ['white', 'red', 'yellow', 'cyan', 'pink'], asym: true, parts: ['flag'],
    draw: ({ c, d, hide }) =>
      `<path d="M0 -14 V-82" ${L(WOOD, 3.5)}/><path d="M3 -78 L32 -18 H3 Z" ${S(d)}/><path d="M-3 -70 L-26 -18 H-3 Z" ${S('#fafafa', 2)}/>`
      + (hide !== 'flag' ? `<path d="M0 -84 L13 -80 L0 -75 Z" ${S('#e53935', 1.5)}/>` : '')
      + `<path d="M-35 -14 H35 L27 0 H-27 Z" ${S(c)}/><path d="M-30 -10 H30" ${L(shade(c, .4), 2)}/>` },

  { id: 'fish', w: 54, h: 32, zones: ['sea'], c1: ['orange', 'blue', 'yellow', 'pink', 'green', 'purple'], n: [0, 3], asym: true,
    draw: ({ c, n }) =>
      `<path d="M12 -16 L27 -28 L27 -4 Z" ${S(c)}/><ellipse cx="-4" cy="-16" rx="19" ry="11" ${S(c)}/>`
      + rep(n, (i) => `<path d="M${-8 + i * 7} -26 q3 10 0 20" ${L(shade(c, -.4), 2.5)}/>`)
      + `<circle cx="-13" cy="-18" r="3" fill="#fff"/><circle cx="-12" cy="-18" r="1.6" fill="#222"/>` },

  { id: 'buoy', w: 32, h: 42, zones: ['sea'], c1: ['red', 'orange', 'yellow'], c2: ['white', 'black'],
    draw: ({ c, d }) =>
      `<path d="M-10 0 H10 L14 -30 H-14 Z" ${S(c)}/><rect x="-12" y="-20" width="24" height="6" fill="${d}"/><rect x="-15" y="-42" width="30" height="13" rx="3" ${S(d)}/><path d="M0 -42 V-48" ${L('#555', 3)}/>` },

  { id: 'duck', w: 54, h: 44, zones: ['sea'], c1: ['yellow', 'white', 'pink', 'lime'], asym: true,
    draw: ({ c }) =>
      `<ellipse cx="0" cy="-12" rx="25" ry="12" ${S(c)}/><circle cx="14" cy="-30" r="11" ${S(c)}/><path d="M23 -31 L34 -28 L23 -24 Z" ${S('#fb8c00', 1.5)}/><circle cx="16" cy="-33" r="2" fill="#222"/><path d="M-22 -16 Q-30 -26 -20 -26" ${L(shade(c, -.45), 3)}/>` },

  { id: 'parasol', w: 112, h: 124, zones: ['sand'], c1: ['red', 'blue', 'green', 'pink', 'purple', 'orange'], c2: ['white', 'yellow', 'cream'], hy: 0.7,
    draw: ({ c, d }) => {
      let s = `<path d="M0 0 V-100" ${L(WOOD, 4.5)}/>`;
      for (let i = 0; i < 6; i++) {
        const a1 = Math.PI + i * Math.PI / 6, a2 = a1 + Math.PI / 6;
        s += `<path d="M0 -84 L${(56 * Math.cos(a1)).toFixed(1)} ${(-84 + 40 * Math.sin(a1)).toFixed(1)} A56 40 0 0 1 ${(56 * Math.cos(a2)).toFixed(1)} ${(-84 + 40 * Math.sin(a2)).toFixed(1)} Z" ${S(i % 2 ? d : c, 2)}/>`;
      }
      return s + `<circle cx="0" cy="-124" r="4" ${S(WOOD, 1.5)}/>`;
    } },

  { id: 'ball', w: 52, h: 52, zones: ['sand'], c1: ['red', 'blue', 'green', 'purple', 'orange'], c2: ['yellow', 'cyan', 'pink', 'white'],
    draw: ({ c, d }) => {
      const cols = [c, d, '#fafafa'];
      let s = '';
      for (let i = 0; i < 6; i++) {
        const a1 = -Math.PI / 2 + i * Math.PI / 3, a2 = a1 + Math.PI / 3;
        s += `<path d="M0 -26 L${(25 * Math.cos(a1)).toFixed(1)} ${(-26 + 25 * Math.sin(a1)).toFixed(1)} A25 25 0 0 1 ${(25 * Math.cos(a2)).toFixed(1)} ${(-26 + 25 * Math.sin(a2)).toFixed(1)} Z" fill="${cols[i % 3]}"/>`;
      }
      return s + `<circle cx="0" cy="-26" r="25" ${L(shade(c, -.45), 2.5)}/><ellipse cx="-9" cy="-36" rx="5" ry="3" fill="#fff" opacity=".5"/>`;
    } },

  { id: 'bucket', w: 56, h: 68, zones: ['sand'], c1: ['red', 'blue', 'yellow', 'green', 'pink', 'purple'], parts: ['handle'],
    draw: ({ c, hide }) =>
      (hide !== 'handle' ? `<path d="M-22 -46 Q0 -70 22 -46" ${L(shade(c, -.45), 4)}/>` : '')
      + `<path d="M-20 0 H20 L25 -40 H-25 Z" ${S(c)}/><rect x="-27" y="-48" width="54" height="10" rx="3" ${S(shade(c, -.15))}/>${hl(-18, -36, 6, 28, 3)}` },

  { id: 'spade', w: 28, h: 66, zones: ['sand'], c1: ['red', 'blue', 'yellow', 'green', 'orange', 'purple'],
    draw: ({ c }) =>
      `<path d="M0 -60 V-20" ${L(WOOD, 5)}/><rect x="-9" y="-66" width="18" height="7" rx="3.5" ${S(WOOD, 1.5)}/><path d="M-13 -24 H13 L11 -4 Q0 3 -11 -4 Z" ${S(c)}/>` },

  { id: 'castle', w: 94, h: 84, zones: ['sand'], c1: ['red', 'blue', 'yellow', 'green', 'pink'], n: [0, 3], parts: ['door'],
    draw: ({ c, n, hide }) => {
      const tw = [[-30, 42], [0, 56], [30, 42]];
      let s = `<rect x="-46" y="-30" width="92" height="30" rx="3" ${S(SAND)}/>`;
      for (const [tx, th] of tw) s += `<rect x="${tx - 12}" y="${-30 - th}" width="24" height="${th}" ${S(SAND)}/><path d="M${tx - 12} ${-30 - th} v-7 h6 v7 h6 v-7 h6 v7 h6 v-7 h-3" ${L(shade(SAND, -.45), 2)}/>`;
      s += rep(n, (i) => { const [tx, th] = tw[i]; return `<path d="M${tx} ${-38 - th} V${-54 - th} l13 5 l-13 5" ${S(c, 1.5)}/>`; });
      if (hide !== 'door') s += `<path d="M-8 0 V-14 A8 8 0 0 1 8 -14 V0 Z" ${S('#8d6e63', 1.5)}/>`;
      return s + `<rect x="-24" y="-56" width="6" height="8" fill="#8d6e63"/><rect x="18" y="-56" width="6" height="8" fill="#8d6e63"/>`;
    } },

  { id: 'starfish', w: 48, h: 48, zones: ['sand'], c1: ['orange', 'pink', 'red', 'yellow', 'purple'],
    draw: ({ c }) =>
      `<path d="${star(0, -24, 24, 11)}" ${S(c)}/><circle cx="0" cy="-24" r="3" fill="${shade(c, -.3)}"/><circle cx="0" cy="-36" r="2" fill="${shade(c, -.3)}"/><circle cx="-10" cy="-19" r="2" fill="${shade(c, -.3)}"/><circle cx="10" cy="-19" r="2" fill="${shade(c, -.3)}"/>` },

  { id: 'shell', w: 42, h: 36, zones: ['sand'], c1: ['cream', 'pink', 'orange', 'white', 'purple'],
    draw: ({ c }) =>
      `<path d="M-20 -6 Q-20 -36 0 -36 Q20 -36 20 -6 Q0 4 -20 -6 Z" ${S(c)}/><path d="M0 -36 L-12 -6 M0 -36 V-4 M0 -36 L12 -6 M0 -36 L-19 -14 M0 -36 L19 -14" ${L(shade(c, -.35), 2)}/>` },

  { id: 'crab', w: 74, h: 44, zones: ['sand'], c1: ['red', 'orange', 'pink', 'purple'], parts: ['claw'],
    draw: ({ c, hide }) =>
      `<path d="M-18 -8 L-30 0 M-10 -4 L-16 4 M18 -8 L30 0 M10 -4 L16 4" ${L(shade(c, -.3), 3)}/>`
      + `<path d="M-14 -22 Q-26 -30 -30 -24 M14 -22 Q26 -30 30 -24" ${L(shade(c, -.3), 3)}/>`
      + `<circle cx="-31" cy="-26" r="8" ${S(c)}/>` + (hide !== 'claw' ? `<circle cx="31" cy="-26" r="8" ${S(c)}/>` : '')
      + `<ellipse cx="0" cy="-14" rx="22" ry="14" ${S(c)}/>`
      + `<path d="M-8 -26 V-36 M8 -26 V-36" ${L(shade(c, -.4), 3)}/><circle cx="-8" cy="-38" r="4" fill="#fff" stroke="#333" stroke-width="1.5"/><circle cx="8" cy="-38" r="4" fill="#fff" stroke="#333" stroke-width="1.5"/><circle cx="-7" cy="-38" r="1.6" fill="#222"/><circle cx="9" cy="-38" r="1.6" fill="#222"/>`
      + `<path d="M-6 -10 q6 4 12 0" ${L('#333', 1.5)}/>` },

  { id: 'palm', w: 104, h: 170, zones: ['sand'], c1: ['green', 'lime', 'teal'], n: [0, 3], asym: true, hy: 0.8,
    draw: ({ c, n }) =>
      `<path d="M-6 0 Q-4 -80 10 -140" ${L('#8d6e63', 13)}/><path d="M-6 0 Q-4 -80 10 -140" ${L('#a1887f', 5)} stroke-dasharray="6 14"/>`
      + rep(5, (i) => `<ellipse cx="10" cy="-152" rx="42" ry="12" transform="rotate(${-70 + i * 35} 10 -140)" ${S(c, 2)}/>`)
      + rep(n, (i) => `<circle cx="${10 + (i - 1) * 13}" cy="-134" r="7" ${S('#6d4c41', 1.5)}/>`) },

  { id: 'flipflops', w: 58, h: 32, zones: ['sand'], c1: ['red', 'blue', 'green', 'pink', 'purple', 'orange'], c2: ['white', 'black', 'yellow'],
    draw: ({ c, d }) => rep(2, (k) => { const x = k ? 15 : -15; return `<ellipse cx="${x}" cy="-15" rx="12" ry="15" ${S(c)}/><path d="M${x} -20 L${x - 8} -8 M${x} -20 L${x + 8} -8" ${L(d, 3)}/>`; }) },

  { id: 'sunglasses', w: 62, h: 26, zones: ['sand'], c1: ['black', 'purple', 'blue', 'pink', 'red'],
    draw: ({ c }) =>
      `<path d="M-30 -20 H30" ${L('#37474f', 3.5)}/><path d="M-30 -20 L-24 -2 Q-14 4 -6 -4 L-2 -18 Z" ${S(c)}/><path d="M30 -20 L24 -2 Q14 4 6 -4 L2 -18 Z" ${S(c)}/>${hl(-24, -16, 6, 8, 3)}${hl(8, -16, 6, 8, 3)}` },

  { id: 'towel', w: 104, h: 32, zones: ['sand'], c1: ['red', 'blue', 'green', 'purple', 'orange', 'pink'], n: [2, 5],
    draw: ({ c, n }) =>
      `<path d="M-44 -30 H44 L52 0 H-52 Z" ${S(c)}/>`
      + rep(n, (i) => { const t = (i + 1) / (n + 1), y = -30 + 30 * t, k = 44 + 8 * t; return `<path d="M${(-k).toFixed(1)} ${y.toFixed(1)} H${k.toFixed(1)}" ${L('#fff', 4)} opacity=".8"/>`; }) },

  { id: 'coconut', w: 50, h: 72, zones: ['sand'], c1: ['red', 'blue', 'yellow', 'green', 'pink'], c2: ['pink', 'yellow', 'red', 'purple'], asym: true, parts: ['umbrella'],
    draw: ({ c, d, hide }) =>
      `<circle cx="0" cy="-22" r="22" ${S('#8d6e63')}/><ellipse cx="0" cy="-42" rx="9" ry="3.5" fill="#fff8e1" stroke="#a1887f" stroke-width="1.5"/>`
      + `<path d="M4 -44 L15 -64" ${L(c, 4)}/>`
      + (hide !== 'umbrella' ? `<path d="M-14 -46 L-22 -70" ${L('#555', 1.5)}/><path d="M-38 -66 Q-22 -84 -6 -64 Z" ${S(d, 1.5)}/>` : '') },

  { id: 'surfboard', w: 32, h: 112, zones: ['sand'], c1: ['red', 'blue', 'yellow', 'green', 'pink', 'cyan'], c2: ['white', 'yellow', 'black'], n: [0, 3],
    draw: ({ c, d, n }) =>
      `<ellipse cx="0" cy="-56" rx="15" ry="56" ${S(c)}/><path d="M0 -104 V-8" ${L(d, 3)}/>`
      + rep(n, (i) => `<rect x="-14" y="${-82 + i * 20}" width="28" height="7" fill="${d}"/>`) },

  { id: 'turtle', w: 64, h: 38, zones: ['sand'], c1: ['green', 'teal', 'brown', 'purple'], n: [3, 6], asym: true,
    draw: ({ c, n }) =>
      `<ellipse cx="-18" cy="-4" rx="8" ry="4" ${S('#8bc34a', 1.5)}/><ellipse cx="12" cy="-4" rx="8" ry="4" ${S('#8bc34a', 1.5)}/><circle cx="26" cy="-16" r="8" ${S('#8bc34a', 1.5)}/><circle cx="29" cy="-18" r="1.6" fill="#222"/>`
      + `<ellipse cx="0" cy="-18" rx="23" ry="15" ${S(c)}/>`
      + rep(n, (i) => `<circle cx="${(-12 + (i * 9) % 26).toFixed(0)}" cy="${-24 + Math.floor(i / 3) * 10}" r="3" fill="${shade(c, -.3)}"/>`) },
];

const SKIES = [['#7fd3ff', '#cfefff'], ['#ffb26b', '#ffe3c2'], ['#5fb8ff', '#e0f4ff']];
const SEAS = ['#1e88e5', '#3f51b5', '#26a69a'];

export function beachBg(v, uid) {
  const [sk1, sk2] = SKIES[v], sea = SEAS[v];
  let s = `<defs><linearGradient id="sky${uid}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${sk1}"/><stop offset="1" stop-color="${sk2}"/></linearGradient></defs>`
    + `<rect width="800" height="500" fill="url(#sky${uid})"/>`
    + `<circle cx="720" cy="70" r="34" fill="#fff176" stroke="#ffd54f" stroke-width="4"/>`
    + `<rect x="0" y="200" width="800" height="120" fill="${sea}"/>`;
  for (let y = 214; y < 310; y += 22) {
    let d = `M0 ${y}`;
    for (let x = 0; x <= 800; x += 40) d += ` q10 -6 20 0 t20 0`;
    s += `<path d="${d}" fill="none" stroke="#fff" stroke-width="2" opacity=".35"/>`;
  }
  s += `<path d="M0 308 Q200 296 400 310 T800 304 V500 H0 Z" fill="${SAND}"/><path d="M0 312 Q200 300 400 314 T800 308" fill="none" stroke="#fff" stroke-width="5" opacity=".7"/>`;
  for (let i = 0; i < 40; i++) s += `<circle cx="${(i * 197) % 800}" cy="${340 + (i * 53) % 150}" r="1.6" fill="${shade(SAND, -.2)}"/>`;
  return s;
}

export const BEACH = {
  id: 'beach', name: 'Bãi biển', emoji: '🏖️', variants: 3,
  zones: {
    sky:  { rects: [{ x1: 50, x2: 640, y1: 70, y2: 170 }], scale: 0.95 },
    sea:  { rects: [{ x1: 40, x2: 760, y1: 238, y2: 298 }], scale: 0.9 },
    sand: { rects: [{ x1: 40, x2: 760, y1: 348, y2: 492 }], scale: 1 },
  },
  objects: BEACH_OBJECTS,
  bg: beachBg,
};
