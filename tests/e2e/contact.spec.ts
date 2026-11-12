import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { SITE } from '../../src/data/site';
import { ui } from '../../src/i18n';
import { KONTAKT_DE } from '../../src/content/de/kontakt';
import { leadCount, mailCount, uniqueEmail } from './helpers/backend';

const T = ui('de');
const F = T.form;
const E = F.errors;
const ORIGIN = 'http://127.0.0.1:8080';

/** Wartet auf das Token der Insel und danach die 3 s der Zeitfalle (frühere Absendungen gelten dem Backend als Bot). */
async function ready(page: Page) {
  await page.waitForFunction(() => (document.querySelector('input[name=sig]') as HTMLInputElement | null)?.value.length === 64);
  await page.waitForTimeout(3300);
}

async function fill(page: Page, email: string, over: Partial<Record<'name' | 'company' | 'topic' | 'message', string>> = {}) {
  await page.locator('#f-name').fill(over.name ?? 'Erika Beispiel');
  await page.locator('#f-email').fill(email);
  await page.locator('#f-company').fill(over.company ?? 'Beispiel GmbH');
  await page.locator('#f-topic').selectOption(over.topic ?? 'demo');
  await page.locator('#f-message').fill(over.message ?? 'Bitte um Rückruf.');
}

const submit = (page: Page) => page.getByRole('button', { name: F.submit }).click();

test.describe('Seite', () => {
  test('Kopf, Texte und Felder wie im Textdokument', async ({ page }) => {
    await page.goto('/kontakt/');
    expect(await page.title()).toBe(KONTAKT_DE.meta.title);
    await expect(page.locator('h1')).toHaveText(KONTAKT_DE.hero.h1);
    await expect(page.locator('.lead')).toHaveText(KONTAKT_DE.hero.lead);
    await expect(page.getByText(F.required)).toBeVisible();
    for (const [name, label, ac] of [['name', F.fields.name.label, 'name'], ['email', F.fields.email.label, 'email'], ['company', F.fields.company.label, 'organization'], ['topic', F.fields.topic.label, 'off'], ['message', F.fields.message.label, 'off']] as const) {
      await expect(page.getByLabel(label, { exact: true })).toHaveAttribute('name', name);
      await expect(page.locator(`#f-${name}`)).toHaveAttribute('autocomplete', ac);
    }
    await expect(page.locator('#f-email')).toHaveAttribute('type', 'email');
    await expect(page.locator('#f-topic option')).toHaveText([F.fields.topic.choose, ...Object.values(F.fields.topic.options)]);
    await expect(page.locator('#f-topic option')).toHaveCount(5);
    await expect(page.locator('#f-email')).toHaveAttribute('aria-describedby', 'f-email-hint f-email-err');
    await expect(page.locator('form')).toHaveAttribute('action', '/api/lead.php');
    await expect(page.locator('form')).toHaveAttribute('method', 'post');
    await expect(page.locator('input[name=lang]')).toHaveValue('de');
    await expect(page.locator('form')).toHaveAttribute('data-thanks', '/kontakt/danke/');
  });

  test('Köderfeld: verborgen für Hilfstechnik, nicht fokussierbar', async ({ page }) => {
    await page.goto('/kontakt/');
    const trap = page.locator('#f-website');
    await expect(trap).toHaveAttribute('tabindex', '-1');
    await expect(trap).toHaveAttribute('autocomplete', 'off');
    await expect(page.locator('.contact-trap')).toHaveAttribute('aria-hidden', 'true');
    await expect(page.locator('.contact-trap label')).toHaveText(F.trap);
  });

  test('Direkter Kontakt aus SITE, fehlende Angaben als Platzhalter; Verarbeitungshinweis als Platzhalter mit Link', async ({ page }) => {
    await page.goto('/kontakt/');
    const aside = page.locator('.contact-direct');
    await expect(aside.getByRole('heading', { name: KONTAKT_DE.direct.title })).toBeVisible();
    await expect(aside).toContainText(SITE.company);
    await expect(aside).toContainText(SITE.street);
    await expect(aside).toContainText(SITE.city);
    if (SITE.email) await expect(aside.getByRole('link', { name: SITE.email })).toBeVisible();
    else await expect(aside.locator('[data-placeholder="kontakt-email"]')).toHaveText(T.placeholders.email);
    if (!SITE.phone) await expect(aside.locator('[data-placeholder="kontakt-telefon"]')).toHaveText(T.placeholders.phone);
    await expect(aside.getByRole('link', { name: KONTAKT_DE.direct.imprint })).toHaveAttribute('href', '/impressum/');
    const note = page.locator('[data-placeholder="kontakt-verarbeitung"]');
    await expect(note).toContainText(F.processing);
    await expect(note.getByRole('link', { name: F.privacy })).toHaveAttribute('href', '/datenschutz/');
  });

  test('Danke-Seite: Text, Links, noindex', async ({ page }) => {
    await page.goto('/kontakt/danke/');
    await expect(page.locator('h1')).toHaveText(KONTAKT_DE.danke.h1);
    await expect(page.locator('.lead')).toHaveText(KONTAKT_DE.danke.text);
    await expect(page.getByRole('link', { name: KONTAKT_DE.danke.demo })).toHaveAttribute('href', '/demo/');
    await expect(page.getByRole('link', { name: KONTAKT_DE.danke.home })).toHaveAttribute('href', '/');
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex');
    expect(await page.title()).toBe(KONTAKT_DE.danke.meta.title);
  });
});

test.describe('Absenden mit JavaScript', () => {
  test('Erfolg: Dankeseite, Anfrage gespeichert, Mails geschrieben', async ({ page }) => {
    const email = uniqueEmail('ok');
    await page.goto('/kontakt/');
    await fill(page, email);
    await ready(page);
    await submit(page);
    await expect(page).toHaveURL(/\/kontakt\/danke\/$/);
    await expect(page.locator('h1')).toHaveText(KONTAKT_DE.danke.h1);
    expect(page.url()).not.toContain(email);
    expect(leadCount(email)).toBe(1);
    expect(mailCount(email)).toBeGreaterThanOrEqual(1);
  });

  test('Tastaturweg durch das ganze Formular bis zur Dankeseite', async ({ page }) => {
    const email = uniqueEmail('kbd');
    await page.goto('/kontakt/');
    await ready(page);
    await page.locator('#f-name').focus();
    await page.keyboard.type('Tastatur Test');
    await page.keyboard.press('Tab');
    await expect(page.locator('#f-email')).toBeFocused();
    await page.keyboard.type(email);
    await page.keyboard.press('Tab');
    await expect(page.locator('#f-company')).toBeFocused();
    await page.keyboard.type('Tastatur GmbH');
    await page.keyboard.press('Tab');
    await expect(page.locator('#f-topic')).toBeFocused();
    await page.keyboard.press('ArrowDown');
    await expect(page.locator('#f-topic')).toHaveValue('demo');
    await page.keyboard.press('Tab');
    await expect(page.locator('#f-message')).toBeFocused();
    await page.keyboard.type('Nachricht per Tastatur');
    await page.keyboard.press('Tab');
    // Das Köderfeld wird übersprungen: nach der Nachricht folgt der Knopf.
    await expect(page.getByRole('button', { name: F.submit })).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/\/kontakt\/danke\/$/);
    expect(leadCount(email)).toBe(1);
  });

  test('leeres Formular: Zusammenfassung mit Fokus, Fehler am Feld, Links, aria-invalid', async ({ page }) => {
    await page.goto('/kontakt/');
    await ready(page);
    await submit(page);
    const sum = page.locator('#form-summary');
    await expect(sum).toBeVisible();
    await expect(sum).toBeFocused();
    await expect(sum).toHaveAttribute('role', 'alert');
    await expect(page.locator('#form-summary-title')).toHaveText(F.summaryMany.replace('{n}', '4'));
    const expected: [string, string][] = [
      ['name', E.name.required], ['email', E.email.required], ['company', E.company.required], ['topic', E.topic.required],
    ];
    for (const [name, text] of expected) {
      await expect(page.locator(`#f-${name}-err`)).toHaveText(text);
      await expect(page.locator(`#f-${name}-err`)).toBeVisible();
      await expect(page.locator(`#f-${name}`)).toHaveAttribute('aria-invalid', 'true');
      await expect(sum.getByRole('link', { name: text })).toHaveAttribute('href', `#f-${name}`);
    }
    await expect(page.locator('#f-message-err')).toBeHidden();
    // Link in der Zusammenfassung führt zum Feld
    await sum.getByRole('link', { name: E.name.required }).click();
    await expect(page.locator('#f-name')).toBeFocused();
    // Ein erneutes Absenden räumt alte Fehler auf
    await page.locator('#f-name').fill('Erika');
    await submit(page);
    await expect(page.locator('#f-name-err')).toBeHidden();
    await expect(page.locator('#f-name')).not.toHaveAttribute('aria-invalid', 'true');
    await expect(page.locator('#form-summary-title')).toHaveText(F.summaryMany.replace('{n}', '3'));
  });

  const cases: { title: string; over: Parameters<typeof fill>[2]; email?: string; field: string; text: string }[] = [
    { title: 'name.too_long', over: { name: 'x'.repeat(201) }, field: 'name', text: E.name.too_long },
    { title: 'name.invalid (Steuerzeichen)', over: { name: 'Erika‮Beispiel' }, field: 'name', text: E.name.invalid },
    { title: 'company.too_long', over: { company: 'x'.repeat(201) }, field: 'company', text: E.company.too_long },
    { title: 'company.invalid', over: { company: 'Firma​GmbH' }, field: 'company', text: E.company.invalid },
    { title: 'email.invalid', over: {}, email: 'keine-adresse', field: 'email', text: E.email.invalid },
    { title: 'email.too_long', over: {}, email: `${'a'.repeat(250)}@example.com`, field: 'email', text: E.email.too_long },
    { title: 'message.too_long', over: { message: 'x'.repeat(4001) }, field: 'message', text: E.message.too_long },
  ];
  for (const c of cases)
    test(`Feldfehler ${c.title}`, async ({ page }) => {
      const email = c.email ?? uniqueEmail('err');
      await page.goto('/kontakt/');
      await fill(page, email, c.over);
      await ready(page);
      await submit(page);
      await expect(page.locator(`#f-${c.field}-err`)).toHaveText(c.text);
      await expect(page.locator('#form-summary')).toBeFocused();
      await expect(page.locator('#form-summary-title')).toHaveText(F.summaryOne);
      expect(page.url()).toContain('/kontakt/');
      expect(leadCount(email)).toBe(0);
    });

  test('Anliegen nicht gewählt ergibt den Text „required“ des Feldes', async ({ page }) => {
    await page.goto('/kontakt/');
    await fill(page, uniqueEmail('topic'));
    await page.locator('#f-topic').selectOption('');
    await ready(page);
    await submit(page);
    await expect(page.locator('#f-topic-err')).toHaveText(E.topic.required);
  });

  test('Köderfeld gefüllt: scheinbarer Erfolg, aber nichts gespeichert', async ({ page }) => {
    const email = uniqueEmail('bot');
    await page.goto('/kontakt/');
    await fill(page, email);
    await page.locator('#f-website').evaluate((e: HTMLInputElement) => (e.value = 'https://spam.example'));
    await ready(page);
    await submit(page);
    await expect(page).toHaveURL(/\/kontakt\/danke\/$/);
    expect(leadCount(email)).toBe(0);
    expect(mailCount(email)).toBe(0);
  });

  test('zu früh abgesendet (unter 3 s): scheinbarer Erfolg, nichts gespeichert', async ({ page }) => {
    const email = uniqueEmail('fast');
    await page.goto('/kontakt/');
    await fill(page, email);
    await page.waitForFunction(() => (document.querySelector('input[name=sig]') as HTMLInputElement).value.length === 64);
    await submit(page);
    await expect(page).toHaveURL(/\/kontakt\/danke\/$/);
    expect(leadCount(email)).toBe(0);
  });

  test('Rate-Limit (429) und Serverfehler (500) und fehlende Verbindung: Meldung mit direktem Kontakt, Fokus, Knopf wieder frei', async ({ page }) => {
    const email = uniqueEmail('net');
    await page.goto('/kontakt/');
    await fill(page, email);
    await ready(page);
    const contact = SITE.email ?? T.placeholders.email;
    for (const [mode, text] of [[429, F.rate], [500, F.server], ['abort', F.server]] as const) {
      await page.route('**/api/lead.php', (route) => {
        if (route.request().method() !== 'POST') return route.continue();
        return mode === 'abort' ? route.abort() : route.fulfill({ status: mode, contentType: 'application/json', body: '{"ok":false}' });
      });
      await submit(page);
      const notice = page.locator(`[data-notice="${mode === 429 ? '429' : '500'}"]`);
      await expect(notice).toBeVisible();
      await expect(notice).toBeFocused();
      await expect(notice).toContainText(text);
      await expect(notice).toContainText(contact);
      await expect(page.getByRole('button', { name: F.submit })).toBeEnabled();
      await page.unroute('**/api/lead.php');
    }
    expect(leadCount(email)).toBe(0);
  });

  test('Rückkehr mit ?fehler=: Zusammenfassung aus bekannten Codes, nie Text aus der Adresse', async ({ page }) => {
    await page.goto('/kontakt/?fehler=name.required,email.invalid,<img src=x onerror=alert(1)>,gibt.es.nicht#fehler');
    const sum = page.locator('#form-summary');
    await expect(sum).toBeVisible();
    await expect(sum).toBeFocused();
    await expect(page.locator('#form-summary-title')).toHaveText(F.summaryMany.replace('{n}', '2'));
    await expect(sum.locator('li')).toHaveText([E.name.required, E.email.invalid]);
    await expect(page.locator('#f-name-err')).toHaveText(E.name.required);
    await expect(page.locator('main img')).toHaveCount(0);
    await expect(page.locator('.contact-nojs')).toHaveCount(0);
  });

  test('?fehler= ohne bekannte Codes zeigt keine Zusammenfassung', async ({ page }) => {
    await page.goto('/kontakt/?fehler=nur.unsinn');
    await expect(page.locator('#form-summary')).toBeHidden();
    await expect(page.locator('[data-notice]').first()).toBeHidden();
  });
});

test.describe('Absenden ohne JavaScript', () => {
  test.use({ javaScriptEnabled: false });

  test('Erfolg: normales Absenden endet auf der Dankeseite', async ({ page }) => {
    const email = uniqueEmail('nojs');
    await page.goto('/kontakt/');
    await fill(page, email);
    await submit(page);
    await expect(page).toHaveURL(/\/kontakt\/danke\/$/);
    await expect(page.locator('h1')).toHaveText(KONTAKT_DE.danke.h1);
    expect(page.url()).not.toContain(email);
    expect(leadCount(email)).toBe(1);
  });

  test('Fehler vom Server: Rücksprung auf /kontakt/?fehler=…#fehler, allgemeine Zeile sichtbar, keine Eingaben in der Adresse', async ({ page }) => {
    const email = uniqueEmail('nojserr');
    await page.goto('/kontakt/');
    await expect(page.locator('#fehler')).toBeHidden();
    await fill(page, email, { name: 'Geheimer-Name-' + 'x'.repeat(200) });
    await submit(page);
    await expect(page).toHaveURL(/\/kontakt\/\?fehler=name\.too_long#fehler$/);
    expect(page.url()).not.toContain(email);
    expect(page.url()).not.toContain('Geheimer');
    await expect(page.locator('#fehler')).toBeVisible();
    await expect(page.locator('#fehler')).toContainText(F.generic);
    expect(leadCount(email)).toBe(0);
  });
});

test.describe('Backend hinter Apache', () => {
  test('Token-Endpunkt liefert ts und sig ohne Cookie', async ({ request }) => {
    const r = await request.get('/api/lead.php?token=1');
    expect(r.status()).toBe(200);
    expect(r.headers()['cache-control']).toBe('no-store');
    expect(r.headers()['set-cookie']).toBeUndefined();
    const j = await r.json();
    expect(j.sig).toMatch(/^[0-9a-f]{64}$/);
  });

  test('Origin wird unverändert durchgereicht: fremde Origin 403, eigene 200', async ({ request }) => {
    const form = { name: 'Erika', email: uniqueEmail('origin'), company: 'X GmbH', topic: 'demo', message: '', lang: 'de' };
    const bad = await request.post('/api/lead.php', { form, headers: { Origin: 'https://evil.example', Accept: 'application/json' } });
    expect(bad.status()).toBe(403);
    const none = await request.post('/api/lead.php', { form, headers: { Accept: 'application/json' } });
    expect(none.status()).toBe(403);
    const ok = await request.post('/api/lead.php', { form, headers: { Origin: ORIGIN, Accept: 'application/json' } });
    expect(ok.status()).toBe(200);
    expect(await ok.json()).toEqual({ ok: true });
    expect(leadCount(form.email)).toBe(1);
  });

  test('Rate-Limit: spätestens die sechste Anfrage je Stunde ergibt 429 mit Retry-After (eigene Instanz mit Standardlimit)', async ({ request, browserName }) => {
    test.skip(browserName !== 'chromium', 'Der Zähler gilt je Herkunft und wird von allen Browsern geteilt; ein Lauf genügt.');
    const statuses: number[] = [];
    let retry: string | undefined;
    for (let i = 0; i < 7; i++) {
      const r = await request.post('/api-limit/lead.php', {
        form: { name: 'Limit', email: uniqueEmail('limit'), company: 'X GmbH', topic: 'demo', message: '', lang: 'de' },
        headers: { Origin: ORIGIN, Accept: 'application/json' },
      });
      statuses.push(r.status());
      if (r.status() === 429) {
        retry = r.headers()['retry-after'];
        break;
      }
    }
    const first429 = statuses.indexOf(429);
    expect(first429, statuses.join()).toBeGreaterThanOrEqual(0);
    expect(first429).toBeLessThanOrEqual(5);
    expect(statuses.slice(0, first429).every((s) => s === 200)).toBe(true);
    expect(Number(retry)).toBeGreaterThan(0);
    expect(Number(retry)).toBeLessThanOrEqual(3600);
  });
});

test.describe('Barrierefreiheit und Hygiene', () => {
  test('axe: Ausgangszustand und Fehlerzustand ohne Befunde', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/kontakt/');
    let r = await new AxeBuilder({ page }).analyze();
    expect(r.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`)).toEqual([]);
    await ready(page);
    await submit(page);
    await expect(page.locator('#form-summary')).toBeVisible();
    r = await new AxeBuilder({ page }).analyze();
    expect(r.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`)).toEqual([]);
  });

  test('axe: Meldung bei Serverfehler', async ({ page }) => {
    await page.goto('/kontakt/');
    await fill(page, uniqueEmail('axe'));
    await ready(page);
    await page.route('**/api/lead.php', (route) => (route.request().method() === 'POST' ? route.fulfill({ status: 500, body: '{"ok":false}' }) : route.continue()));
    await submit(page);
    await expect(page.locator('[data-notice="500"]')).toBeVisible();
    const r = await new AxeBuilder({ page }).analyze();
    expect(r.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`)).toEqual([]);
  });

  test('keine fremden Hosts, keine Konsolenfehler, keine CSP-Verstöße, keine Cookies, leerer Web Storage', async ({ page, context, baseURL }) => {
    const hosts = new Set<string>();
    const errors: string[] = [];
    page.on('request', (r) => {
      const u = new URL(r.url());
      if (u.protocol.startsWith('http')) hosts.add(u.host);
    });
    page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
    page.on('pageerror', (e) => errors.push(e.message));
    await page.addInitScript(() => {
      (window as any).__csp = [];
      document.addEventListener('securitypolicyviolation', (e) => (window as any).__csp.push(`${e.violatedDirective} ${e.blockedURI}`));
    });
    await page.goto('/kontakt/', { waitUntil: 'networkidle' });
    await ready(page);
    await submit(page); // 422
    await expect(page.locator('#form-summary')).toBeVisible();
    expect(await page.evaluate(() => (window as any).__csp)).toEqual([]);
    await fill(page, uniqueEmail('hyg'));
    await submit(page); // 200, Navigation
    await expect(page).toHaveURL(/danke/);
    expect([...hosts]).toEqual([new URL(baseURL!).host]);
    expect(errors.filter((e) => !/422/.test(e))).toEqual([]);
    expect(await context.cookies()).toEqual([]);
  });
});
