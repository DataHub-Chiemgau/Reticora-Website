import { expect, test } from '@playwright/test';

test('display-xl misst 36 px bei 360 und 72 px bei 1280', async ({ page }) => {
  for (const [width, size] of [[360, 36], [1280, 72]] as const) {
    await page.setViewportSize({ width, height: 800 });
    await page.goto('/');
    const fs = await page.locator('h1').evaluate((e) => parseFloat(getComputedStyle(e).fontSize));
    expect(Math.abs(fs - size)).toBeLessThanOrEqual(0.5);
  }
});

test('Archivo lädt vom eigenen Host mit Hash im Namen', async ({ page }) => {
  const urls: string[] = [];
  page.on('response', (r) => urls.push(r.url()));
  await page.goto('/');
  await page.evaluate(() => document.fonts.ready);
  expect(urls.some((u) => /^http:\/\/127\.0\.0\.1:8080\/_astro\/archivo-leitstand\.[\w-]+\.woff2$/.test(u))).toBe(true);
});

test('html trägt lang="de" und data-theme="leitstand"; genau eine h1', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('lang', 'de');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'leitstand');
  await expect(page.locator('h1')).toHaveCount(1);
});

test('Sprunglink ist das erste fokussierbare Element und führt zu #inhalt', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press('Tab');
  const link = page.getByRole('link', { name: 'Zum Inhalt' });
  await expect(link).toBeFocused();
  await expect(link).toHaveAttribute('href', '#inhalt');
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/#inhalt$/);
});

test('ohne Schriftdateien bleibt die h1 sichtbar', async ({ page }) => {
  await page.route('**/*.woff2', (r) => r.abort());
  await page.goto('/');
  const h1 = page.locator('h1');
  await expect(h1).toBeVisible();
  const m = await h1.evaluate((e) => {
    const range = document.createRange();
    range.selectNodeContents(e.firstChild!);
    const r = range.getBoundingClientRect();
    const cs = getComputedStyle(e);
    return { w: r.width, h: r.height, visibility: cs.visibility, opacity: cs.opacity };
  });
  expect(m.w).toBeGreaterThan(0);
  expect(m.h).toBeGreaterThan(0);
  expect(m.visibility).toBe('visible');
  expect(m.opacity).toBe('1');
});
