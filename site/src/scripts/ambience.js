/**
 * Seasonal background ambience (Halloween, Christmas, Valentine's).
 * Progressive enhancement and purely decorative: out of season, or with reduced
 * motion, this tiny detector is all that runs. In season, the canvas renderer is
 * imported after first paint, so it never competes with the hero.
 * `?season=halloween|christmas|valentine|none` overrides the calendar for previews.
 */

import { currentSeason } from './season.js';

const season = currentSeason(location.search);
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const afterFirstPaint = (fn) => ('requestIdleCallback' in window ? requestIdleCallback(fn, { timeout: 1500 }) : setTimeout(fn, 300));

let active = false;
let stop = null;

function start() {
  if (active || reduced.matches) return;
  active = true;
  afterFirstPaint(() => {
    if (!active) return;
    import('./ambience-renderer.js').then(({ startAmbience }) => {
      // A teardown may have happened while the renderer was loading
      if (active && !stop) stop = startAmbience(season);
    });
  });
}

function teardown() {
  active = false;
  stop?.();
  stop = null;
}

if (season) {
  // The nav ornament is decoration, not motion: it stays (stilled by CSS) with reduced motion
  import('./ornament.js').then(({ mountOrnament }) => mountOrnament(season));
  // Reduced motion switched on mid-visit: remove the canvas; switched off: start it
  reduced.addEventListener('change', (event) => (event.matches ? teardown() : start()));
  addEventListener('pagehide', teardown);
  // Restored from the back/forward cache after a pagehide
  addEventListener('pageshow', (event) => event.persisted && start());
  start();
}
