import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import type { WorkflowSnippet, WorkflowState } from "@shared/constants/workflow-strip.types";
import { useTheme } from "@shared/hooks/useTheme";
import { borderRadius, colors, fontSize, spacing } from "@shared/styles/tokens";

interface WorkflowStripProps {
  snippets: readonly WorkflowSnippet[];
  stateResolver: (snippetId: string) => WorkflowState;
  footerText?: string;
}

const STATE_BG: Record<WorkflowState, { light: string; dark: string }> = {
  idle: { light: colors.light.surfaceAlt, dark: colors.dark.surfaceAlt },
  active: { light: colors.primaryLight + "22", dark: colors.primaryDark + "33" },
  done: { light: colors.success + "22", dark: colors.success + "33" },
};

const STATE_BORDER: Record<WorkflowState, string> = {
  idle: "transparent",
  active: colors.primary,
  done: colors.success,
};

export function WorkflowStrip({
  snippets,
  stateResolver,
  footerText,
}: WorkflowStripProps) {
  const { isDark } = useTheme();
  const textColor = isDark ? colors.dark.text : colors.light.text;
  const mutedColor = isDark ? colors.dark.textMuted : colors.light.textMuted;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {snippets.map((snippet) => {
        const state = stateResolver(snippet.id);
        const bg = isDark ? STATE_BG[state].dark : STATE_BG[state].light;

        return (
          <View
            key={snippet.id}
            style={[
              styles.card,
              {
                backgroundColor: bg,
                borderColor: STATE_BORDER[state],
              },
            ]}
          >
            <Text style={[styles.cardTitle, { color: textColor }]}>
              {snippet.title}
            </Text>
            <Text style={[styles.cardBody, { color: mutedColor }]}>
              {snippet.body}
            </Text>
            {footerText ? (
              <Text style={[styles.cardFooter, { color: mutedColor }]}>
                {footerText}
              </Text>
            ) : null}
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  card: {
    width: 160,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    gap: spacing.xs,
  },
  cardTitle: {
    fontSize: fontSize.sm,
    fontWeight: "600",
  },
  cardBody: {
    fontSize: fontSize.xs,
    lineHeight: 16,
  },
  cardFooter: {
    fontSize: 10,
    marginTop: spacing.xs,
  },
});
