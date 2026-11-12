import { describe, expect, test } from 'vitest';
import { ROUTES } from '../../src/i18n/routes';

describe('ROUTES', () => {
  test('alle Adressen beginnen und enden mit Schrägstrich', () => {
    for (const r of ROUTES) for (const p of [r.de, r.en]) if (p !== null) expect(p).toMatch(/^\/.*\/$|^\/$/);
  });
  test('keine englische Adresse ist nur das deutsche Muster mit Präfix (Ausnahme: /demo/, laut Spezifikation gleich)', () => {
    for (const r of ROUTES) if (r.de !== '/' && r.de !== '/demo/') expect(r.en).not.toBe(`/en${r.de}`);
  });
  test('englische Adressen sind eindeutig und beginnen mit /en/', () => {
    const en = ROUTES.map((r) => r.en).filter((x): x is string => x !== null);
    expect(new Set(en).size).toBe(en.length);
    for (const p of en) expect(p.startsWith('/en/')).toBe(true);
  });
  test('von der Spezifikation genannte Paare', () => {
    const m = new Map(ROUTES.map((r) => [r.de, r.en]));
    expect(m.get('/preise/')).toBe('/en/pricing/');
    expect(m.get('/sicherheit/')).toBe('/en/security/');
    expect(m.get('/kontakt/danke/')).toBe('/en/contact/thanks/');
    expect(m.get('/')).toBe('/en/');
  });
});
