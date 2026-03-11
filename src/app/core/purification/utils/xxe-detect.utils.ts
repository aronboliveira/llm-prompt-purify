/**
 * XXE (XML External Entity) Detection Utilities
 *
 * Isomorphic detection of XXE attack patterns in XML content.
 * Identifies entity injection, DTD attacks, and SSRF via XML.
 *
 * @module XxeDetectUtils
 */

import type {
  ThreatMatch,
  XxePattern,
} from "../declarations/purification.types";

/**
 * XXE attack patterns.
 * Covers entity injection, DTD manipulation, and SSRF vectors.
 */
const XXE_PATTERNS: readonly XxePattern[] = Object.freeze([
  // DOCTYPE declaration with SYSTEM entity
  {
    id: "xxe-doctype-system",
    pattern: /<!DOCTYPE\s+\w+\s+\[[\s\S]*?<!ENTITY\s+\w+\s+SYSTEM\s+["'][^"']*["']/giu,
    severity: "critical",
    description: "DOCTYPE with SYSTEM entity (local file access)",
  },

  // DOCTYPE with PUBLIC entity
  {
    id: "xxe-doctype-public",
    pattern: /<!DOCTYPE\s+\w+\s+PUBLIC\s+["'][^"']*["']\s+["'][^"']*["']/giu,
    severity: "high",
    description: "DOCTYPE with PUBLIC identifier",
  },

  // External DTD reference
  {
    id: "xxe-external-dtd",
    pattern: /<!DOCTYPE\s+\w+\s+SYSTEM\s+["'][^"']+["']/giu,
    severity: "critical",
    description: "External DTD reference (SSRF/XXE vector)",
  },

  // Entity declaration
  {
    id: "xxe-entity-decl",
    pattern: /<!ENTITY\s+(?:%\s+)?\w+\s+(?:SYSTEM|PUBLIC)\s+["'][^"']*["']/giu,
    severity: "critical",
    description: "Entity declaration with external reference",
  },

  // Parameter entity
  {
    id: "xxe-param-entity",
    pattern: /<!ENTITY\s+%\s+\w+\s+["'][^"']*["']/giu,
    severity: "high",
    description: "Parameter entity declaration",
  },

  // Entity reference in content
  {
    id: "xxe-entity-ref",
    pattern: /&(?!(?:amp|lt|gt|quot|apos);)[a-zA-Z_][\w.-]*;/g,
    severity: "medium",
    description: "Custom entity reference",
  },

  // File protocol in entity
  {
    id: "xxe-file-proto",
    pattern: /file:\/\/[^\s"'<>]*/giu,
    severity: "critical",
    description: "file:// protocol (local file access)",
  },

  // PHP filter for LFI
  {
    id: "xxe-php-filter",
    pattern: /php:\/\/filter\/[^\s"'<>]*/giu,
    severity: "critical",
    description: "PHP filter protocol (data exfiltration)",
  },

  // Expect protocol
  {
    id: "xxe-expect-proto",
    pattern: /expect:\/\/[^\s"'<>]*/giu,
    severity: "critical",
    description: "expect:// protocol (command execution)",
  },

  // Gopher protocol (SSRF)
  {
    id: "xxe-gopher-proto",
    pattern: /gopher:\/\/[^\s"'<>]*/giu,
    severity: "critical",
    description: "gopher:// protocol (SSRF)",
  },

  // Data protocol in XML
  {
    id: "xxe-data-proto",
    pattern: /data:text\/xml[^\s"'<>]*/giu,
    severity: "high",
    description: "data: XML protocol",
  },

  // CDATA with suspicious content
  {
    id: "xxe-cdata-suspicious",
    pattern: /<!\[CDATA\[[\s\S]*?(?:SYSTEM|ENTITY|file:\/\/|php:\/\/)[\s\S]*?\]\]>/giu,
    severity: "high",
    description: "CDATA with suspicious content",
  },

  // XInclude (alternative XXE method)
  {
    id: "xxe-xinclude",
    pattern: /<xi:include\s+[^>]*href\s*=\s*["'][^"']*["'][^>]*>/giu,
    severity: "critical",
    description: "XInclude directive",
  },
  {
    id: "xxe-xinclude-ns",
    pattern: /xmlns:xi\s*=\s*["']http:\/\/www\.w3\.org\/2001\/XInclude["']/giu,
    severity: "high",
    description: "XInclude namespace declaration",
  },

  // XSLT injection
  {
    id: "xxe-xslt-doc",
    pattern: /<xsl:(?:stylesheet|transform)\b/giu,
    severity: "high",
    description: "XSLT stylesheet declaration",
  },

  // SVG-based XXE
  {
    id: "xxe-svg-foreign",
    pattern: /<svg\b[^>]*>[\s\S]*?<!ENTITY/giu,
    severity: "critical",
    description: "SVG with entity declaration",
  },
]);

/**
 * Protocols commonly used in XXE attacks.
 */
const DANGEROUS_PROTOCOLS: readonly string[] = Object.freeze([
  "file://",
  "php://",
  "expect://",
  "gopher://",
  "jar://",
  "netdoc://",
  "dict://",
  "ldap://",
  "sftp://",
]);

/**
 * Detects XXE patterns in text.
 */
export function detectXxe(text: string): readonly ThreatMatch[] {
  const matches: ThreatMatch[] = [];

  for (const xxePattern of XXE_PATTERNS) {
    const regex = new RegExp(xxePattern.pattern.source, xxePattern.pattern.flags);

    for (const match of text.matchAll(regex)) {
      matches.push({
        type: "xxe",
        severity: xxePattern.severity,
        confidence:
          xxePattern.severity === "critical"
            ? "definite"
            : xxePattern.severity === "high"
              ? "likely"
              : "possible",
        value: match[0],
        start: match.index ?? 0,
        end: (match.index ?? 0) + match[0].length,
        ruleId: xxePattern.id,
        description: xxePattern.description,
      });
    }
  }

  return matches;
}

/**
 * Checks if text contains dangerous protocols used in XXE.
 */
export function containsDangerousProtocol(text: string): boolean {
  const lowerText = text.toLowerCase();
  return DANGEROUS_PROTOCOLS.some(proto => lowerText.includes(proto));
}

/**
 * Checks if text contains DOCTYPE declarations.
 */
export function containsDoctypeDeclaration(text: string): boolean {
  return /<!DOCTYPE\b/iu.test(text);
}

/**
 * Checks if text contains entity declarations.
 */
export function containsEntityDeclaration(text: string): boolean {
  return /<!ENTITY\b/iu.test(text);
}

/**
 * Checks if text contains high-severity XXE patterns.
 */
export function containsXxe(text: string): boolean {
  const threats = detectXxe(text);
  return threats.some(
    t => t.severity === "critical" || t.severity === "high",
  );
}

/**
 * Checks if content appears to be XML.
 */
export function looksLikeXml(text: string): boolean {
  const trimmed = text.trim();
  return (
    trimmed.startsWith("<?xml") ||
    trimmed.startsWith("<!DOCTYPE") ||
    /^<[a-zA-Z][\w:.-]*(?:\s|>)/u.test(trimmed)
  );
}

/**
 * Strips DOCTYPE declarations and entity definitions from XML.
 * This is a defense-in-depth measure for XML content.
 */
export function neutralizeXxe(xml: string): string {
  return xml
    // Remove DOCTYPE declarations
    .replace(/<!DOCTYPE[^>]*(?:\[[^\]]*\])?\s*>/giu, "")
    // Remove entity declarations
    .replace(/<!ENTITY[^>]*>/giu, "")
    // Remove CDATA sections containing dangerous content
    .replace(
      /<!\[CDATA\[[\s\S]*?(?:SYSTEM|ENTITY|file:\/\/|php:\/\/)[\s\S]*?\]\]>/giu,
      "",
    );
}
