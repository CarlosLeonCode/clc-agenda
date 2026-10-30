import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { LEADS_ENABLED } from '../src/data/site.js';

// `npm test` builds first, so dist/ reflects the current src/.
const root = new URL('../', import.meta.url);
const read = (path, base = root) => {
  const url = new URL(path, base);
  return fs.existsSync(url) ? fs.readFileSync(url, 'utf8') : '';
};

// Without the optional package (no NODE_AUTH_TOKEN) or with LEADS_DISABLED=1 the build has no card:
// privacy.test.mjs covers that build instead
const leadsTest = (name, fn) => test(name, { skip: !LEADS_ENABLED && 'leads are off in this build' }, fn);

const ORIGIN = 'https://xjftniraqohzpmxudqgx.supabase.co';
const ENDPOINT = `${ORIGIN}/functions/v1/leads`;
const CONSENT = {
  es: 'Acepto que CLC Agenda guarde mi correo para avisarme de versiones nuevas. Puedo darme de baja cuando quiera.',
  en: 'I agree that CLC Agenda stores my email to tell me about new versions. I can unsubscribe at any time.'
};
const PAGES = { es: 'dist/instalar/index.html', en: 'dist/en/install/index.html' };

const tagWith = (html, attr) => html.match(new RegExp(`<[a-z]+[^>]*\\b${attr}\\b[^>]*>`))?.[0] || '';
const textOf = (html, attr) => (html.match(new RegExp(`<[a-z]+[^>]*\\b${attr}\\b[^>]*>([\\s\\S]*?)</`))?.[1] || '').replace(/\s+/g, ' ').trim();

leadsTest('leads: the CSP lets the page reach only its own origin and the leads endpoint', () => {
  const toml = read('../netlify.toml');
  const csp = toml.match(/Content-Security-Policy = "([^"]+)"/)?.[1] || '';
  assert.match(csp, new RegExp(`connect-src 'self' ${ORIGIN.replace(/\./g, '\\.')};`));
  assert.match(csp, /script-src 'self';/, 'scripts still same-origin only');
});

leadsTest('leads: the project and endpoint live in one place', () => {
  const site = read('src/data/site.js');
  assert.match(site, /project: 'clc-agenda'/);
  assert.ok(site.includes(ENDPOINT), 'endpoint configured');
});

leadsTest('leads: the client uses the headless vanilla API, counts downloads and skips the details step', () => {
  const script = read('src/scripts/leads.js');
  assert.match(script, /from '@carlosleoncode\/lead-capture\/vanilla'/);
  assert.match(script, /triggerEvents: \['download', 'engaged'\]/);
  assert.match(script, /recordEvent\('download'\)/);
  assert.match(script, /\.skip\(\)/, 'name, role and country are never asked');
});

for (const [lang, path] of Object.entries(PAGES)) {
  leadsTest(`leads (${lang}): the card is in the page, hidden and non-modal until it is needed`, () => {
    const html = read(path);
    const card = tagWith(html, 'data-leads-card');
    assert.ok(card, 'card markup present');
    assert.match(card, /\bhidden\b/);
    assert.match(card, /role="dialog"/);
    assert.match(card, /aria-modal="false"/);
    assert.match(card, /aria-labelledby="leads-title"/);
    assert.match(html, /id="leads-title"/);
  });

  leadsTest(`leads (${lang}): email, unchecked required consent with the exact sentence, hidden honeypot`, () => {
    const html = read(path);
    const email = tagWith(html, 'data-leads-email');
    assert.match(email, /type="email"/);
    assert.match(email, /\brequired\b/);
    assert.match(email, /autocomplete="email"/);

    const consent = tagWith(html, 'data-leads-consent');
    assert.match(consent, /type="checkbox"/);
    assert.match(consent, /\brequired\b/);
    assert.doesNotMatch(consent, /\bchecked\b/, 'consent is never pre-checked');
    assert.equal(textOf(html, 'data-leads-consent-text'), CONSENT[lang]);

    const honeypot = tagWith(html, 'data-leads-honeypot');
    assert.match(honeypot, /tabindex="-1"/);
    assert.match(honeypot, /autocomplete="off"/);
    assert.match(html, /<div[^>]*class="leads-trap"[^>]*aria-hidden="true"/, 'honeypot wrapper is hidden from people');

    assert.match(html, /aria-live="polite"[^>]*data-leads-status|data-leads-status[^>]*aria-live="polite"/);
  });

  leadsTest(`leads (${lang}): the download records the value moment and a link opens the card on demand`, () => {
    const html = read(path);
    assert.match(tagWith(html, 'data-leads-event'), /class="btn download-btn"[^>]*data-leads-event="download"|data-leads-event="download"[^>]*class="btn download-btn"/);
    const open = tagWith(html, 'data-leads-open');
    assert.match(open, /^<button[^>]*type="button"/);
  });

  leadsTest(`leads (${lang}): copy stays honest and in the right register`, () => {
    const text = read(path).replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g, ' ').replace(/<[^>]+>/g, ' ');
    assert.doesNotMatch(text, /\b(vos|tenés|podés|elegí|abrí|querés|avisame|dejá)\b/i);
    assert.doesNotMatch(text, /\b(gratis|free)\b/i);
  });
}

// Home pages: the card can also appear on its own after real engagement
const HOMES = { es: 'dist/index.html', en: 'dist/en/index.html' };
const FOOTER_LABEL = { es: 'Recibir avisos de versiones nuevas', en: 'Get new-version emails' };
const ALL_PAGES = { ...PAGES, ...Object.fromEntries(Object.entries(HOMES).map(([l, p]) => [`home-${l}`, p])) };

for (const [lang, path] of Object.entries(HOMES)) {
  leadsTest(`leads home (${lang}): the card is on the page, hidden, floating, and the final CTA counts as engagement`, () => {
    const html = read(path);
    const card = tagWith(html, 'data-leads-card');
    assert.ok(card, 'card markup present on the home page');
    assert.match(card, /\bhidden\b/);
    assert.match(card, /data-leads-variant="floating"/);
    assert.match(card, /data-source="home"/);
    assert.match(tagWith(html, 'data-leads-engage'), /<section[^>]*class="final"/);
  });

  leadsTest(`leads home (${lang}): the page loads the shared leads script`, () => {
    const page = read(lang === 'es' ? 'src/pages/index.astro' : 'src/pages/en/index.astro');
    assert.match(page, /scripts\/leads\.js/);
  });
}

for (const [name, path] of Object.entries(ALL_PAGES)) {
  leadsTest(`leads (${name}): the footer has a manual control that opens the card`, () => {
    const html = read(path);
    const footer = html.match(/<footer[\s\S]*?<\/footer>/)?.[0] || '';
    const control = tagWith(footer, 'data-leads-open');
    assert.match(control, /^<button[^>]*type="button"/, 'footer control is a button');
    const lang = name.endsWith('en') ? 'en' : 'es';
    assert.ok(footer.includes(FOOTER_LABEL[lang]), `footer label in ${lang}`);
  });
}

leadsTest('leads: engagement on the home page counts 20 s of played video or reaching the final CTA, once per page load', () => {
  const script = read('src/scripts/leads.js');
  assert.match(script, /recordEvent\('engaged'\)/);
  assert.match(script, /'timeupdate'/);
  assert.match(script, /ENGAGED_VIDEO_SECONDS = 20\b/);
  assert.match(script, /seeking/, 'jumps in the video are not counted as watching');
  assert.match(script, /IntersectionObserver/);
  assert.match(script, /\[data-leads-engage\]/);
});

leadsTest('leads: the automatic prompt starts compact and only expands on a yes', () => {
  const expected = {
    es: { text: '¿Te avisamos cuando haya una versión nueva?', yes: 'Sí, avísame' },
    en: { text: 'Want an email when there is a new version?', yes: 'Yes, notify me' }
  };
  for (const [lang, file] of Object.entries(HOMES)) {
    const html = read(file);
    assert.equal(textOf(html, 'data-leads-compact-text'), expected[lang].text, `${lang} compact question`);
    assert.equal(textOf(html, 'data-leads-expand'), expected[lang].yes, `${lang} expand button`);
  }
  const script = read('src/scripts/leads.js');
  assert.match(script, /leads-card--compact/);
  assert.match(script, /trigger === 'auto'/);
  assert.match(script, /data-leads-expand/);
});
