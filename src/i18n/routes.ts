import type { Lang } from '../data/types';

/** Alle Seiten aus docs/content-plan.md §2 (ohne /404) mit deutscher und englischer Adresse.
 *  `status` gilt für die deutsche Seite, `enStatus` für die englische; beide sind Pflicht und starten auf 'geplant'.
 *  Eine neue Seite trägt sich hier ein: Status auf 'gebaut' setzen, sonst bleibt sie aus Sprachumschalter,
 *  `hreflang` und Sitemap draußen. */
export type Status = 'gebaut' | 'geplant';
export interface Route { de: string; en: string; status: Status; enStatus: Status; noindex?: boolean }

const r = (de: string, en: string, extra: Partial<Route> = {}): Route => ({ de, en, status: 'geplant', enStatus: 'geplant', ...extra });

export const ROUTES: Route[] = [
  { de: '/', en: '/en/', status: 'gebaut', enStatus: 'gebaut' },
  { de: '/produkt/discovery/', en: '/en/product/discovery/', status: 'gebaut', enStatus: 'gebaut' },
  { de: '/produkt/datenqualitaet/', en: '/en/product/data-quality/', status: 'gebaut', enStatus: 'gebaut' },
  { de: '/produkt/topologie-impact/', en: '/en/product/topology-impact/', status: 'gebaut', enStatus: 'gebaut' },
  { de: '/produkt/verwaltung/', en: '/en/product/administration/', status: 'gebaut', enStatus: 'gebaut' },
  { de: '/produkt/betrieb/', en: '/en/product/operations/', status: 'gebaut', enStatus: 'gebaut' },
  { de: '/produkt/compliance/', en: '/en/product/compliance/', status: 'gebaut', enStatus: 'gebaut' },
  { de: '/produkt/api/', en: '/en/product/api/', status: 'gebaut', enStatus: 'gebaut' },
  { de: '/geraete/', en: '/en/devices/', status: 'gebaut', enStatus: 'gebaut' },
  { de: '/loesungen/isp/', en: '/en/solutions/isp/', status: 'gebaut', enStatus: 'gebaut' },
  { de: '/loesungen/msp/', en: '/en/solutions/msp/', status: 'gebaut', enStatus: 'gebaut' },
  { de: '/sicherheit/', en: '/en/security/', status: 'gebaut', enStatus: 'gebaut' },
  { de: '/preise/', en: '/en/pricing/', status: 'gebaut', enStatus: 'gebaut' },
  { de: '/demo/', en: '/en/demo/', status: 'gebaut', enStatus: 'gebaut', noindex: true },
  { de: '/kontakt/', en: '/en/contact/', status: 'gebaut', enStatus: 'gebaut' },
  { de: '/kontakt/danke/', en: '/en/contact/thanks/', status: 'gebaut', enStatus: 'gebaut', noindex: true },
  { de: '/impressum/', en: '/en/legal-notice/', status: 'gebaut', enStatus: 'gebaut' },
  { de: '/datenschutz/', en: '/en/privacy/', status: 'gebaut', enStatus: 'gebaut' },
  { de: '/agb/', en: '/en/terms/', status: 'gebaut', enStatus: 'gebaut' },
  { de: '/subprozessoren/', en: '/en/subprocessors/', status: 'gebaut', enStatus: 'gebaut' },
  { de: '/barrierefreiheit/', en: '/en/accessibility/', status: 'gebaut', enStatus: 'gebaut' },
];

const stripSuffix = (p: string) => p.split(/[?#]/)[0];

/** Route zu einer deutschen oder englischen Adresse (ohne Query und Fragment). */
export function routeOf(path: string, routes: Route[] = ROUTES): Route | undefined {
  const p = stripSuffix(path);
  return routes.find((x) => x.de === p || x.en === p);
}

export function langOf(path: string, routes: Route[] = ROUTES): Lang | null {
  const x = routeOf(path, routes);
  return x ? (x.de === stripSuffix(path) ? 'de' : 'en') : null;
}

/** Adresse der anderen Sprache; null für Adressen ohne Paar (z. B. /404/). Sagt nichts darüber, ob sie gebaut ist. */
export function counterpart(path: string, routes: Route[] = ROUTES): string | null {
  const x = routeOf(path, routes);
  if (!x) return null;
  return stripSuffix(path) === x.de ? x.en : x.de;
}

/** Deutsche Adresse zu einer Adresse in beliebiger Sprache (unbekannt: unverändert). */
export function dePath(path: string, routes: Route[] = ROUTES): string {
  const x = routeOf(path, routes);
  return x ? x.de : path;
}

/** Adresse in der Sprache `lang`. Query und Fragment bleiben erhalten; eine unbekannte Adresse ist ein Fehler. */
export function localize(dePath: string, lang: Lang): string {
  const x = ROUTES.find((e) => e.de === stripSuffix(dePath));
  if (!x) throw new Error(`localize: unbekannte Adresse ${dePath}`);
  return lang === 'de' ? dePath : x.en + dePath.slice(stripSuffix(dePath).length);
}

/** Gibt es die Seite unter dieser Adresse schon? Deutsch und Englisch zählen getrennt (`status`, `enStatus`). */
export function isBuilt(path: string | null, routes: Route[] = ROUTES): boolean {
  if (path === null) return false;
  const x = routeOf(path, routes);
  if (!x) return false;
  return (stripSuffix(path) === x.de ? x.status : x.enStatus) === 'gebaut';
}

/** Ziel des Sprachumschalters: das Gegenstück, wenn Seite und Gegenstück gebaut sind, sonst null (kein Link). */
export function switchTarget(path: string, routes: Route[] = ROUTES): string | null {
  const other = counterpart(path, routes);
  return other !== null && isBuilt(path, routes) && isBuilt(other, routes) ? other : null;
}

export interface Alternates { de: string; en: string; xDefault: string }

/** hreflang-Satz (Adressen ohne Ursprung) nur bei gebautem Paar, sonst null. */
export function alternates(path: string, routes: Route[] = ROUTES): Alternates | null {
  const other = switchTarget(path, routes);
  if (other === null) return null;
  const lang = langOf(path, routes)!;
  const de = lang === 'de' ? stripSuffix(path) : other;
  const en = lang === 'en' ? stripSuffix(path) : other;
  return { de, en, xDefault: de };
}

/** Ziel des Sprachumschalters auf Seiten ohne Gegenstück (die Fehlerseite 404): die Startseite der anderen Sprache, wenn sie gebaut ist, sonst null.
 *  Ein „kommt bald“ gibt es dort nicht, weil es kein Gegenstück gibt, das kommen könnte. */
export function homeSwitchTarget(lang: Lang, routes: Route[] = ROUTES): string | null {
  const home = routes.find((x) => x.de === '/');
  if (!home) return null;
  const target = lang === 'de' ? home.en : home.de;
  return isBuilt(target, routes) ? target : null;
}
