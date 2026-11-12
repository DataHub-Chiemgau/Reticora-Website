import type { APIRoute } from 'astro';
import { SITE } from '../data/site';
import { sitemapXml } from '../lib/discover';
import { ROUTES } from '../i18n/routes';

/** Die Sitemap wird auch im Entwicklungs-Build erzeugt; dort sperrt robots.txt alles und jede Seite trägt noindex. */
export const GET: APIRoute = () =>
  new Response(sitemapXml(ROUTES, SITE.url), { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
