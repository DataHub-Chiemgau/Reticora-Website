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
  'Testen Sie Reticora 30\u00a0Tage mit Ihrem eigenen Netz.',
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
    ['Sweep', 'alle 24\u00a0h'],
    ['Poll', 'alle 15\u00a0min'],
    ['Puffer', 'bis 24\u00a0h'],
    ['Verbindung', 'nur ausgehend · 443, 4222'],
    ['Hosting', 'EU'],
  ]);
  await expect(strip.locator('.rt-beleg')).toHaveCount(5);
});

test('Pakettabelle zeigt fünf Pakete mit 49 €, 119 €, 299 €, ab 999 €, ab 1.999 € und den CI-Limits', async ({ page }) => {
  await page.goto('/');
  const table = page.locator('#pakete table');
  await expect(table.locator('thead th')).toHaveText(['Paket', 'CIs', 'im Monat']);
  const rows = await table.locator('tbody tr').evaluateAll((trs) =>
    trs.map((tr) => [...tr.children].map((c) => c.textContent!.trim())),
  );
  const nbsp = '\u00a0';
  expect(rows.map((r) => r.length)).toEqual([3, 3, 3, 3, 3]);
  expect(rows.map((r) => r[1])).toEqual(['500', '2.500', '10.000', '50.000', '50.000']);
  expect(rows.map((r) => r[2])).toEqual([`49${nbsp}€`, `119${nbsp}€`, `299${nbsp}€`, `ab 999${nbsp}€`, `ab 1.999${nbsp}€`]);
  const names = await table.locator('tbody th .rt-tarif').evaluateAll((els) => els.map((e) => e.firstChild!.textContent));
  expect(names).toEqual(['Essentials', 'Standard', 'Pro', 'Enterprise Shared', 'Enterprise Local']);
  await expect(table.locator('tbody th small').nth(1)).toHaveText('dazu Lager, Inventur, Etiketten, Unterschrift, SLAs, DATEV-Export');
  await expect(page.locator('#pakete .rt-notice')).toHaveText('Beta-Rabatt: 20 % in den ersten sechs Monaten, 10 % in den folgenden sechs Monaten, danach der volle Preis.');
});

test('Pakettabelle bei 360 px: Paket, CIs und Preis liegen ohne seitliches Scrollen im Bild', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto('/');
  const wrap = page.locator('#pakete .rt-table-wrap');
  await wrap.scrollIntoViewIfNeeded();
  const m = await wrap.evaluate((e) => ({ s: e.scrollWidth, c: e.clientWidth }));
  expect(m.s).toBeLessThanOrEqual(m.c);
  const rights = await page.locator('#pakete tbody td.num').evaluateAll((els) => els.map((e) => e.getBoundingClientRect().right));
  expect(rights).toHaveLength(10);
  for (const r of rights) expect(r).toBeLessThanOrEqual(360);
});

test('Belege: Rangfolge der Quellen und Absätze mit Beleg sind keine p-Elemente', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('main p:has(details)')).toHaveCount(0);
  const rang = page.locator('main details', { hasText: 'manuell 100 · Import 95 · Workflow 92 · Redfish 90 · Agent 85 · SNMP 80 · API 75 · WMI 70 · SSH 60 · Sweep 20.' });
  await expect(rang).toHaveCount(1);
  await expect(rang).toHaveAttribute('data-claim', 'C-03');
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

test('ROUTES: Startseite gebaut, englische Seiten noch geplant (bis Task 9), Adressen eindeutig', () => {
  expect(ROUTES.find((r) => r.de === '/')?.status).toBe('gebaut');
  expect(ROUTES.every((r) => r.enStatus === 'geplant')).toBe(true);
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
  for (const c of centres) expect(Math.abs(c - centres[0])).toBeLessThanOrEqual(1);
});

test('Bildunterschriften trennen Nummer und Text mit „·“', async ({ page }) => {
  await page.goto('/');
  const caps = await page.locator('main figcaption').allTextContents();
  expect(caps).toHaveLength(7);
  caps.forEach((c, i) => expect(c).toMatch(new RegExp(`^Abb\\. ${i + 1} · \\S`)));
  expect(caps[0]).toBe('Abb. 1 · Der Collector verbindet sich nach außen: HTTPS 443 und NATS mit mTLS 4222. Schemazeichnung.');
});

test('Startseite: keine fremden Anfragen, keine Cookies', async ({ page, context, baseURL }) => {
  const hosts = new Set<string>();
  page.on('request', (r) => { const u = new URL(r.url()); if (u.protocol.startsWith('http')) hosts.add(u.host); });
  await page.goto('/', { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  expect([...hosts]).toEqual([new URL(baseURL!).host]);
  expect(await context.cookies()).toEqual([]);
});

test('Belege hängen an der richtigen Aussage: Puffer an C-27, Limit an C-38', async ({ page }) => {
  await page.goto('/');
  const puffer = page.locator('main dl.rt-strip > div', { has: page.locator('dt', { hasText: 'Puffer' }) });
  await expect(puffer.locator('.rt-beleg')).toHaveAttribute('data-claim', 'C-27');
  await puffer.locator('summary').click();
  await expect(puffer.locator('.rt-beleg-body')).toContainText('Ohne Verbindung puffert der Collector bis zu 24 Stunden');
  const limit = page.locator('#schnittstellen dl.rt-spec > div', { has: page.locator('dt', { hasText: 'Limit' }) });
  await expect(limit.locator('dd')).toContainText('600 Anfragen je Minute und Schlüssel');
  await expect(limit.locator('.rt-beleg')).toHaveAttribute('data-claim', 'C-38');
  await limit.locator('summary').click();
  await expect(limit.locator('.rt-beleg-body')).toContainText('Die API erlaubt 600 Anfragen je Minute und Schlüssel.');
});

test('Startseite lädt ohne fehlgeschlagene oder 404-Antworten (Favicon eingeschlossen)', async ({ page }) => {
  const bad: string[] = [];
  page.on('response', (r) => { if (r.status() >= 400) bad.push(`${r.status()} ${r.url()}`); });
  page.on('requestfailed', (r) => bad.push(`failed ${r.url()}`));
  await page.goto('/', { waitUntil: 'networkidle' });
  await expect(page.locator('link[rel="icon"]')).toHaveAttribute('href', '/favicon.svg');
  const icon = await page.request.get('/favicon.svg');
  expect(icon.status()).toBe(200);
  expect(icon.headers()['content-type']).toContain('image/svg+xml');
  expect(bad).toEqual([]);
});

test('Betriebsleiste bei 1280 px: alle fünf Einträge in einer Zeile', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/');
  const tops = await page.locator('main dl.rt-strip > div').evaluateAll((els) => els.map((e) => Math.round(e.getBoundingClientRect().top)));
  expect(tops).toHaveLength(5);
  expect(new Set(tops).size).toBe(1);
});

test('Betriebsleiste: der Trenner am Zeilenanfang liegt außerhalb des Bildes, bei keiner Breite bleibt einer stehen', async ({ page }) => {
  for (const w of [1024, 900, 768, 600, 360]) {
    await page.setViewportSize({ width: w, height: 900 });
    await page.goto('/');
    const { left, items } = await page.locator('main dl.rt-strip').evaluate((strip) => ({
      left: strip.getBoundingClientRect().left,
      items: [...strip.children].map((e) => ({ top: Math.round(e.getBoundingClientRect().top), x: e.getBoundingClientRect().left, sep: getComputedStyle(e).borderLeftWidth })),
    }));
    items.forEach((it, i) => {
      const first = i === 0 || items[i - 1].top !== it.top;
      if (first && it.sep !== '0px') expect(it.x, `Breite ${w}, Eintrag ${i}`).toBeLessThan(left);
      if (!first) expect(it.x, `Breite ${w}, Eintrag ${i}`).toBeGreaterThanOrEqual(left);
    });
  }
});

test('Hinweis „Schema seitlich verschiebbar.“ steht genau dann da, wenn der Schemarahmen scrollt', async ({ page }) => {
  for (const w of [320, 360, 569, 570, 768, 809, 810, 1023, 1024, 1100, 1280]) {
    await page.setViewportSize({ width: w, height: 900 });
    await page.goto('/');
    for (const [frame, hint] of [['.rt-topo-frame', '.rt-topo > .rt-scroll-hint'], ['.rt-schema-frame', '.rt-schema > .rt-scroll-hint']]) {
      const scrolls = await page.locator(frame).first().evaluate((e) => e.scrollWidth > e.clientWidth);
      const shown = await page.locator(hint).first().isVisible();
      expect(shown, `${frame} bei ${w} px`).toBe(scrolls);
      if (shown) await expect(page.locator(hint).first()).toHaveText('Schema seitlich verschiebbar.');
    }
  }
});
