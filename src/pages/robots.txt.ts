import type { APIRoute } from 'astro';
import { SITE } from '../data/site';
import { robotsTxt } from '../lib/discover';

export const GET: APIRoute = () =>
  new Response(robotsTxt(process.env.RETICORA_RELEASE === '1', SITE.url), { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
