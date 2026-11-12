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

test('unbekannter Pfad: Status 404, Seite mit Links Startseite, Impressum, Datenschutz', async ({ page }) => {
  const response = await page.goto('/gibt-es-nicht/');
  expect(response!.status()).toBe(404);
  expect(response!.headers()['content-security-policy']).toBe(CSP);
  await expect(page.locator('h1')).toHaveText('Diese Seite gibt es nicht');
  await expect(page.getByRole('link', { name: 'Zur Startseite' })).toHaveAttribute('href', '/');
  await expect(page.getByRole('link', { name: 'Kontakt' })).toHaveAttribute('href', '/kontakt/');
  await expect(page.getByRole('link', { name: 'Impressum' })).toHaveAttribute('href', '/impressum/');
  await expect(page.getByRole('link', { name: 'Datenschutz' })).toHaveAttribute('href', '/datenschutz/');
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
  for (const p of ['/', '/gibt-es-nicht/']) {
    await page.goto(p);
    await page.evaluate(() => document.fonts.ready);
  }
  expect(messages.filter((t) => /content security policy|refused to/i.test(t))).toEqual([]);
});
