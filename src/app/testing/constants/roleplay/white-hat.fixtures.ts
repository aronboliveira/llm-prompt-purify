/**
 * White-Hat Roleplay Input Mock Fixtures
 *
 * A white-hat penetration tester crafts structured payloads to
 * validate that the masking engine catches PII in security-relevant
 * contexts: form submissions, HTTP headers, and encoded content.
 *
 * @module RoleplayWhiteHatFixtures
 */

import type { LocaleMaskFixture } from "../../declarations/testing.types";

export const WHITE_HAT_POSITIVE: readonly LocaleMaskFixture[] = Object.freeze([
  {
    countryProfileIds: ["us"],
    description: "[white-hat] HTTP Authorization header with Bearer token",
    expectedRuleIds: ["jwt-token"],
    hiddenValues: [
      "eyJhbGciOiJSUzI1NiJ9.eyJ1c2VyIjoiam9obiJ9.SIGNATURE_HERE_1234",
    ],
    sourceText:
      "Authorization: Bearer eyJhbGciOiJSUzI1NiJ9.eyJ1c2VyIjoiam9obiJ9.SIGNATURE_HERE_1234",
  },
  {
    countryProfileIds: ["us"],
    description: "[white-hat] form POST body with PII fields",
    expectedRuleIds: ["email-address", "us-ssn"],
    hiddenValues: ["john@pentest.lab", "999-88-7777"],
    sourceText: [
      "POST /api/submit HTTP/1.1",
      "Content-Type: application/x-www-form-urlencoded",
      "",
      "name=John+Doe&email=john@pentest.lab&ssn=999-88-7777",
    ].join("\n"),
  },
  {
    countryProfileIds: ["us"],
    description: "[white-hat] .env file contents with secrets",
    expectedRuleIds: ["openai-style-key", "aws-access-key"],
    hiddenValues: ["sk-live-testkey1234567890abcdef", "AKIAI44QH8DHBEXAMPLE"],
    sourceText: [
      "OPENAI_API_KEY=sk-live-testkey1234567890abcdef",
      "AWS_ACCESS_KEY_ID=AKIAI44QH8DHBEXAMPLE",
      "DATABASE_URL=postgres://localhost:5432/mydb",
    ].join("\n"),
  },
  {
    countryProfileIds: ["us"],
    description: "[white-hat] GitHub PAT in git config",
    expectedRuleIds: ["github-pat"],
    hiddenValues: ["ghp_ABCDEFghijklmnopqrstuvwxyz012345"],
    sourceText:
      "url = https://ghp_ABCDEFghijklmnopqrstuvwxyz012345@github.com/org/repo.git",
  },
  {
    countryProfileIds: ["us"],
    description: "[white-hat] SSN in SQL INSERT statement (data exfil test)",
    expectedRuleIds: ["us-ssn", "email-address"],
    hiddenValues: ["321-65-0987", "exfil@target.com"],
    sourceText:
      "INSERT INTO users (name, ssn, email) VALUES ('Bob', '321-65-0987', 'exfil@target.com');",
  },
  {
    countryProfileIds: ["us"],
    description: "[white-hat] CSV row with PII columns",
    expectedRuleIds: ["email-address", "us-ssn"],
    hiddenValues: ["alice@csv.test", "456-78-0123"],
    sourceText: "Alice,Smith,alice@csv.test,456-78-0123,1990-01-15,123 Main St",
  },
]);
