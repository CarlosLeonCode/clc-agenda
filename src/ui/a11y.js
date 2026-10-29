/**
 * Pure keyboard helpers for the overlay: tablist navigation and dialog focus trap
 */

/** Returns the tab index to focus for a key press, or null when the key does not move. */
export function nextTabIndex(index, key, count) {
  if (key === 'ArrowRight') return (index + 1) % count;
  if (key === 'ArrowLeft') return (index - 1 + count) % count;
  if (key === 'Home') return 0;
  if (key === 'End') return count - 1;
  return null;
}

/**
 * Returns the focusable index to jump to on Tab, or null to keep the native order.
 * `index` is -1 when focus is outside the dialog.
 */
export function nextFocusIndex(index, count, shiftKey) {
  if (count === 0) return null;
  if (index === -1) return shiftKey ? count - 1 : 0;
  if (!shiftKey && index === count - 1) return 0;
  if (shiftKey && index === 0) return count - 1;
  return null;
}
