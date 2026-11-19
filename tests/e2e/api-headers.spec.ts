/**
 * Kopfzeilen und Grenzen von /api/lead.php über Apache mit .htaccess und PHP über FastCGI, wie beim Hoster
 * (tests/server/start.sh: Webroot-Kopie mit api/.htaccess aus backend/public, PHP-FPM über mod_proxy_fcgi).
 * Sicherheitsprüfung S-04, S-05, S-06, S-07. Die Variante „PHP als Apache-Modul“ prüft tests/e2e-integration im Container.
 */
import { expect, test } from '@playwright/test';
import { request as httpRequest } from 'node:http';
import { expectApiHeaders } from './helpers/headers';
import { leadCount, uniqueEmail } from './helpers/backend';

const ORIGIN = 'http://127.0.0.1:8080';
const form = (email: string, extra: Record<string, string> = {}) => ({ name: 'Kopf Zeile', email, company: 'X GmbH', topic: 'demo', message: '', lang: 'de', ...extra });

test.describe.configure({ mode: 'parallel' });
// Kopfzeilen hängen nicht vom Browser ab; einmal je Lauf genügt.
test.skip(({ browserName }) => browserName !== 'chromium', 'nur HTTP, kein Browser');

test('405 auf GET, HEAD und OPTIONS', async ({ request }) => {
  for (const method of ['GET', 'HEAD', 'OPTIONS'] as const) {
    const r = await request.fetch('/api/lead.php', { method, maxRedirects: 0 });
    expect(r.status(), method).toBe(405);
    expect(r.headers()['allow']).toBe('POST');
    expectApiHeaders(r, `405 ${method}`);
  }
});

test('403 bei fremder Origin, 415 bei falschem Inhaltstyp, 413 über 16 KB', async ({ request }) => {
  const foreign = await request.post('/api/lead.php', { form: form(uniqueEmail('kopf')), headers: { Origin: 'https://evil.example', Accept: 'application/json' }, maxRedirects: 0 });
  expect(foreign.status()).toBe(403);
  expectApiHeaders(foreign, '403');
  const json = await request.post('/api/lead.php', { data: '{"name":"x"}', headers: { Origin: ORIGIN, 'Content-Type': 'application/json' }, maxRedirects: 0 });
  expect(json.status()).toBe(415);
  expectApiHeaders(json, '415');
  const big = await request.post('/api/lead.php', { data: 'name=' + 'x'.repeat(20_000), headers: { Origin: ORIGIN, 'Content-Type': 'application/x-www-form-urlencoded' }, maxRedirects: 0 });
  expect(big.status()).toBe(413);
  expectApiHeaders(big, '413');
});

test('422 als JSON und als Kontaktseite (HTML), 200 als JSON und 303 auf die Dankeseite', async ({ request }) => {
  const bad = { ...form(uniqueEmail('kopf')), email: 'kein-at' };
  const j = await request.post('/api/lead.php', { form: bad, headers: { Origin: ORIGIN, Accept: 'application/json' }, maxRedirects: 0 });
  expect(j.status()).toBe(422);
  expectApiHeaders(j, '422 JSON');
  const h = await request.post('/api/lead.php', { form: bad, headers: { Origin: ORIGIN }, maxRedirects: 0 });
  expect(h.status()).toBe(422);
  expect(h.headers()['content-type']).toBe('text/html; charset=utf-8');
  expectApiHeaders(h, '422 HTML');
  // Köderfeld: Antwort wie Erfolg, nichts gespeichert
  const ok = await request.post('/api/lead.php', { form: form(uniqueEmail('kopf'), { website: 'x' }), headers: { Origin: ORIGIN, Accept: 'application/json' }, maxRedirects: 0 });
  expect(ok.status()).toBe(200);
  expectApiHeaders(ok, '200 JSON');
  const see = await request.post('/api/lead.php', { form: form(uniqueEmail('kopf'), { website: 'x' }), headers: { Origin: ORIGIN }, maxRedirects: 0 });
  expect(see.status()).toBe(303);
  expect(see.headers()['location']).toBe('/kontakt/danke/');
  expectApiHeaders(see, '303');
});

test('nur lead.php ist erreichbar: andere Dateien unter /api/ sind gesperrt', async ({ request }) => {
  for (const p of ['/api/', '/api/.htaccess', '/api/gibt-es-nicht.php']) {
    const r = await request.get(p, { maxRedirects: 0 });
    expect(r.status(), p).toBeGreaterThanOrEqual(403);
    expect(r.status(), p).toBeLessThanOrEqual(404);
  }
});

/** POST mit Transfer-Encoding: chunked (ohne Content-Length), wie ihn kein Browser für Formulare sendet. */
function chunked(body: string): Promise<{ status: number; headers: Record<string, string | string[] | undefined> }> {
  return new Promise((resolve, reject) => {
    const req = httpRequest(`${ORIGIN}/api/lead.php`, { method: 'POST', headers: { Origin: ORIGIN, Accept: 'application/json', 'Content-Type': 'application/x-www-form-urlencoded', 'Transfer-Encoding': 'chunked' } }, (res) => {
      res.resume();
      res.on('end', () => resolve({ status: res.statusCode ?? 0, headers: res.headers }));
    });
    req.on('error', reject);
    for (let i = 0; i < body.length; i += 1000) req.write(body.slice(i, i + 1000));
    req.end();
  });
}

test('S-06: Transfer-Encoding chunked: Antwort und Speicherung stimmen überein, über 16 KB wird nichts gespeichert', async () => {
  // Mit PHP-FPM liest Apache (mod_proxy_fcgi) den Körper ganz, prüft LimitRequestBody und übergibt ihn mit Content-Length;
  // mit PHP als Modul fehlt die Länge, dann lehnt lead.php mit 411 ab (AppTest, tests/e2e-integration im Container).
  const small = uniqueEmail('chunk-klein');
  const r1 = await chunked(new URLSearchParams(form(small)).toString());
  expect([200, 411]).toContain(r1.status);
  expect(leadCount(small)).toBe(r1.status === 200 ? 1 : 0);
  const large = uniqueEmail('chunk-gross');
  const r2 = await chunked(new URLSearchParams(form(large, { message: 'x'.repeat(19_000) })).toString());
  expect([411, 413]).toContain(r2.status);
  expect(leadCount(large)).toBe(0);
});
