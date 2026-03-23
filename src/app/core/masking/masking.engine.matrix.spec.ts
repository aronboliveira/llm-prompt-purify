/**
 * Masking-engine matrix spec.
 * Runs every fixture in the matrix/ modules through the engine assertion helpers.
 * Organised by region → rule → positive / negative / boundary.
 */
import { MaskingEngine } from "./masking.engine";
import {
  assertBoundaryFixture,
  assertNegativeFixture,
  assertPositiveFixture,
} from "@testing/utils/masking-engine-assertions.utils";
import {
  // ── BR ──
  BR_CPF_POSITIVE,
  BR_CPF_NEGATIVE,
  BR_CNPJ_POSITIVE,
  BR_CNPJ_NEGATIVE,
  BR_PHONE_POSITIVE,
  BR_CEP_POSITIVE,
  BR_CEP_NEGATIVE,
  BR_CNH_POSITIVE,
  BR_PIS_POSITIVE,
  BR_PIS_NEGATIVE,
  BR_RG_POSITIVE,
  BR_RG_NEGATIVE,
  BR_VOTER_POSITIVE,
  BR_BOUNDARY,
  // ── LatAm ──
  CL_RUT_POSITIVE,
  CL_RUT_NEGATIVE,
  MX_CURP_POSITIVE,
  MX_CURP_NEGATIVE,
  MX_RFC_POSITIVE,
  AR_CUIT_POSITIVE,
  AR_CUIT_NEGATIVE,
  CO_NIT_POSITIVE,
  CO_NIT_NEGATIVE,
  CO_CEDULA_POSITIVE,
  LATAM_DNI_POSITIVE,
  PE_RUC_POSITIVE,
  PE_RUC_NEGATIVE,
  LATAM_BOUNDARY,
  // ── EU / US ──
  ES_DNI_POSITIVE,
  ES_DNI_NEGATIVE,
  ES_NIE_POSITIVE,
  ES_NIE_NEGATIVE,
  PT_NIF_POSITIVE,
  PT_NIF_NEGATIVE,
  PT_NISS_POSITIVE,
  US_SSN_POSITIVE,
  US_PHONE_POSITIVE,
  EU_BOUNDARY,
  // ── Asia / RU ──
  CN_RESIDENT_ID_POSITIVE,
  CN_RESIDENT_ID_NEGATIVE,
  CN_PHONE_POSITIVE,
  CN_PHONE_NEGATIVE,
  RU_INN_POSITIVE,
  RU_INN_NEGATIVE,
  RU_SNILS_POSITIVE,
  RU_SNILS_NEGATIVE,
  IN_AADHAAR_POSITIVE,
  IN_AADHAAR_NEGATIVE,
  IN_PAN_POSITIVE,
  IN_PAN_NEGATIVE,
  IN_GSTIN_POSITIVE,
  IN_GSTIN_NEGATIVE,
  ASIA_BOUNDARY,
  // ── Global ──
  EMAIL_POSITIVE,
  EMAIL_NEGATIVE,
  JWT_POSITIVE,
  OPENAI_KEY_POSITIVE,
  AWS_KEY_POSITIVE,
  GITHUB_PAT_POSITIVE,
  SLACK_WEBHOOK_POSITIVE,
  SECRET_ASSIGNMENT_POSITIVE,
  SECRET_ASSIGNMENT_NEGATIVE,
  BEARER_TOKEN_POSITIVE,
  CREDIT_CARD_POSITIVE,
  CREDIT_CARD_NEGATIVE,
  IBAN_POSITIVE,
  IBAN_NEGATIVE,
  LABELED_PHONE_POSITIVE,
  LABELED_NAME_POSITIVE,
  LABELED_NAME_NEGATIVE,
  LABELED_ADDRESS_POSITIVE,
  LABELED_PASSPORT_POSITIVE,
  GLOBAL_BOUNDARY,
  // ── Cross-scope ──
  CROSS_SCOPE_POSITIVE,
  CROSS_SCOPE_GLOBAL_ONLY,
  CROSS_SCOPE_STRESS,
  // ── High Entropy (Edge Cases) ──
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
} from "@testing/constants/matrix";

// ─── Helper: DRY iteration wrappers ────────────────────────────────────────
function positives(
  fixtures: readonly Parameters<typeof assertPositiveFixture>[1][],
) {
  return (engine: MaskingEngine) => {
    for (const f of fixtures)
      it(f.description, () => assertPositiveFixture(engine, f));
  };
}
function negatives(
  fixtures: readonly Parameters<typeof assertNegativeFixture>[1][],
) {
  return (engine: MaskingEngine) => {
    for (const f of fixtures)
      it(f.description, () => assertNegativeFixture(engine, f));
  };
}
function boundaries(
  fixtures: readonly Parameters<typeof assertBoundaryFixture>[1][],
) {
  return (engine: MaskingEngine) => {
    for (const f of fixtures)
      it(f.description, () => assertBoundaryFixture(engine, f));
  };
}

describe("MaskingEngine country × rule matrix", () => {
  const engine = new MaskingEngine();

  // ═══════════════════════════════════════════════════════════════════════════
  // BRAZIL
  // ═══════════════════════════════════════════════════════════════════════════
  describe("Brazil (br)", () => {
    describe("CPF", () => {
      describe("positive", () => positives(BR_CPF_POSITIVE)(engine));
      describe("negative", () => negatives(BR_CPF_NEGATIVE)(engine));
    });
    describe("CNPJ", () => {
      describe("positive", () => positives(BR_CNPJ_POSITIVE)(engine));
      describe("negative", () => negatives(BR_CNPJ_NEGATIVE)(engine));
    });
    describe("phone", () => {
      describe("positive", () => positives(BR_PHONE_POSITIVE)(engine));
    });
    describe("CEP", () => {
      describe("positive", () => positives(BR_CEP_POSITIVE)(engine));
      describe("negative", () => negatives(BR_CEP_NEGATIVE)(engine));
    });
    describe("CNH", () => {
      describe("positive", () => positives(BR_CNH_POSITIVE)(engine));
    });
    describe("PIS/PASEP", () => {
      describe("positive", () => positives(BR_PIS_POSITIVE)(engine));
      describe("negative", () => negatives(BR_PIS_NEGATIVE)(engine));
    });
    describe("RG", () => {
      describe("positive", () => positives(BR_RG_POSITIVE)(engine));
      describe("negative", () => negatives(BR_RG_NEGATIVE)(engine));
    });
    describe("Título de Eleitor", () => {
      describe("positive", () => positives(BR_VOTER_POSITIVE)(engine));
    });
    describe("scope boundary", () => boundaries(BR_BOUNDARY)(engine));
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // LATIN AMERICA
  // ═══════════════════════════════════════════════════════════════════════════
  describe("Chile (cl)", () => {
    describe("RUT", () => {
      describe("positive", () => positives(CL_RUT_POSITIVE)(engine));
      describe("negative", () => negatives(CL_RUT_NEGATIVE)(engine));
    });
  });

  describe("Mexico (mx)", () => {
    describe("CURP", () => {
      describe("positive", () => positives(MX_CURP_POSITIVE)(engine));
      describe("negative", () => negatives(MX_CURP_NEGATIVE)(engine));
    });
    describe("RFC", () => {
      describe("positive", () => positives(MX_RFC_POSITIVE)(engine));
    });
  });

  describe("Argentina (ar)", () => {
    describe("CUIT", () => {
      describe("positive", () => positives(AR_CUIT_POSITIVE)(engine));
      describe("negative", () => negatives(AR_CUIT_NEGATIVE)(engine));
    });
  });

  describe("Colombia (co)", () => {
    describe("NIT", () => {
      describe("positive", () => positives(CO_NIT_POSITIVE)(engine));
      describe("negative", () => negatives(CO_NIT_NEGATIVE)(engine));
    });
    describe("Cédula", () => {
      describe("positive", () => positives(CO_CEDULA_POSITIVE)(engine));
    });
  });

  describe("Peru (pe)", () => {
    describe("LatAm DNI", () => {
      describe("positive", () => positives(LATAM_DNI_POSITIVE)(engine));
    });
    describe("RUC", () => {
      describe("positive", () => positives(PE_RUC_POSITIVE)(engine));
      describe("negative", () => negatives(PE_RUC_NEGATIVE)(engine));
    });
  });

  describe("LatAm scope boundary", () => boundaries(LATAM_BOUNDARY)(engine));

  // ═══════════════════════════════════════════════════════════════════════════
  // EUROPE & US
  // ═══════════════════════════════════════════════════════════════════════════
  describe("Spain (es)", () => {
    describe("DNI", () => {
      describe("positive", () => positives(ES_DNI_POSITIVE)(engine));
      describe("negative", () => negatives(ES_DNI_NEGATIVE)(engine));
    });
    describe("NIE", () => {
      describe("positive", () => positives(ES_NIE_POSITIVE)(engine));
      describe("negative", () => negatives(ES_NIE_NEGATIVE)(engine));
    });
  });

  describe("Portugal (pt)", () => {
    describe("NIF", () => {
      describe("positive", () => positives(PT_NIF_POSITIVE)(engine));
      describe("negative", () => negatives(PT_NIF_NEGATIVE)(engine));
    });
    describe("NISS", () => {
      describe("positive", () => positives(PT_NISS_POSITIVE)(engine));
    });
  });

  describe("United States (us)", () => {
    describe("SSN", () => {
      describe("positive", () => positives(US_SSN_POSITIVE)(engine));
    });
    describe("phone", () => {
      describe("positive", () => positives(US_PHONE_POSITIVE)(engine));
    });
  });

  describe("EU scope boundary", () => boundaries(EU_BOUNDARY)(engine));

  // ═══════════════════════════════════════════════════════════════════════════
  // ASIA & RUSSIA
  // ═══════════════════════════════════════════════════════════════════════════
  describe("China (cn)", () => {
    describe("Resident ID", () => {
      describe("positive", () => positives(CN_RESIDENT_ID_POSITIVE)(engine));
      describe("negative", () => negatives(CN_RESIDENT_ID_NEGATIVE)(engine));
    });
    describe("phone", () => {
      describe("positive", () => positives(CN_PHONE_POSITIVE)(engine));
      describe("negative", () => negatives(CN_PHONE_NEGATIVE)(engine));
    });
  });

  describe("Russia (ru)", () => {
    describe("INN", () => {
      describe("positive", () => positives(RU_INN_POSITIVE)(engine));
      describe("negative", () => negatives(RU_INN_NEGATIVE)(engine));
    });
    describe("SNILS", () => {
      describe("positive", () => positives(RU_SNILS_POSITIVE)(engine));
      describe("negative", () => negatives(RU_SNILS_NEGATIVE)(engine));
    });
  });

  describe("India (in)", () => {
    describe("Aadhaar", () => {
      describe("positive", () => positives(IN_AADHAAR_POSITIVE)(engine));
      describe("negative", () => negatives(IN_AADHAAR_NEGATIVE)(engine));
    });
    describe("PAN", () => {
      describe("positive", () => positives(IN_PAN_POSITIVE)(engine));
      describe("negative", () => negatives(IN_PAN_NEGATIVE)(engine));
    });
    describe("GSTIN", () => {
      describe("positive", () => positives(IN_GSTIN_POSITIVE)(engine));
      describe("negative", () => negatives(IN_GSTIN_NEGATIVE)(engine));
    });
  });

  describe("Asia scope boundary", () => boundaries(ASIA_BOUNDARY)(engine));

  // ═══════════════════════════════════════════════════════════════════════════
  // GLOBAL RULES
  // ═══════════════════════════════════════════════════════════════════════════
  describe("Global rules", () => {
    describe("email", () => {
      describe("positive", () => positives(EMAIL_POSITIVE)(engine));
      describe("negative", () => negatives(EMAIL_NEGATIVE)(engine));
    });
    describe("JWT", () => {
      describe("positive", () => positives(JWT_POSITIVE)(engine));
    });
    describe("OpenAI key", () => {
      describe("positive", () => positives(OPENAI_KEY_POSITIVE)(engine));
    });
    describe("AWS keys", () => {
      describe("positive", () => positives(AWS_KEY_POSITIVE)(engine));
    });
    describe("GitHub PAT", () => {
      describe("positive", () => positives(GITHUB_PAT_POSITIVE)(engine));
    });
    describe("Slack webhook", () => {
      describe("positive", () => positives(SLACK_WEBHOOK_POSITIVE)(engine));
    });
    describe("secret assignment", () => {
      describe("positive", () => positives(SECRET_ASSIGNMENT_POSITIVE)(engine));
      describe("negative", () => negatives(SECRET_ASSIGNMENT_NEGATIVE)(engine));
    });
    describe("bearer token", () => {
      describe("positive", () => positives(BEARER_TOKEN_POSITIVE)(engine));
    });
    describe("credit card", () => {
      describe("positive", () => positives(CREDIT_CARD_POSITIVE)(engine));
      describe("negative", () => negatives(CREDIT_CARD_NEGATIVE)(engine));
    });
    describe("IBAN", () => {
      describe("positive", () => positives(IBAN_POSITIVE)(engine));
      describe("negative", () => negatives(IBAN_NEGATIVE)(engine));
    });
    describe("labeled phone", () => {
      describe("positive", () => positives(LABELED_PHONE_POSITIVE)(engine));
    });
    describe("labeled name", () => {
      describe("positive", () => positives(LABELED_NAME_POSITIVE)(engine));
      describe("negative", () => negatives(LABELED_NAME_NEGATIVE)(engine));
    });
    describe("labeled address", () => {
      describe("positive", () => positives(LABELED_ADDRESS_POSITIVE)(engine));
    });
    describe("labeled passport", () => {
      describe("positive", () => positives(LABELED_PASSPORT_POSITIVE)(engine));
    });
    describe("global boundary", () => boundaries(GLOBAL_BOUNDARY)(engine));
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // CROSS-SCOPE
  // ═══════════════════════════════════════════════════════════════════════════
  describe("Cross-scope scenarios", () => {
    describe("multi-country positive", () =>
      positives(CROSS_SCOPE_POSITIVE)(engine));
    describe("global-only suppression", () =>
      boundaries(CROSS_SCOPE_GLOBAL_ONLY)(engine));
    describe("stress: many countries", () =>
      boundaries(CROSS_SCOPE_STRESS)(engine));
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // HIGH ENTROPY EDGE CASES
  // ═══════════════════════════════════════════════════════════════════════════
  describe("High-entropy edge cases", () => {
    describe("typos and grammatical errors", () => {
      describe("PT-BR typos", () => positives(BR_TYPO_POSITIVE)(engine));
      describe("EN-US typos", () => positives(US_TYPO_POSITIVE)(engine));
    });
    describe("mixed separators", () =>
      positives(MIXED_SEPARATOR_POSITIVE)(engine));
    describe("informal language", () =>
      positives(INFORMAL_LANGUAGE_POSITIVE)(engine));
    describe("malicious code patterns", () =>
      positives(MALICIOUS_CODE_FIXTURES)(engine));
    describe("unicode edge cases", () => positives(UNICODE_EDGE_CASES)(engine));
    describe("whitespace chaos", () => positives(WHITESPACE_CHAOS)(engine));
    describe("informal variations", () => {
      describe("PT-BR informal", () =>
        positives(BR_INFORMAL_VARIATIONS)(engine));
      describe("EN-US informal", () =>
        positives(US_INFORMAL_VARIATIONS)(engine));
    });
    describe("ambiguous separator boundary", () =>
      boundaries(AMBIGUOUS_SEPARATOR_BOUNDARY)(engine));
    describe("false positive avoidance", () =>
      negatives(HIGH_ENTROPY_NEGATIVES)(engine));
  });
});
