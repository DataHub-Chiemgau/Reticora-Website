import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, test } from 'vitest';

const files = (dir: string): string[] =>
  readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? files(p) : [p];
  });
const sources = [...files('src/views'), ...files('src/pages')].filter((f) => /\.(astro|ts)$/.test(f));

describe('Inhalte laden nur über content(lang)', () => {
  test('es gibt Ansichten und Seiten zu prüfen', () => {
    expect(sources.length).toBeGreaterThan(20);
  });
  test('keine Ansicht und keine Seite importiert aus src/content/de/…', () => {
    const bad = sources.filter((f) => /from\s+['"][^'"]*content\/de\//.test(readFileSync(f, 'utf8')));
    expect(bad).toEqual([]);
  });
  test('die Startseite lädt ihre Texte über content(lang)', () => {
    expect(readFileSync('src/pages/index.astro', 'utf8')).toMatch(/content\(lang\)\.home/);
  });
});

describe('Absatz mit Beleg', () => {
  test('Ansichten setzen kein eigenes role="paragraph" für Absätze, das macht Para', () => {
    // Ausnahmen: Vorspann-Slots in PageHero und Section sowie der Hinweis der Preisseite (Notice mit Fettzeile) und die Entwicklungsseite.
    const own = sources.filter((f) => /<div class="rt-para[^"]*" role="paragraph">/.test(readFileSync(f, 'utf8')));
    expect(own).toEqual(['src/pages/index.astro']);
  });
});
