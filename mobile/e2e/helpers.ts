/**
 * Shared helpers for Detox E2E specs.
 *
 * Detox wraps **Espresso** on Android and **XCTest / Earl Grey 2**
 * on iOS, so every call here ultimately maps to native assertions.
 */
import { device, element, by, expect, waitFor } from "detox";

/* ── constants ─────────────────────────────────────────────── */

/** Timeout for the scan engine to finalize masking (debounce + regex). */
export const SCAN_SETTLE_MS = 3_000;

/** Timeout for modals to animate open/closed. */
export const MODAL_ANIM_MS = 800;

/** Sample prompts containing well-known PII patterns. */
export const SAMPLE_PROMPTS = {
  emailOnly: "Please email john.doe@example.com for info.",
  ssnOnly: "My SSN is 123-45-6789 — keep it safe.",
  cpfOnly: "Meu CPF é 529.982.247-25, pode conferir.",
  phoneOnly: "Call me at +1 (555) 234-5678 tomorrow.",
  apiKeyOnly: "Use key sk-proj-ABCDEFghijklmnopqrstu to auth.",
  jwtOnly:
    "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U",
  mixed: [
    "Hi, I'm Jane Smith (jane.smith@acme.org).",
    "My SSN is 987-65-4321 and CPF is 529.982.247-25.",
    "API key: sk-live-AABBCCDD1122334455667788.",
    "Call +44 20 7946 0958 for support.",
  ].join("\n"),
  clean: "The quick brown fox jumps over the lazy dog.",
} as const;

/* ── element selectors ─────────────────────────────────────── */

export const $ = {
  /** Raw-prompt text input. */
  sourceInput: () => element(by.id("source-textarea")),
  /** Masked output display. */
  maskedOutput: () => element(by.id("masked-output")),
  /** Country-scope modal trigger. */
  countryModalBtn: () => element(by.id("country-modal-button")),
  /** Settings modal trigger. */
  settingsBtn: () => element(by.id("settings-button")),
  /** Global-only detection toggle inside Settings modal. */
  globalOnlyToggle: () => element(by.id("global-only-toggle")),
  /** Per-country toggle in CountryScopeModal. */
  countryToggle: (id: string) => element(by.id(`country-toggle-${id}`)),
  /** Per-group enable toggle in ControlsPanel. */
  groupToggle: (id: string) => element(by.id(`group-toggle-${id}`)),
  /** Per-group always-on (lock) toggle. */
  groupLock: (id: string) => element(by.id(`group-lock-${id}`)),
  /** Per-match enable toggle. */
  matchToggle: (ruleId: string) => element(by.id(`toggle-${ruleId}`)),
  /** Per-match regenerate button. */
  matchRegenerate: (ruleId: string) =>
    element(by.id(`regenerate-${ruleId}`)),
} as const;

/* ── helpers ───────────────────────────────────────────────── */

/**
 * Type text into the source textarea and wait for the scan engine
 * to settle (debounce + regex processing).
 */
export async function typeAndWaitForScan(text: string): Promise<void> {
  await $.sourceInput().clearText();
  await $.sourceInput().typeText(text);

  // Wait for masked output to become visible (scan complete)
  await waitFor($.maskedOutput())
    .toBeVisible()
    .withTimeout(SCAN_SETTLE_MS);
}

/**
 * Replace the source textarea content in one shot (faster than typeText
 * for long strings).
 */
export async function replaceSourceText(text: string): Promise<void> {
  await $.sourceInput().clearText();
  await $.sourceInput().replaceText(text);
  await waitFor($.maskedOutput())
    .toBeVisible()
    .withTimeout(SCAN_SETTLE_MS);
}

/** Reload the React Native JS bundle (useful between groups). */
export async function reloadApp(): Promise<void> {
  await device.reloadReactNative();
}

/** Launch/relaunch the app with a fresh state. */
export async function launchFresh(): Promise<void> {
  await device.launchApp({ newInstance: true, delete: true });
}

/**
 * Assert that the masked output does NOT contain the given literal
 * (i.e. PII was successfully masked).
 */
export async function expectMaskedOutputToNotContain(
  literal: string,
): Promise<void> {
  await expect($.maskedOutput()).not.toHaveText(
    expect.stringContaining(literal) as unknown as string,
  );
}
