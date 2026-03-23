import { COUNTRY_PROFILE_ORDER } from "../constants/masking.constants";
import type {
  CountryProfileId,
  DetectionMode,
  DetectionRule,
  ScanScopeSelection,
} from "../declarations/masking.types";

const LATAM_COUNTRY_IDS: ReadonlySet<CountryProfileId> = new Set([
  "ar",
  "cl",
  "co",
  "mx",
  "pe",
]);

export function expandCountryScope(
  selectedIds: readonly CountryProfileId[],
): readonly CountryProfileId[] {
  const expanded = new Set<CountryProfileId>(selectedIds);
  for (const id of selectedIds) {
    if (LATAM_COUNTRY_IDS.has(id)) {
      expanded.add("latam-es");
      break;
    }
  }
  return [...expanded];
}

export function buildScanScopeSelection(
  countryProfileIds: readonly CountryProfileId[],
  detectionMode: DetectionMode,
): ScanScopeSelection {
  return {
    countryProfileIds: normalizeCountryProfileIds(countryProfileIds),
    detectionMode,
  };
}

export function filterRulesForScope(
  rules: readonly DetectionRule[],
  scopeSelection: ScanScopeSelection,
): readonly DetectionRule[] {
  return rules.filter(rule => isRuleEnabledForScope(rule, scopeSelection));
}

export function isRuleEnabledForScope(
  rule: DetectionRule,
  scopeSelection: ScanScopeSelection,
): boolean {
  if (rule.coverage === "global") return true;
  if (scopeSelection.detectionMode === "global-only") return false;
  return scopeSelection.countryProfileIds.some(countryProfileId =>
    rule.countryProfileIds?.includes(countryProfileId),
  );
}

export function isKnownCountryProfileId(
  value: string,
): value is CountryProfileId {
  return COUNTRY_PROFILE_ORDER.includes(value as CountryProfileId);
}

export function normalizeCountryProfileIds(
  countryProfileIds: readonly CountryProfileId[],
): readonly CountryProfileId[] {
  const knownCountryProfileIds = countryProfileIds.filter(
    isKnownCountryProfileId,
  );

  return Object.freeze(
    COUNTRY_PROFILE_ORDER.filter(countryProfileId =>
      knownCountryProfileIds.includes(countryProfileId),
    ),
  );
}
