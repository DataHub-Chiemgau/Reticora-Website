import type { APIRoute } from 'astro';
import { SITE } from '../data/site';

/** Nur der Release-Build (RETICORA_RELEASE=1) erlaubt das Durchsuchen. */
export const GET: APIRoute = () => {
  const open = process.env.RETICORA_RELEASE === '1';
  const body = ['User-agent: *', open ? 'Allow: /' : 'Disallow: /', '', `Sitemap: ${SITE.url}/sitemap.xml`, ''].join('\n');
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
