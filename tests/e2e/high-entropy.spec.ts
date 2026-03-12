import { expect, test } from "@playwright/test";

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

  test.describe("informal language patterns (PT-BR)", () => {
    test("masks CPF in informal Brazilian text", async ({ page }) => {
      await page.getByTestId("country-modal-button").click();
      await page.getByTestId("country-toggle-br").check();
      await page.getByRole("button", { name: "Close countries" }).click();

      await page
        .getByTestId("source-textarea")
        .fill("CPF: 529.982.247-25\nEmail: contato@empresa.com.br");

      const output = page.getByTestId("masked-output");
      await expect(output).not.toContainText("529.982.247-25");
      await expect(output).not.toContainText("contato@empresa.com.br");
      await expect(output).toContainText("[MASK-");
    });

    test("masks phone numbers with various BR formats", async ({ page }) => {
      await page.getByTestId("country-modal-button").click();
      await page.getByTestId("country-toggle-br").check();
      await page.getByRole("button", { name: "Close countries" }).click();

      await page
        .getByTestId("source-textarea")
        .fill(
          [
            "Telefone: +55 11 98765-4321",
            "Celular: (21) 99999-8888",
            "Fixo: 1134567890",
          ].join("\n"),
        );

      const output = page.getByTestId("masked-output");
      await expect(output).not.toContainText("98765-4321");
      await expect(output).not.toContainText("99999-8888");
    });

    test("masks CNPJ with label", async ({ page }) => {
      await page.getByTestId("country-modal-button").click();
      await page.getByTestId("country-toggle-br").check();
      await page.getByRole("button", { name: "Close countries" }).click();

      await page
        .getByTestId("source-textarea")
        .fill("CNPJ: 11.222.333/0001-81\nEmpresa XYZ");

      const output = page.getByTestId("masked-output");
      await expect(output).not.toContainText("11.222.333/0001-81");
      await expect(output).toContainText("[MASK-");
    });
  });

  test.describe("informal language patterns (EN-US)", () => {
    test("masks US SSN in various contexts", async ({ page }) => {
      await page.getByTestId("country-modal-button").click();
      await page.getByTestId("country-toggle-us").check();
      await page.getByRole("button", { name: "Close countries" }).click();

      await page
        .getByTestId("source-textarea")
        .fill("SSN: 123-45-6789\nEmail: john@example.com");

      const output = page.getByTestId("masked-output");
      await expect(output).not.toContainText("123-45-6789");
      await expect(output).not.toContainText("john@example.com");
    });

    test("masks credit card numbers", async ({ page }) => {
      await page
        .getByTestId("source-textarea")
        .fill(
          [
            "Card: 4111111111111111",
            "Email: payment@shop.com",
          ].join("\n"),
        );

      const output = page.getByTestId("masked-output");
      await expect(output).not.toContainText("4111111111111111");
      await expect(output).not.toContainText("payment@shop.com");
    });
  });

  test.describe("malicious code patterns", () => {
    test("masks email embedded in XSS script tag", async ({ page }) => {
      await page
        .getByTestId("source-textarea")
        .fill('<script>alert("hacker@evil.com")</script>');

      const output = page.getByTestId("masked-output");
      await expect(output).not.toContainText("hacker@evil.com");
      await expect(output).toContainText("[MASK-");
    });

    test("masks credentials in SQL injection attempt", async ({ page }) => {
      await page
        .getByTestId("source-textarea")
        .fill(
          "SELECT * FROM users WHERE email='admin@site.com' OR '1'='1'",
        );

      const output = page.getByTestId("masked-output");
      await expect(output).not.toContainText("admin@site.com");
    });

    test("masks API key in code snippet", async ({ page }) => {
      await page
        .getByTestId("source-textarea")
        .fill('const apiKey = "sk-live-ABCDEFGHIJKLMNOPQRSTUVWXYz123456";');

      const output = page.getByTestId("masked-output");
      await expect(output).not.toContainText(
        "sk-live-ABCDEFGHIJKLMNOPQRSTUVWXYz123456",
      );
    });

    test("masks JWT token in XML payload", async ({ page }) => {
      const jwt =
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U";
      await page.getByTestId("source-textarea").fill(`<token>${jwt}</token>`);

      const output = page.getByTestId("masked-output");
      await expect(output).not.toContainText(jwt);
    });

    test("masks AWS keys in environment export", async ({ page }) => {
      await page
        .getByTestId("source-textarea")
        .fill(
          [
            "export AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE",
            "export AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG+bPxRfiCYEXAMPLEKEY",
          ].join("\n"),
        );

      const output = page.getByTestId("masked-output");
      await expect(output).not.toContainText("AKIAIOSFODNN7EXAMPLE");
      await expect(output).not.toContainText("wJalrXUtnFEMI");
    });
  });

  test.describe("multi-line and config patterns", () => {
    test("masks credentials in config block", async ({ page }) => {
      await page
        .getByTestId("source-textarea")
        .fill(
          [
            "[database]",
            "password = MySecretPassword123!",
            "",
            "[api]",
            "token = api_key_12345abcde",
          ].join("\n"),
        );

      const output = page.getByTestId("masked-output");
      await expect(output).not.toContainText("MySecretPassword123!");
      await expect(output).not.toContainText("api_key_12345abcde");
    });

    test("masks credit card in CSV row", async ({ page }) => {
      await page
        .getByTestId("source-textarea")
        .fill("customer@shop.com,4111111111111111,2026-12-01");

      const output = page.getByTestId("masked-output");
      await expect(output).not.toContainText("4111111111111111");
      await expect(output).not.toContainText("customer@shop.com");
    });

    test("masks multiple emails in text", async ({ page }) => {
      await page
        .getByTestId("source-textarea")
        .fill(
          "Recipients: alice@example.com, bob@company.org, charlie@test.net",
        );

      const output = page.getByTestId("masked-output");
      await expect(output).not.toContainText("alice@example.com");
      await expect(output).not.toContainText("bob@company.org");
      await expect(output).not.toContainText("charlie@test.net");
    });
  });

  test.describe("unicode and special characters", () => {
    test("masks email with standard domain", async ({ page }) => {
      await page
        .getByTestId("source-textarea")
        .fill("Email: usuario@empresa.com.br");

      const output = page.getByTestId("masked-output");
      await expect(output).not.toContainText("usuario@empresa.com.br");
    });

    test("masks name with accented label", async ({ page }) => {
      await page.getByTestId("country-modal-button").click();
      await page.getByTestId("country-toggle-br").check();
      await page.getByRole("button", { name: "Close countries" }).click();

      await page
        .getByTestId("source-textarea")
        .fill("Nome Completo: José María García");

      const output = page.getByTestId("masked-output");
      await expect(output).not.toContainText("José María García");
    });
  });

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
      await page
        .getByTestId("source-textarea")
        .fill("Protocolo: ABC-123456");

      const output = page.getByTestId("masked-output");
      await expect(output).toContainText("ABC-123456");
    });
  });

  test.describe("multi-country scenarios", () => {
    test("masks BR and US identifiers together", async ({ page }) => {
      await page.getByTestId("country-modal-button").click();
      await page.getByTestId("country-toggle-br").check();
      await page.getByTestId("country-toggle-us").check();
      await page.getByRole("button", { name: "Close countries" }).click();

      await page
        .getByTestId("source-textarea")
        .fill(
          [
            "CPF: 529.982.247-25",
            "SSN: 123-45-6789",
            "Email: dual@country.com",
          ].join("\n"),
        );

      const output = page.getByTestId("masked-output");
      await expect(output).not.toContainText("529.982.247-25");
      await expect(output).not.toContainText("123-45-6789");
      await expect(output).not.toContainText("dual@country.com");
    });

    test("with global-only mode, country rules are not applied", async ({
      page,
    }) => {
      await page.getByTestId("country-modal-button").click();
      await page.getByTestId("country-toggle-br").check();
      await page.getByRole("button", { name: "Close countries" }).click();

      await page.getByTestId("settings-button").click();
      await page.getByTestId("global-only-toggle").check();
      await page.getByRole("button", { name: "Close settings" }).click();

      await page
        .getByTestId("source-textarea")
        .fill("CPF: 529.982.247-25\nEmail: test@example.com");

      const output = page.getByTestId("masked-output");
      await expect(output).toContainText("529.982.247-25");
      await expect(output).not.toContainText("test@example.com");
    });
  });
});
