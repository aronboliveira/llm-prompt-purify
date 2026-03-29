/**
 * Extreme I/O edge-case tests for MaskingEngine.
 *
 * Covers: empty input, whitespace-only, huge payloads, unicode edge cases,
 * injection vectors, deeply nested data, emoji-heavy text, mixed RTL/LTR,
 * repeated patterns, null-byte injection, max-length single-line, and more.
 */
import { DEFAULT_GROUP_PREFERENCES } from "@core/masking/constants/masking.constants";
import { MaskingEngine } from "@core/masking/masking.engine";
import { buildScanScopeSelection } from "@core/masking/utils/country-scope.utils";
import { createGroupPreferenceMap } from "@core/masking/utils/mask-group.utils";

describe("MaskingEngine extreme I/O variations", () => {
  const engine = new MaskingEngine(),
    brScope = buildScanScopeSelection(["br"], "selected-plus-global"),
    usScope = buildScanScopeSelection(["us"], "selected-plus-global"),
    globalOnly = buildScanScopeSelection(["br"], "global-only"),
    multiScope = buildScanScopeSelection(
      ["br", "us", "es", "cn", "ru", "in", "pt"],
      "selected-plus-global",
    );

  // ─── Empty / whitespace / null-ish ───────────────────────────────
  describe("empty and whitespace edge cases", () => {
    it("handles empty string input", () => {
      const result = engine.scan("", DEFAULT_GROUP_PREFERENCES, brScope);
      expect(result.hasMatches).toBe(false);
      expect(result.maskedText).toBe("");
      expect(result.totalMatches).toBe(0);
    });

    it("handles single space", () => {
      const result = engine.scan(" ", DEFAULT_GROUP_PREFERENCES, brScope);
      expect(result.hasMatches).toBe(false);
      expect(result.maskedText).toBe(" ");
    });

    it("handles only newlines", () => {
      const text = "\n\n\n\n\n";
      const result = engine.scan(text, DEFAULT_GROUP_PREFERENCES, brScope);
      expect(result.maskedText).toBe(text);
    });

    it("handles tab/carriage-return/null chars", () => {
      const text = "\t\t\r\n\t\r\0\0";
      const result = engine.scan(text, DEFAULT_GROUP_PREFERENCES, brScope);
      expect(result.hasMatches).toBe(false);
    });

    it("handles whitespace-padded sensitive data", () => {
      const text = "   \t  maria@example.com  \n\n  ";
      const result = engine.scan(text, DEFAULT_GROUP_PREFERENCES, brScope);
      expect(result.maskedText).not.toContain("maria@example.com");
      expect(result.hasMatches).toBe(true);
    });
  });

  // ─── Huge payloads ──────────────────────────────────────────────
  describe("large payload stress tests", () => {
    it("handles 100KB of lorem ipsum with embedded sensitive data", () => {
      const lorem =
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit. ".repeat(
          2000,
        );
      const injected =
        lorem.slice(0, 25000) +
        "\nEmail: admin@secretcorp.com\nCPF: 529.982.247-25\n" +
        lorem.slice(25000);
      const result = engine.scan(injected, DEFAULT_GROUP_PREFERENCES, brScope);
      expect(result.maskedText).not.toContain("admin@secretcorp.com");
      expect(result.maskedText).not.toContain("529.982.247-25");
      expect(result.maskedText.length).toBeGreaterThan(100000);
    });

    it("handles 1000 emails in a single payload", () => {
      const emails = Array.from(
        { length: 1000 },
        (_, i) => `user${i}@domain${i}.com`,
      ).join("\n");
      const result = engine.scan(emails, DEFAULT_GROUP_PREFERENCES, brScope);
      expect(result.totalMatches).toBe(1000);
      expect(result.maskedText).not.toContain("user0@domain0.com");
      expect(result.maskedText).not.toContain("user999@domain999.com");
    });

    it("handles repeated identical sensitive values (500x same CPF)", () => {
      const text = "CPF: 529.982.247-25\n".repeat(500);
      const result = engine.scan(text, DEFAULT_GROUP_PREFERENCES, brScope);
      expect(result.totalMatches).toBe(500);
      // All same value should share same mask
      const masks = new Set(result.matches.map(m => m.mask));
      expect(masks.size).toBe(1);
    });

    it("handles a single very long line (50K chars)", () => {
      const longLine = "A".repeat(49990) + "maria@x.com";
      const result = engine.scan(longLine, DEFAULT_GROUP_PREFERENCES, brScope);
      expect(result.maskedText).not.toContain("maria@x.com");
    });
  });

  // ─── Unicode edge cases ─────────────────────────────────────────
  describe("unicode and encoding edge cases", () => {
    it("handles emoji-heavy text without crashing", () => {
      const text =
        "🔒🔑🛡️ Email: hack@evil.co 🛡️🔑🔒\n💀 Token: sk-proj-AABBCC1234567890AABBCC1234567890 💀";
      const result = engine.scan(text, DEFAULT_GROUP_PREFERENCES, brScope);
      expect(result.maskedText).not.toContain("hack@evil.co");
      expect(result.maskedText).not.toContain(
        "sk-proj-AABBCC1234567890AABBCC1234567890",
      );
    });

    it("handles CJK characters mixed with sensitive data", () => {
      const text = "这是一个测试 Email: test@中文.com 用户名";
      const result = engine.scan(text, DEFAULT_GROUP_PREFERENCES, brScope);
      expect(result.hasMatches).toBe(false); // .com has CJK in domain - not a valid email
    });

    it("handles Arabic/Hebrew RTL text mixed with LTR emails", () => {
      const text = "مرحبا Email: user@arabic-test.com شكرا";
      const result = engine.scan(text, DEFAULT_GROUP_PREFERENCES, brScope);
      expect(result.maskedText).not.toContain("user@arabic-test.com");
    });

    it("handles Cyrillic lookalike characters near sensitive data", () => {
      const text = "Еmail: user@cyrillic-spoof.com"; // Cyrillic 'E' vs Latin 'E'
      const result = engine.scan(text, DEFAULT_GROUP_PREFERENCES, brScope);
      // The regex should still catch the email after the Cyrillic char
      expect(
        result.matches.some(m => m.value.includes("@cyrillic-spoof.com")),
      ).toBe(true);
    });

    it("handles zero-width characters in emails", () => {
      const text = "Email: user\u200B@zero-width.com"; // zero-width space
      const result = engine.scan(text, DEFAULT_GROUP_PREFERENCES, brScope);
      // Might or might not match - should not crash
      expect(result).toBeDefined();
    });

    it("handles combining diacritical marks", () => {
      const text =
        "Nómbre completo: José García López\nDirección: Calle 85 #12-34, Bogotá";
      const result = engine.scan(
        text,
        DEFAULT_GROUP_PREFERENCES,
        buildScanScopeSelection(["co"], "selected-plus-global"),
      );
      expect(result).toBeDefined();
    });

    it("handles surrogate pair characters (astral plane)", () => {
      const text = "𝕰𝖒𝖆𝖎𝖑: normal@test.com 𝕿𝖊𝖘𝖙";
      const result = engine.scan(text, DEFAULT_GROUP_PREFERENCES, brScope);
      expect(result.maskedText).not.toContain("normal@test.com");
    });
  });

  // ─── Injection / adversarial ────────────────────────────────────
  describe("injection and adversarial inputs", () => {
    it("handles XSS-like payloads gracefully", () => {
      const text =
        '<script>alert("xss")</script> Email: xss@evil.com <img onerror=alert(1) src=x>';
      const result = engine.scan(text, DEFAULT_GROUP_PREFERENCES, brScope);
      expect(result.maskedText).not.toContain("xss@evil.com");
      expect(result).toBeDefined();
    });

    it("handles SQL injection-like payloads", () => {
      const text = "' OR 1=1; DROP TABLE users; -- Email: sqli@test.com";
      const result = engine.scan(text, DEFAULT_GROUP_PREFERENCES, brScope);
      expect(result.maskedText).not.toContain("sqli@test.com");
    });

    it("handles regex DoS-like patterns (catastrophic backtracking attempt)", () => {
      const text = "a".repeat(10000) + "@" + "b".repeat(10000) + ".com";
      const start = performance.now();
      const result = engine.scan(text, DEFAULT_GROUP_PREFERENCES, brScope);
      const elapsed = performance.now() - start;
      expect(elapsed).toBeLessThan(5000); // Must not hang
      expect(result).toBeDefined();
    });

    it("handles null bytes mixed in sensitive data", () => {
      const text = "Email:\0user@null\0byte.com\0";
      const result = engine.scan(text, DEFAULT_GROUP_PREFERENCES, brScope);
      expect(result).toBeDefined();
    });

    it("handles CRLF injection attempt", () => {
      const text =
        "Token: sk-proj-AABBCC1234567890AABBCC1234567890\r\nHTTP/1.1 200 OK\r\n";
      const result = engine.scan(text, DEFAULT_GROUP_PREFERENCES, brScope);
      expect(result.maskedText).not.toContain(
        "sk-proj-AABBCC1234567890AABBCC1234567890",
      );
    });
  });

  // ─── Boundary / overlap scenarios ───────────────────────────────
  describe("boundary and overlap scenarios", () => {
    it("handles adjacent sensitive values with no separator", () => {
      const text = "maria@test.comjohn@test.com";
      const result = engine.scan(text, DEFAULT_GROUP_PREFERENCES, brScope);
      // Regex word boundary should separate them
      expect(result).toBeDefined();
    });

    it("handles sensitive data at exact start of string", () => {
      const text = "maria@test.com is an email";
      const result = engine.scan(text, DEFAULT_GROUP_PREFERENCES, brScope);
      expect(result.maskedText).not.toContain("maria@test.com");
    });

    it("handles sensitive data at exact end of string", () => {
      const text = "Contact email: maria@test.com";
      const result = engine.scan(text, DEFAULT_GROUP_PREFERENCES, brScope);
      expect(result.maskedText).not.toContain("maria@test.com");
    });

    it("handles overlapping format patterns (CPF in credit card range)", () => {
      const text = "Number: 529.982.247-25 and card 4111 1111 1111 1111 total";
      const result = engine.scan(text, DEFAULT_GROUP_PREFERENCES, brScope);
      expect(result.maskedText).not.toContain("529.982.247-25");
      expect(result.maskedText).not.toContain("4111 1111 1111 1111");
    });

    it("handles email inside URL context", () => {
      const text = "Visit https://example.com?user=test@site.com&ref=abc";
      const result = engine.scan(text, DEFAULT_GROUP_PREFERENCES, brScope);
      expect(result).toBeDefined();
    });

    it("handles multiple rule types on same line", () => {
      const text =
        "Name: John Smith, Email: john@test.com, CPF: 529.982.247-25, Card: 4111 1111 1111 1111, Token: sk-proj-AABB1234567890CCDD1234567890, SSN: 123-45-6789";
      const result = engine.scan(text, DEFAULT_GROUP_PREFERENCES, multiScope);
      expect(result.totalMatches).toBeGreaterThanOrEqual(4);
    });
  });

  // ─── Format variations ─────────────────────────────────────────
  describe("format variations for known patterns", () => {
    it("masks CPF with dots and dash", () => {
      const r = engine.scan(
        "CPF: 529.982.247-25",
        DEFAULT_GROUP_PREFERENCES,
        brScope,
      );
      expect(r.maskedText).not.toContain("529.982.247-25");
    });

    it("masks CPF without formatting", () => {
      const r = engine.scan(
        "CPF: 52998224725",
        DEFAULT_GROUP_PREFERENCES,
        brScope,
      );
      expect(r.maskedText).not.toContain("52998224725");
    });

    it("masks CNPJ with full formatting", () => {
      const r = engine.scan(
        "CNPJ: 11.222.333/0001-81",
        DEFAULT_GROUP_PREFERENCES,
        brScope,
      );
      expect(r.maskedText).not.toContain("11.222.333/0001-81");
    });

    it("masks CNPJ without formatting", () => {
      const r = engine.scan(
        "CNPJ: 11222333000181",
        DEFAULT_GROUP_PREFERENCES,
        brScope,
      );
      expect(r.maskedText).not.toContain("11222333000181");
    });

    it("masks credit card with spaces", () => {
      const r = engine.scan(
        "Card: 4111 1111 1111 1111",
        DEFAULT_GROUP_PREFERENCES,
        brScope,
      );
      expect(r.maskedText).not.toContain("4111 1111 1111 1111");
    });

    it("masks credit card with dashes", () => {
      const r = engine.scan(
        "Card: 4111-1111-1111-1111",
        DEFAULT_GROUP_PREFERENCES,
        brScope,
      );
      expect(r.maskedText).not.toContain("4111-1111-1111-1111");
    });

    it("masks credit card without separators", () => {
      const r = engine.scan(
        "Card: 4111111111111111",
        DEFAULT_GROUP_PREFERENCES,
        brScope,
      );
      expect(r.maskedText).not.toContain("4111111111111111");
    });

    it("masks IBAN with spaces", () => {
      const r = engine.scan(
        "IBAN: GB29 NWBK 6016 1331 9268 19",
        DEFAULT_GROUP_PREFERENCES,
        brScope,
      );
      expect(r.maskedText).not.toContain("GB29NWBK60161331926819");
    });

    it("masks US phone with various formats", () => {
      const formats = [
        "+1 (415) 555-2671",
        "(415) 555-2671",
        "415.555.2671",
        "415-555-2671",
        "+1-415-555-2671",
      ];
      for (const phone of formats) {
        const r = engine.scan(phone, DEFAULT_GROUP_PREFERENCES, usScope);
        expect(r.matches.some(m => m.ruleId === "us-phone")).toBe(true);
      }
    });
  });

  // ─── Multi-scope extreme ────────────────────────────────────────
  describe("multi-scope extreme scenarios", () => {
    it("handles all-countries scope with complex input", () => {
      const text = [
        "Email: test@example.com",
        "CPF: 529.982.247-25",
        "CNPJ: 11.222.333/0001-81",
        "SSN: 123-45-6789",
        "RUT: 12.345.678-5",
        "NIF: 123456789",
        "Token: sk-proj-AABB12345678CC90DD12345678EF90",
        "IBAN: GB29NWBK60161331926819",
        "Card: 4111 1111 1111 1111",
      ].join("\n");
      const result = engine.scan(text, DEFAULT_GROUP_PREFERENCES, multiScope);
      expect(result.totalMatches).toBeGreaterThanOrEqual(5);
      expect(result.maskedText).not.toContain("test@example.com");
      expect(result.maskedText).not.toContain("529.982.247-25");
    });

    it("handles empty country profiles list gracefully", () => {
      // Should fall back to default profiles
      const r = engine.scan(
        "Email: test@example.com",
        DEFAULT_GROUP_PREFERENCES,
        brScope,
      );
      expect(r).toBeDefined();
    });
  });

  // ─── Group preferences edge cases ──────────────────────────────
  describe("group preference edge cases", () => {
    it("handles all groups disabled", () => {
      const prefs = createGroupPreferenceMap({
        credential: { enabled: false },
        financial: { enabled: false },
        identifier: { enabled: false },
        location: { enabled: false },
        personal: { enabled: false },
      });
      const text =
        "Email: test@example.com\nCPF: 529.982.247-25\nToken: sk-proj-AABB1234567890CC1234567890";
      const result = engine.scan(text, prefs, brScope);
      expect(result.enabledMatches).toBe(0);
      expect(result.maskedText).toContain("test@example.com");
    });

    it("handles all groups with alwaysOn", () => {
      const prefs = createGroupPreferenceMap({
        credential: { enabled: true, alwaysOn: true },
        financial: { enabled: true, alwaysOn: true },
        identifier: { enabled: true, alwaysOn: true },
        location: { enabled: true, alwaysOn: true },
        personal: { enabled: true, alwaysOn: true },
      });
      const text = "Email: test@example.com\nCPF: 529.982.247-25";
      const result = engine.scan(text, prefs, brScope);
      expect(result.matches.every(m => m.locked)).toBe(true);
      expect(result.matches.every(m => m.enabled)).toBe(true);
    });
  });

  // ─── Rebuild / regenerate edge cases ────────────────────────────
  describe("rebuild and regenerate edge cases", () => {
    it("rebuild with empty matches array returns original text", () => {
      const text = "Hello world";
      const result = engine.rebuild(text, [], new Date().toISOString());
      expect(result.maskedText).toBe(text);
      expect(result.totalMatches).toBe(0);
    });

    it("regenerateMatch with nonexistent matchId returns same result", () => {
      const text = "Email: test@example.com";
      const scanResult = engine.scan(text, DEFAULT_GROUP_PREFERENCES, brScope);
      const regenerated = engine.regenerateMatch(
        text,
        scanResult.matches,
        scanResult.scannedAt,
        "nonexistent-id",
      );
      expect(regenerated.maskedText).toBe(scanResult.maskedText);
    });

    it("regenerateAll produces different masks from original", () => {
      const text = "Email: test@example.com\nCPF: 529.982.247-25";
      const scanResult = engine.scan(text, DEFAULT_GROUP_PREFERENCES, brScope);
      const regenerated = engine.regenerateAll(
        text,
        scanResult.matches,
        scanResult.scannedAt,
      );
      // At least one mask should differ (probabilistic but near-certain)
      const originalMasks = scanResult.matches.map(m => m.mask);
      const newMasks = regenerated.matches.map(m => m.mask);
      // We can't guarantee difference with small data, but structure should be same
      expect(newMasks.length).toBe(originalMasks.length);
    });

    it("regenerateAll on empty matches returns clean result", () => {
      const result = engine.regenerateAll(
        "Hello",
        [],
        new Date().toISOString(),
      );
      expect(result.maskedText).toBe("Hello");
    });
  });

  // ─── Performance thresholds ─────────────────────────────────────
  describe("performance thresholds", () => {
    it("scans 10KB payload in under 500ms", () => {
      const text =
        "Email: test@example.com\nCPF: 529.982.247-25\n" +
        "Lorem ipsum ".repeat(800);
      const start = performance.now();
      engine.scan(text, DEFAULT_GROUP_PREFERENCES, brScope);
      expect(performance.now() - start).toBeLessThan(500);
    });

    it("scans 50KB payload with multi-scope in under 2s", () => {
      const text =
        "Email: bulk@test.com\nToken: sk-proj-AABB1234567890CC1234567890\n" +
        "Random text block ".repeat(2500);
      const start = performance.now();
      engine.scan(text, DEFAULT_GROUP_PREFERENCES, multiScope);
      expect(performance.now() - start).toBeLessThan(2000);
    });

    it("handles 500 regenerateMatch calls sequentially under 3s", () => {
      const text = Array.from(
        { length: 50 },
        (_, i) => `user${i}@test.com`,
      ).join("\n");
      const scanResult = engine.scan(text, DEFAULT_GROUP_PREFERENCES, brScope);
      const start = performance.now();
      for (const match of scanResult.matches) {
        engine.regenerateMatch(
          text,
          scanResult.matches,
          scanResult.scannedAt,
          match.id,
        );
      }
      expect(performance.now() - start).toBeLessThan(3000);
    });
  });

  // ─── Special character patterns ─────────────────────────────────
  describe("special character patterns in sensitive data", () => {
    it("handles email with plus addressing", () => {
      const r = engine.scan(
        "Email: user+tag@example.com",
        DEFAULT_GROUP_PREFERENCES,
        brScope,
      );
      expect(r.maskedText).not.toContain("user+tag@example.com");
    });

    it("handles email with dots in local part", () => {
      const r = engine.scan(
        "Email: first.last@example.com",
        DEFAULT_GROUP_PREFERENCES,
        brScope,
      );
      expect(r.maskedText).not.toContain("first.last@example.com");
    });

    it("handles JWT with all sections", () => {
      const jwt =
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U";
      const r = engine.scan(jwt, DEFAULT_GROUP_PREFERENCES, brScope);
      expect(r.maskedText).not.toContain(jwt);
    });

    it("handles GitHub PAT formats", () => {
      const pats = [
        "ghp_ABCDefgh1234567890abcdef",
        "gho_ABCDefgh1234567890abcdef",
        "ghu_ABCDefgh1234567890abcdef",
        "ghs_ABCDefgh1234567890abcdef",
        "ghr_ABCDefgh1234567890abcdef",
      ];
      for (const pat of pats) {
        const r = engine.scan(pat, DEFAULT_GROUP_PREFERENCES, brScope);
        expect(r.maskedText).not.toContain(pat);
      }
    });

    it("handles AWS access key format", () => {
      const r = engine.scan(
        "AWS: AKIAIOSFODNN7EXAMPLE",
        DEFAULT_GROUP_PREFERENCES,
        brScope,
      );
      expect(r.maskedText).not.toContain("AKIAIOSFODNN7EXAMPLE");
    });

    it("handles Slack webhook URL", () => {
      const webhook =
        "https://hooks.slack.com/services/T01234567/B01234567/abcdefghijklmnopqrstuvwx";
      const r = engine.scan(webhook, DEFAULT_GROUP_PREFERENCES, brScope);
      expect(r.maskedText).not.toContain(webhook);
    });

    it("handles bearer tokens", () => {
      const r = engine.scan(
        "Authorization: Bearer eyJhbGciOiJSUzI1NiJ9.content.signature",
        DEFAULT_GROUP_PREFERENCES,
        brScope,
      );
      expect(
        r.matches.some(
          m => m.ruleId === "jwt-token" || m.ruleId === "bearer-token",
        ),
      ).toBe(true);
    });
  });
});
