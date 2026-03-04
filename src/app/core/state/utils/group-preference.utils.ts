import type {
  MaskGroupId,
  MaskGroupPreferenceMap,
  ScanMatch,
} from "../../masking/declarations/masking.types";
import { createGroupPreferenceMap } from "../../masking/utils/mask-group.utils";

/**
 * Computes the next group preferences when toggling alwaysOn for a group.
 * When alwaysOn is enabled, the group is also enabled.
 */
export function computeNextAlwaysOnPreferences(
  currentPreferences: MaskGroupPreferenceMap,
  groupId: MaskGroupId,
  alwaysOn: boolean,
): MaskGroupPreferenceMap {
  return createGroupPreferenceMap({
    ...currentPreferences,
    [groupId]: {
      alwaysOn,
      enabled: alwaysOn ? true : currentPreferences[groupId].enabled,
    },
  });
}

/**
 * Computes the next group preferences when toggling enabled for a group.
 * When disabled, also disables alwaysOn.
 */
export function computeNextEnabledPreferences(
  currentPreferences: MaskGroupPreferenceMap,
  groupId: MaskGroupId,
  enabled: boolean,
): MaskGroupPreferenceMap {
  return createGroupPreferenceMap({
    ...currentPreferences,
    [groupId]: {
      alwaysOn: enabled ? currentPreferences[groupId].alwaysOn : false,
      enabled,
    },
  });
}

/**
 * Updates matches when a group's alwaysOn state changes.
 * Enables and locks matches when alwaysOn is true.
 */
export function applyAlwaysOnToMatches(
  matches: readonly ScanMatch[],
  groupId: MaskGroupId,
  alwaysOn: boolean,
): ScanMatch[] {
  return matches.map(match => {
    if (match.groupId !== groupId) return match;
    return {
      ...match,
      enabled: alwaysOn ? true : match.enabled,
      locked: alwaysOn,
    };
  });
}

/**
 * Updates matches when a group's enabled state changes.
 * Enables/disables matches and adjusts lock state based on preferences.
 */
export function applyEnabledToMatches(
  matches: readonly ScanMatch[],
  groupId: MaskGroupId,
  enabled: boolean,
  alwaysOnAfter: boolean,
): ScanMatch[] {
  return matches.map(match => {
    if (match.groupId !== groupId) return match;
    return {
      ...match,
      enabled,
      locked: enabled ? alwaysOnAfter : false,
    };
  });
}
