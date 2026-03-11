import {
  DEFAULT_ADVANCED_PREFERENCES,
  DEFAULT_COUNTRY_PROFILE_IDS,
  DEFAULT_GROUP_PREFERENCES,
} from "../../masking/constants/masking.constants";
import type {
  AdvancedMaskingPreferences,
  CountryProfileId,
  DetectionMode,
  MaskGroupPreferenceMap,
  MaskingStrategy,
  XmlWrapTag,
} from "../../masking/declarations/masking.types";
import {
  isKnownCountryProfileId,
  normalizeCountryProfileIds,
} from "../../masking/utils/country-scope.utils";
import { createGroupPreferenceMap } from "../../masking/utils/mask-group.utils";
import { SESSION_STORAGE_KEYS } from "../constants/scan-session.constants";
import { detectBrowserCountryProfileIds } from "./country-profile-defaults.utils";

export function loadPersistedGroupPreferences(): MaskGroupPreferenceMap {
  try {
    if (typeof sessionStorage === "undefined") return DEFAULT_GROUP_PREFERENCES;

    const rawValue = sessionStorage.getItem(
      SESSION_STORAGE_KEYS.groupPreferences,
    );
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

export function loadPersistedCountryProfileIds(): readonly CountryProfileId[] {
  try {
    if (typeof sessionStorage === "undefined")
      return detectBrowserCountryProfileIds();

    const rawValue = sessionStorage.getItem(
      SESSION_STORAGE_KEYS.countryProfileIds,
    );
    if (rawValue) {
      const parsed = JSON.parse(rawValue) as string[],
        countryProfileIds = normalizeCountryProfileIds(
          parsed.filter(isKnownCountryProfileId) as CountryProfileId[],
        );

      if (countryProfileIds.length) return countryProfileIds;
    }

    const legacyCountryProfileId = sessionStorage.getItem(
      SESSION_STORAGE_KEYS.countryProfileId,
    );
    if (
      legacyCountryProfileId &&
      isKnownCountryProfileId(legacyCountryProfileId)
    ) {
      return Object.freeze([legacyCountryProfileId]);
    }

    return detectBrowserCountryProfileIds();
  } catch {
    return DEFAULT_COUNTRY_PROFILE_IDS;
  }
}

export function loadPersistedDetectionMode(): DetectionMode {
  try {
    if (typeof sessionStorage === "undefined") return "selected-plus-global";

    const rawValue = sessionStorage.getItem(SESSION_STORAGE_KEYS.detectionMode);
    return rawValue === "global-only" ? "global-only" : "selected-plus-global";
  } catch {
    return "selected-plus-global";
  }
}

export function persistCountryProfileIds(
  countryProfileIds: readonly CountryProfileId[],
): void {
  try {
    if (typeof sessionStorage === "undefined") return;
    sessionStorage.setItem(
      SESSION_STORAGE_KEYS.countryProfileIds,
      JSON.stringify(normalizeCountryProfileIds(countryProfileIds)),
    );
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

export function persistGroupPreferences(
  groupPreferences: MaskGroupPreferenceMap,
): void {
  try {
    if (typeof sessionStorage === "undefined") return;
    sessionStorage.setItem(
      SESSION_STORAGE_KEYS.groupPreferences,
      JSON.stringify(groupPreferences),
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

// ─── Advanced Preferences ────────────────────────────────────────────────────

const VALID_STRATEGIES: readonly MaskingStrategy[] = [
  "random",
  "tags",
  "faker",
  "redacted",
];
const VALID_XML_TAGS: readonly XmlWrapTag[] = [
  "context",
  "document",
  "input",
  "prompt",
  "redacted-input",
  "text",
  "user-input",
];

export function loadPersistedAdvancedPreferences(): AdvancedMaskingPreferences {
  try {
    if (typeof sessionStorage === "undefined")
      return DEFAULT_ADVANCED_PREFERENCES;

    const rawValue = sessionStorage.getItem(
      SESSION_STORAGE_KEYS.advancedPreferences,
    );
    if (!rawValue) return DEFAULT_ADVANCED_PREFERENCES;

    const parsed = JSON.parse(rawValue) as Partial<AdvancedMaskingPreferences>;
    return {
      maskingStrategy:
        parsed.maskingStrategy &&
        VALID_STRATEGIES.includes(parsed.maskingStrategy)
          ? parsed.maskingStrategy
          : DEFAULT_ADVANCED_PREFERENCES.maskingStrategy,
      xmlWrapEnabled:
        typeof parsed.xmlWrapEnabled === "boolean"
          ? parsed.xmlWrapEnabled
          : DEFAULT_ADVANCED_PREFERENCES.xmlWrapEnabled,
      xmlWrapTag:
        parsed.xmlWrapTag && VALID_XML_TAGS.includes(parsed.xmlWrapTag)
          ? parsed.xmlWrapTag
          : DEFAULT_ADVANCED_PREFERENCES.xmlWrapTag,
      maskTimestamps:
        typeof parsed.maskTimestamps === "boolean"
          ? parsed.maskTimestamps
          : DEFAULT_ADVANCED_PREFERENCES.maskTimestamps,
      keywordBlocklist: Array.isArray(parsed.keywordBlocklist)
        ? Object.freeze(
            parsed.keywordBlocklist.filter(k => typeof k === "string"),
          )
        : DEFAULT_ADVANCED_PREFERENCES.keywordBlocklist,
      globalIgnoreList: Array.isArray(parsed.globalIgnoreList)
        ? Object.freeze(
            parsed.globalIgnoreList.filter(k => typeof k === "string"),
          )
        : DEFAULT_ADVANCED_PREFERENCES.globalIgnoreList,
    };
  } catch {
    return DEFAULT_ADVANCED_PREFERENCES;
  }
}

export function persistAdvancedPreferences(
  prefs: AdvancedMaskingPreferences,
): void {
  try {
    if (typeof sessionStorage === "undefined") return;
    sessionStorage.setItem(
      SESSION_STORAGE_KEYS.advancedPreferences,
      JSON.stringify(prefs),
    );
  } catch {
    // Storage is optional and must not block local masking.
  }
}
