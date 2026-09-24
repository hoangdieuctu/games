// ── Chủ đề QUẦN ÁO: nền và đồ vật ──
import { S, L, rep, hl, spread, shade, hanger } from './draw.js';

export const CLOTHES_OBJECTS = [
  { id: 'tshirt', w: 84, h: 110, zones: ['rail'], c1: ['red', 'blue', 'green', 'yellow', 'pink', 'purple', 'cyan', 'white'], n: [0, 3], asym: true, parts: ['pocket'],
    draw: ({ c, n, hide }) =>
      hanger(110)
      + `<path d="M-24 -84 L-40 -72 L-32 -56 L-24 -60 V0 H24 V-60 L32 -56 L40 -72 L24 -84 Q0 -72 -24 -84 Z" ${S(c)}/>`
      + rep(n, (i) => `<rect x="-24" y="${-44 + i * 13}" width="48" height="5" fill="#fff" opacity=".65"/>`)
      + (hide !== 'pocket' ? `<rect x="6" y="-58" width="13" height="12" rx="2" ${S(shade(c, -.18), 1.5)}/>` : '') },

  { id: 'dress', w: 84, h: 130, zones: ['rail'], c1: ['pink', 'red', 'purple', 'blue', 'yellow', 'teal', 'orange'], c2: ['white', 'black', 'yellow', 'red'], n: [3, 7], parts: ['bow'],
    draw: ({ c, d, n, hide }) =>
      hanger(130)
      + `<path d="M-16 -104 L-20 -70 H20 L16 -104 Q0 -96 -16 -104 Z" ${S(c)}/><path d="M-20 -70 H20 L38 0 H-38 Z" ${S(c)}/>`
      + rep(n, (i) => `<circle cx="${(-22 + (i * 37) % 44).toFixed(0)}" cy="${(-60 + Math.floor(i * 1.3) * 11)}" r="3" fill="#fff" opacity=".8"/>`)
      + `<rect x="-21" y="-73" width="42" height="7" fill="${d}"/>`
      + (hide !== 'bow' ? `<path d="M0 -70 l-8 -5 v10 z M0 -70 l8 -5 v10 z" ${S(d, 1.5)}/>` : '') },

  { id: 'jacket', w: 92, h: 120, zones: ['rail'], c1: ['navy', 'brown', 'black', 'red', 'green', 'gray', 'orange'], c2: ['yellow', 'white', 'black'], n: [2, 4], asym: true,
    draw: ({ c, d, n }) =>
      hanger(120)
      + `<path d="M-28 -94 L-44 -80 L-36 -62 L-28 -66 V0 H28 V-66 L36 -62 L44 -80 L28 -94 L0 -80 Z" ${S(c)}/>`
      + `<path d="M-28 -94 L0 -80 L28 -94 L14 -90 L0 -72 L-14 -90 Z" ${S(shade(c, -.2))}/><path d="M0 -76 V0" ${L(shade(c, -.5), 2)}/>`
      + rep(n, (i) => `<circle cx="7" cy="${-60 + i * 15}" r="3.2" fill="${d}" stroke="${shade(d, -.4)}" stroke-width="1"/>`) },

  { id: 'pants', w: 60, h: 120, zones: ['rail'], c1: ['navy', 'blue', 'black', 'brown', 'gray', 'cream', 'pink'], asym: true, parts: ['patch'],
    draw: ({ c, hide }) =>
      hanger(120) + `<path d="M-20 -94 V-84 M20 -94 V-84" ${L('#78909c', 3)}/>`
      + `<path d="M-24 -74 H24 V0 H6 L0 -40 L-6 0 H-24 Z" ${S(c)}/><rect x="-24" y="-86" width="48" height="12" rx="2" ${S(shade(c, -.15))}/>`
      + (hide !== 'patch' ? `<rect x="9" y="-32" width="11" height="11" rx="2" ${S('#fbc02d', 1.5)}/>` : '') },

  { id: 'skirt', w: 72, h: 90, zones: ['rail'], c1: ['red', 'pink', 'blue', 'green', 'purple', 'yellow', 'navy'], n: [2, 5],
    draw: ({ c, n }) =>
      hanger(90) + `<path d="M-16 -64 V-56 M16 -64 V-56" ${L('#78909c', 3)}/>`
      + `<path d="M-16 -58 H16 L34 0 H-34 Z" ${S(c)}/>`
      + rep(n, (i) => { const x = spread(i, n, -10, 10); return `<path d="M${x.toFixed(1)} -58 L${(x * 2.1).toFixed(1)} 0" ${L(shade(c, -.4), 2)}/>`; })
      + `<rect x="-17" y="-62" width="34" height="6" rx="2" ${S(shade(c, -.2), 1.5)}/>` },

  { id: 'scarf', w: 40, h: 116, zones: ['rail'], c1: ['red', 'orange', 'blue', 'purple', 'green', 'pink'], c2: ['white', 'yellow', 'black', 'cream'], n: [2, 5],
    draw: ({ c, d, n }) =>
      `<path d="M-6 -116 Q0 -122 6 -116" ${L('#78909c', 2.5)}/>`
      + `<rect x="-16" y="-110" width="32" height="102" rx="4" ${S(c)}/>`
      + rep(n, (i) => `<rect x="-16" y="${-100 + i * 19}" width="32" height="7" fill="${d}"/>`)
      + `<path d="M-12 -8 V0 M-6 -8 V0 M0 -8 V0 M6 -8 V0 M12 -8 V0" ${L(shade(c, -.3), 2)}/>` },

  { id: 'hat', w: 72, h: 44, zones: ['shelf'], c1: ['brown', 'black', 'cream', 'red', 'pink', 'navy'], c2: ['red', 'yellow', 'white', 'black', 'blue'], asym: true, parts: ['bow'],
    draw: ({ c, d, hide }) =>
      `<ellipse cx="0" cy="-8" rx="35" ry="8" ${S(c)}/><path d="M-20 -8 V-36 Q0 -46 20 -36 V-8 Z" ${S(c)}/><rect x="-20" y="-19" width="40" height="7" fill="${d}"/>`
      + (hide !== 'bow' ? `<path d="M18 -15 l-7 -5 v10 z M18 -15 l7 -5 v10 z" ${S(d, 1.5)}/>` : '') },

  { id: 'cap', w: 70, h: 38, zones: ['shelf'], c1: ['red', 'blue', 'green', 'black', 'yellow', 'purple', 'navy'], c2: ['white', 'yellow', 'red'], asym: true, parts: ['logo'],
    draw: ({ c, d, hide }) =>
      `<path d="M-24 -6 H24 Q44 -4 40 2 H-22 Z" ${S(shade(c, -.2))}/><path d="M-24 -6 Q-24 -36 0 -36 Q24 -36 24 -6 Z" ${S(c)}/><circle cx="0" cy="-36" r="3" fill="${d}"/>`
      + (hide !== 'logo' ? `<circle cx="0" cy="-20" r="6.5" fill="${d}" stroke="${shade(d, -.35)}" stroke-width="1.5"/>` : '') },

  { id: 'shoes', w: 74, h: 30, zones: ['floor', 'shelf'], c1: ['red', 'blue', 'white', 'black', 'pink', 'green', 'purple'], asym: true, parts: ['laces'],
    draw: ({ c, hide }) => rep(2, (k) => { const o = k * 38; return `<path d="M${-36 + o} 0 H${-4 + o} Q${-2 + o} -16 ${-14 + o} -24 H${-30 + o} Q${-38 + o} -10 ${-36 + o} 0 Z" ${S(c)}/><path d="M${-36 + o} -3 H${-4 + o}" ${L('#fff', 3)}/>`
      + (hide !== 'laces' ? `<path d="M${-26 + o} -14 h8 M${-25 + o} -10 h7" ${L('#fff', 2)}/>` : ''); }) },

  { id: 'boots', w: 60, h: 62, zones: ['floor'], c1: ['brown', 'black', 'red', 'yellow', 'pink', 'navy'], asym: true, parts: ['buckle'],
    draw: ({ c, hide }) =>
      `<path d="M-30 -60 H-8 V-14 H4 Q12 -12 10 0 H-30 Z" ${S(c)}/><path d="M-6 -60 H16 V-14 H28 Q36 -12 34 0 H-6 Z" ${S(c)}/>`
      + `<rect x="-30" y="-60" width="22" height="8" fill="${shade(c, .3)}"/><rect x="-6" y="-60" width="22" height="8" fill="${shade(c, .3)}"/>`
      + (hide !== 'buckle' ? `<rect x="-2" y="-36" width="9" height="7" rx="1.5" ${S('#fbc02d', 1.5)}/><rect x="22" y="-36" width="9" height="7" rx="1.5" ${S('#fbc02d', 1.5)}/>` : '') },

  { id: 'sock', w: 42, h: 60, zones: ['shelf'], c1: ['red', 'blue', 'green', 'yellow', 'pink', 'purple', 'orange'], n: [1, 4], asym: true,
    draw: ({ c, n }) =>
      `<path d="M-10 -60 H14 V-24 Q14 -4 -2 -2 H-16 Q-24 -4 -22 -14 Q-16 -22 -10 -24 Z" ${S(c)}/>`
      + rep(n, (i) => `<rect x="-10" y="${-46 + i * 7}" width="24" height="3.5" fill="#fff" opacity=".8"/>`)
      + `<rect x="-10" y="-60" width="24" height="9" fill="#fff" stroke="${shade(c, -.45)}" stroke-width="2"/>` },

  { id: 'bag', w: 62, h: 66, zones: ['floor', 'shelf'], c1: ['red', 'brown', 'pink', 'blue', 'black', 'purple', 'yellow'], parts: ['buckle'],
    draw: ({ c, hide }) =>
      `<path d="M-14 -44 Q-14 -66 0 -66 Q14 -66 14 -44" ${L(shade(c, -.45), 6)}/><path d="M-14 -44 Q-14 -66 0 -66 Q14 -66 14 -44" ${L(c, 3)}/>`
      + `<rect x="-29" y="-46" width="58" height="46" rx="8" ${S(c)}/><path d="M-29 -40 H29 V-28 Q0 -20 -29 -28 Z" ${S(shade(c, -.15))}/>`
      + (hide !== 'buckle' ? `<rect x="-5" y="-30" width="10" height="8" rx="2" ${S('#fbc02d', 1.5)}/>` : '') },

  { id: 'glasses', w: 62, h: 26, zones: ['shelf'], c1: ['black', 'red', 'blue', 'purple', 'pink', 'brown'],
    draw: ({ c }) =>
      `<circle cx="-14" cy="-13" r="12" fill="#b3e5fc" opacity=".6" stroke="${c}" stroke-width="3.5"/><circle cx="14" cy="-13" r="12" fill="#b3e5fc" opacity=".6" stroke="${c}" stroke-width="3.5"/>`
      + `<path d="M-2 -13 H2 M-26 -13 L-31 -18 M26 -13 L31 -18" ${L(c, 3.5)}/>` },

  { id: 'bowtie', w: 52, h: 28, zones: ['shelf'], c1: ['red', 'blue', 'black', 'purple', 'green', 'pink', 'yellow'], n: [0, 4],
    draw: ({ c, n }) =>
      `<path d="M-25 -26 L0 -14 L-25 -2 Z M25 -26 L0 -14 L25 -2 Z" ${S(c)}/><rect x="-6" y="-20" width="12" height="12" rx="3" ${S(shade(c, -.2), 1.5)}/>`
      + rep(n, (i) => `<circle cx="${i % 2 ? 16 : -16}" cy="${-20 + Math.floor(i / 2) * 10}" r="2.2" fill="#fff"/>`) },

  { id: 'mittens', w: 60, h: 52, zones: ['shelf'], c1: ['red', 'blue', 'pink', 'purple', 'green', 'cyan'], c2: ['white', 'yellow', 'cream'], parts: ['snow'],
    draw: ({ c, d, hide }) =>
      `<path d="M-28 0 H-6 V-30 Q-6 -50 -17 -50 Q-28 -50 -28 -30 Z" ${S(c)}/><path d="M-28 -24 Q-40 -30 -36 -16 Q-32 -10 -28 -14 Z" ${S(c)}/>`
      + `<path d="M28 0 H6 V-30 Q6 -50 17 -50 Q28 -50 28 -30 Z" ${S(c)}/><path d="M28 -24 Q40 -30 36 -16 Q32 -10 28 -14 Z" ${S(c)}/>`
      + `<rect x="-28" y="-10" width="22" height="10" fill="${d}"/><rect x="6" y="-10" width="22" height="10" fill="${d}"/>`
      + (hide !== 'snow' ? `<path d="M-17 -38 v12 M-23 -32 h12 M-21 -36 l8 8 M-13 -36 l-8 8 M17 -38 v12 M11 -32 h12 M13 -36 l8 8 M21 -36 l-8 8" ${L('#fff', 1.5)}/>` : '') },

  { id: 'umbrella', w: 30, h: 92, zones: ['floor'], c1: ['red', 'blue', 'purple', 'green', 'pink', 'navy'], c2: ['white', 'yellow', 'black'], asym: true,
    draw: ({ c, d }) =>
      `<path d="M0 -92 L-13 -22 Q0 -12 13 -22 Z" ${S(c)}/><path d="M0 -88 L-4 -18 M0 -88 L4 -18" ${L(d, 2.5)}/>`
      + `<path d="M0 -14 V-2 Q0 4 7 4" ${L('#5d4037', 4.5)}/><circle cx="0" cy="-92" r="2.5" fill="#5d4037"/>` },

  { id: 'belt', w: 52, h: 30, zones: ['shelf'], c1: ['brown', 'black', 'red', 'navy', 'pink'], asym: true, parts: ['buckle'],
    draw: ({ c, hide }) =>
      `<ellipse cx="0" cy="-14" rx="25" ry="14" ${S(c)}/><ellipse cx="0" cy="-14" rx="15" ry="7" fill="${shade(c, .3)}" stroke="${shade(c, -.3)}" stroke-width="1.5"/>`
      + (hide !== 'buckle' ? `<rect x="14" y="-24" width="13" height="11" rx="2" ${S('#fbc02d', 1.5)}/>` : '') },

  { id: 'necklace', w: 42, h: 56, zones: ['shelf'], c1: ['yellow', 'white', 'red', 'purple', 'cyan', 'pink'], c2: ['red', 'blue', 'green', 'purple'], n: [5, 9], parts: ['pendant'],
    draw: ({ c, d, n, hide }) =>
      `<path d="M-16 -50 Q-16 -14 0 -14 Q16 -14 16 -50" ${L('#9e9e9e', 1.5)}/>`
      + rep(n, (i) => { const t = Math.PI * (i / (n - 1)); const x = -16 * Math.cos(t), y = -50 + 36 * Math.sin(t); return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="4" ${S(c, 1.5)}/>`; })
      + (hide !== 'pendant' ? `<path d="M0 -14 L7 -6 L0 2 L-7 -6 Z" ${S(d, 1.5)}/>` : '') },
];

const WALLS = ['#f3e5f5', '#e8f5e9', '#fff8e1'];
const FLOORS = ['#b39ddb', '#a5d6a7', '#ffcc80'];

export function clothesBg(v) {
  const wall = WALLS[v], floor = FLOORS[v];
  let s = `<rect width="800" height="500" fill="${wall}"/>`;
  for (let x = 30; x < 800; x += 90) for (let y = 30; y < 400; y += 90) s += `<circle cx="${x}" cy="${y}" r="5" fill="${shade(wall, -.08)}"/>`;
  // thanh treo
  s += `<path d="M30 60 V110 M770 60 V110" stroke="#78909c" stroke-width="6" stroke-linecap="round"/>`
     + `<rect x="24" y="104" width="752" height="8" rx="4" fill="#90a4ae" stroke="#546e7a" stroke-width="2"/>`;
  // kệ
  s += `<rect x="30" y="330" width="740" height="12" rx="3" fill="#a1887f" stroke="#6d4c41" stroke-width="2"/><path d="M60 342 v20 M740 342 v20 M400 342 v20" stroke="#6d4c41" stroke-width="5"/>`;
  // sàn
  s += `<rect x="0" y="400" width="800" height="100" fill="${floor}"/><rect x="0" y="400" width="800" height="6" fill="${shade(floor, -.25)}"/>`;
  for (let x = 0; x < 800; x += 80) s += `<path d="M${x} 406 L${x - 30} 500" stroke="${shade(floor, -.12)}" stroke-width="2"/>`;
  return s;
}

export const CLOTHES = {
  id: 'clothes', name: 'Quần áo', emoji: '👕', variants: 3,
  zones: {
    rail:  { rects: [{ x1: 60, x2: 740, y1: 110, y2: 110 }], top: 110, scale: 0.85 },
    shelf: { rects: [{ x1: 50, x2: 750, y1: 328, y2: 331 }], scale: 0.85 },
    floor: { rects: [{ x1: 40, x2: 760, y1: 476, y2: 494 }], scale: 1 },
  },
  objects: CLOTHES_OBJECTS,
  bg: clothesBg,
};
