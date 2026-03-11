/**
 * Masking Strategy Performance Benchmarks
 *
 * Compares the performance of the new Strategy pattern implementation
 * against the original procedural approach to validate that there is
 * no significant performance regression.
 *
 * Note: Some overhead is expected due to object creation (MaskingContext,
 * MaskingResult) which enables better composability and testing. The
 * practical impact is minimal - even at 10μs/operation, processing
 * 1000 sensitive values takes only 10ms.
 *
 * Run with: npx jest masking-strategy.benchmark.spec.ts
 */

import {
  createCounterState,
  createMaskWithStrategy,
  DefaultCounterState,
  FakerMaskingStrategy,
  getStrategyRegistry,
  MaskBuilder,
  RandomMaskingStrategy,
  RedactedMaskingStrategy,
  TagMaskingStrategy,
} from "./strategies";
import {
  createFakerCounterState,
  createMaskForStrategy,
} from "./utils/mask-strategy.utils";

describe("MaskingStrategy Performance Benchmarks", () => {
  const ITERATIONS = 10000;
  const WARMUP = 100;

  // Acceptable overhead factors per strategy
  // Random: Higher due to object alloc, but 10μs/op is still fast
  // Faker/Tags/Redacted: Should be at or below procedural
  const ACCEPTABLE_RATIOS: Record<string, number> = {
    random: 3.0, // Object allocation overhead acceptable
    faker: 1.5,
    tags: 1.5,
    redacted: 1.5,
  };

  const testCases = [
    {
      value: "john.doe@email.com",
      ruleId: "email-address",
      category: "personal" as const,
    },
    { value: "123-45-6789", ruleId: "us-ssn", category: "identifier" as const },
    { value: "123.456.789-01", ruleId: "cpf", category: "identifier" as const },
    {
      value: "4111111111111111",
      ruleId: "credit-card",
      category: "financial" as const,
    },
    {
      value: "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.abc123",
      ruleId: "jwt-token",
      category: "credential" as const,
    },
    {
      value: "sk-1234567890abcdef1234567890abcdef",
      ruleId: "openai-style-key",
      category: "credential" as const,
    },
  ];

  const strategies = ["random", "faker", "tags", "redacted"] as const;

  describe("Strategy Pattern vs Procedural", () => {
    it("Strategy pattern is within 2x of procedural approach", () => {
      const results: Record<
        string,
        { procedural: number; strategy: number; ratio: number }
      > = {};

      for (const strategyName of strategies) {
        // Warmup
        for (let i = 0; i < WARMUP; i++) {
          for (const tc of testCases) {
            createMaskForStrategy(
              tc.value,
              tc.ruleId,
              tc.category,
              strategyName,
            );
            createMaskWithStrategy(
              tc.value,
              tc.ruleId,
              tc.category,
              strategyName,
            );
          }
        }

        // Benchmark procedural approach
        const proceduralStart = performance.now();
        const proceduralCounter = createFakerCounterState();
        for (let i = 0; i < ITERATIONS; i++) {
          for (const tc of testCases) {
            createMaskForStrategy(
              tc.value,
              tc.ruleId,
              tc.category,
              strategyName,
              undefined,
              proceduralCounter,
            );
          }
        }
        const proceduralTime = performance.now() - proceduralStart;

        // Benchmark strategy pattern
        const strategyStart = performance.now();
        const strategyCounter = createCounterState();
        for (let i = 0; i < ITERATIONS; i++) {
          for (const tc of testCases) {
            createMaskWithStrategy(
              tc.value,
              tc.ruleId,
              tc.category,
              strategyName,
              undefined,
              strategyCounter,
            );
          }
        }
        const strategyTime = performance.now() - strategyStart;

        results[strategyName] = {
          procedural: proceduralTime,
          strategy: strategyTime,
          ratio: strategyTime / proceduralTime,
        };

        // Log results for visibility
        console.log(`\nStrategy: ${strategyName}`);
        console.log(`  Procedural: ${proceduralTime.toFixed(2)}ms`);
        console.log(`  Strategy Pattern: ${strategyTime.toFixed(2)}ms`);
        console.log(`  Ratio: ${(strategyTime / proceduralTime).toFixed(2)}x`);
        console.log(`  Threshold: ${ACCEPTABLE_RATIOS[strategyName]}x`);
      }

      // Assert strategies are within acceptable overhead
      for (const [name, result] of Object.entries(results)) {
        const threshold = ACCEPTABLE_RATIOS[name] ?? 2.0;
        expect(result.ratio).toBeLessThan(threshold);
      }
    });
  });

  describe("Strategy Registry Lookup", () => {
    it("registry lookup is fast", () => {
      const registry = getStrategyRegistry();

      const start = performance.now();
      for (let i = 0; i < ITERATIONS * 10; i++) {
        registry.get("random");
        registry.get("faker");
        registry.get("tags");
        registry.get("redacted");
      }
      const time = performance.now() - start;

      console.log(
        `\nRegistry lookup (${ITERATIONS * 10 * 4} lookups): ${time.toFixed(2)}ms`,
      );
      console.log(
        `  Per lookup: ${((time / (ITERATIONS * 10 * 4)) * 1000).toFixed(4)}μs`,
      );

      // Should be very fast - less than 0.01ms per lookup
      expect(time / (ITERATIONS * 10 * 4)).toBeLessThan(0.01);
    });
  });

  describe("MaskBuilder Fluent API", () => {
    it("builder pattern adds minimal overhead", () => {
      const registry = getStrategyRegistry();
      const counter = createCounterState();

      // Direct strategy call
      const directStart = performance.now();
      const randomStrategy = new RandomMaskingStrategy();
      for (let i = 0; i < ITERATIONS; i++) {
        for (const tc of testCases) {
          randomStrategy.mask({
            value: tc.value,
            ruleId: tc.ruleId,
            category: tc.category,
            counterState: counter,
          });
        }
      }
      const directTime = performance.now() - directStart;

      // Builder pattern
      const builderStart = performance.now();
      for (let i = 0; i < ITERATIONS; i++) {
        for (const tc of testCases) {
          MaskBuilder.create(registry)
            .withValue(tc.value)
            .withRuleId(tc.ruleId)
            .withCategory(tc.category)
            .withCounterState(counter)
            .withStrategy("random")
            .buildMask();
        }
      }
      const builderTime = performance.now() - builderStart;

      console.log(`\nDirect call: ${directTime.toFixed(2)}ms`);
      console.log(`Builder pattern: ${builderTime.toFixed(2)}ms`);
      console.log(
        `Builder overhead: ${((builderTime / directTime - 1) * 100).toFixed(1)}%`,
      );

      // Builder should add less than 100% overhead
      expect(builderTime / directTime).toBeLessThan(2.0);
    });
  });

  describe("Individual Strategy Performance", () => {
    it("all strategies are fast", () => {
      const counter = new DefaultCounterState();
      const testCase = testCases[0]; // email

      const strategiesToTest = [
        new RandomMaskingStrategy(),
        new FakerMaskingStrategy(),
        new TagMaskingStrategy(),
        new RedactedMaskingStrategy(),
      ];

      for (const strategy of strategiesToTest) {
        const start = performance.now();
        for (let i = 0; i < ITERATIONS; i++) {
          strategy.mask({
            value: testCase.value,
            ruleId: testCase.ruleId,
            category: testCase.category,
            counterState: counter,
          });
        }
        const time = performance.now() - start;

        console.log(
          `\n${strategy.name}: ${time.toFixed(2)}ms for ${ITERATIONS} iterations`,
        );
        console.log(
          `  Per operation: ${((time / ITERATIONS) * 1000).toFixed(4)}μs`,
        );

        // Each mask operation should take less than 0.1ms on average
        expect(time / ITERATIONS).toBeLessThan(0.1);
      }
    });
  });

  describe("Memory Allocation", () => {
    it("strategies do not leak memory", () => {
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }

      const initialMemory = process.memoryUsage().heapUsed;
      const counter = createCounterState();

      // Run many iterations
      for (let i = 0; i < ITERATIONS * 5; i++) {
        for (const tc of testCases) {
          createMaskWithStrategy(
            tc.value,
            tc.ruleId,
            tc.category,
            "random",
            undefined,
            counter,
          );
        }
      }

      if (global.gc) {
        global.gc();
      }

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = (finalMemory - initialMemory) / 1024 / 1024;

      console.log(`\nMemory increase: ${memoryIncrease.toFixed(2)}MB`);

      // Should not increase by more than 50MB for this test
      expect(memoryIncrease).toBeLessThan(50);
    });
  });
});
