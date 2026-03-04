import type { ScanMatch } from "../masking/declarations/masking.types";
import {
  MASK_SAFETY_DECISIONS,
  MASK_SAFETY_LIMITS,
} from "./constants/mask-safety.constants";
import type { MaskSafetyClient } from "./declarations/mask-safety.types";
import { MaskSafetyHardeningService } from "./mask-safety-hardening.service";

describe("MaskSafetyHardeningService", () => {
  it("regenerates supported compromising candidates until the validator says they are safe", async () => {
    const initialMask = "529.982.247-25",
      client: MaskSafetyClient = {
        validate: jest.fn(async request => ({
          results: request.candidates.map(candidate => ({
            candidateValue: candidate.candidateValue,
            decision:
              candidate.candidateValue === initialMask
                ? MASK_SAFETY_DECISIONS.compromising
                : MASK_SAFETY_DECISIONS.safe,
            isCompromising: candidate.candidateValue === initialMask,
            isSupported: true,
            message: "",
            ruleId: candidate.ruleId,
          })),
        })),
      },
      service = new MaskSafetyHardeningService(client),
      result = await service.hardenMatches([
        createMatch("identifier:0", "cpf", initialMask),
        createMatch("identifier:1", "cpf", initialMask),
      ]);

    expect(result.matches[0].mask).not.toBe(initialMask);
    expect(result.matches[0].mask).toBe(result.matches[1].mask);
    expect(client.validate).toHaveBeenCalled();
  });

  it("leaves unsupported rules untouched", async () => {
    const initialMask = "123-45-6789",
      client: MaskSafetyClient = {
        validate: jest.fn(async request => ({
          results: request.candidates.map(candidate => ({
            candidateValue: candidate.candidateValue,
            decision: MASK_SAFETY_DECISIONS.unsupported,
            isCompromising: false,
            isSupported: false,
            message: "",
            ruleId: candidate.ruleId,
          })),
        })),
      },
      service = new MaskSafetyHardeningService(client),
      result = await service.hardenMatches([createMatch("identifier:0", "us-ssn", initialMask)]);

    expect(result.matches[0].mask).toBe(initialMask);
  });

  it("falls back to an invalidated candidate after exhausting the retry budget", async () => {
    let validationCallCount = 0;
    const client: MaskSafetyClient = {
        validate: jest.fn(async request => {
          validationCallCount += 1;
          return {
            results: request.candidates.map(candidate => ({
              candidateValue: candidate.candidateValue,
              decision:
                validationCallCount <= MASK_SAFETY_LIMITS.maxAttemptsPerCandidate
                  ? MASK_SAFETY_DECISIONS.compromising
                  : MASK_SAFETY_DECISIONS.safe,
              isCompromising:
                validationCallCount <= MASK_SAFETY_LIMITS.maxAttemptsPerCandidate,
              isSupported: true,
              message: "",
              ruleId: candidate.ruleId,
            })),
          };
        }),
      },
      service = new MaskSafetyHardeningService(client),
      initialMask = "GB29NWBK60161331926819",
      result = await service.hardenMatches([createMatch("financial:0", "iban", initialMask)]);

    expect(validationCallCount).toBe(MASK_SAFETY_LIMITS.maxAttemptsPerCandidate + 1);
    expect(result.matches[0].mask).not.toBe(initialMask);
  });
});

function createMatch(id: string, ruleId: string, mask: string): ScanMatch {
  return {
    category: ruleId === "iban" ? "financial" : "identifier",
    confidence: "high",
    enabled: true,
    end: 1,
    groupId: ruleId === "iban" ? "financial" : "identifier",
    id,
    label: ruleId,
    locale: "shared",
    locked: false,
    mask,
    ruleId,
    start: 0,
    value: mask,
  };
}
