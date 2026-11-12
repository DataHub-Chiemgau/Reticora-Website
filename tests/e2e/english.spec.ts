import { expect, test } from '@playwright/test';
import { content } from '../../src/content';
import { ui } from '../../src/i18n';
import { ROUTES, localize } from '../../src/i18n/routes';
import { germanLeftovers } from '../german-leftovers';
import { SITE } from '../../src/data/site';

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
  '/geraete/': () => ({ h1: C.geraete.hero.title, h2: [C.geraete.familien, C.geraete.erkennung, C.geraete.unbekannt, C.geraete.profile].map((s) => s.title).concat(T.cta.title) }),
  '/loesungen/isp/': () => ({ h1: C.isp.hero.title, h2: [...C.isp.situations.map((s) => s.title), C.isp.closing.title] }),
  '/loesungen/msp/': () => ({ h1: C.msp.hero.title, h2: [...C.msp.situations.map((s) => s.title), C.msp.closing.title] }),
  '/sicherheit/': () => {
    const S = C.sicherheit;
    return { h1: S.hero.title, h2: [S.modelle, S.ports, S.trennung, S.schluessel, S.anmeldung, S.protokoll, S.datenschutz, S.lieferkette, S.melden, S.closing].map((s) => s.title) };
  },
  '/preise/': () => ({ h1: C.preise.hero.title, h2: [C.preise.pakete, C.preise.funktionen, C.preise.zusatz, C.preise.test, C.preise.fragen].map((s) => s.title).concat(T.cta.title) }),
  '/demo/': () => ({ h1: C.demo.hero.title, h2: [C.demo.zugang, C.demo.probieren, C.demo.closing].map((s) => s.title) }),
  '/kontakt/': () => ({ h1: C.kontakt.hero.h1, h2: [C.kontakt.direct.title] }),
  '/kontakt/danke/': () => ({ h1: C.kontakt.danke.h1, h2: [] }),
  '/impressum/': () => ({ h1: T.legal.pages.imprint.title, h2: [] }),
  '/datenschutz/': () => ({ h1: T.legal.pages.privacy.title, h2: [] }),
  '/agb/': () => ({ h1: T.legal.pages.terms.title, h2: [] }),
  '/subprozessoren/': () => ({ h1: T.legal.pages.subprocessors.title, h2: [] }),
  '/barrierefreiheit/': () => {
    const A = C.barrierefreiheit;
    return { h1: A.hero.h1, h2: [A.pruefen, A.kontraste, A.bewegung, A.grenzen, A.hinweise].map((s) => s.title) };
  },
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

test.describe('Englische Einzelheiten (Geräte, Preise, Rechtsseiten, Demo, 404)', () => {
  test('/en/pricing/: englische Zahlen- und Preisformate, „excl. VAT“, „from“, „unlimited“', async ({ page }) => {
    await page.goto('/en/pricing/');
    const cell = (plan: string, col: string) => page.locator(`tr[data-plan="${plan}"] [data-col="${col}"]`);
    await expect(cell('essentials', 'monthly')).toHaveText('€49');
    await expect(cell('standard', 'yearly')).toHaveText('€1,190');
    await expect(cell('standard', 'beta')).toHaveText('€1,071');
    await expect(cell('pro', 'cis')).toHaveText('up to 10,000');
    await expect(cell('enterprise-shared', 'monthly')).toHaveText('from €999');
    await expect(cell('enterprise-local', 'monthly')).toHaveText('from €1,999');
    await expect(cell('enterprise-local', 'yearly')).toHaveText('on request');
    await expect(cell('enterprise-local', 'collectors')).toHaveText('unlimited');
    await expect(page.locator('.price-plans thead th')).toHaveText(['Plan', 'per month', 'per year', 'first beta year', 'CIs', 'Collectors', 'Users', 'Evidence']);
    await expect(page.locator('.price-vat')).toHaveText('excl. VAT');
    await expect(page.locator('[data-beta]')).toContainText('20% in the first six months, 10% in the following six months');
    await expect(page.locator('#zusatzkosten')).toContainText('€0.05 per month');
    await expect(page.locator('#zusatzkosten')).toContainText('€0.03 per month');
    await expect(page.locator('tr[data-feature="storage"] td').first()).toHaveText(/^1,000 MiB/);
    // Paketnamen bleiben
    await expect(page.locator('.price-plans tbody .rt-tarif')).toContainText(['Essentials', 'Standard', 'Pro', 'Enterprise Shared', 'Enterprise Local']);
    await expect(page.getByRole('link', { name: `${C.preise.pakete.contact.label}: Enterprise Shared` })).toHaveAttribute('href', '/en/contact/?topic=enterprise');
  });

  test('/en/devices/: Kategorien, Sprungmarken, Filter und Ergebniszeile englisch; Hersteller unverändert', async ({ page }) => {
    await page.goto('/en/devices/');
    // Die Sprungmarken gelten ohne JavaScript; mit JavaScript ersetzt der Filter sie.
    await expect(page.locator('nav.dev-jump')).toHaveAttribute('aria-label', C.geraete.familien.jump);
    await expect(page.locator('.dev-jump a').first()).toHaveText(/^Network \(\d+\)$/);
    await expect(page.locator('.dev-group th')).toHaveText(Object.values(C.geraete.familien.categories));
    const filter = page.getByRole('group', { name: T.devices.filter });
    await expect(filter.getByRole('button')).toHaveText([T.devices.all, ...Object.values(C.geraete.familien.categories)]);
    await filter.getByRole('button', { name: 'Power' }).click();
    const n = await page.locator('tbody[data-cat="power"] tr:not(.dev-group)').count();
    await expect(page.locator('.dev-count')).toHaveText(`${n} device families`);
    await expect(page.locator('main')).toContainText('Smart-UPS (Network Management Card)');
  });

  test('/en/legal-notice/: englische Bezeichnungen, Anbieterangaben unverändert, Platzhalter englisch', async ({ page }) => {
    await page.goto('/en/legal-notice/');
    const dl = page.locator('main dl');
    await expect(dl.locator('dt')).toHaveText(['Company', 'Address', 'Email address', 'Phone', 'Managing director', 'Register court', 'Register number', 'VAT ID']);
    await expect(dl).toContainText(SITE.company);
    await expect(dl).toContainText(SITE.street);
    await expect(dl).toContainText(SITE.city);
    await expect(page.locator('[data-placeholder="imprint-stand"]')).toHaveText(T.placeholders.date);
    for (const p of ['/en/privacy/', '/en/terms/', '/en/subprocessors/']) {
      await page.goto(p);
      await expect(page.locator('main [data-placeholder]').last()).toHaveText(T.legal.pending);
    }
  });

  test('/en/demo/ und /en/contact/thanks/ stehen nicht in der Sitemap (noindex wie die deutschen Seiten)', async ({ request }) => {
    const xml = await (await request.get('/sitemap.xml')).text();
    expect(xml).not.toContain('/en/demo/');
    expect(xml).not.toContain('/en/contact/thanks/');
    expect(xml).toContain('/en/pricing/');
  });

  test('englische Fehlerseite 404: Texte aus ui(en), kein deutscher Rest', async ({ page }) => {
    const res = await page.goto('/en/gibt-es-nicht/');
    expect(res?.status()).toBe(404);
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    expect(norm(await page.locator('h1').innerText())).toBe(T.notFound.h1);
    const text = await page.evaluate(() => ['header', 'main', 'footer'].map((s) => (document.querySelector(s) as HTMLElement).innerText).join('\n') + document.title);
    expect(germanLeftovers(text)).toEqual([]);
  });
});
