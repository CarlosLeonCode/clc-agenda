import test from 'node:test';
import assert from 'node:assert/strict';
import { createFakeIndexedDB } from './helpers/fake-indexeddb.js';
import { store } from '../src/page/webpack-store.js';
import { handleExtractGroup } from '../src/page/handlers.js';

const GROUP_ID = 'g1@g.us';

function setup(t, { messages = [], participants = null } = {}) {
  const fake = createFakeIndexedDB({ 'model-storage': { message: messages } });
  const openChatAt = t.mock.fn();
  globalThis.window = {};
  globalThis.indexedDB = fake.api;
  globalThis.document = { querySelector: () => null };

  const liveChat = { id: GROUP_ID, name: 'Ventas', groupMetadata: null };
  store.Chat = { _models: [], get: (id) => (id === GROUP_ID ? liveChat : undefined) };
  store.Cmd = { openChatAt };
  if (participants) {
    const meta = { id: GROUP_ID, subject: 'Ventas', participants };
    store.GroupMetadata = { _models: [], get: () => meta, find: async () => meta };
  }

  t.after(() => {
    for (const key of Object.keys(store)) delete store[key];
    delete globalThis.window;
    delete globalThis.indexedDB;
    delete globalThis.document;
  });
  return { fake, openChatAt };
}

test('Extract group: never opens the chat when participants are missing', async (t) => {
  const { openChatAt } = setup(t, { messages: [{ to: GROUP_ID, author: '573001111111@c.us' }] });
  await handleExtractGroup(GROUP_ID);
  assert.equal(openChatAt.mock.callCount(), 0);
});

test('Extract group: falls back to message authors of that group', async (t) => {
  setup(t, {
    messages: [
      { to: GROUP_ID, author: '573001111111@c.us' },
      { to: 'other@g.us', author: '573009999999@c.us' }
    ]
  });
  const res = await handleExtractGroup(GROUP_ID);
  assert.deepEqual(res.contacts.map(c => c.cleanPhone), ['573001111111']);
});

test('Extract group: errors with guidance when nothing is loaded', async (t) => {
  const { openChatAt } = setup(t);
  await assert.rejects(handleExtractGroup(GROUP_ID), /abre el chat del grupo/i);
  assert.equal(openChatAt.mock.callCount(), 0);
});

test('Extract group: does not read messages when participants are already loaded', async (t) => {
  const { fake } = setup(t, {
    messages: [{ to: GROUP_ID, author: '573001111111@c.us' }],
    participants: [{ id: '573007777777@c.us' }]
  });
  const res = await handleExtractGroup(GROUP_ID);
  assert.deepEqual(res.contacts.map(c => c.cleanPhone), ['573007777777']);
  assert.deepEqual(fake.reads.filter(r => r.store === 'message'), []);
});
