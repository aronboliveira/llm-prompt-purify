/**
 * Roleplay E2E — Dev (Backend Developer)
 *
 * Browser-based tests simulating a backend developer's perspective:
 * API rate-limit probing through the UI, secret detection coverage,
 * input validation boundary testing, and response header inspection.
 */
import { expect, test, type Page } from "@playwright/test";

const BACKEND_URL = "http://127.0.0.1:5185";

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
/*  Tests — Secret Detection in UI                                    */
/* ------------------------------------------------------------------ */

test.describe("Dev — Secret & Credential Detection", () => {
  test.beforeEach(async ({ page }) => {
    await mockApi(page);
    await page.goto("/");
    await expect(page.getByTestId("source-textarea")).toBeVisible({
      timeout: 15_000,
    });
  });

  const SECRET_CASES = [
    {
      label: "OpenAI API key",
      input: "OPENAI_API_KEY=sk-live-testkey1234567890abcdef",
      hidden: ["sk-live-testkey1234567890abcdef"],
    },
    {
      label: "AWS access key",
      input: "AWS_ACCESS_KEY_ID=AKIAI44QH8DHBEXAMPLE",
      hidden: ["AKIAI44QH8DHBEXAMPLE"],
    },
    {
      label: "GitHub PAT",
      input: "token: ghp_ABCDEFghijklmnopqrstuvwxyz012345",
      hidden: ["ghp_ABCDEFghijklmnopqrstuvwxyz012345"],
    },
    {
      label: "JWT token",
      input:
        "Auth: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U",
      hidden: [
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U",
      ],
    },
    {
      label: ".env multi-line secrets",
      input: [
        "OPENAI_API_KEY=sk-live-AAABBBCCC111222333444",
        "AWS_ACCESS_KEY_ID=AKIAI44QH8DHBEXAMPLE",
        "DATABASE_URL=postgres://user:pass@localhost:5432/mydb",
      ].join("\n"),
      hidden: ["sk-live-AAABBBCCC111222333444", "AKIAI44QH8DHBEXAMPLE"],
    },
  ] as const;

  for (const { label, input, hidden } of SECRET_CASES) {
    test(`masks ${label}`, async ({ page }) => {
      const masked = await fillAndGetMasked(page, input);
      for (const secret of hidden) {
        expect(masked).not.toContain(secret);
      }
    });
  }
});

/* ------------------------------------------------------------------ */
/*  Tests — API Response Security                                     */
/* ------------------------------------------------------------------ */

test.describe("Dev — API Response Security Headers", () => {
  test("health endpoint returns proper security headers", async ({
    request,
  }) => {
    const response = await request.get(`${BACKEND_URL}/api/health`);
    const headers = response.headers();

    // Core security headers
    expect(headers["x-content-type-options"]).toBe("nosniff");
    expect(headers["x-frame-options"]).toBe("DENY");
    expect(headers["referrer-policy"]).toContain("strict-origin");
  });

  test("server header does not leak framework info", async ({ request }) => {
    const response = await request.get(`${BACKEND_URL}/api/health`);
    const server = response.headers()["server"] ?? "";
    expect(server).not.toMatch(/Kestrel|ASP\.NET|Microsoft/i);
  });

  test("CORS is not wildcard on API endpoints", async ({ request }) => {
    const response = await request.fetch(`${BACKEND_URL}/api/health`, {
      headers: { Origin: "https://evil.com" },
    });
    const allowOrigin = response.headers()["access-control-allow-origin"] ?? "";
    expect(allowOrigin).not.toBe("*");
    expect(allowOrigin).not.toContain("evil.com");
  });
});

/* ------------------------------------------------------------------ */
/*  Tests — Input Validation Boundaries                               */
/* ------------------------------------------------------------------ */

test.describe("Dev — Input Validation through UI", () => {
  test.beforeEach(async ({ page }) => {
    await mockApi(page);
    await page.goto("/");
    await expect(page.getByTestId("source-textarea")).toBeVisible({
      timeout: 15_000,
    });
  });

  test("PII embedded in JSON structure is still detected", async ({ page }) => {
    const jsonInput = JSON.stringify({
      user: "admin",
      email: "leaked@internal.corp",
      ssn: "456-78-9012",
    });
    const masked = await fillAndGetMasked(page, jsonInput);
    expect(masked).not.toContain("leaked@internal.corp");
    expect(masked).not.toContain("456-78-9012");
  });

  test("PII in SQL INSERT statement is masked", async ({ page }) => {
    const masked = await fillAndGetMasked(
      page,
      "INSERT INTO users (name, ssn, email) VALUES ('Bob', '321-65-0987', 'exfil@target.com');",
    );
    expect(masked).not.toContain("321-65-0987");
    expect(masked).not.toContain("exfil@target.com");
  });

  test("PII in CSV row is masked", async ({ page }) => {
    const masked = await fillAndGetMasked(
      page,
      "Alice,Smith,alice@csv.test,456-78-0123,1990-01-15",
    );
    expect(masked).not.toContain("alice@csv.test");
    expect(masked).not.toContain("456-78-0123");
  });
});
