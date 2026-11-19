import { defineConfig, devices } from '@playwright/test';

const projects = [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }];
if (process.env.CI) {
  projects.push(
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
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
