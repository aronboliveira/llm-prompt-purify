import type { MatchCategory, SupportedLocale } from "./masking.types";

export const MASK_CATEGORY_LABELS: Readonly<Record<MatchCategory, string>> =
  Object.freeze({
    credential: "Credential",
    financial: "Financial",
    identifier: "Identifier",
    location: "Location",
    personal: "Personal",
  });

export const MASK_LOCALE_LABELS: Readonly<Record<SupportedLocale, string>> =
  Object.freeze({
    "en-US": "EN-US",
    "es-LatAm": "ES-LatAm",
    "pt-BR": "PT-BR",
    shared: "Shared",
  });

export const MASK_CHARACTER_SETS = Object.freeze({
  digits: "23456789",
  lowercase: "abcdefghijkmnopqrstuvwxyz",
  symbols: "!@#$%&*?",
  uppercase: "ABCDEFGHJKLMNPQRSTUVWXYZ",
});
