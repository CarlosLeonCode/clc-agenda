import type { APIRoute } from 'astro';

// Everyone may crawl, AI crawlers named explicitly so answers can cite the site
const AI_CRAWLERS = ['GPTBot', 'ClaudeBot', 'PerplexityBot', 'Google-Extended'];

export const GET: APIRoute = ({ site }) => {
  const lines = [
    'User-agent: *',
    'Allow: /',
    '',
    ...AI_CRAWLERS.flatMap(bot => [`User-agent: ${bot}`, 'Allow: /', '']),
    `Sitemap: ${new URL('/sitemap.xml', site).href}`,
    ''
  ];
  return new Response(lines.join('\n'), { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
