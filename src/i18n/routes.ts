/** Alle Seiten aus docs/content-plan.md §2 (ohne /404). Einzige Liste der internen Adressen. */
export interface Route { de: string; en: string | null; status: 'gebaut' | 'geplant' }

const both = (de: string): Route => ({ de, en: `/en${de}`, status: 'geplant' });
const onlyDe = (de: string): Route => ({ de, en: null, status: 'geplant' });

export const ROUTES: Route[] = [
  { de: '/', en: '/en/', status: 'gebaut' },
  both('/produkt/discovery/'),
  both('/produkt/datenqualitaet/'),
  both('/produkt/topologie-impact/'),
  both('/produkt/verwaltung/'),
  both('/produkt/betrieb/'),
  both('/produkt/compliance/'),
  both('/produkt/api/'),
  both('/geraete/'),
  both('/loesungen/isp/'),
  both('/loesungen/msp/'),
  both('/sicherheit/'),
  both('/preise/'),
  both('/demo/'),
  both('/kontakt/'),
  onlyDe('/kontakt/danke/'),
  onlyDe('/impressum/'),
  onlyDe('/datenschutz/'),
  onlyDe('/agb/'),
  onlyDe('/subprozessoren/'),
  both('/barrierefreiheit/'),
];
