import type { ScanMatch } from "@core/masking/declarations/masking.types";
import {
  MASK_SAFETY_DECISIONS,
  MASK_SAFETY_LIMITS,
} from "@core/mask-safety/constants/mask-safety.constants";
import type { MaskSafetyClient } from "@core/mask-safety/declarations/mask-safety.types";
import { MaskSafetyHardeningService } from "@core/mask-safety/mask-safety-hardening.service";

describe("mask-safety request throttling regression", () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  it("does not self-rate-limit when candidate groups exceed one API batch", async () => {
    jest.useFakeTimers();
    const client: MaskSafetyClient = {
        validate: jest.fn(async request => ({
          results: request.candidates.map(candidate => ({
            candidateValue: candidate.candidateValue,
            decision: MASK_SAFETY_DECISIONS.safe,
            isCompromising: false,
            isSupported: true,
            message: "",
            ruleId: candidate.ruleId,
          })),
        })),
      },
      service = new MaskSafetyHardeningService(client),
      matches = Array.from(
        { length: MASK_SAFETY_LIMITS.batchSize + 1 },
        (_, index) => createMatch(`identifier:${index}`, "cpf", index),
      ),
      resultPromise = service.hardenMatches(matches);

    await Promise.resolve();
    await Promise.resolve();

    expect(client.validate).toHaveBeenCalledTimes(1);

    await jest.advanceTimersByTimeAsync(
      MASK_SAFETY_LIMITS.requestThrottleMs - 1,
    );
    expect(client.validate).toHaveBeenCalledTimes(1);

    await jest.advanceTimersByTimeAsync(1);
    const result = await resultPromise;

    expect(client.validate).toHaveBeenCalledTimes(2);
    expect(result.matches).toHaveLength(matches.length);
  });
});

function createMatch(id: string, ruleId: string, index: number): ScanMatch {
  const value = `candidate-${index}`;

  return {
    category: "identifier",
    confidence: "high",
    enabled: true,
    end: index + 1,
    groupId: "identifier",
    id,
    label: ruleId,
    locale: "shared",
    locked: false,
    mask: value,
    matchTags: [],
    ruleId,
    start: index,
    value,
  };
}
