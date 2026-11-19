import { expect, test } from '@playwright/test';

const CSP = "default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self' data:; font-src 'self'; connect-src 'self'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'";

for (const path of ['/', '/gibt-es-nicht/', '/index.html', '/_astro'])
  test(`Kopfzeilen auf ${path}`, async ({ request }) => {
    const r = await request.get(path, { maxRedirects: 0 });
    expect(r.headers()['content-security-policy']).toBe(CSP);
    expect(r.headers()['strict-transport-security']).toBe('max-age=31536000');
    expect(r.headers()['x-content-type-options']).toBe('nosniff');
    expect(r.headers()['referrer-policy']).toBe('strict-origin-when-cross-origin');
    expect(r.headers()['cross-origin-opener-policy']).toBe('same-origin');
    expect(r.headers()['permissions-policy']).toContain('camera=()');
  });

test('/index.html leitet dauerhaft auf / um', async ({ request }) => {
  const r = await request.get('/index.html', { maxRedirects: 0 });
  expect(r.status()).toBe(301);
  expect(r.headers()['location']).toMatch(/\/$/);
  expect(new URL(r.headers()['location'], 'http://127.0.0.1:8080').pathname).toBe('/');
});

test('Verzeichnis ohne Schrägstrich leitet auf die Schrägstrich-Form um und trägt Kopfzeilen', async ({ request }) => {
  const r = await request.get('/_astro', { maxRedirects: 0 });
  expect(r.status()).toBe(301);
  expect(new URL(r.headers()['location'], 'http://127.0.0.1:8080').pathname).toBe('/_astro/');
});

test('Host reticora.de leitet in einem Schritt auf https://www.reticora.de/ um', async ({ request }) => {
  const r = await request.get('/', { maxRedirects: 0, headers: { Host: 'reticora.de' } });
  expect(r.status()).toBe(301);
  expect(r.headers()['location']).toBe('https://www.reticora.de/');
  expect(r.headers()['strict-transport-security']).toBe('max-age=31536000');
});

test('Host www.reticora.de über http leitet auf https um', async ({ request }) => {
  const r = await request.get('/', { maxRedirects: 0, headers: { Host: 'www.reticora.de' } });
  expect(r.status()).toBe(301);
  expect(r.headers()['location']).toBe('https://www.reticora.de/');
});

test('unbekannter Pfad: Status 404, Seite mit Wegen weiter laut Textdokument', async ({ page }) => {
  const response = await page.goto('/gibt-es-nicht/');
  expect(response!.status()).toBe(404);
  expect(response!.headers()['content-security-policy']).toBe(CSP);
  await expect(page.locator('h1')).toHaveText('Diese Seite gibt es nicht.');
  const nav = page.getByRole('navigation', { name: 'Weiterführende Links' });
  await expect(nav.getByRole('link', { name: 'Startseite' })).toHaveAttribute('href', '/');
  await expect(nav.getByRole('link', { name: 'Kontakt' })).toHaveAttribute('href', '/kontakt/');
  await expect(nav.getByRole('link', { name: 'Preise' })).toHaveAttribute('href', '/preise/');
});

test('Dateien unter /_astro/ ein Jahr im Cache, HTML ohne Cache', async ({ page, request }) => {
  const urls: string[] = [];
  page.on('response', (r) => urls.push(r.url()));
  await page.goto('/');
  await page.evaluate(() => document.fonts.ready);
  const asset = urls.find((u) => u.includes('/_astro/'));
  expect(asset).toBeTruthy();
  const a = await request.get(asset!);
  expect(a.headers()['cache-control']).toBe('public, max-age=31536000, immutable');
  for (const p of ['/', '/gibt-es-nicht/']) {
    const h = await request.get(p);
    expect(h.headers()['cache-control']).toBe('no-cache');
  }
});

test('keine CSP-Verstöße in der Konsole', async ({ page }) => {
  const messages: string[] = [];
  page.on('console', (m) => messages.push(m.text()));
  page.on('pageerror', (e) => messages.push(String(e)));
  await page.addInitScript(() => {
    (window as any).__csp = [];
    document.addEventListener('securitypolicyviolation', (e) => (window as any).__csp.push(`${e.violatedDirective} ${e.blockedURI}`));
  });
  for (const p of ['/', '/gibt-es-nicht/']) {
    await page.goto(p);
    await page.evaluate(() => document.fonts.ready);
    expect(await page.evaluate(() => (window as any).__csp)).toEqual([]);
  }
  expect(messages.filter((t) => /content[- ]security[- ]policy|refused to/i.test(t))).toEqual([]);
});

test('/ auf localhost antwortet mit 200 ohne Weiterleitung', async ({ request }) => {
  const r = await request.get('/', { maxRedirects: 0 });
  expect(r.status()).toBe(200);
  expect(r.headers()['location']).toBeUndefined();
});

test('Host reticora.de auf /index.html: erst Hostwechsel (301 auf https://www.reticora.de/index.html), index.html wird im zweiten Schritt entfernt', async ({ request }) => {
  const r = await request.get('/index.html', { maxRedirects: 0, headers: { Host: 'reticora.de' } });
  expect(r.status()).toBe(301);
  expect(r.headers()['location']).toBe('https://www.reticora.de/index.html');
  expect(r.headers()['strict-transport-security']).toBe('max-age=31536000');
});

test('fehlende Datei unter /_astro/: 404 ohne immutable, mit Kopfzeilen', async ({ request }) => {
  const r = await request.get('/_astro/gibt-es-nicht.abc123.css', { maxRedirects: 0 });
  expect(r.status()).toBe(404);
  expect(r.headers()['cache-control'] ?? '').not.toContain('immutable');
  expect(r.headers()['content-security-policy']).toBe(CSP);
});

test('/_astro/ (Verzeichnis ohne Index) zeigt die eigene Fehlerseite, nicht die Apache-Standardseite', async ({ request }) => {
  const r = await request.get('/_astro/', { maxRedirects: 0 });
  expect([403, 404]).toContain(r.status());
  const body = await r.text();
  expect(body).toContain('Diese Seite gibt es nicht.');
  expect(body).not.toContain('Apache');
  expect(r.headers()['cache-control'] ?? '').not.toContain('immutable');
  expect(r.headers()['content-security-policy']).toBe(CSP);
});

test('CSP erlaubt Formular und Anfragen nur an die eigene Herkunft', async ({ request }) => {
  const csp = (await request.get('/')).headers()['content-security-policy'];
  expect(csp).toContain("form-action 'self'");
  expect(csp).toContain("connect-src 'self'");
  expect(csp).toContain("default-src 'none'");
});

for (const p of ['/backend/', '/backend/src/App.php', '/backend/config.php', '/backend/bin/migrate.php', '/.htaccess', '/.git/config', '/_astro/.env'])
  test(`kein Webzugriff auf ${p}`, async ({ request }) => {
    const r = await request.get(p, { maxRedirects: 0 });
    expect(r.status()).toBe(403);
    expect(await r.text()).not.toContain('<?php');
  });

test('/en/index.html leitet in /en/ um (Rewrite-Regeln gelten auch im Unterordner mit eigener .htaccess)', async ({ request }) => {
  const r = await request.get('/en/index.html', { maxRedirects: 0 });
  expect(r.status()).toBe(301);
  expect(new URL(r.headers()['location'], 'http://127.0.0.1:8080').pathname).toBe('/en/');
});

test('Unterordner /en/: Kopfzeilen und Hostwechsel gelten weiter', async ({ request }) => {
  const r = await request.get('/en/gibt-es-nicht/', { maxRedirects: 0 });
  expect(r.status()).toBe(404);
  expect(r.headers()['content-security-policy']).toBe(CSP);
  expect(r.headers()['cache-control']).toBe('no-cache');
  const h = await request.get('/en/gibt-es-nicht/', { maxRedirects: 0, headers: { Host: 'reticora.de' } });
  expect(h.status()).toBe(301);
  expect(h.headers()['location']).toBe('https://www.reticora.de/en/gibt-es-nicht/');
});
