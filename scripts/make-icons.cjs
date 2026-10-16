// Xuất icon PNG / ICO từ các SVG trong build/ (vẽ bằng scripts/make-logo.py). Chạy: node scripts/make-icons.cjs — cần Playwright/Chromium + Python Pillow
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const R = (p) => path.join(__dirname, '..', p);
const read = (n) => fs.readFileSync(R(`build/${n}.svg`), 'utf8');
const full = read('icon'), bg = read('icon-bg'), fg = read('icon-fg'), round = read('icon-round'), mono = read('icon-mono');

async function shot(page, markup, size, file, { scale = 1 } = {}) {
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(`<html><body style="margin:0;background:transparent;width:${size}px;height:${size}px;display:grid;place-items:center;overflow:hidden">
    <div style="width:${size * scale}px;height:${size * scale}px">${markup.replace('<svg ', '<svg width="100%" height="100%" ')}</div></body></html>`);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  await page.screenshot({ path: file, omitBackground: true });
}

(async () => {
  const b = await chromium.launch();
  const p = await b.newPage();
  await shot(p, full, 512, R('build/icon.png'));
  await shot(p, full, 256, R('electron/icon.png'));
  const ico = [16, 24, 32, 48, 64, 128, 256];
  for (const s of ico) await shot(p, full, s, R(`build/ico/${s}.png`));
  const dens = { mdpi: 1, hdpi: 1.5, xhdpi: 2, xxhdpi: 3, xxxhdpi: 4 };
  const res = R('android/app/src/main/res');
  for (const [d, k] of Object.entries(dens)) {
    // icon thích ứng Android: nền kem + sóng cam phủ kín, lớp trước là cuốn sổ + đồng xu
    await shot(p, bg, Math.round(108 * k), `${res}/mipmap-${d}/ic_launcher_background.png`);
    await shot(p, fg, Math.round(108 * k), `${res}/mipmap-${d}/ic_launcher_foreground.png`, { scale: 0.6 });
    await shot(p, mono, Math.round(108 * k), `${res}/mipmap-${d}/ic_launcher_monochrome.png`, { scale: 0.62 });
    await shot(p, full, Math.round(48 * k), `${res}/mipmap-${d}/ic_launcher.png`, { scale: 1.08 });
    await shot(p, round, Math.round(48 * k), `${res}/mipmap-${d}/ic_launcher_round.png`, { scale: 0.92 });
    await shot(p, mono, Math.round(24 * k), `${res}/drawable-${d}/ic_stat_notify.png`);
  }
  await shot(p, full, 480, `${res}/drawable/splash_logo.png`);
  await b.close();
  // gộp các cỡ thành icon.ico cho Windows
  execFileSync('python3', ['-I', '-c', `
from PIL import Image
imgs=[Image.open('build/ico/%d.png'%s).convert('RGBA') for s in ${JSON.stringify(ico)}]
imgs[-1].save('build/icon.ico', sizes=[(s,s) for s in ${JSON.stringify(ico)}], append_images=imgs[:-1])
`], { cwd: R('.') });
  fs.rmSync(R('build/ico'), { recursive: true, force: true });
})();
