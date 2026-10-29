import { cleanPhoneNumber, isLid } from '../core/phone.js';
import { extractParticipantsList } from '../core/groups.js';
import { mergeContactRecord } from '../core/contact-record.js';
import { addToSuffixIndex } from '../core/suffix-match.js';
import { initWebpackStore, store } from './webpack-store.js';
import { openDatabase, getAllFromStore } from './indexeddb.js';

let cachedDbData = null;
let lastScanTime = 0;

/**
 * Multi-indexed database scan
 */
export async function scanAllIndexedDB(force = false) {
  initWebpackStore();
  const now = Date.now();
  if (!force && cachedDbData && (now - lastScanTime < 10000)) {
    return cachedDbData;
  }

  const result = {
    contactsById: new Map(),
    contactsByPhone: new Map(),
    contactsBySuffix: new Map(),
    lidMap: new Map(),
    groups: new Map(),
    labels: new Map(),
    labelAssociations: [],
    chats: new Map(),
    groupMessages: new Map()
  };

  function indexRecord(record) {
    if (!record) return;
    const raw = record.__x || record;
    const id = raw.id?._serialized || raw.id || raw.jid;
    const phone = cleanPhoneNumber(raw.phoneNumber || raw.phone || raw.number || raw.userJid || raw.phoneJid || (id && !isLid(id) ? id : null));
    const lid = raw.lid?._serialized || raw.lid || (isLid(id) ? id : null);

    if (id) {
      result.contactsById.set(String(id), { ...result.contactsById.get(String(id)), ...raw });
    }

    if (lid && phone) {
      result.lidMap.set(String(lid), phone);
      result.lidMap.set(String(phone), String(lid));
    }

    if (phone) {
      let entry = result.contactsByPhone.get(phone);
      if (!entry) {
        entry = { phone: phone, savedName: '', pushName: '', isMyContact: false, isBusiness: false, isArchived: false };
        result.contactsByPhone.set(phone, entry);
      }
      mergeContactRecord(entry, raw);

      addToSuffixIndex(result.contactsBySuffix, entry);
    }
  }

  try {
    let dbList = [];
    if (indexedDB.databases) {
      dbList = await indexedDB.databases();
    } else {
      dbList = [{ name: 'model-storage' }, { name: 'wawc' }, { name: 'wawc_db_enc' }];
    }

    for (const dbInfo of dbList) {
      if (!dbInfo.name) continue;
      try {
        const db = await openDatabase(dbInfo.name);
        if (!db) continue;

        // 1. Contacts
        const contactStores = ['contact', 'contacts', 'model-storage-contact', 'user', 'profile'];
        for (const s of contactStores) {
          if (db.objectStoreNames.contains(s)) {
            const records = await getAllFromStore(db, s);
            for (const r of records) indexRecord(r);
          }
        }

        // 2. LID Mappings
        const lidStores = ['lid-map', 'lid-mapping', 'lid_mapping', 'lid'];
        for (const s of lidStores) {
          if (db.objectStoreNames.contains(s)) {
            const records = await getAllFromStore(db, s);
            for (const r of records) {
              const lid = r.lid || r.id?._serialized || r.id;
              const jid = r.jid || r.phoneNumber || r.phone;
              const phone = cleanPhoneNumber(jid);
              if (lid && phone) {
                result.lidMap.set(String(lid), phone);
                result.lidMap.set(String(phone), String(lid));
              }
            }
          }
        }

        // 3. Group Metadata & Participants
        const groupStores = ['group-metadata', 'group_metadata', 'groups', 'community', 'participant', 'participants'];
        for (const s of groupStores) {
          if (db.objectStoreNames.contains(s)) {
            const records = await getAllFromStore(db, s);
            for (const r of records) {
              const id = r.id?._serialized || r.id;
              if (id && typeof id === 'string' && id.includes('@g.us')) {
                const isArchived = Boolean(r.archive || r.archived || r.isArchived || r.__x_archive);
                result.groups.set(id, { ...result.groups.get(id), ...r, isArchived });
                const parts = extractParticipantsList(r);
                for (const p of parts) indexRecord(p);
              }
            }
          }
        }

        // 4. Labels
        const labelStores = ['label', 'labels'];
        for (const s of labelStores) {
          if (db.objectStoreNames.contains(s)) {
            const records = await getAllFromStore(db, s);
            for (const r of records) {
              const id = r.id?._serialized || r.id;
              if (id) result.labels.set(String(id), r);
            }
          }
        }

        // 5. Label Associations
        const assocStores = ['label-association', 'label_association', 'label-item'];
        for (const s of assocStores) {
          if (db.objectStoreNames.contains(s)) {
            const records = await getAllFromStore(db, s);
            result.labelAssociations.push(...records);
          }
        }

        // 6. Chats
        const chatStores = ['chat', 'chats'];
        for (const s of chatStores) {
          if (db.objectStoreNames.contains(s)) {
            const records = await getAllFromStore(db, s);
            for (const r of records) {
              const id = r.id?._serialized || r.id;
              if (id && typeof id === 'string') {
                const isArchived = Boolean(r.archive || r.archived || r.isArchived || r.__x_archive || r.unreadArchive);
                const chatRecord = { ...result.chats.get(id), ...r, isArchived };
                result.chats.set(id, chatRecord);

                if (id.includes('@g.us')) {
                  if (!result.groups.has(id)) {
                    result.groups.set(id, {
                      id: id,
                      subject: r.name || r.formattedTitle || r.subject || 'Grupo',
                      isArchived: isArchived,
                      participants: extractParticipantsList(r)
                    });
                  }
                } else {
                  indexRecord(chatRecord);
                }
              }
            }
          }
        }

        // 7. Messages (to discover group participants who posted)
        const msgStores = ['message', 'messages'];
        for (const s of msgStores) {
          if (db.objectStoreNames.contains(s)) {
            const records = await getAllFromStore(db, s);
            for (const m of records) {
              const to = m.to?._serialized || m.to;
              const author = m.author?._serialized || m.author || m.participant?._serialized || m.participant;
              if (to && typeof to === 'string' && to.includes('@g.us') && author) {
                let groupSet = result.groupMessages.get(to);
                if (!groupSet) {
                  groupSet = new Set();
                  result.groupMessages.set(to, groupSet);
                }
                groupSet.add(author);
              }
            }
          }
        }

        db.close();
      } catch (dbErr) {
        console.warn('[WA Extractor] DB inspect warning:', dbInfo.name, dbErr);
      }
    }
  } catch (e) {
    console.error('[WA Extractor] Error scanning IndexedDB:', e);
  }

  try {
    enrichFromStore(result, indexRecord);
  } catch (e) {}

  cachedDbData = result;
  lastScanTime = Date.now();
  return result;
}

function enrichFromStore(result, indexRecord) {
  if (!store) return;

  if (store.Contact) {
    const models = store.Contact._models || store.Contact.models || [];
    for (const c of models) indexRecord(c);
  }

  if (store.GroupMetadata) {
    const models = store.GroupMetadata._models || store.GroupMetadata.models || [];
    for (const g of models) {
      const id = g.id?._serialized || g.id;
      if (id) {
        const raw = g.__x || g;
        const isArchived = Boolean(raw.archive || raw.archived || raw.isArchived || raw.__x_archive);
        result.groups.set(id, { ...result.groups.get(id), ...raw, isArchived });
        const parts = extractParticipantsList(g);
        for (const p of parts) indexRecord(p);
      }
    }
  }

  if (store.Label) {
    const models = store.Label._models || store.Label.models || [];
    for (const l of models) {
      const id = l.id?._serialized || l.id;
      if (id) result.labels.set(String(id), l.__x || l);
    }
  }

  if (store.Chat) {
    const models = store.Chat._models || store.Chat.models || [];
    for (const ch of models) {
      const id = ch.id?._serialized || ch.id;
      if (id) {
        const raw = ch.__x || ch;
        const isArchived = Boolean(raw.archive || raw.archived || raw.isArchived || raw.__x_archive || raw.unreadArchive);
        const chatRecord = { ...result.chats.get(id), ...raw, isArchived };
        result.chats.set(id, chatRecord);

        if (id.includes('@g.us')) {
          const existing = result.groups.get(id) || {};
          const parts = extractParticipantsList(ch);
          result.groups.set(id, {
            ...existing,
            id: id,
            subject: ch.name || ch.formattedTitle || ch.subject || existing.subject || 'Grupo',
            isArchived: isArchived,
            participants: parts.length > 0 ? parts : (existing.participants || [])
          });
        } else {
          indexRecord(chatRecord);
        }
      }
    }
  }
}
