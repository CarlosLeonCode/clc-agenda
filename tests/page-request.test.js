import test from 'node:test';
import assert from 'node:assert/strict';
import { sendPageRequest } from '../src/ui/page-request.js';

const ORIGIN = 'https://web.whatsapp.com';
const TIMEOUT_COPY = /Tiempo de espera agotado/;

function fakeWindow() {
  const listeners = new Set();
  const win = {
    posted: [],
    location: { origin: ORIGIN },
    addEventListener: (type, fn) => { if (type === 'message') listeners.add(fn); },
    removeEventListener: (type, fn) => { if (type === 'message') listeners.delete(fn); },
    postMessage: (data) => { win.posted.push(data); },
    emit: (data) => { for (const fn of [...listeners]) fn({ source: win, origin: ORIGIN, data }); },
    listenerCount: () => listeners.size
  };
  return win;
}

function track(promise) {
  const state = { settled: false, value: undefined, error: undefined };
  promise.then(v => { state.settled = true; state.value = v; }, e => { state.settled = true; state.error = e; });
  return state;
}

const flush = () => new Promise(resolve => setImmediate(resolve));

test('Page request: posts the request and resolves on its response', async (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const win = fakeWindow();
  const state = track(sendPageRequest('GET_OVERVIEW', {}, { win }));
  const { requestId, action, type } = win.posted[0];
  assert.equal(type, 'WA_EXTRACTOR_REQUEST');
  assert.equal(action, 'GET_OVERVIEW');

  win.emit({ type: 'WA_EXTRACTOR_RESPONSE', requestId, success: true, data: { ok: 1 } });
  await flush();
  assert.deepEqual(state.value, { ok: 1 });
  assert.equal(win.listenerCount(), 0, 'listener removed');
});

test('Page request: rejects after 20 s without any message', async (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const win = fakeWindow();
  const state = track(sendPageRequest('EXTRACT_ALL', {}, { win }));
  t.mock.timers.tick(19999);
  await flush();
  assert.equal(state.settled, false);
  t.mock.timers.tick(1);
  await flush();
  assert.match(state.error?.message, TIMEOUT_COPY);
  assert.equal(win.listenerCount(), 0);
});

test('Page request: progress resets the idle timer', async (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const win = fakeWindow();
  const state = track(sendPageRequest('EXTRACT_ALL', {}, { win }));
  const { requestId } = win.posted[0];

  for (let i = 0; i < 5; i++) {
    t.mock.timers.tick(15000);
    win.emit({ type: 'WA_EXTRACTOR_PROGRESS', requestId });
  }
  await flush();
  assert.equal(state.settled, false, 'still waiting after 75 s with progress');

  win.emit({ type: 'WA_EXTRACTOR_RESPONSE', requestId, success: true, data: 'done' });
  await flush();
  assert.equal(state.value, 'done');
});

test('Page request: rejects at 180 s even while progress keeps arriving', async (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const win = fakeWindow();
  const state = track(sendPageRequest('EXTRACT_ALL', {}, { win }));
  const { requestId } = win.posted[0];

  for (let i = 0; i < 17; i++) {
    t.mock.timers.tick(10000);
    win.emit({ type: 'WA_EXTRACTOR_PROGRESS', requestId });
  }
  await flush();
  assert.equal(state.settled, false, 'still waiting at 170 s');
  t.mock.timers.tick(10000);
  await flush();
  assert.match(state.error?.message, TIMEOUT_COPY);
});

test('Page request: ignores responses and progress for other requests', async (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const win = fakeWindow();
  const state = track(sendPageRequest('EXTRACT_ALL', {}, { win }));

  t.mock.timers.tick(15000);
  win.emit({ type: 'WA_EXTRACTOR_PROGRESS', requestId: 'other' });
  win.emit({ type: 'WA_EXTRACTOR_RESPONSE', requestId: 'other', success: true, data: 'wrong' });
  t.mock.timers.tick(5000);
  await flush();
  assert.match(state.error?.message, TIMEOUT_COPY);
});
