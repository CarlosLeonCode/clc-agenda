import test from 'node:test';
import assert from 'node:assert/strict';
import { exportToCSV } from '../src/exporters/csv.js';
import { exportToJSON } from '../src/exporters/json.js';
import { exportToVCard } from '../src/exporters/vcard.js';
import { exportToGoogleContactsCSV } from '../src/exporters/google-contacts.js';

const ALL = ['name', 'phone', 'cleanPhone', 'isMyContact', 'isAdmin', 'isBusiness', 'country', 'sourceName', 'id'];

const ana = {
  id: '573001234567@c.us', name: 'Ana Sofía Pérez', phone: '+573001234567', cleanPhone: '573001234567',
  country: 'Colombia', countryIso: 'CO', isMyContact: true, isAdmin: true, isBusiness: true,
  source: 'Grupo', sourceName: 'Clientes VIP'
};
const luis = {
  id: '5491198765432@c.us', phone: '+5491198765432', cleanPhone: '5491198765432',
  country: 'Estados Unidos / Canadá', countryIso: 'US', isMyContact: false, isAdmin: false, isBusiness: false,
  source: 'Todos'
};

test('English contract: CSV headers and display values', () => {
  const csv = exportToCSV([ana, luis], { fields: ALL, lang: 'en' });
  assert.equal(csv, '﻿' + [
    'Name,Phone,Digits Only,Saved,Role,Account Type,Country,Source,WhatsApp ID',
    'Ana Sofía Pérez,+573001234567,573001234567,Yes,Admin,Business,Colombia,Clientes VIP,573001234567@c.us',
    ',+5491198765432,5491198765432,No,Member,Personal,United States / Canada,All,5491198765432@c.us'
  ].join('\r\n'));
});

test('English contract: JSON keeps its keys and uses English values', () => {
  const json = JSON.parse(exportToJSON([luis], { fields: ['isMyContact', 'isAdmin', 'country', 'sourceName'], lang: 'en' }));
  assert.deepEqual(json.metadata.selectedFields, ['isMyContact', 'isAdmin', 'country', 'sourceName']);
  assert.deepEqual(json.contacts[0], { isMyContact: 'No', isAdmin: 'Member', country: 'United States / Canada', sourceName: 'All' });
});

test('English contract: vCard note, organization and placeholder name', () => {
  const vcf = exportToVCard([ana, { cleanPhone: '' }], { fields: ['name', 'phone', 'isBusiness', 'sourceName'], lang: 'en' });
  assert.ok(vcf.includes('ORG:WhatsApp Business'));
  assert.ok(vcf.includes('NOTE:Exported from: Clientes VIP'));
  assert.ok(vcf.includes('FN:WhatsApp contact'));
});

test('English contract: Google Contacts keeps Google headers, note in English', () => {
  const csv = exportToGoogleContactsCSV([ana], { lang: 'en' });
  assert.ok(csv.includes('First Name,Middle Name,Last Name'));
  assert.ok(csv.includes('WhatsApp Business'));
  assert.ok(csv.includes('Exported from: Clientes VIP'));
});

test('Spanish stays the default for every exporter', () => {
  assert.ok(exportToCSV([ana], { fields: ['isMyContact'] }).includes('En Agenda'));
  assert.ok(exportToVCard([ana], { fields: ['name', 'isBusiness', 'sourceName'] }).includes('NOTE:Extraído de: Clientes VIP'));
  assert.ok(exportToGoogleContactsCSV([ana]).includes('Empresa WhatsApp'));
});
