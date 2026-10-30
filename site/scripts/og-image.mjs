/**
 * Renders the 1200x630 social cards (public/og.png, public/og-en.png) with local Chrome.
 * Fonts and the product shot load from disk, so nothing is fetched remotely.
 * Run with `npm run og` (Spanish) or `npm run og -- en` after changing the headline or the shot.
 */

import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';

// puppeteer-core is already a dependency of the video project; reuse it
const require = createRequire(new URL('../../video/package.json', import.meta.url));
const puppeteer = require('puppeteer-core');

const site = fileURLToPath(new URL('../', import.meta.url));
const lang = process.argv[2] === 'en' ? 'en' : 'es';
const COPY = {
  es: { out: 'public/og.png', shot: 'src/assets/results-unsaved.png', size: 104, hl: ['Tu agenda, ', 'fuera', ' de ', 'WhatsApp.'], sub: 'Grupos, chats y etiquetas a Google Contacts o a tu celular.' },
  en: { out: 'public/og-en.png', shot: 'src/assets/results-unsaved-en.png', size: 88, hl: ['Your contacts, ', 'out', ' of ', 'WhatsApp.'], sub: 'Groups, chats and labels to Google Contacts or your phone.' }
}[lang];
// Inline assets as data URIs: setContent runs on about:blank, which cannot read file://
const mime = { woff2: 'font/woff2', png: 'image/png' };
const file = (p) => `data:${mime[p.split('.').pop()]};base64,${fs.readFileSync(path.join(site, p)).toString('base64')}`;

const html = `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face{font-family:B;font-weight:800;src:url('${file('node_modules/@fontsource/bricolage-grotesque/files/bricolage-grotesque-latin-800-normal.woff2')}')}
@font-face{font-family:I;font-weight:100 900;src:url('${file('node_modules/@fontsource-variable/inter/files/inter-latin-wght-normal.woff2')}')}
*{margin:0;box-sizing:border-box}
body{width:1200px;height:630px;background:#fff;font-family:I;color:#0F0F10;position:relative;overflow:hidden}
.brand{position:absolute;left:64px;top:56px;display:flex;gap:12px;align-items:center;font:800 28px B}
.brand svg{width:40px;height:40px;color:#0F0F10}
h1{position:absolute;left:64px;top:170px;font:800 ${COPY.size}px/0.92 B;letter-spacing:-.045em;width:640px}
.hl{display:inline-block;padding:0 14px;border-radius:20px}
p{position:absolute;left:64px;bottom:64px;font:500 26px I;color:#5C5C66;width:560px}
.canvas{position:absolute;right:-40px;top:70px;width:520px;height:600px;border-radius:40px;background:#F4F1FF}
.canvas img{position:absolute;left:48px;top:56px;width:560px;border-radius:16px;box-shadow:0 30px 60px -20px rgba(60,40,140,.45)}
.blob{position:absolute;border-radius:50%}
</style></head><body>
<div class="brand">${fs.readFileSync(path.join(site, 'src/assets/brand/clc-agenda.svg'), 'utf8')}CLC Agenda</div>
<div class="canvas"><div class="blob" style="width:200px;height:200px;background:#FFC700;left:-70px;bottom:-70px"></div><img src="${file(fs.existsSync(path.join(site, COPY.shot)) ? COPY.shot : 'src/assets/results-unsaved.png')}"></div>
<h1>${COPY.hl[0]}<span class="hl" style="background:#6A4FF5;color:#fff;transform:rotate(-2deg)">${COPY.hl[1]}</span>${COPY.hl[2]}<span class="hl" style="background:#FF7262;transform:rotate(2deg)">${COPY.hl[3]}</span></h1>
<p>${COPY.sub}</p>
</body></html>`;

const browser = await puppeteer.launch({
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: true,
  args: ['--allow-file-access-from-files']
});
const page = await browser.newPage();
await page.setViewport({ width: 1200, height: 630 });
await page.setContent(html, { waitUntil: 'load' });
await page.evaluate(() => document.fonts.ready);
await page.screenshot({ path: path.join(site, COPY.out) });
await browser.close();
console.log(`${COPY.out} written`);
