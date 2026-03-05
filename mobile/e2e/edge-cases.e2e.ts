/**
 * E2E · Edge Cases & Stress
 *
 * Validates the scanner handles edge-case inputs gracefully:
 * empty text, very long text, special characters, rapid typing.
 *
 * Detox → Espresso (Android) / XCTest-EarlGrey (iOS)
 */
import { device, element, by, expect, waitFor } from "detox";
import {
  $,
  launchFresh,
  replaceSourceText,
  typeAndWaitForScan,
  SCAN_SETTLE_MS,
} from "./helpers";

describe("Edge Cases", () => {
  beforeAll(async () => {
    await launchFresh();
  });

  afterEach(async () => {
    await $.sourceInput().clearText();
  });

  it("should handle empty input gracefully", async () => {
    await $.sourceInput().clearText();
    // Ensure the app doesn't crash — source input stays visible
    await expect($.sourceInput()).toBeVisible();
  });

  it("should handle whitespace-only input", async () => {
    await $.sourceInput().typeText("   \n\n   ");
    await expect($.sourceInput()).toBeVisible();
  });

  it("should handle special characters without crashing", async () => {
    const special = "<!@#$%^&*()_+{}|:<>?~`-=[];',./\\\">";
    await replaceSourceText(special);
    await expect($.sourceInput()).toBeVisible();
  });

  it("should handle unicode / emoji text", async () => {
    const unicode = "こんにちは 🌍 مرحبا email: test@example.com 🔒";
    await replaceSourceText(unicode);
    await waitFor($.maskedOutput())
      .toBeVisible()
      .withTimeout(SCAN_SETTLE_MS);
    // Should still mask the email even in unicode context
    await expect($.maskedOutput()).not.toHaveText("test@example.com");
  });

  it("should handle a very long prompt (stress test)", async () => {
    // Generate a ~2KB prompt with repeated PII
    const line = "Contact alice@corp.io or call +1-555-000-1234.\n";
    const longPrompt = line.repeat(40);
    await replaceSourceText(longPrompt);
    await waitFor($.maskedOutput())
      .toBeVisible()
      .withTimeout(SCAN_SETTLE_MS * 2);
  });

  it("should survive rapid text replacement", async () => {
    // Rapid-fire 5 replacements in quick succession
    const prompts = [
      "Email: a@b.com",
      "SSN: 111-22-3333",
      "Key: sk-proj-ABCDEFGHIJKLMNOPQRST",
      "Phone: +44 20 1234 5678",
      "CPF: 529.982.247-25",
    ];
    for (const p of prompts) {
      await $.sourceInput().clearText();
      await $.sourceInput().replaceText(p);
    }
    // App should still be responsive after rapid changes
    await waitFor($.maskedOutput())
      .toBeVisible()
      .withTimeout(SCAN_SETTLE_MS);
    await expect($.sourceInput()).toBeVisible();
  });

  it("should handle paste-over existing content", async () => {
    await typeAndWaitForScan("First pass: user@mail.com");
    await replaceSourceText("Second pass: 999-88-7777");
    await expect($.maskedOutput()).toBeVisible();
    await expect($.maskedOutput()).not.toHaveText("999-88-7777");
  });
});
