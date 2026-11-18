import { expect, test, type APIResponse } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

// Sicherheits-Kopfzeilen auf jeder Antwortart der Zielumgebung (Spec §8). Erwartete Werte aus public/.htaccess.
const htaccess = readFileSync(join(process.cwd(), 'public/.htaccess'), 'utf8');
const value = (name: string) => new RegExp(`Header always set ${name} "([^"]+)"`).exec(htaccess)![1];
const EXPECTED: Record<string, string> = {
  'content-security-policy': value('Content-Security-Policy'),
  'strict-transport-security': value('Strict-Transport-Security'),
  'x-content-type-options': value('X-Content-Type-Options'),
  'cross-origin-opener-policy': value('Cross-Origin-Opener-Policy'),
  'permissions-policy': value('Permissions-Policy'),
};

// Lokal (scripts/integration-local.sh --browser) geht /api/lead.php per Proxy an den PHP-Entwicklungsserver; dort greifen die
// .htaccess-Dateien nicht. Die Kopfzeilen von /api/ sind daher nur im Container (lead.php im Webroot wie beim Hoster) prüfbar.
const API_PROXIED = process.env.RETICORA_IT_API_PROXIED === '1';

/** Jede Kopfzeile ist da; jede Wiederholung hat denselben Wert. Doppelte Kopfzeilen werden als Hinweis vermerkt (Task 2). */
function expectSecurityHeaders(r: APIResponse, label: string) {
  if (API_PROXIED && label.includes('/api/')) {
    test.info().annotations.push({ type: 'nicht geprüft', description: `${label}: Kopfzeilen nur im Container prüfbar (lokal Proxy ohne .htaccess)` });
    return;
  }
  const all = r.headersArray().map((h) => ({ name: h.name.toLowerCase(), value: h.value }));
  for (const [name, expected] of Object.entries(EXPECTED)) {
    const values = all.filter((h) => h.name === name).map((h) => h.value);
    expect(values.length, `${label}: ${name} fehlt`).toBeGreaterThan(0);
    for (const v of values) expect(v, `${label}: ${name}`).toBe(expected);
  }
  const referrer = all.filter((h) => h.name === 'referrer-policy').map((h) => h.value);
  expect(referrer.length, `${label}: referrer-policy fehlt`).toBeGreaterThan(0);
  expect(all.find((h) => h.name === 'x-powered-by'), `${label}: X-Powered-By`).toBeUndefined();
  expect(all.find((h) => h.name === 'server')?.value ?? 'Apache', `${label}: Server ohne Version`).toBe('Apache');
  const dup = [...new Set(all.map((h) => h.name).filter((n, i, a) => a.indexOf(n) !== i && n !== 'set-cookie'))];
  if (dup.length) test.info().annotations.push({ type: 'doppelte Kopfzeilen', description: `${label}: ${dup.map((n) => `${n} = ${all.filter((h) => h.name === n).map((h) => h.value).join(' | ')}`).join('; ')}` });
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
