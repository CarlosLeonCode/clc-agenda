/**
 * JSON Exporter with Dynamic Field Selection
 */

import { resolveFields } from '../core/fields.js';

const DEFAULT_FIELDS = ['name', 'phone', 'cleanPhone', 'isMyContact', 'isAdmin', 'isBusiness', 'country', 'sourceName'];

export function exportToJSON(contacts = [], options = {}) {
  const activeFields = resolveFields(
    options.fields && options.fields.length > 0 ? options.fields : DEFAULT_FIELDS,
    options.lang
  );

  return JSON.stringify({
    metadata: {
      exportedAt: new Date().toISOString(),
      totalContacts: contacts.length,
      selectedFields: activeFields.map(f => f.id),
      generator: 'CLC Agenda'
    },
    contacts: contacts.map(c => {
      const item = {};
      for (const f of activeFields) {
        item[f.id] = f.getValue(c);
      }
      return item;
    })
  }, null, 2);
}
