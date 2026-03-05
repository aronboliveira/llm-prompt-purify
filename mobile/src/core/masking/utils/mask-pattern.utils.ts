/** Ported from Angular app. */
const FLEXIBLE_LABEL_JOINER_PATTERN = String.raw`(?:[\s._-]+)`;
const UNICODE_WORD_CHARACTER_CLASS = String.raw`[\p{L}\p{N}]`;

interface DelimitedPatternOptions {
  bounded?: boolean;
  delimiterPattern?: string;
  flags?: string;
  quoteWrapped?: boolean;
}

export function buildFlexibleLabelAlternation(labels: readonly string[]): string {
  return labels
    .map(label => label.trim())
    .filter(Boolean)
    .map(escapeFlexibleLabel)
    .join("|");
}

export function buildUnicodeBoundedLabelPattern(labels: readonly string[]): string {
  return wrapWithUnicodeBoundaries(buildFlexibleLabelAlternation(labels));
}

export function createDelimitedLabelValuePattern(
  labels: readonly string[],
  valuePattern: string,
  options: DelimitedPatternOptions = {}
): RegExp {
  const delimiterPattern = options.delimiterPattern ?? String.raw`[:=-]`,
    flags = options.flags ?? "giu",
    labelPattern = options.bounded === false
      ? `(?:${buildFlexibleLabelAlternation(labels)})`
      : buildUnicodeBoundedLabelPattern(labels),
    wrappedValuePattern = options.quoteWrapped
      ? String.raw`["']?(${valuePattern})["']?`
      : `(${valuePattern})`;

  return new RegExp(
    String.raw`${labelPattern}\s*${delimiterPattern}\s*${wrappedValuePattern}`,
    flags
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
