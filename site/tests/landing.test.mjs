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
const AUTHOR_URL = 'https://www.carlosleoncode.com';

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

test('Landing: every image and video has a text alternative, width and height', () => {
  const media = [...(html.match(/<img[^>]*>/g) || []), ...(html.match(/<video[^>]*>/g) || [])];
  assert.ok(media.length >= 1, 'the product is shown');
  for (const el of media) {
    assert.match(el, /\s(alt|aria-label)="/, `text alternative missing: ${el}`);
    assert.match(el, /\swidth="\d+"/, `width missing: ${el}`);
    assert.match(el, /\sheight="\d+"/, `height missing: ${el}`);
  }
});

test('Landing: no third-party resources; external links only to GitHub and the author', () => {
  const resources = [...html.matchAll(/<(?:script|img|source|link|iframe|video)[^>]*(?:src|href|srcset)="([^"]+)"/g)].map(m => m[1]);
  for (const url of resources) {
    const isCanonical = url === `${SITE}/`;
    assert.ok(isCanonical || !/^(https?:)?\/\//.test(url), `third-party resource: ${url}`);
  }
  assert.doesNotMatch(css, /url\(\s*['"]?(https?:)?\/\//, 'CSS loads nothing remote');
  assert.doesNotMatch(css, /@import\s+url\(\s*['"]?https?:/);
  const anchors = [...html.matchAll(/<a[^>]*href="([^"]+)"/g)].map(m => m[1]);
  for (const href of anchors.filter(h => /^https?:/.test(h))) {
    assert.ok(href.startsWith(REPO) || href.startsWith(AUTHOR_URL), `unexpected external link: ${href}`);
  }
});

test('Landing: every install button opens the install guide; GitHub links the repository', () => {
  const installCtas = [...html.matchAll(/<a[^>]*href="([^"]*)"[^>]*>(?:(?!<\/a>)[\s\S])*Instalar(?:(?!<\/a>)[\s\S])*<\/a>/g)].map(m => m[1]);
  assert.ok(installCtas.length >= 3, 'nav, hero and final CTA');
  for (const href of installCtas) assert.equal(href, '/instalar');
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
  const total = distFiles.filter(f => !f.endsWith('og.png') && !/\/video\//.test(f)).reduce((sum, f) => sum + fs.statSync(f).size, 0);
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

test('hero video: muted inline loop with poster, started by JS only when allowed', () => {
  const video = html.match(/<video[^>]*>/)?.[0];
  assert.ok(video, 'the hero renders a <video>');
  for (const attr of ['muted', 'loop', 'playsinline', 'controls']) assert.match(video, new RegExp(`\\b${attr}\\b`), `video has ${attr}`);
  assert.doesNotMatch(video, /\bautoplay\b/, 'no autoplay attribute: JS decides, so reduced motion is respected');
  assert.match(video, /preload="metadata"/);
  assert.match(video, /poster="[^"]+"/);
  assert.match(video, /aria-label="[^"]{30,}"/, 'the silent video is described');
  assert.match(html, /<source[^>]*type="video\/webm"/);
  assert.match(html, /<source[^>]*type="video\/mp4"/);
});

test('hero video: a pause control exists for motion longer than 5 s', () => {
  assert.match(html, /<button[^>]*data-video-toggle[^>]*aria-pressed="false"[^>]*hidden/);
  const script = fs.readFileSync(new URL('src/scripts/hero-video.js', root), 'utf8');
  assert.match(script, /prefers-reduced-motion/);
  assert.match(script, /IntersectionObserver/);
  assert.match(script, /removeAttribute\('controls'\)/);
});

test('hero video: files are web-sized', () => {
  for (const ext of ['mp4', 'webm']) {
    const file = distFiles.find(f => f.endsWith(`clc-agenda.${ext}`));
    assert.ok(file, `dist has clc-agenda.${ext}`);
    assert.ok(fs.statSync(file).size < 2.5 * 1024 * 1024, `${ext} under 2.5 MB`);
  }
});

test('hero video: icons swap through the hidden attribute (SVG elements have no .hidden property)', () => {
  const script = fs.readFileSync(new URL('src/scripts/hero-video.js', root), 'utf8');
  assert.match(script, /pauseIcon\.toggleAttribute\('hidden'/);
  assert.match(script, /playIcon\.toggleAttribute\('hidden'/);
  assert.doesNotMatch(script, /Icon\.hidden\s*=/);
});

test('hero: credits carlosleoncode with a link to his site', () => {
  const hero = html.match(/<section class="hero"[\s\S]*?<\/section>/)?.[0] || '';
  assert.match(hero, new RegExp(`<a[^>]*href="${AUTHOR_URL}/?"[^>]*>[\\s\\S]*?carlosleoncode[\\s\\S]*?</a>`), 'the whole credit pill links the author');
  assert.match(hero, /Creado por/);
});

test('structured data: the app names carlosleoncode as its author', () => {
  const blocks = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map(m => JSON.parse(m[1]));
  const app = blocks.flatMap(b => b['@graph'] || [b]).find(n => n['@type'] === 'SoftwareApplication');
  assert.deepEqual(app.author, { '@type': 'Person', name: 'carlosleoncode', url: `${AUTHOR_URL}/` });
});
