/**
 * MaskingEngine — ported from Angular app.
 *
 * Pure TypeScript class with zero platform dependencies.
 * Runs regex + fuzzy-label detection, resolves overlaps,
 * assigns random masks, and applies group preferences.
 */

import { MASKING_RULES } from "./constants/masking-rules.constants";
import type {
  MaskGroupPreferenceMap,
  ScanMatch,
  ScanResult,
  ScanScopeSelection,
} from "./declarations/masking.types";
import { filterRulesForScope } from "./utils/country-scope.utils";
import { collectFuzzyLabelCandidates } from "./utils/fuzzy-label.utils";
import { createDistinctMask } from "./utils/mask-format.utils";
import {
  applyEnabledMasks,
  applyGroupPreferences,
  extractCandidateMatch,
  resolveOverlaps,
  summarizeGroupCounts,
} from "./utils/mask-match.utils";

export class MaskingEngine {
  public rebuild(
    sourceText: string,
    matches: readonly ScanMatch[],
    scannedAt: string,
  ): ScanResult {
    const normalizedMatches = [...matches].sort(
        (left, right) => left.start - right.start,
      ),
      maskedText = applyEnabledMasks(sourceText, normalizedMatches),
      enabledMatches = normalizedMatches.filter(match => match.enabled).length;

    return {
      enabledMatches,
      groupCounts: summarizeGroupCounts(normalizedMatches),
      hasMatches: normalizedMatches.length > 0,
      maskedText,
      matches: normalizedMatches,
      scannedAt,
      sourceText,
      totalMatches: normalizedMatches.length,
    };
  }

  public regenerateAll(
    sourceText: string,
    matches: readonly ScanMatch[],
    scannedAt: string,
  ): ScanResult {
    const nextMasks = new Map<string, string>(),
      updatedMatches = matches.map(match => {
        const nextMask =
          nextMasks.get(match.value) ??
          createDistinctMask(match.value, nextMasks.get(match.value));

        nextMasks.set(match.value, nextMask);
        return { ...match, mask: nextMask };
      });

    return this.rebuild(sourceText, updatedMatches, scannedAt);
  }

  public regenerateMatch(
    sourceText: string,
    matches: readonly ScanMatch[],
    scannedAt: string,
    matchId: string,
  ): ScanResult {
    const targetMatch = matches.find(match => match.id === matchId);
    if (!targetMatch) return this.rebuild(sourceText, matches, scannedAt);

    const nextMask = createDistinctMask(targetMatch.value, targetMatch.mask),
      updatedMatches = matches.map(match =>
        match.value === targetMatch.value
          ? { ...match, mask: nextMask }
          : match,
      );

    return this.rebuild(sourceText, updatedMatches, scannedAt);
  }

  public scan(
    sourceText: string,
    groupPreferences: MaskGroupPreferenceMap,
    scopeSelection: ScanScopeSelection,
    scannedAt = new Date().toISOString(),
  ): ScanResult {
    const activeRules = filterRulesForScope(MASKING_RULES, scopeSelection),
      regexCandidates = activeRules.flatMap(rule => {
        return Array.from(sourceText.matchAll(rule.patternFactory()))
          .map(match => extractCandidateMatch(match, rule))
          .filter((match): match is NonNullable<typeof match> => {
            if (!match?.value) return false;
            return rule.validator ? rule.validator(match.value) : true;
          });
      }),
      fuzzyCandidates = collectFuzzyLabelCandidates(sourceText, activeRules),
      candidates = [...regexCandidates, ...fuzzyCandidates],
      resolvedMatches = resolveOverlaps(candidates),
      maskByValue = new Map<string, string>(),
      matches = resolvedMatches.map(candidate => {
        const mask =
          maskByValue.get(candidate.value) ??
          createDistinctMask(candidate.value);
        maskByValue.set(candidate.value, mask);

        return {
          category: candidate.rule.category,
          confidence: candidate.rule.confidence,
          enabled: true,
          end: candidate.end,
          groupId: candidate.rule.category,
          id: `${candidate.rule.id}:${candidate.start}:${candidate.end}`,
          label: candidate.rule.label,
          locale: candidate.rule.locale,
          locked: false,
          mask,
          ruleId: candidate.rule.id,
          start: candidate.start,
          value: candidate.value,
        } satisfies ScanMatch;
      }),
      governedMatches = applyGroupPreferences(matches, groupPreferences);

    return this.rebuild(sourceText, governedMatches, scannedAt);
  }
}
