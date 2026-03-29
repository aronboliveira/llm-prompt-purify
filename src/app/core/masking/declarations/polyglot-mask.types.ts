import type {
  WritingSystemFamily,
  WritingSystemSubtype,
} from "./polyglot-pools.types";

export type WeightTier = "digital" | "figure" | "script";

export interface PolyglotMaskConfig {
  /** Which writing-system families are enabled. */
  readonly enabledFamilies: readonly WritingSystemFamily[];
  /** Specific subtypes to exclude even if their family is enabled. */
  readonly excludedSubtypes: readonly WritingSystemSubtype[];
  /**
   * Subtypes auto-excluded because they match the user's locale native script.
   * Merged with excludedSubtypes at pool resolution time.
   */
  readonly localeExcludedSubtypes?: readonly WritingSystemSubtype[];
  /**
   * The writing-system family native to the user's locale.
   * When set the **entire family** is removed from the eligible pool —
   * e.g. `"alphabetic"` for Brazil removes Latin, Cyrillic, Armenian, Georgian.
   */
  readonly nativeFamily?: WritingSystemFamily;
}
