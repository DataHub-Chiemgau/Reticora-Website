import { DISCOVERY } from './discovery';
import { DATENQUALITAET } from './datenqualitaet';
import { TOPOLOGIE_IMPACT } from './topologie-impact';
import { VERWALTUNG } from './verwaltung';
import { BETRIEB } from './betrieb';
import { COMPLIANCE } from './compliance';
import { API } from './api';

/** Die sieben Produktseiten, in der Reihenfolge der Navigation; der Schlüssel ist das letzte Pfadstück der deutschen Adresse. */
export const PRODUKT_DE = {
  discovery: DISCOVERY,
  datenqualitaet: DATENQUALITAET,
  'topologie-impact': TOPOLOGIE_IMPACT,
  verwaltung: VERWALTUNG,
  betrieb: BETRIEB,
  compliance: COMPLIANCE,
  api: API,
} as const;
