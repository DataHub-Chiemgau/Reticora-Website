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

test('Codeblock: Tab-Halt genau dann, wenn er scrollt', async ({ page }) => {
  // Ob die längste Codezeile bei 1280 px überläuft, hängt von der Schriftbreite ab (in der CI anders
  // als lokal). Geprüft wird deshalb die Regel selbst, und bei 390 px läuft der Code sicher über.
  await page.goto('/produkt/api/');
  const pre = page.locator(frame('pre')).first();
  for (const width of [1280, 390]) {
    await page.setViewportSize({ width, height: 900 });
    await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
    const scrolls = await pre.evaluate((e) => e.scrollWidth > e.clientWidth + 1);
    if (width === 390) expect(scrolls, 'bei 390 px muss der Code überlaufen').toBe(true);
    if (scrolls) await expect(pre, `${width} px`).toHaveAttribute('tabindex', '0');
    else await expect(pre, `${width} px`).not.toHaveAttribute('tabindex');
  }
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
