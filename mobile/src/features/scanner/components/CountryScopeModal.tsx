import React, { useMemo } from "react";
import {
  Modal,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import type {
  CountryProfileId,
  CountryProfileSummary,
} from "@core/masking/declarations/masking.types";
import { useTheme } from "@shared/hooks/useTheme";
import { borderRadius, colors, fontSize, spacing } from "@shared/styles/tokens";

interface CountryScopeModalProps {
  countryProfiles: readonly CountryProfileSummary[];
  isOpen: boolean;
  mixedLanguageWarning: boolean;
  selectedLanguageSummary: string;
  onClosed: () => void;
  onCountryToggled: (event: {
    countryProfileId: CountryProfileId;
    selected: boolean;
  }) => void;
  onHelpRequested: () => void;
}

export function CountryScopeModal({
  countryProfiles,
  isOpen,
  mixedLanguageWarning,
  selectedLanguageSummary,
  onClosed,
  onCountryToggled,
  onHelpRequested,
}: CountryScopeModalProps) {
  const { isDark } = useTheme();
  const textColor = isDark ? colors.dark.text : colors.light.text;
  const mutedColor = isDark ? colors.dark.textSecondary : colors.light.textSecondary;
  const bgColor = isDark ? colors.dark.background : colors.light.background;
  const surfaceColor = isDark ? colors.dark.surface : colors.light.surface;
  const borderColor = isDark ? colors.dark.border : colors.light.border;

  const selectedCount = useMemo(
    () => countryProfiles.filter((p) => p.selected).length,
    [countryProfiles],
  );

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
              <Text style={[styles.title, { color: textColor }]}>
                Choose countries and language scopes
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
            <TouchableOpacity onPress={onClosed} style={styles.closeButton}>
              <Text style={[styles.closeText, { color: colors.primary }]}>
                Close
              </Text>
            </TouchableOpacity>
          </View>
          <Text style={[styles.bodyCopy, { color: mutedColor }]}>
            Keep the selection tight when possible. Mixing unrelated language
            families widens the rule set and can hurt masking precision.
          </Text>
        </View>

        {/* Warning */}
        {mixedLanguageWarning ? (
          <View style={styles.warningBanner}>
            <Text style={styles.warningText}>
              Mixed languages detected: {selectedLanguageSummary}. This is
              supported, but it is not the recommended default.
            </Text>
          </View>
        ) : null}

        {/* Country grid */}
        <ScrollView
          contentContainerStyle={styles.grid}
          showsVerticalScrollIndicator={false}
        >
          {countryProfiles.map((profile) => (
            <View
              key={profile.id}
              style={[
                styles.card,
                {
                  backgroundColor: profile.selected
                    ? colors.primary + "15"
                    : surfaceColor,
                  borderColor: profile.selected
                    ? colors.primary
                    : borderColor,
                },
              ]}
            >
              <View style={styles.cardContent}>
                <Text style={styles.flag}>{profile.flagEmoji}</Text>
                <View style={styles.cardCopy}>
                  <Text style={[styles.cardTitle, { color: textColor }]}>
                    {profile.label}
                  </Text>
                  <Text style={[styles.cardMeta, { color: mutedColor }]}>
                    {profile.localeLabel} · {profile.languageLabel}
                  </Text>
                  <Text
                    style={[styles.cardDescription, { color: mutedColor }]}
                    numberOfLines={2}
                  >
                    {profile.description}
                  </Text>
                </View>
                <Switch
                  value={profile.selected}
                  disabled={profile.selected && selectedCount === 1}
                  onValueChange={(val) =>
                    onCountryToggled({
                      countryProfileId: profile.id,
                      selected: val,
                    })
                  }
                  trackColor={{
                    false: isDark ? colors.dark.disabled : colors.light.disabled,
                    true: colors.primary + "88",
                  }}
                  thumbColor={profile.selected ? colors.primary : "#f4f3f4"}
                  testID={`country-toggle-${profile.id}`}
                />
              </View>
            </View>
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
    padding: spacing.md,
    gap: spacing.sm,
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
    alignItems: "center",
    gap: spacing.sm,
    flexWrap: "wrap",
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
  warningBanner: {
    marginHorizontal: spacing.md,
    marginTop: spacing.sm,
    padding: spacing.sm,
    backgroundColor: colors.warning + "22",
    borderRadius: borderRadius.md,
  },
  warningText: {
    color: colors.warning,
    fontSize: fontSize.xs,
    fontWeight: "500",
  },
  grid: {
    padding: spacing.md,
    gap: spacing.sm,
  },
  card: {
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    padding: spacing.md,
  },
  cardContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  flag: {
    fontSize: 28,
  },
  cardCopy: {
    flex: 1,
    gap: 2,
  },
  cardTitle: {
    fontSize: fontSize.sm,
    fontWeight: "600",
  },
  cardMeta: {
    fontSize: fontSize.xs,
  },
  cardDescription: {
    fontSize: fontSize.xs,
    lineHeight: 16,
  },
});
