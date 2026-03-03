export interface FuzzyLabelRuleSpec {
  aliases: readonly string[];
  maxScore: number;
  ruleId: string;
  valuePatternFactory?: () => RegExp;
}
