// Chạy: PLAYWRIGHT_CORE=/đường/dẫn/playwright-core node little-world/test/lwtest.mjs (cần máy chủ http ở cổng 8765, ảnh lưu vào ./lw/)
const { chromium } = await import((process.env.PLAYWRIGHT_CORE || 'playwright-core') + '/index.mjs');
const [w, h, tag] = [+process.argv[2] || 1280, +process.argv[3] || 800, process.argv[4] || 'd'];
const steps = (process.argv[5] || 'home,island,map,games').split(',');
const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist'] });
const p = await b.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
const errs = [];
p.on('pageerror', (e) => errs.push('PAGE ' + e.message));
p.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') errs.push(m.type() + ' ' + m.text()); });
const out = (n) => `lw/${tag}-${n}.png`;
const shot = async (n, ms = 1200) => { await p.waitForTimeout(ms); await p.screenshot({ path: out(n) }); };
await p.goto('http://localhost:8765/little-world/#home');
await p.waitForTimeout(2500);
if (steps.includes('home')) await shot('home-new', 300);
await p.fill('#pname', 'Bông');
await p.click('[data-pet="bunny"]');
await p.click('[data-a="go"]');
if (steps.includes('island')) { await shot('island', 3000); }
// give resources for testing
await p.evaluate(() => { const S = window.__lwStore; Object.assign(S.p.res, { star: 40, seed: 10, wood: 20, stone: 10, flower: 8, shell: 6 }); S.p.earned.star = 40; S.commit(); });
if (steps.includes('island')) {
  await p.click('[data-m="edit"]'); await shot('island-edit', 800);
  await p.click('[data-a="shop"]'); await shot('shop', 800);
  await p.click("[data-g=deco]"); await p.waitForTimeout(200); await p.click("[data-buy=island-deco-swing]"); await p.waitForTimeout(300);
  await p.click('.modal-close').catch(() => {}); await p.waitForTimeout(300); await shot('island-edit2', 300);
}
if (steps.includes('map')) {
  await p.evaluate(() => (location.hash = 'map')); await shot('map', 3000);
  await p.evaluate(() => (location.hash = 'map/animal-island')); await shot('map-card', 2500);
}
if (steps.includes('games')) {
  for (const a of ['animal-match', 'animal-habitat', 'memory', 'shape-puzzle', 'count', 'builder', 'sort-trash', 'ocean-clean']) {
    await p.evaluate((a) => (location.hash = 'play/' + a), a); await shot('g-' + a, 2500);
  }
}
if (steps.includes('wardrobe')) { await p.evaluate(() => (location.hash = 'wardrobe')); await shot('wardrobe', 2500); }
console.log(errs.slice(0, 30).join('\n') || 'no errors');
await b.close();
