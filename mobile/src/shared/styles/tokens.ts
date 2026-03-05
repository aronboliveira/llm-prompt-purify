/**
 * Design tokens for React Native, replacing the Angular _design.scss.
 */
export const colors = {
  // Brand
  primary: "#6366f1",
  primaryLight: "#818cf8",
  primaryDark: "#4f46e5",

  // Semantic
  success: "#22c55e",
  warning: "#f59e0b",
  error: "#ef4444",
  info: "#3b82f6",

  // Neutral (light theme)
  light: {
    background: "#ffffff",
    surface: "#f8fafc",
    surfaceAlt: "#f1f5f9",
    border: "#e2e8f0",
    text: "#0f172a",
    textSecondary: "#475569",
    textMuted: "#94a3b8",
    disabled: "#cbd5e1",
  },

  // Neutral (dark theme)
  dark: {
    background: "#0f172a",
    surface: "#1e293b",
    surfaceAlt: "#334155",
    border: "#475569",
    text: "#f8fafc",
    textSecondary: "#cbd5e1",
    textMuted: "#64748b",
    disabled: "#475569",
  },
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const borderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
} as const;

export const fontSize = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 17,
  xl: 20,
  xxl: 24,
  hero: 28,
} as const;

export const fontWeight = {
  normal: "400" as const,
  medium: "500" as const,
  semibold: "600" as const,
  bold: "700" as const,
};
