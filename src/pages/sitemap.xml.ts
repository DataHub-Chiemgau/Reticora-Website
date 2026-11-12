import type { APIRoute } from 'astro';
import { SITE } from '../data/site';
import { ROUTES, isBuilt } from '../i18n/routes';

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** Gebaute Seiten beider Sprachen; noindex-Seiten fehlen, Alternativen stehen nur bei gebautem Gegenstück. */
export const GET: APIRoute = () => {
  const entries: string[] = [];
  for (const r of ROUTES) {
    if (r.noindex) continue;
    const both = isBuilt(r.de) && isBuilt(r.en);
    const alts = both
      ? [
          `<xhtml:link rel="alternate" hreflang="de" href="${esc(SITE.url + r.de)}"/>`,
          `<xhtml:link rel="alternate" hreflang="en" href="${esc(SITE.url + r.en)}"/>`,
          `<xhtml:link rel="alternate" hreflang="x-default" href="${esc(SITE.url + r.de)}"/>`,
        ]
      : [];
    for (const p of [r.de, r.en]) {
      if (!isBuilt(p)) continue;
      entries.push(`  <url><loc>${esc(SITE.url + p)}</loc>${alts.join('')}</url>`);
    }
  }
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${entries.join('\n')}\n</urlset>\n`;
  return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
