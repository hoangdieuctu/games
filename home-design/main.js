/* Dựng căn hộ, điều khiển đi lại và giao diện. */
(function () {
  const HD = window.HD, T = THREE, P = HD.PLAN, DS = HD.DESIGNS, B = HD.prim.B, C = HD.prim.C, M = HD.mat;
  const KEY = 'home-design-v1', R = 0.2, EYES = { walk: 1.6, baby: 0.55 };
  const $ = id => document.getElementById(id);

  /* ───── Trạng thái (lưu ở trình duyệt) ───── */
  const st = { d: 0, x: P.spawn.x, z: P.spawn.z, yaw: P.spawn.yaw, pitch: 0, view: 'walk', map: true, music: true, seen: false, az: 0, pol: 0.55, zoom: 1 };
  try { Object.assign(st, JSON.parse(localStorage.getItem(KEY) || '{}')); } catch (e) { /* bỏ qua dữ liệu hỏng */ }
  const q = new URLSearchParams(location.search);
  if (q.has('d')) st.d = Math.max(1, Math.min(DS.length, +q.get('d') || 1)) - 1;
  if (!DS[st.d]) st.d = 0;
  if (!['walk', 'baby', 'top'].includes(st.view)) st.view = 'walk';
  let dirty = false;
  function save() {
    if (!dirty) return;
    dirty = false;
    try { localStorage.setItem(KEY, JSON.stringify(st)); } catch (e) { /* hết chỗ lưu thì thôi */ }
  }
  setInterval(save, 1500);
  addEventListener('pagehide', save);

  /* ───── Cảnh ───── */
  const canvas = $('view');
  const renderer = new T.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
  renderer.outputEncoding = T.sRGBEncoding;
  renderer.toneMapping = T.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = T.PCFSoftShadowMap;
  renderer.shadowMap.autoUpdate = false;

  const scene = new T.Scene();
  scene.background = new T.Color('#cfe6f5');
  const camera = new T.PerspectiveCamera(72, 1, 0.05, 150);
  camera.rotation.order = 'YXZ';

  scene.add(new T.HemisphereLight('#fdfaf4', '#9a8c7c', 0.42));
  scene.add(new T.AmbientLight('#ffffff', 0.1));
  const sun = new T.DirectionalLight('#fff0d8', 2.2);
  sun.position.set(8, 7.5, 18); sun.target.position.set(4, 0, 3.5);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -8, right: 8, top: 8, bottom: -8, near: 1, far: 40 });
  sun.shadow.bias = -0.0005; sun.shadow.normalBias = 0.03;
  scene.add(sun, sun.target);
  /* Mỗi đèn trần một bóng sáng thật để bật tắt được; đèn phòng chính sáng hơn đèn phòng phụ */
  const BULB_I = [0.55, 0.3, 0.55, 0.5, 0.3, 0.3, 0.3, 0.55, 0.25, 0.55];
  const bulbs = P.lights.map(([x, z], i) => {
    const l = new T.PointLight('#ffe6c4', BULB_I[i], BULB_I[i] > 0.4 ? 6.5 : 4.5, 1.6); l.position.set(x, 2.3, z); scene.add(l);
    return l;
  });

  /* Dãy nhà phía xa ngoài cửa sổ */
  const city = new T.Group();
  for (let i = 0; i < 26; i++) {
    const h = 14 + (i * 37 % 23), w = 5 + (i * 13 % 6);
    const b = B(city, w, h, 6, M(['#b9c6d2', '#c9cfd6', '#aebccb', '#d5d2cb'][i % 4]), -60 + i * 5.2 + (i % 3), -26, 34 + (i * 29 % 30));
    b.userData.ns = 1;
  }
  scene.add(city);

  const blobTex = (() => {
    const c = document.createElement('canvas'); c.width = c.height = 128;
    const g = c.getContext('2d');
    g.shadowColor = '#000'; g.shadowBlur = 12; g.fillStyle = '#000'; g.fillRect(14, 14, 100, 100);
    return new T.CanvasTexture(c);
  })();
  const blobMat = new T.MeshBasicMaterial({ map: blobTex, transparent: true, opacity: 0.3, depthWrite: false });
  const blobGeo = new T.PlaneGeometry(1, 1).rotateX(-Math.PI / 2);

  let world, ceil, caps, wallCols = [], itemCols = [], fans = [];
  /* Những thứ bấm G để bật/tắt, mở/đóng. Mỗi thứ: pts (các điểm ngắm tới), on, t (0…1, vị trí hiện tại),
     label [khi đang tắt/đóng, khi đang bật/mở], apply(s) cho chuyển động, set(on) cho thay đổi tức thì, can(next). */
  let acts = [], dynCols = [], curAct = null;
  const V = (x, y, z) => new T.Vector3(x, y, z);
  const OFF_LAMP = new T.MeshStandardMaterial({ color: '#b9b2a4', roughness: 0.8, side: T.DoubleSide });
  function addAct(a) { a.t = a.on ? 1 : 0; if (a.t0 !== undefined) a.t = a.t0; acts.push(a); return a; }
  function toggleAct(a) {
    if (!a || (a.can && !a.can(!a.on))) return;
    a.on = !a.on; a.moving = true;
    if (a.set) a.set(a.on);
    renderer.shadowMap.needsUpdate = true;
  }
  const nearCol = c => st.x > c.x0 - R - 0.05 && st.x < c.x1 + R + 0.05 && st.z > c.z0 - R - 0.05 && st.z < c.z1 + R + 0.05;
  /* Đoạn thẳng (trên mặt bằng) có cắt qua tường không — để không bấm được thứ ở phòng bên kia tường */
  function blocked(x0, z0, x1, z1) {
    const dx = x1 - x0, dz = z1 - z0, l = Math.hypot(dx, dz);
    if (l < 0.2) return false;
    const k = (l - 0.16) / l, ex = dx * k, ez = dz * k;
    for (const c of wallCols) {
      let t0 = 0, t1 = 1, ok = true;
      for (const [o, e, lo, hi] of [[x0, ex, c.x0, c.x1], [z0, ez, c.z0, c.z1]]) {
        if (Math.abs(e) < 1e-9) { if (o < lo || o > hi) { ok = false; break; } continue; }
        let a = (lo - o) / e, b = (hi - o) / e; if (a > b) { const q = a; a = b; b = q; }
        t0 = Math.max(t0, a); t1 = Math.min(t1, b);
        if (t0 > t1) { ok = false; break; }
      }
      if (ok) return true;
    }
    return false;
  }
  const fwd = V(0, 0, 0), tmp = V(0, 0, 0);
  function pickAct() {
    camera.getWorldDirection(fwd);
    const c = camera.position;
    let best = null, bs = 9;
    for (const a of acts) for (const pt of a.pts) {
      tmp.subVectors(pt, c);
      const dist = tmp.length();
      if (dist > (a.range || 2.6)) continue;
      const ang = Math.acos(Math.max(-1, Math.min(1, tmp.dot(fwd) / (dist || 1))));
      if (ang > (dist < 0.9 ? 0.85 : 0.5)) continue;
      const sc = ang + dist * 0.05;
      if (sc < bs && !blocked(c.x, c.z, pt.x, pt.z)) { bs = sc; best = a; }
    }
    return best;
  }

  function wbox(g, wl, a, b, y0, y1, th, mat, off) {
    if (b - a < 0.001 || y1 - y0 < 0.001) return null;
    off = off || 0;
    return wl.axis === 'x' ? B(g, b - a, y1 - y0, th, mat, (a + b) / 2, y0, wl.at + off) : B(g, th, y1 - y0, b - a, mat, wl.at + off, y0, (a + b) / 2);
  }
  function collide(wl, a, b, th) {
    if (b - a < 0.001) return;
    wallCols.push(wl.axis === 'x' ? { x0: a, x1: b, z0: wl.at - th / 2, z1: wl.at + th / 2 } : { x0: wl.at - th / 2, x1: wl.at + th / 2, z0: a, z1: b });
  }

  /* Phía trong nhà của các tường có cửa sổ nhỏ: +1 là phía z (hoặc x) lớn hơn */
  const WIN_IN = { n2: 1, 'logia-w': 1 };
  function opening(wl, o, th, p) {
    const g = world, f = 0.05, t2 = th + 0.03, trim = M(p.trim), steel = M('#8d9197', { metalness: 0.7, roughness: 0.3 });
    if (o.type === 'door' || o.type === 'entry') {
      const doorM = M(p.door, { roughness: 0.6 }), L = o.b - o.a - 2 * f, hgt = o.y1 - f;
      wbox(g, wl, o.a, o.a + f, 0, o.y1, t2, trim); wbox(g, wl, o.b - f, o.b, 0, o.y1, t2, trim); wbox(g, wl, o.a, o.b, hgt, o.y1, t2, trim);
      /* Cánh cửa quay quanh bản lề: đóng thì nằm trong ô cửa, mở thì vuông góc với tường về phía side.
         Cửa chính mở vào trong nhà, lúc đầu đóng; cửa phòng lúc đầu mở. */
      const entry = o.type === 'entry', X = wl.axis === 'x', dirC = entry || o.hinge === 'a' ? 1 : -1, side = entry ? 1 : o.side;
      const along = dirC > 0 ? o.a + f : o.b - f, perp = wl.at + (entry ? 0 : side * (th / 2 + 0.02));
      const ang = (dx, dz) => Math.atan2(-dz, dx);
      const tc = X ? ang(dirC, 0) : ang(0, dirC);
      let to = X ? ang(0, side) : ang(side, 0);
      if (to - tc > Math.PI) to -= 2 * Math.PI; else if (tc - to > Math.PI) to += 2 * Math.PI;
      const zs = Math.sign((X ? Math.sin(to) : Math.cos(to)) * dirC) * 0.02;
      const pv = new T.Group(); pv.position.set(X ? along : perp, 0, X ? perp : along);
      B(pv, L, hgt, 0.04, doorM, L / 2, 0, zs); B(pv, 0.1, 0.03, 0.13, steel, L - 0.08, 1.0, zs);
      g.add(pv);
      const mid = (o.a + o.b) / 2, lp = wl.at + side * (th / 2 + L / 2);
      const col = entry ? null : Object.assign(X ? { x0: o.a, x1: o.b, z0: wl.at - th / 2, z1: wl.at + th / 2 } : { x0: wl.at - th / 2, x1: wl.at + th / 2, z0: o.a, z1: o.b }, { on: false });
      if (col) dynCols.push(col);
      const a = addAct({
        pts: [X ? V(mid, 1.05, wl.at + (entry ? 0.14 : 0)) : V(wl.at, 1.05, mid), X ? V(along, 1.05, lp) : V(lp, 1.05, along)],
        on: !entry, label: ['Mở cửa', 'Đóng cửa'],
        apply(s) { pv.rotation.y = tc + (to - tc) * s; },
        set(on) { if (col) col.on = !on; },
        can: next => next || !col || !nearCol(col)
      });
      a.apply(a.t);
      return;
    }
    /* Vách kính kín sàn-trần: khung mảnh, tấm kính lớn; cửa sổ thường: khung dày, chia ô nhỏ */
    const full = o.type === 'glass', fr = full ? 0.03 : 0.045, mw = full ? 0.015 : 0.02;
    wbox(g, wl, o.a, o.b, o.y1 - fr, o.y1, t2, trim);
    wbox(g, wl, o.a, o.b, o.y0, o.y0 + fr, o.y0 > 0 ? th + 0.1 : t2, trim);
    wbox(g, wl, o.a, o.a + fr, o.y0, o.y1, t2, trim); wbox(g, wl, o.b - fr, o.b, o.y0, o.y1, t2, trim);
    const n = full ? Math.max(2, Math.round((o.b - o.a) / 1.4)) : Math.max(1, Math.round((o.b - o.a) / 0.9));
    for (let i = 1; i < n; i++) { const x = o.a + (o.b - o.a) * i / n; wbox(g, wl, x - mw, x + mw, o.y0, o.y1, 0.05, trim); }
    wbox(g, wl, o.a, o.b, o.y0, o.y1, 0.012, HD.GLASS).userData.ns = 1;
    const X = wl.axis === 'x', mid = (o.a + o.b) / 2;
    const span = (m, a, b) => { if (X) { m.scale.x = b - a; m.position.x = (a + b) / 2; } else { m.scale.z = b - a; m.position.z = (a + b) / 2; } };
    const at = (al, y, pe) => X ? V(al, y, pe) : V(pe, y, al);
    if (o.type === 'window' && p.winblind && WIN_IN[wl.id]) {
      /* Rèm cuốn cho cửa sổ nhỏ (phòng tắm, lô gia): hộp rèm trên đầu, vải lúc đầu thả lưng chừng; G để kéo kín / cuốn lên */
      const wo = WIN_IN[wl.id] * (th / 2 + 0.045), y1 = o.y1 + 0.03, fullH = o.y1 - o.y0 + 0.07;
      wbox(g, wl, o.a - 0.05, o.b + 0.05, o.y1 + 0.02, o.y1 + 0.09, 0.07, M('#f1efea', { roughness: 0.6 }), wo);
      const fab = wbox(g, wl, o.a - 0.03, o.b + 0.03, 0, 1, 0.008, M(p.curtain, { roughness: 1 }), wo);
      const bar = wbox(g, wl, o.a - 0.03, o.b + 0.03, 0, 0.025, 0.02, M('#b9b3a6'), wo);
      const a = addAct({
        pts: [at(mid, (o.y0 + o.y1) / 2, wl.at + wo)], on: false, t0: 0.5, label: ['Kéo rèm xuống', 'Cuốn rèm lên'],
        apply(s) { const h = fullH * (0.08 + 0.92 * s); fab.scale.y = h; fab.position.y = y1 - h / 2; bar.position.y = y1 - h; }
      });
      a.apply(a.t);
    }
    if (wl.id !== 's' || p.nocurtain) return;
    /* Rèm hoặc mành tre cho cửa hướng nam; vách kính kín thì rèm nằm gọn trong lòng ô, không chờm lên tường và trần.
       Bấm G: rèm vải kéo kín hai nửa vào giữa, mành tre thả xuống tới sàn. */
    const off = -(th / 2 + 0.07), ex = full ? 0 : 1, top = Math.min(o.y1 + 0.12, P.H - 0.035);
    const pts = [at(o.a + 0.25, 1.4, wl.at + off), at(mid, 1.4, wl.at + off), at(o.b - 0.25, 1.4, wl.at + off)];
    if (p.blind) {
      const bg = new T.Group(); bg.position.y = top; g.add(bg);
      wbox(bg, wl, o.a - 0.05 * ex, o.b + 0.05 * ex, -0.62, -0.04, 0.025, M('#c9a66b', { roughness: 1 }), off);
      for (let y = -0.58; y < -0.06; y += 0.07) wbox(bg, wl, o.a - 0.05 * ex, o.b + 0.05 * ex, y, y + 0.008, 0.03, M('#a9865a'), off);
      pts.push(at(mid, top - 0.3, wl.at + off));
      addAct({ pts, on: false, label: ['Thả mành xuống', 'Cuốn mành lên'], apply(s) { bg.scale.y = 1 + s * ((top - 0.06) / 0.62 - 1); } });
    } else {
      const cm = M(p.curtain, { roughness: 1 }), a0 = o.a - 0.14 * ex, b0 = o.b + 0.14 * ex, half = (b0 - a0) / 2 + 0.01;
      const l = wbox(g, wl, a0, a0 + 0.34, 0.03, top, 0.07, cm, off), r = wbox(g, wl, b0 - 0.34, b0, 0.03, top, 0.07, cm, off);
      wbox(g, wl, o.a - 0.2 * ex, o.b + 0.2 * ex, top, top + 0.025, 0.02, M('#3a3a3a'), off);
      addAct({ pts, on: false, label: ['Kéo rèm lại', 'Mở rèm ra'], apply(s) { const w = 0.34 + (half - 0.34) * s; span(l, a0, a0 + w); span(r, b0 - w, b0); } });
    }
  }

  function fan(x, z, swPt, rocker) {
    const g = new T.Group(), m = M('#5a4a3a'), rotor = new T.Group();
    C(g, 0.015, 0.32, m, 0, P.H - 0.32, 0); C(g, 0.09, 0.09, m, 0, P.H - 0.4, 0);
    C(g, 0.07, 0.03, HD.glow('#fff3d6', 0.9), 0, P.H - 0.43, 0);
    for (let i = 0; i < 3; i++) {
      const arm = new T.Group(); arm.rotation.y = i * 2.094;
      B(arm, 0.6, 0.012, 0.13, M('#7a5a3c'), 0.4, 0, 0); rotor.add(arm);
    }
    rotor.position.y = P.H - 0.36; g.add(rotor);
    g.position.set(x, 0, z);
    g.traverse(o => { o.userData.ns = 1; });
    ceil.add(g);
    const a = addAct({
      pts: [V(x, P.H - 0.4, z)].concat(swPt ? [swPt] : []), on: true, range: 3.2, label: ['Bật quạt', 'Tắt quạt'],
      set(on) { if (rocker) rocker.rotation.x = on ? -0.14 : 0.14; }
    });
    a.set(true); fans.push({ rotor, a });
  }
  /* Mặt công tắc trên tường; trả về phím bấm (để nghiêng khi bật/tắt) và điểm ngắm */
  function plate(g, x) {
    B(g, 0.086, 0.12, 0.012, M('#f6f4ef', { roughness: 0.5 }), x, 1.16, 0.006);
    const rk = B(g, 0.04, 0.066, 0.01, M('#e2dfd7', { roughness: 0.4 }), x, 1.187, 0.014);
    return { rk, pt: g.localToWorld(V(x, 1.22, 0.02)) };
  }

  /* Đăng ký các thứ bấm được nằm trong một món đồ (cánh tủ, ngăn kéo, đèn, cánh kính lùa) */
  function regItem(g, w) {
    g.updateMatrixWorld(true);
    g.traverse(o => {
      const a = o.userData.act;
      if (!a) return;
      if (a.type === 'cab') {
        addAct({
          pts: a.pts.map(q => o.localToWorld(V(q[0], q[1], q[2]))), on: false, label: ['Mở tủ', 'Đóng tủ'],
          apply(s) { for (const l of a.leaves) { if (l.ang) l.pv.rotation.y = l.ang * s; else l.pv.position.z = l.z + 0.24 * s; } }
        });
      } else if (a.type === 'lamp') {
        const onM = o.material;
        addAct({ pts: [o.getWorldPosition(V(0, 0, 0))], on: true, range: 3, label: ['Bật đèn', 'Tắt đèn'], set(on) { o.material = on ? onM : OFF_LAMP; } });
      } else if (a.type === 'slide') {
        const rect = (x0, x1) => {
          const p = g.localToWorld(V(x0, 0, 0)), q = g.localToWorld(V(x1, 0, 0));
          return { x0: Math.min(p.x, q.x) - 0.02, x1: Math.max(p.x, q.x) + 0.02, z0: Math.min(p.z, q.z) - 0.02, z1: Math.max(p.z, q.z) + 0.02 };
        };
        itemCols.push(rect(w / 2 - a.hw, w / 2));
        const col = Object.assign(rect(-w / 2, -w / 2 + a.hw), { on: true });
        dynCols.push(col);
        addAct({
          pts: [g.localToWorld(V(-w / 2 + a.hw / 2, 1.05, 0))], on: false, label: ['Mở cửa kính', 'Đóng cửa kính'],
          apply(s) { o.position.x = a.dx * s; }, set(on) { col.on = !on; }, can: next => next || !nearCol(col)
        });
      }
    });
  }

  function build() {
    for (let i = 0; i < bulbs.length; i++) bulbs[i].intensity = BULB_I[i];
    if (world) {
      scene.remove(world);
      world.traverse(o => { if (o.userData.own) o.geometry.dispose(); });
    }
    world = new T.Group(); ceil = new T.Group(); caps = new T.Group(); world.add(ceil, caps);
    wallCols = []; itemCols = []; fans = []; acts = []; dynCols = []; curAct = null;
    const d = DS[st.d], p = d.pal, wallM = M(p.wall, { roughness: 0.95 }), capM = M('#4a3f36');

    for (const wl of P.walls) {
      if (d.remove.includes(wl.id)) continue;
      const th = wl.thick || P.T, a = wl.a - P.T / 2, b = wl.b + P.T / 2;
      let cur = a, cs = a;
      for (const o of (wl.open || [])) {
        wbox(world, wl, cur, o.a, 0, P.H, th, wallM);
        wbox(world, wl, o.a, o.b, o.y1, P.H, th, wallM);
        wbox(world, wl, o.a, o.b, 0, o.y0, th, wallM);
        cur = o.b;
        if (o.type === 'door') { collide(wl, cs, o.a, th); cs = o.b; }
        opening(wl, o, th, p);
      }
      wbox(world, wl, cur, b, 0, P.H, th, wallM);
      wbox(caps, wl, a, b, P.H, P.H + 0.02, th, capM).userData.ns = 1;
      collide(wl, cs, b, th);
    }

    for (const r of P.rooms) {
      const fm = HD.floorMat(p.floor[r.id] || p.floor[r.floor]);
      for (const c of r.rects) {
        const geo = new T.PlaneGeometry(c[2] - c[0], c[3] - c[1]).rotateX(-Math.PI / 2).translate((c[0] + c[2]) / 2, 0, (c[1] + c[3]) / 2);
        const uv = geo.attributes.uv, pos = geo.attributes.position;
        for (let i = 0; i < uv.count; i++) uv.setXY(i, pos.getX(i) / fm.size, pos.getZ(i) / fm.size);
        const m = new T.Mesh(geo, fm.mat); m.userData.own = 1; m.userData.ns = 1; world.add(m);
      }
    }

    const ceilM = M(p.ceil, { roughness: 1 });
    B(ceil, 4.34, 0.1, 3.3, ceilM, 6.9, P.H, 1.6);
    B(ceil, 9.14, 0.1, 5.64, ceilM, 4.5, P.H, 5.95);
    const discOn = HD.glow('#fff6e0', 1), discOff = M('#dedbd3', { roughness: 0.6 });
    const discs = P.lights.map(([x, z]) => { const m = C(ceil, 0.14, 0.02, discOn, x, P.H - 0.02, z); m.userData.ns = 1; return m; });
    /* Công tắc: mỗi cái điều khiển đèn trần của một phòng; phòng có quạt trần thì thêm một công tắc quạt bên cạnh */
    for (const sw of P.switches) {
      const sg = new T.Group(); sg.position.set(sw.x, 0, sw.z); sg.rotation.y = sw.r * Math.PI / 2; world.add(sg); sg.updateMatrixWorld(true);
      const pl = plate(sg, 0);
      const a = addAct({
        pts: [pl.pt].concat(sw.lights.map(i => V(P.lights[i][0], P.H - 0.03, P.lights[i][1]))), on: true, range: 3.2, label: ['Bật đèn', 'Tắt đèn'],
        set(on) {
          pl.rk.rotation.x = on ? -0.14 : 0.14;
          for (const i of sw.lights) { discs[i].material = on ? discOn : discOff; bulbs[i].intensity = on ? BULB_I[i] : 0; }
        }
      });
      a.set(true);
      if (sw.fan && d.fans.includes(sw.fan)) { const fp = plate(sg, 0.105); fan(P.fanAt[sw.fan][0], P.fanAt[sw.fan][1], fp.pt, fp.rk); }
    }

    for (const it of d.items) {
      const [w, dd] = HD.sizeOf(it);
      const g = HD.build[it[0]](it[4] || {}, p, w, dd);
      g.position.set(it[1], 0, it[2]); g.rotation.y = (it[3] || 0) * Math.PI / 2;
      (HD.CEIL[it[0]] ? ceil : world).add(g);
      const slide = it[0] === 'glass' && (it[4] || {}).slide;
      regItem(g, w);
      for (const f of slide ? [] : HD.footprints(it)) {
        itemCols.push(f);
        if (it[0] === 'glass') continue;
        const s = new T.Mesh(blobGeo, blobMat);
        s.scale.set(f.x1 - f.x0 + 0.22, 1, f.z1 - f.z0 + 0.22);
        s.position.set((f.x0 + f.x1) / 2, 0.016, (f.z0 + f.z1) / 2); s.userData.ns = 1; s.userData.blob = 1; world.add(s);
      }
    }

    world.traverse(o => {
      if (!o.isMesh) return;
      o.castShadow = !o.userData.ns && !o.material.transparent;
      o.receiveShadow = !o.userData.blob;
    });
    scene.add(world);
    applyView();
  }

  /* Nhìn từ trên cao thì bỏ trần, tô đậm đỉnh tường và giảm nắng cho đỡ chói */
  function applyView() {
    const top = st.view === 'top';
    ceil.visible = !top; caps.visible = top;
    sun.intensity = top ? 1.0 : 2.2;
    renderer.shadowMap.needsUpdate = true;
  }

  /* ───── Va chạm ───── */
  function hit(x, z) {
    for (const list of [wallCols, itemCols, dynCols]) for (const c of list) {
      if (c.on === false) continue;
      const dx = x - Math.max(c.x0, Math.min(x, c.x1)), dz = z - Math.max(c.z0, Math.min(z, c.z1));
      if (dx * dx + dz * dz < R * R) return true;
    }
    return !HD.roomAt(x, z);
  }
  /* Đổi thiết kế mà chỗ đang đứng bị đồ chiếm thì lùi ra chỗ trống gần nhất */
  function unstick() {
    if (!hit(st.x, st.z)) return;
    for (let r = 0.1; r < 2.5; r += 0.1) for (let a = 0; a < 6.28; a += 0.39) {
      const x = st.x + Math.cos(a) * r, z = st.z + Math.sin(a) * r;
      if (!hit(x, z)) { st.x = x; st.z = z; return; }
    }
    st.x = P.spawn.x; st.z = P.spawn.z; st.yaw = P.spawn.yaw;
  }

  /* ───── Điều khiển ───── */
  const keys = {}, joy = { x: 0, y: 0 }, ptrs = new Map();
  let joyId = null, joyO = null, eye = EYES[st.view] || EYES.walk;
  addEventListener('keydown', e => {
    /* Dùng e.code (vị trí phím) chứ không dùng e.key: bộ gõ tiếng Việt biến a, s, d, w thành dấu
       nên e.key lúc nhấn và lúc nhả không khớp nhau, phím bị kẹt hoặc không ăn. */
    if (e.metaKey || e.ctrlKey || e.altKey) { releaseKeys(); return; }
    keys[e.code] = true;
    if (e.code.startsWith('Arrow')) e.preventDefault();
    hideHint();
    /* Phím tắt, dùng được cả khi chuột đang bị khoá để nhìn quanh */
    if (e.repeat) return;
    if (e.code === 'Digit1') setView('walk');
    else if (e.code === 'Digit2') setView('baby');
    else if (e.code === 'Digit3') setView('top');
    else if (e.code === 'KeyN') setDesign(st.d - 1);
    else if (e.code === 'KeyM') setDesign(st.d + 1);
    else if (e.code === 'KeyG' && st.view !== 'top') toggleAct(curAct);
  });
  /* macOS không báo nhả phím khi đang giữ Cmd, nên nhả Cmd thì coi như nhả hết */
  addEventListener('keyup', e => { if (e.key === 'Meta') releaseKeys(); else keys[e.code] = false; });
  function releaseKeys() { for (const k in keys) keys[k] = false; }
  addEventListener('blur', releaseKeys);
  document.addEventListener('visibilitychange', releaseKeys);

  const joyEl = $('joy'), knob = joyEl.firstElementChild;
  canvas.addEventListener('pointerdown', e => {
    hideHint();
    /* Chuột: khoá con trỏ, rê chuột là nhìn quanh như game; Esc để thả */
    if (e.pointerType === 'mouse' && st.view !== 'top') { lockMouse(); return; }
    canvas.setPointerCapture(e.pointerId);
    if (st.view !== 'top' && e.pointerType === 'touch' && joyId === null && e.clientX < innerWidth * 0.45 && e.clientY > innerHeight * 0.35) {
      joyId = e.pointerId; joyO = { x: e.clientX, y: e.clientY };
      joyEl.style.left = joyO.x + 'px'; joyEl.style.top = joyO.y + 'px'; joyEl.classList.add('on');
      return;
    }
    ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
  });
  canvas.addEventListener('pointermove', e => {
    if (e.pointerId === joyId) {
      let dx = e.clientX - joyO.x, dy = e.clientY - joyO.y;
      const l = Math.hypot(dx, dy), m = 46;
      if (l > m) { dx *= m / l; dy *= m / l; }
      joy.x = dx / m; joy.y = -dy / m;
      knob.style.transform = `translate(${dx}px,${dy}px)`;
      return;
    }
    const pt = ptrs.get(e.pointerId);
    if (!pt) return;
    const dx = e.clientX - pt.x, dy = e.clientY - pt.y;
    if (st.view === 'top') {
      if (ptrs.size === 2) {
        const other = [...ptrs.entries()].find(([id]) => id !== e.pointerId)[1];
        const before = Math.hypot(pt.x - other.x, pt.y - other.y), after = Math.hypot(e.clientX - other.x, e.clientY - other.y);
        if (before > 10) st.zoom = Math.max(0.45, Math.min(1.6, st.zoom * before / after));
      } else {
        st.az -= dx * 0.006; st.pol = Math.max(0.02, Math.min(1.25, st.pol - dy * 0.005));
      }
    } else {
      st.yaw -= dx * 0.0045; st.pitch = Math.max(-1.2, Math.min(1.2, st.pitch - dy * 0.0045));
    }
    pt.x = e.clientX; pt.y = e.clientY; dirty = true;
  });
  const locked = () => document.pointerLockElement === canvas;
  function lockMouse() {
    if (!locked() && canvas.requestPointerLock) canvas.requestPointerLock();
  }
  document.addEventListener('mousemove', e => {
    if (!locked()) return;
    st.yaw -= e.movementX * 0.0025; st.pitch = Math.max(-1.2, Math.min(1.2, st.pitch - e.movementY * 0.0025));
    dirty = true;
  });
  document.addEventListener('pointerlockchange', () => { document.body.classList.toggle('locked', locked()); if (!locked()) releaseKeys(); });
  const up = e => {
    if (e.pointerId === joyId) { joyId = null; joy.x = joy.y = 0; knob.style.transform = ''; joyEl.classList.remove('on'); }
    ptrs.delete(e.pointerId);
  };
  canvas.addEventListener('pointerup', up);
  canvas.addEventListener('pointercancel', up);
  canvas.addEventListener('wheel', e => {
    e.preventDefault();
    if (st.view === 'top') { st.zoom = Math.max(0.45, Math.min(1.6, st.zoom * (1 + Math.sign(e.deltaY) * 0.08))); dirty = true; }
  }, { passive: false });

  function move(dt) {
    let f = joy.y, s = joy.x, turn = 0;
    if (keys.KeyW || keys.ArrowUp) f += 1;
    if (keys.KeyS || keys.ArrowDown) f -= 1;
    if (keys.KeyD) s += 1;
    if (keys.KeyA) s -= 1;
    if (keys.ArrowLeft || keys.KeyQ) turn += 1;
    if (keys.ArrowRight || keys.KeyE) turn -= 1;
    if (turn) { st.yaw += turn * dt * 2.2; dirty = true; }
    const len = Math.hypot(f, s);
    if (!len) return;
    if (len > 1) { f /= len; s /= len; }
    const sp = (keys.ShiftLeft || keys.ShiftRight ? 3.2 : 1.9) * (st.view === 'baby' ? 0.6 : 1) * dt;
    const sin = Math.sin(st.yaw), cos = Math.cos(st.yaw);
    const dx = (-sin * f + cos * s) * sp, dz = (-cos * f - sin * s) * sp;
    if (!hit(st.x + dx, st.z)) st.x += dx;
    if (!hit(st.x, st.z + dz)) st.z += dz;
    dirty = true;
  }

  /* ───── Bản đồ nhỏ ───── */
  const map = $('map'), mg = map.getContext('2d'), MS = 15;
  function drawMap() {
    const dpr = Math.min(devicePixelRatio || 1, 2), k = MS * dpr;
    if (map.width !== Math.round(P.W * k)) { map.width = Math.round(P.W * k); map.height = Math.round(P.D * k); }
    mg.setTransform(k, 0, 0, k, 0, 0);
    mg.clearRect(0, 0, P.W, P.D);
    mg.fillStyle = 'rgba(255,252,245,.92)';
    for (const r of P.rooms) for (const c of r.rects) mg.fillRect(c[0], c[1], c[2] - c[0], c[3] - c[1]);
    mg.fillStyle = '#d8c3a3';
    for (const c of itemCols) mg.fillRect(c.x0, c.z0, c.x1 - c.x0, c.z1 - c.z0);
    mg.fillStyle = '#4a3b2e';
    for (const c of wallCols) mg.fillRect(c.x0, c.z0, c.x1 - c.x0, c.z1 - c.z0);
    mg.fillStyle = '#a07a52';
    for (const c of dynCols) if (c.on) mg.fillRect(c.x0, c.z0, c.x1 - c.x0, c.z1 - c.z0);
    if (st.view === 'top') return;
    mg.save(); mg.translate(st.x, st.z); mg.rotate(-st.yaw);
    mg.fillStyle = 'rgba(214,73,51,.25)'; mg.beginPath(); mg.moveTo(0, 0); mg.arc(0, 0, 1.5, -Math.PI / 2 - 0.6, -Math.PI / 2 + 0.6); mg.fill();
    mg.fillStyle = '#d64933'; mg.beginPath(); mg.arc(0, 0, 0.24, 0, 7); mg.fill();
    mg.restore();
  }
  map.addEventListener('click', e => {
    if (st.view === 'top') return;
    const b = map.getBoundingClientRect(), x = (e.clientX - b.left) / b.width * P.W, z = (e.clientY - b.top) / b.height * P.D;
    if (!hit(x, z)) { st.x = x; st.z = z; dirty = true; }
  });

  /* ───── Giao diện ───── */
  const sheet = $('sheet'), hint = $('hint');
  const swatches = p => [p.wall, p.wood, p.fabric, p.accent, p.accent2].map(c => `<i style="background:${c}"></i>`).join('');
  function hideHint() {
    if (hint.hidden) return;
    hint.hidden = true; st.seen = true; dirty = true;
  }
  function refreshUI() {
    const d = DS[st.d];
    $('curTag').textContent = `Thiết kế ${st.d + 1}/${DS.length} · ${d.style}`;
    $('curName').textContent = d.name;
    sheet.querySelectorAll('.opt').forEach((b, i) => b.classList.toggle('on', i === st.d));
    document.querySelectorAll('#views button').forEach(b => b.classList.toggle('on', b.dataset.v === st.view));
    map.hidden = !st.map;
    $('btnSound').classList.toggle('off', !st.music);
    document.body.classList.toggle('top', st.view === 'top');
  }
  function setDesign(i) {
    st.d = (i + DS.length) % DS.length;
    build(); unstick(); refreshUI(); dirty = true;
  }
  function setView(v) {
    st.view = v;
    if (v === 'top' && locked()) document.exitPointerLock();
    applyView(); refreshUI(); dirty = true;
  }

  $('list').innerHTML = DS.map((d, i) => `<button class="opt" data-i="${i}"><span class="num">${i + 1}</span>
    <span class="txt"><b>${d.name}</b><small>${d.style} · ${d.bed2}</small></span><span class="sw">${swatches(d.pal)}</span></button>`).join('');
  $('list').addEventListener('click', e => {
    const b = e.target.closest('.opt');
    if (b) { setDesign(+b.dataset.i); sheet.hidden = true; }
  });
  $('prev').onclick = () => setDesign(st.d - 1);
  $('next').onclick = () => setDesign(st.d + 1);
  $('cur').onclick = () => { sheet.hidden = !sheet.hidden; };
  /* Nhạc nền: bắt đầu ở thao tác đầu tiên, tạm dừng khi rời trang */
  let started = false;
  function startMusic() {
    if (started) return;
    started = true; HD.music.set(st.music);
  }
  addEventListener('pointerdown', startMusic);
  addEventListener('keydown', startMusic);
  document.addEventListener('visibilitychange', () => { if (started) HD.music.set(st.music && !document.hidden); });
  $('btnSound').onclick = () => { st.music = !st.music; started = true; HD.music.set(st.music); refreshUI(); dirty = true; };
  $('btnMap').onclick = () => { st.map = !st.map; refreshUI(); dirty = true; };
  sheet.querySelector('.close').onclick = () => { sheet.hidden = true; };
  document.querySelectorAll('#views button').forEach(b => { b.onclick = () => setView(b.dataset.v); });
  hint.onclick = () => { hideHint(); if (st.view !== 'top' && matchMedia('(pointer: fine)').matches) lockMouse(); };
  hint.hidden = st.seen;
  $('btnFull').onclick = () => {
    const el = document.documentElement;
    if (document.fullscreenElement || document.webkitFullscreenElement) (document.exitFullscreen || document.webkitExitFullscreen).call(document);
    else (el.requestFullscreen || el.webkitRequestFullscreen || (() => {})).call(el);
  };

  function resize() {
    renderer.setSize(innerWidth, innerHeight, false);
    camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix();
  }
  addEventListener('resize', resize);

  /* ───── Vòng lặp ───── */
  let last = performance.now(), actOn = null;
  const actEl = $('act'), actTxt = $('actTxt');
  actEl.onclick = () => toggleAct(curAct);
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    if (st.view === 'top') {
      const dist = 12.5 * st.zoom / Math.min(1, camera.aspect * 0.95), sp = Math.sin(st.pol);
      camera.position.set(4.5 + dist * sp * Math.sin(st.az), 0.5 + dist * Math.cos(st.pol), 4.5 + dist * sp * Math.cos(st.az));
      camera.lookAt(4.5, 0.5, 4.5);
    } else {
      move(dt);
      eye += (EYES[st.view] - eye) * Math.min(1, dt * 8);
      camera.position.set(st.x, eye, st.z);
      camera.rotation.set(st.pitch, st.yaw, 0);
    }
    /* Chuyển động mở/đóng: t trượt dần về 0 hoặc 1, có hãm ở hai đầu */
    for (const a of acts) {
      if (!a.moving) continue;
      const to = a.on ? 1 : 0, step = dt / (a.apply ? 0.45 : 0.9);
      a.t = Math.abs(to - a.t) <= step ? to : a.t + Math.sign(to - a.t) * step;
      if (a.apply) a.apply(a.t * a.t * (3 - 2 * a.t));
      if (a.t === to) a.moving = false;
      renderer.shadowMap.needsUpdate = true;
    }
    for (const f of fans) f.rotor.rotation.y += dt * 4 * f.a.t;
    const na = st.view === 'top' ? null : pickAct();
    if (na !== curAct || (na && na.on !== actOn)) {
      curAct = na; actOn = na && na.on;
      actEl.hidden = !na;
      if (na) actTxt.textContent = na.label[na.on ? 1 : 0];
    }
    renderer.render(scene, camera);
    if (st.map) drawMap();
    requestAnimationFrame(frame);
  }

  resize();
  build(); unstick(); refreshUI();
  requestAnimationFrame(frame);
})();
