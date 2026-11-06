// Draws the app icons (PNG) from the Globe Stacks mark. Needs Playwright; only run when the logo changes.
const { chromium } = require('playwright');
const path = require('path');
const out = path.join(__dirname, '..', 'static', 'icons');

const mark = `
<path d="M32 46 L58 54 L32 62 L6 54 Z" fill="#a9c7f5" stroke="#0a2540" stroke-width="1.5"/>
<path d="M32 38 L58 46 L32 54 L6 46 Z" fill="#5b93ea" stroke="#0a2540" stroke-width="1.5"/>
<path d="M32 30 L58 38 L32 46 L6 38 Z" fill="#2f6fe0" stroke="#0a2540" stroke-width="1.5"/>
<circle cx="32" cy="20" r="16" fill="#f2f7ff" stroke="#0a2540" stroke-width="1.5"/>
<ellipse cx="32" cy="20" rx="7" ry="16" fill="none" stroke="#2f6fe0" stroke-width="1.5"/>
<path d="M17.2 14 H46.8 M16 20 H48 M17.2 26 H46.8" fill="none" stroke="#2f6fe0" stroke-width="1.5"/>`;

function svg({ size, radius, scale }) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 64 64">
<rect width="64" height="64" rx="${radius}" fill="#0a2540"/>
<g transform="translate(32 32) scale(${scale}) translate(-32 -33)">${mark}</g></svg>`;
}

(async () => {
  const browser = await chromium.launch();
  const jobs = [
    ['icon-192.png', 192, 14, 0.84],
    ['icon-512.png', 512, 14, 0.84],
    ['maskable-512.png', 512, 0, 0.62],
    ['apple-touch-icon.png', 180, 0, 0.74],
    ['favicon-32.png', 32, 7, 0.9],
  ];
  for (const [name, size, radius, scale] of jobs) {
    const page = await browser.newPage({ viewport: { width: size, height: size }, deviceScaleFactor: 1 });
    await page.setContent(`<body style="margin:0;background:transparent">${svg({ size, radius, scale })}</body>`);
    await page.screenshot({ path: path.join(out, name), omitBackground: true });
    await page.close();
  }
  await browser.close();
  console.log('icons written to', out);
})();
