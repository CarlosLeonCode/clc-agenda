import test from 'node:test';
import assert from 'node:assert/strict';
import { exportToCSV } from '../src/exporters/csv.js';
import { exportToJSON } from '../src/exporters/json.js';
import { exportToVCard } from '../src/exporters/vcard.js';
import { exportToGoogleContactsCSV } from '../src/exporters/google-contacts.js';

// Characterization tests: pin the export output shipped before the src/ unification.

const ALL_FIELDS = ['name', 'phone', 'cleanPhone', 'isMyContact', 'isAdmin', 'isBusiness', 'country', 'sourceName', 'id'];

const ana = {
  id: '573001234567@c.us',
  name: 'Ana Sofía Pérez',
  savedName: 'Ana Sofía Pérez',
  pushName: 'Ana',
  phone: '+573001234567',
  cleanPhone: '573001234567',
  country: 'Colombia',
  countryIso: 'CO',
  isMyContact: true,
  isAdmin: true,
  isBusiness: true,
  source: 'Grupo',
  sourceName: 'Clientes VIP'
};

const luis = {
  id: '5491198765432@c.us',
  name: '',
  savedName: '',
  pushName: '',
  phone: '+5491198765432',
  cleanPhone: '5491198765432',
  country: 'Argentina',
  countryIso: 'AR',
  isMyContact: false,
  isAdmin: false,
  isBusiness: false,
  source: 'Chats',
  sourceName: ''
};

test('Shipped contract: CSV uses short headers and display values for every field', () => {
  const csv = exportToCSV([ana, luis], { fields: ALL_FIELDS });
  assert.equal(csv, '﻿' + [
    'Nombre,Teléfono,Solo Números,En Agenda,Rol,Tipo Cuenta,País,Origen,WhatsApp ID',
    'Ana Sofía Pérez,+573001234567,573001234567,Sí,Admin,Empresa,Colombia,Clientes VIP,573001234567@c.us',
    ',+5491198765432,5491198765432,No,Miembro,Personal,Argentina,Chats,5491198765432@c.us'
  ].join('\r\n'));
});

test('Shipped contract: CSV origin falls back to source, then Todos', () => {
  const csv = exportToCSV([luis, { cleanPhone: '51999888777' }], { fields: ['sourceName'] });
  assert.equal(csv, '﻿' + ['Origen', 'Chats', 'Todos'].join('\r\n'));
});

test('Shipped contract: CSV ignores unknown fields such as source and keeps the given order', () => {
  const csv = exportToCSV([ana], { fields: ['phone', 'source', 'name'] });
  assert.equal(csv, '﻿' + ['Teléfono,Nombre', '+573001234567,Ana Sofía Pérez'].join('\r\n'));
});

test('Shipped contract: JSON lists selectedFields and exports display values', () => {
  const json = JSON.parse(exportToJSON([ana, luis], { fields: ALL_FIELDS }));
  assert.deepEqual(Object.keys(json.metadata), ['exportedAt', 'totalContacts', 'selectedFields', 'generator']);
  assert.deepEqual(json.metadata.selectedFields, ALL_FIELDS);
  assert.equal(json.metadata.totalContacts, 2);
  assert.equal(json.metadata.generator, 'CLC Agenda');
  assert.deepEqual(json.contacts[0], {
    name: 'Ana Sofía Pérez',
    phone: '+573001234567',
    cleanPhone: '573001234567',
    isMyContact: 'Sí',
    isAdmin: 'Admin',
    isBusiness: 'Empresa',
    country: 'Colombia',
    sourceName: 'Clientes VIP',
    id: '573001234567@c.us'
  });
  assert.equal(json.contacts[1].name, '');
  assert.equal(json.contacts[1].sourceName, 'Chats');
});

test('Shipped contract: JSON drops unknown fields from selectedFields', () => {
  const json = JSON.parse(exportToJSON([ana], { fields: ['name', 'source'] }));
  assert.deepEqual(json.metadata.selectedFields, ['name']);
  assert.deepEqual(json.contacts[0], { name: 'Ana Sofía Pérez' });
});

test('Shipped contract: vCard cards for every field', () => {
  const vcf = exportToVCard([ana, luis], { fields: ALL_FIELDS });
  assert.equal(vcf, [
    'BEGIN:VCARD',
    'VERSION:3.0',
    'FN:Ana Sofía Pérez',
    'N:Ana Sofía Pérez;;;;',
    'TEL;TYPE=CELL,VOICE:+573001234567',
    'ORG:Empresa WhatsApp',
    'CATEGORIES:Clientes VIP,Admin,Colombia',
    'NOTE:Extraído de: Clientes VIP',
    'END:VCARD',
    'BEGIN:VCARD',
    'VERSION:3.0',
    'FN:WA +5491198765432',
    'N:WA +5491198765432;;;;',
    'TEL;TYPE=CELL,VOICE:+5491198765432',
    'CATEGORIES:Argentina',
    'END:VCARD'
  ].join('\r\n'));
});

test('Shipped contract: vCard ORG only when the account type field is selected', () => {
  const withoutType = exportToVCard([ana], { fields: ['name', 'phone', 'sourceName'] });
  assert.ok(!withoutType.includes('ORG:'));
  const withType = exportToVCard([ana], { fields: ['name', 'isBusiness'] });
  assert.ok(withType.includes('ORG:Empresa WhatsApp'));
});

test('Shipped contract: vCard NOTE needs a sourceName on the contact', () => {
  const fromSourceOnly = exportToVCard([luis], { fields: ['name', 'sourceName', 'country'] });
  assert.ok(!fromSourceOnly.includes('NOTE:'));
  const fromCountry = exportToVCard([ana], { fields: ['name', 'country'] });
  assert.ok(fromCountry.includes('NOTE:Extraído de: Clientes VIP'));
});

test('Shipped contract: Google Contacts CSV rows', () => {
  const csv = exportToGoogleContactsCSV([ana, luis]);
  assert.equal(csv, '﻿' + [
    'First Name,Middle Name,Last Name,Name Prefix,Name Suffix,Phonetic First Name,Phonetic Middle Name,Phonetic Last Name,Organization Name,Organization Title,Phone 1 - Type,Phone 1 - Value,Email 1 - Type,Email 1 - Value,Notes,Labels',
    'Ana Sofía,,Pérez,,,,,,Empresa WhatsApp,,Mobile,+573001234567,,,Extraído de: Clientes VIP,Clientes VIP',
    ',,,,,,,,,,Mobile,+5491198765432,,,Extraído de: Chats,Chats'
  ].join('\r\n'));
});
