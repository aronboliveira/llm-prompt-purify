/**
 * [CISO] CSP Analyzer — Content Security Policy compliance auditor
 *
 * Objetivo: Análise detalhada da política CSP do aplicativo,
 * avaliando conformidade com frameworks de segurança (OWASP, PCI DSS).
 *
 * Alvo: APP_URL ou http://127.0.0.1:4200 (frontend Angular)
 */
"use strict";

const APP_URL = process.env.APP_URL || "http://127.0.0.1:4200";

const COMPLIANCE_REQUIREMENTS = {
  OWASP: {
    required: ["default-src", "script-src", "object-src", "frame-ancestors"],
    forbidden_values: ["'unsafe-inline'", "'unsafe-eval'", "*"],
  },
  "PCI-DSS": {
    required: ["default-src", "script-src", "style-src", "frame-ancestors"],
    forbidden_values: ["'unsafe-eval'", "*"],
  },
  "LGPD/GDPR": {
    required: ["connect-src", "frame-ancestors"],
    forbidden_values: ["*"],
  },
};

/**
 * Parses a CSP header string into a directive map.
 * @param {string} raw
 * @returns {Record<string, string[]>}
 */
function parseCsp(raw) {
  if (!raw) return {};
  const result = {};
  for (const segment of raw.split(";")) {
    const tokens = segment.trim().split(/\s+/);
    if (tokens.length === 0 || !tokens[0]) continue;
    result[tokens[0].toLowerCase()] = tokens.slice(1);
  }
  return result;
}

/**
 * Checks CSP compliance against multiple frameworks.
 * @param {Record<string, string[]>} csp
 * @returns {Record<string, { compliant: boolean; violations: string[] }>}
 */
function checkCompliance(csp) {
  const report = {};
  for (const [framework, rules] of Object.entries(COMPLIANCE_REQUIREMENTS)) {
    const violations = [];
    for (const dir of rules.required) {
      if (!csp[dir]) {
        violations.push(`Missing required directive: ${dir}`);
      }
    }
    for (const [directive, values] of Object.entries(csp)) {
      for (const forbidden of rules.forbidden_values) {
        if (values.includes(forbidden)) {
          violations.push(`${directive} uses forbidden value: ${forbidden}`);
        }
      }
    }
    report[framework] = {
      compliant: violations.length === 0,
      violations,
    };
  }
  return report;
}

/**
 * Calculates an overall compliance grade.
 * @param {Record<string, { compliant: boolean; violations: string[] }>} report
 * @returns {string}
 */
function calculateGrade(report) {
  const total = Object.keys(report).length;
  const passing = Object.values(report).filter(r => r.compliant).length;
  if (passing === total) return "A";
  if (passing >= total - 1) return "B";
  if (passing >= 1) return "C";
  return "F";
}

async function main() {
  console.log(`[CISO] CSP Analyzer — targeting ${APP_URL}`);

  try {
    const res = await fetch(APP_URL);
    const raw = res.headers.get("content-security-policy") || "";

    if (!raw) {
      console.warn("⚠ No CSP header found — all frameworks NON-COMPLIANT.");
      return { grade: "F", hasCsp: false };
    }

    const csp = parseCsp(raw);
    const report = checkCompliance(csp);
    const grade = calculateGrade(report);

    console.log(`\n  Overall Grade: ${grade}\n`);
    for (const [fw, r] of Object.entries(report)) {
      const status = r.compliant ? "✓ COMPLIANT" : "✗ NON-COMPLIANT";
      console.log(`  ${fw}: ${status}`);
      for (const v of r.violations) {
        console.log(`    - ${v}`);
      }
    }

    return { grade, hasCsp: true, report };
  } catch (err) {
    console.error(`✗ Connection failed: ${err.message}`);
    return { grade: "F", hasCsp: false, error: err.message };
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  parseCsp,
  checkCompliance,
  calculateGrade,
  COMPLIANCE_REQUIREMENTS,
  main,
};
