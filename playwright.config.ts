import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env["CI"],
  retries: process.env["CI"] ? 2 : 0,
  reporter: [
    ["list"],
    ["html", { outputFolder: ".tmp/project-overhaul/playwright-report" }],
  ],
  use: {
    baseURL: "http://127.0.0.1:4200",
    trace: "retain-on-failure",
  },
  webServer: {
    command: "npm start -- --host 127.0.0.1 --port 4200",
    url: "http://127.0.0.1:4200",
    reuseExistingServer: !process.env["CI"],
    timeout: 120000,
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1920, height: 1080 },
        launchOptions: {
          args: ["--start-maximized"],
          slowMo: Number(process.env["SLOW_MO"] ?? 0),
        },
      },
    },
  ],
});
