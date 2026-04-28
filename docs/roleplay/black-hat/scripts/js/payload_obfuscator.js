// PULL REQUEST START
/**
 * [BLACK HAT] Payload Obfuscator — Evasão de WAF por encoding
 *
 * ⚠ EXCLUSIVO PARA TESTES DEFENSIVOS — NUNCA USE EM PRODUÇÃO.
 * Esta pasta é ignorada pelo .gitignore (padrão: **​/black-hat/).
 *
 * Objetivo: Gerar payloads XSS/SQLi ofuscados para testar se os
 * filtros de entrada da aplicação detectam variantes encoded.
 */
"use strict";

const ENCODING_METHODS = {
  /**
   * HTML entity encoding (decimal).
   * @param {string} input
   * @returns {string}
   */
  htmlEntity(input) {
    return [...input].map(c => `&#${c.charCodeAt(0)};`).join("");
  },

  /**
   * HTML entity encoding (hex).
   * @param {string} input
   * @returns {string}
   */
  htmlHex(input) {
    return [...input].map(c => `&#x${c.charCodeAt(0).toString(16)};`).join("");
  },

  /**
   * URL encoding (percent).
   * @param {string} input
   * @returns {string}
   */
  urlEncode(input) {
    return [...input]
      .map(c => `%${c.charCodeAt(0).toString(16).padStart(2, "0")}`)
      .join("");
  },

  /**
   * Double URL encoding.
   * @param {string} input
   * @returns {string}
   */
  doubleUrlEncode(input) {
    return [...input]
      .map(c => {
        const hex = c.charCodeAt(0).toString(16).padStart(2, "0");
        return `%25${hex}`;
      })
      .join("");
  },

  /**
   * Unicode escape.
   * @param {string} input
   * @returns {string}
   */
  unicodeEscape(input) {
    return [...input]
      .map(c => `\\u${c.charCodeAt(0).toString(16).padStart(4, "0")}`)
      .join("");
  },

  /**
   * Mixed case evasion (alternating case).
   * @param {string} input
   * @returns {string}
   */
  mixedCase(input) {
    return [...input]
      .map((c, i) => (i % 2 === 0 ? c.toUpperCase() : c.toLowerCase()))
      .join("");
  },

  /**
   * String concatenation via JS (to bypass string-match filters).
   * @param {string} input
   * @returns {string}
   */
  jsConcatenation(input) {
    return [...input]
      .map(c => `String.fromCharCode(${c.charCodeAt(0)})`)
      .join("+");
  },
};

const BASE_PAYLOADS = [
  '<script>alert("xss")</script>',
  "<img src=x onerror=alert(1)>",
  "' OR 1=1--",
  "'; DROP TABLE users;--",
  '"><svg onload=alert(document.cookie)>',
];

/**
 * Generates all encoding variants for a set of payloads.
 * @param {string[]} payloads
 * @returns {{ payload: string; encoding: string; encoded: string }[]}
 */
function generateObfuscatedPayloads(payloads = BASE_PAYLOADS) {
  const results = [];
  for (const payload of payloads) {
    for (const [name, fn] of Object.entries(ENCODING_METHODS)) {
      results.push({
        payload,
        encoding: name,
        encoded: fn(payload),
      });
    }
  }
  return results;
}

/**
 * Tests if a filter function detects obfuscated payloads.
 * @param {(input: string) => boolean} filterFn - Returns true if dangerous
 * @param {{ payload: string; encoding: string; encoded: string }[]} variants
 * @returns {{ detected: number; evaded: number; evasions: object[] }}
 */
function testFilterEvasion(filterFn, variants) {
  let detected = 0;
  let evaded = 0;
  const evasions = [];

  for (const v of variants) {
    if (filterFn(v.encoded)) {
      detected++;
    } else {
      evaded++;
      evasions.push(v);
    }
  }

  return { detected, evaded, evasions };
}

function main() {
  console.log("[BLACK HAT] Payload Obfuscator");
  const variants = generateObfuscatedPayloads();
  console.log(`Generated ${variants.length} obfuscated payloads`);
  console.log(
    `  (${BASE_PAYLOADS.length} base × ${Object.keys(ENCODING_METHODS).length} encodings)`,
  );

  for (const v of variants.slice(0, 5)) {
    console.log(`\n  [${v.encoding}] ${v.payload.substring(0, 30)}...`);
    console.log(`    → ${v.encoded.substring(0, 60)}...`);
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  ENCODING_METHODS,
  BASE_PAYLOADS,
  generateObfuscatedPayloads,
  testFilterEvasion,
};
// PULL REQUEST END
