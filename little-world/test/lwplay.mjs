// Chạy: PLAYWRIGHT_CORE=/đường/dẫn/playwright-core node little-world/test/lwplay.mjs (cần máy chủ http ở cổng 8765, ảnh lưu vào ./lw/)
const { chromium } = await import((process.env.PLAYWRIGHT_CORE || 'playwright-core') + '/index.mjs');
const [w, h, tag] = [+process.argv[2] || 1280, +process.argv[3] || 800, process.argv[4] || 'd'];
const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist'] });
const p = await b.newPage({ viewport: { width: w, height: h } });
const errs = []; p.on('pageerror', (e) => errs.push('PAGE ' + e.message + '\n' + e.stack));
const shot = async (n, ms = 1000) => { await p.waitForTimeout(ms); await p.screenshot({ path: `lw/${tag}-${n}.png` }); };
const scene = (k) => `window.__lw.scene.getScene('${k}')`;
await p.goto('http://localhost:8765/little-world/#home'); await p.waitForTimeout(2500);
await p.fill('#pname', 'Bin'); await p.click('[data-a="go"]'); await p.waitForTimeout(2500);
// play animal-match: click correct card each round via canvas coordinates
await p.evaluate(() => (location.hash = 'play/animal-match')); await p.waitForTimeout(2500);
for (let r = 0; r < 8; r++) {
  const pt = await p.evaluate(`(() => { const s = ${scene('AnimalMatch')}; if (!s || s.done) return null;
    const c = s.layer.list.find(o => o.input && o.list && o.list[1] && o.list[1].texture && o.list[1].texture.key === s.target.asset);
    if (!c) return null; const cam = s.cameras.main; const dpr = window.innerWidth / s.scale.width;
    return { x: (c.x - cam.worldView.x) * cam.zoom * (window.innerWidth / s.scale.width), y: (c.y - cam.worldView.y) * cam.zoom * (window.innerHeight / s.scale.height) }; })()`);
  console.log('round', JSON.stringify(pt), pt && await p.evaluate(({x,y}) => { const e = document.elementFromPoint(x,y); return e.tagName + '#' + e.id + '.' + e.className + ' ' + (e.closest('[id]')||{}).id; }, pt), await p.evaluate(`${scene('AnimalMatch')}.round`)); if (!pt) break;
  const r0 = await p.evaluate(`${scene('AnimalMatch')}.round`); await p.mouse.click(pt.x, pt.y);
  await p.waitForFunction((r0) => { const s = window.__lw.scene.getScene('AnimalMatch'); return s.done || (s.round !== r0 && !s.busy); }, r0, { timeout: 30000 }).catch(() => console.log('stuck'));
  await p.waitForTimeout(1500);
}
await p.waitForSelector('.reward-box', { timeout: 30000 }).catch(() => console.log('no reward')); await shot('reward', 2500);
console.log('after animal-match', await p.evaluate(() => JSON.stringify({ res: __lwStore.p.res, lvl: __lwStore.p.level, ach: Object.keys(__lwStore.p.ach) })));
// builder physics
await p.evaluate(() => { __lwStore.p.earned.star = 40; __lwStore.p.res.star = 40; __lwStore.commit(); });
await p.evaluate(() => (location.hash = 'play/builder')); await p.waitForTimeout(2500);
await p.evaluate(`(() => { const s = ${scene('Builder')}; const d = s.play.blocks; const by = s.H - 70;
  s.spawnBlock(d.find(x=>x.id==='cube-red'), 700, by - 100); s.spawnBlock(d.find(x=>x.id==='cube-blue'), 790, by - 100);
  s.spawnBlock(d.find(x=>x.id==='plank'), 745, by - 300); s.spawnBlock(d.find(x=>x.id==='roof-red'), 745, by - 450); s.spawnBlock(d.find(x=>x.id==='dome-yellow'), 1000, by - 200);
  s.spawnBlock(d.find(x=>x.id==='pillar-orange'), 1100, by - 200); })()`);
await p.waitForTimeout(6000); await shot('builder', 100);
// island plot: force a plot ready and tap
await p.evaluate(() => (location.hash = 'island')); await p.waitForTimeout(2500); console.log(await p.evaluate(() => JSON.stringify({h: location.hash, act: window.__lw.scene.getScenes(true).map(s=>s.scene.key), modal: !document.getElementById("modal").hidden}))); await p.waitForFunction(() => { const s = window.__lw.scene.getScene('Island'); return s.sys.isActive() && s.objs.length > 10; }, null, { timeout: 15000 }); await p.waitForTimeout(500);
const plotPt = await p.evaluate(`(() => { const s = ${scene('Island')}; const o = s.objs.find(o => s.isPlot(o)); o.setData('seed', Date.now() - 200000); s.refreshPlots();
  s.cameras.main.centerOn(o.x, o.y - 100); return null; })()`);
await shot('plot-ready', 1500);
await p.evaluate(`(() => { const s = ${scene('Island')}; const o = s.objs.find(o => s.isPlot(o) && s.plotStage(o)===3); s.tapPlot(o); })()`);
await shot('plot-harvest', 800);
console.log('after harvest', await p.evaluate(() => JSON.stringify(__lwStore.p.res)));
// parent
await p.click('#btn-parent'); await p.waitForTimeout(300);
const q = await p.textContent('.gate-q'); const [a, bb] = q.match(/\d+/g).map(Number);
await p.click(`[data-n="${a * bb}"]`); await shot('parent', 600);
await p.click('[data-tab="settings"]'); await shot('parent-settings', 300);
// reload persistence
await p.reload(); await p.waitForTimeout(3000);
console.log('after reload', await p.evaluate(() => JSON.stringify({ name: __lwStore.p.name, res: __lwStore.p.res, plays: __lwStore.p.plays, island: __lwStore.p.island && __lwStore.p.island.length })));
console.log(errs.join('\n') || 'no page errors');
await b.close();
