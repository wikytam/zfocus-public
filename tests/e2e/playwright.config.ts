import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for Chrome Extension testing
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './playwright-tests',
  fullyParallel: false, // Extensions need sequential testing
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1, // Run tests sequentially for extension testing
  reporter: [['html', { outputFolder: 'playwright-report' }], ['list'], ['json', { outputFile: 'test-results.json' }]],
  use: {
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    headless: false, // Extensions require headed mode
  },

  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        // Path to the built extension
        contextOptions: {
          // We'll set this dynamically in the test setup
        },
      },
    },
  ],

  // Output folder for test artifacts
  outputDir: 'test-results',
});
