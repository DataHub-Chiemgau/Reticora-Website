import { describe, expect, test } from 'vitest';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { chunkImports, gzipTotal, homepageAssets } from '../../scripts/lib/budget.mjs';

const dist = join(process.cwd(), 'dist');
const hasDist = existsSync(join(dist, 'index.html'));
if (!hasDist) console.warn('dist/ fehlt: bitte zuerst "npm run build" ausführen; Budget-Tests werden übersprungen.');

test('chunkImports erkennt statische und dynamische Importe', () => {
  const code = 'import"./a.js";import{x}from"./b.js";const c=()=>import("./c.js");import(\'../d.js\');import "https://x/e.js";';
  expect(chunkImports(code)).toEqual(['./a.js', './b.js', './c.js', '../d.js']);
});

describe.skipIf(!hasDist)('Budgets der Startseite (gzip)', () => {
  test('JavaScript der Startseite höchstens 35 KB', () => {
    const a = homepageAssets(dist);
    expect(a.js.length).toBeGreaterThanOrEqual(1);
    expect(a.css.length).toBeGreaterThanOrEqual(1);
    expect(a.fonts.length).toBeGreaterThanOrEqual(2);
    expect(gzipTotal(a.js)).toBeLessThanOrEqual(35 * 1024);
  });
  test('HTML + CSS + JS + Schriften der Startseite höchstens 200 KB', () => {
    const a = homepageAssets(dist);
    expect(a.fonts.length).toBeGreaterThanOrEqual(2);
    expect(a.css.length).toBeGreaterThanOrEqual(1);
    expect(a.js.length).toBeGreaterThanOrEqual(1);
    expect(gzipTotal([a.html, ...a.css, ...a.js, ...a.fonts])).toBeLessThanOrEqual(200 * 1024);
  });
});
