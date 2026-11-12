import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const PAGE = '/dev/bausteine/';
const result = '.rt-topo-result';
const chip = (id: string) => `.rt-chip[data-ci="${id}"]`;
const node = (id: string) => `.rt-topo .n[data-id="${id}"]`;

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
});

test('Ausgangszustand: pdu-a ausgefallen, Satz mit Redundanzhinweis', async ({ page }) => {
  await page.goto(PAGE);
  await expect(page.locator(result)).toHaveText('Fällt „pdu-a“ aus, ist 1 weiteres CI betroffen (grau dargestellt). Durch Redundanz geschützt: srv-01, srv-02.');
  await expect(page.locator(result + ' span')).toHaveText('Durch Redundanz geschützt: srv-01, srv-02.');
  await expect(page.locator(chip('pdu-a'))).toHaveAttribute('aria-pressed', 'true');
});

test('pdu-b dazu: zwei CIs gemeinsam, 6 weitere betroffen', async ({ page }) => {
  await page.goto(PAGE);
  await page.locator(chip('pdu-b')).click();
  await expect(page.locator(result)).toHaveText('Fallen 2 CIs (pdu-a, pdu-b) gemeinsam aus, sind 6 weitere CIs betroffen (grau dargestellt).');
});

test('usv-01 allein: 8 betroffen; vm-db-01 allein: keines; nichts gewählt: Aufforderung', async ({ page }) => {
  await page.goto(PAGE);
  await page.locator(chip('pdu-a')).click();
  await page.locator(chip('usv-01')).click();
  await expect(page.locator(result)).toHaveText('Fällt „usv-01“ aus, sind 8 weitere CIs betroffen (grau dargestellt).');
  await page.locator(chip('usv-01')).click();
  await expect(page.locator(result)).toHaveText('Wählen Sie ein CI, um seinen Ausfall zu simulieren.');
  await page.locator(chip('vm-db-01')).click();
  await expect(page.locator(result)).toHaveText('Fällt „vm-db-01“ aus, ist kein weiteres CI betroffen.');
});

test('Klick auf einen Punkt wirkt wie der Knopf', async ({ page }) => {
  await page.goto(PAGE);
  await page.locator(node('pdu-b') + ' .dot').click();
  await expect(page.locator(chip('pdu-b'))).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator(node('pdu-b'))).toHaveClass(/is-failed/);
  await page.locator(node('pdu-b') + ' .dot').click();
  await expect(page.locator(chip('pdu-b'))).toHaveAttribute('aria-pressed', 'false');
});

test('Leertaste schaltet aria-pressed; der Punkt des fokussierten Knopfs trägt .is-focus', async ({ page }) => {
  await page.goto(PAGE);
  await page.locator(chip('srv-01')).focus();
  await expect(page.locator(node('srv-01'))).toHaveClass(/is-focus/);
  await page.keyboard.press('Space');
  await expect(page.locator(chip('srv-01'))).toHaveAttribute('aria-pressed', 'true');
  await page.locator(chip('srv-02')).focus();
  await expect(page.locator(node('srv-01'))).not.toHaveClass(/is-focus/);
  await expect(page.locator(node('srv-02'))).toHaveClass(/is-focus/);
});

test('betroffene Knoten tragen .is-affected, ihre Kanten .is-dim; ausgefallene .is-failed', async ({ page }) => {
  await page.goto(PAGE);
  await expect(page.locator(node('pdu-a'))).toHaveClass(/is-failed/);
  await expect(page.locator(node('sw-access-01'))).toHaveClass(/is-affected/);
  await expect(page.locator('.rt-topo .e[data-from="sw-access-01"]')).toHaveClass(/is-dim/);
  await expect(page.locator('.rt-topo .e[data-from="srv-01"][data-to="pdu-a"]')).not.toHaveClass(/is-dim/);
  await page.locator(chip('pdu-a')).click();
  await expect(page.locator(node('sw-access-01'))).not.toHaveClass(/is-affected/);
  await expect(page.locator('.rt-topo .e.is-dim')).toHaveCount(0);
});

test('ohne JavaScript: Knopfgruppe verborgen, Ausgangssatz im HTML, Klassen gesetzt', async ({ browser }) => {
  const ctx = await browser.newContext({ javaScriptEnabled: false, baseURL: 'http://127.0.0.1:8080' });
  const page = await ctx.newPage();
  await page.goto(PAGE);
  await expect(page.locator('.rt-topo-controls')).toBeHidden();
  await expect(page.locator(result)).toContainText('Fällt „pdu-a“ aus, ist 1 weiteres CI betroffen (grau dargestellt).');
  await expect(page.locator(result)).toContainText('Durch Redundanz geschützt: srv-01, srv-02.');
  await expect(page.locator(node('pdu-a'))).toHaveClass(/is-failed/);
  await expect(page.locator(node('sw-access-01'))).toHaveClass(/is-affected/);
  await ctx.close();
});

test('reduzierte Bewegung: transition-duration der Punkte ist 0s', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(PAGE);
  const d = await page.locator('.rt-topo .dot').first().evaluate((e) => getComputedStyle(e).transitionDuration);
  expect(d).toBe('0s');
});

test('erzwungene Farben: Knoten-Knöpfe haben sichtbaren Rand, Fokus bleibt sichtbar', async ({ page }) => {
  await page.emulateMedia({ forcedColors: 'active' });
  await page.goto(PAGE);
  const c = page.locator(chip('nas-01'));
  const border = await c.evaluate((e) => {
    const s = getComputedStyle(e);
    return { w: parseFloat(s.borderTopWidth), style: s.borderTopStyle };
  });
  expect(border.style).not.toBe('none');
  expect(border.w).toBeGreaterThan(0);
  await page.keyboard.press('Tab');
  await c.focus();
  await page.keyboard.press('Shift+Tab');
  await page.keyboard.press('Tab');
  const outline = await c.evaluate((e) => {
    const s = getComputedStyle(e);
    return { style: s.outlineStyle, w: parseFloat(s.outlineWidth) };
  });
  expect(outline.style).not.toBe('none');
  expect(outline.w).toBeGreaterThan(0);
});

test('Knoten-Knöpfe messen mindestens 44 × 44 px', async ({ page }) => {
  await page.goto(PAGE);
  const boxes = await page.locator('.rt-chip').evaluateAll((els) => els.map((e) => e.getBoundingClientRect()).map((r) => [r.width, r.height]));
  expect(boxes.length).toBe(9);
  for (const [w, h] of boxes) {
    expect(w).toBeGreaterThanOrEqual(43.5);
    expect(h).toBeGreaterThanOrEqual(43.5);
  }
});

test('axe ohne Befunde auf dem Schema', async ({ page }) => {
  await page.goto(PAGE);
  const r = await new AxeBuilder({ page }).include('.rt-topo').analyze();
  expect(r.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`)).toEqual([]);
});
