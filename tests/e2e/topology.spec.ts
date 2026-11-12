import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

const PAGE = '/dev/bausteine/';
const R = '[data-topo][data-lang="de"]';
const result = `${R} .rt-topo-result`;
const chip = (id: string) => `${R} .rt-chip[data-ci="${id}"]`;
const node = (id: string) => `${R} .n[data-id="${id}"]`;

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
});

test('Ausgangszustand: pdu-a ausgefallen, Satz mit Redundanzhinweis', async ({ page }) => {
  await page.goto(PAGE);
  await expect(page.locator(result)).toHaveText('Fällt „pdu-a“ aus, ist 1 weiteres CI betroffen (grau dargestellt). Durch Redundanz geschützt: srv-01, srv-02.');
  await expect(page.locator(`${result} span`)).toHaveText('Durch Redundanz geschützt: srv-01, srv-02.');
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
  await expect(page.locator(`${R} .e[data-from="sw-access-01"]`)).toHaveClass(/is-dim/);
  await expect(page.locator(`${R} .e[data-from="srv-01"][data-to="pdu-a"]`)).not.toHaveClass(/is-dim/);
  await page.locator(chip('pdu-a')).click();
  await expect(page.locator(node('sw-access-01'))).not.toHaveClass(/is-affected/);
  await expect(page.locator(`${R} .e.is-dim`)).toHaveCount(0);
});

test.describe('ohne JavaScript', () => {
test.use({ javaScriptEnabled: false });
test('Knopfgruppe verborgen, Ausgangssatz im HTML, Klassen gesetzt', async ({ page }) => {
  await page.goto(PAGE);
  await expect(page.locator(`${R} .rt-topo-controls`)).toBeHidden();
  await expect(page.locator(result)).toContainText('Fällt „pdu-a“ aus, ist 1 weiteres CI betroffen (grau dargestellt).');
  await expect(page.locator(result)).toContainText('Durch Redundanz geschützt: srv-01, srv-02.');
  await expect(page.locator(node('pdu-a'))).toHaveClass(/is-failed/);
  await expect(page.locator(node('sw-access-01'))).toHaveClass(/is-affected/);
});
});


const durations = (page: Page, sel: string) =>
  page.locator(sel).first().evaluate((e) => getComputedStyle(e).transitionDuration.split(',').map((d) => parseFloat(d)));

for (const sel of [`${R} .dot`, `${R} .e line`, `${R} .rt-chip`])
  test(`Bewegung ${sel}: 0 < Dauer ≤ 0,15 s, bei reduzierter Bewegung 0 s`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.goto(PAGE);
    const on = await durations(page, sel);
    expect(on.length).toBeGreaterThan(0);
    for (const d of on) {
      expect(d).toBeGreaterThan(0);
      expect(d).toBeLessThanOrEqual(0.15);
    }
    await page.emulateMedia({ reducedMotion: 'reduce' });
    for (const d of await durations(page, sel)) expect(d).toBe(0);
  });

/** Löst einen CSS-Farbausdruck (Token oder Systemfarbe) in den berechneten Wert auf. */
const resolver = (page: Page) => (expr: string) =>
  page.evaluate((x) => {
    const el = document.createElement('span');
    el.style.color = x;
    document.body.append(el);
    const c = getComputedStyle(el).color;
    el.remove();
    return c;
  }, expr);
const fill = (page: Page, sel: string) => page.locator(sel).evaluate((e) => getComputedStyle(e).fill);

test('Farben der Punkte stammen aus den Tokens; srv-01 und srv-02 bleiben unmarkiert', async ({ page }) => {
  await page.goto(PAGE);
  const rs = resolver(page);
  await expect(page.locator(node('srv-01'))).not.toHaveClass(/is-(affected|failed)/);
  await expect(page.locator(node('srv-02'))).not.toHaveClass(/is-(affected|failed)/);
  expect(await fill(page, node('pdu-a') + ' .dot')).toBe(await rs('var(--graph-failed)'));
  expect(await fill(page, node('sw-access-01') + ' .dot')).toBe(await rs('var(--line-strong)'));
  for (const id of ['srv-01', 'srv-02', 'usv-01', 'pdu-b'])
    expect(await fill(page, node(id) + ' .dot')).toBe(await rs('var(--graph-active)'));
});

test('Beschriftung einer blassen Kante ist unsichtbar, die anderer Kanten sichtbar', async ({ page }) => {
  await page.goto(PAGE);
  const vis = (sel: string) => page.locator(sel).evaluate((e) => getComputedStyle(e).visibility);
  expect(await vis(`${R} .e.is-dim text`)).toBe('hidden');
  expect(await vis(`${R} .e[data-from="srv-01"][data-to="pdu-a"] text`)).toBe('visible');
});

test('kein Element des Schemas nutzt die Farbe --signal', async ({ page }) => {
  await page.goto(PAGE);
  const signal = await resolver(page)('var(--signal)');
  const hits = await page.locator(`${R}, ${R} *`).evaluateAll((els, sig) => {
    const props = ['color', 'fill', 'stroke', 'backgroundColor', 'borderTopColor', 'outlineColor'] as const;
    return els.flatMap((e) => {
      const s = getComputedStyle(e);
      return props.filter((p) => s[p] === sig).map((p) => `${e.tagName}.${e.getAttribute('class')} ${p}`);
    });
  }, signal);
  expect(hits).toEqual([]);
});

test('Fokusmarke überdeckt keine Beschriftung', async ({ page }) => {
  await page.goto(PAGE);
  const clashes = await page.locator(`${R} .n`).evaluateAll((nodes) => {
    const out: string[] = [];
    for (const n of nodes) {
      const t = n.querySelector('text')!.getBoundingClientRect();
      for (const part of n.querySelectorAll('.focus > *')) {
        const r = part.getBoundingClientRect();
        if (r.left < t.right - 0.5 && r.right > t.left + 0.5 && r.top < t.bottom - 0.5 && r.bottom > t.top + 0.5)
          out.push(n.getAttribute('data-id') ?? '');
      }
    }
    return out;
  });
  expect(clashes).toEqual([]);
});

test.describe('erzwungene Farben', () => {
  test.use({ forcedColors: 'active' });
  test('Zustände bleiben unterscheidbar, Knöpfe haben Rand, Fokus sichtbar, Satz steht', async ({ page }) => {
    await page.goto(PAGE);
    const rs = resolver(page);
    const failed = node('pdu-a') + ' .dot';
    const affected = node('sw-access-01') + ' .dot';
    const plain = node('srv-01') + ' .dot';
    const hl = await rs('Highlight');
    const gray = await rs('GrayText');
    expect(await fill(page, failed)).toBe(hl);
    expect(await fill(page, affected)).toBe(gray);
    expect(await fill(page, plain)).toBe(await rs('CanvasText'));
    expect(hl).not.toBe(gray);
    const width = (sel: string) => page.locator(sel).evaluate((e) => e.getBoundingClientRect().width);
    expect(await width(failed)).toBeGreaterThan(await width(plain));
    const c = page.locator(chip('nas-01'));
    const border = await c.evaluate((e) => { const s = getComputedStyle(e); return { w: parseFloat(s.borderTopWidth), st: s.borderTopStyle, c: s.borderTopColor }; });
    expect(border.st).not.toBe('none');
    expect(border.w).toBeGreaterThan(0);
    expect(border.c).toBe(await rs('ButtonText'));
    await c.focus();
    expect(await c.evaluate((e) => e.matches(':focus-visible'))).toBe(true);
    const o = await c.evaluate((e) => { const s = getComputedStyle(e); return { st: s.outlineStyle, w: parseFloat(s.outlineWidth) }; });
    expect(o.st).not.toBe('none');
    expect(o.w).toBeGreaterThan(0);
    await expect(page.locator(result)).toContainText('Fällt „pdu-a“ aus');
  });
});

test('lang="en": englischer Satz und Redundanzhinweis', async ({ page }) => {
  await page.goto(PAGE);
  const en = page.locator('[data-topo][data-lang="en"]');
  await expect(en.locator('.rt-topo-result')).toHaveText('If “pdu-a” fails, 1 more CI is affected (shown in gray). Protected by redundancy: srv-01, srv-02.');
  await en.locator('.rt-chip[data-ci="pdu-b"]').click();
  await expect(en.locator('.rt-topo-result')).toHaveText('If 2 CIs (pdu-a, pdu-b) fail together, 6 more CIs are affected (shown in gray).');
});

test('Knoten-Knöpfe messen mindestens 44 × 44 px', async ({ page }) => {
  await page.goto(PAGE);
  const boxes = await page.locator('.rt-chip').evaluateAll((els) => els.map((e) => e.getBoundingClientRect()).map((r) => [r.width, r.height]));
  expect(boxes.length).toBe(18);
  for (const [w, h] of boxes) {
    expect(w).toBeGreaterThanOrEqual(43.5);
    expect(h).toBeGreaterThanOrEqual(43.5);
  }
});

test('axe ohne Befunde auf dem Schema', async ({ page }) => {
  await page.goto(PAGE);
  const r = await new AxeBuilder({ page }).include('[data-topo]').analyze();
  expect(r.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`)).toEqual([]);
});
