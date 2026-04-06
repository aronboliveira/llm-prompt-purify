/**
 * QA Roleplay Input Mock Fixtures
 *
 * A QA engineer writes realistic test inputs exercising edge cases,
 * boundary values, multi-field layouts, and locale combinations.
 *
 * @module RoleplayQaFixtures
 */

import type { LocaleMaskFixture } from "../../declarations/testing.types";

export const QA_POSITIVE: readonly LocaleMaskFixture[] = Object.freeze([
  {
    countryProfileIds: ["us"],
    description: "[qa] single-line multi-field: address + SSN + phone + email",
    expectedRuleIds: ["labeled-address", "us-ssn", "email-address"],
    hiddenValues: [
      "742 Evergreen Terrace, Springfield",
      "321-54-9876",
      "homer.simpson@aol.com",
    ],
    sourceText:
      "address: 742 Evergreen Terrace, Springfield SSN: 321-54-9876 Email: homer.simpson@aol.com",
  },
  {
    countryProfileIds: ["us"],
    description: "[qa] comma-separated fields mimicking CRM export",
    expectedRuleIds: ["email-address", "us-ssn"],
    hiddenValues: ["jane.doe@corp.io", "123-45-6789"],
    sourceText:
      "Name: Jane Doe, Email: jane.doe@corp.io, SSN: 123-45-6789, DOB: 1985-03-14",
  },
  {
    countryProfileIds: ["br"],
    description: "[qa] PT-BR labeled CPF and phone on same line",
    expectedRuleIds: ["cpf"],
    hiddenValues: ["529.982.247-25"],
    sourceText: "CPF: 529.982.247-25 Telefone: +55 11 91234-5678",
  },
  {
    countryProfileIds: ["us"],
    description: "[qa] tab-separated PII fields (TSV style)",
    expectedRuleIds: ["email-address", "us-ssn"],
    hiddenValues: ["user@example.com", "987-65-4320"],
    sourceText: "Email: user@example.com\tSSN: 987-65-4320\tPhone: 555-0199",
  },
  {
    countryProfileIds: ["us"],
    description: "[qa] mixed-case labels with equals delimiter",
    expectedRuleIds: ["us-ssn"],
    hiddenValues: ["111-22-3333"],
    sourceText: "ssn=111-22-3333 phone=+1-800-555-0100",
  },
  {
    countryProfileIds: ["us", "br"],
    description: "[qa] dual-locale document with US and BR PII",
    expectedRuleIds: ["email-address", "us-ssn"],
    hiddenValues: ["456-78-9012", "contact@bilingual.org"],
    sourceText:
      "SSN: 456-78-9012\nCPF: 529.982.247-25\nEmail: contact@bilingual.org",
  },
  {
    countryProfileIds: ["us"],
    description:
      "[qa] credential + address on same line (API key after address)",
    expectedRuleIds: ["labeled-address", "openai-style-key"],
    hiddenValues: [
      "1600 Pennsylvania Ave NW, Washington DC",
      "sk-proj-abc123def456ghi789jkl",
    ],
    sourceText:
      "address: 1600 Pennsylvania Ave NW, Washington DC API key: sk-proj-abc123def456ghi789jkl",
  },
  {
    countryProfileIds: ["us"],
    description: "[qa] multiline form with every common PII type",
    expectedRuleIds: ["email-address", "us-ssn", "labeled-address"],
    hiddenValues: [
      "alice@wonder.land",
      "555-12-3456",
      "123 Rabbit Hole Ln, Apt 42",
    ],
    sourceText: [
      "Name: Alice Liddell",
      "Email: alice@wonder.land",
      "SSN: 555-12-3456",
      "Address: 123 Rabbit Hole Ln, Apt 42",
      "Phone: +1-555-867-5309",
    ].join("\n"),
  },
]);
