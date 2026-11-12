import type { Lang } from '../data/types';
import type { Translation } from './types';
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
import { kontakt as kontaktEn } from './en/kontakt';
import { barrierefreiheit as barrierefreiheitEn } from './en/barrierefreiheit';
import { geraete as geraeteEn } from './en/geraete';
import { isp as ispEn } from './en/isp';
import { msp as mspEn } from './en/msp';
import { sicherheit as sicherheitEn } from './en/sicherheit';
import { preise as preiseEn } from './en/preise';
import { demo as demoEn } from './en/demo';

/** Inhalte je Sprache. Seiten und Ansichten laden nur hierüber, nie direkt aus `src/content/de/…` oder `src/content/en/…`.
 *  Jede Seite hat einen Export in camelCase, benannt nach ihrem Pfad (`produkt/topologie-impact` → `topologieImpact`). */
const DE = { home, produkt, kontakt, barrierefreiheit, geraete, isp, msp, sicherheit, preise, demo };

export type Content = typeof DE;

/** Englisch: jede Seite als `Translation<typeof deutscherExport>` (src/content/en/<gleicher Pfad>.ts), die Typprüfung erzwingt die Parität.
 *  Eine noch nicht übersetzte Seite zeigt hier auf `DE.<seite>`; ihre englische Route bleibt dann auf `enStatus: 'geplant'`
 *  (tests/unit/content-parity.test.ts prüft das). Je Seite eine Zeile, damit parallele Änderungen nicht kollidieren. */
const EN: Translation<Content> = {
  home: DE.home,
  produkt: DE.produkt,
  kontakt: kontaktEn,
  barrierefreiheit: barrierefreiheitEn,
  geraete: geraeteEn,
  isp: ispEn,
  msp: mspEn,
  sicherheit: sicherheitEn,
  preise: preiseEn,
  demo: demoEn,
};

/** Die Ansichten sehen den deutschen Typ; die englischen Werte haben dieselbe Gestalt (`Translation`), nur andere Texte. */
export function content(lang: Lang): Content {
  return lang === 'en' ? (EN as unknown as Content) : DE;
}
