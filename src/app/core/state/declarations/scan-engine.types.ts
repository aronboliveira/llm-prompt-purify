/**
 * Type declarations for scan engine service
 */
import type {
  CountryProfileId,
  DetectionMode,
  MaskGroupPreferenceMap,
} from "../../masking/declarations/masking.types";

export interface ScanEngineParams {
  countryProfileIds: readonly CountryProfileId[];
  detectionMode: DetectionMode;
  groupPreferences: MaskGroupPreferenceMap;
  sourceText: string;
}
