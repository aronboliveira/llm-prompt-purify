import { DEFAULT_GROUP_PREFERENCES } from "../../core/masking/constants/masking.constants";
import type { MaskingEngine } from "../../core/masking/masking.engine";
import { buildScanScopeSelection } from "../../core/masking/utils/country-scope.utils";
import type {
  BoundaryMaskFixture,
  LocaleMaskFixture,
  NegativeMaskFixture,
} from "../declarations/testing.types";

export function assertPositiveFixture(
  engine: MaskingEngine,
  fixture: LocaleMaskFixture
): void {
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

export function assertNegativeFixture(
  engine: MaskingEngine,
  fixture: NegativeMaskFixture
): void {
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

export function assertBoundaryFixture(
  engine: MaskingEngine,
  fixture: BoundaryMaskFixture
): void {
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
