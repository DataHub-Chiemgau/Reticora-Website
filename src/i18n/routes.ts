import type { Lang } from '../data/types';

/** Alle Seiten aus docs/content-plan.md §2 (ohne /404) mit deutscher und englischer Adresse.
 *  `status` gilt für die deutsche Seite, `enStatus` für die englische; beide sind Pflicht und starten auf 'geplant'.
 *  Eine neue Seite trägt sich hier ein: Status auf 'gebaut' setzen, sonst bleibt sie aus Sprachumschalter,
 *  `hreflang` und Sitemap draußen. */
export type Status = 'gebaut' | 'geplant';
export interface Route { de: string; en: string; status: Status; enStatus: Status; noindex?: boolean }

const r = (de: string, en: string, extra: Partial<Route> = {}): Route => ({ de, en, status: 'geplant', enStatus: 'geplant', ...extra });

export const ROUTES: Route[] = [
  { de: '/', en: '/en/', status: 'gebaut', enStatus: 'geplant' },
  r('/produkt/discovery/', '/en/product/discovery/'),
  r('/produkt/datenqualitaet/', '/en/product/data-quality/'),
  r('/produkt/topologie-impact/', '/en/product/topology-impact/'),
  r('/produkt/verwaltung/', '/en/product/administration/'),
  r('/produkt/betrieb/', '/en/product/operations/'),
  r('/produkt/compliance/', '/en/product/compliance/'),
  r('/produkt/api/', '/en/product/api/'),
  r('/geraete/', '/en/devices/'),
  r('/loesungen/isp/', '/en/solutions/isp/'),
  r('/loesungen/msp/', '/en/solutions/msp/'),
  r('/sicherheit/', '/en/security/'),
  r('/preise/', '/en/pricing/'),
  r('/demo/', '/en/demo/'),
  r('/kontakt/', '/en/contact/'),
  r('/kontakt/danke/', '/en/contact/thanks/', { noindex: true }),
  r('/impressum/', '/en/legal-notice/'),
  r('/datenschutz/', '/en/privacy/'),
  r('/agb/', '/en/terms/'),
  r('/subprozessoren/', '/en/subprocessors/'),
  r('/barrierefreiheit/', '/en/accessibility/'),
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
