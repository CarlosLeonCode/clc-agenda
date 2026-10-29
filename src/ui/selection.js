/**
 * Pure selection, search and pagination helpers for the results table
 */

export const PAGE_SIZE = 400;

export function contactKey(contact) {
  return contact.cleanPhone || contact.id;
}

export function filterContacts(contacts, term) {
  const needle = (term || '').toLowerCase().trim();
  if (!needle) return contacts;
  return contacts.filter(c => {
    const name = (c.name || c.savedName || c.pushName || '').toLowerCase();
    const phone = (c.phone || c.cleanPhone || '').toLowerCase();
    const country = (c.country || '').toLowerCase();
    const source = (c.sourceName || '').toLowerCase();
    return name.includes(needle) || phone.includes(needle) || country.includes(needle) || source.includes(needle);
  });
}

export function getExportList(contacts, selectedIds) {
  return contacts.filter(c => selectedIds.has(contactKey(c)));
}

/** Selects or clears only the given contacts, keeping every other selection. */
export function setSelectionFor(selectedIds, contacts, checked) {
  const next = new Set(selectedIds);
  for (const c of contacts) {
    if (checked) next.add(contactKey(c));
    else next.delete(contactKey(c));
  }
  return next;
}

export function areAllSelected(selectedIds, contacts) {
  return contacts.length > 0 && contacts.every(c => selectedIds.has(contactKey(c)));
}

export function paginate(list, limit = PAGE_SIZE) {
  return {
    rows: list.slice(0, limit),
    hiddenCount: Math.max(0, list.length - limit)
  };
}
