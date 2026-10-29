import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

// Runs the bundled script (npm test builds dist/ first) exactly as Chrome loads it.
test('content initialization keeps polling until the overlay API is available', () => {
  const source = fs.readFileSync(new URL('../dist/content.js', import.meta.url), 'utf8');
  const createdElements = [];
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
      createElement(tag) { createdElements.push(tag); return {}; }
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
  // The page engine is loaded by the manifest in the MAIN world, not by a <script> tag.
  assert.deepEqual(createdElements, []);
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

test('content bridge opens the overlay through its API when the popup asks', () => {
  const source = fs.readFileSync(new URL('../dist/content.js', import.meta.url), 'utf8');
  let listener = null;
  let opened = 0;
  const context = {
    console: { log() {}, error() {} },
    setInterval() { return 1; },
    clearInterval() {},
    document: { readyState: 'loading', getElementById() { return null; }, querySelector() { return null; } },
    chrome: { runtime: { onMessage: { addListener(fn) { listener = fn; } } } },
    WAExtractorUI: { init() {}, open() { opened += 1; return true; } }
  };
  context.window = context;
  vm.runInNewContext(source, context, { filename: 'content.js' });

  const responses = [];
  listener({ action: 'OPEN_EXTRACTOR' }, {}, r => responses.push({ ...r }));
  assert.equal(opened, 1);
  assert.deepEqual(responses, [{ success: true }]);

  context.WAExtractorUI = undefined;
  listener({ action: 'OPEN_EXTRACTOR' }, {}, r => responses.push({ ...r }));
  assert.deepEqual(responses[1], { success: false, error: 'Overlay not ready' });
});
