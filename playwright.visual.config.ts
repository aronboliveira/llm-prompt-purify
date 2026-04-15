/**
 * Playwright config for visual/slow-motion debugging.
 * Use this to watch inputs being masked in real-time in the browser.
 *
 * Env vars:
 *   SLOW_MO          — ms delay between every Playwright action.  Default: 300
 *   SLOWMO_WAIT_MS   — ms pause after each masking input (browselite specs). Default: 2500
 *                      Set to e.g. 30000 to get ~30 s of viewing time per item.
 *   VISUAL_WORKERS   — parallel workers. Default: 1 (single window)
 *   VISUAL_VIDEO     — "on" | "off" | "retain-on-failure". Default: "retain-on-failure"
 *
 * Run with:
 *   npm run test:e2e:watch                         # single headed window, 300 ms slowMo
 *   SLOW_MO=0 SLOWMO_WAIT_MS=30000 npm run test:e2e:watch   # instant actions, 30 s inspect pause
 */
import { defineConfig, devices } from "@playwright/test";

const slowMo = Number(process.env["SLOW_MO"] ?? 300);
const workers = Number(process.env["VISUAL_WORKERS"] ?? 1);
const video = (process.env["VISUAL_VIDEO"] ?? "retain-on-failure") as
  | "on"
  | "off"
  | "retain-on-failure";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: workers > 1,
  workers,
  forbidOnly: false,
  retries: 0,
  reporter: [["list"]],
  use: {
    baseURL: "http://127.0.0.1:4200",
    trace: "off",
    video,
    launchOptions: {
      slowMo,
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
