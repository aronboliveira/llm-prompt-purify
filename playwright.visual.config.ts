/**
 * Playwright config for visual/slow-motion debugging.
 * Use this to watch inputs being masked in real-time in the browser.
 *
 * Run with: npm run test:e2e:visual
 */
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false, // Run tests sequentially so you can watch
  workers: 1, // Single browser at a time
  forbidOnly: false,
  retries: 0,
  reporter: [["list"]],
  use: {
    baseURL: "http://127.0.0.1:4200",
    trace: "off",
    video: "on", // Record video of each test
    launchOptions: {
      slowMo: 300, // 300ms delay between each action
    },
  },
  webServer: {
    command: "npm start -- --host 127.0.0.1 --port 4200",
    url: "http://127.0.0.1:4200",
    reuseExistingServer: true,
    timeout: 120000,
  },
  projects: [
    {
      name: "visual",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1280, height: 720 },
        headless: false, // Always headed
      },
    },
  ],
});
