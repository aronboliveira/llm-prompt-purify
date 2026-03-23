import type {
  AdvancedMaskingPreferences,
  CountryLanguageFamily,
  CountryProfileDefinition,
  CountryProfileId,
  DetectionMode,
  MaskGroupDefinition,
  MaskGroupId,
  MaskGroupPreferenceMap,
  MaskingStrategy,
  MatchCategory,
  SupportedLocale,
  XmlWrapTag,
} from "../declarations/masking.types";

export const MAX_MASK_RETRIES = 8;

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
    "en-IN": "EN-IN",
    "en-US": "EN-US",
    "es-ES": "ES-ES",
    "es-LatAm": "ES-LatAm",
    "pt-BR": "PT-BR",
    "pt-PT": "PT-PT",
    "ru-RU": "RU-RU",
    shared: "Shared",
    "zh-CN": "ZH-CN",
  });

export const COUNTRY_PROFILE_ORDER: readonly CountryProfileId[] = Object.freeze(
  [
    "br",
    "pt",
    "es",
    "latam-es",
    "us",
    "mx",
    "ar",
    "cl",
    "co",
    "pe",
    "cn",
    "ru",
    "in",
  ],
);

export const COUNTRY_PROFILE_DEFINITIONS: Readonly<
  Record<CountryProfileId, CountryProfileDefinition>
> = Object.freeze({
  ar: {
    description:
      "Shared global rules plus Argentina-focused identifiers such as CUIT and DNI.",
    flagEmoji: "🇦🇷",
    id: "ar",
    label: "Argentina",
    languageFamily: "spanish",
    languageLabel: "Spanish",
    localeLabel: "ES-AR",
  },
  br: {
    description:
      "Shared global rules plus Brazil-focused identifiers such as CPF, CNPJ, RG, CEP, and PIS/PASEP.",
    flagEmoji: "🇧🇷",
    id: "br",
    label: "Brazil",
    languageFamily: "portuguese",
    languageLabel: "Portuguese",
    localeLabel: "PT-BR",
  },
  cl: {
    description:
      "Shared global rules plus Chile-focused identifiers such as RUT.",
    flagEmoji: "🇨🇱",
    id: "cl",
    label: "Chile",
    languageFamily: "spanish",
    languageLabel: "Spanish",
    localeLabel: "ES-CL",
  },
  cn: {
    description:
      "Shared global rules plus China-focused identifiers such as mainland resident IDs and mobile formats.",
    flagEmoji: "🇨🇳",
    id: "cn",
    label: "China",
    languageFamily: "mandarin",
    languageLabel: "Mandarin Chinese",
    localeLabel: "ZH-CN",
  },
  co: {
    description:
      "Shared global rules plus Colombia-focused identifiers such as cédula and NIT.",
    flagEmoji: "🇨🇴",
    id: "co",
    label: "Colombia",
    languageFamily: "spanish",
    languageLabel: "Spanish",
    localeLabel: "ES-CO",
  },
  es: {
    description:
      "Shared global rules plus Spain-focused identifiers such as DNI, NIE, and CIF.",
    flagEmoji: "🇪🇸",
    id: "es",
    label: "Spain",
    languageFamily: "spanish",
    languageLabel: "Spanish",
    localeLabel: "ES-ES",
  },
  in: {
    description:
      "Shared global rules plus India-focused identifiers such as Aadhaar, PAN, and GSTIN.",
    flagEmoji: "🇮🇳",
    id: "in",
    label: "India",
    languageFamily: "indic",
    languageLabel: "English / Indic scripts",
    localeLabel: "EN-IN",
  },
  "latam-es": {
    description:
      "Shared global rules plus broad Spanish-speaking Latin America identifiers across the region.",
    flagEmoji: "🌎",
    id: "latam-es",
    label: "LatAm Spanish",
    languageFamily: "spanish",
    languageLabel: "Spanish",
    localeLabel: "ES-LatAm",
  },
  mx: {
    description:
      "Shared global rules plus Mexico-focused identifiers such as CURP and RFC.",
    flagEmoji: "🇲🇽",
    id: "mx",
    label: "Mexico",
    languageFamily: "spanish",
    languageLabel: "Spanish",
    localeLabel: "ES-MX",
  },
  pe: {
    description:
      "Shared global rules plus Peru-focused identifiers such as DNI and RUC.",
    flagEmoji: "🇵🇪",
    id: "pe",
    label: "Peru",
    languageFamily: "spanish",
    languageLabel: "Spanish",
    localeLabel: "ES-PE",
  },
  pt: {
    description:
      "Shared global rules plus Portugal-focused identifiers such as NIF and NISS.",
    flagEmoji: "🇵🇹",
    id: "pt",
    label: "Portugal",
    languageFamily: "portuguese",
    languageLabel: "Portuguese",
    localeLabel: "PT-PT",
  },
  ru: {
    description:
      "Shared global rules plus Russia-focused identifiers such as INN and SNILS.",
    flagEmoji: "🇷🇺",
    id: "ru",
    label: "Russia",
    languageFamily: "russian",
    languageLabel: "Russian",
    localeLabel: "RU-RU",
  },
  us: {
    description:
      "Shared global rules plus United States-focused identifiers such as SSN.",
    flagEmoji: "🇺🇸",
    id: "us",
    label: "United States",
    languageFamily: "english",
    languageLabel: "English",
    localeLabel: "EN-US",
  },
});

export const MASK_CHARACTER_SETS = Object.freeze({
  digits: "23456789",
  lowercase: "abcdefghijkmnopqrstuvwxyz",
  symbols: "!@#$%&*?",
  uppercase: "ABCDEFGHJKLMNPQRSTUVWXYZ",
});

export const DEFAULT_COUNTRY_PROFILE_IDS: readonly CountryProfileId[] =
  Object.freeze(["br"]);

export const COUNTRY_LANGUAGE_LABELS: Readonly<
  Record<CountryLanguageFamily, string>
> = Object.freeze({
  english: "English",
  indic: "Indic languages",
  mandarin: "Mandarin Chinese",
  portuguese: "Portuguese",
  russian: "Russian",
  spanish: "Spanish",
});

export const DETECTION_MODE_COPY: Readonly<Record<DetectionMode, string>> =
  Object.freeze({
    "global-only": "Global identifiers only",
    "selected-plus-global": "Selected countries + global rules",
  });

export const MASK_GROUP_ORDER: readonly MaskGroupId[] = Object.freeze([
  "credential",
  "identifier",
  "personal",
  "financial",
  "location",
]);

export const MASK_GROUP_DEFINITIONS: Readonly<
  Record<MaskGroupId, MaskGroupDefinition>
> = Object.freeze({
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

// ─── Masking Strategy ────────────────────────────────────────────────────────

export const MASKING_STRATEGY_LABELS: Readonly<
  Record<MaskingStrategy, string>
> = Object.freeze({
  random: "Random mask",
  tags: "Categorical tags",
  faker: "Labeled placeholders",
  redacted: "Hard redaction",
});

export const MASKING_STRATEGY_DESCRIPTIONS: Readonly<
  Record<MaskingStrategy, string>
> = Object.freeze({
  random:
    "Each character is replaced with a random character of the same class (digit → digit, letter → letter). Numeric financial and identifier values still follow mandatory compliance redaction into clearly non-real placeholders (for example ####-####).",
  tags: "Replaces values with semantic labels like <EMAIL>, <API_KEY>, or <CPF> based on the detection rule. Numeric financial and identifier values still follow mandatory compliance redaction into clearly non-real placeholders.",
  faker:
    "Uses privacy-safe placeholders like {CPF1}, {TELEFONE2}, {NOME3} that can never match real data. Emails use RFC 2606 reserved domains. Numeric financial and identifier values still follow mandatory compliance redaction into clearly non-real placeholders.",
  redacted:
    "Replaces values with solid redaction blocks (█████) for maximum visual obscurity. Numeric financial and identifier values also remain in mandatory compliance redaction mode.",
});

export const MASKING_STRATEGY_ORDER: readonly MaskingStrategy[] = Object.freeze(
  ["random", "tags", "faker", "redacted"],
);

// ─── Categorical Tag Map ─────────────────────────────────────────────────────

/**
 * Maps detection rule IDs to their categorical tag labels.
 * Falls back to MASK_CATEGORY_LABELS[category] when a rule is not listed.
 */
export const RULE_TAG_MAP: Readonly<Record<string, string>> = Object.freeze({
  /* credentials */
  "glob-api-key": "API_KEY",
  "glob-bearer": "BEARER_TOKEN",
  "glob-jwt": "JWT_TOKEN",
  "glob-private-key": "PRIVATE_KEY",
  "glob-password": "PASSWORD",
  "glob-secret": "SECRET",
  "glob-oauth": "OAUTH_TOKEN",
  "glob-aws-access-key": "AWS_KEY",
  "glob-aws-secret-key": "AWS_SECRET",
  "glob-gcp-key": "GCP_KEY",
  "glob-azure-key": "AZURE_KEY",
  "glob-firebase-key": "FIREBASE_KEY",
  "glob-stripe-key": "STRIPE_KEY",
  "glob-twilio-key": "TWILIO_KEY",
  "glob-sendgrid-key": "SENDGRID_KEY",
  "glob-slack-token": "SLACK_TOKEN",
  "glob-github-token": "GITHUB_TOKEN",
  "glob-npm-token": "NPM_TOKEN",
  "glob-database-url": "DATABASE_URL",
  "glob-connection-string": "CONNECTION_STRING",
  "glob-webhook-url": "WEBHOOK_URL",
  "glob-basic-auth": "BASIC_AUTH",
  "glob-smtp-password": "SMTP_PASSWORD",

  /* personal / contact */
  "glob-email": "EMAIL",
  "glob-phone": "PHONE",
  "glob-url": "URL",
  "glob-ip": "IP_ADDRESS",
  "glob-mac": "MAC_ADDRESS",
  "glob-uuid": "UUID",
  "glob-ssn": "SSN",

  /* financial */
  "glob-credit-card": "CREDIT_CARD",
  "labeled-card-number": "CREDIT_CARD",
  "glob-iban": "IBAN",
  "glob-swift": "SWIFT_CODE",

  /* identifiers (country-specific examples) */
  "br-cpf": "CPF",
  "cpf-labeled-loose": "CPF",
  "br-cnpj": "CNPJ",
  "br-rg": "RG",
  "br-cep": "CEP",
  "br-pis": "PIS_PASEP",
  "us-ssn": "SSN",
  "us-ein": "EIN",
  "us-drivers-license": "DRIVERS_LICENSE",
  "es-dni": "DNI",
  "es-nie": "NIE",
  "pt-nif": "NIF",
  "ar-cuit": "CUIT",
  "ar-dni": "DNI_AR",
  "cl-rut": "RUT",
  "chile-rut-labeled": "RUT",
  "co-nit": "NIT",
  "pe-ruc": "RUC",
  "mx-curp": "CURP",
  "mx-rfc": "RFC",
  "cn-resident-id": "CN_RESIDENT_ID",
  "in-aadhaar": "AADHAAR",
  "in-pan": "PAN",
  "ru-inn": "INN",
  "ru-snils": "SNILS",

  /* location */
  "glob-address": "ADDRESS",
  "glob-zip-code": "ZIP_CODE",
});

/**
 * Fallback category-level tags when a specific rule is not in RULE_TAG_MAP.
 */
export const CATEGORY_TAG_LABELS: Readonly<Record<MatchCategory, string>> =
  Object.freeze({
    credential: "CREDENTIAL",
    financial: "FINANCIAL",
    identifier: "ID",
    location: "LOCATION",
    personal: "PII",
  });

// ─── XML Wrapper Tags ────────────────────────────────────────────────────────

export const XML_WRAP_TAG_ORDER: readonly XmlWrapTag[] = Object.freeze([
  "document",
  "input",
  "user-input",
  "prompt",
  "context",
  "text",
  "redacted-input",
]);

export const XML_WRAP_TAG_LABELS: Readonly<Record<XmlWrapTag, string>> =
  Object.freeze({
    context: "<context>…</context>",
    document: "<document>…</document>",
    input: "<input>…</input>",
    prompt: "<prompt>…</prompt>",
    "redacted-input": "<redacted-input>…</redacted-input>",
    text: "<text>…</text>",
    "user-input": "<user-input>…</user-input>",
  });

// ─── Advanced Preferences Defaults ───────────────────────────────────────────

export const DEFAULT_ADVANCED_PREFERENCES: Readonly<AdvancedMaskingPreferences> =
  Object.freeze({
    maskingStrategy: "random",
    xmlWrapEnabled: false,
    xmlWrapTag: "document",
    maskTimestamps: false,
    keywordBlocklist: Object.freeze([]),
    globalIgnoreList: Object.freeze([]),
  });
