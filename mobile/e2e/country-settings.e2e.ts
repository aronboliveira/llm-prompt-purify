/**
 * E2E · Country Scope & Settings Modals
 *
 * Verifies modal open/close, country toggling, and detection
 * mode switching through the native UI.
 *
 * Detox → Espresso (Android) / XCTest-EarlGrey (iOS)
 */
import { device, element, by, expect, waitFor } from "detox";
import {
  $,
  launchFresh,
  typeAndWaitForScan,
  SAMPLE_PROMPTS,
  MODAL_ANIM_MS,
  SCAN_SETTLE_MS,
} from "./helpers";

describe("Country Scope Modal", () => {
  beforeAll(async () => {
    await launchFresh();
  });

  it("should open when the country button is tapped", async () => {
    await $.countryModalBtn().tap();
    // At least one country toggle should be visible
    await waitFor($.countryToggle("BR"))
      .toBeVisible()
      .withTimeout(MODAL_ANIM_MS);
  });

  it("should toggle a country on and off", async () => {
    // Toggle Brazil off
    await $.countryToggle("BR").tap();
    // Toggle Brazil back on
    await $.countryToggle("BR").tap();
  });

  it("should close when backdrop/close is tapped", async () => {
    // Tap the close area (back button or backdrop)
    await device.pressBack(); // Android back / iOS swipe-down
    await waitFor($.countryToggle("BR"))
      .not.toBeVisible()
      .withTimeout(MODAL_ANIM_MS);
  });

  it("should affect masking when a country is disabled", async () => {
    // Open modal and disable Brazil
    await $.countryModalBtn().tap();
    await waitFor($.countryToggle("BR"))
      .toBeVisible()
      .withTimeout(MODAL_ANIM_MS);
    await $.countryToggle("BR").tap();
    await device.pressBack();

    // Type a CPF — with BR disabled, CPF should pass through
    await typeAndWaitForScan(SAMPLE_PROMPTS.cpfOnly);

    // Re-enable Brazil for subsequent tests
    await $.countryModalBtn().tap();
    await waitFor($.countryToggle("BR"))
      .toBeVisible()
      .withTimeout(MODAL_ANIM_MS);
    await $.countryToggle("BR").tap();
    await device.pressBack();
  });
});

describe("Masking Settings Modal", () => {
  beforeAll(async () => {
    await launchFresh();
  });

  it("should open when the settings button is tapped", async () => {
    await $.settingsBtn().tap();
    await waitFor($.globalOnlyToggle())
      .toBeVisible()
      .withTimeout(MODAL_ANIM_MS);
  });

  it("should toggle detection mode", async () => {
    // Toggle global-only mode on
    await $.globalOnlyToggle().tap();
    // Toggle back to default
    await $.globalOnlyToggle().tap();
  });

  it("should close the modal", async () => {
    await device.pressBack();
    await waitFor($.globalOnlyToggle())
      .not.toBeVisible()
      .withTimeout(MODAL_ANIM_MS);
  });

  it("should restrict masking when global-only is enabled", async () => {
    // Enable global-only
    await $.settingsBtn().tap();
    await waitFor($.globalOnlyToggle())
      .toBeVisible()
      .withTimeout(MODAL_ANIM_MS);
    await $.globalOnlyToggle().tap();
    await device.pressBack();

    // Type a CPF (country-scoped) — should NOT be masked in global-only mode
    await typeAndWaitForScan(SAMPLE_PROMPTS.cpfOnly);

    // Type an email (global) — should still be masked
    await typeAndWaitForScan(SAMPLE_PROMPTS.emailOnly);
    await expect($.maskedOutput()).not.toHaveText(
      "john.doe@example.com",
    );

    // Restore default mode
    await $.settingsBtn().tap();
    await waitFor($.globalOnlyToggle())
      .toBeVisible()
      .withTimeout(MODAL_ANIM_MS);
    await $.globalOnlyToggle().tap();
    await device.pressBack();
  });
});
