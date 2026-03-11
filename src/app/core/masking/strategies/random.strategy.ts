/**
 * Random Masking Strategy
 *
 * Generates random but format-preserving replacements that maintain
 * the same character class structure as the original value.
 *
 * @module RandomStrategy
 */

import { createDistinctMask } from "../utils/mask-format.utils";
import {
  AbstractMaskingStrategy,
  type MaskingContext,
  type MaskingResult,
} from "./masking-strategy.interface";

/**
 * Strategy that generates random format-preserving masks.
 *
 * Preserves:
 * - Character class distribution (letters, digits, symbols)
 * - Special separators (., -, /, etc.)
 * - Overall string length
 *
 * @example
 * "john.doe@email.com" → "xkjd.lmn@qwert.xyz"
 * "123-45-6789" → "###-@@-****"
 */
export class RandomMaskingStrategy extends AbstractMaskingStrategy {
  readonly id = "random";
  readonly name = "Random";
  readonly description =
    "Generates random format-preserving replacements that maintain character class structure";
  readonly priority = 50;

  protected doMask(context: MaskingContext): MaskingResult {
    // Fast path: most values are not emails
    // Check ruleId first (cheap string check), then category + regex only if needed
    if (
      context.ruleId.includes("email") ||
      (context.category === "personal" && context.value.includes("@"))
    ) {
      return this.maskEmail(context);
    }

    const mask = createDistinctMask(context.value, context.previousMask);
    return {
      mask,
      complianceApplied: false,
      strategyId: this.id,
    };
  }

  private maskEmail(context: MaskingContext): MaskingResult {
    const counter = context.counterState?.getNext("EMAIL") ?? 1;
    const hex = this.randomHex(4);
    const domain = this.pickFakeDomain();

    return {
      mask: `xXx_user${counter}_${hex}@${domain}`,
      complianceApplied: false,
      strategyId: this.id,
      metadata: { emailCounter: counter },
    };
  }

  private pickFakeDomain(): string {
    const domains = [
      "INVALID-DOMAIN.example",
      "NOT-REAL-ADDR.example",
      "FAKE-MAILBOX.test.example",
      "REDACTED-EMAIL.example.net",
    ];
    return domains[this.randomInt(domains.length)];
  }

  private randomHex(length: number): string {
    return this.randomInt(0xffff)
      .toString(16)
      .padStart(length, "0")
      .toUpperCase();
  }

  private randomInt(max: number): number {
    if (
      typeof crypto !== "undefined" &&
      typeof crypto.getRandomValues === "function"
    ) {
      return crypto.getRandomValues(new Uint32Array(1))[0] % max;
    }
    return Math.floor(Math.random() * max);
  }
}
