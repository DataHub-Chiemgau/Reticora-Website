// /.well-known/security.txt nach RFC 9116 (Spec Ä-13). Entsteht nur, wenn SITE.securityContact gesetzt ist.

const DAY = 86_400_000;

/** `Contact` als URI: mailto:/https: bleibt, eine bloße E-Mail-Adresse bekommt mailto:. Alles andere ist ein Fehler. */
export function contactUri(contact) {
  const c = String(contact).trim();
  if (/^(mailto:[^\s@]+@[^\s@]+\.[^\s@]+|https:\/\/[^\s]+)$/i.test(c)) return c;
  if (/^[^\s@:]+@[^\s@]+\.[^\s@]+$/.test(c)) return `mailto:${c}`;
  throw new Error(`securityContact ist keine E-Mail-Adresse und keine mailto:/https:-Adresse: ${JSON.stringify(c)}`);
}

/** Inhalt der Datei; `Expires` ist das Build-Datum plus 180 Tage (UTC, ohne Millisekunden). */
export function securityTxt(contact, buildDate, siteUrl) {
  const expires = new Date(buildDate.getTime() + 180 * DAY).toISOString().replace(/\.\d{3}Z$/, 'Z');
  return [
    `Contact: ${contactUri(contact)}`,
    `Expires: ${expires}`,
    'Preferred-Languages: de, en',
    `Canonical: ${siteUrl.replace(/\/$/, '')}/.well-known/security.txt`,
    '',
  ].join('\n');
}
