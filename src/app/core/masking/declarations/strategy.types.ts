/**
 * Strategy Pattern Type Declarations
 *
 * Type definitions for the masking strategy system.
 * Isolated from concrete implementations per coding guidelines.
 *
 * @module StrategyTypes
 */

import type { MatchCategory } from "./masking.types";

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
 */
export interface IMaskingStrategy {
  /** Unique identifier for this strategy */
  readonly id: string;
  /** Human-readable name */
  readonly name: string;
  /** Description of what this strategy does */
  readonly description: string;
  /** Returns the priority of this strategy for conflict resolution */
  readonly priority: number;
  /**
   * Generates a mask for the given context.
   * @param context - The masking context containing value and metadata
   * @returns The masking result with the generated mask
   */
  mask(context: MaskingContext): MaskingResult;
  /**
   * Determines if this strategy can handle the given context.
   * @param context - The masking context to evaluate
   * @returns true if this strategy can handle the context
   */
  canHandle(context: MaskingContext): boolean;
}

/**
 * Factory function type for creating counter state.
 */
export type CounterStateFactory = () => CounterState;
