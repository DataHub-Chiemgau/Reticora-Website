import { describe, expect, test } from 'vitest';
import { eur, grouped, pct } from '../../src/lib/format';

const NBSP = '\u00a0';

describe('format deutsch (Standard)', () => {
  test('Tausendertrenner Punkt', () => {
    expect(grouped(1190)).toBe('1.190');
    expect(grouped(100000)).toBe('100.000');
    expect(grouped(999)).toBe('999');
    expect(grouped(1190, 'de')).toBe('1.190');
  });
  test('Euro hinter dem Betrag mit geschütztem Leerzeichen', () => {
    expect(eur(49)).toBe(`49${NBSP}€`);
    expect(eur(1190)).toBe(`1.190${NBSP}€`);
    expect(eur(0.05)).toBe(`0,05${NBSP}€`);
    expect(eur(1234.5, 'de')).toBe(`1.234,50${NBSP}€`);
  });
  test('Prozent mit geschütztem Leerzeichen', () => {
    expect(pct(0.2)).toBe(`20${NBSP}%`);
    expect(pct(0.1, 'de')).toBe(`10${NBSP}%`);
  });
});

describe('format englisch', () => {
  test('Tausendertrenner Komma', () => {
    expect(grouped(1190, 'en')).toBe('1,190');
    expect(grouped(100000, 'en')).toBe('100,000');
    expect(grouped(42, 'en')).toBe('42');
  });
  test('Euro vor dem Betrag ohne Leerzeichen, Dezimalpunkt', () => {
    expect(eur(49, 'en')).toBe('€49');
    expect(eur(1190, 'en')).toBe('€1,190');
    expect(eur(0.05, 'en')).toBe('€0.05');
    expect(eur(1234.5, 'en')).toBe('€1,234.50');
  });
  test('Prozent ohne Leerzeichen', () => {
    expect(pct(0.2, 'en')).toBe('20%');
    expect(pct(0.125, 'en')).toBe('13%');
  });
});
