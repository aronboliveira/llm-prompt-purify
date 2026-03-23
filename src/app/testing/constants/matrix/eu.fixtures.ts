/**
 * EU country-scope matrix fixtures.
 * Covers: Spanish DNI, Spanish NIE, Portuguese NIF, Portuguese NISS, US SSN.
 * Countries: es, pt, us.
 */
import type {
  BoundaryMaskFixture,
  LocaleMaskFixture,
  NegativeMaskFixture,
} from "../../declarations/testing.types";

// ─── Positive: Spanish DNI ──────────────────────────────────────────────────
export const ES_DNI_POSITIVE: readonly LocaleMaskFixture[] = Object.freeze([
  {
    countryProfileIds: ["es"],
    description: "masks Spanish DNI with label 'DNI: 12345678Z'",
    expectedRuleIds: ["es-dni-labeled"],
    hiddenValues: ["12345678Z"],
    sourceText: "DNI: 12345678Z",
  },
  {
    countryProfileIds: ["es"],
    description: "masks DNI with 'Documento nacional de identidad: 00000000T'",
    expectedRuleIds: ["es-dni-labeled"],
    hiddenValues: ["00000000T"],
    sourceText: "Documento nacional de identidad: 00000000T",
  },
  {
    countryProfileIds: ["es"],
    description: "masks DNI with colon-separated label 'DNI: 99999999R'",
    expectedRuleIds: ["es-dni-labeled"],
    hiddenValues: ["99999999R"],
    sourceText: "DNI: 99999999R",
  },
  {
    countryProfileIds: ["es"],
    description: "masks DNI embedded in a narrative paragraph",
    expectedRuleIds: ["es-dni-labeled"],
    hiddenValues: ["12345678Z"],
    sourceText:
      "El empleado con DNI: 12345678Z fue dado de alta el 15 de enero de 2025.",
  },
]);

// ─── Negative: Spanish DNI ──────────────────────────────────────────────────
export const ES_DNI_NEGATIVE: readonly NegativeMaskFixture[] = Object.freeze([
  {
    countryProfileIds: ["es"],
    description: "ignores Spanish DNI with wrong check letter (12345678A)",
    excludedRuleIds: ["es-dni-labeled"],
    sourceText: "DNI: 12345678A",
    visibleValues: ["12345678A"],
  },
  {
    countryProfileIds: ["es"],
    description: "ignores DNI number without letter suffix",
    excludedRuleIds: ["es-dni-labeled"],
    sourceText: "DNI: 12345678",
    visibleValues: ["12345678"],
  },
  {
    countryProfileIds: ["es"],
    description: "ignores DNI with only 7 digits",
    excludedRuleIds: ["es-dni-labeled"],
    sourceText: "DNI: 1234567Z",
    visibleValues: ["1234567Z"],
  },
]);

// ─── Positive: Spanish NIE ──────────────────────────────────────────────────
export const ES_NIE_POSITIVE: readonly LocaleMaskFixture[] = Object.freeze([
  {
    countryProfileIds: ["es"],
    description: "masks NIE starting with X 'NIE: X1234567L'",
    expectedRuleIds: ["es-nie-labeled"],
    hiddenValues: ["X1234567L"],
    sourceText: "NIE: X1234567L",
  },
  {
    countryProfileIds: ["es"],
    description: "masks NIE starting with Y 'NIE: Y1234567X'",
    expectedRuleIds: ["es-nie-labeled"],
    hiddenValues: ["Y1234567X"],
    sourceText: "NIE: Y1234567X",
  },
  {
    countryProfileIds: ["es"],
    description: "masks NIE starting with Z 'NIE: Z1234567R'",
    expectedRuleIds: ["es-nie-labeled"],
    hiddenValues: ["Z1234567R"],
    sourceText: "NIE: Z1234567R",
  },
  {
    countryProfileIds: ["es"],
    description:
      "masks NIE with 'Número de identidad de extranjero: X1234567L'",
    expectedRuleIds: ["es-nie-labeled"],
    hiddenValues: ["X1234567L"],
    sourceText: "Número de identidad de extranjero: X1234567L",
  },
]);

// ─── Negative: Spanish NIE ──────────────────────────────────────────────────
export const ES_NIE_NEGATIVE: readonly NegativeMaskFixture[] = Object.freeze([
  {
    countryProfileIds: ["es"],
    description: "ignores NIE with wrong check letter (X1234567A)",
    excludedRuleIds: ["es-nie-labeled"],
    sourceText: "NIE: X1234567A",
    visibleValues: ["X1234567A"],
  },
  {
    countryProfileIds: ["es"],
    description: "ignores NIE starting with invalid letter (A1234567L)",
    excludedRuleIds: ["es-nie-labeled"],
    sourceText: "NIE: A1234567L",
    visibleValues: ["A1234567L"],
  },
]);

// ─── Positive: Portuguese NIF ───────────────────────────────────────────────
export const PT_NIF_POSITIVE: readonly LocaleMaskFixture[] = Object.freeze([
  {
    countryProfileIds: ["pt"],
    description: "masks NIF with label 'NIF: 245716840'",
    expectedRuleIds: ["pt-nif-labeled"],
    hiddenValues: ["245716840"],
    sourceText: "NIF: 245716840",
  },
  {
    countryProfileIds: ["pt"],
    description:
      "masks NIF with full label 'Número de identificação fiscal: 245716840'",
    expectedRuleIds: ["pt-nif-labeled"],
    hiddenValues: ["245716840"],
    sourceText: "Número de identificação fiscal: 245716840",
  },
  {
    countryProfileIds: ["pt"],
    description: "masks NIF in a billing paragraph",
    expectedRuleIds: ["pt-nif-labeled"],
    hiddenValues: ["245716840"],
    sourceText:
      "A fatura será emitida ao NIF: 245716840 conforme solicitado pela empresa.",
  },
]);

// ─── Negative: Portuguese NIF ───────────────────────────────────────────────
export const PT_NIF_NEGATIVE: readonly NegativeMaskFixture[] = Object.freeze([
  {
    countryProfileIds: ["pt"],
    description: "ignores NIF with invalid check digit (245716845)",
    excludedRuleIds: ["pt-nif-labeled"],
    sourceText: "NIF: 245716845",
    visibleValues: ["245716845"],
  },
  {
    countryProfileIds: ["pt"],
    description: "ignores NIF with only 8 digits",
    excludedRuleIds: ["pt-nif-labeled"],
    sourceText: "NIF: 24571684",
    visibleValues: ["24571684"],
  },
]);

// ─── Positive: Portuguese NISS ──────────────────────────────────────────────
export const PT_NISS_POSITIVE: readonly LocaleMaskFixture[] = Object.freeze([
  {
    countryProfileIds: ["pt"],
    description: "masks NISS with label 'NISS: 11234567890'",
    expectedRuleIds: ["pt-niss-labeled"],
    hiddenValues: ["11234567890"],
    sourceText: "NISS: 11234567890",
  },
  {
    countryProfileIds: ["pt"],
    description:
      "masks NISS with full label 'Número de segurança social: 11234567890'",
    expectedRuleIds: ["pt-niss-labeled"],
    hiddenValues: ["11234567890"],
    sourceText: "Número de segurança social: 11234567890",
  },
]);

// ─── Positive: US SSN ───────────────────────────────────────────────────────
export const US_SSN_POSITIVE: readonly LocaleMaskFixture[] = Object.freeze([
  {
    countryProfileIds: ["us"],
    description: "masks US SSN with dashes (123-45-6789)",
    expectedRuleIds: ["us-ssn"],
    hiddenValues: ["123-45-6789"],
    sourceText: "Social Security Number: 123-45-6789",
  },
  {
    countryProfileIds: ["us"],
    description: "masks US SSN embedded in HR document",
    expectedRuleIds: ["us-ssn"],
    hiddenValues: ["456-78-9012"],
    sourceText:
      "The employee's SSN is 456-78-9012 per the onboarding form submitted last week.",
  },
  {
    countryProfileIds: ["us"],
    description: "masks multiple SSNs in same prompt",
    expectedRuleIds: ["us-ssn"],
    hiddenValues: ["123-45-6789", "456-78-9012"],
    sourceText: "Employee SSN: 123-45-6789\nSpouse SSN: 456-78-9012",
  },
]);

// ─── Positive: US phone ─────────────────────────────────────────────────────
export const US_PHONE_POSITIVE: readonly LocaleMaskFixture[] = Object.freeze([
  {
    countryProfileIds: ["us"],
    description: "masks US phone with parentheses (415) 555-2671",
    expectedRuleIds: ["us-phone"],
    hiddenValues: ["(415) 555-2671"],
    sourceText: "Reach (415) 555-2671 for info.",
  },
  {
    countryProfileIds: ["us"],
    description: "masks US phone with +1 prefix +1 415-555-2671",
    expectedRuleIds: ["us-phone"],
    hiddenValues: ["+1 415-555-2671"],
    sourceText: "Call: +1 415-555-2671",
  },
  {
    countryProfileIds: ["us"],
    description: "masks US phone with dots 415.555.2671",
    expectedRuleIds: ["us-phone"],
    hiddenValues: ["415.555.2671"],
    sourceText: "Fax: 415.555.2671",
  },
]);

// ─── Boundary: EU + US scope isolation ──────────────────────────────────────
export const EU_BOUNDARY: readonly BoundaryMaskFixture[] = Object.freeze([
  {
    countryProfileIds: ["pt"],
    description: "Spanish DNI stays visible when only PT is selected",
    excludedRuleIds: ["es-dni-labeled"],
    sourceText: "DNI: 12345678Z",
    visibleValues: ["12345678Z"],
  },
  {
    countryProfileIds: ["es"],
    description: "Portuguese NIF stays visible when only ES is selected",
    excludedRuleIds: ["pt-nif-labeled"],
    sourceText: "NIF: 245716840",
    visibleValues: ["245716840"],
  },
  {
    countryProfileIds: ["us"],
    description: "Spanish DNI stays visible when only US is selected",
    excludedRuleIds: ["es-dni-labeled"],
    sourceText: "DNI: 12345678Z",
    visibleValues: ["12345678Z"],
  },
  {
    countryProfileIds: ["es", "pt"],
    description: "masks both Spanish DNI and Portuguese NIF in dual-EU scope",
    expectedRuleIds: ["es-dni-labeled", "pt-nif-labeled"],
    hiddenValues: ["12345678Z", "245716840"],
    sourceText: "DNI: 12345678Z\nNIF: 245716840",
  },
  {
    countryProfileIds: ["us"],
    detectionMode: "global-only",
    description: "US SSN is masked in global-only mode (SSN is now global)",
    expectedRuleIds: ["us-ssn"],
    hiddenValues: ["123-45-6789"],
    sourceText: "SSN: 123-45-6789",
  },
  {
    countryProfileIds: ["es"],
    description: "masks Spanish DNI + NIE + email in full ES scope",
    expectedRuleIds: ["es-dni-labeled", "es-nie-labeled", "email-address"],
    hiddenValues: ["12345678Z", "X1234567L", "empleado@corp.es"],
    sourceText: [
      "DNI: 12345678Z",
      "NIE: X1234567L",
      "Correo: empleado@corp.es",
    ].join("\n"),
  },
]);
