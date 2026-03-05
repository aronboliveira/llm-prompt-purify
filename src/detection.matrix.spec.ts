/**
 * Country-scope pattern detection matrix tests.
 * Exhaustive positive/negative coverage for every pattern added from the
 * Angular masking-engine matrix work, adapted for the flat-regex extension.
 */
import { describe, it, expect } from "vitest";
import { detectSensitiveData, generateMasks } from "./detection";

// ─── Helper ─────────────────────────────────────────────────────────────────
const has = (text: string, type: string): boolean =>
  detectSensitiveData(text).some(d => d.type === type);

const val = (text: string, type: string): string | undefined =>
  detectSensitiveData(text).find(d => d.type === type)?.value;

// ═══════════════════════════════════════════════════════════════════════════
//  BRAZIL
// ═══════════════════════════════════════════════════════════════════════════

describe("Brazil patterns", () => {
  describe("CPF", () => {
    it("detects formatted CPF (529.982.247-25)", () => {
      expect(has("CPF: 529.982.247-25", "CPF")).toBe(true);
    });

    it("detects unformatted CPF (52998224725)", () => {
      expect(has("CPF: 52998224725", "CPF")).toBe(true);
    });

    it("detects CPF in a paragraph", () => {
      const text =
        "O responsável com CPF 347.066.120-04 solicitou revisão contratual.";
      expect(has(text, "CPF")).toBe(true);
    });

    it("detects two CPFs in the same text", () => {
      const result = detectSensitiveData(
        "Titular: 529.982.247-25 / Dependente: 347.066.120-04",
      );
      const cpfs = result.filter(d => d.type === "CPF");
      expect(cpfs.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe("CNPJ", () => {
    it("detects formatted CNPJ (11.222.333/0001-81)", () => {
      expect(has("CNPJ: 11.222.333/0001-81", "CNPJ")).toBe(true);
    });

    it("detects unformatted CNPJ (11222333000181)", () => {
      expect(has("CNPJ: 11222333000181", "CNPJ")).toBe(true);
    });
  });

  describe("BR Phone", () => {
    it("detects mobile +55 (11) 99876-5432", () => {
      expect(has("+55 (11) 99876-5432", "BR_PHONE")).toBe(true);
    });

    it("detects mobile without country code (11) 98765-4321", () => {
      expect(has("Ligar para (11) 98765-4321", "BR_PHONE")).toBe(true);
    });

    it("detects compact mobile 11987654321", () => {
      expect(has("Contato: 11987654321", "BR_PHONE")).toBe(true);
    });
  });

  describe("PIS/PASEP", () => {
    it("detects formatted PIS 123.45678.90-0", () => {
      expect(has("PIS: 123.45678.90-0", "PIS_PASEP")).toBe(true);
    });

    it("detects unformatted PIS 12345678900", () => {
      expect(has("PASEP: 12345678900", "PIS_PASEP")).toBe(true);
    });
  });

  describe("RG", () => {
    it("detects formatted RG 12.345.678-9", () => {
      expect(has("RG: 12.345.678-9", "RG")).toBe(true);
    });

    it("detects RG with X check digit 12.345.678-X", () => {
      expect(has("RG: 12.345.678-X", "RG")).toBe(true);
    });

    it("detects unformatted RG 123456789", () => {
      expect(has("Identidade: 123456789", "RG")).toBe(true);
    });
  });

  describe("Titulo de Eleitor", () => {
    it("detects spaced format 0123 4567 8901", () => {
      expect(has("Titulo: 0123 4567 8901", "TITULO_ELEITOR")).toBe(true);
    });

    it("detects compact format 012345678901", () => {
      expect(has("Titulo: 012345678901", "TITULO_ELEITOR")).toBe(true);
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
//  LATIN AMERICA
// ═══════════════════════════════════════════════════════════════════════════

describe("Latin America patterns", () => {
  describe("Argentine CUIT", () => {
    it("detects CUIT with dashes 20-12345678-6", () => {
      expect(has("CUIT: 20-12345678-6", "CUIT")).toBe(true);
    });

    it("detects CUIT without dashes 20123456786", () => {
      expect(has("CUIT: 20123456786", "CUIT")).toBe(true);
    });

    it("detects CUIT prefix 27 (female)", () => {
      expect(has("CUIT: 27-12345678-1", "CUIT")).toBe(true);
    });

    it("detects CUIT prefix 30 (empresa)", () => {
      expect(has("CUIT: 30-12345678-4", "CUIT")).toBe(true);
    });
  });

  describe("Chilean RUT", () => {
    it("detects RUT with dots and dash 12.345.678-5", () => {
      expect(has("RUT: 12.345.678-5", "RUT_CL")).toBe(true);
    });

    it("detects RUT with K check digit 7.654.321-K", () => {
      expect(has("RUT: 7.654.321-K", "RUT_CL")).toBe(true);
    });

    it("detects unformatted RUT 123456785", () => {
      expect(has("RUT: 123456785", "RUT_CL")).toBe(true);
    });
  });

  describe("Colombian NIT", () => {
    it("detects NIT with dash 860012503-5", () => {
      expect(has("NIT: 860012503-5", "NIT_CO")).toBe(true);
    });

    it("detects NIT with 10 digits 9001234568", () => {
      expect(has("NIT: 9001234568", "NIT_CO")).toBe(true);
    });
  });

  describe("Peruvian RUC", () => {
    it("detects RUC starting with 20 (empresa)", () => {
      expect(has("RUC: 20123456786", "RUC_PE")).toBe(true);
    });

    it("detects RUC starting with 10 (persona natural)", () => {
      expect(has("RUC: 10234567891", "RUC_PE")).toBe(true);
    });
  });

  describe("Mexican CURP", () => {
    it("detects valid CURP", () => {
      expect(has("CURP: GARC850101HDFRRL09", "CURP_MX")).toBe(true);
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
//  EUROPE
// ═══════════════════════════════════════════════════════════════════════════

describe("Europe patterns", () => {
  describe("Spanish DNI", () => {
    it("detects DNI 12345678Z", () => {
      expect(has("DNI: 12345678Z", "DNI")).toBe(true);
    });

    it("detects DNI 00000000T", () => {
      expect(has("DNI: 00000000T", "DNI")).toBe(true);
    });

    it("does NOT detect DNI with only 7 digits", () => {
      expect(has("DNI: 1234567Z", "DNI")).toBe(false);
    });
  });

  describe("Spanish NIE", () => {
    it("detects NIE starting with X (X1234567L)", () => {
      expect(has("NIE: X1234567L", "NIE")).toBe(true);
    });

    it("detects NIE starting with Y (Y1234567X)", () => {
      expect(has("NIE: Y1234567X", "NIE")).toBe(true);
    });

    it("detects NIE starting with Z (Z1234567R)", () => {
      expect(has("NIE: Z1234567R", "NIE")).toBe(true);
    });

    it("does NOT detect NIE starting with A", () => {
      expect(has("NIE: A1234567L", "NIE")).toBe(false);
    });
  });

  describe("Portuguese NIF", () => {
    it("detects NIF 245716840", () => {
      expect(has("NIF: 245716840", "PT_NIF")).toBe(true);
    });

    it("detects NIF starting with 1", () => {
      expect(has("NIF: 123456789", "PT_NIF")).toBe(true);
    });

    it("does NOT detect NIF with only 8 digits", () => {
      expect(has("NIF: 24571684", "PT_NIF")).toBe(false);
    });
  });

  describe("Portuguese NISS", () => {
    it("detects NISS 11234567890", () => {
      expect(has("NISS: 11234567890", "PT_NISS")).toBe(true);
    });
  });

  describe("IBAN", () => {
    it("detects German IBAN", () => {
      expect(has("IBAN: DE89370400440532013000", "IBAN")).toBe(true);
    });

    it("detects British IBAN", () => {
      expect(has("IBAN: GB29NWBK60161331926819", "IBAN")).toBe(true);
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
//  ASIA & RUSSIA
// ═══════════════════════════════════════════════════════════════════════════

describe("Asia & Russia patterns", () => {
  describe("Chinese Resident ID", () => {
    it("detects 18-digit ID ending in digit", () => {
      expect(has("ID: 440306198305121333", "CN_RESIDENT_ID")).toBe(true);
    });

    it("detects 18-digit ID ending in X", () => {
      expect(has("ID: 11010519491231002X", "CN_RESIDENT_ID")).toBe(true);
    });

    it("does NOT detect 17 digits with no check", () => {
      expect(has("Code: 44030619830512133", "CN_RESIDENT_ID")).toBe(false);
    });
  });

  describe("Chinese Phone", () => {
    it("detects +86 prefix phone", () => {
      expect(has("Call +86 13712345678", "CN_PHONE")).toBe(true);
    });

    it("detects bare 11-digit mobile", () => {
      expect(has("Contact: 13912345678", "CN_PHONE")).toBe(true);
    });

    it("detects dashed format +86-137-1234-5678", () => {
      expect(has("+86-137-1234-5678", "CN_PHONE")).toBe(true);
    });

    it("detects number starting with 15x", () => {
      expect(has("WeChat: 15098765432", "CN_PHONE")).toBe(true);
    });

    it("does NOT detect 10086 (not 1[3-9])", () => {
      expect(has("Dial 10086 for service.", "CN_PHONE")).toBe(false);
    });
  });

  describe("Russian INN", () => {
    it("detects 10-digit INN", () => {
      const result = detectSensitiveData("INN: 7728495344");
      expect(result.some(d => d.type === "RU_INN" && d.value === "7728495344")).toBe(
        true,
      );
    });

    it("detects 12-digit INN", () => {
      const result = detectSensitiveData("INN: 500123456750");
      expect(
        result.some(d => d.type === "RU_INN" && d.value === "500123456750"),
      ).toBe(true);
    });

    it("12-digit match takes priority over 10-digit substring", () => {
      // The regex is ordered \\d{12}|\\d{10} so 12-digit matches first
      const result = detectSensitiveData("INN: 500123456750");
      const innMatches = result.filter(d => d.type === "RU_INN");
      expect(innMatches[0].value).toBe("500123456750");
    });
  });

  describe("Russian SNILS", () => {
    it("detects SNILS 112-233-445 95", () => {
      expect(has("SNILS: 112-233-445 95", "RU_SNILS")).toBe(true);
    });

    it("detects SNILS 123-456-789 64", () => {
      expect(has("SNILS: 123-456-789 64", "RU_SNILS")).toBe(true);
    });
  });

  describe("Indian Aadhaar", () => {
    it("detects compact Aadhaar 276592857148", () => {
      expect(has("Aadhaar: 276592857148", "IN_AADHAAR")).toBe(true);
    });

    it("detects spaced Aadhaar 9876 5432 1012", () => {
      expect(has("Aadhaar: 9876 5432 1012", "IN_AADHAAR")).toBe(true);
    });

    it("does NOT detect Aadhaar starting with 0 or 1", () => {
      // Aadhaar first digit must be 2-9
      expect(has("ID: 0123 4567 8901", "IN_AADHAAR")).toBe(false);
    });
  });

  describe("Indian PAN", () => {
    it("detects PAN ABCPD1234E", () => {
      expect(has("PAN: ABCPD1234E", "IN_PAN")).toBe(true);
    });

    it("detects PAN ZZXPS9999Z", () => {
      expect(has("PAN: ZZXPS9999Z", "IN_PAN")).toBe(true);
    });

    it("does NOT detect malformed PAN (too few leading letters)", () => {
      expect(has("PAN: ABC12345Z", "IN_PAN")).toBe(false);
    });
  });

  describe("Indian GSTIN", () => {
    it("detects GSTIN 33AABCU9603R1ZM", () => {
      expect(has("GSTIN: 33AABCU9603R1ZM", "IN_GSTIN")).toBe(true);
    });

    it("detects GSTIN with Z at position 13", () => {
      expect(has("GST: 27ABCDE1234F1ZG", "IN_GSTIN")).toBe(true);
    });

    it("does NOT detect GSTIN missing Z position marker", () => {
      // The 'Z' at position 13 (0-indexed) is mandatory
      expect(has("GST: 27ABCDE1234FAAG", "IN_GSTIN")).toBe(false);
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
//  GLOBAL / CREDENTIALS
// ═══════════════════════════════════════════════════════════════════════════

describe("Global credential patterns", () => {
  describe("JWT", () => {
    it("detects JWT token", () => {
      const jwt =
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U";
      expect(has(`Token: ${jwt}`, "JWT")).toBe(true);
    });
  });

  describe("Bearer Token", () => {
    it("detects Bearer with opaque token", () => {
      expect(
        has("Authorization: Bearer SFMyNTY.g2gDYQ.dGVzdA==", "BEARER_TOKEN"),
      ).toBe(true);
    });

    it("detects Bearer with alphanumeric token", () => {
      expect(
        has("Authorization: Bearer abc123-token_value", "BEARER_TOKEN"),
      ).toBe(true);
    });
  });

  describe("Credit Card", () => {
    it("detects Visa 4111111111111111", () => {
      expect(has("Card: 4111111111111111", "CREDIT_CARD")).toBe(true);
    });

    it("detects Mastercard 5500000000000004", () => {
      expect(has("Card: 5500000000000004", "CREDIT_CARD")).toBe(true);
    });
  });

  describe("Email", () => {
    it("detects email in mixed text", () => {
      expect(
        has("Send to joao@empresa.com.br for details.", "EMAIL"),
      ).toBe(true);
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
//  MULTI-TYPE DETECTION
// ═══════════════════════════════════════════════════════════════════════════

describe("Multi-type detection", () => {
  it("detects CPF + email in same text", () => {
    const text = "CPF: 529.982.247-25 — Email: joao@empresa.com.br";
    const result = detectSensitiveData(text);
    const types = new Set(result.map(d => d.type));
    expect(types.has("CPF")).toBe(true);
    expect(types.has("EMAIL")).toBe(true);
  });

  it("detects SSN + email + phone in same text", () => {
    const text =
      "Employee SSN: 123-45-6789, contact: a@b.com, phone: 555-123-4567";
    const result = detectSensitiveData(text);
    const types = new Set(result.map(d => d.type));
    expect(types.has("SSN")).toBe(true);
    expect(types.has("EMAIL")).toBe(true);
    expect(types.has("PHONE")).toBe(true);
  });

  it("detects multiple country identifiers in same text", () => {
    const text =
      "DNI: 12345678Z, NIE: X1234567L, correo: empleado@corp.es";
    const result = detectSensitiveData(text);
    const types = new Set(result.map(d => d.type));
    expect(types.has("DNI")).toBe(true);
    expect(types.has("NIE")).toBe(true);
    expect(types.has("EMAIL")).toBe(true);
  });

  it("detects CUIT + email in Argentine context", () => {
    const text = "CUIT: 20-12345678-6 y correo info@empresa.com.ar";
    const result = detectSensitiveData(text);
    expect(result.some(d => d.type === "CUIT")).toBe(true);
    expect(result.some(d => d.type === "EMAIL")).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
//  MASK SUGGESTIONS
// ═══════════════════════════════════════════════════════════════════════════

describe("generateMasks for new types", () => {
  it("generates partial mask for CUIT", () => {
    const masks = generateMasks({
      type: "CUIT",
      label: "CUIT",
      mask: "[CUIT]",
      value: "20-12345678-6",
      start: 0,
      end: 13,
    });
    expect(masks).toContain("[CUIT]");
    expect(masks.some(m => m.includes("***"))).toBe(true);
  });

  it("generates partial mask for BR_PHONE", () => {
    const masks = generateMasks({
      type: "BR_PHONE",
      label: "BR Phone",
      mask: "[BR_PHONE]",
      value: "+55 (11) 99876-5432",
      start: 0,
      end: 19,
    });
    expect(masks).toContain("[BR_PHONE]");
    expect(masks.some(m => m.includes("PHONE"))).toBe(true);
  });

  it("generates partial mask for CN_PHONE", () => {
    const masks = generateMasks({
      type: "CN_PHONE",
      label: "CN Phone",
      mask: "[CN_PHONE]",
      value: "+86 13712345678",
      start: 0,
      end: 15,
    });
    expect(masks).toContain("[CN_PHONE]");
    expect(masks.some(m => m.includes("5678"))).toBe(true);
  });

  it("generates partial mask for IN_AADHAAR", () => {
    const masks = generateMasks({
      type: "IN_AADHAAR",
      label: "Aadhaar",
      mask: "[AADHAAR]",
      value: "276592857148",
      start: 0,
      end: 12,
    });
    expect(masks).toContain("[AADHAAR]");
    expect(masks.some(m => m.includes("***"))).toBe(true);
  });

  it("generates partial mask for RU_INN", () => {
    const masks = generateMasks({
      type: "RU_INN",
      label: "INN",
      mask: "[INN]",
      value: "7728495344",
      start: 0,
      end: 10,
    });
    expect(masks).toContain("[INN]");
    expect(masks.some(m => m.includes("***"))).toBe(true);
  });
});
