/* Dựng căn hộ, điều khiển đi lại và giao diện. */
(function () {
  const HD = window.HD, T = THREE, P = HD.PLAN, DS = HD.DESIGNS, B = HD.prim.B, C = HD.prim.C, M = HD.mat;
  const KEY = 'home-design-v1', R = 0.2, EYES = { walk: 1.6, baby: 0.55 };
  const $ = id => document.getElementById(id);

  /* ───── Trạng thái (lưu ở trình duyệt) ───── */
  const st = { d: 0, x: P.spawn.x, z: P.spawn.z, yaw: P.spawn.yaw, pitch: 0, view: 'walk', map: true, seen: false, az: 0, pol: 0.55, zoom: 1 };
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
  [[7.55, 1.8], [7.55, 6.8], [1.7, 6.8], [4.65, 7.2], [5, 5.3]].forEach(([x, z]) => {
    const l = new T.PointLight('#ffe6c4', 0.55, 6.5, 1.6); l.position.set(x, 2.3, z); scene.add(l);
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

  function wbox(g, wl, a, b, y0, y1, th, mat, off) {
    if (b - a < 0.001 || y1 - y0 < 0.001) return null;
    off = off || 0;
    return wl.axis === 'x' ? B(g, b - a, y1 - y0, th, mat, (a + b) / 2, y0, wl.at + off) : B(g, th, y1 - y0, b - a, mat, wl.at + off, y0, (a + b) / 2);
  }
  function collide(wl, a, b, th) {
    if (b - a < 0.001) return;
    wallCols.push(wl.axis === 'x' ? { x0: a, x1: b, z0: wl.at - th / 2, z1: wl.at + th / 2 } : { x0: wl.at - th / 2, x1: wl.at + th / 2, z0: a, z1: b });
  }

  function opening(wl, o, th, p) {
    const g = world, f = 0.05, t2 = th + 0.03, trim = M(p.trim), steel = M('#8d9197', { metalness: 0.7, roughness: 0.3 });
    if (o.type === 'door' || o.type === 'entry') {
      const doorM = M(p.door, { roughness: 0.6 }), L = o.b - o.a - 2 * f, hgt = o.y1 - f;
      wbox(g, wl, o.a, o.a + f, 0, o.y1, t2, trim); wbox(g, wl, o.b - f, o.b, 0, o.y1, t2, trim); wbox(g, wl, o.a, o.b, hgt, o.y1, t2, trim);
      if (o.type === 'entry') {
        wbox(g, wl, o.a + f, o.b - f, 0, hgt, 0.05, doorM);
        wbox(g, wl, o.b - f - 0.14, o.b - f - 0.1, 0.95, 1.12, 0.13, steel);
      } else {
        const hx = o.hinge === 'a' ? o.a + f + 0.02 : o.b - f - 0.02, off = o.side * (L / 2 + th / 2), he = o.side * (L + th / 2 - 0.1);
        if (wl.axis === 'x') { B(g, 0.04, hgt, L, doorM, hx, 0, wl.at + off); B(g, 0.1, 0.03, 0.12, steel, hx, 1.0, wl.at + he); }
        else { B(g, L, hgt, 0.04, doorM, wl.at + off, 0, hx); B(g, 0.12, 0.03, 0.1, steel, wl.at + he, 1.0, hx); }
      }
      return;
    }
    const fr = 0.045;
    wbox(g, wl, o.a, o.b, o.y1 - fr, o.y1, t2, trim);
    wbox(g, wl, o.a, o.b, o.y0, o.y0 + fr, o.y0 > 0 ? th + 0.1 : t2, trim);
    wbox(g, wl, o.a, o.a + fr, o.y0, o.y1, t2, trim); wbox(g, wl, o.b - fr, o.b, o.y0, o.y1, t2, trim);
    const n = Math.max(1, Math.round((o.b - o.a) / 0.9));
    for (let i = 1; i < n; i++) { const x = o.a + (o.b - o.a) * i / n; wbox(g, wl, x - 0.02, x + 0.02, o.y0, o.y1, 0.05, trim); }
    wbox(g, wl, o.a, o.b, o.y0, o.y1, 0.012, HD.GLASS).userData.ns = 1;
    if (wl.id !== 's' || p.nocurtain) return;
    /* Rèm hoặc mành tre cho cửa hướng nam */
    const off = -(th / 2 + 0.07);
    if (p.blind) {
      wbox(g, wl, o.a - 0.05, o.b + 0.05, o.y1 - 0.5, o.y1 + 0.08, 0.025, M('#c9a66b', { roughness: 1 }), off);
      for (let y = o.y1 - 0.46; y < o.y1 + 0.06; y += 0.07) wbox(g, wl, o.a - 0.05, o.b + 0.05, y, y + 0.008, 0.03, M('#a9865a'), off);
    } else {
      const cm = M(p.curtain, { roughness: 1 });
      wbox(g, wl, o.a - 0.14, o.a + 0.2, 0.03, o.y1 + 0.12, 0.07, cm, off);
      wbox(g, wl, o.b - 0.2, o.b + 0.14, 0.03, o.y1 + 0.12, 0.07, cm, off);
      wbox(g, wl, o.a - 0.2, o.b + 0.2, o.y1 + 0.12, o.y1 + 0.145, 0.02, M('#3a3a3a'), off);
    }
  }

  function fan(x, z) {
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
    ceil.add(g); fans.push(rotor);
  }

  function build() {
    if (world) {
      scene.remove(world);
      world.traverse(o => { if (o.userData.own) o.geometry.dispose(); });
    }
    world = new T.Group(); ceil = new T.Group(); caps = new T.Group(); world.add(ceil, caps);
    wallCols = []; itemCols = []; fans = [];
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
    for (const [x, z] of P.lights) C(ceil, 0.14, 0.02, HD.glow('#fff6e0', 1), x, P.H - 0.02, z).userData.ns = 1;
    for (const id of d.fans) fan(P.fanAt[id][0], P.fanAt[id][1]);

    for (const it of d.items) {
      const [w, dd] = HD.sizeOf(it);
      const g = HD.build[it[0]](it[4] || {}, p, w, dd);
      g.position.set(it[1], 0, it[2]); g.rotation.y = (it[3] || 0) * Math.PI / 2;
      (HD.CEIL[it[0]] ? ceil : world).add(g);
      for (const f of HD.footprints(it)) {
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
    for (const list of [wallCols, itemCols]) for (const c of list) {
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
  let last = performance.now();
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
    for (const f of fans) f.rotation.y += dt * 4;
    renderer.render(scene, camera);
    if (st.map) drawMap();
    requestAnimationFrame(frame);
  }

  resize();
  build(); unstick(); refreshUI();
  requestAnimationFrame(frame);
})();
