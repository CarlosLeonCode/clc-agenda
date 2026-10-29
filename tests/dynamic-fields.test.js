import test from 'node:test';
import assert from 'node:assert/strict';
import { exportToCSV } from '../src/exporters/csv.js';
import { exportToJSON } from '../src/exporters/json.js';
import { exportToVCard } from '../src/exporters/vcard.js';

const sampleContacts = [
  {
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
  },
  {
    id: '5491198765432@c.us',
    name: '=cmd|/c calc!A1',
    savedName: '=cmd|/c calc!A1',
    pushName: 'Hacker',
    phone: '+5491198765432',
    cleanPhone: '5491198765432',
    country: 'Argentina',
    countryIso: 'AR',
    isMyContact: false,
    isAdmin: false,
    isBusiness: false,
    source: 'Grupo',
    sourceName: 'Clientes VIP'
  }
];

test('Dynamic Fields: CSV Exporter exports only requested fields and order', () => {
  // 1. Preset Solo Nombres
  const csvNames = exportToCSV(sampleContacts, { fields: ['name'] });
  const linesNames = csvNames.replace('\uFEFF', '').trim().split('\r\n');
  assert.equal(linesNames[0], 'Nombre');
  assert.equal(linesNames[1], 'Ana Sofía Pérez');
  assert.equal(linesNames[2], "'=cmd|/c calc!A1"); // Formula sanitized with leading quote

  // 2. Preset Solo Teléfonos
  const csvPhones = exportToCSV(sampleContacts, { fields: ['phone', 'cleanPhone'] });
  const linesPhones = csvPhones.replace('\uFEFF', '').trim().split('\r\n');
  assert.equal(linesPhones[0], 'Teléfono,Solo Números');
  assert.equal(linesPhones[1], '+573001234567,573001234567');

  // 3. Granular Selection: Nombre, País, Rol, Empresa
  const csvCustom = exportToCSV(sampleContacts, { fields: ['name', 'country', 'isAdmin', 'isBusiness'] });
  const linesCustom = csvCustom.replace('\uFEFF', '').trim().split('\r\n');
  assert.equal(linesCustom[0], 'Nombre,País,Rol,Tipo Cuenta');
  assert.equal(linesCustom[1], 'Ana Sofía Pérez,Colombia,Admin,Empresa');
  assert.equal(linesCustom[2], "'=cmd|/c calc!A1,Argentina,Miembro,Personal");
});

test('Dynamic Fields: JSON Exporter strictly filters object keys', () => {
  const jsonOutput = JSON.parse(exportToJSON(sampleContacts, { fields: ['name', 'country', 'isAdmin'] }));

  assert.equal(jsonOutput.metadata.totalContacts, 2);
  assert.deepEqual(jsonOutput.metadata.selectedFields, ['name', 'country', 'isAdmin']);

  // Contact 1
  assert.equal(jsonOutput.contacts[0].name, 'Ana Sofía Pérez');
  assert.equal(jsonOutput.contacts[0].country, 'Colombia');
  assert.equal(jsonOutput.contacts[0].isAdmin, 'Admin');
  assert.equal(jsonOutput.contacts[0].phone, undefined);
  assert.equal(jsonOutput.contacts[0].isBusiness, undefined);

  // Contact 2
  assert.equal(jsonOutput.contacts[1].country, 'Argentina');
  assert.equal(jsonOutput.contacts[1].isAdmin, 'Miembro');
});

test('Dynamic Fields: vCard Exporter generates valid vCard 3.0 lines adapting to fields', () => {
  // With phone and name
  const vcfAll = exportToVCard(sampleContacts, { fields: ['name', 'phone', 'sourceName', 'isAdmin'] });
  assert.ok(vcfAll.includes('BEGIN:VCARD'));
  assert.ok(vcfAll.includes('FN:Ana Sofía Pérez'));
  assert.ok(vcfAll.includes('TEL;TYPE=CELL,VOICE:+573001234567'));
  assert.ok(vcfAll.includes('CATEGORIES:Clientes VIP,Admin'));
  assert.ok(vcfAll.includes('NOTE:Extraído de: Clientes VIP'));
  assert.ok(vcfAll.includes('END:VCARD'));

  // With only phones
  const vcfPhonesOnly = exportToVCard(sampleContacts, { fields: ['phone'] });
  assert.ok(vcfPhonesOnly.includes('TEL;TYPE=CELL,VOICE:+573001234567'));
  assert.ok(vcfPhonesOnly.includes('END:VCARD'));
});
