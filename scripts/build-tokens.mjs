import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const HEADER = '/* erzeugt aus design/leitstand/tokens.json – nicht von Hand ändern */';

const lines = (entries) => entries.map(([k, v]) => `  --${k}: ${v};`);

export function renderTokensCss(tokens) {
  const [first, second] = tokens.color.themes.map((t) => t.id);
  const colors = (theme) => tokens.color.tokens.map((c) => [c.name, c.value[theme]]);
  const plain = (group) => group.tokens.map((t) => [t.name, t.value]);
  const fam = tokens.type.families;

  const blocks = [
    [':root, [data-theme="' + first + '"] {', '  color-scheme: dark;', ...lines(colors(first)), '}'],
    ['[data-theme="' + second + '"] {', '  color-scheme: light;', ...lines(colors(second)), '}'],
    [
      ':root {',
      ...lines([
        ...plain(tokens.spacing),
        ...plain(tokens.radius),
        ...plain(tokens.layout),
        ...plain(tokens.breakpoint),
        ['font-display', fam.display],
        ['font-text', fam.text],
        ['font-mono', fam.mono],
      ]),
      '}',
    ],
    // Druck: helles Thema (second) auch ohne data-theme, Papier bleibt hell.
    [
      '@media print {',
      '  :root, [data-theme="' + first + '"] {',
      '    color-scheme: light;',
      ...lines(colors(second)).map((l) => '  ' + l),
      '  }',
      '}',
    ],
  ];
  return [HEADER, ...blocks.map((b) => b.join('\n'))].join('\n\n') + '\n';
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const root = new URL('../', import.meta.url);
  const tokens = JSON.parse(readFileSync(new URL('design/leitstand/tokens.json', root), 'utf8'));
  writeFileSync(new URL('src/styles/tokens.css', root), renderTokensCss(tokens));
}
