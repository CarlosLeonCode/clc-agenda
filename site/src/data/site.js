import { pathToFileURL } from 'node:url';
import es from '../i18n/es.js';
import { isLeadCaptureInstalled, leadsEnabled } from '../lib/lead-capture.js';

// Single source for links and FAQ: the page and its JSON-LD read the same data
export const REPO = 'https://github.com/CarlosLeonCode/clc-agenda';
// Every "Instalar" button opens the step-by-step guide; the guide links the download
export const INSTALL_URL = es.routes.install;
export const DOWNLOAD_URL = `${REPO}/releases/latest/download/clc-agenda.zip`;
// clc-leads: opt-in "tell me about new versions" email on the home pages and the guide.
// The endpoint must list this project in ALLOWED_PROJECTS and the site's origin in ALLOWED_ORIGINS.
export const LEADS = {
  project: 'clc-agenda',
  endpoint: 'https://xjftniraqohzpmxudqgx.supabase.co/functions/v1/leads'
};
// Off without the optional package (no NODE_AUTH_TOKEN) or with LEADS_DISABLED=1: then the
// card, its open controls, the privacy pages and their links are not rendered. Builds run from site/.
export const LEADS_ENABLED = leadsEnabled({
  endpoint: LEADS.endpoint,
  installed: isLeadCaptureInstalled(pathToFileURL(`${process.cwd()}/`))
});
export const AUTHOR = {
  name: 'carlosleoncode',
  url: 'https://www.carlosleoncode.com/',
  sameAs: ['https://www.carlosleoncode.com/', 'https://github.com/CarlosLeonCode']
};

// Spanish copy under its original names; all copy lives in src/i18n/{es,en}.js
export const TITLE = es.meta.title;
export const DESCRIPTION = es.meta.description;
export const OG_IMAGE_ALT = es.meta.ogAlt;
export const DEFINITION = es.definition;
export const INSTALL_STEPS = es.install.steps;
export const FAQ = es.faq.items;
