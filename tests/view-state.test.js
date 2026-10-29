import test from 'node:test';
import assert from 'node:assert/strict';
import { initialViewState, reduceView, visibleTabs, memberCountLabel, friendlyError, summarize, quickFilterContacts } from '../src/ui/view-state.js';

const contacts = [{ cleanPhone: '573001234567' }, { cleanPhone: '34600112233' }];

test('View state: starts on the groups source list with nothing loading', () => {
  assert.deepEqual(initialViewState(), { view: 'source', tab: 'groups', loading: null, error: null, results: null });
});

test('View state: a request marks what is loading and clears the last error', () => {
  let state = reduceView(initialViewState(), { type: 'FAIL', message: 'boom' });
  state = reduceView(state, { type: 'REQUEST', key: 'group:1' });
  assert.equal(state.loading, 'group:1');
  assert.equal(state.error, null);
  assert.equal(state.view, 'source');
});

test('View state: results replace the source view and remember where they came from', () => {
  let state = reduceView(initialViewState(), { type: 'TAB', tab: 'labels' });
  state = reduceView(state, { type: 'REQUEST', key: 'label:1' });
  state = reduceView(state, { type: 'RESULTS', title: 'Nuevo cliente', contacts });
  assert.equal(state.view, 'results');
  assert.equal(state.loading, null);
  assert.deepEqual(state.results, { title: 'Nuevo cliente', tab: 'labels', contacts });
});

test('View state: a new extraction replaces previous results instead of stacking them', () => {
  let state = reduceView(initialViewState(), { type: 'RESULTS', title: 'Grupo A', contacts });
  state = reduceView(state, { type: 'BACK' });
  state = reduceView(state, { type: 'RESULTS', title: 'Grupo B', contacts: [] });
  assert.equal(state.results.title, 'Grupo B');
  assert.deepEqual(state.results.contacts, []);
});

test('View state: back returns to the tab the results came from', () => {
  let state = reduceView(initialViewState(), { type: 'TAB', tab: 'chats' });
  state = reduceView(state, { type: 'RESULTS', title: 'Chats', contacts });
  state = reduceView(state, { type: 'BACK' });
  assert.equal(state.view, 'source');
  assert.equal(state.tab, 'chats');
});

test('View state: switching tabs always shows that tab source list, never old results', () => {
  let state = reduceView(initialViewState(), { type: 'RESULTS', title: 'Grupo A', contacts });
  state = reduceView(state, { type: 'TAB', tab: 'all' });
  assert.equal(state.view, 'source');
  assert.equal(state.tab, 'all');
});

test('View state: a failed request stays on the source view with the error', () => {
  let state = reduceView(initialViewState(), { type: 'REQUEST', key: 'group:9' });
  state = reduceView(state, { type: 'FAIL', message: 'Abre el grupo en WhatsApp y vuelve a intentarlo.' });
  assert.equal(state.view, 'source');
  assert.equal(state.loading, null);
  assert.equal(state.error, 'Abre el grupo en WhatsApp y vuelve a intentarlo.');
});

test('View state: the labels tab is hidden when WhatsApp has no labels', () => {
  assert.deepEqual(visibleTabs({ labels: [] }), ['groups', 'all', 'chats']);
  assert.deepEqual(visibleTabs(null), ['groups', 'all', 'chats']);
  assert.deepEqual(visibleTabs({ labels: [{ id: '1' }] }), ['groups', 'labels', 'all', 'chats']);
});

test('View state: member counts read naturally, including unloaded groups', () => {
  assert.equal(memberCountLabel(640), '640 miembros');
  assert.equal(memberCountLabel(1), '1 miembro');
  assert.equal(memberCountLabel(0), 'Sin cargar');
});

test('View state: engine errors become short instructions', () => {
  assert.equal(
    friendlyError('Este grupo aún no tiene participantes cargados en memoria. Por favor abre el chat del grupo en WhatsApp Web y vuelve a hacer clic en Extraer.'),
    'Este grupo todavía no cargó sus miembros. Abre el grupo en WhatsApp y vuelve a intentarlo.'
  );
  assert.equal(
    friendlyError('Tiempo de espera agotado al comunicar con WhatsApp Web.'),
    'WhatsApp Web tardó demasiado en responder. Vuelve a intentarlo.'
  );
  assert.equal(friendlyError('Algo raro'), 'Algo raro');
  assert.equal(friendlyError(''), 'No se pudo leer WhatsApp Web. Vuelve a intentarlo.');
});

const mixed = [
  { cleanPhone: '1', isMyContact: true, isAdmin: true },
  { cleanPhone: '2', isMyContact: true, isAdmin: false },
  { cleanPhone: '3', isMyContact: false, isAdmin: false },
  { cleanPhone: '4', isMyContact: false, isAdmin: true },
  { cleanPhone: '5', isMyContact: false, isAdmin: false }
];

test('Results summary: counts contacts, saved, unsaved and admins', () => {
  assert.deepEqual(summarize(mixed), { all: 5, saved: 2, unsaved: 3, admins: 2 });
  assert.deepEqual(summarize([]), { all: 0, saved: 0, unsaved: 0, admins: 0 });
});

test('Results summary: each count filters to exactly those contacts', () => {
  const phones = list => list.map(c => c.cleanPhone);
  assert.deepEqual(phones(quickFilterContacts(mixed, 'all')), ['1', '2', '3', '4', '5']);
  assert.deepEqual(phones(quickFilterContacts(mixed, 'saved')), ['1', '2']);
  assert.deepEqual(phones(quickFilterContacts(mixed, 'unsaved')), ['3', '4', '5']);
  assert.deepEqual(phones(quickFilterContacts(mixed, 'admins')), ['1', '4']);
  assert.deepEqual(phones(quickFilterContacts(mixed, 'unknown')), ['1', '2', '3', '4', '5']);
});
