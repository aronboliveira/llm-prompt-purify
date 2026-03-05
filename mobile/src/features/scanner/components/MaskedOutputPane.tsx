import React from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SvgXml } from "react-native-svg";

import type { StatusTone } from "@features/scanner/declarations/mask-control.types";
import { useTheme } from "@shared/hooks/useTheme";
import { borderRadius, colors, fontSize, spacing } from "@shared/styles/tokens";

interface MaskedOutputPaneProps {
  title: string;
  body: string;
  maskedText: string;
  emptyPlaceholder: string;
  statusMessage: string;
  detectionModeLabel: string;
  statusTone: StatusTone;
  copyIconSvg: string;
  refreshIconSvg: string;
  isScanning: boolean;
  hasResult: boolean;
  canCopy: boolean;
  hasMatches: boolean;
  hasSourceText: boolean;
  onHelpRequested: () => void;
  onCopyRequested: () => void;
  onRegenerateRequested: () => void;
  onClearRequested: () => void;
}

const TONE_COLORS: Record<StatusTone, string> = {
  success: colors.success,
  error: colors.error,
  info: colors.info,
};

export function MaskedOutputPane({
  title,
  body,
  maskedText,
  emptyPlaceholder,
  statusMessage,
  detectionModeLabel,
  statusTone,
  copyIconSvg,
  refreshIconSvg,
  isScanning,
  hasResult,
  canCopy,
  hasMatches,
  hasSourceText,
  onHelpRequested,
  onCopyRequested,
  onRegenerateRequested,
  onClearRequested,
}: MaskedOutputPaneProps) {
  const { isDark } = useTheme();
  const textColor = isDark ? colors.dark.text : colors.light.text;
  const mutedColor = isDark
    ? colors.dark.textSecondary
    : colors.light.textSecondary;
  const surfaceColor = isDark ? colors.dark.surface : colors.light.surface;
  const borderColor = isDark ? colors.dark.border : colors.light.border;
  const disabledColor = isDark ? colors.dark.disabled : colors.light.disabled;

  return (
    <View style={styles.container}>
      {/* Header */}
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

        <TouchableOpacity
          style={[
            styles.copyButton,
            {
              backgroundColor: canCopy ? colors.primary : disabledColor,
            },
          ]}
          disabled={!canCopy}
          onPress={onCopyRequested}
        >
          <SvgXml xml={copyIconSvg} width={16} height={16} />
          <Text style={styles.copyButtonText}>Copy protected output</Text>
        </TouchableOpacity>
      </View>

      <Text style={[styles.body, { color: mutedColor }]}>{body}</Text>

      {/* Output block */}
      <View
        style={[styles.output, { backgroundColor: surfaceColor, borderColor }]}
        testID="masked-output"
      >
        {isScanning ? (
          <View style={styles.overlay}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={[styles.overlayText, { color: mutedColor }]}>
              {statusMessage}
            </Text>
          </View>
        ) : (
          <ScrollView style={styles.outputScroll} nestedScrollEnabled>
            <Text style={[styles.outputText, { color: textColor }]} selectable>
              {hasResult ? maskedText : emptyPlaceholder}
            </Text>
          </ScrollView>
        )}
      </View>

      {/* Status pills */}
      <View style={styles.statusRow}>
        <View
          style={[
            styles.statusPill,
            { backgroundColor: TONE_COLORS[statusTone] + "22" },
          ]}
        >
          <Text
            style={[styles.statusPillText, { color: TONE_COLORS[statusTone] }]}
          >
            {statusMessage}
          </Text>
        </View>
        <View
          style={[styles.statusPill, { backgroundColor: colors.info + "22" }]}
        >
          <Text style={[styles.statusPillText, { color: colors.info }]}>
            {detectionModeLabel}
          </Text>
        </View>
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={[
            styles.actionButton,
            {
              backgroundColor: hasMatches
                ? colors.primary + "15"
                : "transparent",
              borderColor: hasMatches ? colors.primary : disabledColor,
            },
          ]}
          disabled={!hasMatches}
          onPress={onRegenerateRequested}
        >
          <SvgXml xml={refreshIconSvg} width={16} height={16} />
          <Text
            style={[
              styles.actionButtonText,
              { color: hasMatches ? colors.primary : disabledColor },
            ]}
          >
            Regenerate all masks
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.ghostButton]}
          disabled={!hasSourceText}
          onPress={onClearRequested}
        >
          <Text
            style={[
              styles.ghostButtonText,
              { color: hasSourceText ? colors.error : disabledColor },
            ]}
          >
            Clear local text
          </Text>
        </TouchableOpacity>
      </View>
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
    flexWrap: "wrap",
    gap: spacing.sm,
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
  copyButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
  },
  copyButtonText: {
    color: "#ffffff",
    fontSize: fontSize.xs,
    fontWeight: "600",
  },
  body: {
    fontSize: fontSize.sm,
    lineHeight: 20,
  },
  output: {
    minHeight: 160,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    overflow: "hidden",
  },
  outputScroll: {
    padding: spacing.md,
    maxHeight: 300,
  },
  outputText: {
    fontSize: fontSize.sm,
    lineHeight: 22,
  },
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.xl,
    gap: spacing.sm,
  },
  overlayText: {
    fontSize: fontSize.sm,
  },
  statusRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  statusPill: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.full,
  },
  statusPillText: {
    fontSize: fontSize.xs,
    fontWeight: "600",
  },
  actions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
  },
  actionButtonText: {
    fontSize: fontSize.xs,
    fontWeight: "600",
  },
  ghostButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  ghostButtonText: {
    fontSize: fontSize.xs,
    fontWeight: "600",
  },
});
