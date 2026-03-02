import { rebuildScanResult, scanSensitiveText } from "./masking.engine";

describe("scanSensitiveText", () => {
  it("returns the original text when nothing supported is detected", () => {
    const sourceText = "Summarize this product update for the engineering weekly digest.",
      result = scanSensitiveText(sourceText);

    expect(result.hasMatches).toBe(false);
    expect(result.maskedText).toBe(sourceText);
    expect(result.matches).toHaveLength(0);
  });

  it("masks repeated email values with the same generated token", () => {
    const sourceText = "Email maria@example.com and copy maria@example.com into the CRM.",
      result = scanSensitiveText(sourceText);

    expect(result.matches).toHaveLength(2);
    expect(result.matches[0].ruleId).toBe("email-address");
    expect(result.matches[0].mask).toBe(result.matches[1].mask);
    expect(result.maskedText).not.toContain("maria@example.com");
  });

  it("masks valid credit card numbers and ignores invalid ones", () => {
    const validResult = scanSensitiveText("Charge card 4111 1111 1111 1111 today."),
      invalidResult = scanSensitiveText("Ignore 4111 1111 1111 1112 because it is not valid.");

    expect(validResult.matches.some(match => match.ruleId === "credit-card")).toBe(true);
    expect(validResult.maskedText).not.toContain("4111 1111 1111 1111");
    expect(invalidResult.matches.some(match => match.ruleId === "credit-card")).toBe(false);
  });

    it("masks explicit credential assignments", () => {
      const sourceText =
        "api_key=sk-proj-ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890\nBearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.payload.signature",
      result = scanSensitiveText(sourceText);

      expect(result.matches.map(match => match.ruleId)).toEqual(
        expect.arrayContaining(["openai-style-key", "jwt-token"])
      );
    expect(result.maskedText).not.toContain("sk-proj-ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890");
    expect(result.maskedText).not.toContain("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.payload.signature");
  });

  it("rebuilds the output when one mask is disabled", () => {
    const sourceText =
        "Email: maria@example.com\nToken: sk-proj-ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890",
      scanResult = scanSensitiveText(sourceText),
      matches = scanResult.matches.map(match =>
        match.ruleId === "email-address" ? { ...match, enabled: false } : match
      ),
      rebuilt = rebuildScanResult(scanResult.sourceText, matches, scanResult.scannedAt);

    expect(rebuilt.maskedText).toContain("maria@example.com");
    expect(rebuilt.maskedText).not.toContain("sk-proj-ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890");
    expect(rebuilt.enabledMatches).toBe(1);
  });

  describe("American English coverage", () => {
    it("masks SSNs and US phone numbers", () => {
      const sourceText = "SSN: 123-45-6789\nReach me at (415) 555-2671",
        result = scanSensitiveText(sourceText);

      expect(result.matches.map(match => match.ruleId)).toEqual(
        expect.arrayContaining(["us-phone", "us-ssn"])
      );
      expect(result.maskedText).not.toContain("123-45-6789");
      expect(result.maskedText).not.toContain("(415) 555-2671");
    });

    it("masks structured English labels for names and addresses", () => {
      const sourceText =
          "Full name: Emily Carter\nAddress: 441 Market Street, San Francisco, CA",
        result = scanSensitiveText(sourceText);

      expect(result.matches.map(match => match.ruleId)).toEqual(
        expect.arrayContaining(["labeled-address", "labeled-name"])
      );
      expect(result.maskedText).not.toContain("Emily Carter");
      expect(result.maskedText).not.toContain("441 Market Street, San Francisco, CA");
    });
  });

  describe("Brazilian Portuguese coverage", () => {
    it("masks valid CPF and CNPJ values", () => {
      const sourceText = "CPF: 529.982.247-25\nCNPJ: 04.252.011/0001-10",
        result = scanSensitiveText(sourceText);

      expect(result.matches.map(match => match.ruleId)).toEqual(
        expect.arrayContaining(["cpf", "cnpj"])
      );
      expect(result.maskedText).not.toContain("529.982.247-25");
      expect(result.maskedText).not.toContain("04.252.011/0001-10");
    });

    it("ignores invalid CPF values", () => {
      const result = scanSensitiveText("CPF: 111.111.111-11");

      expect(result.matches.some(match => match.ruleId === "cpf")).toBe(false);
    });

    it("masks Brazilian phone numbers and labeled CNH data", () => {
      const sourceText = "+55 (11) 99876-5432\nCNH: 12345678901",
        result = scanSensitiveText(sourceText);

      expect(result.matches.map(match => match.ruleId)).toEqual(
        expect.arrayContaining(["br-phone", "cnh-labeled"])
      );
      expect(result.maskedText).not.toContain("+55 (11) 99876-5432");
      expect(result.maskedText).not.toContain("12345678901");
    });
  });

  describe("LatAm Spanish coverage", () => {
    it("masks CURP, RFC, CUIT, and NIT patterns", () => {
      const sourceText = [
        "CURP: GODE561231HDFRRN09",
        "RFC: XAXX010101000",
        "CUIT: 20-12345678-3",
        "NIT: 900.373.076-1",
      ].join("\n");
      const result = scanSensitiveText(sourceText);

      expect(result.matches.map(match => match.ruleId)).toEqual(
        expect.arrayContaining(["cuit", "curp", "nit", "rfc"])
      );
      expect(result.maskedText).not.toContain("GODE561231HDFRRN09");
      expect(result.maskedText).not.toContain("XAXX010101000");
      expect(result.maskedText).not.toContain("20-12345678-3");
      expect(result.maskedText).not.toContain("900.373.076-1");
    });

    it("masks structured Spanish labels for names, addresses, and phone numbers", () => {
      const sourceText =
          "Nombre completo: Camila Torres Rivera\nDirección: Calle 85 # 12-34, Bogotá\nTeléfono: +57 301 222 3344",
        result = scanSensitiveText(sourceText);

      expect(result.matches.map(match => match.ruleId)).toEqual(
        expect.arrayContaining(["labeled-address", "labeled-name", "labeled-phone"])
      );
      expect(result.maskedText).not.toContain("Camila Torres Rivera");
      expect(result.maskedText).not.toContain("Calle 85 # 12-34, Bogotá");
      expect(result.maskedText).not.toContain("+57 301 222 3344");
    });
  });
});
