import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const PAGE = '/dev/bausteine/';
const WIDE = { width: 1280, height: 900 };
const NARROW = { width: 390, height: 800 };

test('axe ohne Befunde, im Thema Leitstand und im Abschnitt data-theme="dokument"', async ({ page }) => {
  await page.setViewportSize(WIDE);
  await page.goto(PAGE);
  const all = await new AxeBuilder({ page }).analyze();
  expect(all.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`)).toEqual([]);
  const doc = await new AxeBuilder({ page }).include('[data-theme="dokument"]').analyze();
  expect(doc.violations.map((v) => v.id)).toEqual([]);
  expect(doc.passes.some((p) => p.id === 'color-contrast')).toBe(true);
  await page.setViewportSize(NARROW);
  const narrow = await new AxeBuilder({ page }).analyze();
  expect(narrow.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`)).toEqual([]);
  await page.locator('details.rt-menu > summary').click();
  await expect(page.locator('.rt-menu-body')).toBeVisible();
  const open = await new AxeBuilder({ page }).analyze();
  expect(open.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`)).toEqual([]);
});

for (const [name, size] of [['breit', WIDE], ['schmal', NARROW]] as const)
  test(`jedes Bedienelement außer .rt-beleg > summary misst mindestens 44 × 44 px (${name})`, async ({ page }) => {
    await page.setViewportSize(size);
    await page.goto(PAGE);
    if (size === NARROW) {
      await page.locator('details.rt-menu > summary').click();
      await expect(page.locator('.rt-menu-body')).toBeVisible();
      expect(await page.locator('.rt-menu-body > a, .rt-menu-body .rt-btn, .rt-menu-body .rt-lang a').evaluateAll((els) => els.filter((e) => e.getBoundingClientRect().width > 0).length)).toBeGreaterThanOrEqual(9);
    }
    const sel = 'a.rt-btn, button, summary:not(.rt-beleg > summary), .rt-nav a, .rt-lang a, .rt-menu-body > a, .rt-footer a';
    expect(await page.locator(sel).count()).toBeGreaterThan(8);
    const small = await page.locator(sel).evaluateAll((els) =>
      els
        .map((e) => ({ e, r: e.getBoundingClientRect(), hidden: (e as HTMLElement).hidden }))
        .filter((x) => x.r.width > 0 && x.r.height > 0 && !x.hidden)
        .filter((x) => x.r.width < 43.5 || x.r.height < 43.5)
        .map((x) => `${x.e.tagName}.${x.e.className} "${x.e.textContent?.trim()}" ${x.r.width.toFixed(1)}×${x.r.height.toFixed(1)}`),
    );
    expect(small).toEqual([]);
  });

test('Beleg-Marke misst mindestens 24 px in der Höhe', async ({ page }) => {
  await page.goto(PAGE);
  const hs = await page.locator('.rt-beleg > summary').evaluateAll((els) => els.map((e) => e.getBoundingClientRect().height));
  expect(hs.length).toBeGreaterThan(0);
  for (const h of hs) expect(h).toBeGreaterThanOrEqual(23.5);
});

test('Menü und Beleg öffnen und schließen per Tastatur', async ({ page }) => {
  await page.setViewportSize(NARROW);
  await page.goto(PAGE);
  const menu = page.locator('details.rt-menu');
  const menuSummary = menu.locator('summary');
  await expect(menu).not.toHaveAttribute('open', '');
  await menuSummary.focus();
  await page.keyboard.press('Enter');
  await expect(menu).toHaveAttribute('open', '');
  await page.keyboard.press('Enter');
  await expect(menu).not.toHaveAttribute('open', '');

  const beleg = page.locator('details.rt-beleg').first();
  const belegSummary = beleg.locator('summary');
  await expect(beleg).not.toHaveAttribute('open', '');
  await belegSummary.focus();
  await page.keyboard.press('Enter');
  await expect(beleg).toHaveAttribute('open', '');
  await expect(beleg.locator('.rt-beleg-body')).toBeVisible();
  await page.keyboard.press('Enter');
  await expect(beleg).not.toHaveAttribute('open', '');
});

test('Navigation steht ab 1120 px in der Kopfzeile, darunter im Menü', async ({ page }) => {
  await page.setViewportSize(WIDE);
  await page.goto(PAGE);
  await expect(page.locator('.rt-header .rt-nav')).toBeVisible();
  await expect(page.locator('details.rt-menu')).toBeHidden();
  await page.setViewportSize(NARROW);
  await expect(page.locator('.rt-header')).toBeHidden();
  await expect(page.locator('details.rt-menu')).toBeVisible();
});

test('Navigationsumbruch genau bei 1120 px', async ({ page }) => {
  await page.goto(PAGE);
  await page.setViewportSize({ width: 1119, height: 800 });
  await expect(page.locator('.rt-header')).toBeHidden();
  await expect(page.locator('details.rt-menu')).toBeVisible();
  await page.setViewportSize({ width: 1120, height: 800 });
  await expect(page.locator('.rt-header')).toBeVisible();
  await expect(page.locator('details.rt-menu')).toBeHidden();
});

test('Menü beginnt mit dem Link zur Startseite', async ({ page }) => {
  await page.setViewportSize(NARROW);
  await page.goto(PAGE);
  await page.locator('details.rt-menu > summary').click();
  const first = page.locator('.rt-menu-body > a').first();
  await expect(first).toHaveText('Startseite');
  await expect(first).toHaveAttribute('href', '/');
});

test('Kopierknopf meldet „Kopieren nicht möglich“, wenn die Zwischenablage ablehnt', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'clipboard', { value: { writeText: () => Promise.reject(new Error('no')) } });
  });
  await page.goto(PAGE);
  const sample = page.locator('.rt-code');
  await sample.getByRole('button', { name: 'Kopieren' }).click();
  await expect(sample.getByRole('status')).toHaveText('Kopieren nicht möglich');
});

test('Kopierknopf kopiert den Code und meldet „Kopiert“', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto(PAGE);
  const sample = page.locator('.rt-code');
  const button = sample.getByRole('button', { name: 'Kopieren' });
  await expect(button).toBeVisible();
  const expected = (await sample.locator('code').textContent())!;
  await button.click();
  await expect(sample.getByRole('status')).toHaveText('Kopiert');
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(expected);
});

test('Kopierknopf ist ohne JavaScript ausgeblendet', async ({ browser }) => {
  const ctx = await browser.newContext({ javaScriptEnabled: false });
  const page = await ctx.newPage();
  await page.goto(PAGE);
  await expect(page.locator('.rt-code button')).toBeHidden();
  await expect(page.locator('.rt-code pre')).toBeVisible();
  await ctx.close();
});

test('erzwungene Farben: Knöpfe haben einen 1 px breiten Rand, der Fokus bleibt sichtbar', async ({ page }) => {
  await page.setViewportSize(WIDE);
  await page.emulateMedia({ forcedColors: 'active' });
  await page.goto(PAGE);
  const widths = await page.locator('.rt-btn:visible').evaluateAll((els) => els.map((e) => getComputedStyle(e).borderTopWidth));
  expect(widths.length).toBeGreaterThan(3);
  for (const w of widths) expect(w).toBe('1px');
  const primary = page.locator('.rt-btn--primary:visible').first();
  const { color, buttonText } = await primary.evaluate((e) => {
    const probe = document.createElement('i');
    probe.style.color = 'ButtonText';
    document.body.append(probe);
    const buttonText = getComputedStyle(probe).color;
    probe.remove();
    return { color: getComputedStyle(e).borderTopColor, buttonText };
  });
  expect(color).toBe(buttonText);
  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');
  const focus = await page.evaluate(() => {
    const cs = getComputedStyle(document.activeElement!);
    return { style: cs.outlineStyle, width: cs.outlineWidth };
  });
  expect(focus.style).not.toBe('none');
  expect(focus.width).toBe('2px');
});

test('Fokus: 2 px Umriss in accent mit 2 px Abstand', async ({ page }) => {
  await page.setViewportSize(WIDE);
  await page.goto(PAGE);
  const link = page.locator('.rt-header .rt-btn--primary');
  await link.focus();
  await page.keyboard.press('Shift+Tab');
  await page.keyboard.press('Tab');
  const o = await link.evaluate((e) => {
    const cs = getComputedStyle(e);
    const probe = document.createElement('i');
    probe.style.color = 'var(--accent)';
    document.body.append(probe);
    const accent = getComputedStyle(probe).color;
    probe.remove();
    return { w: cs.outlineWidth, off: cs.outlineOffset, c: cs.outlineColor, accent };
  });
  expect(o.w).toBe('2px');
  expect(o.off).toBe('2px');
  expect(o.c).toBe(o.accent);
});

test('ScreenshotSlot zeigt ID, Motiv und Zielmaß und hat das Seitenverhältnis des Manifests', async ({ page }) => {
  await page.goto(PAGE);
  const cases = [
    { id: 'S-06', motif: 'Ausfallsimulation', dims: '1440 × 900', ratio: 1440 / 900 },
    { id: 'S-05', motif: 'Rack, Vorderseite', dims: '720 × 900', ratio: 720 / 900 },
  ];
  for (const c of cases) {
    const fig = page.locator('figure.rt-figure', { hasText: c.id });
    await expect(fig.locator('.rt-slot-label b')).toHaveText(c.id);
    await expect(fig.locator('.rt-slot-label')).toContainText(c.motif);
    await expect(fig.locator('.rt-slot-label small')).toContainText('Platzhalter für Screenshot');
    await expect(fig.locator('.rt-slot-label small')).toContainText(c.dims);
    const box = (await fig.locator('.rt-slot').boundingBox())!;
    expect(Math.abs(box.width / box.height - c.ratio)).toBeLessThan(0.02);
  }
});

test('aktive Navigation trägt aria-current="page"; die aktive Sprache ist kein Link', async ({ page }) => {
  await page.setViewportSize(WIDE);
  await page.goto(PAGE);
  const nav = page.locator('.rt-header').getByRole('navigation', { name: 'Hauptnavigation', exact: true });
  await expect(nav.locator('a[aria-current="page"]')).toHaveCount(1);
  await expect(nav.locator('a[aria-current="page"]')).toHaveText('Produkt');
  const lang = page.locator('.rt-header .rt-lang');
  await expect(lang.locator('span[aria-current="true"]')).toHaveText('DE');
  await expect(lang.getByRole('link', { name: 'DE' })).toHaveCount(0);
  const en = lang.getByRole('link', { name: 'EN' });
  await expect(en).toHaveAttribute('href', '/en/');
  await expect(en).toHaveAttribute('lang', 'en');
  await expect(en).toHaveAttribute('hreflang', 'en');
});

test('Kopfzeile verlinkt die drei Handlungen, Fußzeile die Pflichtlinks', async ({ page }) => {
  await page.setViewportSize(WIDE);
  await page.goto(PAGE);
  const head = page.locator('.rt-header');
  await expect(head.getByRole('link', { name: 'Anmelden' })).toHaveAttribute('href', 'https://www.reticora.cloud/login');
  await expect(head.getByRole('link', { name: 'Live-Demo' })).toHaveAttribute('href', '/demo/');
  await expect(head.getByRole('link', { name: '30 Tage testen' })).toHaveAttribute('href', 'https://www.reticora.cloud/onboarding');
  const foot = page.locator('footer.rt-footer');
  await expect(foot.getByRole('link', { name: 'Impressum' })).toHaveAttribute('href', '/impressum/');
  await expect(foot.getByRole('link', { name: 'Datenschutz' })).toHaveAttribute('href', '/datenschutz/');
  await expect(foot.getByRole('link', { name: 'AGB' })).toHaveAttribute('href', '/agb/');
  await expect(foot).toContainText('Angebot nur für Unternehmen');
});

test('Beleg zeigt Titel und Beleg, nie den internen Vermerk', async ({ page }) => {
  await page.goto(PAGE);
  const beleg = page.locator('#beleg-absatz details.rt-beleg');
  await beleg.locator('summary').click();
  const body = beleg.locator('.rt-beleg-body');
  await expect(body.locator('b')).toHaveText('Datenhaltung in der EU');
  await expect(body).toContainText('Stand:');
  const html = await page.content();
  expect(html).not.toContain('vom Betreiber bestätigen');
  expect(html).not.toContain('F-10');
});

test('Beleg steht in der Zeile am Ende seines Satzes; kein leerer Absatz entsteht', async ({ page }) => {
  for (const size of [WIDE, NARROW]) {
    await page.setViewportSize(size);
    await page.goto(PAGE);
    const para = page.locator('#beleg-absatz');
    await expect(para).toHaveAttribute('role', 'paragraph');
    const m = await para.evaluate((el) => {
      const marker = el.querySelector('summary')!.getBoundingClientRect();
      const text = el.firstChild!;
      const range = document.createRange();
      range.setStart(text, text.textContent!.length - 1);
      range.setEnd(text, text.textContent!.length);
      const last = range.getBoundingClientRect();
      return { marker: marker.top, last: last.top, line: parseFloat(getComputedStyle(el).lineHeight) };
    });
    expect(Math.abs(m.marker - m.last)).toBeLessThan(m.line);
    expect(await page.locator('main p:empty').count()).toBe(0);
    expect(await page.locator('p details').count()).toBe(0);
  }
});

test('Entwicklungsseite ist noindex', async ({ page }) => {
  await page.goto(PAGE);
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex');
});
