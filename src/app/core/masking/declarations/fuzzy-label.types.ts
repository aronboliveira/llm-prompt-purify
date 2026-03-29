export interface FuzzyLabelRuleSpec {
  aliases: readonly string[];
  maxScore: number;
  ruleId: string;
  valuePatternFactory?: () => RegExp;
}

export interface DelimitedLine {
  normalizedLabel: string;
  rawValue: string;
  valueStart: number;
}

export interface FuzzyLabelAliasEntry {
  normalizedAlias: string;
  spec: FuzzyLabelRuleSpec;
}
