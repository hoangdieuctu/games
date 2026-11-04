// Chạy: PLAYWRIGHT_CORE=/đường/dẫn/playwright-core node little-world/test/montage.mjs (cần máy chủ http ở cổng 8765, ảnh lưu vào ./lw/)
const { chromium } = await import((process.env.PLAYWRIGHT_CORE || 'playwright-core') + '/index.mjs');
import { readFileSync } from 'node:fs';
const files = process.argv.slice(3); const out = process.argv[2];
const imgs = files.map((f) => `<figure><img src="data:image/png;base64,${readFileSync(f).toString('base64')}"><figcaption>${f.split('/').pop()}</figcaption></figure>`).join('');
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1600, height: 900 } });
await p.setContent(`<style>body{margin:0;display:flex;flex-wrap:wrap;gap:6px;background:#333;font:12px sans-serif;color:#fff}figure{margin:0;width:390px}img{width:390px}</style>${imgs}`);
await p.screenshot({ path: out, fullPage: true }); await b.close();
