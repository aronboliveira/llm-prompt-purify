import { DEFAULT_COUNTRY_PROFILE_IDS } from "../../masking/constants/masking.constants";
import type { CountryProfileId } from "../../masking/declarations/masking.types";
import { normalizeCountryProfileIds } from "../../masking/utils/country-scope.utils";
import { BROWSER_LOCALE_MAPPINGS } from "../constants/browser-locale.constants";

export function detectBrowserCountryProfileIds(
  browserLocales = readBrowserLocales()
): readonly CountryProfileId[] {
  const detectedCountryProfileIds = browserLocales
    .map(matchBrowserLocaleToCountryProfileId)
    .filter((countryProfileId): countryProfileId is CountryProfileId => !!countryProfileId);

  return normalizeCountryProfileIds(
    detectedCountryProfileIds.length ? [detectedCountryProfileIds[0]] : DEFAULT_COUNTRY_PROFILE_IDS
  );
}

export function matchBrowserLocaleToCountryProfileId(
  browserLocale: string
): CountryProfileId | null {
  const normalizedLocale = browserLocale.trim().toLowerCase();
  if (!normalizedLocale) return null;

  return (
    BROWSER_LOCALE_MAPPINGS.find(localeMapping =>
      localeMapping.pattern.test(normalizedLocale)
    )?.countryProfileId ?? null
  );
}

export function readBrowserLocales(): readonly string[] {
  if (typeof navigator === "undefined") return [];

  const localeCandidates = navigator.languages?.length
    ? navigator.languages
    : navigator.language
      ? [navigator.language]
      : [];

  return Object.freeze(localeCandidates.map(locale => locale.trim()).filter(Boolean));
}
