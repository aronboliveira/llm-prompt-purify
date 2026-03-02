import { expect, test } from "@playwright/test";

test.describe("scan workflow", () => {
  test("applies masks by default and allows one mask to be disabled", async ({
    context,
    page,
  }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.goto("/");

    await page.getByTestId("source-textarea").fill(
      [
        "Contato: maria@example.com",
        "Token: sk-proj-ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890",
        "CPF: 529.982.247-25",
      ].join("\n")
    );

    await page.getByTestId("scan-button").click();

    const output = page.getByTestId("masked-output");
    await expect(output).not.toContainText("maria@example.com");
    await expect(output).not.toContainText("sk-proj-ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890");
    await expect(output).not.toContainText("529.982.247-25");

    await page.getByTestId("toggle-email-address").uncheck();

    await expect(output).toContainText("maria@example.com");
    await expect(output).not.toContainText("sk-proj-ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890");
    await expect(output).not.toContainText("529.982.247-25");

    await page.getByTestId("copy-button").click();
    await expect(page.getByText("Masked output copied.")).toBeVisible();
  });

  test("keeps safe text unchanged when no supported match is found", async ({ page }) => {
    const safeText = "Summarize this release note for the internal engineering newsletter.";

    await page.goto("/");
    await page.getByTestId("source-textarea").fill(safeText);
    await page.getByTestId("scan-button").click();

    await expect(page.getByTestId("masked-output")).toContainText(safeText);
    await expect(
      page.getByText(
        "No supported sensitive patterns were detected. The output matches your original text."
      )
    ).toBeVisible();
  });
});
