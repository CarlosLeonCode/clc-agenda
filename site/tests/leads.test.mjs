import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

// `npm test` builds first, so dist/ reflects the current src/.
const root = new URL('../', import.meta.url);
const read = (path, base = root) => {
  const url = new URL(path, base);
  return fs.existsSync(url) ? fs.readFileSync(url, 'utf8') : '';
};

const ORIGIN = 'https://xjftniraqohzpmxudqgx.supabase.co';
const ENDPOINT = `${ORIGIN}/functions/v1/leads`;
const CONSENT = {
  es: 'Acepto que CLC Agenda guarde mi correo para avisarme de versiones nuevas. Puedo darme de baja cuando quiera.',
  en: 'I agree that CLC Agenda stores my email to tell me about new versions. I can unsubscribe at any time.'
};
const PAGES = { es: 'dist/instalar/index.html', en: 'dist/en/install/index.html' };

const tagWith = (html, attr) => html.match(new RegExp(`<[a-z]+[^>]*\\b${attr}\\b[^>]*>`))?.[0] || '';
const textOf = (html, attr) => (html.match(new RegExp(`<[a-z]+[^>]*\\b${attr}\\b[^>]*>([\\s\\S]*?)</`))?.[1] || '').replace(/\s+/g, ' ').trim();

test('leads: the CSP lets the page reach only its own origin and the leads endpoint', () => {
  const toml = read('../netlify.toml');
  const csp = toml.match(/Content-Security-Policy = "([^"]+)"/)?.[1] || '';
  assert.match(csp, new RegExp(`connect-src 'self' ${ORIGIN.replace(/\./g, '\\.')};`));
  assert.match(csp, /script-src 'self';/, 'scripts still same-origin only');
});

test('leads: the project and endpoint live in one place', () => {
  const site = read('src/data/site.js');
  assert.match(site, /project: 'clc-agenda'/);
  assert.ok(site.includes(ENDPOINT), 'endpoint configured');
});

test('leads: the client uses the headless vanilla API, counts downloads and skips the details step', () => {
  const script = read('src/scripts/leads.js');
  assert.match(script, /from '@carlosleoncode\/lead-capture\/vanilla'/);
  assert.match(script, /triggerEvents: \['download'\]/);
  assert.match(script, /recordEvent\('download'\)/);
  assert.match(script, /\.skip\(\)/, 'name, role and country are never asked');
});

for (const [lang, path] of Object.entries(PAGES)) {
  test(`leads (${lang}): the card is in the page, hidden and non-modal until it is needed`, () => {
    const html = read(path);
    const card = tagWith(html, 'data-leads-card');
    assert.ok(card, 'card markup present');
    assert.match(card, /\bhidden\b/);
    assert.match(card, /role="dialog"/);
    assert.match(card, /aria-modal="false"/);
    assert.match(card, /aria-labelledby="leads-title"/);
    assert.match(html, /id="leads-title"/);
  });

  test(`leads (${lang}): email, unchecked required consent with the exact sentence, hidden honeypot`, () => {
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

  test(`leads (${lang}): the download records the value moment and a link opens the card on demand`, () => {
    const html = read(path);
    assert.match(tagWith(html, 'data-leads-event'), /class="btn download-btn"[^>]*data-leads-event="download"|data-leads-event="download"[^>]*class="btn download-btn"/);
    const open = tagWith(html, 'data-leads-open');
    assert.match(open, /^<button[^>]*type="button"/);
  });

  test(`leads (${lang}): copy stays honest and in the right register`, () => {
    const text = read(path).replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g, ' ').replace(/<[^>]+>/g, ' ');
    assert.doesNotMatch(text, /\b(vos|tenés|podés|elegí|abrí|querés|avisame|dejá)\b/i);
    assert.doesNotMatch(text, /\b(gratis|free)\b/i);
  });
}
