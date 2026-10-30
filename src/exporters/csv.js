/**
 * CSV Exporter with Dynamic Column Selection & Formula Injection Protection
 */

import { resolveFields } from '../core/fields.js';

const DEFAULT_FIELDS = ['name', 'phone', 'isMyContact', 'isAdmin', 'sourceName'];

export function exportToCSV(contacts = [], options = {}) {
  const delimiter = options.delimiter || ',';
  const activeFields = resolveFields(
    options.fields && options.fields.length > 0 ? options.fields : DEFAULT_FIELDS,
    options.lang
  );

  const sanitizeCSVField = (val, isPhone = false) => {
    if (val === null || val === undefined) return '';
    let s = String(val);
    if (!isPhone && /^[=\-+@\t\r]/.test(s)) {
      s = "'" + s;
    }
    if (s.includes(delimiter) || s.includes('"') || s.includes('\n') || s.includes('\r')) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  };

  const headerLine = activeFields.map(f => sanitizeCSVField(f.shortHeader)).join(delimiter);

  const rows = contacts.map(c => {
    return activeFields.map(f => sanitizeCSVField(f.getValue(c), f.isPhone)).join(delimiter);
  });

  return '﻿' + [headerLine, ...rows].join('\r\n');
}
