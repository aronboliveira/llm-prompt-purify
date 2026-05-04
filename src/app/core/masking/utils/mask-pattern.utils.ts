import type { DelimitedPatternOptions } from "../declarations/mask-pattern.types";

const FLEXIBLE_LABEL_JOINER_PATTERN = String.raw`(?:[\s._-]+)`,
  UNICODE_WORD_CHARACTER_CLASS = String.raw`[\p{L}\p{N}]`;

export function buildFlexibleLabelAlternation(
  labels: readonly string[],
): string {
  return labels
    .map(label => label.trim())
    .filter(Boolean)
    .map(escapeFlexibleLabel)
    .join("|");
}

export function buildUnicodeBoundedLabelPattern(
  labels: readonly string[],
): string {
  return wrapWithUnicodeBoundaries(buildFlexibleLabelAlternation(labels));
}

export function createDelimitedLabelValuePattern(
  labels: readonly string[],
  valuePattern: string,
  options: DelimitedPatternOptions = {},
): RegExp {
  const delimiterPattern = options.delimiterPattern ?? String.raw`[:=-]`,
    flags = options.flags ?? "giu",
    labelPattern =
      options.bounded === false
        ? `(?:${buildFlexibleLabelAlternation(labels)})`
        : buildUnicodeBoundedLabelPattern(labels),
    wrappedValuePattern = options.quoteWrapped
      ? String.raw`["']?(${valuePattern})["']?`
      : `(${valuePattern})`;

  return new RegExp(
    String.raw`${labelPattern}\s*${delimiterPattern}\s*${wrappedValuePattern}`,
    flags,
  );
}

function escapeFlexibleLabel(label: string): string {
  return label
    .trim()
    .split(/\s+/u)
    .filter(Boolean)
    .map(escapeRegexLiteral)
    .join(FLEXIBLE_LABEL_JOINER_PATTERN);
}

function escapeRegexLiteral(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/gu, String.raw`\$&`);
}

function wrapWithUnicodeBoundaries(pattern: string): string {
  return String.raw`(?<!${UNICODE_WORD_CHARACTER_CLASS})(?:${pattern})(?!${UNICODE_WORD_CHARACTER_CLASS})`;
}

/**
 * Builds a regex that matches config-file-style secret assignments.
 *
 * Matches patterns common in .env, .yaml, .toml, docker-compose, k8s configs,
 * cloud provider secrets, and password-manager exports where keys use
 * underscore/hyphen/dot separators with secret-related words.
 *
 * Examples matched:
 *   SMTP_PASSWORD=value
 *   POSTGRES_PASSWORD=postgres
 *   db-secret: abc123
 *   app.token = "some-token"
 *   DATABASE_URL=postgresql://user:pass@host/db
 *
 * Uses a lenient value pattern (1+ non-whitespace chars) with no character-class
 * validator to catch simple passwords and connection strings that the stricter
 * label-based rules would miss.
 */
export function buildConfigSecretAssignmentPattern(
  keywords: readonly string[],
): RegExp {
  const escaped = keywords
    .map(k => k.trim())
    .filter(Boolean)
    .map(k => k.split(/\s+/u).map(escapeRegexLiteral).join(String.raw`[\s._-]+`));

  const alternation = escaped.join("|");
  const keySuffix = String.raw`[\w._-]*`;

  return new RegExp(
    String.raw`(?:^|[\s;{}])[\w._-]*?(?:${alternation})${keySuffix}\s*[:=]\s*["']?(\S*)["']?(?:$|[\s;{}])`,
    "gimu",
  );
}
