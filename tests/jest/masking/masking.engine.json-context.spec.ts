/**
 * Tests for JSON/YAML/TOML context-aware masking rules.
 *
 * These tests verify that sensitive data is detected and masked
 * even in structured data formats where word boundaries (\b) fail.
 */

import { DEFAULT_GROUP_PREFERENCES } from "@core/masking/constants/masking.constants";
import { MaskingEngine } from "@core/masking/masking.engine";
import { buildScanScopeSelection } from "@core/masking/utils/country-scope.utils";

describe("MaskingEngine JSON Context Detection", () => {
  const engine = new MaskingEngine();
  const usScope = buildScanScopeSelection(["us"], "selected-plus-global");
  const brScope = buildScanScopeSelection(["br"], "selected-plus-global");
  const cnScope = buildScanScopeSelection(["cn"], "selected-plus-global");
  const globalScope = buildScanScopeSelection([], "global-only");

  describe("Credit cards in JSON", () => {
    it("detects quoted credit card numbers", () => {
      // Using valid test card number that passes Luhn
      const json = `{"credit_card": "4532015112830366", "amount": 100}`;
      const result = engine.scan(json, DEFAULT_GROUP_PREFERENCES, globalScope);

      expect(result.hasMatches).toBe(true);
      const match = result.matches.find(
        m => m.value === "4532015112830366" || m.ruleId.includes("credit-card"),
      );
      expect(match).toBeDefined();
    });

    it("detects credit card with label key", () => {
      const json = `{"card_number": "4111111111111111"}`;
      const result = engine.scan(json, DEFAULT_GROUP_PREFERENCES, globalScope);

      expect(result.hasMatches).toBe(true);
      const match = result.matches.find(m => m.ruleId.includes("credit-card"));
      expect(match).toBeDefined();
    });

    it("masks credit card in nested JSON", () => {
      const json = `{
        "user": {
          "payment": {
            "cc": "378282246310005"
          }
        }
      }`;
      const result = engine.scan(json, DEFAULT_GROUP_PREFERENCES, globalScope);

      expect(result.hasMatches).toBe(true);
    });
  });

  describe("SSN in JSON", () => {
    it("detects quoted SSN with standard format", () => {
      const json = `{"ssn": "123-45-6789"}`;
      const result = engine.scan(json, DEFAULT_GROUP_PREFERENCES, usScope);

      expect(result.hasMatches).toBe(true);
      const match = result.matches.find(
        m => m.value === "123-45-6789" || m.ruleId.includes("ssn"),
      );
      expect(match).toBeDefined();
    });

    it("detects SSN with social_security key", () => {
      const json = `{"social_security": "111-22-3333"}`;
      const result = engine.scan(json, DEFAULT_GROUP_PREFERENCES, usScope);

      expect(result.hasMatches).toBe(true);
    });
  });

  describe("Brazilian IDs in JSON", () => {
    it("detects quoted CPF", () => {
      const json = `{"cpf": "123.456.789-09"}`;
      const result = engine.scan(json, DEFAULT_GROUP_PREFERENCES, brScope);

      expect(result.hasMatches).toBe(true);
    });

    it("detects CNPJ in JSON", () => {
      const json = `{"cnpj": "11.444.777/0001-61"}`;
      const result = engine.scan(json, DEFAULT_GROUP_PREFERENCES, brScope);

      expect(result.hasMatches).toBe(true);
    });
  });

  describe("Chinese Resident ID in JSON", () => {
    it("detects quoted Chinese ID", () => {
      // Valid checksum ID
      const json = `{"身份证号": "11010519491231002X"}`;
      const result = engine.scan(json, DEFAULT_GROUP_PREFERENCES, cnScope);

      expect(result.hasMatches).toBe(true);
    });

    it("detects ID with English key", () => {
      const json = `{"id_card": "11010519491231002X"}`;
      const result = engine.scan(json, DEFAULT_GROUP_PREFERENCES, cnScope);

      expect(result.hasMatches).toBe(true);
    });
  });

  describe("IPv4 addresses", () => {
    it("detects IPv4 in plain text", () => {
      const text = "Server IP: 192.168.1.1";
      const result = engine.scan(text, DEFAULT_GROUP_PREFERENCES, globalScope);

      expect(result.hasMatches).toBe(true);
      const match = result.matches.find(
        m => m.value === "192.168.1.1" || m.ruleId.includes("ipv4"),
      );
      expect(match).toBeDefined();
    });

    it("detects quoted IPv4", () => {
      const json = `{"host": "10.0.0.1"}`;
      const result = engine.scan(json, DEFAULT_GROUP_PREFERENCES, globalScope);

      expect(result.hasMatches).toBe(true);
    });

    it("ignores invalid IP octets", () => {
      const text = "Not an IP: 999.999.999.999";
      const result = engine.scan(text, DEFAULT_GROUP_PREFERENCES, globalScope);

      const ipMatch = result.matches.find(m => m.ruleId.includes("ipv4"));
      expect(ipMatch).toBeUndefined();
    });
  });

  describe("Date formats", () => {
    it("detects ISO date format", () => {
      const text = "Created: 2024-01-15";
      const result = engine.scan(text, DEFAULT_GROUP_PREFERENCES, globalScope);

      const dateMatch = result.matches.find(m => m.ruleId.includes("date"));
      expect(dateMatch).toBeDefined();
    });

    it("detects DD/MM/YYYY format", () => {
      const text = "Date of birth: 15/01/1990";
      const result = engine.scan(text, DEFAULT_GROUP_PREFERENCES, globalScope);

      const dateMatch = result.matches.find(m => m.ruleId.includes("date"));
      expect(dateMatch).toBeDefined();
    });
  });

  describe("YAML context", () => {
    it("detects credit card in YAML", () => {
      const yaml = `
user:
  name: John Doe
  payment:
    card: "4111111111111111"
`;
      const result = engine.scan(yaml, DEFAULT_GROUP_PREFERENCES, globalScope);

      expect(result.hasMatches).toBe(true);
    });

    it("detects SSN in YAML", () => {
      const yaml = `
employee:
  ssn: "123-45-6789"
`;
      const result = engine.scan(yaml, DEFAULT_GROUP_PREFERENCES, usScope);

      expect(result.hasMatches).toBe(true);
    });
  });

  describe("Mixed format detection", () => {
    it("detects multiple sensitive values in complex JSON", () => {
      const json = `{
        "user": {
          "email": "john.doe@example.com",
          "ssn": "123-45-6789",
          "payment": {
            "credit_card": "4111111111111111",
            "billing_ip": "192.168.1.100"
          }
        }
      }`;

      const result = engine.scan(json, DEFAULT_GROUP_PREFERENCES, usScope);

      // Should detect email, SSN, credit card, and IP
      expect(result.matches.length).toBeGreaterThanOrEqual(3);
    });
  });
});
