import { Injectable, signal } from "@angular/core";

import {
  COUNTRY_PROFILE_DEFINITIONS,
  COUNTRY_PROFILE_ORDER,
  DEFAULT_COUNTRY_PROFILE_IDS,
} from "../masking/constants/masking.constants";
import type {
  CountryProfileId,
  CountryProfileSummary,
  DetectionMode,
} from "../masking/declarations/masking.types";
import { normalizeCountryProfileIds } from "../masking/utils/country-scope.utils";
import type { CountryScopeState } from "./declarations/country-scope.types";
import {
  loadPersistedCountryProfileIds,
  loadPersistedDetectionMode,
  persistCountryProfileIds,
  persistDetectionMode,
} from "./utils/scan-session-storage.utils";

export type { CountryScopeState } from "./declarations/country-scope.types";

/**
 * LG-007: Extracted country scope management from ScanSessionService.
 * Handles country profile selection and detection mode.
 */
@Injectable({ providedIn: "root" })
export class CountryScopeService {
  readonly #state = signal<CountryScopeState>({
    countryProfileIds: loadPersistedCountryProfileIds(),
    detectionMode: loadPersistedDetectionMode(),
  });

  readonly state = this.#state.asReadonly();

  getCountryProfiles(): readonly CountryProfileSummary[] {
    const currentIds = this.#state().countryProfileIds;
    return COUNTRY_PROFILE_ORDER.map(id => ({
      ...COUNTRY_PROFILE_DEFINITIONS[id],
      selected: currentIds.includes(id),
    }));
  }

  getSelectedCountryProfiles(): readonly CountryProfileSummary[] {
    return this.getCountryProfiles().filter(p => p.selected);
  }

  setCountryProfile(countryProfileId: CountryProfileId): void {
    this.setCountryProfiles([countryProfileId]);
  }

  setCountryProfiles(countryProfileIds: readonly CountryProfileId[]): boolean {
    const normalizedIds = normalizeCountryProfileIds(countryProfileIds).length
      ? normalizeCountryProfileIds(countryProfileIds)
      : DEFAULT_COUNTRY_PROFILE_IDS;

    if (this.#hasSameSelection(this.#state().countryProfileIds, normalizedIds))
      return false;

    this.#state.update(state => ({
      ...state,
      countryProfileIds: normalizedIds,
    }));
    persistCountryProfileIds(normalizedIds);
    return true;
  }

  setDetectionMode(detectionMode: DetectionMode): boolean {
    if (this.#state().detectionMode === detectionMode) return false;

    this.#state.update(state => ({
      ...state,
      detectionMode,
    }));
    persistDetectionMode(detectionMode);
    return true;
  }

  #hasSameSelection(
    left: readonly CountryProfileId[],
    right: readonly CountryProfileId[],
  ): boolean {
    if (left.length !== right.length) return false;
    return left.every((id, i) => id === right[i]);
  }
}
