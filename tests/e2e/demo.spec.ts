import { expect, test } from '@playwright/test';
import { LINKS } from '../../src/data/links';

const norm = (s: string) => s.replace(/ /g, ' ').replace(/\s+/g, ' ').trim();
const ROWS: [string, string][] = [
  ['Adresse', LINKS.demo],
  ['Benutzer', LINKS.demoUser],
  ['Passwort', LINKS.demoPassword],
];

test('Titel, Beschreibung, h1 und h2 wie im Textdokument', async ({ page }) => {
  await page.goto('/demo/');
  await expect(page).toHaveTitle('Live-Demo – Reticora ausprobieren');
  await expect(page.locator('meta[name="description"]')).toHaveAttribute(
    'content',
    'Öffnen Sie die Demo von Reticora mit dem gemeinsamen Zugang. Drei Dinge zum Ausprobieren: Ausfall simulieren, Herkunft ansehen, Review entscheiden.',
  );
  await expect(page.locator('h1')).toHaveText('Live-Demo');
  expect((await page.locator('main h2').allTextContents()).map(norm)).toEqual([
    'Zugang zur Demo',
    'Drei Dinge zum Ausprobieren',
    'Lieber mit Ihrem eigenen Netz?',
  ]);
  expect(await page.locator('#ausprobieren h3').allTextContents()).toEqual([
    'Einen Ausfall simulieren',
    'Die Herkunft eines Feldes ansehen',
    'Ein Review entscheiden',
  ]);
});

test('Kennwertliste zeigt Adresse, Benutzer und Passwort genau wie LINKS', async ({ page }) => {
  await page.goto('/demo/');
  const rows = page.locator('.demo-spec > div');
  await expect(rows).toHaveCount(ROWS.length);
  for (const [i, [label, value]] of ROWS.entries()) {
    await expect(rows.nth(i).locator('dt')).toHaveText(label);
    await expect(rows.nth(i).locator('code')).toHaveText(value);
  }
});

test('Hinweis zum gemeinsamen Konto steht über dem Knopf „Demo öffnen“, der auf LINKS.demo zeigt', async ({ page }) => {
  await page.goto('/demo/');
  const notice = page.locator('#zugang .rt-notice');
  await expect(notice).toContainText('Gemeinsames Konto.');
  await expect(notice).toContainText('Alle Besucher der Demo nutzen dasselbe Konto und sehen, was andere eintragen.');
  await expect(notice).toContainText('Geben Sie keine echten Daten ein: keine Namen, keine Adressen, keine Zugangsdaten, nichts aus Ihrem Netz oder dem Ihrer Kunden.');
  const open = page.getByRole('link', { name: 'Demo öffnen' });
  await expect(open).toHaveAttribute('href', LINKS.demo);
  const [n, o] = await Promise.all([notice.boundingBox(), open.boundingBox()]);
  expect(n!.y).toBeLessThan(o!.y);
});

test('Kopierknöpfe: ein Knopf je Wert, zugänglicher Name „{Bezeichnung} kopieren“, kopiert den Wert und meldet „Kopiert“', async ({ page, context, browserName }) => {
  // Nur Chromium kennt die Zwischenablage-Rechte; Firefox und WebKit bekommen eine Zwischenablage im Speicher.
  if (browserName === 'chromium') await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  else
    await page.addInitScript(() => {
      let held = '';
      Object.defineProperty(navigator, 'clipboard', {
        configurable: true,
        value: { writeText: async (t: string) => void (held = t), readText: async () => held },
      });
    });
  await page.goto('/demo/');
  await expect(page.locator('.demo-spec button')).toHaveCount(ROWS.length);
  for (const [label, value] of ROWS) {
    const row = page.locator('.demo-row', { has: page.getByText(label, { exact: true }) });
    const button = row.getByRole('button', { name: `${label} kopieren` });
    await expect(button).toBeVisible();
    await expect(button).toHaveText('Kopieren');
    await button.click();
    await expect(row.getByRole('status')).toHaveText('Kopiert');
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(value);
  }
});

test('Kopierknopf meldet „Kopieren nicht möglich“, wenn die Zwischenablage ablehnt', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: () => Promise.reject(new Error('no')) } });
  });
  await page.goto('/demo/');
  const row = page.locator('.demo-row').first();
  await row.getByRole('button').click();
  await expect(row.getByRole('status')).toHaveText('Kopieren nicht möglich');
});

test('ohne JavaScript entfallen die Kopierknöpfe, die Werte bleiben sichtbar', async ({ browser }) => {
  const ctx = await browser.newContext({ javaScriptEnabled: false });
  const page = await ctx.newPage();
  await page.goto('/demo/');
  for (const b of await page.locator('.demo-spec button').all()) await expect(b).toBeHidden();
  for (const [, value] of ROWS) await expect(page.locator('.demo-spec').getByText(value, { exact: true })).toBeVisible();
  await ctx.close();
});

test('drei Dinge zum Ausprobieren: Abbildungen S-06, S-02, S-03 und Belege', async ({ page }) => {
  await page.goto('/demo/');
  const ids = await page.locator('[data-placeholder]').evaluateAll((els) => els.map((e) => e.getAttribute('data-placeholder')));
  expect(ids).toEqual(['S-06', 'S-02', 'S-03']);
  expect(await page.locator('figcaption b').allTextContents()).toEqual(['Abb. 1 ·', 'Abb. 2 ·', 'Abb. 3 ·']);
  for (const c of ['C-09', 'C-03', 'C-30', 'C-22']) await expect(page.locator(`main [data-claim="${c}"]`).first(), c).toBeAttached();
});

test('Abschluss: „30 Tage testen“ und „Kontakt“, Zeile für Unternehmen; die Zugangsdaten stehen nur im Zugang', async ({ page }) => {
  await page.goto('/demo/');
  expect((await page.locator('#abschluss .rt-btn').allTextContents()).map(norm)).toEqual(['30 Tage testen', 'Kontakt']);
  await expect(page.locator('#abschluss').getByText('Angebot nur für Unternehmen.')).toBeVisible();
  const mainText = await page.locator('main').innerText();
  expect(mainText.split(LINKS.demoUser).length - 1).toBe(1);
});

test('bei 360 px ohne waagerechtes Scrollen, Kopierknöpfe mindestens 44 px', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto('/demo/');
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0);
  for (const b of await page.locator('.demo-spec button').all()) {
    const box = await b.boundingBox();
    expect(box!.height).toBeGreaterThanOrEqual(44);
    expect(box!.x + box!.width).toBeLessThanOrEqual(360);
  }
});
