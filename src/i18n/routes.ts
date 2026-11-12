/** Alle Seiten aus docs/content-plan.md §2 (ohne /404).
 *  Englische Adressen stehen nur dort, wo Spezifikation §3 oder Inhaltsplan sie nennen;
 *  alle anderen bleiben null, bis die englische Phase sie festlegt. */
export interface Route { de: string; en: string | null; status: 'gebaut' | 'geplant' }

const r = (de: string, en: string | null = null): Route => ({ de, en, status: 'geplant' });

export const ROUTES: Route[] = [
  { de: '/', en: '/en/', status: 'gebaut' },
  r('/produkt/discovery/'),
  r('/produkt/datenqualitaet/'),
  r('/produkt/topologie-impact/'),
  r('/produkt/verwaltung/'),
  r('/produkt/betrieb/'),
  r('/produkt/compliance/'),
  r('/produkt/api/'),
  r('/geraete/'),
  r('/loesungen/isp/'),
  r('/loesungen/msp/'),
  r('/sicherheit/', '/en/security/'),
  r('/preise/', '/en/pricing/'),
  r('/demo/', '/en/demo/'),
  r('/kontakt/', '/en/contact/'),
  r('/kontakt/danke/', '/en/contact/thanks/'),
  r('/impressum/'),
  r('/datenschutz/'),
  r('/agb/'),
  r('/subprozessoren/'),
  r('/barrierefreiheit/'),
];
