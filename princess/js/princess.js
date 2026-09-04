// ── Vẽ công chúa bằng SVG theo "look" (slotId → itemId) — phong cách hoạt hình chibi ──
// Bố cục (viewBox 300×560): đầu to (66→232), cổ mảnh, thân nhỏ, váy xòe rộng tới sát mép dưới.
import { itemOf } from './config.js';

export const VIEWBOX = '0 0 300 560';

/* ───────── màu ───────── */
function hexToRgb(h) { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
function rgbToHex(r, g, b) { return '#' + [r, g, b].map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join(''); }
export function shade(hex, k) {
  const [r, g, b] = hexToRgb(hex);
  if (k < 0) return rgbToHex(r * (1 + k), g * (1 + k), b * (1 + k));
  return rgbToHex(r + (255 - r) * k, g + (255 - g) * k, b + (255 - b) * k);
}
function mix(a, b, t) {
  const [r1, g1, b1] = hexToRgb(a), [r2, g2, b2] = hexToRgb(b);
  return rgbToHex(r1 + (r2 - r1) * t, g1 + (g2 - g1) * t, b1 + (b2 - b1) * t);
}
function lum(hex) { const [r, g, b] = hexToRgb(hex); return (0.299 * r + 0.587 * g + 0.114 * b) / 255; }
const GOLD = '#f7cf5a', GOLD_D = '#c9961a';

/* ───────── hình cơ bản ───────── */
const STAR = (cx, cy, r, fill, extra = '') => {
  let d = '';
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.45 : r;
    d += (i ? 'L' : 'M') + (cx + Math.cos(a) * rr).toFixed(1) + ',' + (cy + Math.sin(a) * rr).toFixed(1);
  }
  return `<path d="${d}Z" fill="${fill}" ${extra}/>`;
};
const HEART = (cx, cy, s, fill, extra = '') =>
  `<path d="M${cx},${cy + s} C${cx - s * 1.6},${cy - s * 0.2} ${cx - s * 0.9},${cy - s * 1.3} ${cx},${cy - s * 0.5} C${cx + s * 0.9},${cy - s * 1.3} ${cx + s * 1.6},${cy - s * 0.2} ${cx},${cy + s}Z" fill="${fill}" ${extra}/>`;
const GEM = (cx, cy, s, fill) =>
  `<path d="M${cx - s},${cy - s * 0.3} L${cx - s * 0.5},${cy - s} L${cx + s * 0.5},${cy - s} L${cx + s},${cy - s * 0.3} L${cx},${cy + s} Z" fill="${fill}" stroke="${shade(fill, -0.3)}" stroke-width="1"/>` +
  `<path d="M${cx - s * 0.5},${cy - s} L${cx - s * 0.2},${cy - s * 0.3} L${cx + s * 0.3},${cy - s * 0.3} Z" fill="#fff" opacity=".55"/>`;
const MIRROR = (inner) => `<g>${inner}</g><g transform="translate(300,0) scale(-1,1)">${inner}</g>`;

/* ───────── TÓC ───────── */
// Nền tóc sau đầu (mọi kiểu đều có) — hơi rộng hơn đầu
const HAIR_BASE = (c, o) => `<path d="M78,120 C64,150 62,200 78,236 L222,236 C238,200 236,150 222,120 C206,60 94,60 78,120 Z" fill="${c}" stroke="${o}" stroke-width="1.6"/>`;

function hairBack(style, c, d, l, o) {
  const hl = (p) => `<path d="${p}" stroke="${l}" stroke-width="3" fill="none" stroke-linecap="round" opacity=".45"/>`;
  switch (style) {
    case 'long':
      return `<path d="M78,120 C46,200 40,300 48,400 Q150,428 252,400 C260,300 254,200 222,120 C206,60 94,60 78,120 Z" fill="${c}" stroke="${o}" stroke-width="1.6"/>` +
        hl('M66,220 C58,280 56,340 60,392') + hl('M234,220 C242,280 244,340 240,392');
    case 'wavy':
      return `<path d="M78,120 C46,180 60,220 40,260 C24,290 56,300 36,340 C22,370 58,380 40,420 Q150,448 260,420 C242,380 278,370 264,340 C244,300 276,290 260,260 C240,220 254,180 222,120 C206,60 94,60 78,120 Z" fill="${c}" stroke="${o}" stroke-width="1.6"/>` +
        hl('M62,230 C50,260 66,290 52,320 C42,346 62,366 54,400') + hl('M238,230 C250,260 234,290 248,320 C258,346 238,366 246,400');
    case 'bob':
      return `<path d="M78,120 C58,170 60,230 84,262 Q150,286 216,262 C240,230 242,170 222,120 C206,60 94,60 78,120 Z" fill="${c}" stroke="${o}" stroke-width="1.6"/>`;
    case 'bun':
      return `<circle cx="150" cy="50" r="34" fill="${c}" stroke="${o}" stroke-width="1.6"/><circle cx="150" cy="50" r="23" fill="none" stroke="${d}" stroke-width="3" opacity=".5"/>` +
        `<path d="M128,56 Q150,38 172,56" stroke="${d}" stroke-width="2.5" fill="none" opacity=".5"/>` + HAIR_BASE(c, o);
    case 'braid':
      return HAIR_BASE(c, o);
    case 'ponytail':
      return `<path d="M212,60 C284,80 296,200 268,330 C260,368 282,392 296,402 C256,410 228,372 236,326 C250,230 236,130 204,84 Z" fill="${c}" stroke="${o}" stroke-width="1.6"/>` +
        hl('M256,150 C272,220 264,290 250,350') +
        `<ellipse cx="216" cy="78" rx="10" ry="14" fill="#ff7fb0" transform="rotate(-30 216 78)"/>` + HAIR_BASE(c, o);
    case 'curly': {
      let s = `<path d="M78,120 C46,200 50,320 150,340 C250,320 254,200 222,120 C206,60 94,60 78,120 Z" fill="${c}" stroke="${o}" stroke-width="1.6"/>`;
      const pts = [[70, 160], [56, 210], [52, 262], [64, 308], [92, 336], [128, 350], [172, 350], [208, 336], [236, 308], [248, 262], [244, 210], [230, 160]];
      for (const [x, y] of pts) s += `<circle cx="${x}" cy="${y}" r="26" fill="${c}" stroke="${o}" stroke-width="1.4"/>`;
      for (const [x, y] of pts) s += `<circle cx="${x}" cy="${y}" r="13" fill="none" stroke="${d}" stroke-width="2.2" opacity=".35"/>`;
      return s;
    }
    case 'twin':
      return HAIR_BASE(c, o);
    default: return HAIR_BASE(c, o);
  }
}

// Tóc vẽ trước thân nhưng sau đầu (bím tết, hai đuôi)
function hairOver(style, c, d, o) {
  switch (style) {
    case 'braid': {
      let s = `<path d="M84,190 C74,220 76,250 86,272" stroke="${c}" stroke-width="30" fill="none" stroke-linecap="round"/>`;
      for (let i = 0; i < 7; i++) {
        const cx = 86 + (i % 2 ? 9 : -9), cy = 284 + i * 27;
        s += `<ellipse cx="${cx}" cy="${cy}" rx="17" ry="14" fill="${i % 2 ? c : shade(c, -0.12)}" stroke="${o}" stroke-width="1.5"/>`;
      }
      s += `<path d="M76,470 L86,488 L96,470" stroke="${c}" stroke-width="10" fill="none" stroke-linecap="round"/>` +
        `<rect x="70" y="454" width="32" height="9" rx="4" fill="#ff7fb0"/>`;
      return s;
    }
    case 'twin': {
      const tail = `<path d="M84,150 C40,200 26,290 36,380 C56,404 86,398 96,372 C84,300 80,220 98,166 Z" fill="${c}" stroke="${o}" stroke-width="1.6"/>` +
        `<path d="M58,250 C48,300 50,340 58,376" stroke="${shade(c, 0.45)}" stroke-width="3" fill="none" opacity=".45" stroke-linecap="round"/>` +
        `<ellipse cx="90" cy="162" rx="11" ry="14" fill="#ff7fb0" transform="rotate(30 90 162)"/>`;
      return MIRROR(tail);
    }
    default: return '';
  }
}

// Mái & khối tóc phủ đỉnh đầu (vẽ sau mặt)
function hairFront(style, c, d, l, o) {
  const side = style === 'bun' || style === 'ponytail' || style === 'bob' || style === 'braid';
  // Ngôi giữa: hai lọn mái ôm sang hai bên trán (như tranh mẫu)
  const center =
    `<path d="M74,172 C66,86 104,50 150,50 C196,50 234,86 226,172 C224,140 214,122 200,128 C182,136 162,134 150,104 C138,134 118,136 100,128 C86,122 76,140 74,172 Z" fill="${c}" stroke="${o}" stroke-width="1.6" stroke-linejoin="round"/>` +
    `<path d="M150,54 C150,72 150,90 150,104" stroke="${d}" stroke-width="1.6" fill="none" opacity=".45" stroke-linecap="round"/>` +
    `<path d="M150,104 C140,124 126,132 110,132 M150,104 C160,124 174,132 190,132" stroke="${d}" stroke-width="1.3" fill="none" opacity=".35" stroke-linecap="round"/>` +
    `<path d="M112,86 C122,72 136,66 146,64 M188,86 C178,72 164,66 154,64" stroke="${l}" stroke-width="3.5" fill="none" opacity=".4" stroke-linecap="round"/>` +
    `<path d="M92,118 C96,100 106,88 118,82 M208,118 C204,100 194,88 182,82" stroke="${l}" stroke-width="2" fill="none" opacity=".35" stroke-linecap="round"/>`;
  // Ngôi lệch: một lọn mái dài vắt sang bên trái
  const swept =
    `<path d="M74,172 C66,86 104,50 150,50 C196,50 234,86 226,172 C226,120 214,98 196,96 C170,92 154,118 128,121 C110,123 84,138 74,172 Z" fill="${c}" stroke="${o}" stroke-width="1.6" stroke-linejoin="round"/>` +
    `<path d="M198,90 C184,94 168,104 154,114" stroke="${d}" stroke-width="1.6" fill="none" opacity=".45" stroke-linecap="round"/>` +
    `<path d="M114,82 C130,68 152,62 176,66" stroke="${l}" stroke-width="3.5" fill="none" opacity=".4" stroke-linecap="round"/>` +
    `<path d="M92,116 C98,98 110,86 124,80" stroke="${l}" stroke-width="2" fill="none" opacity=".35" stroke-linecap="round"/>`;
  // Lọn tóc bên tai (che tai một phần)
  const lock = (style === 'bun' || style === 'ponytail')
    ? `<path d="M78,150 C70,172 70,196 78,214 C82,196 84,174 90,152 Z" fill="${c}" stroke="${o}" stroke-width="1.2"/>`
    : `<path d="M78,146 C66,180 66,224 82,262 C90,224 88,186 96,150 Z" fill="${c}" stroke="${o}" stroke-width="1.4"/>`;
  let extra = '';
  if (style === 'curly') for (const [x, y] of [[84, 120], [216, 120], [78, 154], [222, 154]]) extra += `<circle cx="${x}" cy="${y}" r="12" fill="${c}" stroke="${o}" stroke-width="1.2"/>`;
  return (side ? swept : center) + MIRROR(lock) + extra;
}

/* ───────── VƯƠNG MIỆN (đội trên đỉnh đầu, y≈40–80) ───────── */
function crown(style) {
  switch (style) {
    case 'tiara':
      return `<path d="M108,78 L122,48 L136,66 L150,34 L164,66 L178,48 L192,78 Z" fill="#e6ecf7" stroke="#9fb0c8" stroke-width="2" stroke-linejoin="round"/>` +
        `<circle cx="150" cy="50" r="5" fill="#ff8fc0"/><circle cx="122" cy="58" r="3" fill="#7fb8ff"/><circle cx="178" cy="58" r="3" fill="#7fb8ff"/>`;
    case 'gold':
      return `<path d="M108,78 L122,48 L136,66 L150,34 L164,66 L178,48 L192,78 Z" fill="${GOLD}" stroke="${GOLD_D}" stroke-width="2" stroke-linejoin="round"/>` +
        `<circle cx="150" cy="50" r="5" fill="#e0344d"/><circle cx="122" cy="58" r="3" fill="#4fb56f"/><circle cx="178" cy="58" r="3" fill="#4fb56f"/>`;
    case 'big':
      return `<path d="M104,84 L104,40 L126,62 L150,26 L174,62 L196,40 L196,84 Z" fill="${GOLD}" stroke="${GOLD_D}" stroke-width="2" stroke-linejoin="round"/>` +
        `<rect x="100" y="78" width="100" height="12" rx="4" fill="#e3b93a" stroke="${GOLD_D}" stroke-width="1.5"/>` +
        GEM(150, 60, 8, '#3fc0b8') +
        `<circle cx="104" cy="40" r="5" fill="#ffe9a0" stroke="${GOLD_D}" stroke-width="1"/><circle cx="196" cy="40" r="5" fill="#ffe9a0" stroke="${GOLD_D}" stroke-width="1"/><circle cx="150" cy="26" r="5" fill="#ffe9a0" stroke="${GOLD_D}" stroke-width="1"/>` +
        `<circle cx="118" cy="84" r="3" fill="#fff"/><circle cx="150" cy="84" r="3" fill="#fff"/><circle cx="182" cy="84" r="3" fill="#fff"/>`;
    case 'flower': {
      let s = `<path d="M84,112 C100,66 200,66 216,112" stroke="#5aa85a" stroke-width="7" fill="none"/>`;
      const cols = ['#ff8fb8', '#ffe066', '#ff8fb8', '#c9a0f0', '#ff8fb8', '#ffe066', '#ff8fb8'];
      for (let i = 0; i < 7; i++) {
        const t = i / 6, x = 84 + t * 132, y = 108 - Math.sin(t * Math.PI) * 32;
        for (let k = 0; k < 5; k++) { const a = k * Math.PI * 2 / 5; s += `<circle cx="${(x + Math.cos(a) * 6).toFixed(1)}" cy="${(y + Math.sin(a) * 6).toFixed(1)}" r="5" fill="${cols[i]}"/>`; }
        s += `<circle cx="${x}" cy="${y}" r="3" fill="#fff"/>`;
      }
      return s;
    }
    case 'bow':
      return `<g transform="translate(206,66) rotate(20)">` +
        `<path d="M0,0 C-16,-26 -42,-22 -34,0 C-42,22 -16,26 0,0 Z" fill="#ff6f9c" stroke="#d04a7a" stroke-width="1.5"/>` +
        `<path d="M0,0 C16,-26 42,-22 34,0 C42,22 16,26 0,0 Z" fill="#ff6f9c" stroke="#d04a7a" stroke-width="1.5"/>` +
        `<path d="M-7,5 L-17,30 M7,5 L17,30" stroke="#ff6f9c" stroke-width="8" stroke-linecap="round"/>` +
        `<circle cx="0" cy="0" r="7" fill="#ffb3d6" stroke="#d04a7a" stroke-width="1.5"/></g>`;
    case 'pearl': {
      let s = `<path d="M84,118 C100,66 200,66 216,118" stroke="${GOLD}" stroke-width="3.5" fill="none"/>`;
      for (let i = 0; i <= 8; i++) {
        const t = i / 8, x = 84 + t * 132, y = 116 - Math.sin(t * Math.PI) * 38;
        s += `<circle cx="${x}" cy="${y.toFixed(1)}" r="6" fill="#fff" stroke="#d8dbe6" stroke-width="1"/>`;
      }
      return s;
    }
    default: return '';
  }
}

/* ───────── TRANG SỨC ───────── */
function earrings(style) {
  const one = (x) => {
    switch (style) {
      case 'pearl': return `<line x1="${x}" y1="178" x2="${x}" y2="186" stroke="${GOLD_D}" stroke-width="1.5"/><circle cx="${x}" cy="192" r="6.5" fill="#fff" stroke="#d8dbe6" stroke-width="1"/>`;
      case 'ruby': return `<line x1="${x}" y1="178" x2="${x}" y2="188" stroke="${GOLD_D}" stroke-width="1.5"/>` + GEM(x, 196, 7, '#e0344d');
      case 'sapphire': return `<line x1="${x}" y1="178" x2="${x}" y2="188" stroke="${GOLD_D}" stroke-width="1.5"/>` + GEM(x, 196, 7, '#3f7fe0');
      case 'hoop': return `<circle cx="${x}" cy="192" r="11" fill="none" stroke="${GOLD}" stroke-width="3.5"/>`;
      case 'star': return `<line x1="${x}" y1="178" x2="${x}" y2="186" stroke="${GOLD_D}" stroke-width="1.5"/>` + STAR(x, 195, 9, '#ffd84a', 'stroke="#d8a800" stroke-width="1"');
      default: return '';
    }
  };
  return one(74) + one(226);
}

function necklace(style) {
  const chain = `<path d="M134,250 Q150,276 166,250" stroke="${GOLD}" stroke-width="2" fill="none"/>`;
  switch (style) {
    case 'pearl': {
      let s = '';
      for (let i = 0; i <= 8; i++) {
        const t = i / 8, x = 132 + t * 36, y = 250 + Math.sin(t * Math.PI) * 20;
        s += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="4.5" fill="#fff" stroke="#d8dbe6" stroke-width="1"/>`;
      }
      return s;
    }
    case 'heart': return chain + HEART(150, 274, 7, '#e0344d', 'stroke="#a8102a" stroke-width="1"');
    case 'gem': return chain + GEM(150, 276, 8, '#7fb8ff');
    case 'star': return chain + STAR(150, 276, 9, '#ffd84a', 'stroke="#d8a800" stroke-width="1"');
    case 'choker': return `<rect x="138" y="240" width="24" height="9" rx="4" fill="#ff6f9c"/>` +
      `<path d="M150,244 l-6,-5 v10 z M150,244 l6,-5 v10 z" fill="#ff6f9c"/><circle cx="150" cy="244" r="2.5" fill="#ffd6e6"/>`;
    default: return '';
  }
}

/* ───────── VÁY (eo 116–184 tại y=332, gấu ≈ 520–540) ───────── */
const SKIRT = {
  ball:    'M116,332 C72,392 40,464 32,522 Q150,552 268,522 C260,464 228,392 184,332 Z',
  aline:   'M116,332 L72,522 Q150,548 228,522 L184,332 Z',
  mermaid: 'M116,332 C120,400 126,440 110,488 C98,514 82,524 66,530 Q150,556 234,530 C218,524 202,514 190,488 C174,440 180,400 184,332 Z',
  puff:    'M116,332 C84,410 60,470 54,522 Q150,550 246,522 C240,470 216,410 184,332 Z',
  tutu:    'M116,332 C88,370 70,400 64,424 Q150,452 236,424 C230,400 212,370 184,332 Z',
  gown:    'M116,332 C98,410 80,470 76,522 Q150,548 224,522 C220,470 202,410 184,332 Z',
};
const HEM = {
  ball: 'M32,522 Q150,552 268,522', aline: 'M72,522 Q150,548 228,522', mermaid: 'M66,530 Q150,556 234,530',
  puff: 'M54,522 Q150,550 246,522', tutu: 'M64,424 Q150,452 236,424', gown: 'M76,522 Q150,548 224,522',
};

function skirtDecor(style, c, d, l) {
  const hem = `<path d="${HEM[style]}" stroke="${l}" stroke-width="9" fill="none" opacity=".9"/><path d="${HEM[style]}" stroke="${GOLD}" stroke-width="3" fill="none" transform="translate(0,-6)"/>`;
  switch (style) {
    case 'ball':
      return `<path d="M124,350 C104,410 76,470 54,514 M150,350 L150,530 M176,350 C196,410 224,470 246,514" stroke="${d}" stroke-width="2.2" fill="none" opacity=".35"/>` +
        // tà váy trước (overskirt) như tranh mẫu
        `<path d="M118,336 C100,380 84,420 72,452 Q150,470 228,452 C216,420 200,380 182,336 Z" fill="${shade(c, -0.12)}" opacity=".55"/>` +
        `<path d="M72,452 Q150,470 228,452" stroke="${GOLD}" stroke-width="3.5" fill="none"/>` + hem;
    case 'aline':
      return `<path d="M116,332 L184,332" stroke="${d}" stroke-width="4" opacity=".4"/>` + hem;
    case 'mermaid':
      return `<path d="M120,380 Q150,394 180,380 M124,430 Q150,444 176,430 M112,478 Q150,494 188,478" stroke="${d}" stroke-width="2.2" fill="none" opacity=".35"/>` + hem;
    case 'puff':
      return `<path d="M92,400 Q150,420 208,400 M72,462 Q150,484 228,462" stroke="${l}" stroke-width="6" fill="none" opacity=".8"/>` + hem;
    case 'tutu':
      return `<path d="M74,404 Q150,430 226,404" stroke="${l}" stroke-width="5" fill="none" opacity=".8"/>` + hem;
    case 'gown':
      return `<path d="M170,340 C182,410 200,470 218,516" stroke="${d}" stroke-width="3" fill="none" opacity=".35"/>` + hem;
    default: return hem;
  }
}

function patternDef(id, style, dressColor) {
  const pc = lum(dressColor) > 0.82 ? shade(dressColor, -0.28) : '#ffffff';
  const op = lum(dressColor) > 0.82 ? '.7' : '.75';
  switch (style) {
    case 'dots': return `<pattern id="${id}" width="26" height="26" patternUnits="userSpaceOnUse"><circle cx="7" cy="7" r="4.5" fill="${pc}" opacity="${op}"/><circle cx="20" cy="20" r="4.5" fill="${pc}" opacity="${op}"/></pattern>`;
    case 'stripes': return `<pattern id="${id}" width="20" height="20" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="8" height="20" fill="${pc}" opacity="${op}"/></pattern>`;
    case 'hearts': return `<pattern id="${id}" width="32" height="32" patternUnits="userSpaceOnUse">${HEART(9, 9, 5.5, pc, `opacity="${op}"`)}${HEART(25, 25, 5.5, pc, `opacity="${op}"`)}</pattern>`;
    case 'stars': return `<pattern id="${id}" width="34" height="34" patternUnits="userSpaceOnUse">${STAR(9, 9, 6.5, pc, `opacity="${op}"`)}${STAR(26, 26, 6.5, pc, `opacity="${op}"`)}</pattern>`;
    case 'flowers': {
      const fl = (x, y) => [0, 1, 2, 3, 4].map((k) => { const a = k * Math.PI * 2 / 5; return `<circle cx="${(x + Math.cos(a) * 4.5).toFixed(1)}" cy="${(y + Math.sin(a) * 4.5).toFixed(1)}" r="3.2" fill="${pc}" opacity="${op}"/>`; }).join('') + `<circle cx="${x}" cy="${y}" r="2.2" fill="#ffe066"/>`;
      return `<pattern id="${id}" width="36" height="36" patternUnits="userSpaceOnUse">${fl(10, 10)}${fl(28, 28)}</pattern>`;
    }
    default: return '';
  }
}

/* ───────── PHỤ KIỆN CẦM TAY (tay phải: 231,374) ───────── */
function handItem(style) {
  switch (style) {
    case 'wand':
      return `<line x1="231" y1="372" x2="262" y2="302" stroke="${GOLD}" stroke-width="5" stroke-linecap="round"/>` +
        STAR(264, 294, 14, '#ffd84a', 'stroke="#e0a800" stroke-width="1.5"') + STAR(284, 282, 4.5, '#fff') + STAR(248, 282, 4, '#fff') + STAR(284, 312, 4, '#fff');
    case 'fan':
      return `<g transform="translate(231,372)"><path d="M0,0 L-38,-44 A58,58 0 0 1 42,-42 Z" fill="#ffd6e6" stroke="#ff8fb8" stroke-width="2"/>` +
        `<path d="M0,0 L-21,-54 M0,0 L2,-58 M0,0 L23,-52" stroke="#ff8fb8" stroke-width="1.5"/>` +
        `<path d="M-27,-42 A44,44 0 0 1 32,-40" stroke="#fff" stroke-width="3" fill="none" opacity=".8"/></g>`;
    case 'bouquet':
      return `<path d="M231,372 L240,340 M231,372 L252,346 M231,372 L226,340" stroke="#5aa85a" stroke-width="3" stroke-linecap="round"/>` +
        `<circle cx="240" cy="334" r="10" fill="#ff8fb8"/><circle cx="255" cy="341" r="9" fill="#ffe066"/><circle cx="225" cy="336" r="9" fill="#c9a0f0"/><circle cx="242" cy="322" r="8" fill="#fff"/>` +
        `<circle cx="240" cy="334" r="3.5" fill="#fff"/><circle cx="255" cy="341" r="3.5" fill="#fff"/><circle cx="225" cy="336" r="3.5" fill="#fff"/><circle cx="242" cy="322" r="3" fill="#ffe066"/>` +
        `<path d="M224,360 Q231,368 240,360" stroke="#ff6f9c" stroke-width="3" fill="none"/>`;
    case 'bag':
      return `<path d="M233,378 C238,384 246,386 250,392" stroke="${GOLD_D}" stroke-width="2" fill="none"/>` +
        `<path d="M236,394 Q252,378 268,394" stroke="${GOLD_D}" stroke-width="2.5" fill="none"/>` +
        `<rect x="232" y="392" width="40" height="30" rx="9" fill="#ff8fb8" stroke="#e05a8a" stroke-width="1.5"/><circle cx="252" cy="405" r="4" fill="${GOLD}"/>`;
    case 'mirror':
      return `<line x1="231" y1="372" x2="250" y2="334" stroke="${GOLD}" stroke-width="6" stroke-linecap="round"/>` +
        `<circle cx="258" cy="314" r="22" fill="${GOLD}" stroke="${GOLD_D}" stroke-width="1.5"/><circle cx="258" cy="314" r="16" fill="#d6f2ff"/>` +
        `<path d="M249,308 Q254,300 262,302" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round"/>`;
    case 'parasol':
      return `<line x1="231" y1="372" x2="248" y2="286" stroke="#a97c50" stroke-width="4" stroke-linecap="round"/>` +
        `<path d="M196,290 A52,52 0 0 1 300,290 Q294,284 286,290 Q278,284 270,290 Q262,284 254,290 Q246,284 238,290 Q230,284 222,290 Q214,284 206,290 Q200,284 196,290 Z" fill="#ffd6e6" stroke="#ff8fb8" stroke-width="2"/>` +
        `<path d="M248,238 L248,290 M220,248 Q224,270 218,290 M276,248 Q272,270 278,290" stroke="#ff8fb8" stroke-width="1.5" fill="none"/><circle cx="248" cy="236" r="4" fill="#ff8fb8"/>`;
    default: return '';
  }
}

/* ───────── GIÀY (y≈532–556, hai chân x=136/164) ───────── */
function shoes(item) {
  const c = item.color, d = shade(c, -0.25), glass = item.id === 'glass', heel = item.id !== 'pink' && item.id !== 'white';
  const one = (x, f) =>
    `<path d="M${x - 15},534 Q${x},527 ${x + 15},534 L${x + 17},546 Q${x},554 ${x - 17},546 Z" fill="${c}" stroke="${d}" stroke-width="1.5" ${glass ? 'opacity=".82"' : ''}/>` +
    (heel ? `<rect x="${x - 6 * f - 3}" y="545" width="6" height="10" rx="2" fill="${d}"/>` : '') +
    `<path d="M${x - 8},536 Q${x},532 ${x + 8},536" stroke="#fff" stroke-width="2" fill="none" opacity=".7"/>` +
    ((item.id === 'pink' || item.id === 'red') ? `<circle cx="${x}" cy="534" r="3.5" fill="#fff" opacity=".9"/>` : '');
  return one(136, 1) + one(164, -1);
}

/* ───────── TỔNG HỢP ───────── */
export function princessMarkup(look, opts = {}) {
  const idp = opts.idp || 'p';
  const skin = look.skin || '#ffe0c8';
  const skinD = shade(skin, -0.18), skinO = shade(skin, -0.32);
  const hairC = itemOf('hairColor', look.hairColor).color;
  const hairD = shade(hairC, -0.3), hairL = shade(hairC, 0.45), hairO = shade(hairC, -0.42);
  const dressC = itemOf('dressColor', look.dressColor).color;
  const dressD = shade(dressC, -0.22), dressL = shade(dressC, 0.45), dressO = shade(dressC, -0.38);
  const eyeC = itemOf('eyes', look.eyes).color;
  const lipItem = itemOf('lips', look.lips), blushItem = itemOf('blush', look.blush), shadowItem = itemOf('eyeshadow', look.eyeshadow);
  const gloveItem = itemOf('gloves', look.gloves), shoeItem = itemOf('shoes', look.shoes);
  const dressStyle = look.dress, skirt = SKIRT[dressStyle] || SKIRT.aline;
  const patId = idp + '-pat', pat = patternDef(patId, look.pattern, dressC);
  const gSkin = idp + '-skin', gIris = idp + '-iris', gCheek = idp + '-cheek', gDress = idp + '-dress';

  let s = `<defs>${pat}` +
    `<radialGradient id="${gSkin}" cx="50%" cy="40%" r="62%"><stop offset="0" stop-color="${shade(skin, 0.1)}"/><stop offset=".7" stop-color="${skin}"/><stop offset="1" stop-color="${shade(skin, -0.12)}"/></radialGradient>` +
    `<radialGradient id="${gIris}" cx="50%" cy="60%" r="55%"><stop offset="0" stop-color="${shade(eyeC, 0.5)}"/><stop offset=".55" stop-color="${eyeC}"/><stop offset="1" stop-color="${shade(eyeC, -0.45)}"/></radialGradient>` +
    `<linearGradient id="${gDress}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${shade(dressC, 0.12)}"/><stop offset="1" stop-color="${shade(dressC, -0.08)}"/></linearGradient>` +
    (blushItem.color ? `<radialGradient id="${gCheek}" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="${blushItem.color}" stop-opacity=".7"/><stop offset="1" stop-color="${blushItem.color}" stop-opacity="0"/></radialGradient>` : '') +
    `<clipPath id="${idp}-mouth"><path d="M126,200 Q150,236 174,200 Q150,206 126,200 Z"/></clipPath>` +
    `</defs>`;

  // 1. tóc sau
  s += hairBack(look.hair, hairC, hairD, hairL, hairO);
  // 2. chân, giày, thân da, cổ, tay
  s += `<path d="M136,340 L134,536" stroke="${skin}" stroke-width="16" stroke-linecap="round"/><path d="M164,340 L166,536" stroke="${skin}" stroke-width="16" stroke-linecap="round"/>`;
  s += shoes(shoeItem);
  s += `<rect x="140" y="222" width="20" height="36" rx="6" fill="${skin}"/>` +
       `<path d="M140,230 Q150,244 160,230 L160,222 L140,222 Z" fill="${skinD}" opacity=".5"/>` +
       `<path d="M104,256 C120,246 180,246 196,256 L188,336 L112,336 Z" fill="${skin}"/>` +
       `<path d="M108,262 C90,296 76,336 70,374" stroke="${skinO}" stroke-width="19" fill="none" stroke-linecap="round"/>` +
       `<path d="M108,262 C90,296 76,336 70,374" stroke="${skin}" stroke-width="16" fill="none" stroke-linecap="round"/>` +
       `<path d="M192,262 C210,296 224,336 230,374" stroke="${skinO}" stroke-width="19" fill="none" stroke-linecap="round"/>` +
       `<path d="M192,262 C210,296 224,336 230,374" stroke="${skin}" stroke-width="16" fill="none" stroke-linecap="round"/>` +
       `<circle cx="69" cy="376" r="10.5" fill="${skin}" stroke="${skinO}" stroke-width="1.5"/><circle cx="231" cy="376" r="10.5" fill="${skin}" stroke="${skinO}" stroke-width="1.5"/>`;
  // 3. váy
  s += `<path d="${skirt}" fill="url(#${gDress})" stroke="${dressO}" stroke-width="1.8" stroke-linejoin="round"/>`;
  if (pat) s += `<path d="${skirt}" fill="url(#${patId})"/>`;
  s += skirtDecor(dressStyle, dressC, dressD, dressL);
  // lấp lánh trên váy (như tranh mẫu)
  for (const [x, y] of [[96, 470], [206, 486], [150, 500], [120, 512], [180, 452], [72, 508], [232, 512]]) {
    if (y < 420 && dressStyle === 'tutu') continue;
    s += STAR(x, y, 3.2, '#fff', 'opacity=".8"');
  }
  // 4. thân váy
  if (dressStyle === 'gown') {
    s += `<path d="M100,270 C130,286 170,286 200,270 L186,336 L114,336 Z" fill="url(#${gDress})" stroke="${dressO}" stroke-width="1.6"/>` +
         (pat ? `<path d="M100,270 C130,286 170,286 200,270 L186,336 L114,336 Z" fill="url(#${patId})"/>` : '') +
         `<ellipse cx="102" cy="272" rx="16" ry="10" fill="${dressC}" stroke="${dressO}" stroke-width="1.4"/><ellipse cx="198" cy="272" rx="16" ry="10" fill="${dressC}" stroke="${dressO}" stroke-width="1.4"/>` +
         `<path d="M100,270 C130,286 170,286 200,270" stroke="${GOLD}" stroke-width="3" fill="none"/>`;
  } else {
    s += `<path d="M106,256 C124,276 176,276 194,256 L186,336 L114,336 Z" fill="url(#${gDress})" stroke="${dressO}" stroke-width="1.6"/>` +
         (pat ? `<path d="M106,256 C124,276 176,276 194,256 L186,336 L114,336 Z" fill="url(#${patId})"/>` : '') +
         `<path d="M106,256 C124,276 176,276 194,256" stroke="${GOLD}" stroke-width="3" fill="none"/>` +
         `<path d="M150,276 L150,330" stroke="${GOLD}" stroke-width="2" opacity=".8" stroke-dasharray="2 3"/>`;
    if (dressStyle === 'puff' || dressStyle === 'ball') {
      s += `<circle cx="104" cy="266" r="20" fill="${dressC}" stroke="${dressO}" stroke-width="1.6"/><circle cx="196" cy="266" r="20" fill="${dressC}" stroke="${dressO}" stroke-width="1.6"/>` +
           `<path d="M86,278 Q104,290 122,278 M178,278 Q196,290 214,278" stroke="${dressL}" stroke-width="3" fill="none" opacity=".85"/>`;
    } else if (dressStyle === 'aline' || dressStyle === 'mermaid') {
      s += `<path d="M98,254 C96,272 116,278 122,262 Z" fill="${dressC}" stroke="${dressO}" stroke-width="1.2"/><path d="M202,254 C204,272 184,278 178,262 Z" fill="${dressC}" stroke="${dressO}" stroke-width="1.2"/>`;
    } else if (dressStyle === 'tutu') {
      s += `<line x1="110" y1="256" x2="106" y2="276" stroke="${dressC}" stroke-width="6" stroke-linecap="round"/><line x1="190" y1="256" x2="194" y2="276" stroke="${dressC}" stroke-width="6" stroke-linecap="round"/>`;
    }
  }
  // thắt lưng vàng
  s += `<path d="M114,332 Q150,342 186,332" stroke="${GOLD}" stroke-width="5" fill="none"/>`;
  if (dressStyle === 'puff' || dressStyle === 'tutu') s += HEART(150, 335, 6, '#ff6f9c', 'stroke="#d04a7a" stroke-width="1"');
  // 5. bao tay
  if (gloveItem.id !== 'none') {
    const gc = gloveItem.color, gd = shade(gc, -0.25);
    const gl = `<path d="M86,318 C78,342 72,360 70,374" stroke="${gc}" stroke-width="15" fill="none" stroke-linecap="round"/><circle cx="69" cy="376" r="10.5" fill="${gc}" stroke="${gd}" stroke-width="1.2"/>` +
               `<path d="M80,320 L94,316" stroke="${gd}" stroke-width="2" stroke-linecap="round"/>`;
    s += MIRROR(gl);
  }
  // 6. tóc trước thân, vòng cổ
  s += hairOver(look.hair, hairC, hairD, hairO);
  s += necklace(look.necklace);

  // 7. ĐẦU — mặt tròn to, mắt lớn long lanh, mũi nhỏ, miệng cười
  s += `<path d="M78,150 C66,146 66,178 80,184 L88,176 Z" fill="${skin}" stroke="${skinO}" stroke-width="1.4"/><path d="M222,150 C234,146 234,178 220,184 L212,176 Z" fill="${skin}" stroke="${skinO}" stroke-width="1.4"/>`;
  s += `<path d="M150,66 C200,66 228,104 228,152 C228,198 196,232 150,234 C104,232 72,198 72,152 C72,104 100,66 150,66 Z" fill="url(#${gSkin})" stroke="${skinO}" stroke-width="1.8"/>`;
  s += `<path d="M110,216 Q150,238 190,216 Q150,228 110,216 Z" fill="${skinD}" opacity=".22"/>`;
  // má hồng
  if (blushItem.color) s += `<ellipse cx="100" cy="192" rx="17" ry="11" fill="url(#${gCheek})"/><ellipse cx="200" cy="192" rx="17" ry="11" fill="url(#${gCheek})"/>`;
  // mắt trái rồi soi gương
  let eye = '';
  if (shadowItem.color) eye += `<path d="M94,150 C100,124 138,124 142,150 C132,140 106,140 94,150 Z" fill="${shadowItem.color}" opacity=".6"/>`;
  eye += `<ellipse cx="118" cy="161" rx="23" ry="26" fill="#fff"/>` +
         `<circle cx="118" cy="164" r="17.5" fill="url(#${gIris})"/><circle cx="118" cy="164" r="17.5" fill="none" stroke="${shade(eyeC, -0.55)}" stroke-width="1.6"/>` +
         `<circle cx="118" cy="165" r="8" fill="#150c14"/>` +
         `<path d="M95,161 C96,140 140,140 141,161 C138,150 98,150 95,161 Z" fill="#3a2a36" opacity=".16"/>` +
         `<circle cx="110" cy="153" r="6" fill="#fff"/><circle cx="126" cy="173" r="2.8" fill="#fff" opacity=".9"/>` +
         // viền mí trên dày + đuôi mắt
         `<path d="M95,156 C98,130 138,128 141,156 L144,154 C142,124 94,126 92,156 Z" fill="#2a1b22"/>` +
         `<path d="M95,156 C100,133 136,133 141,156" stroke="#2a1b22" stroke-width="3" fill="none" stroke-linecap="round"/>` +
         // lông mi
         `<path d="M95,144 C90,140 86,140 82,142 C87,142 90,145 94,148 Z M99,136 C95,131 91,130 87,131 C92,132 95,135 98,139 Z M106,130 C104,125 101,123 97,123 C102,125 104,128 106,132 Z" fill="#2a1b22"/>` +
         // mi dưới mờ
         `<path d="M98,181 Q118,191 138,181" stroke="#6b4a58" stroke-width="1.2" fill="none" stroke-linecap="round" opacity=".7"/>` +
         // lông mày mảnh
         `<path d="M98,127 Q118,116 140,126" stroke="${shade(hairC, -0.45)}" stroke-width="2.6" fill="none" stroke-linecap="round"/>`;
  s += MIRROR(eye);
  // mũi nhỏ
  s += `<path d="M146,186 q3,5 8,2" stroke="${skinD}" stroke-width="1.8" fill="none" stroke-linecap="round"/><circle cx="147" cy="184" r="1.5" fill="#fff" opacity=".5"/>`;
  // miệng cười tươi lộ răng
  const lipC = lipItem.id === 'none' ? mix(skin, '#e0506e', 0.62) : lipItem.color;
  s += `<path d="M126,200 Q150,236 174,200 Q150,206 126,200 Z" fill="#9c2d47"/>` +
       `<g clip-path="url(#${idp}-mouth)"><path d="M124,198 Q150,214 176,198 L176,190 L124,190 Z" fill="#fff"/><ellipse cx="150" cy="232" rx="14" ry="9" fill="#ef6e8c"/></g>` +
       `<path d="M126,200 Q150,236 174,200 Q150,206 126,200 Z" fill="none" stroke="${lipC}" stroke-width="${lipItem.id === 'none' ? 2.4 : 3.4}" stroke-linejoin="round"/>` +
       `<path d="M124,199 Q150,205 176,199" stroke="${lipC}" stroke-width="${lipItem.id === 'none' ? 1.6 : 2.6}" fill="none" stroke-linecap="round"/>` +
       `<circle cx="124" cy="200" r="${lipItem.id === 'none' ? 1.8 : 2.6}" fill="${lipC}"/><circle cx="176" cy="200" r="${lipItem.id === 'none' ? 1.8 : 2.6}" fill="${lipC}"/>`;
  // 8. mái tóc, vương miện, hoa tai
  s += hairFront(look.hair, hairC, hairD, hairL, hairO);
  s += crown(look.crown);
  s += earrings(look.earrings);
  // 9. phụ kiện cầm tay
  s += handItem(look.hand);
  return s;
}

export function renderPrincess(svgEl, look, opts = {}) {
  svgEl.setAttribute('viewBox', opts.viewBox || VIEWBOX);
  svgEl.innerHTML = princessMarkup(look, opts);
}
