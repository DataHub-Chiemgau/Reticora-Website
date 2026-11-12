// `npm run lhci`: führt `lhci autorun` aus. Nur wenn Lighthouse selbst einen Laufzeitfehler meldet
// ("Runtime error encountered", z. B. NO_NAVSTART) und kein Grenzwert verletzt ist, wird genau einmal wiederholt.
// Grenzwerte (lighthouserc.json) bleiben unverändert; verletzte Grenzwerte scheitern sofort.
import { spawnSync } from 'node:child_process';
import { decide } from './lib/lhci-retry.mjs';

function run() {
  const r = spawnSync('npx', ['lhci', 'autorun', ...process.argv.slice(2)], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  process.stdout.write(r.stdout ?? '');
  process.stderr.write(r.stderr ?? '');
  return { code: r.status ?? 1, output: `${r.stdout ?? ''}\n${r.stderr ?? ''}` };
}

let { code, output } = run();
if (decide(code, output) === 'retry') {
  console.log('\n=== lhci: Laufzeitfehler von Lighthouse (kein Grenzwert verletzt). WIEDERHOLUNG, einmalig. ===\n');
  ({ code, output } = run());
  if (decide(code, output, true) === 'pass') console.log('\n=== lhci: Wiederholung erfolgreich. ===');
}
process.exit(code);
