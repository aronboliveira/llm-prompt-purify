/**
 * Barrel index for the test-matrix fixture modules.
 * Import everything from here in the matrix spec file.
 */

// ─── Brazil ─────────────────────────────────────────────────────────────────
export {
  BR_CEP_NEGATIVE,
  BR_CEP_POSITIVE,
  BR_CNH_POSITIVE,
  BR_CNPJ_NEGATIVE,
  BR_CNPJ_POSITIVE,
  BR_BOUNDARY,
  BR_CPF_NEGATIVE,
  BR_CPF_POSITIVE,
  BR_PHONE_POSITIVE,
  BR_PIS_NEGATIVE,
  BR_PIS_POSITIVE,
  BR_RG_NEGATIVE,
  BR_RG_POSITIVE,
  BR_VOTER_POSITIVE,
} from "./br.fixtures";

// ─── Latin America (Spanish-speaking) ───────────────────────────────────────
export {
  AR_CUIT_NEGATIVE,
  AR_CUIT_POSITIVE,
  CL_RUT_NEGATIVE,
  CL_RUT_POSITIVE,
  CO_CEDULA_POSITIVE,
  CO_NIT_NEGATIVE,
  CO_NIT_POSITIVE,
  LATAM_BOUNDARY,
  LATAM_DNI_POSITIVE,
  MX_CURP_NEGATIVE,
  MX_CURP_POSITIVE,
  MX_RFC_POSITIVE,
  PE_RUC_NEGATIVE,
  PE_RUC_POSITIVE,
} from "./latam.fixtures";

// ─── Europe & US ────────────────────────────────────────────────────────────
export {
  ES_DNI_NEGATIVE,
  ES_DNI_POSITIVE,
  ES_NIE_NEGATIVE,
  ES_NIE_POSITIVE,
  EU_BOUNDARY,
  PT_NIF_NEGATIVE,
  PT_NIF_POSITIVE,
  PT_NISS_POSITIVE,
  US_PHONE_POSITIVE,
  US_SSN_POSITIVE,
} from "./eu.fixtures";

// ─── Asia & Russia ──────────────────────────────────────────────────────────
export {
  ASIA_BOUNDARY,
  CN_PHONE_NEGATIVE,
  CN_PHONE_POSITIVE,
  CN_RESIDENT_ID_NEGATIVE,
  CN_RESIDENT_ID_POSITIVE,
  IN_AADHAAR_NEGATIVE,
  IN_AADHAAR_POSITIVE,
  IN_GSTIN_NEGATIVE,
  IN_GSTIN_POSITIVE,
  IN_PAN_NEGATIVE,
  IN_PAN_POSITIVE,
  RU_INN_NEGATIVE,
  RU_INN_POSITIVE,
  RU_SNILS_NEGATIVE,
  RU_SNILS_POSITIVE,
} from "./asia.fixtures";

// ─── Global (country-agnostic) ──────────────────────────────────────────────
export {
  AWS_KEY_POSITIVE,
  BEARER_TOKEN_POSITIVE,
  CREDIT_CARD_NEGATIVE,
  CREDIT_CARD_POSITIVE,
  EMAIL_NEGATIVE,
  EMAIL_POSITIVE,
  GITHUB_PAT_POSITIVE,
  GLOBAL_BOUNDARY,
  IBAN_NEGATIVE,
  IBAN_POSITIVE,
  JWT_POSITIVE,
  LABELED_ADDRESS_POSITIVE,
  LABELED_NAME_NEGATIVE,
  LABELED_NAME_POSITIVE,
  LABELED_PASSPORT_POSITIVE,
  LABELED_PHONE_POSITIVE,
  OPENAI_KEY_POSITIVE,
  SECRET_ASSIGNMENT_NEGATIVE,
  SECRET_ASSIGNMENT_POSITIVE,
  SLACK_WEBHOOK_POSITIVE,
} from "./global.fixtures";

// ─── Cross-scope ────────────────────────────────────────────────────────────
export {
  CROSS_SCOPE_GLOBAL_ONLY,
  CROSS_SCOPE_POSITIVE,
  CROSS_SCOPE_STRESS,
} from "./cross-scope.fixtures";

// ─── High Entropy (Edge Cases) ──────────────────────────────────────────────
export {
  AMBIGUOUS_SEPARATOR_BOUNDARY,
  BR_INFORMAL_VARIATIONS,
  BR_TYPO_POSITIVE,
  HIGH_ENTROPY_NEGATIVES,
  INFORMAL_LANGUAGE_POSITIVE,
  MALICIOUS_CODE_FIXTURES,
  MIXED_SEPARATOR_POSITIVE,
  UNICODE_EDGE_CASES,
  US_INFORMAL_VARIATIONS,
  US_TYPO_POSITIVE,
  WHITESPACE_CHAOS,
} from "./high-entropy.fixtures";
