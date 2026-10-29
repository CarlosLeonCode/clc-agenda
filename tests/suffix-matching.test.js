import test from 'node:test';
import assert from 'node:assert/strict';
import { addToSuffixIndex, findSuffixMatch } from '../src/core/suffix-match.js';
import { buildResolvedContact } from '../src/page/resolver.js';

function indexOf(...phones) {
  const index = new Map();
  for (const phone of phones) addToSuffixIndex(index, { phone, savedName: `Name ${phone}` });
  return index;
}

test('Suffix matching: matches international WhatsApp number with local 10-digit phonebook contact', () => {
  const match = findSuffixMatch(indexOf('3195042258'), '573195042258');
  assert.equal(match?.phone, '3195042258');
});

test('Suffix matching: matches Spanish 9-digit local number', () => {
  assert.equal(findSuffixMatch(indexOf('600112233'), '34600112233')?.phone, '600112233');
});

test('Suffix matching: accepts the Mexican 521 and Argentine 549 mobile forms', () => {
  assert.equal(findSuffixMatch(indexOf('5512345678'), '5215512345678')?.phone, '5512345678');
  assert.equal(findSuffixMatch(indexOf('1123456789'), '5491123456789')?.phone, '1123456789');
});

test('Suffix matching: never merges two international numbers sharing the last 10 digits', () => {
  assert.equal(findSuffixMatch(indexOf('13051234567'), '573051234567'), null);
});

test('Suffix matching: never merges numbers sharing only the last 9 digits', () => {
  assert.equal(findSuffixMatch(indexOf('34600112233'), '573600112233'), null);
});

test('Suffix matching: rejects nested country codes (+1 inside +51)', () => {
  assert.equal(findSuffixMatch(indexOf('13051234567'), '513051234567'), null);
});

test('Suffix matching: ignores the entry for the same phone', () => {
  assert.equal(findSuffixMatch(indexOf('573195042258'), '573195042258'), null);
});

test('Suffix matching: returns no match when two different candidates qualify', () => {
  assert.equal(findSuffixMatch(indexOf('91123456789', '1123456789'), '5491123456789'), null);
});

test('Suffix matching: indexing the same entry twice keeps one candidate', () => {
  const index = new Map();
  const entry = { phone: '3195042258' };
  addToSuffixIndex(index, entry);
  addToSuffixIndex(index, entry);
  assert.equal(findSuffixMatch(index, '573195042258'), entry);
});

test('Resolver: a nameless contact does not take the name of another country\'s number', async (t) => {
  globalThis.window = {};
  t.after(() => { delete globalThis.window; });

  const other = { phone: '13051234567', savedName: 'Alice US', pushName: '', isMyContact: true, isBusiness: true, isArchived: false };
  const local = { phone: '3195042258', savedName: 'Andres Gomez', pushName: '', isMyContact: true, isBusiness: false, isArchived: false };
  const bundle = {
    contactsByPhone: new Map([[other.phone, other], [local.phone, local]]),
    contactsBySuffix: new Map(),
    contactsById: new Map(),
    lidMap: new Map()
  };
  addToSuffixIndex(bundle.contactsBySuffix, other);
  addToSuffixIndex(bundle.contactsBySuffix, local);

  const stranger = await buildResolvedContact({ id: '573051234567@c.us' }, bundle);
  assert.equal(stranger.name, '');
  assert.equal(stranger.isMyContact, false);
  assert.equal(stranger.isBusiness, false);

  const andres = await buildResolvedContact({ id: '573195042258@c.us' }, bundle);
  assert.equal(andres.name, 'Andres Gomez');
});
