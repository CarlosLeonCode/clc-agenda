/**
 * Group metadata parser, collection normalizer, and participant extractor
 */

import { cleanPhoneNumber, parseContactDetails } from './phone.js';

/**
 * Extracts participant models from all WhatsApp Web collection formats:
 * - Backbone / Custom Collections with `_models` or `models`
 * - Plain arrays
 * - Nested `groupMetadata`
 * - Key-value objects / Maps
 */
export function extractParticipantsList(groupObj) {
  if (!groupObj) return [];
  const raw = groupObj.__x || groupObj;
  
  let parts = raw.participants || groupObj.participants;
  if (!parts && (raw.groupMetadata || groupObj.groupMetadata)) {
    const gm = raw.groupMetadata || groupObj.groupMetadata;
    const rawGm = gm.__x || gm;
    parts = rawGm.participants || gm.participants;
  }

  if (!parts) return [];

  // 1. Backbone Collection with `_models`
  if (parts._models && Array.isArray(parts._models)) {
    return parts._models.map(m => m.__x || m);
  }
  // 2. Backbone Collection with `models`
  if (parts.models && Array.isArray(parts.models)) {
    return parts.models.map(m => m.__x || m);
  }
  // 3. Plain Array
  if (Array.isArray(parts)) {
    return parts.map(m => m?.__x || m);
  }
  // 4. Map or Set
  if (parts instanceof Map || parts instanceof Set) {
    return Array.from(parts.values()).map(m => m?.__x || m);
  }
  // 5. Plain Object Dictionary
  if (typeof parts === 'object') {
    return Object.values(parts).map(m => m?.__x || m);
  }
  return [];
}

/**
 * Computes exact participant count safely across all WhatsApp Web formats
 */
export function getGroupParticipantCount(groupObj) {
  if (!groupObj) return 0;
  const parts = extractParticipantsList(groupObj);
  if (parts.length > 0) return parts.length;

  const raw = groupObj.__x || groupObj;
  const count = raw.participantCount || raw.participantsCount || raw.size || 
                raw.groupMetadata?.participantCount || raw.groupMetadata?.participantsCount ||
                raw.groupMetadata?.participants?.length;
  if (typeof count === 'number' && count > 0) return count;
  return 0;
}

/**
 * Resolves all participants of a group into normalized contact objects
 */
export function resolveGroupParticipants(groupObj, contactsDatabase = new Map()) {
  if (!groupObj) return [];
  const participants = extractParticipantsList(groupObj);
  const groupTitle = groupObj.subject || groupObj.name || groupObj.formattedTitle || 'Grupo';
  const results = [];
  const seenPhones = new Set();

  for (const p of participants) {
    const pId = p.id?._serialized || p.id || (typeof p === 'string' ? p : null);
    if (!pId) continue;

    const phone = cleanPhoneNumber(p.phoneNumber || p.phone || p.number || pId);
    if (!phone) continue;

    const storedContact = contactsDatabase.get(phone) || contactsDatabase.get(`${phone}@c.us`) || {};
    const merged = { ...p, ...storedContact };

    const isAdmin = Boolean(p.isAdmin || p.isSuperAdmin || p.admin);
    const parsed = parseContactDetails(merged, {
      isAdmin,
      source: 'Grupo',
      sourceName: groupTitle
    });

    if (parsed.cleanPhone && !seenPhones.has(parsed.cleanPhone)) {
      seenPhones.add(parsed.cleanPhone);
      results.push(parsed);
    }
  }

  return results;
}
