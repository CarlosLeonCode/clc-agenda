/**
 * vCard 3.0 Exporter for phone address books
 */

import { splitDisplayName, EXPORT_TEXT } from './normalize.js';
import { countryName } from '../core/phone.js';

export function escapeVCardValue(value) {
  if (value === null || value === undefined) return '';
  return String(value)
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n');
}

export function exportToVCard(contacts = [], options = {}) {
  const selectedFields = options.fields || ['name', 'phone'];
  const text = EXPORT_TEXT[options.lang] || EXPORT_TEXT.es;
  const includeName = selectedFields.includes('name');
  const includePhone = selectedFields.includes('phone') || selectedFields.includes('cleanPhone');
  const includeOrg = selectedFields.includes('isBusiness');
  const includeNote = selectedFields.includes('sourceName') || selectedFields.includes('country');

  const cards = contacts.map(c => {
    const phone = c.phone || (c.cleanPhone ? `+${c.cleanPhone}` : '');

    let name = includeName ? (c.name || c.savedName || c.pushName || '').trim() : '';
    // N is Family;Given;Additional;Prefix;Suffix. Placeholders stay whole in Given.
    let family = '';
    let given = name;
    if (name) {
      ({ firstName: given, lastName: family } = splitDisplayName(name));
    } else if (phone) {
      name = given = `WA ${phone}`;
    } else {
      name = given = text.unnamed;
    }

    const lines = [
      'BEGIN:VCARD',
      'VERSION:3.0',
      `FN:${escapeVCardValue(name)}`,
      `N:${escapeVCardValue(family)};${escapeVCardValue(given)};;;`
    ];

    if (includePhone && phone) {
      lines.push(`TEL;TYPE=CELL,VOICE:${phone}`);
    }

    if (includeOrg && c.isBusiness) {
      lines.push(`ORG:${escapeVCardValue(text.organization)}`);
    }

    const categories = [];
    if (selectedFields.includes('sourceName') && c.sourceName) categories.push(c.sourceName);
    if (selectedFields.includes('isAdmin') && c.isAdmin) categories.push('Admin');
    if (selectedFields.includes('country') && c.country) categories.push(countryName(c, options.lang));

    if (categories.length > 0) {
      lines.push(`CATEGORIES:${categories.map(escapeVCardValue).join(',')}`);
    }

    if (includeNote && c.sourceName) {
      lines.push(`NOTE:${text.notePrefix}: ${escapeVCardValue(c.sourceName)}`);
    }

    lines.push('END:VCARD');
    return lines.join('\r\n');
  });

  return cards.join('\r\n');
}
