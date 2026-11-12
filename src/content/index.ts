import type { Lang } from '../data/types';
import { home } from './de/home';
import { produkt } from './de/produkt';
import { kontakt } from './de/kontakt';
import { barrierefreiheit } from './de/barrierefreiheit';
import { geraete } from './de/geraete';
import { isp } from './de/isp';
import { msp } from './de/msp';
import { sicherheit } from './de/sicherheit';
import { preise } from './de/preise';
import { demo } from './de/demo';

/** Inhalte je Sprache. Seiten und Ansichten laden nur hierüber, nie direkt aus `src/content/de/…`.
 *  Jede Seite hat einen Export in camelCase, benannt nach ihrem Pfad (`produkt/topologie-impact` → `topologieImpact`). */
// EN folgt in Task 9: bis dahin liefert jede Sprache die deutschen Inhalte.
export function content(lang: Lang) {
  void lang;
  return { home, produkt, kontakt, barrierefreiheit, geraete, isp, msp, sicherheit, preise, demo };
}
