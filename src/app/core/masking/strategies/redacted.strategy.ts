/**
 * Redacted Masking Strategy
 *
 * Replaces sensitive values with solid block characters (█)
 * matching the original length.
 *
 * @module RedactedStrategy
 */

import {
  AbstractMaskingStrategy,
  type MaskingContext,
  type MaskingResult,
} from "./masking-strategy.interface";

/**
 * Strategy that replaces values with solid redaction blocks.
 *
 * @example
 * "john.doe@email.com" → "██████████████████"
 * "123-45-6789" → "███████████"
 */
export class RedactedMaskingStrategy extends AbstractMaskingStrategy {
  readonly id = "redacted";
  readonly name = "Redacted";
  readonly description =
    "Replaces sensitive values with solid block characters (█)";
  readonly priority = 30;

  /** The character used for redaction */
  private static readonly REDACTION_CHAR = "█";

  protected doMask(context: MaskingContext): MaskingResult {
    const mask = RedactedMaskingStrategy.REDACTION_CHAR.repeat(
      context.value.length,
    );
    return {
      mask,
      complianceApplied: false,
      strategyId: this.id,
      metadata: { originalLength: context.value.length },
    };
  }

  /**
   * Redacted strategy can handle any context - never refuses.
   */
  override canHandle(_context: MaskingContext): boolean {
    return true;
  }
}
