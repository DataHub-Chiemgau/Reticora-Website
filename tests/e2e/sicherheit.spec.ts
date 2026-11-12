import { expect, test } from '@playwright/test';

const norm = (s: string) => s.replace(/ /g, ' ').replace(/\s+/g, ' ').trim();
const H2 = [
  'Betriebsmodelle',
  'Verbindungen und Ports',
  'Trennung der Kunden',
  'Zugangsdaten und Schlüssel',
  'Anmeldung und Rechte',
  'Protokoll und Zugriffe des Betriebs',
  'Datenschutz und Datenstandort',
  'Lieferkette und Uploads',
  'Sicherheitslücke melden',
  'Ihre Prüfung braucht mehr?',
];

test('Titel, Beschreibung, h1 und die neun Abschnitte plus Abschluss', async ({ page }) => {
  await page.goto('/sicherheit/');
  await expect(page).toHaveTitle('Sicherheit und Datenschutz – Reticora');
  await expect(page.locator('meta[name="description"]')).toHaveAttribute(
    'content',
    'Betriebsmodelle, Verbindungsrichtung und Ports, Mandantentrennung in der Datenbank, verschlüsselte Zugangsdaten, MFA, Audit-Kette und Datenstandort EU.',
  );
  await expect(page.locator('h1')).toHaveText('Was Ihre Informationssicherheit wissen will.');
  expect((await page.locator('main h2').allTextContents()).map(norm)).toEqual(H2);
});

test('Tabellen: Betriebsmodelle (3 Zeilen) und Ports (3 Zeilen) mit Zeilenköpfen', async ({ page }) => {
  await page.goto('/sicherheit/');
  const tables = page.locator('main table');
  await expect(tables).toHaveCount(2);
  expect(await tables.nth(0).locator('thead th').allTextContents()).toEqual(['Modell', 'Pakete', 'Wo Reticora läuft']);
  await expect(tables.nth(0).locator('tbody tr')).toHaveCount(3);
  expect(await tables.nth(0).locator('tbody th[scope="row"]').allTextContents()).toEqual(['Cloud', 'Enterprise Shared', 'Enterprise Local']);
  expect(await tables.nth(1).locator('thead th').allTextContents()).toEqual(['Richtung', 'Port', 'Zweck']);
  await expect(tables.nth(1).locator('tbody tr')).toHaveCount(3);
  await expect(tables.nth(1).locator('tbody tr').nth(1)).toContainText('4222/TCP, NATS mit mTLS');
});

test('Verbindungsschema, Kennwerte des Collectors, Abbildungen S-17 und S-14', async ({ page }) => {
  await page.goto('/sicherheit/');
  await expect(page.locator('#verbindungen svg[role="img"]')).toHaveCount(1);
  await expect(page.locator('#verbindungen figcaption')).toContainText('Abb. 1 · Der Collector verbindet sich nach außen: HTTPS 443 und NATS mit mTLS 4222. Schemazeichnung.');
  const terms = await page.locator('#verbindungen .rt-spec dt').allTextContents();
  expect(terms).toEqual(['Enrollment-Code', 'Zertifikat', 'Kanal', 'Updates']);
  expect(await page.locator('#zugangsdaten .rt-spec dt').allTextContents()).toEqual([
    'Signaturschlüssel der Sitzungen', 'Datenschlüssel je Organisation', 'Hauptschlüssel', 'API-Schlüssel',
  ]);
  const ids = await page.locator('[data-placeholder^="S-"]').evaluateAll((els) => els.map((e) => e.getAttribute('data-placeholder')));
  expect(ids).toEqual(['S-17', 'S-14']);
  expect(await page.locator('figcaption b').allTextContents()).toEqual(['Abb. 1 ·', 'Abb. 2 ·', 'Abb. 3 ·']);
});

test('Meldeweg für Sicherheitslücken ist ein sichtbarer Platzhalter mit data-placeholder', async ({ page }) => {
  await page.goto('/sicherheit/');
  const ph = page.locator('#luecke-melden [data-placeholder]');
  await expect(ph).toBeVisible();
  await expect(ph).toHaveText('[Meldeweg für Sicherheitslücken: Adresse vom Anbieter]');
  await expect(page.locator('#datenschutz [data-placeholder]')).toHaveText('[Auftragsverarbeitung: Angabe vom Anbieter]');
});

test('Belege; nicht genannt werden C-16 und C-17; Verweise auf Subprozessoren und Datenschutz', async ({ page }) => {
  await page.goto('/sicherheit/');
  for (const c of ['C-07', 'C-02', 'C-92', 'C-77', 'C-41', 'C-42', 'C-06', 'C-78', 'C-93', 'C-13', 'C-80', 'C-75', 'C-79', 'C-34', 'C-33', 'C-84', 'C-89', 'C-81', 'C-12', 'C-69', 'C-82', 'C-14', 'C-83', 'C-20', 'C-15', 'C-60', 'C-39'])
    await expect(page.locator(`main [data-claim="${c}"]`).first(), c).toBeAttached();
  await expect(page.locator('[data-claim="C-16"], [data-claim="C-17"]')).toHaveCount(0);
  await expect(page.locator('main')).not.toContainText(/Penetrationstest|Zertifizier/);
  await expect(page.locator('#datenschutz').getByRole('link', { name: 'Subprozessoren' })).toHaveAttribute('href', '/subprozessoren/');
  await expect(page.locator('#datenschutz').getByRole('link', { name: 'Datenschutzerklärung' })).toHaveAttribute('href', '/datenschutz/');
});

test('Kontakt-Knöpfe tragen das Anliegen „Sicherheit und Datenschutz“', async ({ page }) => {
  await page.goto('/sicherheit/');
  await expect(page.locator('.page-hero').getByRole('link', { name: 'Kontakt' })).toHaveAttribute('href', '/kontakt/?topic=security');
  await expect(page.locator('#abschluss .rt-btn--primary')).toHaveAttribute('href', '/kontakt/?topic=security');
  expect(await page.locator('.page-hero .rt-btn').allTextContents()).toEqual(['Kontakt', 'Live-Demo']);
  expect((await page.locator('#abschluss .rt-btn').allTextContents()).map(norm)).toEqual(['Kontakt', 'Live-Demo', '30 Tage testen']);
});

test('die Tabellen sind bei 320 px erreichbar, ohne die Seite zu verbreitern', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto('/sicherheit/');
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0);
});
