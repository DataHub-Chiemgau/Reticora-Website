import { readFileSync } from 'node:fs';
import { describe, expect, test } from 'vitest';
import { renderTokensCss } from '../../scripts/build-tokens.mjs';
import { contrast } from './contrast';

const read = (p: string) => readFileSync(new URL(`../../${p}`, import.meta.url), 'utf8');
const tokens = JSON.parse(read('design/leitstand/tokens.json'));
const THEMES = ['leitstand', 'dokument'] as const;
type Theme = (typeof THEMES)[number];

const color = (name: string, theme: Theme): string => {
  const t = tokens.color.tokens.find((c: { name: string }) => c.name === name);
  if (!t) throw new Error(`Farbe fehlt: ${name}`);
  return t.value[theme];
};

const MIN: Record<string, [number, number]> = {
  text: [7, 4.5],
  other: [4.5, 4.5],
  control: [3, 3],
  graph: [3, 3],
};
const groups: [string[], string[], [number, number]][] = [
  [['fg', 'fg-muted'], ['canvas', 'panel', 'raised'], MIN.text],
  [['fg-subtle', 'accent', 'signal', 'danger', 'success'], ['canvas', 'panel'], MIN.other],
  [['accent-strong'], ['canvas', 'accent-soft'], MIN.other],
  [['accent-fg'], ['accent', 'accent-strong'], MIN.other],
  [['control'], ['canvas', 'panel', 'raised'], MIN.control],
  [['graph-active', 'graph-failed'], ['panel'], MIN.graph],
];
const PAIRS: [string, string, Theme, number][] = groups.flatMap(([fgs, bgs, [l, d]]) =>
  fgs.flatMap((fg) =>
    bgs.flatMap((bg) => [
      [fg, bg, 'leitstand', l] as [string, string, Theme, number],
      [fg, bg, 'dokument', d] as [string, string, Theme, number],
    ]),
  ),
);

describe('Tokens', () => {
  test('tokens.css entspricht tokens.json', () => {
    expect(read('src/styles/tokens.css')).toBe(renderTokensCss(tokens));
  });

  test('jedes Thema definiert jede Farbe', () => {
    const css = renderTokensCss(tokens);
    const blocks: Record<Theme, string> = {
      leitstand: css.slice(css.indexOf(':root, [data-theme="leitstand"]'), css.indexOf('[data-theme="dokument"] {')),
      dokument: css.slice(css.indexOf('[data-theme="dokument"] {'), css.lastIndexOf(':root {')),
    };
    for (const theme of THEMES) {
      for (const c of tokens.color.tokens) {
        expect(blocks[theme]).toContain(`--${c.name}: ${c.value[theme]};`);
      }
    }
  });

  test.each(PAIRS)('%s auf %s im Thema %s ≥ %d', (fg, bg, theme, min) => {
    expect(contrast(color(fg, theme), color(bg, theme))).toBeGreaterThanOrEqual(min);
  });
});
