import { expect, test } from '@playwright/test';
import { PLANS } from '../../src/data/pricing';

const norm = (s: string) => s.replace(/ /g, ' ').replace(/\s+/g, ' ').trim();

interface Spec {
  path: string; title: string; h1: string; h2: string[]; shots: string[]; features: string[][]; claims: string[];
  hero: string[]; closing: string[]; closingH2: string;
}

const PAGES: Spec[] = [
  {
    path: '/loesungen/isp/',
    title: 'Reticora für Netzbetreiber (ISP)',
    h1: 'Für Netzbetreiber: Bestand, Abhängigkeiten und Ausfallfolgen an einem Ort.',
    h2: [
      'Eine USV im PoP meldet eine Störung.',
      'Nächste Woche wird ein Aggregationsswitch getauscht.',
      'Viele PoPs, mehrere Hersteller, keine aktuelle Liste.',
      'Ein Switch wird gegen ein Ersatzgerät aus dem Lager getauscht.',
      'Großer Bestand oder eigene Infrastruktur?',
    ],
    shots: ['S-06', 'S-16'],
    features: [
      ['Ausfallsimulation', 'Auswirkungsanalyse', 'Stromkette', 'Tickets', 'Monitoring'],
      ['Mehrfachausfall', 'Auswirkungsanalyse', 'Wartungsfenster'],
      ['Collector', 'Scopes mit VRF', 'Geräteprofile', 'Review-Inbox'],
      ['Lager', 'Identitätsabgleich', 'Review-Inbox', 'Asset'],
    ],
    claims: ['C-09', 'C-50', 'C-51', 'C-52', 'C-62', 'C-63', 'C-66', 'C-29', 'C-43', 'C-85', 'C-08', 'C-40', 'C-21', 'C-57', 'C-45', 'C-49', 'C-56', 'C-92'],
    hero: ['Live-Demo', 'Kontakt'],
    closing: ['Kontakt', 'Live-Demo', '30 Tage testen'],
    closingH2: 'Großer Bestand oder eigene Infrastruktur?',
  },
  {
    path: '/loesungen/msp/',
    title: 'Reticora für Managed-Service-Provider (MSP)',
    h1: 'Für MSPs: jeder Kunde getrennt, alle in einer CMDB.',
    h2: [
      'Ein neuer Kunde kommt dazu.',
      'Ein Techniker betreut nur zwei Kunden.',
      'Zwei Kunden nutzen dasselbe private Netz.',
      'Ein Kunde fragt nach Verträgen, Garantien und SLAs.',
      'Sehen Sie es sich mit Beispieldaten an.',
    ],
    shots: ['S-18', 'S-17', 'S-16'],
    features: [
      ['Kunden und Standorte', 'Collector', 'Scopes'],
      ['Rollen mit Geltungsbereich', 'Row-Level Security', 'Feldrechte'],
      ['Scopes mit VRF', 'Identitätsabgleich je Kunde'],
      ['Verträge', 'Dokumente', 'SLAs', 'Export'],
    ],
    claims: ['C-32', 'C-06', 'C-41', 'C-02', 'C-77', 'C-29', 'C-33', 'C-84', 'C-93', 'C-89', 'C-43', 'C-85', 'C-45', 'C-61', 'C-60', 'C-62', 'C-74'],
    hero: ['Live-Demo', '30 Tage testen'],
    closing: ['Live-Demo', '30 Tage testen', 'Kontakt'],
    closingH2: 'Sehen Sie es sich mit Beispieldaten an.',
  },
];

for (const p of PAGES) {
  test.describe(p.path, () => {
    test('Titel, h1 und h2 wie im Textdokument', async ({ page }) => {
      await page.goto(p.path);
      await expect(page).toHaveTitle(p.title);
      await expect(page.locator('h1')).toHaveText(p.h1);
      expect((await page.locator('main h2').allTextContents()).map(norm)).toEqual(p.h2);
    });

    test('vier Situationen mit Kennzeile der Funktionen', async ({ page }) => {
      await page.goto(p.path);
      const lists = await page.locator('.sol-features ul').evaluateAll((els) => els.map((e) => [...e.children].map((c) => c.textContent)));
      expect(lists).toEqual(p.features);
      await expect(page.locator('.sol-features .data-label').first()).toHaveText('Funktionen');
    });

    test('Abbildungen mit den Platzhalter-Kennungen aus dem Textdokument, fortlaufend nummeriert', async ({ page }) => {
      await page.goto(p.path);
      const ids = await page.locator('[data-placeholder]').evaluateAll((els) => els.map((e) => e.getAttribute('data-placeholder')));
      expect(ids).toEqual(p.shots);
      const caps = await page.locator('figcaption b').allTextContents();
      expect(caps).toEqual(p.shots.map((_, i) => `Abb. ${i + 1} ·`));
    });

    test('Belege stehen an den Sätzen', async ({ page }) => {
      await page.goto(p.path);
      for (const c of p.claims) await expect(page.locator(`main [data-claim="${c}"]`).first(), c).toBeAttached();
    });

    test('Knöpfe im Kopf und im Abschluss in der Reihenfolge des Textdokuments', async ({ page }) => {
      await page.goto(p.path);
      expect((await page.locator('.page-hero .rt-btn').allTextContents()).map(norm)).toEqual(p.hero);
      expect((await page.locator('#abschluss .rt-btn').allTextContents()).map(norm)).toEqual(p.closing);
      await expect(page.locator('#abschluss h2')).toHaveText(p.closingH2);
      await expect(page.locator('#abschluss .rt-btn').first()).toHaveClass(/rt-btn--primary|rt-btn--secondary/);
    });
  });
}

test('ISP: Kontakt-Knöpfe tragen das Anliegen „Enterprise“; Paketgrenze kommt aus PLANS; Verweis auf die Geräteseite', async ({ page }) => {
  await page.goto('/loesungen/isp/');
  await expect(page.locator('.page-hero').getByRole('link', { name: 'Kontakt' })).toHaveAttribute('href', '/kontakt/?topic=enterprise');
  await expect(page.locator('#abschluss').getByRole('link', { name: 'Kontakt' })).toHaveAttribute('href', '/kontakt/?topic=enterprise');
  await expect(page.locator('#abschluss .rt-btn--primary')).toHaveText('Kontakt');
  const ent = PLANS.find((x) => x.id === 'enterprise-shared')!;
  const limit = String(ent.limits.cis).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  expect(norm(await page.locator('#viele-pops').innerText())).toContain(`bis ${limit} CIs und beliebig viele Collectors`);
  await expect(page.locator('#viele-pops').getByRole('link', { name: 'Unterstützte Geräte' })).toHaveAttribute('href', '/geraete/');
});

test('MSP: Adressbereich als Code, Collector-Text mit Enrollment-Code', async ({ page }) => {
  await page.goto('/loesungen/msp/');
  await expect(page.locator('#gleiches-netz code')).toHaveText('192.168.1.0/24');
  expect(norm(await page.locator('#neuer-kunde').innerText())).toContain('Enrollment-Code ein, der 24 Stunden gilt.');
});
