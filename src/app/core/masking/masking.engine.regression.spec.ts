import { DEFAULT_GROUP_PREFERENCES } from "./constants/masking.constants";
import { MaskingEngine } from "./masking.engine";
import { buildScanScopeSelection } from "./utils/country-scope.utils";
import type {
  BoundaryMaskFixture,
  LocaleMaskFixture,
  NegativeMaskFixture,
} from "../../testing/declarations/testing.types";
import {
  FUZZY_LABEL_MASK_FIXTURES,
  FUZZY_LABEL_NEGATIVE_FIXTURES,
  GLOBAL_CREDENTIAL_MASK_FIXTURES,
  GLOBAL_FINANCIAL_MASK_FIXTURES,
  GLOBAL_NEGATIVE_MASK_FIXTURES,
  GLOBAL_PERSONAL_MASK_FIXTURES,
  SCOPE_BOUNDARY_MASK_FIXTURES,
} from "../../testing/constants/mask-regression-corpus.constants";

describe("MaskingEngine regression corpus", () => {
  const engine = new MaskingEngine();

  describe("global credential corpus", () => {
    for (const fixture of GLOBAL_CREDENTIAL_MASK_FIXTURES) {
      it(fixture.description, () => {
        assertPositiveFixture(engine, fixture);
      });
    }
  });

  describe("global personal corpus", () => {
    for (const fixture of GLOBAL_PERSONAL_MASK_FIXTURES) {
      it(fixture.description, () => {
        assertPositiveFixture(engine, fixture);
      });
    }
  });

  describe("global financial corpus", () => {
    for (const fixture of GLOBAL_FINANCIAL_MASK_FIXTURES) {
      it(fixture.description, () => {
        assertPositiveFixture(engine, fixture);
      });
    }
  });

  describe("negative pass-through corpus", () => {
    for (const fixture of GLOBAL_NEGATIVE_MASK_FIXTURES) {
      it(fixture.description, () => {
        assertNegativeFixture(engine, fixture);
      });
    }
  });

  describe("scope boundary corpus", () => {
    for (const fixture of SCOPE_BOUNDARY_MASK_FIXTURES) {
      it(fixture.description, () => {
        assertBoundaryFixture(engine, fixture);
      });
    }
  });

  describe("fuzzy label corpus", () => {
    for (const fixture of FUZZY_LABEL_MASK_FIXTURES) {
      it(fixture.description, () => {
        assertPositiveFixture(engine, fixture);
      });
    }

    for (const fixture of FUZZY_LABEL_NEGATIVE_FIXTURES) {
      it(fixture.description, () => {
        assertNegativeFixture(engine, fixture);
      });
    }
  });

  it("keeps consistent masks for repeated secret assignments inside one prompt", () => {
    const sourceText = [
        "api_key=sk-proj-ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890",
        "Repeat api_key=sk-proj-ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890 later in the ticket.",
      ].join("\n"),
      result = engine.scan(
        sourceText,
        DEFAULT_GROUP_PREFERENCES,
        buildScanScopeSelection(["us"], "selected-plus-global")
      );

    expect(result.matches).toHaveLength(2);
    expect(result.matches[0].mask).toBe(result.matches[1].mask);
    expect(result.maskedText).not.toContain("sk-proj-ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890");
  });

  it("preserves untouched prose around masked values instead of collapsing formatting", () => {
    const sourceText = [
        "Context before",
        "Email: maria@example.com",
        "",
        "Context after",
      ].join("\n"),
      result = engine.scan(
        sourceText,
        DEFAULT_GROUP_PREFERENCES,
        buildScanScopeSelection(["br"], "selected-plus-global")
      );

    expect(result.maskedText).toContain("Context before");
    expect(result.maskedText).toContain("Context after");
    expect(result.maskedText).toContain("\n\n");
    expect(result.maskedText).not.toContain("maria@example.com");
  });
});

function assertPositiveFixture(engine: MaskingEngine, fixture: LocaleMaskFixture): void {
  const result = engine.scan(
    fixture.sourceText,
    DEFAULT_GROUP_PREFERENCES,
    buildScanScopeSelection(
      fixture.countryProfileIds,
      fixture.detectionMode ?? "selected-plus-global"
    )
  );

  expect(result.matches.map(match => match.ruleId)).toEqual(
    expect.arrayContaining(fixture.expectedRuleIds)
  );

  for (const hiddenValue of fixture.hiddenValues) {
    expect(result.maskedText).not.toContain(hiddenValue);
  }
}

function assertNegativeFixture(engine: MaskingEngine, fixture: NegativeMaskFixture): void {
  const result = engine.scan(
    fixture.sourceText,
    DEFAULT_GROUP_PREFERENCES,
    buildScanScopeSelection(
      fixture.countryProfileIds,
      fixture.detectionMode ?? "selected-plus-global"
    )
  );

  for (const excludedRuleId of fixture.excludedRuleIds) {
    expect(result.matches.some(match => match.ruleId === excludedRuleId)).toBe(false);
  }

  for (const visibleValue of fixture.visibleValues) {
    expect(result.maskedText).toContain(visibleValue);
  }
}

function assertBoundaryFixture(engine: MaskingEngine, fixture: BoundaryMaskFixture): void {
  const result = engine.scan(
    fixture.sourceText,
    DEFAULT_GROUP_PREFERENCES,
    buildScanScopeSelection(
      fixture.countryProfileIds,
      fixture.detectionMode ?? "selected-plus-global"
    )
  );

  for (const expectedRuleId of fixture.expectedRuleIds ?? []) {
    expect(result.matches.some(match => match.ruleId === expectedRuleId)).toBe(true);
  }

  for (const excludedRuleId of fixture.excludedRuleIds ?? []) {
    expect(result.matches.some(match => match.ruleId === excludedRuleId)).toBe(false);
  }

  for (const hiddenValue of fixture.hiddenValues ?? []) {
    expect(result.maskedText).not.toContain(hiddenValue);
  }

  for (const visibleValue of fixture.visibleValues ?? []) {
    expect(result.maskedText).toContain(visibleValue);
  }
}
