import { describe, expect, test } from 'vitest';
import { checkSecurityTxt, parseExpires } from '../../scripts/lib/security-txt-check.mjs';
import { securityTxt } from '../../scripts/lib/security-txt.mjs';

const now = new Date('2026-11-12T00:00:00Z');
const file = (iso: string) => `Contact: mailto:a@b.de\nExpires: ${iso}\n`;

describe('security.txt-Warnlauf', () => {
  test('ohne erwartete Datei nur ein Hinweis', () => {
    const r = checkSecurityTxt({ expected: false, text: null, now });
    expect(r.status).toBe('notice');
    expect(r.message).toContain('securityContact');
  });
  test('erzeugte Datei (Build-Datum + 180 Tage) besteht', () => {
    expect(checkSecurityTxt({ expected: true, text: securityTxt('a@b.de', now, 'https://x.de'), now }).status).toBe('ok');
  });
  test('Expires in 29 Tagen scheitert, in 30 Tagen besteht', () => {
    expect(checkSecurityTxt({ expected: true, text: file('2026-12-11T00:00:00Z'), now }).status).toBe('fail');
    expect(checkSecurityTxt({ expected: true, text: file('2026-12-12T00:00:00Z'), now }).status).toBe('ok');
  });
  test('abgelaufene, fehlende und unlesbare Angaben scheitern', () => {
    expect(checkSecurityTxt({ expected: true, text: file('2026-01-01T00:00:00Z'), now }).status).toBe('fail');
    expect(checkSecurityTxt({ expected: true, text: null, now }).status).toBe('fail');
    expect(checkSecurityTxt({ expected: true, text: 'Contact: mailto:a@b.de\n', now }).status).toBe('fail');
    expect(checkSecurityTxt({ expected: true, text: file('bald'), now }).status).toBe('fail');
  });
  test('parseExpires liest die Zeile unabhängig von der Schreibweise', () => {
    expect(parseExpires('expires: 2027-01-01T00:00:00Z')?.getUTCFullYear()).toBe(2027);
    expect(parseExpires('nichts')).toBeNull();
  });
});
