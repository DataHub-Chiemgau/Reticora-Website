#!/usr/bin/env node
// Erzeugt die Konfiguration der Vorschau (config.preview.php) aus Umgebungsvariablen und schreibt sie auf STDOUT.
// Der Deploy-Workflow leitet die Ausgabe über STDIN per SSH auf den Host (Modus 600); nichts davon landet in einer Befehlszeile.
//
// Jeder Wert wird als PHP-Zeichenkette in der Schreibweise von var_export() ausgegeben (einfache Anführungszeichen, nur \ und '
// maskiert), nie in PHP-Code eingesetzt. Fehlt eine Variable oder ist ein Wert unzulässig, endet das Skript mit Exit 1 und nennt
// nur Variablennamen, nie Werte.
//
// Variablen: PREVIEW_DB_DSN, PREVIEW_DB_USER, PREVIEW_DB_PASSWORD, PREVIEW_SMTP_HOST, PREVIEW_SMTP_PORT (587 oder 465),
// PREVIEW_SMTP_USER, PREVIEW_SMTP_PASSWORD, PREVIEW_MAIL_FROM, PREVIEW_MAIL_TO, PREVIEW_URL.
// Aufbewahrung 30 Tage ab Eingang (Entscheidung 2026-11-19). Das Backend braucht kein eigenes Geheimnis in der Konfiguration
// (der Schlüssel der Ratenbegrenzung entsteht in der Datenbank), daher wird hier keins erzeugt.
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

export const REQUIRED = [
  'PREVIEW_DB_DSN',
  'PREVIEW_DB_USER',
  'PREVIEW_DB_PASSWORD',
  'PREVIEW_SMTP_HOST',
  'PREVIEW_SMTP_PORT',
  'PREVIEW_SMTP_USER',
  'PREVIEW_SMTP_PASSWORD',
  'PREVIEW_MAIL_FROM',
  'PREVIEW_MAIL_TO',
  'PREVIEW_URL',
];

/** var_export() für eine Zeichenkette: in einfachen Anführungszeichen, \ und ' mit Gegenschrägstrich. */
export function phpString(v) {
  return `'${v.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
}

/** @returns {string} PHP-Quelltext; wirft Error mit einer Meldung ohne Werte. */
export function buildConfig(env) {
  const missing = REQUIRED.filter((n) => typeof env[n] !== 'string' || env[n].trim() === '');
  if (missing.length) throw new Error(`Variablen fehlen oder sind leer: ${missing.join(', ')}`);
  const v = Object.fromEntries(REQUIRED.map((n) => [n, env[n]]));
  // Nullbytes können in Umgebungsvariablen nicht vorkommen; PHP-Zeichenketten in einfachen Anführungszeichen vertragen sonst alles.
  const port = Number(v.PREVIEW_SMTP_PORT.trim());
  // Verschlüsselung gibt es nur in den Formen des Backends: 465 = ssl (implizites TLS), 587 = starttls.
  const encryption = { 587: 'starttls', 465: 'ssl' }[port];
  if (!Number.isInteger(port) || !encryption) throw new Error('PREVIEW_SMTP_PORT muss 587 oder 465 sein');
  let url;
  try {
    url = new URL(v.PREVIEW_URL.trim());
  } catch {
    throw new Error('PREVIEW_URL ist keine gültige Adresse');
  }
  if (url.protocol !== 'https:') throw new Error('PREVIEW_URL muss mit https:// beginnen');
  const siteUrl = `${url.protocol}//${url.host}`;
  // Passwörter bleiben unverändert (auch mit Leerzeichen am Rand); nur die Adresse wird normalisiert.
  const s = (name) => phpString(name === 'PREVIEW_URL' ? siteUrl : v[name]);
  return `<?php

// Konfiguration der Vorschau, erzeugt von scripts/deploy/preview-config.mjs aus den Secrets der GitHub-Umgebung "preview".
// Nicht von Hand ändern und nirgends einchecken.
return [
    'site_url' => ${s('PREVIEW_URL')},
    'contact_email' => ${s('PREVIEW_MAIL_TO')},
    // 30 Tage nach Eingang (Entscheidung 2026-11-19)
    'retention_days' => 30,
    'db' => [
        'dsn' => ${s('PREVIEW_DB_DSN')},
        'user' => ${s('PREVIEW_DB_USER')},
        'pass' => ${s('PREVIEW_DB_PASSWORD')},
    ],
    'mail' => [
        'transport' => 'smtp',
        'host' => ${s('PREVIEW_SMTP_HOST')},
        'port' => ${port},
        'encryption' => ${phpString(encryption)},
        'user' => ${s('PREVIEW_SMTP_USER')},
        'pass' => ${s('PREVIEW_SMTP_PASSWORD')},
        'helo_name' => ${phpString(url.hostname)},
        'timeout' => 10,
        'deadline' => 15,
        'from_address' => ${s('PREVIEW_MAIL_FROM')},
        'from_name' => 'Reticora Website (Vorschau)',
        'to_address' => ${s('PREVIEW_MAIL_TO')},
        'allow_insecure' => false,
    ],
    'log_path' => '',
];
`;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    process.stdout.write(buildConfig(process.env));
  } catch (e) {
    console.error(`preview-config: ${e.message}`);
    process.exit(1);
  }
}
