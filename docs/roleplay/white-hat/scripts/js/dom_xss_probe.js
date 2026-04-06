/**
 * [WHITE HAT] DOM XSS Probe — Advanced ethical hacker script
 *
 * Objetivo: Testar se o motor de masking sanitiza adequadamente
 * payloads de XSS que poderiam ser injetados via campos de texto
 * e re-renderizados no DOM.
 *
 * Alvo: MaskingEngine (frontend Angular)
 */
"use strict";

const XSS_PAYLOADS = [
  '<script>alert("xss")</script>',
  "<img src=x onerror=alert(1)>",
  '"><svg onload=alert(document.cookie)>',
  "javascript:alert(1)",
  '<iframe src="javascript:alert(1)">',
  "{{constructor.constructor('return this')()}}", // Angular template injection
  "${7*7}", // Template literal injection
  '<a href="javascript:void(0)" onclick="alert(1)">click</a>',
  '<div style="background:url(javascript:alert(1))">',
  "';!--\"<XSS>=&{()}",
];

/**
 * Tests whether input text survives through masking without
 * preserving executable script content.
 * @param {string} maskedText - Output from the masking engine
 * @param {string} originalPayload - The original XSS payload
 * @returns {{ safe: boolean; reason: string }}
 */
function analyzeXssSafety(maskedText, originalPayload) {
  const dangerous = [
    { pattern: /<script[\s>]/i, reason: "Unescaped <script> tag" },
    { pattern: /on\w+\s*=/i, reason: "Inline event handler present" },
    { pattern: /javascript:/i, reason: "javascript: URI scheme" },
    { pattern: /\{\{.*constructor/i, reason: "Angular template injection" },
    { pattern: /<iframe[\s>]/i, reason: "Unescaped <iframe> tag" },
    { pattern: /<svg[\s>]/i, reason: "Unescaped <svg> tag" },
  ];

  for (const { pattern, reason } of dangerous) {
    if (pattern.test(maskedText)) {
      return { safe: false, reason };
    }
  }
  return { safe: true, reason: "No executable content detected" };
}

/**
 * Runs XSS probe against a masking function.
 * @param {(text: string) => string} maskFn - The masking function to test
 * @returns {{ total: number; safe: number; unsafe: number; details: object[] }}
 */
function runXssProbe(maskFn) {
  const details = [];
  let safe = 0;
  let unsafe = 0;

  for (const payload of XSS_PAYLOADS) {
    const masked = maskFn(payload);
    const result = analyzeXssSafety(masked, payload);
    details.push({
      payload,
      masked,
      ...result,
    });
    if (result.safe) safe++;
    else unsafe++;
  }

  return { total: XSS_PAYLOADS.length, safe, unsafe, details };
}

function main() {
  console.log("[WHITE HAT] DOM XSS Probe");
  console.log(`Testing ${XSS_PAYLOADS.length} XSS payloads...`);

  // Without a masking function, just analyze raw payloads
  const results = runXssProbe(text => text);
  console.log(`  Safe: ${results.safe}  Unsafe: ${results.unsafe}`);

  for (const d of results.details.filter(d => !d.safe)) {
    console.warn(`  ⚠ ${d.reason}: ${d.payload.substring(0, 60)}`);
  }
}

if (require.main === module) {
  main();
}

module.exports = { XSS_PAYLOADS, analyzeXssSafety, runXssProbe };
