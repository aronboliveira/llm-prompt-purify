import React, { useMemo } from "react";
import { StyleSheet, Switch, Text, TouchableOpacity, View } from "react-native";
import { SvgXml } from "react-native-svg";

import type {
  MaskGroupId,
  MaskGroupSummary,
  ScanMatch,
} from "@core/masking/declarations/masking.types";
import {
  buildMaskControlSections,
  formatMaskControlValue,
} from "@features/scanner/utils/mask-control.utils";
import { MATERIAL_ICONS } from "@shared/constants/material-icons.constants";
import { useTheme } from "@shared/hooks/useTheme";
import { borderRadius, colors, fontSize, spacing } from "@shared/styles/tokens";

interface MaskGroupPanelProps {
  groups: readonly MaskGroupSummary[];
  matches: readonly ScanMatch[];
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

export function MaskGroupPanel({
  groups,
  matches,
  onGroupAlwaysOnToggled,
  onGroupEnabledToggled,
  onMatchRegenerated,
  onMatchToggled,
}: MaskGroupPanelProps) {
  const { isDark } = useTheme();
  const textColor = isDark ? colors.dark.text : colors.light.text;
  const mutedColor = isDark
    ? colors.dark.textSecondary
    : colors.light.textSecondary;
  const surfaceColor = isDark ? colors.dark.surface : colors.light.surface;
  const borderColor = isDark ? colors.dark.border : colors.light.border;
  const disabledColor = isDark ? colors.dark.disabled : colors.light.disabled;

  const sections = useMemo(
    () => buildMaskControlSections(groups, matches),
    [groups, matches],
  );

  return (
    <View style={styles.container}>
      {sections.map(section => {
        const { group } = section;
        const isEnabled = group.enabled;

        return (
          <View
            key={group.id}
            style={[
              styles.fieldset,
              {
                backgroundColor: surfaceColor,
                borderColor: isEnabled ? colors.primary + "44" : borderColor,
              },
            ]}
          >
            {/* Legend */}
            <View style={styles.legend}>
              <Text style={[styles.legendLabel, { color: textColor }]}>
                {group.label}
              </Text>
              <Text style={[styles.legendMeta, { color: mutedColor }]}>
                {group.matchCount} local matches
              </Text>
            </View>

            <Text style={[styles.description, { color: mutedColor }]}>
              {group.description}
            </Text>

            {/* Group toggles */}
            <View style={styles.toggleRow}>
              <View style={styles.toggleItem}>
                <Switch
                  value={isEnabled}
                  onValueChange={val =>
                    onGroupEnabledToggled({ enabled: val, groupId: group.id })
                  }
                  trackColor={{
                    false: disabledColor,
                    true: colors.primary + "88",
                  }}
                  thumbColor={isEnabled ? colors.primary : "#f4f3f4"}
                  testID={`group-toggle-${group.id}`}
                />
                <Text style={[styles.toggleLabel, { color: textColor }]}>
                  {group.toggleLabel}
                </Text>
              </View>

              {group.supportsAlwaysOn && group.alwaysOnLabel ? (
                <View style={styles.toggleItem}>
                  <Switch
                    value={group.alwaysOn}
                    disabled={!isEnabled}
                    onValueChange={val =>
                      onGroupAlwaysOnToggled({
                        alwaysOn: val,
                        groupId: group.id,
                      })
                    }
                    trackColor={{
                      false: disabledColor,
                      true: colors.warning + "88",
                    }}
                    thumbColor={group.alwaysOn ? colors.warning : "#f4f3f4"}
                    testID={`group-lock-${group.id}`}
                  />
                  <Text
                    style={[
                      styles.toggleLabel,
                      {
                        color: isEnabled ? mutedColor : disabledColor,
                      },
                    ]}
                  >
                    {group.alwaysOnLabel}
                  </Text>
                </View>
              ) : null}
            </View>

            {/* Match rows */}
            {section.matches.length > 0 ? (
              <View style={styles.matchList}>
                {section.matches.map(match => (
                  <View
                    key={match.id}
                    style={[
                      styles.matchRow,
                      {
                        borderColor,
                        opacity: match.locked || !isEnabled ? 0.5 : 1,
                      },
                    ]}
                  >
                    <Switch
                      value={match.enabled}
                      disabled={match.locked || !isEnabled}
                      onValueChange={val =>
                        onMatchToggled({ enabled: val, matchId: match.id })
                      }
                      trackColor={{
                        false: disabledColor,
                        true: colors.primary + "88",
                      }}
                      thumbColor={match.enabled ? colors.primary : "#f4f3f4"}
                      testID={`toggle-${match.ruleId}`}
                    />

                    <Text
                      style={[styles.matchCopy, { color: textColor }]}
                      numberOfLines={1}
                      ellipsizeMode="middle"
                    >
                      {formatMaskControlValue(match)}
                    </Text>

                    <TouchableOpacity
                      disabled={!isEnabled}
                      onPress={() => onMatchRegenerated(match.id)}
                      testID={`regenerate-${match.ruleId}`}
                      hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
                    >
                      <SvgXml
                        xml={MATERIAL_ICONS.refresh}
                        width={18}
                        height={18}
                      />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={[styles.emptyText, { color: mutedColor }]}>
                No matches from this group are currently present in the
                protected output.
              </Text>
            )}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
  },
  fieldset: {
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    padding: spacing.md,
    gap: spacing.sm,
  },
  legend: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  legendLabel: {
    fontSize: fontSize.md,
    fontWeight: "700",
  },
  legendMeta: {
    fontSize: fontSize.xs,
  },
  description: {
    fontSize: fontSize.xs,
    lineHeight: 18,
  },
  toggleRow: {
    gap: spacing.sm,
  },
  toggleItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  toggleLabel: {
    fontSize: fontSize.sm,
    flex: 1,
  },
  matchList: {
    gap: spacing.xs,
  },
  matchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.xs,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  matchCopy: {
    flex: 1,
    fontSize: fontSize.xs,
    fontFamily: "monospace",
  },
  emptyText: {
    fontSize: fontSize.xs,
    fontStyle: "italic",
    textAlign: "center",
    paddingVertical: spacing.sm,
  },
});
