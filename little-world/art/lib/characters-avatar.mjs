// ── Little World: bé (nhân vật chính) — rig tham số + các lớp tuỳ biến ──
// Khung 96×96 đơn vị (xuất @2x = 192 px), đế chân ở y = 88 (origin [0.5, 0.92]).
// Mọi lớp tô được (tóc, da, áo, quần, giày) vẽ bằng XÁM TRUNG TÍNH để Phaser setTint()
// nhân màu ra đúng sắc độ; lớp mặt và phụ kiện vẽ đủ màu.
import { PAL, smoothPath, r2, puffPath } from './style.mjs';
import {
  rad, lerp, clamp, v3, limbDir, projector, limbPath, ellipsePath, circlePath, curve,
  path, line, union, starPath, heartPath, eye, mouth, blush,
} from './characters-rig.mjs';

export const AV = { W: 96, H: 96, CX: 48, GY: 88 };
const { CX, GY } = AV;
const KB = 0.12;   // độ chếch thân
const KH = 0.1;    // độ chếch mặt/tóc

// Xám trung tính cho lớp tô màu (multiply)
export const GR = {
  hi: '#ffffff', base: '#f2f0f5', lo: '#dcd7e4', deep: '#c4bdd0', line: '#8f8a9c', seam: '#b9b2c6',
  hairBase: '#e9e5ef', hairLo: '#cbc4d6', hairLine: '#857f97',
};
const LW = { body: 2.3, limb: 1.9, hair: 2.2, detail: 1.25, face: 1.8 };

/** Gradient dùng chung (objectBoundingBox) — tạo một lần cho mỗi Doc. */
export function mats(doc) {
  if (doc._avm) return doc._avm;
  const sph = (a, b, c) => doc.radial([[0, a], [0.55, b], [1, c]], 0.36, 0.3, 0.78);
  const lin = (a, b, c) => doc.linear([[0, a], [0.5, b], [1, c]], 0.15, 0, 0.85, 1);
  return (doc._avm = {
    skinSph: sph('#ffffff', '#f4f1f6', '#d9d3e2'),
    skinV: lin('#ffffff', '#f2f0f5', '#dbd5e3'),
    cloth: lin('#ffffff', '#f1eef4', '#d2cbdc'),
    clothSph: sph('#ffffff', '#f1eef4', '#d0c9da'),
    clothDark: lin('#e6e1ec', '#dad4e3', '#c3bccf'),
    hair: sph('#ffffff', '#ebe7f1', '#c6bed3'),
    hairDark: lin('#d7d1df', '#cbc4d6', '#b5adc4'),
    sole: lin('#ffffff', '#fbfafc', '#e4e0ea'),
  });
}

export const VIEW_YAW = { front: 0, threequarter: 32, side: 90, back: 180 };
const HEAD_YAW = { front: 0, threequarter: 36, side: 72, back: 180 };
const HEAD = { Y: 56, rx: 19, ry: 16.8 };
const KY = 0.92; // nén chiều cao thân cho dáng chibi mũm mĩm

// ───────────────────────── RIG ─────────────────────────
export function rig(view, pose = {}) {
  const yaw = VIEW_YAW[view] + (pose.yaw || 0);
  const hyaw = HEAD_YAW[view] + (pose.yaw || 0) + (pose.headYaw || 0);
  const P = projector(CX, GY, yaw, KB);
  const R = { view, pose, yaw, hyaw, P, face: { eyes: 'open', look: [0, 0], mouth: 'smile', brow: 0, ...(pose.face || {}) } };

  // chân (trước khi dời theo mặt đất)
  const legs = {};
  for (const [key, side] of [['L', 1], ['R', -1]]) {
    const lg = { fwd: 0, knee: 0, out: 0, ...(pose['leg' + key] || {}) };
    const hip = [side * 4.4, 21, 0];
    const knee = v3.add(hip, v3.mul(limbDir(lg.out, lg.fwd, side), 8.4));
    const ankle = v3.add(knee, v3.mul(limbDir(lg.out, lg.fwd - lg.knee, side), 8.2));
    legs[key] = { key, side, hip, knee, ankle, lg };
  }
  // dời cả người để bàn chân thấp nhất chạm đất, cộng thêm nhảy
  const minAnkle = Math.min(legs.L.ankle[1], legs.R.ankle[1]);
  const shift = -(minAnkle - 4.4) * (pose.ground ?? 1) + (pose.jump || 0);
  R.shift = shift;
  const bob = pose.bob || 0, lean = rad(pose.lean || 0), side2 = rad(pose.sway || 0);
  const G = ([x, y, z]) => [x, y * KY + shift, z];
  const U = ([x, y, z]) => {
    // nghiêng người quanh hông (0,21,0): lean = cúi về trước, sway = nghiêng ngang
    let dy = y - 21;
    let nz = z + dy * Math.sin(lean), ny = 21 + dy * Math.cos(lean);
    dy = ny - 21;
    const nx = x + dy * Math.sin(side2); ny = 21 + dy * Math.cos(side2);
    return [nx, ny * KY + bob + shift, nz];
  };
  R.G = G; R.U = U;
  R.PS = (p) => P(G(p));
  R.PU = (p) => P(U(p));

  for (const k of ['L', 'R']) {
    const L = legs[k];
    L.s = { hip: R.PS(L.hip), knee: R.PS(L.knee), ankle: R.PS(L.ankle) };
    L.d = L.s.hip[2];
    // bàn chân (tâm giày) hơi lệch về trước
    L.foot = R.PS(v3.add(L.ankle, [0, -0.8, 1.5]));
    L.shin = L.lg.fwd - L.lg.knee;
  }
  R.legs = legs;
  const ld = legs.L.d - legs.R.d;
  R.legOrder = Math.abs(ld) < 0.5 ? ['L', 'R'] : ld < 0 ? ['L', 'R'] : ['R', 'L']; // xa trước, gần sau

  // tay
  const arms = {};
  for (const [key, side] of [['L', 1], ['R', -1]]) {
    const a = { fwd: 0, out: 8, elbow: 0, eout: 0, ...(pose['arm' + key] || {}) };
    const sh = [side * 8.3, 38.2, 0];
    const el = v3.add(sh, v3.mul(limbDir(a.out, a.fwd, side), 7.2));
    const wr = v3.add(el, v3.mul(limbDir(a.out + a.eout, a.fwd + a.elbow, side), 6.4));
    const hd = v3.add(wr, v3.mul(limbDir(a.out + a.eout, a.fwd + a.elbow, side), 1.9));
    const s = { sh: R.PU(sh), el: R.PU(el), wr: R.PU(wr), hand: R.PU(hd), shIn: R.PU([side * 6.2, 38.6, 0]) };
    const front = a.z !== undefined ? a.z > 15 : s.sh[2] > -3;
    arms[key] = { key, side, a, s, z: a.z ?? (front ? 22 + (s.hand[2] > 0 ? 0.05 : 0) : 5), front };
  }
  R.arms = arms;

  // đầu
  const hc = R.PU([0, HEAD.Y / KY, 0.6]);
  R.hx = hc[0]; R.hy = hc[1] + (pose.nod || 0);
  R.head = { rx: HEAD.rx, ry: HEAD.ry };
  R.neck = [R.hx, R.hy + 14];
  R.htf = pose.tilt ? `rotate(${r2(pose.tilt)} ${r2(R.neck[0])} ${r2(R.neck[1])})` : '';
  R.facing = Math.cos(rad(yaw));

  // thân: các vòng (Y, nửa rộng X, nửa sâu Z, lệch Z)
  R.ring = (Y, wx, wz, zc = 0) => {
    const c = R.PU([0, Y, zc]);
    const hw = Math.hypot(wx * P.c, wz * P.s);
    return [c[0], c[1], hw];
  };
  R.torso = (opt = {}) => torsoPath(R, opt);
  return R;
}

const TORSO = [
  [42.2, 4.6, 4.2, 0], [40.6, 7.4, 6.0, 0], [38.7, 9.0, 7.0, 0], [35.2, 9.5, 7.6, 0.3],
  [30, 10.0, 8.0, 0.7], [25.5, 10.8, 8.4, 0.7], [22.3, 11.4, 8.5, 0.4], [21, 11.1, 8.2, 0.2],
];
function torsoPath(R, { grow = 0, hem = null, rings = null } = {}) {
  let rs = (rings || TORSO).map(([Y, wx, wz, zc]) => [Y, wx + grow, wz + grow * 0.8, zc]);
  if (hem) rs = rs.filter((r) => r[0] > hem[0][0]).concat(hem);
  const S = rs.map((r) => R.ring(...r));
  const bottomY = rs[rs.length - 1][0] - 0.9;
  const bc = R.PU([0, bottomY, rs[rs.length - 1][3]]);
  const tc = R.PU([0, rs[0][0] + 0.6, 0]);
  const pts = [[tc[0], tc[1]], ...S.map(([x, y, w]) => [x - w, y]), [bc[0], bc[1]], ...S.slice().reverse().map(([x, y, w]) => [x + w, y])];
  return smoothPath(pts, true);
}

// đường hoà tan giữa điểm 3D & bề mặt đầu
export function headPt(R, phi, lat, off = 0) {
  const fp = rad(phi + R.hyaw), L = rad(lat);
  const ax = R.head.rx + off, ay = R.head.ry + off;
  const d = Math.cos(L) * Math.cos(fp);
  return [R.hx + ax * Math.cos(L) * Math.sin(fp), R.hy - ay * Math.sin(L) + d * ax * KH, d];
}
const wrap = (a) => ((((a + 180) % 360) + 360) % 360) - 180;
/** Nội suy tuyến tính theo các mốc [[|φ|, lat], ...] */
const keyed = (keys) => (a) => {
  a = Math.abs(a);
  for (let i = 1; i < keys.length; i++) if (a <= keys[i][0]) {
    const t = (a - keys[i - 1][0]) / (keys[i][0] - keys[i - 1][0]);
    return lerp(keys[i - 1][1], keys[i][1], 0.5 - 0.5 * Math.cos(Math.PI * t));
  }
  return keys[keys.length - 1][1];
};
const spike = (phi, center, period, sharp = 3) => Math.pow(0.5 + 0.5 * Math.cos((2 * Math.PI * (phi - center)) / period), sharp);

// ───────────────────────── THÂN (da) ─────────────────────────
function headOutline(R) {
  const pts = [];
  for (let i = 0; i < 28; i++) {
    const t = (i / 28) * Math.PI * 2;
    const s = Math.sin(t);
    const bulge = s > 0 ? 1 + 0.035 * Math.pow(s, 2) : 1;
    pts.push([R.hx + R.head.rx * Math.cos(t) * bulge, R.hy + R.head.ry * s * (s > 0 ? 0.99 : 1)]);
  }
  return smoothPath(pts, true);
}

export function bodyParts(doc, R) {
  const M = mats(doc);
  const parts = [];
  // bóng đất
  const jr = clamp(1 - (R.pose.jump || 0) * 0.05, 0.6, 1);
  parts.push({ z: 0, ground: true, svg: `<ellipse cx="${CX + 1}" cy="${GY + 0.3}" rx="${r2(15 * jr)}" ry="${r2(3.6 * jr)}" fill="rgba(110,90,150,0.30)"/>` });
  // chân
  for (const k of ['L', 'R']) {
    const L = R.legs[k];
    const d = limbPath([L.s.hip, L.s.knee, L.s.ankle].map((p) => [p[0], p[1]]), [3.9, 3.6, 3.3]);
    parts.push({ z: 10 + L.d * 0.02, sil: d, svg: path(d, M.skinV, GR.line, LW.limb) });
  }
  // cổ
  const n1 = R.PU([0, 40, 0]), n2 = R.PU([0, 45.5, 0]);
  parts.push({ z: 19, svg: path(limbPath([[n1[0], n1[1]], [n2[0], n2[1]]], [3.6, 3.6]), M.skinV, GR.line, LW.limb) });
  // tay
  for (const k of ['L', 'R']) {
    const A = R.arms[k];
    const pts = [A.s.sh, A.s.el, A.s.wr].map((p) => [p[0], p[1]]);
    const d = limbPath(pts, [2.9, 2.7, 2.5]);
    parts.push({ z: A.z, sil: d, svg: path(d, M.skinV, GR.line, LW.limb) });
    const [hx, hy] = A.s.hand;
    const hd = circlePath(hx, hy, 3.7);
    // ngón cái nhỏ hướng về phía thân
    const tdir = Math.sign(CX - hx) || 1;
    const th = ellipsePath(hx + tdir * 2.6, hy - 1.1, 1.6, 1.3, 0);
    parts.push({ z: A.z + 0.2, sil: hd, svg: path(th, M.skinV, GR.line, LW.limb * 0.85) + path(hd, M.skinSph, GR.line, LW.limb) + `<ellipse cx="${r2(hx - 1.1)}" cy="${r2(hy - 1.2)}" rx="1.3" ry="0.9" fill="#fff" opacity="0.7"/>` });
  }
  // tai + đầu
  const tf = R.htf;
  for (const side of [1, -1]) {
    const [ex, ey, d] = headPt(R, side * 94, -4, 0);
    const c = d / Math.cos(rad(-4));
    if (c < -0.5) continue;
    if (c < 0.3) {
      const out = Math.sign(ex - R.hx) || side;
      const x = ex + out * 0.8;
      const ed = ellipsePath(x, ey, 3.3, 4.3, out * 8);
      parts.push({ z: 29.5, tf, sil: ed, svg: path(ed, M.skinSph, GR.line, LW.limb) + line(`M${r2(x - out * 0.4)},${r2(ey - 2)} q${r2(out * 1.6)},2 0,4`, GR.seam, 1.2) });
    } else {
      const sq = 0.45 + 0.55 * c;
      const ed = ellipsePath(ex, ey, 3.4 * sq + 0.6, 4.4, 0);
      parts.push({ z: 30.5, tf, sil: ed, svg: path(ed, M.skinSph, GR.line, LW.limb) + line(`M${r2(ex + 0.8)},${r2(ey - 2.2)} q${r2(-2 * sq)},2.2 0,4.4`, GR.seam, 1.2) });
    }
  }
  const hd = headOutline(R);
  parts.push({ z: 30, tf, sil: hd, svg: path(hd, M.skinSph, GR.line, LW.body) });
  return parts;
}

// ───────────────────────── MẶT (đủ màu) ─────────────────────────
export function faceParts(doc, R, variant = 'default') {
  if (R.facing < -0.2 && R.view === 'back') return [];
  const F = R.face;
  let s = '';
  const vis = (d) => d > 0.08;
  // má hồng
  for (const side of [1, -1]) {
    const [x, y, d] = headPt(R, side * 40, -27);
    if (!vis(d)) continue;
    const sq = 0.4 + 0.6 * d;
    s += blush(x, y, 3.4 * sq, 2.1, 0.62 * (F.blush ?? 1));
    if (variant === 'freckles') {
      for (const [dx, dy] of [[-1.6, -0.6], [0.2, -1.2], [1.7, -0.4], [-0.4, 0.7]]) s += `<circle cx="${r2(x + dx * sq)}" cy="${r2(y + dy - 0.3)}" r="0.55" fill="#b8745a" opacity="0.7"/>`;
    }
  }
  // mắt
  for (const side of [1, -1]) {
    const [x, y, d] = headPt(R, side * 26, -13);
    if (!vis(d)) continue;
    const sq = 0.32 + 0.68 * Math.pow(d, 0.8);
    let st = F.eyes;
    if (st === 'wink' ) st = side === 1 ? 'happy' : 'open';
    s += eye(doc, { x, y, rx: 3.25, ry: 4.3, sq, state: st, look: F.look, glow: '#9077cf', lw: 1.9 });
    // lông mày
    const [bx, by, bd] = headPt(R, side * 25, 10 + (F.brow || 0) + (side === -1 ? F.browR || 0 : F.browL || 0));
    if (vis(bd)) {
      const bw = 2.5 * sq;
      s += line(`M${r2(bx - bw)},${r2(by + 0.5)} Q${r2(bx)},${r2(by - 0.7)} ${r2(bx + bw)},${r2(by + 0.5)}`, '#7d6590', 1.3, 'opacity="0.85"');
    }
  }
  // mũi
  {
    const [x, y, d] = headPt(R, 0, -24);
    if (vis(d)) s += `<ellipse cx="${r2(x)}" cy="${r2(y)}" rx="${r2(0.9 * (0.5 + 0.5 * d))}" ry="0.6" fill="#c0806e" opacity="0.45"/>`;
  }
  // miệng
  {
    const [x, y, d] = headPt(R, R.hyaw > 50 && R.hyaw < 130 ? -9 : 0, -36);
    if (vis(d)) s += mouth({ x, y, kind: F.mouth, s: 0.95, sq: 0.45 + 0.55 * d });
  }
  return s ? [{ z: 31, tf: R.htf, svg: s }] : [];
}

// ───────────────────────── TÓC ─────────────────────────
function hairCap(R, st) {
  const pts = [];
  const N = 64;
  for (let i = 0; i <= N; i++) {
    const fp = -90 + (180 * i) / N;
    const phi = wrap(fp - R.hyaw);
    const [x, y] = headPt(R, phi, st.hairline(phi), st.lineOff ?? 0.6);
    pts.push([x, y]);
  }
  const latR = st.hairline(wrap(90 - R.hyaw)), latL = st.hairline(wrap(-90 - R.hyaw));
  const M = 30, n = st.bumps?.n || 6, amp = st.bumps?.amp || 0;
  const outer = [];
  for (let j = 1; j <= M; j++) outer.push([1, latR + ((90 - latR) * j) / M]);
  for (let j = M - 1; j >= 1; j--) outer.push([-1, latL + ((90 - latL) * j) / M]);
  outer.forEach(([sd, lat], idx) => {
    const u = idx / outer.length;
    const v = st.off + amp * Math.pow(Math.abs(Math.sin(Math.PI * n * u)), 0.6) * Math.min(1, (lat + 60) / 50);
    const L = rad(lat);
    pts.push([R.hx + sd * (R.head.rx + v) * Math.cos(L), R.hy - (R.head.ry + v) * Math.sin(L)]);
  });
  return smoothPath(pts, true);
}
function hairStrands(R, st, list) {
  let s = '';
  for (const phi of list) {
    const pts = [];
    let ok = true;
    const end = st.hairline(phi) + 5;
    for (let i = 0; i <= 6; i++) {
      const lat = lerp(70, end, i / 6);
      const [x, y, d] = headPt(R, phi, lat, st.off * 0.55);
      if (d < 0.12) { ok = false; break; }
      pts.push([x, y]);
    }
    if (ok && pts.length > 2) s += line(curve(pts), GR.hairLo, 1.1);
  }
  return s;
}
function hairShine(R, st) {
  const mk = (a, b, lat) => {
    const pts = [];
    for (let i = 0; i <= 6; i++) {
      const fp = rad(lerp(a, b, i / 6)), L = rad(lat);
      const ax = R.head.rx + st.off * 0.6, ay = R.head.ry + st.off * 0.6;
      const d = Math.cos(L) * Math.cos(fp);
      pts.push([R.hx + ax * Math.cos(L) * Math.sin(fp), R.hy - ay * Math.sin(L) + d * ax * KH]);
    }
    return curve(pts);
  };
  const lat = st.shineLat ?? 48;
  return line(mk(-60, -22, lat), '#ffffff', 2.4, 'opacity="0.85"') + line(mk(-14, -4, lat + 2), '#ffffff', 2.0, 'opacity="0.7"');
}

const HAIR = {
  short: {
    name: 'Tóc ngắn rối', off: 3.1, bumps: { n: 7, amp: 1.6 },
    hairline: (phi) => {
      const a = Math.abs(phi);
      let lat = keyed([[0, 31], [62, 28], [86, 19], [100, 9], [125, 1], [150, -11], [180, -18]])(phi);
      if (a < 76) lat -= 15 * spike(phi, -6, 24, 3) * (1 - Math.pow(a / 76, 4));
      if (a > 90 && a < 112) lat -= 7 * spike(a, 101, 22, 2);
      return lat;
    },
    strands: [-48, -18, 14, 44, 110, -110, 150, -150, 180],
    ahoge: true,
  },
  bob: {
    name: 'Tóc bob', off: 2.8, bumps: { n: 9, amp: 0.7 },
    hairline: (phi) => {
      const a = Math.abs(phi);
      let lat = keyed([[0, 31], [56, 27], [76, 10], [90, -26], [104, -42], [140, -44], [180, -42]])(phi);
      if (a < 64) lat -= 8 * spike(phi, 0, 17, 2) * (1 - Math.pow(a / 64, 4));
      return lat;
    },
    strands: [-50, -22, 8, 36, 120, -120, 160, -160],
    under: true,
  },
  ponytail: {
    name: 'Tóc buộc đuôi ngựa', off: 2.4, bumps: { n: 6, amp: 0.6 },
    hairline: (phi) => {
      const a = Math.abs(phi);
      let lat = keyed([[0, 30], [60, 25], [85, 13], [100, 7], [130, -6], [180, -22]])(phi);
      if (phi > -64 && phi < 66) lat -= 13 * spike(phi, 12, 30, 3) * (1 - Math.pow(Math.abs(phi - 1) / 66, 4));
      if (a > 92 && a < 112) lat -= 6 * spike(a, 102, 20, 2);
      return lat;
    },
    strands: [-40, -10, 30, 120, -120, 150, -150, 175],
    tail: true,
  },
  puffs: {
    name: 'Tóc hai búi xoăn', off: 2.9, bumps: { n: 13, amp: 1.5 },
    hairline: (phi) => {
      let lat = keyed([[0, 32], [70, 25], [95, 10], [130, -3], [180, -15]])(phi);
      lat -= 6 * spike(phi, 0, 14, 2);
      return lat;
    },
    strands: [],
    puffs: true,
  },
  long: {
    name: 'Tóc dài', off: 3.0, bumps: { n: 8, amp: 0.6 },
    hairline: (phi) => {
      const a = Math.abs(phi);
      let lat = keyed([[0, 40], [8, 30], [24, 19], [46, 22], [62, 18], [76, 2], [90, -34], [104, -50], [180, -54]])(phi);
      if (a > 10 && a < 64) lat -= 5 * spike(a, 34, 16, 2);
      return lat;
    },
    strands: [-30, -6, 6, 30, 60, -60, 120, -120, 160, -160],
    curtain: true,
  },
};
export const HAIRSTYLES = Object.keys(HAIR);
export const HAIR_NAMES = Object.fromEntries(Object.entries(HAIR).map(([k, v]) => [k, v.name]));

function ponytailPts(R, sway) {
  // gốc ở sau đỉnh đầu (toạ độ đầu: X, Y lên, Z trước)
  const hp = ([X, Y, Z]) => {
    const fp = rad(R.hyaw), c = Math.cos(fp), s = Math.sin(fp);
    const d = -X * s + Z * c;
    return [R.hx + X * c + Z * s, R.hy - Y + d * KH, d];
  };
  const ctrl = [[0, 9.5, -15], [0.6 + sway, 5, -20.5], [1.4 + sway * 2, -3, -22.5], [2 + sway * 3, -11, -21], [2.4 + sway * 3.6, -17.5, -18.5]];
  return ctrl.map(hp);
}

/** Trả về { front: parts[], back: parts[] } cho kiểu tóc */
export function hairParts(doc, R, style) {
  const st = HAIR[style];
  const M = mats(doc);
  const front = [], back = [];
  const tf = R.htf;
  const backView = R.view === 'back';
  const sway = R.pose.hairSway || 0;
  const cap = hairCap(R, st);
  let capSvg = path(cap, M.hair, GR.hairLine, LW.hair) + hairStrands(R, st, st.strands) + hairShine(R, st);

  if (st.ahoge) {
    const [tx, ty] = headPt(R, 0, 90, st.off - 0.5);
    const dir = backView ? -1 : 1;
    const bx = tx + dir * 1.2 + sway * 0.4;
    const d = `M${r2(bx - 2.2)},${r2(ty + 1.2)} Q${r2(bx - 1.4)},${r2(ty - 3.4)} ${r2(bx + dir * 4.0)},${r2(ty - 3.9)} Q${r2(bx + dir * 1.2)},${r2(ty - 2.2)} ${r2(bx + 2)},${r2(ty + 1.2)}Z`;
    capSvg = path(d, M.hair, GR.hairLine, LW.hair * 0.8) + capSvg;
  }
  if (st.under) {
    const u = ellipsePath(R.hx, R.hy + 2.5, R.head.rx + 3.4, R.head.ry + 3.4);
    back.push({ z: 1, tf, svg: path(u, M.hairDark, GR.hairLine, LW.hair) });
  }
  if (st.curtain) {
    // màn tóc sau lưng: quét vòng phía sau đầu
    const xs = [];
    for (let i = 0; i <= 12; i++) {
      const phi = lerp(96, 264, i / 12);
      xs.push(R.hx + (R.head.rx + st.off) * Math.sin(rad(phi + R.hyaw)));
    }
    const x0 = Math.min(...xs), x1 = Math.max(...xs);
    const yTop = R.hy - 2, yBot = R.PU([0, 30.5, 0])[1];
    const w = x1 - x0, n = Math.max(3, Math.round(w / 7));
    const pts = [[x0 + 1.5, yTop], [x0 - 0.8, lerp(yTop, yBot, 0.5)], [x0 - 1.6 - sway * 0.3, yBot - 2]];
    for (let i = 0; i <= n; i++) {
      const x = lerp(x0 - 1.2, x1 + 1.2, i / n) - sway * 0.4;
      pts.push([x, yBot + (i % 2 ? -2.6 : 0.8)]);
    }
    pts.push([x1 + 1.6 - sway * 0.3, yBot - 2], [x1 + 0.8, lerp(yTop, yBot, 0.5)], [x1 - 1.5, yTop]);
    const d = smoothPath(pts, true);
    const strand = (t) => line(curve([[lerp(x0, x1, t), yTop + 6], [lerp(x0, x1, t) - sway * 0.2, lerp(yTop, yBot, 0.6)], [lerp(x0, x1, t) - sway * 0.4, yBot - 3]]), GR.hairLo, 1.1);
    const svg = path(d, backView ? M.hair : M.hairDark, GR.hairLine, LW.hair) + (backView ? strand(0.3) + strand(0.55) + strand(0.78) : '');
    (backView ? front : back).push({ z: backView ? 34.8 : 1, tf, svg });
  }
  if (st.tail) {
    const pts = ponytailPts(R, sway);
    const d = limbPath(pts.map((p) => [p[0], p[1]]), [3.2, 5.2, 5.6, 4.2, 1.5], 4);
    const meanD = pts.reduce((a, p) => a + p[2], 0) / pts.length;
    const inFront = meanD > 2;
    let svg = path(d, M.hair, GR.hairLine, LW.hair)
      + line(curve(pts.slice(1, 4).map((p) => [p[0] + 0.8, p[1]])), GR.hairLo, 1.1)
      + line(curve(pts.slice(1, 3).map((p) => [p[0] - 1.4, p[1] - 0.4])), '#ffffff', 1.6, 'opacity="0.75"');
    const [bx, by] = pts[0];
    svg += path(ellipsePath(bx, by + 0.4, 3.4, 2.4, 0), GR.deep, GR.hairLine, 1.4) + `<ellipse cx="${r2(bx - 1)}" cy="${r2(by - 0.2)}" rx="1.2" ry="0.6" fill="#fff" opacity="0.8"/>`;
    (inFront ? front : back).push({ z: inFront ? 35.2 : 1, tf, svg });
  }
  if (st.puffs) {
    for (const side of [1, -1]) {
      const [x, y, d] = headPt(R, side * 72, 46, st.off + 2.6);
      const c = d / Math.cos(rad(46));
      const r = 7.0;
      const pd = puffPath(x, y, r, r * 0.95, 9, 0.12, side === 1 ? 7 : 11);
      let svg = path(pd, M.hair, GR.hairLine, LW.hair);
      svg += line(`M${r2(x - 2.6)},${r2(y + 0.6)} q1.4,-2.6 3,-0.6 q1,1.6 -0.8,2`, GR.hairLo, 1.1);
      svg += line(`M${r2(x + 1.4)},${r2(y - 3.6)} q1.8,0 2,1.8`, GR.hairLo, 1.1);
      svg += `<ellipse cx="${r2(x - 2.8)}" cy="${r2(y - 3.4)}" rx="2.2" ry="1.3" fill="#fff" opacity="0.8" transform="rotate(-30 ${r2(x - 2.8)} ${r2(y - 3.4)})"/>`;
      if (c < -0.45) back.push({ z: 1, tf, svg });
      else front.push({ z: c > 0.55 ? 35.1 : 34.9, tf, svg });
    }
  }
  front.push({ z: 35, tf, svg: capSvg });
  return { front, back };
}

// ───────────────────────── ÁO ─────────────────────────
function sleeve(R, A, len, r0, r1) {
  const sh = A.s.shIn, el = A.s.el, sp = A.s.sh;
  // điểm cuối tay áo trên đoạn vai→khuỷu (len ≤ 1) hoặc tới cổ tay (len > 1)
  let pts;
  if (len <= 1) pts = [[sh[0], sh[1]], [lerp(sp[0], el[0], len), lerp(sp[1], el[1], len)]];
  else pts = [[sh[0], sh[1]], [el[0], el[1]], [lerp(el[0], A.s.wr[0], len - 1), lerp(el[1], A.s.wr[1], len - 1)]];
  const radii = pts.length === 2 ? [r0, r1] : [r0, (r0 + r1) / 2 + 0.2, r1];
  return { d: limbPath(pts, radii), end: pts[pts.length - 1], prev: pts[pts.length - 2], r: r1 };
}
function cuffLine(s, color = GR.seam, w = 1.2, inset = 1.4) {
  const [ex, ey] = s.end, [px, py] = s.prev;
  const l = Math.hypot(ex - px, ey - py) || 1, tx = (ex - px) / l, ty = (ey - py) / l;
  const cx = ex - tx * inset, cy = ey - ty * inset, nx = -ty * s.r * 0.92, ny = tx * s.r * 0.92;
  return line(`M${r2(cx + nx)},${r2(cy + ny)} Q${r2(cx - tx * 0.6)},${r2(cy - ty * 0.6)} ${r2(cx - nx)},${r2(cy - ny)}`, color, w);
}
const frontVis = (R, Y = 32, Z = 7) => {
  const p = R.PU([0, Y, Z]);
  return { x: p[0], y: p[1], c: R.facing };
};

export const TOPS = {
  tshirt: { name: 'Áo phông ngôi sao' },
  hoodie: { name: 'Áo hoodie' },
  dress: { name: 'Áo váy bèo' },
  stripe: { name: 'Áo len kẻ sọc' },
};
export function topParts(doc, R, kind) {
  const M = mats(doc);
  const parts = [];
  const c = R.facing, sY = Math.sin(rad(R.yaw));
  let torso, extra = '';
  if (kind === 'dress') {
    torso = R.torso({ grow: 0.2, hem: [[25, 11.4, 7.8, 0.4], [20.5, 12.8, 8.6, 0.3], [16.5, 14.4, 9.6, 0.2], [15.2, 14.2, 9.4, 0.2]] });
  } else if (kind === 'hoodie') torso = R.torso({ grow: 0.7 });
  else torso = R.torso({ grow: 0.2 });

  // mũ hoodie phía sau cổ (vẽ trước thân để thân che chân mũ)
  if (kind === 'hoodie') {
    const hb = R.PU([0, 40.5, -4.5]);
    const w = Math.hypot(8.8 * R.P.c, 5 * sY);
    const hood = ellipsePath(hb[0], hb[1] - (R.view === 'back' ? 2.5 : 0.6), w, R.view === 'back' ? 6.8 : 4.6);
    parts.push({ z: 19.5, svg: path(hood, M.clothDark, GR.line, LW.body) });
  }
  let body = path(torso, M.cloth, GR.line, LW.body);
  const clipId = doc.clip(`<path d="${torso}"/>`);
  const inClip = (s) => `<g clip-path="${clipId}">${s}</g>`;

  // cổ áo
  if (c > 0.15) {
    const a = R.PU([-4.4, 41.4, 3.2]), m = R.PU([0, 38.6, 4.6]), b = R.PU([4.4, 41.4, 3.2]);
    if (kind === 'dress') {
      // cổ bèo tròn (Peter Pan)
      for (const [p1, p2] of [[a, m], [b, m]]) {
        const mx = (p1[0] + p2[0]) / 2, my = (p1[1] + p2[1]) / 2 + 1.4;
        extra += path(ellipsePath(mx, my, Math.max(1.6, Math.abs(p1[0] - p2[0]) * 0.62 + 0.6), 2.6, 0), '#ffffff', GR.line, 1.3);
      }
    } else {
      extra += line(`M${r2(a[0])},${r2(a[1])} Q${r2(m[0])},${r2(m[1] + 1.2)} ${r2(b[0])},${r2(b[1])}`, GR.seam, 1.6);
    }
  }
  if (kind === 'tshirt' && c > 0.3) {
    const p = R.PU([0, 31, 7.4]);
    const sq = 0.4 + 0.6 * c;
    extra += `<g transform="translate(${r2(p[0])} ${r2(p[1])}) scale(${r2(sq)} 1)"><path d="${starPath(0, 0, 3.6, 1.7)}" fill="#ffffff" stroke="${GR.seam}" stroke-width="1.1" stroke-linejoin="round"/></g>`;
  }
  if (kind === 'stripe') {
    let st = '';
    for (const Y of [36.2, 31.4, 26.6, 22]) {
      const p = R.PU([0, Y, 0]);
      st += `<rect x="${r2(p[0] - 20)}" y="${r2(p[1] - 1.3)}" width="40" height="2.6" fill="${GR.deep}" opacity="0.85"/>`;
    }
    extra += inClip(st);
  }
  if (kind === 'hoodie') {
    // gấu áo bo + túi + dây mũ
    const h1 = R.ring(22.6, 12.0, 8.1, 0.3), h2 = R.ring(20.4, 11.6, 7.8, 0.2);
    extra += inClip(`<rect x="${r2(h1[0] - 20)}" y="${r2(h1[1])}" width="40" height="8" fill="${GR.lo}"/>`) + line(`M${r2(h1[0] - h1[2] + 0.5)},${r2(h1[1])} L${r2(h1[0] + h1[2] - 0.5)},${r2(h1[1])}`, GR.seam, 1.2);
    if (c > 0.3) {
      const p = R.PU([0, 26.5, 7.8]);
      const sq = 0.4 + 0.6 * c, w = 6.2 * sq;
      extra += path(`M${r2(p[0] - w)},${r2(p[1] + 3)} L${r2(p[0] - w * 0.7)},${r2(p[1] - 2.6)} L${r2(p[0] + w * 0.7)},${r2(p[1] - 2.6)} L${r2(p[0] + w)},${r2(p[1] + 3)}Z`, GR.lo, GR.seam, 1.2);
      for (const sd of [-1, 1]) {
        const t = R.PU([sd * 2.2, 39.8, 5.2]);
        extra += line(`M${r2(t[0])},${r2(t[1])} l${r2(sd * 0.3)},5.4`, GR.line, 1.0) + `<circle cx="${r2(t[0] + sd * 0.3)}" cy="${r2(t[1] + 6)}" r="0.9" fill="#fff" stroke="${GR.line}" stroke-width="0.8"/>`;
      }
    }
  }
  if (kind === 'dress') {
    const w1 = R.ring(27.6, 10.4, 7.2, 0.4);
    extra += line(`M${r2(w1[0] - w1[2] + 0.4)},${r2(w1[1])} Q${r2(w1[0])},${r2(w1[1] + 1.2)} ${r2(w1[0] + w1[2] - 0.4)},${r2(w1[1])}`, GR.seam, 1.2);
    if (c > 0.3) {
      for (const Y of [35, 31.2]) { const p = R.PU([0, Y, 6.9]); extra += `<circle cx="${r2(p[0])}" cy="${r2(p[1])}" r="1.05" fill="#fff" stroke="${GR.line}" stroke-width="0.9"/>`; }
    }
    // nếp váy
    const hm = R.ring(16, 14.3, 9.5, 0.2);
    let pl = '';
    for (const t of [-0.55, 0, 0.55]) pl += line(`M${r2(hm[0] + t * hm[2] * 0.5)},${r2(hm[1] - 6.5)} L${r2(hm[0] + t * hm[2] * 0.85)},${r2(hm[1] + 0.4)}`, GR.seam, 1.1);
    extra += inClip(pl);
  }
  if (R.view === 'back' || c < -0.2) {
    // đường may sau lưng nhẹ
    const a = R.PU([0, 39, -6]), b = R.PU([0, 30, -7]);
    if (kind !== 'hoodie') extra += line(`M${r2(a[0])},${r2(a[1])} L${r2(b[0])},${r2(b[1])}`, GR.seam, 0.9, 'opacity="0.5"');
  }
  parts.push({ z: 20, svg: body + extra });

  // tay áo
  for (const k of ['L', 'R']) {
    const A = R.arms[k];
    let s;
    if (kind === 'tshirt') { const sl = sleeve(R, A, 0.66, 4.1, 3.8); s = path(sl.d, M.cloth, GR.line, LW.limb) + cuffLine(sl); }
    else if (kind === 'dress') { const sl = sleeve(R, A, 0.48, 4.7, 4.5); s = path(sl.d, M.clothSph, GR.line, LW.limb) + cuffLine(sl, GR.seam, 1.1, 1.0); }
    else {
      const sl = sleeve(R, A, 1.9, 4.0, 3.6);
      s = path(sl.d, M.cloth, GR.line, LW.limb) + cuffLine(sl, GR.seam, 1.2, 1.6);
      if (kind === 'stripe') {
        const cid = doc.clip(`<path d="${sl.d}"/>`);
        const e = A.s.el;
        s += `<g clip-path="${cid}"><circle cx="${r2(e[0])}" cy="${r2(e[1])}" r="2.2" fill="none" stroke="${GR.deep}" stroke-width="2.4" opacity="0.85"/></g>`;
      }
    }
    parts.push({ z: A.z + 0.1, svg: s });
  }
  return parts;
}

// ───────────────────────── QUẦN / VÁY ─────────────────────────
export const BOTTOMS = { shorts: { name: 'Quần soóc' }, skirt: { name: 'Chân váy xoè' }, pants: { name: 'Quần dài' } };
export function bottomParts(doc, R, kind) {
  const M = mats(doc);
  const parts = [];
  const hipRings = [[25.5, 10.4, 7.2, 0.4], [21.5, 10.9, 7.4, 0.3], [18.6, 10.6, 7.0, 0.2]];
  if (kind === 'skirt') {
    const sway = R.pose.skirtSway || 0;
    const rs = [[25.5, 10.4, 7.2, 0.4], [21, 12.2, 8.4, 0.4], [16.4, 14.6, 10, 0.4 + sway], [14.4, 15.3, 10.4, 0.4 + sway]];
    const d = R.torso({ rings: rs });
    const hm = R.ring(14.4, 15.3, 10.4, 0.4 + sway);
    const cid = doc.clip(`<path d="${d}"/>`);
    let pl = '';
    for (const t of [-0.66, -0.22, 0.22, 0.66]) pl += line(`M${r2(hm[0] + t * hm[2] * 0.55)},${r2(hm[1] - 9)} L${r2(hm[0] + t * hm[2] * 0.95)},${r2(hm[1] + 1)}`, GR.seam, 1.1);
    const band = R.ring(22.6, 11, 7.5, 0.4);
    parts.push({ z: 12, svg: path(d, M.cloth, GR.line, LW.body) + `<g clip-path="${cid}">${pl}<rect x="${r2(hm[0] - 20)}" y="${r2(hm[1] - 2)}" width="40" height="5" fill="${GR.lo}"/></g>` + line(`M${r2(hm[0] - hm[2] + 1)},${r2(hm[1] - 2)} Q${r2(hm[0])},${r2(hm[1] - 0.6)} ${r2(hm[0] + hm[2] - 1)},${r2(hm[1] - 2)}`, GR.seam, 1.1) });
    void band;
    return parts;
  }
  const hip = R.torso({ rings: hipRings });
  const legPieces = {};
  for (const k of ['L', 'R']) {
    const L = R.legs[k];
    let pts, radii;
    if (kind === 'pants') {
      const ank = L.s.ankle, kn = L.s.knee;
      const e = [lerp(kn[0], ank[0], 0.86), lerp(kn[1], ank[1], 0.86)];
      pts = [[L.s.hip[0], L.s.hip[1] - 1], [kn[0], kn[1]], e]; radii = [5.1, 4.6, 4.4];
    } else {
      const kn = L.s.knee, h = L.s.hip;
      pts = [[h[0], h[1] - 1], [lerp(h[0], kn[0], 0.78), lerp(h[1], kn[1], 0.78)]]; radii = [5.2, 5.0];
    }
    const d = limbPath(pts, radii);
    const end = pts[pts.length - 1], prev = pts[pts.length - 2];
    legPieces[k] = { d, end, prev, r: radii[radii.length - 1], z: 12 + L.d * 0.02 };
  }
  const [far, near] = R.legOrder;
  const sep = Math.abs(R.legs.L.d - R.legs.R.d) > 1.5;
  const cuff = (lp) => cuffLine({ end: lp.end, prev: lp.prev, r: lp.r }, GR.seam, 1.2, kind === 'pants' ? 1.6 : 1.3);
  if (sep) {
    parts.push({ z: 9.6, svg: union([legPieces[far].d], M.cloth, GR.line, LW.limb * 0.6) + cuff(legPieces[far]) });
    parts.push({ z: 12, svg: union([hip, legPieces[near].d], M.cloth, GR.line, LW.limb * 0.6) + cuff(legPieces[near]) });
  } else {
    let s = union([hip, legPieces.L.d, legPieces.R.d], M.cloth, GR.line, LW.limb * 0.6) + cuff(legPieces.L) + cuff(legPieces.R);
    if (R.facing > 0.3) { const a = R.PU([0, 22, 7.6]), b = R.PU([0, 17.5, 7.0]); s += line(`M${r2(a[0])},${r2(a[1])} L${r2(b[0])},${r2(b[1])}`, GR.seam, 1.0); }
    parts.push({ z: 12, svg: s });
  }
  return parts;
}

// ───────────────────────── GIÀY ─────────────────────────
export const SHOES = { sneakers: { name: 'Giày thể thao' }, boots: { name: 'Ủng đi mưa' }, maryjane: { name: 'Giày búp bê' } };
export function shoeParts(doc, R, kind) {
  const M = mats(doc);
  const parts = [];
  const c = Math.cos(rad(R.yaw)), s = Math.sin(rad(R.yaw));
  for (const k of ['L', 'R']) {
    const L = R.legs[k];
    const [fx, fy] = L.foot;
    const rx = Math.hypot(3.9 * c, 5.3 * s), ry = 3.3;
    const rot = clamp(-L.shin * 0.45, -30, 30) * s;
    const fwdx = s * 0.9;
    let svg = '';
    if (kind === 'boots') {
      const a = L.s.ankle, kn = L.s.knee;
      const top = [lerp(a[0], kn[0], 0.62), lerp(a[1], kn[1], 0.62)];
      const shaft = limbPath([[a[0], a[1] + 1], top], [4.2, 4.5]);
      svg += path(shaft, M.cloth, GR.line, LW.limb);
      svg += path(ellipsePath(top[0], top[1], 4.6, 1.6, rot * 0.3), M.clothDark, GR.line, 1.3);
    }
    const sole = ellipsePath(fx + fwdx * 0.3, fy + 0.9, rx + 0.4, ry * 0.7, rot);
    const upper = ellipsePath(fx, fy - 0.3, rx, ry * 0.94, rot);
    svg += path(sole, kind === 'sneakers' ? M.sole : M.clothDark, GR.line, LW.limb) + path(upper, M.clothSph, GR.line, LW.limb);
    if (kind === 'sneakers') {
      // dải đế trắng + dây giày
      svg += line(`M${r2(fx - rx + 0.8)},${r2(fy + 0.9)} Q${r2(fx)},${r2(fy + 1.8)} ${r2(fx + rx - 0.8)},${r2(fy + 0.9)}`, GR.seam, 1.0);
      if (R.view !== 'back') {
        const lx = fx + fwdx * 1.4;
        svg += line(`M${r2(lx - 1.6)},${r2(fy - 2.2)} L${r2(lx + 1.6)},${r2(fy - 1.4)} M${r2(lx - 1.6)},${r2(fy - 1.0)} L${r2(lx + 1.6)},${r2(fy - 2.4)}`, '#ffffff', 1.0);
      }
    } else if (kind === 'maryjane') {
      svg += line(`M${r2(fx - rx * 0.75)},${r2(fy - 1.8)} Q${r2(fx)},${r2(fy - 3.8)} ${r2(fx + rx * 0.75)},${r2(fy - 1.8)}`, GR.line, 1.3);
      if (R.view !== 'back') svg += `<circle cx="${r2(fx + (s > 0.5 ? -rx * 0.4 : rx * 0.55))}" cy="${r2(fy - 2.2)}" r="0.9" fill="#fff" stroke="${GR.line}" stroke-width="0.7"/>`;
    }
    svg += `<ellipse cx="${r2(fx - rx * 0.35)}" cy="${r2(fy - 1.4)}" rx="${r2(rx * 0.32)}" ry="0.9" fill="#fff" opacity="0.8"/>`;
    parts.push({ z: (k === R.legOrder[0] ? 9.5 : 11) + L.d * 0.01, svg });
  }
  return parts;
}

// ───────────────────────── PHỤ KIỆN (đủ màu) ─────────────────────────
export const ACCESSORIES = {
  cap: { name: 'Mũ lưỡi trai' },
  flower: { name: 'Kẹp hoa' },
  glasses: { name: 'Kính tròn' },
  backpack: { name: 'Ba lô nhỏ' },
  scarf: { name: 'Khăn quàng' },
};
export function accessoryParts(doc, R, kind) {
  const parts = [];
  const tf = R.htf;
  if (kind === 'cap') {
    const C = PAL.skyDeep, Cr = { hi: '#c9ecff', line: '#3f7fb8', lo: '#5aa6dc' };
    const fill = doc._capF || (doc._capF = doc.radial([[0, '#d6f1ff'], [0.5, C], [1, '#5c9fd8']], 0.36, 0.3, 0.8));
    const st = { off: 4.6, lineOff: 4.0, hairline: () => 33, bumps: { n: 1, amp: 0.8 } };
    const dome = hairCap(R, st);
    // lưỡi trai: nửa đĩa phía trước ở độ cao lat 20
    const Lr = rad(33), yb = (R.head.ry + 3.6) * Math.sin(Lr);
    const hp = (X, Z, k = 0.2) => {
      const fp = rad(R.hyaw), c = Math.cos(fp), s = Math.sin(fp);
      const d = -X * s + Z * c;
      return [R.hx + X * c + Z * s, R.hy - yb + d * k, d];
    };
    const zr = (R.head.rx + 3.8) * Math.cos(Lr);
    const outer = [], inner = [];
    for (let i = 0; i <= 10; i++) {
      const a = rad(lerp(-75, 75, i / 10));
      outer.push(hp(Math.sin(a) * zr * 0.9, Math.cos(a) * (zr + 6)));
      inner.push(hp(Math.sin(a) * zr * 0.9, Math.cos(a) * zr * 0.9));
    }
    const brimD = smoothPath([...outer, ...inner.reverse()].map((p) => [p[0], p[1]]), true);
    const brimFront = outer[5][2] > 0;
    const brim = path(brimD, '#5aa6dc', Cr.line, LW.hair) ;
    let domeSvg = path(dome, fill, Cr.line, LW.hair);
    // đường chia múi + nút + sao
    for (const phi of [-55, 0, 55, 180]) {
      const pts = [];
      let ok = true;
      for (let i = 0; i <= 5; i++) { const p = headPt(R, phi, lerp(86, 35, i / 5), 4.5); if (p[2] < 0.1) { ok = false; break; } pts.push([p[0], p[1]]); }
      if (ok) domeSvg += line(curve(pts), Cr.lo, 1.0);
    }
    const top = headPt(R, 0, 90, 4.4);
    domeSvg += `<ellipse cx="${r2(top[0])}" cy="${r2(top[1] + 0.3)}" rx="2.2" ry="1.4" fill="${PAL.yellow}" stroke="#c99a2e" stroke-width="1"/>`;
    const em = headPt(R, 0, 50, 4.4);
    if (em[2] > 0.25) domeSvg += `<g transform="translate(${r2(em[0])} ${r2(em[1])}) scale(${r2(0.4 + 0.6 * em[2])} 1)"><path d="${starPath(0, 0, 3.4, 1.6)}" fill="${PAL.yellow}" stroke="#d39a2a" stroke-width="1" stroke-linejoin="round"/></g>`;
    domeSvg += hairShine(R, { off: 4.4, shineLat: 52 });
    if (brimFront) parts.push({ z: 38, tf, svg: domeSvg + brim });
    else parts.push({ z: 38, tf, svg: brim + domeSvg });
  }
  if (kind === 'flower') {
    const [x, y, d] = headPt(R, -58, 34, 3.2);
    if (d > -0.25) {
      const sq = 0.55 + 0.45 * Math.max(0, d);
      let s = `<g transform="translate(${r2(x)} ${r2(y)}) scale(${r2(sq)} 1) rotate(-12)">`;
      s += path(`M2,2 Q8,1 9,6 Q4,7 2,2Z`, PAL.mint, '#4f9e7a', 1.1);
      for (let i = 0; i < 5; i++) {
        const a = i * 72 - 90;
        s += `<ellipse cx="${r2(Math.cos(rad(a)) * 3.2)}" cy="${r2(Math.sin(rad(a)) * 3.2)}" rx="3" ry="2.4" transform="rotate(${a} ${r2(Math.cos(rad(a)) * 3.2)} ${r2(Math.sin(rad(a)) * 3.2)})" fill="${PAL.pink}" stroke="${PAL.rose}" stroke-width="1.1"/>`;
      }
      s += `<circle r="2" fill="${PAL.yellow}" stroke="#d6a43a" stroke-width="1"/><circle cx="-0.6" cy="-0.6" r="0.7" fill="#fff"/></g>`;
      parts.push({ z: 37, tf, svg: s });
    }
  }
  if (kind === 'glasses') {
    const col = PAL.purple, lc = '#6c58a8';
    let s = '';
    const rims = [];
    for (const side of [1, -1]) {
      const [x, y, d] = headPt(R, side * 26, -13, 1.2);
      if (d < 0.1) continue;
      const sq = 0.32 + 0.68 * Math.pow(d, 0.8);
      rims.push([x, y, sq, side, d]);
    }
    for (const [x, y, sq] of rims) s += `<ellipse cx="${r2(x)}" cy="${r2(y)}" rx="${r2(5.2 * sq)}" ry="5" fill="#ffffff" fill-opacity="0.22" stroke="${col}" stroke-width="1.7"/><ellipse cx="${r2(x - 1.6 * sq)}" cy="${r2(y - 2)}" rx="${r2(1.2 * sq)}" ry="0.8" fill="#fff" opacity="0.8"/>`;
    if (rims.length === 2) {
      const [a, b] = rims[0][0] < rims[1][0] ? rims : [rims[1], rims[0]];
      s += line(`M${r2(a[0] + 5.2 * a[2])},${r2(a[1] - 0.6)} Q${r2((a[0] + b[0]) / 2)},${r2(a[1] - 2)} ${r2(b[0] - 5.2 * b[2])},${r2(b[1] - 0.6)}`, col, 1.5);
    }
    // gọng sang tai khi nhìn nghiêng
    if (rims.length === 1 || R.view === 'threequarter') {
      const r = rims.reduce((m, q) => (q[0] < m[0] ? q : m), rims[0]);
      const ear = headPt(R, -94, -2, 0.6);
      if (ear[2] > -0.3) s += line(`M${r2(r[0] - 5.2 * r[2])},${r2(r[1] - 1)} L${r2(ear[0] + 1)},${r2(ear[1] - 1.5)}`, col, 1.4);
    }
    if (s) parts.push({ z: 36.5, tf, svg: `<g>${s}</g>`, stroke: lc });
  }
  if (kind === 'scarf') {
    const col = PAL.coral, lc = '#c45a6a', st2 = PAL.cream;
    const f = doc._scarfF || (doc._scarfF = doc.linear([[0, '#ffb0ae'], [0.5, col], [1, '#ec7484']], 0.2, 0, 0.8, 1));
    const c = R.ring(41.4, 7.6, 6.2, 0.3);
    const band = smoothPath([[c[0] - c[2] - 0.8, c[1] - 1.6], [c[0], c[1] - 0.2 + R.facing * 0.6], [c[0] + c[2] + 0.8, c[1] - 1.6], [c[0] + c[2] + 0.4, c[1] + 2.2], [c[0], c[1] + 4.2 + R.facing * 0.8], [c[0] - c[2] - 0.4, c[1] + 2.2]], true);
    let s = path(band, f, lc, LW.limb);
    const cid = doc.clip(`<path d="${band}"/>`);
    s += `<g clip-path="${cid}">${[-5, 0, 5].map((dx) => `<rect x="${r2(c[0] + dx - 0.9)}" y="${r2(c[1] - 6)}" width="1.8" height="14" fill="${st2}" opacity="0.9" transform="rotate(20 ${r2(c[0] + dx)} ${r2(c[1])})"/>`).join('')}</g>`;
    // đuôi khăn (rủ phía trước, lệch sang trái màn hình)
    const tailSide = R.view === 'back' ? null : -1;
    if (tailSide && R.facing > -0.2) {
      const k0 = R.PU([-3.2, 40.6, 6.4]), k1 = R.PU([-4.6 - (R.pose.scarfSway || 0), 31.6, 7.6]);
      const t = limbPath([[k0[0], k0[1]], [k1[0], k1[1]]], [2.4, 2.8], 3);
      s += path(t, f, lc, LW.limb) + line(`M${r2(k1[0] - 2.4)},${r2(k1[1] + 1.2)} l0,1.6 M${r2(k1[0] - 0.8)},${r2(k1[1] + 2)} l0,1.6 M${r2(k1[0] + 0.8)},${r2(k1[1] + 2)} l0,1.6 M${r2(k1[0] + 2.4)},${r2(k1[1] + 1.2)} l0,1.6`, lc, 1.0);
      s += `<rect x="${r2(k1[0] - 3)}" y="${r2(k1[1] - 2.2)}" width="6" height="1.6" fill="${st2}" opacity="0.9" transform="rotate(${r2(Math.atan2(k1[0] - k0[0], k0[1] - k1[1]) * -57.3)} ${r2(k1[0])} ${r2(k1[1] - 1.4)})"/>`;
      s += path(ellipsePath(k0[0], k0[1], 2.8, 2.4, 0), f, lc, LW.limb * 0.9);
    } else if (R.view === 'back') {
      const k0 = R.PU([3, 40.6, -6]), k1 = R.PU([5.5 + (R.pose.scarfSway || 0), 32, -8]);
      s += path(limbPath([[k0[0], k0[1]], [k1[0], k1[1]]], [2.2, 2.6], 3), f, lc, LW.limb);
    }
    parts.push({ z: 25, svg: s });
  }
  if (kind === 'backpack') {
    const col = PAL.orange, lc = '#c46a34';
    const f = doc._bpF || (doc._bpF = doc.linear([[0, '#ffd0a0'], [0.5, col], [1, '#f28a4e']], 0.2, 0, 0.8, 1));
    const strap = (sd) => {
      const a = R.PU([sd * 5.6, 40.6, 2.6]), b = R.PU([sd * 7.6, 34, 6.6]), e = R.PU([sd * 7.8, 27.5, 7.0]);
      return path(limbPath([[a[0], a[1]], [b[0], b[1]], [e[0], e[1]]], [1.5, 1.5, 1.5], 3), f, lc, 1.3) + `<rect x="${r2(b[0] - 1.6)}" y="${r2(b[1] + 0.2)}" width="3.2" height="2" rx="0.6" fill="${PAL.yellow}" stroke="#c9962e" stroke-width="0.8"/>`;
    };
    if (R.view === 'back') {
      const c = R.PU([0, 31.4, -8.4]);
      const w = 8.4, h = 7.6;
      const body = `M${r2(c[0] - w)},${r2(c[1] - h + 3)} Q${r2(c[0] - w)},${r2(c[1] - h - 1.4)} ${r2(c[0])},${r2(c[1] - h - 1.6)} Q${r2(c[0] + w)},${r2(c[1] - h - 1.4)} ${r2(c[0] + w)},${r2(c[1] - h + 3)} L${r2(c[0] + w)},${r2(c[1] + h - 2.4)} Q${r2(c[0] + w)},${r2(c[1] + h)} ${r2(c[0] + w - 2.4)},${r2(c[1] + h)} L${r2(c[0] - w + 2.4)},${r2(c[1] + h)} Q${r2(c[0] - w)},${r2(c[1] + h)} ${r2(c[0] - w)},${r2(c[1] + h - 2.4)}Z`;
      let s = path(body, f, lc, LW.limb);
      s += path(`M${r2(c[0] - w + 0.4)},${r2(c[1] - h + 2)} Q${r2(c[0])},${r2(c[1] - h - 1.2)} ${r2(c[0] + w - 0.4)},${r2(c[1] - h + 2)} L${r2(c[0] + w - 0.8)},${r2(c[1] - 1.4)} Q${r2(c[0])},${r2(c[1] + 0.8)} ${r2(c[0] - w + 0.8)},${r2(c[1] - 1.4)}Z`, '#ffbe86', lc, 1.3);
      s += `<rect x="${r2(c[0] - 1.8)}" y="${r2(c[1] - 1.2)}" width="3.6" height="3" rx="0.8" fill="${PAL.yellow}" stroke="#c9962e" stroke-width="0.9"/>`;
      s += path(`M${r2(c[0] - 5)},${r2(c[1] + 2.4)} L${r2(c[0] + 5)},${r2(c[1] + 2.4)} L${r2(c[0] + 4.4)},${r2(c[1] + h - 1)} L${r2(c[0] - 4.4)},${r2(c[1] + h - 1)}Z`, '#ffbe86', lc, 1.1);
      s += `<ellipse cx="${r2(c[0] - w + 2.8)}" cy="${r2(c[1] - h + 2.4)}" rx="1.8" ry="1" fill="#fff" opacity="0.7"/>`;
      parts.push({ z: 24, svg: s });
    } else if (R.view === 'side' || R.view === 'threequarter') {
      const sY = Math.sin(rad(R.yaw));
      const c = R.PU([0, 31.4, -9.6]);
      const w = Math.hypot(8.2 * R.P.c, 5 * sY), h = 7.8;
      const body = `M${r2(c[0] - w)},${r2(c[1] - h + 2.6)} Q${r2(c[0] - w)},${r2(c[1] - h - 1)} ${r2(c[0])},${r2(c[1] - h - 1.2)} Q${r2(c[0] + w)},${r2(c[1] - h - 1)} ${r2(c[0] + w)},${r2(c[1] - h + 2.6)} L${r2(c[0] + w)},${r2(c[1] + h - 2.4)} Q${r2(c[0] + w)},${r2(c[1] + h)} ${r2(c[0] + w - 2.4)},${r2(c[1] + h)} L${r2(c[0] - w + 2.4)},${r2(c[1] + h)} Q${r2(c[0] - w)},${r2(c[1] + h)} ${r2(c[0] - w)},${r2(c[1] + h - 2.4)}Z`;
      let s = path(body, f, lc, LW.limb);
      s += path(`M${r2(c[0] - w + 0.6)},${r2(c[1] - h + 1.4)} Q${r2(c[0])},${r2(c[1] - h - 0.6)} ${r2(c[0] + w - 0.6)},${r2(c[1] - h + 1.4)} L${r2(c[0] + w - 0.6)},${r2(c[1] - 1.8)} L${r2(c[0] - w + 0.6)},${r2(c[1] - 1.8)}Z`, '#ffbe86', lc, 1.1);
      parts.push({ z: 15, svg: s });
      parts.push({ z: 24, svg: strap(-1) + (R.view === 'threequarter' ? strap(1) : '') });
    } else {
      // nhìn trước: hai quai + mép ba lô thò sau vai
      let s = '';
      for (const sd of [-1, 1]) {
        const p = R.PU([sd * 9.6, 38.6, -7]);
        s += path(ellipsePath(p[0] + sd * 0.6, p[1] - 0.4, 2.6, 3.2, sd * 20), f, lc, 1.3);
      }
      parts.push({ z: 15, svg: s });
      parts.push({ z: 24, svg: strap(-1) + strap(1) });
    }
  }
  return parts;
}

/** Silhouette "ảo" cho lớp áo (dùng để khoét phụ kiện nằm sau thân, vd. ba lô nhìn nghiêng). */
export function virtualHoles(R) {
  const holes = [{ z: 20, sil: R.torso({ grow: 0.2 }), w: 1.2 }];
  for (const k of ['L', 'R']) {
    const A = R.arms[k];
    const sl = sleeve(R, A, 0.5, 4.3, 4.0);
    holes.push({ z: A.z + 0.1, sil: sl.d, w: 1.2 });
  }
  return holes;
}
