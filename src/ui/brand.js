/**
 * CLC Agenda mark ("Fuga"): a chat bubble with a contact card breaking out of it.
 * Single source for the overlay, the toolbar icons and the landing.
 */

export const BRAND = { ink: '#0F0F10', accent: '#6A4FF5', paper: '#FFFFFF' };

let instance = 0;

/**
 * @param {object} [opts]
 * @param {string} [opts.bubble] bubble color; 'currentColor' lets CSS decide
 * @param {boolean} [opts.tile] draw on a rounded ink tile (toolbar icon, favicon)
 * @param {boolean} [opts.small] 16 px version: thicker bubble, no card details
 * @param {string} [opts.className]
 */
export function markSVG({ bubble = BRAND.ink, tile = false, small = false, className = '' } = {}) {
  const id = `clc-gap-${++instance}`;
  const stroke = tile ? BRAND.paper : bubble;
  const bubbleWidth = small ? 24 : 18;
  const cls = className ? ` class="${className}"` : '';

  // The mask cuts the bubble around the card, so the gap is transparent on any background
  const mark = `
    <defs><mask id="${id}" maskUnits="userSpaceOnUse" x="0" y="0" width="200" height="200">
      <rect width="200" height="200" fill="#fff"/>
      <rect x="88" y="62" width="100" height="72" rx="18" fill="#000" transform="rotate(-8 140 98)"/>
    </mask></defs>
    <g mask="url(#${id})">
      <path d="M58 132 L40 168 L88 136" fill="${stroke}" stroke="${stroke}" stroke-width="8" stroke-linejoin="round"/>
      <rect x="26" y="34" width="124" height="104" rx="32" fill="none" stroke="${stroke}" stroke-width="${bubbleWidth}"/>
    </g>
    <g transform="rotate(-8 140 98)">
      <rect x="96" y="70" width="84" height="56" rx="12" fill="${BRAND.accent}"/>${small ? '' : `
      <circle cx="118" cy="98" r="10" fill="${BRAND.paper}"/>
      <rect x="134" y="88" width="34" height="8" rx="4" fill="${BRAND.paper}"/>
      <rect x="134" y="102" width="22" height="8" rx="4" fill="${BRAND.paper}"/>`}
    </g>`;

  if (!tile) {
    return `<svg${cls} viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${mark}</svg>`;
  }
  // Tile: the mark sits inside a rounded ink square with breathing room
  return `<svg${cls} viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <rect width="200" height="200" rx="46" fill="${BRAND.ink}"/>
    <g transform="translate(20 22) scale(0.8)">${mark}</g>
  </svg>`;
}
