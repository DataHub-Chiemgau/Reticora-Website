import type { Lang } from '../data/types';
import { PRODUKT_DE } from './de/produkt';
import { KONTAKT_DE } from './de/kontakt';

/** Inhalte je Sprache. Die Ansichten laden nur hierüber, nie direkt aus `src/content/de/…`. */
// EN folgt in Task 9: bis dahin liefert jede Sprache die deutschen Inhalte.
export function content(lang: Lang) {
  void lang;
  return { produkt: PRODUKT_DE, kontakt: KONTAKT_DE };
}
