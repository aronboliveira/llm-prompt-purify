/**
 * Roleplay Security Tests — Green Hat (Beginner)
 *
 * Validates that basic attacks (cookie theft, session exposure)
 * are mitigated by the application's security controls.
 */
const { parseCookies, checkExposedCookies } =
  require("../../../docs/roleplay/green-hat/scripts/js/cookie_stealer") as {
    parseCookies: (
      header: string | string[] | null,
    ) => { name: string; value: string; httpOnly: boolean; secure: boolean }[];
    checkExposedCookies: (cookies: { name: string; httpOnly: boolean }[]) => {
      exposed: boolean;
      exposedNames: string[];
    };
  };

describe("Green Hat — Cookie Stealer", () => {
  describe("parseCookies()", () => {
    it("parses a Set-Cookie header with HttpOnly and Secure flags", () => {
      const cookies = parseCookies(
        "session=abc123; Path=/; HttpOnly; Secure; SameSite=Strict",
      );
      expect(cookies).toHaveLength(1);
      expect(cookies[0].name).toBe("session");
      expect(cookies[0].httpOnly).toBe(true);
      expect(cookies[0].secure).toBe(true);
    });

    it("parses a cookie without HttpOnly", () => {
      const cookies = parseCookies("trackingId=xyz; Path=/; Secure");
      expect(cookies).toHaveLength(1);
      expect(cookies[0].httpOnly).toBe(false);
      expect(cookies[0].secure).toBe(true);
    });

    it("returns empty array for null input", () => {
      expect(parseCookies(null)).toEqual([]);
    });

    it("handles multiple Set-Cookie headers", () => {
      const cookies = parseCookies([
        "session=abc; HttpOnly; Secure",
        "prefs=dark; Path=/",
      ]);
      expect(cookies).toHaveLength(2);
      expect(cookies[0].httpOnly).toBe(true);
      expect(cookies[1].httpOnly).toBe(false);
    });
  });

  describe("checkExposedCookies()", () => {
    it("reports cookies missing HttpOnly as exposed", () => {
      const cookies = [
        { name: "session", value: "abc", httpOnly: true, secure: true },
        { name: "tracking", value: "xyz", httpOnly: false, secure: true },
      ];
      const result = checkExposedCookies(cookies);
      expect(result.exposed).toBe(true);
      expect(result.exposedNames).toEqual(["tracking"]);
    });

    it("reports no exposure when all cookies have HttpOnly", () => {
      const cookies = [
        { name: "session", value: "abc", httpOnly: true, secure: true },
      ];
      const result = checkExposedCookies(cookies);
      expect(result.exposed).toBe(false);
      expect(result.exposedNames).toEqual([]);
    });

    it("reports no exposure for empty cookie list", () => {
      const result = checkExposedCookies([]);
      expect(result.exposed).toBe(false);
    });
  });
});
export {};
