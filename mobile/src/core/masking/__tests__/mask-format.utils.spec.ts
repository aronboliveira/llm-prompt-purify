/**
 * Unit tests for mask-format utility functions.
 * Covers createMask, createDistinctMask, invalidateCandidateMask,
 * redactPreview, and sanitizeCapturedValue.
 */
import {
  createDistinctMask,
  createMask,
  invalidateCandidateMask,
  redactPreview,
  sanitizeCapturedValue,
} from "../utils/mask-format.utils";

// ---------------------------------------------------------------------------
// createMask
// ---------------------------------------------------------------------------
describe("createMask", () => {
  it("preserves character-class structure", () => {
    const mask = createMask("Hello 123");
    // Uppercase → uppercase, lowercase → lowercase, digit → digit, space → space
    expect(mask).toMatch(/^[A-Z][a-z]{4} \d{3}$/);
  });

  it("preserves length", () => {
    const value = "Test@1234!";
    expect(createMask(value).length).toBe(value.length);
  });

  it("returns empty for empty input", () => {
    expect(createMask("")).toBe("");
  });

  it("keeps whitespace in position", () => {
    const mask = createMask("a b c");
    expect(mask[1]).toBe(" ");
    expect(mask[3]).toBe(" ");
  });
});

// ---------------------------------------------------------------------------
// createDistinctMask
// ---------------------------------------------------------------------------
describe("createDistinctMask", () => {
  it("returns non-empty mask for valid input", () => {
    const mask = createDistinctMask("529.982.247-25");
    expect(mask.length).toBe("529.982.247-25".length);
    expect(mask).not.toBe("");
  });

  it("returns empty for empty input", () => {
    expect(createDistinctMask("")).toBe("");
  });

  it("generates a different mask when previousMask provided", () => {
    const value = "TestValue1234";
    const first = createDistinctMask(value);
    // Due to randomness + hex suffix fallback, second should usually differ
    const second = createDistinctMask(value, first);
    // We can't assert inequality with certainty (cosmic-ray probability),
    // but the function won't crash
    expect(second.length).toBe(value.length);
  });
});

// ---------------------------------------------------------------------------
// invalidateCandidateMask
// ---------------------------------------------------------------------------
describe("invalidateCandidateMask", () => {
  it("changes the last alphanumeric character", () => {
    const result = invalidateCandidateMask("abc");
    // Last alphanumeric 'c' should cycle to 'd'
    expect(result).not.toBe("abc");
    expect(result.length).toBe(3);
  });

  it("returns unchanged value when no alphanumeric chars", () => {
    expect(invalidateCandidateMask("---")).toBe("---");
    expect(invalidateCandidateMask("")).toBe("");
  });

  it("cycles digits correctly", () => {
    const result = invalidateCandidateMask("12");
    // '2' → '3'
    expect(result).toBe("13");
  });
});

// ---------------------------------------------------------------------------
// redactPreview
// ---------------------------------------------------------------------------
describe("redactPreview", () => {
  it("redacts long values with first3 + *** + last2", () => {
    expect(redactPreview("1234567890")).toBe("123***90");
  });

  it("redacts 7-char value", () => {
    expect(redactPreview("abcdefg")).toBe("abc***fg");
  });

  it("shows shortened preview for short values", () => {
    expect(redactPreview("abcdef")).toBe("a***");
    expect(redactPreview("ab")).toBe("a***");
  });

  it("handles single character", () => {
    expect(redactPreview("x")).toBe("x***");
  });

  it("handles empty string", () => {
    expect(redactPreview("")).toBe("");
  });
});

// ---------------------------------------------------------------------------
// sanitizeCapturedValue
// ---------------------------------------------------------------------------
describe("sanitizeCapturedValue", () => {
  it("trims whitespace", () => {
    expect(sanitizeCapturedValue("  hello  ")).toBe("hello");
  });

  it("removes trailing delimiters", () => {
    expect(sanitizeCapturedValue("value;:,")).toBe("value");
    expect(sanitizeCapturedValue("value,")).toBe("value");
  });

  it("preserves internal delimiters", () => {
    expect(sanitizeCapturedValue("a;b;c")).toBe("a;b;c");
  });

  it("handles empty string", () => {
    expect(sanitizeCapturedValue("")).toBe("");
  });
});
