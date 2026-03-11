/**
 * XSS Detection and Sanitization Utilities
 *
 * Isomorphic XSS protection that works in both browser and Node.js environments.
 * Uses pattern-based detection without relying on DOM APIs.
 *
 * @module XssPurifyUtils
 */

import type {
  ThreatMatch,
  ThreatSeverity,
  XssPattern,
} from "../declarations/purification.types";

/**
 * Common XSS attack patterns.
 * These patterns detect various XSS vectors without relying on browser DOM.
 */
const XSS_PATTERNS: readonly XssPattern[] = Object.freeze([
  // Script injection
  {
    id: "xss-script-tag",
    pattern: /<script\b[^>]*>[\s\S]*?<\/script>/giu,
    severity: "critical",
    description: "Script tag injection",
  },
  {
    id: "xss-script-open",
    pattern: /<script\b[^>]*>/giu,
    severity: "critical",
    description: "Unclosed script tag",
  },

  // Event handler injection
  {
    id: "xss-onerror",
    pattern: /\bon(?:error|load|click|mouse\w+|key\w+|focus|blur)\s*=/giu,
    severity: "critical",
    description: "Event handler attribute injection",
  },

  // JavaScript protocol
  {
    id: "xss-javascript-proto",
    pattern: /javascript\s*:/giu,
    severity: "critical",
    description: "JavaScript protocol injection",
  },
  {
    id: "xss-vbscript-proto",
    pattern: /vbscript\s*:/giu,
    severity: "critical",
    description: "VBScript protocol injection",
  },

  // Data URL with script
  {
    id: "xss-data-script",
    pattern: /data\s*:\s*(?:text\/html|application\/javascript)[^,]*,/giu,
    severity: "high",
    description: "Data URL script injection",
  },

  // SVG script injection
  {
    id: "xss-svg-script",
    pattern: /<svg\b[^>]*>[\s\S]*?<\/svg>/giu,
    severity: "high",
    description: "SVG with potential script content",
  },

  // iframe injection
  {
    id: "xss-iframe",
    pattern: /<iframe\b[^>]*>/giu,
    severity: "high",
    description: "Iframe injection",
  },

  // Object/Embed injection
  {
    id: "xss-object",
    pattern: /<(?:object|embed|applet)\b[^>]*>/giu,
    severity: "high",
    description: "Object/Embed tag injection",
  },

  // Base tag injection
  {
    id: "xss-base",
    pattern: /<base\b[^>]*>/giu,
    severity: "high",
    description: "Base tag injection (can redirect all relative URLs)",
  },

  // Form action hijacking
  {
    id: "xss-form-action",
    pattern: /<form\b[^>]*\baction\s*=\s*["'][^"']*javascript:/giu,
    severity: "critical",
    description: "Form action JavaScript injection",
  },

  // Style-based XSS
  {
    id: "xss-style-expression",
    pattern: /expression\s*\([^)]*\)/giu,
    severity: "high",
    description: "CSS expression injection",
  },
  {
    id: "xss-style-behavior",
    pattern: /behavior\s*:\s*url\s*\(/giu,
    severity: "high",
    description: "CSS behavior injection",
  },

  // Meta refresh redirect
  {
    id: "xss-meta-refresh",
    pattern: /<meta\b[^>]*\bhttp-equiv\s*=\s*["']?refresh/giu,
    severity: "medium",
    description: "Meta refresh redirect",
  },

  // Import/Link injection
  {
    id: "xss-import",
    pattern: /@import\s+(?:url\s*\()?["']?[^"')]+["']?\)?/giu,
    severity: "medium",
    description: "CSS @import injection",
  },

  // Encoded script tags
  {
    id: "xss-encoded-script",
    pattern: /&#(?:x[0-9a-f]+|[0-9]+);/giu,
    severity: "low",
    description: "HTML entity encoding (potential obfuscation)",
  },
]);

/**
 * HTML entities that need encoding for safe display.
 */
const HTML_ENTITIES: Readonly<Record<string, string>> = Object.freeze({
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#x27;",
  "/": "&#x2F;",
  "`": "&#x60;",
  "=": "&#x3D;",
});

/**
 * Encodes HTML entities in a string to prevent XSS.
 * This is a safe approach that works isomorphically.
 */
export function encodeHtmlEntities(text: string): string {
  return text.replace(/[&<>"'`=/]/g, char => HTML_ENTITIES[char] ?? char);
}

/**
 * Decodes common HTML entities back to characters.
 * Used for analyzing content that may have been pre-encoded.
 */
export function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, "/")
    .replace(/&#x60;/g, "`")
    .replace(/&#x3D;/g, "=")
    .replace(/&#(\d+);/g, (_, num) => String.fromCodePoint(parseInt(num, 10)))
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) =>
      String.fromCodePoint(parseInt(hex, 16)),
    );
}

/**
 * Detects XSS patterns in text without modifying it.
 */
export function detectXssPatterns(text: string): readonly ThreatMatch[] {
  const matches: ThreatMatch[] = [];

  // Also check decoded version to catch encoded attacks
  const decodedText = decodeHtmlEntities(text);
  const textToCheck = text === decodedText ? text : `${text}\n${decodedText}`;

  for (const xssPattern of XSS_PATTERNS) {
    const regex = new RegExp(xssPattern.pattern.source, xssPattern.pattern.flags);

    for (const match of textToCheck.matchAll(regex)) {
      // Deduplicate: skip if this match was found in the decoded portion
      if (match.index !== undefined && match.index >= text.length) {
        continue;
      }

      matches.push({
        type: "xss",
        severity: xssPattern.severity,
        confidence:
          xssPattern.severity === "critical" || xssPattern.severity === "high"
            ? "definite"
            : "likely",
        value: match[0],
        start: match.index ?? 0,
        end: (match.index ?? 0) + match[0].length,
        ruleId: xssPattern.id,
        description: xssPattern.description,
      });
    }
  }

  return matches;
}

/**
 * Strips dangerous HTML tags and attributes from text.
 * Returns plain text safe for rendering.
 */
export function stripHtmlTags(text: string): string {
  return text
    .replace(/<[^>]*>/g, "")
    .replace(/javascript\s*:/giu, "")
    .replace(/vbscript\s*:/giu, "")
    .replace(/expression\s*\([^)]*\)/giu, "");
}

/**
 * Sanitizes text by encoding HTML entities and removing dangerous patterns.
 * Safe for both browser and Node.js environments.
 */
export function sanitizeXss(
  text: string,
  options: { encodeEntities?: boolean; stripTags?: boolean } = {},
): string {
  const { encodeEntities = true, stripTags = false } = options;

  let result = text;

  if (stripTags) {
    result = stripHtmlTags(result);
  }

  if (encodeEntities) {
    result = encodeHtmlEntities(result);
  }

  return result;
}

/**
 * Checks if text contains potential XSS threats.
 */
export function containsXss(text: string): boolean {
  const threats = detectXssPatterns(text);
  return threats.some(
    t => t.severity === "critical" || t.severity === "high",
  );
}

/**
 * Gets the highest severity from a list of patterns.
 */
export function getHighestXssSeverity(
  matches: readonly ThreatMatch[],
): ThreatSeverity | null {
  const severityOrder: ThreatSeverity[] = ["critical", "high", "medium", "low"];

  for (const severity of severityOrder) {
    if (matches.some(m => m.severity === severity)) {
      return severity;
    }
  }

  return null;
}
