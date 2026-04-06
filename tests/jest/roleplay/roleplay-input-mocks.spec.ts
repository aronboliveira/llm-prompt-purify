/**
 * Roleplay Input Mock Spec
 *
 * Runs role-specific PII fixtures through the masking engine.
 * Each security roleplay persona (QA, black-hat, white-hat,
 * green-hat, CISO, dev) contributes fixtures reflecting their
 * testing philosophy:
 *
 * - QA: realistic edge cases, multi-field, boundary values
 * - Black-hat: evasion, obfuscation, bloating, encoding tricks
 * - White-hat: structured pentest payloads, protocol dumps
 * - Green-hat: simple obvious patterns (beginner)
 * - CISO: compliance docs, audit reports, regulatory context
 * - Dev: logs, JSON, .env, git diffs, shell history
 */
import { MaskingEngine } from "@core/masking/masking.engine";
import {
  assertNegativeFixture,
  assertPositiveFixture,
} from "@testing/utils/masking-engine-assertions.utils";
import {
  QA_POSITIVE,
  BLACK_HAT_POSITIVE,
  BLACK_HAT_NEGATIVE,
  WHITE_HAT_POSITIVE,
  GREEN_HAT_POSITIVE,
  CISO_POSITIVE,
  DEV_POSITIVE,
} from "@testing/constants/roleplay/index";

describe("Roleplay input mocks", () => {
  const engine = new MaskingEngine();

  const positives =
    (fixtures: readonly Parameters<typeof assertPositiveFixture>[1][]) =>
    (e: MaskingEngine) =>
      fixtures.forEach(f =>
        it(f.description, () => assertPositiveFixture(e, f)),
      );

  const negatives =
    (fixtures: readonly Parameters<typeof assertNegativeFixture>[1][]) =>
    (e: MaskingEngine) =>
      fixtures.forEach(f =>
        it(f.description, () => assertNegativeFixture(e, f)),
      );

  describe("[qa] realistic edge-case inputs", () => {
    positives(QA_POSITIVE)(engine);
  });

  describe("[black-hat] evasion and obfuscation", () => {
    describe("positive (should detect)", () => {
      positives(BLACK_HAT_POSITIVE)(engine);
    });
    describe("negative (should NOT false-positive)", () => {
      negatives(BLACK_HAT_NEGATIVE)(engine);
    });
  });

  describe("[white-hat] pentest payloads", () => {
    positives(WHITE_HAT_POSITIVE)(engine);
  });

  describe("[green-hat] basic PII patterns", () => {
    positives(GREEN_HAT_POSITIVE)(engine);
  });

  describe("[ciso] compliance and audit context", () => {
    positives(CISO_POSITIVE)(engine);
  });

  describe("[dev] technical artifact PII", () => {
    positives(DEV_POSITIVE)(engine);
  });
});
export {};
