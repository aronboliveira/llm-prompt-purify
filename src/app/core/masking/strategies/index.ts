/**
 * Masking Strategies Module
 *
 * Exports all strategy classes and utilities for the masking system.
 *
 * @module strategies
 */

// Core interfaces and abstractions
export {
  AbstractMaskingStrategy,
  DefaultCounterState,
  type CounterState,
  type CounterStateFactory,
  type FormatContext,
  type IMaskingStrategy,
  type MaskingContext,
  type MaskingResult,
} from "./masking-strategy.interface";

// Concrete strategy implementations
export { FakerMaskingStrategy } from "./faker.strategy";
export { RandomMaskingStrategy } from "./random.strategy";
export { RedactedMaskingStrategy } from "./redacted.strategy";
export { TagMaskingStrategy } from "./tag.strategy";

// Registry and builder
export {
  createCounterState,
  createMaskWithStrategy,
  getStrategyRegistry,
  MaskBuilder,
  StrategyRegistry,
} from "./strategy-registry";
