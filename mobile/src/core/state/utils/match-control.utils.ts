import type {
  MaskGroupPreferenceMap,
  ScanMatch,
} from "../../masking/declarations/masking.types";

/**
 * Updates a single match's enabled state by ID.
 * Locked matches cannot be changed.
 */
export function toggleMatchEnabled(
  matches: readonly ScanMatch[],
  matchId: string,
  enabled: boolean,
): ScanMatch[] {
  return matches.map(match => {
    if (match.id !== matchId || match.locked) return match;
    return { ...match, enabled };
  });
}

/**
 * Sets enabled state for all editable (non-locked) matches
 * whose group is enabled.
 */
export function setAllEditableMatchesEnabled(
  matches: readonly ScanMatch[],
  groupPreferences: MaskGroupPreferenceMap,
  enabled: boolean,
): ScanMatch[] {
  return matches.map(match => {
    if (match.locked || !groupPreferences[match.groupId].enabled) return match;
    return { ...match, enabled };
  });
}

/**
 * Counts the number of editable (non-locked) matches.
 */
export function countEditableMatches(matches: readonly ScanMatch[]): number {
  return matches.filter(match => !match.locked).length;
}

/**
 * Counts enabled matches across all groups.
 */
export function countEnabledMatches(matches: readonly ScanMatch[]): number {
  return matches.filter(match => match.enabled).length;
}
