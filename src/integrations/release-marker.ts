import type { AstroIntegration } from 'astro';
import { fileURLToPath } from 'node:url';
import { clearReleaseMarker } from '../../scripts/lib/release-marker.mjs';

/**
 * Deploy-Sperre: Jeder Build löscht `dist/.release`. Geschrieben wird die Marke erst von `scripts/check-release.mjs`,
 * wenn `npm run build:release` (RETICORA_RELEASE=1) die Release-Prüfung bestanden hat (siehe scripts/lib/release-marker.mjs).
 */
export default function releaseMarker(): AstroIntegration {
  return {
    name: 'reticora-release-marker',
    hooks: {
      'astro:build:done': ({ dir }) => {
        clearReleaseMarker(fileURLToPath(dir));
      },
    },
  };
}
