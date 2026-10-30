/**
 * Renders the Fuga mark (src/ui/brand.js) into the extension icons, the landing
 * favicons and SVG source files. Run with `npm run icons` after changing the mark.
 * Uses local Chrome through the video project's puppeteer-core.
 */

import fs from 'node:fs';
import { createRequire } from 'node:module';
import { markSVG, BRAND } from '../src/ui/brand.js';

const root = new URL('../', import.meta.url);
const puppeteer = createRequire(new URL('video/package.json', root))('puppeteer-core');

const svgFiles = {
  'icons/brand/clc-agenda.svg': markSVG(),
  'icons/brand/clc-agenda-on-dark.svg': markSVG({ bubble: '#FFFFFF' }),
  'icons/brand/clc-agenda-icon.svg': markSVG({ tile: true }),
  'icons/brand/clc-agenda-icon-16.svg': markSVG({ tile: true, small: true }),
  'site/src/assets/brand/clc-agenda.svg': markSVG({ bubble: 'currentColor', className: 'brand-mark' })
};

// Toolbar icons use the tile so they read on light and dark Chrome themes.
// [file, size, small, opaque]: iOS masks home-screen icons itself and paints
// transparent corners black, so the apple-touch-icon is a full-bleed ink square.
const pngFiles = [
  ['icons/icon-16.png', 16, true, false],
  ['icons/icon-48.png', 48, false, false],
  ['icons/icon-128.png', 128, false, false],
  ['site/public/favicon-48.png', 48, false, false],
  ['site/public/favicon.png', 128, false, false],
  ['site/public/apple-touch-icon.png', 180, false, true]
];

for (const [file, svg] of Object.entries(svgFiles)) {
  const url = new URL(file, root);
  fs.mkdirSync(new URL('./', url), { recursive: true });
  fs.writeFileSync(url, svg.trim() + '\n');
}

const browser = await puppeteer.launch({
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: true
});
const page = await browser.newPage();
for (const [file, size, small, opaque] of pngFiles) {
  await page.setViewport({ width: size, height: size, deviceScaleFactor: 1 });
  const svg = markSVG({ tile: true, small }).replace('<svg', `<svg width="${size}" height="${size}" style="display:block"`);
  const background = opaque ? BRAND.ink : 'transparent';
  await page.setContent(`<html><body style="margin:0;background:${background}">${svg}</body></html>`);
  await page.screenshot({ path: new URL(file, root).pathname, omitBackground: !opaque, clip: { x: 0, y: 0, width: size, height: size } });
  console.log('icon', file, `${size}px`);
}
await browser.close();
