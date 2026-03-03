import type {
  CountryProfileId,
  CountryProfileSummary,
  DetectionMode,
  MaskGroupPreferenceMap,
  MaskGroupSummary,
  ScanMatch,
  ScanResult,
} from "../../masking/declarations/masking.types";

export type ScanPhase = "detecting" | "idle" | "masking" | "ready";

export interface ScanSessionState {
  countryProfileId: CountryProfileId;
  detectionMode: DetectionMode;
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
  countryProfiles: readonly CountryProfileSummary[];
  detectionMode: DetectionMode;
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
  selectedCountryProfile: CountryProfileSummary;
  sourceText: string;
  statusMessage: string;
}
