import { describe, expect, test } from 'vitest';
import { checkClaims, checkDevPages, checkRoutes, checkScreenshots, checkSite } from '../../scripts/lib/release-checks.mjs';

describe('Release-Prüfungen', () => {
  test('offener Claim wird mit ID gemeldet', () => {
    expect(checkClaims([{ id: 'C-01', status: 'offen' }])).toEqual(['C-01: nicht geprüft']);
  });
  test('geprüfter Claim ohne Name oder Datum wird gemeldet', () => {
    expect(checkClaims([{ id: 'C-02', status: 'geprüft' }])).toEqual(['C-02: Name oder Datum der Prüfung fehlt']);
    expect(checkClaims([{ id: 'C-03', status: 'geprüft', checkedBy: 'A' }])).toHaveLength(1);
  });
  test('vollständig geprüfter Claim ist in Ordnung', () => {
    expect(checkClaims([{ id: 'C-04', status: 'geprüft', checkedBy: 'A', checkedOn: '2026-11-12' }])).toEqual([]);
  });
  test('Screenshot ohne Datei wird gemeldet', () => {
    expect(checkScreenshots([{ id: 'S-02' }, { id: 'S-03', file: 'x.png' }])).toEqual(['S-02: Bild fehlt']);
  });
  test('geplante Seite wird gemeldet, gebaute nicht', () => {
    expect(checkRoutes([{ de: '/a/', en: null, status: 'geplant' }, { de: '/', en: null, status: 'gebaut' }])).toEqual([
      '/a/: Seite nur geplant, nicht gebaut',
    ]);
  });
  test('fehlende E-Mail-Adresse und Telefonnummer des Anbieters werden gemeldet', () => {
    expect(checkSite({ email: null, phone: null })).toEqual(['Anbieter: E-Mail-Adresse fehlt', 'Anbieter: Telefonnummer fehlt']);
    expect(checkSite({ email: 'a@b.de', phone: '1' })).toEqual([]);
  });
  test('Entwicklungsseiten im Build werden gemeldet', () => {
    expect(checkDevPages(['index.html', 'dev', 'dev/bausteine'])).toHaveLength(2);
    expect(checkDevPages(['index.html', 'device'])).toEqual([]);
  });
});
