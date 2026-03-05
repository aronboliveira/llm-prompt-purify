/**
 * E2E · Core Scan Workflow
 *
 * Exercises the primary user journey:
 *   paste → scan → review → copy
 *
 * Detox → Espresso (Android) / XCTest-EarlGrey (iOS)
 */
import { device, element, by, expect, waitFor } from "detox";
import {
  $,
  launchFresh,
  replaceSourceText,
  typeAndWaitForScan,
  SAMPLE_PROMPTS,
  SCAN_SETTLE_MS,
} from "./helpers";

describe("Scan Workflow", () => {
  beforeAll(async () => {
    await launchFresh();
  });

  afterEach(async () => {
    // Reset between tests by clearing the input
    await $.sourceInput().clearText();
  });

  /* ── Basic scanning ──────────────────────────────────────── */

  describe("email masking", () => {
    it("should mask an email address in the output", async () => {
      await typeAndWaitForScan(SAMPLE_PROMPTS.emailOnly);

      // The masked output should be visible
      await expect($.maskedOutput()).toBeVisible();

      // The raw email should NOT appear in the masked output
      await expect($.maskedOutput()).not.toHaveText(
        SAMPLE_PROMPTS.emailOnly,
      );
    });
  });

  describe("SSN masking", () => {
    it("should mask a US Social Security Number", async () => {
      await typeAndWaitForScan(SAMPLE_PROMPTS.ssnOnly);
      await expect($.maskedOutput()).toBeVisible();
      await expect($.maskedOutput()).not.toHaveText(
        SAMPLE_PROMPTS.ssnOnly,
      );
    });
  });

  describe("API key masking", () => {
    it("should mask an OpenAI-style API key", async () => {
      await typeAndWaitForScan(SAMPLE_PROMPTS.apiKeyOnly);
      await expect($.maskedOutput()).toBeVisible();
      await expect($.maskedOutput()).not.toHaveText(
        SAMPLE_PROMPTS.apiKeyOnly,
      );
    });
  });

  describe("JWT masking", () => {
    it("should mask a JWT token", async () => {
      await typeAndWaitForScan(SAMPLE_PROMPTS.jwtOnly);
      await expect($.maskedOutput()).toBeVisible();
      await expect($.maskedOutput()).not.toHaveText(
        SAMPLE_PROMPTS.jwtOnly,
      );
    });
  });

  describe("phone number masking", () => {
    it("should mask a phone number", async () => {
      await typeAndWaitForScan(SAMPLE_PROMPTS.phoneOnly);
      await expect($.maskedOutput()).toBeVisible();
      await expect($.maskedOutput()).not.toHaveText(
        SAMPLE_PROMPTS.phoneOnly,
      );
    });
  });

  describe("CPF masking", () => {
    it("should mask a Brazilian CPF", async () => {
      await typeAndWaitForScan(SAMPLE_PROMPTS.cpfOnly);
      await expect($.maskedOutput()).toBeVisible();
      await expect($.maskedOutput()).not.toHaveText(
        SAMPLE_PROMPTS.cpfOnly,
      );
    });
  });

  /* ── Multi-PII ───────────────────────────────────────────── */

  describe("mixed PII prompt", () => {
    it("should mask all PII types in a mixed prompt", async () => {
      await replaceSourceText(SAMPLE_PROMPTS.mixed);
      await expect($.maskedOutput()).toBeVisible();

      // None of the raw PII should survive in the output
      await expect($.maskedOutput()).not.toHaveText(
        "jane.smith@acme.org",
      );
      await expect($.maskedOutput()).not.toHaveText("987-65-4321");
      await expect($.maskedOutput()).not.toHaveText("529.982.247-25");
    });
  });

  /* ── Clean text ──────────────────────────────────────────── */

  describe("clean text (no PII)", () => {
    it("should pass clean text through unchanged", async () => {
      await typeAndWaitForScan(SAMPLE_PROMPTS.clean);
      await expect($.maskedOutput()).toBeVisible();
      // Clean text should remain identical
      await expect($.maskedOutput()).toHaveText(SAMPLE_PROMPTS.clean);
    });
  });

  /* ── Replace text ────────────────────────────────────────── */

  describe("replacing source text", () => {
    it("should re-scan when text changes", async () => {
      // First scan with email
      await typeAndWaitForScan(SAMPLE_PROMPTS.emailOnly);
      await expect($.maskedOutput()).toBeVisible();

      // Replace with SSN
      await replaceSourceText(SAMPLE_PROMPTS.ssnOnly);
      await expect($.maskedOutput()).toBeVisible();
      await expect($.maskedOutput()).not.toHaveText("123-45-6789");
    });
  });
});
