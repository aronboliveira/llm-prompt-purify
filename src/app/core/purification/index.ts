/**
 * Purification Module Public API
 *
 * @module Purification
 */

// Service
export {
  ContentPurifier,
  DEFAULT_PURIFICATION_CONFIG,
  detectThreats,
  encodeHtmlEntities,
  hasThreats,
  neutralizeSqlInjection,
  neutralizeXxe,
  purifyContent,
  sanitizePath,
  sanitizeXss,
  stripHtmlTags,
} from "./purification.service";

// Types
export type {
  DetectionConfidence,
  PurificationConfig,
  PurificationResult,
  SqlInjectionPattern,
  ThreatMatch,
  ThreatSeverity,
  ThreatType,
  XssPattern,
  XxePattern,
} from "./declarations/purification.types";

// XSS utilities
export {
  containsXss,
  decodeHtmlEntities,
  detectXssPatterns,
  getHighestXssSeverity,
} from "./utils/xss-purify.utils";

// SQL detection utilities
export {
  containsSqlInjection,
  countSqlKeywords,
  detectSqlInjection,
  looksLikeSql,
} from "./utils/sql-detect.utils";

// XXE detection utilities
export {
  containsDangerousProtocol,
  containsDoctypeDeclaration,
  containsEntityDeclaration,
  containsXxe,
  detectXxe,
  looksLikeXml,
} from "./utils/xxe-detect.utils";

// Path traversal utilities
export {
  containsPathTraversal,
  detectPathTraversal,
  normalizePath,
  wouldEscapeBase,
} from "./utils/path-traversal.utils";
