import type { APIRoute } from 'astro';
import { BUILD_DATE } from '../data/structured.js';

const PAGES = ['/', '/instalar'];

export const GET: APIRoute = ({ site }) => {
  const lastmod = BUILD_DATE.slice(0, 10);
  const urls = PAGES.map(path => `  <url>\n    <loc>${new URL(path, site).href}</loc>\n    <lastmod>${lastmod}</lastmod>\n  </url>`);
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`;
  return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
