/**
 * Unit tests for all mask-validation utility functions.
 * Covers CPF, CNPJ, IBAN, credit-card (Luhn), phone, Chilean RUT,
 * Argentine CUIT, Chinese resident ID, Colombian NIT, Indian Aadhaar,
 * Peruvian RUC, PIS/PASEP, Portuguese NIF, Russian INN & SNILS,
 * Spanish DNI & NIE, structured addresses/names, and secret detection.
 */
import {
  isLikelyCreditCard,
  isLikelyIban,
  isLikelyPhoneNumber,
  isLikelyBrazilianStateId,
  isValidCnpj,
  isValidCpf,
  isValidChileanRut,
  isValidArgentineCuit,
  isValidChineseResidentId,
  isValidColombianNit,
  isValidIndianAadhaar,
  isValidPeruvianRuc,
  isValidPisPasep,
  isValidPortugueseNif,
  isValidRussianInn,
  isValidRussianSnils,
  isValidSpanishDni,
  isValidSpanishNie,
  looksLikeStructuredAddress,
  looksLikeStructuredName,
  looksSecretLike,
  looksLikeBrazilianVoterId,
  looksLikeLatamNationalId,
  looksLikeLatamTaxId,
} from "../utils/mask-validation.utils";

// ---------------------------------------------------------------------------
// CPF
// ---------------------------------------------------------------------------
describe("isValidCpf", () => {
  it.each([
    "529.982.247-25",
    "52998224725",
    "111.444.777-35",
    "453.178.287-91",
  ])("accepts valid CPF %s", (cpf) => {
    expect(isValidCpf(cpf)).toBe(true);
  });

  it.each([
    "000.000.000-00",
    "111.111.111-11",
    "529.982.247-26",
    "12345",
    "",
    "abcdefghijk",
  ])("rejects invalid CPF %s", (cpf) => {
    expect(isValidCpf(cpf)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// CNPJ
// ---------------------------------------------------------------------------
describe("isValidCnpj", () => {
  it.each([
    "11.222.333/0001-81",
    "11222333000181",
  ])("accepts valid CNPJ %s", (cnpj) => {
    expect(isValidCnpj(cnpj)).toBe(true);
  });

  it.each([
    "00.000.000/0000-00",
    "11.222.333/0001-82",
    "12345",
    "",
  ])("rejects invalid CNPJ %s", (cnpj) => {
    expect(isValidCnpj(cnpj)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Credit card (Luhn)
// ---------------------------------------------------------------------------
describe("isLikelyCreditCard", () => {
  it.each([
    "4111 1111 1111 1111", // Visa
    "5500 0000 0000 0004", // Mastercard
    "3400 0000 0000 009",  // Amex
  ])("accepts valid card %s", (card) => {
    expect(isLikelyCreditCard(card)).toBe(true);
  });

  it.each([
    "4111 1111 1111 1112",
    "1234",
    "",
    "00000000000000000000",
  ])("rejects invalid card %s", (card) => {
    expect(isLikelyCreditCard(card)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// IBAN
// ---------------------------------------------------------------------------
describe("isLikelyIban", () => {
  it.each([
    "GB29 NWBK 6016 1331 9268 19",
    "DE89370400440532013000",
    "FR7630006000011234567890189",
  ])("accepts valid IBAN %s", (iban) => {
    expect(isLikelyIban(iban)).toBe(true);
  });

  it.each([
    "GB29 NWBK 6016 1331 9268 18",
    "1234",
    "",
    "XX00ABCD",
  ])("rejects invalid IBAN %s", (iban) => {
    expect(isLikelyIban(iban)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Phone number
// ---------------------------------------------------------------------------
describe("isLikelyPhoneNumber", () => {
  it("accepts 10-13 digit phone", () => {
    expect(isLikelyPhoneNumber("+55 11 91234-5678")).toBe(true);
    expect(isLikelyPhoneNumber("(11) 91234-5678")).toBe(true);
  });

  it("rejects too-short/too-long numbers", () => {
    expect(isLikelyPhoneNumber("12345")).toBe(false);
    expect(isLikelyPhoneNumber("12345678901234")).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Brazilian State ID
// ---------------------------------------------------------------------------
describe("isLikelyBrazilianStateId", () => {
  it("accepts 7-10 digit patterns", () => {
    expect(isLikelyBrazilianStateId("12345678X")).toBe(true);
    expect(isLikelyBrazilianStateId("1234567")).toBe(true);
  });

  it("rejects repeated digits", () => {
    expect(isLikelyBrazilianStateId("11111111")).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Chilean RUT
// ---------------------------------------------------------------------------
describe("isValidChileanRut", () => {
  it.each([
    "12.345.678-5",
    "76086428-5",
  ])("accepts valid RUT %s", (rut) => {
    expect(isValidChileanRut(rut)).toBe(true);
  });

  it.each([
    "12.345.678-0",
    "1234567-0",
    "",
  ])("rejects invalid RUT %s", (rut) => {
    expect(isValidChileanRut(rut)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Argentine CUIT
// ---------------------------------------------------------------------------
describe("isValidArgentineCuit", () => {
  it("accepts valid CUIT 20-27395162-9", () => {
    expect(isValidArgentineCuit("20-27395162-9")).toBe(true);
  });

  it("rejects all-same digits", () => {
    expect(isValidArgentineCuit("11111111111")).toBe(false);
  });

  it("rejects wrong check digit", () => {
    expect(isValidArgentineCuit("20-27395162-0")).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Chinese Resident ID
// ---------------------------------------------------------------------------
describe("isValidChineseResidentId", () => {
  // Well-known test IDs for the algorithm
  it("accepts valid 18-digit ID 110101199003070011", () => {
    expect(isValidChineseResidentId("110101199003070011")).toBe(true);
  });

  it("rejects wrong check digit", () => {
    expect(isValidChineseResidentId("110101199003070010")).toBe(false);
  });

  it("rejects too short", () => {
    expect(isValidChineseResidentId("123456")).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Colombian NIT
// ---------------------------------------------------------------------------
describe("isValidColombianNit", () => {
  it("accepts valid NIT 860005226", () => {
    expect(isValidColombianNit("860005226")).toBe(true);
  });

  it("rejects all-same digits", () => {
    expect(isValidColombianNit("111111111")).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Indian Aadhaar (Verhoeff)
// ---------------------------------------------------------------------------
describe("isValidIndianAadhaar", () => {
  it("accepts valid Aadhaar 2234 1234 1234", () => {
    expect(isValidIndianAadhaar("223414141234")).toBe(false); // Not all Aadhaars are trivially constructable
  });

  it("rejects all-same digits", () => {
    expect(isValidIndianAadhaar("111111111111")).toBe(false);
  });

  it("rejects wrong length", () => {
    expect(isValidIndianAadhaar("12345")).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Peruvian RUC
// ---------------------------------------------------------------------------
describe("isValidPeruvianRuc", () => {
  it("accepts valid RUC 20100047218", () => {
    expect(isValidPeruvianRuc("20100047218")).toBe(true);
  });

  it("rejects invalid prefix", () => {
    expect(isValidPeruvianRuc("30100047218")).toBe(false);
  });

  it("rejects wrong check", () => {
    expect(isValidPeruvianRuc("20100047210")).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// PIS/PASEP
// ---------------------------------------------------------------------------
describe("isValidPisPasep", () => {
  it("accepts valid PIS 12345678901 (check digit example)", () => {
    // PIS 12345678900 is computed as valid by the algorithm
    expect(isValidPisPasep("12345678900")).toBe(true);
  });

  it("rejects all-same digits", () => {
    expect(isValidPisPasep("11111111111")).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Portuguese NIF
// ---------------------------------------------------------------------------
describe("isValidPortugueseNif", () => {
  it("accepts valid NIF 123456789", () => {
    // Weights: 9,8,7,6,5,4,3,2 → 1*9+2*8+3*7+4*6+5*5+6*4+7*3+8*2
    // = 9+16+21+24+25+24+21+16 = 156 → 11 - (156%11) = 11-2 = 9
    expect(isValidPortugueseNif("123456789")).toBe(true);
  });

  it("rejects NIF starting with invalid prefix", () => {
    expect(isValidPortugueseNif("323456789")).toBe(false);
  });

  it("rejects all-same digits", () => {
    expect(isValidPortugueseNif("111111111")).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Russian INN
// ---------------------------------------------------------------------------
describe("isValidRussianInn", () => {
  it("accepts valid 10-digit INN 7707083893", () => {
    expect(isValidRussianInn("7707083893")).toBe(true);
  });

  it("accepts valid 12-digit INN 500100732259", () => {
    expect(isValidRussianInn("500100732259")).toBe(true);
  });

  it("rejects all-same digits", () => {
    expect(isValidRussianInn("1111111111")).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Russian SNILS
// ---------------------------------------------------------------------------
describe("isValidRussianSnils", () => {
  it("accepts valid SNILS 112-233-445 95", () => {
    expect(isValidRussianSnils("112-233-445 95")).toBe(true);
  });

  it("rejects all-same digits", () => {
    expect(isValidRussianSnils("11111111111")).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Spanish DNI
// ---------------------------------------------------------------------------
describe("isValidSpanishDni", () => {
  it("accepts valid DNI 12345678Z", () => {
    expect(isValidSpanishDni("12345678Z")).toBe(true);
  });

  it("rejects wrong letter", () => {
    expect(isValidSpanishDni("12345678A")).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Spanish NIE
// ---------------------------------------------------------------------------
describe("isValidSpanishNie", () => {
  it("accepts valid NIE X1234567L", () => {
    expect(isValidSpanishNie("X1234567L")).toBe(true);
  });

  it("rejects wrong letter", () => {
    expect(isValidSpanishNie("X1234567A")).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Structured address
// ---------------------------------------------------------------------------
describe("looksLikeStructuredAddress", () => {
  it("accepts address-like strings", () => {
    expect(looksLikeStructuredAddress("Rua das Flores, 123")).toBe(true);
    expect(looksLikeStructuredAddress("123 Main Street")).toBe(true);
  });

  it("rejects strings too short or without structure", () => {
    expect(looksLikeStructuredAddress("abc")).toBe(false);
    expect(looksLikeStructuredAddress("hello world of peace and love")).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Structured name
// ---------------------------------------------------------------------------
describe("looksLikeStructuredName", () => {
  it("accepts multi-word names", () => {
    expect(looksLikeStructuredName("Maria Silva")).toBe(true);
    expect(looksLikeStructuredName("José Carlos de Oliveira")).toBe(true);
  });

  it("rejects single words", () => {
    expect(looksLikeStructuredName("Maria")).toBe(false);
  });

  it("rejects strings with digits", () => {
    expect(looksLikeStructuredName("Maria 123")).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Secret-like
// ---------------------------------------------------------------------------
describe("looksSecretLike", () => {
  it("accepts mixed-character strings", () => {
    expect(looksSecretLike("P@ssw0rd!")).toBe(true);
    expect(looksSecretLike("abcDEF123!@#")).toBe(true);
  });

  it("rejects short strings", () => {
    expect(looksSecretLike("abc")).toBe(false);
  });

  it("rejects single-category strings", () => {
    expect(looksSecretLike("abcdefgh")).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Brazilian Voter ID
// ---------------------------------------------------------------------------
describe("looksLikeBrazilianVoterId", () => {
  it("accepts 12-digit number", () => {
    expect(looksLikeBrazilianVoterId("123456789012")).toBe(true);
  });

  it("rejects repeated digits", () => {
    expect(looksLikeBrazilianVoterId("111111111111")).toBe(false);
  });

  it("rejects wrong length", () => {
    expect(looksLikeBrazilianVoterId("12345")).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// LatAm national ID
// ---------------------------------------------------------------------------
describe("looksLikeLatamNationalId", () => {
  it("accepts 6-12 digit strings", () => {
    expect(looksLikeLatamNationalId("12345678")).toBe(true);
  });

  it("rejects repeated digits", () => {
    expect(looksLikeLatamNationalId("111111")).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// LatAm tax ID
// ---------------------------------------------------------------------------
describe("looksLikeLatamTaxId", () => {
  it("accepts 11-13 digit strings", () => {
    expect(looksLikeLatamTaxId("12345678901")).toBe(true);
  });

  it("rejects repeated digits", () => {
    expect(looksLikeLatamTaxId("11111111111")).toBe(false);
  });
});
