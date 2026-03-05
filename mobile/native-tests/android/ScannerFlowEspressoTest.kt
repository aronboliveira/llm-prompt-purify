package com.llmpromptpurify.mobile

import androidx.test.espresso.Espresso.onView
import androidx.test.espresso.action.ViewActions.*
import androidx.test.espresso.assertion.ViewAssertions.matches
import androidx.test.espresso.matcher.ViewMatchers.*
import androidx.test.ext.junit.rules.ActivityScenarioRule
import androidx.test.ext.junit.runners.AndroidJUnit4
import org.hamcrest.Matchers.not
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith

/**
 * Raw Espresso instrumented UI tests for the LLM Prompt Purify scanner.
 *
 * These run directly on the Android emulator/device through Gradle:
 *   cd android && ./gradlew connectedAndroidTest
 *
 * Pre-requisites:
 *   1. Run `npx expo prebuild` to generate the android/ directory
 *   2. Copy this file to:
 *      android/app/src/androidTest/java/com/llmpromptpurify/mobile/
 *   3. Ensure build.gradle includes:
 *      androidTestImplementation "androidx.test.espresso:espresso-core:3.5.1"
 *      androidTestImplementation "androidx.test.ext:junit:1.1.5"
 *      androidTestImplementation "androidx.test:runner:1.5.2"
 *      androidTestImplementation "androidx.test:rules:1.5.0"
 */
@RunWith(AndroidJUnit4::class)
class ScannerFlowEspressoTest {

    @get:Rule
    val activityRule = ActivityScenarioRule(MainActivity::class.java)

    // ── Test IDs (must match React Native testID props) ──────────
    // React Native's testID maps to `content-description` on Android.

    @Test
    fun appLaunches_sourceTextareaVisible() {
        onView(withContentDescription("source-textarea"))
            .check(matches(isDisplayed()))
    }

    @Test
    fun appLaunches_countryButtonVisible() {
        onView(withContentDescription("country-modal-button"))
            .check(matches(isDisplayed()))
    }

    @Test
    fun appLaunches_settingsButtonVisible() {
        onView(withContentDescription("settings-button"))
            .check(matches(isDisplayed()))
    }

    @Test
    fun typeEmail_maskedOutputAppears() {
        onView(withContentDescription("source-textarea"))
            .perform(clearText(), typeText("Email me at john@example.com"))

        // Wait for scan debounce
        Thread.sleep(3000)

        onView(withContentDescription("masked-output"))
            .check(matches(isDisplayed()))
    }

    @Test
    fun typeSsn_maskedOutputAppears() {
        onView(withContentDescription("source-textarea"))
            .perform(clearText(), typeText("SSN: 123-45-6789"))

        Thread.sleep(3000)

        onView(withContentDescription("masked-output"))
            .check(matches(isDisplayed()))
    }

    @Test
    fun typeApiKey_maskedOutputAppears() {
        onView(withContentDescription("source-textarea"))
            .perform(
                clearText(),
                typeText("key: sk-proj-ABCDEFghijklmnopqrstu")
            )

        Thread.sleep(3000)

        onView(withContentDescription("masked-output"))
            .check(matches(isDisplayed()))
    }

    @Test
    fun openCountryModal_toggleBrazil() {
        onView(withContentDescription("country-modal-button"))
            .perform(click())

        Thread.sleep(800)

        onView(withContentDescription("country-toggle-BR"))
            .check(matches(isDisplayed()))
            .perform(click())

        // Toggle back
        onView(withContentDescription("country-toggle-BR"))
            .perform(click())
    }

    @Test
    fun openSettingsModal_toggleGlobalOnly() {
        onView(withContentDescription("settings-button"))
            .perform(click())

        Thread.sleep(800)

        onView(withContentDescription("global-only-toggle"))
            .check(matches(isDisplayed()))
            .perform(click())

        // Toggle back
        onView(withContentDescription("global-only-toggle"))
            .perform(click())
    }

    @Test
    fun emptyInput_doesNotCrash() {
        onView(withContentDescription("source-textarea"))
            .perform(clearText())

        Thread.sleep(1000)

        onView(withContentDescription("source-textarea"))
            .check(matches(isDisplayed()))
    }

    @Test
    fun specialCharacters_doesNotCrash() {
        onView(withContentDescription("source-textarea"))
            .perform(
                clearText(),
                typeText("<!@#\$%^&*()_+{}|:<>?~`>")
            )

        Thread.sleep(2000)

        onView(withContentDescription("source-textarea"))
            .check(matches(isDisplayed()))
    }

    @Test
    fun rapidTextReplacement_appStaysResponsive() {
        val prompts = listOf(
            "a@b.com",
            "111-22-3333",
            "sk-proj-AAABBBCCC111222333444",
            "+44 20 1234 5678",
            "529.982.247-25"
        )

        for (prompt in prompts) {
            onView(withContentDescription("source-textarea"))
                .perform(clearText(), replaceText(prompt))
        }

        Thread.sleep(3000)

        onView(withContentDescription("source-textarea"))
            .check(matches(isDisplayed()))
    }
}
