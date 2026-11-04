// ── Little World: ba thú cưng đồng hành (Cáo, Thỏ, Gấu) ──
// Khung 80×80 đơn vị (xuất @2x = 160 px), đế chân ở y = 73.6 (origin [0.5, 0.92]).
// Dáng "thú bông chibi": đầu to, thân tròn, chân ngắn; quay được mọi góc (yaw) nhờ phép chiếu giả 3D.
import { PAL, smoothPath, r2, ramp, mix, puffPath } from './style.mjs';
import { rad, lerp, clamp, TAU, v3, limbDir, projector, limbPath, ellipsePath, circlePath, curve, path, line, heartPath, eye, mouth, blush } from './characters-rig.mjs';

export const PET = { W: 80, H: 80, CX: 40, GY: 73.6 };
const { CX, GY } = PET;
const KH = 0.1;

export const SPECIES = {
  fox: {
    name: 'Cáo Cam', personality: 'Tò mò, lanh lợi và thích phiêu lưu. Luôn chạy trước dẫn đường, đánh hơi mọi bí mật quanh đảo.',
    body: PAL.orange, belly: PAL.cream, feet: '#e0804e', line: '#b15b3c', glow: '#f3a453', earInner: '#ffe2c4', earTip: '#a8614a',
    head: { Y: 32, rx: 15.6, ry: 13.2 }, bodyR: [10.6, 9.8, 9.4], bodyY: 13.8,
    ears: { phi: 40, lat: 46, len: 12.6, w: 10.5, tilt: 24, kind: 'pointy' },
    eye: { phi: 30, lat: -10, rx: 3.1, ry: 4.0 },
    muzzle: { y: -5.4, z: 0.6, r: [6.0, 4.3, 5.4], color: PAL.cream, soft: true },
    cheeks: true, tail: 'fox', scarf: '#6fc7b0',
  },
  bunny: {
    name: 'Thỏ Bông', personality: 'Hiền lành, thân thiện và tinh nghịch. Thích nhảy lò cò, an ủi bạn khi buồn và reo vui khi bạn làm được.',
    body: '#fbf1f6', belly: '#ffffff', feet: '#fbe3ee', glow: '#ea8db5', earInner: PAL.pink,
    line: '#b394bd',
    head: { Y: 31.5, rx: 15, ry: 13.6 }, bodyR: [11.2, 10.4, 10.2], bodyY: 14,
    ears: { phi: 26, lat: 60, len: 18.4, w: 7.8, tilt: 12, kind: 'long' },
    eye: { phi: 30, lat: -10, rx: 3.0, ry: 3.9 },
    muzzle: null, tail: 'cotton', bow: PAL.lavender,
  },
  bear: {
    name: 'Gấu Mật', personality: 'Điềm tĩnh, chu đáo và che chở. Thích chăm cây, ôm bạn thật chặt và luôn nhắc bạn nghỉ ngơi.',
    body: '#d99a5b', belly: PAL.sand, feet: '#c98a50', line: '#8e5a3c', glow: '#e9a65a', earInner: PAL.sand,
    head: { Y: 31, rx: 16.2, ry: 13.8 }, bodyR: [12.6, 10.8, 11], bodyY: 14.2,
    ears: { phi: 50, lat: 48, r: 5.3, kind: 'round' },
    eye: { phi: 28, lat: -6, rx: 2.6, ry: 3.3 },
    muzzle: { y: -5.6, z: 0.6, r: [6.8, 5.0, 4.6], color: PAL.sand },
    tail: 'stub', heart: PAL.coral, leaf: true,
  },
};

function mats(doc, sp) {
  doc._pm = doc._pm || {};
  const key = sp.body;
  if (doc._pm[key]) return doc._pm[key];
  const L = sp.line || mix(ramp(sp.body).line, PAL.ink, 0.42);
  return (doc._pm[key] = {
    L,
    body: doc.sphere(sp.body, 1.15),
    belly: doc.sphere(sp.belly, 0.6),
    feet: doc.sphere(sp.feet, 1),
    muzzle: sp.muzzle ? doc.sphere(sp.muzzle.color, 0.6) : null,
    inner: doc.vgrad(sp.earInner, 0.6),
  });
}

/** Dựng hình một khung. pose: { yaw, bob, jump, squash, lean, drop, tilt, earL, earR, tail, armL, armR, footL, footR, face } */
export function petFrameSVG(doc, kind, pose = {}) {
  const sp = SPECIES[kind];
  const M = mats(doc, sp);
  const L = M.L, lwB = 2.2, lwS = 1.7;
  const yaw = pose.yaw || 0;
  const fyaw = yaw - 18 * Math.sin(rad(yaw)); // mặt "nhìn" gần người xem hơn khi nghiêng
  const P = projector(CX, GY, yaw, 0.12);
  const jump = pose.jump || 0, bob = pose.bob || 0;
  const W = (p) => P([p[0], p[1] + jump, p[2]]);
  const Wb = (p) => P([p[0], p[1] + jump + bob, p[2]]);
  const fc = Math.cos(rad(yaw)), fs = Math.sin(rad(yaw));
  const face = { eyes: 'open', look: [0, 0], mouth: kind === 'bear' ? 'smile' : 'cat', ...(pose.face || {}) };

  const back = [], mid = [], front = [];
  let s = '';
  // bóng
  const jr = clamp(1 - jump * 0.05, 0.6, 1);
  s += `<ellipse cx="${CX + 0.8}" cy="${GY - 0.6}" rx="${r2(13.5 * jr)}" ry="${r2(2.7 * jr)}" fill="rgba(110,90,150,0.30)"/>`;

  // ── chân ──
  const feetSvg = { before: '', after: '' };
  for (const [k, side] of [['L', 1], ['R', -1]]) {
    const f = { z: 0, lift: 0, ...(pose['foot' + k] || {}) };
    const c = W([side * 5.2, 2.6 + f.lift, 1.8 + f.z]);
    const rx = Math.hypot(3.9 * fc, 4.8 * fs), ry = 2.8;
    const rot = clamp(f.lift * 4, 0, 20) * fs * (f.z < 0 ? 1 : -1);
    let fs2 = path(ellipsePath(c[0], c[1], rx, ry, rot), M.feet, L, lwS);
    if (fc > 0.3) for (const dx of [-1.3, 1.3]) fs2 += line(`M${r2(c[0] + dx * fc)},${r2(c[1] + 0.4)} l0,-1.4`, L, 1, 'opacity="0.55"');
    else if (fc < -0.3) fs2 += `<ellipse cx="${r2(c[0])}" cy="${r2(c[1] + 0.3)}" rx="${r2(rx * 0.5)}" ry="1.2" fill="${PAL.pink}" opacity="0.8"/>`;
    feetSvg[c[2] > -1.5 ? 'after' : 'before'] += fs2;
  }

  // ── thân ──
  const [bax, bay, baz] = sp.bodyR;
  const bc = Wb([0, sp.bodyY, 0]);
  const brx = Math.hypot(bax * fc, baz * fs);
  const sq = pose.squash || [1, 1];
  let bodySvg = path(ellipsePath(bc[0], bc[1], brx, bay), M.body, L, lwB);
  if (fc > -0.15) {
    const bl = Wb([0, sp.bodyY - 1.4, baz * 0.6]);
    const bw = Math.hypot(bax * 0.62 * fc, baz * 0.45 * fs);
    const bcid = doc.clip(`<path d="${ellipsePath(bc[0], bc[1], brx - 0.6, bay - 0.6)}"/>`);
    bodySvg += `<g clip-path="${bcid}">${path(ellipsePath(bl[0], bl[1], bw, bay * 0.68), M.belly, 'none', 0)}</g>`;
    if (sp.heart && fc > 0.35) {
      const hp = Wb([0, sp.bodyY + 1, baz]);
      bodySvg += `<g transform="translate(${r2(hp[0])} ${r2(hp[1])}) scale(${r2(0.45 + 0.55 * fc)} 1) rotate(-8)"><path d="${heartPath(0, 0, 3.4)}" fill="${sp.heart}" stroke="#d4687a" stroke-width="1.1" stroke-linejoin="round"/><path d="${heartPath(0, 0, 2.3)}" fill="none" stroke="#fff" stroke-width="0.7" stroke-dasharray="0.9 0.8" opacity="0.9"/></g>`;
    }
  }
  bodySvg += `<ellipse cx="${r2(bc[0] - brx * 0.38)}" cy="${r2(bc[1] - bay * 0.45)}" rx="${r2(brx * 0.28)}" ry="${r2(bay * 0.18)}" fill="#fff" opacity="0.4" transform="rotate(-25 ${r2(bc[0] - brx * 0.38)} ${r2(bc[1] - bay * 0.45)})"/>`;

  // ── tay ──
  const armSvg = { before: '', after: '', top: '' };
  for (const [k, side] of [['L', 1], ['R', -1]]) {
    const a = { out: 18, fwd: 12, len: 5.6, top: false, ...(pose['arm' + k] || {}) };
    const sh = [side * (bax - 2.6), sp.bodyY + 4.6, 2];
    const tip = v3.add(sh, v3.mul(limbDir(a.out, a.fwd, side), a.len));
    const p0 = Wb(sh), p1 = Wb(tip);
    const d = limbPath([[p0[0], p0[1]], [p1[0], p1[1]]], [3.0, 3.1], 4);
    const as = path(d, M.body, L, lwS) + `<ellipse cx="${r2(p1[0] - 0.8)}" cy="${r2(p1[1] - 0.6)}" rx="1.1" ry="0.8" fill="#fff" opacity="0.5"/>`;
    const where = a.top ? 'top' : p0[2] > -2.5 ? 'after' : 'before';
    armSvg[where] += as;
  }

  // ── đuôi ──
  let tailSvg = '', tailFront = false;
  {
    const sw = pose.tail || 0;
    if (sp.tail === 'fox') {
      const ctrl = [[1, 10, -7.5], [5 + sw, 13, -13.5], [10 + sw * 1.6, 20, -16], [12 + sw * 2.2, 27.5, -14], [11 + sw * 2.4, 31.5, -11]];
      const pts = ctrl.map(Wb);
      const radii = [3.0, 6.2, 7.6, 6.0, 2.6];
      const d = limbPath(pts.map((p) => [p[0], p[1]]), radii, 5);
      const tipPts = [[lerp(pts[2][0], pts[3][0], 0.55), lerp(pts[2][1], pts[3][1], 0.55)], [pts[3][0], pts[3][1]], [pts[4][0], pts[4][1]]];
      const cid = doc.clip(`<path d="${d}"/>`);
      tailSvg = path(d, M.body, L, lwB) + `<g clip-path="${cid}">${path(limbPath(tipPts, [7.4, 6.6, 3.4], 5), M.belly, 'none', 0)}</g>` + path(d, 'none', L, lwB)
        + line(curve([[pts[1][0] - 1, pts[1][1]], [pts[2][0] - 2.4, pts[2][1]], [lerp(pts[2][0], pts[3][0], 0.4) - 2.2, lerp(pts[2][1], pts[3][1], 0.4)]]), '#ffffff', 1.6, 'opacity="0.55"');
      tailFront = pts.reduce((m, p) => m + p[2], 0) / pts.length > 1;
    } else {
      const r = sp.tail === 'cotton' ? 4.6 : 3.3;
      const c = Wb([sw * 0.4, sp.bodyY - 4, -baz - (sp.tail === 'cotton' ? 0.6 : 0.2)]);
      tailSvg = sp.tail === 'cotton'
        ? path(puffPath(c[0], c[1], r, r * 0.95, 8, 0.12, 3), doc._cotton || (doc._cotton = doc.sphere('#ffffff', 0.5)), L, lwS)
        : path(circlePath(c[0], c[1], r), M.body, L, lwS);
      tailFront = c[2] > 0;
    }
  }

  // ── đầu ──
  const H = sp.head;
  const lean = pose.lean || 0, drop = pose.drop || 0;
  const hc = Wb([0, H.Y - drop, lean]);
  const hx = hc[0] + (pose.headX || 0), hy = hc[1];
  const tilt = pose.tilt || 0;
  const htf = tilt ? `rotate(${r2(tilt)} ${r2(hx)} ${r2(hy + H.ry * 0.8)})` : '';
  const hp = (phi, lat, off = 0) => {
    const fp = rad(phi + fyaw), La = rad(lat);
    const ax = H.rx + off, ay = H.ry + off;
    const d = Math.cos(La) * Math.cos(fp);
    return [hx + ax * Math.cos(La) * Math.sin(fp), hy - ay * Math.sin(La) + d * ax * KH, d];
  };
  // điểm cục bộ quanh tâm đầu (X, Y lên, Z trước) theo fyaw
  const hl = ([X, Y, Z]) => {
    const c = Math.cos(rad(fyaw)), s2 = Math.sin(rad(fyaw));
    const d = -X * s2 + Z * c;
    return [hx + X * c + Z * s2, hy - Y + d * KH, d];
  };

  // tai (luôn sau đầu)
  let earSvg = '', bowSvg = '';
  const E = sp.ears;
  for (const [k, side] of [['L', 1], ['R', -1]]) {
    const [ex, ey, ed] = hp(side * E.phi, E.lat, -1.2);
    const fp = rad(side * E.phi + fyaw);
    const facing = Math.cos(fp);
    const wsc = 0.42 + 0.58 * Math.abs(facing);
    const extra = (k === 'L' ? pose.earL : pose.earR) || 0;
    if (E.kind === 'round') {
      const r = E.r;
      const cx = ex + Math.sin(fp) * 1.2, cy = ey - 1.5;
      earSvg += path(ellipsePath(cx, cy, r * wsc + 0.8, r, 0), M.body, L, lwB);
      if (facing > 0.1) earSvg += path(ellipsePath(cx + Math.sin(fp) * 0.3, cy + 0.6, (r - 2.2) * wsc + 0.4, r - 2.3, 0), M.inner, 'none', 0);
      continue;
    }
    const tilt0 = E.tilt * Math.sin(fp) + extra;
    // đường tâm tai
    const n = 4, cl = [], radii = [];
    const flop = E.kind === 'long' && k === 'R' ? (pose.flop ?? 1) : 0;
    let ang = rad(tilt0), x = ex, y = ey;
    for (let i = 0; i <= n; i++) {
      cl.push([x, y]);
      const t = i / n;
      radii.push((E.kind === 'pointy' ? lerp(E.w, 0.9, Math.pow(t, 1.15)) : E.w * (0.72 + 0.5 * Math.sin(Math.PI * Math.min(1, t * 1.1)) - 0.35 * t)) * wsc / 2 + 0.3);
      const seg = E.len / n;
      if (flop && i >= 2) ang += rad(30) * flop * (Math.sign(Math.sin(fp)) || -1);
      x += Math.sin(ang) * seg; y -= Math.cos(ang) * seg;
    }
    const d = limbPath(cl, radii, 3);
    let es = path(d, M.body, L, lwB);
    if (facing > 0.12) {
      const inner = limbPath(cl.slice(0, n).map(([px, py], i) => [px, py + (i === 0 ? -1.4 : 0)]), radii.slice(0, n).map((r, i) => Math.max(0.5, r * (i === 0 ? 0.5 : E.kind === 'pointy' ? 0.62 : 0.52))), 3);
      es += path(inner, M.inner, 'none', 0);
    }
    if (E.kind === 'pointy') {
      const cid = doc.clip(`<path d="${d}"/>`);
      const tipC = cl[n], tp = cl[n - 1];
      es += `<g clip-path="${cid}"><path d="${limbPath([[lerp(tp[0], tipC[0], 0.15), lerp(tp[1], tipC[1], 0.15)], [tipC[0] + (tipC[0] - tp[0]) * 0.6, tipC[1] + (tipC[1] - tp[1]) * 0.6]], [radii[n - 1] * 2.2, radii[n - 1] * 2.2], 3)}" fill="${sp.earTip}"/></g>` + path(d, 'none', L, lwB);
    }
    earSvg += es;
    if (sp.bow && k === 'L') {
      const [bx, by] = [cl[0][0], cl[0][1] + 1.6];
      const b = sp.bow, bl = '#8f78c8';
      bowSvg = `<g transform="translate(${r2(bx)} ${r2(by)}) rotate(${r2(tilt0 - 10)}) scale(${r2(0.6 + 0.4 * Math.abs(facing))} 1)">`
        + path('M0,0 C-3,-4.2 -7,-2.6 -6,1 C-5.4,3.4 -2.4,2.6 0,0Z', b, bl, 1.2) + path('M0,0 C3,-4.2 7,-2.6 6,1 C5.4,3.4 2.4,2.6 0,0Z', b, bl, 1.2)
        + path('M-0.6,0.6 L-2.4,5 L-0.6,4.2Z M0.6,0.6 L2.4,5 L0.6,4.2Z', b, bl, 1) + `<circle r="1.6" fill="${PAL.lavenderLight}" stroke="${bl}" stroke-width="1"/></g>`;
    }
  }

  // khối đầu
  let headD;
  if (sp.cheeks) {
    const pts = [];
    for (let i = 0; i < 32; i++) {
      const t = (i / 32) * TAU, sn = Math.sin(t);
      let rr = 1;
      // túm lông má nhọn hai bên dưới
      const ad = (u) => { const x = Math.abs(((t - u) % TAU + TAU) % TAU); return Math.min(x, TAU - x); };
      if (ad(0.62) < 0.1 || ad(Math.PI - 0.62) < 0.1) rr = 1.14;
      pts.push([hx + H.rx * Math.cos(t) * rr * (sn > 0 ? 1.02 : 1), hy + H.ry * sn * (rr > 1 ? 1.05 : 1)]);
    }
    headD = smoothPath(pts, true, 0.85);
  } else {
    headD = ellipsePath(hx, hy, H.rx, H.ry);
  }
  let headSvg = path(headD, M.body, L, lwB);
  headSvg += `<ellipse cx="${r2(hx - H.rx * 0.42)}" cy="${r2(hy - H.ry * 0.52)}" rx="${r2(H.rx * 0.3)}" ry="${r2(H.ry * 0.17)}" fill="#fff" opacity="0.45" transform="rotate(-28 ${r2(hx - H.rx * 0.42)} ${r2(hy - H.ry * 0.52)})"/>`;

  // mặt (chỉ phần nhìn thấy)
  const feats = [];
  const vis = (d) => d > 0.08;
  if (sp.cheeks) {
    // mặt nạ kem của cáo: hai má + vùng dưới mắt
    for (const side of [1, -1]) {
      const [x, y, d] = hp(side * 30, -31, 0.2);
      if (d > -0.05) feats.push([d - 0.5, path(ellipsePath(x, y, 6.6 * (0.45 + 0.55 * Math.max(0, d)), 4.6, side * -16 * Math.max(0, d)), M.belly, 'none', 0)]);
    }
  }
  if (sp.leaf) {
    const [x, y] = hp(0, 90, -0.6);
    feats.push([-5, `<g transform="translate(${r2(x + 0.5)} ${r2(y + 1)}) rotate(${r2(12 + (pose.tail || 0) * 2)})">` + line('M0,0 Q-0.6,-3 0.6,-4.6', '#4f9e57', 1.3) + path('M0.6,-4.4 C3.6,-7 7.6,-6 8.4,-3.6 C5.6,-1.6 2.4,-2 0.6,-4.4Z', PAL.leaf, PAL.leafDark, 1.1) + line('M1.6,-4.2 Q4.4,-4.6 6.8,-3.8', PAL.leafDark, 0.7) + '</g>']);
  }
  let muzzleBehind = '';
  if (sp.muzzle) {
    const m = sp.muzzle;
    const mc = hl([0, m.y, H.ry * 0.86 + m.z]);
    const mrx = Math.hypot(m.r[0] * Math.cos(rad(fyaw)), m.r[2] * Math.sin(rad(fyaw)));
    const mz = path(ellipsePath(mc[0], mc[1], mrx, m.r[1]), M.muzzle, mix(m.color, L, m.soft ? 0.32 : 0.55), m.soft ? 1.2 : lwS);
    if (mc[2] > 2) {
      feats.push([0.5, mz]);
      const nz = hl([0, m.y + m.r[1] * 0.42, H.ry * 0.86 + m.z + m.r[2] * 0.85]);
      const nr = kind === 'bear' ? 2.3 : 1.8;
      feats.push([0.9, `<ellipse cx="${r2(nz[0])}" cy="${r2(nz[1])}" rx="${r2(nr * (0.55 + 0.45 * Math.cos(rad(fyaw))))}" ry="${r2(nr * 0.72)}" fill="${kind === 'bear' ? '#5b3d36' : PAL.ink}"/><ellipse cx="${r2(nz[0] - 0.6)}" cy="${r2(nz[1] - 0.5)}" rx="0.8" ry="0.45" fill="#fff" opacity="0.85"/>`]);
      const mo = hl([0, m.y - m.r[1] * 0.18, H.ry * 0.86 + m.z + m.r[2] * 0.95]);
      feats.push([0.95, line(`M${r2(nz[0])},${r2(nz[1] + nr * 0.6)} L${r2(mo[0])},${r2(mo[1] - 0.4)}`, PAL.ink, 1.2) + mouth({ x: mo[0], y: mo[1] - 0.6, kind: face.mouth, s: 0.72, lw: 1.5, sq: 0.5 + 0.5 * Math.max(0, Math.cos(rad(fyaw))) })]);
    } else if (mc[2] > -6) muzzleBehind = mz;
  } else {
    // thỏ: hai má phúng + mũi hồng
    const [nx, ny, nd] = hp(0, -14, 0.4);
    if (vis(nd)) {
      for (const side of [1, -1]) {
        const [x, y, d] = hp(side * 9, -24, 0.6);
        if (d > 0.1) feats.push([0.5, path(circlePath(x, y, 2.7 * (0.5 + 0.5 * d)), M.belly, 'none', 0)]);
      }
      const sqn = 0.5 + 0.5 * nd;
      feats.push([0.9, `<path d="M${r2(nx - 1.8 * sqn)},${r2(ny - 0.9)} Q${r2(nx)},${r2(ny - 1.6)} ${r2(nx + 1.8 * sqn)},${r2(ny - 0.9)} Q${r2(nx + 0.4)},${r2(ny + 1.4)} ${r2(nx)},${r2(ny + 1.4)} Q${r2(nx - 0.4)},${r2(ny + 1.4)} ${r2(nx - 1.8 * sqn)},${r2(ny - 0.9)}Z" fill="${PAL.rose}" stroke="#c76a8c" stroke-width="0.8"/>`]);
      const [mx, my] = hp(0, -22, 0.6);
      feats.push([0.95, mouth({ x: mx, y: my - 1.2, kind: face.mouth, s: 0.58, sq: sqn, lw: 1.5 })]);
    }
  }
  for (const side of [1, -1]) {
    const e = sp.eye;
    const [x, y, d] = hp(side * e.phi, e.lat);
    if (!vis(d)) continue;
    const sqe = 0.32 + 0.68 * Math.pow(d, 0.8);
    let st = face.eyes;
    if (st === 'wink') st = side === 1 ? 'happy' : 'open';
    feats.push([1, eye(doc, { x, y, rx: e.rx, ry: e.ry, sq: sqe, state: st, look: face.look, glow: sp.glow, lw: 1.8 })]);
    const [bx, by, bd] = hp(side * 46, -24);
    if (bd > 0.05) feats.push([0.7, blush(bx, by, 3 * (0.4 + 0.6 * bd), 1.9, 0.6)]);
    if (false) {
      // hàng mi nhỏ ở đuôi mắt
      const ox = x + side * e.rx * sqe * 0.9;
      feats.push([1.1, line(`M${r2(ox)},${r2(y - e.ry * 0.55)} l${r2(side * 1.6 * sqe)},${r2(-1.3)}`, PAL.ink, 1.2)]);
    }
  }
  feats.sort((a, b) => a[0] - b[0]);
  const featSvg = feats.map((f) => f[1]).join('');

  // khăn của cáo
  let scarfSvg = '', scarfTail = '';
  if (sp.scarf) {
    const col = sp.scarf, lc = ramp(col).line;
    const f = doc._scarf || (doc._scarf = doc.vgrad(col, 1));
    const c = Wb([0, H.Y - H.ry + 1.4, 0]);
    const w = Math.hypot(9.2 * fc, 8 * fs);
    const band = smoothPath([[c[0] - w - 0.6, c[1] - 1.6], [c[0], c[1] - 0.4 + fc * 0.8], [c[0] + w + 0.6, c[1] - 1.6], [c[0] + w + 0.2, c[1] + 2], [c[0], c[1] + 3.8 + fc * 0.8], [c[0] - w - 0.2, c[1] + 2]], true);
    scarfSvg = path(band, f, lc, lwS);
    const sw = pose.scarf || 0;
    const k0 = Wb([-6, H.Y - H.ry + 0.6, 6]), k1 = Wb([-9.5 - sw, H.Y - H.ry - 3.6, 5 - sw * 1.5]);
    const tail = path(limbPath([[k0[0], k0[1]], [k1[0], k1[1]]], [2, 2.5], 3), f, lc, lwS) + path(ellipsePath(k0[0], k0[1], 2.4, 2.1), f, lc, lwS * 0.9) + line(`M${r2(k1[0] - 1.6)},${r2(k1[1] + 1.8)} l0,1.4 M${r2(k1[0])},${r2(k1[1] + 2.4)} l0,1.4 M${r2(k1[0] + 1.6)},${r2(k1[1] + 1.8)} l0,1.4`, lc, 0.9);
    if (k0[2] > 0) scarfTail = tail; else scarfSvg = tail + scarfSvg;
  }

  // ── ghép theo thứ tự ──
  const headAll = `<g${htf ? ` transform="${htf}"` : ''}>${earSvg}${muzzleBehind}${headSvg}${featSvg}${bowSvg}</g>`;
  let body = '';
  if (!tailFront) body += tailSvg;
  body += armSvg.before + feetSvg.before + bodySvg + feetSvg.after + armSvg.after + scarfSvg + headAll + scarfTail + armSvg.top;
  if (tailFront) body += tailSvg;
  if (sq[0] !== 1 || sq[1] !== 1) body = `<g transform="translate(${CX} ${GY}) scale(${sq[0]} ${sq[1]}) translate(${-CX} ${-GY})">${body}</g>`;
  return s + body;
}

// ───────────── animation ─────────────
const S = Math.sin, C = Math.cos, pos = (v) => Math.max(0, v);
function idle(kind, yaw) {
  return (i, n) => {
    const t = (i / n) * TAU;
    return { yaw, bob: 0.6 * (0.5 - 0.5 * C(t)), tail: 1.4 * S(t), earL: i === 2 ? 7 : 0, scarf: 0.3 * S(t), face: { eyes: i === n - 1 ? 'blink' : 'open' } };
  };
}
function walk(kind, yaw) {
  return (i, n) => {
    const t = (i / n) * TAU;
    if (kind === 'bunny') {
      const h = Math.abs(S(t));
      return { yaw, jump: 2.5 * h, squash: h < 0.25 ? [1.06, 0.94] : [0.97, 1.03], footL: { z: 1.5 * C(t), lift: 0.8 * h }, footR: { z: 1.5 * C(t), lift: 0.8 * h }, earL: -6 * h, earR: -4 * h, flop: 1 - 0.3 * h, tail: 0.8 * S(t), armL: { fwd: 30 * h }, armR: { fwd: 30 * h }, face: { eyes: 'open' } };
    }
    const side = Math.abs(S(rad(yaw))) > 0.5;
    return {
      yaw, bob: 0.9 * Math.abs(S(t)) - 0.3,
      footL: { z: (side ? 3.6 : 2.4) * C(t), lift: 2.2 * pos(S(t)) }, footR: { z: -(side ? 3.6 : 2.4) * C(t), lift: 2.2 * pos(-S(t)) },
      armL: { fwd: -26 * C(t) }, armR: { fwd: 26 * C(t) },
      tilt: side ? 0 : 3 * S(t), tail: 2.6 * S(t), earL: 3 * S(t * 2), earR: -3 * S(t * 2), scarf: side ? 1.4 + 0.6 * S(t * 2) : 0.4 * S(t),
      face: { eyes: 'open' },
    };
  };
}
function happy(kind) {
  return (i, n) => {
    const t = (i / n) * TAU, h = Math.abs(S(t));
    return { jump: 2.6 * h, squash: h < 0.2 ? [1.06, 0.94] : [0.98, 1.02], tail: 6 * S(t * 2), tilt: i % 2 ? 6 : -6, earL: 6 * h, earR: -6 * h, armL: { out: 60 + 30 * h, fwd: 10 }, armR: { out: 60 + 30 * h, fwd: 10 }, face: { eyes: 'happy', mouth: 'catopen' } };
  };
}
function greet(kind) {
  return (i, n) => {
    const t = (i / n) * TAU;
    if (kind === 'bunny') return { tilt: 5 * S(t), earL: 16 * S(t * 2), earR: -16 * S(t * 2 + 0.6), flop: 0.6 + 0.4 * S(t), armL: { out: 120, fwd: 10, len: 5.2, top: true }, face: { eyes: i % 3 === 1 ? 'happy' : 'open', mouth: 'catopen' } };
    return { tilt: kind === 'bear' ? 4 + 2 * S(t) : -5 + 3 * S(t), armL: { out: 140 + 22 * S(t * 2), fwd: 6, len: 6, top: true }, tail: 3 * S(t), earL: 4 * S(t * 2), face: { eyes: i % 3 === 2 ? 'happy' : 'open', mouth: kind === 'bear' ? 'open' : 'catopen' } };
  };
}
function celebrate(kind) {
  return (i, n) => {
    const t = i / n;
    const jump = (kind === 'bunny' ? 3.6 : 4.6) * S(Math.PI * t);
    return { yaw: 360 * t, jump, squash: i === 0 ? [1.08, 0.92] : [0.97, 1.03], armL: { out: 125, fwd: 10 }, armR: { out: 125, fwd: 10 }, tail: 4, earL: -8, earR: 8, footL: { lift: jump > 1 ? 1.5 : 0 }, footR: { lift: jump > 1 ? 1.5 : 0 }, face: { eyes: i % 2 ? 'sparkle' : 'happy', mouth: 'catopen' } };
  };
}
function interact(kind) {
  const k = [0, 0.6, 1, 0.8, 1, 0.4];
  return (i) => {
    const a = k[i];
    if (kind === 'bear') {
      // vỗ nhẹ (pat) bằng chân trước
      return { yaw: 90, lean: 2 * a, drop: 0.8 * a, armR: { out: 20, fwd: [20, 80, 110, 60, 110, 40][i], len: 6.4 }, tilt: 0, face: { eyes: i === 3 ? 'happy' : 'open', look: [0.6, 0.6], mouth: 'smile' } };
    }
    if (kind === 'bunny') {
      // dụi má (nuzzle)
      return { yaw: 90, lean: 3 * a, drop: 1.8 * a, tilt: 8 * a, earL: -10 * a, earR: -6 * a, flop: 1 + 0.3 * a, armR: { fwd: 40 * a }, face: { eyes: a > 0.5 ? 'happy' : 'open', mouth: 'cat' } };
    }
    // cáo đánh hơi (sniff)
    return { yaw: 90, lean: 3.6 * a, drop: 3 * a, tilt: 6 * a + (i % 2 ? 2 : -1) * a, tail: 3 * S(i * 1.4), earL: 6 * a, earR: 6 * a, armL: { fwd: 20 }, armR: { fwd: 20 }, face: { eyes: i === 2 || i === 4 ? 'blink' : 'open', look: [1, 0.8], mouth: 'tiny' } };
  };
}

export function petAnims(kind) {
  return [
    ['idle-front', 4, 5, -1, idle(kind, 0)],
    ['idle-side', 4, 5, -1, idle(kind, 90)],
    ['idle-back', 2, 3, -1, idle(kind, 180)],
    ['walk-side', 8, 10, -1, walk(kind, 90)],
    ['walk-front', 6, 9, -1, walk(kind, 0)],
    ['walk-back', 6, 9, -1, walk(kind, 180)],
    ['happy', 6, 10, -1, happy(kind)],
    ['greet', 6, 8, 0, greet(kind)],
    ['celebrate', 8, 12, 0, celebrate(kind)],
    ['interact', 6, 8, 0, interact(kind)],
  ];
}
export function petFrames(kind) {
  const frames = [], anims = {};
  for (const [key, n, fps, repeat, fn] of petAnims(kind)) {
    anims[key] = { start: frames.length, count: n, frameRate: fps, repeat };
    for (let i = 0; i < n; i++) frames.push({ anim: key, i, pose: fn(i, n) });
  }
  return { frames, anims };
}
