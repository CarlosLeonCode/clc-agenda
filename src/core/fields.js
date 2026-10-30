/**
 * Export field definitions shared by the exporters and the overlay table,
 * in Spanish (default, what shipped first) and English.
 */

import { countryName } from './phone.js';

const displayName = c => c.name || c.savedName || c.pushName || '';
const displayPhone = c => c.phone || (c.cleanPhone ? `+${c.cleanPhone}` : '');

// [checkbox label, column header] per field, plus the display values
const TEXT = {
  es: {
    name: ['Nombre', 'Nombre'],
    phone: ['Teléfono con código de país', 'Teléfono'],
    cleanPhone: ['Teléfono solo dígitos', 'Solo Números'],
    isMyContact: ['En agenda', 'En Agenda'],
    isAdmin: ['Rol en el grupo', 'Rol'],
    isBusiness: ['Tipo de cuenta', 'Tipo Cuenta'],
    country: ['País', 'País'],
    sourceName: ['Origen', 'Origen'],
    id: ['ID de WhatsApp', 'WhatsApp ID'],
    yes: 'Sí', no: 'No', admin: 'Admin', member: 'Miembro', business: 'Empresa', personal: 'Personal',
    unknown: 'Desconocido'
  },
  en: {
    name: ['Name', 'Name'],
    phone: ['Phone with country code', 'Phone'],
    cleanPhone: ['Phone digits only', 'Digits Only'],
    isMyContact: ['Saved in contacts', 'Saved'],
    isAdmin: ['Group role', 'Role'],
    isBusiness: ['Account type', 'Account Type'],
    country: ['Country', 'Country'],
    sourceName: ['Source', 'Source'],
    id: ['WhatsApp ID', 'WhatsApp ID'],
    yes: 'Yes', no: 'No', admin: 'Admin', member: 'Member', business: 'Business', personal: 'Personal',
    unknown: 'Unknown'
  }
};

// Fallback names the page engine writes in Spanish (sources and untitled chats)
const ENGINE_TEXT_EN = {
  Todos: 'All',
  Grupo: 'Group',
  Etiqueta: 'Label',
  Chats: 'Chats',
  'Chats Archivados': 'Archived chats',
  'Chat Individual': 'Direct chat',
  'Chat Individual (Archivado)': 'Direct chat (archived)',
  'Grupo WhatsApp': 'WhatsApp group',
  'Grupo sin título': 'Untitled group'
};

/** Translates the engine's Spanish fallback names; user data passes through untouched. */
export function localizeSourceText(text, lang = 'es') {
  if (lang !== 'en' || !text) return text;
  if (ENGINE_TEXT_EN[text]) return ENGINE_TEXT_EN[text];
  const label = /^Etiqueta #?(.+)$/.exec(text);
  return label ? `Label ${label[1]}` : text;
}

function buildFields(lang) {
  const t = TEXT[lang] || TEXT.es;
  const row = (id, isPhone, isDefault, getValue) => ({ id, label: t[id][0], shortHeader: t[id][1], isPhone, default: isDefault, getValue });
  return [
    row('name', false, true, displayName),
    row('phone', true, true, displayPhone),
    row('cleanPhone', true, false, c => c.cleanPhone || ''),
    row('isMyContact', false, false, c => (c.isMyContact ? t.yes : t.no)),
    row('isAdmin', false, false, c => (c.isAdmin ? t.admin : t.member)),
    row('isBusiness', false, false, c => (c.isBusiness ? t.business : t.personal)),
    row('country', false, false, c => countryName(c, lang) || t.unknown),
    row('sourceName', false, false, c => localizeSourceText(c.sourceName || c.source || 'Todos', lang)),
    row('id', false, false, c => c.id || '')
  ];
}

const FIELDS_BY_LANG = { es: buildFields('es'), en: buildFields('en') };

export function getFieldDefinitions(lang = 'es') {
  return FIELDS_BY_LANG[lang] || FIELDS_BY_LANG.es;
}

export const FIELD_DEFINITIONS = FIELDS_BY_LANG.es;

export const FIELD_MAP = new Map(FIELD_DEFINITIONS.map(f => [f.id, f]));

/** Resolve field ids to definitions, keeping the given order and dropping unknown ids. */
export function resolveFields(fieldIds = [], lang = 'es') {
  const byId = new Map(getFieldDefinitions(lang).map(f => [f.id, f]));
  return fieldIds.map(id => byId.get(id)).filter(Boolean);
}
