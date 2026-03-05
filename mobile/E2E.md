# E2E Testing — Espresso (Android) & XCTest (iOS)

This directory contains end-to-end tests for the LLM Prompt Purify mobile app.

## Architecture

The E2E stack has **three layers**:

| Layer | Framework | Files | Runs on |
|-------|-----------|-------|---------|
| **Detox** (recommended) | Espresso ↔ XCTest under the hood | `e2e/*.e2e.ts` | Both platforms |
| **Raw Espresso** | Android Instrumented Tests | `native-tests/android/*.kt` | Android only |
| **Raw XCTest** | XCTest UI Tests | `native-tests/ios/*.swift` | iOS only (macOS) |

### Why Detox?

[Detox](https://wix.github.io/Detox/) by Wix is the standard E2E framework for React Native. It provides a TypeScript/JavaScript API that **internally delegates to**:
- **Espresso** on Android (Google's native UI testing framework)
- **Earl Grey 2 / XCTest** on iOS (Apple's native UI testing framework)

This means every Detox test is an Espresso test on Android and an XCTest on iOS — just written in a single cross-platform language.

### Why also raw native tests?

The `native-tests/` scaffolds provide:
- Accessibility validation (content descriptions on Android, accessibility identifiers on iOS)
- Direct native-level assertions when Detox abstraction isn't needed
- Templates for CI pipelines that run native test suites separately

## Prerequisites

```bash
# 1. Generate native projects (only needed once, or after plugin changes)
npm run prebuild          # runs `expo prebuild`

# 2. Android: Android SDK, emulator (AVD: Pixel_6_API_34)
# 3. iOS: Xcode 15+, iPhone 15 Pro simulator (macOS only)
```

## Running Detox Tests

```bash
# Android
npm run e2e:android       # build + test in one shot
npm run e2e:build:android # just build
npm run e2e:test:android  # just test (requires prior build)

# iOS (macOS only)
npm run e2e:ios
npm run e2e:build:ios
npm run e2e:test:ios
```

## Running Raw Native Tests

After `expo prebuild`:

```bash
# Espresso (Android)
cp native-tests/android/*.kt android/app/src/androidTest/java/com/llmpromptpurify/mobile/
npm run espresso
# or: cd android && ./gradlew connectedAndroidTest

# XCTest (iOS, macOS only)
cp native-tests/ios/*.swift ios/LLMPromptPurifyUITests/
npm run xctest
# or: xcodebuild test -workspace ios/*.xcworkspace -scheme LLMPromptPurify -destination 'platform=iOS Simulator,name=iPhone 15 Pro'
```

## Test Coverage

### Detox Specs (4 files, ~35 tests)

| Spec | Tests | Coverage |
|------|-------|----------|
| `app-launch.e2e.ts` | 5 | App boot, UI sections visible |
| `scan-workflow.e2e.ts` | 10 | Email/SSN/API key/JWT/phone/CPF masking, mixed PII, clean text, re-scan |
| `country-settings.e2e.ts` | 8 | Country modal open/close/toggle, settings modal, global-only mode |
| `match-controls.e2e.ts` | 7 | Group toggle/lock, per-match toggle, regenerate |
| `edge-cases.e2e.ts` | 7 | Empty/whitespace/special chars/unicode, long prompt, rapid replacement |

### Native Espresso (2 files, ~19 tests)

| File | Tests | Coverage |
|------|-------|----------|
| `ScannerFlowEspressoTest.kt` | 11 | Launch, scan e-mail/SSN/API-key, modals, edge cases |
| `AccessibilityEspressoTest.kt` | 8 | Content descriptions, focusable/clickable, group toggles |

### Native XCTest (2 files, ~22 tests)

| File | Tests | Coverage |
|------|-------|----------|
| `ScannerFlowXCTest.swift` | 14 | Launch, scan, modals, edge cases, match controls |
| `AccessibilityXCTest.swift` | 8 | Accessibility identifiers, enabled traits, modal a11y, group/match a11y |

## TestID Map

All selectors use React Native's `testID` prop, which maps to:
- **Android**: `contentDescription` (used by Espresso's `withContentDescription()`)
- **iOS**: `accessibilityIdentifier` (used by XCTest's element queries)

| testID | Element | Component |
|--------|---------|-----------|
| `source-textarea` | TextInput (raw prompt) | RawPromptPane |
| `masked-output` | Masked text display | MaskedOutputPane |
| `country-modal-button` | Countries button | ScannerToolbar |
| `settings-button` | Settings gear | ScannerToolbar |
| `global-only-toggle` | Detection mode Switch | MaskingSettingsModal |
| `country-toggle-{id}` | Per-country Switch | CountryScopeModal |
| `group-toggle-{id}` | Per-group enable Switch | MaskGroupPanel |
| `group-lock-{id}` | Per-group lock Switch | MaskGroupPanel |
| `toggle-{ruleId}` | Per-match enable Switch | MaskGroupPanel |
| `regenerate-{ruleId}` | Per-match regen button | MaskGroupPanel |

## CI Integration

### GitHub Actions (Android)

```yaml
- name: Detox E2E (Android)
  uses: reactivecircus/android-emulator-runner@v2
  with:
    api-level: 34
    target: google_apis
    arch: x86_64
    script: |
      cd mobile
      npm run e2e:build:android
      npm run e2e:test:android
```

### GitHub Actions (iOS)

```yaml
- name: Detox E2E (iOS)
  runs-on: macos-14
  steps:
    - run: |
        cd mobile
        npm run e2e:build:ios
        npm run e2e:test:ios
```
