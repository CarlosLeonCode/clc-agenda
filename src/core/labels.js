/**
 * WhatsApp Business label associations. One rule for both the label count shown
 * in the list and the contacts extracted, so the two always agree.
 */

export function labelIdOf(assoc) {
  return String(assoc.labelId || assoc.label_id || assoc.id || '');
}

export function labelTargetOf(assoc) {
  const target = assoc.chatId || assoc.chatJid || assoc.contactId || assoc.contactJid || assoc.associationId || assoc.parentJid;
  return target ? String(target) : '';
}

/** Distinct chat/contact ids tagged with the label. */
export function labelTargets(associations, labelId) {
  const targets = new Set();
  for (const assoc of associations) {
    if (labelIdOf(assoc) !== String(labelId)) continue;
    const target = labelTargetOf(assoc);
    if (target) targets.add(target);
  }
  return targets;
}
