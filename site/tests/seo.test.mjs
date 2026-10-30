import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

// `npm test` builds first, so dist/ reflects the current src/.
const root = new URL('../', import.meta.url);
const dist = new URL('dist/', root);
const read = (p) => fs.readFileSync(new URL(p, dist), 'utf8');
const exists = (p) => fs.existsSync(new URL(p, dist));

const SITE = (process.env.URL || 'http://localhost:4321').replace(/\/$/, '');
const REPO = 'https://github.com/CarlosLeonCode/clc-agenda';
const DOWNLOAD_URL = `${REPO}/releases/latest/download/clc-agenda.zip`;
const AUTHOR_URL = 'https://www.carlosleoncode.com/';
const GITHUB_PROFILE = 'https://github.com/CarlosLeonCode';
const manifest = JSON.parse(fs.readFileSync(new URL('../manifest.json', root), 'utf8'));

const home = read('index.html');
const guide = read('instalar/index.html');

const title = (html) => html.match(/<title>([^<]*)<\/title>/)?.[1] ?? '';
const meta = (html, attr, name) => html.match(new RegExp(`<meta ${attr}="${name}" content="([^"]*)"`))?.[1];
const graph = (html) => [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)]
  .map(m => JSON.parse(m[1]))
  .flatMap(b => b['@graph'] || [b]);
const node = (html, type) => graph(html).find(n => n['@type'] === type);
// Text the way a crawler joins it: tags removed, nothing inserted between them
const joinedText = (fragment) => fragment.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
const headings = (html, level) => [...html.matchAll(new RegExp(`<h${level}[^>]*>([\\s\\S]*?)</h${level}>`, 'g'))].map(m => joinedText(m[1]));
const visible = (html) => html
  .replace(/<head>[\s\S]*?<\/head>/, ' ')
  .replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>|<svg[\s\S]*?<\/svg>/g, ' ')
  .replace(/<[^>]+>/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();

test('seo: robots.txt allows everyone, names the AI crawlers and points to the sitemap', () => {
  const robots = read('robots.txt');
  assert.match(robots, /User-agent: \*\s*\nAllow: \//);
  for (const bot of ['GPTBot', 'ClaudeBot', 'PerplexityBot', 'Google-Extended']) {
    assert.match(robots, new RegExp(`User-agent: ${bot}\\s*\\nAllow: /`), `${bot} is allowed`);
  }
  assert.match(robots, new RegExp(`Sitemap: ${SITE}/sitemap.xml`));
});

test('seo: sitemap lists both pages with absolute URLs and lastmod', () => {
  const sitemap = read('sitemap.xml');
  assert.match(sitemap, /<urlset xmlns="http:\/\/www.sitemaps.org\/schemas\/sitemap\/0.9">/);
  assert.match(sitemap, new RegExp(`<loc>${SITE}/</loc>`));
  assert.match(sitemap, new RegExp(`<loc>${SITE}/instalar</loc>`));
  assert.equal((sitemap.match(/<lastmod>\d{4}-\d{2}-\d{2}<\/lastmod>/g) || []).length, 2);
});

test('seo: titles lead with what people search and fit in 60 characters', () => {
  assert.equal(title(home), 'Exporta contactos de WhatsApp a Google Contacts | CLC Agenda');
  assert.match(title(guide), /instalar/i);
  for (const t of [title(home), title(guide)]) assert.ok(t.length <= 60, `"${t}" is ${t.length} chars`);
  const description = meta(home, 'name', 'description');
  assert.match(description, /^Exporta los contactos de WhatsApp/);
  for (const d of [description, meta(guide, 'name', 'description')]) assert.ok(d.length <= 160, `${d.length} chars`);
});

test('seo: a keyword eyebrow sits right above the home h1', () => {
  assert.match(home, /<p class="hero-eyebrow"[^>]*>Exporta contactos de WhatsApp Web<\/p>\s*<h1/);
});

test('seo: headings keep a space where lines break', () => {
  const glued = /[a-záéíóúñ][,.][A-ZÁÉÍÓÚa-záéíóúñ]/;
  for (const h of [...headings(home, 1), ...headings(home, 2), ...headings(guide, 1), ...headings(guide, 2)]) {
    assert.doesNotMatch(h, glued, `glued words in "${h}"`);
  }
});

test('geo: a quotable definition appears within the first 100 words', () => {
  const words = visible(home).split(' ').slice(0, 100).join(' ');
  assert.match(words, /CLC Agenda es una extensión/);
  for (const fact of ['WhatsApp Web', 'código abierto', 'Google Contacts', 'vCard', 'CSV', 'JSON', 'tu navegador']) {
    assert.ok(words.includes(fact), `definition mentions ${fact}`);
  }
  assert.doesNotMatch(visible(home), /\bgratis\b|Chrome Web Store/i);
});

test('geo: FAQ answers the questions people actually ask', () => {
  const faq = node(home, 'FAQPage');
  const questions = faq.mainEntity.map(q => q.name);
  for (const q of [
    '¿Cómo exportar los contactos de un grupo de WhatsApp?',
    '¿Cómo pasar contactos de WhatsApp a Google Contacts?',
    '¿Puedo guardar en el celular los números que no tengo agendados?',
    '¿Se puede exportar a Excel?'
  ]) {
    assert.ok(questions.includes(q), `FAQ has ${q}`);
    assert.ok(home.includes(`<summary>${q}</summary>`), `page shows ${q}`);
  }
  assert.ok(questions.length >= 10);
});

test('geo: llms.txt summarizes the product with absolute links', () => {
  const llms = read('llms.txt');
  assert.match(llms, /^# CLC Agenda\n\n> .{40,}\n/);
  for (const link of [`${SITE}/`, `${SITE}/instalar`, DOWNLOAD_URL, REPO, AUTHOR_URL]) {
    assert.ok(llms.includes(`](${link})`), `llms.txt links ${link}`);
  }
});

test('structured data: the app carries version, download, screenshot and a linked author', () => {
  const app = node(home, 'SoftwareApplication');
  assert.equal(app.softwareVersion, manifest.version);
  assert.equal(app.downloadUrl, DOWNLOAD_URL);
  assert.match(app.screenshot, /^https?:\/\/.+\.(png|webp|jpg)$/);
  assert.equal(app.author['@type'], 'Person');
  assert.deepEqual(app.author.sameAs, [AUTHOR_URL, GITHUB_PROFILE]);
  assert.equal(node(home, 'WebSite').url, `${SITE}/`);
  assert.match(node(home, 'WebPage').dateModified, /^\d{4}-\d{2}-\d{2}/);
});

test('structured data: the guide is a HowTo whose steps match the page', () => {
  const howto = node(guide, 'HowTo');
  assert.equal(howto.step.length, 7);
  const stepHeadings = headings(guide, 2).slice(0, 7);
  assert.deepEqual(howto.step.map(s => s.name), stepHeadings);
  howto.step.forEach((s, i) => {
    assert.equal(s['@type'], 'HowToStep');
    assert.equal(s.position, i + 1);
    assert.ok(s.text.length > 20);
  });
  const crumbs = node(guide, 'BreadcrumbList').itemListElement;
  assert.deepEqual(crumbs.map(c => [c.position, c.name, c.item]), [[1, 'Inicio', `${SITE}/`], [2, 'Instalar', `${SITE}/instalar`]]);
  assert.equal(node(guide, 'WebPage').url, `${SITE}/instalar`);
  assert.equal(node(guide, 'SoftwareApplication'), undefined, 'the app graph stays on the home page');
});

test('seo: a 404 page exists, is not indexed and links back', () => {
  assert.ok(exists('404.html'));
  const notFound = read('404.html');
  assert.match(notFound, /<meta name="robots" content="noindex"/);
  assert.match(notFound, /href="\/"/);
  assert.match(notFound, /href="\/instalar"/);
});

test('seo: apple-touch-icon and image alt text for social cards', () => {
  for (const html of [home, guide]) {
    assert.match(html, /<link rel="apple-touch-icon" sizes="180x180" href="\/apple-touch-icon.png"/);
    assert.ok(meta(html, 'property', 'og:image:alt')?.length > 20);
    assert.ok(meta(html, 'name', 'twitter:image:alt')?.length > 20);
  }
  const png = fs.readFileSync(new URL('apple-touch-icon.png', dist));
  assert.deepEqual([png.readUInt32BE(16), png.readUInt32BE(20)], [180, 180]);
});
