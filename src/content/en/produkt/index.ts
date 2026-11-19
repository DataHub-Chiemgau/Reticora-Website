import type { Translation } from '../../types';
import type { produkt as ProduktDe } from '../../de/produkt';
import { discovery } from './discovery';
import { datenqualitaet } from './datenqualitaet';
import { topologieImpact } from './topologie-impact';
import { verwaltung } from './verwaltung';
import { betrieb } from './betrieb';
import { compliance } from './compliance';
import { api } from './api';

/** The seven product pages, keyed like the German ones (last segment of the German path). */
export const produkt: Translation<typeof ProduktDe> = {
  discovery,
  datenqualitaet,
  'topologie-impact': topologieImpact,
  verwaltung,
  betrieb,
  compliance,
  api,
};
