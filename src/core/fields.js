/**
 * Export field definitions shared by the exporters and the overlay table
 */

const displayName = c => c.name || c.savedName || c.pushName || '';
const displayPhone = c => c.phone || (c.cleanPhone ? `+${c.cleanPhone}` : '');

export const FIELD_DEFINITIONS = [
  { id: 'name', label: 'Nombre', shortHeader: 'Nombre', isPhone: false, default: true, getValue: displayName },
  { id: 'phone', label: 'Teléfono con código de país', shortHeader: 'Teléfono', isPhone: true, default: true, getValue: displayPhone },
  { id: 'cleanPhone', label: 'Teléfono solo dígitos', shortHeader: 'Solo Números', isPhone: true, default: false, getValue: c => c.cleanPhone || '' },
  { id: 'isMyContact', label: 'En agenda', shortHeader: 'En Agenda', isPhone: false, default: false, getValue: c => c.isMyContact ? 'Sí' : 'No' },
  { id: 'isAdmin', label: 'Rol en el grupo', shortHeader: 'Rol', isPhone: false, default: false, getValue: c => c.isAdmin ? 'Admin' : 'Miembro' },
  { id: 'isBusiness', label: 'Tipo de cuenta', shortHeader: 'Tipo Cuenta', isPhone: false, default: false, getValue: c => c.isBusiness ? 'Empresa' : 'Personal' },
  { id: 'country', label: 'País', shortHeader: 'País', isPhone: false, default: false, getValue: c => c.country || 'Desconocido' },
  { id: 'sourceName', label: 'Origen', shortHeader: 'Origen', isPhone: false, default: false, getValue: c => c.sourceName || c.source || 'Todos' },
  { id: 'id', label: 'ID de WhatsApp', shortHeader: 'WhatsApp ID', isPhone: false, default: false, getValue: c => c.id || '' }
];

export const FIELD_MAP = new Map(FIELD_DEFINITIONS.map(f => [f.id, f]));

/** Resolve field ids to definitions, keeping the given order and dropping unknown ids. */
export function resolveFields(fieldIds = []) {
  return fieldIds.map(id => FIELD_MAP.get(id)).filter(Boolean);
}
