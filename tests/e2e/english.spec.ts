import { expect, test } from '@playwright/test';
import { content } from '../../src/content';
import { ui } from '../../src/i18n';
import { ROUTES, localize } from '../../src/i18n/routes';
import { germanLeftovers } from '../german-leftovers';

/** Englische Seiten: Überschriften wie in src/content/en/…, kein deutscher Rest im sichtbaren Text und in Beschriftungen.
 *  Die allgemeinen Prüfungen (200, lang="en", hreflang, Sprachumschalter, axe, kein waagerechtes Scrollen) stehen in pages.spec.ts. */
const EN_PAGES = ROUTES.filter((r) => r.enStatus === 'gebaut').map((r) => r.en);
const norm = (s: string) => s.replace(/\u00a0/g, ' ').replace(/\u00ad/g, '').replace(/\s+/g, ' ').trim();

const C = content('en');
const T = ui('en');

/** Erwartete h1 und h2 (in `main`) je englischer Seite, aus den englischen Inhalten. Schlüssel: deutsche Adresse; je Seite eine Zeile.
 *  Eine Seite, die hier steht, aber noch nicht gebaut ist, wird übersprungen. */
type Headings = { h1: string; h2: string[] };
const product = (p: (typeof C.produkt)[keyof typeof C.produkt]): Headings => ({
  h1: p.hero.title,
  h2: [...p.sections.map((s) => s.title), p.closing ? p.closing.title : T.cta.title],
});
const HEADINGS: Record<string, () => Headings> = {
  '/': () => {
    const H = C.home;
    return {
      h1: H.hero.h1,
      h2: [H.ablauf, H.vertrauen, H.zusammenhang, H.kunden, H.mehr, H.api, H.sicherheit, H.geraete, H.pakete, H.abschluss].map((s) => s.title),
    };
  },
  '/produkt/discovery/': () => product(C.produkt.discovery),
  '/produkt/datenqualitaet/': () => product(C.produkt.datenqualitaet),
  '/produkt/topologie-impact/': () => product(C.produkt['topologie-impact']),
  '/produkt/verwaltung/': () => product(C.produkt.verwaltung),
  '/produkt/betrieb/': () => product(C.produkt.betrieb),
  '/produkt/compliance/': () => product(C.produkt.compliance),
  '/produkt/api/': () => product(C.produkt.api),
};

for (const de of Object.keys(HEADINGS)) {
  const en = localize(de, 'en');
  test(`${en}: h1 und h2 wie in den englischen Inhalten`, async ({ page }) => {
    test.skip(!EN_PAGES.includes(en), 'noch nicht gebaut');
    const want = HEADINGS[de]();
    await page.goto(en);
    expect(norm(await page.locator('h1').innerText())).toBe(norm(want.h1));
    const h2 = (await page.locator('main h2').allInnerTexts()).map(norm);
    expect(h2).toEqual(want.h2.map(norm));
  });
}

for (const path of EN_PAGES) {
  test(`${path}: kein deutscher Rest in Text, Titel und Beschriftungen`, async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(path);
    // Belege und Menü aufklappen, damit ihr Text mitgeprüft wird.
    await page.evaluate(() => document.querySelectorAll('details').forEach((d) => (d.open = true)));
    const text = await page.evaluate(() => {
      const parts = ['header', 'main', 'footer'].map((s) => (document.querySelector(s) as HTMLElement | null)?.innerText ?? '');
      const attrs = [...document.querySelectorAll('[aria-label], [title], [alt], [placeholder]')].flatMap((e) =>
        ['aria-label', 'title', 'alt', 'placeholder'].map((a) => (a === 'title' && e.tagName === 'svg' ? '' : (e.getAttribute(a) ?? ''))),
      );
      const svgText = [...document.querySelectorAll('svg title, svg desc, svg text')].map((e) => e.textContent ?? '');
      const meta = [document.title, document.querySelector('meta[name="description"]')?.getAttribute('content') ?? ''];
      return [...parts, ...attrs, ...svgText, ...meta].join('\n');
    });
    expect(germanLeftovers(text)).toEqual([]);
  });
}
