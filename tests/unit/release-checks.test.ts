import { describe, expect, test } from 'vitest';
import { checkClaims, checkDevPages, checkDistHtml, checkNotEmpty, checkRoutes, checkScreenshotFiles, checkScreenshots, checkSite } from '../../scripts/lib/release-checks.mjs';

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
    expect(checkSite({ email: null, phone: null, managingDirector: 'X', registerCourt: 'Y', registerNumber: 'Z', vatId: 'V' })).toEqual(['Anbieter: E-Mail-Adresse fehlt', 'Anbieter: Telefonnummer fehlt']);
  });
  test('Entwicklungsseiten im Build werden gemeldet', () => {
    expect(checkDevPages(['index.html', 'dev', 'dev/bausteine'])).toHaveLength(2);
    expect(checkDevPages(['index.html', 'device'])).toEqual([]);
  });

  const full = { email: 'a@b.de', phone: '1', managingDirector: 'X', registerCourt: 'Y', registerNumber: 'Z', vatId: 'DE1' };
  test.each([
    ['managingDirector', 'Anbieter: Geschäftsführung fehlt'],
    ['registerCourt', 'Anbieter: Registergericht fehlt'],
    ['registerNumber', 'Anbieter: Registernummer fehlt'],
    ['vatId', 'Anbieter: USt-IdNr. fehlt'],
    ['email', 'Anbieter: E-Mail-Adresse fehlt'],
    ['phone', 'Anbieter: Telefonnummer fehlt'],
  ])('Anbieterfeld %s fehlt', (key, msg) => {
    expect(checkSite(full)).toEqual([]);
    expect(checkSite({ ...full, [key]: null })).toEqual([msg]);
    expect(checkSite({ ...full, [key]: '   ' })).toEqual([msg]);
    expect(checkSite({ ...full, [key]: '' })).toEqual([msg]);
  });
  test('Platzhalter in gebauter Seite wird gemeldet', () => {
    expect(checkDistHtml([{ path: 'dist/index.html', html: '<div class="rt-slot-label" data-placeholder="S-04">' }])).toEqual([
      'dist/index.html: Platzhalter für S-04',
    ]);
  });
  test('Seite ohne Platzhalter ist in Ordnung', () => {
    expect(checkDistHtml([{ path: 'dist/index.html', html: '<img src="/screenshots/a.png">' }])).toEqual([]);
  });
  test('Bilddatei fehlt auf Platte', () => {
    const exists = (p: string) => p === 'public/screenshots/ok.png';
    expect(
      checkScreenshotFiles([{ id: 'S-01', file: 'ok.png' }, { id: 'S-02', file: 'weg.png' }, { id: 'S-03', file: '/x/y.png' }, { id: 'S-04' }], exists),
    ).toEqual(['S-02: Bilddatei fehlt auf Platte', 'S-03: Bilddatei fehlt auf Platte']);
  });
  test('leere Daten sperren den Release', () => {
    expect(checkNotEmpty([], [], [])).toEqual(['Claim-Register ist leer', 'Screenshot-Liste ist leer', 'Routen-Liste ist leer']);
    expect(checkNotEmpty([1], [1], [1])).toEqual([]);
  });
});
