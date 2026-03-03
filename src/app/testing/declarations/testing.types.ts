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

export interface BoundaryMaskFixture {
  countryProfileIds: readonly CountryProfileId[];
  description: string;
  detectionMode?: DetectionMode;
  excludedRuleIds?: readonly string[];
  expectedRuleIds?: readonly string[];
  hiddenValues?: readonly string[];
  sourceText: string;
  visibleValues?: readonly string[];
}

export type FuzzyLabelMutationKind =
  | "insert-char"
  | "remove-char"
  | "replace-char"
  | "replace-substring"
  | "transpose-chars";

export interface FuzzyLabelMutationOperation {
  index?: number;
  kind: FuzzyLabelMutationKind;
  replacement?: string;
  search?: string;
  value?: string;
}

export interface FuzzyLabelMutationRecipe {
  description: string;
  operations: readonly FuzzyLabelMutationOperation[];
}

export interface FuzzyLabelFuzzSeed {
  countryProfileIds: readonly CountryProfileId[];
  description: string;
  detectionMode?: DetectionMode;
  extraPositiveLabels?: readonly string[];
  invalidValue: string;
  negativeLabels: readonly string[];
  positiveRecipes: readonly FuzzyLabelMutationRecipe[];
  ruleId: string;
  sourceLabel: string;
  validValue: string;
}
