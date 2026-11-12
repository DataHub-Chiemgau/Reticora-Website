import { expect, test } from '@playwright/test';

/** Erwartungen wörtlich aus docs/copy/produkt-*-de.md (nicht aus den Inhaltsdateien gelesen). NBSP gilt in Vergleichen als Leerzeichen. */
const norm = (s: string) => s.replace(/ /g, ' ').replace(/\s+/g, ' ').trim();
const CTA = 'Testen Sie Reticora 30 Tage mit Ihrem eigenen Netz.';

interface Spec { path: string; title: string; h1: string; h2: string[]; shots: string[]; claims: string[] }

const PAGES: Spec[] = [
  {
    path: '/produkt/discovery/',
    title: 'Discovery – so liest Reticora Ihr Netz aus',
    h1: 'Ihr Bestand entsteht aus Ihrem Netz, nicht aus einer Tabelle.',
    h2: [
      'Der Collector in Ihrem Netz',
      'Scopes: Sie bestimmen, was durchsucht wird',
      'Sweep und Abfrage: welche Protokolle wofür',
      'Klassifikation: Was ist das für ein Gerät?',
      'Takt, Puffer und was nicht mehr antwortet',
      'Zugangsdaten',
      CTA,
    ],
    shots: ['S-07', 'S-08'],
    claims: ['C-01', 'C-02', 'C-26', 'C-27', 'C-28', 'C-41', 'C-42', 'C-39', 'C-13'],
  },
  {
    path: '/produkt/datenqualitaet/',
    title: 'Datenqualität – jeder Wert mit Herkunft',
    h1: 'Ein Gerät, ein CI. Jeder Wert mit Quelle.',
    h2: [
      'Fünf Schlüssel in fester Reihenfolge',
      'Welche Quelle gewinnt',
      'Manuell gewinnt',
      'Die Review-Inbox: drei typische Fälle',
      'Zusammenführen lässt sich rückgängig machen',
      'Was nicht mehr gesehen wird',
      CTA,
    ],
    shots: ['S-02', 'S-03'],
    claims: ['C-45', 'C-05', 'C-46', 'C-03', 'C-04', 'C-30', 'C-48', 'C-44', 'C-49'],
  },
  {
    path: '/produkt/topologie-impact/',
    title: 'Topologie und Ausfallsimulation – Reticora',
    h1: 'Was hängt woran, und was fällt mit aus?',
    h2: [
      'Topologie als Graph',
      'Ausfallsimulation mit Redundanz',
      'Wer ist betroffen',
      'Die Stromkette bis zur Quelle',
      'Herkunft und Prüfstatus jeder Beziehung',
      'Racks mit Vorder- und Rückseite',
      CTA,
    ],
    shots: ['S-04', 'S-06', 'S-05'],
    claims: ['C-31', 'C-52', 'C-55', 'C-09', 'C-50', 'C-66', 'C-51', 'C-53', 'C-10', 'C-54'],
  },
  {
    path: '/produkt/verwaltung/',
    title: 'Verwaltung – Assets, Lager, Inventur, Verträge',
    h1: 'Kaufmännische Daten am selben Gerät wie die technischen.',
    h2: [
      'Asset und CI: getrennt und verknüpft',
      'Zuweisung, Reservierung, Entsorgung',
      'Lager bis zum Fach',
      'Inventur mit Barcode',
      'Verträge und Dokumente',
      'Export für die Buchhaltung',
      CTA,
    ],
    shots: ['S-09', 'S-10'],
    claims: ['C-56', 'C-35', 'C-49', 'C-61', 'C-57', 'C-36', 'C-58', 'C-59', 'C-60', 'C-11', 'C-74'],
  },
  {
    path: '/produkt/betrieb/',
    title: 'Betrieb – Tickets, SLAs, Monitoring, Workflows',
    h1: 'Störung, Ticket, Wartung: am CI, nicht daneben.',
    h2: ['Tickets mit SLA', 'Monitoring und Alarmregeln', 'Workflows und Formulare', 'Wartungsfenster', CTA],
    shots: ['S-11', 'S-12'],
    claims: ['C-62', 'C-37', 'C-63', 'C-64', 'C-90', 'C-65', 'C-66', 'C-09'],
  },
  {
    path: '/produkt/compliance/',
    title: 'Compliance und Audit – Reticora',
    h1: 'Nachweise aus dem Bestand, nicht aus dem Gedächtnis.',
    h2: [
      'Audit-Protokoll mit Hash-Kette',
      'Compliance-Regeln und Score',
      'Befunde mit den betroffenen CIs',
      'Berichte für ISO 27001, NIS2 und KRITIS',
      'IGA als Add-on',
      'Sie bereiten eine Prüfung vor?',
    ],
    shots: ['S-14', 'S-13'],
    claims: ['C-12', 'C-69', 'C-03', 'C-82', 'C-67', 'C-68', 'C-19', 'C-70'],
  },
  {
    path: '/produkt/api/',
    title: 'REST-API, Webhooks und Export – Reticora',
    h1: 'Eine REST-API mit festen Regeln.',
    h2: ['Grundsätze', 'Anmeldung und Limits', 'Webhooks', 'Export und Import', 'Massenänderungen', CTA],
    shots: ['S-15'],
    claims: ['C-11', 'C-71', 'C-75', 'C-33', 'C-89', 'C-38', 'C-72', 'C-73', 'C-81', 'C-74', 'C-76'],
  },
];

for (const p of PAGES) {
  test.describe(p.path, () => {
    test('Titel, h1 und h2 in der Reihenfolge des Textdokuments', async ({ page }) => {
      await page.goto(p.path);
      expect(norm(await page.title())).toContain(p.title);
      await expect(page.locator('h1')).toHaveCount(1);
      expect(norm((await page.locator('h1').textContent()) ?? '')).toBe(p.h1);
      const h2 = (await page.locator('main h2').allTextContents()).map(norm);
      expect(h2).toEqual(p.h2);
    });

    test('Screenshot-Platzhalter mit den Nummern des Textdokuments, Abbildungen fortlaufend', async ({ page }) => {
      await page.goto(p.path);
      const ids = await page.locator('[data-placeholder]').evaluateAll((els) => els.map((e) => e.getAttribute('data-placeholder')));
      expect(ids).toEqual(p.shots);
      const caps = (await page.locator('main figure.rt-figure > figcaption > b').allTextContents()).map(norm);
      expect(caps).toEqual(caps.map((_, i) => `Abb. ${i + 1} ·`));
      expect(caps.length).toBeGreaterThan(0);
    });

    test('Belege aus dem Textdokument stehen auf der Seite; Absätze mit Beleg sind kein <p>', async ({ page }) => {
      await page.goto(p.path);
      const found = new Set(await page.locator('details.rt-beleg').evaluateAll((els) => els.map((e) => e.getAttribute('data-claim'))));
      for (const c of p.claims) expect(found.has(c), c).toBe(true);
      expect(await page.locator('p:has(details.rt-beleg)').count()).toBe(0);
    });

    test('Teilnavigation führt alle sieben Produktseiten, die aktuelle ist markiert', async ({ page }) => {
      await page.goto(p.path);
      const links = page.getByRole('navigation', { name: 'Produkt', exact: true }).first().locator('a');
      await expect(links).toHaveCount(7);
      await expect(page.locator('.product-nav a[aria-current="page"]')).toHaveAttribute('href', p.path);
    });

    test('endet mit dem Abschluss und den Knöpfen', async ({ page }) => {
      await page.goto(p.path);
      await expect(page.locator('#abschluss a.rt-btn')).toHaveCount(3);
      await expect(page.locator('#abschluss')).toContainText('Angebot nur für Unternehmen.');
    });
  });
}

test('Topologie: Netzschema im Kopf mit Ausgangszustand pdu-a ausgefallen', async ({ page }) => {
  await page.goto('/produkt/topologie-impact/');
  const stage = page.locator('[data-topo]');
  await expect(stage).toHaveCount(1);
  await expect(stage.locator('.rt-topo-legend')).toContainText('Schemazeichnung, kein Screenshot');
  await expect(stage.locator('.rt-chip[data-ci="pdu-a"]')).toHaveAttribute('aria-pressed', 'true');
  await expect(stage.locator('.rt-topo-result')).not.toBeEmpty();
  // Umschalten wirkt (Insel), Ergebniszeile ändert sich
  const before = await stage.locator('.rt-topo-result').textContent();
  await stage.locator('.rt-chip[data-ci="pdu-b"]').click();
  await expect(stage.locator('.rt-topo-result')).not.toHaveText(before ?? '');
});

test('Topologie: Beispieltabelle mit Kopfzellen und vier Ausfällen', async ({ page }) => {
  await page.goto('/produkt/topologie-impact/');
  const t = page.locator('table.rt-table');
  await expect(t.locator('thead th')).toHaveText(['Ausfall', 'betroffen', 'durch Redundanz geschützt']);
  await expect(t.locator('tbody tr')).toHaveCount(4);
  await expect(t.locator('tbody tr').first().locator('code')).toHaveText(['pdu-a', 'sw-access-01', 'srv-01', 'srv-02']);
});

test('Datenqualität: Rangfolge der Quellen als Tabelle, Fünf Schlüssel als Tabelle', async ({ page }) => {
  await page.goto('/produkt/datenqualitaet/');
  const rank = page.locator('table[class="rt-table"]').filter({ has: page.locator('th', { hasText: 'Rang' }) });
  await expect(rank.locator('thead th')).toHaveText(['Quelle', 'Rang']);
  const rows = await rank.locator('tbody tr').evaluateAll((trs) => trs.map((tr) => [...tr.children].map((c) => (c.textContent ?? '').trim())));
  expect(rows).toEqual([
    ['manuell, Override', '100'], ['Import', '95'], ['Workflow', '92'], ['Redfish', '90'], ['Agent', '85'],
    ['SNMP', '80'], ['API, Integration', '75'], ['WMI', '70'], ['SSH, NAS', '60'], ['Sweep', '20'],
  ]);
  await expect(page.locator('table.rt-table').first().locator('tbody tr')).toHaveCount(5);
  await expect(page.locator('.rt-table-wrap[aria-label="Rangfolge der Quellen"]')).toHaveCount(1);
});

test('Verwaltung: Dokumentenspeicher je Paket aus der Paketmatrix', async ({ page }) => {
  await page.goto('/produkt/verwaltung/');
  const rows = await page.locator('.rt-table-wrap[aria-label="Dokumentenspeicher je Paket"] tbody tr').evaluateAll((trs) =>
    trs.map((tr) => [...tr.children].map((c) => (c.firstChild?.textContent ?? '').replace(/ /g, ' ').trim())),
  );
  expect(rows).toEqual([['Essentials', '1.000 MiB'], ['Standard', '10.000 MiB'], ['Pro', '50.000 MiB'], ['Enterprise', 'unbegrenzt']]);
});

test('API: Codebeispiel mit Kopierknopf, Limits als Kennwerte', async ({ page }) => {
  await page.goto('/produkt/api/');
  const code = page.locator('.rt-code');
  await expect(code).toHaveCount(1);
  await expect(code.locator('.rt-code-head')).toContainText('GET /api/v1/cis');
  await expect(code.locator('pre')).toContainText('curl "https://www.reticora.cloud/api/v1/cis?q=core&limit=50"');
  await expect(code.locator('pre')).toContainText('X-API-Key: rk_live_…');
  const copy = code.locator('button[data-copy]');
  await expect(copy).toBeVisible();
  await expect(copy).toHaveText('Kopieren');
  const limits = await page.locator('.rt-spec').last().locator('dt').allTextContents();
  expect(limits).toEqual(['je Schlüssel oder Sitzung', 'je Organisation', 'vor der Anmeldung, je IP-Adresse']);
  await expect(page.locator('.rt-spec').last()).toContainText('6.000');
});

test('Discovery: Betriebsleiste, Verbindungsschema, Protokolltabelle', async ({ page }) => {
  await page.goto('/produkt/discovery/');
  const strip = (await page.locator('.rt-strip > div').evaluateAll((ds) => ds.map((d) => [d.querySelector('dt')?.textContent, d.querySelector('dd')?.firstChild?.textContent])));
  const nb = '\u00a0';
  expect(strip.map(([k, v]) => [k, (v ?? '').trim()])).toEqual([
    ['Sweep', `alle 24${nb}h`], ['Poll', `alle 15${nb}min, ab 5${nb}min einstellbar`], ['Puffer', `bis 24${nb}h`], ['Verbindung', 'nur ausgehend · 443, 4222'],
  ]);
  await expect(page.locator('.rt-schema')).toHaveCount(1);
  await expect(page.locator('figure.product-schema figcaption')).toContainText('Abb. 1 · Der Collector verbindet sich nach außen');
  await expect(page.locator('table.rt-table tbody tr')).toHaveCount(7);
});

test('Compliance: Hauptknopf Kontakt, Abschluss mit eigener Überschrift', async ({ page }) => {
  await page.goto('/produkt/compliance/');
  const hero = page.locator('.page-hero a.rt-btn');
  await expect(hero).toHaveText(['Kontakt', 'Live-Demo']);
  await expect(hero.first()).toHaveClass(/rt-btn--primary/);
  await expect(hero.first()).toHaveAttribute('href', '/kontakt/');
  await expect(page.locator('#abschluss a.rt-btn')).toHaveText(['Kontakt', 'Live-Demo', '30 Tage testen']);
  await expect(page.locator('main')).toContainText('bescheinigt keine Konformität');
});

test('Hauptknopf je Seite wie im Textdokument', async ({ page }) => {
  const primary: Record<string, string> = {
    '/produkt/discovery/': '30 Tage testen',
    '/produkt/datenqualitaet/': '30 Tage testen',
    '/produkt/topologie-impact/': 'Live-Demo',
    '/produkt/verwaltung/': 'Live-Demo',
    '/produkt/betrieb/': 'Live-Demo',
    '/produkt/api/': '30 Tage testen',
  };
  for (const [path, label] of Object.entries(primary)) {
    await page.goto(path);
    await expect(page.locator('.page-hero a.rt-btn--primary'), path).toHaveText(label);
  }
});
