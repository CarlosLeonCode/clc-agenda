import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

test('content initialization keeps polling until the overlay API is available', () => {
  const source = fs.readFileSync(new URL('../content/content.js', import.meta.url), 'utf8');
  const intervals = new Map();
  let nextIntervalId = 1;
  const cleared = [];
  const context = {
    console: { log() {}, error() {} },
    setInterval(callback) {
      const id = nextIntervalId++;
      intervals.set(id, callback);
      return id;
    },
    clearInterval(id) {
      cleared.push(id);
      intervals.delete(id);
    },
    document: {
      readyState: 'complete',
      body: {},
      head: { appendChild() {} },
      documentElement: { appendChild() {} },
      getElementById(id) { return id === 'app' ? {} : null; },
      querySelector() { return null; },
      createElement() { return { set src(value) {}, onload: null, remove() {} }; }
    },
    chrome: {
      runtime: {
        getURL(file) { return file; },
        onMessage: { addListener() {} }
      }
    }
  };
  context.window = context;

  vm.runInNewContext(source, context, { filename: 'content.js' });
  assert.equal(intervals.size, 1);
  const check = intervals.values().next().value;

  // WhatsApp can finish loading before overlay.js has registered its API.
  check();
  assert.deepEqual(cleared, []);
  assert.equal(intervals.size, 1);

  let initCalls = 0;
  context.WAExtractorUI = { init() { initCalls += 1; } };
  check();
  assert.equal(initCalls, 1);
  assert.equal(intervals.size, 0);
  assert.equal(cleared.length, 1);
});
