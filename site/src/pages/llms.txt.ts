import type { APIRoute } from 'astro';
import { DOWNLOAD_URL, REPO, AUTHOR } from '../data/site.js';
import { VERSION } from '../data/structured.js';
import { copyFor } from '../i18n/index.js';

// llms.txt (llmstxt.org): a plain summary assistants can read before citing the site.
// Written in English, linking the pages in both languages.
const en = copyFor('en');
const es = copyFor('es');

export const GET: APIRoute = ({ site }) => {
  const url = (path: string) => new URL(path, site).href;
  const body = `# CLC Agenda

> ${en.definition}

- Type: browser extension (Manifest V3) for WhatsApp Web. Version ${VERSION}.
- Browsers: Chrome, Brave, Edge and Opera (Chromium 111 or later).
- Exports: contacts from groups, chats and WhatsApp Business labels.
- Formats: Google Contacts (CSV), phone (vCard .vcf), Excel (CSV) and JSON.
- Languages: the extension and this site are available in English and Spanish.
- Privacy: everything runs in the browser; no servers, no accounts, no telemetry. It only asks for access to web.whatsapp.com.
- License: MIT, open source.
- Author: ${AUTHOR.name} (${AUTHOR.url}).
- Not affiliated with WhatsApp or Meta.

## Pages

- [Home (English)](${url(en.routes.home)}): what it does, formats, privacy and FAQ.
- [Install guide (English)](${url(en.routes.install)}): install the extension in 7 steps, no technical knowledge needed.
- [Inicio (Spanish)](${url(es.routes.home)}): the same home page in Spanish.
- [Guía de instalación (Spanish)](${url(es.routes.install)}): the same install guide in Spanish.

## Downloads and code

- [Download clc-agenda.zip](${DOWNLOAD_URL}): latest version, ready to install.
- [GitHub repository](${REPO}): source code and technical documentation.
- [Author's site](${AUTHOR.url})

## FAQ

${en.faq.items.map(({ q, a }) => `- ${q} ${a}`).join('\n')}
`;
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
