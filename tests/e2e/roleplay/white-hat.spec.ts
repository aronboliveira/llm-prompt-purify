/**
 * Roleplay E2E — White Hat (Advanced Ethical Hacker)
 *
 * Browser-based tests simulating an experienced penetration tester:
 * XSS payload injection via the UI, CSP header validation,
 * credential detection in various encoding formats,
 * and DOM-based attack vector testing.
 */
import { expect, test, type Page } from "@playwright/test";

const BACKEND_URL = "http://127.0.0.1:5185";

/* ------------------------------------------------------------------ */
/*  Constants                                                         */
/* ------------------------------------------------------------------ */

const XSS_PAYLOADS = [
  '<script>alert("xss")</script>',
  "<img src=x onerror=alert(1)>",
  '"><svg onload=alert(document.cookie)>',
  "javascript:alert(1)",
  '<iframe src="javascript:alert(1)">',
  "{{constructor.constructor('return this')()}}",
  "${7*7}",
  '<a href="javascript:void(0)" onclick="alert(1)">click</a>',
  '<div style="background:url(javascript:alert(1))">',
  "';!--\"<XSS>=&{()}",
];

const DANGEROUS_PATTERNS = [
  /<script[\s>]/i,
  /on\w+\s*=/i,
  /javascript:/i,
  /\{\{.*constructor/i,
  /<iframe[\s>]/i,
  /<svg[\s>]/i,
];

const REQUIRED_CSP_DIRECTIVES = [
  "default-src",
  "script-src",
  "style-src",
  "img-src",
  "connect-src",
  "frame-ancestors",
];

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
/*  Tests — XSS Payload Injection via UI                              */
/* ------------------------------------------------------------------ */

test.describe("White Hat — XSS Payload Neutralization", () => {
  test.beforeEach(async ({ page }) => {
    await mockApi(page);
    await page.goto("/");
    await expect(page.getByTestId("source-textarea")).toBeVisible({
      timeout: 15_000,
    });
  });

  for (const payload of XSS_PAYLOADS) {
    test(`output neutralizes XSS: ${payload.slice(0, 40)}...`, async ({
      page,
    }) => {
      const alertTriggered = { value: false };
      page.on("dialog", async dialog => {
        alertTriggered.value = true;
        await dialog.dismiss();
      });
      await fillAndGetMasked(page, `Contato: test@example.com ${payload}`);
      await page.waitForTimeout(1000);
      // The app must not execute injected scripts in the DOM
      expect(alertTriggered.value).toBe(false);
    });
  }

  test("no script execution occurs after pasting XSS payload", async ({
    page,
  }) => {
    const alertTriggered = { value: false };
    page.on("dialog", async dialog => {
      alertTriggered.value = true;
      await dialog.dismiss();
    });

    await page
      .getByTestId("source-textarea")
      .fill('<script>alert("pwned")</script> Email: test@example.com');
    await page.waitForTimeout(3000);
    expect(alertTriggered.value).toBe(false);
  });
});

/* ------------------------------------------------------------------ */
/*  Tests — CSP & Security Headers                                    */
/* ------------------------------------------------------------------ */

test.describe("White Hat — CSP & Header Audit", () => {
  test("Content-Security-Policy header is present and well-formed", async ({
    request,
  }) => {
    const response = await request.get(`${BACKEND_URL}/api/health`);
    const csp = response.headers()["content-security-policy"] ?? "";
    expect(csp.length).toBeGreaterThan(0);

    // Must have default-src at minimum
    expect(csp).toContain("default-src");
  });

  test("CSP does not contain unsafe-inline for scripts", async ({
    request,
  }) => {
    const response = await request.get(`${BACKEND_URL}/api/health`);
    const csp = response.headers()["content-security-policy"] ?? "";
    // Extract script-src directive
    const scriptSrc = csp
      .split(";")
      .find((d: string) => d.trim().startsWith("script-src"));
    if (scriptSrc) {
      expect(scriptSrc).not.toContain("'unsafe-inline'");
    }
  });

  test("CSP does not contain wildcard source", async ({ request }) => {
    const response = await request.get(`${BACKEND_URL}/api/health`);
    const csp = response.headers()["content-security-policy"] ?? "";
    const directives = csp.split(";").map((d: string) => d.trim());
    for (const directive of directives) {
      // No directive should have a bare * as source
      const parts = directive.split(/\s+/);
      expect(parts.filter((p: string) => p === "*")).toHaveLength(0);
    }
  });

  test("X-Frame-Options prevents clickjacking", async ({ request }) => {
    const response = await request.get(`${BACKEND_URL}/api/health`);
    const xfo = response.headers()["x-frame-options"] ?? "";
    expect(xfo.toUpperCase()).toMatch(/^(DENY|SAMEORIGIN)$/);
  });

  test("HSTS is enabled with adequate max-age", async ({ request }) => {
    const response = await request.get(`${BACKEND_URL}/api/health`);
    const hsts = response.headers()["strict-transport-security"] ?? "";
    if (hsts.length > 0) {
      const maxAgeMatch = hsts.match(/max-age=(\d+)/);
      expect(maxAgeMatch).not.toBeNull();
      if (maxAgeMatch) {
        expect(Number(maxAgeMatch[1])).toBeGreaterThanOrEqual(31536000);
      }
    }
  });
});

/* ------------------------------------------------------------------ */
/*  Tests — Credential Encoding Evasion                               */
/* ------------------------------------------------------------------ */

test.describe("White Hat — Credential Detection Coverage", () => {
  test.beforeEach(async ({ page }) => {
    await mockApi(page);
    await page.goto("/");
    await expect(page.getByTestId("source-textarea")).toBeVisible({
      timeout: 15_000,
    });
  });

  test("masks credentials hidden in HTTP request body", async ({ page }) => {
    const input = [
      "POST /api/submit HTTP/1.1",
      "Content-Type: application/x-www-form-urlencoded",
      "",
      "name=John+Doe&email=john@pentest.lab&ssn=999-88-7777",
    ].join("\n");
    const masked = await fillAndGetMasked(page, input);
    expect(masked).not.toContain("john@pentest.lab");
    expect(masked).not.toContain("999-88-7777");
  });

  test("masks .env file contents with mixed secrets", async ({ page }) => {
    const input = [
      "OPENAI_API_KEY=sk-live-testkey1234567890abcdef",
      "AWS_ACCESS_KEY_ID=AKIAI44QH8DHBEXAMPLE",
      "DATABASE_URL=postgres://localhost:5432/mydb",
    ].join("\n");
    const masked = await fillAndGetMasked(page, input);
    expect(masked).not.toContain("sk-live-testkey1234567890abcdef");
    expect(masked).not.toContain("AKIAI44QH8DHBEXAMPLE");
  });

  test("masks GitHub PAT in git config URL", async ({ page }) => {
    const masked = await fillAndGetMasked(
      page,
      "url = https://ghp_ABCDEFghijklmnopqrstuvwxyz012345@github.com/org/repo.git",
    );
    expect(masked).not.toContain("ghp_ABCDEFghijklmnopqrstuvwxyz012345");
  });

  test("masks JWT token after Authorization header", async ({ page }) => {
    const masked = await fillAndGetMasked(
      page,
      "Authorization: Bearer eyJhbGciOiJSUzI1NiJ9.eyJ1c2VyIjoiam9obiJ9.SIGNATURE_HERE_1234",
    );
    expect(masked).not.toContain(
      "eyJhbGciOiJSUzI1NiJ9.eyJ1c2VyIjoiam9obiJ9.SIGNATURE_HERE_1234",
    );
  });
});
