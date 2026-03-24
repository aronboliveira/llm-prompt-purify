import type {
  BoundaryMaskFixture,
  LocaleMaskFixture,
  NegativeMaskFixture,
} from "../declarations/testing.types";

export const GLOBAL_CREDENTIAL_MASK_FIXTURES: readonly LocaleMaskFixture[] =
  Object.freeze([
    {
      countryProfileIds: ["us"],
      description:
        "masks OpenAI-style API keys embedded in prompt instructions",
      expectedRuleIds: ["openai-style-key"],
      hiddenValues: ["sk-proj-ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890"],
      sourceText:
        "Use api_key=sk-proj-ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890 while debugging.",
    },
    {
      countryProfileIds: ["us"],
      description: "masks AWS access keys and secret access keys together",
      expectedRuleIds: ["aws-access-key", "aws-secret-key"],
      hiddenValues: [
        "AKIAIOSFODNN7EXAMPLE",
        "wJalrXUtnFEMI/K7MDENG+bPxRfiCYEXAMPLEKEY",
      ],
      sourceText: [
        "AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE",
        "aws_secret_access_key = wJalrXUtnFEMI/K7MDENG+bPxRfiCYEXAMPLEKEY",
      ].join("\n"),
    },
    {
      countryProfileIds: ["us"],
      description: "masks GitHub personal access tokens and Slack webhooks",
      expectedRuleIds: ["github-pat", "slack-webhook"],
      hiddenValues: [
        "ghp_1234567890abcdefghijklmnopqrstuvwxyzAB",
        "https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXXXXXX",
      ],
      sourceText: [
        "GitHub token: ghp_1234567890abcdefghijklmnopqrstuvwxyzAB",
        "Slack hook: https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXXXXXX",
      ].join("\n"),
    },
    {
      countryProfileIds: ["br"],
      description: "masks secret assignments in Brazilian Portuguese labels",
      expectedRuleIds: ["keyed-secret-assignment"],
      hiddenValues: ["Sup3rSecreta#2026"],
      sourceText: 'senha = "Sup3rSecreta#2026"',
    },
    {
      countryProfileIds: ["mx"],
      description: "masks bearer tokens and JWTs inside request notes",
      expectedRuleIds: ["bearer-token", "jwt-token"],
      hiddenValues: [
        "mF_9.B5f-4.1JqM",
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.payload.signature",
      ],
      sourceText: [
        "Authorization: Bearer mF_9.B5f-4.1JqM",
        "JWT: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.payload.signature",
      ].join("\n"),
    },
    {
      countryProfileIds: ["pt"],
      description:
        "masks locale-specific secret flags from Portuguese and Spanish vocabulary",
      expectedRuleIds: ["secret-assignment"],
      hiddenValues: [
        "ChaveSegura#2026",
        "ClaveSegura#2026",
        "PalavraP4sse#2026",
      ],
      sourceText: [
        "Chave de API: ChaveSegura#2026",
        "Llave API: ClaveSegura#2026",
        "Palavra-passe: PalavraP4sse#2026",
      ].join("\n"),
    },
  ]);

export const GLOBAL_PERSONAL_MASK_FIXTURES: readonly LocaleMaskFixture[] =
  Object.freeze([
    {
      countryProfileIds: ["br"],
      description: "masks email addresses written inline with punctuation",
      expectedRuleIds: ["email-address"],
      hiddenValues: ["maria.souza+qa@example.com"],
      sourceText:
        "Please answer Clara after she forwards this from maria.souza+qa@example.com, thanks.",
    },
    {
      countryProfileIds: ["us"],
      description:
        "masks labeled English name, address, phone, and passport values",
      expectedRuleIds: [
        "labeled-address",
        "labeled-name",
        "labeled-passport",
        "labeled-phone",
      ],
      hiddenValues: [
        "Emily Carter",
        "441 Market Street, San Francisco, CA",
        "(415) 555-2671",
        "X1234567",
      ],
      sourceText: [
        "Full name: Emily Carter",
        "Address: 441 Market Street, San Francisco, CA",
        "Phone: (415) 555-2671",
        "Passport number: X1234567",
      ].join("\n"),
    },
    {
      countryProfileIds: ["br"],
      description: "masks labeled Portuguese contact blocks",
      expectedRuleIds: ["labeled-address", "labeled-name", "labeled-phone"],
      hiddenValues: [
        "Maria Clara Souza",
        "Rua Haddock Lobo, 595, Sao Paulo",
        "+55 (11) 99876-5432",
      ],
      sourceText: [
        "Nome completo: Maria Clara Souza",
        "Endereço: Rua Haddock Lobo, 595, Sao Paulo",
        "Telefone: +55 (11) 99876-5432",
      ].join("\n"),
    },
    {
      countryProfileIds: ["co"],
      description: "masks labeled Spanish contact blocks in Latin America",
      expectedRuleIds: ["labeled-address", "labeled-name", "labeled-phone"],
      hiddenValues: [
        "Camila Torres Rivera",
        "Calle 85 # 12-34, Bogotá",
        "+57 301 222 3344",
      ],
      sourceText: [
        "Nombre completo: Camila Torres Rivera",
        "Dirección: Calle 85 # 12-34, Bogotá",
        "Teléfono: +57 301 222 3344",
      ].join("\n"),
    },
  ]);

export const GLOBAL_FINANCIAL_MASK_FIXTURES: readonly LocaleMaskFixture[] =
  Object.freeze([
    {
      countryProfileIds: ["us"],
      description: "masks valid credit card numbers inside purchase requests",
      expectedRuleIds: ["credit-card"],
      hiddenValues: ["4111 1111 1111 1111"],
      sourceText:
        "Charge the incident fee to 4111 1111 1111 1111 after the rollback is done.",
    },
    {
      countryProfileIds: ["pt"],
      description: "masks valid IBAN values inside billing notes",
      expectedRuleIds: ["iban"],
      hiddenValues: ["GB82WEST12345698765432"],
      sourceText:
        "Refund the client to IBAN: GB82WEST12345698765432 before closing the case.",
    },
  ]);

export const GLOBAL_NEGATIVE_MASK_FIXTURES: readonly NegativeMaskFixture[] =
  Object.freeze([
    {
      countryProfileIds: ["us"],
      description:
        "ignores weak token assignments that do not look secret-like",
      excludedRuleIds: ["secret-assignment"],
      sourceText: "token=internal",
      visibleValues: ["internal"],
    },
    {
      countryProfileIds: ["pt"],
      description:
        "ignores localized credential flags when the assigned value is weak",
      excludedRuleIds: ["secret-assignment"],
      sourceText: "Chave de API: interna",
      visibleValues: ["interna"],
    },
    {
      countryProfileIds: ["us"],
      description:
        "ignores invalid email fragments without a valid top-level domain",
      excludedRuleIds: ["email-address"],
      sourceText: "Reach me at maria@example when you finish the draft.",
      visibleValues: ["maria@example"],
    },
    {
      countryProfileIds: ["us"],
      description: "ignores invalid credit card numbers",
      excludedRuleIds: ["credit-card"],
      sourceText: "4111 1111 1111 1112",
      visibleValues: ["4111 1111 1111 1112"],
    },
    {
      countryProfileIds: ["us"],
      description: "ignores invalid IBAN values that fail checksum validation",
      excludedRuleIds: ["iban"],
      sourceText: "IBAN: GB82BADD1234ABCD87654321",
      visibleValues: ["GB82BADD1234ABCD87654321"],
    },
    {
      countryProfileIds: ["us"],
      description: "ignores phone labels with too few digits",
      excludedRuleIds: ["labeled-phone"],
      sourceText: "Phone: 1234567",
      visibleValues: ["Phone: 1234567"],
    },
    {
      countryProfileIds: ["us"],
      description: "ignores one-word names that look like product labels",
      excludedRuleIds: ["labeled-name"],
      sourceText: "Name: ProductX",
      visibleValues: ["ProductX"],
    },
    {
      countryProfileIds: ["us"],
      description: "ignores non-address prose under address labels",
      excludedRuleIds: ["labeled-address"],
      sourceText: "Address: roadmap section",
      visibleValues: ["roadmap section"],
    },
    {
      countryProfileIds: ["us"],
      description: "ignores passport labels with values that are too short",
      excludedRuleIds: ["labeled-passport"],
      sourceText: "Passport: 123",
      visibleValues: ["Passport: 123"],
    },
  ]);

export const SCOPE_BOUNDARY_MASK_FIXTURES: readonly BoundaryMaskFixture[] =
  Object.freeze([
    {
      countryProfileIds: ["es"],
      description:
        "masks labeled Brazilian CPF via global rule even when Spain is the only selected country",
      expectedRuleIds: ["cpf", "email-address"],
      hiddenValues: ["529.982.247-25", "maria@example.com"],
      sourceText: ["CPF: 529.982.247-25", "Email: maria@example.com"].join(
        "\n",
      ),
    },
    {
      countryProfileIds: ["br", "es"],
      description:
        "masks both Brazilian and Spanish identifiers in multi-country scope",
      expectedRuleIds: ["cpf", "es-dni-labeled"],
      hiddenValues: ["529.982.247-25", "12345678Z"],
      sourceText: ["CPF: 529.982.247-25", "DNI: 12345678Z"].join("\n"),
    },
    {
      countryProfileIds: ["in"],
      description:
        "keeps Aadhaar visible in global-only mode while still masking global email",
      detectionMode: "global-only",
      excludedRuleIds: ["in-aadhaar-labeled"],
      expectedRuleIds: ["email-address"],
      hiddenValues: ["meera@example.com"],
      sourceText: ["Aadhaar: 2345 6789 1238", "Email: meera@example.com"].join(
        "\n",
      ),
      visibleValues: ["2345 6789 1238"],
    },
    {
      countryProfileIds: ["latam-es"],
      description:
        "does not activate Portuguese NIF rules inside Spanish-speaking Latin America scope",
      excludedRuleIds: ["pt-nif-labeled"],
      expectedRuleIds: ["chile-rut"],
      hiddenValues: ["12.345.678-5"],
      sourceText: ["NIF: 245716840", "RUT: 12.345.678-5"].join("\n"),
      visibleValues: ["245716840"],
    },
    {
      countryProfileIds: ["us"],
      description:
        "masks Chinese resident ID globally even in United States scope",
      expectedRuleIds: ["cn-resident-id", "email-address"],
      hiddenValues: ["11010519491231002X", "analyst@example.com"],
      sourceText: [
        "National ID: 11010519491231002X",
        "Email: analyst@example.com",
      ].join("\n"),
    },
    {
      countryProfileIds: ["cn", "ru"],
      description:
        "masks identifiers from both China and Russia in multi-country scope",
      expectedRuleIds: ["cn-resident-id-labeled", "ru-snils-labeled"],
      hiddenValues: ["11010519491231002X", "112-233-445 95"],
      sourceText: [
        "National ID: 11010519491231002X",
        "SNILS: 112-233-445 95",
      ].join("\n"),
    },
    {
      countryProfileIds: ["pt", "br"],
      description:
        "masks both Portugal and Brazil identifiers when both Portuguese scopes are active",
      expectedRuleIds: ["cpf", "pt-nif-labeled"],
      hiddenValues: ["529.982.247-25", "245716840"],
      sourceText: ["CPF: 529.982.247-25", "NIF: 245716840"].join("\n"),
    },
  ]);

export const FUZZY_LABEL_MASK_FIXTURES: readonly LocaleMaskFixture[] =
  Object.freeze([
    {
      countryProfileIds: ["us"],
      description:
        "masks password assignments when the label contains a small typo",
      expectedRuleIds: ["secret-assignment"],
      hiddenValues: ["Sup3rSecreta#2026"],
      sourceText: "Passwrod: Sup3rSecreta#2026",
    },
    {
      countryProfileIds: ["co"],
      description:
        "masks phone numbers when the Spanish phone label is misspelled",
      expectedRuleIds: ["labeled-phone"],
      hiddenValues: ["+57 301 222 3344"],
      sourceText: "Telefono principal: +57 301 222 3344",
    },
    {
      countryProfileIds: ["br"],
      description:
        "masks names when the Portuguese full-name label contains a typo",
      expectedRuleIds: ["labeled-name"],
      hiddenValues: ["Maria Clara Souza"],
      sourceText: "Nome compoleto: Maria Clara Souza",
    },
    {
      countryProfileIds: ["us"],
      description:
        "masks addresses when the English address label is misspelled",
      expectedRuleIds: ["labeled-address"],
      hiddenValues: ["441 Market Street, San Francisco, CA"],
      sourceText: "Adress: 441 Market Street, San Francisco, CA",
    },
    {
      countryProfileIds: ["co"],
      description:
        "masks cédula values when the label is misspelled but still close",
      expectedRuleIds: ["cedula-labeled"],
      hiddenValues: ["1020304050"],
      sourceText: "Cedla de ciudadania: 1020304050",
    },
    {
      countryProfileIds: ["in"],
      description: "masks Aadhaar values when the label is misspelled",
      expectedRuleIds: ["in-aadhaar-labeled"],
      hiddenValues: ["2345 6789 1238"],
      sourceText: "Aadhr: 2345 6789 1238",
    },
    {
      countryProfileIds: ["pt"],
      description:
        "masks Portuguese NIF values when the long-form label is slightly misspelled",
      expectedRuleIds: ["pt-nif-labeled"],
      hiddenValues: ["245716840"],
      sourceText: "Numero de identificacao fsical: 245716840",
    },
    {
      countryProfileIds: ["cn"],
      description:
        "masks Chinese resident IDs when the pinyin label is spaced differently",
      expectedRuleIds: ["cn-resident-id-labeled"],
      hiddenValues: ["11010519491231002X"],
      sourceText: "Shen fen zheng: 11010519491231002X",
    },
    {
      countryProfileIds: ["ru"],
      description:
        "masks Russian SNILS values when the Latin label contains an OCR digit",
      expectedRuleIds: ["ru-snils-labeled"],
      hiddenValues: ["112-233-445 95"],
      sourceText: "Sni1s: 112-233-445 95",
    },
    {
      countryProfileIds: ["in"],
      description:
        "masks Indian PAN values when the long-form label is misspelled",
      expectedRuleIds: ["in-pan-labeled"],
      hiddenValues: ["ABCDE1234F"],
      sourceText: "Permament account number: ABCDE1234F",
    },
    {
      countryProfileIds: ["in"],
      description:
        "masks Indian GSTIN values when the long-form label contains OCR noise",
      expectedRuleIds: ["in-gstin-labeled"],
      hiddenValues: ["27ABCDE1234F1Z5"],
      sourceText: "Goods and services tax nurnber: 27ABCDE1234F1Z5",
    },
    {
      countryProfileIds: ["pe"],
      description:
        "masks Peruvian RUC values when the long-form label is fuzzy matched",
      expectedRuleIds: ["ruc-labeled"],
      hiddenValues: ["20123456786"],
      sourceText: "Registro un1co de contribuyentes: 20123456786",
    },
  ]);

export const FUZZY_LABEL_NEGATIVE_FIXTURES: readonly NegativeMaskFixture[] =
  Object.freeze([
    {
      countryProfileIds: ["us"],
      description:
        "does not mask arbitrary prose labels that only vaguely resemble address",
      excludedRuleIds: ["labeled-address"],
      sourceText: "Addressable: roadmap section",
      visibleValues: ["roadmap section"],
    },
    {
      countryProfileIds: ["us"],
      description:
        "does not mask short weak secrets even with a password-like typo label",
      excludedRuleIds: ["secret-assignment"],
      sourceText: "Passwrod: admin",
      visibleValues: ["admin"],
    },
    {
      countryProfileIds: ["co"],
      description:
        "does not mask phone labels with invalid value length even if the label is close",
      excludedRuleIds: ["labeled-phone"],
      sourceText: "Telefono principal: 12345",
      visibleValues: ["12345"],
    },
    {
      countryProfileIds: ["in"],
      description:
        "does not mask malformed Aadhaar values even when the label is fuzzy-matched",
      excludedRuleIds: ["in-aadhaar-labeled"],
      sourceText: "Aadhr: 2345 6789 1235",
      visibleValues: ["2345 6789 1235"],
    },
    {
      countryProfileIds: ["pt"],
      description:
        "does not mask invalid NIF values through the fuzzy label path",
      excludedRuleIds: ["pt-nif-labeled"],
      sourceText: "Numero de identificacao fsical: 245716845",
      visibleValues: ["245716845"],
    },
    {
      countryProfileIds: ["cn"],
      description:
        "does not mask invalid Chinese resident IDs through spaced pinyin labels",
      excludedRuleIds: ["cn-resident-id-labeled"],
      sourceText: "Shen fen zheng: 110105194912310021",
      visibleValues: ["110105194912310021"],
    },
    {
      countryProfileIds: ["in"],
      description:
        "does not mask invalid PAN values through fuzzy long-form labels",
      excludedRuleIds: ["in-pan-labeled"],
      sourceText: "Permament account number: ABCD1234F",
      visibleValues: ["ABCD1234F"],
    },
    {
      countryProfileIds: ["in"],
      description:
        "does not mask invalid GSTIN values through fuzzy long-form labels",
      excludedRuleIds: ["in-gstin-labeled"],
      sourceText: "Goods and services tax nurnber: 27ABCDE1234F1Y5",
      visibleValues: ["27ABCDE1234F1Y5"],
    },
    {
      countryProfileIds: ["pe"],
      description:
        "does not mask invalid RUC values through fuzzy long-form labels",
      excludedRuleIds: ["ruc-labeled"],
      sourceText: "Registro un1co de contribuyentes: 20123456780",
      visibleValues: ["20123456780"],
    },
  ]);
