import Fuse from "fuse.js";

import {
  FUZZY_LABEL_DELIMITED_LINE_PATTERN,
  FUZZY_LABEL_SPECS,
} from "../constants/fuzzy-label.constants";
import { NEXT_FIELD_BOUNDARY } from "../constants/mask-flag-dictionaries.constants";
import type {
  DelimitedLine,
  FuzzyLabelAliasEntry,
  FuzzyLabelRuleSpec,
} from "../declarations/fuzzy-label.types";
import type {
  CandidateMatch,
  DetectionRule,
} from "../declarations/masking.types";
import { sanitizeCapturedValue } from "./mask-format.utils";
import { buildCandidateMatch } from "./mask-match.utils";

// LG-001: Whitelist of known short labels (< 4 chars) that should still trigger fuzzy matching
const SHORT_LABEL_WHITELIST = new Set([
  "cpf",
  "rut",
  "ssn",
  "nif",
  "nie",
  "dni",
  "sin",
  "tin",
  "ein",
  "pan",
  "nss",
  "rfc",
]);

// Performance: Cache Fuse instances by active rule ID signature
let cachedFuseKey: string | null = null,
  cachedFuse: Fuse<FuzzyLabelAliasEntry> | null = null,
  cachedAliasEntries: readonly FuzzyLabelAliasEntry[] | null = null;

function getFuseMatcher(activeRuleIds: readonly string[]): {
  matcher: Fuse<FuzzyLabelAliasEntry>;
  entries: readonly FuzzyLabelAliasEntry[];
} | null {
  const cacheKey = [...activeRuleIds].sort().join(",");

  if (cacheKey === cachedFuseKey && cachedFuse && cachedAliasEntries) {
    return { matcher: cachedFuse, entries: cachedAliasEntries };
  }

  const activeRuleIdSet = new Set(activeRuleIds);
  const entries = FUZZY_LABEL_SPECS.filter(spec =>
    activeRuleIdSet.has(spec.ruleId),
  ).flatMap(spec =>
    spec.aliases.map(alias => ({
      normalizedAlias: normalizeFuzzyLabel(alias),
      spec,
    })),
  );

  if (!entries.length) {
    cachedFuseKey = cacheKey;
    cachedFuse = null;
    cachedAliasEntries = null;
    return null;
  }

  const matcher = new Fuse(entries, {
    ignoreLocation: true,
    includeScore: true,
    keys: ["normalizedAlias"],
    shouldSort: true,
    threshold: 0.3,
  });

  cachedFuseKey = cacheKey;
  cachedFuse = matcher;
  cachedAliasEntries = entries;

  return { matcher, entries };
}

export function collectFuzzyLabelCandidates(
  sourceText: string,
  activeRules: readonly DetectionRule[],
): readonly CandidateMatch[] {
  const activeRuleById = new Map(activeRules.map(rule => [rule.id, rule]));
  const cached = getFuseMatcher([...activeRuleById.keys()]);

  if (!cached) return [];

  const { matcher: fuzzyMatcher } = cached;

  return collectDelimitedLines(sourceText).flatMap(line => {
    // LG-001: Allow whitelisted short labels, otherwise require minimum 4 chars
    if (
      line.normalizedLabel.length < 4 &&
      !SHORT_LABEL_WHITELIST.has(line.normalizedLabel)
    )
      return [];

    const bestSpecByRuleId = new Map<string, FuzzyLabelRuleSpec>(),
      bestScoreByRuleId = new Map<string, number>();

    for (const result of fuzzyMatcher.search(line.normalizedLabel, {
      limit: 6,
    })) {
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
      if (spec.valuePatternFactory && !spec.valuePatternFactory().test(value))
        return [];
      if (rule.validator && !rule.validator(value)) return [];

      const relativeIndex = line.rawValue.indexOf(value);
      if (relativeIndex < 0) return [];

      const start = line.valueStart + relativeIndex;
      return [buildCandidateMatch(rule, start, start + value.length, value)];
    });
  });
}

// Truncate fuzzy values at the next PII field label boundary on the same line.
// Prevents greedy value capture from swallowing subsequent labeled fields.
const FUZZY_VALUE_BOUNDARY_RE = new RegExp(
  String.raw`\s+(?:${NEXT_FIELD_BOUNDARY})\s*[:=-]`,
  "i",
);

function collectDelimitedLines(sourceText: string): readonly DelimitedLine[] {
  const lines: DelimitedLine[] = [];
  let cursor = 0;

  for (const lineText of sourceText.split("\n")) {
    const matchedLine = lineText.match(FUZZY_LABEL_DELIMITED_LINE_PATTERN);
    if (matchedLine?.[1] && matchedLine[2]) {
      const normalizedLabel = normalizeFuzzyLabel(matchedLine[1]);
      let rawValue = matchedLine[2];

      // Truncate at next PII field boundary to prevent multi-field blob capture
      const boundary = rawValue.match(FUZZY_VALUE_BOUNDARY_RE);
      if (boundary && typeof boundary.index === "number") {
        rawValue = rawValue.slice(0, boundary.index);
      }

      const valueStart = cursor + lineText.indexOf(rawValue);

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
