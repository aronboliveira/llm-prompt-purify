import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import type {
  MaskGroupId,
  MaskGroupSummary,
  ScanMatch,
} from "@core/masking/declarations/masking.types";
import { MaskGroupPanel } from "./MaskGroupPanel";
import { useTheme } from "@shared/hooks/useTheme";
import { colors, fontSize, spacing } from "@shared/styles/tokens";

interface ControlsPanelProps {
  title: string;
  body: string;
  groups: readonly MaskGroupSummary[];
  matches: readonly ScanMatch[];
  onHelpRequested: () => void;
  onGroupAlwaysOnToggled: (event: {
    alwaysOn: boolean;
    groupId: MaskGroupId;
  }) => void;
  onGroupEnabledToggled: (event: {
    enabled: boolean;
    groupId: MaskGroupId;
  }) => void;
  onMatchRegenerated: (matchId: string) => void;
  onMatchToggled: (event: { enabled: boolean; matchId: string }) => void;
}

export function ControlsPanel({
  title,
  body,
  groups,
  matches,
  onHelpRequested,
  onGroupAlwaysOnToggled,
  onGroupEnabledToggled,
  onMatchRegenerated,
  onMatchToggled,
}: ControlsPanelProps) {
  const { isDark } = useTheme();
  const textColor = isDark ? colors.dark.text : colors.light.text;
  const mutedColor = isDark
    ? colors.dark.textSecondary
    : colors.light.textSecondary;

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
      </View>

      <Text style={[styles.body, { color: mutedColor }]}>{body}</Text>

      <MaskGroupPanel
        groups={groups}
        matches={matches}
        onGroupAlwaysOnToggled={onGroupAlwaysOnToggled}
        onGroupEnabledToggled={onGroupEnabledToggled}
        onMatchRegenerated={onMatchRegenerated}
        onMatchToggled={onMatchToggled}
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
  body: {
    fontSize: fontSize.sm,
    lineHeight: 20,
  },
});
