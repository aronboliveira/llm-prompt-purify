import { expect, test } from "@playwright/test";

test.describe("scan workflow", () => {
  test("shows a scan spinner, protects output, and lets the user relax a group after review", async ({
    context,
    page,
  }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.goto("/");
    await page.getByTestId("country-picker").selectOption("br");

    await page.getByTestId("source-textarea").fill(
      [
        "Contato: maria@example.com",
        "Token: sk-proj-ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890",
        "CPF: 529.982.247-25",
      ].join("\n")
    );

    await page.getByTestId("scan-button").click();

    const output = page.getByTestId("masked-output");
    await expect(output).toContainText("Scanning the text locally for risky patterns...");
    await expect(output).not.toContainText("maria@example.com");
    await expect(output).not.toContainText("sk-proj-ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890");
    await expect(output).not.toContainText("529.982.247-25");

    await expect(page.getByTestId("toggle-openai-style-key")).toBeDisabled();
    await expect(page.getByTestId("group-lock-credential")).toBeChecked();

    await page.getByTestId("group-toggle-identifier").uncheck();

    await expect(output).toContainText("529.982.247-25");
    await expect(output).not.toContainText("sk-proj-ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890");

    await page.getByTestId("copy-button").click();
    await expect(page.getByText("Protected prompt copied")).toBeVisible();
  });

  test("can rescope the scan by country and switch to global-only mode", async ({ page }) => {
    await page.goto("/");
    await page.getByTestId("country-picker").selectOption("cl");

    await page
      .getByTestId("source-textarea")
      .fill("RUT: 12.345.678-5\nEmail: maria@example.com");
    await page.getByTestId("scan-button").click();

    const output = page.getByTestId("masked-output");
    await expect(output).not.toContainText("12.345.678-5");
    await expect(output).not.toContainText("maria@example.com");

    await page.getByTestId("global-only-toggle").check();

    await expect(output).toContainText("12.345.678-5");
    await expect(output).not.toContainText("maria@example.com");
    await expect(page.getByText("Global-only scan enabled")).toBeVisible();
  });

  test("can regenerate a single mask and open help content", async ({ page }) => {
    await page.goto("/");
    await page.getByTestId("country-picker").selectOption("br");

    await page.getByTestId("source-textarea").fill("Email: maria@example.com");
    await page.getByTestId("scan-button").click();

    const output = page.getByTestId("masked-output"),
      firstOutput = await output.textContent();

    await page.getByTestId("regenerate-email-address").click();

    await expect(output).not.toHaveText(firstOutput ?? "");

    await page.locator(".hero .help-trigger").click();
    await expect(page.getByRole("dialog")).toContainText("Everything in this screen runs in the browser.");
    await page.getByRole("button", { name: "Close help" }).click();
    await expect(page.getByRole("dialog")).toHaveCount(0);
  });

  test("keeps safe text unchanged when no supported match is found", async ({ page }) => {
    const safeText = "Summarize this release note for the internal engineering newsletter.";

    await page.goto("/");
    await page.getByTestId("country-picker").selectOption("us");
    await page.getByTestId("source-textarea").fill(safeText);
    await page.getByTestId("scan-button").click();

    await expect(page.getByTestId("masked-output")).toContainText(safeText);
    await expect(
      page.locator(".status-pill", { hasText: "No supported sensitive patterns were found" })
    ).toBeVisible();
  });
});
