/**
 * Mask-safety hardening module for React Native.
 *
 * In the Angular app this was an @Injectable service calling an HTTP backend.
 * Here we provide the same algorithm as a plain function that accepts
 * a MaskSafetyClient (e.g. a fetch-based implementation or a noop stub).
 */
import {
  createDistinctMask,
  invalidateCandidateMask,
} from "../masking/utils/mask-format.utils";
import type { ScanMatch } from "../masking/declarations/masking.types";
import { MASK_SAFETY_DECISIONS, MASK_SAFETY_LIMITS } from "./constants/mask-safety.constants";
import type {
  MaskSafetyCandidateGroup,
  MaskSafetyClient,
  MaskSafetyHardener,
  MaskSafetyHardeningResult,
  MaskSafetyValidationItemResponse,
} from "./declarations/mask-safety.types";
import {
  applyCandidateGroupsToMatches,
  buildValidationCandidates,
  chunkCandidates,
  createValidationResponseKey,
  groupMaskSafetyCandidates,
} from "./utils/mask-safety.utils";

/**
 * Creates a MaskSafetyHardener backed by the given client.
 * The client can be a real API caller or a noop stub.
 */
export function createMaskSafetyHardener(
  client: MaskSafetyClient,
): MaskSafetyHardener {
  return {
    async hardenMatches(
      matches: readonly ScanMatch[],
    ): Promise<MaskSafetyHardeningResult> {
      let candidateGroups = groupMaskSafetyCandidates(matches);
      if (!candidateGroups.length) return { matches };

      try {
        let latestResultByKey = new Map<string, MaskSafetyValidationItemResponse>();

        for (
          let attempt = 0;
          attempt < MASK_SAFETY_LIMITS.maxAttemptsPerCandidate;
          attempt += 1
        ) {
          const results = await validateCandidateGroups(client, candidateGroups);
          const resultByKey = new Map(
            results.map((r) => [createValidationResponseKey(r), r]),
          );
          latestResultByKey = resultByKey;

          let hasCompromising = false;
          candidateGroups = candidateGroups.map((cg) => {
            const r = resultByKey.get(
              createValidationResponseKey({
                candidateValue: cg.candidateMask,
                ruleId: cg.ruleId,
              }),
            );
            if (!r || !r.isSupported) return cg;
            if (!r.isCompromising) return cg;

            hasCompromising = true;
            return {
              ...cg,
              candidateMask: createDistinctMask(cg.sourceValue, cg.candidateMask),
            };
          });

          if (!hasCompromising) {
            return { matches: applyCandidateGroupsToMatches(matches, candidateGroups) };
          }
        }

        // Fallback: invalidate remaining compromising candidates
        const invalidated = candidateGroups.map((cg) => {
          const r = latestResultByKey.get(
            createValidationResponseKey({
              candidateValue: cg.candidateMask,
              ruleId: cg.ruleId,
            }),
          );
          if (!r?.isSupported || !r.isCompromising) return cg;
          return { ...cg, candidateMask: invalidateCandidateMask(cg.candidateMask) };
        });

        const fallbackResults = await validateCandidateGroups(client, invalidated);
        const safeFallbackByKey = new Map(
          fallbackResults
            .filter(
              (r) =>
                !r.isSupported ||
                r.decision === MASK_SAFETY_DECISIONS.safe,
            )
            .map((r) => [createValidationResponseKey(r), r]),
        );

        const finalized = invalidated.map((cg) => {
          const key = createValidationResponseKey({
            candidateValue: cg.candidateMask,
            ruleId: cg.ruleId,
          });
          return safeFallbackByKey.has(key)
            ? cg
            : candidateGroups.find(({ key: k }) => k === cg.key) ?? cg;
        });

        return { matches: applyCandidateGroupsToMatches(matches, finalized) };
      } catch {
        return { matches };
      }
    },
  };
}

async function validateCandidateGroups(
  client: MaskSafetyClient,
  candidateGroups: readonly MaskSafetyCandidateGroup[],
): Promise<readonly MaskSafetyValidationItemResponse[]> {
  const chunks = chunkCandidates(
    buildValidationCandidates(candidateGroups),
    MASK_SAFETY_LIMITS.batchSize,
  );
  const responses = await Promise.all(
    chunks.map((candidates) => client.validate({ candidates })),
  );
  return responses.flatMap((r) => r.results);
}

/**
 * A noop hardener that passes all masks through unchanged.
 * Suitable for offline-first / local-only mode.
 */
export const noopHardener: MaskSafetyHardener = {
  hardenMatches: async (matches) => ({ matches }),
};
