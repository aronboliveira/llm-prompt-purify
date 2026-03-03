import type {
  LocaleMaskFixture,
  NegativeMaskFixture,
} from "../declarations/testing.types";

export const BRAZILIAN_PORTUGUESE_MASK_FIXTURES: readonly LocaleMaskFixture[] =
  Object.freeze([
    {
      countryProfileId: "br",
      description: "masks valid CPF and CNPJ values",
      expectedRuleIds: ["cpf", "cnpj"],
      hiddenValues: ["529.982.247-25", "04.252.011/0001-10"],
      sourceText: "CPF: 529.982.247-25\nCNPJ: 04.252.011/0001-10",
    },
    {
      countryProfileId: "br",
      description: "masks labeled RG, PIS, CEP, and voter registration values",
      expectedRuleIds: [
        "cep-labeled",
        "pis-pasep-labeled",
        "rg-labeled",
        "titulo-eleitor-labeled",
      ],
      hiddenValues: [
        "12.345.678-9",
        "120.44565.38-4",
        "01310-100",
        "1234 5678 9012",
      ],
      sourceText: [
        "RG: 12.345.678-9",
        "PIS: 120.44565.38-4",
        "CEP: 01310-100",
        "Título de eleitor: 1234 5678 9012",
      ].join("\n"),
    },
  ]);

export const LATAM_SPANISH_MASK_FIXTURES: readonly LocaleMaskFixture[] = Object.freeze([
  {
    countryProfileId: "mx",
    description: "masks Mexican CURP and RFC patterns",
    expectedRuleIds: ["curp", "rfc"],
    hiddenValues: ["GODE561231HDFRRN09", "XAXX010101000"],
    sourceText: [
      "CURP: GODE561231HDFRRN09",
      "RFC: XAXX010101000",
    ].join("\n"),
  },
  {
    countryProfileId: "ar",
    description: "masks Argentinian CUIT and DNI values",
    expectedRuleIds: ["cuit", "dni-labeled"],
    hiddenValues: ["20-12345678-3", "12345678"],
    sourceText: [
      "CUIT: 20-12345678-3",
      "DNI: 12345678",
    ].join("\n"),
  },
  {
    countryProfileId: "cl",
    description: "masks Chilean RUT values",
    expectedRuleIds: ["chile-rut"],
    hiddenValues: ["12.345.678-5"],
    sourceText: ["RUT: 12.345.678-5"].join("\n"),
  },
  {
    countryProfileId: "co",
    description: "masks Colombian cédula and NIT values",
    expectedRuleIds: ["cedula-labeled", "nit"],
    hiddenValues: ["1020304050", "900.373.076-1"],
    sourceText: [
      "Cédula de ciudadanía: 1020304050",
      "NIT: 900.373.076-1",
    ].join("\n"),
  },
  {
    countryProfileId: "pe",
    description: "masks Peruvian DNI and RUC values",
    expectedRuleIds: ["dni-labeled", "ruc-labeled"],
    hiddenValues: ["12345678", "20123456789"],
    sourceText: [
      "DNI: 12345678",
      "RUC: 20123456789",
    ].join("\n"),
  },
]);

export const NEGATIVE_LOCALE_MASK_FIXTURES: readonly NegativeMaskFixture[] =
  Object.freeze([
    {
      countryProfileId: "br",
      description: "ignores invalid CPF values",
      excludedRuleIds: ["cpf"],
      sourceText: "CPF: 111.111.111-11",
      visibleValues: ["111.111.111-11"],
    },
    {
      countryProfileId: "br",
      description: "ignores invalid PIS values",
      excludedRuleIds: ["pis-pasep-labeled"],
      sourceText: "PIS: 120.44565.38-0",
      visibleValues: ["120.44565.38-0"],
    },
    {
      countryProfileId: "cl",
      description: "ignores invalid Chilean RUT values",
      excludedRuleIds: ["chile-rut"],
      sourceText: "RUT: 12.345.678-9",
      visibleValues: ["12.345.678-9"],
    },
  ]);
