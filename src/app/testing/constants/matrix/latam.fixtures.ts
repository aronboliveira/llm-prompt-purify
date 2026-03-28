/**
 * Latin America (Spanish-speaking) country-scope matrix fixtures.
 * Covers: Chilean RUT, CURP, RFC, CUIT, NIT, Cedula, DNI, RUC.
 * Countries: ar, cl, co, mx, pe, latam-es.
 */
import type {
  BoundaryMaskFixture,
  LocaleMaskFixture,
  NegativeMaskFixture,
} from "../../declarations/testing.types";

// ─── Positive: Chilean RUT ──────────────────────────────────────────────────
export const CL_RUT_POSITIVE: readonly LocaleMaskFixture[] = Object.freeze([
  {
    countryProfileIds: ["cl"],
    description: "masks Chilean RUT with dots and dash (12.345.678-5)",
    expectedRuleIds: ["chile-rut"],
    hiddenValues: ["12.345.678-5"],
    sourceText: "RUT del contribuyente: 12.345.678-5",
  },
  {
    countryProfileIds: ["cl"],
    description: "masks Chilean RUT without formatting (123456785)",
    expectedRuleIds: ["chile-rut"],
    hiddenValues: ["123456785"],
    sourceText: "RUT: 123456785",
  },
  {
    countryProfileIds: ["cl"],
    description: "masks Chilean RUT ending in 6 (7.654.321-6)",
    expectedRuleIds: ["chile-rut"],
    hiddenValues: ["7.654.321-6"],
    sourceText: "Su RUT es 7.654.321-6 registrado en SII.",
  },
  {
    countryProfileIds: ["latam-es"],
    description: "masks Chilean RUT via latam-es scope",
    expectedRuleIds: ["chile-rut"],
    hiddenValues: ["12.345.678-5"],
    sourceText: "RUT: 12.345.678-5",
  },
]);

// ─── Negative: Chilean RUT ──────────────────────────────────────────────────
export const CL_RUT_NEGATIVE: readonly NegativeMaskFixture[] = Object.freeze([
  {
    countryProfileIds: ["cl"],
    description: "ignores Chilean RUT with wrong check digit",
    excludedRuleIds: ["chile-rut"],
    sourceText: "RUT: 12.345.678-0",
    visibleValues: ["12.345.678-0"],
  },
  {
    countryProfileIds: ["cl"],
    description: "ignores Chilean RUT with too few digits",
    excludedRuleIds: ["chile-rut"],
    sourceText: "RUT: 12345-K",
    visibleValues: ["12345-K"],
  },
]);

// ─── Positive: CURP (Mexico) ────────────────────────────────────────────────
export const MX_CURP_POSITIVE: readonly LocaleMaskFixture[] = Object.freeze([
  {
    countryProfileIds: ["mx"],
    description: "masks valid CURP (GARC850101HDFRRL09)",
    expectedRuleIds: ["curp"],
    hiddenValues: ["GARC850101HDFRRL09"],
    sourceText: "CURP del empleado: GARC850101HDFRRL09.",
  },
  {
    countryProfileIds: ["mx"],
    description: "masks CURP for female (LOME900215MMCPRL01)",
    expectedRuleIds: ["curp"],
    hiddenValues: ["LOME900215MMCPRL01"],
    sourceText: "CURP: LOME900215MMCPRL01",
  },
  {
    countryProfileIds: ["latam-es"],
    description: "masks CURP via latam-es scope",
    expectedRuleIds: ["curp"],
    hiddenValues: ["GARC850101HDFRRL09"],
    sourceText: "CURP: GARC850101HDFRRL09",
  },
]);

// ─── Negative: CURP ─────────────────────────────────────────────────────────
export const MX_CURP_NEGATIVE: readonly NegativeMaskFixture[] = Object.freeze([
  {
    countryProfileIds: ["mx"],
    description: "ignores CURP with lowercase letters",
    excludedRuleIds: ["curp"],
    sourceText: "CURP: garc850101hdfrrl09",
    visibleValues: ["garc850101hdfrrl09"],
  },
  {
    countryProfileIds: ["mx"],
    description: "ignores CURP with missing gender marker",
    excludedRuleIds: ["curp"],
    sourceText: "CURP: GARC850101XDFRRL09",
    visibleValues: ["GARC850101XDFRRL09"],
  },
]);

// ─── Positive: RFC (Mexico) ─────────────────────────────────────────────────
export const MX_RFC_POSITIVE: readonly LocaleMaskFixture[] = Object.freeze([
  {
    countryProfileIds: ["mx"],
    description: "masks personal RFC (GARC850101AB1)",
    expectedRuleIds: ["rfc"],
    hiddenValues: ["GARC850101AB1"],
    sourceText: "RFC persona física: GARC850101AB1.",
  },
  {
    countryProfileIds: ["mx"],
    description: "masks company RFC with Ñ (MAÑ010203XY9)",
    expectedRuleIds: ["rfc"],
    hiddenValues: ["MAÑ010203XY9"],
    sourceText: "RFC empresa: MAÑ010203XY9",
  },
  {
    countryProfileIds: ["mx"],
    description: "masks RFC for legal entity with & (A&B200101Z00)",
    expectedRuleIds: ["rfc"],
    hiddenValues: ["A&B200101Z00"],
    sourceText: "RFC: A&B200101Z00",
  },
]);

// ─── Positive: CUIT (Argentina) ─────────────────────────────────────────────
export const AR_CUIT_POSITIVE: readonly LocaleMaskFixture[] = Object.freeze([
  {
    countryProfileIds: ["ar"],
    description: "masks valid CUIT (20-12345678-6)",
    expectedRuleIds: ["cuit"],
    hiddenValues: ["20-12345678-6"],
    sourceText: "CUIT del contribuyente: 20-12345678-6 activo.",
  },
  {
    countryProfileIds: ["ar"],
    description: "masks CUIT for legal entity (30-71234567-1)",
    expectedRuleIds: ["cuit"],
    hiddenValues: ["30-71234567-1"],
    sourceText: "CUIT empresa: 30-71234567-1",
  },
  {
    countryProfileIds: ["latam-es"],
    description: "masks CUIT via latam-es scope",
    expectedRuleIds: ["cuit"],
    hiddenValues: ["20-12345678-6"],
    sourceText: "CUIT: 20-12345678-6",
  },
]);

// ─── Negative: CUIT ─────────────────────────────────────────────────────────
export const AR_CUIT_NEGATIVE: readonly NegativeMaskFixture[] = Object.freeze([
  {
    countryProfileIds: ["ar"],
    description: "ignores CUIT with invalid verifier digit",
    excludedRuleIds: ["cuit"],
    sourceText: "CUIT: 20-12345678-0",
    visibleValues: ["20-12345678-0"],
  },
  {
    countryProfileIds: ["ar"],
    description:
      "ignores CUIT with wrong check digit (inner digits also fail RUT validation)",
    excludedRuleIds: ["cuit"],
    sourceText: "CUIT: 23-98765432-0",
    visibleValues: ["23-98765432-0"],
  },
]);

// ─── Positive: NIT (Colombia) ───────────────────────────────────────────────
export const CO_NIT_POSITIVE: readonly LocaleMaskFixture[] = Object.freeze([
  {
    countryProfileIds: ["co"],
    description: "masks NIT with dots and dash (900.123.456-8)",
    expectedRuleIds: ["nit"],
    hiddenValues: ["900.123.456-8"],
    sourceText: "NIT de la empresa: 900.123.456-8",
  },
  {
    countryProfileIds: ["co"],
    description: "masks NIT without formatting (9001234568)",
    expectedRuleIds: ["nit"],
    hiddenValues: ["9001234568"],
    sourceText: "NIT: 9001234568",
  },
  {
    countryProfileIds: ["latam-es"],
    description: "masks NIT via latam-es scope",
    expectedRuleIds: ["nit"],
    hiddenValues: ["900.123.456-8"],
    sourceText: "NIT: 900.123.456-8",
  },
]);

// ─── Negative: NIT ──────────────────────────────────────────────────────────
export const CO_NIT_NEGATIVE: readonly NegativeMaskFixture[] = Object.freeze([
  {
    countryProfileIds: ["co"],
    description: "ignores NIT with invalid check digit",
    excludedRuleIds: ["nit"],
    sourceText: "NIT: 900.123.456-0",
    visibleValues: ["900.123.456-0"],
  },
]);

// ─── Positive: Cedula labeled (Colombia) ────────────────────────────────────
export const CO_CEDULA_POSITIVE: readonly LocaleMaskFixture[] = Object.freeze([
  {
    countryProfileIds: ["co"],
    description: "masks Cedula with label 'Cédula: 1020304050'",
    expectedRuleIds: ["cedula-labeled"],
    hiddenValues: ["1020304050"],
    sourceText: "Cédula: 1020304050",
  },
  {
    countryProfileIds: ["co"],
    description:
      "masks Cedula with full label 'Cédula de ciudadanía: 80123456'",
    expectedRuleIds: ["cedula-labeled"],
    hiddenValues: ["80123456"],
    sourceText: "Cédula de ciudadanía: 80123456",
  },
  {
    countryProfileIds: ["co"],
    description: "masks Cedula without accent 'Cedula: 1122334455'",
    expectedRuleIds: ["cedula-labeled"],
    hiddenValues: ["1122334455"],
    sourceText: "Cedula: 1122334455",
  },
]);

// ─── Positive: DNI labeled (Argentina/Peru) ─────────────────────────────────
export const LATAM_DNI_POSITIVE: readonly LocaleMaskFixture[] = Object.freeze([
  {
    countryProfileIds: ["ar"],
    description: "masks Argentine DNI 'DNI: 34567890'",
    expectedRuleIds: ["dni-labeled"],
    hiddenValues: ["34567890"],
    sourceText: "DNI: 34567890",
  },
  {
    countryProfileIds: ["pe"],
    description:
      "masks Peruvian DNI 'Documento nacional de identidad: 12345678'",
    expectedRuleIds: ["dni-labeled"],
    hiddenValues: ["12345678"],
    sourceText: "Documento nacional de identidad: 12345678",
  },
  {
    countryProfileIds: ["ar"],
    description: "masks DNI with 7-digit format 'DNI: 3456789'",
    expectedRuleIds: ["dni-labeled"],
    hiddenValues: ["3456789"],
    sourceText: "DNI: 3456789",
  },
]);

// ─── Positive: RUC labeled (Peru) ───────────────────────────────────────────
export const PE_RUC_POSITIVE: readonly LocaleMaskFixture[] = Object.freeze([
  {
    countryProfileIds: ["pe"],
    description: "masks Peruvian RUC starting with 20 (empresa)",
    expectedRuleIds: ["ruc-labeled"],
    hiddenValues: ["20123456786"],
    sourceText: "RUC: 20123456786",
  },
  {
    countryProfileIds: ["pe"],
    description: "masks Peruvian RUC starting with 10 (persona natural)",
    expectedRuleIds: ["ruc-labeled"],
    hiddenValues: ["10234567891"],
    sourceText: "Número de RUC: 10234567891",
  },
  {
    countryProfileIds: ["latam-es"],
    description: "masks RUC via latam-es scope",
    expectedRuleIds: ["ruc-labeled"],
    hiddenValues: ["20123456786"],
    sourceText: "RUC: 20123456786",
  },
  {
    countryProfileIds: ["pe"],
    description:
      "masks RUC with bad check digit via labeled-loose structural fallback",
    expectedRuleIds: ["ruc-labeled-loose"],
    hiddenValues: ["20123456780"],
    sourceText: "RUC: 20123456780",
  },
]);

// ─── Negative: RUC ──────────────────────────────────────────────────────────
export const PE_RUC_NEGATIVE: readonly NegativeMaskFixture[] = Object.freeze([
  {
    countryProfileIds: ["pe"],
    description: "ignores RUC with invalid prefix (30...)",
    excludedRuleIds: ["ruc-labeled"],
    sourceText: "RUC: 30123456789",
    visibleValues: ["30123456789"],
  },
]);

// ─── Boundary: LatAm scope isolation ────────────────────────────────────────
export const LATAM_BOUNDARY: readonly BoundaryMaskFixture[] = Object.freeze([
  {
    countryProfileIds: ["br"],
    description:
      "Chilean RUT is masked when BR is selected via global labeled rule",
    expectedRuleIds: ["rut-global-labeled"],
    hiddenValues: ["12.345.678-5"],
    sourceText: "RUT: 12.345.678-5",
  },
  {
    countryProfileIds: ["mx"],
    description:
      "Argentine CUIT is masked when MX is selected (latam-es expansion)",
    expectedRuleIds: ["cuit"],
    hiddenValues: ["20-12345678-6"],
    sourceText: "CUIT: 20-12345678-6",
  },
  {
    countryProfileIds: ["cl", "co"],
    description: "masks RUT (Chile) and NIT (Colombia) when both are selected",
    expectedRuleIds: ["chile-rut", "nit"],
    hiddenValues: ["12.345.678-5", "900.123.456-8"],
    sourceText: "RUT: 12.345.678-5\nNIT: 900.123.456-8",
  },
  {
    countryProfileIds: ["ar", "pe"],
    description: "masks CUIT (AR) and RUC (PE) in dual country scope",
    expectedRuleIds: ["cuit", "ruc-labeled"],
    hiddenValues: ["20-12345678-6", "20123456786"],
    sourceText: "CUIT: 20-12345678-6\nRUC: 20123456786",
  },
  {
    countryProfileIds: ["latam-es"],
    description: "latam-es scope activates all LatAm rules together",
    expectedRuleIds: ["chile-rut", "curp", "rfc"],
    hiddenValues: ["12.345.678-5", "GARC850101HDFRRL09", "GARC850101AB1"],
    sourceText: [
      "RUT: 12.345.678-5",
      "CURP: GARC850101HDFRRL09",
      "RFC: GARC850101AB1",
    ].join("\n"),
  },
  {
    countryProfileIds: ["mx"],
    detectionMode: "global-only",
    description: "CURP and RFC stay visible in global-only mode",
    excludedRuleIds: ["curp", "rfc"],
    sourceText: "CURP: GARC850101HDFRRL09\nRFC: GARC850101AB1",
    visibleValues: ["GARC850101HDFRRL09", "GARC850101AB1"],
  },
]);
