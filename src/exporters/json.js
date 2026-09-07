/**
 * JSON Exporter with Dynamic Field Selection
 */

import { FIELD_DEFINITIONS } from './csv.js';

export function exportToJSON(contacts = [], options = {}) {
  const selectedFields = (options.fields && options.fields.length > 0)
    ? options.fields.filter(f => FIELD_DEFINITIONS[f])
    : ['name', 'phone', 'cleanPhone', 'isMyContact', 'isAdmin', 'isBusiness', 'country', 'source', 'sourceName'];

  const metadata = options.metadata || {};

  const payload = {
    metadata: {
      exportedAt: new Date().toISOString(),
      totalContacts: contacts.length,
      fields: selectedFields,
      generator: 'WA Contact Extractor Pro',
      ...metadata
    },
    contacts: contacts.map(c => {
      const obj = {};
      for (const f of selectedFields) {
        if (f === 'name') obj.name = c.name || c.savedName || c.pushName || '';
        else if (f === 'phone') obj.phone = c.phone || (c.cleanPhone ? `+${c.cleanPhone}` : '');
        else if (f === 'cleanPhone') obj.cleanPhone = c.cleanPhone || '';
        else if (f === 'isMyContact') obj.isMyContact = Boolean(c.isMyContact);
        else if (f === 'isAdmin') obj.isAdmin = Boolean(c.isAdmin);
        else if (f === 'isBusiness') obj.isBusiness = Boolean(c.isBusiness);
        else if (f === 'country') obj.country = c.country || 'Desconocido';
        else if (f === 'source') obj.source = c.source || 'Todos';
        else if (f === 'sourceName') obj.sourceName = c.sourceName || '';
        else if (f === 'id') obj.id = c.id || '';
      }
      return obj;
    })
  };

  return JSON.stringify(payload, null, 2);
}
