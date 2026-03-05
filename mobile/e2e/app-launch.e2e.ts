/**
 * E2E · App Launch & Navigation
 *
 * Validates that the application boots correctly, renders
 * the primary scanner screen, and all major sections are visible.
 *
 * Detox → Espresso (Android) / XCTest-EarlGrey (iOS)
 */
import { device, element, by, expect } from "detox";
import { $, launchFresh } from "./helpers";

describe("App Launch", () => {
  beforeAll(async () => {
    await launchFresh();
  });

  it("should display the scanner screen after launch", async () => {
    await expect($.sourceInput()).toBeVisible();
  });

  it("should show the product header and hero", async () => {
    await expect(element(by.text("LLM Prompt Purifier"))).toBeVisible();
  });

  it("should display the empty source textarea", async () => {
    await expect($.sourceInput()).toBeVisible();
    // Placeholder should be visible when field is empty
  });

  it("should show the country-scope button in the toolbar", async () => {
    await expect($.countryModalBtn()).toBeVisible();
  });

  it("should show the settings button in the toolbar", async () => {
    await expect($.settingsBtn()).toBeVisible();
  });
});
