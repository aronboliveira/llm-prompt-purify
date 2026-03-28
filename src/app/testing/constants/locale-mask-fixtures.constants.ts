import type {
  LocaleMaskFixture,
  NegativeMaskFixture,
} from "../declarations/testing.types";

export const BRAZILIAN_PORTUGUESE_MASK_FIXTURES: readonly LocaleMaskFixture[] =
  Object.freeze([
    {
      countryProfileIds: ["br"],
      description: "masks valid CPF and CNPJ format variations",
      expectedRuleIds: ["cpf", "cnpj"],
      hiddenValues: [
        "529.982.247-25",
        "347.066.120-04",
        "04.252.011/0001-10",
        "11.222.333/0001-81",
        "12.345.678/0001-95",
        "98.765.432/0001-98",
      ],
      sourceText: [
        "CPF: 529.982.247-25",
        "CPF dependente: 347.066.120-04",
        "CNPJ: 04.252.011/0001-10",
        "CNPJ filial 1: 11.222.333/0001-81",
        "CNPJ filial 2: 12.345.678/0001-95",
        "CNPJ filial 3: 98.765.432/0001-98",
      ].join("\n"),
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
      countryProfileIds: ["br"],
      description:
        "masks Brazilian identifiers through expanded local flag dictionaries",
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
        "Carteira de identidade: 12.345.678-9",
        "Número do PIS: 120.44565.38-4",
        "Código postal: 01310-100",
        "Inscrição eleitoral: 1234 5678 9012",
      ].join("\n"),
    },
    {
      countryProfileIds: ["pt"],
      description: "masks Portuguese NIF and NISS values",
      expectedRuleIds: ["pt-nif-labeled", "pt-niss-labeled"],
      hiddenValues: ["245716840", "12345678901"],
      sourceText: ["NIF: 245716840", "NISS: 12345678901"].join("\n"),
    },
    {
      countryProfileIds: ["pt"],
      description:
        "masks Portuguese identifiers through expanded local flag dictionaries",
      expectedRuleIds: ["pt-nif-labeled", "pt-niss-labeled"],
      hiddenValues: ["245716840", "12345678901"],
      sourceText: [
        "Número de contribuinte: 245716840",
        "Número de segurança social: 12345678901",
      ].join("\n"),
    },
    {
      countryProfileIds: ["br"],
      description:
        "masks Brazilian phone numbers across many format variations (high-entropy)",
      expectedRuleIds: ["br-phone"],
      hiddenValues: [
        "+55 (11) 99876-5432",
        "(21) 99999-8888",
        "21999998888",
        "+55 21 99999-8888",
        "+55 (21) 3221-5678",
        "(11) 3345-6789",
        "1134567890",
        "+5511987654321",
        "(31) 98765-4321",
        "+55 31 98765 4321",
        "+55 61 99123-4567",
        "(61) 32145678",
      ],
      sourceText: [
        "Celular: +55 (11) 99876-5432",
        "Tel pessoal: (21) 99999-8888",
        "Emergência: 21999998888",
        "Contato: +55 21 99999-8888",
        "Fixo: +55 (21) 3221-5678",
        "Comercial: (11) 3345-6789",
        "Recado: 1134567890",
        "WhatsApp: +5511987654321",
        "Celular 2: (31) 98765-4321",
        "SMS: +55 31 98765 4321",
        "Brasília: +55 61 99123-4567",
        "Escritório: (61) 32145678",
      ].join("\n"),
    },
  ]);

export const GLOBAL_SCOPE_MASK_FIXTURES: readonly LocaleMaskFixture[] =
  Object.freeze([
    {
      countryProfileIds: ["br"],
      detectionMode: "global-only",
      description:
        "keeps credentials and email masking when country-specific rules are disabled",
      expectedRuleIds: ["email-address", "openai-style-key"],
      hiddenValues: [
        "maria@example.com",
        "sk-proj-ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890",
      ],
      sourceText: [
        "CPF: 529.982.247-25",
        "Email: maria@example.com",
        "Token: sk-proj-ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890",
      ].join("\n"),
    },
  ]);

export const INTERNATIONAL_MASK_FIXTURES: readonly LocaleMaskFixture[] =
  Object.freeze([
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
      sourceText: ["Cédula de ciudadanía: 1020304050", "NIT: 9003730764"].join(
        "\n",
      ),
    },
    {
      countryProfileIds: ["co"],
      description: "masks Colombian identifiers through expanded cédula flags",
      expectedRuleIds: ["cedula-labeled", "nit"],
      hiddenValues: ["1020304050", "9003730764"],
      sourceText: ["Número de cédula: 1020304050", "NIT: 9003730764"].join(
        "\n",
      ),
    },
    {
      countryProfileIds: ["pe"],
      description: "masks Peruvian DNI and RUC values",
      expectedRuleIds: ["dni-labeled", "ruc-labeled"],
      hiddenValues: ["12345678", "20123456786"],
      sourceText: ["DNI: 12345678", "RUC: 20123456786"].join("\n"),
    },
    {
      countryProfileIds: ["pe"],
      description:
        "masks Peruvian RUC values through expanded local flag dictionaries",
      expectedRuleIds: ["dni-labeled", "ruc-labeled"],
      hiddenValues: ["12345678", "20123456786"],
      sourceText: [
        "Documento de identidad: 12345678",
        "Registro único de contribuyentes: 20123456786",
      ].join("\n"),
    },
    {
      countryProfileIds: ["es"],
      description: "masks Spanish DNI and NIE values",
      expectedRuleIds: ["es-dni-labeled", "es-nie-labeled"],
      hiddenValues: ["12345678Z", "X1234567L"],
      sourceText: ["DNI: 12345678Z", "NIE: X1234567L"].join("\n"),
    },
    {
      countryProfileIds: ["es"],
      description:
        "masks Spanish identifiers through expanded local flag dictionaries",
      expectedRuleIds: ["es-dni-labeled", "es-nie-labeled"],
      hiddenValues: ["12345678Z", "X1234567L"],
      sourceText: [
        "Documento de identidad: 12345678Z",
        "Identidad de extranjero: X1234567L",
      ].join("\n"),
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
      countryProfileIds: ["cn"],
      description:
        "masks Chinese resident IDs through native-script flag dictionaries",
      expectedRuleIds: ["cn-phone", "cn-resident-id-labeled"],
      hiddenValues: ["11010519491231002X", "+86 13800138000"],
      sourceText: [
        "身份证号: 11010519491231002X",
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
      countryProfileIds: ["ru"],
      description:
        "masks Russian identifiers through Cyrillic flag dictionaries",
      expectedRuleIds: ["ru-inn-labeled", "ru-snils-labeled"],
      hiddenValues: ["7715964180", "112-233-445 95"],
      sourceText: [
        "Идентификационный номер налогоплательщика: 7715964180",
        "Страховой номер: 112-233-445 95",
      ].join("\n"),
    },
    {
      countryProfileIds: ["in"],
      description: "masks Indian Aadhaar, PAN, and GSTIN values",
      expectedRuleIds: [
        "in-aadhaar-labeled",
        "in-gstin-labeled",
        "in-pan-labeled",
      ],
      hiddenValues: ["2345 6789 1238", "ABCDE1234F", "27ABCDE1234F1Z5"],
      sourceText: [
        "Aadhaar: 2345 6789 1238",
        "PAN: ABCDE1234F",
        "GSTIN: 27ABCDE1234F1Z5",
      ].join("\n"),
    },
    {
      countryProfileIds: ["in"],
      description:
        "masks Indian identifiers through expanded English flag dictionaries",
      expectedRuleIds: [
        "in-aadhaar-labeled",
        "in-gstin-labeled",
        "in-pan-labeled",
      ],
      hiddenValues: ["2345 6789 1238", "ABCDE1234F", "27ABCDE1234F1Z5"],
      sourceText: [
        "Aadhaar number: 2345 6789 1238",
        "PAN number: ABCDE1234F",
        "GST identification number: 27ABCDE1234F1Z5",
      ].join("\n"),
    },
    {
      countryProfileIds: ["latam-es"],
      description:
        "masks overlapping Spanish-speaking LatAm identifiers from multiple countries",
      expectedRuleIds: [
        "cedula-labeled",
        "chile-rut",
        "cuit",
        "curp",
        "dni-labeled",
        "rfc",
      ],
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
      description:
        "supports multi-country scans when the selected languages are compatible with the prompt mix",
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
      countryProfileIds: ["pt"],
      description: "ignores invalid Portuguese NIF values",
      excludedRuleIds: ["pt-nif-labeled"],
      sourceText: "NIF: 245716845",
      visibleValues: ["245716845"],
    },
    {
      countryProfileIds: ["pt"],
      description:
        "ignores invalid Portuguese identifiers through expanded local flags",
      excludedRuleIds: ["pt-nif-labeled", "pt-niss-labeled"],
      sourceText: [
        "Número de contribuinte: 245716845",
        "Número de segurança social: 11111111111",
      ].join("\n"),
      visibleValues: ["245716845", "11111111111"],
    },
    {
      countryProfileIds: ["es"],
      description: "ignores invalid Spanish NIE values",
      excludedRuleIds: ["es-nie-labeled"],
      sourceText: "NIE: X1234567A",
      visibleValues: ["X1234567A"],
    },
    {
      countryProfileIds: ["es"],
      description:
        "ignores invalid Spanish identifiers through expanded local flags",
      excludedRuleIds: ["es-dni-labeled", "es-nie-labeled"],
      sourceText: [
        "Documento de identidad: 12345678A",
        "Identidad de extranjero: X1234567A",
      ].join("\n"),
      visibleValues: ["12345678A", "X1234567A"],
    },
    {
      countryProfileIds: ["cn"],
      description: "ignores invalid Chinese resident IDs",
      excludedRuleIds: ["cn-resident-id-labeled"],
      sourceText: "National ID: 110105194912310021",
      visibleValues: ["110105194912310021"],
    },
    {
      countryProfileIds: ["cn"],
      description:
        "ignores invalid Chinese resident IDs through native-script flags",
      excludedRuleIds: ["cn-resident-id-labeled"],
      sourceText: "身份证号: 110105194912310021",
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
      countryProfileIds: ["ru"],
      description: "ignores invalid Russian identifiers through Cyrillic flags",
      excludedRuleIds: ["ru-inn-labeled", "ru-snils-labeled"],
      sourceText: [
        "Идентификационный номер налогоплательщика: 7715964181",
        "Страховой номер: 112-233-445 94",
      ].join("\n"),
      visibleValues: ["7715964181", "112-233-445 94"],
    },
    {
      countryProfileIds: ["in"],
      description: "ignores invalid Aadhaar values",
      excludedRuleIds: ["in-aadhaar-labeled"],
      sourceText: "Aadhaar: 2345 6789 1235",
      visibleValues: ["2345 6789 1235"],
    },
    {
      countryProfileIds: ["in"],
      description:
        "ignores invalid Indian identifiers through expanded English flags",
      excludedRuleIds: [
        "in-aadhaar-labeled",
        "in-pan-labeled",
        "in-gstin-labeled",
      ],
      sourceText: [
        "Aadhaar number: 2345 6789 1235",
        "PAN number: ABCD1234F",
        "GST identification number: 27ABCDE1234F1Y5",
      ].join("\n"),
      visibleValues: ["2345 6789 1235", "ABCD1234F", "27ABCDE1234F1Y5"],
    },
  ]);
