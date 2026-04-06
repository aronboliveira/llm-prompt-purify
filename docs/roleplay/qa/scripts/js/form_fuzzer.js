/**
 * [QA] Form Fuzzer — Fuzzing de campos de formulário
 *
 * Objetivo: Enviar inputs inesperados, malformados e boundary-value
 * para endpoints da API e verificar se a validação é robusta.
 *
 * Alvo: APP_URL ou http://127.0.0.1:5147 (backend .NET)
 */
"use strict";

const APP_URL = process.env.APP_URL || "http://127.0.0.1:5147";

const FUZZ_VECTORS = {
  empty: "",
  null_literal: "null",
  undefined_literal: "undefined",
  whitespace: "   \t\n  ",
  long_string: "A".repeat(10_000),
  unicode_bom: "\uFEFFhello",
  null_bytes: "hello\x00world",
  rtl_override: "\u202Emalicious",
  emoji_bomb: "😀".repeat(1000),
  sql_inject: "' OR 1=1 --",
  xss_basic: "<script>alert(1)</script>",
  xss_img: "<img src=x onerror=alert(1)>",
  crlf_inject: "header\r\nX-Injected: true",
  path_traversal: "../../../etc/passwd",
  template_inject: "{{7*7}}",
  json_nested: '{"a":{"b":{"c":{"d":"deep"}}}}',
  negative_number: "-999999",
  float_overflow: "1.7976931348623157E+10308",
  array_string: "[1,2,3]",
  boolean_string: "true",
};

/**
 * Fuzzes a single field in the feedback endpoint.
 * @param {string} field - Field name to fuzz
 * @param {string} value - Fuzz value to inject
 * @returns {Promise<{ field: string; value: string; status: number; safe: boolean; reason: string }>}
 */
async function fuzzFeedbackField(field, value) {
  const basePayload = {
    category: "bug",
    email: "fuzz@test.local",
    message: "Fuzz test",
    name: "Fuzzer",
    rating: 3,
    subject: "Fuzz test",
    wantsReply: false,
  };

  const payload = { ...basePayload, [field]: value };

  try {
    const res = await fetch(`${APP_URL}/api/feedback`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const status = res.status;
    const body = await res.text();

    // 400/422 = proper validation, 500 = crash, 201 with fuzz input = concerning
    if (status === 500) {
      return {
        field,
        value: value.substring(0, 30),
        status,
        safe: false,
        reason: "Server crash (500)",
      };
    }
    if (status === 201 && field === "email" && !value.includes("@")) {
      return {
        field,
        value: value.substring(0, 30),
        status,
        safe: false,
        reason: "Invalid email accepted",
      };
    }
    if (
      body.toLowerCase().includes("stack trace") ||
      body.toLowerCase().includes("exception")
    ) {
      return {
        field,
        value: value.substring(0, 30),
        status,
        safe: false,
        reason: "Error details leaked",
      };
    }

    return {
      field,
      value: value.substring(0, 30),
      status,
      safe: true,
      reason: "Handled correctly",
    };
  } catch {
    return {
      field,
      value: value.substring(0, 30),
      status: 0,
      safe: false,
      reason: "Connection error",
    };
  }
}

/**
 * Runs the full fuzz suite against the feedback endpoint.
 * @returns {Promise<{ total: number; safe: number; unsafe: number; results: object[] }>}
 */
async function runFuzzSuite() {
  const fields = ["name", "email", "message", "subject", "category"];
  const results = [];

  for (const field of fields) {
    for (const [label, value] of Object.entries(FUZZ_VECTORS)) {
      const result = await fuzzFeedbackField(field, value);
      result.label = label;
      results.push(result);
    }
  }

  const safe = results.filter(r => r.safe).length;
  const unsafe = results.filter(r => !r.safe).length;

  return { total: results.length, safe, unsafe, results };
}

async function main() {
  console.log(`[QA] Form Fuzzer — targeting ${APP_URL}`);
  console.log(
    `Testing ${Object.keys(FUZZ_VECTORS).length} vectors × 5 fields...\n`,
  );

  const suite = await runFuzzSuite();
  console.log(
    `  Total: ${suite.total}  Safe: ${suite.safe}  Unsafe: ${suite.unsafe}`,
  );

  for (const r of suite.results.filter(r => !r.safe)) {
    console.warn(`  ⚠ ${r.field}/${r.label}: ${r.reason} [${r.status}]`);
  }

  return suite;
}

if (require.main === module) {
  main();
}

module.exports = { FUZZ_VECTORS, fuzzFeedbackField, runFuzzSuite, main };
