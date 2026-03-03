import type {
  LocaleMaskFixture,
  NegativeMaskFixture,
} from "../declarations/testing.types";

export const BRAZILIAN_PORTUGUESE_MASK_FIXTURES: readonly LocaleMaskFixture[] =
  Object.freeze([
    {
      countryProfileIds: ["br"],
      description: "masks valid CPF and CNPJ values",
      expectedRuleIds: ["cpf", "cnpj"],
      hiddenValues: ["529.982.247-25", "04.252.011/0001-10"],
      sourceText: "CPF: 529.982.247-25\nCNPJ: 04.252.011/0001-10",
    },
    {
      countryProfileIds: ["br"],
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
    {
      countryProfileIds: ["pt"],
      description: "masks Portuguese NIF and NISS values",
      expectedRuleIds: ["pt-nif-labeled", "pt-niss-labeled"],
      hiddenValues: ["245716840", "12345678901"],
      sourceText: ["NIF: 245716840", "NISS: 12345678901"].join("\n"),
    },
  ]);

export const GLOBAL_SCOPE_MASK_FIXTURES: readonly LocaleMaskFixture[] = Object.freeze([
  {
    countryProfileIds: ["br"],
    detectionMode: "global-only",
    description: "keeps credentials and email masking when country-specific rules are disabled",
    expectedRuleIds: ["email-address", "openai-style-key"],
    hiddenValues: ["maria@example.com", "sk-proj-ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890"],
    sourceText: [
      "CPF: 529.982.247-25",
      "Email: maria@example.com",
      "Token: sk-proj-ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890",
    ].join("\n"),
  },
]);

export const INTERNATIONAL_MASK_FIXTURES: readonly LocaleMaskFixture[] = Object.freeze([
  {
    countryProfileIds: ["mx"],
    description: "masks Mexican CURP and RFC patterns",
    expectedRuleIds: ["curp", "rfc"],
    hiddenValues: ["GODE561231HDFRRN09", "XAXX010101000"],
    sourceText: ["CURP: GODE561231HDFRRN09", "RFC: XAXX010101000"].join("\n"),
  },
  {
    countryProfileIds: ["ar"],
    description: "masks Argentinian CUIT and DNI values",
    expectedRuleIds: ["cuit", "dni-labeled"],
    hiddenValues: ["20-12345678-6", "12345678"],
    sourceText: ["CUIT: 20-12345678-6", "DNI: 12345678"].join("\n"),
  },
  {
    countryProfileIds: ["cl"],
    description: "masks Chilean RUT values",
    expectedRuleIds: ["chile-rut"],
    hiddenValues: ["12.345.678-5"],
    sourceText: ["RUT: 12.345.678-5"].join("\n"),
  },
    {
      countryProfileIds: ["co"],
      description: "masks Colombian cédula and NIT values",
      expectedRuleIds: ["cedula-labeled", "nit"],
      hiddenValues: ["1020304050", "9003730764"],
      sourceText: ["Cédula de ciudadanía: 1020304050", "NIT: 9003730764"].join("\n"),
  },
  {
    countryProfileIds: ["pe"],
    description: "masks Peruvian DNI and RUC values",
    expectedRuleIds: ["dni-labeled", "ruc-labeled"],
    hiddenValues: ["12345678", "20123456786"],
    sourceText: ["DNI: 12345678", "RUC: 20123456786"].join("\n"),
  },
  {
    countryProfileIds: ["es"],
    description: "masks Spanish DNI and NIE values",
    expectedRuleIds: ["es-dni-labeled", "es-nie-labeled"],
    hiddenValues: ["12345678Z", "X1234567L"],
    sourceText: ["DNI: 12345678Z", "NIE: X1234567L"].join("\n"),
  },
  {
    countryProfileIds: ["cn"],
    description: "masks labeled Chinese resident IDs and mobile numbers",
    expectedRuleIds: ["cn-phone", "cn-resident-id-labeled"],
    hiddenValues: ["11010519491231002X", "+86 13800138000"],
    sourceText: [
      "National ID: 11010519491231002X",
      "Phone: +86 13800138000",
    ].join("\n"),
  },
  {
    countryProfileIds: ["ru"],
    description: "masks Russian INN and SNILS values",
    expectedRuleIds: ["ru-inn-labeled", "ru-snils-labeled"],
    hiddenValues: ["7715964180", "112-233-445 95"],
    sourceText: ["INN: 7715964180", "SNILS: 112-233-445 95"].join("\n"),
  },
    {
      countryProfileIds: ["in"],
      description: "masks Indian Aadhaar, PAN, and GSTIN values",
      expectedRuleIds: ["in-aadhaar-labeled", "in-gstin-labeled", "in-pan-labeled"],
      hiddenValues: ["2345 6789 1238", "ABCDE1234F", "27ABCDE1234F1Z5"],
      sourceText: [
        "Aadhaar: 2345 6789 1238",
        "PAN: ABCDE1234F",
        "GSTIN: 27ABCDE1234F1Z5",
      ].join("\n"),
  },
  {
    countryProfileIds: ["latam-es"],
    description: "masks overlapping Spanish-speaking LatAm identifiers from multiple countries",
    expectedRuleIds: ["cedula-labeled", "chile-rut", "cuit", "curp", "dni-labeled", "rfc"],
    hiddenValues: [
      "12.345.678-5",
      "20-12345678-6",
      "1020304050",
      "87654321",
      "GODE561231HDFRRN09",
      "XAXX010101000",
    ],
    sourceText: [
      "RUT: 12.345.678-5",
      "CUIT: 20-12345678-6",
      "Cédula: 1020304050",
      "DNI: 87654321",
      "CURP: GODE561231HDFRRN09",
      "RFC: XAXX010101000",
    ].join("\n"),
  },
  {
    countryProfileIds: ["br", "es"],
    description: "supports multi-country scans when the selected languages are compatible with the prompt mix",
    expectedRuleIds: ["cpf", "es-dni-labeled"],
    hiddenValues: ["529.982.247-25", "12345678Z"],
    sourceText: ["CPF: 529.982.247-25", "DNI: 12345678Z"].join("\n"),
  },
]);

export const NEGATIVE_LOCALE_MASK_FIXTURES: readonly NegativeMaskFixture[] =
  Object.freeze([
    {
      countryProfileIds: ["br"],
      description: "ignores invalid CPF values",
      excludedRuleIds: ["cpf"],
      sourceText: "CPF: 111.111.111-11",
      visibleValues: ["111.111.111-11"],
    },
    {
      countryProfileIds: ["br"],
      description: "ignores invalid PIS values",
      excludedRuleIds: ["pis-pasep-labeled"],
      sourceText: "PIS: 120.44565.38-0",
      visibleValues: ["120.44565.38-0"],
    },
    {
      countryProfileIds: ["cl"],
      description: "ignores invalid Chilean RUT values",
      excludedRuleIds: ["chile-rut"],
      sourceText: "RUT: 12.345.678-9",
      visibleValues: ["12.345.678-9"],
    },
    {
      countryProfileIds: ["pt"],
      description: "ignores invalid Portuguese NIF values",
      excludedRuleIds: ["pt-nif-labeled"],
      sourceText: "NIF: 245716845",
      visibleValues: ["245716845"],
    },
    {
      countryProfileIds: ["es"],
      description: "ignores invalid Spanish NIE values",
      excludedRuleIds: ["es-nie-labeled"],
      sourceText: "NIE: X1234567A",
      visibleValues: ["X1234567A"],
    },
    {
      countryProfileIds: ["cn"],
      description: "ignores invalid Chinese resident IDs",
      excludedRuleIds: ["cn-resident-id-labeled"],
      sourceText: "National ID: 110105194912310021",
      visibleValues: ["110105194912310021"],
    },
    {
      countryProfileIds: ["ru"],
      description: "ignores invalid Russian INN values",
      excludedRuleIds: ["ru-inn-labeled"],
      sourceText: "INN: 7715964181",
      visibleValues: ["7715964181"],
    },
    {
      countryProfileIds: ["in"],
      description: "ignores invalid Aadhaar values",
      excludedRuleIds: ["in-aadhaar-labeled"],
      sourceText: "Aadhaar: 2345 6789 1235",
      visibleValues: ["2345 6789 1235"],
    },
  ]);
