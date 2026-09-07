/**
 * CSV Exporter with Dynamic Column Selection & Formula Injection Protection
 */

export const FIELD_DEFINITIONS = {
  name: { label: 'Nombre', isPhone: false, get: c => c.name || c.savedName || c.pushName || '' },
  phone: { label: 'Teléfono', isPhone: true, get: c => c.phone || (c.cleanPhone ? `+${c.cleanPhone}` : '') },
  cleanPhone: { label: 'Teléfono (Solo Números)', isPhone: true, get: c => c.cleanPhone || '' },
  isMyContact: { label: 'En Agenda', isPhone: false, get: c => c.isMyContact ? 'Sí' : 'No' },
  isAdmin: { label: 'Rol', isPhone: false, get: c => c.isAdmin ? 'Admin' : 'Miembro' },
  isBusiness: { label: 'Tipo Cuenta', isPhone: false, get: c => c.isBusiness ? 'Empresa' : 'Personal' },
  country: { label: 'País', isPhone: false, get: c => c.country || 'Desconocido' },
  source: { label: 'Origen', isPhone: false, get: c => c.source || 'Todos' },
  sourceName: { label: 'Detalle Origen', isPhone: false, get: c => c.sourceName || '' },
  id: { label: 'WhatsApp ID', isPhone: false, get: c => c.id || '' }
};

export function exportToCSV(contacts = [], options = {}) {
  const delimiter = options.delimiter || ',';
  const selectedFields = (options.fields && options.fields.length > 0)
    ? options.fields.filter(f => FIELD_DEFINITIONS[f])
    : ['name', 'phone', 'isMyContact', 'isAdmin', 'source', 'sourceName'];

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

  const headers = selectedFields.map(f => FIELD_DEFINITIONS[f].label);
  const headerLine = headers.map(h => sanitizeCSVField(h)).join(delimiter);

  const rows = contacts.map(c => {
    return selectedFields.map(f => {
      const fieldDef = FIELD_DEFINITIONS[f];
      const val = fieldDef.get(c);
      return sanitizeCSVField(val, fieldDef.isPhone);
    }).join(delimiter);
  });

  return '\uFEFF' + [headerLine, ...rows].join('\r\n');
}
