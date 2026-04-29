import { expect, test } from "@playwright/test";

const SOURCE_TEXTAREA = '[data-testid="source-textarea"]';
const MASKED_OUTPUT = '[data-testid="masked-output"]';

test.describe("scan worker regression", () => {
  test.beforeEach(async ({ page }) => {
    await page.route("**/api/mask-safety/validate", async route => {
      const body = route.request().postDataJSON() as {
        candidates?: readonly { candidateValue: string; ruleId: string }[];
      };

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          results: (body.candidates ?? []).map(candidate => ({
            candidateValue: candidate.candidateValue,
            decision: "safe",
            isCompromising: false,
            isSupported: true,
            message: "The candidate no longer passes validation.",
            ruleId: candidate.ruleId,
          })),
        }),
      });
    });
  });

  test("loads the scan worker for large prompts and still masks sensitive values", async ({
    page,
  }) => {
    await page.goto("/");

    const workerResponse = page.waitForResponse(
      response => /(?:scan-worker|scan\.worker|worker-).*\.js/.test(response.url()),
      { timeout: 20_000 },
    );

    const sensitiveEmail = "worker-regression@example.com",
      largePrompt = [
        "Summarize these internal notes without exposing contact data.",
        "safe filler block ".repeat(18_000),
        `Contact: ${sensitiveEmail}`,
      ].join("\n");

    await page.locator(SOURCE_TEXTAREA).evaluate((element, value) => {
      const textarea = element as HTMLTextAreaElement;
      textarea.value = value;
      textarea.dispatchEvent(new Event("input", { bubbles: true }));
    }, largePrompt);

    await expect(page.locator(MASKED_OUTPUT)).not.toContainText(
      sensitiveEmail,
      { timeout: 20_000 },
    );
    await expect(workerResponse).resolves.toBeTruthy();
  });
});
