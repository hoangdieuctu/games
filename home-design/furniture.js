/* Vật liệu, hoạ tiết và các món nội thất dựng bằng khối cơ bản.
   Mỗi hàm dựng trả về một THREE.Group có gốc ở tâm chân đế, mặt trước quay về +z. */
(function () {
  const HD = window.HD, T = THREE;
  const H = HD.PLAN.H;
  T.ColorManagement.legacyMode = false; /* mã màu hex là sRGB, tính sáng trong không gian tuyến tính */

  const UB = new T.BoxGeometry(1, 1, 1);
  const UC = new T.CylinderGeometry(0.5, 0.5, 1, 24);
  const US = new T.SphereGeometry(0.5, 16, 12);
  const UK = new T.ConeGeometry(0.5, 1, 24, 1, true);
  const UK4 = new T.ConeGeometry(0.5, 1, 4);

  /* ───── Vật liệu ───── */
  const mats = new Map();
  function M(color, o) {
    const k = color + (o ? JSON.stringify(o) : '');
    let m = mats.get(k);
    if (!m) { m = new T.MeshStandardMaterial(Object.assign({ color, roughness: 0.85, metalness: 0 }, o)); mats.set(k, m); }
    return m;
  }
  function shade(hex, f) {
    const c = new T.Color(hex);
    c.r = Math.min(1, c.r * f); c.g = Math.min(1, c.g * f); c.b = Math.min(1, c.b * f);
    return '#' + c.getHexString();
  }
  const glow = (c, i) => M(c, { emissive: c, emissiveIntensity: i || 0.9 });
  const GLASS = new T.MeshStandardMaterial({ color: '#bcd9e6', transparent: true, opacity: 0.2, roughness: 0.05, metalness: 0.2, depthWrite: false });
  const MIRROR = M('#d5e2e6', { metalness: 0.9, roughness: 0.08 });
  const WHITE = '#f6f4ef', DARK = '#26272b', STEEL = '#b9bdc2', GREEN = '#4f8a56', GREEN2 = '#356b45', POT = '#c9825a';

  function rng(seed) {
    let a = seed >>> 0;
    return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  }

  /* ───── Hoạ tiết vẽ bằng canvas ───── */
  const texs = new Map();
  function tex(key, w, h, draw, repeat) {
    let t = texs.get(key);
    if (t) return t;
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    draw(c.getContext('2d'), w, h, rng(key.length * 977 + key.charCodeAt(0) * 31 + key.charCodeAt(key.length - 1)));
    t = new T.CanvasTexture(c); t.encoding = T.sRGBEncoding; t.anisotropy = 4;
    if (repeat) t.wrapS = t.wrapT = T.RepeatWrapping;
    texs.set(key, t);
    return t;
  }

  /* Sàn: trả về vật liệu và kích thước thật (mét) của một ô hoạ tiết */
  function floorMat(def) {
    const [type, c1, c2, c3] = def, key = 'floor' + def.join('');
    const S = 512;
    let size = 2, rough = 0.75;
    const draw = {
      wood(g, s, _, r) {
        for (let y = 0; y < s; y += 32) {
          let x = -Math.floor(r() * 256);
          while (x < s) {
            g.fillStyle = shade(c1, 0.9 + r() * 0.2); g.fillRect(x, y, 256, 32);
            g.fillStyle = 'rgba(0,0,0,.18)'; g.fillRect(x, y, 1.5, 32);
            x += 256;
          }
          g.fillStyle = 'rgba(0,0,0,.2)'; g.fillRect(0, y, s, 1.5);
        }
      },
      tile(g, s, _, r) {
        g.fillStyle = c1; g.fillRect(0, 0, s, s);
        g.strokeStyle = c2; g.lineCap = 'round';
        for (let i = 0; i < 26; i++) {
          g.globalAlpha = 0.12 + r() * 0.2; g.lineWidth = 1 + r() * 5; g.beginPath();
          const x = r() * s, y = r() * s;
          g.moveTo(x, y); g.bezierCurveTo(x + r() * 160 - 80, y + r() * 160 - 80, x + r() * 240 - 120, y + r() * 240 - 120, x + r() * 320 - 160, y + r() * 320 - 160); g.stroke();
        }
        g.globalAlpha = 1; g.fillStyle = shade(c1, 0.8);
        for (let i = 0; i <= 2; i++) { g.fillRect(i * 256 - 1.5, 0, 3, s); g.fillRect(0, i * 256 - 1.5, s, 3); }
      },
      bong(g, s) {
        const n = 128;
        for (let ty = 0; ty < 4; ty++) for (let tx = 0; tx < 4; tx++) {
          const x = tx * n, y = ty * n, cx = x + n / 2, cy = y + n / 2;
          g.fillStyle = c1; g.fillRect(x, y, n, n);
          g.fillStyle = c2;
          [[x, y], [x + n, y], [x, y + n], [x + n, y + n]].forEach(([px, py]) => { g.beginPath(); g.arc(px, py, 44, 0, 7); g.fill(); });
          g.save(); g.beginPath(); g.rect(x, y, n, n); g.clip();
          g.fillStyle = c1;
          [[x, y], [x + n, y], [x, y + n], [x + n, y + n]].forEach(([px, py]) => { g.beginPath(); g.arc(px, py, 22, 0, 7); g.fill(); });
          g.restore();
          g.fillStyle = c3; g.beginPath(); g.moveTo(cx, cy - 30); g.lineTo(cx + 30, cy); g.lineTo(cx, cy + 30); g.lineTo(cx - 30, cy); g.fill();
          g.fillStyle = c1; g.beginPath(); g.arc(cx, cy, 9, 0, 7); g.fill();
          g.strokeStyle = 'rgba(0,0,0,.25)'; g.lineWidth = 1.5; g.strokeRect(x, y, n, n);
        }
      },
      terrazzo(g, s, _, r) {
        g.fillStyle = c1; g.fillRect(0, 0, s, s);
        const cols = ['#9a9a98', '#c9b9a6', '#6f7378', '#d9a98a', '#f7f6f2', '#b9c2c6'];
        for (let i = 0; i < 420; i++) {
          g.fillStyle = cols[Math.floor(r() * cols.length)]; g.globalAlpha = 0.75;
          const x = r() * s, y = r() * s, q = 3 + r() * 8;
          g.beginPath(); g.moveTo(x, y); g.lineTo(x + q, y + r() * q); g.lineTo(x + r() * q, y + q); g.fill();
        }
        g.globalAlpha = 1;
      },
      concrete(g, s, _, r) {
        g.fillStyle = c1; g.fillRect(0, 0, s, s);
        for (let i = 0; i < 90; i++) {
          g.fillStyle = r() > 0.5 ? 'rgba(255,255,255,.025)' : 'rgba(0,0,0,.02)';
          g.beginPath(); g.ellipse(r() * s, r() * s, 20 + r() * 90, 10 + r() * 50, r() * 3, 0, 7); g.fill();
        }
      }
    };
    if (type === 'tile') { size = 1.2; rough = 0.35; }
    if (type === 'bong') { size = 0.8; rough = 0.5; }
    if (type === 'terrazzo') { size = 1.5; rough = 0.35; }
    if (type === 'wood') rough = 0.6;
    return { mat: M('#ffffff', { map: tex(key, S, S, draw[type], true), roughness: rough }), size };
  }

  function rattanTex() {
    const t = tex('rattan', 64, 64, (g, s) => {
      g.fillStyle = '#d9bd8f'; g.fillRect(0, 0, s, s);
      g.strokeStyle = '#a9865a'; g.lineWidth = 3;
      for (let i = -s; i < s * 2; i += 16) {
        g.beginPath(); g.moveTo(i, 0); g.lineTo(i + s, s); g.stroke();
        g.beginPath(); g.moveTo(i + s, 0); g.lineTo(i, s); g.stroke();
      }
      g.fillStyle = '#7a5c3a';
      for (let y = 0; y < s; y += 16) for (let x = 0; x < s; x += 16) g.fillRect(x + 6, y + 6, 4, 4);
    }, true);
    t.repeat.set(6, 6);
    return M('#ffffff', { map: t });
  }

  function rugMat(pat, c, c2) {
    return M('#ffffff', { roughness: 1, map: tex('rug' + pat + c + c2, 256, 256, (g, s, _, r) => {
      g.fillStyle = c; g.fillRect(0, 0, s, s);
      if (pat === 'border') {
        g.strokeStyle = c2; g.lineWidth = 6; g.strokeRect(16, 16, s - 32, s - 32);
        g.lineWidth = 2; g.strokeRect(28, 28, s - 56, s - 56);
      } else if (pat === 'stripe') {
        g.fillStyle = c2; for (let y = 12; y < s; y += 40) g.fillRect(0, y, s, 14);
      } else if (pat === 'chieu') {
        g.fillStyle = '#e3cf9c'; g.fillRect(0, 0, s, s);
        g.strokeStyle = 'rgba(120,90,40,.35)'; g.lineWidth = 1;
        for (let y = 0; y < s; y += 4) { g.beginPath(); g.moveTo(0, y); g.lineTo(s, y); g.stroke(); }
        g.fillStyle = '#a8392b'; g.fillRect(0, 0, 12, s); g.fillRect(s - 12, 0, 12, s);
        g.fillStyle = '#2f6b5a'; g.fillRect(18, 0, 5, s); g.fillRect(s - 23, 0, 5, s);
      } else if (pat === 'geo') {
        g.strokeStyle = c2; g.lineWidth = 5;
        for (let y = 0; y <= s; y += 64) for (let x = 0; x <= s; x += 64) {
          g.beginPath(); g.moveTo(x, y - 26); g.lineTo(x + 26, y); g.lineTo(x, y + 26); g.lineTo(x - 26, y); g.closePath(); g.stroke();
        }
        g.lineWidth = 8; g.strokeRect(4, 4, s - 8, s - 8);
      }
      for (let i = 0; i < 700; i++) { g.fillStyle = r() > 0.5 ? 'rgba(255,255,255,.06)' : 'rgba(0,0,0,.06)'; g.fillRect(r() * s, r() * s, 2, 2); }
    }) });
  }

  function artMat(kind, p) {
    return M('#ffffff', { roughness: 0.9, map: tex('art' + kind + p.accent + p.accent2, 256, 256, (g, s, _, r) => {
      g.fillStyle = '#f4ecdc'; g.fillRect(0, 0, s, s);
      if (kind === 'hills') {
        g.fillStyle = p.accent2; g.beginPath(); g.arc(s * 0.7, s * 0.32, 34, 0, 7); g.fill();
        [[0.62, 0.55], [0.75, 0.75], [0.9, 1]].forEach(([y, f], i) => {
          g.fillStyle = shade(p.accent, 1.5 - i * 0.35); g.beginPath(); g.moveTo(0, s);
          for (let x = 0; x <= s; x += 8) g.lineTo(x, s * y + Math.sin(x / (40 + i * 22) + i * 2) * 22 * f);
          g.lineTo(s, s); g.fill();
        });
      } else if (kind === 'lines') {
        g.lineWidth = 3;
        for (let i = 0; i < 7; i++) {
          g.strokeStyle = i % 3 ? '#3a352f' : p.accent2;
          g.beginPath(); g.arc(s * 0.5, s * 1.1, 60 + i * 24, Math.PI * 1.05, Math.PI * 1.95); g.stroke();
        }
      } else if (kind === 'lotus') {
        g.fillStyle = '#5f9a6a'; g.beginPath(); g.ellipse(s * 0.5, s * 0.8, 96, 22, 0, 0, 7); g.fill();
        g.strokeStyle = '#4b7d55'; g.lineWidth = 5; g.beginPath(); g.moveTo(s * 0.5, s * 0.8); g.lineTo(s * 0.5, s * 0.56); g.stroke();
        for (let i = -2; i <= 2; i++) {
          g.save(); g.translate(s * 0.5, s * 0.56); g.rotate(i * 0.48);
          g.fillStyle = i % 2 ? '#e68aa0' : '#f2b3c0';
          g.beginPath(); g.ellipse(0, -44, 20, 50, 0, 0, 7); g.fill(); g.restore();
        }
        g.fillStyle = '#e9c46a'; g.beginPath(); g.arc(s * 0.5, s * 0.55, 10, 0, 7); g.fill();
      } else if (kind === 'sun') {
        g.fillStyle = p.accent2; g.beginPath(); g.arc(s * 0.5, s * 0.4, 62, 0, 7); g.fill();
        g.fillStyle = p.accent; g.fillRect(s * 0.18, s * 0.66, s * 0.64, 22);
        g.fillStyle = '#3a352f'; g.fillRect(s * 0.3, s * 0.8, s * 0.4, 8);
      } else {
        const cols = [p.accent, p.accent2, '#3a352f', '#e2d6c0', shade(p.accent, 1.4)];
        for (let i = 0; i < 9; i++) {
          g.fillStyle = cols[i % cols.length]; g.globalAlpha = 0.9;
          g.fillRect(r() * s * 0.7, r() * s * 0.7, 40 + r() * 90, 30 + r() * 90);
        }
        g.globalAlpha = 1;
      }
    }) });
  }

  /* ───── Khối cơ bản (y là cao độ đáy) ───── */
  const G = () => new T.Group();
  function B(g, w, h, d, m, x, y, z) { const e = new T.Mesh(UB, m); e.scale.set(w, h, d); e.position.set(x || 0, (y || 0) + h / 2, z || 0); g.add(e); return e; }
  function C(g, r, h, m, x, y, z) { const e = new T.Mesh(UC, m); e.scale.set(r * 2, h, r * 2); e.position.set(x || 0, (y || 0) + h / 2, z || 0); g.add(e); return e; }
  function S(g, sx, sy, sz, m, x, y, z) { const e = new T.Mesh(US, m); e.scale.set(sx, sy, sz); e.position.set(x || 0, y || 0, z || 0); g.add(e); return e; }
  function legs(g, w, d, h, m, t) {
    t = t || 0.045;
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) B(g, t, h, t, m, sx * (w / 2 - t / 2 - 0.02), 0, sz * (d / 2 - t / 2 - 0.02));
  }
  /* Các khe cửa tủ và tay nắm ở mặt trước */
  function fronts(g, w, y0, h, z, n, handle) {
    const gap = M(DARK), hm = M(handle || STEEL, { metalness: 0.6, roughness: 0.4 });
    for (let i = 1; i < n; i++) B(g, 0.008, h, 0.006, gap, -w / 2 + (w / n) * i, y0, z);
    for (let i = 0; i < n; i++) B(g, 0.014, Math.min(0.3, h * 0.3), 0.02, hm, -w / 2 + (w / n) * (i + (i % 2 ? 0.12 : 0.88)), y0 + h * 0.5, z + 0.008);
  }
  function foliage(g, kind, h, y) {
    const a = M(GREEN, { roughness: 0.9 }), b = M(GREEN2, { roughness: 0.9 });
    if (kind === 'palm') {
      C(g, 0.02, h * 0.5, M('#6b5a3a'), 0, y, 0);
      for (let i = 0; i < 9; i++) {
        const an = i * 0.7, tilt = 0.5 + (i % 3) * 0.28, len = h * 0.42;
        const l = S(g, 0.11, 0.012, len, i % 2 ? a : b, Math.sin(an) * len * 0.36 * Math.sin(tilt), y + h * 0.5 + Math.cos(tilt) * len * 0.36, Math.cos(an) * len * 0.36 * Math.sin(tilt));
        l.rotation.order = 'YXZ'; l.rotation.y = an; l.rotation.x = -(Math.PI / 2 - tilt);
      }
    } else if (kind === 'monstera') {
      for (let i = 0; i < 7; i++) {
        const an = i * 0.9, r = 0.1 + (i % 3) * 0.05, yy = y + h * (0.25 + (i % 4) * 0.18);
        C(g, 0.008, yy - y, b, Math.sin(an) * r * 0.5, y, Math.cos(an) * r * 0.5);
        const l = S(g, 0.24, 0.015, 0.2, i % 2 ? a : b, Math.sin(an) * r, yy, Math.cos(an) * r);
        l.rotation.set(0.35 * Math.cos(an), an, 0.35 * Math.sin(an));
      }
    } else {
      const k = h * 0.5;
      [[0, 0.5, 0, 1], [0.12, 0.38, 0.06, 0.7], [-0.1, 0.42, -0.08, 0.75], [0.03, 0.72, -0.05, 0.6], [-0.06, 0.3, 0.12, 0.6]].forEach(([x, yy, z, s], i) =>
        S(g, k * s, k * s, k * s, i % 2 ? a : b, x * h, y + yy * h, z * h));
    }
  }
  function cushion(g, w, d, m, x, y, z) { return B(g, w, 0.12, d, m, x, y, z); }

  /* ───── Nội thất ───── */
  const build = {
    bed(o, p, w, d) {
      const g = G(), wood = M(o.c || p.wood), low = o.low, y0 = low ? 0 : 0.1, fh = low ? 0.14 : 0.2;
      if (!low) legs(g, w, d, y0, M(p.wood2), 0.06);
      B(g, w, fh, d, wood, 0, y0, 0);
      const my = y0 + fh;
      B(g, w - 0.08, 0.2, d - 0.12, M(WHITE, { roughness: 1 }), 0, my, 0.03);
      B(g, w - 0.04, 0.07, d * 0.56, M(o.blanket || p.bedding, { roughness: 1 }), 0, my + 0.16, d * 0.2);
      B(g, w - 0.04, 0.075, 0.2, M('#ffffff', { roughness: 1 }), 0, my + 0.16, d * 0.2 - d * 0.28 - 0.1);
      const n = w >= 1.4 ? 2 : 1;
      for (let i = 0; i < n; i++) B(g, 0.52, 0.11, 0.34, M('#ffffff', { roughness: 1 }), n === 2 ? (i ? 0.38 : -0.38) * (w / 1.6) : 0, my + 0.2, -d / 2 + 0.32);
      if (o.head !== 'none') {
        const hm = o.head === 'pad' ? M(p.fabric, { roughness: 1 }) : o.head === 'rattan' ? rattanTex() : wood;
        B(g, w, low ? 0.75 : 1.0, 0.06, o.head === 'rattan' ? wood : hm, 0, 0, -d / 2 + 0.03);
        if (o.head === 'rattan') B(g, w - 0.14, 0.5, 0.01, hm, 0, (low ? 0.2 : 0.44), -d / 2 + 0.066);
      }
      return g;
    },
    crib(o, p, w, d) {
      const g = G(), m = M(o.c || WHITE), t = 0.04, h = 0.86;
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) B(g, t, h, t, m, sx * (w / 2 - t / 2), 0, sz * (d / 2 - t / 2));
      for (const y of [0.26, h - t]) {
        for (const sz of [-1, 1]) B(g, w, t, 0.03, m, 0, y, sz * (d / 2 - t / 2));
        for (const sx of [-1, 1]) B(g, 0.03, t, d, m, sx * (w / 2 - t / 2), y, 0);
      }
      for (let x = -w / 2 + 0.11; x < w / 2 - 0.06; x += 0.1) for (const sz of [-1, 1]) B(g, 0.016, h - 0.3, 0.016, m, x, 0.28, sz * (d / 2 - t / 2));
      for (let z = -d / 2 + 0.11; z < d / 2 - 0.06; z += 0.1) for (const sx of [-1, 1]) B(g, 0.016, h - 0.3, 0.016, m, sx * (w / 2 - t / 2), 0.28, z);
      B(g, w - 0.09, 0.09, d - 0.09, M('#ffffff', { roughness: 1 }), 0, 0.3, 0);
      B(g, w * 0.5, 0.03, d - 0.12, M(p.accent, { roughness: 1 }), w * 0.18, 0.39, 0);
      B(g, 0.2, 0.05, 0.3, M(p.accent2, { roughness: 1 }), -w / 2 + 0.2, 0.39, 0);
      return g;
    },
    floorbed(o, p, w, d) {
      const g = G(), m = M(p.wood), t = 0.05, ph = 1.15, rise = w * 0.38;
      B(g, w, 0.08, d, m, 0, 0, 0);
      B(g, w - 0.1, 0.12, d - 0.1, M('#ffffff', { roughness: 1 }), 0, 0.08, 0);
      B(g, w - 0.1, 0.05, d * 0.5, M(p.accent2, { roughness: 1 }), 0, 0.19, d * 0.2);
      B(g, 0.4, 0.09, 0.28, M(p.accent, { roughness: 1 }), 0, 0.2, -d / 2 + 0.26);
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) B(g, t, ph, t, m, sx * (w / 2 - t / 2), 0, sz * (d / 2 - t / 2));
      for (const sx of [-1, 1]) B(g, t, t, d, m, sx * (w / 2 - t / 2), ph - t, 0);
      const len = Math.hypot(w / 2, rise), an = Math.atan2(rise, w / 2);
      for (const sz of [-1, 1]) for (const sx of [-1, 1]) {
        const e = B(g, len, t, t, m, sx * w / 4, ph + rise / 2 - t / 2, sz * (d / 2 - t / 2));
        e.rotation.z = -sx * an;
      }
      B(g, t, t, d, m, 0, ph + rise - t, 0);
      return g;
    },
    daybed(o, p, w, d) {
      const g = G(), wood = M(p.wood), f = M(p.fabric, { roughness: 1 });
      B(g, w, 0.3, d, wood, 0, 0, 0);
      B(g, w - 0.06, 0.16, d - 0.06, M(WHITE, { roughness: 1 }), 0, 0.3, 0);
      B(g, w, 0.75, 0.06, wood, 0, 0, -d / 2 + 0.03);
      for (const sx of [-1, 1]) B(g, 0.06, 0.62, d, wood, sx * (w / 2 - 0.03), 0, 0);
      for (let i = 0; i < 3; i++) B(g, 0.5, 0.36, 0.12, i === 1 ? M(p.accent, { roughness: 1 }) : f, (i - 1) * 0.58, 0.46, -d / 2 + 0.14).rotation.x = -0.15;
      B(g, 0.7, 0.04, d - 0.1, M(p.bedding, { roughness: 1 }), w / 2 - 0.45, 0.46, 0);
      return g;
    },
    wardrobe(o, p, w, d) {
      const g = G(), h = o.h || 2.45;
      if (o.books) { /* một khối: bên trái là tủ quần áo, bên phải là các ngăn sách để hở */
        const bw = o.books, cw = w - bw, c = G(); c.position.x = -bw / 2; g.add(c);
        B(c, cw, 0.06, d - 0.04, M(DARK), 0, 0, -0.01);
        B(c, cw, h - 0.06, d, M(o.c || p.wood), 0, 0.06, 0);
        fronts(c, cw, 0.1, h - 0.14, d / 2 + 0.002, Math.max(2, Math.round(cw / 0.5)), p.wood2);
        const sh = build.shelf({ h }, p, bw, d); sh.position.x = cw / 2; g.add(sh);
        return g;
      }
      B(g, w, 0.06, d - 0.04, M(DARK), 0, 0, -0.01);
      B(g, w, h - 0.06, d, M(o.c || p.wood), 0, 0.06, 0);
      fronts(g, w, 0.1, h - 0.14, d / 2 + 0.002, Math.max(2, Math.round(w / 0.5)), p.wood2);
      return g;
    },
    sofa(o, p, w, d) {
      const g = G(), c = M(o.c || p.fabric, { roughness: 1 }), c2 = M(shade(o.c || p.fabric, 1.07), { roughness: 1 });
      const y0 = o.low ? 0.04 : 0.1, sh = o.low ? 0.2 : 0.22;
      legs(g, w, d, y0, M(p.wood2), 0.05);
      B(g, w, sh, d, c, 0, y0, 0);
      B(g, w, 0.5, 0.2, c, 0, y0 + sh - 0.02, -d / 2 + 0.1);
      for (const sx of [-1, 1]) B(g, 0.16, 0.32, d, c, sx * (w / 2 - 0.08), y0 + sh - 0.02, 0);
      const n = Math.max(1, Math.round((w - 0.32) / 0.8)), cw = (w - 0.32) / n;
      for (let i = 0; i < n; i++) {
        cushion(g, cw - 0.02, d - 0.24, c2, -w / 2 + 0.16 + cw * (i + 0.5), y0 + sh, 0.1);
        B(g, cw - 0.04, 0.34, 0.14, c2, -w / 2 + 0.16 + cw * (i + 0.5), y0 + sh + 0.12, -d / 2 + 0.26).rotation.x = -0.14;
      }
      B(g, 0.38, 0.38, 0.12, M(p.accent, { roughness: 1 }), -w / 2 + 0.4, y0 + sh + 0.13, -d / 2 + 0.4).rotation.set(-0.3, 0.25, 0);
      B(g, 0.36, 0.36, 0.12, M(p.accent2, { roughness: 1 }), w / 2 - 0.4, y0 + sh + 0.13, -d / 2 + 0.4).rotation.set(-0.3, -0.25, 0);
      return g;
    },
    sofaL(o, p, w, d) {
      const g = G(), sgn = o.side === 'R' ? 1 : -1;
      const main = build.sofa(o, p, w, 0.85); main.position.z = -d / 2 + 0.425; g.add(main);
      const c = M(o.c || p.fabric, { roughness: 1 }), c2 = M(shade(o.c || p.fabric, 1.07), { roughness: 1 });
      B(g, 0.9, 0.22, d - 0.85, c, sgn * (w / 2 - 0.45), 0.1, 0.425);
      cushion(g, 0.86, d - 0.9, c2, sgn * (w / 2 - 0.45), 0.32, 0.43);
      for (const sx of [-1, 1]) B(g, 0.05, 0.1, 0.05, M(p.wood2), sgn * (w / 2 - 0.45) + sx * 0.38, 0, d / 2 - 0.08);
      return g;
    },
    /* Trường kỷ gỗ cách tân */
    bench(o, p, w, d) {
      const g = G(), m = M(p.wood), f = M(p.fabric, { roughness: 1 });
      legs(g, w, d, 0.36, m, 0.06);
      B(g, w, 0.06, d, m, 0, 0.34, 0);
      B(g, w, 0.06, 0.05, m, 0, 0.84, -d / 2 + 0.03);
      for (let x = -w / 2 + 0.09; x <= w / 2 - 0.08; x += 0.13) B(g, 0.035, 0.44, 0.03, m, x, 0.4, -d / 2 + 0.03);
      for (const sx of [-1, 1]) {
        B(g, 0.06, 0.05, d, m, sx * (w / 2 - 0.03), 0.6, 0);
        B(g, 0.06, 0.24, 0.06, m, sx * (w / 2 - 0.03), 0.38, d / 2 - 0.05);
        B(g, 0.06, 0.5, 0.06, m, sx * (w / 2 - 0.03), 0.38, -d / 2 + 0.03);
      }
      cushion(g, w - 0.16, d - 0.14, f, 0, 0.4, 0.02);
      B(g, 0.4, 0.34, 0.1, M(p.accent, { roughness: 1 }), -w / 2 + 0.36, 0.52, -d / 2 + 0.16).rotation.x = -0.2;
      B(g, 0.4, 0.34, 0.1, M(p.accent2, { roughness: 1 }), w / 2 - 0.36, 0.52, -d / 2 + 0.16).rotation.x = -0.2;
      return g;
    },
    armchair(o, p, w, d) {
      const g = G(), f = M(o.c || p.fabric, { roughness: 1 });
      if (o.rattan) {
        const m = M(p.wood), rt = rattanTex();
        legs(g, w, d, 0.36, m, 0.05);
        B(g, w, 0.05, d, m, 0, 0.32, 0);
        B(g, w, 0.5, 0.05, m, 0, 0.36, -d / 2 + 0.03);
        B(g, w - 0.12, 0.38, 0.01, rt, 0, 0.42, -d / 2 + 0.06);
        for (const sx of [-1, 1]) B(g, 0.05, 0.05, d, m, sx * (w / 2 - 0.03), 0.58, 0);
        cushion(g, w - 0.14, d - 0.14, f, 0, 0.37, 0.02);
      } else {
        legs(g, w, d, 0.12, M(p.wood2), 0.045);
        B(g, w, 0.22, d, f, 0, 0.12, 0);
        B(g, w, 0.52, 0.18, f, 0, 0.3, -d / 2 + 0.09);
        for (const sx of [-1, 1]) B(g, 0.14, 0.3, d, f, sx * (w / 2 - 0.07), 0.3, 0);
        cushion(g, w - 0.3, d - 0.22, M(shade(o.c || p.fabric, 1.08), { roughness: 1 }), 0, 0.34, 0.08);
      }
      return g;
    },
    pouf(o, p, w) {
      const g = G();
      C(g, w / 2, 0.36, M(o.c || p.accent2, { roughness: 1 }), 0, 0, 0);
      return g;
    },
    beanbag(o, p, w) {
      const g = G(), c = o.c || p.accent2, f = M(c, { roughness: 1 }), f2 = M(shade(c, 0.93), { roughness: 1 });
      S(g, w, 0.44, w, f, 0, 0.2, 0);
      S(g, w * 0.86, 0.62, w * 0.52, f2, 0, 0.42, -w * 0.2);
      S(g, w * 0.6, 0.16, w * 0.55, M(shade(c, 1.06), { roughness: 1 }), 0, 0.37, w * 0.08);
      return g;
    },
    ctable(o, p, w) {
      const g = G(), m = M(o.c || WHITE, { roughness: 0.5 }), h = 0.4;
      C(g, w / 2, 0.035, m, 0, h, 0);
      for (let i = 0; i < 3; i++) C(g, 0.016, h, M(p.wood2), Math.sin(i * 2.1) * w * 0.3, 0, Math.cos(i * 2.1) * w * 0.3);
      C(g, 0.05, 0.12, M(p.accent2), 0.06, h + 0.035, 0.03);
      foliage(g, 'bush', 0.22, h + 0.14);
      return g;
    },
    teatable(o, p, w, d) {
      const g = G(), m = M(p.wood);
      legs(g, w, d, 0.34, m, 0.05);
      B(g, w, 0.045, d, m, 0, 0.34, 0);
      B(g, 0.44, 0.015, 0.3, M(p.wood2), 0, 0.385, 0);
      const cer = M('#f1ede3', { roughness: 0.4 });
      S(g, 0.13, 0.11, 0.13, cer, -0.08, 0.455, 0);
      C(g, 0.012, 0.09, cer, -0.02, 0.43, 0).rotation.z = -1.0;
      for (let i = 0; i < 3; i++) C(g, 0.025, 0.035, cer, 0.08 + (i % 2) * 0.07, 0.4, -0.08 + i * 0.08);
      return g;
    },
    tvunit(o, p, w, d) {
      const g = G(), m = M(o.c || p.wood);
      if (o.slat) {
        B(g, w + 0.3, 2.4, 0.015, M(shade(p.wood, 0.75)), 0, 0, -d / 2 + 0.008);
        for (let x = -w / 2 - 0.13; x <= w / 2 + 0.13; x += 0.07) B(g, 0.03, 2.4, 0.03, m, x, 0, -d / 2 + 0.03);
      }
      B(g, w, 0.34, d, m, 0, 0.16, 0);
      B(g, w - 0.2, 0.16, d - 0.1, M(DARK), 0, 0, 0);
      fronts(g, w, 0.18, 0.3, d / 2 + 0.002, Math.max(2, Math.round(w / 0.6)), p.wood2);
      const tw = Math.min(w - 0.3, 1.35);
      B(g, tw, tw * 0.57, 0.04, M('#0b0c0f', { roughness: 0.25 }), 0, 0.95, -d / 2 + (o.slat ? 0.07 : 0.03));
      C(g, 0.06, 0.2, M(p.accent2), w / 2 - 0.2, 0.5, 0);
      for (let i = 0; i < 3; i++) B(g, 0.2, 0.035, 0.15, M([p.accent, p.accent2, p.wood2][i]), -w / 2 + 0.25, 0.5 + i * 0.035, 0);
      return g;
    },
    table(o, p, w, d) {
      const g = G(), m = M(o.c || p.wood, { roughness: 0.6 });
      if (o.round) {
        C(g, w / 2, 0.04, m, 0, 0.71, 0);
        C(g, 0.05, 0.7, M(p.wood2), 0, 0.01, 0); C(g, 0.26, 0.025, M(p.wood2), 0, 0, 0);
      } else {
        B(g, w, 0.04, d, m, 0, 0.71, 0);
        legs(g, w, d, 0.71, M(shade(p.wood, 0.85)), 0.055);
      }
      C(g, 0.11, 0.05, M('#f1ede3', { roughness: 0.4 }), 0, 0.75, 0);
      foliage(g, 'bush', 0.24, 0.78);
      return g;
    },
    chair(o, p, w, d) {
      const g = G(), m = M(o.c || p.wood);
      legs(g, w, d, 0.44, m, 0.035);
      B(g, w, 0.035, d, m, 0, 0.42, 0);
      B(g, w - 0.04, 0.03, d - 0.04, M(p.fabric, { roughness: 1 }), 0, 0.455, 0);
      for (const sx of [-1, 1]) B(g, 0.035, 0.42, 0.035, m, sx * (w / 2 - 0.04), 0.44, -d / 2 + 0.035);
      B(g, w - 0.04, 0.24, 0.02, o.rattan ? rattanTex() : m, 0, 0.6, -d / 2 + 0.035);
      return g;
    },
    stool(o, p, w) {
      const g = G(), m = M(p.wood2, { metalness: 0.3, roughness: 0.5 });
      C(g, w / 2 - 0.01, 0.045, M(p.wood), 0, 0.62, 0);
      for (let i = 0; i < 4; i++) C(g, 0.012, 0.62, m, Math.sin(i * 1.571 + 0.78) * 0.14, 0, Math.cos(i * 1.571 + 0.78) * 0.14);
      C(g, 0.15, 0.012, m, 0, 0.22, 0);
      return g;
    },
    highchair(o, p, w, d) {
      const g = G(), m = M(p.wood), s = M(WHITE);
      legs(g, w, d, 0.52, m, 0.035);
      B(g, 0.36, 0.04, 0.34, s, 0, 0.52, 0);
      B(g, 0.36, 0.32, 0.03, s, 0, 0.56, -0.155);
      for (const sx of [-1, 1]) B(g, 0.03, 0.14, 0.3, s, sx * 0.165, 0.56, 0);
      B(g, 0.42, 0.025, 0.2, s, 0, 0.7, 0.18);
      B(g, 0.3, 0.02, 0.28, M(p.accent, { roughness: 1 }), 0, 0.56, 0.01);
      return g;
    },
    /* Ghế băng sát tường (nệm ngồi + nệm tựa) */
    banq(o, p, w, d) {
      const g = G();
      B(g, w, 0.4, d, M(p.wood), 0, 0, 0);
      B(g, w, 0.07, d, M(p.fabric, { roughness: 1 }), 0, 0.4, 0);
      B(g, w, 0.4, 0.08, M(p.fabric, { roughness: 1 }), 0, 0.5, -d / 2 + 0.04);
      for (let i = 0; i < 2; i++) B(g, 0.36, 0.3, 0.1, M(i ? p.accent : p.accent2, { roughness: 1 }), (i ? 0.5 : -0.5), 0.5, -d / 2 + 0.13).rotation.x = -0.15;
      return g;
    },
    counter(o, p, w, d) {
      const g = G(), cab = M(p.cab), top = M(p.top, { roughness: 0.35 });
      B(g, w, 0.08, d - 0.1, M(DARK), 0, 0, -0.03);
      B(g, w, 0.8, d - 0.03, cab, 0, 0.08, -0.015);
      B(g, w + (o.island ? 0.04 : 0), 0.04, d + 0.02, top, 0, 0.88, 0);
      fronts(g, w, 0.1, 0.76, d / 2 - 0.028, Math.max(2, Math.round(w / 0.45)), p.wood2);
      const steel = M(p.steel, { metalness: 0.7, roughness: 0.3 });
      const both = o.sink && o.stove;
      if (o.stove) {
        const sx = both ? -w * 0.24 : 0;
        B(g, 0.56, 0.012, 0.46, M('#0e0f12', { roughness: 0.15 }), sx, 0.92, 0);
        for (const dx of [-0.13, 0.13]) C(g, 0.085, 0.004, M('#3a1d18', { roughness: 0.3 }), sx + dx, 0.932, 0);
        if (o.upper) B(g, 0.6, 0.07, 0.42, steel, sx, 1.42, -d / 2 + 0.22);
        C(g, 0.1, 0.1, steel, sx - 0.13, 0.936, 0);
      }
      if (o.sink) {
        const sx = both ? w * 0.24 : 0;
        B(g, 0.52, 0.012, 0.38, steel, sx, 0.915, 0.02);
        B(g, 0.44, 0.012, 0.3, M('#6c7076', { metalness: 0.6, roughness: 0.4 }), sx, 0.92, 0.02);
        C(g, 0.014, 0.26, steel, sx, 0.92, -d / 2 + 0.1);
        B(g, 0.022, 0.022, 0.16, steel, sx, 1.17, -d / 2 + 0.17);
      }
      if (o.upper) {
        B(g, w, 0.72, 0.34, cab, 0, 1.49, -d / 2 + 0.17);
        fronts(g, w, 1.51, 0.68, -d / 2 + 0.342, Math.max(2, Math.round(w / 0.45)), p.wood2);
        B(g, w, 0.57, 0.012, M(p.splash, { roughness: 0.3 }), 0, 0.92, -d / 2 + 0.006);
      }
      if (o.island) {
        C(g, 0.13, 0.05, M(p.wood), -w / 2 + 0.3, 0.92, 0);
        const fr = [p.accent2, '#e0a23a', '#c9503a'];
        for (let i = 0; i < 3; i++) S(g, 0.08, 0.08, 0.08, M(fr[i]), -w / 2 + 0.3 + Math.sin(i * 2.1) * 0.05, 1.0, Math.cos(i * 2.1) * 0.05);
      }
      return g;
    },
    fridge(o, p, w, d) {
      const g = G(), m = M(p.steel, { metalness: 0.5, roughness: 0.35 });
      B(g, w, 1.85, d - 0.04, m, 0, 0, -0.02);
      B(g, w, 0.008, 0.01, M(DARK), 0, 0.72, d / 2 - 0.038);
      for (const y of [0.8, 0.5]) B(g, 0.02, y === 0.8 ? 0.6 : 0.16, 0.03, M(DARK), -w / 2 + 0.07, y, d / 2 - 0.025);
      if (o.top) { /* hộc kho kịch trần trên nóc tủ lạnh */
        B(g, w, H - 1.9, d, M(p.cab), 0, 1.9, 0);
        fronts(g, w, 1.93, H - 1.96, d / 2 + 0.002, 2, p.wood2);
      }
      return g;
    },
    cabinet(o, p, w, d) {
      const g = G(), h = o.h || 0.9;
      B(g, w, 0.07, d - 0.04, M(DARK), 0, 0, -0.01);
      B(g, w, h - 0.07, d, M(p.wood), 0, 0.07, 0);
      B(g, w + 0.02, 0.025, d + 0.02, M(shade(p.wood, 0.85)), 0, h, 0);
      fronts(g, w, 0.1, h - 0.14, d / 2 + 0.002, Math.max(1, Math.round(w / 0.45)), p.wood2);
      if (o.vase) {
        C(g, 0.06, 0.2, M('#f1ede3', { roughness: 0.4 }), w * 0.28, h + 0.025, 0);
        const leaves = G(); foliage(leaves, 'monstera', 0.5, h + 0.2); leaves.position.x = w * 0.28; g.add(leaves);
        B(g, 0.22, 0.03, 0.16, M(p.accent), -w * 0.25, h + 0.025, 0);
      }
      return g;
    },
    shelf(o, p, w, d) {
      const g = G(), h = o.h || 1.8, m = M(p.wood), n = Math.round(h / 0.38), r = rng(Math.round(w * 100 + h * 10));
      for (const sx of [-1, 1]) B(g, 0.03, h, d, m, sx * (w / 2 - 0.015), 0, 0);
      B(g, w, h, 0.015, M(shade(p.wood, 0.9)), 0, 0, -d / 2 + 0.008);
      const cols = [p.accent, p.accent2, '#e9e2d2', p.wood2, '#c9b08a', '#7d8a94'];
      for (let i = 0; i <= n; i++) {
        const y = (h - 0.03) * i / n;
        B(g, w - 0.06, 0.03, d, m, 0, y, 0);
        if (i === n) break;
        let x = -w / 2 + 0.07;
        while (x < w / 2 - 0.14) {
          const bw = 0.03 + r() * 0.035, bh = 0.2 + r() * 0.1;
          if (r() < 0.82) B(g, bw, bh, d * 0.7, M(cols[Math.floor(r() * cols.length)]), x + bw / 2, y + 0.03, 0);
          x += bw + 0.004 + (r() < 0.15 ? 0.14 : 0);
        }
      }
      return g;
    },
    lowshelf(o, p, w, d) {
      const g = G(), m = M(p.wood), h = 0.62, n = Math.max(2, Math.round(w / 0.4));
      for (let i = 0; i <= n; i++) B(g, 0.025, h, d, m, -w / 2 + 0.0125 + (w - 0.025) * i / n, 0, 0);
      for (const y of [0.03, 0.31, h - 0.025]) B(g, w, 0.025, d, m, 0, y, 0);
      B(g, w, h, 0.012, m, 0, 0, -d / 2 + 0.006);
      const toys = ['#e2725b', '#f0c35a', '#5b8fb9', '#7fb685', '#f0b49c', '#9c7fc1'];
      for (let i = 0; i < n; i++) {
        const x = -w / 2 + (w / n) * (i + 0.5), a = M(toys[i % 6], { roughness: 0.7 }), b = M(toys[(i + 3) % 6], { roughness: 0.7 });
        if (i % 2) { B(g, 0.2, 0.16, d * 0.7, a, x, 0.055, 0); S(g, 0.15, 0.15, 0.15, b, x, 0.41, 0); }
        else { S(g, 0.17, 0.17, 0.17, a, x, 0.14, 0); B(g, 0.22, 0.12, d * 0.6, b, x, 0.335, 0); }
      }
      B(g, 0.2, 0.2, 0.03, M(toys[1]), -w / 4, h, 0).rotation.x = -0.3;
      C(g, 0.05, 0.16, M(toys[3]), w / 4, h, 0);
      return g;
    },
    desk(o, p, w, d) {
      const g = G();
      if (o.kid) { /* bàn học cho bé tiểu học: thấp hơn, có kệ sách và đèn bàn */
        const m = M(p.wood, { roughness: 0.6 }), m2 = M(p.wood2), zb = -d / 2 + 0.1;
        B(g, w, 0.03, d, m, 0, 0.62, 0);
        legs(g, w, d, 0.62, m2, 0.04);
        B(g, 0.36, 0.13, d - 0.08, m, w / 2 - 0.22, 0.49, 0);
        for (const sx of [-1, 1]) B(g, 0.02, 0.56, 0.2, m, sx * (w / 2 - 0.01), 0.65, zb);
        for (const y of [0.91, 1.19]) B(g, w, 0.02, 0.2, m, 0, y, zb);
        B(g, w, 0.56, 0.012, M(shade(p.wood, 0.92)), 0, 0.65, -d / 2 + 0.006);
        const cols = ['#e2725b', '#f0c35a', '#5b8fb9', '#7fb685', '#f0b49c', '#9c7fc1', '#e9e2d2'], r = rng(73);
        let x = -w / 2 + 0.05;
        while (x < w / 2 - 0.42) {
          const bw = 0.025 + r() * 0.03, bh = 0.17 + r() * 0.07;
          B(g, bw, bh, 0.15, M(cols[Math.floor(r() * cols.length)]), x + bw / 2, 0.93, zb);
          x += bw + 0.004;
        }
        S(g, 0.17, 0.17, 0.17, M('#5b8fb9', { roughness: 0.5 }), w / 2 - 0.2, 1.045, zb); C(g, 0.05, 0.03, m2, w / 2 - 0.2, 0.93, zb);
        B(g, 0.2, 0.14, 0.14, M(cols[1]), -w / 4, 0.65, zb); B(g, 0.16, 0.1, 0.14, M(cols[3]), -w / 4 + 0.22, 0.65, zb);
        const dk = M(DARK, { metalness: 0.4, roughness: 0.5 });
        C(g, 0.06, 0.015, dk, -w / 2 + 0.14, 0.65, 0.02); C(g, 0.008, 0.26, dk, -w / 2 + 0.14, 0.665, 0.02);
        B(g, 0.2, 0.025, 0.07, dk, -w / 2 + 0.22, 0.915, 0.02); B(g, 0.16, 0.008, 0.05, glow('#fff0cc', 1.2), -w / 2 + 0.23, 0.907, 0.02).userData.ns = 1;
        B(g, 0.3, 0.01, 0.21, M('#fbfaf5'), 0.02, 0.65, 0.1); B(g, 0.004, 0.011, 0.21, M('#c9c2b6'), 0.02, 0.65, 0.1);
        C(g, 0.035, 0.09, M(p.accent2), w / 2 - 0.14, 0.65, 0.12);
        for (let i = 0; i < 3; i++) C(g, 0.005, 0.14, M(cols[i * 2]), w / 2 - 0.15 + i * 0.012, 0.66, 0.115 + (i % 2) * 0.012);
        return g;
      }
      B(g, w, 0.035, d, M(p.wood, { roughness: 0.6 }), 0, 0.72, 0);
      legs(g, w, d, 0.72, M(p.wood2), 0.04);
      B(g, 0.4, 0.3, d - 0.08, M(p.wood), w / 2 - 0.24, 0.42, 0);
      B(g, 0.6, 0.36, 0.025, M('#0b0c0f', { roughness: 0.25 }), -0.1, 0.87, -d / 2 + 0.16);
      B(g, 0.06, 0.12, 0.05, M(DARK), -0.1, 0.755, -d / 2 + 0.16); B(g, 0.22, 0.012, 0.14, M(DARK), -0.1, 0.755, -d / 2 + 0.17);
      B(g, 0.38, 0.012, 0.13, M('#e9e9e6'), -0.1, 0.756, 0.1);
      C(g, 0.045, 0.1, M(p.accent2), w / 2 - 0.16, 0.755, -0.08);
      return g;
    },
    ochair(o, p) {
      const g = G(), f = M(p.accent, { roughness: 1 }), m = M(DARK, { metalness: 0.4, roughness: 0.5 });
      C(g, 0.26, 0.03, m, 0, 0.02, 0); C(g, 0.025, 0.4, m, 0, 0.04, 0);
      B(g, 0.44, 0.07, 0.42, f, 0, 0.44, 0);
      B(g, 0.42, 0.46, 0.05, f, 0, 0.56, -0.2).rotation.x = -0.1;
      return g;
    },
    plant(o, p, w) {
      const g = G(), h = o.h || 0.9, ph = Math.min(0.34, h * 0.3);
      C(g, w / 2 - 0.02, ph, M(o.kind === 'palm' ? '#e9e2d2' : POT, { roughness: 0.8 }), 0, 0, 0);
      C(g, w / 2 - 0.04, 0.01, M('#3a2a1c'), 0, ph, 0);
      foliage(g, o.kind || 'bush', h - ph, ph);
      return g;
    },
    planter(o, p, w, d) {
      const g = G();
      B(g, w, 0.4, d, M(p.wood), 0, 0, 0);
      B(g, w - 0.04, 0.01, d - 0.04, M('#3a2a1c'), 0, 0.4, 0);
      const n = Math.max(2, Math.round(w / 0.3));
      for (let i = 0; i < n; i++) {
        const sub = G(); foliage(sub, ['bush', 'monstera', 'palm'][i % 3], 0.35 + (i % 3) * 0.2, 0);
        sub.position.set(-w / 2 + (w / n) * (i + 0.5), 0.4, 0); g.add(sub);
      }
      return g;
    },
    tent(o, p, w) {
      const g = G(), h = 1.45;
      const e = new T.Mesh(UK4, M('#f1e8d6', { roughness: 1, side: T.DoubleSide }));
      e.scale.set(w * 1.38, h, w * 1.38); e.position.y = h / 2; e.rotation.y = Math.PI / 4; g.add(e);
      const door = new T.Mesh(UK4, M(shade(p.accent, 0.6)));
      door.scale.set(w * 0.62, h * 0.62, 0.02); door.position.set(0, h * 0.31, w * 0.38); door.rotation.x = -0.33; g.add(door);
      for (let i = 0; i < 4; i++) C(g, 0.012, 0.3, M(p.wood), Math.sin(i * 1.571) * 0.03, h - 0.08, Math.cos(i * 1.571) * 0.03).rotation.set(Math.cos(i * 1.571) * 0.35, 0, -Math.sin(i * 1.571) * 0.35);
      for (let i = 0; i < 5; i++) B(g, 0.1, 0.1, 0.005, M([p.accent, p.accent2, '#f0c35a'][i % 3]), -0.3 + i * 0.15, 1.02 - Math.abs(i - 2) * 0.16, w * 0.2 + Math.abs(i - 2) * 0.1).rotation.z = 0.78;
      return g;
    },
    toybox(o, p, w, d) {
      const g = G();
      B(g, w, 0.36, d, M(p.wood), 0, 0, 0);
      const toys = ['#e2725b', '#f0c35a', '#5b8fb9', '#7fb685'];
      for (let i = 0; i < 4; i++) S(g, 0.16, 0.16, 0.16, M(toys[i]), -w / 2 + 0.12 + i * (w - 0.24) / 3, 0.4, (i % 2 ? 0.05 : -0.05));
      return g;
    },
    lamp(o, p) {
      const g = G(), m = M(p.wood2, { metalness: 0.4, roughness: 0.5 });
      C(g, 0.13, 0.02, m, 0, 0, 0); C(g, 0.012, 1.4, m, 0, 0.02, 0);
      const s = new T.Mesh(UK, M('#ffe6b8', { emissive: '#ffe6b8', emissiveIntensity: 0.8, side: T.DoubleSide }));
      s.scale.set(0.34, 0.26, 0.34); s.position.y = 1.5; s.userData.ns = 1; g.add(s);
      return g;
    },
    nightstand(o, p, w, d) {
      const g = G();
      legs(g, w, d, 0.14, M(p.wood2), 0.03);
      B(g, w, 0.34, d, M(p.wood), 0, 0.14, 0);
      B(g, w - 0.06, 0.008, 0.006, M(DARK), 0, 0.31, d / 2 + 0.002);
      C(g, 0.05, 0.14, M('#f1ede3'), 0, 0.48, 0);
      const s = C(g, 0.09, 0.14, glow('#ffe6b8', 0.9), 0, 0.62, 0); s.userData.ns = 1;
      return g;
    },
    changer(o, p, w, d) {
      const g = G();
      B(g, w, 0.06, d - 0.04, M(DARK), 0, 0, -0.01);
      B(g, w, 0.8, d, M(o.c || p.wood), 0, 0.06, 0);
      for (const y of [0.33, 0.6]) B(g, w - 0.04, 0.008, 0.006, M(DARK), 0, y, d / 2 + 0.002);
      for (const y of [0.2, 0.47, 0.73]) B(g, 0.16, 0.014, 0.02, M(p.wood2), 0, y, d / 2 + 0.01);
      B(g, w - 0.1, 0.05, d - 0.08, M('#ffffff', { roughness: 1 }), 0, 0.86, 0);
      for (const sx of [-1, 1]) B(g, 0.05, 0.1, d - 0.08, M(p.accent, { roughness: 1 }), sx * (w / 2 - 0.075), 0.86, 0);
      B(g, 0.18, 0.12, 0.14, M(p.accent2, { roughness: 1 }), -w / 2 + 0.22, 0.91, -d / 2 + 0.14);
      return g;
    },
    washer(o, p, w, d) {
      const g = G();
      B(g, w, 0.85, d, M(WHITE, { roughness: 0.4 }), 0, 0, 0);
      const r = C(g, 0.2, 0.02, M('#2b3038', { roughness: 0.2 }), 0, 0, d / 2 + 0.005); r.rotation.x = Math.PI / 2; r.position.y = 0.45;
      B(g, w - 0.08, 0.06, 0.006, M('#dfe2e4'), 0, 0.75, d / 2 + 0.002);
      C(g, 0.05, 0.2, M(p.accent2), -0.15, 0.85, 0); C(g, 0.04, 0.16, M(p.accent), 0.02, 0.85, -0.05);
      return g;
    },
    /* Giàn phơi gắn trần */
    dryrack(o, p, w, d) {
      const g = G(), m = M(STEEL, { metalness: 0.7, roughness: 0.3 });
      const cols = ['#ffffff', p.accent, '#e9e2d2', p.accent2, '#9cc5c1', '#ffffff', '#f0c35a'];
      for (const sz of [-1, 1]) {
        const rod = C(g, 0.01, w, m, 0, 0, sz * d * 0.3); rod.rotation.z = Math.PI / 2; rod.position.y = 2.25;
        for (const sx of [-1, 1]) C(g, 0.006, H - 2.25, m, sx * (w / 2 - 0.05), 2.25, sz * d * 0.3);
      }
      for (let i = 0; i < 7; i++) {
        const big = i % 3 === 0;
        B(g, big ? 0.03 : 0.02, big ? 0.6 : 0.3, big ? 0.42 : 0.22, M(cols[i], { roughness: 1 }), -w / 2 + 0.14 + i * (w - 0.28) / 6, 2.24 - (big ? 0.6 : 0.3), (i % 2 ? 1 : -1) * d * 0.3);
      }
      return g;
    },
    toilet(o, p, w, d) {
      const g = G(), m = M('#fbfbf9', { roughness: 0.25 });
      B(g, w - 0.04, 0.38, 0.17, m, 0, 0.4, -d / 2 + 0.09);
      const b = C(g, 0.18, 0.4, m, 0, 0, 0.06); b.scale.z = 0.46;
      const s = C(g, 0.19, 0.03, m, 0, 0.4, 0.06); s.scale.z = 0.48;
      B(g, 0.05, 0.015, 0.03, M(STEEL, { metalness: 0.8, roughness: 0.2 }), 0, 0.78, -d / 2 + 0.09);
      return g;
    },
    vanity(o, p, w, d) {
      const g = G(), steel = M(STEEL, { metalness: 0.8, roughness: 0.2 });
      B(g, w, 0.42, d, M(p.wood), 0, 0.36, 0);
      B(g, w + 0.02, 0.03, d + 0.02, M(p.top, { roughness: 0.35 }), 0, 0.78, 0);
      fronts(g, w, 0.38, 0.38, d / 2 + 0.002, 2, p.wood2);
      B(g, 0.46, 0.11, 0.32, M('#fbfbf9', { roughness: 0.25 }), 0, 0.81, 0.02);
      B(g, 0.38, 0.012, 0.24, M('#dfe3e4', { roughness: 0.2 }), 0, 0.915, 0.02);
      C(g, 0.012, 0.2, steel, 0, 0.81, -d / 2 + 0.05); B(g, 0.02, 0.02, 0.12, steel, 0, 1.0, -d / 2 + 0.1);
      C(g, 0.035, 0.1, M(p.accent2), w / 2 - 0.1, 0.81, -0.08);
      return g;
    },
    glass(o, p, w, d) {
      const g = G();
      if (o.slide) { /* một tấm cố định + một cánh lùa đang kéo kín */
        const st = M(STEEL, { metalness: 0.8, roughness: 0.2 }), hw = w / 2 + 0.03;
        B(g, hw, 2.0, 0.01, GLASS, -w / 2 + hw / 2, 0, -0.012).userData.ns = 1;
        B(g, hw, 2.0, 0.01, GLASS, w / 2 - hw / 2, 0, 0.012).userData.ns = 1;
        B(g, w, 0.04, 0.05, st, 0, 2.0, 0); B(g, w, 0.012, 0.05, st, 0, 0, 0);
        for (const sx of [-1, 1]) B(g, 0.015, 2.0, 0.015, st, sx * (w / 2 - 0.008), 0, sx * 0.012);
        B(g, 0.015, 2.0, 0.015, st, w / 2 - hw + 0.008, 0, 0.012);
        for (const sz of [-1, 1]) B(g, 0.02, 0.32, 0.025, st, w / 2 - hw + 0.07, 0.9, 0.012 + sz * 0.02);
        return g;
      }
      const e = B(g, w, 2.0, 0.012, GLASS, 0, 0, 0); e.userData.ns = 1;
      B(g, w, 0.025, 0.03, M(STEEL, { metalness: 0.8, roughness: 0.2 }), 0, 2.0, 0);
      return g;
    },
    shower(o, p, w, d) {
      const g = G(), t = M(o.c, { roughness: 0.3 }), steel = M(STEEL, { metalness: 0.8, roughness: 0.2 });
      B(g, w, 2.45, 0.012, t, 0, 0, -d / 2 + 0.008);
      B(g, 0.012, 2.45, d, t, -w / 2 + 0.008, 0, 0);
      B(g, w, 0.012, d, M(shade(o.c, 0.8), { roughness: 0.4 }), 0, 0, 0);
      const gr = M(shade(o.c, 1.25));
      for (let y = 0.3; y < 2.4; y += 0.3) { B(g, w, 0.006, 0.004, gr, 0, y, -d / 2 + 0.016); B(g, 0.004, 0.006, d, gr, -w / 2 + 0.016, y, 0); }
      C(g, 0.012, 1.2, steel, -w / 2 + 0.05, 0.95, -d / 2 + 0.4);
      B(g, 0.3, 0.014, 0.014, steel, -w / 2 + 0.19, 2.14, -d / 2 + 0.4);
      C(g, 0.11, 0.015, steel, -w / 2 + 0.34, 2.11, -d / 2 + 0.4);
      B(g, 0.05, 0.12, 0.05, steel, -w / 2 + 0.04, 1.0, -d / 2 + 0.4);
      return g;
    },
    mirror(o, p, w) {
      const g = G(), h = o.h || 0.8, y = (o.y || 1.5) - h / 2;
      B(g, w + 0.03, h + 0.03, 0.02, M(p.wood2), 0, y - 0.015, 0.01);
      B(g, w, h, 0.006, MIRROR, 0, y, 0.022);
      return g;
    },
    aircon(o, p, w, d) {
      const g = G(), y = o.y || 2.25, m = M('#f4f3ef', { roughness: 0.45 });
      B(g, w, 0.28, d, m, 0, y, d / 2);
      B(g, w - 0.02, 0.05, d - 0.03, M('#e4e2dc', { roughness: 0.5 }), 0, y - 0.012, d / 2 + 0.01);
      B(g, w - 0.1, 0.012, 0.01, M(DARK), 0, y + 0.035, d + 0.001);
      B(g, w - 0.06, 0.004, 0.006, M('#d9d6cf'), 0, y + 0.2, d + 0.001);
      B(g, 0.02, 0.008, 0.004, glow('#7fe08a', 1.2), w / 2 - 0.08, y + 0.09, d + 0.001).userData.ns = 1;
      return g;
    },
    walltv(o, p, w) {
      const g = G(), h = w * 0.57, y = (o.y || 1.35) - h / 2;
      B(g, 0.3, 0.2, 0.03, M(DARK), 0, y + h / 2 - 0.1, 0.015);
      B(g, w, h, 0.035, M('#0b0c0f', { roughness: 0.25 }), 0, y, 0.048);
      return g;
    },
    dresser(o, p, w, d) {
      const g = G(), m = M(p.wood, { roughness: 0.6 }), steel = M(STEEL, { metalness: 0.8, roughness: 0.2 });
      legs(g, w, d, 0.6, M(p.wood2), 0.035);
      B(g, w, 0.15, d, m, 0, 0.6, 0);
      fronts(g, w, 0.615, 0.12, d / 2 + 0.002, 2, p.wood2);
      const mr = C(g, 0.3, 0.012, MIRROR, 0, 0, 0); mr.rotation.x = Math.PI / 2; mr.position.set(0, 1.22, -d / 2 + 0.02);
      const fr = C(g, 0.32, 0.01, M(p.wood2), 0, 0, 0); fr.rotation.x = Math.PI / 2; fr.position.set(0, 1.22, -d / 2 + 0.01);
      C(g, 0.03, 0.12, M(p.accent2, { roughness: 0.4 }), -w / 2 + 0.12, 0.75, -0.05);
      C(g, 0.022, 0.08, M('#f1ede3', { roughness: 0.4 }), -w / 2 + 0.2, 0.75, 0.02);
      C(g, 0.04, 0.05, M(p.accent, { roughness: 0.4 }), -w / 2 + 0.28, 0.75, -0.08);
      B(g, 0.2, 0.05, 0.14, M('#f1ede3'), w / 2 - 0.18, 0.75, 0); C(g, 0.012, 0.02, steel, w / 2 - 0.18, 0.8, 0);
      return g;
    },
    art(o, p, w) {
      const g = G(), h = o.h || 0.6, y = (o.y || 1.5) - h / 2;
      B(g, w + 0.05, h + 0.05, 0.025, M(p.wood2), 0, y - 0.025, 0.013);
      B(g, w, h, 0.006, artMat(o.kind, p), 0, y, 0.027);
      return g;
    },
    panel(o, p, w) {
      const g = G(), h = o.h || 2.4, y = o.y0 || 0;
      if (o.kind === 'rattan') {
        B(g, w, h, 0.02, M(p.wood), 0, y, 0.01); B(g, w - 0.1, h - 0.1, 0.006, rattanTex(), 0, y + 0.05, 0.022);
      } else {
        B(g, w, h, 0.012, M(shade(p.wood, 0.75)), 0, y, 0.006);
        for (let x = -w / 2 + 0.03; x <= w / 2 - 0.02; x += 0.07) B(g, 0.03, h, 0.03, M(p.wood), x, y, 0.025);
      }
      return g;
    },
    /* Bàn thờ treo */
    wallaltar(o, p, w, d) {
      const g = G(), y = o.y || 1.9, m = M(p.wood2), red = M('#b3261e'), gold = M('#d9b24a', { metalness: 0.7, roughness: 0.35 });
      B(g, w + 0.1, 0.62, 0.02, m, 0, y - 0.06, 0.01);
      B(g, w, 0.045, d, m, 0, y, d / 2);
      for (const sx of [-1, 1]) B(g, 0.04, 0.2, d * 0.7, m, sx * (w / 2 - 0.06), y - 0.2, d * 0.35);
      B(g, w * 0.5, 0.3, 0.008, red, 0, y + 0.2, 0.024);
      B(g, w * 0.3, 0.04, 0.006, gold, 0, y + 0.33, 0.03);
      C(g, 0.06, 0.07, gold, 0, y + 0.045, d * 0.55);
      for (let i = -1; i <= 1; i++) C(g, 0.003, 0.2, red, i * 0.015, y + 0.11, d * 0.55);
      for (const sx of [-1, 1]) {
        C(g, 0.022, 0.1, red, sx * w * 0.3, y + 0.045, d * 0.4);
        const f = S(g, 0.03, 0.05, 0.03, glow('#ffb347', 1.2), sx * w * 0.3, y + 0.17, d * 0.4); f.userData.ns = 1;
      }
      C(g, 0.035, 0.12, M('#f1ede3', { roughness: 0.4 }), -w * 0.38, y + 0.045, d * 0.7);
      for (let i = 0; i < 3; i++) S(g, 0.07, 0.07, 0.07, M('#e9c02a'), -w * 0.38 + (i - 1) * 0.04, y + 0.2 + (i % 2) * 0.04, d * 0.7);
      C(g, 0.08, 0.02, M('#f1ede3', { roughness: 0.4 }), w * 0.36, y + 0.045, d * 0.7);
      for (let i = 0; i < 3; i++) S(g, 0.07, 0.07, 0.07, M(i ? '#e58a2b' : '#c9503a'), w * 0.36 + Math.sin(i * 2.1) * 0.04, y + 0.1, d * 0.7 + Math.cos(i * 2.1) * 0.04);
      return g;
    },
    rug(o, p, w, d) {
      const g = G(), m = rugMat(o.pat || 'plain', o.c || p.fabric, shade(o.c || p.fabric, 0.72));
      if (o.round) C(g, w / 2, 0.012, m, 0, 0, 0); else B(g, w, 0.012, d, m, 0, 0, 0);
      return g;
    },
    playmat(o, p, w, d) {
      const g = G(), cols = ['#f3d9c9', '#cfe3df', '#f6ecc9', '#dcd3ea'], s = 0.5;
      const nx = Math.round(w / s), nz = Math.round(d / s);
      for (let i = 0; i < nx; i++) for (let j = 0; j < nz; j++)
        B(g, w / nx - 0.006, 0.02, d / nz - 0.006, M(cols[(i + j * 2) % 4], { roughness: 1 }), -w / 2 + (w / nx) * (i + 0.5), 0, -d / 2 + (d / nz) * (j + 0.5));
      const toys = ['#e2725b', '#5b8fb9', '#f0c35a'];
      for (let i = 0; i < 3; i++) B(g, 0.09, 0.09, 0.09, M(toys[i]), -0.2 + i * 0.1, 0.02 + (i === 1 ? 0.09 : 0), 0.15 + (i === 1 ? 0.0 : (i ? 0.02 : -0.02)));
      S(g, 0.17, 0.17, 0.17, M('#7fb685'), 0.3, 0.105, -0.2);
      return g;
    },
    /* Mâm cơm đặt trên chiếu */
    mam(o, p, w) {
      const g = G(), cer = M('#f6f2e8', { roughness: 0.35 });
      C(g, w / 2, 0.025, M('#c9b27a', { metalness: 0.6, roughness: 0.4 }), 0, 0.012, 0);
      C(g, 0.13, 0.05, cer, 0, 0.037, 0); C(g, 0.11, 0.012, M('#7fa35a'), 0, 0.08, 0);
      const food = ['#c9503a', '#e0a23a', '#8a5a36'];
      for (let i = 0; i < 3; i++) {
        C(g, 0.09, 0.03, cer, Math.sin(i * 2.1) * 0.24, 0.037, Math.cos(i * 2.1) * 0.24);
        C(g, 0.07, 0.012, M(food[i]), Math.sin(i * 2.1) * 0.24, 0.062, Math.cos(i * 2.1) * 0.24);
        C(g, 0.055, 0.05, cer, Math.sin(i * 2.1 + 1.05) * 0.3, 0.037, Math.cos(i * 2.1 + 1.05) * 0.3);
      }
      return g;
    },
    pendant(o, p) {
      const g = G(), y = o.y || 1.75, kind = o.kind || 'dome';
      C(g, 0.004, H - y - 0.1, M(DARK), 0, y + 0.1, 0);
      let s;
      if (kind === 'lantern') {
        s = S(g, 0.42, 0.34, 0.42, M('#d9bd8f', { emissive: '#ffcf8a', emissiveIntensity: 0.55, map: rattanTex().map }), 0, y, 0);
      } else {
        const wide = kind === 'nonla';
        s = new T.Mesh(UK, M(wide ? '#ead9a8' : p.accent, { side: T.DoubleSide, emissive: wide ? '#ffcf8a' : '#000000', emissiveIntensity: 0.35 }));
        s.scale.set(wide ? 0.6 : 0.4, wide ? 0.22 : 0.24, wide ? 0.6 : 0.4); s.position.y = y + 0.02; g.add(s);
        const b = S(g, 0.09, 0.09, 0.09, glow('#fff0cc', 1.3), 0, y - 0.04, 0); b.userData.ns = 1;
      }
      s.userData.ns = 1;
      return g;
    }
  };

  HD.build = build;
  HD.mat = M;
  HD.shade = shade;
  HD.glow = glow;
  HD.GLASS = GLASS;
  HD.floorMat = floorMat;
  HD.prim = { B, C };
})();
