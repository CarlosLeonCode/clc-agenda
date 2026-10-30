// JSON-LD nodes. Base.astro adds WebSite + WebPage to every page; each page
// passes its own nodes (the app and FAQ on home, the HowTo on the guide), in its language.
import { readFileSync } from 'node:fs';
import { DOWNLOAD_URL, REPO, AUTHOR } from './site.js';
import { copyFor, LANGS } from '../i18n/index.js';

// The extension's manifest is the single source for the version; builds run from site/
const manifest = JSON.parse(readFileSync(new URL('../manifest.json', `file://${process.cwd()}/`), 'utf8'));

export const VERSION = manifest.version;
export const BUILD_DATE = new Date().toISOString();

const abs = (site, path) => new URL(path, site).href;

export function appNodes(site, lang = 'es') {
  const copy = copyFor(lang);
  return [
    {
      '@type': 'SoftwareApplication',
      name: 'CLC Agenda',
      description: copy.meta.description,
      applicationCategory: 'BrowserApplication',
      operatingSystem: 'Chrome, Brave, Edge, Opera (Chromium 111+)',
      softwareVersion: VERSION,
      url: abs(site, copy.routes.home),
      downloadUrl: DOWNLOAD_URL,
      installUrl: abs(site, copy.routes.install),
      screenshot: abs(site, copy.meta.ogImage),
      codeRepository: REPO,
      author: { '@type': 'Person', name: AUTHOR.name, url: AUTHOR.url, sameAs: AUTHOR.sameAs },
      license: 'https://opensource.org/licenses/MIT',
      inLanguage: lang
    },
    {
      '@type': 'FAQPage',
      inLanguage: lang,
      mainEntity: copy.faq.items.map(({ q, a }) => ({
        '@type': 'Question',
        name: q,
        acceptedAnswer: { '@type': 'Answer', text: a }
      }))
    }
  ];
}

export function installNodes(site, lang = 'es') {
  const copy = copyFor(lang);
  const guideUrl = abs(site, copy.routes.install);
  return [
    {
      '@type': 'HowTo',
      name: copy.install.howTo.name,
      description: copy.install.howTo.description,
      inLanguage: lang,
      totalTime: 'PT3M',
      tool: [{ '@type': 'HowToTool', name: copy.install.howTo.tool }],
      supply: [{ '@type': 'HowToSupply', name: 'clc-agenda.zip' }],
      step: copy.install.steps.map(({ name, text }, i) => ({
        '@type': 'HowToStep',
        position: i + 1,
        name,
        text,
        url: `${guideUrl}#${copy.ids.step}-${i + 1}`
      }))
    },
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: copy.install.breadcrumb[0], item: abs(site, copy.routes.home) },
        { '@type': 'ListItem', position: 2, name: copy.install.breadcrumb[1], item: guideUrl }
      ]
    }
  ];
}

export function pageNodes(site, { url, title, description, lang = 'es' }) {
  const home = abs(site, '/');
  return [
    { '@type': 'WebSite', '@id': `${home}#website`, name: 'CLC Agenda', url: home, inLanguage: LANGS },
    {
      '@type': 'WebPage',
      '@id': `${url}#webpage`,
      url,
      name: title,
      description,
      inLanguage: lang,
      isPartOf: { '@id': `${home}#website` },
      dateModified: BUILD_DATE
    }
  ];
}
