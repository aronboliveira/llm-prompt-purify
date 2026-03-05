import React from "react";
import {
  Modal,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SvgXml } from "react-native-svg";

import type { DetectionMode } from "@core/masking/declarations/masking.types";
import { MATERIAL_ICONS } from "@shared/constants/material-icons.constants";
import { useTheme } from "@shared/hooks/useTheme";
import { borderRadius, colors, fontSize, spacing } from "@shared/styles/tokens";

interface MaskingSettingsModalProps {
  detectionMode: DetectionMode;
  isOpen: boolean;
  onClosed: () => void;
  onDetectionModeChanged: (mode: DetectionMode) => void;
  onHelpRequested: () => void;
}

export function MaskingSettingsModal({
  detectionMode,
  isOpen,
  onClosed,
  onDetectionModeChanged,
  onHelpRequested,
}: MaskingSettingsModalProps) {
  const { isDark } = useTheme();
  const textColor = isDark ? colors.dark.text : colors.light.text;
  const mutedColor = isDark
    ? colors.dark.textSecondary
    : colors.light.textSecondary;
  const bgColor = isDark ? colors.dark.background : colors.light.background;
  const surfaceColor = isDark ? colors.dark.surface : colors.light.surface;
  const borderColor = isDark ? colors.dark.border : colors.light.border;
  const disabledColor = isDark ? colors.dark.disabled : colors.light.disabled;

  const isGlobalOnly = detectionMode === "global-only";

  return (
    <Modal
      visible={isOpen}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClosed}
    >
      <View style={[styles.container, { backgroundColor: bgColor }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: borderColor }]}>
          <View style={styles.titleRow}>
            <View style={styles.titleWrap}>
              <SvgXml xml={MATERIAL_ICONS.settings} width={22} height={22} />
              <View style={styles.titleText}>
                <View style={styles.titleInner}>
                  <Text style={[styles.title, { color: textColor }]}>
                    Masking settings
                  </Text>
                  <TouchableOpacity
                    onPress={onHelpRequested}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Text
                      style={[styles.helpTrigger, { color: colors.primary }]}
                    >
                      (?)
                    </Text>
                  </TouchableOpacity>
                </View>
                <Text style={[styles.bodyCopy, { color: mutedColor }]}>
                  These settings change how the local detector scopes the prompt
                  before you copy the protected output.
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClosed} style={styles.closeButton}>
              <Text style={[styles.closeText, { color: colors.primary }]}>
                Close
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          {/* Global-only toggle */}
          <View
            style={[
              styles.toggleCard,
              { backgroundColor: surfaceColor, borderColor },
            ]}
          >
            <Switch
              value={isGlobalOnly}
              onValueChange={val =>
                onDetectionModeChanged(
                  val ? "global-only" : "selected-plus-global",
                )
              }
              trackColor={{
                false: disabledColor,
                true: colors.primary + "88",
              }}
              thumbColor={isGlobalOnly ? colors.primary : "#f4f3f4"}
              testID="global-only-toggle"
            />
            <View style={styles.toggleCopy}>
              <Text style={[styles.toggleTitle, { color: textColor }]}>
                Track only global identifiers
              </Text>
              <Text style={[styles.toggleBody, { color: mutedColor }]}>
                Keep shared rules such as API keys, credentials, emails, payment
                strings, and labeled contact fields, but skip country-specific
                document patterns.
              </Text>
            </View>
          </View>

          {/* Info cards */}
          <View style={styles.cardGrid}>
            <View
              style={[
                styles.infoCard,
                { backgroundColor: surfaceColor, borderColor },
              ]}
            >
              <Text style={[styles.cardTitle, { color: textColor }]}>
                Client-side only
              </Text>
              <Text style={[styles.cardBody, { color: mutedColor }]}>
                The raw prompt, the detected matches, and the regenerated masks
                stay in this local session unless you copy the protected output
                yourself.
              </Text>
            </View>

            <View
              style={[
                styles.infoCard,
                { backgroundColor: surfaceColor, borderColor },
              ]}
            >
              <Text style={[styles.cardTitle, { color: textColor }]}>
                Live refresh
              </Text>
              <Text style={[styles.cardBody, { color: mutedColor }]}>
                Text and masking controls rebuild the output automatically.
                There is no submit step in this layout.
              </Text>
            </View>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: spacing.md,
    borderBottomWidth: 1,
  },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  titleWrap: {
    flex: 1,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
  },
  titleText: {
    flex: 1,
    gap: spacing.xs,
  },
  titleInner: {
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
  closeButton: {
    paddingLeft: spacing.md,
  },
  closeText: {
    fontSize: fontSize.md,
    fontWeight: "600",
  },
  bodyCopy: {
    fontSize: fontSize.sm,
    lineHeight: 20,
  },
  content: {
    padding: spacing.md,
    gap: spacing.md,
  },
  toggleCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
  },
  toggleCopy: {
    flex: 1,
    gap: spacing.xs,
  },
  toggleTitle: {
    fontSize: fontSize.md,
    fontWeight: "600",
  },
  toggleBody: {
    fontSize: fontSize.sm,
    lineHeight: 20,
  },
  cardGrid: {
    gap: spacing.sm,
  },
  infoCard: {
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    gap: spacing.xs,
  },
  cardTitle: {
    fontSize: fontSize.md,
    fontWeight: "600",
  },
  cardBody: {
    fontSize: fontSize.sm,
    lineHeight: 20,
  },
});
