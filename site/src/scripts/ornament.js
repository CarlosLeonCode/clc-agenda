/**
 * Seasonal nav ornament: a small scene beside the brand (pumpkin and ghosts, tree and snow,
 * heart and rising hearts). Flat brand colours with ink outlines, so it reads on white.
 * Markup only: no scripts, styles or handlers (CSP); the motion lives in global.css.
 */

const INK = '#0F0F10';
const LINE = `stroke="${INK}" stroke-width="1.5" stroke-linejoin="round"`;
const svg = (body) => `<svg viewBox="0 0 72 48" width="72" height="48" focusable="false">${body}</svg>`;

// Each floater sits in a positioned wrapper, so its CSS animation never overrides the placement
const ghost = (x, y, scale) =>
  `<g transform="translate(${x} ${y}) scale(${scale})"><g class="orn-ghost">` +
  `<path d="M0 7a7 7 0 0 1 14 0v10l-2.33-2-2.33 2-2.34-2-2.33 2-2.34-2L0 17z" fill="#FFFFFF" ${LINE}/>` +
  `<circle cx="4.6" cy="7.2" r="1.2" fill="${INK}"/><circle cx="9.4" cy="7.2" r="1.2" fill="${INK}"/>` +
  `<ellipse cx="7" cy="11" rx="1" ry="1.4" fill="${INK}"/></g></g>`;

const flake = (x, y, scale, color) =>
  `<g transform="translate(${x} ${y}) scale(${scale})"><g class="orn-flake">` +
  `<path d="M0-4.5V4.5M-3.9-2.25 3.9 2.25M-3.9 2.25 3.9-2.25" fill="none" stroke="${color}" stroke-width="1.6" stroke-linecap="round"/></g></g>`;

const heartlet = (x, y, color) =>
  `<g transform="translate(${x} ${y})"><g class="orn-heartlet">` +
  `<path d="M0 5C-4 2-5.5-.5-4.5-2.7-3.6-4.6-1.2-4.8 0-2.6 1.2-4.8 3.6-4.6 4.5-2.7 5.5-.5 4 2 0 5Z" fill="${color}" stroke="${INK}" stroke-width="1.2" stroke-linejoin="round"/></g></g>`;

const PUMPKIN = '#FF9440';
const lobe = (cx) => `<ellipse cx="${cx}" cy="33" rx="10" ry="12" fill="${PUMPKIN}" ${LINE}/>`;

export const ORNAMENTS = {
  halloween: svg(
    `<g class="orn-pumpkin">` +
      `<path d="M21.5 22v-3.5c0-2.2 1.4-3.8 3.8-4.4" fill="none" stroke="${INK}" stroke-width="2.6" stroke-linecap="round"/>` +
      lobe(13) + lobe(31) + lobe(22) +
      `<path d="M16 30.5l2.6-3.6 2.6 3.6zM22.8 30.5l2.6-3.6 2.6 3.6z" fill="${INK}"/>` +
      `<path d="M15.5 35.5c2.4 3.6 10.6 3.6 13 0l-2.2 1.2-2.2-1.2-2.1 1.2-2.1-1.2-2.2 1.2z" fill="${INK}"/>` +
      `</g>` +
      ghost(42, 5, 1) +
      ghost(58, 17, 0.78)
  ),
  christmas: svg(
    `<g class="orn-tree">` +
      `<rect x="19" y="40" width="6" height="6" rx="1" fill="${INK}"/>` +
      `<path d="M22 9l9 12h-4l8 10h-5l8 10H6l8-10H9l8-10h-4z" fill="#25D366" ${LINE}/>` +
      `<g>` +
      `<circle class="orn-light" cx="20" cy="18" r="1.7" fill="#FF7262"/>` +
      `<circle class="orn-light" cx="25.5" cy="26" r="1.7" fill="#FFC700"/>` +
      `<circle class="orn-light" cx="16.5" cy="28" r="1.7" fill="#1ABCFE"/>` +
      `<circle class="orn-light" cx="28.5" cy="36" r="1.7" fill="#7B61FF"/>` +
      `<circle class="orn-light" cx="14" cy="37" r="1.7" fill="#FFC700"/>` +
      `<circle class="orn-light" cx="21.5" cy="33.5" r="1.7" fill="#FF7262"/>` +
      `</g>` +
      `<path class="orn-star" d="M22 1l1.29 3.22 3.47.23-2.67 2.23.85 3.37L22 8.2l-2.94 1.85.85-3.37-2.67-2.23 3.47-.23z" fill="#FFC700" ${LINE}/>` +
      `</g>` +
      flake(50, 10, 1, '#1ABCFE') +
      flake(62, 20, 0.8, '#7B61FF')
  ),
  valentine: svg(
    `<path class="orn-heart" d="M22 42C8 32 4 24 8 16c3-6 11-6 14 1 3-7 11-7 14-1 4 8 0 16-14 26z" fill="#FF7262" ${LINE}/>` +
      `<path d="M11.5 19c.8-2 2.6-3.2 4.6-3.2" fill="none" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round"/>` +
      heartlet(47, 22, '#7B61FF') +
      heartlet(59, 14, '#FBA5A1')
  )
};

export function mountOrnament(season, doc = document) {
  const brand = doc.querySelector('.brand');
  if (!brand || !ORNAMENTS[season] || brand.querySelector('.season-ornament')) return;
  const ornament = doc.createElement('span');
  ornament.className = `season-ornament season-ornament--${season}`;
  ornament.setAttribute('aria-hidden', 'true');
  ornament.innerHTML = ORNAMENTS[season];
  brand.append(ornament);
}
