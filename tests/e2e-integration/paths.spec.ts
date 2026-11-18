import { expect, test } from '@playwright/test';
import { ui } from '../../src/i18n';

// Gesperrte Pfade und Fehlerseiten der Zielumgebung (public/.htaccess, backend/public/.htaccess).
const BLOCKED = ['/backend/', '/backend/config.php', '/backend/src/App.php', '/.git/config', '/.env', '/.htaccess', '/api/.htaccess', '/en/.htaccess', '/api/'];

for (const path of BLOCKED)
  test(`gesperrt: ${path}`, async ({ request }) => {
    const r = await request.get(path, { maxRedirects: 0 });
    expect([403, 404]).toContain(r.status());
    const body = await r.text();
    expect(body).not.toContain('Index of');
    expect(body).not.toContain('<?php');
    expect(body).not.toMatch(/RewriteRule|Require all/);
    expect(r.headers()['content-security-policy']).toBeTruthy();
  });

test('Backend außerhalb des Webroots: config.php, vendor und bin sind nicht erreichbar', async ({ request }) => {
  for (const path of ['/reticora/config.php', '/../reticora/config.php', '/config.php', '/vendor/autoload.php', '/bin/purge.php', '/api/../../reticora/config.php']) {
    const r = await request.get(path, { maxRedirects: 0 });
    expect(r.status(), path).toBe(404);
    expect(await r.text()).not.toContain('<?php');
  }
});

test('.well-known ist nicht gesperrt (404 statt 403)', async ({ request }) => {
  const r = await request.get('/.well-known/gibt-es-nicht', { maxRedirects: 0 });
  expect(r.status()).toBe(404);
});

test('/en/: englische 404-Seite', async ({ page }) => {
  const res = await page.goto('/en/gibt-es-nicht/');
  expect(res?.status()).toBe(404);
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.locator('h1')).toHaveText(ui('en').notFound.h1);
  expect(res?.headers()['content-security-policy']).toBeTruthy();
});

test('deutsche 404-Seite', async ({ page }) => {
  const res = await page.goto('/gibt-es-nicht/');
  expect(res?.status()).toBe(404);
  await expect(page.locator('html')).toHaveAttribute('lang', 'de');
  await expect(page.locator('h1')).toHaveText(ui('de').notFound.h1);
});
