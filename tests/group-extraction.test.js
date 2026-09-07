import test from 'node:test';
import assert from 'node:assert/strict';
import { extractParticipantsList, getGroupParticipantCount, resolveGroupParticipants } from '../src/core/groups.js';

test('Group extraction: extracts participants from Backbone Collection with _models', () => {
  const mockGroup = {
    id: '120363048591823910@g.us',
    subject: 'TuringBox @ Colombia',
    participants: {
      _models: [
        { id: '573001234567@c.us', isAdmin: true },
        { id: '573109876543:0@c.us', isAdmin: false },
        { id: '573205554433@c.us', isAdmin: false }
      ]
    }
  };

  const list = extractParticipantsList(mockGroup);
  assert.equal(list.length, 3);
  assert.equal(list[0].id, '573001234567@c.us');
  assert.equal(list[0].isAdmin, true);

  const count = getGroupParticipantCount(mockGroup);
  assert.equal(count, 3);
});

test('Group extraction: extracts participants from Backbone Collection with models property', () => {
  const mockGroup = {
    id: '120363048591823911@g.us',
    subject: 'Comunidad JS',
    participants: {
      models: [
        { id: '34600112233@c.us', isAdmin: true },
        { id: '34611223344@c.us', isAdmin: false }
      ]
    }
  };

  const list = extractParticipantsList(mockGroup);
  assert.equal(list.length, 2);
  assert.equal(getGroupParticipantCount(mockGroup), 2);
});

test('Group extraction: extracts participants from nested groupMetadata', () => {
  const mockChat = {
    id: '120363048591823912@g.us',
    name: 'Grupo Chat con Metadata Anidada',
    groupMetadata: {
      participants: [
        { id: '5491112345678@c.us', isAdmin: false },
        { id: '5491187654321@c.us', isAdmin: true }
      ]
    }
  };

  const list = extractParticipantsList(mockChat);
  assert.equal(list.length, 2);
  assert.equal(getGroupParticipantCount(mockChat), 2);
});

test('Group extraction: extracts participants from object dictionary', () => {
  const mockGroup = {
    id: '120363048591823913@g.us',
    subject: 'Grupo Diccionario',
    participants: {
      p1: { id: '5215512345678@c.us' },
      p2: { id: '5215587654321@c.us' }
    }
  };

  const list = extractParticipantsList(mockGroup);
  assert.equal(list.length, 2);
  assert.equal(list[0].id, '5215512345678@c.us');
});

test('Group extraction: handles empty, null or invalid groups gracefully', () => {
  assert.deepEqual(extractParticipantsList(null), []);
  assert.deepEqual(extractParticipantsList(undefined), []);
  assert.deepEqual(extractParticipantsList({}), []);
  assert.equal(getGroupParticipantCount(null), 0);
  assert.equal(getGroupParticipantCount({}), 0);
});

test('Group extraction: resolveGroupParticipants hydrates names from database and detects admins', () => {
  const mockGroup = {
    id: '120363048591823910@g.us',
    subject: 'Devs Group',
    participants: [
      { id: '573195042258:0@c.us', isAdmin: true },
      { id: '573001234567@c.us', isAdmin: false }
    ]
  };

  const contactsDb = new Map();
  contactsDb.set('573195042258', {
    name: 'Carlos Leon Senior',
    pushname: 'Carlos'
  });

  const resolved = resolveGroupParticipants(mockGroup, contactsDb);
  assert.equal(resolved.length, 2);

  // Participant 1: Saved Contact & Admin
  assert.equal(resolved[0].cleanPhone, '573195042258');
  assert.equal(resolved[0].name, 'Carlos Leon Senior');
  assert.equal(resolved[0].isAdmin, true);
  assert.equal(resolved[0].isMyContact, true);
  assert.equal(resolved[0].sourceName, 'Devs Group');
  assert.equal(resolved[0].country, 'Colombia');

  // Participant 2: Unsaved Member
  assert.equal(resolved[1].cleanPhone, '573001234567');
  assert.equal(resolved[1].isAdmin, false);
  assert.equal(resolved[1].isMyContact, false);
});
