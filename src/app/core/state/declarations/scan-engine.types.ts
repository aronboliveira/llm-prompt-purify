/**
 * Type declarations for scan engine service
 */
import type {
  AdvancedMaskingPreferences,
  CountryProfileId,
  DetectionMode,
  MaskGroupPreferenceMap,
  ScanResult,
} from "../../masking/declarations/masking.types";

export interface ScanEngineParams {
  advancedPreferences: AdvancedMaskingPreferences;
  countryProfileIds: readonly CountryProfileId[];
  detectionMode: DetectionMode;
  groupPreferences: MaskGroupPreferenceMap;
  sourceText: string;
}

export interface ScanWorkerRequest {
  id: number;
  params: ScanEngineParams;
  scannedAt: string;
}

export type ScanWorkerResponse =
  | {
      id: number;
      result: ScanResult;
    }
  | {
      error: string;
      id: number;
    };
