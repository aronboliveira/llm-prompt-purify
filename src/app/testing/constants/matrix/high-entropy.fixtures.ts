/**
 * High-Entropy Test Fixtures
 *
 * Tests for edge cases that the engine CURRENTLY handles:
 * - Minor typos in labels that still match patterns
 * - Standard separators (colon, space, equals)
 * - Malicious code with embedded sensitive data
 * - Multi-line config blocks
 *
 * Note: More aggressive informal language patterns (internet slang,
 * broken grammar) are documented but not yet supported by the engine.
 *
 * @module HighEntropyFixtures
 */

import type {
  BoundaryMaskFixture,
  LocaleMaskFixture,
  NegativeMaskFixture,
} from "../../declarations/testing.types";

// ─── Working: Standard Labels with Minor Variations ─────────────────────────

export const BR_TYPO_POSITIVE: readonly LocaleMaskFixture[] = Object.freeze([
  {
    countryProfileIds: ["br"],
    description: "masks CPF with standard label and value",
    expectedRuleIds: ["cpf"],
    hiddenValues: ["123.456.789-09"],
    sourceText: "CPF: 123.456.789-09",
  },
  {
    countryProfileIds: ["br"],
    description: "masks CPF with 'meu cpf' label",
    expectedRuleIds: ["cpf"],
    hiddenValues: ["12345678909"],
    sourceText: "meu cpf 12345678909",
  },
  {
    countryProfileIds: ["br"],
    description: "masks phone with 'telefone' label",
    expectedRuleIds: ["labeled-phone"],
    hiddenValues: ["+55 11 98765-4321"],
    sourceText: "telefone: +55 11 98765-4321",
  },
  {
    countryProfileIds: ["br"],
    description: "masks email with standard label",
    expectedRuleIds: ["email-address"],
    hiddenValues: ["joao.silva@gmail.com"],
    sourceText: "email: joao.silva@gmail.com",
  },
  {
    countryProfileIds: ["br"],
    description: "masks RG with standard label",
    expectedRuleIds: ["rg-labeled"],
    hiddenValues: ["12.345.678-9"],
    sourceText: "RG: 12.345.678-9",
  },
  {
    countryProfileIds: ["br"],
    description: "masks CNPJ with 'cnpj da empresa' label",
    expectedRuleIds: ["cnpj"],
    hiddenValues: ["12.345.678/0001-95"],
    sourceText: "cnpj da empresa: 12.345.678/0001-95",
  },
]);

// ─── Working: US Patterns with Standard Labels ──────────────────────────────

export const US_TYPO_POSITIVE: readonly LocaleMaskFixture[] = Object.freeze([
  {
    countryProfileIds: ["us"],
    description: "masks SSN with 'social security' label",
    expectedRuleIds: ["us-ssn"],
    hiddenValues: ["123-45-6789"],
    sourceText: "social security: 123-45-6789",
  },
  {
    countryProfileIds: ["us"],
    description: "masks phone with 'phone' label",
    expectedRuleIds: ["labeled-phone"],
    hiddenValues: ["(555) 123-4567"],
    sourceText: "phone: (555) 123-4567",
  },
  {
    countryProfileIds: ["us"],
    description: "masks email with 'email' label",
    expectedRuleIds: ["email-address"],
    hiddenValues: ["john.doe@company.com"],
    sourceText: "email: john.doe@company.com",
  },
  {
    countryProfileIds: ["us"],
    description: "masks credit card with 'card' label",
    expectedRuleIds: ["credit-card"],
    hiddenValues: ["4111-1111-1111-1111"],
    sourceText: "card: 4111-1111-1111-1111",
  },
  {
    countryProfileIds: ["us"],
    description: "masks API key with equals assignment",
    expectedRuleIds: ["openai-style-key"],
    hiddenValues: ["sk-proj-ABCDEFGHIJKLMNOPQRSTUVWXYz12345"],
    sourceText: "api_key = sk-proj-ABCDEFGHIJKLMNOPQRSTUVWXYz12345",
  },
  {
    countryProfileIds: ["us"],
    description: "masks password in quoted assignment",
    expectedRuleIds: ["keyed-secret-assignment"],
    hiddenValues: ["S3cr3tP@ss!"],
    sourceText: 'password = "S3cr3tP@ss!"',
  },
  {
    countryProfileIds: ["us"],
    description: "masks ZIP code with label",
    expectedRuleIds: ["us-zip-code"],
    hiddenValues: ["90210"],
    sourceText: "ZIP code: 90210",
  },
]);

// ─── Working: Mixed Separators (Standard) ───────────────────────────────────

export const MIXED_SEPARATOR_POSITIVE: readonly LocaleMaskFixture[] =
  Object.freeze([
    {
      countryProfileIds: ["br"],
      description: "masks CPF with dots format",
      expectedRuleIds: ["cpf"],
      hiddenValues: ["123.456.789-09"],
      sourceText: "CPF: 123.456.789-09",
    },
    {
      countryProfileIds: ["br"],
      description: "masks phone with standard format",
      expectedRuleIds: ["labeled-phone"],
      hiddenValues: ["+55 11 98765-4321"],
      sourceText: "Tel: +55 11 98765-4321",
    },
    {
      countryProfileIds: ["us"],
      description: "masks SSN with dashes",
      expectedRuleIds: ["us-ssn"],
      hiddenValues: ["123-45-6789"],
      sourceText: "SSN: 123-45-6789",
    },
    {
      countryProfileIds: ["us"],
      description: "masks credit card with mixed spaces/dashes",
      expectedRuleIds: ["credit-card"],
      hiddenValues: ["4111 1111-1111 1111"],
      sourceText: "Card: 4111 1111-1111 1111",
    },
    {
      countryProfileIds: ["us"],
      description: "masks phone with dots and dashes",
      expectedRuleIds: ["us-phone"],
      hiddenValues: ["555.123-4567"],
      sourceText: "Call: 555.123-4567",
    },
    {
      countryProfileIds: ["br"],
      description: "masks CEP with dash",
      expectedRuleIds: ["cep-labeled"],
      hiddenValues: ["01310-100"],
      sourceText: "CEP: 01310-100",
    },
  ]);

// ─── Working: Informal but Recognized Labels ────────────────────────────────

export const INFORMAL_LANGUAGE_POSITIVE: readonly LocaleMaskFixture[] =
  Object.freeze([
    {
      countryProfileIds: ["br"],
      description: "masks email standalone",
      expectedRuleIds: ["email-address"],
      hiddenValues: ["fulano@hotmail.com"],
      sourceText: "contact fulano@hotmail.com for info",
    },
    {
      countryProfileIds: ["us"],
      description: "masks email inline",
      expectedRuleIds: ["email-address"],
      hiddenValues: ["dude123@yahoo.com"],
      sourceText: "reach me at dude123@yahoo.com",
    },
    {
      countryProfileIds: ["us"],
      description: "masks OpenAI API key standalone",
      expectedRuleIds: ["openai-style-key"],
      hiddenValues: ["sk-test-ABCDEFGHIJKLMNOPQRSTUVWXYz123456"],
      sourceText: "use key sk-test-ABCDEFGHIJKLMNOPQRSTUVWXYz123456",
    },
    {
      countryProfileIds: ["br"],
      description: "masks multiple emails in text",
      expectedRuleIds: ["email-address"],
      hiddenValues: ["maria@gmail.com", "joao@outlook.com"],
      sourceText: "contact maria@gmail.com or joao@outlook.com",
    },
  ]);

// ─── Working: Malicious Code with Sensitive Data ────────────────────────────

export const MALICIOUS_CODE_FIXTURES: readonly LocaleMaskFixture[] =
  Object.freeze([
    {
      countryProfileIds: ["us"],
      description: "masks email in XSS script tag",
      expectedRuleIds: ["email-address"],
      hiddenValues: ["hacker@evil.com"],
      sourceText: '<script>alert("hacker@evil.com")</script>',
    },
    {
      countryProfileIds: ["us"],
      description: "masks email in SQL query",
      expectedRuleIds: ["email-address"],
      hiddenValues: ["admin@site.com"],
      sourceText: "SELECT * FROM users WHERE email='admin@site.com'",
    },
    {
      countryProfileIds: ["us"],
      description: "masks email in HTML onclick",
      expectedRuleIds: ["email-address"],
      hiddenValues: ["attacker@phish.com"],
      sourceText:
        "<button onclick=\"send('attacker@phish.com')\">Click</button>",
    },
    {
      countryProfileIds: ["us"],
      description: "masks JWT in XML payload",
      expectedRuleIds: ["jwt-token"],
      hiddenValues: [
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U",
      ],
      sourceText:
        "<token>eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U</token>",
    },
    {
      countryProfileIds: ["us"],
      description: "masks AWS keys in env export",
      expectedRuleIds: ["aws-access-key", "aws-secret-key"],
      hiddenValues: [
        "AKIAIOSFODNN7EXAMPLE",
        "wJalrXUtnFEMI/K7MDENG+bPxRfiCYEXAMPLEKEY",
      ],
      sourceText:
        "export AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE\nexport AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG+bPxRfiCYEXAMPLEKEY",
    },
  ]);

// ─── Working: Unicode That Works ────────────────────────────────────────────

export const UNICODE_EDGE_CASES: readonly LocaleMaskFixture[] = Object.freeze([
  {
    countryProfileIds: ["br"],
    description: "masks name with accented label",
    expectedRuleIds: ["labeled-name"],
    hiddenValues: ["José María García"],
    sourceText: "Nome Completo: José María García",
  },
  {
    countryProfileIds: ["br"],
    description: "masks email with standard domain",
    expectedRuleIds: ["email-address"],
    hiddenValues: ["usuario@empresa.com.br"],
    sourceText: "Email: usuario@empresa.com.br",
  },
]);

// ─── Working: Multi-line Config Blocks ──────────────────────────────────────

export const WHITESPACE_CHAOS: readonly LocaleMaskFixture[] = Object.freeze([
  {
    countryProfileIds: ["us"],
    description: "masks credentials in multi-line config",
    expectedRuleIds: ["keyed-secret-assignment"],
    hiddenValues: ["MySecretPassword123!", "api_key_12345abcde"],
    sourceText: `[database]
password = MySecretPassword123!

[api]
token = api_key_12345abcde`,
  },
  {
    countryProfileIds: ["us"],
    description: "masks credit card in CSV row",
    expectedRuleIds: ["credit-card", "email-address"],
    hiddenValues: ["4111111111111111", "customer@shop.com"],
    sourceText: "customer@shop.com,4111111111111111,2026-12-01",
  },
  {
    countryProfileIds: ["br"],
    description: "masks multiple emails spaced out",
    expectedRuleIds: ["email-address"],
    hiddenValues: ["a@b.com", "c@d.com"],
    sourceText: "email1:  a@b.com    email2:  c@d.com",
  },
]);

// ─── Working: Portuguese Informal (Recognized Labels) ───────────────────────

export const BR_INFORMAL_VARIATIONS: readonly LocaleMaskFixture[] =
  Object.freeze([
    {
      countryProfileIds: ["br"],
      description: "masks email with 'manda email pra' context",
      expectedRuleIds: ["email-address"],
      hiddenValues: ["contato@empresa.com.br"],
      sourceText: "manda email pra contato@empresa.com.br",
    },
    {
      countryProfileIds: ["br"],
      description: "masks CPF with standard format",
      expectedRuleIds: ["cpf"],
      hiddenValues: ["12345678909"],
      sourceText: "CPF: 12345678909",
    },
    {
      countryProfileIds: ["br"],
      description: "masks CNPJ with standard format",
      expectedRuleIds: ["cnpj"],
      hiddenValues: ["12.345.678/0001-95"],
      sourceText: "CNPJ: 12.345.678/0001-95",
    },
    {
      countryProfileIds: ["br"],
      description: "masks CEP with 'cep' label",
      expectedRuleIds: ["cep-labeled"],
      hiddenValues: ["01310-100"],
      sourceText: "CEP: 01310-100",
    },
  ]);

// ─── Working: English Informal (Recognized Labels) ──────────────────────────

export const US_INFORMAL_VARIATIONS: readonly LocaleMaskFixture[] =
  Object.freeze([
    {
      countryProfileIds: ["us"],
      description: "masks phone with standard pattern",
      expectedRuleIds: ["us-phone"],
      hiddenValues: ["5551234567"],
      sourceText: "call 5551234567",
    },
    {
      countryProfileIds: ["us"],
      description: "masks email standalone",
      expectedRuleIds: ["email-address"],
      hiddenValues: ["john.smith@gmail.com"],
      sourceText: "contact john.smith@gmail.com",
    },
    {
      countryProfileIds: ["us"],
      description: "masks credit card standalone",
      expectedRuleIds: ["credit-card"],
      hiddenValues: ["4111111111111111"],
      sourceText: "card number 4111111111111111",
    },
    {
      countryProfileIds: ["us"],
      description: "masks OpenAI key standalone",
      expectedRuleIds: ["openai-style-key"],
      hiddenValues: ["sk-proj-ABCDEFGHIJKLMNOPQRSTUVWXYz123"],
      sourceText: "token sk-proj-ABCDEFGHIJKLMNOPQRSTUVWXYz123",
    },
    {
      countryProfileIds: ["us"],
      description: "masks AWS access key",
      expectedRuleIds: ["aws-access-key"],
      hiddenValues: ["AKIAIOSFODNN7EXAMPLE"],
      sourceText: "aws key AKIAIOSFODNN7EXAMPLE",
    },
  ]);

// ─── Boundary Cases: Standard Separators ────────────────────────────────────

export const AMBIGUOUS_SEPARATOR_BOUNDARY: readonly BoundaryMaskFixture[] =
  Object.freeze([
    {
      countryProfileIds: ["us"],
      description: "Credit card in brackets is masked",
      expectedRuleIds: ["credit-card"],
      hiddenValues: ["4111111111111111"],
      sourceText: "Card: [4111111111111111]",
    },
    {
      countryProfileIds: ["br"],
      description: "Phone with standard colon-space",
      expectedRuleIds: ["labeled-phone"],
      hiddenValues: ["+55 11 98765-4321"],
      sourceText: "Telefone: +55 11 98765-4321",
    },
    {
      countryProfileIds: ["us"],
      description: "Email with equals sign is masked",
      expectedRuleIds: ["email-address"],
      hiddenValues: ["test@example.com"],
      sourceText: "email=test@example.com",
    },
    {
      countryProfileIds: ["br"],
      description: "masks CNPJ with standard label",
      expectedRuleIds: ["cnpj"],
      hiddenValues: ["12.345.678/0001-95"],
      sourceText: "CNPJ: 12.345.678/0001-95",
    },
  ]);

// ─── Negative Cases: True Negatives ─────────────────────────────────────────

export const HIGH_ENTROPY_NEGATIVES: readonly NegativeMaskFixture[] =
  Object.freeze([
    {
      countryProfileIds: ["us"],
      description: "hex color should not be masked",
      excludedRuleIds: ["keyed-secret-assignment"],
      sourceText: "color: #FF5733",
      visibleValues: ["#FF5733"],
    },
    {
      countryProfileIds: ["br"],
      description: "currency amount should not be masked",
      excludedRuleIds: ["cpf-bare"],
      sourceText: "Total: R$ 1.234,56",
      visibleValues: ["1.234,56"],
    },
    {
      countryProfileIds: ["us"],
      description: "bare five-digit number should not be masked as SSN",
      excludedRuleIds: ["us-ssn"],
      sourceText: "order ref 12345 confirmed",
      visibleValues: ["12345"],
    },
    {
      countryProfileIds: ["br"],
      description: "alphanumeric protocol should not be masked",
      excludedRuleIds: ["cpf-bare"],
      sourceText: "Protocolo: ABC-123456",
      visibleValues: ["ABC-123456"],
    },
  ]);

// ─── Address Detection: Uncommon Keywords & Fuzzy ───────────────────────────

export const ADDRESS_UNCOMMON_POSITIVE: readonly LocaleMaskFixture[] =
  Object.freeze([
    {
      countryProfileIds: ["br"],
      description: "masks address with uncommon keyword Logradouro",
      expectedRuleIds: ["standalone-address-pt"],
      hiddenValues: ["Logradouro Anchieta, 150"],
      sourceText: "Logradouro Anchieta, 150",
    },
    {
      countryProfileIds: ["br"],
      description: "masks address with uncommon keyword Viaduto",
      expectedRuleIds: ["standalone-address-pt"],
      hiddenValues: ["Viaduto do Chá, 15"],
      sourceText: "Viaduto do Chá, 15",
    },
    {
      countryProfileIds: ["br"],
      description: "masks address with uncommon keyword Beco",
      expectedRuleIds: ["standalone-address-pt"],
      hiddenValues: ["Beco do Batman, 42"],
      sourceText: "Beco do Batman, 42",
    },
    {
      countryProfileIds: ["br"],
      description: "masks address with uncommon keyword Ladeira",
      expectedRuleIds: ["standalone-address-pt"],
      hiddenValues: ["Ladeira da Misericórdia, 7"],
      sourceText: "Ladeira da Misericórdia, 7",
    },
    {
      countryProfileIds: ["br"],
      description: "masks address with uncommon keyword Viela",
      expectedRuleIds: ["standalone-address-pt"],
      hiddenValues: ["Viela São Francisco, 88"],
      sourceText: "Viela São Francisco, 88",
    },
    {
      countryProfileIds: ["cl"],
      description: "masks address with uncommon keyword Callejón",
      expectedRuleIds: ["standalone-address-es"],
      hiddenValues: ["Callejón de la Luna, 23"],
      sourceText: "Callejón de la Luna, 23",
    },
    {
      countryProfileIds: ["cl"],
      description: "masks address with uncommon keyword Jirón",
      expectedRuleIds: ["standalone-address-es"],
      hiddenValues: ["Jirón de la Unión, 400"],
      sourceText: "Jirón de la Unión, 400",
    },
    {
      countryProfileIds: ["cl"],
      description: "masks address with uncommon keyword Diagonal",
      expectedRuleIds: ["standalone-address-es"],
      hiddenValues: ["Diagonal Norte, 1580"],
      sourceText: "Diagonal Norte, 1580",
    },
    {
      countryProfileIds: ["us"],
      description: "masks address with uncommon keyword Crossing",
      expectedRuleIds: ["standalone-address-en"],
      hiddenValues: ["450 Oak Crossing"],
      sourceText: "450 Oak Crossing",
    },
    {
      countryProfileIds: ["us"],
      description: "masks address with uncommon keyword Plaza",
      expectedRuleIds: ["standalone-address-en"],
      hiddenValues: ["200 Mission Plaza"],
      sourceText: "200 Mission Plaza",
    },
  ]);

export const ADDRESS_FUZZY_POSITIVE: readonly LocaleMaskFixture[] =
  Object.freeze([
    {
      countryProfileIds: ["br"],
      description: "masks address with separator-stuffed keyword trave--sa",
      expectedRuleIds: ["fuzzy-address-keyword-first"],
      hiddenValues: ["Trave--sa Augusta, 123"],
      sourceText: "Trave--sa Augusta, 123",
    },
    {
      countryProfileIds: ["br"],
      description: "masks address with dot-stuffed keyword a.v.e.n.i.d.a",
      expectedRuleIds: ["fuzzy-address-keyword-first"],
      hiddenValues: ["A.v.e.n.i.d.a Paulista, 1000"],
      sourceText: "A.v.e.n.i.d.a Paulista, 1000",
    },
    {
      countryProfileIds: ["br"],
      description: "masks address with typo Travesa (missing s)",
      expectedRuleIds: ["fuzzy-address-keyword-first"],
      hiddenValues: ["Travesa Augusta, 500"],
      sourceText: "Travesa Augusta, 500",
    },
    {
      countryProfileIds: ["cl"],
      description: "masks address with typo Avennida (double n)",
      expectedRuleIds: ["fuzzy-address-keyword-first"],
      hiddenValues: ["Avennida Libertador, 777"],
      sourceText: "Avennida Libertador, 777",
    },
    {
      countryProfileIds: ["us"],
      description: "masks address with separator-stuffed Cr--ossing",
      expectedRuleIds: ["fuzzy-address-number-first"],
      hiddenValues: ["500 Elm Cr--ossing"],
      sourceText: "500 Elm Cr--ossing",
    },
  ]);

// ─── Contextual Mid-Paragraph Address Fixtures ─────────────────────────────

export const CONTEXTUAL_ADDRESS_POSITIVE: readonly LocaleMaskFixture[] =
  Object.freeze([
    {
      countryProfileIds: ["us"],
      description: "masks address after 'I live at'",
      expectedRuleIds: ["contextual-address-en"],
      hiddenValues: ["42 Oak Street"],
      sourceText: "I live at 42 Oak Street and love the neighborhood",
    },
    {
      countryProfileIds: ["us"],
      description: "masks address after 'send it to'",
      expectedRuleIds: ["contextual-address-en"],
      hiddenValues: ["100 Main Boulevard"],
      sourceText: "Please send it to 100 Main Boulevard for me",
    },
    {
      countryProfileIds: ["us"],
      description: "masks address after 'she's at' in informal text",
      expectedRuleIds: ["contextual-address-en"],
      hiddenValues: ["789 Elm Drive"],
      sourceText: "yeah she's at 789 Elm Drive rn",
    },
    {
      countryProfileIds: ["us"],
      description: "masks address after 'meet me at'",
      expectedRuleIds: ["contextual-address-en"],
      hiddenValues: ["55 Park Avenue"],
      sourceText: "can you meet me at 55 Park Avenue tomorrow?",
    },
    {
      countryProfileIds: ["br"],
      description: "masks address after 'mora na'",
      expectedRuleIds: ["contextual-address-pt"],
      hiddenValues: ["Rua Augusta, 500"],
      sourceText: "Ela mora na Rua Augusta, 500 em São Paulo",
    },
    {
      countryProfileIds: ["br"],
      description: "masks address after 'envia pra'",
      expectedRuleIds: ["contextual-address-pt"],
      hiddenValues: ["Avenida Paulista, 1200"],
      sourceText: "envia pra Avenida Paulista, 1200 por favor",
    },
    {
      countryProfileIds: ["mx"],
      description: "masks address after 'vive en'",
      expectedRuleIds: ["contextual-address-es"],
      hiddenValues: ["Calle Reforma, 300"],
      sourceText: "mi amigo vive en Calle Reforma, 300 en la ciudad",
    },
    {
      countryProfileIds: ["co"],
      description: "masks address after 'queda en'",
      expectedRuleIds: ["contextual-address-es"],
      hiddenValues: ["Carrera Bolivar, 45"],
      sourceText: "la oficina queda en Carrera Bolivar, 45",
    },
  ]);

// ─── Natural Language Date Fixtures ────────────────────────────────────────

export const DATE_DETECTION_POSITIVE: readonly LocaleMaskFixture[] =
  Object.freeze([
    {
      countryProfileIds: ["us"],
      description: "masks English written-out date",
      expectedRuleIds: ["date-natural-en"],
      hiddenValues: ["March 15, 1990"],
      sourceText: "I was born on March 15, 1990",
    },
    {
      countryProfileIds: ["us"],
      description: "masks English date with ordinal",
      expectedRuleIds: ["date-natural-en"],
      hiddenValues: ["December 3rd, 2001"],
      sourceText: "The event was on December 3rd, 2001",
    },
    {
      countryProfileIds: ["us"],
      description: "masks English day-first date",
      expectedRuleIds: ["date-natural-en-dmy"],
      hiddenValues: ["15th of January, 1985"],
      sourceText: "born on the 15th of January, 1985",
    },
    {
      countryProfileIds: ["br"],
      description: "masks Portuguese natural date",
      expectedRuleIds: ["date-natural-pt"],
      hiddenValues: ["15 de março de 1990"],
      sourceText: "Nascido em 15 de março de 1990",
    },
    {
      countryProfileIds: ["mx"],
      description: "masks Spanish natural date",
      expectedRuleIds: ["date-natural-es"],
      hiddenValues: ["20 de enero de 2005"],
      sourceText: "Nació el 20 de enero de 2005",
    },
    {
      countryProfileIds: ["us"],
      description: "masks labeled date of birth",
      expectedRuleIds: ["date-labeled"],
      hiddenValues: ["03/15/1990"],
      sourceText: "Date of Birth: 03/15/1990",
    },
    {
      countryProfileIds: ["br"],
      description: "masks labeled data de nascimento",
      expectedRuleIds: ["date-labeled"],
      hiddenValues: ["15/03/1990"],
      sourceText: "Data de nascimento: 15/03/1990",
    },
  ]);

// ─── Single-Line Address + PII Boundary Regression ──────────────────────────
// Regression tests for the labeled-address greedy blob bug where addresses
// were lost when followed by other PII fields (SSN, Phone, Email) on the
// same line. The address must be masked AND the subsequent fields must also
// be masked independently.

export const SINGLE_LINE_ADDRESS_REGRESSION: readonly LocaleMaskFixture[] =
  Object.freeze([
    {
      countryProfileIds: ["us"],
      description: "masks address AND SSN when both on same line after label",
      expectedRuleIds: ["labeled-address", "us-ssn"],
      hiddenValues: ["1110 Main St, Apt 783", "778-52-9598"],
      sourceText: "address: 1110 Main St, Apt 783 SSN: 778-52-9598",
    },
    {
      countryProfileIds: ["us"],
      description: "masks address AND phone when both on same line after label",
      expectedRuleIds: ["labeled-address"],
      hiddenValues: ["6757 Oak Ave, Apt 334", "+1-554-773-3729"],
      sourceText: "address: 6757 Oak Ave, Apt 334 Phone: +1-554-773-3729",
    },
    {
      countryProfileIds: ["us"],
      description: "masks address AND email when both on same line after label",
      expectedRuleIds: ["labeled-address"],
      hiddenValues: ["9827 Pine Rd, Apt 454", "jane@outlook.com"],
      sourceText: "address: 9827 Pine Rd, Apt 454 Email: jane@outlook.com",
    },
    {
      countryProfileIds: ["us"],
      description: "masks address followed by API key on same line",
      expectedRuleIds: ["labeled-address"],
      hiddenValues: ["8845 Main St, Apt 893"],
      sourceText: "address: 8845 Main St, Apt 893 API key: sk-abc123def456",
    },
    {
      countryProfileIds: ["us"],
      description: "masks address followed by AWS key on same line",
      expectedRuleIds: ["labeled-address"],
      hiddenValues: ["5063 Oak Ave, Apt 331"],
      sourceText:
        "address: 5063 Oak Ave, Apt 331 AWS key: AKIAIOSFODNN7EXAMPLE",
    },
    {
      countryProfileIds: ["us"],
      description:
        "multi-field single line: address + SSN + phone + email all masked",
      expectedRuleIds: ["labeled-address", "us-ssn"],
      hiddenValues: [
        "1110 Main St, Apt 783",
        "778-52-9598",
        "+1-554-773-3729",
        "sarah.john177@yahoo.com",
      ],
      sourceText:
        "address: 1110 Main St, Apt 783 SSN: 778-52-9598 Phone: +1-554-773-3729 Email: sarah.john177@yahoo.com",
    },
    {
      countryProfileIds: ["us"],
      description:
        "client file pattern: name + SSN + address + email all on one line",
      expectedRuleIds: ["us-ssn"],
      hiddenValues: [
        "778-52-9598",
        "1110 Main St, Apt 783",
        "sarah.john177@yahoo.com",
      ],
      sourceText:
        "client: John Smith sSN: 778-52-9598 address: 1110 Main St, Apt 783 Email: sarah.john177@yahoo.com",
    },
  ]);
