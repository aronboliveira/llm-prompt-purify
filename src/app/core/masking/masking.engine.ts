import { MASKING_RULES } from "./constants/masking-rules.constants";
import type {
  AdvancedMaskingPreferences,
  MaskGroupPreferenceMap,
  MaskingStrategy,
  ScanMatch,
  ScanResult,
  ScanScopeSelection,
  XmlWrapTag,
} from "./declarations/masking.types";
import { filterRulesForScope } from "./utils/country-scope.utils";
import { collectFuzzyLabelCandidates } from "./utils/fuzzy-label.utils";
import { createDistinctMask } from "./utils/mask-format.utils";
import {
  applyEnabledMasks,
  applyGroupPreferences,
  extractCandidateMatch,
  resolveOverlaps,
  summarizeGroupCounts,
} from "./utils/mask-match.utils";
import {
  createFakerCounterState,
  createMaskForStrategy,
  expandCredentialPrefixes,
  findBlocklistMatches,
  type FakerCounterState,
  isIgnored,
  wrapInXmlTag,
} from "./utils/mask-strategy.utils";

export class MaskingEngine {
  public rebuild(
    sourceText: string,
    matches: readonly ScanMatch[],
    scannedAt: string,
    advancedPrefs?: AdvancedMaskingPreferences,
  ): ScanResult {
    const normalizedMatches = [...matches].sort(
        (left, right) => left.start - right.start,
      ),
      rawMaskedText = applyEnabledMasks(sourceText, normalizedMatches),
      maskedText =
        advancedPrefs?.xmlWrapEnabled && advancedPrefs.xmlWrapTag
          ? wrapInXmlTag(rawMaskedText, advancedPrefs.xmlWrapTag)
          : rawMaskedText,
      enabledMatches = normalizedMatches.filter(match => match.enabled).length;

    return {
      enabledMatches,
      groupCounts: summarizeGroupCounts(normalizedMatches),
      hasMatches: normalizedMatches.length > 0,
      maskedText,
      matches: normalizedMatches,
      scannedAt,
      sourceText,
      totalMatches: normalizedMatches.length,
    };
  }

  public regenerateAll(
    sourceText: string,
    matches: readonly ScanMatch[],
    scannedAt: string,
    strategy: MaskingStrategy = "random",
    advancedPrefs?: AdvancedMaskingPreferences,
  ): ScanResult {
    const fakerCounter =
        strategy === "faker" ? createFakerCounterState() : undefined,
      nextMasks = new Map<string, string>(),
      updatedMatches = matches.map(match => {
        const nextMask =
          nextMasks.get(match.value) ??
          createMaskForStrategy(
            match.value,
            match.ruleId,
            match.category,
            strategy,
            nextMasks.get(match.value),
            fakerCounter,
          );

        nextMasks.set(match.value, nextMask);
        return { ...match, mask: nextMask };
      });

    return this.rebuild(sourceText, updatedMatches, scannedAt, advancedPrefs);
  }

  public regenerateMatch(
    sourceText: string,
    matches: readonly ScanMatch[],
    scannedAt: string,
    matchId: string,
    strategy: MaskingStrategy = "random",
    advancedPrefs?: AdvancedMaskingPreferences,
  ): ScanResult {
    const targetMatch = matches.find(match => match.id === matchId);
    if (!targetMatch)
      return this.rebuild(sourceText, matches, scannedAt, advancedPrefs);

    // For single match regeneration with faker, create fresh counter (starts at 1)
    const fakerCounter =
        strategy === "faker" ? createFakerCounterState() : undefined,
      nextMask = createMaskForStrategy(
        targetMatch.value,
        targetMatch.ruleId,
        targetMatch.category,
        strategy,
        targetMatch.mask,
        fakerCounter,
      ),
      updatedMatches = matches.map(match =>
        match.value === targetMatch.value
          ? { ...match, mask: nextMask }
          : match,
      );

    return this.rebuild(sourceText, updatedMatches, scannedAt, advancedPrefs);
  }

  public scan(
    sourceText: string,
    groupPreferences: MaskGroupPreferenceMap,
    scopeSelection: ScanScopeSelection,
    scannedAt = new Date().toISOString(),
    advancedPrefs?: AdvancedMaskingPreferences,
  ): ScanResult {
    const strategy = advancedPrefs?.maskingStrategy ?? "random",
      fakerCounter =
        strategy === "faker" ? createFakerCounterState() : undefined,
      ignoreList = advancedPrefs?.globalIgnoreList ?? [],
      blocklist = advancedPrefs?.keywordBlocklist ?? [],
      maskTimestamps = advancedPrefs?.maskTimestamps ?? false,
      scopeFilteredRules = filterRulesForScope(MASKING_RULES, scopeSelection),
      // Filter out timestamp rules if maskTimestamps is false
      activeRules = maskTimestamps
        ? scopeFilteredRules
        : scopeFilteredRules.filter(rule => !rule.id.startsWith("timestamp-")),
      regexCandidates = activeRules.flatMap(rule => {
        return Array.from(sourceText.matchAll(rule.patternFactory()))
          .map(match => extractCandidateMatch(match, rule))
          .filter((match): match is NonNullable<typeof match> => {
            if (!match?.value) return false;
            // Skip values in the global ignore list
            if (isIgnored(match.value, ignoreList)) return false;
            return rule.validator ? rule.validator(match.value) : true;
          });
      }),
      fuzzyCandidates = collectFuzzyLabelCandidates(
        sourceText,
        activeRules,
      ).filter(c => !isIgnored(c.value, ignoreList)),
      candidates = [...regexCandidates, ...fuzzyCandidates],
      resolvedMatches = resolveOverlaps(candidates),
      maskByValue = new Map<string, string>(),
      matches = resolvedMatches.map(candidate => {
        const mask =
          maskByValue.get(candidate.value) ??
          createMaskForStrategy(
            candidate.value,
            candidate.rule.id,
            candidate.rule.category,
            strategy,
            undefined,
            fakerCounter,
          );
        maskByValue.set(candidate.value, mask);

        return {
          category: candidate.rule.category,
          confidence: candidate.rule.confidence,
          enabled: true,
          end: candidate.end,
          groupId: candidate.rule.category,
          id: `${candidate.rule.id}:${candidate.start}:${candidate.end}`,
          label: candidate.rule.label,
          locale: candidate.rule.locale,
          locked: false,
          mask,
          ruleId: candidate.rule.id,
          start: candidate.start,
          value: candidate.value,
        } satisfies ScanMatch;
      }),
      // ── Keyword Blocklist Matches ───────────────────────────
      blocklistHits = findBlocklistMatches(sourceText, blocklist),
      blocklistMatches: ScanMatch[] = blocklistHits
        .filter(
          hit => !matches.some(m => m.start <= hit.start && m.end >= hit.end),
        )
        .map((hit, i) => ({
          category: "personal" as const,
          confidence: "high" as const,
          enabled: true,
          end: hit.end,
          groupId: "personal" as const,
          id: `blocklist:${hit.keyword}:${hit.start}:${hit.end}`,
          label: `Blocklist: ${hit.keyword}`,
          locale: "shared" as const,
          locked: false,
          mask: createMaskForStrategy(
            hit.value,
            "blocklist-keyword",
            "personal",
            strategy,
            undefined,
            fakerCounter,
          ),
          ruleId: "blocklist-keyword",
          start: hit.start,
          value: hit.value,
        })),
      allMatches = resolveBlocklistOverlaps([
        ...matches,
        ...expandCredentialPrefixes(sourceText, matches),
        ...blocklistMatches,
      ]),
      governedMatches = applyGroupPreferences(allMatches, groupPreferences);

    return this.rebuild(sourceText, governedMatches, scannedAt, advancedPrefs);
  }
}

/**
 * Resolves overlaps between regular matches and blocklist matches,
 * preferring regular detection matches when ranges overlap.
 */
function resolveBlocklistOverlaps(
  matches: readonly ScanMatch[],
): readonly ScanMatch[] {
  const sorted = [...matches].sort((a, b) => a.start - b.start);
  const resolved: ScanMatch[] = [];

  for (const match of sorted) {
    const prev = resolved.at(-1);
    if (!prev || match.start >= prev.end) {
      resolved.push(match);
    } else if (!match.ruleId.startsWith("blocklist")) {
      // Prefer rule-based match over blocklist
      resolved[resolved.length - 1] = match;
    }
    // else: skip blocklist hit that overlaps with existing match
  }

  return resolved;
}
