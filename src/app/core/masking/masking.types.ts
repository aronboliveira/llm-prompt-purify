export type MatchCategory =
  | "credential"
  | "financial"
  | "identifier"
  | "location"
  | "personal";

export type MatchConfidence = "high" | "medium";

export type SupportedLocale = "en-US" | "es-LatAm" | "pt-BR" | "shared";

export interface DetectionRule {
  id: string;
  label: string;
  category: MatchCategory;
  confidence: MatchConfidence;
  locale: SupportedLocale;
  priority: number;
  patternFactory: () => RegExp;
  valueGroup?: number;
  validator?: (value: string) => boolean;
}

export interface ScanMatch {
  id: string;
  ruleId: string;
  label: string;
  category: MatchCategory;
  confidence: MatchConfidence;
  locale: SupportedLocale;
  start: number;
  end: number;
  value: string;
  mask: string;
  enabled: boolean;
}

export interface ScanResult {
  sourceText: string;
  maskedText: string;
  matches: readonly ScanMatch[];
  totalMatches: number;
  enabledMatches: number;
  hasMatches: boolean;
  scannedAt: string;
}
