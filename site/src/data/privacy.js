// Facts the privacy policy (/privacidad, /en/privacy) states about the new-version
// emails. Values starting with "TODO" are not confirmed yet: a production build with
// leads on refuses to ship them (assertPrivacyReady, called from astro.config.mjs).
export const PRIVACY = {
  controller: 'Carlos Esteban León',
  location: 'Colombia',
  contactEmail: 'carlosleoncode@gmail.com',
  // Supabase dashboard → Project Settings → General → Region (e.g. "us-east-1")
  supabaseRegion: 'us-west-2 (Oregon, USA)',
  // Turn on only once the emails go out through Brevo (adds it to the processors and the unsubscribe link)
  usesBrevo: false,
  retentionDaysAfterUnsubscribe: 30,
  inactiveListMonths: 24,
  // Business days to answer, as Colombia's Ley 1581 sets
  responseDays: { queries: 10, claims: 15 },
  minimumAge: 18,
  // Date this text took effect, YYYY-MM-DD
  lastUpdated: '2026-10-30'
};

/** Paths of the values still marked "TODO", e.g. ["PRIVACY.lastUpdated"]. */
export function privacyPlaceholders(value = PRIVACY, path = 'PRIVACY') {
  if (typeof value === 'string') return value.startsWith('TODO') ? [path] : [];
  if (value && typeof value === 'object') {
    return Object.entries(value).flatMap(([key, child]) => privacyPlaceholders(child, `${path}.${key}`));
  }
  return [];
}

/**
 * Netlify's production deploys (CONTEXT=production), or any build with PRIVACY_STRICT=1,
 * stop while leads are on and the policy still has placeholders. Previews and local
 * builds go through so the page can be reviewed first.
 */
export function assertPrivacyReady({ leadsEnabled, env = process.env, privacy = PRIVACY }) {
  const strict = env.CONTEXT === 'production' || env.PRIVACY_STRICT === '1';
  if (!leadsEnabled || !strict) return;
  const missing = privacyPlaceholders(privacy);
  if (missing.length === 0) return;
  throw new Error(
    `The privacy policy still has placeholders: ${missing.join(', ')}.\n` +
    'Fill them in site/src/data/privacy.js, or build without the new-version emails (LEADS_DISABLED=1).'
  );
}
