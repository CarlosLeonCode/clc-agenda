import test from 'node:test';
import assert from 'node:assert/strict';
import { cleanPhoneNumber, parseContactDetails } from '../src/core/phone.js';

test('Multi-Device JIDs with device suffix (:0, :1, etc) clean to exact phone number', () => {
  assert.equal(cleanPhoneNumber('573195042258:0@c.us'), '573195042258');
  assert.equal(cleanPhoneNumber('573133039332:1@c.us'), '573133039332');
  assert.equal(cleanPhoneNumber('573114430333:42@s.whatsapp.net'), '573114430333');
  assert.equal(cleanPhoneNumber('573228205598.0:0@c.us'), '573228205598');
  assert.equal(cleanPhoneNumber('573195042258:0'), '573195042258');
});

test('Matches participant from group with contact from store having :0 suffix', () => {
  const participant = { id: '573195042258@c.us' };
  const storedContact = {
    id: '573195042258:0@c.us',
    name: 'Juan Perez Agendado',
    pushname: 'Juancho'
  };

  const phone1 = cleanPhoneNumber(participant.id);
  const phone2 = cleanPhoneNumber(storedContact.id);

  assert.equal(phone1, '573195042258');
  assert.equal(phone2, '573195042258');
  assert.equal(phone1, phone2);

  const merged = { ...participant, ...storedContact };
  const parsed = parseContactDetails(merged);
  assert.equal(parsed.name, 'Juan Perez Agendado');
  assert.equal(parsed.cleanPhone, '573195042258');
});
