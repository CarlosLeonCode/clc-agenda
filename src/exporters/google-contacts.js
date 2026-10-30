import { normalizeContact, splitDisplayName } from './normalize.js';

export const GOOGLE_CONTACT_HEADERS = [
  'First Name', 'Middle Name', 'Last Name', 'Name Prefix', 'Name Suffix',
  'Phonetic First Name', 'Phonetic Middle Name', 'Phonetic Last Name',
  'Organization Name', 'Organization Title', 'Phone 1 - Type', 'Phone 1 - Value',
  'Email 1 - Type', 'Email 1 - Value', 'Notes', 'Labels'
];

// Spreadsheets run cells starting with these characters as formulas
function neutralizeFormula(value) {
  const text = value == null ? '' : String(value);
  return /^[=\-+@\t\r]/.test(text) ? `'${text}` : text;
}

function csvField(value) {
  const text = value == null ? '' : String(value);
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

/** Export the local-only contact mapping in Google Contacts' CSV import shape. */
export function exportToGoogleContactsCSV(contacts = [], options = {}) {
  const rows = contacts.map(contact => {
    const normalized = normalizeContact(contact, options.lang);
    const { firstName, lastName } = splitDisplayName(normalized.displayName);
    const text = [
      firstName, '', lastName, '', '', '', '', '', normalized.organization, '',
      normalized.phone ? 'Mobile' : ''
    ].map(neutralizeFormula);
    // The phone keeps its leading "+": it is the E.164 value Google expects
    return [
      ...text, normalized.phone, '', '', neutralizeFormula(normalized.note),
      neutralizeFormula(normalized.labels.join(' ::: '))
    ].map(csvField).join(',');
  });
  return '\uFEFF' + [GOOGLE_CONTACT_HEADERS.map(csvField).join(','), ...rows].join('\r\n');
}
