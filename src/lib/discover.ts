import { alternates, isBuilt, type Route } from '../i18n/routes';

export interface SitemapEntry { loc: string; alternates: { hreflang: string; href: string }[] }

/** Gebaute Seiten beider Sprachen ohne noindex-Seiten; Alternativen nur bei gebautem Paar. Adressen ohne Ursprung. */
export function sitemapEntries(routes: Route[]): SitemapEntry[] {
  const out: SitemapEntry[] = [];
  for (const r of routes) {
    if (r.noindex) continue;
    for (const p of [r.de, r.en]) {
      if (!isBuilt(p, routes)) continue;
      const a = alternates(p, routes);
      out.push({
        loc: p,
        alternates: a ? [{ hreflang: 'de', href: a.de }, { hreflang: 'en', href: a.en }, { hreflang: 'x-default', href: a.xDefault }] : [],
      });
    }
  }
  return out;
}

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export function sitemapXml(routes: Route[], origin: string): string {
  const rows = sitemapEntries(routes).map(
    (e) =>
      `  <url><loc>${esc(origin + e.loc)}</loc>${e.alternates.map((a) => `<xhtml:link rel="alternate" hreflang="${a.hreflang}" href="${esc(origin + a.href)}"/>`).join('')}</url>`,
  );
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${rows.join('\n')}\n</urlset>\n`;
}

/** Nur der Release-Build erlaubt das Durchsuchen; sonst ist alles gesperrt. */
export function robotsTxt(release: boolean, origin: string): string {
  return ['User-agent: *', release ? 'Allow: /' : 'Disallow: /', '', `Sitemap: ${origin}/sitemap.xml`, ''].join('\n');
}
