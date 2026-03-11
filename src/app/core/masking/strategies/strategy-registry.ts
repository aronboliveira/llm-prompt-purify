/**
 * Strategy Registry and Builder
 *
 * Provides centralized strategy management following the Registry pattern.
 * Allows dynamic registration, selection by ID, and context-based resolution.
 *
 * @module StrategyRegistry
 */

import type { MaskingStrategy as MaskingStrategyType } from "../declarations/masking.types";
import { FakerMaskingStrategy } from "./faker.strategy";
import type {
  CounterState,
  IMaskingStrategy,
  MaskingContext,
  MaskingResult,
} from "./masking-strategy.interface";
import { DefaultCounterState } from "./masking-strategy.interface";
import { RandomMaskingStrategy } from "./random.strategy";
import { RedactedMaskingStrategy } from "./redacted.strategy";
import { TagMaskingStrategy } from "./tag.strategy";

/**
 * Registry holding all available masking strategies.
 *
 * Provides:
 * - Strategy registration
 * - Strategy lookup by ID
 * - Default strategy resolution
 * - Context-based selection
 */
export class StrategyRegistry {
  private readonly strategies = new Map<string, IMaskingStrategy>();
  private defaultStrategyId = "random";

  constructor() {
    // Register built-in strategies
    this.register(new RandomMaskingStrategy());
    this.register(new FakerMaskingStrategy());
    this.register(new TagMaskingStrategy());
    this.register(new RedactedMaskingStrategy());
  }

  /**
   * Registers a new strategy.
   * @param strategy - The strategy to register
   */
  register(strategy: IMaskingStrategy): void {
    this.strategies.set(strategy.id, strategy);
  }

  /**
   * Gets a strategy by ID.
   * @param id - The strategy ID
   * @returns The strategy or undefined if not found
   */
  get(id: string): IMaskingStrategy | undefined {
    return this.strategies.get(id);
  }

  /**
   * Gets all registered strategies.
   */
  getAll(): readonly IMaskingStrategy[] {
    return Array.from(this.strategies.values());
  }

  /**
   * Sets the default strategy ID.
   * @param id - The strategy ID to use as default
   */
  setDefault(id: string): void {
    if (!this.strategies.has(id)) {
      throw new Error(`Strategy "${id}" not registered`);
    }
    this.defaultStrategyId = id;
  }

  /**
   * Gets the default strategy.
   */
  getDefault(): IMaskingStrategy {
    const strategy = this.strategies.get(this.defaultStrategyId);
    if (!strategy) {
      throw new Error(`Default strategy "${this.defaultStrategyId}" not found`);
    }
    return strategy;
  }

  /**
   * Resolves the best strategy for a given context.
   * Uses priority-based selection when multiple strategies can handle the context.
   */
  resolveForContext(context: MaskingContext): IMaskingStrategy {
    const candidates = Array.from(this.strategies.values()).filter(s =>
      s.canHandle(context),
    );

    if (candidates.length === 0) {
      return this.getDefault();
    }

    // Sort by priority (higher first) and return the best match
    candidates.sort((a, b) => b.priority - a.priority);
    return candidates[0];
  }
}

/**
 * Builder pattern for creating masks with fluent API.
 *
 * @example
 * ```typescript
 * const mask = MaskBuilder.create()
 *   .withValue("john.doe@email.com")
 *   .withRuleId("email-address")
 *   .withCategory("personal")
 *   .withStrategy("faker")
 *   .build();
 * ```
 */
export class MaskBuilder {
  private value = "";
  private ruleId = "";
  private category:
    | "personal"
    | "financial"
    | "identifier"
    | "location"
    | "credential" = "personal";
  private previousMask?: string;
  private counterState?: CounterState;
  private strategyId?: string;
  private registry: StrategyRegistry;

  private constructor(registry?: StrategyRegistry) {
    this.registry = registry ?? new StrategyRegistry();
  }

  /**
   * Creates a new builder instance.
   */
  static create(registry?: StrategyRegistry): MaskBuilder {
    return new MaskBuilder(registry);
  }

  /**
   * Sets the value to mask.
   */
  withValue(value: string): MaskBuilder {
    this.value = value;
    return this;
  }

  /**
   * Sets the rule ID.
   */
  withRuleId(ruleId: string): MaskBuilder {
    this.ruleId = ruleId;
    return this;
  }

  /**
   * Sets the match category.
   */
  withCategory(
    category:
      | "personal"
      | "financial"
      | "identifier"
      | "location"
      | "credential",
  ): MaskBuilder {
    this.category = category;
    return this;
  }

  /**
   * Sets the previous mask (for regeneration scenarios).
   */
  withPreviousMask(mask: string): MaskBuilder {
    this.previousMask = mask;
    return this;
  }

  /**
   * Sets the counter state for numbered placeholders.
   */
  withCounterState(state: CounterState): MaskBuilder {
    this.counterState = state;
    return this;
  }

  /**
   * Sets the strategy to use by ID.
   */
  withStrategy(strategyId: string): MaskBuilder {
    this.strategyId = strategyId;
    return this;
  }

  /**
   * Builds the mask using the configured settings.
   */
  build(): MaskingResult {
    const context: MaskingContext = {
      value: this.value,
      ruleId: this.ruleId,
      category: this.category,
      previousMask: this.previousMask,
      counterState: this.counterState,
    };

    const strategy = this.strategyId
      ? (this.registry.get(this.strategyId) ?? this.registry.getDefault())
      : this.registry.resolveForContext(context);

    return strategy.mask(context);
  }

  /**
   * Convenience method to get just the mask string.
   */
  buildMask(): string {
    return this.build().mask;
  }
}

/**
 * Singleton instance of the strategy registry.
 */
let globalRegistry: StrategyRegistry | undefined;

/**
 * Gets the global strategy registry instance.
 */
export function getStrategyRegistry(): StrategyRegistry {
  if (!globalRegistry) {
    globalRegistry = new StrategyRegistry();
  }
  return globalRegistry;
}

// Pre-cached strategy instances for maximum performance in the bridge function
const CACHED_STRATEGIES: Record<string, IMaskingStrategy> = {
  random: new RandomMaskingStrategy(),
  faker: new FakerMaskingStrategy(),
  tags: new TagMaskingStrategy(),
  redacted: new RedactedMaskingStrategy(),
};
const DEFAULT_STRATEGY = CACHED_STRATEGIES["random"];

/**
 * Bridge function to maintain backward compatibility with existing code.
 * Maps the legacy MaskingStrategy type to the new strategy system.
 *
 * Uses pre-cached strategy instances for maximum performance.
 */
export function createMaskWithStrategy(
  value: string,
  ruleId: string,
  category: "personal" | "financial" | "identifier" | "location" | "credential",
  strategy: MaskingStrategyType,
  previousMask?: string,
  counterState?: CounterState,
): string {
  // Direct lookup from pre-cached strategies - avoids registry overhead
  const strategyInstance = CACHED_STRATEGIES[strategy] ?? DEFAULT_STRATEGY;

  const context: MaskingContext = {
    value,
    ruleId,
    category,
    previousMask,
    counterState,
  };

  return strategyInstance.mask(context).mask;
}

/**
 * Creates a new counter state for a scan session.
 */
export function createCounterState(): CounterState {
  return new DefaultCounterState();
}
