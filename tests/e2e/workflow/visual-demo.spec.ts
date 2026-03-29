/**
 * Visual demonstration tests for watching masking in real-time.
 *
 * These tests type character-by-character with delays so you can
 * observe the debounce and masking engine processing inputs.
 *
 * Run with: npm run test:e2e:visual -- tests/e2e/visual-demo.spec.ts
 */
import { expect, test } from "@playwright/test";

const TEXTAREA = '[data-testid="source-textarea"]';
const OUTPUT = '[data-testid="masked-output"]';
const COPY_BTN = '[data-testid="copy-button"]';

// Typing delay per character (ms) - adjust to watch masking
const CHAR_DELAY = 50;

test.describe("Visual Demo: Watch Masking in Real-Time", () => {
  test.beforeEach(async ({ page }) => {
    // Mock backend API
    await page.route("**/api/mask-safety/validate", async route => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ isSafe: true, findings: [] }),
      });
    });
    await page.goto("/");

    // Set BR country scope so Brazilian rules (phone, CEP, etc.) fire
    await page.evaluate(() => {
      window.sessionStorage.setItem(
        "llm-prompt-purify:country-profiles:v2",
        JSON.stringify(["br"]),
      );
      window.sessionStorage.setItem(
        "llm-prompt-purify:country-profile:v1",
        "br",
      );
    });
    await page.reload();
    await page.getByTestId("source-textarea").waitFor({ state: "visible" });
  });

  test("Watch email being masked character by character", async ({ page }) => {
    const textarea = page.locator(TEXTAREA);
    const output = page.locator(OUTPUT);

    // Type an email character by character
    await textarea.click();
    await page.keyboard.type("Contact me at john.doe@company.com please", {
      delay: CHAR_DELAY,
    });

    // Wait for debounce to trigger masking
    await page.waitForTimeout(2000);

    // Verify email is masked
    await expect(output).not.toContainText("john.doe@company.com");
    await expect(page.locator(COPY_BTN)).toBeEnabled();
  });

  test("Watch CPF with email being typed and masked", async ({ page }) => {
    const textarea = page.locator(TEXTAREA);
    const output = page.locator(OUTPUT);

    await textarea.click();
    // Use a valid CPF (passes checksum) + email that definitely gets masked
    await page.keyboard.type("CPF: 529.982.247-25, email: cpf-owner@test.com", {
      delay: CHAR_DELAY,
    });

    await page.waitForTimeout(2000);
    // Both CPF and email should be masked
    await expect(output).not.toContainText("cpf-owner@test.com");
    await expect(output).not.toContainText("529.982.247-25");
    await expect(output).toContainText("[MASK");
  });

  test("Watch multiple sensitive data types masked", async ({ page }) => {
    const textarea = page.locator(TEXTAREA);
    const output = page.locator(OUTPUT);

    // Type a mix of sensitive data with explicit labels
    const sensitiveText = `
User Profile:
- Email: secret@hidden.com
- Telefone: (11) 99999-8888
- CPF: 111.444.777-35
- CEP: 01310-100
- Credit Card: 4111-1111-1111-1111
`;

    await textarea.click();
    await page.keyboard.type(sensitiveText, { delay: 30 }); // Faster for longer text

    await page.waitForTimeout(3000);

    // Verify email, credit card, CPF, and phone are masked
    await expect(output).not.toContainText("secret@hidden.com");
    await expect(output).not.toContainText("4111-1111-1111-1111");
    await expect(output).not.toContainText("111.444.777-35");
    await expect(output).not.toContainText("(11) 99999-8888");
    // Output should contain MASK placeholders
    await expect(output).toContainText("[MASK");
  });

  test("Watch high-entropy typo input being processed", async ({ page }) => {
    const textarea = page.locator(TEXTAREA);
    const output = page.locator(OUTPUT);

    // Type with typos and informal language
    await textarea.click();
    await page.keyboard.type(
      "oi manda msg pro email joao.silva@@gmial.con q ta errado",
      { delay: CHAR_DELAY },
    );

    await page.waitForTimeout(2000);
    await expect(output).toBeVisible();
  });

  test("Watch BR phone with labels being input", async ({ page }) => {
    const textarea = page.locator(TEXTAREA);
    const output = page.locator(OUTPUT);

    await textarea.click();
    // Include email to ensure masking triggers, then add phone
    await page.keyboard.type("Contato: email test@example.com, cel (21) 98765-4321", {
      delay: CHAR_DELAY,
    });

    await page.waitForTimeout(2000);
    // Email should be masked, phone should also be masked with BR scope
    await expect(output).not.toContainText("test@example.com");
    await expect(output).not.toContainText("98765-4321");
    await expect(output).toContainText("[MASK");
  });

  test("Watch clear and re-scan workflow", async ({ page }) => {
    const textarea = page.locator(TEXTAREA);
    const output = page.locator(OUTPUT);

    // First input
    await textarea.click();
    await page.keyboard.type("Email: first@test.com", { delay: CHAR_DELAY });
    await page.waitForTimeout(2000);
    await expect(output).not.toContainText("first@test.com");

    // Clear and type new input
    await textarea.fill("");
    await page.waitForTimeout(500);

    await textarea.click();
    await page.keyboard.type("New email: second@test.com", { delay: CHAR_DELAY });
    await page.waitForTimeout(2000);
    await expect(output).not.toContainText("second@test.com");
  });

  test("Watch dataframe progression with mixed content", async ({ page }) => {
    const textarea = page.locator(TEXTAREA);

    // Progressive typing to show debounce behavior
    await textarea.click();

    // Type safe content first
    await page.keyboard.type("Hello, this is safe content. ", { delay: CHAR_DELAY });
    await page.waitForTimeout(1500); // Let debounce fire

    // Now add sensitive content
    await page.keyboard.type("My email is ", { delay: CHAR_DELAY });
    await page.waitForTimeout(1000);

    // Type email character by character
    await page.keyboard.type("h", { delay: 200 });
    await page.keyboard.type("i", { delay: 200 });
    await page.keyboard.type("d", { delay: 200 });
    await page.keyboard.type("d", { delay: 200 });
    await page.keyboard.type("e", { delay: 200 });
    await page.keyboard.type("n", { delay: 200 });
    await page.keyboard.type("@", { delay: 200 });
    await page.keyboard.type("s", { delay: 200 });
    await page.keyboard.type("e", { delay: 200 });
    await page.keyboard.type("c", { delay: 200 });
    await page.keyboard.type("r", { delay: 200 });
    await page.keyboard.type("e", { delay: 200 });
    await page.keyboard.type("t", { delay: 200 });
    await page.keyboard.type(".", { delay: 200 });
    await page.keyboard.type("c", { delay: 200 });
    await page.keyboard.type("o", { delay: 200 });
    await page.keyboard.type("m", { delay: 200 });

    // Wait for final debounce
    await page.waitForTimeout(2000);

    const output = page.locator(OUTPUT);
    await expect(output).not.toContainText("hidden@secret.com");
    await expect(output).toContainText("Hello");
  });
});
