/**
 * Isomorphic Content Purification Service
 *
 * Provides unified content sanitization and threat detection for both
 * client-side (browser) and server-side (SSR/Node.js) environments.
 *
 * Supports detection and neutralization of:
 * - XSS (Cross-Site Scripting)
 * - XXE (XML External Entity)
 * - SQL Injection
 * - Path Traversal
 *
 * @example
 * ```typescript
 * const purifier = new ContentPurifier();
 * const result = purifier.purify('<script>alert("xss")</script>');
 *
 * if (result.hasThreats) {
 *   console.log('Threats detected:', result.threats);
 * }
 *
 * // Use the sanitized output
 * console.log(result.purifiedText);
 * ```
 *
 * @module ContentPurifier
 */

import type {
  PurificationConfig,
  PurificationResult,
  ThreatMatch,
  ThreatType,
} from "./declarations/purification.types";
import {
  containsPathTraversal,
  detectPathTraversal,
} from "./utils/path-traversal.utils";
import {
  containsSqlInjection,
  detectSqlInjection,
} from "./utils/sql-detect.utils";
import {
  containsXss,
  detectXssPatterns,
  encodeHtmlEntities,
  stripHtmlTags,
} from "./utils/xss-purify.utils";
import {
  containsXxe,
  detectXxe,
  neutralizeXxe,
} from "./utils/xxe-detect.utils";

/**
 * Default purification configuration.
 * Enables all detection and safe sanitization by default.
 */
export const DEFAULT_PURIFICATION_CONFIG: PurificationConfig = Object.freeze({
  detectXss: true,
  detectXxe: true,
  detectSqlInjection: true,
  detectPathTraversal: true,
  stripThreats: true,
  encodeHtml: true,
  neutralizeUrls: false,
  allowedTags: undefined,
});

/**
 * Isomorphic content purification service.
 *
 * Works in both browser and Node.js environments without DOM dependencies.
 * Uses pattern-based detection and string manipulation for sanitization.
 */
export class ContentPurifier {
  readonly #config: PurificationConfig;

  constructor(config: Partial<PurificationConfig> = {}) {
    this.#config = { ...DEFAULT_PURIFICATION_CONFIG, ...config };
  }

  /**
   * Creates a new purifier with custom configuration.
   */
  static create(config: Partial<PurificationConfig> = {}): ContentPurifier {
    return new ContentPurifier(config);
  }

  /**
   * Detects all threats in the given text without modifying it.
   */
  detect(text: string): readonly ThreatMatch[] {
    const threats: ThreatMatch[] = [];

    if (this.#config.detectXss) {
      threats.push(...detectXssPatterns(text));
    }

    if (this.#config.detectXxe) {
      threats.push(...detectXxe(text));
    }

    if (this.#config.detectSqlInjection) {
      threats.push(...detectSqlInjection(text));
    }

    if (this.#config.detectPathTraversal) {
      threats.push(...detectPathTraversal(text));
    }

    // Sort by start position
    threats.sort((a, b) => a.start - b.start);

    return threats;
  }

  /**
   * Purifies text by detecting threats and optionally sanitizing.
   */
  purify(
    text: string,
    configOverride: Partial<PurificationConfig> = {},
  ): PurificationResult {
    const config = { ...this.#config, ...configOverride },
      threats = this.detect(text);

    let purifiedText = text;

    if (config.stripThreats && threats.length > 0) {
      purifiedText = this.#stripThreatsFromText(purifiedText, threats);
    }

    if (config.encodeHtml) {
      purifiedText = encodeHtmlEntities(purifiedText);
    }

    const threatCounts = this.#countThreats(threats);

    return {
      originalText: text,
      purifiedText,
      threats,
      hasThreats: threats.length > 0,
      threatCounts,
      purifiedAt: new Date().toISOString(),
    };
  }

  /**
   * Sanitizes HTML content for safe display.
   * Strips dangerous tags and encodes entities.
   */
  sanitizeHtml(html: string): string {
    let result = html;

    // Strip dangerous tags
    result = stripHtmlTags(result);

    // Encode remaining entities
    if (this.#config.encodeHtml) {
      result = encodeHtmlEntities(result);
    }

    return result;
  }

  /**
   * Sanitizes XML content by removing XXE vectors.
   */
  sanitizeXml(xml: string): string {
    return neutralizeXxe(xml);
  }

  /**
   * Quick check if content contains any high-severity threats.
   */
  containsThreats(text: string): boolean {
    return (
      (this.#config.detectXss && containsXss(text)) ||
      (this.#config.detectXxe && containsXxe(text)) ||
      (this.#config.detectSqlInjection && containsSqlInjection(text)) ||
      (this.#config.detectPathTraversal && containsPathTraversal(text))
    );
  }

  /**
   * Gets the current configuration.
   */
  getConfig(): Readonly<PurificationConfig> {
    return this.#config;
  }

  /**
   * Creates a sanitized version of text suitable for LLM prompts.
   * This is an alias for purify() with aggressive settings.
   */
  purifyForLlm(text: string): PurificationResult {
    return this.purify(text, {
      stripThreats: true,
      encodeHtml: false, // LLMs understand raw text better
      detectXss: true,
      detectXxe: true,
      detectSqlInjection: true,
      detectPathTraversal: true,
    });
  }

  /**
   * Strips detected threats from text.
   * Handles overlapping ranges by merging them first.
   */
  #stripThreatsFromText(text: string, threats: readonly ThreatMatch[]): string {
    if (threats.length === 0) return text;

    // Merge overlapping ranges
    const sorted = [...threats].sort((a, b) => a.start - b.start);
    const merged: { start: number; end: number }[] = [];

    for (const threat of sorted) {
      const last = merged[merged.length - 1];
      if (last && threat.start <= last.end) {
        // Overlapping - extend the last range
        last.end = Math.max(last.end, threat.end);
      } else {
        merged.push({ start: threat.start, end: threat.end });
      }
    }

    // Remove ranges in reverse order to preserve indices
    let result = text;
    for (let i = merged.length - 1; i >= 0; i--) {
      const range = merged[i];
      result = result.slice(0, range.start) + result.slice(range.end);
    }

    return result;
  }

  /**
   * Counts threats by type.
   */
  #countThreats(threats: readonly ThreatMatch[]): Record<ThreatType, number> {
    const counts: Record<ThreatType, number> = {
      xss: 0,
      xxe: 0,
      "sql-injection": 0,
      "path-traversal": 0,
    };

    for (const threat of threats) {
      counts[threat.type]++;
    }

    return counts;
  }
}

/**
 * Standalone purification function for use without Angular DI.
 * Useful in Node.js scripts or non-Angular contexts.
 */
export function purifyContent(
  text: string,
  config: Partial<PurificationConfig> = {},
): PurificationResult {
  const purifier = new ContentPurifier(config);
  return purifier.purify(text);
}

/**
 * Quick detection function for threat checking.
 */
export function detectThreats(text: string): readonly ThreatMatch[] {
  const purifier = new ContentPurifier();
  return purifier.detect(text);
}

/**
 * Checks if content contains any high-severity threats.
 */
export function hasThreats(text: string): boolean {
  const purifier = new ContentPurifier();
  return purifier.containsThreats(text);
}

// Re-export utilities for direct use
export {
  encodeHtmlEntities,
  sanitizeXss,
  stripHtmlTags,
} from "./utils/xss-purify.utils";
export { neutralizeSqlInjection } from "./utils/sql-detect.utils";
export { neutralizeXxe } from "./utils/xxe-detect.utils";
export { sanitizePath } from "./utils/path-traversal.utils";
