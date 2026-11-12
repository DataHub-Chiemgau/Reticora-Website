import { expect, test } from '@playwright/test';
import { SITE } from '../../src/data/site';
import { barrierefreiheit as A } from '../../src/content/de/barrierefreiheit';
import { isBuilt, ui } from '../../src/i18n';

const T = ui('de');
const L = T.legal;

const PAGES = [
  { path: '/impressum/', key: 'imprint' },
  { path: '/datenschutz/', key: 'privacy' },
  { path: '/agb/', key: 'terms' },
  { path: '/subprozessoren/', key: 'subprocessors' },
] as const;

for (const p of PAGES)
  test.describe(p.path, () => {
    test('helles Dokumentthema, Überschrift, Stand-Zeile und Platzhalter', async ({ page }) => {
      await page.goto(p.path);
      await expect(page.locator('html')).toHaveAttribute('data-theme', 'dokument');
      await expect(page.locator('h1')).toHaveText(L.pages[p.key].title);
      expect(await page.title()).toBe(`${L.pages[p.key].title} – Reticora`);
      await expect(page.locator(`[data-placeholder="${p.key}-stand"]`)).toHaveText(T.placeholders.date);
      const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
      expect(bg).toBe('rgb(245, 247, 248)');
      if (p.key === 'imprint') {
        const main = page.locator('main');
        await expect(main).toContainText(SITE.company);
        await expect(main).toContainText(SITE.street);
        await expect(main).toContainText(SITE.city);
        const missing = (
          [['email', 'email'], ['phone', 'telefon'], ['managingDirector', 'geschaeftsfuehrung'], ['registerCourt', 'registergericht'], ['registerNumber', 'registernummer'], ['vatId', 'ustid']] as const
        ).filter(([k]) => !SITE[k]);
        for (const [, id] of missing) await expect(main.locator(`[data-placeholder="impressum-${id}"]`)).toBeVisible();
        await expect(main.locator('[data-placeholder]')).toHaveCount(missing.length + 1);
        await expect(main.locator(`[data-placeholder="imprint"]`)).toHaveCount(0);
      } else {
        const ph = page.locator(`main [data-placeholder="${p.key}"]`);
        await expect(ph).toHaveText(L.pending);
        await expect(ph).toBeVisible();
      }
    });
  });

test.describe('/barrierefreiheit/', () => {
  test('Überschriften und Inhalte wie im Textdokument, helles Thema', async ({ page }) => {
    await page.goto('/barrierefreiheit/');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dokument');
    expect(await page.title()).toBe(A.meta.title);
    await expect(page.locator('h1')).toHaveText(A.hero.h1);
    await expect(page.locator('.page-hero .lead')).toHaveText(A.hero.lead);
    await expect(page.getByText(`${T.asOf}: ${A.hero.asOf}`)).toBeVisible();
    await expect(page.locator('main h2')).toHaveText([A.pruefen.title, A.kontraste.title, A.bewegung.title, A.grenzen.title, A.hinweise.title]);
    // Texte mit [C-xx]-Belegen: die Teile vor und nach dem Beleg stehen im Element, der Beleg selbst ist ein Beleg-Knopf.
    const parts = (t: string) => t.split(/\s*\[C-\d+\]\s*/).filter(Boolean);
    const items = page.locator('#pruefen li');
    await expect(items).toHaveCount(A.pruefen.items.length);
    for (const [i, t] of A.pruefen.items.entries()) for (const part of parts(t)) await expect(items.nth(i)).toContainText(part);
    await expect(page.locator('#pruefen [data-claim="C-97"]')).toHaveCount(1);
    await expect(page.locator('#pruefen [data-claim="C-98"]')).toHaveCount(1);
    for (const c of ['C-95', 'C-96', 'C-99']) await expect(page.locator(`main [data-claim="${c}"]`).first()).toHaveCount(1);
    await expect(page.locator('#grenzen li')).toHaveText([...A.grenzen.items]);
    for (const part of parts(A.bewegung.text)) await expect(page.locator('#bewegung .legal-text')).toContainText(part);
    const table = page.locator('#kontraste table');
    await expect(table.locator('thead th')).toHaveText([A.kontraste.heads.pair, A.kontraste.heads.dark, A.kontraste.heads.light, A.kontraste.heads.min]);
    await expect(table.locator('tbody tr')).toHaveCount(5);
    await expect(table.locator('tbody tr').first().locator('th')).toHaveText('Text auf Seitengrund');
    await expect(table.locator('tbody tr').first().locator('td')).toHaveText(['16,0 : 1', '15,7 : 1', '4,5 : 1']);
  });

  test('Kontaktweg ist ein Platzhalter', async ({ page }) => {
    await page.goto('/barrierefreiheit/');
    await expect(page.locator('[data-placeholder="barrierefreiheit-kontakt"]')).toHaveText(T.placeholders.a11yContact);
  });
});

test.describe('404', () => {
  test('deutsche Fehlerseite wie im Textdokument', async ({ page }) => {
    const res = await page.goto('/gibt-es-nicht/');
    expect(res!.status()).toBe(404);
    expect(await page.title()).toBe(T.notFound.title);
    await expect(page.locator('html')).toHaveAttribute('lang', 'de');
    await expect(page.locator('.page-hero-eyebrow')).toHaveText(T.notFound.eyebrow);
    await expect(page.locator('h1')).toHaveText(T.notFound.h1);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex');
    const links = page.getByRole('navigation', { name: T.notFound.navLabel }).getByRole('link');
    await expect(links).toHaveText(T.notFound.links.map((l) => l.label));
    expect(await links.evaluateAll((els) => els.map((e) => e.getAttribute('href')))).toEqual(T.notFound.links.map((l) => l.href));
    await expect(page.getByText(T.notFound.hint)).toBeVisible();
  });

  test('englische Fehlerseite unter /en/ mit Status 404, englischen Texten und englischen Adressen', async ({ page, request }) => {
    const en = ui('en').notFound;
    const res = await page.goto('/en/gibt-es-nicht/');
    expect(res!.status()).toBe(404);
    expect(res!.headers()['content-security-policy']).toContain("default-src 'none'");
    expect(await page.title()).toBe(en.title);
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(page.locator('h1')).toHaveText(en.h1);
    await expect(page.locator('.page-hero-eyebrow')).toHaveText(en.eyebrow);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex');
    const links = page.getByRole('navigation', { name: en.navLabel }).getByRole('link');
    await expect(links).toHaveText(en.links.map((l) => l.label));
    expect(await links.evaluateAll((els) => els.map((e) => e.getAttribute('href')))).toEqual(['/en/', '/en/product/discovery/', '/en/devices/', '/en/pricing/', '/en/contact/']);
    // Verzeichnis ohne Index unter /en/: ebenfalls englisch
    const dir = await request.get('/en/_nichts/', { maxRedirects: 0 });
    expect(dir.status()).toBe(404);
    expect(await dir.text()).toContain(en.h1);
    // deutsche Pfade bleiben deutsch
    expect(await (await request.get('/nichts-hier/')).text()).toContain(T.notFound.h1);
  });

  test('Sprachumschalter der Fehlerseite: kein „kommt bald“ ohne Gegenstück, und kein Link auf eine ungebaute Startseite', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    for (const path of ['/gibt-es-nicht/', '/en/gibt-es-nicht/']) {
      await page.goto(path);
      const sw = page.locator('.rt-header .rt-lang');
      await expect(sw.locator('[aria-current="true"]')).toHaveCount(1);
      await expect(sw.locator('.is-off')).toHaveCount(0);
      await expect(page.locator('.rt-header, .rt-footer').getByText(T.lang.soon)).toHaveCount(0);
      // Ziel ist die Startseite der anderen Sprache, sobald sie gebaut ist (die deutsche ist es immer, die englische ab Task 9a).
      await expect(sw.locator('a')).toHaveCount(path.startsWith('/en/') || isBuilt('/en/') ? 1 : 0);
    }
    await page.goto('/en/gibt-es-nicht/');
    await expect(page.locator('.rt-header .rt-lang a')).toHaveAttribute('href', '/');
    if (isBuilt('/en/')) {
      await page.goto('/gibt-es-nicht/');
      await expect(page.locator('.rt-header .rt-lang a')).toHaveAttribute('href', '/en/');
    }
  });
});
