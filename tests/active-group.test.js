import test from 'node:test';
import assert from 'node:assert/strict';
import { findActiveOpenGroup } from '../src/page/resolver.js';

// Order matters: "Familia" is indexed before "Familia López", as in the old bug
const groups = new Map([
  ['111@g.us', { subject: 'Familia' }],
  ['222@g.us', { subject: 'Familia López' }],
  ['333@g.us', { subject: 'Ventas' }],
  ['444@g.us', { subject: 'Ventas' }]
]);

function withHeader(t, title) {
  globalThis.document = {
    querySelector: (selector) => selector.includes('span[title]') ? { getAttribute: () => title, textContent: title } : null
  };
  t.after(() => { delete globalThis.document; });
}

test('Active group: header "Familia López" never resolves to the group "Familia"', (t) => {
  withHeader(t, 'Familia López');
  assert.equal(findActiveOpenGroup({ groups }), '222@g.us');
});

test('Active group: a header that only contains a group title does not match it', (t) => {
  withHeader(t, 'Familia Gómez');
  assert.equal(findActiveOpenGroup({ groups }), null);
});

test('Active group: matching ignores case, extra spaces and accent encoding', (t) => {
  withHeader(t, '  familia   lópez ');
  assert.equal(findActiveOpenGroup({ groups }), '222@g.us');
});

test('Active group: two groups with the same title are ambiguous', (t) => {
  withHeader(t, 'Ventas');
  assert.equal(findActiveOpenGroup({ groups }), null);
});

test('Active group: an empty header matches nothing', (t) => {
  withHeader(t, '   ');
  assert.equal(findActiveOpenGroup({ groups }), null);
});
