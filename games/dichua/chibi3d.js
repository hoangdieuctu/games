// Nhân vật 3D chibi cho Đi chùa.
// Dựng bằng Three.js (khối cầu, viên nang, mặt tiện), tô kiểu hoạt hình (toon), vẽ vào một canvas WebGL
// ẩn rồi dán vào cảnh 2D đúng chỗ drawPerson vẽ. Tư thế đọc từ cùng các trường của nhân vật 2D
// (pose, bow, raise, strike, ph, held, reach, tool, dir/back/front), nên phần còn lại của game không đổi.
// Không có WebGL hoặc không tải được Three.js thì game tự quay về hình 2D cũ.
(() => {
  const Q = new URLSearchParams(location.search).get('3d'); // ?3d=0 tắt, ?3d=1 luôn bật kể cả máy chậm
  if (typeof THREE === 'undefined' || Q === '0') return;
  const V3 = THREE.Vector3;
  const MS = 1.12; // đơn vị mô hình → đơn vị bản đồ
  const BOX = { l: -40, r: 40, t: 100, b: -14 }; // khung vẽ quanh chân nhân vật (đơn vị bản đồ)
  const CW = 384, CH = 512; // ô vẽ lớn nhất; atlas vuông 512/1024/2048 tuỳ số người
  let AW = 1024, AH = 1024, gen = 0;
  let renderer;
  try {
    const cv = document.createElement('canvas'); cv.width = AW; cv.height = AH;
    renderer = new THREE.WebGLRenderer({ canvas: cv, alpha: true, antialias: true, preserveDrawingBuffer: true });
    renderer.setPixelRatio(1); renderer.setSize(1024, 1024, false); renderer.setClearColor(0x000000, 0);
    cv.addEventListener('webglcontextlost', e => { e.preventDefault(); api.ready = false; });
  } catch (e) { return; }

  const scene = new THREE.Scene();
  const cam = new THREE.OrthographicCamera(BOX.l, BOX.r, BOX.t, BOX.b, 1, 600);
  const PITCH = .36; // nhìn hơi từ trên xuống, khớp với cảnh chéo 3/4
  cam.position.set(0, Math.sin(PITCH) * 300, Math.cos(PITCH) * 300); cam.lookAt(0, 0, 0);
  scene.add(new THREE.HemisphereLight(0xfff1dc, 0x7a5a48, .6));
  const sun = new THREE.DirectionalLight(0xfff8ee, .5); sun.position.set(-.55, 1, .9); scene.add(sun);
  const rim = new THREE.DirectionalLight(0xffe6c0, .22); rim.position.set(.8, .4, -1); scene.add(rim);

  // dải màu 4 bậc cho chất liệu toon: bóng mềm, kiểu đồ chơi nhựa dẻo
  const gradTex = (() => {
    const v = [112, 168, 218, 242], d = new Uint8Array(v.length * 4);
    v.forEach((x, i) => d.set([x, x, x, 255], i * 4));
    const t = new THREE.DataTexture(d, v.length, 1, THREE.RGBAFormat);
    t.minFilter = t.magFilter = THREE.NearestFilter; t.generateMipmaps = false; t.needsUpdate = true; return t;
  })();
  const mats = new Map();
  const toon = (hex, side) => {
    const k = hex + (side ? 'd' : ''); let m = mats.get(k);
    if (!m) { m = new THREE.MeshToonMaterial({ color: hex, gradientMap: gradTex, side: side ? THREE.DoubleSide : THREE.FrontSide }); mats.set(k, m); }
    return m;
  };
  const flat = (hex, op = 1) => {
    const k = 'f' + hex + op; let m = mats.get(k);
    if (!m) { m = new THREE.MeshBasicMaterial({ color: hex, transparent: op < 1, opacity: op, depthWrite: op >= 1 }); mats.set(k, m); }
    return m;
  };
  const shadeHex = (hex, k) => { const c = new THREE.Color(hex); c.multiplyScalar(k); return '#' + c.getHexString(); };

  // hình khối dùng chung
  const G = {
    ball: new THREE.SphereGeometry(1, 22, 16),
    ballLo: new THREE.SphereGeometry(1, 14, 10),
    armU: new THREE.CapsuleGeometry(1.75, 3.4, 4, 12),
    armF: new THREE.CapsuleGeometry(1.6, 3.4, 4, 12),
    legU: new THREE.CapsuleGeometry(2.15, 3.6, 4, 12),
    legL: new THREE.CapsuleGeometry(1.95, 3.8, 4, 12),
    arc: new THREE.TorusGeometry(1.15, .26, 6, 14, Math.PI),
    mouth: new THREE.TorusGeometry(.95, .24, 6, 12, Math.PI),
    stick: new THREE.CylinderGeometry(.22, .22, 1, 6),
    rod: new THREE.CylinderGeometry(.45, .45, 1, 8),
    cyl: new THREE.CylinderGeometry(1, 1, 1, 16),
    cone: new THREE.ConeGeometry(1, 1, 12),
    ring: new THREE.TorusGeometry(1, .14, 6, 20),
    band: new THREE.TorusGeometry(1, .17, 6, 32),
    fringe: new THREE.TorusGeometry(1, .17, 8, 28, Math.PI * 1.2),
  };
  const mesh = (geo, mat, parent, x = 0, y = 0, z = 0, sx = 1, sy = sx, sz = sx) => {
    const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.scale.set(sx, sy, sz); parent && parent.add(m); return m;
  };
  const lathe = (pts, phiStart = 0, phiLen = Math.PI * 2) => new THREE.LatheGeometry(pts.map(([x, y]) => new THREE.Vector2(x, y)), 28, phiStart, phiLen);

  // thân áo (từ hông lên vai) và vạt áo
  const TORSO = [[0, -1], [5.4, -1], [6.1, 1.5], [6.3, 5], [6, 8.6], [5.3, 11], [4, 12.7], [2, 13.6], [0, 13.8]];
  const torsoR = y => { for (let i = 1; i < TORSO.length; i++) { const [r0, y0] = TORSO[i - 1], [r1, y1] = TORSO[i]; if (y <= y1) return r0 + (r1 - r0) * (y - y0) / ((y1 - y0) || 1); } return 0; };
  const torsoGeo = lathe(TORSO);
  const skirtGeo = new Map();
  const skirtOf = (L, R, panels) => {
    const k = L + ':' + R + ':' + panels; let g = skirtGeo.get(k);
    if (!g) {
      const pts = [[5.9, 1.2], [6.35, -1.5], [6.6 + (R - 6.6) * .45, -L * .55], [R, -L], [R - .5, -L - .35]];
      g = panels ? [lathe(pts, -1.05, 2.1), lathe(pts, Math.PI - 1.05, 2.1)] : [lathe(pts)];
      skirtGeo.set(k, g);
    }
    return g;
  };

  // vị trí trên mặt đầu cầu bán kính r: u = góc ngang từ chính diện, v = góc ngước lên
  const onHead = (r, u, v, out = 0) => new V3(Math.sin(u) * Math.cos(v) * (r + out), Math.sin(v) * (r + out), Math.cos(u) * Math.cos(v) * (r + out));
  const faceOut = (m, u, v) => { m.rotation.set(-v, u, 0, 'YXZ'); return m; };

  // ── dựng một nhân vật theo "look" ──
  const rigs = new Map();
  function rigFor(L) {
    const R = L.robe || {}, key = [R.c, R.d, R.p, L.hair, L.gender, L.age, L.monk ? 1 : 0, L.skin, L.hairC].join('|');
    let rig = rigs.get(key);
    if (rig) return rig;
    const skin = L.skin || '#f2c9a0', robe = R.c || '#5b7fa6', robeD = R.d || shadeHex(robe, .75), pants = R.p || robeD;
    const male = L.gender === 'm', child = L.age === 'child', old = L.age === 'old', monk = !!L.monk;
    const panels = !monk && /^Áo dài/.test(R.n || '');
    const HR = child ? 11.6 : monk ? 10.2 : 10.6;
    const root = new THREE.Group(); root.scale.setScalar(MS);
    const hips = new THREE.Group(); root.add(hips);
    const torso = new THREE.Group(); hips.add(torso);
    const mSkin = toon(skin), mRobe = toon(robe), mRobeD = toon(robeD), mPants = toon(pants), mHair = toon(L.hairC || '#2a1c14'), mShoe = toon('#3a2a1a');

    // vạt áo / áo tràng
    const skirtL = monk ? 12.2 : panels ? 11.6 : male ? 8.6 : 10.6, skirtR = monk ? 8.6 : panels ? 7.6 : 8;
    const skirt = new THREE.Group(); hips.add(skirt);
    for (const g of skirtOf(skirtL, skirtR, panels)) mesh(g, toon(robe, true), skirt);
    // thân
    mesh(torsoGeo, mRobe, torso);
    mesh(G.cyl, mRobeD, torso, 0, 13.6, 0, 2.7, 1.6, 2.5); // cổ áo đứng
    if (monk) { // dải cà sa chéo vai
      const sash = new THREE.Group(); sash.position.set(0, 6.6, 0); sash.rotation.z = -.72; torso.add(sash);
      mesh(G.band, toon(robeD), sash, 0, 0, 0, 8.6, 6.6, 6.5).rotation.x = Math.PI / 2;
    } else {
      // hàng cúc áo dài chéo từ cổ sang nách
      const mBtn = toon(panels ? '#f6e3a8' : shadeHex(robe, 1.18));
      for (const [x, y] of [[1.3, 12.4], [3.1, 11.4], [4.5, 9.8]]) { const r = torsoR(y); mesh(G.ballLo, mBtn, torso, x, y, Math.sqrt(Math.max(1, r * r - x * x)) + .15, .42); }
      if (!panels) mesh(G.cyl, mRobeD, torso, 0, 1.1, 0, 6.05, .9, 6.05); // nếp thắt eo áo tràng
    }
    // đầu
    const head = new THREE.Group(); torso.add(head); head.position.y = 13.2 + HR * .9;
    mesh(G.cyl, mSkin, torso, 0, 13.8, 0, 1.9, 2.6, 1.9); // cổ
    const skull = mesh(G.ball, mSkin, head, 0, 0, 0, HR, HR * .96, HR * .98);
    for (const sd of [-1, 1]) { const p = onHead(HR, sd * 1.55, -.1, -.6); mesh(G.ballLo, mSkin, head, p.x, p.y, p.z, .8, 1.9, 1.6); }
    const face = new THREE.Group(); head.add(face);
    const eyesOpen = [], eyesShut = [];
    const eyeC = '#2a1a10', mEye = toon(eyeC);
    for (const sd of [-1, 1]) {
      const u = sd * .37, v = -.06, p = onHead(HR, u, v, -.35);
      const e = faceOut(mesh(G.ball, mEye, face, p.x, p.y, p.z, 1.25, 1.75, .8), u, v); eyesOpen.push(e);
      const h = onHead(HR, u + sd * -.06, v + .08, .75); eyesOpen.push(mesh(G.ballLo, flat('#ffffff'), face, h.x, h.y, h.z, .5));
      const h2 = onHead(HR, u + sd * .05, v - .09, .7); eyesOpen.push(mesh(G.ballLo, flat('#ffffff', .8), face, h2.x, h2.y, h2.z, .24));
      const s = faceOut(mesh(G.arc, flat(eyeC), face, p.x, p.y + .2, p.z + .3), u, v); s.rotation.z = Math.PI; eyesShut.push(s);
      const b = onHead(HR, sd * .64, -.27, -.15); faceOut(mesh(G.ballLo, flat('#ff8f8f', .5), face, b.x, b.y, b.z, 2, 1.25, .5), sd * .64, -.27);
      if (old || monk) { const br = onHead(HR, u, .2, .05); faceOut(mesh(G.arc, flat(old ? '#9a8f84' : '#6a4a32'), face, br.x, br.y, br.z, 1.05, .7, 1), u, .2); }
    }
    { const p = onHead(HR, 0, -.36, .05); const m = faceOut(mesh(G.mouth, flat('#b0553f'), face, p.x, p.y, p.z, .9, .8, 1), 0, -.36); m.rotation.z = Math.PI; }
    if (old && male) { const p = onHead(HR, 0, -.27, .4); faceOut(mesh(G.ballLo, toon(L.hairC || '#ccc'), face, p.x, p.y, p.z, 2.4, .7, .8), 0, -.27); }
    // tóc
    const hair = new THREE.Group(); head.add(hair);
    const cap = (dy, dz, k) => mesh(G.ball, mHair, hair, 0, dy, dz, HR * k, HR * k * .98, HR * k);
    if (male && !monk) {
      if (old && L.hair === 2) mesh(G.fringe, mHair, hair, 0, -.9, -.3, HR * .99).rotation.set(-Math.PI / 2 + .2, 0, -Math.PI * .1);
      else {
        cap(1.4, -1.5, L.hair === 2 ? 1.025 : 1.07);
        if (L.hair === 1) faceOut(mesh(G.ball, mHair, hair, 1.8, HR * .72, HR * .5, HR * .5, HR * .26, HR * .42), .1, .6).rotation.z = -.3;
        if (L.hair === 0) { const p = onHead(HR, -.1, .55, -.3); mesh(G.ball, mHair, hair, p.x, p.y, p.z, HR * .55, HR * .3, HR * .4).rotation.z = .25; }
      }
    } else if (!monk) {
      cap(1.2, -1.3, 1.075);
      // mái bằng
      const fr = onHead(HR, 0, .5, -.5); faceOut(mesh(G.ball, mHair, hair, fr.x, fr.y, fr.z, HR * .78, HR * .3, HR * .42), 0, .5);
      if (L.hair === 0) { mesh(G.armU, mHair, hair, 0, -HR * .62, -HR * .6, HR * .4, HR * .3, HR * .22).rotation.x = .22; mesh(G.ball, mHair, hair, 0, -HR * 1.12, -HR * .78, HR * .62, HR * .34, HR * .36); }
      if (L.hair === 1) {
        if (child) for (const sd of [-1, 1]) mesh(G.ball, mHair, hair, sd * HR * .8, HR * .62, -HR * .18, HR * .36);
        else { mesh(G.ball, mHair, hair, 0, HR * .55, -HR * .78, HR * .42); mesh(G.rod, toon('#c9963a'), hair, 0, HR * .6, -HR * .8, .9, HR * 1.05, .9).rotation.z = 1.2; }
      }
      if (L.hair === 2) mesh(G.ball, mHair, hair, 0, -HR * .25, -HR * .12, HR * 1.06, HR * .78, HR * 1.04);
      if (child && L.hair !== 1) { const b = onHead(HR, .7, .55, .6); mesh(G.ball, toon('#e8597a'), hair, b.x, b.y, b.z, 1.6, 1.6, 1.2); } // kẹp nơ cho bé gái
    }
    // tay chân
    const limbs = {
      armU: [0, 1].map(() => mesh(G.armU, mRobe, torso)), armF: [0, 1].map(() => mesh(G.armF, mRobe, torso)),
      cuff: [0, 1].map(() => mesh(G.cyl, mRobeD, torso, 0, 0, 0, 1.85, .9, 1.85)),
      hand: [0, 1].map(() => mesh(G.ball, mSkin, torso, 0, 0, 0, 1.75)),
      legU: [0, 1].map(() => mesh(G.legU, mPants, root)), legL: [0, 1].map(() => mesh(G.legL, mPants, root)),
      foot: [0, 1].map(() => mesh(G.ball, mShoe, root, 0, 0, 0, 2.05, 1.45, 3)),
    };
    // đồ cầm tay
    const items = {};
    { // nắm hương
      const g = new THREE.Group(); torso.add(g); g.sticks = []; g.tips = [];
      for (let i = 0; i < 5; i++) {
        const s = new THREE.Group(); g.add(s);
        mesh(G.stick, toon('#a8301e'), s, 0, 1, 0, 1.4, 5, 1.4);
        mesh(G.stick, toon('#c9a060'), s, 0, 10, 0, 1, 14, 1);
        g.tips.push(mesh(G.ballLo, flat('#ff6a1a'), s, 0, 17.1, 0, .55)); g.sticks.push(s);
      }
      items.incense = g;
    }
    { const g = new THREE.Group(); torso.add(g); mesh(G.rod, toon('#7a4a22'), g, 0, 3.5, 0, 1, 8, 1); mesh(G.ball, toon('#5a2a12'), g, 0, 8, 0, 2, 1.7, 1.7); items.mallet = g; }
    {
      const g = new THREE.Group(); torso.add(g); const c = toon('#5f8f9a'), d = toon('#4a7480');
      mesh(G.cyl, c, g, 0, -3, 0, 3, 5, 3); mesh(G.cyl, d, g, 0, -.4, 0, 3.1, .5, 3.1);
      const h = mesh(G.ring, d, g, 0, -.5, 0, 2.6); h.rotation.y = Math.PI / 2;
      const sp = mesh(G.rod, d, g, 0, -2.5, 4.4, .8, 6, .8); sp.rotation.x = 1.0; g.spout = mesh(G.ballLo, d, g, 0, -.2, 6.9, 1.1);
      items.can = g;
    }
    { const g = new THREE.Group(); torso.add(g); mesh(G.ball, toon('#4a5a3a'), g, 0, -4.2, 0, 3, 3.6, 3); mesh(G.ballLo, toon('#3a4a2a'), g, 0, -.6, 0, 1.1); items.trash = g; }
    { const g = new THREE.Group(); torso.add(g); mesh(G.rod, toon('#8a6a3a'), g, 0, 0, 0, .8, 1, .8); g.head = mesh(G.cone, toon('#c9a85a'), g, 0, 0, 0, 3.4, 5, 1.6); items.broom = g; }
    { const g = new THREE.Group(); torso.add(g); g.rod = mesh(G.rod, toon('#6a4a2a'), g, 0, 0, 0, .9, 1, .9); g.hook = mesh(G.ballLo, toon('#6a4a2a'), g, 0, 0, 0, 1.3); items.cane = g; }
    rig = { root, hips, torso, head, face, hair, skirt, skirtL, limbs, items, eyesOpen, eyesShut, HR, child, old, male, monk };
    rigs.set(key, rig);
    return rig;
  }

  // ── IK hai đốt: S vai/hông, T đích, pole hướng khuỷu/gối ──
  const _d = new V3(), _p = new V3(), _up = new V3(0, 1, 0);
  function ik(S, T, l1, l2, pole) {
    _d.subVectors(T, S); let len = _d.length();
    const mx = l1 + l2 - .02, mn = Math.abs(l1 - l2) + .5;
    if (len > mx) { _d.multiplyScalar(mx / len); len = mx; } else if (len < mn) { _d.multiplyScalar(mn / (len || 1)); len = mn; }
    const dn = _d.clone().divideScalar(len);
    const a = (l1 * l1 + len * len - l2 * l2) / (2 * len), h = Math.sqrt(Math.max(0, l1 * l1 - a * a));
    _p.copy(pole).addScaledVector(dn, -pole.dot(dn));
    if (_p.lengthSq() < 1e-6) _p.set(0, 0, 1).addScaledVector(dn, -dn.z); _p.normalize();
    const E = S.clone().addScaledVector(dn, a).addScaledVector(_p, h);
    return [E, S.clone().add(_d)];
  }
  function bone(m, A, B) {
    m.position.addVectors(A, B).multiplyScalar(.5);
    _d.subVectors(B, A); const l = _d.length();
    if (l > 1e-4) m.quaternion.setFromUnitVectors(_up, _d.divideScalar(l));
  }
  const aimY = (obj, dir) => obj.quaternion.setFromUnitVectors(_up, dir.clone().normalize());

  // ── tư thế ──
  const blinking = o => { if (o._bk == null) o._bk = Math.random() * 4.3; return (T + o._bk) % 4.3 < .13; };
  const SHOULDER = 11, SHX = 5.3, HIPX = 3.1, ARM = [5.2, 5.2], LEG = [6.2, 6.4], ANKLE = 1.55;
  const STAND_HIP = 13.7;
  const v = (x, y, z) => new V3(x, y, z);
  function posePerson(rig, o) {
    const L = o.look || {}, pose = o.pose || 'stand', walking = pose === 'walk', ph = o.ph || 0, s = walking ? Math.sin(ph) : 0;
    const kneeling = pose === 'kneel' || pose === 'kneelbow' || pose === 'chant';
    const bow = o.bow || 0, old = rig.old;
    let hipY = STAND_HIP, tilt = 0, nod = 0;
    if (walking) hipY = STAND_HIP - Math.abs(s) * .9;
    if (kneeling) hipY = 7.6;
    if (pose === 'sit') hipY = 3.6;
    if (pose === 'bench') hipY = 28.5 / MS;
    if (pose === 'pick') hipY = 9.5;
    if (pose === 'pull') hipY = 12.9;
    if (pose === 'bow' || pose === 'hold') { tilt = bow * .6; nod = bow * .25; }
    if (pose === 'kneelbow') { tilt = .2 + bow * 1.15; nod = bow * .2; }
    if (pose === 'pull') tilt = -bow * .25;
    if (pose === 'chant') { tilt = .1 + (1 - (o.strike ?? .6)) * .12; nod = .15; }
    if (pose === 'sweep') tilt = .18;
    if (pose === 'pick') { tilt = .95; nod = -.35; }
    if (pose === 'water') tilt = .12;
    if (pose === 'reach') { tilt = -.06; nod = -.15; }
    if (pose === 'sit') nod = .12;
    if (old && (pose === 'stand' || walking)) { tilt += .13; nod -= .1; }
    rig.hips.position.set(0, hipY, 0);
    rig.torso.rotation.set(tilt, walking ? s * .06 : 0, walking ? s * .03 : 0);
    rig.head.rotation.set(nod, 0, walking ? -s * .05 : 0);
    // root → torso
    const cT = Math.cos(tilt), sT = Math.sin(tilt);
    const toT = p => { const y = p.y - hipY, z = p.z; return v(p.x, y * cT + z * sT, -y * sT + z * cT); };
    const fromSide = (q, dx = 0) => v(dx, -q.y / MS, q.x / MS); // toạ độ cảnh nhìn ngang → toạ độ gốc mô hình
    // vạt áo co lại khi ngồi / quỳ
    const avail = hipY - .4, sk = Math.min(1, avail / rig.skirtL);
    rig.skirt.scale.set(1 + (1 - sk) * .55, sk, 1 + (1 - sk) * .7);
    rig.skirt.rotation.set(walking ? s * .05 : kneeling ? .25 : pose === 'bench' ? .9 : 0, 0, 0);
    if (pose === 'bench') rig.skirt.scale.set(1.05, .55, 1.15);

    // ── chân ──
    const feet = [];
    for (let i = 0; i < 2; i++) {
      const sd = i ? 1 : -1, hip = v(sd * HIPX, hipY - 1.2, 0);
      let ft, pole = v(0, 0, 1), footRot = 0, footBack = false;
      if (walking) { const p = ph + (i ? 0 : Math.PI); ft = v(sd * HIPX, ANKLE + Math.max(0, Math.cos(p)) * 2.4, Math.sin(p) * 4.6); }
      else if (kneeling) { ft = v(sd * HIPX * .9, 1.4, -6.2); pole = v(0, -1, 1); footBack = true; }
      else if (pose === 'sit') { ft = v(-sd * 3.2, 1.6, 4.4); pole = v(sd, .3, .4); footRot = 1.3 * sd; }
      else if (pose === 'bench') { const sw = Math.sin(T * 2.2 + i * 2) * .9; ft = v(sd * HIPX, hipY - 8.4 + sw * .4, 6.2 + sw); pole = v(0, .4, 1); }
      else if (pose === 'pick') ft = v(sd * (HIPX + .6), ANKLE, i ? -1 : 2);
      else if (pose === 'pull') ft = v(sd * HIPX, ANKLE, i ? -2.8 : 3);
      else ft = v(sd * (HIPX + .1), ANKLE, .3);
      const [knee, ank] = ik(hip, ft, LEG[0], LEG[1], pole);
      bone(rig.limbs.legU[i], hip, knee); bone(rig.limbs.legL[i], knee, ank);
      const f = rig.limbs.foot[i];
      f.position.copy(ank).add(v(0, -.3, footBack ? -1.3 : 1.2)); f.rotation.set(footBack ? -.5 : 0, footRot, 0);
      if (pose === 'bench') { f.position.copy(ank).add(v(0, -.6, .9)); f.rotation.set(.5, 0, 0); }
      feet.push(ank);
    }

    // ── tay: đích theo tư thế (toạ độ thân) ──
    let held = o.held, joined = false, hands, poles = [v(-.6, -.3, -1), v(.6, -.3, -1)], incDir = v(0, 1, .12), malletDir = null, broom = null;
    const r = o.raise || 0;
    const J = (y = 8.4, z = 7) => { joined = true; poles = [v(-1, -.9, -.2), v(1, -.9, -.2)]; return [v(-.85, y, z), v(.85, y, z)]; };
    switch (pose) {
      case 'walk': hands = [v(-7.1, 3.8, -s * 3.6), v(7.1, 3.8, s * 3.6)];
        if (old && !held) hands[0] = v(-6.2, 5.2, 4.6);
        if (held === 'can' || held === 'trash') hands[0] = v(-6.8, 5.2, 2.6);
        break;
      case 'bow': hands = J(); break;
      case 'kneel': hands = J(); break;
      case 'hold': hands = J(8.4 + r * 9.5, 7 + r * 1.2); incDir = v(0, 1, .1 - r * .05); break;
      case 'reach': {
        const t = toT(o.reach ? fromSide(o.reach, -2.5) : v(-2.5, 44, 14));
        hands = [t, v(7, 4, 1)]; poles[0] = v(-1, -.6, -.4); incDir = v(0, .82, .58); break;
      }
      case 'pull': hands = [v(-1.4, 7.4, 8.4), v(1.4, 9.6, 8)]; poles = [v(-1, -1, 0), v(1, -1, 0)]; break;
      case 'sweep': { hands = [v(-1.6, 4.4, 6.4), v(1.8, 8.6, 4.4)]; poles = [v(-1, -.5, 0), v(1, -.5, 0)]; broom = toT(v(-2.4, .6, 15 + Math.sin(ph) * 3.5)); break; }
      case 'kneelbow': {
        const b = bow, fl = [toT(v(-4, 1, 11.5)), toT(v(4, 1, 11.5))], jn = J();
        hands = b < .5 ? jn : [jn[0].lerp(fl[0], (b - .5) * 2), jn[1].lerp(fl[1], (b - .5) * 2)];
        if (b >= .5) joined = false; break;
      }
      case 'chant': {
        const st = o.strike ?? .6, tool = toT(o.tool ? fromSide(o.tool, -1.5) : v(-1.5, 3, 24));
        const a = lerp(-.75, 1.05, st); malletDir = v(0, Math.sin(a), Math.cos(a)); // hướng dùi trong mặt phẳng thân
        const contact = tool.clone().addScaledVector(malletDir, -8.4), raised = v(-3, 10.6, 6.4);
        hands = [contact.lerp(raised, st), v(1.4, 8.6, 6.6)]; poles[0] = v(-1, -.6, -.2); poles[1] = v(1, -1, -.2); held = 'mallet'; break;
      }
      case 'sit': hands = [v(-1.5, 1.6, 5.4), v(1.5, 1.6, 5.4)]; poles = [v(-1, 0, 0), v(1, 0, 0)]; break;
      case 'bench': hands = [toT(v(-3.6, hipY + .2, 6.4)), toT(v(3.6, hipY + .2, 6.4))]; poles = [v(-1, 0, -.4), v(1, 0, -.4)]; break;
      case 'pick': hands = [toT(o.reach ? fromSide(o.reach, -2) : v(-2, 1.5, 14)), v(4.4, 2, 4)]; break;
      case 'water': hands = [v(-2.2, 9.4, 8.6), v(6.6, 5, 2)]; poles[0] = v(-1, -.6, 0); break;
      default: hands = [v(-7.2, 3.6, .8), v(7.2, 3.6, .8)];
        if (old && !held && pose === 'stand') hands[0] = v(-6.2, 5.2, 4.6);
    }
    const hp = [];
    for (let i = 0; i < 2; i++) {
      const sd = i ? 1 : -1, sh = v(sd * SHX, SHOULDER, 0);
      const [el, hd] = ik(sh, hands[i], ARM[0], ARM[1], poles[i]);
      bone(rig.limbs.armU[i], sh, el); bone(rig.limbs.armF[i], el, hd);
      const dir = hd.clone().sub(el).normalize();
      rig.limbs.cuff[i].position.copy(hd).addScaledVector(dir, -1.6); aimY(rig.limbs.cuff[i], dir);
      const h = rig.limbs.hand[i]; h.position.copy(hd).addScaledVector(dir, .5);
      if (joined) { h.scale.set(1.35, 2.35, 1.5); h.position.x = sd * .95; h.position.y += .9; h.rotation.set(.15, 0, -sd * .1); }
      else { h.scale.setScalar(1.75); h.rotation.set(0, 0, 0); }
      hp.push(hd);
    }
    // ── mặt ──
    const closed = pose === 'sit' || pose === 'kneelbow' || pose === 'chant' || bow > .45 || blinking(o);
    for (const e of rig.eyesOpen) e.visible = !closed;
    for (const e of rig.eyesShut) e.visible = closed;

    // ── đồ cầm tay ──
    const I = rig.items; for (const k in I) I[k].visible = false;
    const fx = { tips: [], spout: null, water: false };
    const grip = joined ? hp[0].clone().add(hp[1]).multiplyScalar(.5).add(v(0, 1.2, .9)) : hp[0];
    if (held === 'incense' && (pose === 'hold' || pose === 'reach' || pose === 'bow')) {
      const g = I.incense, n = Math.min(5, o.heldN || 3); g.visible = true; g.position.copy(grip); aimY(g, incDir);
      g.sticks.forEach((st, k) => { st.visible = k < n; st.rotation.set(0, 0, (k - (n - 1) / 2) * .09); st.position.set((k - (n - 1) / 2) * .5, 0, 0); });
      fx.tips = g.tips.slice(0, n);
    }
    if (held === 'mallet') { const g = I.mallet; g.visible = true; g.position.copy(hp[0]); aimY(g, malletDir || v(0, .6, .8)); }
    if (held === 'can') {
      const g = I.can; g.visible = true; g.position.copy(hp[0]).add(v(0, .4, 0));
      g.rotation.set(pose === 'water' ? .85 : 0, 0, 0); fx.spout = g.spout; fx.water = pose === 'water';
    }
    if (held === 'trash') { const g = I.trash; g.visible = true; g.position.copy(hp[0]); g.rotation.set(-tilt, 0, 0); }
    if (broom) {
      const g = I.broom, top = hp[1].clone().addScaledVector(hp[1].clone().sub(broom).normalize(), 2.5);
      g.visible = true; bone(g.children[0], top, broom); g.children[0].scale.set(.8, top.distanceTo(broom), .8);
      g.head.position.copy(broom); aimY(g.head, top.clone().sub(broom)); g.head.position.addScaledVector(top.clone().sub(broom).normalize(), 1.6);
    }
    if (old && !held && (pose === 'stand' || walking)) {
      const g = I.cane, tip = toT(v(-6.4, 0, 7.6 + (walking ? Math.sin(ph) * 1.6 : 0))), top = hp[0].clone().add(v(0, 1.2, 0));
      g.visible = true; bone(g.rod, top, tip); g.rod.scale.set(.9, top.distanceTo(tip), .9);
      g.hook.position.copy(top);
    }
    return fx;
  }

  // hướng mặt: đi chéo thì quay theo hướng đi, còn lại theo dir/back/front của bản 2D; quay mượt
  function yawOf(o) {
    if (typeof o.yaw === 'number') return o.yaw;
    let tgt = o.back ? Math.PI : o.front ? 0 : (o.dir < 0 ? -1 : 1) * (Math.PI / 2 - .32);
    if (o.pose === 'walk' && o._px != null) {
      const dx = o.x - o._px, dy = o.y - o._py;
      if (dx * dx + dy * dy > .04) o._wy = Math.atan2(dx, dy);
      if (o._wy != null) tgt = o._wy;
    } else o._wy = null;
    o._px = o.x; o._py = o.y;
    if (o._yw == null || o._yt == null) o._yw = tgt;
    else {
      const dt = clamp(T - o._yt, 0, .1); let d = tgt - o._yw;
      d = Math.atan2(Math.sin(d), Math.cos(d)); o._yw += d * (1 - Math.exp(-dt * 14));
    }
    o._yt = T;
    return o._yw;
  }

  const _w = new V3();
  const toBox = obj => { obj.getWorldPosition(_w).project(cam); return [BOX.l + (_w.x + 1) / 2 * (BOX.r - BOX.l), -BOX.t + (1 - _w.y) / 2 * (BOX.t - BOX.b)]; };
  const BW = BOX.r - BOX.l, BH = BOX.t - BOX.b, PSMAX = Math.min(CH / BH, CW / BW);
  const r2 = x => Math.round((x || 0) * 100);
  // dấu vân tay tư thế: giống khung trước thì giữ nguyên ô atlas, khỏi vẽ lại
  const sig = (o, yaw, ps, x, y) => [o.look.robe && o.look.robe.c, o.look.hair, o.look.gender, o.look.age, o.look.skin, o.look.hairC, o.pose, r2(o.bow), r2(o.raise), r2(o.strike),
    o.pose === 'walk' || o.pose === 'sweep' ? r2(o.ph) : 0, o.held, o.heldN, o.reach && r2(o.reach.x), o.reach && r2(o.reach.y), o.tool && r2(o.tool.x),
    Math.round(yaw * 300), blinking(o) ? 1 : 0, o.pose === 'bench' ? Math.floor(T * 12) : 0, r2(ps), x, y, gen].join();
  // vẽ một nhân vật vào ô (x0, y0) (gốc dưới trái của WebGL); trả về ô nguồn và vị trí khói/nước
  function renderCell(o, ps, x0, y0, yaw) {
    const pw = Math.ceil(BW * ps), ph = Math.ceil(BH * ps), rig = rigFor(o.look);
    const fx = posePerson(rig, o);
    rig.root.rotation.y = yaw; scene.add(rig.root);
    try {
      renderer.setViewport(x0, y0, pw, ph); renderer.setScissor(x0, y0, pw, ph); renderer.setScissorTest(true);
      renderer.render(scene, cam);
    } finally { scene.remove(rig.root); }
    return { sx: x0, sy: AH - y0 - ph, pw, ph, tips: fx.tips.map(toBox), spout: fx.spout ? toBox(fx.spout) : null, water: fx.water, wdir: Math.sin(yaw) >= 0 ? 1 : -1 };
  }
  // vẽ trước mọi người trong khung hình vào atlas (một lần đồng bộ GPU cho cả khung)
  function prepare(list, k) {
    if (!api.ready) return;
    api.frame++;
    const ppl = list.filter(o => o.look);
    // xếp kệ vào atlas cỡ nhỏ nhất đủ chứa; quá 2048 thì giảm độ phân giải
    const pack = (size, f) => {
      let x = 0, y = 0, rowH = 0;
      for (const o of ppl) {
        const ps = clamp(k * (o.scale || 1), .4, PSMAX) * f, pw = Math.ceil(BW * ps) + 2, ph = Math.ceil(BH * ps) + 2;
        if (x + pw > size && x > 0) { x = 0; y += rowH; rowH = 0; }
        if (y + ph > size || x + pw > size) return false;
        o._slot = [x, y, ps]; x += pw; rowH = Math.max(rowH, ph);
      }
      return true;
    };
    let size = 512, f = 1;
    while (!pack(size, f)) { if (size < 2048) size *= 2; else f *= .8; }
    if (size > AW || size < AW / 2 && ++api.small > 120) { AW = AH = size; renderer.setSize(AW, AH, false); gen++; api.small = 0; }
    else if (size >= AW / 2) api.small = 0;
    if (size < AW) pack(AW, f);
    try {
      // máy yếu: mỗi khung chỉ vẽ lại số người vừa ngân sách thời gian, ưu tiên mình và ai chờ lâu nhất;
      // người còn lại giữ hình khung trước (vẫn di chuyển đúng chỗ, chỉ cử động thưa hơn)
      const dirty = [];
      for (const o of ppl) {
        const [x, y, ps] = o._slot, yaw = yawOf(o), sg = sig(o, yaw, ps, x, y), slot = x + ',' + y + ',' + ps + ',' + gen;
        if (o._c && o._c.sig === sg) { o._c.f = api.frame; continue; }
        if (o._c && o._c.slot === slot) { o._c.f = api.frame; dirty.push([o, x, y, ps, yaw, sg, slot, o === me ? 1e9 : api.frame - o._c.rf]); }
        else dirty.push([o, x, y, ps, yaw, sg, slot, 2e9]); // chưa có hình ở ô này: bắt buộc vẽ
      }
      dirty.sort((a, b) => b[7] - a[7]);
      let n = 0; const cap = Math.max(1, Math.floor(7 / api.ms)), t0 = performance.now();
      for (const [o, x, y, ps, yaw, sg, slot, pri] of dirty) {
        if (n >= cap && pri < 2e9) break;
        o._c = renderCell(o, ps, x, y, yaw); Object.assign(o._c, { sig: sg, slot, f: api.frame, rf: api.frame }); n++; api.renders++;
      }
      api.pend = n; api.t0 = t0; // thời gian thật (gồm GPU) đo ở lần dán đầu tiên trong draw()
    } catch (e) { console.warn('chibi3d', e); api.ready = false; }
  }
  function draw(g, o) {
    if (!api.ready || !o.look) return false;
    let c = o._c;
    if (!c || c.f !== api.frame) { // vẽ lẻ (không qua prepare, vd. màn chọn nhân vật): dùng góc atlas rồi bỏ đệm các ô
      let ps = 2;
      try { const m = g.getTransform(); ps = Math.hypot(m.a, m.b); } catch (e) {}
      try { c = renderCell(o, clamp(ps, .4, PSMAX), 0, 0, yawOf(o)); gen++; }
      catch (e) { console.warn('chibi3d', e); api.ready = false; return false; }
    }
    g.drawImage(renderer.domElement, c.sx, c.sy, c.pw, c.ph, BOX.l, -BOX.t, BW, BH);
    if (api.pend) {
      api.ms = api.ms * .9 + (performance.now() - api.t0) / api.pend * .1; api.pend = 0;
      // quá chậm (không có tăng tốc đồ hoạ) thì quay về nhân vật 2D
      if (Q !== '1' && api.renders > 90 && api.ms > 28) { api.ready = false; console.warn('chibi3d: máy chậm, dùng hình 2D'); }
    }
    // khói hương, đốm lửa và tia nước vẽ 2D cho mềm
    c.tips.forEach(([x, y], i) => {
      g.fillStyle = 'rgba(255,140,60,.35)'; g.beginPath(); g.arc(x, y, 2.6, 0, TAU); g.fill();
      g.strokeStyle = 'rgba(235,235,235,.32)'; g.lineWidth = 1; g.beginPath(); g.moveTo(x, y);
      g.quadraticCurveTo(x + Math.sin(T * 2 + i) * 4, y - 9, x + Math.sin(T * 1.4 + i) * 5, y - 20); g.stroke();
    });
    if (c.water && c.spout && o.pour && window.drawPour) drawPour(g, c.spout[0], c.spout[1], o);
    else if (c.water && c.spout) {
      const [x, y] = c.spout;
      g.fillStyle = 'rgba(160,210,255,.9)';
      for (let i = 0; i < 6; i++) { const t = (T * 3 + i / 6) % 1; g.beginPath(); g.arc(x + c.wdir * (t * 6 + Math.sin(i * 7) * 2), y + t * 24, 1.3, 0, TAU); g.fill(); }
    }
    return true;
  }

  const api = { ready: true, draw, prepare, frame: 0, renders: 0, small: 0, ms: 2, get size() { return AW; } };
  window.Chibi3D = api;
})();
