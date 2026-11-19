import { expect, test, type APIResponse } from '@playwright/test';
import { request as httpRequest } from 'node:http';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { mailsAbout, uniqueEmail } from './helpers/mailbox';

// Sicherheits-Kopfzeilen auf jeder Antwortart der Zielumgebung (Spec §8). Erwartete Werte aus public/.htaccess.
const htaccess = readFileSync(join(process.cwd(), 'public/.htaccess'), 'utf8');
const value = (name: string) => new RegExp(`Header always set ${name} "([^"]+)"`).exec(htaccess)![1];
const EXPECTED: Record<string, string> = {
  'content-security-policy': value('Content-Security-Policy'),
  'strict-transport-security': value('Strict-Transport-Security'),
  'x-content-type-options': value('X-Content-Type-Options'),
  'cross-origin-opener-policy': value('Cross-Origin-Opener-Policy'),
  'permissions-policy': value('Permissions-Policy'),
  'referrer-policy': value('Referrer-Policy'),
};

/**
 * Jede Sicherheitskopfzeile genau einmal mit dem Wert aus public/.htaccess, keine Kopfzeile doppelt (S-04: mit PHP als Modul
 * standen die Werte von PHP und von .htaccess nebeneinander), kein X-Powered-By (S-05), Server ohne Version.
 * Lokal (scripts/integration-local.sh --browser) läuft lead.php über PHP-FPM, im Container als Apache-Modul.
 */
function expectSecurityHeaders(r: APIResponse, label: string) {
  const all = r.headersArray().map((h) => ({ name: h.name.toLowerCase(), value: h.value }));
  for (const [name, expected] of Object.entries(EXPECTED)) {
    expect(all.filter((h) => h.name === name).map((h) => h.value), `${label}: ${name}`).toEqual([expected]);
  }
  expect(all.find((h) => h.name === 'x-powered-by'), `${label}: X-Powered-By`).toBeUndefined();
  expect(all.find((h) => h.name === 'server')?.value ?? 'Apache', `${label}: Server ohne Version`).toBe('Apache');
  const names = all.map((h) => h.name);
  const dup = [...new Set(names.filter((n, i) => names.indexOf(n) !== i))];
  expect(dup.map((n) => `${n} = ${all.filter((h) => h.name === n).map((h) => h.value).join(' | ')}`), `${label}: doppelte Kopfzeilen`).toEqual([]);
}

const origin = (base: string | undefined) => new URL(base ?? 'http://127.0.0.1:8088').origin;
const form = { name: 'Erika', email: 'kein-at', company: 'X GmbH', topic: 'demo', message: '', lang: 'de' };

test('200: Startseite', async ({ request }) => {
  const r = await request.get('/', { maxRedirects: 0 });
  expect(r.status()).toBe(200);
  expectSecurityHeaders(r, '200 /');
});

test('301: /index.html', async ({ request }) => {
  const r = await request.get('/index.html', { maxRedirects: 0 });
  expect(r.status()).toBe(301);
  expectSecurityHeaders(r, '301 /index.html');
});

test('404: unbekannter Pfad', async ({ request }) => {
  const r = await request.get('/gibt-es-nicht/', { maxRedirects: 0 });
  expect(r.status()).toBe(404);
  expectSecurityHeaders(r, '404');
});

test('405: GET /api/lead.php', async ({ request }) => {
  const r = await request.get('/api/lead.php', { maxRedirects: 0 });
  expect(r.status()).toBe(405);
  expect(r.headers()['allow']).toBe('POST');
  expectSecurityHeaders(r, '405 /api/lead.php');
});

test('413: Anfragekörper über 16 KB an /api/lead.php', async ({ request, baseURL }) => {
  const r = await request.post('/api/lead.php', {
    data: 'name=' + 'x'.repeat(20_000),
    headers: { Origin: origin(baseURL), 'Content-Type': 'application/x-www-form-urlencoded' },
    maxRedirects: 0,
  });
  expect(r.status()).toBe(413);
  expectSecurityHeaders(r, '413 /api/lead.php');
});

test('422: ungültiges Formular an /api/lead.php', async ({ request, baseURL }) => {
  const r = await request.post('/api/lead.php', { form, headers: { Origin: origin(baseURL) }, maxRedirects: 0 });
  expect(r.status()).toBe(422);
  expectSecurityHeaders(r, '422 /api/lead.php');
});

test('422 als JSON und 403 bei fremder Origin an /api/lead.php', async ({ request, baseURL }) => {
  const json = await request.post('/api/lead.php', { form, headers: { Origin: origin(baseURL), Accept: 'application/json' }, maxRedirects: 0 });
  expect(json.status()).toBe(422);
  expect(await json.json()).toEqual({ ok: false, errors: { email: 'email.invalid' } });
  expectSecurityHeaders(json, '422 JSON /api/lead.php');
  const foreign = await request.post('/api/lead.php', { form, headers: { Origin: 'https://evil.example' }, maxRedirects: 0 });
  expect(foreign.status()).toBe(403);
  expectSecurityHeaders(foreign, '403 /api/lead.php');
});

test('422 als Kontaktseite (HTML) an /api/lead.php: Kopfzeilen der Website, je einmal', async ({ request, baseURL }) => {
  const r = await request.post('/api/lead.php', { form, headers: { Origin: origin(baseURL) }, maxRedirects: 0 });
  expect(r.status()).toBe(422);
  expect(r.headers()['content-type']).toBe('text/html; charset=utf-8');
  expectSecurityHeaders(r, '422 HTML /api/lead.php');
});

/** POST mit Transfer-Encoding: chunked (ohne Content-Length), wie ihn kein Browser für Formulare sendet. */
function chunked(base: string, body: string): Promise<number> {
  return new Promise((resolve, reject) => {
    const req = httpRequest(`${base}/api/lead.php`, { method: 'POST', headers: { Origin: base, Accept: 'application/json', 'Content-Type': 'application/x-www-form-urlencoded', 'Transfer-Encoding': 'chunked' } }, (res) => {
      res.resume();
      res.on('end', () => resolve(res.statusCode ?? 0));
    });
    req.on('error', reject);
    for (let i = 0; i < body.length; i += 1000) req.write(body.slice(i, i + 1000));
    req.end();
  });
}

test('S-06: über 16 KB mit Transfer-Encoding chunked wird abgelehnt, und es geht keine Mail hinaus', async ({ baseURL }) => {
  // Früher (PHP als Modul): Apache kürzte auf 16 KB und antwortete 413, PHP speicherte und mailte trotzdem.
  const base = origin(baseURL);
  const email = uniqueEmail('chunked');
  const status = await chunked(base, new URLSearchParams({ name: 'Erika', email, company: 'X GmbH', topic: 'demo', lang: 'de', message: 'x'.repeat(19_000) }).toString());
  expect([411, 413]).toContain(status);
  await new Promise((r) => setTimeout(r, 1500));
  expect(await mailsAbout(email)).toEqual({ toSales: 0, replyTo: 0, toVisitor: 0 });
});
