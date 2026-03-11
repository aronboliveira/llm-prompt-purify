/**
 * SQL Injection Detection Utilities
 *
 * Isomorphic SQL injection pattern detection for content screening.
 * Identifies common SQL injection vectors without executing any SQL.
 *
 * @module SqlDetectUtils
 */

import type {
  SqlInjectionPattern,
  ThreatMatch,
} from "../declarations/purification.types";

/**
 * Common SQL injection attack patterns.
 * Ordered by specificity and severity.
 */
const SQL_INJECTION_PATTERNS: readonly SqlInjectionPattern[] = Object.freeze([
  // Classic OR-based injection
  {
    id: "sqli-or-true",
    pattern: /\b(?:OR|AND)\s+'?1'?\s*=\s*'?1'?/giu,
    severity: "critical",
    description: "Classic OR/AND 1=1 SQL injection",
  },
  {
    id: "sqli-or-always-true",
    pattern: /'\s*(?:OR|AND)\s+(?:'?[\w@.-]*'?\s*[=<>]+\s*'?[\w@.-]*'?|\d+\s*[=]+\s*\d+)/giu,
    severity: "critical",
    description: "OR/AND-based tautology injection",
  },

  // UNION-based injection
  {
    id: "sqli-union-select",
    pattern: /\bUNION\s+(?:ALL\s+)?SELECT\b/giu,
    severity: "critical",
    description: "UNION SELECT injection",
  },

  // Stacked queries
  {
    id: "sqli-stacked",
    pattern: /;\s*(?:SELECT|INSERT|UPDATE|DELETE|DROP|TRUNCATE|ALTER|CREATE|EXEC|EXECUTE)\b/giu,
    severity: "critical",
    description: "Stacked query injection",
  },

  // Comment-based bypass
  {
    id: "sqli-comment-bypass",
    pattern: /(?:--|#|\/\*)\s*$/gmu,
    severity: "high",
    description: "SQL comment injection (query termination)",
  },
  {
    id: "sqli-inline-comment",
    pattern: /\/\*.*?\*\//gsu,
    severity: "medium",
    description: "Inline SQL comment",
  },

  // Time-based blind injection
  {
    id: "sqli-time-delay",
    pattern: /\b(?:SLEEP|WAITFOR\s+DELAY|BENCHMARK|PG_SLEEP)\s*\(/giu,
    severity: "critical",
    description: "Time-based blind SQL injection",
  },

  // Error-based injection
  {
    id: "sqli-error-based",
    pattern: /\b(?:EXTRACTVALUE|UPDATEXML|XMLTYPE|LOAD_FILE)\s*\(/giu,
    severity: "critical",
    description: "Error-based SQL injection",
  },

  // Boolean-based blind injection indicators
  {
    id: "sqli-boolean-blind",
    pattern: /\bAND\s+(?:\d+\s*[=!<>]+\s*\d+|'[^']*'\s*[=!<>]+\s*'[^']*')\s*(?:--|#|$)/giu,
    severity: "high",
    description: "Boolean-based blind SQL injection",
  },

  // Drop/truncate statements
  {
    id: "sqli-destructive",
    pattern: /\b(?:DROP|TRUNCATE)\s+(?:TABLE|DATABASE|SCHEMA)\b/giu,
    severity: "critical",
    description: "Destructive SQL command",
  },

  // Insert/Update/Delete with suspicious patterns
  {
    id: "sqli-dml-suspicious",
    pattern: /\b(?:INSERT\s+INTO|UPDATE\s+\w+\s+SET|DELETE\s+FROM)\s+\w+\s*(?:WHERE\s+1\s*[=]+\s*1|;|\(SELECT)/giu,
    severity: "high",
    description: "Suspicious DML statement",
  },

  // Grant/revoke (privilege escalation)
  {
    id: "sqli-privilege",
    pattern: /\b(?:GRANT|REVOKE)\s+\w+\s+(?:ON|TO|FROM)\b/giu,
    severity: "critical",
    description: "SQL privilege manipulation",
  },

  // Information schema access
  {
    id: "sqli-info-schema",
    pattern: /\b(?:INFORMATION_SCHEMA|SYS\.TABLES|SYSOBJECTS|PG_CATALOG|ALL_TABLES)\b/giu,
    severity: "high",
    description: "Database schema enumeration",
  },

  // System command execution
  {
    id: "sqli-exec-cmd",
    pattern: /\b(?:EXEC(?:UTE)?\s*\(|XP_CMDSHELL|SP_EXECUTESQL)\b/giu,
    severity: "critical",
    description: "SQL system command execution",
  },

  // Hex encoding bypass
  {
    id: "sqli-hex-encode",
    pattern: /0x[0-9a-f]{10,}/giu,
    severity: "medium",
    description: "Hexadecimal encoded SQL payload",
  },

  // Char function obfuscation
  {
    id: "sqli-char-obfuscate",
    pattern: /CHAR\s*\(\s*\d+(?:\s*[,+]\s*\d+)*\s*\)/giu,
    severity: "medium",
    description: "CHAR function obfuscation",
  },

  // Concat-based obfuscation
  {
    id: "sqli-concat-obfuscate",
    pattern: /CONCAT\s*\(\s*(?:'[^']*'|\w+)(?:\s*,\s*(?:'[^']*'|\w+))+\s*\)/giu,
    severity: "low",
    description: "CONCAT function (possible obfuscation)",
  },

  // Simple quote escaping probes
  {
    id: "sqli-quote-probe",
    pattern: /'\s*'\s*'/g,
    severity: "low",
    description: "Quote escaping probe",
  },
]);

/**
 * SQL keywords that should be flagged when appearing in user input with suspicious context.
 */
const SQL_KEYWORDS: readonly string[] = Object.freeze([
  "SELECT",
  "INSERT",
  "UPDATE",
  "DELETE",
  "DROP",
  "UNION",
  "WHERE",
  "FROM",
  "JOIN",
  "ORDER BY",
  "GROUP BY",
  "HAVING",
  "LIMIT",
  "OFFSET",
  "INTO",
  "VALUES",
  "SET",
  "CREATE",
  "ALTER",
  "TRUNCATE",
  "GRANT",
  "REVOKE",
  "EXECUTE",
  "EXEC",
]);

/**
 * Detects SQL injection patterns in text.
 */
export function detectSqlInjection(text: string): readonly ThreatMatch[] {
  const matches: ThreatMatch[] = [];

  for (const sqlPattern of SQL_INJECTION_PATTERNS) {
    const regex = new RegExp(sqlPattern.pattern.source, sqlPattern.pattern.flags);

    for (const match of text.matchAll(regex)) {
      matches.push({
        type: "sql-injection",
        severity: sqlPattern.severity,
        confidence:
          sqlPattern.severity === "critical"
            ? "definite"
            : sqlPattern.severity === "high"
              ? "likely"
              : "possible",
        value: match[0],
        start: match.index ?? 0,
        end: (match.index ?? 0) + match[0].length,
        ruleId: sqlPattern.id,
        description: sqlPattern.description,
      });
    }
  }

  return matches;
}

/**
 * Counts SQL keywords in text.
 * High keyword density may indicate SQL content (legitimate or malicious).
 */
export function countSqlKeywords(text: string): number {
  const upperText = text.toUpperCase();
  let count = 0;

  for (const keyword of SQL_KEYWORDS) {
    // Match whole words only
    const regex = new RegExp(`\\b${keyword}\\b`, "gi");
    const matches = upperText.match(regex);
    if (matches) {
      count += matches.length;
    }
  }

  return count;
}

/**
 * Checks if text likely contains SQL query syntax.
 */
export function looksLikeSql(text: string): boolean {
  const keywordCount = countSqlKeywords(text);
  const wordCount = text.split(/\s+/).length;

  // If more than 10% of words are SQL keywords, it's likely SQL
  return keywordCount >= 2 && keywordCount / wordCount > 0.1;
}

/**
 * Checks if text contains high-severity SQL injection patterns.
 */
export function containsSqlInjection(text: string): boolean {
  const threats = detectSqlInjection(text);
  return threats.some(
    t => t.severity === "critical" || t.severity === "high",
  );
}

/**
 * Neutralizes SQL injection by escaping single quotes and removing dangerous patterns.
 * This is a defense-in-depth measure, not a replacement for parameterized queries.
 */
export function neutralizeSqlInjection(text: string): string {
  return text
    // Escape single quotes
    .replace(/'/g, "''")
    // Remove SQL comments
    .replace(/--.*$/gm, "")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    // Remove semicolons (stacked queries)
    .replace(/;/g, "");
}
