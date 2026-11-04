// ── Little World: animation + ghép lớp cho bé ──
import { TAU, clamp, lerp, layerParts, tintFilter } from './characters-rig.mjs';
import { rig, bodyParts, faceParts, hairParts, topParts, bottomParts, shoeParts, accessoryParts, virtualHoles } from './characters-avatar.mjs';

const S = Math.sin, C = Math.cos;
const pos = (v) => Math.max(0, v);

// ───────────── tư thế ─────────────
function idlePose(i, n, view) {
  const t = (i / n) * TAU;
  return {
    bob: 0.55 * (0.5 - 0.5 * C(t)), hairSway: 0.5 * S(t + 0.6), scarfSway: 0.3 * S(t),
    armL: { out: 7 + 1.4 * (0.5 - 0.5 * C(t)), fwd: 3 }, armR: { out: 7 + 1.4 * (0.5 - 0.5 * C(t)), fwd: 3 },
    face: { eyes: i === n - 1 && view !== 'back' ? 'blink' : 'open', mouth: 'smile' },
  };
}
function walkPose(i, n, view, run = false) {
  const t = i / n, w = TAU * t;
  const A = run ? 34 : 25, K = run ? 72 : 42, AA = run ? 40 : 24;
  const leg = (ph) => {
    const a = TAU * ph;
    return { fwd: A * C(a), knee: K * pos(S(a - Math.PI)) + (run ? 16 : 6) * pos(S(a)) };
  };
  const side = view === 'side';
  return {
    legL: leg(t), legR: leg(t + 0.5),
    armL: { fwd: -AA * C(w), out: 8, elbow: run ? 70 : 14 }, armR: { fwd: AA * C(w), out: 8, elbow: run ? 70 : 14 },
    lean: run ? (side ? 10 : 6) : side ? 2 : 0,
    sway: side ? 0 : (run ? 2.4 : 1.6) * S(w),
    bob: run ? 0.6 * pos(C(2 * w)) : 0.3 * C(2 * w),
    jump: run ? 1.6 * pos(-C(2 * w)) : 0,
    tilt: side ? 0 : (run ? 2 : 1.4) * S(w),
    hairSway: (run ? -2.2 : -1.2) * (side ? 1 + 0.5 * C(2 * w) : S(w)),
    scarfSway: run ? 1.6 : 0.6 * S(w),
    skirtSway: side ? (run ? -1.4 : -0.6) : 0,
    face: { eyes: 'open', mouth: run ? 'open' : 'smile' },
  };
}
function happyPose(i, n) {
  const t = i / n, h = Math.abs(S(TAU * t));
  const land = h < 0.2;
  return {
    jump: 2.0 * h, ground: 1, squash: land ? [1.05, 0.95] : [0.99, 1.01],
    armL: { out: 32 + 22 * h, fwd: 10, elbow: 40 }, armR: { out: 32 + 22 * h, fwd: 10, elbow: 40 },
    legL: { fwd: 6 * h, knee: 14 * h }, legR: { fwd: 6 * h, knee: 14 * h },
    tilt: i % 2 ? 5 : -5, hairSway: i % 2 ? 1 : -1,
    face: { eyes: 'happy', mouth: 'open' },
  };
}
const CELEB = [
  { jump: 0, sq: [1.07, 0.92], up: 20, kn: 22, e: 'happy', m: 'open' },
  { jump: 1.6, sq: [0.985, 1.015], up: 120, kn: 18, e: 'sparkle', m: 'grin' },
  { jump: 2.3, sq: [0.99, 1.01], up: 152, kn: 30, e: 'sparkle', m: 'grin' },
  { jump: 2.6, sq: [1, 1], up: 160, kn: 34, e: 'happy', m: 'grin' },
  { jump: 2.0, sq: [1, 1], up: 156, kn: 26, e: 'happy', m: 'grin' },
  { jump: 1.0, sq: [0.99, 1.01], up: 140, kn: 12, e: 'sparkle', m: 'grin' },
  { jump: 0, sq: [1.08, 0.92], up: 100, kn: 20, e: 'happy', m: 'open' },
  { jump: 0, sq: [1.02, 0.98], up: 60, kn: 6, e: 'happy', m: 'open' },
];
function celebratePose(i) {
  const c = CELEB[i];
  const air = c.jump > 0.5;
  return {
    jump: c.jump, ground: air ? 0 : 1, squash: c.sq,
    armL: { out: Math.min(c.up, 100), fwd: 4, elbow: 0, eout: Math.max(0, c.up - 100) * 0.85 + (c.up > 120 ? 8 * S(i * 1.7) : 0), z: c.up > 90 ? 36 : undefined },
    armR: { out: Math.min(c.up, 100), fwd: 4, elbow: 0, eout: Math.max(0, c.up - 100) * 0.85 - (c.up > 120 ? 8 * S(i * 1.7) : 0), z: c.up > 90 ? 36 : undefined },
    legL: { fwd: air ? 10 : 4, knee: c.kn, out: air ? 6 : 0 }, legR: { fwd: air ? 10 : 4, knee: c.kn, out: air ? 6 : 0 },
    hairSway: air ? -1.2 : 0.8, scarfSway: air ? 1 : 0,
    face: { eyes: c.e, mouth: c.m },
    tilt: [0, -3, -4, 0, 4, 3, 0, 0][i],
  };
}
function thinkPose(i, n) {
  const k = [0.35, 0.8, 1, 1, 1, 0.9][i];
  return {
    tilt: 7 * k, bob: 0.3 * S((i / n) * TAU),
    armR: { fwd: 74 * k + 4, out: lerp(8, -12, k), elbow: 92 * k, eout: lerp(0, -8, k), z: k > 0.5 ? 36 : undefined },
    armL: { fwd: 8, out: 12, elbow: 20 },
    face: { eyes: i === 4 ? 'blink' : 'open', look: [-0.7 * k, -1.1 * k], mouth: k > 0.6 ? 'hmm' : 'tiny', browR: 3 * k, browL: 1 * k },
    hairSway: 0.4,
  };
}
function wavePose(i, n) {
  const t = (i / n) * TAU;
  return {
    armL: { out: 98, fwd: 6, eout: 46 + 22 * S(t), z: 36 },
    armR: { out: 9, fwd: 4 },
    tilt: 3 + 1.5 * S(t), sway: 1.2 * S(t), bob: 0.4 * (0.5 - 0.5 * C(2 * t)),
    hairSway: 0.6 * S(t),
    face: { eyes: i % 3 === 2 ? 'happy' : 'open', mouth: 'open' },
  };
}
const INTERACT = [
  { f: 20, e: 10, o: 8, lean: 0, look: [0.1, 0.4], m: 'smile' },
  { f: 55, e: 25, o: -6, lean: 3, look: [-0.2, 0.9], m: 'tiny' },
  { f: 70, e: 40, o: -16, lean: 5, look: [-0.3, 1], m: 'o' },
  { f: 58, e: 18, o: -16, lean: 6, look: [-0.3, 1], m: 'o' },
  { f: 70, e: 40, o: -16, lean: 5, look: [-0.3, 1], m: 'o' },
  { f: 40, e: 20, o: 0, lean: 2, look: [0, 0.4], m: 'open' },
];
function interactPose(i) {
  const c = INTERACT[i];
  return {
    lean: c.lean,
    armL: { fwd: c.f, out: c.o, elbow: c.e, z: c.f > 50 ? 23 : undefined },
    armR: { fwd: 6, out: 10, elbow: 10 },
    face: { eyes: 'open', look: c.look, mouth: c.m },
    tilt: -2 * (c.lean / 6), nod: c.lean * 0.12,
  };
}

// ───────────── danh sách animation ─────────────
export const AVATAR_ANIMS = [
  ['idle-down', 'front', 4, 5, -1, idlePose],
  ['idle-up', 'back', 4, 5, -1, idlePose],
  ['idle-side', 'side', 4, 5, -1, idlePose],
  ['idle-threequarter', 'threequarter', 4, 5, -1, idlePose],
  ['walk-down', 'front', 8, 10, -1, (i, n, v) => walkPose(i, n, v)],
  ['walk-up', 'back', 8, 10, -1, (i, n, v) => walkPose(i, n, v)],
  ['walk-side', 'side', 8, 10, -1, (i, n, v) => walkPose(i, n, v)],
  ['run-down', 'front', 6, 12, -1, (i, n, v) => walkPose(i, n, v, true)],
  ['run-up', 'back', 6, 12, -1, (i, n, v) => walkPose(i, n, v, true)],
  ['run-side', 'side', 6, 12, -1, (i, n, v) => walkPose(i, n, v, true)],
  ['happy', 'front', 6, 10, -1, happyPose],
  ['celebrate', 'front', 8, 12, 0, celebratePose],
  ['think', 'front', 6, 6, 0, thinkPose],
  ['wave', 'front', 6, 9, -1, wavePose],
  ['interact', 'front', 6, 9, 0, interactPose],
];

export function avatarFrames() {
  const frames = [], anims = {};
  for (const [key, view, n, fps, repeat, fn] of AVATAR_ANIMS) {
    anims[key] = { start: frames.length, count: n, frameRate: fps, repeat };
    for (let i = 0; i < n; i++) frames.push({ anim: key, view, i, pose: fn(i, n, view) });
  }
  return { frames, anims };
}

// ───────────── ghép lớp ─────────────
export const SLOTS = ['hairBack', 'body', 'face', 'bottom', 'top', 'shoes', 'hairFront', 'accessory'];

/** Các phần của một lớp ở một khung. variant: tên biến thể (hoặc null). */
export function slotParts(doc, R, slot, variant) {
  if (!variant) return [];
  switch (slot) {
    case 'hairBack': return hairParts(doc, R, variant).back;
    case 'hairFront': return hairParts(doc, R, variant).front;
    case 'body': return bodyParts(doc, R);
    case 'face': return faceParts(doc, R, variant);
    case 'top': return topParts(doc, R, variant);
    case 'bottom': return bottomParts(doc, R, variant);
    case 'shoes': return shoeParts(doc, R, variant);
    case 'accessory': return accessoryParts(doc, R, variant);
  }
  return [];
}

const rigCache = new Map();
export function frameRig(fr) {
  const k = fr.anim + ':' + fr.i;
  if (!rigCache.has(k)) rigCache.set(k, rig(fr.view, fr.pose));
  return rigCache.get(k);
}

/** SVG (nội dung khung, toạ độ 0..96) cho một lớp. */
export function slotFrameSVG(doc, fr, slot, variant) {
  const R = frameRig(fr);
  const parts = slotParts(doc, R, slot, variant);
  if (!parts.length) return '';
  const idx = SLOTS.indexOf(slot);
  let holes = [];
  if (idx > 1) {
    holes = bodyParts(doc, R).filter((p) => p.sil).map((p) => ({ z: p.z, sil: p.sil, tf: p.tf, w: 1.5 }));
    if (slot === 'accessory') holes = holes.concat(virtualHoles(R));
  }
  const ground = parts.filter((p) => p.ground), rest = parts.filter((p) => !p.ground);
  const sq = fr.pose.squash;
  const body = layerParts(doc, rest, holes);
  const tr = sq ? `translate(48 88) scale(${sq[0]} ${sq[1]}) translate(-48 -88)` : '';
  return ground.map((p) => p.svg).join('') + (tr ? `<g transform="${tr}">${body}</g>` : body);
}

/** Ghép mọi lớp của một diện mạo (đủ màu) cho một khung. look: { variants:{slot:variant}, colors:{slot:hex} } */
export function compositeFrameSVG(doc, fr, look, box) {
  let s = '';
  for (const slot of SLOTS) {
    const v = look.variants[slot];
    if (!v) continue;
    const inner = slotFrameSVG(doc, fr, slot, v);
    if (!inner) continue;
    const hex = look.colors[slot];
    s += hex ? `<g filter="${tintFilter(doc, hex, box)}">${inner}</g>` : inner;
  }
  return s;
}
