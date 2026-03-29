/**
 * Extreme I/O E2E tests for the textarea → output pipeline.
 *
 * Tests extreme edge cases through the actual UI: huge inputs, special chars,
 * rapid typing, empty/whitespace, unicode, adversarial, and format variations.
 */
import { expect, test } from "@playwright/test";

const TEXTAREA = '[data-testid="source-textarea"]';
const OUTPUT = '[data-testid="masked-output"]';
const COPY_BTN = '[data-testid="copy-button"]';

test.describe("extreme I/O: textarea → masked output", () => {
  test.beforeEach(async ({ page }) => {
    await page.route("**/api/mask-safety/validate", async route => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ isSafe: true, findings: [] }),
      });
    });
    await page.goto("/");
  });

  // ─── Empty / whitespace ────────────────────────────────────────
  test("empty textarea produces empty/placeholder output", async ({ page }) => {
    const textarea = page.locator(TEXTAREA);
    await textarea.fill("");
    const output = page.locator(OUTPUT);
    await expect(output).toBeVisible();
    // Copy button should be disabled when no result
    await expect(page.locator(COPY_BTN)).toBeDisabled();
  });

  test("whitespace-only input does not produce matches", async ({ page }) => {
    await page.locator(TEXTAREA).fill("   \t\n\n   ");
    // Wait for any debounce
    await page.waitForTimeout(1500);
    await expect(page.locator(COPY_BTN)).toBeDisabled();
  });

  test("single newline character input", async ({ page }) => {
    await page.locator(TEXTAREA).fill("\n");
    await page.waitForTimeout(1500);
    await expect(page.locator(COPY_BTN)).toBeDisabled();
  });

  // ─── Large payloads ─────────────────────────────────────────────
  test("handles 10KB payload with embedded email", async ({ page }) => {
    const bigText =
      "Innocuous text block. ".repeat(400) +
      "\nEmail: hidden@secret.com\n" +
      "More text. ".repeat(200);
    await page.locator(TEXTAREA).fill(bigText);
    await page.waitForTimeout(3000);
    const output = page.locator(OUTPUT);
    await expect(output).not.toContainText("hidden@secret.com", {
      timeout: 10000,
    });
  });

  test("handles 200 emails in single textarea input", async ({ page }) => {
    const emails = Array.from(
      { length: 200 },
      (_, i) => `user${i}@domain${i % 50}.com`,
    ).join("\n");
    await page.locator(TEXTAREA).fill(emails);
    await page.waitForTimeout(5000);
    const output = page.locator(OUTPUT);
    await expect(output).not.toContainText("user0@domain0.com", {
      timeout: 10000,
    });
    await expect(output).not.toContainText("user199@domain49.com", {
      timeout: 5000,
    });
  });

  // ─── Unicode / non-ASCII ────────────────────────────────────────
  test("emoji-rich text with embedded sensitive data", async ({ page }) => {
    const text = "🔑🔐🛡️ My secret email is hackme@evil.co 🛡️🔐🔑";
    await page.locator(TEXTAREA).fill(text);
    await page.waitForTimeout(2000);
    const output = page.locator(OUTPUT);
    await expect(output).not.toContainText("hackme@evil.co", { timeout: 5000 });
  });

  test("Arabic and RTL text with embedded email", async ({ page }) => {
    await page
      .locator(TEXTAREA)
      .fill("البريد الإلكتروني: test@rtl-test.com مرحبا");
    await page.waitForTimeout(2000);
    const output = page.locator(OUTPUT);
    await expect(output).not.toContainText("test@rtl-test.com", {
      timeout: 5000,
    });
  });

  test("CJK characters surrounding sensitive data", async ({ page }) => {
    await page.locator(TEXTAREA).fill("测试电子邮件 email: cjk@test.com 结束");
    await page.waitForTimeout(2000);
    const output = page.locator(OUTPUT);
    await expect(output).not.toContainText("cjk@test.com", { timeout: 5000 });
  });

  // ─── Adversarial inputs ────────────────────────────────────────
  test("XSS-like payload does not break the UI", async ({ page }) => {
    const xss =
      '<script>alert("xss")</script> Email: evil@site.com <img onerror=alert(1)>';
    await page.locator(TEXTAREA).fill(xss);
    await page.waitForTimeout(2000);
    // Page should still be functional
    await expect(page.locator(OUTPUT)).toBeVisible();
    const output = page.locator(OUTPUT);
    await expect(output).not.toContainText("evil@site.com", { timeout: 5000 });
  });

  test("SQL injection-like payload is processed safely", async ({ page }) => {
    const sqli = "SELECT * FROM users WHERE email='admin@hack.com' OR 1=1;--";
    await page.locator(TEXTAREA).fill(sqli);
    await page.waitForTimeout(2000);
    const output = page.locator(OUTPUT);
    await expect(output).not.toContainText("admin@hack.com", { timeout: 5000 });
  });

  // ─── Format variations ──────────────────────────────────────────
  test("masks CPF in various formats", async ({ page }) => {
    // First verify Brazil scope is active by checking the country modal
    await page.getByTestId("country-modal-button").click();
    await page.getByTestId("country-toggle-br").check();
    await page.getByRole("button", { name: "Close countries" }).click();

    const text = ["CPF: 529.982.247-25", "CPF: 52998224725"].join("\n");
    await page.locator(TEXTAREA).fill(text);
    await page.waitForTimeout(3000);
    const output = page.locator(OUTPUT);
    await expect(output).not.toContainText("529.982.247-25", {
      timeout: 10000,
    });
    await expect(output).not.toContainText("52998224725", { timeout: 5000 });
  });

  test("masks multiple credential types in one input", async ({ page }) => {
    const text = [
      "API Key: sk-proj-AABBCCDD1234567890EEFF1234567890",
      "JWT: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.payload.signature",
      "AWS: AKIAIOSFODNN7EXAMPLE",
      "GitHub: ghp_ABCDefgh1234567890abcdef",
    ].join("\n");
    await page.locator(TEXTAREA).fill(text);
    await page.waitForTimeout(2000);
    const output = page.locator(OUTPUT);
    await expect(output).not.toContainText(
      "sk-proj-AABBCCDD1234567890EEFF1234567890",
      { timeout: 5000 },
    );
    await expect(output).not.toContainText("AKIAIOSFODNN7EXAMPLE", {
      timeout: 5000,
    });
    await expect(output).not.toContainText("ghp_ABCDefgh1234567890abcdef", {
      timeout: 5000,
    });
  });

  // ─── Rapid input changes ───────────────────────────────────────
  test("rapid sequential fills (debounce stress test)", async ({ page }) => {
    const textarea = page.locator(TEXTAREA);
    // Rapidly change input 10 times
    for (let i = 0; i < 10; i++) {
      await textarea.fill(`Rapid test ${i}: user${i}@rapid.com`);
    }
    // Wait for final debounce to settle
    await page.waitForTimeout(3000);
    const output = page.locator(OUTPUT);
    // Only the last input should be reflected
    await expect(output).not.toContainText("user9@rapid.com", {
      timeout: 5000,
    });
  });

  // ─── Clear and re-scan ────────────────────────────────────────
  test("clear button resets output and allows re-scan", async ({ page }) => {
    await page.locator(TEXTAREA).fill("Email: test@clear-test.com");
    await page.waitForTimeout(2000);
    const output = page.locator(OUTPUT);
    await expect(output).not.toContainText("test@clear-test.com", {
      timeout: 5000,
    });

    // Click clear button
    await page.getByText("Clear local text").click();
    await expect(page.locator(COPY_BTN)).toBeDisabled();

    // Re-fill and re-scan
    await page.locator(TEXTAREA).fill("Email: new@rescan.com");
    await page.waitForTimeout(2000);
    await expect(output).not.toContainText("new@rescan.com", { timeout: 5000 });
  });

  // ─── Mixed content ────────────────────────────────────────────
  test("mixed safe and sensitive text preserves safe content", async ({
    page,
  }) => {
    const text = [
      "This is a safe instruction for the LLM.",
      "Email: leaked@private.com",
      "Please summarize the following document.",
      "CPF: 529.982.247-25",
      "Use bullet points in the response.",
    ].join("\n");
    await page.locator(TEXTAREA).fill(text);
    await page.waitForTimeout(2000);
    const output = page.locator(OUTPUT);
    await expect(output).toContainText(
      "This is a safe instruction for the LLM.",
      { timeout: 5000 },
    );
    await expect(output).toContainText(
      "Please summarize the following document.",
      { timeout: 5000 },
    );
    await expect(output).toContainText("Use bullet points in the response.", {
      timeout: 5000,
    });
    await expect(output).not.toContainText("leaked@private.com", {
      timeout: 5000,
    });
  });

  // ─── Copy functionality with extreme content ───────────────────
  test("copy button becomes enabled after scanning", async ({
    context,
    page,
  }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await page
      .locator(TEXTAREA)
      .fill("Token: sk-proj-AABB1234567890CC1234567890DD");
    await page.waitForTimeout(2000);
    // Wait for scan to complete
    await expect(page.locator(COPY_BTN)).toBeEnabled({ timeout: 10000 });
    await page.locator(COPY_BTN).click();
    await expect(page.getByText("Protected prompt copied")).toBeVisible({
      timeout: 5000,
    });
  });

  // ─── Safe text passthrough ─────────────────────────────────────
  test("completely safe text passes through unchanged", async ({ page }) => {
    const safeText =
      "Summarize this release note for the engineering newsletter. Focus on performance improvements and developer experience.";
    await page.locator(TEXTAREA).fill(safeText);
    await page.waitForTimeout(2000);
    const output = page.locator(OUTPUT);
    await expect(output).toContainText(safeText, { timeout: 5000 });
  });
});
