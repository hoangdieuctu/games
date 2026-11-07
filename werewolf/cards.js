/* Ma Sói – card illustrations (original SVG art).
   CARD_ART[id]  : inner SVG markup for viewBox "0 0 200 240"
   cardArt(id)   : full <svg> string for a role illustration
   cardBack()    : full <svg> string for the card back (250x350)
   No DOM access at load time. */
const CARD_ART = (function () {
  const G = '#d9b25a', G2 = '#f3d98b';
  const TINT = {
    village: ['#0a1026', '#1b2547', '#35426e', '#3b3a5a', '#11132a'],
    wolf:    ['#12060c', '#3e0f1d', '#7a2232', '#43222e', '#100810'],
    solo:    ['#100a26', '#2c1c52', '#5b3a82', '#3c2e5e', '#110c22'],
    ice:     ['#081022', '#1b2c4c', '#4a3550', '#3a4a66', '#0e1424']
  };
  const MOON = {
    village: ['#fffdf3', '#f4ecd0', '#c9bd94'],
    wolf:    ['#ffe6c8', '#e98a68', '#8e2a2a'],
    solo:    ['#fff8ff', '#efe0f4', '#b39ac4'],
    ice:     ['#ffffff', '#dbe9f6', '#8aa6c4']
  };

  function stars(seed) {
    let s = '', x = seed * 37 % 200;
    for (let i = 0; i < 14; i++) {
      x = (x * 73 + 41 + i * 17) % 197;
      const y = (x * 31 + i * 23) % 120 + 4;
      const r = (i % 3 === 0) ? 1.1 : 0.6;
      s += `<circle cx="${x + 2}" cy="${y}" r="${r}" fill="#f4ecd0" opacity="${0.35 + (i % 4) * 0.15}"/>`;
    }
    return s;
  }

  const DISTANT = {
    village: 'M0,196 L0,176 L14,176 L14,166 L24,158 L34,166 L34,176 L44,176 L44,170 L54,162 L64,170 L64,180 L150,180 L150,168 L156,168 L160,140 L164,168 L170,168 L170,174 L182,166 L194,174 L194,170 L200,170 L200,196 Z',
    wolf:    'M0,196 L0,178 L6,178 L12,156 L18,178 L22,170 L28,146 L34,170 L40,178 L48,164 L54,178 L150,178 L156,160 L162,178 L168,150 L174,170 L180,140 L186,170 L192,160 L200,176 L200,196 Z',
    solo:    'M0,196 L0,176 Q30,160 60,172 Q100,186 140,168 Q170,156 200,170 L200,196 Z',
    ice:     'M0,196 L0,178 L10,160 L20,178 L30,150 L42,178 L150,178 L160,156 L170,178 L182,146 L194,178 L200,170 L200,196 Z'
  };

  function scene(id, fac, body, o) {
    o = o || {};
    const p = 'ww-' + id + '-';
    const t = TINT[fac], m = MOON[fac];
    const mx = o.mx == null ? 150 : o.mx, my = o.my == null ? 50 : o.my, mr = o.mr == null ? 22 : o.mr;
    const defs = `<defs>
<linearGradient id="${p}sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${t[0]}"/><stop offset=".6" stop-color="${t[1]}"/><stop offset="1" stop-color="${t[2]}"/></linearGradient>
<radialGradient id="${p}glow" cx="${mx / 200}" cy="${my / 240}" r=".55"><stop offset="0" stop-color="${m[1]}" stop-opacity=".55"/><stop offset=".35" stop-color="${m[1]}" stop-opacity=".16"/><stop offset="1" stop-color="${m[1]}" stop-opacity="0"/></radialGradient>
<radialGradient id="${p}moon" cx=".38" cy=".35" r=".7"><stop offset="0" stop-color="${m[0]}"/><stop offset=".6" stop-color="${m[1]}"/><stop offset="1" stop-color="${m[2]}"/></radialGradient>
<linearGradient id="${p}fig" x1="0" y1="0" x2=".3" y2="1"><stop offset="0" stop-color="${t[3]}"/><stop offset="1" stop-color="${t[4]}"/></linearGradient>
<radialGradient id="${p}skin" cx=".42" cy=".38" r=".7"><stop offset="0" stop-color="#f5d8b4"/><stop offset=".6" stop-color="#c48a5e"/><stop offset="1" stop-color="#6a4028"/></radialGradient>
<linearGradient id="${p}fog" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#cfd6ea" stop-opacity="0"/><stop offset=".5" stop-color="#cfd6ea" stop-opacity=".18"/><stop offset="1" stop-color="#cfd6ea" stop-opacity=".05"/></linearGradient>
<radialGradient id="${p}vig" cx=".5" cy=".45" r=".75"><stop offset=".6" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".55"/></radialGradient>
<linearGradient id="${p}gold" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${G2}"/><stop offset=".5" stop-color="${G}"/><stop offset="1" stop-color="#8a6a2a"/></linearGradient>
</defs>`;
    const b = body
      .replace(/%F%/g, `fill="url(#${p}fig)" stroke="${G}" stroke-width="1.5" stroke-linejoin="round"`)
      .replace(/%S%/g, `fill="url(#${p}skin)" stroke="${G}" stroke-width="1" stroke-linejoin="round"`)
      .replace(/%R%/g, `fill="none" stroke="${G}" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"`)
      .replace(/%P%/g, p);
    const moon = o.noMoon ? '' :
      `<circle cx="${mx}" cy="${my}" r="${mr}" fill="url(#${p}moon)"/>` +
      `<circle cx="${mx - mr * 0.3}" cy="${my + mr * 0.2}" r="${mr * 0.18}" fill="${m[2]}" opacity=".35"/><circle cx="${mx + mr * 0.3}" cy="${my - mr * 0.25}" r="${mr * 0.12}" fill="${m[2]}" opacity=".3"/>`;
    return defs +
      `<rect width="200" height="240" fill="url(#${p}sky)"/>` +
      stars(id.length + id.charCodeAt(0)) +
      `<rect width="200" height="240" fill="url(#${p}glow)"/>` + moon +
      `<path d="${DISTANT[fac]}" fill="${t[4]}" opacity=".85"/>` +
      `<path d="M0,214 Q50,202 100,208 Q150,214 200,204 L200,240 L0,240 Z" fill="#06070e"/>` +
      `<path d="M0,214 Q50,202 100,208 Q150,214 200,204" fill="none" stroke="${G}" stroke-opacity=".35" stroke-width="1"/>` +
      b +
      `<path d="M0,226 Q40,212 90,222 Q140,232 200,218 L200,240 L0,240 Z" fill="url(#${p}fog)"/>` +
      `<ellipse cx="40" cy="200" rx="60" ry="8" fill="#cfd6ea" opacity=".07"/><ellipse cx="170" cy="210" rx="50" ry="7" fill="#cfd6ea" opacity=".07"/>` +
      `<rect width="200" height="240" fill="url(#${p}vig)"/>`;
  }

  // shared eye helper (human)
  const eyes = (x1, x2, y) => `<ellipse cx="${x1}" cy="${y}" rx="1.8" ry="2.2" fill="#1a0f0a"/><ellipse cx="${x2}" cy="${y}" rx="1.8" ry="2.2" fill="#1a0f0a"/>`;

  // feathered wing pair (left drawn, right mirrored around x=100)
  function wings(sx, sy, angs, lens, ry, fill) {
    let w = '';
    for (let i = 0; i < angs.length; i++) {
      const a = angs[i] * Math.PI / 180, L = lens[i];
      const cx = (sx + Math.cos(a) * L / 2).toFixed(1), cy = (sy + Math.sin(a) * L / 2).toFixed(1);
      w += `<ellipse cx="${cx}" cy="${cy}" rx="${L / 2}" ry="${ry}" transform="rotate(${angs[i]} ${cx} ${cy})" fill="${fill}" stroke="${'#d9b25a'}" stroke-width="1.1"/>`;
    }
    const a = angs[Math.floor(angs.length / 2)] * Math.PI / 180;
    const cx = (sx + Math.cos(a) * 16).toFixed(1), cy = (sy + Math.sin(a) * 16 - 4).toFixed(1);
    w += `<ellipse cx="${cx}" cy="${cy}" rx="22" ry="${ry + 5}" transform="rotate(${angs[Math.floor(angs.length / 2)] - 8} ${cx} ${cy})" fill="${fill}" stroke="#d9b25a" stroke-width="1.1"/>`;
    return w + `<g transform="translate(200,0) scale(-1,1)">${w}</g>`;
  }

  const A = {};

  /* ---------------- VILLAGER ---------------- */
  A.villager = scene('villager', 'village', `
<defs><radialGradient id="%P%win" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#ffb43a" stop-opacity=".7"/><stop offset="1" stop-color="#ffb43a" stop-opacity="0"/></radialGradient>
<linearGradient id="%P%thatch" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8a6a3a"/><stop offset="1" stop-color="#3a2618"/></linearGradient></defs>
<rect x="124" y="148" width="62" height="62" fill="#2a1c14" stroke="${G}" stroke-width="1.2"/>
<path d="M114,152 L155,108 L196,152 Q155,146 114,152 Z" fill="url(#%P%thatch)" stroke="${G}" stroke-width="1.4"/>
<path d="M124,142 L150,116 M134,146 L156,120 M170,140 L160,122 M182,146 L164,124" stroke="#2a1c10" stroke-width="1"/>
<rect x="172" y="112" width="8" height="20" fill="#2a1c14" stroke="${G}" stroke-width="1"/>
<circle cx="166" cy="172" r="22" fill="url(#%P%win)"/>
<rect x="158" y="164" width="16" height="16" fill="#ffc35a" stroke="${G}" stroke-width="1.2"/>
<path d="M166,164 V180 M158,172 H174" stroke="#3a2618" stroke-width="1.6"/>
<rect x="132" y="176" width="14" height="34" fill="#1a110b" stroke="${G}" stroke-width="1"/>
<path d="M44,212 L48,128 Q54,106 78,102 Q102,106 108,128 L112,212 Z" %F%/>
<path d="M50,160 H106" stroke="#5a3f22" stroke-width="5"/><rect x="74" y="156" width="8" height="8" fill="none" stroke="${G}" stroke-width="1.2"/>
<path d="M78,102 L70,124 L78,132 L86,124 Z" fill="#ead9b5" opacity=".8"/>
<path d="M120,30 V214" stroke="#7a5630" stroke-width="4.5" stroke-linecap="round"/>
<path d="M120,30 V214" stroke="${G}" stroke-width="1" stroke-opacity=".6" transform="translate(-2,0)"/>
<path d="M106,52 V28 M120,52 V22 M134,52 V28 M106,52 Q120,62 134,52" fill="none" stroke="#cfcab8" stroke-width="3.2" stroke-linecap="round"/>
<path d="M100,112 Q112,124 118,138" stroke="url(#%P%fig)" stroke-width="12" stroke-linecap="round" fill="none"/>
<path d="M100,112 Q112,124 118,138" %R% stroke-opacity=".5"/>
<circle cx="120" cy="140" r="6" %S%/>
<path d="M56,118 Q50,150 64,170" stroke="url(#%P%fig)" stroke-width="11" stroke-linecap="round" fill="none"/>
<circle cx="78" cy="84" r="16" %S%/>
${eyes(72, 84, 83)}<path d="M72,92 Q78,96 84,92" %R% stroke="#5a3020"/>
<path d="M62,72 Q78,46 94,72 Z" fill="#b8924e" stroke="${G}" stroke-width="1.2"/>
<ellipse cx="78" cy="72" rx="28" ry="6" fill="#c9a35c" stroke="${G}" stroke-width="1.2"/>
<path d="M64,70 Q78,66 92,70" stroke="#6b1424" stroke-width="2.5" fill="none"/>
`);

  /* ---------------- WEREWOLF ---------------- */
  A.werewolf = scene('werewolf', 'wolf', `
<defs><radialGradient id="%P%eye" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#ffb43a" stop-opacity=".8"/><stop offset="1" stop-color="#ffb43a" stop-opacity="0"/></radialGradient>
<linearGradient id="%P%muz" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5a3a44"/><stop offset="1" stop-color="#22121a"/></linearGradient></defs>
<path d="M86,66 L54,24 L58,86 L34,110 L48,118 L30,142 L54,148 L56,170 L76,174 L100,206 L124,174 L144,170 L146,148 L170,142 L152,118 L166,110 L142,86 L146,24 L114,66 Q100,60 86,66 Z" %F%/>
<path d="M60,38 L80,66 L64,80 Z" fill="#6b1424" opacity=".8"/><path d="M140,38 L120,66 L136,80 Z" fill="#6b1424" opacity=".8"/>
<path d="M82,116 L100,112 L118,116 L124,156 L100,176 L76,156 Z" fill="url(#%P%muz)"/>
<path d="M60,96 L92,108 M140,96 L108,108" stroke="${G}" stroke-width="2.2" stroke-linecap="round"/>
<circle cx="78" cy="112" r="14" fill="url(#%P%eye)"/><circle cx="122" cy="112" r="14" fill="url(#%P%eye)"/>
<path d="M64,104 L92,112 L86,120 L70,116 Z" fill="#ffb43a"/><path d="M136,104 L108,112 L114,120 L130,116 Z" fill="#ffb43a"/>
<path d="M79,108 L80,119" stroke="#1a0a06" stroke-width="2.4"/><path d="M121,108 L120,119" stroke="#1a0a06" stroke-width="2.4"/>
<path d="M90,128 Q100,122 110,128 Q108,138 100,140 Q92,138 90,128 Z" fill="#0a0508" stroke="${G}" stroke-width="1"/>
<path d="M86,136 L80,128 M114,136 L120,128 M88,142 L82,136 M112,142 L118,136" stroke="${G}" stroke-width="1" stroke-opacity=".7"/>
<path d="M76,152 Q100,144 124,152 Q114,184 100,188 Q86,184 76,152 Z" fill="#4a0a14" stroke="${G}" stroke-width="1.2"/>
<path d="M80,152 L85,170 L89,150 Z M120,152 L115,170 L111,150 Z M92,149 L94,158 L97,148 Z M108,149 L106,158 L103,148 Z" fill="#f4ecd0"/>
<path d="M86,180 L89,168 L93,182 Z M114,180 L111,168 L107,182 Z" fill="#f4ecd0"/>
`, { mx: 100, my: 96, mr: 70 });

  /* ---------------- SEER ---------------- */
  A.seer = scene('seer', 'village', `
<defs><radialGradient id="%P%orb" cx=".4" cy=".35" r=".65"><stop offset="0" stop-color="#ffffff"/><stop offset=".35" stop-color="#a8e8ff"/><stop offset=".8" stop-color="#5a4ab8"/><stop offset="1" stop-color="#22184a"/></radialGradient>
<radialGradient id="%P%oglow" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#9ae0ff" stop-opacity=".6"/><stop offset="1" stop-color="#9ae0ff" stop-opacity="0"/></radialGradient>
<radialGradient id="%P%face" cx=".5" cy=".9" r=".9"><stop offset="0" stop-color="#e8f4ff"/><stop offset=".5" stop-color="#b08a78"/><stop offset="1" stop-color="#2a2030"/></radialGradient></defs>
<g stroke="${G}" stroke-width="1.3" fill="none" opacity=".9">
<path d="M70,36 Q100,14 130,36 Q100,58 70,36 Z"/><circle cx="100" cy="36" r="8" fill="${G}" fill-opacity=".25"/><circle cx="100" cy="36" r="3.2" fill="${G2}"/>
<path d="M100,10 V4 M84,14 L80,8 M116,14 L120,8 M70,22 L64,18 M130,22 L136,18" stroke-linecap="round"/></g>
<path d="M100,52 Q66,54 62,94 Q58,124 40,150 L26,214 L174,214 L160,150 Q142,124 138,94 Q134,54 100,52 Z" %F%/>
<path d="M100,70 Q80,72 80,98 Q82,122 100,128 Q118,122 120,98 Q118,72 100,70 Z" fill="#090812"/>
<path d="M84,94 Q86,120 100,124 Q114,120 116,94 Q108,86 100,86 Q92,86 84,94 Z" fill="url(#%P%face)"/>
<path d="M88,102 Q92,105 96,102 M104,102 Q108,105 112,102" stroke="#2a1a1a" stroke-width="1.4" fill="none"/>
<path d="M95,116 Q100,118 105,116" stroke="#6b2a2a" stroke-width="1.4" fill="none"/>
<path d="M100,52 Q80,60 76,96 M100,52 Q120,60 124,96" %R% stroke-opacity=".6"/>
<path d="M66,130 Q70,160 78,176 M134,130 Q130,160 122,176" %R% stroke-opacity=".5"/>
<circle cx="100" cy="164" r="48" fill="url(#%P%oglow)"/>
<path d="M84,190 L116,190 L122,200 L78,200 Z" fill="url(#%P%gold)"/>
<path d="M76,184 Q70,170 82,168 Q90,176 92,186 Z" fill="url(#%P%face)" stroke="${G}" stroke-width=".8"/>
<path d="M124,184 Q130,170 118,168 Q110,176 108,186 Z" fill="url(#%P%face)" stroke="${G}" stroke-width=".8"/>
<circle cx="100" cy="166" r="22" fill="url(#%P%orb)" stroke="${G2}" stroke-width="1"/>
<path d="M90,158 Q96,152 104,154" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round" opacity=".8"/>
<path d="M92,170 Q100,164 108,170 Q100,176 92,170 Z" fill="none" stroke="#fff" stroke-width=".9" opacity=".7"/><circle cx="100" cy="170" r="1.8" fill="#fff" opacity=".9"/>
`, { mx: 160, my: 34, mr: 16 });

  /* ---------------- WITCH ---------------- */
  A.witch = scene('witch', 'village', `
<defs><radialGradient id="%P%grn" cx=".4" cy=".35" r=".7"><stop offset="0" stop-color="#d4ffb0"/><stop offset=".5" stop-color="#4ccf5a"/><stop offset="1" stop-color="#11602a"/></radialGradient>
<radialGradient id="%P%pur" cx=".4" cy=".4" r=".7"><stop offset="0" stop-color="#f0c8ff"/><stop offset=".5" stop-color="#9a3ad0"/><stop offset="1" stop-color="#3a0a5a"/></radialGradient>
<radialGradient id="%P%gg" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#6aff7a" stop-opacity=".45"/><stop offset="1" stop-color="#6aff7a" stop-opacity="0"/></radialGradient>
<radialGradient id="%P%pg" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#c060ff" stop-opacity=".45"/><stop offset="1" stop-color="#c060ff" stop-opacity="0"/></radialGradient></defs>
<path d="M62,214 L68,132 Q76,110 100,108 Q124,110 132,132 L138,214 Z" %F%/>
<path d="M84,94 Q70,120 72,146 L80,120 Z M116,94 Q130,120 128,146 L120,120 Z" fill="#141022" stroke="${G}" stroke-width="1"/>
<path d="M76,120 Q60,136 48,146" stroke="url(#%P%fig)" stroke-width="11" stroke-linecap="round" fill="none"/>
<path d="M124,120 Q140,136 152,146" stroke="url(#%P%fig)" stroke-width="11" stroke-linecap="round" fill="none"/>
<path d="M76,120 Q60,136 48,146 M124,120 Q140,136 152,146" %R% stroke-opacity=".45"/>
<circle cx="40" cy="166" r="30" fill="url(#%P%gg)"/><circle cx="160" cy="166" r="30" fill="url(#%P%pg)"/>
<rect x="36" y="134" width="8" height="12" fill="#bfe8c8" stroke="${G}" stroke-width="1"/><rect x="35" y="129" width="10" height="6" rx="2" fill="#8a6a3a"/>
<circle cx="40" cy="160" r="16" fill="url(#%P%grn)" stroke="${G}" stroke-width="1.2"/>
<path d="M32,154 Q36,148 42,150" stroke="#fff" stroke-width="2" fill="none" opacity=".7" stroke-linecap="round"/>
<path d="M154,132 L166,132 L166,144 L178,176 L142,176 L154,144 Z" fill="url(#%P%pur)" stroke="${G}" stroke-width="1.2"/><rect x="153" y="126" width="14" height="7" rx="2" fill="#8a6a3a"/>
<path d="M154,164 Q160,158 166,164 M156,170 L164,170" stroke="#f0d8ff" stroke-width="1.2" fill="none" opacity=".7"/>
<circle cx="48" cy="146" r="6" %S%/><circle cx="152" cy="146" r="6" %S%/>
<circle cx="44" cy="120" r="2.5" fill="#9aff9a" opacity=".7"/><circle cx="36" cy="110" r="1.8" fill="#9aff9a" opacity=".5"/><circle cx="162" cy="114" r="2.5" fill="#d8a0ff" opacity=".7"/><circle cx="156" cy="104" r="1.6" fill="#d8a0ff" opacity=".5"/>
<circle cx="100" cy="92" r="15" %S%/>
<path d="M98,92 L94,102 L100,102" fill="none" stroke="#6a3a28" stroke-width="1.2"/>
${eyes(93, 107, 90)}<path d="M93,106 Q100,110 107,104" %R% stroke="#5a1020"/>
<path d="M54,78 Q100,62 146,78 Q100,90 54,78 Z" %F%/>
<path d="M74,74 Q84,44 94,22 Q102,8 126,10 Q110,20 108,34 L126,74 Q100,80 74,74 Z" %F%/>
<path d="M76,68 Q100,74 124,68 L126,74 Q100,80 74,74 Z" fill="#6b1424" stroke="${G}" stroke-width="1"/>
<rect x="95" y="67" width="10" height="9" fill="none" stroke="${G2}" stroke-width="1.6"/>
`, { mx: 158, my: 40, mr: 18 });

  /* ---------------- HUNTER ---------------- */
  A.hunter = scene('hunter', 'village', `
<defs><linearGradient id="%P%wood" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#a87a44"/><stop offset="1" stop-color="#4a2e18"/></linearGradient></defs>
<path d="M40,214 L46,132 Q52,106 76,102 Q98,104 106,124 L112,214 Z" %F%/>
<path d="M58,106 L100,196" stroke="#5a3f22" stroke-width="5"/>
<path d="M44,150 Q40,176 52,204" stroke="#3a2618" stroke-width="14" fill="none" stroke-linecap="round"/>
<path d="M44,150 L36,138 M48,150 L46,134 M52,152 L54,138" stroke="#e8e0c8" stroke-width="2" stroke-linecap="round"/>
<path d="M94,118 Q110,126 122,124" stroke="url(#%P%fig)" stroke-width="12" stroke-linecap="round" fill="none"/>
<path d="M70,120 Q90,140 140,124" stroke="url(#%P%fig)" stroke-width="11" stroke-linecap="round" fill="none"/>
<path d="M94,118 Q110,126 122,124 M70,120 Q90,140 140,124" %R% stroke-opacity=".45"/>
<path d="M86,120 L178,112 L180,118 L104,128 Q96,132 88,128 Z" fill="url(#%P%wood)" stroke="${G}" stroke-width="1.2"/>
<path d="M168,86 Q184,114 170,144" stroke="#4a2e18" stroke-width="5" fill="none" stroke-linecap="round"/>
<path d="M168,86 Q184,114 170,144" stroke="${G}" stroke-width="1.2" fill="none"/>
<path d="M168,86 L128,114 L170,144" stroke="#e8e0c8" stroke-width=".9" fill="none"/>
<path d="M126,113 L194,108" stroke="#cfcab8" stroke-width="2"/><path d="M194,104 L200,108 L194,112 Z" fill="#cfcab8"/>
<path d="M126,113 L120,108 M126,113 L120,118" stroke="#9a2030" stroke-width="2"/>
<circle cx="122" cy="124" r="5.5" %S%/><circle cx="140" cy="124" r="5.5" %S%/>
<circle cx="80" cy="86" r="15" %S%/>
<path d="M78,96 Q88,104 96,94 L96,100 Q88,108 78,100 Z" fill="#3a2618"/>
<circle cx="88" cy="84" r="1.8" fill="#1a0f0a"/><path d="M84,80 L92,79" stroke="#3a2618" stroke-width="1.5"/>
<path d="M52,76 Q80,66 110,74 L106,79 Q80,74 56,80 Z" %F%/>
<path d="M62,76 Q64,52 82,52 Q98,54 98,74 Z" %F%/>
<path d="M62,72 Q80,68 98,70" stroke="#6b1424" stroke-width="3" fill="none"/>
<path d="M66,68 Q40,50 30,26 Q52,38 60,54 Q66,60 70,66 Z" fill="#9a2a30" stroke="${G}" stroke-width="1.1"/>
<path d="M66,66 Q48,48 34,30" stroke="${G2}" stroke-width=".9" fill="none"/>
`, { mx: 40, my: 44, mr: 18 });

  /* ---------------- GUARD ---------------- */
  A.guard = scene('guard', 'village', `
<defs><linearGradient id="%P%steel" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#e6e8f0"/><stop offset=".5" stop-color="#8a90a8"/><stop offset="1" stop-color="#3a3e54"/></linearGradient>
<linearGradient id="%P%sh" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#3a4a8a"/><stop offset="1" stop-color="#121a3a"/></linearGradient></defs>
<path d="M146,16 L152,34 L146,40 L140,34 Z" fill="url(#%P%steel)" stroke="${G}" stroke-width="1"/>
<path d="M146,40 V214" stroke="#6a4a2a" stroke-width="4"/>
<path d="M44,214 L48,122 Q60,100 100,98 Q140,100 152,122 L156,214 Z" %F%/>
<path d="M46,122 Q50,104 74,104 Q74,124 60,130 Z M154,122 Q150,104 126,104 Q126,124 140,130 Z" fill="url(#%P%steel)" stroke="${G}" stroke-width="1.1"/>
<circle cx="146" cy="132" r="7" %S%/>
<path d="M80,80 Q80,58 100,56 Q120,58 120,80 L120,96 Q100,102 80,96 Z" fill="url(#%P%steel)" stroke="${G}" stroke-width="1.2"/>
<path d="M84,80 L116,80 L116,94 Q100,98 84,94 Z" %S%/>
<path d="M74,80 Q100,74 126,80 L124,84 Q100,78 76,84 Z" fill="url(#%P%steel)" stroke="${G}" stroke-width="1"/>
<path d="M98,80 L102,80 L102,92 L98,92 Z" fill="url(#%P%steel)"/>
<path d="M91,86 L94,86 M106,86 L109,86" stroke="#1a0f0a" stroke-width="2" stroke-linecap="round"/>
<path d="M100,56 V46" stroke="${G}" stroke-width="2"/>
<path d="M56,112 L136,112 Q138,170 96,212 Q54,170 56,112 Z" fill="url(#%P%sh)" stroke="url(#%P%gold)" stroke-width="4" stroke-linejoin="round"/>
<path d="M64,118 L128,118 Q130,166 96,202 Q62,166 64,118 Z" fill="none" stroke="${G}" stroke-width=".8" opacity=".6"/>
<path d="M96,124 V190 M74,146 H118" stroke="url(#%P%gold)" stroke-width="7" stroke-linecap="round"/>
<circle cx="96" cy="146" r="8" fill="url(#%P%gold)" stroke="#5a4010" stroke-width="1"/>
`, { mx: 52, my: 42, mr: 18 });

  /* ---------------- CUPID ---------------- */
  A.cupid = scene('cupid', 'village', `
<defs><linearGradient id="%P%wing" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fffaf0"/><stop offset="1" stop-color="#cdb98a"/></linearGradient>
<linearGradient id="%P%heart" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ff6a7a"/><stop offset="1" stop-color="#a0102a"/></linearGradient></defs>
${wings(90, 120, [195, 180, 166, 152], [74, 70, 60, 48], 8, "url(#%P%wing)")}
<path d="M78,200 Q74,150 84,124 Q100,112 116,124 Q126,150 122,200 Z" %S%/>
<path d="M78,150 Q100,138 122,152 L124,184 Q100,192 76,182 Z" fill="#ead9b5" stroke="${G}" stroke-width="1.1"/>
<path d="M82,150 L118,184" stroke="${G}" stroke-width="2"/>
<path d="M84,200 L84,214 M116,200 L116,214" stroke="#c48a5e" stroke-width="10" stroke-linecap="round"/>
<path d="M50,124 Q30,160 50,198" stroke="#8a5a2a" stroke-width="4" fill="none" stroke-linecap="round"/>
<path d="M50,124 Q30,160 50,198" stroke="${G}" stroke-width="1.2" fill="none"/>
<path d="M50,124 L104,160 L50,198" stroke="#f4ecd0" stroke-width=".9" fill="none"/>
<path d="M104,160 L36,160" stroke="#d9b25a" stroke-width="2.4"/>
<path d="M104,160 L112,154 M104,160 L112,166 M100,160 L108,154 M100,160 L108,166" stroke="#f4ecd0" stroke-width="1.6"/>
<path d="M36,160 C30,150 18,152 20,162 C22,168 30,172 30,176 C30,172 38,168 40,162 Z" transform="rotate(-90 30 163)" fill="url(#%P%heart)" stroke="${G2}" stroke-width="1"/>
<path d="M88,136 Q96,150 104,160" stroke="#c48a5e" stroke-width="8" stroke-linecap="round" fill="none"/>
<circle cx="104" cy="160" r="5.5" %S%/><circle cx="50" cy="160" r="5.5" %S%/>
<circle cx="100" cy="94" r="18" %S%/>
<path d="M82,90 Q80,72 92,74 Q94,66 104,70 Q114,66 116,76 Q124,80 118,92 Q112,80 100,80 Q88,80 82,90 Z" fill="#d9a54a" stroke="${G2}" stroke-width="1"/>
${eyes(93, 107, 94)}<path d="M94,103 Q100,107 106,103" %R% stroke="#8a2a2a"/>
<circle cx="88" cy="100" r="3" fill="#ff8a8a" opacity=".5"/><circle cx="112" cy="100" r="3" fill="#ff8a8a" opacity=".5"/>
<path d="M150,40 C146,32 136,34 138,42 C140,47 146,50 150,54 C154,50 160,47 162,42 C164,34 154,32 150,40 Z" fill="url(#%P%heart)" stroke="${G2}" stroke-width=".8" opacity=".9"/>
<path d="M40,46 C38,42 32,43 33,47 C34,50 37,51 40,54 C43,51 46,50 47,47 C48,43 42,42 40,46 Z" fill="url(#%P%heart)" opacity=".8"/>
<path d="M170,150 C168,146 162,147 163,151 C164,154 167,155 170,158 C173,155 176,154 177,151 C178,147 172,146 170,150 Z" fill="url(#%P%heart)" opacity=".8"/>
`, { noMoon: true });

  /* ---------------- LITTLE GIRL ---------------- */
  A.girl = scene('girl', 'village', `
<defs><linearGradient id="%P%red" x1="0" y1="0" x2=".3" y2="1"><stop offset="0" stop-color="#d0283a"/><stop offset="1" stop-color="#4a0a14"/></linearGradient>
<linearGradient id="%P%door" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#5a3a22"/><stop offset="1" stop-color="#2a1a10"/></linearGradient></defs>
<path d="M100,58 Q62,60 60,104 Q58,132 50,152 L38,214 L162,214 L150,152 Q142,132 140,104 Q138,60 100,58 Z" fill="url(#%P%red)" stroke="${G}" stroke-width="1.5"/>
<path d="M100,76 Q76,78 76,108 Q78,132 100,136 Q122,132 124,108 Q122,78 100,76 Z" fill="#1a0a10"/>
<path d="M80,98 Q82,80 100,80 Q118,80 120,98 L120,118 Q100,134 80,118 Z" %S%/>
<path d="M80,96 Q88,84 100,88 Q112,84 120,96 Q114,82 100,82 Q86,82 80,96 Z" fill="#6a3a1a"/>
<ellipse cx="90" cy="104" rx="5" ry="5.5" fill="#fff"/><ellipse cx="110" cy="104" rx="5" ry="5.5" fill="#fff"/>
<circle cx="92" cy="105" r="3" fill="#2a1a10"/><circle cx="112" cy="105" r="3" fill="#2a1a10"/><circle cx="93" cy="104" r="1" fill="#fff"/><circle cx="113" cy="104" r="1" fill="#fff"/>
<path d="M72,150 Q70,124 78,110 L82,124 L84,108 L88,124 L90,110 L94,126 L96,114 L98,132 Q96,150 86,156 Z" %S%/>
<path d="M128,150 Q130,124 122,110 L118,124 L116,108 L112,124 L110,110 L106,126 L104,114 L102,132 Q104,150 114,156 Z" %S%/>
<path d="M60,150 Q70,172 86,156 L80,214 L60,214 Z M140,150 Q130,172 114,156 L120,214 L140,214 Z" fill="url(#%P%red)" stroke="${G}" stroke-width="1.2"/>
<path d="M100,58 Q76,66 72,104 M100,58 Q124,66 128,104" %R% stroke-opacity=".5"/>
<path d="M150,30 L192,30 L192,214 L150,214" fill="url(#%P%door)" stroke="${G}" stroke-width="1.2"/>
<path d="M150,30 L160,26 L160,214" fill="none" stroke="${G}" stroke-width="1"/>
<path d="M164,60 H188 M164,110 H188 M164,160 H188" stroke="#1a0f08" stroke-width="2"/><circle cx="168" cy="132" r="3" fill="url(#%P%gold)"/>
`, { mx: 40, my: 42, mr: 16 });

  /* ---------------- ELDER ---------------- */
  A.elder = scene('elder', 'village', `
<defs><linearGradient id="%P%beard" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fbf6ea"/><stop offset="1" stop-color="#b8b0a0"/></linearGradient>
<radialGradient id="%P%lamp" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#ffb43a" stop-opacity=".7"/><stop offset="1" stop-color="#ffb43a" stop-opacity="0"/></radialGradient></defs>
<path d="M52,214 L58,124 Q66,100 94,98 Q122,100 130,124 L136,214 Z" %F%/>
<path d="M60,120 Q48,150 54,214 M128,120 Q140,150 134,214" %R% stroke-opacity=".5"/>
<circle cx="150" cy="40" r="22" fill="url(#%P%lamp)"/>
<path d="M150,214 Q146,170 152,130 Q148,100 152,70 Q150,52 144,46 Q136,40 138,30 Q144,20 156,26 Q164,34 158,44" fill="none" stroke="#6a4a2a" stroke-width="6" stroke-linecap="round"/>
<path d="M150,214 Q146,170 152,130 Q148,100 152,70 Q150,52 144,46 Q136,40 138,30 Q144,20 156,26 Q164,34 158,44" fill="none" stroke="${G}" stroke-width="1"/>
<circle cx="148" cy="36" r="4" fill="#ffd27a"/>
<path d="M126,120 Q140,124 146,126" stroke="url(#%P%fig)" stroke-width="11" stroke-linecap="round" fill="none"/>
<circle cx="150" cy="126" r="7" %S%/>
<circle cx="94" cy="76" r="17" %S%/>
<path d="M77,74 Q74,56 94,56 Q114,56 111,74 Q106,62 94,62 Q82,62 77,74 Z" fill="#e8e2d4"/>
<path d="M78,72 Q72,78 76,88 M110,72 Q116,78 112,88" stroke="#e8e2d4" stroke-width="4" fill="none" stroke-linecap="round"/>
<path d="M82,72 Q88,68 92,72 M96,72 Q100,68 106,72" stroke="#f4f0e4" stroke-width="2.6" fill="none" stroke-linecap="round"/>
<path d="M85,77 Q88,79 91,77 M97,77 Q100,79 103,77" stroke="#2a1a10" stroke-width="1.3" fill="none"/>
<path d="M78,84 Q80,92 94,90 Q108,92 110,84 Q116,110 106,140 Q100,168 94,178 Q88,168 82,140 Q72,110 78,84 Z" fill="url(#%P%beard)" stroke="${G}" stroke-width="1"/>
<path d="M86,90 Q94,86 102,90" stroke="#d8d0c0" stroke-width="3" fill="none"/>
<path d="M88,104 Q90,130 94,160 M100,104 Q100,130 96,160" stroke="#c8c0b0" stroke-width=".8" fill="none"/>
`, { mx: 46, my: 44, mr: 18 });

  /* ---------------- MAYOR ---------------- */
  A.mayor = scene('mayor', 'village', `
<defs><linearGradient id="%P%coat" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7a1a2e"/><stop offset="1" stop-color="#2a0810"/></linearGradient></defs>
<path d="M44,214 Q34,156 56,122 Q74,102 100,102 Q126,102 144,122 Q166,156 156,214 Z" fill="url(#%P%coat)" stroke="${G}" stroke-width="1.5"/>
<path d="M88,104 L100,214 L112,104" fill="#ead9b5" stroke="${G}" stroke-width="1"/>
<circle cx="102" cy="176" r="2.2" fill="${G}"/><circle cx="104" cy="194" r="2.2" fill="${G}"/>
<path d="M70,108 Q100,160 130,108" fill="none" stroke="url(#%P%gold)" stroke-width="4.5" stroke-dasharray="4 2"/>
<circle cx="100" cy="146" r="12" fill="url(#%P%gold)" stroke="#5a4010" stroke-width="1.2"/>
<circle cx="100" cy="146" r="6" fill="none" stroke="#5a4010" stroke-width="1.2"/><circle cx="100" cy="146" r="2" fill="#6b1424"/>
<circle cx="100" cy="82" r="19" %S%/>
<ellipse cx="80" cy="84" rx="3" ry="5" fill="#c48a5e"/><ellipse cx="120" cy="84" rx="3" ry="5" fill="#c48a5e"/>
${eyes(93, 107, 80)}
<path d="M86,92 Q93,88 100,92 Q107,88 114,92 Q108,96 100,93 Q92,96 86,92 Z" fill="#4a2e18"/>
<circle cx="100" cy="86" r="3" fill="#c87a5a"/>
<path d="M90,100 Q100,106 110,100 Q100,110 90,100 Z" fill="#d8a882"/>
<path d="M60,66 Q100,30 140,66 Q122,58 100,68 Q78,58 60,66 Z" fill="#1a1428" stroke="url(#%P%gold)" stroke-width="2.4"/>
<path d="M74,60 Q100,38 126,60 Q100,54 74,60 Z" fill="#251c38"/>
<circle cx="100" cy="52" r="4" fill="${G}"/>
`, { mx: 156, my: 40, mr: 18 });

  /* ---------------- IDIOT ---------------- */
  A.idiot = scene('idiot', 'village', `
<defs><linearGradient id="%P%red" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#b02a3a"/><stop offset="1" stop-color="#4a0a14"/></linearGradient>
<linearGradient id="%P%blu" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4a5aa8"/><stop offset="1" stop-color="#1b2547"/></linearGradient></defs>
<path d="M54,214 L60,148 Q70,128 100,126 Q130,128 140,148 L146,214 Z" fill="url(#%P%blu)" stroke="${G}" stroke-width="1.4"/>
<path d="M100,126 Q130,128 140,148 L146,214 L100,214 Z" fill="url(#%P%red)" stroke="${G}" stroke-width="1.4"/>
<path d="M58,134 L68,148 L78,134 L88,150 L100,136 L112,150 L122,134 L132,148 L142,134 Q120,122 100,124 Q80,122 58,134 Z" fill="url(#%P%gold)" stroke="#6a4a10" stroke-width="1"/>
<circle cx="100" cy="102" r="24" %S%/>
<ellipse cx="90" cy="98" rx="6" ry="6.5" fill="#fff"/><ellipse cx="111" cy="96" rx="5" ry="5.5" fill="#fff"/>
<circle cx="92" cy="100" r="3" fill="#1a0f0a"/><circle cx="109" cy="94" r="2.6" fill="#1a0f0a"/>
<path d="M84,90 Q90,86 96,90 M106,86 Q112,84 116,88" stroke="#4a2a18" stroke-width="1.8" fill="none" stroke-linecap="round"/>
<circle cx="100" cy="106" r="4" fill="#e0886a"/>
<path d="M82,110 Q100,134 118,108 Q100,120 82,110 Z" fill="#5a1020" stroke="#4a2018" stroke-width="1"/>
<path d="M86,112 Q100,120 114,110 L113,115 Q100,123 87,116 Z" fill="#fff"/>
<path d="M98,117 L98,121 L103,121 L103,117" fill="#fff" stroke="#c0b0a0" stroke-width=".5"/>
<circle cx="82" cy="110" r="4" fill="#ff8a7a" opacity=".45"/><circle cx="118" cy="108" r="4" fill="#ff8a7a" opacity=".45"/>
<path d="M76,86 Q80,70 100,66 Q120,70 124,86 Q100,78 76,86 Z" fill="url(#%P%gold)" stroke="#6a4a10" stroke-width="1"/>
<path d="M80,76 Q56,48 30,60 Q46,62 52,74 Q62,72 82,80 Z" fill="url(#%P%red)" stroke="${G}" stroke-width="1.3"/>
<path d="M120,76 Q144,48 170,60 Q154,62 148,74 Q138,72 118,80 Z" fill="url(#%P%blu)" stroke="${G}" stroke-width="1.3"/>
<path d="M90,68 Q88,36 104,18 Q106,40 112,68 Z" fill="url(#%P%blu)" stroke="${G}" stroke-width="1.3"/>
<path d="M100,68 Q98,40 104,18 Q106,40 112,68 Z" fill="url(#%P%red)"/>
<circle cx="30" cy="62" r="6" fill="url(#%P%gold)" stroke="#6a4a10"/><circle cx="170" cy="62" r="6" fill="url(#%P%gold)" stroke="#6a4a10"/><circle cx="104" cy="16" r="6" fill="url(#%P%gold)" stroke="#6a4a10"/>
<circle cx="28" cy="60" r="1.6" fill="#fff"/><circle cx="168" cy="60" r="1.6" fill="#fff"/><circle cx="102" cy="14" r="1.6" fill="#fff"/>
`, { mx: 160, my: 140, mr: 0, noMoon: true });

  /* ---------------- SCAPEGOAT ---------------- */
  A.scapegoat = scene('scapegoat', 'village', `
<defs><linearGradient id="%P%horn" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f4ecd0"/><stop offset="1" stop-color="#8a7a5a"/></linearGradient>
<linearGradient id="%P%fur" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#a8a090"/><stop offset="1" stop-color="#4a4438"/></linearGradient>
<linearGradient id="%P%rope" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#c8a060"/><stop offset="1" stop-color="#6a4a22"/></linearGradient></defs>
<path d="M58,214 Q62,180 84,166 L116,166 Q138,180 142,214 Z" fill="url(#%P%fur)" stroke="${G}" stroke-width="1.4"/>
<path d="M86,72 Q70,36 46,36 Q30,40 32,60 Q40,48 52,52 Q68,58 78,84 Z" fill="url(#%P%horn)" stroke="${G}" stroke-width="1.2"/>
<path d="M114,72 Q130,36 154,36 Q170,40 168,60 Q160,48 148,52 Q132,58 122,84 Z" fill="url(#%P%horn)" stroke="${G}" stroke-width="1.2"/>
<path d="M50,42 L48,50 M60,42 L56,52 M70,48 L64,58 M150,42 L152,50 M140,42 L144,52 M130,48 L136,58" stroke="#8a7a5a" stroke-width="1.2"/>
<path d="M80,100 Q54,96 38,112 Q56,120 82,110 Z" fill="url(#%P%fur)" stroke="${G}" stroke-width="1.2"/>
<path d="M120,100 Q146,96 162,112 Q144,120 118,110 Z" fill="url(#%P%fur)" stroke="${G}" stroke-width="1.2"/>
<path d="M76,92 Q74,68 100,64 Q126,68 124,92 L118,148 Q112,176 100,180 Q88,176 82,148 Z" fill="url(#%P%fur)" stroke="${G}" stroke-width="1.5"/>
<path d="M90,68 Q100,80 110,68 Q104,90 100,120 Q96,90 90,68 Z" fill="#ead9b5" opacity=".35"/>
<ellipse cx="88" cy="108" rx="7" ry="6" fill="#e8d890"/><ellipse cx="112" cy="108" rx="7" ry="6" fill="#e8d890"/>
<rect x="84" y="106" width="8" height="3.4" rx="1.5" fill="#1a0f0a"/><rect x="108" y="106" width="8" height="3.4" rx="1.5" fill="#1a0f0a"/>
<path d="M80,104 Q88,98 96,102 M120,104 Q112,98 104,102" stroke="#2a2018" stroke-width="2" fill="none" stroke-linecap="round"/>
<path d="M90,116 Q88,124 90,128" stroke="#9ad0ff" stroke-width="2" fill="none" stroke-linecap="round"/>
<path d="M92,160 Q100,166 108,160 M96,152 L100,156 L104,152" stroke="#2a2018" stroke-width="1.6" fill="none"/>
<path d="M90,174 Q94,200 100,206 Q106,200 110,174 Z" fill="#c8c0b0" stroke="${G}" stroke-width="1"/>
<path d="M66,190 Q100,206 134,190" stroke="url(#%P%rope)" stroke-width="7" fill="none" stroke-linecap="round"/>
<path d="M72,192 L76,186 M82,196 L86,190 M92,199 L96,193 M104,199 L108,193 M114,197 L118,191 M124,194 L128,188" stroke="#4a2e14" stroke-width="1.2"/>
<path d="M134,190 Q160,200 170,230" stroke="url(#%P%rope)" stroke-width="5" fill="none" stroke-linecap="round"/>
`, { mx: 160, my: 140, mr: 0, noMoon: true });

  /* ---------------- WILD CHILD ---------------- */
  A.wildchild = scene('wildchild', 'village', `
<defs><linearGradient id="%P%wolf" x1="1" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3a1424"/><stop offset="1" stop-color="#0a0610"/></linearGradient>
<linearGradient id="%P%leaf" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#9ad06a"/><stop offset="1" stop-color="#2a6a2a"/></linearGradient></defs>
<path d="M200,214 L200,40 L184,52 L176,22 L162,52 Q140,58 128,76 L104,90 L100,100 L118,104 L112,114 L132,112 Q140,140 132,170 L140,214 Z" fill="url(#%P%wolf)" stroke="#6b1424" stroke-width="1.5"/>
<path d="M150,74 L166,70 L160,80 Z" fill="#ffb43a"/><circle cx="150" cy="74" r="10" fill="#ffb43a" opacity=".2"/>
<path d="M44,214 L50,148 Q58,128 84,126 Q106,128 114,148 L120,214 Z" %F%/>
<path d="M60,170 L70,180 L62,190 M104,176 L96,186 L106,196" stroke="#0a0a14" stroke-width="2" fill="none"/>
<path d="M50,214 L54,206 L60,214 L66,204 L72,214 L80,206 L88,214 L96,204 L104,214 L112,206 L120,214" fill="#06070e"/>
<circle cx="84" cy="104" r="21" %S%/>
<path d="M62,104 L56,92 L66,90 L58,74 L70,76 L66,60 L80,68 L84,52 L92,66 L102,54 L104,70 L116,64 L112,80 L122,82 L112,92 L108,86 Q96,80 84,84 Q70,84 64,96 Z" fill="#3a2618" stroke="${G}" stroke-width="1.2"/>
<path d="M62,104 L54,116 L64,114 Z M106,104 L114,118 L106,116 Z" fill="#3a2618"/>
<path d="M66,62 Q58,52 66,46 Q72,54 66,62 Z" fill="url(#%P%leaf)" stroke="${G}" stroke-width=".6"/>
<path d="M104,58 Q110,46 120,50 Q116,60 104,58 Z" fill="url(#%P%leaf)" stroke="${G}" stroke-width=".6"/>
<path d="M54,88 Q42,84 42,74 Q52,74 54,88 Z" fill="url(#%P%leaf)" stroke="${G}" stroke-width=".6"/>
<path d="M88,62 Q90,48 98,46 Q98,58 88,62 Z" fill="url(#%P%leaf)" stroke="${G}" stroke-width=".6"/>
<path d="M74,98 L84,100 L80,104 Z M94,100 L104,98 L98,104 Z" fill="#2a1a10"/>
<path d="M75,100 L83,101 L80,103 Z M95,101 L103,100 L98,103 Z" fill="#ffb43a"/>
<path d="M72,94 L84,96 M96,96 L106,92" stroke="#3a2010" stroke-width="2" stroke-linecap="round"/>
<path d="M78,116 Q86,112 94,116" stroke="#4a2018" stroke-width="1.5" fill="none"/><path d="M82,116 L83,119 L85,116 M89,116 L90,119 L92,116" fill="#fff"/>
<path d="M70,108 L76,112 M70,112 L75,114" stroke="#5a3a2a" stroke-width="1" opacity=".6"/>
`, { mx: 46, my: 40, mr: 18 });

  /* ---------------- CUB ---------------- */
  A.cub = scene('cub', 'wolf', `
<defs><radialGradient id="%P%eye" cx=".4" cy=".4" r=".6"><stop offset="0" stop-color="#ffe08a"/><stop offset=".6" stop-color="#ffb43a"/><stop offset="1" stop-color="#b8640a"/></radialGradient>
<linearGradient id="%P%fur" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6a4a52"/><stop offset="1" stop-color="#22141c"/></linearGradient></defs>
<path d="M132,196 Q168,196 170,168 Q172,150 160,146 Q164,170 136,180 Z" fill="url(#%P%fur)" stroke="${G}" stroke-width="1.3"/>
<path d="M64,212 Q58,160 100,146 Q142,160 136,212 Z" fill="url(#%P%fur)" stroke="${G}" stroke-width="1.5"/>
<path d="M86,160 Q100,170 114,160 Q112,190 100,196 Q88,190 86,160 Z" fill="#ead9b5" opacity=".25"/>
<ellipse cx="84" cy="208" rx="12" ry="7" fill="url(#%P%fur)" stroke="${G}" stroke-width="1.2"/><ellipse cx="116" cy="208" rx="12" ry="7" fill="url(#%P%fur)" stroke="${G}" stroke-width="1.2"/>
<path d="M80,208 V213 M86,208 V213 M112,208 V213 M118,208 V213" stroke="#1a0a10" stroke-width="1"/>
<path d="M68,92 L58,48 L90,76 Z M132,92 L142,48 L110,76 Z" fill="url(#%P%fur)" stroke="${G}" stroke-width="1.4"/>
<path d="M66,82 L62,58 L82,76 Z M134,82 L138,58 L118,76 Z" fill="#b04a5a" opacity=".7"/>
<path d="M100,70 Q138,70 142,110 L150,118 L140,124 Q132,150 100,154 Q68,150 60,124 L50,118 L58,110 Q62,70 100,70 Z" fill="url(#%P%fur)" stroke="${G}" stroke-width="1.5"/>
<path d="M80,122 Q100,112 120,122 Q120,146 100,150 Q80,146 80,122 Z" fill="#c8b8a8"/>
<circle cx="82" cy="106" r="10" fill="url(#%P%eye)" stroke="#2a1008" stroke-width="1"/><circle cx="118" cy="106" r="10" fill="url(#%P%eye)" stroke="#2a1008" stroke-width="1"/>
<circle cx="83" cy="107" r="5" fill="#1a0a06"/><circle cx="117" cy="107" r="5" fill="#1a0a06"/>
<circle cx="85" cy="104" r="2" fill="#fff"/><circle cx="119" cy="104" r="2" fill="#fff"/>
<path d="M93,124 Q100,120 107,124 Q104,130 100,131 Q96,130 93,124 Z" fill="#1a0a10"/>
<path d="M100,131 V136 M92,136 Q100,142 108,136" stroke="#2a1018" stroke-width="1.4" fill="none"/>
<path d="M96,138 Q100,150 104,138 Z" fill="#e06a7a" stroke="#8a2a3a" stroke-width=".8"/>
`, { mx: 150, my: 46, mr: 26 });

  /* ---------------- WHITE WOLF ---------------- */
  A.whitewolf = scene('whitewolf', 'ice', `
<defs><linearGradient id="%P%fur" x1="0" y1="0" x2=".4" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset=".5" stop-color="#c8d8ea"/><stop offset="1" stop-color="#5a6e8a"/></linearGradient>
<radialGradient id="%P%eye" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#8ae0ff" stop-opacity=".9"/><stop offset="1" stop-color="#8ae0ff" stop-opacity="0"/></radialGradient></defs>
<path d="M24,112 Q24,102 36,100 L62,92 Q80,80 94,74 L102,62 L108,24 L122,58 L132,32 L142,66 Q158,76 166,94 L180,98 L172,110 L188,120 L176,130 L190,148 L176,154 L186,176 L170,178 L180,200 L164,202 L170,216 L108,216 L102,196 L92,178 Q78,166 64,154 L56,150 Q50,144 58,140 L82,138 Q66,132 46,130 L30,124 Q22,118 24,112 Z" fill="url(#%P%fur)" stroke="${G}" stroke-width="1.6" stroke-linejoin="round"/>
<path d="M112,36 L118,58 L108,62 Z M130,42 L136,64 L126,64 Z" fill="#8a9ab8" opacity=".7"/>
<path d="M30,124 L80,136 L58,140 Q50,140 46,134 Z" fill="#2a0a14"/>
<path d="M36,124 L40,134 L44,126 Z M54,128 L57,137 L60,129 Z M66,134 L64,128 L70,131 Z" fill="#fff"/>
<path d="M50,140 L53,134 L56,141 Z" fill="#fff"/>
<path d="M22,108 Q24,102 30,102 Q32,108 28,112 Q24,112 22,108 Z" fill="#1a1a2a"/>
<path d="M40,104 Q60,100 80,96 M44,112 Q56,110 66,104" stroke="#6a7a96" stroke-width="1.2" fill="none"/>
<circle cx="96" cy="90" r="12" fill="url(#%P%eye)"/>
<path d="M86,90 L104,84 L100,94 Z" fill="#bfefff" stroke="#1a3a5a" stroke-width="1"/>
<path d="M82,82 L108,76" stroke="#3a4a66" stroke-width="2.4" stroke-linecap="round"/>
<path d="M120,100 Q140,120 136,150 M140,96 Q160,120 158,160 M110,150 Q126,170 124,196" stroke="#8a9ab8" stroke-width="1.2" fill="none"/>
`, { mx: 60, my: 46, mr: 26 });

  /* ---------------- BIG WOLF ---------------- */
  A.bigwolf = scene('bigwolf', 'wolf', `
<defs><linearGradient id="%P%fur" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6a1a24"/><stop offset="1" stop-color="#14060a"/></linearGradient>
<radialGradient id="%P%eye" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#ff5a2a" stop-opacity=".9"/><stop offset="1" stop-color="#ff5a2a" stop-opacity="0"/></radialGradient></defs>
<path d="M0,214 L4,140 L16,128 L10,110 L30,104 L28,84 L50,86 L56,64 L74,76 L84,70 L100,72 L116,70 L126,76 L144,64 L150,86 L172,84 L170,104 L190,110 L184,128 L196,140 L200,214 Z" fill="url(#%P%fur)" stroke="${G}" stroke-width="1.5" stroke-linejoin="round"/>
<path d="M66,80 L58,36 L88,70 Z M134,80 L142,36 L112,70 Z" fill="url(#%P%fur)" stroke="${G}" stroke-width="1.5"/>
<path d="M64,70 L62,48 L78,68 Z M136,70 L138,48 L122,68 Z" fill="#a02a3a" opacity=".6"/>
<path d="M60,90 Q100,76 140,90 L146,120 L136,128 L126,170 Q100,184 74,170 L64,128 L54,120 Z" fill="url(#%P%fur)" stroke="${G}" stroke-width="1.5"/>
<path d="M64,100 L92,110 M136,100 L108,110" stroke="${G}" stroke-width="3" stroke-linecap="round"/>
<circle cx="80" cy="110" r="12" fill="url(#%P%eye)"/><circle cx="120" cy="110" r="12" fill="url(#%P%eye)"/>
<path d="M70,106 L90,112 L84,116 Z M130,106 L110,112 L116,116 Z" fill="#ff7a3a"/>
<path d="M90,122 Q100,116 110,122 Q108,132 100,133 Q92,132 90,122 Z" fill="#0a0406" stroke="${G}" stroke-width="1"/>
<path d="M66,142 Q100,130 134,142 L128,206 Q100,220 72,206 Z" fill="#3a060e" stroke="${G}" stroke-width="1.5"/>
<path d="M72,206 Q100,196 128,206" stroke="#7a1a26" stroke-width="2" fill="none"/>
<path d="M68,144 L74,166 L79,141 Z M132,144 L126,166 L121,141 Z M84,139 L88,154 L92,138 Z M116,139 L112,154 L108,138 Z M96,137 L100,148 L104,137 Z" fill="#f4ecd0"/>
<path d="M74,204 L78,184 L83,206 Z M126,204 L122,184 L117,206 Z M88,208 L91,194 L94,209 Z M112,208 L109,194 L106,209 Z" fill="#f4ecd0"/>
<path d="M90,170 Q94,190 92,200 M110,170 Q106,186 108,196" stroke="#e0a0a0" stroke-width="1" opacity=".4" fill="none"/>
<path d="M30,150 L42,164 M164,150 L152,164 M20,180 L34,190 M178,180 L166,190" stroke="${G}" stroke-width="1" opacity=".5"/>
`, { mx: 100, my: 52, mr: 40 });

  /* ---------------- ANGEL ---------------- */
  A.angel = scene('angel', 'solo', `
<defs><linearGradient id="%P%wing" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fffdf4"/><stop offset="1" stop-color="#c8b48a"/></linearGradient>
<linearGradient id="%P%robe" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fffaf0"/><stop offset="1" stop-color="#a89ab8"/></linearGradient>
<radialGradient id="%P%halo" cx=".5" cy=".3" r=".6"><stop offset="0" stop-color="#fff4c8" stop-opacity=".9"/><stop offset=".5" stop-color="#f3d98b" stop-opacity=".3"/><stop offset="1" stop-color="#f3d98b" stop-opacity="0"/></radialGradient></defs>
<circle cx="100" cy="74" r="80" fill="url(#%P%halo)"/>
<g stroke="${G2}" stroke-width="1" opacity=".35"><path d="M100,74 L100,0 M100,74 L40,4 M100,74 L160,4 M100,74 L4,40 M100,74 L196,40"/></g>
${wings(90, 118, [222, 206, 190, 174, 158], [100, 96, 88, 76, 60], 10, "url(#%P%wing)")}
<path d="M60,214 Q70,160 76,126 Q86,108 100,106 Q114,108 124,126 Q130,160 140,214 Z" fill="url(#%P%robe)" stroke="${G}" stroke-width="1.4"/>
<path d="M92,130 Q90,170 84,212 M108,130 Q110,170 116,212 M100,140 V212" stroke="#b0a0c0" stroke-width="1" fill="none"/>
<path d="M76,140 H124" stroke="url(#%P%gold)" stroke-width="3"/>
<path d="M90,138 Q100,120 110,138 L100,150 Z" %S%/>
<circle cx="100" cy="88" r="16" %S%/>
<path d="M84,88 Q82,70 100,70 Q118,70 116,88 Q120,100 116,110 Q112,92 100,78 Q88,92 84,110 Q80,100 84,88 Z" fill="#f3d98b" stroke="${G}" stroke-width=".8"/>
<path d="M93,90 Q95,92 97,90 M103,90 Q105,92 107,90" stroke="#3a2a1a" stroke-width="1.3" fill="none"/>
<path d="M96,98 Q100,100 104,98" stroke="#a04a4a" stroke-width="1.2" fill="none"/>
<ellipse cx="100" cy="60" rx="20" ry="5" fill="none" stroke="${G2}" stroke-width="3"/>
<ellipse cx="100" cy="60" rx="20" ry="5" fill="none" stroke="#fff" stroke-width="1" opacity=".8"/>
`, { noMoon: true });

  /* ---------------- PIPER ---------------- */
  A.piper = scene('piper', 'solo', `
<defs><linearGradient id="%P%cloak" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#4a2a6a"/><stop offset="1" stop-color="#140a22"/></linearGradient></defs>
<g fill="none" stroke="${G2}" stroke-width="1.4" stroke-linecap="round" opacity=".85">
<path d="M56,96 Q40,80 50,66 Q60,54 46,40 Q36,30 44,18"/><path d="M42,120 Q20,110 22,90 Q24,74 10,64"/></g>
<g fill="${G2}"><ellipse cx="46" cy="40" rx="4" ry="3" transform="rotate(-20 46 40)"/><path d="M50,40 V26 L56,28" stroke="${G2}" stroke-width="1.4" fill="none"/>
<ellipse cx="22" cy="92" rx="4" ry="3" transform="rotate(-20 22 92)"/><path d="M26,92 V78" stroke="${G2}" stroke-width="1.4"/>
<ellipse cx="160" cy="34" rx="3.5" ry="2.6" transform="rotate(-20 160 34)"/><ellipse cx="172" cy="30" rx="3.5" ry="2.6" transform="rotate(-20 172 30)"/><path d="M163.5,34 V20 L175.5,16 V30" stroke="${G2}" stroke-width="1.4" fill="none"/></g>
<path d="M62,214 Q72,150 86,118 Q100,100 122,104 Q140,110 144,140 L158,214 Z" fill="url(#%P%cloak)" stroke="${G}" stroke-width="1.5"/>
<path d="M104,110 Q112,160 108,214 M128,118 Q140,160 140,214" stroke="#6a4a8a" stroke-width="1" fill="none"/>
<path d="M118,106 L120,214" stroke="none"/>
<path d="M60,112 L92,128 L94,134 L58,116 Z" fill="url(#%P%gold)" stroke="#6a4a10" stroke-width=".8"/>
<circle cx="70" cy="119" r="1.2" fill="#3a2010"/><circle cx="76" cy="122" r="1.2" fill="#3a2010"/><circle cx="82" cy="125" r="1.2" fill="#3a2010"/>
<path d="M118,122 Q100,124 82,126 M126,130 Q104,136 76,124" stroke="url(#%P%cloak)" stroke-width="10" stroke-linecap="round" fill="none"/>
<path d="M118,122 Q100,124 82,126 M126,130 Q104,136 76,124" %R% stroke-opacity=".4"/>
<circle cx="80" cy="126" r="5.5" %S%/><circle cx="72" cy="122" r="5" %S%/>
<circle cx="112" cy="94" r="15" %S%/>
<path d="M98,96 Q96,104 100,108" fill="none" stroke="#6a3a28" stroke-width="1.2"/>
<path d="M102,90 Q104,88 106,90" stroke="#2a1a10" stroke-width="1.4" fill="none"/>
<path d="M90,84 Q112,72 134,82 L130,86 Q112,80 94,88 Z" fill="#6b1424" stroke="${G}" stroke-width="1.2"/>
<path d="M98,82 Q104,62 118,62 Q130,66 130,82 Z" fill="#6b1424" stroke="${G}" stroke-width="1.2"/>
<path d="M120,66 Q140,42 162,48 Q144,54 128,72 Z" fill="${G2}" stroke="${G}" stroke-width="1"/>
<path d="M124,106 Q130,96 126,84 L136,92 Q134,108 124,112 Z" fill="#3a2618"/>
<g fill="#1a1020" stroke="${G}" stroke-width=".8"><path d="M30,214 Q30,204 40,204 Q48,204 50,210 L54,208 L52,214 Z"/><path d="M164,214 Q164,206 172,206 Q180,206 182,212 L186,210 L184,214 Z"/></g>
<path d="M30,212 Q20,210 16,216 M164,212 Q156,208 152,214" stroke="${G}" stroke-width=".8" fill="none"/>
`, { noMoon: true });

  /* ---------------- FOX ---------------- */
  A.fox = scene('fox', 'solo', `
<defs><linearGradient id="%P%fur" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ff9a3a"/><stop offset=".6" stop-color="#d8601a"/><stop offset="1" stop-color="#7a2a0a"/></linearGradient>
<linearGradient id="%P%wh" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fffaf0"/><stop offset="1" stop-color="#d8c8a8"/></linearGradient></defs>
<path d="M70,214 Q64,180 80,166 L120,166 Q136,180 130,214 Z" fill="url(#%P%fur)" stroke="${G}" stroke-width="1.4"/>
<path d="M88,170 L100,214 L112,170 Z" fill="url(#%P%wh)"/>
<path d="M62,92 L44,26 L94,66 Z M138,92 L156,26 L106,66 Z" fill="url(#%P%fur)" stroke="${G}" stroke-width="1.5" stroke-linejoin="round"/>
<path d="M60,78 L52,40 L84,66 Z M140,78 L148,40 L116,66 Z" fill="#2a1008"/>
<path d="M100,60 Q136,60 150,90 Q160,110 176,118 Q150,128 136,138 Q120,160 100,186 Q80,160 64,138 Q50,128 24,118 Q40,110 50,90 Q64,60 100,60 Z" fill="url(#%P%fur)" stroke="${G}" stroke-width="1.6" stroke-linejoin="round"/>
<path d="M24,118 Q50,116 68,122 Q86,134 92,160 L100,186 L108,160 Q114,134 132,122 Q150,116 176,118 Q150,128 136,138 Q120,160 100,186 Q80,160 64,138 Q50,128 24,118 Z" fill="url(#%P%wh)"/>
<path d="M88,72 Q100,100 100,140 Q100,100 112,72" stroke="#fff" stroke-width="1" fill="none" opacity=".35"/>
<path d="M66,104 Q78,96 92,108 Q80,112 66,104 Z M134,104 Q122,96 108,108 Q120,112 134,104 Z" fill="#ffd040" stroke="#2a1008" stroke-width="1.2"/>
<path d="M78,102 L80,110 M122,102 L120,110" stroke="#1a0a04" stroke-width="2.2" stroke-linecap="round"/>
<path d="M62,98 Q78,88 94,102 M138,98 Q122,88 106,102" stroke="#3a1408" stroke-width="2" fill="none" stroke-linecap="round"/>
<path d="M92,176 Q100,172 108,176 Q106,186 100,188 Q94,186 92,176 Z" fill="#1a0a06" stroke="${G}" stroke-width=".8"/>
<path d="M96,176 Q98,174 100,175" stroke="#fff" stroke-width="1" fill="none" opacity=".6"/>
<path d="M86,158 Q94,166 102,164" stroke="#5a2a10" stroke-width="1.4" fill="none" stroke-linecap="round"/>
`, { mx: 160, my: 40, mr: 16 });

  /* ---------------- KNIGHT ---------------- */
  A.knight = scene('knight', 'village', `
<defs><linearGradient id="%P%steel" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#e6e8f0"/><stop offset=".5" stop-color="#8a90a8"/><stop offset="1" stop-color="#2e3248"/></linearGradient>
<linearGradient id="%P%rust" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#b8a090"/><stop offset=".5" stop-color="#9a5a34"/><stop offset="1" stop-color="#5a2a14"/></linearGradient></defs>
<path d="M100,36 Q120,20 128,6 Q132,24 116,40 Z" fill="#9a1a2a" stroke="${G}" stroke-width="1"/>
<path d="M40,214 L46,128 Q56,106 100,104 Q144,106 154,128 L160,214 Z" %F%/>
<path d="M76,108 L124,108 L130,214 L70,214 Z" fill="#6b1424" stroke="${G}" stroke-width="1.2"/>
<path d="M100,150 L88,170 L100,192 L112,170 Z" fill="none" stroke="${G}" stroke-width="1.6"/>
<path d="M42,128 Q46,104 76,106 Q78,128 60,136 Z M158,128 Q154,104 124,106 Q122,128 140,136 Z" fill="url(#%P%steel)" stroke="${G}" stroke-width="1.1"/>
<path d="M78,50 Q78,34 100,32 Q122,34 122,50 L124,98 Q100,106 76,98 Z" fill="url(#%P%steel)" stroke="${G}" stroke-width="1.5"/>
<path d="M80,64 H120 V70 H80 Z" fill="#0a0a14"/>
<path d="M100,40 V98" stroke="${G}" stroke-width="2.4"/>
<path d="M88,80 V88 M92,80 V88 M108,80 V88 M112,80 V88" stroke="#1a1a28" stroke-width="2"/>
<path d="M97,94 L103,94 L104,208 L100,222 L96,208 Z" fill="url(#%P%rust)" stroke="${G}" stroke-width="1"/>
<path d="M97,140 L95,144 L97,146 M103,170 L105,174 L103,177 M97,190 L95,193 L97,195" fill="none" stroke="#3a1a0a" stroke-width="1.2"/>
<circle cx="99" cy="160" r="2" fill="#6a2a10" opacity=".7"/><circle cx="101" cy="120" r="1.6" fill="#6a2a10" opacity=".7"/>
<path d="M78,108 H122 L118,116 H82 Z" fill="url(#%P%gold)" stroke="#6a4a10" stroke-width="1"/>
<rect x="96" y="70" width="8" height="40" fill="#3a2214" stroke="${G}" stroke-width="1" rx="2"/>
<circle cx="100" cy="72" r="5" fill="url(#%P%gold)"/>
<path d="M86,92 Q92,90 96,96 L96,112 Q88,114 84,106 Z M114,92 Q108,90 104,96 L104,112 Q112,114 116,106 Z" fill="url(#%P%steel)" stroke="${G}" stroke-width="1"/>
`, { mx: 158, my: 42, mr: 18 });

  /* ---------------- BEAR TAMER ---------------- */
  A.bear = scene('bear', 'village', `
<defs><linearGradient id="%P%bear" x1="0" y1="0" x2=".3" y2="1"><stop offset="0" stop-color="#8a5a34"/><stop offset=".6" stop-color="#5a3420"/><stop offset="1" stop-color="#2a160c"/></linearGradient></defs>
<path d="M88,214 Q80,150 100,120 Q112,100 140,100 Q172,102 182,140 Q192,180 186,214 Z" fill="url(#%P%bear)" stroke="${G}" stroke-width="1.5"/>
<path d="M118,150 Q140,140 162,152 Q160,190 140,200 Q120,190 118,150 Z" fill="#b08a64" opacity=".35"/>
<circle cx="112" cy="74" r="10" fill="url(#%P%bear)" stroke="${G}" stroke-width="1.3"/><circle cx="168" cy="74" r="10" fill="url(#%P%bear)" stroke="${G}" stroke-width="1.3"/>
<circle cx="112" cy="74" r="5" fill="#2a160c"/><circle cx="168" cy="74" r="5" fill="#2a160c"/>
<path d="M140,62 Q172,62 174,96 Q176,118 160,126 Q150,132 140,132 Q130,132 120,126 Q104,118 106,96 Q108,62 140,62 Z" fill="url(#%P%bear)" stroke="${G}" stroke-width="1.5"/>
<path d="M126,104 Q140,96 154,104 Q156,124 140,128 Q124,124 126,104 Z" fill="#c8a07a"/>
<path d="M133,104 Q140,100 147,104 Q146,111 140,112 Q134,111 133,104 Z" fill="#1a0a06"/>
<path d="M140,112 V117 M134,119 Q140,123 146,119" stroke="#2a160c" stroke-width="1.4" fill="none"/>
<circle cx="126" cy="90" r="3" fill="#1a0a06"/><circle cx="154" cy="90" r="3" fill="#1a0a06"/><circle cx="127" cy="89" r="1" fill="#fff"/><circle cx="155" cy="89" r="1" fill="#fff"/>
<path d="M112,128 Q140,144 168,128" stroke="#6b1424" stroke-width="5" fill="none"/>
<circle cx="140" cy="138" r="4" fill="none" stroke="${G}" stroke-width="2"/>
<path d="M172,170 Q186,188 176,212 L156,212 Q160,192 160,176 Z" fill="url(#%P%bear)" stroke="${G}" stroke-width="1.2"/>
<path d="M18,214 L24,138 Q30,118 52,116 Q72,118 78,138 L84,214 Z" %F%/>
<path d="M76,140 Q90,146 96,150" stroke="url(#%P%fig)" stroke-width="10" stroke-linecap="round" fill="none"/>
<path d="M76,140 Q90,146 96,150" %R% stroke-opacity=".4"/>
<path d="M98,150 Q120,160 138,142" fill="none" stroke="#cfcab8" stroke-width="1.8" stroke-dasharray="3 1.5"/>
<circle cx="98" cy="151" r="5.5" %S%/>
<circle cx="52" cy="98" r="15" %S%/>
${eyes(47, 58, 97)}
<path d="M42,104 Q52,112 62,104 Q60,116 52,118 Q44,116 42,104 Z" fill="#3a2618"/>
<path d="M44,106 Q52,102 60,106" stroke="#3a2618" stroke-width="2.4" fill="none"/>
<path d="M34,88 Q36,70 52,70 Q68,70 70,88 Q52,82 34,88 Z" fill="#6a4a2a" stroke="${G}" stroke-width="1.1"/>
<path d="M30,88 Q52,80 74,88" stroke="${G}" stroke-width="1.1" fill="none"/>
<path d="M22,140 L82,200 M84,140 L24,200" stroke="#3a2618" stroke-width="3" opacity=".6"/>
`, { mx: 42, my: 36, mr: 16 });

  return A;
})();

function cardArt(id) {
  return `<svg viewBox="0 0 200 240" xmlns="http://www.w3.org/2000/svg" class="art">${CARD_ART[id] || CARD_ART.villager}</svg>`;
}

function cardBack() {
  const G = '#d9b25a', G2 = '#f3d98b';
  const corner = `<path d="M18,62 Q18,18 62,18 M24,52 Q26,26 52,24 M30,30 Q44,40 36,54 Q30,62 22,58 M30,30 Q40,44 54,36 Q62,30 58,22 M18,62 Q30,64 30,76 M62,18 Q64,30 76,30" fill="none" stroke="url(#ww-back-gold)" stroke-width="2" stroke-linecap="round"/><circle cx="30" cy="30" r="4" fill="url(#ww-back-gold)"/><path d="M40,40 L46,46" stroke="${G2}" stroke-width="1.4"/>`;
  return `<svg viewBox="0 0 250 350" xmlns="http://www.w3.org/2000/svg" class="card-back"><defs>
<radialGradient id="ww-back-field" cx=".5" cy=".45" r=".75"><stop offset="0" stop-color="#26346a"/><stop offset=".55" stop-color="#141e40"/><stop offset="1" stop-color="#080c1e"/></radialGradient>
<linearGradient id="ww-back-gold" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${G2}"/><stop offset=".5" stop-color="${G}"/><stop offset="1" stop-color="#8a6a2a"/></linearGradient>
<radialGradient id="ww-back-glow" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#f4ecd0" stop-opacity=".35"/><stop offset="1" stop-color="#f4ecd0" stop-opacity="0"/></radialGradient>
<radialGradient id="ww-back-moon" cx=".35" cy=".35" r=".8"><stop offset="0" stop-color="#fffdf3"/><stop offset=".7" stop-color="#f4ecd0"/><stop offset="1" stop-color="#c9b47a"/></radialGradient>
<linearGradient id="ww-back-wolf" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1b2547"/><stop offset="1" stop-color="#05070f"/></linearGradient>
<pattern id="ww-back-pat" width="20" height="20" patternUnits="userSpaceOnUse"><path d="M10,2 L18,10 L10,18 L2,10 Z" fill="none" stroke="${G}" stroke-width=".5" opacity=".18"/></pattern>
</defs>
<rect width="250" height="350" rx="16" fill="#0b0f22"/>
<rect x="6" y="6" width="238" height="338" rx="12" fill="url(#ww-back-field)" stroke="url(#ww-back-gold)" stroke-width="4"/>
<rect x="6" y="6" width="238" height="338" rx="12" fill="url(#ww-back-pat)"/>
<rect x="14" y="14" width="222" height="322" rx="8" fill="none" stroke="${G}" stroke-width="1.2" opacity=".8"/>
<rect x="19" y="19" width="212" height="312" rx="6" fill="none" stroke="${G}" stroke-width=".6" opacity=".5"/>
${corner}
<g transform="translate(250,0) scale(-1,1)">${corner}</g>
<g transform="translate(0,350) scale(1,-1)">${corner}</g>
<g transform="translate(250,350) scale(-1,-1)">${corner}</g>
<path d="M125,22 L131,30 L125,38 L119,30 Z M125,328 L131,320 L125,312 L119,320 Z" fill="url(#ww-back-gold)"/>
<path d="M90,30 H112 M138,30 H160 M90,320 H112 M138,320 H160" stroke="${G}" stroke-width="1.2"/>
<circle cx="125" cy="170" r="100" fill="url(#ww-back-glow)"/>
<circle cx="125" cy="170" r="78" fill="none" stroke="${G}" stroke-width="1.2" opacity=".7"/>
<circle cx="125" cy="170" r="84" fill="none" stroke="${G}" stroke-width=".6" stroke-dasharray="2 4" opacity=".7"/>
<g fill="${G2}" opacity=".8"><circle cx="70" cy="110" r="1.4"/><circle cx="182" cy="96" r="1.2"/><circle cx="62" cy="200" r="1"/><circle cx="190" cy="214" r="1.4"/><circle cx="100" cy="92" r="1"/></g>
<path d="M125,104 A66,66 0 1 0 191,184 A54,54 0 1 1 125,104 Z" fill="url(#ww-back-moon)" stroke="url(#ww-back-gold)" stroke-width="2"/>
<path d="M138,240 Q136,214 124,196 L102,164 L94,152 L108,160 L100,146 L94,136 L100,132 L126,148 L136,146 L142,124 L150,148 Q158,152 162,160 Q172,176 172,196 L168,204 L174,212 L170,220 Q174,232 180,240 Z" fill="url(#ww-back-wolf)" stroke="url(#ww-back-gold)" stroke-width="2" stroke-linejoin="round"/>
<path d="M126,154 L134,156" stroke="#ffb43a" stroke-width="2.4" stroke-linecap="round"/>
<path d="M70,244 Q125,226 180,244 Q125,236 70,244 Z" fill="url(#ww-back-gold)"/>
<path d="M84,256 Q125,246 166,256" fill="none" stroke="${G}" stroke-width="1"/>
<path d="M125,262 L130,268 L125,274 L120,268 Z" fill="url(#ww-back-gold)"/>
</svg>`;
}
