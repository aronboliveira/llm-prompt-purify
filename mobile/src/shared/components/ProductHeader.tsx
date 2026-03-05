import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { useTheme } from "@shared/hooks/useTheme";
import { colors, fontSize, spacing } from "@shared/styles/tokens";

interface ProductHeaderProps {
  title: string;
  tagline: string;
  icon?: string;
}

export function ProductHeader({
  title,
  tagline,
  icon = "🛡️",
}: ProductHeaderProps) {
  const { isDark } = useTheme();
  const textColor = isDark ? colors.dark.text : colors.light.text;
  const mutedColor = isDark ? colors.dark.textSecondary : colors.light.textSecondary;

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: textColor }]}>
        {icon} {title}
      </Text>
      <Text style={[styles.tagline, { color: mutedColor }]}>{tagline}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
  },
  title: {
    fontSize: fontSize.xxl,
    fontWeight: "700",
    textAlign: "center",
  },
  tagline: {
    fontSize: fontSize.sm,
    marginTop: spacing.xs,
    textAlign: "center",
  },
});
