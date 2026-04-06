/**
 * Roleplay Security Tests — White Hat (Advanced)
 *
 * Validates XSS detection and CSP parsing/auditing
 * logic from the white-hat ethical hacking scripts.
 */
const { XSS_PAYLOADS, analyzeXssSafety, runXssProbe } =
  require("../../../docs/roleplay/white-hat/scripts/js/dom_xss_probe") as {
    XSS_PAYLOADS: string[];
    analyzeXssSafety: (
      maskedText: string,
      payload: string,
    ) => { safe: boolean; reason: string };
    runXssProbe: (fn: (t: string) => string) => {
      total: number;
      safe: number;
      unsafe: number;
      details: { safe: boolean }[];
    };
  };
const { parseCsp, auditCsp, REQUIRED_DIRECTIVES } =
  require("../../../docs/roleplay/white-hat/scripts/js/csp_bypass_test") as {
    parseCsp: (header: string) => Record<string, string[]>;
    auditCsp: (csp: Record<string, string[]>) => {
      grade: string;
      issues: string[];
      missing: string[];
    };
    REQUIRED_DIRECTIVES: string[];
  };

describe("White Hat — DOM XSS Probe", () => {
  it("has at least 8 XSS payload test vectors", () => {
    expect(XSS_PAYLOADS.length).toBeGreaterThanOrEqual(8);
  });

  it("detects a raw <script> tag as unsafe", () => {
    const result = analyzeXssSafety('<script>alert("xss")</script>', "");
    expect(result.safe).toBe(false);
    expect(result.reason).toContain("script");
  });

  it("detects an onerror handler as unsafe", () => {
    const result = analyzeXssSafety("<img src=x onerror=alert(1)>", "");
    expect(result.safe).toBe(false);
    expect(result.reason).toContain("event handler");
  });

  it("detects javascript: URI as unsafe", () => {
    const result = analyzeXssSafety("javascript:alert(1)", "");
    expect(result.safe).toBe(false);
    expect(result.reason).toContain("javascript");
  });

  it("detects Angular template injection as unsafe", () => {
    const result = analyzeXssSafety(
      "{{constructor.constructor('return this')()}}",
      "",
    );
    expect(result.safe).toBe(false);
    expect(result.reason).toContain("Angular");
  });

  it("marks plain text as safe", () => {
    const result = analyzeXssSafety("Hello, this is a normal message.", "");
    expect(result.safe).toBe(true);
  });

  it("marks masked output as safe", () => {
    const result = analyzeXssSafety(
      "Contact [MASKED_EMAIL_001] for details.",
      "",
    );
    expect(result.safe).toBe(true);
  });

  describe("runXssProbe()", () => {
    it("detects all payloads as unsafe when no sanitization is applied", () => {
      const results = runXssProbe(text => text);
      expect(results.unsafe).toBeGreaterThan(0);
      expect(results.total).toBe(XSS_PAYLOADS.length);
    });

    it("reports all safe when input is fully escaped", () => {
      const escape = (t: string) => {
        let s = t.replace(
          /[<>"'&]/g,
          (c: string) =>
            ({
              "<": "&lt;",
              ">": "&gt;",
              '"': "&quot;",
              "'": "&#39;",
              "&": "&amp;",
            })[c] ?? c,
        );
        s = s.replace(/javascript:/gi, "blocked:");
        s = s.replace(/on(\w+)\s*=/gi, "data-blocked-$1=");
        s = s.replace(/\{\{/g, "&#123;&#123;");
        return s;
      };
      const results = runXssProbe(escape);
      expect(results.safe).toBe(results.total);
      expect(results.unsafe).toBe(0);
    });
  });
});

describe("White Hat — CSP Bypass Test", () => {
  describe("parseCsp()", () => {
    it("parses a valid CSP string into directives", () => {
      const csp = parseCsp(
        "default-src 'self'; script-src 'self' https://cdn.example.com; style-src 'self' 'unsafe-inline'",
      );
      expect(csp["default-src"]).toEqual(["'self'"]);
      expect(csp["script-src"]).toEqual(["'self'", "https://cdn.example.com"]);
      expect(csp["style-src"]).toEqual(["'self'", "'unsafe-inline'"]);
    });

    it("returns empty object for empty string", () => {
      expect(parseCsp("")).toEqual({});
    });

    it("returns empty object for null", () => {
      expect(parseCsp(null as unknown as string)).toEqual({});
    });
  });

  describe("auditCsp()", () => {
    it("gives grade A for a fully compliant CSP", () => {
      const csp = parseCsp(
        "default-src 'self'; script-src 'self'; style-src 'self'; " +
          "img-src 'self'; connect-src 'self'; frame-ancestors 'none'",
      );
      const result = auditCsp(csp);
      expect(result.grade).toBe("A");
      expect(result.issues).toHaveLength(0);
      expect(result.missing).toHaveLength(0);
    });

    it("penalizes unsafe-inline in script-src", () => {
      const csp = parseCsp(
        "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self'; " +
          "img-src 'self'; connect-src 'self'; frame-ancestors 'none'",
      );
      const result = auditCsp(csp);
      expect(result.issues).toContainEqual(
        expect.stringContaining("unsafe-inline"),
      );
      expect(result.grade).not.toBe("A");
    });

    it("reports missing directives", () => {
      const csp = parseCsp("default-src 'self'");
      const result = auditCsp(csp);
      expect(result.missing.length).toBeGreaterThan(0);
    });

    it("flags wildcard * as dangerous", () => {
      const csp = parseCsp("default-src *; script-src *");
      const result = auditCsp(csp);
      expect(result.issues.some(i => i.includes("*"))).toBe(true);
      expect(result.grade).not.toBe("A");
    });

    it("flags missing frame-ancestors as clickjacking risk", () => {
      const csp = parseCsp(
        "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self'; connect-src 'self'",
      );
      const result = auditCsp(csp);
      expect(result.issues).toContainEqual(
        expect.stringContaining("clickjacking"),
      );
    });
  });
});
export {};
