import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { LINKS } from '../../src/data/links';
import { ROUTES } from '../../src/i18n/routes';

const H2 = [
  'So entsteht Ihr Bestand',
  'Daten, denen Sie trauen',
  'Sehen, was zusammenhängt',
  'Für mehrere Kunden gebaut',
  'Mehr als ein Inventar',
  'Für Menschen und für Maschinen',
  'Sicherheit, die man nachprüfen kann',
  'Erkennt, was in Ihren Racks steht',
  'Pakete und Preise',
  'Testen Sie Reticora 30 Tage mit Ihrem eigenen Netz.',
];

test('Titel und Beschreibung wie im Textdokument', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle('Reticora – die CMDB, die Ihr Netz selbst ausliest');
  await expect(page.locator('meta[name="description"]')).toHaveAttribute(
    'content',
    'CMDB für ISPs und Netzwerk-MSPs: Ein Collector liest Ihr Netz aus, jedes Feld zeigt Quelle und Zeitpunkt. Mit Topologie, Racks und Ausfallsimulation.',
  );
});

test('h1 lautet „Die CMDB, die Ihr Netz selbst ausliest und jeden Wert belegt.“', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('h1')).toHaveCount(1);
  await expect(page.locator('h1')).toHaveText('Die CMDB, die Ihr Netz selbst ausliest und jeden Wert belegt.');
  await expect(page.locator('h1')).toHaveClass(/display-xl/);
  const mw = await page.locator('h1').evaluate((e) => getComputedStyle(e).maxWidth);
  expect(mw).not.toBe('none');
});

test('zehn h2 in dieser Reihenfolge', async ({ page }) => {
  await page.goto('/');
  expect(await page.locator('main h2').allTextContents()).toEqual(H2);
});

test('Hauptknopf führt zu LINKS.signup, „Live-Demo“ zu /demo/, „Anmelden“ zu LINKS.login', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/');
  const hero = page.locator('main section').first();
  await expect(hero.getByRole('link', { name: '30 Tage testen' })).toHaveAttribute('href', LINKS.signup);
  await expect(hero.getByRole('link', { name: 'Live-Demo' })).toHaveAttribute('href', '/demo/');
  await expect(hero.getByRole('link', { name: '30 Tage testen' })).toHaveClass(/rt-btn--primary/);
  await expect(page.locator('.rt-header').getByRole('link', { name: 'Anmelden' })).toHaveAttribute('href', LINKS.login);
  const closing = page.locator('main section').last();
  await expect(closing.getByRole('link', { name: '30 Tage testen' })).toHaveAttribute('href', LINKS.signup);
  await expect(closing.getByRole('link', { name: 'Live-Demo' })).toHaveAttribute('href', '/demo/');
  await expect(closing.getByRole('link', { name: 'Kontakt' })).toHaveAttribute('href', '/kontakt/');
  await expect(page.getByRole('link', { name: 'Zur Seite Sicherheit' })).toHaveAttribute('href', '/sicherheit/');
  await expect(page.getByRole('link', { name: 'Alle unterstützten Geräte' })).toHaveAttribute('href', '/geraete/');
  await expect(page.getByRole('link', { name: 'Alle Preise und Funktionen' })).toHaveAttribute('href', '/preise/');
});

test('„Angebot nur für Unternehmen.“ steht am Einstieg, bei den Paketen und im Abschluss', async ({ page }) => {
  await page.goto('/');
  const sections = page.locator('main > section');
  const where = [0, 9, 10].map((i) => sections.nth(i));
  expect(await sections.count()).toBe(11);
  for (const s of where) await expect(s.getByText('Angebot nur für Unternehmen.', { exact: true })).toHaveCount(1);
  await expect(page.locator('main').getByText('Angebot nur für Unternehmen.', { exact: true })).toHaveCount(3);
});

test('Platzhalter S-02, S-03, S-04, S-05, S-06, S-18 vorhanden; Abb. 1 bis 7 in Reihenfolge', async ({ page }) => {
  await page.goto('/');
  const ids = await page.locator('main .rt-slot-label b').allTextContents();
  expect(ids).toEqual(['S-02', 'S-03', 'S-04', 'S-05', 'S-06', 'S-18']);
  const figs = await page.locator('main figcaption b').allTextContents();
  expect(figs).toEqual([1, 2, 3, 4, 5, 6, 7].map((n) => `Abb. ${n} ·`));
  await expect(page.locator('main figure').nth(0)).toContainText('Der Collector verbindet sich nach außen: HTTPS 443 und NATS mit mTLS 4222. Schemazeichnung.');
  await expect(page.locator('main figure').nth(4)).toContainText('Rack, Vorderseite.');
  await expect(page.locator('main figure .rt-slot--4x5')).toHaveCount(1);
});

test('Netzschema der Verbindungsrichtung nennt beide Leitungen', async ({ page }) => {
  await page.goto('/');
  const svg = page.locator('svg[role="img"]', { hasText: 'HTTPS 443' });
  await expect(svg).toHaveCount(1);
  await expect(svg).toContainText('NATS mTLS 4222');
  await expect(svg).toContainText('Ihr Netz');
  await expect(svg).toContainText('Reticora (EU)');
  await expect(svg).toContainText('Collector');
});

test('Betriebsleiste nennt Sweep, Poll, Puffer, Verbindung, Hosting mit den Werten aus dem Textdokument', async ({ page }) => {
  await page.goto('/');
  const strip = page.locator('main dl.rt-strip');
  await expect(strip).toHaveCount(1);
  const rows = await strip.locator('> div').evaluateAll((els) =>
    els.map((e) => [e.querySelector('dt')!.textContent!.trim(), e.querySelector('dd')!.firstChild!.textContent!.trim()]),
  );
  expect(rows).toEqual([
    ['Sweep', 'alle 24 h'],
    ['Poll', 'alle 15 min'],
    ['Puffer', 'bis 24 h'],
    ['Verbindung', 'nur ausgehend · 443, 4222'],
    ['Hosting', 'EU'],
  ]);
  await expect(strip.locator('.rt-beleg')).toHaveCount(5);
});

test('Pakettabelle zeigt fünf Pakete mit 49 €, 119 €, 299 €, ab 999 €, ab 1.999 € und den CI-Limits', async ({ page }) => {
  await page.goto('/');
  const table = page.locator('#pakete table');
  const rows = await table.locator('tbody tr').evaluateAll((trs) =>
    trs.map((tr) => [...tr.children].map((c) => c.textContent!.trim())),
  );
  expect(rows.map((r) => r[0])).toEqual(['Essentials', 'Standard', 'Pro', 'Enterprise Shared', 'Enterprise Local']);
  expect(rows.map((r) => r[2])).toEqual(['500', '2.500', '10.000', '50.000', '50.000']);
  expect(rows.map((r) => r[3])).toEqual(['49 €', '119 €', '299 €', 'ab 999 €', 'ab 1.999 €']);
  expect(rows[1][1]).toBe('dazu Lager, Inventur, Etiketten, Unterschrift, SLAs, DATEV-Export');
  await expect(page.locator('#pakete .rt-notice')).toHaveText('Beta-Rabatt: 20 % in den ersten sechs Monaten, 10 % in den folgenden sechs Monaten, danach der volle Preis.');
});

test('Belege: Rangfolge der Quellen und Absätze mit Beleg sind keine p-Elemente', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('main p:has(details)')).toHaveCount(0);
  const rang = page.locator('main details', { hasText: 'manuell 100 · Import 95 · Workflow 92 · Redfish 90 · Agent 85 · SNMP 80 · API 75 · WMI 70 · SSH 60 · Sweep 20.' });
  await expect(rang).toHaveCount(1);
  await expect(page.locator('main .rt-beleg')).not.toHaveCount(0);
  await expect(page.locator('main code')).toContainText('curl "https://www.reticora.cloud/api/v1/cis?q=core&limit=50"');
});

test('axe ohne Befunde', async ({ page }) => {
  for (const width of [1280, 360]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/');
    const r = await new AxeBuilder({ page }).analyze();
    expect(r.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`)).toEqual([]);
  }
});

for (const w of [320, 360, 768, 1280]) {
  test(`kein waagerechtes Scrollen bei ${w} px`, async ({ page }) => {
    await page.setViewportSize({ width: w, height: 900 });
    await page.goto('/');
    const m = await page.evaluate(() => ({ s: document.documentElement.scrollWidth, c: document.documentElement.clientWidth }));
    expect(m.s).toBe(m.c);
  });
}

test('ohne JavaScript: alle zehn h2 sichtbar, Menü öffnet, Belege öffnen', async ({ browser }) => {
  const ctx = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 800 } });
  const page = await ctx.newPage();
  await page.goto('/');
  const heads = page.locator('main h2');
  expect(await heads.count()).toBe(10);
  for (let i = 0; i < 10; i++) await expect(heads.nth(i)).toBeVisible();
  await page.locator('details.rt-menu > summary').click();
  await expect(page.locator('.rt-menu-body')).toBeVisible();
  const beleg = page.locator('main .rt-beleg').first();
  await beleg.scrollIntoViewIfNeeded();
  await beleg.locator('summary').click();
  await expect(beleg.locator('.rt-beleg-body')).toBeVisible();
  await ctx.close();
});

test('jeder interne Link zeigt auf eine Adresse aus ROUTES', async ({ page }) => {
  await page.goto('/');
  const known = new Set(ROUTES.flatMap((r) => [r.de, r.en].filter((x): x is string => x !== null)));
  const hrefs = await page.locator('a[href^="/"]').evaluateAll((as) => as.map((a) => a.getAttribute('href')!));
  expect(hrefs.length).toBeGreaterThan(20);
  expect(hrefs.filter((h) => !known.has(h))).toEqual([]);
  for (const h of hrefs) expect(h.endsWith('/')).toBe(true);
});

test('ROUTES: Startseite gebaut, alle anderen geplant, Adressen eindeutig', () => {
  expect(ROUTES.find((r) => r.de === '/')?.status).toBe('gebaut');
  expect(ROUTES.filter((r) => r.status === 'gebaut').length).toBe(1);
  expect(new Set(ROUTES.map((r) => r.de)).size).toBe(ROUTES.length);
  for (const p of ['/demo/', '/preise/', '/geraete/', '/sicherheit/', '/kontakt/']) expect(ROUTES.some((r) => r.de === p)).toBe(true);
});

test('Fußzeile fluchtet mit dem Inhalt; Zeile mit Pflichtangaben auf einer Mittellinie', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/');
  const h1 = await page.locator('h1').evaluate((e) => e.getBoundingClientRect().left);
  const cols = await page.locator('.rt-footer-cols').evaluate((e) => e.getBoundingClientRect().left);
  expect(Math.abs(h1 - cols)).toBeLessThanOrEqual(0.5);
  expect(h1).toBeGreaterThan(40);
  const centres = await page.locator('.rt-footer-legal > *').evaluateAll((els) =>
    els.map((e) => { const r = e.getBoundingClientRect(); return r.top + r.height / 2; }),
  );
  expect(centres.length).toBeGreaterThan(4);
  // nur Elemente der ersten Zeile vergleichen
  const first = centres.filter((c) => Math.abs(c - centres[0]) < 30);
  for (const c of first) expect(Math.abs(c - first[0])).toBeLessThanOrEqual(1);
});

test('Bildunterschriften trennen Nummer und Text mit „·“', async ({ page }) => {
  await page.goto('/');
  const caps = await page.locator('main figcaption').allTextContents();
  expect(caps).toHaveLength(7);
  for (const c of caps) expect(c).toMatch(/^Abb\. \d ·\s*\S/);
  expect(caps[0]).toBe('Abb. 1 ·Der Collector verbindet sich nach außen: HTTPS 443 und NATS mit mTLS 4222. Schemazeichnung.');
});

test('Startseite: keine fremden Anfragen, keine Cookies', async ({ page, context }) => {
  const hosts = new Set<string>();
  page.on('request', (r) => { const u = new URL(r.url()); if (u.protocol.startsWith('http')) hosts.add(u.host); });
  await page.goto('/', { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  expect([...hosts]).toEqual(['127.0.0.1:8080']);
  expect(await context.cookies()).toEqual([]);
});

test('Belege hängen an der richtigen Aussage: Puffer an C-27, Limit an C-38', async ({ page }) => {
  await page.goto('/');
  const puffer = page.locator('main dl.rt-strip > div', { has: page.locator('dt', { hasText: 'Puffer' }) });
  await puffer.locator('summary').click();
  await expect(puffer.locator('.rt-beleg-body')).toContainText('Ohne Verbindung puffert der Collector bis zu 24 Stunden');
  const limit = page.locator('#schnittstellen dl.rt-spec > div', { has: page.locator('dt', { hasText: 'Limit' }) });
  await expect(limit.locator('dd')).toContainText('600 Anfragen je Minute und Schlüssel');
  await limit.locator('summary').click();
  await expect(limit.locator('.rt-beleg-body')).toContainText('Die API erlaubt 600 Anfragen je Minute und Schlüssel.');
});
