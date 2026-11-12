import { describe, expect, test } from 'vitest';
import { robotsTxt, sitemapEntries, sitemapXml } from '../../src/lib/discover';
import { alternates, isBuilt, switchTarget, type Route } from '../../src/i18n/routes';

const R = (de: string, en: string, status: Route['status'], enStatus: Route['enStatus'], extra: Partial<Route> = {}): Route => ({ de, en, status, enStatus, ...extra });
const FAKE: Route[] = [
  R('/', '/en/', 'gebaut', 'geplant'),
  R('/a/', '/en/a/', 'gebaut', 'gebaut'),
  R('/b/', '/en/b/', 'geplant', 'gebaut'),
  R('/c/', '/en/c/', 'geplant', 'geplant'),
  R('/danke/', '/en/thanks/', 'gebaut', 'gebaut', { noindex: true }),
];

describe('Sprachpaare mit eigener Routentabelle', () => {
  test('nur status gebaut macht die englische Seite nicht gebaut', () => {
    expect(isBuilt('/', FAKE)).toBe(true);
    expect(isBuilt('/en/', FAKE)).toBe(false);
    expect(switchTarget('/', FAKE)).toBeNull();
    expect(alternates('/', FAKE)).toBeNull();
  });
  test('gebautes Paar: Umschalter beidseitig, hreflang de/en/x-default gegenseitig gleich', () => {
    expect(switchTarget('/a/', FAKE)).toBe('/en/a/');
    expect(switchTarget('/en/a/', FAKE)).toBe('/a/');
    const want = { de: '/a/', en: '/en/a/', xDefault: '/a/' };
    expect(alternates('/a/', FAKE)).toEqual(want);
    expect(alternates('/en/a/', FAKE)).toEqual(want);
  });
  test('nur englische Seite gebaut, deutsche nicht: kein Paar', () => {
    expect(switchTarget('/en/b/', FAKE)).toBeNull();
    expect(alternates('/en/b/', FAKE)).toBeNull();
  });
  test('ungebaut oder unbekannt: nichts', () => {
    expect(switchTarget('/c/', FAKE)).toBeNull();
    expect(alternates('/404/', FAKE)).toBeNull();
  });
});

describe('Sitemap', () => {
  const locs = sitemapEntries(FAKE).map((e) => e.loc);
  test('nur gebaute Adressen, noindex ausgeschlossen', () => {
    expect(locs).toEqual(['/', '/a/', '/en/a/', '/en/b/']);
  });
  test('Alternativen nur bei gebautem Paar', () => {
    const m = new Map(sitemapEntries(FAKE).map((e) => [e.loc, e.alternates]));
    expect(m.get('/')).toEqual([]);
    expect(m.get('/en/b/')).toEqual([]);
    expect(m.get('/a/')).toEqual([
      { hreflang: 'de', href: '/a/' },
      { hreflang: 'en', href: '/en/a/' },
      { hreflang: 'x-default', href: '/a/' },
    ]);
    expect(m.get('/en/a/')).toEqual(m.get('/a/'));
  });
  test('XML mit Ursprung und Namensraum', () => {
    const x = sitemapXml(FAKE, 'https://x.de');
    expect(x).toContain('<loc>https://x.de/en/a/</loc>');
    expect(x).toContain('hreflang="x-default" href="https://x.de/a/"');
    expect(x).not.toContain('thanks');
    expect(x).toContain('xmlns:xhtml=');
  });
});

describe('robots.txt', () => {
  test('Release erlaubt, Entwicklung sperrt; beide nennen die Sitemap', () => {
    expect(robotsTxt(true, 'https://x.de')).toBe('User-agent: *\nAllow: /\n\nSitemap: https://x.de/sitemap.xml\n');
    expect(robotsTxt(false, 'https://x.de')).toBe('User-agent: *\nDisallow: /\n\nSitemap: https://x.de/sitemap.xml\n');
  });
});
