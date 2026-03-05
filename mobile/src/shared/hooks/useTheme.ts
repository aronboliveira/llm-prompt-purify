/**
 * Theme hook for React Native.
 * Provides resolved colors based on the Zustand theme store + system appearance.
 */
import { useColorScheme } from "react-native";

import { useThemeStore } from "@core/state/theme.store";
import { colors } from "@shared/styles/tokens";

export type ResolvedTheme = "light" | "dark";

export interface ThemeColors {
  background: string;
  border: string;
  disabled: string;
  surface: string;
  surfaceAlt: string;
  text: string;
  textMuted: string;
  textSecondary: string;
}

export function useTheme(): { isDark: boolean; resolved: ResolvedTheme; colors: ThemeColors } {
  const mode = useThemeStore((s) => s.mode);
  const systemScheme = useColorScheme();

  const resolved: ResolvedTheme =
    mode === "system" ? (systemScheme === "dark" ? "dark" : "light") : mode;

  const palette = resolved === "dark" ? colors.dark : colors.light;

  return {
    isDark: resolved === "dark",
    resolved,
    colors: palette,
  };
}
