import { MMKV } from "react-native-mmkv";

import {
  DEFAULT_COUNTRY_PROFILE_IDS,
  DEFAULT_GROUP_PREFERENCES,
} from "../../masking/constants/masking.constants";
import type {
  CountryProfileId,
  DetectionMode,
  MaskGroupPreferenceMap,
} from "../../masking/declarations/masking.types";
import {
  isKnownCountryProfileId,
  normalizeCountryProfileIds,
} from "../../masking/utils/country-scope.utils";
import { createGroupPreferenceMap } from "../../masking/utils/mask-group.utils";
import { SESSION_STORAGE_KEYS } from "../constants/scan-session.constants";
import { detectDeviceCountryProfileIds } from "./country-profile-defaults.utils";

/**
 * MMKV instance for persisting scan session state.
 * MMKV is a high-performance key-value store for React Native
 * replacing sessionStorage from the web version.
 */
const storage = new MMKV({ id: "llm-prompt-purify-session" });

export function loadPersistedGroupPreferences(): MaskGroupPreferenceMap {
  try {
    const rawValue = storage.getString(SESSION_STORAGE_KEYS.groupPreferences);
    if (!rawValue) return DEFAULT_GROUP_PREFERENCES;

    const parsed = JSON.parse(rawValue) as Partial<MaskGroupPreferenceMap>;
    return createGroupPreferenceMap(parsed);
  } catch {
    return DEFAULT_GROUP_PREFERENCES;
  }
}

export function loadPersistedSourceText(): string {
  try {
    return storage.getString(SESSION_STORAGE_KEYS.sourceText) ?? "";
  } catch {
    return "";
  }
}

export function loadPersistedCountryProfileIds(): readonly CountryProfileId[] {
  try {
    const rawValue = storage.getString(SESSION_STORAGE_KEYS.countryProfileIds);
    if (rawValue) {
      const parsed = JSON.parse(rawValue) as string[],
        countryProfileIds = normalizeCountryProfileIds(
          parsed.filter(isKnownCountryProfileId) as CountryProfileId[],
        );

      if (countryProfileIds.length) return countryProfileIds;
    }

    const legacyCountryProfileId = storage.getString(
      SESSION_STORAGE_KEYS.countryProfileId,
    );
    if (
      legacyCountryProfileId &&
      isKnownCountryProfileId(legacyCountryProfileId)
    ) {
      return Object.freeze([legacyCountryProfileId]);
    }

    return detectDeviceCountryProfileIds();
  } catch {
    return DEFAULT_COUNTRY_PROFILE_IDS;
  }
}

export function loadPersistedDetectionMode(): DetectionMode {
  try {
    const rawValue = storage.getString(SESSION_STORAGE_KEYS.detectionMode);
    return rawValue === "global-only" ? "global-only" : "selected-plus-global";
  } catch {
    return "selected-plus-global";
  }
}

export function persistCountryProfileIds(
  countryProfileIds: readonly CountryProfileId[],
): void {
  try {
    storage.set(
      SESSION_STORAGE_KEYS.countryProfileIds,
      JSON.stringify(normalizeCountryProfileIds(countryProfileIds)),
    );
  } catch {
    // Storage is optional and must not block local masking.
  }
}

export function persistDetectionMode(detectionMode: DetectionMode): void {
  try {
    storage.set(SESSION_STORAGE_KEYS.detectionMode, detectionMode);
  } catch {
    // Storage is optional and must not block local masking.
  }
}

export function persistGroupPreferences(
  groupPreferences: MaskGroupPreferenceMap,
): void {
  try {
    storage.set(
      SESSION_STORAGE_KEYS.groupPreferences,
      JSON.stringify(groupPreferences),
    );
  } catch {
    // Storage is optional and must not block local masking.
  }
}

export function persistSourceText(sourceText: string): void {
  try {
    if (sourceText) {
      storage.set(SESSION_STORAGE_KEYS.sourceText, sourceText);
    } else {
      storage.delete(SESSION_STORAGE_KEYS.sourceText);
    }
  } catch {
    // Storage is optional and must not block local masking.
  }
}
