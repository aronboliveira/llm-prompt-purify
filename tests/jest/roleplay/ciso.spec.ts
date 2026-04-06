/**
 * Roleplay Security Tests — CISO (Compliance)
 *
 * Validates CSP compliance checking and grading
 * logic from the CISO governance scripts.
 */
const { parseCsp, checkCompliance, calculateGrade, COMPLIANCE_REQUIREMENTS } =
  require("../../../docs/roleplay/ciso/scripts/js/csp_analyzer") as {
    parseCsp: (raw: string) => Record<string, string[]>;
    checkCompliance: (
      csp: Record<string, string[]>,
    ) => Record<string, { compliant: boolean; violations: string[] }>;
    calculateGrade: (
      report: Record<string, { compliant: boolean; violations: string[] }>,
    ) => string;
    COMPLIANCE_REQUIREMENTS: Record<
      string,
      { required: string[]; forbidden_values: string[] }
    >;
  };

describe("CISO — CSP Compliance Analyzer", () => {
  describe("parseCsp()", () => {
    it("parses a multi-directive CSP header", () => {
      const csp = parseCsp(
        "default-src 'self'; script-src 'self'; object-src 'none'; frame-ancestors 'none'; connect-src 'self'",
      );
      expect(csp["default-src"]).toEqual(["'self'"]);
      expect(csp["object-src"]).toEqual(["'none'"]);
      expect(csp["frame-ancestors"]).toEqual(["'none'"]);
    });

    it("returns empty object for empty/null input", () => {
      expect(parseCsp("")).toEqual({});
      expect(parseCsp(null as unknown as string)).toEqual({});
    });
  });

  describe("checkCompliance()", () => {
    it("reports OWASP-compliant for a strict CSP", () => {
      const csp = parseCsp(
        "default-src 'self'; script-src 'self'; object-src 'none'; frame-ancestors 'none'",
      );
      const result = checkCompliance(csp);
      expect(result["OWASP"].compliant).toBe(true);
      expect(result["OWASP"].violations).toHaveLength(0);
    });

    it("reports OWASP non-compliant when missing object-src", () => {
      const csp = parseCsp(
        "default-src 'self'; script-src 'self'; frame-ancestors 'none'",
      );
      const result = checkCompliance(csp);
      expect(result["OWASP"].compliant).toBe(false);
      expect(
        result["OWASP"].violations.some(v => v.includes("object-src")),
      ).toBe(true);
    });

    it("flags unsafe-eval as PCI-DSS violation", () => {
      const csp = parseCsp(
        "default-src 'self'; script-src 'self' 'unsafe-eval'; style-src 'self'; frame-ancestors 'none'",
      );
      const result = checkCompliance(csp);
      expect(result["PCI-DSS"].compliant).toBe(false);
      expect(
        result["PCI-DSS"].violations.some(v => v.includes("unsafe-eval")),
      ).toBe(true);
    });

    it("flags wildcard as LGPD/GDPR violation", () => {
      const csp = parseCsp("connect-src *; frame-ancestors 'none'");
      const result = checkCompliance(csp);
      expect(result["LGPD/GDPR"].compliant).toBe(false);
    });

    it("passes LGPD/GDPR with restricted connect-src and frame-ancestors", () => {
      const csp = parseCsp(
        "connect-src 'self' https://api.example.com; frame-ancestors 'none'",
      );
      const result = checkCompliance(csp);
      expect(result["LGPD/GDPR"].compliant).toBe(true);
    });
  });

  describe("calculateGrade()", () => {
    it("returns A when all frameworks are compliant", () => {
      const report: Record<
        string,
        { compliant: boolean; violations: string[] }
      > = {
        OWASP: { compliant: true, violations: [] },
        "PCI-DSS": { compliant: true, violations: [] },
        "LGPD/GDPR": { compliant: true, violations: [] },
      };
      expect(calculateGrade(report)).toBe("A");
    });

    it("returns B when one framework is non-compliant", () => {
      const report = {
        OWASP: { compliant: true, violations: [] },
        "PCI-DSS": { compliant: false, violations: ["missing style-src"] },
        "LGPD/GDPR": { compliant: true, violations: [] },
      };
      expect(calculateGrade(report)).toBe("B");
    });

    it("returns F when all frameworks are non-compliant", () => {
      const report = {
        OWASP: { compliant: false, violations: ["v1"] },
        "PCI-DSS": { compliant: false, violations: ["v2"] },
        "LGPD/GDPR": { compliant: false, violations: ["v3"] },
      };
      expect(calculateGrade(report)).toBe("F");
    });
  });

  it("COMPLIANCE_REQUIREMENTS covers at least 3 frameworks", () => {
    expect(Object.keys(COMPLIANCE_REQUIREMENTS).length).toBeGreaterThanOrEqual(
      3,
    );
  });
});
export {};
