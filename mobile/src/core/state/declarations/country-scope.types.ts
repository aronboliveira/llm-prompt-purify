/**
 * Type declarations for country scope service
 */
import type {
  CountryProfileId,
  DetectionMode,
} from "../../masking/declarations/masking.types";

export interface CountryScopeState {
  countryProfileIds: readonly CountryProfileId[];
  detectionMode: DetectionMode;
}
