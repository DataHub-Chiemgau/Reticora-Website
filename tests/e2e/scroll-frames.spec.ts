/**
 * Barrierefreiheit H-1: Scrollrahmen (Tabellen, Schemata, Code) sind nur dann ein Tab-Halt, wenn sie wirklich scrollen.
 * Ohne JavaScript bleiben sie immer fokussierbar (sonst wären sie per Tastatur nicht scrollbar). Mit JavaScript passt eine
 * kleine Hilfe in den vorhandenen Inseln (impact, filter, copy) tabindex an die Breite an. Seiten ohne Insel (z. B. Preise)
 * behalten tabindex="0"; dort bräuchte es eine neue Insel (Spec §5: JavaScript nur in Inseln), offen für Phase 8.
 */
import { expect, test } from '@playwright/test';

const frame = (sel: string) => `${sel}[data-scroll-frame]`;
const CASES = [
  { path: '/geraete/', sel: '.rt-table-wrap' },
  { path: '/produkt/topologie-impact/', sel: '.rt-topo-frame' },
  { path: '/', sel: '.rt-schema-frame' },
] as const;

for (const c of CASES)
  test(`${c.path} ${c.sel}: Tab-Halt nur bei Überlauf, folgt der Fensterbreite`, async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(c.path);
    const f = page.locator(frame(c.sel)).first();
    await expect(f).not.toHaveAttribute('tabindex');
    await page.setViewportSize({ width: 390, height: 800 });
    await expect(f).toHaveAttribute('tabindex', '0');
    expect(await f.evaluate((e) => e.scrollWidth > e.clientWidth + 1)).toBe(true);
    await page.setViewportSize({ width: 1280, height: 900 });
    await expect(f).not.toHaveAttribute('tabindex');
  });

test('Code, der auch breit scrollt, bleibt ein Tab-Halt', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/produkt/api/');
  const pre = page.locator(frame('pre')).first();
  expect(await pre.evaluate((e) => e.scrollWidth > e.clientWidth + 1)).toBe(true);
  await expect(pre).toHaveAttribute('tabindex', '0');
});

test('ohne JavaScript bleibt jeder Scrollrahmen fokussierbar', async ({ browser }) => {
  const ctx = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();
  for (const c of CASES) {
    await page.goto(c.path);
    await expect(page.locator(frame(c.sel)).first(), c.path).toHaveAttribute('tabindex', '0');
  }
  await ctx.close();
});

test('jeder Scrollrahmen trägt data-scroll-frame und ohne JavaScript tabindex="0"', async ({ page }) => {
  for (const path of ['/', '/preise/', '/sicherheit/', '/produkt/discovery/', '/produkt/api/', '/geraete/']) {
    await page.goto(path);
    const bad = await page.evaluate(() =>
      [...document.querySelectorAll('.rt-table-wrap, .rt-topo-frame, .rt-schema-frame, .rt-code pre')].filter((e) => !e.hasAttribute('data-scroll-frame')).map((e) => e.className || e.tagName),
    );
    expect(bad, path).toEqual([]);
  }
});
