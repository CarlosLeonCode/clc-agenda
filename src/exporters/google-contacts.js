import { normalizeContact, splitDisplayName } from './normalize.js';

export const GOOGLE_CONTACT_HEADERS = [
  'First Name', 'Middle Name', 'Last Name', 'Name Prefix', 'Name Suffix',
  'Phonetic First Name', 'Phonetic Middle Name', 'Phonetic Last Name',
  'Organization Name', 'Organization Title', 'Phone 1 - Type', 'Phone 1 - Value',
  'Email 1 - Type', 'Email 1 - Value', 'Notes', 'Labels'
];

function csvField(value) {
  const text = value == null ? '' : String(value);
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

/** Export the local-only contact mapping in Google Contacts' CSV import shape. */
export function exportToGoogleContactsCSV(contacts = []) {
  const rows = contacts.map(contact => {
    const normalized = normalizeContact(contact);
    const { firstName, lastName } = splitDisplayName(normalized.displayName);
    return [
      firstName, '', lastName, '', '', '', '', '', normalized.organization, '',
      normalized.phone ? 'Mobile' : '', normalized.phone, '', '', normalized.note,
      normalized.labels.join(' ::: ')
    ].map(csvField).join(',');
  });
  return '\uFEFF' + [GOOGLE_CONTACT_HEADERS.map(csvField).join(','), ...rows].join('\r\n');
}
