import type {
  CountryProfileDefinition,
  CountryProfileId,
  DetectionMode,
  MaskGroupDefinition,
  MaskGroupId,
  MaskGroupPreferenceMap,
  MatchCategory,
  SupportedLocale,
} from "../declarations/masking.types";

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

export const COUNTRY_PROFILE_ORDER: readonly CountryProfileId[] = Object.freeze([
  "br",
  "us",
  "mx",
  "ar",
  "cl",
  "co",
  "pe",
]);

export const COUNTRY_PROFILE_DEFINITIONS: Readonly<
  Record<CountryProfileId, CountryProfileDefinition>
> = Object.freeze({
  ar: {
    description: "Shared global rules plus Argentina-focused identifiers such as CUIT and DNI.",
    flagEmoji: "🇦🇷",
    id: "ar",
    label: "Argentina",
    localeLabel: "ES-AR",
  },
  br: {
    description:
      "Shared global rules plus Brazil-focused identifiers such as CPF, CNPJ, RG, CEP, and PIS/PASEP.",
    flagEmoji: "🇧🇷",
    id: "br",
    label: "Brazil",
    localeLabel: "PT-BR",
  },
  cl: {
    description: "Shared global rules plus Chile-focused identifiers such as RUT.",
    flagEmoji: "🇨🇱",
    id: "cl",
    label: "Chile",
    localeLabel: "ES-CL",
  },
  co: {
    description: "Shared global rules plus Colombia-focused identifiers such as cédula and NIT.",
    flagEmoji: "🇨🇴",
    id: "co",
    label: "Colombia",
    localeLabel: "ES-CO",
  },
  mx: {
    description: "Shared global rules plus Mexico-focused identifiers such as CURP and RFC.",
    flagEmoji: "🇲🇽",
    id: "mx",
    label: "Mexico",
    localeLabel: "ES-MX",
  },
  pe: {
    description: "Shared global rules plus Peru-focused identifiers such as DNI and RUC.",
    flagEmoji: "🇵🇪",
    id: "pe",
    label: "Peru",
    localeLabel: "ES-PE",
  },
  us: {
    description: "Shared global rules plus United States-focused identifiers such as SSN.",
    flagEmoji: "🇺🇸",
    id: "us",
    label: "United States",
    localeLabel: "EN-US",
  },
});

export const MASK_CHARACTER_SETS = Object.freeze({
  digits: "23456789",
  lowercase: "abcdefghijkmnopqrstuvwxyz",
  symbols: "!@#$%&*?",
  uppercase: "ABCDEFGHJKLMNPQRSTUVWXYZ",
});

export const DEFAULT_COUNTRY_PROFILE_ID: CountryProfileId = "br";

export const DETECTION_MODE_COPY: Readonly<Record<DetectionMode, string>> = Object.freeze({
  "country-plus-global": "Country + global rules",
  "global-only": "Global identifiers only",
});

export const MASK_GROUP_ORDER: readonly MaskGroupId[] = Object.freeze([
  "credential",
  "identifier",
  "personal",
  "financial",
  "location",
]);

export const MASK_GROUP_DEFINITIONS: Readonly<Record<MaskGroupId, MaskGroupDefinition>> =
  Object.freeze({
    credential: {
      alwaysOnLabel: "Always keep masked",
      description:
        "API keys, bearer tokens, passwords, and similar secrets should stay masked before you paste anything into a public LLM.",
      id: "credential",
      label: "Credentials and API keys",
      supportsAlwaysOn: true,
      toggleLabel: "Mask this group",
    },
    financial: {
      description:
        "Payment and banking strings are masked by default, but you can take them off if the prompt is already synthetic.",
      id: "financial",
      label: "Financial records",
      supportsAlwaysOn: false,
      toggleLabel: "Mask this group",
    },
    identifier: {
      description:
        "Government and tax identifiers stay protected unless you explicitly disable this group for the current prompt.",
      id: "identifier",
      label: "Personal identifiers",
      supportsAlwaysOn: false,
      toggleLabel: "Mask this group",
    },
    location: {
      description:
        "Structured address-like data is masked when it looks like a real location rather than a generic example.",
      id: "location",
      label: "Location details",
      supportsAlwaysOn: false,
      toggleLabel: "Mask this group",
    },
    personal: {
      description:
        "Emails, phone numbers, and labeled personal fields are masked locally and can be relaxed per prompt.",
      id: "personal",
      label: "Contact and personal data",
      supportsAlwaysOn: false,
      toggleLabel: "Mask this group",
    },
  });

export const DEFAULT_GROUP_PREFERENCES: MaskGroupPreferenceMap = Object.freeze({
  credential: Object.freeze({ alwaysOn: true, enabled: true }),
  financial: Object.freeze({ alwaysOn: false, enabled: true }),
  identifier: Object.freeze({ alwaysOn: false, enabled: true }),
  location: Object.freeze({ alwaysOn: false, enabled: true }),
  personal: Object.freeze({ alwaysOn: false, enabled: true }),
});
