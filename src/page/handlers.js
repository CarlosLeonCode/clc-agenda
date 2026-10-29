import { cleanPhoneNumber } from '../core/phone.js';
import { extractParticipantsList, getGroupParticipantCount } from '../core/groups.js';
import { initWebpackStore, store } from './webpack-store.js';
import { scanAllIndexedDB } from './scan.js';
import { buildResolvedContact, findActiveOpenGroup } from './resolver.js';

/**
 * Action: Extract Group (with multi-layer resolution)
 */
export async function handleExtractGroup(groupId) {
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
  if (store && store.GroupMetadata) {
    try {
      if (store.GroupMetadata.find) {
        try {
          const liveFind = await store.GroupMetadata.find(targetGroupId);
          if (liveFind) group = liveFind.__x || liveFind;
        } catch (e) {}
      }
      if (!group || extractParticipantsList(group).length === 0) {
        if (store.GroupMetadata.queryAndUpdate) {
          try {
            const qResult = await store.GroupMetadata.queryAndUpdate(targetGroupId);
            if (qResult) group = qResult.__x || qResult;
          } catch (e) {}
        }
        const liveG = store.GroupMetadata.get(targetGroupId);
        if (liveG) group = liveG.__x || liveG;
      }
    } catch (e) {}
  }

  // Layer 2: Live Store Chat & Cmd openChatAt trigger
  if ((!group || extractParticipantsList(group).length === 0) && store && store.Chat) {
    try {
      const liveChat = store.Chat.get(targetGroupId);
      if (liveChat) {
        const rawChat = liveChat.__x || liveChat;
        if (rawChat.groupMetadata) {
          group = rawChat.groupMetadata.__x || rawChat.groupMetadata;
        }
        if ((!group || extractParticipantsList(group).length === 0) && store.Cmd && store.Cmd.openChatAt) {
          try {
            store.Cmd.openChatAt(liveChat);
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
export async function handleExtractLabel(labelId) {
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
export async function handleExtractAll(filter = 'all') {
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
export async function handleExtractChats(filter = 'all') {
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
export async function handleGetOverview() {
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
