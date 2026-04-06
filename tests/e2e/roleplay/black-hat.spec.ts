/**
 * Roleplay E2E — Black Hat (Offensive / Red Team)
 *
 * Browser-based tests simulating an advanced adversary:
 * payload obfuscation evasion, encoding bypass attempts,
 * PII exfiltration via edge-case formatting, negative
 * testing for false positives, and multi-vector chained attacks.
 *
 * ⚠ FOR DEFENSIVE TESTING ONLY — git-ignored via ** /black-hat/
 */
import { expect, test, type Page } from "@playwright/test";

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

async function mockApi(page: Page): Promise<void> {
  await page.route("**/api/mask-safety/validate", async route => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ isSafe: true, findings: [] }),
    });
  });
}

async function fillAndGetMasked(page: Page, input: string): Promise<string> {
  await page.getByTestId("source-textarea").fill(input);
  const output = page.getByTestId("masked-output");
  await expect(output).toBeVisible({ timeout: 10_000 });
  await page.waitForTimeout(1500);
  return (await output.textContent()) ?? "";
}

/* ------------------------------------------------------------------ */
/*  Tests — PII Format Evasion                                        */
/* ------------------------------------------------------------------ */

test.describe("Black Hat — PII Format Evasion", () => {
  test.beforeEach(async ({ page }) => {
    await mockApi(page);
    await page.goto("/");
    await expect(page.getByTestId("source-textarea")).toBeVisible({
      timeout: 15_000,
    });
  });

  test("masks SSN with extra whitespace padding", async ({ page }) => {
    const masked = await fillAndGetMasked(
      page,
      "SSN:   123-45-6789   (padded)",
    );
    expect(masked).not.toContain("123-45-6789");
  });

  test("masks email inside angle brackets with noise", async ({ page }) => {
    const masked = await fillAndGetMasked(
      page,
      ">>>>NOISE<<<< email: victim@evil.com ####END####",
    );
    expect(masked).not.toContain("victim@evil.com");
  });

  test("masks credential after long filler text", async ({ page }) => {
    const filler =
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. " +
      "Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. ";
    const masked = await fillAndGetMasked(
      page,
      `${filler}sk-proj-AAAAAAAAAAAABBBBBBBBBBBB`,
    );
    expect(masked).not.toContain("sk-proj-AAAAAAAAAAAABBBBBBBBBBBB");
  });

  test("masks JWT token inside HTML comments", async ({ page }) => {
    const masked = await fillAndGetMasked(
      page,
      "<!-- eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0In0.SflKxwRJSMeKKF2QT4fwpM -->",
    );
    expect(masked).not.toContain(
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0In0.SflKxwRJSMeKKF2QT4fwpM",
    );
  });

  test("masks multiple SSNs crammed together with slash separator", async ({
    page,
  }) => {
    const masked = await fillAndGetMasked(page, "SSN:111-22-3333/444-55-6666");
    expect(masked).not.toContain("111-22-3333");
    expect(masked).not.toContain("444-55-6666");
  });

  test("masks PII buried in JSON-like structure", async ({ page }) => {
    const masked = await fillAndGetMasked(
      page,
      '{"user":"admin","email":"leaked@internal.corp","role":"root"}',
    );
    expect(masked).not.toContain("leaked@internal.corp");
  });

  test("masks AWS key hidden among base64-like blobs", async ({ page }) => {
    const masked = await fillAndGetMasked(
      page,
      "config=dXNlcjpwYXNz key: AKIAIOSFODNN7EXAMPLE secret=aGVsbG8gd29ybGQ=",
    );
    expect(masked).not.toContain("AKIAIOSFODNN7EXAMPLE");
  });
});

/* ------------------------------------------------------------------ */
/*  Tests — Negative Cases (False Positive Avoidance)                 */
/* ------------------------------------------------------------------ */

test.describe("Black Hat — False Positive Avoidance", () => {
  test.beforeEach(async ({ page }) => {
    await mockApi(page);
    await page.goto("/");
    await expect(page.getByTestId("source-textarea")).toBeVisible({
      timeout: 15_000,
    });
  });

  test("does not mask hex strings that resemble PII", async ({ page }) => {
    const masked = await fillAndGetMasked(
      page,
      "commit: a4f8c3b2e1 hash: 0xDEADBEEF checksum: 5a3b7c9d",
    );
    expect(masked).toContain("a4f8c3b2e1");
    expect(masked).toContain("0xDEADBEEF");
    expect(masked).toContain("5a3b7c9d");
  });

  test("does not mask code variable names that look like PII labels", async ({
    page,
  }) => {
    const masked = await fillAndGetMasked(
      page,
      "const addressBuffer = new Uint8Array(32); const phoneHandler = () => null;",
    );
    expect(masked).toContain("new Uint8Array(32)");
    expect(masked).toContain("() => null");
  });
});

/* ------------------------------------------------------------------ */
/*  Tests — XSS Obfuscation Evasion                                   */
/* ------------------------------------------------------------------ */

test.describe("Black Hat — Obfuscated XSS Attacks", () => {
  test.beforeEach(async ({ page }) => {
    await mockApi(page);
    await page.goto("/");
    await expect(page.getByTestId("source-textarea")).toBeVisible({
      timeout: 15_000,
    });
  });

  const OBFUSCATED_XSS = [
    {
      label: "HTML entity encoded",
      payload: "&#60;script&#62;alert(1)&#60;/script&#62;",
    },
    { label: "mixed case", payload: "<ScRiPt>alert(1)</ScRiPt>" },
    {
      label: "event handler with spaces",
      payload: '<img src=x onerror = "alert(1)" >',
    },
    {
      label: "SVG with onload",
      payload: "<svg/onload=alert(document.cookie)>",
    },
    {
      label: "data URI injection",
      payload: '<a href="data:text/html,<script>alert(1)</script>">click</a>',
    },
  ];

  for (const { label, payload } of OBFUSCATED_XSS) {
    test(`no dialog triggered by ${label} payload`, async ({ page }) => {
      const alertTriggered = { value: false };
      page.on("dialog", async dialog => {
        alertTriggered.value = true;
        await dialog.dismiss();
      });

      await page.getByTestId("source-textarea").fill(payload);
      await page.waitForTimeout(3000);
      expect(alertTriggered.value).toBe(false);
    });
  }
});
