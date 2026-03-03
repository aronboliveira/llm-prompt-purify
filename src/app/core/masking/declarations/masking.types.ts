export type MatchCategory =
  | "credential"
  | "financial"
  | "identifier"
  | "location"
  | "personal";

export type MaskGroupId = MatchCategory;

export type MatchConfidence = "high" | "medium";

export type CountryProfileId = "ar" | "br" | "cl" | "co" | "mx" | "pe" | "us";

export type DetectionMode = "country-plus-global" | "global-only";

export type SupportedLocale = "en-US" | "es-LatAm" | "pt-BR" | "shared";

export interface DetectionRule {
  coverage: "country" | "global";
  id: string;
  label: string;
  category: MatchCategory;
  confidence: MatchConfidence;
  countryProfileIds?: readonly CountryProfileId[];
  locale: SupportedLocale;
  priority: number;
  patternFactory: () => RegExp;
  valueGroup?: number;
  validator?: (value: string) => boolean;
}

export interface MaskGroupPreference {
  enabled: boolean;
  alwaysOn: boolean;
}

export type MaskGroupPreferenceMap = Readonly<Record<MaskGroupId, MaskGroupPreference>>;

export interface CountryProfileDefinition {
  description: string;
  flagEmoji: string;
  id: CountryProfileId;
  label: string;
  localeLabel: string;
}

export interface CountryProfileSummary extends CountryProfileDefinition {
  selected: boolean;
}

export interface MaskGroupDefinition {
  id: MaskGroupId;
  label: string;
  description: string;
  toggleLabel: string;
  alwaysOnLabel?: string;
  supportsAlwaysOn: boolean;
}

export interface MaskGroupSummary extends MaskGroupDefinition {
  alwaysOn: boolean;
  enabled: boolean;
  matchCount: number;
}

export interface ScanMatch {
  id: string;
  ruleId: string;
  label: string;
  category: MatchCategory;
  confidence: MatchConfidence;
  groupId: MaskGroupId;
  locale: SupportedLocale;
  start: number;
  end: number;
  value: string;
  mask: string;
  enabled: boolean;
  locked: boolean;
}

export interface ScanResult {
  sourceText: string;
  maskedText: string;
  matches: readonly ScanMatch[];
  totalMatches: number;
  enabledMatches: number;
  hasMatches: boolean;
  scannedAt: string;
  groupCounts: Readonly<Record<MaskGroupId, number>>;
}

export interface ScanScopeSelection {
  countryProfileId: CountryProfileId;
  detectionMode: DetectionMode;
}
