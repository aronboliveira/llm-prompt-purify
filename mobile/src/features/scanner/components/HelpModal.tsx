import React from "react";
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SvgXml } from "react-native-svg";

import type { HelpTopic } from "@features/scanner/declarations/help-topic.types";
import { MATERIAL_ICONS } from "@shared/constants/material-icons.constants";
import { useTheme } from "@shared/hooks/useTheme";
import { borderRadius, colors, fontSize, spacing } from "@shared/styles/tokens";

interface HelpModalProps {
  topic: HelpTopic | null;
  onClosed: () => void;
}

export function HelpModal({ topic, onClosed }: HelpModalProps) {
  const { isDark } = useTheme();
  const textColor = isDark ? colors.dark.text : colors.light.text;
  const mutedColor = isDark ? colors.dark.textSecondary : colors.light.textSecondary;
  const bgColor = isDark ? colors.dark.background : colors.light.background;
  const borderColor = isDark ? colors.dark.border : colors.light.border;

  return (
    <Modal
      visible={topic !== null}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClosed}
    >
      <View style={[styles.container, { backgroundColor: bgColor }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: borderColor }]}>
          <View style={styles.titleWrap}>
            <SvgXml xml={MATERIAL_ICONS.help} width={22} height={22} />
            <Text style={[styles.title, { color: textColor }]}>
              {topic?.title ?? "Help"}
            </Text>
          </View>
          <TouchableOpacity onPress={onClosed} style={styles.closeButton}>
            <Text style={[styles.closeText, { color: colors.primary }]}>
              Close
            </Text>
          </TouchableOpacity>
        </View>

        {/* Body */}
        <ScrollView contentContainerStyle={styles.body}>
          {topic?.paragraphs.map((paragraph, index) => (
            <Text
              key={index}
              style={[styles.paragraph, { color: mutedColor }]}
            >
              {paragraph}
            </Text>
          ))}
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
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: spacing.md,
    borderBottomWidth: 1,
  },
  titleWrap: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  title: {
    fontSize: fontSize.lg,
    fontWeight: "700",
  },
  closeButton: {
    paddingLeft: spacing.md,
  },
  closeText: {
    fontSize: fontSize.md,
    fontWeight: "600",
  },
  body: {
    padding: spacing.md,
    gap: spacing.md,
  },
  paragraph: {
    fontSize: fontSize.md,
    lineHeight: 24,
  },
});
