import test from 'node:test';
import assert from 'node:assert/strict';
import { cleanPhoneNumber } from '../src/core/phone.js';

test('Suffix matching: matches international WhatsApp number with local 10-digit phonebook contact', () => {
  const phonebookContact = {
    id: '3195042258@c.us',
    name: 'Andres Gomez',
    number: '3195042258'
  };

  const groupParticipant = {
    id: '573195042258@c.us'
  };

  const pPhone = cleanPhoneNumber(groupParticipant.id);
  const cPhone = cleanPhoneNumber(phonebookContact.number || phonebookContact.id);

  const isMatch = pPhone === cPhone || (cPhone.length >= 8 && pPhone.endsWith(cPhone));
  assert.equal(isMatch, true);
});
