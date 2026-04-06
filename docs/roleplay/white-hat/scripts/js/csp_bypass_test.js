/**
 * [WHITE HAT] CSP Bypass Test — Content Security Policy analysis
 *
 * Objetivo: Verificar se a política CSP do app é robusta o suficiente
 * para impedir injeções inline, eval(), e fontes externas não autorizadas.
 *
 * Alvo: APP_URL ou http://127.0.0.1:4200 (frontend Angular)
 */
"use strict";

const APP_URL = process.env.APP_URL || "http://127.0.0.1:4200";

const REQUIRED_DIRECTIVES = [
  "default-src",
  "script-src",
  "style-src",
  "img-src",
  "connect-src",
  "frame-ancestors",
];

const DANGEROUS_VALUES = ["'unsafe-inline'", "'unsafe-eval'", "data:", "*"];

/**
 * Parses a CSP header into an object of directive → values.
 * @param {string} cspHeader
 * @returns {Record<string, string[]>}
 */
function parseCsp(cspHeader) {
  if (!cspHeader) return {};
  const directives = {};
  for (const part of cspHeader.split(";")) {
    const tokens = part.trim().split(/\s+/);
    if (tokens.length === 0) continue;
    const [directive, ...values] = tokens;
    directives[directive.toLowerCase()] = values;
  }
  return directives;
}

/**
 * Audits a parsed CSP for common weaknesses.
 * @param {Record<string, string[]>} csp
 * @returns {{ grade: string; issues: string[]; missing: string[] }}
 */
function auditCsp(csp) {
  const issues = [];
  const missing = [];

  for (const dir of REQUIRED_DIRECTIVES) {
    if (!csp[dir]) {
      missing.push(dir);
    }
  }

  for (const [directive, values] of Object.entries(csp)) {
    for (const dangerous of DANGEROUS_VALUES) {
      if (values.includes(dangerous)) {
        issues.push(`${directive} contains ${dangerous}`);
      }
    }
  }

  if (!csp["frame-ancestors"]) {
    issues.push("Missing frame-ancestors (clickjacking risk)");
  }

  const score = issues.length + missing.length;
  const grade =
    score === 0
      ? "A"
      : score <= 2
        ? "B"
        : score <= 4
          ? "C"
          : score <= 6
            ? "D"
            : "F";

  return { grade, issues, missing };
}

async function main() {
  console.log(`[WHITE HAT] CSP Bypass Test — targeting ${APP_URL}`);

  try {
    const res = await fetch(APP_URL);
    const cspHeader =
      res.headers.get("content-security-policy") ||
      res.headers.get("content-security-policy-report-only") ||
      "";

    if (!cspHeader) {
      console.warn("⚠ No Content-Security-Policy header found!");
      return {
        grade: "F",
        issues: ["No CSP header"],
        missing: REQUIRED_DIRECTIVES,
      };
    }

    const csp = parseCsp(cspHeader);
    const result = auditCsp(csp);

    console.log(`  CSP Grade: ${result.grade}`);
    for (const issue of result.issues) console.warn(`  ⚠ ${issue}`);
    for (const m of result.missing) console.warn(`  ✗ Missing directive: ${m}`);
    if (result.issues.length === 0 && result.missing.length === 0) {
      console.log("  ✓ CSP looks solid.");
    }
    return result;
  } catch (err) {
    console.error(`✗ Connection failed: ${err.message}`);
    return { grade: "F", issues: [err.message], missing: [] };
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  parseCsp,
  auditCsp,
  REQUIRED_DIRECTIVES,
  DANGEROUS_VALUES,
  main,
};
