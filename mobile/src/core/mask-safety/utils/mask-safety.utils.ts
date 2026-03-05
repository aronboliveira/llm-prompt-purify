import type { ScanMatch } from "../../masking/declarations/masking.types";
import type {
  MaskSafetyCandidateGroup,
  MaskSafetyValidationCandidate,
  MaskSafetyValidationItemResponse,
} from "../declarations/mask-safety.types";

export function applyCandidateGroupsToMatches(
  matches: readonly ScanMatch[],
  candidateGroups: readonly MaskSafetyCandidateGroup[],
): readonly ScanMatch[] {
  const candidateMaskByKey = new Map(
    candidateGroups.map((cg) => [cg.key, cg.candidateMask]),
  );

  return matches.map((match) => {
    const candidateMask = candidateMaskByKey.get(
      createMaskSafetyGroupKey(match.ruleId, match.value),
    );
    return candidateMask ? { ...match, mask: candidateMask } : match;
  });
}

export function buildValidationCandidates(
  candidateGroups: readonly MaskSafetyCandidateGroup[],
): readonly MaskSafetyValidationCandidate[] {
  return candidateGroups.map((cg) => ({
    candidateValue: cg.candidateMask,
    ruleId: cg.ruleId,
  }));
}

export function chunkCandidates<T>(
  items: readonly T[],
  chunkSize: number,
): readonly T[][] {
  if (chunkSize <= 0) return [Array.from(items)];

  const chunks: T[][] = [];
  for (let index = 0; index < items.length; index += chunkSize) {
    chunks.push(Array.from(items.slice(index, index + chunkSize)));
  }

  return chunks;
}

export function createMaskSafetyGroupKey(
  ruleId: string,
  sourceValue: string,
): string {
  return `${ruleId}::${sourceValue}`;
}

export function createValidationResponseKey(
  response: Pick<MaskSafetyValidationItemResponse, "candidateValue" | "ruleId">,
): string {
  return `${response.ruleId}::${response.candidateValue}`;
}

export function groupMaskSafetyCandidates(
  matches: readonly ScanMatch[],
): readonly MaskSafetyCandidateGroup[] {
  const candidateGroups = new Map<string, MaskSafetyCandidateGroup>();

  for (const match of matches) {
    if (match.category !== "financial" && match.category !== "identifier")
      continue;

    const key = createMaskSafetyGroupKey(match.ruleId, match.value),
      existingGroup = candidateGroups.get(key);

    if (existingGroup) {
      candidateGroups.set(key, {
        ...existingGroup,
        matchIds: [...existingGroup.matchIds, match.id],
      });
      continue;
    }

    candidateGroups.set(key, {
      candidateMask: match.mask,
      category: match.category,
      key,
      matchIds: [match.id],
      ruleId: match.ruleId,
      sourceValue: match.value,
    });
  }

  return Array.from(candidateGroups.values());
}
