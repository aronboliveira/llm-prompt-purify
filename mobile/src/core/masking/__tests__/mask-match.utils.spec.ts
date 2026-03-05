/**
 * Unit tests for mask-match utility functions.
 * Covers buildCandidateMatch, applyEnabledMasks, applyGroupPreferences,
 * extractCandidateMatch, resolveOverlaps, summarizeGroupCounts.
 */
import {
  applyEnabledMasks,
  applyGroupPreferences,
  buildCandidateMatch,
  extractCandidateMatch,
  resolveOverlaps,
  summarizeGroupCounts,
} from "../utils/mask-match.utils";
import { createGroupPreferenceMap } from "../utils/mask-group.utils";
import type {
  CandidateMatch,
  DetectionRule,
  ScanMatch,
} from "../declarations/masking.types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function makeRule(overrides: Partial<DetectionRule> = {}): DetectionRule {
  return {
    category: "identifier",
    confidence: "high",
    coverage: "global",
    id: "test-rule",
    label: "Test",
    locale: "shared",
    patternFactory: () => /test/gi,
    priority: 1,
    ...overrides,
  };
}

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
// buildCandidateMatch
// ---------------------------------------------------------------------------
describe("buildCandidateMatch", () => {
  it("builds a candidate with correct fields", () => {
    const rule = makeRule();
    const candidate = buildCandidateMatch(rule, 10, 20, "some-value");

    expect(candidate.rule).toBe(rule);
    expect(candidate.start).toBe(10);
    expect(candidate.end).toBe(20);
    expect(candidate.value).toBe("some-value");
  });
});

// ---------------------------------------------------------------------------
// applyEnabledMasks
// ---------------------------------------------------------------------------
describe("applyEnabledMasks", () => {
  it("replaces enabled match ranges with mask text", () => {
    const text = "Hello World";
    const matches: ScanMatch[] = [
      makeMatch({ start: 0, end: 5, value: "Hello", mask: "XXXXX", enabled: true }),
    ];

    expect(applyEnabledMasks(text, matches)).toBe("XXXXX World");
  });

  it("skips disabled matches", () => {
    const text = "Hello World";
    const matches: ScanMatch[] = [
      makeMatch({ start: 0, end: 5, value: "Hello", mask: "XXXXX", enabled: false }),
    ];

    expect(applyEnabledMasks(text, matches)).toBe("Hello World");
  });

  it("handles multiple non-overlapping matches", () => {
    const text = "aaa bbb ccc";
    const matches: ScanMatch[] = [
      makeMatch({ id: "m1", start: 0, end: 3, value: "aaa", mask: "XXX", enabled: true }),
      makeMatch({ id: "m2", start: 4, end: 7, value: "bbb", mask: "YYY", enabled: true }),
    ];

    expect(applyEnabledMasks(text, matches)).toBe("XXX YYY ccc");
  });

  it("returns original text when no matches", () => {
    expect(applyEnabledMasks("Hello", [])).toBe("Hello");
  });
});

// ---------------------------------------------------------------------------
// applyGroupPreferences
// ---------------------------------------------------------------------------
describe("applyGroupPreferences", () => {
  it("disables matches whose group is disabled", () => {
    const prefs = createGroupPreferenceMap({
      identifier: { enabled: false },
    });

    const matches = [makeMatch({ groupId: "identifier", enabled: true })];
    const result = applyGroupPreferences(matches, prefs);

    expect(result[0].enabled).toBe(false);
    expect(result[0].locked).toBe(false);
  });

  it("locks matches whose group is alwaysOn", () => {
    const prefs = createGroupPreferenceMap({
      credential: { alwaysOn: true, enabled: true },
    });

    const matches = [
      makeMatch({ groupId: "credential", enabled: true }),
    ];
    const result = applyGroupPreferences(matches, prefs);

    expect(result[0].enabled).toBe(true);
    expect(result[0].locked).toBe(true);
  });

  it("preserves enabled state for normal groups", () => {
    const prefs = createGroupPreferenceMap(); // defaults
    const matches = [
      makeMatch({ groupId: "financial", enabled: false }),
    ];
    const result = applyGroupPreferences(matches, prefs);

    expect(result[0].enabled).toBe(false);
    expect(result[0].locked).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// extractCandidateMatch
// ---------------------------------------------------------------------------
describe("extractCandidateMatch", () => {
  it("extracts from full match when no valueGroup", () => {
    const regex = /hello/gi;
    const match = regex.exec("say hello world")!;
    const rule = makeRule();

    const candidate = extractCandidateMatch(match, rule);
    expect(candidate).not.toBeNull();
    expect(candidate!.value).toBe("hello");
    expect(candidate!.start).toBe(4);
    expect(candidate!.end).toBe(9);
  });

  it("extracts from capture group when valueGroup is set", () => {
    const regex = /name:\s*(\w+)/gi;
    const match = regex.exec("name: Alice")!;
    const rule = makeRule({ valueGroup: 1 });

    const candidate = extractCandidateMatch(match, rule);
    expect(candidate).not.toBeNull();
    expect(candidate!.value).toBe("Alice");
  });

  it("returns null when match has no index", () => {
    const fakeMatch = ["hello"] as unknown as RegExpMatchArray;
    const rule = makeRule();
    expect(extractCandidateMatch(fakeMatch, rule)).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// resolveOverlaps
// ---------------------------------------------------------------------------
describe("resolveOverlaps", () => {
  it("keeps non-overlapping candidates", () => {
    const rule = makeRule();
    const candidates: CandidateMatch[] = [
      buildCandidateMatch(rule, 0, 5, "hello"),
      buildCandidateMatch(rule, 6, 11, "world"),
    ];

    const resolved = resolveOverlaps(candidates);
    expect(resolved).toHaveLength(2);
  });

  it("resolves overlapping candidates by score", () => {
    const lowPriority = makeRule({ priority: 1, confidence: "medium" });
    const highPriority = makeRule({ priority: 5, confidence: "high" });

    const candidates: CandidateMatch[] = [
      buildCandidateMatch(lowPriority, 0, 10, "0123456789"),
      buildCandidateMatch(highPriority, 3, 8, "34567"),
    ];

    const resolved = resolveOverlaps(candidates);
    expect(resolved).toHaveLength(1);
    // Higher-scored candidate wins
    expect(resolved[0].rule.priority).toBe(5);
  });

  it("returns empty array for empty input", () => {
    expect(resolveOverlaps([])).toEqual([]);
  });

  it("handles single candidate", () => {
    const rule = makeRule();
    const candidates = [buildCandidateMatch(rule, 0, 5, "hello")];
    expect(resolveOverlaps(candidates)).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------
// summarizeGroupCounts
// ---------------------------------------------------------------------------
describe("summarizeGroupCounts", () => {
  it("counts matches per group", () => {
    const matches: ScanMatch[] = [
      makeMatch({ groupId: "identifier" }),
      makeMatch({ groupId: "identifier", id: "m2" }),
      makeMatch({ groupId: "personal", id: "m3" }),
    ];

    const counts = summarizeGroupCounts(matches);
    expect(counts.identifier).toBe(2);
    expect(counts.personal).toBe(1);
    expect(counts.financial).toBe(0);
    expect(counts.credential).toBe(0);
    expect(counts.location).toBe(0);
  });

  it("returns all zeroes for empty matches", () => {
    const counts = summarizeGroupCounts([]);
    expect(counts.identifier).toBe(0);
    expect(counts.personal).toBe(0);
  });
});
