import { defineConfig } from 'astro/config';
import { fileURLToPath } from 'node:url';
import { LEADS_ENABLED } from './src/data/site.js';
import { LEAD_CAPTURE } from './src/lib/lead-capture.js';
import { assertPrivacyReady } from './src/data/privacy.js';

// New-version emails need the optional @carlosleoncode/lead-capture package (GitHub
// Packages, NODE_AUTH_TOKEN). Without it, or with LEADS_DISABLED=1, the import in
// src/scripts/leads.js resolves to an inert stand-in and the pages leave the card out.
if (!LEADS_ENABLED) {
  const why = process.env.LEADS_DISABLED === '1' ? 'LEADS_DISABLED=1' : `${LEAD_CAPTURE} is not installed (no NODE_AUTH_TOKEN?)`;
  console.warn(`⚠ New-version emails are off: ${why}. Building without the card and the privacy pages.`);
}
// Production deploys stop here while the privacy policy still has "TODO" values
assertPrivacyReady({ leadsEnabled: LEADS_ENABLED });

// Deployed on Netlify at the domain root. Netlify sets URL during builds, so
// canonical and Open Graph URLs follow whatever domain the site is served from.
export default defineConfig({
  site: process.env.URL || 'http://localhost:4321',
  output: 'static',
  trailingSlash: 'ignore',
  vite: {
    // Never inline scripts or assets: the CSP allows only same-origin files (script-src 'self')
    build: { assetsInlineLimit: 0 },
    resolve: {
      alias: LEADS_ENABLED ? [] : [{
        find: `${LEAD_CAPTURE}/vanilla`,
        replacement: fileURLToPath(new URL('./src/lib/lead-capture-fallback.js', import.meta.url))
      }]
    }
  }
});
