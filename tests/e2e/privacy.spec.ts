import { expect, test } from '@playwright/test';

test('Startseite: keine fremden Hosts, keine Cookies, leerer Web Storage', async ({ page, context }) => {
  const hosts = new Set<string>();
  page.on('request', (r) => {
    const u = new URL(r.url());
    if (u.protocol.startsWith('http')) hosts.add(u.host);
  });
  await page.goto('/');
  await page.evaluate(() => document.fonts.ready);
  expect([...hosts]).toEqual(['127.0.0.1:8080']);
  expect(await context.cookies()).toEqual([]);
  const storage = await page.evaluate(() => ({ l: localStorage.length, s: sessionStorage.length }));
  expect(storage).toEqual({ l: 0, s: 0 });
});
