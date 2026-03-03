import type {
  CountryProfileId,
  DetectionMode,
} from "../../core/masking/declarations/masking.types";

export interface LocaleMaskFixture {
  countryProfileIds: readonly CountryProfileId[];
  detectionMode?: DetectionMode;
  description: string;
  expectedRuleIds: readonly string[];
  hiddenValues: readonly string[];
  sourceText: string;
}

export interface NegativeMaskFixture {
  countryProfileIds: readonly CountryProfileId[];
  description: string;
  detectionMode?: DetectionMode;
  excludedRuleIds: readonly string[];
  sourceText: string;
  visibleValues: readonly string[];
}
