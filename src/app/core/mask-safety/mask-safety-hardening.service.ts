import { Inject, Injectable, inject } from "@angular/core";

import { createDistinctMask, invalidateCandidateMask } from "../masking/utils/mask-format.utils";
import { MASK_SAFETY_DECISIONS, MASK_SAFETY_LIMITS } from "./constants/mask-safety.constants";
import type {
  MaskSafetyCandidateGroup,
  MaskSafetyClient,
  MaskSafetyHardener,
  MaskSafetyHardeningResult,
  MaskSafetyValidationItemResponse,
} from "./declarations/mask-safety.types";
import { MaskSafetyApiService } from "./mask-safety-api.service";
import {
  applyCandidateGroupsToMatches,
  buildValidationCandidates,
  chunkCandidates,
  createValidationResponseKey,
  groupMaskSafetyCandidates,
} from "./utils/mask-safety.utils";
import type { ScanMatch } from "../masking/declarations/masking.types";

@Injectable({ providedIn: "root" })
export class MaskSafetyHardeningService implements MaskSafetyHardener {
  readonly #maskSafetyClient: MaskSafetyClient;
  #lastValidationCallAt = 0;

  public constructor(
    @Inject(MaskSafetyApiService) maskSafetyClient?: MaskSafetyClient
  ) {
    this.#maskSafetyClient = maskSafetyClient ?? inject(MaskSafetyApiService);
  }

  public async hardenMatches(
    matches: readonly ScanMatch[]
  ): Promise<MaskSafetyHardeningResult> {
    let candidateGroups = groupMaskSafetyCandidates(matches);
    if (!candidateGroups.length) return { matches };

    try {
      let latestValidationResultByKey = new Map<string, MaskSafetyValidationItemResponse>();

      for (
        let attempt = 0;
        attempt < MASK_SAFETY_LIMITS.maxAttemptsPerCandidate;
        attempt += 1
      ) {
        const validationResults = await this.#validateCandidateGroups(candidateGroups),
          validationResultByKey = new Map(
            validationResults.map(validationResult => [
              createValidationResponseKey(validationResult),
              validationResult,
            ])
          );
        latestValidationResultByKey = validationResultByKey;
        let hasCompromisingCandidates = false;

        candidateGroups = candidateGroups.map(candidateGroup => {
          const validationResult = validationResultByKey.get(
            createValidationResponseKey({
              candidateValue: candidateGroup.candidateMask,
              ruleId: candidateGroup.ruleId,
            })
          );

          if (!validationResult || !validationResult.isSupported) return candidateGroup;
          if (!validationResult.isCompromising) return candidateGroup;

          hasCompromisingCandidates = true;
          return {
            ...candidateGroup,
            candidateMask: createDistinctMask(
              candidateGroup.sourceValue,
              candidateGroup.candidateMask
            ),
          };
        });

        if (!hasCompromisingCandidates) {
          return {
            matches: applyCandidateGroupsToMatches(matches, candidateGroups),
          };
        }
      }

      const invalidatedCandidateGroups = candidateGroups.map(candidateGroup => {
          const validationResult = latestValidationResultByKey.get(
            createValidationResponseKey({
              candidateValue: candidateGroup.candidateMask,
              ruleId: candidateGroup.ruleId,
            })
          );

          if (!validationResult?.isSupported || !validationResult.isCompromising) {
            return candidateGroup;
          }

          return {
            ...candidateGroup,
            candidateMask: invalidateCandidateMask(candidateGroup.candidateMask),
          };
        }),
        fallbackResults = await this.#validateCandidateGroups(invalidatedCandidateGroups),
        safeFallbackByKey = new Map(
          fallbackResults
            .filter(validationResult => {
              return (
                !validationResult.isSupported ||
                validationResult.decision === MASK_SAFETY_DECISIONS.safe
              );
            })
            .map(validationResult => [
              createValidationResponseKey(validationResult),
              validationResult,
            ])
        ),
        finalizedCandidateGroups = invalidatedCandidateGroups.map(candidateGroup => {
          const validationKey = createValidationResponseKey({
            candidateValue: candidateGroup.candidateMask,
            ruleId: candidateGroup.ruleId,
          });

          return safeFallbackByKey.has(validationKey)
            ? candidateGroup
            : candidateGroups.find(({ key }) => key === candidateGroup.key) ?? candidateGroup;
        });

      return {
        matches: applyCandidateGroupsToMatches(matches, finalizedCandidateGroups),
      };
    } catch {
      return { matches };
    }
  }

  async #validateCandidateGroups(
    candidateGroups: readonly MaskSafetyCandidateGroup[]
  ): Promise<readonly MaskSafetyValidationItemResponse[]> {
    const validationCandidateChunks = chunkCandidates(
      buildValidationCandidates(candidateGroups),
      MASK_SAFETY_LIMITS.batchSize
    );
    const validationResponses = [];
    for (const validationCandidates of validationCandidateChunks) {
      await this.#waitForValidationSlot();
      validationResponses.push(
        await this.#maskSafetyClient.validate({
          candidates: validationCandidates,
        })
      );
    }

    return validationResponses.flatMap(validationResponse => validationResponse.results);
  }

  async #waitForValidationSlot(): Promise<void> {
    const elapsedMs = Date.now() - this.#lastValidationCallAt,
      waitMs = this.#lastValidationCallAt
        ? Math.max(0, MASK_SAFETY_LIMITS.requestThrottleMs - elapsedMs)
        : 0;

    if (waitMs > 0) {
      await new Promise<void>(resolve => setTimeout(resolve, waitMs));
    }

    this.#lastValidationCallAt = Date.now();
  }
}
