/**
 * vCard 3.0 Exporter for phone address books
 */

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
  const includeName = selectedFields.includes('name');
  const includePhone = selectedFields.includes('phone') || selectedFields.includes('cleanPhone');
  const includeOrg = selectedFields.includes('isBusiness');
  const includeNote = selectedFields.includes('sourceName') || selectedFields.includes('country');

  const cards = contacts.map(c => {
    const phone = c.phone || (c.cleanPhone ? `+${c.cleanPhone}` : '');

    let name = includeName ? (c.name || c.savedName || c.pushName || '').trim() : '';
    if (!name && phone) {
      name = `WA ${phone}`;
    } else if (!name) {
      name = 'Contacto WhatsApp';
    }

    const lines = [
      'BEGIN:VCARD',
      'VERSION:3.0',
      `FN:${escapeVCardValue(name)}`,
      `N:${escapeVCardValue(name)};;;;`
    ];

    if (includePhone && phone) {
      lines.push(`TEL;TYPE=CELL,VOICE:${phone}`);
    }

    if (includeOrg && c.isBusiness) {
      lines.push('ORG:Empresa WhatsApp');
    }

    const categories = [];
    if (selectedFields.includes('sourceName') && c.sourceName) categories.push(c.sourceName);
    if (selectedFields.includes('isAdmin') && c.isAdmin) categories.push('Admin');
    if (selectedFields.includes('country') && c.country) categories.push(c.country);

    if (categories.length > 0) {
      lines.push(`CATEGORIES:${categories.map(escapeVCardValue).join(',')}`);
    }

    if (includeNote && c.sourceName) {
      lines.push(`NOTE:Extraído de: ${escapeVCardValue(c.sourceName)}`);
    }

    lines.push('END:VCARD');
    return lines.join('\r\n');
  });

  return cards.join('\r\n');
}
