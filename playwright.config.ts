import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: 'tests',
  timeout: 120000,
  expect: { timeout: 5000 },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: [
    ['list'],
    ['junit', { outputFile: 'test-results/junit-results.xml' }],
    // Place HTML report outside of the Playwright outputDir to avoid clearing artifacts
    ['html', { outputFolder: 'playwright-report', open: 'never' }]
  ],
  use: {
    // reasonable action timeout to avoid indefinite waits during navigation/actions
    actionTimeout: 60000,
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    viewport: { width: 1280, height: 720 },
    ignoreHTTPSErrors: true
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] }
    },
    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] }
    // },
    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] }
    // }
  ],
  outputDir: 'test-results/',
  // increase global timeout to 4 minutes to accommodate slower external sites
  // (already set above, this comment is informational)
});