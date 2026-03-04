import { test, expect, Page } from "@playwright/test";
import * as fs from "fs";
import * as path from "path";

// Use process.cwd() since tests run from project root
const rootDir = process.cwd();

let contentScript: string;

test.beforeAll(async () => {
  const scriptPath = path.join(
    rootDir,
    "chromium-extension",
    "app",
    "content.js",
  );
  if (fs.existsSync(scriptPath)) {
    contentScript = fs.readFileSync(scriptPath, "utf-8");
  }
});

async function injectScript(page: Page): Promise<void> {
  if (contentScript) {
    await page.addScriptTag({ content: contentScript });
  }
}

async function setPromptText(page: Page, text: string): Promise<void> {
  await page.evaluate(t => {
    if (typeof (window as any).setPromptText === "function") {
      (window as any).setPromptText(t);
    }
  }, text);
  // Wait for debounce + detection
  await page.waitForTimeout(500);
}

test.describe("LLM Prompt Purify - Detection Engine", () => {
  test("detects email addresses", async ({ page }) => {
    await page.goto(
      "file://" +
        path.join(rootDir, "src", "__tests__", "mocks", "chatgpt.html"),
    );
    await injectScript(page);
    await setPromptText(page, "Contact me at john.doe@company.com");

    const toast = page.locator("#llm-purify-toast-root");
    await expect(toast).toBeVisible({ timeout: 5000 });
  });

  test("detects phone numbers", async ({ page }) => {
    await page.goto(
      "file://" +
        path.join(rootDir, "src", "__tests__", "mocks", "chatgpt.html"),
    );
    await injectScript(page);
    await setPromptText(page, "Call me at 555-123-4567");

    const toast = page.locator("#llm-purify-toast-root");
    await expect(toast).toBeVisible({ timeout: 5000 });
  });

  test("detects credit card patterns", async ({ page }) => {
    await page.goto(
      "file://" +
        path.join(rootDir, "src", "__tests__", "mocks", "chatgpt.html"),
    );
    await injectScript(page);
    await setPromptText(page, "Card: 4111111111111111");

    const toast = page.locator("#llm-purify-toast-root");
    await expect(toast).toBeVisible({ timeout: 5000 });
  });

  test("detects AWS credentials", async ({ page }) => {
    await page.goto(
      "file://" +
        path.join(rootDir, "src", "__tests__", "mocks", "claude.html"),
    );
    await injectScript(page);
    await setPromptText(page, "AWS: AKIAIOSFODNN7EXAMPLE");

    const toast = page.locator("#llm-purify-toast-root");
    await expect(toast).toBeVisible({ timeout: 5000 });
  });
});

test.describe("LLM Prompt Purify - UI Interactions", () => {
  test("shows toast notification on detection", async ({ page }) => {
    await page.goto(
      "file://" +
        path.join(rootDir, "src", "__tests__", "mocks", "chatgpt.html"),
    );
    await injectScript(page);
    await setPromptText(page, "Email: test@example.com");

    const toast = page.locator("#llm-purify-toast-root");
    await expect(toast).toBeVisible({ timeout: 5000 });

    const title = page.locator("#llm-purify-toast-title");
    await expect(title).toContainText("Sensitive Data Detected");
  });

  test("shows detected count", async ({ page }) => {
    await page.goto(
      "file://" +
        path.join(rootDir, "src", "__tests__", "mocks", "chatgpt.html"),
    );
    await injectScript(page);
    await setPromptText(page, "Email: test@mail.com");

    const count = page.locator(".llm-purify-detected-count");
    await expect(count).toBeVisible({ timeout: 5000 });
    await expect(count).not.toHaveText("0");
  });

  test("dismiss button hides toast", async ({ page }) => {
    await page.goto(
      "file://" +
        path.join(rootDir, "src", "__tests__", "mocks", "chatgpt.html"),
    );
    await injectScript(page);
    await setPromptText(page, "SSN: 123-45-6789");

    const toast = page.locator("#llm-purify-toast-root");
    await expect(toast).toBeVisible({ timeout: 5000 });

    const dismissBtn = page.locator('[data-action="dismiss"]');
    await dismissBtn.click();

    await expect(toast).toHaveAttribute("aria-hidden", "true");
  });

  test("view masks button opens suggestions panel", async ({ page }) => {
    await page.goto(
      "file://" +
        path.join(rootDir, "src", "__tests__", "mocks", "chatgpt.html"),
    );
    await injectScript(page);
    await setPromptText(page, "Email: test@example.com");

    const toast = page.locator("#llm-purify-toast-root");
    await expect(toast).toBeVisible({ timeout: 5000 });

    const viewMasksBtn = page.locator('[data-action="masks"]');
    await viewMasksBtn.click();

    const suggestionsPanel = page.locator("#llm-purify-suggestions-root");
    await expect(suggestionsPanel).toBeVisible({ timeout: 3000 });
  });
});

test.describe("LLM Prompt Purify - Claude Interface", () => {
  test("works with contenteditable inputs", async ({ page }) => {
    await page.goto(
      "file://" +
        path.join(rootDir, "src", "__tests__", "mocks", "claude.html"),
    );
    await injectScript(page);
    await setPromptText(page, "AWS key: AKIAIOSFODNN7EXAMPLE");

    const toast = page.locator("#llm-purify-toast-root");
    await expect(toast).toBeVisible({ timeout: 5000 });
  });

  test("detects multiple sensitive data types", async ({ page }) => {
    await page.goto(
      "file://" +
        path.join(rootDir, "src", "__tests__", "mocks", "claude.html"),
    );
    await injectScript(page);
    await setPromptText(
      page,
      "Email: a@b.com, Phone: 555-123-4567, SSN: 123-45-6789",
    );

    const toast = page.locator("#llm-purify-toast-root");
    await expect(toast).toBeVisible({ timeout: 5000 });

    const count = page.locator(".llm-purify-detected-count");
    const countText = await count.textContent();
    expect(parseInt(countText || "0")).toBeGreaterThanOrEqual(2);
  });
});

test.describe("LLM Prompt Purify - Edge Cases", () => {
  test("no toast for clean text", async ({ page }) => {
    await page.goto(
      "file://" +
        path.join(rootDir, "src", "__tests__", "mocks", "chatgpt.html"),
    );
    await injectScript(page);
    await setPromptText(page, "Hello, how are you today?");

    // When no sensitive data is detected, toast should not be visible
    // (either not present in DOM or hidden)
    const toast = page.locator("#llm-purify-toast-root");
    await expect(toast).not.toBeVisible({ timeout: 2000 });
  });

  test("handles rapid input changes", async ({ page }) => {
    await page.goto(
      "file://" +
        path.join(rootDir, "src", "__tests__", "mocks", "chatgpt.html"),
    );
    await injectScript(page);

    await setPromptText(page, "Email: a@b.com");
    await page.waitForTimeout(100);
    await setPromptText(page, "Different: c@d.com");
    await page.waitForTimeout(100);
    await setPromptText(page, "Another: e@f.com");

    const toast = page.locator("#llm-purify-toast-root");
    await expect(toast).toBeVisible({ timeout: 5000 });
  });
});
