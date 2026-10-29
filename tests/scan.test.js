import test from 'node:test';
import assert from 'node:assert/strict';
import { createFakeIndexedDB } from './helpers/fake-indexeddb.js';
import { scanAllIndexedDB } from '../src/page/scan.js';

function setup(t, databases) {
  const fake = createFakeIndexedDB(databases);
  globalThis.window = {};
  globalThis.indexedDB = fake.api;
  t.after(() => { delete globalThis.window; delete globalThis.indexedDB; });
  return fake;
}

const DATABASES = {
  'model-storage': {
    contact: [{ id: '573001234567@c.us', name: 'Ana Pérez' }],
    message: [
      { to: 'g1@g.us', author: '573001111111@c.us' },
      { to: 'g1@g.us', author: '573002222222@c.us' },
      { to: 'g2@g.us', author: '573003333333@c.us' },
      { to: '573004444444@c.us', author: '573005555555@c.us' }
    ]
  },
  wawc: { messages: [{ to: { _serialized: 'g1@g.us' }, participant: { _serialized: '573006666666@c.us' } }] }
};

test('Scan: never reads the message stores', async (t) => {
  const fake = setup(t, DATABASES);
  const data = await scanAllIndexedDB(true);
  assert.ok(data.contactsByPhone.has('573001234567'), 'contacts are still indexed');
  assert.deepEqual(fake.reads.filter(r => r.store === 'message' || r.store === 'messages'), []);
  assert.equal('groupMessages' in data, false);
});

test('Scan: reports progress after each database', async (t) => {
  setup(t, DATABASES);
  let calls = 0;
  await scanAllIndexedDB(true, () => { calls++; });
  assert.equal(calls, 2);
});

test('Scan: collectGroupAuthors walks messages with a cursor and keeps only that group', async (t) => {
  const fake = setup(t, DATABASES);
  const { collectGroupAuthors } = await import('../src/page/scan.js');
  assert.equal(typeof collectGroupAuthors, 'function');

  const authors = await collectGroupAuthors('g1@g.us');
  assert.deepEqual([...authors].sort(), ['573001111111@c.us', '573002222222@c.us', '573006666666@c.us']);
  const messageReads = fake.reads.filter(r => r.store === 'message' || r.store === 'messages');
  assert.ok(messageReads.length > 0);
  assert.ok(messageReads.every(r => r.method === 'openCursor'), 'no getAll on message stores');
});

test('Scan: collectGroupAuthors keeps reporting progress inside a large message store', async (t) => {
  const message = Array.from({ length: 12000 }, (_, i) => ({ to: 'g1@g.us', author: `57300${String(i % 50).padStart(7, '0')}@c.us` }));
  setup(t, { 'model-storage': { message } });
  const { collectGroupAuthors } = await import('../src/page/scan.js');
  let calls = 0;
  const authors = await collectGroupAuthors('g1@g.us', () => { calls++; });
  assert.equal(authors.size, 50);
  // One per 5000 messages walked (2) plus one after the database
  assert.ok(calls >= 3, `expected at least 3 progress calls, got ${calls}`);
});
