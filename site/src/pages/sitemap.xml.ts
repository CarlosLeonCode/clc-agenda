import type { APIRoute } from 'astro';
import { BUILD_DATE } from '../data/structured.js';
import { LANGS, twins } from '../i18n/index.js';

const PAGES = ['home', 'install'];

// Every URL lists its language twins (and x-default → English) so search engines
// serve the right language without an auto-redirect
export const GET: APIRoute = ({ site }) => {
  const lastmod = BUILD_DATE.slice(0, 10);
  const abs = (path: string) => new URL(path, site).href;
  const urls = PAGES.flatMap(page => {
    const languages = twins(page);
    const alternates = [
      ...LANGS.map(l => `    <xhtml:link rel="alternate" hreflang="${l}" href="${abs(languages[l])}"/>`),
      `    <xhtml:link rel="alternate" hreflang="x-default" href="${abs(languages.en)}"/>`
    ].join('\n');
    return LANGS.map(l => `  <url>\n    <loc>${abs(languages[l])}</loc>\n    <lastmod>${lastmod}</lastmod>\n${alternates}\n  </url>`);
  });
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${urls.join('\n')}\n</urlset>\n`;
  return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
