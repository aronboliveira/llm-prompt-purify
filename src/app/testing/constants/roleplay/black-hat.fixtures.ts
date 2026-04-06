/**
 * Black-Hat Roleplay Input Mock Fixtures
 *
 * A black-hat attacker tries to evade the masking engine through
 * obfuscation, bloating, mangling, mixed encodings, separator
 * stuffing, and unexpected entropy injection.
 *
 * @module RoleplayBlackHatFixtures
 */

import type {
  LocaleMaskFixture,
  NegativeMaskFixture,
} from "../../declarations/testing.types";

// ─── Positive: masking should still catch these ─────────────────────────────

export const BLACK_HAT_POSITIVE: readonly LocaleMaskFixture[] = Object.freeze([
  {
    countryProfileIds: ["us"],
    description: "[black-hat] SSN with extra whitespace padding around dashes",
    expectedRuleIds: ["us-ssn"],
    hiddenValues: ["123-45-6789"],
    sourceText: "SSN:   123-45-6789   (padded)",
  },
  {
    countryProfileIds: ["us"],
    description: "[black-hat] email in angle brackets with surrounding noise",
    expectedRuleIds: ["email-address"],
    hiddenValues: ["victim@evil.com"],
    sourceText: ">>>>NOISE<<<< email: victim@evil.com ####END####",
  },
  {
    countryProfileIds: ["us"],
    description:
      "[black-hat] credential after long filler text to push past typical scan windows",
    expectedRuleIds: ["openai-style-key"],
    hiddenValues: ["sk-proj-AAAAAAAAAAAABBBBBBBBBBBB"],
    sourceText:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam. sk-proj-AAAAAAAAAAAABBBBBBBBBBBB",
  },
  {
    countryProfileIds: ["us"],
    description:
      "[black-hat] JWT token sandwiched between HTML comment markers",
    expectedRuleIds: ["jwt-token"],
    hiddenValues: [
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0In0.SflKxwRJSMeKKF2QT4fwpM",
    ],
    sourceText:
      "<!-- eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0In0.SflKxwRJSMeKKF2QT4fwpM -->",
  },
  {
    countryProfileIds: ["us"],
    description: "[black-hat] AWS key hidden in a base64-like blob",
    expectedRuleIds: ["aws-access-key"],
    hiddenValues: ["AKIAIOSFODNN7EXAMPLE"],
    sourceText:
      "config=dXNlcjpwYXNz key: AKIAIOSFODNN7EXAMPLE secret=aGVsbG8gd29ybGQ=",
  },
  {
    countryProfileIds: ["us"],
    description:
      "[black-hat] multiple SSNs crammed together with minimal separation",
    expectedRuleIds: ["us-ssn"],
    hiddenValues: ["111-22-3333", "444-55-6666"],
    sourceText: "SSN:111-22-3333/444-55-6666",
  },
  {
    countryProfileIds: ["br"],
    description: "[black-hat] CPF with dots replaced by middle-dot (·)",
    expectedRuleIds: ["cpf"],
    hiddenValues: ["529.982.247-25"],
    sourceText: "CPF: 529.982.247-25 (dot variant test)",
  },
  {
    countryProfileIds: ["us"],
    description: "[black-hat] PII buried in JSON-like structure on single line",
    expectedRuleIds: ["email-address"],
    hiddenValues: ["leaked@internal.corp"],
    sourceText: '{"user":"admin","email":"leaked@internal.corp","role":"root"}',
  },
]);

// ─── Negative: these evasions should NOT trigger false positives ─────────────

export const BLACK_HAT_NEGATIVE: readonly NegativeMaskFixture[] = Object.freeze(
  [
    {
      countryProfileIds: ["us"],
      description:
        "[black-hat] hex-like strings that should not trigger PII rules",
      excludedRuleIds: ["us-ssn", "cpf"],
      sourceText: "commit: a4f8c3b2e1 hash: 0xDEADBEEF checksum: 5a3b7c9d",
      visibleValues: ["a4f8c3b2e1", "0xDEADBEEF", "5a3b7c9d"],
    },
    {
      countryProfileIds: ["us"],
      description: "[black-hat] code variable names that look like PII labels",
      excludedRuleIds: ["labeled-address", "labeled-phone"],
      sourceText:
        "const addressBuffer = new Uint8Array(32); const phoneHandler = () => null;",
      visibleValues: ["new Uint8Array(32)", "() => null"],
    },
  ],
);
