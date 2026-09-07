function escapeVCardValue(value) {
  if (!value) return '';
  return String(value)
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}

export function exportToVCard(contacts = [], options = {}) {
  const selectedFields = options.fields || ['name', 'phone'];
  const includePhone = selectedFields.includes('phone') || selectedFields.includes('cleanPhone');
  const includeName = selectedFields.includes('name');
  const includeOrg = selectedFields.includes('isBusiness') || selectedFields.includes('sourceName');
  const includeNote = selectedFields.includes('source') || selectedFields.includes('sourceName') || selectedFields.includes('country');

  const cards = contacts.map(c => {
    const rawNumber = c.cleanPhone || '';
    const phoneWithPlus = rawNumber.startsWith('+') ? rawNumber : `+${rawNumber}`;

    let displayName = '';
    if (includeName) {
      displayName = (c.name || c.savedName || c.pushName || '').trim();
    }
    if (!displayName && phoneWithPlus) {
      displayName = `WA ${phoneWithPlus}`;
    } else if (!displayName) {
      displayName = 'Contacto WhatsApp';
    }

    const lines = [
      'BEGIN:VCARD',
      'VERSION:3.0',
      `FN:${escapeVCardValue(displayName)}`,
      `N:${escapeVCardValue(displayName)};;;;`
    ];

    if (includePhone && (c.phone || c.cleanPhone)) {
      lines.push(`TEL;TYPE=CELL,VOICE:${phoneWithPlus}`);
    }

    if (includeOrg && c.isBusiness) {
      lines.push(`ORG:Empresa WhatsApp`);
    }

    const categories = [];
    if (c.sourceName && selectedFields.includes('sourceName')) categories.push(c.sourceName);
    if (c.isAdmin && selectedFields.includes('isAdmin')) categories.push('Admin');
    if (c.country && selectedFields.includes('country')) categories.push(c.country);

    if (categories.length > 0) {
      lines.push(`CATEGORIES:${categories.map(escapeVCardValue).join(',')}`);
    }

    if (includeNote && c.sourceName) {
      lines.push(`NOTE:${escapeVCardValue('Extraído de: ' + c.sourceName)}`);
    }

    lines.push('END:VCARD');
    return lines.join('\r\n');
  });

  return cards.join('\r\n');
}
