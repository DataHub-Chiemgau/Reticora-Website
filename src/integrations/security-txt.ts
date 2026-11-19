import type { AstroIntegration } from 'astro';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { SITE } from '../data/site';
import { securityTxt } from '../../scripts/lib/security-txt.mjs';

/** Spec Ä-13: `/.well-known/security.txt` nur, wenn `SITE.securityContact` feststeht; sonst keine Datei (die Release-Prüfung meldet das). */
export default function securityTxtFile(): AstroIntegration {
  return {
    name: 'reticora-security-txt',
    hooks: {
      'astro:build:done': ({ dir, logger }) => {
        const file = fileURLToPath(new URL('.well-known/security.txt', dir));
        if (!SITE.securityContact) {
          rmSync(file, { force: true });
          logger.warn('SITE.securityContact fehlt: keine /.well-known/security.txt');
          return;
        }
        mkdirSync(fileURLToPath(new URL('.well-known/', dir)), { recursive: true });
        writeFileSync(file, securityTxt(SITE.securityContact, new Date(), SITE.url));
      },
    },
  };
}
