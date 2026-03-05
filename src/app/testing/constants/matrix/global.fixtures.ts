/**
 * Global (country-agnostic) matrix fixtures.
 * Covers: email, JWT, API keys (OpenAI / AWS / GitHub), Slack webhook,
 *         secret assignment, bearer token, credit card, IBAN,
 *         labeled phone, labeled name, labeled address, labeled passport.
 */
import type {
  BoundaryMaskFixture,
  LocaleMaskFixture,
  NegativeMaskFixture,
} from "../../declarations/testing.types";

// ─── Positive: Email ────────────────────────────────────────────────────────
export const EMAIL_POSITIVE: readonly LocaleMaskFixture[] = Object.freeze([
  {
    countryProfileIds: [],
    description: "masks simple email address",
    detectionMode: "global-only",
    expectedRuleIds: ["email-address"],
    hiddenValues: ["alice@example.com"],
    sourceText: "Contact alice@example.com for details.",
  },
  {
    countryProfileIds: [],
    description: "masks email with plus-tag and subdomain",
    detectionMode: "global-only",
    expectedRuleIds: ["email-address"],
    hiddenValues: ["user+tag@mail.corp.io"],
    sourceText: "Send to user+tag@mail.corp.io immediately.",
  },
  {
    countryProfileIds: [],
    description: "masks email with dots and digits in local part",
    detectionMode: "global-only",
    expectedRuleIds: ["email-address"],
    hiddenValues: ["j.doe42@university.edu"],
    sourceText: "Professor j.doe42@university.edu is available.",
  },
  {
    countryProfileIds: [],
    description: "masks email with percent-encoded local",
    detectionMode: "global-only",
    expectedRuleIds: ["email-address"],
    hiddenValues: ["postmaster@sub.domain.co.uk"],
    sourceText: "Reach postmaster@sub.domain.co.uk for abuse.",
  },
]);

// ─── Negative: Email ────────────────────────────────────────────────────────
export const EMAIL_NEGATIVE: readonly NegativeMaskFixture[] = Object.freeze([
  {
    countryProfileIds: [],
    description: "does NOT mask incomplete email (no TLD)",
    detectionMode: "global-only",
    excludedRuleIds: ["email-address"],
    sourceText: "User alice@localhost is local.",
    visibleValues: ["alice@localhost"],
  },
  {
    countryProfileIds: [],
    description: "does NOT mask @-mention without domain",
    detectionMode: "global-only",
    excludedRuleIds: ["email-address"],
    sourceText: "Mention @user in the chat.",
    visibleValues: ["@user"],
  },
]);

// ─── Positive: JWT Token ────────────────────────────────────────────────────
export const JWT_POSITIVE: readonly LocaleMaskFixture[] = Object.freeze([
  {
    countryProfileIds: [],
    description: "masks standard JWT with three segments",
    detectionMode: "global-only",
    expectedRuleIds: ["jwt-token"],
    hiddenValues: [
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIn0.Q2hoMHdpbmcgaXMgZnVu",
    ],
    sourceText:
      "Token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIn0.Q2hoMHdpbmcgaXMgZnVu",
  },
  {
    countryProfileIds: [],
    description: "masks JWT embedded in authorization header",
    detectionMode: "global-only",
    expectedRuleIds: ["jwt-token"],
    hiddenValues: [
      "eyJhbGciOiJSUzI1NiJ9.eyJpc3MiOiJhdXRoMCJ9.dGVzdF9zaWduYXR1cmU",
    ],
    sourceText:
      "Authorization: Bearer eyJhbGciOiJSUzI1NiJ9.eyJpc3MiOiJhdXRoMCJ9.dGVzdF9zaWduYXR1cmU",
  },
]);

// ─── Positive: OpenAI-style API Key ─────────────────────────────────────────
export const OPENAI_KEY_POSITIVE: readonly LocaleMaskFixture[] = Object.freeze([
  {
    countryProfileIds: [],
    description: "masks sk-proj- prefixed OpenAI key",
    detectionMode: "global-only",
    expectedRuleIds: ["openai-style-key"],
    hiddenValues: ["sk-proj-AbCdEfGhIjKlMnOpQrStUvWx"],
    sourceText: "OPENAI_API_KEY=sk-proj-AbCdEfGhIjKlMnOpQrStUvWx",
  },
  {
    countryProfileIds: [],
    description: "masks sk- prefixed key in code block",
    detectionMode: "global-only",
    expectedRuleIds: ["openai-style-key"],
    hiddenValues: ["sk-1234567890abcdefghijklmn"],
    sourceText: 'const key = "sk-1234567890abcdefghijklmn";',
  },
  {
    countryProfileIds: [],
    description: "masks sk-live- prefixed key",
    detectionMode: "global-only",
    expectedRuleIds: ["openai-style-key"],
    hiddenValues: ["sk-live-xY9zW8vU7tS6rQ5pO4nM3lK2"],
    sourceText: "API key is sk-live-xY9zW8vU7tS6rQ5pO4nM3lK2 here.",
  },
]);

// ─── Positive: AWS Keys ─────────────────────────────────────────────────────
export const AWS_KEY_POSITIVE: readonly LocaleMaskFixture[] = Object.freeze([
  {
    countryProfileIds: [],
    description: "masks AWS access key (AKIA prefix)",
    detectionMode: "global-only",
    expectedRuleIds: ["aws-access-key"],
    hiddenValues: ["AKIAIOSFODNN7EXAMPLE"],
    sourceText: "aws_access_key_id = AKIAIOSFODNN7EXAMPLE",
  },
  {
    countryProfileIds: [],
    description: "masks AWS access key (ASIA prefix)",
    detectionMode: "global-only",
    expectedRuleIds: ["aws-access-key"],
    hiddenValues: ["ASIATEMPORARYACCESS1"],
    sourceText: "Key: ASIATEMPORARYACCESS1",
  },
  {
    countryProfileIds: [],
    description: "masks AWS secret access key with = assignment",
    detectionMode: "global-only",
    expectedRuleIds: ["aws-secret-key"],
    hiddenValues: ["wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"],
    sourceText:
      'aws_secret_access_key = "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"',
  },
]);

// ─── Positive: GitHub PAT ───────────────────────────────────────────────────
export const GITHUB_PAT_POSITIVE: readonly LocaleMaskFixture[] = Object.freeze([
  {
    countryProfileIds: [],
    description: "masks GitHub personal access token (ghp_)",
    detectionMode: "global-only",
    expectedRuleIds: ["github-pat"],
    hiddenValues: ["ghp_ABCDEFghijklmn012345"],
    sourceText: "GITHUB_TOKEN=ghp_ABCDEFghijklmn012345",
  },
  {
    countryProfileIds: [],
    description: "masks GitHub OAuth token (gho_)",
    detectionMode: "global-only",
    expectedRuleIds: ["github-pat"],
    hiddenValues: ["gho_xxxxxxxxxxxxxxxxxxxx"],
    sourceText: "oauth: gho_xxxxxxxxxxxxxxxxxxxx",
  },
]);

// ─── Positive: Slack Webhook ────────────────────────────────────────────────
export const SLACK_WEBHOOK_POSITIVE: readonly LocaleMaskFixture[] = Object.freeze([
  {
    countryProfileIds: [],
    description: "masks Slack incoming webhook URL",
    detectionMode: "global-only",
    expectedRuleIds: ["slack-webhook"],
    hiddenValues: [
      "https://hooks.slack.com/services/T0123ABCD/" + "B0123ABCD/abcdefghijklmnopqrstuvwx",
    ],
    sourceText:
      "Webhook: https://hooks.slack.com/services/T0123ABCD/" + "B0123ABCD/abcdefghijklmnopqrstuvwx",
  },
]);

// ─── Positive: Secret Assignment ────────────────────────────────────────────
export const SECRET_ASSIGNMENT_POSITIVE: readonly LocaleMaskFixture[] =
  Object.freeze([
    {
      countryProfileIds: [],
      description: "masks password assignment with = delimiter",
      detectionMode: "global-only",
      expectedRuleIds: ["secret-assignment"],
      hiddenValues: ["S3cret!Pass_w0rd"],
      sourceText: 'password = "S3cret!Pass_w0rd"',
    },
    {
      countryProfileIds: [],
      description: "masks api_key assignment with : delimiter",
      detectionMode: "global-only",
      expectedRuleIds: ["secret-assignment"],
      hiddenValues: ["xK9m2Lp-Q_v7WnRt"],
      sourceText: "api key: xK9m2Lp-Q_v7WnRt",
    },
    {
      countryProfileIds: [],
      description: "masks 'chave secreta' (PT-BR) assignment",
      detectionMode: "global-only",
      expectedRuleIds: ["secret-assignment"],
      hiddenValues: ["Ab1Cd2Ef3Gh"],
      sourceText: "chave secreta: Ab1Cd2Ef3Gh",
    },
    {
      countryProfileIds: [],
      description: "masks 'contraseña' (ES) assignment",
      detectionMode: "global-only",
      expectedRuleIds: ["secret-assignment"],
      hiddenValues: ["M!xed_Ch4r$99"],
      sourceText: 'contraseña = "M!xed_Ch4r$99"',
    },
  ]);

// ─── Negative: Secret Assignment ────────────────────────────────────────────
export const SECRET_ASSIGNMENT_NEGATIVE: readonly NegativeMaskFixture[] =
  Object.freeze([
    {
      countryProfileIds: [],
      description: "does NOT mask short value (< 8 chars)",
      detectionMode: "global-only",
      excludedRuleIds: ["secret-assignment"],
      sourceText: "password: abc",
      visibleValues: ["abc"],
    },
    {
      countryProfileIds: [],
      description: "does NOT mask low-entropy value (all lowercase)",
      detectionMode: "global-only",
      excludedRuleIds: ["secret-assignment"],
      sourceText: "password: abcdefghij",
      visibleValues: ["abcdefghij"],
    },
  ]);

// ─── Positive: Bearer Token ─────────────────────────────────────────────────
export const BEARER_TOKEN_POSITIVE: readonly LocaleMaskFixture[] = Object.freeze([
  {
    countryProfileIds: [],
    description: "masks Bearer token with opaque multi-segment token",
    detectionMode: "global-only",
    expectedRuleIds: ["bearer-token"],
    hiddenValues: ["SFMyNTY.g2gDYQ.dGVzdA"],
    sourceText: "Authorization: Bearer SFMyNTY.g2gDYQ.dGVzdA",
  },
  {
    countryProfileIds: [],
    description: "masks Bearer with opaque alphanumeric token",
    detectionMode: "global-only",
    expectedRuleIds: ["bearer-token"],
    hiddenValues: ["a1B2c3D4e5F6-g7H8i9J0"],
    sourceText: "Bearer a1B2c3D4e5F6-g7H8i9J0",
  },
]);

// ─── Positive: Credit Card ──────────────────────────────────────────────────
export const CREDIT_CARD_POSITIVE: readonly LocaleMaskFixture[] = Object.freeze([
  {
    countryProfileIds: [],
    description: "masks Visa card number (Luhn-valid, space-separated)",
    detectionMode: "global-only",
    expectedRuleIds: ["credit-card"],
    hiddenValues: ["4532 0151 2345 6789"],
    sourceText: "Card: 4532 0151 2345 6789",
  },
  {
    countryProfileIds: [],
    description: "masks MasterCard number (Luhn-valid, compact)",
    detectionMode: "global-only",
    expectedRuleIds: ["credit-card"],
    hiddenValues: ["5425233430109903"],
    sourceText: "CC 5425233430109903 on file.",
  },
  {
    countryProfileIds: [],
    description: "masks card number with dashes",
    detectionMode: "global-only",
    expectedRuleIds: ["credit-card"],
    hiddenValues: ["4532-0151-1283-0366"],
    sourceText: "Payment with 4532-0151-1283-0366 processed.",
  },
]);

// ─── Negative: Credit Card ──────────────────────────────────────────────────
export const CREDIT_CARD_NEGATIVE: readonly NegativeMaskFixture[] = Object.freeze([
  {
    countryProfileIds: [],
    description: "does NOT mask Luhn-invalid 16-digit number",
    detectionMode: "global-only",
    excludedRuleIds: ["credit-card"],
    sourceText: "Ref 1234567812345678 not a card.",
    visibleValues: ["1234567812345678"],
  },
  {
    countryProfileIds: [],
    description: "does NOT mask 10-digit number (too short)",
    detectionMode: "global-only",
    excludedRuleIds: ["credit-card"],
    sourceText: "Order 1234567890 confirmed.",
    visibleValues: ["1234567890"],
  },
]);

// ─── Positive: IBAN ─────────────────────────────────────────────────────────
export const IBAN_POSITIVE: readonly LocaleMaskFixture[] = Object.freeze([
  {
    countryProfileIds: [],
    description: "masks German IBAN (mod-97 valid)",
    detectionMode: "global-only",
    expectedRuleIds: ["iban"],
    hiddenValues: ["DE89370400440532013000"],
    sourceText: "IBAN: DE89370400440532013000",
  },
  {
    countryProfileIds: [],
    description: "masks British IBAN",
    detectionMode: "global-only",
    expectedRuleIds: ["iban"],
    hiddenValues: ["GB29NWBK60161331926819"],
    sourceText: "Wire to GB29NWBK60161331926819 immediately.",
  },
  {
    countryProfileIds: [],
    description: "masks French IBAN",
    detectionMode: "global-only",
    expectedRuleIds: ["iban"],
    hiddenValues: ["FR7630006000011234567890189"],
    sourceText: "FR7630006000011234567890189 is the account.",
  },
]);

// ─── Negative: IBAN ─────────────────────────────────────────────────────────
export const IBAN_NEGATIVE: readonly NegativeMaskFixture[] = Object.freeze([
  {
    countryProfileIds: [],
    description: "does NOT mask IBAN with bad check digits (mod-97 fails)",
    detectionMode: "global-only",
    excludedRuleIds: ["iban"],
    sourceText: "IBAN: DE00370400440532013000",
    visibleValues: ["DE00370400440532013000"],
  },
  {
    countryProfileIds: [],
    description: "does NOT mask too-short IBAN (< 15 chars)",
    detectionMode: "global-only",
    excludedRuleIds: ["iban"],
    sourceText: "Code DE891234567 is not real.",
    visibleValues: ["DE891234567"],
  },
]);

// ─── Positive: Labeled Phone ────────────────────────────────────────────────
export const LABELED_PHONE_POSITIVE: readonly LocaleMaskFixture[] = Object.freeze([
  {
    countryProfileIds: [],
    description: "masks phone with 'phone:' label",
    detectionMode: "global-only",
    expectedRuleIds: ["labeled-phone"],
    hiddenValues: ["+1-555-867-5309"],
    sourceText: "phone: +1-555-867-5309",
  },
  {
    countryProfileIds: [],
    description: "masks phone with 'telefone:' PT label",
    detectionMode: "global-only",
    expectedRuleIds: ["labeled-phone"],
    hiddenValues: ["+55 11 98765-4321"],
    sourceText: "telefone: +55 11 98765-4321",
  },
  {
    countryProfileIds: [],
    description: "masks phone with 'número de teléfono:' ES label",
    detectionMode: "global-only",
    expectedRuleIds: ["labeled-phone"],
    hiddenValues: ["+34 612 345 678"],
    sourceText: "número de teléfono: +34 612 345 678",
  },
]);

// ─── Positive: Labeled Name ─────────────────────────────────────────────────
export const LABELED_NAME_POSITIVE: readonly LocaleMaskFixture[] = Object.freeze([
  {
    countryProfileIds: [],
    description: "masks full name with 'full name:' label",
    detectionMode: "global-only",
    expectedRuleIds: ["labeled-name"],
    hiddenValues: ["John Doe"],
    sourceText: "full name: John Doe",
  },
  {
    countryProfileIds: [],
    description: "masks name with 'nome completo:' PT label",
    detectionMode: "global-only",
    expectedRuleIds: ["labeled-name"],
    hiddenValues: ["Maria Silva"],
    sourceText: "nome completo: Maria Silva",
  },
  {
    countryProfileIds: [],
    description: "masks three-part name with 'nombre completo:' ES label",
    detectionMode: "global-only",
    expectedRuleIds: ["labeled-name"],
    hiddenValues: ["Carlos Eduardo García"],
    sourceText: "nombre completo: Carlos Eduardo García",
  },
]);

// ─── Negative: Labeled Name ─────────────────────────────────────────────────
export const LABELED_NAME_NEGATIVE: readonly NegativeMaskFixture[] = Object.freeze([
  {
    countryProfileIds: [],
    description: "does NOT mask a single word after 'name:' (too few parts)",
    detectionMode: "global-only",
    excludedRuleIds: ["labeled-name"],
    sourceText: "name: Admin",
    visibleValues: ["Admin"],
  },
]);

// ─── Positive: Labeled Address ──────────────────────────────────────────────
export const LABELED_ADDRESS_POSITIVE: readonly LocaleMaskFixture[] = Object.freeze([
  {
    countryProfileIds: [],
    description: "masks street address with 'address:' label",
    detectionMode: "global-only",
    expectedRuleIds: ["labeled-address"],
    hiddenValues: ["742 Evergreen Terrace, Springfield"],
    sourceText: "address: 742 Evergreen Terrace, Springfield",
  },
  {
    countryProfileIds: [],
    description: "masks address with 'endereço:' PT label",
    detectionMode: "global-only",
    expectedRuleIds: ["labeled-address"],
    hiddenValues: ["Rua das Flores, 123, Bairro Centro"],
    sourceText: "endereço: Rua das Flores, 123, Bairro Centro",
  },
  {
    countryProfileIds: [],
    description: "masks address with 'dirección:' ES label",
    detectionMode: "global-only",
    expectedRuleIds: ["labeled-address"],
    hiddenValues: ["Calle Mayor 15, 3o"],
    sourceText: "dirección: Calle Mayor 15, 3o",
  },
]);

// ─── Positive: Labeled Passport ─────────────────────────────────────────────
export const LABELED_PASSPORT_POSITIVE: readonly LocaleMaskFixture[] = Object.freeze([
  {
    countryProfileIds: [],
    description: "masks passport with 'passport number:' label",
    detectionMode: "global-only",
    expectedRuleIds: ["labeled-passport"],
    hiddenValues: ["AB1234567"],
    sourceText: "passport number: AB1234567",
  },
  {
    countryProfileIds: [],
    description: "masks passport with 'pasaporte:' ES label",
    detectionMode: "global-only",
    expectedRuleIds: ["labeled-passport"],
    hiddenValues: ["XY9876543"],
    sourceText: "pasaporte: XY9876543",
  },
  {
    countryProfileIds: [],
    description: "masks passport with 'passaporte numero:' PT label",
    detectionMode: "global-only",
    expectedRuleIds: ["labeled-passport"],
    hiddenValues: ["CD0011223"],
    sourceText: "passaporte numero: CD0011223",
  },
]);

// ─── Boundary: global rules interact properly ───────────────────────────────
export const GLOBAL_BOUNDARY: readonly BoundaryMaskFixture[] = Object.freeze([
  {
    countryProfileIds: [],
    description: "masks email + JWT but not random prose in same text",
    detectionMode: "global-only",
    expectedRuleIds: ["email-address", "jwt-token"],
    hiddenValues: [
      "admin@corp.com",
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIn0.c2lnbg",
    ],
    sourceText:
      "User admin@corp.com sent eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIn0.c2lnbg to the server.",
    visibleValues: ["the server"],
  },
  {
    countryProfileIds: [],
    description: "masks credit card + IBAN together",
    detectionMode: "global-only",
    expectedRuleIds: ["credit-card", "iban"],
    hiddenValues: ["4532 0151 2345 6789", "DE89370400440532013000"],
    sourceText:
      "Pay 4532 0151 2345 6789 to DE89370400440532013000 for invoice.",
  },
  {
    countryProfileIds: [],
    description:
      "masks all credential types in a single config block",
    detectionMode: "global-only",
    expectedRuleIds: [
      "openai-style-key",
      "aws-access-key",
      "github-pat",
    ],
    hiddenValues: [
      "sk-proj-AbCdEfGhIjKlMnOpQrStUvWx",
      "AKIAIOSFODNN7EXAMPLE",
      "ghp_ABCDEFghijklmn012345",
    ],
    sourceText: [
      "OPENAI_API_KEY=sk-proj-AbCdEfGhIjKlMnOpQrStUvWx",
      "AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE",
      "GITHUB_TOKEN=ghp_ABCDEFghijklmn012345",
    ].join("\n"),
  },
  {
    countryProfileIds: [],
    description:
      "masks labeled phone + labeled name + labeled address in form",
    detectionMode: "global-only",
    expectedRuleIds: ["labeled-phone", "labeled-name", "labeled-address"],
    hiddenValues: [
      "+1-555-867-5309",
      "John Doe",
      "742 Evergreen Terrace, Springfield",
    ],
    sourceText: [
      "full name: John Doe",
      "phone: +1-555-867-5309",
      "address: 742 Evergreen Terrace, Springfield",
    ].join("\n"),
  },
]);
