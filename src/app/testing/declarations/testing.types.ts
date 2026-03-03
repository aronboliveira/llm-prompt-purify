export interface LocaleMaskFixture {
  description: string;
  expectedRuleIds: readonly string[];
  hiddenValues: readonly string[];
  sourceText: string;
}

export interface NegativeMaskFixture {
  description: string;
  excludedRuleIds: readonly string[];
  sourceText: string;
  visibleValues: readonly string[];
}
