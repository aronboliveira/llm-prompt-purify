import Fuse from "fuse.js";

import { FUZZY_LABEL_DELIMITED_LINE_PATTERN, FUZZY_LABEL_SPECS } from "../constants/fuzzy-label.constants";
import type { FuzzyLabelRuleSpec } from "../declarations/fuzzy-label.types";
import type { DetectionRule } from "../declarations/masking.types";
import { sanitizeCapturedValue } from "./mask-format.utils";
import { buildCandidateMatch, type CandidateMatch } from "./mask-match.utils";

interface DelimitedLine {
  normalizedLabel: string;
  rawValue: string;
  valueStart: number;
}

interface FuzzyLabelAliasEntry {
  normalizedAlias: string;
  spec: FuzzyLabelRuleSpec;
}

export function collectFuzzyLabelCandidates(
  sourceText: string,
  activeRules: readonly DetectionRule[]
): readonly CandidateMatch[] {
  const activeRuleById = new Map(activeRules.map(rule => [rule.id, rule])),
    activeAliasEntries = FUZZY_LABEL_SPECS.filter(spec => activeRuleById.has(spec.ruleId))
      .flatMap(spec => {
        return spec.aliases.map(alias => ({
          normalizedAlias: normalizeFuzzyLabel(alias),
          spec,
        }));
      });

  if (!activeAliasEntries.length) return [];

  const fuzzyMatcher = new Fuse(activeAliasEntries, {
    ignoreLocation: true,
    includeScore: true,
    keys: ["normalizedAlias"],
    shouldSort: true,
    threshold: 0.3,
  });

  return collectDelimitedLines(sourceText).flatMap(line => {
    if (line.normalizedLabel.length < 4) return [];

    const bestSpecByRuleId = new Map<string, FuzzyLabelRuleSpec>(),
      bestScoreByRuleId = new Map<string, number>();

    for (const result of fuzzyMatcher.search(line.normalizedLabel, { limit: 6 })) {
      const score = result.score ?? 1,
        { spec } = result.item,
        previousScore = bestScoreByRuleId.get(spec.ruleId);

      if (score > spec.maxScore) continue;
      if (typeof previousScore === "number" && previousScore <= score) continue;

      bestScoreByRuleId.set(spec.ruleId, score);
      bestSpecByRuleId.set(spec.ruleId, spec);
    }

    return Array.from(bestSpecByRuleId.values()).flatMap(spec => {
      const rule = activeRuleById.get(spec.ruleId);
      if (!rule) return [];

      const value = sanitizeCapturedValue(line.rawValue);
      if (!value) return [];
      if (spec.valuePatternFactory && !spec.valuePatternFactory().test(value)) return [];
      if (rule.validator && !rule.validator(value)) return [];

      const relativeIndex = line.rawValue.indexOf(value);
      if (relativeIndex < 0) return [];

      const start = line.valueStart + relativeIndex;
      return [buildCandidateMatch(rule, start, start + value.length, value)];
    });
  });
}

function collectDelimitedLines(sourceText: string): readonly DelimitedLine[] {
  const lines: DelimitedLine[] = [];
  let cursor = 0;

  for (const lineText of sourceText.split("\n")) {
    const matchedLine = lineText.match(FUZZY_LABEL_DELIMITED_LINE_PATTERN);
    if (matchedLine?.[1] && matchedLine[2]) {
      const normalizedLabel = normalizeFuzzyLabel(matchedLine[1]),
        rawValue = matchedLine[2],
        valueStart = cursor + lineText.indexOf(rawValue);

      lines.push({
        normalizedLabel,
        rawValue,
        valueStart,
      });
    }

    cursor += lineText.length + 1;
  }

  return lines;
}

function normalizeFuzzyLabel(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{M}+/gu, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/gu, " ")
    .trim();
}
