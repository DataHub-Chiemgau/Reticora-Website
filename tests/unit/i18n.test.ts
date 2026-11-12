import { describe, expect, test } from 'vitest';
import { UI as DE } from '../../src/i18n/de';
import { UI as EN } from '../../src/i18n/en';
import { counterpart, dePath, isBuilt, localize, ui } from '../../src/i18n';

const keys = (o: unknown, prefix = ''): string[] =>
  Array.isArray(o)
    ? o.flatMap((v, i) => keys(v, `${prefix}[${i}]`))
    : o && typeof o === 'object'
      ? Object.entries(o).flatMap(([k, v]) => keys(v, `${prefix}.${k}`))
      : [prefix];
const leaves = (o: unknown, prefix = ''): [string, unknown][] =>
  Array.isArray(o)
    ? o.flatMap((v, i) => leaves(v, `${prefix}[${i}]`))
    : o && typeof o === 'object'
      ? Object.entries(o).flatMap(([k, v]) => leaves(v, `${prefix}.${k}`))
      : [[prefix, o]];

describe('ui()', () => {
  test('de und en haben genau dieselben Schlüssel', () => {
    expect(keys(EN)).toEqual(keys(DE));
  });
  test('ui liefert je Sprache die eigene Tabelle', () => {
    expect(ui('de')).toBe(DE);
    expect(ui('en')).toBe(EN);
  });
  test('Adressen (href, match) sind in beiden Sprachen gleich und deutsch', () => {
    const hrefs = (o: unknown) => leaves(o).filter(([k]) => /(href|match)$/i.test(k));
    expect(hrefs(EN)).toEqual(hrefs(DE));
  });
  test('kein englischer Text ist leer, keiner ist der deutsche Text (außer Eigennamen)', () => {
    const same = new Set(['Discovery', 'Compliance', 'API', 'Collector']);
    const de = new Map(leaves(DE));
    for (const [k, v] of leaves(EN)) {
      expect(String(v).trim(), k).not.toBe('');
      if (!/(href|match|\.key|\.de$|\.en$|\.lang\.)/i.test(k) && typeof v === 'string' && !same.has(v)) {
        expect(v, k).not.toBe(de.get(k));
      }
    }
  });
  test('vorgegebene Übersetzungen', () => {
    expect(EN.b2b).toBe('Offer for businesses only.');
    expect(EN.actions.login).toBe('Sign in');
    expect(EN.topo.group).toBe('Simulate outage');
  });
});

describe('Sprachpaare', () => {
  test('counterpart in beide Richtungen', () => {
    expect(counterpart('/preise/')).toBe('/en/pricing/');
    expect(counterpart('/en/pricing/')).toBe('/preise/');
    expect(counterpart('/produkt/datenqualitaet/')).toBe('/en/product/data-quality/');
    expect(counterpart('/en/legal-notice/')).toBe('/impressum/');
    expect(counterpart('/')).toBe('/en/');
    expect(counterpart('/en/')).toBe('/');
  });
  test('counterpart ohne Paar', () => {
    expect(counterpart('/404/')).toBeNull();
    expect(counterpart('/dev/bausteine/')).toBeNull();
  });
  test('localize', () => {
    expect(localize('/loesungen/isp/', 'en')).toBe('/en/solutions/isp/');
    expect(localize('/loesungen/isp/', 'de')).toBe('/loesungen/isp/');
    expect(localize('/', 'en')).toBe('/en/');
    expect(localize('/kontakt/#formular', 'en')).toBe('/en/contact/#formular');
  });
  test('localize meldet unbekannte Adressen', () => {
    expect(() => localize('/gibt-es-nicht/', 'en')).toThrow(/unbekannte Adresse/);
  });
  test('dePath', () => {
    expect(dePath('/en/security/')).toBe('/sicherheit/');
    expect(dePath('/sicherheit/')).toBe('/sicherheit/');
  });
  test('isBuilt: Startseite ja, englische Seiten noch nicht, unbekannt nein', () => {
    expect(isBuilt('/')).toBe(true);
    expect(isBuilt('/en/')).toBe(false);
    expect(isBuilt('/en/product/discovery/')).toBe(false);
    expect(isBuilt('/404/')).toBe(false);
    expect(isBuilt(null)).toBe(false);
  });
});
