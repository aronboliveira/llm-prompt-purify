/**
 * Purification Types
 *
 * Type declarations for the isomorphic content purification system.
 * Supports XSS, XXE, and SQL injection detection and mitigation.
 *
 * @module PurificationTypes
 */

/**
 * Types of threats that can be detected in content.
 */
export type ThreatType = "xss" | "xxe" | "sql-injection" | "path-traversal";

/**
 * Severity levels for detected threats.
 */
export type ThreatSeverity = "critical" | "high" | "medium" | "low";

/**
 * Detection confidence level.
 */
export type DetectionConfidence = "definite" | "likely" | "possible";

/**
 * Describes a detected threat in content.
 */
export interface ThreatMatch {
  /** Type of threat detected */
  readonly type: ThreatType;

  /** Severity assessment */
  readonly severity: ThreatSeverity;

  /** Confidence in the detection */
  readonly confidence: DetectionConfidence;

  /** The matched content */
  readonly value: string;

  /** Start position in original text */
  readonly start: number;

  /** End position in original text */
  readonly end: number;

  /** Rule or pattern that triggered the detection */
  readonly ruleId: string;

  /** Human-readable description */
  readonly description: string;
}

/**
 * Result of a purification operation.
 */
export interface PurificationResult {
  /** The sanitized/purified text */
  readonly purifiedText: string;

  /** Original text before purification */
  readonly originalText: string;

  /** List of detected threats */
  readonly threats: readonly ThreatMatch[];

  /** Whether any threats were found */
  readonly hasThreats: boolean;

  /** Count of threats by type */
  readonly threatCounts: Readonly<Record<ThreatType, number>>;

  /** Timestamp of the purification */
  readonly purifiedAt: string;
}

/**
 * Configuration for the purification process.
 */
export interface PurificationConfig {
  /** Enable XSS detection and sanitization */
  readonly detectXss: boolean;

  /** Enable XXE pattern detection */
  readonly detectXxe: boolean;

  /** Enable SQL injection detection */
  readonly detectSqlInjection: boolean;

  /** Enable path traversal detection */
  readonly detectPathTraversal: boolean;

  /** Whether to strip detected threats from output */
  readonly stripThreats: boolean;

  /** Whether to encode HTML entities */
  readonly encodeHtml: boolean;

  /** Whether to neutralize URLs */
  readonly neutralizeUrls: boolean;

  /** Custom allowlist of HTML tags (only applies if encodeHtml is false) */
  readonly allowedTags?: readonly string[];
}

/**
 * XSS-specific detection pattern.
 */
export interface XssPattern {
  readonly id: string;
  readonly pattern: RegExp;
  readonly severity: ThreatSeverity;
  readonly description: string;
}

/**
 * SQL injection detection pattern.
 */
export interface SqlInjectionPattern {
  readonly id: string;
  readonly pattern: RegExp;
  readonly severity: ThreatSeverity;
  readonly description: string;
}

/**
 * XXE detection pattern.
 */
export interface XxePattern {
  readonly id: string;
  readonly pattern: RegExp;
  readonly severity: ThreatSeverity;
  readonly description: string;
}
