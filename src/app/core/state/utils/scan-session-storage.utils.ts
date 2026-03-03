import {
  DEFAULT_COUNTRY_PROFILE_ID,
  DEFAULT_GROUP_PREFERENCES,
} from "../../masking/constants/masking.constants";
import type {
  CountryProfileId,
  DetectionMode,
  MaskGroupPreferenceMap,
} from "../../masking/declarations/masking.types";
import { isKnownCountryProfileId } from "../../masking/utils/country-scope.utils";
import { createGroupPreferenceMap } from "../../masking/utils/mask-group.utils";
import { SESSION_STORAGE_KEYS } from "../constants/scan-session.constants";

export function loadPersistedGroupPreferences(): MaskGroupPreferenceMap {
  try {
    if (typeof sessionStorage === "undefined") return DEFAULT_GROUP_PREFERENCES;

    const rawValue = sessionStorage.getItem(SESSION_STORAGE_KEYS.groupPreferences);
    if (!rawValue) return DEFAULT_GROUP_PREFERENCES;

    const parsed = JSON.parse(rawValue) as Partial<MaskGroupPreferenceMap>;
    return createGroupPreferenceMap(parsed);
  } catch {
    return DEFAULT_GROUP_PREFERENCES;
  }
}

export function loadPersistedSourceText(): string {
  try {
    if (typeof sessionStorage === "undefined") return "";
    return sessionStorage.getItem(SESSION_STORAGE_KEYS.sourceText) ?? "";
  } catch {
    return "";
  }
}

export function loadPersistedCountryProfileId(): CountryProfileId {
  try {
    if (typeof sessionStorage === "undefined") return DEFAULT_COUNTRY_PROFILE_ID;

    const rawValue = sessionStorage.getItem(SESSION_STORAGE_KEYS.countryProfileId);
    if (!rawValue || !isKnownCountryProfileId(rawValue)) return DEFAULT_COUNTRY_PROFILE_ID;
    return rawValue;
  } catch {
    return DEFAULT_COUNTRY_PROFILE_ID;
  }
}

export function loadPersistedDetectionMode(): DetectionMode {
  try {
    if (typeof sessionStorage === "undefined") return "country-plus-global";

    const rawValue = sessionStorage.getItem(SESSION_STORAGE_KEYS.detectionMode);
    return rawValue === "global-only" ? "global-only" : "country-plus-global";
  } catch {
    return "country-plus-global";
  }
}

export function persistCountryProfileId(countryProfileId: CountryProfileId): void {
  try {
    if (typeof sessionStorage === "undefined") return;
    sessionStorage.setItem(SESSION_STORAGE_KEYS.countryProfileId, countryProfileId);
  } catch {
    // Storage is optional and must not block local masking.
  }
}

export function persistDetectionMode(detectionMode: DetectionMode): void {
  try {
    if (typeof sessionStorage === "undefined") return;
    sessionStorage.setItem(SESSION_STORAGE_KEYS.detectionMode, detectionMode);
  } catch {
    // Storage is optional and must not block local masking.
  }
}

export function persistGroupPreferences(groupPreferences: MaskGroupPreferenceMap): void {
  try {
    if (typeof sessionStorage === "undefined") return;
    sessionStorage.setItem(
      SESSION_STORAGE_KEYS.groupPreferences,
      JSON.stringify(groupPreferences)
    );
  } catch {
    // Storage is optional and must not block local masking.
  }
}

export function persistSourceText(sourceText: string): void {
  try {
    if (typeof sessionStorage === "undefined") return;
    if (sourceText)
      sessionStorage.setItem(SESSION_STORAGE_KEYS.sourceText, sourceText);
    else sessionStorage.removeItem(SESSION_STORAGE_KEYS.sourceText);
  } catch {
    // Storage is optional and must not block local masking.
  }
}
