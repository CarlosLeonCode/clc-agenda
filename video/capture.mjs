/**
 * Captures the real CLC Agenda overlay (fake harness data only) as 2x PNGs
 * for the promo video, plus the click targets the animated cursor aims at.
 */

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, '..');
const outDir = path.join(here, 'public', 'ui');
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const HARNESS = '/video/harness.html';

const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.json': 'application/json' };

function serve(root) {
  const server = http.createServer((req, res) => {
    const file = path.join(root, decodeURIComponent(new URL(req.url, 'http://x').pathname));
    if (!file.startsWith(root) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
      res.writeHead(404).end();
      return;
    }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream' });
    fs.createReadStream(file).pipe(res);
  });
  return new Promise(resolve => server.listen(0, '127.0.0.1', () => resolve(server)));
}

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function main() {
  execSync('npm run build', { cwd: repo, stdio: 'inherit' });
  fs.mkdirSync(outDir, { recursive: true });

  const server = await serve(repo);
  const { port } = server.address();
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--hide-scrollbars'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });

  // Hold engine responses until released, so the loading state can be captured
  await page.evaluateOnNewDocument(() => {
    const post = window.postMessage.bind(window);
    window.__held = [];
    window.__hold = false;
    window.postMessage = (msg, origin) => {
      if (window.__hold && msg && msg.type === 'WA_EXTRACTOR_RESPONSE') window.__held.push([msg, origin]);
      else post(msg, origin);
    };
    window.__release = () => { window.__hold = false; window.__held.splice(0).forEach(([m, o]) => post(m, o)); };
  });

  await page.goto(`http://127.0.0.1:${port}${HARNESS}`, { waitUntil: 'load' });
  await page.waitForFunction(() => window.WAExtractorUI && window.WAExtractorUI.open);

  // Transparent page: the PNG keeps only the window with its rounded corners
  await page.evaluate(() => {
    document.body.style.background = 'transparent';
    window.WAExtractorUI.open();
  });

  const root = () => page.evaluateHandle(() => [...document.body.children].find(e => e.shadowRoot).shadowRoot);
  const q = async (selector) => (await root()).evaluateHandle((r, s) => r.querySelector(s), selector);

  await page.evaluate(() => {
    const r = [...document.body.children].find(e => e.shadowRoot).shadowRoot;
    r.getElementById('wae-backdrop').style.display = 'none';
    const launcher = r.querySelector('.wae-launcher, #wae-launcher-btn');
    if (launcher) (launcher.closest('[id]') || launcher).style.visibility = 'hidden';
    r.querySelectorAll('.wae-launcher-btn, .wae-dock-controls').forEach(el => { el.style.visibility = 'hidden'; });
  });

  // Wait for the group list to render
  await page.waitForFunction(() => {
    const r = [...document.body.children].find(e => e.shadowRoot).shadowRoot;
    return r.querySelectorAll('#wae-groups-container .wae-row').length > 0;
  });
  await sleep(400);

  const modal = await q('#wae-modal-container');
  const box = await modal.boundingBox();
  const relative = async (handle) => {
    const b = await handle.boundingBox();
    return { x: b.x - box.x, y: b.y - box.y, width: b.width, height: b.height };
  };
  const shot = async (name) => {
    // Blur focus rings so the stills look like a mouse session
    await page.evaluate(() => {
      const r = [...document.body.children].find(e => e.shadowRoot).shadowRoot;
      r.activeElement && r.activeElement.blur && r.activeElement.blur();
    });
    await page.screenshot({ path: path.join(outDir, `${name}.png`), clip: box, omitBackground: true });
  };

  const targets = { modal: { width: box.width, height: box.height } };

  // 1. Source view
  const row = await (await root()).evaluateHandle(r => [...r.querySelectorAll('#wae-groups-container .wae-row')]
    .find(b => b.textContent.includes('Equipo Ventas LATAM')));
  targets.groupRow = await relative(row);
  await page.mouse.move(0, 0);
  await shot('source');

  // 2. Clicked row: loading state while the response is held
  await page.evaluate(() => { window.__hold = true; });
  await row.click();
  await sleep(500);
  await page.mouse.move(0, 0);
  await shot('source-loading');
  await page.evaluate(() => window.__release());

  // 3. Results view
  await page.waitForFunction(() => {
    const r = [...document.body.children].find(e => e.shadowRoot).shadowRoot;
    return !r.getElementById('wae-view-results').hidden && r.querySelectorAll('#wae-table-body tr').length > 5;
  });
  await sleep(400);
  await shot('results');

  const chip = await (await root()).evaluateHandle(r => [...r.querySelectorAll('.wae-summary-btn')]
    .find(b => b.textContent.includes('sin guardar')));
  targets.unsavedChip = await relative(chip);
  const google = await q('#wae-btn-export-google');
  targets.googleButton = await relative(google);

  // 4. Filtered to unsaved contacts
  await chip.click();
  await sleep(400);
  await page.mouse.move(0, 0);
  await shot('results-unsaved');

  // 5. Export footer with the primary action hovered
  await google.hover();
  await sleep(250);
  await shot('export-hover');

  fs.writeFileSync(path.join(outDir, 'targets.json'), JSON.stringify(targets, null, 2) + '\n');
  await browser.close();
  server.close();
  console.log('Captured to', outDir, targets);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
