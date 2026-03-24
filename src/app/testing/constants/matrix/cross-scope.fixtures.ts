/**
 * Cross-scope matrix fixtures.
 * Tests multi-country combinations: several countries active at once,
 * global-only mode suppression, and full-scope stress scenarios.
 */
import type {
  BoundaryMaskFixture,
  LocaleMaskFixture,
} from "../../declarations/testing.types";

// ─── Multi-country positive: concurrent scopes ─────────────────────────────
export const CROSS_SCOPE_POSITIVE: readonly LocaleMaskFixture[] = Object.freeze(
  [
    {
      countryProfileIds: ["br", "ar"],
      description: "BR+AR scope masks CPF and CUIT together",
      expectedRuleIds: ["cpf", "cuit"],
      hiddenValues: ["529.982.247-25", "20-12345678-6"],
      sourceText: "CPF 529.982.247-25 e CUIT 20-12345678-6 no mesmo documento.",
    },
    {
      countryProfileIds: ["cn", "in"],
      description: "CN+IN scope masks CN ID and Aadhaar together",
      expectedRuleIds: ["cn-resident-id-labeled", "in-aadhaar-labeled"],
      hiddenValues: ["11010519491231002X", "276592857148"],
      sourceText:
        "resident id: 11010519491231002X and aadhaar: 276592857148 both verified.",
    },
    {
      countryProfileIds: ["ru", "es"],
      description: "RU+ES scope masks INN and Spanish DNI together",
      expectedRuleIds: ["ru-inn-labeled", "es-dni-labeled"],
      hiddenValues: ["7728495344", "12345678Z"],
      sourceText: "инн: 7728495344 DNI: 12345678Z cross-border record.",
    },
    {
      countryProfileIds: ["br", "pt"],
      description: "BR+PT scope masks CPF and Portuguese NIF together",
      expectedRuleIds: ["cpf", "pt-nif-labeled"],
      hiddenValues: ["529.982.247-25", "123456789"],
      sourceText: "CPF: 529.982.247-25 NIF: 123456789 lusophone treaty.",
    },
    {
      countryProfileIds: ["mx", "co", "pe"],
      description: "MX+CO+PE scope masks CURP, NIT and RUC together",
      expectedRuleIds: ["curp", "nit", "ruc-labeled"],
      hiddenValues: ["GARC850101HDFRRL09", "860012503-5", "20100130204"],
      sourceText:
        "CURP: GARC850101HDFRRL09 NIT: 860012503-5 RUC: 20100130204 en Latam.",
    },
    {
      countryProfileIds: ["us", "br", "cn"],
      description: "US+BR+CN masks SSN, CNPJ and CN phone in one text",
      expectedRuleIds: ["us-ssn", "cnpj", "cn-phone"],
      hiddenValues: ["078-05-1120", "11.222.333/0001-81", "13812345678"],
      sourceText:
        "SSN 078-05-1120, CNPJ 11.222.333/0001-81, phone 13812345678.",
    },
  ],
);

// ─── Boundary: global-only mode suppresses all country rules ────────────────
export const CROSS_SCOPE_GLOBAL_ONLY: readonly BoundaryMaskFixture[] =
  Object.freeze([
    {
      countryProfileIds: ["br"],
      description: "global-only mode masks CPF/CNPJ via global rules and email",
      detectionMode: "global-only",
      expectedRuleIds: ["cpf", "cnpj", "email-address"],
      hiddenValues: [
        "529.982.247-25",
        "11.222.333/0001-81",
        "user@example.com",
      ],
      sourceText:
        "CPF 529.982.247-25 CNPJ 11.222.333/0001-81 email user@example.com.",
    },
    {
      countryProfileIds: ["ru"],
      description: "global-only mode does NOT mask RU INN/SNILS but masks JWT",
      detectionMode: "global-only",
      excludedRuleIds: ["ru-inn-labeled", "ru-snils-labeled"],
      expectedRuleIds: ["jwt-token"],
      hiddenValues: [
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIn0.c2lnbg",
      ],
      sourceText:
        "инн: 7728495344 снилс: 112-233-445 95 jwt eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIn0.c2lnbg",
      visibleValues: ["7728495344", "112-233-445 95"],
    },
    {
      countryProfileIds: ["in"],
      description:
        "global-only mode does NOT mask Aadhaar/PAN/GSTIN but masks credit card",
      detectionMode: "global-only",
      excludedRuleIds: [
        "in-aadhaar-labeled",
        "in-pan-labeled",
        "in-gstin-labeled",
      ],
      expectedRuleIds: ["credit-card"],
      hiddenValues: ["4532 0151 2345 6789"],
      sourceText:
        "aadhaar: 276592857148 pan: ABCPD1234E gstin: 27ABCDE1234FZG card 4532 0151 2345 6789",
      visibleValues: ["276592857148", "ABCPD1234E", "27ABCDE1234FZG"],
    },
    {
      countryProfileIds: ["es", "cl", "mx", "ar", "co", "pe"],
      description:
        "global-only mode masks IBAN + labeled RUT/CUIT via global rules",
      detectionMode: "global-only",
      expectedRuleIds: ["iban", "rut-global-labeled", "cuit-global-labeled"],
      hiddenValues: ["DE89370400440532013000", "12.345.678-5", "20-12345678-6"],
      sourceText:
        "DNI: 12345678Z RUT 12.345.678-5 CURP GARC850101HDFRRL09 CUIT 20-12345678-6 IBAN DE89370400440532013000",
      visibleValues: ["12345678Z", "GARC850101HDFRRL09"],
    },
  ]);

// ─── Stress: many countries active simultaneously ───────────────────────────
export const CROSS_SCOPE_STRESS: readonly BoundaryMaskFixture[] = Object.freeze(
  [
    {
      countryProfileIds: ["br", "ar", "cl", "mx", "co", "pe", "es", "pt"],
      description:
        "8-country LatAm+Iberian scope masks all country + global rules at once",
      expectedRuleIds: [
        "cpf",
        "chile-rut",
        "curp",
        "cuit",
        "es-dni-labeled",
        "pt-nif-labeled",
        "email-address",
      ],
      hiddenValues: [
        "529.982.247-25",
        "12.345.678-5",
        "GARC850101HDFRRL09",
        "20-12345678-6",
        "12345678Z",
        "123456789",
        "admin@corp.com",
      ],
      sourceText: [
        "CPF: 529.982.247-25",
        "RUT: 12.345.678-5",
        "CURP: GARC850101HDFRRL09",
        "CUIT: 20-12345678-6",
        "DNI: 12345678Z",
        "NIF: 123456789",
        "Email: admin@corp.com",
      ].join("\n"),
    },
    {
      countryProfileIds: ["cn", "ru", "in", "us"],
      description:
        "4-country Asia+US scope masks CN ID, INN, Aadhaar, SSN and global email",
      expectedRuleIds: [
        "cn-resident-id-labeled",
        "ru-inn-labeled",
        "in-aadhaar-labeled",
        "us-ssn",
        "email-address",
      ],
      hiddenValues: [
        "11010519491231002X",
        "7728495344",
        "276592857148",
        "078-05-1120",
        "test@domain.org",
      ],
      sourceText: [
        "resident id: 11010519491231002X",
        "инн: 7728495344",
        "aadhaar: 276592857148",
        "SSN: 078-05-1120",
        "Contact: test@domain.org",
      ].join("\n"),
    },
    {
      countryProfileIds: [
        "br",
        "ar",
        "cl",
        "mx",
        "co",
        "pe",
        "es",
        "pt",
        "us",
        "cn",
        "ru",
        "in",
      ],
      description: "all 12 countries active: kitchen-sink stress test",
      expectedRuleIds: [
        "cpf",
        "us-ssn",
        "cn-resident-id-labeled",
        "ru-inn-labeled",
        "in-aadhaar-labeled",
        "email-address",
      ],
      hiddenValues: [
        "529.982.247-25",
        "078-05-1120",
        "11010519491231002X",
        "7728495344",
        "276592857148",
        "admin@corp.com",
      ],
      sourceText: [
        "CPF 529.982.247-25",
        "SSN 078-05-1120",
        "resident id: 11010519491231002X",
        "инн: 7728495344",
        "aadhaar: 276592857148",
        "email admin@corp.com",
      ].join("\n"),
    },
  ],
);
