/** Ported from Angular app. */
import { COUNTRY_LANGUAGE_LABELS } from "../constants/masking.constants";
import type {
  CountryLanguageFamily,
  CountryProfileDefinition,
  CountryProfileSummary,
} from "../declarations/masking.types";

export function summarizeCountrySelection(
  countryProfiles: readonly CountryProfileSummary[] | readonly CountryProfileDefinition[]
): string {
  if (!countryProfiles.length) return "No countries selected";
  if (countryProfiles.length === 1) {
    return `${countryProfiles[0].flagEmoji} ${countryProfiles[0].label}`;
  }

  const preview = countryProfiles.slice(0, 3).map(countryProfile => countryProfile.flagEmoji).join(" ");
  return `${preview} ${countryProfiles.length} selected`;
}

export function getSelectedLanguageFamilies(
  countryProfiles: readonly CountryProfileSummary[] | readonly CountryProfileDefinition[]
): readonly CountryLanguageFamily[] {
  return Object.freeze(
    Array.from(new Set(countryProfiles.map(countryProfile => countryProfile.languageFamily)))
  );
}

export function hasMixedLanguageSelection(
  countryProfiles: readonly CountryProfileSummary[] | readonly CountryProfileDefinition[]
): boolean {
  return getSelectedLanguageFamilies(countryProfiles).length > 1;
}

export function summarizeSelectedLanguages(
  countryProfiles: readonly CountryProfileSummary[] | readonly CountryProfileDefinition[]
): string {
  return getSelectedLanguageFamilies(countryProfiles)
    .map(languageFamily => COUNTRY_LANGUAGE_LABELS[languageFamily])
    .join(", ");
}
