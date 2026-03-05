/**
 * Unit tests for country-scope utility functions.
 * Covers buildScanScopeSelection, filterRulesForScope,
 * isRuleEnabledForScope, isKnownCountryProfileId, normalizeCountryProfileIds.
 */
import {
  buildScanScopeSelection,
  filterRulesForScope,
  isRuleEnabledForScope,
  isKnownCountryProfileId,
  normalizeCountryProfileIds,
} from "../utils/country-scope.utils";
import type { DetectionRule, ScanScopeSelection } from "../declarations/masking.types";

function makeRule(overrides: Partial<DetectionRule> = {}): DetectionRule {
  return {
    category: "identifier",
    confidence: "high",
    coverage: "global",
    id: "global-rule",
    label: "Global Rule",
    locale: "shared",
    patternFactory: () => /test/gi,
    priority: 1,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// buildScanScopeSelection
// ---------------------------------------------------------------------------
describe("buildScanScopeSelection", () => {
  it("creates a scope with normalized country profile IDs", () => {
    const scope = buildScanScopeSelection(["br", "us"], "selected-plus-global");
    expect(scope.detectionMode).toBe("selected-plus-global");
    expect(scope.countryProfileIds).toContain("br");
    expect(scope.countryProfileIds).toContain("us");
  });

  it("filters out unknown country profile IDs", () => {
    const scope = buildScanScopeSelection(
      ["br", "zz" as any],
      "selected-plus-global",
    );
    expect(scope.countryProfileIds).toContain("br");
    expect(scope.countryProfileIds).not.toContain("zz");
  });

  it("creates empty scope for global-only", () => {
    const scope = buildScanScopeSelection([], "global-only");
    expect(scope.detectionMode).toBe("global-only");
    expect(scope.countryProfileIds).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// isRuleEnabledForScope
// ---------------------------------------------------------------------------
describe("isRuleEnabledForScope", () => {
  it("enables global rules regardless of scope", () => {
    const rule = makeRule({ coverage: "global" });
    const scope: ScanScopeSelection = {
      countryProfileIds: [],
      detectionMode: "global-only",
    };
    expect(isRuleEnabledForScope(rule, scope)).toBe(true);
  });

  it("disables country rules in global-only mode", () => {
    const rule = makeRule({
      coverage: "country",
      countryProfileIds: ["br"],
      id: "br-cpf",
    });
    const scope: ScanScopeSelection = {
      countryProfileIds: ["br"],
      detectionMode: "global-only",
    };
    expect(isRuleEnabledForScope(rule, scope)).toBe(false);
  });

  it("enables country rules when their profile is selected", () => {
    const rule = makeRule({
      coverage: "country",
      countryProfileIds: ["br"],
      id: "br-cpf",
    });
    const scope: ScanScopeSelection = {
      countryProfileIds: ["br"],
      detectionMode: "selected-plus-global",
    };
    expect(isRuleEnabledForScope(rule, scope)).toBe(true);
  });

  it("disables country rules when their profile is not selected", () => {
    const rule = makeRule({
      coverage: "country",
      countryProfileIds: ["br"],
      id: "br-cpf",
    });
    const scope: ScanScopeSelection = {
      countryProfileIds: ["us"],
      detectionMode: "selected-plus-global",
    };
    expect(isRuleEnabledForScope(rule, scope)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// filterRulesForScope
// ---------------------------------------------------------------------------
describe("filterRulesForScope", () => {
  it("includes global rules and selected-country rules", () => {
    const rules: DetectionRule[] = [
      makeRule({ id: "global-email", coverage: "global" }),
      makeRule({ id: "br-cpf", coverage: "country", countryProfileIds: ["br"] }),
      makeRule({ id: "us-ssn", coverage: "country", countryProfileIds: ["us"] }),
    ];

    const scope = buildScanScopeSelection(["br"], "selected-plus-global");
    const filtered = filterRulesForScope(rules, scope);

    expect(filtered.map((r) => r.id)).toContain("global-email");
    expect(filtered.map((r) => r.id)).toContain("br-cpf");
    expect(filtered.map((r) => r.id)).not.toContain("us-ssn");
  });

  it("returns only global rules in global-only mode", () => {
    const rules: DetectionRule[] = [
      makeRule({ id: "global-email", coverage: "global" }),
      makeRule({ id: "br-cpf", coverage: "country", countryProfileIds: ["br"] }),
    ];

    const scope = buildScanScopeSelection(["br"], "global-only");
    const filtered = filterRulesForScope(rules, scope);

    expect(filtered.map((r) => r.id)).toContain("global-email");
    expect(filtered.map((r) => r.id)).not.toContain("br-cpf");
  });
});

// ---------------------------------------------------------------------------
// isKnownCountryProfileId
// ---------------------------------------------------------------------------
describe("isKnownCountryProfileId", () => {
  it.each(["br", "us", "ar", "cl", "cn", "co", "es", "in", "mx", "pe", "pt", "ru", "latam-es"])(
    "recognizes %s",
    (id) => {
      expect(isKnownCountryProfileId(id)).toBe(true);
    },
  );

  it.each(["zz", "xx", "", "BR", "US"])(
    "rejects unknown %s",
    (id) => {
      expect(isKnownCountryProfileId(id)).toBe(false);
    },
  );
});

// ---------------------------------------------------------------------------
// normalizeCountryProfileIds
// ---------------------------------------------------------------------------
describe("normalizeCountryProfileIds", () => {
  it("filters out unknown IDs", () => {
    const result = normalizeCountryProfileIds(["br", "zz" as any, "us"]);
    expect(result).toContain("br");
    expect(result).toContain("us");
    expect(result).not.toContain("zz");
  });

  it("orders by COUNTRY_PROFILE_ORDER", () => {
    const result = normalizeCountryProfileIds(["us", "br"]);
    // br comes before us in COUNTRY_PROFILE_ORDER
    const brIndex = result.indexOf("br");
    const usIndex = result.indexOf("us");
    expect(brIndex).toBeLessThan(usIndex);
  });

  it("returns frozen array", () => {
    const result = normalizeCountryProfileIds(["br"]);
    expect(Object.isFrozen(result)).toBe(true);
  });

  it("deduplicates", () => {
    const result = normalizeCountryProfileIds(["br", "br", "br"]);
    expect(result.filter((id) => id === "br")).toHaveLength(1);
  });
});
