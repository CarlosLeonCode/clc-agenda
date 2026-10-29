import test from 'node:test';
import assert from 'node:assert/strict';
import {
  PAGE_SIZE,
  contactKey,
  filterContacts,
  getExportList,
  setSelectionFor,
  areAllSelected,
  paginate
} from '../src/ui/selection.js';

const contacts = [
  { id: '573001234567@c.us', cleanPhone: '573001234567', phone: '+573001234567', name: 'Ana Pérez', country: 'Colombia', sourceName: 'Ventas' },
  { id: '5491198765432@c.us', cleanPhone: '5491198765432', phone: '+5491198765432', name: 'Bruno Díaz', country: 'Argentina', sourceName: 'Soporte' },
  { id: '34600112233@c.us', cleanPhone: '34600112233', phone: '+34600112233', pushName: 'Carla', country: 'España', sourceName: 'Ventas' }
];
const keys = list => list.map(contactKey);

test('Selection: contact key prefers cleanPhone and falls back to id', () => {
  assert.equal(contactKey({ cleanPhone: '573001234567', id: 'x@c.us' }), '573001234567');
  assert.equal(contactKey({ id: 'x@c.us' }), 'x@c.us');
});

test('Selection: empty selection exports nothing', () => {
  assert.deepEqual(getExportList(contacts, new Set()), []);
});

test('Selection: export list keeps only selected contacts in original order', () => {
  const selected = new Set(['34600112233', '573001234567']);
  assert.deepEqual(keys(getExportList(contacts, selected)), ['573001234567', '34600112233']);
});

test('Selection: search matches name, push name, phone, country and source, ignoring case', () => {
  assert.deepEqual(keys(filterContacts(contacts, 'ANA')), ['573001234567']);
  assert.deepEqual(keys(filterContacts(contacts, 'carla')), ['34600112233']);
  assert.deepEqual(keys(filterContacts(contacts, '5491')), ['5491198765432']);
  assert.deepEqual(keys(filterContacts(contacts, 'españa')), ['34600112233']);
  assert.deepEqual(keys(filterContacts(contacts, 'ventas')), ['573001234567', '34600112233']);
  assert.equal(filterContacts(contacts, '').length, 3);
});

test('Selection: select-all adds only the matching contacts and keeps hidden ones', () => {
  const selected = new Set(['5491198765432']);
  const visible = filterContacts(contacts, 'ventas');
  const next = setSelectionFor(selected, visible, true);
  assert.deepEqual([...next].sort(), ['34600112233', '5491198765432', '573001234567']);
  assert.notEqual(next, selected, 'returns a new Set');
});

test('Selection: unselect-all clears only the matching contacts', () => {
  const selected = new Set(keys(contacts));
  const visible = filterContacts(contacts, 'ventas');
  const next = setSelectionFor(selected, visible, false);
  assert.deepEqual([...next], ['5491198765432']);
});

test('Selection: header checkbox is checked only when every matching contact is selected', () => {
  const visible = filterContacts(contacts, 'ventas');
  assert.equal(areAllSelected(new Set(['573001234567', '34600112233']), visible), true);
  assert.equal(areAllSelected(new Set(['573001234567']), visible), false);
  assert.equal(areAllSelected(new Set(keys(contacts)), []), false);
});

test('Selection: pagination renders one page and reports hidden rows', () => {
  const many = Array.from({ length: 1000 }, (_, i) => ({ cleanPhone: String(5700000000 + i) }));
  assert.equal(PAGE_SIZE, 400);
  const first = paginate(many, PAGE_SIZE);
  assert.equal(first.rows.length, 400);
  assert.equal(first.hiddenCount, 600);
  const all = paginate(many, 1200);
  assert.equal(all.rows.length, 1000);
  assert.equal(all.hiddenCount, 0);
});
