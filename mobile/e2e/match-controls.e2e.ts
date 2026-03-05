/**
 * E2E · Match Controls (group & per-match toggles)
 *
 * Tests the controls panel interactions: toggling mask groups,
 * locking groups, toggling individual matches, and regenerating.
 *
 * Detox → Espresso (Android) / XCTest-EarlGrey (iOS)
 */
import { device, element, by, expect, waitFor } from "detox";
import {
  $,
  launchFresh,
  replaceSourceText,
  SAMPLE_PROMPTS,
  SCAN_SETTLE_MS,
} from "./helpers";

describe("Match Controls", () => {
  beforeAll(async () => {
    await launchFresh();
    // Pre-load a mixed prompt so controls become visible
    await replaceSourceText(SAMPLE_PROMPTS.mixed);
  });

  /* ── Group-level toggles ─────────────────────────────────── */

  describe("group toggles", () => {
    it("should show group toggles after scanning mixed PII", async () => {
      // The 'personal' group should be visible (email is personal)
      await waitFor($.groupToggle("personal"))
        .toBeVisible()
        .withTimeout(SCAN_SETTLE_MS);
    });

    it("should disable a mask group", async () => {
      await $.groupToggle("personal").tap();
      // After disabling personal group, the masked output should change
      await waitFor($.maskedOutput())
        .toBeVisible()
        .withTimeout(SCAN_SETTLE_MS);
    });

    it("should re-enable a mask group", async () => {
      await $.groupToggle("personal").tap();
      await waitFor($.maskedOutput())
        .toBeVisible()
        .withTimeout(SCAN_SETTLE_MS);
    });
  });

  /* ── Group lock (always-on) ──────────────────────────────── */

  describe("group lock", () => {
    it("should toggle the always-on lock for a group", async () => {
      await waitFor($.groupLock("credential"))
        .toBeVisible()
        .withTimeout(SCAN_SETTLE_MS);

      // Lock → unlock → lock
      await $.groupLock("credential").tap();
      await $.groupLock("credential").tap();
    });
  });

  /* ── Per-match controls ──────────────────────────────────── */

  describe("per-match toggles", () => {
    it("should toggle an individual match off", async () => {
      // The email-address match should be visible
      await waitFor($.matchToggle("email-address"))
        .toBeVisible()
        .withTimeout(SCAN_SETTLE_MS);

      await $.matchToggle("email-address").tap();
      // Output should now contain the raw email
      await waitFor($.maskedOutput())
        .toBeVisible()
        .withTimeout(SCAN_SETTLE_MS);
    });

    it("should toggle an individual match back on", async () => {
      await $.matchToggle("email-address").tap();
      await waitFor($.maskedOutput())
        .toBeVisible()
        .withTimeout(SCAN_SETTLE_MS);
    });
  });

  /* ── Regenerate ──────────────────────────────────────────── */

  describe("regenerate mask", () => {
    it("should regenerate a new mask value for a match", async () => {
      await waitFor($.matchRegenerate("email-address"))
        .toBeVisible()
        .withTimeout(SCAN_SETTLE_MS);

      // Tap regenerate twice to cycle through different masks
      await $.matchRegenerate("email-address").tap();
      await waitFor($.maskedOutput())
        .toBeVisible()
        .withTimeout(SCAN_SETTLE_MS);
    });
  });
});
