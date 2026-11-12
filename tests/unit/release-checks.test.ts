import { describe, expect, test } from 'vitest';
import { checkClaims, checkDevPages, checkDistHtml, checkInternalLinks, checkNotEmpty, checkRoutes, checkRoutesBuilt, checkScreenshotFiles, checkScreenshots, checkSite } from '../../scripts/lib/release-checks.mjs';

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

  test('Claim mit leerem Namen oder ungültigem Datum wird gemeldet', () => {
    const ok = { id: 'C-05', status: 'geprüft', checkedBy: 'A', checkedOn: '2026-11-12' };
    expect(checkClaims([ok])).toEqual([]);
    expect(checkClaims([{ ...ok, checkedBy: '   ' }])).toHaveLength(1);
    expect(checkClaims([{ ...ok, checkedOn: '12.11.2026' }])).toHaveLength(1);
    expect(checkClaims([{ ...ok, checkedOn: '2026-13-45x' }])).toHaveLength(1);
    expect(checkClaims([{ ...ok, checkedOn: '' }])).toHaveLength(1);
  });
  test.each(['todo', 'TODO', 'Tbd', 'xxx', '?', ' ? '])('Platzhalterwert %j im Anbieterfeld zählt als fehlend', (v) => {
    expect(checkSite({ ...full, vatId: v })).toEqual(['Anbieter: USt-IdNr. fehlt']);
  });
  test('gebaute Route muss in dist für de und en existieren', () => {
    const routes = [
      { de: '/', en: '/en/', status: 'gebaut', enStatus: 'gebaut' },
      { de: '/a/', en: null, status: 'gebaut', enStatus: 'geplant' },
      { de: '/b/', en: '/en/b/', status: 'geplant', enStatus: 'geplant' },
    ];
    const exists = (p: string) => ['index.html', 'a/index.html'].includes(p);
    expect(checkRoutesBuilt(routes, exists)).toEqual(['/en/: Seite fehlt in dist']);
    expect(checkRoutesBuilt(routes, () => true)).toEqual([]);
    expect(checkRoutesBuilt(routes, () => false)).toEqual(['/: Seite fehlt in dist', '/en/: Seite fehlt in dist', '/a/: Seite fehlt in dist']);
  });
  test('englische Seite zählt nur, wenn enStatus gebaut ist; geplante englische Seite blockiert den Release', () => {
    const routes = [{ de: '/', en: '/en/', status: 'gebaut', enStatus: 'geplant' }];
    expect(checkRoutesBuilt(routes, () => false)).toEqual(['/: Seite fehlt in dist']);
    expect(checkRoutes(routes)).toEqual(['/en/: Seite nur geplant, nicht gebaut']);
    expect(checkRoutes([{ de: '/', en: '/en/', status: 'gebaut', enStatus: 'gebaut' }])).toEqual([]);
  });
  test('interner Link auf nicht gebaute Seite wird gemeldet', () => {
    const exists = (p: string) => ['index.html', 'a/index.html', 'x.svg', '_astro/s.css'].includes(p);
    const pages = [{
      path: 'dist/index.html',
      html: '<a href="/en/">EN</a><a href="/a/#frag">A</a><a href="/a/?q=1">A</a><link rel="icon" href="/x.svg"><link href="/_astro/s.css"><a href="https://x.de/">ext</a><a href="//cdn.x/y">ext</a><a href="#top">t</a><a href="mailto:a@b.de">m</a><img src="/weg.png">',
    }];
    expect(checkInternalLinks(pages, exists)).toEqual(['dist/index.html: /en/ nicht gebaut', 'dist/index.html: /weg.png nicht gebaut']);
    expect(checkInternalLinks([{ path: 'dist/index.html', html: '<a href="/">x</a>' }], exists)).toEqual([]);
  });
});
