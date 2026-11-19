// Warnlauf für /.well-known/security.txt (Spec Ä-13): `Expires` darf nicht näher als 30 Tage rücken.
const DAY = 86_400_000;
export const MIN_DAYS = 30;

/** `Expires` einer security.txt als Date, oder null, wenn die Zeile fehlt oder kein Datum ist. */
export function parseExpires(text) {
  const m = /^Expires:\s*(\S+)\s*$/im.exec(String(text));
  if (!m) return null;
  const d = new Date(m[1]);
  return Number.isNaN(d.getTime()) ? null : d;
}

/**
 * Reine Prüfung. `text` ist null, wenn keine Datei erwartet wird (keine Meldeadresse) oder keine vorliegt.
 * Ergebnis: { status: 'notice' | 'ok' | 'fail', message }.
 */
export function checkSecurityTxt({ expected, text, now, minDays = MIN_DAYS }) {
  if (!expected) return { status: 'notice', message: 'Keine security.txt erwartet: SITE.securityContact ist nicht gesetzt (offen für den Auftraggeber).' };
  if (text == null || text === '') return { status: 'fail', message: 'security.txt wird erwartet, liegt aber nicht vor.' };
  const expires = parseExpires(text);
  if (!expires) return { status: 'fail', message: 'security.txt enthält kein lesbares Expires.' };
  const days = Math.floor((expires.getTime() - now.getTime()) / DAY);
  if (days < minDays) return { status: 'fail', message: `Expires ${expires.toISOString()} liegt nur ${days} Tage voraus (Mindestens ${minDays}).` };
  return { status: 'ok', message: `Expires ${expires.toISOString()} liegt ${days} Tage voraus.` };
}
