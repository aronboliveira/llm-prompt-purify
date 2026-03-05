/**
 * Zustand store for theme management.
 * Replaces Angular ThemeService.
 */
import { create } from "zustand";
import { MMKV } from "react-native-mmkv";

import { THEME_STORAGE_KEY } from "./constants/theme.constants";
import type { ThemeMode } from "./declarations/theme.types";

const storage = new MMKV({ id: "llm-prompt-purify-theme" });

function loadPersistedTheme(): ThemeMode {
  try {
    const value = storage.getString(THEME_STORAGE_KEY);
    if (value === "dark" || value === "light" || value === "system") return value;
    return "system";
  } catch {
    return "system";
  }
}

interface ThemeState {
  mode: ThemeMode;
  setMode(mode: ThemeMode): void;
}

export const useThemeStore = create<ThemeState>()((set) => ({
  mode: loadPersistedTheme(),

  setMode(mode: ThemeMode) {
    set({ mode });
    try {
      storage.set(THEME_STORAGE_KEY, mode);
    } catch {
      // Persistence is optional.
    }
  },
}));
