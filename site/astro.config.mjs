import { defineConfig } from 'astro/config';

// Deployed on Netlify at the domain root. Netlify sets URL during builds, so
// canonical and Open Graph URLs follow whatever domain the site is served from.
export default defineConfig({
  site: process.env.URL || 'http://localhost:4321',
  output: 'static',
  trailingSlash: 'ignore',
  // Never inline scripts or assets: the CSP allows only same-origin files (script-src 'self')
  vite: { build: { assetsInlineLimit: 0 } }
});
