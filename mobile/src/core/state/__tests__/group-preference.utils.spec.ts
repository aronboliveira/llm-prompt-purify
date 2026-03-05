/**
 * Unit tests for group-preference utility functions.
 * Covers computeNextAlwaysOnPreferences, computeNextEnabledPreferences,
 * applyAlwaysOnToMatches, applyEnabledToMatches.
 */
import {
  computeNextAlwaysOnPreferences,
  computeNextEnabledPreferences,
  applyAlwaysOnToMatches,
  applyEnabledToMatches,
} from "../utils/group-preference.utils";
import { createGroupPreferenceMap } from "../../masking/utils/mask-group.utils";
import type { ScanMatch } from "../../masking/declarations/masking.types";

function makeMatch(overrides: Partial<ScanMatch> = {}): ScanMatch {
  return {
    id: "m1",
    ruleId: "test-rule",
    label: "Test",
    category: "identifier",
    confidence: "high",
    groupId: "identifier",
    locale: "shared",
    start: 0,
    end: 5,
    value: "hello",
    mask: "XXXXX",
    enabled: true,
    locked: false,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// computeNextAlwaysOnPreferences
// ---------------------------------------------------------------------------
describe("computeNextAlwaysOnPreferences", () => {
  it("enables alwaysOn and force-enables the group", () => {
    const prefs = createGroupPreferenceMap({
      financial: { enabled: false, alwaysOn: false },
    });

    const next = computeNextAlwaysOnPreferences(prefs, "financial", true);
    expect(next.financial.alwaysOn).toBe(true);
    expect(next.financial.enabled).toBe(true);
  });

  it("disables alwaysOn but preserves enabled", () => {
    const prefs = createGroupPreferenceMap({
      financial: { enabled: true, alwaysOn: true },
    });

    const next = computeNextAlwaysOnPreferences(prefs, "financial", false);
    expect(next.financial.alwaysOn).toBe(false);
    expect(next.financial.enabled).toBe(true);
  });

  it("does not affect other groups", () => {
    const prefs = createGroupPreferenceMap();
    const next = computeNextAlwaysOnPreferences(prefs, "financial", true);

    expect(next.identifier.alwaysOn).toBe(prefs.identifier.alwaysOn);
    expect(next.personal.alwaysOn).toBe(prefs.personal.alwaysOn);
  });
});

// ---------------------------------------------------------------------------
// computeNextEnabledPreferences
// ---------------------------------------------------------------------------
describe("computeNextEnabledPreferences", () => {
  it("enables a group and preserves its alwaysOn", () => {
    const prefs = createGroupPreferenceMap({
      financial: { enabled: false, alwaysOn: false },
    });

    const next = computeNextEnabledPreferences(prefs, "financial", true);
    expect(next.financial.enabled).toBe(true);
    expect(next.financial.alwaysOn).toBe(false);
  });

  it("disables a group and also disables alwaysOn", () => {
    const prefs = createGroupPreferenceMap({
      financial: { enabled: true, alwaysOn: true },
    });

    const next = computeNextEnabledPreferences(prefs, "financial", false);
    expect(next.financial.enabled).toBe(false);
    expect(next.financial.alwaysOn).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// applyAlwaysOnToMatches
// ---------------------------------------------------------------------------
describe("applyAlwaysOnToMatches", () => {
  it("enables and locks matches when alwaysOn is true", () => {
    const matches = [
      makeMatch({ groupId: "identifier", enabled: false, locked: false }),
    ];

    const result = applyAlwaysOnToMatches(matches, "identifier", true);
    expect(result[0].enabled).toBe(true);
    expect(result[0].locked).toBe(true);
  });

  it("unlocks matches when alwaysOn is false", () => {
    const matches = [
      makeMatch({ groupId: "identifier", enabled: true, locked: true }),
    ];

    const result = applyAlwaysOnToMatches(matches, "identifier", false);
    // enabled stays as-is, locked becomes false
    expect(result[0].enabled).toBe(true);
    expect(result[0].locked).toBe(false);
  });

  it("does not affect matches in other groups", () => {
    const matches = [
      makeMatch({ groupId: "financial", enabled: true, locked: false }),
    ];

    const result = applyAlwaysOnToMatches(matches, "identifier", true);
    expect(result[0].enabled).toBe(true);
    expect(result[0].locked).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// applyEnabledToMatches
// ---------------------------------------------------------------------------
describe("applyEnabledToMatches", () => {
  it("enables matches and sets lock from alwaysOnAfter", () => {
    const matches = [
      makeMatch({ groupId: "identifier", enabled: false, locked: false }),
    ];

    const result = applyEnabledToMatches(matches, "identifier", true, true);
    expect(result[0].enabled).toBe(true);
    expect(result[0].locked).toBe(true);
  });

  it("disables matches and unlocks them", () => {
    const matches = [
      makeMatch({ groupId: "identifier", enabled: true, locked: true }),
    ];

    const result = applyEnabledToMatches(matches, "identifier", false, false);
    expect(result[0].enabled).toBe(false);
    expect(result[0].locked).toBe(false);
  });

  it("does not affect other groups", () => {
    const matches = [
      makeMatch({ groupId: "financial", enabled: true, locked: false }),
    ];

    const result = applyEnabledToMatches(matches, "identifier", false, false);
    expect(result[0].enabled).toBe(true);
    expect(result[0].locked).toBe(false);
  });
});
