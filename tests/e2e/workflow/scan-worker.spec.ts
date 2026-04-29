import { expect, test } from "@playwright/test";

const WORKER_TRIGGER_CHARS = 270_000;

test.describe("scan worker regression", () => {
  test.beforeEach(async ({ page }) => {
    await page.route("**/api/mask-safety/validate", async route => {
      const body = route.request().postDataJSON() as {
        candidates?: Array<{ candidateValue: string; ruleId: string }>;
      };

      await route.fulfill({
        body: JSON.stringify({
          results: (body.candidates ?? []).map(candidate => ({
            candidateValue: candidate.candidateValue,
            decision: "safe",
            isCompromising: false,
            isSupported: true,
            message: "Regression stub: candidate is safe.",
            ruleId: candidate.ruleId,
          })),
        }),
        contentType: "application/json",
        status: 200,
      });
    });
  });

  test("loads the scan worker for large local inputs and still masks secrets", async ({
    page,
  }) => {
    test.slow();

    const workerResponse = page.waitForResponse(response => {
      const url = response.url();
      return (
        response.status() === 200 &&
        (url.includes("scan.worker") ||
          url.includes("scan-worker") ||
          /\/worker-[^/]+\.js(?:$|\?)/.test(url))
      );
    });

    await page.goto("/");

    const largePrompt = [
      "Large local scan regression.",
      "padding ".repeat(WORKER_TRIGGER_CHARS / 8),
      "Email: worker-regression@example.com",
    ].join("\n");

    await page.getByTestId("source-textarea").evaluate((element, value) => {
      const textarea = element as HTMLTextAreaElement;
      textarea.value = value;
      textarea.dispatchEvent(new Event("input", { bubbles: true }));
    }, largePrompt);

    await workerResponse;

    const output = page.getByTestId("masked-output");
    await expect(output).not.toContainText("worker-regression@example.com", {
      timeout: 30_000,
    });
    await expect(page.locator(".output__overlay")).not.toBeVisible({
      timeout: 30_000,
    });
  });
});
