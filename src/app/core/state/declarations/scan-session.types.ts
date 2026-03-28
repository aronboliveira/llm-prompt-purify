import type {
  AdvancedMaskingPreferences,
  CountryProfileId,
  CountryProfileSummary,
  DetectionMode,
  MaskGroupPreferenceMap,
  MaskGroupSummary,
  ScanMatch,
  ScanResult,
} from "../../masking/declarations/masking.types";

export type ScanPhase =
  | "detecting"
  | "idle"
  | "masking"
  | "ready"
  | "validating";

export type InputAction =
  | "typing"
  | "paste"
  | "delete"
  | "composition"
  | "format";

export interface ScanSessionState {
  advancedPreferences: AdvancedMaskingPreferences;
  countryProfileIds: readonly CountryProfileId[];
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
  advancedPreferences: AdvancedMaskingPreferences;
  canCopy: boolean;
  countryProfiles: readonly CountryProfileSummary[];
  detectionMode: DetectionMode;
  editableMatches: number;
  errorMessage: string | null;
  groupPreferences: MaskGroupPreferenceMap;
  groups: readonly MaskGroupSummary[];
  hasMatches: boolean;
  hasResult: boolean;
  isScanning: boolean;
  maskedText: string;
  matchCount: number;
  matches: readonly ScanMatch[];
  scannedAt: string | null;
  scanPhase: ScanPhase;
  selectedCountryProfile: CountryProfileSummary | null;
  selectedCountryProfiles: readonly CountryProfileSummary[];
  sourceText: string;
  statusMessage: string;
}
