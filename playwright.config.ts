import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright config — iPad-first smoke tests.
 *
 * - Webkit (Safari engine) is the primary project because iPad Safari is
 *   the target browser per PRD.
 * - Chromium is a secondary project so CI catches cross-engine regressions
 *   on desktop too.
 * - Auto-starts the Vite dev server before tests if not already running.
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? "list" : "html",
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:5173",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "ipad-safari",
      use: { ...devices["iPad Pro 11"] },
    },
    {
      name: "desktop-chrome",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: "npm run dev",
    url: process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:5173",
    reuseExistingServer: !process.env.CI,
    timeout: 60 * 1000,
  },
});
