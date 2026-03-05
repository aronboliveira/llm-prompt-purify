/** @type {import('detox').DetoxConfig} */
module.exports = {
  logger: {
    level: process.env.CI ? "debug" : "info",
  },

  testRunner: {
    args: {
      config: "e2e/jest.e2e.config.js",
      _: ["e2e"],
    },
    jest: {
      setupTimeout: 120_000,
    },
  },

  apps: {
    /* ── Android ─────────────────────────────────────────── */
    "android.debug": {
      type: "android.apk",
      binaryPath:
        "android/app/build/outputs/apk/debug/app-debug.apk",
      testBinaryPath:
        "android/app/build/outputs/apk/androidTest/debug/app-debug-androidTest.apk",
      build:
        "cd android && ./gradlew assembleDebug assembleAndroidTest -DtestBuildType=debug && cd ..",
    },
    "android.release": {
      type: "android.apk",
      binaryPath:
        "android/app/build/outputs/apk/release/app-release.apk",
      testBinaryPath:
        "android/app/build/outputs/apk/androidTest/release/app-release-androidTest.apk",
      build:
        "cd android && ./gradlew assembleRelease assembleAndroidTest -DtestBuildType=release && cd ..",
    },

    /* ── iOS ─────────────────────────────────────────────── */
    "ios.debug": {
      type: "ios.app",
      binaryPath:
        "ios/build/Build/Products/Debug-iphonesimulator/LLMPromptPurify.app",
      build: [
        "xcodebuild",
        "-workspace ios/LLMPromptPurify.xcworkspace",
        "-scheme LLMPromptPurify",
        "-configuration Debug",
        "-sdk iphonesimulator",
        "-derivedDataPath ios/build",
        "build",
      ].join(" "),
    },
    "ios.release": {
      type: "ios.app",
      binaryPath:
        "ios/build/Build/Products/Release-iphonesimulator/LLMPromptPurify.app",
      build: [
        "xcodebuild",
        "-workspace ios/LLMPromptPurify.xcworkspace",
        "-scheme LLMPromptPurify",
        "-configuration Release",
        "-sdk iphonesimulator",
        "-derivedDataPath ios/build",
        "build",
      ].join(" "),
    },
  },

  devices: {
    emulator: {
      type: "android.emulator",
      device: { avdName: "Pixel_6_API_34" },
    },
    simulator: {
      type: "ios.simulator",
      device: { type: "iPhone 15 Pro" },
    },
  },

  configurations: {
    /* Android */
    "android.emu.debug": {
      device: "emulator",
      app: "android.debug",
    },
    "android.emu.release": {
      device: "emulator",
      app: "android.release",
    },

    /* iOS */
    "ios.sim.debug": {
      device: "simulator",
      app: "ios.debug",
    },
    "ios.sim.release": {
      device: "simulator",
      app: "ios.release",
    },
  },
};
