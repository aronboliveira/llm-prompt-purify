/**
 * Unit tests for mask-safety utility functions.
 * Covers groupMaskSafetyCandidates, applyCandidateGroupsToMatches,
 * buildValidationCandidates, chunkCandidates, createMaskSafetyGroupKey,
 * createValidationResponseKey.
 */
import {
  applyCandidateGroupsToMatches,
  buildValidationCandidates,
  chunkCandidates,
  createMaskSafetyGroupKey,
  createValidationResponseKey,
  groupMaskSafetyCandidates,
} from "../utils/mask-safety.utils";
import type { ScanMatch } from "../../masking/declarations/masking.types";
import type { MaskSafetyCandidateGroup } from "../declarations/mask-safety.types";

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
// createMaskSafetyGroupKey
// ---------------------------------------------------------------------------
describe("createMaskSafetyGroupKey", () => {
  it("concatenates ruleId and value with separator", () => {
    expect(createMaskSafetyGroupKey("rule-1", "val-1")).toBe("rule-1::val-1");
  });
});

// ---------------------------------------------------------------------------
// createValidationResponseKey
// ---------------------------------------------------------------------------
describe("createValidationResponseKey", () => {
  it("concatenates ruleId and candidateValue", () => {
    expect(
      createValidationResponseKey({
        ruleId: "rule-1",
        candidateValue: "mask-1",
      }),
    ).toBe("rule-1::mask-1");
  });
});

// ---------------------------------------------------------------------------
// chunkCandidates
// ---------------------------------------------------------------------------
describe("chunkCandidates", () => {
  it("splits items into chunks", () => {
    const items = [1, 2, 3, 4, 5];
    const chunks = chunkCandidates(items, 2);

    expect(chunks).toHaveLength(3);
    expect(chunks[0]).toEqual([1, 2]);
    expect(chunks[1]).toEqual([3, 4]);
    expect(chunks[2]).toEqual([5]);
  });

  it("returns entire array as one chunk when chunkSize <= 0", () => {
    const items = [1, 2, 3];
    const chunks = chunkCandidates(items, 0);
    expect(chunks).toHaveLength(1);
    expect(chunks[0]).toEqual([1, 2, 3]);
  });

  it("handles empty array", () => {
    expect(chunkCandidates([], 5)).toEqual([]);
  });

  it("handles chunkSize larger than array", () => {
    const items = [1, 2];
    const chunks = chunkCandidates(items, 100);
    expect(chunks).toHaveLength(1);
    expect(chunks[0]).toEqual([1, 2]);
  });
});

// ---------------------------------------------------------------------------
// groupMaskSafetyCandidates
// ---------------------------------------------------------------------------
describe("groupMaskSafetyCandidates", () => {
  it("groups financial and identifier matches", () => {
    const matches: ScanMatch[] = [
      makeMatch({ id: "m1", ruleId: "cpf", category: "financial", value: "val1", mask: "mask1" }),
      makeMatch({ id: "m2", ruleId: "cpf", category: "financial", value: "val1", mask: "mask1" }),
      makeMatch({ id: "m3", ruleId: "cc", category: "identifier", value: "val2", mask: "mask2" }),
    ];

    const groups = groupMaskSafetyCandidates(matches);
    expect(groups.length).toBe(2);

    const cpfGroup = groups.find((g) => g.ruleId === "cpf");
    expect(cpfGroup).toBeDefined();
    expect(cpfGroup!.matchIds).toHaveLength(2);
    expect(cpfGroup!.matchIds).toContain("m1");
    expect(cpfGroup!.matchIds).toContain("m2");
  });

  it("ignores personal, credential, and location categories", () => {
    const matches: ScanMatch[] = [
      makeMatch({ category: "personal", value: "name" }),
      makeMatch({ category: "credential", id: "m2", value: "key" }),
      makeMatch({ category: "location", id: "m3", value: "addr" }),
    ];

    const groups = groupMaskSafetyCandidates(matches);
    expect(groups).toHaveLength(0);
  });

  it("returns empty for empty matches", () => {
    expect(groupMaskSafetyCandidates([])).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// applyCandidateGroupsToMatches
// ---------------------------------------------------------------------------
describe("applyCandidateGroupsToMatches", () => {
  it("replaces mask for grouped matches", () => {
    const matches: ScanMatch[] = [
      makeMatch({ id: "m1", ruleId: "cpf", value: "12345", mask: "XXXXX" }),
    ];

    const groups: MaskSafetyCandidateGroup[] = [
      {
        key: "cpf::12345",
        ruleId: "cpf",
        sourceValue: "12345",
        candidateMask: "NEWMASK",
        category: "financial",
        matchIds: ["m1"],
      },
    ];

    const result = applyCandidateGroupsToMatches(matches, groups);
    expect(result[0].mask).toBe("NEWMASK");
  });

  it("leaves matches unchanged when no group applies", () => {
    const matches: ScanMatch[] = [
      makeMatch({ id: "m1", ruleId: "cpf", value: "12345", mask: "XXXXX" }),
    ];

    const result = applyCandidateGroupsToMatches(matches, []);
    expect(result[0].mask).toBe("XXXXX");
  });
});

// ---------------------------------------------------------------------------
// buildValidationCandidates
// ---------------------------------------------------------------------------
describe("buildValidationCandidates", () => {
  it("maps groups to validation candidates", () => {
    const groups: MaskSafetyCandidateGroup[] = [
      {
        key: "cpf::12345",
        ruleId: "cpf",
        sourceValue: "12345",
        candidateMask: "NEWMASK",
        category: "financial",
        matchIds: ["m1"],
      },
    ];

    const candidates = buildValidationCandidates(groups);
    expect(candidates).toHaveLength(1);
    expect(candidates[0].ruleId).toBe("cpf");
    expect(candidates[0].candidateValue).toBe("NEWMASK");
  });

  it("returns empty for empty groups", () => {
    expect(buildValidationCandidates([])).toHaveLength(0);
  });
});
