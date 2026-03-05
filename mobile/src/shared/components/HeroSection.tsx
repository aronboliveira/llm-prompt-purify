import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SvgXml } from "react-native-svg";

import { useTheme } from "@shared/hooks/useTheme";
import { colors, borderRadius, fontSize, spacing } from "@shared/styles/tokens";

interface HeroSectionProps {
  body: string;
  noticeIconSvg: string;
  noticeTitle: string;
  noticeBody: string;
  onHelpRequested: () => void;
}

export function HeroSection({
  body,
  noticeIconSvg,
  noticeTitle,
  noticeBody,
  onHelpRequested,
}: HeroSectionProps) {
  const { isDark } = useTheme();
  const textColor = isDark ? colors.dark.text : colors.light.text;
  const mutedColor = isDark
    ? colors.dark.textSecondary
    : colors.light.textSecondary;
  const surfaceColor = isDark ? colors.dark.surface : colors.light.surface;
  const borderColor = isDark ? colors.dark.border : colors.light.border;

  return (
    <View style={styles.container}>
      <Text style={[styles.body, { color: mutedColor }]}>{body}</Text>

      <View
        style={[styles.notice, { backgroundColor: surfaceColor, borderColor }]}
      >
        <SvgXml xml={noticeIconSvg} width={24} height={24} />
        <View style={styles.noticeContent}>
          <Text style={[styles.noticeTitle, { color: textColor }]}>
            {noticeTitle}
          </Text>
          <Text style={[styles.noticeBody, { color: mutedColor }]}>
            {noticeBody}
          </Text>
        </View>
        <TouchableOpacity
          onPress={onHelpRequested}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={[styles.helpTrigger, { color: colors.primary }]}>
            (?)
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.md,
    gap: spacing.md,
  },
  body: {
    fontSize: fontSize.md,
    lineHeight: 24,
    textAlign: "center",
  },
  notice: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: spacing.md,
    gap: spacing.sm,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
  },
  noticeContent: {
    flex: 1,
    gap: spacing.xs,
  },
  noticeTitle: {
    fontSize: fontSize.sm,
    fontWeight: "600",
  },
  noticeBody: {
    fontSize: fontSize.xs,
    lineHeight: 18,
  },
  helpTrigger: {
    fontSize: fontSize.sm,
    fontWeight: "600",
  },
});
