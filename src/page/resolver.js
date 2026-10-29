import { cleanPhoneNumber, isLid, detectCountry } from '../core/phone.js';
import { mergeContactRecord } from '../core/contact-record.js';
import { findSuffixMatch } from '../core/suffix-match.js';

/**
 * Resolves contact with exact match, suffix match, and live Store hydration
 */
export async function buildResolvedContact(initialData, dataBundle, extra = {}) {
  let phone = '';
  const raw = initialData.__x || initialData;
  const rawId = raw.id?._serialized || raw.id || raw.jid || (typeof initialData === 'string' ? initialData : '');

  phone = cleanPhoneNumber(raw.phoneNumber || raw.phone || raw.number || raw.userJid || raw.phoneJid);

  if (!phone && rawId && dataBundle?.lidMap) {
    if (dataBundle.lidMap.has(rawId)) {
      phone = dataBundle.lidMap.get(rawId);
    }
  }

  if (!phone && rawId && !isLid(rawId)) {
    phone = cleanPhoneNumber(rawId);
  }

  if (!phone || phone.length < 7 || phone.length > 16) {
    return null;
  }

  const aggregated = {
    phone: phone,
    savedName: '',
    pushName: '',
    isMyContact: false,
    isBusiness: false,
    isArchived: Boolean(raw.isArchived || raw.archive || raw.archived)
  };

  // 1. Initial Data
  mergeContactRecord(aggregated, raw);

  // 2. Exact phone match in contactsByPhone
  if (dataBundle?.contactsByPhone && dataBundle.contactsByPhone.has(phone)) {
    mergeContactRecord(aggregated, dataBundle.contactsByPhone.get(phone));
  }

  // 3. Suffix match: same number stored in national format
  if ((!aggregated.savedName && !aggregated.pushName) && dataBundle?.contactsBySuffix) {
    const localMatch = findSuffixMatch(dataBundle.contactsBySuffix, phone);
    if (localMatch) mergeContactRecord(aggregated, localMatch);
  }

  // 4. Multi-device keys in contactsById
  const cusKeys = [`${phone}@c.us`, `${phone}:0@c.us`, `${phone}:1@c.us`, `${phone}@s.whatsapp.net`];
  for (const k of cusKeys) {
    if (dataBundle?.contactsById && dataBundle.contactsById.has(k)) {
      mergeContactRecord(aggregated, dataBundle.contactsById.get(k));
    }
  }

  // 5. LID ID in contactsById
  if (dataBundle?.lidMap && dataBundle.lidMap.has(phone)) {
    const lidId = dataBundle.lidMap.get(phone);
    if (dataBundle?.contactsById && dataBundle.contactsById.has(lidId)) {
      mergeContactRecord(aggregated, dataBundle.contactsById.get(lidId));
    }
  }

  // 6. Live Store Hydration
  if (!aggregated.savedName && window.Store) {
    try {
      if (window.Store.Contact) {
        const direct = window.Store.Contact.get(`${phone}@c.us`) || (rawId ? window.Store.Contact.get(rawId) : null);
        if (direct) {
          mergeContactRecord(aggregated, direct);
        } else if (window.Store.Contact.find) {
          try {
            const found = await window.Store.Contact.find(rawId || `${phone}@c.us`);
            if (found) mergeContactRecord(aggregated, found);
          } catch (e) {}
        }
      }
      if (window.Store.Chat) {
        const sch = window.Store.Chat.get(`${phone}@c.us`);
        if (sch) mergeContactRecord(aggregated, sch);
      }
    } catch (e) {}
  }

  const finalName = aggregated.savedName || aggregated.pushName || '';
  const country = detectCountry(phone);

  return {
    id: rawId || `${phone}@c.us`,
    name: finalName,
    savedName: aggregated.savedName,
    pushName: aggregated.pushName,
    phone: `+${phone}`,
    cleanPhone: phone,
    country: country.country,
    countryIso: country.iso,
    isMyContact: Boolean(aggregated.isMyContact || aggregated.savedName),
    isAdmin: Boolean(extra.isAdmin || raw.isAdmin || raw.isSuperAdmin || raw.admin),
    isBusiness: Boolean(aggregated.isBusiness),
    isArchived: Boolean(extra.isArchived || aggregated.isArchived || raw.isArchived || raw.archive || raw.archived),
    labels: extra.labels || [],
    source: extra.source || 'Todos',
    sourceName: extra.sourceName || ''
  };
}

/**
 * Resolves Active Open Group from WhatsApp Web DOM or Store
 */
export function findActiveOpenGroup(dataBundle) {
  if (window.Store && window.Store.Chat) {
    try {
      if (window.Store.Chat.getActive) {
        const active = window.Store.Chat.getActive();
        if (active) {
          const rawId = active.id?._serialized || active.id;
          if (rawId && rawId.includes('@g.us')) return rawId;
        }
      }
      if (window.Store.Chat.active) {
        const active = window.Store.Chat.active;
        const rawId = active.id?._serialized || active.id;
        if (rawId && rawId.includes('@g.us')) return rawId;
      }
      const models = window.Store.Chat._models || window.Store.Chat.models || [];
      const activeM = models.find(c => c.active || c.__x?.active);
      if (activeM) {
        const rawId = activeM.id?._serialized || activeM.id;
        if (rawId && rawId.includes('@g.us')) return rawId;
      }
    } catch (e) {}
  }

  const headerTitleEl = document.querySelector('#main header span[title]') || document.querySelector('#main header [dir="auto"]');
  if (headerTitleEl) {
    const headerTitle = (headerTitleEl.getAttribute('title') || headerTitleEl.textContent || '').trim().toLowerCase();
    if (headerTitle && dataBundle?.groups) {
      for (const [id, g] of dataBundle.groups.entries()) {
        const title = (g.subject || g.name || g.formattedTitle || '').trim().toLowerCase();
        if (title && (title === headerTitle || headerTitle.includes(title))) {
          return id;
        }
      }
    }
  }

  return null;
}
