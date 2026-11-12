#!/usr/bin/env node
// Release-Sperre: bricht mit Exit-Code 1 ab, solange Claims, Bilder, Seiten oder Anbieterangaben offen sind.
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { CLAIMS } from '../src/data/claims.ts';
import { SCREENSHOTS } from '../src/data/screenshots.ts';
import { SITE } from '../src/data/site.ts';
import { ROUTES } from '../src/i18n/routes.ts';
import { checkClaims, checkDevPages, checkRoutes, checkScreenshots, checkSite } from './lib/release-checks.mjs';

const dist = join(process.cwd(), 'dist');
const dev = existsSync(join(dist, 'dev')) ? ['dev'] : [];

const groups = [
  ['Offene Claims', checkClaims(CLAIMS)],
  ['Fehlende Bilder', checkScreenshots(SCREENSHOTS)],
  ['Geplante Seiten', checkRoutes(ROUTES)],
  ['Fehlende Anbieterangaben', checkSite(SITE)],
  ['Entwicklungsseiten im Build', checkDevPages(dev)],
];

let total = 0;
for (const [title, items] of groups) {
  if (!items.length) continue;
  total += items.length;
  console.error(`\n${title} (${items.length}):`);
  for (const i of items) console.error(`  - ${i}`);
}
if (total) {
  console.error(`\nRelease gesperrt: ${total} Mängel. Die Seite darf nicht online gehen.`);
  process.exit(1);
}
console.log('Release-Prüfung bestanden.');
