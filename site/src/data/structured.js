// JSON-LD nodes. Base.astro adds WebSite + WebPage to every page; each page
// passes its own nodes (the app and FAQ on home, the HowTo on the guide).
import { readFileSync } from 'node:fs';
import { DESCRIPTION, DOWNLOAD_URL, REPO, AUTHOR, FAQ, INSTALL_STEPS } from './site.js';

// The extension's manifest is the single source for the version; builds run from site/
const manifest = JSON.parse(readFileSync(new URL('../manifest.json', `file://${process.cwd()}/`), 'utf8'));

export const VERSION = manifest.version;
export const BUILD_DATE = new Date().toISOString();

const abs = (site, path) => new URL(path, site).href;

export function appNodes(site) {
  return [
    {
      '@type': 'SoftwareApplication',
      name: 'CLC Agenda',
      description: DESCRIPTION,
      applicationCategory: 'BrowserApplication',
      operatingSystem: 'Chrome, Brave, Edge, Opera (Chromium 111+)',
      softwareVersion: VERSION,
      url: abs(site, '/'),
      downloadUrl: DOWNLOAD_URL,
      installUrl: abs(site, '/instalar'),
      screenshot: abs(site, '/og.png'),
      codeRepository: REPO,
      author: { '@type': 'Person', name: AUTHOR.name, url: AUTHOR.url, sameAs: AUTHOR.sameAs },
      license: 'https://opensource.org/licenses/MIT',
      inLanguage: 'es'
    },
    {
      '@type': 'FAQPage',
      mainEntity: FAQ.map(({ q, a }) => ({
        '@type': 'Question',
        name: q,
        acceptedAnswer: { '@type': 'Answer', text: a }
      }))
    }
  ];
}

export function installNodes(site) {
  return [
    {
      '@type': 'HowTo',
      name: 'Cómo instalar CLC Agenda',
      description: 'Instala la extensión CLC Agenda en Chrome, Brave, Edge u Opera en 7 pasos, sin saber de tecnología.',
      totalTime: 'PT3M',
      tool: [{ '@type': 'HowToTool', name: 'Chrome, Brave, Edge u Opera (versión 111 o superior)' }],
      supply: [{ '@type': 'HowToSupply', name: 'clc-agenda.zip' }],
      step: INSTALL_STEPS.map(({ name, text }, i) => ({
        '@type': 'HowToStep',
        position: i + 1,
        name,
        text,
        url: `${abs(site, '/instalar')}#paso-${i + 1}`
      }))
    },
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Inicio', item: abs(site, '/') },
        { '@type': 'ListItem', position: 2, name: 'Instalar', item: abs(site, '/instalar') }
      ]
    }
  ];
}

export function pageNodes(site, { url, title, description }) {
  return [
    { '@type': 'WebSite', '@id': `${abs(site, '/')}#website`, name: 'CLC Agenda', url: abs(site, '/'), inLanguage: 'es' },
    {
      '@type': 'WebPage',
      '@id': `${url}#webpage`,
      url,
      name: title,
      description,
      inLanguage: 'es',
      isPartOf: { '@id': `${abs(site, '/')}#website` },
      dateModified: BUILD_DATE
    }
  ];
}
