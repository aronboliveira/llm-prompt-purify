import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SvgXml } from "react-native-svg";

import { useTheme } from "@shared/hooks/useTheme";
import { borderRadius, colors, fontSize, spacing } from "@shared/styles/tokens";

interface ScannerToolbarProps {
  countrySummary: string;
  scopeDescription: string;
  settingsIconSvg: string;
  warning?: string | null;
  showWarning?: boolean;
  onCountryModalRequested: () => void;
  onSettingsModalRequested: () => void;
}

export function ScannerToolbar({
  countrySummary,
  scopeDescription,
  settingsIconSvg,
  warning,
  showWarning = false,
  onCountryModalRequested,
  onSettingsModalRequested,
}: ScannerToolbarProps) {
  const { isDark } = useTheme();
  const textColor = isDark ? colors.dark.text : colors.light.text;
  const mutedColor = isDark
    ? colors.dark.textSecondary
    : colors.light.textSecondary;
  const surfaceColor = isDark
    ? colors.dark.surfaceAlt
    : colors.light.surfaceAlt;
  const borderColor = isDark ? colors.dark.border : colors.light.border;

  return (
    <View style={styles.container}>
      <View style={styles.actions}>
        <TouchableOpacity
          style={[
            styles.button,
            { backgroundColor: surfaceColor, borderColor },
          ]}
          onPress={onCountryModalRequested}
          testID="country-modal-button"
        >
          <Text style={[styles.buttonLabel, { color: mutedColor }]}>
            Countries
          </Text>
          <Text style={[styles.buttonValue, { color: textColor }]}>
            {countrySummary}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.button,
            { backgroundColor: surfaceColor, borderColor },
          ]}
          onPress={onSettingsModalRequested}
          testID="settings-button"
        >
          <SvgXml xml={settingsIconSvg} width={18} height={18} />
          <Text style={[styles.buttonLabel, { color: textColor }]}>
            Masking settings
          </Text>
        </TouchableOpacity>
      </View>

      <Text style={[styles.summary, { color: mutedColor }]}>
        {scopeDescription}
      </Text>

      {showWarning && warning ? (
        <Text style={styles.warning}>{warning}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  actions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
  },
  buttonLabel: {
    fontSize: fontSize.xs,
  },
  buttonValue: {
    fontSize: fontSize.xs,
    fontWeight: "600",
  },
  summary: {
    fontSize: fontSize.xs,
    lineHeight: 18,
  },
  warning: {
    fontSize: fontSize.xs,
    color: colors.warning,
    fontWeight: "500",
  },
});
