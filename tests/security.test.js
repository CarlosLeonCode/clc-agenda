import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { exportToGoogleContactsCSV } from '../src/exporters/google-contacts.js';
import { initWebpackStore, store } from '../src/page/webpack-store.js';

const root = new URL('../', import.meta.url);

test('Security: manifest requests no permissions beyond the WhatsApp host', () => {
  const manifest = JSON.parse(fs.readFileSync(new URL('manifest.json', root), 'utf8'));
  assert.deepEqual(manifest.permissions || [], []);
  assert.deepEqual(manifest.host_permissions, ['https://web.whatsapp.com/*']);
});

test('Security: Google Contacts CSV neutralizes spreadsheet formulas but keeps phone numbers', () => {
  const csv = exportToGoogleContactsCSV([
    { name: '=HYPERLINK("http://x.test") Ana', cleanPhone: '573001234567', sourceName: '@SUM(A1)', isBusiness: false }
  ]);
  const row = csv.replace('﻿', '').split('\r\n')[1];
  assert.match(row, /^"'=HYPERLINK\(""http:\/\/x\.test""\)",/, 'first name starts with an apostrophe');
  assert.ok(row.includes(",'@SUM(A1)"), 'label is neutralized');
  assert.ok(row.includes('Extraído de: @SUM(A1)'), 'note does not start with a formula character');
  assert.ok(row.includes(',Mobile,+573001234567,'), 'phone keeps its leading plus');
});

test('Security: the webpack hook keeps WhatsApp internals out of window globals', (t) => {
  const modules = {
    Contact: { _models: [], get() {} },
    Chat: { _models: [], get() {} },
    GroupMetadata: { _models: [], get() {}, find() {} }
  };
  const req = () => modules;
  req.m = { 1: {} };
  globalThis.window = { webpackChunkwhatsapp_web_client: { push: ([, , run]) => run(req) } };
  t.after(() => { delete globalThis.window; });

  initWebpackStore();

  assert.equal(globalThis.window.Store, undefined);
  assert.equal(globalThis.window.__wae_require__, undefined);
  assert.equal(store.Contact, modules.Contact);
  assert.equal(store.GroupMetadata, modules.GroupMetadata);
});

test('Security: the bundled engine never writes to window.Store or exposes webpack require', () => {
  const code = fs.readFileSync(new URL('dist/inject.js', root), 'utf8');
  assert.doesNotMatch(code, /window\.Store/);
  assert.doesNotMatch(code, /__wae_require__/);
});
