import { MASKING_RULES } from "./masking-rules.constants";
import type { ScanMatch, ScanResult } from "./masking.types";
import {
  applyEnabledMasks,
  createMask,
  extractCandidateMatch,
  resolveOverlaps,
} from "./masking.utils";

export function rebuildScanResult(
  sourceText: string,
  matches: readonly ScanMatch[],
  scannedAt: string
): ScanResult {
  const normalizedMatches = [...matches].sort((left, right) => left.start - right.start),
    maskedText = applyEnabledMasks(sourceText, normalizedMatches),
    enabledMatches = normalizedMatches.filter(match => match.enabled).length;

  return {
    enabledMatches,
    hasMatches: normalizedMatches.length > 0,
    maskedText,
    matches: normalizedMatches,
    scannedAt,
    sourceText,
    totalMatches: normalizedMatches.length,
  };
}

export function scanSensitiveText(
  sourceText: string,
  scannedAt = new Date().toISOString()
): ScanResult {
  const candidates = MASKING_RULES.flatMap(rule => {
      return Array.from(sourceText.matchAll(rule.patternFactory()))
        .map(match => extractCandidateMatch(match, rule))
        .filter((match): match is NonNullable<typeof match> => {
          if (!match?.value) return false;
          return rule.validator ? rule.validator(match.value) : true;
        });
    }),
    resolvedMatches = resolveOverlaps(candidates),
    maskByValue = new Map<string, string>(),
    matches = resolvedMatches.map(candidate => {
      const mask = maskByValue.get(candidate.value) ?? createMask(candidate.value);
      maskByValue.set(candidate.value, mask);

      return {
        category: candidate.rule.category,
        confidence: candidate.rule.confidence,
        enabled: true,
        end: candidate.end,
        id: `${candidate.rule.id}:${candidate.start}:${candidate.end}`,
        label: candidate.rule.label,
        locale: candidate.rule.locale,
        mask,
        ruleId: candidate.rule.id,
        start: candidate.start,
        value: candidate.value,
      } satisfies ScanMatch;
    });

  return rebuildScanResult(sourceText, matches, scannedAt);
}
