import { MASK_GROUP_ORDER } from "../constants/masking.constants";
import type {
  CandidateMatch,
  DetectionRule,
  MaskGroupId,
  MaskGroupPreferenceMap,
  ScanMatch,
} from "../declarations/masking.types";
import { sanitizeCapturedValue } from "./mask-format.utils";

export function buildCandidateMatch(
  rule: DetectionRule,
  start: number,
  end: number,
  value: string,
): CandidateMatch {
  return {
    end,
    rule,
    start,
    value,
  };
}

export function applyEnabledMasks(
  sourceText: string,
  matches: readonly ScanMatch[],
): string {
  const enabledMatches = [...matches]
    .filter(match => match.enabled)
    .sort((left, right) => left.start - right.start);

  if (!enabledMatches.length) return sourceText;

  let cursor = 0,
    maskedText = "",
    maskCounter = 0;
  for (const match of enabledMatches) {
    maskCounter++;
    maskedText += sourceText.slice(cursor, match.start);
    maskedText += `[MASK-${maskCounter}]${match.mask}`;
    cursor = match.end;
  }
  maskedText += sourceText.slice(cursor);
  return maskedText;
}

export function applyGroupPreferences(
  matches: readonly ScanMatch[],
  preferences: MaskGroupPreferenceMap,
): readonly ScanMatch[] {
  return matches.map(match => {
    const preference = preferences[match.groupId];
    if (!preference.enabled) return { ...match, enabled: false, locked: false };
    if (preference.alwaysOn) return { ...match, enabled: true, locked: true };
    return { ...match, locked: false };
  });
}

export function extractCandidateMatch(
  match: RegExpMatchArray,
  rule: DetectionRule,
): CandidateMatch | null {
  if (typeof match.index !== "number") return null;

  if (typeof rule.valueGroup !== "number") {
    const value = sanitizeCapturedValue(match[0]);
    return value
      ? buildCandidateMatch(
          rule,
          match.index,
          match.index + value.length,
          value,
        )
      : null;
  }

  const capturedValue = sanitizeCapturedValue(match[rule.valueGroup] ?? "");
  if (!capturedValue && !rule.allowEmptyValue) return null;

  let relativeIndex: number;
  if (capturedValue.length === 0 && rule.allowEmptyValue) {
    // Empty value: place mask at end of full match (after the delimiter).
    // Avoids `indexOf("")` returning 0 and anchoring the mask at the key start.
    relativeIndex = match[0].length;
  } else {
    relativeIndex = match[0].indexOf(capturedValue);
  }

  if (relativeIndex < 0) return null;

  const start = match.index + relativeIndex;
  return buildCandidateMatch(
    rule,
    start,
    start + capturedValue.length,
    capturedValue,
  );
}

export function resolveOverlaps(
  candidates: readonly CandidateMatch[],
): readonly CandidateMatch[] {
  if (candidates.length <= 1) return [...candidates];

  const sorted = [...candidates].sort((left, right) => {
    if (left.start !== right.start) return left.start - right.start;
    if (left.rule.priority !== right.rule.priority)
      return right.rule.priority - left.rule.priority;
    return right.value.length - left.value.length;
  });

  const resolved: CandidateMatch[] = [];
  for (const candidate of sorted) {
    const previous = resolved.at(-1);
    if (!previous || candidate.start > previous.end) {
      resolved.push(candidate);
      continue;
    }
    // Deduplicate zero-length masks at the same position
    if (candidate.start === previous.end && candidate.start === candidate.end && previous.start === previous.end) {
      if (candidate.rule.priority > previous.rule.priority)
        resolved[resolved.length - 1] = candidate;
      continue;
    }

    if (scoreCandidate(candidate) > scoreCandidate(previous))
      resolved[resolved.length - 1] = candidate;
  }

  return resolved.sort((left, right) => left.start - right.start);
}

export function summarizeGroupCounts(
  matches: readonly ScanMatch[],
): Readonly<Record<MaskGroupId, number>> {
  const counts = Object.fromEntries(
    MASK_GROUP_ORDER.map(groupId => [groupId, 0]),
  ) as Record<MaskGroupId, number>;

  for (const match of matches) counts[match.groupId] += 1;
  return Object.freeze(counts);
}

/**
 * LG-003: Calculates a scoring value for overlap resolution.
 * Higher score = higher precedence.
 * Factors: priority (major), confidence (minor), value length (tiebreaker)
 */
function scoreCandidate(candidate: CandidateMatch): number {
  const confidenceScore = candidate.rule.confidence === "high" ? 100 : 0;
  return (
    candidate.rule.priority * 1000 + confidenceScore + candidate.value.length
  );
}
