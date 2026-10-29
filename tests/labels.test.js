import test from 'node:test';
import assert from 'node:assert/strict';
import { createFakeIndexedDB } from './helpers/fake-indexeddb.js';
import { exportToVCard } from '../src/exporters/vcard.js';
import { handleGetOverview, handleExtractLabel } from '../src/page/handlers.js';

const nLine = (vcf) => vcf.split('\r\n').find(l => l.startsWith('N:'));

test('vCard: N splits the name into family and given names', () => {
  assert.equal(nLine(exportToVCard([{ name: 'Ana Sofía Pérez', cleanPhone: '573001234567' }])), 'N:Pérez;Ana Sofía;;;');
});

test('vCard: a single-word name goes in the given name', () => {
  assert.equal(nLine(exportToVCard([{ name: 'Carla', cleanPhone: '573001234567' }])), 'N:;Carla;;;');
});

test('vCard: placeholder names stay whole in the given name', () => {
  assert.equal(nLine(exportToVCard([{ cleanPhone: '573001234567' }])), 'N:;WA +573001234567;;;');
  assert.equal(nLine(exportToVCard([{}])), 'N:;Contacto WhatsApp;;;');
});

test('vCard: N escapes separators inside each part', () => {
  assert.equal(nLine(exportToVCard([{ name: 'Ana;Bea Díaz, Jr', cleanPhone: '573001234567' }])), 'N:Jr;Ana\\;Bea Díaz\\,;;;');
});

const LABEL_DB = {
  'model-storage': {
    label: [{ id: '1', name: 'Nuevo cliente' }],
    contact: [
      { id: '573001111111@c.us', name: 'Ana' },
      { id: '573002222222@c.us', name: 'Bruno' }
    ],
    'label-association': [
      { labelId: '1', chatId: '573001111111@c.us' },
      { label_id: '1', chatId: '573002222222@c.us' },
      { labelId: '1', chatId: '573001111111@c.us' },
      { labelId: '1' },
      { labelId: '2', chatId: '573003333333@c.us' }
    ]
  }
};

function setup(t) {
  globalThis.window = {};
  globalThis.indexedDB = createFakeIndexedDB(LABEL_DB).api;
  t.after(() => { delete globalThis.window; delete globalThis.indexedDB; });
}

test('Labels: overview counts distinct contacts with the same rule as the extraction', async (t) => {
  setup(t);
  const overview = await handleGetOverview();
  const label = overview.labels.find(l => l.id === '1');
  const extracted = await handleExtractLabel('1');
  assert.equal(label.count, 2);
  assert.equal(label.count, extracted.total);
});
