#!/usr/bin/env node
// Geplanter Warnlauf (.github/workflows/security-txt.yml): erzeugt die security.txt wie der Release-Build
// und prüft, dass Expires mindestens 30 Tage voraus liegt. Ohne Meldeadresse nur ein Hinweis, Exit-Code 0.
// Optional: SECURITY_TXT_URL prüft zusätzlich die ausgelieferte Datei (öffentliche URL, kein Geheimnis).
import { SITE } from '../src/data/site.ts';
import { securityTxt } from './lib/security-txt.mjs';
import { checkSecurityTxt } from './lib/security-txt-check.mjs';

const now = new Date();
const results = [];
const generated = SITE.securityContact ? securityTxt(SITE.securityContact, now, SITE.url) : null;
results.push(['erzeugt', checkSecurityTxt({ expected: Boolean(SITE.securityContact), text: generated, now })]);

const url = process.env.SECURITY_TXT_URL;
if (url && SITE.securityContact) {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(15_000) });
    results.push(['ausgeliefert', checkSecurityTxt({ expected: true, text: res.ok ? await res.text() : null, now })]);
  } catch (e) {
    results.push(['ausgeliefert', { status: 'fail', message: `Abruf von ${url} fehlgeschlagen: ${e.message}` }]);
  }
}

let failed = false;
for (const [what, r] of results) {
  const line = `security.txt (${what}): ${r.message}`;
  if (r.status === 'fail') { failed = true; console.error(`::error::${line}`); }
  else if (r.status === 'notice') console.log(`::notice::${line}`);
  else console.log(line);
}
process.exit(failed ? 1 : 0);
