import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

// `npm test` builds first, so dist/ reflects the current src/.
const root = new URL('../', import.meta.url);
const page = new URL('dist/instalar/index.html', root);
const html = fs.existsSync(page) ? fs.readFileSync(page, 'utf8') : '';
const DOWNLOAD_URL = 'https://github.com/CarlosLeonCode/clc-agenda/releases/latest/download/clc-agenda.zip';
const REPO = 'https://github.com/CarlosLeonCode/clc-agenda';
const AUTHOR_URL = 'https://www.carlosleoncode.com';

const visibleText = html
  .replace(/<script[\s\S]*?<\/script>/g, ' ')
  .replace(/<style[\s\S]*?<\/style>/g, ' ')
  .replace(/<svg[\s\S]*?<\/svg>/g, ' ')
  .replace(/<[^>]+>/g, ' ')
  .replace(/&nbsp;/g, ' ')
  .replace(/\s+/g, ' ');

const STEPS = [
  /Descarga/,
  /Descompr[ií]m/,
  /extensiones/,
  /Modo de desarrollador/,
  /Cargar descomprimida/,
  /Fija/,
  /WhatsApp Web/
];

test('Install guide: the page exists with its own title, description and one h1', () => {
  assert.ok(html, 'dist/instalar/index.html is built');
  assert.match(html, /<html[^>]*lang="es"/);
  assert.match(html, /<title>[^<]*instalar[^<]*<\/title>/i);
  assert.match(html, /<meta name="description" content="[^"]{50,}"/);
  assert.equal((html.match(/<h1[\s>]/g) || []).length, 1);
  assert.match(html, /<main[\s>]/);
});

test('Install guide: seven steps, in order, as an ordered list', () => {
  const list = html.match(/<ol[^>]*class="[^"]*\bsteps-guide\b[^"]*"[^>]*>([\s\S]*?)<\/ol>/)?.[1] || '';
  const items = [...list.matchAll(/<li[\s>][\s\S]*?<\/li>/g)].map(m => m[0]);
  assert.equal(items.length, 7);
  items.forEach((item, i) => {
    const heading = item.match(/<h2[^>]*>([\s\S]*?)<\/h2>/)?.[1].replace(/<[^>]+>/g, '') || '';
    assert.match(heading, STEPS[i], `step ${i + 1}: ${heading}`);
  });
});

test('Install guide: download link points to the latest release zip', () => {
  assert.match(html, new RegExp(`<a[^>]*href="${DOWNLOAD_URL}"`));
});

test('Install guide: a copy button for chrome://extensions, announced to screen readers', () => {
  assert.match(html, /<button[^>]*data-copy="chrome:\/\/extensions"/);
  assert.match(html, /aria-live="polite"/);
  for (const other of ['brave://extensions', 'edge://extensions', 'opera://extensions']) assert.ok(html.includes(other), other);
});

test('Install guide: troubleshooting covers the missing button, the developer-mode notice and updates', () => {
  assert.match(visibleText, /Si algo no funciona/);
  assert.match(visibleText, /[Rr]ecarga WhatsApp Web/);
  assert.match(visibleText, /modo de desarrollador/i);
  assert.match(visibleText, /[Aa]ctualizar/);
  assert.match(visibleText, /Chrome Web Store/);
});

test('Install guide: illustrations are decorative; step text carries the meaning', () => {
  // Exact "illo" class token (not illo-file, illo-arrow…)
  const figures = html.match(/<div[^>]*class="(?:[^"]*\s)?illo(?:\s[^"]*)?"[^>]*>/g) || [];
  assert.equal(figures.length, 7);
  for (const fig of figures) assert.match(fig, /aria-hidden="true"/);
});

test('Install guide: neutral Spanish, no third-party resources, external links only where expected', () => {
  assert.doesNotMatch(visibleText, /\b(vos|tenés|podés|elegí|abrí|importá|andá|hacé|guardalo|querés|sabés|descargá|descomprimí|tocá|activá)\b/i);
  const resources = [...html.matchAll(/<(?:script|img|source|link|iframe|video)[^>]*(?:src|href)="([^"]+)"/g)].map(m => m[1]);
  for (const url of resources) assert.ok(!/^(https?:)?\/\//.test(url) || url.endsWith('/instalar') || url.endsWith('/instalar/'), `third-party resource: ${url}`);
  const anchors = [...html.matchAll(/<a[^>]*href="(https?:[^"]+)"/g)].map(m => m[1]);
  for (const href of anchors) assert.ok(href.startsWith(REPO) || href.startsWith(AUTHOR_URL), `unexpected external link: ${href}`);
});

test('Install guide: nav section links lead back to the home page sections', () => {
  for (const anchor of ['como-funciona', 'formatos', 'privacidad', 'preguntas']) {
    assert.match(html, new RegExp(`href="/#${anchor}"`), `nav link to /#${anchor}`);
  }
});

test('CSP: no page ships executable inline scripts (script-src is self only)', () => {
  const dist = new URL('dist/', root);
  const pages = [new URL('index.html', dist), page].filter(f => fs.existsSync(f));
  assert.equal(pages.length, 2);
  for (const file of pages) {
    const doc = fs.readFileSync(file, 'utf8');
    const inline = [...doc.matchAll(/<script(?![^>]*\bsrc=)([^>]*)>([\s\S]*?)<\/script>/g)]
      .filter(([, attrs, body]) => body.trim() && !/type="application\/ld\+json"/.test(attrs));
    assert.deepEqual(inline.map(m => m[0].slice(0, 80)), [], `${file.pathname.split('/dist/')[1]} has inline scripts`);
  }
});
