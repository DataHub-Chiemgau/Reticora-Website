import { SITE } from '../src/data/site';

/** Suche nach deutschen Resten in englischem Text; gemeinsam für tests/unit/content-parity.test.ts und tests/e2e/english.spec.ts.
 *  Ein Treffer ist ein Fehler, außer er steht in einem erlaubten Eigennamen (`ALLOWED_GERMAN`). */

/** Eigennamen und Angaben, die auf englischen Seiten deutsch bleiben (Firma, Anschrift, Sprachname). Ergänzen nur mit Begründung. */
export const ALLOWED_GERMAN: string[] = [
  SITE.company, // Firmenname laut Handelsregister
  SITE.street,
  SITE.city,
  'Deutsch', // Name der Sprache im Sprachumschalter
];

const L = '[\\p{L}\\d]';
const word = (w: string) => new RegExp(`(?<!${L})${w}(?!${L})`, 'u');

/** Häufige deutsche Wörter und Zeichen, die in englischem Text nicht vorkommen. */
export const GERMAN_MARKERS: RegExp[] = [
  word('[Uu]nd'),
  word('[Dd]er'),
  word('[Dd]ie'),
  word('[Dd]as'),
  word('[Ff]ür'),
  word('[Mm]it'),
  word('[Nn]icht'),
  word('[Ww]ird'),
  word('[Ii]st'),
  word('[Ss]ie'),
  word('[Ii]hre?n?'),
  word('[Oo]der'),
  word('[Ee]in(?:e|en|em|er)?'),
  /ß/u,
  /[äöüÄÖÜ]/u,
];

/** Fundstellen deutscher Reste in `text` (je mit etwas Umgebung), leer, wenn keine. */
export function germanLeftovers(text: string, allowed: string[] = ALLOWED_GERMAN): string[] {
  let t = text.replace(/\u00a0/g, ' ');
  for (const a of allowed) t = t.split(a).join(' ');
  const hits: string[] = [];
  for (const re of GERMAN_MARKERS) {
    const g = new RegExp(re.source, re.flags.includes('g') ? re.flags : `${re.flags}g`);
    for (const m of t.matchAll(g)) {
      const at = m.index ?? 0;
      hits.push(`${m[0]} … „${t.slice(Math.max(0, at - 30), at + m[0].length + 30).replace(/\s+/g, ' ').trim()}“`);
    }
  }
  return hits;
}
