/**
 * Roleplay E2E — CISO (Compliance & Governance)
 *
 * Browser-based tests simulating a CISO's compliance audit:
 * OWASP/PCI-DSS/LGPD/GDPR compliance header checks,
 * PII data classification verification through the UI,
 * privacy-by-default configuration, and regulatory document
 * masking scenarios (incident reports, data mappings, audit logs).
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

async function selectCountries(page: Page, ids: string[]): Promise<void> {
  await page.getByTestId("country-modal-button").click();
  for (const id of ids) {
    await page.getByTestId(`country-toggle-${id}`).check();
  }
  await page.getByRole("button", { name: /close/i }).click();
}

async function fillAndGetMasked(page: Page, input: string): Promise<string> {
  await page.getByTestId("source-textarea").fill(input);
  const output = page.getByTestId("masked-output");
  await expect(output).toBeVisible({ timeout: 10_000 });
  await page.waitForTimeout(1500);
  return (await output.textContent()) ?? "";
}

/* ------------------------------------------------------------------ */
/*  Tests — Compliance Headers                                        */
/* ------------------------------------------------------------------ */

test.describe("CISO — OWASP Compliance Headers", () => {
  const REQUIRED_HEADERS = [
    { name: "x-content-type-options", expected: "nosniff" },
    { name: "x-frame-options", expected: /DENY|SAMEORIGIN/i },
    { name: "referrer-policy", expected: /strict-origin/i },
  ] as const;

  for (const { name, expected } of REQUIRED_HEADERS) {
    test(`${name} is present and correct`, async ({ request }) => {
      const response = await request.get(`${BACKEND_URL}/api/health`);
      const value = response.headers()[name] ?? "";
      expect(value.length).toBeGreaterThan(0);
      if (typeof expected === "string") {
        expect(value).toBe(expected);
      } else {
        expect(value).toMatch(expected);
      }
    });
  }

  test("Content-Security-Policy header is present", async ({ request }) => {
    const response = await request.get(`${BACKEND_URL}/api/health`);
    const csp = response.headers()["content-security-policy"] ?? "";
    expect(csp).toContain("default-src");
    expect(csp).toContain("frame-ancestors");
  });

  test("no dangerous disclosure headers are sent", async ({ request }) => {
    const response = await request.get(`${BACKEND_URL}/api/health`);
    const headers = response.headers();
    // These should not be present or should not reveal details
    expect(headers["x-powered-by"] ?? "").toBe("");
    const server = headers["server"] ?? "";
    expect(server).not.toMatch(/Kestrel|ASP\.NET|IIS|Microsoft/i);
  });
});

/* ------------------------------------------------------------------ */
/*  Tests — PCI-DSS CSP Compliance                                    */
/* ------------------------------------------------------------------ */

test.describe("CISO — PCI-DSS CSP Audit", () => {
  test("CSP does not allow unsafe-eval (PCI-DSS Req 6.4)", async ({
    request,
  }) => {
    const response = await request.get(`${BACKEND_URL}/api/health`);
    const csp = response.headers()["content-security-policy"] ?? "";
    expect(csp).not.toContain("'unsafe-eval'");
  });

  test("CSP does not allow data: URIs in script-src", async ({ request }) => {
    const response = await request.get(`${BACKEND_URL}/api/health`);
    const csp = response.headers()["content-security-policy"] ?? "";
    const scriptSrc = csp
      .split(";")
      .find((d: string) => d.trim().startsWith("script-src"));
    if (scriptSrc) {
      expect(scriptSrc).not.toContain("data:");
    }
  });
});

/* ------------------------------------------------------------------ */
/*  Tests — LGPD/GDPR Incident Report Masking                        */
/* ------------------------------------------------------------------ */

test.describe("CISO — LGPD/GDPR Data Masking through UI", () => {
  test.beforeEach(async ({ page }) => {
    await mockApi(page);
    await page.goto("/");
    await expect(page.getByTestId("source-textarea")).toBeVisible({
      timeout: 15_000,
    });
  });

  test("masks PII in incident report excerpt", async ({ page }) => {
    const report = [
      "INCIDENT REPORT #IR-2025-0042",
      "Affected individual: Jane Doe",
      "Email: victim@company.com",
      "SSN: 234-56-7890",
      "Data classification: PII / Confidential",
      "GDPR Article 33 notification deadline: 72 hours",
    ].join("\n");
    const masked = await fillAndGetMasked(page, report);
    expect(masked).not.toContain("victim@company.com");
    expect(masked).not.toContain("234-56-7890");
  });

  test("masks CPF and CNPJ in LGPD data mapping (BR scope)", async ({
    page,
  }) => {
    await selectCountries(page, ["br"]);
    const mapping = [
      "MAPEAMENTO DE DADOS — LGPD Art. 37",
      "Titular: Maria Silva",
      "CPF: 529.982.247-25",
      "Empresa controladora CNPJ: 11.222.333/0001-81",
      "Base legal: consentimento (Art. 7, I)",
    ].join("\n");
    const masked = await fillAndGetMasked(page, mapping);
    expect(masked).not.toContain("529.982.247-25");
    expect(masked).not.toContain("11.222.333/0001-81");
  });

  test("masks PII in PCI-DSS audit log excerpt", async ({ page }) => {
    const auditLog = [
      "PCI-DSS Requirement 3.4 — Render PAN unreadable",
      "Audit: cardholder John Smith",
      "Email: john.smith@payment.corp",
      "Transaction reference SSN: 789-01-2345",
    ].join("\n");
    const masked = await fillAndGetMasked(page, auditLog);
    expect(masked).not.toContain("john.smith@payment.corp");
    expect(masked).not.toContain("789-01-2345");
  });
});

/* ------------------------------------------------------------------ */
/*  Tests — Error Response PII Leakage                                */
/* ------------------------------------------------------------------ */

test.describe("CISO — Error Response Audit", () => {
  test("API error responses do not contain stack traces", async ({
    request,
  }) => {
    // Send deliberately malformed request to trigger error
    const response = await request.post(`${BACKEND_URL}/api/feedback`, {
      data: "not json",
      headers: { "Content-Type": "application/json" },
    });
    const body = await response.text();
    // Should never expose internal stack traces
    expect(body).not.toMatch(/at \w+\.\w+\(/);
    expect(body).not.toContain("System.Exception");
    expect(body).not.toContain("NullReferenceException");
  });

  test("404 responses do not reveal server internals", async ({ request }) => {
    const response = await request.get(
      `${BACKEND_URL}/api/nonexistent-path-12345`,
    );
    const body = await response.text();
    expect(body).not.toContain("Kestrel");
    expect(body).not.toContain("aspnet");
    expect(body).not.toMatch(/stack\s*trace/i);
  });
});
