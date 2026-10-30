/**
 * Phone number normalization, E.164 validation, LID resolution, and robust Name parsing
 */

export const COUNTRY_CODES = [
  { prefix: '1', country: 'Estados Unidos / Canadá', iso: 'US' },
  { prefix: '34', country: 'España', iso: 'ES' },
  { prefix: '54', country: 'Argentina', iso: 'AR' },
  { prefix: '52', country: 'México', iso: 'MX' },
  { prefix: '57', country: 'Colombia', iso: 'CO' },
  { prefix: '56', country: 'Chile', iso: 'CL' },
  { prefix: '51', country: 'Perú', iso: 'PE' },
  { prefix: '58', country: 'Venezuela', iso: 'VE' },
  { prefix: '593', country: 'Ecuador', iso: 'EC' },
  { prefix: '502', country: 'Guatemala', iso: 'GT' },
  { prefix: '503', country: 'El Salvador', iso: 'SV' },
  { prefix: '504', country: 'Honduras', iso: 'HN' },
  { prefix: '505', country: 'Nicaragua', iso: 'NI' },
  { prefix: '506', country: 'Costa Rica', iso: 'CR' },
  { prefix: '507', country: 'Panamá', iso: 'PA' },
  { prefix: '591', country: 'Bolivia', iso: 'BO' },
  { prefix: '595', country: 'Paraguay', iso: 'PY' },
  { prefix: '598', country: 'Uruguay', iso: 'UY' },
  { prefix: '55', country: 'Brasil', iso: 'BR' },
  { prefix: '44', country: 'Reino Unido', iso: 'GB' },
  { prefix: '33', country: 'Francia', iso: 'FR' },
  { prefix: '49', country: 'Alemania', iso: 'DE' },
  { prefix: '39', country: 'Italia', iso: 'IT' },
  { prefix: '351', country: 'Portugal', iso: 'PT' }
];

export function isLid(jidOrId) {
  if (!jidOrId) return false;
  const str = String(jidOrId);
  return str.includes('@lid') || str.includes('_lid') || str.endsWith(':0@lid');
}

export function cleanPhoneNumber(raw) {
  if (!raw) return '';
  let str = String(raw).trim();
  
  if (str.includes('@broadcast') || str.includes('@newsletter') || str.includes('status@')) {
    return '';
  }

  if (isLid(str) && !str.includes('@c.us') && !str.includes('@s.whatsapp.net')) {
    return '';
  }

  str = str.replace(/(\.\d+)?:\d+@/, '@');
  str = str.replace(/@.*$/, '');
  str = str.replace(/(\.\d+)?:\d+$/, '');

  const digits = str.replace(/\D/g, '');

  if (digits.length >= 7 && digits.length <= 16) {
    return digits;
  }
  return '';
}

export function detectCountry(cleanNumber) {
  if (!cleanNumber) return { country: 'Desconocido', iso: '??', prefix: '' };
  
  const sorted = [...COUNTRY_CODES].sort((a, b) => b.prefix.length - a.prefix.length);
  for (const item of sorted) {
    if (cleanNumber.startsWith(item.prefix)) {
      return item;
    }
  }
  return { country: 'Internacional', iso: 'INTL', prefix: '' };
}

// English names by ISO code; the engine stores the Spanish name in `country`
const COUNTRY_NAMES_EN = {
  US: 'United States / Canada', ES: 'Spain', AR: 'Argentina', MX: 'Mexico', CO: 'Colombia', CL: 'Chile',
  PE: 'Peru', VE: 'Venezuela', EC: 'Ecuador', GT: 'Guatemala', SV: 'El Salvador', HN: 'Honduras',
  NI: 'Nicaragua', CR: 'Costa Rica', PA: 'Panama', BO: 'Bolivia', PY: 'Paraguay', UY: 'Uruguay',
  BR: 'Brazil', GB: 'United Kingdom', FR: 'France', DE: 'Germany', IT: 'Italy', PT: 'Portugal',
  INTL: 'International', '??': 'Unknown'
};

/** Country name in the requested language ('' when the contact has none). */
export function countryName(contact = {}, lang = 'es') {
  if (lang !== 'en') return contact.country || '';
  const iso = contact.countryIso || COUNTRY_CODES.find(c => c.country === contact.country)?.iso
    || { Desconocido: '??', Internacional: 'INTL' }[contact.country];
  return COUNTRY_NAMES_EN[iso] || contact.country || '';
}

export function formatInternationalPhone(cleanNumber) {
  if (!cleanNumber) return '';
  return `+${cleanNumber}`;
}

export function sanitizeName(nameStr, phone) {
  if (!nameStr || typeof nameStr !== 'string') return '';
  let str = nameStr.trim();
  if (str.startsWith('~')) str = str.substring(1).trim();

  if (str === phone || str === `+${phone}` || cleanPhoneNumber(str) === phone) {
    return '';
  }
  return str;
}

export function parseContactDetails(rawContact, extra = {}) {
  let phone = '';

  if (rawContact.phoneNumber && typeof rawContact.phoneNumber === 'string') {
    phone = cleanPhoneNumber(rawContact.phoneNumber);
  }
  if (!phone && rawContact.phone) {
    phone = cleanPhoneNumber(rawContact.phone);
  }
  if (!phone && rawContact.number) {
    phone = cleanPhoneNumber(rawContact.number);
  }
  if (!phone && rawContact.userJid) {
    phone = cleanPhoneNumber(rawContact.userJid);
  }
  if (!phone && rawContact.phoneJid) {
    phone = cleanPhoneNumber(rawContact.phoneJid);
  }

  const rawId = rawContact.id?._serialized || rawContact.id || rawContact.jid || '';
  if (!phone && rawId && !isLid(rawId)) {
    phone = cleanPhoneNumber(rawId);
  }

  let savedName = sanitizeName(
    rawContact.name || rawContact.displayName || rawContact.formattedName || rawContact.shortName,
    phone
  );

  let pushName = sanitizeName(
    rawContact.pushname || rawContact.pushName || rawContact.notifyName || rawContact.verifiedName || rawContact.formattedTitle || rawContact.searchName || rawContact.header,
    phone
  );

  let name = savedName || pushName || '';
  const isMyContact = Boolean(savedName || rawContact.isMyContact || rawContact.isAddressBookContact);
  const country = detectCountry(phone);

  return {
    id: rawId || (phone ? `${phone}@c.us` : ''),
    name: name,
    savedName: savedName,
    pushName: pushName,
    phone: phone ? `+${phone}` : '',
    cleanPhone: phone,
    country: country.country,
    countryIso: country.iso,
    isMyContact: isMyContact,
    isAdmin: Boolean(extra.isAdmin || rawContact.isAdmin || rawContact.isSuperAdmin || rawContact.admin),
    isBusiness: Boolean(rawContact.isBusiness || rawContact.isEnterprise || rawContact.verifiedLevel > 0),
    labels: extra.labels || rawContact.labels || [],
    source: extra.source || 'Todos',
    sourceName: extra.sourceName || ''
  };
}
