/** Normalize the contact shape shared by CSV and vCard exporters. */
export function normalizeContact(contact = {}) {
  const displayName = String(contact.name || contact.savedName || contact.pushName || '').trim();
  const rawPhone = String(contact.phone || contact.cleanPhone || '').trim();
  const cleanPhone = String(contact.cleanPhone || rawPhone).replace(/[^\d]/g, '');
  const phone = cleanPhone ? `+${cleanPhone}` : (rawPhone.startsWith('+') ? rawPhone : '');
  const source = String(contact.sourceName || contact.source || '').trim();

  return {
    displayName,
    phone,
    cleanPhone,
    organization: contact.isBusiness ? 'Empresa WhatsApp' : '',
    note: source ? `Extraído de: ${source}` : '',
    labels: source ? [source] : []
  };
}

export function splitDisplayName(displayName = '') {
  const parts = displayName.trim().split(/\s+/).filter(Boolean);
  if (parts.length < 2) return { firstName: parts[0] || '', lastName: '' };
  return { firstName: parts.slice(0, -1).join(' '), lastName: parts.at(-1) };
}
