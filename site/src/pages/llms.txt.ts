import type { APIRoute } from 'astro';
import { DEFINITION, DOWNLOAD_URL, REPO, AUTHOR, FAQ } from '../data/site.js';
import { VERSION } from '../data/structured.js';

// llms.txt (llmstxt.org): a plain summary assistants can read before citing the site
export const GET: APIRoute = ({ site }) => {
  const url = (path: string) => new URL(path, site).href;
  const body = `# CLC Agenda

> ${DEFINITION}

- Tipo: extensión de navegador (Manifest V3) para WhatsApp Web. Versión ${VERSION}.
- Navegadores: Chrome, Brave, Edge y Opera (Chromium 111 o superior).
- Exporta: contactos de grupos, chats y etiquetas de WhatsApp Business.
- Formatos: Google Contacts (CSV), celular (vCard .vcf), Excel (CSV) y JSON.
- Privacidad: todo pasa en el navegador; sin servidores, sin cuentas, sin telemetría. Solo pide acceso a web.whatsapp.com.
- Licencia: MIT, código abierto.
- Autor: ${AUTHOR.name} (${AUTHOR.url}).
- No está afiliada a WhatsApp ni a Meta.

## Páginas

- [Inicio](${url('/')}): qué hace, formatos, privacidad y preguntas frecuentes.
- [Guía de instalación](${url('/instalar')}): instalar la extensión en 7 pasos, sin saber de tecnología.

## Descargas y código

- [Descargar clc-agenda.zip](${DOWNLOAD_URL}): última versión lista para instalar.
- [Repositorio en GitHub](${REPO}): código fuente y documentación técnica.
- [Sitio del autor](${AUTHOR.url})

## Preguntas frecuentes

${FAQ.map(({ q, a }) => `- ${q} ${a}`).join('\n')}
`;
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
