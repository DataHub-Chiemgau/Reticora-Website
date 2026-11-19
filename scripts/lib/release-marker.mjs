// Freigabe-Marke dist/.release (Deploy-Sperre). Nur `scripts/check-release.mjs` schreibt sie, und nur nach bestandener Prüfung
// unter RETICORA_RELEASE=1; jeder Build löscht sie zuerst. So trägt ein dist/ mit offenen Mängeln nie die Marke.
// scripts/deploy/package.mjs verweigert das Paket ohne sie. Die Datei beginnt mit einem Punkt (public/.htaccess sperrt sie), das Paket lässt sie weg.
import { rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

export const MARKER_FILE = '.release';
export const MARKER_CONTENT = 'RETICORA_RELEASE=1\n';

export function clearReleaseMarker(distDir) {
  rmSync(join(distDir, MARKER_FILE), { force: true });
}

/** Schreibt die Marke nur, wenn RETICORA_RELEASE=1 gesetzt ist. */
export function writeReleaseMarker(distDir, env = process.env) {
  if (env.RETICORA_RELEASE !== '1') return false;
  writeFileSync(join(distDir, MARKER_FILE), MARKER_CONTENT);
  return true;
}
