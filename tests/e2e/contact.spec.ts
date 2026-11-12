import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { SITE } from '../../src/data/site';
import { ui } from '../../src/i18n';
import { KONTAKT_DE } from '../../src/content/de/kontakt';
import { content } from '../../src/content';
import { E2E_DIR, leadCount, uniqueEmail } from './helpers/backend';

const T = ui('de');
const F = T.form;
const E = F.errors;
const ORIGIN = 'http://127.0.0.1:8080';
const SITE_CSP = /Content-Security-Policy "([^"]+)"/.exec(readFileSync(join(process.cwd(), 'public/.htaccess'), 'utf8'))![1];

/** Führt PHP mit PDO gegen die SQLite-Datei einer Testinstanz aus (kein sqlite3-CLI nötig). */
const sql = (instance: 'main' | 'limit', statement: string) =>
  execFileSync('php', ['-r', '$p = new PDO("sqlite:" . $argv[1]); $p->setAttribute(PDO::ATTR_TIMEOUT, 10); $p->exec($argv[2]);', '--', join(E2E_DIR, `${instance}.sqlite`), statement]);

/** Mails der Hauptinstanz, die diese Adresse betreffen, getrennt nach Empfänger und Antwortadresse. */
function mails(email: string) {
  const f = join(E2E_DIR, 'main-mails.jsonl');
  const all = existsSync(f) ? readFileSync(f, 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l) as { to: string; reply_to: string | null }) : [];
  return { to: all.filter((m) => m.to === email).length, replyTo: all.filter((m) => m.reply_to === email).length, sales: all.filter((m) => m.reply_to === email && m.to === 'vertrieb@example.com').length };
}

async function fill(page: Page, email: string, over: Partial<Record<'name' | 'company' | 'topic' | 'message', string>> = {}) {
  await page.locator('#f-name').fill(over.name ?? 'Erika Beispiel');
  await page.locator('#f-email').fill(email);
  await page.locator('#f-company').fill(over.company ?? 'Beispiel GmbH');
  await page.locator('#f-topic').selectOption(over.topic ?? 'demo');
  await page.locator('#f-message').fill(over.message ?? 'Bitte um Rückruf.');
}

const submit = (page: Page) => page.getByRole('button', { name: F.submit }).click();
const leadPost = (page: Page) => page.waitForResponse((r) => r.url() === `${ORIGIN}/api/lead.php` && r.request().method() === 'POST');

// Die Hauptinstanz zählt je Herkunft höchstens 100 Anfragen in der Stunde; alle Tests kommen von 127.0.0.1.
// Jeder Test beginnt deshalb mit leeren Zählern. Das Limit selbst prüft der Test gegen die Instanz „limit“.
test.beforeEach(() => {
  sql('main', 'DELETE FROM rate_limit');
});

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
    // Ä-07: keine Zeitfalle mehr
    await expect(page.locator('input[name=ts], input[name=sig]')).toHaveCount(0);
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

  test('?topic= wählt das Anliegen vor, nur Werte aus der festen Liste', async ({ page }) => {
    for (const v of ['security', 'enterprise', 'demo', 'other']) {
      await page.goto(`/kontakt/?topic=${v}`);
      await expect(page.locator('#f-topic')).toHaveValue(v);
    }
    for (const v of ['', 'Security', 'x"><img src=x>', 'constructor', 'toString']) {
      await page.goto(`/kontakt/?topic=${encodeURIComponent(v)}`);
      await expect(page.locator('#f-topic')).toHaveValue('');
    }
    // Sonst wird aus der Adresse nichts übernommen (auch keine früheren Fehlercodes).
    await page.goto('/kontakt/?fehler=name.required&error=email.invalid&name=X');
    await expect(page.locator('#form-summary')).toBeHidden();
    await expect(page.locator('#f-name-err')).toBeHidden();
    await expect(page.locator('#f-name')).toHaveValue('');
  });
});

test.describe('Absenden mit JavaScript', () => {
  test('Erfolg sofort nach dem Laden: Dankeseite, Anfrage gespeichert, nur eine Mail an den Vertrieb', async ({ page }) => {
    const email = uniqueEmail('ok');
    await page.goto('/kontakt/');
    await fill(page, email);
    await submit(page);
    await expect(page).toHaveURL(/\/kontakt\/danke\/$/);
    await expect(page.locator('h1')).toHaveText(KONTAKT_DE.danke.h1);
    expect(page.url()).not.toContain(email);
    expect(leadCount(email)).toBe(1);
    expect(mails(email)).toEqual({ to: 0, replyTo: 1, sales: 1 });
  });

  test('Tastaturweg durch das Formular bis zur Dankeseite', async ({ page }) => {
    const email = uniqueEmail('kbd');
    await page.goto('/kontakt/?topic=demo');
    const active = () => page.evaluate(() => document.activeElement?.id ?? '');
    await page.locator('#f-name').focus();
    await page.keyboard.type('Tastatur Test');
    await page.keyboard.press('Tab');
    expect(await active()).toBe('f-email');
    await page.keyboard.type(email);
    await page.keyboard.press('Tab');
    expect(await active()).toBe('f-company');
    await page.keyboard.type('Tastatur GmbH');
    await page.keyboard.press('Tab');
    // Nächstes Ziel ist die Auswahl; Browser, die Auswahllisten beim Tabben überspringen (WebKit je nach
    // Einstellung), landen auf der Nachricht. Nie auf dem Köderfeld.
    expect(['f-topic', 'f-message']).toContain(await active());
    await page.locator('#f-message').focus();
    await page.keyboard.type('Nachricht per Tastatur');
    await page.keyboard.press('Tab');
    expect(await active()).not.toBe('f-website');
    // Absenden mit Enter in einem Textfeld (implizites Absenden, in allen Browsern gleich)
    await page.locator('#f-company').focus();
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/\/kontakt\/danke\/$/);
    expect(leadCount(email)).toBe(1);
  });

  test('leeres Formular: Zusammenfassung mit Fokus, Fehler am Feld, Links, aria-invalid', async ({ page }) => {
    await page.goto('/kontakt/');
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
    await expect(page).toHaveURL(/\/kontakt\/$/);
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
    { title: 'topic.required', over: { topic: '' }, field: 'topic', text: E.topic.required },
  ];
  for (const c of cases)
    test(`Feldfehler ${c.title}`, async ({ page }) => {
      const email = c.email ?? uniqueEmail('err');
      await page.goto('/kontakt/');
      await fill(page, email, c.over);
      await submit(page);
      await expect(page.locator(`#f-${c.field}-err`)).toHaveText(c.text);
      await expect(page.locator('#form-summary')).toBeFocused();
      await expect(page.locator('#form-summary-title')).toHaveText(F.summaryOne);
      await expect(page).toHaveURL(/\/kontakt\/$/);
      expect(leadCount(email)).toBe(0);
    });

  test('Name mit Zero-Width-Joiner (U+200D) wird angenommen', async ({ page }) => {
    const email = uniqueEmail('zwj');
    await page.goto('/kontakt/');
    await fill(page, email, { name: 'क्‍ष Beispiel' });
    await submit(page);
    await expect(page).toHaveURL(/\/kontakt\/danke\/$/);
    expect(leadCount(email)).toBe(1);
  });

  test('Köderfeld gefüllt: scheinbarer Erfolg, aber nichts gespeichert', async ({ page }) => {
    const email = uniqueEmail('bot');
    await page.goto('/kontakt/');
    await fill(page, email);
    await page.locator('#f-website').evaluate((e: HTMLInputElement) => (e.value = 'https://spam.example'));
    await submit(page);
    await expect(page).toHaveURL(/\/kontakt\/danke\/$/);
    expect(leadCount(email)).toBe(0);
    expect(mails(email)).toEqual({ to: 0, replyTo: 0, sales: 0 });
  });

  test('Rate-Limit (429) und Serverfehler (500) und fehlende Verbindung: Meldung mit direktem Kontakt, Fokus, Knopf wieder frei', async ({ page }) => {
    const email = uniqueEmail('net');
    await page.goto('/kontakt/');
    await fill(page, email);
    const contact = SITE.email ?? T.placeholders.email;
    for (const [mode, text] of [[429, F.rate], [500, F.server], ['abort', F.server]] as const) {
      await page.route('**/api/lead.php', (route) => (mode === 'abort' ? route.abort() : route.fulfill({ status: mode, contentType: 'application/json', body: '{"ok":false}' })));
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
    expect(mails(email)).toEqual({ to: 0, replyTo: 1, sales: 1 });
  });

  test('Eingabefehler: 422 mit der Kontaktseite, Fehler am Feld und in der Zusammenfassung, Eingaben erhalten, keine Adresse mit Query', async ({ page }) => {
    const email = uniqueEmail('nojserr');
    const name = 'Geheimer-Name-' + 'x'.repeat(200);
    const message = 'Zeile 1\nZeile 2 mit <b>HTML</b> & "Zitat"';
    await page.goto('/kontakt/');
    await fill(page, email, { name, company: 'Firma​GmbH', topic: 'enterprise', message });
    const response = leadPost(page);
    await submit(page);
    const r = await response;
    expect(r.status()).toBe(422);
    expect(r.headers()['content-security-policy']).toBe(SITE_CSP);
    expect(r.headers()['location']).toBeUndefined();
    await expect(page).toHaveURL(`${ORIGIN}/api/lead.php`);
    expect(page.url()).not.toContain('?');
    await expect(page.locator('h1')).toHaveText(KONTAKT_DE.hero.h1);
    const sum = page.locator('#form-summary');
    await expect(sum).toBeVisible();
    await expect(page.locator('#form-summary-title')).toHaveText(F.summaryMany.replace('{n}', '2'));
    await expect(sum.locator('li')).toHaveText([E.name.too_long, E.company.invalid]);
    await expect(sum.getByRole('link', { name: E.name.too_long })).toHaveAttribute('href', '#f-name');
    await expect(page.locator('#f-name-err')).toHaveText(E.name.too_long);
    await expect(page.locator('#f-company-err')).toHaveText(E.company.invalid);
    await expect(page.locator('#f-email-err')).toBeHidden();
    await expect(page.locator('#f-name')).toHaveAttribute('aria-invalid', 'true');
    await expect(page.locator('#f-email')).not.toHaveAttribute('aria-invalid', 'true');
    await expect(page.locator('#f-name')).toHaveValue(name);
    await expect(page.locator('#f-email')).toHaveValue(email);
    await expect(page.locator('#f-company')).toHaveValue('Firma​GmbH');
    await expect(page.locator('#f-topic')).toHaveValue('enterprise');
    await expect(page.locator('#f-message')).toHaveValue(message);
    await expect(page.locator('#f-website')).toHaveValue('');
    expect(leadCount(email)).toBe(0);
    // Korrigieren und erneut absenden führt zur Dankeseite.
    await page.locator('#f-name').fill('Erika Beispiel');
    await page.locator('#f-company').fill('Beispiel GmbH');
    await submit(page);
    await expect(page).toHaveURL(/\/kontakt\/danke\/$/);
    expect(leadCount(email)).toBe(1);
  });

  test('XSS-Versuche in den Feldern erscheinen als Text', async ({ page }) => {
    const email = uniqueEmail('xss');
    const xss = {
      name: '"><script>alert(1)</script>',
      company: 'Firma​" autofocus onfocus="alert(2)',
      message: "</textarea><script>alert(3)</script><img src=x onerror=alert(4)>' onmouseover='alert(5)",
    };
    await page.goto('/kontakt/');
    await fill(page, email, xss);
    const response = leadPost(page);
    await submit(page);
    expect((await response).status()).toBe(422);
    await expect(page.locator('#f-name')).toHaveValue(xss.name);
    await expect(page.locator('#f-company')).toHaveValue(xss.company);
    await expect(page.locator('#f-message')).toHaveValue(xss.message);
    await expect(page.locator('script:not([src])')).toHaveCount(0);
    await expect(page.locator('main img, [onfocus], [onerror], [onmouseover], input[autofocus]')).toHaveCount(0);
  });
});

test.describe('Fehlerseite des Servers mit JavaScript', () => {
  /** Sendet das Formular wie ohne Insel (form.submit() löst kein submit-Ereignis aus und prüft nichts). */
  const nativeSubmit = (page: Page) => page.locator('form[data-lead]').evaluate((f: HTMLFormElement) => f.submit());

  test('XSS in jedem Feld: kein Dialog, keine CSP-Verstöße, Stile und Insel laden, Korrektur führt zur Dankeseite', async ({ page }) => {
    const dialogs: string[] = [];
    const errors: string[] = [];
    page.on('dialog', (d) => (dialogs.push(d.message()), d.dismiss()));
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
    await page.addInitScript(() => {
      (window as unknown as { __csp: string[] }).__csp = [];
      document.addEventListener('securitypolicyviolation', (e) => (window as unknown as { __csp: string[] }).__csp.push(`${e.violatedDirective} ${e.blockedURI}`));
    });
    const email = uniqueEmail('xssjs');
    await page.goto('/kontakt/');
    const wanted = { left: await page.locator('#f-name').evaluate((e) => getComputedStyle(e).borderTopWidth) };
    await page.locator('#f-name').fill('"><script>alert(1)</script>');
    await page.locator('#f-email').fill('x"><svg onload=alert(2)>@example.com');
    await page.locator('#f-company').fill("' autofocus onfocus='alert(3)");
    await page.locator('#f-topic').evaluate((s: HTMLSelectElement) => {
      const o = document.createElement('option');
      o.value = 'demo" selected onfocus="alert(4)';
      s.append(o);
      s.value = o.value;
    });
    await page.locator('#f-message').fill('</textarea><script>alert(5)</script>');
    const response = leadPost(page);
    await nativeSubmit(page);
    expect((await response).status()).toBe(422);
    await expect(page).toHaveURL(`${ORIGIN}/api/lead.php`);
    await expect(page.locator('#form-summary')).toBeFocused();
    await expect(page.locator('#f-name')).toHaveValue('"><script>alert(1)</script>');
    await expect(page.locator('#f-email')).toHaveValue('x"><svg onload=alert(2)>@example.com');
    await expect(page.locator('#f-company')).toHaveValue("' autofocus onfocus='alert(3)");
    await expect(page.locator('#f-topic')).toHaveValue('');
    await expect(page.locator('#f-topic option[selected]')).toHaveCount(0);
    await expect(page.locator('#f-topic-err')).toHaveText(E.topic.invalid);
    await expect(page.locator('#f-message')).toHaveValue('</textarea><script>alert(5)</script>');
    await expect(page.locator('script:not([src]), svg[onload], [onfocus]')).toHaveCount(0);
    // Stile der Website greifen (gleiche Rahmenbreite wie auf /kontakt/), CSP ohne Verstoß
    expect(await page.locator('#f-name').evaluate((e) => getComputedStyle(e).borderTopWidth)).toBe(wanted.left);
    expect(await page.evaluate(() => (window as unknown as { __csp: string[] }).__csp)).toEqual([]);
    // Die Insel läuft auch auf der Fehlerseite: Korrektur per fetch, dann Dankeseite
    await page.locator('#f-name').fill('Erika Beispiel');
    await page.locator('#f-email').fill(email);
    await page.locator('#f-company').fill('Beispiel GmbH');
    await page.locator('#f-topic').selectOption('security');
    await page.locator('#f-message').fill('');
    await submit(page);
    await expect(page).toHaveURL(/\/kontakt\/danke\/$/);
    expect(leadCount(email)).toBe(1);
    expect(dialogs).toEqual([]);
    expect(errors.filter((e) => !/422/.test(e))).toEqual([]);
  });
});

test.describe('Englisch (/en/contact/)', () => {
  const EN = ui('en').form;
  const K = content('en').kontakt;
  const submitEn = (page: Page) => page.getByRole('button', { name: EN.submit }).click();

  test('Formular sendet lang=en und kennt die englische Dankeseite', async ({ page }) => {
    await page.goto('/en/contact/');
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(page.locator('h1')).toHaveText(K.hero.h1);
    await expect(page.locator('input[name=lang]')).toHaveValue('en');
    await expect(page.locator('form')).toHaveAttribute('data-thanks', '/en/contact/thanks/');
    await expect(page.locator('#f-topic option')).toHaveText([EN.fields.topic.choose, ...Object.values(EN.fields.topic.options)]);
    await expect(page.locator('.contact-direct').getByRole('link', { name: K.direct.imprint })).toHaveAttribute('href', '/en/legal-notice/');
    await expect(page.locator('[data-placeholder="kontakt-verarbeitung"]').getByRole('link', { name: EN.privacy })).toHaveAttribute('href', '/en/privacy/');
  });

  test('mit JavaScript: Erfolg endet auf /en/contact/thanks/', async ({ page }) => {
    const email = uniqueEmail('en-js');
    await page.goto('/en/contact/');
    await fill(page, email);
    await submitEn(page);
    await expect(page).toHaveURL(/\/en\/contact\/thanks\/$/);
    await expect(page.locator('h1')).toHaveText(K.danke.h1);
    expect(leadCount(email)).toBe(1);
  });

  test('mit JavaScript: Fehler am Feld und in der Zusammenfassung englisch', async ({ page }) => {
    await page.goto('/en/contact/');
    await submitEn(page);
    await expect(page.locator('#form-summary-title')).toHaveText(EN.summaryMany.replace('{n}', '4'));
    await expect(page.locator('#f-email-err')).toHaveText(EN.errors.email.required);
  });

  test.describe('ohne JavaScript', () => {
    test.use({ javaScriptEnabled: false });

    test('Erfolg endet auf /en/contact/thanks/', async ({ page }) => {
      const email = uniqueEmail('en-nojs');
      await page.goto('/en/contact/');
      await fill(page, email);
      await submitEn(page);
      await expect(page).toHaveURL(/\/en\/contact\/thanks\/$/);
      await expect(page.locator('h1')).toHaveText(K.danke.h1);
      expect(leadCount(email)).toBe(1);
    });

    test('Eingabefehler: 422 mit der englischen Kontaktseite, englische Fehlertexte, Eingaben erhalten', async ({ page }) => {
      const email = uniqueEmail('en-nojserr');
      const message = 'Line 1\nLine 2 with <b>HTML</b> & "quote"';
      await page.goto('/en/contact/');
      await fill(page, email, { name: 'x'.repeat(201), company: 'Firma\u200bGmbH', topic: 'security', message });
      const response = leadPost(page);
      await submitEn(page);
      const r = await response;
      expect(r.status()).toBe(422);
      await expect(page).toHaveURL(`${ORIGIN}/api/lead.php`);
      await expect(page.locator('html')).toHaveAttribute('lang', 'en');
      await expect(page.locator('h1')).toHaveText(K.hero.h1);
      await expect(page.locator('#form-summary')).toBeVisible();
      await expect(page.locator('#form-summary-title')).toHaveText(EN.summaryMany.replace('{n}', '2'));
      await expect(page.locator('#form-summary li')).toHaveText([EN.errors.name.too_long, EN.errors.company.invalid]);
      await expect(page.locator('#f-name-err')).toHaveText(EN.errors.name.too_long);
      await expect(page.locator('#f-company-err')).toHaveText(EN.errors.company.invalid);
      await expect(page.locator('#f-name')).toHaveValue('x'.repeat(201));
      await expect(page.locator('#f-email')).toHaveValue(email);
      await expect(page.locator('#f-company')).toHaveValue('Firma\u200bGmbH');
      await expect(page.locator('#f-topic')).toHaveValue('security');
      await expect(page.locator('#f-message')).toHaveValue(message);
      await expect(page.locator('input[name=lang]')).toHaveValue('en');
      expect(leadCount(email)).toBe(0);
      // Korrigieren und erneut absenden führt zur englischen Dankeseite.
      await page.locator('#f-name').fill('Erika Beispiel');
      await page.locator('#f-company').fill('Beispiel GmbH');
      await submitEn(page);
      await expect(page).toHaveURL(/\/en\/contact\/thanks\/$/);
      expect(leadCount(email)).toBe(1);
    });
  });
});

test.describe('Backend hinter Apache', () => {
  test('kein Token-Endpunkt: jeder GET ergibt 405', async ({ request }) => {
    for (const q of ['?token=1', '', '?topic=demo']) {
      const r = await request.get(`/api/lead.php${q}`);
      expect(r.status()).toBe(405);
      expect(r.headers()['allow']).toBe('POST');
      expect(r.headers()['set-cookie']).toBeUndefined();
    }
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

  test('422-Seite: maskierte Eingaben, CSP der Website, Stile und Insel aus /_astro/ erreichbar', async ({ request }) => {
    const form = {
      name: '"><script>alert(1)</script>',
      email: "x' onfocus='alert(2)",
      company: '</textarea><script>alert(3)</script>',
      topic: 'security" selected x="',
      message: '</textarea><img src=x onerror=alert(4)>',
      lang: 'de',
    };
    const r = await request.post('/api/lead.php', { form, headers: { Origin: ORIGIN }, maxRedirects: 0 });
    expect(r.status()).toBe(422);
    expect(r.headers()['content-type']).toBe('text/html; charset=utf-8');
    expect(r.headers()['content-security-policy']).toBe(SITE_CSP);
    const html = await r.text();
    for (const raw of ['<script>alert', '<img src=x', "' onfocus='", '" selected x="']) expect(html).not.toContain(raw);
    expect(html).toContain('value="&quot;&gt;&lt;script&gt;alert(1)&lt;/script&gt;"');
    expect(html).toContain('value="x&#039; onfocus=&#039;alert(2)"');
    expect(html).toContain('&lt;/textarea&gt;&lt;img src=x onerror=alert(4)&gt;</textarea>');
    expect(html).not.toMatch(/data-rt-option="[a-z]+" selected/);
    const assets = [...html.matchAll(/(?:href|src)="(\/_astro\/[^"]+\.(?:css|js))"/g)].map((m) => m[1]);
    expect(assets.length).toBeGreaterThanOrEqual(2);
    for (const a of assets) expect((await request.get(a)).status(), a).toBe(200);
  });

  test('Rate-Limit: nach fünf erfolgreichen Anfragen 429 mit Retry-After (eigene Instanz mit Standardlimit, Zähler frisch)', async ({ request, browserName }) => {
    test.skip(browserName !== 'chromium', 'Die Instanz „limit“ wird von allen Browsern geteilt; ein Lauf genügt.');
    // Frischer Zähler: auch ein zweiter Lauf in derselben Stunde (wiederverwendeter Server) prüft wirklich.
    sql('limit', 'DELETE FROM rate_limit');
    const post = () =>
      request.post('/api-limit/lead.php', {
        form: { name: 'Limit', email: uniqueEmail('limit'), company: 'X GmbH', topic: 'demo', message: '', lang: 'de' },
        headers: { Origin: ORIGIN, Accept: 'application/json' },
      });
    const statuses: number[] = [];
    for (let i = 0; i < 5; i++) statuses.push((await post()).status());
    expect(statuses).toEqual([200, 200, 200, 200, 200]);
    const r = await post();
    expect(r.status()).toBe(429);
    expect(Number(r.headers()['retry-after'])).toBeGreaterThan(0);
    expect(Number(r.headers()['retry-after'])).toBeLessThanOrEqual(3600);
  });
});

test.describe('Barrierefreiheit und Hygiene', () => {
  test('axe: Ausgangszustand und Fehlerzustand ohne Befunde', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/kontakt/');
    let r = await new AxeBuilder({ page }).analyze();
    expect(r.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`)).toEqual([]);
    await submit(page);
    await expect(page.locator('#form-summary')).toBeVisible();
    r = await new AxeBuilder({ page }).analyze();
    expect(r.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`)).toEqual([]);
  });

  test('axe: Fehlerseite des Servers (422 ohne JavaScript-Absenden)', async ({ page }) => {
    await page.goto('/kontakt/');
    await page.locator('#f-email').fill('keine-adresse');
    const response = leadPost(page);
    await page.locator('form[data-lead]').evaluate((f: HTMLFormElement) => f.submit());
    expect((await response).status()).toBe(422);
    await expect(page.locator('#form-summary')).toBeVisible();
    const r = await new AxeBuilder({ page }).analyze();
    expect(r.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`)).toEqual([]);
  });

  test('axe: Meldung bei Serverfehler', async ({ page }) => {
    await page.goto('/kontakt/');
    await fill(page, uniqueEmail('axe'));
    await page.route('**/api/lead.php', (route) => route.fulfill({ status: 500, body: '{"ok":false}' }));
    await submit(page);
    await expect(page.locator('[data-notice="500"]')).toBeVisible();
    const r = await new AxeBuilder({ page }).analyze();
    expect(r.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`)).toEqual([]);
  });

  test('keine fremden Hosts, keine Konsolenfehler, keine CSP-Verstöße, keine Cookies', async ({ page, context, baseURL }) => {
    const hosts = new Set<string>();
    const errors: string[] = [];
    page.on('request', (r) => {
      const u = new URL(r.url());
      if (u.protocol.startsWith('http')) hosts.add(u.host);
    });
    page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
    page.on('pageerror', (e) => errors.push(e.message));
    await page.addInitScript(() => {
      (window as unknown as { __csp: string[] }).__csp = [];
      document.addEventListener('securitypolicyviolation', (e) => (window as unknown as { __csp: string[] }).__csp.push(`${e.violatedDirective} ${e.blockedURI}`));
    });
    await page.goto('/kontakt/', { waitUntil: 'networkidle' });
    await submit(page); // 422
    await expect(page.locator('#form-summary')).toBeVisible();
    expect(await page.evaluate(() => (window as unknown as { __csp: string[] }).__csp)).toEqual([]);
    await fill(page, uniqueEmail('hyg'));
    await submit(page); // 200, Navigation
    await expect(page).toHaveURL(/danke/);
    expect([...hosts]).toEqual([new URL(baseURL!).host]);
    expect(errors.filter((e) => !/422/.test(e))).toEqual([]);
    expect(await context.cookies()).toEqual([]);
  });
});
