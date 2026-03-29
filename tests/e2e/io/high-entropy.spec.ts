import { expect, test, type Page } from "@playwright/test";

// ─── Variation arrays ───────────────────────────────────────────────────────
// Each array grows with the entropy/complexity of the possible input formats.

/** CPFs: 3-dot-dash, raw digits, dot-no-dash, spaced. Simple pattern → short array. */
const CPF_VARIANTS = [
  "529.982.247-25",
  "34706612004",
  "347.066.120-04",
  "862.974.310-07",
] as const;

/** CNPJs: formatted, raw digits, partial formatting. Simple pattern → short array. */
const CNPJ_VARIANTS = [
  "11.222.333/0001-81",
  "04252011000110",
  "12.345.678/0001-95",
  "98.765.432/0001-98",
] as const;

/** SSNs: dashed, no-dash, spaced. Simple pattern → short array. */
const SSN_VARIANTS = [
  "123-45-6789",
  "219099999",
  "078-05-1120",
  "001-01-0001",
] as const;

/**
 * Phone numbers: HUGE variation of possible formats.
 * International prefix, parens, dashes, dots, spaces, no-space, landline vs mobile,
 * country code variations, extensions, etc.
 */
const PHONE_BR_VARIANTS = [
  "+55 11 98765-4321",
  "+55 (11) 99876-5432",
  "(21) 99999-8888",
  "21999998888",
  "+55 21 99999-8888",
  "+55 (21) 3221-5678",
  "(11) 3345-6789",
  "1134567890",
  "+5511987654321",
  "(31) 98765-4321",
  "+55 31 98765 4321",
  "+55 61 99123-4567",
  "(61) 32145678",
  "+55 (71) 99888-7766",
  "71998887766",
  "11 98765-4321",
] as const;

const PHONE_US_VARIANTS = [
  "(415) 555-2671",
  "+1 (212) 555-0100",
  "1-800-555-1234",
  "415.555.2671",
  "+1-202-555-0198",
  "212 555 0100",
  "555-123-4567",
  "(310) 555-8899",
  "+14155552671",
  "800-555-1234",
  "1 (800) 555-1234",
  "(703) 555-0199",
  "+1 415 555 2671",
  "202.555.0198",
  "1-888-555-6789",
  "+1 (646) 555-4422",
] as const;

/** Credit cards: Visa, Mastercard, Amex — spaced, dashed, raw. */
const CREDIT_CARD_VARIANTS = [
  "4111 1111 1111 1111",
  "4111111111111111",
  "4111-1111-1111-1111",
  "5500 0000 0000 0004",
  "5500000000000004",
  "3400 000000 00009",
  "3400-000000-00009",
  "3782 822463 10005",
] as const;

/** Emails: plus addressing, subdomains, BR TLD, accented-prefix-adjacent. */
const EMAIL_VARIANTS = [
  "maria.souza+qa@example.com",
  "admin@site.com",
  "hacker@evil.com",
  "contato@empresa.com.br",
  "alice@example.com",
  "payment@shop.com",
  "bob@company.org",
  "charlie@test.net",
  "usuario@empresa.com.br",
] as const;

/** API keys: various prefixes and lengths. */
const API_KEY_VARIANTS = [
  "sk-proj-ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890",
  "sk-live-ABCDEFGHIJKLMNOPQRSTUVWXYz123456",
  "sk-test-JKLMNOp123456789abcdef0000000000",
] as const;

/** CUIT/CUIL variants: hyphenated and unhyphenated (AR). */
const CUIT_VARIANTS = [
  "20-12345678-6",
  "27-34567890-0",
  "30-71234567-2",
] as const;

/** Chilean RUT variants. */
const RUT_CL_VARIANTS = [
  "12.345.678-5",
  "9.876.543-2",
  "23456789-K",
] as const;

/** EIN variants (US employer ID). */
const EIN_VARIANTS = [
  "47-2567754",
  "12-3456789",
  "01-0000001",
] as const;

// ─── Helpers ────────────────────────────────────────────────────────────────

async function selectCountries(page: Page, ids: string[]): Promise<void> {
  await page.getByTestId("country-modal-button").click();
  for (const id of ids) {
    await page.getByTestId(`country-toggle-${id}`).check();
  }
  await page.getByRole("button", { name: "Close countries" }).click();
}

async function fillAndAssertHidden(
  page: Page,
  input: string,
  hidden: readonly string[],
): Promise<void> {
  await page.getByTestId("source-textarea").fill(input);
  const output = page.getByTestId("masked-output");
  for (const val of hidden) {
    await expect(output).not.toContainText(val);
  }
  await expect(output).toContainText("[MASK-");
}

// ─── Tests ──────────────────────────────────────────────────────────────────

test.describe("high-entropy masking edge cases", () => {
  test.beforeEach(async ({ page }) => {
    await page.route("**/api/mask-safety/validate", async route => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ isSafe: true, findings: [] }),
      });
    });
    await page.goto("/");
  });

  // ── PT-BR identifier variations ────────────────────────────────────────
  test.describe("informal language patterns (PT-BR)", () => {
    test("masks CPF variations in informal Brazilian text", async ({
      page,
    }) => {
      await selectCountries(page, ["br"]);
      const lines = CPF_VARIANTS.map((v, i) => `CPF #${i + 1}: ${v}`);
      await fillAndAssertHidden(page, lines.join("\n"), CPF_VARIANTS);
    });

    test("masks CNPJ variations with label", async ({ page }) => {
      await selectCountries(page, ["br"]);
      const lines = CNPJ_VARIANTS.map(v => `CNPJ: ${v}`);
      await fillAndAssertHidden(page, lines.join("\n"), CNPJ_VARIANTS);
    });

    test("masks phone numbers with many BR format variations", async ({
      page,
    }) => {
      await selectCountries(page, ["br"]);
      const lines = PHONE_BR_VARIANTS.map(
        (v, i) => `Contato ${i + 1}: ${v}`,
      );
      await page.getByTestId("source-textarea").fill(lines.join("\n"));
      const output = page.getByTestId("masked-output");
      // Assert the core digit sequences are masked
      for (const phone of PHONE_BR_VARIANTS) {
        // Extract the last 8+ local digits to check (handles prefix removal)
        const digits = phone.replace(/\D/g, "").slice(-8);
        await expect(output).not.toContainText(digits);
      }
    });

    test("masks RG and CEP labels with variations", async ({ page }) => {
      await selectCountries(page, ["br"]);
      await fillAndAssertHidden(
        page,
        [
          "RG: 12.345.678-9",
          "RG: 98.765.432-X",
          "Identidade: 123456789",
          "CEP: 01310-100",
          "Código postal: 80010010",
          "CEP: 05407-002",
        ].join("\n"),
        [
          "12.345.678-9",
          "98.765.432-X",
          "123456789",
          "01310-100",
          "80010010",
          "05407-002",
        ],
      );
    });
  });

  // ── EN-US identifier variations ────────────────────────────────────────
  test.describe("informal language patterns (EN-US)", () => {
    test("masks SSN variations in US context", async ({ page }) => {
      await selectCountries(page, ["us"]);
      const lines = SSN_VARIANTS.map(v => `SSN: ${v}`);
      lines.push("Email: john@example.com");
      await fillAndAssertHidden(page, lines.join("\n"), [
        ...SSN_VARIANTS,
        "john@example.com",
      ]);
    });

    test("masks credit card number variations", async ({ page }) => {
      const lines = CREDIT_CARD_VARIANTS.map(
        (v, i) => `Card #${i + 1}: ${v}`,
      );
      await fillAndAssertHidden(page, lines.join("\n"), CREDIT_CARD_VARIANTS);
    });

    test("masks US phone format variations", async ({ page }) => {
      await selectCountries(page, ["us"]);
      const lines = PHONE_US_VARIANTS.map(
        (v, i) => `Phone ${i + 1}: ${v}`,
      );
      await page.getByTestId("source-textarea").fill(lines.join("\n"));
      const output = page.getByTestId("masked-output");
      for (const phone of PHONE_US_VARIANTS) {
        const digits = phone.replace(/\D/g, "").slice(-7);
        await expect(output).not.toContainText(digits);
      }
    });

    test("masks EIN variations globally", async ({ page }) => {
      const lines = EIN_VARIANTS.map(v => `EIN: ${v}`);
      await fillAndAssertHidden(page, lines.join("\n"), EIN_VARIANTS);
    });
  });

  // ── ES / LatAm locale variations ───────────────────────────────────────
  test.describe("Spanish-locale identifier variations", () => {
    test("masks DNI del Responsable and NIE in CL/MX scopes", async ({
      page,
    }) => {
      await selectCountries(page, ["cl", "mx"]);
      await fillAndAssertHidden(
        page,
        [
          "DNI del Responsable: 45678901",
          "DNI del responsable: 12345678",
          "NIE: X1234567L",
          "NIE: Y0987654P",
        ].join("\n"),
        ["45678901", "12345678", "X1234567L", "Y0987654P"],
      );
    });

    test("masks CUIT variations in Argentine scope", async ({ page }) => {
      await selectCountries(page, ["ar"]);
      const lines = CUIT_VARIANTS.map(v => `CUIT: ${v}`);
      await fillAndAssertHidden(page, lines.join("\n"), CUIT_VARIANTS);
    });

    test("masks Chilean RUT variations", async ({ page }) => {
      await selectCountries(page, ["cl"]);
      const lines = RUT_CL_VARIANTS.map(v => `RUT: ${v}`);
      await fillAndAssertHidden(page, lines.join("\n"), RUT_CL_VARIANTS);
    });
  });

  // ── Malicious code patterns ────────────────────────────────────────────
  test.describe("malicious code patterns", () => {
    test("masks emails in XSS, SQL injection, and code snippets", async ({
      page,
    }) => {
      await fillAndAssertHidden(
        page,
        [
          '<script>alert("hacker@evil.com")</script>',
          "SELECT * FROM users WHERE email='admin@site.com' OR '1'='1'",
          'const mail = "user@internal.co";',
        ].join("\n"),
        ["hacker@evil.com", "admin@site.com", "user@internal.co"],
      );
    });

    test("masks API key variations in code snippets", async ({ page }) => {
      const lines = API_KEY_VARIANTS.map(
        v => `const apiKey = "${v}";`,
      );
      await fillAndAssertHidden(page, lines.join("\n"), API_KEY_VARIANTS);
    });

    test("masks JWT token in XML payload", async ({ page }) => {
      const jwt =
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U";
      await page.getByTestId("source-textarea").fill(`<token>${jwt}</token>`);

      const output = page.getByTestId("masked-output");
      await expect(output).not.toContainText(jwt);
    });

    test("masks AWS keys in environment export", async ({ page }) => {
      await fillAndAssertHidden(
        page,
        [
          "export AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE",
          "export AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG+bPxRfiCYEXAMPLEKEY",
        ].join("\n"),
        ["AKIAIOSFODNN7EXAMPLE", "wJalrXUtnFEMI"],
      );
    });
  });

  // ── Multi-line / config patterns ───────────────────────────────────────
  test.describe("multi-line and config patterns", () => {
    test("masks credentials in config block", async ({ page }) => {
      await fillAndAssertHidden(
        page,
        [
          "[database]",
          "password = MySecretPassword123!",
          "",
          "[api]",
          "token = api_key_12345abcde",
        ].join("\n"),
        ["MySecretPassword123!", "api_key_12345abcde"],
      );
    });

    test("masks credit card and email in CSV row", async ({ page }) => {
      await fillAndAssertHidden(
        page,
        "customer@shop.com,4111111111111111,2026-12-01",
        ["4111111111111111", "customer@shop.com"],
      );
    });

    test("masks multiple email variations in text", async ({ page }) => {
      const subset = EMAIL_VARIANTS.slice(0, 6);
      const text = `Recipients: ${subset.join(", ")}`;
      await fillAndAssertHidden(page, text, subset);
    });
  });

  // ── Unicode and special characters ─────────────────────────────────────
  test.describe("unicode and special characters", () => {
    test("masks email with standard domain", async ({ page }) => {
      await page
        .getByTestId("source-textarea")
        .fill("Email: usuario@empresa.com.br");

      const output = page.getByTestId("masked-output");
      await expect(output).not.toContainText("usuario@empresa.com.br");
    });

    test("masks name with accented label", async ({ page }) => {
      await selectCountries(page, ["br"]);

      await page
        .getByTestId("source-textarea")
        .fill("Nome Completo: José María García");

      const output = page.getByTestId("masked-output");
      await expect(output).not.toContainText("José María García");
    });
  });

  // ── False positive avoidance ───────────────────────────────────────────
  test.describe("false positive avoidance", () => {
    test("does NOT mask hex color codes", async ({ page }) => {
      await page.getByTestId("source-textarea").fill("color: #FF5733");

      const output = page.getByTestId("masked-output");
      await expect(output).toContainText("#FF5733");
    });

    test("does NOT mask currency amounts", async ({ page }) => {
      await page.getByTestId("source-textarea").fill("Total: R$ 1.234,56");

      const output = page.getByTestId("masked-output");
      await expect(output).toContainText("1.234,56");
    });

    test("does NOT mask short postal codes as SSN", async ({ page }) => {
      await page.getByTestId("source-textarea").fill("ZIP: 12345");

      const output = page.getByTestId("masked-output");
      await expect(output).toContainText("12345");
    });

    test("does NOT mask alphanumeric protocol numbers", async ({ page }) => {
      await page.getByTestId("source-textarea").fill("Protocolo: ABC-123456");

      const output = page.getByTestId("masked-output");
      await expect(output).toContainText("ABC-123456");
    });
  });

  // ── Multi-country scenarios ────────────────────────────────────────────
  test.describe("multi-country scenarios", () => {
    test("masks BR and US identifiers together", async ({ page }) => {
      await selectCountries(page, ["br", "us"]);
      await fillAndAssertHidden(
        page,
        [
          "CPF: 529.982.247-25",
          "SSN: 123-45-6789",
          "Email: dual@country.com",
        ].join("\n"),
        ["529.982.247-25", "123-45-6789", "dual@country.com"],
      );
    });

    test("masks LatAm identifiers across CL+AR+PE", async ({ page }) => {
      await selectCountries(page, ["cl", "ar", "pe"]);
      await fillAndAssertHidden(
        page,
        [
          "RUT: 12.345.678-5",
          "CUIT: 20-12345678-6",
          "DNI: 87654321",
          "RUC: 20123456786",
        ].join("\n"),
        ["12.345.678-5", "20-12345678-6", "87654321", "20123456786"],
      );
    });

    test("with global-only mode, country rules are not applied", async ({
      page,
    }) => {
      await selectCountries(page, ["br"]);

      await page.getByTestId("settings-button").click();
      await page.getByTestId("global-only-toggle").check();
      await page.getByRole("button", { name: "Close settings" }).click();

      await fillAndAssertHidden(
        page,
        "CPF: 529.982.247-25\nEmail: test@example.com",
        ["529.982.247-25", "test@example.com"],
      );
    });
  });
});
