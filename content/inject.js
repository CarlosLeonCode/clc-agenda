/**
 * WA Contact Extractor Pro - Advanced Injected Page Script (world: MAIN)
 * Webpack Hooking, Deep Multi-Store Group Resolution, On-Demand Server Fetch,
 * Multi-Device JID Normalization, Suffix Matching, and Archived Chats/Groups Support.
 */

(function () {
  'use strict';

  if (window.__WA_EXTRACTOR_INITIALIZED__) return;
  window.__WA_EXTRACTOR_INITIALIZED__ = true;

  console.log('[WA Extractor Pro] Engine v2.7 (Archived Support & Deep Webpack Hook) initialized.');

  let cachedDbData = null;
  let lastScanTime = 0;

  /**
   * Webpack Runtime Module Hooking for WhatsApp Web
   */
  function initWebpackStore() {
    if (window.Store && window.Store.GroupMetadata && window.Store.Chat) return;
    window.Store = window.Store || {};

    try {
      const chunkKeys = Object.keys(window).filter(k => k.startsWith('webpackChunk'));
      const targetChunk = window.webpackChunkwhatsapp_web_client || window.webpackChunkbuild_web || (chunkKeys.length > 0 ? window[chunkKeys[0]] : null);

      if (targetChunk && typeof targetChunk.push === 'function') {
        targetChunk.push([
          ['wae_extractor_' + Math.random().toString(36).substring(2, 9)],
          {},
          (req) => {
            window.__wae_require__ = req;
            if (!req.m) return;

            for (const key of Object.keys(req.m)) {
              try {
                const m = req(key);
                if (!m) continue;

                // Contact Store
                if (!window.Store.Contact) {
                  if (m.Contact && (m.Contact._models || m.Contact.models || m.Contact.get)) window.Store.Contact = m.Contact;
                  else if (m.default && m.default.Contact && (m.default.Contact._models || m.default.Contact.models)) window.Store.Contact = m.default.Contact;
                }

                // Chat Store
                if (!window.Store.Chat) {
                  if (m.Chat && (m.Chat._models || m.Chat.models || m.Chat.get)) window.Store.Chat = m.Chat;
                  else if (m.default && m.default.Chat && (m.default.Chat._models || m.default.Chat.models)) window.Store.Chat = m.default.Chat;
                }

                // GroupMetadata Store
                if (!window.Store.GroupMetadata) {
                  if (m.GroupMetadata && (m.GroupMetadata._models || m.GroupMetadata.models || m.GroupMetadata.get || m.GroupMetadata.find)) {
                    window.Store.GroupMetadata = m.GroupMetadata;
                  } else if (m.default && m.default.GroupMetadata) {
                    window.Store.GroupMetadata = m.default.GroupMetadata;
                  }
                }

                // Label Store
                if (!window.Store.Label) {
                  if (m.Label && (m.Label._models || m.Label.models || m.Label.get)) window.Store.Label = m.Label;
                  else if (m.default && m.default.Label) window.Store.Label = m.default.Label;
                }

                // Cmd / OpenChat
                if (!window.Store.Cmd && m.Cmd && m.Cmd.openChatAt) {
                  window.Store.Cmd = m.Cmd;
                }
              } catch (e) {}
            }
          }
        ]);
      }
    } catch (err) {
      console.warn('[WA Extractor] Webpack hook warning:', err);
    }
  }

  // Attempt Webpack hook immediately
  initWebpackStore();

  function isLid(str) {
    if (!str) return false;
    const s = String(str);
    return s.includes('@lid') || s.includes('_lid') || s.endsWith(':0@lid');
  }

  function cleanPhoneNumber(raw) {
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

  function sanitizeName(nameStr, phone) {
    if (!nameStr || typeof nameStr !== 'string') return '';
    let str = nameStr.trim();
    if (str.startsWith('~')) str = str.substring(1).trim();

    if (str === phone || str === `+${phone}` || cleanPhoneNumber(str) === phone) {
      return '';
    }
    return str;
  }

  function detectCountry(cleanNum) {
    if (!cleanNum) return { country: 'Desconocido', iso: '??' };
    const list = [
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
    ].sort((a, b) => b.prefix.length - a.prefix.length);

    for (const item of list) {
      if (cleanNum.startsWith(item.prefix)) {
        return item;
      }
    }
    return { country: 'Internacional', iso: 'INTL' };
  }

  function openDatabase(dbName, version) {
    return new Promise((resolve, reject) => {
      try {
        const req = version ? indexedDB.open(dbName, version) : indexedDB.open(dbName);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
        req.onblocked = () => resolve(null);
      } catch (err) {
        reject(err);
      }
    });
  }

  function getAllFromStore(db, storeName) {
    return new Promise((resolve) => {
      try {
        if (!db.objectStoreNames.contains(storeName)) {
          return resolve([]);
        }
        const tx = db.transaction(storeName, 'readonly');
        const store = tx.objectStore(storeName);
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => resolve([]);
      } catch (e) {
        resolve([]);
      }
    });
  }

  function extractParticipantsList(groupObj) {
    if (!groupObj) return [];
    const raw = groupObj.__x || groupObj;
    
    let parts = raw.participants || groupObj.participants;
    if (!parts && (raw.groupMetadata || groupObj.groupMetadata)) {
      const gm = raw.groupMetadata || groupObj.groupMetadata;
      const rawGm = gm.__x || gm;
      parts = rawGm.participants || gm.participants;
    }

    if (!parts) return [];

    if (parts._models && Array.isArray(parts._models)) {
      return parts._models.map(m => m.__x || m);
    }
    if (parts.models && Array.isArray(parts.models)) {
      return parts.models.map(m => m.__x || m);
    }
    if (Array.isArray(parts)) {
      return parts.map(m => m?.__x || m);
    }
    if (parts instanceof Map || parts instanceof Set) {
      return Array.from(parts.values()).map(m => m?.__x || m);
    }
    if (typeof parts === 'object') {
      return Object.values(parts).map(m => m?.__x || m);
    }
    return [];
  }

  function getGroupParticipantCount(g) {
    if (!g) return 0;
    const parts = extractParticipantsList(g);
    if (parts.length > 0) return parts.length;
    
    const raw = g.__x || g;
    const count = raw.participantCount || raw.participantsCount || raw.size || 
                  raw.groupMetadata?.participantCount || raw.groupMetadata?.participantsCount ||
                  raw.groupMetadata?.participants?.length;
    if (typeof count === 'number' && count > 0) return count;
    return 0;
  }

  function mergeContactRecord(target, source) {
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

  /**
   * Multi-indexed database scan
   */
  async function scanAllIndexedDB(force = false) {
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

        if (phone.length >= 9) {
          const suffix10 = phone.slice(-10);
          const suffix9 = phone.slice(-9);
          if (!result.contactsBySuffix.has(suffix10)) result.contactsBySuffix.set(suffix10, entry);
          if (!result.contactsBySuffix.has(suffix9)) result.contactsBySuffix.set(suffix9, entry);
        }
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
    if (!window.Store) return;

    if (window.Store.Contact) {
      const models = window.Store.Contact._models || window.Store.Contact.models || [];
      for (const c of models) indexRecord(c);
    }

    if (window.Store.GroupMetadata) {
      const models = window.Store.GroupMetadata._models || window.Store.GroupMetadata.models || [];
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

    if (window.Store.Label) {
      const models = window.Store.Label._models || window.Store.Label.models || [];
      for (const l of models) {
        const id = l.id?._serialized || l.id;
        if (id) result.labels.set(String(id), l.__x || l);
      }
    }

    if (window.Store.Chat) {
      const models = window.Store.Chat._models || window.Store.Chat.models || [];
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

  /**
   * Resolves contact with exact match, suffix match, and live Store hydration
   */
  async function buildResolvedContact(initialData, dataBundle, extra = {}) {
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

    // 3. Suffix match
    if ((!aggregated.savedName && !aggregated.pushName) && dataBundle?.contactsBySuffix) {
      const suffix10 = phone.slice(-10);
      const suffix9 = phone.slice(-9);
      if (dataBundle.contactsBySuffix.has(suffix10)) {
        mergeContactRecord(aggregated, dataBundle.contactsBySuffix.get(suffix10));
      } else if (dataBundle.contactsBySuffix.has(suffix9)) {
        mergeContactRecord(aggregated, dataBundle.contactsBySuffix.get(suffix9));
      }
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
  function findActiveOpenGroup(dataBundle) {
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

  /**
   * Action: Extract Group (with multi-layer resolution)
   */
  async function handleExtractGroup(groupId) {
    initWebpackStore();
    const data = await scanAllIndexedDB(true);

    let targetGroupId = groupId;
    if (targetGroupId === 'ACTIVE_DOM' || !targetGroupId) {
      targetGroupId = findActiveOpenGroup(data);
      if (!targetGroupId) {
        throw new Error('No hay ninguna conversación de grupo abierta actualmente en la pantalla.');
      }
    }

    let group = data.groups.get(targetGroupId) || data.chats.get(targetGroupId);

    // Layer 1: Live Store GroupMetadata Fetch
    if (window.Store && window.Store.GroupMetadata) {
      try {
        if (window.Store.GroupMetadata.find) {
          try {
            const liveFind = await window.Store.GroupMetadata.find(targetGroupId);
            if (liveFind) group = liveFind.__x || liveFind;
          } catch (e) {}
        }
        if (!group || extractParticipantsList(group).length === 0) {
          if (window.Store.GroupMetadata.queryAndUpdate) {
            try {
              const qResult = await window.Store.GroupMetadata.queryAndUpdate(targetGroupId);
              if (qResult) group = qResult.__x || qResult;
            } catch (e) {}
          }
          const liveG = window.Store.GroupMetadata.get(targetGroupId);
          if (liveG) group = liveG.__x || liveG;
        }
      } catch (e) {}
    }

    // Layer 2: Live Store Chat & Cmd openChatAt trigger
    if ((!group || extractParticipantsList(group).length === 0) && window.Store && window.Store.Chat) {
      try {
        const liveChat = window.Store.Chat.get(targetGroupId);
        if (liveChat) {
          const rawChat = liveChat.__x || liveChat;
          if (rawChat.groupMetadata) {
            group = rawChat.groupMetadata.__x || rawChat.groupMetadata;
          }
          if ((!group || extractParticipantsList(group).length === 0) && window.Store.Cmd && window.Store.Cmd.openChatAt) {
            try {
              window.Store.Cmd.openChatAt(liveChat);
              await new Promise(r => setTimeout(r, 450));
              if (rawChat.groupMetadata) group = rawChat.groupMetadata.__x || rawChat.groupMetadata;
            } catch (e) {}
          }
        }
      } catch (e) {}
    }

    const groupTitle = group?.subject || group?.name || group?.formattedTitle || 'Grupo WhatsApp';
    let participants = extractParticipantsList(group);

    // Layer 3: Group message participants from IndexedDB
    if (participants.length === 0 && data.groupMessages && data.groupMessages.has(targetGroupId)) {
      const authorSet = data.groupMessages.get(targetGroupId);
      participants = Array.from(authorSet).map(author => ({ id: author }));
    }

    // Layer 4: DOM Subtitle & Drawer Parsing
    if (participants.length === 0) {
      const headerSubtitleEl = document.querySelector('#main header span[title]');
      if (headerSubtitleEl) {
        const text = headerSubtitleEl.getAttribute('title') || headerSubtitleEl.textContent || '';
        if (text.includes(',')) {
          const namesOrNumbers = text.split(',').map(s => s.trim()).filter(Boolean);
          for (const item of namesOrNumbers) {
            const clean = cleanPhoneNumber(item);
            if (clean) {
              participants.push({ id: `${clean}@c.us`, phone: clean });
            } else if (item.toLowerCase() !== 'tú' && item.toLowerCase() !== 'you') {
              for (const [p, c] of data.contactsByPhone.entries()) {
                if (c.savedName === item || c.pushName === item) {
                  participants.push({ id: `${p}@c.us`, name: item, phone: p });
                  break;
                }
              }
            }
          }
        }
      }
    }

    if (participants.length === 0) {
      throw new Error(`Este grupo aún no tiene participantes cargados en memoria. Por favor abre el chat del grupo en WhatsApp Web y vuelve a hacer clic en Extraer.`);
    }

    const results = [];
    const seenPhones = new Set();

    for (const p of participants) {
      const pId = p.id?._serialized || p.id || (typeof p === 'string' ? p : null);
      if (!pId && !p.phone) continue;

      const isAdmin = Boolean(p.isAdmin || p.isSuperAdmin || p.admin);
      const contactItem = await buildResolvedContact(p, data, {
        isAdmin: isAdmin,
        source: 'Grupo',
        sourceName: groupTitle
      });

      if (contactItem && contactItem.cleanPhone && !seenPhones.has(contactItem.cleanPhone)) {
        seenPhones.add(contactItem.cleanPhone);
        results.push(contactItem);
      }
    }

    return {
      groupTitle,
      groupId: targetGroupId,
      total: results.length,
      contacts: results
    };
  }

  /**
   * Action: Extract Label
   */
  async function handleExtractLabel(labelId) {
    const data = await scanAllIndexedDB();
    const labelObj = data.labels.get(String(labelId));
    const labelName = labelObj ? labelObj.name : `Etiqueta ${labelId}`;

    const matchedIds = new Set();
    for (const assoc of data.labelAssociations) {
      const assocLabelId = String(assoc.labelId || assoc.label_id || assoc.id || '');
      if (assocLabelId === String(labelId)) {
        const targetId = assoc.chatId || assoc.chatJid || assoc.contactId || assoc.contactJid || assoc.associationId || assoc.parentJid;
        if (targetId) matchedIds.add(String(targetId));
      }
    }

    const results = [];
    const seenPhones = new Set();

    for (const id of matchedIds) {
      const raw = data.contactsById.get(id) || data.chats.get(id) || { id };
      const contactItem = await buildResolvedContact(raw, data, {
        labels: [labelName],
        source: 'Etiqueta',
        sourceName: labelName
      });

      if (contactItem && contactItem.cleanPhone && !seenPhones.has(contactItem.cleanPhone)) {
        seenPhones.add(contactItem.cleanPhone);
        results.push(contactItem);
      }
    }

    return {
      labelName,
      labelId,
      total: results.length,
      contacts: results
    };
  }

  /**
   * Action: Extract All Contacts
   */
  async function handleExtractAll(filter = 'all') {
    const data = await scanAllIndexedDB();
    const results = [];
    const seenPhones = new Set();

    for (const [phone, c] of data.contactsByPhone.entries()) {
      const item = await buildResolvedContact(c, data, { source: 'Todos' });
      if (!item || !item.cleanPhone) continue;

      if (filter === 'unsaved' && item.isMyContact) continue;
      if (filter === 'saved' && !item.isMyContact) continue;
      if (filter === 'business' && !item.isBusiness) continue;
      if (filter === 'archived' && !item.isArchived) continue;

      if (!seenPhones.has(item.cleanPhone)) {
        seenPhones.add(item.cleanPhone);
        results.push(item);
      }
    }

    return {
      filter,
      total: results.length,
      contacts: results
    };
  }

  /**
   * Action: Extract Chats (with Active / Archived filter)
   */
  async function handleExtractChats(filter = 'all') {
    const data = await scanAllIndexedDB();
    const results = [];
    const seenPhones = new Set();

    for (const [id, ch] of data.chats.entries()) {
      if (id.includes('@g.us')) continue;

      const isArchived = Boolean(ch.isArchived || ch.archive || ch.archived || ch.__x_archive || ch.unreadArchive);
      if (filter === 'archived' && !isArchived) continue;
      if (filter === 'active' && isArchived) continue;

      const item = await buildResolvedContact(ch, data, {
        source: isArchived ? 'Chats Archivados' : 'Chats',
        sourceName: ch.name || (isArchived ? 'Chat Individual (Archivado)' : 'Chat Individual'),
        isArchived: isArchived
      });

      if (item && item.cleanPhone && !seenPhones.has(item.cleanPhone)) {
        seenPhones.add(item.cleanPhone);
        results.push(item);
      }
    }

    return {
      filter,
      total: results.length,
      contacts: results
    };
  }

  /**
   * Action: Get Overview
   */
  async function handleGetOverview() {
    const data = await scanAllIndexedDB(true);

    const groupsList = [];
    let totalArchivedGroups = 0;
    for (const [id, g] of data.groups.entries()) {
      const title = g.subject || g.name || g.formattedTitle || 'Grupo sin título';
      const count = getGroupParticipantCount(g);
      if (g.isArchived) totalArchivedGroups++;
      groupsList.push({
        id: id,
        title: title,
        participantCount: count,
        isArchived: Boolean(g.isArchived)
      });
    }

    groupsList.sort((a, b) => b.participantCount - a.participantCount || a.title.localeCompare(b.title));

    const labelsList = [];
    for (const [id, l] of data.labels.entries()) {
      const name = l.name || `Etiqueta #${id}`;
      const count = data.labelAssociations.filter(a => String(a.labelId || a.id) === String(id)).length;
      labelsList.push({
        id: id,
        name: name,
        color: l.color || l.hexColor || '#10b981',
        count: count
      });
    }

    labelsList.sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));

    let totalArchivedChats = 0;
    for (const [id, ch] of data.chats.entries()) {
      if (!id.includes('@g.us') && (ch.isArchived || ch.archive || ch.archived)) {
        totalArchivedChats++;
      }
    }

    return {
      totalContacts: data.contactsByPhone.size || data.contactsById.size,
      totalGroups: data.groups.size,
      totalArchivedGroups,
      totalArchivedChats,
      totalLabels: data.labels.size,
      totalChats: data.chats.size,
      groups: groupsList,
      labels: labelsList
    };
  }

  /**
   * Global message listener with origin verification
   */
  window.addEventListener('message', async (event) => {
    if (event.source !== window || event.origin !== window.location.origin) {
      return;
    }
    if (!event.data || event.data.type !== 'WA_EXTRACTOR_REQUEST') {
      return;
    }

    const { action, requestId, payload } = event.data;

    try {
      let responseData = null;

      switch (action) {
        case 'GET_OVERVIEW':
          responseData = await handleGetOverview();
          break;
        case 'EXTRACT_GROUP':
          responseData = await handleExtractGroup(payload?.groupId);
          break;
        case 'EXTRACT_LABEL':
          responseData = await handleExtractLabel(payload?.labelId);
          break;
        case 'EXTRACT_ALL':
          responseData = await handleExtractAll(payload?.filter || 'all');
          break;
        case 'EXTRACT_CHATS':
          responseData = await handleExtractChats(payload?.filter || 'all');
          break;
        default:
          throw new Error(`Acción no reconocida: ${action}`);
      }

      window.postMessage({
        type: 'WA_EXTRACTOR_RESPONSE',
        requestId,
        success: true,
        data: responseData
      }, window.location.origin);
    } catch (err) {
      console.error('[WA Extractor] Request error:', err);
      window.postMessage({
        type: 'WA_EXTRACTOR_RESPONSE',
        requestId,
        success: false,
        error: err.message || 'Error al procesar solicitud'
      }, window.location.origin);
    }
  });

})();
