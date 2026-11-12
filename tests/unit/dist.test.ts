import { describe, expect, test } from 'vitest';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

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

  test('Insel impact: alle vom Schema geladenen Skripte zusammen höchstens 8 KB', () => {
    const dir = join(dist, 'dev', 'bausteine');
    const html = readFileSync(join(dir, 'index.html'), 'utf8');
    const after = html.slice(html.indexOf('data-topo'));
    const entry = /<script[^>]*type="module"[^>]*src="([^"]+)"/.exec(after)?.[1];
    expect(entry).toBeDefined();
    const seen = new Set<string>();
    const load = (url: string) => {
      const f = join(dist, url.replace(/^\//, ''));
      if (seen.has(f)) return;
      seen.add(f);
      const code = readFileSync(f, 'utf8');
      for (const m of code.matchAll(/(?:from|import)\s*["'](\.{1,2}\/[^"']+\.js)["']/g))
        load(new URL(m[1]!, 'http://x' + (url.startsWith('/') ? url : '/' + url)).pathname);
    };
    load(entry!);
    const sum = [...seen].reduce((n, f) => n + statSync(f).size, 0);
    expect(seen.size).toBeGreaterThanOrEqual(1);
    expect(sum).toBeLessThanOrEqual(8 * 1024);
  });
});
