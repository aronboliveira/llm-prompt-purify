/**
 * Roleplay E2E — QA (Fuzzing & Boundary Testing)
 *
 * Browser-based tests simulating a QA engineer's approach:
 * fuzz vectors injected through the UI, boundary value testing,
 * format variation handling, and XSS payload neutralization
 * in the masking output.
 */
import { expect, test, type Page } from "@playwright/test";

/* ------------------------------------------------------------------ */
/*  Constants                                                         */
/* ------------------------------------------------------------------ */

const FUZZ_VECTORS: Record<string, string> = {
  sql_inject: "' OR '1'='1' --",
  xss_basic: '<script>alert("xss")</script>',
  xss_event: "<img src=x onerror=alert(1)>",
  crlf_inject: "header\r\nX-Injected: true",
  path_traversal: "../../../etc/passwd",
  null_bytes: "test\x00hidden",
  template_inject: "{{7*7}}",
  long_string: "A".repeat(10_000),
  unicode_bidi: "\u202Emalicious\u202C",
  empty: "",
};

const XSS_PAYLOADS = [
  '<script>alert("xss")</script>',
  "<img src=x onerror=alert(1)>",
  "javascript:alert(1)",
  '<iframe src="javascript:alert(1)">',
  "<svg onload=alert(document.cookie)>",
];

const DANGEROUS_PATTERNS = [
  /<script[\s>]/i,
  /on\w+\s*=/i,
  /javascript:/i,
  /<iframe[\s>]/i,
  /<svg[\s>]/i,
];

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

test.describe("QA — Fuzz Vector Resilience", () => {
  test.beforeEach(async ({ page }) => {
    await mockApi(page);
    await page.goto("/");
    await expect(page.getByTestId("source-textarea")).toBeVisible({
      timeout: 15_000,
    });
  });

  for (const [name, vector] of Object.entries(FUZZ_VECTORS)) {
    if (vector.length === 0) continue; // skip empty
    test(`does not crash when given fuzz vector: ${name}`, async ({ page }) => {
      const textarea = page.getByTestId("source-textarea");
      await textarea.fill(vector);
      // App should not crash — textarea and output both visible
      await expect(textarea).toBeVisible();
      await expect(page.getByTestId("masked-output")).toBeVisible({
        timeout: 10_000,
      });
    });
  }

  test("handles 10,000-character long_string without timeout", async ({
    page,
  }) => {
    const longInput = "A".repeat(10_000);
    await page.getByTestId("source-textarea").fill(longInput);
    const output = page.getByTestId("masked-output");
    await expect(output).toBeVisible({ timeout: 15_000 });
    const masked = (await output.textContent()) ?? "";
    // Long safe text should survive intact (no PII in it)
    expect(masked.length).toBeGreaterThan(0);
  });
});

test.describe("QA — XSS in Masking Output", () => {
  test.beforeEach(async ({ page }) => {
    await mockApi(page);
    await page.goto("/");
    await expect(page.getByTestId("source-textarea")).toBeVisible({
      timeout: 15_000,
    });
  });

  for (const payload of XSS_PAYLOADS) {
    test(`masked output neutralizes XSS payload: ${payload.slice(0, 40)}`, async ({
      page,
    }) => {
      const alertTriggered = { value: false };
      page.on("dialog", async dialog => {
        alertTriggered.value = true;
        await dialog.dismiss();
      });
      await fillAndGetMasked(page, `Contact: ${payload}`);
      await page.waitForTimeout(1000);
      // The app must not execute injected scripts in the DOM
      expect(alertTriggered.value).toBe(false);
    });
  }
});

test.describe("QA — Multi-field PII Boundary Testing", () => {
  test.beforeEach(async ({ page }) => {
    await mockApi(page);
    await page.goto("/");
    await expect(page.getByTestId("source-textarea")).toBeVisible({
      timeout: 15_000,
    });
  });

  test("masks all PII in a multi-field single-line input", async ({ page }) => {
    const masked = await fillAndGetMasked(
      page,
      "Name: Jane Doe, Email: jane@corp.io, SSN: 123-45-6789",
    );
    expect(masked).not.toContain("jane@corp.io");
    expect(masked).not.toContain("123-45-6789");
  });

  test("masks PII in tab-separated fields", async ({ page }) => {
    const masked = await fillAndGetMasked(
      page,
      "user@example.com\t987-65-4320\t555-0199",
    );
    expect(masked).not.toContain("user@example.com");
    expect(masked).not.toContain("987-65-4320");
  });

  test("masks PII in multiline form-like input", async ({ page }) => {
    const input = [
      "Name: Alice Liddell",
      "Email: alice@wonder.land",
      "SSN: 555-12-3456",
      "Phone: +1-555-867-5309",
    ].join("\n");
    const masked = await fillAndGetMasked(page, input);
    expect(masked).not.toContain("alice@wonder.land");
    expect(masked).not.toContain("555-12-3456");
  });

  test("copy button works after masking fuzzed input", async ({
    page,
    context,
  }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await fillAndGetMasked(page, "Email: fuzz@test.com and SSN: 999-88-7777");
    const copyBtn = page.getByTestId("copy-button");
    if (await copyBtn.isVisible()) {
      await copyBtn.click();
      const clipboard = await page.evaluate(() =>
        navigator.clipboard.readText(),
      );
      expect(clipboard).not.toContain("fuzz@test.com");
      expect(clipboard).not.toContain("999-88-7777");
    }
  });
});
