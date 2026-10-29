import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

// `npm test` builds first, so dist/ reflects the current src/.
const root = new URL('../', import.meta.url);
const dist = new URL('dist/', root);
const html = fs.readFileSync(new URL('index.html', dist), 'utf8');

// Netlify sets URL during builds; local builds fall back to the dev server
const SITE = (process.env.URL || 'http://localhost:4321').replace(/\/$/, '');
const REPO = 'https://github.com/CarlosLeonCode/clc-agenda';

function listFiles(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? listFiles(full) : [full];
  });
}

const distFiles = listFiles(dist.pathname);
const cssFiles = distFiles.filter(f => f.endsWith('.css'));
const css = cssFiles.map(f => fs.readFileSync(f, 'utf8')).join('\n') + [...html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map(m => m[1]).join('\n');
const visibleText = html
  .replace(/<script[\s\S]*?<\/script>/g, ' ')
  .replace(/<style[\s\S]*?<\/style>/g, ' ')
  .replace(/<[^>]+>/g, ' ')
  .replace(/&nbsp;/g, ' ')
  .replace(/\s+/g, ' ');

const meta = (attr, name) => {
  const m = html.match(new RegExp(`<meta[^>]*${attr}="${name}"[^>]*>`));
  return m ? (m[0].match(/content="([^"]*)"/) || [])[1] : undefined;
};

test('Landing: document language, title and description', () => {
  assert.match(html, /<html[^>]*lang="es"/);
  const title = (html.match(/<title>([^<]*)<\/title>/) || [])[1] || '';
  assert.match(title, /CLC Agenda/);
  const description = meta('name', 'description') || '';
  assert.ok(description.length >= 50 && description.length <= 160, `description length ${description.length}`);
});

test('Landing: social cards, favicon and canonical URL', () => {
  assert.ok(meta('property', 'og:title'));
  assert.ok(meta('property', 'og:description'));
  assert.equal(meta('property', 'og:image'), `${SITE}/og.png`);
  assert.equal(meta('name', 'twitter:card'), 'summary_large_image');
  assert.match(html, /<link[^>]*rel="icon"[^>]*>/);
  assert.match(html, new RegExp(`<link[^>]*rel="canonical"[^>]*href="${SITE}/"`));
  assert.ok(fs.existsSync(new URL('og.png', dist)), 'og.png is published');
});

test('Landing: landmarks and exactly one h1', () => {
  assert.equal((html.match(/<h1[\s>]/g) || []).length, 1);
  for (const tag of ['header', 'main', 'footer', 'nav']) {
    assert.match(html, new RegExp(`<${tag}[\\s>]`), `<${tag}> landmark`);
  }
});

test('Landing: every image has alt text, width and height', () => {
  const imgs = html.match(/<img[^>]*>/g) || [];
  assert.ok(imgs.length >= 1, 'the product shot is rendered');
  for (const img of imgs) {
    assert.match(img, /\salt="/, `alt missing: ${img}`);
    assert.match(img, /\swidth="\d+"/, `width missing: ${img}`);
    assert.match(img, /\sheight="\d+"/, `height missing: ${img}`);
  }
  assert.ok(imgs.some(img => /alt="[^"]{20,}"/.test(img)), 'the product shot has a descriptive alt');
});

test('Landing: no third-party resources; external links only to GitHub', () => {
  const resources = [...html.matchAll(/<(?:script|img|source|link|iframe|video)[^>]*(?:src|href|srcset)="([^"]+)"/g)].map(m => m[1]);
  for (const url of resources) {
    const isCanonical = url === `${SITE}/`;
    assert.ok(isCanonical || !/^(https?:)?\/\//.test(url), `third-party resource: ${url}`);
  }
  assert.doesNotMatch(css, /url\(\s*['"]?(https?:)?\/\//, 'CSS loads nothing remote');
  assert.doesNotMatch(css, /@import\s+url\(\s*['"]?https?:/);
  const anchors = [...html.matchAll(/<a[^>]*href="([^"]+)"/g)].map(m => m[1]);
  for (const href of anchors.filter(h => /^https?:/.test(h))) {
    assert.ok(href.startsWith(REPO), `external link outside GitHub: ${href}`);
  }
});

test('Landing: install and GitHub links point to the repository', () => {
  assert.match(html, new RegExp(`href="${REPO}#for-the-technical-details"`));
  assert.match(html, new RegExp(`href="${REPO}"`));
});

test('Landing: structured data describes the app and the FAQ', () => {
  const blocks = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map(m => JSON.parse(m[1]));
  const types = blocks.flatMap(b => b['@graph'] || [b]).map(b => b['@type']);
  assert.ok(types.includes('SoftwareApplication'));
  const faq = blocks.flatMap(b => b['@graph'] || [b]).find(b => b['@type'] === 'FAQPage');
  assert.ok(faq && faq.mainEntity.length >= 4, 'FAQ has at least 4 questions');
  for (const q of faq.mainEntity) {
    assert.ok(visibleText.includes(q.name), `FAQ question is visible on the page: ${q.name}`);
  }
});

test('Landing: all copy is in the HTML, readable without JavaScript', () => {
  for (const text of ['Elige de dónde', 'Revisa quién falta', 'Guárdalos', 'Google Contacts', 'Celular', 'Excel', 'JSON', 'Preguntas frecuentes', 'No está afiliada a WhatsApp ni a Meta.']) {
    assert.ok(visibleText.includes(text), `missing copy: ${text}`);
  }
  assert.doesNotMatch(html, /style="[^"]*(opacity:\s*0|visibility:\s*hidden)/, 'no content hidden inline');
  assert.doesNotMatch(css, /visibility:\s*hidden/, 'no content hidden by CSS');
});

test('Landing: motion respects reduced-motion preferences', () => {
  const motion = fs.readFileSync(new URL('src/scripts/motion.js', root), 'utf8');
  assert.match(motion, /gsap\.matchMedia\(\)/);
  assert.match(motion, /prefers-reduced-motion: no-preference/);
  assert.match(motion, /ScrollTrigger/);
  assert.match(css, /:focus-visible/, 'visible focus styles');
});

test('Landing: copy uses neutral Spanish and makes no unverified claims', () => {
  assert.doesNotMatch(visibleText, /\b(vos|tenés|podés|elegí|abrí|importá|andá|hacé|guardalo|querés|sabés)\b/i);
  assert.doesNotMatch(visibleText, /\bgratis\b/i);
  assert.doesNotMatch(visibleText, /Chrome Web Store/i);
});

test('Landing: page weight stays under 600 KB', () => {
  const total = distFiles.filter(f => !f.endsWith('og.png')).reduce((sum, f) => sum + fs.statSync(f).size, 0);
  assert.ok(total < 600 * 1024, `dist weighs ${(total / 1024).toFixed(0)} KB`);
});

test('deploy: Netlify builds site/, runs the tests and publishes dist', () => {
  const toml = fs.readFileSync(new URL('../../netlify.toml', import.meta.url), 'utf8');
  assert.match(toml, /base\s*=\s*"site"/);
  assert.match(toml, /command\s*=\s*"npm test"/);
  assert.match(toml, /publish\s*=\s*"dist"/);
  assert.match(toml, /NODE_VERSION\s*=\s*"24"/);
});

test('deploy: strict security headers, since the page loads nothing from third parties', () => {
  const toml = fs.readFileSync(new URL('../../netlify.toml', import.meta.url), 'utf8');
  assert.match(toml, /Content-Security-Policy\s*=\s*"default-src 'self'/);
  assert.match(toml, /X-Content-Type-Options\s*=\s*"nosniff"/);
  assert.match(toml, /Referrer-Policy/);
});

test('deploy: served from the domain root, no GitHub Pages base path', () => {
  assert.doesNotMatch(html, /\/clc-agenda\/(_astro|og\.png|favicon)/);
});

// Performance guards (the hero jumped when the display font swapped in mid-intro)
const motionSrc = fs.readFileSync(new URL('src/scripts/motion.js', root), 'utf8');

test('perf: the two critical fonts are preloaded, with the same URLs the CSS uses', () => {
  const preloads = [...html.matchAll(/<link[^>]*rel="preload"[^>]*>/g)].map(m => m[0]).filter(l => /as="font"/.test(l));
  const hrefs = preloads.map(l => l.match(/href="([^"]+)"/)[1]);
  assert.ok(hrefs.some(h => /bricolage-grotesque-latin-800-normal.*\.woff2$/.test(h)), 'display font preloaded');
  assert.ok(hrefs.some(h => /inter-latin-wght-normal.*\.woff2$/.test(h)), 'body font preloaded');
  for (const l of preloads) assert.match(l, /crossorigin/, 'font preloads need crossorigin or they download twice');
  for (const h of hrefs) assert.ok(css.includes(h), `${h} is the same file the @font-face uses`);
});

test('perf: the hero intro starts once the fonts are ready, so the headline never re-wraps mid-animation', () => {
  assert.match(motionSrc, /document\.fonts\.ready/);
});

test('perf: motion only animates compositor-friendly properties', () => {
  const tweenBodies = [...motionSrc.matchAll(/\.(?:to|from|fromTo|set)\([^)]*?\{([^}]*)\}/g)].map(m => m[1]).join('\n');
  assert.doesNotMatch(tweenBodies, /\b(width|height|top|bottom|margin\w*|padding\w*|boxShadow|filter|backgroundPosition|borderRadius)\s*:/,
    'layout or paint properties force work on every frame');
});

test('perf: every infinite animation is paused while offscreen', () => {
  const infinite = motionSrc.split('\n').filter(l => /repeat:\s*-1/.test(l));
  assert.ok(infinite.length > 0);
  for (const line of infinite) assert.match(line, /onlyWhenVisible\(/, `not paused offscreen: ${line.trim()}`);
});

test('brand: the nav uses the Fuga mark, not the old four dots', () => {
  assert.match(html, /class="brand-mark"/);
  assert.doesNotMatch(html, /logo-dots/);
});
