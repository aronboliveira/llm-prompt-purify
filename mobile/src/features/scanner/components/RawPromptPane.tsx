import React from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { useTheme } from "@shared/hooks/useTheme";
import { borderRadius, colors, fontSize, spacing } from "@shared/styles/tokens";

interface RawPromptPaneProps {
  title: string;
  body: string;
  sourceText: string;
  placeholder?: string;
  onHelpRequested: () => void;
  onSourceTextChanged: (value: string) => void;
}

export function RawPromptPane({
  title,
  body,
  sourceText,
  placeholder = "Paste the content you want to protect before sending it to an LLM.",
  onHelpRequested,
  onSourceTextChanged,
}: RawPromptPaneProps) {
  const { isDark } = useTheme();
  const textColor = isDark ? colors.dark.text : colors.light.text;
  const mutedColor = isDark ? colors.dark.textSecondary : colors.light.textSecondary;
  const surfaceColor = isDark ? colors.dark.surface : colors.light.surface;
  const borderColor = isDark ? colors.dark.border : colors.light.border;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={[styles.title, { color: textColor }]}>{title}</Text>
          <TouchableOpacity
            onPress={onHelpRequested}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={[styles.helpTrigger, { color: colors.primary }]}>
              (?)
            </Text>
          </TouchableOpacity>
        </View>
        <Text style={[styles.charCount, { color: mutedColor }]}>
          {sourceText.length} chars
        </Text>
      </View>

      <Text style={[styles.body, { color: mutedColor }]}>{body}</Text>

      <TextInput
        style={[
          styles.editor,
          {
            color: textColor,
            backgroundColor: surfaceColor,
            borderColor,
          },
        ]}
        value={sourceText}
        onChangeText={onSourceTextChanged}
        placeholder={placeholder}
        placeholderTextColor={isDark ? colors.dark.textMuted : colors.light.textMuted}
        multiline
        textAlignVertical="top"
        spellCheck={false}
        autoCorrect={false}
        autoCapitalize="none"
        testID="source-textarea"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  title: {
    fontSize: fontSize.lg,
    fontWeight: "700",
  },
  helpTrigger: {
    fontSize: fontSize.sm,
    fontWeight: "600",
  },
  charCount: {
    fontSize: fontSize.xs,
  },
  body: {
    fontSize: fontSize.sm,
    lineHeight: 20,
  },
  editor: {
    minHeight: 180,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    fontSize: fontSize.sm,
    lineHeight: 22,
  },
});
