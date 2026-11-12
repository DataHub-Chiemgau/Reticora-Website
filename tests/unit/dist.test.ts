import { describe, expect, test } from 'vitest';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { chunkImports } from '../../scripts/lib/budget.mjs';
import { checkDistHtml } from '../../scripts/lib/release-checks.mjs';

const dist = join(process.cwd(), 'dist');
const hasDist = existsSync(dist);
if (!hasDist) console.warn('dist/ fehlt: bitte zuerst "npm run build" ausführen; dist-Tests werden übersprungen.');

function walk(dir: string, ext: string): string[] {
  return readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    return statSync(p).isDirectory() ? walk(p, ext) : p.endsWith(ext) ? [p] : [];
  });
}

describe.skipIf(!hasDist)('dist', () => {
  test('kein Inline-Skript und kein style-Attribut im HTML', () => {
    for (const f of walk(dist, '.html')) {
      const html = readFileSync(f, 'utf8');
      expect(html, f).not.toMatch(/<script(?![^>]*\ssrc=)[^>]*>/i);
      expect(html, f).not.toMatch(/\sstyle="/i);
    }
  });

  test('Schriften zusammen höchstens 90 KB', () => {
    const fonts = walk(join(dist, '_astro'), '.woff2');
    expect(fonts.length).toBeGreaterThanOrEqual(2);
    const sum = fonts.reduce((s, f) => s + statSync(f).size, 0);
    expect(sum).toBeLessThanOrEqual(90_000);
  });

  test('jede @font-face-Regel hat font-display: swap', () => {
    const rules = walk(join(dist, '_astro'), '.css').flatMap((f) => readFileSync(f, 'utf8').match(/@font-face\s*\{[^}]*\}/g) ?? []);
    expect(rules.length).toBeGreaterThanOrEqual(2);
    for (const r of rules) expect(r).toMatch(/font-display:\s*swap/);
  });

  test('Archivo-@font-face deklariert font-stretch 100% 112%', () => {
    const rules = walk(join(dist, '_astro'), '.css').flatMap((f) => readFileSync(f, 'utf8').match(/@font-face\s*\{[^}]*\}/g) ?? []);
    const archivo = rules.find((r) => /Archivo/.test(r));
    expect(archivo).toBeDefined();
    expect(archivo).toMatch(/font-stretch:\s*100%\s*112%/);
  });

  test('Zahl und Einheit stehen nie mit einfachem Leerzeichen (geschütztes Leerzeichen U+00A0)', () => {
    const html = readFileSync(join(dist, 'index.html'), 'utf8');
    const text = html.replace(/<(script|style)\b[\s\S]*?<\/\1>/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, '\u00a0');
    const bad = [...text.matchAll(/\d (?:€|%|(?:h|min|KB|Tage|Tagen|CIs|Stunden|Minuten)(?![\wäöüß]))/g)].map((m) => text.slice(Math.max(0, m.index! - 20), m.index! + 12));
    expect(bad).toEqual([]);
  });

  test('Insel impact: alle vom Schema geladenen Skripte zusammen höchstens 8 KB', () => {
    const html = readFileSync(join(dist, 'index.html'), 'utf8');
    const after = html.slice(html.indexOf('data-topo'));
    const entry = /<script[^>]*type="module"[^>]*src="([^"]+)"/.exec(after)?.[1];
    expect(entry).toBeDefined();
    const seen = new Set<string>();
    const load = (url: string) => {
      const f = join(dist, url.replace(/^\//, ''));
      if (seen.has(f)) return;
      seen.add(f);
      for (const imp of chunkImports(readFileSync(f, 'utf8')))
        load(new URL(imp, 'http://x' + (url.startsWith('/') ? url : '/' + url)).pathname);
    };
    load(entry!);
    const sum = [...seen].reduce((n, f) => n + statSync(f).size, 0);
    expect(seen.size).toBeGreaterThanOrEqual(1);
    expect(sum).toBeLessThanOrEqual(8 * 1024);
  });

  test('Insel form höchstens 3 KB (minifiziert, mit allen Importen)', () => {
    const html = readFileSync(join(dist, 'kontakt', 'index.html'), 'utf8');
    const entry = [...html.matchAll(/<script[^>]*\ssrc="([^"]+)"/g)].map((m) => m[1]).find((u) => readFileSync(join(dist, u.replace(/^\//, '')), 'utf8').includes('form[data-lead]'));
    expect(entry).toBeDefined();
    const seen = new Set<string>();
    const load = (url: string) => {
      const f = join(dist, url.replace(/^\//, ''));
      if (seen.has(f)) return;
      seen.add(f);
      for (const imp of chunkImports(readFileSync(f, 'utf8'))) load(new URL(imp, 'http://x' + url).pathname);
    };
    load(entry!);
    expect([...seen].reduce((n, f) => n + statSync(f).size, 0)).toBeLessThanOrEqual(3 * 1024);
  });

  test('Release-Prüfung meldet die Platzhalter der Rechts- und Hinweisseiten', () => {
    const pages = ['impressum', 'datenschutz', 'agb', 'subprozessoren', 'barrierefreiheit', 'kontakt'].map((n) => ({ path: `dist/${n}/index.html`, html: readFileSync(join(dist, n, 'index.html'), 'utf8') }));
    const found = checkDistHtml(pages);
    for (const id of ['privacy', 'terms', 'subprocessors', 'impressum-email', 'barrierefreiheit-kontakt', 'kontakt-verarbeitung', 'kontakt-email'])
      expect(found.some((l) => l.endsWith(`Platzhalter für ${id}`)), id).toBe(true);
  });

  test('kein <?php und kein backend/ im Build', () => {
    expect(existsSync(join(dist, 'backend'))).toBe(false);
    for (const f of walk(dist, '.html')) expect(readFileSync(f, 'utf8')).not.toContain('<?php');
  });
});
