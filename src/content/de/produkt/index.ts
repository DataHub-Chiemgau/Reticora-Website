import { discovery } from './discovery';
import { datenqualitaet } from './datenqualitaet';
import { topologieImpact } from './topologie-impact';
import { verwaltung } from './verwaltung';
import { betrieb } from './betrieb';
import { compliance } from './compliance';
import { api } from './api';

/** Die sieben Produktseiten, in der Reihenfolge der Navigation; der Schlüssel ist das letzte Pfadstück der deutschen Adresse. */
export const produkt = {
  discovery,
  datenqualitaet,
  'topologie-impact': topologieImpact,
  verwaltung,
  betrieb,
  compliance,
  api,
} as const;
