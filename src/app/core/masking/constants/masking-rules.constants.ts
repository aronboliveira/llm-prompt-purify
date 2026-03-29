import type { DetectionRule } from "../declarations/masking.types";
import { deepFreeze } from "@shared/utils/deep-freeze.utils";
import {
  BR_CEP_LABEL_FLAGS,
  BR_CNH_LABEL_FLAGS,
  BR_PIS_PASEP_LABEL_FLAGS,
  BR_RG_LABEL_FLAGS,
  BR_VOTER_LABEL_FLAGS,
  CN_RESIDENT_ID_LABEL_FLAGS,
  ES_DNI_LABEL_FLAGS,
  ES_NIE_LABEL_FLAGS,
  IN_AADHAAR_LABEL_FLAGS,
  IN_GSTIN_LABEL_FLAGS,
  IN_PAN_LABEL_FLAGS,
  INCIDENT_ID_LABEL_FLAGS,
  LATAM_CEDULA_LABEL_FLAGS,
  LATAM_DNI_LABEL_FLAGS,
  LATAM_RUC_LABEL_FLAGS,
  PT_NIF_LABEL_FLAGS,
  PT_NISS_LABEL_FLAGS,
  RU_INN_LABEL_FLAGS,
  RU_SNILS_LABEL_FLAGS,
  SECRET_ASSIGNMENT_FLAGS,
  SHARED_ADDRESS_LABEL_FLAGS,
  SHARED_IP_LABEL_FLAGS,
  SHARED_NAME_LABEL_FLAGS,
  SHARED_PASSPORT_LABEL_FLAGS,
  SHARED_PHONE_LABEL_FLAGS,
  US_EIN_LABEL_FLAGS,
} from "./mask-flag-dictionaries.constants";
import {
  isValidArgentineCuit,
  isLikelyBrazilianStateId,
  isValidChineseResidentId,
  isValidColombianNit,
  isLikelyCreditCard,
  looksLikeCnpjStructural,
  looksLikeCpfStructural,
  looksLikeCardNumberSequence,
  looksLikePeruvianRucStructural,
  looksLikeUsaSsnStructural,
  isLikelyIban,
  isLikelyPhoneNumber,
  isValidChileanRut,
  isValidCnpj,
  isValidCpf,
  isValidIndianAadhaar,
  isValidPeruvianRuc,
  isValidPortugueseNif,
  isValidRussianInn,
  isValidRussianSnils,
  isValidSpanishDni,
  isValidSpanishNie,
  looksLikeBrazilianVoterId,
  looksLikeLatamNationalId,
  looksLikeLatamTaxId,
  looksLikeStructuredAddress,
  looksLikeStructuredName,
  looksSecretLike,
  detectObfuscationTags,
} from "../utils/mask-validation.utils";

// ─── Anti-bypass separator character classes ────────────────────────────────
// Used in contextual fallback patterns to handle separator-stuffing attacks.
// Covers: dot variants (. · 。 ．), dash variants (- – — _ =), slash (/ \ ⁄ ⧸),
// and optional surrounding whitespace. {1,3} allows repeated separators.
// Reserved for future `new RegExp()` constructed patterns:
const _DOT_LIKE = String.raw`[.·。．]`,
  _DASH_LIKE = String.raw`[-\u2013\u2014_=~*#]`,
  _SLASH_LIKE = String.raw`[/\\\u2044\u29F8]`;
void [_DOT_LIKE, _DASH_LIKE, _SLASH_LIKE];
import { createDelimitedLabelValuePattern } from "../utils/mask-pattern.utils";

export const MASKING_RULES: readonly DetectionRule[] = deepFreeze([
  {
    category: "personal",
    coverage: "global",
    confidence: "high",
    id: "email-address",
    label: "Email address",
    locale: "shared",
    patternFactory: () => /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/giu,
    priority: 120,
  },
  {
    category: "credential",
    coverage: "global",
    confidence: "high",
    id: "jwt-token",
    label: "JWT token",
    locale: "shared",
    patternFactory: () =>
      /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{2,}\.[A-Za-z0-9_-]{2,}\b/gu,
    priority: 130,
  },
  {
    category: "credential",
    coverage: "global",
    confidence: "high",
    id: "openai-style-key",
    label: "API key",
    locale: "shared",
    patternFactory: () =>
      /\b(?:sk-(?:proj-|live-|test-)?[A-Za-z0-9_-]{20,}|sk_(?:live|test)_[A-Za-z0-9_-]{20,})\b/gu,
    priority: 130,
  },
  {
    category: "identifier",
    coverage: "global",
    confidence: "high",
    id: "twilio-account-sid",
    label: "Twilio account SID",
    locale: "shared",
    patternFactory: () => /\bAC[a-f0-9]{32}\b/giu,
    priority: 124,
  },
  {
    category: "credential",
    coverage: "global",
    confidence: "high",
    id: "sendgrid-api-key",
    label: "SendGrid API key",
    locale: "shared",
    patternFactory: () => /\bSG\.[A-Za-z0-9_-]{20,}\b/g,
    priority: 124,
  },
  {
    category: "credential",
    coverage: "global",
    confidence: "high",
    id: "mailgun-api-key",
    label: "Mailgun API key",
    locale: "shared",
    patternFactory: () => /\bkey-[A-Za-z0-9]{20,}\b/g,
    priority: 124,
  },
  {
    category: "credential",
    coverage: "global",
    confidence: "high",
    id: "firebase-api-key",
    label: "Firebase API key",
    locale: "shared",
    patternFactory: () => /\bAIza[0-9A-Za-z_-]{30,}\b/g,
    priority: 124,
  },
  {
    category: "credential",
    coverage: "global",
    confidence: "high",
    id: "azure-account-key",
    label: "Azure account key",
    locale: "shared",
    patternFactory: () => /\bAccountKey\s*=\s*([A-Za-z0-9+/=]{8,})\b/giu,
    priority: 124,
    valueGroup: 1,
  },
  {
    category: "credential",
    coverage: "global",
    confidence: "high",
    id: "aws-access-key",
    label: "AWS access key",
    locale: "shared",
    patternFactory: () => /\b(?:AKIA|ASIA)[A-Z0-9]{16}\b/g,
    priority: 125,
  },
  {
    category: "credential",
    coverage: "global",
    confidence: "high",
    id: "aws-secret-key",
    label: "AWS secret access key",
    locale: "shared",
    patternFactory: () =>
      /\baws[_-]?secret[_-]?access[_-]?key\b\s*[:=]\s*["']?([A-Za-z0-9/+=]{40})["']?/giu,
    priority: 126,
    valueGroup: 1,
  },
  {
    category: "credential",
    coverage: "global",
    confidence: "high",
    id: "github-pat",
    label: "GitHub token",
    locale: "shared",
    patternFactory: () => /\bgh[pousr]_[A-Za-z0-9]{20,}\b/gu,
    priority: 126,
  },
  {
    category: "credential",
    coverage: "global",
    confidence: "high",
    id: "slack-webhook",
    label: "Slack webhook",
    locale: "shared",
    patternFactory: () =>
      /https:\/\/hooks\.slack\.com\/services\/T[A-Z0-9]{8,}\/B[A-Z0-9]{8,}\/[A-Za-z0-9]{20,}/gu,
    priority: 126,
  },
  {
    category: "credential",
    coverage: "global",
    confidence: "high",
    id: "keyed-secret-assignment",
    label: "Credential key assignment",
    locale: "shared",
    patternFactory: () =>
      createDelimitedLabelValuePattern(
        SECRET_ASSIGNMENT_FLAGS,
        String.raw`[^\s"';]{8,}`,
        { delimiterPattern: String.raw`=`, quoteWrapped: true },
      ),
    priority: 119,
    validator: looksSecretLike,
    valueGroup: 1,
  },
  {
    category: "credential",
    coverage: "global",
    confidence: "high",
    id: "secret-assignment",
    label: "Credential assignment",
    locale: "shared",
    patternFactory: () =>
      createDelimitedLabelValuePattern(
        SECRET_ASSIGNMENT_FLAGS,
        String.raw`[^\s"';]{8,}`,
        { delimiterPattern: String.raw`[:=]`, quoteWrapped: true },
      ),
    priority: 118,
    validator: looksSecretLike,
    valueGroup: 1,
  },
  {
    category: "credential",
    coverage: "global",
    confidence: "high",
    id: "bearer-token",
    label: "Bearer token",
    locale: "shared",
    patternFactory: () => /\bBearer\s+([A-Za-z0-9\-._~+/]+=*)/gu,
    priority: 117,
    validator: looksSecretLike,
    valueGroup: 1,
  },
  {
    category: "financial",
    coverage: "global",
    confidence: "high",
    id: "credit-card",
    label: "Credit card number",
    locale: "shared",
    patternFactory: () => /\b(?:\d[ -]?){13,19}\b/g,
    priority: 114,
    validator: isLikelyCreditCard,
  },
  {
    category: "financial",
    coverage: "global",
    confidence: "high",
    id: "labeled-card-number",
    label: "Labeled card number",
    locale: "shared",
    patternFactory: () =>
      /\b(?:card(?:\s+number)?|credit\s+card|debit\s+card|payment(?:\s+card)?|n[uú]mero(?:\s+de)?\s+tarjeta|tarjeta(?:\s+de\s+cr[eé]dito)?|n[uú]mero(?:\s+do)?\s+cart[aã]o|cart[aã]o(?:\s+de\s+cr[eé]dito)?)\b[^\n\r\d]{0,80}((?:\d[ -]?){13,19})\b/giu,
    priority: 113,
    validator: looksLikeCardNumberSequence,
    valueGroup: 1,
  },
  {
    category: "financial",
    coverage: "global",
    confidence: "high",
    id: "iban",
    label: "IBAN",
    locale: "shared",
    patternFactory: () => /\b[A-Z]{2}\d{2}[A-Z0-9]{11,30}\b/gu,
    priority: 108,
    validator: isLikelyIban,
  },
  {
    category: "identifier",
    coverage: "global",
    confidence: "high",
    id: "us-ssn",
    label: "US Social Security number",
    locale: "en-US",
    patternFactory: () =>
      /\b\d{3}[\-\u2013\u2014]{1,3}\d{2}[\-\u2013\u2014]{1,3}\d{4}\b/g,
    priority: 116,
    tagFactory: detectObfuscationTags,
    validator: isValidUsaSsn,
  },
  {
    category: "identifier",
    countryProfileIds: ["us"],
    coverage: "country",
    confidence: "medium",
    id: "us-ssn-labeled-loose",
    label: "US SSN (labeled)",
    locale: "en-US",
    patternFactory: () =>
      /\b(?:ssn|social\s+security(?:\s+(?:number|num|no\.?|#))?|ss\s*#)\b[^\n\r\d]{0,16}(\d{3}[\-\u2013\u2014\s]{0,3}\d{2}[\-\u2013\u2014\s]{0,3}\d{4})\b/giu,
    priority: 107,
    tagFactory: detectObfuscationTags,
    validator: looksLikeUsaSsnStructural,
    valueGroup: 1,
  },
  {
    category: "personal",
    countryProfileIds: ["us"],
    coverage: "country",
    confidence: "medium",
    id: "us-phone",
    label: "US phone number",
    locale: "en-US",
    patternFactory: () =>
      /(?:\+1[\s.-]?)?(?:\([2-9]\d{2}\)|[2-9]\d{2})[\s.-]?\d{3}[\s.-]?\d{4}\b/g,
    priority: 86,
    validator: isLikelyPhoneNumber,
  },
  {
    category: "identifier",
    coverage: "global",
    confidence: "high",
    id: "cpf",
    label: "CPF",
    locale: "pt-BR",
    patternFactory: () => /\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/g,
    priority: 122,
    validator: isValidCpf,
  },
  {
    category: "identifier",
    countryProfileIds: ["br"],
    coverage: "country",
    confidence: "medium",
    id: "cpf-labeled-loose",
    label: "CPF (labeled)",
    locale: "pt-BR",
    patternFactory: () =>
      /\b(?:cpf|meu\s+cpf|cpf\s+do\s+cliente|n[uú]mero\s+do\s+cpf|cadastro\s+cpf|cpf\s+pessoal|cpf\s+fiscal|identifica[çc][ãa]o\s+cpf|contribuinte\s+cpf|cpf\s+registrado|cpf\s+do\s+titular|n[uú]mero\s+de\s+cpf)\b[^\n\r\d]{0,16}(\d{3}[.·。．]{0,3}\d{3}[.·。．]{0,3}\d{3}[\-\u2013\u2014_=~]{0,3}\d{2})\b/giu,
    priority: 109,
    tagFactory: detectObfuscationTags,
    validator: looksLikeCpfStructural,
    valueGroup: 1,
  },
  {
    category: "identifier",
    coverage: "global",
    confidence: "high",
    id: "cnpj",
    label: "CNPJ",
    locale: "pt-BR",
    patternFactory: () => /\b\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}\b/g,
    priority: 122,
    validator: isValidCnpj,
  },
  {
    category: "identifier",
    countryProfileIds: ["br"],
    coverage: "country",
    confidence: "medium",
    id: "cnpj-labeled-loose",
    label: "CNPJ (labeled)",
    locale: "pt-BR",
    patternFactory: () =>
      /\b(?:cnpj|cnpj\s+da\s+empresa|registro\s+cnpj|empresa\s+cnpj|cnpj\s+matriz|cnpj\s+mei|filial\s+cnpj|contribuinte\s+cnpj|cnpj\s+filial)\b[^\n\r\d]{0,16}(\d{2}[.·。．]{0,3}\d{3}[.·。．]{0,3}\d{3}[/\\\u2044\u29F8]{0,3}\d{4}[\-\u2013\u2014_=~]{0,3}\d{2})\b/giu,
    priority: 109,
    tagFactory: detectObfuscationTags,
    validator: looksLikeCnpjStructural,
    valueGroup: 1,
  },
  {
    category: "personal",
    countryProfileIds: ["br"],
    coverage: "country",
    confidence: "medium",
    id: "br-phone",
    label: "Brazil phone number",
    locale: "pt-BR",
    patternFactory: () =>
      /(?:\+55\s{0,3})?(?:\(?\d{2}\)?\s{0,3})?9?\d{4}[\s-]{0,3}\d{4}\b/g,
    priority: 84,
    validator: isLikelyPhoneNumber,
  },
  {
    category: "location",
    countryProfileIds: ["br"],
    coverage: "country",
    confidence: "high",
    id: "cep-labeled",
    label: "CEP",
    locale: "pt-BR",
    patternFactory: () =>
      createDelimitedLabelValuePattern(
        BR_CEP_LABEL_FLAGS,
        String.raw`\d{5}-?\d{3}`,
      ),
    priority: 109,
    valueGroup: 1,
  },
  {
    category: "identifier",
    countryProfileIds: ["br"],
    coverage: "country",
    confidence: "high",
    id: "cnh-labeled",
    label: "CNH",
    locale: "pt-BR",
    patternFactory: () =>
      createDelimitedLabelValuePattern(BR_CNH_LABEL_FLAGS, String.raw`\d{11}`),
    priority: 110,
    valueGroup: 1,
  },
  {
    category: "identifier",
    countryProfileIds: ["br"],
    coverage: "country",
    confidence: "high",
    id: "pis-pasep-labeled",
    label: "PIS/PASEP",
    locale: "pt-BR",
    patternFactory: () =>
      createDelimitedLabelValuePattern(
        BR_PIS_PASEP_LABEL_FLAGS,
        String.raw`\d{3}\.?\d{5}\.?\d{2}-?\d|\d{11}`,
      ),
    priority: 111,
    valueGroup: 1,
  },
  {
    category: "identifier",
    countryProfileIds: ["br"],
    coverage: "country",
    confidence: "high",
    id: "rg-labeled",
    label: "RG",
    locale: "pt-BR",
    patternFactory: () =>
      createDelimitedLabelValuePattern(
        BR_RG_LABEL_FLAGS,
        String.raw`[0-9]{1,2}\.?\d{3}\.?\d{3}-?[\dXx]`,
      ),
    priority: 111,
    validator: isLikelyBrazilianStateId,
    valueGroup: 1,
  },
  {
    category: "identifier",
    countryProfileIds: ["br"],
    coverage: "country",
    confidence: "medium",
    id: "titulo-eleitor-labeled",
    label: "Titulo de eleitor",
    locale: "pt-BR",
    patternFactory: () =>
      createDelimitedLabelValuePattern(
        BR_VOTER_LABEL_FLAGS,
        String.raw`(?:\d[\s.-]*){12}`,
      ),
    priority: 100,
    validator: looksLikeBrazilianVoterId,
    valueGroup: 1,
  },
  {
    category: "identifier",
    countryProfileIds: ["cl", "latam-es"],
    coverage: "country",
    confidence: "high",
    id: "chile-rut",
    label: "Chilean RUT",
    locale: "es-LatAm",
    patternFactory: () => /\b\d{1,2}\.?\d{3}\.?\d{3}-?[\dKk]\b/gu,
    priority: 121,
    validator: isValidChileanRut,
  },
  {
    category: "identifier",
    countryProfileIds: ["cl", "latam-es"],
    coverage: "country",
    confidence: "medium",
    id: "chile-rut-labeled",
    label: "Chilean RUT (labeled)",
    locale: "es-LatAm",
    patternFactory: () =>
      /\b(?:rut|rut\s+chileno|rut\s+empresa|n[uú]mero\s+rut|identificaci[oó]n\s+rut)\b[^\n\r\d]{0,12}(\d{1,2}\.?\d{3}\.?\d{3}-?[\dKk])\b/giu,
    priority: 109,
    validator: isValidChileanRut,
    valueGroup: 1,
  },
  {
    category: "identifier",
    countryProfileIds: ["mx", "latam-es"],
    coverage: "country",
    confidence: "high",
    id: "curp",
    label: "CURP",
    locale: "es-LatAm",
    patternFactory: () => /\b[A-Z]{4}\d{6}[HM][A-Z]{5}[A-Z0-9]\d\b/g,
    priority: 120,
  },
  {
    category: "identifier",
    countryProfileIds: ["mx", "latam-es"],
    coverage: "country",
    confidence: "high",
    id: "rfc",
    label: "RFC",
    locale: "es-LatAm",
    patternFactory: () => /\b[A-Z&Ñ]{3,4}\d{6}[A-Z0-9]{3}\b/giu,
    priority: 114,
  },
  {
    category: "identifier",
    countryProfileIds: ["ar", "latam-es"],
    coverage: "country",
    confidence: "high",
    id: "cuit",
    label: "CUIT",
    locale: "es-LatAm",
    patternFactory: () => /\b\d{2}-\d{8}-\d\b/g,
    priority: 116,
    validator: isValidArgentineCuit,
  },
  {
    category: "identifier",
    countryProfileIds: ["ar", "latam-es"],
    coverage: "country",
    confidence: "medium",
    id: "cuit-labeled-loose",
    label: "CUIT (labeled)",
    locale: "es-LatAm",
    patternFactory: () =>
      /\b(?:cuit|mi\s+cuit|cuit\s+empresa|empresa\s+cuit|cuit\s+personal|n[uú]mero\s+cuit)\b[^\n\r\d]{0,12}(\d{2}-?\d{8}-?\d)\b/giu,
    priority: 109,
    validator: isValidArgentineCuit,
    valueGroup: 1,
  },
  {
    category: "identifier",
    countryProfileIds: ["co", "latam-es"],
    coverage: "country",
    confidence: "high",
    id: "nit",
    label: "NIT",
    locale: "es-LatAm",
    patternFactory: () => /\b\d{3}\.?\d{3}\.?\d{3}-?\d\b/g,
    priority: 112,
    validator: isValidColombianNit,
  },
  {
    category: "identifier",
    countryProfileIds: ["co", "latam-es"],
    coverage: "country",
    confidence: "high",
    id: "cedula-labeled",
    label: "Cedula",
    locale: "es-LatAm",
    patternFactory: () =>
      createDelimitedLabelValuePattern(
        LATAM_CEDULA_LABEL_FLAGS,
        String.raw`\d{6,12}`,
      ),
    priority: 115,
    validator: looksLikeLatamNationalId,
    valueGroup: 1,
  },
  {
    category: "identifier",
    countryProfileIds: ["ar", "latam-es", "pe"],
    coverage: "country",
    confidence: "high",
    id: "dni-labeled",
    label: "DNI",
    locale: "es-LatAm",
    patternFactory: () =>
      createDelimitedLabelValuePattern(
        LATAM_DNI_LABEL_FLAGS,
        String.raw`\d{7,8}`,
      ),
    priority: 110,
    validator: looksLikeLatamNationalId,
    valueGroup: 1,
  },
  {
    category: "identifier",
    countryProfileIds: ["latam-es", "pe"],
    coverage: "country",
    confidence: "high",
    id: "ruc-labeled",
    label: "RUC",
    locale: "es-LatAm",
    patternFactory: () =>
      createDelimitedLabelValuePattern(
        LATAM_RUC_LABEL_FLAGS,
        String.raw`\d{11,13}`,
      ),
    priority: 110,
    validator: isValidPeruvianRuc,
    valueGroup: 1,
  },
  {
    category: "identifier",
    countryProfileIds: ["latam-es", "pe"],
    coverage: "country",
    confidence: "medium",
    id: "ruc-labeled-loose",
    label: "RUC (labeled, structural)",
    locale: "es-LatAm",
    patternFactory: () =>
      createDelimitedLabelValuePattern(
        LATAM_RUC_LABEL_FLAGS,
        String.raw`\d{11,13}`,
      ),
    priority: 104,
    tagFactory: detectObfuscationTags,
    validator: looksLikePeruvianRucStructural,
    valueGroup: 1,
  },
  {
    category: "identifier",
    countryProfileIds: ["pt"],
    coverage: "country",
    confidence: "high",
    id: "pt-nif-labeled",
    label: "NIF",
    locale: "pt-PT",
    patternFactory: () =>
      createDelimitedLabelValuePattern(PT_NIF_LABEL_FLAGS, String.raw`\d{9}`),
    priority: 112,
    validator: isValidPortugueseNif,
    valueGroup: 1,
  },
  {
    category: "identifier",
    countryProfileIds: ["pt"],
    coverage: "country",
    confidence: "medium",
    id: "pt-niss-labeled",
    label: "NISS",
    locale: "pt-PT",
    patternFactory: () =>
      createDelimitedLabelValuePattern(PT_NISS_LABEL_FLAGS, String.raw`\d{11}`),
    priority: 102,
    validator: looksLikeLatamTaxId,
    valueGroup: 1,
  },
  {
    category: "identifier",
    countryProfileIds: ["es"],
    coverage: "country",
    confidence: "high",
    id: "es-dni-labeled",
    label: "Spanish DNI",
    locale: "es-ES",
    patternFactory: () =>
      createDelimitedLabelValuePattern(
        ES_DNI_LABEL_FLAGS,
        String.raw`\d{8}[A-Z]`,
      ),
    priority: 114,
    validator: isValidSpanishDni,
    valueGroup: 1,
  },
  {
    category: "identifier",
    countryProfileIds: ["es", "latam-es"],
    coverage: "country",
    confidence: "high",
    id: "es-nie-labeled",
    label: "Spanish NIE",
    locale: "es-ES",
    patternFactory: () =>
      createDelimitedLabelValuePattern(
        ES_NIE_LABEL_FLAGS,
        String.raw`[XYZ]\d{7}[A-Z]`,
      ),
    priority: 113,
    validator: isValidSpanishNie,
    valueGroup: 1,
  },
  {
    category: "identifier",
    countryProfileIds: ["cn"],
    coverage: "country",
    confidence: "high",
    id: "cn-resident-id-labeled",
    label: "Chinese resident ID",
    locale: "zh-CN",
    patternFactory: () =>
      createDelimitedLabelValuePattern(
        CN_RESIDENT_ID_LABEL_FLAGS,
        String.raw`\d{17}[\dXx]`,
      ),
    priority: 114,
    validator: isValidChineseResidentId,
    valueGroup: 1,
  },
  {
    category: "personal",
    countryProfileIds: ["cn"],
    coverage: "country",
    confidence: "medium",
    id: "cn-phone",
    label: "China phone number",
    locale: "zh-CN",
    patternFactory: () => /(?:\+?86[\s-]?)?1[3-9]\d[\s-]?\d{4}[\s-]?\d{4}\b/g,
    priority: 99,
    validator: isLikelyPhoneNumber,
  },
  {
    category: "identifier",
    countryProfileIds: ["ru"],
    coverage: "country",
    confidence: "high",
    id: "ru-inn-labeled",
    label: "Russian INN",
    locale: "ru-RU",
    patternFactory: () =>
      createDelimitedLabelValuePattern(
        RU_INN_LABEL_FLAGS,
        String.raw`\d{12}|\d{10}`,
      ),
    priority: 112,
    validator: isValidRussianInn,
    valueGroup: 1,
  },
  {
    category: "identifier",
    countryProfileIds: ["ru"],
    coverage: "country",
    confidence: "high",
    id: "ru-snils-labeled",
    label: "Russian SNILS",
    locale: "ru-RU",
    patternFactory: () =>
      createDelimitedLabelValuePattern(
        RU_SNILS_LABEL_FLAGS,
        String.raw`\d{3}-?\d{3}-?\d{3}\s?\d{2}`,
      ),
    priority: 112,
    validator: isValidRussianSnils,
    valueGroup: 1,
  },
  {
    category: "identifier",
    countryProfileIds: ["in"],
    coverage: "country",
    confidence: "high",
    id: "in-aadhaar-labeled",
    label: "Aadhaar",
    locale: "en-IN",
    patternFactory: () =>
      createDelimitedLabelValuePattern(
        IN_AADHAAR_LABEL_FLAGS,
        String.raw`\d{4}\s?\d{4}\s?\d{4}`,
      ),
    priority: 112,
    validator: isValidIndianAadhaar,
    valueGroup: 1,
  },
  {
    category: "identifier",
    countryProfileIds: ["in"],
    coverage: "country",
    confidence: "high",
    id: "in-pan-labeled",
    label: "PAN",
    locale: "en-IN",
    patternFactory: () =>
      createDelimitedLabelValuePattern(
        IN_PAN_LABEL_FLAGS,
        String.raw`[A-Z]{5}\d{4}[A-Z]`,
      ),
    priority: 111,
    valueGroup: 1,
  },
  {
    category: "identifier",
    countryProfileIds: ["in"],
    coverage: "country",
    confidence: "high",
    id: "in-gstin-labeled",
    label: "GSTIN",
    locale: "en-IN",
    patternFactory: () =>
      createDelimitedLabelValuePattern(
        IN_GSTIN_LABEL_FLAGS,
        String.raw`\d{2}[A-Z]{5}\d{4}[A-Z][A-Z0-9][Zz][A-Z0-9]`,
      ),
    priority: 110,
    valueGroup: 1,
  },
  {
    category: "personal",
    coverage: "global",
    confidence: "medium",
    id: "labeled-phone",
    label: "Labeled phone number",
    locale: "shared",
    patternFactory: () =>
      createDelimitedLabelValuePattern(
        SHARED_PHONE_LABEL_FLAGS,
        String.raw`\+?[0-9()\s.-]{8,20}\d`,
      ),
    priority: 96,
    validator: isLikelyPhoneNumber,
    valueGroup: 1,
  },
  {
    category: "personal",
    coverage: "global",
    confidence: "medium",
    id: "labeled-name",
    label: "Labeled full name",
    locale: "shared",
    patternFactory: () =>
      createDelimitedLabelValuePattern(
        SHARED_NAME_LABEL_FLAGS,
        String.raw`[^\n\r,;]{3,80}`,
      ),
    priority: 44,
    validator: looksLikeStructuredName,
    valueGroup: 1,
  },
  {
    category: "location",
    coverage: "global",
    confidence: "medium",
    id: "labeled-address",
    label: "Labeled address",
    locale: "shared",
    patternFactory: () =>
      createDelimitedLabelValuePattern(
        SHARED_ADDRESS_LABEL_FLAGS,
        String.raw`[^\n\r]{6,120}`,
      ),
    priority: 42,
    validator: looksLikeStructuredAddress,
    valueGroup: 1,
  },
  {
    category: "identifier",
    coverage: "global",
    confidence: "medium",
    id: "labeled-passport",
    label: "Passport number",
    locale: "shared",
    patternFactory: () =>
      createDelimitedLabelValuePattern(
        SHARED_PASSPORT_LABEL_FLAGS,
        String.raw`[A-Z0-9<]{6,12}`,
      ),
    priority: 92,
    valueGroup: 1,
  },

  // ─── JSON/YAML/TOML Context-Aware Rules ──────────────────────────────────────
  // These rules target sensitive values in structured data formats where word
  // boundaries (\b) fail because quotes/colons are adjacent to digits.

  {
    category: "financial",
    coverage: "global",
    confidence: "high",
    id: "credit-card-json",
    label: "Credit card in JSON/structured data",
    locale: "shared",
    patternFactory: () =>
      /(?:["'](?:credit[-_]?card|card[-_]?(?:num(?:ber)?)?|cc[-_]?(?:num(?:ber)?)?|payment[-_]?card|n[uú]mero[-_]?(?:do[-_]?)?cart[aã]o|tarjeta)["']\s*[:=]\s*["'])(\d{13,19})(?=["'])/giu,
    priority: 115,
    validator: looksLikeCardNumberSequence,
    valueGroup: 1,
  },
  {
    category: "financial",
    coverage: "global",
    confidence: "high",
    id: "credit-card-quoted",
    label: "Quoted credit card number",
    locale: "shared",
    patternFactory: () => /(?<=["'])(\d{13,19})(?=["'])/g,
    priority: 112,
    validator: isLikelyCreditCard,
    valueGroup: 1,
  },
  {
    category: "identifier",
    countryProfileIds: ["us"],
    coverage: "global",
    confidence: "high",
    id: "us-ssn-json",
    label: "US SSN in JSON/structured data",
    locale: "en-US",
    patternFactory: () =>
      /(?:["'](?:ssn|social[-_]?(?:security)?[-_]?(?:num(?:ber)?)?)[-_]?\d*["']\s*[:=]\s*["'])(\d{3}[-\s]?\d{2}[-\s]?\d{4})(?=["'])/giu,
    priority: 113,
    validator: isValidUsaSsn,
    valueGroup: 1,
  },
  {
    category: "identifier",
    countryProfileIds: ["us"],
    coverage: "global",
    confidence: "high",
    id: "us-ssn-quoted",
    label: "Quoted US SSN",
    locale: "en-US",
    patternFactory: () => /(?<=["'])(\d{3}-\d{2}-\d{4})(?=["'])/g,
    priority: 110,
    validator: isValidUsaSsn,
    valueGroup: 1,
  },
  {
    category: "identifier",
    countryProfileIds: ["br"],
    coverage: "country",
    confidence: "high",
    id: "cpf-json",
    label: "Brazilian CPF in JSON/structured data",
    locale: "pt-BR",
    patternFactory: () =>
      /(?:["']cpf["']\s*[:=]\s*["'])(\d{3}[.\s]?\d{3}[.\s]?\d{3}[-.\s]?\d{2})(?=["'])/giu,
    priority: 114,
    validator: isValidCpf,
    valueGroup: 1,
  },
  {
    category: "identifier",
    countryProfileIds: ["br"],
    coverage: "country",
    confidence: "high",
    id: "cpf-quoted",
    label: "Quoted Brazilian CPF",
    locale: "pt-BR",
    patternFactory: () => /(?<=["'])(\d{3}\.\d{3}\.\d{3}-\d{2})(?=["'])/g,
    priority: 111,
    validator: isValidCpf,
    valueGroup: 1,
  },
  {
    category: "identifier",
    countryProfileIds: ["br"],
    coverage: "country",
    confidence: "high",
    id: "cnpj-json",
    label: "Brazilian CNPJ in JSON/structured data",
    locale: "pt-BR",
    patternFactory: () =>
      /(?:["']cnpj["']\s*[:=]\s*["'])(\d{2}[.\s]?\d{3}[.\s]?\d{3}[/\s]?\d{4}[-.\s]?\d{2})(?=["'])/giu,
    priority: 114,
    validator: isValidCnpj,
    valueGroup: 1,
  },
  {
    category: "identifier",
    countryProfileIds: ["cn"],
    coverage: "country",
    confidence: "high",
    id: "cn-resident-id-json",
    label: "Chinese Resident ID in JSON/structured data",
    locale: "zh-CN",
    patternFactory: () =>
      /(?:["'](?:身份证号?|id[-_]?(?:card)?[-_]?(?:num(?:ber)?)?|居民身份证|sfz)["']\s*[:=]\s*["'])(\d{17}[\dXx])(?=["'])/giu,
    priority: 114,
    validator: isValidChineseResidentId,
    valueGroup: 1,
  },
  {
    category: "identifier",
    countryProfileIds: ["cn"],
    coverage: "country",
    confidence: "high",
    id: "cn-resident-id-quoted",
    label: "Quoted Chinese Resident ID",
    locale: "zh-CN",
    patternFactory: () => /(?<=["'])(\d{17}[\dXx])(?=["'])/g,
    priority: 111,
    validator: isValidChineseResidentId,
    valueGroup: 1,
  },
  {
    category: "identifier",
    coverage: "global",
    confidence: "high",
    id: "cn-resident-id",
    label: "Chinese resident ID (standalone)",
    locale: "zh-CN",
    patternFactory: () => /\b(\d{17}[\dXx])\b/gu,
    priority: 108,
    validator: isValidChineseResidentId,
    valueGroup: 1,
  },

  // ─── Numeric Separator-Aware Rules ───────────────────────────────────────────
  // IP addresses, dates, and other values with dots, dashes, or underscores

  {
    category: "identifier",
    coverage: "global",
    confidence: "medium",
    id: "ipv4-address",
    label: "IPv4 address",
    locale: "shared",
    patternFactory: () =>
      /\b(?:(?:25[0-5]|2[0-4]\d|1?\d{1,2})\.){3}(?:25[0-5]|2[0-4]\d|1?\d{1,2})\b/g,
    priority: 85,
    validator: isValidIpv4,
  },
  {
    category: "identifier",
    coverage: "global",
    confidence: "medium",
    id: "ipv4-quoted",
    label: "Quoted IPv4 address",
    locale: "shared",
    patternFactory: () =>
      /(?<=["'])((?:(?:25[0-5]|2[0-4]\d|1?\d{1,2})\.){3}(?:25[0-5]|2[0-4]\d|1?\d{1,2}))(?=["'])/g,
    priority: 86,
    validator: isValidIpv4,
    valueGroup: 1,
  },
  {
    category: "identifier",
    coverage: "global",
    confidence: "medium",
    id: "date-iso",
    label: "ISO date format",
    locale: "shared",
    patternFactory: () =>
      /\b(19|20)\d{2}[-/.](0[1-9]|1[0-2])[-/.](0[1-9]|[12]\d|3[01])\b/g,
    priority: 75,
    validator: isValidIsoDate,
  },
  {
    category: "identifier",
    coverage: "global",
    confidence: "medium",
    id: "date-dmy",
    label: "Date DD/MM/YYYY or DD-MM-YYYY",
    locale: "shared",
    patternFactory: () =>
      /\b(0[1-9]|[12]\d|3[01])[-/.](0[1-9]|1[0-2])[-/.](19|20)\d{2}\b/g,
    priority: 74,
    validator: isValidDmyDate,
  },

  // ─── US EIN (Employer Identification Number) ─────────────────────────────────

  {
    category: "identifier",
    countryProfileIds: ["us"],
    coverage: "country",
    confidence: "medium",
    id: "us-ein",
    label: "US EIN",
    locale: "en-US",
    patternFactory: () =>
      createDelimitedLabelValuePattern(
        US_EIN_LABEL_FLAGS,
        String.raw`\d{2}-\d{7}`,
        { delimiterPattern: String.raw`[:=]`, quoteWrapped: true },
      ),
    priority: 90,
    valueGroup: 1,
  },
  {
    category: "identifier",
    countryProfileIds: ["us"],
    coverage: "country",
    confidence: "high",
    id: "us-ein-json",
    label: "US EIN in JSON/structured data",
    locale: "en-US",
    patternFactory: () =>
      /(?:["'](?:ein|employer[-_]?(?:id(?:entification)?)?[-_]?(?:num(?:ber)?)?|fein|federal[-_]?tax[-_]?id|tax[-_]?id(?:entification)?[-_]?(?:num(?:ber)?)?)[-_]?\d*["']\s*[:=]\s*["'])(\d{2}-\d{7})(?=["'])/giu,
    priority: 113,
    valueGroup: 1,
  },

  // ─── Spanish DNI / NIE in JSON ───────────────────────────────────────────────

  {
    category: "identifier",
    countryProfileIds: ["es", "latam-es"],
    coverage: "country",
    confidence: "high",
    id: "es-dni-json",
    label: "Spanish DNI in JSON/structured data",
    locale: "es-ES",
    patternFactory: () =>
      /(?:["'](?:dni|documento[-_]?(?:nacional[-_]?)?(?:de[-_]?)?identidad|cedula[-_]?(?:de[-_]?)?identidad)[-_]?\d*["']\s*[:=]\s*["'])(\d{8}[A-Z])(?=["'])/giu,
    priority: 114,
    validator: isValidSpanishDni,
    valueGroup: 1,
  },
  {
    category: "identifier",
    countryProfileIds: ["es", "latam-es"],
    coverage: "country",
    confidence: "high",
    id: "es-nie-json",
    label: "Spanish NIE in JSON/structured data",
    locale: "es-ES",
    patternFactory: () =>
      /(?:["'](?:nie|n[uú]mero[-_]?(?:de[-_]?)?identidad[-_]?(?:de[-_]?)?extranjero|identidad[-_]?(?:de[-_]?)?extranjero)[-_]?\d*["']\s*[:=]\s*["'])([XYZ]\d{7}[A-Z])(?=["'])/giu,
    priority: 114,
    validator: isValidSpanishNie,
    valueGroup: 1,
  },
  {
    category: "identifier",
    countryProfileIds: ["es", "latam-es"],
    coverage: "country",
    confidence: "high",
    id: "es-dni-quoted",
    label: "Quoted Spanish DNI",
    locale: "es-ES",
    patternFactory: () => /(?<=["'])(\d{8}[A-Z])(?=["'])/g,
    priority: 110,
    validator: isValidSpanishDni,
    valueGroup: 1,
  },
  {
    category: "identifier",
    countryProfileIds: ["es", "latam-es"],
    coverage: "country",
    confidence: "high",
    id: "es-nie-quoted",
    label: "Quoted Spanish NIE",
    locale: "es-ES",
    patternFactory: () => /(?<=["'])([XYZ]\d{7}[A-Z])(?=["'])/g,
    priority: 110,
    validator: isValidSpanishNie,
    valueGroup: 1,
  },

  // ─── Peruvian RUC in JSON ────────────────────────────────────────────────────

  {
    category: "identifier",
    countryProfileIds: ["es", "latam-es"],
    coverage: "country",
    confidence: "high",
    id: "ruc-json",
    label: "Peruvian RUC in JSON/structured data",
    locale: "es-LatAm",
    patternFactory: () =>
      /(?:["'](?:ruc|ruc[-_]?pe|registro[-_]?(?:unico[-_]?)?contribuyente)[-_]?\d*["']\s*[:=]\s*["'])(\d{11})(?=["'])/giu,
    priority: 114,
    validator: isValidPeruvianRuc,
    valueGroup: 1,
  },

  // ─── Chilean RUT in JSON ─────────────────────────────────────────────────────

  {
    category: "identifier",
    countryProfileIds: ["cl", "latam-es"],
    coverage: "country",
    confidence: "high",
    id: "chile-rut-json",
    label: "Chilean RUT in JSON/structured data",
    locale: "es-LatAm",
    patternFactory: () =>
      /(?:["'](?:rut|rut[-_]?cl|rol[-_]?(?:unico[-_]?)?tributario)[-_]?\d*["']\s*[:=]\s*["'])(\d{1,2}\.?\d{3}\.?\d{3}-[\dkK])(?=["'])/giu,
    priority: 114,
    validator: isValidChileanRut,
    valueGroup: 1,
  },

  // ─── SSN JSON with numbered suffixes ─────────────────────────────────────────

  {
    category: "identifier",
    countryProfileIds: ["us"],
    coverage: "country",
    confidence: "high",
    id: "us-ssn-json-suffixed",
    label: "US SSN in JSON with numbered key suffix",
    locale: "en-US",
    patternFactory: () =>
      /(?:["'](?:ssn|social[-_]?(?:security)?[-_]?(?:num(?:ber)?)?)[-_]?\d+["']\s*[:=]\s*["'])(\d{3}[-\s]?\d{2}[-\s]?\d{4})(?=["'])/giu,
    priority: 114,
    validator: isValidUsaSsn,
    valueGroup: 1,
  },

  // ─── CPF / CNPJ JSON with numbered suffixes ─────────────────────────────────

  {
    category: "identifier",
    countryProfileIds: ["br"],
    coverage: "country",
    confidence: "high",
    id: "cpf-json-suffixed",
    label: "Brazilian CPF in JSON with numbered key suffix",
    locale: "pt-BR",
    patternFactory: () =>
      /(?:["']cpf[-_]?\d+["']\s*[:=]\s*["'])(\d{3}[.\s]?\d{3}[.\s]?\d{3}[-.\s]?\d{2})(?=["'])/giu,
    priority: 114,
    validator: isValidCpf,
    valueGroup: 1,
  },
  {
    category: "identifier",
    countryProfileIds: ["br"],
    coverage: "country",
    confidence: "high",
    id: "cnpj-json-suffixed",
    label: "Brazilian CNPJ in JSON with numbered key suffix",
    locale: "pt-BR",
    patternFactory: () =>
      /(?:["']cnpj[-_]?\d+["']\s*[:=]\s*["'])(\d{2}[.\s]?\d{3}[.\s]?\d{3}[/\s]?\d{4}[-.\s]?\d{2})(?=["'])/giu,
    priority: 114,
    validator: isValidCnpj,
    valueGroup: 1,
  },

  // ─── PIS/PASEP JSON ──────────────────────────────────────────────────────────

  {
    category: "identifier",
    countryProfileIds: ["br"],
    coverage: "country",
    confidence: "high",
    id: "pis-json",
    label: "Brazilian PIS/PASEP in JSON/structured data",
    locale: "pt-BR",
    patternFactory: () =>
      /(?:["'](?:pis|pasep|nis)["']\s*[:=]\s*["'])(\d{3}\.?\d{5}\.?\d{2}-?\d)(?=["'])/giu,
    priority: 114,
    valueGroup: 1,
  },
  {
    category: "identifier",
    countryProfileIds: ["br"],
    coverage: "country",
    confidence: "high",
    id: "pis-json-suffixed",
    label: "Brazilian PIS/PASEP in JSON with numbered key suffix",
    locale: "pt-BR",
    patternFactory: () =>
      /(?:["'](?:pis|pasep|nis)[-_]?\d+["']\s*[:=]\s*["'])(\d{3}\.?\d{5}\.?\d{2}-?\d)(?=["'])/giu,
    priority: 114,
    valueGroup: 1,
  },

  // ─── RG JSON ─────────────────────────────────────────────────────────────────

  {
    category: "identifier",
    countryProfileIds: ["br"],
    coverage: "country",
    confidence: "high",
    id: "rg-json",
    label: "Brazilian RG in JSON/structured data",
    locale: "pt-BR",
    patternFactory: () =>
      /(?:["']rg["']\s*[:=]\s*["'])([0-9]{1,2}\.?\d{3}\.?\d{3}-?[\dXx])(?=["'])/giu,
    priority: 114,
    validator: isLikelyBrazilianStateId,
    valueGroup: 1,
  },
  {
    category: "identifier",
    countryProfileIds: ["br"],
    coverage: "country",
    confidence: "high",
    id: "rg-json-suffixed",
    label: "Brazilian RG in JSON with numbered key suffix",
    locale: "pt-BR",
    patternFactory: () =>
      /(?:["']rg[-_]?\d+["']\s*[:=]\s*["'])([0-9]{1,2}\.?\d{3}\.?\d{3}-?[\dXx])(?=["'])/giu,
    priority: 114,
    validator: isLikelyBrazilianStateId,
    valueGroup: 1,
  },

  // ─── CEP JSON ────────────────────────────────────────────────────────────────

  {
    category: "location",
    countryProfileIds: ["br"],
    coverage: "country",
    confidence: "high",
    id: "cep-json",
    label: "Brazilian CEP in JSON/structured data",
    locale: "pt-BR",
    patternFactory: () =>
      /(?:["']cep["']\s*[:=]\s*["'])(\d{5}-?\d{3})(?=["'])/giu,
    priority: 114,
    valueGroup: 1,
  },
  {
    category: "location",
    countryProfileIds: ["br"],
    coverage: "country",
    confidence: "high",
    id: "cep-json-suffixed",
    label: "Brazilian CEP in JSON with numbered key suffix",
    locale: "pt-BR",
    patternFactory: () =>
      /(?:["']cep[-_]?\d+["']\s*[:=]\s*["'])(\d{5}-?\d{3})(?=["'])/giu,
    priority: 114,
    valueGroup: 1,
  },

  // ─── Título de Eleitor JSON ──────────────────────────────────────────────────

  {
    category: "identifier",
    countryProfileIds: ["br"],
    coverage: "country",
    confidence: "high",
    id: "titulo-eleitor-json",
    label: "Brazilian Título de Eleitor in JSON/structured data",
    locale: "pt-BR",
    patternFactory: () =>
      /(?:["']titulo[-_]?(?:de[-_]?)?eleitor(?:al)?["']\s*[:=]\s*["'])((?:\d[\s.-]*){12})(?=["'])/giu,
    priority: 114,
    validator: looksLikeBrazilianVoterId,
    valueGroup: 1,
  },
  {
    category: "identifier",
    countryProfileIds: ["br"],
    coverage: "country",
    confidence: "high",
    id: "titulo-eleitor-json-suffixed",
    label: "Brazilian Título de Eleitor in JSON with numbered key suffix",
    locale: "pt-BR",
    patternFactory: () =>
      /(?:["']titulo[-_]?(?:de[-_]?)?eleitor(?:al)?[-_]?\d+["']\s*[:=]\s*["'])((?:\d[\s.-]*){12})(?=["'])/giu,
    priority: 114,
    validator: looksLikeBrazilianVoterId,
    valueGroup: 1,
  },

  // ─── IBAN JSON ───────────────────────────────────────────────────────────────

  {
    category: "financial",
    coverage: "global",
    confidence: "high",
    id: "iban-json",
    label: "IBAN in JSON/structured data",
    locale: "shared",
    patternFactory: () =>
      /(?:["']iban["']\s*[:=]\s*["'])([A-Z]{2}\d{2}[A-Z0-9]{11,30})(?=["'])/giu,
    priority: 114,
    valueGroup: 1,
  },
  {
    category: "financial",
    coverage: "global",
    confidence: "high",
    id: "iban-json-suffixed",
    label: "IBAN in JSON with numbered key suffix",
    locale: "shared",
    patternFactory: () =>
      /(?:["']iban[-_]?\d+["']\s*[:=]\s*["'])([A-Z]{2}\d{2}[A-Z0-9]{11,30})(?=["'])/giu,
    priority: 114,
    valueGroup: 1,
  },

  // ─── Phone JSON ──────────────────────────────────────────────────────────────

  {
    category: "personal",
    coverage: "global",
    confidence: "high",
    id: "phone-json",
    label: "Phone number in JSON/structured data",
    locale: "shared",
    patternFactory: () =>
      /(?:["'](?:telefone|phone|cel(?:ular)?|mobile|fone|tel)["']\s*[:=]\s*["'])((?:\+?\d{1,3}\s?)?\(?\d{2,3}\)?\s?\d{4,5}[\s-]?\d{4})(?=["'])/giu,
    priority: 114,
    valueGroup: 1,
  },
  {
    category: "personal",
    coverage: "global",
    confidence: "high",
    id: "phone-json-suffixed",
    label: "Phone number in JSON with numbered key suffix",
    locale: "shared",
    patternFactory: () =>
      /(?:["'](?:telefone|phone|cel(?:ular)?|mobile|fone|tel)[-_]?\d+["']\s*[:=]\s*["'])((?:\+?\d{1,3}\s?)?\(?\d{2,3}\)?\s?\d{4,5}[\s-]?\d{4})(?=["'])/giu,
    priority: 114,
    valueGroup: 1,
  },

  // ─── Generic URL Detection ───────────────────────────────────────────────────

  {
    category: "location",
    coverage: "global",
    confidence: "medium",
    id: "generic-url",
    label: "URL with potential sensitive data",
    locale: "shared",
    patternFactory: () => /\bhttps?:\/\/[^\s"'<>]{10,200}/giu,
    priority: 80,
    validator: looksLikeUrlWithSensitiveData,
  },

  // ─── Labeled IPv4 Address ────────────────────────────────────────────────────

  {
    category: "identifier",
    coverage: "global",
    confidence: "medium",
    id: "labeled-ip-address",
    label: "Labeled IP address",
    locale: "shared",
    patternFactory: () =>
      createDelimitedLabelValuePattern(
        SHARED_IP_LABEL_FLAGS,
        String.raw`(?:(?:25[0-5]|2[0-4]\d|1?\d{1,2})\.){3}(?:25[0-5]|2[0-4]\d|1?\d{1,2})`,
        { delimiterPattern: String.raw`[:=]`, quoteWrapped: true },
      ),
    priority: 88,
    validator: isValidIpv4,
    valueGroup: 1,
  },

  // ─── JSON-context Secrets with suffixed keys ─────────────────────────────────
  // Catches "password_admin": "value", "contraseña_1": "value" etc.

  {
    category: "credential",
    coverage: "global",
    confidence: "high",
    id: "json-secret-suffixed",
    label: "JSON secret with suffixed key",
    locale: "shared",
    patternFactory: () =>
      /(?:["'](?:password|contraseña|contrasena|senha|secret|api[-_]?key|token|private[-_]?key|access[-_]?key|master[-_]?password|admin[-_]?password|root[-_]?password|db[-_]?password|database[-_]?password|encryption[-_]?key|client[-_]?secret|auth[-_]?token|clave|chave[-_]?secreta|chave[-_]?api)[-_\w]*["']\s*[:=]\s*["'])([^\s"']{8,})(?=["'])/giu,
    priority: 116,
    validator: looksSecretLike,
    valueGroup: 1,
  },

  // ─── IPv6 Address ────────────────────────────────────────────────────────────

  {
    category: "identifier",
    coverage: "global",
    confidence: "medium",
    id: "ipv6-address",
    label: "IPv6 address",
    locale: "shared",
    patternFactory: () =>
      /\b(?:[0-9a-fA-F]{1,4}:){2,7}[0-9a-fA-F]{1,4}\b|\b(?:[0-9a-fA-F]{1,4}:)*::(?:[0-9a-fA-F]{1,4}:)*[0-9a-fA-F]{0,4}\b/g,
    priority: 84,
    validator: isValidIpv6,
  },

  // ─── Filesystem Paths ────────────────────────────────────────────────────────

  {
    category: "identifier",
    coverage: "global",
    confidence: "medium",
    id: "unix-filesystem-path",
    label: "Unix filesystem path",
    locale: "shared",
    patternFactory: () => /(?:\/[\w.-]+){3,}/g,
    priority: 60,
    validator: looksLikeSensitivePath,
  },
  {
    category: "identifier",
    coverage: "global",
    confidence: "medium",
    id: "windows-filesystem-path",
    label: "Windows filesystem path",
    locale: "shared",
    patternFactory: () => /[A-Z]:\\(?:[\w.-]+\\){2,}[\w.-]*/gi,
    priority: 60,
  },
  // ─── Incident ID Patterns ───────────────────────────────────────────────────
  {
    category: "identifier",
    coverage: "global",
    confidence: "medium",
    id: "incident-id-labeled",
    label: "Incident ID",
    locale: "shared",
    patternFactory: () =>
      createDelimitedLabelValuePattern(
        INCIDENT_ID_LABEL_FLAGS,
        String.raw`(?:INC|INCIDENT|CASE|TICKET|REQ|SR|CHG|PRB)?[#-]?\d{4,12}`,
      ),
    priority: 95,
    valueGroup: 1,
  },
  {
    category: "identifier",
    coverage: "global",
    confidence: "medium",
    id: "incident-id-format",
    label: "Incident ID format",
    locale: "shared",
    patternFactory: () =>
      /\b(?:INC|INCIDENT|CASE|TICKET|REQ|SR|CHG|PRB)[#-]?\d{4,12}\b/giu,
    priority: 90,
  },
  // ─── Timestamp Patterns (conditional on advancedPrefs.maskTimestamps) ───────
  {
    category: "identifier",
    coverage: "global",
    confidence: "medium",
    id: "timestamp-iso8601",
    label: "ISO 8601 timestamp",
    locale: "shared",
    patternFactory: () =>
      /\b\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2}(?:\.\d{1,6})?(?:Z|[+-]\d{2}:?\d{2})?\b/g,
    priority: 50,
    validator: isValidIsoDate,
  },
  {
    category: "identifier",
    coverage: "global",
    confidence: "medium",
    id: "timestamp-datetime",
    label: "Date/time value",
    locale: "shared",
    patternFactory: () =>
      /\b\d{1,2}[/.-]\d{1,2}[/.-]\d{2,4}\s+\d{1,2}:\d{2}(?::\d{2})?\b/g,
    priority: 45,
  },

  // ─── Global labeled variants (keyword-gated, zero FP risk) ──────────────────

  {
    category: "identifier",
    coverage: "global",
    confidence: "high",
    id: "cpf-global-labeled",
    label: "CPF (labeled, global)",
    locale: "shared",
    patternFactory: () =>
      /\b(?:cpf|cadastro\s+de?\s+pessoa)\b[^\n\r\d]{0,12}(\d{3}\.?\d{3}\.?\d{3}-?\d{2})\b/giu,
    priority: 109,
    validator: isValidCpf,
    valueGroup: 1,
  },
  {
    category: "identifier",
    coverage: "global",
    confidence: "high",
    id: "cnpj-global-labeled",
    label: "CNPJ (labeled, global)",
    locale: "shared",
    patternFactory: () =>
      /\b(?:cnpj|cadastro\s+nacional)\b[^\n\r\d]{0,12}(\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2})\b/giu,
    priority: 109,
    validator: isValidCnpj,
    valueGroup: 1,
  },
  {
    category: "identifier",
    coverage: "global",
    confidence: "high",
    id: "cuit-global-labeled",
    label: "Argentine CUIT (labeled, global)",
    locale: "shared",
    patternFactory: () =>
      /\b(?:cuit|cuil|clave\s+[uú]nica)\b[^\n\r\d]{0,12}(\d{2}-?\d{8}-?\d)\b/giu,
    priority: 109,
    validator: isValidArgentineCuit,
    valueGroup: 1,
  },
  {
    category: "identifier",
    coverage: "global",
    confidence: "medium",
    id: "rut-global-labeled",
    label: "Chilean RUT (labeled, global)",
    locale: "shared",
    patternFactory: () =>
      /\b(?:rut|n[uú]mero\s+rut)\b[^\n\r\d]{0,12}(\d{1,2}\.?\d{3}\.?\d{3}-?[\dKk])\b/giu,
    priority: 109,
    validator: isValidChileanRut,
    valueGroup: 1,
  },

  // ─── Global labeled rules (keyword-gated, any locale) ──────────────────────

  {
    category: "identifier",
    coverage: "global",
    confidence: "high",
    id: "rg-global-labeled",
    label: "Brazilian RG (labeled, global)",
    locale: "shared",
    patternFactory: () =>
      /\b(?:rg|registro\s+geral|carteira\s+de\s+identidade)\b[^\n\r\d]{0,12}([0-9]{1,2}\.?\d{3}\.?\d{3}-?[\dXx])\b/giu,
    priority: 109,
    validator: isLikelyBrazilianStateId,
    valueGroup: 1,
  },
  {
    category: "location",
    coverage: "global",
    confidence: "high",
    id: "cep-global-labeled",
    label: "Brazilian CEP (labeled, global)",
    locale: "shared",
    patternFactory: () =>
      /\b(?:cep|c[oó]digo\s+postal)\b[^\n\r\d]{0,12}(\d{5}-?\d{3})\b/giu,
    priority: 109,
    valueGroup: 1,
  },
  {
    category: "identifier",
    coverage: "global",
    confidence: "high",
    id: "ein-global-labeled",
    label: "US EIN (labeled, global)",
    locale: "shared",
    patternFactory: () =>
      /\b(?:ein|employer\s+id(?:entification)?(?:\s+number)?|fein|federal\s+tax\s+id)\b[^\n\r\d]{0,12}(\d{2}-\d{7})\b/giu,
    priority: 109,
    valueGroup: 1,
  },
  {
    category: "identifier",
    coverage: "global",
    confidence: "high",
    id: "ruc-global-labeled",
    label: "Peruvian RUC (labeled, global)",
    locale: "shared",
    patternFactory: () =>
      /\b(?:ruc|registro\s+[uú]nico\s+(?:de\s+)?contribuyentes?)\b[^\n\r\d]{0,12}(\d{11,13})\b/giu,
    priority: 109,
    validator: isValidPeruvianRuc,
    valueGroup: 1,
  },
]);

/**
 * Validator for IPv4 addresses
 */
function isValidIpv4(value: string): boolean {
  const parts = value.split(".");
  if (parts.length !== 4) return false;
  return parts.every(part => {
    const num = parseInt(part, 10);
    return !isNaN(num) && num >= 0 && num <= 255;
  });
}

/**
 * Validator for ISO date format (YYYY-MM-DD)
 */
function isValidIsoDate(value: string): boolean {
  const normalized = value.replace(/[/.]/g, "-");
  const date = new Date(normalized);
  return !isNaN(date.getTime());
}

/**
 * Validator for DMY date format (DD/MM/YYYY or DD-MM-YYYY)
 */
function isValidDmyDate(value: string): boolean {
  const parts = value.split(/[-/.]/);
  if (parts.length !== 3) return false;
  const [day, month, year] = parts.map(p => parseInt(p, 10));
  if (month < 1 || month > 12) return false;
  if (day < 1 || day > 31) return false;
  if (year < 1900 || year > 2100) return false;
  return true;
}

/**
 * Validator for US SSN
 * NOTE: area >= 900 was historically rejected (pre-2011 geographic allocation).
 * Since June 2011 the SSA uses full randomization; 9xx area codes are valid.
 * A PII masker must mask on appearance, not policy — removed the 9xx gate.
 */
function isValidUsaSsn(value: string): boolean {
  const digits = value.replace(/\D/g, "");
  if (digits.length !== 9) return false;
  const area = parseInt(digits.slice(0, 3), 10);
  if (area === 0 || area === 666) return false;
  const group = parseInt(digits.slice(3, 5), 10);
  if (group === 0) return false;
  const serial = parseInt(digits.slice(5), 10);
  if (serial === 0) return false;
  return true;
}

/**
 * Validator for generic URLs — only flag URLs containing sensitive data indicators.
 */
const URL_SENSITIVE_PARAMS =
  /[?&](token|key|secret|password|api[_-]?key|access[_-]?token|auth|session[_-]?id|credential)=/i;
const URL_BASIC_AUTH = /:\/\/[^@/\s]+:[^@/\s]+@/;

function looksLikeUrlWithSensitiveData(value: string): boolean {
  return URL_SENSITIVE_PARAMS.test(value) || URL_BASIC_AUTH.test(value);
}

/**
 * Validator for Unix filesystem paths — exclude known-safe prefixes.
 */
const SAFE_PATH_PREFIXES =
  /^\/(?:usr|var|etc|opt|bin|sbin|lib|proc|sys|dev|tmp|run|boot|node_modules|\.npm)\//;

function looksLikeSensitivePath(value: string): boolean {
  return !SAFE_PATH_PREFIXES.test(value);
}

/**
 * Validator for IPv6 addresses — reject known non-IPv6 patterns.
 */
function isValidIpv6(value: string): boolean {
  const groups = value.split(":");
  if (groups.length < 3 || groups.length > 8) return false;
  return groups.every(g => g.length <= 4);
}
