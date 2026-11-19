import { expect, test, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ui } from '../../src/i18n';
import { mailsAbout, uniqueEmail } from './helpers/mailbox';

// Kontaktformular gegen die Zielumgebung: echtes Apache + PHP + MariaDB + SMTP mit STARTTLS und Anmeldung.
const SITE_CSP = /Content-Security-Policy "([^"]+)"/.exec(readFileSync(join(process.cwd(), 'public/.htaccess'), 'utf8'))![1];
const CASES = [
  { lang: 'de', path: '/kontakt/', thanks: /\/kontakt\/danke\/$/ },
  { lang: 'en', path: '/en/contact/', thanks: /\/en\/contact\/thanks\/$/ },
] as const;

async function fill(page: Page, email: string, name = 'Jürgen Größe 🚀', company = 'Müller & Söhne GmbH') {
  await page.locator('#f-name').fill(name);
  await page.locator('#f-email').fill(email);
  await page.locator('#f-company').fill(company);
  await page.locator('#f-topic').selectOption('demo');
  await page.locator('#f-message').fill('Grüße 🎉\nZweite Zeile');
}

/** Die Vertriebsmail kommt vor der Antwort an den Browser beim SMTP-Server an; kurz nachsehen, falls die API verzögert. */
async function expectOneSalesMail(email: string) {
  await expect.poll(async () => (await mailsAbout(email)).replyTo, { timeout: 10_000 }).toBe(1);
  expect(await mailsAbout(email)).toEqual({ toSales: 1, replyTo: 1, toVisitor: 0 });
}

for (const js of [true, false]) {
  test.describe(js ? 'mit JavaScript' : 'ohne JavaScript', () => {
    test.use({ javaScriptEnabled: js });
    for (const c of CASES) {
      test(`${c.lang}: Erfolg endet auf der Dankeseite, genau eine Mail an den Vertrieb`, async ({ page }) => {
        const email = uniqueEmail(`${c.lang}-${js ? 'js' : 'nojs'}`);
        await page.goto(c.path);
        await fill(page, email);
        await page.getByRole('button', { name: ui(c.lang).form.submit }).click();
        await expect(page).toHaveURL(c.thanks);
        expect(page.url()).not.toContain('@');
        await expectOneSalesMail(email);
      });
    }
  });
}

test.describe('ohne JavaScript', () => {
  test.use({ javaScriptEnabled: false });

  test('Eingabefehler: 422 mit der Kontaktseite und den Kopfzeilen der Website, keine Mail', async ({ page }) => {
    const email = uniqueEmail('nojs-422');
    await page.goto('/kontakt/');
    await fill(page, email, 'x'.repeat(201), 'Firma​GmbH');
    const response = page.waitForResponse((r) => new URL(r.url()).pathname === '/api/lead.php' && r.request().method() === 'POST');
    await page.getByRole('button', { name: ui('de').form.submit }).click();
    const r = await response;
    expect(r.status()).toBe(422);
    const h = r.headers();
    expect(h['content-type']).toBe('text/html; charset=utf-8');
    expect(h['content-security-policy']).toContain(SITE_CSP);
    expect(h['x-content-type-options']).toContain('nosniff');
    expect(h['cache-control']).toContain('no-store');
    expect(h['location']).toBeUndefined();
    expect(h['set-cookie']).toBeUndefined();
    await expect(page.locator('#form-summary')).toBeVisible();
    await expect(page.locator('#f-name')).toHaveAttribute('aria-invalid', 'true');
    await expect(page.locator('#f-email')).toHaveValue(email);
    expect(await mailsAbout(email)).toEqual({ toSales: 0, replyTo: 0, toVisitor: 0 });
  });
});
