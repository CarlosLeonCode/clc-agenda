import test from 'node:test';
import assert from 'node:assert/strict';
import { cleanPhoneNumber, detectCountry, isLid, parseContactDetails } from '../src/core/phone.js';
import { exportToCSV } from '../src/exporters/csv.js';
import { exportToVCard } from '../src/exporters/vcard.js';
import { exportToJSON } from '../src/exporters/json.js';
import { normalizeContact } from '../src/exporters/normalize.js';
import { exportToGoogleContactsCSV } from '../src/exporters/google-contacts.js';

test('Phone utility: detects and ignores internal LIDs', () => {
  assert.equal(isLid('12345678901234@lid'), true);
  assert.equal(isLid('5491112345678@c.us'), false);
  assert.equal(cleanPhoneNumber('12345678901234@lid'), '');
});

test('Phone utility: cleans real JIDs and phone numbers correctly', () => {
  assert.equal(cleanPhoneNumber('5491112345678@c.us'), '5491112345678');
  assert.equal(cleanPhoneNumber('+52 1 (55) 1234-5678'), '5215512345678');
  assert.equal(cleanPhoneNumber(''), '');
});

test('Phone utility: resolves contact details with saved name vs pushname priority', () => {
  const contact1 = parseContactDetails({
    id: '5491112345678@c.us',
    name: 'Carlos León',
    pushname: 'Carlos Pro'
  });
  assert.equal(contact1.name, 'Carlos León');
  assert.equal(contact1.cleanPhone, '5491112345678');
  assert.equal(contact1.phone, '+5491112345678');
  assert.equal(contact1.isMyContact, true);
});

test('CSV Exporter: outputs UTF-8 BOM, escapes quotes, and respects selected fields', () => {
  const mockContacts = [
    {
      name: 'Juan "El Pro" Pérez',
      phone: '+5491112345678',
      cleanPhone: '5491112345678',
      isMyContact: true,
      isAdmin: false,
      source: 'Grupo',
      sourceName: 'Devs'
    }
  ];

  // Default export
  const csvDefault = exportToCSV(mockContacts);
  assert.ok(csvDefault.startsWith('\uFEFF'), 'CSV must start with UTF-8 BOM');
  assert.ok(csvDefault.includes('"Juan ""El Pro"" Pérez"'));
  assert.ok(csvDefault.includes('+5491112345678'));

  // Custom fields: Solo Nombres
  const csvNamesOnly = exportToCSV(mockContacts, { fields: ['name'] });
  assert.ok(csvNamesOnly.includes('Nombre'));
  assert.ok(!csvNamesOnly.includes('Teléfono'));
  assert.ok(csvNamesOnly.includes('"Juan ""El Pro"" Pérez"'));

  // Custom fields: Solo Teléfonos
  const csvPhonesOnly = exportToCSV(mockContacts, { fields: ['phone', 'cleanPhone'] });
  assert.ok(csvPhonesOnly.includes('Teléfono'));
  assert.ok(!csvPhonesOnly.includes('Nombre'));
  assert.ok(csvPhonesOnly.includes('+5491112345678,5491112345678'));
});

test('JSON Exporter: filters only selected fields', () => {
  const mockContacts = [
    {
      name: 'Laura Gomez',
      phone: '+573001234567',
      cleanPhone: '573001234567',
      isMyContact: false,
      country: 'Colombia'
    }
  ];

  const jsonResult = JSON.parse(exportToJSON(mockContacts, { fields: ['name', 'phone'] }));
  assert.equal(jsonResult.contacts[0].name, 'Laura Gomez');
  assert.equal(jsonResult.contacts[0].phone, '+573001234567');
  assert.equal(jsonResult.contacts[0].country, undefined);
});

test('vCard Exporter: outputs valid vCard 3.0 lines with Name and Phone', () => {
  const mockContacts = [
    {
      name: 'María García',
      phone: '+34600112233',
      cleanPhone: '34600112233',
      isMyContact: false,
      isAdmin: true,
      sourceName: 'Comunidad JS'
    }
  ];

  const vcf = exportToVCard(mockContacts);
  assert.ok(vcf.includes('BEGIN:VCARD'));
  assert.ok(vcf.includes('VERSION:3.0'));
  assert.ok(vcf.includes('FN:María García'));
  assert.ok(vcf.includes('TEL;TYPE=CELL,VOICE:+34600112233'));
  assert.ok(vcf.includes('END:VCARD'));
});

test('Contact mapper: normalizes names and phone numbers for external exports', () => {
  const normalized = normalizeContact({ savedName: '  Ana, María  ', pushName: 'Ana', cleanPhone: '573001234567', sourceName: 'Ventas' });
  assert.deepEqual(normalized, {
    displayName: 'Ana, María',
    phone: '+573001234567',
    cleanPhone: '573001234567',
    organization: '',
    note: 'Extraído de: Ventas',
    labels: ['Ventas']
  });
});

test('Google Contacts CSV: emits import-compatible headers and escaped values', () => {
  const csv = exportToGoogleContactsCSV([{ name: 'Ana, María', cleanPhone: '573001234567', isBusiness: true, sourceName: 'Ventas' }]);
  assert.ok(csv.startsWith('\uFEFF'));
  assert.ok(csv.includes('First Name,Middle Name,Last Name'));
  assert.ok(csv.includes('Phone 1 - Type,Phone 1 - Value'));
  assert.ok(csv.includes('Mobile,+573001234567'));
  assert.ok(csv.includes('Empresa WhatsApp'));
  assert.ok(csv.includes('"Ana,"'));
});
