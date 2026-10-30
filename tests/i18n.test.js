import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { MESSAGES, detectLang, translator } from '../src/ui/i18n.js';
import { memberCountLabel, friendlyError } from '../src/ui/view-state.js';

const root = new URL('../', import.meta.url);
const read = file => fs.readFileSync(new URL(file, root), 'utf8');

test('i18n: Spanish and English dictionaries have the same keys, none empty', () => {
  const es = Object.keys(MESSAGES.es).sort();
  const en = Object.keys(MESSAGES.en).sort();
  assert.deepEqual(en, es);
  for (const lang of ['es', 'en']) {
    for (const [key, value] of Object.entries(MESSAGES[lang])) {
      const ok = typeof value === 'function' || (typeof value === 'string' && value.trim().length > 0);
      assert.ok(ok, `${lang}.${key} is empty`);
    }
  }
});

test('i18n: language follows the browser, Spanish for es-*, English otherwise', () => {
  assert.equal(detectLang({ chrome: { i18n: { getUILanguage: () => 'es-419' } } }), 'es');
  assert.equal(detectLang({ chrome: { i18n: { getUILanguage: () => 'en-US' } } }), 'en');
  assert.equal(detectLang({ navigator: { language: 'es-CO' } }), 'es');
  assert.equal(detectLang({ navigator: { language: 'pt-BR' } }), 'en');
  assert.equal(detectLang({}), 'en');
});

test('i18n: interpolation and counts', () => {
  const es = translator('es');
  const en = translator('en');
  assert.equal(es('selectedCount', { count: 3 }), '3 seleccionados');
  assert.equal(en('selectedCount', { count: 3 }), '3 selected');
  assert.equal(en('members', { count: 1 }), '1 member');
  assert.equal(en('members', { count: 640 }), '640 members');
  assert.equal(en('members', { count: 0 }), 'Not loaded');
});

test('i18n: view-state helpers keep Spanish by default and speak English on request', () => {
  assert.equal(memberCountLabel(640), '640 miembros');
  assert.equal(memberCountLabel(640, 'en'), '640 members');
  const loaded = { code: 'GROUP_NOT_LOADED' };
  assert.equal(friendlyError(loaded), 'Este grupo todavía no cargó sus miembros. Abre el grupo en WhatsApp y vuelve a intentarlo.');
  assert.match(friendlyError(loaded, 'en'), /hasn't loaded its members yet/);
  assert.match(friendlyError({ code: 'TIMEOUT' }, 'en'), /took too long/);
  assert.match(friendlyError({ code: 'NO_ACTIVE_GROUP' }, 'en'), /Open a group/);
  assert.match(friendlyError('', 'en'), /Couldn't read WhatsApp Web/);
});

test('i18n: overlay and popup carry no hard-coded Spanish copy', () => {
  const SPANISH = /\b(Buscar|Contactos|contactos|Cerrar|Volver|seleccionados|Listo|Copiar|Mover|Archivad[oa]s?|Reintentar|Columnas|Mostrar|Solo|Todos|grupo|Grupos|Etiquetas|Miembro|Desconocido|Celular|Detectando|Cargando|Abrir|estás)\b|[áéíóúñ¿¡]/;
  for (const file of ['src/ui/overlay.js', 'popup/popup.js', 'popup/popup.html']) {
    const code = read(file)
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/^\s*\/\/.*$/gm, '')
      .replace(/<!--[\s\S]*?-->/g, '');
    const literals = [...code.matchAll(/(['"`])((?:\\.|(?!\1)[^\\])*)\1|>([^<>]+)</g)]
      .map(m => m[2] ?? m[3] ?? '')
      .filter(s => SPANISH.test(s));
    assert.deepEqual(literals, [], `${file} still has Spanish copy`);
  }
});

test('i18n: manifest and popup are localized through _locales', () => {
  const manifest = JSON.parse(read('manifest.json'));
  assert.equal(manifest.default_locale, 'en');
  assert.equal(manifest.name, '__MSG_appName__');
  assert.equal(manifest.description, '__MSG_appDescription__');
  assert.equal(manifest.action.default_title, '__MSG_actionTitle__');
  const locales = Object.fromEntries(['en', 'es'].map(l => [l, JSON.parse(read(`_locales/${l}/messages.json`))]));
  assert.deepEqual(Object.keys(locales.en).sort(), Object.keys(locales.es).sort());
  const popupKeys = [...read('popup/popup.html').matchAll(/data-i18n="([^"]+)"/g), ...read('popup/popup.js').matchAll(/msg\('([^']+)'\)/g)].map(m => m[1]);
  for (const key of ['appName', 'appDescription', 'actionTitle', ...popupKeys]) {
    for (const lang of ['en', 'es']) assert.ok(locales[lang][key]?.message, `_locales/${lang} misses ${key}`);
  }
  assert.ok(locales.en.appDescription.message.length <= 132, 'Chrome caps descriptions at 132 characters');
  assert.ok(locales.es.appDescription.message.length <= 132);
});
