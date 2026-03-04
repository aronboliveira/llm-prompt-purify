import type { MatchCategory, ScanMatch } from "../../masking/declarations/masking.types";

export type MaskSafetyDecision = "compromising" | "safe" | "unsupported";

export interface MaskSafetyValidationCandidate {
  candidateValue: string;
  ruleId: string;
}

export interface MaskSafetyValidationRequest {
  candidates: readonly MaskSafetyValidationCandidate[];
}

export interface MaskSafetyValidationItemResponse {
  candidateValue: string;
  decision: MaskSafetyDecision;
  isCompromising: boolean;
  isSupported: boolean;
  message: string;
  ruleId: string;
}

export interface MaskSafetyValidationResponse {
  results: readonly MaskSafetyValidationItemResponse[];
}

export interface MaskSafetyCandidateGroup {
  candidateMask: string;
  category: MatchCategory;
  key: string;
  matchIds: readonly string[];
  ruleId: string;
  sourceValue: string;
}

export interface MaskSafetyClient {
  validate(
    request: MaskSafetyValidationRequest
  ): Promise<MaskSafetyValidationResponse>;
}

export interface MaskSafetyHardener {
  hardenMatches(matches: readonly ScanMatch[]): Promise<MaskSafetyHardeningResult>;
}

export interface MaskSafetyHardeningResult {
  matches: readonly ScanMatch[];
}
