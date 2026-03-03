import type {
  CountryProfileId,
  DetectionMode,
} from "../../core/masking/declarations/masking.types";

export interface LocaleMaskFixture {
  countryProfileId: CountryProfileId;
  detectionMode?: DetectionMode;
  description: string;
  expectedRuleIds: readonly string[];
  hiddenValues: readonly string[];
  sourceText: string;
}

export interface NegativeMaskFixture {
  countryProfileId: CountryProfileId;
  description: string;
  detectionMode?: DetectionMode;
  excludedRuleIds: readonly string[];
  sourceText: string;
  visibleValues: readonly string[];
}
