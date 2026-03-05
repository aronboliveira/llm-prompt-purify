/**
 * Unit tests for match-control utility functions.
 * Covers toggleMatchEnabled, setAllEditableMatchesEnabled,
 * countEditableMatches, countEnabledMatches.
 */
import {
  toggleMatchEnabled,
  setAllEditableMatchesEnabled,
  countEditableMatches,
  countEnabledMatches,
} from "../utils/match-control.utils";
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
// toggleMatchEnabled
// ---------------------------------------------------------------------------
describe("toggleMatchEnabled", () => {
  it("toggles enabled state for matching ID", () => {
    const matches = [makeMatch({ id: "m1", enabled: true })];
    const result = toggleMatchEnabled(matches, "m1", false);
    expect(result[0].enabled).toBe(false);
  });

  it("does not modify locked matches", () => {
    const matches = [makeMatch({ id: "m1", enabled: true, locked: true })];
    const result = toggleMatchEnabled(matches, "m1", false);
    expect(result[0].enabled).toBe(true);
  });

  it("does not modify unrelated matches", () => {
    const matches = [
      makeMatch({ id: "m1", enabled: true }),
      makeMatch({ id: "m2", enabled: false }),
    ];
    const result = toggleMatchEnabled(matches, "m1", false);
    expect(result[1].enabled).toBe(false); // unchanged
  });
});

// ---------------------------------------------------------------------------
// setAllEditableMatchesEnabled
// ---------------------------------------------------------------------------
describe("setAllEditableMatchesEnabled", () => {
  it("enables all non-locked matches in enabled groups", () => {
    const prefs = createGroupPreferenceMap();
    const matches = [
      makeMatch({ id: "m1", enabled: false, locked: false }),
      makeMatch({ id: "m2", enabled: false, locked: false, groupId: "personal" }),
    ];

    const result = setAllEditableMatchesEnabled(matches, prefs, true);
    expect(result.every((m) => m.enabled)).toBe(true);
  });

  it("skips locked matches", () => {
    const prefs = createGroupPreferenceMap();
    const matches = [
      makeMatch({ id: "m1", enabled: false, locked: true }),
    ];

    const result = setAllEditableMatchesEnabled(matches, prefs, true);
    expect(result[0].enabled).toBe(false);
  });

  it("skips matches whose group is disabled", () => {
    const prefs = createGroupPreferenceMap({
      identifier: { enabled: false },
    });
    const matches = [
      makeMatch({ id: "m1", enabled: true, groupId: "identifier" }),
    ];

    const result = setAllEditableMatchesEnabled(matches, prefs, false);
    expect(result[0].enabled).toBe(true); // group disabled → not editable
  });
});

// ---------------------------------------------------------------------------
// countEditableMatches
// ---------------------------------------------------------------------------
describe("countEditableMatches", () => {
  it("counts non-locked matches", () => {
    const matches = [
      makeMatch({ locked: false }),
      makeMatch({ locked: true, id: "m2" }),
      makeMatch({ locked: false, id: "m3" }),
    ];

    expect(countEditableMatches(matches)).toBe(2);
  });

  it("returns 0 for empty array", () => {
    expect(countEditableMatches([])).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// countEnabledMatches
// ---------------------------------------------------------------------------
describe("countEnabledMatches", () => {
  it("counts enabled matches", () => {
    const matches = [
      makeMatch({ enabled: true }),
      makeMatch({ enabled: false, id: "m2" }),
      makeMatch({ enabled: true, id: "m3" }),
    ];

    expect(countEnabledMatches(matches)).toBe(2);
  });

  it("returns 0 for empty array", () => {
    expect(countEnabledMatches([])).toBe(0);
  });
});
