import { expect, test } from '@playwright/test';

test('Startseite: keine fremden Hosts, keine Cookies, leerer Web Storage', async ({ page, context, baseURL }) => {
  const hosts = new Set<string>();
  const note = (url: string) => {
    const u = new URL(url);
    if (u.protocol.startsWith('http')) hosts.add(u.host);
  };
  page.on('request', (r) => note(r.url()));
  page.on('requestfailed', (r) => note(r.url()));
  await page.addInitScript(() => {
    (window as any).__csp = [];
    document.addEventListener('securitypolicyviolation', (e) => (window as any).__csp.push(`${e.violatedDirective} ${e.blockedURI}`));
  });
  await page.goto('/', { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  expect([...hosts]).toEqual([new URL(baseURL!).host]);
  expect(await page.evaluate(() => (window as any).__csp)).toEqual([]);
  expect(await context.cookies()).toEqual([]);
  const state = await page.evaluate(async () => ({
    local: localStorage.length,
    session: sessionStorage.length,
    idb: (await indexedDB.databases()).length,
    caches: (await caches.keys()).length,
  }));
  expect(state).toEqual({ local: 0, session: 0, idb: 0, caches: 0 });
});
