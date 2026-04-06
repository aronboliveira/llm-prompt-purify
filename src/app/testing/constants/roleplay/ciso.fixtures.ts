/**
 * CISO Roleplay Input Mock Fixtures
 *
 * A CISO reviews compliance documents, audit reports, and policy
 * excerpts where PII appears in formal, regulatory contexts.
 * Inputs reflect GDPR/LGPD/PCI-DSS language and cross-border data.
 *
 * @module RoleplayCisoFixtures
 */

import type { LocaleMaskFixture } from "../../declarations/testing.types";

export const CISO_POSITIVE: readonly LocaleMaskFixture[] = Object.freeze([
  {
    countryProfileIds: ["us"],
    description:
      "[ciso] incident report excerpt with PII of affected individual",
    expectedRuleIds: ["email-address", "us-ssn"],
    hiddenValues: ["victim@company.com", "234-56-7890"],
    sourceText: [
      "INCIDENT REPORT #IR-2025-0042",
      "Affected individual: Jane Doe",
      "Email: victim@company.com",
      "SSN: 234-56-7890",
      "Data classification: PII / Confidential",
      "GDPR Article 33 notification deadline: 72 hours",
    ].join("\n"),
  },
  {
    countryProfileIds: ["br"],
    description: "[ciso] LGPD data mapping with CPF and CNPJ",
    expectedRuleIds: ["cpf", "cnpj"],
    hiddenValues: ["529.982.247-25", "11.222.333/0001-81"],
    sourceText: [
      "MAPEAMENTO DE DADOS — LGPD Art. 37",
      "Titular: Maria Silva",
      "CPF: 529.982.247-25",
      "Empresa controladora CNPJ: 11.222.333/0001-81",
      "Base legal: consentimento (Art. 7, I)",
    ].join("\n"),
  },
  {
    countryProfileIds: ["us"],
    description: "[ciso] PCI-DSS audit log with card-adjacent data",
    expectedRuleIds: ["email-address"],
    hiddenValues: ["cardholder@bank.com"],
    sourceText: [
      "PCI-DSS Requirement 3.4 — Render PAN unreadable",
      "Audit finding: cardholder email stored in plaintext",
      "Evidence: cardholder@bank.com found in access_log.csv",
      "Remediation: encrypt at rest, mask in transit",
    ].join("\n"),
  },
  {
    countryProfileIds: ["us", "br"],
    description:
      "[ciso] cross-border data transfer summary with mixed-locale PII",
    expectedRuleIds: ["us-ssn", "email-address"],
    hiddenValues: ["789-01-2345", "dpo@multinational.corp"],
    sourceText: [
      "Cross-Border Transfer Assessment",
      "US Employee SSN: 789-01-2345",
      "BR Employee CPF: 529.982.247-25",
      "DPO contact: dpo@multinational.corp",
      "Standard Contractual Clauses: approved",
    ].join("\n"),
  },
  {
    countryProfileIds: ["us"],
    description: "[ciso] vendor risk assessment with API credentials",
    expectedRuleIds: ["openai-style-key"],
    hiddenValues: ["sk-live-vendorAudit123456789012345"],
    sourceText: [
      "Vendor: AI Analytics Corp",
      "API key found in public repo: sk-live-vendorAudit123456789012345",
      "Risk level: CRITICAL",
      "Action: rotate immediately, revoke access",
    ].join("\n"),
  },
]);
