import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { DETECTION_MODE_COPY } from "@core/masking/constants/masking.constants";
import type {
  CountryProfileId,
  DetectionMode,
  MaskGroupId,
} from "@core/masking/declarations/masking.types";
import {
  hasMixedLanguageSelection,
  summarizeCountrySelection,
  summarizeSelectedLanguages,
} from "@core/masking/utils/country-selection.utils";
import { selectViewModel, useScanSessionStore } from "@core/state";
import { MATERIAL_ICONS } from "@shared/constants/material-icons.constants";
import { useClipboard } from "@shared/hooks/useClipboard";
import { useTheme } from "@shared/hooks/useTheme";
import { useToast } from "@shared/hooks/useToast";
import { colors, spacing } from "@shared/styles/tokens";
import { HELP_TOPICS } from "@features/scanner/constants/help-topics.constants";
import { WORKFLOW_SNIPPETS } from "@features/scanner/constants/workflow-snippets.constants";
import { WORKSPACE_COPY } from "@features/scanner/constants/workspace.constants";
import type {
  HelpTopic,
  HelpTopicId,
} from "@features/scanner/declarations/help-topic.types";
import { toggleCountrySelection } from "@features/scanner/utils/country-selection-form.utils";

import { ProductHeader } from "@shared/components/ProductHeader";
import { HeroSection } from "@shared/components/HeroSection";
import { WorkflowStrip } from "@shared/components/WorkflowStrip";
import { ScannerToolbar } from "@features/scanner/components/ScannerToolbar";
import { RawPromptPane } from "@features/scanner/components/RawPromptPane";
import { MaskedOutputPane } from "@features/scanner/components/MaskedOutputPane";
import { ControlsPanel } from "@features/scanner/components/ControlsPanel";
import { CountryScopeModal } from "@features/scanner/components/CountryScopeModal";
import { MaskingSettingsModal } from "@features/scanner/components/MaskingSettingsModal";
import { HelpModal } from "@features/scanner/components/HelpModal";

const copy = WORKSPACE_COPY;
const icons = MATERIAL_ICONS;

export default function ScannerScreen() {
  const { isDark } = useTheme();
  const { push: pushToast } = useToast();
  const { copy: copyToClipboard } = useClipboard();
  const bgColor = isDark ? colors.dark.background : colors.light.background;

  // ── Zustand store selectors ──────────────────────────────────
  const vm = useScanSessionStore(selectViewModel);
  const clear = useScanSessionStore((s) => s.clear);
  const updateSourceText = useScanSessionStore((s) => s.updateSourceText);
  const regenerateAllMasks = useScanSessionStore((s) => s.regenerateAllMasks);
  const regenerateMatch = useScanSessionStore((s) => s.regenerateMatch);
  const toggleGroupAlwaysOn = useScanSessionStore(
    (s) => s.toggleGroupAlwaysOn,
  );
  const toggleGroupEnabled = useScanSessionStore((s) => s.toggleGroupEnabled);
  const toggleMatch = useScanSessionStore((s) => s.toggleMatch);
  const setCountryProfiles = useScanSessionStore((s) => s.setCountryProfiles);
  const setDetectionMode = useScanSessionStore((s) => s.setDetectionMode);
  const scheduleRefresh = useScanSessionStore((s) => s.scheduleRefresh);

  // ── Local UI state (modals, help) ───────────────────────────
  const [isCountryModalOpen, setCountryModalOpen] = useState(false);
  const [isSettingsModalOpen, setSettingsModalOpen] = useState(false);
  const [activeHelpTopic, setActiveHelpTopic] = useState<HelpTopic | null>(
    null,
  );

  // ── Derived values ──────────────────────────────────────────
  const mixedLanguage = useMemo(
    () => hasMixedLanguageSelection(vm.selectedCountryProfiles),
    [vm.selectedCountryProfiles],
  );
  const countrySummary = useMemo(
    () => summarizeCountrySelection(vm.selectedCountryProfiles),
    [vm.selectedCountryProfiles],
  );
  const languageSummary = useMemo(
    () => summarizeSelectedLanguages(vm.selectedCountryProfiles),
    [vm.selectedCountryProfiles],
  );

  const scopeDescription = useMemo(() => {
    if (vm.detectionMode === "global-only")
      return `${countrySummary} selected, but only global identifiers are active.`;
    return `${countrySummary} plus shared global rules.`;
  }, [countrySummary, vm.detectionMode]);

  const detectionModeLabel = useMemo(
    () => DETECTION_MODE_COPY[vm.detectionMode],
    [vm.detectionMode],
  );

  const statusTone = useMemo(() => {
    if (vm.errorMessage) return "error" as const;
    if (vm.hasResult) return "success" as const;
    return "info" as const;
  }, [vm.errorMessage, vm.hasResult]);

  // ── Trigger initial scan if persisted text exists ───────────
  useEffect(() => {
    if (vm.sourceText.trim()) scheduleRefresh(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Workflow state resolver ─────────────────────────────────
  const snippetState = useCallback(
    (snippetId: string): "active" | "done" | "idle" => {
      switch (snippetId) {
        case "paste":
          return vm.sourceText ? "done" : "active";
        case "scan":
          if (vm.isScanning) return "active";
          return vm.hasResult ? "done" : "idle";
        case "review":
          if (!vm.hasResult) return "idle";
          return vm.hasMatches ? "active" : "done";
        case "copy":
          if (!vm.hasResult) return "idle";
          return vm.canCopy ? "active" : "idle";
        default:
          return "idle";
      }
    },
    [vm.sourceText, vm.isScanning, vm.hasResult, vm.hasMatches, vm.canCopy],
  );

  // ── Action handlers ─────────────────────────────────────────
  const handleClear = useCallback(() => {
    clear();
    pushToast(
      "The raw prompt and protected output were cleared from this local session.",
      "Workspace reset",
      "info",
    );
  }, [clear, pushToast]);

  const handleCopy = useCallback(async () => {
    if (!vm.maskedText) {
      pushToast(
        "The protected output is still empty. Paste the raw prompt first and wait for the local masking pass.",
        "Nothing to copy",
        "error",
      );
      return;
    }
    await copyToClipboard(vm.maskedText);
    pushToast(
      "Only the masked output was copied, so you can paste it back into the LLM without exposing the raw prompt.",
      "Protected prompt copied",
      "success",
    );
  }, [vm.maskedText, copyToClipboard, pushToast]);

  const handleRegenerate = useCallback(async () => {
    await regenerateAllMasks();
    pushToast(
      "Fresh random replacements were generated for every active mask in the protected output.",
      "Masks regenerated",
      "success",
    );
  }, [regenerateAllMasks, pushToast]);

  const handleRegenerateMatch = useCallback(
    async (matchId: string) => {
      await regenerateMatch(matchId);
      pushToast(
        "That mask now uses a new random replacement in the protected output.",
        "Mask regenerated",
        "info",
      );
    },
    [regenerateMatch, pushToast],
  );

  const handleToggleCountryProfile = useCallback(
    (event: { countryProfileId: CountryProfileId; selected: boolean }) => {
      const currentSelection = vm.selectedCountryProfiles.map(
        (p: { id: CountryProfileId }) => p.id,
      );
      const nextSelection = toggleCountrySelection(
        currentSelection,
        event.countryProfileId,
        event.selected,
      );
      setCountryProfiles(nextSelection);

      pushToast(
        `Country scope updated to ${summarizeCountrySelection(vm.selectedCountryProfiles)}.`,
        "Country scope updated",
        "info",
      );

      if (
        hasMixedLanguageSelection(vm.selectedCountryProfiles) &&
        vm.detectionMode !== "global-only"
      ) {
        pushToast(
          "Mixed-language country scopes are enabled. This can reduce precision, so keep the selection narrow when possible.",
          "Mixed language scope",
          "info",
        );
      }
    },
    [vm.selectedCountryProfiles, vm.detectionMode, setCountryProfiles, pushToast],
  );

  const handleToggleGroupAlwaysOn = useCallback(
    (event: { alwaysOn: boolean; groupId: MaskGroupId }) => {
      toggleGroupAlwaysOn(event.groupId, event.alwaysOn);
      pushToast(
        event.alwaysOn
          ? "This group will stay masked until you explicitly unlock it."
          : "This group can now be adjusted per individual match again.",
        event.alwaysOn ? "Group locked on" : "Group unlocked",
        "info",
      );
    },
    [toggleGroupAlwaysOn, pushToast],
  );

  const handleToggleGroupEnabled = useCallback(
    (event: { enabled: boolean; groupId: MaskGroupId }) => {
      toggleGroupEnabled(event.groupId, event.enabled);
      pushToast(
        event.enabled
          ? "This group is active again in the protected output."
          : "This group is currently passing through original values.",
        event.enabled ? "Group enabled" : "Group disabled",
        "info",
      );
    },
    [toggleGroupEnabled, pushToast],
  );

  const handleToggleMatch = useCallback(
    (event: { enabled: boolean; matchId: string }) => {
      toggleMatch(event.matchId, event.enabled);
    },
    [toggleMatch],
  );

  const handleUpdateDetectionMode = useCallback(
    (mode: DetectionMode) => {
      setDetectionMode(mode);
      pushToast(
        mode === "global-only"
          ? "The detector is now limited to global identifiers and shared credential patterns."
          : "The detector is now combining the selected countries with shared global rules.",
        mode === "global-only"
          ? "Global-only mode enabled"
          : "Country rules enabled",
        "info",
      );
    },
    [setDetectionMode, pushToast],
  );

  const openHelp = useCallback(
    (topicId: HelpTopicId) => setActiveHelpTopic(HELP_TOPICS[topicId]),
    [],
  );

  // ── Render ──────────────────────────────────────────────────
  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: bgColor }]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <ProductHeader
          title="LLM Prompt Purifier"
          tagline="Client-side prompt protection"
        />

        <HeroSection
          body={copy.heroBody}
          noticeIconSvg={icons.privacy}
          noticeTitle={copy.clientsideTitle}
          noticeBody={copy.clientsideBody}
          onHelpRequested={() => openHelp("clientside")}
        />

        <WorkflowStrip
          snippets={WORKFLOW_SNIPPETS}
          stateResolver={snippetState}
          footerText={copy.heroTitle}
        />

        <ScannerToolbar
          countrySummary={countrySummary}
          scopeDescription={scopeDescription}
          settingsIconSvg={icons.settings}
          warning={copy.languageWarning}
          showWarning={
            mixedLanguage && vm.detectionMode !== "global-only"
          }
          onCountryModalRequested={() => setCountryModalOpen(true)}
          onSettingsModalRequested={() => setSettingsModalOpen(true)}
        />

        {/* Main translator area */}
        <View style={styles.translator}>
          <RawPromptPane
            title={copy.rawTitle}
            body={copy.rawBody}
            sourceText={vm.sourceText}
            onHelpRequested={() => openHelp("workflow")}
            onSourceTextChanged={updateSourceText}
          />

          <View style={styles.bridge}>
            <Text style={styles.bridgeText}>Raw version</Text>
            <Text style={styles.bridgeArrow}>⇄</Text>
            <Text style={styles.bridgeText}>Masked version</Text>
          </View>

          <MaskedOutputPane
            title={copy.outputTitle}
            body={copy.outputBody}
            maskedText={vm.maskedText}
            emptyPlaceholder={copy.emptyOutput}
            statusMessage={vm.statusMessage}
            detectionModeLabel={detectionModeLabel}
            statusTone={statusTone}
            copyIconSvg={icons.copy}
            refreshIconSvg={icons.refresh}
            isScanning={vm.isScanning}
            hasResult={vm.hasResult}
            canCopy={vm.canCopy}
            hasMatches={vm.matches.length > 0}
            hasSourceText={!!vm.sourceText}
            onHelpRequested={() => openHelp("coverage")}
            onCopyRequested={handleCopy}
            onRegenerateRequested={handleRegenerate}
            onClearRequested={handleClear}
          />
        </View>

        {/* Controls panel */}
        <View style={styles.section}>
          <ControlsPanel
            title={copy.controlsTitle}
            body={copy.controlsBody}
            groups={vm.groups}
            matches={vm.matches}
            onHelpRequested={() => openHelp("controls")}
            onGroupAlwaysOnToggled={handleToggleGroupAlwaysOn}
            onGroupEnabledToggled={handleToggleGroupEnabled}
            onMatchRegenerated={handleRegenerateMatch}
            onMatchToggled={handleToggleMatch}
          />
        </View>
      </ScrollView>

      {/* Modals */}
      <CountryScopeModal
        countryProfiles={vm.countryProfiles}
        isOpen={isCountryModalOpen}
        mixedLanguageWarning={mixedLanguage}
        selectedLanguageSummary={languageSummary}
        onClosed={() => setCountryModalOpen(false)}
        onCountryToggled={handleToggleCountryProfile}
        onHelpRequested={() => openHelp("country")}
      />

      <MaskingSettingsModal
        detectionMode={vm.detectionMode}
        isOpen={isSettingsModalOpen}
        onClosed={() => setSettingsModalOpen(false)}
        onDetectionModeChanged={handleUpdateDetectionMode}
        onHelpRequested={() => openHelp("controls")}
      />

      <HelpModal topic={activeHelpTopic} onClosed={() => setActiveHelpTopic(null)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  scroll: {
    gap: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  translator: {
    paddingHorizontal: spacing.md,
    gap: spacing.md,
  },
  bridge: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  bridgeText: {
    fontSize: 12,
    color: colors.light.textMuted,
  },
  bridgeArrow: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.primary,
  },
  section: {
    paddingHorizontal: spacing.md,
  },
});
