// ── Xuất SVG → PNG/WebP bằng Chromium headless (playwright-core) ──
//
// Cần playwright-core (không thêm vào repo):
//   npm i --prefix /tmp/lw-tools playwright-core@1.49.1
//   PLAYWRIGHT_CORE=/tmp/lw-tools/node_modules/playwright-core node little-world/art/build-all.mjs
//
// Dùng:
//   const R = await openRasterizer();
//   await R.save(svgString, 'public/assets/x/y.png', { scale: 2 });          // PNG trong suốt
//   await R.save(svgString, 'public/assets/x/y.webp', { scale: 1, quality: 0.9 });
//   await R.close();
//
// Đồng thời ghi luôn bản .svg gốc cạnh file raster nếu opts.keepSvg = true.

import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

async function loadPlaywright() {
  const spec = process.env.PLAYWRIGHT_CORE;
  try {
    if (spec) {
      const p = spec.endsWith('.js') || spec.endsWith('.mjs') ? spec : resolve(spec, 'index.mjs');
      return await import(pathToFileURL(p).href);
    }
    return await import('playwright-core');
  } catch (e) {
    console.error('Không tải được playwright-core. Đặt PLAYWRIGHT_CORE=<đường dẫn tới thư mục playwright-core>.');
    throw e;
  }
}

export async function openRasterizer() {
  const pw = await loadPlaywright();
  const chromium = pw.chromium || pw.default?.chromium;
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setContent('<html><body></body></html>');
  let count = 0;

  async function render(svg, { scale = 2, format = 'png', quality = 0.92, width, height } = {}) {
    const m = svg.match(/<svg[^>]*\swidth="([\d.]+)"[^>]*\sheight="([\d.]+)"/);
    const w = width || (m ? +m[1] : 256), h = height || (m ? +m[2] : 256);
    const W = Math.round(w * scale), H = Math.round(h * scale);
    const dataUrl = await page.evaluate(async ({ svg, W, H, format, quality }) => {
      const blob = new Blob([svg], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      const img = new Image();
      img.decoding = 'sync';
      await new Promise((ok, bad) => { img.onload = ok; img.onerror = () => bad(new Error('SVG không hợp lệ')); img.src = url; });
      const c = document.createElement('canvas');
      c.width = W; c.height = H;
      const ctx = c.getContext('2d');
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, W, H);
      URL.revokeObjectURL(url);
      return c.toDataURL(format === 'webp' ? 'image/webp' : 'image/png', quality);
    }, { svg, W, H, format, quality });
    return { buf: Buffer.from(dataUrl.split(',')[1], 'base64'), W, H };
  }

  return {
    render,
    /** Lưu ra file; định dạng theo phần mở rộng (.png/.webp). Trả về {W,H,bytes}. */
    async save(svg, outPath, opts = {}) {
      const format = outPath.endsWith('.webp') ? 'webp' : 'png';
      const { buf, W, H } = await render(svg, { ...opts, format });
      mkdirSync(dirname(outPath), { recursive: true });
      writeFileSync(outPath, buf);
      if (opts.keepSvg) writeFileSync(outPath.replace(/\.(png|webp)$/, '.svg'), svg);
      count++;
      return { W, H, bytes: buf.length };
    },
    /** Chụp một trang HTML bất kỳ (dùng cho ảnh xem trước). */
    page,
    get count() { return count; },
    close: () => browser.close(),
  };
}
