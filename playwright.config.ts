import { defineConfig, devices } from '@playwright/test'

/**
 * E2E config for the shader portfolio.
 * Device matrix mirrors the must-pass targets: Desktop Chrome, Desktop Safari (WebKit),
 * Mobile Safari (iPhone), and Mobile Chrome (Pixel).
 *
 * Run `npx playwright install` once to download the browser binaries.
 */
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    // Heavy animation is flaky to assert against; reduce motion for stable runs.
    // Motion-specific behavior is covered explicitly in reduced-motion.spec.ts.
    contextOptions: { reducedMotion: 'reduce' },
  },
  projects: [
    // Functional + a11y specs run across the full device matrix. Visual-regression
    // and performance specs are Chromium-only (font/score stability) and excluded here.
    {
      name: 'Desktop Chrome',
      testIgnore: ['**/visual.spec.ts', '**/perf.spec.ts'],
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'Desktop Safari',
      testIgnore: ['**/visual.spec.ts', '**/perf.spec.ts'],
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'Mobile Safari',
      testIgnore: ['**/visual.spec.ts', '**/perf.spec.ts'],
      use: { ...devices['iPhone 13'] },
    },
    {
      name: 'Mobile Chrome',
      testIgnore: ['**/visual.spec.ts', '**/perf.spec.ts'],
      use: { ...devices['Pixel 5'] },
    },
    // Visual regression — single engine to avoid cross-browser rendering diffs.
    {
      name: 'visual',
      testMatch: ['**/visual.spec.ts'],
      use: { ...devices['Desktop Chrome'] },
    },
    // Performance budgets (Lighthouse + asset transfer).
    {
      name: 'perf',
      testMatch: ['**/perf.spec.ts'],
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm run start',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
})
