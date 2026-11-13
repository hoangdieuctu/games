// Bản đồ thế giới — các khu vực là những hòn đảo nối với nhau bằng một con đường,
// rồng con đứng ở khu đang chọn và đi dọc con đường khi chuyển sang khu khác.
// Khu chưa mở bị mây che kín; vừa mở khoá thì mây tan và rồng tự bay tới.

const NS = 'http://www.w3.org/2000/svg';

// toạ độ tâm đảo cho màn ngang / màn dọc (theo viewBox)
const LAYOUT = {
  wide: { w: 1000, h: 620, R: 96, pts: [[150, 430], [345, 215], [535, 420], [715, 185], [870, 405]] },
  tall: { w: 540, h: 1000, R: 92, ls: 1.25, pts: [[145, 850], [395, 690], [150, 515], [385, 335], [170, 150]] }, // màn dọc: nhãn và rồng to hơn cho dễ đọc
};

// màu nền từng đảo: đất, mép đất
const LAND = {
  rice: ['#77c24c', '#4b8a2c'],
  bay: ['#f0dba0', '#c4a160'],
  lava: ['#5e3c37', '#36221f'],
  ice: ['#e4f3ff', '#93bfdc'],
  lantern: ['#8b5a8e', '#55305b'],
};

function rng(seed) {
  let a = seed >>> 0;
  return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
function el(tag, attrs, parent) {
  const e = document.createElementNS(NS, tag);
  for (const k in attrs) e.setAttribute(k, attrs[k]);
  if (parent) parent.appendChild(e);
  return e;
}
const f1 = (v) => v.toFixed(1);
// đường cong kín mềm (Catmull-Rom → Bézier) qua các điểm
function closedCurve(pts) {
  const n = pts.length; let d = `M${f1(pts[0][0])},${f1(pts[0][1])}`;
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
    d += ` C${f1(p1[0] + (p2[0] - p0[0]) / 6)},${f1(p1[1] + (p2[1] - p0[1]) / 6)} ${f1(p2[0] - (p3[0] - p1[0]) / 6)},${f1(p2[1] - (p3[1] - p1[1]) / 6)} ${f1(p2[0])},${f1(p2[1])}`;
  }
  return d + 'Z';
}
// hình hòn đảo lồi lõm ngẫu nhiên (cố định theo seed)
function blob(cx, cy, R, seed, sx = 1.18, sy = 0.9) {
  const r = rng(seed), pts = [];
  for (let i = 0; i < 13; i++) {
    const a = (i / 13) * Math.PI * 2, k = 0.84 + r() * 0.26;
    pts.push([cx + Math.cos(a) * R * k * sx, cy + Math.sin(a) * R * k * sy]);
  }
  return closedCurve(pts);
}

// ── hoạ tiết riêng từng khu (vẽ quanh gốc toạ độ, cỡ chuẩn R = 100) ──
const MOTIF = {
  rice(g) {
    // đồi ruộng bậc thang + cây đa nhỏ
    [[0, 26, 74, 26, '#5aa337'], [0, 8, 58, 21, '#73bd48'], [0, -8, 42, 16, '#8fd05c'], [0, -21, 25, 10, '#a9e070']].forEach(([x, y, rx, ry, c]) => {
      el('ellipse', { cx: x, cy: y, rx, ry, fill: c }, g);
      el('path', { d: `M${-rx * 0.8},${y + 2} Q0,${y + ry * 0.9} ${rx * 0.8},${y + 2}`, fill: 'none', stroke: 'rgba(255,255,255,.35)', 'stroke-width': 2 }, g);
    });
    el('rect', { x: 50, y: -14, width: 6, height: 20, rx: 2, fill: '#7a5230' }, g);
    el('circle', { cx: 53, cy: -20, r: 15, fill: '#3f8a2a' }, g);
    el('circle', { cx: 46, cy: -26, r: 9, fill: '#58a83b' }, g);
    // cánh cò
    el('path', { d: 'M-48,-44 q7,-7 14,0 q7,-7 14,0', fill: 'none', stroke: '#fff', 'stroke-width': 2.5, 'stroke-linecap': 'round', class: 'm-bird' }, g);
  },
  bay(g) {
    // vịnh nước xanh với các cột đá vôi và một cánh buồm
    el('ellipse', { cx: 0, cy: 12, rx: 76, ry: 36, fill: '#2fa9c6' }, g);
    el('ellipse', { cx: -8, cy: 8, rx: 56, ry: 22, fill: '#53c4db', opacity: 0.8 }, g);
    [[-42, 18, 15, 50], [-14, 6, 19, 66], [22, 16, 14, 46], [46, 4, 11, 36]].forEach(([x, y, w, h]) => {
      el('path', { d: `M${x - w},${y} Q${x - w - 3},${y - h * 0.7} ${x - w * 0.3},${y - h} Q${x + w * 0.4},${y - h - 4} ${x + w},${y - h * 0.6} Q${x + w + 2},${y - h * 0.2} ${x + w},${y} Z`, fill: '#5c8a74' }, g);
      el('path', { d: `M${x - w * 0.5},${y - h + 3} Q${x},${y - h - 6} ${x + w * 0.7},${y - h * 0.62}`, fill: 'none', stroke: '#3e7a4c', 'stroke-width': 6, 'stroke-linecap': 'round' }, g);
      el('ellipse', { cx: x, cy: y, rx: w + 3, ry: 4, fill: 'rgba(255,255,255,.55)' }, g);
    });
    const b = el('g', { class: 'm-boat' }, g);
    el('path', { d: 'M8,34 h26 l-5,6 h-16 Z', fill: '#8a4b25' }, b);
    el('path', { d: 'M20,33 V12 L34,30 Z', fill: '#ff8a3d' }, b);
  },
  lava(g) {
    // núi lửa phun khói, dòng dung nham chảy xuống
    el('circle', { cx: 0, cy: -38, r: 34, fill: '#ff6a2b', opacity: 0.35, class: 'm-glow' }, g);
    el('path', { d: 'M-72,36 L-18,-40 Q0,-50 18,-40 L72,36 Z', fill: '#7a4a40' }, g);
    el('path', { d: 'M-72,36 L-18,-40 Q-8,-45 0,-46 L-20,36 Z', fill: '#8f5a4d' }, g);
    el('ellipse', { cx: 0, cy: -42, rx: 18, ry: 6, fill: '#ffb03a' }, g);
    el('path', { d: 'M4,-40 Q14,-14 2,6 Q-8,22 6,36 L16,36 Q4,22 14,6 Q24,-14 12,-40 Z', fill: '#ff7a2b' }, g);
    el('path', { d: 'M-10,-39 Q-22,-20 -30,0 L-24,2 Q-16,-18 -4,-38 Z', fill: '#ff9a3a' }, g);
    const sm = el('g', { class: 'm-smoke' }, g);
    [[0, -62, 11], [10, -78, 14], [-4, -96, 17]].forEach(([x, y, r]) => el('circle', { cx: x, cy: y, r, fill: '#9a8f94', opacity: 0.75 }, sm));
  },
  ice(g) {
    // dãy núi tuyết và tinh thể băng
    el('path', { d: 'M-80,34 L-30,-46 L18,34 Z', fill: '#cfe7f8' }, g);
    el('path', { d: 'M-30,-46 L18,34 L-6,34 Z', fill: '#a9d1ec' }, g);
    el('path', { d: 'M-12,34 L34,-30 L80,34 Z', fill: '#d9eefb' }, g);
    el('path', { d: 'M34,-30 L80,34 L56,34 Z', fill: '#afd5ee' }, g);
    el('path', { d: 'M-30,-46 L-44,-24 L-36,-28 L-30,-20 L-22,-28 L-15,-22 Z', fill: '#fff' }, g);
    el('path', { d: 'M34,-30 L23,-14 L30,-17 L36,-10 L42,-17 L47,-12 Z', fill: '#fff' }, g);
    const c = el('g', { class: 'm-twinkle', stroke: '#7fd4ff', 'stroke-width': 3, 'stroke-linecap': 'round' }, g);
    for (let k = 0; k < 3; k++) { const a = k * Math.PI / 3; el('line', { x1: -60 + Math.cos(a) * 9, y1: -30 + Math.sin(a) * 9, x2: -60 - Math.cos(a) * 9, y2: -30 - Math.sin(a) * 9 }, c); }
  },
  lantern(g) {
    // dãy nhà mái cong và dây đèn lồng
    [[-52, 6, 34, 30], [-12, -2, 40, 38], [32, 8, 32, 28]].forEach(([x, y, w, h]) => {
      el('rect', { x: x - w / 2, y: y - h / 2, width: w, height: h + 18, fill: '#f3d9a8' }, g);
      el('rect', { x: x - 6, y: y + h / 2 + 2, width: 12, height: 16, fill: '#7a3b22' }, g);
      el('path', { d: `M${x - w / 2 - 9},${y - h / 2 + 2} Q${x},${y - h / 2 - 22} ${x + w / 2 + 9},${y - h / 2 + 2} Q${x},${y - h / 2 - 8} ${x - w / 2 - 9},${y - h / 2 + 2} Z`, fill: '#a32e2e' }, g);
    });
    el('path', { d: 'M-78,-30 Q-40,-14 0,-28 Q40,-42 78,-26', fill: 'none', stroke: '#3b2230', 'stroke-width': 1.6 }, g);
    [[-60, -24], [-30, -19], [0, -28], [30, -36], [60, -30]].forEach(([x, y], k) => {
      el('circle', { cx: x, cy: y + 8, r: 13, fill: '#ffb03a', opacity: 0.35, class: 'm-flicker', style: `animation-delay:${-k * 0.37}s` }, g);
      el('ellipse', { cx: x, cy: y + 8, rx: 7, ry: 8, fill: '#ff4a32' }, g);
      el('rect', { x: x - 4, y: y - 1, width: 8, height: 2.5, fill: '#ffd25a' }, g);
    });
  },
};

// mây che khu chưa mở
function clouds(g, R, seed) {
  const r = rng(seed), c = el('g', { class: 'm-fog' }, g);
  for (let k = 0; k < 7; k++) {
    const a = (k / 7) * Math.PI * 2 + r(), d = R * (0.25 + r() * 0.45);
    el('circle', { cx: Math.cos(a) * d * 1.1, cy: Math.sin(a) * d * 0.7, r: R * (0.42 + r() * 0.22), fill: '#e9e4f5', opacity: 0.93 }, c);
  }
  el('circle', { cx: 0, cy: 0, r: R * 0.5, fill: '#f4f1fa' }, c);
  // ổ khoá
  const lk = el('g', { transform: 'translate(0 -6)' }, c);
  el('path', { d: 'M-11,-4 V-12 a11,11 0 0 1 22,0 V-4', fill: 'none', stroke: '#6f6390', 'stroke-width': 5 }, lk);
  el('rect', { x: -17, y: -5, width: 34, height: 26, rx: 6, fill: '#6f6390' }, lk);
  el('circle', { cx: 0, cy: 7, r: 4, fill: '#f4f1fa' }, lk);
  return c;
}

export function createWorldMap(o) {
  const svg = o.svg, card = o.card;
  let L = null, stops = [], segs = [], isles = [], dragon = null, dragonIn = null;
  let at = 0, moving = false, revealQ = null, lastKey = '';

  const shownOpen = (w) => o.isOpen(w) && !(revealQ && revealQ.has(w));
  const highestOpen = () => { let h = 0; for (let w = 0; w < o.worlds.length; w++) if (o.isOpen(w)) h = w; return h; };

  function build() {
    const box = svg.getBoundingClientRect();
    L = box.width >= box.height * 0.95 ? LAYOUT.wide : LAYOUT.tall;
    const { w: VW, h: VH, R } = L;
    // khung nới theo tỉ lệ màn hình để biển phủ kín, các đảo vẫn nằm giữa
    const ratio = box.width / Math.max(1, box.height);
    let x0 = 0, y0 = 0, bw = VW, bh = VH;
    if (ratio > VW / VH) { bw = VH * ratio; x0 = -(bw - VW) / 2; } else { bh = VW / ratio; y0 = -(bh - VH) / 2; }
    svg.setAttribute('viewBox', `${f1(x0)} ${f1(y0)} ${f1(bw)} ${f1(bh)}`);
    svg.innerHTML = '';
    lastKey = `${Math.round(box.width)}x${Math.round(box.height)}`;

    const defs = el('defs', {}, svg);
    const sea = el('radialGradient', { id: 'mSea', cx: '50%', cy: '45%', r: '75%' }, defs);
    el('stop', { offset: '0%', 'stop-color': '#1c7aa0' }, sea);
    el('stop', { offset: '100%', 'stop-color': '#0b3552' }, sea);
    const gray = el('filter', { id: 'mGray' }, defs);
    el('feColorMatrix', { type: 'saturate', values: '0.15' }, gray);
    const sh = el('filter', { id: 'mShadow', x: '-30%', y: '-30%', width: '160%', height: '160%' }, defs);
    el('feDropShadow', { dx: 0, dy: 6, stdDeviation: 5, 'flood-color': '#04121e', 'flood-opacity': 0.45 }, sh);

    // biển, sóng lăn tăn
    el('rect', { x: x0, y: y0, width: bw, height: bh, fill: 'url(#mSea)' }, svg);
    const r = rng(7), waves = el('g', { class: 'm-waves' }, svg);
    for (let k = 0; k < Math.round(bw * bh / 9000); k++) {
      const x = x0 + r() * bw, y = y0 + r() * bh;
      el('path', { d: `M${f1(x)},${f1(y)} q6,-5 12,0 q6,-5 12,0`, fill: 'none', stroke: 'rgba(255,255,255,.22)', 'stroke-width': 2, 'stroke-linecap': 'round', style: `animation-delay:${f1(-r() * 6)}s` }, waves);
    }

    stops = L.pts.map(([x, y]) => [x, y + R * 0.4]);

    // đảo
    const isleG = el('g', {}, svg);
    isles = o.worlds.map((W, w) => {
      const [cx, cy] = L.pts[w], [c1, c2] = LAND[W.theme] || LAND.rice;
      const g = el('g', { class: 'm-isle', 'data-w': w, role: 'button', tabindex: -1, 'aria-label': W.name }, isleG);
      el('path', { d: blob(cx, cy + 4, R * 1.1, 31 + w * 17), fill: 'rgba(190,240,255,.28)' }, g); // bọt sóng quanh đảo
      const land = el('g', { class: 'm-land', filter: 'url(#mShadow)' }, g);
      el('path', { d: blob(cx, cy + 8, R, 31 + w * 17), fill: c2 }, land);
      el('path', { d: blob(cx, cy, R, 31 + w * 17), fill: c1 }, land);
      const m = el('g', { transform: `translate(${cx} ${cy - R * 0.2}) scale(${R / 100})` }, land);
      (MOTIF[W.theme] || MOTIF.rice)(m);
      const fog = clouds(el('g', { transform: `translate(${cx} ${cy})` }, g), R, 90 + w);
      return { g, land, fog, cx, cy };
    });

    // con đường nối các khu: đoạn đã mở màu vàng, đoạn chưa mở mờ
    const road = el('g', {}, svg);
    segs = [];
    for (let w = 0; w + 1 < stops.length; w++) {
      const [x1, y1] = stops[w], [x2, y2] = stops[w + 1];
      const mx = (x1 + x2) / 2, my = (y1 + y2) / 2, dx = x2 - x1, dy = y2 - y1, len = Math.hypot(dx, dy);
      const bend = (w % 2 ? -1 : 1) * len * 0.22;
      const d = `M${f1(x1)},${f1(y1)} Q${f1(mx - dy / len * bend)},${f1(my + dx / len * bend)} ${f1(x2)},${f1(y2)}`;
      el('path', { d, fill: 'none', stroke: 'rgba(40,24,10,.45)', 'stroke-width': 13, 'stroke-linecap': 'round' }, road);
      const p = el('path', { d, fill: 'none', 'stroke-width': 6, 'stroke-linecap': 'round', 'stroke-dasharray': '2 13', class: 'm-road' }, road);
      segs.push(p);
    }
    // điểm dừng ở mỗi khu
    stops.forEach(([x, y]) => {
      el('ellipse', { cx: x, cy: y + 4, rx: 22, ry: 8, fill: 'rgba(0,0,0,.25)' }, road);
      el('ellipse', { cx: x, cy: y, rx: 20, ry: 7, fill: '#f6e3b0', stroke: '#b88a3e', 'stroke-width': 2 }, road);
    });

    // nhãn tên khu + số sao
    const lab = el('g', {}, svg);
    isles.forEach((I, w) => {
      const W = o.worlds[w], name = `${w + 1}. ${W.name}`, bw = Math.max(150, name.length * 10.5 + 34);
      const g = el('g', { class: 'm-label', transform: `translate(${I.cx} ${I.cy + R * 0.98}) scale(${L.ls || 1})` }, lab);
      el('rect', { x: -bw / 2, y: -17, width: bw, height: 50, rx: 14, fill: 'rgba(22,16,40,.9)', stroke: 'rgba(255,210,90,.6)', 'stroke-width': 2 }, g);
      const t1 = el('text', { x: 0, y: 1, class: 'm-name' }, g); t1.textContent = name;
      const t2 = el('text', { x: 0, y: 22, class: 'm-sub' }, g);
      I.label = g; I.sub = t2;
      I.g.addEventListener('click', () => pick(w));
      g.addEventListener('click', () => pick(w));
    });

    // rồng con
    dragon = el('g', { class: 'm-dragon' }, svg);
    el('ellipse', { cx: 0, cy: 4, rx: 24, ry: 8, fill: 'rgba(0,0,0,.3)' }, dragon);
    dragonIn = el('g', { class: 'm-bob' }, el('g', { transform: `scale(${L.ls || 1})` }, dragon));
    el('circle', { cx: 0, cy: -30, r: 27, fill: '#ffd25a', stroke: '#fff', 'stroke-width': 4 }, dragonIn);
    el('path', { d: 'M-8,-5 L0,6 L8,-5 Z', fill: '#fff' }, dragonIn);
    const t = el('text', { x: 0, y: -29, class: 'm-dragon-ico' }, dragonIn); t.textContent = '🐉';
    sync();
  }

  function placeDragon(x, y) { dragon.setAttribute('transform', `translate(${f1(x)} ${f1(y)})`); }

  // cập nhật trạng thái mở / khoá, sao, đường, thẻ thông tin
  function sync() {
    isles.forEach((I, w) => {
      const open = shownOpen(w);
      I.g.classList.toggle('locked', !open);
      I.g.classList.toggle('here', w === at);
      I.label.classList.toggle('locked', !open);
      const st = o.stars(w);
      I.sub.textContent = open ? `★ ${st} / 30${o.cleared(w) === 10 ? '  ·  Đã chinh phục' : ''}` : 'Chưa mở';
    });
    segs.forEach((p, w) => p.classList.toggle('open', shownOpen(w + 1)));
    if (!moving) placeDragon(...stops[at]);
    renderCard();
  }

  function renderCard(goingTo) {
    const w = goingTo ?? at, W = o.worlds[w];
    card.innerHTML = '';
    const info = document.createElement('div'); info.className = 'mc-info';
    info.innerHTML = `<div class="mc-ico">${W.emoji}</div><div class="mc-txt"><div class="mc-name">${w + 1}. ${W.name}</div><div class="mc-desc">${goingTo != null ? 'Rồng con đang bay tới…' : `${W.desc} · ★ ${o.stars(w)}/30 · Qua ${o.cleared(w)}/10 màn`}</div></div>`;
    const go = document.createElement('button'); go.className = 'btn mc-go'; go.textContent = 'Vào khu vực';
    go.disabled = goingTo != null;
    go.onclick = () => enter();
    card.append(info, go);
  }

  function enter() { if (moving) return; o.save.mapAt = at; o.persist(); o.onEnter(at); }

  // rồng đi dọc đường từ khu hiện tại tới khu w (qua từng khu ở giữa)
  function travel(w, done) {
    if (w === at) { done && done(); return; }
    moving = true; renderCard(w);
    const dir = w > at ? 1 : -1;
    const legs = []; for (let k = at; k !== w; k += dir) legs.push(dir > 0 ? k : k - 1);
    let i = 0;
    const step = () => {
      if (i >= legs.length) {
        moving = false; at = w; o.save.mapAt = w; o.persist(); sync(); o.sfx('arrive'); done && done(); return;
      }
      const p = segs[legs[i]], len = p.getTotalLength(), dur = Math.min(900, 380 + len * 1.1), t0 = performance.now();
      o.sfx('hop');
      const frame = (now) => {
        if (!svg.isConnected) return;
        const t = Math.min(1, (now - t0) / dur), e = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
        const pt = p.getPointAtLength(dir > 0 ? e * len : (1 - e) * len);
        placeDragon(pt.x, pt.y - Math.sin(e * Math.PI) * 26); // nhún lên khi bay qua biển
        if (t < 1) requestAnimationFrame(frame);
        else { at = dir > 0 ? legs[i] + 1 : legs[i]; i++; isles.forEach((I, k) => I.g.classList.toggle('here', k === at)); step(); }
      };
      requestAnimationFrame(frame);
    };
    step();
  }

  function pick(w) {
    if (moving) return;
    if (!shownOpen(w)) {
      const I = isles[w]; I.g.classList.remove('shake'); void I.g.getBBox(); I.g.classList.add('shake');
      o.sfx('locked');
      o.toast(w > 0 ? `Qua hết ${o.worlds[w - 1].name} để mở` : 'Chưa mở');
      return;
    }
    if (w === at) { enter(); return; }
    travel(w);
  }

  // mở bản đồ: rồng đứng ở khu `w` (nếu có) hoặc khu đã ghé lần trước; khu vừa mở khoá thì mây tan rồi rồng bay tới
  function open(w) {
    const hi = highestOpen();
    const seen = o.save.mapSeen ?? hi;
    revealQ = hi > seen ? new Set(Array.from({ length: hi - seen }, (_, k) => seen + 1 + k)) : null;
    let start = w ?? o.save.mapAt ?? hi;
    if (!o.isOpen(start)) start = hi;
    if (revealQ && revealQ.has(start)) start = seen;
    at = start; moving = false;
    renderCard(); // thẻ thông tin có trước để đo đúng chỗ còn lại cho bản đồ
    build();
    if (revealQ) {
      setTimeout(() => {
        if (!svg.isConnected) return;
        revealQ = null; o.save.mapSeen = hi; o.persist();
        o.sfx('unlock'); sync();
        setTimeout(() => travel(hi), 700);
      }, 650);
    } else if (o.save.mapSeen !== hi) { o.save.mapSeen = hi; o.persist(); }
  }

  // phím: ←/→ (hoặc ↑/↓) chuyển khu, Enter vào khu
  function key(e) {
    if (moving) return false;
    const n = o.worlds.length;
    if (['ArrowRight', 'ArrowUp', 'KeyD', 'KeyW'].includes(e.code)) { if (at + 1 < n) pick(at + 1); return true; }
    if (['ArrowLeft', 'ArrowDown', 'KeyA', 'KeyS'].includes(e.code)) { if (at > 0) pick(at - 1); return true; }
    if (e.code === 'Enter' || e.code === 'NumpadEnter') { enter(); return true; }
    return false;
  }

  // xoay màn hình / đổi cỡ: dựng lại theo bố cục ngang hoặc dọc
  function resize() {
    if (!L || moving) return;
    const box = svg.getBoundingClientRect(); if (!box.width) return;
    if (`${Math.round(box.width)}x${Math.round(box.height)}` !== lastKey) build();
  }

  return { open, key, resize };
}
