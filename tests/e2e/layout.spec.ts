import { readFileSync } from 'node:fs';
import { expect, test } from '@playwright/test';
import { ROUTES, isBuilt } from '../../src/i18n';

const PAGES = ROUTES.map((r) => r.de).filter((p) => isBuilt(p));

/** Breite Tabellen: entweder ganz im Bild oder in einem Scrollrahmen, dessen Hinweis sichtbar ist (Fix-Welle B, Punkt 2). */
test.describe('Tabellen bei 360 px', () => {
  for (const path of PAGES)
    test(`${path}: jede Tabelle passt oder hat einen sichtbaren Scrollhinweis`, async ({ page }) => {
      await page.setViewportSize({ width: 360, height: 800 });
      await page.goto(path);
      await page.evaluate(() => document.fonts.ready);
      const report = await page.locator('main table').evaluateAll((tables) =>
        tables.map((t) => {
          const r = t.getBoundingClientRect();
          const frame = t.closest('.rt-table-wrap') as HTMLElement | null;
          const hint = frame?.previousElementSibling?.classList.contains('rt-table-hint') ? (frame.previousElementSibling as HTMLElement) : null;
          return {
            label: frame?.getAttribute('aria-label') ?? t.getAttribute('aria-label') ?? '(ohne Namen)',
            fits: r.left >= -0.5 && r.right <= 360.5,
            scrolls: !!frame && frame.scrollWidth > frame.clientWidth,
            focusable: frame?.getAttribute('tabindex') === '0',
            hint: !!hint && getComputedStyle(hint).display !== 'none',
          };
        }),
      );
      for (const t of report) {
        // Passt die Tabelle, kann der Rahmen nicht scrollen; sonst muss er fokussierbar sein und seinen Hinweis zeigen.
        expect(t.fits || (t.scrolls && t.focusable && t.hint), JSON.stringify(t)).toBe(true);
      }
    });

  test('die Tabellen, die bisher ohne Hinweis abgeschnitten waren, sind jetzt gestapelt und ganz im Bild', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    for (const [path, label] of [
      ['/produkt/datenqualitaet/', 'Die fünf Schlüssel zur Geräteerkennung'],
      ['/produkt/datenqualitaet/', 'Drei typische Fälle in der Review-Inbox'],
      ['/produkt/topologie-impact/', null],
      ['/sicherheit/', 'Betriebsmodelle nach Paket'],
      ['/barrierefreiheit/', 'Kontrastverhältnisse nach Farbthema'],
    ] as const) {
      await page.goto(path);
      const table = label ? page.locator(`.rt-table-wrap[aria-label="${label}"] table`) : page.locator('main .rt-table--stack');
      const box = await table.first().boundingBox();
      expect(box, `${path} ${label}`).not.toBeNull();
      expect(box!.x + box!.width, `${path} ${label}`).toBeLessThanOrEqual(360.5);
      await expect(table.first().locator('td').first()).toHaveAttribute('data-label', /.+/);
    }
  });

  test('ab 768 px bleibt die Tabelle eine Tabelle (Zellen nebeneinander)', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 900 });
    await page.goto('/barrierefreiheit/');
    expect(await page.locator('main table').evaluate((t) => getComputedStyle(t).display)).toBe('table');
    const frame = page.locator('.rt-table-wrap');
    expect(await frame.evaluate((e) => e.scrollWidth <= e.clientWidth)).toBe(true);
  });
});

test.describe('Hero ohne automatische Silbentrennung', () => {
  test('/sicherheit/ bei 1280 px: „Informationssicherheit“ steht in einer Zeile', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/sicherheit/');
    await page.evaluate(() => document.fonts.ready);
    const info = await page.locator('h1').evaluate((h) => {
      const text = h.firstChild as Text;
      const i = text.data.indexOf('Informations');
      const j = text.data.indexOf('sicherheit', i) + 'sicherheit'.length;
      const range = document.createRange();
      range.setStart(text, i);
      range.setEnd(text, j);
      return { hyphens: getComputedStyle(h).hyphens, rects: [...range.getClientRects()].length, text: h.textContent };
    });
    expect(info.hyphens).not.toBe('auto');
    expect(info.rects).toBe(1);
    expect(info.text!.replace(/­/g, '')).toBe('Was Ihre Informationssicherheit wissen will.');
  });

  test('der sichtbare Text bleibt gleich, die Trennstellen stehen als weiche Trennstriche im Text', async ({ page }) => {
    await page.goto('/sicherheit/');
    expect(await page.locator('h1').textContent()).toContain('Informations­sicherheit');
    expect(await page.title()).not.toContain('­');
    await page.goto('/barrierefreiheit/');
    expect(await page.locator('h1').textContent()).toContain('Barriere­frei­heit');
  });
});

test.describe('Dokumentlayout: Rechtsseiten und Barrierefreiheit', () => {
  for (const path of ['/impressum/', '/datenschutz/', '/agb/', '/subprozessoren/', '/barrierefreiheit/'])
    test(`${path}: Überschrift, Stand-Zeile und Textspalte stehen an derselben linken Kante`, async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 900 });
      await page.goto(path);
      const left = (sel: string) => page.locator(sel).first().evaluate((e) => Math.round(e.getBoundingClientRect().left));
      const h1 = await left('h1');
      expect(await left('.page-hero .legal-meta')).toBe(h1);
      const body = path === '/barrierefreiheit/' ? 'main .legal-list' : path === '/impressum/' ? 'main .legal-stack .home-defs' : 'main .legal-stack';
      expect(await left(body)).toBe(h1);
      await expect(page.locator('.page-hero .legal-meta')).toContainText('Stand:');
    });

  test('Impressum und Barrierefreiheit setzen den Fließtext gleich', async ({ page }) => {
    await page.goto('/impressum/');
    const imp = await page.locator('.legal .home-defs dd').first().evaluate((e) => [getComputedStyle(e).fontSize, getComputedStyle(e).color]);
    await page.goto('/barrierefreiheit/');
    const bf = await page.locator('.legal-list li').first().evaluate((e) => [getComputedStyle(e).fontSize, getComputedStyle(e).color]);
    expect(imp).toEqual(bf);
  });
});

test.describe('Produktseiten', () => {
  test('Datenqualität: die Rangtabelle steht in voller Breite unter ihrem Text, ohne leere Fläche daneben', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/produkt/datenqualitaet/');
    const sec = page.locator('#quelle-gewinnt');
    const text = await sec.locator('.home-block').first().boundingBox();
    const frame = await sec.locator('.rt-table-wrap').boundingBox();
    const container = await sec.locator('.rt-container').boundingBox();
    expect(frame!.y).toBeGreaterThan(text!.y + text!.height - 1);
    expect(frame!.width).toBeGreaterThan(container!.width - 50);
  });

  test('bei 360 px steht „Kontakt“ im Abschlussband bündig, auch wenn der Knopf umbricht', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    for (const path of ['/geraete/', '/preise/']) {
      await page.goto(path);
      const btns = page.locator('#abschluss .rt-btn');
      const boxes = await btns.evaluateAll((els) => els.map((e) => {
        const r = e.getBoundingClientRect();
        return { x: r.left, y: r.top, h: r.height, text: e.textContent!.replace(/\u00a0/g, ' ').trim() };
      }));
      expect(boxes.map((b) => b.text)).toEqual(['30 Tage testen', 'Live-Demo', 'Kontakt']);
      const quiet = boxes[2];
      // Ob „Kontakt“ umbricht, hängt von der Schriftbreite ab (in der CI anders als lokal).
      // Steht er in einer neuen Zeile, muss er bündig mit dem ersten Knopf beginnen.
      if (quiet.y > boxes[1].y) expect(quiet.x, path).toBe(boxes[0].x);
      else expect(quiet.x, path).toBeGreaterThan(boxes[1].x);
    }
  });
});

test.describe('Druck', () => {
  test('Startseite (dunkle Seite): im Druck helles Thema und keine Navigation', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('/');
    const dark = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    await page.emulateMedia({ media: 'print' });
    const canvas = readFileSync('src/styles/tokens.css', 'utf8').match(/@media print \{[\s\S]*?--canvas: (#[0-9a-f]{6})/)![1];
    const rgb = (hex: string) => `rgb(${[1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)).join(', ')})`;
    expect(await page.evaluate(() => getComputedStyle(document.body).backgroundColor)).toBe(rgb(canvas));
    expect(await page.evaluate(() => getComputedStyle(document.body).backgroundColor)).not.toBe(dark);
    await expect(page.locator('.rt-site-header')).toBeHidden();
    await expect(page.locator('.sr-skip')).toBeHidden();
  });
});

test('gestapelte Zellen: die Spaltenbeschriftung gehört nicht zum zugänglichen Namen (Chromium)', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'Alternativtext-Syntax content: … / "" und Namensberechnung geprüft in Chromium');
  await page.setViewportSize({ width: 360, height: 900 });
  await page.goto('/barrierefreiheit/');
  const cells = page.locator('.rt-table--stack td');
  expect(await cells.count()).toBeGreaterThan(5);
  for (let i = 0; i < 6; i++) {
    const cell = cells.nth(i);
    const text = (await cell.innerText()).trim();
    // sichtbar steht die Beschriftung davor …
    expect(await cell.evaluate((e) => getComputedStyle(e, '::before').content)).not.toBe('none');
    // … im Namen aber nur der eigene Text
    await expect(cell).toHaveAccessibleName(text);
  }
});
