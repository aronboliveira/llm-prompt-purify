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
/**
 * Builds a regex that matches config-file-style secret assignments.
 *
 * Matches patterns common in .env, .yaml, .toml, docker-compose, k8s configs,
 * cloud provider secrets, and password-manager exports where keys use
 * underscore/hyphen/dot separators with secret-related words.
 *
 * Single-word keywords (password, secret, token, etc.) require a word-char
 * PREFIX before the keyword — this prevents matching bare prose like
 * "password: abc". Multi-word keywords (api key, database url, etc.) have
 * no prefix requirement since the multi-word structure itself signals a
 * config-file context.
 *
 * Examples matched:
 *   SMTP_PASSWORD=value       (SMTP_ prefix + password)
 *   DATABASE_URL=postgresql://u:p@h/db  (database + url, multi-word)
 *   POSTGRES_PASSWORD=postgres
 *   db-secret: abc123
 *   app.token = "some-token"
 *
 * Examples NOT matched:
 *   password: abc             (bare single-word, no prefix)
 *   token=internal            (bare single-word, no prefix)
 */
export function buildConfigSecretAssignmentPattern(
  keywords: readonly string[],
): RegExp {
  const singleWord: string[] = [];
  const multiWord: string[] = [];

  for (const k of keywords) {
    const trimmed = k.trim();
    if (!trimmed) continue;
    if (trimmed.includes(" ")) {
      multiWord.push(trimmed);
    } else {
      singleWord.push(trimmed);
    }
  }

  const escapeAlt = (words: string[]) =>
    words
      .map(w => w.split(/\s+/u).map(escapeRegexLiteral).join(String.raw`[\s._-]+`))
      .join("|");

  const patterns: string[] = [];
  if (singleWord.length > 0) {
    patterns.push(
      String.raw`[\w._-]+?(?:${escapeAlt(singleWord)})`,
    );
  }
  if (multiWord.length > 0) {
    patterns.push(
      String.raw`[\w._-]*?(?:${escapeAlt(multiWord)})`,
    );
  }

  const keySuffix = String.raw`[\w._-]*`;

  return new RegExp(
    String.raw`(?:^|[\s;{}])(?:${patterns.join("|")})${keySuffix}\s*[:=]\s*["']?(\S*)["']?(?:$|[\s;{}])`,
    "gimu",
  );
}
