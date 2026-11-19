import { describe, expect, test } from 'vitest';
import { existsSync } from 'node:fs';
import { join, relative } from 'node:path';
import { chunkImports, gzipTotal, htmlPages, islandOf, pageAssets, scriptSize } from '../../scripts/lib/budget.mjs';

const dist = join(process.cwd(), 'dist');
const hasDist = existsSync(join(dist, 'index.html'));
if (!hasDist) console.warn('dist/ fehlt: bitte zuerst "npm run build" ausführen; Budget-Tests werden übersprungen.');

test('chunkImports erkennt statische und dynamische Importe', () => {
  const code = 'import"./a.js";import{x}from"./b.js";const c=()=>import("./c.js");import(\'../d.js\');import "https://x/e.js";';
  expect(chunkImports(code)).toEqual(['./a.js', './b.js', './c.js', '../d.js']);
});

const KB = 1024;
const ISLAND_MAX: Record<string, number> = { impact: 8 * KB, copy: 1 * KB, form: 3 * KB, filter: 2 * KB };

describe.skipIf(!hasDist)('Budgets je gebauter Seite (gzip bzw. minifiziert)', () => {
  const pages: string[] = hasDist ? htmlPages(dist).sort() : [];

  test('beide Sprachen sind erfasst', () => {
    const rel = pages.map((p) => relative(dist, p));
    expect(rel).toContain('index.html');
    expect(rel).toContain(join('en', 'index.html'));
    expect(rel).toContain(join('preise', 'index.html'));
    expect(rel).toContain(join('en', 'pricing', 'index.html'));
  });

  test('JavaScript höchstens 35 KB, HTML + CSS + JS + Schriften höchstens 200 KB, Inseln im Rahmen', () => {
    const verstoesse: string[] = [];
    for (const page of pages) {
      const name = relative(dist, page);
      const a = pageAssets(dist, page);
      if (a.css.length < 1 || a.fonts.length < 2) verstoesse.push(`${name}: erwartet mindestens 1 CSS und 2 Schriften, gefunden ${a.css.length}/${a.fonts.length}`);
      const js = gzipTotal(a.js);
      const all = gzipTotal([a.html, ...a.css, ...a.js, ...a.fonts]);
      if (js > 35 * KB) verstoesse.push(`${name}: JavaScript ${js} B > 35 KB`);
      if (all > 200 * KB) verstoesse.push(`${name}: Gesamt ${all} B > 200 KB`);
      for (const url of a.entries) {
        const island = islandOf(dist, url);
        if (!island) continue;
        const size = scriptSize(dist, url);
        if (size > ISLAND_MAX[island]) verstoesse.push(`${name}: Insel ${island} ${size} B > ${ISLAND_MAX[island]} B`);
      }
    }
    expect(verstoesse).toEqual([]);
  });

  test('die Startseite lädt JavaScript, CSS und mindestens zwei Schriften', () => {
    const a = pageAssets(dist);
    expect(a.js.length).toBeGreaterThanOrEqual(1);
    expect(a.css.length).toBeGreaterThanOrEqual(1);
    expect(a.fonts.length).toBeGreaterThanOrEqual(2);
  });
});
