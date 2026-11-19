import { expect, type APIResponse } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

/** Die sechs Sicherheitskopfzeilen der Website mit den Werten aus public/.htaccess (Spec §8). */
const htaccess = readFileSync(join(process.cwd(), 'public/.htaccess'), 'utf8');
const value = (name: string) => new RegExp(`^Header always set ${name} "([^"]+)"`, 'm').exec(htaccess)![1];
export const SECURITY_HEADERS: Record<string, string> = {
  'strict-transport-security': value('Strict-Transport-Security'),
  'content-security-policy': value('Content-Security-Policy'),
  'x-content-type-options': value('X-Content-Type-Options'),
  'referrer-policy': value('Referrer-Policy'),
  'cross-origin-opener-policy': value('Cross-Origin-Opener-Policy'),
  'permissions-policy': value('Permissions-Policy'),
};

/**
 * Antwort von /api/lead.php wie beim Hoster (S-04, S-05, S-07): jede Sicherheitskopfzeile genau einmal mit dem Wert der Website,
 * keine Kopfzeile doppelt (außer Set-Cookie, das es nicht geben darf), kein X-Powered-By, nie im Zwischenspeicher.
 */
export function expectApiHeaders(r: APIResponse, label: string) {
  const all = r.headersArray().map((h) => ({ name: h.name.toLowerCase(), value: h.value }));
  for (const [name, expected] of Object.entries(SECURITY_HEADERS)) {
    expect(all.filter((h) => h.name === name).map((h) => h.value), `${label}: ${name}`).toEqual([expected]);
  }
  const names = all.map((h) => h.name);
  const dup = [...new Set(names.filter((n, i) => names.indexOf(n) !== i))];
  expect(dup.map((n) => `${n}: ${all.filter((h) => h.name === n).map((h) => h.value).join(' | ')}`), `${label}: doppelte Kopfzeilen`).toEqual([]);
  expect(names, `${label}: X-Powered-By`).not.toContain('x-powered-by');
  expect(names, `${label}: Set-Cookie`).not.toContain('set-cookie');
  expect(r.headers()['cache-control'], `${label}: Cache-Control`).toBe('no-store');
}
