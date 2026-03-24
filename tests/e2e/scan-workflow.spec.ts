import { expect, test } from "@playwright/test";

test.describe("translator masking workflow", () => {
  test.beforeEach(async ({ page }) => {
    await page.route("**/api/mask-safety/validate", async route => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ isSafe: true, findings: [] }),
      });
    });
  });

  test("masks raw prompt content live and copies only the protected output", async ({
    context,
    page,
  }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.goto("/");

    await page
      .getByTestId("source-textarea")
      .fill(
        [
          "Contato: maria@example.com",
          "Token: sk-proj-ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890",
          "CPF: 529.982.247-25",
        ].join("\n"),
      );

    await expect(page.locator(".output__overlay")).toBeVisible();

    const output = page.getByTestId("masked-output");
    await expect(output).not.toContainText("maria@example.com");
    await expect(output).not.toContainText(
      "sk-proj-ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890",
    );

    await expect(page.locator(".output__overlay")).not.toBeVisible();

    await page.getByTestId("copy-button").click();
    await expect(page.getByText("Protected prompt copied")).toBeVisible();
  });

  test("can change country scope and switch to global-only mode from settings", async ({
    page,
  }) => {
    await page.goto("/");

    await page.getByTestId("country-modal-button").click();
    await page.getByTestId("country-toggle-cl").check();
    await page.getByRole("button", { name: "Close countries" }).click();

    await page
      .getByTestId("source-textarea")
      .fill("RUT: 12.345.678-5\nEmail: maria@example.com");

    const output = page.getByTestId("masked-output");
    await expect(output).not.toContainText("12.345.678-5");
    await expect(output).not.toContainText("maria@example.com");

    await page.getByTestId("settings-button").click();
    await page.getByTestId("global-only-toggle").check();
    await page.getByRole("button", { name: "Close settings" }).click();

    await expect(output).not.toContainText("12.345.678-5");
    await expect(output).not.toContainText("maria@example.com");
    await expect(page.getByText("Global-only mode enabled")).toBeVisible();
  });

  test("lets the user regenerate or disable a single mask from the control form", async ({
    page,
  }) => {
    await page.goto("/");

    await page.getByTestId("source-textarea").fill("Email: maria@example.com");

    const output = page.getByTestId("masked-output");
    await expect(output).not.toContainText("maria@example.com");

    const firstOutput = await output.textContent();

    await page.getByTestId("regenerate-email-address").click();
    await expect(output).not.toHaveText(firstOutput ?? "");

    await page.getByTestId("toggle-email-address").uncheck();
    await expect(output).toContainText("maria@example.com");
  });

  test("shows country warning help and keeps safe text unchanged", async ({
    page,
  }) => {
    const safeText =
      "Summarize this release note for the internal engineering newsletter.";

    await page.goto("/");
    await page.getByTestId("country-modal-button").click();
    await page.getByTestId("country-toggle-es").check();
    await page.getByRole("button", { name: "Close countries" }).click();

    await page.getByTestId("source-textarea").fill(safeText);

    await expect(page.getByTestId("masked-output")).toContainText(safeText);

    await page.locator(".hero .hero__notice-summary").click();
    await page.locator(".hero .help-trigger").click();
    await expect(page.getByRole("dialog")).toContainText(
      "Everything in this screen runs in the browser.",
    );
    await page.getByRole("button", { name: "Close help" }).click();
    await expect(page.getByRole("dialog")).toHaveCount(0);
  });
});
