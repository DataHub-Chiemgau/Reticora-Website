import { defineConfig, devices } from '@playwright/test';

import type { PlaywrightTestProject } from '@playwright/test';

const projects: PlaywrightTestProject[] = [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }];
if (process.env.CI) {
  projects.push(
    // Firefox bleibt in der CI bei etwa 1 von 1000 Seitenaufrufen bis zum Zeitlimit beim Laden hängen. Das
    // Zugriffsprotokoll des Testservers zeigt in diesen Läufen keine Anfrage über 1 s und keinen Abbruch: Der Server
    // antwortet, das Hängen liegt im Browser. Bei rund 1000 Firefox-Tests je Lauf trifft es mit einem
    // Wiederholungsversuch zu oft denselben Test zweimal; daher zwei Versuche und ein kürzeres Navigationslimit,
    // damit ein Hänger schnell abbricht. Jeder wiederholte Test steht im Bericht als „flaky“.
    { name: 'firefox', retries: 2, use: { ...devices['Desktop Firefox'], navigationTimeout: 15_000 } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  );
}

export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: true,
  // In der CI hing das Laden einer Seite in Firefox vereinzelt (ein Test von 255,
  // jedes Mal ein anderer). Ursache ungeklärt; ein Wiederholungsversuch, der
  // Bericht weist solche Tests als „flaky“ aus.
  retries: process.env.CI ? 1 : 0,
  reporter: 'list',
  // In der CI: Trace beim ersten Wiederholungsversuch (Beleg für das Hängen von Firefox). Lokal aus.
  use: { baseURL: 'http://127.0.0.1:8080', trace: process.env.CI ? 'on-first-retry' : 'off' },
  projects,
  webServer: {
    command: 'npm run build && npm run serve',
    url: 'http://127.0.0.1:8080',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    gracefulShutdown: { signal: 'SIGTERM', timeout: 5000 },
  },
});
