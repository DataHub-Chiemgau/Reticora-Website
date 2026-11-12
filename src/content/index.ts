import type { Lang } from '../data/types';
import { PRODUKT_DE } from './de/produkt';
import { KONTAKT_DE } from './de/kontakt';
import { BARRIEREFREIHEIT_DE } from './de/barrierefreiheit';
import { GERAETE } from './de/geraete';
import { ISP } from './de/isp';
import { MSP } from './de/msp';
import { SICHERHEIT } from './de/sicherheit';
import { PREISE } from './de/preise';
import { DEMO } from './de/demo';

/** Inhalte je Sprache. Die Ansichten laden nur hierüber, nie direkt aus `src/content/de/…`. */
// EN folgt in Task 9: bis dahin liefert jede Sprache die deutschen Inhalte.
export function content(lang: Lang) {
  void lang;
  return { produkt: PRODUKT_DE, kontakt: KONTAKT_DE, barrierefreiheit: BARRIEREFREIHEIT_DE, geraete: GERAETE, isp: ISP, msp: MSP, sicherheit: SICHERHEIT, preise: PREISE, demo: DEMO };
}
