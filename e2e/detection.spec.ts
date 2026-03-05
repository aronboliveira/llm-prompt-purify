import { test, expect, Page } from "@playwright/test";
import * as fs from "fs";
import * as path from "path";

// Use process.cwd() since tests run from project root
const rootDir = process.cwd();
const mocksDir = path.join(rootDir, "src", "__tests__", "mocks");

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

function mockPath(name: string): string {
  return "file://" + path.join(mocksDir, name);
}

// ---------------------------------------------------------------------------
// Core detection — ChatGPT
// ---------------------------------------------------------------------------

test.describe("LLM Prompt Purify - Detection Engine", () => {
  test("detects email addresses", async ({ page }) => {
    await page.goto(mockPath("chatgpt.html"));
    await injectScript(page);
    await setPromptText(page, "Contact me at john.doe@company.com");

    const toast = page.locator("#llm-purify-toast-root");
    await expect(toast).toBeVisible({ timeout: 5000 });
  });

  test("detects phone numbers", async ({ page }) => {
    await page.goto(mockPath("chatgpt.html"));
    await injectScript(page);
    await setPromptText(page, "Call me at 555-123-4567");

    const toast = page.locator("#llm-purify-toast-root");
    await expect(toast).toBeVisible({ timeout: 5000 });
  });

  test("detects credit card patterns", async ({ page }) => {
    await page.goto(mockPath("chatgpt.html"));
    await injectScript(page);
    await setPromptText(page, "Card: 4111111111111111");

    const toast = page.locator("#llm-purify-toast-root");
    await expect(toast).toBeVisible({ timeout: 5000 });
  });

  test("detects AWS credentials", async ({ page }) => {
    await page.goto(mockPath("claude.html"));
    await injectScript(page);
    await setPromptText(page, "AWS: AKIAIOSFODNN7EXAMPLE");

    const toast = page.locator("#llm-purify-toast-root");
    await expect(toast).toBeVisible({ timeout: 5000 });
  });
});

// ---------------------------------------------------------------------------
// UI interactions — ChatGPT
// ---------------------------------------------------------------------------

test.describe("LLM Prompt Purify - UI Interactions", () => {
  test("shows toast notification on detection", async ({ page }) => {
    await page.goto(mockPath("chatgpt.html"));
    await injectScript(page);
    await setPromptText(page, "Email: test@example.com");

    const toast = page.locator("#llm-purify-toast-root");
    await expect(toast).toBeVisible({ timeout: 5000 });

    const title = page.locator("#llm-purify-toast-title");
    await expect(title).toContainText("Sensitive Data Detected");
  });

  test("shows detected count", async ({ page }) => {
    await page.goto(mockPath("chatgpt.html"));
    await injectScript(page);
    await setPromptText(page, "Email: test@mail.com");

    const count = page.locator(".llm-purify-detected-count");
    await expect(count).toBeVisible({ timeout: 5000 });
    await expect(count).not.toHaveText("0");
  });

  test("dismiss button hides toast", async ({ page }) => {
    await page.goto(mockPath("chatgpt.html"));
    await injectScript(page);
    await setPromptText(page, "SSN: 123-45-6789");

    const toast = page.locator("#llm-purify-toast-root");
    await expect(toast).toBeVisible({ timeout: 5000 });

    const dismissBtn = page.locator('[data-action="dismiss"]');
    await dismissBtn.click();

    await expect(toast).toHaveAttribute("aria-hidden", "true");
  });

  test("view masks button opens suggestions panel", async ({ page }) => {
    await page.goto(mockPath("chatgpt.html"));
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

// ---------------------------------------------------------------------------
// Claude — contenteditable
// ---------------------------------------------------------------------------

test.describe("LLM Prompt Purify - Claude Interface", () => {
  test("works with contenteditable inputs", async ({ page }) => {
    await page.goto(mockPath("claude.html"));
    await injectScript(page);
    await setPromptText(page, "AWS key: AKIAIOSFODNN7EXAMPLE");

    const toast = page.locator("#llm-purify-toast-root");
    await expect(toast).toBeVisible({ timeout: 5000 });
  });

  test("detects multiple sensitive data types", async ({ page }) => {
    await page.goto(mockPath("claude.html"));
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

// ---------------------------------------------------------------------------
// Provider-specific mock tests
// Each provider mock uses the exact selectors from INPUT_SELECTORS in
// content.js so the content script can discover and attach to them.
// ---------------------------------------------------------------------------

test.describe("LLM Prompt Purify - Gemini Interface", () => {
  test("detects sensitive data in rich-textarea", async ({ page }) => {
    await page.goto(mockPath("gemini.html"));
    await injectScript(page);
    await setPromptText(page, "Contact: maria.garcia@company.org");

    const toast = page.locator("#llm-purify-toast-root");
    await expect(toast).toBeVisible({ timeout: 5000 });
  });

  test("detects API keys via Gemini input", async ({ page }) => {
    await page.goto(mockPath("gemini.html"));
    await injectScript(page);
    await setPromptText(
      page,
      "My Google API key is AIzaSyD-example_key_1234567890abcde",
    );

    const toast = page.locator("#llm-purify-toast-root");
    await expect(toast).toBeVisible({ timeout: 5000 });
  });
});

test.describe("LLM Prompt Purify - Copilot Interface", () => {
  test("detects sensitive data via #searchbox", async ({ page }) => {
    await page.goto(mockPath("copilot.html"));
    await injectScript(page);
    await setPromptText(
      page,
      "GitHub token: ghp_ABCdef1234567890abcdef1234567890ABCD",
    );

    const toast = page.locator("#llm-purify-toast-root");
    await expect(toast).toBeVisible({ timeout: 5000 });
  });

  test("detects address data in Copilot", async ({ page }) => {
    await page.goto(mockPath("copilot.html"));
    await injectScript(page);
    await setPromptText(
      page,
      "Send invoice to 789 Pine Street, Apt 4B, Seattle, WA 98101",
    );

    const toast = page.locator("#llm-purify-toast-root");
    await expect(toast).toBeVisible({ timeout: 5000 });
  });
});

test.describe("LLM Prompt Purify - DeepSeek Interface", () => {
  test("detects passwords via #chat-input", async ({ page }) => {
    await page.goto(mockPath("deepseek.html"));
    await injectScript(page);
    await setPromptText(
      page,
      "Here is my database password: root_admin_P@ss2024!",
    );

    const toast = page.locator("#llm-purify-toast-root");
    await expect(toast).toBeVisible({ timeout: 5000 });
  });

  test("detects SSN in DeepSeek", async ({ page }) => {
    await page.goto(mockPath("deepseek.html"));
    await injectScript(page);
    await setPromptText(page, "My social security number is 078-05-1120");

    const toast = page.locator("#llm-purify-toast-root");
    await expect(toast).toBeVisible({ timeout: 5000 });
  });
});

test.describe("LLM Prompt Purify - Perplexity Interface", () => {
  test("detects sensitive data via Ask anything textarea", async ({
    page,
  }) => {
    await page.goto(mockPath("perplexity.html"));
    await injectScript(page);
    await setPromptText(
      page,
      "My Stripe secret key is sk_live_abc123def456\x67hi789jkl012mno",
    );

    const toast = page.locator("#llm-purify-toast-root");
    await expect(toast).toBeVisible({ timeout: 5000 });
  });

  test("detects patient IDs in Perplexity", async ({ page }) => {
    await page.goto(mockPath("perplexity.html"));
    await injectScript(page);
    await setPromptText(
      page,
      "Patient ID: 123-45-6789, diagnosed on 2024-01-15",
    );

    const toast = page.locator("#llm-purify-toast-root");
    await expect(toast).toBeVisible({ timeout: 5000 });
  });
});

test.describe("LLM Prompt Purify - HuggingFace Interface", () => {
  test("detects tokens via HF Ask placeholder", async ({ page }) => {
    await page.goto(mockPath("huggingface.html"));
    await injectScript(page);
    await setPromptText(
      page,
      "My HuggingFace token: hf_aBcDeFgHiJkLmNoPqRsTuVwXyZ0123456789",
    );

    const toast = page.locator("#llm-purify-toast-root");
    await expect(toast).toBeVisible({ timeout: 5000 });
  });

  test("detects medical data in HF input", async ({ page }) => {
    await page.goto(mockPath("huggingface.html"));
    await injectScript(page);
    await setPromptText(
      page,
      "Patient John Smith, MRN: 12345678, DOB: 1990-06-15",
    );

    const toast = page.locator("#llm-purify-toast-root");
    await expect(toast).toBeVisible({ timeout: 5000 });
  });
});

test.describe("LLM Prompt Purify - Poe Interface", () => {
  test("detects AWS secrets via ChatInput textarea", async ({ page }) => {
    await page.goto(mockPath("poe.html"));
    await injectScript(page);
    await setPromptText(
      page,
      "AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",
    );

    const toast = page.locator("#llm-purify-toast-root");
    await expect(toast).toBeVisible({ timeout: 5000 });
  });

  test("detects credit cards in Poe", async ({ page }) => {
    await page.goto(mockPath("poe.html"));
    await injectScript(page);
    await setPromptText(
      page,
      "My credit card: 5555-5555-5555-4444 exp 12/26 CVV 123",
    );

    const toast = page.locator("#llm-purify-toast-root");
    await expect(toast).toBeVisible({ timeout: 5000 });
  });
});

test.describe("LLM Prompt Purify - Grok Interface", () => {
  test("detects crypto wallets via Grok input", async ({ page }) => {
    await page.goto(mockPath("grok.html"));
    await injectScript(page);
    await setPromptText(
      page,
      "My Bitcoin wallet: 1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa",
    );

    const toast = page.locator("#llm-purify-toast-root");
    await expect(toast).toBeVisible({ timeout: 5000 });
  });

  test("detects phone numbers in Grok", async ({ page }) => {
    await page.goto(mockPath("grok.html"));
    await injectScript(page);
    await setPromptText(
      page,
      "Call our office at (212) 555-0198, ext. 432",
    );

    const toast = page.locator("#llm-purify-toast-root");
    await expect(toast).toBeVisible({ timeout: 5000 });
  });
});

// ---------------------------------------------------------------------------
// Edge cases
// ---------------------------------------------------------------------------

test.describe("LLM Prompt Purify - Edge Cases", () => {
  test("no toast for clean text", async ({ page }) => {
    await page.goto(mockPath("chatgpt.html"));
    await injectScript(page);
    await setPromptText(page, "Hello, how are you today?");

    // When no sensitive data is detected, toast should not be visible
    // (either not present in DOM or hidden)
    const toast = page.locator("#llm-purify-toast-root");
    await expect(toast).not.toBeVisible({ timeout: 2000 });
  });

  test("handles rapid input changes", async ({ page }) => {
    await page.goto(mockPath("chatgpt.html"));
    await injectScript(page);

    await setPromptText(page, "Email: a@b.com");
    await page.waitForTimeout(100);
    await setPromptText(page, "Different: c@d.com");
    await page.waitForTimeout(100);
    await setPromptText(page, "Another: e@f.com");

    const toast = page.locator("#llm-purify-toast-root");
    await expect(toast).toBeVisible({ timeout: 5000 });
  });

  test("clean text on Gemini shows no toast", async ({ page }) => {
    await page.goto(mockPath("gemini.html"));
    await injectScript(page);
    await setPromptText(page, "What is the weather in Tokyo?");

    const toast = page.locator("#llm-purify-toast-root");
    await expect(toast).not.toBeVisible({ timeout: 2000 });
  });

  test("clean text on DeepSeek shows no toast", async ({ page }) => {
    await page.goto(mockPath("deepseek.html"));
    await injectScript(page);
    await setPromptText(page, "Explain quantum computing in simple terms.");

    const toast = page.locator("#llm-purify-toast-root");
    await expect(toast).not.toBeVisible({ timeout: 2000 });
  });
});
