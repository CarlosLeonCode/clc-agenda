import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { PRIVACY, privacyPlaceholders, assertPrivacyReady } from '../src/data/privacy.js';
import { LEAD_CAPTURE, isLeadCaptureInstalled, leadsEnabled } from '../src/lib/lead-capture.js';
import { createLeadCapture as fallbackCapture } from '../src/lib/lead-capture-fallback.js';
import { LEADS, LEADS_ENABLED } from '../src/data/site.js';

// `npm test` builds first, so dist/ reflects the current src/ and environment.
const root = new URL('../', import.meta.url);
const dist = new URL('dist/', root);
const read = (p, base = dist) => {
  const url = new URL(p, base);
  return fs.existsSync(url) ? fs.readFileSync(url, 'utf8') : '';
};
const SITE = (process.env.URL || 'http://localhost:4321').replace(/\/$/, '');
const skip = !LEADS_ENABLED && 'leads are off in this build';

const POLICY = {
  es: { file: 'privacidad/index.html', path: '/privacidad' },
  en: { file: 'en/privacy/index.html', path: '/en/privacy' }
};
const SECTIONS = {
  es: ['Responsable', 'Qué datos recogemos', 'Para qué los usamos', 'Base legal', 'Encargados del tratamiento', 'Cuánto tiempo los conservamos', 'Tus derechos', 'Cómo darte de baja', 'Menores de edad', 'Cambios'],
  en: ['Controller', 'What data we collect', 'What we use it for', 'Legal basis', 'Processors', 'How long we keep it', 'Your rights', 'How to unsubscribe', 'Minors', 'Changes']
};
const LINK_TEXT = {
  footer: { es: 'Privacidad', en: 'Privacy' },
  card: { es: 'Más detalles en la política de privacidad', en: 'Details in the privacy policy' }
};
const CARD_PAGES = { es: ['index.html', 'instalar/index.html'], en: ['en/index.html', 'en/install/index.html'] };

const joined = (fragment) => fragment.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
const visible = (h) => joined(h.replace(/<head>[\s\S]*?<\/head>/, ' ').replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>|<svg[\s\S]*?<\/svg>/g, ' ').replace(/</g, ' <'));
const headings = (h, level) => [...h.matchAll(new RegExp(`<h${level}[^>]*>([\\s\\S]*?)</h${level}>`, 'g'))].map(m => joined(m[1]));
const alternates = (h) => Object.fromEntries([...h.matchAll(/<link rel="alternate" hreflang="([^"]+)" href="([^"]+)"/g)].map(m => [m[1], m[2]]));
const graph = (h) => [...h.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)]
  .map(m => JSON.parse(m[1])).flatMap(b => b['@graph'] || [b]);
const footerOf = (h) => h.match(/<footer[\s\S]*?<\/footer>/)?.[0] || '';
const linkTo = (h, href) => h.match(new RegExp(`<a[^>]*href="${href}"[^>]*>([\\s\\S]*?)</a>`))?.[1];

// --- Config and guard -------------------------------------------------------

test('privacy config: the controller is filled in and the remaining placeholders are named', () => {
  assert.equal(PRIVACY.controller, 'Carlos Esteban León');
  assert.equal(PRIVACY.location, 'Colombia');
  assert.equal(PRIVACY.contactEmail, 'carlosleoncode@gmail.com');
  assert.equal(PRIVACY.usesBrevo, false);
  assert.ok('lastUpdated' in PRIVACY && 'supabaseRegion' in PRIVACY);
  for (const key of privacyPlaceholders()) assert.match(key, /^PRIVACY\.\w+(\.\w+)*$/);
});

test('privacy config: placeholders are every string that starts with TODO, nested ones included', () => {
  const sample = { a: 'TODO: region', b: { c: 'TODO' }, d: 'filled', e: 3, f: null };
  assert.deepEqual(privacyPlaceholders(sample), ['PRIVACY.a', 'PRIVACY.b.c']);
  assert.deepEqual(privacyPlaceholders({ a: 'ok' }), []);
});

test('privacy guard: fails a production or strict build with leads on while placeholders remain', () => {
  const draft = { ...PRIVACY, lastUpdated: 'TODO: YYYY-MM-DD', supabaseRegion: 'TODO: region' };
  const ready = { ...PRIVACY, lastUpdated: '2026-10-30', supabaseRegion: 'us-east-1' };

  for (const env of [{ CONTEXT: 'production' }, { PRIVACY_STRICT: '1' }]) {
    assert.throws(
      () => assertPrivacyReady({ leadsEnabled: true, env, privacy: draft }),
      (error) => /PRIVACY\.supabaseRegion/.test(error.message) && /PRIVACY\.lastUpdated/.test(error.message) && /src\/data\/privacy\.js/.test(error.message),
      `throws for ${JSON.stringify(env)}`
    );
    assert.doesNotThrow(() => assertPrivacyReady({ leadsEnabled: false, env, privacy: draft }), 'leads off: nothing is collected');
    assert.doesNotThrow(() => assertPrivacyReady({ leadsEnabled: true, env, privacy: ready }), 'filled in');
  }
  for (const env of [{}, { CONTEXT: 'deploy-preview' }, { CONTEXT: 'branch-deploy' }, { PRIVACY_STRICT: '0' }]) {
    assert.doesNotThrow(() => assertPrivacyReady({ leadsEnabled: true, env, privacy: draft }), `drafts are fine for ${JSON.stringify(env)}`);
  }
});

// --- Optional package -------------------------------------------------------

test('lead-capture: the resolver looks for the installed package under the given root', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'clc-leads-'));
  const base = pathToFileURL(`${dir}/`);
  try {
    assert.equal(isLeadCaptureInstalled(base), false);
    const pkg = path.join(dir, 'node_modules', ...LEAD_CAPTURE.split('/'));
    fs.mkdirSync(pkg, { recursive: true });
    fs.writeFileSync(path.join(pkg, 'package.json'), '{}');
    assert.equal(isLeadCaptureInstalled(base), true);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('lead-capture: leads are on only with an endpoint, the package installed and no LEADS_DISABLED', () => {
  const endpoint = LEADS.endpoint;
  assert.equal(leadsEnabled({ endpoint, installed: true, env: {} }), true);
  assert.equal(leadsEnabled({ endpoint, installed: false, env: {} }), false);
  assert.equal(leadsEnabled({ endpoint: '  ', installed: true, env: {} }), false);
  assert.equal(leadsEnabled({ endpoint, installed: true, env: { LEADS_DISABLED: '1' } }), false);
  assert.equal(leadsEnabled({ endpoint, installed: true, env: { LEADS_DISABLED: '0' } }), true);
});

test('lead-capture fallback: an inert controller that never shows, sends or notifies', async () => {
  const controller = fallbackCapture({ project: 'clc-agenda', endpoint: LEADS.endpoint });
  let notified = 0;
  const unsubscribe = controller.subscribe(() => { notified += 1; });
  assert.equal(typeof unsubscribe, 'function');
  controller.start();
  controller.recordEvent('download');
  controller.open();
  controller.dismiss();
  controller.skip();
  controller.stop();
  const result = await controller.submitEmail({ email: 'a@b.co', consent: true, consentText: 'x' });
  assert.equal(result.ok, false);
  const snapshot = controller.getSnapshot();
  assert.equal(snapshot.visible, false);
  assert.deepEqual(snapshot.errors, {});
  assert.equal(notified, 0);
  unsubscribe();
});

test('lead-capture fallback: has every method the real controller has', { skip: !isLeadCaptureInstalled(root) && 'package not installed' }, async () => {
  const { createLeadCapture } = await import(`${LEAD_CAPTURE}/vanilla`);
  const real = createLeadCapture({ project: 'clc-agenda', endpoint: LEADS.endpoint, storage: null });
  const fake = fallbackCapture({ project: 'clc-agenda', endpoint: LEADS.endpoint });
  for (const [name, value] of Object.entries(real)) {
    if (typeof value === 'function') assert.equal(typeof fake[name], 'function', `fallback.${name}`);
  }
  assert.deepEqual(Object.keys(fake.getSnapshot()).sort(), Object.keys(real.getSnapshot()).sort());
});

test('lead-capture: the build aliases the package to the fallback only when leads are off', () => {
  const config = read('astro.config.mjs', root);
  assert.match(config, /lead-capture-fallback\.js/);
  assert.match(config, /assertPrivacyReady\(/);
  const pkg = JSON.parse(read('package.json', root));
  assert.ok(pkg.optionalDependencies?.[LEAD_CAPTURE], 'optional dependency');
  assert.ok(!pkg.dependencies?.[LEAD_CAPTURE], 'not a required dependency');
  const lock = JSON.parse(read('package-lock.json', root));
  assert.ok(lock.packages[''].optionalDependencies?.[LEAD_CAPTURE], 'lockfile root lists it as optional');
  assert.equal(lock.packages[`node_modules/${LEAD_CAPTURE}`].optional, true, 'lockfile marks it optional');
});

// --- Pages (leads on) -------------------------------------------------------

for (const [lang, { file, path: route }] of Object.entries(POLICY)) {
  test(`privacy (${lang}): the page has every section of the policy`, { skip }, () => {
    const html = read(file);
    assert.ok(html, `${file} built`);
    assert.match(html, new RegExp(`<html lang="${lang}"`));
    assert.equal(headings(html, 1).length, 1);
    assert.deepEqual(headings(html, 2), SECTIONS[lang]);
  });

  test(`privacy (${lang}): it names the controller, the processors and the legal frame`, { skip }, () => {
    const html = read(file);
    const text = visible(html);
    for (const fact of [PRIVACY.controller, PRIVACY.location, 'Supabase', 'Ley 1581', '1377', 'Superintendencia de Industria y Comercio', String(PRIVACY.retentionDaysAfterUnsubscribe), String(PRIVACY.inactiveListMonths), String(PRIVACY.minimumAge)]) {
      assert.ok(text.includes(fact) || (lang === 'en' && fact === 'Ley 1581' && text.includes('Law 1581')), `${lang} mentions ${fact}`);
    }
    assert.ok(text.includes(lang === 'es' ? 'RGPD' : 'GDPR'));
    assert.ok(text.includes(PRIVACY.supabaseRegion), 'Supabase region');
    assert.ok(linkTo(html, `mailto:${PRIVACY.contactEmail}`), 'contact email is a mailto link');
    assert.equal(text.includes('Brevo'), PRIVACY.usesBrevo, 'Brevo only when it is used');
    assert.ok(html.includes(PRIVACY.lastUpdated), 'last updated date');
  });

  test(`privacy (${lang}): it lists only what the card collects and says the extension sends nothing`, { skip }, () => {
    const text = visible(read(file));
    const expected = lang === 'es'
      ? ['correo electrónico', 'frase exacta', 'fecha y hora', 'página desde la que te suscribiste', 'idioma de tu navegador', 'tipo de navegador', 'No te pedimos nombre, profesión ni país', 'dirección IP', 'La extensión CLC Agenda no envía nada']
      : ['email address', 'exact sentence', 'date and time', 'page you subscribed from', 'browser language', 'browser type', 'We do not ask for your name, occupation or country', 'IP address', 'The CLC Agenda extension sends nothing'];
    for (const phrase of expected) assert.ok(text.includes(phrase), `${lang}: "${phrase}"`);
    assert.doesNotMatch(text, /\b(vos|tenés|podés|elegí|abrí|querés|dejá|escribinos)\b/i, 'no voseo');
  });

  test(`privacy (${lang}): canonical, reciprocal hreflang and a language switch to its twin`, { skip }, () => {
    const html = read(file);
    assert.match(html, new RegExp(`<link rel="canonical" href="${SITE}${route}"`));
    assert.deepEqual(alternates(html), { es: `${SITE}/privacidad`, en: `${SITE}/en/privacy`, 'x-default': `${SITE}/en/privacy` });
    const other = lang === 'es' ? 'en' : 'es';
    assert.match(html, new RegExp(`<a[^>]*href="${POLICY[other].path}"[^>]*hreflang="${other}"`));
    assert.match(html, new RegExp(`<a[^>]*hreflang="${lang}"[^>]*aria-current="true"`));
  });

  test(`privacy (${lang}): JSON-LD is just the site and this page, in its language`, { skip }, () => {
    const nodes = graph(read(file));
    assert.deepEqual(nodes.map(n => n['@type']).sort(), ['WebPage', 'WebSite']);
    const page = nodes.find(n => n['@type'] === 'WebPage');
    assert.equal(page.inLanguage, lang);
    assert.equal(page.url, `${SITE}${route}`);
  });
}

test('privacy: the sitemap lists both policies with their alternates', { skip }, () => {
  const sitemap = read('sitemap.xml');
  for (const { path: route } of Object.values(POLICY)) {
    assert.match(sitemap, new RegExp(`<loc>${SITE}${route}</loc>`));
  }
  assert.ok(sitemap.includes(`<xhtml:link rel="alternate" hreflang="x-default" href="${SITE}/en/privacy"/>`));
});

test('privacy: every page links the policy in its language from the footer', { skip }, () => {
  const pages = { es: ['index.html', 'instalar/index.html', POLICY.es.file, '404.html'], en: ['en/index.html', 'en/install/index.html', POLICY.en.file] };
  for (const [lang, files] of Object.entries(pages)) {
    for (const file of files) {
      assert.equal(joined(linkTo(footerOf(read(file)), POLICY[lang].path) ?? ''), LINK_TEXT.footer[lang], `${file} footer`);
    }
  }
});

test('privacy: the card\'s privacy note links the policy', { skip }, () => {
  for (const [lang, files] of Object.entries(CARD_PAGES)) {
    for (const file of files) {
      const note = read(file).match(/<p class="leads-privacy"[^>]*>([\s\S]*?)<\/p>/)?.[1] || '';
      assert.equal(joined(linkTo(note, POLICY[lang].path) ?? ''), LINK_TEXT.card[lang], `${file} card note`);
    }
  }
});

// --- Builds with other environments -------------------------------------------

const astro = fileURLToPath(new URL('node_modules/astro/bin/astro.mjs', root));
const build = (env, outDir) => spawnSync(process.execPath, [astro, 'build', '--outDir', outDir], {
  cwd: fileURLToPath(root),
  env: { ...process.env, ...env },
  encoding: 'utf8',
  timeout: 240_000
});
const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true })
  .flatMap(e => (e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)]));

test('leads off: the site builds with the fallback and renders nothing lead-related', { timeout: 300_000 }, () => {
  const out = fs.mkdtempSync(path.join(os.tmpdir(), 'clc-site-off-'));
  try {
    const result = build({ LEADS_DISABLED: '1' }, out);
    assert.equal(result.status, 0, result.stderr || result.stdout);
    assert.match(result.stdout + result.stderr, /new-version emails are off/i, 'the build says why');

    const files = walk(out);
    const html = files.filter(f => f.endsWith('.html'));
    for (const page of ['index.html', 'instalar/index.html', 'en/index.html', 'en/install/index.html', '404.html']) {
      assert.ok(fs.existsSync(path.join(out, page)), `${page} still builds`);
    }
    assert.ok(!fs.existsSync(path.join(out, POLICY.es.file)), 'no /privacidad');
    assert.ok(!fs.existsSync(path.join(out, POLICY.en.file)), 'no /en/privacy');
    for (const file of html) {
      const content = fs.readFileSync(file, 'utf8');
      assert.doesNotMatch(content, /data-leads-(card|open)\b/, `${path.relative(out, file)} has no card or open control`);
      assert.doesNotMatch(content, /href="\/(en\/privacy|privacidad)"/, `${path.relative(out, file)} has no policy link`);
    }
    const sitemap = fs.readFileSync(path.join(out, 'sitemap.xml'), 'utf8');
    assert.doesNotMatch(sitemap, /privacy|privacidad/);
    const js = files.filter(f => f.endsWith('.js')).map(f => fs.readFileSync(f, 'utf8')).join('\n');
    assert.ok(!js.includes('clc-leads:probe'), 'the real package is not bundled');
  } finally {
    fs.rmSync(out, { recursive: true, force: true });
  }
});

test('privacy guard: a strict build with leads on stops and lists the placeholders', {
  timeout: 300_000,
  skip: (!LEADS_ENABLED && 'leads are off in this build') || (privacyPlaceholders().length === 0 && 'no placeholders left')
}, () => {
  const out = fs.mkdtempSync(path.join(os.tmpdir(), 'clc-site-strict-'));
  try {
    const result = build({ PRIVACY_STRICT: '1' }, out);
    assert.notEqual(result.status, 0, 'build fails');
    const log = result.stdout + result.stderr;
    for (const key of privacyPlaceholders()) assert.ok(log.includes(key), `log names ${key}`);
  } finally {
    fs.rmSync(out, { recursive: true, force: true });
  }
});
