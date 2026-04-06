/**
 * Green-Hat Roleplay Input Mock Fixtures
 *
 * A green-hat (beginner) tester writes simple, obvious PII patterns
 * to verify basic detection: clearly labeled fields, standard
 * formats, and straightforward single-type inputs.
 *
 * @module RoleplayGreenHatFixtures
 */

import type { LocaleMaskFixture } from "../../declarations/testing.types";

export const GREEN_HAT_POSITIVE: readonly LocaleMaskFixture[] = Object.freeze([
  {
    countryProfileIds: ["us"],
    description: "[green-hat] plaintext SSN with label",
    expectedRuleIds: ["us-ssn"],
    hiddenValues: ["123-45-6789"],
    sourceText: "My SSN is 123-45-6789",
  },
  {
    countryProfileIds: ["us"],
    description: "[green-hat] email address in simple sentence",
    expectedRuleIds: ["email-address"],
    hiddenValues: ["john.doe@gmail.com"],
    sourceText: "Send it to john.doe@gmail.com please",
  },
  {
    countryProfileIds: ["us"],
    description: "[green-hat] phone number with country code",
    expectedRuleIds: ["labeled-phone"],
    hiddenValues: ["+1-555-123-4567"],
    sourceText: "Phone: +1-555-123-4567",
  },
  {
    countryProfileIds: ["br"],
    description: "[green-hat] CPF with standard formatting",
    expectedRuleIds: ["cpf"],
    hiddenValues: ["529.982.247-25"],
    sourceText: "Meu CPF é 529.982.247-25",
  },
  {
    countryProfileIds: ["us"],
    description: "[green-hat] simple labeled address",
    expectedRuleIds: ["labeled-address"],
    hiddenValues: ["456 Oak Street, Apt 12, Chicago IL 60601"],
    sourceText: "Address: 456 Oak Street, Apt 12, Chicago IL 60601",
  },
  {
    countryProfileIds: ["us"],
    description: "[green-hat] API key pasted into chat",
    expectedRuleIds: ["openai-style-key"],
    hiddenValues: ["sk-test-Abc123Def456Ghi789Jkl012"],
    sourceText: "here is my key: sk-test-Abc123Def456Ghi789Jkl012",
  },
]);
