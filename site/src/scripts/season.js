/**
 * Seasonal windows for the landing ambience. Pure: no DOM at import time, so Node
 * tests import it directly. Dates are the visitor's LOCAL calendar day.
 */

export const SEASONS = ['halloween', 'christmas', 'valentine'];

// Inclusive windows as [month, day] (1-based months); Christmas wraps the year
const WINDOWS = {
  halloween: [[10, 15], [11, 2]],
  christmas: [[12, 1], [1, 6]],
  valentine: [[2, 1], [2, 15]]
};

// Month and day packed into one comparable number: Oct 15 → 1015
const key = (month, day) => month * 100 + day;

/** Season for a date, or null outside every window. */
export function seasonFor(date) {
  const today = key(date.getMonth() + 1, date.getDate());
  for (const season of SEASONS) {
    const [from, to] = WINDOWS[season].map(([m, d]) => key(m, d));
    const inside = from <= to ? today >= from && today <= to : today >= from || today <= to;
    if (inside) return season;
  }
  return null;
}

/** `?season=<name>|none` overrides the calendar; unknown values are ignored. */
export function currentSeason(search, date = new Date()) {
  const forced = new URLSearchParams(search).get('season');
  if (forced === 'none') return null;
  if (SEASONS.includes(forced)) return forced;
  return seasonFor(date);
}
