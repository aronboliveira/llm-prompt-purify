import { calculateCheckSum } from "./mask-validation.utils";

describe("calculateCheckSum", () => {
  describe("CPF check digits (modulus 11)", () => {
    it("computes check digits for 123456789 → [0, 9]", () => {
      expect(calculateCheckSum("123456789", 11)).toEqual([0, 9]);
    });

    it("computes check digits for 529982247 → [2, 5]", () => {
      // CPF 529.982.247-25
      expect(calculateCheckSum("529982247", 11)).toEqual([2, 5]);
    });

    it("computes check digits for 111444777 → [3, 5]", () => {
      // CPF 111.444.777-35
      expect(calculateCheckSum("111444777", 11)).toEqual([3, 5]);
    });

    it("computes check digits for 000000001 → [9, 1]", () => {
      expect(calculateCheckSum("000000001", 11)).toEqual([9, 1]);
    });
  });

  describe("number input", () => {
    it("accepts a number and converts to string", () => {
      expect(calculateCheckSum(123456789, 11)).toEqual([0, 9]);
    });
  });

  describe("digits with non-digit characters stripped", () => {
    it("strips dots and dashes from input", () => {
      expect(calculateCheckSum("123.456.789", 11)).toEqual([0, 9]);
    });

    it("strips spaces", () => {
      expect(calculateCheckSum("1 2 3 4 5 6 7 8 9", 11)).toEqual([0, 9]);
    });
  });

  describe("single check digit (modulus = bodyLength + 1)", () => {
    it("computes one check digit when modulus exceeds body by 1", () => {
      const result = calculateCheckSum("12345678", 9);
      expect(result).toHaveLength(1);
      expect(typeof result[0]).toBe("number");
    });
  });

  describe("error conditions", () => {
    it("throws when modulus < 2", () => {
      expect(() => calculateCheckSum("123", 1)).toThrow(
        "modulus must be a finite number >= 2",
      );
    });

    it("throws when modulus is NaN", () => {
      expect(() => calculateCheckSum("123", NaN)).toThrow(
        "modulus must be a finite number >= 2",
      );
    });

    it("throws when modulus is Infinity", () => {
      expect(() => calculateCheckSum("123", Infinity)).toThrow(
        "modulus must be a finite number >= 2",
      );
    });

    it("throws when state is empty after stripping", () => {
      expect(() => calculateCheckSum("abc", 11)).toThrow(
        "state must contain at least one digit",
      );
    });

    it("throws when modulus <= digit count", () => {
      expect(() => calculateCheckSum("12345678901", 11)).toThrow(
        "modulus must be greater than the digit count of state",
      );
    });

    it("throws when modulus equals digit count exactly", () => {
      expect(() => calculateCheckSum("12345678901", 11)).toThrow(
        "modulus must be greater than the digit count of state",
      );
    });
  });

  describe("consistency with isValidCpf", () => {
    it("produces digits that match known-valid CPFs", () => {
      const knownBodies = [
        { body: "529982247", expected: [2, 5] },
        { body: "111444777", expected: [3, 5] },
        { body: "123456789", expected: [0, 9] },
      ];

      for (const { body, expected } of knownBodies) {
        expect(calculateCheckSum(body, 11)).toEqual(expected);
      }
    });
  });

  describe("determinism", () => {
    it("returns the same result for repeated calls", () => {
      const a = calculateCheckSum("987654321", 11);
      const b = calculateCheckSum("987654321", 11);
      expect(a).toEqual(b);
    });
  });

  describe("readonly return type", () => {
    it("returns a frozen-compatible readonly array", () => {
      const result = calculateCheckSum("123456789", 11);
      expect(Array.isArray(result)).toBe(true);
      expect(result.every(d => Number.isInteger(d) && d >= 0)).toBe(true);
    });
  });
});
