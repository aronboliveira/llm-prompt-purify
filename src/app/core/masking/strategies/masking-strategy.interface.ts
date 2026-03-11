/**
 * Masking Strategy Pattern Implementation
 *
 * This module implements the Strategy Design Pattern for the masking system,
 * following SOLID principles:
 *
 * - Single Responsibility: Each strategy handles only one masking approach
 * - Open/Closed: New strategies can be added without modifying existing code
 * - Liskov Substitution: All strategies are interchangeable via the interface
 * - Interface Segregation: Strategies only implement what they need
 * - Dependency Inversion: High-level modules depend on abstractions
 *
 * @module MaskingStrategy
 */

import type { MatchCategory } from "../declarations/masking.types";

/**
 * Context passed to strategy methods containing all information
 * needed to generate an appropriate mask.
 */
export interface MaskingContext {
  /** The original sensitive value to be masked */
  readonly value: string;

  /** The detection rule ID that matched this value */
  readonly ruleId: string;

  /** The category of the match (personal, financial, etc.) */
  readonly category: MatchCategory;

  /** Optional: the previous mask for this value (for regeneration) */
  readonly previousMask?: string;

  /** Optional: counter state for numbered placeholders */
  readonly counterState?: CounterState;

  /** Optional: detected format context (json, yaml, plaintext, etc.) */
  readonly formatContext?: FormatContext;
}

/**
 * Counter state for tracking sequential numbering across a scan session.
 */
export interface CounterState {
  readonly counters: Map<string, number>;
  getNext(label: string): number;
}

/**
 * Format context providing information about the detected document format.
 */
export interface FormatContext {
  readonly type: "json" | "yaml" | "toml" | "xml" | "plaintext" | "unknown";
  readonly isStructuredKey?: boolean;
  readonly keyName?: string;
  readonly depth?: number;
}

/**
 * Result of a masking operation.
 */
export interface MaskingResult {
  /** The generated mask string */
  readonly mask: string;

  /** Whether compliance rules were applied */
  readonly complianceApplied: boolean;

  /** Strategy that generated this mask */
  readonly strategyId: string;

  /** Optional metadata about the masking operation */
  readonly metadata?: Record<string, unknown>;
}

/**
 * Strategy interface for masking operations.
 *
 * Each implementation provides a specific masking approach:
 * - RandomStrategy: Generates random but compliant replacements
 * - FakerStrategy: Uses numbered placeholders like {EMAIL1}, {SSN2}
 * - TagStrategy: Uses semantic XML-like tags like <EMAIL>, <SSN>
 * - RedactedStrategy: Replaces with solid blocks █████
 *
 * @example
 * ```typescript
 * const strategy: IMaskingStrategy = new FakerStrategy();
 * const result = strategy.mask({
 *   value: "john.doe@example.com",
 *   ruleId: "email-address",
 *   category: "personal"
 * });
 * // result.mask === "{EMAIL1}"
 * ```
 */
export interface IMaskingStrategy {
  /** Unique identifier for this strategy */
  readonly id: string;

  /** Human-readable name */
  readonly name: string;

  /** Description of what this strategy does */
  readonly description: string;

  /**
   * Generates a mask for the given context.
   *
   * @param context - The masking context containing value and metadata
   * @returns The masking result with the generated mask
   */
  mask(context: MaskingContext): MaskingResult;

  /**
   * Determines if this strategy can handle the given context.
   * Used for strategy selection in complex scenarios.
   *
   * @param context - The masking context to evaluate
   * @returns true if this strategy can handle the context
   */
  canHandle(context: MaskingContext): boolean;

  /**
   * Returns the priority of this strategy for conflict resolution.
   * Higher priority strategies are preferred when multiple match.
   */
  readonly priority: number;
}

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
 * Factory function type for creating counter state.
 */
export type CounterStateFactory = () => CounterState;

/**
 * Default implementation of CounterState.
 */
export class DefaultCounterState implements CounterState {
  readonly counters = new Map<string, number>();

  getNext(label: string): number {
    const current = this.counters.get(label) ?? 0;
    const next = current + 1;
    this.counters.set(label, next);
    return next;
  }
}
