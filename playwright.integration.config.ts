import { defineConfig, devices } from '@playwright/test';

// Browser-Integrationstests gegen die Zielumgebung (README „Zielumgebung“): den Compose-Stack (CI, integration.yml) oder
// scripts/integration-local.sh --browser. Der Stack läuft schon; hier wird kein Server gestartet. Nur Chromium.
export default defineConfig({
  testDir: 'tests/e2e-integration',
  fullyParallel: true,
  workers: 2,
  retries: process.env.CI ? 1 : 0,
  reporter: 'list',
  use: {
    baseURL: process.env.RETICORA_IT_BASE_URL ?? 'http://127.0.0.1:8088',
    trace: process.env.CI ? 'retain-on-failure' : 'off',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
