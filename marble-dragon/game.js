// Rồng Con Bắn Ngọc — game bắn ngọc 3D (Three.js)
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { createWorldMap } from './worldmap.js';

// ═════════════════════════ tiện ích ═════════════════════════
const TAU = Math.PI * 2;
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const $ = (id) => document.getElementById(id);
function rng(seed) {
  let a = seed >>> 0;
  return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const isTouch = matchMedia('(hover: none)').matches;

// ═════════════════════════ hằng số ═════════════════════════
const STEP = 0.05;          // bước lấy mẫu đường ray
const D = 0.9;              // đường kính viên ngọc
const R = D / 2;
const INS = 0.11;           // thời gian chèn ngọc vào chuỗi
const SHOT_SPEED = 26;
const SAVE_KEY = 'marble-dragon-save-v1';

const COLORS = [
  { css: '#e8141e', light: '#ff5a50', dark: '#8a0610', sym: 'circle', name: 'Đỏ' },
  { css: '#ffcc00', light: '#fff06a', dark: '#c78a00', sym: 'star', name: 'Vàng' },
  { css: '#17b52e', light: '#5fe86a', dark: '#0a6a18', sym: 'tri', name: 'Xanh lá' },
  { css: '#1450e6', light: '#4f8bff', dark: '#0a2a8a', sym: 'diamond', name: 'Xanh dương' },
  { css: '#ff2fb4', light: '#ff7fd6', dark: '#a0106c', sym: 'cross', name: 'Hồng' },
  { css: '#f4f4f4', light: '#ffffff', dark: '#b8b8c4', sym: 'square', name: 'Trắng', ink: true },
];

const POWERS = {
  bomb:    { emoji: '💣', name: 'Bom nổ!',          ring: '#ff7a2e' },
  freeze:  { emoji: '❄️', name: 'Đóng băng!',       ring: '#7fdcff' },
  reverse: { emoji: '⏪', name: 'Chạy lùi!',         ring: '#7cff9b' },
  bolt:    { emoji: '⚡', name: 'Tia sét!',          ring: '#fff06a' },
  rainbow: { emoji: '🌈', name: 'Ngọc cầu vồng!',    ring: '#ff7bd5' },
};

const WORLDS = [
  { name: 'Đồng Lúa Xanh',  emoji: '🌾', theme: 'rice',    desc: 'Ruộng bậc thang, đường ray cơ bản' },
  { name: 'Vịnh Đá Ngọc',   emoji: '🌊', theme: 'bay',     desc: 'Vịnh biếc, đường ray khó hơn' },
  { name: 'Núi Lửa Đỏ',     emoji: '🌋', theme: 'lava',    desc: 'Chuỗi ngọc lăn nhanh' },
  { name: 'Đỉnh Băng Giá',  emoji: '❄️', theme: 'ice',     desc: 'Ngọc bọc băng' },
  { name: 'Phố Đèn Lồng',   emoji: '🏮', theme: 'lantern', desc: 'Hai đường ray cùng lúc' },
];

const THEMES = {
  rice:    { bg: 0xa9dcff, fog: 0xc4e8ff, hemiS: 0xffffff, hemiG: 0x5d8a3a, hemiI: 0.75, sun: 0xfff0d0, sunI: 2.1, trackA: '#d8b479', trackB: '#9c7140', rail: 0x8a5a2b, ring: 0xffc83d, amb: 'firefly', exposure: 1.0 },
  bay:     { bg: 0x8fdde6, fog: 0xa8e8ee, hemiS: 0xffffff, hemiG: 0x2a8a8a, hemiI: 0.8,  sun: 0xffffff, sunI: 2.0, trackA: '#e9d9b4', trackB: '#b99c6a', rail: 0xc2a76b, ring: 0x4fe0d0, amb: 'sparkle', exposure: 1.0 },
  lava:    { bg: 0x2a0e10, fog: 0x3a1310, hemiS: 0xff9a6a, hemiG: 0x220808, hemiI: 0.55, sun: 0xffb27a, sunI: 1.6, trackA: '#5b4a48', trackB: '#2e2424', rail: 0x9a3b1a, ring: 0xff5a1f, amb: 'ember',   exposure: 1.05 },
  ice:     { bg: 0xd6efff, fog: 0xe4f5ff, hemiS: 0xffffff, hemiG: 0x8fb6d6, hemiI: 0.8,  sun: 0xffffff, sunI: 1.8, trackA: '#bfe4f5', trackB: '#7fb3cf', rail: 0x6c9fc7, ring: 0x7fdcff, amb: 'snow',    exposure: 0.95 },
  lantern: { bg: 0x121a3c, fog: 0x18204a, hemiS: 0x8a9cff, hemiG: 0x2a1a30, hemiI: 0.55, sun: 0xffc98a, sunI: 1.25, trackA: '#7a5a50', trackB: '#4a3430', rail: 0xc9302c, ring: 0xff5a5a, amb: 'lantern', exposure: 1.1 },
};

// ═════════════════════════ hình dạng đường ray (toạ độ chuẩn hoá −1..1) ═════════════════════════
function spiral(th0, turns, r0, r1, dir, opt = {}) {
  const pts = []; const N = Math.ceil(turns * 600);
  for (let i = 0; i <= N; i++) {
    const t = i / N, th = th0 + dir * t * turns * TAU;
    let r = r0 + (r1 - r0) * t;
    if (opt.lobes) r += opt.amp * Math.sin(opt.lobes * th);
    let c = Math.cos(th), s = Math.sin(th);
    if (opt.sq) { c = Math.sign(c) * Math.pow(Math.abs(c), opt.sq); s = Math.sign(s) * Math.pow(Math.abs(s), opt.sq); }
    pts.push([r * c, r * s]);
  }
  return pts;
}
function roundPoly(P, rad) {
  const out = [P[0]];
  for (let i = 1; i < P.length - 1; i++) {
    const [px, pz] = P[i], [ax, az] = P[i - 1], [bx, bz] = P[i + 1];
    const l1 = Math.hypot(ax - px, az - pz), l2 = Math.hypot(bx - px, bz - pz);
    const r = Math.min(rad, l1 * 0.5, l2 * 0.5);
    const p1 = [px + (ax - px) / l1 * r, pz + (az - pz) / l1 * r];
    const p2 = [px + (bx - px) / l2 * r, pz + (bz - pz) / l2 * r];
    for (let j = 0; j <= 16; j++) {
      const t = j / 16, u = 1 - t;
      out.push([u * u * p1[0] + 2 * u * t * px + t * t * p2[0], u * u * p1[1] + 2 * u * t * pz + t * t * p2[1]]);
    }
  }
  out.push(P[P.length - 1]);
  return out;
}
function wavesShape() {
  const pts = [];
  for (let x = -1.02; x <= 0.8; x += 0.004) pts.push([x, -0.62 + 0.15 * Math.sin((x - 0.8) * 2.5 * Math.PI)]);
  for (let a = -Math.PI / 2; a <= Math.PI / 2; a += 0.02) pts.push([0.8 + 0.18 * Math.cos(a), 0.62 * Math.sin(a)]);
  for (let x = 0.8; x >= -0.78; x -= 0.004) pts.push([x, 0.62 + 0.15 * Math.sin((x - 0.8) * 2.5 * Math.PI)]);
  return pts;
}
function doubleRing() {
  const pts = []; const R1 = 0.94, R2 = 0.56, th0 = -Math.PI / 2, sweep = 1.5 * Math.PI;
  for (let i = 0; i <= 700; i++) { const th = th0 + sweep * i / 700; pts.push([R1 * Math.cos(th), R1 * Math.sin(th)]); }
  const te = th0 + sweep, rc = (R1 + R2) / 2, rr = (R1 - R2) / 2;
  const ux = Math.cos(te), uz = Math.sin(te), tx = -Math.sin(te), tz = Math.cos(te);
  for (let i = 1; i <= 60; i++) {
    const ps = Math.PI * i / 60;
    pts.push([rc * ux + rr * (Math.cos(ps) * ux + Math.sin(ps) * tx), rc * uz + rr * (Math.cos(ps) * uz + Math.sin(ps) * tz)]);
  }
  for (let i = 1; i <= 700; i++) { const th = te - 1.4 * Math.PI * i / 700; pts.push([R2 * Math.cos(th), R2 * Math.sin(th)]); }
  return pts;
}

const SHAPES = [
  { name: 'Xoáy Ốc',    shooter: [0, 0],    gen: () => spiral(Math.PI, 1.6, 0.98, 0.40, 1) },
  { name: 'Rắn Lượn',   shooter: [0, 0.72], gen: () => roundPoly([[-1.04, -0.88], [0.86, -0.88], [0.86, -0.5], [-0.86, -0.5], [-0.86, -0.12], [0.86, -0.12], [0.86, 0.26], [-0.2, 0.26]], 0.19) },
  { name: 'Ô Vuông',    shooter: [0, 0],    gen: () => spiral(-Math.PI / 2, 1.35, 0.98, 0.46, 1, { sq: 0.5 }) },
  { name: 'Hoa Sen',    shooter: [0, 0],    gen: () => spiral(Math.PI / 2, 1.5, 0.9, 0.43, -1, { lobes: 5, amp: 0.06 }) },
  { name: 'Sóng Đôi',   shooter: [0, 0],    gen: wavesShape },
  { name: 'Vòng Kép',   shooter: [0, 0],    gen: doubleRing },
  { name: 'Xoáy Ngược', shooter: [0, 0],    gen: () => spiral(0, 1.5, 0.42, 0.98, -1) },
  { name: 'Zíc Zắc',    shooter: [0.7, 0],  gen: () => roundPoly([[-0.92, -1.04], [-0.92, 0.86], [-0.52, 0.86], [-0.52, -0.86], [-0.12, -0.86], [-0.12, 0.86], [0.28, 0.86], [0.28, -0.3]], 0.19) },
  { name: 'Ba Cánh',    shooter: [0, 0],    gen: () => spiral(0.3, 1.4, 0.86, 0.45, 1, { lobes: 3, amp: 0.1 }) },
  { name: 'Chữ U Lồng', shooter: [0, 0.25], gen: () => roundPoly([[-0.9, 1.04], [-0.9, -0.86], [0.9, -0.86], [0.9, 0.86], [0.55, 0.86], [0.55, -0.5], [-0.55, -0.5], [-0.55, 0.6]], 0.17) },
];

// hình cho màn hai đường ray: mỗi nửa sân một vòng xoáy ngắn
const DUAL_SHAPES = [
  { name: 'Xoáy Đôi',     gen: () => spiral(Math.PI, 1.1, 0.98, 0.5, 1) },
  { name: 'Ô Vuông Đôi',  gen: () => spiral(-Math.PI / 2, 1.05, 0.98, 0.5, 1, { sq: 0.5 }) },
  { name: 'Hoa Đôi',      gen: () => spiral(Math.PI / 2, 1.1, 0.92, 0.5, -1, { lobes: 4, amp: 0.05 }) },
  { name: 'Xoáy Ngược Đôi', gen: () => spiral(0, 1.05, 0.5, 0.98, -1) },
  { name: 'Ba Cánh Đôi',  gen: () => spiral(0.3, 1.0, 0.92, 0.5, 1, { lobes: 3, amp: 0.06 }) },
];
function levelDef(L) {
  const w = Math.floor(L / 10), k = L % 10;
  const orders = [
    [0, 2, 3, 1, 8, 5, 9, 7, 6, 4],
    [3, 0, 5, 1, 8, 9, 2, 7, 4, 6],
    [2, 8, 0, 9, 1, 6, 5, 3, 7, 4],
    [5, 3, 9, 0, 7, 1, 8, 2, 4, 6],
  ];
  const dualOrder = [0, 1, 2, 3, 4, 0, 2, 1, 4, 3];
  const dual = w === 4;
  const shape = dual ? dualOrder[k] : orders[w][k];
  const colors = [k >= 6 ? 5 : 4, 5, k >= 7 ? 6 : 5, k >= 6 ? 6 : 5, k >= 7 ? 6 : 5][w];
  const count = Math.round((38 + k * 4 + w * 7) * (dual ? 0.62 : 1));
  const speed = (0.95 + k * 0.045 + w * 0.08 + (w === 2 ? 0.4 : 0)) * (dual ? 0.9 : 1);
  const ice = w === 3 ? 0.1 + k * 0.012 : (w === 4 && k >= 5 ? 0.06 : 0);
  const powers = w === 0 ? ['bomb', 'freeze', 'rainbow'] : ['bomb', 'freeze', 'rainbow', 'bolt', 'reverse'];
  return { L, w, k, dual, shape, colors, count, speed, ice, powers, powerRate: 0.045, rushFrac: 0.28 };
}

// ═════════════════════════ lưu ═════════════════════════
const save = { stars: {}, best: {}, sound: true, music: true, seenHelp: false };
try { Object.assign(save, JSON.parse(localStorage.getItem(SAVE_KEY) || '{}')); } catch (e) {}
function persist() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(save)); } catch (e) {} }
const unlocked = (L) => L === 0 || (save.stars[L - 1] || 0) > 0;

// ═════════════════════════ âm thanh (Web Audio) ═════════════════════════
const SFX = (() => {
  let ctx = null, sfx = null, mus = null, noiseBuf = null;
  let musTimer = null, musNext = 0, musStep = 0, musCfg = null;
  function init() {
    if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return; }
    try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return; }
    const master = ctx.createGain(); master.gain.value = 0.8; master.connect(ctx.destination);
    sfx = ctx.createGain(); sfx.gain.value = 0.7; sfx.connect(master);
    mus = ctx.createGain(); mus.gain.value = 0.16; mus.connect(master);
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  function tone(f, dur, o = {}) {
    if (!ctx || (!o.music && !save.sound)) return;
    const t = (o.at ?? ctx.currentTime) + (o.delay || 0);
    const osc = ctx.createOscillator(), g = ctx.createGain();
    osc.type = o.type || 'sine'; osc.frequency.setValueAtTime(f, t);
    if (o.to) osc.frequency.exponentialRampToValueAtTime(o.to, t + dur);
    const v = o.vol ?? 0.25;
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + (o.attack || 0.006));
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(g); g.connect(o.music ? mus : sfx); osc.start(t); osc.stop(t + dur + 0.05);
  }
  function noise(dur, o = {}) {
    if (!ctx || !save.sound) return;
    const t = ctx.currentTime + (o.delay || 0);
    const src = ctx.createBufferSource(); src.buffer = noiseBuf;
    const f = ctx.createBiquadFilter(); f.type = o.type || 'bandpass'; f.frequency.setValueAtTime(o.freq || 2000, t); f.Q.value = o.q || 1;
    if (o.to) f.frequency.exponentialRampToValueAtTime(o.to, t + dur);
    const g = ctx.createGain(); g.gain.setValueAtTime(o.vol ?? 0.2, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f); f.connect(g); g.connect(sfx); src.start(t, Math.random() * 0.5); src.stop(t + dur + 0.05);
  }
  const PENTA = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21, 24];
  const MUSIC = {
    rice:    { root: 60, tempo: 100, scale: [0, 2, 4, 7, 9], seed: 11, wave: 'triangle' },
    bay:     { root: 65, tempo: 88,  scale: [0, 2, 4, 7, 9], seed: 23, wave: 'sine' },
    lava:    { root: 57, tempo: 124, scale: [0, 3, 5, 7, 10], seed: 37, wave: 'square' },
    ice:     { root: 62, tempo: 80,  scale: [0, 2, 4, 7, 9], seed: 41, wave: 'sine' },
    lantern: { root: 60, tempo: 92,  scale: [0, 2, 5, 7, 9], seed: 53, wave: 'triangle' },
  };
  function buildPattern(cfg) {
    const r = rng(cfg.seed); const mel = []; let idx = 5;
    for (let i = 0; i < 32; i++) {
      if (r() < (i % 2 ? 0.45 : 0.75)) { idx = clamp(idx + Math.floor(r() * 5) - 2, 0, 9); const oct = Math.floor(idx / 5); mel.push(cfg.scale[idx % 5] + 12 * oct); }
      else mel.push(null);
    }
    cfg.mel = mel; cfg.bass = [0, 0, cfg.scale[3], cfg.scale[3], cfg.scale[2] - 12 + 12, cfg.scale[2], cfg.scale[4] - 12, cfg.scale[3]];
  }
  const midi = (m) => 440 * Math.pow(2, (m - 69) / 12);
  function schedule() {
    if (!ctx || !musCfg) return;
    const stepDur = 60 / musCfg.tempo / 2;
    while (musNext < ctx.currentTime + 0.3) {
      const s = musStep % 32;
      const n = musCfg.mel[s];
      if (n != null) tone(midi(musCfg.root + n), stepDur * 1.8, { type: musCfg.wave, vol: musCfg.wave === 'square' ? 0.07 : 0.16, at: musNext, music: true, attack: 0.01 });
      if (s % 4 === 0) tone(midi(musCfg.root - 24 + musCfg.bass[(s / 4) | 0]), stepDur * 3.6, { type: 'sine', vol: 0.22, at: musNext, music: true, attack: 0.02 });
      if (s % 8 === 4) tone(midi(musCfg.root + 12 + musCfg.scale[(musStep / 8 | 0) % 5]), stepDur * 0.6, { type: 'sine', vol: 0.05, at: musNext, music: true });
      musNext += stepDur; musStep++;
    }
  }
  function startMusic(theme) {
    stopMusic(); if (!ctx || !save.music) return;
    musCfg = { ...MUSIC[theme] }; buildPattern(musCfg);
    musNext = ctx.currentTime + 0.15; musStep = 0;
    musTimer = setInterval(schedule, 70);
  }
  function stopMusic() { if (musTimer) clearInterval(musTimer); musTimer = null; musCfg = null; }
  return {
    init, startMusic, stopMusic,
    get ready() { return !!ctx; },
    shoot() { tone(760, 0.13, { type: 'triangle', vol: 0.16, to: 330 }); noise(0.05, { vol: 0.06, freq: 3500 }); },
    clack() { noise(0.045, { vol: 0.22, freq: 2600, q: 3 }); tone(1400, 0.04, { type: 'square', vol: 0.03 }); },
    swap() { tone(520, 0.07, { type: 'sine', vol: 0.12, to: 780 }); },
    pop(chain, cnt) {
      const base = 523 * Math.pow(2, PENTA[Math.min(chain * 2, 8)] / 12);
      tone(base, 0.22, { type: 'triangle', vol: 0.2 });
      tone(base * 1.5, 0.22, { type: 'sine', vol: 0.12, delay: 0.05 });
      if (cnt > 3) tone(base * 2, 0.25, { type: 'sine', vol: 0.1, delay: 0.1 });
      noise(0.12, { vol: 0.12, freq: 5000, type: 'highpass' });
    },
    chainUp(n) { for (let i = 0; i < 3; i++) tone(660 * Math.pow(2, (PENTA[Math.min(n + i, 10)]) / 12), 0.16, { type: 'triangle', vol: 0.13, delay: i * 0.06 }); },
    boom() { noise(0.6, { vol: 0.5, freq: 900, to: 80, type: 'lowpass' }); tone(110, 0.5, { type: 'sine', vol: 0.4, to: 40 }); },
    zap() { noise(0.35, { vol: 0.25, freq: 6000, to: 1500, q: 2 }); tone(1800, 0.3, { type: 'sawtooth', vol: 0.06, to: 200 }); },
    freeze() { for (let i = 0; i < 5; i++) tone(1500 + i * 300, 0.25, { type: 'sine', vol: 0.08, delay: i * 0.04 }); },
    reverse() { tone(800, 0.4, { type: 'triangle', vol: 0.15, to: 200 }); },
    magic() { for (let i = 0; i < 4; i++) tone(880 * Math.pow(2, i * 4 / 12), 0.2, { type: 'sine', vol: 0.1, delay: i * 0.05 }); },
    ice() { noise(0.15, { vol: 0.25, freq: 6000, q: 4 }); tone(2400, 0.12, { type: 'sine', vol: 0.06 }); },
    beat() { tone(70, 0.18, { type: 'sine', vol: 0.45, to: 45 }); tone(70, 0.14, { type: 'sine', vol: 0.3, to: 45, delay: 0.16 }); },
    rush() { tone(220, 0.6, { type: 'sawtooth', vol: 0.04, to: 440 }); },
    win() { [0, 4, 7, 12, 16, 19, 24].forEach((n, i) => tone(523 * Math.pow(2, n / 12), 0.35, { type: 'triangle', vol: 0.16, delay: i * 0.08 })); },
    lose() { [12, 7, 3, 0].forEach((n, i) => tone(392 * Math.pow(2, n / 12), 0.4, { type: 'triangle', vol: 0.16, delay: i * 0.18 })); },
    sink() { tone(300, 0.25, { type: 'sine', vol: 0.08, to: 90 }); },
    click() { tone(900, 0.05, { type: 'sine', vol: 0.08 }); },
    star(i) { tone(784 * Math.pow(2, i * 4 / 12), 0.3, { type: 'triangle', vol: 0.15 }); },
  };
})();

// ═════════════════════════ renderer & scene ═════════════════════════
const canvas = $('cv');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(renderer), 0.04).texture;

const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 300);
const hemi = new THREE.HemisphereLight(0xffffff, 0x445533, 0.7);
const sun = new THREE.DirectionalLight(0xffffff, 2);
sun.castShadow = true;
sun.shadow.mapSize.set(isTouch ? 1024 : 2048, isTouch ? 1024 : 2048);
sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.03;
scene.add(hemi, sun, sun.target);

const levelGroup = new THREE.Group(); scene.add(levelGroup);

// ═════════════════════════ texture & vật liệu ═════════════════════════
function canvasTex(w, h, draw, opts = {}) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  if (opts.srgb !== false) t.colorSpace = THREE.SRGBColorSpace;
  if (opts.repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; }
  t.anisotropy = 4;
  return t;
}
function drawSym(g, sym, cx, cy, r, ink = false) {
  g.save(); g.translate(cx, cy);
  g.fillStyle = ink ? '#2a2a3a' : 'rgba(255,255,255,.95)'; g.strokeStyle = ink ? 'rgba(255,255,255,.6)' : 'rgba(0,0,0,.45)'; g.lineWidth = 5; g.lineJoin = 'round';
  g.beginPath();
  if (sym === 'circle') g.arc(0, 0, r * 0.72, 0, TAU);
  else if (sym === 'star') { for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.45 : r; g.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); } g.closePath(); }
  else if (sym === 'tri') { for (let i = 0; i < 3; i++) { const a = -Math.PI / 2 + i * TAU / 3; g.lineTo(Math.cos(a) * r, Math.sin(a) * r + r * 0.15); } g.closePath(); }
  else if (sym === 'diamond') { g.moveTo(0, -r); g.lineTo(r * 0.7, 0); g.lineTo(0, r); g.lineTo(-r * 0.7, 0); g.closePath(); }
  else if (sym === 'cross') { const w = r * 0.34; g.moveTo(-w, -r); g.lineTo(w, -r); g.lineTo(w, -w); g.lineTo(r, -w); g.lineTo(r, w); g.lineTo(w, w); g.lineTo(w, r); g.lineTo(-w, r); g.lineTo(-w, w); g.lineTo(-r, w); g.lineTo(-r, -w); g.lineTo(-w, -w); g.closePath(); }
  else if (sym === 'square') { g.roundRect ? g.roundRect(-r * 0.68, -r * 0.68, r * 1.36, r * 1.36, 5) : g.rect(-r * 0.68, -r * 0.68, r * 1.36, r * 1.36); }
  g.stroke(); g.fill(); g.restore();
}
function ballTex(ci) {
  const col = COLORS[ci];
  return canvasTex(256, 128, (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, 0, h);
    gr.addColorStop(0, col.css); gr.addColorStop(0.75, col.css); gr.addColorStop(1, col.dark);
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
    drawSym(g, col.sym, 64, 64, 30, col.ink); drawSym(g, col.sym, 192, 64, 30, col.ink);
  });
}
const ballGeo = new THREE.SphereGeometry(R, 32, 20);
const ballMats = COLORS.map((c, i) => new THREE.MeshPhysicalMaterial({ map: ballTex(i), roughness: 0.35, metalness: 0, clearcoat: 0.6, clearcoatRoughness: 0.12, envMapIntensity: 0.35, emissive: c.css, emissiveIntensity: c.ink ? 0.05 : 0.12 }));
const rainbowMat = new THREE.MeshPhysicalMaterial({
  map: canvasTex(256, 128, (g, w, h) => { for (let i = 0; i < 12; i++) { g.fillStyle = `hsl(${i * 30},95%,60%)`; g.fillRect(i * w / 12, 0, w / 12 + 1, h); } }),
  roughness: 0.15, clearcoat: 1, clearcoatRoughness: 0.05, emissive: 0x332244, emissiveIntensity: 0.6,
});
const boltMat = new THREE.MeshPhysicalMaterial({ color: 0xbff6ff, emissive: 0x4fd8ff, emissiveIntensity: 1.6, roughness: 0.1, clearcoat: 1 });
const iceGeo = new THREE.IcosahedronGeometry(R * 1.2, 1);
const iceMat = new THREE.MeshPhysicalMaterial({ color: 0xdff7ff, roughness: 0.05, transparent: true, opacity: 0.55, flatShading: true, clearcoat: 1, depthWrite: false });
const dotTex = canvasTex(64, 64, (g) => { const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.35, 'rgba(255,255,255,.7)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); });
const powerMats = {};
for (const [k, p] of Object.entries(POWERS)) {
  powerMats[k] = new THREE.SpriteMaterial({
    map: canvasTex(128, 128, (g) => {
      g.fillStyle = 'rgba(255,255,255,.95)'; g.beginPath(); g.arc(64, 64, 52, 0, TAU); g.fill();
      g.lineWidth = 9; g.strokeStyle = p.ring; g.stroke();
      g.font = '62px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillText(p.emoji, 64, 70);
    }), depthTest: false,
  });
}
function M(color, o = {}) {
  return new THREE.MeshStandardMaterial({ color, roughness: o.r ?? 0.8, metalness: o.m ?? 0, emissive: o.e ?? 0x000000, emissiveIntensity: o.ei ?? 1, flatShading: !!o.flat, transparent: !!o.t, opacity: o.op ?? 1, side: o.side ?? THREE.FrontSide });
}
function mesh(geo, mat, x = 0, y = 0, z = 0, shadow = true) {
  const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z);
  m.castShadow = shadow; m.receiveShadow = true; return m;
}

// ═════════════════════════ đường ray ═════════════════════════
function resample(pts) {
  const xs = [pts[0][0]], zs = [pts[0][1]];
  let px = pts[0][0], pz = pts[0][1], need = STEP;
  for (let i = 1; i < pts.length; i++) {
    let ax = px, az = pz; const bx = pts[i][0], bz = pts[i][1];
    let seg = Math.hypot(bx - ax, bz - az);
    while (seg >= need) { const u = need / seg; ax += (bx - ax) * u; az += (bz - az) * u; xs.push(ax); zs.push(az); seg -= need; need = STEP; }
    need -= seg; px = bx; pz = bz;
  }
  return { xs: Float32Array.from(xs), zs: Float32Array.from(zs) };
}
class Track {
  constructor(pts) {
    const r = resample(pts);
    this.xs = r.xs; this.zs = r.zs; this.n = r.xs.length; this.len = (this.n - 1) * STEP;
    this.balls = []; this.spawnLeft = 0; this.rush = true; this.lastColor = -1; this.run = 0;
  }
  pos(s, o) {
    const xs = this.xs, zs = this.zs;
    if (s <= 0) { o.x = xs[0] + (xs[1] - xs[0]) / STEP * s; o.z = zs[0] + (zs[1] - zs[0]) / STEP * s; return o; }
    let i = Math.floor(s / STEP); if (i > this.n - 2) i = this.n - 2;
    const u = s / STEP - i;
    o.x = xs[i] + (xs[i + 1] - xs[i]) * u; o.z = zs[i] + (zs[i + 1] - zs[i]) * u; return o;
  }
  tan(s, o) {
    const i = clamp(Math.floor(s / STEP), 0, this.n - 2);
    o.x = (this.xs[i + 1] - this.xs[i]) / STEP; o.z = (this.zs[i + 1] - this.zs[i]) / STEP; return o;
  }
}

// ═════════════════════════ trạng thái game ═════════════════════════
const game = {
  state: 'menu', L: 0, def: null, theme: null, tracks: [], shots: [], score: 0,
  cur: null, next: null, aim: { x: 0, z: -1 }, aimOK: false, aimShow: false,
  freezeT: 0, reverseT: 0, chain: 0, streak: 0, maxProg: 0, cooldown: 0,
  total: 1, killed: 0, endT: 0, HX: 8, HZ: 6, portrait: false, sx: 0, sz: 0,
  beatT: 0, shake: 0, time: 0, present: new Set(), powerQ: [], danger: 0,
};
const dynamic = []; // các đối tượng hiệu ứng tạm thời
const tmp = { x: 0, z: 0 }, tmp2 = { x: 0, z: 0 }, tmpT = { x: 0, z: 0 };

function fieldDims() {
  const a = innerWidth / innerHeight;
  const r = clamp(a * 0.85, 0.42, 1.8), A = 52;
  return { HX: Math.sqrt(A * r), HZ: Math.sqrt(A / r), portrait: a < 0.9 };
}

// ═════════════════════════ nhân vật: rồng con ═════════════════════════
const dragon = (() => {
  const jade = M(0x2ec4a0, { r: 0.42 }), jadeD = M(0x1d9479, { r: 0.5 }), cream = M(0xffe2a0, { r: 0.6 });
  const gold = M(0xffc83d, { r: 0.28, m: 0.6 }), spike = M(0xff8a3d, { r: 0.5 }), wingM = M(0x86ecd0, { r: 0.5, side: THREE.DoubleSide });
  const white = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2 }), pupilM = new THREE.MeshStandardMaterial({ color: 0x1a1428, roughness: 0.15 });
  const blush = M(0xff8fa3, { r: 0.7, t: true, op: 0.75 });
  const sph = (r, w = 20, h = 14) => new THREE.SphereGeometry(r, w, h);

  const root = new THREE.Group();
  const body = new THREE.Group(); root.add(body);
  const torso = mesh(sph(0.72, 28, 20), jade, 0, 0.72, -0.05); torso.scale.set(1, 0.9, 1.05); body.add(torso);
  const belly = mesh(sph(0.6), cream, 0, 0.68, 0.3); belly.scale.set(0.85, 0.82, 0.6); body.add(belly);
  for (const [x, z] of [[-0.38, 0.32], [0.38, 0.32], [-0.42, -0.32], [0.42, -0.32]]) body.add(mesh(sph(0.18), jadeD, x, 0.13, z));
  // cánh
  const wings = [];
  for (const sx of [-1, 1]) {
    const wg = new THREE.Group(); wg.position.set(sx * 0.55, 1.05, -0.3);
    const wm = mesh(sph(0.5, 16, 10), wingM, sx * 0.25, 0.12, -0.05); wm.scale.set(0.5, 0.75, 0.12); wm.rotation.y = sx * 1.2;
    wg.add(wm); wg.rotation.z = sx * -0.5; body.add(wg); wings.push(wg);
  }
  // gai lưng
  for (const [y, z, s] of [[1.25, -0.45, 1], [1.02, -0.72, 0.85], [0.72, -0.86, 0.7]]) {
    const c = mesh(new THREE.ConeGeometry(0.11 * s, 0.3 * s, 8), spike, 0, y, z); c.rotation.x = -0.7; body.add(c);
  }
  // đuôi giữ viên ngọc kế tiếp
  const tailG = new THREE.Group(); tailG.position.set(0, 0.35, -0.65); body.add(tailG);
  const tailCurve = new THREE.CatmullRomCurve3([new THREE.Vector3(0, 0, 0), new THREE.Vector3(0.05, -0.12, -0.45), new THREE.Vector3(0.4, -0.12, -0.8), new THREE.Vector3(0.72, 0.05, -0.8)]);
  tailG.add(mesh(new THREE.TubeGeometry(tailCurve, 24, 0.13, 10), jade));
  const tailTip = mesh(new THREE.ConeGeometry(0.14, 0.3, 8), spike, 0.84, 0.08, -0.78); tailTip.rotation.z = -1.4; tailG.add(tailTip);
  const nextSlot = new THREE.Group(); nextSlot.position.set(0.7, 0.42, -0.82); tailG.add(nextSlot);
  // đầu
  const headG = new THREE.Group(); headG.position.set(0, 1.32, 0.18); body.add(headG);
  headG.add(mesh(sph(0.58, 28, 20), jade));
  const snout = mesh(sph(0.42, 24, 16), jade, 0, -0.14, 0.42); snout.scale.set(1.05, 0.75, 0.95); headG.add(snout);
  for (const sx of [-1, 1]) {
    headG.add(mesh(sph(0.045, 8, 6), pupilM, sx * 0.12, -0.05, 0.8, false));
    const horn = mesh(new THREE.ConeGeometry(0.09, 0.42, 10), gold, sx * 0.26, 0.5, -0.12); horn.rotation.set(-0.5, 0, sx * -0.25); headG.add(horn);
    const ck = mesh(sph(0.11, 12, 8), blush, sx * 0.38, -0.13, 0.36, false); ck.scale.set(1, 0.5, 0.4); headG.add(ck);
  }
  for (const [y, z, s] of [[0.52, -0.2, 1], [0.38, -0.44, 0.8]]) { const c = mesh(new THREE.ConeGeometry(0.1 * s, 0.26 * s, 8), spike, 0, y, z); c.rotation.x = -0.9; headG.add(c); }
  const eyes = new THREE.Group(); headG.add(eyes);
  for (const sx of [-1, 1]) {
    const e = new THREE.Group(); e.position.set(sx * 0.25, 0.14, 0.4);
    e.add(mesh(sph(0.19), white, 0, 0, 0, false));
    e.add(mesh(sph(0.1, 14, 10), pupilM, 0, 0.01, 0.15, false));
    e.add(mesh(sph(0.035, 8, 6), new THREE.MeshBasicMaterial({ color: 0xffffff }), -0.04, 0.07, 0.22, false));
    eyes.add(e);
  }
  const mouthSlot = new THREE.Group(); mouthSlot.position.set(0, -0.2, 0.86); headG.add(mouthSlot);

  const curMesh = new THREE.Mesh(ballGeo, ballMats[0]); curMesh.castShadow = true; mouthSlot.add(curMesh);
  const curIcon = new THREE.Sprite(powerMats.bolt); curIcon.scale.set(0.5, 0.5, 0.5); curIcon.position.set(0, 0.62, 0); curIcon.visible = false; mouthSlot.add(curIcon);
  const nextMesh = new THREE.Mesh(ballGeo, ballMats[1]); nextMesh.castShadow = true; nextMesh.scale.setScalar(0.72); nextSlot.add(nextMesh);

  // bệ đá hoa sen
  const pedestal = new THREE.Group();
  pedestal.add(mesh(new THREE.CylinderGeometry(1.2, 1.36, 0.3, 40), M(0xbfb2a0, { r: 0.85 }), 0, 0.15, 0));
  const rim = mesh(new THREE.TorusGeometry(1.2, 0.06, 8, 48), gold, 0, 0.3, 0); rim.rotation.x = Math.PI / 2; pedestal.add(rim);
  const petal = M(0xff9cc0, { r: 0.5 });
  for (let i = 0; i < 10; i++) {
    const a = i / 10 * TAU; const p = mesh(sph(0.3, 12, 8), petal, Math.cos(a) * 1.3, 0.22, Math.sin(a) * 1.3);
    p.scale.set(0.55, 0.35, 1); p.rotation.y = -a + Math.PI / 2; pedestal.add(p);
  }
  root.position.y = 0.3;
  const group = new THREE.Group(); group.add(pedestal, root);
  group.scale.setScalar(0.85);
  scene.add(group);

  const st = { angle: 0, recoil: 0, blinkT: 2, hop: 0, mood: 'idle', moodT: 0, swapT: 0 };
  function setAmmo(cur, next) {
    curMesh.material = cur.special === 'rainbow' ? rainbowMat : cur.special === 'bolt' ? boltMat : ballMats[cur.color];
    curIcon.visible = cur.special === 'bolt';
    nextMesh.material = next.special === 'rainbow' ? rainbowMat : next.special === 'bolt' ? boltMat : ballMats[next.color];
  }
  function update(dt, t) {
    const target = Math.atan2(game.aim.x, game.aim.z);
    let d = target - st.angle; d = Math.atan2(Math.sin(d), Math.cos(d));
    if (st.mood === 'win') st.angle += dt * 6; else st.angle += d * Math.min(1, dt * 18);
    root.rotation.y = st.angle;
    body.scale.y = 1 + Math.sin(t * 2.4) * 0.025; body.scale.x = 1 - Math.sin(t * 2.4) * 0.012;
    st.recoil = Math.max(0, st.recoil - dt * 6);
    headG.position.z = 0.18 - st.recoil * 0.14; headG.position.y = 1.32 + Math.sin(t * 2.4) * 0.02;
    st.blinkT -= dt; if (st.blinkT < 0) st.blinkT = 2 + Math.random() * 3;
    const blink = st.blinkT < 0.12 ? 0.15 : 1;
    eyes.scale.y = st.mood === 'sad' ? 0.35 : blink;
    headG.rotation.x = st.mood === 'sad' ? 0.35 : lerp(headG.rotation.x, 0, dt * 6);
    wings[0].rotation.z = 0.5 + Math.sin(t * 3) * 0.15 + (st.mood === 'win' ? Math.sin(t * 18) * 0.4 : 0);
    wings[1].rotation.z = -wings[0].rotation.z;
    tailG.rotation.y = Math.sin(t * 1.5) * 0.15;
    if (st.hop > 0) st.hop = Math.max(0, st.hop - dt * 2.5);
    if (st.mood === 'win') body.position.y = Math.abs(Math.sin(t * 7)) * 0.45;
    else body.position.y = Math.sin(st.hop * Math.PI) * 0.35;
    curMesh.rotation.y += dt * 1.5; curMesh.rotation.x += dt * 0.7;
    st.swapT = Math.max(0, st.swapT - dt * 4);
    nextMesh.position.y = Math.sin(st.swapT * Math.PI) * 0.5;
    curMesh.scale.setScalar(1 - Math.sin(st.swapT * Math.PI) * 0.4);
  }
  const wp = new THREE.Vector3();
  function mouthWorld() { curMesh.getWorldPosition(wp); return wp; }
  return { group, setAmmo, update, mouthWorld, st };
})();

// ═════════════════════════ hiệu ứng: hạt, vòng, tia ═════════════════════════
const PMAX = 900;
const pPos = new Float32Array(PMAX * 3), pCol = new Float32Array(PMAX * 3), pBase = new Float32Array(PMAX * 3), pVel = new Float32Array(PMAX * 3), pLife = new Float32Array(PMAX), pMax = new Float32Array(PMAX);
for (let i = 0; i < PMAX; i++) pPos[i * 3 + 1] = -100;
const pGeo = new THREE.BufferGeometry();
pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
pGeo.setAttribute('color', new THREE.BufferAttribute(pCol, 3));
const particles = new THREE.Points(pGeo, new THREE.PointsMaterial({ size: 0.34, map: dotTex, vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
particles.frustumCulled = false; scene.add(particles);
let pIdx = 0;
function burst(x, y, z, color, n = 16, spd = 4, life = 0.7, up = 3) {
  const c = new THREE.Color(color);
  for (let k = 0; k < n; k++) {
    const i = pIdx; pIdx = (pIdx + 1) % PMAX;
    pPos[i * 3] = x; pPos[i * 3 + 1] = y; pPos[i * 3 + 2] = z;
    const a = Math.random() * TAU, s = spd * (0.4 + Math.random() * 0.8);
    pVel[i * 3] = Math.cos(a) * s; pVel[i * 3 + 1] = up * (0.4 + Math.random()); pVel[i * 3 + 2] = Math.sin(a) * s;
    pBase[i * 3] = c.r; pBase[i * 3 + 1] = c.g; pBase[i * 3 + 2] = c.b;
    pLife[i] = pMax[i] = life * (0.6 + Math.random() * 0.6);
  }
}
function updateParticles(dt) {
  for (let i = 0; i < PMAX; i++) {
    if (pLife[i] <= 0) continue;
    pLife[i] -= dt;
    const j = i * 3;
    if (pLife[i] <= 0) { pPos[j + 1] = -100; pCol[j] = pCol[j + 1] = pCol[j + 2] = 0; continue; }
    pVel[j + 1] -= 9 * dt; pVel[j] *= 1 - dt * 1.5; pVel[j + 2] *= 1 - dt * 1.5;
    pPos[j] += pVel[j] * dt; pPos[j + 1] = Math.max(0.05, pPos[j + 1] + pVel[j + 1] * dt); pPos[j + 2] += pVel[j + 2] * dt;
    const f = pLife[i] / pMax[i];
    pCol[j] = pBase[j] * f; pCol[j + 1] = pBase[j + 1] * f; pCol[j + 2] = pBase[j + 2] * f;
  }
  pGeo.attributes.position.needsUpdate = true; pGeo.attributes.color.needsUpdate = true;
}
const ringGeo = new THREE.RingGeometry(0.82, 1, 40);
function ring(x, z, color, size = 2.2, dur = 0.45) {
  const m = new THREE.Mesh(ringGeo, new THREE.MeshBasicMaterial({ color, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide }));
  m.rotation.x = -Math.PI / 2; m.position.set(x, 0.12, z); scene.add(m);
  dynamic.push({ t: 0, dur, update(k) { const s = lerp(0.3, size, 1 - Math.pow(1 - k, 2)); m.scale.set(s, s, s); m.material.opacity = 1 - k; }, dispose() { scene.remove(m); m.material.dispose(); } });
}
function beam(x0, z0, x1, z1) {
  const len = Math.hypot(x1 - x0, z1 - z0);
  const g = new THREE.Group();
  const outer = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, len, 10, 1, true), new THREE.MeshBasicMaterial({ color: 0x4fd8ff, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
  const inner = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, len, 8, 1, true), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
  g.add(outer, inner);
  g.position.set((x0 + x1) / 2, R + 0.1, (z0 + z1) / 2);
  g.rotation.set(Math.PI / 2, 0, 0); g.rotation.order = 'YXZ'; g.rotation.y = Math.atan2(x1 - x0, z1 - z0);
  scene.add(g);
  dynamic.push({ t: 0, dur: 0.45, update(k) { outer.material.opacity = (1 - k) * 0.8; inner.material.opacity = 1 - k; const s = 1 + Math.sin(k * 40) * 0.25; g.scale.set(s, 1, s); }, dispose() { scene.remove(g); outer.geometry.dispose(); inner.geometry.dispose(); outer.material.dispose(); inner.material.dispose(); } });
}
function dyingBall(m) {
  dynamic.push({ t: 0, dur: 0.22, update(k) { const s = k < 0.35 ? 1 + k : (1 - k) * 2.08; m.scale.setScalar(Math.max(0.001, s)); }, dispose() { m.parent && m.parent.remove(m); } });
}
function updateDynamic(dt) {
  for (let i = dynamic.length - 1; i >= 0; i--) {
    const d = dynamic[i]; d.t += dt; const k = Math.min(1, d.t / d.dur);
    d.update(k, dt);
    if (k >= 1) { d.dispose(); dynamic.splice(i, 1); }
  }
}
const fxLayer = $('fx');
const projV = new THREE.Vector3();
function floatText(text, x, z, big = false, color = null) {
  projV.set(x, 0.8, z).project(camera);
  const el = document.createElement('div'); el.className = 'ftxt' + (big ? ' big' : '');
  el.textContent = text; if (color) el.style.color = color;
  el.style.left = ((projV.x + 1) / 2 * innerWidth) + 'px'; el.style.top = ((1 - projV.y) / 2 * innerHeight) + 'px';
  fxLayer.appendChild(el); setTimeout(() => el.remove(), 1150);
}
let toastTimer = 0;
function toast(text) {
  const t = $('toast'); t.textContent = text; t.classList.add('show');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('show'), 1300);
}

// ═════════════════════════ môi trường từng thế giới ═════════════════════════
const groundCache = {};
function groundTextures(theme) {
  if (groundCache[theme]) return groundCache[theme];
  const r = rng(theme.length * 977);
  let map, emi = null;
  if (theme === 'rice') {
    map = canvasTex(512, 512, (g, w, h) => {
      g.fillStyle = '#7cc04e'; g.fillRect(0, 0, w, h);
      for (let y = 0; y < h; y += 64) {
        const gr = g.createLinearGradient(0, y, 0, y + 64); gr.addColorStop(0, '#93d65c'); gr.addColorStop(0.8, '#6fb543'); gr.addColorStop(1, '#4f8a2e');
        g.fillStyle = gr; g.beginPath(); g.moveTo(0, y);
        for (let x = 0; x <= w; x += 16) g.lineTo(x, y + Math.sin(x / w * TAU * 2) * 6);
        g.lineTo(w, y + 64); g.lineTo(0, y + 64); g.fill();
      }
      for (let i = 0; i < 2500; i++) { g.fillStyle = r() < 0.5 ? 'rgba(40,90,20,.35)' : 'rgba(200,255,140,.3)'; g.fillRect(r() * w, r() * h, 2, 5); }
    }, { repeat: true });
  } else if (theme === 'bay') {
    map = canvasTex(512, 512, (g, w, h) => {
      const gr = g.createLinearGradient(0, 0, w, h); gr.addColorStop(0, '#2fb6b8'); gr.addColorStop(1, '#2496a8');
      g.fillStyle = gr; g.fillRect(0, 0, w, h);
      g.strokeStyle = 'rgba(220,255,250,.35)'; g.lineWidth = 3;
      for (let i = 0; i < 90; i++) { const x = r() * w, y = r() * h, l = 14 + r() * 26; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + l / 2, y - 6, x + l, y); g.stroke(); }
    }, { repeat: true });
  } else if (theme === 'lava') {
    const cracks = [];
    for (let i = 0; i < 12; i++) { const pts = []; let x = r() * 512, y = r() * 512; for (let k = 0; k < 7; k++) { pts.push([x, y]); x += (r() - 0.5) * 90; y += (r() - 0.5) * 90; } cracks.push(pts); }
    const drawCracks = (g, col, wdt) => { g.strokeStyle = col; g.lineWidth = wdt; g.lineJoin = 'round'; for (const c of cracks) { g.beginPath(); c.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.stroke(); } };
    map = canvasTex(512, 512, (g, w, h) => {
      g.fillStyle = '#3a2a2a'; g.fillRect(0, 0, w, h);
      for (let i = 0; i < 300; i++) { g.fillStyle = r() < 0.5 ? 'rgba(0,0,0,.25)' : 'rgba(120,90,80,.2)'; g.beginPath(); g.arc(r() * w, r() * h, 4 + r() * 18, 0, TAU); g.fill(); }
      drawCracks(g, '#b84a10', 4);
    }, { repeat: true });
    emi = canvasTex(512, 512, (g, w, h) => { g.fillStyle = '#000'; g.fillRect(0, 0, w, h); drawCracks(g, '#a03000', 7); drawCracks(g, '#ff7a20', 2.5); }, { repeat: true });
  } else if (theme === 'ice') {
    map = canvasTex(512, 512, (g, w, h) => {
      g.fillStyle = '#eef8ff'; g.fillRect(0, 0, w, h);
      for (let i = 0; i < 160; i++) { g.fillStyle = 'rgba(160,200,235,.18)'; g.beginPath(); g.ellipse(r() * w, r() * h, 20 + r() * 50, 8 + r() * 20, r() * 3, 0, TAU); g.fill(); }
      for (let i = 0; i < 400; i++) { g.fillStyle = 'rgba(255,255,255,.9)'; g.fillRect(r() * w, r() * h, 2, 2); }
    }, { repeat: true });
  } else {
    map = canvasTex(512, 512, (g, w, h) => {
      g.fillStyle = '#2a2638'; g.fillRect(0, 0, w, h);
      for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) {
        const ox = (y % 2) * 32; const c = 50 + r() * 25;
        g.fillStyle = `rgb(${c + 10},${c},${c + 22})`;
        g.fillRect(x * 64 + ox + 3, y * 64 + 3, 58, 58);
      }
    }, { repeat: true });
  }
  return (groundCache[theme] = { map, emi });
}

function buildDecor(theme, rand, place) {
  const S = (r) => new THREE.SphereGeometry(r, 14, 10);
  const add = (obj, size, big = false) => place(obj, size, big);
  if (theme === 'rice') {
    const leaf = M(0x4caf3a, { flat: true }), trunk = M(0x8a5a2b), straw = M(0xe8c35a, { flat: true });
    const bamboo = () => { const g = new THREE.Group(); const bm = M(0x7cbf3a, { r: 0.5 });
      for (let i = 0; i < 4; i++) { const h = 1.4 + rand() * 1.2, x = (rand() - 0.5) * 0.6, z = (rand() - 0.5) * 0.6; g.add(mesh(new THREE.CylinderGeometry(0.07, 0.08, h, 8), bm, x, h / 2, z)); const l = mesh(new THREE.ConeGeometry(0.22, 0.55, 5), leaf, x, h + 0.1, z); l.scale.z = 0.4; g.add(l); }
      return g; };
    const hay = () => { const g = new THREE.Group(); g.add(mesh(new THREE.ConeGeometry(0.5, 0.95, 10), straw, 0, 0.47, 0)); return g; };
    const tree = () => { const g = new THREE.Group(); g.add(mesh(new THREE.CylinderGeometry(0.1, 0.14, 0.9, 8), trunk, 0, 0.45, 0)); for (let i = 0; i < 3; i++) g.add(mesh(new THREE.IcosahedronGeometry(0.45 + rand() * 0.2, 0), leaf, (rand() - 0.5) * 0.5, 1.05 + rand() * 0.4, (rand() - 0.5) * 0.5)); return g; };
    const hut = () => { const g = new THREE.Group(); g.add(mesh(new THREE.BoxGeometry(1.3, 0.8, 1), M(0xd9b07a), 0, 0.4, 0)); const roof = mesh(new THREE.ConeGeometry(1.15, 0.8, 4), straw, 0, 1.2, 0); roof.rotation.y = Math.PI / 4; roof.scale.z = 0.85; g.add(roof); g.add(mesh(new THREE.BoxGeometry(0.3, 0.5, 0.05), M(0x5a3a1a), 0, 0.25, 0.51)); return g; };
    for (let i = 0; i < 30; i++) { const k = rand(); if (k < 0.35) add(bamboo(), 0.6); else if (k < 0.6) add(hay(), 0.55); else if (k < 0.88) add(tree(), 0.8); else add(hut(), 1.2, true); }
  } else if (theme === 'bay') {
    const rock = M(0x8da397, { flat: true, r: 0.9 }), green = M(0x3f9a4a, { flat: true }), wood = M(0x9a6a3a), sail = M(0xff9a4a, { side: THREE.DoubleSide });
    const karst = () => { const g = new THREE.Group(); const h = 1.6 + rand() * 2.2; let y = 0;
      for (let i = 0; i < 3; i++) { const s = (1 - i * 0.22) * (0.7 + rand() * 0.3); const m = mesh(new THREE.DodecahedronGeometry(s, 0), rock, (rand() - 0.5) * 0.3, y + s * 0.8, (rand() - 0.5) * 0.3); m.scale.y = h / 2.4 / s * 1.1; g.add(m); y += h / 3; }
      g.add(mesh(new THREE.IcosahedronGeometry(0.4, 0), green, 0, y + 0.3, 0)); return g; };
    const boat = () => { const g = new THREE.Group(); const hull = mesh(new THREE.CylinderGeometry(0.35, 0.35, 1.4, 12, 1, false, 0, Math.PI), wood, 0, 0.2, 0); hull.rotation.set(Math.PI / 2, 0, Math.PI); g.add(hull);
      g.add(mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.1, 6), wood, 0, 0.75, 0)); const s = mesh(new THREE.ConeGeometry(0.45, 0.9, 3), sail, 0.12, 0.85, 0); s.scale.z = 0.08; g.add(s); g.rotation.y = rand() * TAU; return g; };
    const lily = () => { const g = new THREE.Group(); for (let i = 0; i < 3; i++) g.add(mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.03, 12), green, (rand() - 0.5) * 0.6, 0.02, (rand() - 0.5) * 0.6, false)); g.add(mesh(S(0.08), M(0xff9cc0), 0, 0.08, 0)); return g; };
    for (let i = 0; i < 28; i++) { const k = rand(); if (k < 0.45) add(karst(), 1.0, true); else if (k < 0.7) add(boat(), 0.8); else add(lily(), 0.45); }
  } else if (theme === 'lava') {
    const rock = M(0x2a2222, { flat: true, r: 0.95 }), glow = M(0xb83a08, { e: 0xff4a00, ei: 0.75, r: 0.4 }), crystal = M(0xff3a3a, { e: 0xaa1010, ei: 1.2, r: 0.2, flat: true });
    const rocks = () => { const g = new THREE.Group(); for (let i = 0; i < 3; i++) { const m = mesh(new THREE.DodecahedronGeometry(0.25 + rand() * 0.35, 0), rock, (rand() - 0.5) * 0.7, 0.15, (rand() - 0.5) * 0.7); m.rotation.set(rand() * 3, rand() * 3, 0); g.add(m); } return g; };
    const pool = () => { const g = new THREE.Group(); const p = mesh(new THREE.CircleGeometry(0.6 + rand() * 0.4, 24), glow, 0, 0.03, 0, false); p.rotation.x = -Math.PI / 2; g.add(p); return g; };
    const cryst = () => { const g = new THREE.Group(); for (let i = 0; i < 4; i++) { const m = mesh(new THREE.OctahedronGeometry(0.2 + rand() * 0.15, 0), crystal, (rand() - 0.5) * 0.5, 0.3, (rand() - 0.5) * 0.5); m.scale.y = 2; m.rotation.z = (rand() - 0.5) * 0.6; g.add(m); } return g; };
    const volcano = () => { const g = new THREE.Group(); g.add(mesh(new THREE.ConeGeometry(1.6, 2.2, 12, 1, true), rock, 0, 1.1, 0)); const top = mesh(new THREE.CircleGeometry(0.45, 16), glow, 0, 2.0, 0, false); top.rotation.x = -Math.PI / 2; g.add(top); return g; };
    for (let i = 0; i < 28; i++) { const k = rand(); if (k < 0.35) add(rocks(), 0.6); else if (k < 0.6) add(pool(), 0.8); else if (k < 0.85) add(cryst(), 0.5); else add(volcano(), 1.6, true); }
  } else if (theme === 'ice') {
    const pine = M(0x2f6a55, { flat: true }), snow = M(0xffffff, { r: 0.6 }), crystal = new THREE.MeshPhysicalMaterial({ color: 0x9fe6ff, roughness: 0.05, transparent: true, opacity: 0.75, flatShading: true, clearcoat: 1 });
    const tree = () => { const g = new THREE.Group(); g.add(mesh(new THREE.CylinderGeometry(0.08, 0.1, 0.4, 6), M(0x6a4a2a), 0, 0.2, 0));
      for (let i = 0; i < 3; i++) { const s = 0.62 - i * 0.16, y = 0.45 + i * 0.42; g.add(mesh(new THREE.ConeGeometry(s, 0.7, 8), pine, 0, y + 0.3, 0)); g.add(mesh(new THREE.ConeGeometry(s * 0.55, 0.32, 8), snow, 0, y + 0.52, 0)); }
      return g; };
    const cryst = () => { const g = new THREE.Group(); for (let i = 0; i < 3; i++) { const m = mesh(new THREE.OctahedronGeometry(0.25 + rand() * 0.2, 0), crystal, (rand() - 0.5) * 0.5, 0.35, (rand() - 0.5) * 0.5); m.scale.y = 2.2; m.rotation.z = (rand() - 0.5) * 0.7; g.add(m); } return g; };
    const snowman = () => { const g = new THREE.Group(); g.add(mesh(S(0.36), snow, 0, 0.32, 0)); g.add(mesh(S(0.25), snow, 0, 0.8, 0)); const n = mesh(new THREE.ConeGeometry(0.05, 0.25, 8), M(0xff7a1a), 0, 0.8, 0.3); n.rotation.x = Math.PI / 2; g.add(n);
      for (const sx of [-1, 1]) g.add(mesh(S(0.035), M(0x111111), sx * 0.08, 0.88, 0.22)); g.add(mesh(new THREE.TorusGeometry(0.22, 0.05, 6, 16), M(0xe23a3a), 0, 0.62, 0)).rotation.x = Math.PI / 2; g.rotation.y = (rand() - 0.5) * 1; return g; };
    for (let i = 0; i < 28; i++) { const k = rand(); if (k < 0.55) add(tree(), 0.7); else if (k < 0.85) add(cryst(), 0.5); else add(snowman(), 0.5); }
  } else {
    const wall = M(0xf2d59a), roofM = M(0x7a2a24, { flat: true }), lantM = M(0xff3b2f, { e: 0xff2a10, ei: 1.6, r: 0.5 }), winM = M(0xffd27a, { e: 0xffb84a, ei: 1.8 }), pole = M(0x3a2a2a), blossom = M(0xff9cc8, { flat: true });
    const house = () => { const g = new THREE.Group(); const w = 1.2 + rand() * 0.5; g.add(mesh(new THREE.BoxGeometry(w, 0.9, 1), wall, 0, 0.45, 0));
      const roof = mesh(new THREE.ConeGeometry(w * 0.85, 0.7, 4), roofM, 0, 1.25, 0); roof.rotation.y = Math.PI / 4; roof.scale.z = 0.8; g.add(roof);
      for (const sx of [-0.28, 0.28]) g.add(mesh(new THREE.PlaneGeometry(0.25, 0.3), winM, sx * w, 0.5, 0.505, false));
      const l = mesh(S(0.14), lantM, w * 0.5, 0.75, 0.55, false); l.scale.y = 1.25; g.add(l); return g; };
    const lantern = () => { const g = new THREE.Group(); g.add(mesh(new THREE.CylinderGeometry(0.04, 0.05, 1.6, 6), pole, 0, 0.8, 0)); g.add(mesh(new THREE.BoxGeometry(0.5, 0.04, 0.04), pole, 0.2, 1.55, 0));
      const l = mesh(S(0.2), lantM, 0.4, 1.3, 0, false); l.scale.y = 1.3; g.add(l); return g; };
    const tree = () => { const g = new THREE.Group(); g.add(mesh(new THREE.CylinderGeometry(0.08, 0.12, 0.9, 6), M(0x4a2a1a), 0, 0.45, 0)); for (let i = 0; i < 4; i++) g.add(mesh(new THREE.IcosahedronGeometry(0.32 + rand() * 0.15, 0), blossom, (rand() - 0.5) * 0.7, 1.0 + rand() * 0.4, (rand() - 0.5) * 0.7)); return g; };
    for (let i = 0; i < 28; i++) { const k = rand(); if (k < 0.4) add(house(), 1.1, true); else if (k < 0.75) add(lantern(), 0.45); else add(tree(), 0.7); }
  }
}

// hạt môi trường (đom đóm, tuyết, tàn lửa…)
const AMB = 90;
const ambPos = new Float32Array(AMB * 3), ambCol = new Float32Array(AMB * 3), ambVel = new Float32Array(AMB * 3), ambPh = new Float32Array(AMB);
const ambGeo = new THREE.BufferGeometry();
ambGeo.setAttribute('position', new THREE.BufferAttribute(ambPos, 3));
ambGeo.setAttribute('color', new THREE.BufferAttribute(ambCol, 3));
const ambMat = new THREE.PointsMaterial({ size: 0.25, map: dotTex, vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
const ambient = new THREE.Points(ambGeo, ambMat); ambient.frustumCulled = false; scene.add(ambient);
function initAmbient(kind) {
  const W = game.HX + 2, H = game.HZ + 2;
  ambMat.size = { firefly: 0.22, sparkle: 0.18, ember: 0.2, snow: 0.16, lantern: 0.42 }[kind];
  ambMat.blending = kind === 'snow' ? THREE.NormalBlending : THREE.AdditiveBlending;
  for (let i = 0; i < AMB; i++) {
    ambPos[i * 3] = (Math.random() * 2 - 1) * W; ambPos[i * 3 + 1] = Math.random() * 5; ambPos[i * 3 + 2] = (Math.random() * 2 - 1) * H;
    ambVel[i * 3] = (Math.random() - 0.5) * 0.4; ambVel[i * 3 + 1] = 0; ambVel[i * 3 + 2] = (Math.random() - 0.5) * 0.4;
    ambPh[i] = Math.random() * TAU;
  }
  ambient.userData.kind = kind;
}
function updateAmbient(dt, t) {
  const kind = ambient.userData.kind; if (!kind) return;
  const W = game.HX + 2, H = game.HZ + 2;
  for (let i = 0; i < AMB; i++) {
    const j = i * 3; let a = 1;
    if (kind === 'firefly') { ambPos[j] += Math.sin(t * 0.7 + ambPh[i]) * dt * 0.4; ambPos[j + 2] += Math.cos(t * 0.6 + ambPh[i] * 1.3) * dt * 0.4; ambPos[j + 1] = 0.6 + Math.sin(t + ambPh[i]) * 0.4 + (i % 5) * 0.3; a = 0.5 + 0.5 * Math.sin(t * 3 + ambPh[i]); ambCol[j] = 0.8 * a; ambCol[j + 1] = 1 * a; ambCol[j + 2] = 0.3 * a; }
    else if (kind === 'sparkle') { ambPos[j + 1] = 0.05; a = Math.max(0, Math.sin(t * 2 + ambPh[i] * 3)) ** 6; ambCol[j] = a; ambCol[j + 1] = a; ambCol[j + 2] = a; }
    else if (kind === 'ember') { ambPos[j + 1] += dt * (0.6 + (i % 4) * 0.25); ambPos[j] += Math.sin(t * 2 + ambPh[i]) * dt * 0.3; if (ambPos[j + 1] > 6) ambPos[j + 1] = 0; a = 1 - ambPos[j + 1] / 6; ambCol[j] = a; ambCol[j + 1] = 0.45 * a; ambCol[j + 2] = 0.1 * a; }
    else if (kind === 'snow') { ambPos[j + 1] -= dt * (0.7 + (i % 3) * 0.3); ambPos[j] += Math.sin(t + ambPh[i]) * dt * 0.4; if (ambPos[j + 1] < 0) ambPos[j + 1] = 6; ambCol[j] = ambCol[j + 1] = ambCol[j + 2] = 1; }
    else if (kind === 'lantern') { ambPos[j + 1] += dt * 0.35; ambPos[j] += Math.sin(t * 0.5 + ambPh[i]) * dt * 0.2; if (ambPos[j + 1] > 8) ambPos[j + 1] = 0; a = Math.min(1, ambPos[j + 1] / 1.5) * (1 - ambPos[j + 1] / 8); ambCol[j] = a; ambCol[j + 1] = 0.5 * a; ambCol[j + 2] = 0.15 * a; }
    if (ambPos[j] > W) ambPos[j] = -W; if (ambPos[j] < -W) ambPos[j] = W;
    if (ambPos[j + 2] > H) ambPos[j + 2] = -H; if (ambPos[j + 2] < -H) ambPos[j + 2] = H;
  }
  ambGeo.attributes.position.needsUpdate = true; ambGeo.attributes.color.needsUpdate = true;
}

// ═════════════════════════ dựng màn chơi ═════════════════════════
const levelFx = { holes: [], swirls: [], groundTex: null };
function disposeGroup(g) {
  g.traverse((o) => { if (o.geometry && o.geometry !== ballGeo && o.geometry !== iceGeo) o.geometry.dispose(); });
  while (g.children.length) g.remove(g.children[0]);
}
function trackTexture(th) {
  return canvasTex(128, 128, (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, w, 0);
    gr.addColorStop(0, th.trackB); gr.addColorStop(0.18, th.trackA); gr.addColorStop(0.5, th.trackB); gr.addColorStop(0.82, th.trackA); gr.addColorStop(1, th.trackB);
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
    g.fillStyle = 'rgba(0,0,0,.18)'; g.fillRect(0, 0, w, 4);
    g.fillStyle = 'rgba(255,255,255,.1)'; g.fillRect(0, 4, w, 3);
  }, { repeat: true });
}
function buildTrackVisual(T, th) {
  const half = 0.64, stride = 2;
  const pos = [], uv = [], idx = []; let k = 0;
  for (let i = 0; i < T.n; i += stride) {
    T.tan(i * STEP, tmpT); const nx = -tmpT.z, nz = tmpT.x; const x = T.xs[i], z = T.zs[i];
    pos.push(x + nx * half, 0.015, z + nz * half, x - nx * half, 0.015, z - nz * half);
    const v = i * STEP / 1.2; uv.push(0, v, 1, v); k++;
  }
  for (let j = 0; j < k - 1; j++) { const a = j * 2; idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  geo.setIndex(idx); geo.computeVertexNormals();
  const ribbon = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ map: trackTexture(th), roughness: 0.85, side: THREE.DoubleSide }));
  ribbon.receiveShadow = true; levelGroup.add(ribbon);
  const railMat = M(th.rail, { r: 0.35, m: 0.4 });
  for (const sd of [-1, 1]) {
    const pts = [];
    for (let i = 0; i < T.n; i += 6) { T.tan(i * STEP, tmpT); pts.push(new THREE.Vector3(T.xs[i] - tmpT.z * half * sd, 0.07, T.zs[i] + tmpT.x * half * sd)); }
    const curve = new THREE.CatmullRomCurve3(pts);
    const rail = mesh(new THREE.TubeGeometry(curve, pts.length * 2, 0.075, 6), railMat); rail.castShadow = false;
    levelGroup.add(rail);
  }
  // cổng vào
  T.tan(0, tmpT);
  const gate = new THREE.Group(); gate.position.set(T.xs[0] - tmpT.x * 0.1, 0, T.zs[0] - tmpT.z * 0.1);
  gate.rotation.y = Math.atan2(tmpT.x, tmpT.z);
  const stone = M(0xb7a58a, { r: 0.8, flat: true }), gem = M(th.ring, { e: th.ring, ei: 0.8, r: 0.2 });
  const arch = mesh(new THREE.TorusGeometry(0.72, 0.17, 10, 24, Math.PI), stone, 0, 0.55, 0); gate.add(arch);
  for (const sx of [-1, 1]) gate.add(mesh(new THREE.CylinderGeometry(0.17, 0.2, 0.6, 10), stone, sx * 0.72, 0.28, 0));
  gate.add(mesh(new THREE.OctahedronGeometry(0.18, 0), gem, 0, 1.42, 0));
  const glow = new THREE.Mesh(new THREE.CircleGeometry(0.62, 24, 0, Math.PI), new THREE.MeshBasicMaterial({ color: th.ring, transparent: true, opacity: 0.35, side: THREE.DoubleSide, depthWrite: false }));
  glow.position.set(0, 0.55, -0.05); gate.add(glow);
  levelGroup.add(gate);
  // hố xoáy cuối đường
  const ex = T.xs[T.n - 1], ez = T.zs[T.n - 1];
  const hole = new THREE.Group(); hole.position.set(ex, 0, ez);
  const pit = new THREE.Mesh(new THREE.CircleGeometry(0.85, 32), new THREE.MeshBasicMaterial({ map: canvasTex(128, 128, (g) => { const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, '#000'); gr.addColorStop(0.6, '#120822'); gr.addColorStop(1, '#3a2266'); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); }) }));
  pit.rotation.x = -Math.PI / 2; pit.position.y = 0.025; hole.add(pit);
  const swirl = new THREE.Mesh(new THREE.CircleGeometry(0.8, 32), new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false, map: canvasTex(128, 128, (g) => {
    g.translate(64, 64); g.lineWidth = 5;
    for (let a = 0; a < 4; a++) { g.strokeStyle = 'rgba(190,140,255,.55)'; g.beginPath(); for (let t = 0; t < 1; t += 0.02) { const r = t * 60, ang = a * Math.PI / 2 + t * 5; g.lineTo(Math.cos(ang) * r, Math.sin(ang) * r); } g.stroke(); }
  }) }));
  swirl.rotation.x = -Math.PI / 2; swirl.position.y = 0.03; hole.add(swirl);
  const ringMat = M(th.ring, { e: th.ring, ei: 0.5, r: 0.3, m: 0.5 });
  const rim = mesh(new THREE.TorusGeometry(0.86, 0.13, 12, 40), ringMat, 0, 0.06, 0); rim.rotation.x = Math.PI / 2; hole.add(rim);
  for (let i = 0; i < 6; i++) { const a = i / 6 * TAU; hole.add(mesh(new THREE.OctahedronGeometry(0.1, 0), gem, Math.cos(a) * 0.86, 0.2, Math.sin(a) * 0.86)); }
  levelGroup.add(hole);
  levelFx.holes.push({ ringMat, base: new THREE.Color(th.ring), T });
  levelFx.swirls.push(swirl);
}

function buildLevel(L, demo = false) {
  disposeGroup(levelGroup);
  for (const d of dynamic) d.dispose(); dynamic.length = 0;
  levelFx.holes = []; levelFx.swirls = [];
  const def = levelDef(L); const W = WORLDS[def.w]; const th = THEMES[W.theme];
  game.L = L; game.def = def; game.theme = W.theme;
  const dims = fieldDims(); game.HX = dims.HX; game.HZ = dims.HZ; game.portrait = dims.portrait;
  const map = (nx, nz) => (game.portrait ? [nz * game.HX * 0.9, nx * game.HZ * 0.9] : [nx * game.HX * 0.9, nz * game.HZ * 0.9]);
  const S = def.dual ? DUAL_SHAPES[def.shape] : SHAPES[def.shape];
  let shapes, shooter;
  if (def.dual) {
    const base = S.gen();
    shapes = [base.map(([x, z]) => [x * 0.38 - 0.58, z]), base.map(([x, z]) => [-(x * 0.38 - 0.58), -z])];
    shooter = [0, 0];
  } else { shapes = [S.gen()]; shooter = S.shooter; }
  game.tracks = shapes.map((sp) => new Track(sp.map(([x, z]) => map(x, z))));
  [game.sx, game.sz] = map(shooter[0], shooter[1]);
  game.shapeName = S.name;

  // ánh sáng, nền
  scene.background = new THREE.Color(th.bg);
  scene.fog = new THREE.Fog(th.fog, 30, 90);
  hemi.color.set(th.hemiS); hemi.groundColor.set(th.hemiG); hemi.intensity = th.hemiI;
  sun.color.set(th.sun); sun.intensity = th.sunI;
  renderer.toneMappingExposure = th.exposure;
  const ext = Math.max(game.HX, game.HZ) + 3;
  sun.position.set(ext * 0.5, 18, ext * 0.7); sun.target.position.set(0, 0, 0);
  Object.assign(sun.shadow.camera, { left: -ext, right: ext, top: ext, bottom: -ext, near: 1, far: 60 });
  sun.shadow.camera.updateProjectionMatrix();

  const gt = groundTextures(W.theme);
  const gw = game.HX * 2 + 40, gh = game.HZ * 2 + 40;
  gt.map.repeat.set(gw / 7, gh / 7); if (gt.emi) gt.emi.repeat.set(gw / 7, gh / 7);
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(gw, gh), new THREE.MeshStandardMaterial({ map: gt.map, emissiveMap: gt.emi, emissive: gt.emi ? 0xffffff : 0x000000, emissiveIntensity: gt.emi ? 0.8 : 0, roughness: W.theme === 'bay' || W.theme === 'ice' ? 0.35 : 0.95 }));
  ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; levelGroup.add(ground);
  levelFx.groundTex = W.theme === 'bay' ? gt.map : null;

  for (const T of game.tracks) buildTrackVisual(T, th);

  // trang trí, tránh đường ray & rồng
  const rand = rng(L * 7919 + 13);
  const near = (x, z, rad) => {
    if (Math.hypot(x - game.sx, z - game.sz) < rad + 1.6) return true;
    for (const T of game.tracks) {
      for (let i = 0; i < T.n; i += 4) { const dx = T.xs[i] - x, dz = T.zs[i] - z; if (dx * dx + dz * dz < (rad + 0.95) ** 2) return true; }
      if (Math.hypot(T.xs[T.n - 1] - x, T.zs[T.n - 1] - z) < rad + 1.3) return true;
    }
    return false;
  };
  buildDecor(W.theme, rand, (obj, size, big) => {
    for (let a = 0; a < 25; a++) {
      const x = (rand() * 2 - 1) * (game.HX + 2.5), z = (rand() * 2 - 1) * (game.HZ + 2.5);
      const inside = Math.abs(x) < game.HX && Math.abs(z) < game.HZ;
      if (big && inside && rand() < 0.6) continue;
      if (near(x, z, size)) continue;
      obj.position.set(x, 0, z); obj.rotation.y = obj.rotation.y || rand() * TAU;
      const s = 0.85 + rand() * 0.35; obj.scale.multiplyScalar(s);
      levelGroup.add(obj); return;
    }
  });
  initAmbient(th.amb);

  dragon.group.position.set(game.sx, 0, game.sz);
  dragon.st.mood = 'idle';

  // trạng thái ván
  game.shots.forEach((s) => s.mesh && levelGroup.remove(s.mesh));
  game.shots = []; game.score = 0; game.chain = 0; game.streak = 0; game.maxProg = 0;
  game.freezeT = 0; game.reverseT = 0; game.cooldown = 0; game.killed = 0; game.powerQ = [];
  game.endT = 0; game.shake = 0; game.danger = 0;
  for (const T of game.tracks) { T.spawnLeft = def.count; T.balls = []; }
  game.total = def.count * game.tracks.length;
  if (demo) {
    // chuỗi trang trí đứng yên cho màn hình menu
    for (const T of game.tracks) {
      const n = Math.min(Math.floor(T.len * 0.42 / D), 34);
      for (let i = 0; i < n; i++) { const b = makeBall(spawnColor(T)); b.s = b.vs = (n - 1 - i) * D + 0.3; T.balls.push(b); }
      T.balls.sort((a, b) => a.s - b.s);
      T.spawnLeft = 0;
    }
  }
  refreshPresent();
  game.cur = newAmmo(); game.next = newAmmo(); dragon.setAmmo(game.cur, game.next);
  fitCamera();
  updateVisuals(0);
}

// ═════════════════════════ camera ═════════════════════════
const camTarget = new THREE.Vector3();
function fitCamera() {
  const w = innerWidth, h = innerHeight;
  renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
  const tilt = game.portrait ? 1.12 : 1.0;
  const dir = new THREE.Vector3(0, -Math.sin(tilt), -Math.cos(tilt));
  const HX = game.HX * 0.9 + 0.9, HZ = game.HZ * 0.9 + 0.9;
  const pts = [[-HX, 0, -HZ], [HX, 0, -HZ], [-HX, 0, HZ], [HX, 0, HZ], [-HX, 0.6, -HZ], [HX, 0.6, -HZ]].map((p) => new THREE.Vector3(...p));
  const hudPx = 66, botPx = 10;
  const top = 1 - 2 * hudPx / h, bot = -1 + 2 * botPx / h;
  const v = new THREE.Vector3();
  const measure = (dist, tz) => {
    camTarget.set(0, 0, tz);
    camera.position.copy(camTarget).addScaledVector(dir, -dist); camera.lookAt(camTarget); camera.updateMatrixWorld();
    let mx = 0, minY = 9, maxY = -9;
    for (const p of pts) { v.copy(p).project(camera); mx = Math.max(mx, Math.abs(v.x)); minY = Math.min(minY, v.y); maxY = Math.max(maxY, v.y); }
    return { mx, minY, maxY };
  };
  let tz = 0, dist = 20;
  for (let outer = 0; outer < 3; outer++) {
    let lo = 3, hi = 150;
    for (let i = 0; i < 30; i++) {
      const mid = (lo + hi) / 2; const m = measure(mid, tz);
      if (m.mx <= 0.98 && m.maxY - m.minY <= top - bot) hi = mid; else lo = mid;
    }
    dist = hi;
    const c0 = measure(dist, tz), c1 = measure(dist, tz + 0.5);
    const mid0 = (c0.maxY + c0.minY) / 2, mid1 = (c1.maxY + c1.minY) / 2, want = (top + bot) / 2;
    if (Math.abs(mid1 - mid0) > 1e-6) tz += (want - mid0) * 0.5 / (mid1 - mid0);
  }
  measure(dist, tz);
  game.camBase = camera.position.clone();
}

// ═════════════════════════ ngọc & chuỗi ═════════════════════════
function makeBall(color) {
  const b = { color, s: 0, vs: 0, off: 0, lastVs: 0, power: null, powerT: 0, ice: false, ins: 0, fx: 0, fz: 0, pv: 0, mesh: null, icon: null, iceMesh: null };
  b.mesh = new THREE.Mesh(ballGeo, ballMats[color]); b.mesh.castShadow = true;
  b.mesh.rotation.set(Math.random() * 6, Math.random() * 6, Math.random() * 6);
  levelGroup.add(b.mesh);
  return b;
}
function setPower(b, type) {
  b.power = type; b.powerT = 16;
  b.icon = new THREE.Sprite(powerMats[type]); b.icon.scale.set(0.62, 0.62, 0.62); b.icon.renderOrder = 5; levelGroup.add(b.icon);
}
function clearPower(b) { if (b.icon) { levelGroup.remove(b.icon); b.icon = null; } b.power = null; }
function setIce(b, on) {
  b.ice = on;
  if (on && !b.iceMesh) { b.iceMesh = new THREE.Mesh(iceGeo, iceMat); b.iceMesh.rotation.set(Math.random() * 3, Math.random() * 3, 0); levelGroup.add(b.iceMesh); }
  if (!on && b.iceMesh) {
    T_pos(b); burst(tmp.x, R, tmp.z, 0xdff7ff, 12, 3, 0.5); SFX.ice();
    levelGroup.remove(b.iceMesh); b.iceMesh = null;
  }
}
function T_pos(b) { for (const T of game.tracks) if (T.balls.includes(b)) return T.pos(b.vs, tmp); return tmp; }

function spawnColor(T) {
  const n = game.def.colors;
  if (T.lastColor >= 0 && T.run < 3 && Math.random() < 0.4) { T.run++; return T.lastColor; }
  let c; do { c = Math.floor(Math.random() * n); } while (c === T.lastColor && Math.random() < 0.7);
  T.lastColor = c; T.run = 1; return c;
}
function refreshPresent() {
  const p = game.present; p.clear();
  for (const T of game.tracks) for (const b of T.balls) if (!b.ice) p.add(b.color);
  if (!p.size) {
    for (const T of game.tracks) for (const b of T.balls) p.add(b.color);
    if (!p.size) for (let i = 0; i < (game.def ? game.def.colors : 4); i++) p.add(i);
  }
}
function pickColor() { const arr = [...game.present]; return arr[Math.floor(Math.random() * arr.length)]; }
function newAmmo() { return { color: pickColor(), special: null }; }
function validateAmmo() {
  let changed = false;
  for (const a of [game.cur, game.next]) {
    if (!a.special && !game.present.has(a.color)) { a.color = pickColor(); changed = true; }
  }
  if (changed) { dragon.setAmmo(game.cur, game.next); updateSwapDot(); }
}

function pushPass(T) {
  const B = T.balls;
  for (let i = 1; i < B.length; i++) {
    const m = B[i - 1].s + D;
    if (B[i].s < m) { B[i].off -= m - B[i].s; B[i].s = m; }
  }
}

function trackSpeed(T) {
  const B = T.balls; if (!B.length) return game.def.speed;
  if (game.reverseT > 0) return -3.2;
  if (game.freezeT > 0) return 0;
  const prog = B[B.length - 1].s / T.len;
  if (T.rush) {
    if (prog < game.def.rushFrac && T.spawnLeft > 0) return 9;
    T.rush = false;
  }
  return game.def.speed * (1 - 0.45 * smooth(0.55, 0.95, prog));
}

function updateTrack(T, dt) {
  const B = T.balls;
  // sinh ngọc mới từ cổng
  while (T.spawnLeft > 0 && (B.length === 0 || B[0].s >= 0)) {
    const b = makeBall(spawnColor(T));
    b.s = b.vs = b.lastVs = B.length ? B[0].s - D : 0;
    if (game.def.ice && Math.random() < game.def.ice && B.length > 2) setIce(b, true);
    else if (Math.random() < game.def.powerRate && B.filter((x) => x.power).length < 2 && B.length > 4) setPower(b, game.def.powers[Math.floor(Math.random() * game.def.powers.length)]);
    B.unshift(b); T.spawnLeft--;
  }
  const n = B.length; if (!n) return;
  // tìm các đoạn rời nhau
  const starts = [0];
  for (let i = 1; i < n; i++) if (B[i].s - B[i - 1].s > D + 0.02) starts.push(i);
  // đoạn phía trước bị hút lùi nếu hai đầu cùng màu
  for (let k = starts.length - 1; k >= 1; k--) {
    const st = starts[k], en = (k + 1 < starts.length ? starts[k + 1] : n) - 1;
    const a = B[st - 1], b = B[st];
    if (a.color === b.color && !a.ice && !b.ice && a.ins <= 0 && b.ins <= 0) {
      b.pv = Math.min(b.pv + 26 * dt, 15);
      let d = b.pv * dt; const gap = b.s - a.s - D; let snapped = false;
      if (d >= gap) { d = gap; snapped = true; }
      for (let j = st; j <= en; j++) B[j].s -= d;
      if (snapped) { b.pv = 0; SFX.clack(); if (matchAt(T, st, true)) return; }
    } else b.pv = 0;
  }
  // đoạn cuối được đẩy từ cổng
  const end0 = starts.length > 1 ? starts[1] : n;
  let mv = trackSpeed(T) * dt;
  if (mv < 0 && B[0].s + mv < -2 * D) mv = Math.min(0, -2 * D - B[0].s);
  for (let j = 0; j < end0; j++) B[j].s += mv;
  pushPass(T);
}

function matchAt(T, i, fromChain) {
  const B = T.balls; const b = B[i]; if (!b || b.ice) return false;
  const c = b.color; let lo = i, hi = i;
  const ok = (j) => B[j].color === c && !B[j].ice && B[j].ins <= 0;
  while (lo > 0 && ok(lo - 1) && B[lo].s - B[lo - 1].s <= D + 0.05) lo--;
  while (hi < B.length - 1 && ok(hi + 1) && B[hi + 1].s - B[hi].s <= D + 0.05) hi++;
  const cnt = hi - lo + 1; if (cnt < 3) return false;
  if (fromChain) game.chain++;
  const mul = 1 + game.chain;
  const pts = (cnt * 10 + Math.max(0, cnt - 3) * 20) * mul;
  T.pos(B[(lo + hi) >> 1].vs, tmp2); const cx = tmp2.x, cz = tmp2.z;
  addScore(pts);
  floatText('+' + pts, cx, cz);
  if (game.chain >= 1) { floatText('Liên hoàn ×' + mul + '!', cx, cz - 0.9, true); SFX.chainUp(game.chain); dragon.st.hop = 1; }
  // phá băng hai bên
  const left = B[lo - 1], right = B[hi + 1];
  if (left && left.ice && B[lo].s - left.s <= D + 0.05) setIce(left, false);
  if (right && right.ice && right.s - B[hi].s <= D + 0.05) setIce(right, false);
  const removed = B.splice(lo, cnt);
  for (const r of removed) killBall(T, r);
  ring(cx, cz, COLORS[c].css, 1.6 + cnt * 0.15);
  SFX.pop(game.chain, cnt);
  processPowers();
  return true;
}

function killBall(T, b) {
  T.pos(b.vs, tmp);
  burst(tmp.x, R, tmp.z, COLORS[b.color].css, 12, 3.5, 0.7);
  dyingBall(b.mesh);
  if (b.iceMesh) { levelGroup.remove(b.iceMesh); b.iceMesh = null; }
  if (b.power) { game.powerQ.push({ type: b.power, x: tmp.x, z: tmp.z }); clearPower(b); }
  game.killed++;
}
function removeWhere(pred) {
  let n = 0;
  for (const T of game.tracks) {
    const B = T.balls;
    for (let i = B.length - 1; i >= 0; i--) {
      const b = B[i]; if (b.vs < 0 || !pred(b, T)) continue;
      B.splice(i, 1); killBall(T, b); n++;
    }
  }
  return n;
}
function processPowers() {
  let guard = 0;
  while (game.powerQ.length && guard++ < 20) {
    const p = game.powerQ.shift();
    toast(POWERS[p.type].emoji + ' ' + POWERS[p.type].name);
    if (p.type === 'bomb') {
      const n = removeWhere((b, T) => { T.pos(b.vs, tmp2); return Math.hypot(tmp2.x - p.x, tmp2.z - p.z) < 2.5; });
      addScore(n * 10); if (n) floatText('+' + n * 10, p.x, p.z);
      burst(p.x, 0.5, p.z, '#ff8a2e', 60, 7, 0.9, 5); burst(p.x, 0.5, p.z, '#ffe08a', 30, 4, 0.6, 4);
      ring(p.x, p.z, '#ff9a3e', 4.5, 0.6); SFX.boom(); game.shake = 0.5;
    } else if (p.type === 'freeze') { game.freezeT = 5; game.reverseT = 0; SFX.freeze(); $('frost').style.opacity = 1; }
    else if (p.type === 'reverse') { game.reverseT = 2.8; game.freezeT = 0; SFX.reverse(); }
    else if (p.type === 'bolt') { game.cur = { color: game.cur.color, special: 'bolt' }; dragon.setAmmo(game.cur, game.next); SFX.magic(); }
    else if (p.type === 'rainbow') { game.cur = { color: game.cur.color, special: 'rainbow' }; dragon.setAmmo(game.cur, game.next); SFX.magic(); }
  }
}

function addScore(n) { game.score += n; $('score').textContent = game.score.toLocaleString('vi-VN'); }

// ═════════════════════════ bắn ═════════════════════════
function fire() {
  if (game.state !== 'play' || game.cooldown > 0 || !game.cur) return;
  const ax = game.aim.x, az = game.aim.z;
  const mp = dragon.mouthWorld();
  if (game.cur.special === 'bolt') {
    const far = 40; const x1 = game.sx + ax * far, z1 = game.sz + az * far;
    const n = removeWhere((b, T) => {
      T.pos(b.vs, tmp2); const dx = tmp2.x - game.sx, dz = tmp2.z - game.sz;
      const t = dx * ax + dz * az; const perp = Math.abs(dx * az - dz * ax);
      return t > 0 && perp < D * 0.75;
    });
    addScore(n * 15); if (n) floatText('+' + n * 15, game.sx + ax * 3, game.sz + az * 3, true);
    beam(mp.x, mp.z, x1, z1); SFX.zap(); game.shake = 0.25;
    processPowers();
  } else {
    const m = new THREE.Mesh(ballGeo, game.cur.special === 'rainbow' ? rainbowMat : ballMats[game.cur.color]);
    m.castShadow = true; m.position.copy(mp); levelGroup.add(m);
    game.shots.push({ x: mp.x, z: mp.z, y: mp.y, dx: ax, dz: az, color: game.cur.color, special: game.cur.special, mesh: m });
    SFX.shoot();
  }
  game.cur = game.next; game.next = newAmmo();
  dragon.setAmmo(game.cur, game.next); updateSwapDot();
  dragon.st.recoil = 1; game.cooldown = 0.15;
}
function swapAmmo() {
  if (game.state !== 'play') return;
  [game.cur, game.next] = [game.next, game.cur];
  dragon.setAmmo(game.cur, game.next); dragon.st.swapT = 1; updateSwapDot(); SFX.swap();
}
function updateSwapDot() {
  const n = game.next; const el = $('swapDot');
  el.style.background = n.special === 'rainbow' ? 'conic-gradient(red,orange,yellow,lime,cyan,blue,magenta,red)' : n.special === 'bolt' ? '#bff6ff' : COLORS[n.color].css;
}

function findHit(x, z) {
  let best = null, bd = (D * 0.92) ** 2;
  for (const T of game.tracks) {
    const B = T.balls;
    for (let i = 0; i < B.length; i++) {
      const b = B[i]; if (b.vs < R) continue;
      T.pos(b.vs, tmp2); const dx = tmp2.x - x, dz = tmp2.z - z; const d = dx * dx + dz * dz;
      if (d < bd) { bd = d; best = { T, i }; }
    }
  }
  return best;
}
function updateShots(dt) {
  for (let i = game.shots.length - 1; i >= 0; i--) {
    const sh = game.shots[i];
    const dist = SHOT_SPEED * dt, steps = Math.max(1, Math.ceil(dist / 0.2));
    let hit = null;
    for (let s = 0; s < steps && !hit; s++) { sh.x += sh.dx * dist / steps; sh.z += sh.dz * dist / steps; hit = findHit(sh.x, sh.z); }
    sh.y = lerp(sh.y, R + 0.02, Math.min(1, dt * 12));
    sh.mesh.position.set(sh.x, sh.y, sh.z); sh.mesh.rotation.x += dt * 12;
    if (hit) { insertShot(hit.T, hit.i, sh); levelGroup.remove(sh.mesh); game.shots.splice(i, 1); }
    else if (Math.abs(sh.x) > game.HX + 4 || Math.abs(sh.z) > game.HZ + 4) { levelGroup.remove(sh.mesh); game.shots.splice(i, 1); game.streak = 0; }
  }
}
function insertShot(T, hi, sh) {
  const B = T.balls, hb = B[hi];
  T.pos(hb.vs, tmp); T.tan(hb.vs, tmpT);
  const ahead = (sh.x - tmp.x) * tmpT.x + (sh.z - tmp.z) * tmpT.z > 0;
  const idx = ahead ? hi + 1 : hi;
  const s = ahead ? hb.s + D : hb.s;
  const color = sh.special === 'rainbow' ? hb.color : sh.color;
  const b = makeBall(color);
  b.s = b.vs = b.lastVs = s; b.ins = INS; b.fx = sh.x; b.fz = sh.z;
  B.splice(idx, 0, b);
  pushPass(T);
  game.chain = 0;
  SFX.clack();
}

// ═════════════════════════ vòng cập nhật ═════════════════════════
function updatePlay(dt) {
  game.cooldown = Math.max(0, game.cooldown - dt);
  if (game.freezeT > 0) { game.freezeT -= dt; if (game.freezeT <= 0) $('frost').style.opacity = 0; }
  if (game.reverseT > 0) game.reverseT -= dt;
  for (const T of game.tracks) updateTrack(T, dt);
  updateShots(dt);
  // chèn xong → kiểm tra ghép
  for (const T of game.tracks) {
    for (let i = 0; i < T.balls.length; i++) {
      const b = T.balls[i];
      if (b.ins > 0) {
        b.ins -= dt;
        if (b.ins <= 0) {
          b.ins = 0;
          if (matchAt(T, i, false)) { game.streak++; if (game.streak >= 3 && game.streak % 3 === 0) { const bonus = game.streak * 20; addScore(bonus); T.pos(b.vs, tmp); floatText('Bắn liền ' + game.streak + '! +' + bonus, tmp.x, tmp.z + 0.8, true, '#9ff3ff'); } }
          else game.streak = 0;
          i = -1; // chuỗi đã đổi, duyệt lại
        }
      }
      if (b.power) { b.powerT -= dt; if (b.powerT <= 0) clearPower(b); }
    }
  }
  refreshPresent(); validateAmmo();
  // tiến độ & nguy hiểm
  let prog = 0;
  for (const T of game.tracks) if (T.balls.length) prog = Math.max(prog, T.balls[T.balls.length - 1].s / T.len);
  game.maxProg = Math.max(game.maxProg, prog);
  game.danger = smooth(0.78, 0.97, prog);
  $('danger').style.opacity = game.danger * (0.55 + 0.45 * Math.sin(game.time * 8));
  if (game.danger > 0.05) { game.beatT -= dt; if (game.beatT <= 0) { SFX.beat(); game.beatT = lerp(1.0, 0.45, game.danger); } }
  const left = game.tracks.reduce((a, T) => a + T.spawnLeft + T.balls.length, 0);
  $('barFill').style.height = (clamp(1 - left / game.total, 0, 1) * 100).toFixed(1) + '%';
  // thua
  for (const T of game.tracks) {
    const B = T.balls;
    if (B.length && B[B.length - 1].s >= T.len) { startLose(); return; }
  }
  // thắng
  if (left === 0 && !game.shots.length) startWin();
}

function updateVisuals(dt) {
  for (const T of game.tracks) {
    for (const b of T.balls) {
      b.off *= Math.exp(-dt * 16); if (Math.abs(b.off) < 0.001) b.off = 0;
      b.vs = b.s + b.off;
      const ds = b.vs - b.lastVs; b.lastVs = b.vs;
      T.pos(b.vs, tmp); T.tan(b.vs, tmpT);
      let x = tmp.x, z = tmp.z, y = R + 0.02, sc = 1;
      if (b.ins > 0) { const k = 1 - b.ins / INS; const e = k * (2 - k); x = lerp(b.fx, x, e); z = lerp(b.fz, z, e); }
      if (b.vs < 0) sc = clamp(1 + b.vs / D, 0, 1);
      if (b.vs > T.len) { const e = clamp((b.vs - T.len) / D, 0, 1); sc = 1 - e; y -= e * 0.5; }
      b.mesh.visible = sc > 0.02;
      b.mesh.position.set(x, y, z); b.mesh.scale.setScalar(Math.max(0.001, sc));
      if (ds !== 0) { qAxis.set(tmpT.z, 0, -tmpT.x).normalize(); qTmp.setFromAxisAngle(qAxis, ds / R); b.mesh.quaternion.premultiply(qTmp); }
      if (b.icon) { b.icon.position.set(x, y + 0.75, z); const p = 0.62 + Math.sin(game.time * 6) * 0.06; b.icon.scale.set(p, p, p); b.icon.visible = sc > 0.5; b.icon.material.opacity = b.powerT < 3 ? 0.4 + 0.6 * Math.abs(Math.sin(game.time * 8)) : 1; }
      if (b.iceMesh) { b.iceMesh.position.set(x, y, z); b.iceMesh.scale.setScalar(Math.max(0.001, sc)); b.iceMesh.visible = sc > 0.02; }
    }
  }
  for (const h of levelFx.holes) {
    const T = h.T; const p = T.balls.length ? T.balls[T.balls.length - 1].s / T.len : 0;
    const d = smooth(0.75, 0.97, p);
    h.ringMat.emissive.copy(h.base).lerp(dangerColor, d);
    h.ringMat.emissiveIntensity = 0.5 + d * (1.5 + Math.sin(game.time * 10));
  }
  for (const s of levelFx.swirls) s.rotation.z -= dt * 2.2;
  if (levelFx.groundTex) { levelFx.groundTex.offset.x = Math.sin(game.time * 0.2) * 0.05; levelFx.groundTex.offset.y = game.time * 0.01; }
}
const qAxis = new THREE.Vector3(), qTmp = new THREE.Quaternion(), dangerColor = new THREE.Color(0xff1a1a);

// ═════════════════════════ chuỗi ngọc: dẫn hướng ngắm ═════════════════════════
const aimDots = [];
const aimMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.7, depthWrite: false });
const aimGeo = new THREE.SphereGeometry(0.07, 8, 6);
for (let i = 0; i < 40; i++) { const m = new THREE.Mesh(aimGeo, aimMat); m.visible = false; scene.add(m); aimDots.push(m); }
function updateAim() {
  const show = game.state === 'play' && game.aimShow;
  const ax = game.aim.x, az = game.aim.z;
  let x = game.sx + ax * 1.3, z = game.sz + az * 1.3, i = 0;
  if (show) {
    aimMat.color.set(game.cur.special === 'bolt' ? '#bff6ff' : game.cur.special === 'rainbow' ? '#ffffff' : COLORS[game.cur.color].css);
    for (; i < aimDots.length; i++) {
      x += ax * 0.45; z += az * 0.45;
      if (Math.abs(x) > game.HX + 1 || Math.abs(z) > game.HZ + 1) break;
      if (game.cur.special !== 'bolt' && findHit(x, z)) break;
      const m = aimDots[i]; m.visible = true; m.position.set(x, R, z);
      m.scale.setScalar(1 + 0.3 * Math.sin(game.time * 8 - i * 0.6));
    }
  }
  for (; i < aimDots.length; i++) aimDots[i].visible = false;
}

// ═════════════════════════ thắng / thua ═════════════════════════
function startLose() {
  game.state = 'losing'; game.endT = 0; dragon.st.mood = 'sad'; SFX.lose();
  for (const s of game.shots) levelGroup.remove(s.mesh); game.shots = [];
  $('frost').style.opacity = 0;
}
function updateLosing(dt) {
  game.endT += dt;
  for (const T of game.tracks) {
    const B = T.balls; if (!B.length) continue;
    for (const b of B) b.s += 16 * dt;
    pushPass(T);
    for (let i = B.length - 1; i >= 0; i--) if (B[i].s > T.len + D) { levelGroup.remove(B[i].mesh); if (B[i].icon) levelGroup.remove(B[i].icon); if (B[i].iceMesh) levelGroup.remove(B[i].iceMesh); B.splice(i, 1); if (Math.random() < 0.3) SFX.sink(); }
  }
  $('danger').style.opacity = 0.6;
  if (game.endT > 2.4 || game.tracks.every((T) => !T.balls.length) && game.endT > 1) {
    game.state = 'lost'; $('danger').style.opacity = 0;
    $('loseScore').textContent = game.score.toLocaleString('vi-VN') + ' điểm';
    showOverlay('ovLose'); hideHud();
  }
}
function startWin() {
  game.state = 'winning'; game.endT = 0; dragon.st.mood = 'win'; SFX.win();
  $('danger').style.opacity = 0; $('frost').style.opacity = 0;
  burst(game.sx, 1.5, game.sz, '#ffd25a', 80, 6, 1.2, 7); burst(game.sx, 1.5, game.sz, '#2ec4a0', 50, 5, 1.0, 6);
}
function updateWinning(dt) {
  game.endT += dt;
  if (Math.random() < dt * 6) burst(game.sx + (Math.random() - 0.5) * 8, 1, game.sz + (Math.random() - 0.5) * 6, COLORS[Math.floor(Math.random() * 6)].css, 25, 4, 1, 6);
  if (game.endT > 1.8) {
    game.state = 'won';
    const stars = game.maxProg < 0.6 ? 3 : game.maxProg < 0.85 ? 2 : 1;
    const L = game.L; const prevBest = save.best[L] || 0;
    save.stars[L] = Math.max(save.stars[L] || 0, stars);
    save.best[L] = Math.max(prevBest, game.score); persist();
    $('winTitle').textContent = L === 49 ? 'Bạn đã phá đảo!' : 'Qua màn!';
    $('winScore').textContent = game.score.toLocaleString('vi-VN') + ' điểm';
    $('winBest').textContent = game.score > prevBest ? '🏆 Kỷ lục mới!' : 'Kỷ lục: ' + prevBest.toLocaleString('vi-VN');
    $('winTip').textContent = stars < 3 ? `Chuỗi đã lăn tới ${Math.round(game.maxProg * 100)}% đường — giữ dưới 60% để được 3 sao.` : 'Giữ chuỗi thật xa hố xoáy — tuyệt vời!';
    $('btnNext').classList.toggle('hidden', L >= 49);
    const spans = $('winStars').children;
    for (let i = 0; i < 3; i++) { spans[i].classList.remove('on'); if (i < stars) setTimeout(() => { spans[i].classList.add('on'); SFX.star(i); }, 350 + i * 300); }
    showOverlay('ovWin'); hideHud();
  }
}

// ═════════════════════════ input ═════════════════════════
const raycaster = new THREE.Raycaster(), ndc = new THREE.Vector2();
const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -R), hitP = new THREE.Vector3();
function pointerToPlane(e) {
  ndc.set(e.clientX / innerWidth * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
  raycaster.setFromCamera(ndc, camera);
  return raycaster.ray.intersectPlane(plane, hitP);
}
function aimAt(p) {
  const dx = p.x - game.sx, dz = p.z - game.sz, l = Math.hypot(dx, dz);
  if (l < 0.3) return false;
  game.aim.x = dx / l; game.aim.z = dz / l; return true;
}
let touchAim = null;
canvas.addEventListener('contextmenu', (e) => e.preventDefault());
canvas.addEventListener('pointermove', (e) => {
  if (game.state !== 'play') return;
  const p = pointerToPlane(e); if (!p) return;
  if (e.pointerType === 'mouse') { aimAt(p); game.aimShow = true; }
  else if (touchAim && touchAim.id === e.pointerId) { if (aimAt(p)) touchAim.moved = true; }
});
canvas.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse') game.aimShow = false; });
canvas.addEventListener('pointerdown', (e) => {
  SFX.init();
  if (game.state !== 'play') return;
  const p = pointerToPlane(e); if (!p) return;
  const onDragon = Math.hypot(p.x - game.sx, p.z - game.sz) < 1.25;
  if (e.pointerType === 'mouse') {
    if (e.button === 2 || (e.button === 0 && onDragon)) { swapAmmo(); return; }
    if (e.button === 0) { aimAt(p); fire(); }
  } else {
    if (onDragon) { swapAmmo(); return; }
    touchAim = { id: e.pointerId, moved: false }; aimAt(p); game.aimShow = true;
    canvas.setPointerCapture(e.pointerId);
  }
});
canvas.addEventListener('pointerup', (e) => {
  if (e.pointerType === 'mouse' || !touchAim || touchAim.id !== e.pointerId) return;
  touchAim = null; game.aimShow = false; fire();
});
canvas.addEventListener('pointercancel', () => { touchAim = null; game.aimShow = false; });
addEventListener('keydown', (e) => {
  if (e.code === 'Space') { e.preventDefault(); swapAmmo(); }
  else if (e.code === 'KeyP' || e.code === 'Escape') { if (game.state === 'play') pauseGame(); else if (game.state === 'paused' && $('ovHelp').classList.contains('hidden')) resumeGame(); }
});
$('swapBtn').addEventListener('click', () => { SFX.init(); swapAmmo(); });
document.addEventListener('visibilitychange', () => { if (document.hidden && game.state === 'play') pauseGame(); });

// ═════════════════════════ màn hình / UI ═════════════════════════
const SCREENS = ['scrMenu', 'scrWorlds', 'scrLevels', 'ovPause', 'ovWin', 'ovLose'];
function showOverlay(id) { for (const s of SCREENS) $(s).classList.toggle('hidden', s !== id); }
function showHud() { $('hud').classList.remove('hidden'); $('swapBtn').classList.remove('hidden'); $('hint').classList.remove('hidden'); }
function hideHud() { $('hud').classList.add('hidden'); $('swapBtn').classList.add('hidden'); $('hint').classList.add('hidden'); game.aimShow = false; }
// biểu tượng cho các nút tròn trên thanh trên cùng (nút trong menu vẫn dùng chữ)
const ICONS = {
  sound: '<svg viewBox="0 0 24 24"><path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" fill="currentColor"/><path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11"/></svg>',
  mute: '<svg viewBox="0 0 24 24"><path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" fill="currentColor"/><path d="M16 9.5l5 5M21 9.5l-5 5"/></svg>',
  full: '<svg viewBox="0 0 24 24"><path d="M4 9V4h5M15 4h5v5M20 15v5h-5M9 20H4v-5"/></svg>',
  exitFull: '<svg viewBox="0 0 24 24"><path d="M9 4v5H4M20 9h-5V4M15 20v-5h5M4 15h5v5"/></svg>',
};
function syncToggles() {
  for (const id of ['togSound1', 'togSound2']) $(id).classList.toggle('off', !save.sound);
  for (const id of ['togMusic1', 'togMusic2']) $(id).classList.toggle('off', !save.music);
  $('btnSound').innerHTML = save.sound ? ICONS.sound : ICONS.mute;
  $('btnSound').setAttribute('aria-label', save.sound ? 'Âm thanh: đang bật' : 'Âm thanh: đang tắt');
  $('btnSound').title = save.sound ? 'Tắt âm thanh' : 'Bật âm thanh';
  $('btnSound').classList.toggle('off', !save.sound);
}
let selWorld = 0;
// bản đồ thế giới: mỗi khu là một hòn đảo, rồng con đi dọc con đường giữa các khu
const worldStars = (w) => { let st = 0; for (let k = 0; k < 10; k++) st += save.stars[w * 10 + k] || 0; return st; };
const worldMap = createWorldMap({
  svg: $('worldMap'), card: $('mapCard'), worlds: WORLDS, save, persist, toast,
  isOpen: (w) => unlocked(w * 10),
  stars: worldStars,
  cleared: (w) => { let n = 0; for (let k = 0; k < 10; k++) if (save.stars[w * 10 + k]) n++; return n; },
  onEnter: (w) => { SFX.click(); selWorld = w; renderLevels(); showOverlay('scrLevels'); buildLevel(w * 10, true); },
  sfx: (k) => { if (k === 'hop') SFX.click(); else if (k === 'arrive') SFX.star(0); else if (k === 'locked') SFX.sink(); else if (k === 'unlock') SFX.magic(); },
});
// gọi sau khi màn bản đồ đã hiện (cần kích thước thật để chọn bố cục ngang / dọc)
function renderWorlds(w) {
  let total = 0; WORLDS.forEach((W, k) => { total += worldStars(k); });
  $('totalStars').textContent = `★ ${total} / ${WORLDS.length * 30}`;
  worldMap.open(w);
}
addEventListener('keydown', (e) => {
  if ($('scrWorlds').classList.contains('hidden') || !$('ovHelp').classList.contains('hidden')) return;
  if (worldMap.key(e)) e.preventDefault();
});
function renderLevels() {
  const W = WORLDS[selWorld];
  $('lvTitle').textContent = W.name; $('lvDesc').textContent = W.desc;
  const grid = $('levelGrid'); grid.innerHTML = '';
  for (let k = 0; k < 10; k++) {
    const L = selWorld * 10 + k, open = unlocked(L), st = save.stars[L] || 0;
    const el = document.createElement('button'); el.className = 'lv' + (open ? '' : ' locked') + (st ? ' done' : '');
    el.innerHTML = open ? `${k + 1}<div class="st">${'★'.repeat(st)}${'☆'.repeat(3 - st)}</div>` : `${k + 1}<div class="lk">Khoá</div>`;
    if (open) el.onclick = () => { SFX.click(); startLevel(L); };
    grid.appendChild(el);
  }
}
function startLevel(L) {
  SFX.init();
  buildLevel(L);
  const def = game.def, W = WORLDS[def.w];
  $('lvName').textContent = `${W.emoji} ${def.w + 1}-${def.k + 1} · ${game.shapeName}`;
  $('score').textContent = '0'; $('barFill').style.height = '0%';
  showOverlay(null); showHud(); updateSwapDot();
  game.state = 'play'; game.aimShow = !isTouch;
  SFX.startMusic(W.theme); SFX.rush();
  toast(`Màn ${def.w + 1}-${def.k + 1}`);
  if (!save.seenHelp) { save.seenHelp = true; persist(); openHelp(); }
}
function pauseGame() { if (game.state !== 'play') return; game.state = 'paused'; showOverlay('ovPause'); SFX.stopMusic(); }
function resumeGame() { game.state = 'play'; showOverlay(null); SFX.startMusic(game.theme); }
let helpReturn = null;
function openHelp() {
  if (game.state === 'play') { game.state = 'paused'; helpReturn = 'play'; } else helpReturn = null;
  $('ovHelp').classList.remove('hidden');
}
function closeHelp() { $('ovHelp').classList.add('hidden'); if (helpReturn === 'play' && $('ovPause').classList.contains('hidden')) game.state = 'play'; helpReturn = null; }
function toMenu() { game.state = 'menu'; hideHud(); SFX.stopMusic(); showOverlay('scrMenu'); }

document.addEventListener('click', (e) => {
  const b = e.target.closest('[data-act]'); if (!b) return;
  SFX.init();
  const act = b.dataset.act;
  if (act !== 'tsound') SFX.click();
  switch (act) {
    case 'play': showOverlay('scrWorlds'); renderWorlds(); break;
    case 'menu': showOverlay('scrMenu'); break;
    case 'worlds': game.state = 'menu'; hideHud(); SFX.stopMusic(); showOverlay('scrWorlds'); renderWorlds(selWorld); break;
    case 'levels': game.state = 'menu'; hideHud(); SFX.stopMusic(); selWorld = Math.floor(game.L / 10); renderLevels(); showOverlay('scrLevels'); buildLevel(selWorld * 10, true); break;
    case 'help': openHelp(); break;
    case 'closehelp': closeHelp(); break;
    case 'resume': resumeGame(); break;
    case 'retry': startLevel(game.L); break;
    case 'next': startLevel(Math.min(49, game.L + 1)); break;
    case 'tfull': toggleFullscreen(); break;
    case 'closefs': $('ovFsGuide').classList.add('hidden'); break;
    case 'tsound': save.sound = !save.sound; persist(); syncToggles(); SFX.click(); break;
    case 'tmusic': save.music = !save.music; persist(); syncToggles(); if (save.music && game.state !== 'menu') SFX.startMusic(game.theme); else if (!save.music) SFX.stopMusic(); break;
  }
});
// ── toàn màn hình (iOS không có Fullscreen API → hướng dẫn thêm vào Màn hình chính) ──
const docEl = document.documentElement;
const rawRequestFS = docEl.requestFullscreen || docEl.webkitRequestFullscreen;
const rawExitFS = document.exitFullscreen || document.webkitExitFullscreen;
const IS_IOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.maxTouchPoints > 1 && /Macintosh/.test(navigator.userAgent));
const IS_APP = navigator.standalone === true || matchMedia('(display-mode: standalone)').matches || matchMedia('(display-mode: fullscreen)').matches;
const USE_FS = !!rawRequestFS && !IS_IOS;
const isFS = () => !!(document.fullscreenElement || document.webkitFullscreenElement);
function toggleFullscreen() {
  if (IS_IOS) { $('ovFsGuide').classList.remove('hidden'); if (game.state === 'play') pauseGame(); return; }
  try {
    const r = isFS() ? rawExitFS.call(document) : rawRequestFS.call(docEl, { navigationUI: 'hide' });
    if (r && r.catch) r.catch(() => {});
  } catch (e) {}
}
function syncFS() {
  const on = isFS();
  document.querySelectorAll('.fsbtn').forEach((b) => {
    b.classList.toggle('fson', on);
    if (b.classList.contains('ico')) { b.innerHTML = on ? ICONS.exitFull : ICONS.full; b.title = on ? 'Thoát toàn màn hình (F)' : 'Toàn màn hình (F)'; }
    else b.textContent = on ? 'Thoát toàn màn hình' : 'Toàn màn hình';
    b.setAttribute('aria-label', on ? 'Thoát toàn màn hình' : 'Toàn màn hình');
  });
  setTimeout(fitCamera, 120);
}
if (IS_APP || (!USE_FS && !IS_IOS)) document.querySelectorAll('.fsbtn').forEach((b) => b.classList.add('hidden'));
document.addEventListener('fullscreenchange', syncFS);
document.addEventListener('webkitfullscreenchange', syncFS);
$('btnFull').innerHTML = ICONS.full; // icon ban đầu (syncFS chỉ chạy khi đổi chế độ)
$('btnFull').addEventListener('click', () => { SFX.init(); toggleFullscreen(); });
addEventListener('keydown', (e) => { if (e.code === 'KeyF' && !e.repeat) toggleFullscreen(); });

$('btnPause').addEventListener('click', () => { SFX.click(); pauseGame(); });
$('btnSound').addEventListener('click', () => { save.sound = !save.sound; save.music = save.sound; persist(); syncToggles(); if (save.music) SFX.startMusic(game.theme); else SFX.stopMusic(); });

addEventListener('resize', () => { fitCamera(); if (!$('scrWorlds').classList.contains('hidden')) worldMap.resize(); });

// ═════════════════════════ vòng lặp chính ═════════════════════════
let last = performance.now();
function frame(now) {
  requestAnimationFrame(frame);
  let dt = Math.min(0.05, (now - last) / 1000); last = now;
  game.time += dt;
  if (game.state === 'play') {
    const sub = dt > 0.025 ? 2 : 1;
    for (let i = 0; i < sub && game.state === 'play'; i++) updatePlay(dt / sub);
  } else if (game.state === 'losing') updateLosing(dt);
  else if (game.state === 'winning') updateWinning(dt);
  if (game.state === 'menu') { game.aim.x = Math.sin(game.time * 0.6); game.aim.z = -Math.cos(game.time * 0.6); }
  const visDt = game.state === 'paused' ? 0 : dt;
  updateVisuals(visDt);
  dragon.update(visDt, game.time);
  updateParticles(visDt); updateDynamic(visDt); updateAmbient(visDt, game.time);
  updateAim();
  if (game.camBase) {
    game.shake = Math.max(0, game.shake - dt);
    const s = game.shake * 0.25;
    camera.position.set(game.camBase.x + (Math.random() - 0.5) * s, game.camBase.y + (Math.random() - 0.5) * s, game.camBase.z + (Math.random() - 0.5) * s);
  }
  renderer.render(scene, camera);
}

// kiểm tra đường ray (dùng khi phát triển): window.__mdCheck()
window.__mdCheck = () => {
  const out = [];
  for (let L = 0; L < 50; L++) {
    buildLevel(L, true);
    let minShooter = 99, minLane = 99;
    for (const T of game.tracks) {
      for (let i = 0; i < T.n; i += 2) minShooter = Math.min(minShooter, Math.hypot(T.xs[i] - game.sx, T.zs[i] - game.sz));
      for (let i = 0; i < T.n; i += 4) for (let j = i + Math.ceil(3 / STEP); j < T.n; j += 4) minLane = Math.min(minLane, Math.hypot(T.xs[i] - T.xs[j], T.zs[i] - T.zs[j]));
    }
    if (game.tracks.length === 2) {
      const [A, B] = game.tracks;
      for (let i = 0; i < A.n; i += 4) for (let j = 0; j < B.n; j += 4) minLane = Math.min(minLane, Math.hypot(A.xs[i] - B.xs[j], A.zs[i] - B.zs[j]));
    }
    out.push({ L, shape: game.shapeName, len: Math.round(game.tracks[0].len), minShooter: +minShooter.toFixed(2), minLane: +minLane.toFixed(2) });
  }
  return out;
};
window.__md = { game, buildLevel, startLevel, fire };

// ═════════════════════════ khởi động ═════════════════════════
syncToggles();
buildLevel(0, true);
$('loading').remove();
requestAnimationFrame(frame);
