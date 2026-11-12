import { expect, test } from '@playwright/test';
import { ui } from '../../src/i18n';
import { LINKS } from '../../src/data/links';
import { BETA, EXTRAS, FEATURES, PLANS } from '../../src/data/pricing';

const norm = (s: string) => s.replace(/ /g, ' ').replace(/\s+/g, ' ').trim();
const grouped = (n: number) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
const eur = (n: number) => `${Number.isInteger(n) ? grouped(n) : n.toFixed(2).replace('.', ',')} €`;
const H2 = [
  'Die Pakete',
  'Funktionen je Paket',
  'Zusatzkosten',
  '30 Tage testen',
  'Fragen zu Preisen und Paketen',
  'Testen Sie Reticora 30 Tage mit Ihrem eigenen Netz.',
];

test('Titel, Beschreibung, h1, h2 und Fragen wie im Textdokument', async ({ page }) => {
  await page.goto('/preise/');
  await expect(page).toHaveTitle('Preise und Pakete – Reticora CMDB');
  const e = PLANS[0];
  expect(norm((await page.locator('meta[name="description"]').getAttribute('content'))!)).toBe(
    `${e.name} ab ${eur(e.monthly)} im Monat, dazu Standard, Pro und Enterprise. Funktionen, Limits, Zusatzkosten und 30 Tage Test. Preise zzgl. MwSt., nur für Unternehmen.`,
  );
  await expect(page.locator('h1')).toHaveText('Pakete und Preise');
  expect((await page.locator('main h2').allTextContents()).map(norm)).toEqual(H2);
  await expect(page.locator('.price-faq > div')).toHaveCount(8);
  expect((await page.locator('.price-faq h3').allTextContents()).map(norm)).toEqual([
    'Was zählt als CI?',
    'Was passiert über dem Limit?',
    'Was passiert nach dem Test?',
    'Was passiert, wenn ich in ein kleineres Paket wechsle?',
    'Wie funktioniert der Beta-Rabatt?',
    'Was unterscheidet Enterprise Shared und Enterprise Local?',
    'Was kosten IGA und der KI-Assistent?',
    'Können Privatpersonen Reticora buchen?',
  ]);
});

test('Pakettabelle: jede Zahl stammt aus PLANS', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/preise/');
  const table = page.locator('table.price-plans');
  expect((await table.locator('thead th').allTextContents()).map(norm)).toEqual(['Paket', 'Beschreibung und Handlung', 'im Monat', 'im Jahr', 'erstes Beta-Jahr', 'CIs', 'Collectors', 'Nutzer', 'Belege']);
  await expect(table.locator('tbody tr')).toHaveCount(PLANS.length);
  for (const p of PLANS) {
    const row = table.locator(`tr[data-plan="${p.id}"]`);
    // Zeilenkopf: nur der Name des Pakets; Beschreibung und Knopf stehen in einer eigenen Zelle.
    await expect(row.locator('th[scope="row"]')).toHaveText(p.name);
    await expect(row.locator('td.price-desc .price-summary')).toHaveText(p.summary.de);
    const cell = async (c: string) => norm(await row.locator(`[data-col="${c}"]`).innerText());
    expect(await cell('monthly')).toBe(`${p.from ? 'ab ' : ''}${eur(p.monthly)}`);
    expect(await cell('yearly')).toBe(p.yearly === null ? 'auf Anfrage' : eur(p.yearly));
    expect(await cell('beta')).toBe(p.betaYearly === null ? '–' : eur(p.betaYearly));
    expect(await cell('cis')).toBe(`bis ${grouped(p.limits.cis)}`);
    expect(await cell('collectors')).toBe(p.limits.collectors === null ? 'unbegrenzt' : grouped(p.limits.collectors));
    expect(await cell('users')).toBe(p.limits.users === null ? 'unbegrenzt' : grouped(p.limits.users));
  }
});

test('„zzgl. MwSt.“ und „Angebot nur für Unternehmen.“ stehen sichtbar bei der Tabelle; Beta-Rabatt aus BETA', async ({ page }) => {
  await page.goto('/preise/');
  const sec = page.locator('#pakete');
  await expect(sec.getByText('zzgl. MwSt.', { exact: true })).toBeVisible();
  await expect(sec.getByText('Angebot nur für Unternehmen.')).toBeVisible();
  const beta = norm(await sec.locator('[data-beta]').innerText());
  expect(beta).toContain(`Beta-Rabatt: ${Math.round(BETA.firstSixMonths * 100)} % in den ersten sechs Monaten, ${Math.round(BETA.nextSixMonths * 100)} % in den folgenden sechs Monaten, danach der volle Preis.`);
  expect(beta).toContain('der Spalte „erstes Beta-Jahr“.');
  await expect(sec.locator('[data-beta] [data-claim="C-21"]')).toHaveCount(1);
});

test('Paketmatrix: eine Zeile je FEATURES-Eintrag mit Zeilenkopf, Textwerte statt nur Symbole', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/preise/');
  const table = page.locator('table.price-matrix');
  expect((await table.locator('thead th').allTextContents()).map(norm)).toEqual(['Funktion', ...PLANS.map((p) => p.name)]);
  await expect(table.locator('tbody tr')).toHaveCount(FEATURES.length);
  await expect(table.locator('tbody th[scope="row"]')).toHaveCount(FEATURES.length);
  for (const f of FEATURES) {
    const row = table.locator(`tr[data-feature="${f.id}"]`);
    await expect(row.locator('th[scope="row"]')).toContainText(f.label.de);
    for (const [i, p] of PLANS.entries()) {
      const text = norm(await row.locator('td').nth(i).innerText());
      const v = f.plans[p.id];
      const sr = norm((await row.locator('td').nth(i).textContent()) ?? '');
      if (v === true) expect(sr).toContain('enthalten');
      else if (v === false) expect(sr).toContain('nicht enthalten');
      else if (v === '∞') expect(sr).toContain('unbegrenzt');
      else expect(text).toBe(norm(v));
    }
  }
  await expect(page.getByText('✓ enthalten · – nicht enthalten · ∞ unbegrenzt · Add-on: zu jedem Paket zubuchbar, Preis auf Anfrage')).toBeVisible();
  await expect(page.getByText('Funktionen je Paket. Enterprise Shared und Enterprise Local unterscheiden sich im Betrieb.')).toBeVisible();
});

test('Zusatzkosten aus EXTRAS', async ({ page }) => {
  await page.goto('/preise/');
  const specs = page.locator('#zusatzkosten .rt-spec > div');
  await expect(specs).toHaveCount(3);
  expect(norm(await specs.nth(0).innerText())).toContain(`je CI über dem Limit des Pakets ${eur(EXTRAS.perCiMonthly)} im Monat`);
  expect(norm(await specs.nth(1).innerText())).toContain(`je Monitoring-Service ${eur(EXTRAS.perMonitoringServiceMonthly)} im Monat`);
  expect(norm(await specs.nth(2).innerText())).toContain('Add-ons IGA und KI-Assistent auf Anfrage');
  await expect(page.locator('#zusatzkosten').getByText('Alle Beträge zzgl. MwSt.')).toBeVisible();
  const faq = norm(await page.locator('.price-faq > div').nth(1).textContent() ?? '');
  expect(faq).toContain(`Jedes CI über dem Limit Ihres Pakets kostet ${eur(EXTRAS.perCiMonthly)} im Monat.`);
});

test('Fragen: eine immer geöffnete Liste, alle Antworten stehen im Text; Test-Abschnitt mit Knopf', async ({ page }) => {
  await page.goto('/preise/');
  await expect(page.locator('.price-faq > details')).toHaveCount(0);
  const answers = page.locator('.price-faq .price-answer');
  await expect(answers).toHaveCount(8);
  for (const a of await answers.all()) await expect(a).toBeVisible();
  await expect(answers.first()).toContainText('Ein CI ist ein Eintrag in der CMDB');
  await expect(page.locator('#test').getByRole('link', { name: '30 Tage testen' })).toBeVisible();
});

test('„denselben Umfang“ steht nirgends auf der Seite (C-92 trägt ihn nicht)', async ({ page }) => {
  await page.goto('/preise/');
  const text = norm(await page.locator('main').textContent() ?? '');
  expect(text).not.toContain('denselben Umfang');
  expect(text).not.toContain('Funktionsumfang ist gleich');
  expect(text).toContain('Enterprise Shared läuft in der Cloud auf getrennter Infrastruktur.');
});

test('Belege: C-21 und bei Enterprise C-92 an den Paketzeilen, C-60 an der Speicherzeile, C-21 an der Matrix', async ({ page }) => {
  await page.goto('/preise/');
  for (const p of PLANS) {
    const claims = await page.locator(`table.price-plans tr[data-plan="${p.id}"] td.price-claims [data-claim]`).evaluateAll((els) => els.map((e) => e.getAttribute('data-claim')));
    expect(claims, p.id).toEqual(p.from ? ['C-21', 'C-92'] : ['C-21']);
  }
  await expect(page.locator('tr[data-feature="storage"] td:last-child [data-claim="C-60"]')).toHaveCount(1);
  await expect(page.locator('.price-matrix-box [data-claim]')).toHaveCount(1);
  await expect(page.locator('#funktionen-beschreibung [data-claim="C-21"]')).toHaveCount(1);
  // kein Beleg allein unter dem Hinweisband
  await expect(page.locator('.price-claim')).toHaveCount(0);
  await expect(page.locator('#pakete [data-claim="C-21"]')).toHaveCount(PLANS.length + 1);
});

test('ein Knopf je Paket: „30 Tage testen“ für Essentials bis Pro, „Kontakt aufnehmen“ mit Anliegen Enterprise', async ({ page }) => {
  await page.goto('/preise/');
  for (const p of PLANS) {
    const link = page.locator(`table.price-plans tr[data-plan="${p.id}"] td.price-desc .price-action a`);
    await expect(link).toHaveCount(1);
    if (p.from) {
      await expect(link).toHaveText('Kontakt aufnehmen');
      await expect(link).toHaveAttribute('href', '/kontakt/?topic=enterprise');
      await expect(link).toHaveAttribute('aria-label', `Kontakt aufnehmen: ${p.name}`);
    } else {
      await expect(link).toHaveText('30 Tage testen');
      await expect(link).toHaveAttribute('href', LINKS.signup);
      await expect(link).toHaveAttribute('aria-label', `${ui('de').actions.trial}: ${p.name}`);
    }
  }
});

test('die Pakettabelle passt ab 1024 px ohne seitliches Scrollen in ihren Rahmen, darunter steht je Paket ein Block; auch ohne Webfonts', async ({ page }) => {
  await page.route('**/*.woff2', (route) => route.abort());
  for (const width of [1024, 1100, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/preise/');
    const fits = await page.locator('#pakete .rt-table-wrap').evaluate((e) => e.scrollWidth <= e.clientWidth);
    expect(fits, `${width} px`).toBe(true);
  }
  for (const width of [768, 1000]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/preise/');
    expect(await page.locator('table.price-plans tbody tr').first().evaluate((e) => getComputedStyle(e).display), `${width} px`).toBe('block');
    expect(await page.locator('#pakete .rt-table-wrap').evaluate((e) => e.scrollWidth <= e.clientWidth), `${width} px`).toBe(true);
  }
});

test('bei 360 px stehen die Knöpfe je Paket in der Karte, mindestens 44 px hoch und im Bild', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto('/preise/');
  for (const a of await page.locator('table.price-plans td.price-desc .price-action a').all()) {
    const box = await a.boundingBox();
    expect(box!.height).toBeGreaterThanOrEqual(44);
    expect(box!.x + box!.width).toBeLessThanOrEqual(360);
  }
});

test('bei 360 px sind alle Preise sichtbar, ohne waagerechtes Scrollen der Seite', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto('/preise/');
  await page.evaluate(() => document.fonts.ready);
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0);
  const vw = 360;
  for (const p of PLANS) {
    for (const c of ['monthly', 'yearly', 'beta']) {
      const box = await page.locator(`tr[data-plan="${p.id}"] [data-col="${c}"]`).boundingBox();
      expect(box, `${p.id} ${c}`).not.toBeNull();
      expect(box!.x).toBeGreaterThanOrEqual(0);
      expect(box!.x + box!.width).toBeLessThanOrEqual(vw);
    }
  }
  // Die Matrix liegt in einem Scrollrahmen mit Hinweis.
  await expect(page.locator('.price-matrix-box .rt-table-hint')).toBeVisible();
  await expect(page.locator('.price-matrix-wrap')).toHaveAttribute('tabindex', '0');
  expect(await page.locator('.price-matrix-wrap').evaluate((e) => e.scrollWidth > e.clientWidth)).toBe(true);
});

test('Druckansicht: helles Thema, ohne Navigation und Abschlussband', async ({ page }) => {
  await page.goto('/preise/');
  await page.emulateMedia({ media: 'print' });
  const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  const fg = await page.evaluate(() => getComputedStyle(document.body).color);
  const lum = (c: string) => c.match(/\d+/g)!.slice(0, 3).map(Number).reduce((a, b) => a + b, 0) / 3;
  expect(lum(bg)).toBeGreaterThan(200);
  expect(lum(fg)).toBeLessThan(80);
  await expect(page.locator('.rt-site-header')).toBeHidden();
  await expect(page.locator('.rt-footer')).toBeHidden();
  await expect(page.locator('#abschluss')).toBeHidden();
  await expect(page.locator('table.price-plans')).toBeVisible();
  await expect(page.locator('table.price-matrix')).toBeVisible();
  const breaks = await page.locator('.price-matrix tr').evaluateAll((els) => els.every((e) => getComputedStyle(e).breakInside === 'avoid'));
  expect(breaks).toBe(true);
  // Geschlossene Belege fallen im Druck weg, auch in der Pakettabelle.
  for (const b of await page.locator('table.price-plans .rt-beleg').all()) await expect(b).toBeHidden();
  // Alle Antworten der Fragenliste stehen im Druck.
  for (const a of await page.locator('.price-faq .price-answer').all()) await expect(a).toBeVisible();
  await expect(page.locator('.price-faq .price-answer').first()).toContainText('Ein CI ist ein Eintrag in der CMDB');
});

test('Zeilenkopf der Pakettabelle enthält nur den Namen; Knöpfe haben je Paket einen eigenen Namen', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/preise/');
  for (const p of PLANS) {
    const row = page.locator(`table.price-plans tr[data-plan="${p.id}"]`);
    await expect(row.locator('th[scope="row"]')).toHaveText(p.name);
    await expect(row.locator('th[scope="row"]')).toHaveAccessibleName(p.name);
  }
  const names = await page.locator('table.price-plans .price-action a').evaluateAll((els) => els.map((e) => e.getAttribute('aria-label')));
  expect(new Set(names).size).toBe(PLANS.length);
});

test('Fragen sind Überschriften (h3) mit der Antwort darunter und immer sichtbar', async ({ page }) => {
  await page.goto('/preise/');
  await expect(page.getByRole('heading', { level: 3 })).toHaveCount(8);
  await expect(page.locator('.price-faq details:not(.rt-beleg)')).toHaveCount(0);
  for (const a of await page.locator('.price-faq .price-answer').all()) await expect(a).toBeVisible();
});

test('bei 360 px liegt der aufgeklappte Beleg C-60 ganz im Scrollrahmen der Matrix', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto('/preise/');
  const claim = page.locator('tr[data-feature="storage"] [data-claim="C-60"]');
  await claim.scrollIntoViewIfNeeded();
  await claim.locator('summary').click();
  const wrap = page.locator('.price-matrix-wrap');
  await wrap.evaluate((e) => { e.scrollLeft = e.scrollWidth; });
  const body = (await claim.locator('.rt-beleg-body').boundingBox())!;
  const frame = (await wrap.boundingBox())!;
  expect(body.x).toBeGreaterThanOrEqual(frame.x);
  expect(body.x + body.width).toBeLessThanOrEqual(frame.x + frame.width);
  expect(body.x + body.width).toBeLessThanOrEqual(360);
});

test.describe('Druck', () => {
  test('ohne Handlungsknöpfe, mit den Belegtexten als Liste', async ({ page }) => {
    await page.goto('/preise/');
    await expect(page.locator('.price-footnotes')).toBeHidden();
    await page.emulateMedia({ media: 'print' });
    await expect(page.locator('.price-action a').first()).toBeHidden();
    await expect(page.locator('#test .home-link')).toBeHidden();
    await expect(page.locator('.rt-beleg').first()).toBeHidden();
    const notes = page.locator('.price-footnotes li');
    await expect(page.locator('.price-footnotes')).toBeVisible();
    for (const id of ['C-21', 'C-22', 'C-60', 'C-92']) await expect(notes.filter({ hasText: id })).toHaveCount(1);
    for (const li of await notes.all()) expect((await li.innerText()).length).toBeGreaterThan(40);
  });
});
