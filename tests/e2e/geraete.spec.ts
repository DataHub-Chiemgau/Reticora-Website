import { expect, test } from '@playwright/test';
import { DEVICES } from '../../src/data/devices';

const norm = (s: string) => s.replace(/ /g, ' ').replace(/\s+/g, ' ').trim();
const CATEGORIES: [string, string][] = [
  ['network', 'Netzwerk'],
  ['server', 'Server und Virtualisierung'],
  ['storage', 'Storage'],
  ['power', 'Strom'],
];
const count = (n: number) => (n === 1 ? '1 Gerätefamilie' : `${n} Gerätefamilien`);
const inCategory = (c: string) => DEVICES.filter((d) => d.category === c).length;

test('Titel, Beschreibung, h1 und h2 wie im Textdokument', async ({ page }) => {
  await page.goto('/geraete/');
  await expect(page).toHaveTitle('Unterstützte Geräte und Protokolle – Reticora');
  await expect(page.locator('meta[name="description"]')).toHaveAttribute(
    'content',
    'Welche Switches, Router, Firewalls, Server, NAS, USVs und PDUs der Collector erkennt, über welche Protokolle, und was mit unbekannten Geräten geschieht.',
  );
  await expect(page.locator('h1')).toHaveText('Wird Ihr Gerät erkannt?');
  expect((await page.locator('main h2').allTextContents()).map(norm)).toEqual([
    'Gerätefamilien',
    'So erkennt der Collector ein Gerät',
    'Was mit unbekannten Geräten geschieht',
    'Profile ergänzen',
    'Testen Sie Reticora 30 Tage mit Ihrem eigenen Netz.',
  ]);
  for (const c of ['C-08', 'C-40', 'C-49', 'C-91', 'C-88']) await expect(page.locator(`[data-claim="${c}"]`).first()).toHaveCount(1);
});

test('Tabelle: echte Tabelle mit Spaltenköpfen, eine Zeile je Gerätefamilie aus DEVICES, nach Kategorie gegliedert', async ({ page }) => {
  await page.goto('/geraete/');
  const heads = await page.locator('main table thead th[scope="col"]').allTextContents();
  expect(heads).toEqual(['Hersteller', 'Familie', 'Protokolle']);
  await expect(page.locator('main table tbody[data-cat]')).toHaveCount(CATEGORIES.length);
  for (const [cat, label] of CATEGORIES) {
    const body = page.locator(`tbody[data-cat="${cat}"]`);
    await expect(body.locator('th[scope="rowgroup"]')).toHaveText(label);
    await expect(body.locator('tr:not(.dev-group)')).toHaveCount(inCategory(cat));
  }
  const rows = page.locator('tbody[data-cat] tr:not(.dev-group)');
  await expect(rows).toHaveCount(DEVICES.length);
  const cells = await rows.evaluateAll((trs) => trs.map((tr) => [...tr.children].map((c) => c.textContent)));
  const expected = CATEGORIES.flatMap(([cat]) => DEVICES.filter((d) => d.category === cat).map((d) => [d.vendor, d.family, d.protocols.join(', ')]));
  expect(cells).toEqual(expected);
});

test('Markenhinweis und Hinweis auf schmale Bildschirme stehen auf der Seite', async ({ page }) => {
  await page.goto('/geraete/');
  await expect(page.getByText('Herstellernamen sind Marken ihrer Inhaber und stehen hier nur zur Beschreibung der Kompatibilität.')).toBeVisible();
  await expect(page.getByText('Die Tabelle lässt sich seitlich verschieben.')).toHaveCount(1);
});

test('ohne JavaScript sind alle Zeilen sichtbar, der Filter ist verborgen, die Zahl steht in der Ergebniszeile', async ({ browser }) => {
  const ctx = await browser.newContext({ javaScriptEnabled: false });
  const page = await ctx.newPage();
  await page.goto('/geraete/');
  await expect(page.locator('tbody[data-cat]:visible')).toHaveCount(CATEGORIES.length);
  await expect(page.locator('tbody[data-cat] tr:not(.dev-group):visible')).toHaveCount(DEVICES.length);
  await expect(page.locator('[data-filter] [role="group"]')).toBeHidden();
  await expect(page.locator('[data-filter] button:visible')).toHaveCount(0);
  await expect(page.locator('[aria-live="polite"]')).toHaveText(count(DEVICES.length));
  await ctx.close();
});

test('Filter „Storage“ zeigt nur Storage-Zeilen und meldet die Anzahl in der aria-live-Zeile', async ({ page }) => {
  await page.goto('/geraete/');
  const group = page.getByRole('group', { name: 'Kategorie' });
  await expect(group).toBeVisible();
  const buttons = await group.getByRole('button').allTextContents();
  expect(buttons).toEqual(['Alle', ...CATEGORIES.map(([, l]) => l)]);
  await expect(group.getByRole('button', { name: 'Alle' })).toHaveAttribute('aria-pressed', 'true');
  const live = page.locator('[data-filter] [aria-live="polite"]');
  await expect(live).toHaveText(count(DEVICES.length));

  await group.getByRole('button', { name: 'Storage' }).click();
  await expect(group.getByRole('button', { name: 'Storage' })).toHaveAttribute('aria-pressed', 'true');
  await expect(group.getByRole('button', { name: 'Alle' })).toHaveAttribute('aria-pressed', 'false');
  const visible = page.locator('tbody[data-cat]:visible tr:not(.dev-group)');
  await expect(visible).toHaveCount(inCategory('storage'));
  await expect(page.locator('tbody[data-cat]:visible')).toHaveCount(1);
  await expect(page.locator('tbody[data-cat="storage"]')).toBeVisible();
  await expect(live).toHaveText(count(inCategory('storage')));

  await group.getByRole('button', { name: 'Strom' }).click();
  await expect(page.locator('tbody[data-cat]:visible tr:not(.dev-group)')).toHaveCount(inCategory('power'));
  await expect(live).toHaveText(count(inCategory('power')));

  await group.getByRole('button', { name: 'Alle' }).click();
  await expect(page.locator('tbody[data-cat]:visible tr:not(.dev-group)')).toHaveCount(DEVICES.length);
  await expect(live).toHaveText(count(DEVICES.length));
});

test('Filterknöpfe sind mindestens 44 px hoch und per Tastatur bedienbar', async ({ page }) => {
  await page.goto('/geraete/');
  const group = page.getByRole('group', { name: 'Kategorie' });
  for (const h of await group.getByRole('button').evaluateAll((els) => els.map((e) => e.getBoundingClientRect().height))) expect(h).toBeGreaterThanOrEqual(44);
  await group.getByRole('button', { name: 'Netzwerk' }).focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('tbody[data-cat]:visible')).toHaveCount(1);
  await expect(page.locator('tbody[data-cat="network"]')).toBeVisible();
});

test('bei 320 px bleibt die Seite ohne waagerechtes Scrollen, die Tabelle ist erreichbar', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto('/geraete/');
  await page.evaluate(() => document.fonts.ready);
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0);
  await expect(page.locator('.rt-table-wrap')).toHaveAttribute('tabindex', '0');
});

test('Verweise: Discovery und Kontakt', async ({ page }) => {
  await page.goto('/geraete/');
  await expect(page.getByRole('link', { name: 'Protokolle und Ablauf der Discovery' })).toHaveAttribute('href', '/produkt/discovery/');
  await expect(page.locator('#profile').getByRole('link', { name: 'Kontakt' })).toHaveAttribute('href', '/kontakt/');
  await expect(page.locator('#abschluss').getByText('Angebot nur für Unternehmen.')).toBeVisible();
});
