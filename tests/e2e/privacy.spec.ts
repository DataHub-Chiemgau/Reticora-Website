/**
 * Datenschutz (Prüfprotokoll DS-01, Matrix T-01): auf jeder gebauten Seite beider Sprachen, auf beiden 404-Seiten und auf der
 * Fehlerseite des Servers (422, Absenden ohne JavaScript) – in Chromium, Firefox und WebKit (die CI startet alle drei):
 * keine Anfrage an fremde Hosts (auch abgebrochene), kein Set-Cookie, keine Cookies, kein Web Storage, keine IndexedDB,
 * kein Cache Storage, kein Service Worker, keine CSP-Verstöße.
 */
import { expect, test, type BrowserContext, type Page } from '@playwright/test';
import { ROUTES, isBuilt } from '../../src/i18n';

const PAGES = ROUTES.flatMap((r) => [r.de, r.en]).filter((p) => isBuilt(p));

/** Beobachtet alles, was die Seite lädt, bevor sie geöffnet wird. */
function watch(page: Page) {
  const hosts = new Set<string>();
  const cookies: string[] = [];
  const note = (url: string) => {
    const u = new URL(url);
    if (u.protocol.startsWith('http')) hosts.add(u.host);
  };
  page.on('request', (r) => note(r.url()));
  page.on('requestfailed', (r) => note(r.url()));
  page.on('response', async (r) => {
    const set = await r.headerValue('set-cookie').catch(() => null);
    if (set) cookies.push(`${r.url()}: ${set}`);
  });
  return { hosts, cookies };
}

async function cspWatch(page: Page) {
  await page.addInitScript(() => {
    (window as unknown as { __csp: string[] }).__csp = [];
    document.addEventListener('securitypolicyviolation', (e) => (window as unknown as { __csp: string[] }).__csp.push(`${e.violatedDirective} ${e.blockedURI}`));
  });
}

/** Zustand im Browser nach dem Laden. indexedDB.databases() fehlt in älteren Browsern; dann zählt der Vermerk. */
async function expectNothingStored(page: Page, context: BrowserContext, w: ReturnType<typeof watch>, baseURL: string, label: string) {
  await page.waitForLoadState('networkidle');
  await page.evaluate(() => document.fonts.ready);
  expect([...w.hosts], `${label}: Hosts`).toEqual([new URL(baseURL).host]);
  expect(w.cookies, `${label}: Set-Cookie`).toEqual([]);
  expect(await context.cookies(), `${label}: Cookies`).toEqual([]);
  expect(await page.evaluate(() => (window as unknown as { __csp: string[] }).__csp), `${label}: CSP-Verstöße`).toEqual([]);
  const state = await page.evaluate(async () => {
    const idb = typeof indexedDB.databases === 'function' ? (await indexedDB.databases()).length : 'nicht prüfbar';
    const sw = 'serviceWorker' in navigator ? (await navigator.serviceWorker.getRegistrations()).length : 0;
    return {
      local: localStorage.length,
      session: sessionStorage.length,
      idb,
      caches: 'caches' in window ? (await caches.keys()).length : 0,
      serviceWorker: sw,
      controlled: 'serviceWorker' in navigator && navigator.serviceWorker.controller !== null,
    };
  });
  if (state.idb === 'nicht prüfbar') test.info().annotations.push({ type: 'nicht geprüft', description: `${label}: indexedDB.databases() fehlt in diesem Browser` });
  expect({ ...state, idb: state.idb === 'nicht prüfbar' ? 0 : state.idb }, label).toEqual({ local: 0, session: 0, idb: 0, caches: 0, serviceWorker: 0, controlled: false });
}

test('es gibt gebaute Seiten in beiden Sprachen', () => {
  expect(PAGES.filter((p) => p.startsWith('/en/')).length).toBeGreaterThan(0);
  expect(PAGES.filter((p) => !p.startsWith('/en/')).length).toBeGreaterThan(0);
});

for (const path of [...PAGES, '/gibt-es-nicht/', '/en/does-not-exist/'])
  test(`${path}: keine fremden Hosts, keine Cookies, kein Speicher, kein Service Worker`, async ({ page, context, baseURL }) => {
    const w = watch(page);
    await cspWatch(page);
    const r = await page.goto(path, { waitUntil: 'networkidle' });
    expect(r?.status()).toBe(path.includes('gibt-es-nicht') || path.includes('does-not-exist') ? 404 : 200);
    await expectNothingStored(page, context, w, baseURL!, path);
  });

test('Fehlerseite des Servers (422, Absenden ohne JavaScript): keine fremden Hosts, keine Cookies, kein Speicher', async ({ page, context, baseURL }) => {
  await page.goto('/kontakt/', { waitUntil: 'networkidle' });
  const w = watch(page);
  await cspWatch(page);
  await page.locator('#f-name').fill('Erika Beispiel');
  await page.locator('#f-email').fill('keine-adresse');
  const response = page.waitForResponse((x) => x.url().endsWith('/api/lead.php') && x.request().method() === 'POST');
  await page.locator('form[data-lead]').evaluate((f: HTMLFormElement) => f.submit());
  expect((await response).status()).toBe(422);
  await expect(page.locator('#form-summary')).toBeVisible();
  await expectNothingStored(page, context, w, baseURL!, '422');
});
