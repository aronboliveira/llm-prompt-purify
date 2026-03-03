import { DEFAULT_GROUP_PREFERENCES } from "../../masking/constants/masking.constants";
import type { MaskGroupPreferenceMap } from "../../masking/declarations/masking.types";
import { createGroupPreferenceMap } from "../../masking/utils/mask-group.utils";
import { SESSION_STORAGE_KEYS } from "../constants/scan-session.constants";

export function loadPersistedGroupPreferences(): MaskGroupPreferenceMap {
  try {
    if (typeof sessionStorage === "undefined") return DEFAULT_GROUP_PREFERENCES;

    const rawValue = sessionStorage.getItem(SESSION_STORAGE_KEYS.groupPreferences);
    if (!rawValue) return DEFAULT_GROUP_PREFERENCES;

    const parsed = JSON.parse(rawValue) as Partial<MaskGroupPreferenceMap>;
    return createGroupPreferenceMap(parsed);
  } catch {
    return DEFAULT_GROUP_PREFERENCES;
  }
}

export function loadPersistedSourceText(): string {
  try {
    if (typeof sessionStorage === "undefined") return "";
    return sessionStorage.getItem(SESSION_STORAGE_KEYS.sourceText) ?? "";
  } catch {
    return "";
  }
}

export function persistGroupPreferences(groupPreferences: MaskGroupPreferenceMap): void {
  try {
    if (typeof sessionStorage === "undefined") return;
    sessionStorage.setItem(
      SESSION_STORAGE_KEYS.groupPreferences,
      JSON.stringify(groupPreferences)
    );
  } catch {
    // Storage is optional and must not block local masking.
  }
}

export function persistSourceText(sourceText: string): void {
  try {
    if (typeof sessionStorage === "undefined") return;
    if (sourceText)
      sessionStorage.setItem(SESSION_STORAGE_KEYS.sourceText, sourceText);
    else sessionStorage.removeItem(SESSION_STORAGE_KEYS.sourceText);
  } catch {
    // Storage is optional and must not block local masking.
  }
}
