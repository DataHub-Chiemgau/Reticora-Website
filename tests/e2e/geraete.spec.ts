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

test('Sprungmarken je Kategorie über der Tabelle (Ä-17): Liste mit Ankern, jede Kategorie hat eine Kennung und eine Überschrift', async ({ browser }) => {
  const ctx = await browser.newContext({ javaScriptEnabled: false });
  const page = await ctx.newPage();
  await page.goto('/geraete/');
  const nav = page.getByRole('navigation', { name: 'Zu einer Kategorie springen' });
  await expect(nav).toBeVisible();
  const links = nav.getByRole('link');
  expect((await links.allTextContents()).map(norm)).toEqual(CATEGORIES.map(([c, l]) => `${l} (${inCategory(c)})`));
  const table = page.locator('main table');
  const [nb, tb] = [await nav.boundingBox(), await table.boundingBox()];
  expect(nb!.y + nb!.height).toBeLessThanOrEqual(tb!.y);
  for (const [cat, label] of CATEGORIES) {
    await expect(page.locator(`a[href="#kategorie-${cat}"]`)).toHaveCount(1);
    const body = page.locator(`tbody#kategorie-${cat}`);
    await expect(body).toHaveCount(1);
    await expect(body.locator('th[scope="rowgroup"]')).toHaveText(label);
  }
  // Der Anker führt ohne JavaScript zur Gruppe.
  await page.locator('a[href="#kategorie-power"]').click();
  await expect(page).toHaveURL(/#kategorie-power$/);
  await expect(page.locator('tbody#kategorie-power')).toBeInViewport();
  await ctx.close();
});

test('mit JavaScript ersetzt der Filter die Sprungmarken', async ({ page }) => {
  await page.goto('/geraete/');
  await expect(page.getByRole('group', { name: 'Kategorie' })).toBeVisible();
  await expect(page.getByRole('navigation', { name: 'Zu einer Kategorie springen' })).toBeHidden();
});

test('Seite und Tabelle bleiben auch mit der Ersatzschrift ohne Webfonts bei 320 px im Rahmen', async ({ page }) => {
  // Auf GitHubs Chromium sprengte der nicht umbrechbare Verweisknopf „Protokolle und Ablauf der Discovery“ die Seite.
  await page.route('**/*.woff2', (route) => route.abort());
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto('/geraete/');
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0);
  const btn = await page.getByRole('link', { name: 'Protokolle und Ablauf der Discovery' }).boundingBox();
  expect(btn!.x + btn!.width).toBeLessThanOrEqual(320);
  expect(btn!.height).toBeGreaterThan(44);
  // Der Scrollrahmen hält die Tabelle, sein Hinweis steht darüber; lange Zellen dürfen umbrechen.
  const frame = page.locator('.rt-table-wrap');
  expect(await frame.evaluate((e) => e.getBoundingClientRect().right)).toBeLessThanOrEqual(320);
  await expect(page.locator('.dev-table .rt-table-hint')).toBeVisible();
  const wraps = await page.locator('main table td').evaluateAll((els) => els.map((e) => getComputedStyle(e).overflowWrap));
  expect(new Set(wraps)).toEqual(new Set(['break-word']));
});

test('der Beleg der Gerätefamilien steht unter der Ergebniszeile, nicht am rechten Rand', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/geraete/');
  const [count, beleg, root] = await Promise.all([
    page.locator('.dev-count').boundingBox(),
    page.locator('#familien > .rt-container [data-claim="C-08"]').boundingBox(),
    page.locator('#familien .rt-container').boundingBox(),
  ]);
  expect(beleg!.y).toBeGreaterThan(count!.y);
  expect(beleg!.x).toBe(count!.x);
  expect(beleg!.x + beleg!.width).toBeLessThan(root!.x + root!.width / 2);
});
