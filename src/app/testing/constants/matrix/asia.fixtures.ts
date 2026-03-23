/**
 * Asia & Russia country-scope matrix fixtures.
 * Covers: Chinese Resident ID, Chinese phone, Russian INN, Russian SNILS,
 *         Indian Aadhaar, Indian PAN, Indian GSTIN.
 * Countries: cn, ru, in.
 */
import type {
  BoundaryMaskFixture,
  LocaleMaskFixture,
  NegativeMaskFixture,
} from "../../declarations/testing.types";

// ─── Positive: Chinese Resident ID (labeled) ───────────────────────────────
export const CN_RESIDENT_ID_POSITIVE: readonly LocaleMaskFixture[] =
  Object.freeze([
    {
      countryProfileIds: ["cn"],
      description: "masks CN ID with 'resident id:' English label",
      expectedRuleIds: ["cn-resident-id-labeled"],
      hiddenValues: ["11010519491231002X"],
      sourceText: "resident id: 11010519491231002X",
    },
    {
      countryProfileIds: ["cn"],
      description: "masks CN ID with '身份证号:' Chinese label",
      expectedRuleIds: ["cn-resident-id-labeled"],
      hiddenValues: ["440306198305121333"],
      sourceText: "身份证号: 440306198305121333",
    },
    {
      countryProfileIds: ["cn"],
      description: "masks CN ID with 'national id:' label",
      expectedRuleIds: ["cn-resident-id-labeled"],
      hiddenValues: ["310103199001020010"],
      sourceText: "national id: 310103199001020010",
    },
    {
      countryProfileIds: ["cn"],
      description: "masks CN ID with 'identity card:' label embedded in prose",
      expectedRuleIds: ["cn-resident-id-labeled"],
      hiddenValues: ["500102200012256787"],
      sourceText: "The identity card: 500102200012256787 was verified.",
    },
    {
      countryProfileIds: ["cn"],
      description: "masks CN ID ending in lowercase x with '身份证:' label",
      expectedRuleIds: ["cn-resident-id-labeled"],
      hiddenValues: ["11010519491231002X"],
      sourceText: "身份证: 11010519491231002X",
    },
  ]);

// ─── Negative: Chinese Resident ID ──────────────────────────────────────────
export const CN_RESIDENT_ID_NEGATIVE: readonly NegativeMaskFixture[] =
  Object.freeze([
    {
      countryProfileIds: ["cn"],
      description: "does NOT mask 18 repeated digits (invalid body)",
      excludedRuleIds: ["cn-resident-id-labeled"],
      sourceText: "resident id: 111111111111111111",
      visibleValues: ["111111111111111111"],
    },
    {
      countryProfileIds: ["cn"],
      description: "does NOT mask CN ID with invalid birthdate month 13",
      excludedRuleIds: ["cn-resident-id-labeled"],
      sourceText: "resident id: 11010519491331002X",
      visibleValues: ["11010519491331002X"],
    },
  ]);

// ─── Positive: Chinese Phone ────────────────────────────────────────────────
export const CN_PHONE_POSITIVE: readonly LocaleMaskFixture[] = Object.freeze([
  {
    countryProfileIds: ["cn"],
    description: "masks CN phone with +86 prefix",
    expectedRuleIds: ["cn-phone"],
    hiddenValues: ["+86 13712345678"],
    sourceText: "My number is +86 13712345678 please call.",
  },
  {
    countryProfileIds: ["cn"],
    description: "masks CN phone without country code",
    expectedRuleIds: ["cn-phone"],
    hiddenValues: ["13912345678"],
    sourceText: "Contact: 13912345678",
  },
  {
    countryProfileIds: ["cn"],
    description: "masks CN phone with +86 dash separator",
    expectedRuleIds: ["cn-phone"],
    hiddenValues: ["+86-137-1234-5678"],
    sourceText: "Reach me at +86-137-1234-5678 anytime.",
  },
  {
    countryProfileIds: ["cn"],
    description: "masks CN phone number starting with 15x",
    expectedRuleIds: ["cn-phone"],
    hiddenValues: ["15098765432"],
    sourceText: "WeChat: 15098765432",
  },
]);

// ─── Negative: Chinese Phone ────────────────────────────────────────────────
export const CN_PHONE_NEGATIVE: readonly NegativeMaskFixture[] = Object.freeze([
  {
    countryProfileIds: ["cn"],
    description: "does NOT mask number starting with 10 (not 1[3-9])",
    excludedRuleIds: ["cn-phone"],
    sourceText: "Dial 10086 for service.",
    visibleValues: ["10086"],
  },
  {
    countryProfileIds: ["cn"],
    description: "does NOT mask 8-digit landline (too short)",
    excludedRuleIds: ["cn-phone"],
    sourceText: "Office: 62345678",
    visibleValues: ["62345678"],
  },
]);

// ─── Positive: Russian INN (labeled) ────────────────────────────────────────
export const RU_INN_POSITIVE: readonly LocaleMaskFixture[] = Object.freeze([
  {
    countryProfileIds: ["ru"],
    description: "masks 10-digit INN with 'инн:' Cyrillic label",
    expectedRuleIds: ["ru-inn-labeled"],
    hiddenValues: ["7728495344"],
    sourceText: "инн: 7728495344",
  },
  {
    countryProfileIds: ["ru"],
    description: "masks 10-digit INN with 'inn:' Latin label",
    expectedRuleIds: ["ru-inn-labeled"],
    hiddenValues: ["5001007329"],
    sourceText: "inn: 5001007329",
  },
  {
    countryProfileIds: ["ru"],
    description: "masks 12-digit INN with 'инн:' Cyrillic label",
    expectedRuleIds: ["ru-inn-labeled"],
    hiddenValues: ["500123456750"],
    sourceText: "инн: 500123456750",
  },
  {
    countryProfileIds: ["ru"],
    description: "masks 12-digit INN with full Cyrillic label in prose",
    expectedRuleIds: ["ru-inn-labeled"],
    hiddenValues: ["770234567818"],
    sourceText:
      "идентификационный номер налогоплательщика: 770234567818 зарегистрирован.",
  },
  {
    countryProfileIds: ["ru"],
    description: "masks 10-digit INN with 'инн:' and extra whitespace",
    expectedRuleIds: ["ru-inn-labeled"],
    hiddenValues: ["7703082169"],
    sourceText: "инн:   7703082169",
  },
]);

// ─── Negative: Russian INN ──────────────────────────────────────────────────
export const RU_INN_NEGATIVE: readonly NegativeMaskFixture[] = Object.freeze([
  {
    countryProfileIds: ["ru"],
    description: "does NOT mask INN without label",
    excludedRuleIds: ["ru-inn-labeled"],
    sourceText: "Code 7728495344 in system.",
    visibleValues: ["7728495344"],
  },
  {
    countryProfileIds: ["ru"],
    description: "does NOT mask INN with all same digits",
    excludedRuleIds: ["ru-inn-labeled"],
    sourceText: "инн: 1111111111",
    visibleValues: ["1111111111"],
  },
  {
    countryProfileIds: ["ru"],
    description: "does NOT mask 9-digit string (too short)",
    excludedRuleIds: ["ru-inn-labeled"],
    sourceText: "инн: 123456789",
    visibleValues: ["123456789"],
  },
]);

// ─── Positive: Russian SNILS (labeled) ──────────────────────────────────────
export const RU_SNILS_POSITIVE: readonly LocaleMaskFixture[] = Object.freeze([
  {
    countryProfileIds: ["ru"],
    description: "masks SNILS with 'СНИЛС:' Cyrillic label (dash-formatted)",
    expectedRuleIds: ["ru-snils-labeled"],
    hiddenValues: ["112-233-445 95"],
    sourceText: "СНИЛС: 112-233-445 95",
  },
  {
    countryProfileIds: ["ru"],
    description: "masks SNILS with 'snils:' Latin label (plain digits)",
    expectedRuleIds: ["ru-snils-labeled"],
    hiddenValues: ["08765432102"],
    sourceText: "snils: 08765432102",
  },
  {
    countryProfileIds: ["ru"],
    description: "masks SNILS with 'страховой номер:' full label",
    expectedRuleIds: ["ru-snils-labeled"],
    hiddenValues: ["123-456-789 64"],
    sourceText: "Страховой номер: 123-456-789 64",
  },
]);

// ─── Negative: Russian SNILS ────────────────────────────────────────────────
export const RU_SNILS_NEGATIVE: readonly NegativeMaskFixture[] = Object.freeze([
  {
    countryProfileIds: ["ru"],
    description: "does NOT mask SNILS without label",
    excludedRuleIds: ["ru-snils-labeled"],
    sourceText: "Number 112-233-445 95 on file.",
    visibleValues: ["112-233-445 95"],
  },
  {
    countryProfileIds: ["ru"],
    description: "does NOT mask SNILS with all same digits",
    excludedRuleIds: ["ru-snils-labeled"],
    sourceText: "снилс: 11111111111",
    visibleValues: ["11111111111"],
  },
]);

// ─── Positive: Indian Aadhaar (labeled) ─────────────────────────────────────
export const IN_AADHAAR_POSITIVE: readonly LocaleMaskFixture[] = Object.freeze([
  {
    countryProfileIds: ["in"],
    description: "masks Aadhaar with 'Aadhaar:' label (compact digits)",
    expectedRuleIds: ["in-aadhaar-labeled"],
    hiddenValues: ["276592857148"],
    sourceText: "Aadhaar: 276592857148",
  },
  {
    countryProfileIds: ["in"],
    description: "masks Aadhaar with 'aadhaar number:' label (spaced groups)",
    expectedRuleIds: ["in-aadhaar-labeled"],
    hiddenValues: ["9876 5432 1012"],
    sourceText: "aadhaar number: 9876 5432 1012",
  },
  {
    countryProfileIds: ["in"],
    description: "masks Aadhaar with 'aadhar:' misspelling label",
    expectedRuleIds: ["in-aadhaar-labeled"],
    hiddenValues: ["345678901238"],
    sourceText: "aadhar: 345678901238",
  },
  {
    countryProfileIds: ["in"],
    description:
      "masks Aadhaar with 'unique identification number:' long label in prose",
    expectedRuleIds: ["in-aadhaar-labeled"],
    hiddenValues: ["5123 4567 8903"],
    sourceText:
      "Your unique identification number: 5123 4567 8903 is registered.",
  },
]);

// ─── Negative: Indian Aadhaar ───────────────────────────────────────────────
export const IN_AADHAAR_NEGATIVE: readonly NegativeMaskFixture[] =
  Object.freeze([
    {
      countryProfileIds: ["in"],
      description: "does NOT mask Aadhaar without label",
      excludedRuleIds: ["in-aadhaar-labeled"],
      sourceText: "Reference 276592857148 in database.",
      visibleValues: ["276592857148"],
    },
    {
      countryProfileIds: ["in"],
      description: "does NOT mask 12 repeated digits",
      excludedRuleIds: ["in-aadhaar-labeled"],
      sourceText: "aadhaar: 111111111111",
      visibleValues: ["111111111111"],
    },
    {
      countryProfileIds: ["in"],
      description: "does NOT mask Aadhaar with wrong Verhoeff check digit",
      excludedRuleIds: ["in-aadhaar-labeled"],
      sourceText: "aadhaar: 276592857149",
      visibleValues: ["276592857149"],
    },
  ]);

// ─── Positive: Indian PAN (labeled) ─────────────────────────────────────────
export const IN_PAN_POSITIVE: readonly LocaleMaskFixture[] = Object.freeze([
  {
    countryProfileIds: ["in"],
    description: "masks PAN with 'PAN:' label",
    expectedRuleIds: ["in-pan-labeled"],
    hiddenValues: ["ABCPD1234E"],
    sourceText: "PAN: ABCPD1234E",
  },
  {
    countryProfileIds: ["in"],
    description: "masks PAN with 'permanent account number:' label",
    expectedRuleIds: ["in-pan-labeled"],
    hiddenValues: ["ZZXPS9999Z"],
    sourceText: "permanent account number: ZZXPS9999Z",
  },
  {
    countryProfileIds: ["in"],
    description: "masks PAN with 'pan number:' label in sentence",
    expectedRuleIds: ["in-pan-labeled"],
    hiddenValues: ["BHLPM5678K"],
    sourceText: "Your pan number: BHLPM5678K is active.",
  },
]);

// ─── Negative: Indian PAN ───────────────────────────────────────────────────
export const IN_PAN_NEGATIVE: readonly NegativeMaskFixture[] = Object.freeze([
  {
    countryProfileIds: ["in"],
    description: "does NOT mask PAN without label",
    excludedRuleIds: ["in-pan-labeled"],
    sourceText: "Code ABCPD1234E referenced.",
    visibleValues: ["ABCPD1234E"],
  },
  {
    countryProfileIds: ["in"],
    description: "does NOT mask malformed PAN (too few letters at start)",
    excludedRuleIds: ["in-pan-labeled"],
    sourceText: "pan: ABC12345Z",
    visibleValues: ["ABC12345Z"],
  },
]);

// ─── Positive: Indian GSTIN (labeled) ───────────────────────────────────────
export const IN_GSTIN_POSITIVE: readonly LocaleMaskFixture[] = Object.freeze([
  {
    countryProfileIds: ["in"],
    description: "masks GSTIN with 'GSTIN:' label",
    expectedRuleIds: ["in-gstin-labeled"],
    hiddenValues: ["27ABCDE1234F1ZG"],
    sourceText: "GSTIN: 27ABCDE1234F1ZG",
  },
  {
    countryProfileIds: ["in"],
    description: "masks GSTIN with 'gst number:' label",
    expectedRuleIds: ["in-gstin-labeled"],
    hiddenValues: ["09XYZAB5678C1ZK"],
    sourceText: "gst number: 09XYZAB5678C1ZK",
  },
  {
    countryProfileIds: ["in"],
    description: "masks GSTIN with 'goods and services tax number:' long label",
    expectedRuleIds: ["in-gstin-labeled"],
    hiddenValues: ["33AABCU9603R1ZM"],
    sourceText: "goods and services tax number: 33AABCU9603R1ZM",
  },
]);

// ─── Negative: Indian GSTIN ─────────────────────────────────────────────────
export const IN_GSTIN_NEGATIVE: readonly NegativeMaskFixture[] = Object.freeze([
  {
    countryProfileIds: ["in"],
    description: "does NOT mask GSTIN without label",
    excludedRuleIds: ["in-gstin-labeled"],
    sourceText: "Reference 27ABCDE1234F1ZG in ledger.",
    visibleValues: ["27ABCDE1234F1ZG"],
  },
  {
    countryProfileIds: ["in"],
    description: "does NOT mask GSTIN missing Z position marker",
    excludedRuleIds: ["in-gstin-labeled"],
    sourceText: "gstin: 27ABCDE1234FAG",
    visibleValues: ["27ABCDE1234FAG"],
  },
]);

// ─── Boundary: Asia scope isolation ─────────────────────────────────────────
export const ASIA_BOUNDARY: readonly BoundaryMaskFixture[] = Object.freeze([
  {
    countryProfileIds: ["cn"],
    description: "CN scope masks CN ID but not RU INN in same text",
    excludedRuleIds: ["ru-inn-labeled"],
    expectedRuleIds: ["cn-resident-id-labeled"],
    hiddenValues: ["11010519491231002X"],
    sourceText:
      "resident id: 11010519491231002X and инн: 7728495344 are different.",
    visibleValues: ["7728495344"],
  },
  {
    countryProfileIds: ["ru"],
    description:
      "RU scope masks INN and CN ID (global standalone) in same text",
    expectedRuleIds: ["ru-inn-labeled", "cn-resident-id"],
    hiddenValues: ["7728495344", "11010519491231002X"],
    sourceText:
      "инн: 7728495344 and resident id: 11010519491231002X both present.",
  },
  {
    countryProfileIds: ["in"],
    description: "IN scope masks Aadhaar but not RU SNILS in same text",
    excludedRuleIds: ["ru-snils-labeled"],
    expectedRuleIds: ["in-aadhaar-labeled"],
    hiddenValues: ["276592857148"],
    sourceText:
      "aadhaar: 276592857148 and снилс: 112-233-445 95 were provided.",
    visibleValues: ["112-233-445 95"],
  },
  {
    countryProfileIds: ["cn"],
    description: "CN scope masks CN phone but not IN PAN in same text",
    excludedRuleIds: ["in-pan-labeled"],
    expectedRuleIds: ["cn-phone"],
    hiddenValues: ["+86 13712345678"],
    sourceText: "Call +86 13712345678, PAN: ABCPD1234E is unrelated.",
    visibleValues: ["ABCPD1234E"],
  },
  {
    countryProfileIds: ["in"],
    description: "IN scope masks GSTIN, Aadhaar, and CN Resident ID (global)",
    expectedRuleIds: [
      "in-gstin-labeled",
      "in-aadhaar-labeled",
      "cn-resident-id",
    ],
    hiddenValues: ["27ABCDE1234F1ZG", "276592857148", "11010519491231002X"],
    sourceText:
      "gstin: 27ABCDE1234F1ZG aadhaar: 276592857148 resident id: 11010519491231002X",
  },
  {
    countryProfileIds: ["ru"],
    description: "RU scope masks INN and SNILS but global email still masked",
    expectedRuleIds: ["ru-inn-labeled", "ru-snils-labeled", "email-address"],
    hiddenValues: ["7728495344", "112-233-445 95", "user@example.com"],
    sourceText: "инн: 7728495344 снилс: 112-233-445 95 email user@example.com",
  },
  {
    countryProfileIds: ["cn"],
    description:
      "global-only mode masks CN ID (global standalone) but not CN phone",
    detectionMode: "global-only",
    excludedRuleIds: ["cn-resident-id-labeled", "cn-phone"],
    expectedRuleIds: ["cn-resident-id"],
    hiddenValues: ["11010519491231002X"],
    sourceText: "resident id: 11010519491231002X and call +86 13712345678",
    visibleValues: ["+86 13712345678"],
  },
]);
