/**
 * Masking Strategy Pattern Implementation
 *
 * Abstract base class for masking strategies following SOLID principles.
 * Interfaces are isolated in declarations/strategy.types.ts per coding guidelines.
 *
 * @module MaskingStrategy
 */

import type {
  CounterState,
  IMaskingStrategy,
  MaskingContext,
  MaskingResult,
} from "../declarations/strategy.types";

// Re-export types for backward compatibility
export type {
  CounterState,
  CounterStateFactory,
  FormatContext,
  IMaskingStrategy,
  MaskingContext,
  MaskingResult,
} from "../declarations/strategy.types";

/**
 * Abstract base class providing common functionality for masking strategies.
 *
 * Subclasses must implement:
 * - `doMask()`: The actual masking logic
 * - `id`, `name`, `description`, `priority`: Strategy metadata
 *
 * The base class handles:
 * - Compliance checking for financial/identifier categories
 * - Symbol rotation for numeric compliance
 * - Common validation and preprocessing
 */
export abstract class AbstractMaskingStrategy implements IMaskingStrategy {
  abstract readonly id: string;
  abstract readonly name: string;
  abstract readonly description: string;
  abstract readonly priority: number;

  /** Symbol set for numeric compliance masking */
  protected static readonly COMPLIANCE_SYMBOLS = ["#", "@", "*", "$"] as const;

  /**
   * Template method implementing the masking pipeline.
   * Applies compliance rules before delegating to strategy-specific logic.
   */
  mask(context: MaskingContext): MaskingResult {
    // Check if compliance masking is required
    if (this.requiresComplianceMask(context)) {
      return {
        mask: this.createComplianceMask(context.value),
        complianceApplied: true,
        strategyId: this.id,
        metadata: { originalStrategy: "compliance-override" },
      };
    }

    return this.doMask(context);
  }

  /**
   * Strategy-specific masking implementation.
   * Must be implemented by subclasses.
   */
  protected abstract doMask(context: MaskingContext): MaskingResult;

  /**
   * Default implementation: can handle any context.
   * Override in subclasses for specialized strategies.
   */
  canHandle(_context: MaskingContext): boolean {
    return true;
  }

  /**
   * Determines if compliance masking is required.
   * Financial and identifier values containing digits must use symbol masking.
   */
  protected requiresComplianceMask(context: MaskingContext): boolean {
    const { category, value } = context;
    if (category !== "financial" && category !== "identifier") return false;
    return /\d/u.test(value);
  }

  /**
   * Creates a compliance-safe mask using rotating symbols.
   * Digits and letters are replaced with symbols (#, @, *, $) in rotation.
   */
  protected createComplianceMask(value: string): string {
    let symbolIndex = 0;
    const masked = Array.from(value, char => {
      if (/[\p{L}\p{N}]/u.test(char)) {
        const sym =
          AbstractMaskingStrategy.COMPLIANCE_SYMBOLS[
            symbolIndex % AbstractMaskingStrategy.COMPLIANCE_SYMBOLS.length
          ];
        symbolIndex++;
        return sym;
      }
      return char;
    }).join("");

    return symbolIndex > 0
      ? masked
      : AbstractMaskingStrategy.COMPLIANCE_SYMBOLS.join("")
          .repeat(
            Math.ceil(
              Math.max(value.length, 4) /
                AbstractMaskingStrategy.COMPLIANCE_SYMBOLS.length,
            ),
          )
          .slice(0, Math.max(value.length, 4));
  }
}

/**
 * Default implementation of CounterState.
 */
export class DefaultCounterState implements CounterState {
  readonly counters = new Map<string, number>();

  getNext(label: string): number {
    const current = this.counters.get(label) ?? 0,
      next = current + 1;
    this.counters.set(label, next);
    return next;
  }
}
