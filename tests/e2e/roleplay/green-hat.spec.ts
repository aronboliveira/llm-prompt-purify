/**
 * Roleplay E2E — Green Hat (Beginner)
 *
 * Browser-based tests simulating a beginner attacker's view:
 * basic cookie exposure probing, simple PII injection, and
 * verifying that the UI masking engine protects user data
 * even against elementary attack patterns.
 */
import { expect, test, type Page } from "@playwright/test";

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

async function mockApi(page: Page): Promise<void> {
  await page.route("**/api/mask-safety/validate", async route => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ isSafe: true, findings: [] }),
    });
  });
}

async function fillAndGetMasked(page: Page, input: string): Promise<string> {
  await page.getByTestId("source-textarea").fill(input);
  const output = page.getByTestId("masked-output");
  await expect(output).toBeVisible({ timeout: 10_000 });
  await page.waitForTimeout(1500);
  return (await output.textContent()) ?? "";
}

/* ------------------------------------------------------------------ */
/*  Tests                                                             */
/* ------------------------------------------------------------------ */

test.describe("Green Hat — Basic PII Masking Verification", () => {
  test.beforeEach(async ({ page }) => {
    await mockApi(page);
    await page.goto("/");
    await expect(page.getByTestId("source-textarea")).toBeVisible({
      timeout: 15_000,
    });
  });

  test("masks a plaintext email entered in the textarea", async ({ page }) => {
    const masked = await fillAndGetMasked(
      page,
      "Send the report to alice@example.com please",
    );
    expect(masked).not.toContain("alice@example.com");
    expect(masked).toContain("[MASK-");
  });

  test("masks a plaintext SSN entered in the textarea", async ({ page }) => {
    const masked = await fillAndGetMasked(
      page,
      "My social security number is 123-45-6789",
    );
    expect(masked).not.toContain("123-45-6789");
  });

  test("masks a phone number with country code", async ({ page }) => {
    const masked = await fillAndGetMasked(page, "Call me at +1-555-867-5309");
    expect(masked).not.toContain("555-867-5309");
  });

  test("masks an API key pasted into the input", async ({ page }) => {
    const masked = await fillAndGetMasked(
      page,
      "Here is my key: sk-proj-abc123def456ghi789jkl012mno345pqr",
    );
    expect(masked).not.toContain("sk-proj-abc123def456ghi789jkl012mno345pqr");
  });

  test("leaves safe text completely unchanged", async ({ page }) => {
    const safeText = "The quick brown fox jumps over the lazy dog";
    const masked = await fillAndGetMasked(page, safeText);
    expect(masked.trim()).toBe(safeText);
  });

  test("masks multiple PII values in the same input", async ({ page }) => {
    const masked = await fillAndGetMasked(
      page,
      "Name: Bob, Email: bob@corp.com, SSN: 111-22-3333",
    );
    expect(masked).not.toContain("bob@corp.com");
    expect(masked).not.toContain("111-22-3333");
  });
});

test.describe("Green Hat — Cookie Security Headers", () => {
  test.beforeEach(async ({ page }) => {
    await mockApi(page);
  });

  test("API endpoints do not expose Set-Cookie without HttpOnly", async ({
    page,
  }) => {
    const response = await page.goto("/");
    const headers = response?.headers() ?? {};
    const setCookie = headers["set-cookie"] ?? "";
    // If there is a Set-Cookie header, it must have HttpOnly
    if (setCookie.length > 0) {
      expect(setCookie.toLowerCase()).toContain("httponly");
    }
  });

  test("API response does not leak Server header with version info", async ({
    page,
  }) => {
    const response = await page.request.get("/");
    const server = response.headers()["server"] ?? "";
    // Should not expose detailed framework versions
    expect(server).not.toMatch(/Kestrel|ASP\.NET|IIS/i);
  });
});
