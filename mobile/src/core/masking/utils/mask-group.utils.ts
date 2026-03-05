/** Ported from Angular app. */
import {
  DEFAULT_GROUP_PREFERENCES,
  MASK_GROUP_ORDER,
} from "../constants/masking.constants";
import type {
  MaskGroupId,
  MaskGroupPreference,
  MaskGroupPreferenceMap,
} from "../declarations/masking.types";

export function createGroupPreferenceMap(
  overrides: Partial<Record<MaskGroupId, Partial<MaskGroupPreference>>> = {},
): MaskGroupPreferenceMap {
  const entries = MASK_GROUP_ORDER.map(groupId => {
    const defaultPreference = DEFAULT_GROUP_PREFERENCES[groupId],
      overridePreference = overrides[groupId] ?? {};

    return [
      groupId,
      {
        alwaysOn: overridePreference.alwaysOn ?? defaultPreference.alwaysOn,
        enabled: overridePreference.enabled ?? defaultPreference.enabled,
      },
    ] as const;
  });

  return Object.freeze(
    Object.fromEntries(entries) as Record<MaskGroupId, MaskGroupPreference>,
  );
}
