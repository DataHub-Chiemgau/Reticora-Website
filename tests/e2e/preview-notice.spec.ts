import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

// Der Testserver liefert einen Entwicklungs-Build (npm run build): Der Vorschau-Hinweis ist sichtbar.
// Dass er im Release-Build fehlt, prüfen tests/unit/dist.test.ts und die Release-Sperre (checkPreviewNotice).
for (const [path, text] of [['/', 'Vorschau – Testsystem, nicht öffentlich'], ['/en/', 'Preview – test system, not public']] as const) {
  test(`${path}: Hinweis fest am unteren Rand, ohne Bedienelement, verdeckt nichts`, async ({ page }) => {
    for (const width of [320, 1280]) {
      await page.setViewportSize({ width, height: 700 });
      await page.goto(path);
      const note = page.locator('[data-rt="preview-notice"]');
      await expect(note).toBeVisible();
      await expect(note).toContainText(text);
      expect(await note.locator('button, a, input').count()).toBe(0);
      expect(await note.evaluate((e) => getComputedStyle(e).position)).toBe('fixed');
      // ganz nach unten: Fußzeile endet über dem Hinweis
      await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
      const noteTop = (await note.boundingBox())!.y;
      const footerBottom = await page.locator('footer').last().evaluate((e) => e.getBoundingClientRect().bottom);
      expect(footerBottom, `Breite ${width}`).toBeLessThanOrEqual(noteTop + 1);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
    }
  });

  test(`${path}: axe ohne Verstöße mit Hinweis`, async ({ page }) => {
    await page.goto(path);
    const r = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze();
    expect(r.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(' | ')}`)).toEqual([]);
  });
}
