export type MatchCategory =
  | "credential"
  | "financial"
  | "identifier"
  | "location"
  | "personal";

export type MaskGroupId = MatchCategory;

export type MatchConfidence = "high" | "medium";

export type CountryProfileId =
  | "ar"
  | "br"
  | "cl"
  | "cn"
  | "co"
  | "es"
  | "in"
  | "latam-es"
  | "mx"
  | "pe"
  | "pt"
  | "ru"
  | "us";

export type DetectionMode = "global-only" | "selected-plus-global";

export type CountryLanguageFamily =
  | "english"
  | "indic"
  | "mandarin"
  | "portuguese"
  | "russian"
  | "spanish";

export type SupportedLocale =
  | "en-IN"
  | "en-US"
  | "es-ES"
  | "es-LatAm"
  | "pt-BR"
  | "pt-PT"
  | "ru-RU"
  | "shared"
  | "zh-CN";

export interface DetectionRule {
  category: MatchCategory;
  confidence: MatchConfidence;
  countryProfileIds?: readonly CountryProfileId[];
  coverage: "country" | "global";
  id: string;
  label: string;
  locale: SupportedLocale;
  patternFactory: () => RegExp;
  priority: number;
  tagFactory?: (rawMatch: string) => readonly string[];
  validator?: (value: string) => boolean;
  valueGroup?: number;
}

export interface CandidateMatch {
  end: number;
  rule: DetectionRule;
  start: number;
  value: string;
}

export interface MaskGroupPreference {
  enabled: boolean;
  alwaysOn: boolean;
}

export type MaskGroupPreferenceMap = Readonly<
  Record<MaskGroupId, MaskGroupPreference>
>;

export interface CountryProfileDefinition {
  description: string;
  flagEmoji: string;
  id: CountryProfileId;
  label: string;
  languageFamily: CountryLanguageFamily;
  languageLabel: string;
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
  matchTags: readonly string[];
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
  countryProfileIds: readonly CountryProfileId[];
  detectionMode: DetectionMode;
}

// ─── Masking Strategy ────────────────────────────────────────────────────────

/**
 * Controls *how* detected sensitive values are replaced in the output.
 *
 * - `random`    – character-class-preserving random remapping (current default)
 * - `tags`      – semantic categorical tags like `<EMAIL>`, `<API_KEY>`
 * - `faker`     – realistic synthetic data (fake names, emails, etc.)
 * - `redacted`  – hard redaction with `█` blocks
 */
export type MaskingStrategy = "random" | "tags" | "faker" | "redacted";

/**
 * Predefined XML wrapper tag names the user can choose from when
 * enabling the "Wrap output in XML" setting.
 */
export type XmlWrapTag =
  | "context"
  | "document"
  | "input"
  | "prompt"
  | "redacted-input"
  | "text"
  | "user-input";

/**
 * Persisted user preferences that augment the core scan pipeline.
 */
export interface AdvancedMaskingPreferences {
  /** How detected values are replaced. */
  maskingStrategy: MaskingStrategy;

  /** Whether to wrap the final masked output in an XML tag pair. */
  xmlWrapEnabled: boolean;

  /** Which XML tag name to use when wrapping is enabled. */
  xmlWrapTag: XmlWrapTag;

  /**
   * Whether to mask timestamp values (ISO 8601, common date/time formats).
   * Default: false
   */
  maskTimestamps: boolean;

  /**
   * Words / patterns the user wants **always** masked regardless of
   * whether any detection rule catches them.
   * Stored lower-cased; matching is case-insensitive.
   */
  keywordBlocklist: readonly string[];

  /**
   * Words / patterns the user wants **never** masked, even if a
   * detection rule flags them.
   * Stored as-is; matching is case-insensitive.
   */
  globalIgnoreList: readonly string[];

  /**
   * When true, the "random" strategy uses a polyglot mask generator
   * that interleaves characters from multiple Unicode writing systems
   * (abugidas, syllabaries, alphabetics, symbols) instead of plain
   * ASCII same-class replacement.
   *
   * Default: false
   */
  polyglotMaskEnabled: boolean;

  /**
   * Which writing-system families are allowed in polyglot masks.
   * Only relevant when `polyglotMaskEnabled` is true.
   */
  polyglotEnabledFamilies: readonly string[];

  /**
   * Specific script subtypes to exclude even if their family is enabled.
   * For example, exclude "devanagari" while keeping the rest of the
   * "abugida" family.
   */
  polyglotExcludedSubtypes: readonly string[];
}
