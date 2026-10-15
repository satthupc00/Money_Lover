// Xuất icon PNG từ build/icon.svg (chạy: node scripts/make-icons.cjs) — cần Playwright/Chromium
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const svg = fs.readFileSync(path.join(__dirname, '..', 'build', 'icon.svg'), 'utf8');
const R = (p) => path.join(__dirname, '..', p);
// silhouette 1 màu cho icon thông báo / themed icon
const mono = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><g fill="#fff"><g transform="translate(14 8) rotate(-11 210 250) scale(.94)"><rect x="40" y="16" width="336" height="440" rx="36"/></g></g><circle cx="370" cy="368" r="132" fill="#000"/><circle cx="370" cy="368" r="118" fill="#fff"/><path d="M370 322v92M324 368h92" stroke="#000" stroke-width="30" stroke-linecap="round"/></svg>`;

async function shot(page, markup, size, file, { bg = 'transparent', scale = 1 } = {}) {
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(`<html><body style="margin:0;background:${bg};width:${size}px;height:${size}px;display:grid;place-items:center;overflow:hidden">
    <div style="width:${size * scale}px;height:${size * scale}px">${markup.replace('<svg ', '<svg width="100%" height="100%" ')}</div></body></html>`);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  await page.screenshot({ path: file, omitBackground: bg === 'transparent' });
}

(async () => {
  const b = await chromium.launch();
  const p = await b.newPage();
  await shot(p, svg, 512, R('build/icon.png'));
  await shot(p, svg, 256, R('electron/icon.png'));
  for (const s of [16, 24, 32, 48, 64, 128, 256]) await shot(p, svg, s, R(`build/ico/${s}.png`));
  const dens = { mdpi: 1, hdpi: 1.5, xhdpi: 2, xxhdpi: 3, xxxhdpi: 4 };
  const res = R('android/app/src/main/res');
  for (const [d, k] of Object.entries(dens)) {
    await shot(p, svg, Math.round(108 * k), `${res}/mipmap-${d}/ic_launcher_foreground.png`, { scale: 0.62 });
    await shot(p, mono, Math.round(108 * k), `${res}/mipmap-${d}/ic_launcher_monochrome.png`, { scale: 0.62 });
    await shot(p, svg, Math.round(48 * k), `${res}/mipmap-${d}/ic_launcher.png`, { bg: '#FFF1E3', scale: 0.8 });
    await shot(p, svg, Math.round(48 * k), `${res}/mipmap-${d}/ic_launcher_round.png`, { bg: '#FFF1E3', scale: 0.78 });
    await shot(p, mono.replace(/fill="#000"/g, 'fill="transparent"').replace('stroke="#000"', 'stroke="transparent"'), Math.round(24 * k), `${res}/drawable-${d}/ic_stat_notify.png`);
  }
  await shot(p, svg, 480, `${res}/drawable/splash_logo.png`);
  await b.close();
})();
