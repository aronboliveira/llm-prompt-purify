import { describe, it, expect } from "vitest";
import { detectSensitiveData, generateMasks } from "./detection";

describe("detectSensitiveData", () => {
  describe("Email Detection", () => {
    it("detects simple email addresses", () => {
      const result = detectSensitiveData("Contact: test@example.com");
      expect(result).toHaveLength(1);
      expect(result[0].type).toBe("EMAIL");
      expect(result[0].value).toBe("test@example.com");
    });

    it("detects multiple emails", () => {
      const result = detectSensitiveData("Send to a@b.com and c@d.org");
      expect(result.length).toBeGreaterThanOrEqual(2);
    });

    it("detects emails with subdomains", () => {
      const result = detectSensitiveData("Email: user@mail.company.co.uk");
      expect(result.some(d => d.type === "EMAIL")).toBe(true);
    });
  });

  describe("Phone Detection", () => {
    it("detects US phone formats", () => {
      const formats = [
        "555-123-4567",
        "(555) 123-4567",
        "555.123.4567",
        "+1 555 123 4567",
      ];

      formats.forEach(phone => {
        const result = detectSensitiveData(`Call: ${phone}`);
        expect(
          result.some(d => d.type === "PHONE"),
          `Should detect: ${phone}`,
        ).toBe(true);
      });
    });
  });

  describe("SSN Detection", () => {
    it("detects SSN pattern", () => {
      const result = detectSensitiveData("SSN: 123-45-6789");
      expect(result.some(d => d.type === "SSN")).toBe(true);
    });

    it("does not false positive on similar patterns", () => {
      const result = detectSensitiveData("Code: 12-345-6789");
      expect(result.some(d => d.type === "SSN")).toBe(false);
    });
  });

  describe("Credit Card Detection", () => {
    it("detects credit card patterns", () => {
      const cards = [
        "4111111111111111", // Visa (no dashes - current regex)
        "5500000000000004", // Mastercard
      ];

      cards.forEach(card => {
        const result = detectSensitiveData(`Card: ${card}`);
        expect(
          result.some(d => d.type === "CREDIT_CARD"),
          `Should detect: ${card}`,
        ).toBe(true);
      });
    });
  });

  describe("API Key Detection", () => {
    it("detects OpenAI API keys", () => {
      // OpenAI key format: sk- followed by exactly 48 alphanumeric chars
      const result = detectSensitiveData(
        "Key: sk-abcdefghijklmnopqrstuvwxyz0123456789ABCDEFGHIJKL",
      );
      expect(result.some(d => d.type === "OPENAI_KEY")).toBe(true);
    });

    it("detects AWS access keys", () => {
      const result = detectSensitiveData("AWS: AKIAIOSFODNN7EXAMPLE");
      expect(result.some(d => d.type === "AWS_KEY")).toBe(true);
    });

    it("detects JWT tokens", () => {
      const result = detectSensitiveData(
        "Token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U",
      );
      expect(result.some(d => d.type === "JWT")).toBe(true);
    });
  });

  describe("IP Address Detection", () => {
    it("detects IPv4 addresses", () => {
      const result = detectSensitiveData("Server: 192.168.1.100");
      expect(result.some(d => d.type === "IPV4")).toBe(true);
    });

    it("detects valid IP ranges", () => {
      const ips = ["10.0.0.1", "172.16.0.1", "255.255.255.0"];
      ips.forEach(ip => {
        const result = detectSensitiveData(`IP: ${ip}`);
        expect(
          result.some(d => d.type === "IPV4"),
          `Should detect: ${ip}`,
        ).toBe(true);
      });
    });
  });

  describe("Edge Cases", () => {
    it("returns empty array for text without sensitive data", () => {
      const result = detectSensitiveData("Hello, how are you today?");
      expect(result).toHaveLength(0);
    });

    it("handles empty string", () => {
      const result = detectSensitiveData("");
      expect(result).toHaveLength(0);
    });

    it("detects multiple types in one text", () => {
      const text = "Email: a@b.com, Phone: 555-123-4567, SSN: 123-45-6789";
      const result = detectSensitiveData(text);
      const types = new Set(result.map(d => d.type));
      expect(types.size).toBeGreaterThanOrEqual(2);
    });
  });
});

describe("generateMasks", () => {
  it("generates multiple mask options for email", () => {
    const detection = {
      type: "EMAIL",
      label: "Email",
      mask: "[EMAIL]",
      value: "test@example.com",
      start: 0,
      end: 16,
    };

    const masks = generateMasks(detection);
    expect(masks.length).toBeGreaterThan(0);
    expect(masks.every(m => typeof m === "string")).toBe(true);
  });

  it("masks include type identifier", () => {
    const detection = {
      type: "PHONE",
      label: "Phone",
      mask: "[PHONE]",
      value: "555-123-4567",
      start: 0,
      end: 12,
    };

    const masks = generateMasks(detection);
    expect(masks.some(m => m.toUpperCase().includes("PHONE"))).toBe(true);
  });

  it("provides partial masking option for credit card", () => {
    const detection = {
      type: "CREDIT_CARD",
      label: "Credit Card",
      mask: "[CARD-XXXX]",
      value: "4111111111111111",
      start: 0,
      end: 16,
    };

    const masks = generateMasks(detection);
    expect(masks.some(m => m.includes("****") || m.includes("1111"))).toBe(
      true,
    );
  });
});
