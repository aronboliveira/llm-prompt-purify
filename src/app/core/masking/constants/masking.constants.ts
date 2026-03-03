import type {
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

export const MASK_CHARACTER_SETS = Object.freeze({
  digits: "23456789",
  lowercase: "abcdefghijkmnopqrstuvwxyz",
  symbols: "!@#$%&*?",
  uppercase: "ABCDEFGHJKLMNPQRSTUVWXYZ",
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
