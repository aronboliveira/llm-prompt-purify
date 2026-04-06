/**
 * Dev Roleplay Input Mock Fixtures
 *
 * A senior developer encounters PII in technical artifacts:
 * log files, JSON payloads, shell history, config files, and
 * code snippets that accidentally embed secrets or user data.
 *
 * @module RoleplayDevFixtures
 */

import type { LocaleMaskFixture } from "../../declarations/testing.types";

export const DEV_POSITIVE: readonly LocaleMaskFixture[] = Object.freeze([
  {
    countryProfileIds: ["us"],
    description: "[dev] application log line with user email",
    expectedRuleIds: ["email-address"],
    hiddenValues: ["user42@startup.io"],
    sourceText:
      "[2025-03-15T14:22:01Z] ERROR UserService: failed login for user42@startup.io from 10.0.0.1",
  },
  {
    countryProfileIds: ["us"],
    description: "[dev] JSON API response with PII fields",
    expectedRuleIds: ["email-address", "us-ssn"],
    hiddenValues: ["bob@api.test", "321-54-9876"],
    sourceText: [
      '{"id": 42, "name": "Bob",',
      ' "email": "bob@api.test",',
      ' "ssn": "321-54-9876",',
      ' "role": "admin"}',
    ].join("\n"),
  },
  {
    countryProfileIds: ["us"],
    description: "[dev] .env file leak with multiple secrets",
    expectedRuleIds: ["aws-access-key"],
    hiddenValues: ["AKIAIOSFODNN7EXAMPLE"],
    sourceText: [
      "NODE_ENV=production",
      "AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE",
      "PORT=3000",
    ].join("\n"),
  },
  {
    countryProfileIds: ["us"],
    description: "[dev] git diff context with embedded secret",
    expectedRuleIds: ["openai-style-key"],
    hiddenValues: ["sk-proj-myDevKey12345678901234567"],
    sourceText: [
      "diff --git a/config.ts b/config.ts",
      "--- a/config.ts",
      "+++ b/config.ts",
      "@@ -3,2 +3,2 @@",
      '-const API_KEY = "placeholder";',
      '+const API_KEY = "sk-proj-myDevKey12345678901234567";',
    ].join("\n"),
  },
  {
    countryProfileIds: ["us"],
    description: "[dev] database query result with SSN column",
    expectedRuleIds: ["us-ssn", "email-address"],
    hiddenValues: ["555-44-3322", "alice@db.local"],
    sourceText: [
      "SELECT * FROM users WHERE active = true;",
      "-- Result:",
      "-- id | name  | ssn         | email",
      "-- 1  | Alice | 555-44-3322 | alice@db.local",
    ].join("\n"),
  },
  {
    countryProfileIds: ["us"],
    description: "[dev] shell history with curl and auth header",
    expectedRuleIds: ["github-pat"],
    hiddenValues: ["ghp_1234567890abcdefGHIJKLMNOPQRST"],
    sourceText:
      'curl -H "Authorization: token ghp_1234567890abcdefGHIJKLMNOPQRST" https://api.github.com/user',
  },
]);
