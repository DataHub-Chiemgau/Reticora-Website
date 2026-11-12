import { describe, expect, test } from 'vitest';
import { decide } from '../../scripts/lib/lhci-retry.mjs';

describe('Lighthouse-Wiederholung', () => {
  test('Exit 0 ist bestanden', () => expect(decide(0, '')).toBe('pass'));
  test('Laufzeitfehler ohne Grenzwertverletzung: einmal wiederholen', () => {
    const out = 'Runtime error encountered: Something went wrong with recording the trace over your page load. (NO_NAVSTART)';
    expect(decide(1, out)).toBe('retry');
  });
  test('nach einer Wiederholung nie ein zweites Mal', () => {
    expect(decide(1, 'Runtime error encountered: NO_NAVSTART', true)).toBe('fail');
  });
  test('verletzter Grenzwert scheitert sofort, auch mit Laufzeitfehler im Text', () => {
    expect(decide(1, '✘  largest-contentful-paint failure for maxNumericValue assertion\nassertion failed')).toBe('fail');
    expect(decide(1, 'Runtime error encountered ... \n✘ categories:performance failure')).toBe('fail');
  });
  test('anderer Fehler scheitert', () => expect(decide(1, 'ECONNREFUSED')).toBe('fail'));
});
