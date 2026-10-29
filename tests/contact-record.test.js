import test from 'node:test';
import assert from 'node:assert/strict';
import { mergeContactRecord } from '../src/core/contact-record.js';

const emptyEntry = () => ({ phone: '', savedName: '', pushName: '', isMyContact: false, isBusiness: false, isArchived: false });

test('Contact record: keeps saved name and push name apart and marks saved contacts', () => {
  const entry = mergeContactRecord(emptyEntry(), {
    id: '573001234567@c.us',
    name: 'Ana Sofía Pérez',
    pushname: '~Ana'
  });
  assert.equal(entry.phone, '573001234567');
  assert.equal(entry.savedName, 'Ana Sofía Pérez');
  assert.equal(entry.pushName, 'Ana');
  assert.equal(entry.isMyContact, true);
});

test('Contact record: first non-empty value wins on later merges', () => {
  const entry = emptyEntry();
  mergeContactRecord(entry, { id: '573001234567@c.us', pushname: 'Ana' });
  mergeContactRecord(entry, { id: '573001234567@c.us', name: 'Ana Sofía', pushname: 'Otra' });
  assert.equal(entry.pushName, 'Ana');
  assert.equal(entry.savedName, 'Ana Sofía');
});

test('Contact record: ignores names that are just the phone number', () => {
  const entry = mergeContactRecord(emptyEntry(), { id: '573001234567@c.us', name: '+573001234567', pushname: '573001234567' });
  assert.equal(entry.savedName, '');
  assert.equal(entry.pushName, '');
  assert.equal(entry.isMyContact, false);
});

test('Contact record: reads business, archived and LID flags from wrapped models', () => {
  const entry = mergeContactRecord(emptyEntry(), {
    __x: {
      id: '5491198765432@c.us',
      verifiedLevel: 2,
      archive: true,
      lid: { _serialized: '12345678901234@lid' }
    }
  });
  assert.equal(entry.isBusiness, true);
  assert.equal(entry.isArchived, true);
  assert.equal(entry.lid, '12345678901234@lid');
});

test('Contact record: does not take a phone from a LID id', () => {
  const entry = mergeContactRecord(emptyEntry(), { id: '12345678901234@lid' });
  assert.equal(entry.phone, '');
});

test('Contact record: returns the target untouched for an empty source', () => {
  const entry = emptyEntry();
  assert.equal(mergeContactRecord(entry, null), entry);
  assert.deepEqual(entry, emptyEntry());
});

test('Contact record: carries names from an aggregated contactsByPhone entry', () => {
  const aggregated = { phone: '3195042258', savedName: 'Andres Gomez', pushName: 'Andy', isMyContact: true, isBusiness: false, isArchived: false };
  const entry = mergeContactRecord({ ...emptyEntry(), phone: '573195042258' }, aggregated);
  assert.equal(entry.savedName, 'Andres Gomez');
  assert.equal(entry.pushName, 'Andy');
  assert.equal(entry.phone, '573195042258');
});
