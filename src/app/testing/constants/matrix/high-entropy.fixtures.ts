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
      description: "postal code should not be masked as SSN",
      excludedRuleIds: ["us-ssn"],
      sourceText: "ZIP: 12345",
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
