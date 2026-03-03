import type {
  FuzzyLabelFuzzSeed,
  FuzzyLabelMutationOperation,
  LocaleMaskFixture,
  NegativeMaskFixture,
} from "../declarations/testing.types";

const FUZZY_LABEL_VALUE_SEPARATOR = ": ";

export function buildFuzzyLabelPositiveFixtures(
  seeds: readonly FuzzyLabelFuzzSeed[]
): readonly LocaleMaskFixture[] {
  return seeds.flatMap(seed => {
    return collectPositiveLabels(seed).map(label => ({
      countryProfileIds: seed.countryProfileIds,
      description: `${seed.description}: accepts noisy label "${label}"`,
      detectionMode: seed.detectionMode,
      expectedRuleIds: [seed.ruleId],
      hiddenValues: [seed.validValue],
      sourceText: `${label}${FUZZY_LABEL_VALUE_SEPARATOR}${seed.validValue}`,
    }));
  });
}

export function buildFuzzyLabelNegativeFixtures(
  seeds: readonly FuzzyLabelFuzzSeed[]
): readonly NegativeMaskFixture[] {
  return seeds.flatMap(seed => {
    const invalidValueFixtures = collectPositiveLabels(seed).map(label => ({
      countryProfileIds: seed.countryProfileIds,
      description: `${seed.description}: rejects noisy label "${label}" when the value is invalid`,
      detectionMode: seed.detectionMode,
      excludedRuleIds: [seed.ruleId],
      sourceText: `${label}${FUZZY_LABEL_VALUE_SEPARATOR}${seed.invalidValue}`,
      visibleValues: [seed.invalidValue],
    }));

    const distantLabelFixtures = seed.negativeLabels.map(label => ({
      countryProfileIds: seed.countryProfileIds,
      description: `${seed.description}: ignores distant label "${label}"`,
      detectionMode: seed.detectionMode,
      excludedRuleIds: [seed.ruleId],
      sourceText: `${label}${FUZZY_LABEL_VALUE_SEPARATOR}${seed.validValue}`,
      visibleValues: [seed.validValue],
    }));

    return [...invalidValueFixtures, ...distantLabelFixtures];
  });
}

function collectPositiveLabels(seed: FuzzyLabelFuzzSeed): readonly string[] {
  const labels = new Set<string>();

  for (const recipe of seed.positiveRecipes) {
    labels.add(applyMutationRecipe(seed.sourceLabel, recipe.operations));
  }

  for (const label of seed.extraPositiveLabels ?? []) {
    labels.add(label);
  }

  labels.delete(seed.sourceLabel);
  return Array.from(labels);
}

function applyMutationRecipe(
  sourceLabel: string,
  operations: readonly FuzzyLabelMutationOperation[]
): string {
  return operations.reduce((label, operation) => {
    switch (operation.kind) {
      case "insert-char":
        return insertCharacter(label, operation.index, operation.value);
      case "remove-char":
        return removeCharacter(label, operation.index);
      case "replace-char":
        return replaceCharacter(label, operation.index, operation.value);
      case "replace-substring":
        return replaceSubstring(label, operation.search, operation.replacement);
      case "transpose-chars":
        return transposeCharacters(label, operation.index);
    }
  }, sourceLabel);
}

function insertCharacter(
  value: string,
  index: number | undefined,
  insertedValue: string | undefined
): string {
  if (typeof index !== "number" || !insertedValue) return value;
  return `${value.slice(0, index)}${insertedValue}${value.slice(index)}`;
}

function removeCharacter(value: string, index: number | undefined): string {
  if (typeof index !== "number" || index < 0 || index >= value.length) return value;
  return `${value.slice(0, index)}${value.slice(index + 1)}`;
}

function replaceCharacter(
  value: string,
  index: number | undefined,
  replacement: string | undefined
): string {
  if (typeof index !== "number" || index < 0 || index >= value.length || !replacement) {
    return value;
  }

  return `${value.slice(0, index)}${replacement}${value.slice(index + 1)}`;
}

function replaceSubstring(
  value: string,
  search: string | undefined,
  replacement: string | undefined
): string {
  if (!search || typeof replacement !== "string") return value;
  return value.replace(search, replacement);
}

function transposeCharacters(value: string, index: number | undefined): string {
  if (typeof index !== "number" || index < 0 || index >= value.length - 1) return value;

  return [
    value.slice(0, index),
    value[index + 1],
    value[index],
    value.slice(index + 2),
  ].join("");
}
