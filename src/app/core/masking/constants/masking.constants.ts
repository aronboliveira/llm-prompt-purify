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
import type {
  WritingSystemFamily,
  WritingSystemSubtype,
} from "./polyglot-pools.constants";
import { deepFreeze } from "@shared/utils/deep-freeze.utils";

/**
 * Maps each country language family to the writing-system subtypes that are
 * native to it. These subtypes are auto-excluded from polyglot masks so the
 * output never contains characters from the user's own script.
 */
export const LOCALE_NATIVE_WRITING_SYSTEMS: Readonly<
  Record<CountryLanguageFamily, readonly WritingSystemSubtype[]>
> = deepFreeze({
  english: ["latin"],
  indic: ["devanagari", "bengali", "gujarati", "kannada", "tamil", "telugu"],
  mandarin: [],
  portuguese: ["latin"],
  russian: ["cyrillic"],
  spanish: ["latin"],
});

/**
 * Maps each language family to its native writing-system family.
 * Used for cross-category weighting: alphabetic locales should see
 * syllabaries/abugidas most of the time, and vice versa.
 */
export const LOCALE_NATIVE_FAMILY: Readonly<
  Partial<Record<CountryLanguageFamily, WritingSystemFamily>>
> = Object.freeze({
  english: "alphabetic",
  indic: "abugida",
  mandarin: undefined,
  portuguese: "alphabetic",
  russian: "alphabetic",
  spanish: "alphabetic",
});

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
> = deepFreeze({
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
> = deepFreeze({
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

export const DEFAULT_GROUP_PREFERENCES: MaskGroupPreferenceMap = deepFreeze({
  credential: { alwaysOn: true, enabled: true },
  financial: { alwaysOn: false, enabled: true },
  identifier: { alwaysOn: false, enabled: true },
  location: { alwaysOn: false, enabled: true },
  personal: { alwaysOn: false, enabled: true },
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
  "openai-style-key": "API_KEY",
  "bearer-token": "BEARER_TOKEN",
  "jwt-token": "JWT_TOKEN",
  "keyed-secret-assignment": "SECRET",
  "secret-assignment": "PASSWORD",
  "aws-access-key": "AWS_KEY",
  "aws-secret-key": "AWS_SECRET",
  "azure-account-key": "AZURE_KEY",
  "firebase-api-key": "FIREBASE_KEY",
  "sendgrid-api-key": "SENDGRID_KEY",
  "mailgun-api-key": "MAILGUN_KEY",
  "slack-webhook": "SLACK_TOKEN",
  "github-pat": "GITHUB_TOKEN",
  "json-secret-suffixed": "SECRET",

  /* personal / contact */
  "email-address": "EMAIL",
  "labeled-phone": "PHONE",
  "br-phone": "PHONE",
  "phone-json": "PHONE",
  "phone-json-suffixed": "PHONE",
  "generic-url": "URL",
  "ipv4-address": "IP_ADDRESS",
  "ipv4-quoted": "IP_ADDRESS",
  "ipv6-address": "IP_ADDRESS",
  "labeled-ip-address": "IP_ADDRESS",
  "us-ssn": "SSN",
  "us-ssn-json": "SSN",
  "us-ssn-quoted": "SSN",
  "us-ssn-json-suffixed": "SSN",

  /* financial */
  "credit-card": "CREDIT_CARD",
  "credit-card-json": "CREDIT_CARD",
  "credit-card-quoted": "CREDIT_CARD",
  "labeled-card-number": "CREDIT_CARD",
  iban: "IBAN",
  "iban-json": "IBAN",
  "iban-json-suffixed": "IBAN",

  /* Brazilian identifiers */
  cpf: "CPF",
  "cpf-labeled-loose": "CPF",
  "cpf-json": "CPF",
  "cpf-quoted": "CPF",
  "cpf-json-suffixed": "CPF",
  "cpf-global-labeled": "CPF",
  cnpj: "CNPJ",
  "cnpj-labeled-loose": "CNPJ",
  "cnpj-json": "CNPJ",
  "cnpj-json-suffixed": "CNPJ",
  "cnpj-global-labeled": "CNPJ",
  "rg-labeled": "RG",
  "rg-json": "RG",
  "rg-json-suffixed": "RG",
  "cep-labeled": "CEP",
  "cep-json": "CEP",
  "cep-json-suffixed": "CEP",
  "cnh-labeled": "CNH",
  "pis-pasep-labeled": "PIS_PASEP",
  "pis-json": "PIS_PASEP",
  "pis-json-suffixed": "PIS_PASEP",
  "titulo-eleitor-labeled": "TITULO_ELEITOR",
  "titulo-eleitor-json": "TITULO_ELEITOR",
  "titulo-eleitor-json-suffixed": "TITULO_ELEITOR",

  /* US identifiers */
  "us-ein": "EIN",
  "us-ein-json": "EIN",

  /* Spanish identifiers */
  "es-dni-labeled": "DNI",
  "es-dni-json": "DNI",
  "es-dni-quoted": "DNI",
  "es-nie-labeled": "NIE",
  "es-nie-json": "NIE",
  "es-nie-quoted": "NIE",

  /* Portuguese identifiers */
  "pt-nif-labeled": "NIF",
  "pt-niss-labeled": "NISS",

  /* LatAm identifiers */
  cuit: "CUIT",
  "cuit-labeled-loose": "CUIT",
  "cuit-global-labeled": "CUIT",
  "chile-rut": "RUT",
  "chile-rut-labeled": "RUT",
  "chile-rut-json": "RUT",
  "rut-global-labeled": "RUT",
  "rg-global-labeled": "RG",
  "cep-global-labeled": "CEP",
  "ein-global-labeled": "EIN",
  "ruc-global-labeled": "RUC",
  nit: "NIT",
  "cedula-labeled": "CEDULA",
  "dni-labeled": "DNI",
  "ruc-labeled": "RUC",
  "ruc-json": "RUC",
  curp: "CURP",
  rfc: "RFC",

  /* Chinese identifiers */
  "cn-resident-id": "CN_RESIDENT_ID",
  "cn-resident-id-labeled": "CN_RESIDENT_ID",
  "cn-resident-id-json": "CN_RESIDENT_ID",
  "cn-resident-id-quoted": "CN_RESIDENT_ID",

  /* Indian identifiers */
  "in-aadhaar-labeled": "AADHAAR",
  "in-pan-labeled": "PAN",
  "in-gstin-labeled": "GSTIN",

  /* Russian identifiers */
  "ru-inn-labeled": "INN",
  "ru-snils-labeled": "SNILS",

  /* location */
  "labeled-address": "ADDRESS",
  "labeled-name": "NAME",
  "labeled-passport": "PASSPORT",

  /* other */
  "incident-id-labeled": "INCIDENT_ID",
  "incident-id-format": "INCIDENT_ID",
  "unix-filesystem-path": "PATH",
  "windows-filesystem-path": "PATH",
  "date-iso": "DATE",
  "date-dmy": "DATE",
  "timestamp-iso8601": "TIMESTAMP",
  "timestamp-datetime": "TIMESTAMP",

  /* git hashes */
  "git-hash-full": "GIT_HASH",
  "git-hash-short": "GIT_HASH",
  "git-hash-labeled": "GIT_HASH",

  /* network ports */
  "network-port-labeled": "PORT",
  "network-port-host": "PORT",

  /* person names */
  "name-standalone-en": "NAME",
  "name-standalone-pt-br": "NAME",
  "name-standalone-pt-pt": "NAME",
  "name-standalone-es": "NAME",
  "name-standalone-zh": "NAME",
  "name-standalone-ru": "NAME",
  "name-standalone-in": "NAME",
  "name-contextual": "NAME",
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
  deepFreeze({
    maskingStrategy: "random",
    xmlWrapEnabled: false,
    xmlWrapTag: "document",
    maskTimestamps: true,
    maskGitHashes: false,
    maskNetworkPorts: false,
    maskNames: false,
    nameStrategy: "alias",
    keywordBlocklist: [],
    globalIgnoreList: [],
    polyglotMaskEnabled: true,
    polyglotEnabledFamilies: ["abugida", "alphabetic", "syllabary", "symbol"],
    polyglotExcludedSubtypes: [],
  });
