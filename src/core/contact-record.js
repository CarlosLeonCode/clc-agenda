/**
 * Merges raw WhatsApp contact/chat records into one aggregated contact entry
 */

import { cleanPhoneNumber, isLid, sanitizeName } from './phone.js';

export function mergeContactRecord(target, source) {
  if (!source) return target;
  const raw = source.__x || source;

  const phone = cleanPhoneNumber(raw.phoneNumber || raw.phone || raw.number || raw.userJid || raw.phoneJid || (raw.id && !isLid(raw.id) ? raw.id : null));
  if (phone && !target.phone) {
    target.phone = phone;
  }

  const savedName = sanitizeName(
    raw.name || raw.displayName || raw.formattedName || raw.shortName || (raw.contact ? raw.contact.name || raw.contact.displayName : null),
    target.phone || phone
  );
  if (savedName && !target.savedName) {
    target.savedName = savedName;
  }

  const pushName = sanitizeName(
    raw.pushname || raw.pushName || raw.notifyName || raw.verifiedName || raw.formattedTitle || raw.searchName || raw.header || (raw.contact ? raw.contact.pushname || raw.contact.notifyName || raw.contact.verifiedName : null),
    target.phone || phone
  );
  if (pushName && !target.pushName) {
    target.pushName = pushName;
  }

  if (raw.isBusiness || raw.isEnterprise || raw.verifiedLevel > 0) {
    target.isBusiness = true;
  }
  if (raw.isMyContact || raw.isAddressBookContact || savedName) {
    target.isMyContact = true;
  }
  if (raw.archive || raw.archived || raw.isArchived || raw.__x_archive || raw.unreadArchive) {
    target.isArchived = true;
  }
  if (raw.lid) {
    target.lid = raw.lid?._serialized || raw.lid;
  }

  return target;
}
