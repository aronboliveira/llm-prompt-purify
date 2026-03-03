import { COUNTRY_PROFILE_ORDER } from "../constants/masking.constants";
import type {
  CountryProfileId,
  DetectionMode,
  DetectionRule,
  ScanScopeSelection,
} from "../declarations/masking.types";

export function buildScanScopeSelection(
  countryProfileId: CountryProfileId,
  detectionMode: DetectionMode
): ScanScopeSelection {
  return {
    countryProfileId,
    detectionMode,
  };
}

export function filterRulesForScope(
  rules: readonly DetectionRule[],
  scopeSelection: ScanScopeSelection
): readonly DetectionRule[] {
  return rules.filter(rule => isRuleEnabledForScope(rule, scopeSelection));
}

export function isRuleEnabledForScope(
  rule: DetectionRule,
  scopeSelection: ScanScopeSelection
): boolean {
  if (rule.coverage === "global") return true;
  if (scopeSelection.detectionMode === "global-only") return false;
  return !!rule.countryProfileIds?.includes(scopeSelection.countryProfileId);
}

export function isKnownCountryProfileId(value: string): value is CountryProfileId {
  return COUNTRY_PROFILE_ORDER.includes(value as CountryProfileId);
}
