/**
 * Fuzzy-label type declarations.
 * Direct port — platform-agnostic.
 */

export interface FuzzyLabelRuleSpec {
  aliases: readonly string[];
  maxScore: number;
  ruleId: string;
  valuePatternFactory?: () => RegExp;
}
