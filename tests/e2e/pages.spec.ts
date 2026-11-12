import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { SITE } from '../../src/data/site';
import { ROUTES, counterpart, isBuilt, langOf } from '../../src/i18n';

/** Jede gebaute Seite beider Sprachen; die Schleife wächst mit jeder Seite, die in ROUTES auf 'gebaut' steht. */
const PAGES = ROUTES.flatMap((r) => [r.de, r.en]).filter((p) => isBuilt(p));

test('es gibt gebaute Seiten', () => {
  expect(PAGES.length).toBeGreaterThan(0);
});

for (const path of PAGES) {
  const lang = langOf(path)!;
  const other = counterpart(path)!;
  const otherBuilt = isBuilt(other);

  test.describe(path, () => {
    test('lädt mit 200, eine h1, passendes lang, Titel und Beschreibung', async ({ page }) => {
      const res = await page.goto(path);
      expect(res?.status()).toBe(200);
      await expect(page.locator('h1')).toHaveCount(1);
      await expect(page.locator('html')).toHaveAttribute('lang', lang);
      expect((await page.title()).length).toBeGreaterThan(5);
      expect(((await page.locator('meta[name="description"]').getAttribute('content')) ?? '').length).toBeGreaterThan(20);
    });

    for (const width of [320, 768, 1280])
      test(`kein waagerechtes Scrollen bei ${width} px`, async ({ page }) => {
        await page.setViewportSize({ width, height: 900 });
        await page.goto(path);
        await page.evaluate(() => document.fonts.ready);
        const over = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
        expect(over).toBeLessThanOrEqual(0);
      });

    test('kanonische Adresse ist die eigene; Open Graph ohne Bild', async ({ page }) => {
      await page.goto(path);
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', SITE.url + path);
      await expect(page.locator('meta[property="og:url"]')).toHaveAttribute('content', SITE.url + path);
      await expect(page.locator('meta[property="og:title"]')).toHaveCount(1);
      await expect(page.locator('meta[property="og:description"]')).toHaveCount(1);
      await expect(page.locator('meta[property="og:image"]')).toHaveCount(0);
    });

    test('hreflang nur für gebaute Gegenstücke, Ziele laden; Entwicklungs-Build trägt noindex', async ({ page, request }) => {
      await page.goto(path);
      const alts = await page.locator('link[rel="alternate"][hreflang]').evaluateAll((els) => els.map((e) => [e.getAttribute('hreflang'), e.getAttribute('href')]));
      if (!otherBuilt) {
        expect(alts).toEqual([]);
      } else {
        const self = SITE.url + path;
        const them = SITE.url + other;
        const de = lang === 'de' ? self : them;
        const en = lang === 'en' ? self : them;
        expect(alts).toEqual([['de', de], ['en', en], ['x-default', de]]);
        for (const [, href] of alts) {
          const res = await request.get(new URL(href!).pathname);
          expect(res.status(), href!).toBe(200);
        }
      }
      await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex');
    });

    test('Sprachumschalter führt zum Gegenstück oder ist ohne Link', async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 900 });
      await page.goto(path);
      const sw = page.locator('.rt-header .rt-lang');
      await expect(sw.locator('[aria-current="true"]')).toHaveText(lang === 'de' ? 'DE' : 'EN');
      if (otherBuilt) {
        await sw.locator('a').click();
        await expect(page).toHaveURL(new RegExp(`${other}$`));
        await expect(page.locator('html')).toHaveAttribute('lang', lang === 'de' ? 'en' : 'de');
      } else {
        await expect(sw.locator('a')).toHaveCount(0);
        await expect(sw.locator('.is-off')).toHaveCount(1);
        await expect(page.locator('.rt-footer a[hreflang]')).toHaveCount(0);
      }
    });

    test('axe ohne Befunde', async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 900 });
      await page.goto(path);
      const r = await new AxeBuilder({ page }).analyze();
      expect(r.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`)).toEqual([]);
    });

    test('keine fremden Hosts, keine Konsolenfehler', async ({ page, baseURL }) => {
      const hosts = new Set<string>();
      const errors: string[] = [];
      page.on('request', (r) => {
        const u = new URL(r.url());
        if (u.protocol.startsWith('http')) hosts.add(u.host);
      });
      page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
      page.on('pageerror', (e) => errors.push(e.message));
      await page.goto(path, { waitUntil: 'networkidle' });
      expect([...hosts]).toEqual([new URL(baseURL!).host]);
      expect(errors).toEqual([]);
    });
  });
}

test('Kopf und Fuß lesen ihre Texte in der Sprache der Seite', async ({ page }) => {
  for (const path of PAGES) {
    await page.goto(path);
    const lang = langOf(path)!;
    await expect(page.locator('.rt-nav')).toHaveAttribute('aria-label', lang === 'de' ? 'Hauptnavigation' : 'Main navigation');
    await expect(page.locator('.sr-skip')).toHaveText(lang === 'de' ? 'Zum Inhalt' : 'Skip to content');
    await expect(page.locator('.rt-footer-legal')).toContainText(lang === 'de' ? 'Impressum' : 'Legal notice');
  }
});

test('sitemap.xml listet nur gebaute Seiten, ohne noindex-Seiten, mit Alternativen nur bei gebautem Gegenstück', async ({ request }) => {
  const res = await request.get('/sitemap.xml');
  expect(res.status()).toBe(200);
  expect(res.headers()['content-type']).toMatch(/xml/);
  const xml = await res.text();
  const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  const expected = ROUTES.flatMap((r) => [r.de, r.en].filter((p) => isBuilt(p) && !r.noindex)).map((p) => SITE.url + p);
  expect(locs).toEqual(expected);
  expect(xml).not.toContain('/danke/');
  const pairs = ROUTES.filter((r) => isBuilt(r.de) && isBuilt(r.en) && !r.noindex);
  expect((xml.match(/<xhtml:link/g) ?? []).length).toBe(pairs.length * 3 * 2);
  if (pairs.length === 0) expect(xml).not.toContain('xhtml:link');
});

test('robots.txt verweist auf die Sitemap und sperrt im Entwicklungs-Build alles', async ({ request }) => {
  const res = await request.get('/robots.txt');
  expect(res.status()).toBe(200);
  const txt = await res.text();
  expect(txt).toContain(`Sitemap: ${SITE.url}/sitemap.xml`);
  expect(txt).toMatch(/User-agent: \*\s+Disallow: \/\s/);
});
