import { describe, expect, test } from 'vitest';
import { sitemapXml } from '../../src/lib/discover';
import { ROUTES, homeSwitchTarget, type Route } from '../../src/i18n/routes';

describe('ROUTES', () => {
  test('alle Adressen beginnen und enden mit Schrägstrich', () => {
    for (const r of ROUTES) for (const p of [r.de, r.en]) expect(p).toMatch(/^\/.*\/$|^\/$/);
  });
  test('keine englische Adresse ist nur das deutsche Muster mit Präfix (Ausnahme: /demo/)', () => {
    for (const r of ROUTES) if (r.de !== '/' && r.de !== '/demo/') expect(r.en).not.toBe(`/en${r.de}`);
  });
  test('englische Adressen sind eindeutig und beginnen mit /en/', () => {
    const en = ROUTES.map((r) => r.en).filter((x): x is string => x !== null);
    expect(new Set(en).size).toBe(en.length);
    for (const p of en) expect(p.startsWith('/en/')).toBe(true);
  });
  test('jede Route hat eine englische Adresse; die Paare sind eindeutig', () => {
    expect(new Set(ROUTES.map((r) => r.de)).size).toBe(ROUTES.length);
    expect(ROUTES).toHaveLength(21);
    for (const r of ROUTES) expect(r.en.startsWith('/en/')).toBe(true);
  });
  test('festgelegte englische Adressen', () => {
    const m = new Map(ROUTES.map((r) => [r.de, r.en]));
    expect(m.get('/produkt/discovery/')).toBe('/en/product/discovery/');
    expect(m.get('/produkt/datenqualitaet/')).toBe('/en/product/data-quality/');
    expect(m.get('/produkt/topologie-impact/')).toBe('/en/product/topology-impact/');
    expect(m.get('/produkt/verwaltung/')).toBe('/en/product/administration/');
    expect(m.get('/produkt/betrieb/')).toBe('/en/product/operations/');
    expect(m.get('/geraete/')).toBe('/en/devices/');
    expect(m.get('/loesungen/msp/')).toBe('/en/solutions/msp/');
    expect(m.get('/impressum/')).toBe('/en/legal-notice/');
    expect(m.get('/datenschutz/')).toBe('/en/privacy/');
    expect(m.get('/agb/')).toBe('/en/terms/');
    expect(m.get('/subprozessoren/')).toBe('/en/subprocessors/');
    expect(m.get('/barrierefreiheit/')).toBe('/en/accessibility/');
  });
  test('Dankeseite und Demo (gemeinsames Konto mit Zugangsdaten) sind noindex', () => {
    expect(ROUTES.filter((r) => r.noindex).map((r) => r.de)).toEqual(['/demo/', '/kontakt/danke/']);
  });
  test('die echte Sitemap führt weder /demo/ noch die Dankeseite', () => {
    const locs = [...sitemapXml(ROUTES, 'https://example.test').matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
    expect(locs.length).toBeGreaterThan(5);
    expect(locs.some((l) => l.includes('/demo/') || l.includes('/danke/'))).toBe(false);
  });
  test('von der Spezifikation genannte Paare', () => {
    const m = new Map(ROUTES.map((r) => [r.de, r.en]));
    expect(m.get('/preise/')).toBe('/en/pricing/');
    expect(m.get('/sicherheit/')).toBe('/en/security/');
    expect(m.get('/kontakt/danke/')).toBe('/en/contact/thanks/');
    expect(m.get('/')).toBe('/en/');
  });
});

describe('homeSwitchTarget (Seiten ohne Gegenstück)', () => {
  const R = (en: 'gebaut' | 'geplant'): Route[] => [{ de: '/', en: '/en/', status: 'gebaut', enStatus: en }];
  test('Startseite der anderen Sprache, wenn sie gebaut ist', () => {
    expect(homeSwitchTarget('de', R('gebaut'))).toBe('/en/');
    expect(homeSwitchTarget('en', R('gebaut'))).toBe('/');
  });
  test('sonst nichts: kein „kommt bald“ ohne Gegenstück', () => {
    expect(homeSwitchTarget('de', R('geplant'))).toBeNull();
    expect(homeSwitchTarget('en', R('geplant'))).toBe('/');
  });
});
