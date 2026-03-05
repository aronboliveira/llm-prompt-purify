import { DEFAULT_COUNTRY_PROFILE_IDS } from "../../masking/constants/masking.constants";
import type { CountryProfileId } from "../../masking/declarations/masking.types";
import {
  isKnownCountryProfileId,
  normalizeCountryProfileIds,
} from "../../masking/utils/country-scope.utils";
import { BROWSER_LOCALE_MAPPINGS } from "../constants/browser-locale.constants";

/**
 * Detect country profiles from device locale.
 * Uses expo-localization getLocales() when available,
 * falls back to DEFAULT_COUNTRY_PROFILE_IDS.
 */
export function detectDeviceCountryProfileIds(
  deviceLocales?: readonly string[],
): readonly CountryProfileId[] {
  const locales = deviceLocales ?? readDeviceLocales();

  const detectedCountryProfileIds = locales
    .map(matchLocaleToCountryProfileId)
    .filter(
      (countryProfileId): countryProfileId is CountryProfileId =>
        !!countryProfileId,
    );

  return normalizeCountryProfileIds(
    detectedCountryProfileIds.length
      ? [detectedCountryProfileIds[0]]
      : DEFAULT_COUNTRY_PROFILE_IDS,
  );
}

export function matchLocaleToCountryProfileId(
  locale: string,
): CountryProfileId | null {
  const normalizedLocale = locale.trim().toLowerCase();
  if (!normalizedLocale) return null;

  return (
    BROWSER_LOCALE_MAPPINGS.find(localeMapping =>
      localeMapping.pattern.test(normalizedLocale),
    )?.countryProfileId ?? null
  );
}

/**
 * Read device locales from expo-localization.
 * Uses a lazy import to avoid breaking in test environments.
 */
export function readDeviceLocales(): readonly string[] {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { getLocales } = require("expo-localization");
    const locales = getLocales();

    if (!Array.isArray(locales) || !locales.length) return [];

    return Object.freeze(
      locales
        .map((l: { languageTag?: string }) => l.languageTag ?? "")
        .filter(Boolean),
    );
  } catch {
    return [];
  }
}
