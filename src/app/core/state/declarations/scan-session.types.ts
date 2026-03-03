import type {
  MaskGroupPreferenceMap,
  MaskGroupSummary,
  ScanMatch,
  ScanResult,
} from "../../masking/declarations/masking.types";

export type ScanPhase = "detecting" | "idle" | "masking" | "ready";

export interface ScanSessionState {
  errorMessage: string | null;
  groupPreferences: MaskGroupPreferenceMap;
  isScanning: boolean;
  result: ScanResult | null;
  scanPhase: ScanPhase;
  sourceText: string;
  statusMessage: string;
}

export interface ScanSessionViewModel {
  activeMatches: number;
  canCopy: boolean;
  editableMatches: number;
  errorMessage: string | null;
  groups: readonly MaskGroupSummary[];
  hasMatches: boolean;
  hasResult: boolean;
  isScanning: boolean;
  maskedText: string;
  matchCount: number;
  matches: readonly ScanMatch[];
  scannedAt: string | null;
  scanPhase: ScanPhase;
  sourceText: string;
  statusMessage: string;
}
