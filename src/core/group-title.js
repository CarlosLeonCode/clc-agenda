/**
 * Resolves the open group from the chat header title.
 * Exact title only: a partial match could extract another group's members.
 */

export function normalizeTitle(title) {
  return String(title || '').normalize('NFC').trim().replace(/\s+/g, ' ').toLowerCase();
}

/** Returns the group id whose title equals the header, or null when none or several match. */
export function matchGroupByTitle(groups, headerTitle) {
  const wanted = normalizeTitle(headerTitle);
  if (!wanted || !groups) return null;

  const matches = [];
  for (const [id, g] of groups.entries()) {
    if (normalizeTitle(g.subject || g.name || g.formattedTitle) === wanted) matches.push(id);
  }
  return matches.length === 1 ? matches[0] : null;
}
