/**
 * Type declarations for profile export service
 */
import type {
  CountryProfileId,
  DetectionMode,
  MaskGroupPreferenceMap,
} from "../../masking/declarations/masking.types";

export interface MaskingProfile {
  exportedAt: string;
  name: string;
  settings: {
    detectionMode: DetectionMode;
    groupPreferences: MaskGroupPreferenceMap;
    selectedCountries: CountryProfileId[];
  };
  version: 1;
}
