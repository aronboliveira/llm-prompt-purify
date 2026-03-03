import type {
  BoundaryMaskFixture,
  LocaleMaskFixture,
  NegativeMaskFixture,
} from "../declarations/testing.types";

export const GLOBAL_CREDENTIAL_MASK_FIXTURES: readonly LocaleMaskFixture[] = Object.freeze([
  {
    countryProfileIds: ["us"],
    description: "masks OpenAI-style API keys embedded in prompt instructions",
    expectedRuleIds: ["openai-style-key"],
    hiddenValues: ["sk-proj-ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890"],
    sourceText: "Use api_key=sk-proj-ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890 while debugging.",
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
    expectedRuleIds: ["secret-assignment"],
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
]);

export const GLOBAL_PERSONAL_MASK_FIXTURES: readonly LocaleMaskFixture[] = Object.freeze([
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
    description: "masks labeled English name, address, phone, and passport values",
    expectedRuleIds: ["labeled-address", "labeled-name", "labeled-passport", "labeled-phone"],
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

export const GLOBAL_FINANCIAL_MASK_FIXTURES: readonly LocaleMaskFixture[] = Object.freeze([
  {
    countryProfileIds: ["us"],
    description: "masks valid credit card numbers inside purchase requests",
    expectedRuleIds: ["credit-card"],
    hiddenValues: ["4111 1111 1111 1111"],
    sourceText: "Charge the incident fee to 4111 1111 1111 1111 after the rollback is done.",
  },
  {
    countryProfileIds: ["pt"],
    description: "masks valid IBAN values inside billing notes",
    expectedRuleIds: ["iban"],
    hiddenValues: ["GB82WEST12345698765432"],
    sourceText: "Refund the client to IBAN: GB82WEST12345698765432 before closing the case.",
  },
]);

export const GLOBAL_NEGATIVE_MASK_FIXTURES: readonly NegativeMaskFixture[] = Object.freeze([
  {
    countryProfileIds: ["us"],
    description: "ignores weak token assignments that do not look secret-like",
    excludedRuleIds: ["secret-assignment"],
    sourceText: "token=internal",
    visibleValues: ["internal"],
  },
  {
    countryProfileIds: ["us"],
    description: "ignores invalid email fragments without a valid top-level domain",
    excludedRuleIds: ["email-address"],
    sourceText: "Reach me at maria@example when you finish the draft.",
    visibleValues: ["maria@example"],
  },
  {
    countryProfileIds: ["us"],
    description: "ignores invalid credit card numbers",
    excludedRuleIds: ["credit-card"],
    sourceText: "Card on file: 4111 1111 1111 1112",
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

export const SCOPE_BOUNDARY_MASK_FIXTURES: readonly BoundaryMaskFixture[] = Object.freeze([
  {
    countryProfileIds: ["es"],
    description: "keeps Brazilian CPF visible when Spain is the only selected country but still masks global email",
    excludedRuleIds: ["cpf"],
    expectedRuleIds: ["email-address"],
    hiddenValues: ["maria@example.com"],
    sourceText: ["CPF: 529.982.247-25", "Email: maria@example.com"].join("\n"),
    visibleValues: ["529.982.247-25"],
  },
  {
    countryProfileIds: ["br", "es"],
    description: "masks both Brazilian and Spanish identifiers in multi-country scope",
    expectedRuleIds: ["cpf", "es-dni-labeled"],
    hiddenValues: ["529.982.247-25", "12345678Z"],
    sourceText: ["CPF: 529.982.247-25", "DNI: 12345678Z"].join("\n"),
  },
  {
    countryProfileIds: ["in"],
    description: "keeps Aadhaar visible in global-only mode while still masking global email",
    detectionMode: "global-only",
    excludedRuleIds: ["in-aadhaar-labeled"],
    expectedRuleIds: ["email-address"],
    hiddenValues: ["meera@example.com"],
    sourceText: ["Aadhaar: 2345 6789 1238", "Email: meera@example.com"].join("\n"),
    visibleValues: ["2345 6789 1238"],
  },
  {
    countryProfileIds: ["latam-es"],
    description: "does not activate Portuguese NIF rules inside Spanish-speaking Latin America scope",
    excludedRuleIds: ["pt-nif-labeled"],
    expectedRuleIds: ["chile-rut"],
    hiddenValues: ["12.345.678-5"],
    sourceText: ["NIF: 245716840", "RUT: 12.345.678-5"].join("\n"),
    visibleValues: ["245716840"],
  },
  {
    countryProfileIds: ["us"],
    description: "does not activate Chinese resident ID rules in United States scope",
    excludedRuleIds: ["cn-resident-id-labeled"],
    expectedRuleIds: ["email-address"],
    hiddenValues: ["analyst@example.com"],
    sourceText: [
      "National ID: 11010519491231002X",
      "Email: analyst@example.com",
    ].join("\n"),
    visibleValues: ["11010519491231002X"],
  },
  {
    countryProfileIds: ["cn", "ru"],
    description: "masks identifiers from both China and Russia in multi-country scope",
    expectedRuleIds: ["cn-resident-id-labeled", "ru-snils-labeled"],
    hiddenValues: ["11010519491231002X", "112-233-445 95"],
    sourceText: [
      "National ID: 11010519491231002X",
      "SNILS: 112-233-445 95",
    ].join("\n"),
  },
  {
    countryProfileIds: ["pt", "br"],
    description: "masks both Portugal and Brazil identifiers when both Portuguese scopes are active",
    expectedRuleIds: ["cpf", "pt-nif-labeled"],
    hiddenValues: ["529.982.247-25", "245716840"],
    sourceText: ["CPF: 529.982.247-25", "NIF: 245716840"].join("\n"),
  },
]);
