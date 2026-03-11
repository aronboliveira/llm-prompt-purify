/**
 * Path Traversal Detection Utilities
 *
 * Detects directory traversal attacks in file paths and URLs.
 * Isomorphic implementation for browser and Node.js.
 *
 * @module PathTraversalUtils
 */

import type { ThreatMatch } from "../declarations/purification.types";

/**
 * Path traversal attack patterns.
 */
const PATH_TRAVERSAL_PATTERNS: readonly {
  id: string;
  pattern: RegExp;
  description: string;
}[] = Object.freeze([
  // Unix-style traversal
  {
    id: "path-unix-traversal",
    pattern: /(?:\.\.\/){2,}/g,
    description: "Unix directory traversal (multiple ../)",
  },

  // Windows-style traversal
  {
    id: "path-windows-traversal",
    pattern: /(?:\.\.\\){2,}/g,
    description: "Windows directory traversal (multiple ..\\)",
  },

  // URL-encoded traversal
  {
    id: "path-encoded-traversal",
    pattern: /(?:%2e%2e[%2f%5c]){2,}/giu,
    description: "URL-encoded directory traversal",
  },

  // Double URL encoding
  {
    id: "path-double-encoded",
    pattern: /%252e%252e%252f/giu,
    description: "Double URL-encoded traversal",
  },

  // Null byte injection
  {
    id: "path-null-byte",
    pattern: /%00|\\x00|\\0/giu,
    description: "Null byte injection",
  },

  // Sensitive Unix paths
  {
    id: "path-unix-sensitive",
    pattern: /\/etc\/(?:passwd|shadow|hosts|sudoers|crontab)/giu,
    description: "Sensitive Unix file path",
  },

  // Sensitive Windows paths
  {
    id: "path-windows-sensitive",
    pattern: /(?:C:|\\\\)[^\s]*(?:boot\.ini|win\.ini|system32|windows\\system)/giu,
    description: "Sensitive Windows file path",
  },

  // Absolute path starting with root
  {
    id: "path-absolute-unix",
    pattern: /^\/(?:etc|var|usr|home|root|tmp|proc|sys)\//gmu,
    description: "Absolute Unix path",
  },

  // Proc filesystem access
  {
    id: "path-proc-access",
    pattern: /\/proc\/(?:self|[0-9]+)\/(?:cmdline|environ|fd|maps)/g,
    description: "/proc filesystem access",
  },
]);

/**
 * Attempts URL-decoding of input safely.
 */
function tryUrlDecode(input: string): string | null {
  try {
    const decoded = decodeURIComponent(input);
    return decoded !== input ? decoded : null;
  } catch {
    return null;
  }
}

/**
 * Detects path traversal patterns in text.
 * Also checks URL-decoded version to catch encoded attacks.
 */
export function detectPathTraversal(text: string): readonly ThreatMatch[] {
  const matches: ThreatMatch[] = [];

  // Test both original and URL-decoded versions
  const decoded = tryUrlDecode(text);
  const inputs: readonly string[] = decoded ? [text, decoded] : [text];

  for (const testInput of inputs) {
    for (const pathPattern of PATH_TRAVERSAL_PATTERNS) {
      const regex = new RegExp(pathPattern.pattern.source, pathPattern.pattern.flags);

      for (const match of testInput.matchAll(regex)) {
        // Avoid duplicates
        const alreadyFound = matches.some(
          m => m.ruleId === pathPattern.id && m.value === match[0]
        );
        if (!alreadyFound) {
          matches.push({
            type: "path-traversal",
            severity: "high",
            confidence: "likely",
            value: match[0],
            start: match.index ?? 0,
            end: (match.index ?? 0) + match[0].length,
            ruleId: pathPattern.id,
            description: pathPattern.description,
          });
        }
      }
    }
  }

  return matches;
}

/**
 * Checks if text contains path traversal patterns.
 */
export function containsPathTraversal(text: string): boolean {
  return detectPathTraversal(text).length > 0;
}

/**
 * Normalizes a path by resolving . and .. components.
 * Used to detect if a path would escape its base directory.
 */
export function normalizePath(path: string): string {
  const segments: string[] = [];
  const parts = path.split(/[/\\]/);

  for (const part of parts) {
    if (part === "..") {
      segments.pop();
    } else if (part !== "." && part !== "") {
      segments.push(part);
    }
  }

  return segments.join("/");
}

/**
 * Checks if a path would escape its base directory.
 */
export function wouldEscapeBase(path: string, maxDepth = 0): boolean {
  let depth = 0;
  let minDepth = 0;
  const parts = path.split(/[/\\]/);

  for (const part of parts) {
    if (part === "..") {
      depth--;
      if (depth < minDepth) {
        minDepth = depth;
      }
    } else if (part !== "." && part !== "") {
      depth++;
    }
  }

  // If minDepth goes below maxDepth (usually 0), path escapes base
  return minDepth < -maxDepth;
}

/**
 * Sanitizes a path by removing traversal sequences.
 */
export function sanitizePath(path: string): string {
  return path
    // Remove null bytes
    .replace(/%00|\\x00|\\0/g, "")
    // Remove traversal sequences
    .replace(/\.\.[/\\]/g, "")
    // Remove leading slashes (for relative paths)
    .replace(/^[/\\]+/, "")
    // Normalize to forward slashes
    .replace(/\\/g, "/");
}
