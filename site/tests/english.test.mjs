import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { LEADS_ENABLED } from '../src/data/site.js';

// `npm test` builds first, so dist/ reflects the current src/.
const dist = new URL('../dist/', import.meta.url);
const read = (p) => fs.readFileSync(new URL(p, dist), 'utf8');
const exists = (p) => fs.existsSync(new URL(p, dist));
const SITE = (process.env.URL || 'http://localhost:4321').replace(/\/$/, '');

const PAGES = {
  es: { home: ['index.html', '/'], install: ['instalar/index.html', '/instalar'] },
  en: { home: ['en/index.html', '/en/'], install: ['en/install/index.html', '/en/install'] }
};
const html = (lang, page) => (exists(PAGES[lang][page][0]) ? read(PAGES[lang][page][0]) : '');
const url = (lang, page) => `${SITE}${PAGES[lang][page][1]}`;

const title = (h) => h.match(/<title>([^<]*)<\/title>/)?.[1] ?? '';
const meta = (h, attr, name) => [...h.matchAll(new RegExp(`<meta ${attr}="${name}" content="([^"]*)"`, 'g'))].map(m => m[1]);
const alternates = (h) => Object.fromEntries([...h.matchAll(/<link rel="alternate" hreflang="([^"]+)" href="([^"]+)"/g)].map(m => [m[1], m[2]]));
const graph = (h) => [...h.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)]
  .map(m => JSON.parse(m[1])).flatMap(b => b['@graph'] || [b]);
const node = (h, type) => graph(h).find(n => n['@type'] === type);
const visible = (h) => h
  .replace(/<head>[\s\S]*?<\/head>/, ' ')
  .replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>|<svg[\s\S]*?<\/svg>/g, ' ')
  .replace(/<[^>]+>/g, ' ')
  .replace(/\s+/g, ' ');

test('english: both English pages build', () => {
  assert.ok(exists('en/index.html'), 'dist/en/index.html');
  assert.ok(exists('en/install/index.html'), 'dist/en/install/index.html');
});

test('english: html lang, titles and locales per language', () => {
  for (const page of ['home', 'install']) {
    assert.match(html('es', page), /<html lang="es"/);
    assert.match(html('en', page), /<html lang="en"/);
    assert.ok(title(html('en', page)).length <= 60, `en ${page} title ≤ 60`);
    assert.deepEqual(meta(html('en', page), 'property', 'og:locale'), ['en_US']);
    assert.deepEqual(meta(html('en', page), 'property', 'og:locale:alternate'), ['es_419']);
    assert.deepEqual(meta(html('es', page), 'property', 'og:locale:alternate'), ['en_US']);
    assert.match(meta(html('en', page), 'property', 'og:image')[0] || '', /\/og-en\.png$/);
  }
  assert.equal(title(html('en', 'home')), 'Export WhatsApp contacts to Google Contacts | CLC Agenda');
  assert.ok(exists('og-en.png'), 'English social card');
});

test('english: hreflang triplets are complete and reciprocal', () => {
  for (const page of ['home', 'install']) {
    const expected = { es: url('es', page), en: url('en', page), 'x-default': url('en', page) };
    for (const lang of ['es', 'en']) {
      assert.deepEqual(alternates(html(lang, page)), expected, `${lang} ${page}`);
      assert.match(html(lang, page), new RegExp(`<link rel="canonical" href="${url(lang, page)}"`));
    }
  }
});

test('english: the switcher links the twin page and marks the current language', () => {
  for (const page of ['home', 'install']) {
    for (const [lang, other] of [['es', 'en'], ['en', 'es']]) {
      const h = html(lang, page);
      assert.match(h, new RegExp(`<a[^>]*href="${PAGES[other][page][1]}"[^>]*hreflang="${other}"`), `${lang} ${page} links ${other}`);
      assert.match(h, new RegExp(`<a[^>]*hreflang="${lang}"[^>]*aria-current="true"`), `${lang} ${page} marks itself`);
    }
  }
});

test('english: English pages carry no Spanish copy', () => {
  const SPANISH = /[áéíóúñ¿¡]|\b(contactos|tu agenda|grupo|grupos|extensión|instala|instalar|descarga|preguntas|celular|etiquetas)\b/i;
  for (const page of ['home', 'install']) {
    const text = visible(html('en', page))
      .replace(/CLC Agenda/g, '')
      .replace(/\bES\b|Español/g, '');
    const hit = text.match(SPANISH);
    assert.equal(hit, null, `Spanish in en ${page}: "${hit && text.slice(Math.max(0, hit.index - 40), hit.index + 40)}"`);
  }
});

test('english: structured data speaks English on English pages', () => {
  const home = html('en', 'home');
  assert.equal(node(home, 'WebPage').inLanguage, 'en');
  assert.equal(node(home, 'SoftwareApplication').inLanguage, 'en');
  assert.match(node(home, 'FAQPage').mainEntity[0].name, /^How do I export/);
  const guide = html('en', 'install');
  const howto = node(guide, 'HowTo');
  assert.equal(howto.step.length, 7);
  assert.equal(howto.step[4].name, 'Click "Load unpacked"');
  assert.equal(howto.step[0].url, `${url('en', 'install')}#step-1`);
  assert.deepEqual(node(guide, 'BreadcrumbList').itemListElement.map(i => [i.name, i.item]), [['Home', url('en', 'home')], ['Install', url('en', 'install')]]);
  assert.equal(node(html('es', 'home'), 'WebPage').inLanguage, 'es');
});

test('english: sitemap lists every page with its language alternates', () => {
  const sitemap = read('sitemap.xml');
  assert.match(sitemap, /xmlns:xhtml="http:\/\/www.w3.org\/1999\/xhtml"/);
  for (const lang of ['es', 'en']) {
    for (const page of ['home', 'install']) {
      assert.match(sitemap, new RegExp(`<loc>${url(lang, page)}</loc>`));
    }
  }
  assert.equal((sitemap.match(/<xhtml:link rel="alternate" hreflang="x-default"/g) || []).length, LEADS_ENABLED ? 6 : 4);
});

test('english: llms.txt is in English and links both languages', () => {
  const llms = read('llms.txt');
  assert.match(llms, /^# CLC Agenda\n\n> CLC Agenda is an open-source browser extension/);
  for (const link of [url('en', 'home'), url('en', 'install'), url('es', 'home'), url('es', 'install')]) {
    assert.ok(llms.includes(`](${link})`), `llms.txt links ${link}`);
  }
});

test('english: the 404 page speaks both languages', () => {
  const notFound = read('404.html');
  assert.match(notFound, /Esta página no existe/);
  assert.match(notFound, /This page doesn't exist/);
  assert.match(notFound, /href="\/en\/"/);
});

test('english: the hero plays the English video with its own poster and description', () => {
  const en = html('en', 'home');
  const es = html('es', 'home');
  const sources = (h) => [...h.matchAll(/<source src="([^"]+)"/g)].map(m => m[1]);
  assert.deepEqual(sources(en), ['/video/clc-agenda-en.mp4', '/video/clc-agenda-en.webm']);
  assert.deepEqual(sources(es), ['/video/clc-agenda.mp4', '/video/clc-agenda.webm']);
  const poster = (h) => h.match(/<video[^>]*poster="([^"]+)"/)?.[1];
  assert.ok(poster(en) && poster(es) && poster(en) !== poster(es), 'each language has its own poster');
  assert.match(en.match(/<video[^>]*>/)[0], /aria-label="45-second silent video:/);
  for (const ext of ['mp4', 'webm']) {
    assert.ok(exists(`video/clc-agenda-en.${ext}`), `dist has clc-agenda-en.${ext}`);
    assert.ok(fs.statSync(new URL(`video/clc-agenda-en.${ext}`, dist)).size < 2.5 * 1024 * 1024, `${ext} under 2.5 MB`);
  }
});
