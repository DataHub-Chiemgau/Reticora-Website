import type { Lang } from '../data/types';

/** Alle Seiten aus docs/content-plan.md §2 (ohne /404) mit deutscher und englischer Adresse.
 *  `status` gilt für die deutsche Seite, `enStatus` für die englische (fehlt es, gilt `status`).
 *  Eine neue Seite trägt sich hier ein: Status auf 'gebaut' setzen, sonst bleibt sie aus Sprachumschalter,
 *  `hreflang` und Sitemap draußen. */
export type Status = 'gebaut' | 'geplant';
export interface Route { de: string; en: string; status: Status; enStatus?: Status; noindex?: boolean }

const r = (de: string, en: string, extra: Partial<Route> = {}): Route => ({ de, en, status: 'geplant', ...extra });

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
export function routeOf(path: string): Route | undefined {
  const p = stripSuffix(path);
  return ROUTES.find((x) => x.de === p || x.en === p);
}

export function langOf(path: string): Lang | null {
  const p = stripSuffix(path);
  const x = ROUTES.find((e) => e.de === p || e.en === p);
  return x ? (x.de === p ? 'de' : 'en') : null;
}

/** Adresse der anderen Sprache; null für Adressen ohne Paar (z. B. /404/). Sagt nichts darüber, ob sie gebaut ist. */
export function counterpart(path: string): string | null {
  const x = routeOf(path);
  if (!x) return null;
  return stripSuffix(path) === x.de ? x.en : x.de;
}

/** Deutsche Adresse zu einer Adresse in beliebiger Sprache (unbekannt: unverändert). */
export function dePath(path: string): string {
  const x = routeOf(path);
  return x ? x.de : path;
}

/** Adresse in der Sprache `lang`. Query und Fragment bleiben erhalten; eine unbekannte Adresse ist ein Fehler. */
export function localize(dePath: string, lang: Lang): string {
  const x = ROUTES.find((e) => e.de === stripSuffix(dePath));
  if (!x) throw new Error(`localize: unbekannte Adresse ${dePath}`);
  return lang === 'de' ? dePath : x.en + dePath.slice(stripSuffix(dePath).length);
}

/** Gibt es die Seite unter dieser Adresse schon? Nur dann verlinken Sprachumschalter und hreflang dorthin. */
export function isBuilt(path: string | null): boolean {
  if (path === null) return false;
  const x = routeOf(path);
  if (!x) return false;
  return stripSuffix(path) === x.de ? x.status === 'gebaut' : (x.enStatus ?? x.status) === 'gebaut';
}
