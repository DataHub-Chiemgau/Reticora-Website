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
  reporter: 'list',
  use: { baseURL: 'http://127.0.0.1:8080' },
  projects,
  webServer: {
    command: 'npm run build && npx astro preview --host 127.0.0.1 --port 8080',
    url: 'http://127.0.0.1:8080',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
