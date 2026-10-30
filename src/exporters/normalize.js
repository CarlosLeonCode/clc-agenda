// Organization and note follow the export language; Spanish is the default
export const EXPORT_TEXT = {
  es: { organization: 'Empresa WhatsApp', notePrefix: 'Extraído de', unnamed: 'Contacto WhatsApp' },
  en: { organization: 'WhatsApp Business', notePrefix: 'Exported from', unnamed: 'WhatsApp contact' }
};

/** Normalize the contact shape shared by CSV and vCard exporters. */
export function normalizeContact(contact = {}, lang = 'es') {
  const text = EXPORT_TEXT[lang] || EXPORT_TEXT.es;
  const displayName = String(contact.name || contact.savedName || contact.pushName || '').trim();
  const rawPhone = String(contact.phone || contact.cleanPhone || '').trim();
  const cleanPhone = String(contact.cleanPhone || rawPhone).replace(/[^\d]/g, '');
  const phone = cleanPhone ? `+${cleanPhone}` : (rawPhone.startsWith('+') ? rawPhone : '');
  const source = String(contact.sourceName || contact.source || '').trim();

  return {
    displayName,
    phone,
    cleanPhone,
    organization: contact.isBusiness ? text.organization : '',
    note: source ? `${text.notePrefix}: ${source}` : '',
    labels: source ? [source] : []
  };
}

export function splitDisplayName(displayName = '') {
  const parts = displayName.trim().split(/\s+/).filter(Boolean);
  if (parts.length < 2) return { firstName: parts[0] || '', lastName: '' };
  return { firstName: parts.slice(0, -1).join(' '), lastName: parts.at(-1) };
}
